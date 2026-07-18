# 05 — API Design Audit

> **Objective:** Evaluate the REST API design: endpoint structure, naming conventions, request/response shapes, error handling, pagination, and documentation.

---

## 1. Current State

The API is a RESTful service exposed under the global prefix `/api/v1` with 15+ controllers and 60+ endpoints. It uses NestJS's built-in `ValidationPipe` for DTO validation, a custom `AllExceptionsFilter` for error normalization, and a stable `ApiErrorBody` shape for all error responses.

---

## 2. What Exists

### Endpoint Inventory

#### Auth (`/api/v1/auth`)
| Method | Path | Throttle | Auth | Description |
|--------|------|----------|------|-------------|
| POST | `/register/start` | 5/min | None | Begin registration with OTP |
| POST | `/register/resend` | 5/min | None | Resend OTP |
| POST | `/register/verify` | 10/min | None | Verify OTP, create account |
| POST | `/forgot-password` | 5/min | None | Request password reset |
| POST | `/reset-password` | 10/min | None | Reset password with token |
| POST | `/login` | 20/min | None | Login with email+password |
| POST | `/login-2fa` | 20/min | None | Login with 2FA token |
| POST | `/refresh` | None | Cookie | Refresh access token |
| GET | `/me` | None | JWT | Get current user profile |
| POST | `/exit-impersonation` | None | JWT | Exit impersonation mode |
| POST | `/logout` | None | JWT | Logout (delete sessions) |
| GET | `/2fa/status` | None | JWT | Check 2FA status |
| POST | `/2fa/setup` | None | JWT | Generate 2FA secret |
| POST | `/2fa/enable` | 5/min | JWT | Enable 2FA |
| POST | `/2fa/disable` | 5/min | JWT | Disable 2FA |
| POST | `/dev-login` | None | None | Dev only: login as first user |

#### Account (`/api/v1/account`)
| Method | Path | Throttle | Auth | Description |
|--------|------|----------|------|-------------|
| PATCH | `/profile` | None | JWT | Update profile |
| POST | `/email/request` | 5/min | JWT | Request email change |
| POST | `/email/verify` | None | JWT | Verify email change |
| GET | `/billing` | None | JWT | Get billing info |
| GET | `/billing/invoice/:invoiceRef/pdf` | 10/min | JWT | Get invoice PDF URL |
| GET | `/insights` | None | JWT | Get account insights |
| GET | `/export` | 3/min | JWT | Export user data (GDPR) |
| DELETE | `/` | 2/min | JWT | Anonymize account (GDPR) |

#### Workspaces (`/api/v1/workspaces`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| POST | `/` | JWT | Any | Create workspace |
| POST | `/bootstrap-demo` | JWT | Any | Bootstrap demo data |
| GET | `/account/members` | JWT | Any | List account members |
| GET | `/account/workspaces` | JWT | Any | List account workspaces |
| POST | `/account/members` | JWT | Any | Create account member |
| POST | `/account/members/add` | JWT | Any | Add existing user as account member |
| PATCH | `/account/members/:id/role` | JWT | Any | Update account member role |
| DELETE | `/account/members/:id` | JWT | Any | Remove account member |
| GET | `/:id` | JWT+Roles | All | Get workspace |
| GET | `/:id/members` | JWT+Roles | All | List members |
| PATCH | `/:id` | JWT+Roles | OWNER/ADMIN | Update workspace |
| DELETE | `/:id` | JWT+Roles | OWNER/ADMIN | Delete workspace |
| PATCH | `/:id/members/:mid/role` | JWT+Roles | OWNER/ADMIN | Update member role |
| DELETE | `/:id/members/:mid` | JWT+Roles | OWNER/ADMIN | Remove member |
| POST | `/:id/invites` | JWT+Roles | OWNER/ADMIN | Invite member |
| GET | `/:id/invites` | JWT+Roles | All | List invites |
| DELETE | `/:id/invites/:iid` | JWT+Roles | OWNER/ADMIN | Cancel invite |
| POST | `/:id/invites/:iid/resend` | JWT+Roles | OWNER/ADMIN | Resend invite |
| POST | `/invites/accept` | JWT | Any | Accept invite |
| POST | `/:id/pairing-sessions/claim` | JWT+Throttle | OWNER/EDITOR | Claim pairing session |
| POST | `/:id/pairing-started` | JWT+Roles | OWNER/EDITOR | Notify pairing started |
| GET | `/:id/activity` | JWT+Roles | All | Recent activity |
| POST | `/:id/seed-demo` | JWT+Roles | OWNER/ADMIN | Seed demo data |

