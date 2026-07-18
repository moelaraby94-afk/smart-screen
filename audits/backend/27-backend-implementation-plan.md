# 27 — Backend Implementation Plan

> **Objective:** A granular, step-by-step implementation plan for each phase of the backend execution roadmap. This document translates the strategic roadmap (26) into tactical implementation steps with exact file-level changes, testing methods, and acceptance criteria.

> **Reference Documents:**
> - `24-best-practices-reference.md` — Official best practices compliance matrix
> - `25-audit-validation.md` — Validated gap list (63 gaps, 8 errors corrected)
> - `26-backend-execution-roadmap.md` — 10-phase strategic roadmap
> - `backend-phase2-approval.md` — Approval report with stakeholder decisions

> **Official Sources:**
> - NestJS: https://docs.nestjs.com/
> - Prisma: https://www.prisma.io/docs/orm/
> - PostgreSQL: https://www.postgresql.org/docs/
> - Redis: https://redis.io/docs/
> - Docker: https://docs.docker.com/
> - Node.js: https://nodejs.org/api/
> - OWASP: https://owasp.org/Top10/2021/
> - Stripe: https://docs.stripe.com/billing/revenue-recovery
> - Cloudflare R2: https://developers.cloudflare.com/r2/

---

## Codebase Corrections Discovered During Planning

Before starting implementation, three inaccuracies in the audit files must be noted:

| # | Audit Claim | Actual Code | Impact |
|---|-------------|-------------|--------|
| C1 | "Dockerfile.backend is single-stage" (Audit 17, 19, 21) | `Dockerfile.backend` already has **2 stages** (builder + runner) at lines 8 and 38 | Phase 10 task changes from "create multi-stage" to "optimize existing multi-stage" |
| C2 | "No dependency vulnerability scanning" (Audit 16, 19) | `.github/workflows/ci.yml` line 44: `npm audit --audit-level=high \|\| true` — exists but **non-blocking** | Phase 2 task changes from "add" to "make blocking" |
| C3 | "No CI test pipeline" (Audit 18, 19) | `.github/workflows/ci.yml` line 38: `npm run verify` runs typecheck + lint + tests + builds | Phase 8 task changes from "create CI pipeline" to "add coverage enforcement + backend E2E" |

---

## Execution Order and Rationale

### Phase Execution Order

```
Phase 1 (Foundation)     ──── MUST BE FIRST
  │
  ├── Phase 2 (Security)     ──── CAN PARALLEL with Phase 1
  ├── Phase 3 (Database)    ──── CAN PARALLEL with Phase 1
  │
  ▼
Phase 4 (Business Logic)  ──── REQUIRES Phase 1 (Redis for queue + WS)
  │
  ├── Phase 5 (Realtime)   ──── REQUIRES Phase 1 (Redis for WS rate limit + queue)
  ├── Phase 6 (Storage)    ──── REQUIRES Phase 1 (S3 adapter)
  │
  ▼
Phase 7 (Billing)         ──── REQUIRES Phase 4 (email queue for dunning)
  │
  ▼
Phase 8 (Testing)         ──── REQUIRES Phases 1-7 (test what was built)
  │
  ▼
Phase 9 (Performance)     ──── REQUIRES Phase 1 (Redis for cache)
  │
  ▼
Phase 10 (Production)     ──── REQUIRES ALL previous phases
```

### Why This Order?

| Phase | Why Here? | What Happens If Reordered? |
|-------|-----------|---------------------------|
| 1 | Redis + S3 are P0 blockers. 4 subsequent phases depend on Redis. 2 depend on S3. | Phases 4, 5, 6, 9 cannot proceed without Phase 1 |
| 2 | Security hardening is independent. Can run in parallel with Phase 1. No dependencies. | No harm in delaying, but security should be early |
| 3 | Database optimization is independent. Can run in parallel with Phase 1. No dependencies. | No harm in delaying, but enum migration should happen before Phase 4 adds timezone field |
| 4 | Email queue needs Redis (Phase 1). Real-time notifications need Redis WS adapter (Phase 1). | Without Redis, email is synchronous and notifications don't scale |
| 5 | WS rate limiting needs Redis (Phase 1). Offline queue needs Redis (Phase 1). | Without Redis, WS hardening is incomplete |
| 6 | S3 storage adapter from Phase 1. Signed URLs need S3. | Without S3, signed URLs have no backend |
| 7 | Dunning emails need queue (Phase 4). PaymentRecord may need schema changes (Phase 3). | Without queue, dunning emails are synchronous |
| 8 | Tests should cover all features built in Phases 1-7. | Testing earlier means re-writing tests as features change |
| 9 | Cache needs Redis (Phase 1). Serialization should happen after business logic is stable (Phase 4). | Caching before features are stable means cache invalidation bugs |
| 10 | Final hardening requires all features and tests in place. | Deploying before testing is reckless |

### Parallelization Strategy

**With 2 developers:**
- Dev A: Phase 1 → Phase 4 → Phase 5 → Phase 7 → Phase 9
- Dev B: Phase 2 → Phase 3 → Phase 6 → Phase 8 → Phase 10

**With 3+ developers:**
- Dev A: Phase 1 (Foundation)
- Dev B: Phase 2 (Security) — starts immediately, parallel with Phase 1
- Dev C: Phase 3 (Database) — starts immediately, parallel with Phase 1
- After Phase 1: Dev A moves to Phase 4, then 5
- After Phase 2+3: Dev B/C move to Phase 6, 7
- Phase 8 (Testing): all devs converge
- Phase 9-10: all devs converge

---

## Phase 1: Foundation & Infrastructure

### 1.1 Step-by-Step Implementation

#### Step 1.1.1: Install Dependencies
```
npm install ioredis @socket.io/redis-adapter @aws-sdk/client-s3 @nestjs/terminus --workspace apps/backend
```

**Official Sources:**
- NestJS Queues: https://docs.nestjs.com/techniques/queues (recommends BullMQ + Redis)
- Socket.IO Redis Adapter: https://socket.io/docs/v4/redis-adapter/
- Cloudflare R2 (S3-compatible): https://developers.cloudflare.com/r2/get-started/s3/ — uses `@aws-sdk/client-s3` with custom endpoint

#### Step 1.1.2: Create Redis Module
- **New file:** `apps/backend/src/common/redis/redis.module.ts`
- **New file:** `apps/backend/src/common/redis/redis.service.ts`
- `RedisService` wraps `ioredis` with:
  - `getClient()`: returns `ioredis` instance
  - `ping()`: health check
  - `quit()`: graceful close
- Configured via `REDIS_URL` env var
- Registered as global module

**Official Source:** Redis docs — https://redis.io/docs/latest/develop/use-cases/cache-aside/nodejs/ — "Use `ioredis` for Node.js Redis connectivity"

#### Step 1.1.3: Migrate Throttler to Redis Storage
- **Modify:** `apps/backend/src/app.module.ts`
  - Change `ThrottlerModule.forRoot()` to use Redis storage
  - Install `@nest-labs/throttler-storage-redis` or implement custom storage adapter
- **Why:** NestJS docs — "When running multiple instances, use a shared storage for throttling"
- **Risk:** If Redis is down, throttling fails. **Mitigation:** Fallback to in-memory if Redis unavailable (log warning)

#### Step 1.1.4: Configure WebSocket Redis Adapter
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - After `io` server creation, call `io.adapter(createAdapter(pubClient, subClient))`
  - Use `RedisService` clients
- **Official Source:** Socket.IO docs — https://socket.io/docs/v4/redis-adapter/ — "allows broadcasting packets between multiple Socket.IO servers"

#### Step 1.1.5: Create Storage Abstraction
- **New file:** `apps/backend/src/common/storage/storage.interface.ts` — `IStorageService` interface
- **New file:** `apps/backend/src/common/storage/s3.service.ts` — `S3StorageService` implementing `IStorageService`
- **New file:** `apps/backend/src/common/storage/local.service.ts` — `LocalStorageService` (existing behavior, refactored)
- **New file:** `apps/backend/src/common/storage/storage.module.ts` — Configures provider based on `MEDIA_STORAGE_PROVIDER` env var
- **Modify:** `apps/backend/src/domains/media/media.service.ts` — Inject `IStorageService` instead of using `fs` directly

**Official Source:** Cloudflare R2 docs — https://developers.cloudflare.com/r2/get-started/s3/ — "R2 provides support for a S3-compatible API, which means you can use any S3 SDK, library, or tool to interact with your buckets."

**S3 Client Configuration (works with AWS S3, MinIO, and Cloudflare R2):**
```typescript
const s3 = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT, // R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
});
```

#### Step 1.1.6: Remove Static Asset Serving
- **Modify:** `apps/backend/src/main.ts`
  - Remove `app.useStaticAssets()` call
  - Media is now served from S3/R2 directly (or via signed URLs in Phase 6)
- **Modify:** `docker-compose.yml`
  - Remove `media_uploads` volume mount (media goes to S3)
  - Keep `backend_data` volume for `.data/` (admin-runtime, branding)

