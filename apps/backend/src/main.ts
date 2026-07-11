import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'express';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppLogger } from './common/request-context/app-logger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { assertProductionSecretsAreSet } from './common/config/assert-production-secrets';

async function bootstrap() {
  if (process.env.DATABASE_URL?.trim()) {
    console.log('Database connection attempt...');
  } else {
    console.warn(
      'DATABASE_URL is not set; Prisma/database features will fail.',
    );
  }

  const isProduction = process.env.NODE_ENV === 'production';

  /**
   * Production CORS must be an explicit allow-list, never origin-reflection.
   * Fail fast at boot rather than silently falling back to an open policy.
   */
  const productionAllowedOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (isProduction && !productionAllowedOrigins?.length) {
    throw new Error(
      'ALLOWED_ORIGINS is required when NODE_ENV=production: a comma-separated ' +
        'list of allowed browser origins, e.g. ' +
        '"https://app.example.com,https://admin.example.com". Refusing to start ' +
        'with an undefined CORS policy.',
    );
  }

  assertProductionSecretsAreSet(process.env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: new AppLogger(),
  });

  /**
   * Behind a reverse proxy, `req.ip` is the proxy's address unless Express is
   * told how many hops to trust. That would put every client into one
   * rate-limit bucket and write the proxy's address into the audit log.
   *
   * Configured as a hop count rather than `true`: trusting every hop lets a
   * client spoof `X-Forwarded-For` and forge both its rate-limit identity and
   * its audit-log IP. Set it to the number of proxies actually in front of the
   * API (usually 1). Default 0 = direct exposure, no header trusted.
   */
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? '0');
  if (Number.isInteger(trustProxyHops) && trustProxyHops > 0) {
    app.set('trust proxy', trustProxyHops);
  }

  /**
   * contentSecurityPolicy/crossOriginEmbedderPolicy off: this is a pure
   * JSON + media-file API, not an HTML document — CSP belongs on the
   * dashboard's own responses (see apps/dashboard/next.config.ts), and COEP
   * would fight the deliberate cross-origin media serving below.
   * crossOriginResourcePolicy off: /media-files/* already sets its own
   * Cross-Origin-Resource-Policy: cross-origin explicitly (see useStaticAssets
   * below) so every consumer (dashboard, player) can load media cross-origin.
   */
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );

  const http = app.getHttpAdapter().getInstance();
  http.use(
    '/api/v1/webhooks/stripe',
    express.raw({ type: 'application/json' }),
  );
  http.use(express.json({ limit: '50mb' }));
  http.use(express.urlencoded({ extended: true, limit: '50mb' }));
  /**
   * media.service.ts stages every upload as `<final-name>.part` in the
   * destination directory before renaming it into place, so a partially written
   * file briefly exists inside this served tree. Never serve one: it is, by
   * definition, incomplete and not yet committed to the database.
   */
  http.use(
    '/media-files',
    (req: express.Request, res: express.Response, next) => {
      if (req.path.endsWith('.part')) {
        res.status(404).end();
        return;
      }
      next();
    },
  );
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/media-files/',
    setHeaders: (res: Response) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'ready'],
  });

  let corsOrigin:
    | boolean
    | string[]
    | ((
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => void);
  if (isProduction) {
    /** Exact allow-list only — no reflection, no dev fallback origins. */
    const allowed = productionAllowedOrigins!;
    corsOrigin = (origin, callback) => {
      // No Origin header (server-to-server, curl, same-origin) — not a browser CORS request.
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin "${origin}" is not allowed by CORS.`));
      }
    };
  } else {
    const fromList =
      process.env.FRONTEND_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
    const single = process.env.FRONTEND_ORIGIN?.trim();
    /** Local dev: `localhost` and `127.0.0.1` are different Origins — allow both so fetch + cookies work. */
    const defaultDevOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    const allowedOrigins = [
      ...new Set([
        ...fromList,
        ...(single ? [single] : []),
        ...defaultDevOrigins,
      ]),
    ].filter(Boolean);
    /** When true, reflect the request `Origin` (dev convenience only — never used in production, see above). */
    const trustDynamicCors =
      process.env.TRUST_DYNAMIC_CORS === 'true' ||
      process.env.TRUST_DYNAMIC_CORS === '1';
    corsOrigin = trustDynamicCors ? true : allowedOrigins;
  }

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'Accept',
      'Accept-Language',
      'X-Pairing-Poll-Secret',
      'X-Player-Secret',
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
void bootstrap();
