import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { PlayerSecretGuard } from '../player/player-secret.guard';
import { PrismaService } from '../../common/prisma/prisma.service';

@SkipThrottle()
@Controller({ path: ['player/telemetry'] })
export class PlayerTelemetryController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(PlayerSecretGuard)
  @Post('proof-of-play')
  async recordProofOfPlay(
    @Query('serialNumber') serialNumber: string | undefined,
    @Body() body: {
      screenId: string;
      workspaceId: string;
      contentType: string;
      contentId?: string;
      contentName?: string;
      playlistId?: string;
      durationSec?: number;
    },
  ) {
    await this.prisma.proofOfPlay.create({
      data: {
        workspaceId: body.workspaceId,
        screenId: body.screenId,
        contentType: body.contentType,
        contentId: body.contentId,
        contentName: body.contentName,
        playlistId: body.playlistId,
        durationSec: body.durationSec ?? 0,
      },
    });
    return { ok: true };
  }

  @UseGuards(PlayerSecretGuard)
  @Post('command-ack')
  async recordCommandAck(
    @Query('serialNumber') serialNumber: string | undefined,
    @Body() body: {
      screenId: string;
      command: string;
      messageId: string;
      status?: string;
      errorMessage?: string;
    },
  ) {
    await this.prisma.commandAck.create({
      data: {
        screenId: body.screenId,
        command: body.command,
        messageId: body.messageId,
        status: body.status ?? 'RECEIVED',
        errorMessage: body.errorMessage,
      },
    });
    return { ok: true };
  }

  @SkipThrottle({ default: false })
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('crash-report')
  async recordCrashReport(
    @Body() body: {
      screenId?: string;
      workspaceId?: string;
      playerVersion?: string;
      platform?: string;
      stackTrace: string;
      diagnostics?: Record<string, unknown>;
    },
    @Headers('x-forwarded-for') forwardedFor?: string,
  ) {
    await this.prisma.crashReport.create({
      data: {
        screenId: body.screenId,
        workspaceId: body.workspaceId,
        playerVersion: body.playerVersion,
        platform: body.platform,
        stackTrace: body.stackTrace,
        diagnostics: (body.diagnostics ?? undefined) as any,
        ipAddress: forwardedFor?.split(',')[0]?.trim(),
      },
    });
    return { ok: true };
  }

  @UseGuards(PlayerSecretGuard)
  @Get('ota-update')
  async checkOtaUpdate(
    @Query('serialNumber') serialNumber: string | undefined,
    @Query('currentVersion') currentVersion?: string,
    @Query('platform') platform?: string,
  ) {
    const where: Record<string, unknown> = { isPublished: true };
    if (platform) {
      where.OR = [
        { platform: 'ALL' },
        { platform },
      ];
    }
    const updates = await this.prisma.playerOtaUpdate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (updates.length === 0) {
      return { updateAvailable: false };
    }
    const update = updates[0];
    if (currentVersion && update.version === currentVersion) {
      return { updateAvailable: false };
    }
    if (currentVersion && update.minVersion) {
      const cmp = this.compareVersions(currentVersion, update.minVersion);
      if (cmp < 0) {
        return {
          updateAvailable: false,
          reason: 'current version below minimum required',
        };
      }
    }
    return {
      updateAvailable: true,
      version: update.version,
      downloadUrl: update.downloadUrl,
      checksum: update.checksum,
      releaseNotes: update.releaseNotes,
      isMandatory: update.isMandatory,
    };
  }

  @UseGuards(PlayerSecretGuard)
  @Get('content-manifest')
  async getContentManifest(
    @Query('serialNumber') serialNumber: string | undefined,
    @Query('screenId') screenId?: string,
  ) {
    if (!screenId) {
      return { manifest: [], error: 'screenId required' };
    }
    const screen = await this.prisma.screen.findUnique({
      where: { id: screenId },
      select: {
        id: true,
        workspaceId: true,
        activePlaylistId: true,
        overridePlaylistId: true,
        overrideExpiresAt: true,
      },
    });
    if (!screen) {
      return { manifest: [], error: 'screen not found' };
    }
    const playlistId = screen.overridePlaylistId ?? screen.activePlaylistId;
    if (!playlistId) {
      return { manifest: [] };
    }
    const items = await this.prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { orderIndex: 'asc' },
      include: {
        media: { select: { id: true, fileName: true, relativePath: true, mimeType: true, sizeBytes: true } },
        canvas: { select: { id: true, name: true, layoutData: true } },
      },
    });
    const manifest = items.map((item) => {
      if (item.media) {
        return {
          type: 'MEDIA',
          id: item.media.id,
          fileName: item.media.fileName,
          path: item.media.relativePath,
          mimeType: item.media.mimeType,
          sizeBytes: item.media.sizeBytes,
          durationSec: item.durationSec,
        };
      }
      if (item.canvas) {
        return {
          type: 'CANVAS',
          id: item.canvas.id,
          name: item.canvas.name,
          layoutData: item.canvas.layoutData,
          durationSec: item.durationSec,
        };
      }
      return {
        type: 'UNKNOWN',
        id: item.id,
        durationSec: item.durationSec,
      };
    });
    return {
      screenId: screen.id,
      playlistId,
      manifest,
      generatedAt: new Date().toISOString(),
    };
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const va = partsA[i] ?? 0;
      const vb = partsB[i] ?? 0;
      if (va > vb) return 1;
      if (va < vb) return -1;
    }
    return 0;
  }
}
