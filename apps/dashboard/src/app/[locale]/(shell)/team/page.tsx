import { getTranslations } from 'next-intl/server';
import { TeamClient } from '@/features/team/team-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function TeamPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'teamPage' });

  return (
    <main>
      <h1 className="sr-only">{t('title')}</h1>
      <TeamClient />
    </main>
  );
}
