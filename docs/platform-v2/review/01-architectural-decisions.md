# 01 — Architectural Decisions Validation

> **Phase 1:** Validate every major architectural decision in the blueprint

---

## D-01: JWT Audience Claim for Identity Separation

### Decision
Add `aud` (audience) claim to JWT tokens with values: `platform`, `customer`, `support`, `player`. Use `AudienceGuard` to enforce route-level identity separation.

### Why Chosen
JWT audience is the standard OAuth/OIDC mechanism for scoping tokens to specific resource servers. It's stateless, verifiable without database lookups, and prevents token cross-use between platform and customer contexts.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Separate signing keys per audience** | Operationally complex. Requires key rotation per audience, multi-key JWKS, and more secret management overhead. |
| **Custom claim (e.g., `scope: 'platform'`)** | Non-standard. Loses interoperability with JWT libraries that natively understand `aud`. |
| **Database lookup per request** | Adds latency. Already doing a DB lookup in `JwtStrategy.validate()` for `isActive` check — adding audience resolution there would compound. |
| **Separate auth endpoints per audience** | Correct for issuance but insufficient for enforcement. Tokens still need a verifiable audience claim to prevent cross-use. |

### Tradeoffs
- **Performance:** Minimal. `aud` is validated during JWT verification — no extra DB query.
- **Scalability:** Excellent. Stateless validation scales to any number of instances.
- **Security:** Strong. Prevents a customer token from hitting `/platform/*` routes even if a guard is misconfigured.
- **Complexity:** Moderate. Requires updating token issuance, JWT strategy, and adding a new guard. Every existing token becomes invalid on rollout.
- **Migration difficulty:** **High**. This is a token format change. All existing sessions are invalidated. Must deploy during a maintenance window or support dual-validation temporarily.
- **Maintainability:** Good. Standard JWT feature, well-documented.

### Current Repository Gap
**CRITICAL:** `JwtStrategy` at `@/apps/backend/src/domains/auth/jwt.strategy.ts:37-61` does not validate `aud`. `TokenPayload` in `auth.service.ts:37-52` does not include `aud`. The `JwtUser` type in `current-user.decorator.ts:3-9` has no audience field. This is a **zero-base** change — no infrastructure exists.

### Verdict: ✅ APPROVED — But mark as Phase 0 prerequisite

---

## D-02: Single NestJS Backend with Route-Level Partitioning

### Decision
Keep a single NestJS application with route prefixes (`/platform/*`, `/customer/*`, `/auth/*`, `/player/*`, `/public/*`, `/internal/*`) instead of splitting into microservices.

### Why Chosen
At 100-1,000 customers, the operational overhead of microservices exceeds their benefit. A modular monolith with strict route partitioning and ESLint boundary enforcement provides 90% of the isolation at 10% of the complexity.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Two separate NestJS apps (platform + customer)** | Doubles deployment complexity, CI/CD, monitoring. Shared services (Prisma, Redis, Storage) must be duplicated or extracted. At current scale, not justified. |
| **Microservices from day 1** | Classic over-engineering. Team of 3 cannot operate 6+ services. |
| **NestJS monolith without route partitioning** | Current state. No boundary enforcement. Admin and customer code share modules freely. This is the problem being solved. |

### Tradeoffs
- **Performance:** Excellent. No network hops between modules. In-process calls are ~1000x faster than HTTP.
- **Scalability:** Good to ~10K customers. Beyond that, realtime and analytics should be extracted. Blueprint correctly identifies this in `10-scalability.md`.
- **Security:** Route partitioning enables per-namespace guard chains. Good defense in depth.
- **Complexity:** Low to moderate. Route prefixes are NestJS-native. Guard composition is well-understood.
- **Migration difficulty:** **High**. Every controller route changes. Frontend must update every API call. Must be done incrementally with backward-compatible aliases.
- **Maintainability:** Good if ESLint boundaries are enforced. Without enforcement, route partitioning is cosmetic.

