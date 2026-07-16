# 05 — Reusable UI Component Library

> **Source basis:** All files in `src/components/ui/`  

---

## 5.1 Component Inventory

| Component | File | Built On | Props |
|-----------|------|----------|-------|
| Button | `button.tsx` | CVA + Radix Slot | variant, size, asChild |
| Card | `card.tsx` | Raw HTML | — |
| Dialog | `dialog.tsx` | Radix Dialog | — |
| Input | `input.tsx` | Raw HTML | — |
| Select | `select.tsx` | Radix Select | — |
| Table | `table.tsx` | Raw HTML | — |
| Tabs | `tabs.tsx` | Radix Tabs | — |
| Badge | `badge.tsx` | CVA | variant |
| Checkbox | `checkbox.tsx` | Radix Checkbox | — |
| Switch | `switch.tsx` | Radix Switch | — |
| Label | `label.tsx` | Raw HTML | — |
| AlertDialog | `alert-dialog.tsx` | Radix AlertDialog | — |
| DropdownMenu | `dropdown-menu.tsx` | Radix DropdownMenu | — |
| EmptyState | `empty-state.tsx` | Raw HTML | icon, title, description, action |
| Skeleton | `skeleton.tsx` | Raw HTML | className |
| SkeletonPatterns | `skeleton-patterns.tsx` | Skeleton | count, rows, cols |
| InfoTooltip | `info-tooltip.tsx` | Raw HTML + state | content, side |

---

## 5.2 Button (`src/components/ui/button.tsx`)

### Variants (CVA)
| Variant | Classes | Visual |
|---------|---------|--------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` | Orange filled |
| `cta` | `bg-primary text-white shadow-sm hover:bg-primary/90 shadow-primary/20` | Orange filled with glow |
| `secondary` | `bg-muted text-foreground hover:bg-muted/80` | Gray filled |
| `ghost` | `hover:bg-muted hover:text-foreground` | Transparent |
| `outline` | `border border-border bg-background hover:bg-muted` | Bordered |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` | Red filled |

