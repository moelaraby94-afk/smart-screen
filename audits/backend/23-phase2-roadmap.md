# 23 — Phase 2 Roadmap

> **Objective:** Provide a prioritized, sprint-by-sprint remediation plan to close all gaps identified in the backend audit and achieve production readiness.

---

## 1. Roadmap Overview

| Sprint | Duration | Focus | Gaps Closed | Team Size |
|--------|----------|-------|-------------|-----------|
| Sprint 1 | Weeks 1-2 | Production Infrastructure | 6 P0 | 2-4 devs |
| Sprint 2 | Weeks 3-4 | API, Testing & Code Quality | 20 P1 + 15 P2 | 2-4 devs |
| Sprint 3 | Weeks 5-6 | Features & Security Hardening | 20 P2 | 2-4 devs |
| Sprint 4 | Weeks 7-8 | Scale, Polish & Advanced Features | 20 P3 | 2-4 devs |

**Total Duration:** 8 weeks (2 months) with a 4-person team
**Total Gaps:** 81 (6 P0 + 20 P1 + 35 P2 + 20 P3)

---

## 2. Sprint 1: Production Infrastructure (Weeks 1-2)

### Goal
Close all P0 gaps. After Sprint 1, the backend can be deployed to a staging environment with Redis, S3, and graceful shutdown.

### Tasks

#### 1.1 Redis Integration (Gap #1)
- **Effort:** Medium (3-5 days)
- **Files:**
  - `apps/backend/src/common/redis/redis.module.ts` (NEW)
  - `apps/backend/src/common/redis/redis.service.ts` (NEW)
  - `apps/backend/src/common/throttler/redis-throttler.guard.ts` (NEW)
  - `apps/backend/src/app.module.ts` (modify — add Redis module)
  - `apps/backend/src/domains/realtime/realtime.gateway.ts` (modify — add Redis adapter)
  - `apps/backend/package.json` (add `ioredis`, `@socket.io/redis-adapter`)
  - `docker-compose.yml` (add Redis service)
  - `.env.example` (add `REDIS_URL`)
- **Acceptance Criteria:**
  - Throttler uses Redis store
  - WebSocket gateway uses Redis adapter
  - Cache service wraps Redis with get/set/del
  - `AccountContextHelper` results cached with 5-min TTL
  - Health check includes Redis ping

#### 1.2 S3/MinIO Storage (Gap #2)
- **Effort:** Medium (3-5 days)
- **Files:**
  - `apps/backend/src/common/storage/storage.module.ts` (NEW)
  - `apps/backend/src/common/storage/s3.service.ts` (NEW)
  - `apps/backend/src/common/storage/local.service.ts` (NEW)
  - `apps/backend/src/common/storage/storage.interface.ts` (NEW)
  - `apps/backend/src/domains/media/media.service.ts` (modify — use storage abstraction)
  - `apps/backend/src/main.ts` (modify — remove static asset serving)
  - `apps/backend/package.json` (add `@aws-sdk/client-s3`)
  - `.env.example` (add `MEDIA_STORAGE_PROVIDER`, `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_ENDPOINT`)
  - `docker-compose.yml` (add MinIO service)
- **Acceptance Criteria:**
  - `MEDIA_STORAGE_PROVIDER=local` uses filesystem (dev)
  - `MEDIA_STORAGE_PROVIDER=s3` uses S3-compatible storage
  - `MEDIA_STORAGE_PROVIDER=minio` uses MinIO
  - Media upload writes to configured storage
  - Media URL generation uses storage provider
  - Static asset serving removed from API

#### 1.3 Graceful Shutdown (Gap #3)
- **Effort:** Small (1-2 days)
- **Files:**
  - `apps/backend/src/main.ts` (modify — add shutdown hooks)
- **Acceptance Criteria:**
  - `app.enableShutdownHooks()` enabled
  - SIGTERM handler: stop accepting new connections, wait 30s for in-flight requests, disconnect WebSocket clients with `server:shutdown` event, close DB connections
  - Process exits cleanly with code 0

