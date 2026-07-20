# 02 — Repository Impact Matrix

> **Phase 2:** Every module in the repository — keep, refactor, move, split, rewrite, or delete

---

## Backend Modules

### Domain Modules (`apps/backend/src/domains/`)

| Module | Current State | Action | Target Bounded Context | Notes |
|---|---|---|---|---|
| `account/` | Account-level membership CRUD | **Refactor** | Customer | Move to `/customer/account/*`. Currently has no route prefix. |
| `admin/` | 16 files: admin controller, service, branding, DTOs | **Split** | Platform | Split into: TenantManagement, PlatformSettings, PlatformStaff, PlatformBilling, PlatformAnalytics. Move to `/platform/*`. |
| `api-keys/` | API key CRUD for workspaces | **Refactor** | Customer | Move to `/customer/api-keys/*`. Add scope validation. |
| `audit-log/` | Workspace audit log controller | **Refactor** | Customer | Move to `/customer/audit-log/*`. Platform audit log is in `common/audit/`. |
| `auth/` | 20 files: login, register, 2FA, impersonation, JWT, refresh | **Split** | Shared + Platform + Customer | Split: `/auth/*` (shared login/register), `/platform/auth/*` (staff login), `/auth/impersonate/*` (exchange token). `AuthService` is 1051 lines — too large. |
| `campaigns/` | Campaign CRUD + approval workflow | **Refactor** | Customer | Move to `/customer/campaigns/*`. Keep approval workflow. |
| `canvases/` | Canvas CRUD + version history | **Refactor** | Customer | Move to `/customer/canvases/*`. |
| `email/` | Email service + templates | **Keep as-is** | Shared | Already `@Global()`. Good design. |
| `islamic/` | Prayer times + Ramadan config | **Refactor** | Customer | Move to `/customer/islamic/*`. MENA differentiator. |
| `maintenance/` | System maintenance service | **Refactor** | Platform | Move to `/platform/maintenance/*`. Currently no controller — only service. |
| `media/` | Media upload + storage | **Refactor** | Customer | Move to `/customer/media/*`. Storage module stays shared. |
| `notifications/` | Notification CRUD + realtime push | **Refactor** | Customer | Move to `/customer/notifications/*`. |
| `onboarding/` | Onboarding progress + feature flags | **Refactor** | Customer | Move to `/customer/onboarding/*`. Feature flags controller may need platform split. |
| `pairing/` | Screen pairing sessions | **Refactor** | Customer | Move to `/customer/pairing/*`. Player pairing is separate. |
| `player/` | Player content delivery | **Refactor** | Player | Move to `/player/*`. Already separate from customer routes. |
| `playlists/` | Playlist CRUD + items + groups | **Refactor** | Customer | Move to `/customer/playlists/*`. 28 files — largest customer module. |
| `realtime/` | WebSocket gateway + heartbeat + offline events | **Refactor** | Shared | Stays shared. Both dashboard and player connect. Must add audience validation for WebSocket connections. |
| `schedules/` | Schedule CRUD + scheduling service | **Refactor** | Customer | Move to `/customer/schedules/*`. |
| `screens/` | Screen CRUD + remote commands | **Refactor** | Customer | Move to `/customer/screens/*`. 12 files. |
| `stripe/` | Stripe checkout + billing portal | **Refactor** | Customer | Move to `/customer/billing/stripe/*`. |
| `subscriptions/` | Subscription CRUD + mock plans | **Split** | Customer + Platform | Customer: `/customer/subscriptions/*`. Platform: `/platform/subscriptions/*` (admin mock plans). |
| `webhooks/` | Stripe webhook + customer webhooks + delivery | **Split** | Customer + Platform | Stripe webhook: `/internal/webhooks/stripe`. Customer webhooks: `/customer/webhooks/*`. |
| `workspaces/` | Workspace CRUD + invitations + account members | **Split** | Customer + Platform | Customer: `/customer/workspaces/*`. Platform: `/platform/tenants/*` (admin managing customer workspaces). 1226-line service — too large. |

### Common Modules (`apps/backend/src/common/`)

