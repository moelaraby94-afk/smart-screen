# 03 — Backend Architecture

> **Document Type:** Backend Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Module categorization, dependency graph, service boundaries, future extraction plan

---

## 1. Current State

The backend is a single NestJS application with 24 domain modules. All modules share a single process, a single Prisma client, a single Redis connection, and a single WebSocket gateway. There is no module-level isolation — any module can import any other module.

### Current Module Inventory

| Module | Path | Routes | Category (Current) |
|---|---|---|---|
| Auth | `domains/auth/` | `/auth/*` | Shared |
| Admin | `domains/admin/` | `/admin/*` | Platform |
| Workspaces | `domains/workspaces/` | `/workspaces/*` | Customer |
| Screens | `domains/screens/` | `/screens/*` | Customer |
| Canvases | `domains/canvases/` | `/canvases/*` | Customer |
| Media | `domains/media/` | `/media/*` | Customer |
| Playlists | `domains/playlists/` | `/playlists/*` | Customer |
| Schedules | `domains/schedules/` | `/schedules/*` | Customer |
| Campaigns | `domains/campaigns/` | `/campaigns/*` | Customer |
| Subscriptions | `domains/subscriptions/` | `/subscriptions/*` | Customer |
| Stripe | `domains/stripe/` | `/stripe/*` | Customer |
| Realtime | `domains/realtime/` | WebSocket | Shared |
| Player | `domains/player/` | `/player/*` | Shared |
| Pairing | `domains/pairing/` | (via Player/Workspaces) | Shared |
| Account | `domains/account/` | `/account/*` | Customer |
| Webhooks (Customer) | `domains/webhooks/` | `/webhooks/*` | Customer |
| API Keys | `domains/api-keys/` | `/api-keys/*` | Customer |
| Onboarding | `domains/onboarding/` | `/onboarding/*` | Customer |
| Islamic | `domains/islamic/` | `/islamic/*` | Customer |
| Notifications | `domains/notifications/` | `/notifications/*` | Customer |
| Maintenance | `domains/maintenance/` | `/maintenance/*` | Shared |
| Health | `domains/health/` | `/health` | Shared |
| Metrics | `domains/metrics/` | `/metrics` | Shared |
| Audit Log | `domains/audit-log/` | (internal) | Shared |

### Current Problems

1. **No route namespacing** — Platform routes (`/admin/*`) and customer routes (`/screens/*`) share the same `/api/v1/` prefix with no audience validation
2. **Super admin bypass in RolesGuard** — `if (user.isSuperAdmin) return true;` allows platform tokens to access all customer routes
3. **AdminModule imports customer modules** — `AdminModule` imports `WorkspacesModule` and `SubscriptionsModule`, creating a dependency from platform to customer
4. **No module boundary enforcement** — Any module can import any other module. There are no ESLint rules or runtime checks preventing circular dependencies
5. **Single WebSocket gateway** — All realtime traffic (screen heartbeats, dashboard updates, admin notifications) goes through one gateway
6. **No worker separation** — Background jobs (email, webhooks) run in the same process as the API

---

## 2. Target Architecture

### 2.1 Module Categorization

#### Platform Modules (Control Panel API)

These modules serve the Control Panel. They are guarded by `PlatformAudienceGuard` + `PlatformStaffDbGuard`.

