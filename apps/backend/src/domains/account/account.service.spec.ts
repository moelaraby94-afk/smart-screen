import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AccountService } from './account.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { OtpHelper } from '../../common/auth/otp.helper';

type FakeUser = {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  phone: string;
  country: string;
  city: string;
  subscriptionStatus: string;
  subscriptionEndDate: Date | null;
  pendingEmail: string | null;
  pendingEmailOtp: string | null;
  pendingEmailOtpExpiresAt: Date | null;
};

function createFakePrisma(opts: {
  users?: FakeUser[];
  payments?: unknown[];
  memberships?: Array<{
    role: string;
    workspace: {
      id: string;
      name: string;
      slug: string;
      isPaused: boolean;
      createdAt: Date;
      subscription: {
        plan: string;
        status: string;
        seats: number;
        screenLimit: number;
        storageLimitBytes: bigint | null;
        currentPeriodEnd: Date | null;
      } | null;
    };
  }>;
  screens?: Array<{ id: string; status: string }>;
  playlistCount?: number;
  mediaCount?: number;
  mediaAggSize?: bigint;
}) {
  const {
    users = [],
    payments = [],
    memberships = [],
    screens = [],
    playlistCount = 0,
    mediaCount = 0,
    mediaAggSize = BigInt(0),
  } = opts;

  const userMap = new Map<string, FakeUser>(users.map((u) => [u.id, u]));

  return {
    user: {
      findUnique: jest.fn(
        ({
          where,
          select,
        }: {
          where: { id?: string; email?: string };
          select?: Record<string, boolean>;
        }) => {
          let result: FakeUser | null = null;
          if (where.id) result = userMap.get(where.id) ?? null;
          else if (where.email)
            result =
              [...userMap.values()].find((u) => u.email === where.email) ??
              null;
          if (!result) return Promise.resolve(null);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key]) {
                if (key === 'memberships') {
                  filtered[key] = memberships;
                } else if (key === 'payments') {
                  filtered[key] = payments;
                } else {
                  filtered[key] = (result as Record<string, unknown>)[key];
                }
              }
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(result);
        },
      ),
      findFirst: jest.fn(
        ({ where }: { where: { email?: string; id?: { not?: string } } }) =>
          Promise.resolve(
            [...userMap.values()].find(
              (u) =>
                u.email === where.email &&
                (!where.id?.not || u.id !== where.id.not),
            ) ?? null,
          ),
      ),
      update: jest.fn(
        ({
          where,
          data,
          select,
        }: {
          where: { id: string };
          data: Record<string, unknown>;
          select?: Record<string, boolean>;
        }) => {
          const u = userMap.get(where.id);
          if (!u) throw new Error('User not found');
          Object.assign(u, data);
          if (select) {
            const filtered: Record<string, unknown> = {};
            for (const key of Object.keys(select)) {
              if (select[key])
                filtered[key] = (u as Record<string, unknown>)[key];
            }
            return Promise.resolve(filtered);
          }
          return Promise.resolve(u);
        },
      ),
    },
    screen: {
      findMany: jest.fn(() => Promise.resolve(screens)),
    },
    playlist: {
      count: jest.fn(() => Promise.resolve(playlistCount)),
    },
    media: {
      count: jest.fn(() => Promise.resolve(mediaCount)),
      aggregate: jest.fn(() =>
        Promise.resolve({ _sum: { sizeBytes: mediaAggSize } }),
      ),
    },
  };
}

function createMockEmailService(configured = true) {
  return {
    isConfigured: jest.fn(() => configured),
    sendMail: jest.fn(() => Promise.resolve()),
    enqueue: jest.fn(() => Promise.resolve()),
  } as unknown as EmailService;
}

const USER_ID = 'user-1';

function makeUser(overrides: Partial<FakeUser> = {}): FakeUser {
  return {
    id: USER_ID,
    email: 'test@test.com',
    fullName: 'Test User',
    businessName: '',
    phone: '',
    country: '',
    city: '',
    subscriptionStatus: 'TRIALING',
    subscriptionEndDate: null,
    pendingEmail: null,
    pendingEmailOtp: null,
    pendingEmailOtpExpiresAt: null,
    ...overrides,
  };
}

