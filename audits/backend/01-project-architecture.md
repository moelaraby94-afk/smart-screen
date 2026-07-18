# 01 — Project Architecture Audit

> **Objective:** Evaluate the overall backend architecture, module organization, dependency management, and structural soundness.

---

## 1. Current State

The backend is a **NestJS modular monolith** running on Node.js with TypeScript. It uses Prisma ORM with PostgreSQL, Socket.IO for realtime communication, and follows a domain-driven module organization.

### Technology Stack
- **Framework:** NestJS 11.x
- **Language:** TypeScript (strict mode)
- **ORM:** Prisma 7.x with `@prisma/adapter-pg`
- **Database:** PostgreSQL 16
- **Realtime:** Socket.IO (via `@nestjs/websockets`)
- **Auth:** JWT (access + refresh), Passport, bcryptjs, OTP
- **Payments:** Stripe SDK
- **Email:** Nodemailer + Resend + SendGrid
- **Security:** Helmet, CORS, CSRF middleware, `@nestjs/throttler`
- **Observability:** Sentry (`@sentry/nestjs`), custom metrics middleware
- **Scheduling:** `@nestjs/schedule` (cron jobs)
- **Build:** `tsup` (esbuild-based)

### Entry Point
`apps/backend/src/main.ts` — Bootstraps the NestJS app with:
- Global prefix `/api/v1` (with exclusions for health/webhooks)
- Helmet middleware
- CORS via shared `createCorsOriginChecker()`
- Global `ValidationPipe` with whitelist + transform
- Static asset serving for `uploads/` under `/media-files/`
- Production secret assertion via `assertProductionSecretsAreSet()`
- Sentry initialization
- CSRF middleware registration

### Root Module
`apps/backend/src/app.module.ts` — Imports:
- All 22 domain modules
- Common modules (Prisma, Health, Metrics, Auth, Throttler, Config)
- Global `AllExceptionsFilter` via `APP_FILTER`
- `ScheduleModule.forRoot()` for cron jobs
- `ThrottlerModule` with per-IP rate limiting

---

## 2. What Exists

### Domain Modules (22 total)
| Module | Path | Controllers | Services | Notes |
|--------|------|-------------|----------|-------|
| auth | `domains/auth/` | 2 (AuthController + DevLoginController) | AuthService, TwoFactorService, LoginLockoutService | JWT, 2FA, OTP, lockout |
| account | `domains/account/` | 1 | AccountService | Profile, email change, GDPR export |
| admin | `domains/admin/` | 1 | AdminService, BrandingAssetsService | Super admin, staff, impersonation |
| api-keys | `domains/api-keys/` | 1 | ApiKeysService | CRUD, SHA-256 hashing |
| audit-log | `domains/audit-log/` | 0 | (uses AuditLogService from common) | Read-only module |
| campaigns | `domains/campaigns/` | 1 | CampaignsService | Approval workflow, history |
| canvases | `domains/canvases/` | 1 | CanvasesService | CRUD, version history |
| email | `domains/email/` | 0 | EmailService | Multi-provider (Resend/SG/SMTP) |
| islamic | `domains/islamic/` | 1 | PrayerTimesService, RamadanService | Prayer times, Hijri, Ramadan |
| maintenance | `domains/maintenance/` | 0 | MaintenanceService | Cron: purge expired sessions + audit logs |
| media | `domains/media/` | 1 | MediaService | Upload, folders, expiry, stats |
| notifications | `domains/notifications/` | 1 | NotificationsService | In-app, preferences |
| onboarding | `domains/onboarding/` | 1 (FeatureFlagsController) | OnboardingService, FeatureFlagsService | Progress tracking, feature flags |
| pairing | `domains/pairing/` | 0 | PairingService | Pairing v2, lockout, per-screen secrets |
| player | `domains/player/` | 1 | PlayerService | Bootstrap, canvas, prayer pause |
| playlists | `domains/playlists/` | 1 | PlaylistsService | CRUD, groups, nested, clone, duplicate |
| realtime | `domains/realtime/` | 0 (Gateway) | ScreenHeartbeatService | Socket.IO, heartbeat, status events |
| schedules | `domains/schedules/` | 1 | SchedulingService | Weekly/monthly, overlaps, overrides |
| screens | `domains/screens/` | 1 | ScreensService | CRUD, assignments, override, analytics, remote commands |
| stripe | `domains/stripe/` | 1 | (uses SubscriptionsService) | Checkout, portal |
| subscriptions | `domains/subscriptions/` | 1 | SubscriptionsService | Plans, mock plan, Stripe integration |
| webhooks | `domains/webhooks/` | 2 | StripeWebhookService, WebhooksService | Stripe webhooks, customer webhooks |
| workspaces | `domains/workspaces/` | 1 | WorkspacesService | CRUD, members, invites, account members |

