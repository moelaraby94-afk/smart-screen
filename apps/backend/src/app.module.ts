import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { CsrfModule } from './common/csrf/csrf.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './domains/auth/auth.module';
import { WorkspacesModule } from './domains/workspaces/workspaces.module';
import { ScreensModule } from './domains/screens/screens.module';
import { CanvasesModule } from './domains/canvases/canvases.module';
import { PlaylistsModule } from './domains/playlists/playlists.module';
import { SubscriptionsModule } from './domains/subscriptions/subscriptions.module';
import { StripeModule } from './domains/stripe/stripe.module';
import { RealtimeModule } from './domains/realtime/realtime.module';
import { MediaModule } from './domains/media/media.module';
import { PlayerModule } from './domains/player/player.module';
import { SchedulesModule } from './domains/schedules/schedules.module';
import { AdminModule } from './domains/admin/admin.module';
import { AccountModule } from './domains/account/account.module';
import { WebhooksModule } from './domains/webhooks/webhooks.module';
import { ApiKeysModule } from './domains/api-keys/api-keys.module';
import { OnboardingModule } from './domains/onboarding/onboarding.module';
import { MaintenanceModule } from './domains/maintenance/maintenance.module';
import { EmailModule } from './domains/email/email.module';
import { NotificationsModule } from './domains/notifications/notifications.module';
import { WorkspaceAuditLogModule } from './domains/audit-log/audit-log.module';
import { HealthModule } from './common/health/health.module';
import { RequestContextModule } from './common/request-context/request-context.module';

@Module({
  imports: [
    ...(process.env.SENTRY_DSN?.trim() ? [SentryModule.forRoot()] : []),
    ScheduleModule.forRoot(),
    /**
     * Baseline per-IP budget for the whole API. It exists to blunt
     * unauthenticated floods and scanners, not to police normal use — the
     * sensitive routes (login, password reset, pairing claim, billing) layer
     * much tighter `@Throttle` limits on top, and those run after JwtAuthGuard
     * so they can key on the user instead of the IP.
     *
     * Tracking is by IP, so `TRUST_PROXY_HOPS` must be set behind a reverse
     * proxy or every client shares the proxy's bucket (see main.ts).
     *
     * Storage is in-memory: counters are per process. Running more than one
     * backend instance needs a shared store (@nest-lab/throttler-storage-redis).
     */
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: Number(process.env.RATE_LIMIT_PER_MINUTE ?? '300'),
        },
      ],
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    EmailModule,
    CsrfModule,
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ScreensModule,
    CanvasesModule,
    MediaModule,
    PlaylistsModule,
    SchedulesModule,
    SubscriptionsModule,
    StripeModule,
    RealtimeModule,
    PlayerModule,
    AdminModule,
    AccountModule,
    WebhooksModule,
    ApiKeysModule,
    OnboardingModule,
    MaintenanceModule,
    NotificationsModule,
    WorkspaceAuditLogModule,
    HealthModule,
    RequestContextModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    /**
     * ThrottlerModule.forRoot() only *configures* the limit — nothing enforced
     * it until now, because ThrottlerGuard was attached to five controllers by
     * hand and the other eleven were wide open. Registering it as APP_GUARD
     * applies the baseline everywhere; routes that must not be rate limited
     * opt out explicitly with `@SkipThrottle()`.
     */
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
