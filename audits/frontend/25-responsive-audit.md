# 25 — Responsive Design Audit

> **Source basis:** All layout, shell, and feature components analyzed throughout this audit  

---

## 25.1 Breakpoint Strategy

The application uses Tailwind's default breakpoints:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| (none) | 0px | Mobile first — base styles |
| `sm` | 640px | Small tablets, large phones landscape |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktop — sidebar becomes fixed |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Not explicitly used in custom code |

### Mobile-First Approach
All components are styled for mobile first, with `sm:`, `md:`, `lg:` prefixes adding desktop enhancements. No `max-*` breakpoints are used.

---

## 25.2 Shell Layout Responsive Behavior

### Sidebar

| Breakpoint | Behavior |
|------------|----------|
| < lg (mobile/tablet) | Hidden by default, slide-in overlay when menu button clicked. Width: `w-72`. Overlay: `bg-black/50`. Close on nav item click or overlay tap. |
| ≥ lg (desktop) | Fixed visible sidebar, `w-64`. Main content offset with `lg:pl-64` (LTR) or `lg:pr-64` (RTL). |

### Header

| Breakpoint | Behavior |
|------------|----------|
| < lg | Mobile menu button (hamburger) visible. Desktop actions hidden. Mobile action icons shown (search, bell, avatar). |
| ≥ lg | No menu button. Full desktop actions shown: search bar with Ctrl+K hint, density toggle, workspace switcher, notification bell, user menu. |

### Main Content

| Breakpoint | Padding |
|------------|---------|
| < sm | `px-4 py-6` |
| sm | `px-6` |
| lg | `px-8` |

### Breadcrumbs
- Always visible below header
- Text size: `text-sm` consistently
- No responsive hiding — breadcrumbs always shown

---

## 25.3 Feature Page Responsive Patterns

### Grid Layouts

| Feature | Mobile | sm | md | lg |
|---------|--------|-----|-----|-----|
| Dashboard totals | 1 col | 2 cols | 2 cols | 4 cols |
| Workspace cards | 1 col | 2 cols | 2 cols | 3 cols |
| Screen grid | 1 col | 2 cols | 3 cols | 4 cols |
| Media grid | 2 cols | 3 cols | 4 cols | 5 cols |
| Quick actions | 2 cols | 3 cols | 3 cols | 6 cols |
| Screen health + Activity | 1 col | 1 col | 1 col | 2 cols |
| Prayer + Hijri | 1 col | 1 col | 1 col | `1fr auto` |

### Hero Section (HomeOverview)
| Breakpoint | Padding | Headline Size |
|------------|---------|---------------|
| < sm | `px-6 py-8` | `text-2xl` |
| ≥ sm | `px-10 py-12` | `text-4xl` |

### Cards
- Standard card padding: `p-6` (consistent across breakpoints)
- Some compact cards: `p-4`
- No responsive padding adjustments on cards

### Tables
- Tables use horizontal scroll on mobile: `overflow-x-auto` wrapper
- No column hiding on mobile (all columns visible)
- Admin tables: same approach with `overflow-x-auto`

---

## 25.4 Auth Pages Responsive

| Breakpoint | Card Width |
|------------|------------|
| < sm | `max-w-md` (constrained, with `mx-4` margin) |
| ≥ sm | `max-w-md` or `max-w-lg` (register) centered |

Auth pages are always centered with `min-h-screen` and flex centering. No sidebar or header on auth pages.

---

## 25.5 Dialogs Responsive

| Breakpoint | Dialog Width |
|------------|-------------|
| < sm | `w-full` with `mx-4` margin (nearly full width) |
| ≥ sm | `max-w-lg` or `max-w-md` centered |

- Dialog content has `max-h-[85vh]` with `overflow-y-auto` for long content
- Footer buttons: `flex-col-reverse` on mobile, `sm:flex-row` on desktop

---

## 25.6 Global Search Responsive

| Breakpoint | Trigger | Modal |
|------------|---------|-------|
| < lg | Icon-only button (`h-9 w-9`) | `max-w-xl` with `px-4` margin |
| ≥ lg | Button with text + `Ctrl K` badge | Same modal |

---

## 25.7 RTL Responsive

### Sidebar Position
- LTR: `left-0` (via `start-0`), content offset `lg:pl-64`
- RTL: `right-0` (via `start-0`), content offset `lg:pr-64`

### Mobile Sidebar Slide Direction
- LTR: Slides in from left
- RTL: Slides in from right

### Toast Position
- LTR: `top-right`
- RTL: `top-left`

### Icon Rotation
- Directional icons: `rtl:rotate-180` — applies at all breakpoints

---

## 25.8 Potential Responsive Issues

