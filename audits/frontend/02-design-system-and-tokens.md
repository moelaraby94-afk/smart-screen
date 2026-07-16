# 02 — Design System, Tokens & Visual Language

> **Source basis:** `src/app/globals.css`, `tailwind.config.ts`, `src/lib/icon-stroke.ts`, `src/lib/admin-glass-table.ts`, `src/components/ui/app-dropdown-styles.ts`  

---

## 2.1 ORCA Design System Overview

The design system is called **ORCA**. It is defined entirely in `globals.css` using CSS custom properties (variables) scoped to `:root` and `.dark` selectors. Tailwind CSS is used as the utility engine, but the actual design tokens (colors, spacing, typography, surfaces) are CSS variables consumed by Tailwind utility classes via `var(--token)` references.

### Design Philosophy
- **Clean, premium, enterprise** aesthetic
- **Card-based surfaces** with subtle borders and shadows
- **Orange primary accent** (`brand-orange`) with navy secondary (`brand-navy`)
- **Dark mode** as first-class citizen (not an afterthought)
- **RTL-aware** with logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`)
- **Density modes** (comfortable/compact) via `data-density` attribute on `<html>`

---

## 2.2 Color Palette

### Brand Colors (Tailwind config)

**brand-orange** (primary accent):
| Shade | Hex |
|-------|-----|
| 50 | `#fff7ed` |
| 100 | `#ffedd5` |
| 200 | `#fed7aa` |
| 300 | `#fdba74` |
| 400 | `#fb923c` |
| 500 | `#f97316` |
| 600 | `#ea580c` |
| 700 | `#c2410c` |
| 800 | `#9a3412` |
| 900 | `#7c2d12` |
| 950 | `#431407` |

**brand-navy** (secondary/deep):
| Shade | Hex |
|-------|-----|
| 50 | `#f0f4f8` |
| 100 | `#d9e2ec` |
| 200 | `#bcccdc` |
| 300 | `#9fb3c8` |
| 400 | `#829ab1` |
| 500 | `#627d98` |
| 600 | `#486581` |
| 700 | `#334e68` |
| 800 | `#243b53` |
| 900 | `#102a43` |
| 950 | `#0a1929` |

### Semantic CSS Variables (Light Mode — `:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#ffffff` | Page background |
| `--foreground` | `#0f172a` | Primary text |
| `--card` | `#ffffff` | Card surfaces |
| `--card-foreground` | `#0f172a` | Text on cards |
| `--muted` | `#f1f5f9` | Muted backgrounds |
| `--muted-foreground` | `#64748b` | Secondary text |
| `--border` | `#e2e8f0` | Borders, dividers |
| `--primary` | `#ea580c` | Primary accent (orange-600) |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--accent` | `#f1f5f9` | Accent backgrounds |
| `--accent-foreground` | `#0f172a` | Text on accent |
| `--destructive` | `#dc2626` | Destructive actions (red-600) |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--ring` | `#ea580c` | Focus ring color |

### Semantic CSS Variables (Dark Mode — `.dark`)

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0a1929` | Deep navy background |
| `--foreground` | `#f1f5f9` | Light text |
| `--card` | `#102a43` | Card surfaces (navy-900) |
| `--card-foreground` | `#f1f5f9` | Text on cards |
| `--muted` | `#1e293b` | Muted backgrounds |
| `--muted-foreground` | `#94a3b8` | Secondary text |
| `--border` | `#1e293b` | Borders |
| `--primary` | `#f97316` | Primary accent (orange-500, brighter in dark) |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--accent` | `#1e293b` | Accent backgrounds |
| `--accent-foreground` | `#f1f5f9` | Text on accent |
| `--destructive` | `#ef4444` | Destructive (red-500, brighter in dark) |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--ring` | `#f97316` | Focus ring (orange-500) |

### Additional Semantic Colors Used in Components

| Color | Tailwind Class | Usage |
|-------|---------------|-------|
| Emerald | `emerald-500/10`, `emerald-600`, `emerald-400` | Success states, online status |
| Amber | `amber-500/15`, `amber-600` | Warning states, offline screens |
| Red | `red-500` | Notification badge, destructive |
| Blue | `blue-500/15`, `blue-600` | Upload notifications |
| Purple | `purple-500/15`, `purple-600` | Subscription notifications |
| Indigo | `indigo-500/15`, `indigo-600` | Schedule notifications |
| Cyan | `cyan-500/15`, `cyan-600` | Pairing notifications |
| Violet | `violet-500/10`, `violet-500/12` | Hero gradient orbs |
| Pink | `pink-500/5` | Hero gradient orbs |

