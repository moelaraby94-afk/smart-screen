import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

// `/content` was a strict subset of `/media` (same `/media` API, redundant grid+table,
// dead expiry UI). Merged into Media. Redirect preserves existing links/bookmarks.
export default async function ContentPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/media`);
}
