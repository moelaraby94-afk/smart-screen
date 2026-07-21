# 04 — Customer Panel Specification

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Customer Dashboard — full functional and technical specification after separation

---

## 1. Current State

The Customer Dashboard (`apps/dashboard`) is a Next.js App Router application serving both customer-facing routes and admin routes. After separation, it becomes a pure customer-facing application.

### 1.1 Current Customer Routes

| Route | File | Feature Module |
|---|---|---|
| `/[locale]/overview` | `app/[locale]/(shell)/overview/page.tsx` | `features/dashboard/` |
| `/[locale]/screens/*` | `app/[locale]/(shell)/screens/` | `features/screens/` |
| `/[locale]/content/playlists` | `app/[locale]/(shell)/content/playlists/` | `features/playlists/` |
| `/[locale]/content/media` | `app/[locale]/(shell)/content/media/` | `features/media/` |
| `/[locale]/content/templates` | `app/[locale]/(shell)/content/templates/` | — |
| `/[locale]/scheduling` | `app/[locale]/(shell)/scheduling/` | `features/schedules/` |
| `/[locale]/schedules/*` | `app/[locale]/(shell)/schedules/` | `features/schedules/` |
| `/[locale]/campaigns` | `app/[locale]/(shell)/campaigns/` | `features/campaigns/` |
| `/[locale]/analytics` | `app/[locale]/(shell)/analytics/` | `features/analytics/` |
| `/[locale]/team` | `app/[locale]/(shell)/team/` | `features/team/` |
| `/[locale]/settings/*` | `app/[locale]/(shell)/settings/` | `features/settings/` |
| `/[locale]/billing/*` | `app/[locale]/(shell)/billing/` | `features/billing/` |
| `/[locale]/branches/*` | `app/[locale]/(shell)/branches/` | `features/branches/` |
| `/[locale]/api-docs` | `app/[locale]/(shell)/api-docs/` | `features/api-docs/` |
| `/[locale]/audit-log` | `app/[locale]/(shell)/audit-log/` | `features/audit-log/` |
| `/[locale]/notifications` | `app/[locale]/(shell)/notifications/` | `features/notifications/` |
| `/[locale]/help` | `app/[locale]/(shell)/help/` | `features/help/` |
| `/[locale]/emergency` | `app/[locale]/(shell)/emergency/` | — |
| `/[locale]/ai` | `app/[locale]/(shell)/ai/` | — |
| `/[locale]/studio` | `app/[locale]/(shell)/studio/` | `features/studio/` |
| `/[locale]/proof-of-play` | `app/[locale]/(shell)/proof-of-play/` | — |
| `/[locale]/displays` | `app/[locale]/(shell)/displays/` | — |
| `/[locale]/templates` | `app/[locale]/(shell)/templates/` | — |

### 1.2 Current Auth Routes

| Route | Purpose |
|---|---|
| `/[locale]/login` | Email + password login |
| `/[locale]/register` | New customer registration |
| `/[locale]/forgot-password` | Password reset request |
| `/[locale]/invite` | Workspace invite acceptance |
| `/[locale]/privacy` | Privacy policy |
| `/[locale]/terms` | Terms of service |

### 1.3 Current Shell Architecture

The `CrystalShell` component (`components/crystal-shell.tsx`) provides:
- `ShellSidebar` — switches between admin ("sovereign") and customer ("workspace") navigation
- `ShellHeader` — page title, workspace switcher, search, notifications, user menu
- `Breadcrumbs` — route-based breadcrumb navigation
- `WorkspaceGate` — blocks navigation until a workspace is selected
- `ImpersonationReturnButton` — shown when a super admin is impersonating
- `PageTransition` — Framer Motion page transitions

### 1.4 Current Workspace Context