---

## 2.3 Typography

### Font Families

| Font | CSS Variable | Usage |
|------|-------------|-------|
| Geist Sans | `--font-geist-sans` | Default body font (English/Latin) |
| Geist Mono | `--font-geist-mono` | Monospace (code, token input) |
| Cairo | `--font-cairo` | Arabic font (applied via `.font-ar` class when locale is `ar`) |

### Font Loading (Root Layout)

Fonts are loaded via `next/font/google` in `src/app/layout.tsx`:
- `GeistSans` — `Geist` font, subset `latin`
- `GeistMono` — `Geist_Mono` font, subset `latin`
- `Cairo` — `Cairo` font, subset `arabic`

CSS variables are set on the `<body>` element. The `<html>` element receives `className` with font variable names.

### Typography Scale (from `globals.css`)

| Element | Size | Weight | Line Height | Tracking |
|---------|------|--------|-------------|----------|
| Page title (`.vc-page-title`) | `text-2xl` | `font-semibold` | `tracking-tight` | — |
| Page kicker (`.vc-page-kicker`) | `text-[10px]` | `font-semibold` | `uppercase` | `tracking-[0.2em]` |
| Page description (`.vc-page-desc`) | `text-sm` | — | — | — |
| Section heading | `text-xl` | `font-semibold` | `tracking-tight` | — |
| Body text | `text-sm` | — | — | — |
| Small text | `text-xs` | — | — | — |
| Micro text | `text-[10px]` | — | — | — |
| Hero headline | `text-2xl` / `sm:text-4xl` | `font-bold` | `tracking-tight` | — |

### Base Body Styles

