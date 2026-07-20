import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TwoFactorService } from '../../domains/auth/two-factor.service';
import { DomainException } from '../errors/domain.exception';
import { ErrorCode } from '../errors/error-codes';
import type { JwtUser } from '../auth/current-user.decorator';

/**
 * Guard that requires the authenticated user to have 2FA enabled.
 *
 * Applied to privilege-escalation endpoints (e.g. staff role changes,
 * customer activation/deactivation) so that a compromised JWT alone
 * cannot escalate privileges without also having the user's TOTP device.
 *
 * Returns 403 with `TWO_FACTOR_REQUIRED` if 2FA is not enabled.
 */
@Injectable()
export class TwoFactorRequiredGuard implements CanActivate {
  constructor(private readonly twoFactorService: TwoFactorService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: JwtUser;
    }>();

    const user = request.user;
    if (!user?.sub) {
      throw DomainException.unauthorized(
        ErrorCode.UNAUTHORIZED,
        'Authentication required',
      );
    }

    const enabled = await this.twoFactorService.isTwoFactorEnabled(user.sub);
    if (!enabled) {
      throw DomainException.forbidden(
        ErrorCode.TWO_FACTOR_REQUIRED,
        'Two-factor authentication is required for this action',
      );
    }

    return true;
  }
}
