# Content & Studio UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md` §3-5, `information-architecture/06-page-catalog.md` P-CN-01 through P-CN-04, `audits/frontend/10-playlists-and-studio.md`, `audits/frontend/11-media-library.md`, `product-architecture/09-product-modules.md` M-03
> **Purpose:** Complete UX blueprint for Content (Playlists + Media tabs), Playlist Detail, and Studio

---

## P-CN-01: Content — Playlists Tab

### 1. Purpose
- **Business purpose:** Primary content creation and management target
- **User purpose:** Browse, create, and manage playlists
- **Success criteria:** User finds or creates a playlist within 15 seconds
- **Failure criteria:** User can't find playlists; confusing tab structure; no create CTA

### 2. Target Users
- **Primary user:** Editor (create/manage), Workspace Owner
- **Secondary user:** Viewer (browse only)
- **Permissions:** Owner/Editor: full CRUD. Viewer: read-only.
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Entity priority #3; primary creation target; 5-minute KPI

### 4. Primary Goal
Find or create a playlist

### 5. Primary Action
"Create Playlist" (template picker or blank)

### 6. Secondary Actions
1. Search playlists by name
2. Filter (has media, published status — future)
3. Switch to Media tab
4. Click playlist card → Playlist detail
5. Sort by name, last modified, created date
6. Duplicate playlist (card "More" menu)
7. Delete playlist (card "More" menu → AlertDialog)

### 7. Information Priority
1. Playlist name — **identification**
2. Playlist thumbnail (first media item) — **visual recognition**
3. Media count — **content scope**
4. Published status (published/draft) — **deployment state**
5. Last modified — **freshness**
6. Assigned screens count — **reach**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Content" + tab bar (Playlists | Media)
- "Create Playlist" button (top-end)
- Search bar

**Middle:**
- Playlist card grid (3-4 columns desktop, 2 tablet, 1 mobile)

**Bottom:**
- Pagination

**Collapsed:**
- Filters (media count, published status)
- Sort options

**Progressive disclosure:**
- Card shows: thumbnail, name, media count, status. Click → detail shows: preview, screens, schedules.

### 9. Page Sections

#### Section 1: Tab Bar
- **Purpose:** Switch between Playlists and Media
- **Priority:** 1
- **Contents:** "Playlists" tab (active), "Media" tab
- **Visibility:** Always
- **Future:** "Templates" tab (future)

#### Section 2: Toolbar
- **Purpose:** Search, filter, create
- **Priority:** 1
- **Contents:** Search input, filter dropdowns, "Create Playlist" button
- **Visibility:** Always

#### Section 3: Playlist Grid
- **Purpose:** Display playlists as cards
- **Priority:** 1
- **Contents:** Playlist cards with thumbnail, name, media count, status
- **Dependencies:** `useApiPlaylists` (SWR, workspace-scoped, paginated)
- **Visibility:** Always (empty state if no playlists)
- **Future:** Virtualization for 100+ playlists

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix) | Tab Bar |
| "Playlists" tab | Tab trigger | Tab Bar |
| "Media" tab | Tab trigger | Tab Bar |
| "Create Playlist" button | Button (default) | Toolbar |
| Search input | Input (text) | Toolbar |
| Filter dropdown | Select (Radix) | Toolbar |
| Playlist Card | Card | Grid |
| Playlist thumbnail | Image (16:9) | Card |
| Playlist name | Text (medium) | Card |
| Media count | Badge | Card |
| Published status | Badge (colored) | Card |
| Last modified | Text (muted) | Card |
| Assigned screens | Text (muted) | Card |
| "More" button | Button (icon, ghost) | Card |
| Empty State | EmptyState | Grid |
| Skeleton Card | Skeleton | Grid |
| Pagination | Pagination | Bottom |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Playlists" tab | Shows playlist grid (already active) |
| Click | "Media" tab | Navigates to `/content/media` |
| Click | "Create Playlist" | Opens template picker dialog or navigates to Studio |
| Click | Playlist card | Navigates to `/content/playlists/{id}` |
| Click | "More" menu | Opens dropdown (Duplicate, Delete) |
| Click | "Delete" | Opens AlertDialog |
| Hover | Card | Border intensifies (MI-02) |
| Search | Type | Debounced 300ms |
| Keyboard | Tab | Through tabs → toolbar → cards |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Grid with cards |
| Loading | Initial load | 6-8 skeleton cards |
| Empty — no playlists | 0 playlists | "No playlists yet" + "Create Playlist" CTA |
| Empty — filtered | Filters return 0 | "No playlists match your filters" + "Clear Filters" |
| Error — fetch | API error | Error state + "Retry" |
| Deleting | AlertDialog confirm | Spinner on delete button |
| Success — delete | API 200 | Toast: "Playlist deleted" + grid refreshes |
| Success — duplicate | API 200 | Toast: "Playlist duplicated" + grid refreshes |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Playlist created | Toast: "Playlist created" + navigate to detail or Studio |
| Playlist deleted | Toast: "[Name] deleted" |
| Playlist duplicated | Toast: "[Name] duplicated" |
| Tab switch | Content fades in (MI-08) |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Template or blank? | Creating new playlist | Template (pre-built) or blank Studio | Template (5-min KPI) |
| Edit or duplicate? | Existing playlist needs variant | Edit in Studio or duplicate then edit | Duplicate (preserves original) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Delete published playlist | AlertDialog: "This playlist is published to [N] screens" | Must confirm |
| Create duplicate name | No prevention (names not unique) | Rename after creation |

