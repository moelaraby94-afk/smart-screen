# Prisma Schema Target — Complete Specification

> **Purpose:** Full target Prisma schema for all migration phases
> **Current schema:** `apps/backend/prisma/schema.prisma` (1626 lines, 30+ models)
> **Target schema:** Adds 14 new models, modifies 8 existing models, adds 8 indexes

---

## 1. New Models

### 1.1 PlatformSettings

```prisma
/// Platform-wide configuration stored in database.
/// Replaces the file-based admin-runtime.store.ts.
/// Values are JSON-encoded strings for flexibility.
model PlatformSettings {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON-encoded value
  category  String   // e.g., "branding", "email", "billing", "general"
  updatedAt DateTime @updatedAt
  updatedBy String?  // admin user ID who last changed this

  @@index([category])
}
```

**Migration SQL:**
```sql
CREATE TABLE "PlatformSettings" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "value" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedBy" TEXT
);
CREATE INDEX "PlatformSettings_category_idx" ON "PlatformSettings" ("category");
```

**Seed data:**
```sql
INSERT INTO "PlatformSettings" ("id", "key", "value", "category") VALUES
  (gen_random_uuid(), 'branding.logoUrl', 'null', 'branding'),
  (gen_random_uuid(), 'branding.primaryColor', '"#6366f1"', 'branding'),
  (gen_random_uuid(), 'branding.companyName', '"Cloud Signage"', 'branding'),
  (gen_random_uuid(), 'email.fromAddress', '"noreply@cloudsignage.com"', 'email'),
  (gen_random_uuid(), 'email.fromName', '"Cloud Signage"', 'email'),
  (gen_random_uuid(), 'billing.currency', '"USD"', 'billing'),
  (gen_random_uuid(), 'billing.trialDays', '14', 'billing'),
  (gen_random_uuid(), 'billing.gracePeriodDays', '7', 'billing'),
  (gen_random_uuid(), 'general.platformName', '"Cloud Signage"', 'general'),
  (gen_random_uuid(), 'general.supportEmail', '"support@cloudsignage.com"', 'general'),
  (gen_random_uuid(), 'general.maintenanceMode', 'false', 'general'),
  (gen_random_uuid(), 'general.signupEnabled', 'true', 'general');
```

---

### 1.2 ExchangeToken

```prisma
/// One-time, short-lived token for cross-domain impersonation.
/// Platform admin generates this token; customer app redeems it.
/// Token is stored as SHA-256 hash — never store plaintext.
model ExchangeToken {
  id           String    @id @default(cuid())
  token        String    @unique  // plaintext token (returned to admin, never re-read)
  tokenHash    String    @unique  // SHA-256 hash for DB lookup
  actorUserId  String    // platform admin who initiated impersonation
  targetUserId String    // customer user being impersonated
  workspaceId  String?   // optional workspace context
  expiresAt    DateTime   // 60 seconds from creation
  usedAt       DateTime?  // null = unused, non-null = redeemed
  createdAt    DateTime   @default(now())

  @@index([tokenHash])
  @@index([expiresAt])
}
```

**Migration SQL:**
```sql
CREATE TABLE "ExchangeToken" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL UNIQUE,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "actorUserId" TEXT NOT NULL,
  "targetUserId" TEXT NOT NULL,
  "workspaceId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ExchangeToken_tokenHash_idx" ON "ExchangeToken" ("tokenHash");
CREATE INDEX "ExchangeToken_expiresAt_idx" ON "ExchangeToken" ("expiresAt");
```

---

### 1.3 Plan

```prisma
/// Dynamic subscription plan definitions.
/// Replaces the hardcoded SubscriptionPlan enum.
/// Allows super admins to create/edit plans without DB migration.
model Plan {
  id               String   @id @default(cuid())
  code             String   @unique  // "free", "pro", "business", "enterprise"
  name             String              // display name
  description      String?
  priceMonthly     Int                 // in cents (e.g., 2900 = $29.00)
  priceYearly      Int                 // in cents
  screenLimit      Int                 // max screens (-1 = unlimited)
  storageLimitBytes BigInt             // max storage in bytes (-1 = unlimited)
  userLimit        Int                 // max users per workspace (-1 = unlimited)
  features         Json                // { "apiAccess": true, "webhooks": true, ... }
  isActive         Boolean  @default(true)
  isPublic         Boolean  @default(true)  // visible on marketing/pricing page
  sortOrder        Int      @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  subscriptions    Subscription[]

  @@index([isActive, sortOrder])
}
```

