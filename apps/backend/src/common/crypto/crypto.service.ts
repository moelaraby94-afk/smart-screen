import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

/**
 * AES-256-GCM encryption service for sensitive data at rest.
 *
 * Uses Node.js built-in `crypto` module — no external dependency.
 * Key is derived from `ENCRYPTION_KEY` env var via `scryptSync`.
 *
 * Format: `iv:authTag:ciphertext` (all base64)
 *
 * Official source: OWASP A02:2021 — "Sensitive data must be encrypted at rest"
 * https://owasp.org/Top10/2021/A02_2021-Cryptographic_Failures/
 *
 * Official source: Node.js crypto — https://nodejs.org/api/crypto.html
 */
@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor() {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'ENCRYPTION_KEY is not set. Required for encrypting sensitive data at rest.',
      );
    }
    // Derive a 32-byte (256-bit) AES key from the env var using scrypt.
    // The salt is fixed per-deployment (derived from the key itself) so the
    // same env var always produces the same derived key — necessary for
    // decrypting previously encrypted values.
    this.key = scryptSync(encryptionKey, 'smart-screen-salt', 32);
  }

  /**
   * Encrypt a plaintext string using AES-256-GCM.
   * @returns `iv:authTag:ciphertext` (all base64)
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(12); // 96-bit IV is recommended for GCM
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [iv, authTag, ciphertext].map((b) => b.toString('base64')).join(':');
  }

  /**
   * Decrypt a string produced by `encrypt()`.
   *
   * Backward compatibility: if the value doesn't match the encrypted format
   * (no colons) or decryption fails, it is treated as plaintext from before
   * the encryption migration. This allows gradual migration without breaking
   * existing 2FA users.
   *
   * @param encrypted `iv:authTag:ciphertext` (all base64) or plaintext
   * @returns plaintext string
   */
  decrypt(encrypted: string): string {
    const parts = encrypted.split(':');
    if (parts.length !== 3) {
      return encrypted;
    }
    try {
      const [ivB64, authTagB64, ciphertextB64] = parts;
      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const ciphertext = Buffer.from(ciphertextB64, 'base64');

      const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
      decipher.setAuthTag(authTag);
      const plaintext = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]);
      return plaintext.toString('utf8');
    } catch {
      return encrypted;
    }
  }
}
