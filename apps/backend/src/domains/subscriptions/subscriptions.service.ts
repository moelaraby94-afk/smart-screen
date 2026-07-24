import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import type { MockPlan } from './dto/set-mock-plan.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PlatformEvents } from '../../common/events/platform-events';
import { assertMockBillingAllowed } from '../../common/product/mock-billing';
import {
  fromStorageLimitBytes,
  toStorageLimitBytesInput,
} from '../../common/product/storage-limit';
import { SubscriptionStripeService } from './subscription-stripe.service';

const BYTES_5GB = 5 * 1024 * 1024 * 1024;
const BYTES_50GB = 50 * 1024 * 1024 * 1024;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly config: ConfigService,
    private readonly configHelper: ConfigHelper,
    private readonly stripeService: SubscriptionStripeService,
  ) {}

  private defaultsForPlan(plan: SubscriptionPlan): {
    seats: number;
    screenLimit: number;
    currentPeriodEnd: Date | null;
  } {
    const monthEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    switch (plan) {
      case SubscriptionPlan.FREE:
        return { seats: 5, screenLimit: 25, currentPeriodEnd: null };
      case SubscriptionPlan.STARTER:
        return { seats: 15, screenLimit: 100, currentPeriodEnd: monthEnd };
      case SubscriptionPlan.PRO:
        return { seats: 25, screenLimit: 500, currentPeriodEnd: monthEnd };
      case SubscriptionPlan.ENTERPRISE:
        return { seats: 100, screenLimit: 2000, currentPeriodEnd: monthEnd };
      default:
        return { seats: 5, screenLimit: 25, currentPeriodEnd: null };
    }
  }

  /**
   * Called after Stripe (or similar) verifies payment. Expects `workspaceId` + `plan`
   * in Checkout session metadata. Pass a transaction client when composing with other writes.
   */
  async applyTrustedCheckoutUsingClient(
    db: Prisma.TransactionClient,
    params: {
      workspaceId: string;
      plan: SubscriptionPlan;
      screenLimit?: number;
      seats?: number;
      currentPeriodEnd?: Date | null;
      storageLimitBytes?: number | null;
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
    },
  ) {
    const sub = await db.subscription.findUnique({
      where: { workspaceId: params.workspaceId },
    });
    if (!sub) {
      throw new NotFoundException('Subscription not found for workspace');
    }
    const d = this.defaultsForPlan(params.plan);
    const updated = await db.subscription.update({
      where: { workspaceId: params.workspaceId },
      data: {
        plan: params.plan,
        status: SubscriptionStatus.ACTIVE,
        seats: params.seats ?? d.seats,
        screenLimit: params.screenLimit ?? d.screenLimit,
        currentPeriodEnd:
          params.currentPeriodEnd !== undefined
            ? params.currentPeriodEnd
            : d.currentPeriodEnd,
        ...(params.storageLimitBytes !== undefined
          ? {
              storageLimitBytes: toStorageLimitBytesInput(
                params.storageLimitBytes,
              ),
            }
          : {}),
        ...(params.stripeCustomerId
          ? { stripeCustomerId: params.stripeCustomerId }
          : {}),
        ...(params.stripeSubscriptionId
          ? { stripeSubscriptionId: params.stripeSubscriptionId }
          : {}),
      },
    });
    return {
      workspaceId: updated.workspaceId,
      plan: updated.plan,
      status: updated.status,
      seats: updated.seats,
      screenLimit: updated.screenLimit,
      storageLimitBytes: fromStorageLimitBytes(updated.storageLimitBytes),
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
      startedAt: updated.startedAt.toISOString(),
    };
  }

  async applyTrustedCheckout(params: {
    workspaceId: string;
    plan: SubscriptionPlan;
    screenLimit?: number;
    seats?: number;
    currentPeriodEnd?: Date | null;
    storageLimitBytes?: number | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }) {
    return this.applyTrustedCheckoutUsingClient(
      this.prisma as unknown as Prisma.TransactionClient,
      params,
    );
  }

  async getCurrent(workspaceId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    if (!sub)
      throw new NotFoundException('Subscription not found for workspace');

    const activeScreenCount = await this.prisma.screen.count({
      where: { workspaceId, status: { not: 'MAINTENANCE' } },
    });

    const planPricing = this.perScreenPricingForPlan(sub.plan);

    return {
      workspaceId: sub.workspaceId,
      plan: sub.plan,
      status: sub.status,
      seats: sub.seats,
      screenLimit: sub.screenLimit,
      storageLimitBytes: fromStorageLimitBytes(sub.storageLimitBytes),
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
      startedAt: sub.startedAt.toISOString(),
      billingPortalAvailable: Boolean(sub.stripeCustomerId),
      activeScreenCount,
      perScreenPricing: planPricing,
      estimatedMonthlyTotal: this.estimateMonthlyTotal(
        sub.plan,
        activeScreenCount,
        planPricing,
      ),
    };
  }

  private perScreenPricingForPlan(plan: SubscriptionPlan): {
    basePrice: number;
    includedScreens: number;
    perScreenPrice: number;
    currency: string;
  } {
    switch (plan) {
      case SubscriptionPlan.FREE:
        return {
          basePrice: 0,
          includedScreens: 25,
          perScreenPrice: 0,
          currency: 'usd',
        };
      case SubscriptionPlan.STARTER:
        return {
          basePrice: 1900,
          includedScreens: 100,
          perScreenPrice: 15,
          currency: 'usd',
        };
      case SubscriptionPlan.PRO:
        return {
          basePrice: 4900,
          includedScreens: 500,
          perScreenPrice: 8,
          currency: 'usd',
        };
      case SubscriptionPlan.ENTERPRISE:
        return {
          basePrice: 19900,
          includedScreens: 2000,
          perScreenPrice: 5,
          currency: 'usd',
        };
      default:
        return {
          basePrice: 0,
          includedScreens: 25,
          perScreenPrice: 0,
          currency: 'usd',
        };
    }
  }

  private estimateMonthlyTotal(
    plan: SubscriptionPlan,
    activeScreens: number,
    pricing: {
      basePrice: number;
      includedScreens: number;
      perScreenPrice: number;
    },
  ): number {
    if (plan === SubscriptionPlan.FREE) return 0;
    const billableScreens = Math.max(
      0,
      activeScreens - pricing.includedScreens,
    );
    return pricing.basePrice + billableScreens * pricing.perScreenPrice;
  }

  async createBillingPortalSession(
    userId: string,
    workspaceId: string,
    locale?: string,
  ): Promise<{ url: string }> {
    return this.stripeService.createBillingPortalSession(
      userId,
      workspaceId,
      locale,
    );
  }

  async createStripeCheckoutSession(
    userId: string,
    workspaceId: string,
    plan: SubscriptionPlan,
  ): Promise<{ url: string | null }> {
    return this.stripeService.createStripeCheckoutSession(
      userId,
      workspaceId,
      plan,
    );
  }

  /**
   * Keeps workspace subscription row aligned with Stripe subscription lifecycle events.
   */
  async syncFromStripeSubscription(
    db: Prisma.TransactionClient,
    stripeSub: import('stripe').default.Subscription,
    cancelled: boolean,
  ): Promise<void> {
    return this.stripeService.syncFromStripeSubscription(
      db,
      stripeSub,
      cancelled,
    );
  }

  async setMockPlan(workspaceId: string, plan: MockPlan) {
    assertMockBillingAllowed();
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    if (!sub)
      throw new NotFoundException('Subscription not found for workspace');
    if (plan !== 'FREE' && plan !== 'PRO') {
      throw DomainException.badRequest(
        ErrorCode.UNSUPPORTED_PLAN,
        'Unsupported plan',
      );
    }

    const nextPlan =
      plan === 'PRO' ? SubscriptionPlan.PRO : SubscriptionPlan.FREE;
    const nextStatus =
      plan === 'PRO' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIALING;
    const nextSeats = plan === 'PRO' ? 25 : 5;
    const nextScreenLimit = plan === 'PRO' ? 500 : 25;
    const nextPeriodEnd =
      plan === 'PRO' ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null;
    const nextStorageLimit = plan === 'PRO' ? BYTES_50GB : BYTES_5GB;

    const updated = await this.prisma.subscription.update({
      where: { workspaceId },
      data: {
        plan: nextPlan,
        status: nextStatus,
        seats: nextSeats,
        screenLimit: nextScreenLimit,
        currentPeriodEnd: nextPeriodEnd,
        storageLimitBytes: toStorageLimitBytesInput(nextStorageLimit),
      },
    });

    const payload = {
      workspaceId: updated.workspaceId,
      plan: updated.plan,
      status: updated.status,
      seats: updated.seats,
      screenLimit: updated.screenLimit,
      storageLimitBytes: fromStorageLimitBytes(updated.storageLimitBytes),
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
      startedAt: updated.startedAt.toISOString(),
      mock: true,
    };
    this.eventEmitter.emit(PlatformEvents.WORKSPACE_SUBSCRIPTION_UPDATED, {
      workspaceId,
      payload,
    });

    return payload;
  }
}