**Migration SQL:**
```sql
CREATE TABLE "Plan" (
  "id" TEXT PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "priceMonthly" INTEGER NOT NULL,
  "priceYearly" INTEGER NOT NULL,
  "screenLimit" INTEGER NOT NULL,
  "storageLimitBytes" BIGINT NOT NULL,
  "userLimit" INTEGER NOT NULL,
  "features" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPublic" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Plan_isActive_sortOrder_idx" ON "Plan" ("isActive", "sortOrder");
```

**Seed data:**
```sql
INSERT INTO "Plan" ("id", "code", "name", "description", "priceMonthly", "priceYearly", "screenLimit", "storageLimitBytes", "userLimit", "features", "sortOrder") VALUES
  (gen_random_uuid(), 'free', 'Free', 'Get started with 1 screen', 0, 0, 1, 536870912, 1, '{"apiAccess": false, "webhooks": false, "analytics": false, "campaigns": false}'::jsonb, 0),
  (gen_random_uuid(), 'pro', 'Pro', 'For small businesses', 2900, 29000, 10, 5368709120, 5, '{"apiAccess": true, "webhooks": false, "analytics": true, "campaigns": true}'::jsonb, 1),
  (gen_random_uuid(), 'business', 'Business', 'For growing teams', 9900, 99000, 50, 21474836480, 20, '{"apiAccess": true, "webhooks": true, "analytics": true, "campaigns": true, "proofOfPlay": true}'::jsonb, 2),
  (gen_random_uuid(), 'enterprise', 'Enterprise', 'For large organizations', 29900, 299000, -1, -1, -1, '{"apiAccess": true, "webhooks": true, "analytics": true, "campaigns": true, "proofOfPlay": true, "customRoles": true, "sso": true}'::jsonb, 3);
```

---

### 1.4 Invoice

```prisma
/// Generated invoice for subscription payments.
/// Created when a payment is successful via Stripe webhook.
model Invoice {
  id              String   @id @default(cuid())
  workspaceId     String
  subscriptionId  String?
  stripeInvoiceId String?  @unique  // Stripe invoice ID if synced
  number          String   @unique  // human-readable invoice number (INV-2026-0001)
  status          InvoiceStatus  @default(DRAFT)
  amountDue       Int              // in cents
  amountPaid      Int       @default(0)  // in cents
  currency        String    @default("USD")
  periodStart     DateTime
  periodEnd       DateTime
  dueDate         DateTime
  paidAt          DateTime?
  pdfUrl          String?           // URL to generated PDF
  lineItems       Json              // [{ description, quantity, unitPrice, total }]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId, createdAt])
  @@index([status, dueDate])
}
```

**Enum:**
```prisma
enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}
```

---

### 1.5 UsageRecord

```prisma
/// Monthly usage tracking per workspace for billing and quotas.
/// One record per workspace per month.
model UsageRecord {
  id              String   @id @default(cuid())
  workspaceId     String
  periodStart     DateTime         // first day of month
  periodEnd       DateTime         // last day of month
  screenCount     Int      @default(0)    // max screens during period
  storageBytes    BigInt   @default(0)    // total storage used
  userCount       Int      @default(0)    // total users
  apiCalls        Int      @default(0)    // API calls count
  webhookCalls    Int      @default(0)    // Webhook deliveries
  proofOfPlayEvents Int    @default(0)    // POP events recorded
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  workspace       Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([workspaceId, periodStart])
  @@index([periodStart])
}
```

---

### 1.6 ProofOfPlay

```prisma
/// Screen playback log — what played on which screen and when.
/// High-volume table — partition by month when exceeding 1M rows.
model ProofOfPlay {
  id           String   @id @default(cuid())
  workspaceId  String
  screenId     String
  playlistId   String?
  mediaId      String?
  playedAt     DateTime
  durationMs   Int              // how long the item played
  createdAt    DateTime @default(now())

  @@index([workspaceId, screenId, playedAt])
  @@index([workspaceId, playedAt])
  @@index([playedAt])
}
```

**Note:** This table will grow rapidly. Plan for monthly partitioning when exceeding 1M rows. Consider TimescaleDB hypertable if PostgreSQL native partitioning is insufficient.

---

### 1.7 EmailTemplate

