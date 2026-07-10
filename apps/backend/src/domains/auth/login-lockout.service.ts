import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';

/** Failed sign-ins are counted within this rolling window. */
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
/** How long an account is locked once the threshold is hit. */
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
/**
 * Attempts allowed within the window before lockout. Higher than the pairing
 * lockout's 5, because a legitimate person mistyping a password is common and a
 * sign-in wall is more disruptive than a pairing one.
 */
const MAX_FAILED_ATTEMPTS = 10;

/**
 * Per-account brute-force defence for sign-in.
 *
 * Rate limiting is per IP, so a distributed attempt against one account, or one
 * from an office behind a single NAT, is otherwise unbounded. This counter is
 * keyed on the submitted email — existing or not — so it cannot be used to tell
 * whether an account exists: every email locks identically.
 */
@Injectable()
export class LoginLockoutService {
  private readonly logger = new Logger(LoginLockoutService.name);

  constructor(private readonly prisma: PrismaService) {}

  private normalize(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * Throws {@link ErrorCode.TOO_MANY_LOGIN_ATTEMPTS} while the account is locked.
   * Call before verifying the password.
   */
  async assertNotLockedOut(emailRaw: string): Promise<void> {
    const email = this.normalize(emailRaw);
    const lockout = await this.prisma.loginLockout.findUnique({
      where: { email },
    });
    const now = new Date();
    if (lockout?.lockedUntil && lockout.lockedUntil > now) {
      const retryAfterSeconds = Math.ceil(
        (lockout.lockedUntil.getTime() - now.getTime()) / 1000,
      );
      this.logger.warn(
        `Sign-in refused for ${email} reason=LOCKED_OUT retryAfterSeconds=${retryAfterSeconds}`,
      );
      throw DomainException.tooManyRequests(
        ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
        'Too many failed sign-in attempts',
        { retryAfterSeconds },
      );
    }
  }

  /**
   * Records a failed attempt and locks the account once the threshold is hit
   * inside the rolling window. Only called after {@link assertNotLockedOut} has
   * passed, so any `lockedUntil` seen here is already in the past.
   */
  async recordFailedAttempt(emailRaw: string): Promise<void> {
    const email = this.normalize(emailRaw);
    const now = new Date();
    const existing = await this.prisma.loginLockout.findUnique({
      where: { email },
    });

    const windowExpired =
      !existing ||
      now.getTime() - existing.windowStartAt.getTime() > FAILURE_WINDOW_MS;

    const failedCount = windowExpired ? 1 : existing.failedCount + 1;
    const windowStartAt = windowExpired ? now : existing.windowStartAt;
    const lockedUntil =
      failedCount >= MAX_FAILED_ATTEMPTS
        ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
        : null;

    await this.prisma.loginLockout.upsert({
      where: { email },
      create: { email, failedCount, windowStartAt, lockedUntil },
      update: { failedCount, windowStartAt, lockedUntil },
    });

    if (lockedUntil) {
      this.logger.warn(
        `Account ${email} locked after ${failedCount} failed sign-ins`,
      );
    }
  }

  /** Clears the counter after a successful sign-in. */
  async clear(emailRaw: string): Promise<void> {
    await this.prisma.loginLockout.deleteMany({
      where: { email: this.normalize(emailRaw) },
    });
  }
}
