import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { MediaLibraryClient } from '@/features/media/media-library-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MediaPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'mediaClient' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('kicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            …
          </div>
        }
      >
        <MediaLibraryClient />
      </Suspense>
    </main>
  );
}
