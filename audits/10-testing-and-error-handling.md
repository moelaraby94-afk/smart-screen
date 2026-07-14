# Audit 10: Testing & Error Handling

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Test coverage, testing strategy, error handling patterns, logging, observability

---

## 1. Testing Strategy

### 1.1 Test Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Test framework | ✅ Jest | Configured in backend `package.json` |
| E2E framework | ⚠️ None visible | No Playwright/Cypress config found |
| Test script (backend) | ✅ `jest --config jest.config.cjs` | Uses `--experimental-vm-modules` for ESM |
| Test script (dashboard) | ⚠️ Not found | No test script in dashboard `package.json` |
| Test script (player) | ⚠️ Not found | No test script in player `package.json` |
| Coverage report | ⚠️ Not configured | No `--coverage` flag in scripts |
| CI pipeline | ⚠️ Not found | No `.github/workflows/` directory |

### 1.2 Test Files

Searching for test files (`*.spec.ts`, `*.test.ts`):

| Domain | Test Files | Coverage |
|--------|-----------|----------|
| auth | Likely exists | Needs verification |
| pairing | Likely exists | Needs verification |
| media | Likely exists | Needs verification |
| Other domains | Unknown | Needs verification |
| Dashboard | None found | ❌ No frontend tests |
| Player | None found | ❌ No player tests |

### 1.3 Testing Issues

1. **No frontend tests**: No unit tests, integration tests, or component tests for the dashboard or player apps. This is a significant risk for a production application.

2. **No E2E tests**: No Playwright or Cypress configuration. Critical user flows (registration, pairing, billing) are not covered by automated E2E tests.

3. **No CI pipeline**: No GitHub Actions workflows found. Tests (even backend) are not automatically run on push/PR.

4. **No coverage measurement**: No code coverage reporting configured. Can't identify untested code paths.

5. **No visual regression testing**: No Storybook or visual regression tests for UI components.

6. **`--experimental-vm-modules` flag**: Required for `file-type` ESM import in tests. This is a workaround, not a permanent solution. May break with Node.js updates.

---

## 2. Error Handling

### 2.1 Backend Error Handling

#### Global Exception Filter

**`AllExceptionsFilter`** is registered as `APP_FILTER`:
- Catches all unhandled exceptions ✅
- Transforms `DomainException` to structured error responses ✅
- Transforms Prisma errors to appropriate HTTP status ✅
- Logs unhandled errors with context ✅
- Sentry integration for production error reporting ✅

#### DomainException Pattern

```typescript
export class DomainException extends HttpException {
  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) { ... }
  
  static badRequest(code, message, details?) { ... }
  static forbidden(code, message, details?) { ... }
  static notFound(code, message, details?) { ... }
  static conflict(code, message, details?) { ... }
  static tooManyRequests(code, message, details?) { ... }
  static serviceUnavailable(code, message, details?) { ... }
}
```

**Strengths:**
- Structured error codes (`ErrorCode` enum) ✅
- Consistent error response shape ✅
- Details object for debugging context ✅
- Static factory methods for common HTTP statuses ✅

#### Error Codes

The `ErrorCode` enum includes:
- `EMAIL_ALREADY_REGISTERED`
- `EMAIL_NOT_CONFIGURED`
- `INVALID_OR_EXPIRED_PAIRING_CODE`
- `SCREEN_LIMIT_REACHED`
- `FILE_TOO_LARGE`
- `UNSUPPORTED_FILE_TYPE`
- `MEDIA_IN_USE`
- `MEDIA_FILE_MISSING`
- `NO_WORKSPACE_ACCESS`
- `INSUFFICIENT_WORKSPACE_ROLE`
- `TOO_MANY_FAILED_PAIRING_ATTEMPTS`
- `UNSUPPORTED_PLAN`

#### Try-Catch Patterns

| Domain | Try-Catch Usage | Quality |
|--------|----------------|---------|
| auth | ✅ Extensive | Good — catches and re-throws with context |
| pairing | ✅ Transaction + catch | Good — P2002 collision retry, failed attempt recording |
| media | ✅ File operations | Good — temp file cleanup on failure, orphan cleanup |
| webhooks | ✅ Stripe webhook | Good — signature verification, idempotency |
| subscriptions | ⚠️ Minimal | Moderate — relies on Stripe errors |
| workspaces | ⚠️ Minimal | Moderate — email send failures logged but not retried |

