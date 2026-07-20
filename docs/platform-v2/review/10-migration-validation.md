# 10 — Migration Validation

> **Phase 10:** Zero-downtime simulation, feature flags, rollback, database migration, route migration, frontend migration, deployment, CI/CD, backward compatibility

---

## 1. Migration Strategy Overview

The blueprint proposes a phased migration with feature flags and rollback capability. This review validates that strategy against the actual repository state.

### Proposed Phases (from Blueprint)
1. Phase 0: Foundation (JWT audience, route namespacing, shared packages)
2. Phase 1: Backend split (platform/customer module separation)
3. Phase 2: Frontend split (extract Control Panel app)
4. Phase 3: Feature migration (new features per blueprint)
5. Phase 4: Cleanup (remove old routes, old code)

---

## 2. Zero-Downtime Feasibility Analysis

### 2.1 Database Migrations

| Migration | Downtime? | Mechanism | Risk |
|---|---|---|---|
| Add `aud` claim to JWT | **No downtime** — additive | New field in token, old tokens still work | Low — old tokens expire in 15min |
| Add `PlatformSettings` table | **No downtime** — new table | `prisma migrate deploy` | Low |
| Split `User` into `PlatformUser` + `CustomerUser` | **HIGH RISK** — data migration | Requires copying data, updating all references | **Critical** — see §2.2 |
| Add `Plan` table | **No downtime** — new table | `prisma migrate deploy` | Low |
| Add `ExchangeToken` table | **No downtime** — new table | `prisma migrate deploy` | Low |
| Add soft delete (`deletedAt`) columns | **No downtime** — additive | `ALTER TABLE ADD COLUMN` | Low |
| Add missing indexes | **Brief lock** — `CREATE INDEX CONCURRENTLY` | PostgreSQL concurrent index creation | Low — use `CONCURRENTLY` |

### 2.2 User Table Split — Critical Migration

**Current:** Single `User` table with 30+ fields serving both platform staff and customers.

**Target:** `PlatformUser` + `CustomerUser` tables.

**Migration Steps:**
1. Create `PlatformUser` table with platform-specific fields
2. Create `CustomerUser` table with customer-specific fields
3. Copy platform staff records from `User` to `PlatformUser`
4. Copy customer records from `User` to `CustomerUser`
5. Update all foreign keys that reference `User.id`
6. Update `AuthService`, `JwtStrategy`, all services that query `User`
7. Drop `User` table (after verification)

**Risk:** Steps 3-6 require coordinated changes. If any service still queries `User` after the table is dropped, it crashes.

**Zero-downtime approach:**
1. Phase A: Create new tables, keep `User` table (dual-write)
2. Phase B: Migrate reads to new tables (gradual rollout)
3. Phase C: Stop writing to `User` table
4. Phase D: Drop `User` table

**Estimated time:** 2-3 weeks for safe migration.

### 2.3 Route Migration

| Step | Downtime? | Mechanism |
|---|---|---|
| Add new route prefixes (`/platform/*`, `/customer/*`) | **No downtime** — additive | New controllers alongside old ones |
| Update frontend to use new routes | **No downtime** — gradual | Feature flag per route |
| Remove old routes | **No downtime** — after verification | Remove old controllers after all clients use new routes |

**Approach:** Dual-routing during migration. Both `/api/v1/admin/*` and `/api/v1/platform/*` resolve to the same handler. Frontend updates route-by-route with feature flags.

### 2.4 Frontend App Split

| Step | Downtime? | Mechanism |
|---|---|---|
| Create shared packages (`packages/ui`, `packages/config`) | **No downtime** — new packages | Extract components, update imports |
| Create `apps/control-panel/` | **No downtime** — new app | New Next.js app, deployed alongside dashboard |
| Move admin routes to Control Panel | **No downtime** — gradual | Route-by-route with redirect from old to new |
| Remove admin routes from dashboard | **No downtime** — after verification | Remove after all traffic goes to Control Panel |

**Risk:** Shared component extraction may break imports if not done carefully. Must verify all import paths after extraction.

---

## 3. Feature Flag Strategy

### 3.1 Current State

`FeatureFlag` model exists at `@/apps/backend/prisma/schema.prisma:1321-1349`:
- Per-workspace feature flags
- `module` field: billing, api_keys, webhooks, analytics, campaigns, ai, emergency, proof_of_play, templates
- `enabled` boolean
- `setBy`: super_admin or system

`FeatureFlagsService` and `FeatureFlagsController` exist in `onboarding/` module.

### 3.2 Assessment

✅ **Good infrastructure exists.** Feature flags are per-workspace, not per-deployment. This is correct for SaaS — different customers can have different features enabled.

### 3.3 Missing: Deployment-Level Feature Flags

The current `FeatureFlag` model is per-workspace. For migration, we need **deployment-level** feature flags (e.g., `ENABLE_NEW_AUTH_FLOW`, `ENABLE_ROUTE_NAMESPACING`).

