# Screens UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md` §3-4, `information-architecture/06-page-catalog.md` P-SC-01 through P-SC-03, `audits/frontend/09-screens-feature.md`, `product-architecture/09-product-modules.md` M-02
> **Purpose:** Complete UX blueprint for Screen List, Screen Detail, and Screen Pairing Wizard

---

## P-SC-01: Screen List

### 1. Purpose
- **Business purpose:** Primary management target; screen fleet overview
- **User purpose:** Find a specific screen, check all screens, manage screen fleet
- **Success criteria:** User finds target screen within 10 seconds; user can perform bulk actions efficiently
- **Failure criteria:** User can't find a screen; too many clicks to reach detail; no bulk operations

### 2. Target Users
- **Primary user:** Workspace Owner (manage), Editor (manage)
- **Secondary user:** Viewer (monitor only)
- **Permissions:** Owner/Editor: full CRUD + bulk. Viewer: read-only.
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Screens are entity priority #2; primary daily management task

### 4. Primary Goal
Find and manage screens in the workspace

### 5. Primary Action
"Add Screen" (pairing wizard)

### 6. Secondary Actions
1. Search screens by name
2. Filter by status (online/offline/warning)
3. Filter by branch
4. Bulk select + bulk actions (assign, delete)
5. Click screen card → Screen detail
6. Sort by name, status, last seen

### 7. Information Priority
1. Screen status (online/offline/warning) — **most important** for monitoring
2. Screen name — **second** for identification
3. Current content (playlist name) — **third** for content verification
4. Branch name — **fourth** for location context
5. Last seen timestamp — **fifth** for troubleshooting
6. Pairing code — **sixth** (only during pairing)

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Screens" + "Add Screen" button (top-end)
- Search bar (full width)
- Filter bar (status, branch, clear all)

**Middle:**
- Screen card grid (3-4 columns desktop, 2 tablet, 1 mobile)
- Bulk action bar (appears when items selected)

**Bottom:**
- Pagination

**Collapsed:**
- Advanced filters (screen group, content status)
- Sort options

**Hidden:**
- Pairing code (only in wizard)
- Technical details (MAC address, IP — admin only)

**Progressive disclosure:**
- Card shows: status, name, content, branch. Click → detail shows: schedules, events, settings.

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search, filter, and primary action
- **Priority:** 1
- **Contents:** Search input, filter dropdowns, "Add Screen" button
- **Dependencies:** Branch list (for filter)
- **Visibility:** Always
- **Future:** Saved filter presets, column toggle

#### Section 2: Screen Grid
- **Purpose:** Display screens as cards
- **Priority:** 1
- **Contents:** Screen cards with status, name, content, branch
- **Dependencies:** `useApiScreens` (SWR, workspace-scoped, paginated)
- **Visibility:** Always (empty state if no screens)
- **Future:** Map view toggle, virtualization for 200+

#### Section 3: Bulk Action Bar
- **Purpose:** Actions for selected screens
- **Priority:** 2 (conditional)
- **Contents:** Selection count, "Assign Content", "Delete", "Clear"
- **Dependencies:** Selected screen IDs
- **Visibility:** Only when ≥ 1 screen selected
- **Future:** "Override", "Reboot", "Export"

#### Section 4: Pagination
- **Purpose:** Navigate large screen lists
- **Priority:** 3
- **Contents:** Page indicator, page size selector, prev/next
- **Dependencies:** Total screen count
- **Visibility:** Only when screens > page size
- **Future:** Infinite scroll alternative

### 10. Component Inventory

