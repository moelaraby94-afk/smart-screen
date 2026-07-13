import type { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import request from 'supertest';
import { RolesGuard } from '../../common/auth/roles.guard';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UserThrottlerGuard } from '../../common/throttler/user-throttler.guard';
import { JwtStrategy } from '../auth/jwt.strategy';
import { PairingService } from '../pairing/pairing.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

/**
 * Minimal in-memory stand-in for PrismaService covering only the delegate
 * calls this security test exercises (JwtStrategy.validate, RolesGuard,
 * PairingService.claimSession's lockout + wrong-code path). No Postgres is
 * available in this sandbox, so the DB layer is faked; everything above it
 * (HTTP -> guards -> PairingService) runs for real.
 */
type FakeLockoutRow = {
  id: string;
  userId: string;
  ip: string | null;
  failedCount: number;
  windowStartAt: Date;
  lockedUntil: Date | null;
};

function createFakePrisma() {
  const users = new Map<
    string,
    { id: string; email: string; isActive: boolean; isSuperAdmin: boolean }
  >();
  const memberships = new Map<string, { role: UserRole }>();
  const lockouts = new Map<string, FakeLockoutRow>();

  return {
    users,
    memberships,
    lockouts,
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        return users.get(where.id) ?? null;
      }),
    },
    workspaceMember: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: {
            workspaceId_userId: { workspaceId: string; userId: string };
          };
        }) => {
          const key = `${where.workspaceId_userId.workspaceId}:${where.workspaceId_userId.userId}`;
          return memberships.get(key) ?? null;
        },
      ),
    },
    pairingClaimLockout: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { userId_ip: { userId: string; ip: string | null } };
        }) => {
          const key = `${where.userId_ip.userId}:${where.userId_ip.ip ?? 'null'}`;
          return lockouts.get(key) ?? null;
        },
      ),
      upsert: jest.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { userId_ip: { userId: string; ip: string | null } };
          create: Omit<FakeLockoutRow, 'id'>;
          update: Partial<FakeLockoutRow>;
        }) => {
          const key = `${where.userId_ip.userId}:${where.userId_ip.ip ?? 'null'}`;
          const existing = lockouts.get(key);
          const row: FakeLockoutRow = existing
            ? { ...existing, ...update }
            : { id: `lock_${key}`, ...create };
          lockouts.set(key, row);
          return row;
        },
      ),
      deleteMany: jest.fn(({ where }: { where: { userId: string } }) => {
        let count = 0;
        for (const [key] of lockouts) {
          if (key.startsWith(`${where.userId}:`)) {
            lockouts.delete(key);
            count += 1;
          }
        }
        return { count };
      }),
    },
    $transaction: jest.fn(
      (
        cb: (tx: {
          screenPairingSession: { findFirst: jest.Mock };
        }) => Promise<unknown>,
      ) => {
        // Every attempt in this test uses a code that matches no PENDING
        // session, i.e. every attempt is a "wrong code" guess.
        return cb({
          screenPairingSession: { findFirst: jest.fn(() => null) },
        });
      },
    ),
  };
}

type ClaimResponse = { status: number; body: { code?: string } };

