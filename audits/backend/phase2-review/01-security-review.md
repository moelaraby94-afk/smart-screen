# Phase 2 — Security Review

> **Method:** Independent verification from actual source code.
> **Date:** 2026-07-18

## OWASP Top 10 (2021) Compliance

### A02:2021 — Cryptographic Failures

**Status: VERIFIED**

- `CryptoService` uses AES-256-GCM (authenticated encryption) via Node.js `crypto` module
- Key derivation: `scryptSync(encryptionKey, 'cloud-screen-salt', 32)` — memory-hard KDF
- 96-bit IV (12 bytes) — recommended for GCM mode
- Auth tag verified on decrypt — tamper detection
- 2FA secrets encrypted at rest: `two-factor.service.ts:120` calls `this.cryptoService.encrypt(secret)` before DB write
- 2FA secrets decrypted only when needed: `auth.service.ts:564` and `two-factor.service.ts:139` call `decrypt()` at verification time
- `ENCRYPTION_KEY` added to `assert-production-secrets.ts:4` — production boot fails without it
- `ENCRYPTION_KEY` placeholder `'replace-with-strong-encryption-key'` in blocklist at `assert-production-secrets.ts:21`

**Findings:**
- P3: Fixed salt in `scryptSync` — acceptable, security relies on key secrecy
- P3: Backward compat `decrypt()` is fail-open (returns raw value on error) — DoS impact only, not bypass

### A05:2021 — Security Misconfiguration

**Status: VERIFIED**

- `DevLoginController` deleted from filesystem (`git status` shows `D` for both `.ts` and `.spec.ts`)
- `auth.module.ts:31` — `controllers: [AuthController]` only, no `DevLoginController`
- `auth.service.ts` — `devLoginAsFirstUser` method removed (grep confirms 0 matches in `apps/backend/src`)
- `.env.example` — `ENABLE_DEV_LOGIN` removed (grep confirms 0 matches)
- `assert-production-secrets.ts` — `PLAYER_HEARTBEAT_SECRET` removed from `REQUIRED_SECRETS`

**Findings:**
- P2: Frontend dead code in `auth-api.ts`, `session.ts`, `login-form.tsx` still references dev-login

### A06:2021 — Vulnerable and Outdated Components

**Status: VERIFIED**

- `ci.yml:43` — `npm audit --audit-level=high` (no `|| true`) — blocking
- `.github/dependabot.yml` — weekly updates for npm, docker, github-actions with package grouping

### A07:2021 — Identification and Authentication Failures

**Status: PARTIAL**

- Shared secret fallback removed from auth paths:
  - `realtime.gateway.ts:259-262` — returns `false` when `pairingSecretHash` is null
  - `player.service.ts:46-53` — throws `UnauthorizedException` when `pairingSecretHash` is null
- JWT session revocation on role change:
  - `workspaces.service.ts:699` — calls `revokeAllSessions` after `updateMemberRole`
  - `admin.service.ts:818-819` — calls `revokeAllSessions` when `isSuperAdmin`, `platformStaffRole`, or `isActive` changes
  - `auth.service.ts:725-733` — `revokeAllSessions` deletes all refresh tokens + clears `refreshTokenHash` in a single `$transaction`

**Findings:**
- P1: `removeMember` (line 704) does NOT revoke sessions — removed member retains access
- P1: `removeAccountMember` (line 989) does NOT revoke sessions
- P1: `updateAccountMemberRole` (line 953) does NOT revoke sessions
- P3: `pairing.service.ts:197` still uses `PLAYER_HEARTBEAT_SECRET` for non-auth notification

### A01:2021 — Broken Access Control

**Status: VERIFIED (no changes by Phase 2)**

- Existing `RolesGuard`, `WorkspaceAuthHelper`, and workspace membership checks unchanged
- No new endpoints introduced

### A03:2021 — Injection

**Status: VERIFIED (no changes by Phase 2)**

- Prisma ORM used throughout — parameterized queries
- No raw SQL in application code

### A04:2021 — Insecure Design

**Status: VERIFIED**

- Password complexity decorator is reusable — no duplicated logic
- CryptoService is a singleton via NestJS DI — single key derivation at startup

### A08:2021 — Software and Data Integrity Failures

**Status: VERIFIED**

- No new external dependencies added (uses Node.js built-in `crypto`)
- Dependabot configured for automated updates

### A09:2021 — Security Logging and Monitoring Failures

**Status: VERIFIED (no changes by Phase 2)**

- Existing `AuditLogService` unchanged
- `CryptoService` constructor throws on missing `ENCRYPTION_KEY` — fail-fast

### A10:2021 — Server-Side Request Forgery

**Status: VERIFIED (no changes by Phase 2)**

- No new HTTP client code introduced

## ASVS (Application Security Verification Standard)

### V2.1 — Password Security
- **PASS:** Minimum 8 characters on 4/5 password DTOs
- **FAIL:** `CreateStaffDto` allows 6-char passwords with no complexity
- **PASS:** Password complexity (uppercase, lowercase, digit, special) enforced via reusable decorator
- **PASS:** Login DTOs do NOT enforce complexity (correct — verify, not set)

### V2.7 — Out-of-Band Verifier (2FA)
- **PASS:** TOTP secrets encrypted at rest with AES-256-GCM
- **PASS:** Secrets decrypted only at verification time
- **PASS:** Backup codes stored as bcrypt hashes (pre-existing)

### V3.3 — Session Management
- **PASS:** `revokeAllSessions` deletes refresh tokens + clears legacy hash
- **PASS:** `resetPassword` revokes sessions in a transaction
- **PASS:** `deleteAccount` revokes sessions (pre-existing)
- **FAIL:** `removeMember`, `removeAccountMember`, `updateAccountMemberRole` do NOT revoke sessions

### V6.2 — Cryptography
- **PASS:** AES-256-GCM with authenticated encryption
- **PASS:** `scryptSync` key derivation (memory-hard)
- **PASS:** Random 96-bit IV per encryption
- **PASS:** Auth tag verified on decrypt

## Secrets Management

- `ENCRYPTION_KEY` required in production (`assert-production-secrets.ts:4`)
- `ENCRYPTION_KEY` placeholder blocked (`assert-production-secrets.ts:21`)
- `PLAYER_HEARTBEAT_SECRET` removed from required secrets
- `ENABLE_DEV_LOGIN` removed from `.env.example`
- JWT secrets unchanged (pre-existing validation)

## Rate Limiting

- Unchanged by Phase 2 (pre-existing ThrottlerModule)
- Login lockout service unchanged (pre-existing)

## Sensitive Data Exposure

- 2FA secrets: encrypted at rest ✅
- 2FA secrets: never logged ✅ (grep confirms no `console.log` of `twoFactorSecret`)
- 2FA secrets: not exposed in API responses ✅ (not in any `select` clause that returns to client)
- Password hashes: never exposed ✅ (pre-existing)
- `CryptoService` key: derived in constructor, stored as private `Buffer` ✅
