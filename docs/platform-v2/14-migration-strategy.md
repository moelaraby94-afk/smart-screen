# 14 — Migration Strategy

> **Document Type:** Migration Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Zero-downtime migration from current monolith to two-app SaaS platform

---

## 1. Migration Principles

1. **Zero downtime** — Customers experience no service interruption
2. **Backward compatible** — Old code works with new schema at every step
3. **Feature-flagged** — New behavior gated behind flags, can be toggled off
4. **Rollback-ready** — Every step can be rolled back without data loss
5. **Incremental** — Small, verifiable steps, not a big-bang rewrite
6. **Additive-first** — New tables/columns added before old ones removed
7. **Test in production** — Staging mirrors production data (anonymized)

---

## 2. Migration Phases

### Phase Overview

```
Phase 1: Database & Auth Foundation (Weeks 1-3)
  │
  ▼
Phase 2: API Namespacing (Weeks 4-6)
  │
  ▼
Phase 3: Control Panel Extraction (Weeks 7-10)
  │
  ▼
Phase 4: Customer Workspace Cleanup (Weeks 11-13)
  │
  ▼
Phase 5: Shared Packages Extraction (Weeks 14-15)
  │
  ▼
Phase 6: Domain Separation & Cleanup (Weeks 16-18)
```

---

## 3. Phase 1: Database & Auth Foundation (Weeks 1-3)

### 3.1 Goals
- Add new database tables (additive, no breaking changes)
- Add JWT audience claim to authentication
- Add session management in Redis
- Add `platformStaffRole` to User model

### 3.2 Steps

#### Step 1.1: Database Migrations (Additive)

```
Create tables:
  - PlatformSettings (singleton row)
  - Plan, PlanPricing
  - SubscriptionHistory
  - Invoice, InvoiceItem
  - Coupon, CouponRedemption
  - TaxRate
  - SupportTicket, SupportTicketMessage
  - EmailTemplate, EmailLog
  - AutomationRule, AutomationLog
  - UsageRecord, QuotaOverride
  - Session
  - PlatformWebhook, PlatformWebhookDelivery
  - OAuthClient, OAuthSession
  - MarketplaceApp, MarketplaceInstallation
  - License
  - Integration
  - Backup
  - WhiteLabelConfig
  - ScheduledReport
  - ProofOfPlay

Alter tables (additive):
  - User: + platformStaffRole, + status, + twoFactorSecret, + twoFactorEnabled, + ...
  - Workspace: + tenantId, + lifecycleStage, + csmId, + tags, + timezone, + ...
  - Subscription: + planId, + status, + trialEndsAt, + stripeCustomerId, + ...
  - AuditLog: + scope, + actorRole, + impersonatedBy, + ipAddress, + ...
  - Notification: + category, + priority, + actionUrl, + ...
  - FeatureFlag: + isGlobal, + scheduledActivateAt, + ...
```

**Acceptance criteria:**
- All migrations are additive (no column removals)
- Old code works with new schema
- `npx prisma migrate deploy` succeeds
- `npx prisma generate` succeeds
- All existing API tests pass

#### Step 1.2: Backfill Data

```
Backfill:
  - User.platformStaffRole = 'SUPER_ADMIN' WHERE isSuperAdmin = true
  - Workspace.lifecycleStage = 'ACTIVE' (all workspaces)
  - Workspace.tenantId = workspace.ownerId (temporary, until Tenant table)
  - Subscription.planId = (match plan string to Plan table)
  - AuditLog.scope = 'CUSTOMER' (all existing records)
  - PlatformSettings: insert singleton row from .data/admin-runtime.json
  - Plan: insert rows for FREE, STARTER, PRO, ENTERPRISE
  - PlanPricing: insert USD pricing for each plan
```

**Acceptance criteria:**
- All users with `isSuperAdmin = true` have `platformStaffRole = 'SUPER_ADMIN'`
- All workspaces have `lifecycleStage` set
- All subscriptions have `planId` set
- `PlatformSettings` singleton exists
- `Plan` table has 4 plans

#### Step 1.3: JWT Audience Claim

