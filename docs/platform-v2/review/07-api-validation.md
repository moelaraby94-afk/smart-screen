# 07 — API Validation

> **Phase 7:** Every endpoint classified by ownership, authorization, routing, pagination, filtering, sorting, versioning

---

## 1. Current API Structure

**Global prefix:** `api/v1` (set in `main.ts:122`)

**No route namespacing.** All controllers use flat routes under `/api/v1/`.

---

## 2. Endpoint Inventory

### 2.1 Auth Endpoints (`/api/v1/auth/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| POST | `/auth/login` | Throttler | Email/password login | No audience parameter |
| POST | `/auth/login/2fa` | Throttler | 2FA verification | No audience parameter |
| POST | `/auth/register` | Throttler | New user registration | Customer-only, no guard |
| POST | `/auth/register/verify` | Throttler | OTP verification | |
| POST | `/auth/forgot-password` | Throttler | Password reset request | |
| POST | `/auth/reset-password` | Throttler | Password reset | |
| POST | `/auth/refresh` | JWT (refresh) | Token refresh | |
| POST | `/auth/logout` | JWT | Logout | Deletes all refresh tokens |
| GET | `/auth/me` | JWT | Current user profile | Returns all workspaces for super admin |
| GET | `/auth/2fa/setup` | JWT | Get 2FA secret | |
| POST | `/auth/2fa/enable` | JWT | Enable 2FA | |
| POST | `/auth/2fa/disable` | JWT | Disable 2FA | |
| POST | `/auth/impersonate` | JWT + SuperAdmin | Start impersonation | **CRITICAL: Direct token mint** |
| POST | `/auth/exit-impersonation` | JWT | Exit impersonation | Uses `impersonatedBy` claim |

**Issues:**
- No audience parameter in login — can't distinguish platform vs customer login
- Impersonation directly mints tokens instead of exchange token flow
- `logout` deletes ALL refresh tokens (all devices) — no per-device logout
- `me` endpoint returns all workspaces for super admin — heavy query

### 2.2 Admin Endpoints (`/api/v1/admin/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/admin/users` | JWT + PlatformStaff | List all users | **No pagination** |
| GET | `/admin/staff` | JWT + SuperAdminDb | List platform staff | No pagination |
| POST | `/admin/staff` | JWT + SuperAdminDb | Create staff member | |
| PATCH | `/admin/staff/:id/role` | JWT + SuperAdminDb | Update staff role | |
| GET | `/admin/customers` | JWT + PlatformStaff | List customers | Has search + filter, no pagination |
| GET | `/admin/customers/:id` | JWT + PlatformStaff | Customer profile | |
| POST | `/admin/customers/:id/workspaces` | JWT + SuperAdminDb | Create WS for customer | |
| GET | `/admin/customers/:cid/workspaces/:wid` | JWT + PlatformStaff | WS detail | |
| PATCH | `/admin/customers/:cid/workspaces/:wid` | JWT + SuperAdminDb | Update WS | |
| DELETE | `/admin/customers/:cid/workspaces/:wid` | JWT + SuperAdminDb | Delete WS | Hard delete |
| PATCH | `/admin/customers/:id/subscription` | JWT + SuperAdminDb | Update subscription | |
| POST | `/admin/customers/:id/reminder` | JWT + SuperAdminDb | Send reminder | |
| GET | `/admin/workspaces` | JWT + PlatformStaff | List all workspaces | **No pagination** |
| GET | `/admin/fleet/screens` | JWT + PlatformStaff | Global fleet | **No pagination** |
| GET | `/admin/screens` | JWT + PlatformStaff | Global screens | **No pagination** (duplicate of fleet) |
| PATCH | `/admin/workspaces/:wid/subscription-mock` | JWT + SuperAdminDb | Mock plan | |
| GET | `/admin/stats` | JWT + PlatformStaff (Billing) | Global stats | |
| GET | `/admin/logs` | JWT + SuperAdminDb | Audit logs | **No pagination** |
| GET | `/admin/settings` | JWT + SuperAdminDb | Platform settings | |
| PATCH | `/admin/settings` | JWT + SuperAdminDb | Update settings | |
| POST | `/admin/settings/branding/upload` | JWT + SuperAdminDb | Upload logo | |
| PATCH | `/admin/users/:id` | JWT + SuperAdminDb | Update user | Privilege escalation vector |
| POST | `/admin/users/:id/impersonate` | JWT + SuperAdminDb | Impersonate user | **CRITICAL: Direct token mint** |

