# Display Configuration Fix Plan

**Created:** 2026-07-22  
**Based on:** Display Configuration Architecture Audit  
**Verification:** All 15 findings verified against actual codebase  

---

## Verified Issues Summary

| ID | Severity | Title | Confirmed | Evidence |
|----|----------|-------|-----------|----------|
| C1 | Critical | `buildRotationPayload` missing render fields | YES | `playlist-resolution.service.ts:322-330` — no renderMode/orientation/targetW/H |
| C2 | Critical | Empty playlist fallbacks missing render fields | YES | 3 locations: `playlists.service.ts:643-655`, `playlists.service.ts:677-689`, `player.service.ts:105-111` |
| C3 | Critical | `(playlist as any)` type erasure | YES | `playlist-resolution.service.ts:186-189, 362-365` + `playlists.service.ts:68-69, 160-161` |
| C4 | Critical | `media-folders.service.ts` toResponse missing width/height | YES | `media-folders.service.ts:142-171` — no width/height in input or output |
| C5 | Critical | `square → AUTO` orientation mapping is lossy | YES | `playlist-studio-client.tsx:73` maps square→AUTO; schema has no SQUARE enum |
| H1 | High | Canvas scaling ignores renderMode | YES | `canvas-konva-view.tsx:185` always uses Math.min (contain); no renderMode prop |
| H2 | High | `targetWidth`/`targetHeight` unused by player | YES | Parsed in `playlist-utils.ts:91-92` but never referenced in rendering |
| H3 | High | Portrait rotation without dimension swap | YES | `player-runtime.tsx:732-744` CSS rotation only; no resolution swap |
| H4 | High | Video dimensions not detected on upload | YES | `media.service.ts:158-171` only detects IMAGE_MIMES via sharp |
| M1 | Medium | Dual localStorage + server state, no reconciliation | YES | `use-playlist-meta.ts` saves localStorage; `playlist-studio-client.tsx:79` fire-and-forget API |
| M2 | Medium | `renderMode` not applied to canvas items | YES | `playlist-engine.tsx:397-404` — CanvasKonvaView receives no renderMode |
| M3 | Medium | `CENTER` CSS identical to `CONTAIN` | YES | `playlist-engine.tsx:88-103` — center and contain both use `max-h-full max-w-full` + `object-contain` |
| M4 | Medium | `FIT_WIDTH`/`FIT_HEIGHT` CSS contradictory | YES | `playlist-engine.tsx:90-91` — `w-full` + `object-contain` conflict |
| M5 | Medium | No orientation mismatch warning on screen assignment | YES | No matches for orientation mismatch in screens feature |
| M6 | Medium | Heartbeat doesn't report orientation | YES | `screen-heartbeat.dto.ts` has resolutionWidth/Height but no orientation |

---

## Additional Findings During Verification

### C3-Extended: Additional `as any` casts in `playlists.service.ts`

**File:** `apps/backend/src/domains/playlists/playlists.service.ts:68-69, 160-161`

```typescript
// Line 68-69 (create method)
...(orientation ? { orientation: orientation as any } : {}),
...(renderMode ? { renderMode: renderMode as any } : {}),

// Line 160-161 (update method)
orientation?: any;
renderMode?: any;
```

Also, the `create` method signature uses `string` types instead of Prisma enums:
```typescript
orientation?: string,  // should be ScreenOrientation
renderMode?: string,   // should be RenderMode
```

### Architecture Observation: Two orientation sources

The player receives TWO orientations:
1. **Screen orientation** (from bootstrap top-level) — used for CSS rotation
2. **Playlist orientation** (from playlist payload) — NOT used by the player

The playlist orientation is only used in the dashboard for UI purposes (recommended size, zone presets). The player only uses the screen's orientation for rendering. This is an architectural decision that should be documented.

---

## Affected Files

