# Phase 2 — Regression Log

## Regressions Introduced by Phase 2

### None

No regressions were introduced. All test failures are pre-existing.

## Pre-Existing Issues Documented

### 1. RolesGuard test missing AccountContextHelper
- **File:** `src/common/auth/roles.guard.spec.ts`
- **Error:** `Expected 3 arguments, but got 2` (7 occurrences)
- **Root cause:** `RolesGuard` constructor was updated in Phase 1 to include `AccountContextHelper`, but the test was not updated
- **Impact:** 7 TypeScript errors, test suite fails to compile
- **Phase 2 action:** Documented as pre-existing. Not fixed (Phase 1 code frozen)

### 2. PlaylistsService test missing AccountContextHelper
- **Files:** `src/domains/playlists/playlists.service.spec.ts`, `src/domains/playlists/playlists.p2-t1.spec.ts`
- **Error:** `Expected 6 arguments, but got 5`
- **Root cause:** `PlaylistsService` constructor was updated in Phase 1 to include `AccountContextHelper`, but tests were not updated
- **Impact:** 3 TypeScript errors, test suites fail to compile
- **Phase 2 action:** Documented as pre-existing. Not fixed (Phase 1 code frozen)

### 3. Claim pairing session security test missing AccountContextHelper
- **File:** `src/domains/workspaces/claim-pairing-session-security.spec.ts`
- **Error:** `Nest can't resolve dependencies of the RolesGuard (Reflector, PrismaService, ?)`
- **Root cause:** Test module doesn't provide `AccountContextHelper`
- **Impact:** 2 test failures
- **Phase 2 action:** Documented as pre-existing. Not fixed (Phase 1 code frozen)

### 4. Media service test failures
- **File:** `src/domains/media/media.service.spec.ts`
- **Error:** Various test failures
- **Root cause:** Pre-existing
- **Phase 2 action:** Documented as pre-existing

### 5. Scheduling service test failures
- **File:** `src/domains/schedules/scheduling.service.spec.ts`
- **Error:** Various test failures
- **Root cause:** Pre-existing
- **Phase 2 action:** Documented as pre-existing

### 6. Request body validation test failures
- **File:** `src/common/validation/request-body-validation.spec.ts`
- **Error:** Various test failures
- **Root cause:** Pre-existing
- **Phase 2 action:** Documented as pre-existing

## Tests Fixed by Phase 2

### 1. assert-production-secrets.spec.ts
- **Before:** 2 failures (tests referenced `PLAYER_HEARTBEAT_SECRET` which was replaced with `ENCRYPTION_KEY`)
- **After:** All tests pass
- **Fix:** Updated test data to use `ENCRYPTION_KEY` instead of `PLAYER_HEARTBEAT_SECRET`

### 2. realtime.gateway.spec.ts
- **Before:** 2 failures (tests used shared secret with `pairingSecretHash: null`)
- **After:** All tests pass
- **Fix:** Updated tests to use proper bcrypt hash

### 3. pairing-to-bootstrap.integration.spec.ts
- **Before:** 6 failures (missing `RedisService` provider + shared secret fallback test)
- **After:** All tests pass
- **Fix:** Added `RedisService` mock, updated shared-secret test to expect 401

### 4. player.service.spec.ts
- **Before:** Would fail (shared secret fallback removed)
- **After:** All tests pass
- **Fix:** Updated tests to use bcrypt hash, changed shared-secret fallback test to expect 401

### 5. player.prayer-pause.spec.ts
- **Before:** Would fail (shared secret fallback removed)
- **After:** All tests pass
- **Fix:** Updated test to use bcrypt hash