**Issues:**
- **6 endpoints have no pagination** — will break at scale
- `/admin/screens` and `/admin/fleet/screens` are duplicates (same service method)
- No route namespacing (`/platform/` prefix missing)
- Impersonation endpoint mints tokens directly

### 2.3 Workspace Endpoints (`/api/v1/workspaces/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/workspaces` | JWT | List user's workspaces | |
| POST | `/workspaces` | JWT | Create workspace | |
| GET | `/workspaces/:id` | JWT + Roles | Workspace detail | |
| PATCH | `/workspaces/:id` | JWT + Roles (ADMIN+) | Update workspace | |
| DELETE | `/workspaces/:id` | JWT + Roles (OWNER) | Delete workspace | Hard delete |
| POST | `/workspaces/:id/invite` | JWT + Roles (ADMIN+) | Invite member | |
| POST | `/workspaces/:id/accept-invite` | JWT | Accept invitation | |
| GET | `/workspaces/:id/members` | JWT + Roles | List members | |
| PATCH | `/workspaces/:id/members/:userId` | JWT + Roles (ADMIN+) | Update member role | |
| DELETE | `/workspaces/:id/members/:userId` | JWT + Roles (ADMIN+) | Remove member | |
| POST | `/workspaces/:id/pairing-sessions` | JWT + Roles | Create pairing session | |
| GET | `/workspaces/:id/pairing-sessions` | JWT + Roles | List pairing sessions | |

**Issues:**
- No `/customer/` prefix
- `DELETE /workspaces/:id` is hard delete — should be soft delete
- No pagination on member list

### 2.4 Screen Endpoints (`/api/v1/screens/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/screens` | JWT + Roles | List screens | Has workspace scoping |
| POST | `/screens` | JWT + Roles (EDITOR+) | Create screen | |
| GET | `/screens/:id` | JWT + Roles | Screen detail | |
| PATCH | `/screens/:id` | JWT + Roles (EDITOR+) | Update screen | |
| DELETE | `/screens/:id` | JWT + Roles (ADMIN+) | Delete screen | Hard delete |
| POST | `/screens/:id/command` | JWT + Roles (EDITOR+) | Send command | |
| GET | `/screens/:id/preview` | JWT + Roles | Screen preview | |

**Issues:**
- No `/customer/` prefix
- No pagination on list
- Hard delete

### 2.5 Media Endpoints (`/api/v1/media/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/media` | JWT + Roles | List media | Has workspace scoping |
| POST | `/media/upload` | JWT + Roles (EDITOR+) | Upload media | 50MB body limit |
| DELETE | `/media/:id` | JWT + Roles (EDITOR+) | Delete media | Hard delete |
| GET | `/media/folders` | JWT + Roles | List folders | |
| POST | `/media/folders` | JWT + Roles (EDITOR+) | Create folder | |

**Issues:**
- No `/customer/` prefix
- No storage quota enforcement
- No pagination on list

### 2.6 Playlist Endpoints (`/api/v1/playlists/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/playlists` | JWT + Roles | List playlists | |
| POST | `/playlists` | JWT + Roles (EDITOR+) | Create playlist | |
| GET | `/playlists/:id` | JWT + Roles | Playlist detail | |
| PATCH | `/playlists/:id` | JWT + Roles (EDITOR+) | Update playlist | |
| DELETE | `/playlists/:id` | JWT + Roles (ADMIN+) | Delete playlist | Hard delete |
| POST | `/playlists/:id/items` | JWT + Roles (EDITOR+) | Add item | |
| PATCH | `/playlists/:id/items/:itemId` | JWT + Roles (EDITOR+) | Update item | |
| DELETE | `/playlists/:id/items/:itemId` | JWT + Roles (EDITOR+) | Remove item | |
| POST | `/playlists/:id/publish` | JWT + Roles (EDITOR+) | Publish playlist | |

**Issues:**
- No `/customer/` prefix
- No pagination on list

### 2.7 Other Customer Endpoints

