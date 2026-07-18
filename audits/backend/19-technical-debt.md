# 19 — Technical Debt Audit

> **Objective:** Identify and catalog all technical debt: deprecated code, workarounds, incomplete implementations, architectural shortcuts, and maintenance burdens.

---

## 1. Current State

The backend has moderate technical debt. The core architecture is clean, but several areas have shortcuts, deprecated models, shared-secret fallbacks, and incomplete implementations that need to be addressed.

---

## 2. Technical Debt Inventory

### Deprecated / Unused Code

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| `WorkspacePairingCode` model | `prisma/schema.prisma` | Confusion, unused model in schema | Small — remove in next migration |
| `PaymentRecord` model (partial) | `prisma/schema.prisma` | Defined but never written to | Medium — implement or remove |
| `DevLoginController` | `domains/auth/dev-login.controller.ts` | Security risk, dev-only code in production codebase | Small — remove, use dev script |
| Shared `PLAYER_HEARTBEAT_SECRET` fallback | `player.service.ts`, `realtime.gateway.ts` | Legacy auth method, security risk | Medium — force re-pairing migration |

### Architectural Shortcuts

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| Circular dependency Auth ↔ Workspaces | `auth.service.ts` uses `forwardRef` | Code smell, refactoring risk | Medium — extract invitation service |
| `workspaceId` as query parameter | All controllers | Security anti-pattern, log leakage | Large — requires API v2 |
| `recurrence` as String not enum | `Schedule`, `ScreenOverrideRule` | Type safety loss | Small — Prisma migration |
| `startTime`/`endTime` as String | `Schedule`, `ScreenOverrideRule` | No DB validation, format issues | Medium — requires timezone support |
| In-memory throttler | `common/throttler/` | Can't scale horizontally | Medium — add Redis store |
| In-memory WebSocket adapter | `realtime.gateway.ts` | Can't scale horizontally | Medium — add Redis adapter |
| Local filesystem storage | `media.service.ts` | Not suitable for containers | Medium — add S3 adapter |
| Static asset serving in API | `main.ts` | API process handles file downloads | Small — move to CDN/S3 |

### Incomplete Implementations

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| API keys not enforced | `domains/api-keys/` | False sense of security | Medium — implement guard |
| Feature flags not enforced | `domains/onboarding/` | Toggling flags has no runtime effect | Medium — add middleware |
| Email notifications (3 templates only) | `domains/email/` | Users unaware of critical events | Large — 10+ email flows |
| No AI services | No module | Product positioning mismatch | Large — new module |
| No proof-of-play | No model | Can't verify content was displayed | Medium — new model + tracking |
| No timezone support | Scheduling | Wrong display times for non-server TZ | Medium — add timezone field |
| No push notifications | No module | Mobile users miss alerts | Medium — FCM/APNs integration |
| No invoice generation | Billing | No invoice records | Small — create from webhook |
| No dunning management | Billing | Failed payments silent | Medium — grace period + emails |
| No seat limit enforcement | Billing | Plan limits not enforced | Small — add check in member creation |

### Code Smells

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| `AuthService` is 1,106 lines | `auth.service.ts` | Hard to maintain, hard to test | Medium — decompose into 3-4 services |
| Route ordering fragility | Multiple controllers | New routes could shadow existing | Small — use NestJS route priority |
| No serialization layer | All controllers | Prisma model leakage, inconsistent shapes | Medium — add interceptor |
| No response envelope | All controllers | Inconsistent API responses | Large — breaking change |
| No module boundary enforcement | All modules | Cross-module imports possible | Small — use `@Global()` selectively |
| Empty shared packages | `packages/ui/`, `packages/config/` | Code duplication between apps | Medium — extract shared types |

### Testing Debt

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| 8 modules with zero specs | Multiple | Untested critical code | Large — write all specs |
| No integration tests | `test/` | Prisma queries unvalidated | Large — Testcontainers setup |
| No E2E tests | `test/` | Business flows unvalidated | Large — write E2E suite |
| No coverage threshold | `jest.config.js` | Coverage can decrease silently | Small — add config |
| No test factories | `test/` | Manual mock objects, duplication | Medium — create factories |

### Infrastructure Debt

