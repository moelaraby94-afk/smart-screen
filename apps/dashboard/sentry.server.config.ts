import * as Sentry from '@sentry/nextjs';

const dsn =
  process.env.SENTRY_DSN?.trim() ||
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

const PII_FIELDS = new Set([
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

function scrubPII(data: unknown, depth = 0): unknown {
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

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    beforeSend(event) {
      if (event.request) {
        event.request.headers = scrubPII(event.request.headers) as Record<string, string>;
        event.request.cookies = undefined;
        event.request.data = scrubPII(event.request.data);
      }
      if (event.extra) {
        event.extra = scrubPII(event.extra) as Record<string, unknown>;
      }
      if (event.user) {
        if (event.user.email) event.user.email = '[Redacted]';
        if (event.user.ip_address) event.user.ip_address = '[Redacted]';
      }
      return event;
    },
  });
}
