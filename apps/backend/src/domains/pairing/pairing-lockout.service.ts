import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/** Wrong-code claim attempts are counted within this rolling window. */
const LOCKOUT_FAILURE_WINDOW_MS = 10 * 60 * 1000;
/** How long a user is locked out of claim once the failure threshold is hit. */
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;
/** Wrong-code attempts allowed within the window before lockout kicks in. */
const LOCKOUT_MAX_FAILED_ATTEMPTS = 5;

/**
 * Pairing claim lockout logic: tracks failed claim attempts and enforces
 * a rolling lockout window to prevent brute-force pairing code guessing.
 * Extracted from PairingService to reduce file size and improve cohesion.
 */
@Injectable()
export class PairingLockoutService {
  private readonly logger = new Logger(PairingLockoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Throws while the user is locked out from a prior burst of wrong-code claim
   * guesses. Independent of the per-minute ThrottlerGuard on the route — this
   * survives across throttle windows (30 min vs. 60 s).
   */
  async assertNotLockedOut(
    userId: string,
    workspaceId: string,
    ip?: string,
  ): Promise<void> {
    const lockout = await this.prisma.pairingClaimLockout.findUnique({
      where: { userId_ip: { userId, ip: ip ?? 'unknown' } },
    });
    const now = new Date();
    if (lockout?.lockedUntil && lockout.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil(
        (lockout.lockedUntil.getTime() - now.getTime()) / 1000,
      );
      this.logger.warn(
        `Pairing claim failed userId=${userId} workspaceId=${workspaceId} reason=LOCKED_OUT retryAfterSeconds=${retryAfterSeconds}`,
      );
      throw DomainException.tooManyRequests(
        ErrorCode.TOO_MANY_FAILED_PAIRING_ATTEMPTS,
        'Too many failed pairing attempts',
        { retryAfterSeconds },
      );
    }
  }

  /**
   * Records a wrong/expired-code claim guess and, once
   * {@link LOCKOUT_MAX_FAILED_ATTEMPTS} is hit inside the rolling
   * {@link LOCKOUT_FAILURE_WINDOW_MS} window, locks the user out of claim for
   * {@link LOCKOUT_DURATION_MS}. Only called after {@link assertNotLockedOut}
   * has already passed, so any `lockedUntil` seen here is stale (in the past).
   */
  async recordFailedAttempt(
    userId: string,
    workspaceId: string,
    ip?: string,
  ): Promise<void> {
    const now = new Date();
    const existing = await this.prisma.pairingClaimLockout.findUnique({
      where: { userId_ip: { userId, ip: ip ?? 'unknown' } },
    });

    const windowExpired =
      !existing ||
      now.getTime() - existing.windowStartAt.getTime() >
        LOCKOUT_FAILURE_WINDOW_MS;

    const failedCount = windowExpired ? 1 : existing.failedCount + 1;
    const windowStartAt = windowExpired ? now : existing.windowStartAt;
    const lockedUntil =
      failedCount >= LOCKOUT_MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
        : null;

    await this.prisma.pairingClaimLockout.upsert({
      where: { userId_ip: { userId, ip: ip ?? 'unknown' } },
      create: {
        userId,
        ip: ip ?? 'unknown',
        failedCount,
        windowStartAt,
        lockedUntil,
      },
      update: { failedCount, windowStartAt, lockedUntil },
    });

    this.logger.warn(
      `Pairing claim failed userId=${userId} workspaceId=${workspaceId} reason=INVALID_OR_EXPIRED_PAIRING_CODE ` +
        `failedCount=${failedCount}/${LOCKOUT_MAX_FAILED_ATTEMPTS}${lockedUntil ? ' -> LOCKED for 30m' : ''}`,
    );
  }

  async clearFailedAttempts(userId: string): Promise<void> {
    await this.prisma.pairingClaimLockout.deleteMany({ where: { userId } });
  }
}
