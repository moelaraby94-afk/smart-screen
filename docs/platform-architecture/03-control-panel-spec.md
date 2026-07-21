# 03 — Control Panel Specification

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Platform Control Panel — full functional and technical specification

---

## 1. Current State

The Platform Control Panel currently exists as a set of routes within the Customer Dashboard application (`apps/dashboard`):

### 1.1 Current Admin Routes

| Route | File | Component |
|---|---|---|
| `/[locale]/admin` | `app/[locale]/(shell)/admin/page.tsx` | `AdminHomeOverviewClient` |
| `/[locale]/admin/customers` | `app/[locale]/(shell)/admin/customers/page.tsx` | `AdminCustomersClient` |
| `/[locale]/admin/customers/[id]` | `app/[locale]/(shell)/admin/customers/[id]/page.tsx` | `AdminCustomerProfileClient` |
| `/[locale]/admin/customers/[id]/workspaces/[wid]` | `app/[locale]/(shell)/admin/customers/[id]/workspaces/[wid]/page.tsx` | `AdminCustomerWorkspaceClient` |
| `/[locale]/admin/staff` | `app/[locale]/(shell)/admin/staff/page.tsx` | `AdminStaffClient` |
| `/[locale]/admin/users` | `app/[locale]/(shell)/admin/users/page.tsx` | `AdminUsersClient` |
| `/[locale]/admin/workspaces` | `app/[locale]/(shell)/admin/workspaces/page.tsx` | `AdminWorkspacesClient` |
| `/[locale]/admin/fleet` | `app/[locale]/(shell)/admin/fleet/page.tsx` | `AdminFleetClient` |
| `/[locale]/admin/screens` | `app/[locale]/(shell)/admin/screens/page.tsx` | `AdminScreensClient` |
| `/[locale]/admin/stats` | `app/[locale]/(shell)/admin/stats/page.tsx` | `AdminOverview` (stats view) |
| `/[locale]/admin/logs` | `app/[locale]/(shell)/admin/logs/page.tsx` | `AdminLogsClient` |
| `/[locale]/admin/settings` | `app/[locale]/(shell)/admin/settings/page.tsx` | `AdminSettingsClient` |
| `/[locale]/admin/feature-flags` | `app/[locale]/(shell)/admin/feature-flags/page.tsx` | `FeatureFlagsClient` |
| `/[locale]/admin/billing` | `app/[locale]/(shell)/admin/billing/page.tsx` | (billing view) |

### 1.2 Current Admin Layout

The admin section uses a dedicated layout at `app/[locale]/(shell)/admin/layout.tsx`:
- Server-side authentication check via `fetchAuthMeServer()`
- Redirects to `/login` if not authenticated
- Redirects to `/overview` if not `isSuperAdmin`
- Wraps children in `AdminSectionShell` → `SuperAdminGuard`

The `SuperAdminGuard` (`features/admin/super-admin-guard.tsx`) is a client-side guard that:
- Reads `isSuperAdmin` from `WorkspaceContext`
- Shows a loading spinner while auth state resolves
- Shows an "Access Denied" screen if not super admin
- Renders children if super admin

### 1.3 Current Admin Sidebar

The sidebar (`components/layout/shell-sidebar.tsx`) switches between "sovereign" (admin) and "workspace" (customer) mode based on the `sovereign` prop. In sovereign mode, the sidebar shows:

- **Admin Home** → `/admin`
- **Management Section:**
  - Customers → `/admin/customers`
  - Staff → `/admin/staff`
  - Users → `/admin/users`
- **System Section:**
  - Workspaces → `/admin/workspaces`
  - Fleet → `/admin/fleet`
  - Health → `/admin/health`
  - Logs → `/admin/logs`
  - Feature Flags → `/admin/feature-flags`

### 1.4 Current Admin API Layer

