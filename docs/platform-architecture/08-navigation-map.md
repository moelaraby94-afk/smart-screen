# 08 — Navigation Map

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Complete navigation structure for Control Panel and Customer Dashboard after separation

---

## 1. Current State

### 1.1 Current Unified Navigation

The `ShellSidebar` component (`apps/dashboard/src/components/layout/shell-sidebar.tsx`) renders navigation in two modes:

**Sovereign (Admin) Mode** — shown when `sovereign` is true:
- Admin Home → `/admin`
- Management: Customers, Staff, Users
- System: Workspaces, Fleet, Health, Logs, Feature Flags

**Workspace (Customer) Mode** — shown when `sovereign` is false:
- Overview → `/overview`
- Content: Playlists, Media, Templates, Studio
- Screens → `/screens`
- Scheduling → `/scheduling`
- Campaigns → `/campaigns`
- Analytics → `/analytics`
- Team → `/team`
- Settings: Workspace Settings, API Keys, Webhooks, Islamic Features, Notifications
- Account: Billing, API Docs, Audit Log, Help, Emergency

The mode is determined by `CrystalShell` based on path prefix (`/admin`) and `isSuperAdmin` flag.

### 1.2 Current Header

`ShellHeader` (`apps/dashboard/src/components/layout/header.tsx`) renders:
- Back button (conditional)
- Page title (from route metadata)
- Global search
- Density toggle
- Notification bell
- Workspace switcher (hidden in sovereign mode)
- User menu (profile, settings, logout)
- Language switch
- Theme toggle

---

## 2. Problems

### 2.1 Mode Switching Complexity

The `sovereign` flag calculation in `CrystalShell` is complex:
```typescript
const pathIsAdmin = Boolean(pathname?.startsWith(`/${navLocale}/admin`));
const sovereign = !isImpersonating &&
  (pathIsAdmin || isSuperAdmin || (isLoading && hintSuperAdmin));
```

This mixes three concerns: path detection, user role, and a loading hint from sessionStorage. The result is fragile — a super admin visiting a customer page sees the customer sidebar, but the `sovereign` flag flickers during navigation.

### 2.2 Shared Sidebar Component

The same `ShellSidebar` component handles both admin and customer navigation. This means:
- Admin nav items are defined in the same file as customer nav items
- The `sovereign` conditional adds complexity to every render
- Admin-specific logic (e.g., `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` for admin routes) is mixed with customer logic

### 2.3 No Breadcrumb Separation

Breadcrumbs are computed from the route path in `CrystalShell`. Admin routes (`/admin/customers/[id]`) and customer routes (`/screens/[id]`) share the same breadcrumb logic. After separation, each application should have its own breadcrumb configuration.

### 2.4 Workspace Switcher in Admin

The workspace switcher is hidden in sovereign mode but its code is still loaded. This adds unnecessary bundle weight for admin users.

---

## 3. Target Architecture

### 3.1 Control Panel Navigation

#### Sidebar Structure

```
┌─────────────────────────────────┐
│  [Platform Logo]                │
│  Cloud Signage Control          │
├─────────────────────────────────┤
│                                 │
│  📊 Dashboard                   │ → /admin
│                                 │
│  ── Management ──               │
│  👥 Customers                   │ → /admin/customers
│  🔑 Staff                       │ → /admin/staff
│  👤 Users                       │ → /admin/users
│                                 │
│  ── System ──                   │
│  🖥️ Workspaces                 │ → /admin/workspaces
│  📡 Fleet                       │ → /admin/fleet
│  📋 Screens                     │ → /admin/screens
│  ❤️ Health                      │ → /admin/health
│  📝 Logs                        │ → /admin/logs
│  🚩 Feature Flags               │ → /admin/feature-flags
│  💳 Billing                     │ → /admin/billing
│                                 │
│  ── Configuration ──            │
│  ⚙️ Settings                    │ → /admin/settings
│                                 │
├─────────────────────────────────┤
│  [Staff Name]                   │
│  [Role Badge]                   │
│  [Logout]                       │
└─────────────────────────────────┘
```

