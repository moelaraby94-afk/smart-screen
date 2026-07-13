import * as bcrypt from 'bcryptjs';
import { OtpHelper } from './otp.helper';

describe('OtpHelper', () => {
  const helper = new OtpHelper();

  describe('generateOtp', () => {
    it('returns a 6-digit code as a string', async () => {
      const { code } = await helper.generateOtp();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('returns a bcrypt hash that verifies against the code', async () => {
      const { code, hash } = await helper.generateOtp();
      expect(await bcrypt.compare(code, hash)).toBe(true);
    });

    it('returns an expiry 15 minutes in the future', async () => {
      const before = Date.now();
      const { expiresAt } = await helper.generateOtp();
      const after = Date.now();
      const expectedMin = before + 15 * 60 * 1000;
      const expectedMax = after + 15 * 60 * 1000;
      expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax);
    });

    it('generates different codes on successive calls', async () => {
      const a = await helper.generateOtp();
      const b = await helper.generateOtp();
      expect(a.code).not.toBe(b.code);
    });
  });
});
