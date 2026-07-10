'use client';

import { useCallback } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocaleAwareFallbackString } from '@/i18n/fallback';
import { DEFAULT_TIME_ZONE } from '@/i18n/time-zone';
import { devError } from '@/lib/dev-log';

type Props = {
  children: React.ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

type MessageFallbackArgs = {
  namespace?: string;
  key: string;
};

/**
 * Prevent runtime crashes from missing translation keys on the client.
 * Falls back to English dictionary or `[namespace.key]`.
 */
export function IntlErrorHandlingProvider({ children, locale, messages }: Props) {
  /**
   * `useTranslations()` memoizes its translator over the intl context, and the
   * context is derived from these two props. Passing fresh arrow functions on
   * every render would give every `t` a new identity each render, so any effect
   * that (correctly) lists `t` as a dependency would re-run on every parent
   * render. Both callbacks depend only on `locale`.
   */
  const onError = useCallback((error: unknown) => {
    devError('[i18n]', error);
  }, []);

  const getMessageFallback = useCallback(
    ({ namespace, key }: MessageFallbackArgs) =>
      getLocaleAwareFallbackString(locale, namespace, key),
    [locale],
  );

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      // Must match getRequestConfig's timeZone, or SSR and hydration disagree.
      timeZone={DEFAULT_TIME_ZONE}
      onError={onError}
      getMessageFallback={getMessageFallback}
    >
      {children}
    </NextIntlClientProvider>
  );
}