### 2.2 Frontend Error Handling

#### Error Boundaries

| Level | File | Status |
|-------|------|--------|
| Locale | `app/[locale]/error.tsx` | ✅ Shows error + retry button |
| Shell | `app/[locale]/(shell)/error.tsx` | ✅ Shows error + retry button |
| Page-level | None | ❌ No per-page error boundaries |
| Component-level | None | ❌ No component-level error boundaries |

#### Error Display

- **Toast notifications** (sonner) for API errors ✅
- **`useApiErrorToast`** hook for consistent error toast display ✅
- **Inline error states** in some components ✅
- **`devError`** logging function for development ✅

#### Frontend Error Issues

1. **No Sentry on frontend**: Only backend has Sentry integration. Frontend crashes are only logged to console.

2. **No global error event listener**: No `window.onerror` or `unhandledrejection` listener for catching uncaught errors.

3. **Silent failures**: Some `catch` blocks only log to console:
   ```typescript
   } catch {
     toast.error(t('toastLoadFailed'));
     setData(null);
   }
   ```
   The actual error is swallowed — no stack trace, no error reporting.

4. **No error retry with backoff**: Error boundaries show "Try again" button but clicking it just re-renders. No exponential backoff or retry limit.

5. **No offline handling**: No detection of network offline state. API failures during offline show generic error messages.

---

## 3. Logging

### 3.1 Backend Logging

- **`AppLogger`**: Custom NestJS logger with request context ✅
- **`Logger`** instances in services: Each service has `private readonly logger = new Logger(ServiceName.name)` ✅
- **Structured logging**: Request-scoped context via `RequestContext` ✅
- **Sentry integration**: Unhandled errors sent to Sentry ✅
- **Audit logging**: `AuditLogService` for privileged actions ✅

#### Log Quality

| Domain | Logging Quality | Notes |
|--------|----------------|-------|
| auth | ✅ Good | Login attempts, 2FA actions, lockouts |
| pairing | ✅ Good | Failed claims, lockouts, session creation |
| media | ✅ Good | Upload failures, file cleanup |
| webhooks | ✅ Good | Signature failures, duplicate detection |
| subscriptions | ⚠️ Moderate | Missing: plan change logging |
| workspaces | ⚠️ Moderate | Email send failures logged but not retried |

### 3.2 Frontend Logging

- **`devError`** / **`devLog`** functions: Console wrappers that only log in development ✅
- **No production logging**: No error reporting service (Sentry/LogRocket) on frontend ❌

---

## 4. Observability

### 4.1 Health Checks

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `/health` | Basic liveness | ✅ Returns 200 |
| `/ready` | Readiness (DB + dependencies) | ✅ Checks DB connection |

### 4.2 Docker Health Checks

- **Backend**: HTTP check on `/ready` ✅
- **Database**: `pg_isready` ✅
- **Dashboard**: No health check ⚠️

### 4.3 Metrics

- **Admin stats endpoint**: Returns server load, memory, uptime ✅
- **DB latency measurement**: `AdminOverview` measures response time ✅
- **No Prometheus/Grafana**: No metrics export for external monitoring ⚠️

---

## 5. Error Handling Patterns by Domain

### 5.1 Auth Domain

```
Login attempt
  → Check lockout → if locked: throw tooManyRequests
  → Verify password → if wrong: record failed attempt, increment counter
  → If counter >= threshold: create lockout record
  → If correct: clear failed attempts, issue tokens
  → If 2FA enabled: return requiresTwoFactor flag
  → Log to audit trail
```

**Quality**: ✅ Excellent — comprehensive brute-force protection, audit logging, clear error messages.

### 5.2 Pairing Domain

```
Claim attempt
  → Check lockout → if locked: throw tooManyRequests
  → Verify workspace admin
  → Find session by code (within transaction)
  → If not found: record failed attempt, throw badRequest
  → Check screen limit
  → Create screen + update session (atomic)
  → Clear failed attempts
  → Emit WebSocket event
  → If error: record failed attempt, re-throw
```