```css
body {
  background-color: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), var(--font-cairo), system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 2.4 Spacing System

The application uses Tailwind's default spacing scale. Key observations:

- **Page padding:** `px-6` on mobile, `sm:px-10` on larger screens (hero section)
- **Section spacing:** `space-y-6` between major sections, `space-y-8` on overview
- **Card padding:** `p-6` or `p-8` standard, `p-4` for compact cards
- **Header bottom border:** `border-b border-border pb-4`
- **Sidebar width:** Fixed `w-64` (16rem) on desktop, slide-in on mobile
- **Header height:** `h-16` (4rem) with `px-4` or `px-6`
- **Button heights:** `h-9` (sm), `h-10` (default), `h-11` (auth inputs), `h-12` (large)

### Density Modes

Controlled by `data-density` attribute on `<html>`:
- **Comfortable** (default): Standard spacing
- **Compact:** Reduced spacing via CSS overrides in `globals.css`

The `DensityToggle` component (`src/components/density-toggle.tsx`) toggles between modes, saving preference to `localStorage` key `cs_density` and setting `data-density` on `document.documentElement`.

---

## 2.5 Surface System

### Card Surface (`.vc-card-surface`)

```css
.vc-card-surface {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: 0.75rem; /* rounded-xl */
}
```

Used extensively across admin pages, workspace cards, and onboarding wizard options.

### Card Component (`src/components/ui/card.tsx`)

- `Card`: `rounded-xl border border-border bg-card text-card-foreground shadow-sm`
- `CardHeader`: `flex flex-col space-y-1.5 p-6`
- `CardTitle`: `text-lg font-semibold leading-none tracking-tight`
- `CardDescription`: `text-sm text-muted-foreground`
- `CardContent`: `p-6 pt-0`
- `CardFooter`: `flex items-center p-6 pt-0`

### Admin Table Surface (`src/lib/admin-glass-table.ts`)

Shared style tokens for admin tables:
- **Wrapper:** `vc-card-surface overflow-hidden rounded-2xl border border-border bg-card`
- **Header row:** `bg-muted/25`, no border
- **TH:** `h-11`, `text-[11px]`, `uppercase`, `tracking-[0.1em]`, `text-primary`, `font-semibold`
- **Body row:** `border-border`, hover `bg-muted/30`, selected `bg-muted/40`
- **Clickable row:** `cursor-pointer`, hover `bg-muted/35`

---

## 2.6 Button System

### Button Variants (`src/components/ui/button.tsx`)

| Variant | Visual | Usage |
|---------|--------|-------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Primary actions |
| `cta` | `bg-primary text-white shadow-sm hover:bg-primary/90 shadow-primary/20` | Call-to-action (auth, onboarding) |
| `secondary` | `bg-muted text-foreground hover:bg-muted/80` | Secondary actions |
| `ghost` | `hover:bg-muted hover:text-foreground` | Tertiary actions, icon buttons |
| `outline` | `border border-border bg-background hover:bg-muted` | Outlined actions |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Delete, remove |

### Button Sizes

| Size | Height | Padding | Usage |
|------|--------|---------|-------|
| `default` | `h-10` | `px-4 py-2` | Standard |
| `sm` | `h-9` | `px-3` | Compact |
| `lg` | `h-12` | `px-8` | Hero, onboarding |
| `icon` | `h-10 w-10` | — | Icon-only buttons |

### Button Base Styles
- `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors`
- Focus visible: `outline-none ring-2 ring-ring ring-offset-2 ring-offset-background`
- Disabled: `disabled:pointer-events-none disabled:opacity-50`
- Supports `asChild` prop for polymorphic rendering (via Radix Slot)

---

## 2.7 Badge System

### Badge Variants (`src/components/ui/badge.tsx`)

| Variant | Visual | Usage |
|---------|--------|-------|
| `default` | `bg-primary/10 text-primary border-primary/20` | General tags |
| `muted` | `bg-muted text-muted-foreground border-border` | Subtle labels |
| `success` | `bg-emerald-500/10 text-emerald-600 border-emerald-500/20` | Success states |
| `online` | `bg-emerald-500/15 text-emerald-600 border-emerald-500/30` | Online status |
| `warning` | `bg-amber-500/10 text-amber-600 border-amber-500/20` | Warning states |
| `danger` | `bg-red-500/10 text-red-600 border-red-500/20` | Danger states |

All badges: `inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold`

---

## 2.8 Form Input System

### Input (`src/components/ui/input.tsx`)
- Height: `h-10` (standard), `h-11` (auth forms via custom class)
- Border: `border border-border bg-card`
- Text: `text-sm text-foreground`
- Placeholder: `placeholder:text-muted-foreground/50`
- Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- Disabled: `disabled:cursor-not-allowed disabled:opacity-50`
- Radius: `rounded-xl`

### Auth Input Style (login form)
Custom class string used in auth forms:
```
h-11 rounded-xl border border-border bg-card text-[15px] text-foreground
placeholder:text-muted-foreground/50
focus-visible:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/20
```

### Select (`src/components/ui/select.tsx`)
- Built on Radix UI Select
- Trigger: `h-9 rounded-xl border border-border bg-card`
- Content: `rounded-xl border border-border bg-card shadow-md`
- Item: `rounded-lg` with selected state `bg-primary/10 text-primary`
- Scroll buttons (up/down) for long lists
- Keyboard navigation supported

### Checkbox (`src/components/ui/checkbox.tsx`)
- Built on Radix UI Checkbox
- Size: `h-4 w-4`
- Checked: `bg-primary text-primary-foreground`
- Focus: `ring-2 ring-ring ring-offset-2`
- Icon: Lucide `Check` at `h-3 w-3`

### Switch (`src/components/ui/switch.tsx`)
- Built on Radix UI Switch
- Track: `h-5 w-9` with `rounded-full`
- Unchecked: `bg-muted`
- Checked: `bg-primary`
- Thumb: `h-4 w-4` white circle, animated translate

### Label (`src/components/ui/label.tsx`)
- `text-sm font-medium leading-none text-foreground`
- Disabled peer: `peer-disabled:cursor-not-allowed peer-disabled:opacity-70`

---

## 2.9 Dropdown Menu System

### Dropdown Menu (`src/components/ui/dropdown-menu.tsx`)
- Built on Radix UI DropdownMenu
- Content: `rounded-xl border border-border bg-card p-1 shadow-md z-[120]`
- Item: `rounded-lg px-2.5 py-1.5 text-sm`, hover `bg-muted`, focus `bg-muted`
- Label: `px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground`
- Separator: `bg-border -mx-1 my-1 h-px`

### App Dropdown Styles (`src/components/ui/app-dropdown-styles.ts`)
Shared class tokens for workspace switcher and filter dropdowns:
- **Trigger:** `flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm text-foreground transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50`
- **Content:** `min-w-[12rem] rounded-xl border border-border bg-card p-1.5 shadow-lg`

---

## 2.10 Dialog System

### Dialog (`src/components/ui/dialog.tsx`)
- Built on Radix UI Dialog
- Overlay: `fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm`
- Content: `fixed left-1/2 top-1/2 z-[111] -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg`
- Close button (X): top-end corner, `text-muted-foreground hover:text-foreground`
- Title: `text-lg font-semibold text-foreground`
- Description: `text-sm text-muted-foreground`
- Header: `flex flex-col space-y-1.5`
- Footer: `flex flex-col-reverse sm:flex-row sm:justify-end gap-2`

### AlertDialog (`src/components/ui/alert-dialog.tsx`)
- Built on Radix UI AlertDialog
- Overlay: `fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm`
- Content: `fixed left-1/2 top-1/2 z-[111] -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg`
- Cancel button: `buttonVariants({ variant: 'outline' })`
- Action button: `buttonVariants({ variant: 'destructive' })` (typically)

---

## 2.11 Table System

### Table (`src/components/ui/table.tsx`)
- Wrapper: `w-full caption-bottom`
- Header: `border-b border-border`
- Body: `[&_tr:last-child]:border-0`
- Row: `border-b border-border transition-colors hover:bg-muted/30`
- Head cell: `h-10 px-3 text-left align-middle font-semibold text-muted-foreground`
- Body cell: `p-3 align-middle`
- RTL support: `rtl:text-right` on head cells

---

## 2.12 Tabs System

### Tabs (`src/components/ui/tabs.tsx`)
- Built on Radix UI Tabs
- List: `inline-flex h-9 items-center justify-center rounded-xl bg-muted p-1`
- Trigger: `inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1 text-sm font-medium`
- Active: `bg-card text-foreground shadow-sm`
- Inactive: `text-muted-foreground`
- Focus: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`
- Content: `mt-2 focus-visible:outline-none`

