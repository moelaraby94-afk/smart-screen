# 04 — Backend Validation

> **Phase 4:** Domain boundaries, NestJS modules, guards, JWT, RBAC, platform roles, workspace roles, APIs, shared services, background jobs, cron, realtime, socket, events, queues, storage, media, billing, audit, notifications

---

## 1. Domain Boundaries

### 1.1 Current Bounded Contexts (As-Is)

The backend has **22 domain modules** but **zero bounded context separation**. All modules live under a single `domains/` folder with no namespace separation. The `AppModule` imports all 22 modules flat.

| Current Module | Bounded Context | Problem |
|---|---|---|
| `admin/` | Platform | Mixed with customer modules. Uses `forwardRef` for Auth and Workspaces. |
| `account/` | Customer | No route prefix. Shares `User` table with platform staff. |
| `auth/` | Shared | 1051-line service. Handles login, register, 2FA, impersonation, profile. |
| `workspaces/` | Customer | 1226-line service. God service with 6 injections. |
| All others | Customer | No route prefix. No namespace. |

### 1.2 Target Bounded Contexts (To-Be)

| Bounded Context | Modules | Route Prefix |
|---|---|---|
| **Platform** | TenantManagement, PlatformStaff, PlatformSettings, PlatformBilling, PlatformAnalytics, PlatformSupport, PlatformSecurity | `/platform/*` |
| **Customer** | Workspaces, Screens, Playlists, Canvases, Media, Schedules, Campaigns, Billing, ApiKeys, Webhooks, Onboarding, Islamic, Notifications, AuditLog, Account | `/customer/*` |
| **Auth** | AuthCredentials, AuthTokens, AuthImpersonation, AuthProfile | `/auth/*` |
| **Player** | PlayerContent, PlayerPairing | `/player/*` |
| **Public** | Health, Ready, Metrics | `/public/*` |
| **Internal** | StripeWebhooks, CronJobs, Maintenance | `/internal/*` |
| **Shared** | Prisma, Redis, Storage, Audit, Email, Crypto, Config, JWT, Throttler, CSRF | (no routes) |

### 1.3 Validation Result

**FAIL** — No bounded context separation exists. Every module belongs to the "monolith" context. The blueprint's bounded context design is correct but requires significant refactoring.

---

## 2. NestJS Module Validation

### 2.1 Module Wiring Issues

| Issue | Severity | Module(s) | Detail |
|---|---|---|---|
| `forwardRef` usage | **CRITICAL** | Auth, Workspaces, Admin, Realtime | 4 modules use `forwardRef`. This masks circular dependencies instead of resolving them. |
| `@Global()` on EmailModule | **OK** | Email | Correct design. Email is needed everywhere. |
| PrismaModule not `@Global()` | **MINOR** | Prisma | Every module must explicitly import PrismaModule. Should be `@Global()`. |
| RedisModule not `@Global()` | **MINOR** | Redis | Same as Prisma. |
| Module size | **HIGH** | Auth (1051 lines), Workspaces (1226 lines), Admin (995 lines) | Three services exceed 900 lines. Violates SRP. |
| Providers in modules | **OK** | Most | Guards are correctly scoped to modules that need them. |

### 2.2 Module Dependency Validation

Every backend module must belong to exactly one bounded context. Current state:

| Module | Belongs To | Exactly One Context? |
|---|---|---|
| admin | Platform | ✅ (but coupled to Customer via Workspaces) |
| account | Customer | ✅ |
| api-keys | Customer | ✅ |
| audit-log | Customer | ✅ (platform audit is in common/) |
| auth | Shared | ❌ (contains impersonation = Platform concern) |
| campaigns | Customer | ✅ |
| canvases | Customer | ✅ |
| email | Shared | ✅ |
| islamic | Customer | ✅ |
| maintenance | Platform | ✅ (no controller, service only) |
| media | Customer | ✅ |
| notifications | Customer | ✅ |
| onboarding | Customer | ✅ |
| pairing | Customer | ✅ |
| player | Player | ✅ |
| playlists | Customer | ✅ |
| realtime | Shared | ✅ |
| schedules | Customer | ✅ |
| screens | Customer | ✅ |
| stripe | Customer | ✅ (but Stripe webhooks are internal) |
| subscriptions | Customer + Platform | ❌ (admin mock plans = Platform) |
| webhooks | Customer + Internal | ❌ (Stripe webhook = Internal, customer webhooks = Customer) |
| workspaces | Customer + Platform | ❌ (admin workspace management = Platform) |

