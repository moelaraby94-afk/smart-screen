'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  formatHHmm,
  heightPxForSegment,
  parseHHmm,
  segmentsForColumn,
  topPxForMinute,
} from './schedule-calendar-utils';

const PX_PER_HOUR = 40;
const TOTAL_H = 24 * PX_PER_HOUR;

const DAY_ORDER_LTR = [0, 1, 2, 3, 4, 5, 6];
const DAY_ORDER_RTL = [6, 0, 1, 2, 3, 4, 5];

function getDayOrder(locale: string): number[] {
  return locale === 'ar' ? DAY_ORDER_RTL : DAY_ORDER_LTR;
}

const PLAYLIST_COLORS = [
  'hsl(217 91% 60%)',
  'hsl(142 71% 45%)',
  'hsl(25 95% 53%)',
  'hsl(280 65% 60%)',
  'hsl(340 75% 55%)',
  'hsl(45 93% 47%)',
  'hsl(190 90% 45%)',
  'hsl(160 60% 50%)',
];

export function getPlaylistColor(playlistId: string): string {
  let hash = 0;
  for (let i = 0; i < playlistId.length; i++) {
    hash = ((hash << 5) - hash) + playlistId.charCodeAt(i);
    hash |= 0;
  }
  return PLAYLIST_COLORS[Math.abs(hash) % PLAYLIST_COLORS.length];
}

type ScheduleApi = {
  id: string;
  workspaceId: string;
  screenId: string | null;
  playlistId: string;
  daysOfWeek: number[];
  recurrence?: string;
  daysOfMonth?: number[];
  startTime: string;
  endTime: string;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  enabled: boolean;
  playlist: { id: string; name: string };
  screen: { id: string; name: string } | null;
};

type ScheduleCalendarProps = {
  schedules: ScheduleApi[];
  overlapIds: Set<string>;
  loading: boolean;
  locale: string;
  dayShort: (dow: number) => string;
  dragRef: React.MutableRefObject<{
    id: string;
    startY: number;
    origStart: string;
    origEnd: string;
    currentStart: string;
    currentEnd: string;
  } | null>;
  onDragStart: () => void;
  onEventClick?: (schedule: ScheduleApi) => void;
  onDayClick?: (date: Date) => void;
};

export function ScheduleCalendar({
  schedules,
  overlapIds,
  loading,
  locale,
  dayShort,
  dragRef,
  onDragStart,
  onEventClick,
  onDayClick,
}: ScheduleCalendarProps) {
  const t = useTranslations('schedules');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-border bg-muted/30 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('day')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              viewMode === 'day'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('calDay')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              viewMode === 'week'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('calWeek')}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              viewMode === 'month'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('calMonth')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={t('calLoading')} aria-busy="true">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} role="row">
              <Skeleton className="mb-1 h-5 w-full" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : viewMode === 'week' ? (
        <WeekView
          schedules={schedules}
          overlapIds={overlapIds}
          locale={locale}
          dayShort={dayShort}
          dragRef={dragRef}
          onDragStart={onDragStart}
          onEventClick={onEventClick}
        />
      ) : viewMode === 'day' ? (
        <DayView
          schedules={schedules}
          overlapIds={overlapIds}
          locale={locale}
          dayShort={dayShort}
          dragRef={dragRef}
          onDragStart={onDragStart}
          onEventClick={onEventClick}
        />
      ) : (
        <MonthView
          schedules={schedules}
          overlapIds={overlapIds}
          locale={locale}
          dayShort={dayShort}
          onEventClick={onEventClick}
          onDayClick={onDayClick}
        />
      )}
    </section>
  );
}

