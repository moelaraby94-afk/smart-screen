import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import Stripe from 'stripe';
import { StripeWebhookService } from './stripe-webhook.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

jest.mock('stripe', () => ({
  __esModule: true,
  default: class StripeMock {
    static webhooks: { constructEvent: jest.Mock } = {
      constructEvent: jest.fn(),
    };
  },
}));

describe('StripeWebhookService T3.5 (missing webhook handlers)', () => {
  let service: StripeWebhookService;
  let syncFromStripe: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    (Stripe.webhooks.constructEvent as jest.Mock).mockReset();
    syncFromStripe = jest.fn().mockResolvedValue(undefined);

    const prismaTx = {
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
            applyTrustedCheckoutUsingClient: jest.fn(),
            syncFromStripeSubscription: syncFromStripe,
          },
        },
      ],
    }).compile();
    service = moduleRef.get(StripeWebhookService);
  });

  it('calls syncFromStripeSubscription on customer.subscription.created', async () => {
    (Stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_sub_created',
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_new',
          status: 'active',
          current_period_end: Math.floor(Date.now() / 1000) + 86400,
          customer: 'cus_abc',
          metadata: { workspace_id: 'ws_1' },
        },
      },
    });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(syncFromStripe).toHaveBeenCalledTimes(1);
    expect(syncFromStripe).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ id: 'sub_new', status: 'active' }),
      false,
    );
  });

  it('handles invoice.payment_failed without throwing', async () => {
    (Stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_invoice_failed',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_123',
          subscription: 'sub_456',
        },
      },
    });

    const result = await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true });
    expect(syncFromStripe).not.toHaveBeenCalled();
  });

  it('handles invoice.payment_failed with null subscription gracefully', async () => {
    (Stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id: 'evt_invoice_failed_2',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_124',
          subscription: null,
        },
      },
    });

    const result = await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(result).toEqual({ received: true });
  });
});