| Domain | Route Prefix | Pagination | Issues |
|---|---|---|---|
| Canvases | `/api/v1/canvases/*` | No | No `/customer/` prefix |
| Schedules | `/api/v1/schedules/*` | No | No `/customer/` prefix |
| Campaigns | `/api/v1/campaigns/*` | No | No `/customer/` prefix |
| Subscriptions | `/api/v1/subscriptions/*` | No | No `/customer/` prefix |
| Notifications | `/api/v1/notifications/*` | No | No `/customer/` prefix |
| Onboarding | `/api/v1/onboarding/*` | N/A | No `/customer/` prefix |
| Feature Flags | `/api/v1/feature-flags/*` | N/A | No `/customer/` prefix |
| Islamic | `/api/v1/islamic/*` | N/A | No `/customer/` prefix |
| Audit Log | `/api/v1/audit-log/*` | No | No `/customer/` prefix |
| Account | `/api/v1/account/*` | No | No `/customer/` prefix |
| API Keys | `/api/v1/api-keys/*` | No | No `/customer/` prefix |
| Webhooks | `/api/v1/webhooks/*` | No | No `/customer/` prefix |
| Stripe | `/api/v1/stripe/*` | N/A | No `/customer/` prefix |

### 2.8 Player Endpoints (`/api/v1/player/*`)

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| GET | `/player/content` | Player Secret | Get playlist content | |
| POST | `/player/register` | Player Secret | Register screen | |
| POST | `/player/heartbeat` | Player Secret | Heartbeat | |
| GET | `/player/pairing/:sessionId` | Poll Secret | Get pairing status | |

**Issues:**
- No `/player/` prefix (already at `/api/v1/player/` but should be `/api/v1/player/` → keep as-is)
- Actually already correctly namespaced

### 2.9 Webhook Endpoints

| Method | Route | Guard | Purpose | Issues |
|---|---|---|---|---|
| POST | `/webhooks/stripe` | Stripe Signature | Stripe webhook | Raw body parser configured ✅ |
| GET | `/webhooks` | JWT + Roles | List customer webhooks | No `/customer/` prefix |
| POST | `/webhooks` | JWT + Roles | Create webhook | No `/customer/` prefix |
| DELETE | `/webhooks/:id` | JWT + Roles | Delete webhook | No `/customer/` prefix |

### 2.10 Health Endpoints

| Method | Route | Guard | Purpose |
|---|---|---|---|
| GET | `/health` | None | Liveness check |
| GET | `/ready` | None | Readiness check |
| GET | `/metrics` | None | Prometheus metrics |

**Issues:**
- `/metrics` has no auth — should be internal only

---

## 3. Target Route Structure

### 3.1 Namespace Mapping

| Current Prefix | Target Prefix | Bounded Context |
|---|---|---|
| `/api/v1/admin/*` | `/api/v1/platform/*` | Platform |
| `/api/v1/auth/*` | `/api/v1/auth/*` | Shared (stays) |
| `/api/v1/workspaces/*` | `/api/v1/customer/workspaces/*` | Customer |
| `/api/v1/screens/*` | `/api/v1/customer/screens/*` | Customer |
| `/api/v1/media/*` | `/api/v1/customer/media/*` | Customer |
| `/api/v1/playlists/*` | `/api/v1/customer/playlists/*` | Customer |
| `/api/v1/canvases/*` | `/api/v1/customer/canvases/*` | Customer |
| `/api/v1/schedules/*` | `/api/v1/customer/schedules/*` | Customer |
| `/api/v1/campaigns/*` | `/api/v1/customer/campaigns/*` | Customer |
| `/api/v1/subscriptions/*` | `/api/v1/customer/subscriptions/*` | Customer |
| `/api/v1/notifications/*` | `/api/v1/customer/notifications/*` | Customer |
| `/api/v1/onboarding/*` | `/api/v1/customer/onboarding/*` | Customer |
| `/api/v1/feature-flags/*` | `/api/v1/customer/feature-flags/*` | Customer |
| `/api/v1/islamic/*` | `/api/v1/customer/islamic/*` | Customer |
| `/api/v1/audit-log/*` | `/api/v1/customer/audit-log/*` | Customer |
| `/api/v1/account/*` | `/api/v1/customer/account/*` | Customer |
| `/api/v1/api-keys/*` | `/api/v1/customer/api-keys/*` | Customer |
| `/api/v1/webhooks/*` (customer) | `/api/v1/customer/webhooks/*` | Customer |
| `/api/v1/webhooks/stripe` | `/api/v1/internal/webhooks/stripe` | Internal |
| `/api/v1/player/*` | `/api/v1/player/*` | Player (stays) |
| `/api/v1/stripe/*` | `/api/v1/customer/billing/stripe/*` | Customer |
| `/health` | `/api/v1/public/health` | Public |
| `/ready` | `/api/v1/public/ready` | Public |
| `/metrics` | `/api/v1/internal/metrics` | Internal |

### 3.2 Migration Strategy

**Backward-compatible approach:**
1. Add new route prefix alongside old one (dual routing)
2. Frontend updates to new routes
3. After 1 release cycle, remove old routes

