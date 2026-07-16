import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { AnalyticsPageClient } from '@/features/analytics/analytics-page-client';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analyticsPage' });
  return {
    title: `${t('title')} — Cloud-Screen`,
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'analyticsPage' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('kicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <AnalyticsPageClient />
    </main>
  );
}