### Backend (12 files)
| File | Issues Addressed |
|------|-----------------|
| `apps/backend/prisma/schema.prisma` | C5 (add SQUARE enum) |
| `apps/backend/prisma/migrations/NEW/migration.sql` | C5 (migration for SQUARE) |
| `apps/backend/src/domains/playlists/playlist-resolution.service.ts` | C1, C3 |
| `apps/backend/src/domains/playlists/playlists.service.ts` | C2, C3-extended |
| `apps/backend/src/domains/player/player.service.ts` | C2 |
| `apps/backend/src/domains/media/media.service.ts` | H4 |
| `apps/backend/src/domains/media/media-folders.service.ts` | C4 |
| `apps/backend/src/domains/media/media.mapper.ts` (NEW) | C4 |
| `apps/backend/src/domains/media/media.module.ts` | C4 |
| `apps/backend/src/domains/realtime/dto/screen-heartbeat.dto.ts` | M6 |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | M6 |
| `apps/backend/package.json` | H4 (add video metadata package) |

### Player (4 files)
| File | Issues Addressed |
|------|-----------------|
| `apps/player/src/components/playlist-engine.tsx` | M2, M3, M4 |
| `apps/player/src/components/canvas-konva-view.tsx` | H1, H2 |
| `apps/player/src/components/player-runtime.tsx` | H3, H2 |
| `apps/player/src/types/player-playlist.ts` | C5 (add SQUARE) |

### Dashboard (6 files)
| File | Issues Addressed |
|------|-----------------|
| `apps/dashboard/src/features/playlists/playlist-transitions.ts` | C5 (remove square or map correctly) |
| `apps/dashboard/src/features/playlists/playlist-studio-client.tsx` | C5, M1 |
| `apps/dashboard/src/features/playlists/studio/components/inspector-panel.tsx` | C5 |
| `apps/dashboard/src/features/screens/screen-detail-client.tsx` | M5 |
| `apps/dashboard/src/features/screens/api/screens-api.ts` | M5 (if needed) |
| `apps/dashboard/src/i18n/messages/en.json` + `ar.json` | M5 |

---

## Dependency Order

```
Phase 1 (Backend Foundation)
  ├── C5: Add SQUARE to ScreenOrientation enum + migration
  ├── C3: Remove all `as any` casts (depends on C5 for complete enum)
  ├── C4: Create shared media mapper (no dependency)
  ├── C2: Fix fallback responses (no dependency)
  └── C1: Fix rotation payload (no dependency)

Phase 2 (Media Dimensions)
  └── H4: Add video dimension extraction (depends on Phase 1 for mapper)

Phase 3 (Player Render Engine)
  ├── H3: Fix portrait dimension swap (no backend dependency)
  ├── M3: Fix CENTER render mode CSS (no dependency)
  ├── M4: Fix FIT_WIDTH/FIT_HEIGHT CSS (no dependency)
  ├── H1: Canvas respects renderMode (depends on M3, M4 for correct CSS)
  ├── H2: Use targetWidth/targetHeight or remove (decision needed)
  └── M2: Pass renderMode to CanvasKonvaView (depends on H1)

Phase 4 (Dashboard Validation)
  ├── C5: Fix orientation mapping (depends on Phase 1 for SQUARE enum)
  ├── M1: Improve localStorage/server reconciliation (no backend dependency)
  ├── M5: Add orientation mismatch warning (depends on C5 for correct mapping)
  └── M6: Report orientation in heartbeat (depends on Phase 1 for heartbeat DTO)

Phase 5 (Final Hardening)
  └── Full verification
```

---

## Implementation Phases

### Phase 1 — Data Contract and Backend Foundation

**Goal:** Ensure backend sends complete and consistent display configuration.

**Tasks:**

1. **C5: Add SQUARE to ScreenOrientation enum**
   - Add `SQUARE` to `ScreenOrientation` enum in `schema.prisma`
   - Create migration SQL
   - Run `npx prisma generate`
   - Update player types to accept `SQUARE`
   - Update dashboard mapping to use `SQUARE` instead of `AUTO` for square

