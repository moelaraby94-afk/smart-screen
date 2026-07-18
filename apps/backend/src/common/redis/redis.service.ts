import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Production-ready Redis service wrapping `ioredis`.
 *
 * Features:
 * - Lazy connection: connects on first use, not on module init
 * - Retry strategy: exponential backoff with cap
 * - Health check: `ping()` for readiness probes
 * - Graceful shutdown: `quit()` closes connection cleanly
 * - Optional: if REDIS_URL is not set, service operates in "disabled" mode
 *   (all methods no-op or throw), allowing the app to run without Redis in dev
 *
 * Official sources:
 * - Redis: https://redis.io/docs/latest/develop/connect/clients/nodejs/
 * - ioredis: https://github.com/redis/ioredis (recommended by Redis docs)
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly log = new Logger(RedisService.name);
  private readonly client: Redis | null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('REDIS_URL');
    this.enabled = Boolean(url);

    if (!url) {
      this.log.warn(
        'REDIS_URL is not set — Redis features disabled (in-memory fallback).',
      );
      this.client = null;
      return;
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 10) {
          this.log.error(`Redis: giving up after ${times} retries.`);
          return null;
        }
        const delay = Math.min(times * 200, 2000);
        this.log.warn(
          `Redis: retrying connection in ${delay}ms (attempt ${times}).`,
        );
        return delay;
      },
      enableReadyCheck: true,
    });

    this.client.on('error', (err: Error) => {
      this.log.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.log.log('Redis: connected.');
    });

    this.client.on('close', () => {
      this.log.warn('Redis: connection closed.');
    });
  }

  /** Returns true when Redis is configured and connected. */
  get isConnected(): boolean {
    return this.client?.status === 'ready';
  }

  /** Returns true when REDIS_URL is set (regardless of connection state). */
  get isConfigured(): boolean {
    return this.enabled;
  }

  /** Returns the raw ioredis client (null if not configured). */
  getClient(): Redis | null {
    return this.client;
  }

  /** Pings Redis — used by health checks. Returns false if not configured. */
  async ping(): Promise<boolean> {
    if (!this.client) return false;
    try {
      const res = await this.client.ping();
      return res === 'PONG';
    } catch {
      return false;
    }
  }

  /** Gracefully closes the Redis connection. */
  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => {
        /* best effort */
      });
      this.log.log('Redis: disconnected.');
    }
  }
}
