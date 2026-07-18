# Phase 10 — Production Readiness & Launch Preparation Report

**Date:** 18 July 2026
**Scope:** Final production hardening of Cloud-Screen SaaS platform.

---

## 1. Production Deployment Audit

### Already Implemented (verified, no changes needed)

- **Dockerfiles:** Multi-stage builds for backend (`Dockerfile.backend`) and dashboard (`Dockerfile.dashboard`) with non-root user (`appuser:1001`), health checks, `prisma migrate deploy` on startup, correct port pinning (3000).
- **docker-compose.yml:** PostgreSQL 16, Redis 7, MinIO, backend, dashboard — all with health checks, `depends_on` conditions, named volumes, restart policies, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`/`PLAYER_HEARTBEAT_SECRET` required via `:?` syntax.
- **Environment variables:** `.env.example` at repo root, `assertProductionSecretsAreSet()` validates secrets at boot (≥32 chars, not placeholders, access ≠ refresh).
- **Database migrations:** `prisma migrate deploy` runs in CMD before `node dist/src/main.js`. Migrations are idempotent (`IF [NOT] EXISTS`).
- **Startup scripts:** `scripts/backup.sh`, `scripts/restore.sh`, `scripts/restore-drill.sh`, `scripts/sync-env.cjs`, `scripts/clean-build.cjs`.
- **Health checks:** Backend `/health` (liveness, always 200), `/ready` (readiness, checks DB + Redis + storage), `/metrics` (Prometheus). Dashboard `/api/health`. Docker HEALTHCHECK on all containers.
- **Graceful shutdown:** `main.ts` installs `SIGTERM`/`SIGINT` handlers with ordered shutdown (app.close → WS → Redis → Prisma) and 25s force-exit timeout.
- **Logging:** `AppLogger` emits structured JSON in production (level, message, requestId, context, timestamp), plain text in dev. Request context via `AsyncLocalStorage`.
- **CI/CD:** `.github/workflows/ci.yml` runs full `npm run verify` (typecheck + lint + tests + i18n + build), backend coverage, E2E tests, dependency audit, marketing build.

### Changes Made

| File | Change |
|------|--------|
| `Dockerfile.player` | **NEW** — Multi-stage build for player app, non-root user, health check on port 3001 |
| `Dockerfile.marketing` | **NEW** — Multi-stage build for marketing app, non-root user, health check on port 3010 |
| `docker-compose.yml` | Added `player` and `marketing` services with health checks, env vars, port mappings |
| `package.json` (root) | Added marketing to `build`, `lint`, `typecheck`, `lint:fix` scripts |
| `apps/marketing/package.json` | Added `typecheck` script |
| `apps/dashboard/src/app/api/health/route.ts` | Enhanced to check backend API reachability (3s timeout, returns 503 if down) |

---

## 2. Security Final Audit

### Already Implemented (verified)

| OWASP Area | Implementation | Status |
|------------|---------------|--------|
| **Authentication** | JWT access (15min) + refresh (7d) in httpOnly cookies, 2FA TOTP, `typ` claim prevents token confusion | ✅ |
| **Authorization** | `JwtAuthGuard`, `WorkspaceAuthGuard`, `@Roles`, `@PlatformRoles`, `SuperAdminDbGuard` — fail-closed | ✅ |
| **Tenant isolation** | Workspace-scoped queries, pairing claim workspace binding, cross-tenant prevention | ✅ |
| **API exposure** | Global prefix `/api/v1`, `ValidationPipe` with `whitelist` + `forbidNonWhitelisted` on all DTOs | ✅ |
| **CORS** | Production requires `ALLOWED_ORIGINS` (explicit allow-list), no origin reflection | ✅ |
| **CSRF** | `CsrfModule` with double-submit cookie pattern, `X-CSRF-Token` header | ✅ |
| **CSP headers** | Dashboard: `object-src 'none'; frame-ancestors 'self'; base-uri 'self'` + `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. Backend: Helmet (CSP off for API, COEP off for media) | ✅ |
| **Rate limiting** | `ThrottlerGuard` as `APP_GUARD` (300/min default), tighter limits on login (20/min), register/verify, password reset (5/min), pairing claim (5/min + DB lockout). Redis-backed when configured | ✅ |
| **File uploads** | `.part` files blocked from static serving, temp-then-rename pattern, 50mb limit, storage quota enforcement | ✅ |
| **JWT lifecycle** | Refresh token rotation, `RefreshToken` model (multi-session), logout/password-reset revokes all sessions, `typ` claim | ✅ |
| **WebSocket security** | `WsThrottlerGuard`, socket auth via screen secret, `NOT_REGISTERED` gate, offline event queue with TTL | ✅ |
| **Secret management** | `assertProductionSecretsAreSet()` at boot, no secrets in defaults, `:?` in docker-compose, PII scrubbing for Sentry | ✅ |
| **Non-root containers** | `appuser:appgroup` (uid/gid 1001) in all Dockerfiles | ✅ |
| **Trust proxy** | `TRUST_PROXY_HOPS` config (default 0, set to proxy count in production) | ✅ |
| **Dependency audit** | `npm audit --audit-level=high` in CI | ✅ |

