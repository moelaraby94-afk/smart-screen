# Display Configuration Pipeline — Production Documentation

## 1. Final Architecture Diagram

```
Dashboard (Next.js)
  │  User configures: renderMode, orientation, targetWidth, targetHeight
  │  User uploads: media (images/videos), creates canvases
  ↓
Backend (NestJS)
  │  PlaylistsService.buildPayload() → PlaylistResolutionService
  │  MediaService.toResponse() → includes width, height, durationSec, rotation, codec, bitrate, frameRate
  │  PlaylistResolutionService.serializeItem() → { kind, media: MediaResponse, canvas: CompiledPayload }
  │  buildPayload() → { renderMode, orientation, targetWidth, targetHeight, items[] }
  │  buildRotationPayload() → same shape, merged items from rotation assignments
  ↓
Database (PostgreSQL)
  │  Playlist: renderMode, orientation, targetWidth, targetHeight
  │  Media: width, height, durationSec, rotation, codec, bitrate, frameRate
  │  ScreenPlaylistAssignment: rotation assignments
  ↓
Player API (REST + Socket.IO)
  │  GET /player/bootstrap → { playlist: PlaylistPayload, orientation, ... }
  │  Socket 'screen:playlist-update' → { playlist: PlaylistPayload }
  ↓
Parser (playlist-utils.ts)
  │  parsePlaylistPayload() → normalizes renderMode, orientation, targetWidth, targetHeight
  │  normalizeItem() → parses media.width, media.height, media.durationSec, media.rotation
  ↓
Rendering Strategy (rendering/rendering-strategy.ts)
  │  computeRenderDecision(input) → RenderDecision
  │  ├─ orientation.ts: resolveOrientation(), resolveRotation(), shouldSwapDimensions(), getEffectiveViewport()
  │  ├─ scaling.ts: resolveObjectFit(), resolveCanvasScaleMode(), computeCanvasTransform()
  │  └─ types.ts: RenderDecision contract (no CSS, no React)
  ↓
RenderDecision (abstract output)
  │  { objectFit, scaleMode, rotation, swapDimensions, alignment, viewport, canvasScale, effectiveOrientation }
  ↓
Player Runtime (player-runtime.tsx)
  │  Computes renderDecision once per playlist
  │  Translates renderDecision.rotation + swapDimensions → CSS transform on container
  │  Passes renderDecision.objectFit + renderMode + orientation → PlaylistEngine
  ↓
Playlist Engine (playlist-engine.tsx)
  │  MediaSlide: translates renderDecision.objectFit → CSS via objectFitToCss()
  │  CanvasKonvaView: receives renderMode + orientation → computes canvas transform
  ↓
Canvas / Image / Video Rendering
  │  Image: <img> with object-fit CSS classes from objectFitToCss()
  │  Video: <video> with object-fit CSS classes from objectFitToCss()
  │  Canvas: Konva <Stage> with scale + offset from computeCanvasRenderDecision()
```

## 2. Display Configuration Data Flow

```
User Input (Dashboard)
  │
  ├─ Playlist Form
  │   ├─ renderMode: CONTAIN | COVER | CENTER | FIT_WIDTH | FIT_HEIGHT
  │   ├─ orientation: AUTO | LANDSCAPE | PORTRAIT | SQUARE
  │   ├─ targetWidth: number (canvas design width)
  │   └─ targetHeight: number (canvas design height)
  │
  ├─ Media Upload
  │   ├─ Image: sharp extracts width, height
  │   └─ Video: ffprobe extracts width, height, durationSec, rotation, codec, bitrate, frameRate
  │
  └─ Canvas Editor
      └─ Canvas: width, height (design resolution)

Backend Serialization
  │
  ├─ Playlist payload: { renderMode, orientation, targetWidth, targetHeight, items[] }
  ├─ Media item: { id, mimeType, publicUrl, width, height, durationSec, rotation, ... }
  └─ Canvas item: { id, name, width, height, durationSec, layoutData }

Player Parsing
  │
  ├─ parsePlaylistPayload(): normalizes all fields with type coercion
  └─ normalizeItem(): extracts media.width, height, durationSec, rotation from raw payload

Rendering Strategy
  │
  └─ computeRenderDecision({ renderMode, orientation, screenWidth, screenHeight, targetWidth, targetHeight, mediaWidth, mediaHeight, mediaRotation })
      → RenderDecision

Player Rendering
  │
  ├─ player-runtime.tsx: renderDecision → CSS transform (rotation + dimension swap)
  ├─ playlist-engine.tsx: renderDecision.objectFit → objectFitToCss() → CSS classes
  └─ canvas-konva-view.tsx: renderDecision.canvasScale → Konva Group scale + offset
```

