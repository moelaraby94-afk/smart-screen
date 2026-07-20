import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Validates the `x-player-secret` header against the screen's
 * `pairingSecretHash` for kiosk player endpoints.
 *
 * Reads `serialNumber` from the query string and `x-player-secret` from
 * the request headers. If either is missing or the secret does not match,
 * the request is rejected with 401.
 *
 * This guard formalizes player authentication as a separate concern from
 * the service layer, following the Phase 11.4 architectural separation.
 */
@Injectable()
export class PlayerSecretGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const serialNumber: string | undefined = request.query?.serialNumber;
    const secret: string | undefined = request.headers?.['x-player-secret'];

    if (!serialNumber?.trim() || !secret) {
      throw new UnauthorizedException('Invalid player credentials');
    }

    const screen = await this.prisma.screen.findFirst({
      where: { serialNumber: serialNumber.trim() },
      select: {
        id: true,
        pairingSecretHash: true,
      },
    });

    if (!screen || !screen.pairingSecretHash) {
      throw new UnauthorizedException('Invalid player credentials');
    }

    const isValid = await bcrypt.compare(secret, screen.pairingSecretHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid player credentials');
    }

    request.playerScreenId = screen.id;
    return true;
  }
}
