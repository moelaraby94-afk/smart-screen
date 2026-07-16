# Component UX Standards

> **Evidence basis:** `transformation/15-component-strategy.md`, `audits/frontend/02-design-system-and-tokens.md`, `information-architecture/05-navigation-architecture.md`, `01-ux-principles.md`
> **Purpose:** Define UX standards for forms, tables, search, filtering, and command palette

---

## 1. Form UX Standards

### 1.1 Form Layout Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| One column layout | Forms are single-column, never multi-column | Enterprise SaaS best practice |
| Labels above inputs | Not inline, not floating | Recognition over recall (UP-06) |
| Required fields marked with `*` | Red asterisk after label | UP-08 |
| Optional fields unmarked | No "optional" label | Reduces visual noise |
| Fields ordered by priority | Required first, optional collapsed | UP-03 |
| Submit button at bottom | Full width on mobile, auto width on desktop | — |
| Cancel button left of submit | `outline` variant | — |

### 1.2 Input Field Rules

| Element | Rule | Evidence |
|---------|------|----------|
| Text input | Placeholder shows example, not label | — |
| Password input | Show/hide toggle button (eye icon) | `06-auth-and-session.md` §6.7 (missing — to be added) |
| Select | Uses Radix Select, not native `<select>` | DD-14, TC-05 |
| Checkbox | Label is clickable, not just the checkbox | ACC-03 |
| Switch | Uses Radix Switch (fix RTL bug F-MH-01) | F-MH-01 |
| Date picker | Calendar widget, not text input for dates | — |
| Time picker | Dropdown or stepper, not free text | — |
| Textarea | Auto-resize for long content | — |
| File upload | Drag-drop zone + browse button | F-MP-17 |

### 1.3 Validation Rules

| Rule | When | How | Evidence |
|------|------|-----|----------|
| Required field | On blur | Red border + "This field is required" below | UP-08 |
| Email format | On blur | Red border + "Enter a valid email address" | UP-08 |
| Min/max length | On blur | Red border + "Must be [N] characters" | UP-08 |
| Date range | On blur | Red border + "End date must be after start date" | UP-08 |
| File type | On select | Red border + "Only images and videos are allowed" | UP-08 |
| File size | On select | Red border + "File exceeds [N]MB limit" | UP-08 |
| Submit disabled | Until all required fields valid | Button is `disabled` with reduced opacity | UP-08 |

### 1.4 Form Submission Flow

```
1. User fills form
2. User clicks "Save" (primary button)
3. Button → spinner + "Saving..."
4. All inputs disabled during submission
5. API call:
   ├── Success → Toast: "[Entity] saved" → Navigate or close dialog
   └── Error → Toast: "Failed to save: [message]" → Form re-enabled, user can retry
```

### 1.5 Form Abandonment

| Rule | Description | Evidence |
|------|-------------|----------|
| No warning on navigate away (current) | Users can lose unsaved changes | Known gap |
| Future: warn on navigate with unsaved changes | AlertDialog: "You have unsaved changes. Leave anyway?" | Future enhancement |
| Form state is not persisted (current) | Lost on page refresh | Known gap |
| Future: auto-save for long forms | Auto-save after 30s of inactivity | Future enhancement |

---

## 2. Table UX Standards

### 2.1 Table Layout Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Sticky header | Header stays visible on scroll | Enterprise SaaS standard |
| Row hover | Subtle background change on hover | MI-02 |
| Striped rows | Alternating background (optional, based on density) | — |
| Column alignment | Text left (LTR) / start, numbers right (LTR) / end | — |
| Sortable columns | Click header to sort, indicator shows direction | — |
| Empty table | Shows empty state (not empty grid) | `02-state-guidelines.md` §1 |

### 2.2 Table Column Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Maximum 7 visible columns | Beyond 7, use horizontal scroll or column toggle | Cognitive load |
| Most important column first | Name/identifier in first column | VH-01 |
| Actions column last | Icon buttons or dropdown menu | — |
| Status as badge | Colored badge, not text | VH-04 |
| Date formatting | Relative for recent ("2h ago"), absolute for old ("Jan 15") | — |
| Truncate long text | Ellipsis with tooltip on hover | — |

### 2.3 Table Row Actions

| Action Type | How | Evidence |
|-------------|-----|----------|
| View | Click row (anywhere except action area) | — |
| Edit | Icon button or dropdown item | — |
| Delete | Icon button or dropdown item → AlertDialog | UP-09 |
| Bulk select | Checkbox in first column | IN-06, IN-07 |
| Row menu | "More" (⋮) button → dropdown | — |

### 2.4 Table Pagination

| Rule | Description | Evidence |
|------|-------------|----------|
| Page size: 10, 20, 50 | User-selectable | SCL-02 |
| Page indicator: "1-20 of 156" | Shows range and total | — |
| Previous/Next buttons | Disabled at boundaries | — |
| Page numbers | Show 5 max with ellipsis | — |
| URL-addressable | `?page=2&limit=20` | RESTful |

---

## 3. Search UX Standards

