# 16 — Security Audit

> **Objective:** Evaluate the security posture: authentication, authorization, input validation, output encoding, secrets management, network security, and OWASP Top 10 coverage.

---

## 1. Current State

Security is implemented across multiple layers: Helmet for HTTP headers, CORS with allow-list, CSRF middleware, JWT auth with refresh tokens, role-based access control, rate limiting, production secret validation, Sentry error reporting with PII scrubbing, and SSRF protection for webhooks.

---

## 2. What Exists

### HTTP Security
- **Helmet:** Enabled in `main.ts` — Sets security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.)
- **CORS:** `createCorsOriginChecker()` — Production: explicit allow-list from `ALLOWED_ORIGINS`. Dev: localhost + configurable origins. Rejects unlisted origins.
- **CORS failure:** Production throws error if `ALLOWED_ORIGINS` is missing/empty (fail-fast)

### CSRF Protection
- `CsrfMiddleware` — Double-submit token pattern
- Validates `csrf_token` cookie against `x-csrf-token` header for non-GET requests
- Exempts: auth routes (login, register, refresh), Stripe webhook, pairing sessions
- Bearer token requests exempted (API clients don't need CSRF)

### Authentication Security
- **JWT with typ claim:** Access tokens carry `typ: 'access'`, refresh tokens carry `typ: 'refresh'`. Prevents refresh-as-access even if secrets are identical.
- **Per-session refresh tokens:** Stored in DB with `tokenHash` (not plaintext), `sessionId`, `expiresAt`
- **Brute-force lockout:** `LoginLockoutService` — Per-email lockout after threshold failures
- **OTP brute-force protection:** Registration verify throttled at 10/min (6-digit code = 1M combinations, 10/min = 166 hours to brute-force)
- **2FA:** TOTP via `speakeasy` with QR code setup
- **Password hashing:** `bcryptjs` with default salt rounds (10)
- **Production secret validation:** `assertProductionSecretsAreSet()` — Validates JWT secrets at boot

### Authorization Security
- **RBAC:** 4 workspace roles (OWNER/ADMIN/EDITOR/VIEWER) + 3 platform staff roles
- **Super-admin bypass:** `isSuperAdmin` checked in `RolesGuard` and `AccountContextHelper`
- **DB-verified guards:** `SuperAdminDbGuard` and `PlatformStaffDbGuard` verify roles in DB, not just JWT
- **Account member resolution:** `AccountContextHelper` resolves effective role through account → workspace scopes → direct membership chain

### Input Validation
- **Global `ValidationPipe`:** `whitelist: true` (strips unknown properties), `transform: true` (auto-transforms types)
- **DTOs with class-validator:** `@IsEmail`, `@IsString`, `@IsOptional`, `@IsInt`, `@Min`, `@Max`, etc.
- **File upload limits:** 150MB max, allowed MIME types enforced
- **Pagination limits:** `pageSize` max 100

### Output Security
- **Error normalization:** `normalizeHttpError()` — Never leaks stack traces or internal error messages. Unhandled errors return generic "Internal server error".
- **PII scrubbing:** `scrub-pii.ts` — Scrubs email, phone, IP from Sentry reports
- **No Prisma model serialization** — Raw models returned (potential over-exposure of internal fields)

### Rate Limiting
- **Global throttle:** `ThrottlerModule` with default limit (100 req/min per IP)
- **User-based throttle:** `UserThrottlerGuard` — Tracks by JWT `sub` instead of IP
- **Per-endpoint overrides:** Auth (5-20/min), Stripe (10/min), Pairing (5-30/min), Account export (3/min), Account delete (2/min)
- **Stripe webhook exempt:** `@SkipThrottle()` — Stripe delivers bursts, 429 would drop billing events

### SSRF Protection
- `WebhooksService` — Validates webhook URL against private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, ::1, fc00::/7)
- Blocks localhost, private ranges, link-local, and unique local addresses

### Secrets Management
- **Environment variables:** All secrets from env vars, no hardcoded secrets in code
- **Dev fallbacks:** Only in non-production (e.g., `dev-access-secret`)
- **Production assertion:** Validates secrets are set, not placeholders, min 32 chars, min 8 distinct chars, access ≠ refresh
- **No secrets in logs:** PII scrubbing removes sensitive data from Sentry

### Sentry Integration
- `@sentry/nestjs` — Global error reporting
- `@SentryExceptionCaptured()` on `AllExceptionsFilter.catch()`
- PII scrubbing before Sentry submission
- Request context (method, URL) included in error reports

---

## 3. What Is Missing

