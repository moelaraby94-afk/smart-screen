import { redirect } from 'next/navigation';
import type { Route } from 'next';

type Props = {
  params: Promise<{ locale: string; playlistId: string }>;
};

export default async function PlaylistDetailPage({ params }: Props) {
  const { locale, playlistId } = await params;
  redirect(`/${locale}/playlists/${playlistId}/studio` as Route);
}
