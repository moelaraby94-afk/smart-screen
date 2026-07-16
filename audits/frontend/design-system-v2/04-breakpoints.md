# 04 — Breakpoints

> **Evidence basis:** `01-foundations.md`, `02-grid-system.md`, `03-layout-system.md`, `screen-specifications/01-global-layout-spec.md`, `ux-blueprint/04-responsive-ux-rules.md`, `product-architecture/17-product-rules.md` PR-45

---

## 1. Breakpoint Definitions

| Name | Min Width | Target Devices | Grid Columns |
|------|-----------|----------------|--------------|
| `xs` | 320px | Small phones (iPhone SE) | 4 |
| `sm` | 640px | Large phones, small tablets | 4 |
| `md` | 768px | Tablets (iPad portrait) | 8 |
| `lg` | 1024px | Tablets (iPad landscape), small laptops | 12 |
| `xl` | 1280px | Desktops | 12 |
| `2xl` | 1536px | Large desktops | 12 |

### Tailwind Mapping

| Breakpoint | Prefix | Min Width |
|------------|--------|-----------|
| Small | `sm:` | 640px |
| Medium | `md:` | 768px |
| Large | `lg:` | 1024px |
| Extra Large | `xl:` | 1280px |
| 2XL | `2xl:` | 1536px |

---

## 2. Breakpoint Behavior Matrix

### 2.1 App Shell

| Element | < 768px (Mobile) | 768px–1023px (Tablet) | ≥ 1024px (Desktop) |
|---------|------------------|-----------------------|---------------------|
| Sidebar | Hidden (drawer) | Collapsed (64px icons) | Full (240px) |
| Header | Compact (hamburger + bell + avatar) | Full | Full |
| Workspace switcher | Truncated name | Full | Full |
| Search (future) | Hidden | Hidden | Visible |
| Content padding | 12px | 16px | 24px |

### 2.2 Card Grids

| Grid Type | < 768px | 768px–1023px | 1024px–1279px | ≥ 1280px |
|-----------|---------|--------------|---------------|----------|
| Screen cards | 1 column | 2 columns | 3 columns | 4 columns |
| Playlist cards | 1 column | 2 columns | 3 columns | 4 columns |
| Media cards | 2 columns | 3 columns | 4 columns | 6 columns |
| Widget grid | 1 column | 2 columns | 3 columns | 3 columns |
| Metric cards | 2 columns | 2 columns | 4 columns | 4 columns |
| Plan cards | 1 column | 3 columns | 3 columns | 3 columns |

### 2.3 Detail Pages

| Element | < 768px | ≥ 768px |
|---------|---------|---------|
| Two-column layout | Stacked (1 column) | Side-by-side (2 columns) |
| Breadcrumbs | Visible (may wrap) | Visible (single line) |
| Header buttons | Stack or icon-only | Inline |

### 2.4 Tables

| Element | < 768px | ≥ 768px |
|---------|---------|---------|
| Table | Horizontal scroll | Full width |
| Columns | All visible (scroll) | All visible |
| Row actions | Icon-only | Icon + label |
| Search | Full width | Inline with filters |

### 2.5 Studio

| Breakpoint | Behavior |
|------------|----------|
| ≥ 1024px | Full 3-panel layout (280px + flex + 300px) |
| 768px–1023px | Warning: "Studio is optimized for desktop" |
| < 768px | Not supported: "Please use a desktop browser" |

### 2.6 Calendar

| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | 7-column calendar grid |
| < 768px | List view (events by date) — future |

### 2.6 Dialogs

| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | Centered modal, max-width per dialog type |
| < 768px | Full-width, `mx-4`, max-width capped at viewport - 32px |

---

## 3. Minimum Supported Width

- **320px** — smallest common mobile device (iPhone SE)
- All pages must be usable at 320px without horizontal scroll (except tables and Studio)
- Tables may scroll horizontally at mobile widths
- Studio is not supported below 1024px

---

## 4. Touch Targets

| Breakpoint | Minimum Touch Target |
|------------|---------------------|
| < 768px (Touch) | 44px × 44px |
| ≥ 768px (Mouse/Touch) | 36px × 36px |
| Sidebar items (desktop) | 36px height |
| Sidebar items (mobile drawer) | 44px height |
| Buttons (mobile) | 44px height |
| Buttons (desktop) | 36px height (default), 40px (large) |
| Checkboxes/Radios | 20px control + 12px padding = 32px total |

---

## 5. Safe Areas

| Area | CSS | Usage |
|------|-----|-------|
| Top | `env(safe-area-inset-top)` | Header on iOS notch devices |
| Bottom | `env(safe-area-inset-bottom)` | Mobile drawer, bottom-anchored elements |
| Left | `env(safe-area-inset-left)` | RTL landscape mode |
| Right | `env(safe-area-inset-right)` | Landscape mode |

---

## 6. Breakpoint Rules

- **Mobile-first:** Write base styles for mobile, then add `sm:`, `md:`, `lg:`, `xl:` overrides
- **No custom breakpoints** — use only the defined 5 breakpoints
- **Studio exemption:** Studio is desktop-only (≥ 1024px); no mobile adaptation
- **Tables exemption:** Tables may scroll horizontally on mobile (not hidden)
- **Test at:** 320px, 375px, 768px, 1024px, 1280px, 1440px, 1920px
- **No horizontal scroll** at any breakpoint except tables and Studio

---

## Cross-References

- See `01-foundations.md` for spacing tokens
- See `02-grid-system.md` for grid columns per breakpoint
- See `03-layout-system.md` for layout patterns per breakpoint
- See `38-responsive-rules.md` for comprehensive responsive rules
- See `screen-specifications/01-global-layout-spec.md` for shell responsive behavior
- See `ux-blueprint/04-responsive-ux-rules.md` for responsive UX rules
- See `product-architecture/17-product-rules.md` PR-45 for touch target rules
