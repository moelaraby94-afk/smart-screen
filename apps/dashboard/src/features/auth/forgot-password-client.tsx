'use client';

import { useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { forgotPassword as apiForgotPassword, resetPassword as apiResetPassword } from '@/features/auth/auth-api';

export function ForgotPasswordClient() {
  const t = useTranslations('forgotPasswordClient');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await apiForgotPassword(email);
      if (!res.ok) {
        toast.error(t('requestFailed'));
        return;
      }
      toast.success(t('requestSent'));
      setSuccess(true);
    } finally {
      setPending(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      toast.error(t('missingTokenOrEmail'));
      return;
    }
    setPending(true);
    try {
      const res = await apiResetPassword({
        email,
        token,
        newPassword,
      });
      if (!res.ok) {
        toast.error(t('resetFailed'));
        return;
      }
      toast.success(t('passwordUpdated'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="w-full">
      {/* Mobile brand header */}
      <div className="mb-8 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t('brand')}
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {token ? t('setNewPasswordTitle') : t('forgotPasswordTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {token
            ? t('setNewPasswordDescription')
            : t('forgotPasswordDescription')}
        </p>
      </div>

      {/* Desktop heading */}
      <div className="mb-8 hidden lg:block">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {token ? t('setNewPasswordTitle') : t('forgotPasswordTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {token
            ? t('setNewPasswordDescription')
            : t('forgotPasswordDescription')}
        </p>
      </div>

          {!token && !success ? (
            <form className="mt-8 space-y-4" onSubmit={(e) => void requestReset(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('email')}</Label>
                <Input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-10 w-full rounded-lg font-semibold"
                variant="cta"
                aria-busy={pending}
              >
                {pending ? t('sending') : t('sendResetLink')}
              </Button>
            </form>
          ) : !token && success ? (
            <div className="mt-8 space-y-4 text-center">
              <p className="text-sm text-muted-foreground" role="status">{t('successMessage')}</p>
              <Link
                href={`/${locale}/login` as Route}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t('backToSignIn')}
              </Link>
            </div>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={(e) => void resetPassword(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('email')}</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('newPassword')}</Label>
                <Input
                  required
                  type="password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-10 w-full rounded-lg font-semibold"
                variant="cta"
                aria-busy={pending}
              >
                {t('updatePassword')}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link href={`/${locale}/login`} className="font-semibold text-primary underline-offset-4 hover:underline">
              {t('backToSignIn')}
            </Link>
          </p>
    </div>
  );
}
