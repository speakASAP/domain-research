import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthUserGuard } from './auth-user.guard';

describe('AuthUserGuard', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, AUTH_SERVICE_URL: 'http://auth-service' };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('rejects requests without a bearer token', async () => {
    const request = { headers: {} };

    await expect(new AuthUserGuard().canActivate(contextFor(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates bearer tokens through Auth and attaches the registered user', async () => {
    const request = { headers: { authorization: 'Bearer user-token' } } as any;
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        valid: true,
        user: {
          id: 'auth-user-1',
          email: 'owner@example.com',
          roles: ['app:domain-research:user'],
        },
      }),
    })) as jest.Mock;

    await expect(new AuthUserGuard().canActivate(contextFor(request))).resolves.toBe(true);

    expect(global.fetch).toHaveBeenCalledWith('http://auth-service/auth/validate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ token: 'user-token' }),
    }));
    expect(request.user).toEqual({
      id: 'auth-user-1',
      email: 'owner@example.com',
      roles: ['app:domain-research:user'],
    });
  });

  it('fails closed when Auth rejects the token', async () => {
    const request = { headers: { authorization: 'Bearer invalid-token' } };
    global.fetch = jest.fn(async () => ({ ok: false, json: async () => ({}) })) as jest.Mock;

    await expect(new AuthUserGuard().canActivate(contextFor(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

function contextFor(request: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as ExecutionContext;
}
