# 32 — Screen Cards

> **Evidence basis:** `15-cards.md`, `09-interaction-states.md`, `07-motion-system.md`, `screen-specifications/04-screens-specs.md` SCR-SC-01, `ux-blueprint/06-screens-ux-rules.md`

---

## Component: ScreenCard

### Purpose
Display a single screen entity in a grid with status, name, and actions.

### Usage
Screens List page grid.

### Structure
```
<ScreenCard
  screen={screen}
  onClick={() => navigate(`/screens/${screen.id}`)}
  onMenuAction={handleMenuAction}
  selected={selectedIds.includes(screen.id)}
/>
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="interactive"`, `--radius-lg` |
| Thumbnail | 16:9 aspect ratio, top section of card |
| Thumbnail placeholder | `--muted` bg with `Monitor` icon (24px, `--muted-foreground`) |
| Status dot | 8px circle, top-right of thumbnail |
| Status overlay | (Future) Live screenshot of screen |
| Name | `--text-sm --font-medium --foreground`, `truncate` |
| Location | `--text-xs --muted-foreground` |
| Status badge | Below name (Online/Offline/Warning) |
| "More" menu | `MoreHorizontal` icon, top-right (appears on hover) |
| Checkbox | Top-left (bulk selection mode only) |

### States
| State | Visual |
|-------|--------|
| Default | `--shadow-xs` |
| Hover | `--shadow-sm`, "More" menu appears (MI-01, 150ms) |
| Selected | `--primary/5` bg, `--primary` border (2px) |
| Offline | Status dot `--destructive`, badge "Offline" |
| Online | Status dot `--success`, badge "Online" |
| Warning | Status dot `--warning`, badge "Warning" |
| Pairing | Status dot `--warning`, badge "Pairing" |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `screen` | `Screen` | Screen entity |
| `onClick` | `() => void` | Card click handler |
| `onMenuAction` | `(action, id) => void` | Menu action handler |
| `selected` | `boolean` | Selection state |
| `selectable` | `boolean` | Show checkbox |
| `showMenu` | `boolean` | Show "More" menu |

### "More" Menu Actions
| Action | Icon | Behavior |
|--------|------|----------|
| Edit | `Pencil` | Navigate to Screen Detail |
| Rename | `Edit` | Inline edit name (future) |
| Reboot | `RefreshCw` | (Future) Reboot device |
| Delete | `Trash2` | Open AlertDialog |

### Accessibility
- `role="button"`, `aria-label="[Name], [Status], [Location]"`
- Focus: `ring-2 ring-ring ring-offset-2`
- Keyboard: `Enter` to open, `Tab` to menu

### Animations
- Hover: MI-01 (150ms, shadow + menu appear)
- Mount: MI-08 (300ms, fade in up) with stagger
- Remove: MI-09 (150ms, fade out + scale)

---

## Component: BulkActionBar

### Purpose
Sticky action bar that appears when screens are selected in bulk.

### Usage
Screens List (bulk selection mode).

### Structure
```
<BulkActionBar
  selectedCount={selectedIds.length}
  onSelectAll={handleSelectAll}
  onClearSelection={handleClearSelection}
  actions={[
    { label: "Assign Playlist", icon: Send, onClick: handleAssign },
    { label: "Delete", icon: Trash2, onClick: handleDelete, variant: "destructive" }
  ]}
/>
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | `--card` bg, `--shadow-md`, `--radius-lg` |
| Position | Sticky bottom or top of grid |
| Padding | `--space-3 --space-4` |
| Layout | `flex items-center gap-3` |
| Count | `--text-sm --font-medium` ("3 selected") |
| Actions | Buttons (outline or destructive) |
| Clear | "Clear" ghost button (right side) |

### States
| State | Visual |
|-------|--------|
| 1 selected | Count + actions |
| Multiple selected | Count + "Select All" + actions |
| 0 selected | Hidden |

### Accessibility
- `role="toolbar"`, `aria-label="Bulk actions"`
- Count: `aria-live="polite"` (announces selection changes)

---

## Component: StatusBadge

### Purpose
Badge showing screen status (Online, Offline, Warning, Pairing, Draft, Published).

### Variants
| Status | Badge Variant | Dot Color | Text |
|--------|--------------|-----------|------|
| Online | `success` | `--success` | "Online" |
| Offline | `destructive` | `--destructive` | "Offline" |
| Warning | `warning` | `--warning` | "Warning" |
| Pairing | `warning` | `--warning` | "Pairing" |
| Draft | `muted` | — | "Draft" |
| Published | `success` | `--success` | "Published" |

### Visual
- Badge: Per `15-cards.md` Badge component
- Dot: 6px circle before text (if `dot` prop is true)
- Font: `--text-xs --font-medium`

---

## Cross-References

- See `15-cards.md` for Card and Badge components
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for MI-01, MI-08, MI-09
- See `screen-specifications/04-screens-specs.md` for Screens List spec
- See `ux-blueprint/06-screens-ux-rules.md` for screen UX rules
