import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule } from '@sentry/nestjs/setup';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { CsrfModule } from './common/csrf/csrf.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { RedisService } from './common/redis/redis.service';
import { RedisThrottlerStorage } from './common/redis/redis-throttler-storage';
import { StorageModule } from './common/storage/storage.module';
import { EmailQueueModule } from './common/queues/email-queue.module';
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
import { CampaignsModule } from './domains/campaigns/campaigns.module';
import { AdminModule } from './domains/admin/admin.module';
import { AccountModule } from './domains/account/account.module';
import { WebhooksModule } from './domains/webhooks/webhooks.module';
import { ApiKeysModule } from './domains/api-keys/api-keys.module';
import { OnboardingModule } from './domains/onboarding/onboarding.module';
import { IslamicModule } from './domains/islamic/islamic.module';
import { MaintenanceModule } from './domains/maintenance/maintenance.module';
import { EmailModule } from './domains/email/email.module';
import { NotificationsModule } from './domains/notifications/notifications.module';
import { WorkspaceAuditLogModule } from './domains/audit-log/audit-log.module';
import { HealthModule } from './common/health/health.module';
import { MetricsModule } from './common/metrics/metrics.module';
import { MetricsMiddleware } from './common/metrics/metrics.middleware';
import { RequestContextModule } from './common/request-context/request-context.module';
import { WorkspaceAuthModule } from './common/auth/workspace-auth.module';
import { ConfigHelperModule } from './common/config/config-helper.module';

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
     * When REDIS_URL is set, rate limits are shared across instances via
     * RedisThrottlerStorage (registered as a provider below). Without Redis,
     * the default in-memory storage is used (single-instance only).
     *
     * Official source: NestJS Rate Limiting —
     * https://docs.nestjs.com/security/rate-limiting
     */
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, redis: RedisService) => ({
        throttlers: [
          {
            ttl: 60_000,
            limit: Number(config.get<string>('RATE_LIMIT_PER_MINUTE') ?? '300'),
          },
        ],
        storage: redis.isConfigured
          ? new RedisThrottlerStorage(redis)
          : undefined,
      }),
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      imports: [ConfigModule, RedisModule],
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, _redis: RedisService) => {
        const url = config.get<string>('REDIS_URL');
        if (!url) {
          return { connection: { host: 'localhost', port: 6379 } };
        }
        return { connection: { url } };
      },
    }),
    RedisModule,
    StorageModule,
    EmailModule,
    EmailQueueModule,
    CsrfModule,
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ScreensModule,
    CanvasesModule,
    MediaModule,
    PlaylistsModule,
    SchedulesModule,
    CampaignsModule,
    SubscriptionsModule,
    StripeModule,
    RealtimeModule,
    PlayerModule,
    AdminModule,
    AccountModule,
    WebhooksModule,
    ApiKeysModule,
    OnboardingModule,
    IslamicModule,
    MaintenanceModule,
    NotificationsModule,
    WorkspaceAuditLogModule,
    HealthModule,
    MetricsModule,
    RequestContextModule,
    WorkspaceAuthModule,
    ConfigHelperModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*');
  }
}
