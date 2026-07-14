import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// "Display Groups" actually managed playlists (same `/playlists` API), mislabeled and in the
// wrong section. Merged into Playlists (which now surfaces the screens-in-group count).
// Redirect preserves existing links/bookmarks.
export default async function DisplayGroupsPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/playlists`);
}
