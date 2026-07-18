# 18 — Testing Audit

> **Objective:** Evaluate the test coverage, test quality, test infrastructure, and testing strategy across the backend.

---

## 1. Current State

The backend has **49 spec files** (unit tests) spread across domain modules and common infrastructure. There is **one E2E test file** (`test/app.e2e-spec.ts`) that is a skeleton. Testing uses Jest with `ts-jest` for TypeScript compilation.

---

## 2. What Exists

### Test Infrastructure
- **Framework:** Jest
- **TypeScript:** `ts-jest` with `tsconfig.json`
- **E2E config:** `test/jest-e2e.json` (separate Jest config for E2E)
- **Scripts:** `npm test` (unit), `npm run test:e2e` (E2E)
- **Coverage:** No coverage threshold configured

### Unit Test Files (49 total)

#### Common Infrastructure (17 specs)
| File | Tests | Quality |
|------|-------|---------|
| `audit-log.service.spec.ts` | Audit log append/list | Good |
| `cross-tenant-scoping.spec.ts` | Tenant isolation | Good |
| `otp.helper.spec.ts` | OTP generation | Basic |
| `platform-staff-db.guard.spec.ts` | Platform staff guard | Good |
| `roles.guard.spec.ts` | Roles guard | Good |
| `workspace-auth.helper.spec.ts` | Workspace auth helper | Good |
| `assert-production-secrets.spec.ts` | Secret validation | Good |
| `config.helper.spec.ts` | Config helper | Good |
| `cors-config.spec.ts` | CORS config | Good |
| `all-exceptions.filter.spec.ts` | Exception filter | Good |
| `normalize-http-error.spec.ts` | Error normalization | Good |
| `health.controller.spec.ts` | Health controller | Basic |
| `metrics.middleware.spec.ts` | Metrics middleware | Good |
| `metrics.spec.ts` | Metrics service | Good |
| `scrub-pii.spec.ts` | PII scrubbing | Good |
| `pagination-query.dto.spec.ts` | Pagination DTO | Good |
| `workspace-capabilities.spec.ts` | Workspace capabilities | Good |
| `request-context.middleware.spec.ts` | Request context | Good |
| `global-throttling.spec.ts` | Throttling config | Good |
| `request-body-validation.spec.ts` | Body validation | Good |

#### Domain Modules (32 specs)
| Module | Specs | Coverage |
|--------|-------|----------|
| auth | 4 (refresh-session, dev-login, lockout, otp) | Good |
| account | 2 (gdpr, service) | Good |
| campaigns | 1 (service) | Basic |
| canvases | 1 (service) | Basic |
| email | 1 (service) | Good |
| maintenance | 1 (service) | Good |
| media | 2 (service, subscription-limits) | Good |
| onboarding | 1 (service) | Basic |
| pairing | 2 (p2-t3, integration) | Good |
| player | 2 (service, prayer-pause) | Good |
| playlists | 3 (nested, p2-t1, service) | Good |
| realtime | 1 (gateway) | Basic |
| schedules | 1 (service) | Basic |
| screens | 1 (service) | Basic |
| subscriptions | 1 (p2-t2) | Good |
| webhooks | 5 (stripe p2-t4, service, t3-4, t3-5, webhooks service) | Good |

#### Modules with ZERO specs (8)
- **admin** — No tests (critical security module)
- **api-keys** — No tests
- **islamic** — No tests
- **notifications** — No tests
- **workspaces** — No tests (core module)
- **audit-log** — No dedicated tests (uses common audit)
- **pairing** — Partial (2 specs but not comprehensive)
- **stripe** — No dedicated tests (covered via webhooks)

### E2E Tests
- `test/app.e2e-spec.ts` — Skeleton only (729 bytes). Tests that the app starts and `/api/v1/health` returns 200.
- No E2E tests for any business flow: auth, CRUD, pairing, scheduling, billing.

### Test Patterns
- **Mocking:** Services mock PrismaService with manual mock objects
- **No test database:** Unit tests use mocked Prisma, no real DB
- **No Testcontainers:** No integration tests with real PostgreSQL
- **No factory functions:** No test data factories or fixtures
- **No test helpers:** No shared test utilities for creating users, workspaces, etc.

---

## 3. What Is Missing

1. **No integration tests** — No tests that exercise the full HTTP → Controller → Service → Prisma → DB → Response cycle. All tests mock Prisma.

2. **No E2E test suite** — Only a skeleton. No tests for:
   - Auth flow (register → verify → login → refresh → logout)
   - Screen pairing (start → poll → claim → bootstrap)
   - Content flow (upload media → create playlist → assign to screen → schedule)
   - Campaign workflow (create → submit → approve → publish)
   - Billing flow (checkout → webhook → subscription update)

3. **No test coverage threshold** — No minimum coverage requirement. CI doesn't fail on low coverage.

