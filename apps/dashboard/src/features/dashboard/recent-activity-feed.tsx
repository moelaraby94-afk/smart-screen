'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  ListMusic,
  Mail,
  MonitorSmartphone,
  CalendarClock,
  Activity as ActivityIcon,
} from 'lucide-react';
import { fetchRecentActivity } from '@/features/dashboard/dashboard-api';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type ActivityItem = {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
};

const typeIcon: Record<string, typeof MonitorSmartphone> = {
  screen: MonitorSmartphone,
  media: ImageIcon,
  playlist: ListMusic,
  schedule: CalendarClock,
  invite: Mail,
};

const typeColor: Record<string, string> = {
  screen: 'bg-primary/10 text-primary',
  media: 'bg-warning/10 text-warning',
  playlist: 'bg-success/10 text-success',
  schedule: 'bg-primary/10 text-primary',
  invite: 'bg-destructive/10 text-destructive',
};

export function RecentActivityFeed() {
  const t = useTranslations('activityFeed');
  const locale = useLocale();
  const dir = locale === 'ar' ? -1 : 1;
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetchRecentActivity(workspaceId);
    if (res.ok) {
      setItems((await res.json()) as ActivityItem[]);
    } else {
      setItems([]);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  const fmtRelative = (ts: string) => {
    const t = Date.parse(ts);
    if (!Number.isFinite(t)) return ts;
    const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (diffSec < 60) return rtf.format(-diffSec, 'second');
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return rtf.format(-diffMin, 'minute');
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 48) return rtf.format(-diffHr, 'hour');
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 14) return rtf.format(-diffDay, 'day');
    return new Intl.DateTimeFormat(locale, { dateStyle: 'short' }).format(new Date(t));
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
      role="region"
      aria-label={t('title')}
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ActivityIcon className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-2.5 w-1/3" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-6 text-center">
          <ActivityIcon className="h-4 w-4 text-muted-foreground/40" strokeWidth={ICON_STROKE} />
          <p className="text-xs text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="relative max-h-[280px] overflow-y-auto pe-1">
          {/* Timeline line */}
          <div className="absolute inset-y-0 start-[14px] w-px bg-border" />
          <ul className="space-y-0.5">
            {items.map((item, i) => {
              const Icon = typeIcon[item.type] ?? ActivityIcon;
              return (
                <motion.li
                  key={`${item.type}-${item.id}`}
                  initial={{ opacity: 0, x: -6 * dir }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.02 * i, duration: 0.2 }}
                  className="relative flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30"
                >
                  <div
                    className={cn(
                      'relative z-card flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-[3px] ring-card',
                      typeColor[item.type] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {t(`type.${item.type}`, { fallback: item.type })} · {item.subtitle}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-xs text-muted-foreground">
                    {fmtRelative(item.timestamp)}
                  </time>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}
    </motion.section>
  );
}
