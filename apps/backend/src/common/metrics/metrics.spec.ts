import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { MetricsAuthGuard } from './metrics-auth.guard';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should expose a registry with default metrics', async () => {
    const output = await service.metrics();
    expect(output).toContain('smartscreen_');
    expect(output).toContain('process_');
  });

  it('should record HTTP request metrics', async () => {
    service.observeHttpRequest('GET', '/api/v1/screens', 200, 0.05);
    const output = await service.metrics();
    expect(output).toContain('smartscreen_http_requests_total');
    expect(output).toContain('smartscreen_http_request_duration_seconds');
    expect(output).toContain('method="GET"');
    expect(output).toContain('route="/api/v1/screens"');
    expect(output).toContain('status="200"');
  });

  it('should increment error counter for status >= 400', async () => {
    service.observeHttpRequest('POST', '/api/v1/auth/login', 500, 0.1);
    const output = await service.metrics();
    expect(output).toContain('smartscreen_http_errors_total');
    expect(output).toContain('status="500"');
  });

  it('should not increment error counter for status < 400', async () => {
    service.observeHttpRequest('GET', '/api/v1/health', 200, 0.01);
    const output = await service.metrics();
    const errorLines = output
      .split('\n')
      .filter(
        (l) =>
          l.startsWith('smartscreen_http_errors_total') && !l.startsWith('#'),
      );
    // Only the HELP/TYPE lines should exist, no data lines for 200
    expect(errorLines.length).toBe(0);
  });

  it('should set active socket gauge', async () => {
    service.setActiveSockets(42);
    const output = await service.metrics();
    expect(output).toContain('smartscreen_active_sockets');
    expect(output).toContain('42');
  });

  it('should return correct content type', () => {
    expect(service.contentType()).toContain('text/plain');
  });
});

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        MetricsService,
        MetricsAuthGuard,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'METRICS_AUTH_TOKEN') return undefined;
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  it('should return metrics output', async () => {
    const result = await controller.metrics();
    expect(result).toContain('smartscreen_');
  });

  it('should return metrics from the service', async () => {
    service.setActiveSockets(7);
    const result = await controller.metrics();
    expect(result).toContain('smartscreen_active_sockets');
  });
});
