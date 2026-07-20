import { SchedulingService } from './scheduling.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  RecurrenceType,
  type Schedule,
  type Screen,
  type Workspace,
} from '@prisma/client';

/**
 * In-memory stand-in for PrismaService covering only screen.findUnique
 * (with workspace include) and schedule.findMany — the two calls
 * resolveEffectivePlaylistId makes. No Postgres needed.
 */

type FakeScreen = Screen & { workspace: Workspace };
type FakeSchedule = Schedule;

function createFakePrisma(
  screen: FakeScreen | null,
  schedules: FakeSchedule[],
) {
  return {
    screen: {
      findUnique: jest.fn(() => {
        return screen ? { ...screen, workspace: screen.workspace } : null;
      }),
      update: jest.fn(() => ({ ...screen })),
    },
    schedule: {
      findMany: jest.fn(
        ({
          where,
        }: {
          where: { workspaceId: string; enabled: boolean; OR: unknown[] };
        }) => {
          return schedules.filter(
            (s) =>
              s.workspaceId === where.workspaceId &&
              s.enabled === where.enabled &&
              where.OR.some(
                (cond: Record<string, unknown>) =>
                  (cond.screenId === null && s.screenId === null) ||
                  (cond.screenId === screen?.id && s.screenId === screen?.id),
              ),
          );
        },
      ),
    },
    screenPlaylistAssignment: {
      findMany: jest.fn(() => []),
    },
  };
}

const SCREEN_ID = 'screen-1';
const WS_ID = 'ws-1';
const TZ_UTC = 'UTC';
const TZ_NY = 'America/New_York';

function makeScreen(overrides: Partial<FakeScreen> = {}): FakeScreen {
  return {
    id: SCREEN_ID,
    workspaceId: WS_ID,
    name: 'Test Screen',
    activePlaylistId: 'playlist-default',
    overridePlaylistId: null,
    overrideExpiresAt: null,
    pairingSessionId: null,
    lastHeartbeatAt: null,
    isOnline: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    workspace: {
      id: WS_ID,
      name: 'Test WS',
      timezone: TZ_UTC,
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: 'owner-1',
      planId: null,
      subscriptionStatus: 'TRIAL',
      billingCycle: 'MONTHLY',
      trialEndsAt: null,
      resellerId: null,
      capabilities: {},
    },
    ...overrides,
  } as FakeScreen;
}

