import { BranchesPageClient } from '@/features/branches/branches-page-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BranchesPage({ params }: Props) {
  const { locale } = await params;
  return (
    <main>
      <BranchesPageClient locale={locale} />
    </main>
  );
}
