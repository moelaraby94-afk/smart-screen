# 01 — Platform Vision

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Author:** Principal Software Architect
> **Scope:** Cloud Signage SaaS Platform — Platform Control Panel & Customer Dashboard Separation

---

## 1. Current State

Cloud Signage is a digital signage SaaS platform built as a monorepo with four applications:

| Application | Technology | Port | Purpose |
|---|---|---|---|
| `apps/backend` | NestJS + Prisma + PostgreSQL | 4000 | Unified API serving both platform staff and customer tenants |
| `apps/dashboard` | Next.js (App Router) | 3000 | Unified frontend hosting both admin (Control Panel) and customer (Dashboard) routes |
| `apps/player` | Next.js (lightweight) | 3001 | Screen playback client (kiosk + JWT modes) |
| `apps/marketing` | Next.js | 3002 | Public marketing site |

The backend (`apps/backend/src/app.module.ts`) imports 24+ domain modules in a single NestJS process. All API routes are served under `/api/v1/` with a shared CORS policy, rate limiter, and middleware stack. There is no API partitioning between platform operations and customer operations — both share the same JWT authentication flow, the same `JwtAuthGuard`, and the same request pipeline.

The frontend (`apps/dashboard`) uses a single Next.js application with two route groups:
- `(auth)` — login, register, forgot-password, invite, privacy, terms
- `(shell)` — all authenticated routes, including both customer pages (`/overview`, `/screens`, `/content/*`, `/scheduling`, `/campaigns`, `/analytics`, `/team`, `/settings`) and admin pages (`/admin/*`)

The `CrystalShell` component (`apps/dashboard/src/components/crystal-shell.tsx`) dynamically switches the sidebar navigation between "sovereign" (admin) mode and "workspace" (customer) mode based on the `isSuperAdmin` flag and the current path. This is a runtime UI switch, not a deployment-level separation.

### Key Observations

1. **Single Backend Process:** `AdminController` at `/admin/*` and `WorkspacesController` at `/workspaces/*` run in the same NestJS instance, sharing the same Prisma client, Redis connection, and BullMQ queues.

2. **Dual-Role User Model:** The `User` model in `schema.prisma` carries both customer fields (`subscriptionStatus`, `subscriptionEndDate`, `memberships`) and platform staff fields (`isSuperAdmin`, `platformStaffRole`). A single JWT token can represent either a customer tenant user or a platform super admin.

3. **Impersonation Bridge:** `AuthService.issueImpersonation()` allows a super admin to mint tokens as a customer user. This creates a tight coupling between the Control Panel and the Customer Dashboard — the impersonated token is consumed by the same frontend application.

4. **Admin Settings in File System:** `admin-runtime.store.ts` persists platform settings (platform name, support email, maintenance mode, branding assets) in a JSON file at `.data/admin-runtime.json` rather than in PostgreSQL. This is a scalability and reliability concern for a true SaaS architecture.

5. **Feature Flags Per Workspace:** The `FeatureFlag` model allows per-workspace module toggling, managed exclusively by super admins via `/admin/feature-flags`. This is a platform-level control that affects customer behavior.

6. **Shared Infrastructure:** Docker Compose orchestrates a single PostgreSQL, single Redis, single MinIO, and single backend instance for all use cases. There is no isolation between platform data and customer data at the infrastructure level.

---

## 2. Problems

### 2.1 Coupling Problems

- **Frontend Coupling:** The admin section (`/admin/*`) and customer section share the same Next.js build, the same `node_modules`, the same bundle, and the same deployment. A change to a customer feature can break the admin panel and vice versa.
- **Backend Coupling:** Platform operations (customer management, staff management, global fleet, platform settings) and customer operations (screens, playlists, media, schedules) share the same NestJS module graph. There is no module boundary enforcement between platform and customer domains.
- **Authentication Coupling:** A single JWT strategy serves both user types. The `JwtUser` type (`{ sub, email, isSuperAdmin?, impersonatedBy? }`) is used universally. There is no separate token type or audience claim for platform staff vs. customer users.
- **Guard Coupling:** `RolesGuard` checks `user.isSuperAdmin` as a bypass for all workspace role checks. This means the super admin concept is woven into the customer authorization flow, not separated from it.

### 2.2 Scalability Problems

