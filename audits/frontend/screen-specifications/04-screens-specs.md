# Screen Specifications — Screens (List, Detail, Pairing Wizard)

> **Evidence basis:** `ux-blueprint/08-screens-ux-blueprint.md`, `user-flow-architecture/08-screen-flows.md`, `product-architecture/09-product-modules.md` M-02, `information-architecture/06-page-catalog.md` P-SC-01–P-SC-03

---

## SCR-SC-01: Screens List

### Screen ID
SCR-SC-01

### Purpose
View and manage all screens in the workspace.

### Business Goal
Screen fleet management; monitoring; content assignment.

### User Goal
See screen status; navigate to detail; add new screen.

### Primary Users
Owner, Editor (full access); Viewer (read-only).

### Permissions
- "Add Screen" button: Owner/Editor only
- Bulk actions: Owner/Editor only
- Screen cards: All roles (Viewer sees read-only)

### Entry Points
- Sidebar "Screens"
- Overview Quick Action "Add Screen" (goes to pairing)
- Overview Active Content widget click

### Exit Points
- Click screen card → Screen Detail
- "Add Screen" → Pairing Wizard
- Sidebar navigation

### Navigation
- Sidebar active: "Screens"
- Breadcrumbs: None (top-level page)

### Page Title
`Screens — Cloud-Screen`

### Primary CTA
"Add Screen" button (top-right of page header).

### Secondary CTA
- Search input
- Filter dropdown (status, branch)
- Sort dropdown

### Danger Actions
- Delete screen (from card "More" menu — Owner/Editor only)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Screens" + [Add Screen]                │
│ Search bar + filters                                  │
├─────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │ Screen │ │ Screen │ │ Screen │ │ Screen │         │
│ │ Card   │ │ Card   │ │ Card   │ │ Card   │         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │ Screen │ │ Screen │ │ Screen │ │ Screen │         │
│ │ Card   │ │ Card   │ │ Card   │ │ Card   │         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
├─────────────────────────────────────────────────────┤
│ Pagination                                           │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

### Spacing
- Page header: `mb-6`
- Toolbar (search + filters): `mb-4`, `gap-3`
- Card grid: `gap-4`
- Pagination: `mt-6`

### Visual Hierarchy
1. Page header with "Add Screen" CTA
2. Search and filter toolbar
3. Screen cards grid (primary content)
4. Pagination

### Page Sections

#### Section 1: Page Header
- **Contents:** "Screens" heading + "Add Screen" button
- **Sticky:** No

#### Section 2: Toolbar
- **Contents:** Search input (left, flexible width), status filter, branch filter, sort dropdown
- **Layout:** `flex items-center gap-3 flex-wrap`
- **Sticky:** No (future: sticky on scroll)

#### Section 3: Screen Cards Grid
- **Contents:** Grid of ScreenCard components
- **Data:** `useApiScreens({ page, search, status, branch, sort })` — paginated, server-side
- **Empty:** EmptyState component

#### Section 4: Pagination
- **Contents:** Page number, prev/next, page size selector
- **Visibility:** Only when total > page size

---

## Component Tree

```
<ScreensPage>
  <PageHeader>
    <Heading level={1}>Screens</Heading>
    <Button variant="default" onClick={() => router.push('/screens/pair')}>
      <Plus icon /> Add Screen
    </Button>
  </PageHeader>
  <Toolbar>
    <SearchInput value={search} onChange={setSearch} placeholder="Search screens..." />
    <FilterSelect name="status" options={statusOptions} />
    <FilterSelect name="branch" options={branchOptions} />
    <SortSelect options={sortOptions} />
    {activeFilters.length > 0 && <ClearFiltersButton />}
  </Toolbar>
  {selectedIds.length > 0 && (
    <BulkActionBar count={selectedIds.length} onClear={clearSelection} onAssignContent={...} onDelete={...} />
  )}
  <ScreenGrid>
    {screens.map(screen => (
      <ScreenCard
        key={screen.id}
        screen={screen}
        selected={selectedIds.includes(screen.id)}
        onSelect={toggleSelect}
        onClick={() => router.push(`/screens/${screen.id}`)}
        onMenuAction={handleMenuAction}
      />
    ))}
  </ScreenGrid>
  <Pagination page={page} total={total} pageSize={pageSize} onChange={setPage} />
</ScreensPage>
```

### Component Details