4. **No test database setup** — No Testcontainers, no Docker Compose test DB, no per-test transaction rollback.

5. **No test data factories** — Each test manually creates mock objects. No shared factories for User, Workspace, Screen, Playlist, etc.

6. **No load testing** — No Artillery, k6, or Locust tests for performance validation.

7. **No contract testing** — No Pact or similar contract tests between frontend and backend.

8. **No mutation testing** — No Stryker or similar to verify test quality (do tests actually catch bugs?).

9. **No security testing** — No OWASP ZAP, no SQL injection tests, no XSS tests.

10. **No CI test pipeline** — `.github/workflows/ci.yml` exists but unclear if tests run on every PR.

11. **No test for 8 modules** — Admin, API Keys, Islamic, Notifications, Workspaces, Audit Log, Pairing (partial), Stripe have no or insufficient tests.

12. **No snapshot testing** — No Jest snapshots for API response shapes.

---

## 4. Problems

1. **Critical modules untested** — Admin (security-critical), Workspaces (core module), Notifications have zero test coverage.

2. **All tests mock Prisma** — No test validates that Prisma queries actually work against a real database. Query syntax errors, relation issues, and constraint violations are undetected.

3. **No test isolation** — Tests share mock state. Test execution order could affect results.

4. **No test for WebSocket flows** — `realtime.gateway.spec.ts` exists but only tests basic gateway behavior, not the full screen register → heartbeat → disconnect flow.

5. **No test for error scenarios** — Most tests cover happy paths. Few tests for: DB errors, network timeouts, concurrent operations, race conditions.

6. **Test naming inconsistent** — Some specs use `*.service.spec.ts`, others use `*.p2-t1.spec.ts` (phase/task naming), others use `*.t3-4.spec.ts`. No consistent convention.

---

## 5. Risks

- **High: Critical modules untested** — Admin and Workspaces have no tests. Bugs in these modules go undetected.
- **High: No integration tests** — Prisma query errors and relation issues are undetected.
- **Medium: No E2E tests** — Full business flows are unvalidated.
- **Medium: No coverage threshold** — Coverage can decrease without detection.
- **Low: No load testing** — Performance issues undetected until production.

---

## 6. Priority: **High**

Testing is the biggest quality gap. 49 unit tests exist but no integration or E2E tests.

---

## 7. Completion Percentage: **55%**

Unit test coverage is decent for common infrastructure and some domain modules. Missing: integration tests, E2E tests, coverage threshold, test factories, 8 untested modules.

---

## 8. Recommendations

1. Add spec files for all untested modules:
   - `admin.controller.spec.ts` + `admin.service.spec.ts`
   - `workspaces.controller.spec.ts` + `workspaces.service.spec.ts`
   - `notifications.service.spec.ts`
   - `islamic.controller.spec.ts` + `prayer-times.service.spec.ts`
   - `api-keys.service.spec.ts`
2. Add integration test suite with Testcontainers:
   - Spin up PostgreSQL container
   - Run real Prisma queries
   - Test full CRUD cycles
   - Test constraints and relations
3. Add E2E test suite:
   - Auth flow (register → verify → login → refresh → logout)
   - Pairing flow (start → poll → claim → bootstrap)
   - Content flow (upload → playlist → assign → schedule → bootstrap)
   - Campaign workflow (create → submit → approve → publish → end)
   - Billing flow (mock plan → checkout → webhook → subscription sync)
4. Add test data factories: `test/factories/` with `user.factory.ts`, `workspace.factory.ts`, `screen.factory.ts`, etc.
5. Add coverage threshold: `jest.config.js` with `coverageThreshold: { global: { lines: 70, branches: 60 } }`
6. Add test database setup: `test/setup.ts` that creates a test database, runs migrations, and cleans up after each test suite
7. Add CI test pipeline: run unit tests + integration tests + E2E tests on every PR
8. Add load testing with k6: `test/load/` with scenarios for auth, bootstrap, media upload
9. Standardize test naming: `*.spec.ts` for unit, `*.integration.spec.ts` for integration, `*.e2e-spec.ts` for E2E
10. Add error scenario tests: DB disconnection, timeout, concurrent operations, race conditions

---

## 9. Future Tasks

- [ ] Add specs for admin, workspaces, notifications, islamic, api-keys
- [ ] Set up Testcontainers for integration tests
- [ ] Write E2E test suite for all business flows
- [ ] Create test data factories
- [ ] Add coverage threshold to Jest config
- [ ] Set up test database with per-test cleanup
- [ ] Add CI test pipeline (unit + integration + E2E)
- [ ] Add load testing with k6
- [ ] Standardize test naming conventions
- [ ] Add error scenario tests
- [ ] Add WebSocket flow tests
- [ ] Add security tests (OWASP ZAP)
