# Smart Screen Platform V2 — Master Execution Plan

> **Status:** ACTIVE — Strict execution mode
> **Governance:** Every task must achieve 100% documentation compliance before marking complete
> **Rule:** NO task is complete until: docs reviewed → code analyzed → implemented → tested → verified against docs → documented → memory updated

---

## Execution Protocol (Mandatory for EVERY task)

```
STEP 1: READ DOCS
  → Read the relevant specification document(s)
  → Read the API contract for affected endpoints
  → Read the Prisma schema target for affected models
  → Read the security validation for affected areas
  → Read the risk register for associated risks

STEP 2: ANALYZE CURRENT CODE
  → Read every file that will be modified
  → Identify all import sites that need updating
  → Identify all test files that need updating
  → Document the gap between current state and target spec

STEP 3: IMPLEMENT
  → Make minimal, focused changes
  → Follow existing code style
  → Add all necessary imports at top of file
  → No dead code, no placeholder code

STEP 4: TEST
  → Run TypeScript: npm run typecheck
  → Run ESLint: npm run lint
  → Run unit tests: npm run test
  → Run build: npm run build
  → Write new tests for new functionality
  → All must pass with ZERO errors

STEP 5: VERIFY AGAINST DOCS
  → Compare implementation against specification
  → Check every requirement in the spec is implemented
  → Check every file listed in "Files to Modify" was modified
  → Check verification checklist items
  → Compliance must be 100% — not 95%, not 99%, 100%

STEP 6: DOCUMENT
  → Update progress notes
  → List what was done, what remains
  → Note any deviations from spec (must be justified)

STEP 7: UPDATE MEMORY
  → Save conventions discovered
  → Save patterns established
  → Save decisions made
  → Save mistakes and fixes
```

---

## Phase 0: Foundation

> **Spec:** `docs/platform-v2/implementation/phase-0-specification.md`
> **Estimated:** 2 weeks
> **Rule:** No other phase may begin until Phase 0 is 100% complete

### P0-01: Add JWT Audience Claim

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §1 (JWT Audience Claim) |
| **Effort** | 2 days |
| **Dependencies** | None |
| **Risk** | T-08 (invalidates sessions — mitigated by backward compat) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §1.1 (current state) and §1.2 (target state)
- [ ] Read `api-contracts.md` §2.1 (login response shape with audience)
- [ ] Read `08-security-validation.md` §1.2 (JWT security)
- [ ] Read `apps/backend/src/domains/auth/auth.service.ts` — full file
- [ ] Read `apps/backend/src/domains/auth/jwt.strategy.ts` — full file
- [ ] Read `apps/backend/src/common/auth/current-user.decorator.ts` — full file
- [ ] Read `apps/backend/src/domains/auth/dto/login.dto.ts` — full file
- [ ] Read `apps/backend/src/domains/auth/auth.controller.ts` — full file

**Implementation tasks:**
- [ ] Add `JwtAudience` type to `current-user.decorator.ts`
- [ ] Add `aud` and `platformStaffRole` to `JwtUser` type
- [ ] Add `resolveAudience()` method to `AuthService`
- [ ] Add `aud` to token payload in `login()`, `refresh()`, `issueImpersonation()`
- [ ] Update `JwtStrategy.validate()` to extract `aud` and read `isSuperAdmin`/`platformStaffRole` from DB
- [ ] Add backward compat: `const audience = payload.aud ?? 'customer'`
- [ ] Add optional `audience` field to `LoginDto`
- [ ] Update `AuthController.login()` to pass `audience` through
- [ ] Write unit tests for `resolveAudience()`
- [ ] Write unit tests for `JwtStrategy.validate()` with and without `aud`

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Old tokens without `aud` are accepted (backward compat test)
- [ ] New tokens include `aud` field
- [ ] `isSuperAdmin` is read from DB, not JWT payload
- [ ] Login with `audience: 'platform'` validates user has platform role
- [ ] Login with `audience: 'customer'` works for non-platform users

**Post-completion:**
- [ ] Document what was changed
- [ ] Update memory with JWT audience pattern

---

### P0-02: Delete SuperAdminGuard (JWT-only)

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §5 (SuperAdminGuard Cleanup) |
| **Effort** | 0.5 days |
| **Dependencies** | None |
| **Risk** | S-02 (privilege escalation via forged JWT) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §5
- [ ] Read `08-security-validation.md` §2.3 (privilege escalation vectors)
- [ ] Read `apps/backend/src/common/auth/super-admin.guard.ts`
- [ ] Read `apps/backend/src/common/auth/super-admin-db.guard.ts`
- [ ] Search for all imports of `SuperAdminGuard` (not `SuperAdminDbGuard`)

**Implementation tasks:**
- [ ] `grep -r "SuperAdminGuard" apps/backend/src/ --include="*.ts"` — find all references
- [ ] Replace all `SuperAdminGuard` imports with `SuperAdminDbGuard`
- [ ] Replace all `@UseGuards(..., SuperAdminGuard)` with `SuperAdminDbGuard`
- [ ] Delete `apps/backend/src/common/auth/super-admin.guard.ts`
- [ ] Verify `SuperAdminDbGuard` is registered as provider in all modules that use it
- [ ] Run existing tests — all should pass

**Verification:**
- [ ] `grep -r "SuperAdminGuard" apps/backend/src/` returns 0 results (excluding `SuperAdminDbGuard`)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] All routes that used `SuperAdminGuard` now use `SuperAdminDbGuard`

---

