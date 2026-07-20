import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PlatformTenantService } from './platform-tenant.service';
import { PlatformTenantCommandsService } from './platform-tenant-commands.service';
import { PlatformStaffService } from './platform-staff.service';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PlatformSecurityService } from './platform-security.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionEmailService } from '../email/subscription-email.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

function makePrisma() {
  return {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockResolvedValue({ id: 'u1', email: 'a@b.com', fullName: 'Test' }),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn().mockResolvedValue(0),
    },
    workspace: {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    workspaceMember: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({}),
    },
    screen: {
      findMany: jest.fn().mockResolvedValue([]),
      groupBy: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    media: {
      groupBy: jest.fn().mockResolvedValue([]),
      aggregate: jest
        .fn()
        .mockResolvedValue({ _count: { _all: 0 }, _sum: { sizeBytes: 0 } }),
    },
    playlist: {
      count: jest.fn().mockResolvedValue(0),
    },
    subscription: {
      findMany: jest.fn().mockResolvedValue([]),
      aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
    },
    paymentRecord: {
      aggregate: jest.fn().mockResolvedValue({ _sum: {} }),
    },
    screenPairingSession: {
      count: jest.fn().mockResolvedValue(0),
    },
  } as unknown as PrismaService;
}

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  beforeEach(async () => {
    prisma = makePrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminService,
        PlatformTenantService,
        PlatformTenantCommandsService,
        PlatformStaffService,
        PlatformSettingsService,
        PlatformAnalyticsService,
        PlatformSecurityService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuthService, useValue: {} },
        {
          provide: WorkspaceProvisioningService,
          useValue: {
            createForUser: jest.fn().mockResolvedValue({ id: 'ws1' }),
          },
        },
        {
          provide: ScreenHeartbeatService,
          useValue: { getConnectedSocketCount: jest.fn().mockReturnValue(0) },
        },
        {
          provide: SubscriptionsService,
          useValue: { setMockPlan: jest.fn().mockResolvedValue({}) },
        },
        { provide: SubscriptionEmailService, useValue: {} },
        {
          provide: AuditLogService,
          useValue: {
            list: jest.fn().mockResolvedValue([]),
            append: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AccountContextHelper,
          useValue: {
            invalidateUserContext: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(AdminService);
  });

  it('listUsers returns empty array when no users', async () => {
    const result = await service.listUsers();
    expect(result).toEqual([]);
  });

  it('listStaff returns empty array when no Admin Control workspace', async () => {
    (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(null);
    const result = await service.listStaff();
    expect(result).toEqual([]);
  });

  it('createStaff throws BadRequest when email already exists', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
    await expect(
      service.createStaff({
        fullName: 'Test',
        email: 'test@test.com',
        password: 'pass123',
        adminRole: 'ADMIN',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('updateStaffRole throws NotFound for missing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.updateStaffRole('u1', 'ADMIN')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('listCustomers returns empty paginated result when no users', async () => {
    const result = await service.listCustomers();
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('getCustomerProfile throws NotFound for missing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.getCustomerProfile('u1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('listWorkspaces returns empty paginated result when no workspaces', async () => {
    const result = await service.listWorkspaces();
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('listGlobalFleetScreens returns empty paginated result when no screens', async () => {
    const result = await service.listGlobalFleetScreens();
    expect(result.items).toEqual([]);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it('sendSubscriptionReminder throws NotFound for missing user', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.sendSubscriptionReminder('u1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
