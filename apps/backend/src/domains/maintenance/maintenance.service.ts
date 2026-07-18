import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { STORAGE_SERVICE } from '../../common/storage/storage.interface';
import type { IStorageService } from '../../common/storage/storage.interface';

/** Default retention: 90 days. Override with AUDIT_LOG_RETENTION_DAYS env var. */
const DEFAULT_AUDIT_LOG_RETENTION_DAYS = 90;

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  /** Purge pairing sessions past expiry (runs once per day, UTC). */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredPairingSessions(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.screenPairingSession.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    if (result.count > 0) {
      this.logger.log(
        `Deleted ${result.count} expired ScreenPairingSession row(s) (expiresAt < now).`,
      );
    }
  }

  /**
   * Purge AuditLog entries older than the retention window (runs daily at 3am UTC).
   * The Postgres AuditLog table is the sole authoritative store for audit events.
   * Retention period is configurable via AUDIT_LOG_RETENTION_DAYS (default: 90).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeOldAuditLogs(): Promise<void> {
    const retentionDays = this.parseRetentionDays();
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const result = await this.prisma.auditLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    if (result.count > 0) {
      this.logger.log(
        `Deleted ${result.count} AuditLog row(s) older than ${retentionDays} day(s) (createdAt < ${cutoff.toISOString()}).`,
      );
    }
  }

  private parseRetentionDays(): number {
    const raw = this.config.get<string>('AUDIT_LOG_RETENTION_DAYS');
    const parsed = raw ? Number.parseInt(raw, 10) : NaN;
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_AUDIT_LOG_RETENTION_DAYS;
  }

  /** Downgrade subscriptions past grace period (daily at 8am UTC). */
  @Cron('0 8 * * *')
  async downgradeExpiredGracePeriods(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.subscription.findMany({
      where: {
        gracePeriodEndsAt: { lt: now },
        plan: { not: SubscriptionPlan.FREE },
      },
      select: { id: true, workspaceId: true },
    });
    if (expired.length === 0) return;

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { id: sub.id },
        data: {
          plan: SubscriptionPlan.FREE,
          gracePeriodEndsAt: null,
          seats: 1,
          screenLimit: 1,
        },
      });
    }
    this.logger.log(
      `Downgraded ${expired.length} subscription(s) past grace period to FREE.`,
    );
  }

  /** Purge expired media files (daily at 4am UTC). */
  @Cron('0 4 * * *')
  async purgeExpiredMedia(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.media.findMany({
      where: { expiresAt: { lt: now } },
      select: { id: true, relativePath: true },
    });
    if (expired.length === 0) return;

    for (const media of expired) {
      await this.storage.delete(media.relativePath).catch(() => {
        /* file already gone */
      });
      await this.prisma.media.delete({ where: { id: media.id } }).catch(() => {
        /* row already gone */
      });
    }
    this.logger.log(
      `Purged ${expired.length} expired media item(s) (expiresAt < ${now.toISOString()}).`,
    );
  }
}
