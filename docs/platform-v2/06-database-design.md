# 06 — Database Design

> **Document Type:** Database Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Complete table inventory, new tables, modified tables, indexes, relationships

---

## 1. Current State

### 1.1 Current Tables (from Prisma schema)

| Table | Purpose | Domain |
|---|---|---|
| `User` | Users (platform staff + customers) | Shared |
| `Workspace` | Customer workspaces | Customer |
| `WorkspaceMember` | User-workspace membership with role | Customer |
| `AccountMember` | Account-level members (cross-workspace) | Customer |
| `AccountMemberWorkspaceScope` | Workspace scopes for account members | Customer |
| `Screen` | Digital signage screens | Customer |
| `ScreenAssignment` | Playlist assignments to screens | Customer |
| `ScreenOverride` | Temporary playlist overrides | Customer |
| `MediaAsset` | Media files (images, videos) | Customer |
| `MediaFolder` | Media library folders | Customer |
| `Canvas` | Studio editor canvases | Customer |
| `CanvasVersion` | Canvas version history | Customer |
| `Playlist` | Content playlists | Customer |
| `PlaylistItem` | Items within playlists | Customer |
| `PlaylistGroup` | Groups of playlists | Customer |
| `Schedule` | Content schedules | Customer |
| `Campaign` | Marketing campaigns | Customer |
| `CampaignHistory` | Campaign state transitions | Customer |
| `Subscription` | Workspace subscriptions | Customer/Platform |
| `SubscriptionPlan` | Subscription plans (mock) | Customer/Platform |
| `RefreshToken` | JWT refresh tokens | Shared |
| `AuditLog` | Audit trail | Shared |
| `Notification` | User notifications | Customer |
| `Webhook` | Customer webhooks | Customer |
| `WebhookDelivery` | Webhook delivery logs | Customer |
| `ApiKey` | Customer API keys | Customer |
| `PairingSession` | Screen pairing sessions | Shared |
| `FeatureFlag` | Per-workspace feature flags | Platform |
| `OnboardingProgress` | Workspace onboarding state | Customer |
| `IslamicConfig` | Prayer times and Ramadan config | Customer |
| `BrandingAsset` | Branding assets (logos, etc.) | Platform |

**Total: ~30 tables**

### 1.2 Problems

1. **User model overload** — `User` serves both platform staff and customers. `isSuperAdmin` boolean mixes concerns.
2. **No `PlatformSettings` table** — Platform settings stored in JSON file (`.data/admin-runtime.json`)
3. **No `Plan` table** — Plans hardcoded in code and mock `SubscriptionPlan` table
4. **No `Invoice` table** — Invoices managed entirely by Stripe
5. **No `SupportTicket` table** — Support is ad-hoc via impersonation
6. **No `EmailTemplate` table** — Emails hardcoded in code
7. **No `AutomationRule` table** — No automation engine
8. **No `MarketplaceApp` table** — No marketplace
9. **AuditLog lacks `scope` field** — Cannot distinguish platform vs customer events
10. **No `Session` table** — Sessions not tracked (JWT expiry only)
11. **No `UsageRecord` table** — Usage not tracked persistently
12. **No `Coupon` table** — No coupon engine
13. **No `TaxRate` table** — No tax engine
14. **No `Integration` table** — No third-party integrations
15. **No `OAuthClient` table** — No OAuth server
16. **No `License` table** — No license engine
17. **No `Backup` table** — No backup tracking

---

## 2. New Tables

### 2.1 Platform Tables

#### `PlatformSettings`
```sql
CREATE TABLE "PlatformSettings" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "platformName"    TEXT NOT NULL DEFAULT 'Cloud-Screen',
  "supportEmail"    TEXT NOT NULL DEFAULT 'support@cloudsignage.com',
  "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
  "defaultTrialDays" INT NOT NULL DEFAULT 14,
  "defaultGracePeriodDays" INT NOT NULL DEFAULT 7,
  "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
  "maintenanceMessage" TEXT,
  "announcement"    TEXT,
  "announcementActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
-- Singleton row (enforced by application logic)
```

#### `Plan`
```sql
CREATE TABLE "Plan" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"             TEXT NOT NULL UNIQUE,          -- 'free', 'starter', 'pro', 'enterprise'
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "maxScreens"      INT NOT NULL,
  "maxStorageMB"    BIGINT NOT NULL,
  "maxApiCallsPerMonth" INT NOT NULL,
  "maxBandwidthGB"  INT NOT NULL,
  "trialDays"       INT NOT NULL DEFAULT 14,
  "isPublic"        BOOLEAN NOT NULL DEFAULT true,
  "isEnterprise"    BOOLEAN NOT NULL DEFAULT false,
  "sortOrder"       INT NOT NULL DEFAULT 0,
  "status"          TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ARCHIVED, DRAFT
  "features"        JSONB NOT NULL DEFAULT '{}',    -- feature key → boolean/config
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Plan_status_idx" ON "Plan"("status");
CREATE INDEX "Plan_isPublic_idx" ON "Plan"("isPublic");
```

