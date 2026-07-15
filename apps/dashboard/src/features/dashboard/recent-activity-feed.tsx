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
  screen: 'bg-blue-500/10 text-blue-500',
  media: 'bg-purple-500/10 text-purple-500',
  playlist: 'bg-green-500/10 text-green-500',
  schedule: 'bg-orange-500/10 text-orange-500',
  invite: 'bg-pink-500/10 text-pink-500',
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

  const fmtDate = (ts: string) =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(ts));

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-border bg-card p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <ActivityIcon className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            {t('title')}
          </h2>
          <p className="text-[11px] text-muted-foreground">{t('subtitle')}</p>
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
        <div className="relative max-h-[280px] overflow-y-auto pr-1">
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
                      'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-[3px] ring-card',
                      typeColor[item.type] ?? 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={ICON_STROKE} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {t(`type.${item.type}`, { fallback: item.type })} · {item.subtitle}
                    </p>
                  </div>
                  <time className="shrink-0 font-mono text-[10px] text-muted-foreground">
                    {fmtDate(item.timestamp)}
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
