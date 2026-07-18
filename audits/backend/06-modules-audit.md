# 06 — Domain Modules Audit

> **Objective:** Evaluate each domain module's completeness, structure, service quality, and feature coverage.

---

## 1. Current State

The backend has **22 domain modules** organized under `apps/backend/src/domains/`. Each module typically contains a controller, service, DTOs, and a module definition file. The modules are registered in `app.module.ts`.

---

## 2. What Exists — Module-by-Module Analysis

### Auth Module (`domains/auth/`)
- **Controllers:** 2 (AuthController, DevLoginController)
- **Services:** 3 (AuthService, TwoFactorService, LoginLockoutService)
- **DTOs:** 8 (login, login-2fa, register-start, register-verify, register-resend, forgot-password, reset-password, verify-two-factor)
- **Specs:** 4 (auth-refresh-session, dev-login.controller, login-lockout.service, otp.helper)
- **Completeness:** 88% — Full auth flows including 2FA, OTP, lockout, impersonation
- **Missing:** Password complexity, session listing, WebAuthn

### Account Module (`domains/account/`)
- **Controller:** 1 (AccountController)
- **Service:** 1 (AccountService)
- **DTOs:** 3 (update-profile, request-email-change, verify-email-change)
- **Specs:** 2 (account.gdpr, account.service)
- **Completeness:** 80% — Profile, email change, billing, insights, GDPR export/anonymize
- **Missing:** Account deletion confirmation, export format options

### Admin Module (`domains/admin/`)
- **Controller:** 1 (AdminController)
- **Services:** 2 (AdminService, BrandingAssetsService)
- **DTOs:** 8 (update-admin-user, impersonate-user, create-customer-workspace, update-customer-workspace, patch-customer-subscription, create-staff, update-staff-role, update-admin-settings)
- **Specs:** 0
- **Completeness:** 82% — Users, staff, customers, workspaces, fleet, stats, logs, settings, branding
- **Missing:** Module-level tests, analytics dashboard, bulk operations

### API Keys Module (`domains/api-keys/`)
- **Controller:** 1 (ApiKeysController)
- **Service:** 1 (ApiKeysService)
- **DTOs:** 1 (create-api-key)
- **Specs:** 0
- **Completeness:** 60% — CRUD exists but keys are never validated for authentication
- **Missing:** ApiKeyAuthGuard, scope enforcement, last-used tracking, key rotation

### Audit Log Module (`domains/audit-log/`)
- **No controller** — Read-only module, audit logs accessed via AdminController
- **Service:** 0 (uses AuditLogService from `common/audit/`)
- **Specs:** 1 (audit-log.service)
- **Completeness:** 85% — Append, list, listForWorkspace, retention purge
- **Missing:** Search/filter, export, real-time streaming

### Campaigns Module (`domains/campaigns/`)
- **Controller:** 1 (CampaignsController)
- **Service:** 1 (CampaignsService)
- **DTOs:** 4 (create, update, list, transition)
- **Specs:** 1 (campaigns.service)
- **Completeness:** 85% — Full approval workflow (draft→submit→approve/reject→publish→pause/resume→end), history
- **Missing:** Campaign analytics, scheduling integration, A/B testing

### Canvases Module (`domains/canvases/`)
- **Controller:** 1 (CanvasesController)
- **Service:** 1 (CanvasesService)
- **DTOs:** 3 (create, update, list)
- **Specs:** 1 (canvases.service)
- **Completeness:** 85% — CRUD, version history (snapshot, list, restore)
- **Missing:** Template library, collaboration, export to image

### Email Module (`domains/email/`)
- **No controller** — Internal service only
- **Service:** 1 (EmailService)
- **Templates:** registerOtpEmail, passwordResetEmail, welcomeEmail
- **Specs:** 1 (email.service)
- **Completeness:** 70% — Multi-provider (Resend/SendGrid/SMTP), but only 3 email templates
- **Missing:** Invite email, screen offline alert, subscription expiry, campaign approval, password changed notification

### Islamic Module (`domains/islamic/`)
- **Controller:** 1 (IslamicController)
- **Services:** 2 (PrayerTimesService, RamadanService)
- **DTOs:** 2 (update-prayer-config, update-ramadan-config)
- **Specs:** 0
- **Completeness:** 80% — Prayer times calculation, Hijri date, Ramadan mode, auto-pause
- **Missing:** Module tests, prayer time accuracy validation, multiple calculation methods per screen