| Module | Current State | Action | Target | Notes |
|---|---|---|---|---|
| `audit/` | AuditLogService + module | **Refactor** | Shared | Add hash chain, scope field. Already cross-tenant. |
| `auth/` | 18 files: guards, decorators, helpers, specs | **Refactor** | Shared | Add `AudienceGuard`. `RolesGuard` does DB lookup per request — cache or optimize. `AccountContextHelper` does 2+ DB queries per workspace request. |
| `config/` | CORS config, config helper, production assertions | **Keep as-is** | Shared | Good design. |
| `crypto/` | CryptoService for encryption | **Keep as-is** | Shared | Good design. |
| `csrf/` | CSRF middleware + controller | **Refactor** | Shared | Exempt paths are hardcoded. Must be config-driven. Bearer token bypass is correct. |
| `errors/` | Exception filter, domain exception, error codes | **Keep as-is** | Shared | Good design. |
| `guards/` | 1 file (unclear what) | **Investigate** | Shared | Need to check contents. |
| `health/` | Health check endpoints | **Keep as-is** | Shared | Good design. |
| `metrics/` | Prometheus metrics + middleware | **Keep as-is** | Shared | Good design. |
| `observability/` | Sentry instrumentation | **Keep as-is** | Shared | Good design. |
| `pagination/` | Pagination utilities | **Keep as-is** | Shared | Good design. |
| `prisma/` | PrismaService wrapper | **Refactor** | Shared | Add tenant isolation middleware. Add query logging for dev. |
| `product/` | Product config (unclear) | **Investigate** | Shared | Need to check. |
| `queues/` | Email queue module | **Keep as-is** | Shared | Good design. BullMQ. |
| `redis/` | Redis service + throttler storage | **Keep as-is** | Shared | Good design. |
| `request-context/` | AsyncLocalStorage context + logger | **Keep as-is** | Shared | Good design. |
| `storage/` | MinIO/S3 storage module | **Keep as-is** | Shared | Good design. |
| `throttler/` | User-based + WebSocket throttler | **Keep as-is** | Shared | Good design. |
| `validation/` | 1 file | **Investigate** | Shared | Need to check. |
| `validators/` | 1 file | **Investigate** | Shared | Need to check. |

---

## Frontend Modules

### Dashboard App (`apps/dashboard/src/`)

#### Pages (`app/[locale]/(shell)/`)

| Route | Current State | Action | Target App | Notes |
|---|---|---|---|---|
| `overview/` | Customer dashboard | **Keep** | Customer Workspace | |
| `screens/` | Screen fleet management | **Keep** | Customer Workspace | 4 sub-routes |
| `content/` | Content hub (playlists, media, templates) | **Keep** | Customer Workspace | 5 sub-routes |
| `playlists/` | Playlist management | **Keep** | Customer Workspace | |
| `media/` | Media library | **Keep** | Customer Workspace | |
| `studio/` | Creative Studio (Konva editor) | **Keep** | Customer Workspace | |
| `templates/` | Content templates | **Keep** | Customer Workspace | |
| `scheduling/` | Schedule management | **Keep** | Customer Workspace | |
| `schedules/` | Schedule CRUD | **Keep** | Customer Workspace | |
| `campaigns/` | Campaign management | **Keep** | Customer Workspace | |
| `analytics/` | Analytics dashboard | **Keep** | Customer Workspace | |
| `audit-log/` | Workspace audit log | **Keep** | Customer Workspace | |
| `notifications/` | Notification center | **Keep** | Customer Workspace | |
| `team/` | Team management | **Keep** | Customer Workspace | |
| `settings/` | Profile, billing, workspace settings | **Keep** | Customer Workspace | 8 sub-routes |
| `branches/` | Branch/workspace detail | **Keep** | Customer Workspace | 4 sub-routes |
| `ai/` | AI features | **Keep** | Customer Workspace | |
| `emergency/` | Emergency broadcast | **Keep** | Customer Workspace | |
| `api-docs/` | API documentation | **Keep** | Customer Workspace | |
| `help/` | Help center | **Keep** | Customer Workspace | |
| `proof-of-play/` | Proof of play | **Keep** | Customer Workspace | |
| `displays/` | Display management | **Investigate** | Customer Workspace | May be duplicate of screens |
| `billing/` | Billing page | **Keep** | Customer Workspace | May overlap with settings/billing |
| `admin/` | 17 sub-routes: home, customers, staff, users, workspaces, fleet, screens, stats, logs, settings, feature-flags, billing, health | **Move ALL** | Control Panel | This is the entire admin section. 17 sub-routes + 19 feature files. |

#### Feature Folders (`features/`)

