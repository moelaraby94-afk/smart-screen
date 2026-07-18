import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { StripeWebhookController } from './stripe-webhook.controller';
import { StripeWebhookService } from './stripe-webhook.service';
import { WebhooksController } from './webhooks-customer.controller';
import { WebhooksService } from './webhooks.service';
import { WebhookDeliveryService } from './webhook-delivery.service';

@Module({
  imports: [AuthModule, SubscriptionsModule],
  controllers: [StripeWebhookController, WebhooksController],
  providers: [StripeWebhookService, WebhooksService, WebhookDeliveryService],
  exports: [WebhookDeliveryService],
})
export class WebhooksModule {}
