'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Activity,
  Wifi,
  WifiOff,
  Wrench,
  MonitorPlay,
  Clock,
  TrendingUp,
  BarChart3,
  MapPin,
  Film,
} from 'lucide-react';
import { fetchScreenAnalytics, type ScreenAnalytics } from '@/features/screens/api/screens-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';

function formatUptime(sec: number): string {
  if (sec < 60) return `${Math.floor(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

function formatRelative(iso: string | null, locale: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (sec < 60) return rtf.format(-sec, 'second');
  const min = Math.floor(sec / 60);
  if (min < 60) return rtf.format(-min, 'minute');
  const hr = Math.floor(min / 60);
  if (hr < 24) return rtf.format(-hr, 'hour');
  return rtf.format(-Math.floor(hr / 24), 'day');
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: 'bg-emerald-500',
  OFFLINE: 'bg-red-500',
  MAINTENANCE: 'bg-amber-500',
};

const STATUS_TEXT: Record<string, string> = {
  ONLINE: 'text-emerald-600',
  OFFLINE: 'text-red-600',
  MAINTENANCE: 'text-amber-600',
};

export function AnalyticsPageClient() {
  const t = useTranslations('analyticsPage');
  const tAnalytics = useTranslations('screenAnalytics');
  const locale = useLocale();
  const { workspaceId } = useWorkspace();
  const [data, setData] = useState<ScreenAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    void (async () => {
      setLoading(true);
      const result = await fetchScreenAnalytics(workspaceId);
      setData(result);
      setLoading(false);
    })();
  }, [workspaceId]);

  const maxHourlyCount = useMemo(() => {
    if (!data) return 0;
    return Math.max(...data.hourlyActivity.map((h) => h.count), 1);
  }, [data]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
        <BarChart3 className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{t('empty')}</p>
      </div>
    );
  }

  const stats = [
    { icon: Wifi, label: tAnalytics('online'), value: data.byStatus.ONLINE, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { icon: WifiOff, label: tAnalytics('offline'), value: data.byStatus.OFFLINE, color: 'text-red-500', bg: 'bg-red-500/10' },
    { icon: Wrench, label: tAnalytics('maintenance'), value: data.byStatus.MAINTENANCE, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { icon: MonitorPlay, label: tAnalytics('withPlaylist'), value: data.withPlaylist, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * i, duration: 0.3 }}
            className={cn('rounded-2xl border border-border bg-card p-4 shadow-sm')}
          >
            <div className="flex items-center gap-2">
              <s.icon className={cn('h-4 w-4', s.color)} />
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <p className={cn('mt-2 text-2xl font-bold', s.color)}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Uptime + peak hours */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">{t('uptimeTitle')}</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${data.uptimePercent}%` }}
              />
            </div>
            <span className="text-lg font-bold text-foreground">{data.uptimePercent}%</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{tAnalytics('newestSeen')}: {formatRelative(data.newestSeen, locale)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{tAnalytics('oldestSeen')}: {formatRelative(data.oldestSeen, locale)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">{t('peakHoursTitle')}</h3>
          </div>
          {data.peakHours.length > 0 ? (
            <div className="space-y-2">
              {data.peakHours.map((h, i) => (
                <div key={h.hour} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {h.hour.toString().padStart(2, '0')}:00
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${(h.count / maxHourlyCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{h.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noPeakHours')}</p>
          )}
        </div>
      </div>

      {/* Hourly activity bar chart */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-sm font-semibold tracking-tight">{t('hourlyActivityTitle')}</h3>
        </div>
        <div className="flex items-end gap-1" style={{ height: '120px' }}>
          {data.hourlyActivity.map((h) => (
            <div key={h.hour} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
              <div
                className={cn(
                  'w-full rounded-t transition-all',
                  h.count > 0 ? 'bg-primary/70 group-hover:bg-primary' : 'bg-muted',
                )}
                style={{ height: `${Math.max((h.count / maxHourlyCount) * 100, 2)}%` }}
                title={`${h.hour}:00 — ${h.count} screens`}
              />
              {h.hour % 3 === 0 && (
                <span className="mt-1 text-[9px] text-muted-foreground">{h.hour}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Playlist distribution */}
      {data.playlistDistribution.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">{t('playlistDistributionTitle')}</h3>
          </div>
          <div className="space-y-2">
            {data.playlistDistribution.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="w-32 truncate text-sm font-medium text-foreground">{p.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-blue-500/70"
                    style={{ width: `${(p.count / data.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{p.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-screen table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-semibold tracking-tight">{t('perScreenTitle')}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 text-start font-semibold">{t('colScreen')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('colStatus')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('colPlaylist')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('colLocation')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('colLastSeen')}</th>
                <th className="px-4 py-3 text-start font-semibold">{t('colUptime')}</th>
              </tr>
            </thead>
            <tbody>
              {data.perScreen.map((s, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.01 * i, duration: 0.2 }}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{s.serialNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[s.status])} />
                      <span className={cn('text-xs font-semibold', STATUS_TEXT[s.status])}>
                        {s.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.activePlaylist ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.location}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(s.lastSeenAt, locale)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">
                    {s.uptimeSec > 0 ? formatUptime(s.uptimeSec) : '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
