# Screen Specifications — Studio (Canvas Editor)

> **Evidence basis:** `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-04, `user-flow-architecture/10-playlist-flows.md` FL-PL-02, `product-architecture/09-product-modules.md` M-03, `product-architecture/17-product-rules.md` PR-34, `information-architecture/06-page-catalog.md` P-CN-04
> **Purpose:** Screen spec for the Studio — the visual canvas editor for playlist design

---

## SCR-CN-04: Studio (Canvas Editor)

### Screen ID
SCR-CN-04

### Purpose
Visual canvas editor for designing and editing playlist content using layers, media, text, and properties.

### Business Goal
Product differentiator; content creation power tool; enables rich visual content.

### User Goal
Create or edit a playlist visually with precise control over layout, media, and timing.

### Primary Users
Owner, Editor.

### Permissions
- Studio access: Owner/Editor only
- Viewer: Cannot access (redirect to playlist detail with toast)

### Entry Points
- Playlist Detail "Edit in Studio"
- Playlist creation (blank template) → Studio opens
- Direct URL `/content/playlists/{id}/studio`

### Exit Points
- "Back" button → Playlist Detail (`/content/playlists/{id}`)
- "Save" → Saves and stays in Studio
- (Future) "Publish" → Save + navigate to publish dialog

### Navigation
- Sidebar: Hidden in Studio (full-screen workspace)
- Breadcrumbs: Hidden (back button replaces)
- No standard page header — Studio has its own toolbar

### Page Title
`Studio — [Playlist Name] — Smart Screen`

### Primary CTA
"Save" button (top-right of toolbar).

### Secondary CTA
- "Preview" button
- "Undo" / "Redo" (future)
- "Back" button

### Danger Actions
- Closing without saving (data loss risk — FR-01)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────────────┐
│ Studio Toolbar: [Back] [Playlist Name]    [Preview] [Save]   │
├──────────┬──────────────────────────────────┬───────────────┤
│          │                                  │               │
│ Media    │         Canvas Area              │  Properties    │
│ Panel    │         (Konva.js)               │  Panel         │
│ (left)   │                                  │  (right)       │
│          │                                  │               │
│ 280px    │         flex-1                   │  300px         │
│          │                                  │               │
│          │                                  │               │
├──────────┴──────────────────────────────────┴───────────────┤
│ Timeline: Layer list (ordered, draggable)                     │
│ 60px height                                                   │
└─────────────────────────────────────────────────────────────┘
```

### Container
- Full viewport: `h-screen w-screen overflow-hidden`
- No app shell padding (Studio is full-screen)
- Three-panel layout: Left (280px) + Center (flex-1) + Right (300px)
- Bottom timeline: 60px height

### Spacing
- Toolbar: `h-12 px-4`
- Panels: `p-3` internal padding
- Canvas: Centered with padding `p-8`
- Timeline: `px-3 py-2`

### Visual Hierarchy
1. **Toolbar:** Top, persistent, medium weight
2. **Canvas:** Center, primary focus, dark background (`bg-neutral-900`)
3. **Media Panel:** Left, low weight (`bg-card`)
4. **Properties Panel:** Right, low weight (`bg-card`)
5. **Timeline:** Bottom, low weight (`bg-card`)

### Page Sections

#### Section 1: Studio Toolbar (top)
- **Contents:** Back button, playlist name (editable inline), "Preview" button, "Save" button
- **Sticky:** Yes (always visible)
- **Background:** `bg-card border-b border-border`

#### Section 2: Media Panel (left)
- **Contents:** Tabs — "Library" (workspace media) and "Upload" (upload new media)
- **Library tab:** Grid of media thumbnails; click or drag to canvas
- **Upload tab:** Drop zone + file picker
- **Search:** Search media within library
- **Width:** 280px fixed
- **Scrollable:** Panel content scrolls independently

#### Section 3: Canvas Area (center)
- **Contents:** Konva.js canvas with layers
- **Background:** `bg-neutral-900` (dark, to simulate screen display)
- **Canvas size:** Matches target screen resolution (1920×1080 default, scaled to fit)
- **Interactions:** Click to select, drag to move, resize handles on selection
- **Alignment guides:** Snap to center, edges (future)
- **Scrollable:** No (canvas fits available space; zoom controls — future)

