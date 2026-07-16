# 27 — Filter Components

> **Evidence basis:** `13-input-specifications.md`, `09-interaction-states.md`, `07-motion-system.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/04-screens-specs.md` through `12-admin-specs-part2.md`

---

## Component: FilterSelect

### Purpose
Dropdown for filtering list/table data by a specific field.

### Usage
- Screen status filter (Online, Offline, Warning)
- Playlist status filter (Draft, Published)
- Media type filter (Image, Video)
- Admin plan filter (Free, Pro, Enterprise)
- Admin status filter (Active, Suspended)
- Log level filter (Info, Warning, Error, Critical)

### When to Use
- Filtering by predefined categories
- Server-side filtering with query parameters
- Single-select filter values

### When NOT to Use
- Free-text search (use SearchInput)
- Sorting (use SortSelect)
- Date range filtering (use DatePicker — future)
- Multi-select filtering (use FilterMultiSelect — future)

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard dropdown with label |
| `compact` | Icon-only filter button (toolbar) |

### Structure
```
<FilterSelect
  name="status"
  value={filter.status}
  onChange={(value) => setFilter({ ...filter, status: value })}
  options={[
    { value: "all", label: "All" },
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" },
    { value: "warning", label: "Warning" }
  ]}
/>
```

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Trigger | Select component (see `13-input-specifications.md`) | — |
| Width | `w-32` to `w-40` (compact) | — |
| Label | Inline prefix "Status:" or placeholder "Filter by..." | `--text-sm` |
| Active filter | `--primary/10` bg on trigger | — |
| Dropdown panel | `--popover` bg, `--shadow-md` | Elevation 3 |

### States

| State | Visual |
|-------|--------|
| Default | `--input` border, `--card` bg |
| Has value (active) | `--primary/10` bg, `--primary` text |
| Open | `--ring` border, dropdown visible |
| Disabled | `opacity-50` |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Filter identifier |
| `value` | `string` | — | Current filter value |
| `onChange` | `(value) => void` | — | Change handler |
| `options` | `{value, label}[]` | — | Filter options |
| `placeholder` | `string` | "Filter by..." | Placeholder |
| `clearable` | `boolean` | `true` | Show "All" / clear option |
| `disabled` | `boolean` | `false` | Disabled state |

### Behavior
- **Change:** Immediate (triggers refetch with new filter)
- **Clear:** Select "All" option or click clear (X) if `clearable`
- **Active indicator:** Trigger shows `--primary/10` bg when non-default value selected

### Accessibility
- `role="combobox"` (if searchable) or `role="listbox"`
- `aria-label="Filter by [name]"`
- `aria-expanded` when open
- Keyboard: Arrow keys, Enter, Escape

---

## Component: SortSelect

### Purpose
Dropdown for sorting list/table data.

### Usage
- Sort by name, date, status, screens count, etc.
- Used in all list/table toolbars

### Structure
```
<SortSelect
  value={sort}
  onChange={setSort}
  options={[
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "date-desc", label: "Newest first" },
    { value: "date-asc", label: "Oldest first" }
  ]}
/>
```

### Visual Design

| Element | Style |
|---------|-------|
| Trigger | Select with `ArrowUpDown` icon (16px) |
| Width | `w-36` to `w-44` |
| Label | "Sort by" prefix or placeholder |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | — | Current sort value |
| `onChange` | `(value) => void` | — | Change handler |
| `options` | `{value, label}[]` | — | Sort options |
| `disabled` | `boolean` | `false` | Disabled state |

### Behavior
- **Change:** Immediate (triggers refetch with new sort)
- **Default:** Usually "Newest first" or "Name (A-Z)"

---

## Component: FilterToolbar

### Purpose
Container for search, filter, and sort components in a toolbar layout.

### Structure
```
<FilterToolbar>
  <SearchInput ... />
  <FilterSelect name="status" ... />
  <FilterSelect name="type" ... />
  <SortSelect ... />
  {hasActiveFilters && <ClearFiltersButton />}
</FilterToolbar>
```

### Visual Design
- Layout: `flex items-center gap-3 flex-wrap`
- Position: Below page header, above content
- Margin: `mb-4`
- Background: transparent (no card)

### ClearFiltersButton
- **Visibility:** Only when any filter is non-default
- **Variant:** `ghost`
- **Text:** "Clear Filters"
- **Icon:** `X` (14px)
- **Click:** Resets all filters to defaults

### Responsive Behavior
- Desktop: Single row (`flex-row`)
- Mobile: Wrap (`flex-wrap`), each filter full width or auto-width

---

## Component: FilterChips (Future)

### Purpose
Display active filters as removable chips.

### Usage
- Below toolbar when filters are active
- Each chip shows filter name and value
- Click X on chip to remove that filter

### Visual
- Chip: `--primary/10` bg, `--primary` text, `--radius-full`
- Padding: `--space-0.5 --space-2`
- Font: `--text-xs --font-medium`
- Close: `X` icon (12px)

---

## Cross-References

- See `13-input-specifications.md` for Select component
- See `26-search-components.md` for SearchInput
- See `09-interaction-states.md` for state definitions
- See `ux-blueprint/03-component-ux-standards.md` for component standards