#### Step 1.1.7: Implement Graceful Shutdown
- **Modify:** `apps/backend/src/main.ts`
  - Add `app.enableShutdownHooks()`
  - Add explicit SIGTERM handler with ordered shutdown:
    1. Set readiness flag to false (health check returns 503)
    2. `server.close()` — stop accepting new connections
    3. `server.closeIdleConnections()` — close idle keep-alive
    4. Wait for in-flight requests (max 25s)
    5. `io.close()` — close WebSocket server
    6. `redisService.quit()` — close Redis connections
    7. `prismaService.$disconnect()` — close Prisma connection
    8. `process.exit(0)`
  - Add force-exit timeout: `setTimeout(() => process.exit(1), 25000).unref()`

**Official Sources:**
- Express.js: https://expressjs.com/en/advanced/healthcheck-graceful-shutdown.html — "stop accepting new requests, finish all ongoing requests, clean up resources, then exit"
- Node.js: https://nodejs.org/api/process.html#event-sigterm — SIGTERM handler prevents immediate termination
- NestJS: https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown — `enableShutdownHooks()` for lifecycle hooks

#### Step 1.1.8: Health Check Dependencies
- **Modify:** `apps/backend/src/common/health/health.controller.ts`
  - Install `@nestjs/terminus`
  - Add Redis ping check: `redisService.ping()`
  - Add S3 check: `s3.headBucket({ Bucket })` 
  - Keep existing Prisma check
  - Return 200 if all pass, 503 if any fail
  - Add `/live` (liveness — always 200) vs `/ready` (readiness — checks dependencies)

**Official Source:** NestJS Terminus — https://docs.nestjs.com/recipes/terminus — "Health checks are used to check if your application is running properly"

#### Step 1.1.9: DB Connection Pool Tuning
- **Modify:** `apps/backend/src/common/prisma/prisma.service.ts`
  - Configure `PrismaPg` adapter with explicit pool parameters:
    ```typescript
    new PrismaPg({
      max: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 10),
      connectionTimeoutMillis: Number(process.env.DATABASE_POOL_TIMEOUT ?? 30000),
      idleTimeoutMillis: 10000,
    })
    ```
- **Official Source:** Prisma docs — https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool — "Configure pool size and timeouts for your driver adapter"

#### Step 1.1.10: Docker Compose Updates
- **Modify:** `docker-compose.yml`
  - Add Redis service:
    ```yaml
    redis:
      image: redis:7-alpine
      restart: unless-stopped
      ports:
        - "${REDIS_PORT:-6379}:6379"
      healthcheck:
        test: ['CMD', 'redis-cli', 'ping']
        interval: 5s
        timeout: 3s
        retries: 5
    ```
  - Add MinIO service:
    ```yaml
    minio:
      image: minio/minio:latest
      restart: unless-stopped
      command: server /data --console-address ":9001"
      ports:
        - "${MINIO_PORT:-9000}:9000"
        - "${MINIO_CONSOLE_PORT:-9001}:9001"
      volumes:
        - minio_data:/data
      healthcheck:
        test: ['CMD', 'curl', '-f', 'http://localhost:9000/minio/health/live']
        interval: 10s
        timeout: 5s
        retries: 5
    ```
  - Update `backend` service: add `depends_on: redis, minio`, add env vars
  - Add `minio_data` volume

#### Step 1.1.11: Environment Variables
- **Modify:** `.env.example`
  - Add: `REDIS_URL=redis://localhost:6379`
  - Add: `S3_BUCKET=cloud-screen-media`
  - Add: `S3_REGION=auto`
  - Add: `S3_ACCESS_KEY=`
  - Add: `S3_SECRET_KEY=`
  - Add: `S3_ENDPOINT=http://localhost:9000` (MinIO) or `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` (R2)
  - Add: `MEDIA_STORAGE_PROVIDER=local` (local | s3 | r2)
  - Add: `DATABASE_CONNECTION_LIMIT=10`
  - Add: `DATABASE_POOL_TIMEOUT=30000`

### 1.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/package.json` | Modify (add deps) | ~5 |
| `apps/backend/src/common/redis/redis.module.ts` | NEW | ~20 |
| `apps/backend/src/common/redis/redis.service.ts` | NEW | ~40 |
| `apps/backend/src/common/storage/storage.interface.ts` | NEW | ~15 |
| `apps/backend/src/common/storage/s3.service.ts` | NEW | ~80 |
| `apps/backend/src/common/storage/local.service.ts` | NEW | ~50 |
| `apps/backend/src/common/storage/storage.module.ts` | NEW | ~25 |
| `apps/backend/src/app.module.ts` | Modify | ~10 |
| `apps/backend/src/main.ts` | Modify | ~30 |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Modify | ~5 |
| `apps/backend/src/common/health/health.controller.ts` | Modify | ~30 |
| `apps/backend/src/common/prisma/prisma.service.ts` | Modify | ~10 |
| `apps/backend/src/domains/media/media.service.ts` | Modify | ~20 |
| `docker-compose.yml` | Modify | ~40 |
| `.env.example` | Modify | ~10 |

### 1.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Redis connection failure blocks app startup | Medium | High | Catch Redis connection error, log warning, continue with in-memory fallback |
| S3 upload fails silently | Medium | High | Health check + error logging + retry logic in S3StorageService |
| Existing media files not migrated to S3 | High | Medium | Write migration script to copy `uploads/` to S3 before switching provider |
| Graceful shutdown hangs on long-running WebSocket connections | Low | Medium | 25s force-exit timeout |
| Prisma pool size too small for concurrent requests | Low | Medium | Configurable via env var, default 10 |

### 1.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Redis connection | `docker compose up redis` → `redis-cli ping` | `PONG` |
| Throttler Redis storage | Send 301st request in 1 min → 429 | Rate limited across instances |
| WS Redis adapter | Start 2 backend instances, connect screen to instance A, emit event from instance B | Screen receives event |
| S3 upload | `POST /api/v1/media` with file → check MinIO console | File appears in bucket |
| S3 with R2 | Set `S3_ENDPOINT` to R2 URL, upload file | File appears in R2 bucket |
| Graceful shutdown | `docker compose stop backend` → monitor logs | "Shutting down..." → connections closed → exit 0 within 25s |
| Health check | `GET /ready` with Redis down | 503 with Redis check failed |
| DB pool | Check Prisma logs for pool size | `max: 10` (or configured value) |

### 1.5 Definition of Done

- [ ] `ioredis` installed and `RedisModule` created
- [ ] Throttler uses Redis storage (verify: 2 instances share rate limit state)
- [ ] WebSocket gateway uses Redis adapter (verify: cross-instance broadcast)
- [ ] `IStorageService` interface created with `upload()`, `delete()`, `getSignedUrl()`, `getPublicUrl()`
- [ ] `S3StorageService` implemented (compatible with AWS S3, MinIO, and Cloudflare R2)
- [ ] `LocalStorageService` implemented (backward compatible)
- [ ] `MEDIA_STORAGE_PROVIDER` env var switches storage provider
- [ ] `MediaService` uses `IStorageService` injection (no direct `fs` calls)
- [ ] `app.useStaticAssets()` removed from `main.ts`
- [ ] `app.enableShutdownHooks()` added
- [ ] SIGTERM handler with ordered shutdown (server → WS → Redis → Prisma → exit)
- [ ] 25s force-exit timeout
- [ ] `/ready` checks Redis + S3 + Prisma
- [ ] `/live` always returns 200
- [ ] `@nestjs/terminus` installed
- [ ] Prisma pool config explicit and configurable via env vars
- [ ] `docker-compose.yml` includes Redis + MinIO services with health checks
- [ ] `.env.example` updated with all new env vars
- [ ] Migration script for existing `uploads/` files to S3
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass
- [ ] Manual verification: SIGTERM, health check, media upload, rate limit across instances

---

## Phase 2: Security Hardening

### 2.1 Step-by-Step Implementation

#### Step 2.1.1: Password Complexity Validation
- **Modify:** `apps/backend/src/domains/auth/dto/register.dto.ts`
  - Add `@MinLength(8)`, `@Matches(/[A-Z]/, { message: 'password must contain uppercase' })`, `@Matches(/[a-z]/)`, `@Matches(/[0-9]/)`, `@Matches/[^a-zA-Z0-9]/)`
- **Modify:** `apps/backend/src/domains/auth/dto/reset-password.dto.ts`
  - Same validators
- **Modify:** `apps/backend/src/domains/auth/dto/accept-invite.dto.ts`
  - Same validators on password field

**Official Source:** OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html — "Enforce minimum length (≥8), complexity (uppercase, lowercase, number, special character)"

#### Step 2.1.2: Create CryptoService for 2FA Secret Encryption
- **New file:** `apps/backend/src/common/crypto/crypto.service.ts`
  - `encrypt(plaintext: string): string` — AES-256-GCM with `ENCRYPTION_KEY` env var
  - `decrypt(ciphertext: string): string` — decrypt with same key
  - Use Node.js `crypto` module (built-in, no external dependency)
  - Key derivation: `crypto.scryptSync(ENCRYPTION_KEY, salt, 32)`
  - Format: `iv:authTag:ciphertext` (base64)

**Official Source:** OWASP Cryptographic Failures (A02:2021) — https://owasp.org/Top10/2021/A02_2021-Cryptographic_Failures/ — "Sensitive data must be encrypted at rest"

**Alternative considered:** HashiCorp Vault for secrets management. Rejected as over-engineering for current scale.

