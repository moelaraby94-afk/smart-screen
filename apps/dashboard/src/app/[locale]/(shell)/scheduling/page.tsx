import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { SchedulesClient } from '@/features/schedules/schedules-client';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'schedules' });
  return {
    title: `${t('title')} — Cloud-Screen`,
  };
}

export default async function SchedulingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const initialPlaylistId = typeof sp.playlistId === 'string' ? sp.playlistId : '';
  const initialScreenId = typeof sp.screen === 'string' ? sp.screen : '';
  const t = await getTranslations({ locale, namespace: 'schedules' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tCommon('timing')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <SchedulesClient locale={locale} initialPlaylistId={initialPlaylistId} initialScreenId={initialScreenId} />
    </main>
  );
}
