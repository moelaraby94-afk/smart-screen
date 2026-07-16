'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { value: number; direction: 'up' | 'down' };
  icon?: LucideIcon;
  loading?: boolean;
};

export function MetricCard({ label, value, unit, trend, icon: Icon, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <Skeleton className="mt-3 h-8 w-20" />
        <Skeleton className="mt-2 h-3 w-16" />
      </div>
    );
  }

  const ariaLabel = `${label}: ${value}${unit ? ` ${unit}` : ''}${
    trend ? `, ${trend.value}% ${trend.direction}` : ''
  }`;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className="rounded-lg border border-border bg-card p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-normal text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-base font-normal text-muted-foreground">{unit}</span>}
      </div>
      {trend && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-sm font-medium',
            trend.direction === 'up' ? 'text-success' : 'text-destructive',
          )}
          aria-label={`${trend.value}% ${trend.direction}`}
        >
          {trend.direction === 'up' ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
          )}
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
}
