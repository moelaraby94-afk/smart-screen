import { PairingWizardClient } from '@/features/screens/pairing-wizard-client';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PairScreenPage({ params }: Props) {
  const { locale } = await params;

  return (
    <main>
      <PairingWizardClient locale={locale} />
    </main>
  );
}
