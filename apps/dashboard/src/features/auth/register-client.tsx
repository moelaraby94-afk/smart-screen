'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  setStoredAccessToken,
} from '@/features/auth/session';
import {
  registerStart as apiRegisterStart,
  registerVerify as apiRegisterVerify,
  registerResend as apiRegisterResend,
} from '@/features/auth/auth-api';
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
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    setCountry(guessCountryCode());
  }, []);

  const dial = useMemo(() => COUNTRIES.find((c) => c.code === country)?.dial ?? '', [country]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    try {
      const res = await apiRegisterStart({
        email,
        businessName,
        fullName,
        phone: `${dial} ${phone}`.trim(),
        country,
        city: city || undefined,
        password,
        locale,
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
      const res = await apiRegisterVerify(email, otp);
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
      router.push(`/${locale}/overview` as Route);
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  const resendOtp = async () => {
    if (!email.trim()) return;
    setPending(true);
    try {
      const res = await apiRegisterResend(email);
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
    <div className="w-full">
      {/* Mobile brand header */}
      <div className="mb-8 lg:hidden">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t('brand')}
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">
          {step === 'form' ? t('createWorkspaceTitle') : t('verifyEmailTitle')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 'form'
            ? t('formDescription')
            : t('otpDescription', { email })}
        </p>
      </div>

      {/* Desktop heading */}
      <div className="mb-8 hidden lg:block">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {step === 'form' ? t('createWorkspaceTitle') : t('verifyEmailTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 'form'
            ? t('formDescription')
            : t('otpDescription', { email })}
        </p>
      </div>

          {step === 'form' ? (
            <form className="mt-8 space-y-4" onSubmit={(e) => void submitForm(e)}>
              <div className="space-y-2">
                <Label className="text-foreground">{t('businessName')}</Label>
                <Input
                  required
                  autoFocus
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('yourName')}</Label>
                <Input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
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
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-foreground">{t('country')}</Label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
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
                    <span className="flex h-9 min-w-[3.5rem] items-center justify-center rounded-lg border border-border bg-muted text-xs text-muted-foreground">
                      {dial}
                    </span>
                    <Input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 14))}
                      className="h-9 rounded-lg border-border bg-background text-foreground"
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
                  className="h-9 rounded-lg border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">{t('password')}</Label>
                <p className="text-xs text-muted-foreground">{t('passwordHint')}</p>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 rounded-lg border-border bg-background text-foreground pe-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-inline-end-0 top-0 flex h-9 w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="h-10 w-full rounded-lg font-semibold"
                variant="cta"
                aria-busy={pending}
              >
                {pending ? t('creatingAccount') : t('continue')}
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
                  className="h-9 rounded-lg border-border bg-background text-center font-mono text-2xl tracking-[0.4em] text-foreground"
                />
              </div>
              <Button
                type="submit"
                disabled={pending || otp.length !== 6}
                className="h-10 w-full rounded-lg font-semibold"
                variant="cta"
                aria-busy={pending}
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
                className="w-full rounded-lg"
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
  );
}
