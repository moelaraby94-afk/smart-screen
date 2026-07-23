'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Sunrise, Sunset, Moon, Sun, CloudSun, MapPin, Clock, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { fetchPrayerTimes } from '@/features/islamic/islamic-api';
import { ICON_STROKE } from '@/lib/icon-stroke';

type PrayerTimesData = {
  configured: boolean;
  times: Record<string, string> | null;
  hijriDate: {
    date: string;
    day: string;
    monthEn: string;
    monthAr: string;
    year: string;
  } | null;
  city: string | null;
  nextPrayer: string | null;
  nextPrayerTime: string | null;
  minutesUntilNext: number;
  error?: string;
  message?: string;
};

const PRAYER_META: Array<{
  key: string;
  icon: typeof Sunrise;
  labelKey: string;
}> = [
  { key: 'Fajr', icon: Sunrise, labelKey: 'fajr' },
  { key: 'Sunrise', icon: Sun, labelKey: 'sunrise' },
  { key: 'Dhuhr', icon: CloudSun, labelKey: 'dhuhr' },
  { key: 'Asr', icon: Sun, labelKey: 'asr' },
  { key: 'Maghrib', icon: Sunset, labelKey: 'maghrib' },
  { key: 'Isha', icon: Moon, labelKey: 'isha' },
];

function formatCountdown(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function PrayerTimesWidget() {
  const t = useTranslations('prayerTimes');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [data, setData] = useState<PrayerTimesData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchPrayerTimes(workspaceId);
      if (res.ok) {
        setData(await res.json());
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

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [data, load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" strokeWidth={ICON_STROKE} />
      </div>
    );
  }

  if (!data || !data.configured || !data.times) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm"
    >
      <div className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full bg-success/8 blur-3xl" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 ring-1 ring-ring/20">
            <Moon className="h-[18px] w-[18px] text-success" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
            {data.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" strokeWidth={ICON_STROKE} />
                {data.city}
              </p>
            )}
          </div>
        </div>
        {data.hijriDate && (
          <div className="text-end">
            <p className="text-xs font-medium text-foreground">
              {locale === 'ar'
                ? `${data.hijriDate.day} ${data.hijriDate.monthAr} ${data.hijriDate.year}`
                : `${data.hijriDate.day} ${data.hijriDate.monthEn} ${data.hijriDate.year}`}
            </p>
            <p className="text-xs text-muted-foreground">{t('hijri')}</p>
          </div>
        )}
      </div>

      {/* Next prayer countdown */}
      {data.nextPrayer && data.nextPrayerTime && (
        <div className="relative mt-4 flex items-center gap-2 rounded-lg bg-success/5 px-3 py-2.5">
          <Clock className="h-4 w-4 text-success" strokeWidth={ICON_STROKE} />
          <span className="text-xs text-muted-foreground">{t('nextPrayer')}</span>
          <span className="text-sm font-semibold text-foreground">
            {t(`prayers.${data.nextPrayer.toLowerCase()}`)}
          </span>
          <span className="text-xs text-muted-foreground">— {data.nextPrayerTime}</span>
          {data.minutesUntilNext > 0 && (
            <span className="ms-auto rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-medium text-success">
              {formatCountdown(data.minutesUntilNext)}
            </span>
          )}
        </div>
      )}

      {/* Prayer times grid */}
      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {PRAYER_META.map(({ key, icon: Icon, labelKey }) => {
          const time = data.times?.[key];
          const isNext = data.nextPrayer === key;
          return (
            <div
              key={key}
              className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition ${
                isNext
                  ? 'border-success/30 bg-success/5'
                  : 'border-border bg-card'
              }`}
            >
              <Icon
                className={`h-4 w-4 ${isNext ? 'text-success' : 'text-muted-foreground'}`}
                strokeWidth={ICON_STROKE}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {t(`prayers.${labelKey}`)}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {time ?? '--:--'}
              </span>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