#### `PlanPricing`
```sql
CREATE TABLE "PlanPricing" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "planId"          UUID NOT NULL REFERENCES "Plan"("id") ON DELETE CASCADE,
  "currency"        TEXT NOT NULL DEFAULT 'USD',   -- USD, SAR, AED, EUR
  "monthlyPrice"    DECIMAL(10,2) NOT NULL,
  "yearlyPrice"     DECIMAL(10,2) NOT NULL,
  "region"          TEXT,                           -- ME, EU, US, ASIA, null = global
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("planId", "currency", "region")
);
CREATE INDEX "PlanPricing_planId_idx" ON "PlanPricing"("planId");
```

#### `SubscriptionHistory`
```sql
CREATE TABLE "SubscriptionHistory" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "subscriptionId"  UUID NOT NULL REFERENCES "Subscription"("id") ON DELETE CASCADE,
  "action"          TEXT NOT NULL,                  -- CREATED, PLAN_CHANGED, ACTIVATED, CANCELLED, REACTIVATED, TRIAL_EXTENDED
  "fromPlanId"      UUID REFERENCES "Plan"("id"),
  "toPlanId"        UUID REFERENCES "Plan"("id"),
  "actorId"         UUID REFERENCES "User"("id"),
  "reason"          TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "SubscriptionHistory_subscriptionId_idx" ON "SubscriptionHistory"("subscriptionId");
CREATE INDEX "SubscriptionHistory_createdAt_idx" ON "SubscriptionHistory"("createdAt");
```

#### `Invoice`
```sql
CREATE TABLE "Invoice" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceNumber"   TEXT NOT NULL UNIQUE,
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "subscriptionId"  UUID REFERENCES "Subscription"("id"),
  "amount"          DECIMAL(10,2) NOT NULL,
  "currency"        TEXT NOT NULL DEFAULT 'USD',
  "taxAmount"       DECIMAL(10,2) NOT NULL DEFAULT 0,
  "totalAmount"     DECIMAL(10,2) NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'DRAFT',  -- DRAFT, SENT, PAID, VOID, OVERDUE
  "issueDate"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "dueDate"         TIMESTAMP,
  "paidDate"        TIMESTAMP,
  "pdfPath"         TEXT,                           -- Storage path to PDF
  "billingName"     TEXT,
  "billingEmail"    TEXT,
  "billingAddress"  TEXT,
  "taxId"           TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Invoice_workspaceId_idx" ON "Invoice"("workspaceId");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_invoiceNumber_idx" ON "Invoice"("invoiceNumber");
```

#### `InvoiceItem`
```sql
CREATE TABLE "InvoiceItem" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "invoiceId"       UUID NOT NULL REFERENCES "Invoice"("id") ON DELETE CASCADE,
  "description"     TEXT NOT NULL,
  "quantity"        INT NOT NULL DEFAULT 1,
  "unitPrice"       DECIMAL(10,2) NOT NULL,
  "amount"          DECIMAL(10,2) NOT NULL,
  "taxRate"         DECIMAL(5,4) NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
```

#### `Coupon`
```sql
CREATE TABLE "Coupon" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code"            TEXT NOT NULL UNIQUE,
  "description"     TEXT,
  "type"            TEXT NOT NULL,                  -- PERCENTAGE, FIXED_AMOUNT
  "value"           DECIMAL(10,2) NOT NULL,         -- percentage: 10.00 = 10%, fixed: 50.00 = $50
  "currency"        TEXT,                           -- for FIXED_AMOUNT
  "maxRedemptions"  INT,                            -- null = unlimited
  "redemptionsCount" INT NOT NULL DEFAULT 0,
  "perCustomerLimit" INT NOT NULL DEFAULT 1,
  "validFrom"       TIMESTAMP NOT NULL,
  "validUntil"      TIMESTAMP,
  "planIds"         UUID[],                         -- null = all plans
  "firstTimeOnly"   BOOLEAN NOT NULL DEFAULT false,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdBy"       UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_idx" ON "Coupon"("isActive");
```

#### `CouponRedemption`
```sql
CREATE TABLE "CouponRedemption" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "couponId"        UUID NOT NULL REFERENCES "Coupon"("id") ON DELETE CASCADE,
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id"),
  "subscriptionId"  UUID REFERENCES "Subscription"("id"),
  "discountAmount"  DECIMAL(10,2) NOT NULL,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("couponId", "workspaceId")
);
CREATE INDEX "CouponRedemption_couponId_idx" ON "CouponRedemption"("couponId");
CREATE INDEX "CouponRedemption_workspaceId_idx" ON "CouponRedemption"("workspaceId");
```

