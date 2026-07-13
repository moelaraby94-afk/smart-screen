'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Pause, Play, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchWorkspaceDetails,
  updateWorkspace as apiUpdateWorkspace,
} from '@/features/workspace/workspace-api';
import { fetchPlaylistOptions, type PlaylistOption as ApiPlaylistOption } from '@/features/screens/api/screens-api';
import { RamadanSettingsPanel } from '@/features/islamic/ramadan-settings-panel';
import { PrayerConfigPanel } from '@/features/islamic/prayer-config-panel';

type WorkspaceDetails = {
  id: string;
  name: string;
  slug: string;
  defaultLocale: string;
  timezone: string;
  isPaused: boolean;
};

const COMMON_TIMEZONES = [
  'UTC',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Riyadh',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export function WorkspaceSettingsClient() {
  const t = useTranslations('workspaceSettings');
  const { workspaceId, refreshWorkspaces, bumpWorkspaceDataEpoch } = useWorkspace();
  const [details, setDetails] = useState<WorkspaceDetails | null>(null);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [defaultLocale, setDefaultLocale] = useState('en');
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingPause, setTogglingPause] = useState(false);
  const [playlists, setPlaylists] = useState<ApiPlaylistOption[]>([]);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const res = await fetchWorkspaceDetails(workspaceId);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = (await res.json()) as WorkspaceDetails;
    setDetails(data);
    setName(data.name);
    setTimezone(data.timezone);
    setDefaultLocale(data.defaultLocale);
    setIsPaused(data.isPaused);
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!workspaceId) return;
    void (async () => {
      const items = await fetchPlaylistOptions(workspaceId);
      setPlaylists(items);
    })();
  }, [workspaceId]);

  const saveGeneral = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await apiUpdateWorkspace(workspaceId, {
        name: name.trim(),
        timezone,
        defaultLocale,
      });
      if (!res.ok) {
        toast.error(t('saveFailed'));
        return;
      }
      toast.success(t('saved'));
      await load();
      await refreshWorkspaces(workspaceId);
      bumpWorkspaceDataEpoch();
    } finally {
      setSaving(false);
    }
  };

  const togglePause = async () => {
    if (!workspaceId) return;
    setTogglingPause(true);
    try {
      const res = await apiUpdateWorkspace(workspaceId, { isPaused: !isPaused });
      if (!res.ok) {
        toast.error(t('pauseFailed'));
        return;
      }
      setIsPaused(!isPaused);
      toast.success(!isPaused ? t('pausedOk') : t('resumedOk'));
      bumpWorkspaceDataEpoch();
    } finally {
      setTogglingPause(false);
    }
  };

  if (loading || !details) {
    return <p className="text-sm text-muted-foreground">{t('loading')}</p>;
  }

  return (
    <div className="space-y-8">
      <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t('generalTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('generalDesc')}</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('workspaceName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>{t('defaultLocale')}</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={defaultLocale}
              onChange={(e) => setDefaultLocale(e.target.value)}
              aria-label={t('defaultLocale')}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('timezone')}</Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              aria-label={t('timezone')}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t('timezoneHint')}</p>
          </div>
        </div>
        <Button
          type="button"
          className="mt-6 rounded-xl font-semibold"
          variant="cta"
          disabled={saving || name.trim().length < 2}
          onClick={() => void saveGeneral()}
        >
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t('saveChanges')}
        </Button>
      </div>

      <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t('pauseTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('pauseDesc')}</p>
        <div className="mt-4 flex items-center gap-3">
          <Button
            type="button"
            variant={isPaused ? 'cta' : 'outline'}
            className="rounded-xl font-semibold"
            disabled={togglingPause}
            onClick={() => void togglePause()}
          >
            {togglingPause ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : isPaused ? (
              <Play className="me-2 h-4 w-4" />
            ) : (
              <Pause className="me-2 h-4 w-4" />
            )}
            {isPaused ? t('resume') : t('pause')}
          </Button>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${isPaused ? 'bg-amber-500/15 text-amber-600' : 'bg-emerald-500/15 text-emerald-600'}`}>
            {isPaused ? t('statusPaused') : t('statusActive')}
          </span>
        </div>
      </div>

      <PrayerConfigPanel />

      <RamadanSettingsPanel playlists={playlists} />

    </div>
  );
}
