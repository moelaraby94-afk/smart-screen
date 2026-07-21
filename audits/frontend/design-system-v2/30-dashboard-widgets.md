# 30 — Dashboard Widgets

> **Evidence basis:** `15-cards.md`, `28-data-visualization-components.md`, `29-charts.md`, `screen-specifications/03-overview-spec.md`, `ux-blueprint/05-page-type-ux-rules.md`

---

## 1. Widget Philosophy

Dashboard widgets are self-contained cards that display a specific piece of information or set of actions. Each widget is independent, can be loaded independently, and handles its own loading/error/empty states.

---

## 2. Widget Components

### Component: ScreenHealthWidget

#### Purpose
Show fleet health summary (online/offline/warning counts).

#### Usage
Overview page.

#### Structure
```
<ScreenHealthWidget screens={screens} loading={isLoading} />
```

#### Contents
- Title: "Screen Health"
- Status counts: Online (green), Offline (red), Warning (amber), Total
- Each count: Clickable (filters Screens list — future)
- (Future) Mini donut chart

#### States
| State | Visual |
|-------|--------|
| Loading | Skeleton counts |
| Empty (no screens) | "No screens yet" + "Add Screen" CTA |
| All online | Green check icon + "All screens online" |
| Some offline | Red count highlighted |

#### Evidence
`screen-specifications/03-overview-spec.md` — Screen Health widget

---

### Component: QuickActionsWidget

#### Purpose
Provide shortcut buttons for common actions.

#### Usage
Overview page.

#### Contents
- Title: "Quick Actions"
- Buttons: "Add Screen", "Upload Media", "Create Playlist", "View Schedule"
- Layout: Grid (2×2 on desktop, 1 column on mobile)
- Each button: Icon + label, `variant="outline"`, `fullWidth`

#### Evidence
`screen-specifications/03-overview-spec.md` — Quick Actions widget

---

### Component: RecentActivityWidget

#### Purpose
Show recent workspace activity (events, changes).

#### Usage
Overview page.

#### Contents
- Title: "Recent Activity"
- List of recent events (icon, message, timestamp)
- Max 5 items
- "View All" link → Notifications page

#### States
| State | Visual |
|-------|--------|
| Loading | Skeleton list rows |
| Empty | "No recent activity" |
| Error | ErrorState + "Retry" |

#### Backend Dependency
Requires activity feed API (currently missing — see backend blockers).

#### Evidence
`screen-specifications/03-overview-spec.md` — Recent Activity widget

---

### Component: ActiveContentWidget

#### Purpose
Show currently published playlists and their screen count.

#### Usage
Overview page.

#### Contents
- Title: "Active Content"
- List of published playlists (name, screen count, status badge)
- Max 5 items
- "View All" link → Content page

#### States
| State | Visual |
|-------|--------|
| Loading | Skeleton list rows |
| Empty | "No published content" + "Create Playlist" CTA |

#### Evidence
`screen-specifications/03-overview-spec.md` — Active Content widget

---

### Component: OnboardingCard

#### Purpose
Guide new users through the 5-minute KPI setup (pair screen, upload, create playlist, publish).

#### Usage
Overview page (empty workspace state).

#### Contents
- Title: "Welcome to Smart Screen"
- 3-step guide with icons:
  1. Pair your first screen (Monitor icon)
  2. Upload media (Upload icon)
  3. Create and publish a playlist (Send icon)
- Each step: Clickable → navigates to relevant page
- Progress: Completed steps show check icon
- Dismiss: "X" button (future — dismiss after completion)

#### States
| State | Visual |
|-------|--------|
| All steps incomplete | All 3 steps show number circles |
| Some steps complete | Completed steps show check icon, `--success` |
| All steps complete | Card hidden (or "You're all set!" celebration — future) |

#### Evidence
`screen-specifications/03-overview-spec.md` — Onboarding state

---

### Component: OnboardingStep

#### Purpose
Individual step within OnboardingCard.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `step` | `number` | Step number (1, 2, 3) |
| `icon` | `LucideIcon` | Step icon |
| `title` | `string` | Step title |
| `description` | `string` | Step description |
| `completed` | `boolean` | Step completion status |
| `onClick` | `() => void` | Navigate to step |

#### Visual
| Element | Style |
|---------|-------|
| Step circle | 32px, `--primary` bg (incomplete) or `--success` bg (complete) |
| Step number | `--text-sm --font-medium --primary-foreground` |
| Check icon | 16px, `--success-foreground` (replaces number when complete) |
| Title | `--text-sm --font-medium --foreground` |
| Description | `--text-xs --muted-foreground` |
| Layout | `flex items-center gap-3` |
| Click | `cursor-pointer`, hover `--muted/50` bg |

---

## 3. Widget Standards

- **Independent loading:** Each widget loads its own data; no shared loading state
- **Independent error:** Widget error doesn't affect other widgets
- **Independent empty:** Widget empty state is self-contained
- **No widget dependencies:** Widgets don't depend on each other's data
- **Consistent card styling:** All widgets use `Card` component (`variant="default"`, `size="default"`)
- **Widget header:** Title (`--text-lg --font-semibold`) + optional action (top-right)
- **Widget body:** Content area, scrollable if needed
- **Widget gap:** `--space-6` (24px) between widgets in grid

---

## Cross-References

- See `15-cards.md` for Card component
- See `28-data-visualization-components.md` for MetricCard
- See `29-charts.md` for chart components
- See `screen-specifications/03-overview-spec.md` for Overview page spec
- See `ux-blueprint/05-page-type-ux-rules.md` for page type rules