#### ScreenCard
- **Props:** `screen: Screen`, `selected: boolean`, `onSelect: (id) => void`, `onClick: () => void`, `onMenuAction: (action, id) => void`
- **UI:** Card with thumbnail/preview, screen name, status badge, branch name, current playlist
- **Status badge:** Green (Online), Red (Offline), Amber (Warning), Gray (No Content)
- **Checkbox:** Top-left corner (visible on hover or when any selected) — Owner/Editor only
- **"More" menu:** Top-right (⋯) → "Rename", "Assign Content", "Delete"
- **Click:** Card body → navigate to detail
- **Hover:** `shadow-md` elevation, checkbox appears
- **Accessibility:** `role="button"` for card, `aria-label` with screen name and status

#### BulkActionBar
- **Props:** `count: number`, `onClear: () => void`, `onAssignContent: () => void`, `onDelete: () => void`
- **UI:** Sticky bar at bottom or top of grid; shows count + action buttons
- **Visibility:** Only when ≥ 1 card selected
- **Actions:** "Assign Content" (bulk publish), "Delete" (bulk delete with confirmation)

---

## Responsive

### Desktop (≥ 1024px)
- Grid: 3-4 columns
- Toolbar: Single row, all elements visible

### Tablet (768px – 1023px)
- Grid: 2-3 columns
- Toolbar: Wraps if needed

### Mobile (< 768px)
- Grid: 1 column (stacked cards)
- Toolbar: Stacked (search full width, filters below)
- Card: Full width, horizontal layout (thumbnail left, info right)
- "More" menu: Always visible (no hover on touch)

---

## States

### Loading
- Card grid: 8-12 skeleton cards (gray rectangles with shimmer)
- Toolbar: Visible immediately (no loading needed)

### Empty — No Screens
- EmptyState: "No screens paired yet" + icon + "Add Screen" CTA
- Full card area replaced with empty state

### Empty — No Results (filtered)
- EmptyState: "No screens match your filters" + "Clear Filters" button

### Error
- Card grid: Error state + "Retry" button
- Toolbar: Remains functional

### Offline
- Cards show cached data (SWR)
- Status badges may be stale (show last known status)
- "Offline" indicator in header

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Screen card | Navigate to `/screens/{id}` |
| Click | "Add Screen" | Navigate to `/screens/pair` |
| Click | Card checkbox | Toggle selection (bulk) |
| Click | "More" menu | Open dropdown with actions |
| Click | "Rename" (menu) | Inline edit mode on card |
| Click | "Assign Content" (menu) | Open publish dialog |
| Click | "Delete" (menu) | Open AlertDialog |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Update query, refetch |
| Sort | Select | Update query, refetch |
| Hover | Card | Shadow elevation + checkbox visible |
| Keyboard | Tab | Through toolbar → cards → pagination |
| Keyboard | Enter | Open focused card (detail) |

---

## Accessibility

| Element | Rule |
|---------|------|
| Page | `<h1>` "Screens" |
| Search | `role="searchbox"`, `aria-label="Search screens"` |
| Filters | `aria-label` per filter |
| Cards | `role="button"`, `aria-label="[Name], [Status]"` |
| Status badge | `aria-label` with full status text |
| Checkbox | `aria-label="Select [Name]"` |
| Pagination | `nav` with `aria-label="Pagination"` |
| Focus | Toolbar → cards → pagination |
| Contrast | Status badges meet 3:1 |

---

## Performance UX

| Concern | Strategy |
|---------|----------|
| Large lists | Server-side pagination (20 per page) |
| Search | Server-side (debounced 300ms) |
| Realtime | Socket.IO `screen:status` → update card in place |
| Image loading | Screen thumbnails lazy-loaded |
| Prefetch | Prefetch screen detail on card hover |

---

## API Requirements

| Endpoint | Method | Purpose | SWR Key |
|----------|--------|---------|---------|
| `/screens?page={p}&search={q}&status={s}&branch={b}&sort={s}` | GET | Paginated screens | `useApiScreens` |
| `/screens/{id}` | DELETE | Delete screen | `useApiDeleteScreen` |
| `/branches` | GET | Branch list for filter | `useApiBranches` |

### Realtime Events
| Event | Handler | UI Update |
|-------|---------|-----------|
| `screen:status` | Update screen in SWR cache | Card status badge updates |
| `screen:created` | Invalidate screens list | New card appears |
| `screen:deleted` | Invalidate screens list | Card removed |

