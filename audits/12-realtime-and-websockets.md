# Audit 12: Realtime & WebSocket Layer

**Date:** 2026-07-13
**Reviewer:** Claude (Opus 4.8) — new file (area not covered by original audit 01–11)
**Scope:** Socket.io gateway, connection auth, room model, screen heartbeat, horizontal
scaling, reconnection & backpressure.

> The original audit named the `realtime` module in its inventory but never audited it.
> For a signage product where the whole value proposition is *live* screen status and
> instant content push, this is the highest-value uncovered area.

---

## 1. What exists

**File:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
Plus `screen-heartbeat.service.ts` (socket↔screen binding + broadcast) and
`realtime.module.ts` (imports `AuthModule` for `JwtService`).

- **Transport:** Socket.io `@WebSocketGateway`, namespace `/realtime`.
- **CORS:** origin allow-list from `process.env.FRONTEND_ORIGINS` (falls back to
  `http://localhost:3000` / `:3001`), `credentials: true` (`realtime.gateway.ts:45-60`).
- **Two client classes:**
  1. **Dashboard users** — authenticated with the JWT access token from the handshake
     (`client.handshake.auth.token`, verified via `jwtService.verify`, `:381,:390`).
  2. **Screens / players** — authenticated with the per-screen secret
     (`assertScreenSecret`, `:214`); pairing rooms (`pairing:{sessionId}`) are joined
     **unauthenticated** but gated by the one-time poll secret (`:304`).
- **Heartbeat:** `ScreenHeartbeatService` keeps an in-memory map of `socketId → screen
  binding` (`getBinding`, `unbindSocket`) and broadcasts screen status changes to the
  dashboard.

**Strengths (verified):**
- WebSocket connections are actually authenticated (JWT for users, secret for screens) —
  not an open firehose. ✅
- CORS is an explicit allow-list, not reflection. ✅
- Pairing rooms are scoped per session and secret-gated. ✅
- Screen-secret auth reuses the same one-time-handoff secret as REST (no shared global
  secret). ✅

---

## 2. Issues

### High

1. **No horizontal scaling — single instance only.**
   Socket.io is running with the default **in-memory adapter**; there is no
   `@socket.io/redis-adapter` (or equivalent) dependency. With more than one backend
   replica:
   - A screen connected to replica A will **not** receive an event broadcast from replica
     B (e.g. a content push triggered by a dashboard user on B).
   - `ScreenHeartbeatService`'s socket-binding map is per-process, so "online screens"
     is per-replica, making the admin fleet view wrong under load-balancing.
   This mirrors the in-memory throttler problem (audit 04 §4.3 / file 00 T6) and is the
   same root cause: **shared state assumed to be single-process.**
   **Fix:** add a Redis adapter for Socket.io *and* Redis-backed throttler storage before
   running >1 backend instance.

2. **`handleConnection` emits before authentication.**
   `handleConnection` immediately does `client.emit('connected', …)` for *every* socket
   (`:81-83`) before any token/secret check. Auth happens later on a subscribe message.
   An unauthenticated client can therefore hold an open socket and probe subscribe events.
   The subscribe handlers do enforce auth, so this is not a data leak, but it allows
   cheap unauthenticated socket churn (see next item).

### Medium

3. **No connection-rate limiting / handshake throttling.**
   REST routes are throttled, but WebSocket upgrades are not. A client can open/close
   sockets rapidly with no per-IP cap. Add a handshake-level guard or connection cap.

4. **Origin config drift.** The gateway reads `FRONTEND_ORIGINS`, while the REST CORS
   layer (audit 04 §5.1) reads `ALLOWED_ORIGINS`. Two different env vars govern
   cross-origin access; they can silently diverge in production (WS allowed from an origin
   REST blocks, or vice-versa). Consolidate to one source of truth.

5. **Reconnection / offline transition semantics unverified.**
   On `handleDisconnect` the binding is removed, but there is no documented
   "grace period" before a screen is marked offline, and no server-initiated
   "screen disconnected" event was confirmed on the dashboard side. A brief network blip
   may flap a screen ONLINE→OFFLINE→ONLINE. Verify debounce.

### Low

6. **No backpressure / message-size limits** on inbound socket events documented.
7. **No metrics** on active socket count, per-namespace, for capacity planning
   (ties to file 15).

---

## 3. Cross-references

- Horizontal-scaling blocker is shared with **file 00 §6 (M2)** and **audit 04 §4.3**.
- Screen-secret model is the same one audited in **audit 11 §2** (player side).
- Prayer-pause push (if implemented on the player, see file 00 C1) would ride this layer.

---

## 4. Recommended checks before production multi-instance

1. Add `@socket.io/redis-adapter` + shared Redis; move throttler to Redis storage.
2. Move `ScreenHeartbeatService` binding state to Redis (or accept single-instance).
3. Add handshake auth **before** emitting `connected`, plus a per-IP connection cap.
4. Unify `FRONTEND_ORIGINS` and `ALLOWED_ORIGINS`.
5. Add an integration test: two simulated backend instances, event on A received by
   screen on B (will fail today — proves the gap).
