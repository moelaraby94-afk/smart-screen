# 06 — Known Issues Baseline

> **Date:** 2025-07-18  
> **Method:** Source code review + test execution + git blame verification  
> **Scope:** All backend source code (`apps/backend/src/`) + Prisma schema + Docker Compose

---

## Summary

| Category | Count |
|----------|-------|
| Accepted | 2 |
| Deferred | 5 |
| Pre-existing | 8 |
| Won't Fix | 1 |
| Must Fix Later | 4 |
| **Total** | **20** |

---

## Accepted (2)

### KI-001

| Field | Value |
|-------|-------|
| **ID** | KI-001 |
| **Title** | Static asset serving made conditional instead of removed |
| **Description** | Plan (DoD #9) says remove `app.useStaticAssets()` entirely. Code makes it conditional on `MEDIA_STORAGE_PROVIDER === 'local'`. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/main.ts:101-120` |
| **Root Cause** | Deliberate design decision — removing entirely breaks local development |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Accepted |
| **Impact** | Local dev serves files; S3 mode skips static middleware |
| **Production Impact** | None — S3 mode never registers static middleware |
| **Temporary Mitigation** | N/A — behavior is correct for both modes |
| **Planned Fix Phase** | N/A — accepted deviation |
| **Owner** | Backend Team |
| **Notes** | Update plan document to match implementation. |

### KI-002

| Field | Value |
|-------|-------|
| **ID** | KI-002 |
| **Title** | `/health` endpoint path instead of `/live` |
| **Description** | Plan (DoD #14) specifies `/live` for liveness. Code uses `/health`. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/common/health/health.controller.ts:16` |
| **Root Cause** | Deliberate naming choice — `/health` is more conventional |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Accepted |
| **Impact** | K8s/Docker probes must use `/health` instead of `/live` |
| **Production Impact** | None — probes are configurable |
| **Temporary Mitigation** | Configure K8s/Docker probes for `/health` |
| **Planned Fix Phase** | Phase 2 — add `/live` alias if needed |
| **Owner** | Backend Team |
| **Notes** | Both paths excluded from global API prefix at `main.ts:123`. |

---

## Deferred (5)

### KI-003

| Field | Value |
|-------|-------|
| **ID** | KI-003 |
| **Title** | Docker Compose Redis has no password |
| **Description** | `docker-compose.yml` Redis service runs without `requirepass`. |
| **Severity** | P2 Medium |
| **Priority** | Medium |
| **Affected Files** | `docker-compose.yml:29` |
| **Root Cause** | Simplified local development configuration |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Deferred |
| **Impact** | Redis is accessible without auth on the Docker network |
| **Production Impact** | Critical if Redis port exposed externally. Safe on internal Docker network. |
| **Temporary Mitigation** | Don't expose Redis port in production. Use `REDIS_URL=redis://:password@host:6379` |
| **Planned Fix Phase** | Phase 2 — add `requirepass` via env var |
| **Owner** | DevOps |
| **Notes** | `REDIS_URL` supports password in connection string. |

### KI-004

| Field | Value |
|-------|-------|
| **ID** | KI-004 |
| **Title** | No manual verification documented |
| **Description** | DoD #22 requires manual SIGTERM, health, media upload, rate limit verification. Not performed. |
| **Severity** | P2 Medium |
| **Priority** | Medium |
| **Affected Files** | N/A |
| **Root Cause** | No deployment environment available for manual testing |
| **First Introduced** | Phase 1 closure |
| **Current Status** | Deferred |
| **Impact** | Unknown runtime behavior under SIGTERM, health check failures |
| **Production Impact** | Risk of unexpected behavior during first deploy |
| **Temporary Mitigation** | Test on staging before production deploy |
| **Planned Fix Phase** | Pre-deploy |
| **Owner** | DevOps + Backend |
| **Notes** | See `05-phase2-entry-checklist.md` §3. |

### KI-005

| Field | Value |
|-------|-------|
| **ID** | KI-005 |
| **Title** | MinIO not in backend `depends_on` in Docker Compose |
| **Description** | MinIO service defined but not listed in backend's `depends_on`. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `docker-compose.yml:64-68` |
| **Root Cause** | MinIO only needed when `MEDIA_STORAGE_PROVIDER=s3`; default is `local` |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Deferred |
| **Impact** | Backend may start before MinIO is ready when using S3 provider |
| **Production Impact** | Low — S3StorageService constructor doesn't connect, lazy connection on first operation |
| **Temporary Mitigation** | Set `MEDIA_STORAGE_PROVIDER=local` (default) or add MinIO to `depends_on` manually |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | DevOps |
| **Notes** | S3 client initialization is lazy — no connection at startup. |

### KI-006

| Field | Value |
|-------|-------|
| **ID** | KI-006 |
| **Title** | Env var naming mismatch: `DATABASE_POOL_MAX` vs plan's `DATABASE_CONNECTION_LIMIT` |
| **Description** | Plan specifies `DATABASE_CONNECTION_LIMIT`, code uses `DATABASE_POOL_MAX`. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/common/prisma/prisma.service.ts:29`, `.env.example:115` |
| **Root Cause** | Implementation chose clearer naming |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Deferred |
| **Impact** | Documentation mismatch |
| **Production Impact** | None |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Documentation update |
| **Owner** | Backend Team |
| **Notes** | Update `27-backend-implementation-plan.md` to match. |

### KI-007

| Field | Value |
|-------|-------|
| **ID** | KI-007 |
| **Title** | `maxRetriesPerRequest: 3` may be too aggressive for background jobs |
| **Description** | Redis client configured with `maxRetriesPerRequest: 3`. BullMQ workers need `null` (infinite retries). |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/common/redis/redis.service.ts:39` |
| **Root Cause** | Default Redis client config optimized for web requests, not queue workers |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Deferred |
| **Impact** | Future queue workers may fail under Redis reconnects |
| **Production Impact** | None currently — no queue workers implemented |
| **Temporary Mitigation** | N/A — no queues yet |
| **Planned Fix Phase** | Phase 4 (Queues) — create separate Redis client for workers |
| **Owner** | Backend Team |
| **Notes** | Official ioredis docs: set `maxRetriesPerRequest: null` for BullMQ. |

---

## Pre-existing (8)

### KI-008

| Field | Value |
|-------|-------|
| **ID** | KI-008 |
| **Title** | `roles.guard.spec.ts` — missing `AccountContextHelper` constructor arg |
| **Description** | `RolesGuard` constructor requires 3 args (added `AccountContextHelper`). Spec passes only 2. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/common/auth/roles.guard.spec.ts:82,98,119,136,151,161,177` |
| **Root Cause** | `AccountContextHelper` added to `RolesGuard` constructor but spec not updated |
| **First Introduced** | Commit `354f0c8` (account-level playlist & media management) — pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 7 TypeScript errors, 7 test failures |
| **Production Impact** | None — spec-only issue, production code is correct |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Verified via `git log --oneline -3 -- src/common/auth/roles.guard.ts` |

### KI-009

| Field | Value |
|-------|-------|
| **ID** | KI-009 |
| **Title** | `playlists.service.spec.ts` — missing `AccountContextHelper` constructor arg |
| **Description** | `PlaylistsService` constructor requires 6 args (added `AccountContextHelper`). Spec passes 5. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/domains/playlists/playlists.service.spec.ts:346,360`, `apps/backend/src/domains/playlists/playlists.p2-t1.spec.ts:351` |
| **Root Cause** | Same as KI-008 — `AccountContextHelper` addition |
| **First Introduced** | Commit `354f0c8` — pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 3 TypeScript errors, 5 test failures |
| **Production Impact** | None — spec-only issue |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Same root cause as KI-008. |

### KI-010

| Field | Value |
|-------|-------|
| **ID** | KI-010 |
| **Title** | `scheduling.service.spec.ts` — mock data missing `workspaceId` |
| **Description** | `SchedulingService.resolveEffectivePlaylistId` fails because `screen.workspaceId` is undefined in mock. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/domains/schedules/scheduling.service.spec.ts` |
| **Root Cause** | Mock data incomplete — screen object missing `workspaceId` field |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 7 test failures |
| **Production Impact** | None — spec-only issue |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Not related to Phase 1 changes. |

### KI-011

| Field | Value |
|-------|-------|
| **ID** | KI-011 |
| **Title** | `claim-pairing-session-security.spec.ts` — `app.close()` fails |
| **Description** | Integration test fails during `app.close()` — `Cannot read properties of undefined (reading 'close')`. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/domains/workspaces/claim-pairing-session-security.spec.ts:193` |
| **Root Cause** | NestJS TestingModule setup issue — app not properly initialized |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 2 test failures |
| **Production Impact** | None — spec-only issue |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Integration test requires database — may need Testcontainers. |

### KI-012

| Field | Value |
|-------|-------|
| **ID** | KI-012 |
| **Title** | `request-body-validation.spec.ts` — `POST /media/folders` returns non-201 |
| **Description** | Test expects 201 but gets different status. Validation pipe configuration issue. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/common/validation/request-body-validation.spec.ts:87` |
| **Root Cause** | Validation pipe or controller behavior mismatch |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 1 test failure |
| **Production Impact** | None — spec-only issue |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Not related to Phase 1 changes. |

### KI-013

| Field | Value |
|-------|-------|
| **ID** | KI-013 |
| **Title** | `pairing-to-bootstrap.integration.spec.ts` — `app.close()` fails |
| **Description** | Same as KI-011 — integration test module setup issue. |
| **Severity** | P3 Low |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/domains/pairing/pairing-to-bootstrap.integration.spec.ts:395` |
| **Root Cause** | NestJS TestingModule setup issue |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 6 test failures |
| **Production Impact** | None — spec-only issue |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Same root cause as KI-011. |

### KI-014

| Field | Value |
|-------|-------|
| **ID** | KI-014 |
| **Title** | `create-override-rule.dto.ts` — unused imports |
| **Description** | `ArrayMinSize` and `MaxLength` imported but never used. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/domains/screens/dto/create-override-rule.dto.ts:3,13` |
| **Root Cause** | Leftover imports from refactoring |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 2 ESLint errors |
| **Production Impact** | None |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Trivial fix — remove unused imports. |

### KI-015

| Field | Value |
|-------|-------|
| **ID** | KI-015 |
| **Title** | `playlists.service.ts:103` — unsafe argument warning |
| **Description** | `buildPage(serialized as any, ...)` — `as any` cast triggers `no-unsafe-argument` warning. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/domains/playlists/playlists.service.ts:103` |
| **Root Cause** | Type assertion to `any` to satisfy `buildPage` generic |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Pre-existing |
| **Impact** | 1 ESLint warning |
| **Production Impact** | None |
| **Temporary Mitigation** | N/A |
| **Planned Fix Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Notes** | Fix by properly typing `buildPage` or the serialized output. |

---

## Won't Fix (1)

### KI-016

| Field | Value |
|-------|-------|
| **ID** | KI-016 |
| **Title** | `health.service.ts` uses `existsSync` from `fs` directly |
| **Description** | Health check for local storage uses `fs.existsSync()` directly instead of through storage abstraction. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/src/common/health/health.service.ts:2,67` |
| **Root Cause** | Health check is a system-level concern, not a media operation |
| **First Introduced** | Phase 1 implementation |
| **Current Status** | Won't Fix |
| **Impact** | Minor abstraction leak in health check only |
| **Production Impact** | None |
| **Temporary Mitigation** | N/A — acceptable for health checks |
| **Planned Fix Phase** | N/A |
| **Owner** | Backend Team |
| **Notes** | Health checks are infrastructure concerns. Using `fs.existsSync` for a local directory existence check is appropriate. |

---

## Must Fix Later (4)

### KI-017

| Field | Value |
|-------|-------|
| **ID** | KI-017 |
| **Title** | Shared `PLAYER_HEARTBEAT_SECRET` fallback for legacy screens |
| **Description** | Screens created before pairing v2 have no `pairingSecretHash` and fall back to shared `PLAYER_HEARTBEAT_SECRET`. |
| **Severity** | P2 Medium |
| **Priority** | High |
| **Affected Files** | `apps/backend/src/domains/realtime/realtime.gateway.ts:246-274`, `apps/backend/src/domains/player/player.service.ts:30-67` |
| **Root Cause** | Backward compatibility for pre-pairing-v2 screens |
| **First Introduced** | Pairing v2 implementation (pre-Phase 1) |
| **Current Status** | Must Fix Later |
| **Impact** | Shared secret is a security risk if leaked |
| **Production Impact** | Medium — all screens must be re-paired to retire fallback |
| **Temporary Mitigation** | Warning logged on every fallback use. `assertProductionSecretsAreSet` rejects dev placeholder. |
| **Planned Fix Phase** | Phase 2 (Security Hardening) — force re-pairing migration |
| **Owner** | Backend Team |
| **Notes** | Both `realtime.gateway.ts` and `player.service.ts` log warnings on fallback use. |

### KI-018

| Field | Value |
|-------|-------|
| **ID** | KI-018 |
| **Title** | `DevLoginController` in production codebase |
| **Description** | Dev-only controller exists in source. Conditionally registered (excluded in production unless `ENABLE_DEV_LOGIN=true`). |
| **Severity** | P2 Medium |
| **Priority** | Medium |
| **Affected Files** | `apps/backend/src/domains/auth/dev-login.controller.ts`, `apps/backend/src/domains/auth/auth.module.ts:12,34-36` |
| **Root Cause** | Development convenience feature |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Must Fix Later |
| **Impact** | Potential security risk if `ENABLE_DEV_LOGIN` is accidentally set to `true` in production |
| **Production Impact** | Low — controller is excluded from production module unless explicitly enabled |
| **Temporary Mitigation** | `ENABLE_DEV_LOGIN` defaults to off. Production secret assertion checks env. |
| **Planned Fix Phase** | Phase 2 — remove or move to separate dev-only module |
| **Owner** | Backend Team |
| **Notes** | Route is entirely absent from production build unless flag is set. |

### KI-019

| Field | Value |
|-------|-------|
| **ID** | KI-019 |
| **Title** | `WorkspacePairingCode` deprecated Prisma model |
| **Description** | Prisma schema contains deprecated `WorkspacePairingCode` model. Marked "Deprecated" in schema comment. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/prisma/schema.prisma:806-810` |
| **Root Cause** | Legacy table kept for DB compatibility |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Must Fix Later |
| **Impact** | Schema confusion, unused model |
| **Production Impact** | None — table exists but never queried |
| **Temporary Mitigation** | N/A — harmless |
| **Planned Fix Phase** | Phase 2 — remove in next migration |
| **Owner** | Backend Team |
| **Notes** | Schema comment: "Deprecated: legacy table kept for DB compatibility." |

### KI-020

| Field | Value |
|-------|-------|
| **ID** | KI-020 |
| **Title** | `PaymentRecord` Prisma model defined but never written to |
| **Description** | `PaymentRecord` model exists in schema but no service code creates records. |
| **Severity** | P3 Low |
| **Priority** | Low |
| **Affected Files** | `apps/backend/prisma/schema.prisma:293` |
| **Root Cause** | Incomplete implementation — billing webhook creates records via mock in tests only |
| **First Introduced** | Pre-Phase 1 |
| **Current Status** | Must Fix Later |
| **Impact** | No payment history persisted in production |
| **Production Impact** | Medium — billing audit trail incomplete |
| **Temporary Mitigation** | Stripe webhook logs events |
| **Planned Fix Phase** | Phase 3 (Billing) — implement `PaymentRecord` creation in webhook handler |
| **Owner** | Backend Team |
| **Notes** | Test `stripe-webhook.t3-4.spec.ts` mocks `paymentRecord.create` but production code doesn't call it. |

---

## Cross-Reference

| Category | IDs | Count |
|----------|-----|-------|
| Accepted | KI-001, KI-002 | 2 |
| Deferred | KI-003, KI-004, KI-005, KI-006, KI-007 | 5 |
| Pre-existing | KI-008, KI-009, KI-010, KI-011, KI-012, KI-013, KI-014, KI-015 | 8 |
| Won't Fix | KI-016 | 1 |
| Must Fix Later | KI-017, KI-018, KI-019, KI-020 | 4 |
| **Total** | | **20** |
