'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/features/auth/session';

const NOTIFICATION_TYPES = [
  'screen_offline',
  'screen_online',
  'upload_complete',
  'subscription_updated',
  'schedule_changed',
  'pairing_started',
] as const;

const DEFAULT_PREFS: Record<string, boolean> = {
  screen_offline: true,
  screen_online: true,
  upload_complete: true,
  subscription_updated: true,
  schedule_changed: true,
  pairing_started: true,
};

export function NotificationPreferences() {
  const t = useTranslations('settingsProfileClient');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications/preferences');
      if (res.ok) {
        const data = (await res.json()) as { preferences: Record<string, boolean> };
        setPrefs({ ...DEFAULT_PREFS, ...data.preferences });
      }
    } catch {
      // silently use defaults on load failure
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefs }),
      });
      if (!res.ok) {
        toast.error(t('prefsSaveFailed'));
        return;
      }
      toast.success(t('prefsSaved'));
    } catch {
      toast.error(t('prefsSaveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 className="text-lg font-semibold tracking-tight">{t('prefsTitle')}</h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t('prefsSubtitle')}</p>

      <ul className="mt-6 space-y-3">
        {NOTIFICATION_TYPES.map((type) => (
          <li
            key={type}
            className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-foreground">{t(`pref_${type}`)}</p>
              <p className="text-xs text-muted-foreground">{t(`pref_${type}_desc`)}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[type] ?? false}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                prefs[type] ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              onClick={() => setPrefs((prev) => ({ ...prev, [type]: !prev[type] }))}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition ${
                  prefs[type] ? 'rtl:translate-x-[-1.25rem] ltr:translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="mt-6 rounded-xl font-semibold"
        variant="cta"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
        {t('prefsSave')}
      </Button>
    </div>
  );
}