```prisma
/// Reusable email templates with variable substitution.
/// Stored as HTML with {{variable}} placeholders.
model EmailTemplate {
  id         String   @id @default(cuid())
  code       String   @unique  // "welcome", "password_reset", "subscription_expired"
  subject    String              // email subject with {{variables}}
  htmlBody   String              // HTML body with {{variables}}
  textBody   String?             // plain text fallback
  locale     String   @default("en")  // template locale
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([code, locale, isActive])
}
```

---

### 1.8 DeviceFingerprint

```prisma
/// Device binding for session security.
/// Links sessions to device characteristics for anomaly detection.
model DeviceFingerprint {
  id           String   @id @default(cuid())
  userId       String
  fingerprint  String   // hash of user-agent + screen + timezone + language
  userAgent    String
  ipAddress    String
  firstSeen    DateTime @default(now())
  lastSeen     DateTime @updatedAt
  isTrusted    Boolean  @default(false)

  @@index([userId, fingerprint])
  @@index([userId, isTrusted])
}
```

---

### 1.9 Session

```prisma
/// Redis-backed session metadata (mirrored to DB for audit).
/// Primary storage is Redis; this table is for audit and admin viewing.
model Session {
  id           String    @id @default(cuid())  // same as JWT sid
  userId       String
  audience     String    // "platform" | "customer"
  refreshTokenHash String @unique  // SHA-256 of refresh token
  deviceFingerprintId String?
  ipAddress    String
  userAgent    String
  createdAt    DateTime  @default(now())
  expiresAt    DateTime
  revokedAt    DateTime?  // null = active, non-null = revoked
  lastUsedAt   DateTime  @updatedAt

  @@index([userId, audience, revokedAt])
  @@index([expiresAt])
}
```

---

### 1.10 PlatformStaffAudit

```prisma
/// Platform-specific audit trail for SOC2 compliance.
/// Separate from customer AuditLog to ensure platform actions
/// are never accessible to customer users.
model PlatformStaffAudit {
  id           String   @id @default(cuid())
  actorUserId  String   // platform staff user ID
  action       String   // e.g., "IMPERSONATION_START", "STAFF_ROLE_CHANGE"
  targetUserId String?  // affected user ID
  targetWorkspaceId String?
  ipAddress    String
  userAgent    String?
  metadata     Json?
  createdAt    DateTime @default(now())

  @@index([actorUserId, createdAt])
  @@index([action, createdAt])
  @@index([targetUserId])
}
```

---

### 1.11 SubscriptionEvent

```prisma
/// Immutable subscription lifecycle events.
/// Tracks every state change for billing audit trail.
model SubscriptionEvent {
  id              String   @id @default(cuid())
  subscriptionId  String
  eventType       String   // "created", "upgraded", "downgraded", "canceled", "renewed", "past_due", "expired"
  fromPlan        String?  // previous plan code
  toPlan          String?  // new plan code
  fromStatus      String?  // previous status
  toStatus        String?  // new status
  actorUserId     String?  // who triggered the change (null = system)
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([subscriptionId, createdAt])
  @@index([eventType, createdAt])
}
```

---

### 1.12 ScreenTag

```prisma
/// Tags for screen organization and filtering.
/// Many-to-many between screens and tags.
model ScreenTag {
  id          String  @id @default(cuid())
  workspaceId String
  name        String
  color       String  @default("#6366f1")
  createdAt   DateTime @default(now())

  screens     ScreenTagAssignment[]

  @@unique([workspaceId, name])
  @@index([workspaceId])
}

model ScreenTagAssignment {
  screenId  String
  tagId     String
  assignedAt DateTime @default(now())

  screen    Screen   @relation(fields: [screenId], references: [id], onDelete: Cascade)
  tag       ScreenTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([screenId, tagId])
}
```

---

### 1.13 MediaFolder (if not already exists)

```prisma
/// Hierarchical folder structure for media organization.
model MediaFolder {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  parentId    String?  // null = root folder
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  parent      MediaFolder?  @relation("MediaFolderHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children    MediaFolder[] @relation("MediaFolderHierarchy")
  media       Media[]

  @@unique([workspaceId, parentId, name])
  @@index([workspaceId, parentId])
}
```

**Note:** Check if `MediaFolder` already exists in current schema. If it does, skip creation and only add missing fields/indexes.

---

### 1.14 Template