| Component | Type | Section | Evidence |
|-----------|------|---------|----------|
| Page title | Text (h1) | Toolbar | NP-02 |
| "Add Screen" button | Button (default) | Toolbar | UP-02 |
| Search input | Input (text) | Toolbar | `03-component-ux-standards.md` §3.1 |
| Status filter | Select (Radix) | Toolbar | `03-component-ux-standards.md` §4 |
| Branch filter | Select (Radix) | Toolbar | — |
| "Clear All" link | Link | Toolbar | IN-10 |
| Filter chip | Badge (removable) | Toolbar | `03-component-ux-standards.md` §4.3 |
| Screen Card | Card | Grid | — |
| Status Badge | Badge (colored) | Card | VH-04 |
| Screen name | Text (medium) | Card | — |
| Current content | Text (muted) | Card | — |
| Branch name | Text (muted) | Card | — |
| Last seen | Text (muted, xs) | Card | — |
| Card checkbox | Checkbox | Card | IN-07 |
| "More" button | Button (icon, ghost) | Card | — |
| Bulk action bar | Bar | Bulk | `04-feature-ux-standards.md` §2.2 |
| Selection count | Text | Bulk | — |
| "Assign Content" button | Button (outline) | Bulk | — |
| "Delete" button | Button (destructive) | Bulk | UP-09 |
| "Clear" link | Link | Bulk | — |
| Pagination | Pagination | Pagination | `03-component-ux-standards.md` §2.4 |
| Empty State | EmptyState | Grid | `02-state-guidelines.md` §1 |
| Skeleton Card | Skeleton | Grid | DD-06 |

### 11. Interaction Rules

| Interaction | Element | Behavior | Evidence |
|-------------|---------|----------|----------|
| Click | Screen card | Navigate to `/screens/{id}` | IN-01 |
| Click | "Add Screen" | Navigate to `/screens/pair` | — |
| Click | Filter dropdown | Opens Radix Popover | — |
| Click | Filter chip "×" | Removes that filter | IN-10 |
| Click | Card checkbox | Toggles selection | IN-07 |
| Shift+click | Card checkbox | Selects range | IN-06 |
| Click | "Select All" (header) | Selects all matching items | `04-feature-ux-standards.md` §2.2 |
| Click | Bulk "Delete" | Opens AlertDialog | UP-09 |
| Click | Bulk "Assign Content" | Opens playlist selector dialog | — |
| Hover | Card | Border intensifies | MI-02 |
| Keyboard | Tab | Through toolbar → cards → pagination | ACC-02 |
| Keyboard | Enter | Activates focused card (navigate to detail) | IN-03 |
| Keyboard | Escape | Deselects all, closes filters | IN-03 |
| Search | Type | Debounced 300ms, filters list | IN-09 |

### 12. State Changes

| State | Trigger | UI | Evidence |
|-------|---------|-----|----------|
| Idle | Data cached | Grid with cards | — |
| Loading | Initial load | 6-8 skeleton cards | DD-06 |
| Refreshing | SWR revalidation | Subtle opacity pulse | — |
| Empty — no screens | 0 screens | Empty state: "No screens" + "Add Screen" CTA | `02-state-guidelines.md` §1.4 |
| Empty — filtered | Filters return 0 | "No screens match your filters" + "Clear Filters" | `02-state-guidelines.md` §1.3 |
| Error — fetch failed | API error | Error state in grid area + "Retry" | `02-state-guidelines.md` §3 |
| Bulk selected | ≥ 1 selected | Bulk action bar appears | `04-feature-ux-standards.md` §2 |
| Realtime — status change | Socket event | Card status badge updates + toast | `04-feature-ux-standards.md` §1 |
| Deleting | Bulk delete confirmed | Spinner on delete button + cards dim | IP-05 |
| Success — delete | API 200 | Toast: "[N] screens deleted" + grid refreshes | `02-state-guidelines.md` §5.1 |

### 13. Feedback Rules

| Event | Feedback | Duration |
|-------|----------|----------|
| Screen goes offline | Toast (red) + card badge updates | 5s |
| Screen comes online | Card badge updates (no toast) | — |
| Bulk delete success | Toast: "[N] screens deleted" | 5s |
| Bulk delete error | Toast: "Failed to delete [N] screens" | Persistent |
| Search no results | Empty state in grid | — |
| Filter applied | Grid updates + chips appear | — |

### 14. Decision Points

| Decision | Context | Choices | Consequences | Default |
|----------|---------|---------|-------------|---------|
| Add or manage? | Landing on screen list | Add new screen or manage existing | Add: pairing wizard. Manage: click card | — |
| Bulk or individual? | Multiple screens need same content | Bulk assign or individual assign | Bulk: select + assign. Individual: click each | Bulk if > 1 |
| Delete or troubleshoot? | Screen is offline | Delete or troubleshoot | Delete: removes from system. Troubleshoot: view detail | Troubleshoot first |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Delete wrong screen | AlertDialog with screen name + impact count | UP-09 — must confirm |
| Bulk select wrong items | Selection count is visible, "Clear" available | Click "Clear" to deselect |
| Filter too aggressively | Filter chips visible, "Clear All" available | Click "Clear All" |
| Miss offline screen | Red badge is visually prominent | Sort by status (offline first) |

