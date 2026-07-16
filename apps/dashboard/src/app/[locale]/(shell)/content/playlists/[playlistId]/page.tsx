import { Suspense } from 'react';
import { PlaylistDetailClient } from '@/features/playlists/playlist-detail-client';

type Props = {
  params: Promise<{ locale: string; playlistId: string }>;
};

export default async function PlaylistDetailPage({ params }: Props) {
  const { playlistId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          …
        </div>
      }
    >
      <PlaylistDetailClient playlistId={playlistId} />
    </Suspense>
  );
}
