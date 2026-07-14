import { getTranslations } from 'next-intl/server';
import { SettingsBillingClient } from '@/features/settings/settings-billing-client';
import { SettingsTabs } from '@/features/settings/settings-tabs';

type Props = { params: Promise<{ locale: string }> };

export default async function SettingsBillingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settingsPages' });
  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t('billingKicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('billingTitle')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('billingDescription')}
        </p>
      </header>
      <SettingsTabs />
      <SettingsBillingClient />
    </main>
  );
}