### 16. Accessibility

| Element | Rule | Evidence |
|---------|------|----------|
| Keyboard | Tab through toolbar, cards, pagination | ACC-02 |
| Screen reader | Card has `aria-label` with screen name + status | ACC-03 |
| ARIA | Status badge has `aria-label` (e.g., "Online") | ACC-03 |
| Focus order | Toolbar → grid → pagination | ACC-02 |
| Contrast | Status badges meet 3:1 | ACC-01 |
| Touch targets | Cards ≥ 44px height, buttons ≥ 44px | PR-45 |

### 17. Mobile Experience

| Element | Mobile | Evidence |
|---------|--------|----------|
| Grid | 1 column | `04-feature-ux-standards.md` §3.2 |
| Toolbar | Full width, search and filters stacked | — |
| Filters | Dropdown or bottom sheet | — |
| Bulk actions | Same bar, full width | — |
| Cards | Full width, horizontal layout (icon + info) | — |
| "Add Screen" | Full width button | — |

### 18. Performance UX

| Concern | Strategy | Evidence |
|---------|----------|----------|
| Initial load | 6-8 skeleton cards | DD-06 |
| Large lists (200+) | Pagination (20 per page) + search | SCL-02 |
| Virtualization | Future: react-window for 200+ | SCL-02 |
| Image thumbnails | Lazy load (Intersection Observer) | — |
| Realtime | Socket.IO → SWR revalidation | `13-frontend-state-boundaries.md` |

### 19. Future Expansion

| Feature | Placement | Evidence |
|---------|-----------|----------|
| Map view | Toggle in toolbar (list ↔ map) | F-FU-03 |
| Screen groups | New filter dimension | — |
| Live screenshot | Card thumbnail (live preview) | F-FU-02 |
| Remote reboot | Bulk action + card "More" menu | F-FU-01 |
| OTA updates | Bulk action + card "More" menu | F-FU-04 |
| Export | Bulk action | — |
| Saved filter presets | In filter bar | — |

### 20. UX Notes
- Screen status is the most important visual element — it must be immediately visible on each card
- Bulk operations are critical for enterprise users managing 50+ screens
- Branch filter should default to "All" but remember last selection within session
- Sort by status (offline first) should be available to help users find problems quickly
- Card design should be compact enough to show 8-12 screens above the fold on desktop
- Consider adding a "health summary" strip at the top showing online/offline counts (mini version of Overview widget)

---

## P-SC-02: Screen Detail

### 1. Purpose
- **Business purpose:** Per-screen management and troubleshooting
- **User purpose:** Check screen status, change content, troubleshoot issues
- **Success criteria:** User can assess screen status and take action within 10 seconds
- **Failure criteria:** User can't find current content; can't change content; can't see schedules

### 2. Target Users
- **Primary user:** Workspace Owner, Editor
- **Secondary user:** Viewer (read-only)
- **Permissions:** Owner/Editor: assign, override, edit. Viewer: read-only.
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Primary troubleshooting and per-screen management page

### 4. Primary Goal
Assess screen status and manage its content

### 5. Primary Action
"Assign Content" (playlist selector dialog)

### 6. Secondary Actions
1. Override content (emergency override)
2. Edit current playlist (→ Studio)
3. View analytics (→ Analytics, screen-filtered)
4. View schedules (→ Scheduling, screen-filtered)
5. Delete screen (→ AlertDialog)
6. Reboot screen (future)

### 7. Information Priority
1. Screen status (online/offline/warning) — **most important**
2. Screen name — **identification**
3. Current content (playlist name + preview) — **what's showing**
4. Active schedules — **what's scheduled**
5. Screen metadata (branch, pairing code, last seen) — **context**
6. Recent events — **troubleshooting**

### 8. Visual Hierarchy

**Above the fold:**
- Back button + breadcrumb (Screens / [Name])
- Screen name + status badge
- "Assign Content" primary action button
- Current content section (playlist name + preview thumbnail)

**Middle:**
- Active schedules section
- Screen info section (branch, pairing code, last seen)

**Bottom:**
- Recent events section (last 5 events for this screen)

**Collapsed:**
- Advanced settings (orientation, resolution — future)
- Event log (full history)

