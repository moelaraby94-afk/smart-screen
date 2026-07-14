'use client';

import { Card } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

type ScheduleEntry = {
  id: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
  playlist: { id: string; name: string } | null;
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function SchedulesTimelineView({
  schedules,
  dayLabels,
}: {
  schedules: ScheduleEntry[];
  dayLabels: string[];
}) {
  const t = useTranslations('schedules');

  const getSchedulesForDay = (day: number) =>
    schedules.filter((s) => s.daysOfWeek.includes(day) && s.enabled);

  return (
    <Card className="p-4 overflow-x-auto">
      <div className="min-w-[800px]">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight">{t('timelineTitle')}</h3>
        </div>
        <div className="flex items-center border-b border-border pb-2">
          <div className="w-[60px] shrink-0" />
          <div className="flex flex-1">
            {HOURS.map((h) => (
              <div key={h} className="flex-1 text-center text-[10px] font-medium text-muted-foreground">
                {h.toString().padStart(2, '0')}
              </div>
            ))}
          </div>
        </div>
        {dayLabels.map((dayLabel, dayIdx) => {
          const daySchedules = getSchedulesForDay(dayIdx);
          return (
            <div key={dayIdx} className="flex items-center border-b border-border/50 py-1.5 min-h-[40px]">
              <div className="w-[60px] shrink-0 text-xs font-medium text-muted-foreground pe-2 pt-1">{dayLabel}</div>
              <div className="relative flex-1 h-8">
                {HOURS.map((h) => (
                  <div key={h} className="absolute top-0 bottom-0 border-s border-border/30" style={{ left: `${(h / 24) * 100}%` }} />
                ))}
                {daySchedules.map((s) => {
                  const startMin = timeToMinutes(s.startTime);
                  const endMin = timeToMinutes(s.endTime);
                  const leftPct = (startMin / (24 * 60)) * 100;
                  const widthPct = ((endMin - startMin) / (24 * 60)) * 100;
                  return (
                    <div
                      key={s.id}
                      className="absolute top-0.5 h-7 rounded-md bg-primary/80 px-1.5 text-[10px] font-medium text-white flex items-center truncate cursor-pointer hover:bg-primary z-10"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      title={`${s.playlist?.name ?? '—'} · ${s.startTime}–${s.endTime}`}
                    >
                      {s.playlist?.name ?? '—'}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