1. **Tables on mobile:** While `overflow-x-auto` prevents layout breakage, wide tables (admin customers, admin users) require horizontal scrolling on mobile — not ideal UX but functional.

2. **Studio canvas (Konva):** The canvas editor is inherently desktop-oriented. On mobile, the canvas may be too small to be usable. No explicit mobile adaptation noted.

3. **Playlist timeline:** Horizontal timeline with drag-and-drop is challenging on mobile. No touch-specific handling noted.

4. **Admin panel:** Admin pages are primarily designed for desktop use. The admin sidebar nav items are the same as standard nav (responsive), but admin tables and forms may be cramped on mobile.

5. **Workspace switcher:** Max width `min(100%, min(420px, calc(100vw - 8rem)))` — this complex calc ensures it fits on mobile but may truncate long workspace names.

6. **Header actions on mobile:** Only search, bell, and avatar are shown. Workspace switcher and density toggle are hidden on mobile (< lg). This means mobile users cannot switch workspaces from the header — they must use the sidebar.

---

## 25.7 [V2] UX Analysis — Responsive Design

### Breakpoint Strategy — HCI Evaluation

**[V2] Breakpoint Usage:**
The app uses Tailwind's default breakpoints:
- `sm` (640px): Mobile → Tablet transition
- `lg` (1024px): Tablet → Desktop transition

The `md` (768px) breakpoint is rarely used — the app jumps from mobile to desktop at `lg`. This means tablets (768-1023px) get the mobile layout, which may feel sparse on iPad-sized screens.

**[V2] Sidebar Breakpoint:**
Sidebar is hidden below `lg` (1024px) and visible above. This means:
- iPad Portrait (768px): Mobile layout (no sidebar)
- iPad Landscape (1024px): Desktop layout (sidebar visible)
- Small laptops (1024px): Desktop layout

The 1024px cutoff is standard for SaaS apps but means iPad portrait users have a mobile experience.

**[V2] Mobile-First Approach:**
The CSS uses mobile-first patterns — base styles are for mobile, `sm:` and `lg:` add desktop styles. This is the correct Tailwind approach.

### Mobile UX Issues — Consolidated

**[V2] Critical Mobile Issues:**
1. **No workspace switcher on mobile** — Users cannot switch workspaces from any page on mobile. The switcher is `hidden lg:flex` in the header and not available in the mobile sidebar. This is a **critical UX gap** for multi-workspace users on mobile.

2. **Header touch target density** — On 375px screens, the header has 6-7 controls in 52px height with 6px gaps. Touch targets are 32px (below 44px minimum) and spacing is below 8px minimum.

3. **Studio canvas on mobile** — The canvas-based studio editor is desktop-oriented. On mobile, the canvas is too small for precise element positioning. No touch-specific gestures (pinch-to-zoom, etc.) are noted.

4. **Tables on mobile** — Admin tables use `overflow-x-auto` which requires horizontal scrolling. This is functional but poor UX — users can't see all columns at once.

5. **Playlist timeline on mobile** — Horizontal timeline with drag-and-drop is challenging on touch devices. No touch-specific handling noted.

**[V2] Mobile-Only Features Missing:**
- No pull-to-refresh on list pages
- No swipe gestures for navigation
- No bottom navigation bar (mobile pattern)
- No mobile-specific onboarding
- No responsive data tables (card view on mobile)
- No touch-optimized date/time pickers

### Desktop UX Issues

**[V2] Ultra-Wide Display Handling:**
`max-w-[1600px]` on main content prevents stretching on ultra-wide displays. This is good — content remains readable on 3440px wide monitors. The sidebar is fixed at 240px regardless of screen width, which is correct.

**[V2] Desktop-Only Features:**
- Studio canvas editor (requires mouse for precision)
- Drag-and-drop playlist timeline
- Hover states on nav items (`group-hover:scale-105`)
- Keyboard shortcuts (Ctrl+K for search)
- Density toggle (compact/comfortable)

### [V2] Responsive Consistency Audit

**[V2] Inconsistent Responsive Patterns:**
- Some pages use `px-4 sm:px-6 lg:px-10` (shell main content)
- Some pages may use different padding patterns
- Card grids use different column counts across features (1/2/4 vs 2/3/6)
- Table responsive behavior varies (some use `overflow-x-auto`, some use card view)

### Cross-References
- See `04-layout-and-shell.md` for shell responsive behavior
- See `03-routing-and-navigation.md` for sidebar mobile behavior
- See `24-accessibility-audit.md` for mobile touch target accessibility
- See `26-consistency-audit.md` for responsive pattern consistency
- See `07-workspace-management.md` for mobile workspace switching gap
