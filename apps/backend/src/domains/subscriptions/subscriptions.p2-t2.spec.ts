import { ConfigService } from '@nestjs/config';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ScreenHeartbeatService } from '../realtime/screen-heartbeat.service';

// Enable mock billing for setMockPlan tests (container runs NODE_ENV=production)
process.env.ENABLE_MOCK_BILLING = 'true';

type FakeSubscription = {
  workspaceId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  seats: number;
  screenLimit: number;
  storageLimitBytes: bigint;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  startedAt: Date;
};

function createFakePrisma(opts: { subscriptions?: FakeSubscription[] }) {
  const { subscriptions = [] } = opts;
  const subMap = new Map<string, FakeSubscription>(
    subscriptions.map((s) => [s.workspaceId, s]),
  );

  return {
    subscription: {
      findUnique: jest.fn(({ where }: { where: { workspaceId: string } }) =>
        Promise.resolve(subMap.get(where.workspaceId) ?? null),
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { workspaceId: string };
          data: Record<string, unknown>;
        }) => {
          const s = subMap.get(where.workspaceId);
          if (!s) throw new Error('Subscription not found');
          Object.assign(s, data);
          return Promise.resolve(s);
        },
      ),
    },
  };
}

function createMockHeartbeat() {
  return {
    emitWorkspaceSubscriptionUpdated: jest.fn(),
  } as unknown as ScreenHeartbeatService;
}

function createMockConfigService() {
  return {
    get: jest.fn((key: string, fallback?: string) => {
      if (key === 'MOCK_BILLING_ALLOWED') return '1';
      return fallback;
    }),
  } as unknown as ConfigService;
}

const WS_ID = 'ws-1';

function makeSubscription(
  overrides: Partial<FakeSubscription> = {},
): FakeSubscription {
  return {
    workspaceId: WS_ID,
    plan: SubscriptionPlan.FREE,
    status: SubscriptionStatus.TRIALING,
    seats: 5,
    screenLimit: 25,
    storageLimitBytes: BigInt(5 * 1024 * 1024 * 1024),
    currentPeriodEnd: null,
    canceledAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    startedAt: new Date(),
    ...overrides,
  };
}

function makeStripeSub(
  overrides: {
    status?: string;
    cancelled?: boolean;
    current_period_end?: number;
    customer?: string | { id: string; deleted?: boolean };
    id?: string;
    metadata?: Record<string, string>;
  } = {},
) {
  return {
    id: overrides.id ?? 'sub_123',
    status: overrides.status ?? 'active',
    current_period_end:
      overrides.current_period_end ?? Math.floor(Date.now() / 1000) + 86400,
    customer: overrides.customer ?? 'cus_123',
    metadata: overrides.metadata ?? { workspace_id: WS_ID },
  } as never;
}

