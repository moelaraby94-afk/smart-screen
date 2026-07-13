'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Moon, Save, Loader2, Sunrise, Sunset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchRamadanConfig,
  updateRamadanConfig,
} from '@/features/islamic/islamic-api';
import { ICON_STROKE } from '@/lib/icon-stroke';

type RamadanConfig = {
  id: string;
  enabled: boolean;
  iftarPlaylistId: string | null;
  suhoorPlaylistId: string | null;
  iftarBuffer: number;
  suhoorBuffer: number;
  showHijriDate: boolean;
  showPrayerTimes: boolean;
  startDate: string | null;
  endDate: string | null;
};

type PlaylistOpt = { id: string; name: string };

export function RamadanSettingsPanel({
  playlists,
}: {
  playlists: PlaylistOpt[];
}) {
  const t = useTranslations('ramadanSettings');
  const { workspaceId } = useWorkspace();
  const [config, setConfig] = useState<RamadanConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [iftarPlaylistId, setIftarPlaylistId] = useState('');
  const [suhoorPlaylistId, setSuhoorPlaylistId] = useState('');
  const [iftarBuffer, setIftarBuffer] = useState(10);
  const [suhoorBuffer, setSuhoorBuffer] = useState(10);
  const [showHijriDate, setShowHijriDate] = useState(true);
  const [showPrayerTimes, setShowPrayerTimes] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchRamadanConfig(workspaceId);
      if (res.ok) {
        const data = (await res.json()) as RamadanConfig;
        setConfig(data);
        setEnabled(data.enabled);
        setIftarPlaylistId(data.iftarPlaylistId ?? '');
        setSuhoorPlaylistId(data.suhoorPlaylistId ?? '');
        setIftarBuffer(data.iftarBuffer);
        setSuhoorBuffer(data.suhoorBuffer);
        setShowHijriDate(data.showHijriDate);
        setShowPrayerTimes(data.showPrayerTimes);
        setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
        setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await updateRamadanConfig(workspaceId, {
        enabled,
        iftarPlaylistId: iftarPlaylistId || null,
        suhoorPlaylistId: suhoorPlaylistId || null,
        iftarBuffer,
        suhoorBuffer,
        showHijriDate,
        showPrayerTimes,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      if (!res.ok) {
        toast.error(t('saveFailed'));
        return;
      }
      toast.success(t('saved'));
      await load();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={ICON_STROKE} />
        {t('loading')}
      </div>
    );
  }

  return (
    <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
          <Moon className="h-4.5 w-4.5 text-emerald-600" strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Enable toggle */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t('enableRamadan')}</p>
            <p className="text-xs text-muted-foreground">{t('enableHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => setEnabled(!enabled)}
            className={`relative h-7 w-12 rounded-full transition ${
              enabled ? 'bg-emerald-500' : 'bg-muted'
            }`}
            aria-label={t('enableRamadan')}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                enabled ? 'start-6' : 'start-1'
              }`}
            />
          </button>
        </div>

        {/* Date range */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('startDate')}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{t('startDateHint')}</p>
          </div>
          <div className="space-y-2">
            <Label>{t('endDate')}</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{t('endDateHint')}</p>
          </div>
        </div>

        {/* Playlist selection */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sunset className="h-3.5 w-3.5 text-emerald-600" strokeWidth={ICON_STROKE} />
              {t('iftarPlaylist')}
            </Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={iftarPlaylistId}
              onChange={(e) => setIftarPlaylistId(e.target.value)}
            >
              <option value="">{t('noPlaylist')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t('iftarHint')}</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Sunrise className="h-3.5 w-3.5 text-emerald-600" strokeWidth={ICON_STROKE} />
              {t('suhoorPlaylist')}
            </Label>
            <select
              className="h-10 w-full rounded-xl border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={suhoorPlaylistId}
              onChange={(e) => setSuhoorPlaylistId(e.target.value)}
            >
              <option value="">{t('noPlaylist')}</option>
              {playlists.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">{t('suhoorHint')}</p>
          </div>
        </div>

        {/* Buffer times */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('iftarBuffer')}</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={iftarBuffer}
              onChange={(e) => setIftarBuffer(Number(e.target.value))}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{t('bufferHint')}</p>
          </div>
          <div className="space-y-2">
            <Label>{t('suhoorBuffer')}</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={suhoorBuffer}
              onChange={(e) => setSuhoorBuffer(Number(e.target.value))}
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{t('bufferHint')}</p>
          </div>
        </div>

        {/* Display options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('showHijriDate')}</p>
              <p className="text-xs text-muted-foreground">{t('showHijriHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowHijriDate(!showHijriDate)}
              className={`relative h-7 w-12 rounded-full transition ${
                showHijriDate ? 'bg-emerald-500' : 'bg-muted'
              }`}
              aria-label={t('showHijriDate')}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  showHijriDate ? 'start-6' : 'start-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('showPrayerTimes')}</p>
              <p className="text-xs text-muted-foreground">{t('showPrayerHint')}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowPrayerTimes(!showPrayerTimes)}
              className={`relative h-7 w-12 rounded-full transition ${
                showPrayerTimes ? 'bg-emerald-500' : 'bg-muted'
              }`}
              aria-label={t('showPrayerTimes')}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  showPrayerTimes ? 'start-6' : 'start-1'
                }`}
              />
            </button>
          </div>
        </div>

        <Button
          type="button"
          className="rounded-xl font-semibold"
          variant="cta"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t('save')}
        </Button>
      </div>
    </div>
  );
}