| Module | New Path | Route Prefix | Description |
|---|---|---|---|
| PlatformDashboard | `domains/platform/dashboard/` | `/platform/dashboard` | Executive dashboard |
| TenantMgmt | `domains/platform/tenants/` | `/platform/tenants` | Tenant lifecycle |
| CustomerLifecycle | `domains/platform/lifecycle/` | `/platform/lifecycle` | Lifecycle stages |
| WorkspaceOversight | `domains/platform/workspaces/` | `/platform/workspaces` | Workspace oversight |
| SubscriptionEngine | `domains/platform/subscriptions/` | `/platform/subscriptions` | Subscription management |
| PlanMgmt | `domains/platform/plans/` | `/platform/plans` | Plan management |
| BillingCenter | `domains/platform/billing/` | `/platform/billing` | Billing center |
| InvoiceEngine | `domains/platform/invoices/` | `/platform/invoices` | Invoice management |
| CouponEngine | `domains/platform/coupons/` | `/platform/coupons` | Coupon management |
| TaxEngine | `domains/platform/tax/` | `/platform/tax` | Tax management |
| UsageTracking | `domains/platform/usage/` | `/platform/usage` | Usage tracking |
| FeatureMgmt | `domains/platform/features/` | `/platform/features` | Feature catalog |
| FeatureFlags | `domains/platform/feature-flags/` | `/platform/feature-flags` | Feature flags |
| StorageMgmt | `domains/platform/storage/` | `/platform/storage` | Storage management |
| QuotaMgmt | `domains/platform/quotas/` | `/platform/quotas` | Quota management |
| ScreenLicensing | `domains/platform/licenses/` | `/platform/licenses` | Screen licensing |
| LicenseEngine | `domains/platform/license-engine/` | `/platform/license-engine` | License generation |
| DeviceFleet | `domains/platform/fleet/` | `/platform/fleet` | Global fleet |
| GlobalMonitoring | `domains/platform/monitoring/` | `/platform/monitoring` | Platform monitoring |
| PlatformAnalytics | `domains/platform/analytics/` | `/platform/analytics` | Business analytics |
| RevenueAnalytics | `domains/platform/revenue/` | `/platform/revenue` | Revenue analytics |
| SupportCenter | `domains/platform/support/` | `/platform/support` | Support tickets |
| RemoteAssistance | `domains/platform/assistance/` | `/platform/assistance` | Remote assistance |
| Impersonation | `domains/platform/impersonation/` | `/platform/impersonation` | Impersonation |
| CustomerTimeline | `domains/platform/timeline/` | `/platform/timeline` | Customer timeline |
| EmailCenter | `domains/platform/email/` | `/platform/email` | Email management |
| PlatformNotifications | `domains/platform/notifications/` | `/platform/notifications` | Staff notifications |
| PlatformWebhooks | `domains/platform/webhooks/` | `/platform/webhooks` | Platform webhooks |
| APIManagement | `domains/platform/api-mgmt/` | `/platform/api-keys` | API management |
| OAuthClients | `domains/platform/oauth/` | `/platform/oauth` | OAuth clients |
| Marketplace | `domains/platform/marketplace/` | `/platform/marketplace` | Marketplace |
| AuditCenter | `domains/platform/audit/` | `/platform/audit` | Audit center |
| ActivityTimeline | `domains/platform/activity/` | `/platform/activity` | Activity feed |
| PlatformSettings | `domains/platform/settings/` | `/platform/settings` | Platform settings |
| Branding | `domains/platform/branding/` | `/platform/branding` | Branding |
| WhiteLabel | `domains/platform/white-label/` | `/platform/white-label` | White label |
| Localization | `domains/platform/localization/` | `/platform/localization` | Localization |
| SystemHealth | `domains/platform/health/` | `/health` | System health |
| BackgroundJobs | `domains/platform/jobs/` | `/platform/jobs` | Job management |
| QueueConfig | `domains/platform/queues/` | `/platform/queues` | Queue config |
| Backups | `domains/platform/backups/` | `/platform/backups` | Backup management |
| Restore | `domains/platform/restore/` | `/platform/restore` | Restore |
| MaintenanceMode | `domains/platform/maintenance/` | `/platform/maintenance` | Maintenance mode |
| SecurityCenter | `domains/platform/security/` | `/platform/security` | Security center |
| SecretsMgmt | `domains/platform/secrets/` | `/platform/secrets` | Secrets management |
| SessionMgmt | `domains/platform/sessions/` | `/platform/sessions` | Session management |
| Compliance | `domains/platform/compliance/` | `/platform/compliance` | Compliance |
| AutomationEngine | `domains/platform/automation/` | `/platform/automation` | Automation rules |
| CronMgmt | `domains/platform/cron/` | `/platform/cron` | Cron management |
| AIServices | `domains/platform/ai/` | `/platform/ai` | AI services |
| DevPortal | `domains/platform/dev-portal/` | `/platform/developer` | Developer portal |
| InternalTools | `domains/platform/tools/` | `/platform/tools` | Internal tools |