**3 modules span multiple bounded contexts.** Must split.

---

## 3. Guard Validation

### 3.1 Current Guard Inventory

| Guard | File | Purpose | Problem? |
|---|---|---|---|
| `JwtAuthGuard` | `jwt-auth.guard.ts` (6 lines) | JWT authentication | Just `AuthGuard('jwt')`. No audience check. |
| `RolesGuard` | `roles.guard.ts` (92 lines) | Workspace role check | DB lookup per request via `AccountContextHelper`. Performance concern. |
| `SuperAdminGuard` | `super-admin.guard.ts` (20 lines) | Check `isSuperAdmin` from JWT | **JWT-only check** — no DB validation. Can be spoofed if JWT secret leaks. |
| `SuperAdminDbGuard` | `super-admin-db.guard.ts` (34 lines) | Check `isSuperAdmin` from DB | ✅ Correct — validates against DB. |
| `PlatformStaffDbGuard` | `platform-staff-db.guard.ts` (72 lines) | Check platform staff role from DB | ✅ Correct — fail-closed design. |
| `UserThrottlerGuard` | `user-throttler.guard.ts` (18 lines) | Rate limit by user ID | ✅ Correct. |
| `WsThrottlerGuard` | `ws-throttler.guard.ts` | WebSocket rate limiting | ✅ Correct. |
| `ApiKeyAuthGuard` | `api-key.guard.ts` (84 lines) | API key authentication | ✅ Correct. SHA-256 hash lookup. |

### 3.2 Missing Guards

| Guard | Blueprint Reference | Status |
|---|---|---|
| `AudienceGuard` | `04-authentication.md` §3 | **Does not exist** |
| `QuotaGuard` | `05-authorization.md` §4 | **Does not exist** |
| `FeatureGuard` | `05-authorization.md` §5 | **Does not exist** |

### 3.3 Guard Chain Validation

**Blueprint proposes:** `JwtAuthGuard → AudienceGuard → RoleGuard → QuotaGuard → FeatureGuard`

**Current state:** Guards are applied per-route, not as a chain. Example from `admin.controller.ts`:
```typescript
@UseGuards(JwtAuthGuard, PlatformStaffDbGuard)  // 2 guards
```

And from `workspaces.controller.ts`:
```typescript
@UseGuards(JwtAuthGuard)  // 1 guard only
```

**Problem:** No consistent guard chain. Each controller applies a different subset. Easy to miss a guard on a new route.

**Recommendation:** Create a `PlatformRouteGuard` and `CustomerRouteGuard` composite guard that bundles the full chain. Apply once per controller.

---

## 4. JWT Validation

### 4.1 Current JWT Design

| Aspect | Current | Blueprint Target | Gap |
|---|---|---|---|
| Claims | `sub`, `email`, `isSuperAdmin`, `impersonatedBy`, `typ` | `sub`, `email`, `aud`, `scope`, `sid`, `iat`, `exp` | Missing `aud`, `scope` |
| Secret | Single `JWT_ACCESS_SECRET` | Same | ✅ |
| Extraction | Cookie (`cs_access_token`) + Bearer header | Separate cookies per audience | Single cookie |
| Refresh | `JWT_REFRESH_SECRET` (separate secret) | Same | ✅ |
| Token type check | `typ === 'refresh'` rejected as access | Same | ✅ |
| DB validation | `JwtStrategy.validate()` checks `isActive` | Same + audience check | Missing audience |
| Session ID | `sid` on refresh tokens | Same | ✅ |
| Revocation | `revokeAllSessions()` deletes `RefreshToken` rows | Redis-based | DB-based currently |

### 4.2 JWT Security Issues

| Issue | Severity | Detail |
|---|---|---|
| No audience claim | **CRITICAL** | A customer token can hit admin routes. Only `PlatformStaffDbGuard` prevents this, but it's not applied to all admin routes. |
| `SuperAdminGuard` is JWT-only | **HIGH** | `super-admin.guard.ts:14` checks `user?.isSuperAdmin` from JWT payload only. No DB validation. If JWT secret leaks, attacker can forge `isSuperAdmin: true`. `SuperAdminDbGuard` exists but is only used on some routes. |
| No token binding | **MEDIUM** | JWT is not bound to IP or device fingerprint. Stolen tokens are valid until expiry. |
| 15-minute access token | **OK** | Standard. |
| 7-day refresh token | **OK** | Standard. |

