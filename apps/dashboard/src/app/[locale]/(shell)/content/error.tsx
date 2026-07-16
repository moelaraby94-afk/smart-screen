'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useTranslations } from 'next-intl';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { devError } from '@/lib/dev-log';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ContentRouteError({ error, reset }: Props) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    devError('[content route error]', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" strokeWidth={1.5} />
      </div>
      <div className="space-y-1.5">
        <p className="text-lg font-semibold text-foreground">{t('shellTitle')}</p>
        {process.env.NODE_ENV === 'development' ? (
          <p className="max-w-lg text-sm text-muted-foreground">{error.message}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t('pleaseTryAgain')}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
      >
        <RefreshCw className="h-4 w-4" strokeWidth={1.8} />
        {t('retry')}
      </button>
    </div>
  );
}
