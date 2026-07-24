import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminIpGuard } from './admin-ip.guard';
import type { JwtUser } from './current-user.decorator';

function createMockContext(
  ip: string | undefined,
  user?: JwtUser,
): ExecutionContext {
  const request = { ip, user } as unknown as Request;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as unknown as ExecutionContext;
}

function createConfigService(allowedIps?: string): ConfigService {
  return {
    get: jest.fn((key: string) => {
      if (key === 'ADMIN_ALLOWED_IPS') return allowedIps;
      return undefined;
    }),
  } as unknown as ConfigService;
}

const platformUser: JwtUser = {
  sub: 'user-1',
  email: 'admin@test.com',
  aud: 'platform',
  isSuperAdmin: true,
};

const customerUser: JwtUser = {
  sub: 'user-2',
  email: 'customer@test.com',
  aud: 'customer',
  isSuperAdmin: false,
};

describe('AdminIpGuard', () => {
  it('allows all requests when ADMIN_ALLOWED_IPS is unset', () => {
    const guard = new AdminIpGuard(createConfigService(undefined));
    const ctx = createMockContext('203.0.113.5', platformUser);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows platform user from allowed IP', () => {
    const guard = new AdminIpGuard(createConfigService('10.0.0.1,10.0.0.2'));
    const ctx = createMockContext('10.0.0.1', platformUser);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('blocks platform user from non-allowed IP', () => {
    const guard = new AdminIpGuard(createConfigService('10.0.0.1,10.0.0.2'));
    const ctx = createMockContext('203.0.113.5', platformUser);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows customer user from any IP even when allowlist is set', () => {
    const guard = new AdminIpGuard(createConfigService('10.0.0.1'));
    const ctx = createMockContext('203.0.113.5', customerUser);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows unauthenticated requests (JwtAuthGuard handles auth)', () => {
    const guard = new AdminIpGuard(createConfigService('10.0.0.1'));
    const ctx = createMockContext('203.0.113.5', undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('handles whitespace in IP list', () => {
    const guard = new AdminIpGuard(
      createConfigService(' 10.0.0.1 , 10.0.0.2 '),
    );
    const ctx = createMockContext('10.0.0.2', platformUser);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('handles empty IP strings in list', () => {
    const guard = new AdminIpGuard(createConfigService('10.0.0.1,,10.0.0.2,'));
    const ctx = createMockContext('10.0.0.1', platformUser);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
