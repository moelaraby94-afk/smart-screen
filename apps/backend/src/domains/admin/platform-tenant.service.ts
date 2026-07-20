import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserSubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionEmailService } from '../email/subscription-email.service';
import type { MockPlan } from '../subscriptions/dto/set-mock-plan.dto';
import { PlatformTenantCommandsService } from './platform-tenant-commands.service';
import {
  ADMIN_LIST_CAP,
  computeCustomerLifecycle,
  isIdleAccount,
  isExpiredOrIdleTab,
  platformRoleLabel,
} from './admin-shared';
import {
  buildCursorWhere,
  buildPaginatedResult,
  resolveLimit,
  type PaginatedResult,
} from '../../common/pagination/cursor-pagination';

@Injectable()
export class PlatformTenantService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceProvisioning: WorkspaceProvisioningService,
    private readonly subscriptionEmail: SubscriptionEmailService,
    private readonly workspaceSubscriptions: SubscriptionsService,
    private readonly commandsService: PlatformTenantCommandsService,
  ) {}

  async listUsers() {
    const [users, membersRows, mediaAgg] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          businessName: true,
          locale: true,
          isActive: true,
          isSuperAdmin: true,
          platformStaffRole: true,
          createdAt: true,
          lastLoginAt: true,
          subscriptionStatus: true,
          subscriptionEndDate: true,
          memberships: { select: { role: true } },
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: ADMIN_LIST_CAP,
      }),
      this.prisma.workspaceMember.findMany({
        select: { userId: true, workspaceId: true },
      }),
      this.prisma.media.groupBy({
        by: ['workspaceId'],
        _sum: { sizeBytes: true },
      }),
    ]);
    const wsSize = new Map(
      mediaAgg.map((m) => [m.workspaceId, m._sum.sizeBytes ?? 0]),
    );
    const storageByUser = new Map<string, number>();
    for (const row of membersRows) {
      const add = wsSize.get(row.workspaceId) ?? 0;
      storageByUser.set(row.userId, (storageByUser.get(row.userId) ?? 0) + add);
    }
    const now = new Date();
    return users.map((u) => {
      const lifecycle = computeCustomerLifecycle(u, now);
      const idle = isIdleAccount(u.lastLoginAt, now);
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        businessName: u.businessName,
        locale: u.locale,
        isActive: u.isActive,
        isSuperAdmin: u.isSuperAdmin,
        platformStaffRole: u.platformStaffRole,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionEndDate: u.subscriptionEndDate,
        customerLifecycle: lifecycle,
        isIdle: idle,
        expiredOrIdle: isExpiredOrIdleTab(lifecycle, idle),
        storageBytes: storageByUser.get(u.id) ?? 0,
        totalWorkspaces: u._count.memberships,
        platformRole: platformRoleLabel(
          u.isSuperAdmin,
          u.platformStaffRole,
          u.memberships,
        ),
      };
    });
  }

  async listCustomers(
    q?: string,
    filter: 'all' | 'active' | 'expired' | 'trial' = 'all',
    cursor?: string,
    limit?: number,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const resolvedLimit = resolveLimit(limit);
    const now = new Date();

    const subscriptionStatusFilter: UserSubscriptionStatus[] = [];
    if (filter === 'trial')
      subscriptionStatusFilter.push(UserSubscriptionStatus.TRIAL);
    if (filter === 'expired')
      subscriptionStatusFilter.push(UserSubscriptionStatus.EXPIRED);

    const where: Record<string, unknown> = {
      isSuperAdmin: false,
      platformStaffRole: null,
      ...(subscriptionStatusFilter.length > 0
        ? { subscriptionStatus: { in: subscriptionStatusFilter } }
        : {}),
      ...(q?.trim()
        ? {
            OR: [
              { email: { contains: q.trim(), mode: 'insensitive' } },
              { fullName: { contains: q.trim(), mode: 'insensitive' } },
              { businessName: { contains: q.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
      ...buildCursorWhere(cursor),
    };

    if (filter === 'active') {
      where.AND = [
        { isActive: true },
        {
          OR: [
            { subscriptionEndDate: null },
            { subscriptionEndDate: { gte: now } },
          ],
        },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        createdAt: true,
        lastLoginAt: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        memberships: { select: { role: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: resolvedLimit + 1,
    });

    const items = users.map((u) => {
      const lifecycle = computeCustomerLifecycle(u, now);
      const idle = isIdleAccount(u.lastLoginAt, now);
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        businessName: u.businessName,
        locale: u.locale,
        isActive: u.isActive,
        isSuperAdmin: u.isSuperAdmin,
        platformStaffRole: u.platformStaffRole,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        subscriptionStatus: u.subscriptionStatus,
        subscriptionEndDate: u.subscriptionEndDate,
        customerLifecycle: lifecycle,
        isIdle: idle,
        expiredOrIdle: isExpiredOrIdleTab(lifecycle, idle),
        totalWorkspaces: u._count.memberships,
        platformRole: platformRoleLabel(
          u.isSuperAdmin,
          u.platformStaffRole,
          u.memberships,
        ),
      };
    });

    return buildPaginatedResult(items, resolvedLimit);
  }

  async getCustomerProfile(customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        phone: true,
        country: true,
        city: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user) throw new NotFoundException('Customer not found');
    if (user.isSuperAdmin || user.platformStaffRole != null) {
      throw new NotFoundException('Customer not found');
    }

    const now = new Date();
    const lifecycle = computeCustomerLifecycle(user, now);

    const ownerMemberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId: customerId,
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
      },
      select: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
            _count: { select: { screens: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const workspaceIds = ownerMemberships.map((m) => m.workspace.id);
    const storageRows =
      workspaceIds.length === 0
        ? []
        : await this.prisma.media.groupBy({
            by: ['workspaceId'],
            where: { workspaceId: { in: workspaceIds } },
            _sum: { sizeBytes: true },
          });
    const storageByWs = new Map(
      storageRows.map((r) => [r.workspaceId, r._sum.sizeBytes ?? 0]),
    );

    let totalScreens = 0;
    let totalStorageBytes = 0;
    const branches = ownerMemberships.map((m) => {
      const w = m.workspace;
      const screens = w._count.screens;
      const storage = storageByWs.get(w.id) ?? 0;
      totalScreens += screens;
      totalStorageBytes += storage;
      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        createdAt: w.createdAt,
        screenCount: screens,
        storageBytes: storage,
      };
    });

    let analytics: {
      screensByStatus: Record<string, number>;
      totalPlaylists: number;
      totalMedia: number;
      totalMediaBytes: number;
    } = {
      screensByStatus: {},
      totalPlaylists: 0,
      totalMedia: 0,
      totalMediaBytes: 0,
    };
    if (workspaceIds.length > 0) {
      const [screenGroups, playlistCount, mediaAgg] = await Promise.all([
        this.prisma.screen.groupBy({
          by: ['status'],
          where: { workspaceId: { in: workspaceIds } },
          _count: { _all: true },
        }),
        this.prisma.playlist.count({
          where: { workspaceId: { in: workspaceIds } },
        }),
        this.prisma.media.aggregate({
          where: { workspaceId: { in: workspaceIds } },
          _count: { _all: true },
          _sum: { sizeBytes: true },
        }),
      ]);
      const screensByStatus: Record<string, number> = {};
      for (const row of screenGroups) {
        screensByStatus[row.status] = row._count._all;
      }
      analytics = {
        screensByStatus,
        totalPlaylists: playlistCount,
        totalMedia: mediaAgg._count._all,
        totalMediaBytes: mediaAgg._sum.sizeBytes ?? 0,
      };
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      businessName: user.businessName,
      phone: user.phone,
      country: user.country,
      city: user.city,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionEndDate: user.subscriptionEndDate,
      customerLifecycle: lifecycle,
      branches,
      usage: {
        totalScreens,
        totalStorageBytes,
      },
      analytics,
    };
  }

  async getCustomerWorkspaceDetail(customerId: string, workspaceId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user) throw new NotFoundException('Customer not found');
    if (user.isSuperAdmin || user.platformStaffRole != null) {
      throw new NotFoundException('Customer not found');
    }

    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: customerId,
        workspaceId,
        role: { in: [UserRole.OWNER, UserRole.ADMIN] },
      },
      select: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            createdAt: true,
          },
        },
      },
    });
    if (!membership) {
      throw new NotFoundException('Workspace not found for this customer');
    }

    const screens = await this.prisma.screen.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        status: true,
        location: true,
        lastSeenAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      customerId,
      workspace: membership.workspace,
      screens,
    };
  }

  async sendSubscriptionReminder(customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        email: true,
        fullName: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user) throw new NotFoundException('Customer not found');
    if (user.isSuperAdmin || user.platformStaffRole != null) {
      throw new NotFoundException('Customer not found');
    }
    await this.subscriptionEmail.sendRenewalReminder(user.email, user.fullName);
    return {
      ok: true,
      message: 'Reminder sent.',
    };
  }

  async listWorkspaces(
    cursor?: string,
    limit?: number,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const resolvedLimit = resolveLimit(limit);
    const [workspaces, storageRows] = await Promise.all([
      this.prisma.workspace.findMany({
        where: buildCursorWhere(cursor),
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: resolvedLimit + 1,
        select: {
          id: true,
          name: true,
          slug: true,
          createdAt: true,
          members: {
            where: { role: { in: [UserRole.OWNER, UserRole.ADMIN] } },
            select: {
              role: true,
              userId: true,
              user: {
                select: {
                  email: true,
                  fullName: true,
                  isSuperAdmin: true,
                  platformStaffRole: true,
                },
              },
            },
          },
          _count: {
            select: { screens: true, medias: true },
          },
          subscription: {
            select: { plan: true, screenLimit: true, status: true },
          },
        },
      }),
      this.prisma.media.groupBy({
        by: ['workspaceId'],
        _sum: { sizeBytes: true },
      }),
    ]);
    const storageByWs = new Map(
      storageRows.map((r) => [r.workspaceId, r._sum.sizeBytes ?? 0]),
    );
    const items = workspaces.map((w) => {
      const primary =
        w.members.find((m) => m.role === UserRole.OWNER) ?? w.members[0];
      const owner = primary?.user;
      const ownerId = primary?.userId ?? null;
      const isBillableCustomer =
        owner && !owner.isSuperAdmin && owner.platformStaffRole == null;
      return {
        id: w.id,
        name: w.name,
        slug: w.slug,
        createdAt: w.createdAt,
        ownerId,
        ownerCustomerProfileId: isBillableCustomer ? ownerId : null,
        ownerEmail: owner?.email ?? null,
        ownerName: owner?.fullName ?? null,
        screenCount: w._count.screens,
        mediaCount: w._count.medias,
        storageBytes: storageByWs.get(w.id) ?? 0,
        subscriptionPlan: w.subscription?.plan ?? null,
        subscriptionScreenLimit: w.subscription?.screenLimit ?? null,
        subscriptionStatus: w.subscription?.status ?? null,
      };
    });
    return buildPaginatedResult(items, resolvedLimit);
  }

  async listGlobalFleetScreens(
    cursor?: string,
    limit?: number,
  ): Promise<PaginatedResult<Record<string, unknown>>> {
    const resolvedLimit = resolveLimit(limit);
    const rows = await this.prisma.screen.findMany({
      where: buildCursorWhere(cursor),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: resolvedLimit + 1,
      select: {
        id: true,
        name: true,
        serialNumber: true,
        status: true,
        lastSeenAt: true,
        playerPlatform: true,
        playerVersion: true,
        isOfflineCacheMode: true,
        createdAt: true,
        workspace: { select: { id: true, name: true } },
      },
    });
    const items = rows.map((s) => ({
      id: s.id,
      name: s.name,
      serialNumber: s.serialNumber,
      status: s.status,
      lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
      playerPlatform: s.playerPlatform,
      playerVersion: s.playerVersion,
      workspaceId: s.workspace.id,
      workspaceName: s.workspace.name,
      isOfflineCacheMode: s.isOfflineCacheMode,
      createdAt: s.createdAt,
    }));
    return buildPaginatedResult(items, resolvedLimit);
  }

  async mockWorkspaceSubscriptionPlan(workspaceId: string, plan: MockPlan) {
    return this.commandsService.mockWorkspaceSubscriptionPlan(
      workspaceId,
      plan,
    );
  }

  async createCustomerWorkspace(customerId: string, name: string) {
    return this.commandsService.createCustomerWorkspace(customerId, name);
  }

  async updateCustomerWorkspace(
    customerId: string,
    workspaceId: string,
    name: string,
  ) {
    return this.commandsService.updateCustomerWorkspace(
      customerId,
      workspaceId,
      name,
    );
  }

  async deleteCustomerWorkspace(customerId: string, workspaceId: string) {
    return this.commandsService.deleteCustomerWorkspace(
      customerId,
      workspaceId,
    );
  }

  async patchCustomerSubscription(
    customerId: string,
    dto: {
      subscriptionStatus?: UserSubscriptionStatus;
      subscriptionEndDate?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.commandsService.patchCustomerSubscription(customerId, dto);
  }
}
