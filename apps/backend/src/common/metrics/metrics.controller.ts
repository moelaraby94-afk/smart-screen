import { Controller, Get, Header, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsAuthGuard } from './metrics-auth.guard';
import { INTERNAL_ROUTES } from '../constants/route-prefixes';

@Controller({ path: [...INTERNAL_ROUTES.METRICS] })
@UseGuards(MetricsAuthGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async metrics(): Promise<string> {
    return this.metricsService.metrics();
  }
}