#### Section 4: Properties Panel (right)
- **Contents:** Properties of selected layer (or empty state if nothing selected)
- **Properties:** Position (X, Y), Size (W, H), Rotation, Opacity, Duration
- **Text layers:** Font family, size, color, alignment, text content
- **Media layers:** Source, fit mode (contain, cover, fill)
- **Width:** 300px fixed
- **Scrollable:** Panel content scrolls independently
- **Empty state:** "Select a layer to edit its properties"

#### Section 5: Timeline (bottom)
- **Contents:** Ordered list of layers (bottom-to-top rendering order)
- **Each item:** Thumbnail/icon, layer name, visibility toggle, lock toggle
- **Interactions:** Drag to reorder, click to select, toggle visibility/lock
- **Height:** 60px fixed
- **Scrollable:** Horizontal scroll if many layers

---

## Component Tree

```
<StudioPage>
  <StudioToolbar>
    <Button variant="ghost" onClick={handleBack}>
      <ArrowLeft icon /> Back
    </Button>
    <EditableText value={playlistName} onChange={setPlaylistName} />
    <Spacer />
    <Button variant="ghost" onClick={togglePreview}>
      <Play icon /> Preview
    </Button>
    <Button variant="default" onClick={handleSave} disabled={isSaving}>
      {isSaving ? <Spinner /> : "Save"}
    </Button>
  </StudioToolbar>
  <StudioBody>
    <MediaPanel>
      <Tabs value={mediaTab}>
        <TabsList>
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>
        <TabsContent value="library">
          <SearchInput placeholder="Search media..." />
          <MediaGrid items={mediaItems} onDragStart={handleDragStart} onClick={addLayer} />
        </TabsContent>
        <TabsContent value="upload">
          <UploadDropZone onDrop={handleUpload} />
        </TabsContent>
      </Tabs>
    </MediaPanel>
    <CanvasArea>
      <KonvaCanvas
        layers={layers}
        selectedId={selectedLayerId}
        onSelect={setSelectedLayerId}
        onChange={updateLayer}
        screenSize={screenSize}
      />
    </CanvasArea>
    <PropertiesPanel>
      {selectedLayer ? (
        <LayerProperties layer={selectedLayer} onChange={updateLayer} />
      ) : (
        <EmptyState text="Select a layer to edit its properties" />
      )}
    </PropertiesPanel>
  </StudioBody>
  <Timeline>
    <LayerList
      layers={layers}
      selectedId={selectedLayerId}
      onSelect={setSelectedLayerId}
      onReorder={reorderLayers}
      onToggleVisibility={toggleVisibility}
      onToggleLock={toggleLock}
    />
  </Timeline>
  {showPreview && <PreviewOverlay playlist={playlist} onClose={togglePreview} />}
</StudioPage>
```

### Component Details

#### KonvaCanvas
- **Props:** `layers: Layer[]`, `selectedId: string`, `onSelect`, `onChange`, `screenSize: {w, h}`
- **Implementation:** Konva.js (`react-konva`)
- **Interactions:** Click to select, drag to move, resize handles (Transformer), rotation handle
- **Rendering:** Layers rendered bottom-to-top (array order)
- **Scale:** Canvas scales to fit available space while maintaining aspect ratio
- **Background:** Dark (`bg-neutral-900`) to simulate screen display

#### LayerProperties
- **Props:** `layer: Layer`, `onChange: (updates) => void`
- **Contents:** Varies by layer type:
  - **All layers:** Position (X, Y), Size (W, H), Rotation, Opacity, Duration
  - **Text layers:** Text content (textarea), Font family (dropdown), Font size (number), Color (color picker), Alignment (buttons)
  - **Media layers:** Media source (read-only), Fit mode (contain/cover/fill dropdown)
- **Updates:** Live update to canvas as properties change
- **Inputs:** Number inputs for position/size; sliders for opacity/rotation

#### LayerList (Timeline)
- **Props:** `layers: Layer[]`, `selectedId`, `onSelect`, `onReorder`, `onToggleVisibility`, `onToggleLock`
- **UI:** Horizontal list of layer items (thumbnail, name, visibility eye, lock icon)
- **Reorder:** Drag-and-drop to reorder (changes z-index)
- **Selected:** Highlighted with `bg-primary/10`
- **Accessibility:** `role="listbox"`, items `role="option"`

