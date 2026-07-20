# 07 — API Boundaries

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Complete API route inventory, partitioning plan, and boundary enforcement

---

## 1. Current State

### 1.1 API Prefix

All API routes are served under `/api/v1/` (configured in `main.ts` via `app.setGlobalPrefix('api/v1')`).

### 1.2 Complete Route Inventory

#### Auth Routes (`AuthController`, `domains/auth/auth.controller.ts`)

| Method | Route | Guard | Purpose |
|---|---|---|---|
| POST | `/auth/register` | None (public) | Customer registration |
| POST | `/auth/login` | None (public) | Login (customer + staff) |
| POST | `/auth/refresh` | None (refresh token) | Token refresh |
| POST | `/auth/logout` | JwtAuthGuard | Logout |
| GET | `/auth/me` | JwtAuthGuard | Current user profile |
| POST | `/auth/verify-email` | None (public) | Email verification |
| POST | `/auth/resend-verification` | Throttled | Resend verification email |
| POST | `/auth/forgot-password` | Throttled | Password reset request |
| POST | `/auth/reset-password` | None (public) | Password reset |
| POST | `/auth/2fa/setup` | JwtAuthGuard | Enable 2FA |
| POST | `/auth/2fa/verify` | JwtAuthGuard | Verify 2FA code |
| POST | `/auth/2fa/disable` | JwtAuthGuard | Disable 2FA |
| POST | `/auth/exit-impersonation` | JwtAuthGuard | Exit impersonation |

#### Admin Routes (`AdminController`, `domains/admin/admin.controller.ts`)

| Method | Route | Guard | PlatformRoles |
|---|---|---|---|
| GET | `/admin/users` | JwtAuthGuard + PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/staff` | + SuperAdminDbGuard | — |
| POST | `/admin/staff` | + SuperAdminDbGuard | — |
| PATCH | `/admin/staff/:id/role` | + SuperAdminDbGuard | — |
| GET | `/admin/customers` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/customers/:id` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| GET | `/admin/customers/:cid/workspaces/:wid` | PlatformStaffDbGuard | SUPPORT_SPECIALIST, BILLING_MANAGER |
| POST | `/admin/customers/:id/workspaces` | PlatformStaffDbGuard | — (super admin) |
| PATCH | `/admin/customers/:cid/workspaces/:wid` | PlatformStaffDbGuard | — (super admin) |
| DELETE | `/admin/customers/:cid/workspaces/:wid` | + SuperAdminDbGuard | — |
| PATCH | `/admin/customers/:id/subscription` | + SuperAdminDbGuard | — |
| POST | `/admin/customers/:id/reminder` | PlatformStaffDbGuard | — (super admin) |
| GET | `/admin/workspaces` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| GET | `/admin/fleet/screens` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| GET | `/admin/screens` | PlatformStaffDbGuard | SUPPORT_SPECIALIST |
| PATCH | `/admin/workspaces/:id/subscription-mock` | + SuperAdminDbGuard | — |
| GET | `/admin/stats` | PlatformStaffDbGuard | BILLING_MANAGER |
| GET | `/admin/logs` | PlatformStaffDbGuard | — (super admin) |
| GET | `/admin/settings` | PlatformStaffDbGuard | — (super admin) |
| PATCH | `/admin/settings` | + SuperAdminDbGuard | — |
| POST | `/admin/settings/branding/upload` | + SuperAdminDbGuard | — |
| PATCH | `/admin/users/:id` | + SuperAdminDbGuard | — |
| POST | `/admin/users/:id/impersonate` | + SuperAdminDbGuard | — |

#### Feature Flag Routes (`FeatureFlagsController`, `domains/onboarding/feature-flags.controller.ts`)

| Method | Route | Guard |
|---|---|---|
| GET | `/admin/feature-flags` | JwtAuthGuard + SuperAdminDbGuard |
| GET | `/admin/feature-flags/:workspaceId` | JwtAuthGuard + SuperAdminDbGuard |
| PATCH | `/admin/feature-flags/:workspaceId` | JwtAuthGuard + SuperAdminDbGuard |

#### Branding Routes (`BrandingController`, `domains/admin/branding.controller.ts`)