#### `TaxRate`
```sql
CREATE TABLE "TaxRate" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "country"         TEXT NOT NULL,                  -- ISO 3166-1 alpha-2
  "region"          TEXT,                           -- state/province code
  "rate"            DECIMAL(5,4) NOT NULL,          -- 0.1500 = 15%
  "name"            TEXT NOT NULL,                  -- 'VAT', 'GST', 'Sales Tax'
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("country", "region")
);
```

#### `SupportTicket`
```sql
CREATE TABLE "SupportTicket" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketNumber"    TEXT NOT NULL UNIQUE,
  "workspaceId"     UUID REFERENCES "Workspace"("id"),
  "tenantId"        UUID,                           -- tenant (account) ID
  "subject"         TEXT NOT NULL,
  "description"     TEXT,
  "status"          TEXT NOT NULL DEFAULT 'OPEN',   -- OPEN, IN_PROGRESS, WAITING_CUSTOMER, RESOLVED, CLOSED
  "priority"        TEXT NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
  "category"        TEXT,                           -- BILLING, TECHNICAL, ACCOUNT, FEATURE_REQUEST, OTHER
  "assignedTo"      UUID REFERENCES "User"("id"),
  "createdBy"       UUID NOT NULL REFERENCES "User"("id"),
  "slaResponseAt"   TIMESTAMP,
  "slaResolveAt"    TIMESTAMP,
  "firstResponseAt" TIMESTAMP,
  "resolvedAt"      TIMESTAMP,
  "closedAt"        TIMESTAMP,
  "satisfactionScore" INT,                          -- 1-5, null if not rated
  "tags"            TEXT[],
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");
CREATE INDEX "SupportTicket_assignedTo_idx" ON "SupportTicket"("assignedTo");
CREATE INDEX "SupportTicket_workspaceId_idx" ON "SupportTicket"("workspaceId");
```

#### `SupportTicketMessage`
```sql
CREATE TABLE "SupportTicketMessage" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId"        UUID NOT NULL REFERENCES "SupportTicket"("id") ON DELETE CASCADE,
  "authorId"        UUID NOT NULL REFERENCES "User"("id"),
  "authorType"      TEXT NOT NULL,                  -- STAFF, CUSTOMER, SYSTEM
  "body"            TEXT NOT NULL,
  "isInternal"      BOOLEAN NOT NULL DEFAULT false, -- internal notes not visible to customer
  "attachments"     JSONB,                          -- array of file paths
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "SupportTicketMessage_ticketId_idx" ON "SupportTicketMessage"("ticketId");
CREATE INDEX "SupportTicketMessage_createdAt_idx" ON "SupportTicketMessage"("createdAt");
```

#### `EmailTemplate`
```sql
CREATE TABLE "EmailTemplate" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "key"             TEXT NOT NULL UNIQUE,           -- 'welcome', 'password_reset', 'trial_ending', 'invoice_ready'
  "name"            TEXT NOT NULL,
  "category"        TEXT NOT NULL,                  -- TRANSACTIONAL, LIFECYCLE, MARKETING
  "subject"         JSONB NOT NULL,                 -- { "en": "...", "ar": "..." }
  "body"            JSONB NOT NULL,                 -- { "en": "...", "ar": "..." }
  "variables"       TEXT[],                         -- list of available template variables
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "EmailTemplate_key_idx" ON "EmailTemplate"("key");
CREATE INDEX "EmailTemplate_category_idx" ON "EmailTemplate"("category");
```

#### `EmailLog`
```sql
CREATE TABLE "EmailLog" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateKey"     TEXT,
  "toEmail"         TEXT NOT NULL,
  "subject"         TEXT NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'SENT',   -- SENT, DELIVERED, OPENED, CLICKED, BOUNCED, FAILED
  "provider"        TEXT,                           -- sendgrid, ses, smtp
  "providerMessageId" TEXT,
  "workspaceId"     UUID REFERENCES "Workspace"("id"),
  "userId"          UUID REFERENCES "User"("id"),
  "error"           TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "EmailLog_toEmail_idx" ON "EmailLog"("toEmail");
CREATE INDEX "EmailLog_status_idx" ON "EmailLog"("status");
CREATE INDEX "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
```

