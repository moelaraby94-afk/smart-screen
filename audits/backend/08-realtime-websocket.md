# 08 — Realtime & WebSocket Audit

> **Objective:** Evaluate the Socket.IO gateway, heartbeat system, event architecture, scaling strategy, and connection management.

---

## 1. Current State

Realtime communication is implemented via a Socket.IO gateway in `domains/realtime/realtime.gateway.ts` (462 lines) with a companion `ScreenHeartbeatService` (220 lines). The gateway handles two client types: **player screens** and **dashboard clients**, each with different authentication and event flows.

---

## 2. What Exists

### Gateway Configuration
- **Namespace:** `/realtime` (configured in `@WebSocketGateway`)
- **CORS:** Uses shared `createCorsOriginChecker()` from `cors-config.ts`
- **Transports:** WebSocket + polling fallback
- **Authentication:** Custom `handleConnection()` validates JWT or screen secret

### Connection Authentication
- **Dashboard clients:** JWT extracted from `auth` handshake payload, validated via `JwtService`
- **Player screens:** `screen:register` event with `serialNumber` + `secret`
  - Per-screen secret: bcrypt compare against `Screen.pairingSecretHash`
  - Fallback: shared `PLAYER_HEARTBEAT_SECRET` (with warning log)
  - Invalid auth → socket disconnected immediately

### Screen Lifecycle
1. **Register:** `screen:register` → validate secret → bind socket → update status to ONLINE → join `screen:{id}` and `workspace:{id}` rooms → emit `screen:registered`
2. **Heartbeat:** `screen:heartbeat` → update `lastPingAt` → update DB `lastSeenAt` + `status: ONLINE` → emit `screen:status` to workspace room
3. **Disconnect:** `handleDisconnect()` → unbind socket → update status to OFFLINE → emit `screen:status`
4. **Stale sweep:** `ScreenHeartbeatService.sweepStaleScreens()` runs every 10s (configurable `HEARTBEAT_SWEEP_MS`), marks screens OFFLINE if no heartbeat for 45s (configurable `HEARTBEAT_STALE_MS`)

### Dashboard Lifecycle
1. **Connect:** JWT auth → join `workspace:{id}` room
2. **Subscribe:** `dashboard:subscribe` with `workspaceId` → join `workspace:{id}` room
3. **Unsubscribe:** `dashboard:unsubscribe` → leave room
4. **Disconnect:** Socket cleaned up, no DB changes

### Pairing Watch
- `pairing:watch` event → join `pairing:{sessionId}` room
- `pairing:complete` emitted to room when claim succeeds
- `pairing:started` emitted to workspace room when pairing begins

### Emitted Events (Server → Client)
| Event | Target | Payload | Description |
|-------|--------|---------|-------------|
| `screen:status` | `workspace:{id}` | `{ screenId, serialNumber, status, lastSeenAt, isOfflineCacheMode }` | Screen online/offline status |
| `screen:registered` | Socket | `{ screenId, serialNumber }` | Registration confirmation |
| `content:sync` | `screen:{id}` | Custom | Content update push |
| `remote:command` | `screen:{id}` | Custom | Remote command (reboot, reload, etc.) |
| `player:ticker` | `screen:{id}` | `{ text, at }` | Ticker text update |
| `canvas:live` | `screen:{id}` | Custom | Live canvas layout push |
| `schedule:changed` | `screen:{id}` | `{ screenId, at, playlist }` | Schedule change notification |
| `workspace:subscription` | `workspace:{id}` | Custom | Subscription update |
| `pairing:started` | `workspace:{id}` | Custom | Pairing session started |
| `pairing:complete` | `pairing:{sessionId}` | Custom | Pairing session claimed |
| `upload:complete` | `workspace:{id}` | `{ fileName }` | Media upload complete |

### Received Events (Client → Server)
| Event | From | Payload | Description |
|-------|------|---------|-------------|
| `screen:register` | Player | `{ serialNumber, secret, isOfflineMode? }` | Register screen |
| `screen:heartbeat` | Player | `{ isOfflineMode? }` | Heartbeat ping |
| `dashboard:subscribe` | Dashboard | `{ workspaceId }` | Subscribe to workspace events |
| `dashboard:unsubscribe` | Dashboard | `{ workspaceId }` | Unsubscribe |
| `pairing:watch` | Player | `{ sessionId }` | Watch for pairing completion |

### Socket Bindings
- `ScreenHeartbeatService.socketBindings` — `Map<socketId, { screenId, workspaceId, serialNumber, lastPingAt }>`
- Tracks which socket is bound to which screen
- Used for heartbeat updates and stale sweep

