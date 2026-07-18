# 07 — Business Logic Audit

> **Objective:** Evaluate the core business logic: screen management, playlist playback, scheduling, campaigns, pairing workflow, and subscription enforcement.

---

## 1. Current State

Business logic is distributed across domain services. The core flows are: screen pairing → content creation (media/canvas) → playlist assembly → scheduling → campaign management → player bootstrap → realtime playback.

---

## 2. What Exists

### Screen Pairing Workflow (Pairing v2)
1. Player initiates: `POST /player/pairing/sessions` with optional `x-player-secret`
2. Server creates `ScreenPairingSession` with: 6-digit `pairingCode`, `pollSecret`, `pairingSecret` (per-screen), 15-min TTL
3. Player polls: `GET /player/pairing/sessions/:sessionId` with `x-pairing-poll-secret`
4. Dashboard claims: `POST /workspaces/:id/pairing-sessions/claim` with `pairingCode` (throttled 5/min, lockout after 5 failures/10 min)
5. On claim: creates `Screen` with `pairingSecretHash` (bcrypt), emits `pairing:complete` to player via Socket.IO
6. Player receives credentials and can now bootstrap

**Lockout mechanism:** `PairingClaimLockout` tracks failed attempts per user+IP. 5 failures in 10 min → 30 min lockout.

### Content Creation
- **Media upload:** `POST /media/upload` — File stored to `uploads/media/:workspaceId/`, metadata in DB
  - Max 150MB, allowed types: JPEG, PNG, GIF, WebP, MP4, WebM, QuickTime
  - MIME type sniffed from file extension (not from file content — security risk)
  - Storage quota check: sums existing media `sizeBytes` against `Subscription.storageLimitBytes`
  - Auto-expiry: `PATCH /media/:id/expiry` sets `expiresAt` date
- **Canvas creation:** `POST /canvases` — Creates design with `layoutData` (JSON Konva scene graph)
  - Version history: snapshot on each update, list versions, restore version
  - Types: WIDGET, IMAGE, VIDEO, URL, HTML

### Playlist Management
- **CRUD:** Create, read, update, delete playlists
- **Items:** `PATCH /playlists/:id/items` — Replace all items (media, canvas, or nested playlist)
  - `orderIndex` for ordering, `durationSec` for playback duration, `zoneName` for multi-zone layouts
  - Exactly-one-of constraint (mediaId, canvasId, nestedPlaylistId) enforced in code, not DB
- **Groups:** Hierarchical playlist groups with parent/child relationships
- **Clone:** `POST /playlists/:id/clone-to-workspace` — Deep copy to another workspace
- **Duplicate:** `POST /playlists/:id/duplicate` — Copy within same workspace
- **Nested playlists:** A playlist can contain another playlist as an item
- **Delete protection:** `force=true` query param to delete playlists referenced by schedules

### Scheduling
- **Schedule model:** `daysOfWeek` (0-6), `daysOfMonth` (1-31), `recurrence` (WEEKLY/MONTHLY), `startTime`/`endTime` (HH:mm), `startDate`/`endDate`, `priority`, `enabled`
- **Overlap detection:** `GET /schedules/overlaps` returns overlapping schedules for a workspace
- **Screen override rules:** `ScreenOverrideRule` with recurrence (ONCE/DAILY/WEEKLY/MONTHLY), date/time windows
- **Screen playlist assignments:** Multiple playlists per screen with `orderIndex` for rotation
- **Active content resolution:** `ScreensService.getActiveContent()` resolves which playlist should play now based on schedules, overrides, and assignments

### Campaign Management
- **Approval workflow:** DRAFT → PENDING_APPROVAL → APPROVED/REJECTED → PUBLISHED → PAUSED → RESUMED → ENDED
- **History:** `CampaignHistory` records every state transition with actor, action, from/to status, comment
- **Targeting:** Optional playlist + optional screen (null = all screens)
- **Transitions:** submit, approve, reject, publish, pause, resume, end — each with role checks

### Subscription Enforcement
- **Screen limit:** `ScreensService.assertWithinScreenLimit()` checks `Subscription.screenLimit` before creating a screen
- **Storage limit:** `MediaService` checks `Subscription.storageLimitBytes` before accepting uploads
- **Plan defaults:** FREE (5 seats, 25 screens), STARTER (15 seats, 100 screens), PRO (25 seats, 500 screens), ENTERPRISE (100 seats, 2000 screens)
- **Mock plan:** `PATCH /subscriptions/mock-plan` for development (guarded by `assertMockBillingAllowed`)

### Player Bootstrap
- `GET /player/bootstrap?serialNumber=...` — Returns: screen info, active playlist with items, ticker, workspace paused status
- `GET /player/workspace-bootstrap` — JWT-authenticated, for player app synced with dashboard login
- `GET /player/canvas/:canvasId` — Compiled canvas for player rendering
- Prayer pause: `GET /player/prayer-pause-status` — Returns whether content should pause for prayer

