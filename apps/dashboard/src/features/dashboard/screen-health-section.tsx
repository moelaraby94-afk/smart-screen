'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Activity, Monitor } from 'lucide-react';
import { apiFetch } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { Button } from '@/components/ui/button';
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

type ScreenStatusTotals = {
  online: number;
  offline: number;
  maintenance: number;
};

type Props = {
  /** Account-level screen status totals (sum of all branches). If provided, skips per-workspace API call. */
  screenStatus?: ScreenStatusTotals;
  totalScreens?: number;
};

export function ScreenHealthSection({ screenStatus, totalScreens }: Props = {}) {
  const t = useTranslations('clientHome.screenHealth');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const useAccountTotals = screenStatus !== undefined && totalScreens !== undefined;

  const load = useCallback(async () => {
    if (useAccountTotals) {
      setLoading(false);
      return;
    }
    if (!workspaceId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch(`/screens/analytics?workspaceId=${encodeURIComponent(workspaceId)}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        setData(null);
        setError(true);
      }
    } catch {
      setData(null);
      setError(true);
    }
    setLoading(false);
  }, [workspaceId, useAccountTotals]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const effectiveData: AnalyticsData | null = useAccountTotals && screenStatus && totalScreens !== undefined
    ? {
        total: totalScreens,
        byStatus: {
          ONLINE: screenStatus.online,
          OFFLINE: screenStatus.offline,
          MAINTENANCE: screenStatus.maintenance,
        },
        uptimePercent: 0,
        withPlaylist: 0,
        withoutPlaylist: 0,
        hourlyActivity: [],
        peakHours: [],
      }
    : data;

  const stats = effectiveData
    ? [
        {
          key: 'online',
          label: t('online'),
          value: effectiveData.byStatus.ONLINE,
          color: 'text-success',
          bg: 'bg-success/10',
          ring: 'ring-success/20',
          dot: 'bg-success',
          href: `/${locale}/screens?status=ONLINE` as Route,
        },
        {
          key: 'offline',
          label: t('offline'),
          value: effectiveData.byStatus.OFFLINE,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          ring: 'ring-destructive/20',
          dot: 'bg-destructive',
          href: `/${locale}/screens?status=OFFLINE` as Route,
        },
        {
          key: 'maintenance',
          label: t('maintenance'),
          value: effectiveData.byStatus.MAINTENANCE,
          color: 'text-warning',
          bg: 'bg-warning/10',
          ring: 'ring-warning/20',
          dot: 'bg-warning',
          href: `/${locale}/screens?status=MAINTENANCE` as Route,
        },
        {
          key: 'total',
          label: t('total'),
          value: effectiveData.total,
          color: 'text-foreground',
          bg: 'bg-muted',
          ring: 'ring-border',
          dot: 'bg-muted-foreground',
          href: `/${locale}/screens` as Route,
        },
      ]
    : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
      role="region"
      aria-label={t('title')}
      aria-live="polite"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">{t('title')}</h2>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">{t('error')}</p>
          <Button variant="ghost" size="sm" onClick={() => void load()} className="text-xs">
            {t('retry')}
          </Button>
        </div>
      ) : !effectiveData || effectiveData.total === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-center">
          <Monitor className="h-4 w-4 text-muted-foreground/40" strokeWidth={ICON_STROKE} />
          <p className="text-xs text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <Link
              key={stat.key}
              href={stat.href}
              className="group flex items-center gap-3 rounded-lg border border-border p-3 transition-all duration-fast hover:border-primary/30 hover:shadow-sm"
              aria-label={`${stat.value} ${stat.label}`}
            >
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1',
                  stat.bg,
                  stat.ring,
                )}
              >
                <span className={cn('h-2.5 w-2.5 rounded-full', stat.dot)} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className={cn('font-mono text-2xl font-bold tabular-nums', stat.color)}>
                  {stat.value}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </motion.section>
  );
}