| Item | Location | Impact | Effort to Fix |
|------|----------|--------|---------------|
| No Redis | Not installed | Can't cache, can't scale WS/throttler | Medium — add Redis module |
| No S3/MinIO | Not installed | Can't store media in containers | Medium — add S3 adapter |
| No graceful shutdown | `main.ts` | Request loss on restart | Small — add SIGTERM handler |
| No request ID | No middleware | Can't correlate logs | Small — add middleware |
| No structured logging | `Logger` class | Plain text logs, hard to parse | Medium — add JSON logger |
| No Docker multi-stage | `Dockerfile.backend` | Larger image, slower builds | Small — multi-stage build |
| No CI test pipeline | `.github/workflows/` | Tests may not run on PRs | Small — add test step |

---

## 3. Debt by Priority

### P0 — Critical (Must fix before production)
1. In-memory throttler → Redis
2. In-memory WebSocket adapter → Redis adapter
3. Local filesystem → S3/MinIO
4. No graceful shutdown → SIGTERM handler
5. Shared PLAYER_HEARTBEAT_SECRET fallback → force re-pairing

### P1 — High (Fix before scale)
1. API keys not enforced → implement guard
2. 8 modules with zero tests → write specs
3. No integration tests → Testcontainers
4. AuthService 1,106 lines → decompose
5. No serialization layer → add interceptor
6. `workspaceId` in query params → header (API v2)
7. `recurrence` as String → enum

### P2 — Medium (Fix during Phase 2)
1. DevLoginController → remove
2. `WorkspacePairingCode` → remove from schema
3. `PaymentRecord` → implement or remove
4. Feature flags not enforced → middleware
5. No timezone support → add to Workspace
6. No email notifications → implement flows
7. No request ID → add middleware
8. No structured logging → JSON logger
9. Empty shared packages → extract types
10. No Docker multi-stage → optimize

### P3 — Low (Nice to have)
1. Route ordering fragility → NestJS route priority
2. No module boundary enforcement → `@Global()` selectively
3. No coverage threshold → Jest config
4. No test factories → create shared factories
5. No CI test pipeline → add test step

---

## 4. Debt Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Deprecated models | 2 | 0 |
| Untested modules | 8 | 0 |
| Services > 500 lines | 1 (AuthService) | 0 |
| String-typed enum fields | 2 | 0 |
| In-memory-only infrastructure | 3 (throttler, WS, storage) | 0 |
| Empty shared packages | 2 | 0 |
| Total P0 items | 5 | 0 |
| Total P1 items | 7 | 0 |
| Total P2 items | 10 | 0 |
| Total P3 items | 5 | 0 |

---

## 5. Priority: **Medium**

Technical debt is manageable but will compound if not addressed. P0 items are blocking production deployment.

---

## 6. Completion Percentage: **35%**

This audit identifies all technical debt. Resolution is tracked in the Phase 2 roadmap.

---

## 7. Recommendations

1. **Sprint 1:** Fix all P0 items (Redis, S3, graceful shutdown, shared secret removal)
2. **Sprint 2:** Fix P1 items (API key guard, tests, AuthService decomposition, serialization)
3. **Sprint 3:** Fix P2 items (DevLogin removal, deprecated model cleanup, timezone, email notifications)
4. **Sprint 4:** Fix P3 items (route ordering, module boundaries, coverage threshold, CI pipeline)
5. Add technical debt tracking: `TECH_DEBT.md` file updated with each PR
6. Add `npm run tech-debt` script that counts deprecated patterns
7. Enforce "no new debt" policy: PRs that add debt must have a TODO with issue link

---

## 8. Future Tasks

- [ ] Remove WorkspacePairingCode model
- [ ] Remove DevLoginController
- [ ] Implement or remove PaymentRecord
- [ ] Force re-pairing for shared-secret screens
- [ ] Resolve Auth ↔ Workspaces circular dependency
- [ ] Convert recurrence String fields to enums
- [ ] Decompose AuthService
- [ ] Add serialization interceptor
- [ ] Implement API key guard
- [ ] Implement feature flag enforcement
- [ ] Add Redis for throttler + WS adapter
- [ ] Add S3 storage adapter
- [ ] Add graceful shutdown
- [ ] Add request ID middleware
- [ ] Add structured JSON logging
- [ ] Extract shared types to packages/shared/
- [ ] Optimize Docker multi-stage build
- [ ] Add CI test pipeline
