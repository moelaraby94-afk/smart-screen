import { ScreenDetailClient } from '@/features/screens/screen-detail-client';

type Props = {
  params: Promise<{ locale: string; screenId: string }>;
};

export default async function ScreenDetailPage({ params }: Props) {
  const { locale, screenId } = await params;

  return (
    <main>
      <ScreenDetailClient screenId={screenId} locale={locale} />
    </main>
  );
}