#### Customer Modules (Customer Workspace API)

These modules serve the Customer Workspace. They are guarded by `CustomerAudienceGuard` + `RolesGuard`.

| Module | Path | Route Prefix | Description |
|---|---|---|---|
| OverviewDashboard | `domains/customer/overview/` | `/customer/overview` | Dashboard |
| Screens | `domains/customer/screens/` | `/customer/screens` | Screen management |
| Media | `domains/customer/media/` | `/customer/media` | Media library |
| Canvases | `domains/customer/canvases/` | `/customer/canvases` | Studio editor |
| Playlists | `domains/customer/playlists/` | `/customer/playlists` | Playlists |
| Schedules | `domains/customer/schedules/` | `/customer/schedules` | Scheduling |
| Campaigns | `domains/customer/campaigns/` | `/customer/campaigns` | Campaigns |
| Analytics | `domains/customer/analytics/` | `/customer/analytics` | Analytics |
| Team | `domains/customer/team/` | `/customer/team` | Team management |
| Settings | `domains/customer/settings/` | `/customer/settings` | Workspace settings |
| BillingSelf | `domains/customer/billing/` | `/customer/billing` | Self-service billing |
| Onboarding | `domains/customer/onboarding/` | `/customer/onboarding` | Onboarding |
| Islamic | `domains/customer/islamic/` | `/customer/islamic` | Islamic features |
| Notifications | `domains/customer/notifications/` | `/customer/notifications` | Notifications |
| Webhooks | `domains/customer/webhooks/` | `/customer/webhooks` | Webhooks |
| ApiKeys | `domains/customer/api-keys/` | `/customer/api-keys` | API keys |
| Account | `domains/customer/account/` | `/customer/account` | Account management |
| Integrations | `domains/customer/integrations/` | `/customer/integrations` | Integrations |
| UsageDashboard | `domains/customer/usage/` | `/customer/usage` | Usage dashboard |
| Pairing | `domains/customer/pairing/` | `/customer/pairing` | Screen pairing |

#### Shared Modules (Infrastructure)

These modules are used by both platform and customer modules. They have no route prefix (internal services).

| Module | Path | Description |
|---|---|---|
| Auth | `shared/auth/` | Authentication, JWT, session, impersonation |
| Prisma | `shared/prisma/` | Database access |
| Redis | `shared/redis/` | Redis client |
| Storage | `shared/storage/` | MinIO/S3 abstraction |
| Email | `shared/email/` | Email sending |
| AuditLog | `shared/audit-log/` | Audit log append/query |
| Throttler | `shared/throttler/` | Rate limiting |
| Realtime | `shared/realtime/` | WebSocket gateway |
| Player | `shared/player/` | Player bootstrap, canvas compilation |
| PairingCore | `shared/pairing/` | Pairing session core |
| Metrics | `shared/metrics/` | Prometheus metrics |
| Health | `shared/health/` | Health checks |

#### Auth Module (Special)

The Auth module is shared but has public-facing routes:

| Module | Path | Route Prefix | Description |
|---|---|---|---|
| Auth | `shared/auth/` | `/auth/*` | Login, register, refresh, logout, 2FA, impersonation |

---

## 3. Dependency Graph

### 3.1 High-Level Dependency Rules

```
Platform Modules ──→ Shared Modules ──→ Customer Modules
     │                                          │
     │  (Platform can read customer data         │
     │   through oversight APIs, but             │
     │   Customer NEVER imports Platform)        │
     │                                          │
     └──────────────────────────────────────────┘
                    NEVER: Customer → Platform
```

