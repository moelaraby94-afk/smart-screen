import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const apiBase =
    process.env.INTERNAL_API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim();

  let backend = 'unknown';
  if (apiBase) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${apiBase.replace(/\/$/, '')}/../health`, {
        signal: controller.signal,
        cache: 'no-store',
      });
      clearTimeout(timeout);
      backend = res.ok ? 'up' : 'down';
    } catch {
      backend = 'down';
    }
  }

  const status = backend === 'down' ? 503 : 200;
  return NextResponse.json(
    { status: backend === 'down' ? 'degraded' : 'ok', backend },
    { status },
  );
}
