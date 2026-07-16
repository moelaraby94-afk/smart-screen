# 15 — Cards

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `07-motion-system.md`, `ux-blueprint/03-component-ux-standards.md` §3, `screen-specifications/03-overview-spec.md` through `12-admin-specs-part2.md`

---

## Component: Card

### Purpose
Container for grouping related content with visual separation.

### Usage
Widgets, entity cards (Screen, Playlist, Media), form containers, info panels.

### When to Use
- Grouping related information (Screen Health widget, Quick Actions)
- Entity display in grids (ScreenCard, PlaylistCard, MediaCard)
- Form containers (auth, settings)
- Info panels (Screen Info, Playlist Metadata)

### When NOT to Use
- Simple list items (use `ListItem` instead)
- Table rows (use `TableRow` instead)
- Dialogs (use `Dialog` component instead)
- Full-page content (use page layout, not a card)

### Variants

| Variant | Background | Border | Shadow | Radius | Usage |
|---------|-----------|--------|--------|--------|-------|
| `default` | `--card` | `--border` (1px) | `--shadow-xs` | `--radius-lg` | Standard card |
| `elevated` | `--card` | none | `--shadow-sm` | `--radius-lg` | Floating card, popover |
| `outline` | `--card` | `--border-strong` (1px) | none | `--radius-lg` | Emphasized border |
| `interactive` | `--card` | `--border` (1px) | `--shadow-xs` → `--shadow-sm` on hover | `--radius-lg` | Clickable card |
| `danger` | `--destructive/5` | `--destructive/20` (1px) | none | `--radius-lg` | Danger zone |
| `muted` | `--muted` | `--border` (1px) | none | `--radius-lg` | Subtle background |

### Sizes

| Size | Padding | Usage |
|------|---------|-------|
| `compact` | `--space-3` (12px) | Dense grids, media cards |
| `default` | `--space-5` (20px) | Standard cards, widgets |
| `large` | `--space-6` (24px) | Auth cards, onboarding, settings |
| `none` | 0 | Card with internal padding control |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | Per variant | — |
| Hover (interactive) | `--shadow-sm`, border `--border-strong` | MI-01 (150ms) |
| Selected | `--primary/5` bg, `--primary` border (2px) | Instant |
| Disabled | `opacity-50` | Instant |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `default \| elevated \| outline \| interactive \| danger \| muted` | `default` | Visual variant |
| `size` | `compact \| default \| large \| none` | `default` | Internal padding |
| `selected` | `boolean` | `false` | Selected state |
| `onClick` | `() => void` | — | Click handler (makes card interactive) |
| `children` | `ReactNode` | — | Card content |

### Sub-Components

#### CardHeader
- **Padding:** `--space-5` (default), bottom border `--border`
- **Contents:** Title (h3), optional subtitle, optional action

#### CardTitle
- **Styling:** `--text-lg --font-semibold --card-foreground`

#### CardDescription
- **Styling:** `--text-sm --font-normal --muted-foreground`

#### CardContent
- **Padding:** `--space-5` (default)
- **Contents:** Main card body

#### CardFooter
- **Padding:** `--space-5`, top border `--border`
- **Contents:** Actions, buttons

### Spacing
- Internal padding: Per size
- Card grid gap: `--space-4` (16px)
- Section gap within card: `--space-3` (12px)

### Responsive Behavior
- Desktop: Grid per `02-grid-system.md`
- Mobile: Full width, single column
- Padding remains consistent across breakpoints

### Accessibility
- Interactive card: `role="button"`, `aria-label` with descriptive text
- Non-interactive card: `role="region"` with `aria-label` (for widgets)
- Focus: `ring-2 ring-ring ring-offset-2` on `focus-visible` (interactive only)
- Keyboard: `Enter` activates interactive card

### Keyboard Behavior
| Key | Action | Condition |
|-----|--------|-----------|
| `Enter` | Activate card | Interactive (onClick) |
| `Tab` | Focus card | Interactive only |

### Animations
- Hover (interactive): MI-01 (150ms, shadow + border)
- Mount: MI-08 (300ms, fade in up) — for grid items
- Remove: MI-09 (150ms, fade out + scale)

### Anti-Patterns
- **Card inside a card** — use sections within a card instead
- **Interactive card without `aria-label`** — accessibility violation
- **Card with no padding control** — always specify size
- **Mixed variants in same grid** — all cards in a grid should have same variant
- **Card as a link** — use `role="button"` with onClick, not `<a>` wrapping card

### Acceptance Criteria
- [ ] All 6 variants render with correct colors, borders, shadows
- [ ] All 4 sizes render with correct padding
- [ ] Interactive card shows hover shadow (150ms)
- [ ] Selected card shows `--primary/5` bg and 2px border
- [ ] Interactive card has `role="button"` and `aria-label`
- [ ] Focus ring visible on keyboard navigation
- [ ] `Enter` activates interactive card
- [ ] No layout shift on hover (shadow only, no size change)

### Future Scalability
- `collapsible` variant (expand/collapse with animation)
- `headerSticky` prop (sticky header within scrollable card)
- `divider` prop (show/hide dividers between sections)

---

## Component: Badge

### Purpose
Small status indicator or label.

### Variants

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| `default` | `--primary/10` | `--primary` | Active, info |
| `success` | `--success/10` | `--success` | Online, published |
| `warning` | `--warning/10` | `--warning` | Pending, warning |
| `destructive` | `--destructive/10` | `--destructive` | Offline, error |
| `muted` | `--muted` | `--muted-foreground` | Draft, inactive |

### Size
- Height: 20px
- Padding: `--space-0.5 --space-2`
- Font: `--text-xs --font-medium`
- Radius: `--radius-sm`

### Props
| Prop | Type | Default |
|------|------|---------|
| `variant` | `default \| success \| warning \| destructive \| muted` | `default` |
| `children` | `ReactNode` | — |
| `icon` | `LucideIcon` | — |
| `dot` | `boolean` | `false` |

### Dot Variant
- Small colored circle (6px) before text
- Color matches variant color
- Usage: Status indicators (online dot, offline dot)

---

## Component: Avatar

### Purpose
User profile image or initials.

### Sizes
| Size | Dimensions | Usage |
|------|-----------|-------|
| `sm` | 24px | Table rows, inline |
| `md` | 32px | Member rows, comments |
| `lg` | 40px | User menu, header |
| `xl` | 80px | Profile settings |

### Props
| Prop | Type | Default |
|------|------|---------|
| `src` | `string` | — |
| `alt` | `string` | — |
| `fallback` | `string` (initials) | — |
| `size` | `sm \| md \| lg \| xl` | `md` |

### Fallback
- If no image: show initials in `--primary` bg with `--primary-foreground` text
- If image fails: show initials
- Radius: `--radius-full` (round)

---

## Cross-References

- See `01-foundations.md` for color, radius, shadow tokens
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for MI-08, MI-09
- See `32-screen-cards.md` for ScreenCard domain component
- See `33-playlist-components.md` for PlaylistCard domain component
- See `34-media-components.md` for MediaCard domain component
- See `ux-blueprint/03-component-ux-standards.md` §3 for card standards