**Recommendation:** Use environment variables for deployment-level flags:
```env
ENABLE_JWT_AUDIENCE=false
ENABLE_ROUTE_NAMESPACING=false
ENABLE_CONTROL_PANEL=false
ENABLE_DUAL_ROUTING=true
```

### 3.4 Feature Flag Rollout Plan

| Flag | Phase | Default | Rollout |
|---|---|---|---|
| `ENABLE_JWT_AUDIENCE` | Phase 0 | `false` | Enable on staging → production. Old tokens still work (no `aud` = accepted). |
| `ENABLE_ROUTE_NAMESPACING` | Phase 1 | `false` | Enable per-route. Dual routing active. |
| `ENABLE_CONTROL_PANEL` | Phase 2 | `false` | Enable for super admin first → all platform staff. |
| `ENABLE_EXCHANGE_TOKEN` | Phase 2 | `false` | Enable alongside Control Panel. |
| `ENABLE_USER_TABLE_SPLIT` | Phase 3 | `false` | Enable after data migration is complete. |

---

## 4. Rollback Strategy

### 4.1 Database Rollback

| Migration Type | Rollback Mechanism | Risk |
|---|---|---|
| Additive (new table, new column) | `prisma migrate resolve --rolled-back` | Low — just drop new table/column |
| Data migration (User split) | Keep `User` table during migration | Low — fallback to old table |
| Index addition | `DROP INDEX` | Low |
| Schema change (column rename) | **Cannot rollback** without data loss | **High** — avoid renames, use new columns instead |

**Rule:** Every database migration must have a tested rollback script.

### 4.2 Application Rollback

| Component | Rollback Mechanism | Risk |
|---|---|---|
| Backend | Docker image rollback to previous version | Low — keep previous image tagged |
| Frontend | Vercel/Netlify instant rollback | Low |
| Feature flags | Set flag to `false` | Low — instant |
| Route changes | Disable new routes, old routes still active | Low — dual routing |

### 4.3 Rollback Testing

**Required:** Before each phase, test rollback in staging:
1. Deploy new version
2. Verify functionality
3. Trigger rollback
4. Verify old version works
5. Verify no data corruption

---

## 5. CI/CD Pipeline

### 5.1 Current Pipeline

**File:** `.github/workflows/ci.yml`

| Step | Current | Assessment |
|---|---|---|
| Lint | ✅ `npm run lint` | Good |
| Typecheck | ✅ `npm run typecheck` | Good |
| Test | ✅ `npm run test:cov` | Good |
| Build | ✅ `npm run build` | Good |
| i18n check | ✅ `npm run i18n:check` | Good |
| Deploy | ⚠️ Manual `docker compose up --build` | **Should be automated** |

### 5.2 Required CI/CD Improvements

| Improvement | Priority | Detail |
|---|---|---|
| Add `apps/control-panel` to CI | **P0** | New app needs lint, typecheck, test, build |
| Add Prisma migration check | **P1** | Verify migrations are valid before deploy |
| Add ESLint boundary rules to CI | **P1** | Enforce module boundaries |
| Add security scan (npm audit) | **P2** | Vulnerability scanning |
| Add bundle size check | **P2** | Prevent bundle bloat |
| Automated deployment | **P1** | Deploy on merge to main (staging) |
| E2E tests | **P2** | Playwright tests for critical flows |

### 5.3 Deployment Strategy

**Current:** Single Docker Compose with all services.

**Target:** 
- Staging: Docker Compose on staging server
- Production: Docker Compose with health checks (current approach is fine for now)
- Future: Kubernetes (blueprint correctly defers this)

**Blue-green deployment:** Not currently supported. Docker Compose doesn't natively support blue-green. For zero-downtime, need:
1. Start new container on different port
2. Health check new container
3. Update reverse proxy to point to new container
4. Stop old container

---

## 6. Backward Compatibility

### 6.1 API Backward Compatibility

| Change | Backward Compatible? | Mechanism |
|---|---|---|
| New route prefixes | ✅ Yes — dual routing | Old routes remain, new routes added |
| JWT audience claim | ✅ Yes — old tokens accepted | `aud` absent = accepted, `aud` present = validated |
| New response fields | ✅ Yes — additive | Old clients ignore new fields |
| Removed response fields | ❌ No — breaking | Must version or keep field |
| Changed error codes | ❌ No — breaking | Must keep old codes |

### 6.2 Frontend Backward Compatibility

| Change | Backward Compatible? | Mechanism |
|---|---|---|
| Shared package extraction | ✅ Yes — same components, different import path | Build-time resolution |
| App split | ✅ Yes — old app redirects to new app | HTTP 302 redirect from `/admin/*` to `admin.cloudsignage.com/*` |
| New cookie names | ❌ No — requires re-login | Must support old cookie name during transition |

### 6.3 Database Backward Compatibility

