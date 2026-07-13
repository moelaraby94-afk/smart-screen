import { Injectable } from '@nestjs/common';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcryptjs';

export type OtpResult = {
  code: string;
  hash: string;
  expiresAt: Date;
};

/**
 * Generates a 6-digit OTP code, its bcrypt hash, and a 15-minute expiry.
 *
 * Used by registration verification, resend verification, and email change.
 */
@Injectable()
export class OtpHelper {
  async generateOtp(): Promise<OtpResult> {
    const code = String(randomInt(100000, 999999));
    const hash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    return { code, hash, expiresAt };
  }
}
