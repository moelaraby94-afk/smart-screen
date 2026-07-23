# Cloud-Screen Production Readiness Audit

**Auditor:** Senior Staff Engineer (Cascade)
**Date:** 2025-01-20
**Branch:** `fix/security-audit-v2`
**Scope:** Full platform — backend, dashboard, player, operations

---

## Executive Summary

The Cloud-Screen platform has a **mature security posture** with strong auth, workspace isolation, upload validation, and production boot-time guards. The **player offline/recovery pipeline** is well-designed with exponential backoff, cache-and-retry, and skip-streak reload logic. However, several **production-critical issues** remain before launch to paying customers:

- **1 Critical:** Unbounded recursive `emitForPlaylist` cascade can hang the API
- **3 High:** Media cache memory bomb, unbounded list endpoints, missing cache eviction
- **5 Medium:** Race conditions, missing pagination, UX gaps, monitoring blind spots
- **4 Low:** Minor hardening, a11y gaps, logging improvements

**Recommendation:** Fix the 1 Critical and 3 High issues before launch. Medium/Low can follow in the first 30 days post-launch.

---

## Findings Index

| # | Severity | Area | Title |
|---|----------|------|-------|
| F-01 | Critical | Performance | `emitForPlaylist` unbounded recursive cascade |
| F-02 | High | Performance | `getMediaCacheSize` loads all cached blobs into memory every 30s |
| F-03 | High | Performance | Unbounded list endpoints (members, invites, assignments, analytics, overlaps) |
| F-04 | High | Reliability | No Cache API eviction — unbounded media cache growth on player |
| F-05 | Medium | Stability | `emitForPlaylist` sequential `await` loop for screen emissions |
| F-06 | Medium | Stability | `applyPlaylistPayload` async state update not cancellation-safe |
| F-07 | Medium | UX | `WidgetErrorBoundary` silently swallows errors without logging |
| F-08 | Medium | Operations | No request ID / correlation ID in logs |
| F-09 | Medium | Security | `listOverlaps` endpoint has no pagination |
| F-10 | Low | UX | Player HUD cache size display is misleading during offline mode |
| F-11 | Low | Operations | Swagger UI not explicitly disabled in production |
| F-12 | Low | UX | `AlertDialogAction` always uses destructive variant |
| F-13 | Low | Security | Player bootstrap endpoint lacks per-screen rate limiting |

---

## Detailed Findings

---

### F-01 — Critical: `emitForPlaylist` unbounded recursive cascade

**Area:** Performance / Stability

**Evidence:**

`@/apps/backend/src/domains/playlists/playlists.service.ts:776-785`

```typescript
const parentItems = await this.prisma.playlistItem.findMany({
  where: { nestedPlaylistId: playlistId },
  select: { playlistId: true },
});
const parentIds = [...new Set(parentItems.map((p) => p.playlistId))];
for (const parentId of parentIds) {
  await this.emitForPlaylist(parentId);  // ← recursive, no visited set
}
```

The `emitForPlaylist` method recursively walks up the nested-playlist tree to notify all parent screens. Unlike `resolvePlaylistItemsRecursive` (which has a `visited` Set and `MAX_NESTING_DEPTH` guard), this upward cascade has **no visited set** and **no depth limit**.

**Risk:**
- If a circular nested-playlist reference exists (possible via direct DB manipulation or a bug in the circular-reference check), this becomes an **infinite recursion** that hangs the event loop and crashes the process with a stack overflow.
- Even without a cycle, a deep nesting chain (A→B→C→D→...) produces N sequential DB queries + N sequential `emitPlaylistForScreen` calls, blocking the event loop for seconds.
- Called on every `publish` and `replaceItems` operation.

**Root Cause:** The downward resolution path (`resolvePlaylistItemsRecursive`) was hardened with `visited` + `MAX_NESTING_DEPTH`, but the upward notification path was not.

**Recommended Fix:**
1. Add a `visited: Set<string>` parameter (default `new Set()`) to `emitForPlaylist`.
2. At the top of the method, if `visited.has(playlistId)` return early.
3. Add `playlistId` to `visited` before recursing.
4. Consider batching the `emitPlaylistForScreen` calls with `Promise.all` instead of sequential `await` in the `for` loop at line 787.

