# Navigation Analysis

> **Evidence basis:** `03-routing-and-navigation.md`, `04-layout-and-shell.md`, `07-workspace-management.md`, `14-settings-feature.md`, `21-search-and-global-actions.md`
> **Purpose:** Deep analysis of every navigation mechanism in the product

---

## 1. Navigation Mechanisms Inventory

| Mechanism | Location | Type | Evidence |
|-----------|----------|------|----------|
| Sidebar (desktop) | Left, fixed 240px | Primary navigation | `04-layout-and-shell.md` §4.2 |
| Sidebar (mobile) | Slide-out drawer, z-[60] | Primary navigation | `04-layout-and-shell.md` §4.2 |
| Header back button | Header left, conditional | Lateral navigation | `03-routing-and-navigation.md` §3.4 |
| Breadcrumbs | Below header, conditional | Hierarchical navigation | `04-layout-and-shell.md` §4.3 |
| Workspace switcher | Header right (desktop only) | Cross-tenant navigation | `07-workspace-management.md` §7.4 |
| Global search | Header right, Ctrl+K | Direct navigation | `21-search-and-global-actions.md` §21.2 |
| Quick actions | Dashboard | Task-based navigation | `08-dashboard-and-overview.md` §8.5 |
| Notification bell | Header right | Alert navigation | `17-notifications.md` §17.3 |
| User menu | Header right (avatar) | Account navigation | `04-layout-and-shell.md` §4.3 |
| Tab navigation | Branch detail, settings | Sub-page navigation | `13-branches-feature.md`, `14-settings-feature.md` |
| Mobile menu button | Header left | Navigation trigger | `04-layout-and-shell.md` §4.3 |
| Language switcher | Sidebar bottom bar | Locale navigation | `22-i18n-and-localization.md` §22.7 |
| Theme toggle | Sidebar bottom bar | Preference toggle | `04-layout-and-shell.md` §4.2 |

---

## 2. Sidebar Navigation — Detailed Analysis

### 2.1 Desktop Sidebar

**Physical properties** (from `04-layout-and-shell.md` §4.2):
- Width: `w-[240px]` (fixed, not `w-64`/16rem)
- Position: `fixed inset-y-0 start-0`
- Z-index: `z-40`
- Background: `bg-card/95 backdrop-blur`
- Border: `border-e border-border`
- Scroll: `overflow-y-auto` with custom scrollbar

