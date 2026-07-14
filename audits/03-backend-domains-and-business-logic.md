# Audit 03: Backend Domains & Business Logic

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** All 22 backend domain modules — services, controllers, DTOs, business logic quality

---

## 1. Domain Inventory

| Domain | Files | Controller Routes | Service Methods | DTOs | Status |
|--------|-------|-------------------|-----------------|------|--------|
| account | 7 | 6 | 8 | 3 | ✅ Complete |
| admin | 14 | 15+ | 10+ | 3 | ✅ Complete |
| api-keys | 4 | 5 | 6 | 2 | ✅ Complete |
| audit-log | 2 | 2 | 3 | 0 | ✅ Complete |
| auth | 20 | 12 | 15+ | 8 | ✅ Complete |
| canvases | 7 | 5 | 7 | 2 | ✅ Complete |
| email | 5 | 0 (service only) | 4 | 0 | ✅ Complete |
| islamic | 6 | 8 | 6 | 2 | ⚠️ Phase 9 (recently fixed) |
| maintenance | 2 | 2 | 2 | 0 | ✅ Complete |
| media | 9 | 6 | 8 | 2 | ✅ Complete |
| notifications | 3 | 4 | 5 | 0 | ✅ Complete |
| onboarding | 7 | 6 | 5 | 2 | ✅ Complete |
| pairing | 6 | 0 (via player + workspaces) | 4 | 2 | ✅ Complete |
| player | 4 | 4 | 4 | 0 | ✅ Complete |
| playlists | 10 | 7 | 8 | 3 | ✅ Complete |
| realtime | 3 | 0 (WebSocket) | 5+ | 0 | ✅ Complete |
| schedules | 9 | 5 | 6 | 2 | ✅ Complete |
| screens | 9 | 7 | 8 | 2 | ✅ Complete |
| stripe | 4 | 2 | 0 (delegates to subscriptions) | 2 | ✅ Complete |
| subscriptions | 5 | 2 | 8 | 1 | ✅ Complete |
| webhooks | 9 | 5 + 1 webhook receiver | 5 | 2 | ✅ Complete |
| workspaces | 9 | 14 | 12+ | 4 | ✅ Complete |

---

## 2. Business Logic Quality Analysis

### 2.1 Auth Domain (`auth.service.ts` — 1057 lines)

**Strengths:**
- OTP-based registration with bcrypt-hashed codes (not plaintext) ✅
- Account enumeration prevention in `registerResend` (always returns generic success) ✅
- Per-account brute-force lockout (`LoginLockout` model) independent of IP throttling ✅
- 2FA support (TOTP + backup codes) ✅
- JWT token pair with `typ` claim to prevent access/refresh confusion ✅
- Per-session refresh tokens (`RefreshToken` model) ✅
- Super admin audit logging on login ✅

**Issues:**
1. **`devLogin` endpoint**: Disabled in production but still compiled. Should be guarded with a compile-time flag or separate dev-only module.
2. **`loginWithTwoFactor`**: Duplicates ~80% of `login` method. Should be refactored to share password verification logic.
3. **`refreshTokens`**: No rotation detected — the same refresh token can be used indefinitely within its lifetime. Best practice is to rotate on each refresh (issue new refresh token + invalidate old one).
4. **Welcome email**: Fire-and-forget `.then()/.catch()` on email send — if the promise rejects after the response is sent, the error is only logged, not retried.

### 2.2 Workspaces Domain (`workspaces.service.ts` — 907 lines)

**Strengths:**
- Role validation in `inviteMember` (only VIEWER/EDITOR/ADMIN, not OWNER) ✅
- Existing member check before invite ✅
- Pending invite deduplication ✅
- Direct-add for existing users vs email invite for new users ✅
- Invitation token rotation on resend ✅
- `assertWorkspaceAccess` for authorization ✅

**Issues:**
1. **Hardcoded `/en/` in invite URLs**: `inviteUrl = ${base}/en/team` and `${base}/en/invite?token=...` — doesn't respect invitee's locale preference. Should use the invited user's locale or a default from workspace.
2. **`deleteWorkspace`**: Not shown in detail but cascading deletes are handled by Prisma. No soft-delete pattern — workspace data is permanently destroyed.
3. **`bootstrapDemo`**: Creates demo workspace with seeded content. No rate limiting on this endpoint beyond the global throttle.

### 2.3 Pairing Domain (`pairing.service.ts` — 472 lines)