### Backend Limitations
- No bulk delete endpoint (must call delete per screen — N requests)
- No bulk assign content endpoint (must call assign per screen)

### Missing APIs
- `POST /screens/bulk-delete` — Bulk delete screens
- `POST /screens/bulk-assign` — Bulk assign playlist to screens

---

## Acceptance Criteria

### Functional
- [ ] Displays screen cards in grid
- [ ] "Add Screen" navigates to pairing wizard
- [ ] Search filters screens by name (server-side)
- [ ] Status filter works
- [ ] Click card navigates to screen detail
- [ ] "More" menu shows rename, assign, delete actions
- [ ] Delete shows confirmation dialog
- [ ] Pagination works when > 20 screens

### UX
- [ ] Skeleton cards during loading
- [ ] Empty state with CTA when no screens
- [ ] Realtime status updates within 1s
- [ ] No layout shift during load

### Accessibility
- [ ] `<h1>` for page title
- [ ] Cards have `role="button"` and descriptive `aria-label`
- [ ] Keyboard navigable
- [ ] Status badges have `aria-label`

### Performance
- [ ] First card renders < 500ms
- [ ] Search results < 1s
- [ ] Realtime update < 1s

### Responsive
- [ ] 4 columns on desktop, 2 on tablet, 1 on mobile
- [ ] Toolbar wraps on mobile
- [ ] Cards adapt to horizontal layout on mobile

---

## SCR-SC-02: Screen Detail

### Screen ID
SCR-SC-02

### Purpose
View detailed information about a single screen; manage content and schedules.

### Business Goal
Screen management; troubleshooting; content assignment.

### User Goal
Check screen status; assign or change content; view schedules.

### Primary Users
All roles (Viewer: read-only).

### Permissions
- "Assign Content" button: Owner/Editor
- "Edit" actions: Owner/Editor
- Delete (Danger Zone): Owner/Editor
- View: All roles

### Entry Points
- Screen List card click
- Overview Active Content click
- Notification click (screen offline alert)
- Direct URL `/screens/{id}`

### Exit Points
- "Back to Screens" → `/screens`
- "Edit Playlist" → `/content/playlists/{id}/studio`
- "View All Schedules" → `/scheduling`
- Sidebar navigation

### Navigation
- Sidebar active: "Screens"
- Breadcrumbs: "Screens / [Screen Name]"

### Page Title
`[Screen Name] — Cloud-Screen`

### Primary CTA
"Assign Content" button (header, right side).

### Secondary CTA
- "Edit Playlist" (in Current Content section)
- "View All Schedules" (in Active Schedules section)
- "Edit" (inline, Screen Info section)

### Danger Actions
- "Delete Screen" (Danger Zone section — Owner/Editor only)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: Screens / [Name]                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Header: Name + Status Badge + [Assign Content]  │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌──────────────────┐ ┌──────────────────────────┐  │
│ │ Current Content   │ │ Screen Info              │  │
│ │ (playlist preview)│ │ (name, branch, OS, etc.) │  │
│ └──────────────────┘ └──────────────────────────┘  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Active Schedules                                  │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Recent Events                                     │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Danger Zone (Owner/Editor only)                  │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1200px] mx-auto px-6 py-6`
- Two-column: `grid grid-cols-1 lg:grid-cols-2 gap-6` for Current Content + Screen Info
- Full-width sections: Active Schedules, Recent Events, Danger Zone

### Page Sections

#### Section 1: Breadcrumbs + Header
- Breadcrumbs: "Screens / [Name]"
- Header: Screen name (h1), status badge, "Assign Content" button
- **Sticky:** No

#### Section 2: Current Content
- **Contents:** Playlist preview (thumbnail or player), playlist name, "Edit Playlist" link
- **Empty:** "No content assigned" + "Assign Content" button
- **Data:** `useApiScreen({ id })` → `currentPlaylist`

#### Section 3: Screen Info
- **Contents:** Name (inline editable), branch (dropdown), OS version, IP address, last seen, pairing code, created date
- **Editable:** Name (inline edit), Branch (dropdown)
- **Read-only:** OS, IP, last seen, pairing code, created

#### Section 4: Active Schedules
- **Contents:** List of schedules active on this screen
- **Empty:** "No active schedules"
- **Data:** `useApiSchedules({ screenId: id })`
- **Click:** Schedule item → `/scheduling` (filtered)

#### Section 5: Recent Events
- **Contents:** Timeline of recent events (online, offline, content change, schedule start)
- **Empty:** "No recent events"
- **Data:** `useApiScreenEvents({ id, limit: 10 })`

#### Section 6: Danger Zone (Owner/Editor only)
- **Contents:** "Delete Screen" button (destructive)
- **Styling:** `border-destructive/20 bg-destructive/5 rounded-lg p-4`

---

## Component Tree

```
<ScreenDetailPage>
  <Breadcrumbs items={[{label: "Screens", href: "/screens"}, {label: screen.name}]} />
  <ScreenHeader>
    <Heading level={1}>{screen.name}</Heading>
    <StatusBadge status={screen.status} />
    <Button variant="default" onClick={openPublishDialog}>Assign Content</Button>
  </ScreenHeader>
  <ContentGrid>
    <CurrentContentCard screen={screen} onEdit={() => router.push(`/content/playlists/${screen.playlistId}/studio`)} />
    <ScreenInfoCard screen={screen} onRename={handleRename} onBranchChange={handleBranchChange} />
  </ContentGrid>
  <ActiveSchedulesSection schedules={schedules} />
  <RecentEventsSection events={events} />
  {canEdit && <DangerZone>
    <Button variant="destructive" onClick={openDeleteDialog}>Delete Screen</Button>
  </DangerZone>}
