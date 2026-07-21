# Feature UX Standards

> **Evidence basis:** `01-ux-principles.md`, `02-state-guidelines.md`, `03-component-ux-standards.md`, `product-architecture/17-product-rules.md`, `transformation/25-design-constraints.md`
> **Purpose:** Define UX standards for notifications, bulk actions, responsive design, accessibility, and progressive disclosure

---

## 1. Notification UX

### 1.1 Notification Bell

| Element | Rule | Evidence |
|---------|------|----------|
| Position | Header, end group | `05-navigation-architecture.md` §2.1 |
| Icon | Bell (Lucide) | — |
| Badge | Red circle with unread count, max display "99+" | `17-notifications.md` §17.7 |
| Badge animation | Scale in when count increases | MI-13 |
| Click | Opens dropdown with recent 5-10 notifications | — |
| Empty | Bell icon without badge | — |

### 1.2 Notification Dropdown

```
┌──────────────────────────────────┐
│ NOTIFICATIONS                     │
│                                   │
│ ● Screen A went offline    2m ago │
│ ● Schedule "Lunch" started 5m ago │
│   Team member invited      1h ago │
│   Screen B came online     2h ago │
│   Playlist "Promo" updated 3h ago │
│                                   │
│         [View All]                │
└──────────────────────────────────┘
```

| Rule | Description | Evidence |
|------|-------------|----------|
| Max 10 items in dropdown | Beyond 10, go to full page | `17-notifications.md` §17.7 |
| Unread items have dot | Blue dot on start side | — |
| Timestamp is relative | "2m ago", "1h ago", "3d ago" | — |
| Click item | Navigates to related page (screen detail, etc.) | — |
| "View All" link | Navigates to `/notifications` full page | — |
| Auto-mark as read | When dropdown is opened, items are marked read | — |
| Close on Escape | Keyboard accessible | ACC-02 |
| Close on outside click | Standard dropdown behavior | — |

### 1.3 Notification Types

| Type | Icon | Color | Toast? | Bell? | Evidence |
|------|------|-------|--------|-------|----------|
| Screen offline | MonitorOff | Red | Yes (toast) | Yes | `07-workspace-management.md` |
| Screen online | Monitor | Green | No | Yes | — |
| Schedule started | CalendarClock | Blue | No | Yes | `12-schedules-feature.md` |
| Schedule ended | CalendarCheck | Muted | No | Yes | — |
| Team invite accepted | UserCheck | Green | Yes (toast) | Yes | `16-team-feature.md` |
| Team invite declined | UserX | Amber | Yes (toast) | Yes | — |
| Content published | Upload | Green | Yes (toast) | Yes | — |
| Storage limit warning | HardDrive | Amber | No | Yes | `11-media-library.md` |
| System maintenance | Wrench | Blue | No | Yes | — |

### 1.4 Toast UX

| Rule | Description | Evidence |
|------|-------------|----------|
| Position | Bottom-center (mobile), bottom-end (desktop) | — |
| Duration | 5s (success), persistent (error) | MI-05 |
| Animation | Slide in from bottom | MI-05 |
| Close button | "×" icon, always visible | — |
| Action button | Optional (e.g., "Retry" for errors) | — |
| Max visible | 3 toasts at a time | — |
| Stack | New toasts appear above old ones | — |
| Color | Green (success), Red (error), Amber (warning), Blue (info) | VH-04 |

---

## 2. Bulk Actions UX

### 2.1 Bulk Selection Flow

```
1. User clicks checkbox on row/card → item selected
2. Bulk action bar appears (replaces toolbar or slides in)
3. User selects more items (checkbox or shift+click)
4. User clicks bulk action (Assign, Delete, etc.)
5. Confirmation if destructive
6. Action executes with progress indicator
7. Toast: "[N] items [actioned]"
8. Selection cleared, bulk action bar dismissed
```

### 2.2 Bulk Action Bar

```
┌──────────────────────────────────────────────────────┐
│ ✓ 3 selected    [Assign Content] [Delete]  [Clear]    │
└──────────────────────────────────────────────────────┘
```

| Element | Rule | Evidence |
|---------|------|----------|
| Position | Replaces filter/search bar or appears above content | — |
| Background | `bg-primary/10` to distinguish from normal toolbar | — |
| Selection count | "3 selected" with checkmark icon | — |
| Actions | Context-dependent (Assign for screens, Delete for all) | — |
| Clear | "Clear" link/button deselects all | IN-07 |
| Select all | Checkbox in bar selects all matching items (not just visible) | — |

### 2.3 Per-Section Bulk Actions

| Section | Bulk Actions | Evidence |
|---------|-------------|----------|
| Screens | Assign Content, Override, Reboot (future), Delete | M-02 |
| Content (Playlists) | Publish, Delete, Duplicate | M-03 |
| Content (Media) | Delete, Move to playlist (future) | M-03 |
| Scheduling | Activate, Deactivate, Delete | M-04 |
| Team | Change Role, Remove | M-06 |
| Admin customers | Suspend, Activate, Delete | M-08 |

