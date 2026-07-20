'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useLocale } from 'next-intl';
import {
  ArrowDown,
  ArrowUp,
  BadgeAlert,
  CalendarClock,
  CheckCircle2,
  Cpu,
  Film,
  ListMusic,
  Loader2,
  Megaphone,
  Monitor,
  MonitorSmartphone,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Smartphone,
  Tablet,
  Trash2,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  deleteScreen as apiDeleteScreen,
  fetchPlaylistOptions,
  sendRemoteCommand as apiSendRemoteCommand,
  setScreenOverride,
  updateScreen as apiUpdateScreen,
  fetchAssignments,
  addAssignment as apiAddAssignment,
  removeAssignment as apiRemoveAssignment,
  reorderAssignments as apiReorderAssignments,
  type PlaylistOption,
  type PlaylistAssignment,
} from '@/features/screens/api/screens-api';
import { createPlaylist as apiCreatePlaylist } from '@/features/studio/studio-api';
import { PlaylistCreateWizard } from '@/features/playlists/playlist-create-wizard';
import {
  fetchSchedules,
  createSchedule as apiCreateSchedule,
  deleteSchedule as apiDeleteSchedule,
} from '@/features/schedules/api/schedules-api';
import { readPageItems } from '@/features/api/page';
import { ScreenFleetStatusBadge } from '@/features/screens/screen-fleet-status';
import type { ClaimedScreenData } from '@/features/branches/use-player-pairing';
import type { ScreenRow } from './useApiScreens';

type ScheduleOpt = {
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
};

type TabKey = 'pairing' | 'content' | 'override' | 'schedule' | 'ticker' | 'settings';

type PairingProps = {
  code: string;
  setCode: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  busy: boolean;
  error: string | null;
  success: boolean;
  claimedScreen: ClaimedScreenData | null;
  claim: (playlistGroupId?: string) => Promise<void>;
  showProgressBanner: boolean;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screen: ScreenRow | null;
  workspaceId: string;
  locale: string;
  onSaved: () => Promise<void>;
  pairing: PairingProps;
  isPairingMode: boolean;
};

const TABS: { key: TabKey; icon: typeof ListMusic }[] = [
  { key: 'pairing', icon: Radio },
  { key: 'content', icon: ListMusic },
  { key: 'override', icon: Zap },
  { key: 'schedule', icon: CalendarClock },
  { key: 'ticker', icon: Megaphone },
  { key: 'settings', icon: MonitorSmartphone },
];

function formatDateTime(iso: string | null, locale: string): string {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getWeekdayShortLabels(locale: string): string[] {
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2024, 0, 7 + i);
    labels.push(new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(d));
  }
  return labels;
}

