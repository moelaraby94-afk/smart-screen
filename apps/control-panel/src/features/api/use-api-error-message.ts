'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { UNKNOWN_ERROR_CODE, type ApiError } from './api-error';

export function useApiErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (error: ApiError): string => {
      const key = t.has(error.code) ? error.code : UNKNOWN_ERROR_CODE;

      try {
        return t(key, error.details as Record<string, string | number>);
      } catch {
        return t(UNKNOWN_ERROR_CODE);
      }
    },
    [t],
  );
}
