# 18 — Empty States

> **Evidence basis:** `01-foundations.md`, `06-illustration-rules.md`, `05-iconography.md`, `ux-blueprint/02-state-guidelines.md`, `screen-specifications/03-overview-spec.md` through `12-admin-specs-part2.md`

---

## Component: EmptyState

### Purpose
Communicate that a page, section, or list has no data to display, and guide the user on what to do next.

### Usage
When a data container (table, list, grid, page section) has zero items.

### When to Use
- No screens in workspace (first use)
- No playlists created
- No media uploaded
- No search results (filtered empty)
- No notifications
- No assigned screens
- No analytics data
- No schedules

### When NOT to Use
- Loading state (use Skeleton instead)
- Error state (use ErrorState instead)
- Partial data (show what's available)
- "No more items" at end of list (use end-of-list indicator)

### Variants

| Variant | Usage |
|---------|-------|
| `default` | No data exists (first use, nothing created) |
| `filtered` | No results match current filters |
| `permission` | User lacks permission to view data |
| `error` | Data failed to load (alias of ErrorState) |

### Structure

```
<EmptyState>
  <EmptyStateIcon icon={Monitor} />
  <EmptyStateTitle>No screens yet</EmptyStateTitle>
  <EmptyStateDescription>Add your first screen to start displaying content.</EmptyStateDescription>
  <EmptyStateAction>
    <Button variant="default">Add Screen</Button>
  </EmptyStateAction>
</EmptyState>
```

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Container | Centered, `py-12` | — |
| Icon | 48px (`--icon-3xl`), `--muted-foreground` | `06-illustration-rules.md` |
| Title | `--text-lg --font-semibold --foreground` | — |
| Description | `--text-sm --font-normal --muted-foreground` | — |
| Action | Button (default or ghost) | `12-button-specifications.md` |
| Gap | `--space-3` between elements | — |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `LucideIcon` | — | Icon component (required) |
| `title` | `string` | — | Title text (required) |
| `description` | `string` | — | Description text |
| `action` | `ReactNode` | — | CTA button or link |
| `variant` | `default \| filtered \| permission` | `default` | Empty state type |

### Variant Details

#### `default` (No data exists)
- **Icon:** Entity-specific (Monitor, Image, Calendar, Bell, etc.)
- **Title:** "No [items] yet"
- **Description:** "Add your first [item] to get started."
- **Action:** Primary CTA button ("Add Screen", "Upload", "Create")

#### `filtered` (No results match filters)
- **Icon:** `Search` (48px, `--muted-foreground`)
- **Title:** "No [items] match your filters"
- **Description:** "Try adjusting your search or filters."
- **Action:** "Clear Filters" button (ghost variant)

#### `permission` (No permission)
- **Icon:** `Lock` (48px, `--muted-foreground`)
- **Title:** "You don't have permission to view this"
- **Description:** "Contact your workspace owner for access."
- **Action:** None (or "Go back" link)

### Catalog of Empty States

| Screen | Icon | Title | Description | Action | Evidence |
|--------|------|-------|-------------|--------|----------|
| Screens List (no screens) | `Monitor` | "No screens yet" | "Add your first screen to start displaying content." | "Add Screen" | `04-screens-specs.md` |
| Playlists (no playlists) | `Image` | "No playlists created yet" | "Create a playlist to organize your content." | "Create Playlist" | `05-content-specs.md` |
| Media (no media) | `Upload` | "No media uploaded yet" | "Upload images and videos to use in your playlists." | "Upload" | `05-content-specs.md` |
| Playlist Detail (no items) | `Image` | "No media items" | "Edit in Studio to add content." | "Edit in Studio" | `05-content-specs.md` |
| Playlist Detail (not published) | `Send` | "Not published to any screen" | "Publish this playlist to display it on your screens." | "Publish to Screens" | `05-content-specs.md` |
| Notifications (no notifications) | `Bell` | "No notifications" | "You're all caught up." | None | `11-notifications-admin-specs-part1.md` |
| Scheduling (no schedules) | `CalendarClock` | "No schedules yet" | "Create a schedule to automate content playback." | "Create Schedule" | `07-scheduling-analytics-specs.md` |
| Analytics (no data) | `BarChart3` | "No analytics data" | "Add screens and publish content to see performance." | None | `07-scheduling-analytics-specs.md` |
| Team (no pending) | — | Section hidden | Pending section not shown when empty | — | `08-team-spec.md` |
| API Keys (no keys) | `Key` | "No API keys created" | "Create one to access the Smart Screen API." | "Create API Key" | `10-settings-specs-part2.md` |
| Admin (no results) | `Search` | "No [items] found" | "Try adjusting your search or filters." | "Clear Filters" | `11/12-admin-specs.md` |

### Responsive Behavior
- Desktop: Centered in container, max-width 400px for text
- Mobile: Full width, centered, same layout

### Accessibility
- Container: `role="status"` (not `role="alert"` — this is not an error)
- Icon: `aria-hidden="true"` (decorative)
- Title: Semantic heading (`<h3>`) if appropriate in page context
- Action: Standard button accessibility

### Animations
- Mount: MI-08 (300ms, fade in up)
- No loop animations

### Anti-Patterns
- **Empty state without CTA** (when action is possible) — always provide a path forward
- **Empty state with error styling** — empty is not an error; use neutral colors
- **Empty state as full page when section is empty** — use section-level empty state
- **No empty state** — showing blank space is confusing
- **Generic "No data"** — always be specific about what's missing

### Acceptance Criteria
- [ ] Icon renders at 48px in `--muted-foreground`
- [ ] Title uses `--text-lg --font-semibold`
- [ ] Description uses `--text-sm --muted-foreground`
- [ ] Action button (if present) is centered below description
- [ ] Content is centered horizontally and vertically
- [ ] `filtered` variant shows "Clear Filters" action
- [ ] `permission` variant shows no action (or "Go back")
- [ ] Mount animation: MI-08 (fade in up, 300ms)
- [ ] `role="status"` on container
- [ ] Icon has `aria-hidden="true"`

### Future Scalability
- Illustration support (custom SVG for major empty states)
- Onboarding tips within empty state
- Video tutorial link
- "Learn more" link to documentation

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `06-illustration-rules.md` for illustration style
- See `05-iconography.md` for icon library
- See `19-loading-states.md` for loading (not empty) states
- See `20-error-states.md` for error states
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
