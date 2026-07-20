/**
 * Stable, machine-readable error codes. These are part of the public API
 * contract: clients switch on `code`, never on `message`.
 *
 * `message` stays in the response for logs and debugging, but it is English
 * prose and must never be shown to a user — the dashboard renders every error
 * from `errors.<CODE>` in its own message catalogue.
 *
 * Never rename a code. Adding one is safe: clients fall back to a generic
 * message for codes they do not recognise.
 */
export const ErrorCode = {
  // --- generic, derived from the HTTP status when nothing more specific applies
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // --- authentication / registration
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
  EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  INVALID_OTP: 'INVALID_OTP',
  OTP_EXPIRED: 'OTP_EXPIRED',
  INVALID_RESET_TOKEN: 'INVALID_RESET_TOKEN',
  /** details: { retryAfterSeconds: number } */
  TOO_MANY_LOGIN_ATTEMPTS: 'TOO_MANY_LOGIN_ATTEMPTS',
  EMAIL_NOT_CONFIGURED: 'EMAIL_NOT_CONFIGURED',

  // --- two-factor authentication
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',

  // --- workspace access
  NO_WORKSPACE_ACCESS: 'NO_WORKSPACE_ACCESS',
  INSUFFICIENT_WORKSPACE_ROLE: 'INSUFFICIENT_WORKSPACE_ROLE',
  WORKSPACE_PAUSED: 'WORKSPACE_PAUSED',

  // --- plan limits. `details` carries the numbers the UI needs to render a message.
  /** details: { limit: number } */
  SCREEN_LIMIT_REACHED: 'SCREEN_LIMIT_REACHED',
  /** details: { limitBytes: number; usedBytes: number; requestedBytes: number } */
  STORAGE_LIMIT_REACHED: 'STORAGE_LIMIT_REACHED',
  /** details: { storageUsed: number; storageLimit: number } — 413 */
  STORAGE_QUOTA_EXCEEDED: 'STORAGE_QUOTA_EXCEEDED',

  // --- screen pairing
  INVALID_OR_EXPIRED_PAIRING_CODE: 'INVALID_OR_EXPIRED_PAIRING_CODE',
  /** details: { retryAfterSeconds: number } */
  TOO_MANY_FAILED_PAIRING_ATTEMPTS: 'TOO_MANY_FAILED_PAIRING_ATTEMPTS',

  // --- media
  /** details: { declared: string; detected: string } */
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  /** details: { maxBytes: number } */
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  MEDIA_IN_USE: 'MEDIA_IN_USE',
  MEDIA_FILE_MISSING: 'MEDIA_FILE_MISSING',

  // --- billing
  UNSUPPORTED_PLAN: 'UNSUPPORTED_PLAN',
  STRIPE_NOT_CONFIGURED: 'STRIPE_NOT_CONFIGURED',

  // --- webhooks
  SSRF_BLOCKED: 'SSRF_BLOCKED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

/** Shape of every non-2xx response body the API returns. */
export type ApiErrorBody = {
  statusCode: number;
  code: ErrorCode;
  /** English, for logs and developers. Never rendered to an end user. */
  message: string;
  /** Structured data for the client to interpolate into its own message. */
  details?: Record<string, unknown>;
};