**Rule: Customer modules NEVER import platform modules.**
**Rule: Platform modules import shared modules and may read customer data through oversight services.**
**Rule: Shared modules never import platform or customer modules.**

### 3.2 Platform Module Dependencies

```
PlatformDashboard
  ├──→ TenantMgmt (read)
  ├──→ SubscriptionEngine (read)
  ├──→ DeviceFleet (read)
  ├──→ SystemHealth (read)
  └──→ RevenueAnalytics (read)

TenantMgmt
  ├──→ SubscriptionEngine (read)
  ├──→ WorkspaceOversight (read)
  ├──→ UsageTracking (read)
  └──→ AuditCenter (write)

CustomerLifecycle
  ├──→ TenantMgmt (read/write)
  ├──→ AutomationEngine (trigger)
  ├──→ EmailCenter (send)
  └──→ AuditCenter (write)

WorkspaceOversight
  ├──→ WorkspaceModule (shared, read-only)
  └──→ AuditCenter (write)

SubscriptionEngine
  ├──→ PlanMgmt (read)
  ├──→ BillingCenter (read)
  ├──→ InvoiceEngine (trigger)
  ├──→ TenantMgmt (read)
  └──→ AuditCenter (write)

PlanMgmt
  └──→ (no dependencies — master data)

BillingCenter
  ├──→ SubscriptionEngine (read)
  ├──→ InvoiceEngine (read)
  ├──→ EmailCenter (send)
  └──→ AuditCenter (write)

InvoiceEngine
  ├──→ BillingCenter (read)
  ├──→ TaxEngine (read)
  ├──→ EmailCenter (send)
  ├──→ Branding (read)
  └──→ Storage (write — PDF)

CouponEngine
  ├──→ SubscriptionEngine (read)
  └──→ BillingCenter (read)

TaxEngine
  └──→ InvoiceEngine (read)

UsageTracking
  ├──→ Realtime (read — screen count)
  ├──→ Storage (read — storage usage)
  ├──→ Throttler (read — API calls)
  ├──→ PlanMgmt (read — limits)
  └──→ SubscriptionEngine (read)

FeatureMgmt
  ├──→ PlanMgmt (read)
  └──→ FeatureFlags (read)

FeatureFlags
  └──→ FeatureMgmt (read)

StorageMgmt
  ├──→ Storage (read)
  ├──→ UsageTracking (read)
  └──→ PlanMgmt (read)

QuotaMgmt
  ├──→ UsageTracking (read)
  ├──→ PlanMgmt (read)
  └──→ SubscriptionEngine (read)

ScreenLicensing
  ├──→ PlanMgmt (read)
  ├──→ UsageTracking (read)
  └──→ DeviceFleet (read)

LicenseEngine
  └──→ (standalone)

DeviceFleet
  ├──→ Realtime (read)
  └──→ Screens (shared, read-only)

GlobalMonitoring
  ├──→ SystemHealth (read)
  └──→ Metrics (read)

PlatformAnalytics
  ├──→ UsageTracking (read)
  ├──→ AuditCenter (read)
  ├──→ SubscriptionEngine (read)
  └──→ FeatureMgmt (read)

RevenueAnalytics
  ├──→ BillingCenter (read)
  ├──→ SubscriptionEngine (read)
  └──→ InvoiceEngine (read)

SupportCenter
  ├──→ TenantMgmt (read)
  ├──→ Impersonation (trigger)
  ├──→ EmailCenter (send)
  └──→ AuditCenter (write)

RemoteAssistance
  ├──→ Realtime (read/write)
  ├──→ Screens (shared, read-only)
  └──→ AuditCenter (write)

Impersonation
  ├──→ Auth (shared)
  ├──→ AuditCenter (write)
  └──→ TenantMgmt (read)

CustomerTimeline
  ├──→ TenantMgmt (read)
  ├──→ SubscriptionEngine (read)
  ├──→ BillingCenter (read)
  ├──→ SupportCenter (read)
  ├──→ AuditCenter (read)
  └──→ UsageTracking (read)

EmailCenter
  ├──→ Email (shared)
  ├──→ Branding (read)
  └──→ Localization (read)

PlatformNotifications
  ├──→ GlobalMonitoring (read)
  ├──→ SupportCenter (read)
  ├──→ SubscriptionEngine (read)
  └──→ Realtime (write — WebSocket push)

PlatformWebhooks
  └──→ AuditCenter (write)

APIManagement
  ├──→ Throttler (read)
  ├──→ UsageTracking (read)
  └──→ AuditCenter (write)

OAuthClients
  ├──→ Auth (shared)
  └──→ AuditCenter (write)

Marketplace
  ├──→ OAuthClients (read)
  ├──→ APIManagement (read)
  └──→ BillingCenter (read)

AuditCenter
  └──→ AuditLog (shared)

ActivityTimeline
  ├──→ AuditLog (shared)
  └──→ Realtime (write)

PlatformSettings
  └──→ (no dependencies — master data)

Branding
  ├──→ Storage (shared)
  └──→ PlatformSettings (read)

WhiteLabel
  ├──→ Branding (read)
  ├──→ EmailCenter (read)
  ├──→ PlatformSettings (read)
  └──→ Auth (shared)

Localization
  └──→ (no dependencies — master data)

SystemHealth
  ├──→ Prisma (shared)
  ├──→ Redis (shared)
  ├──→ Storage (shared)
  └──→ Realtime (shared)

BackgroundJobs
  └──→ Redis (shared)

Backups
  ├──→ Prisma (shared)
  └──→ Storage (shared)

SecurityCenter
  ├──→ Auth (shared)
  ├──→ AuditCenter (read)
  └──→ SessionMgmt (read)

SessionMgmt
  ├──→ Auth (shared)
  ├──→ Redis (shared)
  └──→ AuditCenter (write)

Compliance
  ├──→ TenantMgmt (read)
  ├──→ AuditCenter (read)
  ├──→ Storage (shared)
  └──→ Email (shared)

AutomationEngine
  ├──→ EmailCenter (trigger)
  ├──→ SupportCenter (trigger)
  ├──→ TenantMgmt (read)
  ├──→ PlatformNotifications (trigger)
  └──→ PlatformWebhooks (trigger)

CronMgmt
  ├──→ BackgroundJobs (read)
  └──→ Redis (shared)

AIServices
  ├──→ SupportCenter (read)
  ├──→ PlatformAnalytics (read)
  └──→ AuditCenter (write)

DevPortal
  ├──→ APIManagement (read)
  └──→ OAuthClients (read)

InternalTools
  └──→ All modules (read-only, super admin only)
```