---

## 5. RBAC Validation

### 5.1 Current Role Model

| Role Type | Enum | Values | Location |
|---|---|---|---|
| Workspace roles | `UserRole` | `OWNER`, `ADMIN`, `EDITOR`, `VIEWER` | `schema.prisma:17-27` |
| Platform staff roles | `PlatformStaffRole` | `SUPER_ADMIN`, `SUPPORT_SPECIALIST`, `BILLING_MANAGER` | `schema.prisma:46-54` |

### 5.2 RBAC Enforcement Points

| Enforcement Point | Current | Blueprint Target | Gap |
|---|---|---|---|
| REST API | `@Roles()` decorator + `RolesGuard` | `@Roles()` + `@PlatformRoles()` + `@Scopes()` | Missing scopes |
| WebSocket | `WsThrottlerGuard` only | Audience + role check on connection | **No auth on WS** beyond throttle |
| Background jobs | None | Role-based job dispatch | **Does not exist** |
| Scheduled tasks | None | Role context for cron | **Does not exist** |

### 5.3 RolesGuard Performance Issue

`RolesGuard.canActivate()` at `roles.guard.ts:25-91` does:
1. Get `workspaceId` from params/query/body/headers
2. Call `accountContext.resolveOwnerId(user.sub)` — **1 DB query**
3. Call `accountContext.resolveForWorkspace(user.sub, workspaceId)` — **2+ DB queries**
4. Check role against required roles

**3+ DB queries per role-protected request.** At 100 RPS with 50% role-protected routes, that's 150+ extra DB queries per second.

**Resolution:** Cache account context in Redis with 60s TTL. Invalidate on role change.

---

## 6. Platform Roles Validation

### 6.1 Current Platform Staff Roles

| Role | Can Access | Enforcement |
|---|---|---|
| `SUPER_ADMIN` | Everything | `SuperAdminDbGuard` (DB check) + `SuperAdminGuard` (JWT only) |
| `SUPPORT_SPECIALIST` | Users, customers, workspaces, fleet, screens | `@PlatformRoles(SUPPORT_SPECIALIST)` decorator |
| `BILLING_MANAGER` | Users, customers, stats | `@PlatformRoles(BILLING_MANAGER)` decorator |

### 6.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Two SuperAdmin guards | **HIGH** | `SuperAdminGuard` (JWT-only, 20 lines) and `SuperAdminDbGuard` (DB-validated, 34 lines) both exist. Some routes use the JWT-only version. Must consolidate to DB-validated only. |
| No `OPERATIONS_ENGINEER` role | **MEDIUM** | Blueprint proposes this role. Not in current enum. |
| No `SECURITY_ANALYST` role | **MEDIUM** | Blueprint proposes this role. Not in current enum. |
| Staff writes are super-admin only | **OK** | Current design: all writes are super-admin only. Reads are role-delegated. This is safe. |

---

## 7. Workspace Roles Validation

### 7.1 Current Workspace Roles

| Role | Permissions | Enforcement |
|---|---|---|
| `OWNER` | Full workspace control | `@Roles(OWNER)` + `RolesGuard` |
| `ADMIN` | Manage members, content, screens | `@Roles(ADMIN, OWNER)` + `RolesGuard` |
| `EDITOR` | Create/edit content, screens | `@Roles(EDITOR, ADMIN, OWNER)` + `RolesGuard` |
| `VIEWER` | Read-only | `@Roles(VIEWER, EDITOR, ADMIN, OWNER)` + `RolesGuard` |

### 7.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No custom roles | **MEDIUM** | Blueprint proposes custom roles for enterprise. Current enum is fixed. |
| Account-level roles | **OK** | `AccountMember` model with `workspaceScopes` is well-designed. |
| `isSuperAdmin` bypass | **HIGH** | `RolesGuard` at line 42: `if (user.isSuperAdmin) return true`. Super admin bypasses all role checks. This is intentional but means a super admin can modify any workspace's data without audit trail. |

---

## 8. Background Jobs & Queues

### 8.1 Current Queue Infrastructure

| Component | Status | Detail |
|---|---|---|
| BullMQ | ✅ Configured | `BullModule.forRootAsync()` in `AppModule` |
| Email queue | ✅ | `EmailQueueModule` in `common/queues/` |
| Webhook delivery | ✅ | `WebhookDeliveryService` in `webhooks/` |
| Offline event queue | ✅ | `OfflineEventQueueService` in `realtime/` |

