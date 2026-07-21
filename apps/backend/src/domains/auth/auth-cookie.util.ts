import { randomBytes } from 'crypto';
import type { Response } from 'express';
import type { JwtAudience } from '../../common/auth/current-user.decorator';

type CookieConfig = {
  secure: boolean;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
};

function parseDurationToMs(value: string): number {
  const trimmed = value.trim().toLowerCase();
  const match = /^(\d+)([smhd])$/.exec(trimmed);
  if (!match) return Number(trimmed) * 1000 || 900000;

  const amount = Number(match[1]);
  const unit = match[2];
  if (unit === 's') return amount * 1000;
  if (unit === 'm') return amount * 60000;
  if (unit === 'h') return amount * 3600000;
  return amount * 86400000;
}

export function getCookieConfig(): CookieConfig {
  const secure =
    process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production';
  return {
    secure,
    accessMaxAgeMs: parseDurationToMs(
      process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    ),
    refreshMaxAgeMs: parseDurationToMs(
      process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    ),
  };
}

const LEGACY_ACCESS = 'cs_access_token';
const LEGACY_REFRESH = 'cs_refresh_token';
const LEGACY_CSRF = 'csrf_token';

const PLATFORM_ACCESS = '__Host-cs_platform_access';
const PLATFORM_REFRESH = '__Host-cs_platform_refresh';
const PLATFORM_CSRF = 'csrf_platform';

const CUSTOMER_ACCESS = '__Host-cs_customer_access';
const CUSTOMER_REFRESH = '__Host-cs_customer_refresh';
const CUSTOMER_CSRF = 'csrf_customer';

export function getCookieNames(audience: JwtAudience) {
  const config = getCookieConfig();
  const useHostPrefix = config.secure;

  if (audience === 'platform') {
    return {
      access: useHostPrefix ? PLATFORM_ACCESS : 'cs_platform_access',
      refresh: useHostPrefix ? PLATFORM_REFRESH : 'cs_platform_refresh',
      csrf: PLATFORM_CSRF,
    };
  }
  return {
    access: useHostPrefix ? CUSTOMER_ACCESS : 'cs_customer_access',
    refresh: useHostPrefix ? CUSTOMER_REFRESH : 'cs_customer_refresh',
    csrf: CUSTOMER_CSRF,
  };
}

export function setAuthCookies(
  response: Response,
  accessToken: string,
  refreshToken: string,
  audience: JwtAudience = 'customer',
): void {
  const config = getCookieConfig();
  const names = getCookieNames(audience);
  const sameSite = config.secure ? ('none' as const) : ('lax' as const);
  const common = {
    httpOnly: true,
    secure: config.secure,
    sameSite,
    path: '/',
  };

  response.cookie(names.access, accessToken, {
    ...common,
    maxAge: config.accessMaxAgeMs,
  });
  response.cookie(names.refresh, refreshToken, {
    ...common,
    maxAge: config.refreshMaxAgeMs,
  });

  const csrfToken = randomBytes(32).toString('hex');
  response.cookie(names.csrf, csrfToken, {
    httpOnly: false,
    secure: config.secure,
    sameSite,
    path: '/',
  });
}

export function clearAuthCookies(
  response: Response,
  audience?: JwtAudience,
): void {
  const config = getCookieConfig();
  const sameSite = config.secure ? ('none' as const) : ('lax' as const);
  const common = {
    httpOnly: true,
    secure: config.secure,
    sameSite,
    path: '/',
  };

  if (audience) {
    const names = getCookieNames(audience);
    response.clearCookie(names.access, common);
    response.clearCookie(names.refresh, common);
    response.clearCookie(names.csrf, {
      ...common,
      httpOnly: false,
    });
  }

  // Always clear legacy cookies for backward compat
  response.clearCookie(LEGACY_ACCESS, common);
  response.clearCookie(LEGACY_REFRESH, common);
  response.clearCookie(LEGACY_CSRF, { ...common, httpOnly: false });

  // Clear dev-mode (non-__Host-) cookies in case they were set
  response.clearCookie('cs_customer_access', common);
  response.clearCookie('cs_customer_refresh', common);
  response.clearCookie('cs_platform_access', common);
  response.clearCookie('cs_platform_refresh', common);
}

export function extractAccessTokenFromCookies(
  cookies: Record<string, string | undefined>,
): string | null {
  return (
    cookies?.[PLATFORM_ACCESS] ??
    cookies?.[CUSTOMER_ACCESS] ??
    cookies?.['cs_platform_access'] ??
    cookies?.['cs_customer_access'] ??
    cookies?.[LEGACY_ACCESS] ??
    null
  );
}

export function extractRefreshTokenFromCookies(
  cookies: Record<string, string | undefined>,
): string | null {
  return (
    cookies?.[PLATFORM_REFRESH] ??
    cookies?.[CUSTOMER_REFRESH] ??
    cookies?.['cs_platform_refresh'] ??
    cookies?.['cs_customer_refresh'] ??
    cookies?.[LEGACY_REFRESH] ??
    null
  );
}

export function extractCsrfTokenFromCookies(
  cookies: Record<string, string | undefined>,
): string | null {
  return (
    cookies?.[PLATFORM_CSRF] ??
    cookies?.[CUSTOMER_CSRF] ??
    cookies?.[LEGACY_CSRF] ??
    null
  );
}
