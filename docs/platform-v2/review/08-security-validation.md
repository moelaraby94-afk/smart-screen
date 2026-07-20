# 08 — Security Validation

> **Phase 8:** Full security audit — authentication, authorization, impersonation, sessions, JWT audiences, cookie strategy, CSRF, CORS, rate limiting, secrets, privilege escalation, tenant isolation, replay attacks, audit logging, compliance

---

## 1. Authentication Security

### 1.1 Password Security

| Aspect | Current | Assessment |
|---|---|---|
| Hashing | `bcrypt.hash(password, 12)` | ✅ 12 rounds is strong |
| Password reset | OTP via email | ✅ Good |
| Password reset expiry | Time-limited OTP | ✅ Good |
| Password validation | DTO validation | ⚠️ No complexity rules in DTO — only min length |
| Account enumeration | Login returns same error for invalid email/password | ✅ Good |
| Lockout | `LoginLockout` model, per-email | ✅ Excellent — keyed on email to prevent enumeration |

### 1.2 JWT Security

| Aspect | Current | Assessment |
|---|---|---|
| Algorithm | HS256 (symmetric) | ⚠️ **Should be RS256/ES256** (asymmetric) for multi-service verification |
| Access token TTL | 15 minutes | ✅ Standard |
| Refresh token TTL | 7 days | ✅ Standard |
| Token type claim | `typ: 'access' \| 'refresh'` | ✅ Prevents refresh-as-access replay |
| Separate signing keys | `JWT_ACCESS_SECRET` ≠ `JWT_REFRESH_SECRET` | ✅ Enforced at boot |
| Audience claim | **Missing** | ❌ **CRITICAL** — see F-01 |
| Issuer claim | **Missing** | ⚠️ Should add `iss` for multi-service environments |
| Subject claim | `sub` = user ID | ✅ Correct |
| Session ID | `sid` on refresh tokens | ✅ Good — enables per-session revocation |
| DB validation | `JwtStrategy.validate()` checks `isActive` | ✅ Good — suspended users can't use existing tokens |

### 1.3 Session Management

| Aspect | Current | Assessment |
|---|---|---|
| Storage | PostgreSQL `RefreshToken` table | ⚠️ Should move to Redis for performance |
| Session revocation | `revokeAllSessions()` deletes all tokens | ⚠️ No per-session revocation (all devices) |
| Session listing | Not available | ❌ Users can't see active sessions |
| Device binding | Not implemented | ⚠️ Stolen tokens valid until expiry |
| Concurrent session limit | Not enforced | ⚠️ Enterprise customers may want this |
| Logout | Deletes ALL refresh tokens | ⚠️ Should only delete current session |

---

## 2. Authorization Security

### 2.1 Guard Chain

| Guard | Purpose | Fail-Closed? | Assessment |
|---|---|---|---|
| `JwtAuthGuard` | Authentication | ✅ | ✅ |
| `RolesGuard` | Workspace role check | ✅ | ✅ But 3+ DB queries per request |
| `PlatformStaffDbGuard` | Platform staff check | ✅ | ✅ DB-validated |
| `SuperAdminDbGuard` | Super admin check | ✅ | ✅ DB-validated |
| `SuperAdminGuard` | Super admin check (JWT only) | ✅ | ❌ **JWT-only — should be deleted** |
| `ApiKeyAuthGuard` | API key auth | ✅ | ✅ SHA-256 hash lookup |

### 2.2 Missing Guards

| Guard | Purpose | Priority |
|---|---|---|
| `AudienceGuard` | JWT audience validation | **P0** |
| `QuotaGuard` | Plan limit enforcement | **P1** |
| `FeatureGuard` | Feature flag check | **P1** |

### 2.3 Privilege Escalation Vectors

