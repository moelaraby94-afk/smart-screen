import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BrandingAssetsService } from './branding-assets.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AccountContextHelper } from '../../common/auth/account-context.helper';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  beforeEach(async () => {
    adminService = {
      listUsers: jest.fn().mockResolvedValue([]),
      listStaff: jest.fn().mockResolvedValue([]),
      createStaff: jest.fn().mockResolvedValue({ id: 'u1' }),
      updateStaffRole: jest.fn().mockResolvedValue({ ok: true }),
      listCustomers: jest.fn().mockResolvedValue([]),
      getCustomerProfile: jest.fn().mockResolvedValue({}),
      getCustomerWorkspaceDetail: jest.fn().mockResolvedValue({}),
      sendSubscriptionReminder: jest.fn().mockResolvedValue({ ok: true }),
      listWorkspaces: jest.fn().mockResolvedValue([]),
      listGlobalFleetScreens: jest.fn().mockResolvedValue([]),
      mockWorkspaceSubscriptionPlan: jest.fn().mockResolvedValue({}),
      getGlobalStats: jest.fn().mockResolvedValue({}),
    } as unknown as AdminService;

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        Reflector,
        AccountContextHelper,
        { provide: PrismaService, useValue: {} },
        { provide: AdminService, useValue: adminService },
        { provide: BrandingAssetsService, useValue: {} },
      ],
    }).compile();
    controller = moduleRef.get(AdminController);
  });

  it('listUsers delegates to service', async () => {
    await controller.listUsers();
    expect(adminService.listUsers).toHaveBeenCalled();
  });

  it('listStaff delegates to service', async () => {
    await controller.listStaff();
    expect(adminService.listStaff).toHaveBeenCalled();
  });

  it('createStaff delegates to service', async () => {
    const dto = {
      fullName: 'Test',
      email: 'a@b.com',
      password: 'pass',
      adminRole: 'ADMIN',
    } as any;
    await controller.createStaff(dto);
    expect(adminService.createStaff).toHaveBeenCalledWith(dto);
  });

  it('updateStaffRole delegates to service', async () => {
    const dto = { adminRole: 'ADMIN' } as any;
    await controller.updateStaffRole('u1', dto);
    expect(adminService.updateStaffRole).toHaveBeenCalledWith('u1', 'ADMIN');
  });

  it('listCustomers delegates to service', async () => {
    await controller.listCustomers();
    expect(adminService.listCustomers).toHaveBeenCalledWith(undefined, 'all');
  });

  it('getCustomer delegates to service', async () => {
    await controller.getCustomer('u1');
    expect(adminService.getCustomerProfile).toHaveBeenCalledWith('u1');
  });

  it('listWorkspaces delegates to service', async () => {
    await controller.listWorkspaces();
    expect(adminService.listWorkspaces).toHaveBeenCalled();
  });

  it('listGlobalFleetScreens delegates to service', async () => {
    await controller.listGlobalFleetScreens();
    expect(adminService.listGlobalFleetScreens).toHaveBeenCalled();
  });

  it('globalStats delegates to service', async () => {
    await controller.globalStats();
    expect(adminService.getGlobalStats).toHaveBeenCalled();
  });
});
