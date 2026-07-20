import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { JwtUser } from '../auth/current-user.decorator';

/**
 * Restricts platform admin access to a configured IP allowlist.
 *
 * When `ADMIN_ALLOWED_IPS` is set (comma-separated), any request from a
 * platform-audience user whose IP is not in the list is rejected with 403.
 * When unset, the guard is a no-op (all IPs allowed).
 *
 * The guard only applies to requests authenticated as `aud: 'platform'`.
 * Customer-audience requests are never blocked by this guard.
 */
@Injectable()
export class AdminIpGuard implements CanActivate {
  private readonly logger = new Logger(AdminIpGuard.name);
  private readonly allowedIps: Set<string>;

  constructor(private readonly configService: ConfigService) {
    const raw = this.configService.get<string>('ADMIN_ALLOWED_IPS');
    this.allowedIps = raw
      ? new Set(
          raw
            .split(',')
            .map((ip) => ip.trim())
            .filter(Boolean),
        )
      : new Set();
  }

  canActivate(context: ExecutionContext): boolean {
    if (this.allowedIps.size === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: JwtUser }>();
    const user = request.user;
    if (!user || user.aud !== 'platform') return true;

    const ip = request.ip;
    if (!ip) {
      this.logger.warn(
        'Admin IP allowlist is configured but request IP could not be determined.',
      );
      throw new ForbiddenException('IP allowment check failed');
    }

    if (!this.allowedIps.has(ip)) {
      this.logger.warn(
        `Admin access denied from ${ip} — not in ADMIN_ALLOWED_IPS allowlist.`,
      );
      throw new ForbiddenException(
        'Your IP address is not allowed to access admin resources',
      );
    }

    return true;
  }
}