describe('SubscriptionsService P2-T2 (state transitions)', () => {
  function makeService(fake: ReturnType<typeof createFakePrisma>) {
    return new SubscriptionsService(
      fake as unknown as PrismaService,
      createMockHeartbeat(),
      createMockConfigService(),
    );
  }

  // ─── syncFromStripeSubscription transition tests ────────────────────

  it('transitions to ACTIVE when Stripe status is active', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.TRIALING });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'active' }),
      false,
    );

    expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('transitions to TRIALING when Stripe status is trialing', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'trialing' }),
      false,
    );

    expect(sub.status).toBe(SubscriptionStatus.TRIALING);
  });

  it('transitions to PAST_DUE when Stripe status is past_due', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'past_due' }),
      false,
    );

    expect(sub.status).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('transitions to PAST_DUE when Stripe status is unpaid', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'unpaid' }),
      false,
    );

    expect(sub.status).toBe(SubscriptionStatus.PAST_DUE);
  });

  it('transitions to CANCELED when cancelled flag is true', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'active' }),
      true,
    );

    expect(sub.status).toBe(SubscriptionStatus.CANCELED);
    expect(sub.canceledAt).not.toBeNull();
  });

  it('transitions to CANCELED when Stripe status is canceled', async () => {
    const sub = makeSubscription({ status: SubscriptionStatus.ACTIVE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ status: 'canceled' }),
      false,
    );

    expect(sub.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('sets currentPeriodEnd from Stripe current_period_end', async () => {
    const sub = makeSubscription({ currentPeriodEnd: null });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    const periodEnd = Math.floor(Date.now() / 1000) + 30 * 86400;
    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ current_period_end: periodEnd }),
      false,
    );

    expect(sub.currentPeriodEnd).toEqual(new Date(periodEnd * 1000));
  });

  it('skips update when workspaceId not in metadata', async () => {
    const sub = makeSubscription();
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ metadata: {} }),
      false,
    );

    // findUnique should not be called since workspaceId is empty
    expect(fake.subscription.findUnique).not.toHaveBeenCalled();
  });

  it('skips update when subscription does not exist', async () => {
    const fake = createFakePrisma({ subscriptions: [] });
    const service = makeService(fake);

    await service.syncFromStripeSubscription(
      fake as never,
      makeStripeSub({ metadata: { workspace_id: 'nonexistent' } }),
      false,
    );

    expect(fake.subscription.update).not.toHaveBeenCalled();
  });

  // ─── setMockPlan transition tests ───────────────────────────────────

  it('setMockPlan transitions FREE → PRO with ACTIVE status', async () => {
    const sub = makeSubscription({
      plan: SubscriptionPlan.FREE,
      status: SubscriptionStatus.TRIALING,
    });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    const result = await service.setMockPlan(WS_ID, 'PRO');
    expect(result.plan).toBe(SubscriptionPlan.PRO);
    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.screenLimit).toBe(500);
    expect(result.seats).toBe(25);
  });

  it('setMockPlan transitions PRO → FREE with TRIALING status', async () => {
    const sub = makeSubscription({
      plan: SubscriptionPlan.PRO,
      status: SubscriptionStatus.ACTIVE,
      screenLimit: 500,
      seats: 25,
    });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    const result = await service.setMockPlan(WS_ID, 'FREE');
    expect(result.plan).toBe(SubscriptionPlan.FREE);
    expect(result.status).toBe(SubscriptionStatus.TRIALING);
    expect(result.screenLimit).toBe(25);
    expect(result.seats).toBe(5);
  });

  it('setMockPlan rejects unsupported plan', async () => {
    const sub = makeSubscription();
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    await expect(
      service.setMockPlan(WS_ID, 'STARTER' as never),
    ).rejects.toThrow();
  });

  it('setMockPlan rejects when subscription not found', async () => {
    const fake = createFakePrisma({ subscriptions: [] });
    const service = makeService(fake);

    await expect(service.setMockPlan(WS_ID, 'PRO')).rejects.toThrow();
  });

  // ─── applyTrustedCheckout tests ─────────────────────────────────────

  it('applyTrustedCheckout sets plan to ACTIVE with defaults', async () => {
    const sub = makeSubscription({ plan: SubscriptionPlan.FREE });
    const fake = createFakePrisma({ subscriptions: [sub] });
    const service = makeService(fake);

    const result = await service.applyTrustedCheckout({
      workspaceId: WS_ID,
      plan: SubscriptionPlan.PRO,
    });
    expect(result.plan).toBe(SubscriptionPlan.PRO);
    expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    expect(result.screenLimit).toBe(500);
  });

  it('applyTrustedCheckout rejects when subscription not found', async () => {
    const fake = createFakePrisma({ subscriptions: [] });
    const service = makeService(fake);

    await expect(
      service.applyTrustedCheckout({
        workspaceId: WS_ID,
        plan: SubscriptionPlan.PRO,
      }),
    ).rejects.toThrow();
  });
});
