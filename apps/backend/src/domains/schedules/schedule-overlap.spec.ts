/**
 * Regression tests for F-09: optimized schedule overlap detection.
 *
 * Verifies that findOverlappingPairs correctly identifies overlapping
 * and non-overlapping schedules, handles midnight-crossing windows,
 * and produces correct results for larger datasets.
 */

import { SchedulingService } from './scheduling.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { HolidayService } from './holiday.service';
import { RecurrenceType } from '@prisma/client';

function makeSchedulingService(): SchedulingService {
  const prisma = {} as unknown as PrismaService;
  const holidayService = {} as unknown as HolidayService;
  return new SchedulingService(prisma, holidayService);
}

type ScheduleInput = {
  id: string;
  screenId: string | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  priority: number;
  recurrence?: RecurrenceType;
  daysOfMonth?: number[];
};

describe('findOverlappingPairs (F-09)', () => {
  const service = makeSchedulingService();

  it('detects overlapping schedules on the same screen and day', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '11:00',
        endTime: '14:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toEqual(['s1', 's2']);
  });

  it('does not report non-overlapping schedules', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '12:00',
        endTime: '14:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(0);
  });

  it('does not report schedules on different screens', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-2',
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(0);
  });

  it('does not report schedules on different days', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [2],
        startTime: '09:00',
        endTime: '12:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(0);
  });

  it('handles midnight-crossing windows correctly', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '22:00',
        endTime: '02:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '23:00',
        endTime: '03:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(1);
  });

  it('detects overlap when one crosses midnight and other does not', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '22:00',
        endTime: '02:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '01:00',
        endTime: '03:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(1);
  });

  it('handles workspace-wide (null screenId) schedules', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: null,
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 's2',
        screenId: null,
        daysOfWeek: [1],
        startTime: '11:00',
        endTime: '14:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(1);
  });

  it('handles MONTHLY recurrence with daysOfMonth', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
        recurrence: RecurrenceType.MONTHLY,
        daysOfMonth: [1, 15],
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [],
        startTime: '11:00',
        endTime: '14:00',
        priority: 2,
        recurrence: RecurrenceType.MONTHLY,
        daysOfMonth: [15],
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(1);
  });

  it('does not overlap MONTHLY schedules on different days', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 's1',
        screenId: 'scr-1',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
        recurrence: RecurrenceType.MONTHLY,
        daysOfMonth: [1],
      },
      {
        id: 's2',
        screenId: 'scr-1',
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '12:00',
        priority: 2,
        recurrence: RecurrenceType.MONTHLY,
        daysOfMonth: [15],
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    expect(pairs).toHaveLength(0);
  });

  it('handles large dataset efficiently (100 schedules, same screen/day)', () => {
    const schedules: ScheduleInput[] = [];
    for (let i = 0; i < 100; i++) {
      schedules.push({
        id: `s${i}`,
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '00:00',
        endTime: '23:59',
        priority: i,
      });
    }
    const start = Date.now();
    const pairs = service.findOverlappingPairs(schedules);
    const elapsed = Date.now() - start;
    // 100 schedules all overlapping → C(100,2) = 4950 pairs
    expect(pairs).toHaveLength(4950);
    // Should complete quickly (well under 100ms even on CI)
    expect(elapsed).toBeLessThan(100);
  });

  it('handles large dataset with many groups efficiently (100 schedules, different screens)', () => {
    const schedules: ScheduleInput[] = [];
    for (let i = 0; i < 100; i++) {
      schedules.push({
        id: `s${i}`,
        screenId: `scr-${i}`,
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
        priority: i,
      });
    }
    const start = Date.now();
    const pairs = service.findOverlappingPairs(schedules);
    const elapsed = Date.now() - start;
    // Each schedule is on a different screen → no overlaps
    expect(pairs).toHaveLength(0);
    expect(elapsed).toBeLessThan(50);
  });

  it('preserves output format (array of [id1, id2] tuples)', () => {
    const schedules: ScheduleInput[] = [
      {
        id: 'a',
        screenId: 'scr-1',
        daysOfWeek: [1, 2],
        startTime: '09:00',
        endTime: '12:00',
        priority: 1,
      },
      {
        id: 'b',
        screenId: 'scr-1',
        daysOfWeek: [1],
        startTime: '11:00',
        endTime: '14:00',
        priority: 2,
      },
    ];
    const pairs = service.findOverlappingPairs(schedules);
    // a and b overlap on day 1 only — should produce exactly 1 pair
    expect(pairs).toHaveLength(1);
    expect(Array.isArray(pairs[0])).toBe(true);
    expect(pairs[0]).toHaveLength(2);
    expect(typeof pairs[0][0]).toBe('string');
    expect(typeof pairs[0][1]).toBe('string');
  });
});
