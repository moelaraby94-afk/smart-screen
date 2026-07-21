# 01 — Foundations

> **Evidence basis:** `audits/frontend/02-design-system-and-tokens.md`, `ux-blueprint/02-state-guidelines.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/01-global-layout-spec.md`, `product-architecture/17-product-rules.md` PR-45–PR-50
> **Purpose:** Define the foundational design tokens — color, spacing, typography, radius, shadows, opacity, elevation — that form the base of the entire Design System V2

---

## 1. Color System

### 1.1 Color Philosophy

The Smart Screen color system preserves the current visual identity while introducing a mature, scalable token architecture. Colors are organized as **semantic tokens** (role-based) built on **primitive tokens** (raw values). This separation allows theme switching (light/dark) and brand customization without touching component-level code.

### 1.2 Primitive Color Tokens

| Token | Value (Light) | Value (Dark) | Usage |
|-------|---------------|--------------|-------|
| `--blue-50` | `#eff6ff` | `#eff6ff` | Primary light surface |
| `--blue-100` | `#dbeafe` | `#dbeafe` | Primary hover surface |
| `--blue-400` | `#60a5fa` | `#60a5fa` | Primary muted |
| `--blue-500` | `#3b82f6` | `#3b82f6` | Primary default |
| `--blue-600` | `#2563eb` | `#2563eb` | Primary hover |
| `--blue-700` | `#1d4ed8` | `#1d4ed8` | Primary active |
| `--blue-900` | `#1e3a8a` | `#1e3a8a` | Primary deep |
| `--gray-50` | `#f9fafb` | `#131316` | Background base |
| `--gray-100` | `#f3f4f6` | `#1a1a1e` | Muted background |
| `--gray-200` | `#e5e7eb` | `#2a2a30` | Border default |
| `--gray-300` | `#d1d5db` | `#3a3a42` | Border strong |
| `--gray-400` | `#9ca3af` | `#6b7280` | Text muted |
| `--gray-500` | `#6b7280` | `#9ca3af` | Text secondary |
| `--gray-600` | `#4b5563` | `#d1d5db` | Text primary (dark mode) |
| `--gray-700` | `#374151` | `#e5e7eb` | Text primary |
| `--gray-800` | `#1f2937` | `#f3f4f6` | Text strong |
| `--gray-900` | `#111827` | `#f9fafb` | Text heading |
| `--green-500` | `#22c55e` | `#22c55e` | Success |
| `--green-600` | `#16a34a` | `#16a34a` | Success hover |
| `--red-500` | `#ef4444` | `#ef4444` | Destructive |
| `--red-600` | `#dc2626` | `#dc2626` | Destructive hover |
| `--amber-500` | `#f59e0b` | `#f59e0b` | Warning |
| `--amber-600` | `#d97706` | `#d97706` | Warning hover |
| `--white` | `#ffffff` | `#1a1a1e` | Card background |
| `--black` | `#000000` | `#ffffff` | Overlay |

### 1.3 Semantic Color Tokens

Semantic tokens map primitive colors to roles. Components reference only semantic tokens — never primitives.

| Token | Light Value | Dark Value | Role |
|-------|-------------|------------|------|
| `--background` | `--gray-50` | `--gray-50-dark` | App background |
| `--foreground` | `--gray-900` | `--gray-50` | Primary text |
| `--card` | `--white` | `--gray-100-dark` | Card/panel background |
| `--card-foreground` | `--gray-900` | `--gray-50` | Card text |
| `--muted` | `--gray-100` | `--gray-100-dark` | Muted background |
| `--muted-foreground` | `--gray-500` | `--gray-400` | Secondary text |
| `--border` | `--gray-200` | `--gray-200-dark` | Default border |
| `--border-strong` | `--gray-300` | `--gray-300-dark` | Strong border |
| `--input` | `--gray-200` | `--gray-200-dark` | Input border |
| `--ring` | `--blue-500` | `--blue-400` | Focus ring |
| `--primary` | `--blue-600` | `--blue-500` | Primary action |
| `--primary-foreground` | `--white` | `--white` | Text on primary |
| `--primary-muted` | `--blue-50` | `--blue-900` | Primary surface |
| `--secondary` | `--gray-100` | `--gray-200-dark` | Secondary action bg |
| `--secondary-foreground` | `--gray-900` | `--gray-50` | Text on secondary |
| `--destructive` | `--red-500` | `--red-500` | Destructive action |
| `--destructive-foreground` | `--white` | `--white` | Text on destructive |
| `--success` | `--green-500` | `--green-500` | Success state |
| `--success-foreground` | `--white` | `--white` | Text on success |
| `--warning` | `--amber-500` | `--amber-500` | Warning state |
| `--warning-foreground` | `--white` | `--white` | Text on warning |
| `--accent` | `--blue-50` | `--blue-900` | Accent surface |
| `--accent-foreground` | `--blue-700` | `--blue-400` | Accent text |
| `--popover` | `--white` | `--gray-100-dark` | Popover/dialog bg |
| `--popover-foreground` | `--gray-900` | `--gray-50` | Popover text |

