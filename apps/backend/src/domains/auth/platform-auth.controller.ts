import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthTokenService } from './auth-token.service';
import { AuthImpersonationService } from './auth-impersonation.service';
import { ExchangeTokenService } from './exchange-token.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { setAuthCookies } from './auth-cookie.util';
import { ExchangeTokenDto } from './dto/exchange-token.dto';
import { PLATFORM_ROUTES } from '../../common/constants/route-prefixes';
import type { Request, Response } from 'express';

/**
 * Platform-only auth operations: impersonation exit and token exchange.
 * These endpoints are used by platform staff (super admins, support specialists)
 * and service-to-service flows (player bootstrap, mobile exchange).
 *
 * Legacy paths under `auth/*` are preserved for backward compatibility.
 * New paths under `platform/auth/*` are the canonical location.
 */
@Controller({ path: [...PLATFORM_ROUTES.AUTH] })
export class PlatformAuthController {
  constructor(
    private readonly tokenService: AuthTokenService,
    private readonly impersonationService: AuthImpersonationService,
    private readonly exchangeTokenService: ExchangeTokenService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('exit-impersonation')
  async exitImpersonation(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const result = await this.impersonationService.exitImpersonation(
      user,
      request.ip,
    );
    setAuthCookies(
      response,
      result.accessToken,
      result.refreshToken,
      result.user.audience,
    );
    return {
      accessToken: result.accessToken,
      user: result.user,
      workspaces: result.workspaces,
    };
  }

  @HttpCode(200)
  @Post('exchange')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async exchangeToken(@Body() dto: ExchangeTokenDto) {
    const redeemed = await this.exchangeTokenService.redeem(dto.token);
    const tokens = await this.tokenService.issueTokensForUser(
      redeemed.targetUserId,
      redeemed.workspaceId ?? undefined,
      redeemed.actorUserId,
    );
    return tokens;
  }
}