| Vector | Severity | Detail | Resolution |
|---|---|---|---|
| `SuperAdminGuard` (JWT-only) | **CRITICAL** | `super-admin.guard.ts:14` checks `user?.isSuperAdmin` from JWT only. If JWT secret leaks, attacker forges `isSuperAdmin: true`. | Delete `SuperAdminGuard`. Use `SuperAdminDbGuard` everywhere. |
| `RolesGuard` super admin bypass | **HIGH** | `roles.guard.ts:42`: `if (user.isSuperAdmin) return true`. Super admin bypasses all role checks without audit. | Add audit log entry when super admin accesses workspace data. |
| `PATCH /admin/users/:id` | **HIGH** | Can set `isSuperAdmin: true` on any user. Only guarded by `SuperAdminDbGuard`. | Add 2FA requirement for privilege escalation. Add audit log. |
| `User.isSuperAdmin` on customer table | **HIGH** | Same table holds `isSuperAdmin` and customer data. A bug in user update could escalate a customer. | Split `User` into `PlatformUser` + `CustomerUser`. |
| No audience check | **CRITICAL** | Customer JWT can hit admin routes. Only `PlatformStaffDbGuard` prevents this, but it's not on all admin routes. | Add `AudienceGuard` to all platform routes. |

---

## 3. Impersonation Security

### 3.1 Current Flow

```
1. Super admin calls POST /admin/users/:id/impersonate
2. AdminService.impersonateUser() calls AuthService.issueImpersonation()
3. AuthService mints access + refresh tokens for target user
4. Tokens include `impersonatedBy: actorUserId` claim
5. setAuthCookies() sets tokens in response cookies
6. Frontend stores tokens and navigates as target user
```

### 3.2 Security Issues

| Issue | Severity | Detail |
|---|---|---|
| Direct token mint | **CRITICAL** | Super admin's request context receives target user's tokens. No exchange boundary. |
| Same cookie slot | **HIGH** | `cs_access_token` cookie is overwritten with target user's token. Super admin's session is lost. Exit impersonation mints new super admin tokens. |
| No time limit on impersonation | **MEDIUM** | Impersonation lasts until refresh token expires (7 days). Should be 1 hour max. |
| No audit on impersonation start | **MEDIUM** | `IMPERSONATION_END` is logged but `IMPERSONATION_START` is not explicitly logged in the current code path. |
| No confirmation step | **MEDIUM** | Super admin can impersonate without target user's knowledge. Should notify target user. |
| `impersonatedBy` in JWT | **LOW** | Claim is visible to the target user if they inspect their token. Not a security issue but an information leak. |

### 3.3 Blueprint Target Flow

```
1. Super admin calls POST /platform/impersonate
2. Backend generates one-time exchange token (short TTL, e.g., 60s)
3. Frontend redirects to customer app with exchange token
4. Customer app calls POST /auth/exchange with token
5. Backend validates token, mints customer-scoped session
6. Customer app stores session in customer-scoped cookie
7. Impersonation bar shows "Viewing as [user]" with "Exit" button
8. Exit button calls POST /auth/exchange/exit
9. Backend revokes customer session, redirects to platform
```

---

## 4. Cookie Strategy

### 4.1 Current State

| Cookie | Purpose | Attributes | Assessment |
|---|---|---|---|
| `cs_access_token` | JWT access token | `httpOnly`, `secure` (prod), `sameSite: 'lax'` | ⚠️ Single cookie for both admin and customer |
| `cs_refresh_token` | JWT refresh token | `httpOnly`, `secure` (prod), `sameSite: 'lax'` | ⚠️ Same issue |
| `csrf_token` | CSRF protection | `httpOnly: false` (readable by JS) | ✅ Correct — JS needs to read it |

### 4.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Single cookie for both identities | **CRITICAL** | Admin and customer sessions share `cs_access_token`. Can't have both sessions simultaneously. |
| No domain separation | **HIGH** | Cookies are set on the current domain. Blueprint requires separate domains (`admin.cloudsignage.com` vs `app.cloudsignage.com`). |
| `sameSite: 'lax'` | **OK** | Correct for same-site API calls. Would need `sameSite: 'none'` + `secure` for cross-site. |
| No `__Host-` prefix | **MEDIUM** | Using `__Host-cs_access_token` would prevent subdomain cookie injection. |

### 4.3 Target Cookie Strategy

