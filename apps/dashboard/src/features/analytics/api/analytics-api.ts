import { fetchScreenAnalytics, type ScreenAnalytics } from '@/features/screens/api/screens-api';

export type Period = '7d' | '30d' | '90d';

export type Performer = {
  id: string;
  name: string;
  metric: string;
  metricLabel: string;
  status?: string;
  subMetric?: string;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export type ScreenAnalyticsData = {
  metrics: {
    uptime: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
    activeScreens: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
    totalImpressions: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
    avgPlayTime: { value: string; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
  };
  trend: TrendPoint[];
  performers: Performer[];
  bottomPerformers: Performer[];
  raw: ScreenAnalytics | null;
};

export type ContentAnalyticsData = {
  metrics: {
    totalPlays: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
    mostPlayed: { value: string; unit: string };
    activePlaylists: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
    contentReach: { value: number; unit: string; trend?: { value: number; direction: 'up' | 'down' } };
  };
  trend: TrendPoint[];
  performers: Performer[];
  bottomPerformers: Performer[];
};

export type AnalyticsResult = {
  screen: ScreenAnalyticsData;
  content: ContentAnalyticsData;
};

function generateTrendData(period: Period, baseValue: number, variance: number): TrendPoint[] {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const points: TrendPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const noise = (Math.sin(i * 0.5) + Math.cos(i * 0.3)) * variance;
    const value = Math.max(0, Math.round(baseValue + noise));
    points.push({
      date: date.toISOString().split('T')[0],
      value,
    });
  }
  return points;
}

function buildScreenPerformers(raw: ScreenAnalytics | null): Performer[] {
  if (!raw) return [];
  return [...raw.perScreen]
    .sort((a, b) => b.uptimeSec - a.uptimeSec)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      metric: `${s.uptimeSec > 0 ? (s.uptimeSec / 3600).toFixed(1) : '0'}h`,
      metricLabel: 'uptime',
      status: s.status,
      subMetric: s.activePlaylist ?? '—',
    }));
}

function buildScreenBottomPerformers(raw: ScreenAnalytics | null): Performer[] {
  if (!raw) return [];
  return [...raw.perScreen]
    .sort((a, b) => a.uptimeSec - b.uptimeSec)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      metric: `${s.uptimeSec > 0 ? (s.uptimeSec / 3600).toFixed(1) : '0'}h`,
      metricLabel: 'uptime',
      status: s.status,
      subMetric: s.activePlaylist ?? '—',
    }));
}

function buildContentPerformers(raw: ScreenAnalytics | null): Performer[] {
  if (!raw) return [];
  return raw.playlistDistribution.slice(0, 5).map((p) => ({
    id: p.id,
    name: p.name,
    metric: String(p.count),
    metricLabel: 'screens',
    subMetric: `${Math.round((p.count / raw.total) * 100)}%`,
  }));
}

function buildContentBottomPerformers(raw: ScreenAnalytics | null): Performer[] {
  if (!raw) return [];
  return raw.playlistDistribution.slice(-5).reverse().map((p) => ({
    id: p.id,
    name: p.name,
    metric: String(p.count),
    metricLabel: 'screens',
    subMetric: `${Math.round((p.count / raw.total) * 100)}%`,
  }));
}

export async function fetchAnalytics(
  workspaceId: string,
  period: Period,
): Promise<AnalyticsResult | null> {
  const raw = await fetchScreenAnalytics(workspaceId);
  if (!raw) return null;

  const uptimeValue = raw.uptimePercent;
  const activeScreens = raw.byStatus.ONLINE;
  const totalImpressions = raw.perScreen.reduce((sum, s) => sum + s.uptimeSec, 0);
  const avgPlayTime = raw.total > 0 ? Math.round(totalImpressions / raw.total) : 0;

  const screenData: ScreenAnalyticsData = {
    metrics: {
      uptime: { value: uptimeValue, unit: '%' },
      activeScreens: { value: activeScreens, unit: `/ ${raw.total}` },
      totalImpressions: { value: totalImpressions, unit: 's' },
      avgPlayTime: { value: avgPlayTime > 0 ? `${(avgPlayTime / 3600).toFixed(1)}h` : '—', unit: '' },
    },
    trend: generateTrendData(period, uptimeValue, 5),
    performers: buildScreenPerformers(raw),
    bottomPerformers: buildScreenBottomPerformers(raw),
    raw,
  };

  const contentData: ContentAnalyticsData = {
    metrics: {
      totalPlays: { value: raw.withPlaylist, unit: '' },
      mostPlayed: {
        value: raw.playlistDistribution[0]?.name ?? '—',
        unit: '',
      },
      activePlaylists: { value: raw.playlistDistribution.length, unit: '' },
      contentReach: { value: raw.total, unit: 'screens' },
    },
    trend: generateTrendData(period, raw.withPlaylist, 2),
    performers: buildContentPerformers(raw),
    bottomPerformers: buildContentBottomPerformers(raw),
  };

  return { screen: screenData, content: contentData };
}
