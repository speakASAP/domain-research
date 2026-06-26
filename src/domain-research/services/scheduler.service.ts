import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { DomainNotification, DomainNotificationType } from '../entities/domain-notification.entity';
import { DomainWatch } from '../entities/domain-watch.entity';
import { AvailabilityService } from './availability.service';
import { dropDedupeKey, notificationWindowReached, planDomainLifecycle } from './domain-lifecycle';
import { NotificationClient } from '../../integrations/notification.client';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(DomainWatch) private readonly watches: Repository<DomainWatch>,
    @InjectRepository(DomainNotification) private readonly notifications: Repository<DomainNotification>,
    private readonly availability: AvailabilityService,
    private readonly notificationClient: NotificationClient,
  ) {}

  async runDueExpiryChecks(limit: number): Promise<{ checked: number; queuedNotifications: number; failed: number }> {
    const due = await this.watches.find({
      where: { enabled: true, nextCheckAt: LessThanOrEqual(new Date()) },
      order: { nextCheckAt: 'ASC' },
      take: Math.min(Math.max(limit, 1), 250),
    });
    let queuedNotifications = 0;
    let failed = 0;
    for (const watch of due) {
      try {
        queuedNotifications += await this.recheckWatch(watch);
      } catch {
        failed += 1;
      }
    }
    return { checked: due.length, queuedNotifications, failed };
  }

  async runDueNotifications(limit: number): Promise<{ sent: number; failed: number }> {
    const pending = await this.notifications.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: Math.min(Math.max(limit, 1), 250),
    });
    let sent = 0;
    let failed = 0;
    for (const notification of pending) {
      try {
        await this.notificationClient.sendDomainNotification(notification);
        notification.status = 'sent';
        sent += 1;
      } catch (error) {
        notification.status = 'failed';
        notification.error = error instanceof Error ? error.message : String(error);
        failed += 1;
      }
      await this.notifications.save(notification);
    }
    return { sent, failed };
  }

  private async recheckWatch(watch: DomainWatch): Promise<number> {
    const now = new Date();
    const previousAvailability = watch.lastAvailability;
    const previousExpiresAt = watch.lastExpiresAt || null;
    const check = await this.availability.checkOne(watch.fqdn);
    const plan = planDomainLifecycle(
      { availability: check.availability, expiresAt: check.expiresAt || null, registryStatuses: check.registryStatuses || [] },
      now,
      watch.dropCandidateAt || null,
    );

    watch.lastAvailability = check.availability;
    watch.lastExpiresAt = check.expiresAt || null;
    watch.lastRegistryStatuses = check.registryStatuses || [];
    watch.lifecycleStage = plan.stage;
    watch.dropCandidateAt = plan.dropCandidateAt;
    watch.lastCheckAt = now;
    watch.nextCheckAt = plan.nextCheckAt;
    await this.watches.save(watch);

    let queued = 0;
    if (check.availability === 'available') {
      queued += await this.queueOnce(watch, 'domain_available', dropDedupeKey('domain_available', now), {
        fqdn: watch.fqdn,
        checkedAt: now.toISOString(),
      });
      return queued;
    }

    if (wasRenewed(previousAvailability, previousExpiresAt, check.expiresAt || null, now)) {
      queued += await this.queueOnce(watch, 'domain_renewed', dropDedupeKey('domain_renewed', check.expiresAt || now), {
        fqdn: watch.fqdn,
        expiresAt: check.expiresAt?.toISOString() || null,
      });
    }

    if (watch.dropTrackingConsent !== 'declined') {
      queued += await this.queueDropWindowNotifications(watch, now);
    }
    return queued;
  }

  private async queueDropWindowNotifications(watch: DomainWatch, now: Date): Promise<number> {
    let queued = 0;
    const dropAt = watch.dropCandidateAt || null;
    if (notificationWindowReached(dropAt, now, 7 * DAY_MS)) {
      queued += await this.queueOnce(watch, 'drop_tracking_prompt', dropDedupeKey('drop_tracking_prompt', dropAt), dropPayload(watch, '7d'));
    }
    if (notificationWindowReached(dropAt, now, DAY_MS)) {
      queued += await this.queueOnce(watch, 'drop_24h_warning', dropDedupeKey('drop_24h_warning', dropAt), dropPayload(watch, '24h'));
    }
    if (notificationWindowReached(dropAt, now, HOUR_MS)) {
      queued += await this.queueOnce(watch, 'drop_1h_warning', dropDedupeKey('drop_1h_warning', dropAt), dropPayload(watch, '1h'));
    }
    return queued;
  }

  private async queueOnce(watch: DomainWatch, type: DomainNotificationType, dedupeKey: string, payload: Record<string, unknown>): Promise<number> {
    const existing = await this.notifications.findOne({ where: { watchId: watch.id, type, dedupeKey } });
    if (existing) return 0;
    await this.notifications.save(
      this.notifications.create({
        watchId: watch.id,
        type,
        dedupeKey,
        recipientRef: watch.notificationEmail || watch.userId || null,
        payload,
      }),
    );
    return 1;
  }
}

function wasRenewed(
  previousAvailability: string,
  previousExpiresAt: Date | null,
  nextExpiresAt: Date | null,
  now: Date,
): boolean {
  if (!nextExpiresAt || previousAvailability === 'available') return false;
  if (!previousExpiresAt) return false;
  return nextExpiresAt.getTime() > Math.max(previousExpiresAt.getTime(), now.getTime()) + DAY_MS;
}

function dropPayload(watch: DomainWatch, window: '7d' | '24h' | '1h'): Record<string, unknown> {
  return {
    fqdn: watch.fqdn,
    window,
    dropCandidateAt: watch.dropCandidateAt?.toISOString() || null,
    lifecycleStage: watch.lifecycleStage,
    registryStatuses: watch.lastRegistryStatuses || [],
    consent: watch.dropTrackingConsent,
  };
}