---

## 2.13 Scrollbar Styling

Custom scrollbar styles in `globals.css`:

**Light mode:**
- Track: `var(--muted)` with `2px` solid border
- Thumb: `var(--muted-foreground)` at 30% opacity, `rounded-full`
- Thumb hover: 50% opacity

**Dark mode:**
- Track: `var(--card)` with border `var(--border)`
- Thumb: `var(--muted-foreground)` at 40% opacity
- Thumb hover: 60% opacity

**Firefox:** `scrollbar-width: thin` with `scrollbar-color` matching

---

## 2.14 Aurora Backdrop

`src/components/aurora-backdrop.tsx` renders three decorative blurred orange orbs:
- **Orb 1:** `bg-primary/8`, `h-72 w-72`, positioned `top-[-10%] start-[5%]`, blur `3xl`
- **Orb 2:** `bg-primary/6`, `h-96 w-96`, positioned `top-[40%] end-[-5%]`, blur `3xl`
- **Orb 3:** `bg-primary/4`, `h-80 w-80`, positioned `bottom-[-10%] start-[30%]`, blur `3xl`

Container: `fixed inset-0 -z-10 overflow-hidden pointer-events-none`

These create a subtle warm ambient glow behind the entire application.

---

## 2.15 Icon System

- **Library:** lucide-react
- **Stroke width:** Consistent `1.5` via `ICON_STROKE` constant (`src/lib/icon-stroke.ts`)
- Some components use `strokeWidth={1.8}` for smaller icons (back buttons, close actions)
- Icons are always `aria-hidden` when decorative
- Icons in buttons: `h-4 w-4` (standard), `h-5 w-5` (large), `h-3 w-3` (micro)

---

## 2.16 Shadow & Elevation

- **Cards:** `shadow-sm` (subtle)
- **Dropdowns/Popovers:** `shadow-md` or `shadow-lg`
- **Dialogs:** `shadow-lg` or `shadow-2xl` (search modal)
- **CTA buttons:** `shadow-sm shadow-primary/20` (branded glow)
- No heavy shadows — the design favors borders and subtle elevation

