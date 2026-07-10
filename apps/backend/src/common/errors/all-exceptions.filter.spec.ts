import { BadRequestException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { DomainException } from './domain.exception';
import { ErrorCode } from './error-codes';

type FakeResponse = {
  status: jest.Mock;
  json: jest.Mock;
  headersSent?: boolean;
};

function httpHost(response: FakeResponse): ArgumentsHost {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ method: 'POST', originalUrl: '/api/v1/whatever' }),
    }),
  } as unknown as ArgumentsHost;
}

/**
 * Mirrors a real gateway context: Nest fills `ArgumentsHost` with
 * `[client, data]`, so `switchToHttp().getResponse()` returns the message
 * payload — an object with no `.status()`.
 */
function wsHost(client: { emit: jest.Mock }): ArgumentsHost {
  const data = { serialNumber: 'CS-1' };
  return {
    getType: () => 'ws',
    switchToWs: () => ({ getClient: () => client, getData: () => data }),
    switchToHttp: () => ({
      getResponse: () => data,
      getRequest: () => client,
    }),
  } as unknown as ArgumentsHost;
}

function makeResponse(): FakeResponse {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  return { status, json, headersSent: false };
}

describe('AllExceptionsFilter', () => {
  describe('http context', () => {
    it('normalizes an HttpException into the {statusCode, code, message} contract', () => {
      const response = makeResponse();
      const filter = new AllExceptionsFilter();

      filter.catch(new BadRequestException('some detail'), httpHost(response));

      expect(response.status).toHaveBeenCalledWith(400);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        code: ErrorCode.BAD_REQUEST,
        message: 'some detail',
      });
    });

    it('preserves a DomainException code and details', () => {
      const response = makeResponse();
      const filter = new AllExceptionsFilter();

      filter.catch(
        DomainException.badRequest(
          ErrorCode.SCREEN_LIMIT_REACHED,
          'limit reached',
          { limit: 25 },
        ),
        httpHost(response),
      );

      expect(response.json).toHaveBeenCalledWith({
        statusCode: 400,
        code: ErrorCode.SCREEN_LIMIT_REACHED,
        message: 'limit reached',
        details: { limit: 25 },
      });
    });

    it('normalizes a raw (non-Http) error to a generic 500, hiding its real message', () => {
      const response = makeResponse();
      const filter = new AllExceptionsFilter();

      filter.catch(
        new Error('relation "Foo" does not exist — raw Prisma detail'),
        httpHost(response),
      );

      expect(response.status).toHaveBeenCalledWith(500);
      expect(response.json).toHaveBeenCalledWith({
        statusCode: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      });
      const [body] = response.json.mock.calls[0] as [{ message: string }];
      expect(String(body.message)).not.toContain('Prisma');
    });

    it('does not try to rewrite a response that was already sent', () => {
      const response = makeResponse();
      response.headersSent = true;
      const filter = new AllExceptionsFilter();

      filter.catch(new Error('late failure'), httpHost(response));

      expect(response.status).not.toHaveBeenCalled();
    });
  });

  /**
   * Regression: this filter is registered via APP_FILTER, so it also receives
   * exceptions thrown inside `@SubscribeMessage` handlers. It used to call
   * `switchToHttp().getResponse().status(...)` on those, which threw a
   * TypeError from within the filter itself — the socket client got no reply
   * and the original error never reached the logs.
   */
  describe('websocket context', () => {
    it('does not throw, and reports a generic error to the client', () => {
      const client = { emit: jest.fn() };
      const filter = new AllExceptionsFilter();

      expect(() =>
        filter.catch(
          new Error('relation "Screen" does not exist'),
          wsHost(client),
        ),
      ).not.toThrow();

      expect(client.emit).toHaveBeenCalledWith('exception', {
        statusCode: 500,
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Internal server error',
      });
    });

    it('never leaks the underlying error text to the socket client', () => {
      const client = { emit: jest.fn() };
      const filter = new AllExceptionsFilter();

      filter.catch(new Error('raw Prisma detail'), wsHost(client));

      const [, payload] = client.emit.mock.calls[0] as [string, unknown];
      expect(JSON.stringify(payload)).not.toContain('Prisma');
    });

    it('forwards an HttpException body to the socket client', () => {
      const client = { emit: jest.fn() };
      const filter = new AllExceptionsFilter();

      filter.catch(new BadRequestException('BAD_PAYLOAD'), wsHost(client));

      expect(client.emit).toHaveBeenCalledWith('exception', {
        statusCode: 400,
        code: ErrorCode.BAD_REQUEST,
        message: 'BAD_PAYLOAD',
      });
    });

    it('tolerates a client with no emit (disconnected socket)', () => {
      const filter = new AllExceptionsFilter();
      const host = {
        getType: () => 'ws',
        switchToWs: () => ({ getClient: () => ({}) }),
      } as unknown as ArgumentsHost;

      expect(() => filter.catch(new Error('boom'), host)).not.toThrow();
    });
  });
});
