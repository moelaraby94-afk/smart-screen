# Phase 2 — Code Review

> **Method:** Line-by-line review of every modified file.
> **Date:** 2026-07-18

## 1. Password Complexity Decorator

**File:** `apps/backend/src/common/validators/password-complexity.decorator.ts`

```typescript
// Line 28-35
validate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return (
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^a-zA-Z0-9]/.test(value)
  );
}
```

**Assessment:**
- ✅ Reusable decorator via `registerDecorator` — no duplicated logic
- ✅ Type-safe: checks `typeof value !== 'string'` first
- ✅ Clear error message at line 24-25
- ✅ Uses `class-validator` API correctly
- ⚠️ No `defaultMessage` method — message is hardcoded in options. Acceptable.

## 2. DTOs with Password Complexity

**Files reviewed:**
- `register.dto.ts:20` — `@MatchesPasswordComplexity()` ✅
- `register-start.dto.ts:40` — `@MatchesPasswordComplexity()` ✅
- `reset-password.dto.ts:14` — `@MatchesPasswordComplexity()` ✅
- `create-account-member.dto.ts:35` — `@MatchesPasswordComplexity()` ✅
- `create-staff.dto.ts:12` — **MISSING** `@MatchesPasswordComplexity()`, only `@MinLength(6)` ❌

## 3. CryptoService

**File:** `apps/backend/src/common/crypto/crypto.service.ts`

**Constructor (lines 26-38):**
- ✅ Throws `InternalServerErrorException` if `ENCRYPTION_KEY` is missing
- ✅ Uses `scryptSync` for key derivation (memory-hard, NIST-approved)
- ⚠️ Fixed salt `'smart-screen-salt'` — acceptable, security relies on key secrecy

**encrypt (lines 44-53):**
- ✅ Random 12-byte IV (96-bit, recommended for GCM)
- ✅ `createCipheriv('aes-256-gcm', this.key, iv)` — correct algorithm
- ✅ `getAuthTag()` — authenticated encryption
- ✅ Format: `iv:authTag:ciphertext` all base64 — self-contained

**decrypt (lines 66-87):**
- ✅ Splits on `:` — 3 parts expected
- ✅ `setAuthTag` before `final()` — verifies integrity
- ⚠️ Lines 68-69: Returns plaintext if not 3 parts — backward compat for pre-encryption values
- ⚠️ Lines 84-86: Catches all errors, returns raw value — fail-open. Impact: DoS (2FA fails), not bypass
- 💡 Suggestion: Log a warning when backward compat path is hit, to track migration progress

## 4. TwoFactorService

**File:** `apps/backend/src/domains/auth/two-factor.service.ts`

- ✅ Line 7: Imports `CryptoService`
- ✅ Line 18: Injects `CryptoService` as 3rd constructor arg
- ✅ Line 120: `this.cryptoService.encrypt(secret)` before DB write
- ✅ Line 139: `this.cryptoService.decrypt(user.twoFactorSecret)` before TOTP verification
- ✅ Line 152: `twoFactorSecret: null` on disable — clears encrypted secret

## 5. AuthService

**File:** `apps/backend/src/domains/auth/auth.service.ts`

- ✅ Line 101: `cryptoService: CryptoService` injected as 8th constructor arg
- ✅ Line 564: `this.cryptoService.decrypt(user.twoFactorSecret)` before 2FA verification during login
- ✅ Lines 725-733: `revokeAllSessions` method — uses `$transaction` for atomicity
- ✅ Line 727: Deletes all refresh tokens
- ✅ Line 728-731: Clears `refreshTokenHash` on user model
- ✅ `devLoginAsFirstUser` method removed (grep confirms 0 matches)

## 6. AuthModule

**File:** `apps/backend/src/domains/auth/auth.module.ts`

- ✅ Line 12: `CryptoModule` imported
- ✅ Line 18: `CryptoModule` in imports array
- ✅ Line 31: `controllers: [AuthController]` — no `DevLoginController`
- ✅ Line 32: `TwoFactorService` in providers (gets `CryptoService` via `CryptoModule`)

## 7. RealtimeGateway

**File:** `apps/backend/src/domains/realtime/realtime.gateway.ts`

- ✅ Lines 251-263: `assertScreenSecret` — no shared secret fallback
- ✅ Line 259: If `pairingSecretHash` exists, uses `bcrypt.compare`
- ✅ Line 262: If `pairingSecretHash` is null, returns `false` — rejects
- ✅ Lines 248-249: Comment documents the removal

## 8. PlayerService

**File:** `apps/backend/src/domains/player/player.service.ts`

