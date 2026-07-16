# 16 — Tables

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `ux-blueprint/03-component-ux-standards.md` §3, `screen-specifications/11-notifications-admin-specs-part1.md`, `screen-specifications/12-admin-specs-part2.md`, `screen-specifications/08-team-spec.md`

---

## Component: Table

### Purpose
Display tabular data with columns, rows, sorting, and pagination.

### Usage
Admin pages (Customers, Staff, Users, Workspaces, Fleet, Logs, Feature Flags), Team members, API keys, Notifications.

### When to Use
- Displaying tabular data with multiple columns
- Admin lists with many fields per row
- Data that needs sorting by column
- Data that needs row-level actions

### When NOT to Use
- Visual content (use Card grid instead)
- Simple lists with one or two fields (use List instead)
- Entity grids with thumbnails (use Card grid instead)
- Timeline or activity feed (use List instead)

### Variants

| Variant | Usage |
|---------|-------|
| `default` | Standard data table |
| `compact` | Dense data (logs, fleet) — reduced row height |
| `withSelection` | Rows have checkboxes for bulk actions |

### Structure

```
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Column Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Value</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Sizes

| Size | Row Height | Cell Padding | Font Size |
|------|-----------|--------------|-----------|
| `default` | 48px | `--space-2 --space-4` | `--text-sm` |
| `compact` | 36px | `--space-1 --space-3` | `--text-sm` |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | `--card` bg, `--border` bottom borders | — |
| Row hover | `--muted/50` bg | MI-01 (150ms) |
| Row selected | `--primary/5` bg | Instant |
| Header | `--muted` bg, `--text-xs --font-medium --muted-foreground` uppercase | — |
| Sorted column | Sort icon (ArrowUp/ArrowDown) next to header | — |
| Loading | Skeleton rows (gray bars with shimmer) | MI-12 |
| Empty | EmptyState component in table area | — |
| Error | ErrorState + "Retry" in table area | — |

### Props (Table)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | — | Array of row data |
| `columns` | `Column[]` | — | Column definitions |
| `sortable` | `boolean` | `false` | Enable column sorting |
| `selectable` | `boolean` | `false` | Enable row selection |
| `size` | `default \| compact` | `default` | Row density |
| `loading` | `boolean` | `false` | Loading state |
| `empty` | `ReactNode` | — | Empty state content |
| `onRowClick` | `(row) => void` | — | Row click handler |
| `onSort` | `(column, direction) => void` | — | Sort handler |
| `onSelect` | `(selectedIds) => void` | — | Selection handler |

### Column Definition

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Data field key |
| `header` | `string` | Column header label |
| `render` | `(row) => ReactNode` | Custom cell renderer |
| `sortable` | `boolean` | Enable sorting for this column |
| `width` | `string` | Column width (px or %) |
| `align` | `left \| center \| right` | Cell alignment |
| `fixed` | `boolean` | Sticky column (future) |

### Sub-Components

#### TableHeader
- Background: `--muted`
- Border: `--border` (bottom, 1px)
- Height: 40px (default), 32px (compact)

#### TableHead
- Font: `--text-xs --font-medium --muted-foreground`
- Text transform: `uppercase`
- Alignment: Left (default), right (numbers, actions)
- Sort indicator: ArrowUp (asc), ArrowDown (desc), ArrowUpDown (unsorted)

#### TableBody
- Background: `--card`

#### TableRow
- Border: `--border` (bottom, 1px)
- Hover: `--muted/50` bg
- Selected: `--primary/5` bg
- Click: `cursor-pointer` if `onRowClick` provided

#### TableCell
- Font: `--text-sm --font-normal --foreground`
- Padding: `--space-2 --space-4` (default), `--space-1 --space-3` (compact)
- Alignment: Left (default), right (numbers, actions, dates)

### Row Actions
- **Inline actions:** Buttons in the last column (right-aligned)
- **"More" menu:** `MoreHorizontal` icon → dropdown with actions
- **Action width:** Fixed width for action column (e.g., 80px for icon, 120px for text)

### Pagination
- Position: Below table, `mt-6`
- Layout: `flex items-center justify-between`
- Left: "Showing [N]–[M] of [Total]"
- Right: Prev/Next buttons + page number
- Page size selector: Dropdown (10, 20, 50)

### Bulk Selection
- **Select All checkbox:** In header row (first column)
- **Row checkboxes:** In first column of each row
- **BulkActionBar:** Appears when ≥ 1 row selected; shows count + action buttons
- **Position:** Sticky top or bottom of table

### Responsive Behavior
- Desktop: Full table with all columns
- Mobile: Horizontal scroll (`overflow-x-auto`)
- No column hiding (all columns visible via scroll)
- Row actions: Icon-only on mobile, icon + label on desktop

### Accessibility
- `<table>` with `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- `<th scope="col">` for headers
- Sortable headers: `aria-sort="ascending | descending | none"`
- Selected rows: `aria-selected="true"`
- Row click: `role="button"` on row (if clickable)
- Keyboard: `Tab` through interactive elements (checkboxes, actions, pagination)

### Keyboard Behavior
| Key | Action | Condition |
|-----|--------|-----------|
| `Tab` | Move through interactive elements | Always |
| `Enter` | Activate row (if clickable) | Row has onClick |
| `Space` | Toggle row selection | Row has checkbox |
| `Arrow Up/Down` | Navigate rows (future) | Table has focus |

### Animations
- Row hover: MI-01 (150ms, background)
- Sort indicator: Instant (icon swap)
- Skeleton: MI-12 (shimmer, 1500ms loop)

### Loading
- Skeleton rows: 5-10 rows with gray bars matching column widths
- Shimmer animation: MI-12

### Empty
- EmptyState component centered in table area
- Message: "No [items] found" + optional CTA

### Error
- ErrorState component: "Failed to load [items]" + "Retry" button

### Anti-Patterns
- **Table without header** — always use TableHeader with column labels
- **Fixed pixel widths on all columns** — let content flow; only fix action columns
- **No horizontal scroll on mobile** — table must scroll, not collapse
- **Hidden columns on mobile** — all columns must be accessible (via scroll)
- **Row click + checkbox on same row** — checkbox area should not trigger row click
- **No loading state** — always show skeleton during data fetch

### Acceptance Criteria
- [ ] Table renders with header and body
- [ ] Column headers are uppercase, muted, `--text-xs`
- [ ] Row hover shows `--muted/50` background (150ms)
- [ ] Sortable columns show sort indicator
- [ ] Selected rows show `--primary/5` background
- [ ] Pagination shows correct range and navigation
- [ ] Bulk selection: "Select All" + per-row checkboxes work
- [ ] Skeleton loading during data fetch
- [ ] Empty state when no data
- [ ] Error state with "Retry"
- [ ] Horizontal scroll on mobile
- [ ] `<th scope="col">` on all headers
- [ ] `aria-sort` on sortable headers

### Future Scalability
- Column resizing (drag to resize)
- Column reordering (drag to reorder)
- Sticky/frozen columns (first column or last column)
- Row expansion (click to expand details)
- Inline editing (click cell to edit)
- Export to CSV
- Dense/comfortable toggle

---

## Cross-References

- See `01-foundations.md` for color and spacing tokens
- See `09-interaction-states.md` for state definitions
- See `18-empty-states.md` for empty state component
- See `19-loading-states.md` for skeleton component
- See `20-error-states.md` for error state component
- See `25-navigation-components.md` for pagination component
- See `ux-blueprint/03-component-ux-standards.md` §3 for table standards
