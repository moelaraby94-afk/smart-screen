# 25 — Navigation Components

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/01-global-layout-spec.md`, `screen-specifications/04-screens-specs.md` (Pairing Wizard step indicator)

---

## Component: Sidebar

### Purpose
Primary navigation for the application.

### Usage
Persistent left navigation on desktop; drawer on mobile/tablet.

### Variants
| Variant | Width | Usage |
|---------|-------|-------|
| `full` | 240px | Desktop (≥ 1024px) |
| `collapsed` | 64px | Tablet (768px–1023px) |
| `drawer` | 280px (mobile drawer) | Mobile (< 768px) |

### Structure
```
<Sidebar>
  <SidebarHeader>
    <Logo />
    <WorkspaceSwitcher />
  </SidebarHeader>
  <SidebarNav>
    <SidebarSection label="Workspace">
      <SidebarItem icon={LayoutDashboard} label="Overview" href="/overview" />
      <SidebarItem icon={Monitor} label="Screens" href="/screens" />
      <SidebarItem icon={Image} label="Content" href="/content" />
      <SidebarItem icon={CalendarClock} label="Scheduling" href="/scheduling" />
      <SidebarItem icon={BarChart3} label="Analytics" href="/analytics" />
      <SidebarItem icon={Users} label="Team" href="/team" />
    </SidebarSection>
    <SidebarSection label="Settings">
      <SidebarItem icon={Settings} label="Settings" href="/settings" />
    </SidebarSection>
    {isAdmin && <SidebarSection label="Admin">
      <SidebarItem icon={Building2} label="Customers" href="/admin/customers" />
      ...
    </SidebarSection>}
  </SidebarNav>
</Sidebar>
```

### SidebarItem States
| State | Visual |
|-------|--------|
| Default | transparent bg, `--muted-foreground` text |
| Hover | `--muted` bg, `--foreground` text (MI-14, 150ms) |
| Active | `--primary/10` bg, `--primary` text, 2px left `--primary` border |
| Focus | `ring-2 ring-ring ring-offset-2` |
| Disabled | `opacity-50`, `cursor-not-allowed` |

### Props (SidebarItem)
| Prop | Type | Description |
|------|------|-------------|
| `icon` | `LucideIcon` | Item icon (18px) |
| `label` | `string` | Item label |
| `href` | `string` | Navigation URL |
| `active` | `boolean` | Current page |
| `badge` | `number` | Notification count badge |
| `disabled` | `boolean` | Disabled state |

### Collapsed Mode
- Show icon only (no label)
- Tooltip on hover with label text (MI-17, 500ms delay)
- Width: 64px
- Active indicator: `--primary` bg on icon (instead of left border)

### Accessibility
- Sidebar: `role="navigation"`, `aria-label="Main navigation"`
- SidebarItem: `role="link"`, `aria-current="page"` when active
- Collapsed: Tooltip provides label

---

## Component: Header

### Purpose
Top bar with workspace context, search, notifications, and user menu.

### Structure
```
<Header>
  <HeaderLeft>
    <SidebarToggle /> {/* mobile only */}
    <PageTitle /> {/* optional */}
  </HeaderLeft>
  <HeaderRight>
    <SearchButton /> {/* future, desktop only */}
    <NotificationBell />
    <UserMenu />
  </HeaderRight>
