'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart3,
  Activity,
  MonitorPlay,
  Clock,
  TrendingUp,
  Film,
  Download,
  AlertCircle,
  RefreshCw,
  MapPin,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricCard } from './metric-card';
import { TrendChart } from './trend-chart';
import type { PerScreenAnalytics } from '@/features/screens/api/screens-api';
import {
  fetchAnalytics,
  type Period,
  type AnalyticsResult,
  type Performer,
} from './api/analytics-api';

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
  ONLINE: 'bg-success',
  OFFLINE: 'bg-destructive',
  MAINTENANCE: 'bg-warning',
};

const STATUS_TEXT: Record<string, string> = {
  ONLINE: 'text-success',
  OFFLINE: 'text-destructive',
  MAINTENANCE: 'text-warning',
};

const PERIOD_OPTIONS: { value: Period; labelKey: string }[] = [
  { value: '7d', labelKey: 'period7d' },
  { value: '30d', labelKey: 'period30d' },
  { value: '90d', labelKey: 'period90d' },
];

export function AnalyticsPageClient() {
  const t = useTranslations('analyticsPage');
  const tAnalytics = useTranslations('screenAnalytics');
  const { workspaceId, workspaces } = useWorkspace();
  const router = useRouter();
  const locale = useLocale();
  const prefersReducedMotion = useReducedMotion() ?? false;

  const [period, setPeriod] = useState<Period>('30d');
  const [tab, setTab] = useState<'screens' | 'content'>('screens');
  const [data, setData] = useState<AnalyticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');

  const canExport = useMemo(() => {
    const r = workspaces.find((w) => w.id === workspaceId)?.role;
    return r === 'OWNER' || r === 'ADMIN' || r === 'EDITOR';
  }, [workspaces, workspaceId]);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(false);
    try {
      const result = await fetchAnalytics(workspaceId, period);
      if (!result) {
        setError(true);
      } else {
        setData(result);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  }, [workspaceId, period]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredScreens = useMemo(() => {
    if (!data?.screen.raw) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.screen.raw.perScreen;
    return data.screen.raw.perScreen.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.serialNumber.toLowerCase().includes(q),
    );
  }, [data, search]);

  const exportCsv = useCallback(() => {
    if (!filteredScreens.length) return;
    const headers = ['Screen', 'Serial Number', 'Status', 'Active Playlist', 'Location', 'Last Seen', 'Uptime'];
    const rows = filteredScreens.map((s) => [
      s.name,
      s.serialNumber,
      s.status,
      s.activePlaylist ?? '',
      s.location ?? '',
      s.lastSeenAt ? new Date(s.lastSeenAt).toLocaleString() : '',
      s.uptimeSec > 0 ? formatUptime(s.uptimeSec) : '',
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredScreens]);

  const screenTrend = useMemo(() => {
    if (!data?.screen.trend || data.screen.trend.length < 2) return undefined;
    const td = data.screen.trend;
    const first = td[0].value;
    const last = td[td.length - 1].value;
    if (first === 0) return undefined;
    const pct = Math.round(((last - first) / first) * 100);
    return { value: Math.abs(pct), direction: (pct >= 0 ? 'up' : 'down') as 'up' | 'down' };
  }, [data?.screen.trend]);

  const contentTrend = useMemo(() => {
    if (!data?.content.trend || data.content.trend.length < 2) return undefined;
    const td = data.content.trend;
    const first = td[0].value;
    const last = td[td.length - 1].value;
    if (first === 0) return undefined;
    const pct = Math.round(((last - first) / first) * 100);
    return { value: Math.abs(pct), direction: (pct >= 0 ? 'up' : 'down') as 'up' | 'down' };
  }, [data?.content.trend]);

  if (loading && !data) {
    return (
      <div
        className="space-y-6"
        role="status"
        aria-label={t('loading')}
        aria-busy="true"
        aria-live="polite"
      >
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCard key={i} label="" value="" loading />
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-4 h-[300px] w-full" />
        </div>
        <div className="rounded-lg border border-border bg-card p-5">
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        icon={AlertCircle}
        title={t('errorTitle')}
        description={t('errorDescription')}
        retryLabel={t('retry')}
        onRetry={() => void load()}
      />
    );
  }

  if (!data || (data.screen.raw && data.screen.raw.total === 0)) {
    return (
      <EmptyState
        icon={BarChart3}
        title={t('empty')}
        description={t('emptyDescription')}
        actionLabel={t('emptyCta')}
        onAction={() => router.push(`/${locale}/screens` as Route)}
      />
    );
  }

  const screenMetrics = [
    { label: t('metricUptime'), value: data.screen.metrics.uptime.value, unit: data.screen.metrics.uptime.unit, icon: Activity, trend: screenTrend },
    { label: t('metricActiveScreens'), value: data.screen.metrics.activeScreens.value, unit: data.screen.metrics.activeScreens.unit, icon: MonitorPlay },
    { label: t('metricImpressions'), value: data.screen.metrics.totalImpressions.value, unit: data.screen.metrics.totalImpressions.unit, icon: TrendingUp, trend: screenTrend },
    { label: t('metricAvgPlayTime'), value: data.screen.metrics.avgPlayTime.value, unit: data.screen.metrics.avgPlayTime.unit, icon: Clock },
  ];

  const contentMetrics = [
    { label: t('metricTotalPlays'), value: data.content.metrics.totalPlays.value, unit: data.content.metrics.totalPlays.unit, icon: Film, trend: contentTrend },
    { label: t('metricMostPlayed'), value: data.content.metrics.mostPlayed.value, unit: data.content.metrics.mostPlayed.unit, icon: TrendingUp },
    { label: t('metricActivePlaylists'), value: data.content.metrics.activePlaylists.value, unit: data.content.metrics.activePlaylists.unit, icon: Film, trend: contentTrend },
    { label: t('metricContentReach'), value: data.content.metrics.contentReach.value, unit: data.content.metrics.contentReach.unit, icon: MonitorPlay },
  ];

  return (
    <div className="space-y-6" role="region" aria-label={t('title')}>
      <PeriodSelector value={period} onChange={setPeriod} t={t} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'screens' | 'content')}>
        <TabsList>
          <TabsTrigger value="screens">{t('tabScreens')}</TabsTrigger>
          <TabsTrigger value="content">{t('tabContent')}</TabsTrigger>
        </TabsList>

        <TabsContent value="screens" className="space-y-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="space-y-6"
          >
            <AnalyticsContent
              metrics={screenMetrics}
              trend={data.screen.trend}
              performers={data.screen.performers}
              bottomPerformers={data.screen.bottomPerformers}
              loading={loading}
              t={t}
              chartAriaLabel={t('chartUptimeAria')}
              chartEmptyLabel={t('chartEmpty')}
              chartColor="var(--success)"
              yAxisFormat={(v) => `${v}%`}
              prefersReducedMotion={prefersReducedMotion}
              onPerformerClick={(id) => router.push(`/${locale}/screens/${id}` as Route)}
            />

            {data.screen.raw && (
              <PerScreenTable
                filteredScreens={filteredScreens}
                search={search}
                setSearch={setSearch}
                canExport={canExport}
                onExport={exportCsv}
                t={t}
                tAnalytics={tAnalytics}
                locale={locale}
                onRowClick={(id) => router.push(`/${locale}/screens/${id}` as Route)}
              />
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
            className="space-y-6"
          >
            <AnalyticsContent
              metrics={contentMetrics}
              trend={data.content.trend}
              performers={data.content.performers}
              bottomPerformers={data.content.bottomPerformers}
              loading={loading}
              t={t}
              chartAriaLabel={t('chartContentAria')}
              chartEmptyLabel={t('chartEmpty')}
              chartColor="var(--primary)"
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PeriodSelector({
  value,
  onChange,
  t,
}: {
  value: Period;
  onChange: (p: Period) => void;
  t: ReturnType<typeof useTranslations<'analyticsPage'>>;
}) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={t('periodSelector')}>
      {PERIOD_OPTIONS.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {t(opt.labelKey)}
        </Button>
      ))}
    </div>
  );
}

