import { getTranslations } from 'next-intl/server';
import { ContentTabs } from '@/features/content/content-tabs';
import { PlaylistListClient } from '@/features/playlists/playlist-list-client';

type Props = { params: Promise<{ locale: string }> };

export default async function ContentPlaylistsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contentPage' });
  const tCommon = await getTranslations({ locale, namespace: 'common' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tCommon('content')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{t('description')}</p>
      </header>
      <ContentTabs />
      <PlaylistListClient />
    </main>
  );
}
