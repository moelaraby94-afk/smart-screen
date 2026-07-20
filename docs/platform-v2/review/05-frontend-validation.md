# 05 — Frontend Validation

> **Phase 5:** Validate both applications separately — every page, navigation, sidebar, state, components, layouts, feature folders, packages, shared UI

---

## 1. Current Frontend State

The repository has **one** Next.js dashboard app (`apps/dashboard/`) that serves both admin and customer users. The admin section is embedded as a route group under `app/[locale]/(shell)/admin/`. There is no separate Control Panel app.

**Current apps:**
- `apps/dashboard/` — Combined admin + customer (must split)
- `apps/player/` — Player app (already independent)
- `apps/marketing/` — Marketing site (already independent)

**Target apps:**
- `apps/control-panel/` — Platform admin (extracted from dashboard)
- `apps/dashboard/` — Customer workspace (cleaned up)
- `apps/player/` — Player (unchanged)
- `apps/marketing/` — Marketing (unchanged)

---

## 2. Page-by-Page Matrix

### 2.1 Customer Workspace Pages (Keep in `apps/dashboard/`)

| Route | Current Path | Action | Notes |
|---|---|---|---|
| Overview | `/[locale]/overview` | **Keep** | Main dashboard |
| Screens | `/[locale]/screens` | **Keep** | 4 sub-routes (list, detail, pair, manage) |
| Content Hub | `/[locale]/content` | **Keep** | 5 sub-routes (playlists, media, templates, etc.) |
| Playlists | `/[locale]/playlists` | **Keep** | Redirects to content/playlists |
| Media | `/[locale]/media` | **Keep** | Redirects to content/media |
| Studio | `/[locale]/studio` | **Keep** | Konva canvas editor |
| Templates | `/[locale]/templates` | **Keep** | Content templates |
| Scheduling | `/[locale]/scheduling` | **Keep** | Schedule calendar |
| Schedules | `/[locale]/schedules` | **Keep** | Schedule CRUD |
| Campaigns | `/[locale]/campaigns` | **Keep** | Campaign approval workflow |
| Analytics | `/[locale]/analytics` | **Keep** | Analytics dashboard |
| Audit Log | `/[locale]/audit-log` | **Keep** | Workspace audit log |
| Notifications | `/[locale]/notifications` | **Keep** | Notification center |
| Team | `/[locale]/team` | **Keep** | Team management |
| Settings | `/[locale]/settings` | **Keep** | 8 sub-routes (profile, billing, workspace, etc.) |
| Branches | `/[locale]/branches` | **Keep** | 4 sub-routes (workspace detail) |
| AI | `/[locale]/ai` | **Keep** | AI features |
| Emergency | `/[locale]/emergency` | **Keep** | Emergency broadcast |
| API Docs | `/[locale]/api-docs` | **Keep** | API documentation |
| Help | `/[locale]/help` | **Keep** | Help center |
| Proof of Play | `/[locale]/proof-of-play` | **Keep** | Proof of play reports |
| Displays | `/[locale]/displays` | **Investigate** | May be duplicate of screens — verify and possibly delete |
| Billing | `/[locale]/billing` | **Keep** | May overlap with settings/billing — consolidate |

### 2.2 Control Panel Pages (Move to `apps/control-panel/`)

| Current Route | Target Route | Action | Notes |
|---|---|---|---|
| `/[locale]/admin` | `/[locale]/` | **Move** | Admin home/overview |
| `/[locale]/admin/customers` | `/[locale]/customers` | **Move** | Customer list |
| `/[locale]/admin/customers/[id]` | `/[locale]/customers/[id]` | **Move** | Customer profile |
| `/[locale]/admin/customers/[id]/workspace/[wid]` | `/[locale]/customers/[id]/workspaces/[wid]` | **Move** | Customer workspace detail |
| `/[locale]/admin/staff` | `/[locale]/staff` | **Move** | Staff management |
| `/[locale]/admin/users` | `/[locale]/users` | **Move** | User list |
| `/[locale]/admin/workspaces` | `/[locale]/workspaces` | **Move** | Global workspace list |
| `/[locale]/admin/fleet` | `/[locale]/fleet` | **Move** | Fleet overview |
| `/[locale]/admin/screens` | `/[locale]/screens` | **Move** | Global screen list |
| `/[locale]/admin/stats` | `/[locale]/analytics` | **Move** | Platform analytics |
| `/[locale]/admin/logs` | `/[locale]/audit-log` | **Move** | Platform audit log |
| `/[locale]/admin/settings` | `/[locale]/settings` | **Move** | Platform settings |
| `/[locale]/admin/feature-flags` | `/[locale]/feature-flags` | **Move** | Feature flag management |
| `/[locale]/admin/billing` | `/[locale]/billing` | **Move** | Platform billing |
| `/[locale]/admin/health` | `/[locale]/health` | **Move** | System health |

