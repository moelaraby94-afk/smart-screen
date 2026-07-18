# 17 — Performance Audit

> **Objective:** Evaluate performance: database query efficiency, caching strategy, connection pooling, pagination, N+1 queries, and resource utilization.

---

## 1. Current State

The backend has basic performance infrastructure: a metrics middleware for HTTP request timing, pagination on most list endpoints, and Prisma's built-in connection pooling. However, there is no caching layer, no query optimization analysis, and several potential N+1 query patterns.

---

## 2. What Exists

### Metrics
- `MetricsMiddleware` — Records HTTP method, normalized route, status code, and duration for every request
- `MetricsService` — Prometheus-style metrics with histograms for request duration
- Route normalization: UUIDs and numeric IDs replaced with `:id` to prevent cardinality explosion
- No `/metrics` endpoint exposed (metrics stored in memory, not scraped)

### Pagination
- `PaginationQueryDto` — `page` + `pageSize` (max 100)
- `buildPage()` — Returns `{ items, total, page, pageSize, totalPages }`
- Used by: Screens, Playlists, Media, Schedules, Campaigns, Admin users, Admin customers
- **Not used by:** Notifications, Admin logs, Admin settings, Account insights

### Database
- **Prisma with adapter-pg:** Uses `@prisma/adapter-pg` driver adapter
- **Connection pooling:** Relies on Prisma default pool (no explicit `connection_limit` or `pool_timeout`)
- **Indexes:** Defined on key fields (see database audit for full list)
- **No query logging:** No slow query logging or query analysis in production

### Static Assets
- Express serves `uploads/` directory via `useStaticAssets()`
- No caching headers set on static assets
- No gzip/brotli compression on static assets

---

## 3. What Is Missing

1. **No caching layer** — No Redis, no in-memory cache. Every request hits the database. `AccountContextHelper.resolveForWorkspace()` runs 2-3 DB queries per request for authorization.

2. **No query optimization** — No analysis of N+1 queries. Several services likely have N+1 patterns:
   - `PlayerService.getBootstrap()` loads playlist + items + media + canvases (potentially separate queries)
   - `WorkspacesService.listMembers()` loads members + user profiles
   - `AdminService.listCustomers()` loads workspaces + subscriptions + owners

3. **No HTTP response compression** — No `compression` middleware. Large JSON responses (playlist with 100 items) are sent uncompressed.

4. **No static asset caching headers** — `Cache-Control`, `ETag`, `Last-Modified` not set on `/media-files/` routes. Clients re-download media on every request.

5. **No database connection pool tuning** — Default pool size may be too small for high concurrency or too large for limited DB connections.

6. **No slow query logging** — No threshold-based query logging. Slow queries go undetected.

7. **No metrics endpoint** — `MetricsService` collects data but no `/metrics` endpoint for Prometheus scraping.

8. **No health check dependencies** — `/ready` only checks Prisma `$connect()`. No Redis, S3, or email provider health checks.

9. **No request body size optimization** — No payload size limits per endpoint. Large payloads consume memory.

10. **No WebSocket connection metrics** — `getConnectedSocketCount()` exists but not exposed. No monitoring of WS connections.

11. **No graceful shutdown** — No SIGTERM handling. In-flight requests are dropped on restart.

12. **No Prisma query extension** — No soft delete, no tenant scoping at Prisma level. Each service manually adds `where: { workspaceId }`.

---

## 4. Problems

1. **Authorization queries on every request** — `RolesGuard` + `AccountContextHelper` execute 2-3 DB queries per authenticated request. At 1000 req/s, that's 2000-3000 DB queries just for authorization.

2. **`memoryStorage()` for uploads** — Entire 150MB file buffered in RAM. 10 concurrent uploads = 1.5GB RAM usage.

3. **No `select` on several queries** — Some Prisma queries use `include` or return full models when only a few fields are needed. Over-fetching data.

4. **Overlap detection is O(n²)** — `SchedulingService` overlap check compares each schedule against all others. No spatial index or time bucket optimization.

5. **No batch loading** — When listing screens with their playlists, each screen's playlist is loaded individually (N+1). Should use `include` or batch loading.

6. **Admin list endpoints load full relations** — `GET /admin/customers` loads workspace + subscription + owner + screen count. Multiple joins per row.

7. **No query result caching** — `getPrayerTimes()`, `getRamadanStatus()`, and other rarely-changing data hit the DB on every call.

---

## 5. Risks

- **High: No caching** — DB will be bottleneck under load. Authorization queries multiply with request count.
- **High: memoryStorage for uploads** — OOM under concurrent upload load.
- **Medium: N+1 queries** — Performance degradation with large datasets.
- **Medium: No compression** — Bandwidth waste on large responses.
- **Medium: No graceful shutdown** — Request loss during deployments.
- **Low: No metrics endpoint** — Can't monitor performance in production.

---

## 6. Priority: **Medium**

Performance is adequate for current scale but will degrade significantly under load. Caching is the most impactful addition.

---

## 7. Completion Percentage: **65%**

Basic metrics and pagination exist. Missing: caching, compression, query optimization, connection pool tuning, metrics endpoint, graceful shutdown.

---

## 8. Recommendations

1. Add Redis caching layer:
   - Cache `AccountContextHelper.resolveForWorkspace()` result with 5-min TTL
   - Cache `PrayerTimesService.getPrayerTimes()` with 1-hour TTL
   - Cache `RamadanService` config with 1-hour TTL
   - Cache `FeatureFlagsService` results with 10-min TTL
   - Invalidate on role change, config update, flag toggle
2. Add `compression` middleware for HTTP responses
3. Set caching headers on static assets: `Cache-Control: public, max-age=31536000, immutable`
4. Add `/metrics` endpoint for Prometheus scraping
5. Add Prisma query logging in development: `log: ['query', 'info', 'warn']`
6. Add slow query alerting: log queries > 500ms in production
7. Tune connection pool: `connection_limit=10`, `pool_timeout=30` in `DATABASE_URL`
8. Switch from `memoryStorage()` to `diskStorage()` for uploads
9. Add N+1 query audit: use `include` or `select` in list endpoints to batch-load relations
10. Add graceful shutdown: `app.enableShutdownHooks()` + SIGTERM handler with 30s drain
11. Add WebSocket connection metrics to `/metrics` endpoint
12. Add request body size limit: `app.use(json({ limit: '10mb' }))`

---

## 9. Future Tasks

- [ ] Add Redis caching layer
- [ ] Add HTTP response compression
- [ ] Set static asset caching headers
- [ ] Add /metrics endpoint for Prometheus
- [ ] Add Prisma query logging in dev
- [ ] Add slow query alerting in production
- [ ] Tune database connection pool
- [ ] Switch to diskStorage for uploads
- [ ] Audit and fix N+1 queries
- [ ] Add graceful shutdown
- [ ] Add WebSocket metrics
- [ ] Add request body size limit
