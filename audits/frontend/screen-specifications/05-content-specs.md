# Screen Specifications — Content (Playlists, Playlist Detail, Media Library)

> **Evidence basis:** `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-01, P-CN-02, P-CN-03, `user-flow-architecture/09-media-flows.md`, `user-flow-architecture/10-playlist-flows.md`, `product-architecture/09-product-modules.md` M-03, `information-architecture/06-page-catalog.md` P-CN-01–P-CN-03

---

## SCR-CN-01: Content — Playlists Tab

### Screen ID
SCR-CN-01

### Purpose
View, create, and manage playlists in the workspace.

### Business Goal
Content creation enablement; playlist management hub.

### User Goal
Find existing playlists; create new ones; manage content.

### Primary Users
Owner, Editor (full access); Viewer (read-only).

### Permissions
- "Create Playlist" button: Owner/Editor only
- Playlist card "More" menu (delete, duplicate): Owner/Editor only
- View playlists: All roles

### Entry Points
- Sidebar "Content" (defaults to Playlists tab)
- Overview Quick Action "Create Playlist"
- Post-pairing CTA "Assign Content"

### Exit Points
- Click playlist card → Playlist Detail
- "Create Playlist" → Template picker dialog → Playlist Detail or Studio
- Tab switch → Media tab
- Sidebar navigation

### Navigation
- Sidebar active: "Content"
- Breadcrumbs: None (top-level page)
- Tabs: "Playlists" (active) | "Media"

### Page Title
`Content — Smart Screen`

### Primary CTA
"Create Playlist" button (top-right).

### Secondary CTA
- Search input
- Filter (status: Draft, Published)
- Sort (name, date, last modified)

### Danger Actions
- Delete playlist (card "More" menu — Owner/Editor)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Content" + [Create Playlist]           │
│ Tabs: [Playlists] [Media]                             │
│ Search + filters                                       │
├─────────────────────────────────────────────────────┤
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │
│ │Playlist│ │Playlist│ │Playlist│ │Playlist│         │
│ │ Card   │ │ Card   │ │ Card   │ │ Card   │         │
│ └────────┘ └────────┘ └────────┘ └────────┘         │
├─────────────────────────────────────────────────────┤
│ Pagination                                           │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

### Page Sections

#### Section 1: Page Header + Tabs
- "Content" heading
- Tab bar: "Playlists" (active), "Media"
- "Create Playlist" button (right side)

#### Section 2: Toolbar
- Search input, status filter, sort dropdown
- `flex items-center gap-3 flex-wrap`

#### Section 3: Playlist Cards Grid
- **Data:** `useApiPlaylists({ page, search, status, sort })`
- **Card:** Thumbnail/preview, name, status badge (Draft/Published), media count, last modified
- **"More" menu:** "Edit in Studio", "Duplicate", "Delete"
- **Click:** Card → `/content/playlists/{id}`

#### Section 4: Pagination
- Standard pagination component

---

## Component Tree

```
<ContentPage>
  <PageHeader>
    <Heading level={1}>Content</Heading>
    <Button variant="default" onClick={openTemplatePicker}>
      <Plus icon /> Create Playlist
    </Button>
  </PageHeader>
  <Tabs value={tab} onValueChange={setTab}>
    <TabsList>
      <TabsTrigger value="playlists">Playlists</TabsTrigger>
      <TabsTrigger value="media">Media</TabsTrigger>
    </TabsList>
  </Tabs>
  <Toolbar>
    <SearchInput value={search} onChange={setSearch} placeholder="Search playlists..." />
    <FilterSelect name="status" options={[{value: "draft", label: "Draft"}, {value: "published", label: "Published"}]} />
    <SortSelect options={sortOptions} />
  </Toolbar>
  <PlaylistGrid>
    {playlists.map(pl => (
      <PlaylistCard
        key={pl.id}
        playlist={pl}
        onClick={() => router.push(`/content/playlists/${pl.id}`)}
        onMenuAction={handleMenuAction}
      />
    ))}
  </PlaylistGrid>
  <Pagination page={page} total={total} onChange={setPage} />