#### Header Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]  [Page Title]                    [Search] [🔔] [👤] │
│                                                    Staff Menu │
└─────────────────────────────────────────────────────────────┘
```

- **Back button:** Navigates to previous page (within Control Panel)
- **Page title:** Derived from route metadata
- **Search:** Global search across customers, workspaces, screens (platform-level)
- **Notification bell:** Platform notifications (system health alerts, new signups)
- **Staff menu:** Profile, Settings, Language, Theme, Logout
- **No workspace switcher:** Not applicable

#### Route Map

| Route | Title | Sidebar Section | Roles |
|---|---|---|---|
| `/admin` | Dashboard | Top | SUPER_ADMIN, BILLING_MANAGER |
| `/admin/customers` | Customers | Management | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER |
| `/admin/customers/[id]` | Customer Profile | Management | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER |
| `/admin/customers/[id]/workspaces/[wid]` | Workspace Detail | Management | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER |
| `/admin/staff` | Staff | Management | SUPER_ADMIN |
| `/admin/users` | Users | Management | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER |
| `/admin/workspaces` | Workspaces | System | SUPER_ADMIN, SUPPORT_SPECIALIST |
| `/admin/fleet` | Fleet | System | SUPER_ADMIN, SUPPORT_SPECIALIST |
| `/admin/screens` | Screens | System | SUPER_ADMIN, SUPPORT_SPECIALIST |
| `/admin/health` | System Health | System | SUPER_ADMIN |
| `/admin/logs` | Audit Logs | System | SUPER_ADMIN |
| `/admin/feature-flags` | Feature Flags | System | SUPER_ADMIN |
| `/admin/billing` | Billing | System | SUPER_ADMIN, BILLING_MANAGER |
| `/admin/settings` | Settings | Configuration | SUPER_ADMIN |
| `/admin/stats` | Statistics | (linked from Dashboard) | SUPER_ADMIN, BILLING_MANAGER |

#### Role-Based Sidebar Visibility

| Nav Item | SUPER_ADMIN | SUPPORT_SPECIALIST | BILLING_MANAGER |
|---|---|---|---|
| Dashboard | ✅ | ❌ | ✅ |
| Customers | ✅ | ✅ | ✅ |
| Staff | ✅ | ❌ | ❌ |
| Users | ✅ | ✅ | ✅ |
| Workspaces | ✅ | ✅ | ❌ |
| Fleet | ✅ | ✅ | ❌ |
| Screens | ✅ | ✅ | ❌ |
| Health | ✅ | ❌ | ❌ |
| Logs | ✅ | ❌ | ❌ |
| Feature Flags | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ✅ |
| Settings | ✅ | ❌ | ❌ |

#### Breadcrumb Configuration

| Route | Breadcrumb |
|---|---|
| `/admin` | Dashboard |
| `/admin/customers` | Dashboard > Customers |
| `/admin/customers/[id]` | Dashboard > Customers > [Customer Name] |
| `/admin/customers/[id]/workspaces/[wid]` | Dashboard > Customers > [Customer Name] > [Workspace Name] |
| `/admin/staff` | Dashboard > Staff |
| `/admin/users` | Dashboard > Users |
| `/admin/workspaces` | Dashboard > Workspaces |
| `/admin/fleet` | Dashboard > Fleet |
| `/admin/screens` | Dashboard > Screens |
| `/admin/health` | Dashboard > Health |
| `/admin/logs` | Dashboard > Logs |
| `/admin/feature-flags` | Dashboard > Feature Flags |
| `/admin/billing` | Dashboard > Billing |
| `/admin/settings` | Dashboard > Settings |

### 3.2 Customer Dashboard Navigation

#### Sidebar Structure

```
┌─────────────────────────────────┐
│  [Customer Logo]                │
│  [Workspace Name]               │
│  [Workspace Switcher ▾]         │
├─────────────────────────────────┤
│                                 │
│  🏠 Overview                    │ → /overview
│                                 │
│  ── Content ──                  │
│  📋 Playlists                   │ → /content/playlists
│  📁 Media                       │ → /content/media
│  🎨 Studio                      │ → /studio
│  📐 Templates                   │ → /templates
│                                 │
│  ── Displays ──                 │
│  🖥️ Screens                    │ → /screens
│  📅 Scheduling                  │ → /scheduling
│  📢 Campaigns                   │ → /campaigns
│                                 │
│  ── Insights ──                 │
│  📊 Analytics                   │ → /analytics
│  📋 Proof of Play               │ → /proof-of-play
│                                 │
│  ── Workspace ──                │
│  👥 Team                        │ → /team
│  ⚙️ Settings                    │ → /settings
│  🔌 API Keys                    │ → /settings/api-keys
│  🔗 Webhooks                    │ → /settings/webhooks
│  🕌 Islamic Features            │ → /settings/islamic
│                                 │
│  ── Account ──                  │
│  💳 Billing                     │ → /billing
│  📖 API Docs                    │ → /api-docs
│  📝 Audit Log                   │ → /audit-log
│  🔔 Notifications               │ → /notifications
│  ❓ Help                        │ → /help
│  🚨 Emergency                   │ → /emergency
│                                 │
├─────────────────────────────────┤
│  [User Name]                    │
│  [Workspace Role Badge]         │
│  [Theme] [Language] [Logout]    │
└─────────────────────────────────┘
```

#### Header Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back] [Page Title]  [Search] [Density] [🔔] [👤]        │
│                                       User Menu + WS Switch  │
└─────────────────────────────────────────────────────────────┘
```

