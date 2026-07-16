# 19 — Responsive Compliance

> **Status:** FINAL — Breakpoint and responsive behavior enforcement

---

## 1. Purpose

Defines the responsive compliance rules that MUST be met for every screen. Enforced by AI Constitution (Article IV, §4.6).

---

## 2. Breakpoint Compliance

### 2.1 Standard Breakpoints

| Breakpoint | Prefix | Min Width | Must Test |
|------------|--------|-----------|-----------|
| Base | (none) | 0px | ✅ 320px, 375px |
| `sm` | `sm:` | 640px | ✅ 640px |
| `md` | `md:` | 768px | ✅ 768px |
| `lg` | `lg:` | 1024px | ✅ 1024px |
| `xl` | `xl:` | 1280px | ✅ 1280px |
| `2xl` | `2xl:` | 1536px | ✅ 1920px |

### 2.2 Rules
- [ ] No custom breakpoints (only the 5 defined)
- [ ] Mobile-first CSS (base for mobile, overrides for larger)
- [ ] Tested at 320px, 375px, 640px, 768px, 1024px, 1280px, 1536px, 1920px
- [ ] No horizontal scroll at any breakpoint (except tables and Studio)
- [ ] Minimum supported width: 320px

---

## 3. Component Responsive Behavior

### 3.1 Sidebar
- [ ] < 768px: Hidden (drawer with hamburger toggle)
- [ ] 768px–1023px: Collapsed (64px, icons only, tooltip on hover)
- [ ] ≥ 1024px: Full (240px, icons + labels)

### 3.2 Header
- [ ] < 768px: Compact (hamburger + bell + avatar)
- [ ] ≥ 768px: Full (search + bell + user menu)

### 3.3 Card Grids
- [ ] Screen/Playlist: 1 col (< 768px), 2 (768-1023), 3 (1024-1279), 4 (≥ 1280)
- [ ] Media: 2 col (< 768px), 3 (768-1023), 4 (1024-1279), 6 (≥ 1280)
- [ ] Widgets: 1 col (< 768px), 2 (768-1023), 3 (≥ 1024)
- [ ] Metrics: 2 col (< 1024px), 4 (≥ 1024)
- [ ] Plan cards: 1 col (< 768px), 3 (≥ 768px)

### 3.4 Tables
- [ ] ≥ 768px: Full width, all columns visible
- [ ] < 768px: Horizontal scroll (`overflow-x-auto`)

### 3.5 Dialogs
- [ ] ≥ 768px: Centered modal, `max-w-[450-700px]`
- [ ] < 768px: `mx-4`, `max-w-[calc(100vw-32px)]`

### 3.6 Toolbars
- [ ] ≥ 768px: Single row (`flex-row`)
- [ ] < 768px: Wrapped (`flex-wrap`)

### 3.7 Page Padding
- [ ] ≥ 1024px: `p-6` (24px)
- [ ] 768px–1023px: `p-4` (16px)
- [ ] < 768px: `p-3` (12px)

### 3.8 Studio
- [ ] ≥ 1024px: Full 3-panel layout
- [ ] 768px–1023px: Warning message
- [ ] < 768px: Desktop-only message

### 3.9 Calendar
- [ ] ≥ 768px: 7-column calendar grid
- [ ] < 768px: List view (future) or minimal calendar

---

## 4. Touch Target Compliance

| Breakpoint | Minimum Size |
|------------|-------------|
| < 768px (Touch) | 44px × 44px |
| ≥ 768px (Mouse/Touch) | 36px × 36px |

### Element-Specific
- [ ] Buttons: 44px (mobile), 36px (desktop default), 40px (large)
- [ ] Sidebar items: 44px (mobile), 36px (desktop)
- [ ] Checkboxes: 20px + 12px padding = 32px touch area
- [ ] Table row actions: 44px (mobile), 36px (desktop)
- [ ] Spacing between touch targets: ≥ 8px

---

## 5. Typography Responsive Compliance

| Element | Mobile | Desktop |
|---------|--------|---------|
| Page heading (h1) | `text-xl` (20px) | `text-2xl` (24px) |
| Section heading (h2) | `text-lg` (18px) | `text-xl` (20px) |
| Body text | `text-base` (16px) | `text-base` (16px) |
| Input text | `text-base` (16px) | `text-base` (16px) |

**Critical:** Input font size MUST be ≥ 16px on mobile to prevent iOS auto-zoom.

---

## 6. Safe Area Compliance

- [ ] `env(safe-area-inset-top)` for header on iOS notch devices
- [ ] `env(safe-area-inset-bottom)` for mobile drawer, bottom elements
- [ ] `env(safe-area-inset-left)` for RTL landscape
- [ ] `env(safe-area-inset-right)` for landscape

---

## 7. Responsive Testing Checklist

### Per-Screen
- [ ] 320px: No horizontal scroll, all elements usable
- [ ] 375px: All elements visible and accessible
- [ ] 640px: Layout adapts (if different from 375px)
- [ ] 768px: Sidebar collapsed, grids 2-column, header full
- [ ] 1024px: Sidebar full, grids 3-4 column, page padding 24px
- [ ] 1280px: Full layout, grids max columns
- [ ] 1536px: Container max-width prevents stretching
- [ ] 1920px: Container max-width prevents stretching

### Per-Element
- [ ] Touch targets ≥ 44px on mobile
- [ ] Input font size ≥ 16px on mobile
- [ ] Dialogs fit within viewport on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Toolbar items wrap on mobile
- [ ] Studio shows desktop-only message on mobile
- [ ] Card grids use correct column count per breakpoint
- [ ] Page padding matches breakpoint rules
- [ ] Sidebar behavior matches breakpoint rules
- [ ] Header behavior matches breakpoint rules

---

## 8. Responsive Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|-------------|-----------------|
| `max-lg:hidden` (max-width breakpoint) | Not mobile-first | Use `lg:hidden` (hide on large) |
| Fixed width (`w-500px`) | Breaks on mobile | Use responsive widths (`w-full max-w-md`) |
| Fixed height (`h-600px`) | Content may overflow | Use `min-h-[600px]` or responsive heights |
| `overflow-hidden` on body | Hides mobile content | Use `overflow-x-auto` for specific elements |
| Desktop-only layout on mobile | Unusable on mobile | Responsive layout per breakpoint |
| Tiny touch targets on mobile | Hard to tap | 44px minimum on mobile |
| Input < 16px on mobile | iOS auto-zoom | `text-base` (16px) minimum |
| No mobile sidebar | Can't navigate | Drawer with hamburger toggle |

---

## Cross-References

- See `01-ai-constitution.md` Article IV §4.6 for responsive mandate
- See `design-system-v2/38-responsive-rules.md` for detailed rules
- See `design-system-v2/04-breakpoints.md` for breakpoint definitions
- See `16-screen-compliance-checklist.md` §9 for screen responsive
- See `22-self-audit-process.md` for self-audit
- See `product-architecture/17-product-rules.md` PR-45 for touch targets
