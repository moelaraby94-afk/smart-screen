import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { RedisService } from './redis.service';

/**
 * Redis-backed throttler storage for @nestjs/throttler.
 *
 * Replaces the default in-memory storage so rate limits are shared
 * across multiple backend instances.
 *
 * Official source: NestJS Rate Limiting —
 * https://docs.nestjs.com/security/rate-limiting
 * "For distributed systems, a custom storage can be used to share
 * the rate limit state across instances."
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly prefix = 'throttler:';

  constructor(private readonly redisService: RedisService) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<{
    totalHits: number;
    timeToExpire: number;
    isBlocked: boolean;
    timeToBlockExpire: number;
  }> {
    const client = this.redisService.getClient();
    if (!client) {
      return {
        totalHits: 1,
        timeToExpire: ttl,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    const redisKey = `${this.prefix}${throttlerName}:${key}`;
    const blockKey = `${redisKey}:block`;

    const now = Date.now();

    const isBlocked = await client.exists(blockKey);
    if (isBlocked) {
      const blockTtl = await client.pttl(blockKey);
      return {
        totalHits: limit,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtl > 0 ? blockTtl : 0,
      };
    }

    const totalHits = await client.incr(redisKey);
    if (totalHits === 1) {
      await client.pexpire(redisKey, ttl);
    }

    const timeToExpire = await client.pttl(redisKey);

    if (totalHits > limit) {
      const blockTtl = blockDuration || timeToExpire;
      await client.psetex(blockKey, blockTtl, String(now));
      return {
        totalHits,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: blockTtl,
      };
    }

    return {
      totalHits,
      timeToExpire: timeToExpire > 0 ? timeToExpire : ttl,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }
}
