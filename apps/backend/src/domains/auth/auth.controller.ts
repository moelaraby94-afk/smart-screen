import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { LoginDto } from './dto/login.dto';
import { LoginTwoFactorDto } from './dto/login-two-factor.dto';
import { VerifyTwoFactorDto } from './dto/verify-two-factor.dto';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { RegisterResendDto } from './dto/register-resend.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { JwtUser } from '../../common/auth/current-user.decorator';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { clearAuthCookies, setAuthCookies } from './auth-cookie.util';
import type { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
  ) {}

  @HttpCode(200)
  @Post('register/start')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async registerStart(@Body() dto: RegisterStartDto) {
    return this.authService.registerStart(dto);
  }

  @HttpCode(200)
  @Post('register/resend')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async registerResend(@Body() dto: RegisterResendDto) {
    return this.authService.registerResend(dto.email);
  }

  /** 6-digit OTP: without a tight budget it is brute-forceable inside its 15-minute TTL. */
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register/verify')
  async registerVerify(
    @Body() dto: RegisterVerifyDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.registerVerify(dto);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      workspaces: result.workspaces,
      accessToken: result.accessToken,
    };
  }

  @HttpCode(200)
  @Post('forgot-password')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  /**
   * The prime credential-stuffing target, and it had no limit of its own — it
   * inherited only the module-wide default. Per IP; a per-account lockout is
   * tracked separately.
   */
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const result = await this.authService.login(dto, request.ip);
    if ('requiresTwoFactor' in result) {
      return result;
    }
    setAuthCookies(response, result.accessToken, result.refreshToken);

    return {
      user: result.user,
      workspaces: result.workspaces,
      accessToken: result.accessToken,
    };
  }

  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('login-2fa')
  async loginWithTwoFactor(
    @Body() dto: LoginTwoFactorDto,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const result = await this.authService.loginWithTwoFactor(dto, request.ip);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      user: result.user,
      workspaces: result.workspaces,
      accessToken: result.accessToken,
    };
  }

  @HttpCode(200)
  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.cs_refresh_token as
      | string
      | undefined;
    const result = await this.authService.refreshTokens(refreshToken ?? '');
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return { success: true, accessToken: result.accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: JwtUser) {
    return this.authService.me(user.sub, user.impersonatedBy);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('exit-impersonation')
  async exitImpersonation(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response,
    @Req() request: Request,
  ) {
    const result = await this.authService.exitImpersonation(user, request.ip);
    setAuthCookies(response, result.accessToken, result.refreshToken);
    return {
      accessToken: result.accessToken,
      user: result.user,
      workspaces: result.workspaces,
    };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  @Post('logout')
  async logout(
    @CurrentUser() user: JwtUser,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.sub);
    clearAuthCookies(response);
  }

  // ─── 2FA Management ─────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async get2faStatus(@CurrentUser() user: JwtUser) {
    const enabled = await this.twoFactorService.isTwoFactorEnabled(user.sub);
    return { enabled };
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Post('2fa/setup')
  async setup2fa(@CurrentUser() user: JwtUser) {
    const userData = await this.authService.me(user.sub, user.impersonatedBy);
    if (!userData) throw new NotFoundException('User not found');
    return this.twoFactorService.generateSecret(userData.email);
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('2fa/enable')
  async enable2fa(
    @CurrentUser() user: JwtUser,
    @Body() dto: VerifyTwoFactorDto,
  ) {
    if (!dto.secret) {
      throw new BadRequestException('Secret is required');
    }
    const result = await this.twoFactorService.enableTwoFactor(
      user.sub,
      dto.secret,
      dto.token,
    );
    await this.authService.logTwoFactorAction(user.sub, '2FA_ENABLED');
    return result;
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('2fa/disable')
  async disable2fa(
    @CurrentUser() user: JwtUser,
    @Body() dto: VerifyTwoFactorDto,
  ) {
    const enabled = await this.twoFactorService.isTwoFactorEnabled(user.sub);
    if (!enabled) {
      return { ok: true };
    }
    if (!dto.token?.trim()) {
      throw new BadRequestException('Verification code is required');
    }
    await this.twoFactorService.disableTwoFactor(user.sub, dto.token);
    await this.authService.logTwoFactorAction(user.sub, '2FA_DISABLED');
    return { ok: true };
  }
}
