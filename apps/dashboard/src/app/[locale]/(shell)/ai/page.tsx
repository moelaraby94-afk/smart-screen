import { getTranslations } from 'next-intl/server';
import { AiToolsClient } from '@/features/dashboard/ai-tools-client';

type Props = { params: Promise<{ locale: string }> };

export default async function AiPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'aiPage' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('kicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <AiToolsClient />
    </main>
  );
}
