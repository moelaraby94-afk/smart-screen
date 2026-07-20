import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { PlatformStaffDbGuard } from '../../common/auth/platform-staff-db.guard';
import { TwoFactorRequiredGuard } from '../../common/auth/two-factor-required.guard';
import { PlatformManagementController } from './platform-management.controller';
import { PlatformOperationsController } from './platform-operations.controller';
import { BrandingController } from './branding.controller';
import { BrandingAssetsService } from './branding-assets.service';
import { AdminService } from './admin.service';
import { PlatformTenantService } from './platform-tenant.service';
import { PlatformTenantCommandsService } from './platform-tenant-commands.service';
import { PlatformStaffService } from './platform-staff.service';
import { PlatformSettingsService } from './platform-settings.service';
import { PlatformAnalyticsService } from './platform-analytics.service';
import { PlatformSecurityService } from './platform-security.service';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    AuthModule,
    RealtimeModule,
    SubscriptionsModule,
  ],
  controllers: [
    BrandingController,
    PlatformManagementController,
    PlatformOperationsController,
  ],
  providers: [
    SuperAdminDbGuard,
    PlatformStaffDbGuard,
    TwoFactorRequiredGuard,
    AdminService,
    PlatformTenantService,
    PlatformTenantCommandsService,
    PlatformStaffService,
    PlatformSettingsService,
    PlatformAnalyticsService,
    PlatformSecurityService,
    BrandingAssetsService,
  ],
})
export class AdminModule {}
