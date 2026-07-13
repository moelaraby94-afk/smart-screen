import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationNs = Number(process.hrtime.bigint() - start);
      const durationSeconds = durationNs / 1e9;

      const route = this.normalizeRoute(req);
      const method = req.method;
      const status = res.statusCode;

      this.metricsService.observeHttpRequest(
        method,
        route,
        status,
        durationSeconds,
      );
    });

    next();
  }

  private normalizeRoute(req: Request): string {
    const baseUrl = req.baseUrl || '';
    const path = req.path || '';
    const full = baseUrl + path;

    if (full.startsWith('/api/v1/')) {
      const segments = full.split('/').filter(Boolean);
      if (segments.length <= 2) return full;

      const normalized = segments.map((seg, i) => {
        if (i < 2) return seg;
        if (
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            seg,
          )
        )
          return ':id';
        if (/^\d+$/.test(seg)) return ':id';
        return seg;
      });
      return '/' + normalized.join('/');
    }

    return full || '/';
  }
}