```
Modify auth.service.ts:
  - Login: accept `audience` parameter (default: 'customer')
  - Token issuance: include `audience` in JWT payload
  - Token validation: extract `audience` from JWT
  - Backward compat: tokens without audience treated as 'customer'

Modify auth.controller.ts:
  - POST /auth/login: accept `audience` in body
  - If audience = 'platform': require platformStaffRole, require 2FA
  - If audience = 'customer': standard flow
```

**Acceptance criteria:**
- Login with `audience: 'platform'` issues platform JWT
- Login with `audience: 'customer'` issues customer JWT
- Login without `audience` defaults to customer JWT (backward compat)
- Platform JWT has `audience: 'platform'` in payload
- Customer JWT has `audience: 'customer'` in payload
- Old tokens (no audience) still work

#### Step 1.4: Session Management in Redis

```
Implement:
  - On login: create session in Redis (session:{id})
  - On API request: validate session exists in Redis
  - On logout: delete session from Redis
  - Concurrent session limit: platform=2, customer=5
  - Session TTL: platform=4h, customer=24h
```

**Acceptance criteria:**
- Login creates Redis session
- Logout deletes Redis session
- API request with deleted session → 401
- Concurrent session limit enforced
- Session TTL expires automatically

#### Step 1.5: 2FA Enhancement

```
Implement:
  - TOTP setup (generate secret, QR code)
  - TOTP verify (validate code)
  - TOTP disable (with password confirmation)
  - Backup codes generation
  - 2FA required for platform staff (enforced at login)
  - 2FA optional for customers
```

**Acceptance criteria:**
- Platform staff without 2FA cannot login (audience: platform)
- Platform staff with 2FA: login → 2FA challenge → token
- Customers can enable/disable 2FA
- Backup codes work
- Rate limiting on 2FA verify (5 per 5 min)

---

## 4. Phase 2: API Namespacing (Weeks 4-6)

### 4.1 Goals
- Add route prefixes `/platform/*` and `/customer/*`
- Implement AudienceGuard
- Move admin routes to `/platform/*` (keep old routes as aliases)
- Move customer routes to `/customer/*` (keep old routes as aliases)

### 4.2 Steps

#### Step 2.1: Implement Guards

```
Create:
  - PlatformAudienceGuard: rejects if audience !== 'platform'
  - CustomerAudienceGuard: rejects if audience !== 'customer' && audience !== 'platform'
    (platform allowed for impersonation)
  - QuotaGuard: checks workspace quota on write operations
  - FeatureGuard: checks feature flag for workspace
```

#### Step 2.2: Add New Route Prefixes

```
Admin controller:
  - Keep existing routes (/admin/*) as aliases
  - Add new routes (/platform/*) with same handlers
  - Apply PlatformAudienceGuard + PlatformStaffDbGuard to /platform/*

Customer controllers:
  - Keep existing routes (/screens/*, /playlists/*, etc.) as aliases
  - Add new routes (/customer/screens/*, /customer/playlists/*, etc.)
  - Apply CustomerAudienceGuard + RolesGuard to /customer/*
```

**Acceptance criteria:**
- `/platform/*` routes work with platform JWT
- `/customer/*` routes work with customer JWT
- Old routes (`/admin/*`, `/screens/*`) still work (backward compat)
- Platform JWT rejected on `/customer/*` (except impersonation)
- Customer JWT rejected on `/platform/*`
- QuotaGuard blocks writes when quota exceeded (402)
- FeatureGuard blocks disabled features (403)

#### Step 2.3: Remove Super Admin Bypass

```
Modify RolesGuard:
  - Remove: if (user.isSuperAdmin) return true;
  - Replace: if (user.audience === 'platform' && user.impersonatedBy) return true;
    (platform staff impersonating can access customer routes)
  - Non-impersonated platform staff: rejected by RolesGuard on customer routes
```

**Acceptance criteria:**
- Platform staff (non-impersonating) cannot access `/customer/*` routes
- Platform staff (impersonating) can access `/customer/*` routes
- Customer users cannot access `/platform/*` routes
- All existing customer tests pass (customer JWT works on customer routes)

---

## 5. Phase 3: Control Panel Extraction (Weeks 7-10)