function makeSchedule(overrides: Partial<FakeSchedule> = {}): FakeSchedule {
  return {
    id: 'sched-1',
    workspaceId: WS_ID,
    screenId: null,
    playlistId: 'playlist-sched',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    recurrence: RecurrenceType.WEEKLY,
    daysOfMonth: [],
    startTime: '09:00',
    endTime: '17:00',
    startDate: null,
    endDate: null,
    priority: 0,
    enabled: true,
    excludeHolidays: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as FakeSchedule;
}

describe('SchedulingService (P1-T3)', () => {
  let service: SchedulingService;

  // ─── Test 1: normal window 09:00–17:00 ──────────────────────────────
  it('matches inside a normal 09:00–17:00 window and rejects outside', async () => {
    const screen = makeScreen();
    const schedule = makeSchedule({ startTime: '09:00', endTime: '17:00' });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // 12:00 UTC — inside
    const inside = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(inside.playlistId).toBe('playlist-sched');
    expect(inside.source).toBe('schedule');

    // 08:00 UTC — before window
    const before = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T08:00:00Z'),
    );
    expect(before.source).toBe('default');

    // 18:00 UTC — after window
    const after = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T18:00:00Z'),
    );
    expect(after.source).toBe('default');
  });

  // ─── Test 2: overnight window 22:00–06:00 ───────────────────────────
  it('matches across midnight in a 22:00–06:00 window', async () => {
    const screen = makeScreen();
    const schedule = makeSchedule({ startTime: '22:00', endTime: '06:00' });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // 23:00 UTC — inside (before midnight)
    const lateNight = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T23:00:00Z'),
    );
    expect(lateNight.source).toBe('schedule');

    // 05:00 UTC — inside (after midnight)
    const earlyMorning = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T05:00:00Z'),
    );
    expect(earlyMorning.source).toBe('schedule');

    // 12:00 UTC — outside
    const noon = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(noon.source).toBe('default');
  });

  // ─── Test 3: priority Override > Schedule > Default ─────────────────
  it('returns override when active, schedule when no override, default when no match', async () => {
    const screen = makeScreen({
      overridePlaylistId: 'playlist-override',
      overrideExpiresAt: new Date('2026-07-13T23:59:59Z'),
    });
    const schedule = makeSchedule({ startTime: '00:00', endTime: '23:59' });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // Override is active → source = override
    const withOverride = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(withOverride.source).toBe('override');
    expect(withOverride.playlistId).toBe('playlist-override');

    // Override expired → falls to schedule
    screen.overrideExpiresAt = new Date('2026-07-13T10:00:00Z');
    const afterOverride = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(afterOverride.source).toBe('schedule');

    // No schedule matches → default
    const noSchedFake = createFakePrisma(
      makeScreen({ overridePlaylistId: null, overrideExpiresAt: null }),
      [],
    );
    service = new SchedulingService(noSchedFake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);
    const fallback = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(fallback.source).toBe('default');
    expect(fallback.playlistId).toBe('playlist-default');
  });

  // ─── Test 4: date range boundaries (startDate/endDate) ──────────────
  it('respects startDate and endDate in workspace timezone', async () => {
    const screen = makeScreen({ workspace: makeScreen().workspace });
    screen.workspace.timezone = TZ_UTC;

    const schedule = makeSchedule({
      startTime: '00:00',
      endTime: '23:59',
      startDate: new Date('2026-07-10T00:00:00Z'),
      endDate: new Date('2026-07-15T23:59:59Z'),
    });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // Before start date → default
    const before = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-09T12:00:00Z'),
    );
    expect(before.source).toBe('default');

    // In range → schedule
    const inRange = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-12T12:00:00Z'),
    );
    expect(inRange.source).toBe('schedule');

    // After end date → default
    const after = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-16T12:00:00Z'),
    );
    expect(after.source).toBe('default');
  });

  // ─── Test 5: DST transition in America/New_York ─────────────────────
  it('handles DST transition in America/New_York timezone', async () => {
    const screen = makeScreen();
    screen.workspace.timezone = TZ_NY;

    // Schedule 09:00–17:00 local, all days
    const schedule = makeSchedule({ startTime: '09:00', endTime: '17:00' });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // 2026-03-08 is the day before DST starts (spring forward on March 8, 2026 at 2 AM).
    // At 14:00 UTC on March 8, NY local time is 09:00 EST (before spring forward).
    // After spring forward (2 AM March 8), NY is EDT (UTC-4).
    // So 14:00 UTC = 10:00 EDT → inside 09:00–17:00.
    const duringDST = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-03-08T14:00:00Z'),
    );
    expect(duringDST.source).toBe('schedule');

    // 2026-11-01 is fall back day. At 13:00 UTC = 08:00 EST/09:00 EDT.
    // After fall back (2 AM Nov 1), NY is EST (UTC-5).
    // So 13:00 UTC = 08:00 EST → outside 09:00–17:00.
    const duringFallBack = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-11-01T13:00:00Z'),
    );
    expect(duringFallBack.source).toBe('default');
  });

  // ─── Test 6: scheduleMatches with specific day-of-week ──────────────
  it('only matches on the configured days of week', async () => {
    const screen = makeScreen();
    // Only Mondays (dow=1)
    const schedule = makeSchedule({
      daysOfWeek: [1],
      startTime: '00:00',
      endTime: '23:59',
    });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // 2026-07-13 is a Monday
    const monday = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(monday.source).toBe('schedule');

    // 2026-07-14 is a Tuesday
    const tuesday = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-14T12:00:00Z'),
    );
    expect(tuesday.source).toBe('default');
  });

  // ─── Test 7: MONTHLY recurrence matches on day-of-month ─────────────
  it('matches on the configured day-of-month for MONTHLY recurrence', async () => {
    const screen = makeScreen();
    const schedule = makeSchedule({
      recurrence: RecurrenceType.MONTHLY,
      daysOfMonth: [14],
      daysOfWeek: [],
      startTime: '00:00',
      endTime: '23:59',
    });
    const fake = createFakePrisma(screen, [schedule]);
    service = new SchedulingService(fake as unknown as PrismaService, { isHoliday: jest.fn(() => false) } as any);

    // 2026-07-14 → day-of-month 14 → matches (even though it's a Tuesday, dow ignored)
    const onDay = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-14T12:00:00Z'),
    );
    expect(onDay.source).toBe('schedule');

    // 2026-07-13 → day-of-month 13 → no match
    const offDay = await service.resolveEffectivePlaylistId(
      SCREEN_ID,
      new Date('2026-07-13T12:00:00Z'),
    );
    expect(offDay.source).toBe('default');
  });
});
