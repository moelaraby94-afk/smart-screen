import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/auth/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionStripeService } from './subscription-stripe.service';

@Module({
  imports: [AuthModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionStripeService, RolesGuard],
  exports: [SubscriptionsService, SubscriptionStripeService],
})
export class SubscriptionsModule {}