### 5.1 Goals
- Create `apps/control-panel/` as a new Next.js app
- Move all admin features to Control Panel
- Deploy to `admin.cloudsignage.com`
- Control Panel uses `/platform/*` API routes

### 5.2 Steps

#### Step 3.1: Create Control Panel App

```
Create apps/control-panel/:
  - Next.js 14+ with App Router
  - Tailwind CSS
  - shadcn/ui components (copy from dashboard)
  - i18n setup (en, ar)
  - Auth context (platform audience)
  - API client (calls /platform/*)
```

#### Step 3.2: Move Admin Features

```
Move from apps/dashboard/src/features/admin/ to apps/control-panel/src/features/:
  - admin-overview → dashboard/
  - admin-customers → tenants/
  - admin-staff → staff/
  - admin-users → users/
  - admin-workspaces → workspaces/
  - admin-fleet → fleet/
  - admin-logs → audit/
  - admin-settings → settings/
  - admin-feature-flags → feature-flags/
  - admin-system-health → monitoring/
  - admin-api.ts → lib/api-client.ts (rewrite for /platform/*)
  - super-admin-guard → guards/platform-guard.tsx
```

#### Step 3.3: Create Control Panel Shell

```
Create:
  - control-panel-shell.tsx (main layout)
  - control-sidebar.tsx (platform navigation)
  - control-header.tsx (platform header)
  - control-breadcrumbs.tsx
  - Login page (audience: platform, 2FA required)
```

#### Step 3.4: Deploy Control Panel

```
Deploy to admin.cloudsignage.com:
  - Dockerfile.control-panel
  - Cloudflare DNS: admin.cloudsignage.com → Control Panel
  - Cookie domain: admin.cloudsignage.com
  - Cookie names: __cp_access, __cp_refresh
```

**Acceptance criteria:**
- Control Panel accessible at `admin.cloudsignage.com`
- Platform staff can login (with 2FA)
- All admin features available in Control Panel
- Control Panel calls `/platform/*` API routes
- Platform cookies set on `admin.cloudsignage.com` domain
- Old dashboard admin routes still work (backward compat)

---

## 6. Phase 4: Customer Workspace Cleanup (Weeks 11-13)

### 6.1 Goals
- Rename `apps/dashboard/` to `apps/workspace/`
- Remove all admin code from Customer Workspace
- Update API client to use `/customer/*` routes
- Add impersonation banner and exchange token landing
- Deploy to `app.cloudsignage.com`

### 6.2 Steps

#### Step 4.1: Remove Admin Code

```
Remove from apps/workspace/:
  - src/features/admin/ (all admin features)
  - src/features/dashboard/admin-overview.tsx
  - src/components/admin/ (if any)
  - src/app/[locale]/(shell)/admin/ (all admin routes)
  - isSuperAdmin from workspace-context.tsx
  - sovereign mode from crystal-shell.tsx
  - cs_super_admin from sessionStorage
  - Admin sidebar items from shell-sidebar.tsx
  - Impersonation return button (replaced by banner)
```

#### Step 4.2: Update API Client

```
Update all API calls:
  - /screens/* → /customer/screens/*
  - /playlists/* → /customer/playlists/*
  - /media/* → /customer/media/*
  - /canvases/* → /customer/canvases/*
  - /schedules/* → /customer/schedules/*
  - /campaigns/* → /customer/campaigns/*
  - /subscriptions/* → /customer/billing/*
  - /notifications/* → /customer/notifications/*
  - /webhooks/* → /customer/webhooks/*
  - /api-keys/* → /customer/api-keys/*
  - /account/* → /customer/account/*
  - /onboarding/* → /customer/onboarding/*
  - /islamic/* → /customer/islamic/*
```

#### Step 4.3: Add Impersonation Support

```
Add:
  - /auth/impersonate page (exchange token landing)
  - impersonation-banner.tsx component
  - ImpersonationContext (tracks impersonatedBy claim)
  - POST /auth/exchange-impersonation call
  - POST /auth/exit-impersonation call
  - "Return to Control Panel" button in banner
```

#### Step 4.4: Update Auth

```
Update:
  - Login: send audience: 'customer'
  - Cookie names: __dash_access, __dash_refresh
  - Cookie domain: app.cloudsignage.com
  - Remove platform-specific auth logic
```

