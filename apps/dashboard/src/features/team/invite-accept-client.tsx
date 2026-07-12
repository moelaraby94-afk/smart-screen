'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Loader2, MailOpen } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { acceptInvite as apiAcceptInvite } from '@/features/team/team-api';

type AcceptState = 'idle' | 'loading' | 'success' | 'error' | 'login-required';

type AcceptResult = {
  ok?: boolean;
  alreadyMember?: boolean;
  workspaceId?: string;
  workspaceName?: string;
  role?: string;
  message?: string;
};

export function InviteAcceptClient() {
  const t = useTranslations('inviteAccept');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<AcceptState>('idle');
  const [result, setResult] = useState<AcceptResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMsg(t('noToken'));
      return;
    }
    setState('loading');
    apiAcceptInvite(token)
      .then(async (res) => {
        const data = (await res.json()) as AcceptResult & { message?: string };
        if (res.ok) {
          setResult(data);
          setState('success');
        } else if (res.status === 401) {
          setState('login-required');
          const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.assign(`/${locale}/login?returnTo=${returnTo}`);
        } else {
          setState('error');
          setErrorMsg(data.message ?? t('errorGeneric'));
        }
      })
      .catch(() => {
        setState('error');
        setErrorMsg(t('errorGeneric'));
      });
  }, [token, t, locale]);

  if (state === 'loading' || state === 'idle') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </div>
    );
  }

  if (state === 'login-required') {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('redirecting')}</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 py-16"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/20">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold tracking-tight">{t('errorTitle')}</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">{errorMsg}</p>
        </div>
        <Link href={`/${locale}/login`}>
          <Button variant="outline" className="rounded-xl">
            {t('backToLogin')}
          </Button>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 py-16"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold tracking-tight">{t('successTitle')}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {result?.message ?? t('successBody', { workspace: result?.workspaceName ?? '' })}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/overview`}>
          <Button variant="cta" className="rounded-xl">
            <MailOpen className="me-2 h-4 w-4" />
            {t('goToDashboard')}
          </Button>
        </Link>
        <Link href={`/${locale}/team`}>
          <Button variant="outline" className="rounded-xl">
            {t('goToTeam')}
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
