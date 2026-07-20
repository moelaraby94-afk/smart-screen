# 02 — System Boundaries

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Defining the precise boundary between Platform Control Panel and Customer Dashboard

---

## 1. Current State

Today, the boundary between "platform" and "customer" is模糊 (blurry). It exists as a runtime switch inside a single application, not as an architectural boundary. The following table maps every major component to its current ownership:

### 1.1 Backend Module Ownership (Current)

| Module | Path | Platform Use | Customer Use | Shared |
|---|---|---|---|---|
| AuthModule | `domains/auth` | ✅ (login, impersonation, exit-impersonation) | ✅ (login, register, 2FA, password reset) | ✅ |
| AdminModule | `domains/admin` | ✅ (all routes) | ❌ | ❌ |
| WorkspacesModule | `domains/workspaces` | ✅ (createCustomerWorkspace, listWorkspaces) | ✅ (CRUD, members, invites, pairing) | ✅ |
| ScreensModule | `domains/screens` | ✅ (listGlobalFleetScreens via AdminService) | ✅ (CRUD, assignments, remote commands) | ✅ |
| CanvasesModule | `domains/canvases` | ❌ | ✅ | ❌ |
| MediaModule | `domains/media` | ✅ (storage aggregation via AdminService) | ✅ (upload, list, folders, expiry) | ✅ |
| PlaylistsModule | `domains/playlists` | ❌ | ✅ | ❌ |
| SchedulesModule | `domains/schedules` | ❌ | ✅ | ❌ |
| CampaignsModule | `domains/campaigns` | ❌ | ✅ | ❌ |
| SubscriptionsModule | `domains/subscriptions` | ✅ (mockWorkspaceSubscriptionPlan via AdminService) | ✅ (getCurrent, setMockPlan) | ✅ |
| StripeModule | `domains/stripe` | ❌ | ✅ (checkout, portal) | ❌ |
| RealtimeModule | `domains/realtime` | ✅ (getConnectedSocketCount in stats) | ✅ (WebSocket gateway) | ✅ |
| PlayerModule | `domains/player` | ❌ | ✅ (workspace-bootstrap) | ❌ |
| AccountModule | `domains/account` | ❌ | ✅ (profile, email change, billing, GDPR export) | ❌ |
| WebhooksModule | `domains/webhooks` | ❌ | ✅ (CRUD, test, Stripe webhooks) | ❌ |
| ApiKeysModule | `domains/api-keys` | ❌ | ✅ (CRUD) | ❌ |
| OnboardingModule | `domains/onboarding` | ✅ (feature flags controller at `/admin/feature-flags`) | ✅ (progress, complete-step, dismiss) | ✅ |
| IslamicModule | `domains/islamic` | ❌ | ✅ (prayer times, Ramadan) | ❌ |
| NotificationsModule | `domains/notifications` | ❌ | ✅ (list, mark-read, preferences) | ❌ |
| MaintenanceModule | `domains/maintenance` | ❌ | ✅ | ❌ |
| HealthModule | `common/health` | ✅ (health checks) | ✅ (health checks) | ✅ |
| MetricsModule | `common/metrics` | ✅ | ✅ | ✅ |
| AuditLogModule | `common/audit` | ✅ (listLogs, append) | ✅ (workspace audit log) | ✅ |

### 1.2 Frontend Route Ownership (Current)