### P0-03: Fix WebSocket Tenant Isolation

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §4 (WebSocket Tenant Isolation Fix) |
| **Effort** | 1 day |
| **Dependencies** | P0-01 (needs `aud` field in JWT) |
| **Risk** | S-01 (CRITICAL — any user can subscribe to any workspace) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §4
- [ ] Read `08-security-validation.md` §9 (tenant isolation)
- [ ] Read `apps/backend/src/domains/realtime/realtime.gateway.ts` — full file
- [ ] Identify `handleDashboardSubscribe()` handler
- [ ] Identify `handleConnection()` handler

**Implementation tasks:**
- [ ] Add workspace membership check in `handleDashboardSubscribe()`
- [ ] Platform staff (aud=platform) can subscribe to any workspace
- [ ] Customer users (aud=customer) must have membership in workspaceId
- [ ] Query `WorkspaceMembership` for ownership verification
- [ ] Add audience validation in `handleConnection()` for dashboard connections
- [ ] Write integration test: customer user cannot subscribe to non-member workspace
- [ ] Write integration test: platform staff can subscribe to any workspace
- [ ] Write integration test: customer user can subscribe to member workspace

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Non-member subscription returns `WsException`
- [ ] Platform staff subscription succeeds for any workspace
- [ ] Member subscription succeeds

---

### P0-04: Create PlatformSettings Table

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §6 (PlatformSettings Table) |
| **Effort** | 1.5 days |
| **Dependencies** | None |
| **Risk** | O-01 (file-based settings lost on redeploy) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §6
- [ ] Read `prisma-schema-target.md` §1.1 (PlatformSettings model)
- [ ] Read `06-database-validation.md` §3 (missing models)
- [ ] Read current `admin-runtime.store.ts` — identify all settings keys
- [ ] Read `apps/backend/src/domains/admin/admin.service.ts` — find settings usage

**Implementation tasks:**
- [ ] Add `PlatformSettings` model to `schema.prisma`
- [ ] Create Prisma migration: `npx prisma migrate dev --name add_platform_settings`
- [ ] Create `platform-settings.service.ts` with get/set/getAllByCategory + caching
- [ ] Create `platform-settings.module.ts`
- [ ] Seed initial settings (12 keys per spec §6.3)
- [ ] Update `AdminService` to use `PlatformSettingsService` instead of file-based store
- [ ] Import `PlatformSettingsModule` in `AdminModule`
- [ ] Write unit tests for `PlatformSettingsService` (get, set, cache, invalidate)
- [ ] Write integration test: settings persist across service restarts

**Verification:**
- [ ] `npx prisma migrate dev` succeeds
- [ ] `SELECT COUNT(*) FROM "PlatformSettings"` returns 12
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Settings are read from DB, not file
- [ ] Cache works (second read is faster)
- [ ] Settings survive container restart

---

### P0-05: Create ExchangeToken Table

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §7 (ExchangeToken Table) |
| **Effort** | 1 day |
| **Dependencies** | P0-01 (needs audience for token minting) |
| **Risk** | D-08 (impersonation redesign) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §7
- [ ] Read `prisma-schema-target.md` §1.2 (ExchangeToken model)
- [ ] Read `api-contracts.md` §2.8 and §2.9 (exchange endpoints)
- [ ] Read `08-security-validation.md` §3 (impersonation security)
- [ ] Read current `auth.service.ts` `issueImpersonation()` and `exitImpersonation()`

**Implementation tasks:**
- [ ] Add `ExchangeToken` model to `schema.prisma`
- [ ] Create Prisma migration
- [ ] Create `exchange-token.service.ts` with create/redeem/validate methods
- [ ] Create `dto/exchange-token.dto.ts` with DTOs
- [ ] Add `POST /auth/exchange` endpoint to `AuthController`
- [ ] Add `POST /auth/exchange/exit` endpoint to `AuthController`
- [ ] Add `POST /platform/impersonate` endpoint (replaces old impersonation)
- [ ] Keep old `issueImpersonation()` temporarily (backward compat)
- [ ] Write unit tests for token generation (64-char hex, SHA-256 hash)
- [ ] Write unit tests for token redemption (one-time use, TTL expiry)
- [ ] Write integration test: full impersonation flow (generate → redeem → exit)

**Verification:**
- [ ] `npx prisma migrate dev` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Exchange token is 64-char hex
- [ ] Token hash is SHA-256
- [ ] TTL is 60 seconds
- [ ] One-time use enforced (second redemption fails)
- [ ] Expired token rejected
- [ ] Exit impersonation clears customer cookies
- [ ] Audit log entries created for start and exit

---

### P0-06: Add Missing Database Indexes

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §12 (Missing Database Indexes) |
| **Effort** | 0.5 days |
| **Dependencies** | None |
| **Risk** | P-02 (performance at scale) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §12
- [ ] Read `prisma-schema-target.md` §4 (complete index additions)
- [ ] Read `06-database-validation.md` §4.2 (missing indexes)

**Implementation tasks:**
- [ ] Add `@@index` declarations to models in `schema.prisma`:
  - `Screen`: `@@index([workspaceId, status])`, `@@index([workspaceId, lastSeenAt])`
  - `Media`: `@@index([workspaceId, createdAt])`
  - `Playlist`: `@@index([workspaceId, isPublished])`
  - `Schedule`: `@@index([workspaceId, startDate])`
  - `Subscription`: `@@index([status, subscriptionEndDate])`
  - `WorkspaceMembership`: `@@index([userId])`
- [ ] Create migration with `CREATE INDEX CONCURRENTLY` SQL
- [ ] Verify indexes exist: `SELECT indexname FROM pg_indexes WHERE ...`

**Verification:**
- [ ] `npx prisma migrate dev` succeeds
- [ ] All 7 indexes exist in database
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes

