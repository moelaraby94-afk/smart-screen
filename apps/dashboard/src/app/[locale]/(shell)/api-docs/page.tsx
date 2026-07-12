import { getTranslations } from 'next-intl/server';
import { ApiDocsClient } from '@/features/api-docs/api-docs-client';

type Props = { params: Promise<{ locale: string }> };

export default async function ApiDocsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'apiDocs' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('kicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <ApiDocsClient />
    </main>
  );
}
