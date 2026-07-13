/**
 * Fields whose values are stripped from Sentry events to prevent
 * leaking PII (emails, passwords, tokens) to the error tracker.
 */
export const PII_FIELDS = new Set([
  'password',
  'newPassword',
  'confirmPassword',
  'currentPassword',
  'token',
  'refreshToken',
  'accessToken',
  'csrfToken',
  'x-csrf-token',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'email',
  'phone',
  'x-player-secret',
  'x-pairing-poll-secret',
  'stripe-signature',
]);

/**
 * Recursively walks an object and replaces values of PII keys with
 * `[Redacted]`. Operates on a shallow clone to avoid mutating the
 * original error/context.
 */
export function scrubPII(data: unknown, depth = 0): unknown {
  if (depth > 10) return data;
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map((item) => scrubPII(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.has(lowerKey)) {
      result[key] = '[Redacted]';
    } else {
      result[key] = scrubPII(value, depth + 1);
    }
  }
  return result;
}

/**
 * Email pattern used to redact emails embedded in string values
 * (e.g. exception messages like "user alice@example.com not found").
 */
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * URL-encoded email pattern (%40 = encoded @). The Sentry SDK populates
 * `request.url` and `request.query_string` with raw (encoded) strings,
 * so `EMAIL_RE` alone misses addresses like `alice%40test.com`.
 */
const ENCODED_EMAIL_RE = /[a-zA-Z0-9._%+-]+%40[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

/**
 * Bearer / token pattern used to redact credentials embedded in
 * string values (e.g. "Authorization: Bearer eyJhbGci...").
 * Captures the prefix (Bearer, token=, apiKey=, secret=) separately
 * so the credential value can be replaced with [Redacted].
 */
const BEARER_RE =
  /(Bearer\s+|token=|apiKey=|secret=|password=|passwd=|pwd=|passcode=)([^&\s]+)/gi;

/**
 * Redacts emails and bearer tokens from a string value.
 * Returns the original value if no PII patterns are found.
 */
function scrubStringPII(value: string): string {
  let result = value.replace(EMAIL_RE, '[Redacted]');
  result = result.replace(ENCODED_EMAIL_RE, '[Redacted]');
  result = result.replace(BEARER_RE, '$1[Redacted]');
  return result;
}

/**
 * Recursively scrubs PII from string values within nested structures.
 * Unlike `scrubPII` (which redacts by key name), this function redacts
 * PII *patterns* (emails, bearer tokens) from string *values* regardless
 * of the key name. Used for exception messages and breadcrumbs where
 * PII may appear in free-text strings.
 */
function scrubStringPIIDeep(data: unknown, depth = 0): unknown {
  if (depth > 10) return data;
  if (typeof data === 'string') return scrubStringPII(data);
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data))
    return data.map((item) => scrubStringPIIDeep(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (PII_FIELDS.has(lowerKey)) {
      result[key] = '[Redacted]';
    } else {
      result[key] = scrubStringPIIDeep(value, depth + 1);
    }
  }
  return result;
}

/**
 * When the Sentry SDK's `patchRequestToCaptureBody` captures the raw HTTP
 * request body, it stores it as a *string* on `event.request.data`.
 * `scrubStringPII` alone only redacts email/bearer patterns and would miss
 * sensitive values identified by key name (e.g. `{"password":"abc123"}`).
 *
 * This helper tries to parse the string as JSON first; if successful it scrubs
 * the resulting object with `scrubStringPIIDeep` (key-based + pattern-based)
 * and re-stringifies it. If the string is not valid JSON, it tries form-encoded
 * parsing (key=value&key=value) for `application/x-www-form-urlencoded` bodies.
 * If neither parse succeeds, it falls back to `scrubStringPII` for pattern-based
 * redaction.
 */
