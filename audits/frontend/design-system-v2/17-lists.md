# 17 — Lists

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `ux-blueprint/03-component-ux-standards.md` §3, `screen-specifications/04-screens-specs.md` (Active Content), `screen-specifications/08-team-spec.md`, `screen-specifications/11-notifications-admin-specs-part1.md`

---

## Component: List

### Purpose
Display a collection of items in a vertical sequence.

### Usage
Notification list, team members, active schedules, recent activity, media items in playlist, assigned screens.

### When to Use
- Vertical sequence of items with consistent structure
- Items have 2-4 fields (icon + title + subtitle + action)
- Items are not tabular (don't need column alignment)

### When NOT to Use
- Tabular data with many columns (use Table)
- Visual content with thumbnails in a grid (use Card grid)
- Hierarchical data (use Tree — future)
- Very simple single-line items (use plain text with dividers)

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard list with dividers |
| `compact` | Dense list (notifications, activity) |
| `card` | List items as mini-cards (team members) |

### Structure

```
<List>
  <ListItem>
    <ListItemAvatar / Icon />
    <ListItemContent>
      <ListItemTitle />
      <ListItemSubtitle />
    </ListItemContent>
    <ListItemAction />
  </ListItem>
</List>
```

### Sizes

| Size | Row Height | Padding | Gap |
|------|-----------|---------|-----|
| `default` | 56px | `--space-3` | `--space-3` |
| `compact` | 44px | `--space-2` | `--space-2` |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | `--card` bg, `--border` bottom divider | — |
| Hover | `--muted/50` bg | MI-01 (150ms) |
| Selected | `--primary/5` bg | Instant |
| Loading | Skeleton rows | MI-12 |
| Empty | EmptyState | — |

### Props (List)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `T[]` | — | Array of items |
| `renderItem` | `(item) => ReactNode` | — | Item renderer |
| `size` | `default \| compact` | `default` | Row density |
| `divided` | `boolean` | `true` | Show dividers between items |
| `loading` | `boolean` | `false` | Loading state |
| `empty` | `ReactNode` | — | Empty state |
| `onItemClick` | `(item) => void` | — | Item click handler |

### Sub-Components

#### ListItem
- Layout: `flex items-center gap-3`
- Padding: Per size
- Border: `--border` (bottom, 1px) if `divided`
- Hover: `--muted/50` bg if clickable
- Click: `cursor-pointer` if `onItemClick`

#### ListItemIcon
- Size: 18px (`--icon-md`)
- Color: `--muted-foreground` (default), `--primary` (active)
- Position: Left

#### ListItemAvatar
- Size: 32px (`Avatar` size `md`)
- Position: Left

#### ListItemContent
- Layout: `flex-1 flex flex-col`
- Gap: `--space-0.5`

#### ListItemTitle
- Font: `--text-sm --font-medium --foreground`
- Truncation: `truncate` (single line)

#### ListItemSubtitle
- Font: `--text-xs --font-normal --muted-foreground`
- Truncation: `truncate` (single line)

#### ListItemAction
- Position: Right
- Contents: Button, badge, timestamp, "More" menu
- Font (timestamp): `--text-xs --muted-foreground`

### Responsive Behavior
- Desktop: Full layout (icon + content + action)
- Mobile: Same layout, full width
- Action: May shift to icon-only on mobile

### Accessibility
- List: `role="list"`
- List item: `role="listitem"` (or `role="button"` if clickable)
- Clickable item: `aria-label` with descriptive text
- Keyboard: `Tab` through items, `Enter` to activate

### Keyboard Behavior
| Key | Action | Condition |
|-----|--------|-----------|
| `Tab` | Move to next item | Always |
| `Enter` | Activate item | Clickable item |
| `Shift+Tab` | Move to previous item | Always |

### Animations
- Hover: MI-01 (150ms, background)
- Mount: MI-08 (300ms, fade in up) with stagger (MI-20, 50ms delay)
- Remove: MI-09 (150ms, fade out)

### Loading
- Skeleton rows: 5-8 rows with gray bars (avatar circle + text bars)
- Shimmer: MI-12

### Empty
- EmptyState: "No [items]" + icon + optional CTA

### Error
- ErrorState: "Failed to load [items]" + "Retry"

### Anti-Patterns
- **List with too many fields per item** — use Table instead
- **List without dividers for dense data** — dividers help scan-ability
- **Clickable item without `aria-label`** — accessibility violation
- **List items with varying heights** — maintain consistent item height
- **No loading state** — always show skeleton during fetch

### Acceptance Criteria
- [ ] List renders items vertically with dividers
- [ ] Item hover shows `--muted/50` background (150ms)
- [ ] Clickable items have `role="button"` and `aria-label`
- [ ] Skeleton loading during data fetch
- [ ] Empty state when no items
- [ ] Title truncates with `truncate`
- [ ] Subtitle uses `--muted-foreground`
- [ ] Action positioned on right
- [ ] Keyboard: Tab through items, Enter to activate

### Future Scalability
- Virtual scrolling for large lists (> 100 items)
- Drag-and-drop reordering
- Swipe action on mobile (swipe left to delete)
- Group headers (sticky group labels)
- Infinite scroll option

---

## Cross-References

- See `01-foundations.md` for color and spacing tokens
- See `09-interaction-states.md` for state definitions
- See `18-empty-states.md` for empty state
- See `19-loading-states.md` for skeleton
- See `ux-blueprint/03-component-ux-standards.md` §3 for list standards
