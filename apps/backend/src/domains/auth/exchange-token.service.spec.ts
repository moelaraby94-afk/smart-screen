import { ConfigService } from '@nestjs/config';
import { ExchangeTokenService } from './exchange-token.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';

type FakeExchangeToken = {
  id: string;
  token: string;
  tokenHash: string;
  actorUserId: string;
  targetUserId: string;
  workspaceId: string | null;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

function createFakePrisma() {
  const store = new Map<string, FakeExchangeToken>();
  let idCounter = 0;

  return {
    exchangeToken: {
      create: jest.fn(({ data }: { data: Record<string, unknown> }) => {
        const row: FakeExchangeToken = {
          id: `et_${++idCounter}`,
          createdAt: new Date(),
          usedAt: null,
          token: data.token as string,
          tokenHash: data.tokenHash as string,
          actorUserId: data.actorUserId as string,
          targetUserId: data.targetUserId as string,
          workspaceId: (data.workspaceId as string | null) ?? null,
          expiresAt: data.expiresAt as Date,
        };
        store.set(row.id, row);
        return Promise.resolve(row);
      }),
      findUnique: jest.fn(({ where }: { where: { tokenHash: string } }) => {
        return Promise.resolve(
          [...store.values()].find((r) => r.tokenHash === where.tokenHash) ??
            null,
        );
      }),
      updateMany: jest.fn(
        (args: {
          where: { id: string; usedAt?: Date | null };
          data: { usedAt: Date };
        }) => {
          const row = store.get(args.where.id);
          if (!row) return Promise.resolve({ count: 0 });
          if (row.usedAt !== null) {
            return Promise.resolve({ count: 0 });
          }
          row.usedAt = args.data.usedAt;
          return Promise.resolve({ count: 1 });
        },
      ),
      deleteMany: jest.fn(
        ({ where }: { where: { expiresAt: { lt: Date } } }) => {
          let count = 0;
          for (const [key, row] of store) {
            if (row.expiresAt < where.expiresAt.lt) {
              store.delete(key);
              count++;
            }
          }
          return Promise.resolve({ count });
        },
      ),
    },
  };
}

function createMockConfigService(): ConfigService {
  const mock = {
    get: jest.fn((key: string, fallback?: string) => {
      const map: Record<string, string> = {
        EXCHANGE_TOKEN_TTL: '60',
        CUSTOMER_APP_URL: 'http://localhost:3000',
      };
      return map[key] ?? fallback;
    }),
  };
  return mock as unknown as ConfigService;
}

describe('ExchangeTokenService (P0-05)', () => {
  let service: ExchangeTokenService;
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    fake = createFakePrisma();
    service = new ExchangeTokenService(
      fake as unknown as PrismaService,
      createMockConfigService(),
    );
  });

  describe('generate', () => {
    it('creates a token with correct fields', async () => {
      const result = await service.generate('admin-1', 'user-1');

      expect(result.exchangeToken).toHaveLength(64);
      expect(result.targetApp).toBe('customer');
      expect(result.redirectUrl).toContain('token=');

      const createCall = (fake.exchangeToken.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.actorUserId).toBe('admin-1');
      expect(createCall.data.targetUserId).toBe('user-1');
      expect(createCall.data.tokenHash).toHaveLength(64);
      expect(createCall.data.expiresAt).toBeInstanceOf(Date);
    });

    it('includes workspaceId when provided', async () => {
      await service.generate('admin-1', 'user-1', 'ws-1');

      const createCall = (fake.exchangeToken.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.workspaceId).toBe('ws-1');
    });

    it('sets workspaceId to null when not provided', async () => {
      await service.generate('admin-1', 'user-1');

      const createCall = (fake.exchangeToken.create as jest.Mock).mock
        .calls[0][0];
      expect(createCall.data.workspaceId).toBeNull();
    });
  });

  describe('redeem', () => {
    it('redeems a valid unused token', async () => {
      await service.generate('admin-1', 'user-1');

      const createCall = (fake.exchangeToken.create as jest.Mock).mock
        .calls[0][0];
      const token = createCall.data.token as string;

      const result = await service.redeem(token);

      expect(result.actorUserId).toBe('admin-1');
      expect(result.targetUserId).toBe('user-1');
      expect(result.workspaceId).toBeNull();
    });

    it('rejects an invalid token', async () => {
      await expect(service.redeem('invalid-token')).rejects.toThrow(
        'Invalid exchange token',
      );
    });

    it('rejects an already-used token', async () => {
      await service.generate('admin-1', 'user-1');
      const createCall = (fake.exchangeToken.create as jest.Mock).mock
        .calls[0][0];
      const token = createCall.data.token as string;

      // First redeem succeeds
      await service.redeem(token);
      // Second redeem should fail
      await expect(service.redeem(token)).rejects.toThrow('already used');
    });

    it('rejects an expired token', async () => {
      // Generate with a very short TTL by creating manually
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');

      (fake.exchangeToken.create as jest.Mock).mockImplementationOnce({
        // This won't be called — we insert directly
      } as never);

      // Manually insert an expired token
      const expiredRow: FakeExchangeToken = {
        id: 'et_expired',
        token,
        tokenHash,
        actorUserId: 'admin-1',
        targetUserId: 'user-1',
        workspaceId: null,
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
        createdAt: new Date(),
      };
      (fake.exchangeToken.findUnique as jest.Mock).mockResolvedValueOnce(
        expiredRow,
      );

      await expect(service.redeem(token)).rejects.toThrow('expired');
    });
  });

  describe('cleanupExpired', () => {
    it('deletes expired tokens', async () => {
      // Insert an expired token manually via the mock
      const expiredToken = randomBytes(32).toString('hex');
      const expiredHash = createHash('sha256')
        .update(expiredToken)
        .digest('hex');

      (fake.exchangeToken.create as jest.Mock)({
        data: {
          token: expiredToken,
          tokenHash: expiredHash,
          actorUserId: 'admin-1',
          targetUserId: 'user-1',
          workspaceId: null,
          expiresAt: new Date(Date.now() - 1000),
          usedAt: null,
        },
      });

      const count = await service.cleanupExpired();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });
});
