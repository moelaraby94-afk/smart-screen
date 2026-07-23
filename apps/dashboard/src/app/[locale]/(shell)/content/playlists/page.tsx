import { redirect } from 'next/navigation';
import type { Route } from 'next';

type Props = { params: Promise<{ locale: string }> };

export default async function ContentPlaylistsPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/playlists` as Route);
}
