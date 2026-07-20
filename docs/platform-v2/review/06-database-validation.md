# 06 — Database Validation

> **Phase 6:** Every Prisma model classified, indexes, relations, constraints, cascade rules, soft delete, partitioning, auditability, performance, scalability

---

## 1. Current Schema Overview

**File:** `apps/backend/prisma/schema.prisma` (1626 lines)

**Current models:** 30+ models across platform, customer, shared, and infrastructure domains.

**Enums:**
- `UserRole` — OWNER, ADMIN, EDITOR, VIEWER
- `PlatformStaffRole` — SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER
- `SubscriptionPlan` — FREE, PRO, BUSINESS, ENTERPRISE
- `SubscriptionStatus` — TRIAL, ACTIVE, PAST_DUE, CANCELED, EXPIRED
- `ScreenStatus` — ONLINE, OFFLINE, PAUSED
- `CampaignStatus` — DRAFT, PENDING_REVIEW, APPROVED, REJECTED, PUBLISHED, PAUSED, ENDED
- `ScreenPairingSessionStatus` — PENDING, CLAIMED, EXPIRED

---

## 2. Model-by-Model Classification

### 2.1 Platform Models

| Model | Current State | Action | Notes |
|---|---|---|---|
| `User` | Has `isSuperAdmin`, `platformStaffRole`, customer fields | **Split** | See D-01 below |
| `AuditLog` | Cross-tenant audit trail | **Refactor** | Add hash chain, scope field, structured metadata |
| `LoginLockout` | Per-email brute-force lockout | **Keep** | Good design. Keyed on email, not userId. |
| `AdminSettings` | **Does not exist** | **Create** | Replace file-based `admin-runtime.store.ts` |

### 2.2 Customer Models

| Model | Current State | Action | Notes |
|---|---|---|---|
| `Workspace` | Core tenant entity | **Refactor** | Add `slug` uniqueness per region, `ownerId` relation |
| `WorkspaceMembership` | User-workspace role mapping | **Keep** | Good design. `@@unique([workspaceId, userId])` |
| `WorkspaceInvitation` | Pending invitations | **Keep** | Good design. `status` + `expiresAt` |
| `AccountMember` | Account-level membership | **Keep** | Good design. `workspaceScopes` for per-WS roles |
| `AccountMemberWorkspaceScope` | Per-WS role override | **Keep** | Good design. `@@unique([accountMemberId, workspaceId])` |
| `Screen` | Screen entity | **Refactor** | Add `timezone`, `orientation` as enum, `tags` |
| `ScreenPairingSession` | Pairing flow | **Keep** | Good design. `expiresAt`, `pollSecretHash` |
| `Media` | Media asset | **Refactor** | Add `storageKey` for S3, `mimeType` validation |
| `Canvas` | Creative Studio canvas | **Keep** | Good design. `version` field |
| `CanvasVersion` | Canvas version history | **Keep** | Good design. Immutable snapshots |
| `Playlist` | Playlist entity | **Keep** | Good design. `isPublished` flag |
| `PlaylistItem` | Playlist items | **Keep** | Good design. `order`, `durationSeconds` |
| `PlaylistGroup` | Playlist grouping | **Keep** | Good design. Hierarchical via `parentGroupId` |
| `Schedule` | Schedule entity | **Keep** | Good design. Recurrence rules |
| `Campaign` | Promotional campaign | **Keep** | Good design. Approval workflow |
| `CampaignHistory` | Campaign state changes | **Keep** | Good design. Immutable audit trail |
| `Subscription` | Workspace subscription | **Refactor** | See D-02 below |
| `PaymentRecord` | Payment history | **Keep** | Good design. `stripeInvoiceId` |
| `OnboardingProgress` | Onboarding state | **Keep** | Good design. `completedSteps` JSON |
| `FeatureFlag` | Per-WS feature flags | **Keep** | Good design. `@@unique([workspaceId, module])` |
| `PrayerConfig` | Prayer time config | **Keep** | Good design. MENA differentiator |
| `RamadanConfig` | Ramadan mode config | **Keep** | Good design. Auto-activate via dates |