| Cookie | Domain | Purpose | Attributes |
|---|---|---|---|
| `__Host-cs_platform_access` | `admin.cloudsignage.com` | Platform access token | `httpOnly`, `secure`, `sameSite: 'lax'`, `path: /` |
| `__Host-cs_platform_refresh` | `admin.cloudsignage.com` | Platform refresh token | `httpOnly`, `secure`, `sameSite: 'lax'`, `path: /` |
| `__Host-cs_customer_access` | `app.cloudsignage.com` | Customer access token | `httpOnly`, `secure`, `sameSite: 'lax'`, `path: /` |
| `__Host-cs_customer_refresh` | `app.cloudsignage.com` | Customer refresh token | `httpOnly`, `secure`, `sameSite: 'lax'`, `path: /` |
| `csrf_token` | Per-app | CSRF token | `httpOnly: false`, `secure`, `sameSite: 'lax'` |

---

## 5. CSRF Protection

### 5.1 Current State

`CsrfMiddleware` at `@/apps/backend/src/common/csrf/csrf.middleware.ts`:
- Exempts GET, HEAD, OPTIONS
- Exempts specific paths (login, register, forgot-password, reset-password, refresh, Stripe webhook, player pairing)
- Exempts Bearer token requests (API key / mobile)
- Validates `csrf_token` cookie against `X-CSRF-Token` header

### 5.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Hardcoded exempt paths | **MEDIUM** | Exempt paths are in code, not config. Adding new public endpoints requires code change. |
| No token rotation | **LOW** | CSRF token is static per session. Should rotate on login. |
| Double-submit pattern | **OK** | Current approach (cookie + header) is the double-submit cookie pattern. Valid. |
| No SameSite=Strict fallback | **OK** | `sameSite: 'lax'` on auth cookies provides CSRF protection for top-level navigations. CSRF middleware is defense in depth. |

### 5.3 Assessment

✅ CSRF protection is well-implemented. The double-submit cookie pattern with Bearer exemption is correct. Only minor improvements needed.

---

## 6. CORS Security

### 6.1 Current State

`cors-config.ts` at `@/apps/backend/src/common/config/cors-config.ts`:
- **Production:** Explicit allow-list from `ALLOWED_ORIGINS`. No origin reflection. Fail-fast if missing.
- **Development:** Merges `FRONTEND_ORIGINS` + `FRONTEND_ORIGIN` + localhost defaults.
- **WebSocket:** Uses same CORS checker.
- Credentials: `true` (required for cookies).

### 6.2 Assessment

✅ **Excellent.** This is textbook CORS configuration:
- No origin reflection
- Fail-fast in production
- Shared between REST and WebSocket
- Credentials enabled for cookie-based auth

### 6.3 Issues

| Issue | Severity | Detail |
|---|---|---|
| Single allow-list for both apps | **MEDIUM** | Both `admin.cloudsignage.com` and `app.cloudsignage.com` share the same allow-list. Should be per-audience. |
| No per-route CORS | **LOW** | All routes share the same CORS policy. Platform routes could have stricter policy. |

---

## 7. Rate Limiting

### 7.1 Current State

| Layer | Mechanism | Assessment |
|---|---|---|
| REST API | `UserThrottlerGuard` (per-user) + `ThrottlerModule` (per-IP) | ✅ Good |
| WebSocket | `WsThrottlerGuard` (per-IP connection count) | ✅ Good |
| Login | `LoginLockout` (per-email brute-force) | ✅ Excellent |
| Redis-backed | `REDIS_URL` enables Redis throttler storage | ✅ Good for multi-instance |

### 7.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No per-audience rate limits | **MEDIUM** | Platform and customer share the same rate limits. Platform staff should have higher limits. |
| No per-endpoint limits | **MEDIUM** | All endpoints share the same throttle config. Sensitive endpoints (login, register) should have stricter limits. |
| No 429 response body | **LOW** | Throttler returns 429 but no `Retry-After` header. |

---

## 8. Secrets Management

### 8.1 Current State

| Secret | Management | Assessment |
|---|---|---|
| `JWT_ACCESS_SECRET` | Environment variable, `:?` in docker-compose | ✅ Fail-fast if missing |
| `JWT_REFRESH_SECRET` | Environment variable, `:?` in docker-compose | ✅ Must differ from access secret |
| `PLAYER_HEARTBEAT_SECRET` | Environment variable, `:?` in docker-compose | ✅ |
| `ENCRYPTION_KEY` | Environment variable, `:?` in docker-compose | ✅ |
| `DATABASE_URL` | Environment variable | ✅ |
| `REDIS_URL` | Environment variable | ✅ |
| Stripe secret key | Environment variable | ✅ |
| S3 credentials | Environment variable | ✅ |

