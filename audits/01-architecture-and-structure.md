# Audit 01: Project Architecture & Structure

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Overall project architecture, monorepo structure, build system, deployment

---

## 1. Project Overview

**Cloud-Screen** is an enterprise cloud signage SaaS platform. It's a monorepo managed by npm workspaces, containing 4 apps:

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `apps/backend` | NestJS + Prisma + PostgreSQL | 4000 (mapped to container 3000) | REST API server |
| `apps/dashboard` | Next.js 15 (App Router) + TailwindCSS | 3000 | Admin & client dashboard |
| `apps/player` | Next.js | — | Player app for screens |
| `apps/marketing` | Next.js | — | Landing page (not yet built) |

---

## 2. Monorepo Structure

```
Cloud-Screen/
├── apps/
│   ├── backend/          # NestJS API
│   ├── dashboard/        # Next.js dashboard
│   ├── marketing/        # Landing page (stub)
│   └── player/           # Player app
├── packages/             # (empty — no shared packages)
├── docs/                 # Execution plan + audit docs
├── scripts/              # i18n, env sync, clean scripts
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.dashboard
├── package.json          # Root workspace config
└── .env / .env.example
```

### Observations

- **No shared packages**: `packages/` directory exists but is empty. Shared types, constants, and validation logic are duplicated across apps.
- **Root `prisma.service.ts`**: A stray `prisma.service.ts` file exists at the repo root (963 bytes). This appears to be a leftover/accidental file — the actual PrismaService lives at `apps/backend/src/common/prisma/prisma.service.ts`.
- **Stray audit files**: Three audit markdown files exist at the repo root (`cloud-screen-audit-report.md`, `cloud-screen-audit-v2.md`, `cloud-screen-ux-audit.md`). These should be moved to `docs/` or `audits/`.

---

## 3. Backend Architecture

### 3.1 Module Organization

The backend follows a **domain-driven modular architecture**:

```
apps/backend/src/
├── app.module.ts          # Root module — 22 domain modules registered
├── main.ts                # Bootstrap, CORS, Helmet, validation pipe
├── instrument.ts          # Sentry instrumentation
├── common/                # Cross-cutting concerns (12 sub-modules)
│   ├── audit/             # Audit log service
│   ├── auth/              # JWT guard, roles guard, current-user decorator
│   ├── config/            # Production secret assertions
│   ├── csrf/              # CSRF protection module
│   ├── errors/            # AllExceptionsFilter, DomainException, error codes
│   ├── health/            # Health check endpoints
│   ├── observability/     # Request logging
│   ├── pagination/        # Pagination helpers
│   ├── prisma/            # PrismaService
│   ├── product/           # Mock billing, storage limit helpers
│   ├── request-context/   # Request-scoped context + app logger
│   ├── throttler/         # User-based throttler guard
│   └── validation/        # (empty — 1 file)
└── domains/               # 22 domain modules
    ├── account/           # User profile, email change
    ├── admin/             # Super admin CRM, impersonation
    ├── api-keys/          # API key management
    ├── audit-log/         # Workspace audit log
    ├── auth/              # Auth, 2FA, login lockout
    ├── canvases/          # Creative studio canvases
    ├── email/             # Email service + templates
    ├── islamic/           # Prayer times, Ramadan mode (Phase 9)
    ├── maintenance/       # Maintenance mode
    ├── media/             # Media uploads, folders, expiry
    ├── notifications/     # In-app notifications
    ├── onboarding/        # Onboarding progress + feature flags
    ├── pairing/           # Screen pairing (6-digit flow)
    ├── player/            # Player bootstrap, heartbeat
    ├── playlists/         # Playlist CRUD + items
    ├── realtime/          # WebSocket gateway + screen heartbeat
    ├── schedules/         # Schedule CRUD + scheduling logic
    ├── screens/           # Screen CRUD + override
    ├── stripe/            # Stripe checkout + billing portal
    ├── subscriptions/     # Subscription management
    ├── webhooks/          # Webhook endpoints + Stripe webhook handler
    └── workspaces/        # Workspace CRUD, invitations, members
```

### 3.2 Cross-Module Dependencies

- **`AuthModule`** uses `forwardRef(() => WorkspacesModule)` — circular dependency between auth and workspaces. This is a known pattern but indicates tight coupling.
- **`SubscriptionsService`** is imported by both `StripeModule` and `WebhooksModule` — appropriate for the billing flow.
- **`ScreenHeartbeatService`** from `RealtimeModule` is used by `SubscriptionsService` and `PairingService` — cross-domain realtime updates.

### 3.3 Global Providers

- `AllExceptionsFilter` as `APP_FILTER` — global error handling ✅
- `ThrottlerGuard` as `APP_GUARD` — global rate limiting ✅
- Sentry integration is conditional on `SENTRY_DSN` ✅

---

## 4. Frontend Architecture (Dashboard)

### 4.1 Route Structure