**Hidden:**
- Technical details (MAC, IP — admin only)
- Pairing history

### 9. Page Sections

#### Section 1: Header
- **Purpose:** Screen identification and primary action
- **Priority:** 1
- **Contents:** Back button, breadcrumb, screen name, status badge, "Assign Content" button
- **Dependencies:** `useApiScreen` (SWR by ID)
- **Visibility:** Always

#### Section 2: Current Content
- **Purpose:** Show what's currently playing
- **Priority:** 1
- **Contents:** Playlist name, preview thumbnail/video, "Edit Playlist" link, "Override" button
- **Dependencies:** Current playlist data
- **Visibility:** Always (empty state if no content assigned)
- **Future:** Live screenshot preview

#### Section 3: Active Schedules
- **Purpose:** Show scheduled content for this screen
- **Priority:** 2
- **Contents:** List of active schedules (playlist, time range, recurrence)
- **Dependencies:** `useApiSchedules` (filtered by screen ID)
- **Visibility:** Always (empty state if no schedules)
- **Future:** Timeline view of schedules

#### Section 4: Screen Info
- **Purpose:** Metadata and configuration
- **Priority:** 3
- **Contents:** Branch, pairing code, last seen, orientation, resolution
- **Dependencies:** Screen data
- **Visibility:** Always

#### Section 5: Recent Events
- **Purpose:** Troubleshooting support
- **Priority:** 3
- **Contents:** Last 5 events (status changes, content changes, schedule events)
- **Dependencies:** Event log (SWR)
- **Visibility:** Always (empty state if no events)
- **Future:** Full event log page, crash reports

#### Section 6: Danger Zone
- **Purpose:** Destructive actions
- **Priority:** 4
- **Contents:** "Delete Screen" button (destructive)
- **Visibility:** Owner/Editor only
- **Future:** "Transfer to workspace" (admin)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Back button | Button (icon, outline) | Header |
| Breadcrumb | Breadcrumb | Header |
| Screen name | Text (h1) | Header |
| Status Badge | Badge (colored, large) | Header |
| "Assign Content" button | Button (default) | Header |
| "More" menu | DropdownMenu | Header |
| Playlist name | Text (medium) | Current Content |
| Preview thumbnail | Image | Current Content |
| "Edit Playlist" link | Link | Current Content |
| "Override" button | Button (outline) | Current Content |
| Schedule item | List item | Active Schedules |
| Schedule time | Text | Active Schedules |
| Schedule playlist | Text | Active Schedules |
| "View All Schedules" link | Link | Active Schedules |
| Info row | Key-value | Screen Info |
| Branch name | Text | Screen Info |
| Pairing code | Text (mono) | Screen Info |
| Last seen | Text (muted) | Screen Info |
| Event item | List item | Recent Events |
| Event icon | Icon | Recent Events |
| Event timestamp | Text (muted) | Recent Events |
| "Delete Screen" button | Button (destructive) | Danger Zone |
| Empty State | EmptyState | Current Content (if no content) |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Assign Content" | Opens playlist selector dialog |
| Click | "Override" | Opens playlist selector dialog (emergency mode) |
| Click | "Edit Playlist" | Navigates to `/content/playlists/{id}/studio` |
| Click | Schedule item | Navigates to `/scheduling` (focused) |
| Click | "View All Schedules" | Navigates to `/scheduling` (filtered by screen) |
| Click | "Delete Screen" | Opens AlertDialog |
| Click | "More" menu | Opens dropdown (Edit, Analytics, Reboot-future) |
| Hover | Schedule item | Subtle background |
| Keyboard | Tab | Through sections |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | All sections with data |
| Loading | Initial load | Skeleton header + skeleton sections |
| Empty — no content | No playlist assigned | "No content assigned" + "Assign Content" CTA |
| Empty — no schedules | No active schedules | "No active schedules" + "Create Schedule" link |
| Realtime — status change | Socket event | Status badge updates + toast |
| Assigning | Dialog submit | Dialog button spinner |
| Success — assign | API 200 | Toast: "Content assigned" + Current Content updates |
| Deleting | AlertDialog confirm | Spinner on delete button |
| Success — delete | API 200 | Toast: "Screen deleted" + redirect to `/screens` |
| Error — not found | 404 | "This screen doesn't exist" + "Back to Screens" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Content assigned | Toast: "Content assigned to [Screen Name]" |
| Override activated | Toast (amber): "Override active on [Screen Name]" |
| Screen deleted | Toast: "[Screen Name] deleted" + redirect |
| Status change | Toast (red for offline, no toast for online) |
| Assign error | Toast: "Failed to assign content: [message]" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Assign or override? | Need to change content | Assign (normal) or Override (emergency) | Assign |
| Edit or create new? | Current content needs changes | Edit current playlist or create new | Edit (fewer steps) |
| Delete or troubleshoot? | Screen is offline | Delete or troubleshoot | Troubleshoot |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Override and forget | Override shows amber indicator + toast | Override auto-expires (duration setting) |
| Delete screen with active schedules | AlertDialog: "[N] schedules will be affected" | Must confirm |
| Assign to wrong screen | Dialog shows screen name | Verify before confirm |

