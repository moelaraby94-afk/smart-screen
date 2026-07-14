import { getTranslations } from 'next-intl/server';
import { PlaylistStudioClient } from '@/features/playlists/playlist-studio-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PlaylistsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'playlistStudio' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {tCommon('sequencing')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <PlaylistStudioClient />
    </main>
  );
}
