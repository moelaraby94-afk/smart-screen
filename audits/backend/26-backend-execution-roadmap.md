# 26 — Backend Execution Roadmap

> **Objective:** A complete, phased execution plan to bring the Smart Screen backend to production readiness. Each phase has a clear goal, affected files, required changes, dependencies, risks, verification method, and Definition of Done.

> **Philosophy:** No rebuild. The existing NestJS modular monolith architecture is sound. Changes are additive and targeted. Every major change is justified with rationale, benefit, risk, and alternatives.

---

## Dependency Map (Execution Order)

```
Phase 1: Foundation & Infrastructure
  ├── Redis setup ──────────────────┐
  ├── S3/MinIO storage ─────────────┤
  ├── Graceful shutdown ────────────┤
  ├── Health checks ────────────────┤
  └── DB pool tuning ───────────────┘
         │
         ▼
Phase 2: Security Hardening
  ├── Password complexity ──────────┐
  ├── 2FA encryption ───────────────┤
  ├── DevLogin removal ─────────────┤
  ├── Shared secret removal ────────┤
  ├── JWT rotation ─────────────────┤
  └── Dependency scanning ──────────┘
         │
         ▼
Phase 3: Database Optimization
  ├── Recurrence enum migration ────┐
  ├── Connection pool config ───────┤
  ├── Deprecated model cleanup ─────┤
  ├── Index optimization ───────────┤
  └── Transaction safety ───────────┘
         │
         ▼
Phase 4: Core Business Logic
  ├── Seat limit enforcement ───────┐
  ├── Workspace pause enforcement ──┤
  ├── Email notification flows ─────┤  (requires Redis from Phase 1 for queue)
  ├── Notification pagination ──────┤
  └── Real-time notification push ──┘  (requires Redis from Phase 1 for WS)
         │
         ▼
Phase 5: Realtime & Player Communication
  ├── WebSocket event validation ───┐
  ├── WebSocket rate limiting ──────┤  (requires Redis from Phase 1)
  ├── Offline event queue ──────────┤  (requires Redis from Phase 1)
  ├── Campaign-to-screen push ──────┤
  └── Player version tracking ──────┘
         │
         ▼
Phase 6: Storage & Media System
  ├── S3 storage adapter ───────────┘  (requires S3 from Phase 1)
  ├── Signed URL generation ────────┐
  ├── File hash / integrity ────────┤
  ├── EXIF stripping ───────────────┤
  └── Media expiry purge cron ──────┘
         │
         ▼
Phase 7: Billing & Integrations
  ├── Dunning management ───────────┐
  ├── PaymentRecord creation ───────┤
  ├── Invoice handling ─────────────┤
  ├── API key enforcement ───────────┤
  └── Webhook retry policy ─────────┘
         │
         ▼
Phase 8: Testing & Quality
  ├── Module specs (8 missing) ─────┐
  ├── Integration tests ────────────┤  (requires DB from Phase 3)
  ├── E2E test suite ───────────────┤
  ├── Test data factories ──────────┤
  ├── Coverage threshold raise ─────┤
  └── CI test pipeline ─────────────┘
         │
         ▼
Phase 9: Performance & Scaling
  ├── Redis cache-aside ────────────┘  (requires Redis from Phase 1)
  ├── N+1 query audit ──────────────┐
  ├── Static asset Cache-Control ───┤
  ├── API serialization layer ──────┤
  ├── OpenAPI/Swagger docs ─────────┤
  └── Load testing ─────────────────┘
         │
         ▼
Phase 10: Production Readiness
  ├── Docker multi-stage build ─────┐
  ├── Zero-downtime deploy strategy ┤
  ├── Backup automation ────────────┤
  ├── CDN for media ────────────────┤
  ├── TLS cert automation ──────────┤
  ├── Admin session timeout ────────┤
  ├── IP allowlist for admin ───────┤
  └── Final penetration test ───────┘
         │
         ▼
Phase 11: Platform Separation & Enterprise Architecture
  ├── Route prefix centralization ──┐
  ├── Auth route separation ────────┤
  ├── Admin controller split ───────┤
  ├── Player API formalization ─────┤
  ├── Module boundary enforcement ──┤
  ├── Large service decomposition ──┤
  └── Circular dependency removal ──┘
```

---

## Priority Matrix

### P0 — Blocks Production (5 gaps)

| # | Gap | Phase | Effort |
|---|-----|-------|--------|
| 1 | No Redis | Phase 1 | Medium |
| 2 | No S3/MinIO | Phase 1 | Medium |
| 3 | No graceful shutdown | Phase 1 | Small |
| 4 | No health checks for dependencies | Phase 1 | Small |
| 5 | No DB connection pool tuning | Phase 1 | Small |

### P1 — Required Before Launch (16 gaps)

| # | Gap | Phase | Effort |
|---|-----|-------|--------|
| 6 | API key enforcement | Phase 7 | Medium |
| 7 | OpenAPI/Swagger | Phase 9 | Small |
| 8 | Integration tests | Phase 8 | Large |
| 9 | E2E tests | Phase 8 | Large |
| 10 | 8 modules with zero specs | Phase 8 | Large |
| 11 | Password complexity | Phase 2 | Small |
| 12 | Shared secret removal | Phase 2 | Medium |
| 13 | AuthService decomposition | Phase 9 | Medium |
| 14 | Serialization layer | Phase 9 | Medium |
| 15 | Email notification flows | Phase 4 | Large |
| 16 | Timezone support | Phase 4 | Medium |
| 17 | Dunning management | Phase 7 | Medium |
| 18 | Seat limit enforcement | Phase 4 | Small |
| 19 | 2FA secrets encryption | Phase 2 | Small |
| 20 | Dependency vulnerability scanning | Phase 2 | Small |
| 21 | JWT rotation on role change | Phase 2 | Small |

### P2 — Important Improvement (28 gaps)

Distributed across Phases 3-10. See phase details below.

### P3 — Future Improvement (14 gaps)

Distributed across Phases 9-10 and post-Phase 10. See phase details below.

---

## Phase 1: Foundation & Infrastructure

### Goal
Install and configure Redis, S3-compatible storage, graceful shutdown, dependency health checks, and database connection pool tuning. After this phase, the backend can run in a containerized, multi-instance environment.

### Gaps Addressed
P0-1, P0-2, P0-3, P0-4, P0-5

