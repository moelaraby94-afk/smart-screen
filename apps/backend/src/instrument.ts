import * as Sentry from '@sentry/nestjs';
import { scrubPII } from './common/observability/scrub-pii';

const dsn = process.env.SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0') || 0,
    release: process.env.SENTRY_RELEASE?.trim() || undefined,
    beforeSend(event) {
      if (event.request) {
        event.request.headers = scrubPII(event.request.headers) as Record<
          string,
          string
        >;
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
