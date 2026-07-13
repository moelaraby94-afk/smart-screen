import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PlayerPlatform,
  Prisma,
  ScreenPairingSessionStatus,
  ScreenStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { ClaimPairingSessionDto } from './dto/claim-pairing-session.dto';
import { StartPairingSessionDto } from './dto/start-pairing-session.dto';

/** Wrong-code claim attempts are counted within this rolling window. */
const LOCKOUT_FAILURE_WINDOW_MS = 10 * 60 * 1000;
/** How long a user is locked out of claim once the failure threshold is hit. */
const LOCKOUT_DURATION_MS = 30 * 60 * 1000;
/** Wrong-code attempts allowed within the window before lockout kicks in. */
const LOCKOUT_MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class PairingService {
  private readonly logger = new Logger(PairingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly heartbeat: ScreenHeartbeatService,
  ) {}

  private pairingTtlMs(): number {
    const raw = this.config.get<string>('PAIRING_SESSION_TTL_MS', '900000');
    const n = Number(raw);
    return Number.isFinite(n) && n > 60_000 && n < 86_400_000 ? n : 900_000;
  }

  private async assertWorkspaceAdmin(
    workspaceId: string,
    userId: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isSuperAdmin: true },
    });
    if (user?.isSuperAdmin) return;
    const membership = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { role: true },
    });
    if (!membership) throw new NotFoundException('Workspace not found');
    if (
      membership.role !== UserRole.OWNER &&
      membership.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only owners and admins can claim a pairing code',
      );
    }
  }

  /**
   * Throws while the user is locked out from a prior burst of wrong-code claim
   * guesses. Independent of the per-minute ThrottlerGuard on the route — this
   * survives across throttle windows (30 min vs. 60 s).
   */
  private async assertClaimNotLockedOut(
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
   * {@link LOCKOUT_DURATION_MS}. Only called after {@link assertClaimNotLockedOut}
   * has already passed, so any `lockedUntil` seen here is stale (in the past).
   */
  private async recordFailedClaimAttempt(
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

  private async clearFailedClaimAttempts(userId: string): Promise<void> {
    await this.prisma.pairingClaimLockout.deleteMany({ where: { userId } });
  }

  private async assertWithinScreenLimitTx(
    tx: Prisma.TransactionClient,
    workspaceId: string,
  ): Promise<void> {
    const sub = await tx.subscription.findUnique({
      where: { workspaceId },
      select: { screenLimit: true },
    });
    const limit = sub?.screenLimit ?? 25;
    const count = await tx.screen.count({ where: { workspaceId } });
    if (count >= limit) {
      throw DomainException.badRequest(
        ErrorCode.SCREEN_LIMIT_REACHED,
        `Workspace already has ${count} of ${limit} allowed screens`,
        { limit, current: count },
      );
    }
  }

  private makeSixDigitCode(): string {
    return String(randomInt(100_000, 1_000_000));
  }

  private makePollSecret(): string {
    return randomBytes(24).toString('base64url');
  }

  /** Per-screen secret replacing the shared PLAYER_HEARTBEAT_SECRET. */
  private makeScreenSecret(): string {
    return randomBytes(32).toString('base64url');
  }

  private async makeUniqueSerialTx(
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    for (let i = 0; i < 24; i += 1) {
      const serial = `CS-${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
      const exists = await tx.screen.findUnique({
        where: { serialNumber: serial },
        select: { id: true },
      });
      if (!exists) return serial;
    }
    throw new BadRequestException('Could not allocate serial number');
  }

  async startSession(dto: StartPairingSessionDto, secretHeader?: string) {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.pairingTtlMs());
    const playerPlatform = dto.playerPlatform ?? PlayerPlatform.WEB;
    const resolutionWidth = dto.resolutionWidth ?? 1920;
    const resolutionHeight = dto.resolutionHeight ?? 1080;

    const notifyWorkspaceId = dto.workspaceId?.trim();
    if (notifyWorkspaceId) {
      const expected = this.config.get<string>(
        'PLAYER_HEARTBEAT_SECRET',
        'dev-player-heartbeat-secret',
      );
      if (!secretHeader || secretHeader !== expected) {
        throw new UnauthorizedException(
          'x-player-secret required when workspaceId is set',
        );
      }
      const ws = await this.prisma.workspace.findUnique({
        where: { id: notifyWorkspaceId },
        select: { id: true },
      });
      if (!ws) {
        throw new BadRequestException('Unknown workspaceId for pairing notify');
      }
    }

    for (let attempt = 0; attempt < 32; attempt += 1) {
      const code = this.makeSixDigitCode();
      const pollSecret = this.makePollSecret();
      try {
        const row = await this.prisma.screenPairingSession.create({
          data: {
            code,
            pollSecret,
            status: ScreenPairingSessionStatus.PENDING,
            expiresAt,
            playerPlatform,
            resolutionWidth,
            resolutionHeight,
            /**
             * When the player already knows its workspace (e.g. re-pairing
             * from a dashboard-initiated flow), pin the session to that
             * workspace so no other tenant can claim the code.
             */
            ...(notifyWorkspaceId ? { workspaceId: notifyWorkspaceId } : {}),
          },
          select: {
            id: true,
            code: true,
            pollSecret: true,
            expiresAt: true,
          },
        });
        if (notifyWorkspaceId) {
          this.heartbeat.emitPairingStarted(notifyWorkspaceId, {
            sessionId: row.id,
            expiresAt: row.expiresAt.toISOString(),
            source: 'player',
            at: now.toISOString(),
          });
        }
        return {
          sessionId: row.id,
          pairingCode: row.code,
          pollSecret: row.pollSecret,
          expiresAt: row.expiresAt.toISOString(),
        };
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue;
        }
        throw e;
      }
    }
    throw new BadRequestException('Could not allocate pairing code');
  }

  async pollSession(sessionId: string, pollSecret: string | undefined) {
    if (!pollSecret?.trim()) {
      throw new NotFoundException('Session not found');
    }
    const row = await this.prisma.screenPairingSession.findFirst({
      where: { id: sessionId, pollSecret: pollSecret.trim() },
      select: {
        id: true,
        status: true,
        expiresAt: true,
        screenId: true,
        workspaceId: true,
        screenSecretHandoff: true,
        screen: {
          select: { serialNumber: true },
        },
      },
    });
    if (!row) throw new NotFoundException('Session not found');

    const now = new Date();
    if (
      row.status === ScreenPairingSessionStatus.PENDING &&
      row.expiresAt < now
    ) {
      await this.prisma.screenPairingSession.updateMany({
        where: {
          id: row.id,
          status: ScreenPairingSessionStatus.PENDING,
        },
        data: { status: ScreenPairingSessionStatus.EXPIRED },
      });
      return {
        status: 'expired' as const,
        expiresAt: row.expiresAt.toISOString(),
      };
    }

    if (row.status === ScreenPairingSessionStatus.COMPLETE && row.screen) {
      /**
       * One-time handoff: the per-screen secret is only ever readable here,
       * on whichever poll is first to claim it. The atomic updateMany guard
       * (matching on the still-non-null value) ensures a concurrent poll
       * can't also receive it once one request has cleared it.
       */
      let screenSecret: string | null = null;
      if (row.screenSecretHandoff) {
        const claimed = await this.prisma.screenPairingSession.updateMany({
          where: { id: row.id, screenSecretHandoff: { not: null } },
          data: { screenSecretHandoff: null },
        });
        if (claimed.count > 0) {
          screenSecret = row.screenSecretHandoff;
        }
      }
      return {
        status: 'complete' as const,
        screenId: row.screenId,
        workspaceId: row.workspaceId,
        serialNumber: row.screen.serialNumber,
        screenSecret,
      };
    }

    if (row.status !== ScreenPairingSessionStatus.PENDING) {
      return {
        status: row.status.toLowerCase() as 'expired' | 'cancelled',
        expiresAt: row.expiresAt.toISOString(),
      };
    }

    return {
      status: 'pending' as const,
      expiresAt: row.expiresAt.toISOString(),
    };
  }

  async claimSession(
    workspaceId: string,
    userId: string,
    dto: ClaimPairingSessionDto,
    ip?: string,
  ) {
    await this.assertClaimNotLockedOut(userId, workspaceId, ip);

    try {
      await this.assertWorkspaceAdmin(workspaceId, userId);
      const code = dto.code.trim();
      const now = new Date();

      const result = await this.prisma.$transaction(async (tx) => {
        const session = await tx.screenPairingSession.findFirst({
          where: {
            code,
            status: ScreenPairingSessionStatus.PENDING,
            expiresAt: { gt: now },
            /**
             * Tenant isolation: if the session was pinned to a workspace
             * at start time, only that workspace may claim it. Sessions
             * with workspaceId = null are unrestricted (player-initiated
             * pairing without a prior workspace context).
             */
            OR: [{ workspaceId: null }, { workspaceId }],
          },
        });
        if (!session) {
          throw DomainException.badRequest(
            ErrorCode.INVALID_OR_EXPIRED_PAIRING_CODE,
            'Invalid or expired pairing code',
          );
        }

        await this.assertWithinScreenLimitTx(tx, workspaceId);

        const serialNumber = await this.makeUniqueSerialTx(tx);
        const screenName =
          dto.name?.trim() || `Screen ${serialNumber.slice(-6).toUpperCase()}`;

        const rawScreenSecret = this.makeScreenSecret();
        const pairingSecretHash = await bcrypt.hash(rawScreenSecret, 12);

        const screen = await tx.screen.create({
          data: {
            workspaceId,
            name: screenName,
            serialNumber,
            status: ScreenStatus.OFFLINE,
            playerPlatform: session.playerPlatform,
            resolutionWidth: session.resolutionWidth,
            resolutionHeight: session.resolutionHeight,
            pairingSecretHash,
          },
          select: {
            id: true,
            serialNumber: true,
            name: true,
            playerPlatform: true,
            resolutionWidth: true,
            resolutionHeight: true,
          },
        });

        await tx.screenPairingSession.update({
          where: { id: session.id },
          data: {
            status: ScreenPairingSessionStatus.COMPLETE,
            workspaceId,
            screenId: screen.id,
            screenSecretHandoff: rawScreenSecret,
          },
        });

        return { session, screen };
      });

      await this.clearFailedClaimAttempts(userId);

      const { session, screen } = result;
      this.heartbeat.emitPairingSessionComplete(session.id, {
        sessionId: session.id,
        screenId: screen.id,
        serialNumber: screen.serialNumber,
        workspaceId,
        playerPlatform: screen.playerPlatform,
        resolutionWidth: screen.resolutionWidth,
        resolutionHeight: screen.resolutionHeight,
        at: new Date().toISOString(),
      });

      return {
        workspaceId,
        sessionId: session.id,
        screen,
      };
    } catch (err) {
      /**
       * Match on the code, not the message. The counter used to compare
       * `err.message === 'INVALID_OR_EXPIRED_PAIRING_CODE'`, which would have
       * silently stopped counting the moment that message was reworded.
       */
      const isWrongCode =
        err instanceof DomainException &&
        err.code === ErrorCode.INVALID_OR_EXPIRED_PAIRING_CODE;

      this.logger.warn(
        `Pairing claim failed userId=${userId} workspaceId=${workspaceId} ` +
          `reason=${err instanceof DomainException ? err.code : String(err)}`,
      );
      if (isWrongCode) {
        await this.recordFailedClaimAttempt(userId, workspaceId, ip);
      }
      throw err;
    }
  }
}