#### PreviewOverlay
- **Props:** `playlist: Playlist`, `onClose: () => void`
- **UI:** Full-screen overlay with playing content (auto-playing, looping)
- **Close:** Click anywhere or Escape
- **Micro Interaction:** Fade in/out (MI-08, 200ms)

---

## Responsive

### Desktop (≥ 1024px)
- Three-panel layout: 280px + flex + 300px
- Full toolbar with all buttons
- Canvas centered with dark background

### Tablet (768px – 1023px)
- **Not recommended** — Studio is desktop-only
- Show warning: "Studio is optimized for desktop. Some features may not work on tablet."
- Panels: Narrower (240px + flex + 260px)

### Mobile (< 768px)
- **Not supported**
- Show full-page message: "Studio is not available on mobile. Please use a desktop browser."
- No Studio rendering — just the message

### Minimum Supported Width
1024px (desktop only).

---

## States

### Loading
- **Initial load:** Splash screen with Smart Screen logo + spinner (Konva is heavy, 1-3s)
- **Splash:** Centered, `bg-neutral-900`, logo + "Loading Studio..."
- **After load:** Splash fades to Studio (MI-08, 300ms)

### Empty — No Layers
- Canvas: Shows empty dark canvas with centered text: "Drag media here or click to add layers"
- Properties: Empty state "Select a layer to edit its properties"

### Error — Load Failure
- "Studio failed to load. Try refreshing the page." + "Reload" button
- Possible causes: Browser incompatibility, JS error, Konva load failure

### Error — Save Failure
- Toast: "Failed to save. Try again."
- Studio remains open; changes preserved in memory

### Error — Media Not Found
- Layer on canvas shows placeholder: "Media unavailable" (red X overlay)
- Recovery: Replace with available media or remove layer

### Unsaved Changes
- **Current:** No warning on navigation (FR-01 risk)
- **Future:** AlertDialog on back/navigation: "Unsaved changes. Leave anyway?"
- **Future:** Auto-save after 30s inactivity (F-MP-14)

### Saving
- Save button: Spinner + "Saving..."
- Button disabled during save
- Toast on success: "Playlist saved"

---

## Interactions

### Canvas Interactions
| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Layer | Select layer (show in Properties + Timeline) |
| Drag | Layer | Move layer on canvas |
| Drag | Resize handle | Resize layer (maintain aspect with Shift) |
| Drag | Rotation handle | Rotate layer |
| Click | Empty canvas | Deselect layer |
| Delete | Keyboard | Delete selected layer |
| Arrow keys | Keyboard | Nudge selected layer 1px (10px with Shift) |
| Ctrl+S | Keyboard | Save (future) |
| Ctrl+Z | Keyboard | Undo (future) |
| Ctrl+Shift+Z | Keyboard | Redo (future) |

### Media Panel Interactions
| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Media item | Add as new layer on canvas |
| Drag | Media item → Canvas | Add as new layer at drop position |
| Search | Type | Filter media in library |
| Click | Upload tab | Switch to upload drop zone |
| Drop | Files on drop zone | Start upload |

### Properties Panel Interactions
| Interaction | Element | Behavior |
|-------------|---------|----------|
| Type | Position/Size input | Update layer on canvas (live) |
| Drag | Opacity/Rotation slider | Update layer on canvas (live) |
| Change | Font/Color/Alignment | Update text layer (live) |
| Change | Fit mode dropdown | Update media layer (live) |

### Timeline Interactions
| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Layer item | Select layer |
| Drag | Layer item | Reorder (change z-index) |
| Click | Eye icon | Toggle visibility |
| Click | Lock icon | Toggle lock (prevent selection/edit) |

### Toolbar Interactions
| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Back | Navigate to playlist detail (future: unsaved warning) |
| Click | Preview | Open preview overlay |
| Click | Save | Save playlist |
| Double-click | Playlist name | Enter edit mode for name |

---

## Forms

### Save Form
- **Trigger:** "Save" button or Ctrl+S (future)
- **API:** `PATCH /canvases/{id}` with full layout data (workspaceId query param required)
- **Validation:** None (any state is savable)
- **Loading:** Button spinner + "Saving..."
- **Success:** Toast: "Playlist saved"
- **Failure:** Toast: "Failed to save. Try again."
- **Auto-save:** (Future) After 30s inactivity (F-MP-14)

### No Traditional Form Fields
- Studio is not a form-based page; all input is via canvas interactions and property inputs
- No submit/cancel/reset pattern — Save is the only form action

