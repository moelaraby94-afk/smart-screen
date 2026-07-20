# 04 — Authentication

> **Document Type:** Authentication Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Enterprise authentication, identity separation, JWT design, session management, impersonation

---

## 1. Current State

### 1.1 Current Authentication

- **Single JWT strategy** — One `JwtStrategy` validates all tokens. No audience claim distinguishes platform staff from customers.
- **Shared login endpoint** — `POST /auth/login` issues the same token type for all users.
- **`isSuperAdmin` boolean** — Stored on User model, included in JWT payload. `RolesGuard` checks this for super admin bypass.
- **Refresh tokens** — Stored in database (`RefreshToken` table), rotated on use.
- **2FA** — TOTP-based, optional for all users. No enforcement for platform staff.
- **Session management** — No active session tracking. JWT expiry is the only session termination mechanism.
- **Impersonation** — Super admin mints a customer JWT via `POST /admin/users/:id/impersonate`. The token replaces the admin's session in the same frontend. No cross-domain flow.

### 1.2 Problems

1. **No identity separation** — Platform staff and customers share the same authentication context
2. **No audience validation** — Any token can attempt any route
3. **Super admin bypass** — `RolesGuard` allows `isSuperAdmin` to access all customer routes
4. **No session control** — Cannot force-logout a user (must wait for JWT expiry)
5. **No concurrent session limit** — A user can have unlimited active sessions
6. **No 2FA enforcement** — Platform staff can operate without 2FA
7. **Same-origin impersonation** — Impersonation token coexists with admin token in the same cookie jar
8. **No SSO** — No SAML or OIDC support for enterprise customers

---

## 2. Target Architecture

### 2.1 Identity Model

```
┌─────────────────────────────────────────────────────────┐
│                    IDENTITY MODEL                         │
│                                                          │
│  ┌──────────────┐     ┌──────────────┐                  │
│  │  Platform     │     │  Customer    │                  │
│  │  Identity     │     │  Identity    │                  │
│  │               │     │              │                  │
│  │  audience:    │     │  audience:   │                  │
│  │  'platform'   │     │  'customer'  │                  │
│  │               │     │              │                  │
│  │  Roles:       │     │  Roles:      │                  │
│  │  SUPER_ADMIN  │     │  OWNER       │                  │
│  │  SUPPORT      │     │  ADMIN       │                  │
│  │  BILLING      │     │  EDITOR      │                  │
│  │  SECURITY     │     │  VIEWER      │                  │
│  │  OPERATIONS   │     │              │                  │
│  │  DEVELOPER    │     │  2FA:        │                  │
│  │               │     │  Optional    │                  │
│  │  2FA: Required│     │              │                  │
│  │  Session: 4h  │     │  Session:24h │                  │
│  │  Max: 2       │     │  Max: 5      │                  │
│  └──────┬────────┘     └──────┬───────┘                  │
│         │                     │                          │
│         │   ┌──────────────┐  │                          │
│         │   │  Support     │  │                          │
│         └──►│  Identity    │◄─┘                          │
│             │  (imperson.) │                             │
│             │              │                             │
│             │  audience:   │                             │
│             │  'customer'  │                             │
│             │  +           │                             │
│             │  impersonated│                             │
│             │  By: actorId │                             │
│             └──────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

### 2.2 JWT Design

#### Access Token

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "audience": "platform | customer",
  "isSuperAdmin": false,
  "platformStaffRole": "SUPER_ADMIN | SUPPORT | BILLING | SECURITY | OPERATIONS | DEVELOPER | null",
  "impersonatedBy": "admin-uuid | null",
  "sessionId": "session-uuid",
  "iat": 1718000000,
  "exp": 1718014400,
  "iss": "cloud-signage"
}
```

**Key design decisions:**
- `audience` — Partition API access. Validated by `PlatformAudienceGuard` and `CustomerAudienceGuard`.
- `platformStaffRole` — Replaces `isSuperAdmin` as the primary platform role indicator. `SUPER_ADMIN` is a role value, not a boolean.
- `impersonatedBy` — Present only during impersonation. Identifies the acting admin. Used for audit trail and impersonation banner.
- `sessionId` — Links JWT to a Redis session record. Enables force-logout and concurrent session limits.
- `exp` — Platform: 4 hours. Customer: 24 hours. Impersonated: 15 minutes (configurable).