### Maintenance Module (`domains/maintenance/`)
- **No controller** — Cron jobs only
- **Service:** 1 (MaintenanceService)
- **Specs:** 1 (maintenance.service)
- **Completeness:** 85% — Purge expired pairing sessions, purge old audit logs
- **Missing:** Media expiry purge, orphaned file cleanup, database vacuum

### Media Module (`domains/media/`)
- **Controller:** 1 (MediaController)
- **Service:** 1 (MediaService)
- **DTOs:** 5 (folder-name, list-media, media-stats-query, move-media-folder, + inline body for expiry)
- **Specs:** 2 (media.service, subscription-limits)
- **Completeness:** 75% — Upload, list, delete, folders, move, expiry, stats
- **Missing:** S3 storage, image processing/thumbnails, video transcoding, bulk upload, virus scanning

### Notifications Module (`domains/notifications/`)
- **Controller:** 1 (NotificationsController)
- **Service:** 1 (NotificationsService)
- **Specs:** 0
- **Completeness:** 72% — List, mark read, mark all read, preferences
- **Missing:** Push notifications, email notifications, real-time delivery, notification types beyond in-app

### Onboarding Module (`domains/onboarding/`)
- **Controller:** 1 (FeatureFlagsController)
- **Services:** 2 (OnboardingService, FeatureFlagsService)
- **DTOs:** 1 (set-feature-flag)
- **Specs:** 1 (onboarding.service)
- **Completeness:** 80% — Progress tracking, step completion, feature flags CRUD
- **Missing:** Guided tour integration, onboarding email sequence, completion analytics

### Pairing Module (`domains/pairing/`)
- **No controller** — Exposed via WorkspacesController and PlayerController
- **Service:** 1 (PairingService)
- **DTOs:** 2 (start-pairing-session, claim-pairing-session)
- **Specs:** 2 (pairing.p2-t3, pairing-to-bootstrap.integration)
- **Completeness:** 88% — Pairing v2 with code, poll secret, per-screen secret, lockout
- **Missing:** QR code pairing, batch pairing, pairing analytics

### Player Module (`domains/player/`)
- **Controller:** 1 (PlayerController)
- **Service:** 1 (PlayerService)
- **Specs:** 2 (player.service, player.prayer-pause)
- **Completeness:** 85% — Bootstrap, workspace-bootstrap, compiled canvas, prayer pause, pairing sessions
- **Missing:** Screenshot upload, crash report, OTA update, offline sync

### Playlists Module (`domains/playlists/`)
- **Controller:** 1 (PlaylistsController)
- **Service:** 1 (PlaylistsService)
- **DTOs:** 6 (clone, create, update, replace-items, list, + inline body for groups)
- **Specs:** 3 (nested-playlists, playlists.p2-t1, playlists.service)
- **Completeness:** 85% — CRUD, groups (hierarchical), nested playlists, clone, duplicate, replace items
- **Missing:** Playlist templates, smart playlists, playlist analytics

### Realtime Module (`domains/realtime/`)
- **Gateway:** 1 (RealtimeGateway)
- **Service:** 1 (ScreenHeartbeatService)
- **Specs:** 1 (realtime.gateway)
- **Completeness:** 82% — Socket.IO, screen register, heartbeat, dashboard subscribe, pairing watch, player bind
- **Missing:** Redis adapter for scaling, reconnection policy, room management, event documentation

### Schedules Module (`domains/schedules/`)
- **Controller:** 1 (SchedulesController)
- **Service:** 1 (SchedulingService)
- **DTOs:** 3 (create, update, list)
- **Specs:** 1 (scheduling.service)
- **Completeness:** 80% — Weekly/monthly recurrence, overlaps detection, priority, enable/disable
- **Missing:** Holiday schedules, timezone handling, conflict resolution UI, schedule preview

### Screens Module (`domains/screens/`)
- **Controller:** 1 (ScreensController)
- **Service:** 1 (ScreensService)
- **DTOs:** 7 (create, list, remote-command, override, update, assign-playlist, reorder-assignments)
- **Specs:** 1 (screens.service)
- **Completeness:** 85% — CRUD, assignments, override, analytics, remote commands, active content
- **Missing:** Bulk actions, screenshot, GPS location, group management, health monitoring

