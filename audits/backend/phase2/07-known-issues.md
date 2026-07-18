# Phase 2 — Known Issues

## Pre-Existing Issues (Not Introduced by Phase 2)

### KI-2.1: RolesGuard test missing AccountContextHelper
- **Files:** `src/common/auth/roles.guard.spec.ts`
- **Severity:** Low (test-only, production code works)
- **Description:** Test constructs `RolesGuard` with 2 args but constructor expects 3 (`AccountContextHelper` added in Phase 1)
- **Status:** Documented as pre-existing. Phase 1 code is frozen.

### KI-2.2: PlaylistsService tests missing AccountContextHelper
- **Files:** `src/domains/playlists/playlists.service.spec.ts`, `src/domains/playlists/playlists.p2-t1.spec.ts`
- **Severity:** Low (test-only, production code works)
- **Description:** Tests construct `PlaylistsService` with 5 args but constructor expects 6 (`AccountContextHelper` added in Phase 1)
- **Status:** Documented as pre-existing. Phase 1 code is frozen.

### KI-2.3: Claim pairing session security test missing AccountContextHelper
- **File:** `src/domains/workspaces/claim-pairing-session-security.spec.ts`
- **Severity:** Low (test-only)
- **Description:** Test module doesn't provide `AccountContextHelper` for `RolesGuard`
- **Status:** Documented as pre-existing.

### KI-2.4: Media service test failures
- **File:** `src/domains/media/media.service.spec.ts`
- **Severity:** Low (test-only)
- **Description:** Pre-existing test failures unrelated to Phase 2
- **Status:** Documented as pre-existing.

### KI-2.5: Scheduling service test failures
- **File:** `src/domains/schedules/scheduling.service.spec.ts`
- **Severity:** Low (test-only)
- **Description:** Pre-existing test failures unrelated to Phase 2
- **Status:** Documented as pre-existing.

### KI-2.6: Request body validation test failures
- **File:** `src/common/validation/request-body-validation.spec.ts`
- **Severity:** Low (test-only)
- **Description:** Pre-existing test failures unrelated to Phase 2
- **Status:** Documented as pre-existing.

### KI-2.7: ESLint errors in create-override-rule.dto.ts
- **File:** `src/domains/screens/dto/create-override-rule.dto.ts`
- **Severity:** Low (lint-only)
- **Description:** Unused imports `ArrayMinSize` and `MaxLength`
- **Status:** Documented as pre-existing.

### KI-2.8: ESLint warning in playlists.service.ts
- **File:** `src/domains/playlists/playlists.service.ts`
- **Severity:** Low (lint-only)
- **Description:** Unsafe argument of type `any` assigned to a parameter of type `unknown[]`
- **Status:** Documented as pre-existing.

## Phase 2 Issues

### None

No new issues were introduced by Phase 2.