#### Refresh Token

- Stored as HTTP-only cookie (`__cp_refresh` for platform, `__dash_refresh` for customer)
- Rotation: New refresh token issued on every refresh. Old token blacklisted in Redis.
- Reuse detection: If a blacklisted refresh token is used, all sessions for that user are terminated (token theft detected).
- TTL: Platform 7 days, Customer 30 days, Impersonated 1 hour.

### 2.3 JWT Claims Schema

| Claim | Type | Platform Token | Customer Token | Impersonated Token |
|---|---|---|---|---|
| `sub` | string | Staff user ID | Customer user ID | Customer user ID |
| `email` | string | Staff email | Customer email | Customer email |
| `audience` | enum | `platform` | `customer` | `customer` |
| `isSuperAdmin` | boolean | true (if SUPER_ADMIN) | false | false |
| `platformStaffRole` | enum\|null | Role value | null | null |
| `impersonatedBy` | string\|null | null | null | Admin user ID |
| `sessionId` | string | Session ID | Session ID | Session ID |
| `iat` | number | Issued at | Issued at | Issued at |
| `exp` | number | +4h | +24h | +15m |
| `iss` | string | `cloud-signage` | `cloud-signage` | `cloud-signage` |

### 2.4 Login Flow

#### Platform Login

```
Control Panel (admin.cloudsignage.com)
  │
  │  POST /auth/login
  │  { email, password, audience: 'platform' }
  │
  ▼
Backend
  │
  │  1. Validate email + password
  │  2. Check user.isSuperAdmin || user.platformStaffRole
  │  3. Check user.status === 'ACTIVE'
  │  4. Check 2FA required (platform: always)
  │     - If 2FA enabled: return { requires2FA: true, challenge }
  │     - If 2FA not enabled: reject (platform staff must have 2FA)
  │  5. Verify 2FA code (if challenge)
  │  6. Check concurrent session limit (platform: max 2)
  │     - If exceeded: terminate oldest session
  │  7. Create session in Redis:
  │     key: session:{sessionId}
  │     value: { userId, audience, createdAt, ip, userAgent }
  │     TTL: 4h
  │  8. Issue access token (audience: 'platform', exp: +4h)
  │  9. Issue refresh token (exp: +7d)
  │  10. Set cookies:
  │      __cp_access (HTTP-only, Secure, SameSite=Strict, domain=admin.*)
  │      __cp_refresh (HTTP-only, Secure, SameSite=Strict, domain=admin.*)
  │
  ▼
Control Panel
  │
  │  11. Store tokens in cookies
  │  12. Load PlatformContext
  │  13. Render Control Panel
```

#### Customer Login

```
Customer Workspace (app.cloudsignage.com)
  │
  │  POST /auth/login
  │  { email, password, audience: 'customer' }
  │
  ▼
Backend
  │
  │  1. Validate email + password
  │  2. Check user.status === 'ACTIVE'
  │  3. Check 2FA (customer: optional)
  │     - If 2FA enabled: return { requires2FA: true, challenge }
  │  4. Verify 2FA code (if challenge)
  │  5. Check concurrent session limit (customer: max 5)
  │     - If exceeded: terminate oldest session
  │  6. Create session in Redis
  │  7. Issue access token (audience: 'customer', exp: +24h)
  │  8. Issue refresh token (exp: +30d)
  │  9. Set cookies:
  │      __dash_access (HTTP-only, Secure, SameSite=Lax, domain=app.*)
  │      __dash_refresh (HTTP-only, Secure, SameSite=Lax, domain=app.*)
  │
  ▼
Customer Workspace
  │
  │  10. Store tokens in cookies
  │  11. Load WorkspaceContext
  │  12. Render Customer Workspace
```

### 2.5 Backward Compatibility

