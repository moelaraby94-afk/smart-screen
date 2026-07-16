# 03 — Routing, Navigation & Information Architecture

> **Source basis:** `src/app/**/page.tsx`, `src/app/**/layout.tsx`, `src/middleware.ts`, `src/i18n/routing.ts`, `src/lib/shell-header-meta.ts`, `src/components/layout/breadcrumbs.tsx`, `src/components/layout/shell-sidebar.tsx`  

---

## 3.1 Route Map

### Root Level

| Path | Component | Behavior |
|------|-----------|----------|
| `/` | `src/app/page.tsx` | Redirects to `/{locale}` based on cookie or Accept-Language header |
| `/{locale}` | `src/app/[locale]/(shell)/page.tsx` | Overview/home page (same as `/overview`) |

### Auth Routes (Route Group `(auth)`)

Layout: `src/app/[locale]/(auth)/layout.tsx` — minimal: `min-h-screen bg-muted/30 text-foreground`

| Path | Component | Description |
|------|-----------|-------------|
| `/{locale}/login` | `LoginPage` | Centered card with login form, language switcher, legal links |
| `/{locale}/register` | `RegisterPage` | Centered card with registration form (multi-step: start → verify) |
| `/{locale}/forgot-password` | `ForgotPasswordPage` | Centered card with email input for password reset |
| `/{locale}/invite` | `InvitePage` | Team invite acceptance page |
| `/{locale}/privacy` | `PrivacyPage` | Privacy policy text page |
| `/{locale}/terms` | `TermsPage` | Terms of service text page |

### Shell Routes (Route Group `(shell)`)

Layout: `src/app/[locale]/(shell)/layout.tsx` — wraps in `BrandingProvider` → `CrystalShell`

| Path | Component | Description |
|------|-----------|-------------|
| `/{locale}/overview` | `OverviewPage` | Home dashboard with hero, quick actions, workspace cards, screen health, activity feed, subscription summary, Islamic widgets |
| `/{locale}/screens` | `ScreensPage` | Screen fleet management with grid/table view |
| `/{locale}/screens/{screenId}` | `ScreenDetailPage` | Individual screen detail with analytics, quick edit, dialogs |
| `/{locale}/playlists` | `PlaylistsPage` | Playlist studio with grid/editor views, timeline, media library |
| `/{locale}/media` | `MediaPage` | Media library with grid view, upload, preview |
| `/{locale}/schedules` | `SchedulesPage` | Schedule management with calendar and timeline views |
| `/{locale}/analytics` | `AnalyticsPage` | Analytics dashboard with charts and metrics |
| `/{locale}/studio` | `StudioPage` | Canvas-based visual editor using Konva |
| `/{locale}/templates` | `TemplatesPage` | Pre-built template gallery |
| `/{locale}/ai` | `AiPage` | AI tools for content generation |
| `/{locale}/emergency` | `EmergencyPage` | Emergency broadcast overlay management |
| `/{locale}/notifications` | `NotificationsPage` | Notification history and preferences |
| `/{locale}/audit-log` | `AuditLogPage` | Audit log viewer |
| `/{locale}/api-docs` | `ApiDocsPage` | API documentation, keys, webhooks |
| `/{locale}/help` | `HelpPage` | Help and support center |
| `/{locale}/team` | `TeamPage` | Team member management, invitations |
| `/{locale}/branches` | `BranchesPage` | Branch/location management |
| `/{locale}/settings/profile` | `SettingsProfilePage` | User profile settings |
| `/{locale}/settings/workspace` | `WorkspaceSettingsPage` | Workspace settings |
| `/{locale}/settings/billing` | `SettingsBillingPage` | Billing and subscription management |

### Redirect Routes

| Path | Redirects To | Reason |
|------|-------------|--------|
| `/{locale}/billing` | `/{locale}/settings/billing` | Consolidated billing into settings |
| `/{locale}/content` | `/{locale}/media` | Content was a subset of media; merged |
| `/{locale}/displays` | `/{locale}/screens` | Displays renamed to screens |
| `/{locale}/campaigns` | `/{locale}/schedules` | Campaigns renamed to schedules |
| `/{locale}/proof-of-play` | `/{locale}/analytics` | PoP merged into analytics |