### 16. Accessibility
- Tab bar has `role="tablist"`, tabs have `role="tab"` (Radix provides)
- Cards have `aria-label` with playlist name + media count
- Focus order: tabs → search → create button → cards

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Tabs | Horizontal scroll if needed |
| Grid | 1 column |
| Cards | Full width, horizontal layout |
| "Create Playlist" | Full width button |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Thumbnails | Lazy load (Intersection Observer) |
| Large lists | Pagination (20 per page) |
| Tab switch | SWR cache for both tabs (instant switch) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Templates tab | New tab in tab bar |
| Version history | Playlist detail → Versions tab |
| A/B testing | New badge on card |
| Auto-expiry | Badge on card (expiry date) |
| Nested playlists | Card indicator (contains playlists) |

### 20. UX Notes
- "Create Playlist" should open a template picker first (5-min KPI), not go directly to blank Studio
- Thumbnail should show first media item or a collage of items
- Published status badge is important — users need to know what's live
- Tab switch between Playlists and Media should be instant (SWR cache)
- Consider showing "assigned to [N] screens" on card for reach awareness

---

## P-CN-02: Content — Media Tab

### 1. Purpose
- **Business purpose:** Media asset management; storage tracking
- **User purpose:** Browse, upload, and manage media files
- **Success criteria:** User uploads media within 30 seconds; user finds media within 10 seconds
- **Failure criteria:** Upload fails silently; no storage indicator; can't find media

### 2. Target Users
- **Primary user:** Editor (upload/manage), Workspace Owner
- **Secondary user:** Viewer (browse only)
- **Permissions:** Owner/Editor: upload, delete. Viewer: read-only.

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Entity priority #4; required for content creation

### 4. Primary Goal
Find or upload media files

### 5. Primary Action
"Upload" (multi-file, drag-drop dialog)

### 6. Secondary Actions
1. Search media by filename
2. Filter by type (image/video)
3. Click media → Media detail (future) or select for playlist
4. Delete media (card "More" menu → AlertDialog)
5. View storage usage indicator

### 7. Information Priority
1. Media thumbnail — **visual identification**
2. Filename — **text identification**
3. Type (image/video) — **categorization**
4. File size — **storage impact**
5. Upload date — **freshness**
6. Used in playlists count — **usage tracking** (future)

### 8. Visual Hierarchy

**Above the fold:**
- Tab bar (Playlists | Media) — Media active
- "Upload" button (top-end)
- Search bar + type filter
- Storage usage indicator (progress bar)

**Middle:**
- Media card grid (4-6 columns desktop, 3 tablet, 2 mobile)

**Bottom:**
- Pagination

### 9. Page Sections