### 3.3 Customer Module Dependencies

```
OverviewDashboard
  ├──→ Screens (read)
  ├──→ Media (read)
  ├──→ Playlists (read)
  ├──→ Schedules (read)
  └──→ Onboarding (read)

Screens
  ├──→ Realtime (shared)
  ├──→ Playlists (read)
  ├──→ Analytics (read)
  └──→ QuotaMgmt (shared, via middleware)

Media
  ├──→ Storage (shared)
  └──→ QuotaMgmt (shared, via middleware)

Canvases
  ├──→ Storage (shared)
  └──→ Media (read)

Playlists
  ├──→ Media (read)
  └──→ Canvases (read)

Schedules
  ├──→ Playlists (read)
  └──→ Screens (read)

Campaigns
  ├──→ Playlists (read)
  ├──→ Screens (read)
  ├──→ Analytics (read)
  └──→ AuditLog (shared, write)

Analytics
  ├──→ Screens (read)
  ├──→ Campaigns (read)
  └──→ Playlists (read)

Team
  ├──→ Auth (shared)
  ├──→ Email (shared)
  └──→ AuditLog (shared, write)

Settings
  └──→ AuditLog (shared, write)

BillingSelf
  ├──→ SubscriptionEngine (platform, via internal API)
  ├──→ Stripe (shared)
  └──→ InvoiceEngine (platform, via internal API)

Onboarding
  ├──→ Screens (read)
  ├──→ Playlists (read)
  ├──→ Media (read)
  └──→ Schedules (read)

Islamic
  ├──→ Playlists (read)
  └──→ Realtime (shared, read)

Notifications
  ├──→ Realtime (shared, write)
  └──→ Email (shared)

Webhooks
  └──→ AuditLog (shared, write)

ApiKeys
  ├──→ Throttler (shared)
  └──→ AuditLog (shared, write)

Account
  ├──→ Auth (shared)
  ├──→ Email (shared)
  └──→ AuditLog (shared, write)

Integrations
  ├──→ OAuthClients (platform, via internal API)
  ├──→ Storage (shared)
  └──→ Media (write)

UsageDashboard
  ├──→ UsageTracking (platform, via internal API)
  └──→ SubscriptionEngine (platform, via internal API)

Pairing
  ├──→ PairingCore (shared)
  ├──→ Screens (write)
  └──→ QuotaMgmt (shared)
```

