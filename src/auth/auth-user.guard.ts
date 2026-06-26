import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedUser } from './auth.types';

type AuthValidateResponse = {
  valid?: boolean;
  userId?: unknown;
  email?: unknown;
  roles?: unknown;
  user?: {
    id?: unknown;
    sub?: unknown;
    email?: unknown;
    roles?: unknown;
  };
};

@Injectable()
export class AuthUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | string[] | undefined>; user?: AuthenticatedUser }>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    request.user = await this.validateToken(token);
    return true;
  }

  private async validateToken(token: string): Promise<AuthenticatedUser> {
    const authServiceUrl = (process.env.AUTH_SERVICE_URL || 'http://auth-microservice:3370').replace(/\/$/, '');

    try {
      const response = await fetch(`${authServiceUrl}/auth/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        throw new UnauthorizedException('Invalid bearer token');
      }

      const data = (await response.json()) as AuthValidateResponse;
      if (!data.valid || !data.user) {
        throw new UnauthorizedException('Invalid bearer token');
      }

      const id = asString(data.user.id) || asString(data.userId) || asString(data.user.sub);
      const email = asString(data.user.email) || asString(data.email);

      if (!id) {
        throw new UnauthorizedException('Authenticated user id required');
      }
      if (!email) {
        throw new UnauthorizedException('Authenticated user email required');
      }

      return {
        id,
        email,
        roles: toStringArray(data.user.roles ?? data.roles),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Auth validation unavailable');
    }
  }
}

function extractBearerToken(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string' || !value.startsWith('Bearer ')) {
    return '';
  }
  return value.slice('Bearer '.length).trim();
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
