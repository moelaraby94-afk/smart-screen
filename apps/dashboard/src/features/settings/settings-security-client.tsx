'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiFetch } from '@/features/auth/session';
import { TwoFactorSettings } from '@/features/settings/two-factor-settings';
import { exportAccountData, anonymizeAccount } from '@/features/billing/billing-api';
import { fetchCurrentUser } from '@/features/workspace/workspace-api';

export function SettingsSecurityClient() {
  const t = useTranslations('settingsSecurity');
  const tProfile = useTranslations('settingsProfileClient');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    void (async () => {
      const res = await fetchCurrentUser();
      if (res.ok) {
        const me = (await res.json()) as { email: string };
        setUserEmail(me.email);
      }
    })();
  }, []);

  const handleChangePassword = async () => {
    setError('');

    if (!currentPassword) {
      setError(t('currentRequired'));
      return;
    }
    if (newPassword.length < 8) {
      setError(t('weakPassword'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDontMatch'));
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/auth/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.message?.includes('incorrect')) {
          setError(t('wrongCurrentPassword'));
        } else {
          setError(t('changeFailed'));
        }
        return;
      }
      toast.success(t('passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError(t('changeFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await exportAccountData();
      if (!res.ok) throw new Error();
      const blob = await res.json();
      const json = JSON.stringify(blob, null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-data-${userEmail || 'export'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(tProfile('exportSuccess'));
    } catch {
      toast.error(tProfile('exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [userEmail, tProfile]);

  const handleAnonymize = useCallback(async () => {
    setDeleting(true);
    try {
      const res = await anonymizeAccount();
      if (!res.ok) throw new Error();
      toast.success(tProfile('anonymizeSuccess'));
      setDeleteOpen(false);
      setTimeout(() => {
        window.location.href = `/${typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : 'en'}/login`;
      }, 2000);
    } catch {
      toast.error(tProfile('anonymizeFailed'));
    } finally {
      setDeleting(false);
    }
  }, [tProfile]);

  return (
    <div className="space-y-8">
      <div className="vc-card-surface rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{t('changePasswordTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('changePasswordSubtitle')}</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrent ? 'text' : 'password'}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="rounded-xl pe-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                aria-label={showCurrent ? t('hidePassword') : t('showPassword')}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); if (newPasswordError) setNewPasswordError(null); }}
                onBlur={() => {
                  if (newPassword && newPassword.length < 8) {
                    setNewPasswordError(t('weakPassword'));
                  }
                }}
                aria-invalid={!!newPasswordError}
                className="rounded-xl pe-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                aria-label={showNew ? t('hidePassword') : t('showPassword')}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
            {newPasswordError && <p className="text-sm text-destructive" role="alert">{newPasswordError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (confirmPasswordError) setConfirmPasswordError(null); }}
                onBlur={() => {
                  if (confirmPassword && newPassword !== confirmPassword) {
                    setConfirmPasswordError(t('passwordsDontMatch'));
                  }
                }}
                aria-invalid={!!confirmPasswordError}
                className="rounded-xl pe-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 end-0 flex items-center pe-3 text-muted-foreground hover:text-foreground"
                aria-label={showConfirm ? t('hidePassword') : t('showPassword')}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirmPasswordError && <p className="text-sm text-destructive" role="alert">{confirmPasswordError}</p>}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert" aria-live="polite">
              {error}
            </p>
          )}

          <Button
            type="button"
            variant="cta"
            className="rounded-xl font-semibold"
            disabled={saving}
            onClick={() => void handleChangePassword()}
          >
            {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
            {t('changePassword')}
          </Button>
        </div>
      </div>

      <TwoFactorSettings />

      <div className="vc-card-surface rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm md:p-8">
        <h2 className="text-lg font-semibold tracking-tight">{tProfile('gdprTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{tProfile('gdprSubtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            disabled={exporting}
            onClick={() => void handleExport()}
          >
            {exporting ? tProfile('exporting') : tProfile('exportData')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-xl"
            onClick={() => setDeleteOpen(true)}
          >
            {tProfile('deleteAccount')}
          </Button>
        </div>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{tProfile('deleteAccountTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">{tProfile('deleteAccountWarning')}</p>
            <Label>{tProfile('deleteAccountConfirm')}</Label>
            <Input
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={tProfile('deleteAccountConfirmPlaceholder')}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              disabled={deleting || deleteConfirm !== tProfile('deleteAccountConfirmWord')}
              onClick={() => void handleAnonymize()}
            >
              {deleting ? tProfile('deleting') : tProfile('deleteAccountConfirmBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
