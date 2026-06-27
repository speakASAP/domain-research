import { planDomainLifecycle } from './domain-lifecycle';

describe('planDomainLifecycle', () => {
  const now = new Date('2026-06-26T12:00:00.000Z');

  it('schedules a known registered domain before the one-month expiry window', () => {
    const plan = planDomainLifecycle({
      availability: 'registered',
      expiresAt: new Date('2026-08-10T10:00:00.000Z'),
      registryStatuses: [],
    }, now);

    expect(plan.stage).toBe('active');
    expect(plan.nextCheckAt?.toISOString()).toBe('2026-07-11T10:00:00.000Z');
    expect(plan.dropCandidateAt?.toISOString()).toBe('2026-10-14T10:00:00.000Z');
  });

  it('tracks hourly during the final day before estimated drop', () => {
    const dropAt = new Date('2026-06-27T08:00:00.000Z');
    const plan = planDomainLifecycle({
      availability: 'registered',
      expiresAt: new Date('2026-04-23T08:00:00.000Z'),
      registryStatuses: [],
    }, now, dropAt);

    expect(plan.stage).toBe('drop_imminent');
    expect(plan.nextCheckAt?.toISOString()).toBe('2026-06-26T13:00:00.000Z');
  });

  it('uses registry redemption status when RDAP exposes lifecycle evidence', () => {
    const plan = planDomainLifecycle({
      availability: 'registered',
      expiresAt: null,
      registryStatuses: ['redemptionPeriod'],
    }, now);

    expect(plan.stage).toBe('redemption');
    expect(plan.dropCandidateAt?.toISOString()).toBe('2026-07-31T12:00:00.000Z');
  });

  it('does not schedule automated checks when expiry and lifecycle evidence are unknown', () => {
    const plan = planDomainLifecycle({
      availability: 'registered',
      expiresAt: null,
      registryStatuses: [],
    }, now);

    expect(plan.stage).toBe('unknown');
    expect(plan.dropCandidateAt).toBeNull();
    expect(plan.nextCheckAt).toBeNull();
  });
});
