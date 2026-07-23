import { getTranslations } from 'next-intl/server';
import { PlaylistListClient } from '@/features/playlists/playlist-list-client';

type Props = { params: Promise<{ locale: string }> };

export default async function PlaylistsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'playlistStudioClient' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tNav('playlists')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('pageTitle')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('pageDescription')}</p>
      </header>
      <PlaylistListClient />
    </main>
  );
}
