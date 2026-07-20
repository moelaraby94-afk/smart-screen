# 08 — Frontend Architecture

> **Document Type:** Frontend Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Two independent Next.js applications, shared packages, routing, state, build

---

## 1. Current State

### 1.1 Single Dashboard Application

- **One Next.js app** (`apps/dashboard/`) serves both platform staff and customers
- **Route-based mode switching** — `/[locale]/(shell)/admin/*` for platform, `/[locale]/(shell)/*` for customer
- **Shared shell** — `CrystalShell` renders both admin sidebar items and customer sidebar items based on `isSuperAdmin`
- **Shared context** — `WorkspaceContext` includes `isSuperAdmin`, `impersonation` state, and workspace data
- **Shared API client** — `admin-api.ts` and customer API functions coexist in the same bundle
- **Admin code in customer bundle** — All admin components, guards, and API clients are bundled into the customer app

### 1.2 Problems

1. **Bundle bloat** — Customer users download admin code they never use
2. **Security surface** — Admin API functions exist in customer browser, even if not called
3. **Context confusion** — `WorkspaceContext` mixes platform and customer concerns
4. **Routing complexity** — `isSuperAdmin` checks scattered across layouts, shells, and guards
5. **No independent deployment** — Admin changes require full dashboard deployment
6. **No independent domain** — Both use same domain, no CORS separation
7. **Sidebar complexity** — One sidebar component handles two completely different navigation structures

---

## 2. Target Architecture

### 2.1 Two Independent Applications

```
┌───────────────────────────────────────────────────────┐
│                  FRONTEND ARCHITECTURE                  │
│                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐     │
│  │  Control Panel       │  │  Customer Workspace │     │
│  │  (apps/control-panel)│  │  (apps/workspace)   │     │
│  │                      │  │                     │     │
│  │  Domain:             │  │  Domain:            │     │
│  │  admin.cloudsignage  │  │  app.cloudsignage   │     │
│  │  .com                │  │  .com               │     │
│  │                      │  │                     │     │
│  │  API: /platform/*    │  │  API: /customer/*   │     │
│  │  Auth: /auth/*       │  │  Auth: /auth/*      │     │
│  │  (audience: platform)│  │  (audience: customer)│    │
│  │                      │  │                     │     │
│  │  Cookies:            │  │  Cookies:           │     │
│  │  __cp_access         │  │  __dash_access      │     │
│  │  __cp_refresh        │  │  __dash_refresh     │     │
│  └──────────┬───────────┘  └──────────┬──────────┘     │
│             │                         │                 │
│             │  ┌──────────────────┐   │                 │
│             │  │  Shared Packages  │   │                 │
│             └─►│  (packages/*)     │◄──┘                 │
│                │                   │                    │
│                │  packages/ui      │                    │
│                │  packages/api-ts  │                    │
│                │  packages/config  │                    │
│                └───────────────────┘                    │
└───────────────────────────────────────────────────────┘
```

### 2.2 Application Comparison

| Aspect | Control Panel | Customer Workspace |
|---|---|---|
| **Path** | `apps/control-panel/` | `apps/workspace/` |
| **Domain** | `admin.cloudsignage.com` | `app.cloudsignage.com` |
| **Users** | Platform staff | Customers |
| **Auth audience** | `platform` | `customer` |
| **API namespace** | `/platform/*` | `/customer/*` |
| **Cookie prefix** | `__cp_` | `__dash_` |
| **Session timeout** | 4 hours | 24 hours |
| **2FA** | Required | Optional |
| **Roles** | SUPER_ADMIN, SUPPORT, BILLING, SECURITY, OPERATIONS, DEVELOPER, VIEWER | OWNER, ADMIN, EDITOR, VIEWER |
| **i18n** | en, ar | en, ar |
| **Theme** | Dark + Light | Dark + Light |
| **Framework** | Next.js 14+ (App Router) | Next.js 14+ (App Router) |
| **Styling** | Tailwind CSS | Tailwind CSS |
| **UI Components** | shadcn/ui (shared) | shadcn/ui (shared) |
| **State** | React Context + SWR | React Context + SWR |
| **Realtime** | Socket.IO client | Socket.IO client |

---

## 3. Control Panel (`apps/control-panel/`)

### 3.1 Directory Structure

