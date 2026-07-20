import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthTokenService } from './auth-token.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SessionRevocationService } from '../../common/auth/session-revocation.service';
import { PlatformStaffRole } from '@prisma/client';
import { resolveAudience } from './auth.types';

type FakeUser = {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string;
  isSuperAdmin: boolean;
  platformStaffRole: PlatformStaffRole | null;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  fullName: string;
  locale: string;
  refreshTokenHash: string | null;
};

function createFakePrisma(users: Map<string, FakeUser>) {
  const tokens = new Map<
    string,
    {
      id: string;
      userId: string;
      sessionId: string;
      tokenHash: string;
      expiresAt: Date;
    }
  >();
  let idCounter = 0;

  return {
    users,
    tokens,
    user: {
      findUnique: jest.fn(
        ({ where }: { where: { id?: string; email?: string } }) => {
          if (where.id) return users.get(where.id) ?? null;
          if (where.email)
            return (
              [...users.values()].find((u) => u.email === where.email) ?? null
            );
          return null;
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeUser>;
        }) => {
          const u = users.get(where.id);
          if (!u) throw new Error('User not found');
          Object.assign(u, data);
          return Promise.resolve(u);
        },
      ),
      create: jest.fn(({ data }: { data: Partial<FakeUser> }) => {
        const id = `user_${++idCounter}`;
        const u = { id, ...data } as FakeUser;
        users.set(id, u);
        return Promise.resolve(u);
      }),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            userId: string;
            sessionId: string;
            tokenHash: string;
            expiresAt: Date;
          };
        }) => {
          const row = { id: `rt_${++idCounter}`, ...data };
          tokens.set(row.id, row);
          return Promise.resolve(row);
        },
      ),
      delete: jest.fn(),
      deleteMany: jest.fn(({ where }: { where?: { userId?: string } }) => {
        let count = 0;
        for (const [key, row] of tokens) {
          if (!where?.userId || row.userId === where.userId) {
            tokens.delete(key);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },
    workspace: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    workspaceMember: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => {
      const results: unknown[] = [];
      for (const op of ops) results.push(await op);
      return results;
    }),
  };
}

function createMockConfigService(): ConfigService {
  const mock = {
    get: jest.fn((key: string, fallback?: string) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key] ?? fallback;
    }),
  };
  return mock as unknown as ConfigService;
}

function createMockJwtService(): JwtService {
  return {
    signAsync: jest.fn((payload: Record<string, unknown>) =>
      Promise.resolve(
        Buffer.from(JSON.stringify(payload)).toString('base64url'),
      ),
    ),
    verifyAsync: jest.fn((token: string) => {
      try {
        return Promise.resolve(
          JSON.parse(Buffer.from(token, 'base64url').toString('utf-8')),
        );
      } catch {
        return Promise.reject(new Error('Invalid token'));
      }
    }),
  } as unknown as JwtService;
}

