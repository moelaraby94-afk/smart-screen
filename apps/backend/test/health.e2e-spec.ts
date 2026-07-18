import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HealthController } from '../src/common/health/health.controller';
import { HealthCheckService } from '@nestjs/terminus';
import { HealthService } from '../src/common/health/health.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Health check (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn((fns: (() => unknown)[]) =>
              Promise.all(fns.map((fn) => fn())),
            ),
          },
        },
        {
          provide: HealthService,
          useValue: {
            checkDatabase: jest.fn().mockResolvedValue({ status: 'ok' }),
            checkRedis: jest.fn().mockResolvedValue({ status: 'ok' }),
            checkStorage: jest.fn().mockResolvedValue({ status: 'ok' }),
          },
        },
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with status ok', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
