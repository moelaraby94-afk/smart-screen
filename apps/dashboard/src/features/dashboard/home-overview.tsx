'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles, Zap } from 'lucide-react';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { ClientHomeDashboard } from '@/features/dashboard/client-home-dashboard';
import { ICON_STROKE } from '@/lib/icon-stroke';

type Props = {
  appTitle: string;
  headline: string;
  description: string;
};

export function HomeOverview({ appTitle, headline, description }: Props) {
  const t = useTranslations('homeOverview');
  const { userFullName, workspaces } = useWorkspace();
  const firstName = userFullName?.split(' ')[0] ?? '';

  return (
    <section className="space-y-6" aria-label={t('kicker')}>
      <h1 className="sr-only">{t('pageTitle')}</h1>
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-lg border border-border bg-gradient-to-br from-card via-card to-primary/[0.06] shadow-sm"
      >
        {/* Gradient mesh backdrop */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -end-16 -top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -start-12 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute end-1/3 top-1/2 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative px-6 py-8 sm:px-10 sm:py-12">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-ring/20">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{t('kicker')}</p>
          </div>

          <h2 className="mt-5 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            {firstName ? t('welcomeWithName', { name: firstName }) : headline}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary ring-1 ring-ring/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {appTitle}
            </span>
            {workspaces.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3.5 py-1.5 text-xs font-semibold text-success ring-1 ring-ring/20">
                <Zap className="h-3 w-3" strokeWidth={ICON_STROKE} />
                {t('workspacesCount', { count: workspaces.length })}
              </span>
            )}
            <span className="text-sm text-muted-foreground">{t('tagline')}</span>
          </div>
        </div>
      </motion.section>

      <AnimatePresence mode="wait">
        <motion.div
          key="home-dashboard"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          <ClientHomeDashboard />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