### Realtime Playback
- Screen registers via Socket.IO `screen:register` with serialNumber + secret
- Heartbeat: `screen:heartbeat` every ~30s, stale after 45s (configurable)
- Status broadcast: `screen:status` emitted to `workspace:{id}` room
- Content sync: `content:sync` emitted to `screen:{id}` room
- Remote commands: `remote:command` emitted to `screen:{id}` room
- Player ticker: `player:ticker` emitted to `screen:{id}` room

---

## 3. What Is Missing

1. **No proof-of-play tracking** — No record of what content played on which screen and when. Critical for advertising campaigns.

2. **No content approval for playlists** — Only campaigns have approval workflow. Playlists can be published by any EDITOR without review.

3. **No timezone-aware scheduling** — `startTime`/`endTime` are "in workspace TZ" per schema comment, but there's no `timezone` field on Workspace. All times are interpreted as server local time.

4. **No schedule conflict resolution** — Overlaps are detected but not resolved. No priority-based automatic conflict resolution.

5. **No content caching strategy for offline playback** — `isOfflineCacheMode` flag exists on Screen but no logic pre-downloads content for offline use.

6. **No playlist preview API** — No endpoint to preview a playlist's playback sequence without assigning it to a screen.

7. **No campaign scheduling** — Campaigns have `startDate`/`endDate` but no time-of-day scheduling. Campaigns are "always on" during their date range.

8. **No multi-zone layout resolution** — `PlaylistItem.zoneName` exists but no service resolves which items play in which zones for multi-zone screens.

9. **No content versioning for media** — Only canvases have version history. Media files have no version tracking.

10. **No automatic media expiry purge** — `Media.expiresAt` field exists but no cron job deletes expired media.

---

## 4. Problems

1. **MIME type from extension, not content** — `MediaService` trusts the file extension for MIME type. An attacker could upload a malicious file with a `.jpg` extension. Should use `file-type` library to sniff from content.

2. **Playlist item replacement is all-or-nothing** — `PATCH /playlists/:id/items` replaces ALL items. No append, insert, or delete individual items. This is inefficient for large playlists.

3. **Schedule time strings instead of DateTime** — `startTime` and `endTime` are `String` ("HH:mm") not `DateTime` or `Time`. No validation that the format is correct at the DB level.

4. **No transaction wrapping for multi-step operations** — Pairing claim creates a screen, updates pairing session, and emits Socket.IO event. These should be wrapped in a DB transaction.

5. **Campaign publish doesn't push to screens** — Publishing a campaign sets status to PUBLISHED but doesn't trigger a content sync to affected screens via Socket.IO.

6. **Workspace `isPaused` only checked in player bootstrap** — Paused workspaces can still create screens, upload media, and modify playlists.

---

## 5. Risks

- **High: No proof-of-play** — Advertising campaigns can't verify content was displayed.
- **High: MIME type spoofing** — Security risk from trusting file extensions.
- **Medium: No timezone handling** — Schedules will be wrong for users in different timezones.
- **Medium: No offline content pre-download** — Offline screens will have no content.
- **Medium: No campaign-to-screen push** — Published campaigns don't reach screens immediately.

---

## 6. Priority: **High**

Core business logic is functional but has gaps in proof-of-play, timezone handling, and content delivery.

---

## 7. Completion Percentage: **75%**

Core flows (pairing, content, playlists, scheduling, campaigns) are implemented. Missing: proof-of-play, timezone handling, offline caching, multi-zone, media versioning, automatic expiry.

---

## 8. Recommendations

1. Implement proof-of-play tracking: `ProofOfPlay` model with `screenId`, `playlistItemId`, `playedAt`, `durationSec`
2. Use `file-type` library to sniff MIME type from file content, not extension
3. Add `timezone` field to Workspace model and convert schedule times to UTC for storage
4. Add individual playlist item operations: `POST /playlists/:id/items` (append), `DELETE /playlists/:id/items/:itemId`
5. Wrap pairing claim in a Prisma transaction
6. Emit `content:sync` to screens when a campaign is published
7. Add `isPaused` check to all workspace mutation endpoints
8. Implement automatic media expiry purge in `MaintenanceService` cron job
9. Add content pre-download for offline mode: when `isOfflineCacheMode` is true, send manifest of required assets
10. Add multi-zone layout resolution in `PlayerService.getBootstrap()`

---

## 9. Future Tasks

- [ ] Implement proof-of-play tracking
- [ ] Fix MIME type detection from file content
- [ ] Add timezone support to scheduling
- [ ] Add individual playlist item operations
- [ ] Wrap pairing claim in transaction
- [ ] Push campaign publish to screens
- [ ] Enforce workspace pause on all mutations
- [ ] Add media expiry purge cron job
- [ ] Implement offline content pre-download
- [ ] Add multi-zone layout resolution