#### Step 2.1.3: Encrypt 2FA Secrets
- **Modify:** `apps/backend/src/domains/auth/two-factor.service.ts`
  - On `enableTwoFactor()`: encrypt TOTP secret before storing in DB
  - On `verifyTwoFactor()`: decrypt secret from DB before TOTP verification
  - On `disableTwoFactor()`: delete encrypted secret
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_encrypt_2fa_secrets/migration.sql`
  - Read all existing plaintext secrets
  - Encrypt each with `CryptoService`
  - Update DB records
  - **Critical:** Test on staging first, backup before running

#### Step 2.1.4: Remove DevLoginController
- **Delete:** `apps/backend/src/domains/auth/dev-login.controller.ts`
- **Delete:** `apps/backend/src/domains/auth/dev-login.controller.spec.ts`
- **Modify:** `apps/backend/src/domains/auth/auth.module.ts` — remove `DevLoginController` from `controllers` array
- **Modify:** `.env.example` — remove `ENABLE_DEV_LOGIN` if present

**Justification:** Dev-only code in production codebase is a security risk. Risk of misconfiguration outweighs dev convenience.

#### Step 2.1.5: Remove Shared Secret Fallback
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - Remove `assertScreenSecret()` fallback to `PLAYER_HEARTBEAT_SECRET`
  - Require per-screen `pairingSecretHash` only
- **Modify:** `apps/backend/src/domains/player/player.service.ts`
  - Remove shared secret fallback in heartbeat validation
- **Modify:** `apps/backend/src/main.ts` — remove `PLAYER_HEARTBEAT_SECRET` from `assertProductionSecretsAreSet()`
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_generate_screen_secrets/migration.sql`
  - For all screens with `pairingSecretHash = NULL`, generate a random secret
  - Hash with bcrypt and store
  - **Note:** These screens will need re-pairing. See stakeholder decision #7 (grace period)

**Official Source:** OWASP Identification and Authentication Failures (A07:2021) — per-device secrets are more secure than shared secrets

#### Step 2.1.6: JWT Rotation on Role Change
- **Modify:** `apps/backend/src/domains/workspaces/workspaces.service.ts`
  - In `changeMemberRole()`: after updating role, delete all `RefreshToken` records for that user
- **Modify:** `apps/backend/src/domains/admin/admin.service.ts`
  - In `updateUser()`: if role changed, delete all `RefreshToken` records for that user
- User's current access token remains valid until expiry (short-lived by design)

**Official Source:** OWASP Access Control Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html — "Verify authorization in real-time"

#### Step 2.1.7: Make Dependency Scanning Blocking
- **Modify:** `.github/workflows/ci.yml`
  - Change `npm audit --audit-level=high || true` to `npm audit --audit-level=high`
  - Add Dependabot configuration file: `.github/dependabot.yml`
    - Check weekly for npm dependencies
    - Open PR for high+critical vulnerabilities

**Official Source:** OWASP Vulnerable and Outdated Components (A06:2021) — https://owasp.org/Top10/2021/A06_2021-Vulnerable_and_Outdated_Components/

**Note:** CI already has `npm audit --audit-level=high || true` (non-blocking). This step makes it blocking.

### 2.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/src/domains/auth/dto/register.dto.ts` | Modify | ~5 |
| `apps/backend/src/domains/auth/dto/reset-password.dto.ts` | Modify | ~5 |
| `apps/backend/src/domains/auth/dto/accept-invite.dto.ts` | Modify | ~5 |
| `apps/backend/src/common/crypto/crypto.service.ts` | NEW | ~50 |
| `apps/backend/src/domains/auth/two-factor.service.ts` | Modify | ~15 |
| `apps/backend/src/domains/auth/dev-login.controller.ts` | DELETE | - |
| `apps/backend/src/domains/auth/dev-login.controller.spec.ts` | DELETE | - |
| `apps/backend/src/domains/auth/auth.module.ts` | Modify | ~2 |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Modify | ~10 |
| `apps/backend/src/domains/player/player.service.ts` | Modify | ~10 |
| `apps/backend/src/main.ts` | Modify | ~3 |
| `apps/backend/src/domains/workspaces/workspaces.service.ts` | Modify | ~5 |
| `apps/backend/src/domains/admin/admin.service.ts` | Modify | ~5 |
| `.github/workflows/ci.yml` | Modify | ~2 |
| `.github/dependabot.yml` | NEW | ~15 |
| `apps/backend/prisma/migrations/...` | NEW | ~20 |
| `.env.example` | Modify | ~2 |

### 2.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 2FA encryption migration corrupts secrets | Medium | High | Test on staging, backup DB before migration, verify decryption after |
| Shared secret removal breaks existing paired screens | High | Medium | 30-day grace period with warning emails; migration script generates per-screen secrets |
| Password complexity rejects existing users on password change | Low | Low | Only enforce on new passwords, not existing |
| Making `npm audit` blocking breaks CI on existing vulnerabilities | High | Low | Triage existing vulnerabilities first, then make blocking |

### 2.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Password complexity | `POST /auth/register` with password "abc" | 400 with validation error for each missing requirement |
| Password complexity | `POST /auth/register` with password "Abc123!@" | 201 Created |
| 2FA encryption | Enable 2FA → query DB → check `twoFactorSecret` is not plaintext | Encrypted string in DB |
| 2FA decryption | Verify TOTP code with encrypted secret | Verification succeeds |
| DevLogin removal | `POST /auth/dev-login` | 404 Not Found |
| Shared secret removal | Screen heartbeat with shared secret | 401 Unauthorized |
| Shared secret removal | Screen heartbeat with per-screen secret | 200 OK |
| JWT rotation | Change user role → try refresh token | Refresh fails (deleted) |
| Dependency scan | Push PR with vulnerable dependency | CI fails on `npm audit` |

### 2.5 Definition of Done

- [ ] Password complexity validators on `register.dto.ts`, `reset-password.dto.ts`, `accept-invite.dto.ts`
- [ ] `CryptoService` with AES-256-GCM `encrypt()` and `decrypt()`
- [ ] `ENCRYPTION_KEY` env var added to `.env.example`
- [ ] All 2FA secrets encrypted at rest
- [ ] Migration for existing 2FA secrets (tested on staging, backup before running)
- [ ] `DevLoginController` and its spec file deleted
- [ ] `DevLoginController` removed from `auth.module.ts`
- [ ] Shared secret fallback removed from `realtime.gateway.ts` and `player.service.ts`
- [ ] Migration for per-screen secrets
- [ ] `PLAYER_HEARTBEAT_SECRET` removed from `assertProductionSecretsAreSet()`
- [ ] JWT rotation on role change in `workspaces.service.ts` and `admin.service.ts`
- [ ] `npm audit --audit-level=high` is blocking in CI (no `|| true`)
- [ ] `.github/dependabot.yml` created
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass (minus deleted dev-login spec)

---

## Phase 3: Database Optimization

### 3.1 Step-by-Step Implementation

#### Step 3.1.1: Recurrence Enum Migration
- **Modify:** `apps/backend/prisma/schema.prisma`
  - Add `enum RecurrenceType { WEEKLY MONTHLY ONCE DAILY }`
  - Change `Schedule.recurrence` from `String` to `RecurrenceType`
  - Change `ScreenOverrideRule.recurrence` from `String` to `RecurrenceType`
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_recurrence_enum/migration.sql`
  - Create enum type
  - ALTER TABLE to change column type with `USING recurrence::"RecurrenceType"`
  - **Pre-migration:** Audit existing string values to ensure they match enum values

**Official Source:** Prisma docs — https://www.prisma.io/docs/orm/prisma-schema/data-model/enum — "Enums are type-safe and prevent invalid values"

#### Step 3.1.2: Remove Deprecated WorkspacePairingCode Model
- **Modify:** `apps/backend/prisma/schema.prisma` — remove `WorkspacePairingCode` model
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_drop_workspace_pairing_code/migration.sql`
  - `DROP TABLE IF EXISTS "WorkspacePairingCode";`
- **Verify:** Search codebase for any references to `WorkspacePairingCode` and remove them

#### Step 3.1.3: Implement PaymentRecord Creation
- **Modify:** `apps/backend/src/domains/webhooks/webhooks.service.ts` (or `stripe.service.ts`)
  - On `invoice.payment_succeeded`: create `PaymentRecord` with `workspaceId`, `stripeInvoiceId`, `amount`, `currency`, `status: 'SUCCEEDED'`
  - On `invoice.payment_failed`: create `PaymentRecord` with `status: 'FAILED'`
- **Verify:** `PaymentRecord` model exists in schema (confirmed)

#### Step 3.1.4: Index Optimization
- **Modify:** `apps/backend/prisma/schema.prisma`
  - Add `@@index([screenId, startTime, endTime])` on `Schedule`
  - Add `@@index([userId, type, createdAt(sort: Desc)])` on `Notification`
  - Add `@@index([workspaceId, createdAt(sort: Desc)])` on `AuditLog`
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_add_indexes/migration.sql`
  - `CREATE INDEX` statements

**Official Source:** PostgreSQL docs — https://www.postgresql.org/docs/current/indexes.html — "Indexes improve query performance but add write overhead. Index only columns used in WHERE clauses"

### 3.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/prisma/schema.prisma` | Modify | ~15 |
| `apps/backend/prisma/migrations/...` | NEW (3 migrations) | ~60 |
| `apps/backend/src/domains/schedules/scheduling.service.ts` | Modify | ~10 |
| `apps/backend/src/domains/screens/screens.service.ts` | Modify | ~5 |
| `apps/backend/src/domains/webhooks/webhooks.service.ts` | Modify | ~15 |