| Feature | Current State | Action | Target App | Notes |
|---|---|---|---|---|
| `admin/` (19 files) | Admin API, customer profile, fleet, logs, settings, staff, users, workspaces, feature flags, impersonation, super-admin guard | **Move ALL** | Control Panel | Every file in this folder moves to the new app. |
| `analytics/` | Analytics feature | **Keep** | Customer Workspace | |
| `api/` | API page helpers | **Keep** | Customer Workspace | |
| `api-docs/` | API docs feature | **Keep** | Customer Workspace | |
| `audit-log/` | Audit log feature | **Keep** | Customer Workspace | |
| `auth/` | Auth API + session management | **Split** | Both | Auth API calls are shared. Session management is per-app. |
| `billing/` | Billing feature | **Keep** | Customer Workspace | |
| `branches/` | Branch/workspace detail (15 files) | **Keep** | Customer Workspace | |
| `campaigns/` | Campaign feature (9 files) | **Keep** | Customer Workspace | |
| `content/` | Content hub | **Keep** | Customer Workspace | |
| `dashboard/` | Dashboard overview (19 files) | **Keep** | Customer Workspace | |
| `help/` | Help feature | **Keep** | Customer Workspace | |
| `islamic/` | Islamic features (6 files) | **Keep** | Customer Workspace | |
| `media/` | Media library | **Keep** | Customer Workspace | |
| `notifications/` | Notification feature | **Keep** | Customer Workspace | |
| `onboarding/` | Onboarding feature | **Keep** | Customer Workspace | |
| `playlists/` | Playlist feature (28 files) | **Keep** | Customer Workspace | Largest feature folder. |
| `schedules/` | Schedule feature | **Keep** | Customer Workspace | |
| `screens/` | Screen feature (17 files) | **Keep** | Customer Workspace | |
| `search/` | Search feature | **Keep** | Customer Workspace | |
| `settings/` | Settings feature (9 files) | **Keep** | Customer Workspace | |
| `studio/` | Creative Studio (7 files) | **Keep** | Customer Workspace | |
| `team/` | Team management | **Keep** | Customer Workspace | |
| `workspace/` | Workspace context + switcher (8 files) | **Split** | Both | Workspace context is customer-only. Workspace switcher is customer-only. Control Panel needs its own context. |

#### Shared Components (`components/`)

| Component | Current State | Action | Target | Notes |
|---|---|---|---|---|
| `crystal-shell.tsx` | Main shell with `sovereign` mode | **Split** | Both | Must be split into `ControlPanelShell` and `CustomerShell`. 169 lines with deep admin/customer coupling. |
| `layout/shell-sidebar.tsx` | 553-line sidebar with admin + customer nav | **Split** | Both | Must be split into `ControlPanelSidebar` and `CustomerSidebar`. |
| `layout/header.tsx` | Header with sovereign mode | **Split** | Both | |
| `layout/breadcrumbs.tsx` | Breadcrumbs | **Keep + Split** | Both | Logic is shared but route maps differ. |
| `layout/shell-logo.tsx` | Logo | **Move to packages/ui** | Shared | |
| `language-switcher.tsx` | Locale switcher | **Move to packages/ui** | Shared | |
| `page-transition.tsx` | Page transition animation | **Move to packages/ui** | Shared | |
| `branding-context.tsx` | Branding provider | **Split** | Both | Customer branding is per-workspace. Platform branding is global. |
| `ui/*` (20+ components) | Button, Input, Label, Skeleton, Dialog, etc. | **Move to packages/ui** | Shared | All Radix-based UI primitives. |
| `admin/*` | Admin breadcrumb bar | **Move** | Control Panel | |

### Player App (`apps/player/`)

| Module | Current State | Action | Notes |
|---|---|---|---|
| `app/` | Player pages | **Keep as-is** | No changes needed. Player is already independent. |
| `components/` | Player UI components | **Keep as-is** | |
| `lib/` | Player utilities | **Keep as-is** | |
| `types/` | Player types | **Keep as-is** | |

### Marketing App (`apps/marketing/`)

| Module | Current State | Action | Notes |
|---|---|---|---|
| `src/app/` | Marketing pages | **Keep as-is** | No changes needed. Marketing is already independent. |

---

## Infrastructure Files

| File | Current State | Action | Notes |
|---|---|---|---|
| `docker-compose.yml` | 7 services: db, redis, minio, backend, dashboard, player, marketing | **Refactor** | Add `control-panel` service. Update `ALLOWED_ORIGINS` for two domains. |
| `Dockerfile.backend` | Backend Docker build | **Keep as-is** | Single backend serves both apps. |
| `Dockerfile.dashboard` | Dashboard Docker build | **Keep** | Becomes Customer Workspace Dockerfile. |
| `.env.example` | Environment variables | **Refactor** | Add `CONTROL_PANEL_DOMAIN`, `CUSTOMER_APP_DOMAIN`, separate cookie secrets. |
| `package.json` | Root monorepo config | **Refactor** | Add `apps/control-panel` to workspaces. Add build/dev scripts. |
| `tsconfig.base.json` | Shared TS config | **Move to packages/config** | |
| `.prettierrc.json` | Prettier config | **Move to packages/config** | |

---

## Summary Statistics

| Action | Count | Files Affected |
|---|---|---|
| **Keep as-is** | 18 modules | ~50 files |
| **Refactor** | 22 modules | ~200 files |
| **Move** | 3 modules | ~80 files (admin features + UI components) |
| **Split** | 7 modules | ~40 files |
| **Rewrite** | 0 modules | 0 files |
| **Delete** | 0 modules | 0 files |
| **Investigate** | 4 modules | ~4 files |
| **Move to packages/ui** | ~25 components | ~25 files |
| **Move to packages/config** | 2 configs | 2 files |

**Total files touched: ~400+**
