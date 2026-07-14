import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ScreenStatus } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { buildPage } from '../../common/pagination/page';
import { skipFor } from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { SchedulingService } from '../schedules/scheduling.service';
import { CreateScreenDto } from './dto/create-screen.dto';
import { ListScreensDto } from './dto/list-screens.dto';
import { OverrideScreenDto } from './dto/override-screen.dto';
import { UpdateScreenDto } from './dto/update-screen.dto';
import { RemoteCommandDto } from './dto/remote-command.dto';

@Injectable()
export class ScreensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly playlistsService: PlaylistsService,
    private readonly heartbeat: ScreenHeartbeatService,
    private readonly scheduling: SchedulingService,
  ) {}

  /** Blocks creation when the workspace already has `subscription.screenLimit` screens. */
  async assertWithinScreenLimit(workspaceId: string): Promise<void> {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
      select: { screenLimit: true },
    });
    const limit = sub?.screenLimit ?? 25;
    const count = await this.prisma.screen.count({ where: { workspaceId } });
    if (count >= limit) {
      /**
       * The limit travels as structured data. It used to be interpolated into
       * the message (`SCREEN_LIMIT_REACHED:25`) and pulled back apart in the
       * browser by `parseScreenLimitFromApiMessage`.
       */
      throw DomainException.badRequest(
        ErrorCode.SCREEN_LIMIT_REACHED,
        `Workspace already has ${count} of ${limit} allowed screens`,
        { limit, current: count },
      );
    }
  }

  async create(dto: CreateScreenDto) {
    await this.assertWithinScreenLimit(dto.workspaceId);

    let playlistGroupId: string | null | undefined =
      dto.playlistGroupId ?? undefined;
    if (playlistGroupId === '') playlistGroupId = null;
    if (playlistGroupId) {
      const pl = await this.prisma.playlist.findFirst({
        where: { id: playlistGroupId, workspaceId: dto.workspaceId },
      });
      if (!pl) throw new BadRequestException('Playlist not found in workspace');
    }

    return this.prisma.screen.create({
      data: {
        workspaceId: dto.workspaceId,
        name: dto.name,
        serialNumber: dto.serialNumber,
        location: dto.location,
        status: ScreenStatus.OFFLINE,
        ...(dto.playerPlatform !== undefined
          ? { playerPlatform: dto.playerPlatform }
          : {}),
        ...(dto.resolutionWidth !== undefined
          ? { resolutionWidth: dto.resolutionWidth }
          : {}),
        ...(dto.resolutionHeight !== undefined
          ? { resolutionHeight: dto.resolutionHeight }
          : {}),
        ...(playlistGroupId !== undefined ? { playlistGroupId } : {}),
      },
      select: this.screenSelect,
    });
  }

  async list(dto: ListScreensDto) {
    const groupFilter: Prisma.ScreenWhereInput = {};
    if (dto.ungrouped) {
      groupFilter.playlistGroupId = null;
    } else if (dto.playlistGroupId) {
      groupFilter.playlistGroupId = dto.playlistGroupId;
    }

    const where: Prisma.ScreenWhereInput = {
      workspaceId: dto.workspaceId,
      ...(dto.status ? { status: dto.status } : {}),
      ...groupFilter,
    };
    const [items, total] = await Promise.all([
      this.prisma.screen.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: skipFor(dto),
        take: dto.limit,
        select: this.screenSelect,
      }),
      this.prisma.screen.count({ where }),
    ]);

    return buildPage(items, total, dto);
  }

  async getById(workspaceId: string, id: string) {
    const screen = await this.prisma.screen.findFirst({
      where: { id, workspaceId },
      select: this.screenSelect,
    });
    if (!screen) throw new NotFoundException('Screen not found');
    return screen;
  }

  async getActiveContent(workspaceId: string, screenId: string) {
    await this.getById(workspaceId, screenId);
    const resolved = await this.scheduling.resolveEffectivePlaylistId(
      screenId,
      new Date(),
    );
    const playlist =
      await this.playlistsService.getPlaylistPayloadForScreen(screenId);
    return {
      effectivePlaylistId: resolved.playlistId,
      source: resolved.source,
      playlist,
    };
  }

  async setPlaylistOverride(
    workspaceId: string,
    screenId: string,
    dto: OverrideScreenDto,
  ) {
    await this.getById(workspaceId, screenId);
    const durationMin = dto.durationMinutes ?? 480;
    let overridePlaylistId: string | null = null;
    let overrideExpiresAt: Date | null = null;

    if (dto.playlistId === null || dto.playlistId === '') {
      overridePlaylistId = null;
      overrideExpiresAt = null;
    } else if (dto.playlistId) {
      const pl = await this.prisma.playlist.findFirst({
        where: { id: dto.playlistId, workspaceId },
      });
      if (!pl) throw new BadRequestException('Playlist not found in workspace');
      overridePlaylistId = dto.playlistId;
      overrideExpiresAt = new Date(Date.now() + durationMin * 60_000);
    } else {
      throw new BadRequestException(
        'playlistId is required, or pass null to clear',
      );
    }

    const updated = await this.prisma.screen.update({
      where: { id: screenId },
      data: { overridePlaylistId, overrideExpiresAt },
      select: this.screenSelect,
    });

    await this.playlistsService.emitPlaylistForScreen(screenId);
    return updated;
  }

  async update(workspaceId: string, id: string, dto: UpdateScreenDto) {
    await this.getById(workspaceId, id);
    if (dto.activePlaylistId !== undefined) {
      if (dto.activePlaylistId === null || dto.activePlaylistId === '') {
        /* clear */
      } else {
        const pl = await this.prisma.playlist.findFirst({
          where: { id: dto.activePlaylistId, workspaceId },
        });
        if (!pl)
          throw new BadRequestException('Playlist not found in workspace');
      }
    }
    if (dto.playlistGroupId !== undefined) {
      if (dto.playlistGroupId === null || dto.playlistGroupId === '') {
        /* clear */
      } else {
        const pl = await this.prisma.playlist.findFirst({
          where: { id: dto.playlistGroupId, workspaceId },
        });
        if (!pl)
          throw new BadRequestException('Playlist not found in workspace');
      }
    }

    const updated = await this.prisma.screen.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.activePlaylistId !== undefined
          ? { activePlaylistId: dto.activePlaylistId || null }
          : {}),
        ...(dto.playerTicker !== undefined
          ? { playerTicker: dto.playerTicker }
          : {}),
        ...(dto.playlistGroupId !== undefined
          ? {
              playlistGroupId:
                dto.playlistGroupId && dto.playlistGroupId !== ''
                  ? dto.playlistGroupId
                  : null,
            }
          : {}),
        ...(dto.playerPlatform !== undefined
          ? { playerPlatform: dto.playerPlatform }
          : {}),
        ...(dto.resolutionWidth !== undefined
          ? { resolutionWidth: dto.resolutionWidth }
          : {}),
        ...(dto.resolutionHeight !== undefined
          ? { resolutionHeight: dto.resolutionHeight }
          : {}),
        ...(dto.orientation !== undefined
          ? { orientation: dto.orientation }
          : {}),
      },
      select: this.screenSelect,
    });
    if (dto.activePlaylistId !== undefined) {
      await this.playlistsService.emitPlaylistForScreen(id);
    }
    if (dto.playerTicker !== undefined) {
      this.heartbeat.emitPlayerTicker(id, dto.playerTicker ?? null);
    }
    return updated;
  }

  async sendRemoteCommand(
    workspaceId: string,
    screenId: string,
    dto: RemoteCommandDto,
  ) {
    const screen = await this.prisma.screen.findFirst({
      where: { id: screenId, workspaceId },
      select: { id: true, serialNumber: true },
    });
    if (!screen) throw new NotFoundException('Screen not found');

    const base = {
      command: dto.command,
      screenId: screen.id,
      at: new Date().toISOString(),
    };

    if (dto.command === 'identify') {
      this.heartbeat.emitRemoteCommand(screen.id, {
        ...base,
        serialNumber: screen.serialNumber,
      });
      return { ok: true, command: dto.command };
    }

    if (dto.command === 'refresh_content') {
      this.heartbeat.emitRemoteCommand(screen.id, base);
      return { ok: true, command: dto.command };
    }

    if (dto.command === 'restart') {
      this.heartbeat.emitRemoteCommand(screen.id, base);
      return { ok: true, command: dto.command };
    }

    return { ok: false };
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.getById(workspaceId, id);
    await this.prisma.screen.delete({ where: { id } });
  }

  async getAnalytics(workspaceId: string) {
    const screens = await this.prisma.screen.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        serialNumber: true,
        status: true,
        lastSeenAt: true,
        activePlaylistId: true,
        activePlaylist: { select: { id: true, name: true } },
        location: true,
        createdAt: true,
        isOfflineCacheMode: true,
      },
    });

    const total = screens.length;
    const byStatus = { ONLINE: 0, OFFLINE: 0, MAINTENANCE: 0 };
    let withPlaylist = 0;
    const now = Date.now();

    const perScreen = screens.map((s) => {
      byStatus[s.status] = (byStatus[s.status] ?? 0) + 1;
      if (s.activePlaylistId) withPlaylist++;

      const lastSeenMs = s.lastSeenAt ? s.lastSeenAt.getTime() : null;
      const uptimeSec =
        s.status === 'ONLINE' && lastSeenMs
          ? Math.min((now - lastSeenMs) / 1000, 86400)
          : 0;

      return {
        id: s.id,
        name: s.name,
        serialNumber: s.serialNumber,
        status: s.status,
        location: s.location,
        lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
        activePlaylist: s.activePlaylist?.name ?? null,
        isOfflineCacheMode: s.isOfflineCacheMode,
        uptimeSec,
      };
    });

    const uptimePercent =
      total > 0 ? Math.round((byStatus.ONLINE / total) * 100) : 0;

    const avgLastSeen = screens
      .map((s) => s.lastSeenAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime());

    const newestSeen = avgLastSeen[0]?.toISOString() ?? null;
    const oldestSeen =
      avgLastSeen[avgLastSeen.length - 1]?.toISOString() ?? null;

    // Playlist distribution
    const playlistMap = new Map<string, { name: string; count: number }>();
    for (const s of screens) {
      if (s.activePlaylist) {
        const existing = playlistMap.get(s.activePlaylist.id);
        if (existing) existing.count++;
        else
          playlistMap.set(s.activePlaylist.id, {
            name: s.activePlaylist.name,
            count: 1,
          });
      }
    }
    const playlistDistribution = Array.from(playlistMap.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count);

    // Hourly activity (last 24h) — based on lastSeenAt distribution
    const hourlyActivity: { hour: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) hourlyActivity.push({ hour: h, count: 0 });
    for (const s of screens) {
      if (!s.lastSeenAt) continue;
      const hour = s.lastSeenAt.getHours();
      const ageHours = (now - s.lastSeenAt.getTime()) / 3_600_000;
      if (ageHours < 24) hourlyActivity[hour].count++;
    }

    // Peak hours (top 3)
    const peakHours = [...hourlyActivity]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .filter((h) => h.count > 0);

    return {
      total,
      byStatus,
      uptimePercent,
      withPlaylist,
      withoutPlaylist: total - withPlaylist,
      newestSeen,
      oldestSeen,
      perScreen,
      playlistDistribution,
      hourlyActivity,
      peakHours,
    };
  }

  // ─── Playlist Assignments (multi-playlist rotation) ───

  async listAssignments(workspaceId: string, screenId: string) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    return this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });
  }

  async addAssignment(workspaceId: string, screenId: string, dto: { playlistId: string; orderIndex?: number }) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    const existing = await this.prisma.screenPlaylistAssignment.findUnique({
      where: { screenId_playlistId: { screenId, playlistId: dto.playlistId } },
    });
    if (existing) {
      throw new BadRequestException('Playlist already assigned to this screen');
    }
    const count = await this.prisma.screenPlaylistAssignment.count({
      where: { screenId },
    });
    return this.prisma.screenPlaylistAssignment.create({
      data: {
        screenId,
        playlistId: dto.playlistId,
        orderIndex: dto.orderIndex ?? count,
      },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });
  }

  async removeAssignment(workspaceId: string, screenId: string, assignmentId: string) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    await this.prisma.screenPlaylistAssignment.delete({
      where: { id: assignmentId, screenId },
    });
  }

  async reorderAssignments(
    workspaceId: string,
    screenId: string,
    items: { id: string; orderIndex: number }[],
  ) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.screenPlaylistAssignment.updateMany({
          where: { id: item.id, screenId },
          data: { orderIndex: item.orderIndex },
        }),
      ),
    );
    return this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
      },
    });
  }

  // ─── Override Rules (advanced scheduling) ───

  async listOverrideRules(workspaceId: string, screenId: string) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    return this.prisma.screenOverrideRule.findMany({
      where: { workspaceId, screenId },
      orderBy: { createdAt: 'desc' },
      include: {
        playlist: { select: { id: true, name: true } },
      },
    });
  }

  async createOverrideRule(workspaceId: string, screenId: string, dto: {
    playlistId: string;
    recurrence: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
    enabled?: boolean;
  }) {
    await this.assertScreenInWorkspace(workspaceId, screenId);

    // Conflict detection
    const conflicts = await this.detectOverrideConflicts(workspaceId, screenId, dto);
    if (conflicts.length > 0) {
      throw new BadRequestException({
        message: 'Override conflict detected',
        conflicts,
      });
    }

    return this.prisma.screenOverrideRule.create({
      data: {
        workspaceId,
        screenId,
        playlistId: dto.playlistId,
        recurrence: dto.recurrence,
        daysOfWeek: dto.daysOfWeek ?? [],
        daysOfMonth: dto.daysOfMonth ?? [],
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        startTime: dto.startTime,
        endTime: dto.endTime,
        enabled: dto.enabled ?? true,
      },
      include: {
        playlist: { select: { id: true, name: true } },
      },
    });
  }

  async updateOverrideRule(
    workspaceId: string,
    screenId: string,
    ruleId: string,
    dto: Partial<{
      playlistId: string;
      recurrence: string;
      daysOfWeek: number[];
      daysOfMonth: number[];
      startDate: string;
      endDate: string;
      startTime: string;
      endTime: string;
      enabled: boolean;
    }>,
  ) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    const existing = await this.prisma.screenOverrideRule.findFirst({
      where: { id: ruleId, workspaceId, screenId },
    });
    if (!existing) throw new NotFoundException('Override rule not found');

    return this.prisma.screenOverrideRule.update({
      where: { id: ruleId },
      data: {
        ...(dto.playlistId !== undefined ? { playlistId: dto.playlistId } : {}),
        ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
        ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
        ...(dto.daysOfMonth !== undefined ? { daysOfMonth: dto.daysOfMonth } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate ? new Date(dto.startDate) : null } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate ? new Date(dto.endDate) : null } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      },
      include: {
        playlist: { select: { id: true, name: true } },
      },
    });
  }

  async deleteOverrideRule(workspaceId: string, screenId: string, ruleId: string) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    await this.prisma.screenOverrideRule.delete({
      where: { id: ruleId },
    });
  }

  async checkOverrideConflicts(workspaceId: string, screenId: string, dto: {
    playlistId: string;
    recurrence: string;
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    startDate?: string;
    endDate?: string;
    startTime: string;
    endTime: string;
  }) {
    await this.assertScreenInWorkspace(workspaceId, screenId);
    return this.detectOverrideConflicts(workspaceId, screenId, dto);
  }

  private async detectOverrideConflicts(
    workspaceId: string,
    screenId: string,
    dto: {
      playlistId: string;
      recurrence: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      startDate?: string;
      endDate?: string;
      startTime: string;
      endTime: string;
    },
  ): Promise<{ ruleId: string; playlistName: string; reason: string }[]> {
    const existingRules = await this.prisma.screenOverrideRule.findMany({
      where: { workspaceId, screenId, enabled: true },
      include: { playlist: { select: { id: true, name: true } } },
    });

    const conflicts: { ruleId: string; playlistName: string; reason: string }[] = [];

    for (const rule of existingRules) {
      // Same playlist warning
      if (rule.playlistId === dto.playlistId) {
        conflicts.push({
          ruleId: rule.id,
          playlistName: rule.playlist.name,
          reason: 'SAME_PLAYLIST',
        });
        continue;
      }

      // Time overlap detection
      const timeOverlap = this.checkTimeOverlap(rule, dto);
      if (timeOverlap) {
        conflicts.push({
          ruleId: rule.id,
          playlistName: rule.playlist.name,
          reason: timeOverlap,
        });
      }
    }

    return conflicts;
  }

  private checkTimeOverlap(
    existing: {
      recurrence: string;
      daysOfWeek: number[];
      daysOfMonth: number[];
      startDate: Date | null;
      endDate: Date | null;
      startTime: string;
      endTime: string;
    },
    incoming: {
      recurrence: string;
      daysOfWeek?: number[];
      daysOfMonth?: number[];
      startDate?: string;
      endDate?: string;
      startTime: string;
      endTime: string;
    },
  ): string | null {
    // Check time window overlap (simplified: same time window = conflict)
    const exStart = existing.startTime;
    const exEnd = existing.endTime;
    const inStart = incoming.startTime;
    const inEnd = incoming.endTime;

    // Time overlap check
    if (inStart < exEnd && inEnd > exStart) {
      // Check day overlap
      if (existing.recurrence === 'DAILY' || incoming.recurrence === 'DAILY') {
        return 'TIME_OVERLAP_DAILY';
      }

      if (existing.recurrence === 'WEEKLY' || incoming.recurrence === 'WEEKLY') {
        const exDays = existing.daysOfWeek.length ? existing.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
        const inDays = incoming.daysOfWeek?.length ? incoming.daysOfWeek : [0, 1, 2, 3, 4, 5, 6];
        if (exDays.some((d) => inDays.includes(d))) {
          return 'TIME_OVERLAP_WEEKLY';
        }
      }

      if (existing.recurrence === 'ONCE' || incoming.recurrence === 'ONCE') {
        // For ONCE, check date range overlap
        const exStartD = existing.startDate ? new Date(existing.startDate).getTime() : 0;
        const exEndD = existing.endDate ? new Date(existing.endDate).getTime() : Infinity;
        const inStartD = incoming.startDate ? new Date(incoming.startDate).getTime() : 0;
        const inEndD = incoming.endDate ? new Date(incoming.endDate).getTime() : Infinity;

        if (inStartD <= exEndD && inEndD >= exStartD) {
          return 'TIME_OVERLAP_ONCE';
        }
      }
    }

    return null;
  }

  private async assertScreenInWorkspace(workspaceId: string, screenId: string): Promise<void> {
    const screen = await this.prisma.screen.findFirst({
      where: { id: screenId, workspaceId },
      select: { id: true },
    });
    if (!screen) {
      throw new NotFoundException('Screen not found in this workspace');
    }
  }

  private readonly screenSelect = {
    id: true,
    workspaceId: true,
    name: true,
    serialNumber: true,
    status: true,
    location: true,
    lastSeenAt: true,
    isOfflineCacheMode: true,
    playlistGroupId: true,
    playlistGroup: {
      select: { id: true, name: true },
    },
    activePlaylistId: true,
    activePlaylist: {
      select: { id: true, name: true },
    },
    overridePlaylistId: true,
    overrideExpiresAt: true,
    playerTicker: true,
    playerPlatform: true,
    resolutionWidth: true,
    resolutionHeight: true,
    orientation: true,
    createdAt: true,
    updatedAt: true,
  } satisfies Prisma.ScreenSelect;
}
