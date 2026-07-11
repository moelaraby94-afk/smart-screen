'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/features/auth/session';

export function ForgotPasswordClient() {
  const t = useTranslations('forgotPasswordClient');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [email, setEmail] = useState(emailParam ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        toast.error(t('requestFailed'));
        return;
      }
      toast.success(t('requestSent'));
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
      const res = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email,
          token,
          newPassword,
        }),
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
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t('brand')}
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
            {token ? t('setNewPasswordTitle') : t('forgotPasswordTitle')}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {token
              ? t('setNewPasswordDescription')
              : t('forgotPasswordDescription')}
          </p>

          {!token ? (
            <form className="mt-8 space-y-4" onSubmit={(e) => void requestReset(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('email')}</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl font-semibold"
                variant="cta"
              >
                {t('sendResetLink')}
              </Button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={(e) => void resetPassword(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('email')}</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
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
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl font-semibold"
                variant="cta"
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
      </section>
    </div>
  );
}
