import { randomBytes } from 'crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { OtpHelper } from '../../common/auth/otp.helper';
import { WorkspaceResolverService } from '../../common/auth/workspace-resolver.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { EmailService } from '../email/email.service';
import { TwoFactorService } from './two-factor.service';
import { CryptoService } from '../../common/crypto/crypto.service';
import { LoginLockoutService } from './login-lockout.service';
import { AuthTokenService } from './auth-token.service';
import { AuthRegistrationService } from './auth-registration.service';
import { passwordResetEmail } from '../email/email-templates';
import { LoginDto } from './dto/login.dto';
import { LoginTwoFactorDto } from './dto/login-two-factor.dto';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { LoginResult } from './auth.types';
import { resolveAudience, validateAudience } from './auth.types';

@Injectable()
export class AuthCredentialsService {
  private readonly logger = new Logger(AuthCredentialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly email: EmailService,
    private readonly workspaceProvisioning: WorkspaceProvisioningService,
    private readonly auditLog: AuditLogService,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly loginLockout: LoginLockoutService,
    private readonly twoFactor: TwoFactorService,
    private readonly cryptoService: CryptoService,
    private readonly configHelper: ConfigHelper,
    private readonly otpHelper: OtpHelper,
    private readonly tokenService: AuthTokenService,
    private readonly registrationService: AuthRegistrationService,
  ) {}

  async registerStart(dto: RegisterStartDto) {
    return this.registrationService.registerStart(dto);
  }

  async registerResend(emailRaw: string) {
    return this.registrationService.registerResend(emailRaw);
  }

  async registerVerify(dto: RegisterVerifyDto) {
    return this.registrationService.registerVerify(dto);
  }