**Old tokens (no `audience` claim):**
- Treated as `audience: 'customer'` — backward compatible
- Gradually migrated: on next refresh, new token includes `audience`
- After migration period (30 days), old tokens are rejected

**Login without `audience` parameter:**
- Defaults to `audience: 'customer'`
- Platform staff logging in without `audience` get a customer token (can only access customer routes)
- Control Panel login always sends `audience: 'platform'`

---

## 3. Session Management

### 3.1 Redis Session Store

```
Key: session:{sessionId}
Value: {
  userId: "user-uuid",
  audience: "platform | customer",
  createdAt: "2026-07-18T12:00:00Z",
  lastActivity: "2026-07-18T15:30:00Z",
  ip: "203.0.113.42",
  userAgent: "Mozilla/5.0...",
  impersonatedBy: null | "admin-uuid"
}
TTL: 4h (platform) | 24h (customer) | 15m (impersonated)
```

### 3.2 Session Lifecycle

| Event | Action |
|---|---|
| Login | Create session in Redis, set cookies |
| API request | Update `lastActivity`, extend TTL |
| Token refresh | Rotate refresh token, update session |
| Logout | Delete session from Redis, clear cookies, blacklist access token until expiry |
| Force logout (admin) | Delete session, blacklist tokens |
| Session timeout | Redis TTL expires → session auto-deleted |
| Concurrent session exceeded | Terminate oldest session |
| Password change | Terminate all sessions except current |
| 2FA disabled | Terminate all sessions (require re-login) |
| Role change (platform) | Terminate all sessions (require re-login with new role) |
| Account suspension | Terminate all sessions |

### 3.3 JWT Blacklist

```
Key: blacklist:{jti | sessionId}
Value: "revoked"
TTL: remaining token expiry
```

- On every request, check if `sessionId` is in blacklist
- If blacklisted, reject with 401 Unauthorized
- Blacklist entries auto-expire when the token would have expired

### 3.4 Concurrent Session Limits

| Identity | Max Sessions | Behavior on Exceed |
|---|---|---|
| Platform staff | 2 | Terminate oldest session |
| Customer | 5 | Terminate oldest session |
| Impersonated | 1 | Reject new impersonation if one active |

---

## 4. Cookie Strategy

### 4.1 Cookie Configuration

| Cookie | Domain | Path | SameSite | Secure | HTTP-only | Purpose |
|---|---|---|---|---|---|---|
| `__cp_access` | `admin.cloudsignage.com` | `/` | Strict | ✅ | ✅ | Platform access token |
| `__cp_refresh` | `admin.cloudsignage.com` | `/` | Strict | ✅ | ✅ | Platform refresh token |
| `__dash_access` | `app.cloudsignage.com` | `/` | Lax | ✅ | ✅ | Customer access token |
| `__dash_refresh` | `app.cloudsignage.com` | `/` | Lax | ✅ | ✅ | Customer refresh token |

### 4.2 Why Different Cookie Names?

- **No collision** — Platform and customer cookies never interfere
- **Clear identification** — Backend middleware knows which cookie to read based on the request origin
- **Independent expiry** — Platform and customer sessions expire independently

### 4.3 Why SameSite=Strict for Platform?

Platform cookies should never be sent on cross-origin requests. This prevents CSRF attacks on the Control Panel. The Control Panel only makes same-origin API calls (to `admin.cloudsignage.com/api/*`).

### 4.4 Why SameSite=Lax for Customer?

Customer cookies need to be sent on top-level navigation (e.g., when a user clicks a link to `app.cloudsignage.com/overview`). Lax allows this while still preventing CSRF on POST/PUT/DELETE requests.

---

## 5. Impersonation Architecture

### 5.1 Design: Exchange Token with Cross-Domain Redirect

This is the safest design. Detailed in the architecture review (Section 6). Summary:

1. **Control Panel** calls `POST /platform/impersonation/start` with target user ID
2. **Backend** validates super admin, generates one-time exchange token (256-bit random), stores in Redis (30s TTL)
3. **Control Panel** redirects browser to `app.cloudsignage.com/auth/impersonate?token={exchangeToken}`
4. **Customer Workspace** calls `POST /auth/exchange-impersonation` with exchange token
5. **Backend** validates exchange token (Redis lookup, one-time use, delete), issues customer-audience JWT with `impersonatedBy` claim
6. **Customer Workspace** sets cookies, shows impersonation banner, redirects to `/overview`
7. **Exit:** User clicks "Return to Control Panel" → `POST /auth/exit-impersonation` → backend issues platform exchange token → redirect to `admin.cloudsignage.com`

### 5.2 Security Guarantees

- One-time use (deleted from Redis on exchange)
- 30-second TTL (expires before interception can be used)
- HTTPS only (token in URL parameter)
- Separate cookies per domain (no cookie collision)
- `impersonatedBy` claim in JWT (audit trail)
- Cannot access platform routes while impersonated (audience: customer)
- Admin's original session preserved on `admin.cloudsignage.com`

### 5.3 Audit Logging

Every impersonation event is logged:

| Event | Action | Fields |
|---|---|---|
| Start | `IMPERSONATION_START` | actorId, targetId, targetEmail, workspaceId, ip, userAgent |
| End | `IMPERSONATION_END` | actorId, targetId, duration, ip |

### 5.4 Active Session Tracking

```
Key: impersonation:{actorId}
Value: {
  targetId: "user-uuid",
  sessionId: "session-uuid",
  startedAt: "2026-07-18T12:00:00Z"
}
TTL: 15m (impersonation token TTL)
```

- Platform staff can view active impersonations in Security Center
- Super admin can force-end any impersonation
- Only one active impersonation per actor

---

## 6. 2FA Architecture

### 6.1 TOTP-Based 2FA

- Algorithm: TOTP with HMAC-SHA1 (RFC 6238)
- Digits: 6
- Period: 30 seconds
- Window: 1 (accepts current + previous code)
- Secret: 20 bytes (base32 encoded)

### 6.2 Enforcement

| Identity | 2FA Required | Enforcement |
|---|---|---|
| Platform staff | Yes | Login rejected if 2FA not enabled |
| Customer OWNER | Recommended | Prompted on login, can dismiss |
| Customer ADMIN | Recommended | Prompted on login, can dismiss |
| Customer EDITOR | Optional | Not prompted |
| Customer VIEWER | Optional | Not prompted |

### 6.3 2FA Flow

```
Login (email + password verified)
  │
  ├── 2FA not enabled?
  │   ├── Platform staff → REJECT ("2FA required for platform staff")
  │   └── Customer → Issue tokens (no 2FA)
  │
  └── 2FA enabled?
      └── Return { requires2FA: true, challenge: sessionId }
          │
          ▼
      POST /auth/2fa/verify
      { sessionId, code }
          │
          ├── Valid → Issue tokens
          └── Invalid → Return 401 (retry, max 5 attempts)
```

### 6.4 2FA Recovery

- Backup codes: 10 single-use codes generated at 2FA setup
- Recovery via email: If user loses device, platform staff can reset 2FA (with audit trail)
- Customer 2FA reset: Customer can request via support ticket

---

## 7. SSO (Future)

### 7.1 SAML 2.0 (Enterprise Customers)

- **Use case:** Enterprise customers with existing IdP (Okta, Azure AD, Google Workspace)
- **Flow:** SP-initiated SAML → IdP login → Assertion → Backend validates → Issue customer JWT
- **Configuration:** Customer provides IdP metadata URL. Backend registers as SP.
- **Mapping:** SAML attributes → User fields (email, name, groups → roles)

### 7.2 OIDC (Enterprise Customers)

- **Use case:** Customers with OIDC provider (Google, Microsoft, Auth0)
- **Flow:** Authorization Code flow → IdP login → Token exchange → User info → Issue customer JWT
- **Configuration:** Customer provides OIDC discovery URL, client ID, client secret.

### 7.3 Platform Staff SSO

- **Use case:** Platform staff with corporate IdP
- **Flow:** Same as customer SSO, but issues platform-audience JWT
- **Enforcement:** 2FA via IdP (not backend TOTP)

---

## 8. Token Revocation

### 8.1 Revocation Mechanisms