### 16. Accessibility
- Same as Screen List (§16) plus:
- Breadcrumb has `nav` role with `aria-label`
- Status badge has `aria-label` with full status text
- Sections have `aria-labelledby` pointing to section titles

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column, stacked sections |
| Header | Back button + title + "More" menu (actions in menu) |
| Current Content | Full width preview |
| Schedules | Full width list |
| Info | Key-value rows, full width |
| "Assign Content" | Full width button |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Initial load | Skeleton header + sections |
| Preview | Lazy load thumbnail, video on demand |
| Realtime | Socket.IO → SWR revalidation |
| Sections | Parallel SWR fetches (screen, schedules, events) |

### 19. Future Expansion

| Feature | Placement | Evidence |
|---------|-----------|----------|
| Live screenshot | Current Content section (replace thumbnail) | F-FU-02 |
| Remote reboot | "More" menu | F-FU-01 |
| Screen timeline | New section (visual timeline of schedules) | — |
| Crash reports | Recent Events section (new tab) | F-FU-13 |
| Multi-zone status | Current Content section (show zones) | F-FU-05 |

### 20. UX Notes
- Current Content is the most important section — users come here to check "what's showing"
- "Edit Playlist" is a critical cross-navigation link (screen → content)
- Override should be visually distinct (amber) to remind user it's temporary
- Pairing code should be shown in monospace font for easy reading
- "Last seen" should be relative ("2m ago") for quick assessment
- Delete confirmation must mention schedule impact

---

## P-SC-03: Screen Pairing Wizard

### 1. Purpose
- **Business purpose:** Screen fleet growth; 5-minute KPI
- **User purpose:** Connect a physical screen to the platform
- **Success criteria:** Screen paired within 2 minutes
- **Failure criteria:** User can't complete pairing; confusing steps; no guidance

### 2. Target Users
- **Primary user:** Workspace Owner, Editor
- **Permissions:** Owner/Editor only (not Viewer)
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Essential for 5-minute KPI; screen fleet growth

### 4. Primary Goal
Pair a physical screen to the workspace

### 5. Primary Action
"Pair Screen" (final step button)

### 6. Secondary Actions
1. Cancel (return to screen list)
2. Skip optional step (branch assignment)
3. Back (previous step)

### 7. Information Priority
1. Pairing code (user input from physical screen) — **required**
2. Screen name (user input) — **required**
3. Branch selection — **optional**
4. Success confirmation — **final**

### 8. Visual Hierarchy

**Above the fold:**
- Step indicator (Step 1/3, Step 2/3, Step 3/3)
- Step content (input fields, instructions)
- Navigation buttons (Back, Next)

**Collapsed:**
- Help text ("Where do I find the pairing code?")

**Hidden:**
- Advanced settings (orientation, resolution — auto-detected)

### 9. Page Sections

#### Step 1: Pairing Code
- **Purpose:** Enter the code displayed on the physical screen
- **Contents:** Instruction text, pairing code input (6-character), help tooltip
- **Validation:** Required, 6 characters, alphanumeric

#### Step 2: Screen Name
- **Purpose:** Give the screen a recognizable name
- **Contents:** Name input, suggestion (e.g., "Screen-001"), help text
- **Validation:** Required, min 2 chars, max 50 chars

#### Step 3: Branch (Optional)
- **Purpose:** Assign screen to a branch (location)
- **Contents:** Branch selector dropdown, "Skip" button
- **Validation:** Optional