### 3.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Enum migration fails on unexpected string values | Medium | High | Pre-migration audit: `SELECT DISTINCT recurrence FROM "Schedule";` — verify all values match enum |
| Dropping WorkspacePairingCode loses data | Low | Low | Verify table is empty: `SELECT COUNT(*) FROM "WorkspacePairingCode";` |
| New indexes slow down writes | Low | Low | Monitor write performance after migration |

### 3.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Enum migration | `npx prisma migrate deploy` | Migration succeeds |
| Schedule with enum | Create schedule with `recurrence: 'WEEKLY'` | 201 Created |
| Schedule with invalid enum | Create schedule with `recurrence: 'INVALID'` | TypeScript error + 400 |
| WorkspacePairingCode removal | `SELECT FROM "WorkspacePairingCode"` | Table does not exist |
| PaymentRecord | Trigger `invoice.payment_succeeded` webhook | PaymentRecord created in DB |
| Index usage | `EXPLAIN ANALYZE SELECT * FROM "Schedule" WHERE "screenId" = X AND "startTime" < Y` | Index scan, not seq scan |

### 3.5 Definition of Done

- [ ] `RecurrenceType` enum created in `schema.prisma`
- [ ] `Schedule.recurrence` and `ScreenOverrideRule.recurrence` converted to `RecurrenceType`
- [ ] Migration for string → enum conversion (verified on staging first)
- [ ] All service code updated to use `RecurrenceType` enum
- [ ] `WorkspacePairingCode` model removed from schema
- [ ] Migration for table drop (verified table is empty first)
- [ ] All code references to `WorkspacePairingCode` removed
- [ ] `PaymentRecord` creation in webhook handler
- [ ] Indexes added: `Schedule(screenId, startTime, endTime)`, `Notification(userId, type, createdAt)`, `AuditLog(workspaceId, createdAt)`
- [ ] Migration for new indexes
- [ ] `npx prisma validate` passes
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 4: Core Business Logic

### 4.1 Step-by-Step Implementation

#### Step 4.1.1: Install BullMQ
```
npm install @nestjs/bullmq bullmq --workspace apps/backend
```

**Official Source:** NestJS Queues — https://docs.nestjs.com/techniques/queues — "Queues help maintain performance by smoothing out processing peaks"
**Official Source:** BullMQ NestJS — https://docs.bullmq.io/guide/nestjs — Bull is in maintenance mode, BullMQ is actively developed

#### Step 4.1.2: Create Email Queue
- **New file:** `apps/backend/src/common/queues/email-queue.module.ts`
- **New file:** `apps/backend/src/common/queues/email-queue.processor.ts`
  - `@Processor('email')` with 3 retries, exponential backoff (1s, 5s, 30s)
  - Process job: call `EmailService.send()`
- **Modify:** `apps/backend/src/app.module.ts` — register `BullModule.forRoot({ connection: redisService })` and `EmailQueueModule`
- **Modify:** `apps/backend/src/domains/email/email.service.ts` — change from synchronous send to queue enqueue

#### Step 4.1.3: Implement Email Notification Flows
- **Modify:** `apps/backend/src/domains/email/email.service.ts` — add 7 email templates:
  1. **Screen offline** (5-min debounce): triggered by `MaintenanceService` cron
  2. **Team invite**: triggered by `WorkspacesService.inviteMember()`
  3. **Campaign approval/rejection**: triggered by `CampaignsService.approve()/reject()`
  4. **Subscription expiry** (7 days before): triggered by cron
  5. **Password changed**: triggered by `AuthService.changePassword()`
  6. **2FA disabled**: triggered by `TwoFactorService.disableTwoFactor()`
  7. **Storage/screen limit warning** (at 80%): triggered by `MediaService` and `ScreensService`
- All emails enqueued, not sent synchronously

#### Step 4.1.4: Timezone-Aware Scheduling
- **Modify:** `apps/backend/prisma/schema.prisma` — add `timezone String @default("Asia/Dubai")` to `Workspace` model
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_add_workspace_timezone/migration.sql`
- **Modify:** `apps/backend/src/domains/schedules/scheduling.service.ts`
  - Import `date-fns-tz` (already installed)
  - When resolving active content, convert `startTime`/`endTime` from workspace timezone to UTC
  - Use `fromZonedTime()` to convert workspace-local time to UTC
  - Use `toZonedTime()` to display times in workspace timezone
  - Handle DST automatically via `date-fns-tz`

**Official Source:** `date-fns-tz` docs — https://date-fns.org/docs/Time-Zones — "Convert between timezones with IANA timezone names"

#### Step 4.1.5: Seat Limit Enforcement
- **Modify:** `apps/backend/src/domains/workspaces/workspaces.service.ts`
  - In `inviteMember()`: check `subscription.seats` against `memberCount + pendingInvites`
  - In `acceptInvite()`: check `subscription.seats` against `memberCount + 1`
  - If exceeded: throw `DomainException.badRequest(ErrorCode.SEAT_LIMIT_EXCEEDED)`

#### Step 4.1.6: Workspace Pause Enforcement
- **Modify:** `apps/backend/src/common/guards/workspace-pause.guard.ts` — NEW: guard that checks `workspace.paused`
- Apply to all mutation endpoints via controller-level decorator
- Allow read operations when paused
- Return `DomainException.forbidden(ErrorCode.WORKSPACE_PAUSED)`

#### Step 4.1.7: Notification Pagination + Real-Time Push
- **Modify:** `apps/backend/src/domains/notifications/notifications.controller.ts`
  - Add `PaginationQueryDto` to `GET /notifications`
  - Return paginated response with `buildPage()`
- **Modify:** `apps/backend/src/domains/notifications/notifications.service.ts`
  - On notification creation: emit `notification:new` event to `user:{userId}` room via Socket.IO
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - Add `notification:new` event emission helper

### 4.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/package.json` | Modify | ~2 |
| `apps/backend/src/common/queues/email-queue.module.ts` | NEW | ~25 |
| `apps/backend/src/common/queues/email-queue.processor.ts` | NEW | ~40 |
| `apps/backend/src/app.module.ts` | Modify | ~10 |
| `apps/backend/src/domains/email/email.service.ts` | Modify | ~100 |
| `apps/backend/prisma/schema.prisma` | Modify | ~2 |
| `apps/backend/prisma/migrations/...` | NEW | ~5 |
| `apps/backend/src/domains/schedules/scheduling.service.ts` | Modify | ~30 |
| `apps/backend/src/domains/workspaces/workspaces.service.ts` | Modify | ~20 |
| `apps/backend/src/common/guards/workspace-pause.guard.ts` | NEW | ~25 |
| `apps/backend/src/domains/notifications/notifications.controller.ts` | Modify | ~10 |
| `apps/backend/src/domains/notifications/notifications.service.ts` | Modify | ~15 |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Modify | ~10 |

### 4.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Email queue fails when Redis is down | Medium | Medium | Health check + alerting; log warning and continue (email is non-critical) |
| Timezone migration shifts existing schedules | Medium | High | Default to "Asia/Dubai" for existing workspaces (current server timezone) |
| Seat limit enforcement blocks existing over-limit workspaces | Medium | Medium | Warning-only mode for 30 days, then enforce |
| Workspace pause guard blocks legitimate operations | Low | Medium | Only apply to mutations, not reads |

### 4.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Email queue | Trigger screen offline → check Redis queue | Job appears in `bull:email:wait` |
| Email processing | Process queue job → check email provider logs | Email sent |
| Timezone | Create schedule with `timezone: 'America/New_York'` | Content displays at correct EST time |
| DST handling | Create schedule in timezone with DST | Time shifts correctly on DST change |
| Seat limit | Invite beyond plan seats | 403 with `SEAT_LIMIT_EXCEEDED` |
| Workspace pause | Pause workspace → create playlist | 403 with `WORKSPACE_PAUSED` |
| Workspace pause | Pause workspace → list playlists | 200 OK (reads allowed) |
| Notification pagination | `GET /notifications?page=1&pageSize=10` | Paginated response with `total`, `items` |
| Real-time notification | Create notification → dashboard receives | `notification:new` event on dashboard |

### 4.5 Definition of Done

- [ ] `@nestjs/bullmq` and `bullmq` installed
- [ ] `BullModule.forRoot()` registered with Redis connection
- [ ] `EmailQueueModule` and `EmailQueueProcessor` created
- [ ] 7 email notification flows implemented (all via queue)
- [ ] `timezone` field added to `Workspace` model (default: "Asia/Dubai")
- [ ] Schedule times interpreted in workspace timezone
- [ ] DST handling via `date-fns-tz`
- [ ] Seat limit enforcement in `inviteMember()` and `acceptInvite()`
- [ ] `WorkspacePauseGuard` created and applied to mutation endpoints
- [ ] Notification pagination on `GET /notifications`
- [ ] Real-time notification push via Socket.IO `notification:new` event
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 5: Realtime & Player Communication

### 5.1 Step-by-Step Implementation