| Route Group | Path | Owner | Guard |
|---|---|---|---|
| (auth) | `/[locale]/login` | Shared | None |
| (auth) | `/[locale]/register` | Shared | None |
| (auth) | `/[locale]/forgot-password` | Shared | None |
| (auth) | `/[locale]/invite` | Shared | None |
| (auth) | `/[locale]/privacy` | Shared | None |
| (auth) | `/[locale]/terms` | Shared | None |
| (shell) | `/[locale]/overview` | Customer | WorkspaceContext |
| (shell) | `/[locale]/screens/*` | Customer | RolesGuard |
| (shell) | `/[locale]/content/*` | Customer | RolesGuard |
| (shell) | `/[locale]/scheduling` | Customer | RolesGuard |
| (shell) | `/[locale]/campaigns` | Customer | RolesGuard |
| (shell) | `/[locale]/analytics` | Customer | RolesGuard |
| (shell) | `/[locale]/team` | Customer | RolesGuard |
| (shell) | `/[locale]/settings/*` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/billing/*` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/branches/*` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/admin/*` | **Platform** | SuperAdminGuard + AdminSectionLayout |
| (shell) | `/[locale]/api-docs` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/audit-log` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/notifications` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/help` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/emergency` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/ai` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/studio` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/proof-of-play` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/displays` | Customer | JwtAuthGuard |
| (shell) | `/[locale]/templates` | Customer | JwtAuthGuard |

### 1.3 Guard Architecture (Current)

```
Request → JwtAuthGuard (validates JWT)
               ↓
         ┌─────┴─────┐
         │           │
    AdminController   Customer Controllers
         │           │
PlatformStaffDbGuard  RolesGuard
         │           │
  @PlatformRoles    @Roles(UserRole.*)
  (fail-closed)     (superAdmin bypass)
```

**Problem:** `RolesGuard` at line 42 of `roles.guard.ts` checks `if (user.isSuperAdmin) return true;` — this means a super admin token bypasses all customer role checks. This is intentional (for impersonation and support), but it means the boundary is a runtime check, not an architectural one.

---

## 2. Problems

### 2.1 No Physical Boundary

The admin section (`/admin/*`) and customer section (`/overview`, `/screens`, etc.) share:
- The same Next.js build output
- The same JavaScript bundle (admin code is lazy-loaded but still in the same build)
- The same `CrystalShell` layout component
- The same `WorkspaceContext` provider
- The same `BrandingProvider`
- The same middleware chain
- The same CORS configuration
- The same deployment target

### 2.2 Shared Auth State

`WorkspaceContext` (`apps/dashboard/src/features/workspace/workspace-context.tsx`) manages both customer workspace state and super admin state. The `isSuperAdmin` flag is stored in sessionStorage (`cs_super_admin` key) and used to determine sidebar rendering. This coupling means:
- A bug in workspace context affects both panels
- Super admin state leaks into customer-only routes
- The `sovereign` flag calculation in `CrystalShell` mixes admin path detection with super admin status

### 2.3 AdminService Cross-Domain Dependencies

`AdminService` (`apps/backend/src/domains/admin/admin.service.ts`) imports:
- `AuthService` — for impersonation
- `WorkspacesService` — for workspace creation
- `ScreenHeartbeatService` — for socket count in stats
- `SubscriptionsService` — for mock plan setting
- `SubscriptionEmailService` — for renewal reminders
- `AuditLogService` — for audit log
- `PrismaService` — for direct database access

This means the admin domain reaches into customer domains through service injection. While this is acceptable (platform aggregates customer), the reverse must never happen — and currently there is no enforcement to prevent it.

### 2.4 Feature Flags Span Both Worlds

`FeatureFlagsController` is mounted at `/admin/feature-flags` and guarded by `SuperAdminDbGuard`. It manages per-workspace feature toggles. The feature flags themselves are consumed by the Customer Dashboard. This creates a cross-boundary dependency: the Control Panel writes flags, the Customer Dashboard reads them.

---

## 3. Target Architecture

### 3.1 Boundary Definition

The boundary between the Platform Control Panel and the Customer Dashboard is defined at three levels:

#### Level 1: Frontend Boundary (Application Separation)

| Property | Control Panel | Customer Dashboard |
|---|---|---|
| Application | `apps/control-panel` (new) | `apps/dashboard` (existing, admin routes removed) |
| URL | `admin.cloudsignage.com` | `app.cloudsignage.com` |
| Port | 3003 | 3000 |
| Build | Independent | Independent |
| Deploy | Independent | Independent |
| CORS Origin | `admin.cloudsignage.com` | `app.cloudsignage.com` |
| CDN | Independent | Independent |
| i18n | Shared (ar/en) | Shared (ar/en) |
| UI Components | Shared via `packages/ui` | Shared via `packages/ui` |

#### Level 2: API Boundary (Route Partitioning)

| API Surface | Prefix | Guard | Token Audience |
|---|---|---|---|
| Platform API | `/api/v1/admin/*`, `/api/v1/staff/*` | `PlatformStaffDbGuard` | `platform` |
| Customer API | `/api/v1/workspaces/*`, `/api/v1/screens/*`, etc. | `RolesGuard` | `customer` |
| Player API | `/api/v1/player/*` | `x-player-secret` header | N/A (kiosk) |
| Auth API | `/api/v1/auth/*` | None (public) or `JwtAuthGuard` | Issues both audiences |
| Branding API | `/api/v1/branding` | None (public) | N/A |
| Webhooks API | `/api/v1/webhooks/stripe` | Stripe signature | N/A |
| Health API | `/api/v1/health/*` | None | N/A |

#### Level 3: Data Boundary (Schema Partitioning)

The database remains unified, but access patterns are partitioned:

| Data Domain | Platform Access | Customer Access |
|---|---|---|
| `User` (all users) | Full CRUD via AdminService | Own profile only via AccountService |
| `Workspace` (all workspaces) | Full CRUD via AdminService | Own workspaces only via WorkspacesService |
| `Screen` (all screens) | Read-only via AdminService.listGlobalFleetScreens | Full CRUD via ScreensService (workspace-scoped) |
| `Subscription` | Read + mock via AdminService | Read + Stripe checkout via SubscriptionsService |
| `FeatureFlag` | Full CRUD via FeatureFlagsController | Read-only (implicit, via feature checks) |
| `AuditLog` | Read all via AdminService.listLogs | Read workspace-scoped via WorkspaceAuditLogModule |
| `PlatformSettings` (new table) | Full CRUD | Read-only (branding, maintenance mode) |
| `Media`, `Playlist`, `Canvas`, `Schedule`, `Campaign` | No direct access | Full CRUD (workspace-scoped) |

### 3.2 Dependency Rules

```
┌─────────────────────────────────────────────────────┐
│              Platform Control Panel                  │
│         (apps/control-panel — Next.js)              │
│                                                     │
│  Imports from: packages/ui, packages/config         │
│  Calls: /api/v1/admin/*, /api/v1/auth/*             │
│  NEVER calls: /api/v1/screens/*, /api/v1/media/*    │
│  (except via admin endpoints that aggregate)        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Platform Backend Domains                │
│    (admin/, onboarding/feature-flags, branding)     │
│                                                     │
│  Imports from: Customer domain services (read-only) │
│  NEVER imported by: Customer domains                │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Shared Domain Services                  │
│  (auth, workspaces, screens, media, playlists,      │
│   schedules, campaigns, subscriptions, stripe,      │
│   realtime, player, account, webhooks, api-keys,    │
│   onboarding, islamic, notifications, maintenance)  │
│                                                     │
│  No imports from Platform domains                   │
│  No imports from Frontend                           │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              Shared Infrastructure                   │
│  (PrismaService, RedisService, StorageService,      │
│   EmailService, AuditLogService, Throttler,         │
│   RequestContext, HealthModule, MetricsModule)       │
└─────────────────────────────────────────────────────┘
```

**Rule 1:** Platform backend domains may import shared domain services. Customer backend domains may NOT import platform domains.

**Rule 2:** The Control Panel frontend may only call platform API routes (`/admin/*`, `/auth/*`, `/branding`). It may NOT call customer API routes directly.

**Rule 3:** The Customer Dashboard frontend may only call customer API routes. It may NOT call `/admin/*` routes.

**Rule 4:** Shared infrastructure has no knowledge of platform vs. customer. It provides generic services.

**Rule 5:** The `User` model is shared. Both platform and customer domains read/write to it. The distinction is enforced at the guard/service level, not at the schema level.

### 3.3 Cross-Boundary Communication

#### Impersonation (Platform → Customer)

```
Control Panel                Backend                 Customer Dashboard
     │                          │                          │
     │ POST /admin/users/:id/   │                          │
     │   impersonate             │                          │
     ├─────────────────────────►│                          │
     │                          │ Issue one-time           │
     │                          │ exchange token (30s TTL) │
     │◄─────────────────────────┤                          │
     │ { exchangeToken }        │                          │
     │                          │                          │
     │ Redirect to:             │                          │
     │ app.cloudsignage.com/     │                          │
     │   auth/impersonate?       │                          │
     │   token=exchangeToken     │                          │
     ├─────────────────────────────────────────────────────►│
     │                          │                          │
     │                          │ POST /auth/              │
     │                          │   exchange-impersonation │
     │                          │◄─────────────────────────┤
     │                          │ Verify exchange token    │
     │                          │ Issue customer-audience  │
     │                          │ access + refresh tokens  │
     │                          │─────────────────────────►│
     │                          │                          │
     │                          │                          │ Set cookies
     │                          │                          │ Load dashboard
```

#### Feature Flags (Platform → Customer, async)

Feature flags are set by the Control Panel and read by the Customer Dashboard through the backend. There is no direct communication between the two frontends. The backend acts as the source of truth.

#### Branding (Platform → Customer, async)

Branding settings (logo, platform name) are set by the Control Panel and read by the Customer Dashboard via the public `/api/v1/branding` endpoint. The Customer Dashboard's `BrandingProvider` fetches this on mount.

#### Audit Log (Platform ← Customer, async)

Customer actions generate audit log entries via `AuditLogService`. The Control Panel reads these via `AdminService.listLogs()`. The audit log is the system of record, not a direct communication channel.

---

## 4. Recommended Solution

### 4.1 Enforce Backend Boundies with ESLint

Add an ESLint rule in the backend that prevents customer domains from importing platform domains:

```
// apps/backend/.eslintrc — import restrictions
"no-restricted-imports": ["error", {
  "patterns": [
    {
      "group": ["*/domains/admin/*"],
      "message": "Customer domains must not import platform admin domain.",
      "allow": ["*/domains/admin/dto/*"]
    }
  ]
}]
```

Apply this rule only to files under `domains/` excluding `domains/admin/`.

### 4.2 Enforce Frontend Boundies with Route Groups

In the Control Panel, only import from `features/admin/` and shared packages. In the Customer Dashboard, remove all `features/admin/` imports. The `apiFetch` utility should be configured with different base URLs for each application.

### 4.3 Separate CORS Origins

The backend's `createCorsOriginChecker()` already supports multiple origins via `ALLOWED_ORIGINS`. In production:
- `ALLOWED_ORIGINS=https://admin.cloudsignage.com,https://app.cloudsignage.com`
- Both origins are allowed, but the Control Panel sends `Origin: https://admin.cloudsignage.com` and the Customer Dashboard sends `Origin: https://app.cloudsignage.com`.

### 4.4 Separate Rate Limiting (Future)

Add a throttler guard that applies different rate limits based on the route prefix:
- `/admin/*`: Lower rate limit (platform staff are trusted, but fewer in number)
- Customer routes: Standard rate limit
- `/player/*`: Exempt from IP-based rate limiting (already implemented via `@SkipThrottle()`)

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Circular dependency between platform and customer domains | High | ESLint import restrictions + module boundary tests |
| Shared `User` model creates implicit coupling | Medium | Document the shared model explicitly. Use DTOs to control what each domain reads/writes. |
| Impersonation exchange token is intercepted | High | Short TTL (30s), single-use, signed with `ENCRYPTION_KEY`, stored in Redis with automatic expiry. |
| Branding endpoint becomes a bottleneck | Low | Cache branding response with `Cache-Control: public, max-age=300` (already implemented in `BrandingController`). |
| Feature flag changes don't propagate in real-time | Medium | Customer Dashboard can poll feature flags on workspace switch, or receive a WebSocket event. |

---

## 6. Alternatives

### 6.1 Separate Databases

Split the database into a platform database and a customer database, linked by foreign keys via Postgres FDW or application-level joins.

**Pros:** Physical data isolation, independent backups.
**Cons:** Cross-database joins are expensive, Prisma doesn't support FDW natively, significant migration effort, distributed transaction risk.

**Verdict:** Rejected. The data is tightly related (admin manages customer data). A single database with access-pattern partitioning is sufficient.

### 6.2 API Gateway

Introduce an API gateway (e.g., Kong, Nginx) that routes `/admin/*` to a platform backend and `/workspaces/*` to a customer backend.

**Pros:** Physical API separation, independent backend scaling.
**Cons:** Two backend deployments, duplicated infrastructure, network hop latency, complex service discovery.

**Verdict:** Rejected for now. The single NestJS process with route-level guards is sufficient. An API gateway can be introduced later if scale demands it.

---

## 7. Migration Notes

- **No file moves required in Phase 1.** The Control Panel is a new application that copies admin files from the dashboard. The dashboard keeps its admin routes during transition.
- **The `features/admin/` directory** in the dashboard is the source of truth for Control Panel components. After Phase 3, it is deleted from the dashboard.
- **The `apiFetch` utility** (`apps/dashboard/src/features/auth/session.ts`) is shared logic. It should be extracted to `packages/config/` or `packages/api-client/` before the separation.
- **The `WorkspaceContext`** is customer-specific. The Control Panel should have its own `PlatformContext` that manages platform staff state, not workspace state.

---

## 8. Open Questions

1. **Should the Control Panel have access to the Realtime WebSocket gateway?** Currently, `AdminService.getGlobalStats()` calls `heartbeat.getConnectedSocketCount()`. This is a read-only call, but it creates a dependency on the realtime module.
2. **Should the `AccountMember` model be visible to the Control Panel?** Currently, `AdminService` does not query `AccountMember`. Should platform staff see account-level memberships?
3. **Should the Control Panel manage customer API keys?** Currently, `ApiKeysController` is customer-only. Should there be a platform-level API key management endpoint?
4. **How should the Control Panel handle customer support?** Should it have a "support ticket" system, or is impersonation sufficient?

---

## 9. Final Recommendation

Define the boundary at three levels: **frontend application separation**, **API route partitioning with JWT audience claims**, and **data access pattern partitioning**. Enforce the boundary with ESLint import restrictions (backend) and route group isolation (frontend).

The boundary is **logical, not physical** — a single backend, a single database, but two frontends with independent deployment. This achieves the separation goals without the complexity of microservices or database splitting.

The most critical enforcement mechanism is the **dependency rule**: platform domains may import customer services, but customer domains may never import platform domains. This prevents the boundary from eroding over time.
