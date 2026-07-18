import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma ORM 7+ requires a driver adapter; `datasources.db.url` in `super()` is no longer supported.
 * The connection string is passed the same way as before — via `DATABASE_URL` — through `@prisma/adapter-pg`.
 *
 * Connection pool tuning:
 * - DATABASE_POOL_MAX: max connections in the pool (default 10, increase for high concurrency)
 * - DATABASE_POOL_TIMEOUT_MS: connection acquisition timeout (default 30s)
 *
 * Official source: Prisma docs — https://www.prisma.io/docs/orm/overview/databases/postgresql
 * "The default connection pool size is 10 (determined by the underlying driver)."
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set or empty; PrismaClient cannot connect.',
      );
    }

    const poolMax = Number(process.env.DATABASE_POOL_MAX ?? '10');
    const poolTimeoutMs = Number(
      process.env.DATABASE_POOL_TIMEOUT_MS ?? '30000',
    );

    super({
      adapter: new PrismaPg({
        connectionString: databaseUrl,
        max: poolMax,
        connectionTimeoutMillis: poolTimeoutMs,
      }),
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      console.log('Prisma: connected to database.');
    } catch (err) {
      console.error(
        'Prisma: $connect failed (HTTP server still starts; retry on first query):',
        err,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