```
apps/control-panel/
├── public/
│   ├── logos/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── 2fa/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (shell)/
│   │   │   │   ├── dashboard/
│   │   │   │   ├── tenants/
│   │   │   │   ├── tenants/[id]/
│   │   │   │   ├── workspaces/
│   │   │   │   ├── subscriptions/
│   │   │   │   ├── plans/
│   │   │   │   ├── billing/
│   │   │   │   ├── invoices/
│   │   │   │   ├── fleet/
│   │   │   │   ├── monitoring/
│   │   │   │   ├── analytics/
│   │   │   │   ├── revenue/
│   │   │   │   ├── support/
│   │   │   │   ├── support/[ticketId]/
│   │   │   │   ├── staff/
│   │   │   │   ├── audit/
│   │   │   │   ├── settings/
│   │   │   │   ├── branding/
│   │   │   │   ├── security/
│   │   │   │   ├── feature-flags/
│   │   │   │   ├── backups/
│   │   │   │   ├── jobs/
│   │   │   │   ├── automation/
│   │   │   │   ├── marketplace/
│   │   │   │   ├── developer/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── auth/  (route handlers for cookie management)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── control-panel-shell.tsx
│   │   │   ├── control-sidebar.tsx
│   │   │   ├── control-header.tsx
│   │   │   └── control-breadcrumbs.tsx
│   │   ├── guards/
│   │   │   ├── platform-guard.tsx
│   │   │   └── role-guard.tsx
│   │   └── ui/  (shared from packages/ui, re-exported)
│   ├── features/
│   │   ├── dashboard/
│   │   ├── tenants/
│   │   ├── workspaces/
│   │   ├── subscriptions/
│   │   ├── plans/
│   │   ├── billing/
│   │   ├── fleet/
│   │   ├── monitoring/
│   │   ├── analytics/
│   │   ├── support/
│   │   ├── staff/
│   │   ├── audit/
│   │   ├── settings/
│   │   ├── branding/
│   │   ├── security/
│   │   ├── feature-flags/
│   │   ├── impersonation/
│   │   └── ...
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── auth-context.tsx
│   │   └── utils.ts
│   └── i18n/
│       ├── messages/
│       │   ├── en.json
│       │   └── ar.json
│       └── config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 3.2 Control Panel Shell

```
┌─────────────────────────────────────────────────────┐
│  [Cloud-Screen Control Panel]    🔔  👤 Admin User ▾ │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│  📊 Dash │  Breadcrumb: Dashboard                    │
│          │                                          │
│  TENANTS │  ┌────────────────────────────────────┐  │
│  🏢 Ten  │  │                                    │  │
│  🔄 Life │  │     Page Content                   │  │
│  🖥️ Wks  │  │                                    │  │
│          │  │                                    │  │
│  BILLING │  │                                    │  │
│  💳 Sub  │  │                                    │  │
│  📋 Plans│  │                                    │  │
│  🧾 Invo │  │                                    │  │
│  🏷️ Coup │  │                                    │  │
│          │  │                                    │  │
│  FLEET   │  │                                    │  │
│  📺 Scr  │  │                                    │  │
│  📊 Mon  │  │                                    │  │
│          │  │                                    │  │
│  SUPPORT │  │                                    │  │
│  🎫 Tix  │  │                                    │  │
│  🔄 Imp  │  │                                    │  │
│          │  │                                    │  │
│  SECURITY│  │                                    │  │
│  🔐 Sec  │  │                                    │  │
│  📝 Audit│  │                                    │  │
│          │  │                                    │  │
│  CONFIG  │  │                                    │  │
│  ⚙️ Set  │  │                                    │  │
│  🎨 Bran │  │                                    │  │
│  🚩 Flag │  │                                    │  │
│          │  │                                    │  │
│  ─────── │  │                                    │  │
│  🌐 EN|AR│  │                                    │  │
│  🌙 Theme│  │                                    │  │
│  🚪 Logout│  │                                    │  │
└──────────┴──────────────────────────────────────────┘
```

### 3.3 Control Panel Sidebar Navigation

| Section | Item | Route | Roles |
|---|---|---|---|
| **Main** | Dashboard | `/dashboard` | All |
| **Tenants** | Tenants | `/tenants` | All |
| | Lifecycle | `/lifecycle` | SUPER_ADMIN, OPERATIONS, VIEWER |
| | Workspaces | `/workspaces` | All |
| **Billing** | Subscriptions | `/subscriptions` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER |
| | Plans | `/plans` | SUPER_ADMIN, BILLING, VIEWER |
| | Invoices | `/invoices` | SUPER_ADMIN, SUPPORT, BILLING, VIEWER |
| | Coupons | `/coupons` | SUPER_ADMIN, BILLING, VIEWER |
| **Fleet** | Screens | `/fleet` | SUPER_ADMIN, OPERATIONS, SUPPORT, VIEWER |
| | Monitoring | `/monitoring` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER |
| **Insights** | Analytics | `/analytics` | SUPER_ADMIN, OPERATIONS, VIEWER |
| | Revenue | `/revenue` | SUPER_ADMIN, OPERATIONS, BILLING, VIEWER |
| **Support** | Tickets | `/support` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING |
| | Impersonation | `/impersonation` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT |
| **Staff** | Staff | `/staff` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER |
| **Security** | Security | `/security` | SUPER_ADMIN, OPERATIONS, SECURITY |
| | Audit Log | `/audit` | SUPER_ADMIN, OPERATIONS, SECURITY, SUPPORT, BILLING, VIEWER |
| **Config** | Settings | `/settings` | SUPER_ADMIN, OPERATIONS, SECURITY, VIEWER |
| | Branding | `/branding` | SUPER_ADMIN, OPERATIONS, VIEWER |
| | Feature Flags | `/feature-flags` | SUPER_ADMIN, OPERATIONS, SUPPORT, VIEWER |
| | Backups | `/backups` | SUPER_ADMIN, OPERATIONS, SECURITY |
| | Jobs | `/jobs` | SUPER_ADMIN, OPERATIONS |
| | Automation | `/automation` | SUPER_ADMIN, OPERATIONS |
| **Marketplace** | Apps | `/marketplace` | SUPER_ADMIN, DEVELOPER |
| **Developer** | API Keys | `/developer/api-keys` | SUPER_ADMIN, DEVELOPER |
| | OAuth Clients | `/developer/oauth` | SUPER_ADMIN, DEVELOPER |

---

## 4. Customer Workspace (`apps/workspace/`)

### 4.1 Directory Structure

```
apps/workspace/
├── public/
│   ├── logos/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── reset-password/
│   │   │   │   ├── impersonate/  (exchange token landing)
│   │   │   │   │   └── page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (shell)/
│   │   │   │   ├── overview/
│   │   │   │   ├── screens/
│   │   │   │   ├── screens/[id]/
│   │   │   │   ├── playlists/
│   │   │   │   ├── playlists/[id]/
│   │   │   │   ├── media/
│   │   │   │   ├── studio/
│   │   │   │   ├── templates/
│   │   │   │   ├── schedules/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── campaigns/[id]/
│   │   │   │   ├── analytics/
│   │   │   │   ├── proof-of-play/
│   │   │   │   ├── usage/
│   │   │   │   ├── team/
│   │   │   │   ├── settings/
│   │   │   │   ├── billing/
│   │   │   │   ├── api-keys/
│   │   │   │   ├── webhooks/
│   │   │   │   ├── integrations/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   └── auth/  (route handlers for cookie management)
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── workspace-shell.tsx
│   │   │   ├── workspace-sidebar.tsx
│   │   │   ├── workspace-header.tsx
│   │   │   ├── workspace-breadcrumbs.tsx
│   │   │   ├── workspace-switcher.tsx
│   │   │   └── impersonation-banner.tsx
│   │   ├── guards/
│   │   │   ├── auth-guard.tsx
│   │   │   ├── role-guard.tsx
│   │   │   └── workspace-guard.tsx
│   │   └── ui/  (shared from packages/ui, re-exported)
│   ├── features/
│   │   ├── overview/
│   │   ├── screens/
│   │   ├── media/
│   │   ├── studio/
│   │   ├── playlists/
│   │   ├── schedules/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   ├── team/
│   │   ├── settings/
│   │   ├── billing/
│   │   ├── onboarding/
│   │   ├── islamic/
│   │   ├── notifications/
│   │   ├── webhooks/
│   │   ├── api-keys/
│   │   ├── account/
│   │   ├── integrations/
│   │   ├── usage/
│   │   └── pairing/
│   ├── lib/
│   │   ├── api-client.ts
│   │   ├── workspace-context.tsx
│   │   └── utils.ts
│   └── i18n/
│       ├── messages/
│       │   ├── en.json
│       │   └── ar.json
│       └── config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.2 What Was Removed

