'use client';

import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type ScheduleApi = {
  id: string;
  workspaceId: string;
  screenId: string | null;
  playlistId: string;
  daysOfWeek: number[];
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
};

export function ScheduleCalendar({
  schedules,
  overlapIds,
  loading,
  locale,
  dayShort,
  dragRef,
  onDragStart,
}: ScheduleCalendarProps) {
  const t = useTranslations('schedules');
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');

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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('calLoading')}
        </div>
      ) : viewMode === 'week' ? (
        <WeekView
          schedules={schedules}
          overlapIds={overlapIds}
          dayShort={dayShort}
          dragRef={dragRef}
          onDragStart={onDragStart}
        />
      ) : viewMode === 'day' ? (
        <DayView
          schedules={schedules}
          overlapIds={overlapIds}
          dayShort={dayShort}
          dragRef={dragRef}
          onDragStart={onDragStart}
        />
      ) : (
        <MonthView
          schedules={schedules}
          overlapIds={overlapIds}
          locale={locale}
          dayShort={dayShort}
        />
      )}
    </section>
  );
}

function WeekView({
  schedules,
  overlapIds,
  dayShort,
  dragRef,
  onDragStart,
}: Omit<ScheduleCalendarProps, 'loading' | 'locale' | 'viewMode'>) {
  return (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <div
            className="sticky start-0 z-20 flex shrink-0 flex-col border-e border-border/60 pe-2 text-[11px] text-muted-foreground"
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
            {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
              <div
                key={dow}
                className="relative min-w-[100px] flex-1 rounded-2xl border border-border bg-muted/20"
                style={{ height: TOTAL_H + 28 }}
              >
                <div className="sticky top-0 z-10 mb-1 flex h-7 items-center justify-center rounded-t-xl bg-muted/50 text-center text-xs font-semibold text-foreground">
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
                      return (
                        <motion.div
                          key={`${sch.id}-${dow}-${idx}`}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'absolute start-0.5 end-0.5 cursor-grab overflow-hidden rounded-lg px-1.5 py-1 text-[10px] font-medium leading-tight text-white shadow-lg active:cursor-grabbing',
                            isOver
                              ? 'ring-2 ring-primary ring-offset-1 ring-offset-transparent'
                              : 'ring-1 ring-white/20',
                          )}
                          style={{
                            top,
                            height: Math.max(hPx, 18),
                            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
                          }}
                          title={`${sch.playlist.name} · ${sch.startTime}–${sch.endTime}`}
                          role="button"
                          tabIndex={canDrag ? 0 : -1}
                          aria-label={`${sch.playlist.name}, ${sch.startTime} to ${sch.endTime}`}
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
  dayShort,
  dragRef,
  onDragStart,
}: Omit<ScheduleCalendarProps, 'loading' | 'locale' | 'viewMode'>) {
  const t = useTranslations('schedules');
  const [selectedDow, setSelectedDow] = useState(() => new Date().getDay());

  const daySchedules = schedules.filter((s) => s.daysOfWeek.includes(selectedDow));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((dow) => (
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
          className="sticky start-0 z-20 flex shrink-0 flex-col border-e border-border/60 pe-2 text-[11px] text-muted-foreground"
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
          <div className="sticky top-0 z-10 mb-1 flex h-7 items-center justify-center rounded-t-xl bg-muted/50 text-center text-sm font-semibold text-foreground">
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
                return (
                  <motion.div
                    key={`${sch.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'absolute start-1 end-1 cursor-grab overflow-hidden rounded-lg px-2 py-1.5 text-xs font-medium leading-tight text-white shadow-lg active:cursor-grabbing',
                      isOver
                        ? 'ring-2 ring-primary ring-offset-1 ring-offset-transparent'
                        : 'ring-1 ring-white/20',
                    )}
                    style={{
                      top,
                      height: Math.max(hPx, 22),
                      background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
                    }}
                    title={`${sch.playlist.name} · ${sch.startTime}–${sch.endTime}`}
                    role="button"
                    tabIndex={canDrag ? 0 : -1}
                    aria-label={`${sch.playlist.name}, ${sch.startTime} to ${sch.endTime}`}
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
}: {
  schedules: ScheduleApi[];
  overlapIds: Set<string>;
  locale: string;
  dayShort: (dow: number) => string;
}) {
  const t = useTranslations('schedules');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const grid = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date | null; dow: number }> = [];
    for (let i = 0; i < startDow; i++) {
      cells.push({ date: null, dow: i });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      cells.push({ date, dow: date.getDay() });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, dow: cells.length % 7 });
    }
    return cells;
  }, [cursor]);

  const monthLabel = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      month: 'long',
      year: 'numeric',
    }).format(cursor);
  }, [cursor, locale]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-lg"
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

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="pb-1 text-center text-xs font-semibold text-muted-foreground"
          >
            {dayShort(i)}
          </div>
        ))}
        {grid.map((cell, idx) => {
          if (!cell.date) {
            return <div key={idx} className="min-h-[80px] rounded-lg bg-muted/10" />;
          }
          const isToday = cell.date.getTime() === today.getTime();
          const daySchedules = schedules.filter((s) =>
            s.daysOfWeek.includes(cell.dow),
          );
          return (
            <div
              key={idx}
              className={cn(
                'min-h-[80px] rounded-lg border p-1.5',
                isToday
                  ? 'border-primary/40 bg-primary/5'
                  : 'border-border/40 bg-muted/15',
              )}
            >
              <span
                className={cn(
                  'mb-1 block text-[10px] font-semibold',
                  isToday ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {cell.date.getDate()}
              </span>
              <div className="space-y-0.5">
                {daySchedules.slice(0, 3).map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'truncate rounded px-1 py-0.5 text-[9px] font-medium text-white',
                      overlapIds.has(s.id) && 'ring-1 ring-primary',
                    )}
                    style={{
                      background:
                        'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)',
                    }}
                    title={`${s.playlist.name} · ${s.startTime}–${s.endTime}`}
                  >
                    {s.playlist.name}
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <span className="block text-[9px] text-muted-foreground">
                    {t('calMore', { count: daySchedules.length - 3 })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ScheduleListProps = {
  schedules: ScheduleApi[];
  dayShort: (dow: number) => string;
  onDelete: (id: string) => void;
  t: (key: string) => string;
};

export function ScheduleList({ schedules, dayShort, onDelete, t }: ScheduleListProps) {
  return (
    <section className="vc-glass vc-card-surface rounded-3xl p-6">
      <h3 className="mb-4 text-base font-semibold">{t('listTitle')}</h3>
      <ul className="space-y-2">
        {schedules.map((s) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{s.playlist.name}</p>
              <p className="text-xs text-muted-foreground">
                {s.daysOfWeek.map((d) => dayShort(d)).join(', ')} · {s.startTime}–{s.endTime}{' '}
                · P{s.priority}
                {s.screen ? ` · ${s.screen.name}` : ` · ${t('allScreens')}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              aria-label={t('deleteScheduleAria')}
              onClick={() => onDelete(s.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
