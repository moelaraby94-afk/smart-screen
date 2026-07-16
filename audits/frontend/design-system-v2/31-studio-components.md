# 31 — Studio Components

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `09-interaction-states.md`, `10-accessibility-rules.md`, `screen-specifications/06-studio-spec.md`, `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-04

---

## 1. Studio Component Philosophy

Studio components are specialized for the visual canvas editor. They are **desktop-only** and have unique interaction patterns (drag, resize, rotate) not found in other parts of the application.

---

## 2. Components

### Component: KonvaCanvas

#### Purpose
Visual canvas for editing playlist layers using Konva.js.

#### Usage
Studio page only.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `layers` | `Layer[]` | Array of layers (bottom-to-top order) |
| `selectedId` | `string` | Selected layer ID |
| `onSelect` | `(id) => void` | Layer selection handler |
| `onChange` | `(layer) => void` | Layer update handler |
| `screenSize` | `{w, h}` | Target screen resolution |

#### Visual
- Background: `--neutral-900` (dark, simulates screen display)
- Canvas: Centered, scaled to fit available space
- Selection: Blue bounding box with resize handles
- Layer types: Image, Video, Text, Shape (future)

#### Interactions
| Interaction | Behavior |
|-------------|---------|
| Click layer | Select layer |
| Drag layer | Move layer |
| Drag resize handle | Resize layer (Shift = maintain aspect) |
| Drag rotation handle | Rotate layer |
| Click empty canvas | Deselect |
| Delete key | Delete selected layer |
| Arrow keys | Nudge selected 1px (Shift = 10px) |

#### Accessibility
- `role="application"`, `aria-label="Playlist canvas editor"`
- Canvas content not accessible to screen readers (visual editor)
- Keyboard: Arrow keys for nudge, Delete for remove
- Limitation acknowledged and accepted

---

### Component: MediaPanel

#### Purpose
Left panel for browsing and uploading media to add to canvas.

#### Structure
```
<MediaPanel>
  <Tabs value={mediaTab}>
    <TabsTrigger value="library">Library</TabsTrigger>
    <TabsTrigger value="upload">Upload</TabsTrigger>
  </Tabs>
  <TabsContent value="library">
    <SearchInput placeholder="Search media..." />
    <MediaGrid items={mediaItems} onClick={addLayer} onDragStart={handleDrag} />
  </TabsContent>
  <TabsContent value="upload">
    <UploadDropZone onDrop={handleUpload} />
  </TabsContent>
</MediaPanel>
```

#### Visual
- Width: 280px fixed
- Background: `--card`
- Border: `--border` (right, 1px)
- Scrollable: Panel content scrolls independently

---

### Component: PropertiesPanel

#### Purpose
Right panel for editing selected layer properties.

#### Structure
```
<PropertiesPanel>
  {selectedLayer ? (
    <LayerProperties layer={selectedLayer} onChange={updateLayer} />
  ) : (
    <EmptyState icon={MousePointer} title="Select a layer" description="Click a layer on the canvas to edit its properties." />
  )}
</PropertiesPanel>
```

#### Visual
- Width: 300px fixed
- Background: `--card`
- Border: `--border` (left, 1px)
- Scrollable: Panel content scrolls independently

---

### Component: LayerProperties

#### Purpose
Form for editing selected layer's properties.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `layer` | `Layer` | Selected layer object |
| `onChange` | `(updates) => void` | Property update handler |

#### Contents (All layers)
| Property | Input | Range |
|----------|-------|-------|
| Position X | Number input | 0 to screenSize.w |
| Position Y | Number input | 0 to screenSize.h |
| Width | Number input | 1 to screenSize.w |
| Height | Number input | 1 to screenSize.h |
| Rotation | Slider | 0° to 360° |
| Opacity | Slider | 0% to 100% |
| Duration | Number input | 1 to 3600 (seconds) |

#### Contents (Text layers)
| Property | Input |
|----------|-------|
| Text content | Textarea |
| Font family | Select dropdown |
| Font size | Number input |
| Color | Color picker |
| Alignment | Button group (left, center, right) |

#### Contents (Media layers)
| Property | Input |
|----------|-------|
| Media source | Read-only text |
| Fit mode | Select (contain, cover, fill) |

#### Behavior
- All property changes update canvas in real-time (live preview)
- Number inputs: Drag to scrub (future)
- Sliders: Smooth drag, value tooltip

---

### Component: LayerList (Timeline)

#### Purpose
Bottom panel showing ordered list of layers (z-index order).

#### Structure
```
<LayerList
  layers={layers}
  selectedId={selectedLayerId}
  onSelect={setSelectedLayerId}
  onReorder={reorderLayers}
  onToggleVisibility={toggleVisibility}
  onToggleLock={toggleLock}
