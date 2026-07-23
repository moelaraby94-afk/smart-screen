'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, ChevronRight } from 'lucide-react';
import { apiFetch } from '@/features/auth/session';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { Button } from '@/components/ui/button';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ScreenFleetStatusBadge,
} from '@/features/screens/screen-fleet-status';
import type { ScreenRow } from '@/features/screens/useApiScreens';

export function ActiveContentWidget() {
  const t = useTranslations('activeContent');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const { workspaceId, workspaceDataEpoch } = useWorkspace();
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) {
      setScreens([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await apiFetch(`/screens?workspaceId=${encodeURIComponent(workspaceId)}&page=1&limit=10`);
      if (res.ok) {
        const json = await res.json();
        const items = Array.isArray(json) ? json : json.items;
        setScreens(Array.isArray(items) ? items : []);
      } else {
        setScreens([]);
        setError(true);
      }
    } catch {
      setScreens([]);
      setError(true);
    }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => {
    void load();
  }, [load, workspaceDataEpoch]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
      role="region"
      aria-label={t('title')}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Monitor className="h-3.5 w-3.5 text-primary" strokeWidth={ICON_STROKE} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">{t('title')}</h2>
            <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>
        <Link
          href={`/${locale}/screens` as Route}
          className="text-xs font-medium text-primary hover:underline"
        >
          {t('viewAll')}
        </Link>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2.5">
              <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-2 w-1/3" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-xs text-muted-foreground">{t('error')}</p>
          <Button variant="ghost" size="sm" onClick={() => void load()} className="text-xs">
            {t('retry')}
          </Button>
        </div>
      ) : screens.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <Monitor className="h-8 w-8 text-muted-foreground/30" strokeWidth={ICON_STROKE} />
          <p className="text-sm font-medium text-foreground">{t('empty')}</p>
          <p className="text-xs text-muted-foreground">{t('emptyDesc')}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {screens.slice(0, 8).map((screen) => {
            return (
              <li key={screen.id}>
                <Link
                  href={`/${locale}/screens/${screen.id}` as Route}
                  className="flex items-center justify-between gap-3 py-2.5 transition-colors hover:bg-muted/30 -mx-2 px-2 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{screen.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {screen.activePlaylist?.name ?? t('noPlaylist')}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <ScreenFleetStatusBadge
                      status={screen.status}
                      lastSeenAt={screen.lastSeenAt}
                      locale={locale}
                      tone="card"
                      className="text-xs"
                    />
                    <ChevronRight
                      className={cn('h-4 w-4 text-muted-foreground/50', isAr && 'rotate-180')}
                    />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </motion.section>
  );
}
