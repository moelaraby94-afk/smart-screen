import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let prisma: jest.Mocked<Pick<PrismaService, 'featureFlag' | 'workspace'>>;
  let redisClient: {
    get: jest.Mock;
    setex: jest.Mock;
    del: jest.Mock;
    keys: jest.Mock;
  };

  beforeEach(async () => {
    redisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: PrismaService,
          useValue: {
            featureFlag: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              upsert: jest.fn(),
            },
            workspace: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn(() => redisClient),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prisma = module.get(PrismaService);
  });

  describe('isModuleEnabled', () => {
    it('returns cached value from Redis when available', async () => {
      redisClient.get.mockResolvedValue('1');
      const result = await service.isModuleEnabled('ws-1', 'billing');
      expect(result).toBe(true);
      expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled();
    });

    it('returns false when cached value is 0', async () => {
      redisClient.get.mockResolvedValue('0');
      const result = await service.isModuleEnabled('ws-1', 'billing');
      expect(result).toBe(false);
      expect(prisma.featureFlag.findUnique).not.toHaveBeenCalled();
    });

    it('falls back to DB when Redis has no cache', async () => {
      redisClient.get.mockResolvedValue(null);
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue({
        enabled: false,
      });
      const result = await service.isModuleEnabled('ws-1', 'billing');
      expect(result).toBe(false);
      expect(prisma.featureFlag.findUnique).toHaveBeenCalled();
      expect(redisClient.setex).toHaveBeenCalledWith(
        'feature-flags:ws-1:billing',
        60,
        '0',
      );
    });

    it('defaults to true when no flag exists in DB', async () => {
      redisClient.get.mockResolvedValue(null);
      (prisma.featureFlag.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.isModuleEnabled('ws-1', 'billing');
      expect(result).toBe(true);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'feature-flags:ws-1:billing',
        60,
        '1',
      );
    });

    it('falls back to DB when Redis is not configured', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeatureFlagsService,
          {
            provide: PrismaService,
            useValue: {
              featureFlag: {
                findUnique: jest.fn().mockResolvedValue({ enabled: true }),
              },
              workspace: {},
            },
          },
          {
            provide: RedisService,
            useValue: { getClient: jest.fn(() => null) },
          },
        ],
      }).compile();
      const svc = module.get<FeatureFlagsService>(FeatureFlagsService);
      const result = await svc.isModuleEnabled('ws-1', 'billing');
      expect(result).toBe(true);
    });
  });

  describe('setFlag', () => {
    it('throws NotFoundException when workspace does not exist', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.setFlag('ws-1', 'billing', true, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('upserts the flag and invalidates cache', async () => {
      (prisma.workspace.findUnique as jest.Mock).mockResolvedValue({
        id: 'ws-1',
      });
      (prisma.featureFlag.upsert as jest.Mock).mockResolvedValue({
        module: 'billing',
        enabled: true,
      });
      const result = await service.setFlag('ws-1', 'billing', true, 'user-1');
      expect(result).toEqual({ module: 'billing', enabled: true });
      expect(redisClient.del).toHaveBeenCalledWith(
        'feature-flags:ws-1:billing',
      );
    });
  });

  describe('invalidateWorkspace', () => {
    it('deletes all keys for a workspace', async () => {
      redisClient.keys.mockResolvedValue([
        'feature-flags:ws-1:billing',
        'feature-flags:ws-1:campaigns',
      ]);
      await service.invalidateWorkspace('ws-1');
      expect(redisClient.del).toHaveBeenCalledWith(
        'feature-flags:ws-1:billing',
        'feature-flags:ws-1:campaigns',
      );
    });

    it('no-ops when no keys exist', async () => {
      redisClient.keys.mockResolvedValue([]);
      await service.invalidateWorkspace('ws-1');
      expect(redisClient.del).not.toHaveBeenCalled();
    });
  });
});