### Sizes
| Size | Classes |
|------|---------|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 px-3` |
| `lg` | `h-12 px-8` |
| `icon` | `h-10 w-10` |

### Base Classes
```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl
text-sm font-medium transition-colors
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-background
disabled:pointer-events-none disabled:opacity-50
```

### Polymorphic Rendering
Supports `asChild` prop — passes all props to child element via Radix `Slot`. Used for rendering buttons as `<Link>` or `<a>` tags.

---

## 5.3 Card (`src/components/ui/card.tsx`)

### Sub-components
| Component | Classes |
|-----------|---------|
| `Card` | `rounded-xl border border-border bg-card text-card-foreground shadow-sm` |
| `CardHeader` | `flex flex-col space-y-1.5 p-6` |
| `CardTitle` | `text-lg font-semibold leading-none tracking-tight` |
| `CardDescription` | `text-sm text-muted-foreground` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `flex items-center p-6 pt-0` |

All sub-components use `React.forwardRef` and `data-slot` attributes.

---

## 5.4 Dialog (`src/components/ui/dialog.tsx`)

### Sub-components
| Component | Radix Primitive | Key Classes |
|-----------|----------------|-------------|
| `Dialog` | `Root` | — |
| `DialogTrigger` | `Trigger` | — |
| `DialogContent` | `Content` | `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg z-[111]` |
| `DialogOverlay` | `Overlay` | `fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm` |
| `DialogClose` | `Close` | — |
| `DialogTitle` | `Title` | `text-lg font-semibold text-foreground` |
| `DialogDescription` | `Description` | `text-sm text-muted-foreground` |
| `DialogHeader` | — | `flex flex-col space-y-1.5` |
| `DialogFooter` | — | `flex flex-col-reverse sm:flex-row sm:justify-end gap-2` |

### Close Button
`DialogContent` includes a close button (X icon) in the top-end corner:
```
absolute end-4 top-4 rounded-md p-1 text-muted-foreground opacity-70 hover:opacity-100
```

### Accessibility
- Radix handles focus trapping, ESC to close, click-outside to close
- `DialogTitle` and `DialogDescription` linked via `aria-labelledby` and `aria-describedby`
- `DialogClose` has `aria-label="Close"`

---

## 5.5 Input (`src/components/ui/input.tsx`)

### Classes
```
flex h-10 w-full rounded-xl border border-border bg-card px-3 py-2
text-sm text-foreground placeholder:text-muted-foreground/50
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2 focus-visible:ring-offset-background
disabled:cursor-not-allowed disabled:opacity-50
```

Uses `React.forwardRef`. No custom props beyond standard input attributes.

---

## 5.6 Select (`src/components/ui/select.tsx`)

### Sub-components
| Component | Radix Primitive | Key Classes |
|-----------|----------------|-------------|
| `Select` | `Root` | — |
| `SelectTrigger` | `Trigger` | `flex h-9 w-full items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-sm focus:ring-2 focus:ring-ring` |
| `SelectContent` | `Content` | `relative z-[120] max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card shadow-md` |
| `SelectItem` | `Item` | `relative flex w-full cursor-pointer select-none items-center rounded-lg py-1.5 pl-8 pr-2 text-sm focus:bg-muted` |
| `SelectLabel` | `Label` | `px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground` |
| `SelectSeparator` | `Separator` | `-mx-1 my-1 h-px bg-border` |
| `SelectGroup` | `Group` | — |
| `SelectScrollUpButton` | `ScrollUpButton` | `flex cursor-default items-center justify-center py-1` |
| `SelectScrollDownButton` | `ScrollDownButton` | `flex cursor-default items-center justify-center py-1` |

### Selected Item Indicator
`SelectItem` includes a `Check` icon (Lucide) shown when item is selected, positioned at `absolute start-2`.

### Viewport
`SelectViewport` uses `SelectPrimitive.Viewport` with `p-1` padding.

---

## 5.7 Table (`src/components/ui/table.tsx`)

### Sub-components
| Component | Key Classes |
|-----------|-------------|
| `Table` | `w-full caption-bottom` |
| `TableHeader` | `border-b border-border` |
| `TableBody` | `[&_tr:last-child]:border-0` |
| `TableRow` | `border-b border-border transition-colors hover:bg-muted/30` |
| `TableHead` | `h-10 px-3 text-left align-middle font-semibold text-muted-foreground rtl:text-right` |
| `TableCell` | `p-3 align-middle` |

All use `React.forwardRef` and `data-slot` attributes.

---

## 5.8 Tabs (`src/components/ui/tabs.tsx`)

### Sub-components
| Component | Radix Primitive | Key Classes |
|-----------|----------------|-------------|
| `Tabs` | `Root` | — |
| `TabsList` | `List` | `inline-flex h-9 items-center justify-center rounded-xl bg-muted p-1` |
| `TabsTrigger` | `Trigger` | `inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1 text-sm font-medium data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring` |
| `TabsContent` | `Content` | `mt-2 focus-visible:outline-none` |

---

## 5.9 Badge (`src/components/ui/badge.tsx`)

### Variants (CVA)
| Variant | Classes |
|---------|---------|
| `default` | `bg-primary/10 text-primary border-primary/20` |
| `muted` | `bg-muted text-muted-foreground border-border` |
| `success` | `bg-emerald-500/10 text-emerald-600 border-emerald-500/20` |
| `online` | `bg-emerald-500/15 text-emerald-600 border-emerald-500/30` |
| `warning` | `bg-amber-500/10 text-amber-600 border-amber-500/20` |
| `danger` | `bg-red-500/10 text-red-600 border-red-500/20` |

### Base Classes
```
inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
text-xs font-semibold transition-colors
```

---

## 5.10 Checkbox (`src/components/ui/checkbox.tsx`)

Built on `Radix Checkbox`:
- Size: `h-4 w-4`
- Border: `border border-primary`
- Radius: `rounded-sm`
- Checked: `bg-primary text-primary-foreground`
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Indicator: `Lucide Check` at `h-3 w-3`
- Disabled: `disabled:cursor-not-allowed disabled:opacity-50`

---

## 5.11 Switch (`src/components/ui/switch.tsx`)

Built on `Radix Switch`:
- Track: `h-5 w-9 rounded-full border border-border`
- Unchecked: `bg-muted`
- Checked: `bg-primary` (via `data-[state=checked]:bg-primary`)
- Thumb: `h-4 w-4 rounded-full bg-white shadow-sm` with `transition-transform`
- Checked thumb position: `data-[state=checked]:translate-x-4` (LTR) — note: this may not have RTL-specific translate
- Focus: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

---

## 5.12 Label (`src/components/ui/label.tsx`)

```
text-sm font-medium leading-none text-foreground
peer-disabled:cursor-not-allowed peer-disabled:opacity-70
```

Uses `React.forwardRef`.

---

## 5.13 AlertDialog (`src/components/ui/alert-dialog.tsx`)

### Sub-components
| Component | Radix Primitive | Key Classes |
|-----------|----------------|-------------|
| `AlertDialog` | `Root` | — |
| `AlertDialogTrigger` | `Trigger` | — |
| `AlertDialogContent` | `Content` | `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg z-[111]` |
| `AlertDialogOverlay` | `Overlay` | `fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm` |
| `AlertDialogTitle` | `Title` | `text-lg font-semibold` |
| `AlertDialogDescription` | `Description` | `text-sm text-muted-foreground` |
| `AlertDialogHeader` | — | `flex flex-col space-y-2` |
| `AlertDialogFooter` | — | `flex flex-col-reverse sm:flex-row sm:justify-end gap-2` |
| `AlertDialogCancel` | `Cancel` | `buttonVariants({ variant: 'outline' })` |
| `AlertDialogAction` | `Action` | `buttonVariants({ variant: 'destructive' })` |

### Accessibility
- Radix handles focus trapping, ESC prevention (alert dialog does not close on ESC by default)
- `aria-labelledby` and `aria-describedby` linked

---

## 5.14 DropdownMenu (`src/components/ui/dropdown-menu.tsx`)

### Sub-components
| Component | Radix Primitive | Key Classes |
|-----------|----------------|-------------|
| `DropdownMenu` | `Root` | — |
| `DropdownMenuTrigger` | `Trigger` | — |
| `DropdownMenuContent` | `Content` | `z-[120] min-w-[8rem] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-md` |
| `DropdownMenuItem` | `Item` | `relative flex cursor-pointer select-none items-center rounded-lg px-2.5 py-1.5 text-sm outline-none focus:bg-muted data-[disabled]:opacity-50` |
| `DropdownMenuLabel` | `Label` | `px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground` |
| `DropdownMenuSeparator` | `Separator` | `-mx-1 my-1 h-px bg-border` |
| `DropdownMenuGroup` | `Group` | — |

---

## 5.15 EmptyState (`src/components/ui/empty-state.tsx`)

### Props
| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `icon` | `LucideIcon` | Yes | Icon component |
| `title` | `string` | Yes | Title text |
| `description` | `string` | No | Description text |
| `action` | `ReactNode` | No | Action button/element |

### Layout
```tsx
<div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
    <Icon className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
  </div>
  <div className="space-y-1">
    <p className="text-sm font-semibold text-foreground">{title}</p>
    {description && <p className="text-sm text-muted-foreground">{description}</p>}
  </div>
  {action}