The following are **completely absent** from the Customer Workspace:

- No `isSuperAdmin` check anywhere
- No `sovereign` mode
- No admin sidebar items
- No admin API client
- No admin components (overview, customers, staff, users, workspaces, fleet, logs, settings, feature-flags, health)
- No `SuperAdminGuard`
- No `cs_super_admin` sessionStorage
- No impersonation return button (replaced by impersonation banner)
- No platform API calls

### 4.3 Impersonation Banner

When a platform staff member is impersonating a customer, the Customer Workspace shows a banner:

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️ You are impersonating this customer.                  │
│  All actions are logged. [Return to Control Panel]        │
└──────────────────────────────────────────────────────────┘
```

- Banner is shown when JWT contains `impersonatedBy` claim
- "Return to Control Panel" calls `POST /auth/exit-impersonation`
- Backend issues platform exchange token → redirects to `admin.cloudsignage.com`
- Banner is always visible (cannot be dismissed)
- Color: Warning amber, high contrast

---

## 5. Shared Packages

### 5.1 `packages/ui`

Shared UI components built on shadcn/ui + Radix UI.

```
packages/ui/
├── src/
│   ├── button.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── dialog.tsx
│   ├── alert-dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── switch.tsx
│   ├── tabs.tsx
│   ├── toast.tsx
│   ├── tooltip.tsx
│   ├── skeleton.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   ├── table.tsx
│   ├── pagination.tsx
│   ├── avatar.tsx
│   ├── separator.tsx
│   ├── scroll-area.tsx
│   ├── progress.tsx
│   ├── spinner.tsx
│   ├── empty-state.tsx
│   ├── error-state.tsx
│   ├── data-table.tsx
│   ├── index.ts
│   └── lib/
│       └── utils.ts  (cn helper)
├── package.json
└── tsconfig.json
```

**Import:** `import { Button, Dialog } from '@cloud-screen/ui'`

### 5.2 `packages/api-ts`

Shared TypeScript types for API contracts.

```
packages/api-ts/
├── src/
│   ├── platform/
│   │   ├── tenants.ts
│   │   ├── subscriptions.ts
│   │   ├── plans.ts
│   │   ├── billing.ts
│   │   ├── support.ts
│   │   └── ...
│   ├── customer/
│   │   ├── screens.ts
│   │   ├── media.ts
│   │   ├── playlists.ts
│   │   ├── schedules.ts
│   │   ├── campaigns.ts
│   │   └── ...
│   ├── shared/
│   │   ├── auth.ts
│   │   ├── common.ts
│   │   └── pagination.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Import:** `import { Tenant, Subscription } from '@cloud-screen/api-ts'`

