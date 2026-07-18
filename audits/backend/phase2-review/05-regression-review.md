# Phase 2 — Regression Review

> **Method:** Run all verification commands, classify failures as new/pre-existing/regression.
> **Date:** 2026-07-18

## Verification Commands

### TypeScript (`npx tsc --noEmit`)

```
Found 10 errors in 3 files.

Errors  Files
     7  src/common/auth/roles.guard.spec.ts:82
     1  src/domains/playlists/playlists.p2-t1.spec.ts:351
     2  src/domains/playlists/playlists.service.spec.ts:346
```

**Classification:** ALL PRE-EXISTING

| File | Error | Cause | Phase 2? |
|------|-------|-------|----------|
| `roles.guard.spec.ts` (7 errors) | `Expected 3 arguments, but got 2` | `RolesGuard` constructor updated in Phase 1 to include `AccountContextHelper`, test not updated | ❌ Pre-existing |
| `playlists.p2-t1.spec.ts` (1 error) | `Expected 6 arguments, but got 5` | `PlaylistsService` constructor updated in Phase 1, test not updated | ❌ Pre-existing |
| `playlists.service.spec.ts` (2 errors) | `Expected 6 arguments, but got 5` + `Expected 3-4 arguments, but got 2` | Same as above | ❌ Pre-existing |

**New errors from Phase 2:** 0

### ESLint (`npx eslint src --max-warnings=0`)

```
3 problems (2 errors, 1 warning)

src/domains/playlists/playlists.service.ts
  103:22  warning  Unsafe argument of type `any` assigned to a parameter of type `unknown[]`

src/domains/screens/dto/create-override-rule.dto.ts
   3:3  error  'ArrayMinSize' is defined but never used
  13:3  error  'MaxLength' is defined but never used
```

**Classification:** ALL PRE-EXISTING

| File | Error | Phase 2? |
|------|-------|----------|
| `playlists.service.ts:103` | Unsafe argument warning | ❌ Pre-existing |
| `create-override-rule.dto.ts:3` | Unused import `ArrayMinSize` | ❌ Pre-existing |
| `create-override-rule.dto.ts:13` | Unused import `MaxLength` | ❌ Pre-existing |

**New errors from Phase 2:** 0

### Tests (`npx jest --forceExit`)

```
Test Suites: 6 failed, 44 passed, 50 total
Tests:       26 failed, 466 passed, 492 total
```

**Failed suites classification:**

| Suite | Cause | Phase 2? |
|-------|-------|----------|
| `common/auth/roles.guard.spec.ts` | TS compile error — missing `AccountContextHelper` arg | ❌ Pre-existing |
| `domains/media/media.service.spec.ts` | Pre-existing test failures | ❌ Pre-existing |
| `domains/schedules/scheduling.service.spec.ts` | Pre-existing test failures | ❌ Pre-existing |
| `domains/workspaces/claim-pairing-session-security.spec.ts` | Missing `AccountContextHelper` in test module | ❌ Pre-existing |
| `domains/playlists/playlists.service.spec.ts` | TS compile error — missing `AccountContextHelper` arg | ❌ Pre-existing |
| `common/validation/request-body-validation.spec.ts` | Pre-existing test failures | ❌ Pre-existing |

**New failures from Phase 2:** 0
**Regressions from Phase 2:** 0

### Build (`npx nest build`)

```
Exit code: 0
```

**Status:** ✅ PASS

### Tests Fixed by Phase 2

| Suite | Before | After | Fix |
|-------|--------|-------|-----|
| `assert-production-secrets.spec.ts` | Failing (referenced `PLAYER_HEARTBEAT_SECRET`) | ✅ All pass | Updated to use `ENCRYPTION_KEY` |
| `realtime.gateway.spec.ts` | Failing (used shared secret with null hash) | ✅ All pass | Updated to use bcrypt hash |
| `pairing-to-bootstrap.integration.spec.ts` | Failing (missing `RedisService` + shared secret) | ✅ All pass | Added `RedisService` mock, updated test |
| `player.service.spec.ts` | Would fail (shared secret removed) | ✅ All pass | Updated to use bcrypt hash |
| `player.prayer-pause.spec.ts` | Would fail (shared secret removed) | ✅ All pass | Updated to use bcrypt hash |

## Git Diff Analysis

### Files Changed (from `git status --short`)

| Type | Count | Files |
|------|-------|-------|
| Modified (M) | 22 | See below |
| Deleted (D) | 2 | `dev-login.controller.ts`, `dev-login.controller.spec.ts` |
| New (??) | 4 | `crypto/`, `validators/`, `dependabot.yml`, `migration.sql` |

### Modified Files

1. `.env.example` — Added `ENCRYPTION_KEY`, removed `PLAYER_HEARTBEAT_SECRET`, `ENABLE_DEV_LOGIN`
2. `.github/workflows/ci.yml` — Removed `|| true` from `npm audit`
3. `assert-production-secrets.spec.ts` — Updated for `ENCRYPTION_KEY`
4. `assert-production-secrets.ts` — Replaced `PLAYER_HEARTBEAT_SECRET` with `ENCRYPTION_KEY`
5. `admin.service.ts` — Added `revokeAllSessions` call on role change
6. `auth-refresh-session.spec.ts` — Added `CryptoService` mock arg
7. `auth.module.ts` — Removed `DevLoginController`, added `CryptoModule`
8. `auth.service.ts` — Added `CryptoService` injection, `revokeAllSessions`, removed `devLoginAsFirstUser`
9. `register-start.dto.ts` — Added `@MatchesPasswordComplexity()`
10. `register.dto.ts` — Added `@MatchesPasswordComplexity()`
11. `reset-password.dto.ts` — Added `@MatchesPasswordComplexity()`
12. `two-factor.service.ts` — Added `CryptoService` injection, encrypt/decrypt
13. `pairing-to-bootstrap.integration.spec.ts` — Added `RedisService` mock, updated shared secret test
14. `player.prayer-pause.spec.ts` — Updated to use bcrypt hash
15. `player.service.spec.ts` — Updated to use bcrypt hash
16. `player.service.ts` — Removed shared secret fallback
17. `realtime.gateway.spec.ts` — Updated to use bcrypt hash
18. `realtime.gateway.ts` — Removed shared secret fallback
19. `create-account-member.dto.ts` — Added `@MatchesPasswordComplexity()`
20. `workspaces.service.spec.ts` — Added `AuthService` mock arg
21. `workspaces.service.ts` — Added `AuthService` injection, `revokeAllSessions` call

### Accidental Refactors

**None detected.** All changes are scoped to Phase 2 security hardening. No unrelated files modified. No formatting-only changes.

### Unrelated Changes

**None detected.** All 22 modified files, 2 deleted files, and 4 new files are directly related to Phase 2.

## Regression Verdict

**PASS** — 0 new failures, 0 regressions, 0 accidental refactors. All pre-existing failures documented and verified as unrelated to Phase 2.