---

## 2.17 Focus Management

- **Focus ring:** `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Applied to: buttons, inputs, selects, checkboxes, switches, tabs, dropdown items
- Focus visible only (not on mouse click): `focus-visible:`
- Ring color: `--ring` (orange in both themes)

---

## 2.18 Transitions & Animations

### CSS Transitions
- Buttons: `transition-colors` (color changes on hover/active)
- Dropdown items: `transition-colors`
- Table rows: `transition-colors duration-150`
- Sidebar nav items: `transition-colors`
- Chevron icons: `transition-transform duration-200` (rotate on open)

### Framer Motion Animations
- **Page transitions:** `PageTransition` wraps children with `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, keyed by pathname
- **Hero section:** `initial={{ opacity: 0, y: 14 }}`, `animate={{ opacity: 1, y: 0 }}`, `transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}`
- **Home dashboard:** `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: -8 }}`
- **Onboarding wizard:** Step transitions with `initial={{ opacity: 0, x: 20 * dir }}` (RTL-aware direction)
- **Theme toggle:** Animated icon transition using framer-motion `AnimatePresence`
- **Global search:** Modal `initial={{ opacity: 0, y: -20 }}`, `animate={{ opacity: 1, y: 0 }}`
- **Workspace welcome:** `initial={{ opacity: 0, y: 20 }}`, `animate={{ opacity: 1, y: 0 }}`

---

## 2.19 RTL (Right-to-Left) Support

### Implementation
- **Direction:** Set on `<html dir="rtl">` for Arabic locale, `dir="ltr"` for English
- **CSS logical properties:** Tailwind's `ps-`/`pe-` (padding-start/end), `ms-`/`me-` (margin-start/end), `start-`/`end-` (inset-start/end) used throughout
- **Icon flipping:** `rtl:rotate-180` class on directional icons (arrows, chevrons)
- **Toast position:** Sonner positioned `top-right` for LTR, `top-left` for RTL
- **Dropdown alignment:** `align={rtl ? 'end' : 'start'}` in workspace switcher
- **Font family:** Cairo font applied via `.font-ar` class when locale is `ar`

### RTL Considerations in Components
- `ShellSidebar`: Uses `start-0` positioning, slides from start side on mobile
- `ShellHeader`: Uses `flex-row-reverse` for RTL in some sections
- `Breadcrumbs`: Flex direction reverses for RTL
- `OnboardingWizard`: Animation direction `dir = locale === 'ar' ? -1 : 1`

---

## 2.20 [V2] UX Analysis — Design System & Tokens

### ORCA Design Language — Evaluation

**[V2] Color System — Semantic Mapping:**
The ORCA design system uses semantic color tokens that map to CSS custom properties:
- `--primary` (orange) — brand color, used for CTAs, active states, focus rings
- `--destructive` (red) — delete actions, error states
- `--muted` (neutral) — inactive states, secondary content
- `--accent` (subtle orange) — highlights, hover states

The semantic mapping is well-executed — components reference semantic tokens, not raw colors. This enables theming (dark mode, custom branding) without component changes.

**[V2] Dark Mode Implementation:**
The app uses `next-themes` for dark mode with `class` strategy. The `ThemeProvider` wraps the app and adds/removes `dark` class on `<html>`. CSS variables are overridden in `.dark` selector. The transition between light/dark is instant (no smooth transition) — this is correct for accessibility (smooth color transitions can cause visual confusion).

**[V2] Font System:**
- English: System font stack (no custom font loaded)
- Arabic: Cairo font (loaded via `next/font`)

Using system fonts for English is a performance optimization (no font download). Cairo for Arabic is a good choice — it's a modern, readable Arabic font with good weight coverage. However, the visual difference between system fonts (English) and Cairo (Arabic) may create inconsistent brand perception.

### Button System — HCI Evaluation

**[V2] Button Height Hierarchy:**
- `sm` (36px) — compact actions, inline buttons
- `default` (40px) — standard actions
- `lg` (48px) — hero/onboarding
- `icon` (40×40px) — icon-only buttons

