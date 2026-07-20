import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriptionPlan, UserRole } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { SubscriptionEmailService } from '../email/subscription-email.service';

const DUNNING_GRACE_PERIOD_DAYS = 7;

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly subscriptions: SubscriptionsService,
    private readonly subscriptionEmail: SubscriptionEmailService,
  ) {}

  private parsePlan(raw: string | undefined): SubscriptionPlan | null {
    if (!raw?.trim()) return null;
    const v = raw.trim().toUpperCase() as SubscriptionPlan;
    return Object.values(SubscriptionPlan).includes(v) ? v : null;
  }

  private parseIntMd(value: string | undefined): number | undefined {
    if (value === undefined || value === '') return undefined;
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : undefined;
  }

  async handleRawPayload(
    rawBody: Buffer,
    signature: string | undefined,
  ): Promise<{ received: true; duplicate?: boolean }> {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!secret?.trim()) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET is not set; refusing webhook');
      throw new ServiceUnavailableException(
        'Stripe webhooks are not configured',
      );
    }
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    let event: Stripe.Event;
    try {
      event = Stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch (err) {
      this.logger.warn(`Stripe signature verification failed: ${String(err)}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.processedWebhookEvent.create({
          data: { provider: 'stripe', externalId: event.id },
        });

        if (event.type === 'checkout.session.completed') {
          const session = event.data.object;
          const md = session.metadata ?? {};
          const workspaceId = (md.workspace_id ?? md.workspaceId)?.trim();
          const plan = this.parsePlan(md.plan ?? md.subscription_plan);
          if (workspaceId && plan) {
            const screenLimit = this.parseIntMd(
              md.screen_limit ?? md.screenLimit,
            );
            const seats = this.parseIntMd(md.seats);
            const storageLimitBytes = this.parseIntMd(
              md.storage_limit_bytes ?? md.storageLimitBytes,
            );

            let currentPeriodEnd: Date | null | undefined;
            const endRaw = md.current_period_end ?? md.currentPeriodEnd;
            if (endRaw) {
              const d = new Date(endRaw);
              currentPeriodEnd = Number.isNaN(d.getTime()) ? undefined : d;
            }

            const customerId =
              typeof session.customer === 'string'
                ? session.customer
                : session.customer?.id;
            const subscriptionId =
              typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription &&
                    typeof session.subscription === 'object'
                  ? (session.subscription as { id?: string }).id
                  : undefined;

            const invoiceId =
              typeof session.invoice === 'string'
                ? session.invoice
                : session.invoice && typeof session.invoice === 'object'
                  ? (session.invoice as { id?: string }).id
                  : undefined;

            await this.subscriptions.applyTrustedCheckoutUsingClient(tx, {
              workspaceId,
              plan,
              screenLimit,
              seats,
              currentPeriodEnd,
              storageLimitBytes,
              stripeCustomerId: customerId ?? undefined,
              stripeSubscriptionId: subscriptionId ?? undefined,
            });

            const owner = await tx.workspaceMember.findFirst({
              where: { workspaceId, role: UserRole.OWNER },
              select: { userId: true },
            });
            if (owner) {
              const amountTotal = session.amount_total ?? 0;
              const currency = session.currency ?? 'usd';
              await tx.paymentRecord.create({
                data: {
                  userId: owner.userId,
                  amountCents: amountTotal,
                  currency,
                  status: 'paid',
                  provider: 'stripe',
                  externalId: session.id,
                  invoiceRef: invoiceId ?? undefined,
                  paidAt: new Date(),
                  metadata: {
                    workspaceId,
                    plan,
                    subscriptionId: subscriptionId ?? null,
                    customerId: customerId ?? null,
                  },
                },
              });
            }
          } else {
            this.logger.warn(
              'checkout.session.completed missing workspace_id or plan in metadata',
            );
          }
        } else if (
          event.type === 'customer.subscription.updated' ||
          event.type === 'customer.subscription.deleted' ||
          event.type === 'customer.subscription.created'
        ) {
          const stripeSub = event.data.object;
          await this.subscriptions.syncFromStripeSubscription(
            tx,
            stripeSub,
            event.type === 'customer.subscription.deleted',
          );
        } else if (event.type === 'invoice.payment_succeeded') {
          const invoice = event.data.object;
          const subscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : undefined;
          const workspaceId = await this.findWorkspaceIdBySubscription(
            tx,
            subscriptionId,
          );
          if (workspaceId) {
            const owner = await tx.workspaceMember.findFirst({
              where: { workspaceId, role: UserRole.OWNER },
              select: { userId: true },
            });
            if (owner) {
              await tx.paymentRecord.create({
                data: {
                  userId: owner.userId,
                  amountCents: invoice.amount_paid ?? 0,
                  currency: invoice.currency ?? 'usd',
                  status: 'SUCCEEDED',
                  provider: 'stripe',
                  externalId: invoice.id,
                  invoiceRef: invoice.id,
                  paidAt: new Date(),
                  metadata: {
                    workspaceId,
                    subscriptionId: subscriptionId ?? null,
                  },
                },
              });
            }
          }
        } else if (event.type === 'invoice.payment_failed') {
          const invoice = event.data.object;
          const subscriptionId =
            typeof invoice.subscription === 'string'
              ? invoice.subscription
              : undefined;
          const workspaceId = await this.findWorkspaceIdBySubscription(
            tx,
            subscriptionId,
          );
          if (workspaceId) {
            const owner = await tx.workspaceMember.findFirst({
              where: { workspaceId, role: UserRole.OWNER },
              select: {
                userId: true,
                user: { select: { email: true, fullName: true } },
              },
            });
            if (owner) {
              await tx.paymentRecord.create({
                data: {
                  userId: owner.userId,
                  amountCents: invoice.amount_due ?? 0,
                  currency: invoice.currency ?? 'usd',
                  status: 'FAILED',
                  provider: 'stripe',
                  externalId: invoice.id,
                  invoiceRef: invoice.id,
                  metadata: {
                    workspaceId,
                    subscriptionId: subscriptionId ?? null,
                  },
                },
              });

              // Set grace period: 7 days from now
              const gracePeriodEndsAt = new Date(
                Date.now() + DUNNING_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
              );
              await tx.subscription.update({
                where: { workspaceId },
                data: { gracePeriodEndsAt },
              });

              // Send dunning email (best-effort, non-blocking)
              const ownerEmail = owner.user.email;
              const ownerName = owner.user.fullName || ownerEmail;
              this.subscriptionEmail
                .sendPaymentFailed(
                  ownerEmail,
                  ownerName,
                  DUNNING_GRACE_PERIOD_DAYS,
                )
                .catch((err) => {
                  this.logger.error(
                    `Failed to send dunning email to ${ownerEmail}: ${String(err)}`,
                  );
                });

              this.logger.warn(
                `Payment failed for workspace ${workspaceId}, grace period set to ${gracePeriodEndsAt.toISOString()}`,
              );
            }
          }
          this.logger.warn(
            `Invoice payment failed for subscription ${subscriptionId ?? 'unknown'} (invoice ${invoice.id})`,
          );
        }
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return { received: true, duplicate: true };
      }
      throw e;
    }

    return { received: true };
  }

  private async findWorkspaceIdBySubscription(
    tx: Prisma.TransactionClient,
    subscriptionId: string | undefined,
  ): Promise<string | null> {
    if (!subscriptionId) return null;
    const sub = await tx.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId },
      select: { workspaceId: true },
    });
    return sub?.workspaceId ?? null;
  }
}
