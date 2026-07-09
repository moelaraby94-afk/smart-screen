import path from 'path';
import { config } from 'dotenv';
import { withSentryConfig } from '@sentry/nextjs';
import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

config({ path: path.resolve(process.cwd(), '../../.env') });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  serverExternalPackages: ['konva', 'react-konva'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          /**
           * Deliberately narrow: no script-src/style-src here. Next.js's
           * hydration relies on inline scripts, and restricting those
           * properly needs a nonce-based middleware setup (a separate,
           * riskier change) — not something to guess at without testing
           * every route. object-src/frame-ancestors/base-uri are safe,
           * real wins with zero chance of breaking existing pages.
           */
          {
            key: 'Content-Security-Policy',
            value: "object-src 'none'; frame-ancestors 'self'; base-uri 'self';",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');
const withIntl = withNextIntl(nextConfig);

const sentryDsn =
  process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() ||
  process.env.SENTRY_DSN?.trim();

export default sentryDsn
  ? withSentryConfig(withIntl, { silent: true })
  : withIntl;
