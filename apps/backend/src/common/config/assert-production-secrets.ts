const REQUIRED_SECRETS = [
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'PLAYER_HEARTBEAT_SECRET',
] as const;

/**
 * Placeholders that appear in this repository's own tracked files (source
 * fallbacks, docker-compose defaults, .env.example) and other values common
 * enough to be in any attacker's first guess. Matched case-insensitively.
 *
 * A blocklist alone is not the defence — it always lags behind whatever
 * placeholder someone adds next, which is exactly how `change-me-in-production`
 * (the docker-compose default) sailed past the original check. The length and
 * character-variety rules below are what actually hold; this list only exists
 * to produce a clearer error for the placeholders we already ship.
 */
const KNOWN_PLACEHOLDER_SECRETS = new Set([
  'dev-access-secret',
  'dev-refresh-secret',
  'dev-player-heartbeat-secret',
  'change-me-in-production',
  'change-me',
  'changeme',
  'secret',
  'password',
  'test',
]);

/** 32 chars of a random base64url/hex string — what `openssl rand -hex 32` gives. */
const MIN_SECRET_LENGTH = 32;

/** Rejects e.g. 'aaaa…' (32 chars, one bit of entropy). */
const MIN_DISTINCT_CHARACTERS = 8;

function describeWeakness(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return 'is unset or empty';
  if (KNOWN_PLACEHOLDER_SECRETS.has(trimmed.toLowerCase())) {
    return 'is a publicly known placeholder from this repository';
  }
  if (trimmed.length < MIN_SECRET_LENGTH) {
    return `is shorter than ${MIN_SECRET_LENGTH} characters (${trimmed.length})`;
  }
  if (new Set(trimmed).size < MIN_DISTINCT_CHARACTERS) {
    return `uses fewer than ${MIN_DISTINCT_CHARACTERS} distinct characters`;
  }
  return null;
}

/**
 * Dev fallbacks for these variables live in the (public) source, so an unset or
 * placeholder value in production is a live JWT-forgery / player-impersonation
 * key rather than merely a weak one. Fail fast at boot instead of starting
 * silently insecure.
 */
export function assertProductionSecretsAreSet(env: NodeJS.ProcessEnv): void {
  if (env.NODE_ENV !== 'production') return;

  const problems = REQUIRED_SECRETS.flatMap((name) => {
    const weakness = describeWeakness(env[name]);
    return weakness ? [`${name} ${weakness}`] : [];
  });

  /**
   * Access and refresh tokens carry the same claims and differ only by signing
   * key. Reusing one key across both makes a refresh token a valid access token
   * (see the `typ` claim in auth.service.ts, which guards this independently).
   */
  const access = env.JWT_ACCESS_SECRET?.trim();
  const refresh = env.JWT_REFRESH_SECRET?.trim();
  if (access && refresh && access === refresh) {
    problems.push(
      'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are identical (they must be two independent keys)',
    );
  }

  if (problems.length > 0) {
    throw new Error(
      'Refusing to start with NODE_ENV=production:\n' +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\nGenerate each with a fresh `openssl rand -hex 32` and set them in the ' +
        'production environment.',
    );
  }
}
