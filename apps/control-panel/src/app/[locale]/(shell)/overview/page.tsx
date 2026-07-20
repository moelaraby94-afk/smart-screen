import { redirect } from 'next/navigation';
import type { Route } from 'next';

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin` as Route);
}
