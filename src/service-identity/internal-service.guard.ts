import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class InternalServiceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string | undefined> }>();
    const header = request.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : request.headers['x-internal-service-token'];
    const secret = process.env.JWT_SECRET;
    if (!token || !secret) throw new UnauthorizedException('Missing internal service token');
    try {
      jwt.verify(token, secret);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid internal service token');
    }
  }
}
