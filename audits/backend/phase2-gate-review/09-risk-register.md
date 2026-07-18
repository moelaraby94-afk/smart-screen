# 09 — Risk Register

> **Date:** 2025-07-18  
> **Method:** Consolidation of all identified risks across all gate review reports  
> **Scope:** Backend only

---

## Risk Classification

| Severity | Definition |
|----------|-----------|
| Critical | Will cause production outage or data loss |
| High | Will cause significant degradation or security incident |
| Medium | May cause issues under specific conditions |
| Low | Minor impact, unlikely to occur |

---

## 1. Security Risks

### R-001: Shared Secret Fallback

| Field | Value |
|-------|-------|
| **ID** | R-001 |
| **Severity** | Medium |
| **Probability** | Low (only affects pre-pairing-v2 screens) |
| **Impact** | If `PLAYER_HEARTBEAT_SECRET` is leaked, any screen can impersonate any other |
| **Mitigation** | Warning logged on every fallback use. `assertProductionSecretsAreSet` rejects dev placeholder. |
| **Related** | KI-017, TD-010 |
| **Planned Fix** | Phase 2 — force re-pairing migration |
| **Residual Risk** | Low — secret is asserted strong at boot, warnings logged |

### R-002: Docker Compose Redis No Password

| Field | Value |
|-------|-------|
| **ID** | R-002 |
| **Severity** | Medium |
| **Probability** | Low (Docker internal network) |
| **Impact** | Redis accessible without auth on Docker network |
| **Mitigation** | Don't expose Redis port externally. Use `REDIS_URL=redis://:password@host:6379` |
| **Related** | KI-003 |
| **Planned Fix** | Pre-deploy — add `requirepass` to Docker Compose |
| **Residual Risk** | Low — internal Docker network only |

### R-003: DevLoginController in Codebase

| Field | Value |
|-------|-------|
| **ID** | R-003 |
| **Severity** | Medium |
| **Probability** | Very Low (requires `ENABLE_DEV_LOGIN=true` in production) |
| **Impact** | Unauthenticated access to first user account |
| **Mitigation** | Excluded in production unless `ENABLE_DEV_LOGIN=true`. Secret assertion checks env. |
| **Related** | KI-018, TD-011 |
| **Planned Fix** | Phase 2 — remove or move to dev-only module |
| **Residual Risk** | Very Low — flag defaults to off |

### R-004: workspaceId in Query Parameters

| Field | Value |
|-------|-------|
| **ID** | R-004 |
| **Severity** | Low |
| **Probability** | High (all endpoints use this pattern) |
| **Impact** | Workspace ID leaks in access logs, browser history, referer headers |
| **Mitigation** | Reverse proxy can strip query params from logs. Workspace ID is not a secret. |
| **Related** | TD-002 |
| **Planned Fix** | API v2 (post-Phase 2) — move to header or path parameter |
| **Residual Risk** | Low — workspace ID is not sensitive, but pattern is non-standard |

---

## 2. Infrastructure Risks

### R-005: Admin Runtime Store Not Shared

| Field | Value |
|-------|-------|
| **ID** | R-005 |
| **Severity** | Medium |
| **Probability** | Medium (occurs when scaling to multiple instances) |
| **Impact** | Admin settings diverge between instances. Audit log entries lost on instance restart without volume. |
| **Mitigation** | Use shared volume (Docker Compose `backend_data` volume). Single-instance only for now. |
| **Related** | `05-scalability-review.md` §1.2 |
| **Planned Fix** | Migrate to PostgreSQL or Redis before multi-instance |
| **Residual Risk** | Medium — will break if scaled without fix |

### R-006: No Zero-Downtime Deploy

| Field | Value |
|-------|-------|
| **ID** | R-006 |
| **Severity** | Medium |
| **Probability** | High (every deploy) |
| **Impact** | Brief downtime during container restart |
| **Mitigation** | Deploy during low-traffic window |
| **Related** | `02-production-readiness.md` §1.8 |
| **Planned Fix** | Phase 9 — rolling deploy strategy |
| **Residual Risk** | Medium — unavoidable without K8s |

### R-007: Database Connection Exhaustion

| Field | Value |
|-------|-------|
| **ID** | R-007 |
| **Severity** | Medium |
| **Probability** | Low (requires N × pool_max > max_connections) |
| **Impact** | New connections refused, requests fail |
| **Mitigation** | Configure `DATABASE_POOL_MAX` and PostgreSQL `max_connections` together |
| **Related** | `05-scalability-review.md` §1.3 |
| **Planned Fix** | Document connection budget for target instance count |
| **Residual Risk** | Low — configurable |

---

## 3. Testing Risks

### R-008: 24 Pre-existing Test Failures

| Field | Value |
|-------|-------|
| **ID** | R-008 |
| **Severity** | Low |
| **Probability** | High (currently failing) |
| **Impact** | Can't detect new regressions in affected areas. CI may mask new failures. |
| **Mitigation** | All failures classified as pre-existing (constructor args, mock data). No production code affected. |
| **Related** | KI-008 through KI-013, TD-015 |
| **Planned Fix** | Phase 2 (early) — fix spec constructors and mock data |
| **Residual Risk** | Low — production code is correct, only specs are broken |

### R-009: No Integration Tests with Real Database

| Field | Value |
|-------|-------|
| **ID** | R-009 |
| **Severity** | Low |
| **Probability** | Medium |
| **Impact** | Prisma queries unvalidated. Race conditions undetectable. |
| **Mitigation** | Unit tests with mocks cover business logic. Manual testing covers integration. |
| **Related** | TD-016 |
| **Planned Fix** | Phase 2 — set up Testcontainers |
| **Residual Risk** | Low — manual testing covers gaps |

### R-010: No Load Testing

| Field | Value |
|-------|-------|
| **ID** | R-010 |
| **Severity** | Medium |
| **Probability** | High (never performed) |
| **Impact** | Unknown performance under load. May fail at production traffic. |
| **Mitigation** | Start with low traffic and monitor. |
| **Related** | `04-performance-review.md` §6 |
| **Planned Fix** | Pre-deploy — load test on staging |
| **Residual Risk** | Medium — unknown until tested |

---

## 4. Documentation Risks

### R-011: 3 Documentation Errors in Previous Audits

| Field | Value |
|-------|-------|
| **ID** | R-011 |
| **Severity** | Low |
| **Probability** | Confirmed (found in this review) |
| **Impact** | False debt items inflate register. Misleading production baseline status. |
| **Mitigation** | Corrected in `06-document-validation.md`. Must update source documents. |
| **Related** | `06-document-validation.md` §1 |
| **Planned Fix** | Update `07-technical-debt-register.md` and `08-production-baseline.md` |
| **Residual Risk** | Low — corrected in this review, source docs need update |

---

## 5. Risk Summary

| Severity | Count | IDs |
|----------|-------|-----|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 6 | R-001, R-002, R-005, R-006, R-007, R-010 |
| Low | 5 | R-003, R-004, R-008, R-009, R-011 |
| **Total** | **11** | |

**No Critical or High risks. All Medium risks have documented mitigations.**

---

## 6. Risk Acceptance

All 11 risks are accepted for Phase 2 start with the following conditions:

1. R-002 (Redis password) — must fix before production deploy
2. R-005 (Admin store) — must fix before multi-instance
3. R-008 (Test failures) — must fix early in Phase 2
4. R-010 (Load testing) — must perform before production deploy
5. R-011 (Doc errors) — must fix in source documents
