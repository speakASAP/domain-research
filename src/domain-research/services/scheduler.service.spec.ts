import { SchedulerService } from './scheduler.service';

describe('SchedulerService', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('queues the one-week drop tracking prompt once', async () => {
    const watch = baseWatch({ dropCandidateAt: new Date('2026-07-02T12:00:00.000Z') });
    const savedNotifications: any[] = [];
    const service = new SchedulerService(
      repo({ find: jest.fn(async () => [watch]), save: jest.fn(async (input) => input) }),
      repo({ findOne: jest.fn(async () => null), create: (input: any) => input, save: jest.fn(async (input: any) => savedNotifications.push(input)) }),
      { checkOne: jest.fn(async () => ({ fqdn: 'example.com', availability: 'registered', expiresAt: new Date('2026-04-28T12:00:00.000Z'), registryStatuses: [] })) } as any,
      {} as any,
    );

    const result = await service.runDueExpiryChecks(10);

    expect(result).toEqual({ checked: 1, queuedNotifications: 1, failed: 0 });
    expect(savedNotifications[0]).toMatchObject({ type: 'drop_tracking_prompt', watchId: 'watch-1' });
    expect(watch.nextCheckAt?.toISOString()).toBe('2026-06-27T00:00:00.000Z');
  });

  it('queues domain_available only after the scheduled provider check returns available', async () => {
    const watch = baseWatch({ lastAvailability: 'registered', dropCandidateAt: new Date('2026-06-26T12:00:00.000Z') });
    const savedNotifications: any[] = [];
    const service = new SchedulerService(
      repo({ find: jest.fn(async () => [watch]), save: jest.fn(async (input) => input) }),
      repo({ findOne: jest.fn(async () => null), create: (input: any) => input, save: jest.fn(async (input: any) => savedNotifications.push(input)) }),
      { checkOne: jest.fn(async () => ({ fqdn: 'example.com', availability: 'available', expiresAt: null, registryStatuses: [] })) } as any,
      {} as any,
    );

    const result = await service.runDueExpiryChecks(10);

    expect(result).toEqual({ checked: 1, queuedNotifications: 1, failed: 0 });
    expect(savedNotifications[0]).toMatchObject({ type: 'domain_available', watchId: 'watch-1' });
    expect(watch.lifecycleStage).toBe('available');
    expect(watch.nextCheckAt).toBeNull();
  });
});

function baseWatch(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'watch-1',
    fqdn: 'example.com',
    userId: 'auth-user-1',
    notificationEmail: 'owner@example.com',
    enabled: true,
    dropTrackingConsent: 'pending',
    lifecycleStage: 'expired',
    dropCandidateAt: null,
    lastRegistryStatuses: [],
    nextCheckAt: new Date('2026-06-26T11:00:00.000Z'),
    lastCheckAt: null,
    lastAvailability: 'registered',
    lastExpiresAt: new Date('2026-04-28T12:00:00.000Z'),
    ...overrides,
  };
}

function repo(methods: Record<string, unknown>): any {
  return methods;
}
