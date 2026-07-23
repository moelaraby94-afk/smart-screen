import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ locale: string; playlistId: string }>;
};

export default async function PlaylistDetailPage({ params }: Props) {
  const { locale, playlistId } = await params;
  redirect(`/${locale}/content/playlists/${playlistId}/studio`);
}