### P0/P1 Issues Found

**None.** All P0/P1 issues from previous security audits (`security-audit-remediation.md`, `security-audit-v2-changes.md`, `hardening-report.md`) have been resolved. No new issues found.

---

## 3. Observability

### Already Implemented

| Feature | Implementation |
|---------|---------------|
| **Structured logging** | `AppLogger` — JSON in production with `level`, `message`, `requestId`, `context`, `timestamp` |
| **Request context** | `RequestContextModule` with `AsyncLocalStorage` — `requestId` on every log line |
| **Error tracking** | Sentry integration (backend `instrument.ts`, dashboard `sentry.*.config.ts`), PII scrubbing (`scrub-pii.ts`), error boundaries report to Sentry |
| **API metrics** | Prometheus `prom-client` — `cloudscreen_http_request_duration_seconds`, `cloudscreen_http_requests_total`, `cloudscreen_http_errors_total`, `cloudscreen_active_sockets`. `/metrics` endpoint (excluded from API prefix) |
| **Metrics middleware** | `MetricsMiddleware` on all routes — observes method, route, status, duration |
| **Player heartbeat monitoring** | `ScreenHeartbeatService` — sweep timer (`HEARTBEAT_SWEEP_MS`), stale screen detection (`HEARTBEAT_STALE_MS`), status broadcast via `workspace:screen:status` |
| **Failed payment monitoring** | `MaintenanceService.downgradeExpiredGracePeriods()` — daily cron at 8am UTC, downgrades subscriptions past grace period |
| **Background job monitoring** | Cron jobs: purge expired pairing sessions (3am), purge old audit logs (3am, configurable retention), downgrade expired grace periods (8am), purge expired media (4am) |
| **Health endpoints** | Backend: `/health` (liveness), `/ready` (DB+Redis+storage), `/metrics` (Prometheus). Dashboard: `/api/health` (now checks backend). Docker HEALTHCHECK on all containers |

### Changes Made

| File | Change |
|------|--------|
| `apps/dashboard/src/app/api/health/route.ts` | Now probes backend `/health` with 3s timeout, returns 503 if backend is down |

---

## 4. Player Production Hardening

### Already Implemented

- **Offline playback:** `loadOfflinePlaylistSnapshot`, `saveOfflinePlaylistSnapshot`, cached playlist playback when API unreachable
- **Auto-reconnect:** Socket.io `reconnection: true, reconnectionAttempts: Infinity`, exponential backoff (1s→20s), `window.addEventListener('online', handleOnline)`
- **Version reporting:** `playerVersion` in `screen:register` and `screen:heartbeat` (Phase 9), persisted to `Screen.playerVersion`
- **Kiosk mode:** Serial + secret authentication, identify overlay, prayer pause polling
- **Error handling:** Connection hints, error overlays, offline banner

