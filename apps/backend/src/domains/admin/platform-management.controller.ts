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
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { PlatformStaffRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { PlatformStaffDbGuard } from '../../common/auth/platform-staff-db.guard';
import { TwoFactorRequiredGuard } from '../../common/auth/two-factor-required.guard';
import { PlatformRoles } from '../../common/auth/platform-roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { setAuthCookies } from '../auth/auth-cookie.util';
import { ExchangeTokenService } from '../auth/exchange-token.service';
import { AdminService } from './admin.service';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { ImpersonateUserDto } from './dto/impersonate-user.dto';
import { ImpersonateDto } from '../auth/dto/exchange-token.dto';
import { CreateCustomerWorkspaceDto } from './dto/create-customer-workspace.dto';
import { UpdateCustomerWorkspaceDto } from './dto/update-customer-workspace.dto';
import { PatchCustomerSubscriptionDto } from './dto/patch-customer-subscription.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffRoleDto } from './dto/update-staff-role.dto';
import { PLATFORM_ROUTES } from '../../common/constants/route-prefixes';
import {
  toResponseDto,
  toResponseDtoList,
  toPaginatedResponseDto,
  CustomerListItemDto,
  CustomerProfileDto,
  WorkspaceListItemDto,
  StaffListItemDto,
} from '../../common/dto/response-dtos';

/**
 * Platform user, staff, and tenant management.
 *
 * Handles: user listing/updates, staff CRUD, customer workspace CRUD,
 * subscription patches, impersonation, and exchange-token generation.
 *
 * Every route is super-admin-only unless it carries `@PlatformRoles(...)`
 * naming the non-super staff roles allowed to reach it (PlatformStaffDbGuard
 * is fail-closed).
 */
@Controller({ path: [...PLATFORM_ROUTES.ADMIN] })
@UseGuards(JwtAuthGuard, PlatformStaffDbGuard)
export class PlatformManagementController {
  constructor(
    private readonly adminService: AdminService,
    private readonly exchangeTokenService: ExchangeTokenService,
  ) {}

  // ─── Users ──────────────────────────────────────────────────────

  @Get('users')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  listUsers() {
    return this.adminService.listUsers();
  }

  /**
   * SUPER_ADMIN only: UpdateAdminUserDto can set isSuperAdmin/platformStaffRole
   * on the target user — this is a privilege-escalation vector, not just a
   * profile edit, if opened up to non-super-admin staff.
   */
  @Patch('users/:id')
  @UseGuards(SuperAdminDbGuard, TwoFactorRequiredGuard)
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
    setAuthCookies(
      res,
      result.accessToken,
      result.refreshToken,
      result.user.audience,
    );
    return {
      accessToken: result.accessToken,
      user: result.user,
      workspaces: result.workspaces,
    };
  }

  @Post('users/:id/exchange-token')
  @UseGuards(SuperAdminDbGuard)
  async generateExchangeToken(
    @CurrentUser() user: JwtUser,
    @Param('id') id: string,
    @Body() body: ImpersonateDto,
  ) {
    return this.exchangeTokenService.generate(user.sub, id, body.workspaceId);
  }

  // ─── Staff ──────────────────────────────────────────────────────

  /** Staff management (creating/re-roling staff) stays super-admin-only. */
  @Get('staff')
  @UseGuards(SuperAdminDbGuard)
  listStaff() {
    return this.adminService
      .listStaff()
      .then((items) => toResponseDtoList(StaffListItemDto, items as never[]));
  }

  @Post('staff')
  @UseGuards(SuperAdminDbGuard)
  createStaff(@Body() dto: CreateStaffDto) {
    return this.adminService.createStaff(dto);
  }

  @Patch('staff/:id/role')
  @UseGuards(SuperAdminDbGuard, TwoFactorRequiredGuard)
  updateStaffRole(@Param('id') id: string, @Body() dto: UpdateStaffRoleDto) {
    return this.adminService.updateStaffRole(id, dto.adminRole);
  }

  // ─── Customers & Workspaces ─────────────────────────────────────

  @Get('customers')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  listCustomers(
    @Query('q') q?: string,
    @Query('filter') filter?: 'all' | 'active' | 'expired' | 'trial',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = this.adminService.listCustomers(
      q,
      filter ?? 'all',
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
    return result.then((r) =>
      toPaginatedResponseDto(CustomerListItemDto, r as never),
    );
  }

  @Get('customers/:id')
  @PlatformRoles(
    PlatformStaffRole.SUPPORT_SPECIALIST,
    PlatformStaffRole.BILLING_MANAGER,
  )
  getCustomer(@Param('id') id: string) {
    return this.adminService
      .getCustomerProfile(id)
      .then((p) => toResponseDto(CustomerProfileDto, p as never));
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
  listWorkspaces(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const result = this.adminService.listWorkspaces(
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
    return result.then((r) =>
      toPaginatedResponseDto(WorkspaceListItemDto, r as never),
    );
  }
}