</div>
```

---

## 5.16 Skeleton (`src/components/ui/skeleton.tsx`)

```
animate-pulse rounded-md bg-muted
```

Accepts `className` prop for custom sizing.

---

## 5.17 SkeletonPatterns (`src/components/ui/skeleton-patterns.tsx`)

### Pre-built Patterns

| Pattern | Props | Layout |
|---------|-------|--------|
| `TableSkeleton` | `rows` (default 5), `cols` (default 4) | Table with skeleton rows and columns |
| `CardGridSkeleton` | `count` (default 4) | Grid of skeleton cards (responsive: 1/2/4 cols) |
| `ListSkeleton` | `count` (default 5) | Vertical list of skeleton rows |

All patterns use the `Skeleton` component internally.

---

## 5.18 InfoTooltip (`src/components/ui/info-tooltip.tsx`)

### Props
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `content` | `ReactNode` | — | Tooltip content |
| `side` | `'top' \| 'bottom'` | `'top'` | Tooltip position |
| `iconClassName` | `string` | — | Custom icon classes |

### Behavior
- Shows `Info` icon (Lucide) as a button
- Tooltip appears on hover, focus, or click
- Managed by internal state (`isVisible`)
- Closes on outside click (via `useEffect` with document click listener)
- Accessible: `aria-label`, `aria-expanded`

### Rendering
```tsx
<button
  type="button"
  aria-label={ariaLabel}
  aria-expanded={isVisible}
  onClick={() => setIsVisible(v => !v)}
  onMouseEnter={() => setIsVisible(true)}
  onMouseLeave={() => setIsVisible(false)}
  onFocus={() => setIsVisible(true)}
  onBlur={() => setIsVisible(false)}
