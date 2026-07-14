'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createSchedule as apiCreateSchedule } from '@/features/schedules/api/schedules-api';
import { cn } from '@/lib/utils';

type PlaylistOpt = { id: string; name: string; _count?: { items: number } };
type ScreenOpt = { id: string; name: string };

export function CreateScheduleForm({
  locale,
  workspaceId,
  playlists,
  screens,
  onCreated,
  onCancel,
  t,
}: {
  locale: string;
  workspaceId: string;
  playlists: PlaylistOpt[];
  screens: ScreenOpt[];
  onCreated: () => void;
  onCancel: () => void;
  t: (key: string) => string;
}) {
  const [playlistId, setPlaylistId] = useState('');
  const [screenId, setScreenId] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [recurrence, setRecurrence] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>([1]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [priority, setPriority] = useState(10);
  const [saving, setSaving] = useState(false);

  const dayShort = (dow: number) => {
    const base = new Date(Date.UTC(2024, 0, 7 + dow));
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
      weekday: 'short',
    }).format(base);
  };

  const toggleDay = (d: number) => {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  };

  const toggleDom = (d: number) => {
    setDaysOfMonth((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b),
    );
  };

  const submit = async () => {
    const hasDays = recurrence === 'MONTHLY' ? daysOfMonth.length > 0 : days.length > 0;
    if (!playlistId || !hasDays) {
      toast.error(t('formInvalid'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreateSchedule({
        workspaceId,
        playlistId,
        screenId: screenId || null,
        daysOfWeek: recurrence === 'MONTHLY' ? [] : days,
        recurrence,
        daysOfMonth: recurrence === 'MONTHLY' ? daysOfMonth : [],
        startTime,
        endTime,
        priority,
      });
      if (!res.ok) {
        toast.error(t('saveFailed'));
        return;
      }
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="max-w-lg rounded-3xl border border-white/10 bg-card/95 backdrop-blur-xl">
      <DialogHeader>
        <DialogTitle>{t('createTitle')}</DialogTitle>
        <DialogDescription>{t('createDesc')}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="sched-playlist">{t('fieldPlaylist')}</Label>
          <select
            id="sched-playlist"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={playlistId}
            onChange={(e) => setPlaylistId(e.target.value)}
          >
            <option value="">{t('selectPlaylist')}</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sched-screen">{t('fieldScreenOptional')}</Label>
          <select
            id="sched-screen"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={screenId}
            onChange={(e) => setScreenId(e.target.value)}
          >
            <option value="">{t('allScreens')}</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label>{t('fieldRecurrence')}</Label>
          <div className="flex rounded-xl border border-border bg-background p-0.5">
            {(['WEEKLY', 'MONTHLY'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                aria-pressed={recurrence === r}
                className={cn(
                  'flex-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  recurrence === r
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(r === 'WEEKLY' ? 'recurrenceWeekly' : 'recurrenceMonthly')}
              </button>
            ))}
          </div>
        </div>
        {recurrence === 'WEEKLY' ? (
          <div className="grid gap-2">
            <Label>{t('fieldDays')}</Label>
            <div className="flex flex-wrap gap-2">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={days.includes(d)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    days.includes(d)
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {dayShort(d)}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{t('dayHint')}</p>
          </div>
        ) : (
          <div className="grid gap-2">
            <Label>{t('fieldDaysOfMonth')}</Label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDom(d)}
                  aria-pressed={daysOfMonth.includes(d)}
                  className={cn(
                    'h-8 w-8 rounded-lg text-xs font-medium tabular-nums transition-colors',
                    daysOfMonth.includes(d)
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">{t('dayOfMonthHint')}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label>{t('fieldStart')}</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="grid gap-2">
            <Label>{t('fieldEnd')}</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label>{t('fieldPriority')}</Label>
          <Input
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="rounded-xl"
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          disabled={saving}
          className="rounded-xl font-semibold" variant="cta"
          onClick={() => void submit()}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('save')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