describe('POST /workspaces/:workspaceId/pairing-sessions/claim — brute-force defenses', () => {
  let app: INestApplication;
  let fakePrisma: ReturnType<typeof createFakePrisma>;
  let pairingService: PairingService;
  let token: string;

  const userId = 'user_attacker';
  const workspaceId = 'ws_1';
  // Matches the fake ConfigService below, which always returns the caller's
  // default value — i.e. JwtStrategy's own fallback ('dev-access-secret').
  const JWT_SECRET = 'dev-access-secret';

  beforeAll(async () => {
    fakePrisma = createFakePrisma();
    fakePrisma.users.set(userId, {
      id: userId,
      email: 'attacker@example.com',
      isActive: true,
      isSuperAdmin: false,
    });
    fakePrisma.memberships.set(`${workspaceId}:${userId}`, {
      role: UserRole.OWNER,
    });

    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 5 }] }),
      ],
      controllers: [WorkspacesController],
      providers: [
        JwtStrategy,
        RolesGuard,
        UserThrottlerGuard,
        PairingService,
        { provide: WorkspacesService, useValue: {} },
        { provide: PrismaService, useValue: fakePrisma },
        {
          provide: ScreenHeartbeatService,
          useValue: {
            emitPairingSessionComplete: jest.fn(),
            emitPairingStarted: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: (_key: string, defaultValue?: unknown) => defaultValue,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    pairingService = moduleRef.get(PairingService);
    token = new JwtService({ secret: JWT_SECRET }).sign({
      sub: userId,
      email: 'attacker@example.com',
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects the 6th consecutive wrong-code attempt within a minute, and keeps rejecting a correct-shaped code afterwards via the lockout', async () => {
    const server = app.getHttpServer() as Server;
    const responses: ClaimResponse[] = [];

    for (let i = 0; i < 6; i += 1) {
      const res = await request(server)
        .post(`/workspaces/${workspaceId}/pairing-sessions/claim`)
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '000000' });
      responses.push({
        status: res.status,
        body: res.body as { code?: string },
      });
    }

    console.table(
      responses.map((r, i) => ({
        attempt: i + 1,
        status: r.status,
        code: r.body.code,
      })),
    );

    // Attempts 1-5 reach PairingService and are rejected for a wrong/expired code.
    for (let i = 0; i < 5; i += 1) {
      expect(responses[i].status).toBe(400);
      // Assert the stable code, not the prose message.
      expect(responses[i].body.code).toBe(
        ErrorCode.INVALID_OR_EXPIRED_PAIRING_CODE,
      );
    }

    // Attempt 6 is rejected outright — the per-user ThrottlerGuard (5/min) trips
    // before the request ever reaches PairingService.
    expect(responses[5].status).toBe(429);

    // The 5th failure (within the 10-minute window) should have tripped the
    // 30-minute lockout in the DB-backed counter.
    // The lockout row is keyed by (userId, ip); req.ip for this in-process
    // request is the loopback address, whose exact form varies by platform, so
    // locate the row by its userId prefix rather than hardcoding the ip.
    const lockoutRow = [...fakePrisma.lockouts.entries()].find(([key]) =>
      key.startsWith(`${userId}:`),
    )?.[1];
    expect(lockoutRow?.failedCount).toBe(5);
    expect(lockoutRow?.lockedUntil).not.toBeNull();
    expect(lockoutRow?.lockedUntil?.getTime()).toBeGreaterThan(Date.now());

    // Calling the service directly (bypassing the route's ThrottlerGuard) with
    // a "correct-shaped" code proves it is the *lockout*, not just the 60s
    // rate limit, that keeps rejecting the user.
    let lockedError: unknown;
    try {
      // Use the same ip the HTTP attempts were recorded under, so the direct
      // call hits the same (userId, ip) lockout bucket rather than a fresh one.
      await pairingService.claimSession(
        workspaceId,
        userId,
        { code: '123456' },
        lockoutRow?.ip ?? undefined,
      );
    } catch (err) {
      lockedError = err;
    }
    expect(lockedError).toBeInstanceOf(DomainException);
    expect((lockedError as DomainException).code).toBe(
      ErrorCode.TOO_MANY_FAILED_PAIRING_ATTEMPTS,
    );
    expect((lockedError as DomainException).getStatus()).toBe(429);
    expect((lockedError as DomainException).details).toMatchObject({
      retryAfterSeconds: expect.any(Number) as unknown as number,
    });
  });

  it('lets the user try again once the 30-minute lockout window has actually elapsed', async () => {
    // Simulate "30 minutes later" by seeding an already-expired lockedUntil,
    // rather than waiting in wall-clock time.
    fakePrisma.lockouts.set(`${userId}:unknown`, {
      id: `lock_${userId}:unknown`,
      userId,
      ip: 'unknown',
      failedCount: 5,
      windowStartAt: new Date(Date.now() - 40 * 60 * 1000),
      lockedUntil: new Date(Date.now() - 1000),
    });

    // No longer blocked by the lockout — falls through to the normal
    // wrong-code path (still a guess, but no longer a 429).
    let unlockedError: unknown;
    try {
      await pairingService.claimSession(workspaceId, userId, {
        code: '654321',
      });
    } catch (err) {
      unlockedError = err;
    }
    expect(unlockedError).toBeInstanceOf(DomainException);
    expect((unlockedError as DomainException).code).toBe(
      ErrorCode.INVALID_OR_EXPIRED_PAIRING_CODE,
    );
    expect((unlockedError as DomainException).getStatus()).toBe(400);
  });
});