#### Section 1: Storage Indicator
- **Purpose:** Show storage usage vs. plan limit
- **Priority:** 2
- **Contents:** Progress bar (used / limit), percentage, "Upgrade" link if near limit
- **Dependencies:** `useApiStorageUsage` (SWR)
- **Visibility:** Always (if storage data available)
- **Future:** Per-type breakdown (images vs. videos)

#### Section 2: Toolbar
- **Purpose:** Search, filter, upload
- **Priority:** 1
- **Contents:** Search input, type filter (image/video/all), "Upload" button
- **Visibility:** Always

#### Section 3: Media Grid
- **Purpose:** Display media as thumbnail cards
- **Priority:** 1
- **Contents:** Media cards with thumbnail, filename, type, size
- **Dependencies:** `useApiMedia` (SWR, workspace-scoped, paginated)
- **Visibility:** Always (empty state if no media)
- **Future:** "Used in playlists" indicator on card

#### Section 4: Upload Drop Zone (overlay)
- **Purpose:** Drag-drop file upload
- **Priority:** 1 (when active)
- **Contents:** Drop zone overlay with "Drop files here" text
- **Visibility:** When user drags files over the page
- **Future:** Progress bar per file

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Tab bar | Tabs (Radix) | Top |
| "Upload" button | Button (default) | Toolbar |
| Search input | Input (text) | Toolbar |
| Type filter | Select (Radix) | Toolbar |
| Storage progress bar | Progress | Storage |
| Storage text | Text (muted) | Storage |
| "Upgrade" link | Link | Storage |
| Media Card | Card | Grid |
| Media thumbnail | Image/Video | Card |
| Filename | Text (small) | Card |
| Type badge | Badge | Card |
| File size | Text (muted, xs) | Card |
| "More" button | Button (icon, ghost) | Card |
| Upload drop zone | Overlay | Upload |
| Upload progress | Progress (per file) | Upload |
| Empty State | EmptyState | Grid |
| Skeleton Card | Skeleton | Grid |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Upload" button | Opens upload dialog/drop zone |
| Drag | Files onto page | Shows drop zone overlay |
| Drop | Files onto drop zone | Starts upload, shows progress per file |
| Click | Media card | Opens media detail (future) or selects |
| Click | "More" menu | Opens dropdown (Delete, "Used in" info) |
| Click | "Delete" | Opens AlertDialog |
| Hover | Card | Border intensifies |
| Search | Type | Debounced 300ms |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Grid with cards |
| Loading | Initial load | 8-12 skeleton cards |
| Empty — no media | 0 media files | "No media uploaded yet" + "Upload Media" CTA |
| Empty — filtered | Filter returns 0 | "No [type] found" + "Clear Filter" |
| Uploading | File(s) dropped | Progress bar per file, cards dim |
| Upload success | All files complete | Toast: "[N] files uploaded" + grid refreshes |
| Upload error | File fails | Per-file error indicator + "Retry" |
| Near storage limit | Usage > 80% | Storage bar turns amber + "Upgrade" link |
| At storage limit | Usage = 100% | Storage bar turns red + "Upgrade" link, upload disabled |
| Deleting | AlertDialog confirm | Spinner on delete button |
| Success — delete | API 200 | Toast: "File deleted" + grid refreshes |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Upload complete | Toast: "[N] files uploaded successfully" |
| Upload error | Per-file error + toast: "[Filename] failed to upload" |
| Storage warning | Amber progress bar (no toast) |
| Storage limit | Red progress bar + toast: "Storage limit reached" |
| Delete success | Toast: "File deleted" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Upload via button or drag? | Uploading media | Button (browse) or drag-drop | Either (both supported) |
| Delete media used in playlist? | Media is used | AlertDialog: "This file is used in [N] playlists" | Must confirm |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Upload wrong file | File preview in upload dialog | Cancel upload |
| Upload too-large file | Client-side size check | Error: "File exceeds [N]MB limit" |
| Delete used media | AlertDialog with usage count | Must confirm |
| Exceed storage | Storage indicator + upload disabled | Upgrade plan or delete old media |