#### `AutomationRule`
```sql
CREATE TABLE "AutomationRule" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "trigger"         TEXT NOT NULL,                  -- customer.created, subscription.cancelled, etc.
  "conditions"      JSONB NOT NULL DEFAULT '[]',    -- array of condition objects
  "actions"         JSONB NOT NULL DEFAULT '[]',    -- array of action objects
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "triggerCount"    INT NOT NULL DEFAULT 0,
  "lastTriggeredAt" TIMESTAMP,
  "createdBy"       UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "AutomationRule_trigger_idx" ON "AutomationRule"("trigger");
CREATE INDEX "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");
```

#### `AutomationLog`
```sql
CREATE TABLE "AutomationLog" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId"          UUID NOT NULL REFERENCES "AutomationRule"("id") ON DELETE CASCADE,
  "trigger"         TEXT NOT NULL,
  "context"         JSONB,                          -- event data that triggered the rule
  "actionsExecuted" JSONB,                          -- results of each action
  "success"         BOOLEAN NOT NULL DEFAULT true,
  "error"           TEXT,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "AutomationLog_ruleId_idx" ON "AutomationLog"("ruleId");
CREATE INDEX "AutomationLog_createdAt_idx" ON "AutomationLog"("createdAt");
```

#### `UsageRecord`
```sql
CREATE TABLE "UsageRecord" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "metric"          TEXT NOT NULL,                  -- screens_active, storage_mb, api_calls, bandwidth_gb, proof_of_play_events
  "value"           BIGINT NOT NULL,
  "period"          TEXT NOT NULL,                  -- DAILY, MONTHLY
  "periodStart"     DATE NOT NULL,
  "periodEnd"       DATE NOT NULL,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("workspaceId", "metric", "period", "periodStart")
);
CREATE INDEX "UsageRecord_workspaceId_idx" ON "UsageRecord"("workspaceId");
CREATE INDEX "UsageRecord_metric_idx" ON "UsageRecord"("metric");
CREATE INDEX "UsageRecord_periodStart_idx" ON "UsageRecord"("periodStart");
```

#### `QuotaOverride`
```sql
CREATE TABLE "QuotaOverride" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "metric"          TEXT NOT NULL,                  -- max_screens, max_storage_mb, max_api_calls, max_bandwidth_gb
  "overrideValue"   BIGINT NOT NULL,
  "reason"          TEXT,
  "setBy"           UUID REFERENCES "User"("id"),
  "expiresAt"       TIMESTAMP,                      -- null = permanent
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("workspaceId", "metric")
);
```

#### `Session`
```sql
CREATE TABLE "Session" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"          UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "audience"        TEXT NOT NULL,                  -- platform, customer
  "ip"              TEXT,
  "userAgent"       TEXT,
  "impersonatedBy"  UUID REFERENCES "User"("id"),
  "lastActivityAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "expiresAt"       TIMESTAMP NOT NULL,
  "revokedAt"       TIMESTAMP,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_audience_idx" ON "Session"("audience");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
```

**Note:** Sessions are primarily stored in Redis for fast access. This table is for audit and historical analysis. Redis is the source of truth for active sessions.

#### `PlatformWebhook`
```sql
CREATE TABLE "PlatformWebhook" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "url"             TEXT NOT NULL,
  "events"          TEXT[] NOT NULL,
  "secret"          TEXT NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "description"     TEXT,
  "createdBy"       UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `PlatformWebhookDelivery`
```sql
CREATE TABLE "PlatformWebhookDelivery" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "webhookId"       UUID NOT NULL REFERENCES "PlatformWebhook"("id") ON DELETE CASCADE,
  "event"           TEXT NOT NULL,
  "payload"         JSONB NOT NULL,
  "responseStatus"  INT,
  "responseBody"    TEXT,
  "attempt"         INT NOT NULL DEFAULT 1,
  "deliveredAt"     TIMESTAMP,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "PlatformWebhookDelivery_webhookId_idx" ON "PlatformWebhookDelivery"("webhookId");
```

#### `OAuthClient`
```sql
CREATE TABLE "OAuthClient" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId"        TEXT NOT NULL UNIQUE,
  "clientSecret"    TEXT NOT NULL,                  -- hashed
  "name"            TEXT NOT NULL,
  "description"     TEXT,
  "logoUrl"         TEXT,
  "redirectUris"    TEXT[] NOT NULL,
  "scopes"          TEXT[] NOT NULL,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdBy"       UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### `OAuthSession`
```sql
CREATE TABLE "OAuthSession" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "clientId"        UUID NOT NULL REFERENCES "OAuthClient"("id") ON DELETE CASCADE,
  "userId"          UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "scopes"          TEXT[] NOT NULL,
  "accessToken"     TEXT,                           -- hashed
  "refreshToken"    TEXT,                           -- hashed
  "expiresAt"       TIMESTAMP,
  "revokedAt"       TIMESTAMP,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "OAuthSession_clientId_idx" ON "OAuthSession"("clientId");
CREATE INDEX "OAuthSession_userId_idx" ON "OAuthSession"("userId");
```