### Current Repository Gap
**MAJOR:** No route namespacing exists. Controllers use flat routes (`@Controller('admin')`, `@Controller('workspaces')`, `@Controller('screens')`). The global prefix is `api/v1` set in `main.ts:122`. No `/platform/` or `/customer/` prefix exists anywhere. Every controller needs updating.

### Verdict: ✅ APPROVED — But migration plan must account for route-by-route migration with backward compatibility

---

## D-03: Two Independent Next.js Applications

### Decision
Split the current single `apps/dashboard` into two independent Next.js apps: `apps/control-panel` (admin) and `apps/dashboard` (customer).

### Why Chosen
Complete separation of concerns. Different deployment domains, different build configurations, different user experiences. Prevents accidental inclusion of admin code in customer bundle.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Single app with route groups** | Current state. Admin code is bundled with customer code. `features/admin/` has 19 files in the customer app. Security risk: admin navigation logic ships to customer browsers. |
| **Single app with dynamic imports** | Still ships admin code. Code splitting helps bundle size but doesn't prevent logical coupling. |
| **Micro-frontend (Module Federation)** | Massive complexity. Overkill for 2 apps with shared design system. |

### Tradeoffs
- **Performance:** Better. Customer app is smaller without admin code. Admin app can optimize for desktop-only.
- **Scalability:** Good. Each app deploys independently. Different teams can own each app.
- **Security:** **Critical improvement**. Admin code does not ship to customer browsers. No `isSuperAdmin` checks in customer bundle.
- **Complexity:** Moderate. Shared packages must be extracted first. Build pipeline doubles.
- **Migration difficulty:** **Very High**. 19 admin feature files must be moved. Admin routes (`/admin/*`) must be extracted. Shared components must be packaged. The `CrystalShell` component has `sovereign` mode that conditionally renders admin nav — this must be split.
- **Maintainability:** Excellent once separated. Each app has clear ownership.

### Current Repository Gap
**MAJOR:** `packages/ui` and `packages/config` are empty (only `.gitkeep`). No shared packages exist. The `CrystalShell` component at `@/apps/dashboard/src/components/crystal-shell.tsx` has deep coupling between admin and customer navigation via the `sovereign` prop. `ShellSidebar` at `@/apps/dashboard/src/components/layout/shell-sidebar.tsx` renders both admin and customer nav in the same component (553 lines). The `shell-header-meta.ts` has 180+ lines of admin/customer route matching.

### Verdict: ✅ APPROVED — But shared packages must be created first, and the shell must be split before app extraction

---

## D-04: Guard Chain (JwtAuthGuard → AudienceGuard → RoleGuard → QuotaGuard → FeatureGuard)

### Decision
Layered guard chain where each guard has a single responsibility and fails closed.

### Why Chosen
Defense in depth. Each guard is independently testable. Guards compose naturally via `@UseGuards()`.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Single mega-guard** | Violates single responsibility. Hard to test. Hard to extend. |
| **Middleware-based auth** | Less expressive than guards. Can't access route metadata (decorators). |
| **Decorator-based auth only** | No runtime enforcement. Easy to forget on new routes. |

### Tradeoffs
- **Performance:** 5 guards = 5 canActivate calls. Each is lightweight (metadata lookup + simple check). Negligible overhead.
- **Scalability:** Good. Guards are stateless and per-request.
- **Security:** Excellent. Fail-closed by default. Missing any guard means the request is rejected.
- **Complexity:** Moderate. Developers must remember to apply all 5 guards. Consider a composite guard.
- **Migration difficulty:** **High**. `QuotaGuard` and `FeatureGuard` don't exist. `AudienceGuard` doesn't exist. Only `JwtAuthGuard` and `RolesGuard` exist currently.
- **Maintainability:** Good. Each guard is small and focused.

