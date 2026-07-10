import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { StripeWebhookService } from './stripe-webhook.service';

/**
 * Never rate limited. Stripe delivers bursts and retries with backoff; a 429
 * would drop billing events. The endpoint is protected instead by mandatory
 * signature verification plus an idempotency key on (provider, externalId).
 */
@SkipThrottle()
@Controller('webhooks/stripe')
export class StripeWebhookController {
  constructor(private readonly stripeWebhooks: StripeWebhookService) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Req() req: Request,
    @Headers('stripe-signature') signature: string | undefined,
  ) {
    const raw: unknown = req.body;
    if (!Buffer.isBuffer(raw)) {
      throw new BadRequestException('Expected raw webhook body');
    }
    return this.stripeWebhooks.handleRawPayload(raw, signature);
  }
}
