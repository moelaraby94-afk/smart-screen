import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { OtpHelper } from '../../common/auth/otp.helper';
import { fromStorageLimitBytes } from '../../common/product/storage-limit';
import { computeWorkspaceCapabilities } from '../../common/product/workspace-capabilities';
import { EmailService } from '../email/email.service';
import { emailChangeOtpEmail } from '../email/email-templates';
import Stripe from 'stripe';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly configHelper: ConfigHelper,
    private readonly otpHelper: OtpHelper,
  ) {}

  async updateProfile(
    userId: string,
    dto: { fullName?: string; businessName?: string; phone?: string },
  ) {
    const data: Record<string, string> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.businessName !== undefined)
      data.businessName = dto.businessName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No changes');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        phone: true,
        country: true,
        city: true,
      },
    });
  }

  async requestEmailChange(userId: string, newEmailRaw: string) {
    const newEmail = newEmailRaw.toLowerCase();
    const existing = await this.prisma.user.findUnique({
      where: { email: newEmail },
    });
    if (existing) throw new ConflictException('Email already registered');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException();
    if (user.email === newEmail) throw new BadRequestException('Same email');
    const {
      code,
      hash: otpHash,
      expiresAt: expires,
    } = await this.otpHelper.generateOtp();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: newEmail,
        pendingEmailOtp: otpHash,
        pendingEmailOtpExpiresAt: expires,
      },
    });
    const prod = process.env.NODE_ENV === 'production';
    if (prod && !this.email.isConfigured()) {
      throw new ServiceUnavailableException('Email is not configured');
    }
    if (this.email.isConfigured()) {
      const tpl = emailChangeOtpEmail({ code });
      await this.email.sendMail({
        to: newEmail,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      if (!prod) {
        this.logger.log(`[Email change OTP] also emailed ${newEmail}`);
      }
    } else if (!prod) {
      this.logger.log(`[Email change OTP] ${newEmail} code=${code}`);
    }
    return { ok: true, message: 'Verification code sent to new email.' };
  }

  async verifyEmailChange(userId: string, newEmailRaw: string, code: string) {
    const newEmail = newEmailRaw.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.pendingEmail || user.pendingEmail !== newEmail) {
      throw new BadRequestException('No pending change');
    }
    if (
      !user.pendingEmailOtp ||
      !user.pendingEmailOtpExpiresAt ||
      user.pendingEmailOtpExpiresAt < new Date()
    ) {
      throw new BadRequestException('Code expired');
    }
    const ok = await bcrypt.compare(code, user.pendingEmailOtp);
    if (!ok) throw new BadRequestException('Invalid code');
    if (
      await this.prisma.user.findFirst({
        where: { email: newEmail, id: { not: userId } },
      })
    ) {
      throw new ConflictException('Email already registered');
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        pendingEmail: null,
        pendingEmailOtp: null,
        pendingEmailOtpExpiresAt: null,
      },
      select: { id: true, email: true, fullName: true },
    });
  }

  async getBilling(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionStatus: true,
        subscriptionEndDate: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
        memberships: {
          take: 1,
          select: {
            workspace: {
              select: {
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    seats: true,
                    screenLimit: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new ForbiddenException();
    const wsSub = user.memberships[0]?.workspace.subscription;
    return {
      currentPlan: {
        userSubscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate,
        workspacePlan: wsSub?.plan ?? null,
        workspaceStatus: wsSub?.status ?? null,
        seats: wsSub?.seats ?? null,
        screenLimit: wsSub?.screenLimit ?? null,
      },
      payments: user.payments,
    };
  }

  async getInsights(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                isPaused: true,
                createdAt: true,
                subscription: {
                  select: {
                    plan: true,
                    status: true,
                    seats: true,
                    screenLimit: true,
                    storageLimitBytes: true,
                    currentPeriodEnd: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!user) throw new ForbiddenException();

    const branches = await Promise.all(
      user.memberships.map(async (m) => {
        const workspaceId = m.workspace.id;
        const [screens, playlists, mediaCount, mediaAgg] = await Promise.all([
          this.prisma.screen.findMany({
            where: { workspaceId },
            select: { id: true, status: true },
          }),
          this.prisma.playlist.count({ where: { workspaceId } }),
          this.prisma.media.count({ where: { workspaceId } }),
          this.prisma.media.aggregate({
            where: { workspaceId },
            _sum: { sizeBytes: true },
          }),
        ]);

        const screenStatus = screens.reduce(
          (acc, s) => {
            if (s.status === 'ONLINE') acc.online += 1;
            else if (s.status === 'MAINTENANCE') acc.maintenance += 1;
            else acc.offline += 1;
            return acc;
          },
          { online: 0, offline: 0, maintenance: 0 },
        );

        const storageBytes = mediaAgg._sum.sizeBytes ?? 0;
        const sub = m.workspace.subscription;
        const storageLimitBytes = sub
          ? fromStorageLimitBytes(sub.storageLimitBytes)
          : null;
        // The plan rules live in one place; the client renders these, not the math.
        const capabilities = computeWorkspaceCapabilities(
          { screenCount: screens.length, storageUsedBytes: storageBytes },
          {
            screenLimit: sub?.screenLimit ?? null,
            storageLimitBytes,
          },
        );
        return {
          workspaceId,
          name: m.workspace.name,
          slug: m.workspace.slug,
          isPaused: m.workspace.isPaused,
          role: m.role,
          createdAt: m.workspace.createdAt.toISOString(),
          screens: screens.length,
          playlists,
          mediaCount,
          storageBytes,
          screenStatus,
          capabilities,
          subscription: sub
            ? {
                plan: sub.plan,
                status: sub.status,
                seats: sub.seats,
                screenLimit: sub.screenLimit,
                storageLimitBytes,
                currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
              }
            : null,
        };
      }),
    );

    const totals = branches.reduce(
      (acc, b) => {
        acc.branches += 1;
        acc.screens += b.screens;
        acc.playlists += b.playlists;
        acc.mediaCount += b.mediaCount;
        acc.storageBytes += b.storageBytes;
        acc.screenStatus.online += b.screenStatus.online;
        acc.screenStatus.offline += b.screenStatus.offline;
        acc.screenStatus.maintenance += b.screenStatus.maintenance;
        return acc;
      },
      {
        branches: 0,
        screens: 0,
        playlists: 0,
        mediaCount: 0,
        storageBytes: 0,
        screenStatus: { online: 0, offline: 0, maintenance: 0 },
      },
    );

    const firstSub = branches.find((b) => b.subscription)?.subscription ?? null;
    return {
      account: {
        subscriptionStatus: user.subscriptionStatus,
        subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
      },
      plan: firstSub,
      totals,
      branches,
    };
  }

  async getInvoicePdfUrl(userId: string, invoiceRef: string) {
    const payment = await this.prisma.paymentRecord.findFirst({
      where: { userId, invoiceRef },
    });
    if (!payment) {
      throw new ForbiddenException('Invoice not found');
    }

    const secret = this.configHelper.requireStripeSecretKey();

    const stripe = new Stripe(secret);
    const invoice = await stripe.invoices.retrieve(invoiceRef);
    const pdfUrl = invoice.invoice_pdf;
    if (!pdfUrl) {
      throw new BadRequestException('Invoice PDF is not available yet');
    }
    return { url: pdfUrl };
  }

  /**
   * GDPR data-subject export: returns all PII and related data for the user.
   * Includes profile, payments, workspace memberships, sent invitations,
   * notifications, and audit log entries where the user is the actor.
   */
  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        businessName: true,
        phone: true,
        country: true,
        city: true,
        locale: true,
        subscriptionStatus: true,
        subscriptionEndDate: true,
        lastLoginAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new ForbiddenException();

    const [payments, memberships, sentInvitations, notifications, auditLogs] =
      await Promise.all([
        this.prisma.paymentRecord.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.workspaceMember.findMany({
          where: { userId },
          include: {
            workspace: {
              select: { id: true, name: true, slug: true },
            },
          },
        }),
        this.prisma.workspaceInvitation.findMany({
          where: { invitedById: userId },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
        this.prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 500,
        }),
      ]);

    return {
      user: {
        ...user,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        subscriptionEndDate: user.subscriptionEndDate?.toISOString() ?? null,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      payments: payments.map((p) => ({
        ...p,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      workspaceMemberships: memberships.map((m) => ({
        id: m.id,
        role: m.role,
        workspaceId: m.workspaceId,
        workspaceName: m.workspace.name,
        workspaceSlug: m.workspace.slug,
        createdAt: m.createdAt.toISOString(),
      })),
      sentInvitations: sentInvitations.map((i) => ({
        ...i,
        createdAt: i.createdAt.toISOString(),
        expiresAt: i.expiresAt.toISOString(),
        acceptedAt: i.acceptedAt?.toISOString() ?? null,
      })),
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      auditLogs: auditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        adminName: a.adminName,
        ipAddress: a.ipAddress,
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  /**
   * GDPR erasure/anonymize: anonymizes the user's PII fields and deactivates
   * the account. Billing records (PaymentRecord) and audit logs (AuditLog) are
   * retained for compliance integrity. Canvas.createdById has onDelete: Restrict
   * so we cannot hard-delete the user; instead we anonymize PII and invalidate
   * credentials. Refresh tokens and notifications are deleted.
   */
  async anonymizeAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (!user) throw new ForbiddenException();

    const anonymizedEmail = `anonymized+${userId}@deleted.local`;

    // Delete refresh tokens and notifications (no FK cascade from User)
    await Promise.all([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.pairingClaimLockout.deleteMany({ where: { userId } }),
    ]);

    // Anonymize PII and invalidate credentials
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: anonymizedEmail,
        fullName: 'Deleted User',
        businessName: null,
        phone: null,
        country: null,
        city: null,
        passwordHash: 'ANONYMIZED',
        refreshTokenHash: null,
        twoFactorSecret: null,
        twoFactorEnabled: false,
        twoFactorBackupCodes: null,
        verificationCode: null,
        verificationCodeExpiresAt: null,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
        pendingEmail: null,
        pendingEmailOtp: null,
        pendingEmailOtpExpiresAt: null,
        notificationPreferences: Prisma.JsonNull,
        isActive: false,
      },
      select: { id: true, email: true },
    });

    this.logger.log(
      `Anonymized account ${userId} (email was ${user.email}, now ${updated.email}).`,
    );

    return { ok: true, message: 'Account anonymized.' };
  }
}