</Header>
```

### Visual
- Height: 56px
- Background: `--card`
- Border: `--border` (bottom, 1px)
- Sticky: `position: sticky; top: 0; z-index: 20`
- Padding: `--space-2 --space-4`

---

## Component: NotificationBell

### Purpose
Bell icon with unread badge count; dropdown shows recent notifications.

### States
| State | Visual |
|-------|--------|
| No unread | Bell icon (18px, `--muted-foreground`) |
| Has unread | Bell icon + red badge with count |
| Dropdown open | Dropdown panel with notification list |

### Dropdown
- Width: 360px (desktop), `calc(100vw - 32px)` (mobile)
- Max height: 400px (scrollable)
- Background: `--popover`
- Shadow: `--shadow-md`
- Animation: MI-05 (200ms, fade + slide down)

### Badge
- Position: Top-right of bell icon
- Size: 16px (min), expands for 2+ digits
- Background: `--destructive`
- Text: `--destructive-foreground`, `--text-xs --font-medium`
- Radius: `--radius-full`

### Accessibility
- `aria-label="Notifications"` (with count if unread)
- `aria-expanded` when dropdown open
- Badge: `aria-label="[N] unread notifications"`

---

## Component: UserMenu

### Purpose
User avatar dropdown with profile, settings, and logout.

### Structure
```
<UserMenu>
  <UserMenuTrigger>
    <Avatar size="sm" />
  </UserMenuTrigger>
  <UserMenuContent>
    <UserInfo name={user.name} email={user.email} />
    <UserMenuItem icon={User} label="Profile" href="/settings" />
    <UserMenuItem icon={Settings} label="Settings" href="/settings" />
    <UserMenuSeparator />
    <UserMenuItem icon={LogOut} label="Logout" onClick={handleLogout} />
  </UserMenuContent>
</UserMenu>
```

### Dropdown
- Width: 240px
- Background: `--popover`
- Shadow: `--shadow-md`
- Animation: MI-05 (200ms)

---

## Component: Tabs

### Purpose
Switch between related views within the same page.

### Structure
```
<Tabs value={tab} onValueChange={setTab}>
  <TabsList>
    <TabsTrigger value="playlists">Playlists</TabsTrigger>
    <TabsTrigger value="media">Media</TabsTrigger>
  </TabsList>
</Tabs>
```

### Visual
- TabsList: `flex`, `border-b --border`
- TabsTrigger: `--space-2 --space-3`, `--text-sm --font-medium`
- Active: `--foreground` text, 2px bottom `--primary` border
- Inactive: `--muted-foreground` text, no border
- Hover (inactive): `--muted/50` bg (MI-01, 150ms)
- Active indicator animation: MI-13 (200ms, underline slides)

### Accessibility
- `role="tablist"`, `role="tab"`, `aria-selected`
- Keyboard: Arrow Left/Right to navigate tabs

---

## Component: Breadcrumbs

### Purpose
Show navigation path to current page.

### Structure
```
<Breadcrumbs>
  <BreadcrumbItem href="/content">Content</BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem current>My Playlist</BreadcrumbItem>
</Breadcrumbs>
```

### Visual
- Font: `--text-sm --muted-foreground`
- Separator: `ChevronRight` (14px, `--muted-foreground`)
- Current item: `--foreground` (not clickable)
- Gap: `--space-1` between items

### Accessibility
- `role="navigation"`, `aria-label="Breadcrumb"`
- Items: `aria-current="page"` for current

---

## Component: Pagination

### Purpose
Navigate between pages of paginated data.

### Structure
```
<Pagination page={1} total={10} onChange={setPage} />
```

### Visual
- Layout: `flex items-center justify-between`
- Left: "Showing [N]–[M] of [Total]" (`--text-sm --muted-foreground`)
- Right: Prev button + page numbers + Next button
- Current page: `--primary` bg, `--primary-foreground` text
- Other pages: `--card` bg, `--foreground` text
- Buttons: 36px × 36px

### Accessibility
- `nav` with `aria-label="Pagination"`
- Current page: `aria-current="page"`
- Prev/Next: `aria-label="Previous page"` / `aria-label="Next page"`

---

## Component: StepIndicator

### Purpose
Show progress through a multi-step wizard.

### Structure
```
<StepIndicator steps={3} current={2} />
```

### Visual
- Layout: `flex items-center gap-2`
- Completed step: `--primary` bg circle with Check icon
- Current step: `--primary` bg circle with step number
- Upcoming step: `--muted` bg circle with step number
- Connector line: `--border` (between steps), `--primary` (completed)
- Circle size: 28px
- Font: `--text-sm --font-medium`

### Accessibility
- `role="progressbar"`, `aria-valuenow={current}`, `aria-valuemax={steps}`

---

## Cross-References

- See `01-foundations.md` for all tokens
- See `07-motion-system.md` for MI-05, MI-13, MI-14, MI-17
- See `10-accessibility-rules.md` for navigation accessibility
- See `screen-specifications/01-global-layout-spec.md` for full shell spec
- See `ux-blueprint/03-component-ux-standards.md` for component standards