### Error Handling
- `AllExceptionsFilter` handles WebSocket exceptions separately from HTTP
- Emits `exception` event to the client with normalized error body
- Non-HttpException errors are logged with stack trace

---

## 3. What Is Missing

1. **No Redis adapter** — Socket.IO uses in-memory adapter. Multiple API instances won't share socket state. A screen connected to instance A won't receive events emitted from instance B.

2. **No reconnection policy** — No custom reconnection logic. Socket.IO's built-in reconnection is used with defaults. No exponential backoff configuration.

3. **No connection metrics** — `getConnectedSocketCount()` exists but no endpoint exposes it. No Grafana/Prometheus metric for WebSocket connections.

4. **No event schema validation** — `@MessageBody()` payloads are not validated with DTOs. Malformed payloads could cause runtime errors.

5. **No per-screen event queue** — If a screen is offline when an event is emitted, the event is lost. No persistent queue for offline screens.

6. **No heartbeat from dashboard** — Only screens send heartbeats. Dashboard connections have no liveness check. Stale dashboard sockets are never cleaned up.

7. **No room size limits** — No limit on how many sockets can join a workspace room. A workspace with 1000 dashboard clients could cause broadcast storms.

8. **No WebSocket rate limiting** — `screen:register` and `screen:heartbeat` have no rate limit. A malicious client could flood the gateway.

9. **No event documentation** — No machine-readable schema for WebSocket events. No `@nestjs/swagger` equivalent for Socket.IO.

10. **No graceful WebSocket shutdown** — On SIGTERM, sockets are not gracefully disconnected. Players will experience abrupt connection loss.

---

## 4. Problems

1. **In-memory socket bindings** — `socketBindings` Map is per-process. With multiple instances, a heartbeat on instance A won't update the binding on instance B.

2. **Stale sweep disconnects sockets forcefully** — `disconnectSockets(true)` with `true` flag closes the underlying connection. This could cause players to miss the `screen:status` event.

3. **No backpressure handling** — If a screen's network is slow, emitting events could cause memory buildup. Socket.IO doesn't handle backpressure by default.

4. **Pairing watch doesn't expire** — A player joins `pairing:{sessionId}` room but never leaves. If the session expires, the room persists with the socket still in it.

5. **No authentication refresh** — JWT expires but the WebSocket connection persists. A user whose JWT expires can still receive workspace events until they disconnect.

---

## 5. Risks

- **Critical: No Redis adapter** — Horizontal scaling is impossible. Events won't reach screens connected to other instances.
- **High: No event validation** — Malformed payloads could crash the gateway.
- **Medium: No offline event queue** — Content updates to offline screens are lost.
- **Medium: No WS rate limiting** — Gateway is vulnerable to event flooding.
- **Low: No dashboard heartbeat** — Stale dashboard connections accumulate.

---

## 6. Priority: **High**

Realtime is functional for single-instance but cannot scale. Redis adapter is the most critical gap.

---

## 7. Completion Percentage: **82%**

Gateway handles all core flows (register, heartbeat, pairing, dashboard subscribe). Missing: Redis adapter, event validation, offline queue, rate limiting, graceful shutdown.

---

## 8. Recommendations

1. Add `@socket.io/redis-adapter` with Redis pub/sub for multi-instance event broadcasting
2. Add `@nestjs/websockets` DTO validation with `ValidationPipe` for `@MessageBody()` payloads
3. Add WebSocket rate limiting: custom guard that limits events per socket per second
4. Add persistent event queue for offline screens: store pending events in Redis, deliver on reconnect
5. Add dashboard heartbeat: `dashboard:heartbeat` event with 60s TTL, sweep stale dashboard sockets
6. Add room size limits: max 100 sockets per workspace room
7. Add connection metrics: Prometheus gauge for active connections, histogram for heartbeat latency
8. Add graceful shutdown: on SIGTERM, emit `server:shutdown` to all clients, wait 5s, then disconnect
9. Add JWT expiry check on existing WebSocket connections: periodically validate JWT, disconnect if expired
10. Document all WebSocket events with payload schemas in a shared types package

---

## 9. Future Tasks

- [ ] Add Redis adapter for Socket.IO
- [ ] Add event payload validation
- [ ] Add WebSocket rate limiting
- [ ] Implement offline event queue
- [ ] Add dashboard heartbeat
- [ ] Add room size limits
- [ ] Add connection metrics
- [ ] Add graceful WebSocket shutdown
- [ ] Add JWT expiry check on WS connections
- [ ] Document WebSocket event schemas
