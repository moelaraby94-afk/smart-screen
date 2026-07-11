import { ConsoleLogger, LoggerService } from '@nestjs/common';
import { requestContext } from './request-context';

/**
 * Wraps NestJS's ConsoleLogger to:
 * 1. Append `requestId` from AsyncLocalStorage to every log message.
 * 2. Emit JSON in production, plain text in development.
 *
 * The JSON shape is intentionally minimal:
 *   { level, message, requestId, context, timestamp }
 */
export class AppLogger extends ConsoleLogger implements LoggerService {
  private readonly isProduction: boolean;

  constructor(context = 'App') {
    super(context);
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  private withRequestId(message: unknown): string {
    const store = requestContext.getStore();
    const requestId = store?.requestId ?? '-';
    const text = typeof message === 'string' ? message : String(message);
    return this.isProduction
      ? JSON.stringify({ level: '', message: text, requestId, context: this.context, timestamp: new Date().toISOString() })
      : `[${requestId}] ${text}`;
  }

  log(message: unknown, context?: string): void {
    const ctx = context ?? this.context;
    if (this.isProduction) {
      const store = requestContext.getStore();
      const text = typeof message === 'string' ? message : String(message);
      console.log(JSON.stringify({ level: 'info', message: text, requestId: store?.requestId ?? '-', context: ctx, timestamp: new Date().toISOString() }));
    } else {
      super.log(this.withRequestId(message), context);
    }
  }

  error(message: unknown, trace?: string, context?: string): void {
    const ctx = context ?? this.context;
    if (this.isProduction) {
      const store = requestContext.getStore();
      const text = typeof message === 'string' ? message : String(message);
      console.error(JSON.stringify({ level: 'error', message: text, trace: trace ?? undefined, requestId: store?.requestId ?? '-', context: ctx, timestamp: new Date().toISOString() }));
    } else {
      super.error(this.withRequestId(message), trace, context);
    }
  }

  warn(message: unknown, context?: string): void {
    const ctx = context ?? this.context;
    if (this.isProduction) {
      const store = requestContext.getStore();
      const text = typeof message === 'string' ? message : String(message);
      console.warn(JSON.stringify({ level: 'warn', message: text, requestId: store?.requestId ?? '-', context: ctx, timestamp: new Date().toISOString() }));
    } else {
      super.warn(this.withRequestId(message), context);
    }
  }

  debug(message: unknown, context?: string): void {
    const ctx = context ?? this.context;
    if (this.isProduction) {
      const store = requestContext.getStore();
      const text = typeof message === 'string' ? message : String(message);
      console.debug(JSON.stringify({ level: 'debug', message: text, requestId: store?.requestId ?? '-', context: ctx, timestamp: new Date().toISOString() }));
    } else {
      super.debug(this.withRequestId(message), context);
    }
  }

  verbose(message: unknown, context?: string): void {
    const ctx = context ?? this.context;
    if (this.isProduction) {
      const store = requestContext.getStore();
      const text = typeof message === 'string' ? message : String(message);
      console.log(JSON.stringify({ level: 'verbose', message: text, requestId: store?.requestId ?? '-', context: ctx, timestamp: new Date().toISOString() }));
    } else {
      super.verbose(this.withRequestId(message), context);
    }
  }
}