#### Step 5.1.1: WebSocket Event Validation
- **New files:** `apps/backend/src/domains/realtime/dto/`
  - `screen-register.dto.ts` — `ScreenRegisterPayload`
  - `screen-heartbeat.dto.ts` — `ScreenHeartbeatPayload`
  - `content-sync.dto.ts` — `ContentSyncPayload`
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - Add `@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))` to gateway
  - Type `@MessageBody()` with DTO classes
  - Emit `error` event on validation failure

**Official Source:** NestJS Gateways — https://docs.nestjs.com/websockets/gateways — "WebSocket `@MessageBody()` payloads should be validated like HTTP request bodies"

#### Step 5.1.2: WebSocket Rate Limiting
- **New file:** `apps/backend/src/common/throttler/ws-throttler.guard.ts`
  - Per-connection rate limiting using Redis token bucket
  - Limits: heartbeat 1/10s, register 1/min, content-sync 1/30s
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - Apply `@UseGuards(WsThrottlerGuard)` to gateway
  - On rate limit exceeded: emit `error` event with `RATE_LIMITED` message

#### Step 5.1.3: Offline Event Queue
- **New file:** `apps/backend/src/domains/realtime/offline-event-queue.service.ts`
  - `enqueue(screenId, event, payload)`: push to Redis list `offline:{screenId}`
  - `drain(screenId)`: pop all events from list and deliver to screen
  - Max 100 events per screen, TTL: 24h
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - On `handleScreenRegister()`: call `offlineEventQueue.drain(screenId)`
  - When emitting to offline screen: call `offlineEventQueue.enqueue()` instead

#### Step 5.1.4: Campaign-to-Screen Push
- **Modify:** `apps/backend/src/domains/campaigns/campaigns.service.ts`
  - In `publishCampaign()`: after updating campaign status, emit `campaign:push` to all affected screens
  - Get affected screens from campaign's workspace + targeting rules
  - Use `realtimeGateway.emitToScreen(screenId, 'campaign:push', payload)`

#### Step 5.1.5: Player Version Tracking
- **Modify:** `apps/backend/prisma/schema.prisma` — add `playerVersion String?` to `Screen` model
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_add_player_version/migration.sql`
- **Modify:** `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - In `handleScreenHeartbeat()`: extract `playerVersion` from payload and update `Screen` record
- **Modify:** `apps/backend/src/domains/admin/admin.controller.ts`
  - Include `playerVersion` in fleet monitoring response

### 5.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/src/domains/realtime/dto/*.ts` | NEW (3 files) | ~60 |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Modify | ~40 |
| `apps/backend/src/common/throttler/ws-throttler.guard.ts` | NEW | ~40 |
| `apps/backend/src/domains/realtime/offline-event-queue.service.ts` | NEW | ~50 |
| `apps/backend/src/domains/campaigns/campaigns.service.ts` | Modify | ~15 |
| `apps/backend/prisma/schema.prisma` | Modify | ~2 |
| `apps/backend/prisma/migrations/...` | NEW | ~5 |
| `apps/backend/src/domains/admin/admin.controller.ts` | Modify | ~5 |

### 5.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| WS event validation breaks existing clients | Medium | Medium | Use optional fields in DTOs for backward compatibility |
| Offline queue grows unbounded | Low | Medium | Max 100 events, 24h TTL |
| Rate limiting blocks legitimate high-frequency heartbeats | Low | Low | Set reasonable limits (1/10s for heartbeat) |

### 5.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| WS validation | Send `screen:register` with missing `serialNumber` | `error` event with validation message |
| WS rate limiting | Send 100 heartbeats in 10s | Rate limited after 1st (1/10s limit) |
| Offline queue | Screen offline → emit `content:sync` → screen online | Screen receives queued `content:sync` |
| Campaign push | Publish campaign → connected screens | Screens receive `campaign:push` immediately |
| Player version | Heartbeat with `playerVersion: '2.1.0'` → check DB | `Screen.playerVersion` = '2.1.0' |
| Player version in admin | `GET /admin/fleet` | Response includes `playerVersion` field |

### 5.5 Definition of Done

- [ ] WebSocket event DTOs created for all events
- [ ] `ValidationPipe` applied to WebSocket gateway
- [ ] `WsThrottlerGuard` with Redis-backed per-connection rate limiting
- [ ] `OfflineEventQueueService` with `enqueue()` and `drain()`
- [ ] Max 100 events per screen, 24h TTL
- [ ] Campaign-to-screen push on publish
- [ ] `playerVersion` field on `Screen` model
- [ ] Player version tracked in heartbeat
- [ ] Player version visible in admin fleet monitoring
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 6: Storage & Media System

### 6.1 Step-by-Step Implementation

#### Step 6.1.1: Install sharp
```
npm install sharp --workspace apps/backend
```

#### Step 6.1.2: Signed URL Generation
- **Modify:** `apps/backend/src/common/storage/s3.service.ts`
  - Add `getSignedUrl(key: string, expiresIn: number): Promise<string>`
  - Use `@aws-sdk/s3-request-presigner` with `getSignedUrl()`
- **Modify:** `apps/backend/src/common/storage/storage.interface.ts`
  - Add `getSignedUrl()` to interface
- **Modify:** `apps/backend/src/domains/media/media.controller.ts`
  - Add `GET /media/:id/url` endpoint → returns signed URL (1-hour expiry)
- **Modify:** `apps/backend/src/domains/media/media.service.ts`
  - `getMediaUrl()`: return signed URL from storage service

**Official Source:** Cloudflare R2 docs — https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/ — "Generate presigned URLs for temporary access"

#### Step 6.1.3: File Hash / Integrity Check
- **Modify:** `apps/backend/prisma/schema.prisma` — add `fileHash String?` to `Media` model
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_add_file_hash/migration.sql`
- **Modify:** `apps/backend/src/domains/media/media.service.ts`
  - On upload: calculate `SHA-256` hash using `crypto.createHash('sha256')`
  - Store hash in `Media.fileHash`

#### Step 6.1.4: EXIF Stripping
- **Modify:** `apps/backend/src/domains/media/media.service.ts`
  - On image upload: use `sharp(buffer).rotate().withMetadata({ orientation: true }).toBuffer()`
  - This strips all EXIF except orientation
  - Only apply to image MIME types (JPEG, PNG, WebP)

**Official Source:** sharp docs — https://sharp.pixelplumbing.com/ — `withMetadata()` controls which metadata is preserved

#### Step 6.1.5: Media Expiry Purge Cron
- **Modify:** `apps/backend/src/domains/maintenance/maintenance.service.ts`
  - Add `@Cron('0 4 * * *')` job: purge expired media
  - Query: `prisma.media.findMany({ where: { expiresAt: { lt: new Date() } } })`
  - For each: `storageService.delete(key)` + `prisma.media.delete()`
  - Log count of purged items

### 6.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/package.json` | Modify | ~1 |
| `apps/backend/src/common/storage/storage.interface.ts` | Modify | ~3 |
| `apps/backend/src/common/storage/s3.service.ts` | Modify | ~20 |
| `apps/backend/src/domains/media/media.controller.ts` | Modify | ~10 |
| `apps/backend/src/domains/media/media.service.ts` | Modify | ~40 |
| `apps/backend/prisma/schema.prisma` | Modify | ~2 |
| `apps/backend/prisma/migrations/...` | NEW | ~5 |
| `apps/backend/src/domains/maintenance/maintenance.service.ts` | Modify | ~20 |

### 6.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Signed URLs break frontend media display | Medium | High | Migration period: support both direct and signed URL access |
| `sharp` native module fails in Docker | Low | Medium | Docker multi-stage build with build tools; use `--include=optional` |
| EXIF stripping removes needed metadata | Low | Low | Preserve orientation tag only |
| Media purge cron deletes wrong files | Low | High | Only delete where `expiresAt < now()` — explicit expiry date required |

### 6.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Signed URL | `GET /media/:id/url` | Returns URL with `X-Amz-Expires=3600` (or equivalent) |
| Signed URL access | Access signed URL | File downloads successfully |
| File hash | Upload file → check DB | `Media.fileHash` = SHA-256 of file content |
| EXIF stripping | Upload JPEG with GPS EXIF → download → `exiftool` | No GPS data, orientation preserved |
| Media purge | Create media with `expiresAt` in past → run cron | Media deleted from DB and S3 |

### 6.5 Definition of Done

- [ ] `sharp` installed
- [ ] `getSignedUrl()` in `IStorageService` interface and `S3StorageService`
- [ ] `GET /media/:id/url` endpoint returns signed URL (1-hour expiry)
- [ ] `fileHash` field on `Media` model
- [ ] SHA-256 hash calculated on upload and stored
- [ ] EXIF stripping on image upload (preserve orientation only)
- [ ] Media expiry purge cron (daily at 4am UTC)
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 7: Billing & Integrations

### 7.1 Step-by-Step Implementation

#### Step 7.1.1: Dunning Management
- **Modify:** `apps/backend/prisma/schema.prisma` — add `gracePeriodEndsAt DateTime?` to `Subscription` model
- **New file:** `apps/backend/prisma/migrations/YYYYMMDD_add_grace_period/migration.sql`
- **Modify:** `apps/backend/src/domains/webhooks/webhooks.service.ts`
  - On `invoice.payment_failed`:
    1. Create `PaymentRecord` with `status: 'FAILED'`
    2. Set `subscription.gracePeriodEndsAt = now() + 7 days`
    3. Enqueue dunning email #1
  4. On subsequent failures: enqueue dunning emails #2, #3