describe('AccountService (P1-T6)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new AccountService(
      fake as unknown as PrismaService,
      createMockEmailService(),
      null as never, // configHelper — not used in these paths
      new OtpHelper(),
      null as never, // insightsService — not used in these paths
    );
  }

  // ─── Test 1: updateProfile with no changes → BadRequest ─────────────
  it('throws BadRequest when updateProfile has no changes', async () => {
    const fake = createFakePrisma({ users: [makeUser()] });
    const service = makeService(fake);

    await expect(service.updateProfile(USER_ID, {})).rejects.toThrow(
      BadRequestException,
    );
  });

  // ─── Test 2: updateProfile with fullName → success ──────────────────
  it('updates user profile fields', async () => {
    const fake = createFakePrisma({ users: [makeUser()] });
    const service = makeService(fake);

    const result = await service.updateProfile(USER_ID, {
      fullName: 'New Name',
      phone: '+1234567890',
    });
    expect(result.fullName).toBe('New Name');
    expect(result.phone).toBe('+1234567890');
  });

  // ─── Test 3: requestEmailChange to existing email → Conflict ────────
  it('throws Conflict when changing to an already registered email', async () => {
    const fake = createFakePrisma({
      users: [makeUser(), makeUser({ id: 'user-2', email: 'taken@test.com' })],
    });
    const service = makeService(fake);

    await expect(
      service.requestEmailChange(USER_ID, 'taken@test.com'),
    ).rejects.toThrow(ConflictException);
  });

  // ─── Test 4: requestEmailChange to same email → Conflict ──────────
  // The service checks for an existing user with that email BEFORE checking
  // if it's the same email, so it throws ConflictException.
  it('throws Conflict when changing to the same email (finds self)', async () => {
    const fake = createFakePrisma({ users: [makeUser()] });
    const service = makeService(fake);

    await expect(
      service.requestEmailChange(USER_ID, 'test@test.com'),
    ).rejects.toThrow(ConflictException);
  });

  // ─── Test 5: requestEmailChange to new email → success ──────────────
  it('requests email change to a new email', async () => {
    const fake = createFakePrisma({ users: [makeUser()] });
    const service = makeService(fake);

    const result = await service.requestEmailChange(USER_ID, 'new@test.com');
    expect(result.ok).toBe(true);
  });

  // ─── Test 6: verifyEmailChange with no pending → BadRequest ─────────
  it('throws BadRequest when verifying with no pending email change', async () => {
    const fake = createFakePrisma({ users: [makeUser()] });
    const service = makeService(fake);

    await expect(
      service.verifyEmailChange(USER_ID, 'new@test.com', '123456'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 7: verifyEmailChange with expired code → BadRequest ───────
  it('throws BadRequest when the OTP code is expired', async () => {
    const otpHash = await bcrypt.hash('123456', 10);
    const fake = createFakePrisma({
      users: [
        makeUser({
          pendingEmail: 'new@test.com',
          pendingEmailOtp: otpHash,
          pendingEmailOtpExpiresAt: new Date(Date.now() - 1000),
        }),
      ],
    });
    const service = makeService(fake);

    await expect(
      service.verifyEmailChange(USER_ID, 'new@test.com', '123456'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 8: verifyEmailChange with wrong code → BadRequest ─────────
  it('throws BadRequest when the OTP code is wrong', async () => {
    const otpHash = await bcrypt.hash('123456', 10);
    const fake = createFakePrisma({
      users: [
        makeUser({
          pendingEmail: 'new@test.com',
          pendingEmailOtp: otpHash,
          pendingEmailOtpExpiresAt: new Date(Date.now() + 60000),
        }),
      ],
    });
    const service = makeService(fake);

    await expect(
      service.verifyEmailChange(USER_ID, 'new@test.com', '999999'),
    ).rejects.toThrow(BadRequestException);
  });

  // ─── Test 9: verifyEmailChange with correct code → success ──────────
  it('verifies email change with correct code', async () => {
    const otpHash = await bcrypt.hash('123456', 10);
    const fake = createFakePrisma({
      users: [
        makeUser({
          pendingEmail: 'new@test.com',
          pendingEmailOtp: otpHash,
          pendingEmailOtpExpiresAt: new Date(Date.now() + 60000),
        }),
      ],
    });
    const service = makeService(fake);

    const result = await service.verifyEmailChange(
      USER_ID,
      'new@test.com',
      '123456',
    );
    expect(result.email).toBe('new@test.com');
  });

  // ─── Test 10: getBilling for non-existent user → Forbidden ──────────
  it('throws Forbidden when getting billing for non-existent user', async () => {
    const fake = createFakePrisma({ users: [] });
    const service = makeService(fake);

    await expect(service.getBilling(USER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  // ─── Test 11: getBilling for existing user → success ────────────────
  it('returns billing info for existing user', async () => {
    const fake = createFakePrisma({
      users: [makeUser()],
      payments: [],
      memberships: [
        {
          role: 'OWNER',
          workspace: {
            id: 'ws-1',
            name: 'Test WS',
            slug: 'test-ws',
            isPaused: false,
            createdAt: new Date(),
            subscription: {
              plan: 'FREE',
              status: 'TRIALING',
              seats: 5,
              screenLimit: 25,
              storageLimitBytes: BigInt(5 * 1024 * 1024 * 1024),
              currentPeriodEnd: null,
            },
          },
        },
      ],
    });
    const service = makeService(fake);

    const result = await service.getBilling(USER_ID);
    expect(result.currentPlan.workspacePlan).toBe('FREE');
    expect(result.payments).toEqual([]);
  });
});
