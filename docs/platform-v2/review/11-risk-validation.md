# 11 — Risk Register

> **Phase 11:** Complete risk register covering technical, business, security, performance, operational, migration, developer experience, maintenance, and cost risks

---

## Risk Classification

- **Probability:** Low (1-3), Medium (4-6), High (7-9)
- **Impact:** Low (1-3), Medium (4-6), High (7-9), Critical (10)
- **Risk Score:** Probability × Impact
- **Priority:** Critical (≥40), High (≥24), Medium (≥12), Low (<12)

---

## 1. Technical Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| T-01 | User table split causes data loss or corruption | 3 | 10 | 30 | **High** | Dual-write, backup, test in staging, gradual rollout | After Phase 3 |
| T-02 | Circular dependency resolution breaks NestJS DI | 5 | 7 | 35 | **High** | Test thoroughly, use integration tests, fallback to forwardRef | After Phase 1 |
| T-03 | Prisma middleware for tenant isolation slows queries | 4 | 5 | 20 | **Medium** | Benchmark, optimize, add Redis caching | After Phase 1 |
| T-04 | WebSocket audience check breaks player connections | 4 | 8 | 32 | **High** | Test with real players, gradual rollout, fallback to no-audience | After Phase 2 |
| T-05 | Shared package extraction breaks 100+ imports | 5 | 4 | 20 | **Medium** | ESLint verification, build check after each extraction | After Phase 2 |
| T-06 | CrystalShell split causes layout regressions | 5 | 5 | 25 | **High** | Visual regression testing, test all routes after split | After Phase 2 |
| T-07 | Route namespacing breaks frontend API calls | 4 | 7 | 28 | **High** | Dual routing, feature flags, test each route | After Phase 1 |
| T-08 | JWT audience change invalidates all active sessions | 8 | 4 | 32 | **High** | Deploy during low-traffic, support old tokens, communicate | After Phase 0 |
| T-09 | Redis session migration loses active sessions | 3 | 6 | 18 | **Medium** | Dual-write to DB + Redis, verify before cutover | After Phase 3 |
| T-10 | Exchange token impersonation has edge cases | 5 | 5 | 25 | **High** | Thorough testing, audit logging, rate limit exchange endpoint | After Phase 2 |

## 2. Business Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| B-01 | Migration takes longer than estimated (14 weeks) | 6 | 5 | 30 | **High** | Add 30% buffer, prioritize P0 items, cut P3 if needed | Monthly |
| B-02 | Customers confused by app separation (two URLs) | 5 | 4 | 20 | **Medium** | Clear communication, redirect from old to new, onboarding email | After Phase 2 |
| B-03 | Platform staff resistant to new Control Panel | 3 | 3 | 9 | **Low** | Training, familiar UI, feature parity | After Phase 2 |
| B-04 | New plan table breaks existing subscriptions | 3 | 8 | 24 | **High** | Migrate enum to table, verify all subscriptions, rollback plan | After Phase 3 |
| B-05 | Feature delays impact competitive positioning | 5 | 5 | 25 | **High** | Prioritize customer-facing features, defer internal tools | Quarterly |

## 3. Security Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| S-01 | WebSocket tenant isolation gap exploited | 6 | 8 | 48 | **Critical** | Fix before any production deployment, add ownership check | **Immediate** |
| S-02 | SuperAdminGuard (JWT-only) bypassed via forged JWT | 2 | 10 | 20 | **Medium** | Delete SuperAdminGuard, use SuperAdminDbGuard everywhere | After Phase 0 |
| S-03 | Impersonation token leaked during exchange | 3 | 8 | 24 | **High** | Short TTL (60s), one-time use, audit logging | After Phase 2 |
| S-04 | Privilege escalation via PATCH /admin/users/:id | 3 | 9 | 27 | **High** | Add 2FA requirement, audit log, rate limit | After Phase 1 |
| S-05 | Audit log gap prevents SOC2 compliance | 7 | 6 | 42 | **Critical** | Implement all P0 audit events before SOC2 audit | After Phase 3 |
| S-06 | CSRF exempt path list grows stale | 4 | 4 | 16 | **Medium** | Move to config, review quarterly | Quarterly |
| S-07 | API key replay attack | 4 | 5 | 20 | **Medium** | Add request signing or timestamp validation for enterprise | After Phase 3 |
| S-08 | JWT secret leak allows token forgery | 2 | 10 | 20 | **Medium** | Rotate secrets, use RS256 (asymmetric), monitoring | After Phase 0 |

## 4. Performance Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| P-01 | RolesGuard 3+ DB queries per request at scale | 7 | 6 | 42 | **Critical** | Cache in Redis with 60s TTL, invalidate on role change | **Immediate** |
| P-02 | No pagination on list endpoints | 8 | 5 | 40 | **Critical** | Implement cursor-based pagination on all list endpoints | After Phase 1 |
| P-03 | Admin list endpoints return full result sets | 7 | 6 | 42 | **Critical** | Add pagination to all admin endpoints | After Phase 1 |
| P-04 | Prisma middleware adds latency | 4 | 4 | 16 | **Medium** | Benchmark, optimize, cache | After Phase 1 |
| P-05 | Connection pool exhaustion (10 connections) | 5 | 7 | 35 | **High** | Increase pool to 20-30, add PgBouncer | After Phase 1 |
| P-06 | AuditLog table grows unbounded | 6 | 4 | 24 | **High** | Add retention policy, partition by date | After Phase 3 |
| P-07 | Media storage grows without quota enforcement | 7 | 4 | 28 | **High** | Implement storage quota in MediaService | After Phase 1 |

