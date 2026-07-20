import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
} from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';

/**
 * Stripe-specific subscription operations: checkout sessions, billing portal, webhook sync.
 * Extracted from SubscriptionsService to reduce file size and improve cohesion.
 */
@Injectable()
export class SubscriptionStripeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly configHelper: ConfigHelper,
  ) {}

  async createBillingPortalSession(
    userId: string,
    workspaceId: string,
    locale?: string,
  ): Promise<{ url: string }> {
    const secret = this.configHelper.requireStripeSecretKey();
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (
      !membership ||
      (membership.role !== UserRole.OWNER && membership.role !== UserRole.ADMIN)
    ) {
      throw new ForbiddenException();
    }
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException(
        'No Stripe customer on file. Complete a paid checkout first.',
      );
    }
    const base = this.configHelper.getFrontendBaseUrl();
    const lang = (locale ?? 'en').split('-')[0] || 'en';
    const returnUrl =
      this.config.get<string>('STRIPE_PORTAL_RETURN_URL')?.trim() ??
      `${base}/${lang}/settings/billing`;

    const stripe = new Stripe(secret);
    const portal = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    if (!portal.url) {
      throw new ServiceUnavailableException('Stripe portal URL missing');
    }
    return { url: portal.url };
  }

  async createStripeCheckoutSession(
    userId: string,
    workspaceId: string,
    plan: SubscriptionPlan,
  ): Promise<{ url: string | null }> {
    if (plan === SubscriptionPlan.FREE) {
      throw new BadRequestException('Use workspace billing to stay on Free');
    }
    const secret = this.configHelper.requireStripeSecretKey();
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
    });
    if (
      !membership ||
      (membership.role !== UserRole.OWNER && membership.role !== UserRole.ADMIN)
    ) {
      throw new ForbiddenException();
    }
    const priceId = this.stripePriceIdForPlan(plan);
    if (!priceId) {
      throw new BadRequestException(
        `Stripe price ID not configured for plan ${plan}`,
      );
    }
    const base = this.configHelper.getFrontendBaseUrl();
    const successUrl =
      this.config.get<string>('STRIPE_CHECKOUT_SUCCESS_URL')?.trim() ??
      `${base}/en/billing?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      this.config.get<string>('STRIPE_CHECKOUT_CANCEL_URL')?.trim() ??
      `${base}/en/billing?checkout=canceled`;

    const existingSub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
      select: { stripeCustomerId: true },
    });

    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: workspaceId,
      ...(existingSub?.stripeCustomerId
        ? { customer: existingSub.stripeCustomerId }
        : {}),
      metadata: {
        workspace_id: workspaceId,
        plan,
      },
      subscription_data: {
        metadata: {
          workspace_id: workspaceId,
          plan,
        },
      },
    });
    return { url: session.url };
  }

  private stripePriceIdForPlan(plan: SubscriptionPlan): string | null {
    const key =
      plan === SubscriptionPlan.PRO
        ? 'STRIPE_PRICE_ID_PRO'
        : plan === SubscriptionPlan.STARTER
          ? 'STRIPE_PRICE_ID_STARTER'
          : plan === SubscriptionPlan.ENTERPRISE
            ? 'STRIPE_PRICE_ID_ENTERPRISE'
            : '';
    if (!key) return null;
    return this.config.get<string>(key)?.trim() ?? null;
  }

  async syncFromStripeSubscription(
    db: Prisma.TransactionClient,
    stripeSub: Stripe.Subscription,
    cancelled: boolean,
  ): Promise<void> {
    const md = stripeSub.metadata ?? {};
    const workspaceId = (
      (md.workspace_id as string | undefined) ??
      (md.workspaceId as string | undefined)
    )?.trim();
    if (!workspaceId) {
      return;
    }
    const exists = await db.subscription.findUnique({
      where: { workspaceId },
    });
    if (!exists) return;

    let status: SubscriptionStatus = SubscriptionStatus.ACTIVE;
    if (cancelled) {
      status = SubscriptionStatus.CANCELED;
    } else if (
      stripeSub.status === 'past_due' ||
      stripeSub.status === 'unpaid'
    ) {
      status = SubscriptionStatus.PAST_DUE;
    } else if (stripeSub.status === 'canceled') {
      status = SubscriptionStatus.CANCELED;
    } else if (stripeSub.status === 'trialing') {
      status = SubscriptionStatus.TRIALING;
    } else if (stripeSub.status === 'active' || stripeSub.status === 'paused') {
      status = SubscriptionStatus.ACTIVE;
    }

    const periodEndSec = stripeSub.current_period_end;
    const currentPeriodEnd =
      typeof periodEndSec === 'number' ? new Date(periodEndSec * 1000) : null;

    const customerRef = stripeSub.customer;
    const stripeCustomerId =
      typeof customerRef === 'string'
        ? customerRef
        : customerRef && !customerRef.deleted
          ? customerRef.id
          : undefined;

    await db.subscription.update({
      where: { workspaceId },
      data: {
        status,
        currentPeriodEnd,
        canceledAt: cancelled ? new Date() : null,
        stripeSubscriptionId: stripeSub.id,
        ...(stripeCustomerId ? { stripeCustomerId } : {}),
      },
    });
  }
}
