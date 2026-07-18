import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

type QueuedEvent = {
  event: string;
  payload: unknown;
  timestamp: number;
};

const MAX_EVENTS = 100;
const TTL_SECONDS = 86_400;

@Injectable()
export class OfflineEventQueueService {
  private readonly log = new Logger(OfflineEventQueueService.name);

  constructor(private readonly redisService: RedisService) {}

  async enqueue(
    screenId: string,
    event: string,
    payload: unknown,
  ): Promise<void> {
    const redis = this.redisService.getClient();
    if (!redis) return;

    const key = `offline:${screenId}`;
    const data = JSON.stringify({
      event,
      payload,
      timestamp: Date.now(),
    } as QueuedEvent);

    try {
      await redis.lpush(key, data);
      await redis.ltrim(key, 0, MAX_EVENTS - 1);
      await redis.expire(key, TTL_SECONDS);
    } catch (err) {
      this.log.error(
        `Failed to enqueue offline event for screen ${screenId}: ${err}`,
      );
    }
  }

  async drain(screenId: string): Promise<QueuedEvent[]> {
    const redis = this.redisService.getClient();
    if (!redis) return [];

    const key = `offline:${screenId}`;
    try {
      const items = await redis.rpop(key, MAX_EVENTS);
      if (!items || items.length === 0) return [];
      return items.map((item) => JSON.parse(item) as QueuedEvent);
    } catch (err) {
      this.log.error(
        `Failed to drain offline events for screen ${screenId}: ${err}`,
      );
      return [];
    }
  }
}
