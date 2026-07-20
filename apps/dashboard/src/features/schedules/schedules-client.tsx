'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CalendarClock, Play, Plus, CalendarDays, Calendar, List, LayoutDashboard, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { ScheduleCalendar, ScheduleList, getPlaylistColor } from '@/features/schedules/schedule-calendar';
import { SchedulesTimelineView } from '@/features/schedules/schedules-timeline-view';

const PX_PER_HOUR = 40;

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

type PlaylistOpt = { id: string; name: string; _count?: { items: number } };
type ScreenOpt = { id: string; name: string };

export function SchedulesClient({ locale }: { locale: string }) {
  const t = useTranslations('schedules');
  const { workspaceId, bumpWorkspaceDataEpoch, workspaces } = useWorkspace();
  const [schedules, setSchedules] = useState<ScheduleApi[]>([]);
  const [pairs, setPairs] = useState<Array<[string, string]>>([]);
  const [playlists, setPlaylists] = useState<PlaylistOpt[]>([]);
  const [screens, setScreens] = useState<ScreenOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editSchedule, setEditSchedule] = useState<ScheduleApi | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleApi | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [filterScreenId, setFilterScreenId] = useState('');
  const [filterPlaylistId, setFilterPlaylistId] = useState('');

  const canEdit = useMemo(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws && (ws.role === 'OWNER' || ws.role === 'ADMIN' || ws.role === 'EDITOR');
  }, [workspaces, workspaceId]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      if (filterScreenId && s.screenId !== filterScreenId) return false;
      if (filterPlaylistId && s.playlistId !== filterPlaylistId) return false;
      return true;
    });
  }, [schedules, filterScreenId, filterPlaylistId]);

  const sortedSchedules = useMemo(
    () => {
      const sorted = [...filteredSchedules];
      sorted.sort((a, b) => {
        switch (sortBy) {
          case 'playlist':
            return a.playlist.name.localeCompare(b.playlist.name);
          case 'screen':
            return (a.screen?.name ?? '').localeCompare(b.screen?.name ?? '');
          case 'time':
            return a.startTime.localeCompare(b.startTime);
          case 'priority':
          default:
            return b.priority - a.priority;
        }
      });
      return sorted;
    },
    [filteredSchedules, sortBy],
  );

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
    setError(false);
    try {
      const [sRes, oData, pData, scData] = await Promise.all([
        fetchSchedules(workspaceId, {
          screenId: filterScreenId || undefined,
          playlistId: filterPlaylistId || undefined,
        }),
        fetchScheduleOverlaps(workspaceId),
        fetchPlaylistOptions(workspaceId),
        fetchScreens(workspaceId),
      ]);
      if (!sRes.ok) {
        setError(true);
        setSchedules([]);
      } else {
        setSchedules(await readPageItems<ScheduleApi>(sRes));
      }
      setPairs(oData.pairs ?? []);
      setPlaylists(pData);
      setScreens(scData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filterScreenId, filterPlaylistId]);

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

  const dayLabels = useMemo(
    () => {
      const order = locale === 'ar' ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6];
      return order.map((d) => dayShort(d));
    },
    [dayShort, locale],
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
  const [overrideDuration, setOverrideDuration] = useState(480);

  const applyOverride = async () => {
    if (!workspaceId || !overrideScreenId || !overridePlaylistId) {
      toast.error(t('overrideNeed'));
      return;
    }
    const res = await apiSetScreenOverride(workspaceId, overrideScreenId, {
      playlistId: overridePlaylistId,
      durationMinutes: overrideDuration,
    });
    if (!res.ok) {
      toast.error(t('overrideFailed'));
      return;
    }
    toast.success(t('overrideOk'));
    bumpWorkspaceDataEpoch();
  };

  const onEditSchedule = (schedule: ScheduleApi) => {
    setEditSchedule(schedule);
    setOpenEdit(true);
  };

  const onDeleteSchedule = async () => {
    if (!workspaceId || !deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiDeleteSchedule(workspaceId, deleteTarget.id);
      if (res.ok) {
        toast.success(t('deleted'));
        bumpWorkspaceDataEpoch();
        void load();
      } else {
        toast.error(t('deleteFailed'));
      }
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (!workspaceId) {
    return (
      <p className="text-sm text-muted-foreground">{t('needWorkspace')}</p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="vc-card-surface rounded-lg border border-border p-6 shadow-sm">
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
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-label={t('viewCalendar')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'calendar' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                aria-label={t('viewTimeline')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutDashboard className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label={t('viewList')}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <select
              className="h-9 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label={t('sortBy')}
            >
              <option value="priority">{t('sortPriority')}</option>
              <option value="time">{t('sortTime')}</option>
              <option value="playlist">{t('sortPlaylist')}</option>
              <option value="screen">{t('sortScreen')}</option>
            </select>
            {canEdit && (
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
                  existingSchedules={schedules}
                  onCreated={() => {
                    setOpenCreate(false);
                    bumpWorkspaceDataEpoch();
                    void load();
                  }}
                  onCancel={() => setOpenCreate(false)}
                  t={t}
                />
              </Dialog>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-medium text-primary ring-1 ring-primary/20">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t('legendScheduled')}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive ring-1 ring-destructive/20">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            {t('legendOverlap')}
          </span>
          {playlists.filter((p) => filteredSchedules.some((s) => s.playlistId === p.id)).map((p) => (
            <span key={p.id} className="inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1 font-medium text-foreground ring-1 ring-border/40">
              <span className="h-2 w-2 rounded-full" style={{ background: getPlaylistColor(p.id) }} />
              {p.name}
            </span>
          ))}
        </div>
      </section>

      <section className="vc-card-surface rounded-lg border border-border p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight">{t('filterTitle')}</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-9 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={filterScreenId}
              onChange={(e) => setFilterScreenId(e.target.value)}
              aria-label={t('filterByScreen')}
            >
              <option value="">{t('allScreens')}</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <select
              className="h-9 rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={filterPlaylistId}
              onChange={(e) => setFilterPlaylistId(e.target.value)}
              aria-label={t('filterByPlaylist')}
            >
              <option value="">{t('allPlaylists')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {canEdit && (
        <section className="vc-card-surface rounded-lg border border-border p-6 shadow-sm">
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
            <div className="grid gap-2">
              <Label htmlFor="override-duration">{t('fieldDuration')}</Label>
              <select
                id="override-duration"
                className="h-10 min-w-[160px] rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
                value={overrideDuration}
                onChange={(e) => setOverrideDuration(Number(e.target.value))}
              >
                <option value={30}>{t('duration30min')}</option>
                <option value={60}>{t('duration1h')}</option>
                <option value={120}>{t('duration2h')}</option>
                <option value={240}>{t('duration4h')}</option>
                <option value={480}>{t('duration8h')}</option>
                <option value={720}>{t('duration12h')}</option>
                <option value={1440}>{t('duration24h')}</option>
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
      )}

      {error ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="text-sm text-destructive">{t('errorFetch')}</p>
          <Button variant="outline" onClick={() => void load()}>
            {t('retry')}
          </Button>
        </div>
      ) : !loading && filteredSchedules.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title={schedules.length === 0 ? t('emptyTitle') : t('emptyFilteredTitle')}
          description={schedules.length === 0 ? t('emptyDescription') : t('emptyFilteredDescription')}
          actionLabel={canEdit && schedules.length === 0 ? t('addSchedule') : undefined}
          onAction={canEdit && schedules.length === 0 ? () => setOpenCreate(true) : undefined}
        />
      ) : viewMode === 'timeline' ? (
        <SchedulesTimelineView
          schedules={sortedSchedules}
          dayLabels={dayLabels}
          dayOrder={locale === 'ar' ? [6, 0, 1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6]}
        />
      ) : viewMode === 'list' ? (
        <ScheduleList
          schedules={sortedSchedules}
          overlapIds={overlapIds}
          dayShort={dayShort}
          onDelete={(id) => {
            const s = schedules.find((x) => x.id === id);
            if (s) setDeleteTarget(s);
          }}
          onEdit={canEdit ? onEditSchedule : undefined}
          t={t}
        />
      ) : (
        <>
          <ScheduleCalendar
            schedules={sortedSchedules}
            overlapIds={overlapIds}
            loading={loading}
            locale={locale}
            dayShort={dayShort}
            dragRef={dragRef}
            onDragStart={() => setDragActive(true)}
            onEventClick={canEdit ? onEditSchedule : undefined}
            onDayClick={canEdit ? () => setOpenCreate(true) : undefined}
          />
          {!loading && sortedSchedules.length > 0 ? (
            <ScheduleList
              schedules={sortedSchedules}
              overlapIds={overlapIds}
              dayShort={dayShort}
              onDelete={(id) => {
                const s = schedules.find((x) => x.id === id);
                if (s) setDeleteTarget(s);
              }}
              onEdit={canEdit ? onEditSchedule : undefined}
              t={t}
            />
          ) : null}
        </>
      )}

      {canEdit && editSchedule && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <CreateScheduleForm
            locale={locale}
            workspaceId={workspaceId}
            playlists={playlists}
            screens={screens}
            existingSchedules={schedules}
            onCreated={() => {
              setOpenEdit(false);
              setEditSchedule(null);
              bumpWorkspaceDataEpoch();
              void load();
            }}
            onCancel={() => { setOpenEdit(false); setEditSchedule(null); }}
            t={t}
            editSchedule={editSchedule}
          />
        </Dialog>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void onDeleteSchedule()}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t('deleting') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