</ContentPage>
```

### Component Details

#### PlaylistCard
- **Props:** `playlist: Playlist`, `onClick: () => void`, `onMenuAction: (action, id) => void`
- **UI:** Card with preview thumbnail (first media item or placeholder), name, status badge, media count, "Updated [time]"
- **Status badge:** Gray (Draft), Green (Published)
- **"More" menu (⋯):** "Edit in Studio", "Duplicate", "Delete"
- **Hover:** `shadow-md`, menu button appears
- **Click:** Card body → navigate to detail
- **Accessibility:** `role="button"`, `aria-label="[Name], [Status], [N] items"`

---

## States

### Loading
- Skeleton cards (8-12) with shimmer

### Empty — No Playlists
- "No playlists created yet" + icon + "Create Playlist" CTA

### Empty — No Results (filtered)
- "No playlists match your filters" + "Clear Filters"

### Error
- Card grid: Error + "Retry"

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Playlist card | Navigate to `/content/playlists/{id}` |
| Click | "Create Playlist" | Open template picker dialog |
| Click | "Edit in Studio" (menu) | Navigate to `/content/playlists/{id}/studio` |
| Click | "Duplicate" (menu) | API call → toast: "Playlist duplicated" |
| Click | "Delete" (menu) | Open AlertDialog with schedule impact warning |
| Click | Tab "Media" | Switch to Media tab |
| Search | Type | Debounced 300ms, server-side |

---

## Responsive

### Desktop (≥ 1024px)
- Grid: 3-4 columns
- Toolbar: single row

### Tablet (768px – 1023px)
- Grid: 2-3 columns

### Mobile (< 768px)
- Grid: 1 column
- Toolbar: stacked
- Tabs: full width

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/playlists?page={p}&search={q}&status={s}&sort={s}` | GET | Paginated playlists |
| `/playlists` | POST | Create playlist (from template or blank) |
| `/playlists/{id}` | DELETE | Delete playlist |
| `/playlists/{id}/duplicate` | POST | Duplicate playlist |

### Backend Limitations
- No bulk delete/duplicate (must call per playlist)

---

## Acceptance Criteria

### Functional
- [ ] Displays playlist cards in grid
- [ ] "Create Playlist" opens template picker
- [ ] Tab switch to Media works
- [ ] Search, filter, sort work (server-side)
- [ ] Card click navigates to detail
- [ | "More" menu: Edit, Duplicate, Delete work
- [ ] Delete shows confirmation with schedule warning

### UX
- [ ] Skeleton loading
- [ ] Empty state with CTA
- [ ] No layout shift

### Accessibility
- [ ] `<h1>` "Content"
- [ ] Tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] Cards: `role="button"`, `aria-label`
- [ ] Keyboard: Tab through tabs → toolbar → cards

### Performance
- [ ] First card < 500ms
- [ ] Search < 1s
- [ ] Tab switch < 200ms (cached data)

### Responsive
- [ ] 4 columns desktop, 2 tablet, 1 mobile
- [ ] Tabs full width on mobile

---

## SCR-CN-02: Content — Media Tab

### Screen ID
SCR-CN-02

### Purpose
View, upload, and manage media files in the workspace.

### Business Goal
Content library management; storage utilization.

### User Goal
Find media; upload new files; manage existing.

### Primary Users
Owner, Editor (full access); Viewer (read-only).

### Permissions
- "Upload" button: Owner/Editor only
- Media card "More" menu (delete, replace): Owner/Editor only
- View media: All roles

### Entry Points
- Sidebar "Content" → Media tab
- Tab switch from Playlists

### Exit Points
- Tab switch → Playlists
- Sidebar navigation

### Page Title
`Media — Smart Screen`

### Primary CTA
"Upload" button (top-right).

### Secondary CTA
- Search input
- Filter (type: Image, Video)
- Sort (name, date, size)
- Grid/list view toggle (future)