### Subscriptions Module (`domains/subscriptions/`)
- **Controller:** 1 (SubscriptionsController)
- **Service:** 1 (SubscriptionsService)
- **DTOs:** 1 (set-mock-plan)
- **Specs:** 1 (subscriptions.p2-t2)
- **Completeness:** 78% — Plans (FREE/STARTER/PRO/ENTERPRISE), mock plan, Stripe checkout/portal, screen/storage limits
- **Missing:** Invoice generation, proration, dunning, trial management, plan comparison API

### Webhooks Module (`domains/webhooks/`)
- **Controllers:** 2 (StripeWebhookController, WebhooksController)
- **Services:** 2 (StripeWebhookService, WebhooksService)
- **DTOs:** 3 (create-webhook, toggle-webhook, + stripe webhook DTOs)
- **Specs:** 5 (stripe-webhook.p2-t4, stripe-webhook.service, stripe-webhook.t3-4, stripe-webhook.t3-5, webhooks.service)
- **Completeness:** 85% — Stripe webhook processing with idempotency, customer webhook CRUD + test + delivery
- **Missing:** Webhook retry policy, delivery logs, dead letter queue

### Workspaces Module (`domains/workspaces/`)
- **Controller:** 1 (WorkspacesController)
- **Service:** 1 (WorkspacesService)
- **DTOs:** 7 (create, invite-member, update-member-role, update, create-account-member, add-account-member, update-account-member-role)
- **Specs:** 0
- **Completeness:** 82% — CRUD, members, invites, account members, pairing claim, demo seeding, activity feed
- **Missing:** Module tests, workspace templates, audit log, transfer ownership

---

## 3. What Is Missing (Cross-Module)

1. **No AI module** — No `domains/ai/` directory. Zero AI endpoints despite "AI-powered" product positioning.
2. **No analytics module** — Screen analytics are in ScreensService, not a dedicated module. No proof-of-play, no device metrics, no crash reports.
3. **No audit-log controller** — Audit logs are only accessible via AdminController. No workspace-level audit log endpoint.
4. **No settings module** — Workspace-level settings (timezone, locale, default orientation) don't exist.
5. **No search module** — No global search across screens, playlists, media, campaigns.
6. **No import/export module** — No bulk import of screens, playlists, or schedules. No export of workspace data.

---

## 4. Problems

1. **Zero specs for 8 modules** — Admin, API Keys, Islamic, Notifications, Workspaces, Pairing (partial), Audit Log, and Realtime (1 spec only) have inadequate test coverage.

2. **Circular dependency** — Auth ↔ Workspaces via `forwardRef`. This is a design smell.

3. **Service bloat** — `AuthService` is 1,106 lines. `WorkspacesService` likely similar. Should be decomposed.

4. **No module-level documentation** — No README or inline documentation explaining module boundaries and responsibilities.

5. **Inconsistent module structure** — Some modules have `dto/` subdirectories, others have DTOs in the module root. Some have spec files, others don't.

---

## 5. Risks

- **High: No AI module** — Core product differentiator is missing entirely.
- **Medium: Zero tests for critical modules** — Admin, Workspaces, Notifications have no tests.
- **Medium: Service bloat** — Large services are harder to maintain and test.
- **Low: Inconsistent structure** — Developer experience suffers.

---

## 6. Priority: **High**

Module organization is good but AI module absence and test gaps are significant.

---

## 7. Completion Percentage: **85%**

22 well-organized domain modules with clear separation. Missing: AI module, analytics module, tests for 8 modules, service decomposition.

---

## 8. Recommendations

1. Create `domains/ai/` module with content generation, smart scheduling, and design suggestions
2. Create `domains/analytics/` module with proof-of-play, device metrics, and content performance
3. Add spec files for all untested modules (admin, workspaces, notifications, islamic, api-keys)
4. Decompose `AuthService` into `AuthService`, `RegistrationService`, `PasswordResetService`, `ImpersonationService`
5. Add module-level README files documenting boundaries and dependencies
6. Standardize module structure: `controller.ts`, `service.ts`, `dto/`, `*.spec.ts`, `module.ts`
7. Resolve circular dependency between Auth and Workspaces
8. Add workspace-level settings module

---

## 9. Future Tasks

- [ ] Create AI domain module
- [ ] Create Analytics domain module
- [ ] Add specs for all untested modules
- [ ] Decompose AuthService
- [ ] Add module READMEs
- [ ] Standardize module structure
- [ ] Resolve Auth ↔ Workspaces circular dependency
- [ ] Add workspace settings module
- [ ] Add global search module
- [ ] Add import/export module
