# Screen Specifications — Overview

> **Evidence basis:** `ux-blueprint/07-overview-ux-blueprint.md`, `user-flow-architecture/17-onboarding-flows.md` FL-OB-05, `product-architecture/05-primary-user-journey.md`, `information-architecture/06-page-catalog.md` P-OV-01
> **Purpose:** Screen spec for the Overview dashboard page

---

## SCR-OV-01: Overview

### Screen ID
SCR-OV-01

### Purpose
Workspace dashboard — at-a-glance status, quick actions, and onboarding guidance.

### Business Goal
Drive user to action; 5-minute KPI support; daily engagement.

### User Goal
Assess workspace status; take quick action; understand what needs attention.

### Primary Users
All roles (Owner, Editor, Viewer).

### Permissions
- All roles can view Overview
- Quick Actions: Owner/Editor see action buttons; Viewer sees read-only
- Onboarding state: All roles (but typically only Owner sees first-time)

### Entry Points
- Post-login redirect (primary entry)
- Sidebar "Overview" click
- Workspace switch (redirect to Overview)

### Exit Points
- Quick Action buttons → respective pages
- Widget clicks → detail pages
- Sidebar navigation → other pages

### Navigation
- Sidebar active: "Overview"
- No breadcrumbs (top-level page)

### Page Title
`Overview — Smart Screen`

### Page Description
Dashboard with screen health summary, quick actions, recent activity, and (for empty workspaces) onboarding guide.

### Primary CTA
Context-dependent:
- **Empty workspace:** "Add Your First Screen"
- **Has screens:** No single primary CTA (Quick Actions widget provides multiple)

### Secondary CTA
- "Create Playlist" (Quick Actions)
- "View Schedule" (Quick Actions)
- "Add Screen" (Quick Actions)

### Danger Actions
None.

---

## Layout

### Grid

**Normal state (has screens):**
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Overview" + workspace name             │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐  │
│ │ Screen Health│ │ Quick Actions│ │ Recent       │  │
│ │ Summary      │ │              │ │ Activity     │  │
│ │              │ │              │ │              │  │
│ └──────────────┘ └──────────────┘ └──────────────┘  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Active Content (currently playing on screens)    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Onboarding state (0 screens):**
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Welcome to Smart Screen"               │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Onboarding Card                                   │ │
│ │  3-step guide: Pair → Create → Publish           │ │
│ │  [Add Your First Screen] (primary CTA)           │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Content: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`

### Spacing
- Page header: `mb-6`
- Widget grid: `gap-6`
- Within widgets: `p-5`, `gap-4` between elements

### Visual Hierarchy
1. **Page header:** "Overview" + workspace name (h1)
2. **Widgets:** Equal weight in grid; Screen Health slightly larger (col-span-2 on large)
3. **Onboarding (if empty):** Full-width card, prominent CTA

### Page Sections

#### Section 1: Page Header
- **Purpose:** Page title and workspace context
- **Contents:** "Overview" heading + workspace name subtitle
- **Sticky:** No

#### Section 2: Screen Health Summary (Widget)
- **Purpose:** At-a-glance screen fleet status
- **Contents:** Online count (green), Offline count (red), Warning count (amber), Total count
- **Data:** `useApiScreens()` — all workspace screens
- **Click:** (Future) Click status count → navigate to `/screens?status=offline`

#### Section 3: Quick Actions (Widget)
- **Purpose:** One-click access to primary workflows
- **Contents:** "Add Screen", "Create Playlist", "View Schedule" buttons
- **Permissions:** Owner/Editor: all buttons; Viewer: hidden
- **Click:** Navigate to respective pages

#### Section 4: Recent Activity (Widget)
- **Purpose:** Recent events in workspace
- **Contents:** List of recent activities (screen paired, playlist published, schedule created, team invite)
- **Data:** `useApiActivity({ limit: 5 })` — recent workspace events
- **Click:** (Future) Click activity → navigate to related entity

#### Section 5: Active Content (Widget, full width)
- **Purpose:** Show what's currently playing on screens
- **Contents:** List of screens with their current playlist and status
- **Data:** `useApiScreens()` with current content

#### Section 6: Onboarding Card (empty workspace only)
- **Purpose:** Guide new user to first action
- **Contents:** 3-step guide (Pair → Create → Publish) + "Add Your First Screen" CTA
- **Visibility:** Only when `screens.length === 0`
- **Click:** CTA → `/screens/pair`

### Sticky Elements
None (page scrolls naturally).

### Scrollable Areas
Main content area (page-level scroll).

---

## Component Tree

```
<OverviewPage>
  <PageHeader>
    <Heading level={1}>Overview</Heading>
    <Text variant="muted">{workspace.name}</Text>
  </PageHeader>

  {screens.length === 0 ? (
    <OnboardingCard>
      <Heading level={3}>Welcome to Smart Screen!</Heading>
      <OnboardingSteps>
        <OnboardingStep number={1} icon="Monitor" title="Pair your screen" description="Connect a TV or display" />
        <OnboardingStep number={2} icon="Image" title="Create a playlist" description="Add media and design content" />
        <OnboardingStep number={3} icon="Send" title="Publish to your screen" description="See it live in seconds" />
      </OnboardingSteps>
      <Button variant="default" size="lg" onClick={() => router.push('/screens/pair')}>
        Add Your First Screen
      </Button>
    </OnboardingCard>
  ) : (
    <WidgetGrid>
      <ScreenHealthWidget screens={screens} />
      <QuickActionsWidget role={user.role} />
      <RecentActivityWidget activities={activities} />
      <ActiveContentWidget screens={screens} />
    </WidgetGrid>
  )}
