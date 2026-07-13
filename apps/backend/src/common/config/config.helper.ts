import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Shared config-reading helpers that eliminate duplicated boilerplate for
 * reading and normalizing environment-dependent values.
 */
@Injectable()
export class ConfigHelper {
  constructor(private readonly config: ConfigService) {}

  /**
   * Returns the FRONTEND_ORIGIN with any trailing slash removed.
   * Falls back to `http://localhost:3000` when unset.
   *
   * Used by invitation emails, Stripe redirect URLs, and password-reset links.
   */
  getFrontendBaseUrl(): string {
    const origin =
      this.config.get<string>('FRONTEND_ORIGIN')?.trim() ||
      'http://localhost:3000';
    return origin.replace(/\/$/, '');
  }

  /**
   * Returns the Stripe secret key, or throws `ServiceUnavailableException`
   * when `STRIPE_SECRET_KEY` is not configured.
   *
   * Used by billing portal, checkout session, and invoice download.
   */
  requireStripeSecretKey(): string {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    if (!secret) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }
    return secret;
  }
}
