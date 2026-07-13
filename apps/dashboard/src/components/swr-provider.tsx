'use client';

import { SWRConfig } from 'swr';

/**
 * Global SWR configuration.
 *
 * The fetcher is a thin wrapper around `apiFetch` that:
 *  - calls `response.json()` to return parsed data (not a Response)
 *  - throws on non-2xx so SWR's error path fires
 *
 * Revalidation defaults are conservative:
 *  - revalidateOnFocus: false (avoid hammering the API on every tab switch)
 *  - shouldRetryOnError: false (apiFetch already handles 401 retry + redirect)
 *
 * Per-hook overrides are still possible via useSWR options.
 */
export function SwrProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}