- **Modify:** `apps/backend/src/domains/maintenance/maintenance.service.ts`
  - Add `@Cron('0 8 * * *')` job: check subscriptions past grace period → downgrade to FREE plan
- **Modify:** `apps/backend/src/domains/email/email.service.ts`
  - Add 3 dunning email templates (day 1, day 4, day 7)

**Official Source:** Stripe docs — https://docs.stripe.com/billing/revenue-recovery — "Use the `invoice.payment_failed` webhook to monitor subscription payment failure events"
**Note:** Stripe has built-in Smart Retries. Our implementation handles the **application-level** response (grace period, downgrade, emails), not retry logic.

#### Step 7.1.2: API Key Enforcement
- **New file:** `apps/backend/src/common/auth/api-key.guard.ts`
  - Extract API key from `X-API-Key` header
  - Validate against `ApiKey` model in DB
  - Check scopes: `read`, `write`, `admin`
  - Attach `apiKey` to request context
- **New file:** `apps/backend/src/common/auth/api-key.decorator.ts`
  - `@RequireApiKeyScope('read')` decorator
- **Modify:** Relevant controllers (data export, webhook management, public API) — apply `@UseGuards(ApiKeyAuthGuard)`

#### Step 7.1.3: Webhook Retry Policy
- **New file:** `apps/backend/prisma/schema.prisma` — add `WebhookDeliveryLog` model (if not exists)
  - Fields: `id`, `webhookId`, `attempt`, `statusCode`, `responseBody`, `createdAt`
- **New file:** `apps/backend/src/domains/webhooks/webhook-delivery.service.ts`
  - `deliverWebhook()`: send HTTP POST with 3 retries (1m, 10m, 1h backoff)
  - Log each attempt in `WebhookDeliveryLog`
  - Dead letter: after 3 failures, mark as `PERMANENTLY_FAILED` and alert admin

### 7.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/prisma/schema.prisma` | Modify | ~15 |
| `apps/backend/prisma/migrations/...` | NEW (2) | ~20 |
| `apps/backend/src/domains/webhooks/webhooks.service.ts` | Modify | ~30 |
| `apps/backend/src/domains/maintenance/maintenance.service.ts` | Modify | ~15 |
| `apps/backend/src/domains/email/email.service.ts` | Modify | ~30 |
| `apps/backend/src/common/auth/api-key.guard.ts` | NEW | ~50 |
| `apps/backend/src/common/auth/api-key.decorator.ts` | NEW | ~10 |
| `apps/backend/src/domains/webhooks/webhook-delivery.service.ts` | NEW | ~60 |
| Various controllers | Modify | ~10 |

### 7.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| API key enforcement breaks existing integrations | Medium | Medium | 30-day grace period with warning logs before enforcing |
| Dunning downgrade surprises users | Low | Medium | 3 email reminders before downgrade (day 1, 4, 7) |
| Webhook retry causes duplicate deliveries | Low | Low | Idempotency key in webhook payload |

### 7.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Dunning | Trigger `invoice.payment_failed` webhook | `gracePeriodEndsAt` set, email #1 sent |
| Dunning expiry | Set `gracePeriodEndsAt` in past → run cron | Subscription downgraded to FREE |
| API key invalid | Request with `X-API-Key: invalid` | 401 Unauthorized |
| API key valid + wrong scope | `@RequireApiKeyScope('write')` with read-only key | 403 Forbidden |
| Webhook retry | Webhook endpoint returns 500 | Retried 3 times with backoff |
| Webhook dead letter | Webhook endpoint returns 500 x3 | Marked `PERMANENTLY_FAILED` |

### 7.5 Definition of Done

- [ ] `gracePeriodEndsAt` field on `Subscription` model
- [ ] Dunning flow on `invoice.payment_failed` (grace period + 3 emails)
- [ ] Cron job for grace period expiry → downgrade
- [ ] `PaymentRecord` creation on invoice webhooks (succeeded + failed)
- [ ] `ApiKeyAuthGuard` created
- [ ] `@RequireApiKeyScope()` decorator created
- [ ] API key guard applied to relevant controllers
- [ ] `WebhookDeliveryLog` model
- [ ] `WebhookDeliveryService` with 3 retries + exponential backoff
- [ ] Dead letter handling for permanently failed deliveries
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 8: Testing & Quality

### 8.1 Step-by-Step Implementation

#### Step 8.1.1: Missing Module Specs
- **New files:** Spec files for 8 modules with zero specs:
  - `apps/backend/src/domains/admin/admin.controller.spec.ts`
  - `apps/backend/src/domains/admin/admin.service.spec.ts`
  - `apps/backend/src/domains/workspaces/workspaces.service.spec.ts`
  - `apps/backend/src/domains/notifications/notifications.service.spec.ts`
  - `apps/backend/src/domains/islamic/islamic.controller.spec.ts`
  - `apps/backend/src/domains/islamic/prayer-times.service.spec.ts`
  - `apps/backend/src/domains/api-keys/api-keys.service.spec.ts`
- Each spec: test all public methods, error cases, edge cases
- Use existing test patterns (mocked `PrismaService`)

**Official Source:** NestJS Testing — https://docs.nestjs.com/fundamentals/testing — "Unit tests with mocked dependencies verify business logic in isolation"

#### Step 8.1.2: Integration Tests
- **New file:** `apps/backend/test/integration/` directory
- Install `@testcontainers/postgresql` for real DB testing
- Test full CRUD cycles for: Auth, Screens, Playlists, Media, Schedules, Campaigns
- Test Prisma constraints, relations, and transactions

#### Step 8.1.3: E2E Test Suite
- **New files:** `apps/backend/test/e2e/` directory
  - `auth.e2e-spec.ts` — register → verify → login → refresh → logout
  - `pairing.e2e-spec.ts` — start → poll → claim → bootstrap
  - `content.e2e-spec.ts` — upload → playlist → assign → schedule → bootstrap
  - `campaign.e2e-spec.ts` — create → submit → approve → publish → end
  - `billing.e2e-spec.ts` — mock plan → checkout → webhook → subscription sync
- Use `supertest` (already installed) with NestJS app instance

**Official Source:** NestJS E2E Testing — https://docs.nestjs.com/fundamentals/e2e-testing — "E2E tests verify the full HTTP → Controller → Service → response cycle"

#### Step 8.1.4: Test Data Factories
- **New files:** `apps/backend/test/factories/`
  - `user.factory.ts` — `build()` returns object, `create()` inserts into DB
  - `workspace.factory.ts`
  - `screen.factory.ts`
  - `playlist.factory.ts`
  - `media.factory.ts`

#### Step 8.1.5: Coverage Threshold Raise
- **Modify:** `apps/backend/package.json`
  - Raise `coverageThreshold` incrementally:
    - First: 50% lines, 45% branches
    - Then: 60% lines, 50% branches
    - Final: 70% lines, 60% branches

#### Step 8.1.6: CI Test Pipeline Enhancement
- **Modify:** `.github/workflows/ci.yml`
  - Add backend coverage step: `npm run test:cov -w apps/backend`
  - Add backend E2E step: `npm run test:e2e -w apps/backend` (with Testcontainers)
  - Fail PR if coverage drops below threshold
  - **Note:** CI already runs `npm run verify` which includes tests. This adds coverage enforcement and backend E2E.

### 8.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| 7 spec files | NEW | ~700 |
| `apps/backend/test/integration/*.spec.ts` | NEW (6 files) | ~600 |
| `apps/backend/test/e2e/*.e2e-spec.ts` | NEW (5 files) | ~500 |
| `apps/backend/test/factories/*.factory.ts` | NEW (5 files) | ~250 |
| `apps/backend/package.json` | Modify | ~5 |
| `.github/workflows/ci.yml` | Modify | ~15 |

### 8.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Coverage threshold raise blocks PRs | High | Low | Raise incrementally (42% → 50% → 60% → 70%) |
| Testcontainers requires Docker in CI | Low | Low | GitHub Actions supports Docker natively |
| E2E tests are slow | Medium | Low | Run E2E only on PRs, not on every push |

### 8.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Module specs | `npm test -w apps/backend` | All specs pass |
| Integration tests | `npm run test:integration -w apps/backend` | All integration tests pass |
| E2E tests | `npm run test:e2e -w apps/backend` | All E2E tests pass |
| Coverage | `npm run test:cov -w apps/backend` | Coverage ≥ 70% lines |
| CI | Push PR | CI runs all tests, fails if coverage < threshold |

### 8.5 Definition of Done

- [ ] Spec files for all 7 missing modules (admin controller+service, workspaces, notifications, islamic controller+prayer-times, api-keys)
- [ ] Integration test suite with Testcontainers (6 CRUD cycles)
- [ ] E2E test suite (5 business flows)
- [ ] Test data factories (5 factories)
- [ ] Coverage threshold raised to 70% lines, 60% branches
- [ ] CI pipeline runs backend tests with coverage enforcement
- [ ] CI pipeline runs backend E2E tests
- [ ] All tests pass
- [ ] Coverage ≥ 70%

---

## Phase 9: Performance & Scaling

### 9.1 Step-by-Step Implementation

