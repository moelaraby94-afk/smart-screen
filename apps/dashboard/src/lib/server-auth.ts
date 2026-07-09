import { cookies } from 'next/headers';

/**
 * Server-side fetch (Docker): use the service hostname; the browser still uses
 * NEXT_PUBLIC_*.
 *
 * `||`, not `??`: `.env.example` ships `INTERNAL_API_BASE_URL=""` and documents
 * "leave empty for local dev". `??` only falls back on null/undefined, so the
 * empty string won through, `fetch("/auth/me")` threw on a relative URL, and the
 * catch below turned that into "not authenticated" — every server-guarded page
 * bounced to /login.
 */
const API_BASE = (
  process.env.INTERNAL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

export type AuthMeServer = {
  authenticated: boolean;
  isSuperAdmin: boolean;
};

/** Server-side session probe using httpOnly cookies (RSC / layouts). */
export async function fetchAuthMeServer(): Promise<AuthMeServer> {
  try {
    const jar = await cookies();
    const parts = jar.getAll().map((c) => `${c.name}=${c.value}`);
    if (parts.length === 0) {
      return { authenticated: false, isSuperAdmin: false };
    }
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { Cookie: parts.join('; ') },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { authenticated: false, isSuperAdmin: false };
    }
    const body = (await res.json()) as { isSuperAdmin?: boolean };
    return {
      authenticated: true,
      isSuperAdmin: body.isSuperAdmin === true,
    };
  } catch (error) {
    /**
     * A misconfigured API_BASE or an unreachable backend is not the same thing
     * as a signed-out user, but both end in a redirect to /login. Log it, or the
     * next misconfiguration looks exactly like an expired session.
     */
    console.error(
      `[server-auth] ${API_BASE}/auth/me failed; treating request as unauthenticated.`,
      error,
    );
    return { authenticated: false, isSuperAdmin: false };
  }
}
