# 38 — Responsive Rules

> **Evidence basis:** `04-breakpoints.md`, `02-grid-system.md`, `03-layout-system.md`, `ux-blueprint/04-responsive-ux-rules.md`, `product-architecture/17-product-rules.md` PR-45

---

## 1. Responsive Philosophy

Cloud-Screen is **desktop-first** (primary platform for digital signage management) but must be fully usable on tablets and mobile. The responsive strategy uses **mobile-first CSS** (base styles for mobile, overrides for larger screens) with **Tailwind breakpoints**.

---

## 2. Breakpoint Rules

### 2.1 Standard Breakpoints

| Breakpoint | Prefix | Min Width | Target |
|------------|--------|-----------|--------|
| Base | (none) | 0px | Mobile (all) |
| `sm` | `sm:` | 640px | Large phones |
| `md` | `md:` | 768px | Tablets |
| `lg` | `lg:` | 1024px | Desktops |
| `xl` | `xl:` | 1280px | Large desktops |
| `2xl` | `2xl:` | 1536px | Extra large |

### 2.2 Rules
- **Mobile-first:** Write base styles for mobile, add `sm:`, `md:`, `lg:` overrides
- **No custom breakpoints** — use only the 5 defined breakpoints
- **Test at:** 320px, 375px, 768px, 1024px, 1280px, 1440px, 1920px
- **No horizontal scroll** at any breakpoint (except tables and Studio)
- **Minimum supported width:** 320px

---

## 3. Component Responsive Rules

### 3.1 Sidebar
| Breakpoint | Behavior |
|------------|----------|
| < 768px | Hidden (drawer with hamburger toggle) |
| 768px–1023px | Collapsed (64px, icons only, tooltip on hover) |
| ≥ 1024px | Full (240px, icons + labels) |

### 3.2 Header
| Breakpoint | Behavior |
|------------|----------|
| < 768px | Compact (hamburger + bell + avatar) |
| ≥ 768px | Full (search + bell + user menu) |

### 3.3 Card Grids
| Grid Type | < 768px | 768px–1023px | 1024px–1279px | ≥ 1280px |
|-----------|---------|--------------|---------------|----------|
| Screen/Playlist | 1 col | 2 cols | 3 cols | 4 cols |
| Media | 2 cols | 3 cols | 4 cols | 6 cols |
| Widgets | 1 col | 2 cols | 3 cols | 3 cols |
| Metrics | 2 cols | 2 cols | 4 cols | 4 cols |
| Plan cards | 1 col | 3 cols | 3 cols | 3 cols |

### 3.4 Tables
| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | Full width, all columns visible |
| < 768px | Horizontal scroll (`overflow-x-auto`) |

### 3.5 Dialogs
| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | Centered modal, `max-w-[450-700px]` |
| < 768px | `mx-4`, `max-w-[calc(100vw-32px)]` |

### 3.6 Toolbars
| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | Single row (`flex-row`) |
| < 768px | Wrapped (`flex-wrap`), each item auto-width |

### 3.7 Page Padding
| Breakpoint | Padding |
|------------|---------|
| ≥ 1024px | `--space-6` (24px) |
| 768px–1023px | `--space-4` (16px) |
| < 768px | `--space-3` (12px) |

### 3.8 Studio
| Breakpoint | Behavior |
|------------|----------|
| ≥ 1024px | Full 3-panel layout |
| 768px–1023px | Warning: "Studio is optimized for desktop" |
| < 768px | "Please use a desktop browser" |

### 3.9 Calendar
| Breakpoint | Behavior |
|------------|----------|
| ≥ 768px | 7-column calendar grid |
| < 768px | List view (future) or minimal calendar |

---

## 4. Touch Target Rules

| Breakpoint | Minimum Size |
|------------|-------------|
| < 768px (Touch) | 44px × 44px |
| ≥ 768px (Mouse/Touch) | 36px × 36px |

### Elements
| Element | Mobile | Desktop |
|---------|--------|---------|
| Buttons | 44px height | 36px height (default), 40px (large) |
| Sidebar items | 44px height | 36px height |
| Checkboxes | 20px + 12px padding = 32px | Same |
| Table row actions | Icon-only, 44px | Icon + label, 36px |

---

## 5. Typography Responsive Rules

| Element | Mobile | Desktop |
|---------|--------|---------|
| Page heading (h1) | `--text-xl` (20px) | `--text-2xl` (24px) |
| Section heading (h2) | `--text-lg` (18px) | `--text-xl` (20px) |
| Body text | `--text-base` (16px) | `--text-base` (16px) |
| Input text | `--text-base` (16px) | `--text-base` (16px) |

**Critical:** Input font size must be ≥ 16px on mobile to prevent iOS auto-zoom.

---

## 6. Safe Areas

| Area | CSS | Usage |
|------|-----|-------|
| Top | `env(safe-area-inset-top)` | Header on iOS notch devices |
| Bottom | `env(safe-area-inset-bottom)` | Mobile drawer, bottom elements |
| Left | `env(safe-area-inset-left)` | RTL landscape |
| Right | `env(safe-area-inset-right)` | Landscape |

---

## 7. Responsive Testing Checklist

- [ ] 320px: No horizontal scroll (except tables/Studio)
- [ ] 375px: All elements visible and usable
- [ ] 768px: Sidebar collapsed, grids 2-column
- [ ] 1024px: Sidebar full, grids 3-4 column
- [ ] 1280px: Full layout, grids max columns
- [ ] 1920px: Container max-width prevents stretching
- [ ] Touch targets ≥ 44px on mobile
- [ ] Input font size ≥ 16px on mobile
- [ ] Dialogs fit within viewport on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Studio shows desktop-only message on mobile

---

## Cross-References

- See `04-breakpoints.md` for breakpoint definitions
- See `02-grid-system.md` for grid columns per breakpoint
- See `03-layout-system.md` for layout patterns per breakpoint
- See `39-rtl-rules.md` for RTL-specific responsive rules
- See `ux-blueprint/04-responsive-ux-rules.md` for responsive UX rules
- See `product-architecture/17-product-rules.md` PR-45 for touch targets