**Total: 15 admin routes + 19 feature files to move.**

### 2.3 Auth Pages

| Route | Current Location | Target | Notes |
|---|---|---|---|
| Login | `app/[locale]/(auth)/login` | **Split** | Customer login stays in `apps/dashboard/`. Platform login goes to `apps/control-panel/`. |
| Register | `app/[locale]/(auth)/register` | **Keep in dashboard** | Customer registration only. |
| Forgot password | `app/[locale]/(auth)/forgot-password` | **Both** | Shared flow, different redirect. |
| Reset password | `app/[locale]/(auth)/reset-password` | **Both** | Shared flow, different redirect. |
| 2FA verify | `app/[locale]/(auth)/two-factor` | **Both** | Shared flow. |

---

## 3. Navigation Validation

### 3.1 Current Navigation (Single Sidebar)

`ShellSidebar` at `@/apps/dashboard/src/components/layout/shell-sidebar.tsx` (553 lines) renders **both** admin and customer navigation in one component:

- **Sovereign mode** (admin): Admin Home, Customers, Staff, Users, Workspaces, Fleet, Health, Logs, Feature Flags
- **Non-sovereign mode** (customer): Overview, Screens, Content, Scheduling, Campaigns, Analytics, Team, Settings

The mode is determined by `sovereign` prop in `CrystalShell`:
```typescript
const sovereign = !isImpersonating && (pathIsAdmin || isSuperAdmin || (isLoading && hintSuperAdmin));
```

### 3.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Admin nav ships to customer browsers | **CRITICAL** | Even in non-sovereign mode, the admin nav code is in the bundle. Customer can see admin route labels in source. |
| `sovereign` logic is fragile | **HIGH** | Depends on `sessionStorage.getItem('cs_super_admin')`, path matching, and loading state. Race conditions possible. |
| 553-line component | **MEDIUM** | Too large. Must be split. |
| `hrefFor()` function has 20+ branches | **MEDIUM** | Route mapping is hardcoded. Should be config-driven. |
| `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` set | **LOW** | Hardcoded list of routes. Should be config. |

### 3.3 Target Navigation

**Control Panel Sidebar:**
- Dashboard (home)
- Customers
- Staff
- Users
- Workspaces
- Fleet (screens)
- Analytics
- Audit Log
- Settings
- Feature Flags
- Health
- Billing

**Customer Workspace Sidebar:**
- Overview
- Screens
- Content (Playlists, Media, Templates, Studio)
- Scheduling
- Campaigns
- Analytics
- Team
- Settings

---

## 4. State Management Validation

### 4.1 Current State Management

| Concern | Current | Blueprint Target | Gap |
|---|---|---|---|
| Auth state | `sessionStorage` for access token + cookie | Same + audience-aware | No audience tracking |
| Workspace context | `WorkspaceContext` (React Context) | Customer-only | Must remove from Control Panel |
| Workspace stats | `useWorkspaceStats` hook | Customer-only | Must remove from Control Panel |
| Server auth | `fetchAuthMeServer()` in server components | Same + audience | No audience check |
| Data fetching | `apiFetch` wrapper + SWR | Same | No change needed |
| Theme | `next-themes` | Same | No change |
| Locale | `next-intl` | Same | No change |

### 4.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| `WorkspaceContext` in admin | **HIGH** | `CrystalShell` wraps everything in `WorkspaceGate` + `useWorkspace()`. Admin pages don't need workspace context but it's injected anyway. |
| `sessionStorage` for super admin hint | **MEDIUM** | `sessionStorage.getItem('cs_super_admin')` is used to show admin nav during loading. Fragile. |
| No audience in auth state | **HIGH** | `fetchAuthMeServer()` returns `isSuperAdmin` and `platformStaffRole` but no `audience` field. Frontend can't determine which app to route to. |

---

## 5. Server Components vs Client Components

### 5.1 Current Pattern

| Pattern | Usage | Issue? |
|---|---|---|
| Server Component (default) | Page components, layouts | ✅ Correct |
| `'use client'` | Interactive components, stateful components | ✅ Correct |
| `fetchAuthMeServer()` | Server-side auth check in layouts | ✅ Correct — does SSR fetch |
| `apiFetch` | Client-side API calls | ✅ Correct |

