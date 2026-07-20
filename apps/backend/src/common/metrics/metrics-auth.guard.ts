import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class MetricsAuthGuard implements CanActivate {
  private readonly logger = new Logger(MetricsAuthGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.configService.get<string>('METRICS_AUTH_TOKEN');

    if (!token) {
      if (this.isPrivateIp(req.ip)) {
        return true;
      }
      this.logger.warn(
        `Metrics access denied from ${req.ip} — METRICS_AUTH_TOKEN not set and request is not from a private IP.`,
      );
      throw new ForbiddenException('Metrics endpoint requires authentication');
    }

    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('Metrics endpoint requires Bearer token');
    }

    const provided = authHeader.slice(7);
    if (provided !== token) {
      throw new ForbiddenException('Invalid metrics auth token');
    }

    return true;
  }

  private isPrivateIp(ip: string | undefined): boolean {
    if (!ip) return false;
    if (ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
      return true;
    }
    return false;
  }
}