**Nav item properties:**
- Padding: `px-3 py-2`
- Border radius: `rounded-xl`
- Active state: `bg-primary/8 text-primary` + `inset-inline-start-0` indicator bar (2px wide, primary color)
- Inactive state: `text-muted-foreground hover:bg-muted/40 hover:text-foreground`
- Hover micro-interaction: icon `group-hover:scale-105 transition-transform`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/30`
- Stroke width: `1.6` (custom `STROKE` constant, not the standard `1.5`)

**Loading state:** 7 skeleton items (`h-12 rounded-xl bg-muted/40`)

**Bottom bar:**
- Theme toggle (sun/moon icon with framer-motion animation)
- Language switcher (text button "EN"/"AR" — toggle, not dropdown)
- Logout button (with error handling — stays on page if logout fails)

### 2.2 Mobile Sidebar

**Physical properties:**
- Width: `w-[280px]` (slightly wider than desktop)
- Position: `fixed inset-y-0 start-0`
- Z-index: `z-[60]` (above header at z-[55])
- Backdrop: `z-[59]`, `bg-black/50 backdrop-blur-sm`
- Animation: `translate-x-full` (RTL) / `-translate-x-full` (LTR) → `translate-x-0`
- Close: Click backdrop, click menu button, or route change

**Missing on mobile:**
- Workspace switcher (P-002)
- No search input
- No quick actions

### 2.3 Navigation Item Count

| Mode | Items | Grouping | Evidence |
|------|-------|----------|----------|
| Client | 18 | None (flat) | `03-routing-and-navigation.md` §3.2 |
| Admin | ~13 | Grouped (Management, System) | `03-routing-and-navigation.md` §3.2 |

**Problem:** 18 ungrouped items exceeds the Miller's Law (7±2) threshold for working memory. Users must scan all 18 items to find what they need. Grouping into 4-5 categories of 3-5 items each would reduce cognitive load. (IA-001)

### 2.4 Active State Detection

Active state is determined by `pathname.startsWith(item.href)` matching. This means:
- `/screens/scre_123` matches `/screens` → Screens nav item is active ✅
- `/branches/brn_123` matches `/branches` → Branches nav item is active ✅
- `/settings/profile` matches `/settings` → Settings nav item is active ✅

**Edge case:** If two nav items have overlapping prefixes (e.g., `/playlists` and `/playlists/create`), the longer match should win. The current implementation uses `startsWith` which may cause both to be active.

### 2.5 Click Guards (Broken)

The sidebar implements click guards for workspace-dependent routes:
```typescript
if (isAuthenticated && !workspaceId && !CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE.has(route)) {
  e.preventDefault();
  toast.error(t('selectWorkspaceToast'));
}
```

**Problem (P-003):** The `e.preventDefault()` doesn't effectively cancel Next.js `Link` navigation. The toast never fires. Users navigate to pages that require workspace context and see empty/broken pages.

---

## 3. Header Navigation — Detailed Analysis

### 3.1 Header Layout

**Physical properties** (from `04-layout-and-shell.md` §4.3):
- Height: `min-h-[52px]` (not `h-16`/64px)
- Z-index: `z-[55]`
- Position: Sticky top
- Background: `bg-card/80 backdrop-blur`
- Border: `border-b border-border`

**Left section:**
- Mobile menu button (hamburger, `lg:hidden`)
- Back button (conditional, `ArrowLeft` with `rtl:rotate-180`)
- Page title (from `useShellHeaderMeta`, localized)
- Kicker (uppercase tracked label, conditional)

**Right section (desktop, `lg:flex`):**
- Global search button
- Density toggle (compact/comfortable)
- Workspace switcher
- Notification bell with badge
- User menu (avatar dropdown)

**Right section (mobile, `flex lg:hidden`):**
- Global search button
- Notification bell with badge
- User menu (avatar dropdown)

**Missing on mobile:** Workspace switcher, density toggle

### 3.2 Back Button Logic

The back button is controlled by `useShellHeaderMeta` hook (`03-routing-and-navigation.md` §3.4):

| Route | showBack | backHref | backLabel | Issue |
|-------|----------|----------|-----------|-------|
| `/screens/{id}` | true | `/screens` | "Back to Overview" | **Label mismatch** (P-004) |
| `/branches/{id}` | true | `/overview` | "Back to Overview" | ✅ Correct |
| `/playlists/{id}` | true | `/playlists` | (varies) | ✅ Correct |
| `/settings/*` | false | — | — | **Missing back button** (IA-005) |

**Problem:** The back button label says "Back to Overview" but the link goes to `/screens`. This is a `useShellHeaderMeta` logic error. (P-004)

### 3.3 Page Title Logic

`useShellHeaderMeta` derives page titles from the current pathname. The `CrystalShell` component can override the title for branch detail pages (showing the branch name instead of "Branch Detail"). (`04-layout-and-shell.md` §4.1)

**Title truncation:** The header uses `truncate` class to prevent title overflow. On mobile, long titles (e.g., branch names) may be truncated to very short strings.

---

## 4. Breadcrumb Analysis

**Location:** Below header, above main content (`04-layout-and-shell.md` §4.3)
**Component:** Custom `Breadcrumbs` component
**Behavior:** Shows path from root to current page
**RTL:** Flex direction reverses, `ChevronRight` uses `rtl:rotate-180`

**Issues:**
- Breadcrumbs are only shown on certain pages (conditional)
- No breadcrumb schema for SEO (not critical for a dashboard app)
- Breadcrumb items may not be clickable (depends on implementation)

---

## 5. Workspace Switcher Analysis

### 5.1 Desktop Behavior

**Component:** `WorkspaceSwitcher` (`07-workspace-management.md` §7.4)
**Trigger:** Dropdown button in header (`hidden lg:flex`)
**Content:** List of workspaces with names
**Selection:** `setWorkspaceId(id)` → `bumpWorkspaceDataEpoch()` → navigate to `/branches` → `router.refresh()`

**Issues:**
- No search (E-006) — unusable beyond ~20 workspaces
- No metadata (plan, screen count, status) — users can't distinguish workspaces
- Navigates to `/branches` instead of `/overview` (IA-003)
- Disabled if no workspaces exist (correct behavior)

### 5.2 Mobile Behavior

**Not available.** The switcher is `hidden lg:flex` in the header and not included in the mobile sidebar drawer. (P-002)

---

## 6. Global Search Analysis

**Component:** Modal overlay with search input (`21-search-and-global-actions.md` §21.2)
**Trigger:** Header search button or `Ctrl+K`
**Scope:** Current workspace only — no cross-workspace search
**Index:** Server-side (API call per query, no client-side index)

**Issues:**
- No keyboard navigation documentation (arrow keys, Enter, Escape)
- No search history or recent searches
- No empty state with suggestions
- No offline search capability
- Search latency depends on API response time

---

## 7. Tab Navigation Analysis

### 7.1 Branch Detail Tabs

**Tabs:** Screens, Playlists, Schedules, Settings (`13-branches-feature.md` §13.13)
**Implementation:** Radix UI Tabs
**URL sync:** Tab state may or may not be in the URL (if not, refreshing loses tab position)

### 7.2 Settings Tabs

**Tabs:** Profile, Billing, Workspace, Notifications, 2FA (`14-settings-feature.md` §14.8)
**Implementation:** Radix UI Tabs
**URL structure:** `/settings/profile`, `/settings/billing`, etc. (URL-synced)

**Issues:**
- No back button for settings sub-pages (IA-005)
- Tab order may not reflect task priority (Billing is more important than Profile for some users)

---

## 8. Navigation Consistency Issues

| Issue | Evidence | Problem ID |
|-------|----------|------------|
| Client sidebar flat, admin sidebar grouped | `03-routing-and-navigation.md` §3.2 | IA-002 |
| Back button label/target mismatch | `03-routing-and-navigation.md` §3.4 | P-004 |
| No back button on settings sub-pages | `14-settings-feature.md` §14.8 | IA-005 |
| No workspace switcher on mobile | `04-layout-and-shell.md` §4.3 | P-002 |
| Quick actions navigate instead of act | `08-dashboard-and-overview.md` §8.17 | IA-004 |
| Studio is separate nav item from Playlists | `26-consistency-audit.md` §26.6 | TD-003 |
| Icon duplication (Clapperboard) | `26-consistency-audit.md` §26.6 | TD-003 |
| Click guards broken | `03-routing-and-navigation.md` §3.3 | P-003 |
| Workspace switch navigates to /branches | `07-workspace-management.md` §7.11 | IA-003 |

---

## 9. Navigation Performance

### 9.1 Perceived Navigation Speed

| Action | Mechanism | Speed | Evidence |
|--------|-----------|-------|----------|
| Sidebar click | Client-side navigation | Fast | Next.js Link |
| Back button | Client-side navigation | Fast | Next.js Link |
| Workspace switch | API call + router refresh | Slow | `bumpWorkspaceDataEpoch()` triggers SWR revalidation |
| Search | API call per keystroke | Medium | Debounced, but network-dependent |
| Page transition | framer-motion animation | 300ms | `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}` |

### 9.2 Navigation State Persistence

| State | Persisted? | Mechanism |
|-------|-----------|-----------|
| Active workspace | Yes | `cs_workspace_id` cookie |
| Locale | Yes | `NEXT_LOCALE` cookie |
| Theme | Yes | `next-themes` localStorage |
| Scroll position | No | Lost on navigation |
| Form state | No | Lost on navigation |
| Tab state (settings) | Yes | URL path |
| Tab state (branch detail) | Unknown | May not be in URL |
| Search query | No | Lost on modal close |

---

## 10. Navigation Recommendations

### 10.1 Sidebar Restructuring

**Current:** 18 flat items
**Recommended:** 4-5 grouped categories

```
Dashboard
  └── Overview

Content
  ├── Screens
  ├── Playlists (includes Studio access)
  ├── Media
  └── Schedules

Insights
  ├── Analytics
  └── Notifications

Management
  ├── Team
  └── Settings

Developer (collapsible, hidden by default)
  ├── API Docs
  └── API Keys
```

**Branches:** Remove from top-level. Access via:
- Screens page filter (`/screens?branch={id}`)
- Dashboard cards (branch health summary)
- URL direct access (`/branches/{id}` still works, just not in nav)

**Studio:** Remove from top-level. Access via:
- Playlists page → Edit playlist → Studio opens
- Playlists page → Create playlist → Studio opens

### 10.2 Mobile Navigation

**Add to mobile sidebar:**
- Workspace switcher (at top of sidebar, before nav items)
- Quick search (at top of sidebar, below switcher)

**Consider:**
- Bottom navigation bar for primary items (Overview, Screens, Playlists, Schedules, More)
- This would reduce sidebar usage on mobile to secondary features

### 10.3 Back Button Fixes

- Fix screen detail back label (P-004): Change `backLabel` from "Back to Overview" to "Back to Screens"
- Add back button for settings sub-pages (IA-005): Add settings sub-routes to `useShellHeaderMeta`
- Add back button for branch detail: Currently goes to `/overview` — should go to `/branches` or `/screens`

### 10.4 Workspace Switcher Fixes

- Add to mobile sidebar (P-002)
- Change navigation target from `/branches` to `/overview` (IA-003)
- Add search input for workspace filtering (E-006)
- Add workspace metadata (plan, screen count, last active)

### 10.5 Click Guard Fix

- Fix `e.preventDefault()` logic (P-003): Use `router.push` guard pattern instead of event prevention, or check workspace state before rendering `Link` and show a disabled state with tooltip

---

## 11. Cross-References

- See `02-problem-map.md` for P-002, P-003, P-004, IA-001 through IA-005
- See `04-information-architecture-review.md` for IA evaluation
- See `06-user-journey-analysis.md` for navigation in user journeys
- See `11-cognitive-load-analysis.md` for navigation cognitive load
- See `18-dependency-map.md` for navigation redesign dependencies
