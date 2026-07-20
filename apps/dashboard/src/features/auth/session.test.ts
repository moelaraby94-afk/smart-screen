import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getApiBaseUrl,
  setStoredAccessToken,
  getStoredAccessToken,
} from '@/features/auth/session';

describe('session.ts — pure functions (P1-T5)', () => {
  // ─── Test 1: getApiBaseUrl ──────────────────────────────────────────
  describe('getApiBaseUrl', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

    afterEach(() => {
      if (originalEnv === undefined) {
        delete process.env.NEXT_PUBLIC_API_BASE_URL;
      } else {
        process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
      }
    });

    it('returns the env value when set, with trailing slashes stripped', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL =
        'https://api.example.com/api/v1///';
      expect(getApiBaseUrl()).toBe('https://api.example.com/api/v1');
    });

    it('falls back to /api/v1 when env is empty string', () => {
      process.env.NEXT_PUBLIC_API_BASE_URL = '';
      expect(getApiBaseUrl()).toBe('/api/v1');
    });

    it('falls back to /api/v1 when env is unset', () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL;
      expect(getApiBaseUrl()).toBe('/api/v1');
    });
  });

  // ─── Test 2: setStoredAccessToken / getStoredAccessToken ────────────
  describe('setStoredAccessToken / getStoredAccessToken', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      if (originalNodeEnv === undefined) {
        delete (process.env as Record<string, string | undefined>).NODE_ENV;
      } else {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      }
      localStorage.clear();
    });

    it('stores and retrieves a token in non-production', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      setStoredAccessToken('my-jwt-token');
      expect(getStoredAccessToken()).toBe('my-jwt-token');
    });

    it('is a no-op in production (returns null, does not store)', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      setStoredAccessToken('my-jwt-token');
      expect(getStoredAccessToken()).toBeNull();
      expect(localStorage.getItem('cs_access_token')).toBeNull();
    });

    it('clears the token when passed null', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'development';
      setStoredAccessToken('my-jwt-token');
      expect(getStoredAccessToken()).toBe('my-jwt-token');
      setStoredAccessToken(null);
      expect(getStoredAccessToken()).toBeNull();
    });
  });
});