#### Step 4.5: Deploy Customer Workspace

```
Deploy to app.cloudsignage.com:
  - Dockerfile.workspace
  - Cloudflare DNS: app.cloudsignage.com → Customer Workspace
  - Cookie domain: app.cloudsignage.com
```

**Acceptance criteria:**
- Customer Workspace accessible at `app.cloudsignage.com`
- No admin code in bundle (verify with bundle analyzer)
- All customer features work
- Impersonation flow works (Control Panel → Customer Workspace → return)
- Customer Workspace calls `/customer/*` API routes
- No `isSuperAdmin` references in codebase
- No `sovereign` mode references
- Bundle size reduced (no admin code)

---

## 7. Phase 5: Shared Packages Extraction (Weeks 14-15)

### 7.1 Goals
- Extract shared UI components to `packages/ui/`
- Extract shared TypeScript types to `packages/api-ts/`
- Extract shared config to `packages/config/`
- Both apps import from shared packages

### 7.2 Steps

```
1. Move UI components:
   - Button, Input, Label, Dialog, etc. → packages/ui/src/
   - Update imports in both apps: import { Button } from '@cloud-screen/ui'

2. Move TypeScript types:
   - API response types, DTOs → packages/api-ts/src/
   - Update imports: import { Tenant, Subscription } from '@cloud-screen/api-ts'

3. Move config:
   - Tailwind preset → packages/config/tailwind-preset.ts
   - ESLint config → packages/config/eslint-base.js
   - tsconfig base → packages/config/tsconfig.base.json
```

**Acceptance criteria:**
- Both apps import from `@cloud-screen/ui`, `@cloud-screen/api-ts`, `@cloud-screen/config`
- No duplicated UI components
- No duplicated type definitions
- Both apps build successfully
- Both apps pass lint and type-check

---

## 8. Phase 6: Domain Separation & Cleanup (Weeks 16-18)

### 8.1 Goals
- Remove old route aliases (`/admin/*`, `/screens/*`, etc.)
- Remove deprecated fields (`isSuperAdmin`, `plan` string)
- Implement new platform modules (Support Center, Email Center, etc.)
- Final cleanup and documentation

### 8.2 Steps

```
1. Remove old route aliases:
   - Remove /admin/* routes (replaced by /platform/*)
   - Remove /screens/*, /playlists/*, etc. (replaced by /customer/*)
   - Update any remaining frontend references

2. Remove deprecated fields:
   - Remove User.isSuperAdmin (replaced by platformStaffRole)
   - Remove Subscription.plan (string, replaced by planId FK)
   - Remove .data/admin-runtime.json (replaced by PlatformSettings table)

3. Implement new platform modules:
   - Support Center (tickets, messages)
   - Email Center (templates, logs)
   - Automation Engine (rules, triggers)
   - Usage Tracking (metrics, records)
   - Security Center (sessions, access logs)

4. Final cleanup:
   - Remove dead code
   - Update README files
   - Update deployment documentation
   - Verify all tests pass
```

**Acceptance criteria:**
- No old route aliases exist
- No deprecated fields in schema
- New platform modules functional
- All tests pass
- Documentation updated
- Migration complete

---

## 9. Rollback Plan

### 9.1 Per-Phase Rollback

| Phase | Rollback Action | Data Impact |
|---|---|---|
| Phase 1 | Revert code, keep new tables (additive) | None |
| Phase 2 | Remove new routes, keep old routes | None |
| Phase 3 | Stop Control Panel, keep old dashboard admin | None |
| Phase 4 | Restore admin code from git, redeploy | None |
| Phase 5 | Inline packages back into apps | None |
| Phase 6 | Cannot rollback (destructive) — must be confident before executing | Column removals are permanent |

### 9.2 Rollback Triggers

| Trigger | Action |
|---|---|
| Critical bug in production | Rollback to previous deployment |
| Data corruption | Restore from backup, rollback code |
| Performance regression > 50% | Rollback, investigate |
| Security vulnerability introduced | Rollback, patch, redeploy |

### 9.3 Rollback Limitations