### 3.4 Shared Module Dependencies

```
Auth
  ├──→ Prisma
  ├──→ Redis
  ├──→ Email
  └──→ AuditLog

Prisma
  └──→ (external: PostgreSQL)

Redis
  └──→ (external: Redis)

Storage
  └──→ (external: MinIO/S3)

Email
  ├──→ (external: SMTP/SendGrid/SES)
  └──→ (uses EmailCenter templates when available)

AuditLog
  └──→ Prisma

Throttler
  └──→ Redis

Realtime
  ├──→ Prisma
  └──→ Redis

Player
  ├──→ PairingCore
  ├──→ Canvases (read — canvas compilation)
  ├──→ Islamic (read — prayer pause)
  └──→ Prisma

PairingCore
  └──→ Prisma

Metrics
  └──→ (external: Prometheus)

Health
  ├──→ Prisma
  ├──→ Redis
  ├──→ Storage
  └──→ Realtime
```

---

## 4. Guard Architecture

### 4.1 Guard Chain

```
Request
  │
  ▼
JwtAuthGuard
  │ - Validates JWT signature
  │ - Checks expiry
  │ - Extracts: sub, email, audience, isSuperAdmin, platformStaffRole, impersonatedBy
  │ - Attaches user to request
  │
  ▼
AudienceGuard (new)
  │ - PlatformAudienceGuard: rejects if audience !== 'platform'
  │ - CustomerAudienceGuard: rejects if audience !== 'customer' && audience !== 'platform'
  │   (platform audience allowed for impersonation)
  │
  ▼
RoleGuard
  │ - PlatformStaffDbGuard: checks isSuperAdmin or platformStaffRole in DB
  │   + @PlatformRoles decorator for specific roles
  │ - RolesGuard: checks workspace membership and UserRole
  │   + @Roles decorator for specific roles
  │
  ▼
QuotaGuard (new, customer only)
  │ - Checks workspace quota (screens, storage) before write operations
  │ - Returns 402 Payment Required if exceeded
  │
  ▼
FeatureGuard (new, customer only)
  │ - Checks if feature is enabled for workspace
  │ - Returns 403 Forbidden if feature disabled
  │
  ▼
Controller Handler
```

### 4.2 Guard Application Per Route Namespace

