import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Roles } from '../../common/auth/roles.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreatePortalDto } from './dto/create-portal.dto';
import { CUSTOMER_ROUTES } from '../../common/constants/route-prefixes';

/**
 * Authenticated Stripe Billing API (Checkout, etc.).
 * Webhooks stay under {@link WebhooksModule} at POST /webhooks/stripe.
 */
@Controller({ path: [...CUSTOMER_ROUTES.STRIPE] })
@UseGuards(JwtAuthGuard, RolesGuard)
export class StripeController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('checkout')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createCheckout(@CurrentUser() user: JwtUser, @Body() dto: CreateCheckoutDto) {
    return this.subscriptions.createStripeCheckoutSession(
      user.sub,
      dto.workspaceId,
      dto.plan,
    );
  }

  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @Post('portal')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  createPortal(@CurrentUser() user: JwtUser, @Body() dto: CreatePortalDto) {
    return this.subscriptions.createBillingPortalSession(
      user.sub,
      dto.workspaceId,
      dto.locale,
    );
  }
}
