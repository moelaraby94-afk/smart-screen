'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { useRealtimeSocket } from '@/features/realtime/realtime-provider';
import {
  MapPin, Monitor, RefreshCw, BadgeAlert, Activity, Clock, Film, Zap,
  Megaphone, ListMusic, CalendarClock, ChevronRight, MoreHorizontal,
  PenLine, Trash2, BarChart3, RotateCcw, Check, X, Calendar,
  Wifi, WifiOff, Radio, Wrench, ArrowLeft,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchScreenById, fetchScreenAnalytics, fetchPlaylistOptions,
  sendRemoteCommand, updateScreen, setScreenOverride,
  deleteScreen as apiDeleteScreen,
  type ScreenAnalytics, type PlaylistOption,
} from '@/features/screens/api/screens-api';
import { fetchSchedules } from '@/features/schedules/api/schedules-api';
import { readPageItems } from '@/features/api/page';
import type { ScreenRow } from '@/features/screens/useApiScreens';
import {
  deriveFleetReachability, formatLastSeenRelative, ScreenFleetStatusBadge,
} from '@/features/screens/screen-fleet-status';
import { useScreenActivePreview } from '@/features/screens/use-screen-active-preview';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type ScheduleRow = {
  id: string;
  screenId: string | null;
  playlist: { id: string; name: string };
  recurrence: string;
  daysOfWeek: number[];
  daysOfMonth: number[];
  startTime: string;
  endTime: string;
  startDate: string | null;
  endDate: string | null;
  enabled: boolean;
};

type Props = { screenId: string; locale: string };

type ScreenEventType =
  | 'status_online'
  | 'status_offline'
  | 'status_maintenance'
  | 'content_change'
  | 'command_refresh'
  | 'command_identify'
  | 'command_restart'
  | 'reconnect'
  | 'override_activated'
  | 'override_cleared'
  | 'content_assigned';

type ScreenEvent = {
  id: string;
  type: ScreenEventType;
  timestamp: number;
  status: 'success' | 'error' | 'info';
};

const MAX_EVENTS = 5;

const EVENT_ICONS: Record<ScreenEventType, typeof Activity> = {
  status_online: Wifi,
  status_offline: WifiOff,
  status_maintenance: Wrench,
  content_change: Film,
  command_refresh: RefreshCw,
  command_identify: BadgeAlert,
  command_restart: RotateCcw,
  reconnect: Radio,
  override_activated: Zap,
  override_cleared: Zap,
  content_assigned: ListMusic,
};

const EVENT_LABEL_KEYS: Record<ScreenEventType, string> = {
  status_online: 'eventOnline',
  status_offline: 'eventOffline',
  status_maintenance: 'eventMaintenance',
  content_change: 'eventContentChange',
  command_refresh: 'eventCommandRefresh',
  command_identify: 'eventCommandIdentify',
  command_restart: 'eventCommandRestart',
  reconnect: 'eventReconnect',
  override_activated: 'eventOverrideActivated',
  override_cleared: 'eventOverrideCleared',
  content_assigned: 'eventContentAssigned',
};

function useScreenEventLog() {
  const eventsRef = useRef<ScreenEvent[]>([]);
  const [events, setEventsState] = useState<ScreenEvent[]>([]);
  const idCounter = useRef(0);

  const addEvent = useCallback((type: ScreenEventType, status: 'success' | 'error' | 'info' = 'info') => {
    const event: ScreenEvent = {
      id: `evt-${++idCounter.current}`,
      type,
      timestamp: Date.now(),
      status,
    };
    eventsRef.current = [event, ...eventsRef.current].slice(0, MAX_EVENTS);
    setEventsState(eventsRef.current);
  }, []);

  return { events, addEvent };
}

const EDITABLE_ROLES = ['OWNER', 'ADMIN', 'EDITOR'];

