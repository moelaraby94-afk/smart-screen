# Display Configuration Architecture Audit

**Date:** 2026-07-22  
**Scope:** Screen → Playlist → Media → Player → Studio pipeline  
**Objective:** Identify architectural issues before they become entrenched  

---

## Executive Summary

The display configuration pipeline has **5 critical issues**, **4 high-severity issues**, and **6 medium issues** that should be resolved before adding new features. The most critical: rotation payload missing render settings, `as any` type erasure, dual `toResponse` implementations, and orientation mapping ambiguity (`square → AUTO`).

---

## 1. Critical Issues (Must Fix)

### C1. `buildRotationPayload` missing renderMode/orientation fields

**File:** `apps/backend/src/domains/playlists/playlist-resolution.service.ts:322-330`  
**Impact:** When a screen uses playlist rotation (multiple playlists), the player never receives `renderMode`, `orientation`, `targetWidth`, or `targetHeight`. The player falls back to `CONTAIN` default regardless of what each playlist configured.

```typescript
// Current — missing renderMode, orientation, targetWidth, targetHeight
return {
  workspaceId: screen.workspaceId,
  screenId,
  playlistId: published[0].playlist.id,
  name: published.map((a) => a.playlist.name).join(' → '),
  isPublished: true,
  activeSource: 'rotation' as const,
  items: mergedItems,
};
```

**Fix:** Include render fields from the first published playlist (or merge per-playlist if needed in future).

---

### C2. Empty playlist fallbacks missing render fields

**Files:**  
- `playlists.service.ts:643-655` (no playlist resolved)  
- `playlist-resolution.service.ts:273-282` (rotation with no published playlists)  
- `player.service.ts:105-111` (bootstrap with no playlist)

**Impact:** When no playlist is active, the player gets no `renderMode`/`orientation` info. This is acceptable for the empty state but means the player can't pre-configure its display until a playlist arrives.