- **Single Deployment Unit:** The dashboard must be deployed as a whole even when only an admin feature changes. This increases deployment risk and frequency for customer-facing users.
- **Shared Rate Limiting:** Platform admin operations and customer API calls share the same throttler configuration. A burst of admin activity could affect customer API responsiveness.
- **File-Based Settings:** `admin-runtime.json` is a single file on the backend's local filesystem. In a multi-instance deployment, this file is not shared, leading to inconsistent platform settings across instances.

### 2.3 Security Problems

- **Cross-Domain Access:** A super admin token can access both `/admin/*` routes and customer routes (`/screens`, `/workspaces`, etc.). There is no API-level partitioning that prevents a compromised platform token from accessing customer data directly.
- **Impersonation Risk:** The impersonation flow allows a super admin to operate as a customer user with the same frontend application. While audited, this creates a path for privilege abuse that spans both systems.
- **No API Audience Separation:** JWT tokens do not carry an `audience` claim distinguishing platform staff from customer users. Any valid token can attempt any route.

### 2.4 Product Problems

- **No Independent Release Cycles:** The Control Panel and Customer Dashboard cannot be released independently. A hotfix to the admin panel requires redeploying the entire dashboard.
- **No Independent Scaling:** If the admin panel needs more resources (e.g., for heavy analytics), the entire dashboard must be scaled.
- **No Independent Access Control:** IP allowlisting, CORS origins, and rate limits cannot be configured differently for platform staff vs. customers.

---

## 3. Target Architecture

### 3.1 Vision Statement

Transform Cloud Signage from a monolithic SaaS application into a **two-panel SaaS architecture** where the Platform Control Panel and the Customer Dashboard are independent systems with clear boundaries, independent deployment pipelines, and separated security domains — while sharing a single backend API with route-level partitioning.

### 3.2 Architectural Principles

| Principle | Application |
|---|---|
| **Platform First** | The Control Panel is the governing system. It manages customers, workspaces, subscriptions, feature flags, and platform settings. It is not a customer feature. |
| **Tenant Isolation** | Customer Dashboard operations are scoped to a workspace. Platform operations are scoped to the entire platform. These scopes are enforced at the guard level, not just the UI level. |
| **Separation of Concerns** | Platform management logic and customer business logic live in separate modules with no circular dependencies. Platform modules import customer services; customer modules never import platform modules. |
| **Domain Driven Design** | Each domain (auth, workspaces, screens, media, subscriptions, admin, etc.) has its own module, controller, service, and DTOs. Platform domains aggregate customer domains; they do not bypass them. |
| **RBAC** | Two distinct role hierarchies: `PlatformStaffRole` (SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER) for the Control Panel and `UserRole` (OWNER, ADMIN, EDITOR, VIEWER) for the Customer Dashboard. These never overlap. |
| **Least Privilege** | Every API route grants access to the minimum set of roles required. Platform staff routes are fail-closed (no `@PlatformRoles` = super admin only). Customer routes require explicit workspace membership. |
| **Secure by Default** | JWT tokens carry an `audience` claim. Platform tokens cannot access customer routes and vice versa. Impersonation tokens are scoped and time-limited. |
| **Clean Architecture** | The backend is layered: guards → controllers → services → Prisma. Cross-domain communication happens through service injection, not direct Prisma access. |
| **SOLID** | Each module has a single responsibility. Platform modules depend on abstractions (customer service interfaces), not concretions. |
| **Scalability** | The Control Panel and Customer Dashboard can be deployed independently, scaled independently, and have independent CORS, rate limit, and CDN configurations. |
| **Maintainability** | Clear module boundaries, consistent patterns, and separated concerns reduce the cognitive load of changes and the risk of cross-domain regressions. |
| **Production Readiness** | All platform settings are stored in PostgreSQL, not files. All critical operations are audited. All deployments are containerized with health checks. |