**Estimated Effort:** 1-2 hours

---

### F-02 — High: `getMediaCacheSize` loads all cached blobs into memory every 30s

**Area:** Performance / Reliability

**Evidence:**

`@/apps/player/src/lib/media-cache.ts:98-114`

```typescript
export async function getMediaCacheSize(): Promise<number> {
  const cache = await openCache();
  const keys = await cache.keys();
  let total = 0;
  for (const key of keys) {
    const res = await cache.match(key);
    if (res) {
      const blob = await res.blob();  // ← loads entire file into memory
      total += blob.size;
    }
  }
  return total;
}
```

Called from `@/apps/player/src/components/player-hud.tsx:50-63` every **30 seconds** via `setInterval`.

**Risk:**
- If the player has cached 50 media files at 5MB each (250MB total), every 30 seconds the player materializes 250MB of Blob objects in memory just to read `.size` — which is already available in the `Response.headers` (`Content-Length`).
- On low-memory kiosk devices (Raspberry Pi, Android sticks), this can trigger OOM crashes or GC pressure that causes frame drops during playback.
- The blobs created here are **never revoked** (no `URL.revokeObjectURL`), so they linger until GC.

**Root Cause:** The cache size estimation was implemented as a debug HUD feature using the simplest approach (`.blob().size`) without considering memory implications.

**Recommended Fix:**
- Read `Content-Length` from the `Response.headers` instead of materializing the blob:
```typescript
const res = await cache.match(key);
if (res) {
  const len = res.headers.get('Content-Length');
  if (len) total += Number(len);
}
```
- Fallback to `blob().size` only if `Content-Length` is missing.

**Estimated Effort:** 30 minutes

---

### F-03 — High: Unbounded list endpoints (members, invites, assignments, analytics, overlaps)

**Area:** Performance

**Evidence:**

1. **Workspace members** — `@/apps/backend/src/domains/workspaces/workspace-members.service.ts:21-39`:
   ```typescript
   async listMembers(workspaceId: string) {
     const rows = await this.prisma.workspaceMember.findMany({
       where: { workspaceId },
       orderBy: { createdAt: 'asc' },
       // no take, no skip
     });
   ```

2. **Workspace invites** — `@/apps/backend/src/domains/workspaces/workspace-invites.service.ts` (similar pattern, no pagination).

3. **Screen assignments** — `@/apps/backend/src/domains/screens/screen-assignments.service.ts:20-29`:
   ```typescript
   async listAssignments(workspaceId: string, screenId: string) {
     return this.prisma.screenPlaylistAssignment.findMany({
       where: { screenId },
       // no take, no skip
     });
   ```

4. **Screen analytics** — `@/apps/backend/src/domains/screens/screens.service.ts:301-316`:
   ```typescript
   async getAnalytics(workspaceId: string) {
     const screens = await this.prisma.screen.findMany({
       where: { workspaceId },
       // no take, no skip
     });
   ```

5. **Schedule overlaps** — `@/apps/backend/src/domains/schedules/schedules.service.ts:47-62`:
   ```typescript
   async listOverlaps(workspaceId: string) {
     const rows = await this.prisma.schedule.findMany({
       where: { workspaceId, enabled: true },
       // no take, no skip
     });
   ```

**Risk:**
- While workspace seat limits (default 25) and screen limits (default 25) cap members and screens in practice, there is **no hard guarantee** at the query level. A workspace with a custom high seat limit or a bug in limit enforcement could return thousands of rows in a single request.
- The `listOverlaps` endpoint loads all enabled schedules into memory for in-memory comparison — with no limit, a workspace with hundreds of schedules would produce a large response and CPU spike.
- These endpoints are called by the dashboard on every page load, so latency scales with data size.

**Root Cause:** These endpoints were implemented for small workspaces where "fetch everything" was practical. The paginated endpoints (playlists, schedules, screens) were retrofitted with `PaginationQueryDto`, but these auxiliary endpoints were not.

