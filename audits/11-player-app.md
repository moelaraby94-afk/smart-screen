# Audit 11: Player App

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Player application architecture, pairing flow, content rendering, offline support, heartbeat

---

## 1. Player App Overview

**Location:** `apps/player/`  
**Framework:** Next.js  
**Purpose:** Runs on digital signage screens, displays content, communicates with backend

### 1.1 Structure

```
apps/player/src/
├── app/               # Next.js App Router (4 items)
├── components/        # Player UI components (9 items)
├── lib/               # Utilities and API clients (9 items)
└── types/             # TypeScript types (2 items)
```

### 1.2 Configuration

- `next.config.ts` (233 bytes) — minimal config
- `eslint.config.mjs` (707 bytes) — linting
- `tsconfig.json` (704 bytes) — TypeScript config
- `package.json` (1074 bytes) — dependencies

---

## 2. Pairing Flow

### 2.1 Player-Side Flow

```
Player opens → shows pairing screen
  → POST /api/v1/player/pairing/sessions
    Body: { playerPlatform, resolutionWidth, resolutionHeight, workspaceId? }
    Header: x-player-secret (if workspaceId provided)
  → Receives: { sessionId, pairingCode, pollSecret, expiresAt }
  → Displays 6-digit code on screen
  → Polls: POST /api/v1/player/pairing/sessions/:id/poll
    Header: x-pairing-poll-secret
  → When claimed: receives { screenId, workspaceId, screenSecret, serialNumber }
  → Stores screen secret for heartbeat authentication
  → Transitions to content display mode
```

### 2.2 Security

- **Poll secret**: Per-session secret prevents unauthorized polling ✅
- **Screen secret**: Per-screen secret for heartbeat authentication ✅
- **One-time handoff**: Screen secret is only readable once (atomic `updateMany` guard) ✅
- **Tenant isolation**: Pinned `workspaceId` prevents cross-tenant claiming ✅

### 2.3 Issues

1. **Secret storage**: How the player stores the screen secret (localStorage? cookie? file?) needs verification. If stored in localStorage, it's vulnerable to XSS.
2. **No re-pairing flow**: If a screen loses its secret (e.g., browser cache cleared), the screen must be re-paired. No auto-recovery mechanism.
3. **Session expiry**: If the pairing session expires before the user claims it, the player must restart the flow. No auto-retry.

---

## 3. Content Rendering

### 3.1 Bootstrap

```
Player → GET /api/v1/player/:screenId/bootstrap
  → Returns: screen config, active playlist, canvas data
  → Player renders content
```

### 3.2 Canvas Rendering

The player likely uses Konva.js (or similar) to render canvas layouts:
- Canvas data stored as `Json` in `Canvas.layoutData`
- Player interprets the JSON scene graph
- Supports image, video, URL, and widget canvas types

### 3.3 Content Types

| Type | Support | Notes |
|------|---------|-------|
| Image | ✅ | Static images from media library |
| Video | ✅ | Video files from media library |
| URL | ✅ | Embedded web pages |
| Widget | ✅ | Custom widgets (clock, weather, prayer times) |

### 3.4 Issues

1. **No content preloading**: If the player doesn't preload next playlist items, there may be blank transitions between content.
2. **No video codec verification**: Video files may not play on all platforms (e.g., H.265 on web players).
3. **No content caching**: If the player fetches content on each render, network issues cause blank screens.

---

## 4. Heartbeat

### 4.1 Implementation

```
Player → POST /api/v1/player/:screenId/heartbeat
  Header: x-player-secret (per-screen secret)
  Body: { status, ipAddress, ... }
  → Backend updates screen status + lastSeenAt
  → Emits WebSocket event for real-time dashboard updates
```

### 4.2 Heartbeat Issues

1. **Heartbeat interval**: Not visible in player code. Too frequent = battery/bandwidth waste. Too infrequent = stale status.
2. **No offline detection**: If the player stops sending heartbeats, the dashboard shows the last known status. No explicit "disconnected" event.
3. **Heartbeat retry**: If the heartbeat fails (network issue), does the player retry? Needs verification.

---

## 5. Offline Support

### 5.1 Current State

⚠️ **Unknown** — the player app's offline capabilities need verification:

- Does it cache content for offline playback?
- Does it queue heartbeats for when connectivity returns?
- Does it show a fallback screen when offline?

### 5.2 Recommendations

For a digital signage player, offline support is critical:
1. **Content caching**: Use Service Worker + Cache API to store all media files
2. **Heartbeat queuing**: Queue heartbeats in IndexedDB, send when online
3. **Fallback content**: Show last-known playlist when offline
4. **Connection indicator**: Show online/offline status on screen (optional)

---

## 6. Player App Issues

### High
1. **Offline support unknown**: Critical for signage — screens often have unreliable internet.
2. **No content preloading verification**: May cause blank transitions.
3. **Secret storage mechanism unknown**: Security risk if not stored securely.

### Medium
1. **No re-pairing auto-recovery**: Screens must be manually re-paired if secret is lost.
2. **No video codec verification**: Some videos may not play on all platforms.
3. **No OTA update mechanism**: Player updates require manual intervention.

### Low
1. **Heartbeat interval not verified**: May be too frequent or infrequent.
2. **No screenshot capture**: Phase 10 feature not implemented.
3. **No crash reporting**: Player crashes are invisible.

---

## 7. Strengths

- Clean pairing flow with 6-digit code
- Per-screen secret authentication (not shared)
- One-time secret handoff (atomic guard)
- Tenant isolation on pairing sessions
- WebSocket real-time updates to dashboard
- Heartbeat for screen status monitoring
- Support for multiple content types (image, video, URL, widget)
- Multi-platform support (Android, Tizen, webOS, Web)

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Corrections (things marked "unknown" that are actually verifiable):**
- §5 "Offline support unknown" → **implemented.** `apps/player/src/lib/media-cache.ts`
  (media caching) and `offline-playlist-cache.ts` (playlist caching) exist, plus a
  `screen_offline_cache_flag` migration. Assess *quality*, not existence.
- §2.3 "Secret storage mechanism unknown" → **confirmed `localStorage`**
  (`auth-session.ts:12,50` — key `cs_player_screen_secret`). The XSS concern is **real**
  and now confirmed, especially because URL/widget canvases can load third-party origins.

**Additions the original missed:**
- **Prayer auto-pause is not consumed by the player.** The backend exposes
  `GET /islamic/prayer-pause-status`, but no player code fetches it — so enabling auto-pause
  has **no on-screen effect** (file 00 C1 / M4). This is the concrete Phase-9 gap.
- **`ws` (WebSocket client lib) has a High CVE** (uninitialized memory disclosure) — the
  player's realtime channel rides on it. File 14 §1.1.
- Player app has its own **`AGENTS.md`**: read `node_modules/next/dist/docs/` before
  editing — the Next.js version differs from training data (file 13 §3).

**Confirmed-true (keep):** no OTA updates, no screenshot capture, heartbeat interval /
retry semantics still worth verifying (see also new file 12 for the server side).
