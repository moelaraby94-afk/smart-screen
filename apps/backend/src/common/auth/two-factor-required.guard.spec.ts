import { ExecutionContext } from '@nestjs/common';
import { TwoFactorService } from '../../domains/auth/two-factor.service';
import { TwoFactorRequiredGuard } from './two-factor-required.guard';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';

describe('TwoFactorRequiredGuard', () => {
  let guard: TwoFactorRequiredGuard;
  let twoFactorService: jest.Mocked<TwoFactorService>;

  function createContext(user: { sub: string } | undefined): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    twoFactorService = {
      isTwoFactorEnabled: jest.fn(),
    } as unknown as jest.Mocked<TwoFactorService>;
    guard = new TwoFactorRequiredGuard(twoFactorService);
  });

  it('allows access when 2FA is enabled', async () => {
    twoFactorService.isTwoFactorEnabled.mockResolvedValue(true);

    const result = await guard.canActivate(createContext({ sub: 'user_1' }));

    expect(result).toBe(true);
    expect(twoFactorService.isTwoFactorEnabled).toHaveBeenCalledWith('user_1');
  });

  it('throws TWO_FACTOR_REQUIRED when 2FA is not enabled', async () => {
    twoFactorService.isTwoFactorEnabled.mockResolvedValue(false);

    await expect(
      guard.canActivate(createContext({ sub: 'user_1' })),
    ).rejects.toThrow(DomainException);

    try {
      await guard.canActivate(createContext({ sub: 'user_1' }));
    } catch (e) {
      expect(e).toBeInstanceOf(DomainException);
      expect((e as DomainException).code).toBe(ErrorCode.TWO_FACTOR_REQUIRED);
    }
  });

  it('throws UNAUTHORIZED when no user in request', async () => {
    await expect(guard.canActivate(createContext(undefined))).rejects.toThrow(
      DomainException,
    );

    try {
      await guard.canActivate(createContext(undefined));
    } catch (e) {
      expect((e as DomainException).code).toBe(ErrorCode.UNAUTHORIZED);
    }
  });
});
