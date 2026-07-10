'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { UNKNOWN_ERROR_CODE, type ApiError } from './api-error';

/**
 * Turns an {@link ApiError} into a message in the user's language.
 *
 * The API's own `message` is never rendered — it is English prose written for
 * server logs. Everything the user reads comes from the `errors` namespace,
 * keyed by the backend's stable `code`, with `details` interpolated (e.g.
 * `SCREEN_LIMIT_REACHED` reads `{limit}`).
 *
 * A code with no entry — an older client against a newer API — falls back to a
 * generic message rather than showing the user a raw identifier.
 */
export function useApiErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (error: ApiError): string => {
      const key = t.has(error.code) ? error.code : UNKNOWN_ERROR_CODE;

      try {
        return t(key, error.details as Record<string, string | number>);
      } catch {
        /**
         * The message expected an ICU value that `details` did not carry.
         * Never surface a half-formatted string; say something true instead.
         */
        return t(UNKNOWN_ERROR_CODE);
      }
    },
    [t],
  );
}
