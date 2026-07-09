import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { JwtUser } from '../auth/current-user.decorator';

/**
 * Tracks the throttle bucket by authenticated user id (JWT `sub`) instead of
 * IP. Only meaningful behind JwtAuthGuard (must run first so `req.user` is
 * populated) — falls back to `req.ip` if somehow unauthenticated.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as JwtUser | undefined;
    const ip = req.ip as string;
    return Promise.resolve(user?.sub ?? ip);
  }
}