</ScreenDetailPage>
```

---

## States

### Loading
- Skeleton header + skeleton sections (parallel fetch)

### Error — Screen Not Found
- "This screen doesn't exist or has been deleted." + "Back to Screens" button

### Empty — No Content
- Current Content: "No content assigned" + "Assign Content" button

### Empty — No Schedules
- Active Schedules: "No active schedules"

### Realtime
- Screen status change: Status badge updates + toast (if offline)
- Content change: Current Content section updates

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/screens/{id}` | GET | Screen details |
| `/screens/{id}` | PATCH | Update name/branch |
| `/screens/{id}` | DELETE | Delete screen |
| `/screens/{id}/schedules` | GET | Active schedules |
| `/screens/{id}/events?limit=10` | GET | Recent events |
| `/screens/{id}/assign` | POST | Assign playlist |

### Realtime Events
| Event | Handler |
|-------|---------|
| `screen:status:{id}` | Update status badge + toast if offline |
| `screen:content:{id}` | Update Current Content section |

### Missing APIs
- `GET /screens/{id}/events` — Screen-specific event timeline (may not exist)

---

## Acceptance Criteria

### Functional
- [ ] Displays screen name, status, and info
- [ ] "Assign Content" opens publish dialog
- [ ] Inline rename works (Owner/Editor)
- [ ] Branch dropdown works (Owner/Editor)
- [ ] Active schedules listed
- [ ] Delete shows confirmation with schedule impact warning
- [ ] Breadcrumbs navigate back to Screens

### UX
- [ ] Realtime status updates within 1s
- [ ] Skeleton loading for all sections
- [ ] Offline toast notification
- [ ] Current content preview visible

### Accessibility
- [ ] `<h1>` for screen name
- [ ] Breadcrumbs have `nav` and `aria-label`
- [ ] Status badge has `aria-label`
- [ ] Keyboard navigable

### Performance
- [ ] Parallel data fetch (screen, schedules, events)
- [ ] First section renders < 500ms
- [ ] Realtime update < 1s

### Responsive
- [ ] Two-column on desktop, single column on mobile
- [ ] All sections stack on mobile

---

## SCR-SC-03: Pairing Wizard

### Screen ID
SCR-SC-03

### Purpose
3-step wizard to pair a physical screen to the workspace.

### Business Goal
Screen fleet growth; 5-minute KPI step 3.

### User Goal
Connect a screen to the platform.

### Primary Users
Owner, Editor.

### Permissions
Owner/Editor only (Viewer: button hidden).

### Entry Points
- Screen List "Add Screen"
- Overview "Add Your First Screen" (onboarding)
- Overview Quick Action "Add Screen"

### Exit Points
- Success → "Assign Content" → `/content` or "Back to Screens" → `/screens`
- Cancel → `/screens`

### Navigation
- Sidebar active: "Screens"
- Breadcrumbs: "Screens / Pair Screen"
- No sidebar for onboarding flow (first-time user may come from Overview)

### Page Title
`Pair Screen — Cloud-Screen`

### Primary CTA
"Pair Screen" button (Step 3).

### Secondary CTA
"Cancel" button (all steps).

