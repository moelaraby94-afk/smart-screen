import { cookies } from 'next/headers';

const API_BASE = (
  process.env.INTERNAL_API_BASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  'http://localhost:4000/api/v1'
).replace(/\/+$/, '');

export type AuthMeServer = {
  authenticated: boolean;
  isSuperAdmin: boolean;
  isPlatformStaff: boolean;
};

export async function fetchAuthMeServer(): Promise<AuthMeServer> {
  try {
    const jar = await cookies();
    const parts = jar.getAll().map((c) => `${c.name}=${c.value}`);
    if (parts.length === 0) {
      return { authenticated: false, isSuperAdmin: false, isPlatformStaff: false };
    }
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: { Cookie: parts.join('; ') },
      cache: 'no-store',
    });
    if (!res.ok) {
      return { authenticated: false, isSuperAdmin: false, isPlatformStaff: false };
    }
    const body = (await res.json()) as {
      isSuperAdmin?: boolean;
      isPlatformStaff?: boolean;
    };
    return {
      authenticated: true,
      isSuperAdmin: body.isSuperAdmin === true,
      isPlatformStaff:
        body.isSuperAdmin === true || body.isPlatformStaff === true,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      `[server-auth] ${API_BASE}/auth/me failed; treating request as unauthenticated.`,
      error,
    );
    return { authenticated: false, isSuperAdmin: false, isPlatformStaff: false };
  }
}