#### Step 9.1.1: Redis Cache-Aside
- **New file:** `apps/backend/src/common/cache/cache.module.ts`
- **New file:** `apps/backend/src/common/cache/cache.service.ts`
  - `get<T>(key: string): Promise<T | null>` — get from Redis, return null on miss
  - `set<T>(key: string, value: T, ttl: number): Promise<void>` — set in Redis with TTL
  - `del(key: string): Promise<void>` — delete from Redis
  - `getOrSet<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T>` — cache-aside with single-flight
- **Modify:** `apps/backend/src/common/auth/account-context.helper.ts`
  - Cache `resolveForWorkspace()` result with 5-min TTL
  - Invalidate on role change
- **Modify:** `apps/backend/src/domains/islamic/prayer-times.service.ts`
  - Cache `getPrayerTimes()` with 1-hour TTL
- **Modify:** `apps/backend/src/domains/islamic/ramadan.service.ts`
  - Cache Ramadan config with 1-hour TTL
- **Modify:** `apps/backend/src/domains/admin/feature-flags.service.ts`
  - Cache feature flags with 10-min TTL
  - Invalidate on flag toggle

**Official Source:** Redis docs — https://redis.io/docs/latest/develop/use-cases/cache-aside/nodejs/ — "Instead of querying the primary database on every request, the application checks Redis first"

#### Step 9.1.2: N+1 Query Audit
- Audit all list endpoints using Prisma query log
- Key endpoints: admin customers, screen list with playlists, workspace members
- Fix with `include` or `select` to batch-load relations
- Use `prisma.$queryRaw` for complex aggregations if needed

#### Step 9.1.3: API Serialization Layer
- **New files:** `apps/backend/src/common/serialization/`
  - `screen-response.dto.ts`, `playlist-response.dto.ts`, `workspace-response.dto.ts`, etc.
  - `serialization.interceptor.ts` — transforms Prisma models to response DTOs
- **Modify:** `apps/backend/src/app.module.ts` — register `SerializationInterceptor` globally
- Use `ClassSerializerInterceptor` with `@Exclude()` / `@Expose()` decorators
- **Feature flag:** `SERIALIZATION_ENABLED` env var for gradual rollout

**Official Source:** NestJS Serialization — https://docs.nestjs.com/techniques/serialization — "Use ClassSerializerInterceptor to transform response objects"

#### Step 9.1.4: OpenAPI/Swagger Documentation
```
npm install @nestjs/swagger --workspace apps/backend
```
- **Modify:** `apps/backend/src/main.ts`
  - Set up `DocumentBuilder` with title, version, description
  - `SwaggerModule.setup('api/v1/docs', app, document)`
