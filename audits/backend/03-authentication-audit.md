# 03 — Authentication Audit

> **Objective:** Evaluate the authentication system: JWT, refresh tokens, OTP registration, 2FA, password reset, session management, and brute-force protection.

---

## 1. Current State

Authentication is implemented in `domains/auth/` with two controllers (`AuthController`, `DevLoginController`) and three services (`AuthService`, `TwoFactorService`, `LoginLockoutService`). The system uses JWT access + refresh tokens with HTTP-only cookies, OTP-based email verification, optional TOTP 2FA, and per-email brute-force lockout.

---

## 2. What Exists

### Registration Flow
- **Two-step OTP registration:** `POST /auth/register/start` → `POST /auth/register/verify`
- Start: creates a pending user with hashed password, generates 6-digit OTP, sends verification email
- Resend: `POST /auth/register/resend` (throttled 5/min)
- Verify: validates OTP (10/min throttle — brute-force resistant for 6-digit code), activates user, creates workspace, issues JWT pair
- OTP helper: `OtpHelper` generates cryptographically random 6-digit codes with 15-minute TTL

### Login Flow
- `POST /auth/login` — Email + password, throttled at 20/min per IP
- Per-email lockout via `LoginLockout` model: tracks failed attempts, locks after threshold
- Lockout is keyed on submitted email (not userId) — prevents account enumeration via lockout
- 2FA-aware: if user has 2FA enabled, returns `{ requiresTwoFactor: true, email }` instead of tokens
- `POST /auth/login-2fa` — Completes login with TOTP token after 2FA challenge
- Sets HTTP-only cookies: `cs_access_token` and `cs_refresh_token`

### Token Management
- **Access token:** JWT signed with `JWT_ACCESS_SECRET`, carries `sub`, `email`, `typ: 'access'`
- **Refresh token:** JWT signed with `JWT_REFRESH_SECRET`, carries `sub`, `email`, `typ: 'refresh'`, `sid` (session ID)
- **Token type claim (`typ`):** Prevents refresh tokens from being used as access tokens even if secrets are misconfigured to the same value
- **Per-session refresh storage:** `RefreshToken` model stores `tokenHash` + `sessionId` + `expiresAt`. Each login creates a new session; logout deletes all sessions for the user.
- `POST /auth/refresh` — Validates refresh token from cookie, checks against DB, issues new pair
- `POST /auth/logout` — Deletes all refresh token sessions for user, clears cookies

### JWT Strategy (`jwt.strategy.ts`)
- Extracts JWT from cookie (`cs_access_token`) or `Authorization: Bearer` header
- Rejects refresh tokens (`typ === 'refresh'` → `UnauthorizedException`)
- Validates user exists and `isActive` in DB on every request
- Returns `{ sub, email, isSuperAdmin, impersonatedBy }` as `JwtUser`

### Two-Factor Authentication (TOTP)
- `GET /auth/2fa/status` — Check if 2FA is enabled
- `POST /auth/2fa/setup` — Generate secret + QR code URI
- `POST /auth/2fa/enable` — Verify TOTP token to enable (throttled 5/min)
- `POST /auth/2fa/disable` — Verify TOTP token to disable (throttled 5/min)
- Uses `speakeasy` library for TOTP
- 2FA actions are logged via `AuditLogService`

### Password Reset
- `POST /auth/forgot-password` — Generates reset token, sends email (throttled 5/min)
- `POST /auth/reset-password` — Validates token, updates password (throttled 10/min)
- Reset tokens are stored on User model with expiry

### Impersonation
- `POST /admin/users/:id/impersonate` — Super admin only, issues JWT with `impersonatedBy` claim
- `POST /auth/exit-impersonation` — Restores original admin session
- All impersonation events logged to `AuditLog`

### Cookie Management
- `setAuthCookies()` — Sets `cs_access_token` and `cs_refresh_token` as HTTP-only, secure (in production), sameSite=lax
- `clearAuthCookies()` — Clears both cookies on logout
- Cookie utility in `auth-cookie.util.ts`

### Dev Login
- `POST /auth/dev-login` — Only registered when `NODE_ENV !== 'production'`
- Signs in as first active user without password
- Additional guard: checks `NODE_ENV === 'production' && ENABLE_DEV_LOGIN !== 'true'` → 404

