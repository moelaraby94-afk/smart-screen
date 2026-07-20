import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Fields that must never appear in an API response, regardless of what a
 * service returns. This is a defence-in-depth layer — services should already
 * use toResponse() / serialize*() methods, but this interceptor catches any
 * accidental leakage of hashes, secrets, or internal identifiers.
 */
const SENSITIVE_FIELDS = new Set([
  'passwordHash',
  'pairingSecretHash',
  'tokenHash',
  'screenSecretHandoff',
  'secret',
  'secretHash',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'encryptionKey',
  'apiKey',
  'stripeWebhookSecret',
  'twoFactorSecret',
  'twoFactorBackupCodes',
  'verificationCode',
  'passwordResetToken',
  'pendingEmailOtp',
  'refreshTokenHash',
  'keyHash',
  'pollSecret',
  'sessionSecret',
]);

function scrubValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map(scrubValue);
  }

  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    if (SENSITIVE_FIELDS.has(key)) continue;
    result[key] = scrubValue(obj[key]);
  }
  return result;
}

@Injectable()
export class SensitiveFieldInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => scrubValue(data)));
  }
}
