'use client';

import { useState } from 'react';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  apiFetch,
  setStoredAccessToken,
} from './session';
import { readApiError } from '@/features/api/api-error';
import { useApiErrorMessage } from '@/features/api/use-api-error-message';
import { useWorkspace } from '@/features/workspace/workspace-context';

type LoginFormProps = {
  /** Kept for API compatibility — no longer used. */
  variant?: 'default' | 'dark';
  /** Kept for API compatibility — no longer used. */
  layout?: 'card' | 'split';
};

type AuthSuccessPayload = {
  user?: { isSuperAdmin?: boolean };
  workspaces?: Array<{ id: string; name: string; role: string }>;
  accessToken?: string;
};

const showDevTools =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

const nimbusInput =
  'h-11 rounded-xl border border-border bg-card text-[15px] text-foreground placeholder:text-muted-foreground/50 focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20';

export function LoginForm({
  variant = 'default',
  layout = 'card',
}: LoginFormProps) {
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

  const applyAuthSuccess = async (payload: AuthSuccessPayload) => {
    if (payload.accessToken) {
      setStoredAccessToken(payload.accessToken);
    }
    const workspaceId = payload.workspaces?.[0]?.id;
    if (workspaceId) {
      setWorkspaceId(workspaceId);
    }
    await refreshWorkspaces(workspaceId ?? null);
    toast.success(t('signedIn'));
    const returnTo = searchParams.get('returnTo');
    const isSuper = Boolean(payload.user?.isSuperAdmin);
    let dest: string;
    if (returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      dest = returnTo;
    } else if (isSuper) {
      dest = `/${activeLocale}/overview`;
    } else if (workspaceId) {
      dest = `/${activeLocale}/overview`;
    } else {
      dest = `/${activeLocale}`;
    }
    router.push(dest as Route);
    router.refresh();
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      setStoredAccessToken(null);
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        omitAuth: true,
      });
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
      const response = await apiFetch('/auth/dev-login', {
        method: 'POST',
        omitAuth: true,
      });
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

  const dark = false;
  const split = false;

  return (
    <div className="space-y-6">
      <form className="space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <label
            className="text-[13px] font-medium text-foreground"
            htmlFor="email"
          >
            {t('email')}
          </label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            placeholder={t('emailPlaceholder')}
            className={nimbusInput}
          />
        </div>
        <div className="space-y-2">
          <label
            className="text-[13px] font-medium text-foreground"
            htmlFor="password"
          >
            {t('password')}
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className={nimbusInput}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
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
          className="h-11 w-full rounded-xl font-semibold"
          type="submit"
          variant="cta"
          disabled={pending}
        >
          {pending ? t('signingIn') : t('signIn')}
        </Button>
      </form>

      {showDevTools ? (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] p-4">
          <p className="text-xs font-medium text-primary">
            {t('debugDevOnly')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full rounded-xl"
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
