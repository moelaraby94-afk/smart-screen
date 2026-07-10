import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from './error-codes';

/**
 * The only exception type that carries a stable `code` and structured `details`.
 *
 * Prefer it over Nest's built-ins for anything a user can trigger. Built-in
 * exceptions still work — AllExceptionsFilter gives them a generic code derived
 * from their status — but they cannot carry data, which is how
 * `SCREEN_LIMIT_REACHED:25` ended up encoded inside a message string and parsed
 * back apart in the browser.
 */
export class DomainException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    status: HttpStatus,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super({ statusCode: status, code, message, details }, status);
  }

  static badRequest(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(code, HttpStatus.BAD_REQUEST, message, details);
  }

  static unauthorized(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(code, HttpStatus.UNAUTHORIZED, message, details);
  }

  static forbidden(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(code, HttpStatus.FORBIDDEN, message, details);
  }

  static notFound(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(code, HttpStatus.NOT_FOUND, message, details);
  }

  static conflict(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(code, HttpStatus.CONFLICT, message, details);
  }

  static tooManyRequests(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(
      code,
      HttpStatus.TOO_MANY_REQUESTS,
      message,
      details,
    );
  }

  static serviceUnavailable(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): DomainException {
    return new DomainException(
      code,
      HttpStatus.SERVICE_UNAVAILABLE,
      message,
      details,
    );
  }
}