>
  <Info className="h-4 w-4" />
</button>
{isVisible && (
  <div className={cn('absolute z-[200] ...', side === 'top' ? 'bottom-full' : 'top-full')}>
    {content}
  </div>
)}
```

---

## 5.19 App Dropdown Styles (`src/components/ui/app-dropdown-styles.ts`)

Shared CSS class tokens used by `WorkspaceSwitcher` and filter dropdowns:

### Trigger
```
flex h-9 items-center gap-2 rounded-xl border border-border bg-card px-3
text-sm text-foreground transition hover:bg-muted/40
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
disabled:pointer-events-none disabled:opacity-50
```

### Content
```
min-w-[12rem] rounded-xl border border-border bg-card p-1.5 shadow-lg
```

---

## 5.20 [V2] HCI & Micro-UX Analysis

### Button Component — HCI Evaluation

**[V2] Variant Hierarchy:**
The button system has 6 variants but no explicit priority documentation. The intended hierarchy (inferred from usage patterns):
1. `cta` — Primary call-to-action (orange with glow shadow)
2. `default` — Standard primary action (orange, no glow)
3. `destructive` — Dangerous irreversible action (red)
4. `secondary` — Alternative action (gray)
5. `outline` — Secondary action with border
6. `ghost` — Tertiary/actionless action

**[V2] UX Observation — `cta` vs `default` Confusion:**
Both `cta` and `default` are orange-filled. The only difference is `cta` has `shadow-sm shadow-primary/20` (a subtle glow). This distinction is very subtle and may not be perceivable to all users. Using both variants on the same page could confuse users about which action is the true primary.

**[V2] Size Consistency:**
- `default`: `h-10` (40px) — meets WCAG 2.5.5 minimum touch target
- `sm`: `h-9` (36px) — below 44px minimum for touch
- `lg`: `h-12` (48px) — exceeds minimum, good for primary CTAs
- `icon`: `h-10 w-10` (40×40px) — square, below 44px for touch

**[V2] Disabled State:**
`disabled:pointer-events-none disabled:opacity-50` — pointer-events-none means the disabled button doesn't show a cursor or respond to hover. The 50% opacity is a strong visual signal. However, `pointer-events-none` also prevents tooltip-on-hover for disabled buttons, which could hide important context about why the button is disabled.

### Dialog Component — Micro-UX

**[V2] Close Button Position:**
`absolute end-4 top-4` — positioned in the top-end corner. In RTL, `end-4` becomes right-to-left flipped (appears on left). This is correct for RTL.

**[V2] Z-Index Stack:**
- Overlay: `z-[110]`
- Content: `z-[111]`
This is above the sidebar (`z-[82]`) and header (`z-[55]`) but below the skip link (`z-[200]`). The skip link remains accessible even when a dialog is open — this is correct for accessibility.

**[V2] Dialog Footer Layout:**
`flex flex-col-reverse sm:flex-row sm:justify-end gap-2` — on mobile, buttons are stacked in reverse order (primary at top). On desktop, buttons are in a row at the end side. The `flex-col-reverse` means the visually first button (cancel) appears at the bottom on mobile, which is the standard mobile pattern (primary action closest to thumb).

### InfoTooltip — Accessibility Concerns

**[V2] Custom Implementation vs Radix Tooltip:**
The `InfoTooltip` is a custom implementation using internal state (`isVisible`) and manual event handlers. It does NOT use Radix Tooltip primitive. This has several implications:
- **No focus trap**: The tooltip doesn't trap focus, which is fine for tooltips but means keyboard users can tab away while it's open.
- **No `role="tooltip"`**: The tooltip div lacks `role="tooltip"` attribute, which screen readers rely on to identify tooltip content.
- **No `aria-describedby` linkage**: The trigger button has `aria-expanded` but doesn't link to the tooltip content via `aria-describedby`.
- **Outside click handling**: Uses a `useEffect` with `document` click listener — this works but can conflict with other outside-click handlers.
- **No delay**: Shows immediately on hover/focus, no show/hide delay. This can cause flicker when moving mouse across multiple tooltips.

### Switch Component — RTL Issue

**[V2] RTL Translate Issue:**
The switch thumb uses `data-[state=checked]:translate-x-4` for the checked position. In RTL, `translate-x-4` still moves right (positive X), but the thumb should move left. The `translate-x` utility is NOT logical-property-aware in Tailwind. This means in RTL, the checked switch thumb moves in the wrong direction — it moves right instead of left.

This is a confirmed RTL bug. The fix would be to use `rtl:-translate-x-4` or use logical transform properties.

### Table Component — RTL Support

**[V2] RTL Alignment:**
`TableHead` uses `text-left ... rtl:text-right` — correct logical alignment. `TableCell` uses `align-middle` without explicit text alignment, inheriting from parent. This is correct — table cells should inherit alignment from the column header.

### Badge Component — Semantic Color Mapping

**[V2] Color Semantics:**
| Variant | Color | Semantic Meaning |
|---------|-------|-----------------|
| `default` | Primary (orange) | Brand-related, neutral status |
| `muted` | Gray | Inactive, pending, neutral |
| `success` | Emerald | Positive, completed, active |
| `online` | Emerald (stronger) | Realtime online status |
| `warning` | Amber | Caution, approaching limit |
| `danger` | Red | Error, expired, critical |

The `online` variant is a stronger emerald (`bg-emerald-500/15` vs `bg-emerald-500/10`) — visually distinguishing realtime status from general success. This is a good micro-UX decision.

### EmptyState Component — UX Best Practice

**[V2] Empty State Pattern:**
The `EmptyState` component follows the standard empty state pattern:
- Icon in tinted container (visual anchor)
- Title (what's missing)
- Description (why it matters)
- Optional action (what to do next)

The icon container is `h-12 w-12 rounded-xl bg-muted` — a rounded square, not a circle. This is consistent with the design system's use of `rounded-xl` throughout. The icon uses `strokeWidth={1.5}` which is the standard `ICON_STROKE` value.

**[V2] Missing Variants:**
There is no `variant` prop for different empty state types (e.g., search no results, error state, first-time use). All empty states look the same regardless of context. Enterprise SaaS typically differentiates between "no data yet" (encouraging) and "no results found" (informational) and "error" (alarming).

### SkeletonPatterns — Loading UX

**[V2] Skeleton Fidelity:**
- `TableSkeleton`: Renders `rows` × `cols` skeleton cells in a table layout. Good for matching the actual table structure.
- `CardGridSkeleton`: Renders `count` cards in a responsive grid (1/2/4 columns). Matches the common card grid pattern.
- `ListSkeleton`: Renders `count` rows. Generic enough for most list views.

**[V2] Missing Patterns:**
- No `FormSkeleton` — forms typically have labels, inputs, and buttons that could be skeletonized
- No `DashboardSkeleton` — the dashboard has a complex layout (hero, stats, cards, feed) that needs a dedicated skeleton
- No `DetailSkeleton` — detail pages (screen detail, branch detail) have unique layouts

### [V2] Component Library Gaps

**[V2] Missing Components:**
The component library is minimal (17 components). Notable missing components for an enterprise SaaS:
- **Toast/Notification**: Uses `sonner` directly, no wrapper component
- **Avatar**: No avatar component — user menu likely uses custom implementation
- **Tooltip**: `InfoTooltip` is custom, not using Radix Tooltip
- **Popover**: No popover component for rich content tooltips
- **Command**: No command palette component (GlobalSearch is custom)
- **Calendar**: No calendar component (schedules feature needs one)
- **DatePicker**: No date picker (schedules, analytics need date ranges)
- **Progress**: No progress bar component (onboarding uses custom)
- **Accordion**: No accordion component (settings could benefit)
- **ScrollArea**: No custom scroll area (uses `vc-scrollbar` CSS class instead)
- **Separator**: No separator component (uses `border-b` directly)
- **RadioGroup**: No radio group component (settings may need)

### Cross-References
- See `02-design-system-and-tokens.md` for design tokens and CSS variables
- See `23-error-handling-and-states.md` for error/empty/loading state patterns
- See `24-accessibility-audit.md` for component-level accessibility evaluation
- See `26-consistency-audit.md` for component usage consistency across features
