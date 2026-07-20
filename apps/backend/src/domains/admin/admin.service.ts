import { Injectable } from '@nestjs/common';
import { UserSubscriptionStatus } from '@prisma/client';
import { PlatformTenantService } from './platform-tenant.service';
import { PlatformStaffService } from './platform-staff.service';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PlatformSecurityService } from './platform-security.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import type { MockPlan } from '../subscriptions/dto/set-mock-plan.dto';

/**
 * Facade that delegates to the 5 platform sub-services.
 * Kept for backward compatibility — controllers should inject
 * sub-services directly where possible.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly tenant: PlatformTenantService,
    private readonly staff: PlatformStaffService,
    private readonly settings: PlatformSettingsService,
    private readonly analytics: PlatformAnalyticsService,
    private readonly security: PlatformSecurityService,
  ) {}

  // ─── Tenant delegation ──────────────────────────────────────────
  async listUsers() {
    return this.tenant.listUsers();
  }
  async listCustomers(
    q?: string,
    filter?: 'all' | 'active' | 'expired' | 'trial',
    cursor?: string,
    limit?: number,
  ) {
    return this.tenant.listCustomers(q, filter ?? 'all', cursor, limit);
  }
  async getCustomerProfile(customerId: string) {
    return this.tenant.getCustomerProfile(customerId);
  }
  async getCustomerWorkspaceDetail(customerId: string, workspaceId: string) {
    return this.tenant.getCustomerWorkspaceDetail(customerId, workspaceId);
  }
  async sendSubscriptionReminder(customerId: string) {
    return this.tenant.sendSubscriptionReminder(customerId);
  }
  async listWorkspaces(cursor?: string, limit?: number) {
    return this.tenant.listWorkspaces(cursor, limit);
  }
  async listGlobalFleetScreens(cursor?: string, limit?: number) {
    return this.tenant.listGlobalFleetScreens(cursor, limit);
  }
  async mockWorkspaceSubscriptionPlan(workspaceId: string, plan: MockPlan) {
    return this.tenant.mockWorkspaceSubscriptionPlan(workspaceId, plan);
  }
  async createCustomerWorkspace(customerId: string, name: string) {
    return this.tenant.createCustomerWorkspace(customerId, name);
  }
  async updateCustomerWorkspace(
    customerId: string,
    workspaceId: string,
    name: string,
  ) {
    return this.tenant.updateCustomerWorkspace(customerId, workspaceId, name);
  }
  async deleteCustomerWorkspace(customerId: string, workspaceId: string) {
    return this.tenant.deleteCustomerWorkspace(customerId, workspaceId);
  }
  async patchCustomerSubscription(
    customerId: string,
    dto: {
      subscriptionStatus?: UserSubscriptionStatus;
      subscriptionEndDate?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.tenant.patchCustomerSubscription(customerId, dto);
  }

  // ─── Staff delegation ───────────────────────────────────────────
  async listStaff() {
    return this.staff.listStaff();
  }
  async createStaff(input: {
    fullName: string;
    email: string;
    password: string;
    adminRole: 'ADMIN' | 'EDITOR' | 'VIEWER' | 'SUPER_ADMIN';
  }) {
    return this.staff.createStaff(input);
  }
  async updateStaffRole(
    userId: string,
    role: 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR' | 'VIEWER',
  ) {
    return this.staff.updateStaffRole(userId, role);
  }
  async updateUser(actorId: string, userId: string, dto: UpdateAdminUserDto) {
    return this.staff.updateUser(actorId, userId, dto);
  }

  // ─── Settings delegation ────────────────────────────────────────
  async getSettings() {
    return this.settings.getSettings();
  }
  async patchSettings(
    dto: Partial<{
      platformName: string;
      supportEmail: string;
      maintenanceMode: boolean;
      defaultLanguage: string;
      logoUrlEn: string;
      logoUrlAr: string;
      logoAssetEnLight: string;
      logoAssetEnDark: string;
      logoAssetArLight: string;
      logoAssetArDark: string;
      brandingEpoch: number;
    }>,
  ) {
    return this.settings.patchSettings(dto);
  }

  // ─── Analytics delegation ───────────────────────────────────────
  async getGlobalStats() {
    return this.analytics.getGlobalStats();
  }

  // ─── Security delegation ────────────────────────────────────────
  async impersonateUser(
    actorId: string,
    targetUserId: string,
    workspaceId?: string,
    ipAddress?: string,
  ) {
    return this.security.impersonateUser(
      actorId,
      targetUserId,
      workspaceId,
      ipAddress,
    );
  }
  async listLogs(cursor?: string, limit?: number) {
    return this.security.listLogs(cursor, limit);
  }
}
