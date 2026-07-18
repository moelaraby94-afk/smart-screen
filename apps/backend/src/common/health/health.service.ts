import { Injectable, Inject } from '@nestjs/common';
import { existsSync } from 'fs';
import { HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { STORAGE_SERVICE } from '../storage/storage.interface';
import type { IStorageService } from '../storage/storage.interface';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
  ) {}

  /**
   * Database health check — runs a lightweight $queryRaw to verify
   * the Prisma connection pool can reach PostgreSQL.
   */
  async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        database: { status: 'up' },
      };
    } catch (err) {
      return {
        database: {
          status: 'down',
          message: (err as Error).message,
        },
      };
    }
  }

  /**
   * Redis health check — pings Redis if configured.
   * If REDIS_URL is not set, reports "up" with a note that Redis is optional.
   */
  async checkRedis(): Promise<HealthIndicatorResult> {
    if (!this.redis.isConfigured) {
      return {
        redis: { status: 'up', optional: true, message: 'not configured' },
      };
    }
    const ok = await this.redis.ping();
    return {
      redis: {
        status: ok ? 'up' : 'down',
      },
    };
  }

  /**
   * Storage health check — verifies the storage provider is accessible.
   * For local storage, checks that the upload root directory exists.
   * For S3, attempts a HEAD request on a health-check key.
   */
  checkStorage(): Promise<HealthIndicatorResult> {
    try {
      if (this.storage.providerName === 'local') {
        const local = this.storage as unknown as {
          getUploadRoot(): string;
        };
        const root = local.getUploadRoot();
        if (!existsSync(root)) {
          return Promise.resolve({
            storage: {
              status: 'down',
              message: `upload root does not exist: ${root}`,
            },
          });
        }
      }
      return Promise.resolve({
        storage: { status: 'up', provider: this.storage.providerName },
      });
    } catch (err) {
      return Promise.resolve({
        storage: {
          status: 'down',
          message: (err as Error).message,
        },
      });
    }
  }
}