### Admin Routes (under `(shell)/admin/`)

Layout: `src/app/[locale]/(shell)/admin/layout.tsx` — server-side guard: redirects to `/login` if not authenticated, redirects to `/overview` if not super-admin. Wraps in `AdminSectionShell`.

| Path | Component | Description |
|------|-----------|-------------|
| `/{locale}/admin` | `AdminHomePage` | Admin overview with system stats |
| `/{locale}/admin/customers` | `AdminCustomersPage` | Customer list with search, filtering |
| `/{locale}/admin/customers/{id}` | `AdminCustomerProfilePage` | Customer profile with tabs (details, workspaces, billing, logs) |
| `/{locale}/admin/customers/{id}/workspace/{wsId}` | `AdminCustomerWorkspacePage` | Customer workspace detail |
| `/{locale}/admin/staff` | `AdminStaffPage` | Staff management |
| `/{locale}/admin/users` | `AdminUsersPage` | User management |
| `/{locale}/admin/workspaces` | `AdminWorkspacesPage` | Workspace management |
| `/{locale}/admin/fleet` | `AdminFleetPage` | Fleet overview (all screens across customers) |
| `/{locale}/admin/screens` | `AdminScreensPage` | Screen management (all screens) |
| `/{locale}/admin/stats` | `AdminStatsPage` | System health and statistics |
| `/{locale}/admin/logs` | `AdminLogsPage` | System logs viewer |
| `/{locale}/admin/settings` | `AdminSettingsPage` | Admin settings |
| `/{locale}/admin/feature-flags` | `FeatureFlagsPage` | Feature flag management (no breadcrumb bar, no header) |
| `/{locale}/admin/billing` | redirect → `/{locale}/settings/billing` | Redirect |

---

## 3.2 Locale Routing

### Configuration (`src/i18n/routing.ts`)

