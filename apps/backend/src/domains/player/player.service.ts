import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { CanvasesService } from '../canvases/canvases.service';
import { PlaylistsService } from '../playlists/playlists.service';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly playlists: PlaylistsService,
    private readonly canvases: CanvasesService,
  ) {}

  /**
   * Validates the per-screen secret against Screen.pairingSecretHash.
   * Screens paired before per-screen secrets existed have no hash yet —
   * for those only, fall back to the shared PLAYER_HEARTBEAT_SECRET and log
   * a warning, so the fallback's usage stays visible until every screen has
   * been re-paired and it can be retired.
   */
  private async assertPlayerSecretForScreen(
    screen: {
      id: string;
      serialNumber: string;
      pairingSecretHash: string | null;
    },
    secret: string | undefined,
  ): Promise<void> {
    if (!secret) {
      throw new UnauthorizedException('Invalid player credentials');
    }
    if (screen.pairingSecretHash) {
      const isValid = await bcrypt.compare(secret, screen.pairingSecretHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid player credentials');
      }
      return;
    }
    const sharedSecret = this.config.get<string>(
      'PLAYER_HEARTBEAT_SECRET',
      'dev-player-heartbeat-secret',
    );
    if (secret !== sharedSecret) {
      throw new UnauthorizedException('Invalid player credentials');
    }
    this.logger.warn(
      `Screen ${screen.serialNumber} (${screen.id}) authenticated via the ` +
        'shared PLAYER_HEARTBEAT_SECRET fallback (no per-screen secret set). ' +
        'Re-pair this screen to retire the shared-secret fallback.',
    );
  }

  /**
   * Initial load + offline recovery: playlist payload, ticker, screen id.
   */
  async getBootstrap(
    serialNumber: string | undefined,
    secret: string | undefined,
  ) {
    if (!serialNumber?.trim()) {
      throw new NotFoundException('serialNumber is required');
    }

    const screen = await this.prisma.screen.findFirst({
      where: { serialNumber: serialNumber.trim() },
      select: {
        id: true,
        serialNumber: true,
        workspaceId: true,
        playerTicker: true,
        orientation: true,
        pairingSecretHash: true,
        workspace: { select: { isPaused: true, name: true } },
      },
    });
    if (!screen) {
      throw new NotFoundException('Screen not found');
    }
    await this.assertPlayerSecretForScreen(screen, secret);
    if (screen.workspace.isPaused) {
      throw DomainException.forbidden(
        ErrorCode.WORKSPACE_PAUSED,
        'Workspace is paused',
      );
    }

    const playlist = await this.playlists.getPlaylistPayloadForScreen(
      screen.id,
    );

    return {
      screenId: screen.id,
      serialNumber: screen.serialNumber,
      workspaceId: screen.workspaceId,
      workspaceName: screen.workspace.name,
      ticker: screen.playerTicker ?? null,
      orientation: screen.orientation,
      playlist: playlist ?? {
        workspaceId: screen.workspaceId,
        screenId: screen.id,
        playlistId: null,
        name: null,
        items: [],
      },
    };
  }

  /**
   * Compiled canvas JSON for a screen's workspace (kiosk auth).
   */
  async getCompiledCanvas(
    serialNumber: string | undefined,
    secret: string | undefined,
    canvasId: string,
  ) {
    if (!serialNumber?.trim()) {
      throw new NotFoundException('serialNumber is required');
    }

    const screen = await this.prisma.screen.findFirst({
      where: { serialNumber: serialNumber.trim() },
      select: {
        id: true,
        serialNumber: true,
        workspaceId: true,
        pairingSecretHash: true,
        workspace: { select: { isPaused: true } },
      },
    });
    if (!screen) {
      throw new NotFoundException('Screen not found');
    }
    await this.assertPlayerSecretForScreen(screen, secret);
    if (screen.workspace.isPaused) {
      throw DomainException.forbidden(
        ErrorCode.WORKSPACE_PAUSED,
        'Workspace is paused',
      );
    }

    return this.canvases.getCompiledForPlayer(screen.workspaceId, canvasId);
  }

  /**
   * Dashboard / player dev: load playlist for first screen in a workspace using JWT (Bearer).
   */
  async getBootstrapForAuthenticatedUser(
    user: JwtUser,
    workspaceId: string | undefined,
    workspaceName: string | undefined,
  ) {
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { id: true, isSuperAdmin: true },
    });
    if (!dbUser) throw new UnauthorizedException();

    let ws = null as { id: string; isPaused: boolean; name: string } | null;
    if (workspaceId?.trim()) {
      ws = await this.prisma.workspace.findFirst({
        where: { id: workspaceId.trim() },
        select: { id: true, isPaused: true, name: true },
      });
    } else if (workspaceName?.trim()) {
      ws = await this.prisma.workspace.findFirst({
        where: { name: workspaceName.trim() },
        select: { id: true, isPaused: true, name: true },
      });
    } else {
      ws = await this.prisma.workspace.findFirst({
        where: { name: 'Admin Control' },
        select: { id: true, isPaused: true, name: true },
      });
    }
    if (!ws) throw new NotFoundException('Workspace not found');
    if (ws.isPaused) {
      throw DomainException.forbidden(
        ErrorCode.WORKSPACE_PAUSED,
        'Workspace is paused',
      );
    }

    if (!dbUser.isSuperAdmin) {
      const m = await this.prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId: ws.id, userId: user.sub },
        },
      });
      if (!m) throw new ForbiddenException('No access to this workspace');
    }

    const screen = await this.prisma.screen.findFirst({
      where: { workspaceId: ws.id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        serialNumber: true,
        workspaceId: true,
        playerTicker: true,
        orientation: true,
      },
    });
    if (!screen) throw new NotFoundException('No screen in workspace');

    const playlist = await this.playlists.getPlaylistPayloadForScreen(
      screen.id,
    );

    return {
      screenId: screen.id,
      serialNumber: screen.serialNumber,
      workspaceId: screen.workspaceId,
      workspaceName: ws.name,
      ticker: screen.playerTicker ?? null,
      orientation: screen.orientation,
      playlist: playlist ?? {
        workspaceId: screen.workspaceId,
        screenId: screen.id,
        playlistId: null,
        name: null,
        items: [],
      },
    };
  }
}