### 8.2 Missing Job Infrastructure

| Component | Blueprint Reference | Status |
|---|---|---|
| Scheduled reports | `09-business-architecture.md` | **Does not exist** |
| Usage tracking jobs | `09-business-architecture.md` | **Does not exist** |
| Dunning automation | `09-business-architecture.md` | **Does not exist** |
| Proof of play aggregation | `02-customer-domain.md` | **Does not exist** |
| Media expiry cleanup | `02-customer-domain.md` | **Does not exist** |
| Session cleanup | `04-authentication.md` | **Does not exist** (RefreshToken rows are cleaned on logout only) |

### 8.3 Cron Jobs

| Cron | Current | Blueprint Target |
|---|---|---|
| `@Cron` decorator | `ScheduleModule.forRoot()` configured | Same |
| Prayer time updates | `IslamicModule` has scheduled tasks | Same |
| Ramadan auto-activate | `IslamicModule` has scheduled tasks | Same |
| Screen offline detection | `ScreenHeartbeatService` has scheduled tasks | Same |
| Subscription expiry | **Does not exist** | Needed |
| Trial expiry | **Does not exist** | Needed |
| Media expiry cleanup | **Does not exist** | Needed |

---

## 9. Realtime Validation

### 9.1 Current Realtime Architecture

| Component | File | Purpose |
|---|---|---|
| `RealtimeGateway` | `realtime.gateway.ts` (562 lines) | WebSocket gateway, namespace `/realtime` |
| `ScreenHeartbeatService` | `screen-heartbeat.service.ts` | Heartbeat processing, offline detection |
| `OfflineEventQueueService` | `offline-event-queue.service.ts` | Offline event buffering |

### 9.2 WebSocket Authentication

**Current:** `RealtimeGateway` authenticates connections via:
1. JWT from cookie (`cs_access_token`) or `authorization` header
2. Per-screen secret (`X-Player-Secret` header or `pairingSecretHash`)

**Problem:** No audience validation on WebSocket connections. A customer JWT can subscribe to any workspace's room if they know the `workspaceId`.

**Resolution:** Add audience check in WebSocket connection handler. Dashboard connections require `aud: 'customer'` or `aud: 'platform'`. Player connections require `aud: 'player'` or per-screen secret.

### 9.3 WebSocket Events

| Event | Direction | Current | Blueprint Target | Gap |
|---|---|---|---|---|
| `screen:register` | Player → Server | ✅ | ✅ | None |
| `screen:heartbeat` | Player → Server | ✅ | ✅ | None |
| `screen:offline` | Server → Dashboard | ✅ | ✅ | None |
| `screen:online` | Server → Dashboard | ✅ | ✅ | None |
| `playlist:updated` | Server → Dashboard | ✅ | ✅ | None |
| `dashboard:subscribe` | Dashboard → Server | ✅ | ✅ | No workspace ownership check |
| `pairing:watch` | Dashboard → Server | ✅ | ✅ | None |
| `screen:command` | Dashboard → Server | ✅ | ✅ | None |

### 9.4 Redis Adapter

**Current:** `@socket.io/redis-adapter` is configured when `REDIS_URL` is set. Good for multi-instance.

**Blueprint target:** Same + sticky sessions for player connections.

**Gap:** Sticky sessions not configured. Not needed at current scale but should be documented.

---

## 10. Storage & Media Validation

### 10.1 Current Storage

| Component | Status | Detail |
|---|---|---|
| `StorageModule` | ✅ | Supports local + S3/MinIO |
| `MediaService` | ✅ | Upload, delete, folder management |
| File integrity | ✅ | SHA-256 hash on upload |
| Expiry | ✅ | `expiresAt` field on `Media` |
| Partial upload protection | ✅ | `.part` extension staging |

### 10.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No storage quota enforcement | **HIGH** | `Subscription.storageLimitBytes` exists but no enforcement in `MediaService`. Customers can exceed quota. |
| No per-workspace storage isolation | **MEDIUM** | Media files are stored flat in `uploads/` or S3 bucket. No workspace-prefixed paths. |
| No CDN integration | **LOW** | Blueprint proposes CDN. Not needed at current scale. |

---

## 11. Billing Validation

### 11.1 Current Billing

