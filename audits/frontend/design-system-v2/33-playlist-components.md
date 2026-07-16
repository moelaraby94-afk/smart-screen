# 33 — Playlist Components

> **Evidence basis:** `15-cards.md`, `09-interaction-states.md`, `07-motion-system.md`, `screen-specifications/05-content-specs.md` SCR-CN-01, SCR-CN-03, `ux-blueprint/09-content-studio-ux-blueprint.md`

---

## Component: PlaylistCard

### Purpose
Display a single playlist entity in a grid with preview, status, and actions.

### Usage
Content Playlists tab grid.

### Structure
```
<PlaylistCard
  playlist={playlist}
  onClick={() => navigate(`/content/playlists/${playlist.id}`)}
  onMenuAction={handleMenuAction}
/>
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="interactive"`, `--radius-lg` |
| Thumbnail | 16:9 aspect ratio, top section |
| Thumbnail placeholder | `--muted` bg with `Image` icon (24px, `--muted-foreground`) |
| Name | `--text-sm --font-medium --foreground`, `truncate` |
| Status badge | Below name (Draft/Published) |
| Media count | `--text-xs --muted-foreground` ("5 items") |
| Last modified | `--text-xs --muted-foreground` ("Updated 2h ago") |
| "More" menu | `MoreHorizontal` icon, top-right (appears on hover) |

### States
| State | Visual |
|-------|--------|
| Default | `--shadow-xs` |
| Hover | `--shadow-sm`, "More" menu appears (MI-01, 150ms) |
| Draft | Badge `muted` variant, "Draft" |
| Published | Badge `success` variant, "Published" |

### "More" Menu Actions
| Action | Icon | Behavior |
|--------|------|----------|
| Edit in Studio | `Pencil` | Navigate to Studio |
| Duplicate | `Copy` | API call → toast |
| Delete | `Trash2` | Open AlertDialog with schedule warning |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `playlist` | `Playlist` | Playlist entity |
| `onClick` | `() => void` | Card click handler |
| `onMenuAction` | `(action, id) => void` | Menu action handler |

### Accessibility
- `role="button"`, `aria-label="[Name], [Status], [N] items"`
- Focus: `ring-2 ring-ring ring-offset-2`
- Keyboard: `Enter` to open

### Animations
- Hover: MI-01 (150ms, shadow + menu)
- Mount: MI-08 (300ms, fade in up) with stagger
- Remove: MI-09 (150ms, fade out + scale)

---

## Component: TemplateCard

### Purpose
Display a playlist template in the template picker dialog.

### Usage
Template Picker Dialog (`13-shared-dialogs-specs.md` SCR-DLG-02).

### Structure
```
<TemplateCard template={template} onClick={() => handleSelect(template)} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="interactive"`, `--radius-lg` |
| Preview | 16:9 aspect ratio thumbnail |
| Name | `--text-sm --font-medium --foreground` |
| Description | `--text-xs --muted-foreground` |
| Hover | `--shadow-sm`, `border-primary` highlight (MI-01, 150ms) |

### Props
| Prop | Type | Description |
|------|------|-------------|
| `template` | `Template` | Template entity |
| `onClick` | `() => void` | Selection handler |

### Accessibility
- `role="button"`, `aria-label="[Name] template"`
- Focus: `ring-2 ring-ring ring-offset-2`

---

## Component: PlaylistPreview

### Purpose
Live auto-playing preview of a playlist.

### Usage
Playlist Detail page.

### Structure
```
<PlaylistPreview playlist={playlist} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | 16:9 aspect ratio, `--radius-lg`, `--shadow-xs` |
| Background | `--neutral-900` (dark, simulates screen) |
| Content | Auto-playing, looping (images cycle, videos play) |
| Loading | Splash or spinner until content loads |

### Behavior
- Auto-play on mount
- Loop continuously
- Images: Display for their duration, then transition
- Videos: Play full duration
- No controls (preview only, not interactive)

### Accessibility
- `aria-label="Playlist preview"`, `role="img"`
- Content not accessible to screen readers (visual preview)

### Performance
- Start playing within 2s of page load
- Preload media for smooth transitions

---

## Component: MediaItemsList

### Purpose
Ordered list of media items within a playlist.

### Usage
Playlist Detail page.

### Structure
```
<MediaItemsList items={playlist.items} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | List component (`17-lists.md`) |
| Each item | Thumbnail (32px) + name + duration |
| Thumbnail | 16:9 or square, `--radius-sm` |
| Name | `--text-sm --font-medium --foreground` |
| Duration | `--text-xs --muted-foreground` (right-aligned) |
| Order | Numbered (1, 2, 3...) |

### Empty State
- "No media items. Edit in Studio to add content." + "Edit in Studio" button

---

## Component: AssignedScreensList

### Purpose
List of screens currently playing a playlist.

### Usage
Playlist Detail page.

### Structure
```
<AssignedScreensList screens={assignedScreens} />
```

### Visual Design
| Element | Style |
|---------|-------|
| Container | List component |
| Each item | Screen name + status badge |
| Click | Navigate to Screen Detail |

### Empty State
- "Not published to any screen" + "Publish to Screens" button

---

## Cross-References

- See `15-cards.md` for Card and Badge
- See `17-lists.md` for List component
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for MI-01, MI-08, MI-09
- See `screen-specifications/05-content-specs.md` for Content specs
- See `13-shared-dialogs-specs.md` SCR-DLG-02 for Template Picker
- See `ux-blueprint/09-content-studio-ux-blueprint.md` for content UX