- **Modify:** All controllers — add `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
- **Modify:** All DTOs — add `@ApiProperty()` to all fields
- **Note:** This is a large task but purely additive (decorators don't change behavior)

**Official Source:** NestJS OpenAPI — https://docs.nestjs.com/openapi/introduction — "Auto-generated API documentation"

#### Step 9.1.5: Static Asset Cache-Control
- For S3: configure bucket lifecycle policy with `Cache-Control: public, max-age=31536000, immutable` metadata
- For any remaining static assets on API: add `Cache-Control` header in middleware

### 9.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `apps/backend/src/common/cache/cache.module.ts` | NEW | ~15 |
| `apps/backend/src/common/cache/cache.service.ts` | NEW | ~60 |
| `apps/backend/src/common/auth/account-context.helper.ts` | Modify | ~15 |
| `apps/backend/src/domains/islamic/prayer-times.service.ts` | Modify | ~10 |
| `apps/backend/src/domains/islamic/ramadan.service.ts` | Modify | ~10 |
| `apps/backend/src/domains/admin/feature-flags.service.ts` | Modify | ~10 |
| `apps/backend/src/common/serialization/*.ts` | NEW (multiple) | ~200 |
| `apps/backend/src/app.module.ts` | Modify | ~5 |
| `apps/backend/package.json` | Modify | ~1 |
| `apps/backend/src/main.ts` | Modify | ~10 |
| All controllers (20+) | Modify | ~200 |
| All DTOs (30+) | Modify | ~150 |

### 9.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cache invalidation bugs serve stale data | Medium | Medium | Explicit invalidation on all mutation paths + short TTLs |
| Serialization layer changes API response shapes | Medium | High | Feature flag for gradual rollout, frontend coordination |
| Swagger decorators add maintenance burden | Low | Low | Auto-generated from decorators, minimal ongoing effort |

### 9.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Cache hit | First request → check Prisma query log → second request | Second request: no DB query |
| Cache invalidation | Mutate cached entity → next request | Fresh data from DB |
| N+1 audit | Enable Prisma query log → call list endpoints | No N+1 patterns |
| Serialization | `GET /api/v1/screens` → check response | No `createdAt`/`updatedAt` (where excluded) |
| Swagger UI | `GET /api/v1/docs` | Swagger UI loads with all endpoints |
| OpenAPI spec | `GET /api/v1/docs-json` | Valid OpenAPI 3.0 JSON |

### 9.5 Definition of Done

- [ ] `CacheService` with `get()`, `set()`, `del()`, `getOrSet()` using Redis
- [ ] Caching for `AccountContextHelper` (5-min TTL), `PrayerTimes` (1h), `Ramadan` (1h), `FeatureFlags` (10min)
- [ ] Cache invalidation on all mutation paths
- [ ] N+1 queries audited and fixed
- [ ] Response DTOs for all major entities
- [ ] `SerializationInterceptor` registered globally (with feature flag)
- [ ] `@nestjs/swagger` installed and configured
- [ ] All controllers decorated with `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- [ ] All DTOs decorated with `@ApiProperty`
- [ ] Swagger UI accessible at `/api/v1/docs`
- [ ] S3 bucket lifecycle policy for Cache-Control
- [ ] TypeScript compiles with 0 errors
- [ ] All existing tests pass

---

## Phase 10: Production Readiness

### 10.1 Step-by-Step Implementation

#### Step 10.1.1: Optimize Docker Multi-Stage Build
- **Modify:** `Dockerfile.backend`
  - Current: 2 stages (builder + runner) with `node:20-bookworm-slim`
  - Optimized: 3 stages:
    1. `builder` — `node:20-bookworm-slim` (compile TypeScript, generate Prisma)
    2. `deps` — `node:20-alpine` (install production dependencies only)
    3. `runner` — `node:20-alpine` (minimal: copy dist + node_modules + prisma)
  - Use `npm ci --omit=dev` in deps stage
  - Remove `npm install class-validator --no-save` hack
  - Target image size: < 300MB

**Official Source:** Docker Node.js Guide — https://docs.docker.com/guides/nodejs/ — "Use a separate stage for building and a minimal stage for running"
**Note:** Current Dockerfile IS already multi-stage (2 stages). This step **optimizes** it (3 stages, alpine, smaller image).

#### Step 10.1.2: Zero-Downtime Deployment
- **Modify:** `Dockerfile.backend` CMD
  - Remove `prisma migrate deploy` from CMD
  - Migrations run as a **separate pre-deploy step** (K8s init container or CI step)
- **New file:** `scripts/pre-deploy.sh` — runs `prisma migrate deploy` before app deployment
- **Document:** Deployment strategy in `docs/DEPLOYMENT.md`
  - Expand-contract migration pattern: add column first → deploy new code → remove old column
  - Rolling updates with health check gating

**Official Source:** Prisma docs — https://www.prisma.io/docs/orm/prisma-migrate/production-deployment — "Run migrations as part of your deployment pipeline, not at application startup"

#### Step 10.1.3: Backup Automation
- **Modify:** `scripts/backup.sh` — enhance with:
  - S3 upload of backup file
  - 30-day retention policy (delete older backups)
  - Backup verification: restore to staging, run smoke tests
- **New file:** K8s CronJob manifest or crontab entry for daily `pg_dump`

#### Step 10.1.4: CDN Configuration
- Configure Cloudflare in front of S3/R2 bucket
- Origin: S3 bucket or R2 bucket
- Cache behavior: all media files, 1-year TTL
- Signed URLs: Cloudflare signed URLs or S3 presigned URLs
- **Document:** CDN setup in `docs/DEPLOYMENT.md`

**Official Source:** Cloudflare docs — https://developers.cloudflare.com/r2/ — R2 can be served directly via custom domain with CDN caching

#### Step 10.1.5: TLS Certificate Automation
- For non-cloud: Let's Encrypt with certbot
- For AWS: AWS Certificate Manager
- Auto-renewal: certbot cron or ACM auto-renew
- **Document:** TLS setup in `docs/DEPLOYMENT.md`

#### Step 10.1.6: Admin Session Timeout
- **Modify:** `apps/backend/src/domains/auth/jwt.strategy.ts`
  - For admin-only tokens: use `ADMIN_JWT_EXPIRES_IN` env var (default: 3600s = 1 hour)
  - Detect admin tokens by `role` claim in JWT payload
- **Modify:** `.env.example` — add `ADMIN_JWT_EXPIRES_IN=3600`

#### Step 10.1.7: IP Allowlist for Admin
- **New file:** `apps/backend/src/common/middleware/admin-ip-allowlist.ts`
  - Check `req.ip` against `ADMIN_ALLOWED_IPS` env var (comma-separated CIDR ranges)
  - Apply only to `/api/v1/admin/*` routes
  - Return 403 if IP not in allowlist
  - If `ADMIN_ALLOWED_IPS` is not set, skip (backward compatible)
- **Modify:** `apps/backend/src/app.module.ts` — apply middleware to admin routes
- **Modify:** `.env.example` — add `ADMIN_ALLOWED_IPS=`

**Official Source:** OWASP Access Control Cheat Sheet — "Restrict admin access to known IP ranges"

#### Step 10.1.8: Final Penetration Test
- Run OWASP ZAP automated scan against staging
- Manual penetration test: auth, authorization, injection, SSRF, file upload
- Fix all P0 findings before production launch
- Document findings in `audits/backend/penetration-test-report.md`

### 10.2 Files Modified/Created

| File | Action | Lines (est.) |
|------|--------|-------------|
| `Dockerfile.backend` | Modify | ~30 |
| `scripts/pre-deploy.sh` | NEW | ~15 |
| `scripts/backup.sh` | Modify | ~20 |
| `docs/DEPLOYMENT.md` | NEW | ~100 |
| `apps/backend/src/domains/auth/jwt.strategy.ts` | Modify | ~15 |
| `apps/backend/src/common/middleware/admin-ip-allowlist.ts` | NEW | ~30 |
| `apps/backend/src/app.module.ts` | Modify | ~5 |
| `.env.example` | Modify | ~5 |
| `.github/workflows/ci.yml` | Modify | ~10 |
| `audits/backend/penetration-test-report.md` | NEW | ~50 |

### 10.3 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Zero-downtime deploy fails due to incompatible migration | Medium | High | Expand-contract pattern: add columns first, deploy, then remove |
| IP allowlist locks out admins | Low | High | Fallback bypass with MFA; document emergency procedure |
| CDN cache serves stale media | Low | Low | Cache invalidation on media update + short TTL for mutable content |
| Docker alpine image missing native deps | Low | Medium | Test build in CI before deploying |

### 10.4 Testing Method

| Test | Method | Expected Result |
|------|--------|-----------------|
| Docker image size | `docker images` after build | < 300MB |
| Zero-downtime deploy | Rolling update with continuous health check | No 503s during update |
| Pre-deploy migrations | Run `scripts/pre-deploy.sh` | Migrations applied, app starts without migration step |
| Backup | Run `scripts/backup.sh` | Backup file in S3, 30-day retention enforced |
| Backup restore | Restore backup to staging | Smoke tests pass |
| CDN | Access media via CDN URL | `X-Cache: Hit from cloudfront` (or equivalent) |
| TLS | `curl https://api.example.com/health` | Valid certificate, 200 response |
| Admin timeout | Admin login → wait 1 hour → next request | 401 (token expired) |
| Admin IP allowlist | Admin request from non-allowlisted IP | 403 Forbidden |
| OWASP ZAP | Run automated scan | No P0 findings |
| Penetration test | Manual test of auth, authorization, injection | No P0 findings |

### 10.5 Definition of Done

- [ ] Docker multi-stage build optimized (3 stages, alpine runner, < 300MB)
- [ ] `prisma migrate deploy` removed from Docker CMD
- [ ] `scripts/pre-deploy.sh` created
- [ ] Zero-downtime deployment strategy documented in `docs/DEPLOYMENT.md`
- [ ] Expand-contract migration pattern documented
- [ ] Backup automation with S3 upload and 30-day retention
- [ ] Weekly backup verification
- [ ] CDN configured for media (Cloudflare in front of S3/R2)
- [ ] TLS certificate automation configured
- [ ] `ADMIN_JWT_EXPIRES_IN` env var (default: 1 hour)
- [ ] Admin tokens expire after 1 hour
- [ ] `AdminIpAllowlistMiddleware` created and applied to `/admin/*` routes
- [ ] `ADMIN_ALLOWED_IPS` env var
- [ ] OWASP ZAP scan: no P0 findings
- [ ] Manual penetration test completed
- [ ] All P0 findings fixed
- [ ] `docs/DEPLOYMENT.md` created
- [ ] TypeScript compiles with 0 errors
- [ ] All tests pass
- [ ] Coverage ≥ 70%

---

## Final Review

### Is There Anything Missing Before Starting?

| # | Item | Status | Action Needed |
|---|------|--------|---------------|
| 1 | Stakeholder decision: S3 provider (MinIO vs R2 vs AWS S3) | **PENDING** | Must decide before Phase 1 Step 1.1.5 |
| 2 | Stakeholder decision: CDN provider | **PENDING** | Must decide before Phase 10 Step 10.1.4 |
| 3 | Stakeholder decision: Deployment platform | **PENDING** | Must decide before Phase 10 |
| 4 | Stakeholder decision: Email queue Redis strategy | **PENDING** | Must decide before Phase 4 Step 4.1.2 |
| 5 | Stakeholder decision: Coverage threshold target | **PENDING** | Must decide before Phase 8 Step 8.1.5 |
| 6 | Stakeholder decision: API serialization approach | **PENDING** | Must decide before Phase 9 Step 9.1.3 |
| 7 | Stakeholder decision: Shared secret removal strategy | **PENDING** | Must decide before Phase 2 Step 2.1.5 |
| 8 | Existing media file count in `uploads/` | **UNKNOWN** | Check before Phase 1 to plan migration |
| 9 | Existing 2FA users with plaintext secrets | **UNKNOWN** | Check before Phase 2 to assess migration scope |
| 10 | Existing screens using shared secret | **UNKNOWN** | Check before Phase 2 to assess re-pairing scope |

### Is There a Better Order?

**No.** The current order is optimal because:

1. **Phase 1 must be first** — 4 phases depend on Redis, 2 depend on S3. No phase can proceed without it.
2. **Phases 2 and 3 can parallel Phase 1** — They have no dependencies on Redis or S3.
3. **Phase 4 must follow Phase 1** — Email queue needs Redis, real-time notifications need Redis WS adapter.
4. **Phase 5 must follow Phase 1** — WS rate limiting and offline queue need Redis.
5. **Phase 6 must follow Phase 1** — Signed URLs need S3 adapter.
6. **Phase 7 must follow Phase 4** — Dunning emails need email queue.
7. **Phase 8 must follow Phases 1-7** — Tests should cover all implemented features.
8. **Phase 9 must follow Phase 1** — Cache needs Redis. Serialization should happen after features are stable.
9. **Phase 10 must follow all** — Final hardening requires everything in place.

**Alternative considered:** Move Phase 8 (Testing) earlier, after Phase 1. **Rejected** because tests would need to be rewritten as features change in Phases 2-7. Better to test the final implementation.

### Are There Hidden Risks?

| # | Hidden Risk | Why It's Hidden | Mitigation |
|---|-------------|-----------------|------------|
| 1 | **Redis memory usage** — Offline event queues + email queues + cache all use same Redis | Not mentioned in any audit | Monitor Redis memory; set `maxmemory-policy` to `allkeys-lru`; separate Redis DBs if needed |
| 2 | **S3 cost** — MinIO is free but R2/AWS S3 has per-request costs | Not a technical risk but a business risk | Start with MinIO (self-hosted), migrate to R2 (no egress fees) when ready |
| 3 | **Migration ordering** — Phase 2 and Phase 3 both add migrations. If run in parallel, migration order matters | Parallel execution risk | Coordinate migration numbering; run migrations sequentially even if code changes are parallel |
| 4 | **Frontend impact** — Phase 6 (signed URLs) and Phase 9 (serialization) change API response shapes | Frontend not considered in backend plan | Coordinate with frontend team; use feature flags; test frontend against new API shapes |
| 5 | **Stripe webhook signature verification** — Adding PaymentRecord creation to webhook handler increases processing time | Not mentioned in any audit | Keep webhook handler fast; enqueue heavy processing via BullMQ |
| 6 | **`sharp` native module in Docker alpine** — Alpine may lack required shared libraries | Alpine uses musl, not glibc | Use `node:20-alpine` with `apk add --no-cache vips-dev` or use `node:20-bookworm-slim` for runner |
| 7 | **Circular dependency** — Phase 4 adds `WorkspacePauseGuard` which needs `WorkspacesService`, but `WorkspacesService` may need guard | Architectural risk | Guard reads `workspace.paused` directly from Prisma, doesn't depend on `WorkspacesService` |
| 8 | **Testcontainers in CI** — GitHub Actions Docker support may have resource limits | CI environment risk | Use GitHub Actions PostgreSQL service container as fallback |

---

## Summary

| Metric | Value |
|--------|-------|
| Total phases | 10 |
| Total gaps addressed | 63 |
| P0 gaps (blocks production) | 5 |
| P1 gaps (before launch) | 16 |
| P2 gaps (important improvement) | 28 |
| P3 gaps (future improvement) | 14 |
| New files to create | ~40 |
| Existing files to modify | ~50 |
| New npm packages | 8 (`ioredis`, `@socket.io/redis-adapter`, `@aws-sdk/client-s3`, `@nestjs/terminus`, `@nestjs/bullmq`, `bullmq`, `sharp`, `@nestjs/swagger`) |
| New Prisma migrations | ~10 |
| Estimated duration (2 devs) | ~18 weeks |
| Estimated duration (4 devs) | ~9 weeks |

**The plan is ready for execution. Start with Phase 1.**
