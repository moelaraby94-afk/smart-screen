# 34 — Media Components

> **Evidence basis:** `15-cards.md`, `09-interaction-states.md`, `07-motion-system.md`, `19-loading-states.md`, `screen-specifications/05-content-specs.md` SCR-CN-02, `ux-blueprint/09-content-studio-ux-blueprint.md`

---

## Component: MediaCard

### Purpose
Display a single media file in a grid with thumbnail and actions.

### Usage
Content Media tab grid.

### Structure
```
<MediaCard media={item} onMenuAction={handleMenuAction} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="interactive"`, `--radius-lg`, `size="compact"` |
| Thumbnail | Square or 16:9, fills card top |
| Image | `<img>` with `alt` text |
| Video | Video frame thumbnail + play icon overlay + duration badge |
| Filename | `--text-xs --font-medium --foreground`, `truncate` |
| Type badge | Image/Video badge (`--text-xs`) |
| Size | `--text-xs --muted-foreground` |
| "More" menu | `MoreHorizontal` icon, top-right (appears on hover) |

### States
| State | Visual |
|-------|--------|
| Default | `--shadow-xs` |
| Hover | `--shadow-sm`, menu appears, filename fully visible (MI-01, 150ms) |
| Uploading | Progress bar overlay on thumbnail |
| Error | `AlertCircle` icon overlay, `--destructive` border |

### "More" Menu Actions
| Action | Icon | Behavior |
|--------|------|----------|
| Replace (future) | `RefreshCw` | Open file picker for replacement |
| Delete | `Trash2` | Open AlertDialog with playlist usage warning |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `media` | `MediaItem` | Media entity |
| `onMenuAction` | `(action, id) => void` | Menu action handler |

### Accessibility
- `aria-label="[filename], [type], [size]"`
- Image: `alt` attribute with filename
- Focus: `ring-2 ring-ring ring-offset-2`

### Animations
- Hover: MI-01 (150ms, shadow + menu)
- Mount: MI-08 (300ms, fade in up) with stagger
- Remove: MI-09 (150ms, fade out)

---

## Component: UploadDropZone

### Purpose
Area for dragging and dropping files for upload.

### Usage
Media tab (upload sub-tab), Studio Media panel (upload tab).

### Structure
```
<UploadDropZone onDrop={handleUpload} accept="image/*,video/*" />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | `border-2 border-dashed --border`, `--radius-lg` |
| Height | `h-48` (default) |
| Background | `--muted/20` |
| Hover (dragging) | `--primary/10` bg, `--primary` border |
| Icon | `Upload` (32px, `--muted-foreground`), centered |
| Text | "Drag files here or click to browse" |
| Subtext | `--text-xs --muted-foreground` ("Images and videos, max [size]MB") |
| Button | "Browse Files" button (outline) |

### States
| State | Visual |
|-------|--------|
| Default | Dashed border, `--muted/20` bg |
| Dragging | `--primary/10` bg, `--primary` border, "Drop files here" text |
| Uploading | Hidden (replaced by UploadProgressList) |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `onDrop` | `(files: File[]) => void` | File drop handler |
| `accept` | `string` | Accepted file types |
| `maxSize` | `number` | Max file size (MB) |
| `multiple` | `boolean` | Allow multiple files |

### Accessibility
- Click triggers hidden file input
- `aria-label="Upload files"`
- Keyboard: Enter/Space triggers file picker

### Mobile
- Drop zone not functional on mobile (no drag-drop)
- "Browse Files" button works on mobile (triggers file picker)

---

## Component: UploadProgressList

### Purpose
Show upload progress for multiple files.

### Usage
Media tab (during upload), Studio (during upload).

### Structure
```
<UploadProgressList uploads={uploads} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | Fixed bottom-right (desktop), bottom-center (mobile) |
| Background | `--card`, `--shadow-lg`, `--radius-lg` |
| Width | 320px (desktop), `calc(100vw - 32px)` (mobile) |
| Max height | 300px (scrollable) |
| Each item | Filename + progress bar + status |

### Upload Item
| Element | Style |
|---------|-------|
| Filename | `--text-sm --font-medium --foreground`, `truncate` |
| Progress bar | `h-1.5 --muted` track, `--primary` fill |
| Status (uploading) | `--text-xs --muted-foreground` ("Uploading... 45%") |
| Status (complete) | `--text-xs --success` ("Complete") + fade out after 3s |
| Status (error) | `--text-xs --destructive` ("Failed") + "Retry" button |
| Retry button | `ghost`, `sm`, "Retry" |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `uploads` | `UploadItem[]` | Active uploads |
| `onRetry` | `(id) => void` | Retry failed upload |

### UploadItem
| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Upload ID |
| `filename` | `string` | File name |
| `progress` | `number` | 0-100 |
| `status` | `uploading \| complete \| error` | Upload status |
| `error` | `string` | Error message (if error) |

### Behavior
- Completed uploads fade out after 3 seconds
- Max 3 concurrent uploads (frontend limit)
- New cards appear as uploads complete (fade in, MI-08)

---

## Component: DropZoneOverlay

### Purpose
Full-page overlay shown when dragging files over the page.

### Usage
Media tab (drag files anywhere on page).

### Visual Design
| Element | Style |
|---------|-------|
| Container | `fixed inset-0 z-40` |
| Background | `--primary/5` |
| Border | `4px dashed --primary` |
| Content | Centered: `Upload` icon (48px) + "Drop files here" text |
| Text | `--text-xl --font-semibold --primary` |

### Behavior
- Visible only when dragging files over page
- Hidden when drag leaves page or files are dropped
- Animation: MI-08 (fade in, 200ms)

---

## Cross-References

- See `15-cards.md` for Card component
- See `19-loading-states.md` for ProgressBar
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for MI-01, MI-08
- See `screen-specifications/05-content-specs.md` SCR-CN-02 for Media spec
- See `ux-blueprint/09-content-studio-ux-blueprint.md` for content UX
