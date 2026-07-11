'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  apiFetch,
  setStoredAccessToken,
} from '@/features/auth/session';
import { useApiErrorToast } from '@/features/api/use-api-error-toast';
import { useWorkspace } from '@/features/workspace/workspace-context';
import { COUNTRIES, guessCountryCode } from '@/lib/countries';

type Step = 'form' | 'otp';

export function RegisterClient() {
  const t = useTranslations('registerClient');
  const { toastResponseError } = useApiErrorToast();
  const tLegal = useTranslations('legal');
  const locale = useLocale();
  const router = useRouter();
  const { refreshWorkspaces } = useWorkspace();

  const [step, setStep] = useState<Step>('form');
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('US');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    setCountry(guessCountryCode());
  }, []);

  const dial = useMemo(() => COUNTRIES.find((c) => c.code === country)?.dial ?? '', [country]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await apiFetch('/auth/register/start', {
        method: 'POST',
        body: JSON.stringify({
          email,
          businessName,
          fullName,
          phone: `${dial} ${phone}`.trim(),
          country,
          city: city || undefined,
          password,
          locale,
        }),
      });
      if (res.status === 409) {
        toast.error(t('emailExists'));
        return;
      }
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('otpSent'));
      setStep('otp');
    } finally {
      setPending(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await apiFetch('/auth/register/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code: otp }),
      });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      const payload = (await res.json()) as {
        accessToken?: string;
        workspaces?: Array<{ id: string }>;
      };
      if (payload.accessToken) setStoredAccessToken(payload.accessToken);
      const ws = payload.workspaces?.[0]?.id ?? null;
      await refreshWorkspaces(ws);
      toast.success(t('welcome'));
      router.push(`/${locale}/media` as Route);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const resendOtp = async () => {
    if (!email.trim()) return;
    setPending(true);
    try {
      const res = await apiFetch('/auth/register/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        await toastResponseError(res);
        return;
      }
      toast.success(t('resendSent'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {t('brand')}
          </p>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {step === 'form' ? t('createWorkspaceTitle') : t('verifyEmailTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {step === 'form'
              ? t('formDescription')
              : t('otpDescription', { email })}
          </p>

          {step === 'form' ? (
            <form className="mt-8 space-y-4" onSubmit={(e) => void submitForm(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('businessName')}</Label>
                <Input
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('yourName')}</Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">{t('country')}</Label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.dial})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">{t('phone')}</Label>
                  <div className="flex gap-2">
                    <span className="flex h-10 min-w-[3.5rem] items-center justify-center rounded-xl border border-border bg-muted text-xs text-muted-foreground">
                      {dial}
                    </span>
                    <Input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className="rounded-xl border-border bg-background text-foreground"
                      placeholder={t('phonePlaceholder')}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('city')}</Label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('password')}</Label>
                <Input
                  required
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 w-full rounded-xl font-semibold"
                variant="cta"
              >
                {t('continue')}
              </Button>
            </form>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={(e) => void submitOtp(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('code6Digits')}</Label>
                <Input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="rounded-xl border-border bg-background text-center font-mono text-2xl tracking-[0.4em] text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending || otp.length !== 6}
                className="h-11 w-full rounded-xl font-semibold"
                variant="cta"
              >
                {t('activateAccount')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep('form')}
              >
                {t('back')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-xl"
                disabled={pending}
                onClick={() => void resendOtp()}
              >
                {pending ? t('resending') : t('resendCode')}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
            {t('legalPrefix')}{' '}
            <Link
              href={`/${locale}/terms`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {tLegal('termsLink')}
            </Link>{' '}
            {t('legalAnd')}{' '}
            <Link
              href={`/${locale}/privacy`}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {tLegal('privacyLink')}
            </Link>
            .
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href={`/${locale}/login`} className="font-semibold text-primary underline-offset-4 hover:underline">
              {t('backToSignIn')}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
