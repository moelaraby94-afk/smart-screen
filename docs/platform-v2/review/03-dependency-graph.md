# 03 — Dependency Graph Analysis

> **Phase 3:** Current vs target dependency graph, circular dependencies, forbidden dependencies, coupling problems

---

## 1. Current Dependency Graph

### 1.1 Backend Domain Module Dependencies

```
app.module.ts
├── AuthModule
│   ├── forwardRef(WorkspacesModule)  ← CIRCULAR
│   ├── AuditLogModule (common)
│   ├── CryptoModule (common)
│   ├── ConfigModule (common)
│   ├── PassportModule
│   └── JwtModule
├── WorkspacesModule
│   ├── forwardRef(AuthModule)  ← CIRCULAR
│   ├── MediaModule
│   ├── PairingModule
│   └── RealtimeModule
├── ScreensModule
│   ├── PlaylistsModule
│   ├── RealtimeModule
│   └── SchedulingModule
├── CanvasesModule
│   ├── PrismaModule
│   └── RealtimeModule
├── MediaModule
│   ├── RealtimeModule
│   └── StorageModule (common)
├── PlaylistsModule
│   ├── SchedulingModule
│   ├── MediaModule
│   ├── CanvasesModule
│   └── RealtimeModule
├── SchedulesModule (SchedulingModule)
│   └── (no domain imports)
├── SubscriptionsModule
│   ├── AuthModule
│   └── RealtimeModule
├── StripeModule
│   ├── AuthModule
│   └── SubscriptionsModule
├── RealtimeModule
│   ├── forwardRef(AuthModule)  ← CIRCULAR (via Auth)
│   ├── RedisModule (common)
│   └── ConfigModule (common)
├── PlayerModule
│   ├── AuthModule
│   ├── PlaylistsModule
│   ├── CanvasesModule
│   ├── PairingModule
│   └── IslamicModule
├── AdminModule
│   ├── forwardRef(AuthModule)  ← CIRCULAR (via Auth)
│   ├── forwardRef(WorkspacesModule)  ← CIRCULAR
│   ├── RealtimeModule
│   └── SubscriptionsModule
├── AccountModule
│   └── PrismaModule
├── CampaignsModule
│   └── RealtimeModule
├── WebhooksModule
│   ├── AuthModule
│   └── SubscriptionsModule
├── ApiKeysModule
│   └── AuthModule
├── OnboardingModule
│   ├── PrismaModule
│   └── AuthModule
├── IslamicModule
│   ├── PrismaModule
│   └── AuthModule
├── MaintenanceModule
│   ├── PrismaModule
│   └── StorageModule
├── NotificationsModule
│   └── RealtimeModule
├── WorkspaceAuditLogModule
│   └── AuditLogModule (common)
├── EmailModule (@Global)
│   └── (no imports)
└── Common modules (Prisma, Redis, Storage, CSRF, Health, Metrics, etc.)
```

### 1.2 Service-Level Dependencies (Critical)

| Service | Injects | From Module | Problem? |
|---|---|---|---|
| `AuthService` | `WorkspacesService` | Workspaces | **CIRCULAR** via `forwardRef` |
| `WorkspacesService` | `AuthService` | Auth | **CIRCULAR** via `forwardRef` |
| `WorkspacesService` | `MediaService` | Media | Coupling — workspace creation creates demo media |
| `WorkspacesService` | `ScreenHeartbeatService` | Realtime | Coupling — workspace creation touches realtime |
| `WorkspacesService` | `EmailService` | Email | Acceptable — sends invitations |
| `AdminService` | `AuthService` | Auth | Coupling — impersonation |
| `AdminService` | `WorkspacesService` | Workspaces | Coupling — tenant management |
| `AdminService` | `SubscriptionsService` | Subscriptions | Coupling — subscription mocking |
| `AdminService` | `RealtimeGateway` | Realtime | Coupling — screen commands |
| `SubscriptionsService` | `AuthService` | Auth | Coupling — subscription changes revoke sessions |
| `ScreensService` | `PlaylistsService` | Playlists | Coupling — screen assignment |
| `ScreensService` | `SchedulingService` | Schedules | Coupling — schedule resolution |
| `PlaylistsService` | `MediaService` | Media | Acceptable — playlist items reference media |
| `PlaylistsService` | `CanvasesService` | Canvases | Acceptable — playlist items reference canvases |
| `PlayerService` | `PlaylistsService` | Playlists | Acceptable — content delivery |
| `PlayerService` | `CanvasesService` | Canvases | Acceptable — content delivery |
| `PlayerService` | `PrayerTimesService` | Islamic | Acceptable — prayer pause |
| `NotificationsService` | `RealtimeGateway` | Realtime | Acceptable — push notifications |

### 1.3 Frontend Dependencies (Dashboard)