**NestJS implementation:**
```typescript
@Controller({ path: 'customer/screens', version: '1' })
// or
@Controller('customer/screens')
```

With global prefix `api/v1`, this becomes `/api/v1/customer/screens`.

---

## 4. Pagination Analysis

### 4.1 Current State

| Endpoint | Has Pagination? | Method |
|---|---|---|
| All admin list endpoints | ❌ | None |
| Workspace members | ❌ | None |
| Screens list | ❌ | None |
| Media list | ❌ | None |
| Playlists list | ❌ | None |
| Notifications | ❌ | None |
| Audit logs | ❌ | None |
| Campaigns | ❌ | None |
| Webhooks | ❌ | None |

**No endpoint has pagination.** All list endpoints return full result sets.

### 4.2 Risk Assessment

| Endpoint | Current Volume | At 1K Customers | At 10K Customers |
|---|---|---|---|
| Admin users list | <100 | 5K | 50K — **CRITICAL** |
| Admin fleet screens | <500 | 10K | 100K — **CRITICAL** |
| Admin customers list | <50 | 1K | 10K — **CRITICAL** |
| Admin workspaces | <100 | 1K | 10K — **HIGH** |
| Admin audit logs | <10K | 1M | 10M — **CRITICAL** |
| Customer screens | <50 | 500 | 5K — **HIGH** |
| Customer media | <100 | 5K | 50K — **HIGH** |
| Customer notifications | <500 | 50K | 500K — **CRITICAL** |

### 4.3 Recommendation

Implement cursor-based pagination (not offset) for all list endpoints:
- More performant for large datasets
- No count query needed
- Stable under concurrent writes

```typescript
// Query parameters
?cursor=<base64-cursor>&limit=20&sort=createdAt:desc

// Response
{
  items: [...],
  nextCursor: "<base64-cursor>" | null,
  hasMore: boolean
}
```

---

## 5. API Versioning

### 5.1 Current

**URI versioning:** `/api/v1/` prefix set in `main.ts:122`.

### 5.2 Assessment

✅ Correct approach. URI versioning is the most explicit and client-friendly method.

### 5.3 Issues

| Issue | Severity | Detail |
|---|---|---|
| No v2 plan | **LOW** | Blueprint doesn't mention v2. Not needed now. |
| No deprecation headers | **LOW** | When adding route namespace migration, old routes should send `Deprecation` header. |
| No API changelog | **MEDIUM** | No documentation of API changes between versions. |

---

## 6. Missing API Endpoints

| Endpoint | Blueprint Reference | Priority |
|---|---|---|
| `POST /auth/login` with audience param | `04-authentication.md` | **P0** |
| `POST /auth/exchange` (impersonation exchange) | `04-authentication.md` | **P1** |
| `GET /platform/tenants` (paginated) | `08-platform-domain.md` | **P1** |
| `GET /platform/staff` (paginated) | `08-platform-domain.md` | **P1** |
| `GET /platform/analytics/revenue` | `08-platform-domain.md` | **P2** |
| `GET /platform/analytics/churn` | `08-platform-domain.md` | **P2** |
| `GET /customer/usage` (current period) | `09-business-architecture.md` | **P1** |
| `GET /customer/invoices` | `09-business-architecture.md` | **P2** |
| `POST /customer/webhooks/test` | `12-notifications.md` | **P2** |
| `GET /customer/proof-of-play` | `02-customer-domain.md` | **P2** |
| `GET /internal/cron/subscription-expiry` | `09-business-architecture.md` | **P1** |
| `GET /internal/cron/trial-expiry` | `09-business-architecture.md` | **P1** |
| `GET /internal/cron/media-cleanup` | `02-customer-domain.md` | **P2** |

---

## 7. API Security Summary

| Concern | Current | Target |
|---|---|---|
| Auth on all endpoints | ✅ JWT on all except auth/public | Add audience check |
| Rate limiting | ✅ UserThrottlerGuard + WsThrottlerGuard | Add per-audience limits |
| Input validation | ✅ ValidationPipe with whitelist + forbidNonWhitelisted | Same |
| Output serialization | ⚠️ No serialization — raw Prisma objects returned | Add response DTOs to prevent data leakage |
| Error handling | ✅ DomainException + global filter | Same |
| CSRF | ✅ Middleware with exempt paths | Make exempt paths config-driven |
| CORS | ✅ Origin allow-list in production | Add per-audience origins |
| API key auth | ✅ ApiKeyAuthGuard with scopes | Same |
| Webhook signature | ✅ Stripe signature verification | Same |
