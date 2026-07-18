# 07 — Technical Debt Register

> **Date:** 2025-07-18  
> **Method:** Source code review against `19-technical-debt.md` (pre-Phase 1 audit) + Phase 1 changes  
> **Scope:** All backend code, Prisma schema, Docker, testing

---

## Summary

| Category | Count |
|----------|-------|
| Architecture | 6 |
| Infrastructure | 3 |
| Security | 3 |
| Performance | 2 |
| Testing | 4 |
| Documentation | 2 |
| **Total** | **20** |

---

## Architecture Debt (6)

### TD-001

| Field | Value |
|-------|-------|
| **Debt ID** | TD-001 |
| **Description** | Circular dependency: Auth ↔ Workspaces via `forwardRef` |
| **Architecture** | `auth.module.ts:18` imports `forwardRef(() => WorkspacesModule)`, `workspaces.module.ts:13` imports `forwardRef(() => AuthModule)`. `auth.service.ts:95` injects `forwardRef(() => WorkspacesService)`. |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | Negligible — NestJS resolves at bootstrap |
| **Testing** | Makes unit test module setup more complex |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — extract invitation service to break cycle |
| **Estimated Cost** | 2-3 days |
| **Risk** | Low — `forwardRef` works, but refactoring risk if not careful |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 or later |
| **Owner** | Backend Team |
| **Dependencies** | None |

### TD-002

