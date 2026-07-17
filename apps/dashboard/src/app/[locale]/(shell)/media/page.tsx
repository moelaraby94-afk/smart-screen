import { redirect } from 'next/navigation';
import type { Route } from 'next';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function MediaPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/content/media` as Route);
}