describe('Auth — JWT audience claim (P0-01)', () => {
  let fake: ReturnType<typeof createFakePrisma>;

  beforeEach(() => {
    fake = createFakePrisma(new Map());
  });

  describe('resolveAudience', () => {
    it('returns "platform" for super admin', () => {
      const result = resolveAudience({
        isSuperAdmin: true,
        platformStaffRole: null,
      });
      expect(result).toBe('platform');
    });

    it('returns "platform" for staff with platformStaffRole', () => {
      const result = resolveAudience({
        isSuperAdmin: false,
        platformStaffRole: PlatformStaffRole.SUPPORT_SPECIALIST,
      });
      expect(result).toBe('platform');
    });

    it('returns "customer" for regular user', () => {
      const result = resolveAudience({
        isSuperAdmin: false,
        platformStaffRole: null,
      });
      expect(result).toBe('customer');
    });
  });

  describe('issueTokenPair — includes aud in payload', () => {
    it('includes aud: "platform" for super admin tokens', async () => {
      const jwtService = createMockJwtService();
      const signSpy = jest.spyOn(jwtService, 'signAsync');

      const svc = new AuthTokenService(
        fake as unknown as PrismaService,
        jwtService,
        createMockConfigService(),
        null as unknown as SessionRevocationService,
      );

      await svc.issueTokenPair({
        sub: 'admin-1',
        email: 'admin@test.com',
        aud: 'platform',
      });

      const accessCall = signSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(accessCall.aud).toBe('platform');
      expect(accessCall.typ).toBe('access');

      const refreshCall = signSpy.mock.calls[1][0] as Record<string, unknown>;
      expect(refreshCall.aud).toBe('platform');
      expect(refreshCall.typ).toBe('refresh');
    });

    it('includes aud: "customer" for regular user tokens', async () => {
      const jwtService = createMockJwtService();
      const signSpy = jest.spyOn(jwtService, 'signAsync');

      const svc = new AuthTokenService(
        fake as unknown as PrismaService,
        jwtService,
        createMockConfigService(),
        null as unknown as SessionRevocationService,
      );

      await svc.issueTokenPair({
        sub: 'user-1',
        email: 'user@test.com',
        aud: 'customer',
      });

      const accessCall = signSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(accessCall.aud).toBe('customer');
    });
  });

  describe('refreshTokens — preserves aud from refresh token', () => {
    it('preserves aud: "platform" from the refresh token', async () => {
      fake.users.set('admin-1', {
        id: 'admin-1',
        email: 'admin@test.com',
        isActive: true,
        passwordHash: 'hashed',
        isSuperAdmin: true,
        platformStaffRole: PlatformStaffRole.SUPER_ADMIN,
        emailVerified: true,
        twoFactorEnabled: false,
        fullName: 'Admin',
        locale: 'en',
        refreshTokenHash: null,
      });

      // Craft a refresh token with aud: 'platform'
      const refreshToken = Buffer.from(
        JSON.stringify({
          sub: 'admin-1',
          email: 'admin@test.com',
          typ: 'refresh',
          sid: 'session-1',
          aud: 'platform',
        }),
      ).toString('base64url');

      // Seed the refresh token store
      const hash = await bcrypt.hash(refreshToken, 12);
      fake.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-1',
        userId: 'admin-1',
        sessionId: 'session-1',
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 86400000),
      });
      fake.refreshToken.delete.mockResolvedValue({ id: 'rt-1' });

      const jwtService = createMockJwtService();
      const svc = new AuthTokenService(
        fake as unknown as PrismaService,
        jwtService,
        createMockConfigService(),
        null as unknown as SessionRevocationService,
      );

      const signSpy = jest.spyOn(jwtService, 'signAsync');

      const result = await svc.refreshTokens(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      // The new access token should have aud: 'platform'
      const accessCall = signSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(accessCall.aud).toBe('platform');
    });

    it('defaults to aud: "customer" for legacy tokens without aud', async () => {
      fake.users.set('user-1', {
        id: 'user-1',
        email: 'user@test.com',
        isActive: true,
        passwordHash: 'hashed',
        isSuperAdmin: false,
        platformStaffRole: null,
        emailVerified: true,
        twoFactorEnabled: false,
        fullName: 'User',
        locale: 'en',
        refreshTokenHash: null,
      });

      // Legacy token without aud
      const refreshToken = Buffer.from(
        JSON.stringify({
          sub: 'user-1',
          email: 'user@test.com',
          typ: 'refresh',
          sid: 'session-2',
        }),
      ).toString('base64url');

      const hash = await bcrypt.hash(refreshToken, 12);
      fake.refreshToken.findUnique.mockResolvedValue({
        id: 'rt-2',
        userId: 'user-1',
        sessionId: 'session-2',
        tokenHash: hash,
        expiresAt: new Date(Date.now() + 86400000),
      });
      fake.refreshToken.delete.mockResolvedValue({ id: 'rt-2' });

      const jwtService = createMockJwtService();
      const svc = new AuthTokenService(
        fake as unknown as PrismaService,
        jwtService,
        createMockConfigService(),
        null as unknown as SessionRevocationService,
      );

      const signSpy = jest.spyOn(jwtService, 'signAsync');

      await svc.refreshTokens(refreshToken);

      const accessCall = signSpy.mock.calls[0][0] as Record<string, unknown>;
      expect(accessCall.aud).toBe('customer');
    });
  });
});
