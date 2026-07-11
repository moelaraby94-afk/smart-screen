'use client';

import { motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CalendarClock, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchSchedules,
  fetchScheduleOverlaps,
  updateSchedule as apiUpdateSchedule,
  createSchedule as apiCreateSchedule,
  deleteSchedule as apiDeleteSchedule,
  setScreenOverride as apiSetScreenOverride,
} from '@/features/schedules/api/schedules-api';
import { fetchPlaylistOptions } from '@/features/screens/api/screens-api';
import { fetchScreens } from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import {
  formatHHmm,
  heightPxForSegment,
  parseHHmm,
  segmentsForColumn,
  shiftSameDayWindow,
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

type PlaylistOpt = { id: string; name: string; _count?: { items: number } };
type ScreenOpt = { id: string; name: string };

export function SchedulesClient({ locale }: { locale: string }) {
  const t = useTranslations('schedules');
  const { workspaceId, bumpWorkspaceDataEpoch } = useWorkspace();
  const [schedules, setSchedules] = useState<ScheduleApi[]>([]);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [playlists, setPlaylists] = useState<PlaylistOpt[]>([]);
  const [screens, setScreens] = useState<ScreenOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  const overlapIds = useMemo(() => {
    const s = new Set<string>();
    for (const [a, b] of pairs) {
      s.add(a);
      s.add(b);
    }
    return s;
  }, [pairs]);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [sData, oData, pData, scData] = await Promise.all([
        fetchSchedules(workspaceId),
        fetchScheduleOverlaps(workspaceId),
        fetchPlaylistOptions(workspaceId),
        fetchScreens(workspaceId),
      ]);
      setSchedules(sData);
      setPairs(oData.pairs ?? []);
      setPlaylists(pData);
      setScreens(scData);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const dayShort = useCallback(
    (dow: number) => {
      const base = new Date(Date.UTC(2024, 0, 7 + dow));
      return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en', {
        weekday: 'short',
      }).format(base);
    },
    [locale],
  );

  const dragRef = useRef<{
    id: string;
    startY: number;
    origStart: string;
    origEnd: string;
    currentStart: string;
    currentEnd: string;
  } | null>(null);

  const [dragActive, setDragActive] = useState(false);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dy = e.clientY - d.startY;
    const deltaMin = Math.round((dy / PX_PER_HOUR) * 60);
    const next = shiftSameDayWindow(d.origStart, d.origEnd, deltaMin);
    if (!next) return;
    d.currentStart = next.startTime;
    d.currentEnd = next.endTime;
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === d.id ? { ...s, startTime: next.startTime, endTime: next.endTime } : s,
      ),
    );
  }, []);

  const endDrag = useCallback(async () => {
    const d = dragRef.current;
    dragRef.current = null;
    setDragActive(false);
    if (!d || !workspaceId) return;
    if (d.currentStart === d.origStart && d.currentEnd === d.origEnd) return;
    const res = await apiUpdateSchedule(workspaceId, d.id, {
      startTime: d.currentStart,
      endTime: d.currentEnd,
    });
    if (!res.ok) {
      toast.error(t('saveFailed'));
      await load();
      return;
    }
    toast.success(t('saved'));
    bumpWorkspaceDataEpoch();
    await load();
  }, [workspaceId, load, t, bumpWorkspaceDataEpoch]);

  useEffect(() => {
    if (!dragActive) return;
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [dragActive, onPointerMove, endDrag]);

  const [overrideScreenId, setOverrideScreenId] = useState('');
  const [overridePlaylistId, setOverridePlaylistId] = useState('');

  const applyOverride = async () => {
    if (!workspaceId || !overrideScreenId || !overridePlaylistId) {
      toast.error(t('overrideNeed'));
      return;
    }
    const res = await apiSetScreenOverride(workspaceId, overrideScreenId, {
      playlistId: overridePlaylistId,
      durationMinutes: 480,
    });
    if (!res.ok) {
      toast.error(t('overrideFailed'));
      return;
    }
    toast.success(t('overrideOk'));
    bumpWorkspaceDataEpoch();
  };

  if (!workspaceId) {
    return (
      <p className="text-sm text-muted-foreground">{t('needWorkspace')}</p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="vc-card-surface rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <CalendarClock className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{t('engineTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('engineDesc')}</p>
            </div>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button className="rounded-xl font-semibold" variant="cta">
                <Plus className="me-2 h-4 w-4" />
                {t('addSchedule')}
              </Button>
            </DialogTrigger>
            <CreateScheduleForm
              locale={locale}
              workspaceId={workspaceId}
              playlists={playlists}
              screens={screens}
              onCreated={() => {
                setOpenCreate(false);
                bumpWorkspaceDataEpoch();
                void load();
                toast.success(t('saved'));
              }}
              onCancel={() => setOpenCreate(false)}
              t={t}
            />
          </Dialog>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary ring-1 ring-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t('legendScheduled')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1 font-medium text-accent ring-1 ring-accent/30">
            <span className="h-2 w-2 rounded-full bg-accent" />
            {t('legendOverlap')}
          </span>
        </div>
      </section>

      <section className="vc-card-surface rounded-2xl border border-border p-6 shadow-sm">
        <h3 className="mb-4 text-base font-semibold tracking-tight">{t('overrideTitle')}</h3>
        <p className="mb-4 text-sm text-muted-foreground">{t('overrideDesc')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-2">
            <Label>{t('fieldScreen')}</Label>
            <select
              className="h-10 min-w-[200px] rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={overrideScreenId}
              onChange={(e) => setOverrideScreenId(e.target.value)}
            >
              <option value="">{t('selectScreen')}</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>{t('fieldPlaylist')}</Label>
            <select
              className="h-10 min-w-[200px] rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={overridePlaylistId}
              onChange={(e) => setOverridePlaylistId(e.target.value)}
            >
              <option value="">{t('selectPlaylist')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            onClick={() => void applyOverride()}
            className="rounded-xl font-semibold" variant="cta"
          >
            <Play className="me-2 h-4 w-4" />
            {t('overrideCta')}
          </Button>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {t('loading')}
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
                            onPointerDown={(e) => {
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
                              setDragActive(true);
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

      {!loading && schedules.length > 0 ? (
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
                  onClick={async () => {
                    if (!workspaceId) return;
                    if (!confirm(t('confirmDelete'))) return;
                    const res = await apiDeleteSchedule(workspaceId, s.id);
                    if (res.ok) {
                      toast.success(t('deleted'));
                      bumpWorkspaceDataEpoch();
                      void load();
                    } else toast.error(t('deleteFailed'));
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function CreateScheduleForm({
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

  const submit = async () => {
    if (!playlistId || days.length === 0) {
      toast.error(t('formInvalid'));
      return;
    }
    setSaving(true);
    try {
      const res = await apiCreateSchedule({
        workspaceId,
        playlistId,
        screenId: screenId || null,
        daysOfWeek: days,
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
          <Label>{t('fieldPlaylist')}</Label>
          <select
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
          <Label>{t('fieldScreenOptional')}</Label>
          <select
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
          <Label>{t('fieldDays')}</Label>
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
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
