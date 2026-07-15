import { redirect } from 'next/navigation';
import type { Route } from 'next';

type Props = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export default async function LegacyBranchRedirect({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/branches` as Route);
}
