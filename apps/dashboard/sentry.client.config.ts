import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from './src/common/observability/scrub-pii';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE?.trim() || undefined,
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}