  async forgotPassword(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = randomBytes(32).toString('hex');
      const hash = await bcrypt.hash(raw, 10);
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hash,
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });
      const prod = process.env.NODE_ENV === 'production';
      const base = this.configHelper.getFrontendBaseUrl();
      const locale = (user.locale || 'en').split('-')[0] || 'en';
      const resetUrl = `${base}/${locale}/forgot-password?${new URLSearchParams({ email, token: raw }).toString()}`;
      if (prod && !this.email.isConfigured()) {
        this.logger.error(
          `[Password reset] Email not configured; cannot send reset to ${email}`,
        );
      } else if (this.email.isConfigured()) {
        const tpl = passwordResetEmail({ resetUrl });
        await this.email.enqueue({
          to: email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
        if (!prod) {
          this.logger.log(`[Password reset] email sent to ${email}`);
        }
      } else if (!prod) {
        this.logger.log(
          `[Password reset] ${email} resetToken=${raw} (use with POST /auth/reset-password)`,
        );
      }
    }
    return {
      ok: true,
      message: 'If an account exists, instructions were sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      !user?.passwordResetToken ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt < new Date()
    ) {
      throw DomainException.badRequest(
        ErrorCode.INVALID_RESET_TOKEN,
        'Invalid or expired reset token',
      );
    }
    const valid = await bcrypt.compare(dto.token, user.passwordResetToken);
    if (!valid)
      throw DomainException.badRequest(
        ErrorCode.INVALID_RESET_TOKEN,
        'Invalid or expired reset token',
      );
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          passwordResetToken: null,
          passwordResetExpiresAt: null,
          refreshTokenHash: null,
        },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
    ]);
    return { ok: true };
  }

  async login(dto: LoginDto, ipAddress?: string): Promise<LoginResult> {
    await this.loginLockout.assertNotLockedOut(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });
    if (!user) {
      await this.loginLockout.recordFailedAttempt(dto.email);
      throw DomainException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await this.loginLockout.recordFailedAttempt(dto.email);
      throw DomainException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    await this.loginLockout.clear(dto.email);

    if (!user.isActive)
      throw DomainException.unauthorized(
        ErrorCode.ACCOUNT_DISABLED,
        'Account is disabled',
      );

    const isSuperAdmin = user.isSuperAdmin === true;
    const isStaff = user.platformStaffRole != null;
    if (!isSuperAdmin && !isStaff && user.emailVerified === false) {
      throw DomainException.unauthorized(
        ErrorCode.EMAIL_NOT_VERIFIED,
        'Email must be verified before signing in',
      );
    }

    if (user.twoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        email: user.email,
      } satisfies LoginResult;
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const audience = dto.audience
      ? validateAudience(
          dto.audience,
          user.isSuperAdmin === true,
          user.platformStaffRole,
        )
      : resolveAudience({
          isSuperAdmin: user.isSuperAdmin === true,
          platformStaffRole: user.platformStaffRole,
        });

    const tokens = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email,
      aud: audience,
      platformStaffRole: user.platformStaffRole ?? undefined,
    });
    await this.tokenService.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    if (isSuperAdmin) {
      try {
        await this.auditLog.append({
          action: 'Super Admin Logged In',
          adminName: user.fullName,
          targetCustomer: '—',
          ipAddress: ipAddress ?? 'n/a',
        });
      } catch (err) {
        this.logger.error(
          '[auth] Super admin audit log failed',
          err instanceof Error ? err.stack : String(err),
        );
      }
      await this.workspaceProvisioning.ensureAdminControlEntry(user.id);
    }

    const workspaceList =
      await this.workspaceResolver.buildWorkspaceListForUser(
        user.id,
        isSuperAdmin,
      );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        audience,
        isSuperAdmin,
        platformStaffRole: user.platformStaffRole ?? null,
        emailVerified: user.emailVerified,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }

  async loginWithTwoFactor(
    dto: LoginTwoFactorDto,
    ipAddress?: string,
  ): Promise<Exclude<LoginResult, { requiresTwoFactor: true }>> {
    await this.loginLockout.assertNotLockedOut(dto.email);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      },
    });
    if (!user) {
      await this.loginLockout.recordFailedAttempt(dto.email);
      throw DomainException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      await this.loginLockout.recordFailedAttempt(dto.email);
      throw DomainException.unauthorized(
        ErrorCode.INVALID_CREDENTIALS,
        'Invalid credentials',
      );
    }

    await this.loginLockout.clear(dto.email);

    if (!user.isActive)
      throw DomainException.unauthorized(
        ErrorCode.ACCOUNT_DISABLED,
        'Account is disabled',
      );

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw DomainException.badRequest(
        ErrorCode.INVALID_CREDENTIALS,
        '2FA is not enabled for this account',
      );
    }

    const decryptedSecret = this.cryptoService.decrypt(user.twoFactorSecret);
    const isTotpValid = this.twoFactor.verifyToken(
      dto.twoFactorToken,
      decryptedSecret,
    );
    if (!isTotpValid) {
      const isBackupCode = await this.twoFactor.verifyAndConsumeBackupCode(
        user.id,
        dto.twoFactorToken,
      );
      if (!isBackupCode) {
        throw DomainException.unauthorized(
          ErrorCode.INVALID_CREDENTIALS,
          'Invalid 2FA code',
        );
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const isSuperAdmin = user.isSuperAdmin === true;
    const audience = resolveAudience({
      isSuperAdmin,
      platformStaffRole: user.platformStaffRole,
    });
    const tokens = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email,
      aud: audience,
      platformStaffRole: user.platformStaffRole ?? undefined,
    });
    await this.tokenService.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    if (isSuperAdmin) {
      try {
        await this.auditLog.append({
          action: 'Super Admin Logged In (2FA)',
          adminName: user.fullName,
          targetCustomer: '—',
          ipAddress: ipAddress ?? 'n/a',
        });
      } catch (err) {
        this.logger.error(
          '[auth] Super admin audit log failed',
          err instanceof Error ? err.stack : String(err),
        );
      }
      await this.workspaceProvisioning.ensureAdminControlEntry(user.id);
    }

    const workspaceList =
      await this.workspaceResolver.buildWorkspaceListForUser(
        user.id,
        isSuperAdmin,
      );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        audience,
        isSuperAdmin,
        platformStaffRole: user.platformStaffRole ?? null,
        emailVerified: user.emailVerified,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }
}
