# Audit 04: API Design & Security

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** REST API design, security posture, authentication, authorization, rate limiting, CORS, headers

---

## 1. API Design

### 1.1 Route Convention

All API routes are prefixed with `/api/v1/` (set in `main.ts`):
```typescript
app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready'] });
```

### 1.2 Route Inventory

| Domain | Base Route | Methods | Guards |
|--------|-----------|---------|--------|
| auth | `/auth` | POST (register, login, refresh, logout, 2FA, dev-login), GET (me) | JwtAuthGuard on authenticated routes |
| workspaces | `/workspaces` | POST, GET, PATCH, DELETE | JwtAuthGuard + RolesGuard |
| screens | `/screens` | POST, GET, PATCH, DELETE | JwtAuthGuard + RolesGuard |
| canvases | `/canvases` | POST, GET, PATCH, DELETE | JwtAuthGuard + RolesGuard |
| media | `/media` | POST, GET, DELETE | JwtAuthGuard + RolesGuard |
| playlists | `/playlists` | POST, GET, PATCH, DELETE | JwtAuthGuard + RolesGuard |
| schedules | `/schedules` | POST, GET, PATCH, DELETE | JwtAuthGuard + RolesGuard |
| subscriptions | `/subscriptions` | GET, PATCH | JwtAuthGuard + RolesGuard |
| stripe | `/stripe` | POST (checkout, portal) | JwtAuthGuard + RolesGuard |
| player | `/player` | GET (bootstrap, canvas), POST (pairing) | Mixed (secret-based + JWT) |
| webhooks | `/webhooks` | POST, GET, DELETE, PATCH | JwtAuthGuard + RolesGuard |
| webhooks (stripe) | `/webhooks/stripe` | POST | Raw body + signature verification |
| api-keys | `/api-keys` | POST, GET, DELETE | JwtAuthGuard + RolesGuard |
| onboarding | `/onboarding` | GET, POST, PATCH | JwtAuthGuard + RolesGuard |
| admin | `/admin/*` | Various | JwtAuthGuard + SuperAdminDbGuard |
| islamic | `/islamic` | GET, PATCH | JwtAuthGuard + RolesGuard |
| notifications | `/notifications` | GET, PATCH | JwtAuthGuard |
| account | `/account` | GET, PATCH | JwtAuthGuard |
| audit-log | `/audit-log` | GET | JwtAuthGuard + RolesGuard |
| health | `/health`, `/ready` | GET | None (public) |

### 1.3 API Design Issues

1. **`workspaceId` as query parameter**: Most workspace-scoped endpoints accept `workspaceId` as a query parameter (`?workspaceId=xxx`). This is inconsistent — some use path params (`/:workspaceId`), others use query params. A consistent pattern (e.g., always path param for workspace context) would be cleaner.

2. **No API versioning strategy beyond v1**: The prefix is hardcoded. No plan for v2 migration.

3. **No OpenAPI/Swagger**: No API documentation generation. The dashboard has an `api-docs` page but it's likely manually maintained.

4. **Inconsistent response shapes**: Some endpoints return raw Prisma models, others return transformed DTOs. No consistent response wrapper (e.g., `{ data: ..., meta: ... }`).

5. **Pagination**: Uses `buildPage` helper with `skip`/`take` — offset-based pagination. No cursor-based pagination for large datasets.

---

## 2. Authentication

### 2.1 JWT Strategy