#### 1.4 Health Check Dependencies (Gap #4)
- **Effort:** Small (1-2 days)
- **Files:**
  - `apps/backend/src/common/health/health.service.ts` (modify — add Redis, S3 checks)
  - `apps/backend/src/common/health/health.controller.ts` (modify — add dependency checks to /ready)
- **Acceptance Criteria:**
  - `/ready` checks: Prisma, Redis, S3
  - Returns 200 if all pass, 503 if any fail
  - Response includes individual dependency status

#### 1.5 DB Connection Pool Tuning (Gap #5)
- **Effort:** Small (0.5 day)
- **Files:**
  - `apps/backend/src/common/prisma/prisma.service.ts` (modify — add pool config)
  - `.env.example` (add `DATABASE_CONNECTION_LIMIT`, `DATABASE_POOL_TIMEOUT`)
- **Acceptance Criteria:**
  - Connection limit configurable (default 10)
  - Pool timeout configurable (default 30s)
  - Documented in `.env.example`

#### 1.6 Shared Secret Removal (Gap #6)
- **Effort:** Medium (2-3 days)
- **Files:**
  - `apps/backend/src/domains/player/player.service.ts` (modify — remove fallback)
  - `apps/backend/src/domains/realtime/realtime.gateway.ts` (modify — remove fallback)
  - `apps/backend/prisma/migrations/` (NEW — migration to set secrets for unpaired screens)
- **Acceptance Criteria:**
  - Shared `PLAYER_HEARTBEAT_SECRET` fallback removed
  - Migration generates per-screen secrets for screens without `pairingSecretHash`
  - All screens must authenticate with per-screen secret
  - `PLAYER_HEARTBEAT_SECRET` removed from required secrets list

---

## 3. Sprint 2: API, Testing & Code Quality (Weeks 3-4)

### Goal
Close P1 gaps. After Sprint 2, the API is documented, tested, and code quality is improved.

### Tasks