### Current Repository Gap
**MAJOR:** Only `JwtAuthGuard` (6 lines, just `AuthGuard('jwt')`) and `RolesGuard` (92 lines) exist. `PlatformStaffDbGuard` and `SuperAdminDbGuard` exist but are applied per-route, not as a chain. No `AudienceGuard`, `QuotaGuard`, or `FeatureGuard` exists. The `RolesGuard` does a database lookup per request (`accountContext.resolveForWorkspace`) — this is already a performance concern that will compound with additional guards.

### Verdict: ✅ APPROVED — But create a `CompositeGuard` that bundles the chain to prevent developer error

---

## D-05: Prisma Middleware for Tenant Isolation

### Decision
Use Prisma middleware to automatically inject `workspaceId` into all queries, preventing cross-tenant data access.

### Why Chosen
Application-level tenant isolation without database-level row-level security (RLS). Works with single PostgreSQL instance.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **PostgreSQL RLS** | Requires Postgres 15+ and careful policy management. Harder to debug. Prisma doesn't natively support RLS. |
| **Manual workspaceId in every query** | Current state. Error-prone. One missing `where: { workspaceId }` leaks data. |
| **Separate database per tenant** | Operationally expensive at scale. Connection pool exhaustion. Only viable for enterprise tier. |

### Tradeoffs
- **Performance:** Prisma middleware adds ~1ms per query. Acceptable.
- **Scalability:** Good to ~10K tenants. Beyond that, sharding by `workspaceId` is the next step.
- **Security:** Strong, but not bulletproof. Middleware can be bypassed by raw queries (`$executeRaw`, `$queryRaw`). Must audit for raw queries.
- **Complexity:** Moderate. Middleware must handle all Prisma operations (findMany, create, update, delete, etc.).
- **Migration difficulty:** **Moderate**. Can be added incrementally. Start with platform modules, then customer modules.
- **Maintainability:** Good. Centralized logic. One place to audit.

### Current Repository Gap
**MODERATE:** No Prisma middleware exists. `PrismaService` at `@/apps/backend/src/common/prisma/prisma.module.ts` is a basic wrapper. Tenant isolation is currently enforced manually in each service via `workspaceId` in queries. The `WorkspaceAuthHelper` at `@/apps/backend/src/common/auth/workspace-auth.helper.ts` does membership checks but doesn't inject `workspaceId` into queries.

### Verdict: ✅ APPROVED — But must audit all `$queryRaw` and `$executeRaw` calls for bypass risk

---

## D-06: Redis for Session Management

### Decision
Store sessions in Redis with TTL. Replace the current `RefreshToken` table-based approach with Redis for hot session data.

### Why Chosen
Redis is already in the stack (rate limiting, WebSocket adapter, BullMQ). Session data is hot and short-lived — ideal for Redis. Database is freed from session churn.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Keep sessions in PostgreSQL (RefreshToken table)** | Current state. Works but adds write load to the primary DB. Session revocation requires DELETE queries. |
| **JWT without server-side sessions** | Can't revoke tokens. Can't enforce session limits. Security risk for enterprise customers. |
| **Dedicated session store (e.g., express-session + connect-redis)** | Adds dependency. NestJS doesn't use express-session. Custom solution is cleaner. |

### Tradeoffs
- **Performance:** Excellent. Redis ~0.5ms vs PostgreSQL ~5ms for session lookup.
- **Scalability:** Excellent. Redis cluster scales horizontally.
- **Security:** Good. Sessions can be revoked instantly. TTL ensures cleanup.
- **Complexity:** Moderate. Must handle Redis failover gracefully (fallback to DB?).
- **Migration difficulty:** **Moderate**. `RefreshToken` table already exists. Must dual-write during migration, then cut over.
- **Maintainability:** Good. Redis is already managed in the stack.

### Current Repository Gap
**LOW:** `RefreshToken` model exists at `@/apps/backend/prisma/schema.prisma:639-661`. `RedisService` exists at `@/apps/backend/src/common/redis/redis.service.ts`. `RedisModule` is already imported in `AppModule`. The infrastructure is there — just need to add session storage logic.