## 3. Rendering Strategy Architecture

```
rendering/
├── types.ts                    Type definitions (no logic, no React, no CSS)
├── orientation.ts              Orientation resolution (AUTO, rotation, dimension swap)
├── scaling.ts                  Scaling resolution (object-fit mapping, canvas transform)
├── rendering-strategy.ts       Entry point — combines orientation + scaling → RenderDecision
├── orientation.test.ts         21 tests
├── scaling.test.ts             18 tests
└── rendering-strategy.test.ts  36 tests
```

**Design principles:**
- Pure functions — no side effects, no React, no CSS
- Single source of truth for all rendering decisions
- Components consume `RenderDecision` and translate to CSS/Konva — they never make rendering decisions
- Extensible: new render modes or orientations require changes only in `scaling.ts` or `orientation.ts`

## 4. RenderDecision Contract

```typescript
type RenderDecision = {
  /** How media should fit — maps to CSS object-fit */
  objectFit: 'contain' | 'cover' | 'center' | 'fit_width' | 'fit_height';

  /** How canvas should be scaled — maps to Konva scale calculation */
  scaleMode: 'contain' | 'cover' | 'stretch';

  /** CSS rotation in degrees for the container (0, 90, 180, 270) */
  rotation: number;

  /** Whether width/height should be swapped (portrait rotation on landscape screen) */
  swapDimensions: boolean;

  /** How to align media when it doesn't fill the viewport */
  alignment: 'center' | 'start' | 'end';

  /** Effective viewport dimensions after orientation resolution */
  viewport: { width: number; height: number };

  /** Canvas scaling transform for Konva Stage */
  canvasScale: {
    scale: number;
    offsetX: number;
    offsetY: number;
    scaleMode: 'contain' | 'cover' | 'stretch';
  };

  /** Resolved orientation (AUTO → LANDSCAPE/PORTRAIT/SQUARE based on screen) */
  effectiveOrientation: 'AUTO' | 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';
};
```

## 5. Orientation Resolution Flow

```
Input: orientation + screenWidth + screenHeight
  │
  ├─ AUTO + screen wider than tall → LANDSCAPE
  ├─ AUTO + screen taller than wide → PORTRAIT
  ├─ AUTO + screen square → SQUARE
  ├─ AUTO + no screen dims → LANDSCAPE (default)
  ├─ LANDSCAPE → LANDSCAPE (passthrough)
  ├─ PORTRAIT → PORTRAIT (passthrough)
  └─ SQUARE → SQUARE (passthrough)
  │
  ↓
  Container Rotation:
  ├─ PORTRAIT → 90°
  └─ LANDSCAPE/SQUARE/AUTO → 0°
  │
  ↓
  Dimension Swap:
  ├─ PORTRAIT + landscape screen (w > h) → swap = true
  ├─ PORTRAIT + portrait screen (h > w) → swap = false
  ├─ PORTRAIT + unknown screen → swap = true (assume landscape)
  └─ LANDSCAPE/SQUARE → swap = false
  │
  ↓
  Effective Viewport:
  ├─ swap = true → { width: screenHeight, height: screenWidth }
  └─ swap = false → { width: screenWidth, height: screenHeight }
```

## 6. RenderMode Resolution Flow

```
Input: renderMode
  │
  ├─ CONTAIN  → objectFit: 'contain'  | scaleMode: 'contain'
  │             Media: letterbox, entire image visible
  │             Canvas: entire canvas visible, centered with black bars
  │
  ├─ COVER    → objectFit: 'cover'    | scaleMode: 'cover'
  │             Media: fill viewport, crop overflow
  │             Canvas: fill viewport, crop edges
  │
  ├─ CENTER   → objectFit: 'center'   | scaleMode: 'contain'
  │             Media: natural size, centered (object-none)
  │             Canvas: contain (canvas always fully visible)
  │
  ├─ FIT_WIDTH  → objectFit: 'fit_width'  | scaleMode: 'contain'
  │               Media: scale to viewport width, preserve aspect ratio
  │               Canvas: contain
  │
  └─ FIT_HEIGHT → objectFit: 'fit_height' | scaleMode: 'contain'
                  Media: scale to viewport height, preserve aspect ratio
                  Canvas: contain
```

## 7. Canvas Scaling Flow