### 5.3 `packages/config`

Shared configuration (Tailwind preset, ESLint config, TypeScript base config).

```
packages/config/
├── tailwind-preset.ts
├── eslint-base.js
├── tsconfig.base.json
└── package.json
```

---

## 6. State Management

### 6.1 Control Panel State

| Context | Scope | Purpose |
|---|---|---|
| `AuthContext` | App | Current staff user, role, session |
| `PlatformContext` | Shell | Platform settings, branding, feature flags |
| `NotificationContext` | Shell | Platform notifications, WebSocket connection |

### 6.2 Customer Workspace State

| Context | Scope | Purpose |
|---|---|---|
| `AuthContext` | App | Current user, workspaces, session |
| `WorkspaceContext` | Shell | Selected workspace, role, settings |
| `NotificationContext` | Shell | User notifications, WebSocket connection |
| `ImpersonationContext` | Shell | Impersonation state (banner, exit handler) |

### 6.3 Data Fetching

- **SWR** for all data fetching (cache, revalidation, optimistic updates)
- **SWR keys** include workspace ID for cache isolation
- **Mutation** via SWR `mutate` with optimistic updates
- **Prefetching** on route hover (future)

---

## 7. Routing

### 7.1 Control Panel Routes

```
/[locale]/(auth)/login                    → Login page
/[locale]/(auth)/2fa                      → 2FA verification
/[locale]/(shell)/dashboard               → Platform dashboard
/[locale]/(shell)/tenants                 → Tenant list
/[locale]/(shell)/tenants/[id]            → Tenant profile
/[locale]/(shell)/workspaces              → Workspace oversight
/[locale]/(shell)/subscriptions           → Subscription list
/[locale]/(shell)/plans                   → Plan management
/[locale]/(shell)/billing                 → Billing center
/[locale]/(shell)/invoices                → Invoice list
/[locale]/(shell)/coupons                 → Coupon management
/[locale]/(shell)/fleet                   → Fleet overview
/[locale]/(shell)/monitoring              → System monitoring
/[locale]/(shell)/analytics               → Platform analytics
/[locale]/(shell)/revenue                 → Revenue analytics
/[locale]/(shell)/support                 → Support tickets
/[locale]/(shell)/support/[ticketId]      → Ticket detail
/[locale]/(shell)/staff                   → Staff management
/[locale]/(shell)/audit                   → Audit center
/[locale]/(shell)/settings                → Platform settings
/[locale]/(shell)/branding                → Branding
/[locale]/(shell)/security                → Security center
/[locale]/(shell)/feature-flags           → Feature flags
/[locale]/(shell)/backups                 → Backup management
/[locale]/(shell)/jobs                    → Job management
/[locale]/(shell)/automation              → Automation rules
/[locale]/(shell)/marketplace             → Marketplace
/[locale]/(shell)/developer               → Developer portal
```