| Change | Backward Compatible? | Mechanism |
|---|---|---|
| New tables | ✅ Yes — additive | Old code ignores new tables |
| New columns | ✅ Yes — additive | Old code ignores new columns |
| User table split | ❌ No — requires code update | Dual-write during transition |
| Removed columns | ❌ No — breaking | Never remove during migration |

---

## 7. Migration Phase Validation

### Phase 0: Foundation

| Step | Feasible? | Risk | Estimated Time |
|---|---|---|---|
| Add JWT audience claim | ✅ | Low (additive) | 2 days |
| Create shared packages | ✅ | Medium (import changes) | 3 days |
| Add ESLint boundary rules | ✅ | Low | 1 day |
| Add `PlatformSettings` table | ✅ | Low | 1 day |
| Add `ExchangeToken` table | ✅ | Low | 1 day |
| Add missing indexes | ✅ | Low (`CONCURRENTLY`) | 1 day |
| **Phase 0 total** | | | **~2 weeks** |

### Phase 1: Backend Split

| Step | Feasible? | Risk | Estimated Time |
|---|---|---|---|
| Resolve circular dependencies | ✅ | Medium (refactoring) | 3 days |
| Split AdminModule into 5 modules | ✅ | Medium | 3 days |
| Add route prefixes (dual routing) | ✅ | Low (additive) | 2 days |
| Add AudienceGuard | ✅ | Low | 1 day |
| Split AuthService | ✅ | Medium | 2 days |
| Split WorkspacesService | ✅ | Medium | 2 days |
| Add Prisma tenant middleware | ✅ | Medium | 2 days |
| **Phase 1 total** | | | **~3 weeks** |

### Phase 2: Frontend Split

| Step | Feasible? | Risk | Estimated Time |
|---|---|---|---|
| Extract UI components to packages/ui | ✅ | Medium (100+ imports) | 3 days |
| Split CrystalShell | ✅ | High (core component) | 2 days |
| Split ShellSidebar | ✅ | Medium | 1 day |
| Create Control Panel app | ✅ | Medium | 2 days |
| Move 19 admin feature files | ✅ | Low (file moves) | 1 day |
| Move 15 admin routes | ✅ | Low (route moves) | 1 day |
| Update API calls for new routes | ✅ | Medium (many calls) | 2 days |
| Implement exchange token impersonation | ✅ | High (new flow) | 3 days |
| **Phase 2 total** | | | **~3 weeks** |

### Phase 3: Feature Migration

| Step | Feasible? | Risk | Estimated Time |
|---|---|---|---|
| User table split | ✅ | **High** (data migration) | 2 weeks |
| Plan table + dynamic plans | ✅ | Low | 3 days |
| Invoice generation | ✅ | Medium | 1 week |
| Usage tracking | ✅ | Medium | 1 week |
| Audit log expansion | ✅ | Low | 3 days |
| Pagination on all endpoints | ✅ | Medium | 1 week |
| Soft delete on critical models | ✅ | Low | 3 days |
| **Phase 3 total** | | | **~6 weeks** |

### Phase 4: Cleanup

| Step | Feasible? | Risk | Estimated Time |
|---|---|---|---|
| Remove old routes | ✅ | Low (after verification) | 1 day |
| Remove old cookie names | ✅ | Low (after transition) | 1 day |
| Remove `forwardRef` | ✅ | Low (after circular dep resolution) | 1 day |
| Remove `SuperAdminGuard` (JWT-only) | ✅ | Low | 1 hour |
| Remove file-based settings store | ✅ | Low | 1 day |
| **Phase 4 total** | | | **~1 week** |

---

## 8. Migration Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| User table split causes data loss | Low | Critical | Dual-write, backup before migration, test in staging |
| Circular dependency resolution breaks DI | Medium | High | Test thoroughly, use dependency injection testing |
| Frontend app split breaks imports | Medium | Medium | Verify all imports after extraction, use ESLint |
| JWT audience change invalidates all sessions | High | Medium | Deploy during low-traffic period, support old tokens |
| Route migration breaks frontend | Medium | High | Dual routing, feature flags, gradual rollout |
| WebSocket audience check breaks player connections | Medium | High | Test with real players before production |
| Cookie domain change requires re-login | High | Low | Expected behavior, communicate to users |
| Prisma middleware slows down queries | Low | Medium | Benchmark before/after, optimize if needed |

---

## 9. Migration Readiness Score

| Area | Score | Key Risk |
|---|---|---|
| Database Migration | 6/10 | User table split is high-risk |
| Route Migration | 7/10 | Dual routing makes it feasible |
| Frontend Migration | 5/10 | Shell split is complex, many imports |
| Feature Flags | 8/10 | Good infrastructure exists |
| Rollback Strategy | 7/10 | Dual routing enables rollback |
| CI/CD | 6/10 | Needs automation improvements |
| Backward Compatibility | 7/10 | Additive changes are safe |
| **Overall Migration** | **6.6/10** | **Feasible but requires careful sequencing** |
