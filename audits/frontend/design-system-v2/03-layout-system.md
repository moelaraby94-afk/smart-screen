# 03 — Layout System

> **Evidence basis:** `01-foundations.md`, `02-grid-system.md`, `screen-specifications/01-global-layout-spec.md`, `screen-specifications/06-studio-spec.md`, `ux-blueprint/05-page-type-ux-rules.md`, `information-architecture/07-layout-principles.md`

---

## 1. Layout Philosophy

The Smart Screen layout system defines **page-level structural patterns** — how the sidebar, header, and content area combine, and how content is arranged within pages. Every page follows one of the defined layout patterns, ensuring structural consistency across the product.

---

## 2. App Shell Layout

### 2.1 Standard Authenticated Layout

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (240px) │           Header (56px)                │
│                 ├─────────────────────────────────────────┤
│                 │                                         │
│                 │           Main Content                  │
│                 │           (scrollable)                  │
│                 │                                         │
└─────────────────┴─────────────────────────────────────────┘
```

- **Sidebar:** Fixed 240px (desktop), 64px collapsed (tablet), drawer (mobile)
- **Header:** 56px height, sticky top, spans content area width
- **Main Content:** `flex-1`, `overflow-y-auto`, contains page content
- **Evidence:** `screen-specifications/01-global-layout-spec.md`

### 2.2 Studio Layout (Full-Screen)

```
┌─────────────────────────────────────────────────────────┐
│ Studio Toolbar (48px, full width)                        │
├──────────┬──────────────────────────┬───────────────────┤
│ Media    │       Canvas              │  Properties        │
│ Panel    │       (flex-1)            │  Panel             │
│ (280px)  │                           │  (300px)           │
│          │                           │                    │
├──────────┴──────────────────────────┴───────────────────┤
│ Timeline (60px, full width)                              │
└─────────────────────────────────────────────────────────┘
```

- **No sidebar, no header** — Studio is full-screen
- **3-panel layout:** Left (280px) + Center (flex-1) + Right (300px)
- **Bottom timeline:** 60px height
- **Evidence:** `screen-specifications/06-studio-spec.md`

### 2.3 Auth Layout (Centered)

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│              ┌───────────────────┐                       │
│              │   Brand Logo      │                       │
│              │   Auth Card       │                       │
│              │   (max-w-400px)   │                       │
│              └───────────────────┘                       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

- **No sidebar, no header** — standalone page
- **Centered card:** `max-w-[400px]`, centered horizontally and vertically
- **Background:** `bg-muted/20`
- **Evidence:** `screen-specifications/02-auth-error-specs.md`

---

## 3. Page Layout Patterns

### 3.1 List Page Pattern

Used by: Screens List, Content (Playlists/Media), Admin tables, Notifications, Team

```
┌─────────────────────────────────────────────────────┐
│ Page Header: [H1 Title] + [Primary CTA]              │
│ (optional tabs)                                       │
├─────────────────────────────────────────────────────┤
│ Toolbar: [Search] [Filters] [Sort]                    │
├─────────────────────────────────────────────────────┤
│ Content Grid / Table                                  │
│ (cards or rows)                                       │
├─────────────────────────────────────────────────────┤
│ Pagination                                            │
└─────────────────────────────────────────────────────┘
```

- **Page Header:** `flex items-center justify-between`, `mb-6`
- **Toolbar:** `flex items-center gap-3 flex-wrap`, `mb-4`
- **Content:** Grid or table, fills remaining space
- **Pagination:** `mt-6`, centered or right-aligned

### 3.2 Detail Page Pattern

Used by: Screen Detail, Playlist Detail

```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: [Parent] / [Current]                    │
│ Header: [H1 Name] + [Status Badge] + [CTA Buttons]   │
├─────────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐                    │
│ │ Primary Card  │ │ Info Card    │                    │
│ └──────────────┘ └──────────────┘                    │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Full-Width Section                                │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Danger Zone                                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Breadcrumbs:** `mb-4`, `text-sm`
- **Header:** `flex items-center gap-3`, `mb-6`
- **Two-column:** `grid grid-cols-1 lg:grid-cols-2 gap-6`
- **Full-width sections:** `mt-6`, full container width
- **Danger Zone:** `mt-6`, `border-destructive/20 bg-destructive/5 rounded-lg p-4`