```typescript
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

- **Locales:** `ar` (Arabic, RTL), `en` (English, LTR)
- **Default:** `en`
- **Prefix:** Always — every URL includes the locale prefix (e.g., `/en/overview`, `/ar/overview`)

### Middleware (`src/middleware.ts`)

Uses `createMiddleware` from `next-intl/middleware` with the routing config. The matcher excludes:
- `/api/*` — API routes
- `/_next/*` — Next.js internals
- `/*.{ico,svg,png,jpg,jpeg,gif,webp}` — static files

### Locale Detection (Root Layout)

`src/app/layout.tsx` detects locale from:
1. Cookie `NEXT_LOCALE` if present and valid
2. `Accept-Language` header if cookie not set
3. Falls back to `en`

Sets `<html lang="{locale}">` and injects a pre-hydration script to set `.dark` class from `localStorage` theme preference.

### Locale Detection (Request — `src/i18n/request.ts`)

1. Attempts `getRequestLocale()` from next-intl
2. Falls back to header-based detection if middleware fails
3. Imports messages dynamically: `@/i18n/messages/{locale}.json`
4. Provides `onError` and `getMessageFallback` handlers

---

## 3.3 Sidebar Navigation

### Navigation Structure (`src/components/layout/shell-sidebar.tsx`)

> **[V2 Correction]** V1 described grouped navigation with section labels (Fleet, Content, Playback, etc.) for client mode. The actual source code shows a **flat list** with no section labels for client/workspace mode. Only admin (sovereign) mode uses section labels.

The sidebar renders two completely different navigation structures depending on `sovereign` mode:

#### Standard (Workspace) Navigation — Flat List

The client-mode sidebar is a **flat, ungrouped list** of 18 navigation items rendered in a single scrollable column. There are no section labels, no group headers, and no visual separation between functional categories.

| Order | Label Key | Route | Icon | Count Badge | Notes |
|-------|-----------|-------|------|-------------|-------|
| 1 | `nav.overview` | `/{locale}/overview` | `LayoutDashboard` | — | Clicking during loading is prevented |
| 2 | `nav.branches` | `/{locale}/branches` | `Building2` | Workspace count | Inline Link, not NavItem — workspace count badge |
| 3 | `nav.screens` | `/{locale}/screens` | `Monitor` | Screen count | Click guard: toast if no workspace |
| 4 | `nav.playlists` | `/{locale}/playlists` | `Clapperboard` | Playlist count | Click guard: toast if no workspace |
| 5 | `nav.media` | `/{locale}/media` | `FolderOpen` | Media count | Click guard: toast if no workspace |
| 6 | `nav.studio` | `/{locale}/studio` | `Clapperboard` | — | Same icon as playlists — **see V2 §3.9** |
| 7 | `nav.templates` | `/{locale}/templates` | `LayoutTemplate` | — | Click guard: toast if no workspace |
| 8 | `nav.schedules` | `/{locale}/schedules` | `CalendarClock` | — | Click guard: toast if no workspace |
| 9 | `nav.emergency` | `/{locale}/emergency` | `AlertTriangle` | — | Click guard: toast if no workspace |
| 10 | `nav.analytics` | `/{locale}/analytics` | `Activity` | — | Click guard: toast if no workspace |
| 11 | `nav.ai` | `/{locale}/ai` | `Sparkles` | — | Click guard: toast if no workspace |
| 12 | `nav.team` | `/{locale}/team` | `Users` | — | Click guard: toast if no workspace |
| 13 | `nav.billing` | `/{locale}/settings/billing` | `CreditCard` | — | Direct link to settings/billing |
| 14 | `nav.settings` | `/{locale}/settings/profile` | `Settings` | — | Active for both profile and workspace settings |
| 15 | `nav.notifications` | `/{locale}/notifications` | `Bell` | — | — |
| 16 | `nav.auditLog` | `/{locale}/audit-log` | `ScrollText` | — | — |
| 17 | `nav.apiDocs` | `/{locale}/api-docs` | `Terminal` | — | V1 said `Code2` icon — actual is `Terminal` |
| 18 | `nav.help` | `/{locale}/help` | `CircleHelp` | — | — |

**[V2] IA Observation — Flat List Cognitive Load:**
With 18 items in a flat list, the user must scan the entire list to find what they need. There is no visual grouping to reduce cognitive load. Miller's Law suggests 7±2 items as the sweet spot for working memory — this list is 2.5× that threshold. Users will rely on icon recognition and spatial memory (position) rather than logical grouping to find items.

**[V2] IA Observation — Missing Hierarchy:**
The flat list mixes primary features (screens, playlists, media) with secondary tools (templates, AI, emergency) and management items (billing, settings, audit log, API docs, help) at the same visual weight. This fails the principle of **progressive disclosure** — all features are presented at equal priority regardless of usage frequency or importance.

**[V2] HCI Heuristic Violation — Recognition vs. Recall:**
The `Clapperboard` icon is used for both "Playlists" (order 4) and "Studio" (order 6). Users must read the text label to distinguish them, violating recognition-over-recall. The icons are adjacent in the list, increasing confusion risk.

**[V2] UX Observation — Click Guards:**
Items 3-12 have `onClick` handlers that check `isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE`. However, `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` contains ALL client nav keys, meaning the toast guard never fires for any of these items. The guard code is effectively dead code — the toast `t('selectWorkspaceToast')` will never be shown. This is a logic bug in the click guard implementation.

#### Admin (Sovereign) Navigation — Grouped with Section Labels

When `sovereign` is true, the sidebar shows admin navigation with **section labels** (unlike client mode):

**Overview Section (no label):**
| Label Key | Route | Icon |
|-----------|-------|------|
| `nav.overview` | `/{locale}/overview` | `LayoutDashboard` |
| `nav.adminHome` | `/{locale}/admin` | `LayoutGrid` |

**Customers Section (`customersSection`):**
| Label Key | Route | Icon |
|-----------|-------|------|
| `nav.adminCustomers` | `/{locale}/admin/customers` | `Users` |
| `nav.adminWorkspaces` | `/{locale}/admin/workspaces` | `Building2` |
| `nav.adminFleet` | `/{locale}/admin/fleet` | `Globe2` |
| `nav.adminScreens` | `/{locale}/admin/screens` | `Server` |

**Staff Section (`staffSection`):**
| Label Key | Route | Icon |
|-----------|-------|------|
| `nav.adminStaff` | `/{locale}/admin/staff` | `UserCog` |
| `nav.adminStats` | `/{locale}/admin/stats` | `Activity` |
| `nav.adminLogs` | `/{locale}/admin/logs` | `ScrollText` |
| `nav.adminSettings` | `/{locale}/admin/settings` | `Settings` |
| `nav.adminFeatureFlags` | `/{locale}/admin/feature-flags` | `ToggleRight` |

**Resources Section (`resourcesSection`):**
| Label Key | Route | Icon |
|-----------|-------|------|
| `nav.notifications` | `/{locale}/notifications` | `Bell` |
| `nav.auditLog` | `/{locale}/audit-log` | `ScrollText` |
| `nav.apiDocs` | `/{locale}/api-docs` | `Terminal` |
| `nav.help` | `/{locale}/help` | `CircleHelp` |

**[V2] IA Observation — Admin vs. Client Inconsistency:**
Admin mode uses section labels (Customers, Staff, Resources) to group related items — reducing cognitive load to 3 groups of 4-5 items. Client mode has no such grouping despite having more items (18 vs. 15). This inconsistency means the admin experience is better structured than the client experience.

**[V2] Icon Corrections:**
- V1 listed `Monitor` for adminFleet — actual is `Globe2`
- V1 listed `MonitorSmartphone` for adminScreens — actual is `Server`
- V1 listed `Code2` for apiDocs — actual is `Terminal`

### Active State Logic

The sidebar determines the active nav item by:
1. Stripping locale prefix from pathname
2. Matching the nav item's route segment against the pathname
3. For nested routes (e.g., `/screens/{id}`), the parent `/screens` is active
4. Admin routes match on `startsWith` for nested admin pages

### Count Badges

Sidebar items for screens, media, and playlists show count badges fetched via `useWorkspaceStats` hook. This hook makes API calls with `limit=1` to get the `total` field from the paginated response envelope, avoiding full table scans.

### Sidebar Bottom Bar

> **[V2 Correction]** V1 described `ThemeToggle` component and `LanguageSwitcher` dropdown. Actual code uses inline `IconButton` components and a text button for language.

Contains three inline controls:
1. **Theme Toggle** — `IconButton` with `Sun`/`Moon` icon (not a separate `ThemeToggle` component). Toggles `next-themes` between light/dark.
2. **Language Switcher** — Simple text button showing `EN` or `AR` (not a dropdown). Clicking calls `router.replace(pathWithLocale(...))` and `router.refresh()`. The button is `h-9` with `text-[10px] font-bold uppercase` styling.
3. **Logout Button** — `IconButton` with `LogOut` icon, `danger` variant (red hover). Calls `apiLogout()`, on success clears stored token and redirects to `/{locale}/login`. On failure: shows `signOutFailed` toast and **does not redirect** — user remains on current page.

**[V2] UX Observation — Logout Failure Recovery:**
If the logout API call fails, the user sees an error toast but remains logged in. There is no retry button in the toast. The user must click logout again. This is a minor friction point — most logout failures are network issues that would also prevent other API calls.

**[V2] UX Observation — Language Switcher Discoverability:**
The language switcher is a tiny `EN`/`AR` text button with no icon or label. New users may not recognize it as a language toggle. The `aria-label` is set to `tUser('language')` which helps screen readers, but sighted users may overlook it among the theme and logout icons.

**[V2] HCI Observation — No Toast on Successful Logout:**
Unlike V1's claim that logout "shows toast", the actual sidebar logout code does NOT call `toast.success()` on successful logout. It silently clears the token and redirects. The user gets no confirmation that they've been signed out — they simply land on the login page. This violates Nielsen's **Visibility of System Status** heuristic.

---

## 3.4 Header Meta Logic (`src/lib/shell-header-meta.ts`)

The `useShellHeaderMeta` hook computes the page title, kicker, back button visibility, and back link based on the current pathname.

### Back Button Rules

| Route Pattern | Show Back | Back Href | Back Label |
|---------------|-----------|-----------|------------|
| `admin/customers/{id}/workspace/{wsId}` | Yes | `admin/customers/{id}` | `backToCustomerProfile` |
| `admin/customers/{id}` | Yes | `admin/customers` | `backToCustomers` |
| `branches/{id}/playlists/{playlistId}` | Yes | `branches/{id}` | `backToBranch` |
| `branches/{id}` | Yes | `overview` | `backToOverview` |
| `screens/{id}` | Yes | `screens` | `backToOverview` ⚠️ |
| `settings/profile` | Yes | `overview` | `backToOverview` |
| `settings/billing` | Yes | `overview` | `backToOverview` |
| `settings/workspace` | **No** | — | — ⚠️ |

**[V2] UX Inconsistency — Screen Detail Back Button Label:**
The screen detail back button (`screens/{id}`) links to `/screens` (the screens list) but its label says `backToOverview` ("Back to Overview"). This is misleading — clicking "Back to Overview" takes the user to the screens list, not the overview/dashboard. The label should say "Back to Screens" or the link should go to overview.

**[V2] UX Inconsistency — Settings/Workspace Has No Back Button:**
The `settings/workspace` route is missing from the back button rules. `settings/profile` and `settings/billing` both show back buttons, but `settings/workspace` does not. A user on the workspace settings page has no header back button and must use breadcrumbs or sidebar navigation to leave.

**[V2] HCI Observation — Back Button Label Consistency:**
The `branches/{id}` back button also says `backToOverview` and links to `overview`. This is correct for branches but inconsistent with `screens/{id}` which says `backToOverview` but links to `screens`. The back button labels don't match their destinations, violating **consistency and standards** heuristic.
| Any single-segment route in `clientMainWithBack` set | Yes | `overview` | `backToOverview` |
| All others | No | — | — |

### `clientMainWithBack` Set

Routes that show a back button when at the top level:
`media`, `screens`, `studio`, `playlists`, `schedules`, `team`, `templates`, `ai`, `emergency`, `analytics`, `audit-log`, `notifications`, `api-docs`, `help`

### Page Title Mapping

The hook maps route segments to translated page titles via the `shell.pageTitles` translation namespace. Titles include: `overview`, `screens`, `templates`, `ai`, `emergency`, `analytics`, `auditLog`, `notifications`, `apiDocs`, `help`, `media`, `studio`, `playlists`, `schedules`, `team`, `settingsProfile`, `settingsBilling`, `settingsWorkspace`, `adminCustomers`, `adminUsers`, `adminFleet`, `adminScreens`, `adminWorkspaces`, `adminStaff`, `adminStats`, `adminLogs`, `adminSettings`, `adminHome`, `adminOverview`, `adminCustomerProfile`, `adminCustomerBranch`, `branchDetail`, `branchPlaylist`.

---

## 3.5 Breadcrumbs (`src/components/layout/breadcrumbs.tsx`)

### Behavior
- Builds breadcrumb trail from `pathname` and `locale`
- Renders as `<nav aria-label>` with `<ol>` list
- Each crumb is a `<Link>` except the last (current page)
- Icons: `ChevronRight` (LTR) / `ChevronLeft` (RTL) as separators
- First crumb is always "Home" linking to `/{locale}/overview`

### Special Route Handling

| Route Pattern | Breadcrumb Trail |
|---------------|-----------------|
| `/admin/*` | Home → Admin → {section} |
| `/branches/{id}` | Home → Branches → {branch name} |
| `/branches/{id}/playlists/{playlistId}` | Home → Branches → {branch} → Playlists → {playlist} |
| `/settings/*` | Home → Settings → {section} |
| Standard | Home → {section} |

### Admin Breadcrumb Bar

Admin pages use a separate `AdminBreadcrumbBar` component (`src/components/admin/admin-breadcrumb-bar.tsx`) with items passed as props from each admin page. Items include `href` and `label`. The last item has no href (current page).

---

## 3.6 Page Header Pattern

Most shell pages follow a consistent header pattern:

```tsx
<header className="space-y-1 border-b border-border pb-4">
  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
    {kicker}
  </p>
  <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
  <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
</header>
```

This pattern is used by: screens, playlists, media, schedules, analytics, studio, templates, ai, emergency, notifications, audit-log, api-docs, help, team, settings (profile/workspace/billing), and most admin pages.

Admin overview-type pages (admin home, stats, workspaces, fleet, screens) use a slightly different pattern with `vc-page-kicker`, `vc-page-title`, and `vc-page-desc` CSS classes.

---

## 3.7 Loading States

### Shell Loading (`src/app/[locale]/(shell)/loading.tsx`)
Centered `Loader2` spinner (`h-8 w-8 animate-spin text-muted-foreground`) in a `min-h-[50vh]` flex container.

### Page-Level Loading
Individual pages use Suspense boundaries or conditional rendering:
- `OverviewPageClient`: Shows `CardGridSkeleton` with animated pulse blocks
- `ClientHomeDashboard`: Shows text "Loading..." with retry button on failure
- `MediaPage`: Uses `<Suspense>` with ellipsis fallback

---

## 3.8 Error Boundaries

### Locale Error (`src/app/[locale]/error.tsx`)
- Reports to Sentry
- Shows error title (translated)
- In development: shows raw `error.message`
- In production: shows generic message
- "Try Again" button calls `reset()`

### Shell Error (`src/app/[locale]/(shell)/error.tsx`)
- Reports to Sentry
- Shows `AlertTriangle` icon in destructive-tinted circle
- In development: shows `error.message`
- In production: shows translated generic message
- "Retry" button with `RefreshCw` icon calls `reset()`

### Not Found

**Root 404** (`src/app/not-found.tsx`): Detects locale, shows 404 code, title, description, and "Back to Home" button.

**Locale 404** (`src/app/[locale]/not-found.tsx`): Shows `SearchX` icon, 404 code, title, description, and "Back to Overview" button linking to `/{locale}/overview`.

---

## 3.9 [V2] Information Architecture Review

### Feature Grouping Assessment

The application has **18 client routes** and **13 admin routes**. The client sidebar presents all 18 routes as a flat list with no grouping, while the admin sidebar groups its 13 routes into 3 labeled sections.

**Client Mode — Flat List (18 items, no groups):**
```
Overview → Branches → Screens → Playlists → Media → Studio →
Templates → Schedules → Emergency → Analytics → AI → Team →
Billing → Settings → Notifications → Audit Log → API Docs → Help
```

**Admin Mode — Grouped (15 items, 3 groups):**
```
[Overview + Admin Home]
Customers: Customers → Workspaces → Fleet → Screens
Staff: Staff → Stats → Logs → Settings → Feature Flags
Resources: Notifications → Audit Log → API Docs → Help
```

### Navigation Depth Analysis

| Route | Depth | Path |
|-------|------|------|
| Overview | 1 | `/overview` |
| Screens | 1 | `/screens` |
| Screen detail | 2 | `/screens/{id}` |
| Branches | 1 | `/branches` |
| Branch detail | 2 | `/branches/{id}` |
| Branch playlist | 3 | `/branches/{id}/playlists/{playlistId}` |
| Settings profile | 2 | `/settings/profile` |
| Settings billing | 2 | `/settings/billing` |
| Settings workspace | 2 | `/settings/workspace` |
| Admin customer | 2 | `/admin/customers/{id}` |
| Admin customer WS | 4 | `/admin/customers/{id}/workspace/{wsId}` |

Maximum navigation depth: **4 levels** (admin customer workspace). This is within acceptable limits for enterprise SaaS (typically 3-5 levels).

### Mental Model Assessment

**[V2] Expected Mental Model:**
A digital signage SaaS typically follows: Organization → Branches/Locations → Screens → Content (Playlists/Media) → Schedules → Analytics.

**[V2] Actual Mental Model:**
The sidebar presents: Overview → Branches → Screens → Playlists → Media → Studio → Templates → Schedules → Emergency → Analytics → AI → Team → Billing → Settings → Notifications → Audit Log → API Docs → Help.

The actual order partially follows the expected model (branches → screens → content) but then mixes content creation tools (studio, templates) with scheduling (schedules) and emergency features at the same level. The transition from operational features to management/settings is not visually demarcated.

### Discoverability Assessment

| Feature | Discoverability | Reason |
|---------|---------------|--------|
| Screens | High | Top-level nav, count badge |
| Playlists | High | Top-level nav, count badge |
| Media | High | Top-level nav, count badge |
| Studio | Medium | Top-level nav but same icon as playlists |
| Templates | Medium | Top-level nav but no count badge |
| Emergency | Medium | Top-level nav but buried at position 9 |
| AI tools | Low | Position 11, after analytics |
| API docs | Low | Position 17, near bottom |
| Audit log | Low | Position 16, near bottom |
| Help | Low | Position 18, at bottom (conventional) |
| Billing | Medium | Position 13, between team and settings |
| Settings | Medium | Position 14, links to profile only |

### Navigation Efficiency

**[V2] Key User Tasks — Click Count from Overview:**

| Task | Clicks | Path |
|------|--------|------|
| View screen fleet | 1 | Overview → Screens |
| Add new screen | 2 | Overview → Screens → Add button |
| Create playlist | 1 | Overview → Playlists |
| Upload media | 1 | Overview → Media |
| Check analytics | 1 | Overview → Analytics |
| Change billing | 1 | Overview → Billing (sidebar) |
| Invite team member | 1 | Overview → Team |
| View specific screen | 2 | Overview → Screens → Click screen card |
| Access workspace settings | 1 | Overview → Settings (sidebar) |
| Create emergency broadcast | 1 | Overview → Emergency |

Most key tasks are 1-2 clicks from overview — efficient for a SaaS product.

---

## 3.10 [V2] HCI Heuristic Evaluation

### Nielsen's 10 Heuristics — Route-Level Assessment

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ⚠️ Medium | Loading states present but inconsistent (spinner vs skeleton vs text). No progress indicators on long operations. |
| Match between system and real world | ✅ Good | Terminology uses standard digital signage terms (screens, playlists, schedules, branches). |
| User control and freedom | ⚠️ Medium | Back buttons present on most pages but labels are misleading. No undo for destructive actions. Emergency stop capability exists. |
| Consistency and standards | ⚠️ Medium | Back button labels inconsistent. Same icon for different features. Admin has grouping, client doesn't. |
| Error prevention | ⚠️ Medium | Confirmation dialogs for destructive actions. Click guards on nav items (but non-functional — see §3.3). |
| Recognition rather than recall | ⚠️ Low | 18 flat nav items rely on spatial memory. Duplicate icons reduce recognition. No recently-used or favorites. |
| Flexibility and efficiency | ⚠️ Medium | Global search (Ctrl+K) provides power-user shortcut. No keyboard navigation for sidebar items. No customizable nav. |
| Aesthetic and minimalist design | ✅ Good | Clean sidebar, no visual clutter. Active state indicator is subtle but clear. |
| Help users recognize/recover from errors | ⚠️ Medium | Error boundaries present. Toast feedback for API errors. No inline validation on most forms. |
| Help and documentation | ✅ Good | Help page accessible from sidebar. Onboarding wizard for new users. |

---

## 3.11 [V2] Enterprise SaaS Navigation Review

### Scalability Concerns

**[V2] 18-item flat sidebar does not scale:**
As the product grows, new features will be added to the flat list, increasing cognitive load further. Enterprise SaaS products typically cap sidebar items at 7-8 per group, with grouping to handle feature growth.

**[V2] No workspace-scoped navigation:**
The sidebar shows the same 18 items regardless of which workspace is active. In a multi-branch enterprise scenario (e.g., 50 branches), all features are at the same navigation level. There is no workspace-contextual navigation that adapts to what's relevant for the current branch.

**[V2] No favorites/pinning:**
Power users cannot pin frequently used items or reorder the sidebar. This is a common enterprise SaaS pattern (e.g., Slack, Jira, Notion) that reduces navigation time for experienced users.

**[V2] No keyboard navigation in sidebar:**
The sidebar items are `<Link>` elements without `tabIndex` management or arrow-key navigation. Users must tab through all 18 items to reach the one they want. No `accesskey` attributes are used.

### Cross-References
- See `04-layout-and-shell.md` for sidebar component implementation details
- See `21-search-and-global-actions.md` for Ctrl+K search as navigation alternative
- See `27-user-flows.md` for complete user journey analysis
- See `26-consistency-audit.md` for pattern consistency evaluation