- ✅ Lines 35-54: `assertPlayerSecretForScreen` — no shared secret fallback
- ✅ Line 43-44: Throws if no secret provided
- ✅ Line 46-51: If `pairingSecretHash` exists, uses `bcrypt.compare`
- ✅ Line 53: If `pairingSecretHash` is null, throws `UnauthorizedException`

## 9. WorkspacesService

**File:** `apps/backend/src/domains/workspaces/workspaces.service.ts`

- ✅ Line 8: `forwardRef` imported
- ✅ Line 26: `AuthService` imported
- ✅ Lines 46-47: `@Inject(forwardRef(() => AuthService))` — correct circular dependency handling
- ✅ Lines 687-695: `updateMemberRole` — updates role, selects user ID
- ✅ Line 699: Calls `this.authService.revokeAllSessions(updated.user.id)` after role change
- ❌ Line 704-728: `removeMember` — does NOT call `revokeAllSessions`
- ❌ Line 953-987: `updateAccountMemberRole` — does NOT call `revokeAllSessions`
- ❌ Line 989-1000: `removeAccountMember` — does NOT call `revokeAllSessions`
- ⚠️ Lines 687-699: Role update and session revocation are NOT in a single transaction

## 10. AdminService

**File:** `apps/backend/src/domains/admin/admin.service.ts`

- ✅ Line 95: `auth: AuthService` injected (pre-existing)
- ✅ Lines 814-817: `roleChanged` check — covers `isSuperAdmin`, `platformStaffRole`, `isActive`
- ✅ Line 818-819: Calls `this.auth.revokeAllSessions(userId)` when role changes
- ⚠️ Lines 796-819: DB update and session revocation are NOT in a single transaction
- ✅ Line 773-774: When `platformStaffRole` is set to `SUPER_ADMIN`, `isSuperAdmin` is also set — caught by `roleChanged` check

## 11. Assert Production Secrets

**File:** `apps/backend/src/common/config/assert-production-secrets.ts`

- ✅ Line 4: `ENCRYPTION_KEY` in `REQUIRED_SECRETS`
- ✅ Line 21: `'replace-with-strong-encryption-key'` in `KNOWN_PLACEHOLDER_SECRETS`
- ✅ `PLAYER_HEARTBEAT_SECRET` removed from `REQUIRED_SECRETS`
- ✅ Lines 57-86: Production-only check, lists all problems, clear error message

## 12. CI Configuration

**File:** `.github/workflows/ci.yml`

- ✅ Line 43: `npm audit --audit-level=high` — no `|| true`, blocking
- ✅ Lines 40-41: Comment documents the change

## 13. Dependabot Configuration

**File:** `.github/dependabot.yml`

- ✅ npm ecosystem with weekly schedule
- ✅ Package grouping (nestjs, prisma, react, nextjs, typescript) — reduces PR noise
- ✅ Docker ecosystem covered
- ✅ GitHub Actions ecosystem covered

## 14. .env.example

- ✅ `ENCRYPTION_KEY` added with generation instructions
- ✅ `PLAYER_HEARTBEAT_SECRET` removed
- ✅ `ENABLE_DEV_LOGIN` removed
- ✅ Comment at line 25-26 documents shared secret removal

## 15. Test Files

**Files reviewed:**
- `assert-production-secrets.spec.ts` — ✅ Tests use `ENCRYPTION_KEY`, cover placeholder rejection
- `realtime.gateway.spec.ts` — ✅ Uses bcrypt hash for `pairingSecretHash`, `'test-secret'` for auth
- `player.service.spec.ts` — ✅ Shared secret fallback test now expects `UnauthorizedException`
- `player.prayer-pause.spec.ts` — ✅ Uses bcrypt hash, `bcryptjs` import added
- `pairing-to-bootstrap.integration.spec.ts` — ✅ `RedisService` mock with `getClient`, shared secret test expects 401
- `workspaces.service.spec.ts` — ✅ `AuthService` mock added to constructor
- `auth-refresh-session.spec.ts` — ⚠️ Uses `null as never` for `CryptoService` (acceptable, 2FA not exercised)

## 16. Migration Runbook

**File:** `prisma/migrations/20260719000000_encrypt_2fa_secrets/migration.sql`

- ✅ Clear documentation of purpose
- ✅ Safety instructions (backup, test on staging)
- ✅ Notes backward compatibility self-healing
- ❌ References `scripts/encrypt-2fa-secrets.ts` which does not exist

## Code Quality

- No `TODO`, `FIXME`, `HACK`, `XXX`, `WORKAROUND` in any Phase 2 file
- No `@ts-ignore` or `eslint-disable` in Phase 2 files
- No `console.log` added by Phase 2 (pre-existing ones in logger/startup only)
- No unsafe casts added (pre-existing `null as never` in test is acceptable)
- No formatting-only changes
- No accidental refactors
