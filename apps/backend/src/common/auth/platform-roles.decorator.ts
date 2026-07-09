import { SetMetadata } from '@nestjs/common';
import { PlatformStaffRole } from '@prisma/client';

export const PLATFORM_ROLES_KEY = 'platformRoles';

/**
 * Grants a route to non-super-admin platform staff. {@link PlatformStaffDbGuard}
 * is fail-closed: a route with no `@PlatformRoles` is reachable by super admins
 * only, so forgetting this decorator locks a route down rather than opening it.
 *
 * `SUPER_ADMIN` never needs listing — it passes every route by definition.
 */
export const PlatformRoles = (...roles: PlatformStaffRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);
