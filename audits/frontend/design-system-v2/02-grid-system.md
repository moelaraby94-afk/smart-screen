# 02 — Grid System

> **Evidence basis:** `01-foundations.md`, `screen-specifications/01-global-layout-spec.md`, `screen-specifications/03-overview-spec.md` through `12-admin-specs-part2.md`, `ux-blueprint/05-page-type-ux-rules.md`, `information-architecture/07-layout-principles.md`

---

## 1. Grid Philosophy

The Smart Screen grid system provides consistent horizontal alignment across all pages. It uses a **12-column grid** on desktop, simplifying to fewer columns on smaller breakpoints. The grid is **fluid** (percentage-based) with a **max-width container** to prevent excessive line lengths on large displays.

---

## 2. Container System

### 2.1 Container Widths

| Token | Max Width | Usage |
|-------|-----------|-------|
| `--container-sm` | `640px` | Auth pages, narrow forms |
| `--container-md` | `768px` | Settings forms, team page |
| `--container-lg` | `1024px` | Screen detail, playlist detail |
| `--container-xl` | `1200px` | Analytics, admin tables |
| `--container-2xl` | `1400px` | Screens list, content grid, scheduling |
| `--container-full` | `100%` | Studio (full viewport), full-width sections |

### 2.2 Container Usage per Page Type

| Page Type | Container | Evidence |
|-----------|-----------|----------|
| Auth pages (Login, Register, Forgot) | `--container-sm` (centered card) | `02-auth-error-specs.md` |
| Overview | `--container-2xl` | `03-overview-spec.md` |
| Screens List | `--container-2xl` | `04-screens-specs.md` |
| Screen Detail | `--container-lg` | `04-screens-specs.md` |
| Pairing Wizard | `--container-sm` (centered card) | `04-screens-specs.md` |
| Content (Playlists, Media) | `--container-2xl` | `05-content-specs.md` |
| Playlist Detail | `--container-lg` | `05-content-specs.md` |
| Studio | `--container-full` (full viewport) | `06-studio-spec.md` |
| Scheduling | `--container-2xl` | `07-scheduling-analytics-specs.md` |
| Analytics | `--container-2xl` | `07-scheduling-analytics-specs.md` |
| Team | `--container-md` | `08-team-spec.md` |
| Settings (all tabs) | `--container-md` to `--container-lg` | `09-settings-specs-part1.md`, `10-settings-specs-part2.md` |
| Notifications | `--container-md` | `11-notifications-admin-specs-part1.md` |
| Admin (all pages) | `--container-xl` to `--container-2xl` | `11-notifications-admin-specs-part1.md`, `12-admin-specs-part2.md` |

### 2.3 Container Padding

| Breakpoint | Padding |
|------------|---------|
| Desktop (≥ 1024px) | `--space-6` (24px) |
| Tablet (768px – 1023px) | `--space-4` (16px) |
| Mobile (< 768px) | `--space-3` (12px) |

---

## 3. Column Grid

### 3.1 Desktop Grid (≥ 1024px)

- **Columns:** 12
- **Gutter:** `--space-4` (16px) between columns
- **Margin:** Container padding (see above)

### 3.2 Tablet Grid (768px – 1023px)

- **Columns:** 8
- **Gutter:** `--space-3` (12px)

### 3.3 Mobile Grid (< 768px)

- **Columns:** 4
- **Gutter:** `--space-2` (8px)

---

## 4. Grid Patterns

### 4.1 Card Grid (Screens, Playlists, Media)

| Breakpoint | Columns | Gap | Evidence |
|------------|---------|-----|----------|
| Desktop (≥ 1280px) | 4 | `--space-4` | Screens, Playlists |
| Desktop (1024px – 1279px) | 3 | `--space-4` | Screens, Playlists |
| Tablet (≥ 768px) | 2 | `--space-3` | Screens, Playlists |
| Mobile (< 768px) | 1 | `--space-3` | Screens, Playlists |

### 4.2 Media Grid (denser)

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Desktop (≥ 1280px) | 6 | `--space-3` |
| Desktop (1024px – 1279px) | 4 | `--space-3` |
| Tablet (≥ 768px) | 3 | `--space-3` |
| Mobile (< 768px) | 2 | `--space-2` |

### 4.3 Widget Grid (Overview, Analytics)

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Desktop (≥ 1024px) | 3 | `--space-6` |
| Tablet (768px – 1023px) | 2 | `--space-4` |
| Mobile (< 768px) | 1 | `--space-4` |

### 4.4 Two-Column Detail (Screen Detail, Playlist Detail)

| Breakpoint | Layout | Gap |
|------------|--------|-----|
| Desktop (≥ 1024px) | 2 columns (1fr 1fr) | `--space-6` |
| Tablet/Mobile | 1 column (stacked) | `--space-4` |

### 4.5 Plan Cards Grid (Billing)

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Desktop (≥ 768px) | 3 | `--space-4` |
| Mobile (< 768px) | 1 | `--space-4` |

### 4.6 Metric Cards Grid (Analytics, Overview, Fleet)

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Desktop (≥ 1024px) | 4 | `--space-4` |
| Tablet (768px – 1023px) | 2 | `--space-4` |
| Mobile (< 768px) | 2 | `--space-3` |

---

## 5. Grid Rules

- **Always** use the grid for horizontal alignment — never use arbitrary widths
- **Card grids** use `grid` with `grid-cols-{n}` and `gap-{token}`
- **Detail pages** use CSS Grid `grid-cols-1 lg:grid-cols-2` for two-column layouts
- **Full-width sections** within a grid page use `col-span-full` (or `full-width` class)
- **Studio** is exempt from the grid system — it uses a fixed 3-panel layout (280px + flex + 300px)
- **Auth pages** are exempt from the grid — they use centered card layout
- **Admin tables** use full container width with horizontal scroll on mobile

---

## 6. Grid Utilities

| Utility | Value | Usage |
|---------|-------|-------|
| `grid-cols-1` | 1 column | Mobile, stacked layouts |
| `grid-cols-2` | 2 columns | Tablet, two-column detail |
| `grid-cols-3` | 3 columns | Desktop widgets, plan cards |
| `grid-cols-4` | 4 columns | Desktop card grids, metric cards |
| `grid-cols-6` | 6 columns | Desktop media grid |
| `grid-cols-12` | 12 columns | Complex layouts (future) |
| `col-span-full` | All columns | Full-width section within grid |
| `col-span-2` | 2 columns | Wide widget (e.g., Active Content) |

---

## Cross-References

- See `01-foundations.md` for spacing tokens used in grid gutters
- See `03-layout-system.md` for layout patterns built on this grid
- See `04-breakpoints.md` for breakpoint definitions
- See `38-responsive-rules.md` for responsive behavior rules
- See `screen-specifications/01-global-layout-spec.md` for app shell layout
- See `ux-blueprint/05-page-type-ux-rules.md` for page type rules
- See `information-architecture/07-layout-principles.md` for layout principles