| Mechanism | Scope | Speed |
|---|---|---|
| Redis session deletion | Per session | Immediate |
| JWT blacklist (Redis) | Per token | Immediate (until expiry) |
| Refresh token rotation | Per session | On next refresh |
| Password change | All sessions | Immediate (sessions deleted) |
| Account suspension | All sessions | Immediate (sessions deleted) |

### 8.2 Revocation Flow

```
Force logout (admin action)
  │
  ├── Delete session:{sessionId} from Redis
  ├── Add sessionId to blacklist:{sessionId} (TTL: token expiry)
  ├── Delete refresh token from database
  └── Next API request with that session → 401 Unauthorized
```

---

## 9. Rate Limiting on Auth Endpoints

| Endpoint | Rate Limit | Key |
|---|---|---|
| `POST /auth/login` | 5 req/min | IP + email |
| `POST /auth/register` | 3 req/min | IP |
| `POST /auth/forgot-password` | 3 req/min | IP + email |
| `POST /auth/reset-password` | 5 req/min | IP |
| `POST /auth/2fa/verify` | 5 req/min | sessionId |
| `POST /auth/refresh` | 30 req/min | IP |
| `POST /auth/exchange-impersonation` | 3 req/min | IP |
| `POST /auth/exit-impersonation` | 10 req/min | IP |

---

## 10. Security Considerations

### 10.1 Token Storage

- **Access token:** HTTP-only cookie (not accessible by JavaScript, prevents XSS theft)
- **Refresh token:** HTTP-only cookie (same)
- **No localStorage/sessionStorage** for tokens (XSS vulnerable)

### 10.2 CSRF Protection

- **Platform:** SameSite=Strict cookies + custom header check (`X-Requested-With`)
- **Customer:** SameSite=Lax cookies + custom header check for state-changing requests
- **Alternative:** Double-submit cookie pattern (if SameSite is not sufficient)

### 10.3 Password Policy

| Identity | Min Length | Complexity | Rotation |
|---|---|---|---|
| Platform staff | 12 | Upper, lower, digit, symbol | 90 days |
| Customer | 8 | Upper, lower, digit | No rotation (NIST recommendation) |

### 10.4 Password Hashing

- Algorithm: bcrypt (cost factor 12)
- No MD5, SHA1, or plain text
- Password never logged or included in API responses

---

## 11. Open Questions

1. **Should we deprecate `isSuperAdmin` boolean** in favor of `platformStaffRole: SUPER_ADMIN`? Yes — reduces ambiguity. Migration: set `platformStaffRole = SUPER_ADMIN` for all users where `isSuperAdmin = true`, then remove the boolean.
2. **Should platform staff be able to log in via the Customer Workspace?** Yes — but they get a customer-audience token. They see customer routes, not admin routes. This is useful for testing the customer experience.
3. **Should we support magic link authentication** (passwordless via email)? Future — good for customer onboarding, not for platform staff.
4. **Should we support biometric authentication** (WebAuthn)? Future — good for platform staff on supported devices.
5. **Should impersonation require a reason** (free text input)? Yes — for audit trail. Add `reason` field to `POST /platform/impersonation/start`.

---

## 12. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| JWT audience | `platform` / `customer` | Partition API access, prevent cross-domain token misuse |
| Token storage | HTTP-only cookies | XSS protection, no JavaScript access |
| Session tracking | Redis | Fast, TTL-based, supports concurrent session limits |
| Refresh token rotation | On every refresh | Detect token theft (reuse → revoke all) |
| 2FA for platform | Required | Platform staff have highest privileges |
| 2FA for customers | Optional | Don't add friction to customer onboarding |
| Impersonation | Exchange token + cross-domain redirect | Safest design, separate cookies, audit trail |
| Cookie domains | Separate per app | No collision, independent expiry |
| SameSite | Strict (platform) / Lax (customer) | CSRF protection vs. navigation convenience |
| Password hashing | bcrypt (cost 12) | Industry standard, slow enough to resist brute force |
| SSO | Future (SAML + OIDC) | Enterprise feature, not required for initial separation |