/>
```

#### Visual
- Height: 60px fixed
- Background: `--card`
- Border: `--border` (top, 1px)
- Layout: Horizontal list, scrollable
- Each item: Thumbnail/icon + name + visibility toggle + lock toggle

#### Layer Item
| Element | Style |
|---------|-------|
| Thumbnail | 32px × 20px (16:9) or icon |
| Name | `--text-xs --font-medium --foreground`, `truncate` |
| Visibility toggle | `Eye` / `EyeOff` (14px) |
| Lock toggle | `Lock` / `Unlock` (14px) |
| Selected | `--primary/10` bg |
| Hover | `--muted/50` bg |
| Gap | `--space-2` between items |

#### Interactions
| Interaction | Behavior |
|-------------|---------|
| Click item | Select layer |
| Drag item | Reorder (change z-index) |
| Click eye | Toggle visibility |
| Click lock | Toggle lock (prevent selection/edit) |

#### Accessibility
- `role="listbox"`, `aria-label="Layer timeline"`
- Items: `role="option"`, `aria-selected`
- Keyboard: Tab through items, Enter to select

---

### Component: PreviewOverlay

#### Purpose
Full-screen overlay showing playlist preview (auto-playing).

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `playlist` | `Playlist` | Playlist to preview |
| `onClose` | `() => void` | Close handler |

#### Visual
- Full screen: `fixed inset-0 z-50`
- Background: `--neutral-900`
- Content: Centered, 16:9, auto-playing
- Close: Click anywhere or Escape
- Animation: MI-08 (fade in, 300ms)

---

### Component: StudioToolbar

#### Purpose
Top toolbar for Studio (Back, name, Preview, Save).

#### Structure
```
<StudioToolbar>
  <Button variant="ghost" onClick={handleBack}><ArrowLeft /> Back</Button>
  <EditableText value={playlistName} onChange={setPlaylistName} />
  <Spacer />
  <Button variant="ghost" onClick={togglePreview}><Play /> Preview</Button>
  <Button variant="default" onClick={handleSave} disabled={isSaving}>
    {isSaving ? <Spinner /> : "Save"}
  </Button>
</StudioToolbar>
```

#### Visual
- Height: 48px
- Background: `--card`
- Border: `--border` (bottom, 1px)
- Padding: `--space-2 --space-4`

---

### Component: EditableText

#### Purpose
Text that can be clicked to edit inline.

#### Usage
Studio toolbar (playlist name), (future) inline rename on cards.

#### States
| State | Visual |
|-------|--------|
| Display | `--text-base --font-medium`, hover shows edit cursor |
| Edit | Input field, auto-focus, select all |

#### Behavior
- Double-click: Enter edit mode
- Enter: Save and exit edit mode
- Escape: Cancel and exit edit mode
- Blur: Save and exit edit mode

---

## 3. Studio-Specific Rules

- **Desktop only:** Studio is not supported on mobile (< 1024px)
- **No app shell:** Studio overrides sidebar and header (full-screen)
- **Dark canvas:** Canvas background is `--neutral-900` (simulates screen)
- **Real-time updates:** Property changes reflect on canvas immediately
- **No auto-save (current):** Manual save only (future: auto-save after 30s)
- **No undo/redo (current):** Future implementation
- **Konva.js:** Canvas uses Konva.js library (`react-konva`)

---

## Cross-References

- See `01-foundations.md` for all tokens
- See `07-motion-system.md` for animation tokens
- See `10-accessibility-rules.md` for accessibility (with acknowledged limitations)
- See `screen-specifications/06-studio-spec.md` for full Studio spec
- See `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-04 for Studio UX