function WeekView({
  schedules,
  overlapIds,
  locale,
  dayShort,
  dragRef,
  onDragStart,
  onEventClick,
}: Omit<ScheduleCalendarProps, 'loading' | 'viewMode' | 'onDayClick'>) {
  const prefersReduced = useReducedMotion();
  const dayOrder = getDayOrder(locale);
  return (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <div
            className="sticky start-0 z-sticky flex shrink-0 flex-col border-e border-border/60 pe-2 text-[11px] text-muted-foreground"
            style={{ width: 48, height: TOTAL_H + 28 }}
          >
            <div className="h-7 shrink-0" />
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="flex shrink-0 items-start justify-end border-t border-border/30 pt-0.5"
                style={{ height: PX_PER_HOUR }}
              >
                {formatHHmm(h * 60)}
              </div>
            ))}
          </div>

          <div className="flex min-w-0 flex-1 gap-1">
            {dayOrder.map((dow) => (
              <div
                key={dow}
                className="relative min-w-[100px] flex-1 rounded-2xl border border-border bg-muted/20"
                style={{ height: TOTAL_H + 28 }}
              >
                <div className="sticky top-0 z-sticky mb-1 flex h-7 items-center justify-center rounded-t-xl bg-muted/50 text-center text-xs font-semibold text-foreground">
                  {dayShort(dow)}
                </div>
                <div
                  className="relative mx-0.5 rounded-xl border border-border/40"
                  style={{ height: TOTAL_H }}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <div
                      key={h}
                      className="absolute start-0 end-0 border-t border-dashed border-border/30"
                      style={{ top: h * PX_PER_HOUR }}
                    />
                  ))}
                  {schedules.flatMap((sch) => {
                    const segs = segmentsForColumn(
                      sch.daysOfWeek,
                      sch.startTime,
                      sch.endTime,
                      dow,
                    );
                    return segs.map((seg, idx) => {
                      const hPx = heightPxForSegment(
                        seg.startMin,
                        seg.endMin,
                        PX_PER_HOUR,
                      );
                      const top = topPxForMinute(seg.startMin, PX_PER_HOUR);
                      const isOver = overlapIds.has(sch.id);
                      const canDrag =
                        parseHHmm(sch.startTime) < parseHHmm(sch.endTime);
                      const color = getPlaylistColor(sch.playlistId);
                      return (
                        <motion.div
                          key={`${sch.id}-${dow}-${idx}`}
                          layout
                          initial={{ opacity: 0, y: prefersReduced ? 0 : 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'absolute start-0.5 end-0.5 cursor-grab overflow-hidden rounded-lg px-1.5 py-1 text-[10px] font-medium leading-tight text-white shadow-lg active:cursor-grabbing',
                            isOver
                              ? 'ring-2 ring-destructive ring-offset-1 ring-offset-transparent'
                              : 'ring-1 ring-white/20',
                          )}
                          style={{
                            top,
                            height: Math.max(hPx, 18),
                            background: isOver
                              ? 'linear-gradient(135deg, hsl(var(--destructive)) 0%, hsl(var(--destructive) / 0.7) 100%)'
                              : `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
                            borderLeft: `3px solid ${isOver ? 'hsl(var(--destructive))' : color}`,
                          }}
                          title={`${sch.playlist.name} · ${sch.startTime}–${sch.endTime}`}
                          role="button"
                          tabIndex={canDrag ? 0 : -1}
                          aria-label={`${sch.playlist.name}, ${sch.startTime} to ${sch.endTime}`}
                          onClick={() => onEventClick?.(sch)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onEventClick?.(sch);
                            }
                          }}
                          onPointerDown={(e: React.PointerEvent) => {
                            if (!canDrag) return;
                            e.currentTarget.setPointerCapture(e.pointerId);
                            dragRef.current = {
                              id: sch.id,
                              startY: e.clientY,
                              origStart: sch.startTime,
                              origEnd: sch.endTime,
                              currentStart: sch.startTime,
                              currentEnd: sch.endTime,
                            };
                            onDragStart();
                          }}
                        >
                          <p className="truncate opacity-95">{sch.playlist.name}</p>
                          <p className="truncate text-[9px] opacity-75">
                            {sch.startTime} – {sch.endTime}
                          </p>
                        </motion.div>
                      );
                    });
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
  );
}

function DayView({
  schedules,
  overlapIds,
  locale,
  dayShort,
  dragRef,
  onDragStart,
  onEventClick,
}: Omit<ScheduleCalendarProps, 'loading' | 'viewMode' | 'onDayClick'>) {
  const t = useTranslations('schedules');
  const prefersReduced = useReducedMotion();
  const dayOrder = getDayOrder(locale);
  const [selectedDow, setSelectedDow] = useState(() => new Date().getDay());

  const daySchedules = schedules.filter((s) => s.daysOfWeek.includes(selectedDow));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {dayOrder.map((dow) => (
            <button
              key={dow}
              type="button"
              onClick={() => setSelectedDow(dow)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                selectedDow === dow
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {dayShort(dow)}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {daySchedules.length} {t('calDayCount')}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <div
          className="sticky start-0 z-sticky flex shrink-0 flex-col border-e border-border/60 pe-2 text-[11px] text-muted-foreground"
          style={{ width: 56, height: TOTAL_H + 28 }}
        >
          <div className="h-7 shrink-0" />
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="flex shrink-0 items-start justify-end border-t border-border/30 pt-0.5"
              style={{ height: PX_PER_HOUR }}
            >
              {formatHHmm(h * 60)}
            </div>
          ))}
        </div>

        <div className="relative min-w-0 flex-1 rounded-2xl border border-border bg-muted/20" style={{ height: TOTAL_H + 28 }}>
          <div className="sticky top-0 z-sticky mb-1 flex h-7 items-center justify-center rounded-t-xl bg-muted/50 text-center text-sm font-semibold text-foreground">
            {dayShort(selectedDow)}
          </div>
          <div
            className="relative mx-1 rounded-xl border border-border/40"
            style={{ height: TOTAL_H }}
          >
            {Array.from({ length: 24 }, (_, h) => (
              <div
                key={h}
                className="absolute start-0 end-0 border-t border-dashed border-border/30"
                style={{ top: h * PX_PER_HOUR }}
              />
            ))}
            {daySchedules.flatMap((sch) => {
              const segs = segmentsForColumn(
                sch.daysOfWeek,
                sch.startTime,
                sch.endTime,
                selectedDow,
              );
              return segs.map((seg, idx) => {
                const hPx = heightPxForSegment(seg.startMin, seg.endMin, PX_PER_HOUR);
                const top = topPxForMinute(seg.startMin, PX_PER_HOUR);
                const isOver = overlapIds.has(sch.id);
                const canDrag = parseHHmm(sch.startTime) < parseHHmm(sch.endTime);
                const color = getPlaylistColor(sch.playlistId);
                return (
                  <motion.div
                    key={`${sch.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: prefersReduced ? 0 : 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'absolute start-1 end-1 cursor-grab overflow-hidden rounded-lg px-2 py-1.5 text-xs font-medium leading-tight text-white shadow-lg active:cursor-grabbing',
                      isOver
                        ? 'ring-2 ring-destructive ring-offset-1 ring-offset-transparent'
                        : 'ring-1 ring-white/20',
                    )}
                    style={{
                      top,
                      height: Math.max(hPx, 22),
                      background: isOver
                        ? 'linear-gradient(135deg, hsl(var(--destructive)) 0%, hsl(var(--destructive) / 0.7) 100%)'
                        : `linear-gradient(135deg, ${color} 0%, ${color}99 100%)`,
                      borderLeft: `3px solid ${isOver ? 'hsl(var(--destructive))' : color}`,
                    }}
                    title={`${sch.playlist.name} · ${sch.startTime}–${sch.endTime}`}
                    role="button"
                    tabIndex={canDrag ? 0 : -1}
                    aria-label={`${sch.playlist.name}, ${sch.startTime} to ${sch.endTime}`}
                    onClick={() => onEventClick?.(sch)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onEventClick?.(sch);
                      }
                    }}
                    onPointerDown={(e: React.PointerEvent) => {
                      if (!canDrag) return;
                      e.currentTarget.setPointerCapture(e.pointerId);
                      dragRef.current = {
                        id: sch.id,
                        startY: e.clientY,
                        origStart: sch.startTime,
                        origEnd: sch.endTime,
                        currentStart: sch.startTime,
                        currentEnd: sch.endTime,
                      };
                      onDragStart();
                    }}
                  >
                    <p className="truncate opacity-95">{sch.playlist.name}</p>
                    <p className="truncate text-[10px] opacity-75">
                      {sch.startTime} – {sch.endTime}
                    </p>
                    {sch.screen && (
                      <p className="truncate text-[10px] opacity-60">
                        {sch.screen.name}
                      </p>
                    )}
                  </motion.div>
                );
              });
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthView({
  schedules,
  overlapIds,
  locale,
  dayShort,
  onEventClick,
  onDayClick,
}: {
  schedules: ScheduleApi[];
  overlapIds: Set<string>;
  locale: string;
  dayShort: (dow: number) => string;
  onEventClick?: (schedule: ScheduleApi) => void;
  onDayClick?: (date: Date) => void;
}) {
  const t = useTranslations('schedules');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const dayOrder = getDayOrder(locale);

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = dayOrder.indexOf(startDow);
    const cells: Array<{ date: Date | null; dow: number }> = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push({ date: null, dow: dayOrder[i] });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, dow: date.getDay() });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dow: dayOrder[cells.length % 7] });
    }
    return cells;
  }, [cursor, dayOrder]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      month: 'long',
      year: 'numeric',
    }).format(cursor);
  }, [cursor, locale]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-[600px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            aria-label={t('calPrevMonth')}
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() - 1);
              setCursor(d);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={() => {
              const d = new Date();
              d.setDate(1);
              setCursor(d);
            }}
          >
            {t('calToday')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
            aria-label={t('calNextMonth')}
            onClick={() => {
              const d = new Date(cursor);
              d.setMonth(d.getMonth() + 1);
              setCursor(d);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
      <div className="grid grid-cols-7 gap-1 min-w-[640px]" role="grid" aria-label={monthLabel}>
        {dayOrder.map((dow) => (
          <div
            key={dow}
            role="columnheader"
            className="pb-1 text-center text-xs font-semibold uppercase text-muted-foreground"
          >
            {dayShort(dow)}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.date) {
            return <div key={idx} role="gridcell" className="min-h-[100px] rounded-lg bg-muted/10" />;
          }
          const isToday = cell.date.getTime() === today.getTime();
          const daySchedules = schedules.filter((s) =>
            s.daysOfWeek.includes(cell.dow),
          );
          return (
            <div
              key={idx}
              role="gridcell"
              className={cn(
                'min-h-[100px] rounded-lg border p-1',
                isToday
                  ? 'border-primary/20 bg-primary/5'
                  : 'border-border bg-muted/15',
                onDayClick && 'cursor-pointer hover:border-primary/30 hover:bg-primary/5',
              )}
              onClick={() => onDayClick?.(cell.date!)}
            >
              <span
                className={cn(
                  'mb-1 block text-xs font-medium',
                  isToday ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {cell.date.getDate()}
              </span>
              <div className="space-y-0.5">
                {daySchedules.slice(0, 3).map((s) => {
                  const color = getPlaylistColor(s.playlistId);
                  const isConflict = overlapIds.has(s.id);
                  return (
                    <div
                      key={s.id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'truncate rounded px-1 py-0.5 text-xs font-medium',
                        isConflict && 'ring-1 ring-destructive',
                      )}
                      style={{
                        borderLeft: `3px solid ${isConflict ? 'hsl(var(--destructive))' : color}`,
                        background: isConflict ? 'hsl(var(--destructive) / 0.05)' : `${color}1a`,
                        color: isConflict ? 'hsl(var(--destructive))' : color,
                      }}
                      title={`${s.playlist.name} · ${s.startTime}–${s.endTime}`}
                      aria-label={`${s.playlist.name}, ${s.startTime} to ${s.endTime}`}
                      onClick={() => onEventClick?.(s)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onEventClick?.(s);
                        }
                      }}
                    >
                      {s.playlist.name}
                    </div>
                  );
                })}
                {daySchedules.length > 3 && (
                  <span className="block text-xs text-muted-foreground">
                    {t('calMore', { count: daySchedules.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

type ScheduleListProps = {
  schedules: ScheduleApi[];
  overlapIds?: Set<string>;
  dayShort: (dow: number) => string;
  onDelete: (id: string) => void;
  onEdit?: (schedule: ScheduleApi) => void;
  t: (key: string) => string;
};

export function ScheduleList({ schedules, overlapIds, dayShort, onDelete, onEdit, t }: ScheduleListProps) {
  const sorted = useMemo(() => {
    if (!overlapIds || overlapIds.size === 0) return schedules;
    return [...schedules].sort((a, b) => {
      const aOver = overlapIds.has(a.id) ? 1 : 0;
      const bOver = overlapIds.has(b.id) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;
      return b.priority - a.priority;
    });
  }, [schedules, overlapIds]);

  return (
    <section className="vc-glass vc-card-surface rounded-3xl p-6">
      <h3 className="mb-4 text-base font-semibold">{t('listTitle')}</h3>
      <ul className="space-y-2">
        {sorted.map((s) => {
          const color = getPlaylistColor(s.playlistId);
          const isOver = overlapIds?.has(s.id) ?? false;
          return (
            <li
              key={s.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm',
                isOver
                  ? 'border-destructive/40 bg-destructive/5'
                  : 'border-border/60 bg-muted/20',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: color }}
                  aria-hidden
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{s.playlist.name}</p>
                    {isOver && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive"
                        role="status"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        {t('legendOverlap')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.recurrence === 'MONTHLY'
                      ? `${t('recurrenceMonthly')} · ${(s.daysOfMonth ?? []).join(', ')}`
                      : s.daysOfWeek.map((d) => dayShort(d)).join(', ')}{' '}
                    · {s.startTime}–{s.endTime} · P{s.priority}
                    {s.screen ? ` · ${s.screen.name}` : ` · ${t('allScreens')}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={t('editScheduleAria')}
                    onClick={() => onEdit(s)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  aria-label={t('deleteScheduleAria')}
                  onClick={() => onDelete(s.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