- **Back button:** Navigates to previous page
- **Page title:** Derived from route metadata
- **Global search:** Search across screens, playlists, media, schedules
- **Density toggle:** Compact/comfortable view
- **Notification bell:** User notifications
- **User menu:** Profile, Settings, Language, Theme, Logout
- **Workspace switcher:** Switch between workspaces (in sidebar, not header)

#### Route Map

| Route | Title | Sidebar Section | Roles |
|---|---|---|---|
| `/overview` | Overview | Top | ALL |
| `/content/playlists` | Playlists | Content | ALL (view), EDITOR+ (manage) |
| `/content/media` | Media Library | Content | ALL (view), EDITOR+ (manage) |
| `/studio` | Studio | Content | ALL (view), EDITOR+ (manage) |
| `/templates` | Templates | Content | ALL |
| `/screens` | Screens | Displays | ALL (view), EDITOR+ (manage) |
| `/scheduling` | Scheduling | Displays | ALL (view), EDITOR+ (manage) |
| `/campaigns` | Campaigns | Displays | ALL (view), EDITOR+ (manage) |
| `/analytics` | Analytics | Insights | ALL |
| `/proof-of-play` | Proof of Play | Insights | ALL |
| `/team` | Team | Workspace | ALL (view), ADMIN+ (manage) |
| `/settings` | Settings | Workspace | ALL |
| `/settings/api-keys` | API Keys | Workspace | ADMIN+ |
| `/settings/webhooks` | Webhooks | Workspace | ADMIN+ |
| `/settings/islamic` | Islamic Features | Workspace | ALL (view), ADMIN+ (manage) |
| `/billing` | Billing | Account | ALL |
| `/api-docs` | API Docs | Account | ALL |
| `/audit-log` | Audit Log | Account | ALL |
| `/notifications` | Notifications | Account | ALL |
| `/help` | Help | Account | ALL |
| `/emergency` | Emergency | Account | ALL |
| `/branches` | Workspaces | Account | ALL |
| `/displays` | Displays | Displays | ALL |
| `/ai` | AI Assistant | Account | ALL |

#### Role-Based Sidebar Visibility

| Nav Item | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| Overview | ✅ | ✅ | ✅ | ✅ |
| Playlists | ✅ | ✅ | ✅ | ✅ |
| Media | ✅ | ✅ | ✅ | ✅ |
| Studio | ✅ | ✅ | ✅ | ✅ |
| Templates | ✅ | ✅ | ✅ | ✅ |
| Screens | ✅ | ✅ | ✅ | ✅ |
| Scheduling | ✅ | ✅ | ✅ | ✅ |
| Campaigns | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ✅ |
| Proof of Play | ✅ | ✅ | ✅ | ✅ |
| Team | ✅ | ✅ | ✅ | ✅ |
| Settings | ✅ | ✅ | ✅ | ✅ |
| API Keys | ✅ | ✅ | ❌ | ❌ |
| Webhooks | ✅ | ✅ | ❌ | ❌ |
| Islamic Features | ✅ | ✅ | ✅ | ✅ |
| Billing | ✅ | ✅ | ✅ | ✅ |
| API Docs | ✅ | ✅ | ✅ | ✅ |
| Audit Log | ✅ | ✅ | ✅ | ✅ |
| Notifications | ✅ | ✅ | ✅ | ✅ |
| Help | ✅ | ✅ | ✅ | ✅ |
| Emergency | ✅ | ✅ | ✅ | ✅ |

#### Breadcrumb Configuration

| Route | Breadcrumb |
|---|---|
| `/overview` | Overview |
| `/content/playlists` | Content > Playlists |
| `/content/media` | Content > Media Library |
| `/studio` | Content > Studio |
| `/screens` | Displays > Screens |
| `/screens/[id]` | Displays > Screens > [Screen Name] |
| `/scheduling` | Displays > Scheduling |
| `/campaigns` | Displays > Campaigns |
| `/analytics` | Insights > Analytics |
| `/team` | Workspace > Team |
| `/settings` | Workspace > Settings |
| `/billing` | Account > Billing |
| `/api-docs` | Account > API Docs |
| `/audit-log` | Account > Audit Log |
| `/notifications` | Account > Notifications |

