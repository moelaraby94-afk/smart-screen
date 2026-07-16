# Navigation Architecture

> **Evidence basis:** `04-final-ia-sitemap.md`, `product-architecture/16-navigation-principles.md`, `transformation/05-navigation-analysis.md`, locked product decisions
> **Purpose:** Define the complete navigation architecture — sidebar, header, breadcrumbs, tabs, search, quick actions, and cross-navigation

---

## 1. Sidebar Architecture

### 1.1 Client Sidebar (7 Items)

| # | Label (EN) | Label (AR) | Route | Icon | Priority | Evidence |
|---|-----------|-----------|-------|------|----------|----------|
| 1 | Overview | نظرة عامة | `/overview` | LayoutDashboard | — | M-01 |
| 2 | Screens | الشاشات | `/screens` | Monitor | #2 | M-02 |
| 3 | Content | المحتوى | `/content` | Clapperboard | #3, #4 | M-03 |
| 4 | Scheduling | الجدولة | `/scheduling` | CalendarClock | #5 | M-04 |
| 5 | Analytics | التحليلات | `/analytics` | BarChart3 | #7 | M-05 |
| 6 | Team | الفريق | `/team` | Users | #6 | M-06 |
| 7 | Settings | الإعدادات | `/settings` | Settings | — | M-07 |

### 1.2 Sidebar Visual Rules

| Element | Active State | Inactive State | Evidence |
|---------|-------------|----------------|----------|
| Background | `bg-primary/8` | Transparent | `05-navigation-analysis.md` §2.1 |
| Text color | `text-primary` | `text-muted-foreground` | NP-09 |
| Font weight | `font-medium` | `font-normal` | NP-09 |
| Icon | Same color as text | Same color as text | NP-09 |
| Padding | `px-3 py-2` | `px-3 py-2` | `05-navigation-analysis.md` §2.1 |
| Border radius | `rounded-xl` | `rounded-xl` | `05-navigation-analysis.md` §2.1 |
| Hover | — | `hover:bg-muted/40 hover:text-foreground` | `05-navigation-analysis.md` §2.1 |
| Focus | `focus-visible:ring-2 focus-visible:ring-primary/30` | Same | NP-09 |
| Icon stroke | 1.5 (standardized) | 1.5 | F-MP-02 |

### 1.3 Sidebar Bottom Bar

| Element | Desktop | Mobile | Evidence |
|---------|---------|--------|----------|
| Theme toggle | Sun/Moon icon (Framer Motion) | Same | `05-navigation-analysis.md` §2.1 |
| Language switcher | Text button "EN"/"AR" | Same | `22-i18n-and-localization.md` |
| Logout | Button with error handling | Same | `05-navigation-analysis.md` §2.1 |

### 1.4 Admin Sidebar (Grouped)

**Management:**
| Label (EN) | Route | Icon |
|-----------|-------|------|
| Customers | `/admin/customers` | Building2 |
| Staff | `/admin/staff` | UserCog |
| Users | `/admin/users` | Users |

**System:**
| Label (EN) | Route | Icon |
|-----------|-------|------|
| Workspaces | `/admin/workspaces` | Layers |
| Fleet | `/admin/fleet` | MonitorSmartphone |
| Health | `/admin/health` | Activity |
| Logs | `/admin/logs` | ScrollText |
| Feature Flags | `/admin/feature-flags` | Flag |

### 1.5 Sidebar Ordering Rules

| Rule | Rationale | Evidence |
|------|-----------|----------|
| Overview is always first | Landing page, status at a glance | NP-04 |
| Entity priority order: Screens > Content > Scheduling | Matches locked entity priority | `product-architecture/02-core-product-entities.md` |
| Analytics after Scheduling | Insights come after management | Entity priority #7 |
| Team before Settings | Management before configuration | Entity priority #6 |
| Settings is always last | Configuration is least frequently accessed | Task hierarchy |
| Admin items grouped (Management, System) | Existing pattern, works well | `03-routing-and-navigation.md` §3.5 |

---

## 2. Header Architecture

