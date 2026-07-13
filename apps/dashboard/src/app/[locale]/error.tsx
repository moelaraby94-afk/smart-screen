'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { devError } from '@/lib/dev-log';

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Locale segment error boundary — avoids blank Internal Server Error with no recovery.
 */
export default function LocaleError({ error, reset }: Props) {
  const t = useTranslations('errorPage');

  useEffect(() => {
    devError('[locale route error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-lg font-semibold text-foreground">{t('title')}</p>
      {process.env.NODE_ENV === 'development' ? (
        <p className="max-w-lg text-sm text-muted-foreground">{error.message}</p>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        {t('tryAgain')}
      </button>
    </div>
  );
}
