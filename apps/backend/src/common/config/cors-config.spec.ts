/* eslint-disable @typescript-eslint/no-unused-vars */
import { getAllowedOrigins, createCorsOriginChecker } from './cors-config';

type OriginCallback = (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void;

describe('cors-config (T2.5)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ─── Production ──────────────────────────────────────────────────

  describe('production (NODE_ENV=production)', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('uses ALLOWED_ORIGINS when set', () => {
      process.env.ALLOWED_ORIGINS =
        'https://app.example.com,https://admin.example.com';
      process.env.FRONTEND_ORIGINS = 'http://localhost:3000';

      const origins = getAllowedOrigins();
      expect(origins).toEqual([
        'https://app.example.com',
        'https://admin.example.com',
      ]);
    });

    it('throws if ALLOWED_ORIGINS is missing', () => {
      delete process.env.ALLOWED_ORIGINS;
      expect(() => getAllowedOrigins()).toThrow('ALLOWED_ORIGINS is required');
    });

    it('throws if ALLOWED_ORIGINS is empty', () => {
      process.env.ALLOWED_ORIGINS = '   ,  ';
      expect(() => getAllowedOrigins()).toThrow('ALLOWED_ORIGINS is required');
    });

    it('createCorsOriginChecker returns a callback that allows listed origins', () => {
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      const checker = createCorsOriginChecker();
      expect(typeof checker).toBe('function');

      const cb = jest.fn();
      (checker as OriginCallback)('https://app.example.com', cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('createCorsOriginChecker rejects unlisted origins with an error', () => {
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      const checker = createCorsOriginChecker();
      const cb = jest.fn();
      (checker as OriginCallback)('http://localhost:3000', cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });

    it('createCorsOriginChecker allows no-origin (server-to-server) requests', () => {
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      const checker = createCorsOriginChecker();
      const cb = jest.fn();
      (checker as OriginCallback)(undefined, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('does NOT fall back to localhost in production', () => {
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';
      delete process.env.FRONTEND_ORIGINS;

      const origins = getAllowedOrigins();
      expect(origins).not.toContain('http://localhost:3000');
      expect(origins).not.toContain('http://localhost:3001');
    });
  });

  // ─── Development ─────────────────────────────────────────────────

  describe('development (NODE_ENV != production)', () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it('includes localhost defaults', () => {
      delete process.env.FRONTEND_ORIGINS;
      delete process.env.FRONTEND_ORIGIN;

      const origins = getAllowedOrigins();
      expect(origins).toContain('http://localhost:3000');
      expect(origins).toContain('http://localhost:3001');
      expect(origins).toContain('http://127.0.0.1:3000');
      expect(origins).toContain('http://127.0.0.1:3001');
    });

    it('respects FRONTEND_ORIGINS in dev', () => {
      process.env.FRONTEND_ORIGINS =
        'http://dev.example.com:3000,http://staging.example.com';

      const origins = getAllowedOrigins();
      expect(origins).toContain('http://dev.example.com:3000');
      expect(origins).toContain('http://staging.example.com');
    });

    it('respects FRONTEND_ORIGIN (single) in dev', () => {
      process.env.FRONTEND_ORIGIN = 'http://custom.example.com';

      const origins = getAllowedOrigins();
      expect(origins).toContain('http://custom.example.com');
    });

    it('returns array (not function) when TRUST_DYNAMIC_CORS is not set', () => {
      delete process.env.TRUST_DYNAMIC_CORS;
      const checker = createCorsOriginChecker();
      expect(Array.isArray(checker)).toBe(true);
    });

    it('returns true when TRUST_DYNAMIC_CORS=true', () => {
      process.env.TRUST_DYNAMIC_CORS = 'true';
      const checker = createCorsOriginChecker();
      expect(checker).toBe(true);
    });

    it('returns true when TRUST_DYNAMIC_CORS=1', () => {
      process.env.TRUST_DYNAMIC_CORS = '1';
      const checker = createCorsOriginChecker();
      expect(checker).toBe(true);
    });

    it('deduplicates origins', () => {
      process.env.FRONTEND_ORIGINS =
        'http://localhost:3000,http://localhost:3000';
      const origins = getAllowedOrigins();
      const localhost3000Count = origins.filter(
        (o) => o === 'http://localhost:3000',
      ).length;
      expect(localhost3000Count).toBe(1);
    });
  });

  // ─── Regression: identical behaviour ─────────────────────────────

  describe('regression (REST and WS use same source)', () => {
    it('both calls return the same result in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOWED_ORIGINS = 'https://app.example.com';

      const origins = getAllowedOrigins();
      const checker = createCorsOriginChecker();

      expect(typeof checker).toBe('function');

      // The callback should behave consistently with the origins list
      const cb = jest.fn();
      (checker as OriginCallback)('https://app.example.com', cb);
      expect(cb).toHaveBeenCalledWith(null, true);

      const cb2 = jest.fn();
      (checker as OriginCallback)('https://evil.example.com', cb2);
      expect(cb2).toHaveBeenCalledWith(expect.any(Error));
    });

    it('both calls return the same array in development', () => {
      delete process.env.NODE_ENV;
      process.env.FRONTEND_ORIGINS = 'http://dev.example.com';

      const origins = getAllowedOrigins();
      const checker = createCorsOriginChecker();
      expect(Array.isArray(checker)).toBe(true);
      expect(checker).toEqual(origins);
    });
  });
});