### Danger Actions
None.

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: Screens / Pair Screen                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Step Indicator: ①──②──③                         │ │
│ │                                                   │ │
│ │ Step Content (centered, max-w-[500px])           │ │
│ │                                                   │ │
│ │ [Cancel]                    [Next / Pair Screen] │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[600px] mx-auto px-6 py-6`
- Card: `bg-card border border-border rounded-xl p-8`

### Page Sections

#### Step 1: Enter Pairing Code
- **Contents:** Large input for 6-character code, help text: "Find the code on your screen's player app"
- **Validation:** 6 characters, alphanumeric
- **Auto-advance:** Proceed to Step 2 when 6 characters entered

#### Step 2: Name Your Screen
- **Contents:** Name input (auto-suggested "Screen-001"), help text: "Give your screen a recognizable name"
- **Validation:** 2-50 characters

#### Step 3: Assign Branch (Optional)
- **Contents:** Branch dropdown + "Skip" button
- **Validation:** None (optional)
- **Submit:** "Pair Screen" button

#### Success State
- **Contents:** Checkmark animation, "Screen paired successfully!", post-pairing CTAs
- **CTAs:** "Assign Content" → `/content`, "Back to Screens" → `/screens`

---

## Component Tree

```
<PairingWizard>
  <Breadcrumbs items={[{label: "Screens", href: "/screens"}, {label: "Pair Screen"}]} />
  <WizardCard>
    <StepIndicator current={step} total={3} labels={["Code", "Name", "Branch"]} />
    {step === 1 && <PairingCodeStep value={code} onChange={setCode} />}
    {step === 2 && <ScreenNameStep value={name} onChange={setName} />}
    {step === 3 && <BranchStep value={branch} onChange={setBranch} branches={branches} />}
    {success ? (
      <SuccessState onAssignContent={...} onBack={...} />
    ) : (
      <WizardFooter>
        <Button variant="ghost" onClick={cancel}>Cancel</Button>
        <Button variant="default" onClick={next} disabled={!canProceed}>
          {step === 3 ? "Pair Screen" : "Next"}
        </Button>
      </WizardFooter>
    )}
  </WizardCard>
</PairingWizard>
```

---

## States

### Loading
- "Pair Screen" click: Button spinner + "Pairing..."
- Success state: Checkmark animation (600ms)

### Error
- **Invalid code:** Inline error: "Invalid pairing code. Check the code on your screen."
- **Already paired:** Inline error: "This screen is already paired to another workspace."
- **API failure:** Toast: "Failed to pair screen. Try again."

### Success
- Checkmark animation (MI-11, 600ms)
- "Screen paired successfully!"
- Post-pairing CTAs

---

## API Requirements

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/screens/pair` | POST | Pair screen | `{ pairingCode, name, branchId? }` → `{ screen }` |
| `/branches` | GET | Branch list for dropdown | — |

### Backend Limitations
- Pairing code generation is on player app (not frontend concern)
- Code expiration time is backend-controlled

---

## Acceptance Criteria

### Functional
- [ ] 3-step wizard with step indicator
- [ ] Step 1: pairing code input with validation
- [ ] Step 2: name input with validation
- [ ] Step 3: optional branch selection
- [ ] Success state with post-pairing CTAs
- [ ] "Assign Content" navigates to `/content`
- [ ] "Back to Screens" navigates to `/screens`
- [ ] Cancel returns to `/screens`

### UX
- [ ] Auto-advance from Step 1 to Step 2 on 6 characters
- [ ] Step indicator shows progress
- [ | Checkmark animation on success
- [ ] Post-pairing CTA guides to next step (5-min KPI)

### Accessibility
- [ ] Step indicator has `aria-current`
- [ ] Inputs have labels and `aria-label`
- [ ] Error messages via `aria-live`
- [ ] Keyboard: Tab through inputs, Enter to proceed

### Performance
- [ ] Wizard renders < 200ms
- [ ] Pairing API < 3s

### Responsive
- [ ] Card centered on desktop, full-width on mobile
- [ ] Step indicator adapts (horizontal on desktop, may wrap on mobile)

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `03-overview-spec.md` for Overview spec
- See `05-content-specs.md` for Content specs
- See `13-shared-dialogs-specs.md` for publish dialog spec
- See `ux-blueprint/08-screens-ux-blueprint.md` for screens UX blueprint
- See `user-flow-architecture/08-screen-flows.md` for screen flow documentation
- See `product-architecture/09-product-modules.md` M-02 for screen module