function scrubBodyString(value: string): string {
  if (
    (value.startsWith('{') && value.endsWith('}')) ||
    (value.startsWith('[') && value.endsWith(']'))
  ) {
    try {
      const parsed: unknown = JSON.parse(value);
      const scrubbed = scrubStringPIIDeep(parsed);
      return JSON.stringify(scrubbed);
    } catch {
      // Not valid JSON — try form-encoded
    }
  }
  if (value.includes('=') && !value.includes(' ')) {
    try {
      const params = new URLSearchParams(value);
      const entries = Array.from(params.entries());
      if (entries.length > 0) {
        const obj: Record<string, unknown> = {};
        for (const [key, val] of entries) {
          obj[key] = val;
        }
        const scrubbed = scrubStringPIIDeep(obj) as Record<string, unknown>;
        return Object.entries(scrubbed)
          .map(([k, v]) => {
            const val = String(v);
            if (val === '[Redacted]') {
              return `${encodeURIComponent(k)}=[Redacted]`;
            }
            return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
          })
          .join('&');
      }
    } catch {
      // Not valid form-encoded — fall through
    }
  }
  return scrubStringPII(value);
}

/**
 * Scrubs `request.data` / `request.json` which the SDK may store as a raw
 * JSON string (via `patchRequestToCaptureBody`) or as a parsed object.
 * Strings that look like JSON are parsed, key-scrubbed, and re-stringified
 * so that sensitive fields like `password` are redacted by key name.
 */
function scrubBodyData(data: unknown): unknown {
  if (typeof data === 'string') return scrubBodyString(data);
  return scrubStringPIIDeep(data);
}

/**
 * Scrubs PII from a Sentry event before it is sent to the server.
 * This is the single canonical implementation used by both the backend
 * `instrument.ts` and the dashboard `sentry.*.config.ts` files.
 *
 * Accepts `unknown` and uses runtime checks to avoid coupling to
 * Sentry's internal `Event` type, which varies across packages.
 *
 * Covers:
 * - `request.headers`, `request.data`, `request.json` — key-based + string-pattern scrub
 * - `request.cookies` — cleared entirely
 * - `request.url`, `request.query_string` — string pattern scrub
 * - `extra`, `contexts` — key-based + string-pattern scrub
 * - `tags` — key-based scrub
 * - `user.email`, `user.ip_address` — redacted
 * - `breadcrumbs[].message` — string pattern scrub
 * - `breadcrumbs[].data` — key-based + string-pattern scrub
 * - `exception.values[].value` — string pattern scrub (emails/tokens in error messages)
 * - `message` (top-level) — string pattern scrub
 */
export function scrubSentryEvent<T>(event: T): T {
  if (typeof event !== 'object' || event === null) return event;
  const e = event as Record<string, unknown>;

  // request
  if (e.request && typeof e.request === 'object') {
    const req = e.request as Record<string, unknown>;
    if (req.headers && typeof req.headers === 'object') {
      req.headers = scrubStringPIIDeep(req.headers);
    }
    req.cookies = undefined;
    req.data = scrubBodyData(req.data);
    req.json = scrubBodyData(req.json);
    if (typeof req.url === 'string') {
      req.url = scrubStringPII(req.url);
    }
    req.query_string = scrubStringPIIDeep(req.query_string);
  }

  // extra
  if (e.extra && typeof e.extra === 'object') {
    e.extra = scrubStringPIIDeep(e.extra);
  }

  // tags
  if (e.tags && typeof e.tags === 'object') {
    e.tags = scrubPII(e.tags);
  }

  // contexts
  if (e.contexts && typeof e.contexts === 'object') {
    e.contexts = scrubStringPIIDeep(e.contexts);
  }

  // user
  if (e.user && typeof e.user === 'object') {
    const user = e.user as Record<string, unknown>;
    if (user.email) user.email = '[Redacted]';
    if (user.ip_address) user.ip_address = '[Redacted]';
  }

  // breadcrumbs
  if (Array.isArray(e.breadcrumbs)) {
    for (const crumb of e.breadcrumbs) {
      if (crumb && typeof crumb === 'object') {
        const c = crumb as Record<string, unknown>;
        if (typeof c.message === 'string') {
          c.message = scrubStringPII(c.message);
        }
        if (c.data && typeof c.data === 'object') {
          c.data = scrubStringPIIDeep(c.data);
        }
      }
    }
  }

  // exception
  if (e.exception && typeof e.exception === 'object') {
    const exc = e.exception as Record<string, unknown>;
    if (Array.isArray(exc.values)) {
      for (const v of exc.values) {
        if (v && typeof v === 'object') {
          const val = v as Record<string, unknown>;
          if (typeof val.value === 'string') {
            val.value = scrubStringPII(val.value);
          }
        }
      }
    }
  }

  // top-level message
  if (typeof e.message === 'string') {
    e.message = scrubStringPII(e.message);
  }

  return event;
}
