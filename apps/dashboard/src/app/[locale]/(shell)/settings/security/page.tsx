import { getTranslations } from 'next-intl/server';
import { SettingsSecurityClient } from '@/features/settings/settings-security-client';
import { SettingsTabs } from '@/features/settings/settings-tabs';

type Props = { params: Promise<{ locale: string }> };

export default async function SecuritySettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settingsSecurity' });
  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <h1 className="text-xl font-semibold tracking-tight">{t('changePasswordTitle')}</h1>
      </header>
      <SettingsTabs />
      <SettingsSecurityClient />
    </main>
  );
}