### 16. Accessibility
- Drop zone has keyboard accessible "browse" button
- Upload progress has `aria-valuenow` and `aria-label`
- Storage bar has `role="progressbar"` with `aria-valuenow`

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Grid | 2 columns |
| Upload | Button only (no drag-drop on mobile) |
| Storage | Full width progress bar |
| Cards | Smaller thumbnails |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Thumbnails | Lazy load (Intersection Observer) |
| Large libraries | Pagination (24 per page) |
| Upload | Parallel uploads (max 3 concurrent) |
| Video preview | Play on click, not on hover (bandwidth) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| "Used in playlists" indicator | Card badge |
| Media folders | New filter dimension |
| Bulk delete | Checkbox + bulk bar |
| Image editor (crop, resize) | Media detail dialog |
| AI media generation | "Generate" button in toolbar |

### 20. UX Notes
- Multi-file upload is critical (locked decision F-MP-16)
- Drag-drop should work on the entire page, not just a small zone
- Storage indicator should be proactive (amber at 80%, red at 100%)
- Video thumbnails should show first frame, not a play icon only
- Upload progress should be per-file, not a single aggregate bar
- Consider showing file dimensions (e.g., "1920×1080") for screen-fit awareness

---

## P-CN-03: Playlist Detail

### 1. Purpose
- **Business purpose:** Content preview and publishing
- **User purpose:** Preview playlist, publish to screens, edit in Studio
- **Success criteria:** User can preview and publish within 15 seconds
- **Failure criteria:** Can't preview; can't publish; confusing actions

### 2. Target Users
- **Primary user:** Editor, Workspace Owner
- **Secondary user:** Viewer (preview only)
- **Permissions:** Owner/Editor: edit, publish, delete. Viewer: preview only.

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Content publishing hub; cross-navigation point

### 4. Primary Goal
Preview and publish or edit a playlist

### 5. Primary Action
"Publish to Screens" (immediate or scheduled)

### 6. Secondary Actions
1. Edit in Studio (→ `/content/playlists/{id}/studio`)
2. Create Schedule (→ `/scheduling`, pre-filled)
3. Duplicate playlist
4. Delete playlist (→ AlertDialog)
5. View assigned screens (links to screen details)

### 7. Information Priority
1. Playlist name — **identification**
2. Live preview — **what it looks like**
3. Media items list — **content composition**
4. Assigned screens — **reach**
5. Playlist metadata (created, modified, duration) — **context**
6. Active schedules — **when it plays**

### 8. Visual Hierarchy

**Above the fold:**
- Back button + breadcrumb (Content / [Name])
- Playlist name + status badge (Published/Draft)
- "Publish to Screens" primary action button
- Live preview (large, centered or left)

**Middle:**
- Media items list (thumbnails in order)
- Assigned screens list

**Bottom:**
- Metadata (created date, modified date, total duration)
- Danger zone (delete)

### 9. Page Sections

#### Section 1: Preview
- **Purpose:** Show what the playlist looks like when playing
- **Priority:** 1
- **Contents:** Live preview component (auto-playing or click-to-play)
- **Dependencies:** Playlist media items
- **Visibility:** Always
- **Future:** Full-screen preview, preview on specific screen

#### Section 2: Media Items
- **Purpose:** Show content composition
- **Priority:** 2
- **Contents:** Ordered list of media items with thumbnails, names, duration
- **Visibility:** Always
- **Future:** Drag to reorder (in detail, not just Studio)

#### Section 3: Assigned Screens
- **Purpose:** Show where this playlist is playing
- **Priority:** 2
- **Contents:** List of screens with name, status, link to screen detail
- **Dependencies:** `useApiScreens` (filtered by playlist)
- **Visibility:** Always (empty state if not assigned)
- **Future:** Screen count badge, "Assign to more" button

#### Section 4: Metadata
- **Purpose:** Context information
- **Priority:** 3
- **Contents:** Created date, modified date, total duration, media count
- **Visibility:** Always