| Component | Status | Detail |
|---|---|---|
| `SubscriptionsModule` | ✅ | CRUD for workspace subscriptions |
| `StripeModule` | ✅ | Stripe Checkout + Billing Portal |
| `StripeWebhookController` | ✅ | Webhook handling with idempotency |
| Mock plans | ✅ | Super admin can mock subscription plans |
| `PaymentRecord` | ✅ | Payment history |

### 11.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No invoice generation | **HIGH** | Blueprint proposes `Invoice` table. Not in schema. |
| No plan definition table | **HIGH** | Plans are hardcoded in enum `SubscriptionPlan`. Blueprint proposes dynamic `Plan` table. |
| No usage-based billing | **MEDIUM** | Blueprint proposes overage billing. Not implemented. |
| No dunning | **MEDIUM** | Blueprint proposes dunning flow. Not implemented. |
| `gracePeriodEndsAt` exists | ✅ | Good — workspace retains features during grace period. |

---

## 12. Audit Validation

### 12.1 Current Audit

| Component | Status | Detail |
|---|---|---|
| `AuditLogService` | ✅ | Append-only audit log in PostgreSQL |
| `AuditLog` model | ✅ | `action`, `adminName`, `targetCustomer`, `ipAddress`, `workspaceId`, `userId`, `metadata` |
| `CampaignHistory` | ✅ | Immutable campaign state changes |
| Impersonation audit | ✅ | `IMPERSONATION_END` logged |

### 12.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No hash chain | **MEDIUM** | Blueprint proposes tamper detection via hash chain. Not implemented. |
| No structured scope | **MEDIUM** | `AuditLog` has `workspaceId` but no `scope` field (platform vs customer). |
| File-based platform settings | **HIGH** | `admin-runtime.store.ts` writes audit logs to file system. Docker volume is a workaround. Must migrate to DB. |
| No audit log export | **LOW** | Blueprint proposes API access to audit events. Not implemented. |
| No retention policy | **LOW** | Audit logs grow forever. Need retention/cleanup. |

---

## 13. Notifications Validation

### 13.1 Current Notifications

| Component | Status | Detail |
|---|---|---|
| `NotificationsModule` | ✅ | CRUD for user notifications |
| `Notification` model | ✅ | `userId`, `type`, `title`, `message`, `read`, `link` |
| Realtime push | ✅ | Via `RealtimeGateway` |
| Per-user preferences | ✅ | `notificationPreferences` JSON on `User` |

### 13.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No email notifications | **MEDIUM** | `EmailService` exists but notifications don't trigger emails. |
| No notification templates | **LOW** | Blueprint proposes `EmailTemplate` table. Not in schema. |
| No platform notifications | **MEDIUM** | All notifications are customer-scoped. Platform staff don't receive notifications. |

---

## 14. Bounded Context Assignment Summary

Every backend module must belong to exactly one bounded context:

| Module | Bounded Context | Status | Action Required |
|---|---|---|---|
| admin | Platform | ❌ Spans contexts | Split into 5 platform modules |
| account | Customer | ✅ | Add route prefix |
| api-keys | Customer | ✅ | Add route prefix |
| audit-log | Customer | ✅ | Add route prefix |
| auth | Shared | ❌ Contains platform concern | Split impersonation out |
| campaigns | Customer | ✅ | Add route prefix |
| canvases | Customer | ✅ | Add route prefix |
| email | Shared | ✅ | No change |
| islamic | Customer | ✅ | Add route prefix |
| maintenance | Platform | ✅ | Add controller + route prefix |
| media | Customer | ✅ | Add route prefix |
| notifications | Customer | ✅ | Add route prefix |
| onboarding | Customer | ✅ | Add route prefix |
| pairing | Customer | ✅ | Add route prefix |
| player | Player | ✅ | Add route prefix |
| playlists | Customer | ✅ | Add route prefix |
| realtime | Shared | ✅ | Add audience validation |
| schedules | Customer | ✅ | Add route prefix |
| screens | Customer | ✅ | Add route prefix |
| stripe | Customer | ✅ | Move webhooks to /internal/ |
| subscriptions | Customer + Platform | ❌ Spans contexts | Split platform mock plans out |
| webhooks | Customer + Internal | ❌ Spans contexts | Split Stripe webhooks to /internal/ |
| workspaces | Customer + Platform | ❌ Spans contexts | Split platform tenant management out |

**5 modules span multiple bounded contexts. Must split before implementation.**
