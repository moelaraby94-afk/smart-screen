import { RequestContextMiddleware } from './request-context.middleware';
import { requestContext } from './request-context';
import type { Request, Response } from 'express';

describe('RequestContextMiddleware', () => {
  let middleware: RequestContextMiddleware;

  beforeEach(() => {
    middleware = new RequestContextMiddleware();
  });

  function fakeReq(headers: Record<string, string> = {}): Request {
    return { headers } as unknown as Request;
  }

  function fakeRes(): Response {
    const headers: Record<string, string> = {};
    return {
      setHeader: jest.fn((k: string, v: string) => {
        headers[k] = v;
      }),
      getHeader: jest.fn((k: string) => headers[k]),
    } as unknown as Response;
  }

  it('generates a new requestId when no x-request-id header is present', () => {
    const req = fakeReq();
    const res = fakeRes();
    let captured: string | undefined;

    middleware.use(req, res, () => {
      captured = requestContext.getStore()?.requestId;
    });

    expect(captured).toBeDefined();
    expect(captured).toHaveLength(36); // UUID format
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', captured);
  });

  it('preserves an incoming x-request-id header', () => {
    const req = fakeReq({ 'x-request-id': 'abc-123-test' });
    const res = fakeRes();
    let captured: string | undefined;

    middleware.use(req, res, () => {
      captured = requestContext.getStore()?.requestId;
    });

    expect(captured).toBe('abc-123-test');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'abc-123-test');
  });

  it('truncates an excessively long x-request-id header', () => {
    const longId = 'a'.repeat(200);
    const req = fakeReq({ 'x-request-id': longId });
    const res = fakeRes();
    let captured: string | undefined;

    middleware.use(req, res, () => {
      captured = requestContext.getStore()?.requestId;
    });

    expect(captured).toHaveLength(128);
  });

  it('generates a new id when x-request-id is empty string', () => {
    const req = fakeReq({ 'x-request-id': '   ' });
    const res = fakeRes();
    let captured: string | undefined;

    middleware.use(req, res, () => {
      captured = requestContext.getStore()?.requestId;
    });

    expect(captured).toHaveLength(36);
  });

  it('requestId is undefined outside the request context', () => {
    expect(requestContext.getStore()).toBeUndefined();
  });
});