`WorkspaceContext` (`features/workspace/workspace-context.tsx`) manages:
- Authentication state (`isAuthenticated`, `isLoading`)
- User identity (`userEmail`, `userFullName`, `businessName`, `isSuperAdmin`)
- Workspace list (`workspaces`, `workspaceId`, `workspaceDataEpoch`)
- Workspace switching
- Impersonation state (`impersonatedBySuperAdminId`)

This context is the backbone of the customer dashboard. After separation, it will no longer need to handle `isSuperAdmin` or `impersonatedBySuperAdminId` as primary state — these become edge cases handled only during impersonation.

---

## 2. Problems

### 2.1 Admin Code in Customer Bundle

Even with lazy loading, the admin feature code is part of the dashboard's build. Next.js code-splits by route, but shared dependencies (e.g., `admin-api.ts` types, `SuperAdminGuard`) may be included in common chunks. This increases bundle size for customer users who never visit admin routes.

### 2.2 Sovereign Logic in Shell

The `CrystalShell` component calculates `sovereign` based on:
```typescript
const pathIsAdmin = Boolean(pathname?.startsWith(`/${navLocale}/admin`));
const sovereign = !isImpersonating &&
  (pathIsAdmin || isSuperAdmin || (isLoading && hintSuperAdmin));
```

This logic runs on every page render for every user. It checks `isSuperAdmin` from `WorkspaceContext`, which means the customer dashboard's shell is aware of platform staff concepts. After separation, this logic should not exist in the customer dashboard.

### 2.3 Impersonation State in Workspace Context

`WorkspaceContext` manages `impersonatedBySuperAdminId`. This is a platform concept that leaks into the customer dashboard. After separation, impersonation should be handled differently:
- The Control Panel initiates impersonation and redirects to the Customer Dashboard
- The Customer Dashboard receives a one-time exchange token
- The Customer Dashboard exchanges it for customer-audience tokens
- The Customer Dashboard shows an "impersonation banner" but does not manage the impersonation state itself — it simply reads the `impersonatedBy` claim from the JWT

### 2.4 Shared Session Storage

The `cs_super_admin` sessionStorage key is read in `CrystalShell` to pre-render the admin sidebar before the auth state resolves. This is a platform concept in the customer dashboard's code. After separation, this key should not exist in the customer dashboard.

### 2.5 No Workspace-Free Navigation

The sidebar has a `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` set that allows certain routes without a selected workspace. This is a workaround for the fact that some features (analytics, audit log, notifications) are account-level, not workspace-level. After separation, this should be formalized as "account-level routes" vs. "workspace-level routes."

---

## 3. Target Architecture

### 3.1 Application Structure (After Separation)

