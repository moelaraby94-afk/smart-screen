'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useLocale, useTranslations } from 'next-intl';
import { Home, SearchX } from 'lucide-react';

export default function NotFound() {
  const locale = useLocale();
  const t = useTranslations('notFoundPage');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50">
        <SearchX className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="text-4xl font-bold tracking-tight text-foreground">{t('code')}</p>
        <p className="text-lg font-semibold text-foreground">{t('title')}</p>
        <p className="max-w-md text-sm text-muted-foreground">{t('description')}</p>
      </div>
      <Link
        href={`/${locale}/overview` as Route}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <Home className="h-4 w-4" strokeWidth={1.8} />
        {t('backToOverview')}
      </Link>
    </div>
  );
}
