'use client';

import { useRef, useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  setStoredAccessToken,
} from './session';
import { login as apiLogin, login2fa as apiLogin2fa, devLogin as apiDevLogin } from './auth-api';
import { readApiError } from '@/features/api/api-error';
import { useApiErrorMessage } from '@/features/api/use-api-error-message';
import { useWorkspace } from '@/features/workspace/workspace-context';

type AuthSuccessPayload = {
  workspaces?: Array<{ id: string; name: string; role: string }>;
  accessToken?: string;
};

const showDevTools =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';


export function LoginForm() {
  const t = useTranslations('authForm');
  const errorMessage = useApiErrorMessage();
  const activeLocale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setWorkspaceId, refreshWorkspaces } = useWorkspace();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const applyAuthSuccess = async (payload: AuthSuccessPayload) => {
    if (payload.accessToken) {
      setStoredAccessToken(payload.accessToken);
    }
    const workspaceId = payload.workspaces?.[0]?.id;
    if (workspaceId) {
      setWorkspaceId(workspaceId);
    }
    await refreshWorkspaces(workspaceId ?? null);
    const returnTo = searchParams.get('returnTo');
    let dest: string;
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      dest = returnTo;
    } else if (workspaceId) {
      dest = `/${activeLocale}/overview`;
    } else {
      dest = `/${activeLocale}`;
    }
    router.replace(dest as Route);
    router.refresh();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      setStoredAccessToken(null);
      const response = await apiLogin(email, password);
      if (!response.ok) {
        setError(errorMessage(await readApiError(response)));
        setPending(false);
        return;
      }

      const payload = (await response.json()) as AuthSuccessPayload & {
        requiresTwoFactor?: boolean;
      };
      if (payload.requiresTwoFactor) {
        setNeedsTwoFactor(true);
        setPending(false);
        return;
      }
      await applyAuthSuccess(payload);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('loginFailed');
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const onTwoFactorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await apiLogin2fa(email, password, twoFactorToken.trim());
      if (!response.ok) {
        throw new Error(errorMessage(await readApiError(response)));
      }
      const payload = (await response.json()) as AuthSuccessPayload;
      await applyAuthSuccess(payload);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('loginFailed');
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const onDevLogin = async () => {
    setPending(true);
    setError(null);
    try {
      setStoredAccessToken(null);
      const response = await apiDevLogin();
      if (!response.ok) {
        throw new Error(errorMessage(await readApiError(response)));
      }
      const payload = (await response.json()) as AuthSuccessPayload;
      await applyAuthSuccess(payload);
    } catch (e) {
      const message = e instanceof Error ? e.message : t('devLoginFailed');
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-6">
      {needsTwoFactor ? (
        <form className="space-y-5" onSubmit={onTwoFactorSubmit}>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{t('twoFactorPrompt')}</p>
            <label
              className="text-[13px] font-medium text-foreground"
              htmlFor="twoFactorToken"
            >
              {t('twoFactorLabel')}
            </label>
            <Input
              id="twoFactorToken"
              type="text"
              value={twoFactorToken}
              onChange={(event) => setTwoFactorToken(event.target.value)}
              required
              maxLength={8}
              autoComplete="one-time-code"
              placeholder="000000"
              className="h-9 rounded-lg text-center font-mono text-lg tracking-widest"
            />
          </div>
          {error ? (
            <p role="alert" aria-live="assertive" className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button
            className="h-10 w-full rounded-lg font-semibold"
            type="submit"
            variant="cta"
            disabled={pending || twoFactorToken.trim().length < 6}
            aria-busy={pending}
          >
            {pending ? t('signingIn') : t('verify')}
          </Button>
          <button
            type="button"
            className="w-full text-center text-xs font-medium text-muted-foreground hover:text-foreground"
            onClick={() => {
              setNeedsTwoFactor(false);
              setTwoFactorToken('');
              setError(null);
            }}
          >
            {t('backToLogin')}
          </button>
        </form>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit} aria-label="Sign in form">
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="email"
          >
            {t('email')}
          </label>
          <Input
            ref={emailRef}
            id="email"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoFocus
            autoComplete="username"
            placeholder={t('emailPlaceholder')}
            className="h-9 rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="password"
          >
            {t('password')}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              className="h-9 rounded-lg pe-10"
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
        {error ? (
          <p role="alert" aria-live="assertive" className="text-sm text-destructive">{error}</p>
        ) : null}
        <div className="flex flex-wrap justify-between gap-2 text-xs">
          <Link
            href={`/${activeLocale}/forgot-password` as Route}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {t('forgotPassword')}
          </Link>
          <Link
            href={`/${activeLocale}/register` as Route}
            className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('createAccount')}
          </Link>
        </div>
        <Button
          className="h-10 w-full rounded-lg font-semibold"
          type="submit"
          variant="cta"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? t('signingIn') : t('signIn')}
        </Button>
      </form>
      )}

      {showDevTools && !needsTwoFactor ? (
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/[0.04] p-4">
          <p className="text-xs font-medium text-primary">
            {t('debugDevOnly')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full rounded-lg"
            disabled={pending}
            onClick={() => void onDevLogin()}
          >
            {t('forceLoginSeed')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
