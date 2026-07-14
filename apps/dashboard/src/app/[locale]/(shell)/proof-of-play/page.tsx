import { redirect } from 'next/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function ProofOfPlayPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/analytics`);
}
