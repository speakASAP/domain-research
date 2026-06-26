import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { DomainNotification } from '../entities/domain-notification.entity';
import { DomainWatch } from '../entities/domain-watch.entity';
import { AvailabilityService } from './availability.service';
import { nextCheckDate } from './domain-watch.service';
import { NotificationClient } from '../../integrations/notification.client';

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
        const previousAvailability = watch.lastAvailability;
        const check = await this.availability.checkOne(watch.fqdn);
        watch.lastAvailability = check.availability;
        watch.lastExpiresAt = check.expiresAt || null;
        watch.lastCheckAt = new Date();
        watch.nextCheckAt = nextCheckDate(check.expiresAt || null);
        await this.watches.save(watch);
        if (check.availability === 'available' && previousAvailability !== 'available') {
          await this.notifications.save(
            this.notifications.create({
              watchId: watch.id,
              type: 'domain_available',
              recipientRef: watch.notificationEmail || watch.userId || null,
            }),
          );
          queuedNotifications += 1;
        }
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
}