```prisma
/// Reusable content templates that can be cloned into canvases.
/// System templates are available to all workspaces; workspace templates are private.
model Template {
  id           String   @id @default(cuid())
  workspaceId  String?  // null = system template
  name         String
  description  String?
  category     String   @default("general")
  thumbnailUrl String?
  canvasData   Json     // Konva-compatible canvas JSON
  orientation  String   @default("landscape")  // "landscape" | "portrait" | "square"
  isSystem     Boolean  @default(false)
  isActive     Boolean  @default(true)
  usageCount   Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([workspaceId, category, isActive])
  @@index([isSystem, isActive])
}
```

---

## 2. Modified Models

### 2.1 User — Add Fields (Phase 3: Full Split)

**Phase 0 (additive only):**
```prisma
model User {
  // ... existing fields ...

  // NEW: Audience tracking for JWT
  lastAudience  String?  // last login audience: "platform" | "customer"

  // NEW: Device fingerprint relation
  deviceFingerprints DeviceFingerprint[]

  // NEW: Session relation
  sessions     Session[]
}
```

**Phase 3 (full split — create PlatformUser + CustomerUser):**
```prisma
model PlatformUser {
  id                String   @id @default(cuid())
  email             String   @unique
  fullName          String
  platformStaffRole PlatformStaffRole
  isActive          Boolean  @default(true)
  twoFactorSecret   String?
  lastLoginAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  auditLogs         PlatformStaffAudit[]
  sessions          Session[]
  exchangeTokensInitiated ExchangeToken[] @relation("ExchangeTokenActor")
}

model CustomerUser {
  id                String   @id @default(cuid())
  email             String   @unique
  fullName          String
  businessName      String?
  phone             String?
  country           String?
  city              String?
  locale            String   @default("en")
  isActive          Boolean  @default(true)
  emailVerified     Boolean  @default(false)
  twoFactorSecret   String?
  lastLoginAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  workspaceMemberships WorkspaceMembership[]
  accountMembers       AccountMember[]
  sessions             Session[]
  exchangeTokensTargeted ExchangeToken[] @relation("ExchangeTokenTarget")
}
```

**Migration strategy for User split:**
1. Create `PlatformUser` and `CustomerUser` tables
2. Copy platform staff from `User` where `isSuperAdmin = true OR platformStaffRole IS NOT NULL`
3. Copy remaining users to `CustomerUser`
4. Update all foreign keys (AuditLog, WorkspaceMembership, AccountMember, Campaign, etc.)
5. Keep `User` table during transition (dual-write)
6. After all code updated, drop `User` table

### 2.2 Workspace — Add Fields

```prisma
model Workspace {
  // ... existing fields ...

  slug          String?  @unique  // NEW: URL-friendly identifier
  deletedAt     DateTime?          // NEW: soft delete
  suspendedAt   DateTime?          // NEW: platform suspension
  suspendedBy   String?            // NEW: admin who suspended

  // NEW relations
  invoices      Invoice[]
  usageRecords  UsageRecord[]
  proofOfPlay   ProofOfPlay[]
  screenTags    ScreenTag[]
  templates     Template[]
}
```

### 2.3 Screen — Add Fields and Relations

```prisma
model Screen {
  // ... existing fields ...

  timezone      String?   // NEW: IANA timezone (e.g., "Asia/Riyadh")
  deletedAt     DateTime?  // NEW: soft delete
  tags          ScreenTagAssignment[]  // NEW: tag assignments

  // NEW indexes
  @@index([workspaceId, status])
  @@index([workspaceId, lastSeenAt])
}
```

### 2.4 Media — Add Fields and Relations

```prisma
model Media {
  // ... existing fields ...

  storageKey    String?   // NEW: S3 object key (for S3 storage mode)
  deletedAt     DateTime?  // NEW: soft delete
  folderId      String?    // NEW: folder organization

  folder        MediaFolder? @relation(fields: [folderId], references: [id], onDelete: SetNull)

  // NEW indexes
  @@index([workspaceId, createdAt])
}
```

### 2.5 Playlist — Add Fields

```prisma
model Playlist {
  // ... existing fields ...

  deletedAt     DateTime?  // NEW: soft delete

  // NEW indexes
  @@index([workspaceId, isPublished])
}
```

### 2.6 Subscription — Add Relations

