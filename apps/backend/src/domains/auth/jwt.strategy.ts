import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Request } from 'express';
import type {
  JwtAudience,
  JwtUser,
} from '../../common/auth/current-user.decorator';
import { extractAccessTokenFromCookies } from './auth-cookie.util';

type JwtPayload = {
  sub: string;
  email: string;
  aud?: JwtAudience;
  isSuperAdmin?: boolean;
  platformStaffRole?: import('@prisma/client').PlatformStaffRole;
  impersonatedBy?: string;
  /** See TokenPayload in auth.service.ts. Absent on pre-`typ` tokens. */
  typ?: 'access' | 'refresh';
  sid?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          request?.cookies
            ? extractAccessTokenFromCookies(
                request.cookies as Record<string, string | undefined>,
              )
            : null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_ACCESS_SECRET',
        'dev-access-secret',
      ),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtUser> {
    /**
     * A refresh token must never authenticate a request. It only differs from
     * an access token by signing key and lifetime, so if the two keys were ever
     * set to the same value this is what stops a long-lived refresh token from
     * being replayed as a Bearer credential.
     */
    if (payload.typ === 'refresh') {
      throw new UnauthorizedException('Invalid access token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
      },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('User is not active');

    // Backward compat: old tokens without aud default to 'customer'
    const aud: JwtAudience = payload.aud ?? 'customer';

    return {
      sub: user.id,
      email: user.email,
      aud,
      isSuperAdmin: user.isSuperAdmin === true,
      platformStaffRole: user.platformStaffRole ?? undefined,
      impersonatedBy: payload.impersonatedBy,
      sid: payload.sid,
    };
  }
}
