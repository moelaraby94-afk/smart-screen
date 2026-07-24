import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { DomainException } from '../../common/errors/domain.exception';
import { ErrorCode } from '../../common/errors/error-codes';
import { PrismaService } from '../../common/prisma/prisma.service';
import { OtpHelper } from '../../common/auth/otp.helper';
import { WorkspaceResolverService } from '../../common/auth/workspace-resolver.service';
import { WorkspaceProvisioningService } from '../../common/auth/workspace-provisioning.service';
import { EmailService } from '../email/email.service';
import { AuthTokenService } from './auth-token.service';
import { registerOtpEmail, welcomeEmail } from '../email/email-templates';
import { RegisterStartDto } from './dto/register-start.dto';
import { RegisterVerifyDto } from './dto/register-verify.dto';
import type { JwtAudience } from '../../common/auth/current-user.decorator';

/**
 * Registration flow: registerStart, registerResend, registerVerify.
 * Extracted from AuthCredentialsService to reduce file size and improve cohesion.
 */
@Injectable()
export class AuthRegistrationService {
  private readonly logger = new Logger(AuthRegistrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly email: EmailService,
    private readonly workspaceProvisioning: WorkspaceProvisioningService,
    private readonly workspaceResolver: WorkspaceResolverService,
    private readonly otpHelper: OtpHelper,
    private readonly tokenService: AuthTokenService,
  ) {}

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
      await this.email.enqueue({
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
      await this.email.enqueue({
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
    await this.workspaceProvisioning.createForUser(
      user.id,
      `${wsName}'s Workspace`,
    );

    const tokens = await this.tokenService.issueTokenPair({
      sub: user.id,
      email: user.email,
      aud: 'customer',
    });
    await this.tokenService.setRefreshTokenSession(
      user.id,
      tokens.refreshToken,
      tokens.sessionId,
    );

    const workspaceList =
      await this.workspaceResolver.buildWorkspaceListForUser(user.id, false);

    if (this.email.isConfigured()) {
      const dashboardUrl =
        this.configService.get<string>('DASHBOARD_URL')?.trim() || undefined;
      const template = welcomeEmail({
        fullName: user.fullName,
        dashboardUrl,
      });
      this.email
        .enqueue({
          to: user.email,
          ...template,
        })
        .then(() => {
          this.logger.log(`Welcome email sent to ${user.email}`);
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
        audience: 'customer' as JwtAudience,
        isSuperAdmin: false,
        platformStaffRole: null,
        emailVerified: true,
      },
      workspaces: workspaceList,
      ...tokens,
    };
  }
}
