'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Film,
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
  screen: 'bg-blue-500/10 text-blue-500',
  media: 'bg-purple-500/10 text-purple-500',
  playlist: 'bg-green-500/10 text-green-500',
  schedule: 'bg-orange-500/10 text-orange-500',
  invite: 'bg-pink-500/10 text-pink-500',
};

export function RecentActivityFeed() {
  const t = useTranslations('activityFeed');
  const locale = useLocale();
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

  const fmtDate = (ts: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts));

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="vc-card-surface rounded-xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <ActivityIcon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
            >
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const Icon = typeIcon[item.type] ?? ActivityIcon;
            return (
              <motion.li
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * i, duration: 0.25 }}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 p-3"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                    typeColor[item.type] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t(`type.${item.type}`, { fallback: item.type })} · {item.subtitle}
                  </p>
                </div>
                <time className="shrink-0 font-mono-nums text-xs text-muted-foreground">
                  {fmtDate(item.timestamp)}
                </time>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