### OWASP Top 10 (2021) Coverage
1. **A01: Broken Access Control** — Mostly covered (RBAC, guards). Gap: API keys not enforced, no resource-level checks.
2. **A02: Cryptographic Failures** — Mostly covered (bcrypt, JWT, HTTPS via Helmet). Gap: 2FA secrets in plaintext, no encryption at rest for sensitive fields.
3. **A03: Injection** — Covered (Prisma parameterized queries, ValidationPipe). No SQL injection risk.
4. **A04: Insecure Design** — Partial. No threat modeling, no security design review process.
5. **A05: Security Misconfiguration** — Mostly covered (Helmet, CORS, CSRF). Gap: Dev endpoints in codebase, no security headers audit.
6. **A06: Vulnerable Components** — No dependency vulnerability scanning. No `npm audit` in CI.
7. **A07: Identification & Auth Failures** — Mostly covered (lockout, OTP, 2FA). Gap: No password complexity, no breach check.
7. **A08: Software & Data Integrity Failures** — Partial. No SRI, no dependency provenance verification.
8. **A09: Security Logging & Monitoring** — Partial. Sentry + audit logs exist. Gap: No security event logging (failed auth, rate limit hits, guard denials).
9. **A10: Server-Side Request Forgery** — Covered for webhooks. No other outbound HTTP requests to validate.

### Missing Security Measures
1. **No dependency vulnerability scanning** — No `npm audit` or Snyk in CI pipeline
2. **No CSP audit** — Helmet sets CSP but no verification that it doesn't break legitimate functionality
3. **No security headers check** — No automated check for missing headers (X-Content-Type-Options, Referrer-Policy, etc.)
4. **No API key authentication** — API keys created but never validated
5. **No request body size limit** — No global body parser limit. Default Express limit is 100kb but NestJS may override
6. **No file content validation** — MIME type from extension, not content
7. **No security event logging** — Failed auth attempts, rate limit hits, and guard denials are not logged as security events
8. **No account takeover protection** — No notification when account is accessed from new device/IP
9. **No security test suite** — No automated security tests (OWASP ZAP, Burp Suite integration)
10. **No penetration test documentation** — No record of security testing or penetration testing

---

## 4. Problems

1. **2FA secrets in plaintext** — TOTP secrets stored unencrypted in DB. DB compromise exposes all 2FA secrets.

2. **DevLoginController in codebase** — Even with environment guards, it's a risk. If `ENABLE_DEV_LOGIN=true` is accidentally set, it bypasses all auth.

3. **No password complexity** — Any password length/complexity accepted. Weak passwords can be used.

4. **MIME type spoofing** — File uploads trust the extension for MIME type. `file.jpg` could be an executable.

5. **Static media files are public** — No authentication on `/media-files/` routes. Anyone with the URL can access media.

6. **No body parser size limit** — Large request bodies could cause memory exhaustion. NestJS default may not be sufficient.

7. **workspaceId in query params** — Appears in access logs, browser history. Should be in header.

8. **No JWT rotation on role change** — When a user's role is changed, their existing JWT remains valid until expiry.

---

## 5. Risks

- **High: 2FA secrets in plaintext** — DB compromise defeats 2FA for all users.
- **High: No password complexity** — Weak passwords susceptible to brute-force.
- **Medium: MIME type spoofing** — Malicious file upload.
- **Medium: Public media access** — Content scraping.
- **Medium: No dependency scanning** — Known vulnerabilities in dependencies.
- **Low: DevLoginController** — Environment-guarded but still present.
- **Low: No security event logging** — Attacks may go undetected.

---

## 6. Priority: **Critical**

Security is strong for a project this size but has several exploitable gaps.

---

## 7. Completion Percentage: **84%**

Helmet, CORS, CSRF, JWT with typ claims, per-session refresh, brute-force lockout, RBAC, SSRF protection, production secret validation, PII scrubbing, and Sentry are all implemented. Missing: password complexity, 2FA encryption, file content validation, dependency scanning, security event logging.

---

## 8. Recommendations

1. Add password complexity validation (min 8 chars, 1 uppercase, 1 number, 1 symbol)
2. Encrypt 2FA secrets at rest using AES-256-GCM
3. Use `file-type` library to validate file content matches declared MIME type
4. Add `npm audit` or Snyk to CI pipeline
5. Add signed URL generation for media access (1-hour expiry, JWT-required)
6. Add request body size limit: `app.use(json({ limit: '10mb' }))` (or configurable)
7. Add security event logging: log failed auth, rate limit hits, guard denials to `AuditLog`
8. Remove `DevLoginController` entirely — use a separate dev script
9. Add JWT rotation on role change: delete all refresh tokens for the user
10. Add new device/IP notification: email user when login from new IP
11. Add OWASP ZAP scan to CI pipeline
12. Add `Content-Security-Policy` audit to verify it doesn't break functionality

---

## 9. Future Tasks

- [ ] Add password complexity validation
- [ ] Encrypt 2FA secrets at rest
- [ ] Validate file content type with `file-type`
- [ ] Add dependency vulnerability scanning to CI
- [ ] Add signed URL for media access
- [ ] Add request body size limit
- [ ] Add security event logging
- [ ] Remove DevLoginController
- [ ] Add JWT rotation on role change
- [ ] Add new device/IP login notification
- [ ] Add OWASP ZAP scan to CI
- [ ] Conduct penetration test
