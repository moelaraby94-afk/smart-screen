'use client';

import { useState } from 'react';
import { Loader2, Trash2, PowerOff } from 'lucide-react';
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
import {
  createSchedule as apiCreateSchedule,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule as apiDeleteSchedule,
  deactivateSchedule as apiDeactivateSchedule,
} from '@/features/schedules/api/schedules-api';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type PlaylistOpt = { id: string; name: string; _count?: { items: number } };
type ScreenOpt = { id: string; name: string };

type EditSchedule = {
  id: string;
  playlistId: string;
  screenId: string | null;
  daysOfWeek: number[];
  recurrence?: string;
  daysOfMonth?: number[];
  startTime: string;
  endTime: string;
  priority: number;
  enabled: boolean;
};

export function CreateScheduleForm({
  locale,
  workspaceId,
  playlists,
  screens,
  onCreated,
  onCancel,
  t,
  editSchedule,
}: {
  locale: string;
  workspaceId: string;
  playlists: PlaylistOpt[];
  screens: ScreenOpt[];
  onCreated: () => void;
  onCancel: () => void;
  t: ReturnType<typeof useTranslations<'schedules'>>;
  editSchedule?: EditSchedule | null;
}) {
  const isEdit = !!editSchedule;
  const [playlistId, setPlaylistId] = useState(editSchedule?.playlistId ?? '');
  const [screenId, setScreenId] = useState(editSchedule?.screenId ?? '');
  const [days, setDays] = useState<number[]>(editSchedule?.daysOfWeek ?? [1, 2, 3, 4, 5]);
  const [recurrence, setRecurrence] = useState<'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY'>(
    (editSchedule?.recurrence as 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY') ?? 'WEEKLY',
  );
  const [daysOfMonth, setDaysOfMonth] = useState<number[]>(editSchedule?.daysOfMonth ?? [1]);
  const [startTime, setStartTime] = useState(editSchedule?.startTime ?? '09:00');
  const [endTime, setEndTime] = useState(editSchedule?.endTime ?? '17:00');
  const [priority, setPriority] = useState(editSchedule?.priority ?? 10);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflictMsg, setConflictMsg] = useState('');

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

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!playlistId) e.playlist = t('errPlaylistRequired');
    const sm = startTime.split(':').reduce((h, m) => h * 60 + Number(m), 0);
    const em = endTime.split(':').reduce((h, m) => h * 60 + Number(m), 0);
    if (em <= sm) e.endTime = t('errEndAfterStart');
    if (recurrence === 'MONTHLY' && daysOfMonth.length === 0) e.days = t('errDaysRequired');
    if (recurrence === 'WEEKLY' && days.length === 0) e.days = t('errDaysRequired');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setConflictMsg('');
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        workspaceId,
        playlistId,
        screenId: screenId || null,
        daysOfWeek: recurrence === 'MONTHLY' || recurrence === 'ONCE' || recurrence === 'DAILY' ? [] : days,
        recurrence,
        daysOfMonth: recurrence === 'MONTHLY' ? daysOfMonth : [],
        startTime,
        endTime,
        priority,
      };
      if (recurrence === 'DAILY') payload.daysOfWeek = [0, 1, 2, 3, 4, 5, 6];
      let res: Response;
      if (isEdit && editSchedule) {
        res = await apiUpdateSchedule(workspaceId, editSchedule.id, payload);
      } else {
        res = await apiCreateSchedule(payload);
      }
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        setConflictMsg(body.message ?? t('conflictDetected'));
        toast.warning(t('conflictDetected'));
        return;
      }
      if (!res.ok) {
        toast.error(isEdit ? t('updateFailed') : t('saveFailed'));
        return;
      }
      toast.success(isEdit ? t('scheduleUpdated') : t('scheduleCreated'));
      onCreated();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editSchedule) return;
    if (!confirm(t('confirmDelete'))) return;
    setDeleting(true);
    try {
      const res = await apiDeleteSchedule(workspaceId, editSchedule.id);
      if (!res.ok) {
        toast.error(t('deleteFailed'));
        return;
      }
      toast.success(t('deleted'));
      onCreated();
    } finally {
      setDeleting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!editSchedule) return;
    setDeactivating(true);
    try {
      const res = await apiDeactivateSchedule(workspaceId, editSchedule.id);
      if (!res.ok) {
        toast.error(t('deactivateFailed'));
        return;
      }
      toast.success(t('deactivated'));
      onCreated();
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <DialogContent className="max-w-[600px] rounded-3xl border border-white/10 bg-card/95 backdrop-blur-xl">
      <DialogHeader>
        <DialogTitle>{isEdit ? t('editTitle') : t('createTitle')}</DialogTitle>
        <DialogDescription>{isEdit ? t('editDesc') : t('createDesc')}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-2" aria-live="polite">
        {conflictMsg && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {conflictMsg}
          </div>
        )}
        <div className="grid gap-2">
          <Label htmlFor="sched-playlist">{t('fieldPlaylist')}</Label>
          <select
            id="sched-playlist"
            className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
            value={playlistId}
            onChange={(e) => { setPlaylistId(e.target.value); setErrors((p) => ({ ...p, playlist: '' })); }}
            aria-invalid={!!errors.playlist}
            aria-describedby={errors.playlist ? 'err-playlist' : undefined}
          >
            <option value="">{t('selectPlaylist')}</option>
            {playlists.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {errors.playlist && <p id="err-playlist" className="text-xs text-destructive">{errors.playlist}</p>}
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
            {(['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRecurrence(r)}
                aria-pressed={recurrence === r}
                className={cn(
                  'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors',
                  recurrence === r
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(r === 'ONCE' ? 'recurrenceOnce' : r === 'DAILY' ? 'recurrenceDaily' : r === 'WEEKLY' ? 'recurrenceWeekly' : 'recurrenceMonthly')}
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
            <Label htmlFor="sched-start">{t('fieldStart')}</Label>
            <Input
              id="sched-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-xl"
              aria-label={t('fieldStart')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sched-end">{t('fieldEnd')}</Label>
            <Input
              id="sched-end"
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); setErrors((p) => ({ ...p, endTime: '' })); }}
              className="rounded-xl"
              aria-invalid={!!errors.endTime}
              aria-describedby={errors.endTime ? 'err-end' : undefined}
              aria-label={t('fieldEnd')}
            />
            {errors.endTime && <p id="err-end" className="text-xs text-destructive">{errors.endTime}</p>}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sched-priority">{t('fieldPriority')}</Label>
          <Input
            id="sched-priority"
            type="number"
            min={0}
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="rounded-xl"
            aria-label={t('fieldPriority')}
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        {isEdit ? (
          <>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
              onClick={() => void handleDelete()}
              disabled={deleting}
              aria-label={t('deleteScheduleAria')}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => void handleDeactivate()}
              disabled={deactivating}
            >
              {deactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="me-1 h-4 w-4" />}
              {t('deactivate')}
            </Button>
          </>
        ) : null}
        <Button type="button" variant="outline" className="rounded-2xl" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button
          type="button"
          disabled={saving}
          className="rounded-xl font-semibold" variant="cta"
          onClick={() => void submit()}
          aria-busy={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? t('saveChanges') : t('createSchedule')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
