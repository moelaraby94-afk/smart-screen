import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';

const HEADER = 'x-request-id';

/**
 * Reads or generates an `x-request-id` for every inbound HTTP request,
 * echoes it on the response, and stores it in AsyncLocalStorage so any
 * log line emitted during the request lifecycle can include it.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[HEADER];
    const id =
      typeof incoming === 'string' && incoming.trim().length > 0
        ? incoming.trim().slice(0, 128)
        : randomUUID();

    res.setHeader(HEADER, id);
    requestContext.run({ requestId: id }, () => next());
  }
}
