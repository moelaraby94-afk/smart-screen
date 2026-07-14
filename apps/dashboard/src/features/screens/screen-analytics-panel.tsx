'use client';

import { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Wrench, MonitorPlay, Clock, Film } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { fetchScreenAnalytics, type ScreenAnalytics } from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { formatLastSeenRelative } from '@/features/screens/screen-fleet-status';

export function ScreenAnalyticsPanel() {
  const t = useTranslations('screenAnalytics');
  const locale = useLocale();
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [data, setData] = useState<ScreenAnalytics | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    void (async () => {
      const result = await fetchScreenAnalytics(workspaceId);
      setData(result);
    })();
  }, [workspaceId, workspaceDataEpoch]);

  if (!data || data.total === 0) return null;

  const stats = [
    {
      icon: MonitorPlay,
      label: t('total'),
      value: data.total,
      color: 'text-foreground',
      bg: 'bg-muted/50',
    },
    {
      icon: Wifi,
      label: t('online'),
      value: data.byStatus.ONLINE,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      icon: WifiOff,
      label: t('offline'),
      value: data.byStatus.OFFLINE,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      icon: Wrench,
      label: t('maintenance'),
      value: data.byStatus.MAINTENANCE,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      icon: Film,
      label: t('withPlaylist'),
      value: data.withPlaylist,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
  ];

  return (
    <div className="vc-glass vc-card-surface rounded-2xl p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t('title')}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl ${s.bg} p-3 sm:p-4`}
          >
            <div className="flex items-center gap-2">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs font-medium text-muted-foreground">
                {s.label}
              </span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${s.color}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border/50 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t('uptime')}</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${data.uptimePercent}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-foreground">
            {data.uptimePercent}%
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{t('newestSeen')}: {formatLastSeenRelative(data.newestSeen, locale) ?? '—'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{t('oldestSeen')}: {formatLastSeenRelative(data.oldestSeen, locale) ?? '—'}</span>
        </div>
      </div>
    </div>
  );
}