### 8.2 Production Assertions

`assertProductionSecretsAreSet()` at `@/apps/backend/src/common/config/assert-production-secrets.ts`:
- Validates all secrets are set in production
- Validates minimum length (>=32 chars)
- Validates JWT access ≠ refresh
- Validates no known placeholder values

✅ **Excellent.** This is best-practice secret validation.

### 8.3 Issues

| Issue | Severity | Detail |
|---|---|---|
| No secret rotation plan | **MEDIUM** | No documentation on how to rotate JWT secrets. Rotation invalidates all sessions. |
| No vault integration | **LOW** | Secrets are in environment variables. For enterprise, should use HashiCorp Vault or AWS Secrets Manager. |
| Encryption key not rotated | **LOW** | `ENCRYPTION_KEY` is static. Should support key rotation for encrypted data. |

---

## 9. Tenant Isolation

### 9.1 Current State

| Layer | Mechanism | Assessment |
|---|---|---|
| Application | Manual `workspaceId` in every query | ⚠️ Error-prone |
| Database | No row-level security | ❌ No DB-level isolation |
| API | `workspaceId` from params/headers, validated by `RolesGuard` | ✅ Good |
| WebSocket | `workspaceId` in subscription payload | ⚠️ No ownership check on `dashboard:subscribe` |

### 9.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No Prisma middleware for tenant isolation | **HIGH** | Every service must manually include `workspaceId` in queries. One missing filter leaks data. |
| WebSocket room subscription | **HIGH** | `dashboard:subscribe` handler accepts `workspaceId` without verifying the user is a member. Any authenticated user can subscribe to any workspace's events. |
| Raw queries bypass isolation | **MEDIUM** | `$queryRaw` and `$executeRaw` bypass any application-level isolation. Must audit. |
| Super admin bypass | **MEDIUM** | `RolesGuard` bypasses workspace check for super admin. Super admin can access any workspace's data without audit trail. |

### 9.3 WebSocket Tenant Isolation Fix

**Current:** `RealtimeGateway` handles `dashboard:subscribe` with `{ workspaceId }` payload. No verification that the connecting user is a member of that workspace.

**Required:** Before joining room `workspace:{workspaceId}`, verify:
1. JWT audience is `customer` or `platform`
2. If `customer`: user has membership in `workspaceId`
3. If `platform`: user has `SUPER_ADMIN` or `SUPPORT_SPECIALIST` role

---

## 10. Replay Attack Prevention

| Vector | Current Protection | Assessment |
|---|---|---|
| JWT replay | `exp` claim + `isActive` DB check | ✅ Good |
| Refresh token replay | `sid` claim + DB hash lookup | ✅ Good |
| API key replay | No nonce or timestamp | ⚠️ API keys are long-lived. Stolen key is valid until revoked. |
| Webhook replay | Stripe signature timestamp check | ✅ Good |
| CSRF token replay | Double-submit pattern | ✅ Good |
| OTP replay | `expiresAt` on OTP | ✅ Good |

### Issues

| Issue | Severity | Detail |
|---|---|---|
| No JWT token binding | **MEDIUM** | JWT not bound to IP or device. Stolen token is valid until expiry. |
| API key replay | **MEDIUM** | No request signing or timestamp validation. |

---

## 11. Audit Logging

### 11.1 Current Coverage

| Event | Audited? | Detail |
|---|---|---|
| Impersonation end | ✅ | `IMPERSONATION_END` in `AuditLog` |
| Impersonation start | ⚠️ | Not explicitly logged in current code |
| Staff login | ❌ | Not logged |
| Staff role change | ❌ | Not logged |
| User suspension/activation | ❌ | Not logged |
| Workspace creation/deletion | ❌ | Not logged |
| Subscription changes | ❌ | Not logged |
| Feature flag changes | ❌ | Not logged |
| Platform settings changes | ❌ | Not logged |
| API key creation/revocation | ❌ | Not logged |
| Webhook creation/deletion | ❌ | Not logged |
| Campaign state changes | ✅ | `CampaignHistory` |
| Failed login attempts | ✅ | `LoginLockout` |
| Screen commands | ❌ | Not logged |

