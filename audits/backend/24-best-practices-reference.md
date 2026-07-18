# 24 — Best Practices Reference

> **Objective:** Document the authoritative best practices for each area of the backend, citing official sources only. For each practice, state whether the current project complies or needs modification.

> **Sources Policy:** Only official documentation is cited. No blog posts, no tutorials, no third-party articles.

---

## 1. Architecture

### Practice: Modular Monolith with Domain-Driven Module Organization
- **Source:** [NestJS Official Documentation — Modules](https://docs.nestjs.com/modules)
- **Rationale:** NestJS is designed around modules as the primary organizational unit. Domain-driven module separation keeps cohesion high and coupling low.
- **Project Status:** ✅ **Compliant** — 22 domain modules under `domains/`, each with controller, service, DTOs, and module definition.

### Practice: Global Prefix for API Versioning
- **Source:** [NestJS Official Documentation — Global Prefix](https://docs.nestjs.com/faq/global-prefix)
- **Rationale:** A global prefix (`/api/v1`) separates API routes from system routes (health, metrics, webhooks) and signals API version.
- **Project Status:** ✅ **Compliant** — `app.setGlobalPrefix('api/v1', { exclude: ['health', 'ready', 'metrics'] })`.

### Practice: Enable Shutdown Hooks
- **Source:** [NestJS Official Documentation — Application Lifecycle](https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown)
- **Rationale:** `app.enableShutdownHooks()` ensures NestJS listens for system termination signals and runs `onModuleDestroy()`, `onApplicationShutdown()` lifecycle hooks.
- **Project Status:** ❌ **Not Compliant** — `main.ts` does not call `app.enableShutdownHooks()`. No SIGTERM handler.

### Practice: Use `@nestjs/terminus` for Health Checks
- **Source:** [NestJS Official Documentation — Health Checks](https://docs.nestjs.com/recipes/terminus)
- **Rationale:** Terminus provides a structured way to implement liveness/readiness probes with dependency checks.
- **Project Status:** ⚠️ **Partial** — Custom health controller exists, but only checks Prisma `$connect()`. No Redis, S3, or email provider checks.

---

## 2. Database

### Practice: Single Global PrismaClient Instance
- **Source:** [Prisma Official Documentation — Best Practices](https://www.prisma.io/docs/orm/more/best-practices)
- **Rationale:** "Create one global PrismaClient instance and reuse it throughout your application. Creating multiple instances creates multiple connection pools, which can exhaust your database's connection limit."
- **Project Status:** ✅ **Compliant** — `PrismaService` extends `PrismaClient`, registered as a singleton in `PrismaModule`.

### Practice: Use `prisma migrate deploy` in Production
- **Source:** [Prisma Official Documentation — Best Practices](https://www.prisma.io/docs/orm/more/best-practices)
- **Rationale:** "Use only `prisma migrate deploy` with committed migrations. Never use `migrate dev` (can prompt to reset DB) or `db push` (can be destructive)."
- **Project Status:** ✅ **Compliant** — `prisma:migrate` script uses `prisma migrate deploy`.

### Practice: Configure Connection Pool for Driver Adapters
- **Source:** [Prisma Official Documentation — Connection Pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool)
- **Rationale:** Prisma ORM v7 with driver adapters relies on the Node.js driver for connection pooling. For `pg` adapter, defaults are: `max: 10`, `connectionTimeoutMillis: 0`, `idleTimeoutMillis: 10s`. These should be explicitly configured.
- **Project Status:** ❌ **Not Compliant** — `PrismaService` uses `PrismaPg` adapter with no explicit pool configuration. Relies on defaults.

### Practice: Use Transactions for Multi-Step Operations
- **Source:** [Prisma Official Documentation — Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions)
- **Rationale:** Transactions ensure atomicity for operations that must succeed or fail together.
- **Project Status:** ⚠️ **Partial** — Some services use transactions (subscription sync), but pairing claim and media deletion are not wrapped in transactions.

---

## 3. Authentication

### Practice: JWT with Short-Lived Access Tokens and Refresh Tokens
- **Source:** [OWASP Top 10:2021 — A07 Identification and Authentication Failures](https://owasp.org/Top10/2021/A07_2021-Identification_and_Authentication_Failures/)
- **Rationale:** Short-lived access tokens limit the window of opportunity for token theft. Refresh tokens allow session continuity without re-authentication.
- **Project Status:** ✅ **Compliant** — JWT access + refresh tokens with `typ` claim to prevent type confusion. Per-session refresh token storage in DB.

### Practice: Brute-Force Protection with Lockout
- **Source:** [OWASP Top 10:2021 — A07 Identification and Authentication Failures](https://owasp.org/Top10/2021/A07_2021-Identification_and_Authentication_Failures/)
- **Rationale:** Rate limiting alone is insufficient for login endpoints. Per-account lockout prevents credential stuffing.
- **Project Status:** ✅ **Compliant** — `LoginLockoutService` with per-email lockout. OTP verification throttled at 10/min.

### Practice: Password Hashing with bcrypt
- **Source:** [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- **Rationale:** bcrypt with sufficient work factor (cost ≥ 10) provides adequate protection against offline attacks.
- **Project Status:** ✅ **Compliant** — `bcryptjs` with default salt rounds (10).

### Practice: Password Complexity Requirements
- **Source:** [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- **Rationale:** Enforce minimum length (≥8), complexity (uppercase, lowercase, number, special character) to resist brute-force.
- **Project Status:** ❌ **Not Compliant** — No password complexity validation in registration or password reset DTOs.

### Practice: TOTP 2FA with Backup Codes
- **Source:** [OWASP Multi-Factor Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- **Rationale:** TOTP provides phishing-resistant second factor. Backup codes ensure access when device is lost.
- **Project Status:** ✅ **Compliant** — `otplib` for TOTP, 8 backup codes per user. QR code generation via `qrcode` package.

---

## 4. Authorization

### Practice: Role-Based Access Control (RBAC)
- **Source:** [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- **Rationale:** RBAC restricts access based on user roles within a tenant context.
- **Project Status:** ✅ **Compliant** — 4 workspace roles (OWNER/ADMIN/EDITOR/VIEWER) + 3 platform staff roles. `RolesGuard` with `@Roles()` decorator.

### Practice: Verify Authorization in Database, Not Just JWT
- **Source:** [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- **Rationale:** JWT claims can be stale. Critical operations should verify current state in the database.
- **Project Status:** ✅ **Compliant** — `SuperAdminDbGuard` and `PlatformStaffDbGuard` verify roles in DB. `JwtStrategy.validate()` checks `user.isActive` in DB on every request.

### Practice: Tenant Isolation at Query Level
- **Source:** [OWASP Access Control Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- **Rationale:** Multi-tenant applications must scope all queries by tenant ID to prevent cross-tenant data leakage.
- **Project Status:** ⚠️ **Partial** — Services query by `workspaceId`, but no DB-level enforcement (RLS). Application-level only.

---

## 5. Security

### Practice: Helmet for HTTP Security Headers
- **Source:** [NestJS Official Documentation — Helmet](https://docs.nestjs.com/security/helmet)
- **Rationale:** Helmet sets security headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.) to protect against common vulnerabilities.
- **Project Status:** ✅ **Compliant** — Helmet enabled with CSP/COEP/CORP disabled (appropriate for JSON API).

### Practice: CORS with Explicit Allow-List
- **Source:** [NestJS Official Documentation — CORS](https://docs.nestjs.com/security/cors)
- **Rationale:** Production CORS must use an explicit allow-list, never origin-reflection.
- **Project Status:** ✅ **Compliant** — `createCorsOriginChecker()` with production fail-fast for missing `ALLOWED_ORIGINS`.

### Practice: Rate Limiting with `@nestjs/throttler`
- **Source:** [NestJS Official Documentation — Rate Limiting](https://docs.nestjs.com/security/rate-limiting)
- **Rationale:** Throttler protects against brute-force and abuse. Per-endpoint overrides for sensitive routes.
- **Project Status:** ✅ **Compliant** — `ThrottlerModule` with 300/min default, per-endpoint `@Throttle()` overrides, `UserThrottlerGuard` for user-based tracking.
- **Note:** In-memory store. Needs `@nest-labs/throttler-storage-redis` for multi-instance.

### Practice: CSRF Protection for Cookie-Based Auth
- **Source:** [NestJS Official Documentation — CSRF](https://docs.nestjs.com/security/csrf)
- **Rationale:** Double-submit token pattern prevents CSRF for state-changing operations when using HTTP-only cookies.
- **Project Status:** ✅ **Compliant** — `CsrfMiddleware` with double-submit token, route exemptions for auth/webhooks.

### Practice: Input Validation with Global ValidationPipe
- **Source:** [NestJS Official Documentation — Validation](https://docs.nestjs.com/techniques/validation)
- **Rationale:** Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform` ensures only validated data reaches services.
- **Project Status:** ✅ **Compliant** — `ValidationPipe` with `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`.

### Practice: File Content Type Detection
- **Source:** [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- **Rationale:** Never trust file extensions for MIME type. Use content sniffing to verify file type.
- **Project Status:** ✅ **Compliant** — `media.service.ts` uses `fileTypeFromBuffer()` from `file-type` library to sniff MIME type from file content.

### Practice: OWASP Top 10 Compliance
- **Source:** [OWASP Top 10:2021](https://owasp.org/Top10/2021/)
- **Rationale:** The OWASP Top 10 is the minimum standard for web application security.
- **Project Status:** ⚠️ **Partial** — See audit 16 for detailed coverage. Main gaps: A02 (2FA secrets plaintext), A06 (no dependency scanning), A07 (no password complexity).

---

## 6. API Design

### Practice: Global ValidationPipe with `forbidNonWhitelisted`
- **Source:** [NestJS Official Documentation — Validation](https://docs.nestjs.com/techniques/validation)
- **Rationale:** `forbidNonWhitelisted` rejects requests with unknown properties, preventing mass assignment vulnerabilities.
- **Project Status:** ✅ **Compliant** — Enabled in `main.ts`.

### Practice: Centralized Error Handling
- **Source:** [NestJS Official Documentation — Exception Filters](https://docs.nestjs.com/exception-filters)
- **Rationale:** A global exception filter ensures consistent error response format and prevents stack trace leakage.
- **Project Status:** ✅ **Compliant** — `AllExceptionsFilter` with `normalizeHttpError()` and stable `ErrorCode` enum.

### Practice: Pagination for List Endpoints
- **Source:** [NestJS Official Documentation — Microservices](https://docs.nestjs.com/microservices/basics) (pattern applies to REST)
- **Rationale:** Unbounded list endpoints cause memory and performance issues.
- **Project Status:** ⚠️ **Partial** — `PaginationQueryDto` with `buildPage()` used by most list endpoints. Missing on: notifications, admin logs.

### Practice: OpenAPI/Swagger Documentation
- **Source:** [NestJS Official Documentation — OpenAPI (Swagger)](https://docs.nestjs.com/openapi/introduction)
- **Rationale:** Auto-generated API documentation is essential for API consumers and frontend integration.
- **Project Status:** ❌ **Not Compliant** — No `@nestjs/swagger` module. 60+ endpoints undocumented.

---

## 7. WebSocket

### Practice: Redis Adapter for Multi-Instance Scaling
- **Source:** [Socket.IO Official Documentation — Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- **Rationale:** "The `@socket.io/redis-adapter` package allows broadcasting packets between multiple Socket.IO servers." Without it, events emitted on one instance don't reach sockets on another.
- **Project Status:** ❌ **Not Compliant** — In-memory adapter only. Cannot scale horizontally.

### Practice: Event Payload Validation
- **Source:** [NestJS Official Documentation — Gateways](https://docs.nestjs.com/websockets/gateways)
- **Rationale:** WebSocket `@MessageBody()` payloads should be validated like HTTP request bodies.
- **Project Status:** ❌ **Not Compliant** — No ValidationPipe for WebSocket events.

### Practice: Authentication on WebSocket Connections
- **Source:** [Socket.IO Official Documentation — Authentication](https://socket.io/docs/v4/server-socket-instance/#authentication)
- **Rationale:** WebSocket connections must be authenticated before joining rooms.
- **Project Status:** ✅ **Compliant** — `handleConnection()` validates JWT or screen secret. Invalid auth → immediate disconnect.

---

## 8. Storage

### Practice: Object Storage for Uploaded Files
- **Source:** [Docker Official Documentation — Node.js Guide](https://docs.docker.com/guides/nodejs/) (container ephemeral filesystem)
- **Rationale:** Containerized deployments have ephemeral filesystems. Files must be stored in persistent object storage (S3/MinIO).
- **Project Status:** ❌ **Not Compliant** — Local filesystem only (`uploads/media/`). Not suitable for containers.

### Practice: Use `diskStorage` Instead of `memoryStorage` for Large Files
- **Source:** [Multer Documentation — Disk Storage](https://github.com/expressjs/multer#diskstorage)
- **Rationale:** `memoryStorage` buffers entire file in RAM. Large concurrent uploads cause OOM.
- **Project Status:** ❌ **Not Compliant** — Uses `memoryStorage()` with 150MB max file size. (Note: `fileTypeFromBuffer` requires buffer in memory, so a hybrid approach is needed.)

---

## 9. Background Jobs

### Practice: Use BullMQ for Queue-Based Background Processing
- **Source:** [NestJS Official Documentation — Queues](https://docs.nestjs.com/techniques/queues) and [BullMQ Documentation — NestJS](https://docs.bullmq.io/guide/nestjs)
- **Rationale:** "Queues help maintain performance by smoothing out processing peaks and breaking up monolithic tasks that would otherwise block the Node.js event loop." BullMQ is the recommended modern queue for NestJS, backed by Redis.
- **Project Status:** ❌ **Not Compliant** — No queue system. Emails sent synchronously in request handler. Cron jobs via `@nestjs/schedule` only.

### Practice: Redis-Backed Job Persistence
- **Source:** [BullMQ Documentation](https://docs.bullmq.io/)
- **Rationale:** "Since jobs are persisted in Redis, each time a specific named queue is instantiated, it attempts to process any old jobs that may exist from a previous unfinished session."
- **Project Status:** ❌ **Not Compliant** — No Redis, no job persistence.

---

## 10. Caching

### Practice: Cache-Aside Pattern with Redis
- **Source:** [Redis Official Documentation — Cache-Aside with Node.js](https://redis.io/docs/latest/develop/use-cases/cache-aside/nodejs/)
- **Rationale:** "Instead of querying the primary database on every request, the application checks Redis first and only falls back to the primary on a miss." Provides sub-millisecond reads and reduced database load.
- **Project Status:** ❌ **Not Compliant** — No caching layer. Every request hits the database. `AccountContextHelper` runs 2-3 DB queries per request.

### Practice: Stampede Protection
- **Source:** [Redis Official Documentation — Cache-Aside with Node.js](https://redis.io/docs/latest/develop/use-cases/cache-aside/nodejs/)
- **Rationale:** "When a popular key expires, every concurrent reader observes the miss at the same instant. Without coordination, all of them would query the primary." Use Lua-backed single-flight lock.
- **Project Status:** ❌ **Not Compliant** — No caching, no stampede protection.

---

## 11. Logging

### Practice: Structured JSON Logging in Production
- **Source:** [NestJS Official Documentation — Deployment](https://docs.nestjs.com/deployment) — "Use JSON format for cloud providers (e.g., AWS CloudWatch)"
- **Rationale:** JSON logs are machine-parseable for log aggregation systems (ELK, Datadog, CloudWatch).
- **Project Status:** ✅ **Compliant** — `AppLogger` emits JSON in production with `level`, `message`, `requestId`, `context`, `timestamp`.

### Practice: Correlation IDs for Request Tracing
- **Source:** [NestJS Official Documentation — Deployment](https://docs.nestjs.com/deployment) — "Use Correlation IDs: In distributed systems, include unique identifiers in your logs to trace requests across services."
- **Rationale:** Request IDs allow correlating log entries across a single request lifecycle.
- **Project Status:** ✅ **Compliant** — `RequestContextMiddleware` reads/generates `x-request-id`, stores in `AsyncLocalStorage`, echoes on response. `AppLogger` includes `requestId` in every log line.

### Practice: Log Levels and No Sensitive Data
- **Source:** [NestJS Official Documentation — Deployment](https://docs.nestjs.com/deployment) — "Avoid Sensitive Data: Never log sensitive information like passwords or tokens."
- **Rationale:** Log levels categorize severity. Sensitive data must be scrubbed.
- **Project Status:** ✅ **Compliant** — `AppLogger` supports `log`, `error`, `warn`, `debug`, `verbose` levels. PII scrubbing for Sentry in `scrub-pii.ts`.

---

## 12. Monitoring

### Practice: Prometheus Metrics Endpoint
- **Source:** [NestJS Official Documentation — Performance](https://docs.nestjs.com/techniques/performance) and [prom-client Documentation](https://github.com/siimon/prom-client)
- **Rationale:** Prometheus-compatible `/metrics` endpoint enables scraping by Prometheus/Grafana for observability.
- **Project Status:** ✅ **Compliant** — `MetricsController` exposes `GET /metrics` with `text/plain; version=0.0.4` content type. `MetricsMiddleware` records request duration, method, route, status code. Route normalization prevents cardinality explosion.

### Practice: Error Tracking with Sentry
- **Source:** [Sentry Official Documentation — NestJS](https://docs.sentry.io/platforms/node/guides/nestjs/)
- **Rationale:** Sentry provides real-time error tracking with stack traces and context.
- **Project Status:** ✅ **Compliant** — `@sentry/nestjs` with `SentryModule.forRoot()`, `AllExceptionsFilter` captures exceptions, PII scrubbing before submission.

---

## 13. Testing

### Practice: Unit Tests with Mocked Dependencies
- **Source:** [NestJS Official Documentation — Testing](https://docs.nestjs.com/fundamentals/testing)
- **Rationale:** Unit tests with mocked dependencies verify business logic in isolation.
- **Project Status:** ⚠️ **Partial** — 49 spec files exist, but 8 modules have zero specs (admin, workspaces, notifications, islamic, api-keys).

### Practice: E2E Tests with Supertest
- **Source:** [NestJS Official Documentation — E2E Testing](https://docs.nestjs.com/fundamentals/e2e-testing)
- **Rationale:** E2E tests verify the full HTTP → Controller → Service → response cycle.
- **Project Status:** ❌ **Not Compliant** — `test/app.e2e-spec.ts` is a skeleton. No business flow E2E tests. `supertest` is installed but unused.

### Practice: Coverage Thresholds
- **Source:** [Jest Official Documentation — Coverage](https://jestjs.io/docs/configuration#coveragethreshold-object)
- **Rationale:** Coverage thresholds prevent coverage regression.
- **Project Status:** ✅ **Compliant** — `package.json` has `coverageThreshold: { global: { branches: 35, functions: 35, lines: 42, statements: 42 } }`. (Thresholds are low but exist.)

---

## 14. Deployment

### Practice: Docker Multi-Stage Build
- **Source:** [Docker Official Documentation — Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/) and [Docker Node.js Guide](https://docs.docker.com/guides/nodejs/containerize/)
- **Rationale:** "Use a separate stage for building and a minimal stage for running. Leave behind everything you don't want in the final image." Three stages: builder, deps, runner.
- **Project Status:** ❌ **Not Compliant** — `Dockerfile.backend` is single-stage.

### Practice: `NODE_ENV=production` in Production
- **Source:** [NestJS Official Documentation — Deployment](https://docs.nestjs.com/deployment)
- **Rationale:** "Set `NODE_ENV` to `production` — some libraries may behave differently based on this variable."
- **Project Status:** ✅ **Compliant** — Checked in `assertProductionSecretsAreSet()` and `isProduction` flag in `main.ts`.

### Practice: Use `node` Directly (Not `npm`/`yarn`) in Docker CMD
- **Source:** [Docker Node.js Guide](https://docs.docker.com/guides/nodejs/) and [Express.js — Graceful Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/)
- **Rationale:** "npm/yarn do not forward SIGTERM to child processes. Use `CMD ['node', 'dist/main.js']` directly."
- **Project Status:** ✅ **Compliant** — `start:prod` script uses `node dist/src/main.js`.

### Practice: Graceful Shutdown with SIGTERM Handling
- **Source:** [Express.js Official Documentation — Graceful Shutdown](https://expressjs.com/en/advanced/healthcheck-graceful-shutdown/) and [Node.js Process Documentation](https://nodejs.org/api/process.html)
- **Rationale:** "When the process gets SIGTERM, it should stop accepting new requests, finish all ongoing requests, clean up resources, then exit."
- **Project Status:** ❌ **Not Compliant** — No SIGTERM handler in `main.ts`. No `app.enableShutdownHooks()`.

---

## 15. Scaling

### Practice: Horizontal Scaling with Shared State
- **Source:** [NestJS Official Documentation — Scaling](https://docs.nestjs.com/deployment#scaling-up-or-out) and [Socket.IO — Redis Adapter](https://socket.io/docs/v4/redis-adapter/)
- **Rationale:** Horizontal scaling requires shared state for rate limiting, WebSocket events, and sessions.
- **Project Status:** ❌ **Not Compliant** — In-memory throttler, in-memory WebSocket adapter. Cannot scale beyond single instance.

### Practice: Trust Proxy Configuration Behind Reverse Proxy
- **Source:** [Express.js Official Documentation — trust proxy](https://expressjs.com/en/guide/behind-proxies.html)
- **Rationale:** "Behind a reverse proxy, `req.ip` is the proxy's address unless Express is told how many hops to trust."
- **Project Status:** ✅ **Compliant** — `main.ts` configures `trust proxy` with configurable hop count via `TRUST_PROXY_HOPS` env var.

### Practice: Connection Pool Sizing
- **Source:** [Prisma Official Documentation — Connection Management](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)
- **Rationale:** "Configure pool size and timeouts for your driver adapter." Pool size should match expected concurrency, not max DB connections.
- **Project Status:** ❌ **Not Compliant** — Uses `PrismaPg` adapter with default `max: 10` and no explicit `connectionTimeoutMillis` or `idleTimeoutMillis`.

---

## Summary: Compliance Matrix

| Area | Compliant | Partial | Not Compliant |
|------|-----------|---------|---------------|
| Architecture | 2 | 1 | 1 |
| Database | 2 | 1 | 1 |
| Authentication | 3 | 0 | 1 |
| Authorization | 2 | 1 | 0 |
| Security | 5 | 1 | 0 |
| API Design | 2 | 1 | 1 |
| WebSocket | 1 | 0 | 2 |
| Storage | 0 | 0 | 2 |
| Background Jobs | 0 | 0 | 2 |
| Caching | 0 | 0 | 2 |
| Logging | 3 | 0 | 0 |
| Monitoring | 2 | 0 | 0 |
| Testing | 1 | 1 | 1 |
| Deployment | 2 | 0 | 2 |
| Scaling | 1 | 0 | 2 |
| **Total** | **26** | **6** | **17** |

**Overall Compliance: 26/49 practices (53%) fully compliant, 12/49 (24%) partial, 17/49 (35%) non-compliant.**
