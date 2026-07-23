'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, ListVideo, CalendarClock, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

const actions = [
  { key: 'addScreen', icon: Monitor, href: '/screens/pair', accent: 'bg-primary/10 text-primary ring-primary/20' },
  { key: 'createPlaylist', icon: ListVideo, href: '/playlists', accent: 'bg-success/10 text-success ring-success/20' },
  { key: 'uploadMedia', icon: ImageIcon, href: '/media', accent: 'bg-warning/10 text-warning ring-warning/20' },
  { key: 'viewSchedule', icon: CalendarClock, href: '/scheduling', accent: 'bg-primary/10 text-primary ring-primary/20' },
] as const;

export function QuickActionsSection() {
  const t = useTranslations('clientHome');
  const locale = useLocale();
  const { workspaces, workspaceId } = useWorkspace();

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId);
  const isViewer = currentWorkspace?.role === 'VIEWER';

  if (isViewer) return null;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" role="region" aria-label={t('quickActionsAria')}>
      {actions.map((action, i) => (
        <motion.div
          key={action.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * i, duration: 0.25 }}
        >
          <Link
            href={`/${locale}${action.href}` as Route}
            className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3.5 transition-all duration-fast hover:border-primary/30 hover:shadow-md"
          >
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform group-hover:scale-110',
                action.accent,
              )}
            >
              <action.icon className="h-4 w-4" strokeWidth={ICON_STROKE} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">
                {t(`quick.${action.key}`)}
              </p>
            </div>
            <ArrowRight
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
              strokeWidth={ICON_STROKE}
            />
          </Link>
        </motion.div>
      ))}
    </section>
  );
}
