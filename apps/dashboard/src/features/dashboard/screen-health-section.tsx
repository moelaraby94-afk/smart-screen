'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Activity, Monitor, TrendingUp, Zap } from 'lucide-react';
import { apiFetch } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type AnalyticsData = {
  total: number;
  byStatus: { ONLINE: number; OFFLINE: number; MAINTENANCE: number };
  uptimePercent: number;
  withPlaylist: number;
  withoutPlaylist: number;
  hourlyActivity: { hour: number; count: number }[];
  peakHours: { hour: number; count: number }[];
};

export function ScreenHealthSection() {
  const t = useTranslations('clientHome.screenHealth');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/screens/analytics?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const maxHourly = data
    ? Math.max(...data.hourlyActivity.map((h) => h.count), 1)
    : 1;

  const statusSegments = data
    ? [
        { label: t('online'), value: data.byStatus.ONLINE, color: 'bg-emerald-500' },
        { label: t('offline'), value: data.byStatus.OFFLINE, color: 'bg-rose-500/70' },
        { label: t('maintenance'), value: data.byStatus.MAINTENANCE, color: 'bg-amber-500/70' },
      ]
    : [];

  const totalScreens = data?.total ?? 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : !data || totalScreens === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-center">
          <Monitor className="h-4 w-4 text-muted-foreground/40" strokeWidth={ICON_STROKE} />
          <p className="text-xs text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Uptime + status bar */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('uptime')}
              </p>
              <TrendingUp className="h-3 w-3 text-emerald-500" strokeWidth={ICON_STROKE} />
            </div>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-foreground">
              {data.uptimePercent}%
            </p>
            {/* Status bar */}
            <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              {statusSegments.map((seg) =>
                seg.value > 0 ? (
                  <div
                    key={seg.label}
                    className={cn('transition-all duration-500', seg.color)}
                    style={{ width: `${(seg.value / totalScreens) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-[9px]">
              {statusSegments.map((seg) => (
                <span key={seg.label} className="flex items-center gap-1 text-muted-foreground">
                  <span className={cn('h-1.5 w-1.5 rounded-full', seg.color)} />
                  {seg.label}: <span className="font-bold text-foreground">{seg.value}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Playlist coverage */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('playlistCoverage')}
              </p>
              <Zap className="h-3 w-3 text-amber-400" strokeWidth={ICON_STROKE} />
            </div>
            <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-foreground">
              {data.withPlaylist}
              <span className="text-sm font-normal text-muted-foreground"> / {totalScreens}</span>
            </p>
            <div className="mt-2.5 flex h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${(data.withPlaylist / totalScreens) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground">
              {t('withoutPlaylist', { count: data.withoutPlaylist })}
            </p>
          </div>

          {/* 24h Activity */}
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {t('activity24h')}
              </p>
              <Activity className="h-3 w-3 text-blue-400" strokeWidth={ICON_STROKE} />
            </div>
            <div className="mt-2 flex h-8 items-end gap-px">
              {data.hourlyActivity.map((h) => (
                <div
                  key={h.hour}
                  className="flex-1 rounded-sm bg-blue-500/40 transition-all duration-300 hover:bg-blue-500"
                  style={{ height: `${(h.count / maxHourly) * 100}%`, minHeight: h.count > 0 ? '2px' : '0' }}
                  title={`${h.hour}:00 — ${h.count}`}
                />
              ))}
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground">
              {t('peakHours', {
                hours: data.peakHours
                  .map((h) => `${h.hour}:00`)
                  .join(', '),
              })}
            </p>
          </div>
        </div>
      )}
    </motion.section>
  );
}
