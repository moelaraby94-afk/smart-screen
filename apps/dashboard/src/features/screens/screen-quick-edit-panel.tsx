'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, ListMusic, Megaphone, MonitorSmartphone, MapPin, Monitor, Zap, X, RefreshCw, BadgeAlert, Film } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchPlaylistOptions, setScreenOverride, updateScreen as apiUpdateScreen, sendRemoteCommand as apiSendRemoteCommand } from '@/features/screens/api/screens-api';
import { fetchSchedules, updateSchedule as apiUpdateSchedule } from '@/features/schedules/api/schedules-api';
import { readPageItems } from '@/features/api/page';
import { cn } from '@/lib/utils';
import type { ScreenRow } from './useApiScreens';

type PlaylistOpt = { id: string; name: string };
type ScheduleOpt = {
  id: string;
  screenId: string | null;
  playlist: { id: string; name: string };
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screen: ScreenRow | null;
  workspaceId: string;
  locale: string;
  onSaved: () => Promise<void>;
  onEditScreen: () => void;
};

export function ScreenQuickEditPanel({
  open,
  onOpenChange,
  screen,
  workspaceId,
  locale,
  onSaved,
  onEditScreen,
}: Props) {
  const t = useTranslations('screenQuickEditPanel');
  const dir = useLocale() === 'ar' ? -1 : 1;
  const [playlists, setPlaylists] = useState<PlaylistOpt[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOpt[]>([]);
  const [playlistId, setPlaylistId] = useState<string>('');
  const [scheduleId, setScheduleId] = useState<string>('');
  const [tickerText, setTickerText] = useState<string>('');
  const [orientation, setOrientation] = useState<'AUTO' | 'LANDSCAPE' | 'PORTRAIT'>('AUTO');
  const [overridePlId, setOverridePlId] = useState<string>('');
  const [overrideDuration, setOverrideDuration] = useState<number>(480);
  const [location, setLocation] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const loadOptions = useCallback(async () => {
    const [pls, schsRes] = await Promise.all([
      fetchPlaylistOptions(workspaceId),
      fetchSchedules(workspaceId),
    ]);
    setPlaylists(pls);
    setSchedules(schsRes.ok ? await readPageItems<ScheduleOpt>(schsRes) : []);
  }, [workspaceId]);

  useEffect(() => {
    if (!open || !screen) return;
    setPlaylistId(screen.activePlaylistId ?? '');
    setTickerText(screen.playerTicker ?? '');
    setOrientation(screen.orientation ?? 'AUTO');
    setOverridePlId(screen.overridePlaylistId ?? '');
    setLocation(screen.location ?? '');
    void loadOptions();
  }, [open, screen, loadOptions]);

  useEffect(() => {
    if (!open || !screen) return;
    const match = schedules.find((s) => s.screenId === screen.id);
    setScheduleId(match?.id ?? '');
  }, [open, screen, schedules]);

  const handleSyncContent = async () => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiSendRemoteCommand(workspaceId, screen.id, 'refresh_content');
      if (!res.ok) {
        toast.error(t('syncFailed'));
        return;
      }
      toast.success(t('syncSent'));
    } finally {
      setBusy(false);
    }
  };

  const handleIdentify = async () => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiSendRemoteCommand(workspaceId, screen.id, 'identify');
      if (!res.ok) {
        toast.error(t('identifyFailed'));
        return;
      }
      toast.success(t('identifySent'));
    } finally {
      setBusy(false);
    }
  };

  const applyPlaylist = async (nextId: string) => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiUpdateScreen(workspaceId, screen.id, {
        activePlaylistId: nextId || null,
      });
      if (!res.ok) {
        toast.error(t('couldNotUpdatePlaylist'));
        return;
      }
      toast.success(t('playlistAssigned'));
      setPlaylistId(nextId);
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  const applyTicker = async () => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiUpdateScreen(workspaceId, screen.id, {
        playerTicker: tickerText.trim() || null,
      });
      if (!res.ok) {
        toast.error(t('tickerFailed'));
        return;
      }
      toast.success(t('tickerSent'));
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  const applyScheduleTarget = async (schId: string) => {
    if (!screen) return;
    setBusy(true);
    try {
      const targeting = schedules.filter((s) => s.screenId === screen.id);
      for (const s of targeting) {
        const clr = await apiUpdateSchedule(workspaceId, s.id, { screenId: null });
        if (!clr.ok) {
          toast.error(t('couldNotUpdateSchedule'));
          setBusy(false);
          return;
        }
      }
      if (!schId) {
        toast.success(t('scheduleCleared'));
        setScheduleId('');
        await onSaved();
        await loadOptions();
        return;
      }
      const res = await apiUpdateSchedule(workspaceId, schId, { screenId: screen.id });
      if (!res.ok) {
        toast.error(t('couldNotAttachSchedule'));
        return;
      }
      toast.success(t('schedulePinned'));
      setScheduleId(schId);
      await onSaved();
      await loadOptions();
    } finally {
      setBusy(false);
    }
  };

  const applyOverride = async (plId: string, durationMin: number) => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await setScreenOverride(workspaceId, screen.id, {
        playlistId: plId || null,
        durationMinutes: plId ? durationMin : undefined,
      });
      if (!res.ok) {
        toast.error(t('overrideFailed'));
        return;
      }
      toast.success(plId ? t('overrideSet') : t('overrideCleared'));
      setOverridePlId(plId);
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  const applyOrientation = async (next: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT') => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiUpdateScreen(workspaceId, screen.id, { orientation: next });
      if (!res.ok) {
        toast.error(t('orientationFailed'));
        return;
      }
      toast.success(t('orientationSaved'));
      setOrientation(next);
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  const applyLocation = async () => {
    if (!screen) return;
    setBusy(true);
    try {
      const res = await apiUpdateScreen(workspaceId, screen.id, {
        location: location.trim() || null,
      });
      if (!res.ok) {
        toast.error(t('locationFailed'));
        return;
      }
      toast.success(t('locationSaved'));
      await onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && screen ? (
        <>
          <motion.button
            type="button"
            aria-label={t('closePanel')}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal
            className={cn(
              'fixed inset-y-0 z-[70] flex w-full max-w-md flex-col border-l border-white/15 bg-background/80 shadow-2xl backdrop-blur-2xl dark:bg-background/70',
              'end-0',
            )}
            initial={{ x: `${100 * dir}%` }}
            animate={{ x: 0 }}
            exit={{ x: `${100 * dir}%` }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-6 py-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('quickEdit')}
                </p>
                <h2 className="mt-1 truncate text-lg font-semibold tracking-tight">{screen.name}</h2>
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">{screen.serialNumber}</p>
                {screen.resolutionWidth && screen.resolutionHeight ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Monitor className="h-3 w-3" />
                    {screen.resolutionWidth}×{screen.resolutionHeight}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="shrink-0 rounded-lg"
                aria-label={t('closePanel')}
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('contentStatus')}
                </p>
                <div className="flex items-center gap-2">
                  {screen.overridePlaylistId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/10 px-2.5 py-1 text-xs font-bold text-warning">
                      <Zap className="h-3 w-3" />
                      {t('overrideActiveBadge')}
                    </span>
                  ) : screen.activePlaylistId ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 px-2.5 py-1 text-xs font-bold text-success">
                      <Film className="h-3 w-3" />
                      {t('nowPlaying')}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('noContent')}</span>
                  )}
                  {screen.activePlaylist && (
                    <span className="truncate text-sm font-medium text-foreground">
                      {screen.overridePlaylistId
                        ? playlists.find((p) => p.id === screen.overridePlaylistId)?.name ?? '—'
                        : screen.activePlaylist.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    disabled={busy}
                    onClick={() => void handleSyncContent()}
                  >
                    <RefreshCw className="me-1.5 h-3.5 w-3.5" />
                    {t('syncNow')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-lg text-xs"
                    disabled={busy}
                    onClick={() => void handleIdentify()}
                  >
                    <BadgeAlert className="me-1.5 h-3.5 w-3.5" />
                    {t('identifyScreen')}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <ListMusic className="h-4 w-4 text-primary" />
                  {t('activePlaylist')}
                </Label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none ring-0 focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                  value={playlistId}
                  disabled={busy}
                  aria-label={t('activePlaylist')}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPlaylistId(v);
                    void applyPlaylist(v);
                  }}
                >
                  <option value="">{t('noneOption')}</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {t('activePlaylistHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {t('scheduleFocus')}
                </Label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                  value={scheduleId}
                  disabled={busy}
                  aria-label={t('scheduleFocus')}
                  onChange={(e) => {
                    const v = e.target.value;
                    setScheduleId(v);
                    void applyScheduleTarget(v);
                  }}
                >
                  <option value="">{t('clearScheduleOption')}</option>
                  {schedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.playlist?.name ?? s.id}
                      {s.screenId === screen.id ? t('thisScreenSuffix') : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {t('scheduleFocusHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Zap className="h-4 w-4 text-primary" />
                  {t('overrideLabel')}
                </Label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none ring-0 focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                  value={overridePlId}
                  disabled={busy}
                  aria-label={t('overrideLabel')}
                  onChange={(e) => {
                    const v = e.target.value;
                    setOverridePlId(v);
                    if (v) void applyOverride(v, overrideDuration);
                    else void applyOverride('', 0);
                  }}
                >
                  <option value="">{t('overrideNone')}</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {overridePlId ? (
                  <>
                    <select
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none ring-0 focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                      value={String(overrideDuration)}
                      disabled={busy}
                      aria-label={t('overrideDuration')}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        setOverrideDuration(v);
                        void applyOverride(overridePlId, v);
                      }}
                    >
                      <option value="30">{t('override30min')}</option>
                      <option value="60">{t('override1h')}</option>
                      <option value="240">{t('override4h')}</option>
                      <option value="480">{t('override8h')}</option>
                      <option value="1440">{t('override24h')}</option>
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-lg text-sm"
                      disabled={busy}
                      onClick={() => {
                        setOverridePlId('');
                        void applyOverride('', 0);
                      }}
                    >
                      {t('overrideClear')}
                    </Button>
                  </>
                ) : null}
                <p className="text-xs text-muted-foreground">{t('overrideHint')}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <Megaphone className="h-4 w-4 text-primary" />
                  {t('tickerLabel')}
                </Label>
                <Input
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  placeholder={t('tickerPlaceholder')}
                  maxLength={200}
                  disabled={busy}
                  className="rounded-lg"
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="cta"
                    className="rounded-lg text-sm"
                    disabled={busy || !tickerText.trim()}
                    onClick={() => void applyTicker()}
                  >
                    {t('tickerSend')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg text-sm"
                    disabled={busy || !tickerText}
                    onClick={() => {
                      setTickerText('');
                      void applyTicker();
                    }}
                  >
                    {t('tickerClear')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('tickerHint')}</p>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MapPin className="h-4 w-4 text-primary" />
                  {t('locationLabel')}
                </Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('locationPlaceholder')}
                  disabled={busy}
                  className="rounded-lg"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-lg text-sm"
                  disabled={busy}
                  onClick={() => void applyLocation()}
                >
                  {t('locationSave')}
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-semibold">
                  <MonitorSmartphone className="h-4 w-4 text-primary" />
                  {t('orientationLabel')}
                </Label>
                <select
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none ring-0 focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
                  value={orientation}
                  disabled={busy}
                  onChange={(e) => {
                    const v = e.target.value as 'AUTO' | 'LANDSCAPE' | 'PORTRAIT';
                    void applyOrientation(v);
                  }}
                >
                  <option value="AUTO">{t('orientationAuto')}</option>
                  <option value="LANDSCAPE">{t('orientationLandscape')}</option>
                  <option value="PORTRAIT">{t('orientationPortrait')}</option>
                </select>
                <p className="text-xs text-muted-foreground">{t('orientationHint')}</p>
              </div>

              <div className="flex flex-col gap-2 border-t border-white/10 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 w-full rounded-lg border-white/20"
                  onClick={() => {
                    onEditScreen();
                    onOpenChange(false);
                  }}
                >
                  {t('openScreenSettings')}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full rounded-lg text-primary hover:bg-primary/10"
                  asChild
                >
                  <Link href={`/${locale}/schedules` as Route}>{t('openScheduleEngine')}</Link>
                </Button>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