### Common Infrastructure (14 directories)
| Directory | Purpose |
|-----------|---------|
| `common/auth/` | JWT guard, roles guard, platform staff guard, account context helper, OTP helper |
| `common/config/` | CORS config, config helper, production secret assertion |
| `common/csrf/` | CSRF middleware (double-submit token) |
| `common/errors/` | DomainException, error codes, normalize-http-error, all-exceptions filter |
| `common/health/` | Health controller + service (liveness + readiness) |
| `common/metrics/` | Metrics middleware + service (Prometheus-style) |
| `common/observability/` | PII scrubbing for Sentry |
| `common/pagination/` | Pagination DTO + page builder |
| `common/prisma/` | PrismaService (extends PrismaClient, adapter-pg) |
| `common/product/` | Workspace capabilities, storage limits, mock billing guard |
| `common/request-context/` | Request context middleware (tenant isolation) |
| `common/throttler/` | User-based throttler guard |
| `common/validation/` | Request body validation |
| `common/audit/` | Audit log service (Postgres-backed) |

### Monorepo Structure
- Root `package.json` with npm workspaces (`apps/*`, `packages/*`)
- `apps/backend/` — NestJS API
- `apps/dashboard/` — Next.js dashboard
- `apps/player/` — Next.js player app
- `apps/marketing/` — Next.js marketing site
- `packages/ui/` — Shared UI components (empty, `.gitkeep` only)
- `packages/config/` — Shared config (empty, `.gitkeep` only)

---

## 3. What Is Missing

1. **No API documentation generation** — No Swagger/OpenAPI module. 60+ endpoints undocumented.
2. **No shared package content** — `packages/ui/` and `packages/config/` are empty. No shared types or utilities between apps.
3. **No API versioning strategy** — Global prefix `/api/v1` exists but no plan for v2 or backward compatibility.
4. **No module-level unit tests for some modules** — `admin`, `workspaces`, `pairing`, `onboarding` (partial), `notifications`, `islamic` have no dedicated spec files.
5. **No dependency injection testing** — No test verifies that all modules wire correctly without runtime errors.
6. **No Docker multi-stage build optimization** — `Dockerfile.backend` exists but uses single-stage build.
7. **No health check for external dependencies** — `/ready` only checks Prisma `$connect()`. No Redis, S3, or email provider health checks.
8. **No request context propagation** — `request-context/` exists but no request ID is generated for log correlation.

---

## 4. Problems

1. **Circular dependency between Auth and Workspaces** — `AuthService` uses `forwardRef(() => WorkspacesService)`, indicating a circular import. This works but is a code smell that could cause issues during refactoring.

2. **`packages/` are empty** — The monorepo declares workspaces for shared packages but they contain only `.gitkeep`. No shared types, validation schemas, or constants are extracted.

3. **DevLoginController in production-adjacent code** — While guarded by `NODE_ENV` check, having a `dev-login` route in the codebase is a risk. It's conditionally registered but the controller file is always compiled.

4. **No module boundaries enforcement** — NestJS modules don't use `@Global()` selectively. All modules export their services, making it easy to accidentally import across module boundaries.

5. **Static asset serving in API process** — `main.ts` serves `uploads/` directory. In production, media should be served by a CDN or object storage, not the API process.

---

## 5. Risks

- **Medium: Single-instance bottleneck** — In-memory throttler and WebSocket state prevent horizontal scaling.
- **Medium: Circular dependency** — `forwardRef` between Auth and Workspaces could break during refactoring.
- **Low: Empty shared packages** — Code duplication between apps will grow without shared packages.
- **Low: No API docs** — Onboarding new developers and third-party integrators is harder.

---

## 6. Priority: **High**

Architecture is solid but needs infrastructure additions (Redis, S3) before production.

---

## 7. Completion Percentage: **85%**

The architecture is well-designed and follows NestJS best practices. The 15% gap is primarily missing infrastructure (Redis, S3, API docs) and empty shared packages.

---

## 8. Recommendations

1. Add `@nestjs/swagger` module with auto-generated OpenAPI spec
2. Extract shared types into `packages/shared/` (DTOs, enums, error codes)
3. Add Redis module for distributed throttling and WebSocket adapter
4. Add S3/MinIO storage module and remove static asset serving from API
5. Add request ID middleware with structured JSON logging
6. Resolve circular dependency between Auth and Workspaces by extracting invitation acceptance into a separate service
7. Add module boundary tests that verify DI wiring

---

## 9. Future Tasks

- [ ] Implement Swagger/OpenAPI documentation
- [ ] Create `packages/shared/` with shared types and DTOs
- [ ] Add Redis as a first-class infrastructure dependency
- [ ] Add S3/MinIO storage adapter
- [ ] Add request ID + structured logging
- [ ] Resolve Auth ↔ Workspaces circular dependency
- [ ] Add multi-stage Docker build
- [ ] Add dependency health checks (Redis, S3, email)