| Method | Route | Guard |
|---|---|---|
| GET | `/branding` | None (public) |
| GET | `/branding/file/:variant` | None (public) |

#### Workspaces Routes (`WorkspacesController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| POST | `/workspaces` | JwtAuthGuard | — |
| POST | `/workspaces/bootstrap-demo` | JwtAuthGuard | — |
| GET | `/workspaces/account/members` | JwtAuthGuard | — |
| GET | `/workspaces/account/workspaces` | JwtAuthGuard | — |
| POST | `/workspaces/account/members` | JwtAuthGuard | — |
| POST | `/workspaces/account/members/add` | JwtAuthGuard | — |
| PATCH | `/workspaces/account/members/:id/role` | JwtAuthGuard | — |
| DELETE | `/workspaces/account/members/:id` | JwtAuthGuard | — |
| POST | `/workspaces/:id/seed-demo` | + RolesGuard | OWNER, ADMIN |
| GET | `/workspaces/:id` | + RolesGuard | ALL |
| GET | `/workspaces/:id/members` | + RolesGuard | ALL |
| PATCH | `/workspaces/:id` | + RolesGuard | OWNER, ADMIN |
| DELETE | `/workspaces/:id` | + RolesGuard | OWNER, ADMIN |
| PATCH | `/workspaces/:id/members/:mid/role` | + RolesGuard | OWNER, ADMIN |
| DELETE | `/workspaces/:id/members/:mid` | + RolesGuard | OWNER, ADMIN |
| POST | `/workspaces/:id/invites` | + RolesGuard | OWNER, ADMIN |
| GET | `/workspaces/:id/invites` | + RolesGuard | ALL |
| DELETE | `/workspaces/:id/invites/:iid` | + RolesGuard | OWNER, ADMIN |
| POST | `/workspaces/:id/invites/:iid/resend` | + RolesGuard | OWNER, ADMIN |
| POST | `/workspaces/invites/accept` | JwtAuthGuard | — |
| POST | `/workspaces/:id/pairing-sessions/claim` | + UserThrottlerGuard + RolesGuard | OWNER, EDITOR |
| POST | `/workspaces/:id/pairing-started` | + RolesGuard | OWNER, EDITOR |
| GET | `/workspaces/:id/activity` | + RolesGuard | ALL |

#### Screens Routes (`ScreensController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/screens` | JwtAuthGuard + RolesGuard | ALL |
| POST | `/screens` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/screens/:id/remote-command` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/screens/analytics` | + RolesGuard | ALL |
| GET | `/screens/:id/active-content` | + RolesGuard | ALL |
| GET | `/screens/:id/assignments` | + RolesGuard | ALL |
| POST | `/screens/:id/assignments` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/screens/:id/assignments/reorder` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/screens/:id/assignments/:aid` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/screens/:id/override` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/screens/:id` | + RolesGuard | ALL |
| PATCH | `/screens/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/screens/:id` | + RolesGuard | OWNER, ADMIN |

#### Canvases Routes (`CanvasesController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/canvases` | JwtAuthGuard + RolesGuard | ALL |
| GET | `/canvases/:id` | + RolesGuard | ALL |
| POST | `/canvases` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/canvases/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/canvases/:id/versions` | + RolesGuard | ALL |
| POST | `/canvases/:id/restore/:vid` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/canvases/:id` | + RolesGuard | OWNER, ADMIN |

#### Media Routes (`MediaController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| POST | `/media/upload` | JwtAuthGuard + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/media` | + RolesGuard | ALL |
| GET | `/media/stats` | + RolesGuard | ALL |
| DELETE | `/media/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/media/folders/list` | + RolesGuard | ALL |
| POST | `/media/folders` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/media/folders/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/media/folders/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/media/:id/url` | + RolesGuard | ALL |
| PATCH | `/media/:id/folder` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/media/:id/expiry` | + RolesGuard | OWNER, ADMIN, EDITOR |

