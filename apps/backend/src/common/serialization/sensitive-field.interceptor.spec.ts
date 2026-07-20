import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { SensitiveFieldInterceptor } from './sensitive-field.interceptor';

describe('SensitiveFieldInterceptor', () => {
  let interceptor: SensitiveFieldInterceptor;

  beforeEach(() => {
    interceptor = new SensitiveFieldInterceptor();
  });

  const mockContext = {} as ExecutionContext;
  const callWith = (data: unknown) =>
    ({ handle: () => of(data) }) as unknown as CallHandler;

  it('strips passwordHash from response objects', (done) => {
    const input = { id: '1', name: 'test', passwordHash: 'secret-hash' };
    interceptor.intercept(mockContext, callWith(input)).subscribe((result) => {
      expect(result).toEqual({ id: '1', name: 'test' });
      done();
    });
  });

  it('strips pairingSecretHash from nested objects', (done) => {
    const input = {
      screens: [
        { id: 's1', pairingSecretHash: 'hash1' },
        { id: 's2', pairingSecretHash: 'hash2' },
      ],
    };
    interceptor.intercept(mockContext, callWith(input)).subscribe((result) => {
      expect(result).toEqual({
        screens: [{ id: 's1' }, { id: 's2' }],
      });
      done();
    });
  });

  it('strips token and secret fields', (done) => {
    const input = {
      token: 'abc',
      secret: 'xyz',
      accessToken: 'tok-1',
      refreshToken: 'ref-1',
      data: 'safe',
    };
    interceptor.intercept(mockContext, callWith(input)).subscribe((result) => {
      expect(result).toEqual({ data: 'safe' });
      done();
    });
  });

  it('preserves non-sensitive fields', (done) => {
    const input = {
      id: '1',
      name: 'test',
      email: 'test@example.com',
      createdAt: '2025-01-01T00:00:00Z',
    };
    interceptor.intercept(mockContext, callWith(input)).subscribe((result) => {
      expect(result).toEqual(input);
      done();
    });
  });

  it('handles null and primitive values', (done) => {
    interceptor.intercept(mockContext, callWith(null)).subscribe((result) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('handles arrays of primitives', (done) => {
    interceptor
      .intercept(mockContext, callWith([1, 'two', null]))
      .subscribe((result) => {
        expect(result).toEqual([1, 'two', null]);
        done();
      });
  });

  it('strips screenSecretHandoff from nested objects', (done) => {
    const input = {
      session: {
        id: 'sess-1',
        screenSecretHandoff: 'raw-secret',
        status: 'COMPLETE',
      },
    };
    interceptor.intercept(mockContext, callWith(input)).subscribe((result) => {
      expect(result).toEqual({
        session: { id: 'sess-1', status: 'COMPLETE' },
      });
      done();
    });
  });
});
