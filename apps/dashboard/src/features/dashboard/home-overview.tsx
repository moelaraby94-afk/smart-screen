'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import { ClientHomeDashboard } from '@/features/dashboard/client-home-dashboard';

type Props = {
  appTitle: string;
  headline: string;
  description: string;
};

export function HomeOverview({ appTitle, headline, description }: Props) {
  const t = useTranslations('homeOverview');
  return (
    <main className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm dark:border-white/[0.06] dark:bg-card"
      >
        {/* Gradient mesh backdrop */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-violet-500/8 blur-3xl dark:bg-violet-500/10" />
          <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-pink-500/6 blur-3xl dark:bg-pink-500/8" />
        </div>

        <div className="relative px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <p className="vc-page-kicker">{t('kicker')}</p>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {headline}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {appTitle}
            </span>
            <span className="text-sm text-muted-foreground">{t('tagline')}</span>
          </div>
        </div>
      </motion.section>

      <ClientHomeDashboard />
    </main>
  );
}
