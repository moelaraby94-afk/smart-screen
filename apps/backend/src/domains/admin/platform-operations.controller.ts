import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlatformStaffRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { PlatformStaffDbGuard } from '../../common/auth/platform-staff-db.guard';
import { PlatformRoles } from '../../common/auth/platform-roles.decorator';
import { AdminService } from './admin.service';
import { UpdateAdminSettingsDto } from './dto/update-admin-settings.dto';
import { SetMockPlanDto } from '../subscriptions/dto/set-mock-plan.dto';
import { BrandingAssetsService } from './branding-assets.service';
import { PLATFORM_ROUTES } from '../../common/constants/route-prefixes';
import {
  toResponseDto,
  toPaginatedResponseDto,
  FleetScreenItemDto,
  AdminAuditLogItemDto,
  PlatformStatsDto,
} from '../../common/dto/response-dtos';

/**
 * Platform operations: settings, branding, stats, logs, fleet monitoring,
 * and subscription mock overrides.
 *
 * Every route is super-admin-only unless it carries `@PlatformRoles(...)`
 * naming the non-super staff roles allowed to reach it (PlatformStaffDbGuard
 * is fail-closed).
 */
@Controller({ path: [...PLATFORM_ROUTES.ADMIN] })
@UseGuards(JwtAuthGuard, PlatformStaffDbGuard)
export class PlatformOperationsController {
  constructor(
    private readonly adminService: AdminService,
    private readonly brandingAssets: BrandingAssetsService,
  ) {}

  // ─── Fleet & Screens ────────────────────────────────────────────

  @Get('fleet/screens')
  @PlatformRoles(PlatformStaffRole.SUPPORT_SPECIALIST)
  listGlobalFleetScreens(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService
      .listGlobalFleetScreens(cursor, limit ? parseInt(limit, 10) : undefined)
      .then((r) => toPaginatedResponseDto(FleetScreenItemDto, r as never));
  }

  @Get('screens')
  @PlatformRoles(PlatformStaffRole.SUPPORT_SPECIALIST)
  listGlobalScreens(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService
      .listGlobalFleetScreens(cursor, limit ? parseInt(limit, 10) : undefined)
      .then((r) => toPaginatedResponseDto(FleetScreenItemDto, r as never));
  }

  // ─── Stats & Logs ───────────────────────────────────────────────

  /** Platform revenue figures — a billing manager's core view. */
  @Get('stats')
  @PlatformRoles(PlatformStaffRole.BILLING_MANAGER)
  globalStats() {
    return this.adminService
      .getGlobalStats()
      .then((s) => toResponseDto(PlatformStatsDto, s as never));
  }

  /**
   * Cross-tenant audit trail: impersonation events, actor IDs, client IPs.
   * Super-admin-only — no `@PlatformRoles`, deliberately.
   */
  @Get('logs')
  logs(@Query('cursor') cursor?: string, @Query('limit') limit?: string) {
    return this.adminService
      .listLogs(cursor, limit ? parseInt(limit, 10) : undefined)
      .then((r) => toPaginatedResponseDto(AdminAuditLogItemDto, r as never));
  }

  // ─── Settings & Branding ────────────────────────────────────────

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

  // ─── Subscription Mock ──────────────────────────────────────────

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
}
