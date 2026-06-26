import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, AuthenticatedUser } from './auth.types';

export const CurrentAuthUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().user;
});
