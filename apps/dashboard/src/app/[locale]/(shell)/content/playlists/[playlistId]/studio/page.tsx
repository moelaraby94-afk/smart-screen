import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { PlaylistStudioWithPreset } from '@/features/playlists/playlist-studio-with-preset';

type Props = {
  params: Promise<{ locale: string; playlistId: string }>;
};

export default async function PlaylistStudioRoute({ params }: Props) {
  const { locale, playlistId } = await params;
  const t = await getTranslations({ locale, namespace: 'playlistStudioClient' });
  const tNav = await getTranslations({ locale, namespace: 'nav' });

  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tNav('studio')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('studioEditor')}</h1>
      </header>
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
            …
          </div>
        }
      >
        <PlaylistStudioWithPreset playlistId={playlistId} />
      </Suspense>
    </main>
  );
}