### Danger Actions
- Delete media (card "More" menu — Owner/Editor)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Content" + [Upload]                    │
│ Tabs: [Playlists] [Media]                             │
│ Search + filters                                       │
├─────────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐          │
│ │Med │ │Med │ │Med │ │Med │ │Med │ │Med │          │
│ │ia  │ │ia  │ │ia  │ │ia  │ │ia  │ │ia  │          │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘          │
├─────────────────────────────────────────────────────┤
│ Pagination                                           │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Media grid: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3`

### Page Sections

#### Section 1: Page Header + Tabs
- Same as Playlists tab (shared header)
- "Upload" button instead of "Create Playlist"

#### Section 2: Toolbar
- Search, type filter (Image/Video), sort

#### Section 3: Media Grid
- **Data:** `useApiMedia({ page, search, type, sort })`
- **Card:** Thumbnail (image preview or video frame), filename, type icon, size, duration (video)
- **"More" menu (⋯):** "Replace" (future), "Delete"
- **Drop zone:** Full-page overlay when dragging files

#### Section 4: Upload Progress (when uploading)
- **Visibility:** Only during active uploads
- **UI:** List of files with progress bars (per file)
- **Position:** Fixed bottom-right or inline above grid

#### Section 5: Pagination

---

## Component Tree

```
<ContentPage>
  <PageHeader>
    <Heading level={1}>Content</Heading>
    <Button variant="default" onClick={triggerFileInput}>
      <Upload icon /> Upload
    </Button>
  </PageHeader>
  <Tabs value="media">
    <TabsList>
      <TabsTrigger value="playlists">Playlists</TabsTrigger>
      <TabsTrigger value="media">Media</TabsTrigger>
    </TabsList>
  </Tabs>
  <Toolbar>
    <SearchInput placeholder="Search media..." />
    <FilterSelect name="type" options={[{value: "image", label: "Images"}, {value: "video", label: "Videos"}]} />
    <SortSelect options={sortOptions} />
  </Toolbar>
  <MediaGrid>
    {media.map(item => (
      <MediaCard key={item.id} media={item} onMenuAction={handleMenuAction} />
    ))}
  </MediaGrid>
  {uploads.length > 0 && <UploadProgressList uploads={uploads} />}
  <Pagination page={page} total={total} onChange={setPage} />
  <DropZoneOverlay onDrop={handleDrop} visible={isDragging} />
</ContentPage>
```

### Component Details

#### MediaCard
- **Props:** `media: MediaItem`, `onMenuAction: (action, id) => void`
- **UI:** Square or 16:9 thumbnail, filename below, type badge (image/video), size
- **Video:** Play icon overlay; duration badge
- **"More" menu:** "Replace" (future), "Delete"
- **Hover:** `shadow-md`, menu appears, filename fully visible
- **Accessibility:** `aria-label="[filename], [type], [size]"`

#### UploadProgressList
- **Props:** `uploads: UploadItem[]`
- **UI:** Fixed position (bottom-right), list of files with progress bars
- **Per file:** Filename, progress bar (0-100%), status (uploading/complete/error), "Retry" on error
- **Auto-dismiss:** Completed uploads fade out after 3s

#### DropZoneOverlay
- **Props:** `onDrop: (files) => void`, `visible: boolean`
- **UI:** Full-page overlay with dashed border and "Drop files here" text
- **Visibility:** Only when dragging files over page
- **Mobile:** Not available (no drag-drop on touch)

---

## States

### Loading
- Skeleton media cards (12-18) with shimmer

### Empty — No Media
- "No media uploaded yet" + icon + "Upload" CTA

### Empty — No Results (filtered)
- "No media match your filters" + "Clear Filters"

### Uploading
- Upload progress list visible (bottom-right)
- New cards appear as uploads complete (fade-in)

### Error
- Per-file error in upload list + "Retry" button
- Grid error: Error + "Retry"

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Upload" | Open file picker |
| Drag | Files onto page | Show drop zone overlay |
| Drop | Files on overlay | Start upload |
| Click | Media card "More" → "Delete" | Open AlertDialog with playlist usage warning |
| Click | Media card "More" → "Replace" (future) | Open file picker for replacement |
| Search | Type | Debounced 300ms, server-side |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/media?page={p}&search={q}&type={t}&sort={s}` | GET | Paginated media |
| `/media` | POST (multipart) | Upload media file |
| `/media/{id}` | DELETE | Delete media |
| `/media/{id}/replace` | POST (multipart) | Replace media (future) |
| `/workspaces/{id}/storage` | GET | Storage usage (future) |