```
apps/dashboard/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── forgot-password/
│   │   │   │   ├── invite/
│   │   │   │   ├── privacy/
│   │   │   │   ├── terms/
│   │   │   │   └── impersonate/          # NEW: exchange token → session
│   │   │   │       └── page.tsx
│   │   │   ├── (shell)/
│   │   │   │   ├── layout.tsx            # Simplified shell (no sovereign)
│   │   │   │   ├── overview/
│   │   │   │   ├── screens/
│   │   │   │   ├── content/
│   │   │   │   │   ├── playlists/
│   │   │   │   │   ├── media/
│   │   │   │   │   └── templates/
│   │   │   │   ├── scheduling/
│   │   │   │   ├── schedules/
│   │   │   │   ├── campaigns/
│   │   │   │   ├── analytics/
│   │   │   │   ├── team/
│   │   │   │   ├── settings/
│   │   │   │   ├── billing/
│   │   │   │   ├── branches/
│   │   │   │   ├── api-docs/
│   │   │   │   ├── audit-log/
│   │   │   │   ├── notifications/
│   │   │   │   ├── help/
│   │   │   │   ├── emergency/
│   │   │   │   ├── ai/
│   │   │   │   ├── studio/
│   │   │   │   ├── proof-of-play/
│   │   │   │   ├── displays/
│   │   │   │   └── templates/
│   │   │   │   # NOTE: /admin/* routes REMOVED
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── shell-sidebar.tsx         # Simplified (no sovereign mode)
│   │   │   ├── shell-header.tsx
│   │   │   └── crystal-shell.tsx         # Simplified (no sovereign, no hintSuperAdmin)
│   │   └── ui/                           # Re-export from packages/ui
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── screens/
│   │   ├── media/
│   │   ├── playlists/
│   │   ├── schedules/
│   │   ├── campaigns/
│   │   ├── analytics/
│   │   ├── team/
│   │   ├── settings/
│   │   ├── billing/
│   │   ├── branches/
│   │   ├── workspace/
│   │   ├── onboarding/
│   │   ├── notifications/
│   │   ├── islamic/
│   │   ├── search/
│   │   ├── api/
│   │   ├── api-docs/
│   │   ├── audit-log/
│   │   ├── content/
│   │   ├── help/
│   │   └── studio/
│   │   # NOTE: features/admin/ REMOVED
│   ├── i18n/
│   └── lib/
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

### 3.2 Simplified Shell

After separation, `CrystalShell` is simplified:

**Removed:**
- `sovereign` prop and all sovereign-related logic
- `hintSuperAdmin` state and `cs_super_admin` sessionStorage read
- `pathIsAdmin` check
- `shellNavLoading` calculation based on `isSuperAdmin`
- `ImpersonationReturnButton` import (replaced by a simpler `ImpersonationBanner`)

**Added:**
- `ImpersonationBanner` — a thin banner shown when `impersonatedBy` is present in the JWT, with a "Return to Control Panel" link that redirects to `admin.smartscreen.com`

**Kept:**
- `ShellSidebar` — always renders customer navigation (no sovereign branch)
- `ShellHeader` — workspace switcher, search, notifications, user menu
- `Breadcrumbs`
- `WorkspaceGate`
- `PageTransition`

### 3.3 Simplified Workspace Context

**Removed:**
- `isSuperAdmin` state (no longer needed in customer dashboard)
- `writeStoredSuperAdminHint()` / `readStoredSuperAdminHint()` functions
- `cs_super_admin` sessionStorage key usage

**Kept:**
- `isAuthenticated`, `isLoading`
- `userEmail`, `userFullName`, `businessName`
- `workspaces`, `workspaceId`, `workspaceDataEpoch`
- `impersonatedBySuperAdminId` — kept but simplified; read from JWT `impersonatedBy` claim, not from a separate API call

### 3.4 Impersonation Flow (Inbound)

When a super admin impersonates a customer from the Control Panel:

1. Control Panel calls `POST /api/v1/admin/users/:id/impersonate`
2. Backend issues a one-time exchange token (stored in Redis with 30s TTL)
3. Control Panel redirects browser to `app.smartscreen.com/[locale]/auth/impersonate?token=EXCHANGE_TOKEN`
4. Customer Dashboard's `/auth/impersonate` page calls `POST /api/v1/auth/exchange-impersonation` with the exchange token
5. Backend validates the exchange token, issues customer-audience access + refresh tokens with `impersonatedBy` claim
6. Customer Dashboard sets cookies and redirects to `/overview`
7. `ImpersonationBanner` is shown (reads `impersonatedBy` from JWT)
8. "Return to Control Panel" link redirects to `admin.smartscreen.com` and calls `POST /auth/exit-impersonation` (which reissues platform-audience tokens — but this happens via the Control Panel's own exit flow)

### 3.5 Authentication Flow

1. Customer navigates to `app.smartscreen.com/[locale]/login`
2. Login form posts to `POST /api/v1/auth/login` with `audience: 'customer'` (or no audience — backward compatible)
3. Backend validates credentials
4. Backend issues JWT with `audience: 'customer'` claim
5. Dashboard stores tokens in HTTP-only cookies
6. All subsequent API calls include the JWT; backend validates `audience: 'customer'` for customer routes

### 3.6 Feature Set

The Customer Dashboard provides:

#### 3.6.1 Overview / Dashboard
- Workspace summary: screen count, playlist count, media count
- Recent activity feed
- Onboarding widget (if not completed)

#### 3.6.2 Screens Management
- List screens with status, location, last seen
- Create, edit, delete screens
- Remote commands (restart, refresh, screenshot)
- Playlist assignments and reordering
- Override playlist
- Active content view
- Screen analytics
- Pairing flow (claim pairing session)

#### 3.6.3 Content Management
- **Playlists:** CRUD, items management, duplicate, clone to workspace, playlist groups
- **Media:** Upload, list, folders, move, expiry, stats, URL generation
- **Templates:** (if feature flag enabled)
- **Studio:** Canvas editor (create, edit, versions, restore)

#### 3.6.4 Scheduling
- Schedule CRUD
- Overlap detection
- Calendar view

#### 3.6.5 Campaigns
- Campaign CRUD with approval workflow (draft → submit → approve/reject → publish → pause/resume → end)
- Campaign history

#### 3.6.6 Analytics
- Screen analytics
- Proof of play
- Workspace-level metrics

#### 3.6.7 Team Management
- List workspace members
- Invite members
- Update member roles
- Remove members
- Account-level members (cross-workspace)

#### 3.6.8 Settings
- Workspace settings (name, slug)
- Profile settings (full name, business name, phone, country, city)
- Email change (request + verify)
- Security (2FA, password change)
- API keys management
- Webhooks management
- Islamic features (prayer times, Ramadan)
- Notifications preferences

#### 3.6.9 Billing
- Current subscription plan
- Stripe checkout (upgrade plan)
- Stripe billing portal
- Invoice download
- Mock plan (dev/staging only)

#### 3.6.10 Branches (Multi-Workspace)
- List account workspaces
- Create new workspace
- Switch workspace
- Workspace-specific views

#### 3.6.11 Account-Level Features
- API documentation
- Audit log (workspace-scoped)
- Notifications (user-scoped)
- Help
- Emergency controls
- AI features (if enabled)
- Global search

---

## 4. Recommended Solution

### 4.1 Remove Admin Routes (Phase 3)

After the Control Panel is fully operational:
1. Delete `apps/dashboard/src/app/[locale]/(shell)/admin/` directory
2. Delete `apps/dashboard/src/features/admin/` directory
3. Add a redirect in `next.config.ts` or middleware: `/[locale]/admin/*` → `https://admin.smartscreen.com/[locale]/admin/*`
4. Remove `sovereign` logic from `CrystalShell` and `ShellSidebar`
5. Remove `isSuperAdmin` from `WorkspaceContext`
6. Remove `cs_super_admin` sessionStorage usage
7. Remove `ImpersonationReturnButton` and replace with `ImpersonationBanner`

### 4.2 Add Impersonation Exchange Route

Create `apps/dashboard/src/app/[locale]/(auth)/impersonate/page.tsx`:
- Reads `token` query parameter
- Calls `POST /api/v1/auth/exchange-impersonation` with the token
- On success: sets cookies, redirects to `/overview`
- On failure: shows error, redirects to `/login`

### 4.3 Simplify Sidebar

Remove the `sovereign ? (admin nav) : (customer nav)` conditional. The sidebar always renders customer navigation. Remove the `sovereign` prop from `ShellSidebar`.

### 4.4 Extract Shared Packages

Before the separation is complete, extract shared code:
- `packages/ui` — UI components (Button, Card, Dialog, etc.)
- `packages/config` — Shared configuration (i18n, tailwind, eslint)
- `packages/api-client` — `apiFetch` utility, token management

Both `apps/dashboard` and `apps/control-panel` import from these packages.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Removing admin routes breaks existing super admin bookmarks | Medium | Add redirect from `/admin/*` to Control Panel URL. Document the change. |
| Impersonation exchange token expires before redirect | Medium | Use 30s TTL and handle expiry gracefully with a retry link. |
| `WorkspaceContext` changes break customer features | High | Test all customer features after removing `isSuperAdmin`. The flag should not be used in customer-only code paths. |
| Shared packages version drift | Medium | Use exact version pinning. Run both apps' tests on package changes. |
| Customer dashboard login rejects platform staff | Low | This is intentional. Platform staff use the Control Panel login. Document this. |

---

## 6. Alternatives

### 6.1 Keep Admin Routes in Dashboard (No Separation)

Do not remove admin routes. Only add stronger guards.

**Pros:** No breaking changes, no redirect needed.
**Cons:** Does not achieve the separation goal. All coupling problems remain.

**Verdict:** Rejected. The entire purpose of the architecture study is to separate the two panels.

### 6.2 Merge Customer Dashboard with Player

Combine the customer dashboard and player into a single application.

**Pros:** Fewer applications to maintain.
**Cons:** The player is a kiosk application with fundamentally different UX (fullscreen, no navigation, no auth). Merging would add complexity.

**Verdict:** Rejected. The player should remain separate.

---

## 7. Migration Notes

- **Phase 1:** Control Panel is created with copied admin code. Dashboard keeps admin routes. Both work.
- **Phase 2:** JWT audience claims are added. Dashboard login requests `audience: 'customer'`.
- **Phase 3:** Admin routes are removed from the dashboard. Redirect is added. `CrystalShell` is simplified.
- **Phase 4:** `WorkspaceContext` is cleaned up. `isSuperAdmin` and related code are removed.

**Files to modify in Phase 3:**
- `apps/dashboard/src/components/crystal-shell.tsx` — remove sovereign logic
- `apps/dashboard/src/components/layout/shell-sidebar.tsx` — remove sovereign branch
- `apps/dashboard/src/features/workspace/workspace-context.tsx` — remove `isSuperAdmin`
- `apps/dashboard/src/features/workspace/workspace-context.tsx` — remove `writeStoredSuperAdminHint` / `readStoredSuperAdminHint`
- `apps/dashboard/src/app/[locale]/(shell)/admin/` — delete directory
- `apps/dashboard/src/features/admin/` — delete directory
- `apps/dashboard/next.config.ts` — add redirect for `/admin/*`

**Files to create:**
- `apps/dashboard/src/app/[locale]/(auth)/impersonate/page.tsx` — exchange token handler
- `apps/dashboard/src/components/impersonation-banner.tsx` — thin banner for impersonated sessions

---

## 8. Open Questions

1. **Should the Customer Dashboard show a "Platform Maintenance" banner** when the `maintenanceMode` setting is enabled? Currently, this setting exists but its enforcement is unclear.
2. **Should the Customer Dashboard handle session timeout differently** after separation? Customer sessions could have longer TTLs than platform staff sessions.
3. **Should the Customer Dashboard's login page check if the user is a platform staff** and redirect them to the Control Panel login? This would improve UX for staff who bookmark the wrong URL.
4. **Should the `branches` feature (multi-workspace) be promoted to a first-class concept** in the simplified dashboard, or kept as-is?
5. **Should the Customer Dashboard have a dedicated `/auth/impersonate` route** or should the exchange token be handled in middleware before the page renders?

---

## 9. Final Recommendation

Remove all admin code from the Customer Dashboard in Phase 3, after the Control Panel is validated. Simplify `CrystalShell` and `WorkspaceContext` to remove all platform-related concepts. Add an impersonation exchange route to handle the cross-system redirect from the Control Panel.

The Customer Dashboard after separation is a pure customer-facing application with no knowledge of platform staff, super admins, or admin routes. Its only connection to the Control Panel is the inbound impersonation flow, which is handled via a one-time exchange token.

The existing customer features are well-built and require no functional changes. The work is purely subtractive: removing admin code and simplifying the shell.