function AnalyticsContent({
  metrics,
  trend,
  performers,
  bottomPerformers,
  loading,
  t,
  chartAriaLabel,
  chartEmptyLabel,
  chartColor,
  yAxisFormat,
  prefersReducedMotion,
  onPerformerClick,
}: {
  metrics: { label: string; value: string | number; unit: string; icon: typeof Activity; trend?: { value: number; direction: 'up' | 'down' } }[];
  trend: { date: string; value: number }[];
  performers: Performer[];
  bottomPerformers: Performer[];
  loading: boolean;
  t: ReturnType<typeof useTranslations<'analyticsPage'>>;
  chartAriaLabel: string;
  chartEmptyLabel: string;
  chartColor: string;
  yAxisFormat?: (v: number) => string;
  prefersReducedMotion?: boolean;
  onPerformerClick?: (id: string) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <MetricCard
            key={m.label}
            label={m.label}
            value={m.value}
            unit={m.unit}
            icon={m.icon}
            trend={m.trend}
            loading={loading}
          />
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm" role="region" aria-label={t('trendTitle')}>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">{t('trendTitle')}</h3>
        </div>
        <TrendChart
          data={trend}
          loading={loading}
          empty={!loading && trend.length === 0}
          ariaLabel={chartAriaLabel}
          emptyLabel={chartEmptyLabel}
          color={chartColor}
          yAxisFormat={yAxisFormat}
          height={300}
          reducedMotion={prefersReducedMotion}
        />
      </div>

      <div className="rounded-lg border border-border bg-card p-5 shadow-sm" role="region" aria-label={t('performersTitle')}>
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" aria-hidden />
          <h3 className="text-sm font-semibold tracking-tight">{t('performersTitle')}</h3>
        </div>
        {performers.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t('performersEmpty')}</p>
        ) : (
          <div className="space-y-2">
            {performers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.03 * i, duration: 0.2 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30',
                  onPerformerClick && 'cursor-pointer',
                )}
                onClick={() => onPerformerClick?.(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onPerformerClick?.(p.id);
                }}
                tabIndex={onPerformerClick ? 0 : undefined}
                role={onPerformerClick ? 'button' : undefined}
                aria-label={onPerformerClick ? `${p.name}, ${p.metric} ${p.metricLabel}` : undefined}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                  {p.subMetric && (
                    <span className="block truncate text-xs text-muted-foreground">{p.subMetric}</span>
                  )}
                </div>
                {p.status && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[p.status])} />
                  </span>
                )}
                <span className="text-sm font-semibold text-foreground">{p.metric}</span>
                <span className="text-xs text-muted-foreground">{p.metricLabel}</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {bottomPerformers.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm" role="region" aria-label={t('bottomPerformersTitle')}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground rotate-180" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">{t('bottomPerformersTitle')}</h3>
          </div>
          <div className="space-y-2">
            {bottomPerformers.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/30',
                  onPerformerClick && 'cursor-pointer',
                )}
                onClick={() => onPerformerClick?.(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onPerformerClick?.(p.id);
                }}
                tabIndex={onPerformerClick ? 0 : undefined}
                role={onPerformerClick ? 'button' : undefined}
                aria-label={onPerformerClick ? `${p.name}, ${p.metric} ${p.metricLabel}` : undefined}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted/20 text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
                  {p.subMetric && (
                    <span className="block truncate text-xs text-muted-foreground">{p.subMetric}</span>
                  )}
                </div>
                {p.status && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[p.status])} />
                  </span>
                )}
                <span className="text-sm font-semibold text-foreground">{p.metric}</span>
                <span className="text-xs text-muted-foreground">{p.metricLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function PerScreenTable({
  filteredScreens,
  search,
  setSearch,
  canExport,
  onExport,
  t,
  tAnalytics,
  locale,
  onRowClick,
}: {
  filteredScreens: PerScreenAnalytics[];
  search: string;
  setSearch: (s: string) => void;
  canExport: boolean;
  onExport: () => void;
  t: ReturnType<typeof useTranslations<'analyticsPage'>>;
  tAnalytics: ReturnType<typeof useTranslations<'screenAnalytics'>>;
  locale: string;
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      <div className="border-b border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MonitorPlay className="h-5 w-5 text-primary" aria-hidden />
            <h3 className="text-sm font-semibold tracking-tight">{t('perScreenTitle')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-48 text-sm"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('searchPlaceholder')}
            />
            {canExport && (
              <Button
                variant="outline"
                size="sm"
                disabled={!filteredScreens.length}
                onClick={onExport}
              >
                <Download className="me-1.5 h-4 w-4" />
                {t('exportCsv')}
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colScreen')}</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colStatus')}</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colPlaylist')}</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colLocation')}</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colLastSeen')}</th>
              <th scope="col" className="px-4 py-3 text-start font-semibold">{t('colUptime')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredScreens.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {t('noSearchResults')}
                </td>
              </tr>
            ) : (
              filteredScreens.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border/50 last:border-0 hover:bg-muted/20 cursor-pointer"
                  onClick={() => onRowClick(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onRowClick(s.id);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.name}, ${s.status}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{s.serialNumber}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', STATUS_COLORS[s.status])} />
                      <span className={cn('text-xs font-semibold', STATUS_TEXT[s.status])}>
                        {tAnalytics('status' + s.status.charAt(0) + s.status.slice(1).toLowerCase())}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.activePlaylist ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {s.location}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelative(s.lastSeenAt, locale)}</td>
                  <td className="px-4 py-3 text-xs font-medium text-foreground">
                    {s.uptimeSec > 0 ? formatUptime(s.uptimeSec) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