#### Section 5: Actions
- **Purpose:** Secondary actions
- **Priority:** 2
- **Contents:** "Edit in Studio", "Create Schedule", "Duplicate", "Delete"
- **Visibility:** Owner/Editor only

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Back button | Button (icon, outline) | Header |
| Breadcrumb | Breadcrumb | Header |
| Playlist name | Text (h1) | Header |
| Status badge | Badge (Published/Draft) | Header |
| "Publish to Screens" button | Button (default) | Header |
| "More" menu | DropdownMenu | Header |
| Live preview | Video/Image player | Preview |
| Media item | List item | Media Items |
| Media thumbnail | Image | Media Items |
| Media name | Text | Media Items |
| Media duration | Text (muted) | Media Items |
| Screen item | List item | Assigned Screens |
| Screen name | Text | Assigned Screens |
| Screen status | Badge | Assigned Screens |
| "View Screen" link | Link | Assigned Screens |
| Metadata row | Key-value | Metadata |
| "Edit in Studio" link | Link | Actions |
| "Create Schedule" link | Link | Actions |
| "Duplicate" button | Button (outline) | Actions |
| "Delete" button | Button (destructive) | Actions |
| Empty State | EmptyState | Assigned Screens (if none) |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Publish to Screens" | Opens screen selector dialog (immediate publish) |
| Click | "Edit in Studio" | Navigates to `/content/playlists/{id}/studio` |
| Click | "Create Schedule" | Navigates to `/scheduling` (pre-filled with playlist) |
| Click | Screen item | Navigates to `/screens/{id}` |
| Click | "Delete" | Opens AlertDialog |
| Click | Preview | Toggles play/pause |
| Hover | Media item | Subtle background |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | All sections with data |
| Loading | Initial load | Skeleton header + sections |
| Empty — no screens assigned | Not published | "Not published to any screen" + "Publish" CTA |
| Publishing | Dialog submit | Dialog button spinner |
| Success — publish | API 200 | Toast: "Published to [N] screens" + Assigned Screens updates |
| Deleting | AlertDialog confirm | Spinner |
| Success — delete | API 200 | Toast + redirect to `/content` |
| Error — not found | 404 | "Playlist not found" + "Back to Content" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Published | Toast: "Published to [N] screens" + next-step CTA: "View on screen" |
| Schedule created | Toast: "Schedule created" |
| Duplicated | Toast: "Playlist duplicated" |
| Deleted | Toast: "Playlist deleted" + redirect |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Publish now or schedule? | Publishing content | Immediate publish or create schedule | Immediate (locked default) |
| Edit or duplicate? | Need variant | Edit current or duplicate then edit | Duplicate (preserves original) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Delete published playlist | AlertDialog: "Published to [N] screens. Screens will stop playing." | Must confirm |
| Publish to wrong screen | Dialog shows screen names | Verify before confirm |

### 16. Accessibility
- Preview has `aria-label` describing playlist content
- Media items list has `role="list"` and items have `role="listitem"`
- Preview play/pause button has `aria-label`

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column |
| Preview | Full width |
| Media items | Horizontal scroll or stacked |
| Assigned screens | Full width list |
| Actions | In "More" menu |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Preview | Lazy load media, play on click |
| Media thumbnails | Lazy load |
| Sections | Parallel SWR fetches |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Version history | New tab or section |
| A/B test variant | Badge on header |
| Auto-expiry indicator | Badge on header |
| Full-screen preview | Preview button |
| Preview on specific screen | Preview dropdown |

### 20. UX Notes
- Live preview is the key feature — users need to see what their content looks like
- "Publish to Screens" is the primary action (locked: immediate publish is default)
- Cross-navigation to Studio and Scheduling is critical for workflow efficiency
- "Assigned screens" list provides immediate feedback on reach
- Post-publish CTA ("View on screen") prevents dead ends (UP-05)
- Consider showing total playlist duration for scheduling context

---

## P-CN-04: Studio (Canvas Editor)

### 1. Purpose
- **Business purpose:** Content creation tool; differentiation from template-based creation
- **User purpose:** Design or modify playlist content visually
- **Success criteria:** User can add media and save within 2 minutes
- **Failure criteria:** Overwhelming interface; can't save; can't add media

### 2. Target Users
- **Primary user:** Editor (content creator)
- **Secondary user:** Workspace Owner
- **Permissions:** Owner/Editor only (not Viewer)
- **Visibility:** Authenticated + has workspace; desktop only

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Primary content creation tool; but accessed via playlist, not standalone

### 4. Primary Goal
Create or edit playlist content and save

### 5. Primary Action
"Save" button