#### `MarketplaceApp`
```sql
CREATE TABLE "MarketplaceApp" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"            TEXT NOT NULL,
  "slug"            TEXT NOT NULL UNIQUE,
  "developerId"     UUID REFERENCES "User"("id"),
  "description"     TEXT,
  "category"        TEXT,                           -- CONTENT, ANALYTICS, INTEGRATION, PRODUCTIVITY
  "iconUrl"         TEXT,
  "screenshots"     TEXT[],
  "version"         TEXT NOT NULL,
  "changelog"       TEXT,
  "pricingType"     TEXT NOT NULL DEFAULT 'FREE',   -- FREE, ONE_TIME, SUBSCRIPTION
  "price"           DECIMAL(10,2),
  "currency"        TEXT DEFAULT 'USD',
  "requestedScopes" TEXT[] NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_REVIEW, APPROVED, REJECTED, SUSPENDED
  "installCount"    INT NOT NULL DEFAULT 0,
  "rating"          DECIMAL(3,2) NOT NULL DEFAULT 0,
  "featured"        BOOLEAN NOT NULL DEFAULT false,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "MarketplaceApp_slug_idx" ON "MarketplaceApp"("slug");
CREATE INDEX "MarketplaceApp_status_idx" ON "MarketplaceApp"("status");
CREATE INDEX "MarketplaceApp_category_idx" ON "MarketplaceApp"("category");
```

#### `MarketplaceInstallation`
```sql
CREATE TABLE "MarketplaceInstallation" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "appId"           UUID NOT NULL REFERENCES "MarketplaceApp"("id") ON DELETE CASCADE,
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "status"          TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, UNINSTALLED, SUSPENDED
  "installedBy"     UUID NOT NULL REFERENCES "User"("id"),
  "uninstalledAt"   TIMESTAMP,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("appId", "workspaceId")
);
CREATE INDEX "MarketplaceInstallation_appId_idx" ON "MarketplaceInstallation"("appId");
CREATE INDEX "MarketplaceInstallation_workspaceId_idx" ON "MarketplaceInstallation"("workspaceId");
```

#### `License`
```sql
CREATE TABLE "License" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "licenseKey"      TEXT NOT NULL UNIQUE,
  "workspaceId"     UUID REFERENCES "Workspace"("id"),
  "tenantId"        UUID,
  "type"            TEXT NOT NULL,                  -- SAAS, ON_PREMISE, MARKETPLACE
  "maxScreens"      INT NOT NULL,
  "fingerprint"     TEXT,                           -- hardware fingerprint for on-premise
  "issuedTo"        TEXT,
  "issuedEmail"     TEXT,
  "expiresAt"       TIMESTAMP,
  "revokedAt"       TIMESTAMP,
  "revokedReason"   TEXT,
  "metadata"        JSONB,
  "createdBy"       UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "License_licenseKey_idx" ON "License"("licenseKey");
CREATE INDEX "License_workspaceId_idx" ON "License"("workspaceId");
```

#### `Integration`
```sql
CREATE TABLE "Integration" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "provider"        TEXT NOT NULL,                  -- slack, google_drive, dropbox, microsoft_teams
  "status"          TEXT NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, DISCONNECTED, ERROR
  "accessToken"     TEXT,                           -- encrypted
  "refreshToken"    TEXT,                           -- encrypted
  "expiresAt"       TIMESTAMP,
  "config"          JSONB,                          -- sync settings, frequency, etc.
  "lastSyncAt"      TIMESTAMP,
  "lastSyncError"   TEXT,
  "connectedBy"     UUID REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("workspaceId", "provider")
);
CREATE INDEX "Integration_workspaceId_idx" ON "Integration"("workspaceId");
```

#### `Backup`
```sql
CREATE TABLE "Backup" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type"            TEXT NOT NULL,                  -- DATABASE, STORAGE
  "status"          TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, FAILED
  "sizeBytes"       BIGINT,
  "storagePath"     TEXT,
  "trigger"         TEXT NOT NULL,                  -- AUTOMATED, MANUAL
  "triggeredBy"     UUID REFERENCES "User"("id"),
  "startedAt"       TIMESTAMP,
  "completedAt"     TIMESTAMP,
  "error"           TEXT,
  "metadata"        JSONB,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Backup_status_idx" ON "Backup"("status");
CREATE INDEX "Backup_createdAt_idx" ON "Backup"("createdAt");
```

