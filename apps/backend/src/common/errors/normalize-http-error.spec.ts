import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { DomainException } from './domain.exception';
import { ErrorCode } from './error-codes';
import { normalizeHttpError } from './normalize-http-error';

/**
 * Every non-2xx body must carry a stable `code`. Clients switch on it; they
 * must never parse `message`, which is English prose and used to have data
 * interpolated into it (`SCREEN_LIMIT_REACHED:25`).
 */
describe('normalizeHttpError', () => {
  it('passes a DomainException through with its code and details', () => {
    const body = normalizeHttpError(
      DomainException.badRequest(
        ErrorCode.SCREEN_LIMIT_REACHED,
        'Workspace already has 25 of 25 allowed screens',
        { limit: 25, current: 25 },
      ),
    );

    expect(body).toEqual({
      statusCode: HttpStatus.BAD_REQUEST,
      code: ErrorCode.SCREEN_LIMIT_REACHED,
      message: 'Workspace already has 25 of 25 allowed screens',
      details: { limit: 25, current: 25 },
    });
  });

  it('turns a ValidationPipe rejection into VALIDATION_FAILED with the violations', () => {
    const violations = ['name must be a string', 'name must be longer'];
    const body = normalizeHttpError(new BadRequestException(violations));

    expect(body.statusCode).toBe(400);
    expect(body.code).toBe(ErrorCode.VALIDATION_FAILED);
    expect(body.details).toEqual({ violations });
  });

  it.each([
    [new BadRequestException('nope'), 400, ErrorCode.BAD_REQUEST],
    [new ForbiddenException('nope'), 403, ErrorCode.FORBIDDEN],
    [new NotFoundException('nope'), 404, ErrorCode.NOT_FOUND],
    [
      new ServiceUnavailableException('nope'),
      503,
      ErrorCode.SERVICE_UNAVAILABLE,
    ],
  ])(
    'derives a code from a built-in exception (%#)',
    (exception, status, code) => {
      const body = normalizeHttpError(exception);

      expect(body.statusCode).toBe(status);
      expect(body.code).toBe(code);
    },
  );

  it('maps a ThrottlerException to TOO_MANY_REQUESTS', () => {
    const body = normalizeHttpError(new ThrottlerException());

    expect(body.statusCode).toBe(429);
    expect(body.code).toBe(ErrorCode.TOO_MANY_REQUESTS);
  });

  it('never leaks an unhandled error to the client', () => {
    const body = normalizeHttpError(
      new Error('relation "Screen" does not exist — raw Prisma detail'),
    );

    expect(body).toEqual({
      statusCode: 500,
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Internal server error',
    });
    expect(JSON.stringify(body)).not.toContain('Prisma');
  });

  it('handles an exception whose response body is a bare string', () => {
    const body = normalizeHttpError(new ForbiddenException());

    expect(body.statusCode).toBe(403);
    expect(body.code).toBe(ErrorCode.FORBIDDEN);
    expect(typeof body.message).toBe('string');
  });

  it('gives every DomainException factory the right status', () => {
    const cases: Array<[DomainException, number]> = [
      [DomainException.unauthorized(ErrorCode.INVALID_CREDENTIALS, 'x'), 401],
      [DomainException.forbidden(ErrorCode.WORKSPACE_PAUSED, 'x'), 403],
      [DomainException.notFound(ErrorCode.NOT_FOUND, 'x'), 404],
      [DomainException.conflict(ErrorCode.EMAIL_ALREADY_REGISTERED, 'x'), 409],
      [
        DomainException.tooManyRequests(
          ErrorCode.TOO_MANY_FAILED_PAIRING_ATTEMPTS,
          'x',
          { retryAfterSeconds: 1800 },
        ),
        429,
      ],
      [
        DomainException.serviceUnavailable(ErrorCode.EMAIL_NOT_CONFIGURED, 'x'),
        503,
      ],
    ];

    for (const [exception, status] of cases) {
      const body = normalizeHttpError(exception);
      expect(body.statusCode).toBe(status);
      expect(body.code).toBe(exception.code);
    }
  });
});