The 40px default height meets the WCAG 2.5.5 (Target Size) minimum of 44px? No — 40px is below 44px. This is a **minor accessibility issue** — touch targets should be at least 44×44px. The `sm` (36px) is even smaller. On mobile, these may be difficult to tap accurately.

**[V2] CTA vs Default — Subtle Distinction:**
The `cta` variant adds `shadow-sm shadow-primary/20` (branded glow) compared to `default`. This is a very subtle distinction — users may not notice the difference. The glow is more visible in dark mode. Consider whether this distinction is sufficient for conveying hierarchy.

**[V2] Disabled State:**
`disabled:pointer-events-none disabled:opacity-50` — 50% opacity is standard but may not meet WCAG 1.4.3 contrast requirements. Disabled buttons with 50% opacity may have insufficient contrast against the background.

### Badge System — Semantic Analysis

**[V2] Badge Color Mapping:**
The badge system uses semantic colors that map to user-meaningful states:
- `online` (emerald, 15% opacity bg) — screen online status
- `success` (emerald, 10% opacity bg) — general success
- `warning` (amber, 10% opacity bg) — warnings, pending states
- `danger` (red, 10% opacity bg) — errors, offline status
- `default` (primary, 10% opacity bg) — general tags
- `muted` (neutral) — subtle labels

The `online` variant uses 15% opacity (vs 10% for `success`) — this makes online status slightly more prominent than general success. This is a deliberate design choice — online status is more important than general success messages.

### Form Input System — UX Analysis

**[V2] Input Height Inconsistency:**
- Standard input: `h-10` (40px)
- Auth form input: `h-11` (44px) — meets WCAG touch target minimum
- Select trigger: `h-9` (36px) — below standard

The auth forms use taller inputs (44px) which is better for touch. The standard inputs (40px) and select triggers (36px) are smaller. This inconsistency means auth forms feel more spacious than the rest of the app.

**[V2] Focus Ring Color:**
Focus ring uses `--ring` which is orange in both themes. This is good — the focus ring color matches the brand and is consistent across themes. The `ring-offset-2 ring-offset-background` creates a gap between the ring and the element, improving visibility.

### Dialog System — Z-Index Stack

**[V2] Z-Index Hierarchy:**
| Layer | Z-Index | Component |
|-------|---------|-----------|
| Aurora backdrop | `-z-10` | Background orbs |
| Sidebar (desktop) | `z-40` | Fixed sidebar |
| Header | `z-[55]` | Sticky header |
| Mobile nav overlay | `z-[60]` | Mobile sidebar |
| Mobile nav backdrop | `z-[59]` | Backdrop |
| Dialog overlay | `z-[110]` | Modal backdrop |
| Dialog content | `z-[111]` | Modal content |
| Dropdown menu | `z-[120]` | Popovers, dropdowns |
| Toast (sonner) | Default | Top-level portal |

The z-index stack is well-organized with clear separation between layers. The dropdown (120) is above dialog (111) which is correct — dropdowns opened from within dialogs should appear above the dialog.

### Scrollbar Styling — Cross-Browser

**[V2] Custom Scrollbar:**
The app styles scrollbars for WebKit (Chrome, Safari, Edge) and Firefox separately. The styled scrollbars are thinner than native, with rounded thumbs. This creates a more polished, branded appearance. However:
- The thumb opacity (30-40%) may make the scrollbar hard to see for users with visual impairments
- The thin scrollbar may be hard to grab for users with motor difficulties
- `scrollbar-width: thin` on Firefox is less customizable

### Aurora Backdrop — Visual Design

**[V2] AuroraBackdrop Not Rendered:**
As identified in `04-layout-and-shell.md` V2, the `AuroraBackdrop` component exists but is not rendered by `CrystalShell`. The decorative orbs are defined but never displayed. This means:
- The app has a flat background (no ambient glow)
- The AuroraBackdrop code is dead code
- The visual design is less rich than intended

### Cross-References
- See `04-layout-and-shell.md` for AuroraBackdrop rendering status
- See `05-ui-component-library.md` for component-level design analysis
- See `22-i18n-and-localization.md` for Cairo font and RTL design
- See `24-accessibility-audit.md` for contrast and touch target evaluation
- See `26-consistency-audit.md` for design system consistency audit