</OverviewPage>
```

### Component Details

#### ScreenHealthWidget
- **Props:** `screens: Screen[]`
- **State:** Derived from props (no local state)
- **UI:** 4 stat cards (Online, Offline, Warning, Total) in 2x2 grid or row
- **Colors:** Green (#22c55e), Red (#ef4444), Amber (#f59e0b), Muted (total)
- **Click:** (Future) Filter screens by status

#### QuickActionsWidget
- **Props:** `role: UserRole`
- **UI:** 3 action buttons (vertical stack or grid)
- **Permissions:** Owner/Editor: all visible; Viewer: hidden entirely
- **Actions:** "Add Screen" → `/screens/pair`, "Create Playlist" → `/content`, "View Schedule" → `/scheduling`

#### RecentActivityWidget
- **Props:** `activities: Activity[]`
- **UI:** Vertical list of activity items (icon, message, timestamp)
- **Empty:** "No recent activity"
- **Timestamp:** Relative ("2m ago", "1h ago")

#### ActiveContentWidget
- **Props:** `screens: Screen[]`
- **UI:** Table or list of screens with current playlist name and status badge
- **Empty:** "No screens active"
- **Click:** Row → `/screens/{id}`

#### OnboardingCard
- **Props:** None
- **UI:** Full-width card with 3-step visual guide + CTA
- **Visibility:** Only when 0 screens
- **Styling:** `bg-card border border-border rounded-xl p-8 text-center`

---

## Responsive

### Desktop (≥ 1024px)
- Widget grid: 3 columns
- Active Content: full width (col-span-3)
- Onboarding: centered, max-width 600px

### Tablet (768px – 1023px)
- Widget grid: 2 columns
- Active Content: full width (col-span-2)

### Mobile (< 768px)
- Widget grid: 1 column (stacked)
- Onboarding: full width, steps stacked vertically
- Stat cards: 2x2 grid within widget

---

## States

### Loading
- **Initial load:** Skeleton widgets (gray card shapes with shimmer)
- **Each widget:** Independent skeleton (loads as data arrives)

### Empty — No Screens (Onboarding)
- Onboarding card replaces widget grid
- 3-step guide + "Add Your First Screen" CTA

### Empty — Has Screens, No Activity
- Recent Activity widget: "No recent activity"
- Other widgets show data normally

### Error
- **Screen fetch error:** Screen Health widget shows error + "Retry"
- **Activity fetch error:** Recent Activity widget shows error + "Retry"
- **Partial error:** Other widgets render normally (independent error handling)

### Offline
- Widgets show cached data (SWR)
- Small "Offline" indicator (amber dot) in page header

### Permission Denied
- Quick Actions: Hidden for Viewer (no error shown — just absent)
- Other widgets: Visible to all roles

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Add Your First Screen" | Navigate to `/screens/pair` |
| Click | Quick Action button | Navigate to respective page |
| Click | Screen row (Active Content) | Navigate to `/screens/{id}` |
| Click | (Future) Status count | Navigate to `/screens?status={status}` |
| Hover | Widget card | Subtle shadow elevation (`shadow-sm` → `shadow-md`) |
| Keyboard | Tab | Through page header → widget content |

---

## Accessibility

| Element | Rule |
|---------|------|
| Page | `<h1>` for "Overview" |
| Widgets | `role="region"` with `aria-label` per widget |
| Stat cards | `aria-label` with full text (e.g., "3 screens online") |
| Onboarding | `role="region"` `aria-label="Getting started"` |
| Steps | Ordered list `<ol>` with step numbers |
| CTA | `aria-label="Add your first screen"` |
| Focus | Tab order: header → widgets (top-to-bottom, left-to-right) |
| Contrast | All text and badges meet WCAG AA |

---

## Performance UX

| Concern | Strategy |
|---------|----------|
| Initial load | Parallel SWR fetches (screens, activity) |
| Skeleton | Per-widget skeleton (independent loading) |
| Cache | SWR cache with 30s revalidation focus |
| Realtime | Socket.IO for screen status changes → update Screen Health widget |
| Prefetch | Prefetch `/screens` and `/content` on Quick Action hover |

---

## API Requirements

| Endpoint | Method | Purpose | SWR Key |
|----------|--------|---------|---------|
| `/screens` | GET | All workspace screens | `useApiScreens` |
| `/activity?limit=5` | GET | Recent workspace activity | `useApiActivity` |
| `/workspaces/{id}` | GET | Workspace details (name) | `useApiWorkspace` |

### Realtime Events
| Event | Handler | UI Update |
|-------|---------|-----------|
| `screen:status` | Update screen in cache | Screen Health widget updates |
| `notification:new` | Bell badge update | No direct Overview change |

### Backend Limitations
- No dedicated "dashboard stats" endpoint (must fetch all screens and compute client-side)
- Activity endpoint may not exist (future — currently derived from notifications)

### Missing APIs
- `GET /workspaces/{id}/stats` — Aggregated stats (online/offline counts, content count) — would reduce payload
- `GET /workspaces/{id}/activity?limit=5` — Recent activity feed

---

## Acceptance Criteria

### Functional
- [ ] Shows onboarding card when 0 screens
- [ ] Shows widget grid when screens exist
- [ ] Screen Health displays correct online/offline/warning counts
- [ ] Quick Actions navigate to correct pages
- [ ] Active Content shows current playlist per screen
- [ ] Onboarding CTA navigates to pairing wizard

### UX
- [ ] Page loads with skeleton states (no blank screen)
- [ ] Widgets load independently (partial data shows while others load)
- [ ] Realtime screen status updates within 1s
- [ ] Onboarding card is visually prominent (single CTA)

### Accessibility
- [ ] `<h1>` for page title
- [ ] Widget regions have `aria-label`
- [ ] Stat cards have descriptive `aria-label`
- [ ] Keyboard navigable

### Performance
- [ ] First widget renders < 500ms
- [ ] All widgets render < 2s
- [ ] No layout shift during loading

### Responsive
- [ ] 3-column grid on desktop
- [ ] 2-column grid on tablet
- [ ] 1-column stack on mobile
- [ ] Onboarding card centered on desktop, full-width on mobile

---

## Current Problems
| ID | Problem | Impact |
|----|---------|--------|
| OP-01 | No dedicated stats endpoint | Must fetch all screens (N+1 risk for large fleets) |
| OP-02 | No activity feed | Recent Activity widget has no data source |
| OP-03 | No realtime screen status on Overview | User must refresh to see status changes |

## Technical Debt
| ID | Debt | Impact |
|----|------|--------|
| OTD-01 | Screen status computed client-side | Inefficient for 100+ screens |
| OTD-02 | No widget-level error boundaries | One widget error can crash page |

## UX Improvements
| ID | Improvement | Priority | Effort |
|----|------------|----------|--------|
| OUI-01 | Add realtime screen status to Overview | High | Medium |
| OUI-02 | Add clickable status counts (filter screens) | Medium | Low |
| OUI-03 | Add activity feed widget | Medium | Medium |
| OUI-04 | Add storage usage widget | Low | Low |
| OUI-05 | Add onboarding progress tracker (future) | Medium | Medium |

## Blocked By Backend
- Activity feed API (OP-02)
- Aggregated stats endpoint (OP-01)

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `04-screens-specs.md` for Screens page specs
- See `ux-blueprint/07-overview-ux-blueprint.md` for Overview UX blueprint
- See `user-flow-architecture/17-onboarding-flows.md` FL-OB-05 for onboarding flow
- See `product-architecture/05-primary-user-journey.md` for primary journey
- See `information-architecture/06-page-catalog.md` P-OV-01 for page catalog
