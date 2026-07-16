# 10 — Playlists & Studio Feature

> **Source basis:** `src/features/playlists/playlist-studio-client.tsx`, `src/features/playlists/playlist-create-wizard.tsx`, `src/features/playlists/playlist-timeline.tsx`, `src/features/playlists/playlist-media-library.tsx`, `src/features/playlists/playlist-live-preview.tsx`, `src/features/playlists/playlist-preview-overlay.tsx`, `src/features/playlists/playlist-zone-preview.tsx`, `src/features/playlists/playlist-transitions.ts`, `src/features/playlists/quick-publish-dialog.tsx`, `src/features/playlists/playlist-library-panels.tsx`, `src/features/playlists/studio/` (all sub-components and hooks), `src/features/studio/studio-editor-client.tsx`, `src/features/studio/studio-panels.tsx`, `src/features/studio/studio-canvas-shapes.tsx`, `src/features/studio/canvas-templates.ts`, `src/features/studio/canvas-layout.ts`, `src/features/studio/studio-api.ts`  

---

## 10.1 Playlist Studio Client (`src/features/playlists/playlist-studio-client.tsx`)

### Route: `/{locale}/playlists`

### Purpose
Main playlist management interface with two view modes: grid (library) and editor.

### View Modes

**Grid View (Library):**
- Grid of playlist cards
- Each card: name, thumbnail, published status, item count, last updated
- Filter by published/draft
- Search by name
- Create new playlist button → opens `PlaylistCreateWizard`
- Click playlist → switches to editor view

**Editor View:**
- `PlaylistEditorView` component
- Layout: media library (left), timeline (bottom), preview (center/right), inspector (right)
- Top bar with playlist name, save button, publish button
- Toolbar with undo/redo, zoom controls

---

## 10.2 Playlist Studio Sub-components (`src/features/playlists/studio/components/`)

### PlaylistTopBar (`playlist-top-bar.tsx`)
- Playlist name (editable inline)
- Save/Publish buttons
- View toggle (grid/editor)
- Back to library button

### PlaylistToolbar (`playlist-toolbar.tsx`)
- Undo/redo buttons
- Zoom controls
- Timeline toggle
- Preview toggle

### PlaylistHeader (`playlist-header.tsx`)
- Playlist metadata display
- Status badge (published/draft)
- Item count, duration

### PlaylistGridView (`playlist-grid-view.tsx`)
- Grid of playlist cards
- Responsive: 1/2/3/4 columns
- Card: thumbnail, name, status, actions

### PlaylistEditorView (`playlist-editor-view.tsx`)
- Main editing layout
- Combines: media library, timeline, preview, inspector
- Responsive layout adjustments

### PlaylistCard (`playlist-card.tsx`)
- Individual playlist card
- Thumbnail/preview
- Name, status, item count
- Click to edit
- Actions menu (edit, duplicate, delete, publish)

### MediaLibrary (`media-library.tsx`)
- Browse workspace media items
- Filter by type (image, video, audio)
- Search by name
- Drag to timeline
- Upload button

### GroupSidebar (`group-sidebar.tsx`)
- Playlist groups/folders
- Create group
- Drag playlists into groups
- Group expansion/collapse

### InspectorPanel (`inspector-panel.tsx`)
- Properties of selected timeline item
- Duration, transition, effects
- Position, size, opacity
- Zone assignment

### WorkspaceTabs (`workspace-tabs.tsx`)
- Tab switcher between playlist workspace views

---

## 10.3 Playlist Studio Hooks (`src/features/playlists/studio/hooks/`)

### usePlaylistData (`use-playlist-data.ts`)
- Fetches playlist data from API
- SWR-based caching
- Returns `{ playlist, loading, error, mutate }`

### usePlaylistActions (`use-playlist-actions.ts`)
- CRUD operations for playlists
- Create, update, delete, duplicate, publish
- Toast feedback for all actions
- Bumps workspace data epoch on changes

### useTimelineEdit (`use-timeline-edit.ts`)
- Timeline editing state management
- Drag-and-drop reordering
- Duration editing
- Transition configuration
- Undo/redo history
- Selection state

### useGroupActions (`use-group-actions.ts`)
- Playlist group CRUD
- Create, rename, delete groups
- Move playlists between groups

