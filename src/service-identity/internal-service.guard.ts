import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

const SERVICE_ROLES: ReadonlySet<string> = new Set([
  'internal:domain-research:service',
  'internal:domain-research:jobs',
  'internal:domain-research:admin',
]);

type AuthValidateResponse = {
  valid?: boolean;
  user?: { id?: string; roles?: unknown };
  roles?: unknown;
};

/**
 * Auth RS256 gate for domain-research internal routes.
 * Per SERVICE_IDENTITY_CONSUMER_STANDARD.md — no HS256 / JWT_SECRET self-verify.
 * Static x-internal-service-token acceptance is deleted.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly authServiceUrl = (
    process.env.AUTH_SERVICE_URL || 'http://auth-microservice:3370'
  ).replace(/\/+$/, '');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      user?: unknown;
    }>();
    const header = request.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }
    const token = header.slice(7).trim();
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const roles = await this.validateRoles(token);
    if (!roles.some((r) => SERVICE_ROLES.has(r))) {
      throw new ForbiddenException('Principal lacks required domain-research role');
    }
    request.user = { roles };
    return true;
  }

  private async validateRoles(token: string): Promise<string[]> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`${this.authServiceUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new UnauthorizedException('Invalid token');
      }
      const body = (await response.json()) as AuthValidateResponse;
      if (!body.valid) {
        throw new UnauthorizedException('Invalid token');
      }
      const roles = Array.isArray(body.user?.roles)
        ? body.user!.roles
        : Array.isArray(body.roles)
          ? body.roles
          : [];
      return roles.filter((r): r is string => typeof r === 'string');
    } catch (err) {
      if (err instanceof UnauthorizedException || err instanceof ForbiddenException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid token');
    } finally {
      clearTimeout(timer);
    }
  }
}