### 2.4 Bulk Action Progress

| Rule | Description | Evidence |
|------|-------------|----------|
| Progress bar | Shows "Processing 3/10..." | — |
| Per-item result | Green check (success) or red X (failure) per item | — |
| Summary toast | "8 succeeded, 2 failed" | — |
| Partial failure | Toast: "2 items failed: [names]" with "Retry failed" button | — |

---

## 3. Responsive UX Strategy

### 3.1 Breakpoint Rules

| Breakpoint | Width | Layout | Evidence |
|-----------|-------|--------|----------|
| Mobile | < 768px | Single column, drawer, stacked | `04-layout-and-shell.md` |
| Tablet | 768-1024px | Sidebar visible, condensed | — |
| Desktop | > 1024px | Full sidebar, multi-column | — |

### 3.2 Responsive Behavior Matrix

| Element | Mobile | Tablet | Desktop | Evidence |
|---------|--------|--------|---------|----------|
| Sidebar | Drawer (hidden) | Visible (condensed) | Visible (full) | NP-05 |
| Workspace switcher | In drawer top | In header | In header | NP-05 |
| Search | "More" menu | Header icon | Header icon + Ctrl+K | `05-navigation-architecture.md` |
| Card grid | 1 column | 2 columns | 3-4 columns | — |
| Tables | Card list (stacked rows) | Table (scroll) | Table (full) | — |
| Forms | Full width, stacked | Full width | Max 600px centered | — |
| Dialogs | Full screen | Centered, 80% | Centered, 50% | — |
| Bulk actions | Same bar | Same bar | Same bar | — |
| Studio | Not supported (desktop only) | Not supported | Full editor | `20-future-extensibility.md` §4 |
| Calendar | Day view only | Week view | Month/Week/Day | — |
| Analytics | Stacked charts | 2-column charts | 3-column charts | — |

### 3.3 Mobile-Specific UX

| Rule | Description | Evidence |
|------|-------------|----------|
| Touch targets ≥ 44px | All interactive elements | PR-45, MSC-02 |
| No hover actions | Everything is tap | IN-04 |
| Drawer for navigation | Slide-out from start edge | NP-05 |
| Full-screen dialogs | On mobile, dialogs are full-screen | — |
| Bottom-safe-area padding | iOS notch / Android nav bar | — |
| Pull-to-refresh | On list pages (future) | — |
| No horizontal scroll | Content fits viewport | — |

---

## 4. Accessibility UX Strategy

### 4.1 Keyboard Navigation

| Rule | Description | Evidence |
|------|-------------|----------|
| Tab order follows visual order | Left-to-right (LTR), right-to-left (RTL) | ACC-02, PR-44 |
| Focus is visible | `focus-visible:ring-2 ring-primary/30` | NP-09 |
| Enter activates buttons and links | Standard behavior | IN-03 |
| Escape closes dialogs, drawers, dropdowns | Standard behavior | IN-03 |
| Arrow keys navigate tabs, lists, menus | Radix UI handles | ACC-02 |
| Ctrl+K opens command palette | Global shortcut | `05-navigation-architecture.md` |
| "/" focuses search (future) | Quick search access | — |
| No keyboard traps | Focus can leave any component | ACC-02 |

### 4.2 Screen Reader

| Rule | Description | Evidence |
|------|-------------|----------|
| Semantic HTML | `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>` | ACC-03 |
| ARIA labels on icon-only buttons | `aria-label="Add Screen"` | ACC-03 |
| ARIA roles on custom components | Radix UI provides | TC-05 |
| Live regions for dynamic content | Toasts, notifications, status changes | ACC-03 |
| Alt text on images | Descriptive alt for media thumbnails | ACC-03 |
| Form labels associated | `<label htmlFor="...">` | ACC-03 |
| Page title in `<title>` | Route-specific, localized | NP-02 |

### 4.3 Contrast and Color

| Rule | Standard | Evidence |
|------|----------|----------|
| Normal text contrast | ≥ 4.5:1 | ACC-01, A-004 |
| Large text contrast (≥ 18px) | ≥ 3.0:1 | ACC-01 |
| Interactive element contrast | ≥ 3.0:1 | ACC-01 |
| Focus indicator contrast | ≥ 3.0:1 against background | ACC-02 |
| Don't rely on color alone | Status has icon + text + color | VH-04, ACC-03 |

### 4.4 Reduced Motion

| Rule | Description | Evidence |
|------|-------------|----------|
| `prefers-reduced-motion: reduce` | Disables scale, slide, rotation | MI-15 |
| Only opacity transitions allowed | Max 200ms | MI-15 |
| No parallax | Disabled | — |
| No auto-playing video | Disabled (except playlist preview, which is user-initiated) | — |

---

## 5. Progressive Disclosure Rules

### 5.1 Progressive Disclosure Levels