#### 2.1 API Documentation (Gap #8)
- Add `@nestjs/swagger` module
- Decorate all controllers with `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Add `@ApiProperty` to all DTOs
- Expose `/api/v1/docs` with Swagger UI
- Generate OpenAPI JSON spec

#### 2.2 Testing Infrastructure (Gaps #9, #10, #11)
- Set up Testcontainers with PostgreSQL
- Write integration tests for: Auth, Screens, Playlists, Media, Schedules, Campaigns
- Write E2E tests for: Auth flow, Pairing flow, Content flow, Campaign workflow, Billing flow
- Add spec files for: Admin, Workspaces, Notifications, Islamic, API Keys
- Add test data factories in `test/factories/`
- Add coverage threshold (70% lines, 60% branches)

#### 2.3 Code Quality (Gaps #15, #16, #52, #53, #54)
- Decompose `AuthService` into 4 services
- Add serialization interceptor with response DTOs
- Create `common/constants/` directory
- Add Socket.IO event name constants
- Add `eslint-plugin-import` for import ordering

#### 2.4 Security Quick Wins (Gaps #12, #23, #28, #29, #30, #55)
- Add password complexity validation
- Remove `DevLoginController`
- Convert `recurrence` String fields to Prisma enums
- Encrypt 2FA secrets at rest
- Use `file-type` library for MIME detection
- Add `npm audit` to CI

#### 2.5 Infrastructure Quick Wins (Gaps #13, #14, #26, #27)
- Add structured JSON logging (`nestjs-pino`)
- Add request ID middleware
- Add `/metrics` endpoint for Prometheus
- Add Docker multi-stage build
- Add Joi env var validation schema

#### 2.6 Database Cleanup (Gaps #24, #25)
- Remove `WorkspacePairingCode` model
- Implement `PaymentRecord` creation in Stripe webhook

#### 2.7 Performance Quick Wins (Gaps #31, #32)
- Add `compression` middleware
- Set static asset caching headers

#### 2.8 Notifications (Gap #38)
- Add pagination to notifications endpoint

#### 2.9 API Key Enforcement (Gap #7)
- Implement `ApiKeyAuthGuard`
- Add API key authentication to relevant routes
- Enforce scopes

---

## 4. Sprint 3: Features & Security Hardening (Weeks 5-6)

### Goal
Close P2 gaps. After Sprint 3, the backend has email notifications, timezone-aware scheduling, dunning management, and AI services foundation.

### Tasks

#### 3.1 Email Notifications (Gap #17)
- Implement email flows for: screen offline, team invite, campaign approval, subscription expiry, password changed, 2FA disabled, storage/screen limit warning
- Add BullMQ email queue with Redis
- Add email delivery tracking (`EmailLog` model)

#### 3.2 Timezone Support (Gap #18)
- Add `timezone` field to Workspace model
- Convert schedule times to UTC, interpret in workspace timezone
- Add DST-aware time handling with `luxon`

#### 3.3 Billing Improvements (Gaps #19, #20, #25)
- Implement dunning flow with 7-day grace period
- Add seat limit enforcement in member creation
- Create `PaymentRecord` entries from invoice webhook

#### 3.4 AI Services Foundation (Gap #21)
- Create `domains/ai/` module
- Implement LLM provider abstraction (OpenAI, Anthropic, Google)
- Add `AiUsageLog` model for cost tracking
- Implement `POST /ai/generate-text` endpoint
- Implement `POST /ai/translate` endpoint

#### 3.5 Proof-of-Play (Gap #22)
- Add `ProofOfPlay` model
- Add `POST /player/proof-of-play` endpoint
- Add proof-of-play analytics query

#### 3.6 Realtime Improvements (Gaps #33, #34, #35, #37, #39)
- Add WebSocket event payload validation
- Add WebSocket rate limiting
- Add offline event queue (Redis-backed)
- Add real-time notification delivery via Socket.IO
- Add campaign-to-screen push on publish

#### 3.7 Media Improvements (Gaps #42, #43, #45)
- Add file hash (SHA-256) for integrity
- Add EXIF stripping on upload
- Add signed URL generation for media access

#### 3.8 Security Hardening (Gaps #47, #48, #56, #57, #58)
- Add admin session timeout
- Add IP allowlist for admin endpoints
- Add security event logging
- Add JWT rotation on role change
- Add refresh token reuse detection

#### 3.9 Business Logic Fixes (Gaps #40, #41)
- Add workspace pause enforcement on all mutations
- Add media expiry purge cron job

#### 3.10 Player Improvements (Gap #79)
- Add `playerVersion` field to Screen model
- Track player version in heartbeat

#### 3.11 Scheduling (Gaps #59, #60)
- Add schedule preview endpoint
- Add holiday schedule support

#### 3.12 Deployment (Gaps #49, #50, #68, #70)
- Add zero-downtime deployment strategy
- Add automated backup schedule
- Add CDN for media
- Add TLS certificate automation

---

## 5. Sprint 4: Scale, Polish & Advanced Features (Weeks 7-8)

### Goal
Close P3 gaps. After Sprint 4, the backend is production-hardened with advanced features.

### Tasks

#### 4.1 Architecture (Gaps #51, #61, #62)
- Resolve Auth ↔ Workspaces circular dependency
- Extract shared types to `packages/shared/`
- Add module boundary enforcement

#### 4.2 Testing (Gaps #66, #67)
- Add load testing with k6
- Add security testing (OWASP ZAP)

#### 4.3 Infrastructure (Gaps #69, #71)
- Add WAF
- Add secret rotation strategy

#### 4.4 API Design (Gaps #72, #73, #74, #75)
- Define API versioning strategy
- Add bulk operations
- Add idempotency key support
- Add rate limit headers

#### 4.5 Player Advanced (Gaps #76, #77, #78, #80)
- Add content manifest endpoint
- Add command acknowledgment
- Add crash report endpoint
- Add OTA update mechanism (research)

#### 4.6 Notifications (Gap #36)
- Add push notification service (FCM/APNs)

#### 4.7 Media (Gap #44)
- Add virus scanning (ClamAV)

#### 4.8 Final Hardening
- Conduct security penetration test
- Define disaster recovery plan
- Add monitoring dashboards (Grafana)
- Performance optimization pass
- Final documentation review

---

## 6. Post-Phase 2: Ongoing

### Monthly
- Re-audit for new technical debt
- Update gap analysis
- Review test coverage trends
- Dependency vulnerability scan

### Quarterly
- Full backend re-audit
- Security assessment
- Performance benchmark
- Architecture review

### Annually
- Penetration test
- Disaster recovery drill
- Secret rotation
- Dependency major version upgrades

---

## 7. Success Metrics

| Metric | Current | Sprint 1 Target | Sprint 2 Target | Sprint 4 Target |
|--------|---------|-----------------|-----------------|-----------------|
| Production readiness | 60% | 80% | 90% | 95% |
| Test coverage | 55% | 55% | 70% | 80% |
| P0 gaps open | 6 | 0 | 0 | 0 |
| P1 gaps open | 20 | 20 | 0 | 0 |
| P2 gaps open | 35 | 35 | 15 | 0 |
| P3 gaps open | 20 | 20 | 20 | 0 |
| API documentation | 0% | 0% | 80% | 100% |
| Module test coverage | 14/22 | 14/22 | 22/22 | 22/22 |
| Redis integration | ❌ | ✅ | ✅ | ✅ |
| S3 integration | ❌ | ✅ | ✅ | ✅ |
| Graceful shutdown | ❌ | ✅ | ✅ | ✅ |

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Sprint 1 delays block all subsequent work | Sprint 1 has highest priority; allocate best resources |
| Redis/S3 integration introduces bugs | Add integration tests in Sprint 1 before using in production |
| Breaking API changes from serialization | Use feature flag to toggle between old and new response shapes |
| Test suite takes too long to write | Prioritize critical modules first (Admin, Workspaces, Auth) |
| AI services scope creep | Limit Sprint 3 to text generation + translation only |
| Team velocity lower than estimated | Re-baseline after Sprint 1; adjust Sprint 2-4 scope |

---

## 9. Dependencies

| Sprint | Depends On |
|--------|------------|
| Sprint 1 | None (start immediately) |
| Sprint 2 | Sprint 1 (Redis for test queue, S3 for media tests) |
| Sprint 3 | Sprint 1 (Redis for email queue, offline event queue) |
| Sprint 4 | Sprint 2 (test infrastructure for load testing) |

---

## 10. Completion Criteria

Phase 2 is complete when:
1. ✅ All 6 P0 gaps are closed
2. ✅ All 20 P1 gaps are closed
3. ✅ At least 80% of P2 gaps are closed
4. ✅ At least 50% of P3 gaps are closed
5. ✅ Production readiness ≥ 95%
6. ✅ Test coverage ≥ 70%
7. ✅ All 22 modules have spec files
8. ✅ API documentation (Swagger) is complete
9. ✅ Load testing passes (1000 concurrent users, <500ms p95)
10. ✅ Security penetration test passes with no P0 findings
11. ✅ Build passes (TypeScript 0 errors, ESLint 0 errors, all tests pass)
12. ✅ Zero-downtime deployment verified in staging

---

## 11. Future Tasks (Post-Phase 2)

- [ ] Multi-region deployment
- [ ] GraphQL API (alongside REST)
- [ ] Mobile app backend (push notifications, offline sync)
- [ ] Advanced AI (image generation, smart scheduling, content recommendations)
- [ ] Multi-tenant database isolation (RLS)
- [ ] Event sourcing for audit trail
- [ ] CQRS pattern for read/write separation
- [ ] Custom analytics dashboard
- [ ] Webhook marketplace (third-party integrations)
- [ ] Public API with rate-limited self-service signup
