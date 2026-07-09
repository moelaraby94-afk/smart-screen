import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlatformStaffRole } from '@prisma/client';
import { PlatformStaffDbGuard } from './platform-staff-db.guard';
import { PrismaService } from '../prisma/prisma.service';

function contextWithUser(sub: string | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: sub ? { sub } : undefined }),
    }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

type UserRow = {
  isActive: boolean;
  isSuperAdmin: boolean;
  platformStaffRole: PlatformStaffRole | null;
};

function guardFor(
  row: UserRow | null,
  routeRoles?: PlatformStaffRole[],
): PlatformStaffDbGuard {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(row) },
  } as unknown as PrismaService;

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(routeRoles),
  } as unknown as Reflector;

  return new PlatformStaffDbGuard(prisma, reflector);
}

describe('PlatformStaffDbGuard', () => {
  const superAdmin: UserRow = {
    isActive: true,
    isSuperAdmin: true,
    platformStaffRole: PlatformStaffRole.SUPER_ADMIN,
  };
  const support: UserRow = {
    isActive: true,
    isSuperAdmin: false,
    platformStaffRole: PlatformStaffRole.SUPPORT_SPECIALIST,
  };
  const billing: UserRow = {
    isActive: true,
    isSuperAdmin: false,
    platformStaffRole: PlatformStaffRole.BILLING_MANAGER,
  };

  it('allows an active super admin on a route that grants no roles', async () => {
    const guard = guardFor(superAdmin, undefined);
    await expect(guard.canActivate(contextWithUser('u1'))).resolves.toBe(true);
  });

  it('allows staff on a route that names their role', async () => {
    const guard = guardFor(support, [PlatformStaffRole.SUPPORT_SPECIALIST]);
    await expect(guard.canActivate(contextWithUser('u2'))).resolves.toBe(true);
  });

  /**
   * The regression this guard was rewritten for: staff used to reach *every*
   * admin route that had not been individually re-locked, which included the
   * cross-tenant audit log (`GET admin/logs`) and platform revenue stats.
   */
  it('is fail-closed: staff cannot reach a route that grants no roles', async () => {
    const guard = guardFor(support, undefined);
    await expect(guard.canActivate(contextWithUser('u3'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('does not let one staff role reach another role’s route', async () => {
    const guard = guardFor(billing, [PlatformStaffRole.SUPPORT_SPECIALIST]);
    await expect(guard.canActivate(contextWithUser('u4'))).rejects.toThrow(
      /does not grant access/,
    );
  });

  it('allows a role listed among several', async () => {
    const guard = guardFor(billing, [
      PlatformStaffRole.SUPPORT_SPECIALIST,
      PlatformStaffRole.BILLING_MANAGER,
    ]);
    await expect(guard.canActivate(contextWithUser('u5'))).resolves.toBe(true);
  });

  it('rejects a regular workspace user (no staff role)', async () => {
    const guard = guardFor(
      { isActive: true, isSuperAdmin: false, platformStaffRole: null },
      [PlatformStaffRole.SUPPORT_SPECIALIST],
    );
    await expect(guard.canActivate(contextWithUser('u6'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a deactivated staff member', async () => {
    const guard = guardFor({ ...billing, isActive: false }, [
      PlatformStaffRole.BILLING_MANAGER,
    ]);
    await expect(guard.canActivate(contextWithUser('u7'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects a deactivated super admin', async () => {
    const guard = guardFor({ ...superAdmin, isActive: false });
    await expect(guard.canActivate(contextWithUser('u8'))).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('rejects when there is no authenticated user', async () => {
    const guard = guardFor(null);
    await expect(guard.canActivate(contextWithUser(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
