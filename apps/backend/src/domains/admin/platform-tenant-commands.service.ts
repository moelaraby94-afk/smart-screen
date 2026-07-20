import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { assertMockBillingAllowed } from '../../common/product/mock-billing';
import type { MockPlan } from '../subscriptions/dto/set-mock-plan.dto';

/**
 * Platform tenant mutation commands: workspace CRUD, subscription overrides, reminders.
 * Extracted from PlatformTenantService to reduce file size and improve cohesion.
 */
@Injectable()
export class PlatformTenantCommandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceProvisioning: WorkspaceProvisioningService,
    private readonly workspaceSubscriptions: SubscriptionsService,
  ) {}

  async mockWorkspaceSubscriptionPlan(workspaceId: string, plan: MockPlan) {
    assertMockBillingAllowed();
    const w = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true },
    });
    if (!w) throw new NotFoundException('Workspace not found');
    return this.workspaceSubscriptions.setMockPlan(workspaceId, plan);
  }

  async createCustomerWorkspace(customerId: string, name: string) {
    const u = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!u || u.isSuperAdmin || u.platformStaffRole != null) {
      throw new NotFoundException('Customer not found');
    }
    return this.workspaceProvisioning.createForUser(customerId, name.trim());
  }

  async updateCustomerWorkspace(
    customerId: string,
    workspaceId: string,
    name: string,
  ) {
    const m = await this.prisma.workspaceMember.findFirst({
      where: { userId: customerId, workspaceId },
    });
    if (!m) throw new NotFoundException('Workspace not found');
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data: { name: name.trim() },
      select: { id: true, name: true, slug: true },
    });
  }

  async deleteCustomerWorkspace(customerId: string, workspaceId: string) {
    const m = await this.prisma.workspaceMember.findFirst({
      where: { userId: customerId, workspaceId },
    });
    if (!m) throw new NotFoundException('Workspace not found');
    await this.prisma.workspace.delete({ where: { id: workspaceId } });
    return { ok: true };
  }

  async patchCustomerSubscription(
    customerId: string,
    dto: {
      subscriptionStatus?: UserSubscriptionStatus;
      subscriptionEndDate?: string | null;
      isActive?: boolean;
    },
  ) {
    const u = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!u || u.isSuperAdmin || u.platformStaffRole != null) {
      throw new NotFoundException('Customer not found');
    }
    const data: {
      subscriptionStatus?: UserSubscriptionStatus;
      subscriptionEndDate?: Date | null;
      isActive?: boolean;
    } = {};
    if (dto.subscriptionStatus !== undefined) {
      data.subscriptionStatus = dto.subscriptionStatus;
    }
    if (dto.subscriptionEndDate !== undefined) {
      data.subscriptionEndDate =
        dto.subscriptionEndDate === null
          ? null
          : new Date(dto.subscriptionEndDate);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes');
    }
    return this.prisma.user.update({
      where: { id: customerId },
      data,
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        isActive: true,
      },
    });
  }
}