```prisma
model Subscription {
  // ... existing fields ...

  planId        String?   // NEW: reference to Plan table (replaces enum)
  plan          Plan?     @relation(fields: [planId], references: [id])

  events        SubscriptionEvent[]  // NEW: lifecycle events

  // NEW indexes
  @@index([status, subscriptionEndDate])
}
```

**Migration:** For each existing subscription, create a `Plan` record and link it. The `plan` enum field stays during transition (dual-field), then is removed in Phase 4.

### 2.7 AuditLog — Add Fields

```prisma
model AuditLog {
  // ... existing fields ...

  scope         String?   // NEW: "platform" | "customer"
  hash          String?   // NEW: hash chain for tamper detection
  previousHash  String?   // NEW: previous entry's hash

  // NEW indexes
  @@index([scope, createdAt])
}
```

### 2.8 RefreshToken — Add Fields (before Redis migration)

```prisma
model RefreshToken {
  // ... existing fields ...

  audience      String?   // NEW: "platform" | "customer"
  deviceFingerprintId String?  // NEW: device binding
  revokedAt     DateTime?  // NEW: explicit revocation timestamp (vs hard delete)
  revokedBy     String?    // NEW: who revoked (user ID or "system")
}
```

---

## 3. New Enums

```prisma
enum InvoiceStatus {
  DRAFT
  OPEN
  PAID
  VOID
  UNCOLLECTIBLE
}
```

---

## 4. Complete Index Additions

### 4.1 New Indexes on Existing Models

```prisma
// Screen
model Screen {
  // ... existing ...
  @@index([workspaceId, status])        // NEW: fleet status queries
  @@index([workspaceId, lastSeenAt])    // NEW: offline detection
}

// Media
model Media {
  // ... existing ...
  @@index([workspaceId, createdAt])     // NEW: media listing
}

// Playlist
model Playlist {
  // ... existing ...
  @@index([workspaceId, isPublished])   // NEW: published filter
}

// Schedule
model Schedule {
  // ... existing ...
  @@index([workspaceId, startDate])     // NEW: schedule queries
}

// Subscription
model Subscription {
  // ... existing ...
  @@index([status, subscriptionEndDate])  // NEW: expiry cron job
}

// WorkspaceMembership
model WorkspaceMembership {
  // ... existing ...
  @@index([userId])                     // NEW: user's workspaces
}

// AuditLog
model AuditLog {
  // ... existing ...
  @@index([scope, createdAt])           // NEW: scoped audit queries
}
```

### 4.2 Migration SQL (Run with CONCURRENTLY)

```sql
-- Screen
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Screen_workspaceId_status_idx"
  ON "Screen" ("workspaceId", "status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Screen_workspaceId_lastSeenAt_idx"
  ON "Screen" ("workspaceId", "lastSeenAt");

-- Media
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Media_workspaceId_createdAt_idx"
  ON "Media" ("workspaceId", "createdAt");

-- Playlist
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Playlist_workspaceId_isPublished_idx"
  ON "Playlist" ("workspaceId", "isPublished");

-- Schedule
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Schedule_workspaceId_startDate_idx"
  ON "Schedule" ("workspaceId", "startDate");

-- Subscription
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Subscription_status_subscriptionEndDate_idx"
  ON "Subscription" ("status", "subscriptionEndDate");

-- WorkspaceMembership
CREATE INDEX CONCURRENTLY IF NOT EXISTS "WorkspaceMembership_userId_idx"
  ON "WorkspaceMembership" ("userId");
```

---

## 5. Migration Order

### Phase 0 Migrations (Additive Only — Zero Downtime)

| Order | Migration | Type | Risk |
|---|---|---|---|
| 1 | Add indexes (CONCURRENTLY) | Additive | Low |
| 2 | Create `PlatformSettings` table + seed | Additive | Low |
| 3 | Create `ExchangeToken` table | Additive | Low |
| 4 | Add `lastAudience` to `User` | Additive | Low |
| 5 | Add `audience`, `deviceFingerprintId`, `revokedAt`, `revokedBy` to `RefreshToken` | Additive | Low |

### Phase 1 Migrations (Additive)

| Order | Migration | Type | Risk |
|---|---|---|---|
| 6 | Add `deletedAt` to `Workspace`, `Screen`, `Media`, `Playlist` | Additive | Low |
| 7 | Add `suspendedAt`, `suspendedBy`, `slug` to `Workspace` | Additive | Low |
| 8 | Add `timezone`, `tags` relation to `Screen` | Additive | Low |
| 9 | Add `storageKey`, `folderId` to `Media` | Additive | Low |
| 10 | Create `ScreenTag` + `ScreenTagAssignment` | Additive | Low |
| 11 | Create `MediaFolder` (if not exists) | Additive | Low |

