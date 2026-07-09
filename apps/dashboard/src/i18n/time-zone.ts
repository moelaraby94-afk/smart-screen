/**
 * Server and client must format dates in the same zone, or every rendered
 * timestamp differs between the SSR pass and hydration and React throws away
 * the tree ("Hydration failed because the server rendered HTML didn't match").
 *
 * next-intl reads this on the server via `getRequestConfig`, but a
 * `NextIntlClientProvider` that is not given a `timeZone` silently falls back to
 * the *browser's* zone — which is how the two drifted apart. Both sides import
 * this constant so they cannot disagree.
 */
export const DEFAULT_TIME_ZONE = 'UTC';
