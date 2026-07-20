import {
  BadRequestException,
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
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkspaceAuthHelper } from '../../common/auth/workspace-auth.helper';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { PairingLockoutService } from './pairing-lockout.service';
import { ClaimPairingSessionDto } from './dto/claim-pairing-session.dto';
import { StartPairingSessionDto } from './dto/start-pairing-session.dto';

@Injectable()
export class PairingService {
  private readonly logger = new Logger(PairingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceAuth: WorkspaceAuthHelper,
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly lockout: PairingLockoutService,
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
    await this.workspaceAuth.assertAccess({
      workspaceId,
      userId,
      requireAdmin: true,
      forbiddenMessage: 'Only owners and admins can claim a pairing code',
    });
  }

  private async assertWithinScreenLimitTx(
    tx: Prisma.TransactionClient,
    workspaceId: string,
  ): Promise<void> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${workspaceId}))`;

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
          this.eventEmitter.emit(PlatformEvents.PAIRING_STARTED, {
            workspaceId: notifyWorkspaceId,
            payload: {
              sessionId: row.id,
              expiresAt: row.expiresAt.toISOString(),
              source: 'player',
              at: now.toISOString(),
            },
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
    await this.lockout.assertNotLockedOut(userId, workspaceId, ip);

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

        if (dto.playlistGroupId) {
          const pl = await tx.playlist.findFirst({
            where: { id: dto.playlistGroupId, workspaceId },
            select: { id: true },
          });
          if (!pl) {
            throw DomainException.badRequest(
              ErrorCode.BAD_REQUEST,
              'Playlist not found in workspace',
            );
          }
        }

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
            ...(dto.playlistGroupId
              ? { playlistGroupId: dto.playlistGroupId }
              : {}),
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

      await this.lockout.clearFailedAttempts(userId);

      const { session, screen } = result;
      this.eventEmitter.emit(PlatformEvents.PAIRING_SESSION_COMPLETE, {
        sessionId: session.id,
        payload: {
          sessionId: session.id,
          screenId: screen.id,
          serialNumber: screen.serialNumber,
          workspaceId,
          playerPlatform: screen.playerPlatform,
          resolutionWidth: screen.resolutionWidth,
          resolutionHeight: screen.resolutionHeight,
          at: new Date().toISOString(),
        },
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
        await this.lockout.recordFailedAttempt(userId, workspaceId, ip);
      }
      throw err;
    }
  }
}
