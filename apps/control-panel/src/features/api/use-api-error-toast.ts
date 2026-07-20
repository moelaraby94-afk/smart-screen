'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { readApiError, type ApiError } from './api-error';
import { useApiErrorMessage } from './use-api-error-message';

export function useApiErrorToast() {
  const messageFor = useApiErrorMessage();

  const toastApiError = useCallback(
    (error: ApiError): void => {
      toast.error(messageFor(error));
    },
    [messageFor],
  );

  const toastResponseError = useCallback(
    async (response: Response): Promise<ApiError> => {
      const error = await readApiError(response);
      toastApiError(error);
      return error;
    },
    [toastApiError],
  );

  return { toastApiError, toastResponseError };
}