### 3.3 Target System Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Shared Backend API                            │
│                      (NestJS — apps/backend)                        │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐ │
│  │ Platform API    │  │ Customer API    │  │ Player API          │ │
│  │ /api/v1/admin/* │  │ /api/v1/*       │  │ /api/v1/player/*    │ │
│  │ /api/v1/staff/* │  │ (workspace-     │  │ (kiosk + JWT)       │ │
│  │ (PlatformStaff  │  │  scoped)        │  │                     │ │
│  │  DbGuard)       │  │ (RolesGuard)    │  │                     │ │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────┘ │
│           │                    │                                     │
│  ┌────────┴────────────────────┴────────────────────────────────┐  │
│  │                    Shared Domain Services                     │  │
│  │  Auth · Workspaces · Screens · Media · Playlists · Subs ·    │  │
│  │  Campaigns · Realtime · Player · Account · Notifications     │  │
│  └───────────────────────────┬─────────────────────────────────┘  │
│                              │                                      │
│  ┌───────────────────────────┴─────────────────────────────────┐  │
│  │              Shared Infrastructure (Prisma, Redis,           │  │
│  │              BullMQ, Storage, Email, Sentry)                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
           │                              │
           │                              │
┌──────────┴──────────┐         ┌─────────┴──────────┐
│  Platform Control   │         │  Customer Dashboard │
│  Panel              │         │                     │
│  (apps/control-     │         │  (apps/dashboard)   │
│   panel)            │         │                     │
│  Next.js            │         │  Next.js             │
│  Port: 3003         │         │  Port: 3000         │
│  CORS: admin.*      │         │  CORS: app.*        │
│  Audience: platform │         │  Audience: customer │
└─────────────────────┘         └─────────────────────┘
```

### 3.4 Key Decisions

1. **Single Backend, Partitioned Routes:** The backend remains a single NestJS application. Platform routes are prefixed and guarded by `PlatformStaffDbGuard`. Customer routes are guarded by `RolesGuard`. This avoids the complexity of microservices while providing clear API boundaries.

2. **Two Frontend Applications:** The Control Panel becomes a separate Next.js application (`apps/control-panel`). The Customer Dashboard remains at `apps/dashboard`. Both consume the same backend API but have independent builds, deployments, CORS, and CDN configurations.

3. **Shared Prisma Schema:** The database schema remains unified. Platform and customer data share the same PostgreSQL instance with foreign key relationships. Splitting the database is a future consideration, not a current requirement.

4. **JWT Audience Claims:** Access tokens include an `audience` field (`platform` or `customer`). The backend validates the audience on every request. Platform tokens are rejected by customer route guards and vice versa.

5. **Impersonation as a Cross-System Bridge:** When a super admin impersonates a customer, the backend issues a customer-audience token. The Control Panel redirects the user to the Customer Dashboard with a one-time exchange token. The Customer Dashboard exchanges this for access/refresh tokens. This decouples the two frontends during impersonation.

6. **Platform Settings in Database:** The `admin-runtime.json` file is replaced by a `PlatformSettings` table in PostgreSQL. This enables multi-instance consistency and transactional updates.

---

## 4. Recommended Solution

### 4.1 Phase 1: Frontend Separation (Non-Breaking)

Create `apps/control-panel` as a new Next.js application that hosts only the admin section. The existing `apps/dashboard` continues to serve both admin and customer routes during a transition period. A feature flag or environment variable controls whether admin routes are served by the dashboard or redirected to the control panel.

**What stays:** The backend, Prisma schema, Docker Compose infrastructure, and all customer-facing frontend code.

**What moves:** All files under `apps/dashboard/src/app/[locale]/(shell)/admin/` and `apps/dashboard/src/features/admin/` are copied (not moved) to the new `apps/control-panel` application. During the transition, both applications can serve admin routes.

**What's shared:** The `apiFetch` utility, auth session management, i18n configuration, and UI component library are extracted into shared packages (`packages/ui`, `packages/config`).

### 4.2 Phase 2: API Partitioning (Non-Breaking)

Introduce JWT audience claims. Add a global guard that validates the audience. Platform routes require `audience: platform`; customer routes accept `audience: customer` or `audience: platform` (for impersonation). This is additive and non-breaking — existing tokens without an audience claim are treated as customer tokens.

### 4.3 Phase 3: Full Separation (Breaking)

Remove admin routes from `apps/dashboard`. The dashboard redirects any `/admin/*` path to the Control Panel URL. The Control Panel becomes the sole entry point for platform staff. Impersonation uses the cross-system redirect flow.

### 4.4 Phase 4: Platform Settings Migration

Move `admin-runtime.json` to a `PlatformSettings` table. Add a migration script that reads the existing JSON file and populates the table. Update `AdminService` to read from Prisma instead of the file system.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Impersonation flow breaks during cross-system redirect | High | Implement a one-time exchange token with short TTL (30s). Test thoroughly before removing the in-app impersonation path. |
| Shared UI components diverge between the two apps | Medium | Extract shared components into `packages/ui` before separation. Enforce version pinning. |
| CORS misconfiguration blocks cross-origin API calls | Medium | Use environment-driven CORS allow-lists. Test both applications against the backend in staging. |
| Admin users lose access during transition | High | Keep the dashboard admin routes alive during Phase 1–2. Only remove them in Phase 3 after the Control Panel is fully validated. |
| Platform settings lost during file-to-DB migration | High | Write a migration script with a dry-run mode. Backup the JSON file before migration. |
| Increased deployment complexity | Medium | Update Docker Compose and CI/CD pipelines to build and deploy both applications. Document the new deployment process. |

---

## 6. Alternatives

### 6.1 Microservices Backend

Split the backend into two services: a Platform API and a Customer API.

**Pros:** Complete isolation, independent scaling, independent deployment.
**Cons:** Distributed transactions, network latency, operational complexity, duplicated infrastructure (Prisma, Redis, etc.), significant refactoring effort.

**Verdict:** Rejected for now. The current backend is well-modularized with clear guard boundaries. Route-level partitioning within a single process achieves 90% of the isolation benefits at 10% of the cost. Microservices can be revisited when scale demands it.

### 6.2 Micro-Frontend (Module Federation)

Use Webpack Module Federation to load admin and customer modules dynamically from different builds.

**Pros:** Single URL, shared runtime, lazy loading.
**Cons:** Complex build configuration, shared state management, version coupling between host and remote, debugging difficulty.

**Verdict:** Rejected. The admin and customer panels have fundamentally different user experiences, navigation patterns, and access patterns. A clean separation into two applications is simpler and more maintainable.

### 6.3 Keep Monolithic Dashboard, Add Route Guards Only

Do not separate the frontends. Only add stronger route guards and API partitioning.

**Pros:** Minimal effort, no deployment changes.
**Cons:** Does not solve the coupling, scalability, or independent release cycle problems. A single bug in a shared component can take down both panels.

**Verdict:** Rejected as a final state. Acceptable as an interim measure during Phase 1.

---

## 7. Migration Notes

- **No database schema changes are required** for Phase 1–2. The `User` model already supports both `isSuperAdmin`/`platformStaffRole` and customer fields.
- **JWT changes are backward-compatible** if implemented as additive (new `audience` claim, old tokens treated as customer).
- **The Control Panel can be deployed to a subdomain** (e.g., `admin.cloudsignage.com`) while the Customer Dashboard stays at `app.cloudsignage.com`.
- **Docker Compose** needs a new service entry for the Control Panel. The backend service does not change.
- **CI/CD** needs a new build job for the Control Panel. The dashboard build job can skip admin routes after Phase 3.

---

## 8. Open Questions

1. **Should the Control Panel have its own authentication flow** (separate login page), or should it share the same login endpoint with the Customer Dashboard and redirect based on role?
2. **Should platform staff be allowed to create customer workspaces for themselves** (the current "Admin Control" workspace pattern in `AdminService.createStaff()`), or should staff accounts be completely separate from customer accounts?
3. **Should the Player application remain a separate app** or be merged into the Customer Dashboard as a route? (Current recommendation: keep separate.)
4. **What is the long-term plan for the `AccountMember` model?** It introduces account-level membership that spans multiple workspaces. Does this belong to the Customer Dashboard only, or does the Control Panel need visibility into it?
5. **Should the marketing site (`apps/marketing`) be merged with the Control Panel** for a unified public+admin presence, or kept separate?

---

## 9. Final Recommendation

Proceed with the **two-frontend, single-backend** architecture described in Section 3.3. The separation should be executed in four phases (Section 4.1–4.4) to minimize risk and maintain backward compatibility throughout.

The highest-priority work is **Phase 1 (Frontend Separation)** because it unlocks independent deployment cycles and reduces the blast radius of changes. Phase 2 (API Partitioning) should follow to enforce security boundaries. Phases 3 and 4 are cleanup work that can be scheduled after the separation is validated in production.

The existing codebase is well-positioned for this separation. The admin module is already isolated in `apps/backend/src/domains/admin/` with its own controller, service, and guards. The frontend admin section is already isolated under `apps/dashboard/src/app/[locale]/(shell)/admin/` with its own layout and guard. The main work is extraction, not refactoring.