export function ScreenSetupModal({
  open,
  onOpenChange,
  screen,
  workspaceId,
  locale,
  onSaved,
  pairing,
  isPairingMode,
}: Props) {
  const t = useTranslations('screenSetupModal');
  const activeLocale = useLocale();
  const router = useRouter();

  const [wizardStep, setWizardStep] = useState(1);
  const autoAdvanceRef = useRef(false);
  const [wizardBranch, setWizardBranch] = useState<string>('');
  const [wizardNameError, setWizardNameError] = useState<string | null>(null);
  const [showCodeHelp, setShowCodeHelp] = useState(false);
  const [branchOptions, setBranchOptions] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>(isPairingMode ? 'pairing' : 'content');
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOpt[]>([]);
  const [tickerText, setTickerText] = useState('');
  const [orientation, setOrientation] = useState<'AUTO' | 'LANDSCAPE' | 'PORTRAIT'>('AUTO');
  const [overridePlId, setOverridePlId] = useState('');
  const [overrideDuration, setOverrideDuration] = useState(480);
  const [screenName, setScreenName] = useState('');
  const [screenLocation, setScreenLocation] = useState('');
  const [screenStatus, setScreenStatus] = useState<'ONLINE' | 'OFFLINE' | 'MAINTENANCE'>('ONLINE');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignments, setAssignments] = useState<PlaylistAssignment[]>([]);
  const [newAssignmentPl, setNewAssignmentPl] = useState('');
  const [newSchedPl, setNewSchedPl] = useState('');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [newSchedRecurrence, setNewSchedRecurrence] = useState<'WEEKLY' | 'MONTHLY'>('WEEKLY');
  const [newSchedDays, setNewSchedDays] = useState<number[]>([]);
  const [newSchedDaysOfMonth, setNewSchedDaysOfMonth] = useState<number[]>([]);
  const [newSchedStartTime, setNewSchedStartTime] = useState('09:00');
  const [newSchedEndTime, setNewSchedEndTime] = useState('17:00');
  const [newSchedStartDate, setNewSchedStartDate] = useState('');
  const [newSchedEndDate, setNewSchedEndDate] = useState('');
  const [pendingSettings, setPendingSettings] = useState<null | {
    name: string;
    location: string;
    orientation: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
    tickerText: string;
    overridePlId: string;
    overrideDuration: number;
  }>(null);

  const effectiveScreen: ScreenRow | ClaimedScreenData | null = pairing.claimedScreen ?? screen;
  const isPaired = Boolean(pairing.claimedScreen) || (!isPairingMode && screen);

  const loadOptions = useCallback(async () => {
    const [pls, schsRes] = await Promise.all([
      fetchPlaylistOptions(workspaceId),
      fetchSchedules(workspaceId),
    ]);
    setPlaylists(pls);
    setBranchOptions(pls.map((p) => ({ id: p.id, name: p.name })));
    setSchedules(schsRes.ok ? await readPageItems<ScheduleOpt>(schsRes) : []);
  }, [workspaceId]);

  const loadAssignments = useCallback(async (screenId: string) => {
    const data = await fetchAssignments(workspaceId, screenId);
    setAssignments(data);
  }, [workspaceId]);

  useEffect(() => {
    if (!open) return;
    setActiveTab(isPairingMode ? 'pairing' : 'content');
    setWizardStep(1);
    autoAdvanceRef.current = false;
    setWizardBranch('');
    setWizardNameError(null);
    setDirty(false);
    setConfirmDelete(false);
    if (effectiveScreen) {
      setTickerText(effectiveScreen.playerTicker ?? '');
      setOrientation(effectiveScreen.orientation ?? 'AUTO');
      setOverridePlId(effectiveScreen.overridePlaylistId ?? '');
      setScreenName(effectiveScreen.name);
      setScreenLocation(effectiveScreen.location ?? '');
      setScreenStatus((effectiveScreen as ScreenRow).status ?? 'OFFLINE');
    }
    void loadOptions();
    if (effectiveScreen?.id) {
      void loadAssignments(effectiveScreen.id);
    }
  }, [open, isPairingMode, effectiveScreen, loadOptions, loadAssignments]);

  useEffect(() => {
    if (isPairingMode && wizardStep === 1 && pairing.code.length === 6 && !autoAdvanceRef.current) {
      autoAdvanceRef.current = true;
      setWizardStep(2);
    }
    if (pairing.code.length < 6) {
      autoAdvanceRef.current = false;
    }
  }, [isPairingMode, wizardStep, pairing.code.length]);

  const markDirty = () => setDirty(true);

  useEffect(() => {
    if (!pairing.claimedScreen || !pendingSettings || !open) return;
    const screen = pairing.claimedScreen;
    void (async () => {
      setBusy(true);
      try {
        const updates: Parameters<typeof apiUpdateScreen>[2] = {};
        if (pendingSettings.name !== screen.name) updates.name = pendingSettings.name;
        if (pendingSettings.location !== (screen.location ?? '')) updates.location = pendingSettings.location.trim() || null;
        if (pendingSettings.orientation !== (screen.orientation ?? 'AUTO')) updates.orientation = pendingSettings.orientation;
        if (pendingSettings.tickerText.trim() !== (screen.playerTicker ?? '')) updates.playerTicker = pendingSettings.tickerText.trim() || null;

        const hasUpdates = Object.keys(updates).length > 0;
        if (hasUpdates) {
          const res = await apiUpdateScreen(workspaceId, screen.id, updates);
          if (!res.ok) throw new Error('update failed');
        }

        if (pendingSettings.overridePlId) {
          const overrideRes = await setScreenOverride(workspaceId, screen.id, {
            playlistId: pendingSettings.overridePlId,
            durationMinutes: pendingSettings.overrideDuration,
          });
          if (!overrideRes.ok) throw new Error('override failed');
        }

        setPendingSettings(null);
        setDirty(false);
        toast.success(t('settingsAppliedAfterPairing'));
        await onSaved();
      } catch {
        toast.error(t('saveFailed'));
      } finally {
        setBusy(false);
      }
    })();
  }, [pairing.claimedScreen, pendingSettings, open, workspaceId, t, onSaved]);

  const handleSyncContent = async () => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiSendRemoteCommand(workspaceId, effectiveScreen.id, 'refresh_content');
      if (!res.ok) { toast.error(t('syncFailed')); return; }
      toast.success(t('syncSent'));
    } finally { setBusy(false); }
  };

  const handleIdentify = async () => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiSendRemoteCommand(workspaceId, effectiveScreen.id, 'identify');
      if (!res.ok) { toast.error(t('identifyFailed')); return; }
      toast.success(t('identifySent'));
    } finally { setBusy(false); }
  };

  const handleRestart = async () => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiSendRemoteCommand(workspaceId, effectiveScreen.id, 'restart');
      if (!res.ok) { toast.error(t('restartFailed')); return; }
      toast.success(t('restartSent'));
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiDeleteScreen(workspaceId, effectiveScreen.id);
      if (!res.ok) { toast.error(t('deleteFailed')); return; }
      toast.success(t('deleteOk'));
      await onSaved();
      onOpenChange(false);
    } finally { setBusy(false); }
  };

  const handleAddAssignment = async () => {
    if (!effectiveScreen || !newAssignmentPl) return;
    setBusy(true);
    try {
      const res = await apiAddAssignment(workspaceId, effectiveScreen.id, newAssignmentPl);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.message ?? t('assignmentAddFailed'));
        return;
      }
      toast.success(t('assignmentAdded'));
      setNewAssignmentPl('');
      await loadAssignments(effectiveScreen.id);
    } finally { setBusy(false); }
  };

  const handleWizardCreate = async (data: { name: string }) => {
    const res = await apiCreatePlaylist(workspaceId || null, data.name);
    if (!res.ok) {
      toast.error(t('wizardCreateFailed'));
      return;
    }
    const created = (await res.json()) as { id: string };
    toast.success(t('wizardCreateSuccess'));
    const pls = await fetchPlaylistOptions(workspaceId);
    setPlaylists(pls);
    setNewAssignmentPl(created.id);
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiRemoveAssignment(workspaceId, effectiveScreen.id, assignmentId);
      if (!res.ok) { toast.error(t('assignmentRemoveFailed')); return; }
      toast.success(t('assignmentRemoved'));
      await loadAssignments(effectiveScreen.id);
    } finally { setBusy(false); }
  };

  const handleReorderAssignment = async (assignmentId: string, direction: 'up' | 'down') => {
    if (!effectiveScreen) return;
    const sorted = [...assignments].sort((a, b) => a.orderIndex - b.orderIndex);
    const idx = sorted.findIndex((a) => a.id === assignmentId);
    if (idx < 0) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === sorted.length - 1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const items = sorted.map((a, i) => ({ id: a.id, orderIndex: i }));
    [items[idx], items[swapIdx]] = [items[swapIdx], items[idx]];
    setBusy(true);
    try {
      await apiReorderAssignments(workspaceId, effectiveScreen.id, items);
      await loadAssignments(effectiveScreen.id);
    } finally { setBusy(false); }
  };

  const handleCreateSchedule = async () => {
    if (!effectiveScreen || !newSchedPl) return;
    if (newSchedRecurrence === 'WEEKLY' && newSchedDays.length === 0) {
      toast.error(t('selectDaysFirst'));
      return;
    }
    if (newSchedRecurrence === 'MONTHLY' && newSchedDaysOfMonth.length === 0) {
      toast.error(t('selectDaysOfMonthFirst'));
      return;
    }
    setBusy(true);
    try {
      const res = await apiCreateSchedule({
        workspaceId,
        playlistId: newSchedPl,
        screenId: effectiveScreen.id,
        recurrence: newSchedRecurrence,
        daysOfWeek: newSchedRecurrence === 'WEEKLY' ? newSchedDays : [],
        daysOfMonth: newSchedRecurrence === 'MONTHLY' ? newSchedDaysOfMonth : [],
        startTime: newSchedStartTime,
        endTime: newSchedEndTime,
        startDate: newSchedStartDate || null,
        endDate: newSchedEndDate || null,
        enabled: true,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.message ?? t('scheduleCreateFailed'));
        return;
      }
      toast.success(t('scheduleCreated'));
      setNewSchedPl('');
      setNewSchedDays([]);
      setNewSchedDaysOfMonth([]);
      setNewSchedStartDate('');
      setNewSchedEndDate('');
      setNewSchedRecurrence('WEEKLY');
      setNewSchedStartTime('09:00');
      setNewSchedEndTime('17:00');
      await loadOptions();
    } finally { setBusy(false); }
  };

  const handleDeleteSchedule = async (schedId: string) => {
    if (!effectiveScreen) return;
    setBusy(true);
    try {
      const res = await apiDeleteSchedule(workspaceId, schedId);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.message ?? t('scheduleDeleteFailed'));
        return;
      }
      toast.success(t('scheduleDeleted'));
      await loadOptions();
    } finally { setBusy(false); }
  };

  const handleSaveAll = async () => {
    if (!effectiveScreen) {
      setPendingSettings({
        name: screenName,
        location: screenLocation,
        orientation,
        tickerText,
        overridePlId,
        overrideDuration,
      });
      setDirty(false);
      toast.info(t('settingsWillApplyAfterPairing'));
      return;
    }
    setBusy(true);
    try {
      const updates: Parameters<typeof apiUpdateScreen>[2] = {};
      if (screenName !== effectiveScreen.name) updates.name = screenName;
      if (screenLocation !== (effectiveScreen.location ?? '')) updates.location = screenLocation.trim() || null;
      if (orientation !== (effectiveScreen.orientation ?? 'AUTO')) updates.orientation = orientation;
      if (tickerText.trim() !== (effectiveScreen.playerTicker ?? '')) updates.playerTicker = tickerText.trim() || null;
      if (screenStatus !== ((effectiveScreen as ScreenRow).status ?? 'OFFLINE')) updates.status = screenStatus;

      const hasUpdates = Object.keys(updates).length > 0;
      if (hasUpdates) {
        const res = await apiUpdateScreen(workspaceId, effectiveScreen.id, updates);
        if (!res.ok) { toast.error(t('saveFailed')); return; }
      }

      if (overridePlId !== (effectiveScreen.overridePlaylistId ?? '')) {
        const ovRes = await setScreenOverride(workspaceId, effectiveScreen.id, {
          playlistId: overridePlId || null,
          durationMinutes: overridePlId ? overrideDuration : undefined,
        });
        if (!ovRes.ok) { toast.error(t('overrideFailed')); return; }
      }

      toast.success(t('saveOk'));
      setDirty(false);
      await onSaved();
      onOpenChange(false);
    } finally { setBusy(false); }
  };

  const resolutionWidth = (effectiveScreen as ScreenRow)?.resolutionWidth ?? (effectiveScreen as ClaimedScreenData)?.resolutionWidth;
  const resolutionHeight = (effectiveScreen as ScreenRow)?.resolutionHeight ?? (effectiveScreen as ClaimedScreenData)?.resolutionHeight;
  const playerPlatform = (effectiveScreen as ScreenRow)?.playerPlatform ?? (effectiveScreen as ClaimedScreenData)?.playerPlatform ?? null;
  const serialNumber = effectiveScreen?.serialNumber ?? '';
  const screenStatusValue = (effectiveScreen as ScreenRow)?.status ?? 'OFFLINE';
  const lastSeenAt = (effectiveScreen as ScreenRow)?.lastSeenAt ?? null;
  const overridePlaylistId = effectiveScreen?.overridePlaylistId ?? null;
  const overrideExpiresAt = (effectiveScreen as ScreenRow)?.overrideExpiresAt ?? null;
  const isOfflineCacheMode = (effectiveScreen as ScreenRow)?.isOfflineCacheMode ?? false;

  const is4K = resolutionWidth && resolutionHeight
    ? resolutionWidth >= 3840 || resolutionHeight >= 2160
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-lg border-border p-0">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-4">
          <div className="min-w-0 flex-1">
            {isPaired && effectiveScreen ? (
              <>
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-semibold tracking-tight">{screenName || effectiveScreen.name}</h2>
                  <ScreenFleetStatusBadge
                    status={screenStatusValue as 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'}
                    lastSeenAt={lastSeenAt}
                    locale={locale}
                    tone="card"
                  />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono">{serialNumber}</span>
                  {resolutionWidth && resolutionHeight && (
                    <span className="flex items-center gap-1">
                      <Monitor className="h-3 w-3" />
                      {resolutionWidth}×{resolutionHeight}
                      {is4K && (
                        <span className="ms-1 rounded bg-primary/15 px-1 py-0.5 text-xs font-bold text-primary">4K</span>
                      )}
                    </span>
                  )}
                  {playerPlatform && (
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3 w-3" />
                      {playerPlatform}
                    </span>
                  )}
                  {overridePlaylistId && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">
                      <Zap className="h-3 w-3" />
                      {t('overrideActive')}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold tracking-tight">{t('pairNewDevice')}</h2>
              </div>
            )}
          </div>
          {isPaired && effectiveScreen && (
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="rounded-lg" disabled={busy} onClick={() => void handleSyncContent()}>
                <RefreshCw className="me-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('syncNow')}</span>
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-lg" disabled={busy} onClick={() => void handleIdentify()}>
                <BadgeAlert className="me-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('identify')}</span>
              </Button>
              <Button type="button" size="sm" variant="outline" className="rounded-lg" disabled={busy} onClick={() => void handleRestart()}>
                <RotateCcw className="me-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('restart')}</span>
              </Button>
            </div>
          )}
        </div>

        {/* Success banner */}
        {pairing.success && (
          <div className="flex shrink-0 items-center gap-2 border-b border-success/30 bg-success/10 px-6 py-2.5 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            {t('pairingSuccess')}
          </div>
        )}

        {/* Tab bar - always visible */}
        <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-4">
          {TABS.map(({ key, icon: Icon }) => {
            const showBadge = key === 'pairing' && pairing.success;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors whitespace-nowrap sm:px-4',
                  activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {t(`tab_${key}`)}
                {showBadge && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
              </button>
            );
          })}
        </div>

        {/* Tab content - fixed height, scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {/* Pairing tab — 3-step wizard */}
          {activeTab === 'pairing' && (
            <div className="space-y-5">
              {pairing.success && effectiveScreen ? (
                /* Success state with post-pairing CTAs */
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <CheckCircle2 className="h-16 w-16 text-success" strokeWidth={1.5} />
                    <h3 className="text-lg font-semibold text-foreground">{t('wizardSuccessTitle')}</h3>
                    <p className="max-w-sm text-sm text-muted-foreground">{t('wizardSuccessDesc')}</p>
                  </div>
                  <div className="grid gap-2 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground sm:grid-cols-2">
                    <span><span className="font-medium text-foreground">{t('screenName')}: </span>{effectiveScreen.name}</span>
                    <span><span className="font-medium text-foreground">{t('serialNumber')}: </span><span className="font-mono">{effectiveScreen.serialNumber}</span></span>
                    {resolutionWidth && resolutionHeight && (
                      <span><span className="font-medium text-foreground">{t('resolution')}: </span>{resolutionWidth}×{resolutionHeight}{is4K && <span className="ms-1 rounded bg-primary/15 px-1 text-xs font-bold text-primary">4K</span>}</span>
                    )}
                    {playerPlatform && (
                      <span><span className="font-medium text-foreground">{t('playerPlatform')}: </span>{playerPlatform}</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    <Button
                      variant="cta"
                      className="rounded-lg font-semibold"
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`/${activeLocale}/content/playlists` as Route);
                      }}
                    >
                      {t('wizardAssignContent')}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-lg"
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`/${activeLocale}/screens` as Route);
                      }}
                    >
                      {t('wizardBackToScreens')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-2" role="list" aria-label={t('wizardStepIndicator', { current: wizardStep, total: 3 })}>
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center gap-2" role="listitem">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                            s === wizardStep && 'bg-primary text-primary-foreground',
                            s < wizardStep && 'bg-success text-success-foreground',
                            s > wizardStep && 'bg-muted text-muted-foreground',
                          )}
                          aria-current={s === wizardStep ? 'step' : undefined}
                          aria-label={t('wizardStepIndicator', { current: s, total: 3 })}
                        >
                          {s < wizardStep ? <CheckCircle2 className="h-4 w-4" /> : s}
                        </div>
                        {s < 3 && (
                          <div className={cn('h-0.5 w-8 rounded-full', s < wizardStep ? 'bg-success' : 'bg-border')} />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-xs font-medium text-muted-foreground" aria-live="polite">
                    {t('wizardStepIndicator', { current: wizardStep, total: 3 })}
                  </p>

                  {/* Step 1: Pairing code */}
                  {wizardStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <p className="text-center text-sm leading-relaxed text-muted-foreground">
                          {t('wizardCodeHelp')}
                        </p>
                        <button
                          type="button"
                          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                          onClick={() => setShowCodeHelp((v) => !v)}
                          aria-expanded={showCodeHelp}
                          aria-controls="pair-code-help"
                        >
                          {t('wizardHelpTooltip')}
                        </button>
                      </div>
                      {showCodeHelp && (
                        <p
                          id="pair-code-help"
                          className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center text-xs leading-relaxed text-muted-foreground"
                        >
                          {t('wizardHelpTooltipContent')}
                        </p>
                      )}
                      {pairing.showProgressBanner && (
                        <div
                          role="status"
                          aria-live="polite"
                          className="space-y-2 rounded-lg border border-primary/40 bg-primary/12 px-3 py-3"
                        >
                          <p className="text-center text-xs font-medium leading-relaxed text-foreground">
                            {t('pairingProgress')}
                          </p>
                          <div className="space-y-1.5">
                            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('wizardTroubleshootingTitle')}
                            </p>
                            <ul className="space-y-1 text-xs leading-relaxed text-muted-foreground">
                              <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                                {t('wizardTip1')}
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                                {t('wizardTip2')}
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                                {t('wizardTip3')}
                              </li>
                              <li className="flex items-start gap-1.5">
                                <span className="mt-0.5 h-1 w-1 flex-shrink-0 rounded-full bg-primary" />
                                {t('wizardTip4')}
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}
                      {pairing.error && (
                        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive" role="alert" aria-live="assertive">
                          {pairing.error}
                        </p>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="pair-code" className="text-center text-xs font-medium text-muted-foreground">
                          {t('pairingCodeLabel')}
                        </Label>
                        <Input
                          id="pair-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          placeholder={t('pairingCodePlaceholder')}
                          value={pairing.code}
                          onChange={(e) => {
                            pairing.setCode(e.target.value);
                          }}
                          className="h-16 rounded-lg text-center font-mono text-3xl font-semibold tracking-[0.35em] text-foreground"
                          aria-invalid={Boolean(pairing.error)}
                          aria-label={t('pairingCodeLabel')}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && pairing.code.length === 6) {
                              setWizardStep(2);
                            }
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        className="h-12 w-full rounded-lg font-semibold"
                        variant="cta"
                        disabled={pairing.code.length !== 6}
                        onClick={() => setWizardStep(2)}
                      >
                        {t('wizardNext')}
                      </Button>
                    </div>
                  )}

                  {/* Step 2: Screen name */}
                  {wizardStep === 2 && (
                    <div className="space-y-4">
                      <p className="text-center text-sm leading-relaxed text-muted-foreground">
                        {t('wizardNameHelp')}
                      </p>
                      {wizardNameError && (
                        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive" role="alert" aria-live="assertive">
                          {wizardNameError}
                        </p>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="pair-name">{t('screenName')}</Label>
                        <Input
                          id="pair-name"
                          value={pairing.name}
                          onChange={(e) => {
                            pairing.setName(e.target.value);
                            setWizardNameError(null);
                          }}
                          placeholder={t('wizardNameSuggestion')}
                          className="rounded-lg"
                          aria-label={t('screenName')}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = pairing.name.trim();
                              if (trimmed.length < 2 || trimmed.length > 50) {
                                setWizardNameError(t('wizardNameError'));
                                return;
                              }
                              setWizardStep(3);
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 flex-1 rounded-lg"
                          onClick={() => setWizardStep(1)}
                        >
                          {t('wizardBack')}
                        </Button>
                        <Button
                          type="button"
                          variant="cta"
                          className="h-12 flex-1 rounded-lg font-semibold"
                          onClick={() => {
                            const trimmed = pairing.name.trim();
                            if (trimmed.length < 2 || trimmed.length > 50) {
                              setWizardNameError(t('wizardNameError'));
                              return;
                            }
                            setWizardStep(3);
                          }}
                        >
                          {t('wizardNext')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Branch (optional) */}
                  {wizardStep === 3 && (
                    <div className="space-y-4">
                      <p className="text-center text-sm leading-relaxed text-muted-foreground">
                        {t('wizardBranchHelp')}
                      </p>
                      <div className="space-y-2">
                        <Label htmlFor="pair-branch">{t('wizardStep3')}</Label>
                        <select
                          id="pair-branch"
                          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                          value={wizardBranch}
                          onChange={(e) => setWizardBranch(e.target.value)}
                          aria-label={t('wizardStep3')}
                        >
                          <option value="">{t('wizardBranchNone')}</option>
                          {branchOptions.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 flex-1 rounded-lg"
                          onClick={() => setWizardStep(2)}
                          disabled={pairing.busy}
                        >
                          {t('wizardBack')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-12 rounded-lg"
                          onClick={() => void pairing.claim(wizardBranch || undefined)}
                          disabled={pairing.busy}
                        >
                          {t('wizardSkip')}
                        </Button>
                        <Button
                          type="button"
                          variant="cta"
                          className="h-12 flex-1 rounded-lg font-semibold"
                          disabled={pairing.busy || pairing.code.length !== 6}
                          onClick={() => void pairing.claim(wizardBranch || undefined)}
                        >
                          {pairing.busy ? (
                            <span className="inline-flex items-center justify-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t('wizardPairingBusy')}
                            </span>
                          ) : (
                            <>
                              <Radio className="me-2 h-5 w-5" />
                              {t('wizardPairScreen')}
                            </>
                          )}
                        </Button>
                      </div>
                      {pairing.busy && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-10 w-full rounded-lg text-sm text-muted-foreground"
                          onClick={() => onOpenChange(false)}
                        >
                          {t('wizardCancelPairing')}
                        </Button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Content tab */}
          {activeTab === 'content' && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('currentStatus')}
                </p>
                <div className="flex items-center gap-2">
                  {overridePlaylistId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                      <Zap className="h-3 w-3" />
                      {t('overrideActive')}
                    </span>
                  ) : assignments.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      <Film className="h-3 w-3" />
                      {t('rotationActive')}
                    </span>
                  ) : (effectiveScreen as ScreenRow)?.activePlaylistId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      <Film className="h-3 w-3" />
                      {t('nowPlaying')}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('noContent')}</span>
                  )}
                  {assignments.length > 0 && (
                    <span className="truncate text-sm font-medium text-foreground">
                      {assignments.length} {t('playlistsInRotation')}
                    </span>
                  )}
                </div>
              </div>

              {/* Playlist rotation - primary content system */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-semibold">
                    <ListMusic className="h-4 w-4 text-primary" />
                    {t('playlistRotation')}
                  </Label>
                  <span className="text-xs text-muted-foreground">{t('sequentialPlaybackHint')}</span>
                </div>

                {assignments.length > 0 ? (
                  <div className="space-y-2">
                    {[...assignments].sort((a, b) => a.orderIndex - b.orderIndex).map((a, idx) => (
                      <div key={a.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                        <span className="flex-1 truncate text-sm font-medium">{a.playlist.name}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={busy || idx === 0}
                            onClick={() => void handleReorderAssignment(a.id, 'up')}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy || idx === assignments.length - 1}
                            onClick={() => void handleReorderAssignment(a.id, 'down')}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleRemoveAssignment(a.id)}
                            className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-2">{t('noAssignments')}</p>
                )}

                <div className="flex items-center gap-2">
                  <select
                    className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
                    value={newAssignmentPl}
                    onChange={(e) => setNewAssignmentPl(e.target.value)}
                  >
                    <option value="">{t('selectPlaylist')}</option>
                    {playlists.filter((p) => !assignments.some((a) => a.playlistId === p.id)).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg shrink-0"
                    disabled={busy}
                    onClick={() => setWizardOpen(true)}
                  >
                    <Sparkles className="me-1 h-4 w-4" />
                    {t('newPlaylist')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg shrink-0"
                    disabled={busy || !newAssignmentPl || !effectiveScreen}
                    onClick={() => void handleAddAssignment()}
                  >
                    <Plus className="me-1 h-4 w-4" />
                    {t('addPlaylist')}
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* Override tab */}
          {activeTab === 'override' && (
            <div className="space-y-6">
              {/* Quick override section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{t('quickOverride')}</h3>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground">{t('overridePlaylist')}</Label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
                  value={overridePlId}
                  onChange={(e) => { setOverridePlId(e.target.value); markDirty(); }}
                >
                  <option value="">{t('noOverride')}</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">{t('overrideHint')}</p>
              </div>

              {overridePlId && (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('overrideDuration')}</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { v: 30, label: t('dur30min') },
                      { v: 60, label: t('dur1h') },
                      { v: 240, label: t('dur4h') },
                      { v: 480, label: t('dur8h') },
                      { v: 1440, label: t('dur24h') },
                    ].map(({ v, label }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => { setOverrideDuration(v); markDirty(); }}
                        className={cn(
                          'rounded-lg border px-2 py-2.5 text-xs font-medium transition',
                          overrideDuration === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {overridePlaylistId && overrideExpiresAt && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{t('overrideExpiresAt')}: </span>
                  {formatDateTime(overrideExpiresAt, locale)}
                </div>
              )}

              {overridePlaylistId && !overrideExpiresAt && (
                <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
                  {t('overrideCurrentlyActive')}
                </div>
              )}
              </div>

            </div>
          )}

          {/* Schedule tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              {/* Schedule management */}
              <div className="space-y-3 rounded-lg border border-border p-4">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {t('scheduleFocus')}
                </Label>

                {/* Existing schedules for this screen */}
                {schedules.filter((s) => s.screenId === effectiveScreen?.id).length > 0 ? (
                  <div className="space-y-2">
                    {schedules.filter((s) => s.screenId === effectiveScreen?.id).map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{s.playlist?.name ?? s.id}</span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {s.recurrence === 'MONTHLY'
                              ? `${t('recurrenceMONTHLY')} · ${s.daysOfMonth.map((d) => d).join(', ')}`
                              : `${t('recurrenceWEEKLY')} · ${s.daysOfWeek.map((d) => getWeekdayShortLabels(locale)[d] ?? '').join(' ')}`}
                            {' · '}
                            {s.startTime}–{s.endTime}
                            {(s.startDate || s.endDate) && (
                              <span className="ms-1 text-xs">
                                ({s.startDate ? new Date(s.startDate).toLocaleDateString(locale) : '…'} → {s.endDate ? new Date(s.endDate).toLocaleDateString(locale) : '…'})
                              </span>
                            )}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDeleteSchedule(s.id)}
                          className="rounded-md p-1 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-2">{t('noSchedules')}</p>
                )}

                {/* New schedule form */}
                <div className="space-y-3 border-t border-border pt-3">
                  <select
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40"
                    value={newSchedPl}
                    onChange={(e) => setNewSchedPl(e.target.value)}
                  >
                    <option value="">{t('selectPlaylist')}</option>
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-2 gap-2">
                    {(['WEEKLY', 'MONTHLY'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setNewSchedRecurrence(r); setNewSchedDays([]); setNewSchedDaysOfMonth([]); }}
                        className={cn(
                          'rounded-lg border px-2 py-2 text-xs font-medium transition',
                          newSchedRecurrence === r ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                        )}
                      >
                        {t(`recurrence${r}`)}
                      </button>
                    ))}
                  </div>

                  {newSchedRecurrence === 'WEEKLY' && (
                    <div className="flex flex-wrap gap-1.5">
                      {getWeekdayShortLabels(locale).map((day, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setNewSchedDays((prev) => prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]);
                          }}
                          className={cn(
                            'h-8 w-8 rounded-lg border text-xs font-medium transition',
                            newSchedDays.includes(i) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}

                  {newSchedRecurrence === 'MONTHLY' && (
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setNewSchedDaysOfMonth((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
                          }}
                          className={cn(
                            'h-7 w-7 rounded-lg border text-xs font-medium transition',
                            newSchedDaysOfMonth.includes(day) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('startTime')}</Label>
                      <Input type="time" value={newSchedStartTime} onChange={(e) => setNewSchedStartTime(e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('endTime')}</Label>
                      <Input type="time" value={newSchedEndTime} onChange={(e) => setNewSchedEndTime(e.target.value)} className="rounded-lg" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('startDateOptional')}</Label>
                      <Input type="date" value={newSchedStartDate} onChange={(e) => setNewSchedStartDate(e.target.value)} className="rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">{t('endDateOptional')}</Label>
                      <Input type="date" value={newSchedEndDate} onChange={(e) => setNewSchedEndDate(e.target.value)} className="rounded-lg" />
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="cta"
                    className="w-full rounded-lg"
                    disabled={busy || !newSchedPl || !effectiveScreen}
                    onClick={() => void handleCreateSchedule()}
                  >
                    <Plus className="me-1.5 h-4 w-4" />
                    {t('addSchedule')}
                  </Button>
                </div>
              </div>

            </div>
          )}


          {/* Ticker tab */}
          {activeTab === 'ticker' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {t('tickerMessage')}
                </Label>
                <Input
                  value={tickerText}
                  onChange={(e) => { setTickerText(e.target.value); markDirty(); }}
                  placeholder={t('tickerPlaceholder')}
                  maxLength={200}
                  className="rounded-lg"
                />
                <p className="text-xs text-muted-foreground">{t('tickerHint')}</p>
              </div>
              {effectiveScreen?.playerTicker && (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{t('currentTicker')}: </span>
                  {effectiveScreen.playerTicker}
                </div>
              )}

            </div>
          )}

          {/* Settings tab */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('screenName')}</Label>
                  <Input value={screenName} onChange={(e) => { setScreenName(e.target.value); markDirty(); }} className="rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t('location')}</Label>
                  <Input value={screenLocation} onChange={(e) => { setScreenLocation(e.target.value); markDirty(); }} placeholder={t('locationPlaceholder')} className="rounded-lg" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">{t('status')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'ONLINE', label: t('statusOnline') },
                    { v: 'OFFLINE', label: t('statusOffline') },
                    { v: 'MAINTENANCE', label: t('statusMaintenance') },
                  ] as const).map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setScreenStatus(v); markDirty(); }}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm font-medium transition',
                        screenStatus === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MonitorSmartphone className="h-4 w-4 text-primary" />
                  {t('orientation')}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { v: 'AUTO', label: t('orientationAuto'), icon: Monitor },
                    { v: 'LANDSCAPE', label: t('orientationLandscape'), icon: Tablet },
                    { v: 'PORTRAIT', label: t('orientationPortrait'), icon: Smartphone },
                  ] as const).map(({ v, label, icon: Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => { setOrientation(v); markDirty(); }}
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-lg border px-3 py-4 text-sm font-medium transition',
                        orientation === v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{t('orientationHint')}</p>
              </div>

              {/* Device info */}
              {isPaired && effectiveScreen && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t('deviceInfo')}
                  </p>
                  <dl className="grid gap-3 text-xs sm:grid-cols-2">
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><Cpu className="h-3.5 w-3.5" />{t('playerPlatform')}</dt>
                      <dd className="font-medium text-foreground">{playerPlatform ?? '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-1.5 text-muted-foreground"><Monitor className="h-3.5 w-3.5" />{t('resolution')}</dt>
                      <dd className="font-medium text-foreground">
                        {resolutionWidth && resolutionHeight ? `${resolutionWidth}×${resolutionHeight}` : '—'}
                        {is4K && <span className="ms-1 rounded bg-primary/15 px-1 text-xs font-bold text-primary">4K</span>}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">{t('lastSeen')}</dt>
                      <dd className="font-medium text-foreground">{formatDateTime(lastSeenAt, locale)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted-foreground">{t('offlineCacheMode')}</dt>
                      <dd className="font-medium text-foreground">{isOfflineCacheMode ? t('yes') : t('no')}</dd>
                    </div>
                  </dl>
                </div>
              )}

              {/* Delete screen */}
              {isPaired && effectiveScreen && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  {!confirmDelete ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg border-destructive/40 text-destructive hover:bg-destructive/10"
                      disabled={busy}
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('deleteScreen')}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-destructive">{t('deleteConfirm')}</p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="destructive"
                          className="rounded-lg"
                          disabled={busy}
                          onClick={() => void handleDelete()}
                        >
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('deleteYes')}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-lg"
                          disabled={busy}
                          onClick={() => setConfirmDelete(false)}
                        >
                          {t('deleteNo')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-6 py-4">
          <p className={cn('text-xs', dirty ? 'font-medium text-warning' : 'text-muted-foreground')}>
            {dirty ? t('unsavedChanges') : t('allSaved')}
          </p>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
              {t('close')}
            </Button>
            <Button type="button" variant="cta" className="rounded-lg font-semibold" disabled={busy || !dirty} onClick={() => void handleSaveAll()}>
              {busy ? t('saving') : t('save')}
            </Button>
          </div>
        </div>
      </DialogContent>

      <PlaylistCreateWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={(data) => void handleWizardCreate(data)}
      />
    </Dialog>
  );
}