#### `WhiteLabelConfig`
```sql
CREATE TABLE "WhiteLabelConfig" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "customDomain"    TEXT,
  "domainVerified"  BOOLEAN NOT NULL DEFAULT false,
  "sslCertPath"     TEXT,
  "hideBranding"    BOOLEAN NOT NULL DEFAULT false,
  "customLogoUrl"   TEXT,
  "customColors"    JSONB,
  "customEmailFrom" TEXT,
  "customEmailName" TEXT,
  "resellerId"      UUID REFERENCES "User"("id"),
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("workspaceId")
);
```

#### `ScheduledReport`
```sql
CREATE TABLE "ScheduledReport" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "name"            TEXT NOT NULL,
  "reportType"      TEXT NOT NULL,                  -- OVERVIEW, SCREEN, CONTENT, PROOF_OF_PLAY, CAMPAIGN
  "frequency"       TEXT NOT NULL,                  -- DAILY, WEEKLY, MONTHLY
  "recipients"      TEXT[] NOT NULL,                -- email addresses
  "format"          TEXT NOT NULL DEFAULT 'PDF',    -- PDF, CSV
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "lastSentAt"      TIMESTAMP,
  "nextSendAt"      TIMESTAMP,
  "createdBy"       UUID NOT NULL REFERENCES "User"("id"),
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "ScheduledReport_workspaceId_idx" ON "ScheduledReport"("workspaceId");
CREATE INDEX "ScheduledReport_nextSendAt_idx" ON "ScheduledReport"("nextSendAt");
```

#### `ProofOfPlay`
```sql
CREATE TABLE "ProofOfPlay" (
  "id"              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "workspaceId"     UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "screenId"        UUID NOT NULL REFERENCES "Screen"("id") ON DELETE CASCADE,
  "playlistItemId"  UUID,
  "canvasId"        UUID,
  "mediaAssetId"    UUID,
  "playedAt"        TIMESTAMP NOT NULL,
  "durationSec"     INT NOT NULL,
  "screenshotPath"  TEXT,                           -- optional proof photo
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "ProofOfPlay_workspaceId_idx" ON "ProofOfPlay"("workspaceId");
CREATE INDEX "ProofOfPlay_screenId_idx" ON "ProofOfPlay"("screenId");
CREATE INDEX "ProofOfPlay_playedAt_idx" ON "ProofOfPlay"("playedAt");
-- Partition by month for performance at scale
```

---

## 3. Modified Tables

### 3.1 `User` — Add Platform Staff Fields

```sql
ALTER TABLE "User" ADD COLUMN "platformStaffRole" TEXT; -- SUPER_ADMIN, SUPPORT, BILLING, SECURITY, OPERATIONS, DEVELOPER, VIEWER
ALTER TABLE "User" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE'; -- ACTIVE, SUSPENDED, INACTIVE
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT[];
ALTER TABLE "User" ADD COLUMN "lastLoginAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "lastLoginIp" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "deactivatedAt" TIMESTAMP;
ALTER TABLE "User" ADD COLUMN "deactivatedBy" UUID REFERENCES "User"("id");
ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN "companyName" TEXT;
ALTER TABLE "User" ADD COLUMN "country" TEXT;
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'en';

-- Index for platform staff queries
CREATE INDEX "User_platformStaffRole_idx" ON "User"("platformStaffRole") WHERE "platformStaffRole" IS NOT NULL;
CREATE INDEX "User_status_idx" ON "User"("status");
```

**Migration note:** Set `platformStaffRole = 'SUPER_ADMIN'` for all users where `isSuperAdmin = true`. Keep `isSuperAdmin` column for backward compatibility during migration, deprecate after.

### 3.2 `Workspace` — Add Tenant and Lifecycle Fields

```sql
ALTER TABLE "Workspace" ADD COLUMN "tenantId" UUID; -- links to tenant (account)
ALTER TABLE "Workspace" ADD COLUMN "lifecycleStage" TEXT NOT NULL DEFAULT 'ACTIVE'; -- LEAD, TRIAL, ACTIVE, AT_RISK, CHURNED, REACTIVATED
ALTER TABLE "Workspace" ADD COLUMN "lifecycleStageChangedAt" TIMESTAMP;
ALTER TABLE "Workspace" ADD COLUMN "csmId" UUID REFERENCES "User"("id"); -- Customer Success Manager
ALTER TABLE "Workspace" ADD COLUMN "tags" TEXT[];
ALTER TABLE "Workspace" ADD COLUMN "internalNotes" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "Workspace" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "dataRetentionDays" INT NOT NULL DEFAULT 365;
ALTER TABLE "Workspace" ADD COLUMN "suspendedAt" TIMESTAMP;
ALTER TABLE "Workspace" ADD COLUMN "suspendedReason" TEXT;
ALTER TABLE "Workspace" ADD COLUMN "terminatedAt" TIMESTAMP;

CREATE INDEX "Workspace_tenantId_idx" ON "Workspace"("tenantId");
CREATE INDEX "Workspace_lifecycleStage_idx" ON "Workspace"("lifecycleStage");
```