### usePlaylistMeta (`use-playlist-meta.ts`)
- Playlist metadata management
- Name, description, tags
- Published/draft status

---

## 10.4 Playlist Create Wizard (`src/features/playlists/playlist-create-wizard.tsx`)

### Purpose
Multi-step wizard for creating a new playlist.

### Steps
1. **Name & Description:** Enter playlist name and optional description
2. **Template Selection:** Choose a pre-built template or start blank
3. **Media Selection:** Select initial media items
4. **Timeline Configuration:** Set durations and transitions
5. **Review & Create:** Review settings and create

---

## 10.5 Playlist Timeline (`src/features/playlists/playlist-timeline.tsx`)

### Purpose
Visual timeline editor for sequencing media items.

### Features
- Horizontal timeline with media item blocks
- Drag to reorder
- Click to select
- Resize to change duration
- Transition indicators between items
- Time ruler with markers
- Multi-track support for zones
- Snap to grid
- Zoom in/out

---

## 10.6 Playlist Live Preview (`src/features/playlists/playlist-live-preview.tsx`)

### Purpose
Real-time preview of the playlist as it would appear on a screen.

### Features
- Plays through timeline items in sequence
- Shows transitions between items
- Aspect ratio selection (16:9, 9:16, 4:3, 1:1)
- Play/pause/seek controls
- Zone-based preview for multi-zone layouts

---

## 10.7 Playlist Preview Overlay (`src/features/playlists/playlist-preview-overlay.tsx`)

### Purpose
Full-screen overlay preview mode.

### Features
- Full viewport preview
- Simulates screen display
- Keyboard controls (space for play/pause, arrows for seek)
- ESC to close

---

## 10.8 Playlist Zone Preview (`src/features/playlists/playlist-zone-preview.tsx`)

### Purpose
Preview for multi-zone playlist layouts.

### Features
- Visual zone layout editor
- Zone boundaries with drag handles
- Per-zone content assignment
- Zone overlap detection
- Template-based zone layouts

---

## 10.9 Playlist Transitions (`src/features/playlists/playlist-transitions.ts`)

### Available Transitions
| Transition | Description |
|------------|-------------|
| `none` | Instant cut |
| `fade` | Cross-fade between items |
| `slide` | Slide in/out |
| `wipe` | Wipe effect |
| `zoom` | Zoom in/out |

Each transition has configurable duration.

---

## 10.10 Quick Publish Dialog (`src/features/playlists/quick-publish-dialog.tsx`)

### Purpose
Dialog for publishing a playlist to one or more screens.

### Features
- Select target screens (multi-select)
- Select target branches
- Schedule options (immediate or scheduled)
- Confirmation with summary
- Calls publish API

---

## 10.11 Playlist Library Panels (`src/features/playlists/playlist-library-panels.tsx`)

### Purpose
Side panels in the playlist library view.

### Panels
- Filter panel (status, group, date range)
- Sort panel (name, date, items)
- Bulk actions panel

---

## 10.12 Studio Types (`src/features/playlists/studio/types.ts`)

### Playlist Type
```typescript
type Playlist = {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  items: PlaylistItem[];
  groups?: PlaylistGroup[];
  zones?: PlaylistZone[];
};
```

### PlaylistItem
```typescript
type PlaylistItem = {
  id: string;
  mediaId: string;
  duration: number;
  transition?: string;
  transitionDuration?: number;
  order: number;
};
```

---

## 10.13 Canvas Studio (`src/features/studio/studio-editor-client.tsx`)

### Route: `/{locale}/studio`

### Purpose
Canvas-based visual editor using Konva (react-konva) for creating custom screen layouts.

### Layout
- Left panel: Shape tools, templates, layers
- Center: Konva canvas
- Right panel: Properties inspector
- Top bar: Save, export, preview

### Canvas Shapes (`src/features/studio/studio-canvas-shapes.tsx`)
- Rectangle, circle, text, image, video placeholder
- Custom shapes with Konva
- Drag, resize, rotate handles
- Layer ordering

### Canvas Templates (`src/features/studio/canvas-templates.ts`)
Pre-built canvas layouts:
- Full screen image
- Split screen (horizontal/vertical)
- Picture-in-picture
- News ticker layout
- Menu board layout
- Calendar layout