### 11.2 Assessment

❌ **Insufficient audit coverage.** Only 3 of 14 critical events are audited. For SOC2 compliance, all privileged actions must be logged.

### 11.3 Required Audit Events

| Event | Priority | SOC2 Relevant? |
|---|---|---|
| `IMPERSONATION_START` | P0 | ✅ |
| `STAFF_LOGIN` | P0 | ✅ |
| `STAFF_ROLE_CHANGE` | P0 | ✅ |
| `USER_SUSPEND` / `USER_ACTIVATE` | P0 | ✅ |
| `WORKSPACE_CREATE` / `WORKSPACE_DELETE` | P1 | ✅ |
| `SUBSCRIPTION_CHANGE` | P1 | ✅ |
| `FEATURE_FLAG_CHANGE` | P1 | ✅ |
| `PLATFORM_SETTINGS_CHANGE` | P1 | ✅ |
| `API_KEY_CREATE` / `API_KEY_REVOKE` | P1 | ✅ |
| `WEBHOOK_CREATE` / `WEBHOOK_DELETE` | P2 | ✅ |
| `SCREEN_COMMAND` | P2 | ✅ |
| `MEDIA_UPLOAD` / `MEDIA_DELETE` | P2 | ✅ |
| `PLAYLIST_PUBLISH` | P2 | ✅ |
| `SCHEDULE_CREATE` / `SCHEDULE_DELETE` | P3 | ❌ |

---

## 12. Compliance Readiness

### 12.1 GDPR

| Requirement | Current | Gap |
|---|---|---|
| Data export | ❌ No endpoint | **P1** — must implement |
| Data deletion (right to be forgotten) | ⚠️ Hard delete cascades but no formal process | **P1** |
| Consent management | ❌ Not implemented | **P2** |
| Data processing log | ⚠️ `AuditLog` exists but not structured for GDPR | **P2** |
| Cross-border transfer | ❌ No documentation | **P2** |

### 12.2 SOC 2

| Requirement | Current | Gap |
|---|---|---|
| Access controls | ✅ RBAC + platform roles | Good |
| Audit logging | ❌ Insufficient coverage | **P0** — see §11 |
| Change management | ⚠️ Git-based but no formal approval process | **P2** |
| Data backup | ⚠️ Docker volumes, no automated backup | **P1** |
| Incident response | ❌ No documented process | **P2** |
| Vulnerability management | ⚠️ Dependabot configured | Good |
| Encryption at rest | ⚠️ `ENCRYPTION_KEY` exists but unclear what's encrypted | **P1** — must document |

### 12.3 PCI DSS

| Requirement | Current | Gap |
|---|---|---|
| Card data handling | ✅ Stripe handles all card data | Good — SAQ-A |
| No card data storage | ✅ No card data in DB | Good |
| Webhook signature | ✅ Stripe signature verification | Good |

---

## 13. Security Score Summary

| Area | Score | Key Issue |
|---|---|---|
| Password Security | 9/10 | Strong hashing, lockout, enumeration prevention |
| JWT Security | 5/10 | No audience claim, HS256 not RS256 |
| Session Management | 6/10 | DB-based, no per-session revocation, no device binding |
| Authorization | 6/10 | SuperAdminGuard (JWT-only), no audience guard |
| Impersonation | 3/10 | Direct token mint, same cookie, no time limit |
| Cookie Strategy | 4/10 | Single cookie, no domain separation |
| CSRF Protection | 8/10 | Well-implemented, minor improvements |
| CORS | 9/10 | Excellent configuration |
| Rate Limiting | 7/10 | Good but no per-audience or per-endpoint limits |
| Secrets Management | 9/10 | Excellent production assertions |
| Tenant Isolation | 5/10 | Manual, no middleware, WS vulnerability |
| Replay Prevention | 7/10 | Good for JWT, weak for API keys |
| Audit Logging | 3/10 | Only 3 of 14 critical events audited |
| Compliance | 4/10 | GDPR and SOC2 gaps are significant |
| **Overall Security** | **5.9/10** | **Significant gaps in audit, impersonation, and tenant isolation** |
