import { getTranslations } from 'next-intl/server';
import { SettingsApiClient } from '@/features/settings/settings-api-client';
import { SettingsTabs } from '@/features/settings/settings-tabs';

type Props = { params: Promise<{ locale: string }> };

export default async function ApiSettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settingsApi' });
  const tSettings = await getTranslations({ locale, namespace: 'settingsPages' });
  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tSettings('apiKicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </header>
      <SettingsTabs />
      <SettingsApiClient />
    </main>
  );
}