### 2.1 Desktop Header

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [≡] [← Back]    [Page Title]              [🔍] [WS Switcher] [🔔] [Avatar]│
│                 [Kicker]                                              [▾]  │
└──────────────────────────────────────────────────────────────────────────┘
```

| Element | Position | Behavior | Evidence |
|---------|----------|----------|----------|
| Mobile menu toggle (≡) | Start (left in LTR, right in RTL) | `lg:hidden` — opens drawer | NP-05 |
| Back button (←) | Start, conditional | Visible on detail pages only | NP-03 |
| Page title | Center | Derived from route via `useShellHeaderMeta` | NP-02 |
| Kicker | Above title | Section or context label | NP-02 |
| Global search (🔍) | End group | Ctrl+K shortcut, opens command palette | `21-search-and-global-actions.md` |
| Workspace switcher | End group (desktop only) | Dropdown with search | NP-02, SCL-01 |
| Notification bell (🔔) | End group | Badge with unread count, dropdown | `17-notifications.md` |
| User menu (Avatar) | End group | Dropdown: profile, settings, logout | `04-layout-and-shell.md` |

### 2.2 Mobile Header

```
┌──────────────────────────────┐
│ [≡]  [Page Title]  [🔔] [⋮]  │
└──────────────────────────────┘
```

| Element | Position | Behavior | Evidence |
|---------|----------|----------|----------|
| Mobile menu toggle (≡) | Start | Opens drawer with workspace switcher at top | NP-05 |
| Page title | Center | Same as desktop | NP-02 |
| Notification bell (🔔) | End | Same as desktop | NP-05 |
| More menu (⋮) | End | Dropdown: search, settings, logout | NP-05 |

**Mobile-specific changes from current:**
- Workspace switcher moves to drawer top (fixes P-002)
- Global search moves to "More" menu (fixes NW-09)
- Language switcher stays in drawer bottom bar

### 2.3 Header Elements Not in Sidebar

| Element | Why It's in Header | Evidence |
|---------|-------------------|----------|
| Workspace switcher | Cross-tenant navigation, always accessible | NP-02 |
| Notification bell | Alert-driven navigation, always accessible | `17-notifications.md` |
| Global search | Direct navigation, Ctrl+K | `21-search-and-global-actions.md` |
| User menu | Account-level actions (profile, logout) | `04-layout-and-shell.md` |
| Back button | Lateral navigation, contextual | NP-03 |

---

## 3. Breadcrumb Strategy

### 3.1 Breadcrumb Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Show on detail pages only | List pages don't need breadcrumbs | NP-07 |
| Format: Section / Entity Name | Two levels maximum | NP-07 |
| Last item is current page | Not clickable | NP-07 |
| Previous items are clickable | Navigate to parent | NP-07 |
| Separator: ChevronRight | `rtl:rotate-180` for RTL | RTC-02 |
| Use entity name, not ID | "Screen A" not "abc-123" | NP-07 |

### 3.2 Breadcrumb Examples

| Page | Breadcrumb | Clickable Items |
|------|-----------|-----------------|
| `/screens/{id}` | Screens / [Screen Name] | "Screens" → `/screens` |
| `/content/playlists/{id}` | Content / [Playlist Name] | "Content" → `/content` |
| `/content/playlists/{id}/studio` | Content / [Playlist Name] / Studio | "Content" → `/content`, "[Playlist Name]" → `/content/playlists/{id}` |
| `/settings/billing` | Settings / Billing | "Settings" → `/settings` |
| `/admin/customers/{id}` | Customers / [Customer Name] | "Customers" → `/admin/customers` |

### 3.3 Pages Without Breadcrumbs

| Page | Why No Breadcrumb |
|------|-------------------|
| `/overview` | Top-level, no parent |
| `/screens` | Top-level list |
| `/content` | Top-level list |
| `/scheduling` | Top-level |
| `/analytics` | Top-level |
| `/team` | Top-level |
| `/settings` | Top-level (default tab) |
| `/notifications` | Accessed via bell, not hierarchical |

---

## 4. Tab Strategy

### 4.1 Pages with Tabs

| Page | Tabs | Default Tab | Evidence |
|------|------|-------------|----------|
| Content (`/content`) | Playlists, Media | Playlists | M-03 |
| Settings (`/settings`) | Profile, Workspace, Billing, Notifications, Security, API | Profile | M-07 |
| Analytics (`/analytics`) | Screen Health, Content Performance | Screen Health | M-05 |

### 4.2 Tab Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Tabs are URL-addressable | `/settings/billing` not `/settings?tab=billing` | RESTful, bookmarkable |
| Default tab loads on base route | `/settings` loads Profile tab | NP-02 |
| Tab state is in URL, not local state | Shareable, bookmarkable | NP-06 |
| Maximum 6 tabs per page | Beyond 6, use sub-navigation | Cognitive load |
| Tab labels are nouns, not verbs | "Billing" not "Manage Billing" | Naming convention |
| Each tab has independent save | No global save button | PR-36 |

### 4.3 Content Section Tab Decision

The Content section uses **tabs** for Playlists and Media (not a unified grid):

| Factor | Tabs | Unified Grid |
|--------|------|-------------|
| Entity distinction | Clear — Playlists and Media are different entities | Fuzzy — mixed grid is confusing |
| Mental model | Matches "I want my playlists" / "I want my media" | Doesn't match either mental model |
| Search | Per-entity search (search within playlists or media) | Mixed search (confusing results) |
| Filter | Per-entity filter | Mixed filter (complex) |
| Scalability | New tab for templates (future) | Grid becomes overloaded |

**Decision: Tabs** — Clearer entity distinction, better search/filter, more scalable.

---

## 5. Search Architecture

### 5.1 Search Types

| Type | Scope | Entry Point | Results | Evidence |
|------|-------|------------|---------|----------|
| Global search (Ctrl+K) | All entities in current workspace | Header search icon / Ctrl+K | Screens, Playlists, Media, Schedules, Team members | `21-search-and-global-actions.md` |
| In-page search | Current entity list | Search bar on list page | Screens / Playlists / Media / Team | Per-module |
| Workspace search | Workspace list | Workspace switcher dropdown | Workspaces by name | SCL-01 |

### 5.2 Global Search (Command Palette)

| Attribute | Value | Evidence |
|-----------|-------|----------|
| Trigger | Ctrl+K (desktop), "More" menu → Search (mobile) | `21-search-and-global-actions.md` |
| Scope | Current workspace only | PC-19 (tenant isolation) |
| Result types | Screens, Playlists, Media, Schedules, Team members, Settings tabs, Quick actions | — |
| Result format | Icon + title + type label + breadcrumb | — |
| Keyboard navigation | Arrow keys + Enter | ACC-02 |
| Empty query | Shows recent items + quick actions | — |
| No results | "No results found for '[query]'" + clear button | IP-07 |

### 5.3 In-Page Search

| Page | Search Field | Debounce | Evidence |
|------|-------------|----------|----------|
| Screen list | Screen name | 300ms | F-HP-03 |
| Playlist library | Playlist name | 300ms | — |
| Media library | Filename | 300ms | — |
| Team list | Member name or email | 300ms | — |
| Schedule calendar | Not applicable (date-scoped) | — | — |
| Admin customers | Customer name | 300ms | — |

---

## 6. Quick Actions

### 6.1 Overview Quick Actions

| Action | Destination | Icon | Priority | Evidence |
|--------|------------|------|----------|----------|
| Add Screen | `/screens/pair` | MonitorPlus | Primary | 5-min KPI |
| Create Playlist | `/content` (create mode) | Plus | Secondary | 5-min KPI |
| View Schedule | `/scheduling` | Calendar | Tertiary | — |

### 6.2 Contextual Quick Actions

| Page | Action | Destination | Evidence |
|------|--------|------------|----------|
| Screen detail | Assign Content | Dialog (playlist selector) | M-02 |
| Screen detail | Override Content | Dialog (playlist selector) | M-02 |
| Screen detail | Edit Playlist | `/content/playlists/{id}/studio` | Cross-navigation |
| Screen detail | View Analytics | `/analytics` (filtered) | Cross-navigation |
| Playlist detail | Publish to Screens | Dialog (screen selector) or immediate | M-03 |
| Playlist detail | Edit in Studio | `/content/playlists/{id}/studio` | M-03 |
| Playlist detail | Create Schedule | `/scheduling` (pre-filled) | Cross-navigation |
| Media detail | View in Playlists | Links to playlists using this media | Cross-navigation |
| Schedule calendar | View Screen | `/screens/{id}` | Cross-navigation |

---

## 7. Cross-Navigation Map

### 7.1 Cross-Section Links

```
Overview ──→ Screens (health alert click)
Overview ──→ Content (quick action)
Overview ──→ Scheduling (quick action)