- **Access token**: 15-minute expiry (configurable via `JWT_ACCESS_EXPIRES_IN`)
- **Refresh token**: 7-day expiry (configurable via `JWT_REFRESH_EXPIRES_IN`)
- **Token claims**: `sub` (userId), `email`, `typ` (access/refresh), `sid` (session ID on refresh), `impersonatedBy` (if impersonating)
- **Separate secrets**: `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must differ (enforced at boot)

### 2.2 Cookie-Based Auth

- Access and refresh tokens set as HTTP-only cookies via `setAuthCookies`
- CSRF protection via `CsrfModule` (double-submit cookie pattern)
- `credentials: true` in CORS for cookie transmission

### 2.3 Multi-Session Support

- `RefreshToken` model stores per-session hashes
- Logout deletes all sessions for the user
- Refresh token rotation: old session deleted, new one created on each refresh

### 2.4 Authentication Issues

1. **Refresh token rotation gap**: The `refreshTokens` method deletes the old session and creates a new one, but if the response fails to reach the client (network error), the old token is already invalidated. The client would need to re-authenticate. This is a trade-off between security and UX.

2. **No token revocation list**: Beyond session deletion, there's no way to revoke a specific access token before expiry. Short expiry (15 min) mitigates this.

3. **`devLogin` endpoint**: Returns a valid JWT for the first active user. Guarded by `NODE_ENV !== 'production'` check, but the route is still registered. Should be conditionally excluded from the module.

---

## 3. Authorization

### 3.1 Role Hierarchy

```
SUPER_ADMIN > OWNER > ADMIN > EDITOR > VIEWER
```

- **SuperAdmin**: Bypasses all role checks, sees all workspaces
- **Owner**: Full workspace control, can delete workspace
- **Admin**: Manage workspace, invite members, manage screens/playlists
- **Editor**: Create/edit content, cannot manage team or billing
- **Viewer**: Read-only access

### 3.2 Authorization Implementation

- **`RolesGuard`**: Checks `WorkspaceMember.role` against `@Roles()` decorator
- **`SuperAdminDbGuard`**: Checks `User.isSuperAdmin` in database (not just JWT claim)
- **`assertWorkspaceAccess`**: Service-level access checks
- **Workspace isolation**: All queries filtered by `workspaceId`

### 3.3 Authorization Issues

1. **`RolesGuard` queries DB on every request**: No caching of membership. For high-traffic APIs, this adds a DB round-trip per request. Could cache in Redis.

2. **`workspaceId` resolution**: The guard checks `params.workspaceId ?? query.workspaceId ?? body.workspaceId ?? headers['x-workspace-id']`. This multi-source approach is flexible but could be exploited if an attacker controls multiple sources.

3. **No resource-level ownership check in guard**: The guard checks workspace membership but not resource ownership. Services must do their own checks (e.g., `findFirst({ where: { id, workspaceId } })`). This is correct but relies on developer discipline.

---

## 4. Rate Limiting

### 4.1 Throttle Configuration

| Layer | Scope | Limit | TTL |
|-------|-------|-------|-----|
| Global (APP_GUARD) | Per-IP | 300 req/min | 60s |
| Auth: register/start | Per-IP | 5 req/min | 60s |
| Auth: register/verify | Per-IP | 10 req/min | 60s |
| Auth: forgot-password | Per-IP | 5 req/min | 60s |
| Auth: reset-password | Per-IP | 10 req/min | 60s |
| Auth: login | Per-IP | 20 req/min | 60s |
| Auth: login-2fa | Per-IP | 20 req/min | 60s |
| Auth: 2fa/enable | Per-IP | 5 req/min | 60s |
| Auth: 2fa/disable | Per-IP | 5 req/min | 60s |
| Workspaces: claim | Per-User | 5 req/min | 60s |
| Player: pairing/sessions | Per-IP | 30 req/min | 60s |
| Subscriptions: mock-plan | Per-IP | 20 req/min | 60s |
| Stripe: checkout | Per-IP | 10 req/min | 60s |
| Stripe: portal | Per-IP | 10 req/min | 60s |
| Webhooks: create/delete/toggle | Per-IP | 10 req/min | 60s |
| Webhooks: test | Per-IP | 5 req/min | 60s |
| Onboarding: complete-step | Per-IP | 20 req/min | 60s |
| Onboarding: dismiss/reset | Per-IP | 5 req/min | 60s |
| Islamic: prayer-times | Per-IP | 20 req/min | 60s |

### 4.2 Brute-Force Protection

- **`LoginLockout`**: Per-email, 10-min window, locks for 30 min after threshold
- **`PairingClaimLockout`**: Per-user+IP, 10-min window, locks for 30 min after threshold

### 4.3 Rate Limiting Issues

1. **In-memory throttle storage**: `ThrottlerModule` uses in-memory storage. Multiple backend instances would each have independent counters. Need Redis-backed storage for horizontal scaling.

2. **Player routes `@SkipThrottle()`**: The entire `PlayerController` skips rate limiting (because screens share IPs). Only `startPairingSession` opts back in. If the per-screen secret is compromised, there's no rate limit on bootstrap/canvas endpoints.

3. **No rate limit on media uploads**: Upload endpoint inherits the global 300/min limit. Large file uploads could consume server resources.

---

## 5. CORS & Headers

### 5.1 CORS

- **Production**: Explicit allow-list from `ALLOWED_ORIGINS` env var ✅
- **Development**: Configurable via `TRUST_DYNAMIC_CORS` (defaults to false) ✅
- **Credentials**: `credentials: true` for cookie-based auth ✅
- **Methods**: Full REST set (GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS) ✅
- **Allowed headers**: Content-Type, Authorization, X-CSRF-Token, Accept, Accept-Language, X-Pairing-Poll-Secret, X-Player-Secret ✅

### 5.2 Security Headers (Helmet)

- `contentSecurityPolicy: false` — correct for API (CSP belongs on dashboard)
- `crossOriginEmbedderPolicy: false` — correct for cross-origin media serving
- `crossOriginResourcePolicy: false` — overridden per-route for media files

### 5.3 Media File Serving

- `.part` files blocked (incomplete uploads not served) ✅
- `Access-Control-Allow-Origin: *` on media files (for cross-origin player access) ✅
- `Cross-Origin-Resource-Policy: cross-origin` ✅

---

## 6. Input Validation

### 6.1 Global Validation Pipe

```typescript
new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
```

- **`transform: true`**: Auto-transforms payloads to DTO instances ✅
- **`whitelist: true`**: Strips non-decorated properties ✅
- **`forbidNonWhitelisted: true`**: Rejects requests with extra properties ✅

### 6.2 DTO Validation Coverage

| Domain | DTOs | Validation Quality |
|--------|------|-------------------|
| auth | 8 | ✅ Strong (IsEmail, MinLength, IsIn for locale) |
| workspaces | 4 | ✅ Good (IsString, MinLength, MaxLength, IsIn for locale) |
| screens | 2 | ✅ Good (IsEnum, IsInt, Min, Max for resolution) |
| webhooks | 2 | ✅ Good (IsString, IsNotEmpty, MaxLength) |
| islamic | 2 | ✅ Good (IsIn for prayers, IsInt, Min, Max for buffers) — fixed in audit |
| schedules | 2 | ✅ Good (IsInt, Min, Max for days/times) |
| subscriptions | 1 | ✅ Good (IsEnum for plan) |
| stripe | 2 | ✅ Good (IsEnum for plan, IsString for workspace/locale) |

### 6.3 Validation Gaps

1. **No `@IsUUID` or `@IsCuid`** on ID fields: `workspaceId`, `screenId`, etc. are validated as `@IsString()` + `@IsNotEmpty()` but not format-checked. Invalid IDs (e.g., SQL injection attempts) would be rejected by Prisma but pass the validation pipe.

2. **No `@IsTimeZone`** on `timezone` field in `UpdateWorkspaceDto`: Accepts any non-empty string. Invalid timezones would cause `date-fns-tz` to throw at runtime.

3. **No URL validation on webhook URL in service**: `CreateWebhookDto` only checks `@IsNotEmpty()` + `@MaxLength(2048)`. URL format validation is done in `WebhooksService.create()` with `new URL()` — this is correct but could be in the DTO for earlier rejection.

---

## 7. CSRF Protection

- **`CsrfModule`** registered globally ✅
- **Double-submit cookie pattern**: CSRF token in cookie + header
- **Exempt routes**: Webhook receiver (Stripe), player endpoints (secret-based auth)

---

## 8. Identified Issues

### Critical
- **None** — security posture is strong.

### High
1. **In-memory throttle storage**: Won't scale horizontally without Redis.
2. **SSRF in webhook test**: No internal IP filtering.
3. **No rate limit on media uploads**: Could be abused for DoS.

### Medium
1. **No ID format validation in DTOs**: `@IsString()` only, no `@IsUUID`/`@IsCuid`.
2. **No timezone validation in DTO**: Invalid timezones cause runtime errors.
3. **`devLogin` route registered in production**: Should be conditionally excluded.
4. **No OpenAPI/Swagger**: API is undocumented for external consumers.
5. **Inconsistent `workspaceId` passing**: Mix of path params and query params.
6. **DB query per request in RolesGuard**: No caching for membership checks.

### Low
1. **No API versioning strategy beyond v1**.
2. **Offset-based pagination only**: No cursor pagination for large datasets.
3. **Inconsistent response shapes**: Mix of raw Prisma models and transformed DTOs.

---

## 9. Strengths

- Production-grade CORS configuration (explicit allow-list, no reflection)
- Helmet security headers
- CSRF protection (double-submit cookie)
- Comprehensive rate limiting with per-route customization
- Brute-force protection (login + pairing lockout)
- JWT with separate access/refresh secrets and `typ` claim
- Per-session refresh tokens with rotation
- Global validation pipe with `forbidNonWhitelisted`
- Magic byte file validation (not trusting client MIME type)
- Stripe webhook signature verification
- Idempotent webhook processing
- Trust proxy configuration for accurate IP resolution
- Production secrets assertion at boot

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Confirmed-correct (this file is the more accurate of the two on auth):**
- §2.3 refresh-token rotation description is **correct** (verified at
  `auth.service.ts:717`) — it supersedes audit 03's false "no rotation" claim.
- §4.3 in-memory throttler won't scale — **confirmed**, and even acknowledged in-code
  (`app.module.ts:49` references needing `@nest-lab/throttler-storage-redis`).
- §8-High SSRF in webhook test — **confirmed** (`webhooks.service.ts:118`).
- §2.3 `devLogin` route is mounted in all builds — **confirmed**
  (`auth.controller.ts:127 @Post('dev-login')`); runtime-guarded by env but still routed.

**Additions the original missed:**
- **The WebSocket surface has its own auth + CORS model** (`FRONTEND_ORIGINS`, JWT +
  screen-secret) that this REST-focused file does not cover — and it **cannot scale
  horizontally** (no Socket.io Redis adapter). Full analysis in the new **file 12**.
- **`ws` (WebSocket lib) has a High CVE** (uninitialized memory disclosure) — file 14 §1.1.
- Two separate origin allow-lists (`ALLOWED_ORIGINS` REST vs `FRONTEND_ORIGINS` WS) can
  drift — file 12 §2.4 / file 13 §2.
