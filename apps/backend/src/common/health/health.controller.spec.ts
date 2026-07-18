import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import type { HealthCheckService } from '@nestjs/terminus';
import type { PrismaService } from '../prisma/prisma.service';
import type { RedisService } from '../redis/redis.service';
import type { IStorageService } from '../storage/storage.interface';

describe('HealthController', () => {
  function build() {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    } as unknown as PrismaService;
    const redis = {
      isConfigured: false,
      ping: jest.fn().mockResolvedValue(false),
    } as unknown as RedisService;
    const storage = {
      providerName: 'local',
      getUploadRoot: () => process.cwd(),
    } as unknown as IStorageService;
    const service = new HealthService(prisma, redis, storage);
    const healthCheck = {
      check: jest.fn(async (indicators: (() => Promise<unknown>)[]) => {
        const results = await Promise.all(indicators.map((fn) => fn()));
        const info: Record<string, unknown> = {};
        for (const r of results) {
          Object.assign(info, r);
        }
        const allUp = Object.values(info).every(
          (v) => (v as { status?: string }).status === 'up',
        );
        if (!allUp) throw new Error('Health check failed');
        return { status: 'ok', info };
      }),
    } as unknown as HealthCheckService;
    const controller = new HealthController(healthCheck, service);
    return { controller, service, prisma, redis };
  }

  describe('liveness', () => {
    it('always returns { status: "ok" } without touching the database', () => {
      const { controller, prisma } = build();

      const result = controller.liveness();

      expect(result).toEqual({ status: 'ok' });
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('readiness', () => {
    it('returns health check results when all dependencies are up', async () => {
      const { controller, prisma } = build();

      const result = await controller.readiness();

      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result.status).toBe('ok');
      expect(result.info).toHaveProperty('database');
      expect(result.info).toHaveProperty('redis');
      expect(result.info).toHaveProperty('storage');
    });

    it('returns 503 when the DB ping fails', async () => {
      const prisma = {
        $queryRaw: jest.fn().mockRejectedValue(new Error('Connection refused')),
      } as unknown as PrismaService;
      const redis = {
        isConfigured: false,
        ping: jest.fn().mockResolvedValue(false),
      } as unknown as RedisService;
      const storage = {
        providerName: 'local',
        getUploadRoot: () => process.cwd(),
      } as unknown as IStorageService;
      const service = new HealthService(prisma, redis, storage);
      const healthCheck = {
        check: jest.fn(async (indicators: (() => Promise<unknown>)[]) => {
          const results = await Promise.all(indicators.map((fn) => fn()));
          const info: Record<string, unknown> = {};
          for (const r of results) {
            Object.assign(info, r);
          }
          const allUp = Object.values(info).every(
            (v) => (v as { status?: string }).status === 'up',
          );
          if (!allUp) throw new Error('Health check failed');
          return { status: 'ok', info };
        }),
      } as unknown as HealthCheckService;
      const controller = new HealthController(healthCheck, service);

      await expect(controller.readiness()).rejects.toThrow();
    });
  });
});