| Namespace | JwtAuth | AudienceGuard | RoleGuard | QuotaGuard | FeatureGuard |
|---|---|---|---|---|---|
| `/platform/*` | ✅ | PlatformAudience | PlatformStaffDb | ❌ | ❌ |
| `/customer/*` | ✅ | CustomerAudience | RolesGuard | ✅ (writes) | ✅ |
| `/auth/*` | ✅ (authed) / ❌ (public) | ❌ | ❌ | ❌ | ❌ |
| `/player/*` | ❌ (x-player-secret) | ❌ | ❌ | ❌ | ❌ |
| `/public/*` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/health` | ❌ | ❌ | ❌ | ❌ | ❌ |
| `/internal/*` | ❌ (IP allowlist) | ❌ | ❌ | ❌ | ❌ |

---

## 5. Module Wiring (NestJS)

### 5.1 Platform Module

```typescript
// Conceptual — NOT implementation code
@Module({
  imports: [
    // Shared
    PrismaModule, RedisModule, StorageModule, EmailModule,
    AuditLogModule, ThrottlerModule, RealtimeModule,

    // Platform sub-modules
    DashboardModule, TenantModule, LifecycleModule,
    WorkspaceOversightModule, SubscriptionModule, PlanModule,
    BillingModule, InvoiceModule, CouponModule, TaxModule,
    UsageModule, FeatureModule, FeatureFlagsModule,
    StorageMgmtModule, QuotaModule, LicenseModule,
    FleetModule, MonitoringModule, AnalyticsModule,
    RevenueModule, SupportModule, AssistanceModule,
    ImpersonationModule, TimelineModule, EmailCenterModule,
    NotificationModule, WebhookModule, ApiMgmtModule,
    OAuthModule, MarketplaceModule, AuditModule,
    ActivityModule, SettingsModule, BrandingModule,
    WhiteLabelModule, LocalizationModule, HealthModule,
    JobsModule, QueueModule, BackupModule, RestoreModule,
    MaintenanceModule, SecurityModule, SecretsModule,
    SessionModule, ComplianceModule, AutomationModule,
    CronModule, AiModule, DevPortalModule, ToolsModule,
  ],
  controllers: [/* platform controllers */],
  providers: [
    // Guards
    PlatformAudienceGuard, PlatformStaffDbGuard,
    // Interceptors
    AuditInterceptor,
  ],
})
export class PlatformModule {}
```

### 5.2 Customer Module

```typescript
@Module({
  imports: [
    // Shared
    PrismaModule, RedisModule, StorageModule, EmailModule,
    AuditLogModule, ThrottlerModule, RealtimeModule,

    // Customer sub-modules
    OverviewModule, ScreensModule, MediaModule,
    CanvasesModule, PlaylistsModule, SchedulesModule,
    CampaignsModule, AnalyticsModule, TeamModule,
    SettingsModule, BillingSelfModule, OnboardingModule,
    IslamicModule, NotificationModule, WebhookModule,
    ApiKeyModule, AccountModule, IntegrationsModule,
    UsageModule, PairingModule,
  ],
  controllers: [/* customer controllers */],
  providers: [
    // Guards
    CustomerAudienceGuard, RolesGuard,
    QuotaGuard, FeatureGuard,
    // Interceptors
    AuditInterceptor,
  ],
})
export class CustomerModule {}
```

### 5.3 App Module

```typescript
@Module({
  imports: [
    // Config
    ConfigModule, ThrottlerModule,

    // Shared
    AuthModule, PrismaModule, RedisModule, StorageModule,
    EmailModule, AuditLogModule, RealtimeModule,
    PlayerModule, PairingModule, MetricsModule, HealthModule,

    // Domain
    PlatformModule, CustomerModule,

    // Stripe (webhook receiver)
    StripeWebhookModule,
  ],
})
export class AppModule {}
```

---

## 6. Future Service Extraction

### 6.1 When to Extract

| Service | Trigger | Reason |
|---|---|---|
| Realtime Gateway | 50,000+ screens | WebSocket connections are CPU/memory-bound, single process can't handle |
| Worker Processes | 5,000+ customers | Background jobs compete with API for CPU |
| Analytics Aggregation | 10,000+ customers | Proof-of-play aggregation is write-heavy, impacts DB |
| Media Processing | 1,000+ customers | Thumbnail generation, transcoding is CPU-bound |
| API Gateway | Public API launch | Rate limiting, key validation, developer portal |

### 6.2 Extraction Path

```
Current: Single NestJS Process
         │
         ▼
Step 1: Extract Workers (BullMQ workers to separate process)
         │ - Email worker
         │ - Webhook worker
         │ - Analytics worker
         │ - Media processing worker
         ▼