### Verdict: ✅ APPROVED

---

## D-07: File-Based Platform Settings → Database

### Decision
Move platform settings from file-based store to a `PlatformSettings` database table.

### Why Chosen
File-based store (`admin-runtime.store.ts`) is not atomic, not transactional, and loses data on container restart without volume mounts. The docker-compose.yml explicitly calls out this fragility: `admin-runtime.store.ts (audit log + platform settings) ... both write here — without this volume they're wiped on every docker compose down/redeploy`.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Keep file-based with volume mount** | Current state. Fragile. No concurrency control. Not suitable for multi-instance deployment. |
| **Redis for settings** | Settings are rarely written, frequently read. DB is fine. Redis adds unnecessary complexity. |
| **Environment variables only** | Can't be changed at runtime. No UI for super admin to update. |

### Tradeoffs
- **Performance:** DB read for settings is ~5ms. Cache in memory with TTL for near-zero latency.
- **Scalability:** Good. DB handles settings easily.
- **Security:** Better. DB access is authenticated. File system access is not.
- **Complexity:** Low. Simple CRUD.
- **Migration difficulty:** **Low**. Just create table and migrate data.
- **Maintainability:** Much better. Atomic updates, audit trail possible.

### Current Repository Gap
**MODERATE:** File-based store is actively used. `AdminService` reads/writes settings via file. Docker-compose volume mount is a workaround. Must migrate all settings keys to DB.

### Verdict: ✅ APPROVED

---

## D-08: Impersonation via Cross-Domain Exchange Tokens

### Decision
Replace the current "mint tokens for another user" approach with a cross-domain exchange token flow: platform admin generates a one-time exchange token, customer app redeems it for a session.

### Why Chosen
Current approach (`issueImpersonation` in `auth.service.ts:738-785`) directly mints access + refresh tokens for the target user. This is dangerous because:
1. The platform admin's request context has the target user's tokens
2. There's no time-limited exchange step
3. The tokens are set directly via `setAuthCookies` — same cookie slot

The exchange token approach adds a one-time, short-lived token that the customer app redeems, creating an auditable boundary.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Current approach (direct token mint)** | No exchange boundary. Tokens are long-lived. Cookie collision with admin session. |
| **OAuth 2.0 token exchange (RFC 8693)** | Overkill for internal impersonation. Adds OAuth server complexity. |
| **Session sharing via Redis** | Both apps would need same Redis. Couples the two independent products. |

### Tradeoffs
- **Performance:** One extra HTTP call (exchange). Negligible.
- **Scalability:** Good. Exchange token is stateless (JWT with short TTL).
- **Security:** **Major improvement**. One-time use, short TTL, auditable, cross-domain.
- **Complexity:** Moderate. Exchange endpoint + token validation + audit logging.
- **Migration difficulty:** **High**. Current impersonation is deeply integrated. `AdminService.impersonateUser()` calls `AuthService.issueImpersonation()` which directly mints tokens. Frontend `ImpersonationReturnButton` expects `impersonatedBy` in JWT. Must redesign the entire flow.
- **Maintainability:** Better. Clear separation of concerns.

### Current Repository Gap
**MAJOR:** Current impersonation at `@/apps/backend/src/domains/auth/auth.service.ts:738-785` directly mints tokens. `AdminService` at `@/apps/backend/src/domains/admin/admin.controller.ts:249-270` sets cookies directly. Frontend at `@/apps/dashboard/src/features/admin/impersonation-return-button.tsx` uses `impersonatedBy` claim. The entire flow must be redesigned.

### Verdict: ✅ APPROVED — But this is one of the most complex migration items

---

## D-09: ESLint Boundary Enforcement

### Decision
Use ESLint rules to enforce module boundaries: customer modules cannot import platform modules, platform modules can import shared and customer modules (read-only), shared modules are isolated.