```
CrystalShell
├── ShellSidebar (admin + customer nav in one component)
├── ShellHeader (sovereign mode)
├── Breadcrumbs (admin + customer routes)
├── PageTransition
├── ImpersonationReturnButton (admin feature in customer shell)
├── WorkspaceGate (customer feature)
├── useWorkspace() (customer context)
└── useWorkspaceStats() (customer context)

ShellSidebar
├── WorkspaceSwitcher (customer only)
├── admin nav items (sovereign mode)
├── customer nav items (non-sovereign mode)
├── apiLogout (shared auth)
└── setStoredAccessToken (shared auth)

features/admin/* → features/auth/session (apiFetch)
features/admin/* → features/workspace/workspace-context (useWorkspace)
features/customer/* → features/auth/session (apiFetch)
features/customer/* → features/workspace/workspace-context (useWorkspace)
```

---

## 2. Circular Dependencies

### CIRCULAR-01: Auth ↔ Workspaces

```
AuthModule ──forwardRef──→ WorkspacesModule
WorkspacesModule ──forwardRef──→ AuthModule
```

**Root Cause:** `AuthService` needs `WorkspacesService` to build workspace lists during login/refresh. `WorkspacesService` needs `AuthService` to create user accounts during workspace bootstrap.

**Impact:**
- Unpredictable DI initialization order
- Cannot extract either module into a separate service
- `forwardRef` masks the problem but doesn't solve it
- Makes testing harder (must mock both services)

**Resolution:** Extract a `WorkspaceResolverService` in a shared module that both can import:
```
SharedModule
└── WorkspaceResolverService (read-only workspace list builder)

AuthModule → SharedModule (no longer imports WorkspacesModule)
WorkspacesModule → SharedModule (no longer imports AuthModule)
```

### CIRCULAR-02: Auth ↔ Realtime

```
RealtimeModule ──forwardRef──→ AuthModule
```

**Root Cause:** `RealtimeGateway` needs `JwtService` (from `AuthModule`) to verify WebSocket connections. `AuthModule` doesn't import `RealtimeModule` directly, but `WorkspacesModule` imports both, creating an indirect cycle.

**Impact:**
- WebSocket auth depends on JWT infrastructure
- If Auth module changes, Realtime must be retested

**Resolution:** Extract `JwtModule` into a shared `JwtInfraModule` that both `AuthModule` and `RealtimeModule` import independently.

### CIRCULAR-03: Admin ↔ Auth ↔ Workspaces

```
AdminModule ──forwardRef──→ AuthModule
AdminModule ──forwardRef──→ WorkspacesModule
```

**Root Cause:** `AdminService` needs `AuthService` for impersonation and `WorkspacesService` for tenant management. Both use `forwardRef`.

**Impact:**
- Admin module is the most coupled module in the system
- Cannot move admin to a separate service without resolving Auth and Workspaces dependencies first
- Changes to Auth or Workspaces ripple into Admin

**Resolution:** After resolving CIRCULAR-01 and CIRCULAR-02, Admin can import Auth and Workspaces without `forwardRef`.

---

## 3. Forbidden Dependencies (Target Architecture)

### Target Dependency Rules

```
Platform modules    →  Shared modules, Customer modules (read-only)
Customer modules    →  Shared modules only
Shared modules      →  Shared modules only
Auth module         →  Shared modules only
```

### Current Violations

| Violation | From | To | Severity |
|---|---|---|---|
| Customer → Platform | `WorkspacesService` | `AuthService` (impersonation logic) | **HIGH** |
| Customer → Platform | `NotificationsModule` | `RealtimeModule` (platform push) | **MEDIUM** |
| Shared → Customer | `AuthService` | `WorkspacesService` | **HIGH** |
| Circular | `AuthModule` ↔ `WorkspacesModule` | `forwardRef` | **CRITICAL** |
| Circular | `AdminModule` → `AuthModule` + `WorkspacesModule` | `forwardRef` | **HIGH** |

---

## 4. Target Dependency Graph

```
app.module.ts
├── /platform/*
│   ├── PlatformTenantModule (was AdminModule)
│   │   ├── SharedModule
│   │   ├── PlatformBillingModule
│   │   └── PlatformStaffModule
│   ├── PlatformSettingsModule
│   │   └── SharedModule
│   ├── PlatformAnalyticsModule
│   │   └── SharedModule
│   ├── PlatformSupportModule
│   │   └── SharedModule
│   └── PlatformSecurityModule
│       └── SharedModule
│
├── /customer/*
│   ├── CustomerWorkspaceModule (was WorkspacesModule)
│   │   ├── SharedModule
│   │   └── CustomerMediaModule
│   ├── CustomerScreensModule
│   │   ├── SharedModule
│   │   ├── CustomerPlaylistsModule
│   │   └── CustomerSchedulingModule
│   ├── CustomerPlaylistsModule
│   │   ├── SharedModule
│   │   ├── CustomerMediaModule
│   │   └── CustomerCanvasesModule
│   ├── CustomerCanvasesModule
│   │   └── SharedModule
│   ├── CustomerMediaModule
│   │   ├── SharedModule
│   │   └── SharedStorageModule
│   ├── CustomerSchedulingModule
│   │   └── SharedModule
│   ├── CustomerCampaignsModule
│   │   └── SharedModule
│   ├── CustomerBillingModule
│   │   ├── SharedModule
│   │   └── CustomerSubscriptionsModule
│   ├── CustomerApiKeysModule
│   │   └── SharedModule
│   ├── CustomerWebhooksModule
│   │   └── SharedModule
│   ├── CustomerOnboardingModule
│   │   └── SharedModule
│   ├── CustomerIslamicModule
│   │   └── SharedModule
│   ├── CustomerNotificationsModule
│   │   └── SharedModule
│   ├── CustomerAuditLogModule
│   │   └── SharedModule
│   └── CustomerAccountModule
│       └── SharedModule
│
├── /auth/*
│   └── AuthModule
│       ├── SharedModule
│       └── JwtInfraModule
│
├── /player/*
│   └── PlayerModule
│       ├── SharedModule
│       ├── CustomerPlaylistsModule (read-only)
│       ├── CustomerCanvasesModule (read-only)
│       └── CustomerIslamicModule (read-only)
│
├── /public/*
│   └── PublicModule (health, readiness)
│       └── SharedModule
│
├── /internal/*
│   └── InternalModule (Stripe webhooks, cron jobs)
│       ├── SharedModule
│       └── CustomerBillingModule
│
└── SharedModule
    ├── PrismaModule (+ tenant middleware)
    ├── RedisModule
    ├── StorageModule
    ├── AuditModule
    ├── EmailModule
    ├── CryptoModule
    ├── ConfigModule
    ├── JwtInfraModule
    ├── ThrottlerModule
    ├── CsrfModule
    ├── HealthModule
    ├── MetricsModule
    ├── RequestContextModule
    └── PaginationModule
```

