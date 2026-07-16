# Navigation Principles

> **Evidence basis:** `05-navigation-analysis.md` (transformation), `04-information-architecture-review.md` (transformation), `03-routing-and-navigation.md` (audit), locked sidebar decision
> **Purpose:** Define how users navigate the product — the principles that govern sidebar, header, routing, and wayfinding

---

## 1. Navigation Principle Inventory

| ID | Principle | Category | Evidence |
|----|-----------|----------|----------|
| NP-01 | Seven Items Maximum | Sidebar | Locked sidebar decision |
| NP-02 | Always Visible Context | Wayfinding | `05-navigation-analysis.md` §3.1 |
| NP-03 | Back Button Reliability | Wayfinding | `05-navigation-analysis.md` §3.4, IA-005 |
| NP-04 | Overview as Home | Routing | DD-04 |
| NP-05 | Mobile Drawer | Responsive | DD-11 |
| NP-06 | No Orphan Pages | Routing | `04-information-architecture-review.md` §8.1 |
| NP-07 | Breadcrumb Trail | Wayfinding | `04-layout-and-shell.md` §4.1 |
| NP-08 | Disabled, Not Hidden | Navigation | DD-12 |
| NP-09 | Consistent Active State | Visual | `26-consistency-audit.md` §26.6 |
| NP-10 | Route Guards | Navigation | DD-12 |

---

## 2. NP-01: Seven Items Maximum

### Principle
The sidebar contains exactly 7 first-level navigation items. No more. No exceptions.

### The Seven Items
1. **Overview** — system status, quick actions
2. **Screens** — screen management, pairing
3. **Content** — playlists and media
4. **Scheduling** — optional schedule management
5. **Analytics** — performance insights
6. **Team** — team member management
7. **Settings** — configuration, billing, API

### Architecture Rules
- No item is added without removing an existing item
- New features must find a home within one of the 7 sections
- Admin mode is separate and not subject to this limit
- The 7 items are in priority order (entity priority — `02-core-product-entities.md`)

### Evidence
Locked product decision (sidebar maximum 7 first-level items)

---

## 3. NP-02: Always Visible Context

### Principle
The user always knows: which workspace they're in, which page they're on, and where they can go.

### Context Elements

| Element | Location | What It Shows | Evidence |
|---------|----------|--------------|----------|
| Workspace switcher | Header (desktop), sidebar top (mobile) | Active workspace name + switcher | `05-navigation-analysis.md` §3.2 |
| Page title | Header center | Current page name | `03-routing-and-navigation.md` §3.4 |
| Kicker | Header (above title) | Section or context label | `03-routing-and-navigation.md` §3.4 |
| Active sidebar item | Sidebar | Highlighted current section | `03-routing-and-navigation.md` §3.2 |
| Breadcrumb | Below header | Path from home to current page | `04-layout-and-shell.md` §4.1 |

### Architecture Rules
- Workspace name is always visible (never hidden behind a menu on desktop)
- Page title is derived from route via `useShellHeaderMeta` hook
- Active sidebar item uses distinct visual treatment (background + text color)
- Breadcrumbs show at least "Home / [Section]" for detail pages

### Evidence
`05-navigation-analysis.md` §3.1; `03-routing-and-navigation.md` §3.4

---

## 4. NP-03: Back Button Reliability

### Principle
The back button always takes the user to a logical parent page. Back button labels are descriptive, not generic.

### Back Button Rules

| From Page | Back To | Label | Evidence |
|-----------|---------|-------|----------|
| Screen detail | Screen list | "Back to Screens" | `05-navigation-analysis.md` §3.4 |
| Playlist detail | Playlist library | "Back to Playlists" | — |
| Studio | Playlist detail | "Back to Playlist" | — |
| Schedule detail | Schedule calendar | "Back to Scheduling" | — |
| Settings tab | Settings (default tab) | "Back to Settings" | IA-005 fix |
| Branch detail | Overview | "Back to Overview" | `03-routing-and-navigation.md` §3.4 |
| Admin customer detail | Admin customers | "Back to Customers" | — |

