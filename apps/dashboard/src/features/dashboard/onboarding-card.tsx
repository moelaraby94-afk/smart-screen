'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Monitor, Image, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ICON_STROKE } from '@/lib/icon-stroke';

const steps = [
  { icon: Monitor, key: 'pair' },
  { icon: Image, key: 'create' },
  { icon: Send, key: 'publish' },
] as const;

export function OnboardingCard() {
  const t = useTranslations('onboardingCard');
  const locale = useLocale();
  const router = useRouter();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl rounded-lg border border-border bg-card p-8 text-center shadow-sm"
      role="region"
      aria-label={t('ariaLabel')}
    >
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        {t('welcome')}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('description')}
      </p>

      <ol className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
        {steps.map((step, i) => (
          <li key={step.key} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-ring/20">
              <step.icon className="h-5 w-5 text-primary" strokeWidth={ICON_STROKE} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {i + 1}. {t(`steps.${step.key}.title`)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`steps.${step.key}.desc`)}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <Button
        variant="default"
        size="lg"
        className="mt-8"
        aria-label={t('ctaAria')}
        onClick={() => router.push(`/${locale}/screens/pair` as never as Route)}
      >
        {t('cta')}
      </Button>
    </motion.section>
  );
}
