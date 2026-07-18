# 03 — Security Review

> **Date:** 2025-07-18  
> **Role:** CTO Reviewer  
> **Method:** Source code review against OWASP ASVS Level 2 + OWASP Top 10  
> **Scope:** Backend only

---

## 1. OWASP Top 10 (2021) Cross-Reference

### A01: Broken Access Control

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Role-based access control | ✅ | `RolesGuard` with `@Roles()` decorator | `roles.guard.ts` |
| Workspace scoping | ✅ | All queries filter by `workspaceId` | All services |
| Account-level scoping | ✅ | `AccountContextHelper` added to constructors | KI-008/009 (spec issues only) |
| `workspaceId` via query param | ⚠️ | All controllers use `@Query('workspaceId')` | TD-002 — leaks in logs |
| Dev login excluded in prod | ✅ | `NODE_ENV !== 'production'` guard | `auth.module.ts:34-36` |
| Self-removal prevention | ✅ | `isSelf` check in team management | `workspaces.service.ts` |

**Verdict:** ⚠️ Functional but `workspaceId` in query params is an information exposure risk (TD-002).

### A02: Cryptographic Failures

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Password hashing | ✅ | `bcryptjs` cost factor 12 | `workspaces.service.ts:818` |
| JWT secrets | ✅ | Separate access/refresh secrets, ≥32 chars asserted | `assert-production-secrets.ts` |
| Refresh token rotation | ✅ | `sid` claim, `RefreshToken` table, old token revoked | `auth.service.ts` |
| Shared secret | ⚠️ | `PLAYER_HEARTBEAT_SECRET` fallback for legacy screens | KI-017, TD-010 |
| HTTPS enforcement | ❌ | Not in app code — infrastructure responsibility | Use reverse proxy/TLS terminator |
| Cookie security flags | ✅ | `httpOnly`, `secure` in production, `sameSite: 'lax'` | `auth.service.ts` cookie config |

**Verdict:** ⚠️ Shared secret fallback is the main cryptographic risk (KI-017).

### A03: Injection

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Prisma ORM | ✅ | Parameterized queries by default | All services |
| Raw SQL | ✅ | Only `pg_advisory_xact_lock` via `$executeRaw` with template literal | `media.service.ts:77` |
| Input validation | ✅ | Global `ValidationPipe` with whitelist + transform | `main.ts:89` |
| No string concatenation in queries | ✅ | All Prisma calls use object syntax | Verified |

**Verdict:** ✅ No injection vulnerabilities detected.

### A04: Insecure Design

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Rate limiting | ✅ | Redis-backed throttler, configurable | `app.module.ts:64-78` |
| Account lockout | ✅ | `LoginLockoutService` — 5 attempts, 15-min lock | `login-lockout.service.ts` |
| File upload validation | ✅ | MIME by content (file-type), whitelist, size limit | `media.service.ts:21-29` |
| Advisory locks | ✅ | `pg_advisory_xact_lock` for quota checks | `media.service.ts:77` |
| Idempotent webhooks | ✅ | `ProcessedWebhookEvent` unique constraint | `stripe-webhook.service.ts:59-62` |

**Verdict:** ✅ Good defensive design patterns.

### A05: Security Misconfiguration

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Helmet | ✅ | Security headers enabled | `main.ts:96` |
| CORS allow-list | ✅ | `ALLOWED_ORIGINS` required in production | `main.ts:93-95` |
| CSRF protection | ✅ | Double-submit token | `main.ts:99` |
| Debug mode | ✅ | DevLogin excluded, `NODE_ENV=production` in Docker | |
| Error leakage | ✅ | Global exception filter, no stack traces in production | `main.ts` |
| Default secrets rejected | ✅ | `assertProductionSecretsAreSet` | `assert-production-secrets.ts` |
| Redis password | ❌ | Docker Compose Redis has no `requirepass` | KI-003 |

**Verdict:** ⚠️ Redis password missing in Docker Compose (KI-003).

### A06: Vulnerable and Outdated Components

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Dependency versions | ✅ | All current | `package.json` |
| npm audit | ⚠️ | Non-blocking in CI | `ci.yml:44` |
| No deprecated packages | ✅ | Verified in package.json | |

**Verdict:** ✅ Dependencies are current. CI audit should be made blocking.

### A07: Identification and Authentication Failures

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| JWT authentication | ✅ | Passport JWT strategy | `jwt.strategy.ts` |
| Session management | ✅ | `RefreshToken` model, `sid` claim, rotation | `auth.service.ts` |
| 2FA/TOTP | ✅ | `otplib`, backup codes | `two-factor.service.ts` |
| Password reset | ✅ | Email-based with token expiry | `auth.service.ts` |
| Account lockout | ✅ | 5 attempts, 15-min lock | `login-lockout.service.ts` |
| Legacy token fallback | ⚠️ | Pre-migration tokens without `sid` | CP-001 — backward compat |