### Canvas Layout (`src/features/studio/canvas-layout.ts`)
- Layout configuration types
- Zone definitions
- Resolution presets

### Studio Panels (`src/features/studio/studio-panels.tsx`)
- Shape picker panel
- Layer list panel
- Properties panel (position, size, rotation, opacity, color, text)
- Template gallery panel

### Studio API (`src/features/studio/studio-api.ts`)
| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchPlaylists(workspaceId)` | GET | `/playlists?workspaceId={ws}` | List playlists |
| `fetchPlaylist(id)` | GET | `/playlists/{id}` | Get playlist |
| `createPlaylist(data)` | POST | `/playlists` | Create playlist |
| `updatePlaylist(id, data)` | PATCH | `/playlists/{id}` | Update playlist |
| `deletePlaylist(id)` | DELETE | `/playlists/{id}` | Delete playlist |
| `duplicatePlaylist(id)` | POST | `/playlists/{id}/duplicate` | Duplicate playlist |
| `publishPlaylist(id, data)` | POST | `/playlists/{id}/publish` | Publish to screens |

---

## 10.12 [V2] UX Analysis — Playlists & Studio

### Playlist Studio — HCI Evaluation

**[V2] Canvas-Based Editor:**
The Playlist Studio uses a canvas-based editor (`CanvasStudio`) — a visual drag-and-drop interface for composing playlist content. This is a complex interaction pattern that requires:
- Spatial reasoning (positioning elements on canvas)
- Understanding of layers and z-index
- Familiarity with design tool conventions (selection, resize handles, alignment)

For users without design tool experience (e.g., Canva, Figma), the canvas editor has a **steep learning curve**. There is no indication of guided onboarding for the studio interface.

**[V2] Studio Panels:**
The studio has four panels: Shape picker, Layer list, Properties, Template gallery. This is a standard design tool layout. However:
- No panel collapse/expand — all panels are always visible, reducing canvas space
- No panel rearrangement — panels are in fixed positions
- No keyboard shortcuts for common operations (add shape, delete layer, duplicate)

**[V2] Playlist Timeline:**
The `PlaylistTimeline` component shows the sequence of content items in the playlist. The timeline is critical for understanding playback order and duration. Key UX considerations:
- Duration editing — can users set custom durations per item?
- Reordering — drag-and-drop or button-based reordering?
- Transitions — visual indication of transition types between items

**[V2] Live Preview:**
The `PlaylistLivePreview` and `PlaylistPreviewOverlay` components provide realtime preview of the playlist. This is essential for a digital signage product — users need to see exactly how their content will appear on screens. The preview should accurately represent:
- Screen resolution/aspect ratio
- Content positioning
- Transition effects
- Timing/duration

### Playlist Library — UX Analysis

**[V2] Library Panels:**
The playlist library uses panels for organization. This is a good pattern for separating published vs draft playlists, or organizing by category.

**[V2] Quick Publish Dialog:**
The `QuickPublishDialog` allows publishing a playlist to screens with minimal friction. This is a good power-user pattern — users who know what they want can publish quickly without navigating through multiple screens.

**[V2] Playlist Duplication:**
The API includes `duplicatePlaylist` — this is a useful feature for creating variations of existing playlists. The UI should provide a "Duplicate" action on playlist cards/items.

### Create Wizard — UX Analysis

**[V2] Multi-Step Wizard:**
The `PlaylistCreateWizard` guides users through playlist creation. Wizards are good for complex first-time tasks but add friction for experienced users. There should be a "skip wizard" or "quick create" option for power users.

### [V2] Enterprise SaaS Evaluation

**[V2] Missing Playlist Features:**
- No playlist versioning/history
- No playlist approval workflow
- No playlist scheduling from studio (must go to schedules separately)
- No playlist analytics (which playlists are most played)
- No playlist templates (reusable structures)
- No nested playlists (playlist within playlist)
- No A/B testing for playlists
- No playlist comments/collaboration

### Cross-References
- See `05-ui-component-library.md` for dialog and tab components used in studio
- See `09-screens-feature.md` for screen assignment
- See `12-schedules-feature.md` for scheduling playlists
- See `13-branches-feature.md` for branch-level playlist management
- See `27-user-flows.md` for playlist creation and publishing user journeys
