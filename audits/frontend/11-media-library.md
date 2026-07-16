# 11 — Media Library Feature

> **Source basis:** `src/features/media/media-library-client.tsx`, `src/features/media/media-grid-sections.tsx`, `src/features/media/media-preview-components.tsx`, `src/features/media/api/media-api.ts`  

---

## 11.1 Media Library Client (`src/features/media/media-library-client.tsx`)

### Route: `/{locale}/media`

### Page Structure
- Server component renders header (kicker, title, description) then wraps `MediaLibraryClient` in `<Suspense>`
- `MediaLibraryClient` is the largest feature component (~32KB) handling full media management

### Key Features

**Grid View:**
- Responsive grid of media thumbnails
- Filter by type: image, video, audio, document
- Search by filename
- Sort by: name, date, size, type
- Multi-select with checkboxes
- Bulk delete, bulk move to folder

**Upload:**
- Drag-and-drop upload zone
- Multi-file upload with progress indicators
- File type validation
- File size limits (from subscription)
- Upload completion triggers Socket.IO `upload:complete` event → toast notification

**Preview:**
- Click media item → opens preview overlay
- Image: full display with zoom
- Video: inline player with controls
- Audio: waveform/player
- Document: metadata display

**Actions per item:**
- Preview
- Download
- Rename
- Delete (with confirmation)
- Copy URL
- Assign to playlist
- View usage (which playlists use this media)

**Storage indicator:**
- Shows used storage vs. limit
- Progress bar with warning colors near limit
- Calls billing API for limits

### Media Item Type
```typescript
type MediaItem = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 11.2 Media Grid Sections (`src/features/media/media-grid-sections.tsx`)

### Purpose
Renders the grid of media items with various states.

### Sections
- **Filter bar:** Type filter buttons, search input, sort dropdown, view toggle
- **Media grid:** Responsive grid (2/3/4/5 columns based on breakpoint)
- **Media card:** Thumbnail, filename, type badge, size, actions menu
- **Selection bar:** Appears when items are selected, shows count and bulk actions
- **Empty state:** `EmptyState` component with upload CTA
- **Loading state:** Skeleton grid pattern

### Card Layout
```tsx
<div className="group relative rounded-xl border border-border bg-card overflow-hidden">
  <div className="aspect-square">{thumbnail}</div>
  <div className="p-3">
    <p className="truncate text-sm font-medium">{filename}</p>
    <p className="text-xs text-muted-foreground">{type} · {size}</p>
  </div>
  <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100">
    {actionsMenu}
  </div>
</div>
```

---

## 11.3 Media Preview Components (`src/features/media/media-preview-components.tsx`)

### Components
- `MediaPreviewOverlay` — Full-screen overlay for media preview
- `ImagePreview` — Image display with zoom/pan
- `VideoPreview` — Video player with controls
- `AudioPreview` — Audio player with waveform
- `DocumentPreview` — Document metadata and download

### Overlay Behavior
- `fixed inset-0 z-[200] bg-black/80` overlay
- Centered content with max dimensions
- Close button (X) in top-end corner
- ESC to close
- Click outside to close

---

## 11.4 Media API (`src/features/media/api/media-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchMedia(workspaceId)` | GET | `/media?workspaceId={ws}` | List media items |
| `uploadMedia(workspaceId, file)` | POST | `/media/upload` | Upload file (FormData) |
| `deleteMedia(id)` | DELETE | `/media/{id}` | Delete media item |
| `renameMedia(id, name)` | PATCH | `/media/{id}` | Rename media item |
| `getMediaUrl(id)` | GET | `/media/{id}/url` | Get signed URL |

### Upload Implementation
Uses `FormData` with file blob. `apiFetch` detects `FormData` body and does not set `Content-Type` (lets browser set multipart boundary).

---

## 11.5 Storage Usage

The media library integrates with the billing API to show storage usage:
- `UsageIndicator` component (`src/components/usage-indicator.tsx`) fetches subscription limits
- Shows progress bar: used storage / storage limit
- Shows screen count: used screens / screen limit
- Warning colors when approaching limit (amber > 80%, red > 100%)
- Accessible progress bar with `role="progressbar"` and aria attributes

---

## 11.6 [V2] UX Analysis — Media Library

### Media Grid — HCI Evaluation

**[V2] Grid Layout:**
The media library uses a grid layout for displaying media items. Grid is appropriate for visual content (images, videos) where thumbnails help identification. However:
- No list view toggle for users who prefer filename-based browsing
- No size toggle (small/medium/large thumbnails)
- No sort options (by name, date, size, type)

**[V2] No Bulk Operations:**
Like the screens list, the media library has no bulk selection. Users cannot:
- Select multiple files for batch deletion
- Select multiple files for batch tagging/categorization
- Select multiple files for batch assignment to playlists

This is a **significant enterprise UX gap** for media management.

**[V2] Upload Experience:**
The upload uses `FormData` with file blob — standard single-file upload. Key UX considerations:
- **No drag-and-drop**: Users must use the file picker dialog
- **No multi-file upload**: One file at a time
- **No upload progress**: No progress bar for large files
- **No upload queue**: Cannot queue multiple uploads
- **No upload cancellation**: Cannot cancel an in-progress upload

For a digital signage product where users upload large video files, the lack of upload progress and multi-file upload is a **major UX gap**.

**[V2] Media Preview:**
The `MediaPreviewComponents` provide preview of media items. For:
- Images: Thumbnail/preview display
- Videos: Video player or thumbnail with play indicator
- Other types: Icon-based representation

The preview quality and format support determines how well users can assess their media content before using it in playlists.

### Storage Usage — UX Analysis

**[V2] Usage Indicator:**
The `UsageIndicator` component shows storage and screen usage with:
- Progress bar: used / limit
- Warning colors: amber > 80%, red > 100%
- Accessible: `role="progressbar"` with aria attributes

This is a well-implemented usage indicator. The color thresholds (80% amber, 100% red) follow standard SaaS patterns. The accessibility attributes ensure screen reader users can access the information.

**[V2] No Proactive Limit Warning:**
The usage indicator shows current usage but doesn't proactively warn users when they're about to hit a limit. For example:
- When uploading a file that would exceed storage, the upload should be blocked with a clear message
- When at 95% storage, a banner or toast should suggest upgrading
- When at 100% screen limit, the "Add Screen" button should be disabled with a tooltip explaining why

### [V2] Enterprise SaaS Evaluation

**[V2] Missing Media Library Features:**
- No media folders/collections
- No media tagging or categories
- No media search by name/type
- No media versioning (replace file keeping same ID)
- No media analytics (which media is most used)
- No media expiration (auto-delete after date)
- No media transcoding/optimization
- No external media URLs (YouTube, Vimeo streams)
- No media approval workflow

### Cross-References
- See `08-dashboard-and-overview.md` for storage usage on dashboard
- See `10-playlists-and-studio.md` for media usage in playlists
- See `14-settings-feature.md` for billing and plan limits
- See `23-error-handling-and-states.md` for upload error handling
- See `26-consistency-audit.md` for grid pattern consistency