**Strengths:**
- 6-digit code collision retry (up to 32 attempts) ✅
- Per-screen secret (replacing shared `PLAYER_HEARTBEAT_SECRET`) ✅
- One-time secret handoff via atomic `updateMany` guard ✅
- Tenant isolation (pinned `workspaceId` on session) ✅
- Brute-force lockout for claim attempts (`PairingClaimLockout`) ✅
- Screen limit enforcement inside transaction ✅
- Serial number collision retry ✅

**Issues:**
1. **Expired session cleanup**: No scheduled task to mark expired sessions. `pollSession` lazily marks them expired, but stale PENDING sessions accumulate if never polled.
2. **Code generation**: Uses `randomInt(100_000, 1_000_000)` — 900,000 possible codes. With 32 retry attempts, collision probability is low but not cryptographically random. For a 6-digit code this is acceptable.

### 2.4 Media Domain (`media.service.ts` — 571 lines)

**Strengths:**
- Magic byte sniffing via `file-type` (doesn't trust client-declared MIME) ✅
- File size validation against buffer length (not client-declared size) ✅
- Atomic temp-then-rename pattern for disk writes ✅
- Transaction rollback with file cleanup on failure ✅
- Storage quota enforcement inside transaction ✅
- Media-in-use check before deletion ✅
- Cross-workspace media duplication with quota check ✅

**Issues:**
1. **`MAX_BYTES` constant**: Not visible in the audited section. Should be configurable per plan (e.g., Enterprise allows larger files).
2. **No virus scanning**: Files are sniffed for type but not scanned for malware. For a SaaS with user uploads, this is a risk.
3. **`unlinkSync` in `remove`**: Synchronous file deletion on the event loop. Should use async `unlink`.

### 2.5 Subscriptions Domain (`subscriptions.service.ts`)

**Strengths:**
- Per-screen pricing model with included screens + overage ✅
- Stripe integration with Checkout + Billing Portal ✅
- Webhook-driven subscription sync (`syncFromStripeSubscription`) ✅
- Mock plan support for development ✅
- `BigInt` for storage limits ✅

**Issues:**
1. **`setMockPlan`**: Only supports FREE and PRO, not STARTER or ENTERPRISE. The `assertMockBillingAllowed()` guard prevents production use, but the limitation is surprising.
2. **No proration logic**: When upgrading/downgrading plans, no proration calculation is visible. Stripe handles this for paid plans, but mock plan changes are instant.
3. **`perScreenPricingForPlan`**: Hardcoded pricing values in code — should be in a config table or environment variables for easy adjustment.

### 2.6 Schedules Domain (`scheduling.service.ts`)

**Strengths:**
- Timezone-aware scheduling using `date-fns-tz` ✅
- `formatInTimeZone` for correct day-of-week and time calculation ✅
- Override support (one-click playlist override with expiry) ✅
- Schedule overlap detection ✅
- Priority-based conflict resolution ✅

**Issues:**
1. **`daysOfWeek` as `Int[]`**: Stores day numbers (0-6). No validation at DB level that values are 0-6. Application-level validation only.
2. **No recurring schedule UI**: Backend supports days of week but no monthly/yearly recurrence.

### 2.7 Islamic Domain (`prayer-times.service.ts`, `ramadan.service.ts`)

**Strengths (post-audit fixes):**
- Workspace timezone used for all calculations ✅ (fixed in audit)
- Safe JSON parsing for `enabledPrayers` ✅ (fixed in audit)
- Cache eviction to prevent memory leaks ✅ (fixed in audit)
- `@Throttle` on external API endpoint ✅ (fixed in audit)
- `@IsIn` validation on prayer names ✅ (fixed in audit)

**Issues:**
1. **`ramadanConfig` Prisma typings**: Lint errors indicate `Property 'ramadanConfig' does not exist on type 'PrismaService'`. This suggests the Prisma client hasn't been regenerated after adding the `RamadanConfig` model. **Needs `npx prisma generate`**.
2. **No Hijri calendar widget**: The execution plan mentions a Hijri Calendar Widget but only the prayer times widget was implemented. The hijri-date endpoint exists but no dedicated widget.
3. **No prayer-based scheduling**: The execution plan mentions "Prayer Time Scheduling" (scheduling content around prayer times) but this is not implemented. The `autoPauseEnabled` flag exists in config but no service logic pauses content at prayer times.
4. **External API dependency**: Aladhan API (`api.aladhan.com`) has no fallback. If the API is down, prayer times fail entirely. Consider caching the full day's times (which is already done) and falling back to cached values.

### 2.8 Webhooks Domain (`webhooks.service.ts`, `stripe-webhook.service.ts`)

**Strengths:**
- HMAC-SHA256 payload signing ✅
- Idempotent webhook processing (`ProcessedWebhookEvent`) ✅
- Stripe signature verification ✅
- Soft-delete for webhook endpoints ✅
- Webhook test endpoint with timeout ✅

**Issues:**
1. **No retry queue**: Failed webhook deliveries are not retried. A background queue (BullMQ/Sidekiq equivalent) would improve reliability.
2. **No webhook event log**: No record of webhook delivery attempts (success or failure) beyond the test endpoint.
3. **SSRF risk**: `webhooks.service.ts` `test()` method makes outbound HTTP to user-provided URLs. No SSRF protection (blocking internal IPs, localhost, etc.).

---

## 3. Cross-Domain Concerns

### 3.1 Error Handling

- **`DomainException`** custom exception with error codes ✅
- **`AllExceptionsFilter`** global filter ✅
- **Consistent error codes** (`ErrorCode` enum) ✅
- **Sentry integration** for unhandled errors ✅

### 3.2 Authorization

- **`JwtAuthGuard`** on all authenticated routes ✅
- **`RolesGuard`** with `@Roles()` decorator for role-based access ✅
- **`SuperAdminDbGuard`** for admin-only routes ✅
- **`assertWorkspaceAccess`** pattern in services ✅

### 3.3 Rate Limiting

- **Global `ThrottlerGuard`** (300 req/min per IP) ✅
- **Per-route `@Throttle`** on sensitive endpoints ✅
- **`UserThrottlerGuard`** for per-user tracking on authenticated routes ✅
- **`LoginLockout`** and `PairingClaimLockout`** for brute-force protection ✅

---

## 4. Identified Issues Summary

### Critical
1. **Prisma client not regenerated**: `ramadanConfig` property missing from `PrismaService` type — `npx prisma generate` needed.

### High
1. **No refresh token rotation**: Security best practice is to rotate refresh tokens on each use.
2. **SSRF risk in webhook test**: No internal IP filtering on user-provided webhook URLs.
3. **No webhook retry mechanism**: Failed deliveries are silently lost.
4. **Hardcoded `/en/` in invite URLs**: Doesn't respect user/workspace locale.

### Medium
1. **`loginWithTwoFactor` code duplication**: ~80% overlap with `login` method.
2. **Synchronous `unlinkSync`** in media removal.
3. **No expired pairing session cleanup**: Stale sessions accumulate.
4. **Hardcoded pricing in subscriptions**: Should be configurable.
5. **Missing Hijri calendar widget and prayer-based scheduling**: Phase 9 features incomplete.
6. **No virus scanning on uploads**: Security risk for user-generated content.

### Low
1. **`devLogin` endpoint** compiled in production builds.
2. **Welcome email fire-and-forget**: No retry on failure.
3. **Mock plan limited to FREE/PRO**: STARTER/ENTERPRISE not supported.

---

## 5. Strengths

- Comprehensive domain coverage (22 domains)
- Security-first approach (hashing, rate limiting, brute-force protection)
- Transaction-safe operations (quota checks, file operations)
- Magic byte file validation (not trusting client headers)
- Atomic operations (pairing secret handoff, code generation)
- Well-documented with business context in comments
- Consistent error handling with custom error codes
- Audit logging for privileged actions

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Corrections:**
- §2.1 & §4-High "No refresh token rotation" → **FALSE.** Rotation is implemented:
  `auth.service.ts:717-718` deletes the old session row and issues a new token pair on
  every refresh. (This also contradicts audit 04 §2.3, which is the correct one.) Remove
  this from the High list.
- §2.7 "Prayer-based scheduling / auto-pause: config flag exists, no service logic" →
  **misleading.** The backend fully implements `checkPrayerPause()`
  (`prayer-times.service.ts:174-210`, timezone-aware, buffers applied) and exposes it at
  `GET /islamic/prayer-pause-status` (`islamic.controller.ts:78`). The *real* gap is that
  the **player app never calls it** — no on-screen effect. Fix is player-side, not backend.

**Confirmed-true (keep):**
- **SSRF** in `webhooks.service.ts` — `test()` does `fetch(endpoint.url)` (`:118`) with only
  a `new URL()` format check (`:34`); no internal-IP/DNS-rebind guard. **Real High.**
- **`unlinkSync`** on the event loop at `media.service.ts:414` (temp cleanup at `:252`
  correctly uses async `unlink`).
- **AI generation is a genuine mock** — `ai-tools-client.tsx` uses a static `mockResults`
  map (`:18`, consumed `:67`).
