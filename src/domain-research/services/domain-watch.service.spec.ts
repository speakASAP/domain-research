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
    };
    const service = new DomainWatchService(watches, {} as any, {} as any);

    await service.listWatches('auth-user-1');
    await service.updateWatch('watch-1', 'auth-user-1', { enabled: false });

    expect(watches.find).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'auth-user-1' } }));
    expect(watches.findOneByOrFail).toHaveBeenCalledWith({ id: 'watch-1', userId: 'auth-user-1' });
    expect(watches.save).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
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