### Changes Made

| File | Change |
|------|--------|
| `apps/backend/prisma/schema.prisma` | Added `batteryLevel`, `batteryCharging`, `uptimeSeconds`, `networkType` to `Screen` model |
| `apps/backend/prisma/migrations/20260718150000_screen_diagnostics/migration.sql` | **NEW** — Migration for diagnostics fields |
| `apps/backend/src/domains/realtime/dto/screen-heartbeat.dto.ts` | Added `playerPlatform`, `uptimeSeconds`, `batteryLevel`, `batteryCharging`, `resolutionWidth`, `resolutionHeight`, `networkType` fields |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Heartbeat handler now persists all diagnostics fields to Screen |
| `apps/player/src/components/player-runtime.tsx` | Heartbeat payload now includes `uptimeSeconds`, `resolutionWidth/Height`, `networkType`, `batteryLevel/Charging` (via Battery API) |

---

## 5. SaaS Operations

### Already Implemented

| Feature | Implementation |
|---------|---------------|
| **Admin operational tools** | `AdminModule` — platform staff dashboard, workspace management, user impersonation, system settings |
| **Tenant visibility** | Admin can list all workspaces, users, subscriptions, screens across tenants |
| **Audit log viewer** | `AuditLog` model in Postgres (not JSON file), `WorkspaceAuditLogModule`, admin audit log viewer, configurable retention (`AUDIT_LOG_RETENTION_DAYS`) |
| **Feature flags** | `FeatureFlagsService` + `FeatureFlagsController` — per-workspace module flags, admin can list/set flags, `isModuleEnabled()` for runtime checks |
| **Support utilities** | API keys module, onboarding module, notifications module, maintenance module with cron jobs |
| **Backup/restore** | `scripts/backup.sh` (pg_dump + media + .data volumes), `scripts/restore.sh`, `scripts/restore-drill.sh` |

### No changes needed — all SaaS operations features were already implemented.

---

## 6. UX Final Polish

### Already Implemented

| Area | Status |
|------|--------|
| **Onboarding** | `OnboardingModule` + dashboard onboarding flow with step tracking |
| **Empty states** | All dashboard pages have empty states (campaigns, playlists, screens, media, schedules, templates) |
| **Loading states** | 11 `error.tsx` error boundaries, shared `loading.tsx`, skeleton states in templates/media |
| **Mobile layouts** | Responsive stacking (`flex-col → sm:flex-row`), touch targets (44px), mobile nav |
| **Accessibility** | ARIA roles, `aria-labels`, `aria-pressed`, `role=group/list/listitem/region/progressbar`, `useReducedMotion`, skip-to-content, focus trap in dialogs |
| **SEO (marketing)** | OpenGraph, Twitter cards, keywords, robots, viewport, canonical URLs, RTL support |
| **Conversion flow** | Landing → features → pricing → dashboard CTA with `NEXT_PUBLIC_DASHBOARD_URL` |
| **i18n** | Full EN + AR translations, RTL support, `next-intl` |

### No changes needed — all UX polish was completed in prior phases.

---

## 7. Full QA Results

| Check | Result |
|-------|--------|
| Backend `tsc --noEmit` | **0 errors** |
| Backend `eslint --max-warnings=0` | **0 errors, 0 warnings** |
| Backend tests | **547 passed, 547 total** |
| Backend build | **Success** |
| Dashboard `tsc --noEmit` | **0 errors** |
| Dashboard `next build` | **Compiled successfully** |
| Player `tsc --noEmit` | **0 errors** |
| Player `eslint --max-warnings=0` | **0 errors, 0 warnings** |
| Player `next build` | **Compiled successfully** |
| Marketing `tsc --noEmit` | **0 errors** |
| Marketing `eslint` | **0 errors** |
| Marketing `next build` | **Compiled successfully** |

---

## 8. Files Changed in Phase 10

