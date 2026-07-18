# 07 — Regression Review

> **Date:** 2025-07-18  
> **Role:** Release Manager  
> **Method:** Source code analysis for behavior changes, breaking changes, compatibility  
> **Scope:** Backend only

---

## 1. API Compatibility

### 1.1 No Breaking API Changes in Phase 1

Phase 1 was infrastructure-only. No API endpoints were added, removed, or modified. All changes were internal:

| Change | API Impact | Evidence |
|--------|-----------|----------|
| Redis service added | None — internal | `redis.service.ts` |
| Throttler storage changed | None — same interface | `redis-throttler-storage.ts` |
| Socket.IO adapter added | None — same WS events | `realtime.gateway.ts:98-100` |
| Storage abstraction | None — same API surface | `storage.interface.ts` |
| Graceful shutdown | None — same process behavior | `main.ts:174-205` |
| Health checks added | Additive — new endpoints | `/health`, `/ready` |
| Prisma pool config | None — env var only | `prisma.service.ts:29-39` |

**Verdict:** ✅ No API breaking changes.

### 1.2 Frontend Compatibility

| Check | Status | Evidence |
|-------|--------|----------|
| API endpoints unchanged | ✅ | No route modifications in Phase 1 |
| Response shapes unchanged | ✅ | No serialization changes |
| Authentication unchanged | ✅ | JWT flow identical |
| WebSocket events unchanged | ✅ | Same event names, same payloads |
| Static asset URLs unchanged | ✅ | Same `/media-files/` path when `local` provider |

**Verdict:** ✅ Frontend compatibility maintained.

### 1.3 Player Compatibility

| Check | Status | Evidence |
|-------|--------|----------|
| Heartbeat API unchanged | ✅ | Same endpoint, same payload |
| Screen registration unchanged | ✅ | Same `screen:register` event |
| Shared secret fallback maintained | ✅ | `realtime.gateway.ts:264` — backward compat |
| Legacy ping event maintained | ✅ | `realtime.gateway.ts:386` — backward compat |
| Playlist delivery unchanged | ✅ | Same API endpoints |

**Verdict:** ✅ Player compatibility maintained.

---

## 2. Database Migration Safety

### 2.1 Phase 1 Migrations

| Check | Status | Evidence |
|-------|--------|----------|
| No new migrations in Phase 1 | ✅ | Phase 1 was infrastructure-only |
| Existing migrations unchanged | ✅ | No migration files modified |
| `prisma migrate deploy` on boot | ✅ | `Dockerfile.backend:92` |
| Rollback plan | ✅ | `backup.sh` + `pg_restore` | `10-git-freeze-recommendation.md` |

**Verdict:** ✅ No migration risk from Phase 1.

### 2.2 CanvasVersion Migration (Phase 4)

| Check | Status | Evidence |
|-------|--------|----------|
| Migration exists | ✅ | `prisma/migrations/20260718000000_canvas_version_history/migration.sql` |
| Additive only | ✅ | New table, no existing table modifications |
| No data migration needed | ✅ | New table starts empty |

**Verdict:** ✅ CanvasVersion migration is safe (additive only).

---

## 3. Configuration Changes

### 3.1 New Environment Variables

| Variable | Default | Required? | Breaking? |
|----------|---------|-----------|-----------|
| `REDIS_URL` | unset (in-memory fallback) | No | ❌ No — optional |
| `MEDIA_STORAGE_PROVIDER` | `local` | No | ❌ No — defaults to existing behavior |
| `S3_BUCKET` | unset | Only if `s3` | ❌ No — only when switching provider |
| `S3_REGION` | unset | Only if `s3` | ❌ No |
| `S3_ENDPOINT` | unset | Only if `s3` | ❌ No |
| `S3_ACCESS_KEY` | unset | Only if `s3` | ❌ No |
| `S3_SECRET_KEY` | unset | Only if `s3` | ❌ No |
| `DATABASE_POOL_MAX` | 10 | No | ❌ No — defaults to Prisma default |
| `DATABASE_POOL_TIMEOUT_MS` | 30000 | No | ❌ No — defaults to Prisma default |