---

### P0-07: Create packages/ui

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §8.1 (packages/ui) |
| **Effort** | 3 days |
| **Dependencies** | None |
| **Risk** | T-05 (breaks 100+ imports) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §8.1
- [ ] Read `05-frontend-validation.md` §8 (shared UI components)
- [ ] Read `03-dependency-graph.md` §6 (shared libraries)
- [ ] List all files in `apps/dashboard/src/components/ui/`
- [ ] List all files in `apps/dashboard/src/lib/utils.ts`
- [ ] Count import sites: `grep -r "@/components/ui/" apps/dashboard/src/ --include="*.ts" --include="*.tsx" | wc -l`

**Implementation tasks:**
- [ ] Create `packages/ui/package.json` (per spec §8.1.2)
- [ ] Create `packages/ui/tsconfig.json`
- [ ] Copy `lib/utils.ts` → `packages/ui/src/lib/utils.ts`
- [ ] Copy each component from `components/ui/*` → `packages/ui/src/*.tsx`
- [ ] Update internal imports in each component: `@/lib/utils` → `./lib/utils`
- [ ] Create `packages/ui/src/index.ts` with all re-exports
- [ ] Add `"@smart-screen/ui": "*"` to `apps/dashboard/package.json` dependencies
- [ ] Run `npm install` to link workspace package
- [ ] Update ALL imports in dashboard: `@/components/ui/button` → `@smart-screen/ui`
- [ ] Also extract: `language-switcher.tsx`, `page-transition.tsx`, `shell-logo.tsx`
- [ ] Run typecheck after each batch of import updates

**Verification:**
- [ ] `npm install` succeeds
- [ ] `npm run typecheck` passes (all apps)
- [ ] `npm run lint` passes
- [ ] `npm run build` passes (all apps)
- [ ] `grep -r "@/components/ui/" apps/dashboard/src/` returns 0 results
- [ ] All UI components render correctly in browser
- [ ] No duplicate component definitions

---

### P0-08: Create packages/config

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §8.2 (packages/config) |
| **Effort** | 1 day |
| **Dependencies** | None |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §8.2
- [ ] Read `tsconfig.base.json` at repo root
- [ ] Read `.prettierrc.json` at repo root
- [ ] Read `apps/dashboard/tailwind.config.ts` (or .js)
- [ ] Read `apps/backend/eslint.config.mjs`

**Implementation tasks:**
- [ ] Create `packages/config/package.json`
- [ ] Create `packages/config/tsconfig.json` (copy from `tsconfig.base.json`)
- [ ] Create `packages/config/tailwind.config.ts` (extract shared config)
- [ ] Create `packages/config/eslint.config.mjs` (extract shared rules)
- [ ] Create `packages/config/prettier.config.json` (copy from root)
- [ ] Update all apps to extend from `@smart-screen/config`
- [ ] Run `npm install`

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] All apps extend from shared config

---

### P0-09: Add ESLint Boundary Rules

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §9 (ESLint Boundary Rules) |
| **Effort** | 1 day |
| **Dependencies** | P0-07 (packages must exist first) |
| **Risk** | D-01 (no boundary enforcement) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §9
- [ ] Read `01-architectural-decisions.md` D-09 (ESLint boundaries)
- [ ] Read `03-dependency-graph.md` §3 (forbidden dependencies)
- [ ] Read current ESLint configs for all apps

**Implementation tasks:**
- [ ] Add `no-restricted-paths` rules to backend ESLint config
- [ ] Add `no-restricted-paths` rules to dashboard ESLint config
- [ ] Run `npm run lint` — document all violations
- [ ] Fix violations that can be fixed immediately
- [ ] Add `eslint-disable` comments for violations that will be resolved in Phase 1 (with TODO comments referencing Phase 1)
- [ ] Verify CI pipeline runs ESLint

**Verification:**
- [ ] `npm run lint` passes (or violations are documented with TODOs)
- [ ] Boundary rules are active
- [ ] New cross-imports are prevented

---

### P0-10: Redis Caching for RolesGuard

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §10 (Redis Caching for RolesGuard) |
| **Effort** | 1 day |
| **Dependencies** | None |
| **Risk** | P-01 (3+ DB queries per request) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §10
- [ ] Read `04-backend-validation.md` §5.3 (RolesGuard performance)
- [ ] Read `apps/backend/src/common/auth/roles.guard.ts` — full file
- [ ] Read `apps/backend/src/common/auth/account-context.helper.ts` (or equivalent)
- [ ] Identify all places where user roles/memberships change

**Implementation tasks:**
- [ ] Add Redis caching to `AccountContextHelper.resolveForWorkspace()`
- [ ] Cache key: `account-context:${userId}:${workspaceId}`
- [ ] TTL: 60 seconds
- [ ] Add `invalidateUserContext(userId)` method
- [ ] Call `invalidateUserContext()` in:
  - `WorkspacesService.updateMemberRole()`
  - `WorkspacesService.removeMember()`
  - `WorkspacesService.acceptInvitation()`
  - `AdminService.updateUser()` (suspension/activation)
- [ ] Write unit tests for cache hit/miss
- [ ] Write integration test: role change invalidates cache

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Cache hit returns cached data (no DB query)
- [ ] Cache miss queries DB and caches result
- [ ] Role change invalidates cache for that user
- [ ] TTL is 60 seconds

---

### P0-11: Database Backup Script

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Section** | §11 (Database Backups) |
| **Effort** | 0.5 days |
| **Dependencies** | None |
| **Risk** | O-02 (CRITICAL — no automated backups) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §11
- [ ] Read `11-risk-validation.md` O-02