---

## Feedback

| Event | Feedback |
|-------|----------|
| Layer added | Layer appears on canvas (MI-03, 150ms scale-in) |
| Layer deleted | Layer fades out (MI-09, 150ms fade) |
| Layer selected | Selection handles appear (blue bounding box) |
| Save loading | Button spinner + "Saving..." |
| Save success | Toast: "Playlist saved" |
| Save failure | Toast: "Failed to save. Try again." |
| Media upload | Progress in Upload tab |
| Preview open | Overlay fades in (MI-08, 200ms) |
| Preview close | Overlay fades out (MI-08, 200ms) |
| Unsaved navigation (future) | AlertDialog: "Unsaved changes. Leave anyway?" |

---

## Accessibility

| Element | Rule | Notes |
|---------|------|-------|
| Studio toolbar | `role="toolbar"`, `aria-label="Studio toolbar"` | — |
| Media panel | `role="region"`, `aria-label="Media library"` | — |
| Canvas | `role="application"`, `aria-label="Playlist canvas editor"` | Konva canvas |
| Properties panel | `role="region"`, `aria-label="Layer properties"` | — |
| Timeline | `role="listbox"`, `aria-label="Layer timeline"` | Items `role="option"` |
| Layer selection | `aria-selected` on timeline item | — |
| Property inputs | `<label>` associated with each input | — |
| Save button | `aria-busy="true"` during saving | — |
| Keyboard | Tab through toolbar → panels → timeline | Limited canvas keyboard support |
| Screen reader | Canvas content not accessible to screen readers | Limitation acknowledged |
| Contrast | Properties panel meets WCAG AA | Dark canvas is intentional (screen simulation) |
| Touch targets | All buttons ≥ 36px (desktop only) | — |

### Accessibility Limitations
- Konva.js canvas is not fully accessible to screen readers (visual editor by nature)
- Keyboard navigation in canvas is limited (arrow keys for nudge, Delete for remove)
- Studio is desktop-only (no mobile/touch support)
- These limitations are acknowledged and accepted for a visual editor tool

---

## Performance UX

| Concern | Strategy | Evidence |
|---------|----------|----------|
| Initial load | Splash screen during Konva load (1-3s) | F-MP-14 |
| Canvas rendering | Konva.js optimized for layer-based rendering | — |
| Media thumbnails | Lazy-loaded in media panel | — |
| Save | Full payload save (no incremental) | Future: delta save |
| Auto-save | (Future) After 30s inactivity | F-MP-14 |
| Preview | Lightweight overlay; uses same Konva instance | — |
| Memory | Konva layer cleanup on unmount | — |

---

