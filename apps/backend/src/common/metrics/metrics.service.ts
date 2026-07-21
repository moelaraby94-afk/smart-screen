import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  Registry,
  collectDefaultMetrics,
  Gauge,
  Counter,
  Histogram,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly logger = new Logger(MetricsService.name);
  readonly registry: Registry;

  readonly httpRequestDuration: Histogram<string>;
  readonly httpRequestTotal: Counter<string>;
  readonly httpErrorsTotal: Counter<string>;
  readonly activeSockets: Gauge<string>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({
      register: this.registry,
      prefix: 'smartscreen_',
    });

    this.httpRequestDuration = new Histogram({
      name: 'smartscreen_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'] as const,
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.httpRequestTotal = new Counter({
      name: 'smartscreen_http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: 'smartscreen_http_errors_total',
      help: 'Total HTTP errors (status >= 400)',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.activeSockets = new Gauge({
      name: 'smartscreen_active_sockets',
      help: 'Active Socket.IO connections on the /realtime namespace',
      registers: [this.registry],
    });
  }

  onModuleInit(): void {
    this.logger.log('Prometheus metrics registry initialized');
  }

  observeHttpRequest(
    method: string,
    route: string,
    status: number,
    durationSeconds: number,
  ): void {
    const labels = { method, route, status: String(status) };
    this.httpRequestTotal.inc(labels);
    this.httpRequestDuration.observe(labels, durationSeconds);
    if (status >= 400) {
      this.httpErrorsTotal.inc(labels);
    }
  }

  setActiveSockets(count: number): void {
    this.activeSockets.set(count);
  }

  metrics(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