### 6. Secondary Actions
1. Add media (from library or upload)
2. Add text layer
3. Add shape (rectangle, circle — future)
4. Arrange layers (timeline)
5. Preview
6. Publish (from Studio)
7. Undo/Redo (future)

### 7. Information Priority
1. Canvas (visual editor) — **primary work area**
2. Layers/timeline — **content structure**
3. Media panel — **asset access**
4. Properties panel — **element configuration**
5. Save/Preview buttons — **actions**
6. Playlist name — **context**

### 8. Visual Hierarchy

**Above the fold (full screen):**
- Header: Back button, playlist name, "Studio" label, [Preview] [Save] buttons
- Left panel: Media library (tabs: Library, Upload)
- Center: Canvas (Konva stage)
- Right panel: Properties (selected element)
- Bottom: Timeline (layers)

**Collapsed:**
- Advanced properties (animations, transitions — future)
- Layer effects (opacity, blend mode — future)

**Hidden:**
- Sidebar (Studio is full-screen, no app shell)

### 9. Page Sections

#### Section 1: Header
- **Purpose:** Navigation and primary actions
- **Priority:** 1
- **Contents:** Back button, playlist name, "Studio" label, Preview button, Save button
- **Visibility:** Always

#### Section 2: Media Panel (Left)
- **Purpose:** Access media library and upload
- **Priority:** 1
- **Contents:** Tabs (Library, Upload), media grid, search
- **Dependencies:** `useApiMedia` (SWR)
- **Visibility:** Always (collapsible — future)
- **Future:** AI generation tab, templates tab

#### Section 3: Canvas (Center)
- **Purpose:** Visual editing area
- **Priority:** 1
- **Contents:** Konva stage with layers, selection handles, alignment guides
- **Dependencies:** Konva.js, playlist data
- **Visibility:** Always
- **Future:** Multi-zone support, alignment guides

#### Section 4: Properties Panel (Right)
- **Purpose:** Configure selected element
- **Priority:** 2
- **Contents:** Position (X, Y), size (W, H), rotation, opacity, duration, transition
- **Visibility:** Always (shows "Select an element" when nothing selected)
- **Future:** Animation properties, effects

