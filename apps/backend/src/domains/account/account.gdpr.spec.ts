import { ForbiddenException } from '@nestjs/common';
import { AccountService } from './account.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { OtpHelper } from '../../common/auth/otp.helper';
import { EmailService } from '../email/email.service';
import { Prisma } from '@prisma/client';

type UpdateCallArgs = {
  where: { id: string };
  data: Record<string, unknown>;
};

type MockPrisma = {
  user: {
    findUnique: jest.Mock;
    update: jest.MockedFunction<
      (args: UpdateCallArgs) => Promise<{ id: string; email: string }>
    >;
  };
  paymentRecord: { findMany: jest.Mock };
  workspaceMember: { findMany: jest.Mock };
  workspaceInvitation: { findMany: jest.Mock };
  notification: { findMany: jest.Mock; deleteMany: jest.Mock };
  auditLog: { findMany: jest.Mock };
  refreshToken: { deleteMany: jest.Mock };
  pairingClaimLockout: { deleteMany: jest.Mock };
};

/**
 * GDPR data-subject flow tests: export and anonymize.
 * Verifies that export returns all PII, and anonymize clears PII
 * while preserving billing/audit records.
 */
describe('AccountService — GDPR flows', () => {
  let service: AccountService;
  let mock: MockPrisma;

  const userId = 'user-1';
  const userEmail = 'alice@example.com';

  function makeMockPrisma(overrides: Partial<MockPrisma> = {}): MockPrisma {
    const userFindUnique = jest.fn().mockResolvedValue({
      id: userId,
      email: userEmail,
      fullName: 'Alice',
      businessName: 'Acme',
      phone: '+1234',
      country: 'US',
      city: 'NYC',
      locale: 'en',
      subscriptionStatus: 'TRIAL',
      subscriptionEndDate: null,
      lastLoginAt: new Date('2025-01-01T00:00:00Z'),
      emailVerified: true,
      twoFactorEnabled: false,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-06-01T00:00:00Z'),
    });

    const userUpdate = jest.fn() as jest.MockedFunction<
      (args: UpdateCallArgs) => Promise<{ id: string; email: string }>
    >;
    userUpdate.mockResolvedValue({
      id: userId,
      email: `anonymized+${userId}@deleted.local`,
    });

    const paymentFindMany = jest.fn().mockResolvedValue([
      {
        id: 'pay-1',
        userId,
        amountCents: 1000,
        currency: 'USD',
        status: 'PAID',
        invoiceRef: 'inv-1',
        paidAt: new Date('2025-01-15T00:00:00Z'),
        createdAt: new Date('2025-01-15T00:00:00Z'),
      },
    ]);

    const memberFindMany = jest.fn().mockResolvedValue([
      {
        id: 'mem-1',
        role: 'OWNER',
        workspaceId: 'ws-1',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        workspace: { id: 'ws-1', name: 'Acme', slug: 'acme' },
      },
    ]);

    const invitationFindMany = jest.fn().mockResolvedValue([]);
    const notificationFindMany = jest.fn().mockResolvedValue([
      {
        id: 'notif-1',
        userId,
        type: 'screen_offline',
        title: 'Screen offline',
        message: 'Screen went offline',
        read: false,
        link: null,
        createdAt: new Date('2025-01-10T00:00:00Z'),
      },
    ]);
    const auditLogFindMany = jest.fn().mockResolvedValue([
      {
        id: 'audit-1',
        action: 'IMPERSONATE_USER',
        adminName: 'admin',
        targetCustomer: 'Alice',
        ipAddress: '1.2.3.4',
        createdAt: new Date('2025-01-05T00:00:00Z'),
      },
    ]);

    const deleteMany = jest.fn().mockResolvedValue({ count: 1 });

    return {
      user: {
        findUnique: userFindUnique,
        update: userUpdate,
      },
      paymentRecord: { findMany: paymentFindMany },
      workspaceMember: { findMany: memberFindMany },
      workspaceInvitation: { findMany: invitationFindMany },
      notification: {
        findMany: notificationFindMany,
        deleteMany,
      },
      auditLog: { findMany: auditLogFindMany },
      refreshToken: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      pairingClaimLockout: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      ...overrides,
    };
  }

  function buildService(m: MockPrisma): AccountService {
    return new AccountService(
      m as unknown as PrismaService,
      {} as unknown as EmailService,
      {} as unknown as ConfigHelper,
      {} as unknown as OtpHelper,
    );
  }

  beforeEach(() => {
    mock = makeMockPrisma();
    service = buildService(mock);
  });

  describe('exportUserData', () => {
    it('returns user profile with all PII fields', async () => {
      const result = await service.exportUserData(userId);

      expect(result.user.id).toBe(userId);
      expect(result.user.email).toBe(userEmail);
      expect(result.user.fullName).toBe('Alice');
      expect(result.user.businessName).toBe('Acme');
      expect(result.user.phone).toBe('+1234');
      expect(result.user.country).toBe('US');
      expect(result.user.city).toBe('NYC');
    });

    it('returns payments, memberships, notifications, and audit logs', async () => {
      const result = await service.exportUserData(userId);

      expect(result.payments).toHaveLength(1);
      expect(result.payments[0].id).toBe('pay-1');
      expect(result.workspaceMemberships).toHaveLength(1);
      expect(result.workspaceMemberships[0].workspaceName).toBe('Acme');
      expect(result.notifications).toHaveLength(1);
      expect(result.auditLogs).toHaveLength(1);
      expect(result.auditLogs[0].action).toBe('IMPERSONATE_USER');
    });

    it('serializes all dates to ISO strings', async () => {
      const result = await service.exportUserData(userId);

      expect(typeof result.user.createdAt).toBe('string');
      expect(result.user.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(typeof result.payments[0].createdAt).toBe('string');
      expect(typeof result.notifications[0].createdAt).toBe('string');
    });

    it('throws ForbiddenException when user does not exist', async () => {
      mock = makeMockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn() as jest.MockedFunction<
            (args: UpdateCallArgs) => Promise<{ id: string; email: string }>
          >,
        },
      });
      service = buildService(mock);

      await expect(service.exportUserData('nonexistent')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('anonymizeAccount', () => {
    it('anonymizes PII fields and deactivates account', async () => {
      await service.anonymizeAccount(userId);

      const updateCall = mock.user.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe(userId);
      expect(updateCall.data.email).toBe(`anonymized+${userId}@deleted.local`);
      expect(updateCall.data.fullName).toBe('Deleted User');
      expect(updateCall.data.businessName).toBeNull();
      expect(updateCall.data.phone).toBeNull();
      expect(updateCall.data.passwordHash).toBe('ANONYMIZED');
      expect(updateCall.data.isActive).toBe(false);
    });

    it('clears all credential-related fields', async () => {
      await service.anonymizeAccount(userId);

      const data = mock.user.update.mock.calls[0][0].data;
      expect(data.refreshTokenHash).toBeNull();
      expect(data.twoFactorSecret).toBeNull();
      expect(data.twoFactorEnabled).toBe(false);
      expect(data.twoFactorBackupCodes).toBeNull();
      expect(data.verificationCode).toBeNull();
      expect(data.passwordResetToken).toBeNull();
      expect(data.pendingEmail).toBeNull();
    });

    it('sets notificationPreferences to Prisma.JsonNull', async () => {
      await service.anonymizeAccount(userId);

      const data = mock.user.update.mock.calls[0][0].data;
      expect(data.notificationPreferences).toBe(Prisma.JsonNull);
    });

    it('deletes refresh tokens, notifications, and pairing lockouts', async () => {
      await service.anonymizeAccount(userId);

      expect(mock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mock.notification.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mock.pairingClaimLockout.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });

    it('throws ForbiddenException when user does not exist', async () => {
      mock = makeMockPrisma({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          update: jest.fn() as jest.MockedFunction<
            (args: UpdateCallArgs) => Promise<{ id: string; email: string }>
          >,
        },
      });
      service = buildService(mock);

      await expect(service.anonymizeAccount('nonexistent')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns ok response', async () => {
      const result = await service.anonymizeAccount(userId);
      expect(result.ok).toBe(true);
    });
  });
});
