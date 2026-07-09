import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformStaffRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PLATFORM_ROLES_KEY } from './platform-roles.decorator';
import type { JwtUser } from './current-user.decorator';

/**
 * Entry guard for the admin area, applied at the controller level.
 *
 * Fail-closed by design: being platform staff is necessary but not sufficient.
 * A super admin passes everything; any other staff role passes only the routes
 * that name it via `@PlatformRoles(...)`. A route that names nobody is
 * super-admin-only, so adding a route without thinking about roles cannot
 * accidentally expose it — the previous version admitted *any* staff role to
 * *every* route that had not been individually re-locked, which handed a
 * billing manager the cross-tenant audit log.
 *
 * Individually destructive routes additionally stack {@link SuperAdminDbGuard},
 * which re-checks `isSuperAdmin` against the database.
 */
@Injectable()
export class PlatformStaffDbGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: JwtUser }>();
    const sub = request.user?.sub;
    if (!sub) {
      throw new ForbiddenException('Platform staff only');
    }

    const row = await this.prisma.user.findUnique({
      where: { id: sub },
      select: { isActive: true, isSuperAdmin: true, platformStaffRole: true },
    });
    if (!row?.isActive) {
      throw new ForbiddenException('Platform staff only');
    }

    const effectiveRole: PlatformStaffRole | null = row.isSuperAdmin
      ? PlatformStaffRole.SUPER_ADMIN
      : row.platformStaffRole;
    if (!effectiveRole) {
      throw new ForbiddenException('Platform staff only');
    }
    if (effectiveRole === PlatformStaffRole.SUPER_ADMIN) {
      return true;
    }

    const allowedRoles =
      this.reflector.getAllAndOverride<PlatformStaffRole[] | undefined>(
        PLATFORM_ROLES_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (!allowedRoles.includes(effectiveRole)) {
      throw new ForbiddenException(
        'Your platform role does not grant access to this resource',
      );
    }
    return true;
  }
}