### Architecture Rules
- Back button uses `useShellHeaderMeta` to derive `backHref` and `backLabel`
- Back button is visible on all detail/edit pages
- Back button is hidden on list pages (no parent to go back to)
- Back button label includes the destination name, not just "Back"
- Back button uses `ArrowLeft` icon with `rtl:rotate-180` for RTL

### Evidence
`05-navigation-analysis.md` §3.4; IA-005 (settings back button missing)

---

## 5. NP-04: Overview as Home

### Principle
Overview is the default landing page after login, after workspace switch, and after any "home" action.

### Application

| Trigger | Destination | Evidence |
|---------|------------|----------|
| Login success | `/overview` | `06-auth-and-session.md` §6.7 |
| Workspace switch | `/overview` | DD-04 |
| Registration (auto-login) | `/overview` | `05-primary-user-journey.md` |
| 404 "Go Home" link | `/overview` | `23-error-handling-and-states.md` |
| Error boundary "Try Again" | `/overview` | `23-error-handling-and-states.md` |
| Impersonation return | `/admin` | `15-admin-panel.md` |

### Architecture Rules
- No page redirects to a non-overview page after login (except auth pages)
- Workspace switch always navigates to `/overview` (DD-04)
- "Home" or logo click navigates to `/overview`
- Admin "Home" navigates to `/admin`

### Evidence
DD-04; `05-navigation-analysis.md` §3.3

---

## 6. NP-05: Mobile Drawer

### Principle
On mobile, the sidebar becomes a drawer. The workspace switcher is accessible from the drawer, not the header.

### Mobile Navigation Rules

| Element | Desktop | Mobile | Evidence |
|---------|---------|--------|----------|
| Sidebar | Always visible (`lg:flex`) | Drawer (`z-[60]`) | DD-11 |
| Workspace switcher | Header dropdown | Top of sidebar drawer | DD-11 |
| Header | Full width | Full width (with menu toggle) | `04-layout-and-shell.md` §4.1 |
| Menu toggle | Hidden | Visible (`lg:hidden`) | `04-layout-and-shell.md` §4.1 |
| Backdrop | None | `z-[59]` overlay | `04-layout-and-shell.md` §4.1 |

### Architecture Rules
- Sidebar is `hidden lg:flex` (desktop only)
- Mobile menu button is `lg:hidden` (mobile only)
- Drawer opens with slide animation (Framer Motion)
- Drawer closes on route change
- Drawer closes on backdrop click
- Workspace switcher is at the top of the drawer (not in header on mobile)

### Evidence
DD-11; `04-layout-and-shell.md` §4.1

---

## 7. NP-06: No Orphan Pages

### Principle
Every page is reachable from the sidebar or from a clear link within another page. No page exists that the user can't navigate to.

### Route Accessibility

| Route | Reachable From | Evidence |
|-------|---------------|----------|
| `/overview` | Sidebar (Overview) | Direct |
| `/screens` | Sidebar (Screens) | Direct |
| `/screens/{id}` | Screen list (click card) | Indirect |
| `/playlists` | Sidebar (Content → Playlists) | Direct |
| `/playlists/{id}` | Playlist library (click card) | Indirect |
| `/playlists/{id}/studio` | Playlist detail (edit button) | Indirect |
| `/media` | Sidebar (Content → Media) | Direct |
| `/scheduling` | Sidebar (Scheduling) | Direct |
| `/analytics` | Sidebar (Analytics) | Direct |
| `/team` | Sidebar (Team) | Direct |
| `/settings` | Sidebar (Settings) | Direct |
| `/notifications` | Header (bell icon) | Indirect |
| `/api-docs` | Settings (API tab) | Indirect |
| `/api-keys` | Settings (API tab) | Indirect |

### Architecture Rules
- No route is accessible only via URL typing
- Every indirect route has a clear link from its parent page
- Notifications page is accessible from the bell icon (not sidebar)
- API docs and keys are accessible from Settings (not sidebar)

### Evidence
`04-information-architecture-review.md` §8.1

---

## 8. NP-07: Breadcrumb Trail

### Principle
Detail pages show a breadcrumb trail from the home section to the current page.

### Breadcrumb Examples

