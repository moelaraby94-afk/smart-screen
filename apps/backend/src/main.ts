import './instrument';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'express';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { AppLogger } from './common/request-context/app-logger';
import { createCorsOriginChecker } from './common/config/cors-config';
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
   * The actual logic lives in cors-config.ts (shared with the WS gateway).
   */
  if (
    isProduction &&
    !process.env.ALLOWED_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean).length
  ) {
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
   * Static file serving is only needed for local storage mode.
   * When MEDIA_STORAGE_PROVIDER=s3, media URLs point to the S3 bucket
   * and Express does not need to serve files from disk.
   *
   * media.service.ts stages every upload as `<final-name>.part` in the
   * destination directory before renaming it into place, so a partially written
   * file briefly exists inside this served tree. Never serve one: it is, by
   * definition, incomplete and not yet committed to the database.
   */
  const storageProvider = process.env.MEDIA_STORAGE_PROVIDER ?? 'local';
  if (storageProvider === 'local') {
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
  }
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'ready', 'metrics'],
  });

  app.enableCors({
    origin: createCorsOriginChecker(),
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

  /**
   * Graceful shutdown: enable NestJS lifecycle hooks (OnModuleDestroy,
   * beforeApplicationShutdown, onApplicationShutdown) so that SIGTERM/SIGINT
   * from Docker/K8s closes HTTP, DB, Redis, and WebSocket connections cleanly.
   *
   * In addition to enableShutdownHooks(), we install an explicit ordered
   * shutdown handler with a 25s force-exit timeout to guarantee the process
   * terminates even if a connection hangs.
   *
   * Order:
   *   1. Stop accepting new requests (app.close() triggers beforeApplicationShutdown)
   *   2. Close WebSocket connections (RealtimeGateway cleanup)
   *   3. Close Redis connections (RedisService.quit())
   *   4. Close Database connections (PrismaService.$disconnect())
   *   5. Exit process
   *
   * Official sources:
   * - NestJS: https://docs.nestjs.com/fundamentals/lifecycle
   * - Express.js: https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html
   * - Node.js: https://nodejs.org/api/process.html#event-sigterm
   */
  app.enableShutdownHooks();

  const shutdownLog = new Logger('GracefulShutdown');
  let shuttingDown = false;

  const gracefulShutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    shutdownLog.log(`Received ${signal} — starting ordered shutdown.`);

    const forceExit = setTimeout(() => {
      shutdownLog.error(
        'Force-exit timeout (25s) reached — exiting immediately.',
      );
      process.exit(1);
    }, 25_000);
    forceExit.unref();

    try {
      // 1. Stop accepting new requests and trigger NestJS lifecycle hooks
      await app.close();

      // 2-4. OnModuleDestroy hooks fire during app.close() in reverse DI order:
      //   - RealtimeGateway closes WS + Redis adapter pub/sub clients
      //   - RedisService.quit() closes Redis connection
      //   - PrismaService.$disconnect() closes DB connection

      shutdownLog.log('Ordered shutdown complete — exiting cleanly.');
      process.exit(0);
    } catch (err) {
      shutdownLog.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));

  await app.listen(process.env.PORT || 3000, '0.0.0.0');
}
void bootstrap();