#### Success State
- **Purpose:** Confirm pairing and guide to next step
- **Contents:** Checkmark animation, "Screen paired successfully", next-step CTA ("Assign content" → `/content`)

### 10. Component Inventory

| Component | Type | Step |
|-----------|------|------|
| Step indicator | Progress (dots) | All |
| Cancel button | Button (ghost) | Header |
| Instruction text | Text | Step 1, 2, 3 |
| Pairing code input | Input (text, mono, large) | Step 1 |
| Help tooltip | Tooltip (Radix) | Step 1 |
| Screen name input | Input (text) | Step 2 |
| Name suggestion | Text (muted) | Step 2 |
| Branch selector | Select (Radix) | Step 3 |
| "Skip" button | Button (ghost) | Step 3 |
| Back button | Button (outline) | Step 2, 3 |
| Next button | Button (default) | Step 1, 2 |
| "Pair Screen" button | Button (default) | Step 3 |
| Success checkmark | Animation (MI-11) | Success |
| Success message | Text | Success |
| "Assign Content" CTA | Button (default) | Success |
| "Back to Screens" link | Link | Success |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Next" | Validates current step, advances |
| Click | "Back" | Returns to previous step (preserves input) |
| Click | "Skip" | Skips optional step, proceeds to final |
| Click | "Pair Screen" | Submits pairing request |
| Click | "Cancel" | Returns to `/screens` (confirms if inputs exist — future) |
| Keyboard | Enter | Submits current step (same as "Next") |
| Keyboard | Escape | Returns to `/screens` (same as "Cancel") |
| Type | Pairing code | Auto-advances to next field when 6 chars entered |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Step load | Form ready |
| Validating | "Next" clicked | Button spinner (brief) |
| Error — invalid code | API 400/404 | Inline: "Invalid pairing code. Check the code on your screen." |
| Error — code already used | API 409 | Inline: "This screen is already paired to another workspace." |
| Pairing | "Pair Screen" clicked | Button spinner + "Pairing..." |
| Success | API 200 | Checkmark animation + success message + CTA |
| Error — network | API unreachable | Toast: "Network error" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Step advance | Slide transition (content only, not step indicator) |
| Pairing success | Checkmark animation (MI-11) + toast |
| Pairing error | Inline error on pairing code field |
| Invalid input | Red border + message below field |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Assign branch? | Step 3 | Assign to branch or skip | Skip (optional) |
| What to do after pairing? | Success state | Assign content or go to screen list | Assign content (5-min KPI) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Wrong pairing code | 6-char validation + help tooltip | Inline error, re-enter |
| Code from wrong screen | Instruction: "Check the code displayed on the screen you want to connect" | Re-enter |
| Skip naming | Name is required (can't skip) | Auto-suggest "Screen-001" |
| Forget to assign content | Post-pairing CTA: "Assign content" | Guided to content creation |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Full navigable; Tab through inputs → buttons |
| Screen reader | Step indicator has `aria-current="step"` |
| Focus | Input auto-focused on each step |
| Contrast | Step indicator meets 3:1 |
| Touch targets | All ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Full width, single column |
| Step indicator | Same (dots) |
| Inputs | Full width, large font |
| Buttons | Full width, stacked |
| Pairing code input | Large, monospace, easy to type |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | Instant (no data fetch, just form) |
| Pairing API | Show spinner during API call |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| WiFi configuration | New step (if player app supports) |
| QR code pairing | Step 1 alternative (scan instead of type) |
| Bulk pairing | Multiple codes at once |
| Auto-detect screen | No code needed (same network) |

### 20. UX Notes
- Wizard should be 2-3 steps maximum (locked decision)
- Step 3 (branch) is optional and skippable
- Post-pairing CTA is critical for 5-minute KPI — guide user to "Assign content"
- Pairing code input should be large and monospace for easy typing
- Consider QR code alternative for mobile users (scan code on screen)
- Success state should celebrate (checkmark animation) but not delay (immediate CTA)
- Wizard state should persist if user navigates back (don't lose inputs)

---

## Cross-References

- See `05-page-type-ux-rules.md` §3-4 for list and detail page type rules, §6 for wizard rules
- See `information-architecture/06-page-catalog.md` P-SC-01 through P-SC-03
- See `audits/frontend/09-screens-feature.md` for screens audit
- See `product-architecture/09-product-modules.md` M-02 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