### Affected Files
- `apps/backend/package.json` — Add: `ioredis`, `@socket.io/redis-adapter`, `@aws-sdk/client-s3`, `@nestjs/terminus`
- `apps/backend/src/main.ts` — Add `app.enableShutdownHooks()`, SIGTERM handler, remove static asset serving
- `apps/backend/src/app.module.ts` — Register Redis module, throttler Redis storage
- `apps/backend/src/common/redis/` — NEW: `redis.module.ts`, `redis.service.ts`
- `apps/backend/src/common/storage/` — NEW: `storage.module.ts`, `storage.interface.ts`, `s3.service.ts`, `local.service.ts`
- `apps/backend/src/common/throttler/` — Modify: Use Redis storage for throttler
- `apps/backend/src/domains/realtime/realtime.gateway.ts` — Modify: Add Redis adapter
- `apps/backend/src/common/health/health.controller.ts` — Modify: Add Redis, S3 health checks
- `apps/backend/src/common/prisma/prisma.service.ts` — Modify: Add explicit pool config
- `apps/backend/src/domains/media/media.service.ts` — Modify: Use storage abstraction
- `docker-compose.yml` — Add: Redis service, MinIO service
- `.env.example` — Add: `REDIS_URL`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`, `MEDIA_STORAGE_PROVIDER`, `DATABASE_CONNECTION_LIMIT`, `DATABASE_POOL_TIMEOUT`

### Required Changes

#### 1.1 Redis Integration
- Install `ioredis` and `@socket.io/redis-adapter`
- Create `RedisModule` with `RedisService` wrapping `ioredis`
- Replace in-memory throttler with `@nest-labs/throttler-storage-redis` or custom Redis storage
- Configure `@socket.io/redis-adapter` in `RealtimeGateway`
- Add Redis to `docker-compose.yml`

**Justification:** NestJS docs state "Running more than one backend instance needs a shared store." Socket.IO docs state the Redis adapter "allows broadcasting packets between multiple Socket.IO servers."

#### 1.2 S3/MinIO Storage
- Install `@aws-sdk/client-s3`
- Create `StorageInterface` with `upload()`, `delete()`, `getSignedUrl()`, `getPublicUrl()`
- Implement `S3StorageService` and `LocalStorageService`
- Configure via `MEDIA_STORAGE_PROVIDER` env var (local | s3 | minio)
- Modify `MediaService` to use storage abstraction
- Remove `app.useStaticAssets()` from `main.ts` (S3 serves files directly)
- Add MinIO to `docker-compose.yml`

**Justification:** Docker docs confirm containerized deployments have ephemeral filesystems. Local storage is not suitable for containers.

**Alternative considered:** NFS mount for persistent local storage. Rejected because it doesn't provide CDN integration, lifecycle policies, or multi-region replication.

#### 1.3 Graceful Shutdown
- Add `app.enableShutdownHooks()` in `main.ts`
- Add explicit SIGTERM handler:
  1. Mark readiness probe as failing
  2. Stop accepting new HTTP connections (`server.close()`)
  3. Close idle keep-alive connections (`server.closeIdleConnections()`)
  4. Wait for in-flight requests (max 25s)
  5. Close WebSocket server (`io.close()`)
  6. Close Redis connections
  7. Close Prisma connection (`prisma.$disconnect()`)
  8. `process.exit(0)`
- Add force-exit timeout (25s, before K8s SIGKILL at 30s)

**Justification:** Express.js official docs: "The process should stop accepting new requests, finish all ongoing requests, clean up resources, then exit." Node.js docs: SIGTERM handler prevents immediate process termination.

#### 1.4 Health Check Dependencies
- Install `@nestjs/terminus`
- Add Redis ping health check
- Add S3 head bucket health check
- Update `/ready` endpoint to include all dependency checks
- Return 200 if all pass, 503 if any fail

**Justification:** NestJS docs recommend `@nestjs/terminus` for health checks including "database connections, external services, and custom checks."

#### 1.5 DB Connection Pool Tuning
- Configure `PrismaPg` adapter with explicit `max`, `connectionTimeoutMillis`, `idleTimeoutMillis`
- Add env vars: `DATABASE_CONNECTION_LIMIT` (default 10), `DATABASE_POOL_TIMEOUT` (default 30000)

**Justification:** Prisma docs: "Configure pool size and timeouts for your driver adapter." Defaults may not match expected concurrency.

### Dependencies
- None. This is the first phase.

### Risks
- **Medium:** Redis/S3 integration introduces new failure modes. Mitigation: health checks + fallback to local storage if S3 unavailable.
- **Low:** Graceful shutdown timeout must be < K8s `terminationGracePeriodSeconds` (30s). Mitigation: 25s force-exit.
- **Low:** Prisma pool size too small for high concurrency. Mitigation: configurable via env var.

### Verification
- `docker compose up` starts Redis, MinIO, PostgreSQL, backend
- `GET /ready` returns 200 with Redis + S3 + Prisma checks
- `SIGTERM` to backend container → graceful exit within 25s, no dropped requests
- Media upload writes to S3 (verify with MinIO console)
- Rate limiting works across multiple backend instances

### Definition of Done
- [ ] Redis module created and registered
- [ ] Throttler uses Redis storage
- [ ] WebSocket gateway uses Redis adapter
- [ ] S3/MinIO storage adapter created
- [ ] `MEDIA_STORAGE_PROVIDER` env var switches between local/s3
- [ ] Media upload writes to configured storage
- [ ] `app.useStaticAssets()` removed from `main.ts`
- [ ] `app.enableShutdownHooks()` added
- [ ] SIGTERM handler with 25s timeout implemented
- [ ] Health checks include Redis + S3 + Prisma
- [ ] `@nestjs/terminus` installed and configured
- [ ] Prisma pool config explicit and configurable
- [ ] `docker-compose.yml` includes Redis + MinIO
- [ ] `.env.example` updated with all new env vars
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass
- [ ] Manual verification: SIGTERM, health check, media upload, rate limit across instances

---

## Phase 2: Security Hardening

### Goal
Close all security gaps identified in the OWASP Top 10 assessment. After this phase, the backend meets OWASP Top 10:2021 minimum requirements.

### Gaps Addressed
P1-11, P1-12, P1-19, P1-20, P1-21

### Affected Files
- `apps/backend/src/domains/auth/dto/` — Modify: Add password complexity validators to registration + password reset DTOs
- `apps/backend/src/domains/auth/two-factor.service.ts` — Modify: Encrypt TOTP secrets at rest with AES-256-GCM
- `apps/backend/src/domains/auth/dev-login.controller.ts` — DELETE
- `apps/backend/src/domains/auth/auth.module.ts` — Modify: Remove DevLoginController
- `apps/backend/src/domains/player/player.service.ts` — Modify: Remove shared secret fallback
- `apps/backend/src/domains/realtime/realtime.gateway.ts` — Modify: Remove shared secret fallback
- `apps/backend/src/domains/auth/auth.service.ts` — Modify: Delete all refresh tokens on role change
- `apps/backend/src/common/auth/roles.guard.ts` — Modify: Trigger refresh token deletion on role change
- `.github/workflows/ci.yml` — Modify: Add `npm audit --audit-level=high` step
- `apps/backend/prisma/migrations/` — NEW: Migration to encrypt existing 2FA secrets, migration to set per-screen secrets

### Required Changes

#### 2.1 Password Complexity
- Add `@MinLength(8)`, `@Matches(/[A-Z]/)`, `@Matches(/[a-z]/)`, `@Matches/[0-9]/)`, `@Matches/[^a-zA-Z0-9]/)` to password fields in registration and password reset DTOs
- Return clear validation error messages

**Justification:** OWASP Authentication Cheat Sheet: "Enforce minimum length (≥8), complexity (uppercase, lowercase, number, special character)."

#### 2.2 2FA Secret Encryption
- Encrypt TOTP secrets with AES-256-GCM using `ENCRYPTION_KEY` env var
- Create `CryptoService` with `encrypt()` and `decrypt()` methods
- Migration: encrypt all existing plaintext secrets
- Decrypt on verification, never store plaintext

**Justification:** OWASP Cryptographic Failures (A02): "Sensitive data must be encrypted at rest."

**Alternative considered:** Store secrets in a separate secrets manager (HashiCorp Vault). Rejected as over-engineering for current scale. AES-256-GCM with env var key is sufficient.

#### 2.3 DevLoginController Removal
- Delete `dev-login.controller.ts`
- Remove from `auth.module.ts`
- Remove `ENABLE_DEV_LOGIN` env var from `.env.example`

**Justification:** Dev-only code in production codebase is a security risk. NestJS docs don't recommend dev login controllers.

**Alternative considered:** Keep with stronger environment guard. Rejected because the risk of misconfiguration outweighs the convenience.

#### 2.4 Shared Secret Removal
- Remove `PLAYER_HEARTBEAT_SECRET` fallback in `player.service.ts` and `realtime.gateway.ts`
- Create migration: generate per-screen `pairingSecretHash` for all screens without one
- All screens must authenticate with per-screen secret
- Remove `PLAYER_HEARTBEAT_SECRET` from required secrets list in `assertProductionSecretsAreSet()`

**Justification:** Shared secret fallback is a legacy auth method. Per-screen secrets with bcrypt hash are the secure approach.

**Risk:** Existing paired screens using shared secret will fail heartbeat. Mitigation: migration generates per-screen secrets; screens must re-pair.

#### 2.5 JWT Rotation on Role Change
- When `AdminService.updateUser()` or `WorkspacesService.changeMemberRole()` changes a user's role, delete all refresh tokens for that user
- User's current access token remains valid until expiry (short-lived)
- User must re-authenticate to get new token with updated role

**Justification:** Stale JWT with old role is a security risk. OWASP Access Control: "Verify authorization in real-time."

#### 2.6 Dependency Vulnerability Scanning
- Add `npm audit --audit-level=high` step to CI pipeline
- Add Snyk or GitHub Dependabot configuration
- Fail CI on high-severity vulnerabilities

**Justification:** OWASP Vulnerable Components (A06): "Scan dependencies for known vulnerabilities."

### Dependencies
- None (can run in parallel with Phase 1)

### Risks
- **Medium:** 2FA secret encryption migration could corrupt existing secrets. Mitigation: test migration on staging, backup before migration.
- **Medium:** Shared secret removal requires screen re-pairing. Mitigation: provide migration script, communicate to users.
- **Low:** Password complexity may reject existing weak passwords. Mitigation: only enforce on new passwords, not existing.

### Verification
- Registration with weak password → 400 with validation error
- 2FA setup → secret stored encrypted in DB (verify with DB query)
- DevLogin endpoint → 404
- Screen with shared secret → heartbeat rejected
- Role change → all refresh tokens deleted for that user
- CI pipeline → `npm audit` step runs and fails on high-severity

### Definition of Done
- [ ] Password complexity validators on all password DTOs
- [ ] `CryptoService` with AES-256-GCM encrypt/decrypt
- [ ] All 2FA secrets encrypted at rest
- [ ] Migration for existing 2FA secrets
- [ ] `DevLoginController` deleted
- [ ] Shared secret fallback removed
- [ ] Migration for per-screen secrets
- [ ] JWT rotation on role change implemented
- [ ] `npm audit` in CI pipeline
- [ ] `ENCRYPTION_KEY` added to env vars
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 3: Database Optimization

### Goal
Clean up the database schema, convert string-typed fields to enums, remove deprecated models, and optimize indexes.

### Gaps Addressed
P2-25, P2-26, P2-29, and index optimization

### Affected Files
- `apps/backend/prisma/schema.prisma` — Modify: Convert `recurrence` to enum, remove `WorkspacePairingCode`, add indexes
- `apps/backend/prisma/migrations/` — NEW: Migration for enum conversion, model removal, index addition
- `apps/backend/src/domains/schedules/scheduling.service.ts` — Modify: Update recurrence type references
- `apps/backend/src/domains/screens/screens.service.ts` — Modify: Remove WorkspacePairingCode references
- `apps/backend/src/domains/billing/subscriptions.service.ts` — Modify: Create PaymentRecord in webhook handler

### Required Changes

#### 3.1 Recurrence Enum Migration
- Create `RecurrenceType` enum in Prisma schema: `WEEKLY`, `MONTHLY`, `ONCE`, `DAILY`
- Convert `Schedule.recurrence` from `String` to `RecurrenceType`
- Convert `ScreenOverrideRule.recurrence` from `String` to `RecurrenceType`
- Migration: convert existing string values to enum values
- Update all service code to use enum instead of string

**Justification:** Prisma docs: "Enums are type-safe and prevent invalid values." String fields allow arbitrary values.

#### 3.2 Deprecated Model Removal
- Remove `WorkspacePairingCode` model from schema
- Migration: drop table if exists
- Remove all references in code

**Justification:** Unused model adds confusion and schema bloat.

#### 3.3 PaymentRecord Implementation
- Create `PaymentRecord` entries from `invoice.payment_succeeded` webhook events
- Fields: `workspaceId`, `stripeInvoiceId`, `amount`, `currency`, `status`, `createdAt`

**Justification:** Model exists but is unused. Either implement or remove. Implementation provides audit trail for billing.

#### 3.4 Index Optimization
- Add index on `Schedule(screenId, startTime, endTime)` for overlap query optimization
- Add index on `Notification(userId, type, createdAt)` for category filtering
- Add index on `AuditLog(workspaceId, createdAt)` for workspace audit queries
- Review existing indexes for unused ones

**Justification:** PostgreSQL docs: "Indexes improve query performance but add write overhead. Index only columns used in WHERE clauses."

### Dependencies
- None (can run in parallel with Phase 2)

### Risks
- **Medium:** Enum migration on existing data could fail if string values don't match enum values. Mitigation: data audit before migration.
- **Low:** Dropping `WorkspacePairingCode` table — verify no data exists.

### Verification
- `prisma migrate deploy` succeeds
- All schedule operations work with enum recurrence
- `PaymentRecord` entries created on Stripe invoice webhook
- Query performance: overlap detection query uses index (EXPLAIN ANALYZE)

### Definition of Done
- [ ] `RecurrenceType` enum created in schema
- [ ] `Schedule.recurrence` and `ScreenOverrideRule.recurrence` converted to enum
- [ ] Migration for string → enum conversion
- [ ] `WorkspacePairingCode` model removed
- [ ] Migration for table drop
- [ ] `PaymentRecord` creation in webhook handler
- [ ] New indexes added
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 4: Core Business Logic

### Goal
Implement missing business logic: email notifications, timezone-aware scheduling, seat limit enforcement, workspace pause enforcement, notification pagination, and real-time notification delivery.

### Gaps Addressed
P1-15, P1-16, P1-18, P2-34, P2-35, P2-36, P2-37

### Affected Files
- `apps/backend/src/domains/email/` — Modify: Add 10+ email templates and flows
- `apps/backend/src/domains/notifications/notifications.controller.ts` — Modify: Add pagination
- `apps/backend/src/domains/notifications/notifications.service.ts` — Modify: Add real-time push via Socket.IO
- `apps/backend/src/domains/realtime/realtime.gateway.ts` — Modify: Add `notification:new` event
- `apps/backend/src/domains/workspaces/workspaces.service.ts` — Modify: Seat limit enforcement, pause enforcement
- `apps/backend/src/domains/schedules/scheduling.service.ts` — Modify: Timezone-aware scheduling
- `apps/backend/prisma/schema.prisma` — Modify: Add `timezone` field to Workspace
- `apps/backend/package.json` — Add: `@nestjs/bullmq`, `bullmq` (for email queue)

### Required Changes

#### 4.1 Email Notification Flows
- Install `@nestjs/bullmq` and `bullmq`
- Create `email-queue` processor with retry logic (3 retries, exponential backoff)
- Implement email flows for:
  1. Screen offline (5-min debounce)
  2. Team invite (with accept/reject links)
  3. Campaign approval/rejection
  4. Subscription expiry (7 days before)
  5. Password changed
  6. 2FA disabled
  7. Storage/screen limit warning (at 80%)
- All emails sent via queue, not synchronously

**Justification:** NestJS docs: "Queues help maintain performance by smoothing out processing peaks." Synchronous email sending degrades API response time.

**Dependencies:** Requires Redis from Phase 1 for BullMQ.

#### 4.2 Timezone-Aware Scheduling
- Add `timezone` field to `Workspace` model (default: "Asia/Dubai")
- Convert `startTime`/`endTime` interpretation from server-local to workspace timezone
- Use `date-fns-tz` (already installed) for timezone conversion
- Store times as-is, interpret in workspace TZ when resolving active content
- Add DST handling via `date-fns-tz`

**Justification:** Without timezone support, schedules display at wrong times for users in different timezones than the server.

**Dependencies:** None. `date-fns-tz` is already in `package.json`.

#### 4.3 Seat Limit Enforcement
- In `WorkspacesService.inviteMember()` and `acceptInvite()`, check `Subscription.seats` against current member count + pending invites
- Return `DomainException` with `ErrorCode.SEAT_LIMIT_EXCEEDED` if exceeded

**Justification:** Plan limits are not enforced for team members. A FREE plan (5 seats) can have unlimited members.

#### 4.4 Workspace Pause Enforcement
- Check `workspace.paused` flag in all mutation endpoints
- Return `DomainException` with `ErrorCode.WORKSPACE_PAUSED` if paused
- Allow read operations when paused

**Justification:** Admin can pause a workspace but mutations are not blocked.

#### 4.5 Notification Pagination + Real-Time Push
- Add `PaginationQueryDto` to `GET /notifications`
- On notification creation, emit `notification:new` event to `user:{userId}` room via Socket.IO
- Dashboard receives real-time notification badge update

**Justification:** Unbounded notification list causes performance issues. Real-time delivery improves UX.

**Dependencies:** Requires Redis from Phase 1 for Socket.IO cross-instance delivery.

### Dependencies
- **Phase 1** (Redis for email queue and real-time notification push)

### Risks
- **Medium:** Email queue introduces new failure mode (Redis down = emails not sent). Mitigation: health check + alerting.
- **Medium:** Timezone migration could shift existing schedules. Mitigation: default to current server timezone for existing workspaces.
- **Low:** Seat limit enforcement may block existing over-limit workspaces. Mitigation: warning-only mode first, enforce after grace period.

### Verification
- Email sent on screen offline → verify in email provider logs
- Schedule with timezone → content displays at correct time
- Invite beyond seat limit → 403 with `SEAT_LIMIT_EXCEEDED`
- Mutation on paused workspace → 403 with `WORKSPACE_PAUSED`
- `GET /notifications?page=1&pageSize=10` → paginated response
- Notification created → `notification:new` event received on dashboard

### Definition of Done
- [ ] `@nestjs/bullmq` installed and configured
- [ ] Email queue processor with retry logic
- [ ] 7 email notification flows implemented
- [ ] `timezone` field added to Workspace model
- [ ] Schedule times interpreted in workspace timezone
- [ ] DST handling via `date-fns-tz`
- [ ] Seat limit enforcement in invite + accept
- [ ] Workspace pause enforcement on all mutations
- [ ] Notification pagination
- [ ] Real-time notification push via Socket.IO
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 5: Realtime & Player Communication

### Goal
Harden the WebSocket layer with event validation, rate limiting, offline event queue, and campaign-to-screen push. Add player version tracking.

### Gaps Addressed
P2-30, P2-31, P2-32, P2-36, P2-39 (player version tracking)

### Affected Files
- `apps/backend/src/domains/realtime/realtime.gateway.ts` — Modify: Event validation, rate limiting, offline queue
- `apps/backend/src/domains/player/player.service.ts` — Modify: Player version tracking
- `apps/backend/prisma/schema.prisma` — Modify: Add `playerVersion` to Screen model
- `apps/backend/src/domains/campaigns/campaigns.service.ts` — Modify: Push to screens on publish

### Required Changes

#### 5.1 WebSocket Event Validation
- Add `ValidationPipe` to WebSocket `@MessageBody()` payloads
- Create DTOs for all WebSocket events (`ScreenRegisterPayload`, `ScreenHeartbeatPayload`, etc.)
- Reject invalid payloads with error event

**Justification:** NestJS docs: "WebSocket `@MessageBody()` payloads should be validated like HTTP request bodies."

#### 5.2 WebSocket Rate Limiting
- Implement per-connection rate limiting for WebSocket events
- Use Redis-backed token bucket (requires Redis from Phase 1)
- Limits: heartbeat 1/10s, register 1/min, content sync 1/30s

**Justification:** Without rate limiting, a malicious client can flood the WebSocket server.

#### 5.3 Offline Event Queue
- When a screen is offline, queue events in Redis (requires Redis from Phase 1)
- On screen reconnect, drain queue and deliver missed events
- Events: `content:sync`, `screen:command`, `campaign:push`
- Max queue size: 100 events, TTL: 24h

**Justification:** Screens that go offline miss content updates. Queue ensures eventual delivery.

#### 5.4 Campaign-to-Screen Push
- On campaign publish, emit `campaign:push` event to all affected screens
- Screens receive new content immediately without waiting for next sync

**Justification:** Currently, campaign publish doesn't push to screens. Screens discover new content on next bootstrap/sync.

#### 5.5 Player Version Tracking
- Add `playerVersion` field to `Screen` model
- Track player version in heartbeat payload
- Expose in admin fleet monitoring

**Justification:** Without version tracking, can't identify screens running outdated player software.

### Dependencies
- **Phase 1** (Redis for WebSocket rate limiting and offline event queue)

### Risks
- **Medium:** Offline event queue could grow unbounded if screen is offline for long. Mitigation: max 100 events, 24h TTL.
- **Low:** WebSocket event validation could break existing clients with unexpected payloads. Mitigation: backward-compatible DTOs with optional fields.

### Verification
- Invalid WebSocket payload → error event returned
- Rapid heartbeat (100/10s) → rate limited
- Screen offline → events queued → screen online → events delivered
- Campaign publish → affected screens receive `campaign:push` immediately
- Heartbeat with `playerVersion` → stored in DB → visible in admin fleet

### Definition of Done
- [ ] WebSocket event DTOs created
- [ ] ValidationPipe applied to WebSocket events
- [ ] Per-connection rate limiting with Redis
- [ ] Offline event queue with Redis
- [ ] Campaign-to-screen push on publish
- [ ] `playerVersion` field on Screen model
- [ ] Player version tracked in heartbeat
- [ ] Player version visible in admin fleet
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 6: Storage & Media System

### Goal
Complete the media system with S3 integration (from Phase 1), signed URLs, file integrity checks, EXIF stripping, and media expiry purge.

### Gaps Addressed
P2-39, P2-40, P2-41, P2-42

### Affected Files
- `apps/backend/src/domains/media/media.service.ts` — Modify: Signed URLs, file hash, EXIF stripping
- `apps/backend/src/common/storage/s3.service.ts` — Modify: Signed URL generation (from Phase 1)
- `apps/backend/src/domains/maintenance/maintenance.service.ts` — Modify: Media expiry purge cron
- `apps/backend/package.json` — Add: `sharp` (for EXIF stripping)

### Required Changes

#### 6.1 Signed URL Generation
- Generate signed URLs for media access (1-hour expiry)
- `GET /media/:id/url` → returns signed URL
- Direct `/media-files/` access removed (from Phase 1 S3 migration)
- Public media access only via signed URL

**Justification:** OWASP: "Don't expose resources without authentication." Signed URLs provide time-limited access.

**Alternative considered:** Keep public access with unguessable URLs. Rejected because URLs can be shared.

#### 6.2 File Hash / Integrity Check
- Calculate SHA-256 hash on upload
- Store hash in `Media` model
- Verify hash on access (optional, for critical content)

**Justification:** File integrity ensures content hasn't been tampered with.

#### 6.3 EXIF Stripping
- Install `sharp` package
- On image upload, strip EXIF data (privacy: GPS coordinates, device info)
- Preserve only essential metadata (orientation)

**Justification:** OWASP: "Uploaded files may contain sensitive metadata." EXIF can leak GPS coordinates.

#### 6.4 Media Expiry Purge Cron
- Add cron job to `MaintenanceService`: daily at 4am UTC
- Delete media where `expiresAt < now()`
- Delete file from S3 and record from DB

**Justification:** Expired media consumes storage and quota without being usable.

### Dependencies
- **Phase 1** (S3 storage adapter for signed URLs and file operations)

### Risks
- **Medium:** Signed URLs break existing media access patterns. Mitigation: migration period with both public and signed access.
- **Low:** `sharp` native module could fail to install in some environments. Mitigation: Docker multi-stage build with build tools.
- **Low:** EXIF stripping could remove needed orientation data. Mitigation: preserve orientation tag.

### Verification
- `GET /media/:id/url` → returns signed URL with 1-hour expiry
- Image upload → EXIF data stripped (verify with `exiftool`)
- File hash stored in DB → matches SHA-256 of file
- Media with `expiresAt` in past → deleted by cron job

### Definition of Done
- [ ] Signed URL generation endpoint
- [ ] Direct media access removed
- [ ] SHA-256 hash on upload and stored in DB
- [ ] `sharp` installed and EXIF stripping on upload
- [ ] Media expiry purge cron job
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 7: Billing & Integrations

### Goal
Complete the billing system with dunning management, PaymentRecord creation, invoice handling, API key enforcement, and webhook retry policy.

### Gaps Addressed
P1-6, P1-17, P2-26 (PaymentRecord — if not done in Phase 3)

### Affected Files
- `apps/backend/src/domains/subscriptions/subscriptions.service.ts` — Modify: Dunning flow
- `apps/backend/src/domains/webhooks/webhooks.service.ts` — Modify: PaymentRecord creation, webhook retry
- `apps/backend/src/domains/api-keys/api-keys.service.ts` — Modify: API key guard
- `apps/backend/src/common/auth/api-key.guard.ts` — NEW: API key authentication guard
- `apps/backend/src/domains/stripe/stripe.service.ts` — Modify: Invoice handling

### Required Changes

#### 7.1 Dunning Management
- On `invoice.payment_failed`:
  1. Send email notification
  2. Start 7-day grace period (store `gracePeriodEndsAt` on Subscription)
  3. After grace period, downgrade to FREE plan
- Cron job: check subscriptions past grace period → downgrade

**Justification:** Failed payments currently go silent. Dunning recovers revenue and communicates with customers.

#### 7.2 PaymentRecord Creation
- On `invoice.payment_succeeded`: create `PaymentRecord` with workspaceId, amount, currency, stripeInvoiceId
- On `invoice.payment_failed`: create `PaymentRecord` with status `FAILED`

**Justification:** Provides billing audit trail. Model exists but is unused.

#### 7.3 API Key Enforcement
- Create `ApiKeyAuthGuard` that validates API keys against DB
- Apply to relevant routes (data export, webhook management, public API)
- Enforce scopes (read-only, read-write, admin)
- Rate limit API key requests separately from user requests

**Justification:** API keys are created but never validated. False sense of security.

#### 7.4 Webhook Retry Policy
- For customer webhooks (outgoing): 3 retries with exponential backoff (1m, 10m, 1h)
- Log delivery attempts in `WebhookDeliveryLog` model
- Dead letter queue for permanently failed deliveries

**Justification:** Failed webhook deliveries are currently silently lost.

### Dependencies
- **Phase 4** (email queue for dunning email notifications)

### Risks
- **Medium:** API key enforcement could break existing integrations. Mitigation: grace period with warning logs.
- **Low:** Dunning downgrade could surprise users. Mitigation: 3 email reminders before downgrade.

### Verification
- `invoice.payment_failed` → email sent, grace period started
- Grace period expires → subscription downgraded to FREE
- `invoice.payment_succeeded` → PaymentRecord created
- API key request with invalid key → 401
- API key request with valid key + wrong scope → 403
- Webhook delivery fails → retried 3 times with backoff

### Definition of Done
- [ ] Dunning flow with 7-day grace period
- [ ] Dunning email notifications (3 reminders)
- [ ] Cron job for grace period expiry
- [ ] PaymentRecord creation on invoice webhooks
- [ ] `ApiKeyAuthGuard` created and applied
- [ ] API key scopes enforced
- [ ] Webhook retry policy (3 retries, exponential backoff)
- [ ] `WebhookDeliveryLog` model and logging
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 8: Testing & Quality

### Goal
Achieve 70% test coverage with integration tests, E2E tests, and spec files for all 22 modules.

### Gaps Addressed
P1-8, P1-9, P1-10, P3-53, P3-54, P3-55

### Affected Files
- `apps/backend/src/domains/admin/admin.controller.spec.ts` — NEW
- `apps/backend/src/domains/admin/admin.service.spec.ts` — NEW
- `apps/backend/src/domains/workspaces/workspaces.service.spec.ts` — NEW
- `apps/backend/src/domains/notifications/notifications.service.spec.ts` — NEW
- `apps/backend/src/domains/islamic/islamic.controller.spec.ts` — NEW
- `apps/backend/src/domains/islamic/prayer-times.service.spec.ts` — NEW
- `apps/backend/src/domains/api-keys/api-keys.service.spec.ts` — NEW
- `apps/backend/test/` — NEW: Integration tests, E2E tests, factories
- `apps/backend/package.json` — Modify: Raise coverage threshold to 70%
- `.github/workflows/ci.yml` — Modify: Add test step

### Required Changes

#### 8.1 Missing Module Specs (8 modules)
- Write spec files for: admin, workspaces, notifications, islamic, api-keys
- Each spec: test all public methods, error cases, edge cases
- Use existing test patterns (mocked PrismaService)

#### 8.2 Integration Tests
- Set up Testcontainers with PostgreSQL
- Test full CRUD cycles for: Auth, Screens, Playlists, Media, Schedules, Campaigns
- Test Prisma constraints and relations
- Test transactions

**Justification:** NestJS docs recommend E2E testing with Supertest. Integration tests validate Prisma queries against real DB.

#### 8.3 E2E Test Suite
- Auth flow: register → verify → login → refresh → logout
- Pairing flow: start → poll → claim → bootstrap
- Content flow: upload → playlist → assign → schedule → bootstrap
- Campaign workflow: create → submit → approve → publish → end
- Billing flow: mock plan → checkout → webhook → subscription sync

#### 8.4 Test Data Factories
- Create `test/factories/` with: `user.factory.ts`, `workspace.factory.ts`, `screen.factory.ts`, `playlist.factory.ts`, `media.factory.ts`
- Each factory: `build()` (returns object), `create()` (inserts into DB)

#### 8.5 Coverage Threshold Raise
- Raise `coverageThreshold` from 42% to 70% lines, 60% branches
- CI fails if coverage drops below threshold

#### 8.6 CI Test Pipeline
- Add test step to `.github/workflows/ci.yml`
- Run: `npm test`, `npm run test:cov`, `npm run test:e2e`
- Fail PR on test failure or coverage drop

### Dependencies
- **Phase 1-7** (test the features implemented in those phases)

### Risks
- **Medium:** Raising coverage threshold to 70% could fail initially. Mitigation: raise incrementally (50% → 60% → 70%).
- **Low:** Testcontainers requires Docker in CI. Mitigation: GitHub Actions supports Docker.

### Verification
- `npm test` → all specs pass
- `npm run test:cov` → coverage ≥ 70% lines
- `npm run test:e2e` → all E2E tests pass
- CI pipeline runs tests on every PR

### Definition of Done
- [ ] Spec files for all 8 missing modules
- [ ] Integration test suite with Testcontainers
- [ ] E2E test suite for all business flows
- [ ] Test data factories created
- [ ] Coverage threshold raised to 70% lines, 60% branches
- [ ] CI test pipeline configured
- [ ] All tests pass
- [ ] Coverage ≥ 70%

---

## Phase 9: Performance & Scaling

### Goal
Implement Redis cache-aside, fix N+1 queries, add API serialization layer, OpenAPI documentation, and static asset Cache-Control.

### Gaps Addressed
P1-7, P1-13, P1-14, P3-56, and performance improvements

### Affected Files
- `apps/backend/src/common/cache/` — NEW: `cache.module.ts`, `cache.service.ts` (Redis cache-aside)
- `apps/backend/src/common/auth/account-context.helper.ts` — Modify: Cache resolution result
- `apps/backend/src/domains/islamic/prayer-times.service.ts` — Modify: Cache prayer times
- `apps/backend/src/common/serialization/` — NEW: Response DTOs, serialization interceptor
- `apps/backend/src/app.module.ts` — Modify: Register Swagger module
- `apps/backend/package.json` — Add: `@nestjs/swagger`
- `apps/backend/src/main.ts` — Modify: Static asset Cache-Control headers (if still serving any)

### Required Changes

#### 9.1 Redis Cache-Aside
- Create `CacheService` with `get()`, `set()`, `del()` methods using `ioredis`
- Implement cache-aside pattern for:
  - `AccountContextHelper.resolveForWorkspace()` — 5-min TTL, invalidate on role change
  - `PrayerTimesService.getPrayerTimes()` — 1-hour TTL
  - `RamadanService` config — 1-hour TTL
  - `FeatureFlagsService` — 10-min TTL, invalidate on flag toggle

**Justification:** Redis docs: "Instead of querying the primary database on every request, the application checks Redis first." AccountContextHelper runs 2-3 DB queries per request.

**Dependencies:** Requires Redis from Phase 1.

#### 9.2 N+1 Query Audit
- Audit all list endpoints for N+1 patterns
- Use Prisma `include` or `select` to batch-load relations
- Key endpoints to audit: admin customers, screen list with playlists, workspace members

#### 9.3 API Serialization Layer
- Create response DTOs: `ScreenResponseDto`, `PlaylistResponseDto`, `WorkspaceResponseDto`, etc.
- Create `SerializationInterceptor` that transforms Prisma models to response DTOs
- Remove internal fields (`createdAt`, `updatedAt`) from responses where not needed

**Justification:** Prisma models returned directly expose internal fields and couple API contract to DB schema.

**Alternative considered:** Use `@nestjs/swagger` response types only. Rejected because it doesn't transform the actual response.

#### 9.4 OpenAPI/Swagger Documentation
- Install `@nestjs/swagger`
- Decorate all controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Add `@ApiProperty` to all DTOs
- Expose `/api/v1/docs` with Swagger UI
- Generate OpenAPI JSON spec

**Justification:** NestJS docs: "Auto-generated API documentation is essential for API consumers."

#### 9.5 Static Asset Cache-Control
- If any static assets remain on API (e.g., health endpoint assets), add `Cache-Control: public, max-age=31536000, immutable`
- For S3: configure bucket lifecycle policy for Cache-Control metadata

**Justification:** Without Cache-Control, clients re-download media on every request.

### Dependencies
- **Phase 1** (Redis for cache-aside)

### Risks
- **Medium:** Cache invalidation bugs could serve stale data. Mitigation: explicit invalidation on all mutation paths.
- **Medium:** Serialization layer changes API response shapes. Mitigation: feature flag for gradual rollout.
- **Low:** Swagger documentation adds maintenance burden. Mitigation: auto-generate from decorators.

### Verification
- Cached endpoint: first request hits DB, second request hits cache (verify with query logging)
- N+1 audit: no N+1 queries in list endpoints (verify with Prisma query log)
- API response: no `createdAt`/`updatedAt` in response (where excluded by DTO)
- `GET /api/v1/docs` → Swagger UI loads
- OpenAPI JSON spec → valid

### Definition of Done
- [ ] `CacheService` with Redis cache-aside
- [ ] Caching for AccountContextHelper, PrayerTimes, Ramadan, FeatureFlags
- [ ] Cache invalidation on mutations
- [ ] N+1 queries audited and fixed
- [ ] Response DTOs for all major entities
- [ ] `SerializationInterceptor` registered globally
- [ ] `@nestjs/swagger` installed and configured
- [ ] All controllers decorated with Swagger annotations
- [ ] Swagger UI accessible at `/api/v1/docs`
- [ ] Static asset Cache-Control headers
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 10: Production Readiness

### Goal
Final production hardening: Docker multi-stage build, zero-downtime deployment, backup automation, CDN, TLS, admin hardening, and penetration test.

### Gaps Addressed
P2-27, P2-44, P2-45, P2-46, P2-47, P3-57, P3-58, P3-59, P3-60

### Affected Files
- `Dockerfile.backend` — Modify: Multi-stage build (builder, deps, runner)
- `docker-compose.yml` — Modify: Production configuration
- `apps/backend/src/domains/admin/admin.controller.ts` — Modify: Admin session timeout, IP allowlist
- `apps/backend/src/common/middleware/admin-ip-allowlist.ts` — NEW: IP allowlist middleware
- `.github/workflows/ci.yml` — Modify: Build Docker image, run security scan
- `scripts/backup.sh` — Modify: Automated backup schedule

### Required Changes

#### 10.1 Docker Multi-Stage Build
- Three stages: `builder` (compile TypeScript), `deps` (production dependencies), `runner` (minimal runtime)
- Use `node:22-alpine` for runner
- Use `CMD ["node", "dist/src/main.js"]` directly (not npm/yarn)

**Justification:** Docker docs: "Use a separate stage for building and a minimal stage for running." Node.js Docker guide: "Use `CMD ['node', 'index.js']` directly."

#### 10.2 Zero-Downtime Deployment
- Pre-deploy migrations: run `prisma migrate deploy` as a separate step before app deployment
- Rolling updates: configure orchestrator (K8s/Docker Swarm) for rolling strategy
- Health check gating: new instance only receives traffic when `/ready` returns 200

**Justification:** Running migrations on boot causes downtime when schema changes are incompatible with old code.

#### 10.3 Backup Automation
- Schedule `pg_dump` daily (cron or K8s CronJob)
- Store backups in S3 with 30-day retention
- Weekly backup verification: restore to staging, run smoke tests

#### 10.4 CDN for Media
- Configure CloudFront/Cloudflare in front of S3
- Origin: S3 bucket
- Cache behavior: all media files, 1-year TTL
- Signed URL: CloudFront signed URLs or S3 signed URLs

#### 10.5 TLS Certificate Automation
- Let's Encrypt with certbot for non-cloud deployments
- AWS Certificate Manager for AWS deployments
- Auto-renewal: certbot cron or ACM auto-renew

#### 10.6 Admin Session Timeout
- Shorter JWT expiry for admin-only tokens (1 hour)
- Separate `ADMIN_JWT_EXPIRES_IN` env var
- Admin must re-authenticate after timeout

#### 10.7 IP Allowlist for Admin
- `ADMIN_ALLOWED_IPS` env var (comma-separated CIDR ranges)
- Middleware checks client IP against allowlist for `/admin/*` routes
- Returns 403 if IP not in allowlist

**Justification:** OWASP Access Control: "Restrict admin access to known IP ranges."

#### 10.8 Final Penetration Test
- Run OWASP ZAP automated scan
- Manual penetration test of auth, authorization, injection, SSRF
- Fix all P0 findings before production launch

### Dependencies
- **All previous phases** (this is the final phase)

### Risks
- **Medium:** Zero-downtime deployment requires careful migration strategy. Mitigation: expand-contract pattern (add column first, deploy, then remove old column).
- **Low:** CDN configuration varies by provider. Mitigation: document for specific provider.
- **Low:** IP allowlist could lock out admins. Mitigation: include fallback bypass with MFA.

### Verification
- Docker image size < 300MB (multi-stage)
- `docker build` → image builds successfully
- Deployment: zero downtime during rolling update (verify with continuous health check)
- Backup: `pg_dump` runs, backup in S3, restore works
- CDN: media served from CDN edge (verify with `X-Cache: Hit from cloudfront`)
- TLS: `https://` works, certificate valid
- Admin from non-allowlisted IP → 403
- Admin JWT expires after 1 hour
- OWASP ZAP scan: no P0 findings

### Definition of Done
- [ ] Docker multi-stage build (3 stages, < 300MB image)
- [ ] Zero-downtime deployment strategy documented and tested
- [ ] Pre-deploy migration step
- [ ] Backup automation with 30-day retention
- [ ] Weekly backup verification
- [ ] CDN configured for media
- [ ] TLS certificate automation
- [ ] Admin session timeout (1 hour)
- [ ] IP allowlist for admin endpoints
- [ ] OWASP ZAP scan passed (no P0)
- [ ] Manual penetration test completed
- [ ] All P0 findings fixed
- [ ] TypeScript compiles with 0 errors
- [ ] All tests pass
- [ ] Coverage ≥ 70%

---

## Phase 11: Platform Separation & Enterprise Architecture

### Goal
Separate Platform from Workspace APIs, formalize Player and Public API layers, centralize route management, improve module boundaries, and remove architectural coupling. After this phase, the backend supports clean separation for two dashboards (Platform Control + Customer) and future mobile/AI services.

### Gaps Addressed
P2-33 (WS event validation), P2-51 (circular dependency), P1-15 (AuthService decomposition), architectural debt from ad-hoc route prefixes.

### Tasks

#### 11.1 Route Prefix Centralization ✅
- Created `src/common/constants/route-prefixes.ts` with centralized constants for all API layers
- All 20 controllers migrated from ad-hoc string literals to centralized constants
- Five API layers formalized: `platform/`, `customer/`, `player/`, `internal/`, `public/`
- Backward compatibility maintained: all legacy paths still work alongside new prefixed paths

#### 11.2 Auth Route Separation ✅
- Split `AuthController` into customer-facing and platform-facing controllers
- `AuthController` → `customer/auth` + legacy `auth` (register, login, 2FA, password reset, profile, refresh, logout)
- `PlatformAuthController` → `platform/auth` + legacy `auth` (exit-impersonation, exchange)
- Removed unused imports (AuthImpersonationService, ExchangeTokenService) from AuthController
- Backward compatibility: all `auth/*` paths still work for both controllers via dual-path routing

#### 11.3 Admin Controller Split ✅
- Split 290-line `AdminController` into two focused controllers
- `PlatformManagementController`: user CRUD, staff CRUD, customer/workspace management, impersonation, exchange-token
- `PlatformOperationsController`: fleet/screens, stats, logs, settings, branding upload, subscription-mock
- Both share `platform/` + `admin/` dual-path routing (backward compatible)
- `admin.controller.ts` now re-exports both controllers for backward import compatibility
- Test spec split to cover both controllers independently

#### 11.4 Player API Formalization ✅
- Created `PlayerSecretGuard` — dedicated guard for kiosk player authentication
- Guard validates `x-player-secret` header against `Screen.pairingSecretHash` via Prisma
- Applied guard to kiosk endpoints: `bootstrap`, `canvas/:canvasId`, `prayer-pause-status`
- JWT endpoints (`workspace-bootstrap`, `prayer-pause-status/jwt`) remain under `JwtAuthGuard`
- Service-layer validation kept as defense-in-depth fallback
- Player auth is now a separate architectural concern, not embedded in service logic

#### 11.5 Module Boundary Enforcement ✅
- Updated ESLint `import/no-restricted-paths` rules to match actual directory structure
- Removed dead zone rules referencing non-existent `./domains/customer/**` and `./domains/platform/**` paths
- Enforced boundaries:
  - `common/` cannot import from `domains/` (shared modules stay shared)
  - `player/` cannot import from `admin/` (player layer independent of platform admin)
  - `player/` cannot import from `workspaces/` (use shared interfaces)
  - `admin/` cannot import from `player/` (platform admin independent of player)
- All rules pass with 0 violations on current codebase

#### 11.6 Large Service Decomposition ✅
- Audited all service files: largest was `playlists.service.ts` at 1,245 lines
- Extracted `PlaylistGroupsService` (140 lines): list/create/rename/delete/move group operations
- Extracted `PlaylistResolutionService` (280 lines): nested playlist resolution, circular reference detection, payload building, serialization
- `PlaylistsService` reduced from 1,245 → 790 lines (37% reduction), delegates to extracted services
- All public API preserved — controller and external consumers unchanged
- Test specs updated to construct new dependencies
- TypeScript: 0 errors, Tests: 62 suites, 592 tests, all passing

#### 11.7 Circular Dependency Removal ✅
- Auth ↔ Workspaces circular dependency already resolved in prior phases
- `WorkspaceResolverService` extracted to `common/auth/` — provides workspace list for auth without importing WorkspacesModule
- `WorkspaceProvisioningService` extracted to `common/auth/` — provides workspace creation for registration without importing WorkspacesModule
- Both registered in global `WorkspaceAuthModule` (`@Global()`)
- `AuthModule` does not import `WorkspacesModule` — zero production cross-imports
- `WorkspacesModule` does not import `AuthModule` — only test spec references `JwtStrategy`
- Verified: no `from '../workspaces/'` in `domains/auth/`, no `from '../auth/'` in `domains/workspaces/` production code

### Affected Files
- `apps/backend/src/common/constants/route-prefixes.ts` — NEW
- All 20 controller files — Modified imports + `@Controller` decorators
- `apps/backend/src/main.ts` — No changes needed (raw body paths already correct)

### Dependencies
- All previous phases (building on existing architecture)

### Verification
- TypeScript: 0 errors
- Tests: 62 suites, 592 tests, all passing
- All legacy API paths still respond (backward compatibility)
- New `customer/`, `platform/`, `player/`, `internal/`, `public/` prefixes all functional

### Definition of Done
- [x] Route prefix constants file created
- [x] All controllers use centralized route constants
- [x] Five API layers formalized (platform, customer, player, internal, public)
- [x] Backward compatibility maintained
- [x] TypeScript compiles with 0 errors
- [x] All existing tests pass
- [x] Auth route separation (Task 11.2)
- [x] Admin controller split (Task 11.3)
- [x] Player API formalization (Task 11.4)
- [x] Module boundary enforcement (Task 11.5)
- [x] Large service decomposition (Task 11.6)
- [x] Circular dependency removal (Task 11.7)

---

## Production Readiness Checklist

### Security
- [x] Helmet security headers
- [x] CORS allow-list
- [x] CSRF protection
- [x] Rate limiting (per-endpoint)
- [x] Input validation (global ValidationPipe)
- [x] File content type detection (file-type)
- [x] Error normalization (no stack trace leakage)
- [x] PII scrubbing for Sentry
- [x] SSRF protection for webhooks
- [x] Brute-force lockout
- [x] OTP throttling
- [x] 2FA with TOTP + backup codes
- [x] JWT with typ claim
- [x] Per-session refresh tokens
- [x] Production secret validation
- [ ] Password complexity (Phase 2)
- [ ] 2FA secrets encrypted (Phase 2)
- [ ] DevLogin removed (Phase 2)
- [ ] Shared secret removed (Phase 2)
- [ ] JWT rotation on role change (Phase 2)
- [ ] Dependency vulnerability scanning (Phase 2)
- [ ] Admin session timeout (Phase 10)
- [ ] Admin IP allowlist (Phase 10)
- [ ] Signed URL for media (Phase 6)

### Database
- [x] Single global PrismaClient
- [x] `prisma migrate deploy` in production
- [x] Prisma adapter-pg
- [x] Cascade deletes configured
- [x] Indexes on key fields
- [ ] Connection pool tuning (Phase 1)
- [ ] Recurrence as enum (Phase 3)
- [ ] Deprecated model cleanup (Phase 3)
- [ ] PaymentRecord implementation (Phase 3)
- [ ] Index optimization (Phase 3)

### API
- [x] Global prefix `/api/v1`
- [x] Centralized error handling
- [x] Pagination on most endpoints
- [x] ValidationPipe with forbidNonWhitelisted
- [x] Stable error codes
- [ ] OpenAPI/Swagger (Phase 9)
- [ ] Serialization layer (Phase 9)
- [ ] Notification pagination (Phase 4)
- [ ] API key enforcement (Phase 7)

### Testing
- [x] 49 unit test specs
- [x] Coverage threshold (42% — to be raised)
- [x] Jest + ts-jest configured
- [x] supertest installed
- [ ] Specs for 8 missing modules (Phase 8)
- [ ] Integration tests with Testcontainers (Phase 8)
- [ ] E2E test suite (Phase 8)
- [ ] Test data factories (Phase 8)
- [ ] Coverage threshold raised to 70% (Phase 8)
- [ ] CI test pipeline (Phase 8)

### Monitoring
- [x] Prometheus metrics endpoint
- [x] Metrics middleware (request duration)
- [x] Sentry error tracking with PII scrubbing
- [x] Structured JSON logging in production
- [x] Request ID correlation
- [x] Audit logging (Postgres-backed)
- [ ] Health checks for Redis + S3 (Phase 1)
- [ ] Load testing (Phase 8/10)

### Backup & Recovery
- [x] `backup.sh` script exists
- [ ] Automated backup schedule (Phase 10)
- [ ] Backup verification (Phase 10)
- [ ] Disaster recovery plan (Phase 10)

### Deployment
- [x] `NODE_ENV=production` enforced
- [x] `node dist/main.js` directly (not npm)
- [x] Trust proxy configuration
- [x] Dockerfile exists
- [x] docker-compose.yml exists
- [ ] Docker multi-stage build (Phase 10)
- [ ] Graceful shutdown (Phase 1)
- [ ] Zero-downtime deployment (Phase 10)
- [ ] Pre-deploy migrations (Phase 10)

### CI/CD
- [x] `.github/workflows/ci.yml` exists
- [ ] Test step in CI (Phase 8)
- [ ] Dependency scan in CI (Phase 2)
- [ ] Docker image build in CI (Phase 10)

### Documentation
- [x] 24 audit files (00-23)
- [x] Best practices reference (24)
- [x] Audit validation (25)
- [x] Execution roadmap (26)
- [ ] OpenAPI/Swagger docs (Phase 9)
- [ ] Disaster recovery plan (Phase 10)

### Infrastructure
- [x] PostgreSQL
- [ ] Redis (Phase 1)
- [ ] S3/MinIO (Phase 1)
- [ ] CDN (Phase 10)
- [ ] TLS automation (Phase 10)
- [ ] WAF (post-Phase 10)

**Score: 32/64 items complete (50%) — Target: 60/64 (94%) after Phase 10**
