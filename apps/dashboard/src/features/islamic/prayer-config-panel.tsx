'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Compass, Save, Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWorkspace } from '@/features/workspace/workspace-context';
import {
  fetchPrayerConfig,
  updatePrayerConfig,
} from '@/features/islamic/islamic-api';
import { ICON_STROKE } from '@/lib/icon-stroke';

type PrayerConfig = {
  id: string;
  method: number;
  asrJuristic: number;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  bufferBefore: number;
  bufferAfter: number;
  enabledPrayers: string[];
  autoPauseEnabled: boolean;
};

const CALCULATION_METHODS = [
  { value: 3, labelKey: 'methodMakkah' },
  { value: 5, labelKey: 'methodEgypt' },
  { value: 2, labelKey: 'methodISNA' },
  { value: 1, labelKey: 'methodKarachi' },
  { value: 4, labelKey: 'methodMWL' },
  { value: 7, labelKey: 'methodTehran' },
  { value: 0, labelKey: 'methodJafari' },
];

const ALL_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRAYER_LABEL_KEYS: Record<string, string> = {
  Fajr: 'fajr',
  Dhuhr: 'dhuhr',
  Asr: 'asr',
  Maghrib: 'maghrib',
  Isha: 'isha',
};

export function PrayerConfigPanel() {
  const t = useTranslations('prayerSettings');
  const { workspaceId } = useWorkspace();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [method, setMethod] = useState(3);
  const [asrJuristic, setAsrJuristic] = useState(0);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [city, setCity] = useState('');
  const [bufferBefore, setBufferBefore] = useState(5);
  const [bufferAfter, setBufferAfter] = useState(15);
  const [enabledPrayers, setEnabledPrayers] = useState<string[]>(ALL_PRAYERS);
  const [autoPauseEnabled, setAutoPauseEnabled] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchPrayerConfig(workspaceId);
      if (res.ok) {
        const data = (await res.json()) as PrayerConfig;
        setMethod(data.method);
        setAsrJuristic(data.asrJuristic);
        setLatitude(data.latitude != null ? String(data.latitude) : '');
        setLongitude(data.longitude != null ? String(data.longitude) : '');
        setCity(data.city ?? '');
        setBufferBefore(data.bufferBefore);
        setBufferAfter(data.bufferAfter);
        setEnabledPrayers(data.enabledPrayers ?? ALL_PRAYERS);
        setAutoPauseEnabled(data.autoPauseEnabled);
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

  const togglePrayer = (prayer: string) => {
    setEnabledPrayers((prev) =>
      prev.includes(prayer)
        ? prev.filter((p) => p !== prayer)
        : [...prev, prayer],
    );
  };

  const save = async () => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const res = await updatePrayerConfig(workspaceId, {
        method,
        asrJuristic,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        city: city.trim() || undefined,
        bufferBefore,
        bufferAfter,
        enabledPrayers,
        autoPauseEnabled,
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
    <div className="vc-card-surface rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-ring/20">
          <Compass className="h-4 w-4 text-emerald-600" strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('description')}</p>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        {/* Location */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-emerald-600" strokeWidth={ICON_STROKE} />
              {t('latitude')}
            </Label>
            <Input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="24.7136"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('longitude')}</Label>
            <Input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="46.6753"
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label>{t('city')}</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t('cityPlaceholder')}
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Calculation method + Asr juristic */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('calculationMethod')}</Label>
            <select
              className="h-9 w-full rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={method}
              onChange={(e) => setMethod(Number(e.target.value))}
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {t(m.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t('asrJuristic')}</Label>
            <select
              className="h-9 w-full rounded-lg border border-border bg-background/80 px-3 text-sm backdrop-blur"
              value={asrJuristic}
              onChange={(e) => setAsrJuristic(Number(e.target.value))}
            >
              <option value={0}>{t('asrShafii')}</option>
              <option value={1}>{t('asrHanafi')}</option>
            </select>
          </div>
        </div>

        {/* Buffer times */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t('bufferBefore')}</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={bufferBefore}
              onChange={(e) => setBufferBefore(Number(e.target.value))}
              className="rounded-lg"
            />
            <p className="text-xs text-muted-foreground">{t('bufferBeforeHint')}</p>
          </div>
          <div className="space-y-2">
            <Label>{t('bufferAfter')}</Label>
            <Input
              type="number"
              min={0}
              max={120}
              value={bufferAfter}
              onChange={(e) => setBufferAfter(Number(e.target.value))}
              className="rounded-lg"
            />
            <p className="text-xs text-muted-foreground">{t('bufferAfterHint')}</p>
          </div>
        </div>

        {/* Enabled prayers */}
        <div className="space-y-2">
          <Label>{t('enabledPrayers')}</Label>
          <div className="flex flex-wrap gap-2">
            {ALL_PRAYERS.map((prayer) => {
              const isActive = enabledPrayers.includes(prayer);
              return (
                <button
                  key={prayer}
                  type="button"
                  onClick={() => togglePrayer(prayer)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {t(`prayers.${PRAYER_LABEL_KEYS[prayer]}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Auto-pause toggle */}
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-foreground">{t('autoPause')}</p>
            <p className="text-xs text-muted-foreground">{t('autoPauseHint')}</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoPauseEnabled(!autoPauseEnabled)}
            className={`relative h-7 w-12 rounded-full transition ${
              autoPauseEnabled ? 'bg-emerald-500' : 'bg-muted'
            }`}
            aria-label={t('autoPause')}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                autoPauseEnabled ? 'start-6' : 'start-1'
              }`}
            />
          </button>
        </div>

        <Button
          type="button"
          className="rounded-lg font-semibold"
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