Step 2: Extract Realtime (Socket.IO to separate process)
         │ - Redis adapter for multi-instance
         │ - Screen heartbeats
         │ - Dashboard live updates
         ▼
Step 3: Extract Analytics (Aggregation service)
         │ - Read from events queue
         │ - Write aggregated data to DB
         │ - Separate from API process
         ▼
Step 4: API Gateway (Kong or custom)
         │ - Rate limiting per API key
         │ - Request routing
         │ - API versioning
         │ - Developer portal
         ▼
Step 5: Microservices (only if needed)
         │ - Extract specific modules
         │ - Communication via gRPC or HTTP
         │ - Shared database or separate databases
```

### 6.3 Why Not Start with Microservices

1. **Distributed transactions** — `AdminService.createStaff()` creates User + Workspace + WorkspaceMember in one transaction. Microservices require saga patterns.
2. **Operational complexity** — Each service needs its own deployment, monitoring, logging, and scaling. One developer cannot manage 10 services.
3. **Network latency** — Inter-service calls add 5-20ms per hop. A single request that touches 3 modules adds 15-60ms.
4. **Data consistency** — Shared database with module-level access is simpler than eventual consistency.
5. **Team size** — One developer can maintain a monolith. Microservices need a team.

**The module structure is designed for clean extraction. When scale demands it, each module can be extracted to a separate service with minimal changes (replace DI with HTTP client).**

---

## 7. ESLint Boundary Enforcement

### 7.1 Import Rules

```javascript
// .eslintrc.js — boundary rules
'no-restricted-imports': [
  'error',
  {
    patterns: [
      // Customer modules CANNOT import platform modules
      {
        group: ['domains/platform/*'],
        message: 'Customer modules must not import platform modules.',
        allow: ['domains/platform/*/dto'],
      },
      // Shared modules CANNOT import platform or customer modules
      {
        group: ['domains/platform/*', 'domains/customer/*'],
        message: 'Shared modules must not import domain modules.',
      },
    ],
  },
],
```

### 7.2 Enforcement

- **ESLint** — Static analysis at build time
- **Module wiring** — NestJS module imports are explicit; circular dependencies cause runtime errors
- **Code review** — PR reviews check for boundary violations
- **Dependency graph tool** — `madge` or custom script to detect circular dependencies

---

## 8. Open Questions

1. **Should the Auth module be split** into PlatformAuth and CustomerAuth? No — auth is identity, not authorization. One auth module with audience-aware token issuance is simpler.
2. **Should the Realtime module be split** into PlatformRealtime and CustomerRealtime? Not now — one gateway with room-based isolation is sufficient. Extract when scale demands.
3. **Should customer modules call platform modules** for usage tracking and quota checks? No — customer modules call shared services (UsageTracking, QuotaMgmt) that are injected as shared providers. Platform modules manage these services, but customer modules consume them through interfaces.
4. **Should the Stripe webhook receiver be in Customer or Platform?** Platform — Stripe webhooks are platform billing events, not customer actions. The receiver updates subscription status, which is a platform concern.
5. **Should we use NestJS monorepo** (separate apps per domain)? No — the npm workspace monorepo with a single NestJS app is sufficient. NestJS monorepo adds build complexity without proportional benefit.

---

## 9. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single NestJS process | Yes | Shared data model, shared transactions, simpler ops |
| Route namespacing | `/platform/*`, `/customer/*` | Clear separation, audience validation per namespace |
| Module boundaries | ESLint + NestJS DI | Static analysis + runtime enforcement |
| Guard chain | JwtAuth → Audience → Role → Quota → Feature | Defense in depth, fail-closed |
| Worker separation | Phase 2 (post-separation) | Reduce API process load |
| Realtime extraction | Phase 3 (scale-driven) | When WebSocket connections exceed single process |
| API gateway | Phase 4 (public API) | When developer ecosystem launches |
| Microservices | Only when justified | Each extraction must solve a specific scaling problem |
