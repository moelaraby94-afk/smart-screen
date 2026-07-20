import { ForbiddenException } from '@nestjs/common';
import type { JwtAudience } from '../../common/auth/current-user.decorator';
import { PlatformStaffRole } from '@prisma/client';

export type TokenPayload = {
  sub: string;
  email: string;
  aud?: JwtAudience;
  impersonatedBy?: string;
  typ?: 'access' | 'refresh';
  sid?: string;
  platformStaffRole?: PlatformStaffRole;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  audience?: JwtAudience;
};

export type LoginResult =
  | {
      requiresTwoFactor: true;
      email: string;
    }
  | {
      user: {
        id: string;
        email: string;
        fullName: string;
        locale: string;
        audience: JwtAudience;
        isSuperAdmin: boolean;
        platformStaffRole: string | null;
        emailVerified: boolean;
      };
      workspaces: Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
      }>;
      accessToken: string;
      refreshToken: string;
      sessionId: string;
    };

export function resolveAudience(user: {
  isSuperAdmin: boolean;
  platformStaffRole: PlatformStaffRole | null;
}): JwtAudience {
  if (user.isSuperAdmin || user.platformStaffRole) {
    return 'platform';
  }
  return 'customer';
}

export function validateAudience(
  requested: 'platform' | 'customer',
  isSuperAdmin: boolean,
  platformStaffRole: PlatformStaffRole | null,
): JwtAudience {
  if (requested === 'platform') {
    if (!isSuperAdmin && !platformStaffRole) {
      throw new ForbiddenException('You do not have platform staff privileges');
    }
    return 'platform';
  }
  return 'customer';
}
