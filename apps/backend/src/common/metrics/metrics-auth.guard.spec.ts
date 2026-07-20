import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetricsAuthGuard } from './metrics-auth.guard';

describe('MetricsAuthGuard', () => {
  let guard: MetricsAuthGuard;
  let configService: jest.Mocked<ConfigService>;

  const mockContext = (ip: string, authHeader?: string) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          ip,
          headers: authHeader ? { authorization: authHeader } : {},
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    configService = { get: jest.fn() } as unknown as jest.Mocked<ConfigService>;
    guard = new MetricsAuthGuard(configService);
  });

  it('allows localhost when no token is configured', () => {
    configService.get.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('127.0.0.1'))).toBe(true);
  });

  it('allows ::1 when no token is configured', () => {
    configService.get.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext('::1'))).toBe(true);
  });

  it('denies non-localhost when no token is configured', () => {
    configService.get.mockReturnValue(undefined);
    expect(() => guard.canActivate(mockContext('203.0.113.5'))).toThrow(
      ForbiddenException,
    );
  });

  it('allows request with valid bearer token', () => {
    configService.get.mockReturnValue('secret-token');
    expect(
      guard.canActivate(mockContext('203.0.113.5', 'Bearer secret-token')),
    ).toBe(true);
  });

  it('denies request with invalid bearer token', () => {
    configService.get.mockReturnValue('secret-token');
    expect(() =>
      guard.canActivate(mockContext('203.0.113.5', 'Bearer wrong-token')),
    ).toThrow(ForbiddenException);
  });

  it('denies request without authorization header when token is configured', () => {
    configService.get.mockReturnValue('secret-token');
    expect(() => guard.canActivate(mockContext('203.0.113.5'))).toThrow(
      ForbiddenException,
    );
  });

  it('denies request with malformed authorization header', () => {
    configService.get.mockReturnValue('secret-token');
    expect(() =>
      guard.canActivate(mockContext('203.0.113.5', 'Basic abc123')),
    ).toThrow(ForbiddenException);
  });
});
