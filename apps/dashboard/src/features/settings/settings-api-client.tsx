'use client';

import { useTranslations } from 'next-intl';
import { ApiKeysManager } from '@/features/api-docs/api-keys-manager';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import type { Route } from 'next';

export function SettingsApiClient() {
  const t = useTranslations('settingsApi');
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <ApiKeysManager />

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BookOpen className="h-4 w-4" />
        <Link
          href={`/${locale}/api-docs` as Route}
          className="text-primary hover:underline"
        >
          {t('viewDocs')}
        </Link>
      </div>
    </div>
  );
}