### 5.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Admin layout does server-side auth | ✅ | `admin/layout.tsx` checks `me.isSuperAdmin` server-side. Good. |
| `CrystalShell` is `'use client'` | **OK** | Shell needs client-side state (mobile nav, pathname). Correct. |
| `ShellSidebar` is `'use client'` | **OK** | Needs router, theme, pathname. Correct. |
| No streaming/Suspense for data | **MEDIUM** | Pages load data client-side via SWR. Could use Server Components for initial data. Not blocking. |

---

## 6. Layouts Validation

### 6.1 Current Layout Structure

```
app/[locale]/
├── layout.tsx (root locale layout)
├── (auth)/
│   └── (no layout — standalone auth pages)
├── (shell)/
│   ├── layout.tsx → BrandingProvider → CrystalShell
│   ├── admin/
│   │   └── layout.tsx → fetchAuthMeServer → isSuperAdmin check → AdminSectionShell
│   └── [customer pages]
```

### 6.2 Target Layout Structure

**Control Panel:**
```
app/[locale]/
├── layout.tsx (root locale layout)
├── (auth)/
│   └── login/ (platform login)
├── (shell)/
│   └── layout.tsx → PlatformBrandingProvider → ControlPanelShell
```

**Customer Workspace:**
```
app/[locale]/
├── layout.tsx (root locale layout)
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
├── (shell)/
│   └── layout.tsx → BrandingProvider → CustomerShell
```

### 6.3 Issues

| Issue | Severity | Detail |
|---|---|---|
| `CrystalShell` coupling | **CRITICAL** | 169-line component handles both admin and customer. Must split into `ControlPanelShell` + `CustomerShell`. |
| `AdminSectionShell` is thin wrapper | **OK** | Just wraps `SuperAdminGuard`. Good — easy to extract. |
| `BrandingProvider` is shared | **MEDIUM** | Customer branding is per-workspace. Platform branding is global. Must split or parameterize. |
| `WorkspaceGate` in shell | **HIGH** | `CrystalShell` wraps children in `WorkspaceGate`. Admin pages don't need this. Must remove from Control Panel. |

---

## 7. Feature Folders Validation

### 7.1 Current Feature Folders

| Folder | Files | Target App | Action |
|---|---|---|---|
| `admin/` | 19 files | Control Panel | **Move all** |
| `analytics/` | 4 files | Customer | Keep |
| `api/` | 4 files | Customer | Keep |
| `api-docs/` | 4 files | Customer | Keep |
| `audit-log/` | 2 files | Customer | Keep |
| `auth/` | 6 files | Both | **Split** — shared auth API, per-app session |
| `billing/` | 1 file | Customer | Keep |
| `branches/` | 15 files | Customer | Keep |
| `campaigns/` | 9 files | Customer | Keep |
| `content/` | 2 files | Customer | Keep |
| `dashboard/` | 19 files | Customer | Keep |
| `help/` | 1 file | Customer | Keep |
| `islamic/` | 6 files | Customer | Keep |
| `media/` | 4 files | Customer | Keep |
| `notifications/` | 3 files | Customer | Keep |
| `onboarding/` | 3 files | Customer | Keep |
| `playlists/` | 28 files | Customer | Keep |
| `schedules/` | 6 files | Customer | Keep |
| `screens/` | 17 files | Customer | Keep |
| `search/` | 1 file | Customer | Keep |
| `settings/` | 9 files | Customer | Keep |
| `studio/` | 7 files | Customer | Keep |
| `team/` | 3 files | Customer | Keep |
| `workspace/` | 8 files | Customer | **Split** — workspace context is customer-only, Control Panel needs tenant context |

### 7.2 Admin Feature Files (Moving to Control Panel)

| File | Size | Purpose |
|---|---|---|
| `admin-api.ts` | 5.8 KB | Admin API calls |
| `admin-customer-profile-client.tsx` | 10 KB | Customer profile view |
| `admin-customer-profile-dialogs.tsx` | 4 KB | Profile dialogs |
| `admin-customer-profile-tabs.tsx` | 22 KB | Profile tabs (largest) |
| `admin-customer-profile-types.ts` | 1.6 KB | Profile types |
| `admin-customer-workspace-client.tsx` | 9 KB | Workspace detail |
| `admin-customers-client.tsx` | 24 KB | Customer list (largest) |
| `admin-fleet-client.tsx` | 7.6 KB | Fleet overview |
| `admin-home-overview-client.tsx` | 5.4 KB | Admin home |
| `admin-logs-client.tsx` | 5.8 KB | Audit log view |
| `admin-screens-client.tsx` | 6.3 KB | Global screen list |
| `admin-settings-client.tsx` | 7.6 KB | Platform settings |
| `admin-staff-client.tsx` | 11 KB | Staff management |
| `admin-system-health-client.tsx` | 6.3 KB | System health |
| `admin-users-client.tsx` | 16 KB | User management |
| `admin-workspaces-client.tsx` | 9.3 KB | Workspace management |
| `feature-flags-client.tsx` | 6.4 KB | Feature flags |
| `impersonation-return-button.tsx` | 2.2 KB | Impersonation exit |
| `super-admin-guard.tsx` | 2.9 KB | Route guard |