#### Playlists Routes (`PlaylistsController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/playlists/groups` | JwtAuthGuard + RolesGuard | ALL |
| POST | `/playlists/groups` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/playlists/groups/:gid` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/playlists/groups/:gid` | + RolesGuard | OWNER, ADMIN |
| PATCH | `/playlists/groups/:gid/move` | + RolesGuard | OWNER, ADMIN, EDITOR |
| GET | `/playlists` | + RolesGuard | ALL |
| GET | `/playlists/:id` | + RolesGuard | ALL |
| POST | `/playlists` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/playlists/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/playlists/:id/duplicate` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/playlists/:id/clone-to-workspace` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/playlists/:id/items` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/playlists/:id` | + RolesGuard | OWNER, ADMIN |

#### Schedules Routes (`SchedulesController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/schedules` | JwtAuthGuard + RolesGuard | ALL |
| GET | `/schedules/overlaps` | + RolesGuard | ALL |
| GET | `/schedules/:id` | + RolesGuard | ALL |
| POST | `/schedules` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/schedules/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/schedules/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |

#### Campaigns Routes (`CampaignsController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/campaigns` | JwtAuthGuard + RolesGuard | ALL |
| GET | `/campaigns/:id` | + RolesGuard | ALL |
| POST | `/campaigns` | + RolesGuard | OWNER, ADMIN, EDITOR |
| PATCH | `/campaigns/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| DELETE | `/campaigns/:id` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/campaigns/:id/submit` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/campaigns/:id/approve` | + RolesGuard | OWNER, ADMIN |
| POST | `/campaigns/:id/reject` | + RolesGuard | OWNER, ADMIN |
| POST | `/campaigns/:id/publish` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/campaigns/:id/pause` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/campaigns/:id/resume` | + RolesGuard | OWNER, ADMIN, EDITOR |
| POST | `/campaigns/:id/end` | + RolesGuard | OWNER, ADMIN, EDITOR |

#### Subscriptions Routes (`SubscriptionsController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/subscriptions/current` | JwtAuthGuard + RolesGuard | ALL |
| PATCH | `/subscriptions/mock-plan` | + RolesGuard | OWNER, ADMIN |

#### Stripe Routes (`StripeController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| POST | `/stripe/checkout` | JwtAuthGuard + RolesGuard | OWNER, ADMIN |
| POST | `/stripe/portal` | + RolesGuard | OWNER, ADMIN |

#### Account Routes (`AccountController`)

| Method | Route | Guard |
|---|---|---|
| PATCH | `/account/profile` | JwtAuthGuard |
| POST | `/account/email/request` | JwtAuthGuard + Throttled |
| POST | `/account/email/verify` | JwtAuthGuard |
| GET | `/account/billing` | JwtAuthGuard |
| GET | `/account/billing/invoice/:ref/pdf` | JwtAuthGuard + Throttled |
| GET | `/account/insights` | JwtAuthGuard |
| GET | `/account/export` | JwtAuthGuard + Throttled |
| DELETE | `/account` | JwtAuthGuard + Throttled |

#### Webhooks Routes (`WebhooksController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/webhooks` | JwtAuthGuard + RolesGuard | OWNER, ADMIN |
| POST | `/webhooks` | + Throttled + RolesGuard | OWNER, ADMIN |
| DELETE | `/webhooks/:id` | + Throttled + RolesGuard | OWNER, ADMIN |
| PATCH | `/webhooks/:id/toggle` | + Throttled + RolesGuard | OWNER, ADMIN |
| POST | `/webhooks/:id/test` | + Throttled + RolesGuard | OWNER, ADMIN |

#### API Keys Routes (`ApiKeysController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/api-keys` | JwtAuthGuard + RolesGuard | OWNER, ADMIN |
| POST | `/api-keys` | + Throttled + RolesGuard | OWNER, ADMIN |
| DELETE | `/api-keys/:id` | + Throttled + RolesGuard | OWNER, ADMIN |

#### Onboarding Routes (`OnboardingController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/onboarding` | JwtAuthGuard + RolesGuard | OWNER, ADMIN |
| POST | `/onboarding/complete-step` | + Throttled + RolesGuard | OWNER, ADMIN |
| PATCH | `/onboarding/dismiss` | + Throttled + RolesGuard | OWNER, ADMIN |
| POST | `/onboarding/reset` | + Throttled + RolesGuard | OWNER, ADMIN |

#### Islamic Routes (`IslamicController`)