2. **C3: Remove all `as any` casts**
   - `playlist-resolution.service.ts:186-189` — remove `as any`, access directly
   - `playlist-resolution.service.ts:362-365` — remove `as any`, access directly
   - `playlists.service.ts:68-69` — change `orientation as any` to proper type
   - `playlists.service.ts:160-161` — change `any` to `ScreenOrientation` / `RenderMode`
   - `playlists.service.ts:57-58` — change `string` to `ScreenOrientation` / `RenderMode` in method signature

3. **C4: Create shared media response mapper**
   - Create `apps/backend/src/domains/media/media.mapper.ts`
   - Export a pure function `toMediaResponse(media, storage)` that includes width/height
   - Update `MediaService.toResponse` to delegate to mapper
   - Update `MediaFoldersService.toResponse` to delegate to mapper
   - No circular dependency (mapper is a pure function, not a service)

4. **C2: Fix fallback player configuration responses**
   - `playlists.service.ts:643-655` — add `renderMode: 'CONTAIN'`, `orientation: 'AUTO'`, `targetWidth: null`, `targetHeight: null`
   - `playlists.service.ts:677-689` — same
   - `player.service.ts:105-111` — add `renderMode: 'CONTAIN'`, `orientation: screen.orientation`, `targetWidth: null`, `targetHeight: null`
   - `playlist-resolution.service.ts:273-282` (rotation empty) — same

5. **C1: Fix playlist rotation payload**
   - `playlist-resolution.service.ts:322-330` — add `renderMode`, `orientation`, `targetWidth`, `targetHeight` from first published playlist

**Verification:**
- `npx tsc --noEmit --project apps/backend/tsconfig.json`
- `npx jest --config apps/backend/jest.config.mjs` (run existing tests)
- `npx prisma validate`

**Risks:**
- Adding `SQUARE` to enum requires migration — existing data unaffected (default is AUTO)
- Changing `string` to enum types in method signatures may require caller updates

---

### Phase 2 — Media Dimension Pipeline

**Goal:** Make media dimensions reliable for all media types.

**Tasks:**

1. **Verify image metadata extraction** (already working via sharp)

2. **H4: Add video dimension extraction during upload**
   - Add `@ffprobe-installer/ffprobe` + `fluent-ffmpeg` to `package.json`
   - In `media.service.ts:saveUploadedFile`, add video dimension detection block:
     - Check if `detected.mime` starts with `video/`
     - Use ffprobe to extract width/height
     - Store in `detectedWidth`/`detectedHeight`
   - Handle failure gracefully (null dimensions, log warning)

3. **Ensure player APIs receive dimensions**
   - Verify `serializeItem` in `playlist-resolution.service.ts` uses `MediaService.toResponse` (already does)
   - Verify `media-folders.service.ts` now delegates to shared mapper (from Phase 1)

**Verification:**
- Upload landscape image, portrait image, landscape video, portrait video
- Verify stored metadata in database
- Verify API response includes width/height

**Risks:**
- `@ffprobe-installer/ffprobe` adds ~30MB to node_modules (bundles ffprobe binary)
- Docker image size will increase
- Alternative: use `get-video-dimensions` package (lighter wrapper)

---

### Phase 3 — Player Render Engine

**Goal:** Make player correctly respect all display configuration.

**Tasks:**

1. **M3: Fix CENTER render mode CSS**
   - Change `center` fitClass from `object-contain` to `object-none` (natural size, no scaling)
   - Change `center` mediaBoxClass from `max-h-full max-w-full` to `h-auto w-auto` (no constraints)
   - Keep flex centering for positioning

2. **M4: Fix FIT_WIDTH/FIT_HEIGHT CSS**
   - `FIT_WIDTH`: Remove `object-contain` from fitClass, keep `w-full h-auto` for box
   - `FIT_HEIGHT`: Remove `object-contain` from fitClass, keep `h-full w-auto` for box
   - Use `object-fill` for fitClass when element size is constrained by box class