### Key Changes

1. **No `forwardRef` anywhere** — all circular dependencies resolved
2. **Platform modules import SharedModule only** — no customer module imports
3. **Customer modules import SharedModule only** — no platform module imports
4. **Auth is standalone** — imports SharedModule + JwtInfraModule only
5. **Player imports customer modules read-only** — content delivery only
6. **Realtime is in SharedModule** — both platform and customer use it

---

## 5. Coupling Problems

### COUPLING-01: WorkspacesService is a God Service

**Current:** `WorkspacesService` at 1226 lines injects 6 services:
- `PrismaService`
- `WorkspaceAuthHelper`
- `MediaService` — creates demo media on workspace creation
- `ScreenHeartbeatService` — touches realtime on workspace operations
- `EmailService` — sends invitations
- `AuthService` — creates user accounts

**Problem:** This service is the hub of a dependency web. Any change to media, realtime, email, or auth ripples into workspaces.

**Resolution:** Split into:
- `WorkspaceCrudService` — pure CRUD
- `WorkspaceInvitationService` — invitations + email
- `WorkspaceBootstrapService` — demo content creation
- `WorkspaceMembershipService` — member management

### COUPLING-02: AuthService is Too Large

**Current:** `AuthService` at 1051 lines handles:
- Login (with 2FA)
- Registration (with OTP)
- Password reset
- Email verification
- Token issuance
- Token refresh
- Session management
- Impersonation
- Exit impersonation
- Profile building (`me` endpoint)
- Role change session revocation

**Problem:** Single Responsibility Principle violation. Impersonation logic in `AuthService` creates the Auth ↔ Admin coupling.

**Resolution:** Split into:
- `AuthCredentialsService` — login, register, password reset
- `AuthTokenService` — token issuance, refresh, session management
- `AuthImpersonationService` — impersonation + exit impersonation
- `AuthProfileService` — `me` endpoint, profile building

### COUPLING-03: AdminService Mixes Concerns

**Current:** `AdminService` at 995 lines handles:
- User listing
- Staff management
- Customer management
- Workspace management
- Subscription mocking
- Impersonation
- Global stats
- Platform settings
- Subscription reminders
- Fleet screens

**Problem:** This is a platform module that directly calls customer services (`WorkspacesService`, `SubscriptionsService`). It should go through a platform-facing interface.

**Resolution:** Split into 4-5 focused services (see `02-repository-impact.md`).

---

## 6. Shared Libraries Analysis

### Currently Shared (via @Global)

| Module | Shared Via | Problem? |
|---|---|---|
| `EmailModule` | `@Global()` | No — correct design |
| `PrismaModule` | Imported by AppModule | Should be `@Global()` for cleaner imports |
| `RedisModule` | Imported by AppModule | Should be `@Global()` |
| `StorageModule` | Imported by AppModule | OK as-is |

### Should Be Shared But Aren't

| Module | Currently | Should Be |
|---|---|---|
| `JwtModule` | Exported by `AuthModule` only | Extracted to `JwtInfraModule` in SharedModule |
| `AuditLogModule` | Imported by `AuthModule` and `AdminModule` | In SharedModule |
| `CryptoModule` | Imported by `AuthModule` | In SharedModule |

### Frontend Shared (Currently Zero)

| Package | Status | Action |
|---|---|---|
| `packages/ui` | Empty (`.gitkeep` only) | Extract 20+ components from `dashboard/src/components/ui/` |
| `packages/config` | Empty (`.gitkeep` only) | Extract `tsconfig.base.json`, `.prettierrc.json`, Tailwind config |
| `packages/api-ts` | Does not exist | Create with shared API types (response shapes, error codes) |