### 3.3 `Subscription` — Link to Plan Table

```sql
ALTER TABLE "Subscription" ADD COLUMN "planId" UUID REFERENCES "Plan"("id");
ALTER TABLE "Subscription" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE'; -- TRIALING, ACTIVE, PAST_DUE, CANCELLED, ENDED
ALTER TABLE "Subscription" ADD COLUMN "trialEndsAt" TIMESTAMP;
ALTER TABLE "Subscription" ADD COLUMN "cancelledAt" TIMESTAMP;
ALTER TABLE "Subscription" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "billingName" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "billingEmail" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "billingAddress" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "taxId" TEXT;
ALTER TABLE "Subscription" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
```

### 3.4 `AuditLog` — Add Scope and Enhanced Fields

```sql
ALTER TABLE "AuditLog" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'CUSTOMER'; -- PLATFORM, CUSTOMER, SUPPORT, SYSTEM
ALTER TABLE "AuditLog" ADD COLUMN "actorRole" TEXT; -- role at time of action
ALTER TABLE "AuditLog" ADD COLUMN "impersonatedBy" UUID REFERENCES "User"("id");
ALTER TABLE "AuditLog" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "userAgent" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "resourceType" TEXT; -- SCREEN, PLAYLIST, SUBSCRIPTION, etc.
ALTER TABLE "AuditLog" ADD COLUMN "resourceId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "metadata" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN "hash" TEXT; -- hash chain for tamper detection

CREATE INDEX "AuditLog_scope_idx" ON "AuditLog"("scope");
CREATE INDEX "AuditLog_resourceType_idx" ON "AuditLog"("resourceType");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
```

### 3.5 `Notification` — Add Category and Type

```sql
ALTER TABLE "Notification" ADD COLUMN "category" TEXT; -- SYSTEM, BILLING, SUPPORT, SECURITY, USAGE, SCREEN
ALTER TABLE "Notification" ADD COLUMN "priority" TEXT NOT NULL DEFAULT 'NORMAL'; -- LOW, NORMAL, HIGH, URGENT
ALTER TABLE "Notification" ADD COLUMN "actionUrl" TEXT; -- deep link
ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Notification" ADD COLUMN "expiresAt" TIMESTAMP;
```

### 3.6 `FeatureFlag` — Add Global and Scheduled Fields

```sql
ALTER TABLE "FeatureFlag" ADD COLUMN "isGlobal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "FeatureFlag" ADD COLUMN "scheduledActivateAt" TIMESTAMP;
ALTER TABLE "FeatureFlag" ADD COLUMN "scheduledDeactivateAt" TIMESTAMP;
ALTER TABLE "FeatureFlag" ADD COLUMN "config" JSONB; -- feature-specific config
ALTER TABLE "FeatureFlag" ADD COLUMN "setBy" UUID REFERENCES "User"("id");
```

---

## 4. Entity Relationship Summary

### 4.1 Platform Entities

```
PlatformSettings (singleton)
Plan ──< PlanPricing
Plan ──< SubscriptionHistory
Plan ──< Subscription >── Workspace
Subscription ──< Invoice ──< InvoiceItem
Coupon ──< CouponRedemption
TaxRate
SupportTicket ──< SupportTicketMessage
EmailTemplate
EmailLog
AutomationRule ──< AutomationLog
UsageRecord
QuotaOverride
Session
PlatformWebhook ──< PlatformWebhookDelivery
OAuthClient ──< OAuthSession
MarketplaceApp ──< MarketplaceInstallation
License
Integration
Backup
WhiteLabelConfig
ScheduledReport
ProofOfPlay
```

### 4.2 Customer Entities (unchanged relationships)

```
Workspace ──< WorkspaceMember >── User
Workspace ──< AccountMember ──< AccountMemberWorkspaceScope
Workspace ──< Screen ──< ScreenAssignment
                            ──< ScreenOverride
Workspace ──< MediaAsset >── MediaFolder
Workspace ──< Canvas ──< CanvasVersion
Workspace ──< Playlist ──< PlaylistItem
              ──< PlaylistGroup
Workspace ──< Schedule
Workspace ──< Campaign ──< CampaignHistory
Workspace ──< Subscription
Workspace ──< Notification
Workspace ──< Webhook ──< WebhookDelivery
Workspace ──< ApiKey
Workspace ──< OnboardingProgress
Workspace ──< IslamicConfig
Workspace ──< PairingSession
Workspace ──< FeatureFlag
Workspace ──< UsageRecord
Workspace ──< QuotaOverride
Workspace ──< Integration
Workspace ──< ScheduledReport
Workspace ──< ProofOfPlay
```

