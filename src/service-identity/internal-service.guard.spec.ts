import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InternalServiceGuard } from './internal-service.guard';

describe('InternalServiceGuard', () => {
  const originalFetch = globalThis.fetch;
  let guard: InternalServiceGuard;

  function mockContext(headers: Record<string, string>) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    } as any;
  }

  beforeEach(() => {
    process.env.AUTH_SERVICE_URL = 'http://auth-service';
    guard = new InternalServiceGuard();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('allows a Bearer principal holding internal:domain-research:jobs', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        valid: true,
        user: { id: 'svc-1', roles: ['internal:domain-research:jobs'] },
      }),
    })) as never;

    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer rs256-token' })),
    ).resolves.toBe(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'http://auth-service/auth/validate',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ token: 'rs256-token' }) }),
    );
  });

  it('rejects missing Authorization Bearer', async () => {
    await expect(
      guard.canActivate(mockContext({ 'x-internal-service-token': 'static' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('never accepts HS256/static JWT_SECRET-shaped tokens without Auth validate', async () => {
    globalThis.fetch = jest.fn(async () => ({ ok: false })) as never;

    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer hs256-minted-locally' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects a valid principal that lacks a domain-research internal role', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        valid: true,
        user: { id: 'svc-1', roles: ['app:domain-research:user'] },
      }),
    })) as never;

    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer rs256-token' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects service/admin bag roles on job routes (jobs only)', async () => {
    globalThis.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        valid: true,
        user: {
          id: 'svc-1',
          roles: ['internal:domain-research:service', 'internal:domain-research:admin'],
        },
      }),
    })) as never;

    await expect(
      guard.canActivate(mockContext({ authorization: 'Bearer rs256-token' })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