### 3.1 In-Page Search

| Element | Rule | Evidence |
|---------|------|----------|
| Search bar position | Top of list, above content | VH-01 |
| Placeholder | "Search [entity]..." | — |
| Debounce | 300ms after last keystroke | IN-09 |
| Clear button | "X" icon when query is non-empty | IN-09 |
| Empty query | Shows all items | IN-09 |
| No results | Empty state with "Clear Search" CTA | `02-state-guidelines.md` §1.3 |
| URL-addressable | `?q=searchterm` | RESTful |
| Keyboard | "/" focuses search (future) | — |

### 3.2 Global Search (Command Palette)

| Element | Rule | Evidence |
|---------|------|----------|
| Trigger | Ctrl+K (desktop), "More" → Search (mobile) | `05-navigation-architecture.md` §5.2 |
| Position | Centered overlay, 50% width (desktop), full width (mobile) | — |
| Input | Auto-focused on open | — |
| Results | Grouped by type (Screens, Playlists, Media, Team, Actions) | — |
| Result format | Icon + title + type label | — |
| Keyboard nav | Arrow keys + Enter, Escape to close | ACC-02 |
| Empty query | Shows recent items + quick actions | — |
| Loading | Spinner in input, skeleton results | — |
| No results | "No results found for '[query]'" + clear | IP-07 |
| Scope | Current workspace only | PC-19 |

### 3.3 Workspace Search

| Element | Rule | Evidence |
|---------|------|----------|
| Position | Workspace switcher dropdown | SCL-01 |
| Trigger | Click switcher in header (desktop) or drawer (mobile) | NP-05 |
| Debounce | 300ms | — |
| Results | Workspace name + screen count | — |
| Empty query | Shows all workspaces (paginated if 100+) | SCL-01 |
| No results | "No workspaces found" | — |

---

## 4. Filtering UX Standards

### 4.1 Filter UI Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Filter bar below search | Search on top, filters below | VH-01 |
| Filter as dropdown | Radix Popover with options | — |
| Active filters as chips | Removable badges below filter bar | IN-10 |
| "Clear all" button | Removes all active filters | IN-10 |
| URL-addressable | `?status=offline&branch=brn_123` | IN-10 |
| Filter count badge | Shows number of active filters on filter button | — |
| Filter persists within section | Navigating within section keeps filters | IN-10 |
| Filter resets on section change | Switching from Screens to Content resets filters | — |

### 4.2 Per-Section Filters

| Section | Filter Options | Evidence |
|---------|---------------|----------|
| Screens | Status (online/offline/warning), Branch, Has content | M-02 |
| Content (Playlists) | Has media, Published status (future) | M-03 |
| Content (Media) | Type (image/video), Used in playlist (future) | M-03 |
| Scheduling | Screen, Playlist, Status (active/inactive) | M-04 |
| Analytics | Period (7d/30d/90d/custom) | M-05 |
| Team | Role (Owner/Editor/Viewer), Status (active/pending) | M-06 |
| Notifications | Type (screen/schedule/team/system) | Shell |
| Admin customers | Plan, Status (active/trial/suspended) | M-08 |

### 4.3 Filter Chip Design

```
[Status: Offline ×]  [Branch: Riyadh ×]  [Clear All]
```

- Chip: `bg-muted rounded-full px-3 py-1 text-xs`
- Remove: "×" icon, click removes filter
- "Clear All": `text-sm text-muted-foreground hover:text-foreground`
- Chips appear below filter bar, above content

---

## 5. Command Palette UX

### 5.1 Command Palette Anatomy

```
┌──────────────────────────────────────────┐
│ 🔍  Search screens, playlists, actions... │
├──────────────────────────────────────────┤
│ RECENT                                    │
│  📺 Screen A                    Screen    │
│  🎬 Promo Playlist              Playlist  │
│ QUICK ACTIONS                             │
│  ➕ Add Screen                 Action      │
│  🎬 Create Playlist            Action      │
│  📅 Create Schedule            Action      │
│ RESULTS                                   │
│  📺 Screen B                    Screen    │
│  🎬 Summer Menu                Playlist   │
│  🖼️ Logo.png                   Media      │
└──────────────────────────────────────────┘
```

### 5.2 Command Palette Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Auto-focus input | Keyboard-ready on open | ACC-02 |
| Grouped results | Recent, Quick Actions, Screens, Playlists, Media, Team, Settings | — |
| Max 5 results per group | Prevents overwhelming | — |
| Keyboard navigation | ↑↓ to move, Enter to select, Escape to close | ACC-02 |
| Mouse navigation | Click to select | — |
| Quick actions always visible | Even with query, actions appear at top | UP-06 |
| No voice search | Not in scope | — |
| Scoped to workspace | No cross-workspace results | PC-19 |

---

## Cross-References

- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `04-feature-ux-standards.md` for feature-specific UX
- See `information-architecture/05-navigation-architecture.md` for navigation architecture
- See `transformation/15-component-strategy.md` for component strategy
- See `audits/frontend/02-design-system-and-tokens.md` for design system tokens