**Total: ~165 KB of admin code in the customer bundle.**

---

## 8. Shared UI Components (packages/ui)

### 8.1 Components to Extract

| Component | Current Path | Dependencies | Ready to Extract? |
|---|---|---|---|
| `Button` | `components/ui/button.tsx` | `cn`, class-variance-authority | ✅ |
| `Input` | `components/ui/input.tsx` | `cn` | ✅ |
| `Label` | `components/ui/label.tsx` | Radix Label | ✅ |
| `Skeleton` | `components/ui/skeleton.tsx` | `cn` | ✅ |
| `AlertDialog` | `components/ui/alert-dialog.tsx` | Radix AlertDialog | ✅ |
| `Dialog` | `components/ui/dialog.tsx` | Radix Dialog | ✅ |
| `DropdownMenu` | `components/ui/dropdown-menu.tsx` | Radix DropdownMenu | ✅ |
| + 13 more UI components | `components/ui/*` | Various | ✅ |

### 8.2 Non-UI Shared Components

| Component | Current Path | Target | Notes |
|---|---|---|---|
| `ShellLogo` | `components/layout/shell-logo.tsx` | `packages/ui` | Branding-aware |
| `LanguageSwitcher` | `components/language-switcher.tsx` | `packages/ui` | Locale switcher |
| `PageTransition` | `components/page-transition.tsx` | `packages/ui` | Framer Motion transition |
| `cn` utility | `lib/utils.ts` | `packages/ui` | Tailwind class merge |

### 8.3 Issues

| Issue | Severity | Detail |
|---|---|---|
| `cn` utility import path | **HIGH** | All components import `@/lib/utils` for `cn`. Must change to `@cloud-screen/ui` after extraction. ~100+ import sites. |
| Tailwind config duplication | **MEDIUM** | Both apps need same Tailwind config. Must share via `packages/config`. |
| Design tokens | **MEDIUM** | CSS variables for colors, spacing, etc. Must be shared. |
| Radix peer dependencies | **LOW** | Both apps need same Radix versions. npm workspaces handles this. |

---

## 9. Packages Validation

### 9.1 Current Package State

| Package | Status | Content |
|---|---|---|
| `packages/ui` | **Empty** | `.gitkeep` only |
| `packages/config` | **Empty** | `.gitkeep` only |
| `packages/api-ts` | **Does not exist** | Not created |

### 9.2 Required Packages

| Package | Purpose | Priority | Dependencies |
|---|---|---|---|
| `packages/ui` | Shared UI components (Button, Input, Dialog, etc.) | P0 | Radix UI, class-variance-authority, tailwind-merge |
| `packages/config` | Shared TS config, Tailwind config, ESLint config | P0 | None |
| `packages/api-ts` | Shared API types (response shapes, error codes, DTOs) | P1 | None |

### 9.3 Package Naming Convention

Recommend scoped names:
- `@cloud-screen/ui`
- `@cloud-screen/config`
- `@cloud-screen/api-ts`

Must update `package.json` in each package and add to root `package.json` workspaces (already configured: `"workspaces": ["apps/*", "packages/*"]`).

---

## 10. Frontend Validation Summary

| Area | Score | Key Issue |
|---|---|---|
| Page Structure | 7/10 | 15 admin routes + 19 feature files to move |
| Navigation | 5/10 | 553-line sidebar with admin+customer nav must split |
| State Management | 6/10 | Workspace context injected into admin, no audience tracking |
| Server/Client Components | 8/10 | Good pattern, minor improvements needed |
| Layouts | 5/10 | CrystalShell coupling is the biggest frontend blocker |
| Feature Folders | 7/10 | Clean separation possible, admin folder is self-contained |
| Shared UI | 3/10 | Zero shared packages exist, 25+ components to extract |
| Packages | 2/10 | Empty packages, no infrastructure |

**Frontend is the most migration-heavy area.** The shell split and package extraction must happen before app separation.