### 1.4 Status Colors

| Status | Token | Usage |
|--------|-------|-------|
| Online | `--success` | Screen online, active schedule |
| Offline | `--destructive` | Screen offline, error |
| Warning | `--warning` | Screen warning, storage near limit |
| Draft | `--muted-foreground` | Playlist draft, inactive |
| Published | `--success` | Playlist published, active |
| Pending | `--warning` | Pending invite, pending action |
| Info | `--primary` | Informational badge, active filter |

### 1.5 Color Usage Rules

- **Primary (`--primary`):** Used for primary CTAs, active states, links, focus rings
- **Secondary (`--secondary`):** Used for secondary actions, ghost buttons, inactive tabs
- **Destructive (`--destructive`):** Used exclusively for destructive actions (delete, remove, revoke)
- **Success (`--success`):** Used for success states, online status, published status
- **Warning (`--warning`):** Used for warnings, pending states, near-limit indicators
- **Muted (`--muted`):** Used for backgrounds, disabled states, subtle surfaces
- **Never** use primitive tokens directly in components — always use semantic tokens
- **Never** hardcode hex values in components — always use CSS variables

---

## 2. Spacing System

### 2.1 Spacing Scale

Based on a 4px base unit. All spacing values are multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | `0` | No spacing |
| `--space-0.5` | `2px` | Minimal gap (icon to label in button) |
| `--space-1` | `4px` | Tight gap (badge padding) |
| `--space-1.5` | `6px` | Small gap (input padding vertical) |
| `--space-2` | `8px` | Default small gap (card padding) |
| `--space-3` | `12px` | Default gap (between form fields) |
| `--space-4` | `16px` | Medium gap (section padding) |
| `--space-5` | `20px` | Large gap (card padding) |
| `--space-6` | `24px` | Section spacing (page padding) |
| `--space-8` | `32px` | Large section spacing |
| `--space-10` | `40px` | Extra large spacing |
| `--space-12` | `48px` | Hero spacing |
| `--space-16` | `64px` | Max section spacing |

### 2.2 Spacing Rules

- Use **only** tokens from the spacing scale — no arbitrary values
- Page padding: `--space-6` (desktop), `--space-4` (tablet), `--space-3` (mobile)
- Card padding: `--space-5` (default), `--space-4` (compact), `--space-6` (large)
- Form field gap: `--space-3` (default), `--space-4` (relaxed)
- Section gap: `--space-6` (default), `--space-8` (large)
- Icon-to-text gap: `--space-0.5` (inline), `--space-2` (block)
- Sidebar item padding: `--space-1.5 --space-3`
- Header padding: `--space-2 --space-4`

---

## 3. Typography System

### 3.1 Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | `Inter, system-ui, -apple-system, sans-serif` | Body text, UI labels, buttons |
| `--font-mono` | `JetBrains Mono, ui-monospace, monospace` | Code, API keys, pairing codes |
| `--font-arabic` | `Cairo, Tajawal, system-ui, sans-serif` | Arabic text (RTL) |

### 3.2 Font Sizes

| Token | Value | Line Height | Weight | Usage |
|-------|-------|-------------|--------|-------|
| `--text-xs` | `12px` | `16px` | 400 | Badge text, timestamp, helper text |
| `--text-sm` | `14px` | `20px` | 400 | Body small, sidebar items, table cells |
| `--text-base` | `16px` | `24px` | 400 | Body default, input text |
| `--text-lg` | `18px` | `28px` | 400 | Section heading, card title |
| `--text-xl` | `20px` | `28px` | 600 | Page subheading |
| `--text-2xl` | `24px` | `32px` | 700 | Page heading (h1) |
| `--text-3xl` | `30px` | `36px` | 700 | Hero heading |
| `--text-4xl` | `36px` | `40px` | 700 | Auth heading, error code |

### 3.3 Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `--font-normal` | `400` | Body text, descriptions |
| `--font-medium` | `500` | Labels, active states, emphasis |
| `--font-semibold` | `600` | Section headings, button text |
| `--font-bold` | `700` | Page headings, hero text |

### 3.4 Typography Rules

- **Page heading (h1):** `--text-2xl --font-bold`
- **Section heading (h2):** `--text-xl --font-semibold`
- **Card title (h3):** `--text-lg --font-semibold`
- **Body text:** `--text-base --font-normal`
- **Labels:** `--text-sm --font-medium`
- **Helper text:** `--text-xs --font-normal --muted-foreground`
- **Button text:** `--text-sm --font-medium`
- **Table header:** `--text-xs --font-medium --muted-foreground` (uppercase)
- **Table cell:** `--text-sm --font-normal`
- **Badge:** `--text-xs --font-medium`
- **Arabic text:** Use `--font-arabic` family; font sizes remain the same

---

