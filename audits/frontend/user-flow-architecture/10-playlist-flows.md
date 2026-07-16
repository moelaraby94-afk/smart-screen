# Playlist Flows

> **Evidence basis:** `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-01, P-CN-03, P-CN-04, `product-architecture/09-product-modules.md` M-03, `03-decision-trees.md` §3
> **Purpose:** Complete user flow documentation for Playlist Creation, Studio Editing, Playlist Detail, Playlist Delete, and Playlist Duplicate

---

## FL-PL-01: Playlist Creation

| Field | Value |
|-------|-------|
| Flow ID | FL-PL-01 |
| Flow Name | Playlist Creation |
| Purpose | Create a new playlist (from template or blank) |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content creation; 5-minute KPI |
| User Goal | Create a playlist to publish to screens |
| Starting Point | `/content` (click "Create Playlist") |
| Ending Point | Playlist detail page or Studio |
| Success Criteria | Playlist created and user directed to next step |
| Failure Criteria | API failure |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate creation**
- Screen: `/content` (Playlists tab)
- User Action: Clicks "Create Playlist"
- System Response: Opens template picker dialog (5-min KPI: templates first)
- Permission Check: 🔒 Owner or Editor (button hidden for Viewer)

**Step 2: Choose template or blank**
- Screen: Template picker dialog
- UI: Grid of templates (e.g., "Single Image", "Image Slideshow", "Video Loop", "Mixed Content") + "Blank" option
- User Action: Selects template or clicks "Blank"
- ◇ Decision: Template or blank? (see `03-decision-trees.md` §3)

**Step 3a: Template selected**
- System Response: API call to create playlist from template
- Loading: Dialog spinner
- Success: Playlist created with template structure
- Navigation: Navigate to playlist detail (`/content/playlists/{id}`)
- Feedback: Toast: "Playlist created from [Template Name]"
- State Transition: (none) → DRAFT

**Step 3b: Blank selected**
- System Response: API call to create empty playlist
- Loading: Dialog spinner
- Success: Empty playlist created
- Navigation: Navigate to Studio (`/content/playlists/{id}/studio`)
- Feedback: Toast: "Playlist created"
- State Transition: (none) → NEW → (Studio opens)

### Alternative Paths

**AP-1: Create from Overview quick action**
- User on Overview clicks "Create Playlist" quick action
- Same flow from Step 1

**AP-2: Create from Screen Detail**
- User on Screen Detail clicks "Create Playlist" (if no playlists exist)
- Same flow from Step 1

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to create playlist. Try again."
- Recovery: User retries

### Cancellation Path
- User closes template picker dialog → no playlist created

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Template vs. blank | Medium — user unsure which to choose | Templates have previews and descriptions |
| Template complexity | Low — templates are pre-built | Template names are self-explanatory |

---

## FL-PL-02: Playlist Editing (Studio)

| Field | Value |
|-------|-------|
| Flow ID | FL-PL-02 |
| Flow Name | Playlist Editing (Studio) |
| Purpose | Design or modify playlist content visually using the Studio canvas editor |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content creation; product differentiation |
| User Goal | Create or edit visual content for screens |
| Starting Point | `/content/playlists/{id}/studio` |
| Ending Point | Studio (saved) or playlist detail (published) |
| Success Criteria | Playlist saved with desired content |
| Failure Criteria | Data loss (no auto-save — FR-01); Studio load failure |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | High |

### Happy Path

**Step 1: Open Studio**
- Screen: `/content/playlists/{id}/studio`
- System Response: Loads Studio (Konva.js); splash screen during load
- Loading: Splash screen with logo + spinner (Konva is heavy)
- State Transition: DRAFT → EDITING
- Micro Interaction: Splash screen fades to Studio (MI-08, 300ms)
- Performance: Load time 1-3s depending on playlist complexity

**Step 2: Add media to canvas**
- Screen: Studio (Media Panel, left side)
- User Action: Clicks media item in library OR drags media to canvas
- System Response: Media added as new layer on canvas
- Data Required: Media ID, position, size
- State Transition: Canvas updated (unsaved changes)
- Micro Interaction: Media appears on canvas at drop position (MI-03)
- Accessibility: Media items are keyboard navigable; Enter adds to canvas
- Mobile: N/A (Studio is desktop only — shows "Desktop only" message)

**Step 3: Arrange layers**
- Screen: Studio (Canvas + Timeline)
- User Action: Drags elements on canvas to position; drags layers in timeline to reorder
- System Response: Canvas updates in real-time; timeline updates
- Micro Interaction: Elements move with cursor (drag); timeline items reorder with animation
- Keyboard: Arrow keys to nudge selected element (1px; 10px with Shift)

**Step 4: Configure properties**
- Screen: Studio (Properties Panel, right side)
- User Action: Adjusts position (X, Y), size (W, H), rotation, opacity, duration
- System Response: Canvas updates in real-time as properties change
- Micro Interaction: Sliders and inputs update canvas live
- Accessibility: Property inputs have `aria-label` (e.g., "X position")

**Step 5: Save playlist**
- Screen: Studio (Header)
- User Action: Clicks "Save" button
- System Response: API call to save playlist content
- Validation: None (any state is savable)
- Loading: Button spinner + "Saving..."
- Success: Toast: "Playlist saved"
- State Transition: EDITING → DRAFT (saved)
- Keyboard: Ctrl+S (future)

### Alternative Paths

**AP-1: Add text layer**
- User clicks "Add Text" in timeline or toolbar
- Text layer appears on canvas; properties panel shows text editing options
- User types text, adjusts font, size, color

**AP-2: Preview playlist**
- User clicks "Preview" in header
- Overlay appears with playing content (auto-playing)
- User clicks anywhere to close preview

**AP-3: Publish from Studio**
- User clicks "Publish" in header (future)
- Navigate to playlist detail → publish flow (FL-PUB-01)

**AP-4: Delete layer**
- User selects layer on canvas or in timeline
- Presses Delete key or clicks "Delete" in properties
- Layer removed from canvas and timeline
- Micro Interaction: Layer fades out (MI-09, 150ms)

### Failure Paths

**FP-1: Studio load failure**
- Trigger: Konva fails to load (browser incompatibility, JS error)
- UI: Error screen: "Studio failed to load. Try refreshing the page."
- Recovery: User refreshes browser

**FP-2: Save failure**
- Trigger: API returns error
- UI: Toast: "Failed to save. Try again."
- Recovery: User retries save
- Critical: Unsaved changes are at risk (FR-01)

**FP-3: Data loss (browser crash)**
- Trigger: Browser crashes or tab closes
- UI: N/A (browser closed)
- Recovery: User reopens Studio; unsaved changes are lost
- Mitigation: Auto-save after 30s inactivity (F-MP-14, future)

**FP-4: Media not found in Studio**
- Trigger: Media referenced in playlist was deleted
- UI: Placeholder showing "Media unavailable" on canvas
- Recovery: User replaces with available media or removes layer

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Studio load failure | Refresh browser | Step 1 |
| Save failure | Retry save | Step 5 |
| Data loss | Re-open and redo changes | Step 1 |
| Media not found | Replace or remove layer | Step 2 |

### First-Time User Path
- Studio is overwhelming for first-time users (friction score: High)
- Template-based creation (FL-PL-01 Step 3a) is recommended for first-time users
- First-time users should be guided to simple templates, not blank Studio

### Returning User Path
- Same as Happy Path
- Knows panel layout and keyboard shortcuts

### Power User Path
- Keyboard shortcuts: Delete (remove layer), Ctrl+S (save — future), Ctrl+Z (undo — future)
- Drag media directly from library to canvas
- Use alignment guides for precise positioning
- Multi-select layers (future) for bulk operations

### Offline Path
- Network loss during save: Toast: "Connection lost. Save will retry when connected."
- Auto-retry save when connection restored
- If auto-retry fails: Manual save retry

### Timeout Path
- Save API > 10s: Toast: "Taking longer than expected..."
- Save timeout (30s): Toast: "Save timed out. Try again."

### Cancellation Path
- User clicks Back button → navigates to playlist detail
- (Future) If unsaved changes: AlertDialog: "Unsaved changes. Leave anyway?"
- User confirms → navigates away (changes lost)
- User cancels → stays in Studio

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Studio complexity | High — 3-panel layout is overwhelming | Template picker as default; progressive disclosure in panels |
| Layer management | Medium — timeline ordering | Drag-to-reorder with visual feedback |
| Save anxiety | Medium — fear of data loss | Auto-save (future); visible save button in header |
| Property precision | Low — inputs and sliders | Both typing and slider for precision |

---

## FL-PL-03: Playlist Detail View

| Field | Value |
|-------|-------|
| Flow ID | FL-PL-03 |
| Flow Name | Playlist Detail View |
| Purpose | View playlist preview, publish, edit, or manage |
| Primary User | All users (Viewer: read-only) |
| Business Goal | Content management; publishing hub |
| User Goal | Preview and publish or edit playlist |
| Starting Point | `/content` (click playlist card) |
| Ending Point | Playlist detail page (user takes action) |
| Success Criteria | User can preview and take action within 15 seconds |
| Failure Criteria | Playlist not found; API failure |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | Simple |

### Happy Path

**Step 1: Navigate to detail**
- Screen: `/content` (Playlists tab)
- User Action: Clicks playlist card
- System Response: Navigate to `/content/playlists/{id}`
- Navigation: `/content` → `/content/playlists/{id}`

**Step 2: View playlist**
- Screen: `/content/playlists/{id}`
- System Response: Parallel SWR fetches (playlist data, assigned screens)
- Loading: Skeleton header + sections
- UI: Header (name, status badge, "Publish to Screens" button), Preview, Media Items, Assigned Screens, Metadata
- Accessibility: Preview has `aria-label` describing content

### Alternative Paths

**AP-1: Edit in Studio**
- User clicks "Edit in Studio"
- Navigation: → `/content/playlists/{id}/studio` (FL-PL-02)

**AP-2: Publish**
- User clicks "Publish to Screens"
- Cross-flow: Links to FL-PUB-01

**AP-3: Create Schedule**
- User clicks "Create Schedule"
- Navigation: → `/scheduling` (pre-filled with playlist)
- Cross-flow: Links to FL-SCH-01

**AP-4: Duplicate**
- User clicks "More" → "Duplicate"
- API creates copy; toast: "Playlist duplicated"
- New playlist appears in grid

### Failure Paths

**FP-1: Playlist not found**
- UI: "This playlist doesn't exist or has been deleted." + "Back to Content"
- Recovery: Navigate to `/content`

**FP-2: API failure**
- UI: Error state + "Retry"
- Recovery: User retries

---

## FL-PL-04: Playlist Delete

| Field | Value |
|-------|-------|
| Flow ID | FL-PL-04 |
| Flow Name | Playlist Delete |
| Purpose | Remove playlist from workspace |
| Primary User | Editor, Workspace Owner |
| Business Goal | Cleanup; content management |
| User Goal | Remove unwanted playlist |
| Starting Point | `/content` (card "More" menu) or `/content/playlists/{id}` (Danger Zone) |
| Ending Point | `/content` (playlist removed) |
| Success Criteria | Playlist deleted, redirected to content list |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate delete**
- Screen: `/content` or `/content/playlists/{id}`
- User Action: Clicks "Delete" (from "More" menu or Danger Zone)
- System Response: Opens AlertDialog
- Permission Check: 🔒 Owner or Editor

**Step 2: Confirm deletion**
- Screen: AlertDialog
- UI: "Delete [Playlist Name]?" with warning: "Published to [N] screens. Screens will stop playing this content."
- User Action: Clicks "Delete" (destructive button)
- Focus: Default on "Cancel"
- Loading: Spinner on delete button

**Step 3: Deletion success**
- System Response: API returns 200
- State Transition: Any → DELETED
- Navigation: Redirect to `/content`
- Feedback: Toast: "Playlist deleted"

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to delete playlist. Try again."
- Recovery: User retries

### Cancellation Path
- User clicks "Cancel" → dialog closes, no action

---

## FL-PL-05: Playlist Duplicate

| Field | Value |
|-------|-------|
| Flow ID | FL-PL-05 |
| Flow Name | Playlist Duplicate |
| Purpose | Create a copy of an existing playlist |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content efficiency; variant creation |
| User Goal | Create a variant without starting from scratch |
| Starting Point | `/content` (card "More" menu) or `/content/playlists/{id}` |
| Ending Point | `/content` (new playlist appears) |
| Success Criteria | Duplicate created with "(Copy)" suffix |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Low |
| Complexity | Simple |

### Happy Path

**Step 1: Initiate duplicate**
- Screen: `/content` or `/content/playlists/{id}`
- User Action: Clicks "Duplicate" (from "More" menu or Actions section)
- System Response: API call to duplicate playlist
- Permission Check: 🔒 Owner or Editor
- Loading: Brief spinner on card or button

**Step 2: Duplication success**
- System Response: API returns new playlist ID
- Success: New playlist appears in grid with name "[Original Name] (Copy)"
- Feedback: Toast: "Playlist duplicated"
- State Transition: (none) → DRAFT (new playlist)

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to duplicate playlist. Try again."
- Recovery: User retries

### Cancellation Path
- N/A (one-click action, no confirmation needed — non-destructive)

---

## Cross-References

- See `03-decision-trees.md` §3 for playlist creation decision tree
- See `04-state-machines.md` §2 for playlist state machine
- See `05-cross-flow-relationships.md` §5.1 for create-publish chain
- See `ux-blueprint/09-content-studio-ux-blueprint.md` for content and Studio UX blueprints
- See `11-publishing-flows.md` for publishing and scheduling flows
- See `product-architecture/09-product-modules.md` M-03 for content module