### 3.3 Dashboard Page Pattern

Used by: Overview, Analytics, Admin Fleet, Admin Health

```
┌─────────────────────────────────────────────────────┐
│ Page Header: [H1 Title] + [Period Selector]          │
├─────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │Metric│ │Metric│ │Metric│ │Metric│                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Chart / Full-Width Widget                         │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ List / Performers                                 │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Metric cards:** `grid grid-cols-2 lg:grid-cols-4 gap-4`
- **Chart:** Full width, `h-[300px]`
- **List:** Full width, `mt-6`

### 3.4 Settings Page Pattern

Used by: Settings (all tabs), Admin Feature Flags

```
┌─────────────────────────────────────────────────────┐
│ Page Header: [H1 Title]                               │
│ Tabs: [Tab1] [Tab2] [Tab3] [Tab4] ...                 │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Tab Content (form or list)                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Tabs:** Horizontal tab bar, `border-b`
- **Tab content:** Card or form, `mt-6`
- **Tab visibility:** Role-based (Owner sees all, Editor/Viewer see subset)

### 3.5 Wizard Page Pattern

Used by: Pairing Wizard, 2FA Setup Dialog

```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs (if applicable)                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Step Indicator: ① ── ② ── ③                     │ │
│ │                                                   │ │
│ │ Step Content (centered, max-w-500px)             │ │
│ │                                                   │ │
│ │ [Cancel]                    [Next / Submit]      │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Step Indicator:** Horizontal, `mb-8`
- **Content:** Centered, `max-w-[500px]`
- **Footer:** `flex justify-between`, `mt-8`

### 3.6 Calendar Page Pattern

Used by: Scheduling

```
┌─────────────────────────────────────────────────────┐
│ Page Header: [H1 Title] + [Create CTA]               │
│ View toggle + filters + date navigation              │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Calendar Grid (7 columns)                         │ │
│ │ Sun  Mon  Tue  Wed  Thu  Fri  Sat                │ │
│ │ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐             │ │
│ │ │  │ │  │ │  │ │EV│ │  │ │  │ │  │             │ │
│ │ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘             │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Calendar:** 7-column grid, `min-h-[600px]`
- **Day cells:** `border border-border min-h-[100px] p-1`
- **Event blocks:** `m-0.5 p-1 text-xs rounded`

---

## 4. Layout Rules

- **Every page** must use one of the defined layout patterns
- **Page header** is always at the top: H1 title + optional CTA
- **Sticky elements:** Header (56px, z-20), page headers (optional, z-10)
- **Scroll behavior:** Main content area scrolls; sidebar and header are fixed
- **Studio** is the only page that overrides the app shell (full-screen)
- **Auth pages** are the only pages without the app shell (standalone)
- **Danger Zone** sections are always at the bottom of detail pages
- **Breadcrumbs** appear on detail pages (not top-level pages)

---

## 5. Layout Spacing

| Element | Spacing |
|---------|---------|
| Page header to content | `--space-6` (24px) |
| Between sections | `--space-6` (24px) |
| Between cards in grid | `--space-4` (16px) |
| Between widgets | `--space-6` (24px) |
| Card internal padding | `--space-5` (20px) |
| Form field gap | `--space-3` (12px) |
| Toolbar item gap | `--space-3` (12px) |
| Breadcrumb to header | `--space-4` (16px) |

---

## Cross-References

- See `01-foundations.md` for spacing and elevation tokens
- See `02-grid-system.md` for column grid definitions
- See `04-breakpoints.md` for breakpoint-specific layout changes
- See `screen-specifications/01-global-layout-spec.md` for app shell spec
- See `ux-blueprint/05-page-type-ux-rules.md` for page type rules
- See `information-architecture/07-layout-principles.md` for layout principles
