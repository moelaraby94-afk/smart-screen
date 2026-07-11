'use client';

import { motion } from 'framer-motion';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
  dayShort,
  dragRef,
  onDragStart,
}: ScheduleCalendarProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          loading
        </div>
      ) : (
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
      )}
    </section>
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