**Verdict:** ✅ All new env vars are optional with safe defaults. No breaking configuration changes.

### 3.2 Docker Compose Changes

| Change | Breaking? | Evidence |
|--------|-----------|----------|
| Redis service added | ❌ No — new service | `docker-compose.yml:26-38` |
| MinIO service added | ❌ No — new service | `docker-compose.yml:40-56` |
| Backend depends on Redis | ⚠️ Soft — Redis must be healthy | `docker-compose.yml:67-68` |
| Backend does NOT depend on MinIO | ✅ Correct | KI-005 |

**Verdict:** ⚠️ `docker compose up` now starts Redis. If Redis fails, backend won't start (due to `depends_on: condition: service_healthy`). This is intentional — Redis is required for multi-instance features.

---

## 4. Runtime Behavior Changes

### 4.1 Rate Limiting

| Before Phase 1 | After Phase 1 | Breaking? |
|----------------|---------------|-----------|
| In-memory throttler | Redis-backed throttler (when `REDIS_URL` set) | ❌ No — same behavior, distributed |
| In-memory throttler | In-memory throttler (when `REDIS_URL` unset) | ❌ No — identical |

**Verdict:** ✅ No behavior change. Redis is a transparent upgrade.

### 4.2 WebSocket

| Before Phase 1 | After Phase 1 | Breaking? |
|----------------|---------------|-----------|
| Single-instance WS | Multi-instance WS (when Redis set) | ❌ No — same events, same auth |
| Single-instance WS | Single-instance WS (when Redis unset) | ❌ No — identical |

**Verdict:** ✅ No behavior change. Redis adapter is transparent.

### 4.3 Storage

| Before Phase 1 | After Phase 1 | Breaking? |
|----------------|---------------|-----------|
| Direct `fs` calls | `IStorageService` abstraction | ❌ No — same file paths, same URLs |
| Local storage only | Local + S3 (selectable) | ❌ No — defaults to `local` |

**Verdict:** ✅ No behavior change. S3 is opt-in.

### 4.4 Shutdown

| Before Phase 1 | After Phase 1 | Breaking? |
|----------------|---------------|-----------|
| No SIGTERM handler | Ordered SIGTERM shutdown | ⚠️ Behavior change — process now waits for cleanup |
| Immediate exit | 25s force-exit timeout | ⚠️ Process may take up to 25s to exit |

**Verdict:** ⚠️ Shutdown behavior changed. This is an improvement but may affect deployment scripts that expect immediate exit. Document in release notes.

---

## 5. Hidden Regression Risks

### 5.1 Identified Risks

| Risk | Severity | Mitigation | Status |
|------|----------|------------|--------|
| Redis unavailable → throttler fail-open | Low | Returns `{ totalHits: 1 }` — allows request through | ✅ Documented |
| Redis unavailable → WS adapter fails | Medium | Socket.IO falls back to single-instance | ✅ Acceptable |
| Storage provider misconfigured | Medium | Throws at startup if `S3_BUCKET` empty | ✅ Caught at boot |
| `DATABASE_POOL_MAX` too high | Medium | Must not exceed PostgreSQL `max_connections` | ⚠️ Documented |
| Admin runtime store not shared | Medium | Local JSON files — breaks in multi-instance | ⚠️ Documented in scalability review |

### 5.2 No Hidden Regressions Found

- No API response shape changes
- No authentication flow changes
- No authorization logic changes
- No database schema changes (Phase 1)
- No WebSocket event changes
- No file path changes
- No URL changes

---

## 6. Regression Score

| Category | Score | Notes |
|----------|-------|-------|
| API compatibility | 100/100 | No changes |
| Frontend compatibility | 100/100 | No changes |
| Player compatibility | 100/100 | No changes |
| Migration safety | 100/100 | No Phase 1 migrations |
| Configuration safety | 95/100 | All new vars optional with defaults |
| Runtime behavior | 90/100 | Shutdown behavior changed (improvement) |
| Hidden regressions | 95/100 | No hidden regressions found |

**Regression Score: 97/100**

**No regressions detected. Phase 1 changes are transparent and backward-compatible.**
