# 00 — Executive Summary

> **Document Type:** Master Architecture Report
> **Status:** READ-ONLY Analysis
> **Author:** Principal Software Architect
> **Date:** 2025
> **Scope:** Cloud Signage SaaS Platform — Platform Control Panel & Customer Dashboard Separation

---

## 1. Executive Overview

This document is the master report for a comprehensive architecture study of the Cloud-Screen digital signage SaaS platform. The study analyzes the current monolithic structure where the Platform Control Panel (admin) and Customer Dashboard share a single frontend application and a single backend process, and proposes a target architecture that separates them into two independent frontend applications with a partitioned but shared backend API.

The study is organized into 12 specification documents covering vision, boundaries, panel specifications, permissions, domain model, API boundaries, navigation, database impact, migration plan, risk analysis, and definition of done.

---

## 2. Current State

Cloud-Screen is a monorepo with four applications:

| App | Tech | Purpose |
|---|---|---|
| `apps/backend` | NestJS + Prisma + PostgreSQL | Unified API (24+ domain modules, single process) |
| `apps/dashboard` | Next.js (App Router) | Unified frontend (admin + customer routes) |
| `apps/player` | Next.js | Screen playback client |
| `apps/marketing` | Next.js | Public marketing site |

### Key Architecture Characteristics

- **Single backend process** serving both `/admin/*` (platform) and `/screens/*`, `/workspaces/*` (customer) routes
- **Single frontend application** with a `sovereign` mode toggle in `CrystalShell` for admin vs. customer navigation
- **Shared JWT authentication** — no audience claim distinguishes platform staff from customer users
- **`RolesGuard` super admin bypass** — `if (user.isSuperAdmin) return true;` allows platform tokens to access all customer routes
- **Platform settings in file system** — `.data/admin-runtime.json` instead of PostgreSQL
- **Two role hierarchies** — `PlatformStaffRole` (SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER) and `UserRole` (OWNER, ADMIN, EDITOR, VIEWER)
- **Impersonation via in-app token swap** — super admin mints customer tokens consumed by the same frontend

### Backend Domain Modules (24)

Auth, Admin, Workspaces, Screens, Canvases, Media, Playlists, Schedules, Campaigns, Subscriptions, Stripe, Realtime, Player, Pairing, Account, Webhooks, API Keys, Onboarding, Islamic, Notifications, Maintenance, Health, Metrics, Audit Log.

### Frontend Admin Features (19 components)

Admin API, Admin Home Overview, Admin Customers, Admin Customer Profile (client, dialogs, tabs, types), Admin Customer Workspace, Admin Fleet, Admin Logs, Admin Screens, Admin Settings, Admin Staff, Admin System Health, Admin Users, Admin Workspaces, Feature Flags, Impersonation Return Button, Super Admin Guard.

---

## 3. Problems Identified

### 3.1 Coupling

- **Frontend:** Admin and customer code share the same Next.js build, bundle, `CrystalShell` layout, and `WorkspaceContext`
- **Backend:** Platform and customer domains share the same NestJS process with no module boundary enforcement
- **Auth:** Single JWT strategy for both user types; no audience claim; super admin bypass in `RolesGuard`
- **Settings:** Platform settings in a local JSON file, not shared across instances

### 3.2 Scalability

- Single deployment unit for both panels
- Shared rate limiting between platform and customer traffic
- No independent scaling for admin vs. customer

### 3.3 Security

- Cross-domain token access (platform tokens can hit customer routes and vice versa)
- No API audience separation
- Impersonation tokens indistinguishable from real customer tokens

### 3.4 Product

- No independent release cycles
- No independent access control (CORS, IP allowlisting)
- A bug in shared code can take down both panels

---

## 4. Proposed Solution

### 4.1 Target Architecture: Two Frontends, One Backend

```
┌───────────────────────────────────────────────────────────┐
│                    Shared Backend API                      │
│                   (NestJS — apps/backend)                  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Platform API │  │ Customer API │  │ Player API     │  │
│  │ /admin/*     │  │ /workspaces  │  │ /player/*      │  │
│  │ PlatformStaff│  │ RolesGuard   │  │ x-player-secret│  │
│  │ DbGuard      │  │              │  │                │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────────┘  │
│         └────────┬────────┘                               │
│           Shared Domain Services                          │
│     (Auth, Workspaces, Screens, Media, Playlists,         │
│      Subscriptions, Realtime, Player, etc.)               │
│                    Shared Infrastructure                  │
│     (Prisma, Redis, BullMQ, Storage, Email, Sentry)       │
└───────────────────────────────────────────────────────────┘
         │                    │
┌────────┴─────────┐  ┌───────┴──────────┐
│ Platform Control │  │ Customer Dashboard│
│ Panel            │  │                   │
│ apps/control-    │  │ apps/dashboard    │
│ panel (NEW)      │  │ (simplified)      │
│ Port: 3003       │  │ Port: 3000        │
│ admin.* domain   │  │ app.* domain      │
│ audience:        │  │ audience:         │
│   platform       │  │   customer        │
└──────────────────┘  └───────────────────┘
```

