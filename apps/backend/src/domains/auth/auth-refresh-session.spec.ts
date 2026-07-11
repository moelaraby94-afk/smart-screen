import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginLockoutService } from './login-lockout.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * In-memory stand-in for PrismaService covering only the delegates the
 * refresh-token / logout / resetPassword paths exercise. No Postgres is
 * available in this sandbox, so the DB layer is faked while the service's
 * session-rotation logic runs for real.
 */

type FakeUser = {
  id: string;
  email: string;
  isActive: boolean;
  passwordHash: string;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  refreshTokenHash: string | null;
};

type FakeRefreshToken = {
  id: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: Date;
};

function createFakePrisma() {
  const users = new Map<string, FakeUser>();
  const tokens = new Map<string, FakeRefreshToken>();
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
    },
    refreshToken: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { userId_sessionId: { userId: string; sessionId: string } };
        }) => {
          const { userId, sessionId } = where.userId_sessionId;
          return (
            [...tokens.values()].find(
              (t) => t.userId === userId && t.sessionId === sessionId,
            ) ?? null
          );
        },
      ),
      create: jest.fn(({ data }: { data: Omit<FakeRefreshToken, 'id'> }) => {
        const row: FakeRefreshToken = { id: `rt_${++idCounter}`, ...data };
        tokens.set(row.id, row);
        return Promise.resolve(row);
      }),
      delete: jest.fn(({ where }: { where: { id: string } }) => {
        const existed = tokens.delete(where.id);
        if (!existed) throw new Error('RefreshToken not found');
        return Promise.resolve({ id: where.id });
      }),
      deleteMany: jest.fn(
        ({
          where,
        }: {
          where?: {
            userId?: string;
            expiresAt?: { lt?: Date };
          };
        }) => {
          let count = 0;
          for (const [key, row] of tokens) {
            const userMatch = !where?.userId || row.userId === where.userId;
            const expiryMatch =
              !where?.expiresAt?.lt || row.expiresAt < where.expiresAt.lt;
            if (userMatch && expiryMatch) {
              tokens.delete(key);
              count++;
            }
          }
          return Promise.resolve({ count });
        },
      ),
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
        const decoded = JSON.parse(
          Buffer.from(token, 'base64url').toString('utf-8'),
        ) as Record<string, unknown>;
        return decoded;
      } catch {
        throw new Error('Invalid token');
      }
    }),
  } as unknown as JwtService;
}

function createMockLoginLockoutService(): LoginLockoutService {
  return {
    assertNotLockedOut: jest.fn().mockResolvedValue(undefined),
  } as unknown as LoginLockoutService;
}