#### Section 5: Timeline (Bottom)
- **Purpose:** Layer management and ordering
- **Priority:** 2
- **Contents:** Layer list (thumbnails, names, visibility toggle, lock toggle), drag to reorder
- **Visibility:** Always
- **Future:** Timeline scrubber, per-layer duration

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Back button | Button (icon, outline) | Header |
| Playlist name | Text (medium) | Header |
| "Studio" label | Badge | Header |
| Preview button | Button (outline) | Header |
| Save button | Button (default) | Header |
| Media panel tabs | Tabs (Radix) | Media Panel |
| Media grid | Grid | Media Panel |
| Media item | Card (draggable) | Media Panel |
| Search input | Input (text) | Media Panel |
| Upload drop zone | Drop zone | Media Panel (Upload tab) |
| Canvas | Konva Stage | Canvas |
| Selection handle | Konva Transformer | Canvas |
| Alignment guide | Konva Line | Canvas |
| Property field | Input (number/text) | Properties |
| Position X/Y | Input (number) | Properties |
| Size W/H | Input (number) | Properties |
| Rotation | Input (number) | Properties |
| Opacity | Slider | Properties |
| Duration | Input (number) | Properties |
| Layer item | List item (draggable) | Timeline |
| Layer thumbnail | Image | Timeline |
| Layer name | Text | Timeline |
| Visibility toggle | Button (icon) | Timeline |
| Lock toggle | Button (icon) | Timeline |
| "Add Layer" button | Button (icon, ghost) | Timeline |
| Splash screen | Loading | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Back button | Returns to playlist detail (confirms if unsaved — future) |
| Click | Save | Saves playlist (button spinner) |
| Click | Preview | Opens preview overlay |
| Click | Media item | Adds to canvas as new layer |
| Drag | Media item → Canvas | Adds to canvas at drop position |
| Click | Canvas element | Selects element (shows properties + handles) |
| Drag | Canvas element | Moves element |
| Drag | Selection handle | Resizes element |
| Drag | Layer item (timeline) | Reorders layers |
| Click | Visibility toggle | Hides/shows layer |
| Click | Lock toggle | Locks/unlocks layer |
| Keyboard | Delete | Removes selected element |
| Keyboard | Ctrl+S | Saves (future) |
| Keyboard | Ctrl+Z | Undo (future) |
| Keyboard | Escape | Deselects element |
| Drag | Properties slider | Adjusts value in real-time |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Studio loaded | Canvas ready, panels populated |
| Loading | Initial load | Splash screen with logo + spinner |
| Saving | Save clicked | Button spinner + "Saving..." |
| Save success | API 200 | Toast: "Playlist saved" + button returns to normal |
| Save error | API error | Toast: "Failed to save. Try again." + button stays active |
| Element selected | Click on canvas element | Properties panel shows element props, handles appear |
| No selection | Click empty canvas | Properties shows "Select an element" |
| Uploading | File dropped in media panel | Progress bar per file |
| Upload success | API 200 | Media appears in library grid |
| Unsaved changes (future) | Any edit | Save button shows indicator (dot) |
| Preview | Preview clicked | Overlay with playing content |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Element added | Element appears on canvas + toast (brief): "Added" |
| Element deleted | Element disappears from canvas + timeline |
| Layer reordered | Timeline updates immediately |
| Save success | Toast: "Playlist saved" |
| Save error | Toast: "Failed to save. Try again." |
| Upload complete | Media appears in library + toast: "Uploaded" |
| Property changed | Canvas updates in real-time |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Add from library or upload? | Adding media | Existing library or new upload | Library (fewer steps) |
| Save or publish? | Finished editing | Save (stay in Studio) or publish (leave Studio) | Save first, then publish |
| Delete or hide? | Layer not needed | Delete (permanent) or hide (toggle) | Hide (reversible) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Leave without saving | (Future) AlertDialog: "Unsaved changes. Leave anyway?" | Confirm or cancel |
| Delete wrong layer | Layer is selected before delete | Undo (future) or re-add |
| Overlap elements | Alignment guides show when overlapping | Drag to adjust |
| Wrong save | Save button is clearly labeled | — |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through panels, Enter to select elements |
| Screen reader | Canvas has `aria-label` describing content |
| Focus | Media panel → canvas → properties → timeline |
| Contrast | Panel content meets 4.5:1 |
| Touch | N/A (desktop only) |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Studio | **Not supported** — show message: "Studio is available on desktop only" |
| Alternative | Direct user to use templates or simple playlist creation |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Initial load | Splash screen (Konva is heavy) |
| Canvas rendering | Konva handles efficiently |
| Media panel | Lazy load thumbnails |
| Large playlists | Virtualized timeline (if 50+ layers) |
| Auto-save (future) | Save after 30s inactivity (debounced) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Multi-zone layouts | Canvas (split into zones) |
| Animations | Properties panel (new section) |
| Transitions | Properties panel (new field) |
| Templates | Media panel (new tab) |
| AI generation | Media panel (new tab) |
| Undo/Redo | Header (new buttons) |
| Keyboard shortcuts panel | Help menu |
| Grid/snap settings | Canvas toolbar |
| Export as image | Header menu |

### 20. UX Notes
- Studio is the most complex page in the product — progressive disclosure is critical
- Properties panel should show only relevant fields for selected element type (image vs text vs shape)
- Timeline should support drag-to-reorder with visual feedback
- Save must be always accessible (header, not in a menu)
- Auto-save should be implemented to prevent data loss (F-MP-14)
- Alignment guides (snap to center, snap to edges) are important for precise layout
- Consider adding keyboard shortcuts for common actions (add layer, duplicate, delete)
- Studio is desktop-only — mobile users should be directed to templates or simple creation
- Canvas should show safe-zone indicators for common screen resolutions
- Properties panel inputs should support both typing and slider/stepper for precision

---

## Cross-References

- See `05-page-type-ux-rules.md` §3-5 for list, detail, and editor page type rules
- See `information-architecture/06-page-catalog.md` P-CN-01 through P-CN-04
- See `audits/frontend/10-playlists-and-studio.md` for playlists/studio audit
- See `audits/frontend/11-media-library.md` for media library audit
- See `product-architecture/09-product-modules.md` M-03 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
