import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RecurrenceType } from '@prisma/client';
import { buildPage } from '../../common/pagination/page';
import {
  PaginationQueryDto,
  skipFor,
  MAX_PAGE_SIZE,
} from '../../common/pagination/pagination-query.dto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PlaylistsService } from '../playlists/playlists.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { SchedulingService } from './scheduling.service';

@Injectable()
export class SchedulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scheduling: SchedulingService,
    @Inject(forwardRef(() => PlaylistsService))
    private readonly playlists: PlaylistsService,
  ) {}

  async list(workspaceId: string, query: PaginationQueryDto) {
    const where = { workspaceId };
    const [items, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { startTime: 'asc' }],
        skip: skipFor(query),
        take: query.limit,
        include: {
          playlist: { select: { id: true, name: true } },
          screen: { select: { id: true, name: true } },
        },
      }),
      this.prisma.schedule.count({ where }),
    ]);
    return buildPage(items, total, query);
  }

  async listOverlaps(workspaceId: string) {
    const rows = await this.prisma.schedule.findMany({
      where: { workspaceId, enabled: true },
      take: MAX_PAGE_SIZE,
      select: {
        id: true,
        screenId: true,
        daysOfWeek: true,
        startTime: true,
        endTime: true,
        priority: true,
        recurrence: true,
        daysOfMonth: true,
      },
    });
    const pairs = this.scheduling.findOverlappingPairs(rows);
    return { pairs };
  }

  async getOne(workspaceId: string, id: string) {
    const s = await this.prisma.schedule.findFirst({
      where: { id, workspaceId },
      include: {
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
      },
    });
    if (!s) throw new NotFoundException('Schedule not found');
    return s;
  }

  async create(dto: CreateScheduleDto) {
    await this.ensureRefs(
      dto.workspaceId,
      dto.playlistId,
      dto.screenId ?? null,
    );

    const recurrence = dto.recurrence ?? RecurrenceType.WEEKLY;
    if (recurrence === RecurrenceType.MONTHLY) {
      if (!dto.daysOfMonth || dto.daysOfMonth.length === 0) {
        throw new BadRequestException(
          'daysOfMonth is required for MONTHLY recurrence',
        );
      }
    } else if (!dto.daysOfWeek || dto.daysOfWeek.length === 0) {
      throw new BadRequestException(
        'daysOfWeek is required for WEEKLY recurrence',
      );
    }

    const created = await this.prisma.schedule.create({
      data: {
        workspaceId: dto.workspaceId,
        playlistId: dto.playlistId,
        screenId: dto.screenId?.trim() ? dto.screenId.trim() : null,
        daysOfWeek: dto.daysOfWeek,
        recurrence,
        daysOfMonth: dto.daysOfMonth ?? [],
        startTime: dto.startTime,
        endTime: dto.endTime,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        priority: dto.priority ?? 0,
        enabled: dto.enabled ?? true,
      },
      include: {
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
      },
    });

    await this.broadcastAffected(dto.workspaceId, dto.screenId ?? null);
    return created;
  }

  async update(workspaceId: string, id: string, dto: UpdateScheduleDto) {
    const existing = await this.getOne(workspaceId, id);
    const nextPlaylistId = dto.playlistId ?? existing.playlistId;
    const nextScreenId =
      dto.screenId === undefined
        ? existing.screenId
        : dto.screenId?.trim()
          ? dto.screenId.trim()
          : null;

    await this.ensureRefs(workspaceId, nextPlaylistId, nextScreenId);

    const nextRecurrence = dto.recurrence ?? existing.recurrence;
    const nextDaysOfWeek = dto.daysOfWeek ?? existing.daysOfWeek;
    const nextDaysOfMonth = dto.daysOfMonth ?? existing.daysOfMonth;
    if (nextRecurrence === RecurrenceType.MONTHLY) {
      if (nextDaysOfMonth.length === 0) {
        throw new BadRequestException(
          'daysOfMonth is required for MONTHLY recurrence',
        );
      }
    } else if (nextDaysOfWeek.length === 0) {
      throw new BadRequestException(
        'daysOfWeek is required for WEEKLY recurrence',
      );
    }

    const updated = await this.prisma.schedule.update({
      where: { id },
      data: {
        ...(dto.playlistId !== undefined ? { playlistId: dto.playlistId } : {}),
        ...(dto.screenId !== undefined
          ? { screenId: dto.screenId?.trim() ? dto.screenId.trim() : null }
          : {}),
        ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
        ...(dto.recurrence !== undefined ? { recurrence: dto.recurrence } : {}),
        ...(dto.daysOfMonth !== undefined
          ? { daysOfMonth: dto.daysOfMonth }
          : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.startDate !== undefined
          ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
          : {}),
        ...(dto.endDate !== undefined
          ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.excludeHolidays !== undefined ? { excludeHolidays: dto.excludeHolidays } : {}),
      },
      include: {
        playlist: { select: { id: true, name: true } },
        screen: { select: { id: true, name: true } },
      },
    });

    await this.broadcastAffected(workspaceId, existing.screenId);
    await this.broadcastAffected(workspaceId, updated.screenId);
    return updated;
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    const existing = await this.getOne(workspaceId, id);
    await this.prisma.schedule.delete({ where: { id } });
    await this.broadcastAffected(workspaceId, existing.screenId);
  }

  async preview(workspaceId: string, screenId?: string, dateStr?: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { timezone: true },
    });
    const tz = workspace?.timezone || 'UTC';
    const targetDate = dateStr ? new Date(dateStr) : new Date();

    const where: Record<string, unknown> = { workspaceId, enabled: true };
    if (screenId) {
      where.OR = [{ screenId: null }, { screenId }];
    }

    const schedules = await this.prisma.schedule.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { startTime: 'asc' }],
      include: {
        playlist: { select: { id: true, name: true, isPublished: true } },
        screen: { select: { id: true, name: true } },
      },
    });

    const { formatInTimeZone } = await import('date-fns-tz');
    const { enUS } = await import('date-fns/locale');
    const timeStr = formatInTimeZone(targetDate, tz, 'HH:mm');
    const [hh, mm] = timeStr.split(':').map((x: string) => parseInt(x, 10));
    const minutes = hh * 60 + mm;
    const dayName = formatInTimeZone(targetDate, tz, 'EEEE', { locale: enUS });
    const dowMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3,
      Thursday: 4, Friday: 5, Saturday: 6,
    };
    const dow = dowMap[dayName] ?? 0;
    const dom = parseInt(formatInTimeZone(targetDate, tz, 'd'), 10) || 1;

    const matching = schedules.filter((s) =>
      this.scheduling.scheduleMatches(s, targetDate, tz, minutes, dow, dom),
    );

    return {
      date: targetDate.toISOString(),
      timezone: tz,
      screenId: screenId ?? null,
      activeSchedules: matching.map((s) => ({
        id: s.id,
        playlistId: s.playlistId,
        playlistName: s.playlist.name,
        screenId: s.screenId,
        screenName: s.screen?.name ?? null,
        startTime: s.startTime,
        endTime: s.endTime,
        priority: s.priority,
        recurrence: s.recurrence,
        daysOfWeek: s.daysOfWeek,
        daysOfMonth: s.daysOfMonth,
      })),
      allSchedules: schedules.map((s) => ({
        id: s.id,
        playlistId: s.playlistId,
        playlistName: s.playlist.name,
        screenId: s.screenId,
        screenName: s.screen?.name ?? null,
        startTime: s.startTime,
        endTime: s.endTime,
        priority: s.priority,
        recurrence: s.recurrence,
        daysOfWeek: s.daysOfWeek,
        daysOfMonth: s.daysOfMonth,
        enabled: s.enabled,
      })),
    };
  }

  private async ensureRefs(
    workspaceId: string,
    playlistId: string,
    screenId: string | null,
  ) {
    const pl = await this.prisma.playlist.findFirst({
      where: { id: playlistId, workspaceId },
    });
    if (!pl) throw new BadRequestException('Playlist not found in workspace');

    if (screenId) {
      const sc = await this.prisma.screen.findFirst({
        where: { id: screenId, workspaceId },
      });
      if (!sc) throw new BadRequestException('Screen not found in workspace');
    }
  }

  /**
   * After any schedule create/update/delete, push the recomputed playlist to every
   * affected screen (workspace-wide schedules fan out to all screens).
   * Uses `content:sync` plus `schedule:changed` so all player listeners receive the update.
   */
  private async broadcastAffected(
    workspaceId: string,
    screenId: string | null,
  ): Promise<void> {
    const ids = await this.affectedScreenIds(workspaceId, screenId);
    for (const sid of ids) {
      await this.playlists.emitPlaylistForScreen(sid, {
        alsoEmitScheduleSignal: true,
      });
    }
  }

  private async affectedScreenIds(
    workspaceId: string,
    screenId: string | null,
  ): Promise<string[]> {
    if (screenId) return [screenId];
    const screens = await this.prisma.screen.findMany({
      where: { workspaceId },
      select: { id: true },
    });
    return screens.map((s) => s.id);
  }
}