export function ScreenDetailClient({ screenId, locale }: Props) {
  const t = useTranslations('screensClient');
  const tDetail = useTranslations('screenDetail');
  const activeLocale = useLocale();
  const router = useRouter();
  const { workspaceId, workspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const isAr = locale === 'ar';

  const [screen, setScreen] = useState<ScreenRow | null>(null);
  const [analytics, setAnalytics] = useState<ScreenAnalytics | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignPlaylistId, setAssignPlaylistId] = useState('');
  const [assignBusy, setAssignBusy] = useState(false);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overridePlId, setOverridePlId] = useState('');
  const [overrideDuration, setOverrideDuration] = useState(480);
  const [overrideBusy, setOverrideBusy] = useState(false);

  const [tickerText, setTickerText] = useState('');
  const [tickerBusy, setTickerBusy] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [remoteBusy, setRemoteBusy] = useState(false);

  const [savingBranch, setSavingBranch] = useState(false);
  const screenNameRef = useRef<string | null>(null);

  const prevStatusRef = useRef<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const { events: screenEvents, addEvent } = useScreenEventLog();

  const userRole = useMemo(() => {
    const ws = workspaces.find((w) => w.id === workspaceId);
    return ws?.role ?? 'VIEWER';
  }, [workspaces, workspaceId]);
  const canEdit = EDITABLE_ROLES.includes(userRole);

  const screenSchedules = useMemo(
    () => schedules.filter((s) => s.screenId === screenId && s.enabled),
    [schedules, screenId],
  );

  const loadAll = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(false);
    try {
      const [screenRes, analyticsResult, playlistItems, schedsRes] = await Promise.all([
        fetchScreenById(workspaceId, screenId),
        fetchScreenAnalytics(workspaceId),
        fetchPlaylistOptions(workspaceId),
        fetchSchedules(workspaceId),
      ]);
      if (screenRes.ok) {
        const data = (await screenRes.json()) as ScreenRow;
        setScreen(data);
        screenNameRef.current = data.name;
        setTickerText(data.playerTicker ?? '');
        setOverridePlId(data.overridePlaylistId ?? '');
        prevStatusRef.current = data.status;
      } else {
        setScreen(null);
        if (screenRes.status !== 404) setError(true);
      }
      if (analyticsResult) setAnalytics(analyticsResult);
      setPlaylists(playlistItems);
      if (schedsRes.ok) {
        const schedItems = await readPageItems<ScheduleRow>(schedsRes);
        setSchedules(schedItems);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, screenId]);

  const refreshScreen = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const screenRes = await fetchScreenById(workspaceId, screenId);
      if (screenRes.ok) {
        const data = (await screenRes.json()) as ScreenRow;
        setScreen(data);
        screenNameRef.current = data.name;
        setTickerText(data.playerTicker ?? '');
        setOverridePlId(data.overridePlaylistId ?? '');
      }
    } catch {
      // silent — inline refresh failure should not flash error page
    }
  }, [workspaceId, screenId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingLocation && locationInputRef.current) {
      locationInputRef.current.focus();
    }
  }, [editingLocation]);

  // Realtime: screen:status for this specific screen
  const realtimeSocket = useRealtimeSocket();
  useEffect(() => {
    if (!workspaceId || !screen || !realtimeSocket) return;
    const socket = realtimeSocket;
    socket.on('screen:status', (payload: { screenId: string; status: string; lastSeenAt: string }) => {
      if (payload.screenId !== screenId) return;
      const prevStatus = prevStatusRef.current;
      setScreen((prev) =>
        prev ? { ...prev, status: payload.status as ScreenRow['status'], lastSeenAt: payload.lastSeenAt, updatedAt: payload.lastSeenAt } : prev,
      );
      if (prevStatus && prevStatus !== payload.status) {
        if (payload.status === 'OFFLINE') {
          toast.error(tDetail('statusOfflineToast', { name: screenNameRef.current ?? '' }));
          addEvent('status_offline', 'error');
        } else if (payload.status === 'ONLINE') {
          addEvent('status_online', 'success');
        } else if (payload.status === 'MAINTENANCE') {
          addEvent('status_maintenance', 'info');
        }
      }
      prevStatusRef.current = payload.status;
    });
    socket.on('screen:content', (payload: { screenId: string }) => {
      if (payload.screenId !== screenId) return;
      addEvent('content_change', 'info');
      void loadAll();
    });
    return () => {
      socket.off('screen:status');
      socket.off('screen:content');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, screenId, tDetail, realtimeSocket]);

  const handleSaveName = async () => {
    if (!workspaceId || !screen || savingName) return;
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      toast.error(tDetail('saveFailed'));
      return;
    }
    setSavingName(true);
    try {
      const res = await updateScreen(workspaceId, screenId, { name: trimmed });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('saved'));
      setEditingName(false);
      await refreshScreen();
    } catch {
      toast.error(tDetail('saveFailed'));
    } finally {
      setSavingName(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!workspaceId || !screen || savingLocation) return;
    setSavingLocation(true);
    try {
      const res = await updateScreen(workspaceId, screenId, {
        location: locationValue.trim() || null,
      });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('saved'));
      setEditingLocation(false);
      await refreshScreen();
    } catch {
      toast.error(tDetail('saveFailed'));
    } finally {
      setSavingLocation(false);
    }
  };

  const handleBranchChange = async (playlistGroupId: string | null) => {
    if (!workspaceId || !screen || savingBranch) return;
    const prevGroupId = screen.playlistGroupId ?? null;
    const prevGroup = screen.playlistGroup;
    setSavingBranch(true);
    setScreen((prev) => prev ? {
      ...prev,
      playlistGroupId: playlistGroupId ?? null,
      playlistGroup: playlistGroupId
        ? { id: playlistGroupId, name: playlists.find((p) => p.id === playlistGroupId)?.name ?? '' }
        : null,
    } : prev);
    try {
      const res = await updateScreen(workspaceId, screenId, {
        playlistGroupId: playlistGroupId ?? null,
      });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('branchChanged'));
    } catch {
      setScreen((prev) => prev ? {
        ...prev,
        playlistGroupId: prevGroupId,
        playlistGroup: prevGroup,
      } : prev);
      toast.error(tDetail('branchChangeFailed'));
    } finally {
      setSavingBranch(false);
    }
  };

  const handleRemote = async (cmd: 'refresh_content' | 'identify' | 'restart') => {
    if (!workspaceId || remoteBusy) return;
    setRemoteBusy(true);
    try {
      const res = await sendRemoteCommand(workspaceId, screenId, cmd);
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('commandSent'));
      if (cmd === 'refresh_content') addEvent('command_refresh', 'success');
      else if (cmd === 'identify') addEvent('command_identify', 'success');
      else if (cmd === 'restart') addEvent('command_restart', 'success');
    } catch {
      toast.error(tDetail('commandFailed'));
      if (cmd === 'refresh_content') addEvent('command_refresh', 'error');
      else if (cmd === 'identify') addEvent('command_identify', 'error');
      else if (cmd === 'restart') addEvent('command_restart', 'error');
    } finally {
      setRemoteBusy(false);
    }
  };

  const handleAssignPlaylist = async () => {
    if (!workspaceId || !screen || assignBusy) return;
    setAssignBusy(true);
    try {
      const res = await updateScreen(workspaceId, screenId, {
        activePlaylistId: assignPlaylistId || null,
      });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('contentAssigned', { name: screen.name }));
      addEvent('content_assigned', 'success');
      setAssignDialogOpen(false);
      await refreshScreen();
    } catch {
      toast.error(tDetail('contentAssignFailed'));
    } finally {
      setAssignBusy(false);
    }
  };

  const handleOverride = async () => {
    if (!workspaceId || !screen || overrideBusy) return;
    setOverrideBusy(true);
    try {
      const res = await setScreenOverride(workspaceId, screenId, {
        playlistId: overridePlId || null,
        durationMinutes: overridePlId ? overrideDuration : undefined,
      });
      if (!res.ok) throw new Error('fail');
      if (overridePlId) {
        toast.warning(tDetail('overrideActivated', { name: screen.name }));
        addEvent('override_activated', 'info');
      } else {
        toast.success(tDetail('overrideCleared', { name: screen.name }));
        addEvent('override_cleared', 'info');
      }
      setOverrideOpen(false);
      await refreshScreen();
    } catch {
      toast.error(tDetail('commandFailed'));
    } finally {
      setOverrideBusy(false);
    }
  };

  const handleTicker = async () => {
    if (!workspaceId || !screen || tickerBusy) return;
    setTickerBusy(true);
    try {
      const res = await updateScreen(workspaceId, screenId, {
        playerTicker: tickerText.trim() || null,
      });
      if (!res.ok) throw new Error('fail');
      toast.success(tDetail('commandSent'));
      await refreshScreen();
    } catch {
      toast.error(tDetail('commandFailed'));
    } finally {
      setTickerBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!workspaceId || !screen || deleting) return;
    setDeleting(true);
    try {
      const res = await apiDeleteScreen(workspaceId, screenId);
      if (!res.ok) throw new Error('fail');
      bumpWorkspaceDataEpoch();
      toast.success(tDetail('deleteSuccess', { name: screen.name }));
      router.push(`/${locale}/screens`);
    } catch {
      toast.error(tDetail('deleteFailed'));
      setDeleting(false);
    }
  };

  // ─── Loading state (skeleton) ───
  if (loading) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6 space-y-6" role="status" aria-label={tDetail('loadingScreen')}>
        <Skeleton className="h-5 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4" role="alert">
          <p className="text-lg font-semibold">{tDetail('errorLoadFailed')}</p>
          <Button variant="outline" onClick={() => void loadAll()}>
            <RefreshCw className="me-2 h-4 w-4" />
            {tDetail('errorRetry')}
          </Button>
        </div>
      </div>
    );
  }

  // ─── Not found state ───
  if (!screen) {
    return (
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold">{tDetail('notFound')}</p>
          <p className="text-sm text-muted-foreground">{tDetail('notFoundDesc')}</p>
          <Link href={`/${locale}/screens` as Route} className="text-sm text-primary hover:underline">
            {tDetail('backToScreens')}
          </Link>
        </div>
      </div>
    );
  }

  const reach = deriveFleetReachability(screen.status, screen.lastSeenAt);
  const lastSeenRelative = formatLastSeenRelative(screen.lastSeenAt, activeLocale) ?? '—';
  const createdDate = screen.updatedAt
    ? new Intl.DateTimeFormat(activeLocale, { dateStyle: 'medium' }).format(new Date(screen.updatedAt))
    : '—';
  const statusLabel =
    reach === 'online' ? t('fleetStatus.online')
      : reach === 'stale' ? t('fleetStatus.stale')
      : reach === 'maintenance' ? t('fleetStatus.maintenance')
      : t('fleetStatus.offline');
  const scheduleCount = screenSchedules.length;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-6 space-y-6" role="region" aria-label={tDetail('currentContent')}>
      {/* Section 1: Back button + Breadcrumbs + Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="rounded-lg" aria-label={tDetail('backToScreens')} onClick={() => router.push(`/${locale}/screens` as Route)}>
          <ArrowLeft className={cn('h-4 w-4', isAr && 'rotate-180')} />
        </Button>
        <nav aria-label={tDetail('breadcrumbLabel')} className="flex items-center gap-2 text-sm">
        <Link href={`/${locale}/screens` as Route} className="text-muted-foreground transition-colors hover:text-foreground">
          {t('fleet')}
        </Link>
        <ChevronRight className={`h-4 w-4 text-muted-foreground/50 ${isAr ? 'rotate-180' : ''}`} />
        <span className="font-medium text-foreground" aria-current="page">{screen.name}</span>
        </nav>
      </div>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">{screen.name}</h1>
          <ScreenFleetStatusBadge
            status={screen.status}
            lastSeenAt={screen.lastSeenAt}
            locale={locale}
            aria-label={tDetail('statusAria', { status: statusLabel })}
          />
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button variant="cta" className="rounded-lg w-full sm:w-auto" onClick={() => { setAssignPlaylistId(screen.activePlaylistId ?? ''); setAssignDialogOpen(true); }}>
              <ListMusic className="me-2 h-4 w-4" />
              {tDetail('assignContent')}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="rounded-lg" aria-label={tDetail('moreActions')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[12rem] rounded-lg">
              <DropdownMenuItem onClick={() => { setNameValue(screen.name); setEditingName(true); }}>
                <PenLine className="me-2 h-4 w-4" />
                {tDetail('editScreen')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push(`/${locale}/analytics` as Route)}>
                <BarChart3 className="me-2 h-4 w-4" />
                {tDetail('viewAnalytics')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleRemote('refresh_content')} disabled={remoteBusy}>
                <RefreshCw className="me-2 h-4 w-4" />
                {tDetail('syncContent')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleRemote('identify')} disabled={remoteBusy}>
                <BadgeAlert className="me-2 h-4 w-4" />
                {tDetail('identify')}
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => void handleRemote('restart')} disabled={remoteBusy}>
                    <RotateCcw className="me-2 h-4 w-4" />
                    {tDetail('rebootScreen')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Two-column: Current Content + Screen Info */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 2: Current Content */}
        <section aria-labelledby="current-content-heading" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <h2 id="current-content-heading" className="border-b border-border px-5 py-3 text-sm font-semibold tracking-tight">
            {tDetail('currentContent')}
          </h2>
          <div className="p-5 space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <ScreenPreview screenId={screenId} workspaceId={workspaceId} altText={tDetail('screenPreviewAlt')} />
              {screen.overridePlaylistId && (
                <div className="absolute start-2 top-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-warning">
                    <Zap className="h-3 w-3" />
                    {tDetail('overrideActive')}
                  </span>
                </div>
              )}
            </div>

            {screen.activePlaylist ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Film className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                    <span className="font-medium text-foreground">{screen.activePlaylist.name}</span>
                  </div>
                  <Link href={`/${locale}/content/playlists/${screen.activePlaylist.id}/studio` as Route} className="text-sm text-primary hover:underline">
                    {tDetail('editPlaylist')}
                  </Link>
                </div>
                {canEdit && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setOverridePlId(screen.overridePlaylistId ?? ''); setOverrideOpen(true); }}>
                      <Zap className="me-1.5 h-3.5 w-3.5" />
                      {tDetail('override')}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void handleRemote('refresh_content')} disabled={remoteBusy}>
                      <RefreshCw className="me-1.5 h-3.5 w-3.5" />
                      {tDetail('syncContent')}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void handleRemote('identify')} disabled={remoteBusy}>
                      <BadgeAlert className="me-1.5 h-3.5 w-3.5" />
                      {tDetail('identify')}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Monitor className="h-12 w-12 text-muted-foreground/30" strokeWidth={1.25} />
                <div>
                  <p className="font-medium text-foreground">{tDetail('currentContentEmpty')}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{tDetail('currentContentEmptyDesc')}</p>
                </div>
                {canEdit && (
                  <Button variant="cta" size="sm" className="rounded-lg" onClick={() => { setAssignPlaylistId(''); setAssignDialogOpen(true); }}>
                    <ListMusic className="me-2 h-4 w-4" />
                    {tDetail('assignContent')}
                  </Button>
                )}
              </div>
            )}

            {/* Ticker */}
            {canEdit && (
              <div className="space-y-2 border-t border-border pt-4">
                <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Megaphone className="h-4 w-4" />
                  {tDetail('tickerMessage')}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tickerText}
                    onChange={(e) => setTickerText(e.target.value)}
                    placeholder={tDetail('tickerMessage')}
                    maxLength={200}
                    disabled={tickerBusy}
                    className="rounded-lg"
                  />
                  <Button variant="outline" size="sm" className="rounded-lg shrink-0" disabled={tickerBusy || !tickerText.trim()} onClick={() => void handleTicker()}>
                    {t('refresh')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Screen Info */}
        <section aria-labelledby="screen-info-heading" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <h2 id="screen-info-heading" className="border-b border-border px-5 py-3 text-sm font-semibold tracking-tight">
            {tDetail('info')}
          </h2>
          <div className="p-5">
            <dl className="space-y-3 text-sm">
              {/* Name (inline editable) */}
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <PenLine className="h-4 w-4" strokeWidth={1.5} />
                  {tDetail('name')}
                </dt>
                <dd className="flex items-center gap-2">
                  {editingName && canEdit ? (
                    <>
                      <Input
                        ref={nameInputRef}
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSaveName();
                          if (e.key === 'Escape') setEditingName(false);
                        }}
                        className="h-8 w-32 rounded-lg text-sm"
                        maxLength={50}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={tDetail('save')} onClick={() => void handleSaveName()} disabled={savingName}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={tDetail('cancel')} onClick={() => setEditingName(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{screen.name}</span>
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={tDetail('rename')} onClick={() => { setNameValue(screen.name); setEditingName(true); }}>
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </dd>
              </div>

              {/* Location (inline editable) */}
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  {tDetail('locationLabel')}
                </dt>
                <dd className="flex items-center gap-2">
                  {editingLocation && canEdit ? (
                    <>
                      <Input
                        ref={locationInputRef}
                        value={locationValue}
                        onChange={(e) => setLocationValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleSaveLocation();
                          if (e.key === 'Escape') setEditingLocation(false);
                        }}
                        placeholder={tDetail('locationPlaceholder')}
                        className="h-8 w-32 rounded-lg text-sm"
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={tDetail('save')} onClick={() => void handleSaveLocation()} disabled={savingLocation}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={tDetail('cancel')} onClick={() => setEditingLocation(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-medium text-foreground">{screen.location || '—'}</span>
                      {canEdit && (
                        <Button size="icon" variant="ghost" className="h-7 w-7" aria-label={tDetail('locationLabel')} onClick={() => { setLocationValue(screen.location ?? ''); setEditingLocation(true); }}>
                          <PenLine className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </>
                  )}
                </dd>
              </div>

              {/* Branch (editable dropdown) */}
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" strokeWidth={1.5} />
                  {tDetail('branch')}
                </dt>
                <dd>
                  {canEdit ? (
                    <Select
                      value={screen.playlistGroupId ?? 'none'}
                      onValueChange={(v) => void handleBranchChange(v === 'none' ? null : v)}
                      disabled={savingBranch}
                    >
                      <SelectTrigger className="h-8 w-[180px] text-sm font-medium" aria-label={tDetail('branch')}>
                        <SelectValue placeholder={tDetail('noBranchSelect')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{tDetail('noBranchSelect')}</SelectItem>
                        {playlists.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium text-foreground">
                      {screen.playlistGroup?.name ?? tDetail('noBranch')}
                    </span>
                  )}
                </dd>
              </div>

              {/* Serial number */}
              <InfoRow icon={Monitor} label={tDetail('serialNumber')} value={screen.serialNumber} />

              {/* Resolution */}
              <InfoRow icon={Monitor} label={tDetail('resolution')} value={
                screen.resolutionWidth && screen.resolutionHeight
                  ? `${screen.resolutionWidth}×${screen.resolutionHeight}`
                  : '1920×1080'
              } />

              {/* Orientation */}
              <InfoRow icon={CalendarClock} label={tDetail('orientation')} value={screen.orientation ?? 'AUTO'} />

              {/* Last seen */}
              <InfoRow icon={Clock} label={tDetail('lastSeen')} value={lastSeenRelative} />

              {/* Player platform */}
              <InfoRow icon={Monitor} label={tDetail('playerPlatform')} value={screen.playerPlatform ?? '—'} />

              {/* Created date */}
              <InfoRow icon={Calendar} label={tDetail('createdDate')} value={createdDate} />

              {/* Override info */}
              {screen.overridePlaylistId && (
                <InfoRow icon={Zap} label={tDetail('overrideActive')} value={
                  screen.overrideExpiresAt
                    ? new Intl.DateTimeFormat(activeLocale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(screen.overrideExpiresAt))
                    : '—'
                } />
              )}
            </dl>

            {/* Analytics summary */}
            {analytics && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tDetail('analytics')}</h3>
                <dl className="space-y-3 text-sm">
                  <InfoRow icon={Activity} label={tDetail('uptime')} value={`${analytics.uptimePercent.toFixed(1)}%`} />
                  <InfoRow icon={Film} label={tDetail('withPlaylist')} value={`${analytics.withPlaylist}/${analytics.total}`} />
                </dl>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Section 4: Active Schedules (full width) */}
      <section aria-labelledby="active-schedules-heading" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="active-schedules-heading" className="text-sm font-semibold tracking-tight">
            {tDetail('activeSchedules')}
          </h2>
          <Link href={`/${locale}/scheduling?screen=${screenId}` as Route} className="text-sm text-primary hover:underline">
            {tDetail('viewAllSchedules')}
          </Link>
        </div>
        <div className="p-5">
          {screenSchedules.length > 0 ? (
            <ul className="divide-y divide-border">
              {screenSchedules.map((sched) => (
                <li key={sched.id}>
                  <Link
                    href={`/${locale}/scheduling` as Route}
                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarClock className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                      <div>
                        <p className="font-medium text-foreground">{sched.playlist.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sched.startTime} – {sched.endTime}
                          {sched.recurrence === 'MONTHLY' ? ` · ${tDetail('recurrenceMonthly')}` : ` · ${tDetail('recurrenceWeekly')}`}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground/50 ${isAr ? 'rotate-180' : ''}`} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CalendarClock className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.25} />
              <p className="font-medium text-foreground">{tDetail('noSchedules')}</p>
              <p className="text-sm text-muted-foreground">{tDetail('noSchedulesDesc')}</p>
              <Link href={`/${locale}/scheduling?screen=${screenId}` as Route} className="mt-1 text-sm text-primary hover:underline">
                {tDetail('createSchedule')}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Section 5: Recent Events (full width) */}
      <section aria-labelledby="recent-events-heading" className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <h2 id="recent-events-heading" className="border-b border-border px-5 py-3 text-sm font-semibold tracking-tight">
          {tDetail('recentEvents')}
        </h2>
        <div className="p-5">
          {screenEvents.length > 0 ? (
            <ul role="list" className="space-y-1" aria-label={tDetail('recentEvents')}>
              {screenEvents.map((evt) => {
                const Icon = EVENT_ICONS[evt.type];
                const label = tDetail(EVENT_LABEL_KEYS[evt.type] as never);
                const colorClass =
                  evt.status === 'error' ? 'text-destructive'
                    : evt.status === 'success' ? 'text-success'
                    : 'text-muted-foreground';
                const relativeTime = formatLastSeenRelative(new Date(evt.timestamp).toISOString(), activeLocale) ?? '';
                return (
                  <li
                    key={evt.id}
                    role="listitem"
                    className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/50', colorClass)}>
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate text-sm font-medium text-foreground">{label}</span>
                      <span className="text-xs text-muted-foreground" dir="auto">{relativeTime}</span>
                    </div>
                    {evt.status === 'error' && (
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-destructive">{tDetail('eventFailed')}</span>
                    )}
                    {evt.status === 'success' && (
                      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-success">{tDetail('eventSuccess')}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <Activity className="h-10 w-10 text-muted-foreground/30" strokeWidth={1.25} />
              <p className="font-medium text-foreground">{tDetail('noEvents')}</p>
              <p className="text-sm text-muted-foreground">{tDetail('noEventsDesc')}</p>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Danger Zone (Owner/Editor only) */}
      {canEdit && (
        <section aria-labelledby="danger-zone-heading" className="rounded-lg border border-destructive/20 bg-destructive/5 p-5">
          <h2 id="danger-zone-heading" className="text-sm font-semibold tracking-tight text-destructive">
            {tDetail('dangerZone')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{tDetail('dangerZoneDesc')}</p>
          <div className="mt-4">
            <Button variant="destructive" className="rounded-lg" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="me-2 h-4 w-4" />
              {tDetail('deleteScreen')}
            </Button>
          </div>
        </section>
      )}

      {/* Assign Content Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>{tDetail('assignContent')}</DialogTitle>
            <DialogDescription>
              {screen.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tDetail('assignPlaylist')}
              </Label>
              <select
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                value={assignPlaylistId}
                onChange={(e) => setAssignPlaylistId(e.target.value)}
              >
                <option value="">{tDetail('noPlaylist')}</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                {tDetail('cancel')}
              </Button>
              <Button variant="cta" onClick={() => void handleAssignPlaylist()} disabled={assignBusy}>
                {assignBusy ? tDetail('saving') : tDetail('assignContent')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Override Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle>{tDetail('override')}</DialogTitle>
            <DialogDescription>{tDetail('overrideDialogDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {tDetail('assignPlaylist')}
              </Label>
              <select
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                value={overridePlId}
                onChange={(e) => setOverridePlId(e.target.value)}
              >
                <option value="">{tDetail('noPlaylist')}</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {overridePlId && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {tDetail('overrideExpiresIn', { time: '' })}
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
                    value={String(overrideDuration)}
                    onChange={(e) => setOverrideDuration(parseInt(e.target.value, 10))}
                  >
                    <option value="30">30m</option>
                    <option value="60">1h</option>
                    <option value="240">4h</option>
                    <option value="480">8h</option>
                    <option value="1440">24h</option>
                  </select>
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={() => { setOverridePlId(''); void handleOverride(); }} disabled={overrideBusy}>
                    {tDetail('clearOverride')}
                  </Button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOverrideOpen(false)}>
                {tDetail('cancel')}
              </Button>
              <Button variant="cta" onClick={() => void handleOverride()} disabled={overrideBusy}>
                {overrideBusy ? tDetail('saving') : tDetail('override')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>{tDetail('deleteConfirmTitle', { name: screen.name })}</AlertDialogTitle>
            <AlertDialogDescription>
              {tDetail('deleteConfirm', { name: screen.name })}
              {scheduleCount > 0 && (
                <span className="mt-2 block font-medium text-warning">
                  {tDetail('deleteScheduleImpact', { count: scheduleCount })}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel autoFocus>{tDetail('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} disabled={deleting}>
              {deleting ? tDetail('deleting') : tDetail('deleteScreen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" strokeWidth={1.5} />
        {label}
      </dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ScreenPreview({ screenId, workspaceId, altText }: { screenId: string; workspaceId: string | null; altText: string }) {
  const { previewUrl } = useScreenActivePreview(screenId, workspaceId ?? '');
  if (previewUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={previewUrl} alt={altText} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Monitor className="h-16 w-16 text-muted-foreground/30" strokeWidth={1.25} />
    </div>
  );
}