### 2.3 Shared Models

| Model | Current State | Action | Notes |
|---|---|---|---|
| `RefreshToken` | Session management | **Refactor** | Move to Redis. Keep table for audit. |
| `Notification` | User notifications | **Keep** | Good design. Proper indexes |
| `ApiKey` | Workspace API keys | **Keep** | Good design. SHA-256 hash, `keyPrefix` |
| `WebhookEndpoint` | Customer webhook config | **Keep** | Good design. HMAC secret, `deletedAt` |
| `WebhookDeliveryLog` | Webhook delivery audit | **Keep** | Good design. Attempt tracking |

### 2.4 Missing Models (Blueprint Requires)

| Model | Blueprint Reference | Purpose | Priority |
|---|---|---|---|
| `PlatformSettings` | `08-platform-domain.md` | Replace file-based store | **P0** |
| `Plan` | `09-business-architecture.md` | Dynamic plan definitions | **P1** |
| `Invoice` | `09-business-architecture.md` | Invoice generation | **P1** |
| `UsageRecord` | `09-business-architecture.md` | Usage tracking for billing | **P1** |
| `ProofOfPlay` | `02-customer-domain.md` | Screen playback logs | **P2** |
| `EmailTemplate` | `12-notifications.md` | Email notification templates | **P2** |
| `DeviceFingerprint` | `04-authentication.md` | Device binding for sessions | **P2** |
| `Session` | `04-authentication.md` | Redis-backed session metadata | **P2** |
| `ExchangeToken` | `04-authentication.md` | One-time impersonation exchange | **P1** |
| `PlatformStaffAudit` | `08-platform-domain.md` | Platform-specific audit trail | **P2** |
| `SubscriptionEvent` | `09-business-architecture.md` | Subscription lifecycle events | **P2** |
| `ScreenTag` | `02-customer-domain.md` | Screen tagging for organization | **P3** |
| `MediaFolder` | `02-customer-domain.md` | Media folder organization | **P3** |
| `Template` | `02-customer-domain.md` | Reusable content templates | **P3** |

---

## 3. Critical Database Issues

### D-01: User Model Conflates Platform Staff and Customers

**Current schema (relevant fields):**
```prisma
model User {
  id                String             @id @default(cuid())
  email             String             @unique
  fullName          String
  isSuperAdmin      Boolean            @default(false)
  platformStaffRole PlatformStaffRole?
  businessName      String?
  phone             String?
  country           String?
  city              String?
  subscriptionStatus SubscriptionStatus @default(TRIAL)
  subscriptionPlan  SubscriptionPlan   @default(FREE)
  subscriptionEndDate DateTime?
  // ... 30+ more fields
}
```

**Problem:** A single table holds both platform staff (super admin, support specialist, billing manager) and customer users (owners, admins, editors, viewers). This means:
1. JWT audience cannot be determined without DB query + conditional logic
2. `isSuperAdmin` on the same table as customer data is a privilege escalation risk
3. Customer fields (`businessName`, `subscriptionStatus`) are nullable on platform staff
4. Platform staff fields (`platformStaffRole`) are nullable on customers
5. No clear separation of concerns

**Blueprint assumes:** Clean separation between platform identities and customer identities.

**Resolution Options:**

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Split into `PlatformUser` + `CustomerUser`** | Clean separation, no nullable fields, clear ownership | Migration complexity, shared `email` uniqueness across tables | ✅ Recommended |
| **Add `userType` enum field** | Simpler migration, single table | Still mixed concerns, nullable fields remain | ❌ Not recommended |
| **Keep as-is, enforce in app layer** | No migration needed | Fragile, security risk, violates SRP | ❌ Not recommended |

**If splitting:**
- `PlatformUser`: `id`, `email`, `fullName`, `platformStaffRole`, `isActive`, `lastLoginAt`, `twoFactorSecret`, `createdAt`, `updatedAt`
- `CustomerUser`: `id`, `email`, `fullName`, `businessName`, `phone`, `country`, `city`, `locale`, `isActive`, `emailVerified`, `createdAt`, `updatedAt`
- Shared: `email` uniqueness must be enforced across both tables (application-level check or DB trigger)
- `AuditLog.userId` must reference the correct table (polymorphic or separate `platformUserId`/`customerUserId` fields)