### Why Chosen
Without enforcement, route partitioning is cosmetic. Developers will import across boundaries. ESLint catches violations at build time, not runtime.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **TypeScript path aliases only** | No enforcement. Aliases are convenience, not constraints. |
| **Nx project boundaries** | Adds Nx as a dependency. Monorepo doesn't use Nx. |
| **Manual code review** | Doesn't scale. Easy to miss in PR review. |
| **Runtime module checks** | Too late. Errors in production, not build time. |

### Tradeoffs
- **Performance:** No runtime impact. ESLint is build-time only.
- **Scalability:** Good. Rules scale with codebase.
- **Security:** Good. Prevents accidental data leakage via imports.
- **Complexity:** Moderate. Writing custom ESLint rules requires expertise. Can use `eslint-plugin-import` `no-restricted-paths` instead of custom rules.
- **Migration difficulty:** **Moderate**. Must define boundaries, write rules, then fix all existing violations.
- **Maintainability:** Excellent. Self-documenting constraints.

### Current Repository Gap
**HIGH:** No ESLint boundary rules exist. `eslint-plugin-import` is in devDependencies but no `no-restricted-paths` config exists. Current code freely imports across what should be boundaries (e.g., `WorkspacesService` imports `MediaService`, `AuthService`, `ScreenHeartbeatService`, `EmailService`).

### Verdict: ✅ APPROVED — Use `eslint-plugin-import` `no-restricted-paths` rather than custom rules

---

## D-10: Shared Packages (packages/ui, packages/api-ts, packages/config)

### Decision
Extract shared UI components, TypeScript API types, and configuration into separate npm workspace packages.

### Why Chosen
Two frontend apps need shared components. API types must be consistent between frontend and backend. Configuration (Tailwind, ESLint, TS config) should be DRY.

### Alternatives Considered

| Alternative | Rejected Because |
|---|---|
| **Copy-paste shared code** | Drifts. Maintenance nightmare. |
| **Monorepo path imports (no package)** | Works but doesn't enforce versioning. No clear public API. |
| **Published npm packages** | Overkill for internal packages. Adds publishing step. |

### Tradeoffs
- **Performance:** No runtime impact. Build-time resolution only.
- **Scalability:** Good. Packages can be published later if needed.
- **Security:** Good. Clear public API surface.
- **Complexity:** Low to moderate. npm workspaces already configured in `package.json`.
- **Migration difficulty:** **High**. Must identify all shared components, extract them, update all imports. `packages/ui` and `packages/config` are empty — starting from zero.
- **Maintainability:** Excellent. Clear boundaries, versioned APIs.

### Current Repository Gap
**HIGH:** `packages/ui/.gitkeep` and `packages/config/.gitkeep` are the only files. No shared package code exists. The dashboard has 20+ UI components in `src/components/ui/` that need extraction. No API type sharing exists between frontend and backend.

### Verdict: ✅ APPROVED — Must be done before frontend app extraction

---

## Summary Matrix

| Decision | Approved | Complexity | Migration Risk | Current Gap |
|---|---|---|---|---|
| D-01 JWT Audience | ✅ | Moderate | High (invalidates sessions) | Zero base |
| D-02 Route Partitioning | ✅ | Low | High (every controller) | Zero base |
| D-03 Two Frontend Apps | ✅ | Moderate | Very High (19 admin files) | Deep coupling |
| D-04 Guard Chain | ✅ | Moderate | High (3 new guards) | 2 of 5 exist |
| D-05 Prisma Middleware | ✅ | Moderate | Moderate | Zero base |
| D-06 Redis Sessions | ✅ | Low | Moderate | Infrastructure exists |
| D-07 Settings to DB | ✅ | Low | Low | File-based active |
| D-08 Exchange Token Impersonation | ✅ | High | High (redesign flow) | Deep integration |
| D-09 ESLint Boundaries | ✅ | Moderate | Moderate | No rules exist |
| D-10 Shared Packages | ✅ | Low | High (extraction) | Empty packages |
