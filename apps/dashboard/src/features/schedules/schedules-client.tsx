'use client';

import { motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CalendarClock, Play, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  fetchSchedules,
  fetchScheduleOverlaps,
  updateSchedule as apiUpdateSchedule,
  deleteSchedule as apiDeleteSchedule,
  setScreenOverride as apiSetScreenOverride,
} from '@/features/schedules/api/schedules-api';
import { fetchPlaylistOptions } from '@/features/screens/api/screens-api';
import { fetchScreens } from '@/features/screens/api/screens-api';
import { readPageItems } from '@/features/api/page';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { useTranslations } from 'next-intl';
import { shiftSameDayWindow } from './schedule-calendar-utils';
import { CreateScheduleForm } from '@/features/schedules/schedule-create-dialog';
import { ScheduleCalendar, ScheduleList } from '@/features/schedules/schedule-calendar';

const PX_PER_HOUR = 40;

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
      const [sRes, oData, pData, scData] = await Promise.all([
        fetchSchedules(workspaceId),
        fetchScheduleOverlaps(workspaceId),
        fetchPlaylistOptions(workspaceId),
        fetchScreens(workspaceId),
      ]);
      setSchedules(sRes.ok ? await readPageItems<ScheduleApi>(sRes) : []);
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

  const onDeleteSchedule = async (id: string) => {
    if (!workspaceId) return;
    if (!confirm(t('confirmDelete'))) return;
    const res = await apiDeleteSchedule(workspaceId, id);
    if (res.ok) {
      toast.success(t('deleted'));
      bumpWorkspaceDataEpoch();
      void load();
    } else toast.error(t('deleteFailed'));
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
            <Label htmlFor="override-screen">{t('fieldScreen')}</Label>
            <select
              id="override-screen"
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
            <Label htmlFor="override-playlist">{t('fieldPlaylist')}</Label>
            <select
              id="override-playlist"
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

      <ScheduleCalendar
        schedules={schedules}
        overlapIds={overlapIds}
        loading={loading}
        locale={locale}
        dayShort={dayShort}
        dragRef={dragRef}
        onDragStart={() => setDragActive(true)}
      />

      {!loading && schedules.length > 0 ? (
        <ScheduleList
          schedules={schedules}
          dayShort={dayShort}
          onDelete={(id) => void onDeleteSchedule(id)}
          t={t}
        />
      ) : null}
    </div>
  );
}
