/**
 * Fields whose values are stripped from Sentry events to prevent
 * leaking PII (emails, passwords, tokens) to the error tracker.
 */
export const PII_FIELDS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'csrfToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'email',
  'phone',
]);

/**
 * Recursively walks an object and replaces values of PII keys with
 * `[Redacted]`. Operates on a shallow clone to avoid mutating the
 * original error/context.
 */
export function scrubPII(data: unknown, depth = 0): unknown {
  if (depth > 5) return data;
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map((item) => scrubPII(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.has(lowerKey)) {
      result[key] = '[Redacted]';
    } else {
      result[key] = scrubPII(value, depth + 1);
    }
  }
  return result;
}