const USER_ID = 'user-1';
const EMAIL = 'test@example.com';
describe('AuthService — multi-session refresh tokens (P1-T1)', () => {
  let fake: ReturnType<typeof createFakePrisma>;
  let authService: AuthService;
  let jwtService: JwtService;

  beforeEach(() => {
    fake = createFakePrisma();
    jwtService = createMockJwtService();
    const configService = createMockConfigService();

    // Seed a user
    fake.users.set(USER_ID, {
      id: USER_ID,
      email: EMAIL,
      isActive: true,
      passwordHash: 'hashed',
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      refreshTokenHash: null,
    });

    authService = new AuthService(
      fake as unknown as PrismaService,
      jwtService,
      configService,
      null as never, // email — not used in these paths
      null as never, // workspaces — not used
      null as never, // auditLog — not used
      createMockLoginLockoutService(),
    );
  });

  // ─── Helper: issue a real token pair via the service ───────────────────
  // Mirrors what login/refreshTokens do: issueTokenPair then setRefreshTokenSession.
  async function issueTokens() {
    const result = await (
      authService as unknown as {
        issueTokenPair: (p: { sub: string; email: string }) => Promise<{
          accessToken: string;
          refreshToken: string;
          sessionId: string;
        }>;
      }
    ).issueTokenPair({ sub: USER_ID, email: EMAIL });
    await (
      authService as unknown as {
        setRefreshTokenSession: (
          userId: string,
          refreshToken: string,
          sessionId: string,
        ) => Promise<void>;
      }
    ).setRefreshTokenSession(USER_ID, result.refreshToken, result.sessionId);
    return result;
  }

  // ─── Test 1: refresh with valid sid → new pair + old session deleted ──
  it('rotates the refresh token: old session is deleted, new pair returned', async () => {
    const tokens = await issueTokens();
    // The token string from our mock JwtService is base64url JSON.
    // refreshTokens() will verifyAsync it and read sid from the payload.
    const result = (await authService.refreshTokens(tokens.refreshToken)) as {
      accessToken: string;
      refreshToken: string;
      sessionId: string;
    };

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.sessionId).not.toBe(tokens.sessionId);

    // Old session row should be gone (rotation deletes it).
    const oldRow = [...fake.tokens.values()].find(
      (t) => t.sessionId === tokens.sessionId,
    );
    expect(oldRow).toBeUndefined();

    // New session row should exist.
    const newRow = [...fake.tokens.values()].find(
      (t) => t.sessionId === result.sessionId,
    );
    expect(newRow).toBeDefined();
  });

  // ─── Test 2: refresh with same token twice → second fails ─────────────
  it('rejects a refresh token that was already rotated (replay)', async () => {
    const tokens = await issueTokens();
    // First refresh succeeds and rotates.
    await authService.refreshTokens(tokens.refreshToken);
    // Second use of the same token must fail — the old session was deleted.
    await expect(
      authService.refreshTokens(tokens.refreshToken),
    ).rejects.toThrow('Invalid refresh token');
  });

  // ─── Test 3: legacy token without sid → uses refreshTokenHash ─────────
  it('falls back to legacy refreshTokenHash for tokens without sid', async () => {
    // Manually craft a refresh token without sid (simulating pre-migration).
    const legacyToken = Buffer.from(
      JSON.stringify({ sub: USER_ID, email: EMAIL, typ: 'refresh' }),
    ).toString('base64url');

    // Seed a legacy hash on the user — must match the actual token string.
    const legacyHash = await bcrypt.hash(legacyToken, 12);
    fake.users.get(USER_ID)!.refreshTokenHash = legacyHash;

    const result = await authService.refreshTokens(legacyToken);
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  // ─── Test 3b (P1-T2): legacy refresh retires refreshTokenHash ─────────
  it('retires the legacy refreshTokenHash after a successful legacy refresh', async () => {
    const legacyToken = Buffer.from(
      JSON.stringify({ sub: USER_ID, email: EMAIL, typ: 'refresh' }),
    ).toString('base64url');

    const legacyHash = await bcrypt.hash(legacyToken, 12);
    fake.users.get(USER_ID)!.refreshTokenHash = legacyHash;

    await authService.refreshTokens(legacyToken);

    // The legacy hash must be cleared so the old token can't be reused.
    expect(fake.users.get(USER_ID)!.refreshTokenHash).toBeNull();

    // A second refresh with the same legacy token must now fail.
    await expect(authService.refreshTokens(legacyToken)).rejects.toThrow(
      'Invalid refresh token',
    );
  });

  // ─── Test 4: logout deletes all RefreshToken rows ─────────────────────
  it('logout deletes all refresh token sessions for the user', async () => {
    // Create two sessions.
    await issueTokens();
    await issueTokens();
    expect(fake.tokens.size).toBeGreaterThanOrEqual(2);

    await authService.logout(USER_ID);

    const remaining = [...fake.tokens.values()].filter(
      (t) => t.userId === USER_ID,
    );
    expect(remaining).toHaveLength(0);
  });

  // ─── Test 5: resetPassword invalidates all sessions + clears hash ─────
  it('resetPassword clears all sessions and refreshTokenHash', async () => {
    // Set up a user with a valid reset token.
    const resetToken = 'valid-reset-token';
    const resetTokenHash = await bcrypt.hash(resetToken, 12);
    const user = fake.users.get(USER_ID)!;
    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1h

    // Create two active sessions.
    await issueTokens();
    await issueTokens();
    expect(
      [...fake.tokens.values()].filter((t) => t.userId === USER_ID).length,
    ).toBeGreaterThanOrEqual(2);

    // Also set a legacy hash.
    user.refreshTokenHash = 'some-legacy-hash';

    const dto: ResetPasswordDto = {
      email: EMAIL,
      token: resetToken,
      newPassword: 'NewPass123!',
    };

    await authService.resetPassword(dto);

    // All sessions deleted.
    const remaining = [...fake.tokens.values()].filter(
      (t) => t.userId === USER_ID,
    );
    expect(remaining).toHaveLength(0);

    // Legacy hash cleared.
    expect(fake.users.get(USER_ID)!.refreshTokenHash).toBeNull();
  });
});
