import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigHelper } from './config.helper';

function makeConfigService(
  values: Record<string, string | undefined>,
): ConfigService {
  return {
    get: <T>(key: string, defaultValue?: T): T => {
      const v = values[key];
      return (v ?? defaultValue) as T;
    },
  } as unknown as ConfigService;
}

describe('ConfigHelper', () => {
  describe('getFrontendBaseUrl', () => {
    it('returns the trimmed FRONTEND_ORIGIN with trailing slash removed', () => {
      const helper = new ConfigHelper(
        makeConfigService({ FRONTEND_ORIGIN: 'https://app.example.com/' }),
      );
      expect(helper.getFrontendBaseUrl()).toBe('https://app.example.com');
    });

    it('removes only one trailing slash', () => {
      const helper = new ConfigHelper(
        makeConfigService({ FRONTEND_ORIGIN: 'https://app.example.com' }),
      );
      expect(helper.getFrontendBaseUrl()).toBe('https://app.example.com');
    });

    it('falls back to http://localhost:3000 when FRONTEND_ORIGIN is unset', () => {
      const helper = new ConfigService(makeConfigService({}));
      const ch = new ConfigHelper(helper);
      expect(ch.getFrontendBaseUrl()).toBe('http://localhost:3000');
    });

    it('falls back to http://localhost:3000 when FRONTEND_ORIGIN is empty string', () => {
      const helper = new ConfigHelper(
        makeConfigService({ FRONTEND_ORIGIN: '   ' }),
      );
      expect(helper.getFrontendBaseUrl()).toBe('http://localhost:3000');
    });

    it('trims whitespace around the origin', () => {
      const helper = new ConfigHelper(
        makeConfigService({ FRONTEND_ORIGIN: '  https://app.example.com  ' }),
      );
      expect(helper.getFrontendBaseUrl()).toBe('https://app.example.com');
    });
  });

  describe('requireStripeSecretKey', () => {
    it('returns the trimmed Stripe secret key when set', () => {
      const helper = new ConfigHelper(
        makeConfigService({ STRIPE_SECRET_KEY: '  sk_test_123  ' }),
      );
      expect(helper.requireStripeSecretKey()).toBe('sk_test_123');
    });

    it('throws ServiceUnavailableException when key is unset', () => {
      const helper = new ConfigHelper(makeConfigService({}));
      expect(() => helper.requireStripeSecretKey()).toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws ServiceUnavailableException when key is whitespace only', () => {
      const helper = new ConfigHelper(
        makeConfigService({ STRIPE_SECRET_KEY: '   ' }),
      );
      expect(() => helper.requireStripeSecretKey()).toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws with the exact message "Stripe is not configured"', () => {
      const helper = new ConfigHelper(makeConfigService({}));
      expect(() => helper.requireStripeSecretKey()).toThrow(
        'Stripe is not configured',
      );
    });
  });
});