```
Input: scaleMode + canvasWidth + canvasHeight + viewportWidth + viewportHeight
  │
  ├─ contain:
  │   scale = min(viewportW/canvasW, viewportH/canvasH, maxScale=4)
  │   offsetX = (viewportW - canvasW × scale) / 2
  │   offsetY = (viewportH - canvasH × scale) / 2
  │   → Entire canvas visible, centered with black bars
  │
  ├─ cover:
  │   scale = max(viewportW/canvasW, viewportH/canvasH, maxScale=4)
  │   offsetX = (viewportW - canvasW × scale) / 2  (negative = cropped)
  │   offsetY = (viewportH - canvasH × scale) / 2  (negative = cropped)
  │   → Canvas fills viewport, edges cropped equally
  │
  └─ stretch (reserved):
      Non-uniform scale — not currently used
  │
  ↓
  Konva Application:
  <Stage width={viewportW} height={viewportH}>
    <Layer>
      <Rect fill="#030712" />  (background)
      <Group x={offsetX} y={offsetY} scaleX={scale} scaleY={scale}>
        {canvas objects}
      </Group>
    </Layer>
  </Stage>
```

## 8. Video Metadata Flow

```
Upload (media.service.ts)
  │
  ├─ Buffer received from multer (max 150MB)
  ├─ Magic byte detection via file-type (validates actual content, not just MIME)
  ├─ If detected.mime is video:
  │   └─ extractVideoMetadata(buffer) → video-metadata.ts
  │       ├─ Write buffer to temp file
  │       ├─ Run ffprobe via fluent-ffmpeg
  │       ├─ Extract: width, height, durationSec, rotation, codec, bitrate, frameRate
  │       ├─ Rotation from side_data_list (display matrix) or tags.rotate
  │       └─ Delete temp file in finally block (guaranteed cleanup)
  │
  ↓
  Database (Media table)
  │  width, height, durationSec, rotation, codec, bitrate, frameRate
  │
  ↓
  API Response (media.mapper.ts → toMediaResponse)
  │  All fields included in MediaResponse type
  │
  ↓
  Player Parser (playlist-utils.ts)
  │  normalizeItem() extracts width, height, durationSec, rotation from media object
  │
  ↓
  Rendering Strategy
  │  mediaRotation passed to computeRenderDecision()
  │  resolveRotation() separates containerRotation from mediaRotation
  │  Container rotation applied via CSS transform on outer div
  │  Media rotation available for future per-element rotation
```

## 9. Known Limitations

1. **Media rotation not applied to individual media elements** — The `RenderDecision` exposes `rotation` as the container rotation. Per-media rotation (from ffprobe) is resolved but not yet applied to individual `<img>`/`<video>` elements. This is a future enhancement, not a bug — most portrait videos include rotation in their metadata and players handle it natively.

2. **Canvas FIT_WIDTH/FIT_HEIGHT map to contain** — Canvas is a vector layout that should always be fully visible. FIT_WIDTH and FIT_HEIGHT are media-specific modes; for canvas, they fall back to contain. This is by design, not a limitation.

3. **maxScale capped at 4×** — Prevents pixelation when upscaling small canvases on large screens. Can be configured per-canvas in the future.

4. **150MB upload limit** — Buffer-based upload loads entire file in memory. Adequate for current use cases. Streaming uploads would be needed for very large videos.

5. **Rotation playlist payload uses first playlist's render config** — When multiple playlists are assigned to a rotation, the `renderMode`, `orientation`, `targetWidth`, and `targetHeight` from the first published playlist are used. Per-playlist render config in rotation is a future enhancement.

6. **No per-screen render config override** — Render config is playlist-level. Screen-level overrides would require schema changes.

## 10. Future Extensibility

The rendering strategy layer is designed to accommodate future content types:

- **Widgets** — Add `WIDGET` to the item kind union. The strategy can compute positioning based on widget type and viewport.
- **HTML** — Add `HTML` render mode or content type. The strategy can provide viewport dimensions for iframe sizing.
- **PDF** — Add `PDF` content type. The strategy can provide scale and viewport for PDF.js rendering.
- **Interactive content** — Add `INTERACTIVE` render mode. The strategy can disable object-fit and provide raw viewport dimensions.
- **AI layouts** — The strategy's pure function design allows AI-generated render decisions to be validated against the type contract before application.
- **Per-media rotation** — `RenderDecision` already carries rotation info; adding per-element CSS transform is a component-level change, not a strategy change.
- **New render modes** — Add to `RenderMode` type, handle in `resolveObjectFit()` and `resolveCanvasScaleMode()`. No component changes needed.
- **New orientations** — Add to `Orientation` type, handle in `resolveOrientation()`. No component changes needed.
