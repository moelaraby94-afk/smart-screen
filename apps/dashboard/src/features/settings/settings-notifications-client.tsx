'use client';

import { NotificationPreferences } from '@/features/settings/notification-preferences';

export function SettingsNotificationsClient() {
  return (
    <div className="space-y-6">
      <NotificationPreferences />
    </div>
  );
}
