import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import type { PrismaService } from '../prisma/prisma.service';

describe('HealthController', () => {
  function build(prismaOverrides: { $queryRawUnsafe?: jest.Mock }) {
    const prisma = {
      $queryRawUnsafe: prismaOverrides.$queryRawUnsafe ?? jest.fn(),
    } as unknown as PrismaService;
    const service = new HealthService(prisma);
    const controller = new HealthController(service);
    return { controller, service, prisma };
  }

  describe('liveness', () => {
    it('always returns { status: "ok" } without touching the database', () => {
      const { controller, prisma } = build({});

      const result = controller.liveness();

      expect(result).toEqual({ status: 'ok' });
      expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
    });
  });

  describe('readiness', () => {
    it('returns { status: "ready" } when the DB ping succeeds', async () => {
      const $queryRawUnsafe = jest.fn().mockResolvedValue([{ 1: 1 }]);
      const { controller } = build({ $queryRawUnsafe });

      const result = await controller.readiness();

      expect($queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
      expect(result).toEqual({ status: 'ready' });
    });

    it('throws when the DB ping fails', async () => {
      const $queryRawUnsafe = jest
        .fn()
        .mockRejectedValue(new Error('Connection refused'));
      const { service } = build({ $queryRawUnsafe });

      await expect(service.checkReadiness()).rejects.toThrow(
        'Connection refused',
      );
      expect($queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
    });
  });
});