**Recommended Fix:**
- For members/invites/assignments: Add `take: 500` (or the workspace's seat/screen limit) as a safety cap. These are inherently bounded by subscription limits, so full pagination is optional.
- For `listOverlaps`: Add `take: 1000` as a safety cap. This is a diagnostic endpoint, not a list view.
- For `getAnalytics`: Already bounded by screen limit, but add `take: 500` as a hard cap.

**Estimated Effort:** 1 hour

---

### F-04 — High: No Cache API eviction — unbounded media cache growth on player

**Area:** Reliability

**Evidence:**

`@/apps/player/src/lib/media-cache.ts:3`:
```typescript
const CACHE_NAME = 'smartscreen-player-v1';
```

The player uses the browser Cache API to store media files for offline playback. Files are added via `warmMediaUrls` and `resolvePlaybackUrl`, but **never evicted**. The only cleanup is `clearPlayerMediaCache()` which deletes the entire cache — called only on `refresh_content` remote command.

`@/apps/player/src/lib/offline-playlist-cache.ts` stores the playlist snapshot in `localStorage` with no size check beyond a try/catch for quota errors.

**Risk:**
- Over weeks of operation, a player that receives playlist updates with new media will accumulate stale media in the Cache API indefinitely. Browsers typically allow 50-80% of free disk space, so on a dedicated kiosk this could grow to gigabytes.
- When the browser evicts cache entries under pressure, it may evict the **currently playing** media, causing playback failures.
- `localStorage` has a 5-10MB limit; the playlist snapshot is small, but there's no cleanup of old snapshots when the playlist changes.

**Root Cause:** The cache was designed for offline resilience (keep everything) but lacks an LRU eviction strategy for long-running players.

**Recommended Fix:**
1. Add an `evictStaleMedia(currentUrls: string[])` function that:
   - Lists all cache keys
   - Deletes entries not in `currentUrls`
   - Runs after each `warmMediaUrls` call
2. Alternatively, use a cache version that includes a date stamp and rotate caches (delete old version after new one is populated).
3. Consider using `navigator.storage.estimate()` to proactively evict when usage exceeds 80% of quota.

**Estimated Effort:** 2-3 hours

---

### F-05 — Medium: `emitForPlaylist` sequential `await` loop for screen emissions

**Area:** Stability / Performance

**Evidence:**

`@/apps/backend/src/domains/playlists/playlists.service.ts:787-789`:
```typescript
for (const id of ids) {
  await this.emitPlaylistForScreen(id);
}
```

Each `emitPlaylistForScreen` calls `getPlaylistPayloadForScreen` which runs a DB query + playlist resolution. With N screens, this is N sequential DB queries.

**Risk:**
- A workspace with 25 screens and a complex playlist takes 25 × (DB query + resolution) time, blocking the HTTP response that triggered the publish.
- The caller (e.g., `replaceItems`) cannot return until all emissions complete.

**Root Cause:** Sequential pattern chosen for simplicity; `Promise.all` would parallelize but increase DB connection pressure.

**Recommended Fix:**
- Replace with `Promise.all(ids.map(id => this.emitPlaylistForScreen(id)))` or chunk into batches of 5.
- Alternatively, emit via event queue (BullMQ) for asynchronous processing.

**Estimated Effort:** 30 minutes

---

### F-06 — Medium: `applyPlaylistPayload` async state update not cancellation-safe

**Area:** Stability

**Evidence:**

`@/apps/player/src/components/player-runtime.tsx:144-169`:
```typescript
const applyPlaylistPayload = useCallback((raw: unknown) => {
  const next = parsePlaylistPayload(raw);
  if (!next) return;
  const urls = collectMediaUrls(next);
  void (async () => {
    try {
      await warmMediaUrls(urls);  // ← await before setState
    } catch (e) {
      devWarn('[player-runtime] warmMediaUrls failed', e);
    }
    setLiveCanvasLayouts({});
    setPlaylist(next);  // ← setState after await, no cancellation check
    // ... saveOfflinePlaylistSnapshot
  })();
}, []);
```

If two `content:sync` events arrive in quick succession (e.g., publish + schedule change), both async operations run concurrently. The second `setPlaylist` may overwrite the first, or the first may overwrite the second — **last writer wins** with no guarantee of ordering.

**Risk:**
- Player shows stale playlist content for one cycle (until next poll/heartbeat).
- Not a crash risk, but a correctness issue that could confuse operators.

**Root Cause:** No cancellation token or generation counter to discard stale async results.

**Recommended Fix:**
- Add a `generationRef` that increments on each call. After the `await warmMediaUrls`, check if the generation is still current before calling `setPlaylist`.

**Estimated Effort:** 30 minutes

---

### F-07 — Medium: `WidgetErrorBoundary` silently swallows errors without logging

**Area:** UX / Operations

**Evidence:**

`@/apps/dashboard/src/components/widget-error-boundary.tsx:20-24`:
```typescript
static getDerivedStateFromError(): State {
  return { hasError: true };
}

override componentDidCatch() {}  // ← empty, no logging
```

**Risk:**
- Dashboard widget crashes are invisible to operators. No Sentry breadcrumb, no console error, no server-side log.
- Makes debugging production issues significantly harder.

**Root Cause:** The error boundary was implemented as a UI fallback without considering observability.

**Recommended Fix:**
- In `componentDidCatch(error, info)`, log to console and send to Sentry:
```typescript
override componentDidCatch(error: Error, info: React.ErrorInfo) {
  console.error('[WidgetErrorBoundary]', error, info);
  Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
}
```

**Estimated Effort:** 15 minutes

---

### F-08 — Medium: No request ID / correlation ID in logs

**Area:** Operations

**Evidence:**

`@/apps/backend/src/common/request-context/` — The `RequestContextModule` and `AppLogger` exist, but there is no middleware that generates or propagates a request ID for HTTP requests. The `AllExceptionsFilter` logs `${request.method} ${request.originalUrl}` but no correlation ID.

**Risk:**
- In production with multiple concurrent requests, tracing a single request's lifecycle across logs is impossible.
- Sentry events from the backend have no request correlation.

**Root Cause:** The logging infrastructure (`AppLogger`, `RequestContextModule`) was built but the request ID injection middleware was not wired.

**Recommended Fix:**
- Add a middleware that generates `req.id = crypto.randomUUID()` (or reads `X-Request-Id` header) and logs it with every request.
- Include `req.id` in the `AllExceptionsFilter` log output.

**Estimated Effort:** 1 hour

---

### F-09 — Medium: `listOverlaps` endpoint has no pagination

**Area:** Security / Performance

**Evidence:**

`@/apps/backend/src/domains/schedules/schedules.service.ts:47-62` — loads all enabled schedules for a workspace into memory, then runs `findOverlappingPairs` which is O(n²) in the number of schedules.

**Risk:**
- A workspace with 500 schedules produces 125,000 comparisons in a single request.
- The response could be very large (all overlapping pairs).

**Root Cause:** Diagnostic endpoint implemented without scale considerations.

**Recommended Fix:**
- Add a `take: 200` limit to the query.
- Consider paginating the overlap results or returning only a count + top 50 pairs.

**Estimated Effort:** 30 minutes

---

### F-10 — Low: Player HUD cache size display is misleading during offline mode

**Area:** UX

**Evidence:**

`@/apps/player/src/components/player-hud.tsx:50-63` — `getMediaCacheSize` runs every 30s regardless of online/offline state. During offline mode, no new content is cached, but the HUD still shows the same number (which is correct but confusing since it doesn't indicate "offline" context).

**Risk:** Minor — operators may think the player is still downloading content when it's not.

**Recommended Fix:** Show an "offline" indicator in the HUD when `navigator.onLine === false`.

**Estimated Effort:** 15 minutes

---

### F-11 — Low: Swagger UI not explicitly disabled in production

**Area:** Security / Operations

**Evidence:**

`@/apps/backend/src/main.ts:164`:
```typescript
if (process.env.ENABLE_SWAGGER === 'true') {
```

Swagger is gated by an env var, which is good. However, there's no assertion that `ENABLE_SWAGGER` is `false` or unset in production (unlike the CORS and secrets assertions).

**Risk:** If someone accidentally sets `ENABLE_SWAGGER=true` in production, the API documentation is publicly accessible.

**Recommended Fix:** Add to `assertProductionSecretsAreSet`:
```typescript
if (env.NODE_ENV === 'production' && env.ENABLE_SWAGGER === 'true') {
  problems.push('ENABLE_SWAGGER must not be true in production');
}
```

**Estimated Effort:** 10 minutes

---

### F-12 — Low: `AlertDialogAction` always uses destructive variant

**Area:** UX

**Evidence:**

`@/apps/dashboard/src/components/ui/alert-dialog.tsx:87-96`:
```typescript
function AlertDialogAction({ className, ...props }) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants({ variant: 'destructive' }), className)}
      {...props}
    />
  );
}
```

All confirmation dialogs use the red destructive button style, even for non-destructive confirmations.

**Risk:** Minor — users become desensitized to the red button, reducing the effectiveness of the visual warning for actually destructive actions.

**Recommended Fix:** Add a `variant` prop to `AlertDialogAction` defaulting to `destructive`.

**Estimated Effort:** 15 minutes

---

### F-13 — Low: Player bootstrap endpoint lacks per-screen rate limiting

**Area:** Security

**Evidence:**

`@/apps/backend/src/domains/player/player.controller.ts` — The `GET /player/bootstrap` endpoint inherits the global throttle (300/min per IP) but has no per-screen throttle. A compromised player secret could be used to hammer the bootstrap endpoint 300 times per minute per IP.

**Risk:** Low — the global throttle provides baseline protection, and the bootstrap response is not expensive (single DB query + playlist resolution).

**Recommended Fix:** Add `@Throttle({ default: { limit: 10, ttl: 60_000 } })` to the bootstrap endpoint.

**Estimated Effort:** 10 minutes

---

## What's Working Well (Confirmed)

These areas were audited and found to be production-ready:

### Authentication & Authorization
- **JWT lifecycle:** Access (15min) + refresh (7d) tokens with bcrypt-hashed refresh tokens, session IDs, and reuse detection (`@/apps/backend/src/domains/auth/auth-token.service.ts`)
- **Audience separation:** `resolveAudience` / `validateAudience` prevent customer tokens from accessing admin endpoints (`@/apps/backend/src/domains/auth/auth.types.ts`)
- **Cookie security:** httpOnly, secure, sameSite flags configured per environment (`@/apps/backend/src/domains/auth/auth-cookie.util.ts`)
- **CSRF protection:** CSRF token generated and validated via `CsrfModule`
- **Production secrets assertion:** Boot-time validation of JWT secrets (length, entropy, no placeholders, access ≠ refresh) (`@/apps/backend/src/common/config/assert-production-secrets.ts`)

### Workspace Isolation
- **Scoped queries:** All domain services filter by `workspaceId`
- **Membership enforcement:** `WorkspaceAuthHelper.assertAccess` with super-admin bypass and role checks (`@/apps/backend/src/common/auth/workspace-auth.helper.ts`)
- **Role-based guard:** `RolesGuard` dynamically resolves `workspaceId` from params/query/body/headers (`@/apps/backend/src/common/auth/roles.guard.ts`)
- **Seat limits:** Enforced on invitations with advisory lock (`@/apps/backend/src/domains/workspaces/workspace-invites.service.ts`)

### Pairing Flow
- **Per-screen secrets:** 32-byte random secrets, bcrypt-hashed, one-time handoff via atomic `updateMany` guard (`@/apps/backend/src/domains/pairing/pairing.service.ts`)
- **Tenant isolation:** Pinned sessions can only be claimed by the pinned workspace
- **Lockout service:** Failed claim attempts tracked and throttled
- **Shared secret fallback removed:** Legacy screens without `pairingSecretHash` are rejected

### Media Upload
- **Magic byte validation:** `file-type` library sniffs actual content, rejects renamed files (`@/apps/backend/src/domains/media/media.service.ts:145-156`)
- **MIME allowlist:** Only image/jpeg, png, gif, webp, video/mp4, webm, quicktime
- **Size limit:** 150MB hard cap at both Multer and service level
- **Storage quota:** Per-workspace advisory lock + aggregate check before insert
- **Atomic file staging:** `.part` → rename pattern; DB rollback on move failure
- **EXIF stripping:** Sharp rotates and strips EXIF from images
- **Video metadata:** ffprobe extraction (fault-tolerant)

### Player Reliability
- **Offline cache:** Playlist snapshot in localStorage + media in Cache API
- **Exponential backoff retry:** 5s base, 120s max, reset on `online` event
- **Skip-streak reload:** 5 consecutive failures → hard reload to clear bad state
- **Socket.IO reconnection:** Infinite attempts, 1s-20s backoff
- **Heartbeat:** 30s interval with battery, network, resolution reporting
- **Offline event queue:** Server drains queued events on screen reconnection

### Operations
- **Health endpoints:** `/health` (liveness) + `/ready` (readiness: DB, Redis, Storage) via Terminus
- **Graceful shutdown:** Ordered SIGTERM/SIGINT handler with 25s force-exit timeout
- **Global exception filter:** HTTP + WS context handling, Sentry integration
- **Helmet:** Security headers (CSP/COEP disabled for API + cross-origin media)
- **CORS:** Production allow-list with fail-fast if `ALLOWED_ORIGINS` is unset
- **Trust proxy:** Configurable hop count to prevent IP spoofing
- **Rate limiting:** Global 300/min + per-route tighter limits (login, pairing claim, etc.)
- **Validation pipe:** `whitelist: true, forbidNonWhitelisted: true` — rejects unknown fields
- **Sensitive field interceptor:** Strips sensitive fields from responses
- **Admin IP guard:** Global guard for admin route access

### Pagination
- **`PaginationQueryDto`:** Hard ceiling of 500, default 50, applied to playlists, schedules, screens
- **`buildPage`:** Consistent pagination response shape

### Dashboard UX
- **Empty states:** `EmptyState` component with icon, title, description, action button
- **Loading states:** Skeleton components used across features
- **Error states:** Error → `EmptyState` with retry action
- **Confirmation dialogs:** `AlertDialog` (Radix) with focus trap, Escape, cancel
- **Dialogs:** Radix-based with close button, aria-label
- **i18n:** Full EN/AR translation support
- **RTL:** `text-start`/`text-end` throughout

---

## Implementation Roadmap

### Phase 1: Launch Blockers (Before first paying customer)
| Priority | Finding | Effort |
|----------|---------|--------|
| P0 | F-01: Add visited set to `emitForPlaylist` | 1-2h |
| P0 | F-02: Fix `getMediaCacheSize` to use Content-Length | 30min |
| P0 | F-03: Add safety caps to unbounded list endpoints | 1h |
| P0 | F-04: Add cache eviction for stale media | 2-3h |

**Total Phase 1 effort:** ~5 hours

### Phase 2: First Week Hardening
| Priority | Finding | Effort |
|----------|---------|--------|
| P1 | F-05: Parallelize `emitForPlaylist` screen emissions | 30min |
| P1 | F-06: Add cancellation to `applyPlaylistPayload` | 30min |
| P1 | F-07: Add logging to `WidgetErrorBoundary` | 15min |
| P1 | F-08: Add request ID middleware | 1h |
| P1 | F-09: Cap `listOverlaps` results | 30min |

**Total Phase 2 effort:** ~3 hours

### Phase 3: Post-Launch Polish (30 days)
| Priority | Finding | Effort |
|----------|---------|--------|
| P2 | F-10: Offline indicator in player HUD | 15min |
| P2 | F-11: Assert Swagger disabled in production | 10min |
| P2 | F-12: Add variant prop to `AlertDialogAction` | 15min |
| P2 | F-13: Per-screen rate limit on bootstrap | 10min |

**Total Phase 3 effort:** ~1 hour

---

**Grand total estimated effort:** ~9 hours

---

## Methodology

This audit was conducted by:
1. Reading and analyzing source code across `apps/backend/src`, `apps/player/src`, and `apps/dashboard/src`
2. Tracing end-to-end user journeys from API controllers through services to database queries
3. Examining error handling, retry logic, and resource cleanup patterns
4. Verifying security controls (auth, authz, isolation, validation) against production requirements
5. Assessing performance characteristics of database queries, cache usage, and rendering
6. Evaluating player offline/recovery resilience
7. Reviewing operational readiness (health, logging, shutdown, deployment safety)

No code was modified during this audit. All findings are evidence-based with file references.