### Production Secret Validation
- `assertProductionSecretsAreSet()` — Validates at boot:
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PLAYER_HEARTBEAT_SECRET` are set
  - Not placeholder values (checked against known set)
  - Minimum 32 characters
  - Minimum 8 distinct characters
  - Access and refresh secrets are different

---

## 3. What Is Missing

1. **No password complexity validation** — Registration accepts any password. No minimum length, no complexity rules (uppercase, numbers, symbols). Only `RegisterStartDto` has basic validation.

2. **No password history** — Users can reuse old passwords. No prevention of password reuse.

3. **No session listing/revocation UI** — Users can't see active sessions or revoke individual sessions. Logout deletes ALL sessions.

4. **No email change flow via OTP** — `AccountController` has `POST /account/email/request` and `POST /account/email/verify` but these are separate from auth and not well-documented.

5. **No account lockout notification** — When an account is locked out, no email is sent to the account owner.

6. **No JWT rotation on privilege change** — When a user's role changes, their existing JWT remains valid until expiry. No token revocation on role change.

7. **No refresh token reuse detection** — If a refresh token is used twice (indicating theft), the system doesn't detect this and revoke all sessions. The DB check validates the hash but doesn't track reuse.

8. **No password breach check** — No integration with HaveIBeenPwned or similar to check passwords against known breaches.

9. **No biometric / WebAuthn support** — Only TOTP for 2FA. No FIDO2/WebAuthn for phishing-resistant authentication.

10. **No rate limiting on 2FA setup/disable** — While throttled at 5/min, there's no per-user lockout for repeated failed 2FA verification attempts.

---

## 4. Problems

1. **DevLoginController in codebase** — Even with environment guards, having `POST /auth/dev-login` in the codebase is a security risk. If `ENABLE_DEV_LOGIN=true` is accidentally set in production, it bypasses all authentication.

2. **Refresh token in cookie + body** — Login response returns `accessToken` in the response body AND sets it in a cookie. This dual approach could lead to inconsistent client behavior.

3. **No CSRF protection on auth routes** — Auth routes (`/auth/login`, `/auth/register/*`, `/auth/refresh`) are explicitly exempted from CSRF middleware. While this is necessary for initial login, the refresh endpoint being CSRF-exempt is a risk if the cookie is `sameSite=lax` (which allows top-level navigations to carry the cookie).

4. **Login lockout threshold not configurable** — The lockout threshold and duration are hardcoded in `LoginLockoutService`. Should be environment-configable.

5. **2FA secret stored unencrypted** — The TOTP secret is stored in plaintext on the User model. If the DB is compromised, all 2FA secrets are exposed.

---

## 5. Risks

- **High: No password complexity** — Weak passwords can be used, making brute-force easier even with lockout.
- **Medium: Refresh token reuse not detected** — Token theft could go undetected.
- **Medium: 2FA secret in plaintext** — DB compromise exposes all 2FA secrets.
- **Low: DevLoginController** — Environment-guarded but still a risk vector.
- **Low: No JWT rotation on role change** — Privilege escalation persists until token expiry.

---

## 6. Priority: **Critical**

Authentication is the foundation of security. While the current implementation is strong, the gaps in password policy and refresh token reuse detection are significant.

---

## 7. Completion Percentage: **88%**

The auth system is comprehensive: JWT with typ claims, per-session refresh tokens, 2FA, OTP registration, brute-force lockout, impersonation, production secret validation. Missing: password complexity, session management UI, refresh token reuse detection, WebAuthn.

---

## 8. Recommendations

1. Add password complexity validation to `RegisterStartDto` and `ResetPasswordDto` (min 8 chars, 1 uppercase, 1 number)
2. Implement refresh token reuse detection: when a refresh token is used, check if it was already used and revoke all sessions if so
3. Add session listing endpoint: `GET /auth/sessions` returning active sessions with device/IP info
4. Add individual session revocation: `DELETE /auth/sessions/:sessionId`
5. Encrypt 2FA secrets at rest using AES-256-GCM with a key from environment
6. Make lockout threshold and duration configurable via env vars
7. Add JWT rotation on role change: when role changes, delete all refresh tokens for the user
8. Add password breach check via HaveIBeenPwned API (k-anonymity model)
9. Remove `DevLoginController` entirely and use a separate dev-only script instead
10. Add WebAuthn/FIDO2 support as a phishing-resistant 2FA option

---

## 9. Future Tasks

- [ ] Add password complexity validation
- [ ] Implement refresh token reuse detection
- [ ] Add session listing + individual revocation
- [ ] Encrypt 2FA secrets at rest
- [ ] Make lockout parameters configurable
- [ ] Add JWT rotation on privilege change
- [ ] Add password breach check
- [ ] Remove DevLoginController
- [ ] Add WebAuthn/FIDO2 support
- [ ] Add account lockout email notification
