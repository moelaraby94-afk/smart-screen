import { getTranslations } from 'next-intl/server';
import { SettingsNotificationsClient } from '@/features/settings/settings-notifications-client';
import { SettingsTabs } from '@/features/settings/settings-tabs';

type Props = { params: Promise<{ locale: string }> };

export default async function NotificationsSettingsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  const tSettings = await getTranslations({ locale, namespace: 'settingsPages' });
  return (
    <main className="space-y-6">
      <header className="space-y-1 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {tSettings('notificationsKicker')}
        </p>
        <h1 className="text-xl font-semibold tracking-tight">{t('notificationsSettings')}</h1>
      </header>
      <SettingsTabs />
      <SettingsNotificationsClient />
    </main>
  );
}