3. **H3: Fix portrait orientation dimension swap**
   - In `player-runtime.tsx`, when `orientation === 'PORTRAIT'`:
     - Store effective `resolutionWidth` = `resolutionHeight` from bootstrap (swapped)
     - Store effective `resolutionHeight` = `resolutionWidth` from bootstrap (swapped)
   - Pass effective dimensions to PlaylistEngine and CanvasKonvaView

4. **H1 + M2: Canvas respects renderMode**
   - Add `renderMode` prop to `CanvasKonvaView`
   - Implement scaling logic:
     - `CONTAIN`: `Math.min` (current behavior)
     - `COVER`: `Math.max` + clip overflow
     - `CENTER`: scale=1, center
     - `FIT_WIDTH`: scale to fill width
     - `FIT_HEIGHT`: scale to fill height
   - Pass `renderMode` from `PlaylistEngine` to `CanvasKonvaView`

5. **H2: Implement targetWidth/targetHeight usage**
   - Use `playlist.targetWidth`/`targetHeight` as canvas design dimensions when available
   - Fall back to canvas's own `width`/`height` when not set
   - Use as reference resolution for media scaling calculations

**Verification:**
- Test portrait screen with portrait media
- Test landscape screen with landscape media
- Test all 5 render modes with both media and canvas items
- Test mixed media (portrait image on landscape screen with each render mode)

**Risks:**
- Canvas COVER mode requires clipping — Konva Stage may need clip properties
- Changing CSS for render modes may affect existing playlists

---

### Phase 4 — Dashboard Validation

**Goal:** Prevent invalid configurations and improve state management.

**Tasks:**

1. **C5: Fix orientation mapping**
   - Update `playlist-studio-client.tsx:73` to map `square → SQUARE` (after Phase 1 adds SQUARE enum)
   - Update `playlist-studio-client.tsx:120` to map `SQUARE → square`
   - Update `playlist-transitions.ts` — `PlaylistOrientation` type already has `square`

2. **M1: Improve localStorage/server reconciliation**
   - Make server the source of truth
   - Add error handling to `apiUpdatePlaylistMeta` call (`.catch()` with toast)
   - Show loading state until server meta arrives
   - Keep localStorage as cache/fallback only

3. **M5: Add orientation mismatch warning on screen assignment**
   - In screen detail or assignment UI, compare screen orientation with playlist orientation
   - Show warning badge/icon when mismatched
   - Add i18n keys for warning message (EN + AR)

4. **M6: Report orientation in heartbeat**
   - Add `orientation` field to `ScreenHeartbeatDto`
   - In `realtime.gateway.ts`, update screen orientation from heartbeat
   - In player, compute orientation from `window.screen.width/height` ratio and send in heartbeat

**Verification:**
- Test: create screen, assign playlist, change orientation, preview, save
- Test: assign portrait playlist to landscape screen → warning appears
- Test: player on portrait device → screen orientation auto-updates

**Risks:**
- Auto-updating orientation from heartbeat may override manual settings — need to decide priority

---

### Phase 5 — Final Hardening

**Tasks:**
1. Run full test suite (backend + dashboard)
2. Run TypeScript checks (all 3 apps)
3. Run ESLint (all 3 apps)
4. Run production build (dashboard + player)
5. Create `DISPLAY_CONFIGURATION_FIX_REPORT.md`

**Verification Commands:**
```bash
npx tsc --noEmit --project apps/backend/tsconfig.json
npx tsc --noEmit --project apps/dashboard/tsconfig.json
npx tsc --noEmit --project apps/player/tsconfig.json
cd apps/dashboard && npx eslint src/ --max-warnings=999
cd apps/player && npx eslint src/ --max-warnings=999
cd apps/dashboard && npx next build
cd apps/player && npx next build
cd apps/backend && npx jest
```

---

## Decision Points (Need User Input)

