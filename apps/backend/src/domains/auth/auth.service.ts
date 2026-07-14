import { randomBytes } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { OtpHelper } from '../../common/auth/otp.helper';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { AuditLogService } from '../../common/audit/audit-log.service';
import { LoginLockoutService } from './login-lockout.service';
import { TwoFactorService } from './two-factor.service';
import { EmailService } from '../email/email.service';
import {
  passwordResetEmail,
  registerOtpEmail,
  welcomeEmail,
} from '../email/email-templates';
import { LoginDto } from './dto/login.dto';
import { LoginTwoFactorDto } from './dto/login-two-factor.dto';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';

type TokenPayload = {
  sub: string;
  email: string;
  impersonatedBy?: string;
  /**
   * Access and refresh tokens carry identical claims and are distinguished only
   * by their signing key. If those keys are ever misconfigured to the same
   * value, a long-lived refresh token would be accepted as a Bearer access
   * token. This claim keeps the two apart regardless of key configuration.
   * Absent on tokens minted before this claim existed — those are still
   * accepted so a deploy does not sign every user out.
   */
  typ?: 'access' | 'refresh';
  /** Session identifier — only on refresh tokens, used to look up the stored hash. */
  sid?: string;
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

type LoginResult =
  | {
      requiresTwoFactor: true;
      email: string;
    }
  | {
      user: {
        id: string;
        email: string;
        fullName: string;
        locale: string;
        isSuperAdmin: boolean;
        platformStaffRole: string | null;
        emailVerified: boolean;
      };
      workspaces: Array<{
        id: string;
        name: string;
        slug: string;
        role: string;
      }>;
      accessToken: string;
      refreshToken: string;
      sessionId: string;
    };

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessExpiresIn: number;
  private readonly refreshExpiresIn: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly email: EmailService,
    @Inject(forwardRef(() => WorkspacesService))
    private readonly workspaces: WorkspacesService,
    private readonly auditLog: AuditLogService,
    private readonly loginLockout: LoginLockoutService,
    private readonly twoFactor: TwoFactorService,
    private readonly configHelper: ConfigHelper,
    private readonly otpHelper: OtpHelper,
  ) {
    this.accessExpiresIn = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
    );
    this.refreshExpiresIn = this.parseDurationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    );
  }

  async registerStart(dto: RegisterStartDto) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw DomainException.conflict(
        ErrorCode.EMAIL_ALREADY_REGISTERED,
        'Email already registered',
      );
    }
    if (process.env.NODE_ENV === 'production' && !this.email.isConfigured()) {
      throw DomainException.serviceUnavailable(
        ErrorCode.EMAIL_NOT_CONFIGURED,
        'Email is not configured',
      );
    }
    const passwordHash = await bcrypt.hash(dto.password, 12);
    const {
      code,
      hash: otpHash,
      expiresAt: expires,
    } = await this.otpHelper.generateOtp();
    await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        businessName: dto.businessName.trim(),
        phone: dto.phone.trim(),
        country: dto.country.trim().toUpperCase().slice(0, 2),
        city: dto.city?.trim() || null,
        passwordHash,
        locale: dto.locale,
        emailVerified: false,
        verificationCode: otpHash,
        verificationCodeExpiresAt: expires,
      },
    });
    if (this.email.isConfigured()) {
      const tpl = registerOtpEmail({ code });
      await this.email.sendMail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[Register OTP] ${email} code=${code}`);
    } else {
      this.logger.error(
        `[Register OTP] no provider in production for ${email}`,
      );
    }
    return { ok: true, message: 'Verification code sent.', email };
  }

  /**
   * Re-sends the registration OTP for an unverified account. Always returns a generic success
   * when the email is unknown or already verified (avoid account enumeration).
   */
  async registerResend(emailRaw: string) {
    const email = emailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      return {
        ok: true,
        message: 'If an account needs verification, a new code was sent.',
      };
    }
    const {
      code,
      hash: otpHash,
      expiresAt: expires,
    } = await this.otpHelper.generateOtp();
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode: otpHash,
        verificationCodeExpiresAt: expires,
      },
    });
    if (this.email.isConfigured()) {
      const tpl = registerOtpEmail({ code });
      await this.email.sendMail({
        to: email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
    } else if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`[Register OTP resend] ${email} code=${code}`);
    } else {
      this.logger.error(
        `[Register OTP resend] no provider in production for ${email}`,
      );
    }
    return { ok: true, message: 'Verification code sent.' };
  }

  async registerVerify(dto: RegisterVerifyDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user)
      throw DomainException.badRequest(
        ErrorCode.INVALID_OTP,
        'Invalid verification code',
      );
    if (user.emailVerified) {
      throw DomainException.badRequest(
        ErrorCode.EMAIL_ALREADY_VERIFIED,
        'Email already verified',
      );
    }
    if (
      !user.verificationCode ||
      !user.verificationCodeExpiresAt ||
      user.verificationCodeExpiresAt < new Date()
    ) {
      throw DomainException.unauthorized(
        ErrorCode.OTP_EXPIRED,
        'Verification code expired',
      );
    }
    const ok = await bcrypt.compare(dto.code, user.verificationCode);
    if (!ok)
      throw DomainException.unauthorized(
        ErrorCode.INVALID_OTP,
        'Invalid verification code',
      );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        lastLoginAt: new Date(),
      },
    });

    const wsName = user.businessName || user.fullName;
    await this.workspaces.createForUser(user.id, `${wsName}'s Workspace`);

    const tokens = await this.issueTokenPair({
      sub: user.id,
      email: user.email,
    });
    await this.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    const workspaceList = await this.buildWorkspaceListForUser(user.id, false);

    // Send welcome email (best-effort, don't block registration on email failure)
    if (this.email.isConfigured()) {
      const dashboardUrl =
        this.configService.get<string>('DASHBOARD_URL')?.trim() || undefined;
      const template = welcomeEmail({
        fullName: user.fullName,
        dashboardUrl,
      });
      this.email
        .sendMail({
          to: user.email,
          ...template,
        })
        .then(() => {
          const addr = user.email;
          this.logger.log(`Welcome email sent to ${addr}`);
        })
        .catch((err) => {
          this.logger.warn(
            `Welcome email failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isSuperAdmin: false,
        platformStaffRole: null,
        emailVerified: true,
      },
      workspaces: workspaceList,
      ...tokens,
    };
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
        await this.email.sendMail({
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
    // Per-account brute-force wall, independent of the per-IP rate limit.
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
      // Count the miss too, so lockout timing cannot reveal which emails exist.
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

    // Password was correct — clear the counter even if a later check rejects.
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

    // If 2FA is enabled, return a flag instead of tokens.
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

    const tokens = await this.issueTokenPair({
      sub: user.id,
      email: user.email,
    });
    await this.setRefreshTokenSession(
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
      await this.workspaces.ensureAdminControlEntry(user.id);
    }

    const workspaceList = await this.buildWorkspaceListForUser(
      user.id,
      isSuperAdmin,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isSuperAdmin,
        platformStaffRole: user.platformStaffRole ?? null,
        emailVerified: user.emailVerified,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }

  /** Second step of login when 2FA is enabled. */
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

    // Check TOTP token or backup code
    const isTotpValid = this.twoFactor.verifyToken(
      dto.twoFactorToken,
      user.twoFactorSecret,
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
    const tokens = await this.issueTokenPair({
      sub: user.id,
      email: user.email,
    });
    await this.setRefreshTokenSession(
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
      await this.workspaces.ensureAdminControlEntry(user.id);
    }

    const workspaceList = await this.buildWorkspaceListForUser(
      user.id,
      isSuperAdmin,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isSuperAdmin,
        platformStaffRole: user.platformStaffRole ?? null,
        emailVerified: user.emailVerified,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }

  /**
   * Dev helper: authenticate as the seeded super admin when present, else the first
   * eligible user (same response shape as login).
   */
  async devLoginAsFirstUser() {
    const select = {
      id: true,
      email: true,
      fullName: true,
      locale: true,
      isSuperAdmin: true,
      platformStaffRole: true,
    } as const;

    const superUser = await this.prisma.user.findFirst({
      where: { isActive: true, isSuperAdmin: true },
      orderBy: { createdAt: 'asc' },
      select,
    });

    const user =
      superUser ??
      (await this.prisma.user.findFirst({
        where: {
          isActive: true,
          OR: [{ emailVerified: true }, { isSuperAdmin: true }],
        },
        orderBy: { createdAt: 'asc' },
        select,
      }));
    if (!user) {
      throw new BadRequestException(
        'No active users in the database. Register an account first.',
      );
    }

    const isSuperAdmin = user.isSuperAdmin === true;

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair({
      sub: user.id,
      email: user.email,
    });
    await this.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    if (isSuperAdmin) {
      await this.workspaces.ensureAdminControlEntry(user.id);
    }

    const workspaceList = await this.buildWorkspaceListForUser(
      user.id,
      isSuperAdmin,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isSuperAdmin,
        platformStaffRole: user.platformStaffRole ?? null,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret',
    );
    let userId: string;
    let sessionId: string | undefined;
    let impersonatedByFromRefresh: string | undefined;
    try {
      const decoded = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );
      // Reject an access token presented here, even if both keys are the same.
      if (decoded.typ === 'access') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      userId = decoded.sub;
      sessionId = decoded.sid;
      impersonatedByFromRefresh = decoded.impersonatedBy;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Look up the stored hash by sessionId (from the JWT sid claim).
    // Falls back to legacy refreshTokenHash on User for tokens minted
    // before the multi-session migration.
    if (sessionId) {
      const stored = await this.prisma.refreshToken.findUnique({
        where: { userId_sessionId: { userId, sessionId } },
      });
      if (!stored) throw new UnauthorizedException('Invalid refresh token');

      const isValid = await bcrypt.compare(refreshToken, stored.tokenHash);
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');

      // Rotate: delete the old session, issue a new one.
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    } else {
      // Legacy path: token has no sid claim (pre-migration).
      const legacyUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { refreshTokenHash: true },
      });
      if (!legacyUser?.refreshTokenHash) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      const isValid = await bcrypt.compare(
        refreshToken,
        legacyUser.refreshTokenHash,
      );
      if (!isValid) throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokenPair(
      { sub: user.id, email: user.email },
      impersonatedByFromRefresh
        ? { impersonatedBy: impersonatedByFromRefresh }
        : undefined,
    );
    await this.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  /**
   * Super-admin only: mint tokens for another user (session becomes that user).
   */
  async issueImpersonation(actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new BadRequestException('Cannot impersonate yourself');
    }
    const actor = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: { isSuperAdmin: true },
    });
    if (!actor?.isSuperAdmin) throw new ForbiddenException();

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
      },
    });
    if (!target) throw new NotFoundException('User not found');
    if (!target.isActive) throw new BadRequestException('User is suspended');

    const tokens = await this.issueTokenPair(
      {
        sub: target.id,
        email: target.email,
      },
      { impersonatedBy: actorUserId },
    );
    await this.setRefreshTokenSession(
      target.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    return {
      user: {
        id: target.id,
        email: target.email,
        fullName: target.fullName,
        locale: target.locale,
        isSuperAdmin: target.isSuperAdmin,
      },
      ...tokens,
    };
  }

  async exitImpersonation(
    jwtUser: { sub: string; impersonatedBy?: string },
    ipAddress?: string,
  ) {
    const superAdminId = jwtUser.impersonatedBy;
    if (!superAdminId) throw new ForbiddenException('Not impersonating');

    const superAdmin = await this.prisma.user.findUnique({
      where: { id: superAdminId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isSuperAdmin: true,
        isActive: true,
      },
    });
    if (!superAdmin?.isSuperAdmin || !superAdmin.isActive) {
      throw new ForbiddenException();
    }

    const tokens = await this.issueTokenPair({
      sub: superAdmin.id,
      email: superAdmin.email,
    });
    await this.setRefreshTokenSession(
      superAdmin.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    const workspaceList = await this.buildWorkspaceListForUser(
      superAdmin.id,
      true,
    );

    await this.auditLog.append({
      action: 'IMPERSONATION_END',
      adminName: superAdmin.fullName,
      targetCustomer: jwtUser.sub,
      ipAddress: ipAddress ?? 'n/a',
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
        locale: superAdmin.locale,
        isSuperAdmin: true,
      },
      workspaces: workspaceList,
    };
  }

  async me(userId: string, impersonatedBy?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        locale: true,
        isActive: true,
        isSuperAdmin: true,
        platformStaffRole: true,
        businessName: true,
        phone: true,
        country: true,
        city: true,
        emailVerified: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: { id: true, name: true, slug: true, isPaused: true },
            },
          },
        },
      },
    });
    if (!user) return null;
    const isSuperAdmin = user.isSuperAdmin === true;
    const profile = {
      businessName: user.businessName ?? null,
      phone: user.phone ?? null,
      country: user.country ?? null,
      city: user.city ?? null,
      emailVerified: user.emailVerified,
    };
    if (isSuperAdmin) {
      const all = await this.prisma.workspace.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, slug: true, isPaused: true },
      });
      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        locale: user.locale,
        isActive: user.isActive,
        isSuperAdmin: true,
        platformStaffRole: user.platformStaffRole ?? null,
        impersonatedBy: impersonatedBy ?? null,
        ...profile,
        memberships: all.map((w) => ({
          role: 'OWNER',
          workspace: w,
        })),
      };
    }
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      locale: user.locale,
      isActive: user.isActive,
      isSuperAdmin: false,
      platformStaffRole: user.platformStaffRole ?? null,
      impersonatedBy: impersonatedBy ?? null,
      ...profile,
      memberships: user.memberships,
    };
  }

  /** Log a 2FA-related action to the audit trail. */
  async logTwoFactorAction(userId: string, action: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fullName: true, email: true },
      });
      if (user) {
        await this.auditLog.append({
          action,
          adminName: user.fullName,
          targetCustomer: user.email,
          ipAddress: 'n/a',
        });
      }
    } catch (err) {
      this.logger.error(
        '[auth] 2FA audit log failed',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async buildWorkspaceListForUser(
    userId: string,
    isSuperAdmin: boolean,
  ): Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      isPaused: boolean;
      role: string;
    }>
  > {
    if (isSuperAdmin) {
      const all = await this.prisma.workspace.findMany({
        orderBy: { createdAt: 'asc' },
        select: { id: true, name: true, slug: true, isPaused: true },
      });
      return all.map((w) => ({ ...w, role: 'OWNER' }));
    }
    const memberships = await this.prisma.workspaceMember.findMany({
      where: { userId },
      select: {
        role: true,
        workspace: {
          select: { id: true, name: true, slug: true, isPaused: true },
        },
      },
    });
    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }

  private async issueTokenPair(
    payload: TokenPayload,
    options?: { impersonatedBy?: string },
  ): Promise<TokenPair & { sessionId: string }> {
    const accessSecret = this.configService.get<string>(
      'JWT_ACCESS_SECRET',
      'dev-access-secret',
    );
    const refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'dev-refresh-secret',
    );

    const sessionId = randomBytes(16).toString('hex');

    const tokenPayload = {
      ...payload,
      ...(options?.impersonatedBy
        ? { impersonatedBy: options.impersonatedBy }
        : {}),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...tokenPayload, typ: 'access' },
        {
          secret: accessSecret,
          expiresIn: this.accessExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        { ...tokenPayload, typ: 'refresh', sid: sessionId },
        {
          secret: refreshSecret,
          expiresIn: this.refreshExpiresIn,
        },
      ),
    ]);

    return { accessToken, refreshToken, sessionId };
  }

  private async setRefreshTokenSession(
    userId: string,
    refreshToken: string,
    sessionId: string,
  ): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 12);
    const now = new Date();
    const refreshSeconds = this.refreshExpiresIn;
    const expiresAt = new Date(now.getTime() + refreshSeconds * 1000);

    await this.prisma.$transaction([
      this.prisma.refreshToken.create({
        data: { userId, sessionId, tokenHash: hash, expiresAt },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId, expiresAt: { lt: now } },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { refreshTokenHash: null },
      }),
    ]);
  }

  private parseDurationToSeconds(value: string): number {
    const trimmed = value.trim().toLowerCase();
    const match = /^(\d+)([smhd])$/.exec(trimmed);
    if (!match) return Number(trimmed) || 900;

    const amount = Number(match[1]);
    const unit = match[2];
    if (unit === 's') return amount;
    if (unit === 'm') return amount * 60;
    if (unit === 'h') return amount * 3600;
    return amount * 86400;
  }
}
