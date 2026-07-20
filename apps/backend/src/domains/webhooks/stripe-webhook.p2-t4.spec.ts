import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { StripeWebhookService } from './stripe-webhook.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionEmailService } from '../email/subscription-email.service';

jest.mock('stripe', () => ({
  __esModule: true,
  default: class StripeMock {
    static webhooks: { constructEvent: jest.Mock } = {
      constructEvent: jest.fn(),
    };
  },
}));

describe('StripeWebhookService P2-T4 (reconciliation)', () => {
  let service: StripeWebhookService;
  let applyTrusted: jest.Mock;
  let syncFromStripe: jest.Mock;
  let prismaTx: {
    processedWebhookEvent: { create: jest.Mock };
    workspaceMember: { findFirst: jest.Mock };
    paymentRecord: { create: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (Stripe.webhooks.constructEvent as jest.Mock).mockReset();
    applyTrusted = jest.fn().mockResolvedValue({});
    syncFromStripe = jest.fn().mockResolvedValue(undefined);
    prismaTx = {
      processedWebhookEvent: { create: jest.fn().mockResolvedValue({}) },
      workspaceMember: {
        findFirst: jest.fn().mockResolvedValue({ userId: 'user_1' }),
      },
      paymentRecord: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(
        async (fn: (tx: typeof prismaTx) => Promise<void>) => {
          await fn(prismaTx);
        },
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: ConfigService, useValue: { get: () => 'whsec_test' } },
        { provide: PrismaService, useValue: prisma },
        {
          provide: SubscriptionsService,
          useValue: {
            applyTrustedCheckoutUsingClient: applyTrusted,
            syncFromStripeSubscription: syncFromStripe,
          },
        },
        {
          provide: SubscriptionEmailService,
          useValue: {
            sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(StripeWebhookService);
  });

  function makeEvent(
    type: string,
    object: Record<string, unknown>,
    id = `evt_${Date.now()}`,
  ) {
    (Stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id,
      type,
      data: { object },
    });
  }

  // ─── Test 1: customer.subscription.updated → syncFromStripeSubscription ──
  it('calls syncFromStripeSubscription on customer.subscription.updated', async () => {
    makeEvent('customer.subscription.updated', {
      id: 'sub_123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
      customer: 'cus_abc',
      metadata: { workspace_id: 'ws_1' },
    });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(syncFromStripe).toHaveBeenCalledTimes(1);
    expect(syncFromStripe).toHaveBeenCalledWith(
      prismaTx,
      expect.objectContaining({ id: 'sub_123', status: 'active' }),
      false,
    );
  });

  // ─── Test 2: customer.subscription.deleted → syncFromStripeSubscription with cancelled=true
  it('calls syncFromStripeSubscription with cancelled=true on customer.subscription.deleted', async () => {
    makeEvent('customer.subscription.deleted', {
      id: 'sub_123',
      status: 'canceled',
      current_period_end: Math.floor(Date.now() / 1000),
      customer: 'cus_abc',
      metadata: { workspace_id: 'ws_1' },
    });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(syncFromStripe).toHaveBeenCalledTimes(1);
    expect(syncFromStripe).toHaveBeenCalledWith(
      prismaTx,
      expect.objectContaining({ id: 'sub_123' }),
      true,
    );
  });

  // ─── Test 3: unknown event type → no-op (no applyTrusted, no sync) ──────
  it('does not call any handler for unknown event type', async () => {
    makeEvent('invoice.paid', { id: 'in_123' });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(applyTrusted).not.toHaveBeenCalled();
    expect(syncFromStripe).not.toHaveBeenCalled();
  });

  // ─── Test 4: checkout.session.completed with missing metadata → warn, no applyTrusted
  it('does not call applyTrusted when metadata is missing workspace_id', async () => {
    makeEvent('checkout.session.completed', {
      metadata: {},
      customer: 'cus_123',
      subscription: 'sub_456',
    });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(applyTrusted).not.toHaveBeenCalled();
  });

  // ─── Test 5: out-of-order events — deleted before updated ───────────────
  it('processes deleted event independently (out-of-order tolerance)', async () => {
    // First: deleted event
    makeEvent(
      'customer.subscription.deleted',
      {
        id: 'sub_123',
        status: 'canceled',
        customer: 'cus_abc',
        metadata: { workspace_id: 'ws_1' },
      },
      'evt_deleted',
    );
    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(syncFromStripe).toHaveBeenCalledWith(
      prismaTx,
      expect.objectContaining({ id: 'sub_123' }),
      true,
    );

    // Second: updated event (arrived late)
    syncFromStripe.mockClear();
    makeEvent(
      'customer.subscription.updated',
      {
        id: 'sub_123',
        status: 'active',
        customer: 'cus_abc',
        metadata: { workspace_id: 'ws_1' },
      },
      'evt_updated',
    );
    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(syncFromStripe).toHaveBeenCalledWith(
      prismaTx,
      expect.objectContaining({ id: 'sub_123' }),
      false,
    );
  });

  // ─── Test 6: duplicate event → returns { received: true, duplicate: true } ──
  it('returns duplicate flag when ProcessedWebhookEvent unique constraint fires', async () => {
    makeEvent(
      'customer.subscription.updated',
      {
        id: 'sub_123',
        status: 'active',
        customer: 'cus_abc',
        metadata: { workspace_id: 'ws_1' },
      },
      'evt_dup',
    );

    const prisma = {
      $transaction: jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      ),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: ConfigService, useValue: { get: () => 'whsec_test' } },
        { provide: PrismaService, useValue: prisma },
        {
          provide: SubscriptionsService,
          useValue: {
            applyTrustedCheckoutUsingClient: applyTrusted,
            syncFromStripeSubscription: syncFromStripe,
          },
        },
        {
          provide: SubscriptionEmailService,
          useValue: {
            sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    const dupService = moduleRef.get(StripeWebhookService);

    const result = await dupService.handleRawPayload(Buffer.from('{}'), 'sig');
    expect(result).toEqual({ received: true, duplicate: true });
  });

  // ─── Test 7: non-P2002 error → re-thrown ────────────────────────────────
  it('re-throws non-P2002 errors', async () => {
    makeEvent(
      'checkout.session.completed',
      {
        metadata: { workspace_id: 'ws_1', plan: 'PRO' },
        customer: 'cus_x',
        subscription: 'sub_y',
      },
      'evt_err',
    );

    const error = new Error('Database connection lost');
    const prisma = {
      $transaction: jest.fn().mockRejectedValue(error),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: ConfigService, useValue: { get: () => 'whsec_test' } },
        { provide: PrismaService, useValue: prisma },
        {
          provide: SubscriptionsService,
          useValue: {
            applyTrustedCheckoutUsingClient: applyTrusted,
            syncFromStripeSubscription: syncFromStripe,
          },
        },
        {
          provide: SubscriptionEmailService,
          useValue: {
            sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    const errService = moduleRef.get(StripeWebhookService);

    await expect(
      errService.handleRawPayload(Buffer.from('{}'), 'sig'),
    ).rejects.toThrow('Database connection lost');
  });

  // ─── Test 8: missing STRIPE_WEBHOOK_SECRET → ServiceUnavailable ──────────
  it('throws ServiceUnavailable when STRIPE_WEBHOOK_SECRET is not set', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        StripeWebhookService,
        { provide: ConfigService, useValue: { get: () => undefined } },
        { provide: PrismaService, useValue: {} },
        {
          provide: SubscriptionsService,
          useValue: {
            applyTrustedCheckoutUsingClient: applyTrusted,
            syncFromStripeSubscription: syncFromStripe,
          },
        },
        {
          provide: SubscriptionEmailService,
          useValue: {
            sendPaymentFailed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();
    const noSecretService = moduleRef.get(StripeWebhookService);

    await expect(
      noSecretService.handleRawPayload(Buffer.from('{}'), 'sig'),
    ).rejects.toThrow();
  });

  // ─── Test 9: missing signature → BadRequest ──────────────────────────────
  it('throws BadRequest when signature header is missing', async () => {
    makeEvent('checkout.session.completed', {
      metadata: { workspace_id: 'ws_1', plan: 'PRO' },
    });

    await expect(
      service.handleRawPayload(Buffer.from('{}'), undefined),
    ).rejects.toThrow();
  });
});