| Field | Value |
|-------|-------|
| **Debt ID** | TD-002 |
| **Description** | `workspaceId` passed as query parameter in all controllers |
| **Architecture** | All controllers use `@Query('workspaceId')` — 30+ endpoints. Security anti-pattern: workspace ID in URLs/logs. |
| **Infrastructure** | N/A |
| **Security** | Workspace ID leaks in access logs, browser history, referer headers |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` as "Large — requires API v2" |
| **Complexity** | Large — breaking API change, requires frontend updates |
| **Estimated Cost** | 5-7 days |
| **Risk** | High — breaking change |
| **Priority** | P2 Medium |
| **Recommended Phase** | API v2 (post-Phase 2) |
| **Owner** | Backend + Frontend |
| **Dependencies** | Frontend API client update |

### TD-003

| Field | Value |
|-------|-------|
| **Debt ID** | TD-003 |
| **Description** | `recurrence` stored as String, not enum |
| **Architecture** | `Schedule.recurrence` and `ScreenOverrideRule.recurrence` are `String` with defaults. No DB-level validation. |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Small — Prisma migration to enum |
| **Estimated Cost** | 0.5 days |
| **Risk** | Low — additive change |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | Prisma migration |

### TD-004

| Field | Value |
|-------|-------|
| **Debt ID** | TD-004 |
| **Description** | `startTime`/`endTime` stored as String, not Time type |
| **Architecture** | `Schedule.startTime`, `Schedule.endTime`, `ScreenOverrideRule.startTime`, `ScreenOverrideRule.endTime` are `String` (HH:mm format). No DB validation. |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — requires timezone support design |
| **Estimated Cost** | 2-3 days |
| **Risk** | Medium — data migration for existing records |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 5 (Scheduling) |
| **Owner** | Backend Team |
| **Dependencies** | Timezone support design |

### TD-005

| Field | Value |
|-------|-------|
| **Debt ID** | TD-005 |
| **Description** | `AuthService` is 1,027 lines |
| **Architecture** | Single service handles login, register, refresh, 2FA, password reset, dev login, OAuth. Violates single responsibility. |
| **Infrastructure** | N/A |
| **Security** | Large surface area for security bugs |
| **Performance** | N/A |
| **Testing** | Hard to test — 1,027 lines, many branches |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — decompose into 3-4 services |
| **Estimated Cost** | 3-4 days |
| **Risk** | Medium — must preserve all auth flows |
| **Priority** | P2 Medium |
| **Recommended Phase** | Phase 2 (Security Hardening) |
| **Owner** | Backend Team |
| **Dependencies** | None |

### TD-006

| Field | Value |
|-------|-------|
| **Debt ID** | TD-006 |
| **Description** | No serialization layer — Prisma models returned directly |
| **Architecture** | Controllers return Prisma model objects directly. No DTO/interceptor for response shaping. |
| **Infrastructure** | N/A |
| **Security** | Potential field leakage (e.g., internal IDs, hashes) |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — add `ClassSerializerInterceptor` + response DTOs |
| **Estimated Cost** | 3-5 days |
| **Risk** | Medium — may break frontend if response shapes change |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | Frontend response shape verification |

---

## Infrastructure Debt (3)

### TD-007

| Field | Value |
|-------|-------|
| **Debt ID** | TD-007 |
| **Description** | No structured JSON logging |
| **Architecture** | `AppLogger` uses `console.log(JSON.stringify(...))` in production mode. NestJS `Logger` used elsewhere. |
| **Infrastructure** | No log aggregation (ELK, Datadog, CloudWatch) integration |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `21-production-readiness.md` |
| **Complexity** | Medium — choose logger (Pino/Winston), configure transport |
| **Estimated Cost** | 2-3 days |
| **Risk** | Low — additive change |
| **Priority** | P2 Medium |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | None |

### TD-008

| Field | Value |
|-------|-------|
| **Debt ID** | TD-008 |
| **Description** | No Docker multi-stage build |
| **Architecture** | `Dockerfile.backend` is single-stage — includes dev dependencies, source maps |
| **Infrastructure** | Larger image, slower deployments |
| **Security** | Dev tools in production image |
| **Performance** | Slower cold starts |
| **Testing** | N/A |
| **Documentation** | Noted in `21-production-readiness.md` |
| **Complexity** | Small — rewrite Dockerfile with builder + runner stages |
| **Estimated Cost** | 0.5 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | DevOps |
| **Dependencies** | None |

### TD-009

| Field | Value |
|-------|-------|
| **Debt ID** | TD-009 |
| **Description** | No request ID middleware for log correlation |
| **Architecture** | `AppLogger` supports request context via `requestContext.getStore()` but no middleware sets request ID |
| **Infrastructure** | Can't correlate logs across services |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Small — add `RequestContextMiddleware` |
| **Estimated Cost** | 0.5 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | TD-007 (structured logging) |

---

## Security Debt (3)

### TD-010

| Field | Value |
|-------|-------|
| **Debt ID** | TD-010 |
| **Description** | Shared `PLAYER_HEARTBEAT_SECRET` fallback (see KI-017) |
| **Architecture** | `realtime.gateway.ts:264`, `player.service.ts:55` — shared secret fallback for legacy screens |
| **Infrastructure** | N/A |
| **Security** | Shared secret is known to all screen instances. If leaked, any screen can impersonate any other. |
| **Performance** | N/A |
| **Testing** | Integration test `pairing-to-bootstrap.integration.spec.ts` covers fallback |
| **Documentation** | Noted in `19-technical-debt.md` as P0 |
| **Complexity** | Medium — force re-pairing migration for all legacy screens |
| **Estimated Cost** | 2-3 days + operational coordination |
| **Risk** | Medium — re-pairing all deployed screens |
| **Priority** | P2 Medium |
| **Recommended Phase** | Phase 2 (Security Hardening) |
| **Owner** | Backend Team |
| **Dependencies** | KI-017 |

### TD-011

| Field | Value |
|-------|-------|
| **Debt ID** | TD-011 |
| **Description** | `DevLoginController` in production codebase (see KI-018) |
| **Architecture** | `dev-login.controller.ts` — conditionally registered, excluded in production |
| **Infrastructure** | N/A |
| **Security** | Risk if `ENABLE_DEV_LOGIN=true` accidentally set in production |
| **Performance** | N/A |
| **Testing** | `dev-login.controller.spec.ts` verifies conditional registration |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Small — remove or move to dev-only module |
| **Estimated Cost** | 0.5 days |
| **Risk** | Low |
| **Priority** | P2 Medium |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | KI-018 |

### TD-012

| Field | Value |
|-------|-------|
| **Debt ID** | TD-012 |
| **Description** | No secret rotation strategy |
| **Architecture** | JWT secrets set once via env vars, never rotated |
| **Infrastructure** | N/A |
| **Security** | Compromised secret requires full restart + invalidation of all tokens |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `21-production-readiness.md` |
| **Complexity** | Medium — implement dual-secret rotation support |
| **Estimated Cost** | 2-3 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | None |

---

## Performance Debt (2)

### TD-013

| Field | Value |
|-------|-------|
| **Debt ID** | TD-013 |
| **Description** | No caching layer (Redis cache) |
| **Architecture** | Redis installed (Phase 1) but only used for throttler + WS adapter. No query caching, no response caching. |
| **Infrastructure** | Redis available but cache not utilized |
| **Security** | N/A |
| **Performance** | Repeated DB queries for frequently accessed data (workspace, screen, playlist) |
| **Testing** | N/A |
| **Documentation** | Noted in `21-production-readiness.md` |
| **Complexity** | Medium — add `CacheModule` with Redis store |
| **Estimated Cost** | 2-3 days |
| **Risk** | Low — additive |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 6 (Performance) |
| **Owner** | Backend Team |
| **Dependencies** | None |

### TD-014

| Field | Value |
|-------|-------|
| **Debt ID** | TD-014 |
| **Description** | No metrics endpoint for Prometheus |
| **Architecture** | `MetricsMiddleware` collects request durations but no `/metrics` endpoint for scraping |
| **Infrastructure** | No Grafana dashboards |
| **Security** | N/A |
| **Performance** | Can't monitor performance trends |
| **Testing** | N/A |
| **Documentation** | Noted in `21-production-readiness.md` |
| **Complexity** | Small — add `prom-client` + `/metrics` endpoint |
| **Estimated Cost** | 1-2 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 9 (Monitoring) |
| **Owner** | Backend Team |
| **Dependencies** | None |

---

## Testing Debt (4)

### TD-015

| Field | Value |
|-------|-------|
| **Debt ID** | TD-015 |
| **Description** | 6 failing test suites (24 tests) — all pre-existing |
| **Architecture** | N/A |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | See KI-008 through KI-013 for details. Root cause: `AccountContextHelper` constructor addition + mock data issues + integration test setup. |
| **Documentation** | Documented in `04-test-validation.md` |
| **Complexity** | Small — update spec constructors and mock data |
| **Estimated Cost** | 1-2 days |
| **Risk** | Low |
| **Priority** | P2 Medium |
| **Recommended Phase** | Phase 2 (early) |
| **Owner** | Backend Team |
| **Dependencies** | KI-008, KI-009, KI-010, KI-011, KI-012, KI-013 |

### TD-016

| Field | Value |
|-------|-------|
| **Debt ID** | TD-016 |
| **Description** | No integration tests with real database |
| **Architecture** | All tests use mock Prisma. No Testcontainers or real PostgreSQL. |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | Prisma queries unvalidated. Race conditions undetectable. |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — set up Testcontainers or use Docker Compose DB |
| **Estimated Cost** | 3-5 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | None |

### TD-017

| Field | Value |
|-------|-------|
| **Debt ID** | TD-017 |
| **Description** | No E2E tests |
| **Architecture** | No end-to-end business flow tests (auth → create workspace → pair screen → push content) |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | Business flows unvalidated |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Large — requires running app + DB + Redis |
| **Estimated Cost** | 5-7 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 or later |
| **Owner** | Backend Team |
| **Dependencies** | TD-016 |

### TD-018

| Field | Value |
|-------|-------|
| **Debt ID** | TD-018 |
| **Description** | No coverage threshold configured |
| **Architecture** | `jest.config.js` has no `coverageThreshold` setting |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | Coverage can decrease silently |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Small — add config |
| **Estimated Cost** | 0.5 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 |
| **Owner** | Backend Team |
| **Dependencies** | None |

---

## Documentation Debt (2)

### TD-019

| Field | Value |
|-------|-------|
| **Debt ID** | TD-019 |
| **Description** | Env var naming mismatch between plan and implementation (see KI-006) |
| **Architecture** | N/A |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | `27-backend-implementation-plan.md` uses `DATABASE_CONNECTION_LIMIT`, code uses `DATABASE_POOL_MAX` |
| **Complexity** | Trivial — update plan document |
| **Estimated Cost** | 0.5 hours |
| **Risk** | None |
| **Priority** | P3 Low |
| **Recommended Phase** | Immediate documentation fix |
| **Owner** | Backend Team |
| **Dependencies** | KI-006 |

### TD-020

| Field | Value |
|-------|-------|
| **Debt ID** | TD-020 |
| **Description** | Empty shared packages (`packages/ui/`, `packages/config/`) |
| **Architecture** | Monorepo has empty `packages/ui/` and `packages/config/` with only `.gitkeep` |
| **Infrastructure** | N/A |
| **Security** | N/A |
| **Performance** | N/A |
| **Testing** | N/A |
| **Documentation** | Noted in `19-technical-debt.md` |
| **Complexity** | Medium — extract shared types and UI components |
| **Estimated Cost** | 3-5 days |
| **Risk** | Low |
| **Priority** | P3 Low |
| **Recommended Phase** | Phase 2 or later |
| **Owner** | Full Stack Team |
| **Dependencies** | None |

---

## Cross-Reference

| Category | IDs | Count |
|----------|-----|-------|
| Architecture | TD-001, TD-002, TD-003, TD-004, TD-005, TD-006 | 6 |
| Infrastructure | TD-007, TD-008, TD-009 | 3 |
| Security | TD-010, TD-011, TD-012 | 3 |
| Performance | TD-013, TD-014 | 2 |
| Testing | TD-015, TD-016, TD-017, TD-018 | 4 |
| Documentation | TD-019, TD-020 | 2 |
| **Total** | | **20** |