### Backend Limitations
- Max 3 concurrent uploads (frontend limit)
- File size limit per plan (backend enforced)
- Storage limit per plan (backend enforced)
- No storage usage endpoint (future)

### Missing APIs
- `GET /workspaces/{id}/storage` — Storage usage indicator
- `POST /media/bulk-delete` — Bulk delete media

---

## Acceptance Criteria

### Functional
- [ ] Displays media cards in grid
- [ ] "Upload" opens file picker
- [ ] Drag-drop upload works (desktop)
- [ ] Upload progress shows per file
- [ ] Delete shows confirmation with playlist usage warning
- [ ] Search, filter, sort work
- [ ] Tab switch to Playlists works

### UX
- [ ] Skeleton loading
- [ ] Empty state with CTA
- [ ] Drop zone overlay on drag
- [ ] Upload progress visible
- [ ] Per-file retry on error

### Accessibility
- [ ] `<h1>` "Content"
- [ ] Upload button triggers accessible file input
- [ ] Cards have `aria-label`
- [ ] Keyboard navigable

### Performance
- [ ] First card < 500ms
- [ ] Upload starts < 500ms after selection
- [ ] Max 3 concurrent uploads

### Responsive
- [ ] 6 columns desktop, 4 tablet, 2 mobile
- [ ] Upload progress adapts on mobile (full width bottom)

---

## SCR-CN-03: Playlist Detail

### Screen ID
SCR-CN-03

### Purpose
View playlist preview, metadata, assigned screens; edit in Studio; publish.

### Business Goal
Content management; publishing hub.

### User Goal
Preview playlist; edit; publish; manage.

### Primary Users
All roles (Viewer: read-only, no edit/publish).

### Permissions
- "Publish to Screens": Owner/Editor
- "Edit in Studio": Owner/Editor
- "Delete" (Danger Zone): Owner/Editor
- View: All roles

### Entry Points
- Playlists tab card click
- Studio "Back to Detail"
- Notification click (playlist-related)

### Exit Points
- "Edit in Studio" → `/content/playlists/{id}/studio`
- "Publish to Screens" → Publish dialog
- "Create Schedule" → `/scheduling` (pre-filled)
- Breadcrumbs → `/content`

### Navigation
- Sidebar active: "Content"
- Breadcrumbs: "Content / [Playlist Name]"

### Page Title
`[Playlist Name] — Smart Screen`

### Primary CTA
"Publish to Screens" button.

### Secondary CTA
- "Edit in Studio"
- "Create Schedule"
- "Duplicate" (More menu)

