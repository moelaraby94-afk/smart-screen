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

describe('StripeWebhookService T3.4 (PaymentRecord creation)', () => {
  let service: StripeWebhookService;
  let applyTrusted: jest.Mock;
  let paymentRecordCreate: jest.Mock;
  let workspaceMemberFindFirst: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    (Stripe.webhooks.constructEvent as jest.Mock).mockReset();
    applyTrusted = jest.fn().mockResolvedValue({});
    paymentRecordCreate = jest.fn().mockResolvedValue({});
    workspaceMemberFindFirst = jest.fn();

    const prismaTx = {
      processedWebhookEvent: { create: jest.fn().mockResolvedValue({}) },
      workspaceMember: { findFirst: workspaceMemberFindFirst },
      paymentRecord: { create: paymentRecordCreate },
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
            syncFromStripeSubscription: jest.fn(),
          },
        },
      ],
    }).compile();
    service = moduleRef.get(StripeWebhookService);
  });

  function makeCheckoutEvent(
    overrides: Record<string, unknown> = {},
    id = `evt_${Date.now()}`,
  ) {
    (Stripe.webhooks.constructEvent as jest.Mock).mockReturnValue({
      id,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { workspace_id: 'ws_1', plan: 'PRO' },
          customer: 'cus_abc',
          subscription: 'sub_456',
          amount_total: 4900,
          currency: 'usd',
          ...overrides,
        },
      },
    });
  }

  it('creates a PaymentRecord when checkout.session.completed has valid metadata', async () => {
    workspaceMemberFindFirst.mockResolvedValue({ userId: 'user_owner' });
    makeCheckoutEvent();

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(applyTrusted).toHaveBeenCalledTimes(1);
    expect(workspaceMemberFindFirst).toHaveBeenCalledWith({
      where: { workspaceId: 'ws_1', role: 'OWNER' },
      select: { userId: true },
    });
    expect(paymentRecordCreate).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const callArg = paymentRecordCreate.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArg.data).toMatchObject({
      userId: 'user_owner',
      amountCents: 4900,
      currency: 'usd',
      status: 'paid',
      provider: 'stripe',
      externalId: 'cs_test_123',
    });
  });

  it('does not create PaymentRecord when workspace owner is not found', async () => {
    workspaceMemberFindFirst.mockResolvedValue(null);
    makeCheckoutEvent();

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(applyTrusted).toHaveBeenCalledTimes(1);
    expect(paymentRecordCreate).not.toHaveBeenCalled();
  });

  it('does not create PaymentRecord when metadata is missing', async () => {
    workspaceMemberFindFirst.mockResolvedValue({ userId: 'user_owner' });
    makeCheckoutEvent({ metadata: {} });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(applyTrusted).not.toHaveBeenCalled();
    expect(paymentRecordCreate).not.toHaveBeenCalled();
  });

  it('uses amount_total=0 when not present in session', async () => {
    workspaceMemberFindFirst.mockResolvedValue({ userId: 'user_owner' });
    makeCheckoutEvent({ amount_total: undefined });

    await service.handleRawPayload(Buffer.from('{}'), 'sig');

    expect(paymentRecordCreate).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const callArg = paymentRecordCreate.mock.calls[0][0];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    expect(callArg.data.amountCents).toBe(0);
  });
});