| Page | Breadcrumb | Evidence |
|------|-----------|----------|
| Screen detail | Overview / Screens / [Screen Name] | `04-layout-and-shell.md` §4.1 |
| Playlist detail | Content / Playlists / [Playlist Name] | — |
| Studio | Content / Playlists / [Playlist Name] / Studio | — |
| Schedule detail | Scheduling / [Schedule Name] | — |
| Settings tab | Settings / [Tab Name] | — |
| Admin customer detail | Admin / Customers / [Customer Name] | — |

### Architecture Rules
- Breadcrumbs are shown on detail pages only (not list pages)
- Breadcrumb is derived from route structure
- Last breadcrumb item is the current page (not clickable)
- Breadcrumb items are clickable (navigate to parent)
- Breadcrumbs use `ChevronRight` separator with `rtl:rotate-180`

### Evidence
`04-layout-and-shell.md` §4.1

---

## 9. NP-08: Disabled, Not Hidden

### Principle
Navigation items that are unavailable are disabled (greyed out), not hidden. This preserves the mental model of the navigation structure.

### Application

| Condition | Disabled Items | Evidence |
|-----------|---------------|----------|
| No workspace selected | All except Overview | DD-12 |
| No screens in workspace | Screens (still accessible for pairing) | — |
| No team members | Team (still accessible for invite) | — |
| No API access (plan limit) | Settings → API tab (disabled) | — |
| Viewer role | Team (disabled — no access) | — |
| Feature flag off | Affected section (disabled with tooltip) | — |

### Architecture Rules
- Disabled items show a tooltip explaining why they're disabled
- Disabled items are visually greyed out but still in the same position
- Clicking a disabled item shows a toast: "[Feature] requires [prerequisite]"
- Never hide a nav item completely (except admin items for non-admins)

### Evidence
DD-12; `03-routing-and-navigation.md` §3.2

---

## 10. NP-09: Consistent Active State

### Principle
The active sidebar item is visually distinct and consistent across all pages.

### Active State Visual Rules

| Element | Active State | Inactive State |
|---------|-------------|----------------|
| Background | `bg-accent` | Transparent |
| Text color | `text-accent-foreground` | `text-muted-foreground` |
| Font weight | `font-medium` | `font-normal` |
| Left border (LTR) / Right border (RTL) | None (background is sufficient) | None |
| Icon | Same as inactive (no color change) | Same |

### Architecture Rules
- Active state is determined by route prefix match (not exact match)
- `/screens/abc-123` highlights the "Screens" nav item
- `/settings/billing` highlights the "Settings" nav item
- Active state uses logical CSS properties (no `border-l` — use `border-s`)

### Evidence
`26-consistency-audit.md` §26.6; `03-routing-and-navigation.md` §3.2

---

## 11. NP-10: Route Guards

### Principle
Routes that require prerequisites (workspace, authentication, role) are guarded. Guards redirect with a toast, not silently.

### Guard Rules

| Guard | Condition | Action | Evidence |
|-------|-----------|--------|----------|
| Auth guard | Not authenticated | Redirect to `/login` | `06-auth-and-session.md` |
| Workspace guard | Authenticated, no workspace | Show workspace welcome | `07-workspace-management.md` |
| Click guard | Authenticated, no workspace, clicking client nav | `e.preventDefault()` + toast | DD-12 |
| Sovereign mode | Super-admin on client route | Redirect to `/overview` + toast | `04-layout-and-shell.md` §4.6 |
| Role guard | Viewer on admin/owner-only page | Disable action (not redirect) | — |

### Architecture Rules
- Guards show a toast explaining why navigation was prevented
- Guards are non-destructive (don't lose form state — future: warn before redirect)
- Auth guard is server-side (middleware) + client-side (WorkspaceGate)
- Workspace guard is client-side (WorkspaceGate)
- Click guards are on sidebar items (preventDefault)

### Evidence
DD-12; `04-layout-and-shell.md` §4.6; `03-routing-and-navigation.md` §3.2

---

## Cross-References

- See `04-product-hierarchy.md` for product hierarchy
- See `15-interaction-principles.md` for interaction principles
- See `17-product-rules.md` for product rules
- See `transformation/05-navigation-analysis.md` for current navigation analysis
- See `transformation/04-information-architecture-review.md` for IA review
- See `transformation/24-design-decisions.md` DD-01 through DD-04, DD-11, DD-12 for navigation decisions
