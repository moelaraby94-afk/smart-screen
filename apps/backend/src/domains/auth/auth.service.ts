import { Injectable, Logger } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';
import { AuthCredentialsService } from './auth-credentials.service';
import { AuthImpersonationService } from './auth-impersonation.service';
import { AuthProfileService } from './auth-profile.service';
import type { TokenPair, LoginResult } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { LoginTwoFactorDto } from './dto/login-two-factor.dto';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * Facade service that delegates to the four split auth services.
 * Kept for backward compatibility — controllers and consumers
 * should migrate to injecting the specific services directly.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: AuthTokenService,
    private readonly credentialsService: AuthCredentialsService,
    private readonly impersonationService: AuthImpersonationService,
    private readonly profileService: AuthProfileService,
  ) {}

  async registerStart(dto: RegisterStartDto) {
    return this.credentialsService.registerStart(dto);
  }

  async registerResend(emailRaw: string) {
    return this.credentialsService.registerResend(emailRaw);
  }

  async registerVerify(dto: RegisterVerifyDto) {
    return this.credentialsService.registerVerify(dto);
  }

  async forgotPassword(emailRaw: string) {
    return this.credentialsService.forgotPassword(emailRaw);
  }

  async resetPassword(dto: ResetPasswordDto) {
    return this.credentialsService.resetPassword(dto);
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResult> {
    return this.credentialsService.login(dto, ipAddress);
  }

  async loginWithTwoFactor(
    dto: LoginTwoFactorDto,
    ipAddress?: string,
  ): Promise<Exclude<LoginResult, { requiresTwoFactor: true }>> {
    return this.credentialsService.loginWithTwoFactor(dto, ipAddress);
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    return this.tokenService.refreshTokens(refreshToken);
  }

  async logout(userId: string): Promise<void> {
    return this.tokenService.logout(userId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    return this.tokenService.revokeAllSessions(userId);
  }

  async issueImpersonation(actorUserId: string, targetUserId: string) {
    return this.impersonationService.issueImpersonation(
      actorUserId,
      targetUserId,
    );
  }

  async exitImpersonation(
    jwtUser: { sub: string; impersonatedBy?: string },
    ipAddress?: string,
  ) {
    return this.impersonationService.exitImpersonation(jwtUser, ipAddress);
  }

  async me(userId: string, impersonatedBy?: string) {
    return this.profileService.me(userId, impersonatedBy);
  }

  async logTwoFactorAction(userId: string, action: string): Promise<void> {
    return this.profileService.logTwoFactorAction(userId, action);
  }
}