### 4.3 Shared Entities

```
User ──< Session
User ──< RefreshToken
User ──< AuditLog (as actor)
User ──< EmailLog
User ──< SupportTicket (as creator/assignee)
User ──< OAuthSession
```

---

## 5. Indexing Strategy

### 5.1 Critical Indexes

| Table | Index | Purpose |
|---|---|---|
| `User` | `email` (unique) | Login lookup |
| `User` | `platformStaffRole` | Platform staff queries |
| `Workspace` | `tenantId` | Tenant-scoped workspace list |
| `Workspace` | `lifecycleStage` | Lifecycle funnel analytics |
| `Screen` | `workspaceId` | Workspace-scoped screen list |
| `Screen` | `status` | Fleet status queries |
| `MediaAsset` | `workspaceId, createdAt` | Media listing |
| `Playlist` | `workspaceId` | Playlist listing |
| `Schedule` | `workspaceId, startDate` | Schedule calendar |
| `AuditLog` | `workspaceId, createdAt` | Audit log per workspace |
| `AuditLog` | `scope, createdAt` | Platform audit log |
| `ProofOfPlay` | `workspaceId, playedAt` | Analytics queries |
| `UsageRecord` | `workspaceId, metric, periodStart` | Usage queries |
| `SupportTicket` | `status, priority` | Ticket queue |
| `Invoice` | `workspaceId, status` | Billing queries |

### 5.2 Future: Partitioning

| Table | Partition Strategy | When |
|---|---|---|
| `AuditLog` | By month | 10,000+ customers |
| `ProofOfPlay` | By month | 1,000+ screens |
| `EmailLog` | By month | 10,000+ customers |
| `UsageRecord` | By month | 10,000+ customers |

---

## 6. Data Migration Summary

### 6.1 New Tables (Additive)

All new tables are additive — no existing data needs to change. Create tables, then backfill:

1. Create `PlatformSettings` → insert singleton row with current values from `.data/admin-runtime.json`
2. Create `Plan` → insert rows for current hardcoded plans (FREE, STARTER, PRO, ENTERPRISE)
3. Create `PlanPricing` → insert pricing for each plan
4. Update `Subscription` → set `planId` based on current `plan` string field
5. Update `User` → set `platformStaffRole` based on `isSuperAdmin`
6. Update `Workspace` → set `lifecycleStage = 'ACTIVE'` for all
7. Update `AuditLog` → set `scope = 'CUSTOMER'` for existing records

### 6.2 Modified Tables (Non-Breaking)

All `ALTER TABLE` statements are additive (new columns with defaults). No existing queries break.

### 6.3 Deprecated Fields

| Field | Table | Replacement | Deprecation |
|---|---|---|---|
| `isSuperAdmin` | `User` | `platformStaffRole = 'SUPER_ADMIN'` | Remove after migration + 30 days |
| `plan` (string) | `Subscription` | `planId` (FK to Plan) | Remove after migration + 30 days |

---

## 7. Open Questions

1. **Should we use a separate database for platform data?** No — shared database with module-level access is simpler. Separate databases require distributed transactions.
2. **Should `ProofOfPlay` use a time-series database?** Future — InfluxDB or TimescaleDB for high-volume event data. Start with PostgreSQL partitioning.
3. **Should we use soft deletes globally?** No — only for entities that need audit trails (User, Workspace, Subscription). Content entities (Screen, Playlist, Media) use hard deletes with audit log.
4. **Should `Session` table replace Redis sessions?** No — Redis is the source of truth for active sessions. The table is for historical analysis only.
5. **Should we add a `Tenant` table separate from `Workspace`?** Yes — `Tenant` represents the customer account (company), `Workspace` represents a workspace within that account. One tenant can have multiple workspaces. The `tenantId` on `Workspace` links them.

---

## 8. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single database | Yes | Shared data model, simpler transactions, easier ops |
| New tables: additive | Yes | No breaking changes to existing data |
| `platformStaffRole` enum | Replaces `isSuperAdmin` | More expressive, supports multiple roles |
| `Plan` table | Replaces hardcoded plans | Dynamic plan management without deployment |
| `Session` table + Redis | Dual store | Redis for speed, table for audit |
| `ProofOfPlay` partitioning | By month | Query performance at scale |
| `AuditLog.scope` | PLATFORM/CUSTOMER/SUPPORT/SYSTEM | Separates audit contexts |
| Soft deletes | Selective | Only for entities with audit requirements |
| `Tenant` concept | Via `Workspace.tenantId` | One tenant → multiple workspaces |
| `WhiteLabelConfig` | Per workspace | White-label is a customer feature, not platform |