Screens ──→ Content (edit current playlist)
Screens ──→ Analytics (view screen analytics)
Screens ──→ Scheduling (view screen schedules)

Content ──→ Screens (publish to screens)
Content ──→ Scheduling (schedule this playlist)
Content ──→ Content (media → playlist usage link)

Scheduling ──→ Content (edit scheduled playlist)
Scheduling ──→ Screens (view targeted screen)

Analytics ──→ Screens (drill down to screen)
Analytics ──→ Content (drill down to playlist)

Team ──→ Settings (user clicks "my settings")
Settings ──→ Team (billing admin clicks "manage team")
```

### 7.2 Cross-Navigation Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Cross-links are buttons or links, not redirects | User stays in control | IP-04 |
| Cross-links preserve context where possible | Pre-fill forms (e.g., schedule with playlist) | IP-01 |
| Cross-links are visible, not hidden | Buttons in action areas, not in menus | IP-09 |
| Every detail page has at least one cross-link | No dead ends | IP-07 |
| Cross-links use Next.js `<Link>` | Client-side navigation, no full page reload | AC-02 |

---

## 8. Context Navigation

### 8.1 Workspace Context

| Element | Location | Always Visible? | Evidence |
|---------|----------|----------------|----------|
| Workspace name | Switcher in header (desktop) / drawer (mobile) | Yes | NP-02 |
| Workspace switch | Switcher dropdown | Yes | NP-02 |
| Workspace branding | Sidebar logo area | Yes (if branded) | BrandingProvider |

### 8.2 Route Context

| Element | Location | Always Visible? | Evidence |
|---------|----------|----------------|----------|
| Page title | Header center | Yes | NP-02 |
| Kicker | Header above title | Yes | NP-02 |
| Active sidebar item | Sidebar | Yes | NP-09 |
| Breadcrumb | Below header (detail pages) | Detail pages only | NP-07 |

### 8.3 User Context

| Element | Location | Always Visible? | Evidence |
|---------|----------|----------------|----------|
| User avatar | Header end | Yes | `04-layout-and-shell.md` |
| User role | Not shown in header (shown in Team page) | No | M-06 |
| Notification badge | Bell icon | Yes | `17-notifications.md` |

---

## 9. Mobile Navigation Architecture

### 9.1 Mobile Drawer

```
┌──────────────────────┐
│ [Workspace Switcher] │  ← Top of drawer (fixes P-002)
│ ──────────────────── │
│ Overview             │
│ Screens              │
│ Content              │
│ Scheduling           │
│ Analytics            │
│ Team                 │
│ Settings             │
│ ──────────────────── │
│ [🌙] [EN/AR] [Logout]│  ← Bottom bar
└──────────────────────┘
```

### 9.2 Mobile Navigation Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Drawer width | 280px (`w-[280px]`) | `05-navigation-analysis.md` §2.2 |
| Drawer z-index | `z-[60]` (above header) | `05-navigation-analysis.md` §2.2 |
| Backdrop | `z-[59]`, `bg-black/50 backdrop-blur-sm` | `05-navigation-analysis.md` §2.2 |
| Close triggers | Backdrop click, route change, menu button | NP-05 |
| Animation | Slide from start edge (LTR: left, RTL: right) | `04-layout-and-shell.md` §4.2 |
| Workspace switcher at top | Fixes P-002 | NP-05 |
| No search in drawer | Search via "More" menu in header | NP-05 |

---

## Cross-References

- See `04-final-ia-sitemap.md` for the complete sitemap
- See `06-page-catalog.md` for per-page documentation
- See `07-page-states.md` for empty/loading/error states
- See `08-naming-and-conventions.md` for naming rules
- See `product-architecture/16-navigation-principles.md` for navigation principles
- See `transformation/05-navigation-analysis.md` for current navigation analysis
