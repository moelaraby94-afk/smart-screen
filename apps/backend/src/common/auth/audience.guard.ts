import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { JwtAudience, JwtUser } from './current-user.decorator';

export const AUDIENCE_KEY = 'requiredAudience';
export const RequireAudience = (...audiences: JwtAudience[]) =>
  SetMetadata(AUDIENCE_KEY, audiences);

@Injectable()
export class AudienceGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAudiences = this.reflector.getAllAndOverride<JwtAudience[]>(
      AUDIENCE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAudiences || requiredAudiences.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!requiredAudiences.includes(user.aud)) {
      throw new ForbiddenException(
        `This endpoint requires audience: ${requiredAudiences.join(' or ')}. ` +
          `Your token audience is: ${user.aud}`,
      );
    }

    return true;
  }
}