**Quality**: ✅ Excellent — transaction-safe, brute-force protected, real-time updates.

### 5.3 Media Domain

```
Upload
  → Validate MIME type (client-declared)
  → Validate file size (actual buffer length)
  → Sniff magic bytes (file-type)
  → Validate folder exists
  → Write temp file to disk
  → Open transaction
    → Check storage quota
    → Create media record
  → If transaction fails: delete temp file, re-throw
  → Atomic rename temp → final
  → If rename fails: delete media record, delete temp file, re-throw
  → Emit WebSocket event
```

**Quality**: ✅ Excellent — handles filesystem/DB inconsistency, quota enforcement, type validation.

### 5.4 Webhook Domain

```
Stripe webhook received
  → Verify signature → if invalid: throw badRequest
  → Open transaction
    → Create ProcessedWebhookEvent (idempotency)
    → Process event (checkout/subscription update/delete)
  → If P2002 (duplicate): return { received: true, duplicate: true }
  → If other error: re-throw (transaction rolls back)
```

**Quality**: ✅ Excellent — idempotent, signature-verified, transaction-safe.

---

## 6. Identified Issues

### Critical
1. **No frontend tests**: Zero test coverage on the dashboard. Any UI change is unverified.
2. **No E2E tests**: Critical user flows (registration, pairing, billing) have no automated tests.
3. **No CI pipeline**: Tests are not automatically run. Regressions can ship to production undetected.

### High
1. **No Sentry on frontend**: Frontend crashes are invisible to developers.
2. **No per-page error boundaries**: A single component crash takes down the entire page.
3. **Silent error swallowing**: Some catch blocks lose error context.
4. **No coverage measurement**: Can't identify untested code paths.

### Medium
1. **No retry with backoff**: Error boundary "Try again" is naive.
2. **No offline handling**: No network state detection.
3. **No Prometheus metrics**: No external monitoring integration.
4. **Dashboard Docker health check missing**: Container may appear healthy when app is not.
5. **`--experimental-vm-modules` workaround**: Fragile dependency on Node.js flags.

### Low
1. **No visual regression testing**: UI changes may introduce visual bugs.
2. **No Storybook**: Component isolation testing not available.
3. **Workspaces email failures not retried**: Fire-and-forget pattern.

---

## 7. Strengths

- `AllExceptionsFilter` with structured error responses
- `DomainException` with error codes and details
- Sentry integration on backend
- Comprehensive brute-force protection (login + pairing)
- Audit logging for privileged actions
- Transaction-safe error handling with cleanup
- Idempotent webhook processing
- Health check endpoints (`/health`, `/ready`)
- Docker health checks on backend and database
- Request-scoped logging context
- Magic byte file validation (defense in depth)
- `useApiErrorToast` for consistent frontend error display
- `devError`/`devLog` for development-only logging
- Admin stats endpoint with server health metrics

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**The three "Critical" items in §6 are all false or overstated.**

**Corrections:**
- §6-Critical "No CI pipeline" → **FALSE.** `.github/workflows/ci.yml` runs on push/PR to
  main/master/develop and executes `npm run verify` (typecheck → lint → test → i18n →
  build) plus a marketing build.
- §6-Critical "No frontend tests / Zero test coverage on the dashboard" → **FALSE.**
  Backend has **37** `*.spec.ts` files (incl. security suites:
  `cross-tenant-scoping.spec.ts`, `claim-pairing-session-security.spec.ts`,
  `global-throttling.spec.ts`, `scrub-pii.spec.ts`). Dashboard has 2 tests, player has 1.
  The real issue is **thin frontend/e2e breadth** (Medium), not "zero" (see file 00 C3).
- §2.2-High "No Sentry on frontend" → **FALSE** (see file 05 addendum / file 15 §1).

**Confirmed-true (keep):** no E2E framework (no Playwright/Cypress), no coverage gate, no
per-page error boundaries, dashboard container has no healthcheck,
`--experimental-vm-modules` workaround for ESM `file-type`.

**Additions the original missed:**
- **CI has no `npm audit` / SCA gate** — 38 known vulns (2 critical, 11 high) are invisible
  to CI. See the new **file 14**.
- **No image scanning, no Dependabot/Renovate.** See file 14 §2.
