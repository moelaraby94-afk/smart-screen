'use client';

import { useCallback } from 'react';
import { toast } from 'sonner';
import { readApiError, type ApiError } from './api-error';
import { useApiErrorMessage } from './use-api-error-message';

/**
 * The one place a failed request becomes something the user sees.
 *
 * Components hand over the `Response` (or an already-read {@link ApiError}) and
 * get nothing back — no message to inspect, no code to branch on. Anything that
 * genuinely needs to react to a specific failure reads `error.code`, never the
 * server's text.
 */
export function useApiErrorToast() {
  const messageFor = useApiErrorMessage();

  const toastApiError = useCallback(
    (error: ApiError): void => {
      toast.error(messageFor(error));
    },
    [messageFor],
  );

  /** Reads the envelope, shows the message, and returns the code for branching. */
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
