import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Request, Response } from 'express';
import { PlatformStaffRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { PlatformStaffDbGuard } from '../../common/auth/platform-staff-db.guard';
import { PlatformRoles } from '../../common/auth/platform-roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { setAuthCookies } from '../auth/auth-cookie.util';
import { AdminService } from './admin.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ImpersonateUserDto } from './dto/impersonate-user.dto';
import { CreateCustomerWorkspaceDto } from './dto/create-customer-workspace.dto';
import { UpdateCustomerWorkspaceDto } from './dto/update-customer-workspace.dto';
import { PatchCustomerSubscriptionDto } from './dto/patch-customer-subscription.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';
import { SetMockPlanDto } from '../subscriptions/dto/set-mock-plan.dto';
import { BrandingAssetsService } from './branding-assets.service';

/**
 * Every route here is super-admin-only unless it carries `@PlatformRoles(...)`
 * naming the non-super staff roles allowed to reach it (PlatformStaffDbGuard is
 * fail-closed). Reads are delegated per role; every write stays super-admin-only
 * until the product decides which writes each staff role should own.
 */
@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformStaffDbGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly brandingAssets: BrandingAssetsService,
  ) {}

  @Get('users')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  listUsers() {
    return this.adminService.listUsers();
  }

  /** Staff management (creating/re-roling staff) stays super-admin-only. */
  @Get('staff')
  @UseGuards(SuperAdminDbGuard)
  listStaff() {
    return this.adminService.listStaff();
  }

  @Post('staff')
  @UseGuards(SuperAdminDbGuard)
  createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaff(dto);
  }

  @Patch('staff/:id/role')
  @UseGuards(SuperAdminDbGuard)
  updateStaffRole(@Param('id') id: string, @Body() dto: UpdateStaffRoleDto) {
    return this.adminService.updateStaffRole(id, dto.adminRole);
  }

  @Get('customers')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  listCustomers(
    @Query('q') q?: string,
    @Query('filter') filter?: 'all' | 'active' | 'expired' | 'trial',
  ) {
    return this.adminService.listCustomers(q, filter ?? 'all');
  }

  @Get('customers/:customerId/workspaces/:workspaceId')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  getCustomerWorkspaceDetail(
    @Param('customerId') customerId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.adminService.getCustomerWorkspaceDetail(
      customerId,
      workspaceId,
    );
  }

  @Get('customers/:id')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomerProfile(id);
  }

  @Post('customers/:id/workspaces')
  createCustomerWorkspace(
    @Param('id') id: string,
    @Body() dto: CreateCustomerWorkspaceDto,
  ) {
    return this.adminService.createCustomerWorkspace(id, dto.name);
  }

  @Patch('customers/:customerId/workspaces/:workspaceId')
  updateCustomerWorkspace(
    @Param('customerId') customerId: string,
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateCustomerWorkspaceDto,
  ) {
    return this.adminService.updateCustomerWorkspace(
      customerId,
      workspaceId,
      dto.name,
    );
  }

  @Delete('customers/:customerId/workspaces/:workspaceId')
  @UseGuards(SuperAdminDbGuard)
  deleteCustomerWorkspace(
    @Param('customerId') customerId: string,
    @Param('workspaceId') workspaceId: string,
  ) {
    return this.adminService.deleteCustomerWorkspace(customerId, workspaceId);
  }

  @Patch('customers/:id/subscription')
  @UseGuards(SuperAdminDbGuard)
  patchCustomerSubscription(
    @Param('id') id: string,
    @Body() dto: PatchCustomerSubscriptionDto,
  ) {
    return this.adminService.patchCustomerSubscription(id, dto);
  }

  @Post('customers/:id/reminder')
  sendReminder(@Param('id') id: string) {
    return this.adminService.sendSubscriptionReminder(id);
  }

  @Get('workspaces')
  @PlatformRoles(PlatformStaffRole.SUPPORT_SPECIALIST)
  listWorkspaces() {
    return this.adminService.listWorkspaces();
  }

  @Get('fleet/screens')
  @PlatformRoles(PlatformStaffRole.SUPPORT_SPECIALIST)
  listGlobalFleetScreens() {
    return this.adminService.listGlobalFleetScreens();
  }

  @Get('screens')
  @PlatformRoles(PlatformStaffRole.SUPPORT_SPECIALIST)
  listGlobalScreens() {
    return this.adminService.listGlobalFleetScreens();
  }

  @Patch('workspaces/:workspaceId/subscription-mock')
  @UseGuards(SuperAdminDbGuard)
  mockWorkspaceSubscription(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: SetMockPlanDto,
  ) {
    return this.adminService.mockWorkspaceSubscriptionPlan(
      workspaceId,
      dto.plan,
    );
  }

  /** Platform revenue figures — a billing manager's core view. */
  @Get('stats')
  @PlatformRoles(PlatformStaffRole.BILLING_MANAGER)
  globalStats() {
    return this.adminService.getGlobalStats();
  }

  /**
   * Cross-tenant audit trail: impersonation events, actor IDs, client IPs.
   * Super-admin-only — no `@PlatformRoles`, deliberately.
   */
  @Get('logs')
  logs() {
    return this.adminService.listLogs();
  }

  /** Platform-wide configuration. Super-admin-only, deliberately. */
  @Get('settings')
  settings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @UseGuards(SuperAdminDbGuard)
  patchSettings(@Body() dto: UpdateAdminSettingsDto) {
    return this.adminService.patchSettings(dto);
  }

  @Post('settings/branding/upload')
  @UseGuards(SuperAdminDbGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  uploadBrandingLogo(
    @Query('variant') variant: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.brandingAssets.uploadVariant(variant, file);
  }

  /**
   * SUPER_ADMIN only: UpdateAdminUserDto can set isSuperAdmin/platformStaffRole
   * on the target user — this is a privilege-escalation vector, not just a
   * profile edit, if opened up to non-super-admin staff.
   */
  @Patch('users/:id')
  @UseGuards(SuperAdminDbGuard)
  updateUser(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminService.updateUser(user.sub, id, dto);
  }

  @Post('users/:id/impersonate')
  @UseGuards(SuperAdminDbGuard)
  async impersonate(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: ImpersonateUserDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.adminService.impersonateUser(
      user.sub,
      id,
      body.workspaceId,
      req.ip,
    );
    setAuthCookies(res, result.accessToken, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      workspaces: result.workspaces,
    };
  }
}
