'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2, Save, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { apiFetch } from '@/features/auth/session';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type NotificationType =
  | 'screen_offline'
  | 'screen_online'
  | 'upload_complete'
  | 'subscription_updated'
  | 'schedule_changed'
  | 'pairing_started'
  | 'invite_accepted'
  | 'member_removed'
  | 'storage_limit'
  | 'plan_expiry';

type Category = {
  key: 'categoryScreen' | 'categorySchedule' | 'categoryTeam' | 'categorySystem';
  types: NotificationType[];
};

const CATEGORIES: Category[] = [
  { key: 'categoryScreen', types: ['screen_offline', 'screen_online', 'upload_complete'] },
  { key: 'categorySchedule', types: ['schedule_changed'] },
  { key: 'categoryTeam', types: ['invite_accepted', 'member_removed', 'pairing_started'] },
  { key: 'categorySystem', types: ['subscription_updated', 'storage_limit', 'plan_expiry'] },
];

const DEFAULT_PREFS: Record<string, boolean> = {
  screen_offline: true,
  screen_online: true,
  upload_complete: true,
  subscription_updated: true,
  schedule_changed: true,
  pairing_started: true,
  invite_accepted: true,
  member_removed: true,
  storage_limit: true,
  plan_expiry: true,
};

export function NotificationPreferences() {
  const t = useTranslations('settingsProfileClient');
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <h2 className="text-lg font-semibold tracking-tight">{t('prefsTitle')}</h2>
      </div>
      <p className="text-sm text-muted-foreground">{t('prefsSubtitle')}</p>

      {CATEGORIES.map((category) => (
        <div key={category.key} className="rounded-lg border border-border bg-card p-6 shadow-sm md:p-8">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{t(category.key)}</h3>
          <ul className="mt-4 space-y-3">
            {category.types.map((type) => (
              <li
                key={type}
                className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/20 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{t(`pref_${type}`)}</p>
                  <p className="text-xs text-muted-foreground">{t(`pref_${type}_desc`)}</p>
                </div>
                <Switch
                  checked={prefs[type] ?? false}
                  onCheckedChange={(checked) => setPrefs((prev) => ({ ...prev, [type]: checked }))}
                  aria-label={t(`pref_${type}`)}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          className="rounded-lg"
          onClick={() => setResetDialogOpen(true)}
        >
          <RotateCcw className="me-2 h-4 w-4" />
          {t('resetToDefaults')}
        </Button>
        <Button
          type="button"
          className="rounded-lg font-semibold"
          variant="cta"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Save className="me-2 h-4 w-4" />}
          {t('prefsSave')}
        </Button>
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('resetToDefaults')}</AlertDialogTitle>
            <AlertDialogDescription>{t('confirmResetDefaults')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setPrefs(DEFAULT_PREFS); setResetDialogOpen(false); }}>
              {t('reset')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
