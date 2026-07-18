# Phase 2 — Risk Register

> **Method:** Risk assessment based on independent code verification.
> **Date:** 2026-07-18

## P0 — Critical (Block production)

**None.**

## P1 — High (Must fix before production)

### R-P1-01: CreateStaffDto missing password complexity

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/admin/dto/create-staff.dto.ts:12` |
| **Risk** | Admin-created staff accounts can have weak passwords (6 chars, no complexity) |
| **Impact** | Account compromise via brute force |
| **Likelihood** | Medium — admin-created accounts are high-value targets |
| **Fix** | Add `@MinLength(8)` and `@MatchesPasswordComplexity()` to password field |
| **Effort** | 5 minutes |

### R-P1-02: removeMember missing session revocation

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/workspaces/workspaces.service.ts:704-728` |
| **Risk** | Removed workspace member retains valid refresh token until expiry |
| **Impact** | Unauthorized workspace data access after removal |
| **Likelihood** | High — refresh tokens last 7 days |
| **Fix** | Call `this.authService.revokeAllSessions(membership.userId)` after delete |
| **Effort** | 10 minutes |

### R-P1-03: removeAccountMember missing session revocation

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/workspaces/workspaces.service.ts:989-1000` |
| **Risk** | Removed account member retains valid refresh token |
| **Impact** | Unauthorized access after account member removal |
| **Likelihood** | High — refresh tokens last 7 days |
| **Fix** | Call `this.authService.revokeAllSessions(membership.userId)` after delete |
| **Effort** | 10 minutes |

### R-P1-04: updateAccountMemberRole missing session revocation

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/workspaces/workspaces.service.ts:953-987` |
| **Risk** | Role change doesn't invalidate sessions — user retains old privileges |
| **Impact** | Privilege escalation or retention after demotion |
| **Likelihood** | Medium — requires admin action to trigger |
| **Fix** | Call `this.authService.revokeAllSessions(updated.user.id)` after role update |
| **Effort** | 10 minutes |

## P2 — Medium (Should fix before production)

### R-P2-01: Non-atomic role update + session revocation

| Field | Value |
|-------|-------|
| **Files** | `workspaces.service.ts:687-699`, `admin.service.ts:796-819` |
| **Risk** | Process crash between DB update and `revokeAllSessions` leaves sessions valid |
| **Impact** | Stale privileges until access token expires (15 min max) |
| **Likelihood** | Low — requires crash in ~10ms window |
| **Fix** | Wrap both operations in a single `$transaction` |
| **Effort** | 30 minutes |

### R-P2-02: Missing migration script

| Field | Value |
|-------|-------|
| **File** | `prisma/migrations/20260719000000_encrypt_2fa_secrets/migration.sql:33` |
| **Risk** | Runbook references `scripts/encrypt-2fa-secrets.ts` which doesn't exist |
| **Impact** | Manual migration cannot be performed proactively |
| **Likelihood** | Certain — file is missing |
| **Fix** | Create `scripts/encrypt-2fa-secrets.ts` or remove the reference |
| **Effort** | 1 hour |

### R-P2-03: Frontend dev-login dead code

| Field | Value |
|-------|-------|
| **Files** | `auth-api.ts:23-27`, `session.ts:101`, `login-form.tsx:28` |
| **Risk** | Dead code confusion, potential for re-enabling removed feature |
| **Impact** | Low — backend route is gone, calls will 404 |
| **Likelihood** | Low — only affects developer experience |
| **Fix** | Remove `devLogin()` function, remove `/auth/dev-login` from path allowlist, remove `NEXT_PUBLIC_ENABLE_DEV_LOGIN` check |
| **Effort** | 15 minutes |

## P3 — Low (Technical debt / future improvements)

### R-P3-01: pairing.service.ts shared secret for notifications

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/pairing/pairing.service.ts:197-198` |
| **Risk** | Shared secret pattern used for non-auth workspace notification authorization |
| **Impact** | Low — not an authentication path, only prevents unauthorized pairing notifications |
| **Fix** | Use per-workspace API key or JWT for notification authorization |
| **Effort** | 2 hours |

### R-P3-02: Stale comments

| Field | Value |
|-------|-------|
| **Files** | `player.controller.ts:23-24`, `seed.ts:23` |
| **Risk** | Misleading comments reference removed functionality |
| **Impact** | Developer confusion |
| **Fix** | Update comments to reflect current behavior |
| **Effort** | 5 minutes |

### R-P3-03: CryptoService backward compat is fail-open

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/common/crypto/crypto.service.ts:84-86` |
| **Risk** | Decryption failure returns raw value instead of throwing |
| **Impact** | DoS (2FA fails), not security bypass |
| **Fix** | Log a warning when backward compat path is hit; consider throwing after migration is complete |
| **Effort** | 15 minutes |

### R-P3-04: Fixed salt in scryptSync

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/common/crypto/crypto.service.ts:37` |
| **Risk** | Fixed salt reduces key derivation strength marginally |
| **Impact** | Low — security relies on `ENCRYPTION_KEY` secrecy, not salt randomness |
| **Fix** | Use random salt stored alongside encrypted data (requires format change) |
| **Effort** | 4 hours (requires migration) |

### R-P3-05: Test uses null as never for CryptoService

| Field | Value |
|-------|-------|
| **File** | `apps/backend/src/domains/auth/auth-refresh-session.spec.ts:197` |
| **Risk** | Fragile test — will break if refresh path starts using CryptoService |
| **Impact** | Low — test-only |
| **Fix** | Create proper mock `CryptoService` |
| **Effort** | 15 minutes |

## Risk Summary

| Priority | Count | Blocking? |
|----------|-------|-----------|
| P0 | 0 | — |
| P1 | 4 | Yes — must fix before production |
| P2 | 3 | Recommended before production |
| P3 | 5 | Technical debt |
| **Total** | **12** | |