### Danger Actions
- "Delete Playlist" (Danger Zone — Owner/Editor)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumbs: Content / [Name]                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Header: Name + Status + [Publish] [Edit Studio] │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌──────────────────┐ ┌──────────────────────────┐  │
│ │ Preview           │ │ Metadata                  │  │
│ │ (live preview)    │ │ (created, modified, items)│  │
│ └──────────────────┘ └──────────────────────────┘  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Media Items (list of items in playlist)          │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Assigned Screens                                  │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Danger Zone (Owner/Editor)                        │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1200px] mx-auto px-6 py-6`
- Two-column: `grid grid-cols-1 lg:grid-cols-2 gap-6` for Preview + Metadata

### Page Sections

#### Section 1: Breadcrumbs + Header
- Breadcrumbs: "Content / [Name]"
- Header: Name (h1), status badge (Draft/Published), "Publish to Screens" + "Edit in Studio" buttons

#### Section 2: Preview
- **Contents:** Live preview of playlist (auto-playing, looping)
- **UI:** 16:9 aspect ratio container with content playing
- **Data:** `useApiPlaylist({ id })` → media items

#### Section 3: Metadata
- **Contents:** Created date, last modified, media item count, total duration, status

#### Section 4: Media Items
- **Contents:** Ordered list of media items in playlist (thumbnail, name, duration)
- **Empty:** "No media items. Edit in Studio to add content."

#### Section 5: Assigned Screens
- **Contents:** List of screens currently playing this playlist
- **Empty:** "Not published to any screen"
- **Click:** Screen name → `/screens/{id}`

#### Section 6: Danger Zone (Owner/Editor)
- "Delete Playlist" button (destructive)
- Warning: "[N] active schedules will be affected"

---

## Component Tree

```
<PlaylistDetailPage>
  <Breadcrumbs items={[{label: "Content", href: "/content"}, {label: playlist.name}]} />
  <PlaylistHeader>
    <Heading level={1}>{playlist.name}</Heading>
    <StatusBadge status={playlist.status} />
    <Button variant="default" onClick={openPublishDialog}>Publish to Screens</Button>
    <Button variant="outline" onClick={() => router.push(`/content/playlists/${id}/studio`)}>Edit in Studio</Button>
  </PlaylistHeader>
  <ContentGrid>
    <PlaylistPreview playlist={playlist} />
    <PlaylistMetadata playlist={playlist} />
  </ContentGrid>
  <MediaItemsSection items={playlist.items} />
  <AssignedScreensSection screens={assignedScreens} />
  {canEdit && <DangerZone>
    <Button variant="destructive" onClick={openDeleteDialog}>Delete Playlist</Button>
  </DangerZone>}
</PlaylistDetailPage>
```

### Component Details

#### PlaylistPreview
- **Props:** `playlist: Playlist`
- **UI:** 16:9 container, auto-playing content (images cycle, videos play)
- **Implementation:** Uses Konva.js or simple image/video rotation
- **Accessibility:** `aria-label="Playlist preview"`, `role="img"`

---

## States

### Loading
- Skeleton preview + skeleton sections

### Error — Not Found
- "This playlist doesn't exist or has been deleted." + "Back to Content"

### Empty — No Media Items
- Media Items: "No media items. Edit in Studio to add content." + "Edit in Studio" button

### Empty — Not Published
- Assigned Screens: "Not published to any screen" + "Publish to Screens" button

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/playlists/{id}` | GET | Playlist details + items |
| `/playlists/{id}/screens` | GET | Assigned screens |
| `/playlists/{id}` | DELETE | Delete playlist |
| `/playlists/{id}/publish` | POST | Publish to screens |
| `/playlists/{id}/duplicate` | POST | Duplicate |

---

## Acceptance Criteria

### Functional
- [ ] Displays playlist name, status, preview
- [ ] Preview auto-plays content
- [ ] "Publish to Screens" opens publish dialog
- [ ] "Edit in Studio" navigates to Studio
- [ ] Media items listed in order
- [ ] Assigned screens listed with links
- [ ] Delete shows confirmation with schedule warning

### UX
- [ ] Preview plays within 2s of page load
- [ ] Skeleton loading
- [ ] No layout shift

### Accessibility
- [ ] `<h1>` for playlist name
- [ ] Breadcrumbs with `nav` and `aria-label`
- [ ] Preview has `aria-label`
- [ ] Keyboard navigable

### Performance
- [ ] Page load < 1s
- [ ] Preview starts < 2s

### Responsive
- [ ] Two-column on desktop, single on mobile
- [ ] Preview maintains 16:9 ratio

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `04-screens-specs.md` for Screens specs
- See `06-studio-spec.md` for Studio spec
- See `13-shared-dialogs-specs.md` for publish dialog and template picker specs
- See `ux-blueprint/09-content-studio-ux-blueprint.md` for content UX blueprint
- See `user-flow-architecture/09-media-flows.md` and `10-playlist-flows.md` for flow documentation
- See `product-architecture/09-product-modules.md` M-03 for content module