| Method | Route | Guard | Roles |
|---|---|---|---|
| GET | `/islamic/prayer-times` | JwtAuthGuard + RolesGuard + Throttled | ALL |
| GET | `/islamic/prayer-config` | + RolesGuard | ALL |
| PATCH | `/islamic/prayer-config` | + RolesGuard | OWNER, ADMIN |
| GET | `/islamic/prayer-pause-status` | + RolesGuard | ALL |
| GET | `/islamic/hijri-date` | + RolesGuard | ALL |
| GET | `/islamic/ramadan-config` | + RolesGuard | ALL |
| PATCH | `/islamic/ramadan-config` | + RolesGuard | OWNER, ADMIN |
| GET | `/islamic/ramadan-status` | + RolesGuard | ALL |

#### Notifications Routes (`NotificationsController`)

| Method | Route | Guard |
|---|---|---|
| GET | `/notifications` | JwtAuthGuard |
| PATCH | `/notifications/:id/read` | JwtAuthGuard |
| POST | `/notifications/mark-all-read` | JwtAuthGuard |
| GET | `/notifications/preferences` | JwtAuthGuard |
| PATCH | `/notifications/preferences` | JwtAuthGuard |

#### Player Routes (`PlayerController`)

| Method | Route | Guard |
|---|---|---|
| GET | `/player/bootstrap` | x-player-secret header |
| GET | `/player/workspace-bootstrap` | JwtAuthGuard |
| GET | `/player/canvas/:canvasId` | x-player-secret header |
| GET | `/player/prayer-pause-status` | x-player-secret header |
| GET | `/player/prayer-pause-status/jwt` | JwtAuthGuard |
| POST | `/player/pairing/sessions` | Throttled (public) |
| GET | `/player/pairing/sessions/:id` | x-pairing-poll-secret header |

#### Health Routes (`HealthModule`)

| Method | Route | Guard |
|---|---|---|
| GET | `/health` | None |
| (various) | `/health/*` | None |

#### Metrics Routes (`MetricsModule`)

| Method | Route | Guard |
|---|---|---|
| GET | `/metrics` | None (or internal) |

---

## 2. Problems

### 2.1 No Route Prefix Convention

Platform routes (`/admin/*`) and customer routes (`/screens/*`, `/workspaces/*`, etc.) share the same `/api/v1/` prefix. There is no structural convention that distinguishes them. The only differentiator is the guard chain.

### 2.2 Shared Auth Endpoints

`/auth/login` serves both platform staff and customer users. There is no way to restrict login to a specific audience. A platform staff member can log in via the customer dashboard's login form and vice versa.

### 2.3 No API Versioning Strategy

The `/api/v1/` prefix is hardcoded. There is no plan for `v2` or version negotiation. If the Control Panel and Customer Dashboard need different API versions, there is no mechanism to support it.

### 2.4 Webhook Routes Mixed with Customer Routes

`/webhooks` serves both customer webhook management (CRUD) and Stripe webhooks (at `/webhooks/stripe`). The Stripe webhook endpoint is public (authenticated by Stripe signature), while the customer webhook endpoints require JWT auth. These are fundamentally different concerns sharing a route prefix.

---

## 3. Target Architecture

### 3.1 Route Partitioning

| Partition | Prefix | Guard Chain | Token Audience | Frontend |
|---|---|---|---|---|
| **Platform API** | `/api/v1/admin/*` | JwtAuthGuard → PlatformStaffDbGuard → SuperAdminDbGuard | `platform` | Control Panel |
| **Customer API** | `/api/v1/workspaces/*`, `/screens/*`, `/media/*`, `/playlists/*`, `/canvases/*`, `/schedules/*`, `/campaigns/*`, `/subscriptions/*`, `/stripe/*`, `/onboarding/*`, `/islamic/*`, `/api-keys/*`, `/webhooks/*` (customer) | JwtAuthGuard → RolesGuard | `customer` or `platform` (impersonation) | Customer Dashboard |
| **Player API** | `/api/v1/player/*` | x-player-secret or JwtAuthGuard | `player` or `customer` | Player App |
| **Auth API** | `/api/v1/auth/*` | None (public) or JwtAuthGuard | Issues both `platform` and `customer` | Both |
| **Account API** | `/api/v1/account/*` | JwtAuthGuard | `customer` | Customer Dashboard |
| **Notifications API** | `/api/v1/notifications/*` | JwtAuthGuard | `customer` | Customer Dashboard |
| **Branding API** | `/api/v1/branding` | None (public) | N/A | Both |
| **Webhook Receiver** | `/api/v1/webhooks/stripe` | Stripe signature | N/A | N/A |
| **Health API** | `/api/v1/health/*` | None | N/A | Monitoring |
| **Metrics API** | `/api/v1/metrics` | None (or internal) | N/A | Monitoring |

