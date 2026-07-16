# 26 — Search Components

> **Evidence basis:** `13-input-specifications.md`, `09-interaction-states.md`, `07-motion-system.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/04-screens-specs.md` through `12-admin-specs-part2.md`

---

## Component: SearchInput

### Purpose
Text input for searching/filtering data with debounced server-side or client-side search.

### Usage
- Screens list search
- Playlists search
- Media search
- Admin tables search (Customers, Users, Workspaces, Fleet, Logs)
- Team member search (future)
- Studio media library search

### When to Use
- Any list/table with > 10 items
- Server-side filtering with search query
- Client-side filtering for small datasets

### When NOT to Use
- Global search (use GlobalSearch component — future)
- Filtering by predefined options (use FilterSelect)
- Sorting (use SortSelect)

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard search input with icon |
| `inline` | Compact search in toolbar |
| `expanded` | Expandable search (icon → input on click) — future |

### Structure
```
<SearchInput
  value={search}
  onChange={setSearch}
  placeholder="Search screens..."
  onClear={handleClear}
/>
```

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Container | `relative` | — |
| Input | Standard Input with left icon | `13-input-specifications.md` |
| Left icon | `Search` (16px, `--muted-foreground`) | `--icon-sm` |
| Clear button | `X` (16px, `--muted-foreground`), right side | — |
| Placeholder | "Search [items]..." | `--muted-foreground` |
| Width | `flex-1` (toolbar) or fixed `w-64` | — |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | `--input` border, `--card` bg, search icon | — |
| Focus | `--ring` border (2px) | Instant |
| Typing | Clear button (X) appears on right | MI-08 (150ms) |
| Empty | Clear button hidden | — |
| Disabled | `opacity-50` | Instant |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Search query |
| `onChange` | `(value) => void` | — | Change handler |
| `onClear` | `() => void` | — | Clear handler |
| `placeholder` | `string` | "Search..." | Placeholder text |
| `debounce` | `number` | 300 | Debounce ms (server-side) |
| `disabled` | `boolean` | `false` | Disabled state |
| `size` | `sm \| default` | `default` | Input size |

### Behavior

#### Debouncing
- **Server-side search:** Debounce 300ms after user stops typing
- **Client-side search:** No debounce (instant filter)
- **On clear:** Immediate (no debounce)

#### Clear
- Clear button (X) appears when input has text
- Click X: Clears input, triggers `onClear`, focuses input
- Press Escape: Clears input (if input is focused)

### Accessibility
- `<input type="search">` with `aria-label="Search"`
- Search icon: `aria-hidden="true"` (decorative)
- Clear button: `aria-label="Clear search"`
- Enter: Submits search (if within form) or triggers search

### Keyboard Behavior
| Key | Action |
|-----|--------|
| Type | Enter search query |
| `Escape` | Clear search (if focused) |
| `Tab` | Move to next element |

### Animations
- Clear button appear: MI-08 (150ms, fade in)
- Clear button disappear: MI-09 (150ms, fade out)

### Responsive Behavior
- Desktop: Fixed width (`w-64`) or `flex-1` in toolbar
- Mobile: Full width (`w-full`)
- Touch target: 36px height (default), 44px recommended on mobile

### Anti-Patterns
- **No debounce on server-side search** — causes excessive API calls
- **No clear button** — user can't easily clear search
- **Search icon on right** — convention is left
- **Placeholder as label** — use `aria-label` for screen readers
- **Debounce > 500ms** — feels sluggish; 300ms is optimal

### Acceptance Criteria
- [ ] Search icon (16px) on left side
- [ ] Clear button (X) appears when text present
- [ ] Debounce: 300ms (server-side)
- [ ] Escape clears search when focused
- [ ] `aria-label="Search"` on input
- [ ] Clear button has `aria-label="Clear search"`
- [ ] Focus state shows `--ring` border
- [ ] Full width on mobile

### Future Scalability
- Search suggestions/autocomplete dropdown
- Search history (recent searches)
- Global search (across all entities)
- Keyboard shortcut (`/` to focus search)

---

## Component: GlobalSearch (Future)

### Purpose
Search across all entities (screens, playlists, media, team members).

### Usage
- Header search bar (desktop)
- Command palette (`Ctrl+K`)

### Structure
```
<GlobalSearch
  onResultClick={(result) => navigate(result.url)}
  categories={["screens", "playlists", "media", "team"]}
/>
```

### Behavior
- Trigger: Click search bar or `Ctrl+K`
- Input: Full-width search input in dialog
- Results: Grouped by category, with icons
- Navigation: Click result → navigate to entity
- Keyboard: Arrow keys to navigate results, Enter to select

### Evidence
`screen-specifications/01-global-layout-spec.md` — Header search (future)
`user-flow-architecture/16-system-flows.md` FL-SYS-03 — Command palette

### Status
**Future** — requires backend global search API.

---

## Cross-References

- See `13-input-specifications.md` for Input component spec
- See `27-filter-components.md` for filter components
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for animation tokens
- See `ux-blueprint/03-component-ux-standards.md` for component standards