### Phase 2 Migrations (Additive)

| Order | Migration | Type | Risk |
|---|---|---|---|
| 12 | Create `Session` table | Additive | Low |
| 13 | Create `DeviceFingerprint` table | Additive | Low |
| 14 | Add `scope`, `hash`, `previousHash` to `AuditLog` | Additive | Low |

### Phase 3 Migrations (Data Migration — Higher Risk)

| Order | Migration | Type | Risk |
|---|---|---|---|
| 15 | Create `Plan` table + seed | Additive | Low |
| 16 | Add `planId` to `Subscription`, link to `Plan` | Additive | Low |
| 17 | Create `Invoice` table | Additive | Low |
| 18 | Create `UsageRecord` table | Additive | Low |
| 19 | Create `ProofOfPlay` table | Additive | Low |
| 20 | Create `EmailTemplate` table + seed | Additive | Low |
| 21 | Create `PlatformStaffAudit` table | Additive | Low |
| 22 | Create `SubscriptionEvent` table | Additive | Low |
| 23 | Create `Template` table | Additive | Low |
| 24 | **Split `User` into `PlatformUser` + `CustomerUser`** | **Data Migration** | **HIGH** |
| 25 | Update all FK references from `User` to new tables | **Breaking** | **HIGH** |
| 26 | Migrate `Subscription.plan` enum to `planId` FK | Data Migration | Medium |

### Phase 4 Migrations (Cleanup)

| Order | Migration | Type | Risk |
|---|---|---|---|
| 27 | Drop `User` table (after verification) | Destructive | Medium |
| 28 | Remove `SubscriptionPlan` enum (after all use `planId`) | Destructive | Low |
| 29 | Remove `plan` field from `Subscription` | Destructive | Low |

---

## 6. Schema Validation Rules

### 6.1 Application-Level Validation

| Rule | Enforcement Point | Detail |
|---|---|---|
| `Workspace.slug` must be lowercase, URL-safe | `WorkspacesService.create()` | Regex: `^[a-z0-9-]+$` |
| `Plan.code` must be lowercase, no spaces | `PlansService.create()` | Regex: `^[a-z0-9_-]+$` |
| `Invoice.number` format: `INV-YYYY-NNNN` | `InvoiceService.generate()` | Auto-generated, sequential |
| `ExchangeToken.expiresAt` must be ≤ 60s from `createdAt` | `ExchangeTokenService.create()` | Hardcoded TTL |
| `UsageRecord.periodStart` must be first day of month | `UsageRecordService.record()` | Auto-calculated |
| `PlatformStaffAudit.action` must be from allowed list | `PlatformStaffAuditService.log()` | Enum-like validation |
| Soft-deleted models (`deletedAt IS NOT NULL`) must not appear in queries | Prisma middleware | Auto-filter |

### 6.2 Prisma Middleware Rules

```typescript
// Auto-filter soft-deleted records
prisma.$use(async (params, next) => {
  if (params.action === 'findUnique' || params.action === 'findMany') {
    const softDeleteModels = ['Workspace', 'Screen', 'Media', 'Playlist'];
    if (softDeleteModels.includes(params.model)) {
      if (!params.args) params.args = {};
      if (!params.args.where) params.args.where = {};
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }
    }
  }
  return next(params);
});
```

---

## 7. Post-Migration Verification

After each migration, verify:

```sql
-- Verify PlatformSettings seeded
SELECT COUNT(*) FROM "PlatformSettings";  -- Should be 12

-- Verify indexes created
SELECT indexname FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE '%_idx'
  ORDER BY indexname;

-- Verify Plan seeded
SELECT code, name, "priceMonthly" FROM "Plan" ORDER BY "sortOrder";  -- Should be 4 rows

-- Verify User split (Phase 3)
SELECT COUNT(*) FROM "PlatformUser";  -- Should match platform staff count
SELECT COUNT(*) FROM "CustomerUser";  -- Should match customer count
SELECT COUNT(*) FROM "User";  -- Should be 0 after Phase 4

-- Verify soft delete columns
SELECT column_name FROM information_schema.columns
  WHERE column_name = 'deletedAt'
  AND table_schema = 'public';
```
