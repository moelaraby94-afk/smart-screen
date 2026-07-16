# 06 — Responsive Audit

> **Evidence basis:** `globals.css`, `crystal-shell.tsx`, `header.tsx`, `shell-sidebar.tsx`, feature client components

---

## 1. Breakpoint Usage

The app uses Tailwind's default breakpoints:

| Breakpoint | Width | Usage Pattern |
|------------|-------|---------------|
| `sm` | 640px | Mobile → tablet transitions |
| `md` | 768px | Tablet adjustments |
| `lg` | 1024px | Desktop sidebar visible, mobile nav hidden |
| `xl` | 1280px | Content layout shifts |
| `2xl` | 1536px | Not explicitly used |

### Key Observations
- **Mobile/Tablet boundary:** `lg:hidden` / `hidden lg:flex` pattern used for sidebar toggle
- **Desktop actions:** `hidden lg:flex` for desktop header actions
- **Mobile actions:** `flex lg:hidden` for mobile header actions
- **Content max-width:** `max-w-[1600px]` on header content

---

## 2. App Shell Responsive Behavior

### 2.1 Sidebar
- **Desktop (lg+):** Fixed 240px sidebar visible
- **Mobile/Tablet (<lg):** Hidden, drawer via menu button in header
- **Drawer:** Overlay with backdrop, workspace switcher at top

### 2.2 Header
- **Desktop (lg+):** Full title row with back button, title, header inset, and actions (search, density, workspace switcher, notifications, user menu)
- **Mobile (<lg):** Menu button + title between menu and actions; actions include search, density, notifications, user menu (no workspace switcher in mobile actions)
- **Header inset:** On mobile, renders in a separate border-b row below header

### 2.3 Issues
- **No tablet collapsed sidebar** — IA spec mentions 64px collapsed sidebar for tablet; implementation only has full sidebar or drawer
- **Workspace switcher missing on mobile** — not in mobileActions; only in desktopActions

---

## 3. Page-Level Responsive Issues

### 3.1 Overview
- Hero section: `px-6 py-8 sm:px-10 sm:py-12` — good responsive padding
- TotalsSection: `grid gap-4` but no responsive column count visible — may stack on all sizes
- WorkspaceCardsSection: Uses grid with responsive columns
- Prayer/Hijri widgets: `grid gap-4 md:grid-cols-[1fr_auto]` — good

### 3.2 Screens List
- Screen cards grid: Uses responsive columns (likely `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`)
- Card content: Not optimized for medium widths — truncated text

### 3.3 Screen Detail
- Layout uses flex/grid but specific responsive behavior not optimized for tablet
- Branch dropdown: Native select works on mobile but doesn't match design system

### 3.4 Content Tabs
- Tabs list: `TabsList` may overflow on mobile with 4 tabs
- No horizontal scroll for tab list on narrow screens

### 3.5 Playlist Studio Editor
- **Critical:** 3-panel layout (media panel, canvas, properties) has no responsive collapse
- On tablet, panels become too narrow to use
- No drawer/bottom-sheet pattern for panels on smaller screens

### 3.6 Media Library
- Folder sidebar + media grid: Uses `flex-col xl:flex-row` — stacks on mobile, side-by-side on XL
- Good responsive pattern but breakpoint is XL (1280px) not LG (1024px) — tablets get stacked view

### 3.7 Scheduling
- Calendar view: 7-column grid — cramped on mobile
- No mobile-specific calendar view (day view or agenda)
- Timeline view: May work better on mobile but not default

### 3.8 Analytics
- Stat cards: Grid with responsive columns
- Per-screen table: `overflow-x-auto` on table wrapper — good for horizontal scroll
- No chart responsiveness issues (no charts)

### 3.9 Team
- Member table: `overflow-x-auto` — horizontal scroll on mobile
- Account members section: Stacks below workspace members
- Create user form: Responsive grid

### 3.10 Settings
- Settings tabs: `inline-flex` — may overflow on very small screens
- Profile page: Single column, works on mobile
- Billing page: Large component (32KB) — responsive behavior needs verification

---

## 4. RTL Responsive Behavior

### 4.1 Good Patterns
- `dir={rtl ? 'rtl' : 'ltr'}` on header content
- `inset-inline-start/end` used in aurora orbs CSS
- `rotate-180` on back button for RTL
- `rtl` prop passed to header and user menu

### 4.2 Issues
- Not all components receive `rtl` prop
- Some Tailwind classes use `left/right` instead of `start/end` logical properties
- Framer Motion animations may not flip for RTL

---

## 5. Mobile-Specific Gaps

| Gap | Severity | Pages Affected |
|-----|----------|----------------|
| No tablet collapsed sidebar (64px) | Medium | Global |
| Workspace switcher missing on mobile | Medium | Header |
| Studio 3-panel no collapse | High | /studio, /content?tab=studio |
| Calendar 7-col cramped | Medium | /scheduling |
| Tabs overflow | Low | /content, /settings |
| No mobile bottom nav | Low | Global |

---

## 6. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Mobile basic usability | 7/10 | Drawer nav, responsive grids |
| Tablet usability | 5/10 | No collapsed sidebar, Studio broken |
| Desktop | 8/10 | Good layout, max-width 1600px |
| Ultra-wide | 5/10 | Large empty margins |
| RTL responsive | 7/10 | Good but some gaps |
| Content adaptation | 6/10 | Some pages adapt well, others don't |
| **Overall** | **6.3/10** | **Tablet is the weakest breakpoint** |
