import { DomainLifecycleStage } from '../entities/domain-watch.entity';

export type DomainLifecycleInput = {
  availability: 'available' | 'registered' | 'unknown';
  expiresAt?: Date | null;
  registryStatuses?: string[] | null;
};

export type DomainLifecyclePlan = {
  stage: DomainLifecycleStage;
  dropCandidateAt: Date | null;
  nextCheckAt: Date | null;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function planDomainLifecycle(input: DomainLifecycleInput, now = new Date(), existingDropCandidateAt?: Date | null): DomainLifecyclePlan {
  if (input.availability === 'available') {
    return { stage: 'available', dropCandidateAt: existingDropCandidateAt || null, nextCheckAt: null };
  }

  const statuses = normalizeStatuses(input.registryStatuses || []);
  if (hasStatus(statuses, 'pendingdelete', 'pending-delete')) {
    const dropCandidateAt = futureOrEstimate(existingDropCandidateAt, now, configDays('DOMAIN_PENDING_DELETE_DAYS', 5));
    return { stage: 'pending_delete', dropCandidateAt, nextCheckAt: nextDropCheck(dropCandidateAt, now) };
  }

  if (hasStatus(statuses, 'redemptionperiod', 'redemption-period')) {
    const dropCandidateAt = futureOrEstimate(
      existingDropCandidateAt,
      now,
      configDays('DOMAIN_REDEMPTION_GRACE_DAYS', 30) + configDays('DOMAIN_PENDING_DELETE_DAYS', 5),
    );
    return { stage: 'redemption', dropCandidateAt, nextCheckAt: nextDropCheck(dropCandidateAt, now) };
  }

  const expiresAt = normalizeDate(input.expiresAt || null);
  if (!expiresAt) {
    return { stage: 'unknown', dropCandidateAt: existingDropCandidateAt || null, nextCheckAt: null };
  }

  const dropCandidateAt = existingDropCandidateAt && existingDropCandidateAt.getTime() > now.getTime()
    ? existingDropCandidateAt
    : new Date(expiresAt.getTime() + (
      configDays('DOMAIN_POST_EXPIRATION_RENEWAL_DAYS', 30) +
      configDays('DOMAIN_REDEMPTION_GRACE_DAYS', 30) +
      configDays('DOMAIN_PENDING_DELETE_DAYS', 5)
    ) * DAY_MS);

  if (now.getTime() < expiresAt.getTime()) {
    return { stage: 'active', dropCandidateAt, nextCheckAt: nextPreExpiryCheck(expiresAt, now) };
  }

  const stage = dropCandidateAt.getTime() - now.getTime() <= DAY_MS ? 'drop_imminent' : 'expired';
  return { stage, dropCandidateAt, nextCheckAt: nextDropCheck(dropCandidateAt, now) };
}

export function notificationWindowReached(dropCandidateAt: Date | null | undefined, now: Date, beforeMs: number): boolean {
  return Boolean(dropCandidateAt && now.getTime() >= dropCandidateAt.getTime() - beforeMs);
}

export function dropDedupeKey(type: string, dropCandidateAt: Date | null | undefined): string {
  return `${type}:${dropCandidateAt ? dropCandidateAt.toISOString() : 'unknown'}`;
}

function nextPreExpiryCheck(expiresAt: Date, now: Date): Date {
  const monthBefore = new Date(expiresAt.getTime() - 30 * DAY_MS);
  const weekBefore = new Date(expiresAt.getTime() - 7 * DAY_MS);
  if (now.getTime() < monthBefore.getTime()) return monthBefore;
  if (now.getTime() < weekBefore.getTime()) return weekBefore;
  return expiresAt;
}

function nextDropCheck(dropCandidateAt: Date, now: Date): Date {
  const untilDrop = dropCandidateAt.getTime() - now.getTime();
  if (untilDrop <= 0) return new Date(now.getTime() + 5 * MINUTE_MS);
  if (untilDrop <= DAY_MS) return new Date(Math.min(now.getTime() + HOUR_MS, dropCandidateAt.getTime()));
  if (untilDrop <= 7 * DAY_MS) return new Date(Math.min(now.getTime() + 12 * HOUR_MS, dropCandidateAt.getTime() - DAY_MS));
  return new Date(Math.min(now.getTime() + DAY_MS, dropCandidateAt.getTime() - 7 * DAY_MS));
}

function futureOrEstimate(existing: Date | null | undefined, now: Date, daysFromNow: number): Date {
  return existing && existing.getTime() > now.getTime() ? existing : new Date(now.getTime() + daysFromNow * DAY_MS);
}

function normalizeDate(value: Date | null): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeStatuses(statuses: string[]): string[] {
  return statuses.map((status) => status.toLowerCase().replace(/[ _]+/g, '-').trim());
}

function hasStatus(statuses: string[], ...needles: string[]): boolean {
  return statuses.some((status) => needles.includes(status));
}

function configDays(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}
