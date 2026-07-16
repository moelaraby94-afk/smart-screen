# Screen Specifications — Global Layout Shell

> **Evidence basis:** `ux-blueprint/05-page-type-ux-rules.md`, `information-architecture/05-navigation-architecture.md`, `product-architecture/16-navigation-principles.md`, `audits/frontend/02-design-system-and-tokens.md`, `user-flow-architecture/01-flow-principles.md`
> **Purpose:** Specification for the application shell — sidebar, header, layout grid, and all shared structural components

---

## SCR-GLOBAL-01: Application Shell

### Screen ID
SCR-GLOBAL-01

### Purpose
The persistent application shell that wraps all authenticated pages — sidebar navigation, top header, and main content area.

### Business Goal
Provide consistent navigation and context across all pages; minimize cognitive load; support the 5-minute KPI by making primary actions discoverable.

### User Goal
Navigate between sections; understand current location; access workspace context and notifications.

### Primary Users
All authenticated users (Owner, Editor, Viewer).

### Permissions
- Sidebar items visible based on role (PR-33)
- Admin sidebar items visible only for Super-Admin (M-08)
- Workspace switcher visible for all roles

### Entry Points
- Post-login redirect (all authenticated routes)
- Direct URL access to any authenticated route

### Exit Points
- Logout (header → user menu → logout)
- Session expiry (auto-redirect to login)

### Navigation
- **Sidebar:** Primary navigation between sections
- **Header:** Workspace switcher, search (future), notifications bell, user menu
- **Content area:** Page-specific content

### Breadcrumbs
- Not used in standard layout (sidebar provides location context)
- Used in detail pages (e.g., Screen Detail, Playlist Detail) — see individual specs

### Page Title
- Set per-page via `document.title` or Next.js metadata
- Format: `[Page Name] — Cloud-Screen`

---

## Layout

### Grid

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (240px) │           Header (56px)                │
│                 ├─────────────────────────────────────────┤
│                 │                                         │
│                 │           Main Content                  │
│                 │           (flex-1, scrollable)          │
│                 │                                         │
│                 │                                         │
└─────────────────┴─────────────────────────────────────────┘
```

### Container
- **Sidebar:** Fixed width 240px (desktop), collapsible to 64px (icon-only), hidden on mobile (drawer)
- **Header:** Fixed height 56px, sticky top, full width of content area
- **Main Content:** `flex-1`, `overflow-y-auto`, max-width 1400px centered with `px-6 py-6` padding

### Spacing
- **Sidebar items:** `h-9`, `px-3`, `gap-1` between items, `gap-0.5` within groups
- **Header:** `px-4`, items `gap-3`
- **Content padding:** `px-6 py-6` (desktop), `px-4 py-4` (tablet), `px-3 py-3` (mobile)
- **Section spacing:** `gap-6` between major sections

### Visual Hierarchy
1. **Sidebar:** Low visual weight (muted background, active item highlighted)
2. **Header:** Medium visual weight (border-bottom, white background)
3. **Content:** High visual weight (primary focus area)

### Sticky Elements
- **Sidebar:** `position: fixed` (desktop), always visible
- **Header:** `position: sticky; top: 0; z-index: 30`
- **Page headers (within content):** `position: sticky; top: 56px; z-index: 20` (per-page, optional)

### Scrollable Areas
- **Sidebar:** `overflow-y-auto` if items exceed viewport height
- **Main Content:** `overflow-y-auto` (primary scroll area)
- **Sidebar groups:** Collapsible; expanded group scrolls if needed

---

## Component Tree

```
<AppShell>
  <Sidebar>
    <SidebarLogo />
    <SidebarNav>
      <SidebarGroup label="Workspace">
        <SidebarItem icon="LayoutDashboard" label="Overview" route="/overview" />
        <SidebarItem icon="Monitor" label="Screens" route="/screens" />
        <SidebarItem icon="Image" label="Content" route="/content" />
        <SidebarItem icon="CalendarClock" label="Scheduling" route="/scheduling" />
        <SidebarItem icon="BarChart3" label="Analytics" route="/analytics" />
        <SidebarItem icon="Users" label="Team" route="/team" />
      </SidebarGroup>
      <SidebarGroup label="Settings">
        <SidebarItem icon="Settings" label="Settings" route="/settings" />
      </SidebarGroup>
      <SidebarGroup label="Admin" (Super-Admin only)>
        <SidebarItem icon="Building2" label="Customers" route="/admin/customers" />
        <SidebarItem icon="UserCog" label="Staff" route="/admin/staff" />
        <SidebarItem icon="Users" label="Users" route="/admin/users" />
        <SidebarItem icon="Monitor" label="Workspaces" route="/admin/workspaces" />
        <SidebarItem icon="HardDrive" label="Fleet" route="/admin/fleet" />
        <SidebarItem icon="Activity" label="Health" route="/admin/health" />
        <SidebarItem icon="ScrollText" label="Logs" route="/admin/logs" />
        <SidebarItem icon="Flag" label="Feature Flags" route="/admin/feature-flags" />
      </SidebarGroup>
    </SidebarNav>
    <SidebarFooter>
      <StorageIndicator /> (future)
    </SidebarFooter>
  </Sidebar>
  <Header>
    <SidebarToggle /> (mobile only)
    <WorkspaceSwitcher />
    <GlobalSearch /> (future, Ctrl+K)
    <NotificationBell />
    <UserMenu>
      <UserAvatar />
      <DropdownMenu>
        <MenuItem label="Profile" route="/settings" />
        <MenuItem label="Settings" route="/settings" />
        <MenuSeparator />
        <MenuItem label="Logout" onClick={logout} />
      </DropdownMenu>
    </UserMenu>
  </Header>
  <MainContent>
    {children} // Page-specific content
  </MainContent>