## API Requirements

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/canvases/{id}?workspaceId={wid}` | GET | Load canvas with layout | → `{ id, name, layoutData, width, height, durationSec }` |
| `/canvases/{id}?workspaceId={wid}` | PATCH | Save canvas | `{ name, layoutData, width, height, durationSec }` |
| `/canvases?workspaceId={wid}` | POST | Create canvas | `{ name, layoutData, width, height }` |
| `/canvases?workspaceId={wid}` | GET | List canvases | Paginated canvases |
| `/media?page={p}&search={q}` | GET | Media library for panel | Paginated media |
| `/media` | POST (multipart) | Upload from Studio | File upload |

### Realtime Events
None — Studio is a single-user editing environment (no realtime collaboration).

### Backend Limitations
- Full save (no delta/incremental save) — large playlists may be slow
- No version history (future)
- No concurrent editing protection (last save wins)

### Missing APIs
- `PATCH /canvases/{id}/autosave` — Auto-save endpoint (future, lightweight)
- `GET /canvases/{id}/versions` — Version history (future)
- `POST /canvases/{id}/versions/{ver}/restore` — Restore version (future)

---

## Acceptance Criteria

### Functional
- [ ] Studio loads with splash screen then renders canvas
- [ ] Media panel shows library with search and upload tabs
- [ ] Click or drag media adds layer to canvas
- [ ] Layers can be selected, moved, resized, rotated
- [ ] Properties panel shows selected layer properties
- [ | Property changes update canvas in real-time
- [ ] Timeline shows layer order with drag-to-reorder
- [ ] Visibility and lock toggles work
- [ ] Save persists changes and shows toast
- [ ] Preview overlay plays content
- [ ] Back button navigates to playlist detail
- [ ] Text layers can be added with font/size/color controls

### UX
- [ ] Splash screen during load (no blank screen)
- [ ] Canvas has dark background (screen simulation)
- [ ] Selection handles visible on selected layer
- [ | Property updates are live (no lag)
- [ ] Save shows loading state
- [ ] (Future) Unsaved changes warning on navigation

### Accessibility
- [ ] Toolbar, panels, and timeline have ARIA roles
- [ ] Property inputs have labels
- [ ] Keyboard: Tab navigation through panels
- [ ] Keyboard: Arrow keys nudge, Delete removes layer
- [ ] Canvas acknowledged as not fully screen-reader accessible

### Performance
- [ ] Studio loads < 3s (including Konva)
- [ ] Canvas interactions < 16ms (60fps)
- [ ] Save completes < 3s
- [ ] Media panel search < 500ms

### Responsive
- [ ] Three-panel layout on desktop (≥ 1024px)
- [ ] Tablet: Warning message (not recommended)
- [ ] Mobile: "Desktop only" message (not supported)
- [ ] No horizontal scroll on desktop

---

## Current Problems

| ID | Problem | Impact | Evidence |
|----|---------|--------|----------|
| ST-01 | No auto-save | Data loss risk; user anxiety | FR-01 |
| ST-02 | No unsaved changes warning | Data loss on navigation | FR-12 |
| ST-03 | No undo/redo | Users can't reverse mistakes | — |
| ST-04 | No version history | Can't revert to previous version | — |
| ST-05 | No alignment guides | Manual positioning is imprecise | — |
| ST-06 | No multi-select | Can't move/align multiple layers | — |
| ST-07 | No keyboard shortcuts | Power users can't work efficiently | — |
| ST-08 | No zoom controls | Can't zoom in for precise editing | — |
| ST-09 | Heavy initial load (Konva) | 1-3s splash screen | F-MP-14 |
| ST-10 | No concurrent editing protection | Last save wins; data loss risk | FR-11 |

## Technical Debt

| ID | Debt | Impact |
|----|------|--------|
| STD-01 | Full save payload (no delta) | Slow saves for large playlists |
| STD-02 | No layer cleanup on unmount | Memory leak risk |
| STD-03 | Konva version may be outdated | Compatibility issues |
| STD-04 | No error boundary in canvas | Render error crashes Studio |

## UX Improvements

| ID | Improvement | Priority | Effort |
|----|------------|----------|--------|
| SUI-01 | Add auto-save (30s inactivity) | Critical | Medium |
| SUI-02 | Add unsaved changes warning | Critical | Low |
| SUI-03 | Add undo/redo (Ctrl+Z/Ctrl+Shift+Z) | High | Medium |
| SUI-04 | Add alignment guides (snap to center/edges) | High | Medium |
| SUI-05 | Add keyboard shortcuts (Ctrl+S, Delete, arrows) | High | Low |
| SUI-06 | Add multi-select layers | Medium | Medium |
| SUI-07 | Add zoom controls | Medium | Low |
| SUI-08 | Add layer opacity slider in timeline | Low | Low |
| SUI-09 | Add copy/paste layers (Ctrl+C/Ctrl+V) | Medium | Medium |
| SUI-10 | Add Studio onboarding tour (first-time) | High | Medium |

## Future Improvements
- Multi-zone layouts (split screen into regions)
- Animation timeline (keyframes, transitions)
- Template library within Studio
- AI-powered layout suggestions
- Real-time collaboration (multiple editors)
- Layer effects (shadow, blur, border)
- Text animations (typewriter, fade in/out)
- Content scheduling per layer (show/hide at specific times)

## Blocked By Backend
- Auto-save endpoint (SUI-01)
- Version history API (ST-04)
- Concurrent editing detection (ST-10)

## Blocked By Business
- Multi-zone layouts require product decision on scope
- AI features require AI service integration

---

## Cross-References

- See `01-global-layout-spec.md` for app shell (Studio overrides shell)
- See `05-content-specs.md` SCR-CN-03 for Playlist Detail spec
- See `13-shared-dialogs-specs.md` for template picker dialog spec
- See `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-04 for Studio UX blueprint
- See `user-flow-architecture/10-playlist-flows.md` FL-PL-02 for Studio editing flow
- See `product-architecture/09-product-modules.md` M-03 for content module
- See `product-architecture/17-product-rules.md` PR-34 for content rules