#### Screens (`/api/v1/screens`)
| Method | Path | Auth | Roles | Description |
|--------|------|------|-------|-------------|
| GET | `/` | JWT+Roles | All | List screens (paginated) |
| POST | `/` | JWT+Roles | OWNER/ADMIN/EDITOR | Create screen |
| GET | `/:id` | JWT+Roles | All | Get screen by ID |
| PATCH | `/:id` | JWT+Roles | OWNER/ADMIN/EDITOR | Update screen |
| DELETE | `/:id` | JWT+Roles | OWNER/ADMIN | Delete screen |
| POST | `/:id/remote-command` | JWT+Roles | OWNER/ADMIN/EDITOR | Send remote command |
| GET | `/analytics` | JWT+Roles | All | Screen analytics |
| GET | `/:id/active-content` | JWT+Roles | All | Active content on screen |
| GET | `/:id/assignments` | JWT+Roles | All | List playlist assignments |
| POST | `/:id/assignments` | JWT+Roles | OWNER/ADMIN/EDITOR | Add playlist assignment |
| PATCH | `/:id/assignments/reorder` | JWT+Roles | OWNER/ADMIN/EDITOR | Reorder assignments |
| DELETE | `/:id/assignments/:aid` | JWT+Roles | OWNER/ADMIN/EDITOR | Remove assignment |
| POST | `/:id/override` | JWT+Roles | OWNER/ADMIN/EDITOR | Set playlist override |

#### Playlists, Media, Canvases, Schedules, Campaigns, Notifications, Subscriptions, Stripe, Admin, Islamic, Player, API Keys, Webhooks, Feature Flags — (similar pattern, omitted for brevity)

### Error Handling
- **`AllExceptionsFilter`** — Global filter that handles both HTTP and WebSocket exceptions
- **`normalizeHttpError()`** — Converts all exceptions to `ApiErrorBody` shape:
  ```json
  { "statusCode": 400, "code": "VALIDATION_FAILED", "message": "email must be an email", "details": { "violations": [...] } }
  ```
- **`DomainException`** — Custom exception with stable `ErrorCode` from `error-codes.ts`
- **`ErrorCode` enum** — 27 stable error codes covering auth, workspace, billing, media, pairing, webhooks
- Validation pipe errors are normalized to `VALIDATION_FAILED` with `details.violations` array
- Unhandled errors return `INTERNAL_ERROR` with generic message (no stack trace leakage)

### Pagination
- `PaginationQueryDto` — Standard `page` + `pageSize` (max 100)
- `buildPage()` helper — Returns `{ items, total, page, pageSize, totalPages }`
- Used by: Screens, Playlists, Media, Schedules, Campaigns, Admin users/customers
- **Not used by:** Notifications, Admin logs, Admin settings, Account insights (unbounded)

### Request Validation
- Global `ValidationPipe` with `whitelist: true` and `transform: true`
- DTOs use `class-validator` decorators (`@IsEmail`, `@IsString`, `@IsOptional`, etc.)
- Custom DTOs per endpoint in `dto/` subdirectories

### Response Format
- No consistent response envelope. Most endpoints return Prisma models directly.
- Some endpoints return custom shapes (e.g., auth returns `{ user, workspaces, accessToken }`)
- No HATEOAS links
- No field selection (`?fields=id,name`)

---

## 3. What Is Missing