**Fix:** At minimum, the bootstrap fallback in `player.service.ts` should include screen-level `orientation` in the empty playlist object (it's already in the bootstrap top-level, so this is low-priority but inconsistent).

---

### C3. `(playlist as any)` type erasure in `playlist-resolution.service.ts`

**File:** `playlist-resolution.service.ts:186-189, 362-365`  
**Impact:** The `Playlist` type from `@prisma/client` already includes `orientation`, `renderMode`, `targetWidth`, `targetHeight` after migration + `prisma generate`. The `as any` casts bypass type safety and hide potential issues if fields are renamed.

```typescript
// Current — unnecessary type erasure
orientation: (playlist as any).orientation ?? 'AUTO',
renderMode: (playlist as any).renderMode ?? 'CONTAIN',
targetWidth: (playlist as any).targetWidth ?? null,
targetHeight: (playlist as any).targetHeight ?? null,
```

**Fix:** Remove `as any` casts. Access fields directly: `playlist.orientation`, `playlist.renderMode`, etc.

---

### C4. `media-folders.service.ts` has separate `toResponse` without width/height

**File:** `apps/backend/src/domains/media/media-folders.service.ts:142-171`  
**Impact:** When media is moved between folders, the response doesn't include `width` or `height`. The dashboard receives incomplete media data after folder moves.

**Fix:** Either delegate to `MediaService.toResponse` or add `width`/`height` to the `media-folders.service.ts` `toResponse` method. Better: eliminate the duplicate and delegate.

---

### C5. Orientation mapping: `square → AUTO` is lossy and ambiguous

**File:** `apps/dashboard/src/features/playlists/playlist-studio-client.tsx:73, 120`  
**Impact:** The dashboard uses `landscape | portrait | square` for playlist orientation, but the backend enum is `AUTO | LANDSCAPE | PORTRAIT`. The mapping `square → AUTO` is incorrect — `AUTO` means "follow the screen", not "square". When a user selects "square" orientation, it's persisted as `AUTO` on the server, which the player interprets as "follow screen aspect ratio" — completely different semantics.

```typescript
// Dashboard → Server mapping (lossy)
const ortMap = { landscape: 'LANDSCAPE', portrait: 'PORTRAIT', square: 'AUTO' };

// Server → Dashboard mapping (ambiguous)
const ortMap = { LANDSCAPE: 'landscape', PORTRAIT: 'portrait', AUTO: 'landscape' };
```

**Fix:** Either:
- Remove `square` from the dashboard UI (it's not a real screen orientation), or
- Add `SQUARE` to the `ScreenOrientation` enum in the backend, or
- Map `square` to a separate field and keep `AUTO` for "follow screen".

---

## 2. High-Severity Issues (Should Fix)

### H1. Canvas scaling ignores render mode

**File:** `apps/player/src/components/canvas-konva-view.tsx:184-187`  
**Impact:** Canvas items always use `contain` scaling (`Math.min`). The playlist's `renderMode` is only applied to media items (images/videos), not to canvas layouts. A playlist set to `COVER` will cover-fill images but contain-fit canvases — inconsistent rendering.

```typescript
// Canvas always uses contain, regardless of renderMode
const scale = Math.min(size.w / designWidth, size.h / designHeight, 4);
```

**Fix:** Either apply `renderMode` to canvas scaling too, or document that `renderMode` only applies to raw media items (not canvases, which have their own design dimensions).

---

### H2. `targetWidth`/`targetHeight` are stored but never used by the player

**Files:**  
- `schema.prisma:884-887` — stored on Playlist  
- `playlist-resolution.service.ts:364-365` — sent in payload  
- `player-playlist.ts:43-44` — parsed in player types  
- `playlist-utils.ts:91-92` — parsed into PlaylistPayload  

**Impact:** The player receives `targetWidth`/`targetHeight` but never uses them for rendering. They're not passed to `CanvasKonvaView` as `designWidth`/`designHeight`, and they don't influence media scaling. These fields are dead weight in the current pipeline.

**Fix:** Either:
- Use `targetWidth`/`targetHeight` as the canvas design dimensions when rendering canvas items, or
- Use them as the reference resolution for media scaling calculations, or
- Remove them if they serve no current purpose (YAGNI).

---

### H3. Player orientation rotation is CSS-only, doesn't swap resolution dimensions

**File:** `apps/player/src/components/player-runtime.tsx:732-744`  
**Impact:** When `orientation === 'PORTRAIT'`, the player rotates the container 90° via CSS transform. But `resolutionWidth` and `resolutionHeight` are sent as-is from the screen model (e.g., 1920×1080). The player doesn't swap them to match the rotated viewport (which would be 1080×1920). This means any resolution-aware logic would use wrong dimensions.

```typescript
// Rotation is CSS-only, no dimension swap
const orientationStyle = orientation === 'PORTRAIT'
  ? { transform: 'rotate(90deg)', width: '100vh', height: '100vw', ... }
  : {};
```

**Fix:** When orientation is `PORTRAIT`, swap `resolutionWidth` ↔ `resolutionHeight` in the player's internal state, or compute effective dimensions after rotation.

---

### H4. Video dimensions not detected on upload

**File:** `apps/backend/src/domains/media/media.service.ts:156-171`  
**Impact:** Only image dimensions are detected (via `sharp`). Video files (MP4, WebM) get `width: null, height: null`. The dashboard orientation mismatch warning won't work for videos.

**Fix:** Add video dimension detection. Options:
- Use `ffprobe` (requires binary on server)
- Use `@ffprobe-installer/ffprobe` npm package
- Use browser-side detection (read video metadata on client before upload)
- Use `get-video-dimensions` npm package

---

## 3. Medium Issues (Should Address)

### M1. Dual localStorage + server state for playlist meta — no reconciliation strategy

**Files:**  
- `use-playlist-meta.ts` — saves to `localStorage`  
- `playlist-studio-client.tsx:68-80` — saves to server API  
- `playlist-studio-client.tsx:118-130` — loads from server, overrides localStorage  

**Impact:** Playlist meta (orientation, renderMode, layoutType, transitions) is stored in both `localStorage` and the database. There's no conflict resolution strategy. If a user changes orientation on Device A, Device B still has the old localStorage value until `loadPlaylistDetail` completes. The server sync is fire-and-forget with no error handling.

**Fix:** Make server the source of truth. Use localStorage only as a cache/fallback. Show loading state until server meta arrives. Handle API errors gracefully.

---

### M2. `renderMode` not applied to canvas items in playlist engine

**File:** `apps/player/src/components/playlist-engine.tsx`  
**Impact:** The `mediaObjectFit` prop is only passed to `MediaSlide`. Canvas slides (`CanvasKonvaView`) don't receive it. This is by design (canvases have their own coordinate system), but it means `renderMode: COVER` doesn't actually "cover" the screen when a canvas is playing — it shows letterbox bars.

**Fix:** Document this as expected behavior, or pass `renderMode` to `CanvasKonvaView` and let it choose between contain/cover scaling.

---

### M3. `CENTER` render mode CSS is identical to `CONTAIN`

**File:** `apps/player/src/components/playlist-engine.tsx:88-103`  
**Impact:** `CENTER` and `CONTAIN` both use `max-h-full max-w-full` + `object-contain` + `flex items-center justify-center`. The only difference is semantic — `CONTAIN` scales to fit while `CENTER` should show at original pixel size. Currently they're identical.

**Fix:** For true `CENTER` mode, don't use `object-contain`. Use the media's natural size without scaling: `h-auto w-auto` with no `max-h`/`max-w` constraints. Or use `object-none` which shows at natural size.

---

### M4. `FIT_WIDTH` and `FIT_HEIGHT` CSS may not work as expected

**File:** `apps/player/src/components/playlist-engine.tsx:88-103`  
**Impact:** `FIT_WIDTH` uses `w-full h-auto` + `object-contain`. But `object-contain` on an element with `w-full` will try to fit within the width, potentially not actually filling it if the aspect ratio doesn't match. The combination of `w-full` and `object-contain` is contradictory — `w-full` sets the element width, but `object-contain` scales the content within the element.

**Fix:** For `FIT_WIDTH`, use `w-full h-auto` WITHOUT `object-contain` (let the element size itself). For `FIT_HEIGHT`, use `h-full w-auto` without `object-contain`.

---

### M5. No validation that playlist orientation matches assigned screen orientation

**Impact:** A portrait playlist can be assigned to a landscape screen with no warning. The player will render portrait content on a landscape display (or vice versa). There's no server-side or client-side validation.

**Fix:** Add a warning in the dashboard when assigning a playlist with mismatched orientation to a screen. Don't block the assignment, but show a warning.

---

### M6. Heartbeat updates `resolutionWidth`/`resolutionHeight` but not `orientation`

**File:** `apps/backend/src/domains/realtime/realtime.gateway.ts:418-421`  
**Impact:** The player reports `resolutionWidth` and `resolutionHeight` via heartbeat, which updates the Screen model. But `orientation` is never reported by the player — it's only set manually via the dashboard. If a player is on a portrait display, the screen's `orientation` stays `AUTO` unless manually changed.

**Fix:** Have the player report its detected orientation in the heartbeat, or compute it from `resolutionWidth`/`resolutionHeight` ratio on the server.

---

## 4. Architecture Observations (No Action Needed Now)

### A1. Two enums with overlapping semantics
- `ScreenOrientation`: `AUTO | LANDSCAPE | PORTRAIT` — used on both Screen and Playlist
- Dashboard uses: `landscape | portrait | square` — a different vocabulary

The mapping between these two vocabularies is lossy (see C5). Consider unifying.

### A2. Canvas has its own `width`/`height` but Playlist has `targetWidth`/`targetHeight`
Canvas dimensions are the design surface (1920×1080). Playlist `targetWidth`/`targetHeight` are supposed to be the target rendering resolution. These are conceptually different but could be confused. Currently `targetWidth`/`targetHeight` are unused (see H2).

### A3. `PlaylistItem.zoneName` exists but zones are defined client-side only
Zone presets are generated in the dashboard (`makeZonePresets`) and stored in `localStorage`. The server only stores `zoneName` as a string. There's no server-side zone model. This means zone layouts can't be shared or persisted reliably.

### A4. Render mode is playlist-level, not per-item
The `renderMode` applies to all media items in a playlist. There's no per-item override. This is a deliberate design choice (simplicity) but limits flexibility for mixed-orientation content.

---

## 5. Recommendations (Priority Order)

1. **Fix C1** — Add render fields to `buildRotationPayload` (5 min fix, high impact)
2. **Fix C3** — Remove `as any` casts (5 min fix, type safety)
3. **Fix C4** — Unify `toResponse` or add width/height to `media-folders.service.ts` (10 min)
4. **Fix C5** — Decide on `square` orientation: remove it or add `SQUARE` enum (15 min)
5. **Fix H4** — Add video dimension detection (30-60 min depending on approach)
6. **Fix H3** — Swap resolution dimensions when portrait (15 min)
7. **Fix M3** — Fix `CENTER` render mode CSS to show actual original size (10 min)
8. **Fix M4** — Fix `FIT_WIDTH`/`FIT_HEIGHT` CSS (10 min)
9. **Address H2** — Either use `targetWidth`/`targetHeight` or remove them (decision needed)
10. **Address M1** — Improve localStorage/server reconciliation strategy (30 min)

---

## 6. Pipeline Diagram (Current State)

```
┌─────────┐     ┌──────────┐     ┌───────┐     ┌──────────┐     ┌─────────┐
│  Screen  │────▶│ Playlist │────▶│ Media │────▶│  Player  │────▶│ Display │
│          │     │          │     │       │     │          │     │         │
│ orientn  │     │ orientn  │     │ width │     │ rotate   │     │ rendered│
│ resW/H   │     │ renderMd │     │ height│     │ fit mode │     │ output  │
│          │    │ targetW/H│     │       │     │ canvas   │     │         │
└─────────┘     └──────────┘     └───────┘     └──────────┘     └─────────┘
     │              │                │              │
     │    ┌─────────┘                │              │
     │    │                          │              │
     ▼    ▼                          ▼              ▼
  Bootstrap ──────────────────▶ Payload ──────▶ Rendering
  (HTTP)                    (Socket.IO)       (CSS/Konva)
  
  Missing in rotation: renderMode, orientation, targetW/H
  Missing in video upload: width/height detection
  Missing in canvas: renderMode application
  Unused by player: targetWidth, targetHeight
  Lossy mapping: square ↔ AUTO
```

---

**Audit completed by:** Cascade  
**Files reviewed:** 18  
**Issues found:** 5 critical, 4 high, 6 medium, 4 observations  
**Estimated fix time:** ~3-4 hours for all critical + high issues
