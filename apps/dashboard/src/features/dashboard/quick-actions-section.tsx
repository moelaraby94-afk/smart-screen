'use client';

import type { Route } from 'next';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Monitor,
  Upload,
  ListVideo,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import { ICON_STROKE } from '@/lib/icon-stroke';
import { cn } from '@/lib/utils';

const actions = [
  { key: 'screens', icon: Monitor, href: '/screens', accent: 'bg-blue-500/10 text-blue-400 ring-blue-500/20' },
  { key: 'media', icon: Upload, href: '/media', accent: 'bg-amber-500/10 text-amber-400 ring-amber-500/20' },
  { key: 'playlists', icon: ListVideo, href: '/playlists', accent: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' },
  { key: 'schedules', icon: CalendarClock, href: '/schedules', accent: 'bg-violet-500/10 text-violet-400 ring-violet-500/20' },
] as const;

export function QuickActionsSection() {
  const t = useTranslations('clientHome');
  const locale = useLocale();

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action, i) => (
        <motion.div
          key={action.key}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.03 * i, duration: 0.25 }}
        >
          <Link
            href={`/${locale}${action.href}` as Route}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
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
