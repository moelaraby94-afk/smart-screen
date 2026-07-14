import { authenticator } from 'otplib';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../common/prisma/prisma.service';

const BACKUP_CODE_COUNT = 8;

@Injectable()
export class TwoFactorService {
  private readonly issuer: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.issuer =
      this.configService.get<string>('APP_NAME', 'Cloud Signage') ??
      'Cloud Signage';
  }

  /** Generate a new TOTP secret and otpauth URL for the user. */
  async generateSecret(userEmail: string) {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(userEmail, this.issuer, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  /** Verify a TOTP token against a secret. */
  verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token: token.trim(), secret });
    } catch {
      return false;
    }
  }

  /** Generate backup codes (plaintext for display, bcrypt hashes for storage). */
  async generateBackupCodes(): Promise<{
    plaintext: string[];
    hashes: string;
  }> {
    const codes: string[] = [];
    const hashes: string[] = [];
    for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
      const code = this.generateBackupCode();
      codes.push(code);
      hashes.push(await bcrypt.hash(code, 10));
    }
    return { plaintext: codes, hashes: JSON.stringify(hashes) };
  }

  private generateBackupCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  /** Verify a backup code and remove it from the stored list. Returns true if valid. */
  async verifyAndConsumeBackupCode(
    userId: string,
    code: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorBackupCodes: true },
    });
    if (!user?.twoFactorBackupCodes) return false;

    const hashes = JSON.parse(user.twoFactorBackupCodes) as string[];
    let consumed = false;
    const remaining: string[] = [];

    for (const hash of hashes) {
      if (!consumed) {
        const match = await bcrypt.compare(code.toUpperCase().trim(), hash);
        if (match) {
          consumed = true;
          continue;
        }
      }
      remaining.push(hash);
    }

    if (consumed) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes:
            remaining.length > 0 ? JSON.stringify(remaining) : null,
        },
      });
    }

    return consumed;
  }

  /** Enable 2FA for a user after verifying the first TOTP token. */
  async enableTwoFactor(
    userId: string,
    secret: string,
    token: string,
  ): Promise<{ backupCodes: string[] }> {
    if (!this.verifyToken(token, secret)) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const { plaintext, hashes } = await this.generateBackupCodes();

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashes,
      },
    });

    return { backupCodes: plaintext };
  }

  /** Disable 2FA for a user after verifying a TOTP token or backup code. */
  async disableTwoFactor(userId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorSecret: true },
    });
    if (!user?.twoFactorSecret) {
      throw new UnauthorizedException('2FA is not enabled');
    }

    const isTotpValid = this.verifyToken(token, user.twoFactorSecret);
    if (!isTotpValid) {
      const isBackupCode = await this.verifyAndConsumeBackupCode(userId, token);
      if (!isBackupCode) {
        throw new UnauthorizedException('Invalid verification code');
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    });
  }

  /** Check if a user has 2FA enabled. */
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true },
    });
    return user?.twoFactorEnabled === true;
  }
}