### 3.3 Impersonation Banner

When a super admin is impersonating a customer user, the Customer Dashboard shows a banner at the top of the page:

```
┌─────────────────────────────────────────────────────────────┐
│  🎭 You are impersonating [Customer Email].                  │
│  [Return to Control Panel]                                   │
└─────────────────────────────────────────────────────────────┘
```

- Shown only when `impersonatedBy` claim is present in the JWT
- "Return to Control Panel" link navigates to `admin.cloudsignage.com` and triggers exit-impersonation flow
- Banner is dismissible for the current session (stored in sessionStorage)

### 3.4 Auth Routes (Shared)

Both applications have auth routes, but they are separate:

**Control Panel Auth:**
| Route | Purpose |
|---|---|
| `/[locale]/login` | Platform staff login (requests `audience: 'platform'`) |

**Customer Dashboard Auth:**
| Route | Purpose |
|---|---|
| `/[locale]/login` | Customer login (requests `audience: 'customer'`) |
| `/[locale]/register` | Customer registration |
| `/[locale]/forgot-password` | Password reset |
| `/[locale]/invite` | Workspace invite acceptance |
| `/[locale]/impersonate` | Exchange token → session (impersonation) |
| `/[locale]/privacy` | Privacy policy |
| `/[locale]/terms` | Terms of service |

---

## 4. Recommended Solution

### 4.1 Create Dedicated Sidebar Components

- `apps/control-panel/src/components/layout/panel-sidebar.tsx` — admin-only navigation
- `apps/dashboard/src/components/layout/shell-sidebar.tsx` — customer-only navigation (simplified, remove sovereign branch)

### 4.2 Create Dedicated Shell Components

- `apps/control-panel/src/components/layout/panel-shell.tsx` — admin shell (no workspace context, no workspace gate)
- `apps/dashboard/src/components/crystal-shell.tsx` — customer shell (simplified, remove sovereign logic)

### 4.3 Separate Breadcrumb Logic

Each application maintains its own breadcrumb configuration. No shared breadcrumb logic.

### 4.4 Role-Based Nav Rendering

Both sidebar components filter navigation items based on the current user's role:
- Control Panel: Filter by `platformStaffRole`
- Customer Dashboard: Filter by workspace `UserRole`

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Navigation items drift between the two apps | Medium | Document the navigation map (this document). Review on changes. |
| Role-based filtering hides items the user can access via URL | Low | Server-side guards enforce access regardless of sidebar visibility. |
| Impersonation banner is not shown | Medium | Read `impersonatedBy` from JWT on every page load. Test thoroughly. |
| Breadcrumb configuration is incomplete | Low | Start with the configuration in this document and extend as needed. |

---

## 6. Alternatives

### 6.1 Shared Navigation Configuration

Extract navigation items to a shared package and filter by application mode.

**Pros:** Single source of truth.
**Cons:** Couples the two applications, adds complexity.

**Verdict:** Rejected. Separate navigation configurations are simpler and more maintainable.

---

## 7. Migration Notes

- **Phase 1:** Copy sidebar and shell to Control Panel. Both apps have their own copies.
- **Phase 3:** Remove sovereign branch from Customer Dashboard sidebar. Remove admin nav items.
- **Phase 3:** Add impersonation banner to Customer Dashboard.

---

## 8. Open Questions

1. **Should the Control Panel have a dark mode?** The customer dashboard has theme toggle. The Control Panel could default to dark mode for a "mission control" feel.
2. **Should the Customer Dashboard show the platform name in the sidebar** (from branding settings) or the workspace name?
3. **Should the Control Panel support RTL (Arabic) layout?** The customer dashboard does. The Control Panel should too for consistency.
4. **Should the `branches` route be in the sidebar** or accessed via the workspace switcher only?
5. **Should the `emergency` route be in the sidebar** or accessed via a floating button?

---

## 9. Final Recommendation

Create dedicated navigation components for each application. The Control Panel has a fixed sidebar with role-filtered items. The Customer Dashboard has a workspace-scoped sidebar with role-filtered items. Remove all `sovereign` mode switching logic.

The navigation maps in Sections 3.1 and 3.2 are the authoritative reference for sidebar items. Any new route must be added to the appropriate navigation map before implementation.

The impersonation banner is a critical UX element that must be implemented in Phase 3 to maintain visibility of impersonation state after the cross-system redirect flow is introduced.
