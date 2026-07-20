'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { ScreenStatus } from '@/features/screens/useApiScreens';

const STALE_AFTER_MS = 75_000;

export type FleetReachability = 'online' | 'stale' | 'offline' | 'maintenance';

export function deriveFleetReachability(
  status: ScreenStatus,
  lastSeenAt: string | null | undefined,
): FleetReachability {
  if (status === 'MAINTENANCE') return 'maintenance';
  if (status === 'OFFLINE') return 'offline';
  const last = lastSeenAt ? Date.parse(lastSeenAt) : NaN;
  if (!Number.isFinite(last)) return 'offline';
  if (Date.now() - last > STALE_AFTER_MS) return 'stale';
  return 'online';
}

export function formatLastSeenRelative(
  lastSeenAt: string | null | undefined,
  locale: string,
): string | null {
  if (!lastSeenAt) return null;
  const t = Date.parse(lastSeenAt);
  if (!Number.isFinite(t)) return null;
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (diffSec < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return rtf.format(-diffMin, 'minute');
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return rtf.format(-diffHr, 'hour');
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 14) return rtf.format(-diffDay, 'day');
  return new Date(t).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
}

export function useFleetStatusTick(intervalMs = 15_000): void {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
}

type BadgeProps = {
  status: ScreenStatus;
  lastSeenAt: string | null | undefined;
  locale: string;
  className?: string;
  tone?: 'overlay' | 'card';
  ['aria-label']?: string;
};

export function ScreenFleetStatusBadge({
  status,
  lastSeenAt,
  locale,
  className,
  tone = 'overlay',
  ...rest
}: BadgeProps) {
  const t = useTranslations('screensClient');
  useFleetStatusTick();
  const reach = deriveFleetReachability(status, lastSeenAt);
  const relative = formatLastSeenRelative(lastSeenAt, locale);

  const label =
    reach === 'online'
      ? t('fleetStatus.online')
      : reach === 'stale'
        ? t('fleetStatus.stale')
        : reach === 'maintenance'
          ? t('fleetStatus.maintenance')
          : t('fleetStatus.offline');

  const chip =
    tone === 'overlay'
      ? {
          online:
            'border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 shadow-[0_0_18px_rgba(16,185,129,0.45)]',
          stale:
            'border border-amber-400/40 bg-amber-500/15 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)]',
          offline:
            'border border-red-400/35 bg-red-500/12 text-red-100 shadow-[0_0_16px_rgba(239,68,68,0.35)]',
          maintenance:
            'border border-amber-400/35 bg-amber-500/12 text-amber-100 shadow-[0_0_14px_rgba(245,158,11,0.35)]',
          sub: 'text-white/50',
        }
      : {
          online: 'border border-success/35 bg-success/10 text-success',
          stale: 'border border-warning/35 bg-warning/10 text-warning',
          offline: 'border border-destructive/40 bg-destructive/10 text-destructive',
          maintenance: 'border border-warning/35 bg-warning/10 text-warning',
          sub: 'text-muted-foreground',
        };

  const chipClass =
    reach === 'online'
      ? chip.online
      : reach === 'stale'
        ? chip.stale
        : reach === 'offline'
          ? chip.offline
          : chip.maintenance;

  return (
    <div className={cn('flex flex-col items-start gap-0.5', className)} {...rest}>
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide',
          chipClass,
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            reach === 'online' && 'animate-pulse bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]',
            reach === 'stale' && 'bg-warning',
            reach === 'offline' && 'bg-destructive',
            reach === 'maintenance' && 'bg-warning',
          )}
        />
        {label}
      </span>
      {relative ? (
        <span
          className={cn(
            'ps-0.5 text-xs font-medium uppercase tracking-wide',
            chip.sub,
          )}
        >
          {t('fleetStatus.lastSeen', { relative })}
        </span>
      ) : null}
    </div>
  );
}