### D-02: Subscription Model is Workspace-Scoped but Plan is Enum

**Current:**
```prisma
enum SubscriptionPlan {
  FREE
  PRO
  BUSINESS
  ENTERPRISE
}

model Subscription {
  workspaceId String
  plan        SubscriptionPlan
  status      SubscriptionStatus
  // ...
}
```

**Problem:** Plans are hardcoded in enum. Cannot add plans without DB migration. Cannot define plan features (limits, quotas) in DB.

**Resolution:** Create `Plan` table:
```prisma
model Plan {
  id          String   @id @default(cuid())
  code        String   @unique  // "free", "pro", "business", "enterprise"
  name        String
  description String?
  priceMonthly Int     // in cents
  priceYearly  Int     // in cents
  screenLimit  Int
  storageLimitBytes BigInt
  userLimit    Int
  features     Json    // { "apiAccess": true, "webhooks": true, ... }
  isActive     Boolean @default(true)
  sortOrder    Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

Then `Subscription.planId` references `Plan.id`.

### D-03: No Soft Delete Pattern

**Current:** Most models use `onDelete: Cascade` for related data. No soft delete (`deletedAt` field) on most models.

**Models with soft delete:**
- `WebhookEndpoint` — `deletedAt DateTime?`
- `ApiKey` — `revokedAt DateTime?` (soft revoke)

**Models without soft delete (should have):**
- `Workspace` — hard delete cascades to everything
- `Screen` — hard delete loses pairing history
- `Media` — hard delete loses references in playlists
- `Playlist` — hard delete loses references in schedules
- `User` — hard delete cascades to memberships, audit logs

**Resolution:** Add `deletedAt DateTime?` to critical models. Update all queries to filter `WHERE deletedAt IS NULL` (or use Prisma middleware for automatic filtering).

### D-04: No Partitioning Strategy

**Current:** All data in single PostgreSQL instance, single schema.

**Blueprint target:** Partition `AuditLog`, `WebhookDeliveryLog`, `ProofOfPlay` by date (monthly partitions).

**Gap:** No partitioning exists. Not needed at current scale but must be planned.

**Resolution:** Document partitioning strategy. Implement when `AuditLog` exceeds 1M rows or `ProofOfPlay` is implemented.

---

## 4. Index Analysis

### 4.1 Current Indexes (Well-Designed)

| Model | Index | Purpose | Assessment |
|---|---|---|---|
| `AuditLog` | `@@index([createdAt])` | Time-based queries | ✅ |
| `AuditLog` | `@@index([workspaceId, createdAt])` | Per-WS audit queries | ✅ |
| `LoginLockout` | `@@index([lockedUntil])` | Lockout expiry check | ✅ |
| `Notification` | `@@index([userId, read, createdAt])` | Unread notifications | ✅ |
| `Notification` | `@@index([userId, createdAt])` | Notification history | ✅ |
| `Notification` | `@@index([userId, type, createdAt(sort: Desc)])` | Per-type notifications | ✅ |
| `ApiKey` | `@@index([workspaceId, revokedAt])` | Active API keys | ✅ |
| `WebhookEndpoint` | `@@index([workspaceId, enabled])` | Active webhooks | ✅ |
| `WebhookDeliveryLog` | `@@index([webhookId, createdAt])` | Delivery history | ✅ |
| `FeatureFlag` | `@@unique([workspaceId, module])` | One flag per module | ✅ |
| `Campaign` | `@@index([workspaceId])` | Per-WS campaigns | ✅ |
| `Campaign` | `@@index([status])` | Status filtering | ✅ |
| `CampaignHistory` | `@@index([campaignId])` | Campaign audit trail | ✅ |
| `AccountMemberWorkspaceScope` | `@@index([workspaceId])` | Per-WS scopes | ✅ |
| `PlaylistGroup` | `@@index([parentGroupId])` | Hierarchy traversal | ✅ |

### 4.2 Missing Indexes

| Model | Missing Index | Query Pattern | Severity |
|---|---|---|---|
| `Screen` | `@@index([workspaceId, status])` | Fleet status by WS | **HIGH** — every dashboard load |
| `Screen` | `@@index([workspaceId, lastSeenAt])` | Offline detection | **MEDIUM** |
| `Media` | `@@index([workspaceId, createdAt])` | Media listing | **HIGH** — every media page load |
| `Playlist` | `@@index([workspaceId, isPublished])` | Published playlists | **MEDIUM** |
| `Schedule` | `@@index([workspaceId, startDate])` | Schedule queries | **MEDIUM** |
| `Subscription` | `@@index([status, subscriptionEndDate])` | Expiry tracking | **HIGH** — cron job scanning |
| `RefreshToken` | `@@index([userId, expiresAt])` | Session cleanup | **LOW** — moving to Redis |
| `WorkspaceMembership` | `@@index([userId])` | User's workspaces | **HIGH** — every login |

---

## 5. Relation & Constraint Analysis

### 5.1 Cascade Rules

| Relation | Rule | Assessment |
|---|---|---|
| `Workspace` → `WorkspaceMembership` | `onDelete: Cascade` | ✅ Correct — membership dies with WS |
| `Workspace` → `Screen` | `onDelete: Cascade` | ⚠️ **Should be soft delete** — lose pairing history |
| `Workspace` → `Media` | `onDelete: Cascade` | ⚠️ **Should be soft delete** — lose playlist references |
| `Workspace` → `Playlist` | `onDelete: Cascade` | ⚠️ **Should be soft delete** — lose schedule references |
| `Workspace` → `Subscription` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `ApiKey` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `WebhookEndpoint` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `OnboardingProgress` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `FeatureFlag` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `PrayerConfig` | `onDelete: Cascade` | ✅ Correct |
| `Workspace` → `RamadanConfig` | `onDelete: Cascade` | ✅ Correct |
| `Campaign` → `CampaignHistory` | `onDelete: Cascade` | ⚠️ **Should be Restrict** — audit trail must survive |
| `Campaign.createdBy` → `User` | `onDelete: Restrict` | ✅ Correct — can't delete user with campaigns |
| `Campaign.approvedBy` → `User` | `onDelete: SetNull` | ✅ Correct |
| `Campaign.playlist` → `Playlist` | `onDelete: SetNull` | ✅ Correct |
| `Campaign.screen` → `Screen` | `onDelete: SetNull` | ✅ Correct |
| `AccountMember` → `User` | `onDelete: Cascade` | ✅ Correct |
| `PlaylistGroup` → `User` | `onDelete: Cascade` | ✅ Correct |

### 5.2 Missing Constraints

| Model | Missing Constraint | Severity |
|---|---|---|
| `Screen` | No check on `status` transitions | **LOW** — app-layer enforced |
| `Subscription` | No check on `subscriptionEndDate > startDate` | **LOW** |
| `Campaign` | No check on `endDate > startDate` | **LOW** |
| `Workspace` | `slug` should be `@unique` | **HIGH** — currently no unique constraint on slug |
| `User` | `email` should be case-insensitive unique | **MEDIUM** — currently relies on app-layer lowercasing |

---

## 6. Auditability Analysis

### 6.1 Models with Audit Trail

| Model | Audit Mechanism | Assessment |
|---|---|---|
| `Campaign` | `CampaignHistory` (immutable) | ✅ Excellent |
| `AuditLog` | Append-only table | ✅ Good |
| `WebhookDeliveryLog` | Per-attempt log | ✅ Good |
| `ApiKey` | `lastUsedAt`, `revokedAt` | ✅ Good |
| `Subscription` | `PaymentRecord` | ✅ Good |

### 6.2 Models Without Audit Trail (Should Have)

| Model | Why Audit Needed | Severity |
|---|---|---|
| `Workspace` | Creation, pause, deletion events | **HIGH** |
| `Screen` | Pairing, unpairing, status changes | **MEDIUM** |
| `Playlist` | Publish, unpublish events | **MEDIUM** |
| `User` | Role changes, suspension, activation | **HIGH** |
| `FeatureFlag` | Enable/disable events | **MEDIUM** |
| `WorkspaceMembership` | Role changes | **MEDIUM** |

**Resolution:** Either add `*_history` tables (like `CampaignHistory`) or use a generic `EntityEvent` table with `entityType`, `entityId`, `action`, `metadata`.

---

## 7. Performance & Scalability

### 7.1 Query Performance Concerns

| Concern | Current | Impact | Resolution |
|---|---|---|---|
| `RolesGuard` does 3+ DB queries per request | No caching | 150+ extra queries/sec at 100 RPS | Cache in Redis with 60s TTL |
| `AuthService.me()` fetches user + all memberships | No caching | Heavy query on every page load | Cache in Redis with 30s TTL |
| `AdminService.listCustomers()` | No pagination | Will degrade with >1000 customers | Add cursor-based pagination |
| `AdminService.listGlobalFleetScreens()` | No pagination | Will degrade with >10K screens | Add cursor-based pagination |
| `WorkspacesService` workspace list | No caching | Built on every login/refresh | Cache in Redis |

### 7.2 Connection Pool

**Current:** `DATABASE_POOL_MAX` defaults to 10. `DATABASE_POOL_TIMEOUT_MS` defaults to 30000.

**Assessment:** 10 connections is low for a production SaaS. At 100 concurrent requests with 3+ queries each, the pool will be exhausted.

**Recommendation:** Increase to 20-30 for production. Add PgBouncer for connection multiplexing.

### 7.3 Data Volume Projections

| Model | Current | 1K Customers | 10K Customers | Concern? |
|---|---|---|---|---|
| `Workspace` | <100 | 1K | 10K | No |
| `Screen` | <500 | 10K | 100K | **Yes** — needs partitioning by workspace |
| `Media` | <1K | 50K | 500K | **Yes** — needs storage optimization |
| `AuditLog` | <10K | 1M | 10M | **Yes** — needs partitioning by date |
| `Notification` | <5K | 500K | 5M | **Yes** — needs TTL cleanup |
| `RefreshToken` | <500 | 50K | 500K | Moving to Redis — no concern |
| `WebhookDeliveryLog` | <1K | 100K | 1M | **Yes** — needs partitioning by date |

---

## 8. Prisma Schema Quality

### 8.1 Documentation

**Current:** Schema has excellent inline documentation. Nearly every field has a `///` comment explaining its purpose. Examples:
- `LoginLockout.email` — explains why it's keyed on email not userId
- `AuditLog` — explains why it's in Postgres not a JSON file
- `ApiKey.keyHash` — explains SHA-256 and display-only prefix
- `Subscription.gracePeriodEndsAt` — explains grace period logic

**Assessment:** ✅ Excellent. Best-documented schema I've reviewed.

### 8.2 Naming Conventions

| Convention | Current | Assessment |
|---|---|---|
| Model names | PascalCase, singular | ✅ |
| Field names | camelCase | ✅ |
| Enum names | PascalCase | ✅ |
| Enum values | UPPER_SNAKE_CASE | ✅ |
| Relation names | Descriptive named relations | ✅ (e.g., `"AccountOwnership"`, `"CampaignCreatedBy"`) |
| Index names | Auto-generated | ⚠️ Should be named for clarity |

### 8.3 Type Safety

| Concern | Current | Assessment |
|---|---|---|
| Nullable fields | Properly marked with `?` | ✅ |
| Default values | Sensible defaults | ✅ |
| Unique constraints | Applied where needed | ✅ (except `Workspace.slug`) |
| Foreign keys | All relations have FKs | ✅ |
| Enum usage | Proper enums for status fields | ✅ |
| JSON fields | Used for flexible data (`metadata`, `completedSteps`, `features`) | ✅ — but should validate schema in app layer |