### 4.2 Key Decisions

1. **Single backend, partitioned routes** — Platform routes guarded by `PlatformStaffDbGuard`, customer routes by `RolesGuard`. No microservices.
2. **Two frontend applications** — `apps/control-panel` (new) and `apps/dashboard` (simplified). Independent builds, deployments, CORS.
3. **Shared Prisma schema** — Unified database. Access patterns partitioned at the service level.
4. **JWT audience claims** — `platform` or `customer`. Validated by new guards. Additive and backward compatible.
5. **Cross-system impersonation** — One-time exchange token (30s TTL) redirects from Control Panel to Customer Dashboard.
6. **Platform settings in PostgreSQL** — New `PlatformSettings` table replaces `admin-runtime.json`.

---

## 5. Document Index

| Document | Title | Scope |
|---|---|---|
| [01](01-platform-vision.md) | Platform Vision | Current state, problems, target architecture, principles, decisions |
| [02](02-system-boundaries.md) | System Boundaries | Frontend/API/data boundary definitions, dependency rules, cross-boundary communication |
| [03](03-control-panel-spec.md) | Control Panel Specification | Full functional spec for the new Platform Control Panel application |
| [04](04-customer-panel-spec.md) | Customer Panel Specification | Full functional spec for the simplified Customer Dashboard |
| [05](05-permissions-matrix.md) | Permissions Matrix | Complete RBAC mapping for platform staff and customer users |
| [06](06-domain-model.md) | Domain Model | Entity inventory, bounded contexts, aggregate roots, ownership matrix |
| [07](07-api-boundaries.md) | API Boundaries | Complete route inventory, partitioning plan, API contracts per frontend |
| [08](08-navigation-map.md) | Navigation Map | Sidebar structure, header, breadcrumbs, route maps for both applications |
| [09](09-database-impact.md) | Database Impact | Schema changes (1 new table), migration plan, data integrity risks |
| [10](10-migration-plan.md) | Migration Plan | Four-phase migration with acceptance criteria per phase |
| [11](11-risk-analysis.md) | Risk Analysis | 40+ risks cataloged with severity, mitigation, and trend |
| [12](12-definition-of-done.md) | Definition of Done | Binary acceptance criteria, verification methods, rollback procedures |

---

## 6. Migration Plan Summary

### Four-Phase Migration (5–7 weeks, one developer)

| Phase | Goal | Breaking? | Duration | Key Deliverable |
|---|---|---|---|---|
| **Phase 1** | Frontend separation | No | 2–3 weeks | `apps/control-panel` created, both apps serve admin |
| **Phase 2** | API partitioning | No (additive) | 1–2 weeks | JWT audience claims, audience guards |
| **Phase 3** | Full separation | Yes | 1 week | Admin routes removed from dashboard, cross-system impersonation |
| **Phase 4** | Settings migration | No | 3–5 days | `PlatformSettings` table, file system removed |

### Phase Dependencies

```
Phase 1 (Frontend Separation)
    ↓
Phase 2 (API Partitioning) ← can overlap with Phase 1
    ↓
Phase 3 (Full Separation) ← requires Phase 1 + Phase 2 validated
    ↓
Phase 4 (Settings Migration) ← independent, can run anytime after Phase 1
```

---

## 7. Database Impact Summary

| Change | Type | Phase | Risk |
|---|---|---|---|
| Add `PlatformSettings` table | New table | Phase 4 | Low |
| Migrate `admin-runtime.json` → DB | Data migration | Phase 4 | Medium |
| Add `scope` to `AuditLog` (optional) | Add column | Phase 4 | Low |
| Add `ImpersonationSession` table (optional) | New table | Future | Low |

**Total required schema changes: 1 new table. No modified tables required. No breaking changes.**

---

## 8. Risk Summary

### Risks Mitigated by Separation

- Admin downtime no longer affects customers (independent deployment)
- Customer deploys no longer break admin panel
- Cross-domain token misuse prevented (audience validation)
- Platform settings consistent across instances (database storage)

### New Risks Introduced

- Exchange token interception (mitigated: 30s TTL, one-time use, HTTPS)
- Two applications to deploy (mitigated: CI/CD automation)
- Shared package version drift (mitigated: version pinning, dual test suites)
- i18n key drift (mitigated: shared package, sync script)

### Overall Risk Assessment: **PROCEED**

The separation reduces total risk. All new risks are medium or low severity with standard mitigations.

---

## 9. Permissions Summary

### Platform Staff Roles