**Implementation tasks:**
- [ ] Create `scripts/backup-database.sh`
- [ ] Test backup script locally
- [ ] Document restore procedure
- [ ] Add cron job documentation to README or ops docs

**Verification:**
- [ ] Backup script runs successfully
- [ ] Backup file is created
- [ ] Restore procedure is documented
- [ ] Script handles errors gracefully (set -euo pipefail)

---

### P0-12: Secret Rotation Documentation

| Attribute | Value |
|---|---|
| **Priority** | RECOMMENDED |
| **Spec Section** | §13 (Secret Rotation) |
| **Effort** | 0.5 days |
| **Dependencies** | None |

**Implementation tasks:**
- [ ] Create `docs/ops/secret-rotation.md` with procedures from spec §13
- [ ] Document dual-secret rotation for zero-downtime JWT rotation
- [ ] Document rotation for each secret type

---

### P0-13: Dual-Cookie Strategy

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §3 (Dual-Cookie Strategy) |
| **Effort** | 2 days |
| **Dependencies** | P0-01 (needs audience to determine cookie name) |
| **Risk** | F-03 (single cookie for platform and customer) |

**Pre-implementation checklist:**
- [ ] Read `phase-0-specification.md` §3
- [ ] Read `08-security-validation.md` §4 (cookie strategy)
- [ ] Read `apps/backend/src/domains/auth/auth.service.ts` — `setAuthCookies()` and `clearAuthCookies()`
- [ ] Read `apps/backend/src/common/csrf/csrf.middleware.ts`
- [ ] Read `apps/backend/src/domains/auth/csrf.controller.ts`

**Implementation tasks:**
- [ ] Implement `getCookieNames(audience)` method in `AuthService`
- [ ] Update `setAuthCookies()` to use audience-aware cookie names
- [ ] Update `clearAuthCookies()` to clear both old and new cookie names
- [ ] Update `JwtStrategy` to extract from both old and new cookie names
- [ ] Update `CsrfMiddleware` to check both old and new CSRF cookie names
- [ ] Update `CsrfController` to return appropriate CSRF token
- [ ] Use `__Host-` prefix in production
- [ ] Write unit tests for cookie name resolution
- [ ] Write integration test: platform login sets platform cookies
- [ ] Write integration test: customer login sets customer cookies
- [ ] Write integration test: old cookies still accepted (backward compat)