### 3.2 New Endpoints (Proposed)

| Method | Route | Guard | Purpose |
|---|---|---|---|
| POST | `/auth/exchange-impersonation` | Exchange token (Redis) | One-time token exchange for cross-system impersonation |
| POST | `/auth/login` (modified) | None (public) | Add `audience` parameter to request body |

### 3.3 Audience Validation Middleware

```typescript
// Pseudocode for audience validation middleware
function audienceGuard(requiredAudiences: string[]) {
  return (req, res, next) => {
    const token = extractToken(req);
    const payload = verifyJwt(token);
    const audience = payload.audience ?? 'customer'; // backward compatible
    if (!requiredAudiences.includes(audience)) {
      return res.status(403).json({ error: 'Invalid token audience' });
    }
    next();
  };
}

// Applied as:
// /admin/* → audienceGuard(['platform'])
// /screens/*, /workspaces/*, etc. → audienceGuard(['customer', 'platform'])
// /player/* → no audience check (uses x-player-secret)
// /auth/* → no audience check (public or issues tokens)
```

### 3.4 API Contract Per Frontend

#### Control Panel API Contract

The Control Panel calls **only** these endpoints:

- `POST /auth/login` (with `audience: 'platform'`)
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/exit-impersonation`
- `GET /admin/stats`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `POST /admin/users/:id/impersonate`
- `GET /admin/staff`
- `POST /admin/staff`
- `PATCH /admin/staff/:id/role`
- `GET /admin/customers`
- `GET /admin/customers/:id`
- `GET /admin/customers/:cid/workspaces/:wid`
- `POST /admin/customers/:id/workspaces`
- `PATCH /admin/customers/:cid/workspaces/:wid`
- `DELETE /admin/customers/:cid/workspaces/:wid`
- `PATCH /admin/customers/:id/subscription`
- `POST /admin/customers/:id/reminder`
- `GET /admin/workspaces`
- `GET /admin/fleet/screens`
- `GET /admin/screens`
- `PATCH /admin/workspaces/:id/subscription-mock`
- `GET /admin/logs`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `POST /admin/settings/branding/upload`
- `GET /admin/feature-flags`
- `GET /admin/feature-flags/:workspaceId`
- `PATCH /admin/feature-flags/:workspaceId`
- `GET /branding`
- `GET /branding/file/:variant`
- `GET /health`

#### Customer Dashboard API Contract

The Customer Dashboard calls **only** these endpoints:

- `POST /auth/register`
- `POST /auth/login` (with `audience: 'customer'` or no audience)
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/2fa/setup`
- `POST /auth/2fa/verify`
- `POST /auth/2fa/disable`
- `POST /auth/exchange-impersonation` (new)
- `POST /workspaces` (all workspace endpoints)
- `GET /screens` (all screen endpoints)
- `GET /canvases` (all canvas endpoints)
- `GET /media` (all media endpoints)
- `GET /playlists` (all playlist endpoints)
- `GET /schedules` (all schedule endpoints)
- `GET /campaigns` (all campaign endpoints)
- `GET /subscriptions/current`
- `PATCH /subscriptions/mock-plan`
- `POST /stripe/checkout`
- `POST /stripe/portal`
- `PATCH /account/profile` (all account endpoints)
- `GET /webhooks` (all webhook endpoints)
- `GET /api-keys` (all API key endpoints)
- `GET /onboarding` (all onboarding endpoints)
- `GET /islamic/*` (all Islamic endpoints)
- `GET /notifications` (all notification endpoints)
- `GET /branding`
- `GET /player/workspace-bootstrap` (for JWT-mode player)
- `GET /player/prayer-pause-status/jwt`

