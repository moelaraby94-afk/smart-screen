import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditLogModule } from '../../common/audit/audit-log.module';
import { SuperAdminDbGuard } from '../../common/auth/super-admin-db.guard';
import { PlatformStaffDbGuard } from '../../common/auth/platform-staff-db.guard';
import { AdminController } from './admin.controller';
import { BrandingController } from './branding.controller';
import { BrandingAssetsService } from './branding-assets.service';
import { AdminService } from './admin.service';
import { SubscriptionEmailService } from '../email/subscription-email.service';

@Module({
  imports: [
    PrismaModule,
    AuditLogModule,
    forwardRef(() => AuthModule),
    forwardRef(() => WorkspacesModule),
    RealtimeModule,
    SubscriptionsModule,
  ],
  controllers: [AdminController, BrandingController],
  providers: [
    SuperAdminDbGuard,
    PlatformStaffDbGuard,
    AdminService,
    SubscriptionEmailService,
    BrandingAssetsService,
  ],
})
export class AdminModule {}
