import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainException } from './domain.exception';
import { ErrorCode, type ApiErrorBody } from './error-codes';

/** Fallback code for exceptions that carry no code of their own. */
const CODE_BY_STATUS: Readonly<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHORIZED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
  [HttpStatus.SERVICE_UNAVAILABLE]: ErrorCode.SERVICE_UNAVAILABLE,
};

function codeForStatus(status: number): ErrorCode {
  if (CODE_BY_STATUS[status]) return CODE_BY_STATUS[status];
  return status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST;
}

/** ValidationPipe rejects with `{ message: string[], error, statusCode }`. */
function isValidationFailure(
  status: HttpStatus,
  body: unknown,
): body is { message: string[] } {
  return (
    status === HttpStatus.BAD_REQUEST &&
    typeof body === 'object' &&
    body !== null &&
    Array.isArray((body as { message?: unknown }).message)
  );
}

function messageFrom(body: unknown, fallback: string): string {
  if (typeof body === 'string') return body;
  if (typeof body === 'object' && body !== null) {
    const { message } = body as { message?: unknown };
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join('; ');
  }
  return fallback;
}

/**
 * Collapses every exception into the single response shape clients rely on:
 * `{ statusCode, code, message, details? }`.
 *
 * Only `DomainException` carries a meaningful code; everything else — Nest's
 * built-in exceptions, ThrottlerException, the ValidationPipe — gets one
 * derived from its status. That means a client can always switch on `code`
 * without the backend having had to convert all ~190 throw sites first.
 */
export function normalizeHttpError(exception: unknown): ApiErrorBody {
  if (exception instanceof DomainException) {
    // Already the target shape (built in its own constructor).
    return exception.getResponse() as ApiErrorBody;
  }

  if (exception instanceof HttpException) {
    const status: HttpStatus = exception.getStatus();
    const body = exception.getResponse();

    if (isValidationFailure(status, body)) {
      return {
        statusCode: status,
        code: ErrorCode.VALIDATION_FAILED,
        message: body.message.join('; '),
        details: { violations: body.message },
      };
    }

    return {
      statusCode: status,
      code: codeForStatus(status),
      message: messageFrom(body, exception.message),
    };
  }

  // Never leak an unhandled error's message or stack to the client.
  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: ErrorCode.INTERNAL_ERROR,
    message: 'Internal server error',
  };
}