### 7.2 Customer Workspace Routes

```
/[locale]/(auth)/login                    → Login
/[locale]/(auth)/register                 → Register
/[locale]/(auth)/forgot-password          → Forgot password
/[locale]/(auth)/reset-password           → Reset password
/[locale]/(auth)/impersonate              → Exchange token landing
/[locale]/(shell)/overview                → Dashboard
/[locale]/(shell)/screens                 → Screen list
/[locale]/(shell)/screens/[id]            → Screen detail
/[locale]/(shell)/playlists               → Playlist list
/[locale]/(shell)/playlists/[id]          → Playlist detail
/[locale]/(shell)/media                   → Media library
/[locale]/(shell)/studio                  → Studio editor
/[locale]/(shell)/templates               → Template gallery
/[locale]/(shell)/schedules               → Schedule calendar
/[locale]/(shell)/campaigns               → Campaign list
/[locale]/(shell)/campaigns/[id]          → Campaign detail
/[locale]/(shell)/analytics               → Analytics
/[locale]/(shell)/proof-of-play           → Proof of play
/[locale]/(shell)/usage                   → Usage dashboard
/[locale]/(shell)/team                    → Team management
/[locale]/(shell)/settings                → Workspace settings
/[locale]/(shell)/billing                 → Billing
/[locale]/(shell)/api-keys                → API keys
/[locale]/(shell)/webhooks                → Webhooks
/[locale]/(shell)/integrations            → Integrations
```

---

## 8. Build & Deployment

### 8.1 Independent Builds

| App | Build Command | Output |
|---|---|---|
| Control Panel | `npm run build --workspace=apps/control-panel` | `.next/` |
| Customer Workspace | `npm run build --workspace=apps/workspace` | `.next/` |
| Shared packages | Built as part of app build (transpiled) | — |

### 8.2 Independent Deployment

| App | Domain | CDN | Deploy Trigger |
|---|---|---|---|
| Control Panel | `admin.cloudsignage.com` | Cloudflare | Merge to `main` (control-panel changes) |
| Customer Workspace | `app.cloudsignage.com` | Cloudflare | Merge to `main` (workspace changes) |

### 8.3 Docker

```dockerfile
# Dockerfile.control-panel
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/control-panel

# Dockerfile.workspace
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build --workspace=apps/workspace
```

---

## 9. Migration Path

### 9.1 Phase 1: Extract Control Panel

1. Create `apps/control-panel/` with basic Next.js setup
2. Copy admin components, features, and API clients from `apps/dashboard/`
3. Update API client to use `/platform/*` routes
4. Update auth to use `audience: 'platform'` and `__cp_` cookies
5. Create Control Panel shell, sidebar, header
6. Deploy to `admin.cloudsignage.com`

### 9.2 Phase 2: Clean Customer Workspace

1. Rename `apps/dashboard/` to `apps/workspace/`
2. Remove all admin components, features, and API clients
3. Remove `isSuperAdmin`, `sovereign` mode, `SuperAdminGuard`
4. Update API client to use `/customer/*` routes
5. Update auth to use `audience: 'customer'` and `__dash_` cookies
6. Add impersonation banner
7. Add `/auth/impersonate` route for exchange token
8. Deploy to `app.cloudsignage.com`

### 9.3 Phase 3: Extract Shared Packages

1. Move UI components to `packages/ui/`
2. Move TypeScript types to `packages/api-ts/`
3. Move shared config to `packages/config/`
4. Update imports in both apps

---

## 10. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Two separate apps | Yes | Independent deployment, no bundle bloat, security isolation |
| Separate domains | Yes | CORS separation, independent cookies, CDN isolation |
| Shared UI package | Yes | Consistent design, DRY, single source of truth |
| Shared types package | Yes | API contract consistency, type safety |
| Next.js App Router | Yes | Server components, layouts, streaming |
| SWR for data fetching | Yes | Simple, cache-first, optimistic updates |
| Tailwind CSS | Yes | Utility-first, consistent, shared preset |
| shadcn/ui | Yes | Accessible, customizable, Radix-based |
| No Redux | Yes | Overkill for this scale, Context + SWR sufficient |
| No micro-frontends | Yes | Overkill, two Next.js apps is sufficient |