1. **No OpenAPI/Swagger documentation** — 60+ endpoints with no auto-generated API docs. No `@nestjs/swagger` module.
2. **No API versioning beyond prefix** — `/api/v1` exists but no strategy for v2, deprecation, or backward compatibility.
3. **No consistent response envelope** — Some endpoints return Prisma models, others return custom objects. No `{ data, meta }` envelope.
4. **No field selection** — Clients can't request specific fields. All endpoints return full objects.
5. **No filtering/sorting on list endpoints** — Most list endpoints only support pagination. No `?sort=name&filter=status:online`.
6. **No bulk operations** — No `POST /screens/bulk-delete` or `PATCH /screens/bulk-update`.
7. **No idempotency keys** — POST endpoints don't support `Idempotency-Key` header for safe retries.
8. **No rate limit headers** — Throttler doesn't expose `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers.
9. **No pagination on several endpoints** — Notifications, admin logs, admin users, admin customers return unbounded results.
10. **No request/response logging** — No middleware logs API requests/responses for debugging.
11. **No API documentation for WebSocket events** — Socket.IO events are undocumented. No event schema.
12. **No content negotiation** — API only returns JSON. No support for `Accept: application/xml` or other formats.

---

## 4. Problems

1. **`workspaceId` as query parameter** — Security anti-pattern. Appears in logs, browser history, can be tampered. Should be in header.

2. **Inconsistent response shapes** — Auth returns `{ user, workspaces, accessToken }`, screens return Prisma model directly, notifications return `{ items, unreadCount }`. No standard envelope.

3. **Prisma model leakage** — Several endpoints return raw Prisma models including internal fields (`createdAt`, `updatedAt`) that may not be needed by clients. No serialization layer.

4. **No PATCH vs PUT distinction** — All updates use PATCH, which is correct for partial updates, but there's no PUT for full replacements. Some endpoints like `PATCH /playlists/:id/items` actually do a full replacement (confusing).

5. **Route ordering issues** — Several controllers have comments like "must be before :id routes to avoid route conflicts". This is fragile and could break if routes are reordered.

6. **No `Accept` header validation** — API doesn't validate `Accept` header. Clients requesting non-JSON still get JSON.

7. **Error messages in English only** — Error `message` field is English prose. While `code` is stable for i18n, the `message` is not localized.

---

## 5. Risks

- **High: No API documentation** — Onboarding new developers and third-party integrators is significantly harder.
- **Medium: No idempotency** — Network retries can cause duplicate resource creation.
- **Medium: No rate limit headers** — Clients can't adapt their request rate proactively.
- **Medium: Route ordering fragility** — Adding a new route could shadow existing ones.
- **Low: Prisma model leakage** — Internal fields exposed to clients, potential information disclosure.

---

## 6. Priority: **High**

API is functional but lacks documentation, consistency, and modern REST practices.

---

## 7. Completion Percentage: **78%**

Core CRUD is solid, error handling is excellent, pagination exists on most endpoints. Missing: OpenAPI docs, consistent envelope, idempotency, rate limit headers, field selection.

---

## 8. Recommendations

1. Add `@nestjs/swagger` module with `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators on all controllers
2. Implement a standard response envelope: `{ data: T, meta?: { page, pageSize, total, totalPages } }`
3. Add `Idempotency-Key` header support on POST endpoints with a `ProcessedIdempotencyRequest` model
4. Expose rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
5. Add a serialization layer (interceptor) that strips internal fields and transforms dates to ISO strings
6. Add pagination to all list endpoints (notifications, admin logs, admin users, admin customers)
7. Move `workspaceId` from query params to `x-workspace-id` header (plan for API v2)
8. Add filtering and sorting support: `?sort=-createdAt&filter[status]=online`
9. Add WebSocket event documentation (Socket.IO `@SubscribeMessage` events with payload schemas)
10. Add `Accept: application/json` validation middleware

---

## 9. Future Tasks

- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement standard response envelope
- [ ] Add idempotency key support
- [ ] Expose rate limit headers
- [ ] Add serialization interceptor
- [ ] Add pagination to all list endpoints
- [ ] Move workspaceId to header (API v2)
- [ ] Add filtering and sorting
- [ ] Document WebSocket events
- [ ] Add Accept header validation