| Role | Access |
|---|---|
| SUPER_ADMIN | Full access to all platform features |
| SUPPORT_SPECIALIST | Customers, users, workspaces, fleet, screens (read-only support) |
| BILLING_MANAGER | Dashboard stats, customers, users (billing focus) |

### Customer User Roles

| Role | Access |
|---|---|
| OWNER | Full workspace management + billing + team |
| ADMIN | Workspace management + team + billing (no workspace deletion in some cases) |
| EDITOR | Content creation and management (no team/billing/settings) |
| VIEWER | Read-only access to all workspace content |

---

## 10. Key Architectural Principles

1. **Platform First** — The Control Panel is the governing system, not a customer feature
2. **Tenant Isolation** — Customer operations are workspace-scoped; platform operations are global
3. **Separation of Concerns** — Platform modules import customer services; customer modules never import platform modules
4. **RBAC** — Two distinct role hierarchies that never overlap
5. **Least Privilege** — Every route grants minimum required roles
6. **Secure by Default** — JWT audience claims prevent cross-domain token misuse
7. **Additive Migration** — All changes are backward compatible until Phase 3

---

## 11. Recommendations

### Immediate Actions

1. **Start Phase 1** — Extract shared packages, create `apps/control-panel`, copy admin features
2. **Create verification scripts** — Automated checks for build, lint, and separation criteria
3. **Document rollback procedures** — Step-by-step rollback for each phase

### Before Phase 3

1. **Implement E2E test for impersonation** — Playwright test covering the full cross-system flow
2. **Notify platform staff** — Communicate the URL change and bookmark impact
3. **Validate in staging** — Run Phase 1–2 in staging for at least one week

### After Phase 4

1. **Remove `.data/admin-runtime.json`** — After verifying database migration
2. **Update `COMPLIANCE_ROADMAP.md`** — Reflect new architecture
3. **Monitor for 1 week** — Watch for regressions before considering the migration complete

---

## 12. Alternatives Considered

| Alternative | Verdict | Rationale |
|---|---|---|
| Microservices backend | Rejected | Single process with route guards achieves 90% of isolation at 10% of cost |
| Micro-frontend (Module Federation) | Rejected | Complex build, shared state, version coupling |
| Keep monolith, add guards only | Rejected | Does not solve coupling, scalability, or independent release |
| Split User table | Rejected | Shared User model is a common SaaS pattern; guards enforce separation |
| Separate databases | Rejected | Tightly related data; access-pattern partitioning is sufficient |
| Event sourcing for audit | Rejected | Overkill; append-only log with scope field is sufficient |
| ABAC instead of RBAC | Rejected | Overkill for current scale; two-hierarchy RBAC is sufficient |

---

## 13. Open Questions

1. Should the Control Panel have its own 2FA enforcement?
2. Should platform staff sessions have shorter TTLs than customer sessions?
3. Should the `isSuperAdmin` boolean be deprecated in favor of `platformStaffRole: SUPER_ADMIN`?
4. Should `AccountMember` be visible to the Control Panel?
5. Should the Player app remain separate or merge into the Customer Dashboard?
6. Should the marketing site merge with the Control Panel?
7. Should there be a `PLATFORM_VIEWER` role for read-only platform access?
8. Should the `/webhooks/stripe` endpoint be moved to a different prefix?

---

## 14. Conclusion

The Cloud-Screen platform is well-positioned for a frontend separation. The admin module is already isolated in both the backend (`domains/admin/`) and frontend (`app/[locale]/(shell)/admin/`, `features/admin/`). The main work is extraction, not refactoring.

The recommended architecture — **two frontends, one backend with route-level partitioning** — achieves the separation goals with minimal complexity. The four-phase migration plan ensures backward compatibility through Phase 2 and provides clear rollback points at each phase.

**Total estimated effort: 5–7 weeks with one developer (3–4 weeks with two developers).**

**Total database changes: 1 new table (PlatformSettings).**

**Total new backend endpoints: 1 (exchange-impersonation).**

**Total new frontend application: 1 (apps/control-panel).**

The investment is justified by:
- Independent deployment cycles (faster delivery, reduced blast radius)
- Improved security (JWT audience validation, cross-domain token prevention)
- Scalability (independent scaling, database-backed settings)
- Maintainability (clear boundaries, enforced dependency rules)

---

## Document Statistics

| Metric | Value |
|---|---|
| Total documents | 13 (including this summary) |
| Total pages | ~150+ |
| Backend modules analyzed | 24 |
| Frontend components analyzed | 19+ |
| API routes inventoried | 120+ |
| Permissions mapped | 60+ actions × 7 roles |
| Risks cataloged | 40+ |
| Migration phases | 4 |
| Acceptance criteria | 60+ binary checks |
| Open questions | 25+ |
