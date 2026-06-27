import { DomainWatchService } from './domain-watch.service';

describe('DomainWatchService', () => {
  it('creates watches for the authenticated user and uses the registered email', async () => {
    const watches: any = {
      create: (input: any) => input,
      save: async (input: any) => ({ id: 'watch-1', ...input }),
    };
    const checks: any = { find: jest.fn() };
    const availability: any = {
      checkOne: jest.fn(async () => ({ fqdn: 'example.com', availability: 'registered', expiresAt: null })),
    };

    const result = await new DomainWatchService(watches, checks, availability).createWatch(
      { fqdn: 'example.com' },
      { id: 'auth-user-1', email: 'Owner@Example.COM ', roles: ['app:domain-research:user'] },
    );

    expect(result).toMatchObject({
      id: 'watch-1',
      fqdn: 'example.com',
      userId: 'auth-user-1',
      notificationEmail: 'owner@example.com',
      enabled: true,
      lastAvailability: 'registered',
    });
  });

  it('scopes list and update operations to the authenticated user id', async () => {
    const watches: any = {
      find: jest.fn(async () => []),
      findOneByOrFail: jest.fn(async () => ({ id: 'watch-1', userId: 'auth-user-1', enabled: true })),
      save: jest.fn(async (input: any) => input),
      remove: jest.fn(async (input: any) => input),
    };
    const service = new DomainWatchService(watches, {} as any, {} as any);

    await service.listWatches('auth-user-1');
    await service.updateWatch('watch-1', 'auth-user-1', { enabled: false });
    await service.deleteWatch('watch-1', 'auth-user-1');

    expect(watches.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'auth-user-1' } }));
    expect(watches.findOneByOrFail).toHaveBeenCalledWith({ id: 'watch-1', userId: 'auth-user-1' });
    expect(watches.save).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    expect(watches.remove).toHaveBeenCalledWith(expect.objectContaining({ id: 'watch-1', userId: 'auth-user-1' }));
  });

  it('keeps unknown expiry watches unscheduled until a manual next check is provided', async () => {
    const watch: any = {
      id: 'watch-1',
      userId: 'auth-user-1',
      enabled: true,
      lastAvailability: 'registered',
      lastExpiresAt: null,
      lastRegistryStatuses: [],
      lifecycleStage: 'unknown',
      dropCandidateAt: null,
      nextCheckAt: null,
    };
    const watches: any = {
      findOneByOrFail: jest.fn(async () => watch),
      save: jest.fn(async (input: any) => input),
    };
    const service = new DomainWatchService(watches, {} as any, {} as any);

    await service.updateWatch('watch-1', 'auth-user-1', { dropTrackingConsent: 'accepted' });

    expect(watches.save).toHaveBeenLastCalledWith(expect.objectContaining({
      enabled: true,
      nextCheckAt: null,
    }));

    await service.updateWatch('watch-1', 'auth-user-1', { manualNextCheckAt: '2026-07-01T09:30:00.000Z' });

    expect(watches.save).toHaveBeenLastCalledWith(expect.objectContaining({
      enabled: true,
      nextCheckAt: new Date('2026-07-01T09:30:00.000Z'),
    }));
  });

  it('replans lifecycle after a manual expiry date is saved', async () => {
    const watches: any = {
      findOneByOrFail: jest.fn(async () => ({
        id: 'watch-1',
        userId: 'auth-user-1',
        enabled: true,
        lastAvailability: 'registered',
        lastExpiresAt: null,
        lastRegistryStatuses: [],
        lifecycleStage: 'unknown',
        dropCandidateAt: null,
        nextCheckAt: null,
      })),
      save: jest.fn(async (input: any) => input),
    };
    const service = new DomainWatchService(watches, {} as any, {} as any);

    await service.updateWatch('watch-1', 'auth-user-1', { manualExpiresAt: '2026-08-10T10:00:00.000Z' });

    expect(watches.save).toHaveBeenCalledWith(expect.objectContaining({
      lastExpiresAt: new Date('2026-08-10T10:00:00.000Z'),
      lifecycleStage: 'active',
      dropCandidateAt: new Date('2026-10-14T10:00:00.000Z'),
      nextCheckAt: new Date('2026-07-11T10:00:00.000Z'),
    }));
  });

  it('rechecks all watches for the authenticated user and refreshes availability state', async () => {
    const existingWatch: any = {
      id: 'watch-1',
      userId: 'auth-user-1',
      fqdn: 'example.com',
      lastAvailability: 'registered',
      lastExpiresAt: null,
      lastRegistryStatuses: [],
      lifecycleStage: 'active',
      dropCandidateAt: null,
      lastCheckAt: null,
      nextCheckAt: null,
    };
    const watches: any = {
      find: jest.fn(async () => [existingWatch]),
      save: jest.fn(async (input: any) => input),
    };
    const availability: any = {
      checkOne: jest.fn(async () => ({
        fqdn: 'example.com',
        availability: 'available',
        expiresAt: null,
        registryStatuses: [],
      })),
    };
    const service = new DomainWatchService(watches, {} as any, availability);

    const result = await service.recheckWatches('auth-user-1');

    expect(watches.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'auth-user-1' } }));
    expect(availability.checkOne).toHaveBeenCalledWith('example.com');
    expect(watches.save).toHaveBeenCalledWith(expect.objectContaining({
      lastAvailability: 'available',
      lifecycleStage: 'available',
    }));
    expect(result).toMatchObject({
      checked: 1,
      failed: 0,
      watches: [expect.objectContaining({ lastAvailability: 'available' })],
    });
  });
});
