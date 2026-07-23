import { Injectable } from '@nestjs/common';
import { formatInTimeZone } from 'date-fns-tz';
import { enUS } from 'date-fns/locale';
import { RecurrenceType, type Schedule } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HolidayService } from './holiday.service';

const WEEKDAY_NAME_TO_DOW: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

function parseHHmm(s: string): number {
  const [h, m] = s.split(':').map((x) => parseInt(x, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** Current minute-of-day, weekday (0=Sun..6=Sat) and day-of-month (1..31) in `timeZone`. */
function nowInWorkspaceTz(
  at: Date,
  timeZone: string,
): { minutes: number; dow: number; dom: number } {
  const timeStr = formatInTimeZone(at, timeZone, 'HH:mm');
  const [hh, mm] = timeStr.split(':').map((x) => parseInt(x, 10));
  const minutes = hh * 60 + mm;

  const dayName = formatInTimeZone(at, timeZone, 'EEEE', { locale: enUS });
  const dow = WEEKDAY_NAME_TO_DOW[dayName] ?? 0;

  const dom = parseInt(formatInTimeZone(at, timeZone, 'd'), 10) || 1;

  return { minutes, dow, dom };
}

function dateOnlyInTz(at: Date, timeZone: string): string {
  return formatInTimeZone(at, timeZone, 'yyyy-MM-dd');
}

function isDateInRange(
  at: Date,
  timeZone: string,
  startDate: Date | null,
  endDate: Date | null,
): boolean {
  const today = dateOnlyInTz(at, timeZone);
  if (startDate) {
    const s = formatInTimeZone(startDate, timeZone, 'yyyy-MM-dd');
    if (today < s) return false;
  }
  if (endDate) {
    const e = formatInTimeZone(endDate, timeZone, 'yyyy-MM-dd');
    if (today > e) return false;
  }
  return true;
}

/**
 * Window [startMin, endMin) may cross midnight if endMin <= startMin (e.g. 22:00–06:00).
 */
function isMinuteInWindow(
  nowMin: number,
  startMin: number,
  endMin: number,
): boolean {
  if (startMin === endMin) return false;
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly holidayService: HolidayService,
  ) {}

  /**
   * Effective playlist id for playback:
   * override → highest-priority matching schedule → playlist rotation (assignments) → default (activePlaylistId).
   * Also auto-cleans expired overrides.
   */
  async resolveEffectivePlaylistId(
    screenId: string,
    at: Date = new Date(),
  ): Promise<{
    playlistId: string | null;
    source: 'override' | 'schedule' | 'rotation' | 'default';
  }> {
    const screen = await this.prisma.screen.findUnique({
      where: { id: screenId },
      include: { workspace: true },
    });
    if (!screen) {
      return { playlistId: null, source: 'default' };
    }

    // Auto-clean expired override
    if (
      screen.overridePlaylistId &&
      screen.overrideExpiresAt &&
      screen.overrideExpiresAt <= at
    ) {
      await this.prisma.screen.update({
        where: { id: screenId },
        data: { overridePlaylistId: null, overrideExpiresAt: null },
      });
      screen.overridePlaylistId = null;
      screen.overrideExpiresAt = null;
    }

    if (
      screen.overridePlaylistId &&
      screen.overrideExpiresAt &&
      screen.overrideExpiresAt > at
    ) {
      return { playlistId: screen.overridePlaylistId, source: 'override' };
    }

    const tz = screen.workspace.timezone || 'UTC';

    const schedules = await this.prisma.schedule.findMany({
      where: {
        workspaceId: screen.workspaceId,
        enabled: true,
        playlist: { isPublished: true },
        OR: [{ screenId: null }, { screenId: screen.id }],
      },
    });

    const { minutes, dow, dom } = nowInWorkspaceTz(at, tz);

    let matching = schedules
      .filter((s) => this.scheduleMatches(s, at, tz, minutes, dow, dom))
      .sort(
        (a, b) =>
          b.priority - a.priority || (a.updatedAt > b.updatedAt ? -1 : 1),
      );

    if (matching.length > 0) {
      const isHoliday = await this.holidayService.isHoliday(screen.workspaceId, at);
      if (isHoliday) {
        matching = matching.filter((s) => !s.excludeHolidays);
      }
    }

    if (matching.length > 0) {
      const best = matching[0];
      return { playlistId: best.playlistId, source: 'schedule' };
    }

    // Playlist rotation: if any published assignments exist, return 'rotation'
    // buildRotationPayload in PlaylistsService merges all assigned playlists
    // into one sequential list for the player.
    const assignments = await this.prisma.screenPlaylistAssignment.findMany({
      where: { screenId },
      orderBy: { orderIndex: 'asc' },
      include: { playlist: { select: { id: true, isPublished: true } } },
    });

    const hasPublished = assignments.some((a) => a.playlist.isPublished);
    if (hasPublished) {
      return {
        playlistId: assignments[0].playlistId,
        source: 'rotation',
      };
    }

    return { playlistId: screen.activePlaylistId, source: 'default' };
  }

  scheduleMatches(
    s: Schedule,
    at: Date,
    timeZone: string,
    minutes: number,
    dow: number,
    dom: number,
  ): boolean {
    if (s.recurrence === RecurrenceType.MONTHLY) {
      if (!s.daysOfMonth.includes(dom)) return false;
    } else {
      if (!s.daysOfWeek.includes(dow)) return false;
    }
    if (!isDateInRange(at, timeZone, s.startDate, s.endDate)) return false;

    const startMin = parseHHmm(s.startTime);
    const endMin = parseHHmm(s.endTime);
    return isMinuteInWindow(minutes, startMin, endMin);
  }

  /**
   * Returns pairs of schedule ids that overlap on the same screen scope (same day, time intersection).
   *
   * Optimized: groups schedules by (screenId, recurrence, day) so only
   * schedules that can possibly overlap are compared, and uses O(1)
   * interval arithmetic instead of a 15-minute granularity sweep.
   */
  findOverlappingPairs(
    schedules: Array<{
      id: string;
      screenId: string | null;
      daysOfWeek: number[];
      startTime: string;
      endTime: string;
      priority: number;
      recurrence?: RecurrenceType;
      daysOfMonth?: number[];
    }>,
  ): Array<[string, string]> {
    const overlaps: Array<[string, string]> = [];

    // Group by (screenId, recurrence, day) — only schedules in the same group can overlap
    const groups = new Map<string, Array<{
      id: string;
      start: number;
      end: number;
      crosses: boolean;
    }>>();

    for (const s of schedules) {
      const rec = s.recurrence ?? RecurrenceType.WEEKLY;
      const days = rec === RecurrenceType.MONTHLY
        ? (s.daysOfMonth ?? [])
        : s.daysOfWeek;
      const start = parseHHmm(s.startTime);
      const end = parseHHmm(s.endTime);
      const crosses = start >= end;

      for (const day of days) {
        const key = `${s.screenId ?? '*'}|${rec}|${day}`;
        let group = groups.get(key);
        if (!group) {
          group = [];
          groups.set(key, group);
        }
        group.push({ id: s.id, start, end, crosses });
      }
    }

    // Within each group, compare all pairs with O(1) interval check
    for (const group of groups.values()) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          if (this.intervalsOverlap(group[i], group[j])) {
            overlaps.push([group[i].id, group[j].id]);
          }
        }
      }
    }

    return overlaps;
  }

  /**
   * O(1) interval overlap check supporting midnight-crossing windows.
   * A window that crosses midnight spans [start, 1440) ∪ [0, end).
   */
  private intervalsOverlap(
    x: { start: number; end: number; crosses: boolean },
    y: { start: number; end: number; crosses: boolean },
  ): boolean {
    if (x.crosses && y.crosses) return true; // both include midnight
    if (x.crosses) return y.start < x.end || y.end > x.start;
    if (y.crosses) return x.start < y.end || x.end > y.start;
    return x.start < y.end && y.start < x.end;
  }
}