| Level | What | How | Evidence |
|-------|------|-----|----------|
| Level 1: Visible | Essential information and primary action | Always visible on page | UP-03 |
| Level 2: On-Demand | Secondary information and actions | Tabs, "Show more", expandable sections | UP-03 |
| Level 3: Triggered | Tertiary actions and details | Dropdowns, dialogs, popovers | UP-03 |
| Level 4: Contextual | Help, tooltips, advanced settings | Tooltips, "Advanced" sections, help icons | UP-03 |

### 5.2 Progressive Disclosure by Page Type

| Page Type | Level 1 | Level 2 | Level 3 | Level 4 |
|-----------|---------|---------|---------|---------|
| Dashboard | Key metrics, quick actions | Recent activity, trends | Filter, period selector | Widget settings (future) |
| List | Search, primary action, items | Filters, bulk actions | Row actions menu, sort | Column toggle (future) |
| Detail | Title, status, primary action | Content sections, metadata | Edit, delete, override | Advanced settings, logs |
| Form | Required fields, submit | Optional fields (collapsed) | Advanced options | Help text, tooltips |
| Calendar | Calendar grid, create action | Filters, view switch | Schedule details (click) | Recurrence rules, time slots |
| Settings | Tab labels, current values | Save button, form fields | Danger zone (delete) | API docs, advanced config |

### 5.3 Progressive Disclosure Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Never hide the primary action | Primary action is always Level 1 | UP-02 |
| Never hide required fields | Required fields are always Level 1 | UP-03 |
| Collapsed sections show summary | "3 advanced options" or field count | UP-06 |
| Expanded state persists within session | Don't re-collapse on navigation | — |
| "Advanced" label for Level 4 | Clear label for advanced options | — |
| No more than 1 collapsed section per form | Prevents hunting for fields | — |

---

## 6. Dashboard UX Rules

### 6.1 Dashboard Principles

| Rule | Description | Evidence |
|------|-------------|----------|
| Dashboard = Overview, not Analytics | Status at a glance, not data analysis | Locked product decision, PR-09 |
| Maximum 5 widgets | Beyond 5, cognitive overload | — |
| Widgets are self-contained | Each widget has its own data, loading, error state | — |
| Widgets are reorderable (future) | User can prioritize widgets | Future enhancement |
| No full-page charts | Charts are widget-sized, not full-page | — |

### 6.2 Widget Anatomy

| Element | Rule | Evidence |
|---------|------|----------|
| Title | Widget name, top-start | — |
| Value/Content | Primary data, center | — |
| Status indicator | Color-coded (green/amber/red) | VH-04 |
| Loading | Skeleton matching widget shape | DD-06 |
| Error | Inline error with retry | `02-state-guidelines.md` |
| Empty | Mini empty state with CTA | `02-state-guidelines.md` |
| Link | "View details" or "See all" link to full page | IP-07 |

---

## 7. Overview UX Rules

### 7.1 Overview Widget Priority

| Priority | Widget | Data | Evidence |
|----------|--------|------|----------|
| 1 | Screen Health | Online/offline/warning counts | M-01, PR-09 |
| 2 | Quick Actions | Add Screen, Create Playlist, View Schedule | M-01, 5-min KPI |
| 3 | Recent Activity | Last 5-10 events (screen status, schedule, team) | M-01 |
| 4 | Upcoming Schedules | Next 3-5 scheduled items | M-01 |
| 5 | Storage Usage (future) | Used vs. limit | `11-media-library.md` |

### 7.2 Overview Layout

```
┌──────────────────────────────────────────────────┐
│ OVERVIEW                                          │
├─────────────────────┬────────────────────────────┤
│ Screen Health        │ Quick Actions               │
│ ● 12 Online          │ [+ Add Screen]              │
│ ● 2 Warning          │ [+ Create Playlist]         │
│ ● 1 Offline          │ [📅 View Schedule]          │
│ [View Details]       │                             │
├─────────────────────┼────────────────────────────┤
│ Recent Activity      │ Upcoming Schedules          │
│ Screen A offline 2m  │ Lunch Promo in 30m          │
│ Schedule started 5m  │ Dinner Menu at 6:00 PM      │
│ Team invite 1h       │ Weekend Sale on Friday      │
│ Screen B online 2h   │ [View All Schedules]        │
└─────────────────────┴────────────────────────────┘
```

### 7.3 Overview First-Time User

```
┌──────────────────────────────────────────────────┐
│ Welcome to Smart Screen!                          │
│                                                   │
│ Let's get your first screen connected.            │
│ It takes less than 5 minutes.                     │
│                                                   │
│           [📺 Add Your First Screen]              │
│                                                   │
│  Step 1: Pair a screen                            │
│  Step 2: Create content                           │
│  Step 3: Publish to your screen                   │
└──────────────────────────────────────────────────┘
```

---

## Cross-References

- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` for component UX
- See `05-page-type-ux-rules.md` for page type rules
- See `product-architecture/17-product-rules.md` for product rules
- See `transformation/25-design-constraints.md` for accessibility constraints
- See `information-architecture/05-navigation-architecture.md` for navigation
