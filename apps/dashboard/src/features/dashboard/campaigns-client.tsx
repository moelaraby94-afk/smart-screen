'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus, Trash2, Loader2, Calendar, List } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { apiFetch } from '@/features/auth/session';
import { readPageItems } from '@/features/api/page';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { toast } from 'sonner';

type ScheduleRow = {
  id: string;
  playlistId: string;
  screenId: string | null;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  startDate: string | null;
  endDate: string | null;
  priority: number;
  enabled: boolean;
  playlist: { id: string; name: string } | null;
  screen: { id: string; name: string } | null;
};

type PlaylistRow = { id: string; name: string };
type ScreenRow = { id: string; name: string };

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function CampaignsClient() {
  const t = useTranslations('campaignsPage');
  const { workspaceId, workspaceDataEpoch, bumpWorkspaceDataEpoch } = useWorkspace();
  const { toastResponseError } = useApiErrorToast();
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newPlaylistId, setNewPlaylistId] = useState('');
  const [newScreenId, setNewScreenId] = useState('');
  const [newStartTime, setNewStartTime] = useState('09:00');
  const [newEndTime, setNewEndTime] = useState('17:00');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');

  const reload = useCallback(async () => {
    if (!workspaceId) {
      setSchedules([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const [schedRes, plRes, scrRes] = await Promise.all([
      apiFetch(`/schedules?workspaceId=${encodeURIComponent(workspaceId)}`),
      apiFetch(`/playlists?workspaceId=${encodeURIComponent(workspaceId)}`),
      apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}`),
    ]);
    if (schedRes.ok) {
      const items = await readPageItems<ScheduleRow>(schedRes);
      setSchedules(items);
    } else {
      setSchedules([]);
    }
    if (plRes.ok) {
      const items = await readPageItems<PlaylistRow>(plRes);
      setPlaylists(items);
    }
    if (scrRes.ok) {
      const items = await readPageItems<ScreenRow>(scrRes);
      setScreens(items);
    }
    setIsLoading(false);
  }, [workspaceId]);

  useEffect(() => { void reload(); }, [reload, workspaceDataEpoch]);

  const handleCreate = useCallback(async () => {
    if (!workspaceId || !newPlaylistId.trim()) return;
    setCreating(true);
    const res = await apiFetch('/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspaceId,
        playlistId: newPlaylistId.trim(),
        screenId: newScreenId.trim() || null,
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        startTime: newStartTime,
        endTime: newEndTime,
        enabled: true,
        priority: 0,
      }),
    });
    if (res.ok) {
      toast.success(t('created'));
      setNewPlaylistId('');
      setNewScreenId('');
      setShowCreate(false);
      await reload();
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
    setCreating(false);
  }, [workspaceId, newPlaylistId, newScreenId, newStartTime, newEndTime, reload, toastResponseError, bumpWorkspaceDataEpoch]);

  const handleDelete = useCallback(async (id: string) => {
    if (!workspaceId) return;
    const res = await apiFetch(`/schedules/${encodeURIComponent(id)}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setSchedules(prev => prev.filter(s => s.id !== id));
      toast.success(t('deleted'));
      bumpWorkspaceDataEpoch();
    } else {
      await toastResponseError(res);
    }
  }, [workspaceId, toastResponseError, bumpWorkspaceDataEpoch]);

  const activeCount = schedules.filter(s => s.enabled).length;

  const dayLabels = useMemo(() => [t('daySun'), t('dayMon'), t('dayTue'), t('dayWed'), t('dayThu'), t('dayFri'), t('daySat')], [t]);
  const dayShort = (dow: number) => dayLabels[dow] ?? '';

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getSchedulesForDay = (day: number) => schedules.filter(s => s.daysOfWeek.includes(day) && s.enabled);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <div className="rounded-lg border border-primary/20 bg-primary/10 p-2">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{schedules.length} {t('campaignsCount')}</p>
            <p className="text-xs text-muted-foreground">{activeCount} {t('active')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Calendar className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="me-1.5 h-4 w-4" />
            {t('createNew')}
          </Button>
        </div>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('createNew')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('playlistLabel')}</label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 py-2 text-[15px] outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={newPlaylistId}
                  onChange={(e) => setNewPlaylistId(e.target.value)}
                >
                  <option value="">{t('selectPlaylist')}</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('screenLabel')}</label>
                <select
                  className="flex h-11 w-full rounded-2xl border border-border bg-card px-4 py-2 text-[15px] outline-none transition focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
                  value={newScreenId}
                  onChange={(e) => setNewScreenId(e.target.value)}
                >
                  <option value="">{t('allScreens')}</option>
                  {screens.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('startTimeLabel')}</label>
                <Input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t('endTimeLabel')}</label>
                <Input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} />
              </div>
              <div className="flex items-end">
                <Button size="sm" className="w-full" disabled={!newPlaylistId.trim() || creating} onClick={handleCreate}>
                  {creating ? <Loader2 className="me-1.5 h-4 w-4 animate-spin" /> : <Plus className="me-1.5 h-4 w-4" />}
                  {t('create')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <EmptyState icon={Megaphone} title={t('noCampaigns')} description={t('noCampaignsDesc')} />
      ) : viewMode === 'timeline' ? (
        <Card className="p-4 overflow-x-auto">
          <div className="min-w-[800px]">
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
                          title={`${s.playlist?.name ?? 'Unknown'} · ${s.startTime}–${s.endTime}`}
                        >
                          {s.playlist?.name ?? 'Unknown'}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('startDate')}</TableHead>
                <TableHead>{t('endDate')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{s.playlist?.name ?? 'Unknown'}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.screen?.name ?? t('allScreens')} · {s.startTime}–{s.endTime} · {s.daysOfWeek.map(d => dayShort(d)).join(', ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={s.enabled ? 'success' : 'muted'}>{s.enabled ? t('activeBadge') : t('disabledBadge')}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.endDate ? new Date(s.endDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
