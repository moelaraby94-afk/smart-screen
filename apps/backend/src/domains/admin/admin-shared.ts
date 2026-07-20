import {
  PlatformStaffRole,
  UserRole,
  UserSubscriptionStatus,
} from '@prisma/client';

const IDLE_LOGIN_DAYS = 90;

export const ADMIN_LIST_CAP = 1000;

export type CustomerLifecycleStatus =
  | 'active'
  | 'expired'
  | 'suspended'
  | 'trial';

export function computeCustomerLifecycle(
  u: {
    isActive: boolean;
    subscriptionStatus: UserSubscriptionStatus;
    subscriptionEndDate: Date | null;
  },
  now = new Date(),
): CustomerLifecycleStatus {
  if (!u.isActive) return 'suspended';
  if (u.subscriptionEndDate && u.subscriptionEndDate < now) return 'expired';
  if (u.subscriptionStatus === UserSubscriptionStatus.EXPIRED) return 'expired';
  if (u.subscriptionStatus === UserSubscriptionStatus.TRIAL) return 'trial';
  return 'active';
}

export function isIdleAccount(
  lastLoginAt: Date | null,
  now = new Date(),
): boolean {
  if (!lastLoginAt) return true;
  const ms = IDLE_LOGIN_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - lastLoginAt.getTime() > ms;
}

export function isExpiredOrIdleTab(
  lifecycle: CustomerLifecycleStatus,
  idle: boolean,
): boolean {
  return lifecycle === 'expired' || idle;
}

export function platformRoleLabel(
  isSuperAdmin: boolean,
  platformStaffRole: PlatformStaffRole | null,
  memberships: { role: UserRole }[],
): 'SUPER_ADMIN' | 'SUPPORT_SPECIALIST' | 'BILLING_MANAGER' | 'ADMIN' | 'USER' {
  if (isSuperAdmin) return 'SUPER_ADMIN';
  if (platformStaffRole === PlatformStaffRole.SUPPORT_SPECIALIST)
    return 'SUPPORT_SPECIALIST';
  if (platformStaffRole === PlatformStaffRole.BILLING_MANAGER)
    return 'BILLING_MANAGER';
  const elevated = memberships.some(
    (m) => m.role === UserRole.ADMIN || m.role === UserRole.OWNER,
  );
  if (elevated) return 'ADMIN';
  return 'USER';
}