### DP1: `targetWidth`/`targetHeight` purpose (H2)
- **Option A:** Use as canvas design dimensions (override canvas's own width/height)
- **Option B:** Use as reference resolution for media scaling (affects how render modes calculate)
- **Option C:** Remove entirely (YAGNI — canvas already has width/height, media uses natural dimensions)
- **Recommendation:** Option A — most useful, least complex

### DP2: Heartbeat orientation auto-update priority (M6)
- **Option A:** Heartbeat orientation always overrides manual setting
- **Option B:** Manual setting takes priority, heartbeat only updates if orientation is AUTO
- **Recommendation:** Option B — respects manual configuration

### DP3: Video dimension extraction approach (H4)
- **Option A:** `@ffprobe-installer/ffprobe` + `fluent-ffmpeg` (reliable, +30MB)
- **Option B:** `get-video-dimensions` package (wrapper, lighter)
- **Option C:** Browser-side detection (no server dependency, but unreliable for all formats)
- **Recommendation:** Option A — most reliable for server-side processing

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| SQUARE enum migration fails on existing data | Low | Medium | Default is AUTO, no data conversion needed |
| Canvas COVER mode clipping breaks layout | Medium | High | Test with multiple canvas layouts before deploy |
| CSS changes for render modes affect existing playlists | Medium | Medium | Test all modes with existing content before deploy |
| ffprobe binary fails in Docker container | Low | High | Test in Docker build, provide fallback to null dimensions |
| localStorage/server reconciliation causes flicker | Low | Low | Use loading state, apply server meta atomically |

---

## Estimated Effort

| Phase | Time | Issues Fixed |
|-------|------|-------------|
| Phase 1 | 1.5 hours | C1, C2, C3, C4, C5 |
| Phase 2 | 1 hour | H4 |
| Phase 3 | 2 hours | H1, H2, H3, M2, M3, M4 |
| Phase 4 | 1.5 hours | M1, M5, M6, C5-dashboard |
| Phase 5 | 0.5 hour | Verification + report |
| **Total** | **~6.5 hours** | **15 issues** |

---

## Architectural Limitations (Documented, Not Fixed)

### Rotation Payload: Merged Display Configuration

**Current Behavior:** The rotation payload (`buildRotationPayload` in `playlist-resolution.service.ts`) merges all assigned playlists into a single logical playlist with flattened items. Display configuration fields (`renderMode`, `orientation`, `targetWidth`, `targetHeight`) are taken from the **first published playlist** and applied globally to the merged payload. Individual playlists in the rotation do not preserve their own display configuration in the payload.

**Rationale:** This is the existing architectural design — rotation produces a single merged playlist payload, not a sequence of per-playlist segments. Changing this would require a payload structure redesign, which is out of scope for this fix plan.

**Impact:** If playlists in a rotation have different orientations or render modes, only the first playlist's configuration is respected. Subsequent playlists with different settings will render using the first playlist's configuration.

### Future Enhancement: Per-Playlist Rotation Payload (V2)

**Proposed V2 Payload Structure:**
```json
{
  "activeSource": "rotation",
  "segments": [
    {
      "playlistId": "pl-1",
      "renderMode": "COVER",
      "orientation": "PORTRAIT",
      "targetWidth": 1080,
      "targetHeight": 1920,
      "items": [...]
    },
    {
      "playlistId": "pl-2",
      "renderMode": "CONTAIN",
      "orientation": "LANDSCAPE",
      "targetWidth": 1920,
      "targetHeight": 1080,
      "items": [...]
    }
  ]
}
```

**Benefits:**
- Each playlist preserves its own display configuration
- Player can apply per-segment rendering settings
- Supports mixed-orientation rotations (e.g., landscape + portrait in same rotation)

**Implementation Notes:**
- Requires player-side changes to handle segment-based playback
- Requires dashboard UI changes to show per-playlist config in rotation
- Backward compatibility: player should fall back to merged behavior if `segments` is absent
- Estimated effort: 3-4 hours (separate from this fix plan)
