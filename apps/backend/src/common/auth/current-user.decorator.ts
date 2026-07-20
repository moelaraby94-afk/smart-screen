import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PlatformStaffRole } from '@prisma/client';

export type JwtAudience = 'platform' | 'customer' | 'player';

export type JwtUser = {
  sub: string;
  email: string;
  aud: JwtAudience;
  isSuperAdmin?: boolean;
  platformStaffRole?: PlatformStaffRole;
  /** Present when a super admin is viewing as another user. */
  impersonatedBy?: string;
  sid?: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
    return request.user;
  },
);