`features/admin/admin-api.ts` provides typed API calls:
- `fetchAdminStats()` → `GET /admin/stats`
- `fetchAdminWorkspaces()` → `GET /admin/workspaces`
- `mockWorkspacePlan()` → `PATCH /admin/workspaces/:id/subscription-mock`
- `fetchAdminUsers()` → `GET /admin/users`
- `updateAdminUser()` → `PATCH /admin/users/:id`
- `impersonateUser()` → `POST /admin/users/:id/impersonate`
- `exitImpersonation()` → `POST /auth/exit-impersonation`
- `fetchAdminStaff()` → `GET /admin/staff`
- `updateStaffRole()` → `PATCH /admin/staff/:id/role`
- `createStaff()` → `POST /admin/staff`
- `fetchAdminSettings()` → `GET /admin/settings`
- `updateAdminSettings()` → `PATCH /admin/settings`
- `uploadBrandingImage()` → `POST /admin/settings/branding/upload`
- `fetchAdminScreens()` → `GET /admin/screens`
- `fetchAdminFleetScreens()` → `GET /admin/fleet/screens`
- `fetchAdminLogs()` → `GET /admin/logs`
- `fetchAdminCustomers()` → `GET /admin/customers`
- `fetchAdminCustomer()` → `GET /admin/customers/:id`
- `updateCustomerSubscription()` → `PATCH /admin/customers/:id/subscription`

### 1.5 Current Backend Admin Endpoints

`AdminController` (`domains/admin/admin.controller.ts`) at `/admin`:

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/admin/users` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/staff` | SuperAdminDbGuard | — |
| POST | `/admin/staff` | SuperAdminDbGuard | — |
| PATCH | `/admin/staff/:id/role` | SuperAdminDbGuard | — |
| GET | `/admin/customers` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/customers/:id` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/customers/:cid/workspaces/:wid` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| POST | `/admin/customers/:id/workspaces` | PlatformStaffDbGuard (default) | — (super admin only) |
| PATCH | `/admin/customers/:cid/workspaces/:wid` | PlatformStaffDbGuard (default) | — (super admin only) |
| DELETE | `/admin/customers/:cid/workspaces/:wid` | SuperAdminDbGuard | — |
| PATCH | `/admin/customers/:id/subscription` | SuperAdminDbGuard | — |
| POST | `/admin/customers/:id/reminder` | PlatformStaffDbGuard (default) | — (super admin only) |
| GET | `/admin/workspaces` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| GET | `/admin/fleet/screens` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| GET | `/admin/screens` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| PATCH | `/admin/workspaces/:id/subscription-mock` | SuperAdminDbGuard | — |
| GET | `/admin/stats` | PlatformStaffDbGuard | BILLING_MANAGER |
| GET | `/admin/logs` | PlatformStaffDbGuard (default) | — (super admin only) |
| GET | `/admin/settings` | PlatformStaffDbGuard (default) | — (super admin only) |
| PATCH | `/admin/settings` | SuperAdminDbGuard | — |
| POST | `/admin/settings/branding/upload` | SuperAdminDbGuard | — |
| PATCH | `/admin/users/:id` | SuperAdminDbGuard | — |
| POST | `/admin/users/:id/impersonate` | SuperAdminDbGuard | — |

Additional platform endpoints:
- `GET/PATCH /admin/feature-flags/*` — `FeatureFlagsController` (SuperAdminDbGuard)
- `GET /branding` — `BrandingController` (public)
- `GET /branding/file/:variant` — `BrandingController` (public)

---

## 2. Problems

### 2.1 No Dedicated Admin Layout

The admin section reuses the `CrystalShell` layout with a `sovereign` flag. This means:
- The admin section inherits the customer dashboard's header, breadcrumbs, and page transition components
- The `WorkspaceGate` component wraps admin pages even though admin pages don't need workspace context
- The `WorkspaceSwitcher` is hidden but its code is still loaded
- The `ImpersonationReturnButton` is rendered in the shared layout, coupling it to the admin feature

### 2.2 No Dedicated Auth Context

The admin section uses `WorkspaceContext` for authentication state (`isAuthenticated`, `isSuperAdmin`, `isLoading`). This context is designed for customer workspace management, not platform staff management. It loads workspace lists, workspace stats, and workspace data — none of which are needed in the admin section.

### 2.3 Admin Settings in File System

`admin-runtime.store.ts` persists platform settings in `.data/admin-runtime.json`:
- Not shared across backend instances
- No transactional safety
- No audit trail for settings changes
- Not backed up with the database
- Race condition risk on concurrent writes

