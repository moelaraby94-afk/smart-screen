import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { CampaignsClient } from '@/features/campaigns/campaigns-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'campaigns' });
  return {
    title: `${t('title')} — Smart Screen`,
  };
}

export default async function CampaignsPage({ params }: Props) {
  await params;

  return (
    <main className="space-y-6">
      <CampaignsClient />
    </main>
  );
}