</AppShell>
```

### Component Details

#### Sidebar
- **Type:** Shared layout component
- **Props:** `collapsed: boolean`, `onNavigate: () => void`
- **State ownership:** `collapsed` state in layout store (Zustand or context)
- **Width:** 240px expanded, 64px collapsed
- **Background:** `bg-muted/30` (muted, semi-transparent)
- **Border:** `border-r border-border`
- **Responsive:** Hidden on mobile (< 768px); shown as drawer

#### SidebarItem
- **Type:** Shared navigation component
- **Props:** `icon: LucideIcon`, `label: string`, `route: string`, `active: boolean`, `badge?: number`
- **Active state:** `bg-primary/10 text-primary font-medium` with left border accent
- **Inactive state:** `text-muted-foreground hover:bg-muted hover:text-foreground`
- **Icon size:** 18px
- **Label:** `text-sm`, truncated if > 20 chars
- **Badge:** Small count badge (e.g., pending invites on Team)

#### WorkspaceSwitcher
- **Type:** Shared header component
- **Props:** None (reads from workspace context)
- **State ownership:** Current workspace ID in cookie + SWR cache
- **UI:** Button showing workspace name + chevron; dropdown with workspace list
- **Search:** Appears if > 5 workspaces; debounced 300ms
- **Data:** `useApiWorkspaces()` — list of user's workspaces
- **Mutations:** `useApiWorkspaceSwitch(id)` — sets `cs_workspace_id` cookie
- **Realtime:** None
- **Accessibility:** `role="combobox"`, `aria-expanded`, `aria-label="Switch workspace"`

#### NotificationBell
- **Type:** Shared header component
- **Props:** None (reads from notification context)
- **State ownership:** Unread count from SWR + Socket.IO
- **UI:** Bell icon with badge (unread count); dropdown with recent 5 notifications
- **Data:** `useApiNotifications({ limit: 5 })` — recent notifications
- **Realtime:** Socket.IO `notification:new` event → prepend to list + increment badge
- **Accessibility:** `aria-label="Notifications ([N] unread)"`, `role="button"`

#### UserMenu
- **Type:** Shared header component
- **UI:** Avatar + dropdown menu (Profile, Settings, Logout)
- **Data:** `useApiCurrentUser()` — user profile
- **Mutations:** `useApiLogout()` — clear session
- **Accessibility:** `role="menu"`, items `role="menuitem"`

---

## Responsive

### Desktop (≥ 1024px)
- Sidebar: Fixed 240px, always visible
- Header: Full width, all elements visible
- Content: Max-width 1400px, centered

### Tablet (768px – 1023px)
- Sidebar: Collapsible (64px icon-only by default, expand on hover or click)
- Header: Full width, search hidden (future), workspace switcher truncated
- Content: Full width, `px-4`

### Mobile (< 768px)
- Sidebar: Hidden, shown as drawer (overlay) on menu tap
- Header: Compact — hamburger menu, workspace name (truncated), bell, avatar
- Content: Full width, `px-3`
- **Drawer behavior:** Slides from left, 280px width, overlay with `bg-black/50`, close on outside click or Escape
- **Touch:** Swipe right to open drawer (future), swipe left to close

### Minimum Supported Width
- 320px (mobile portrait, smallest common device)

### Safe Areas
- iOS notch: `env(safe-area-inset-top)` on header
- Bottom safe area: `env(safe-area-inset-bottom)` on mobile drawer

---

## States

### Loading
- **Initial app load:** Splash screen with Cloud-Screen logo + spinner (500ms max)
- **Sidebar:** Skeleton items (gray bars) during workspace data fetch
- **Header:** Workspace name shows "Loading..." during switch

### Error
- **Sidebar:** If workspace data fails, sidebar shows with error toast: "Failed to load navigation"
- **Header:** If user data fails, user menu shows generic avatar

### Offline
- **Header:** Small "Offline" indicator (amber dot) next to workspace name
- **Sidebar:** Functional (navigation doesn't require network)
- **Content:** Per-page offline handling (see individual specs)

### Permission Denied
- **Sidebar:** Admin group hidden for non-Super-Admin users
- **Settings tab:** Billing hidden for non-Owner (Editor/Viewer see Profile + Notifications only)

---

## Interactions

### Sidebar
| Interaction | Behavior |
|-------------|----------|
| Click item | Navigate to route; close mobile drawer |
| Hover item | `bg-muted` background (150ms) |
| Active item | `bg-primary/10 text-primary` + left border accent |
| Collapse toggle | (Desktop) Click logo area to collapse/expand |
| Mobile open | Tap hamburger in header → drawer slides in |
| Mobile close | Tap outside, swipe left, or Escape |

### Header
| Interaction | Behavior |
|-------------|----------|
| Click workspace switcher | Dropdown opens with workspace list |
| Click notification bell | Dropdown opens with recent notifications |
| Click user avatar | Dropdown menu opens |
| Click outside dropdown | Closes any open dropdown |
| Escape | Closes any open dropdown |

### Keyboard
| Key | Action |
|-----|--------|
| Tab | Navigate through header elements |
| Escape | Close any open dropdown/drawer |
| Ctrl+K | (Future) Open command palette |

---

## Accessibility

| Element | Rule | Evidence |
|---------|------|----------|
| Sidebar | `role="navigation"`, `aria-label="Main navigation"` | ACC-02 |
| Sidebar items | `role="link"`, `aria-current="page"` for active | ACC-02 |
| Header | `role="banner"` | ACC-03 |
| Workspace switcher | `aria-label="Switch workspace"`, `aria-expanded` | ACC-03 |
| Notification bell | `aria-label="Notifications ([N] unread)"` | ACC-03 |
| User menu | `aria-label="User menu"`, `aria-haspopup="menu"` | ACC-03 |
| Focus order | Sidebar → Header (left to right) → Content | ACC-02 |
| Focus ring | `focus-visible:ring-2 ring-ring ring-offset-2` on all interactive elements | ACC-01 |
| Contrast | Sidebar text meets 4.5:1; active item meets 3:1 | ACC-01 |
| Touch targets | All sidebar items ≥ 36px height (desktop), ≥ 44px (mobile) | PR-45 |
| Reduced motion | Drawer slide: opacity-only fallback | ACC-04 |

---

## Performance UX

| Concern | Strategy | Evidence |
|---------|----------|----------|
| Initial load | Next.js streaming + Suspense for sidebar and header | `13-frontend-state-boundaries.md` |
| Sidebar data | SWR fetch workspace + user data on mount; cached | — |
| Route transitions | Next.js App Router prefetching on sidebar item hover | NP-03 |
| Code splitting | Sidebar and header in root layout (always loaded); page content code-split | — |
| Realtime | Socket.IO connection established on shell mount; events for notifications + screen status | `13-frontend-state-boundaries.md` |

---

## API Requirements

### Data Required
- User profile (name, email, avatar, role)
- Workspace list (id, name, plan)
- Current workspace ID (from cookie)
- Unread notification count
- Sidebar badge counts (e.g., pending invites)

### API Endpoints Used
| Endpoint | Method | Purpose | SWR Key |
|----------|--------|---------|---------|
| `/auth/me` | GET | Current user profile | `useApiCurrentUser` |
| `/workspaces` | GET | User's workspace list | `useApiWorkspaces` |
| `/notifications?unread=true&limit=1` | GET | Unread count for badge | `useApiUnreadCount` |
| `/notifications?limit=5` | GET | Recent notifications for dropdown | `useApiNotifications` |
| `/auth/logout` | POST | Logout (invalidate token) | `useApiLogout` |
| `/team/invites?status=pending` | GET | Pending invite count (badge) | `useApiPendingInvites` |

### Mutations
| Mutation | Trigger | Optimistic? |
|----------|---------|-------------|
| `useApiWorkspaceSwitch(id)` | User selects workspace | No (waits for API) |
| `useApiLogout()` | User clicks logout | No (clears client state) |
| `useApiNotificationMarkRead(id)` | User clicks notification | Yes (remove blue dot immediately) |

### Realtime Events
| Event | Handler | UI Update |
|-------|---------|-----------|
| `notification:new` | Prepend to notification list | Bell badge +1; dropdown updates if open |
| `screen:status` | Update screen status in cache | No direct shell update (per-page) |
| `workspace:updated` | Revalidate workspace data | Workspace name updates if changed |

### Backend Limitations
- No WebSocket authentication token refresh (token must be valid for socket connection)
- Workspace list doesn't include screen count (requires separate fetch per workspace — N+1 issue)
- No bulk unread count endpoint (must fetch notifications and count client-side — future)

### Missing APIs
- `GET /search?q={query}` — Global search endpoint (future, FL-SYS-02)
- `GET /workspaces/{id}/storage` — Storage usage for sidebar indicator (future)

---

## Acceptance Criteria

### Functional
- [ ] Sidebar displays all workspace navigation items for authenticated users
- [ ] Admin group visible only for Super-Admin role
- [ ] Workspace switcher lists all user's workspaces and switches on click
- [ ] Notification bell shows unread count badge
- [ ] User menu shows profile, settings, and logout
- [ ] Active sidebar item highlighted based on current route
- [ ] Sidebar collapses on tablet (icon-only mode)

### UX
- [ ] Navigation between pages completes in < 200ms (perceived)
- [ ] Workspace switch updates all data within 1s
- [ ] Notification dropdown opens within 150ms
- [ ] No layout shift during initial load (skeleton states)
- [ ] Sidebar item hover feedback within 100ms

### Accessibility
- [ ] Full keyboard navigation through sidebar and header
- [ ] ARIA roles and labels on all navigation elements
- [ ] Focus visible on all interactive elements
- [ ] Screen reader announces current page via `aria-current`
- [ ] Mobile drawer is keyboard accessible (focus trap)

### Performance
- [ ] Initial shell render < 500ms
- [ ] Route transition < 200ms (perceived)
- [ ] Realtime notification appears < 1s after event
- [ ] No hydration errors

### Responsive
- [ ] Sidebar hidden on mobile, shown as drawer
- [ ] Header adapts to mobile (hamburger, truncated names)
- [ ] Content padding adjusts per breakpoint
- [ ] No horizontal scroll at 320px width

---

## Current Problems

| ID | Problem | Impact | Evidence |
|----|---------|--------|----------|
| GP-01 | No sidebar collapse on tablet | Wastes screen space on 768-1024px | `02-design-system-and-tokens.md` |
| GP-02 | No storage indicator in sidebar | Users don't know storage usage | `ux-blueprint/11-settings-ux-blueprint-part1.md` |
| GP-03 | No global search in header | Users can't quickly find entities | FL-SYS-02 (future) |
| GP-04 | No command palette | Power users lack keyboard navigation | FL-SYS-03 (future) |
| GP-05 | Workspace switcher has no search | Multi-workspace users struggle with > 5 | `07-workspace-flows.md` FL-WS-02 |

## Technical Debt

| ID | Debt | Impact | Evidence |
|----|------|--------|----------|
| GTD-01 | Sidebar items not code-split | All icons loaded upfront | — |
| GTD-02 | No sidebar state persistence | Collapse state resets on refresh | — |
| GTD-03 | Notification badge fetches full list | N+1 for unread count | Backend limitation |

## UX Improvements

| ID | Improvement | Priority | Effort |
|----|------------|----------|--------|
| GUI-01 | Add sidebar collapse toggle for tablet | Medium | Low |
| GUI-02 | Add storage indicator in sidebar footer | Medium | Low |
| GUI-03 | Add global search in header | High | Medium |
| GUI-04 | Add command palette (Ctrl+K) | High | Medium |
| GUI-05 | Add search to workspace switcher | Medium | Low |

## Future Improvements
- Customizable sidebar (drag to reorder — enterprise)
- Pin/favorite pages
- Recent pages section
- Contextual sidebar items (show relevant items based on current page)

## Blocked By Backend
- Global search API (GP-03)
- Storage usage API (GP-02)
- Bulk unread count endpoint (GTD-03)

## Blocked By Business
- Command palette requires product decision on scope (GP-04)

---

## Cross-References

- See `02-auth-error-specs.md` for authentication screen specs
- See `03-overview-spec.md` through `12-admin-specs-part2.md` for page-specific specs
- See `13-shared-dialogs-specs.md` for dialog, drawer, and wizard specs
- See `ux-blueprint/05-page-type-ux-rules.md` for page type rules
- See `information-architecture/05-navigation-architecture.md` for navigation architecture
- See `product-architecture/16-navigation-principles.md` for navigation principles
- See `audits/frontend/02-design-system-and-tokens.md` for design tokens
- See `user-flow-architecture/01-flow-principles.md` for flow principles