### 2.4 No Pagination on Admin Lists

`AdminService.listUsers()` uses `ADMIN_LIST_CAP = 1000` as a hard limit. There is no pagination, filtering, or sorting at the database level. All filtering happens in memory after fetching. This will not scale beyond a few hundred customers.

### 2.5 Staff Management Uses Workspace Membership

`AdminService.createStaff()` creates a workspace named "Admin Control" and adds staff as members. This conflates platform staff management with customer workspace management. Staff users have both `isSuperAdmin`/`platformStaffRole` fields and workspace memberships, creating ambiguity about their identity.

### 2.6 No Dedicated Admin Middleware

The admin section shares the same middleware stack as customer routes:
- Same rate limiter (global ThrottlerGuard)
- Same CORS policy
- Same helmet configuration
- Same cookie parser
- Same static asset serving

There is no way to apply stricter security policies (e.g., IP allowlisting, shorter session timeouts) to admin routes without affecting customer routes.

---

## 3. Target Architecture

### 3.1 Application Structure

```
apps/control-panel/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   └── login/
│   │   │   │       └── page.tsx          # Platform staff login
│   │   │   ├── (panel)/
│   │   │   │   ├── layout.tsx            # ControlPanelShell layout
│   │   │   │   ├── page.tsx              # Dashboard home (stats)
│   │   │   │   ├── customers/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── workspaces/
│   │   │   │   │           └── [wid]/
│   │   │   │   │               └── page.tsx
│   │   │   │   ├── staff/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── workspaces/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── fleet/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── screens/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── stats/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── logs/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── feature-flags/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── billing/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── health/
│   │   │   │       └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── auth/
│   │   │       └── exchange/
│   │   │           └── route.ts          # Token exchange for impersonation
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── panel-sidebar.tsx         # Dedicated admin sidebar
│   │   │   ├── panel-header.tsx          # Dedicated admin header
│   │   │   └── panel-shell.tsx           # Dedicated admin shell
│   │   ├── branding-context.tsx          # Branding provider (shared)
│   │   └── ui/                           # Re-export from packages/ui
│   ├── features/
│   │   ├── auth/
│   │   │   ├── session.ts                # Token management (platform audience)
│   │   │   └── platform-context.tsx      # Platform auth context
│   │   ├── customers/                    # Customer management
│   │   ├── staff/                        # Staff management
│   │   ├── users/                        # User management
│   │   ├── workspaces/                   # Workspace oversight
│   │   ├── fleet/                        # Global fleet
│   │   ├── stats/                        # Platform statistics
│   │   ├── logs/                         # Audit logs
│   │   ├── settings/                     # Platform settings
│   │   ├── feature-flags/                # Feature flag management
│   │   └── billing/                      # Platform billing
│   ├── i18n/
│   │   ├── messages/
│   │   │   ├── en.json
│   │   │   └── ar.json
│   │   └── config.ts
│   └── lib/
│       ├── api-client.ts                 # Configured fetch for platform API
│       └── utils.ts
├── public/
├── next.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

### 3.2 Control Panel Shell

The `ControlPanelShell` replaces `CrystalShell` for the admin application:

- **No `WorkspaceContext`**: Uses a dedicated `PlatformContext` that manages platform staff auth state only
- **No `WorkspaceSwitcher`**: Not applicable
- **No `WorkspaceGate`**: Not applicable
- **Dedicated sidebar**: Always shows admin navigation (no `sovereign` toggle)
- **Dedicated header**: Shows platform branding, staff name, and logout
- **Impersonation return button**: Shown only when impersonating, redirects back to Control Panel

### 3.3 Platform Context

```typescript
type PlatformContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  staffId: string | null;
  staffEmail: string | null;
  staffName: string | null;
  platformStaffRole: PlatformStaffRole | null;
  isSuperAdmin: boolean;
  impersonatedBy: string | null; // null in Control Panel; only set in Customer Dashboard
};
```

This context does NOT load workspace lists, workspace stats, or workspace data. It only manages the platform staff identity.

### 3.4 Authentication Flow

1. Platform staff navigates to `admin.smartscreen.com/[locale]/login`
2. Login form posts to `POST /api/v1/auth/login` with `audience: 'platform'` in the request body
3. Backend validates credentials, checks `isSuperAdmin` or `platformStaffRole` is set
4. Backend issues JWT with `audience: 'platform'` claim
5. Control Panel stores tokens in HTTP-only cookies
6. All subsequent API calls include the JWT; backend validates `audience: 'platform'` for `/admin/*` routes

### 3.5 Feature Set

The Control Panel provides the following features:

#### 3.5.1 Dashboard Home
- Global stats: revenue, active customers, connected screens, system health
- Server metrics: load average, memory usage, hostname
- Quick links to all management sections

#### 3.5.2 Customer Management
- List all customers with search and filter (all/active/expired/trial)
- View customer profile: contact info, subscription status, lifecycle, workspaces, usage stats
- View customer workspace detail: screens list
- Create workspace for customer
- Update workspace name
- Delete workspace (super admin only)
- Patch customer subscription (super admin only)
- Send subscription reminder email

#### 3.5.3 Staff Management (Super Admin Only)
- List all platform staff
- Create new staff member (sets `isSuperAdmin` or `platformStaffRole`)
- Update staff role

#### 3.5.4 User Management
- List all users (customers + staff)
- Update user: full name, active status, super admin flag, platform staff role, subscription status, subscription end date
- Impersonate user (super admin only)

#### 3.5.5 Workspace Oversight
- List all workspaces with owner info, screen count, media count, storage, subscription
- Mock workspace subscription plan (super admin only, dev/staging only)

#### 3.5.6 Global Fleet
- List all screens across all workspaces
- Screen status, player platform, player version, offline cache mode

#### 3.5.7 Platform Statistics
- Revenue figures (from payment records)
- Active users, active customers, total workspaces
- Screen status breakdown (online/offline/maintenance)
- Storage usage and quota
- Pairing pending count
- Realtime socket connections
- Server health metrics

#### 3.5.8 Audit Logs
- Cross-tenant audit trail
- Impersonation events with actor, target, IP

#### 3.5.9 Platform Settings (Super Admin Only)
- Platform name, support email, default language
- Maintenance mode toggle
- Logo upload (4 variants: EN/AR × Light/Dark)
- Branding epoch for cache-busting

#### 3.5.10 Feature Flags (Super Admin Only)
- List all feature flags across all workspaces
- View flags for specific workspace
- Toggle module flags per workspace

#### 3.5.11 Platform Billing
- Revenue overview
- Payment records

#### 3.5.12 System Health
- Backend health check
- Database latency
- Redis connectivity
- Storage service status

---

## 4. Recommended Solution

### 4.1 Create `apps/control-panel`

Initialize a new Next.js application in the monorepo with:
- App Router (matching the dashboard)
- `next-intl` for i18n (shared configuration)
- TailwindCSS (shared configuration)
- `packages/ui` for shared components
- Dedicated `PlatformContext` for auth state

### 4.2 Copy Admin Features

Copy all files from `apps/dashboard/src/features/admin/` to `apps/control-panel/src/features/`. Adapt imports:
- Replace `@/features/workspace/workspace-context` with `@/features/auth/platform-context`
- Replace `@/features/auth/session` with `@/lib/api-client`
- Keep `@/components/ui/*` imports (will resolve to `packages/ui`)

### 4.3 Copy Admin Routes

Copy all files from `apps/dashboard/src/app/[locale]/(shell)/admin/` to `apps/control-panel/src/app/[locale]/(panel)/`. Adapt:
- Replace `AdminSectionShell` with `ControlPanelShell`
- Remove `SuperAdminGuard` (replaced by server-side layout check)
- Update layout to use `PlatformContext` instead of `WorkspaceContext`

### 4.4 Dedicated Login Page

Create a dedicated login page at `apps/control-panel/src/app/[locale]/(auth)/login/page.tsx`:
- Same login form as the customer dashboard
- Adds `audience: 'platform'` to the login request
- Backend rejects login if user is not `isSuperAdmin` and has no `platformStaffRole`
- Redirects to `/(panel)/` on success

### 4.5 Platform Settings Migration

Create a `PlatformSettings` model in Prisma (documented in `09-database-impact.md`). Replace `admin-runtime.store.ts` with a `PlatformSettingsService` that reads from the database.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Platform staff locked out if Control Panel is down | High | Deploy Control Panel with health checks and auto-restart. Keep customer dashboard login as a fallback during transition. |
| Duplicate i18n messages drift | Medium | Extract shared messages to a common package. Use a script to sync. |
| Shared UI components change breaks Control Panel | Medium | Version `packages/ui` and pin in both apps. Run both test suites on UI changes. |
| Platform staff login flow differs from customer | Low | Document the difference. The login form is identical; only the `audience` parameter differs. |
| Admin API calls blocked by CORS | Medium | Ensure `ALLOWED_ORIGINS` includes the Control Panel URL. Test in staging. |

---

## 6. Alternatives

### 6.1 Keep Admin in Dashboard, Add Stronger Guards

Do not create a separate application. Instead, add server-side route guards and a dedicated middleware for admin routes.

**Pros:** No new application, no deployment changes.
**Cons:** Does not solve independent deployment, scaling, or bundle size issues. Does not solve shared auth context coupling.

**Verdict:** Rejected as final state. Acceptable as an interim during Phase 1.

### 6.2 Use a Commercial Admin Template

Use a commercial admin dashboard template (e.g., Tremor, Refine) for the Control Panel.

**Pros:** Faster development, professional UI.
**Cons:** Different design system from the customer dashboard, maintenance burden, licensing cost.

**Verdict:** Rejected. The existing admin UI is already well-designed. Reusing it in a separate application is more efficient.

---

## 7. Migration Notes

- **Phase 1:** Copy admin files to `apps/control-panel`. Both dashboard and Control Panel serve admin routes. Use DNS or environment variable to control which one is used.
- **Phase 2:** Add JWT audience claims. Control Panel login requests `audience: 'platform'`.
- **Phase 3:** Remove admin routes from `apps/dashboard`. Dashboard redirects `/admin/*` to `admin.smartscreen.com`.
- **Phase 4:** Migrate platform settings from file to database.

**Key files to copy:**
- `apps/dashboard/src/features/admin/*` → `apps/control-panel/src/features/*`
- `apps/dashboard/src/app/[locale]/(shell)/admin/*` → `apps/control-panel/src/app/[locale]/(panel)/*`
- `apps/dashboard/src/components/layout/shell-sidebar.tsx` (sovereign section only) → `apps/control-panel/src/components/layout/panel-sidebar.tsx`
- `apps/dashboard/src/features/dashboard/admin-overview.tsx` → `apps/control-panel/src/features/stats/`

**Key files NOT to copy:**
- `apps/dashboard/src/features/workspace/*` — not needed
- `apps/dashboard/src/components/crystal-shell.tsx` — replaced by `ControlPanelShell`
- `apps/dashboard/src/features/workspace/workspace-gate.tsx` — not needed

---

## 8. Open Questions

1. **Should the Control Panel support 2FA?** The backend already has 2FA in `AuthService`. Should platform staff be required to use 2FA?
2. **Should the Control Panel have its own session timeout?** Platform staff sessions could expire faster than customer sessions for security.
3. **Should the Control Panel support API keys for automation?** Platform staff might need API access for scripting (e.g., bulk customer management).
4. **Should the Control Panel have a dedicated health/metrics dashboard** or reuse the backend's `/health` endpoint?
5. **Should the "Admin Control" workspace pattern be removed?** Currently, staff are added to a workspace named "Admin Control". This is a workaround that conflates customer and platform concepts.

---

## 9. Final Recommendation

Create `apps/control-panel` as a dedicated Next.js application with its own shell, auth context, and login page. Copy the existing admin features and routes with minimal modifications. The primary change is replacing `WorkspaceContext` with `PlatformContext` and removing the `sovereign` toggle logic.

The Control Panel should be deployed to `admin.smartscreen.com` with independent CI/CD, scaling, and monitoring. It should have its own login page that requests `audience: 'platform'` tokens from the backend.

The existing admin UI components are well-built and should be reused as-is. The main work is extraction and context replacement, not redesign.
