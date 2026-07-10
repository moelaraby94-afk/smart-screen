import { Catch, HttpException, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { SentryExceptionCaptured } from '@sentry/nestjs';
import type { Request, Response } from 'express';
import { normalizeHttpError } from './normalize-http-error';

/** Minimal shape of a Socket.IO client — avoids importing socket.io here. */
type EmittingClient = { emit?: (event: string, payload: unknown) => void };

/**
 * Nest's built-in default filter already returns a generic 500 for
 * non-HttpException errors, so this isn't closing an active leak — it makes
 * that safety net an explicit, visible part of the codebase (not an implicit
 * framework default), adds request-context logging for unhandled errors, and
 * wires Sentry reporting (per @sentry/nestjs's own setup contract: a global
 * catch-all filter must decorate `catch()` with @SentryExceptionCaptured()
 * for unhandled errors to be reported).
 *
 * Registered via APP_FILTER, which applies to *every* execution context, not
 * just HTTP. A WebSocket handler's `ArgumentsHost` holds `[client, data]`, so
 * `switchToHttp().getResponse()` would hand back the message payload and
 * `response.status()` would throw a TypeError from inside this filter —
 * masking the original error and leaving the socket client with no reply.
 * Each transport is therefore handled on its own terms below.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  @SentryExceptionCaptured()
  catch(exception: unknown, host: ArgumentsHost): void {
    switch (host.getType()) {
      case 'http':
        this.catchHttp(exception, host);
        return;
      case 'ws':
        this.catchWs(exception, host);
        return;
      default:
        this.logUnhandled(exception, `${host.getType()} context`);
    }
  }

  private catchHttp(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // A streamed or already-sent response cannot be rewritten.
    if (response.headersSent) {
      this.logUnhandled(
        exception,
        `${request.method} ${request.originalUrl} (response already sent)`,
      );
      return;
    }

    if (!(exception instanceof HttpException)) {
      this.logUnhandled(exception, `${request.method} ${request.originalUrl}`);
    }

    const body = normalizeHttpError(exception);
    response.status(body.statusCode).json(body);
  }

  private catchWs(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<EmittingClient>();

    if (!(exception instanceof HttpException)) {
      this.logUnhandled(exception, 'websocket message handler');
    }

    client?.emit?.('exception', normalizeHttpError(exception));
  }

  private logUnhandled(exception: unknown, context: string): void {
    this.logger.error(
      `Unhandled exception on ${context}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
  }
}