## 5. Operational Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| O-01 | File-based platform settings lost on redeploy | 5 | 5 | 25 | **High** | Migrate to PlatformSettings table | After Phase 0 |
| O-02 | No automated database backup | 6 | 8 | 48 | **Critical** | Set up automated pg_dump or managed DB backups | **Immediate** |
| O-03 | No monitoring/alerting on API errors | 5 | 5 | 25 | **High** | Sentry exists but no alerting rules | After Phase 0 |
| O-04 | Docker Compose single point of failure | 4 | 7 | 28 | **High** | Document K8s migration path, use Docker Swarm as interim | After Phase 3 |
| O-05 | No runbook for common incidents | 5 | 4 | 20 | **Medium** | Create runbooks for: DB down, Redis down, API down, WS down | After Phase 2 |
| O-06 | Secret rotation not documented | 4 | 4 | 16 | **Medium** | Document rotation procedure for each secret | After Phase 0 |

## 6. Migration Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| M-01 | Migration takes longer than estimated | 6 | 5 | 30 | **High** | 30% buffer, prioritize, cut scope | Monthly |
| M-02 | Dual routing creates confusion | 4 | 3 | 12 | **Medium** | Clear documentation, remove old routes ASAP | After Phase 4 |
| M-03 | Frontend app split causes SEO impact | 2 | 4 | 8 | **Low** | Use 301 redirects, update sitemap | After Phase 2 |
| M-04 | Cookie domain change forces re-login for all users | 9 | 3 | 27 | **High** | Expected, communicate, support old cookie during transition | After Phase 2 |
| M-05 | Database migration locks tables | 3 | 7 | 21 | **Medium** | Use `CONCURRENTLY` for indexes, avoid table rewrites | During Phase 3 |

## 7. Developer Experience Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| D-01 | No ESLint boundary enforcement leads to cross-imports | 7 | 4 | 28 | **High** | Implement `no-restricted-paths` rules | After Phase 1 |
| D-02 | Two apps double the maintenance burden | 6 | 4 | 24 | **High** | Shared packages, clear ownership, documentation | After Phase 2 |
| D-03 | No shared API types between frontend and backend | 7 | 3 | 21 | **Medium** | Create `packages/api-ts` with shared types | After Phase 2 |
| D-04 | Circular dependencies make testing harder | 5 | 4 | 20 | **Medium** | Resolve circular deps, use integration tests | After Phase 1 |
| D-05 | No local development setup for two apps | 5 | 3 | 15 | **Medium** | Update `npm run dev` to start all apps, document setup | After Phase 2 |

## 8. Maintenance Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| MA-01 | God services (Auth 1051 lines, Workspaces 1226 lines) are hard to maintain | 7 | 4 | 28 | **High** | Split into focused services | After Phase 1 |
| MA-02 | No soft delete leads to accidental data loss | 5 | 6 | 30 | **High** | Add `deletedAt` to critical models | After Phase 3 |
| MA-03 | Hardcoded config values (CSRF exempt paths, nav items) | 6 | 3 | 18 | **Medium** | Move to config files or DB | After Phase 1 |
| MA-04 | No API response DTOs — raw Prisma objects returned | 6 | 4 | 24 | **High** | Add response DTOs to prevent data leakage | After Phase 1 |
| MA-05 | No documentation for operational procedures | 5 | 4 | 20 | **Medium** | Create runbooks, architecture docs | Ongoing |

## 9. Cost Risks

| ID | Risk | Probability | Impact | Score | Priority | Mitigation | Revisit |
|---|---|---|---|---|---|---|---|
| C-01 | Two frontend apps double hosting cost | 7 | 3 | 21 | **Medium** | Use efficient hosting (Vercel free tier for small apps) | After Phase 2 |
| C-02 | Redis usage grows with session storage | 5 | 3 | 15 | **Medium** | Monitor Redis memory, set TTLs, use maxmemory-policy | After Phase 3 |
| C-03 | Database storage grows with audit logs | 6 | 3 | 18 | **Medium** | Retention policy, partitioning, archival | After Phase 3 |
| C-04 | Media storage cost grows without quota | 7 | 4 | 28 | **High** | Enforce storage quotas, S3 lifecycle policies | After Phase 1 |
| C-05 | Development cost exceeds budget | 5 | 5 | 25 | **High** | Prioritize P0, defer P3, track velocity | Monthly |

---

## Risk Summary

| Priority | Count | IDs |
|---|---|---|
| **Critical** | 6 | S-01, P-01, P-02, P-03, O-02, S-05 |
| **High** | 17 | T-01, T-02, T-04, T-06, T-07, T-08, T-10, B-01, B-04, B-05, S-03, S-04, P-05, P-06, P-07, O-01, O-03, O-04, M-01, M-04, D-01, D-02, MA-01, MA-02, MA-04, C-04, C-05 |
| **Medium** | 14 | T-03, T-05, T-09, B-02, S-06, S-07, S-08, P-04, O-05, O-06, M-02, M-05, D-03, D-04, D-05, MA-03, MA-05, C-01, C-02, C-03 |
| **Low** | 3 | B-03, M-03 |

### Immediate Actions Required (Before Implementation)

1. **S-01:** Fix WebSocket tenant isolation — any authenticated user can subscribe to any workspace's events
2. **P-01:** Cache RolesGuard DB queries in Redis
3. **P-02/P-03:** Add pagination to all list endpoints
4. **O-02:** Set up automated database backups
5. **S-05:** Implement P0 audit events for SOC2 compliance