**Verdict:** ✅ Strong authentication. Legacy token fallback is documented and will be retired.

### A08: Software and Data Integrity Failures

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| npm lockfile | ✅ | `package-lock.json` present | |
| Webhook signature verification | ✅ | Stripe signature verification | `stripe-webhook.service.ts` |
| Idempotent processing | ✅ | `ProcessedWebhookEvent` unique constraint | |

**Verdict:** ✅ No integrity failures detected.

### A09: Security Logging and Monitoring Failures

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| Audit logging | ✅ | Postgres-backed, 90-day retention | `AuditLogService` |
| Sentry | ✅ | Error tracking with PII scrubbing | `main.ts` |
| AppLogger | ✅ | JSON in production | `app-logger.ts` |
| Request ID | ❌ | No request ID middleware | TD-009 |
| Prometheus | ❌ | No `/metrics` endpoint | TD-014 |

**Verdict:** ⚠️ Logging exists but lacks request correlation and metrics export.

### A10: Server-Side Request Forgery (SSRF)

| Control | Status | Evidence | Notes |
|---------|--------|----------|-------|
| No user-supplied URLs fetched | ✅ | No `fetch()`/`axios` with user input | Verified |
| S3 endpoints | ✅ | Admin-configured, not user-supplied | `s3-storage.service.ts` |
| Email service | ✅ | Uses configured SMTP, not user-supplied | `email.service.ts` |

**Verdict:** ✅ No SSRF risk.

---

## 2. Authentication Deep Dive

### 2.1 JWT Configuration

| Check | Status | Evidence |
|-------|--------|----------|
| Separate access/refresh secrets | ✅ | `assert-production-secrets.ts` — rejects if equal |
| Access token expiry | ✅ | Configurable, short-lived | `auth.service.ts` |
| Refresh token rotation | ✅ | Old token revoked on use | `auth.service.ts` |
| `sid` claim for session tracking | ✅ | `RefreshToken` model with `sessionId` | `auth.service.ts` |
| Legacy fallback (no `sid`) | ⚠️ | Pre-migration tokens | CP-001 |

### 2.2 WebSocket Authentication

| Check | Status | Evidence |
|-------|--------|----------|
| Screen registration | ✅ | Per-screen secret or shared secret fallback | `realtime.gateway.ts:246-274` |
| Dashboard subscribe | ✅ | JWT verification | `realtime.gateway.ts` |
| Auth timeout | ✅ | 5s disconnect if unauthenticated | `realtime.gateway.ts` |
| Connection limit | ✅ | Max 3 per IP | `realtime.gateway.ts` |

### 2.3 DevLogin

| Check | Status | Evidence |
|-------|--------|----------|
| Excluded in production | ✅ | `NODE_ENV !== 'production'` | `auth.module.ts:34-36` |
| Override flag | ⚠️ | `ENABLE_DEV_LOGIN=true` can enable | KI-018 |
| Test coverage | ✅ | `dev-login.controller.spec.ts` | |

---

## 3. File Upload Security

| Check | Status | Evidence | Notes |
|-------|--------|----------|-------|
| MIME by content (not extension) | ✅ | `file-type` package | `media.service.ts:21-29` |
| Allowed MIME types | ✅ | Whitelist: images, videos | `media.service.ts` |
| Size limit | ✅ | 150MB | `media.controller.ts` |
| Storage quota | ✅ | `pg_advisory_xact_lock` + aggregate check | `media.service.ts:74-82` |
| Filename sanitization | ✅ | UUID generated, original name stored separately | `media.service.ts` |

**Verdict:** ✅ File upload is secure.

---

## 4. Security Score

| Category | Score | Notes |
|----------|-------|-------|
| Access Control (A01) | 80/100 | workspaceId in query params |
| Cryptography (A02) | 85/100 | Shared secret fallback |
| Injection (A03) | 100/100 | Clean |
| Insecure Design (A04) | 95/100 | Good patterns |
| Security Misconfig (A05) | 85/100 | Redis no password |
| Outdated Components (A06) | 90/100 | CI audit non-blocking |
| Auth Failures (A07) | 90/100 | Legacy token fallback |
| Integrity (A08) | 100/100 | Clean |
| Logging/Monitoring (A09) | 70/100 | No request ID, no Prometheus |
| SSRF (A10) | 100/100 | Clean |

**Security Score: 89/100**

---

## 5. Security Verdict

**No P0 or P1 security vulnerabilities.**

**4 P2 security concerns (all documented with mitigations):**
1. KI-003 — Redis no password (mitigation: don't expose port, use `REDIS_URL` with password)
2. KI-017 — Shared secret fallback (mitigation: warnings logged, production secret asserted)
3. KI-018 — DevLogin in code (mitigation: excluded in production unless flag set)
4. TD-002 — workspaceId in query params (mitigation: reverse proxy can strip from logs)

**Safe for Phase 2 start. Must fix KI-003 before production deploy.**
