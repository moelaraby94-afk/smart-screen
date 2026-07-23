'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Calendar, Loader2 } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { fetchHijriDate } from '@/features/islamic/islamic-api';
import { ICON_STROKE } from '@/lib/icon-stroke';

type HijriData = {
  date: string;
  day: string;
  monthEn: string;
  monthAr: string;
  year: string;
  weekdayEn?: string;
  weekdayAr?: string;
} | null;

export function HijriDateWidget() {
  const t = useTranslations('hijriDateWidget');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [data, setData] = useState<HijriData>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await fetchHijriDate(workspaceId);
      if (res.ok) {
        setData(await res.json());
        setError(false);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
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
        <Loader2
          className="h-5 w-5 animate-spin text-muted-foreground"
          strokeWidth={ICON_STROKE}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{t('error')}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{t('notConfigured')}</p>
      </div>
    );
  }

  const monthName = locale === 'ar' ? data.monthAr : data.monthEn;
  const weekday =
    locale === 'ar' ? data.weekdayAr : data.weekdayEn;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="pointer-events-none absolute -end-8 -top-8 h-28 w-28 rounded-full bg-success/8 blur-3xl" />

      <div className="relative flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 ring-1 ring-ring/20">
          <Calendar
            className="h-[18px] w-[18px] text-success"
            strokeWidth={ICON_STROKE}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t('title')}</h3>
        </div>
      </div>

      <div className="relative mt-4 text-center">
        <p className="text-3xl font-bold text-foreground">{data.day}</p>
        <p className="mt-1 text-lg font-medium text-success">{monthName}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{data.year} AH</p>
        {weekday && (
          <p className="mt-2 text-xs text-muted-foreground">{weekday}</p>
        )}
      </div>
    </motion.section>
  );
}
