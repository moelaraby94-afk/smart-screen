import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { RedisService } from '../../common/redis/redis.service';

type RateLimit = {
  ttl: number;
  limit: number;
};

const EVENT_LIMITS: Record<string, RateLimit> = {
  'screen:heartbeat': { ttl: 10_000, limit: 1 },
  'screen:register': { ttl: 60_000, limit: 1 },
  'content:sync': { ttl: 30_000, limit: 1 },
  ping: { ttl: 5_000, limit: 1 },
};

const DEFAULT_LIMIT: RateLimit = { ttl: 5_000, limit: 5 };

@Injectable()
export class WsThrottlerGuard implements CanActivate {
  private readonly log = new Logger(WsThrottlerGuard.name);

  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const event = context.getHandler().name;
    const wsEvent = this.mapHandlerToEvent(event);
    if (!wsEvent) return true;

    const limit = EVENT_LIMITS[wsEvent] ?? DEFAULT_LIMIT;
    const client = context.switchToWs().getClient<{ id: string }>();

    if (!client?.id) return true;

    const redis = this.redisService.getClient();
    if (!redis) return true;

    const key = `ws:throttle:${client.id}:${wsEvent}`;
    const now = Date.now();
    const windowStart = now - limit.ttl;

    try {
      const count = await redis.zcount(key, windowStart, now);
      if (count >= limit.limit) {
        this.log.warn(
          `WS rate limit exceeded: ${wsEvent} from socket ${client.id}`,
        );
        return false;
      }
      await redis.zadd(key, now, `${now}`);
      await redis.pexpire(key, limit.ttl);
      return true;
    } catch {
      return true;
    }
  }

  private mapHandlerToEvent(handlerName: string): string | null {
    const map: Record<string, string> = {
      handleScreenRegister: 'screen:register',
      handleScreenHeartbeat: 'screen:heartbeat',
      handlePing: 'ping',
      handlePlayerBindScreen: 'content:sync',
    };
    return map[handlerName] ?? null;
  }
}