| File | Type | Summary |
|------|------|---------|
| `Dockerfile.player` | NEW | Multi-stage Docker build for player app |
| `Dockerfile.marketing` | NEW | Multi-stage Docker build for marketing app |
| `docker-compose.yml` | Modified | Added player and marketing services |
| `package.json` (root) | Modified | Added marketing to build/lint/typecheck scripts |
| `apps/marketing/package.json` | Modified | Added typecheck script |
| `apps/dashboard/src/app/api/health/route.ts` | Modified | Enhanced health check to probe backend |
| `apps/backend/prisma/schema.prisma` | Modified | Added diagnostics fields to Screen model |
| `apps/backend/prisma/migrations/20260718150000_screen_diagnostics/migration.sql` | NEW | Migration for diagnostics fields |
| `apps/backend/src/domains/realtime/dto/screen-heartbeat.dto.ts` | Modified | Added diagnostics fields to heartbeat DTO |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Modified | Persist diagnostics from heartbeat |
| `apps/player/src/components/player-runtime.tsx` | Modified | Collect and report device diagnostics |

---

## 9. Remaining Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `apps/backend/Dockerfile` is stale (Arabic comments, no non-root user, `npm install` instead of `npm ci`) | Low | Root `Dockerfile.backend` is the canonical one used by docker-compose. The stale file should be removed in a future cleanup. |
| Dashboard CSP doesn't include `script-src` (inline scripts from Next.js hydration) | Medium | Deliberately narrow per existing comments. Nonce-based CSP is a separate, riskier change. Current policy covers `object-src`, `frame-ancestors`, `base-uri`. |
| Battery API not available in all browsers | Low | Player gracefully falls back — battery fields are optional, `getBattery()` is feature-detected. |
| No Redis in single-instance deployments | Low | All Redis-dependent features (rate limiting, offline event queue, WebSocket adapter) have in-memory fallbacks. Documented in runbook. |

---

## 10. Production Checklist

### Before First Deployment

- [ ] Generate JWT secrets: `openssl rand -hex 32` for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PLAYER_HEARTBEAT_SECRET`, `ENCRYPTION_KEY`
- [ ] Set `ALLOWED_ORIGINS` to real domain(s): `https://app.example.com,https://admin.example.com`
- [ ] Set `FRONTEND_ORIGIN` and `FRONTEND_ORIGINS` to real dashboard URL
- [ ] Set `NEXT_PUBLIC_API_BASE_URL` to public API URL
- [ ] Set `MEDIA_PUBLIC_BASE_URL` to public media URL
- [ ] Set `TRUST_PROXY_HOPS` to the number of proxies in front of the API (usually 1)
- [ ] Configure email: `RESEND_API_KEY` or `SENDGRID_API_KEY` or `SMTP_*`
- [ ] Set `EMAIL_FROM` and `EMAIL_FROM_NAME`
- [ ] Configure Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_*`
- [ ] Set `SENTRY_DSN` (backend) and `NEXT_PUBLIC_SENTRY_DSN` (dashboard) for error tracking
- [ ] Set `NEXT_PUBLIC_PLAYER_VERSION` to the release version
- [ ] Set `NEXT_PUBLIC_DASHBOARD_URL` for marketing site CTA links
- [ ] Run `prisma migrate deploy` on production DB
- [ ] Test backup script: `./scripts/backup.sh`
- [ ] Test restore on scratch stack: `./scripts/restore-drill.sh`

### After Deployment

- [ ] Verify `/health` returns 200 on backend
- [ ] Verify `/ready` returns 200 on backend (DB + Redis + storage)
- [ ] Verify `/metrics` returns Prometheus format
- [ ] Verify `/api/health` returns 200 on dashboard
- [ ] Verify WebSocket connection works (player pairing)
- [ ] Verify Stripe webhook endpoint receives events
- [ ] Verify email sending (registration OTP)
- [ ] Set up cron job for daily backups
- [ ] Configure log aggregation (Loki/CloudWatch/etc.) to consume JSON logs
- [ ] Configure Prometheus scrape of `/metrics`
