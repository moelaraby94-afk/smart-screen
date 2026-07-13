/**
 * Shared CORS origin resolver — single source of truth for both
 * the REST API (main.ts) and the WebSocket gateway.
 *
 * Production: uses ALLOWED_ORIGINS only. No localhost fallback.
 * Development: merges FRONTEND_ORIGINS + FRONTEND_ORIGIN + localhost defaults.
 */

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
];

/**
 * Returns the allowed origin list for the current environment.
 * In production, throws if ALLOWED_ORIGINS is missing or empty
 * (fail-fast, matching main.ts bootstrap behaviour).
 */
export function getAllowedOrigins(): string[] {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const origins = process.env.ALLOWED_ORIGINS?.split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (!origins?.length) {
      throw new Error(
        'ALLOWED_ORIGINS is required when NODE_ENV=production: a comma-separated ' +
          'list of allowed browser origins, e.g. ' +
          '"https://app.example.com,https://admin.example.com". Refusing to start ' +
          'with an undefined CORS policy.',
      );
    }
    return origins;
  }

  const fromList =
    process.env.FRONTEND_ORIGINS?.split(',').map((o) => o.trim()) ?? [];
  const single = process.env.FRONTEND_ORIGIN?.trim();
  return [
    ...new Set([
      ...fromList,
      ...(single ? [single] : []),
      ...DEFAULT_DEV_ORIGINS,
    ]),
  ].filter(Boolean);
}

/**
 * CORS origin callback compatible with both Express (`app.enableCors`)
 * and Socket.IO (`@WebSocketGateway`).
 *
 * Allows if no Origin header (server-to-server / same-origin) or
 * if the origin is in the allow-list. Rejects otherwise.
 */
export function createCorsOriginChecker():
  | boolean
  | string[]
  | ((
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => void) {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const allowed = getAllowedOrigins();
    return (origin, callback) => {
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin "${origin}" is not allowed by CORS.`));
      }
    };
  }

  const trustDynamicCors =
    process.env.TRUST_DYNAMIC_CORS === 'true' ||
    process.env.TRUST_DYNAMIC_CORS === '1';
  if (trustDynamicCors) return true;

  return getAllowedOrigins();
}