- **Phase 6 is irreversible** — column removals cannot be undone without data loss
- **Phase 6 requires 30-day observation period** after Phase 5 before executing
- **All other phases are reversible** — additive changes only

---

## 10. Feature Flags During Migration

| Flag | Purpose | Default | Removed In |
|---|---|---|---|
| `platform_v2_auth` | Enable JWT audience validation | false → true (Phase 1) | Phase 6 |
| `platform_v2_routes` | Enable /platform/* and /customer/* routes | false → true (Phase 2) | Phase 6 |
| `platform_v2_control_panel` | Redirect admin users to Control Panel | false → true (Phase 3) | Phase 4 |
| `platform_v2_workspace` | Use cleaned workspace (no admin code) | false → true (Phase 4) | Phase 6 |
| `platform_v2_impersonation` | Enable exchange token impersonation | false → true (Phase 4) | Never (permanent) |
| `platform_v2_sessions` | Enable Redis session management | false → true (Phase 1) | Never (permanent) |
| `platform_v2_2fa` | Enable 2FA enforcement for platform | false → true (Phase 1) | Never (permanent) |

---

## 11. Testing Strategy

### 11.1 Testing Per Phase

| Phase | Test Type | Coverage |
|---|---|---|
| Phase 1 | Unit + integration | Auth, sessions, 2FA, DB migrations |
| Phase 2 | Integration + E2E | Route namespacing, guard chain |
| Phase 3 | E2E | Control Panel login, navigation, all admin features |
| Phase 4 | E2E | Customer Workspace, impersonation flow, no admin code |
| Phase 5 | Build + lint | Package imports, no duplicates |
| Phase 6 | Full regression | All features, all routes, all roles |

### 11.2 Smoke Tests (Post-Deploy)

```
Control Panel:
  - Login (with 2FA)
  - Dashboard loads
  - Tenant list loads
  - Support ticket creation
  - Impersonation start

Customer Workspace:
  - Login
  - Overview loads
  - Screen list loads
  - Media upload
  - Playlist creation
  - Schedule creation
  - Billing page loads
  - Impersonation landing + banner + return

Player:
  - Bootstrap
  - Canvas fetch
  - Heartbeat
```

---

## 12. Communication Plan

| Milestone | Audience | Channel | Content |
|---|---|---|---|
| Phase 1 complete | Team | Slack | "Auth foundation deployed. No user-facing changes." |
| Phase 2 complete | Team | Slack | "API namespacing deployed. Old routes still work." |
| Phase 3 complete | Team + Staff | Slack + Email | "Control Panel live at admin.cloudsignage.com. Please use new URL." |
| Phase 4 complete | Team + Customers | Email | "Customer Workspace now at app.cloudsignage.com. Update your bookmarks." |
| Phase 5 complete | Team | Slack | "Shared packages extracted. No user-facing changes." |
| Phase 6 complete | Team | Slack | "Migration complete. Old routes and deprecated fields removed." |

---

## 13. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Auth breaking change | Medium | High | Feature flag + backward compat + 30-day overlap |
| Route migration breaks frontend | Medium | High | Old routes kept as aliases until Phase 6 |
| Bundle size regression | Low | Medium | Bundle analyzer after each phase |
| DB migration failure | Low | High | Additive only, tested on staging first |
| Impersonation flow breaks | Medium | High | E2E test on staging, feature flag |
| Session management breaks logins | Medium | Critical | Feature flag, gradual rollout |
| 2FA locks out platform staff | Medium | High | Reset procedure documented, backup codes |
| Performance regression | Low | Medium | Performance benchmarks per phase |

---

## 14. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| 6-phase migration | Yes | Small, verifiable steps, rollback at each phase |
| Additive-first migrations | Yes | Zero downtime, backward compatible |
| Old routes as aliases | Yes | Frontend can migrate gradually |
| Feature flags | Yes | Gradual rollout, instant rollback |
| 30-day observation before Phase 6 | Yes | Ensure no one uses old routes before removing |
| Control Panel first, then Workspace | Yes | Platform staff migrate first (smaller group) |
| No big-bang rewrite | Yes | Too risky, too many moving parts |
| Staging mirrors production | Yes | Realistic testing, catches integration issues |
