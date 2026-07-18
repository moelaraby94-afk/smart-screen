'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

type TrendPoint = { date: string; value: number };

type Props = {
  data: TrendPoint[];
  loading: boolean;
  empty: boolean;
  type?: 'area' | 'line';
  color?: string;
  height?: number;
  ariaLabel: string;
  emptyLabel: string;
  yAxisFormat?: (value: number) => string;
  xAxisFormat?: (value: string) => string;
  reducedMotion?: boolean;
};

export function TrendChart({
  data,
  loading,
  empty,
  type = 'area',
  color = 'var(--primary)',
  height = 300,
  ariaLabel,
  emptyLabel,
  yAxisFormat,
  xAxisFormat,
  reducedMotion,
}: Props) {
  const t = useTranslations('analyticsPage');

  const chartData = useMemo(
    () => data.map((d) => ({ date: d.date, value: d.value })),
    [data],
  );

  if (loading) {
    return (
      <div
        role="status"
        aria-label={t('loading')}
        className="flex items-center justify-center"
        style={{ height }}
      >
        <Skeleton className="w-full" style={{ height }} />
      </div>
    );
  }

  if (empty || chartData.length === 0) {
    return (
      <div
        role="status"
        className="flex items-center justify-center text-sm text-muted-foreground"
        style={{ height }}
      >
        {emptyLabel}
      </div>
    );
  }

  const xFmt = xAxisFormat ?? ((v: string) => {
    const d = new Date(v);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });

  const yFmt = yAxisFormat ?? ((v: number) => String(v));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {type === 'area' ? (
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={xFmt}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFmt}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 6px)',
                boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
                fontSize: '14px',
                color: 'var(--foreground)',
              }}
              labelFormatter={(label) => xFmt(String(label))}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#trendGradient)"
              animationDuration={reducedMotion ? 0 : 300}
            />
          </AreaChart>
        ) : (
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={xFmt}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={yFmt}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md, 6px)',
                boxShadow: 'var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 0.1))',
                fontSize: '14px',
                color: 'var(--foreground)',
              }}
              labelFormatter={(label) => xFmt(String(label))}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              animationDuration={reducedMotion ? 0 : 300}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
