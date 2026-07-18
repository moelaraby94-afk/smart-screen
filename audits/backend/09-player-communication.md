# 09 — Player Communication Audit

> **Objective:** Evaluate the player communication protocol: bootstrap, content delivery, pairing, offline mode, prayer pause, and remote commands.

---

## 1. Current State

Player communication is handled by `domains/player/player.controller.ts` and `player.service.ts`, with pairing logic in `domains/pairing/pairing.service.ts` and realtime events in `domains/realtime/`. The player authenticates via per-screen secrets (bcrypt-hashed) or a legacy shared secret.

---

## 2. What Exists

### Authentication
- **Per-screen secret:** Each screen has a `pairingSecretHash` (bcrypt). The player sends the secret via `x-player-secret` header.
- **Shared secret fallback:** Screens paired before per-screen secrets use `PLAYER_HEARTBEAT_SECRET` env var. Warning logged on each fallback use.
- **No JWT for player:** Players authenticate with screen secrets, not user JWTs. This is correct for kiosk/headless devices.

### Bootstrap Flow
1. `GET /player/bootstrap?serialNumber=...` with `x-player-secret` header
2. Validates screen exists + secret matches
3. Checks `workspace.isPaused` → throws `WORKSPACE_PAUSED` if paused
4. Returns:
   - Screen info (id, serialNumber, orientation, ticker)
   - Active playlist with all items (media URLs, canvas layout data, durations, zones)
   - Workspace name
5. Player caches content locally for offline playback

### Workspace Bootstrap (JWT-authenticated)
- `GET /player/workspace-bootstrap` — For player apps that share login with dashboard
- Uses JWT auth, resolves workspace from user's membership
- Returns same shape as regular bootstrap

### Compiled Canvas
- `GET /player/canvas/:canvasId` — Returns compiled canvas for player rendering
- Includes `layoutData` (Konva scene graph JSON) and metadata

### Prayer Pause
- `GET /player/prayer-pause-status?workspaceId=...` — Returns whether content should pause
- Checks current prayer time against configured prayer times + buffers
- Returns `{ shouldPause, prayerName, resumeAt }`

### Pairing Sessions (Player-side)
- `POST /player/pairing/sessions` — Player initiates pairing (throttled 30/min)
  - Body: `{ serialNumber, playerPlatform? }`
  - Returns: `{ sessionId, pairingCode, pollSecret, expiresAt }`
- `GET /player/pairing/sessions/:sessionId` — Player polls for completion
  - Header: `x-pairing-poll-secret`
  - Returns: `{ status, screenId?, workspaceId?, pairingSecret? }` (credentials on claim)

### Remote Commands
- `POST /screens/:id/remote-command` — Dashboard sends command to screen
  - Body: `{ command: 'reload' | 'reboot' | 'screenshot' | 'volume' | 'mute' | 'unmute' | 'clear-cache', value? }`
  - Emits `remote:command` via Socket.IO to `screen:{id}` room
  - No acknowledgment from player that command was executed

### Content Sync (Realtime)
- `content:sync` event pushed to `screen:{id}` room when:
  - Playlist assignment changes
  - Schedule changes
  - Override is set/removed
- `canvas:live` event pushed when canvas is updated in studio
- `player:ticker` event pushed when ticker text changes

### Offline Mode
- `Screen.isOfflineCacheMode` flag set during heartbeat
- Player sends `isOfflineMode: true` in heartbeat when it detects no internet
- No server-side logic to pre-download content for anticipated offline periods

---

## 3. What Is Missing

1. **No screenshot upload** — Remote command `screenshot` is sent but no endpoint receives the screenshot from the player. No `POST /player/screenshot` endpoint.

2. **No crash/error reporting** — No endpoint for players to report crashes, JS errors, or playback failures. No `POST /player/crash-report`.

3. **No OTA update mechanism** — No way to push player app updates from the server. Players must self-update or be manually updated.

4. **No content manifest** — No endpoint returns a manifest of all required assets (media files, canvas data) for a screen. Player must parse the playlist to determine what to cache.

5. **No bandwidth-aware delivery** — All content is delivered at full quality. No adaptive bitrate streaming for videos. No thumbnail/preview for low-bandwidth situations.

6. **No command acknowledgment** — Remote commands are fire-and-forget. No `command:ack` event from player to confirm execution.

7. **No player version tracking** — No field on Screen to track which player app version is running. Can't detect outdated players.

8. **No player health metrics** — No endpoint for players to report CPU, memory, temperature, disk space, or network status.

9. **No content hash for cache validation** — Bootstrap returns full content. No ETag or content hash for conditional requests. Player can't ask "has anything changed since last bootstrap?"

10. **No multi-screen sync** — No mechanism to synchronize playback across multiple screens (e.g., video walls).

---

## 4. Problems

1. **Bootstrap returns full content every time** — No incremental updates. A screen with 100 media items downloads all item metadata on every bootstrap, even if nothing changed.

2. **No conditional bootstrap** — No `If-None-Match` / ETag support. Player must always re-download everything.

3. **Media URLs are absolute** — `buildPublicUrl()` returns absolute URLs with `MEDIA_PUBLIC_BASE_URL`. If the server moves, all cached URLs are invalid.

4. **No retry logic for failed content downloads** — If a media file fails to download, the player has no guidance on retry strategy.

5. **Prayer pause only checks on API call** — No Socket.IO event pushes prayer pause status change. Player must poll `GET /player/prayer-pause-status`.

6. **No player authentication token rotation** — The per-screen secret is set during pairing and never changes. If compromised, there's no rotation mechanism.

---

## 5. Risks

- **High: No crash reporting** — Silent player failures are undetectable.
- **Medium: No content manifest** — Offline caching is unreliable without a manifest.
- **Medium: No command acknowledgment** — Can't verify remote commands were executed.
- **Medium: No player version tracking** — Can't detect incompatible players.
- **Low: No OTA updates** — Manual updates don't scale.

---

## 6. Priority: **High**

Player communication covers core flows but lacks operational visibility (crash reports, health metrics, command acks).

---

## 7. Completion Percentage: **85%**

Bootstrap, pairing, prayer pause, remote commands, and realtime content sync are all implemented. Missing: screenshots, crash reports, OTA, content manifest, command acks, health metrics.

---

## 8. Recommendations

1. Add `POST /player/screenshot` endpoint for screenshot uploads (S3 storage)
2. Add `POST /player/crash-report` endpoint for crash/error reporting
3. Add `playerVersion` field to Screen model, sent during heartbeat
4. Add `GET /player/manifest/:screenId` endpoint returning content manifest with hashes
5. Add ETag support to bootstrap endpoint: return 304 if content unchanged
6. Add `command:ack` Socket.IO event from player to confirm command execution
7. Add `POST /player/health` endpoint for CPU, memory, disk, network status
8. Add Socket.IO event `prayer:pause-changed` to push prayer pause status changes
9. Add per-screen secret rotation: `POST /screens/:id/rotate-secret`
10. Add `playerPlatform` and `playerVersion` to heartbeat payload for tracking

---

## 9. Future Tasks

- [ ] Add screenshot upload endpoint
- [ ] Add crash report endpoint
- [ ] Add player version tracking
- [ ] Add content manifest endpoint
- [ ] Add ETag support to bootstrap
- [ ] Add command acknowledgment
- [ ] Add player health metrics
- [ ] Add prayer pause push event
- [ ] Add per-screen secret rotation
- [ ] Add multi-screen sync support
