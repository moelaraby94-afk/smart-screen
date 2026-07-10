import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginLockoutService } from './login-lockout.service';

/**
 * In-memory stand-in for the `loginLockout` delegate — no Postgres in this
 * sandbox, so the row store is faked while the service's counting logic runs for
 * real.
 */
type Row = {
  email: string;
  failedCount: number;
  windowStartAt: Date;
  lockedUntil: Date | null;
};

function createFakePrisma() {
  const rows = new Map<string, Row>();
  return {
    rows,
    loginLockout: {
      findUnique: jest.fn(({ where }: { where: { email: string } }) =>
        Promise.resolve(rows.get(where.email) ?? null),
      ),
      upsert: jest.fn(
        ({
          where,
          create,
          update,
        }: {
          where: { email: string };
          create: Row;
          update: Partial<Row>;
        }) => {
          const existing = rows.get(where.email);
          const row = existing ? { ...existing, ...update } : create;
          rows.set(where.email, row);
          return Promise.resolve(row);
        },
      ),
      deleteMany: jest.fn(({ where }: { where: { email: string } }) => {
        const existed = rows.delete(where.email);
        return Promise.resolve({ count: existed ? 1 : 0 });
      }),
    },
  };
}

const EMAIL = 'Victim@Example.com';
const MAX = 10;

describe('LoginLockoutService', () => {
  let fake: ReturnType<typeof createFakePrisma>;
  let service: LoginLockoutService;

  beforeEach(() => {
    fake = createFakePrisma();
    service = new LoginLockoutService(fake as unknown as PrismaService);
  });

  it('does not lock before the threshold', async () => {
    for (let i = 0; i < MAX - 1; i += 1) {
      await service.recordFailedAttempt(EMAIL);
    }
    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });

  it('locks on the Nth failed attempt and reports retryAfterSeconds', async () => {
    for (let i = 0; i < MAX; i += 1) {
      await service.recordFailedAttempt(EMAIL);
    }

    const error = await service
      .assertNotLockedOut(EMAIL)
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(DomainException);
    expect((error as DomainException).code).toBe(
      ErrorCode.TOO_MANY_LOGIN_ATTEMPTS,
    );
    expect((error as DomainException).getStatus()).toBe(429);
    const retry = (error as DomainException).details?.retryAfterSeconds;
    expect(typeof retry).toBe('number');
    expect(retry as number).toBeGreaterThan(0);
  });

  it('is keyed on a normalized email, so case and padding do not bypass it', async () => {
    for (let i = 0; i < MAX; i += 1) {
      await service.recordFailedAttempt('  VICTIM@example.com ');
    }

    await expect(
      service.assertNotLockedOut('victim@EXAMPLE.com'),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('clears the counter on a successful sign-in', async () => {
    for (let i = 0; i < MAX; i += 1) {
      await service.recordFailedAttempt(EMAIL);
    }
    await service.clear(EMAIL);

    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
    expect(fake.rows.size).toBe(0);
  });

  it('resets the count when the failure window has elapsed', async () => {
    // Seed a stale window: 9 failures that started well over the window ago.
    fake.rows.set('victim@example.com', {
      email: 'victim@example.com',
      failedCount: 9,
      windowStartAt: new Date(Date.now() - 60 * 60 * 1000),
      lockedUntil: null,
    });

    // One more failure — but the old window expired, so it starts a fresh count of 1.
    await service.recordFailedAttempt(EMAIL);

    const row = fake.rows.get('victim@example.com');
    expect(row?.failedCount).toBe(1);
    expect(row?.lockedUntil).toBeNull();
    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });

  it('lets the account back in once the lock has expired', async () => {
    fake.rows.set('victim@example.com', {
      email: 'victim@example.com',
      failedCount: MAX,
      windowStartAt: new Date(Date.now() - 20 * 60 * 1000),
      lockedUntil: new Date(Date.now() - 1000), // expired 1s ago
    });

    await expect(service.assertNotLockedOut(EMAIL)).resolves.toBeUndefined();
  });
});