## 4. Border Radius System

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-none` | `0` | No rounding (table cells) |
| `--radius-sm` | `4px` | Small elements (badges, tags, inline inputs) |
| `--radius-md` | `6px` | Default (buttons, inputs, dropdowns) |
| `--radius-lg` | `8px` | Cards, panels, list items |
| `--radius-xl` | `12px` | Large cards, auth cards, dialog |
| `--radius-2xl` | `16px` | Hero cards, onboarding cards |
| `--radius-full` | `9999px` | Pills, avatars, toggle switches |

### Radius Rules

- Buttons: `--radius-md`
- Inputs: `--radius-md`
- Cards: `--radius-lg`
- Dialogs: `--radius-xl`
- Badges: `--radius-sm`
- Avatars: `--radius-full`
- Toggle switches: `--radius-full`
- Table cells: `--radius-none`
- Consistent radius within a group (all items in a card use same radius)

---

## 5. Shadow System

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-none` | `none` | Flat elements (table rows, list items) |
| `--shadow-xs` | `0 1px 2px 0 rgba(0,0,0,0.05)` | Subtle elevation (cards default) |
| `--shadow-sm` | `0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)` | Card hover, dropdowns |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)` | Popovers, floating elements |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)` | Dialogs, drawers |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)` | Modals, overlays |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.25)` | Toast (elevated above all) |

### Shadow Rules

- Default card: `--shadow-xs`
- Card hover: `--shadow-sm`
- Dropdown/popover: `--shadow-md`
- Dialog: `--shadow-lg`
- Drawer: `--shadow-lg`
- Toast: `--shadow-2xl`
- Sidebar: `--shadow-none` (border provides separation)
- Header: `--shadow-none` (border provides separation)
- Studio canvas area: `--shadow-none` (dark background, no shadow needed)

---

## 6. Opacity System

| Token | Value | Usage |
|-------|-------|-------|
| `--opacity-0` | `0` | Fully transparent |
| `--opacity-25` | `0.25` | Disabled overlay, subtle background |
| `--opacity-50` | `0.5` | Overlay (dialog backdrop) |
| `--opacity-75` | `0.75` | Strong overlay |
| `--opacity-100` | `1` | Fully opaque |

### Opacity Usage

- Dialog overlay: `bg-black/50` (50% opacity)
- Drawer overlay: `bg-black/50`
- Disabled state: `opacity-50` on element + `cursor-not-allowed`
- Hover surface: `bg-primary/10` (10% primary color)
- Active surface: `bg-primary/15` (15% primary color)
- Selected state: `bg-primary/5` (5% primary color)
- Skeleton shimmer: `opacity-25` to `opacity-50` animation

---

## 7. Elevation System

Elevation combines shadow + z-index to create visual hierarchy.

| Level | Shadow | Z-Index | Usage |
|-------|--------|---------|-------|
| 0 | `--shadow-none` | `0` | Base content, table rows |
| 1 | `--shadow-xs` | `10` | Cards, panels |
| 2 | `--shadow-sm` | `20` | Sticky headers, card hover |
| 3 | `--shadow-md` | `30` | Dropdowns, popovers, tooltips |
| 4 | `--shadow-lg` | `40` | Dialogs, drawers |
| 5 | `--shadow-xl` | `50` | Modals with backdrop |
| 6 | `--shadow-2xl` | `60` | Toast (above everything) |

### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--z-base` | `0` | Normal content flow |
| `--z-sticky` | `20` | Sticky headers, page headers |
| `--z-dropdown` | `30` | Dropdowns, popovers, autocomplete |
| `--z-sidebar` | `35` | Mobile sidebar drawer |
| `--z-overlay` | `40` | Dialog/drawer overlay backdrop |
| `--z-modal` | `50` | Dialog, drawer content |
| `--z-toast` | `60` | Toast notifications |
| `--z-tooltip` | `70` | Tooltips (above all) |

---

## 8. Border System

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-thin` | `1px` | Default borders (cards, inputs, dividers) |
| `--border-width-medium` | `2px` | Focus borders, active indicators |
| `--border-width-thick` | `4px` | Emphasis borders (danger zone) |

### Border Rules

- Card border: `1px solid var(--border)`
- Input border: `1px solid var(--input)`, focus: `2px solid var(--ring)`
- Divider: `1px solid var(--border)`
- Active sidebar item: `2px solid var(--primary)` (left border)
- Danger zone: `1px solid var(--destructive/20)` with `bg-destructive/5`

---

## 9. Cross-References

- See `02-grid-system.md` for grid system built on these foundations
- See `03-layout-system.md` for layout patterns using these tokens
- See `44-design-tokens.md` for the complete token reference
- See `40-token-naming.md` for token naming conventions
- See `audits/frontend/02-design-system-and-tokens.md` for V1 design system (migration source)
- See `ux-blueprint/03-component-ux-standards.md` for component standards using these tokens
- See `product-architecture/17-product-rules.md` PR-45–PR-50 for design rules