---

## 4. Recommended Solution

### 4.1 Add Audience Validation (Phase 2)

Implement audience validation as a NestJS guard applied at the module level:
- `AdminModule` → `@UseGuards(PlatformAudienceGuard)` at the module level
- Customer modules → `@UseGuards(CustomerAudienceGuard)` at the module level

Make validation additive: tokens without `audience` claim are treated as `customer`.

### 4.2 Modify Login Endpoint (Phase 2)

Add an optional `audience` field to the login DTO:
- `audience: 'platform'` → Backend checks `isSuperAdmin` or `platformStaffRole` is set; rejects if not
- `audience: 'customer'` or omitted → Backend issues customer-audience token (backward compatible)

### 4.3 Add Exchange Endpoint (Phase 3)

`POST /auth/exchange-impersonation`:
- Request: `{ exchangeToken: string }`
- Validates exchange token in Redis (one-time use, 30s TTL)
- Issues customer-audience access + refresh tokens with `impersonatedBy` claim
- Deletes exchange token from Redis

### 4.4 Document API Contracts

Maintain the API contract lists (Section 3.4) as living documentation. Any new endpoint must be added to the appropriate contract. The Control Panel must never call customer endpoints directly, and vice versa.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Audience validation breaks existing tokens | High | Make additive (no `audience` = `customer`). Deploy before requiring audience. |
| Exchange token is intercepted | High | Short TTL (30s), single-use, signed, stored in Redis with automatic expiry. |
| Control Panel calls customer endpoint by mistake | Medium | ESLint rule in Control Panel to restrict `apiFetch` calls to `/admin/*` and `/auth/*`. |
| Customer Dashboard calls admin endpoint by mistake | Medium | ESLint rule in Customer Dashboard to restrict `apiFetch` calls to non-`/admin/*` paths. |
| API version conflicts between panels | Low | Both panels use the same API version (`v1`). Version independently when needed. |

---

## 6. Alternatives

### 6.1 Separate API Gateways

Route platform and customer traffic through different API gateways.

**Pros:** Physical separation, independent rate limiting, independent CORS.
**Cons:** Infrastructure complexity, single backend still serves both.

**Verdict:** Rejected. Route-level partitioning within the backend is sufficient.

### 6.2 GraphQL Federation

Replace REST with GraphQL and use schema federation to separate platform and customer schemas.

**Pros:** Client-driven queries, schema composition, type safety.
**Cons:** Complete API rewrite, overkill for current needs.

**Verdict:** Rejected. The REST API is well-structured and serves the current needs.

---

## 7. Migration Notes

- **Phase 2:** Add `audience` claim to JWT tokens. Modify login endpoint to accept `audience` parameter. Add audience validation guards.
- **Phase 3:** Add `/auth/exchange-impersonation` endpoint. Update Control Panel to use redirect-based impersonation.
- **No route renames required.** All existing routes keep their paths. The partitioning is enforced by guards, not by URL structure changes.

---

## 8. Open Questions

1. **Should the `/webhooks/stripe` endpoint be moved to a different prefix** (e.g., `/stripe/webhooks`) to avoid confusion with customer webhook management?
2. **Should the `/health` and `/metrics` endpoints be under `/api/v1/`** or at the root level?
3. **Should the Control Panel have its own health check endpoint** or share the backend's?
4. **Should API versioning be per-frontend** (e.g., `/api/v1/admin/*` vs `/api/v1/customer/*`) or shared?
5. **Should the player API be separated into its own service** in the future?

---

## 9. Final Recommendation

Partition the API at the guard level using JWT audience claims. Keep all routes under `/api/v1/` with their existing paths. Add audience validation as an additive, non-breaking change. Document explicit API contracts for each frontend (Section 3.4) and enforce them with ESLint rules.

The most critical addition is the `/auth/exchange-impersonation` endpoint, which enables the cross-system impersonation flow. This endpoint should be implemented in Phase 3, before removing admin routes from the Customer Dashboard.

The existing API is well-structured with consistent guard patterns. The partitioning work is primarily additive (new guards, new endpoint) rather than refactoring (no route changes).