**Verification:**
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` passes
- [ ] Platform login sets `__Host-cs_platform_access` cookie
- [ ] Customer login sets `__Host-cs_customer_access` cookie
- [ ] Old `cs_access_token` cookie still accepted
- [ ] CSRF middleware accepts both old and new CSRF cookies
- [ ] `__Host-` prefix used in production

---

### P0-14: Phase 0 Final Verification

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Section** | §14 (Verification Checklist) |
| **Effort** | 0.5 days |
| **Dependencies** | All P0 tasks |

**Checklist (ALL must pass):**
- [ ] `npm run verify` passes (typecheck + lint + test:cov + i18n:check + build)
- [ ] Every item in spec §14 verification checklist is checked
- [ ] No `forwardRef` was introduced
- [ ] No new circular dependencies
- [ ] All new files have proper imports at top
- [ ] All tests pass with zero errors
- [ ] Documentation updated with what was done
- [ ] Memory updated with patterns and conventions

---

## Phase 1: Backend Restructuring

> **Spec:** `docs/platform-v2/review/04-backend-validation.md`
> **Estimated:** 3 weeks
> **Prerequisite:** Phase 0 is 100% complete

### P1-01: Resolve Auth ↔ Workspaces Circular Dependency

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `03-dependency-graph.md` CIRCULAR-01 |
| **Effort** | 3 days |
| **Dependencies** | P0-01 |

**Protocol:**
1. Read `03-dependency-graph.md` §2 (CIRCULAR-01)
2. Read `04-backend-validation.md` §2.1
3. Read `auth.service.ts` and `workspaces.service.ts` — identify all cross-injections
4. Create `WorkspaceResolverService` in shared module
5. Move workspace list building from `AuthService` to `WorkspaceResolverService`
6. Move user creation from `WorkspacesService` to a shared service
7. Remove `forwardRef` from `AuthModule` and `WorkspacesModule`
8. Test: `npm run verify`
9. Verify: no `forwardRef` in Auth or Workspaces modules
10. Document + update memory

### P1-02: Resolve Auth ↔ Realtime Circular Dependency

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `03-dependency-graph.md` CIRCULAR-02 |
| **Effort** | 1 day |
| **Dependencies** | P1-01 |

**Protocol:**
1. Read `03-dependency-graph.md` CIRCULAR-02
2. Extract `JwtModule` into `JwtInfraModule` in shared module
3. Both `AuthModule` and `RealtimeModule` import `JwtInfraModule`
4. Remove `forwardRef` from `RealtimeModule`
5. Test + verify + document

### P1-03: Split AuthService (1051 lines → 4 services)

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `03-dependency-graph.md` COUPLING-02 |
| **Effort** | 2 days |
| **Dependencies** | P1-01 |

**Protocol:**
1. Read `03-dependency-graph.md` COUPLING-02
2. Read full `auth.service.ts` — categorize every method
3. Split into:
   - `AuthCredentialsService` — login, register, password reset, 2FA
   - `AuthTokenService` — token issuance, refresh, session management
   - `AuthImpersonationService` — exchange token flow (from P0-05)
   - `AuthProfileService` — `me` endpoint, profile building
4. Update `AuthModule` providers and exports
5. Update all controllers that inject `AuthService`
6. Test + verify + document

### P1-04: Split WorkspacesService (1226 lines → 4 services)

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `03-dependency-graph.md` COUPLING-01 |
| **Effort** | 2 days |
| **Dependencies** | P1-01 |

**Protocol:**
1. Read `03-dependency-graph.md` COUPLING-01
2. Read full `workspaces.service.ts` — categorize every method
3. Split into:
   - `WorkspaceCrudService` — pure CRUD
   - `WorkspaceInvitationService` — invitations + email
   - `WorkspaceBootstrapService` — demo content creation
   - `WorkspaceMembershipService` — member management
4. Update `WorkspacesModule` providers and exports
5. Update all controllers and services that inject `WorkspacesService`
6. Test + verify + document

### P1-05: Split AdminModule into 5 Platform Modules

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `02-repository-impact.md` (admin row) |
| **Effort** | 3 days |
| **Dependencies** | P1-01, P1-03, P1-04 |

**Protocol:**
1. Read `02-repository-impact.md` admin row
2. Read full `admin.controller.ts` and `admin.service.ts`
3. Split into:
   - `PlatformTenantModule` — customer/workspace management
   - `PlatformStaffModule` — staff CRUD
   - `PlatformSettingsModule` — settings (uses P0-04)
   - `PlatformAnalyticsModule` — stats/dashboard
   - `PlatformSecurityModule` — audit log, impersonation
4. Move routes to `/platform/*` prefix
5. Keep old `/admin/*` routes as aliases (dual routing)
6. Test + verify + document

### P1-06: Add Route Prefixes with Dual Routing

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `07-api-validation.md` §3 (namespace mapping) |
| **Effort** | 2 days |
| **Dependencies** | P1-05 |

**Protocol:**
1. Read `07-api-validation.md` §3.1 (namespace mapping table)
2. Read `api-contracts.md` §8 (route migration mapping)
3. Update every controller with dual path: `@Controller({ path: ['admin/customers', 'platform/customers'] })`
4. Add `/customer/` prefix to all customer controllers (same dual pattern)
5. Move Stripe webhook to `/internal/webhooks/stripe`
6. Move health/ready to `/public/health`, `/public/ready`
7. Move metrics to `/internal/metrics` with auth
8. Test: both old and new routes work
9. Verify: all endpoints in api-contracts.md §8 mapping table work on both paths
10. Document + update memory

### P1-07: Create AudienceGuard and Apply to Routes

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `phase-0-specification.md` §2 |
| **Effort** | 1 day |
| **Dependencies** | P0-01, P1-06 |

**Protocol:**
1. Read `phase-0-specification.md` §2 (AudienceGuard)
2. Create `audience.guard.ts` with `@RequireAudience()` decorator
3. Create `PlatformRouteGuard` composite guard
4. Create `CustomerRouteGuard` composite guard
5. Apply `@RequireAudience('platform')` to all platform controllers
6. Apply `@RequireAudience('customer')` to all customer controllers
7. Test: customer token rejected on platform route
8. Test: platform token rejected on customer route
9. Verify + document

### P1-08: Add Cursor-Based Pagination to All List Endpoints

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `07-api-validation.md` §4, `api-contracts.md` §10 |
| **Effort** | 5 days |
| **Dependencies** | None |

**Protocol:**
1. Read `07-api-validation.md` §4 (pagination analysis)
2. Read `api-contracts.md` §10 (pagination format)
3. Create shared pagination utility (encode/decode cursor)
4. Add pagination to EVERY list endpoint:
   - Platform: customers, staff, workspaces, fleet, audit-log, users
   - Customer: screens, media, playlists, canvases, schedules, campaigns, notifications, audit-log, api-keys, webhooks, members
5. Update response shapes to `{ items, nextCursor, hasMore }`
6. Write tests for each paginated endpoint
7. Verify: all list endpoints return paginated response
8. Document + update memory

### P1-09: Add API Response DTOs

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `07-api-validation.md` §6 (output serialization) |
| **Effort** | 3 days |
| **Dependencies** | P1-08 |

**Protocol:**
1. Read `07-api-validation.md` §6
2. Create response DTOs for every endpoint (per api-contracts.md shapes)
3. Use `ClassSerializerInterceptor` or manual mapping
4. Ensure no internal fields (hashes, internal IDs) leak
5. Test: response shapes match api-contracts.md exactly
6. Verify + document

### P1-10: Add Prisma Middleware for Tenant Isolation

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `01-architectural-decisions.md` D-05 |
| **Effort** | 2 days |
| **Dependencies** | None |

**Protocol:**
1. Read `01-architectural-decisions.md` D-05
2. Read `06-database-validation.md` §3.3 (soft delete) and §9.1 (tenant isolation)
3. Implement Prisma middleware for:
   - Auto-filter `deletedAt IS NULL` on soft-delete models
   - Auto-inject `workspaceId` on create operations
4. Audit all `$queryRaw` and `$executeRaw` calls
5. Test: soft-deleted records don't appear in queries
6. Test: raw queries are documented and safe
7. Verify + document

### P1-11: Increase DB Connection Pool + Add PgBouncer

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `06-database-validation.md` §7.2 |
| **Effort** | 1 day |
| **Dependencies** | None |

**Protocol:**
1. Read `06-database-validation.md` §7.2
2. Update `DATABASE_POOL_MAX` default to 25 in docker-compose.yml
3. Add PgBouncer service to docker-compose.yml
4. Update `DATABASE_URL` to point through PgBouncer
5. Test: connection pool handles concurrent requests
6. Verify + document

### P1-12: Implement Storage Quota Enforcement

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `04-backend-validation.md` §10.2 |
| **Effort** | 1 day |
| **Dependencies** | None |

**Protocol:**
1. Read `04-backend-validation.md` §10.2
2. Read `api-contracts.md` §4.3 (media upload with quota check)
3. Add storage quota check in `MediaService.upload()`
4. Return 413 with `STORAGE_QUOTA_EXCEEDED` when over limit
5. Add `storageUsed` and `storageLimit` to media list response
6. Test: upload fails when quota exceeded
7. Verify + document

### P1-13: Add 2FA Requirement for Privilege Escalation

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `08-security-validation.md` §2.3 |
| **Effort** | 1 day |
| **Dependencies** | P0-01 |

**Protocol:**
1. Read `08-security-validation.md` §2.3
2. Add 2FA check to `PATCH /platform/staff/:id/role`
3. Add 2FA check to `PATCH /platform/customers/:id` (when changing isActive)
4. Return 403 with `2FA_REQUIRED` code if 2FA not enabled
5. Test: privilege escalation fails without 2FA
6. Verify + document

### P1-14: Split Subscriptions, Webhooks, Workspaces Modules

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `04-backend-validation.md` §14 |
| **Effort** | 4 days |
| **Dependencies** | P1-05 |

**Protocol:**
1. Read `04-backend-validation.md` §14 (bounded context assignment)
2. Split `SubscriptionsModule` → customer + platform
3. Split `WebhooksModule` → customer + internal (Stripe)
4. Split `WorkspacesModule` → customer + platform tenant management
5. Update all imports and controllers
6. Test + verify + document

### P1-15: Phase 1 Final Verification

- [ ] `npm run verify` passes
- [ ] No `forwardRef` in any module
- [ ] All routes have `/platform/` or `/customer/` prefix (dual routing)
- [ ] All list endpoints are paginated
- [ ] All responses use DTOs
- [ ] Prisma middleware active
- [ ] Storage quotas enforced
- [ ] 2FA required for privilege escalation
- [ ] Documentation updated
- [ ] Memory updated

---

## Phase 2: Frontend Split

> **Spec:** `docs/platform-v2/review/05-frontend-validation.md`
> **Estimated:** 3 weeks
> **Prerequisite:** Phase 1 is 100% complete

### P2-01: Split CrystalShell

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `05-frontend-validation.md` §6, §3 |
| **Effort** | 2 days |
| **Dependencies** | P0-07 (packages/ui) |

**Protocol:**
1. Read `05-frontend-validation.md` §6 (layouts) and §3 (navigation)
2. Read `apps/dashboard/src/components/crystal-shell.tsx` — full 169 lines
3. Create `ControlPanelShell` — platform-only shell (no WorkspaceGate, no workspace context)
4. Create `CustomerShell` — customer-only shell (no sovereign mode, no admin nav)
5. Extract shared shell logic into a hook or utility
6. Update `(shell)/layout.tsx` to use `CustomerShell`
7. Test: customer shell renders without admin code
8. Verify: no `sovereign` or `isSuperAdmin` references in `CustomerShell`
9. Document + update memory

### P2-02: Split ShellSidebar

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `05-frontend-validation.md` §3.1 |
| **Effort** | 1 day |
| **Dependencies** | P2-01 |

**Protocol:**
1. Read `apps/dashboard/src/components/layout/shell-sidebar.tsx` — full 553 lines
2. Create `ControlPanelSidebar` — platform nav only (Dashboard, Customers, Staff, etc.)
3. Create `CustomerSidebar` — customer nav only (Overview, Screens, Content, etc.)
4. Remove `sovereign` mode logic entirely from both
5. Move `hrefFor()` and `sovereignLinkActive()` to respective sidebars
6. Test + verify + document

### P2-03: Create Control Panel App

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `05-frontend-validation.md` §2.2 |
| **Effort** | 2 days |
| **Dependencies** | P2-01, P2-02 |

**Protocol:**
1. Read `05-frontend-validation.md` §2.2 (control panel pages)
2. Read `api-contracts.md` §3 (platform endpoints)
3. Create `apps/control-panel/` with Next.js app structure
4. Copy base layout, i18n config, tailwind config
5. Set up `ControlPanelShell` as the shell layout
6. Set up platform auth (login page, server-side auth check)
7. Add to root `package.json` workspaces
8. Add to `npm run dev` script
9. Add to CI pipeline
10. Test: app starts and renders login page
11. Verify + document

### P2-04: Move Admin Feature Files

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `05-frontend-validation.md` §7.2 |
| **Effort** | 1 day |
| **Dependencies** | P2-03 |

**Protocol:**
1. Read `05-frontend-validation.md` §7.2 (19 admin files listed)
2. Move all 19 files from `apps/dashboard/src/features/admin/` to `apps/control-panel/src/features/`
3. Update all imports within moved files
4. Remove `features/admin/` from dashboard
5. Test: dashboard builds without admin features
6. Test: control panel builds with admin features
7. Verify: `grep -r "features/admin" apps/dashboard/src/` returns 0 results
8. Document + update memory

### P2-05: Move Admin Routes

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `05-frontend-validation.md` §2.2 |
| **Effort** | 1 day |
| **Dependencies** | P2-04 |

**Protocol:**
1. Move all 15 admin routes from `apps/dashboard/src/app/[locale]/(shell)/admin/` to `apps/control-panel/src/app/[locale]/`
2. Update route paths (remove `/admin/` prefix — Control Panel root is the admin)
3. Add redirect from old `/admin/*` routes to `admin.smartscreen.com/*`
4. Test: old routes redirect
5. Test: new routes render
6. Verify + document

### P2-06: Implement Exchange Token Impersonation Flow

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `phase-0-specification.md` §7, `api-contracts.md` §2.8-2.9 |
| **Effort** | 3 days |
| **Dependencies** | P0-05, P2-03, P2-05 |

**Protocol:**
1. Read `phase-0-specification.md` §7.3 (flow) and §7.5 (exit flow)
2. Read `api-contracts.md` §2.8 (exchange) and §2.9 (exit)
3. In Control Panel: implement "Impersonate" button → calls `POST /platform/impersonate` → redirects to customer app
4. In Customer App: implement `GET /auth/exchange?token=...` page → calls `POST /auth/exchange` → sets cookies → navigates to dashboard
5. In Customer App: implement impersonation bar with "Exit" button → calls `POST /auth/exchange/exit` → clears cookies → redirects to Control Panel
6. Test: full impersonation flow works end-to-end
7. Test: exit impersonation returns to Control Panel
8. Verify + document

### P2-07: Update Frontend API Calls for New Routes

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `api-contracts.md` §8 (route mapping) |
| **Effort** | 2 days |
| **Dependencies** | P1-06 |

**Protocol:**
1. Read `api-contracts.md` §8 (old → new route mapping)
2. Update all API calls in dashboard to use `/customer/*` prefix
3. Update all API calls in control panel to use `/platform/*` prefix
4. Use environment variable for API base URL
5. Test: all API calls work on new routes
6. Verify: `grep -r "/api/v1/admin/" apps/` returns 0 results
7. Verify: `grep -r "/api/v1/screens/" apps/` returns 0 results (should be `/customer/screens/`)
8. Document + update memory

### P2-08: Add Audience Tracking to Auth State

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `05-frontend-validation.md` §4.1 |
| **Effort** | 1 day |
| **Dependencies** | P0-01 |

**Protocol:**
1. Read `05-frontend-validation.md` §4.1
2. Update `fetchAuthMeServer()` to return `audience` field
3. Update auth session type to include `audience`
4. Use audience to determine routing (platform → Control Panel, customer → dashboard)
5. Test: platform user redirected to Control Panel
6. Test: customer user redirected to dashboard
7. Verify + document

### P2-09: Create packages/api-ts

| Attribute | Value |
|---|---|
| **Priority** | RECOMMENDED |
| **Spec Ref** | `05-frontend-validation.md` §9.2 |
| **Effort** | 2 days |
| **Dependencies** | P1-09 (DTOs exist) |

**Protocol:**
1. Create `packages/api-ts/` with shared TypeScript types
2. Export all response types from API contracts
3. Export all error codes
4. Export pagination types
5. Use in both frontend apps
6. Test + verify + document

### P2-10: Phase 2 Final Verification

- [ ] `npm run verify` passes for ALL apps (dashboard, control-panel, player, marketing)
- [ ] No admin code in dashboard bundle
- [ ] No customer code in control panel bundle
- [ ] Impersonation flow works end-to-end
- [ ] All API calls use new route prefixes
- [ ] Audience tracking works
- [ ] Documentation updated
- [ ] Memory updated

---

## Phase 3: Feature Migration

> **Spec:** `docs/platform-v2/implementation/prisma-schema-target.md`
> **Estimated:** 6 weeks
> **Prerequisite:** Phase 2 is 100% complete

### P3-01: Split User Table (HIGHEST RISK)

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `prisma-schema-target.md` §2.1, `06-database-validation.md` D-01 |
| **Effort** | 10 days |
| **Dependencies** | P1-01, P1-03 |
| **Risk** | T-01 (CRITICAL — data loss) |

**Protocol:**
1. Read `prisma-schema-target.md` §2.1 (User split)
2. Read `06-database-validation.md` D-01
3. Read `10-migration-validation.md` §2.2 (User table split migration)
4. Read `11-risk-validation.md` T-01 (risk mitigation)
5. **Create `PlatformUser` and `CustomerUser` tables**
6. **Copy data:** platform staff → PlatformUser, customers → CustomerUser
7. **Update all foreign keys** that reference `User.id`
8. **Dual-write:** new code writes to both old and new tables
9. **Gradual read migration:** update services one by one
10. **Test in staging** with production data copy
11. **Verify data integrity:** row counts match
12. **Stop writing to User table**
13. **After verification period:** drop User table
14. Every step: test + verify + document

### P3-02: Create Plan Table + Migrate from Enum

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `prisma-schema-target.md` §1.3 |
| **Effort** | 3 days |
| **Dependencies** | None |

### P3-03: Create Invoice Table + Generation

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `prisma-schema-target.md` §1.4, `api-contracts.md` §4.5 |
| **Effort** | 5 days |
| **Dependencies** | P3-02 |

### P3-04: Create UsageRecord Table + Tracking

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `prisma-schema-target.md` §1.5, `api-contracts.md` §4.4 |
| **Effort** | 5 days |
| **Dependencies** | None |

### P3-05: Implement P0 Audit Events (14 events)

| Attribute | Value |
|---|---|
| **Priority** | BLOCKING |
| **Spec Ref** | `08-security-validation.md` §11.3 |
| **Effort** | 3 days |
| **Dependencies** | None |

**Protocol:**
1. Read `08-security-validation.md` §11.3 (required audit events table)
2. Implement audit logging for ALL 14 events:
   - `IMPERSONATION_START`, `STAFF_LOGIN`, `STAFF_ROLE_CHANGE`
   - `USER_SUSPEND`, `USER_ACTIVATE`
   - `WORKSPACE_CREATE`, `WORKSPACE_DELETE`
   - `SUBSCRIPTION_CHANGE`, `FEATURE_FLAG_CHANGE`
   - `PLATFORM_SETTINGS_CHANGE`
   - `API_KEY_CREATE`, `API_KEY_REVOKE`
   - `WEBHOOK_CREATE`, `WEBHOOK_DELETE`
3. Use `PlatformStaffAudit` table for platform events
4. Use `AuditLog` for customer events
5. Test: every privileged action creates audit entry
6. Verify: all 14 events are logged
7. Document + update memory

### P3-06: Add Soft Delete to Critical Models

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `prisma-schema-target.md` §2.2-2.5 |
| **Effort** | 2 days |
| **Dependencies** | P1-10 (Prisma middleware) |

### P3-07: Add QuotaGuard

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `phase-0-specification.md` §2.4 |
| **Effort** | 2 days |
| **Dependencies** | P3-02 (Plan table), P3-04 (UsageRecord) |

### P3-08: Add FeatureGuard

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `04-backend-validation.md` §3.2 |
| **Effort** | 1 day |
| **Dependencies** | None |

### P3-09: Implement GDPR Endpoints

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `08-security-validation.md` §12.1 |
| **Effort** | 4 days |
| **Dependencies** | None |

### P3-10: Move Sessions to Redis

| Attribute | Value |
|---|---|
| **Priority** | RECOMMENDED |
| **Spec Ref** | `01-architectural-decisions.md` D-06 |
| **Effort** | 2 days |
| **Dependencies** | None |

### P3-11: Add Audit Log Hash Chain

| Attribute | Value |
|---|---|
| **Priority** | RECOMMENDED |
| **Spec Ref** | `06-database-validation.md` §6.1 |
| **Effort** | 2 days |
| **Dependencies** | P3-05 |

### P3-12: Add Per-Session Revocation

| Attribute | Value |
|---|---|
| **Priority** | RECOMMENDED |
| **Spec Ref** | `08-security-validation.md` §1.3 |
| **Effort** | 2 days |
| **Dependencies** | P3-10 |

### P3-13: Add Deployment-Level Feature Flags

| Attribute | Value |
|---|---|
| **Priority** | REQUIRED |
| **Spec Ref** | `10-migration-validation.md` §3.3 |
| **Effort** | 1 day |
| **Dependencies** | None |

### P3-14: Phase 3 Final Verification

- [ ] `npm run verify` passes
- [ ] User table split complete (data integrity verified)
- [ ] All 14 audit events logged
- [ ] Soft delete active on critical models
- [ ] QuotaGuard enforces plan limits
- [ ] FeatureGuard checks feature flags
- [ ] GDPR endpoints functional
- [ ] Documentation updated
- [ ] Memory updated

---

## Phase 4: Cleanup

> **Estimated:** 2 weeks
> **Prerequisite:** Phase 3 is 100% complete

### P4-01: Remove Old Route Prefixes
- Remove all old route aliases (keep only `/platform/*`, `/customer/*`)
- Test: old routes return 404
- Verify + document

### P4-02: Remove Old Cookie Names
- Remove backward compat for `cs_access_token`, `cs_refresh_token`, `csrf_token`
- Test: old cookies ignored
- Verify + document

### P4-03: Remove forwardRef from All Modules
- Verify no `forwardRef` remains
- Test + verify + document

### P4-04: Remove File-Based Settings Store
- Delete `admin-runtime.store.ts`
- Test + verify + document

### P4-05: Remove Duplicate Endpoints
- Remove `/admin/screens` (duplicate of `/platform/fleet/screens`)
- Consolidate `/displays` and `/screens` if duplicate
- Test + verify + document

### P4-06: Add OpenAPI/Swagger Documentation
- Generate API docs from NestJS
- Verify matches api-contracts.md
- Document

### P4-07: Create Operational Runbooks
- DB down, Redis down, API down, WS down
- Deployment procedure
- Rollback procedure
- Secret rotation procedure

### P4-08: Add E2E Tests
- Playwright tests for critical flows
- Login, create workspace, upload media, create playlist, schedule, deploy to screen
- Platform: login, view customers, impersonate, exit

### P4-09: Add Security Scanning to CI
- `npm audit` in CI
- Snyk or similar
- Verify + document

### P4-10: Phase 4 Final Verification

- [ ] `npm run verify` passes
- [ ] No old routes, old cookies, or forwardRef
- [ ] OpenAPI docs generated
- [ ] Runbooks created
- [ ] E2E tests pass
- [ ] Security scanning active
- [ ] Final documentation complete
- [ ] Memory updated

---

## Summary

| Phase | Duration | Tasks | Blocking | Required | Recommended |
|---|---|---|---|---|---|
| Phase 0 | 2 weeks | 14 | 7 | 5 | 2 |
| Phase 1 | 3 weeks | 15 | 3 | 11 | 0 |
| Phase 2 | 3 weeks | 10 | 5 | 3 | 2 |
| Phase 3 | 6 weeks | 14 | 2 | 8 | 4 |
| Phase 4 | 2 weeks | 10 | 0 | 5 | 5 |
| **Total** | **16 weeks** | **63** | **17** | **32** | **13** |

## Strict Rules

1. **NO task is marked complete until 100% doc compliance**
2. **EVERY task follows the 7-step protocol** (read → analyze → implement → test → verify → document → memory)
3. **NO skipping steps** — if test fails, fix before proceeding
4. **NO phase starts before previous phase is 100% complete**
5. **EVERY deviation from spec must be justified and documented**
6. **`npm run verify` must pass after EVERY task**
7. **Memory must be updated after EVERY completed task**