```
app/[locale]/
├── (auth)/                # Auth routes (login, register, forgot-password)
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── invite/            # Invitation acceptance
├── (shell)/               # Authenticated routes with CrystalShell layout
│   ├── overview/          # Dashboard home
│   ├── screens/           # Screen management
│   ├── media/             # Media library
│   ├── studio/            # Creative studio
│   ├── playlists/         # Playlist management
│   ├── schedules/         # Schedule management
│   ├── team/              # Team management
│   ├── billing/           # Billing & subscription
│   ├── branches/          # Multi-branch workspace management
│   ├── settings/          # Profile, workspace, billing settings
│   ├── admin/             # Super admin section (16 sub-routes)
│   ├── notifications/     # Notification center
│   ├── analytics/         # Analytics
│   ├── audit-log/         # Audit log viewer
│   ├── api-docs/          # API documentation
│   ├── help/              # Help & support
│   ├── emergency/         # Emergency override
│   ├── content/           # Content library
│   ├── templates/         # Content templates
│   ├── proof-of-play/     # PoP reports
│   ├── campaigns/         # Campaign management
│   ├── ai/                # AI tools
│   └── displays/          # Display groups
├── error.tsx              # Locale-level error boundary
├── not-found.tsx          # 404 page
└── layout.tsx             # Root locale layout
```

### 4.2 Feature Organization

Features are organized under `src/features/` with 22 feature folders mirroring backend domains. Each feature typically contains:
- Component files (`.tsx`)
- API client files (`-api.ts`)
- Type definitions

### 4.3 Shared Components

```
components/
├── ui/                    # 12 primitive components (button, card, dialog, etc.)
├── layout/               # Shell sidebar, header, breadcrumbs
├── crystal-shell.tsx     # Main layout shell
├── branding-context.tsx  # Branding provider
├── theme-provider.tsx    # Dark/light theme
├── user-menu.tsx         # User dropdown
├── language-switcher.tsx # EN/AR switcher
└── usage-indicator.tsx   # Usage metering widget
```

---

## 5. Build & Deployment

### 5.1 Docker

- **`Dockerfile.backend`**: Multi-stage build, runs Prisma migrations + starts NestJS
- **`Dockerfile.dashboard`**: Multi-stage build with `NEXT_PUBLIC_API_BASE_URL` build arg
- **`docker-compose.yml`**: 3 services (db, backend, dashboard) with health checks
- **Volumes**: `pgdata`, `media_uploads`, `backend_data` — persistent storage

### 5.2 Environment

- `.env.example` (5200 bytes) — comprehensive template
- Production secrets enforced at boot (`assertProductionSecretsAreSet`)
- CORS allow-list required in production
- `TRUST_PROXY_HOPS` for reverse proxy IP resolution

---

## 6. Identified Issues

### Critical
- **None** — architecture is sound and well-organized.

### High
1. **No shared packages**: Types and constants are duplicated between `apps/backend` and `apps/dashboard`. A `packages/shared` package would reduce drift.
2. **Stray root files**: `prisma.service.ts` at repo root is confusing and should be removed.

### Medium
1. **Empty `common/validation/`**: Directory exists with 1 file but appears unused.
2. **`packages/` directory empty**: Declared in workspace config but contains nothing.
3. **No monorepo CI**: No GitHub Actions workflow visible for automated testing.
4. **Stray audit files at root**: 3 audit `.md` files at repo root should be organized.

### Low
1. **No turbo/nx**: Monorepo uses basic npm workspaces. For a project this size, a build cache tool would speed development.
2. **Marketing app is a stub**: Expected per project plan (Phase 11), not a bug.

---

## 7. Strengths

- Clean domain-driven modular architecture
- Consistent naming conventions
- Comprehensive environment configuration
- Production-grade security bootstrapping (CORS, Helmet, secrets assertion)
- Health checks on all Docker services
- Global error filter and throttler guard
- Well-documented code with explanatory comments

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

*Appended, not edited. See `00-audit-review-and-credibility.md` for the full trust map.*

**Corrections to this file:**
- §2 "No monorepo CI" → **FALSE.** `.github/workflows/ci.yml` exists and runs the full
  `npm run verify` (typecheck → lint → test → i18n → build) plus a marketing build.
- §2 "`packages/` directory empty" → partially false. Two scaffolds exist
  (`packages/config`, `packages/ui`), currently only `.gitkeep` — so the *intent* to share
  code is scaffolded, not absent.
- §1 The 4th app **`apps/marketing` exists** (Next.js: `src/app/{layout,page}.tsx`,
  `next.config.ts`, `package.json`) — it is a minimal but real app, and CI builds it.

**Additions the original missed:**
- **Bleeding-edge toolchain is a first-class constraint.** Prisma 7 (driver adapter),
  Next 15/React 19, Tailwind 4; every app ships an `AGENTS.md` telling agents to read
  `node_modules/**/docs` before coding. This shapes every future change — see file 13 §3.
- **Local-filesystem state** (`apps/backend/.data/*.json`) holds some audit/settings data
  outside Postgres — see file 13 §3 and file 15 §2.
- Realtime/WebSocket layer is unaudited here — see the new **file 12**.
