# 06 — Domain Model

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Complete domain model mapping — entities, relationships, bounded contexts, and ownership

---

## 1. Current State

### 1.1 Prisma Schema Overview

The database schema (`apps/backend/prisma/schema.prisma`, 1626 lines) defines the following entities:

### 1.2 Entity Inventory

| Entity | Table | Domain | Ownership |
|---|---|---|---|
| `User` | users | Auth/Account | Shared (platform + customer) |
| `Workspace` | workspaces | Workspaces | Shared |
| `WorkspaceMember` | workspace_members | Workspaces | Customer |
| `WorkspaceInvitation` | workspace_invitations | Workspaces | Customer |
| `AccountMember` | account_members | Workspaces | Customer |
| `AccountMemberWorkspaceScope` | account_member_workspace_scopes | Workspaces | Customer |
| `Screen` | screens | Screens | Customer |
| `ScreenPairingSession` | screen_pairing_sessions | Pairing | Customer |
| `Playlist` | playlists | Playlists | Customer |
| `PlaylistGroup` | playlist_groups | Playlists | Customer |
| `PlaylistItem` | playlist_items | Playlists | Customer |
| `ScreenPlaylistAssignment` | screen_playlist_assignments | Screens | Customer |
| `Canvas` | canvases | Canvases | Customer |
| `CanvasVersion` | canvas_versions | Canvases | Customer |
| `Media` | media | Media | Customer |
| `MediaFolder` | media_folders | Media | Customer |
| `Schedule` | schedules | Schedules | Customer |
| `Campaign` | campaigns | Campaigns | Customer |
| `CampaignHistory` | campaign_history | Campaigns | Customer |
| `Subscription` | subscriptions | Subscriptions | Shared |
| `PaymentRecord` | payment_records | Subscriptions | Shared |
| `RefreshToken` | refresh_tokens | Auth | Shared |
| `AuditLog` | audit_logs | Audit | Shared |
| `ApiKey` | api_keys | API Keys | Customer |
| `WebhookEndpoint` | webhook_endpoints | Webhooks | Customer |
| `WebhookDeliveryLog` | webhook_delivery_logs | Webhooks | Customer |
| `OnboardingProgress` | onboarding_progress | Onboarding | Customer |
| `FeatureFlag` | feature_flags | Onboarding | Platform (managed) / Customer (consumed) |
| `PrayerConfig` | prayer_configs | Islamic | Customer |
| `RamadanConfig` | ramadan_configs | Islamic | Customer |
| `Notification` | notifications | Notifications | Customer |
| `NotificationPreference` | notification_preferences | Notifications | Customer |

### 1.3 Enums

| Enum | Values | Domain |
|---|---|---|
| `UserRole` | OWNER, ADMIN, EDITOR, VIEWER | Customer |
| `PlatformStaffRole` | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER | Platform |
| `UserSubscriptionStatus` | TRIAL, ACTIVE, EXPIRED, CANCELLED | Shared |
| `ScreenStatus` | ONLINE, OFFLINE, MAINTENANCE | Customer |
| `ScreenPairingSessionStatus` | PENDING, CLAIMED, EXPIRED | Customer |
| `CampaignStatus` | DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, PUBLISHED, PAUSED, ENDED | Customer |
| `SubscriptionStatus` | ACTIVE, PAST_DUE, CANCELLED, TRIALING | Shared |
| `SubscriptionPlan` | FREE, PRO, ENTERPRISE | Shared |

### 1.4 Key Relationships

```
User ──┬── <1:N> WorkspaceMember ──> Workspace
       │
       ├── <1:N> AccountMember ──> <1:N> AccountMemberWorkspaceScope ──> Workspace
       │
       ├── <1:N> RefreshToken
       │
       ├── <1:N> ApiKey
       │
       ├── <1:N> Notification
       │
       ├── <1:N> NotificationPreference
       │
       ├── <1:N> OwnedPlaylistGroups
       │
       ├── <1:N> CampaignCreatedBy
       │
       └── <1:N> CampaignApprovedBy

Workspace ──┬── <1:N> WorkspaceMember ──> User
            │
            ├── <1:N> WorkspaceInvitation
            │
            ├── <1:N> Screen ──┬── <1:N> ScreenPlaylistAssignment ──> Playlist
            │                   └── <1:N> ScreenPairingSession
            │
            ├── <1:N> Playlist ──┬── <1:N> PlaylistItem ──> Media
            │                     └── <N:1> PlaylistGroup
            │
            ├── <1:N> Canvas ──<1:N> CanvasVersion
            │
            ├── <1:N> Media ──<N:1> MediaFolder
            │
            ├── <1:N> Schedule
            │
            ├── <1:N> Campaign ──<1:N> CampaignHistory
            │
            ├── <1:1> Subscription
            │
            ├── <1:1> OnboardingProgress
            │
            ├── <1:N> FeatureFlag
            │
            ├── <1:1> PrayerConfig
            │
            ├── <1:1> RamadanConfig
            │
            ├── <1:N> WebhookEndpoint ──<1:N> WebhookDeliveryLog
            │
            └── <1:N> AuditLog
```

---

## 2. Problems

### 2.1 User Model Overload

The `User` model serves both platform staff and customer users. It contains:
- **Customer fields:** `subscriptionStatus`, `subscriptionEndDate`, `businessName`, `phone`, `country`, `city`, `memberships`
- **Platform fields:** `isSuperAdmin`, `platformStaffRole`
- **Shared fields:** `email`, `passwordHash`, `fullName`, `locale`, `isActive`, `emailVerified`, `lastLoginAt`, `refreshTokenHash`

This dual-purpose model creates ambiguity. A user can be both a customer (with workspace memberships) and platform staff (with `platformStaffRole`). The `AdminService.listCustomers()` method explicitly filters out users with `isSuperAdmin` or `platformStaffRole` to separate customers from staff.

### 2.2 No PlatformSettings Entity

Platform settings (platform name, support email, maintenance mode, branding) are stored in a JSON file (`admin-runtime.store.ts`), not in the database. There is no `PlatformSettings` entity in the Prisma schema. This is a gap in the domain model.

### 2.3 Subscription vs. UserSubscription

There are two layers of subscription tracking:
- `User.subscriptionStatus` and `User.subscriptionEndDate` — user-level subscription state
- `Subscription` model — workspace-level subscription with `plan`, `screenLimit`, `storageLimitBytes`, `status`

This creates ambiguity. Is a customer's subscription status determined by the `User` fields or the `Subscription` model? The `AdminService` reads `User.subscriptionStatus`, while `SubscriptionsService` reads the `Subscription` model.

### 2.4 No Dedicated Staff Entity

Platform staff are represented as `User` records with `isSuperAdmin` or `platformStaffRole` set. There is no separate `PlatformStaff` entity. Staff management (`AdminService.createStaff()`) creates a workspace named "Admin Control" and adds staff as workspace members — a workaround that conflates customer and platform concepts.

### 2.5 AuditLog is Generic

The `AuditLog` model stores JSON data and is used for both platform-level events (impersonation, settings changes) and workspace-level events (screen creation, playlist updates). There is no separation between platform audit and customer audit at the schema level.

---

## 3. Target Architecture

### 3.1 Bounded Contexts

```
┌─────────────────────────────────────────────────────────────┐
│                  Platform Bounded Context                    │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Platform Staff  │  │ Platform Settings│                 │
│  │ (User with      │  │ (new entity)     │                 │
│  │  platformStaff  │  │                  │                 │
│  │  Role)          │  │                  │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Feature Flags   │  │ Platform Audit   │                 │
│  │ (management)    │  │ Log              │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐                                       │
│  │ Customer        │  (read-only view of customer data)    │
│  │ Oversight       │                                       │
│  └─────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
           │ Reads from / Writes to
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Shared Bounded Context                      │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ User            │  │ Auth / Tokens    │                 │
│  │ (identity)      │  │ (RefreshToken)   │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Workspace       │  │ Subscription     │                 │
│  │ (tenant)        │  │ (billing)        │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Audit Log       │  │ Payment Record   │                 │
│  └─────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
           │ Owned by
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Customer Bounded Context                    │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Screens         │  │ Playlists        │                 │
│  │ + Pairing       │  │ + Groups + Items │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Canvases        │  │ Media            │                 │
│  │ + Versions      │  │ + Folders        │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Schedules       │  │ Campaigns        │                 │
│  │                 │  │ + History        │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Onboarding      │  │ Islamic          │                 │
│  │ (progress)      │  │ (prayer/Ramadan) │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Notifications   │  │ Webhooks         │                 │
│  │ + Preferences   │  │ + Delivery Logs  │                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ API Keys        │  │ Workspace        │                 │
│  │                 │  │ Members + Invites│                 │
│  └─────────────────┘  └──────────────────┘                 │
│  ┌─────────────────┐  ┌──────────────────┐                 │
│  │ Account         │  │ Feature Flags    │                 │
│  │ Members         │  │ (consumed)       │                 │
│  └─────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 New Entities (Proposed)

#### PlatformSettings

```prisma
model PlatformSettings {
  id              String   @id @default(cuid())
  platformName    String   @default("Cloud Signage")
  supportEmail    String   @default("support@smartscreen.local")
  maintenanceMode Boolean  @default(false)
  defaultLanguage String   @default("ar")
  logoUrlEn       String   @default("")
  logoUrlAr       String   @default("")
  logoAssetEnLight String  @default("")
  logoAssetEnDark  String  @default("")
  logoAssetArLight String  @default("")
  logoAssetArDark  String  @default("")
  brandingEpoch   Int      @default(0)
  updatedAt       DateTime @updatedAt
}
```

This replaces `admin-runtime.store.ts` and moves platform settings into the database.

#### ImpersonationExchangeToken (Optional — Redis-only)

Not a Prisma entity. Stored in Redis with key `impersonation:exchange:{token}` and value `{ actorId, targetId, workspaceId }`, TTL 30 seconds. One-time use: deleted after exchange.

### 3.3 Entity Ownership Matrix

| Entity | Platform Reads | Platform Writes | Customer Reads | Customer Writes |
|---|---|---|---|---|
| `User` | ✅ (all) | ✅ (via AdminService) | ✅ (own) | ✅ (own profile) |
| `Workspace` | ✅ (all) | ✅ (via AdminService) | ✅ (own) | ✅ (own) |
| `WorkspaceMember` | ✅ (all) | ❌ | ✅ (own workspaces) | ✅ (own workspaces) |
| `Screen` | ✅ (all, read-only) | ❌ | ✅ (own workspace) | ✅ (own workspace) |
| `Playlist` | ❌ | ❌ | ✅ | ✅ |
| `Canvas` | ❌ | ❌ | ✅ | ✅ |
| `Media` | ✅ (aggregation only) | ❌ | ✅ | ✅ |
| `Schedule` | ❌ | ❌ | ✅ | ✅ |
| `Campaign` | ❌ | ❌ | ✅ | ✅ |
| `Subscription` | ✅ (all) | ✅ (mock only) | ✅ (own) | ✅ (Stripe checkout) |
| `PaymentRecord` | ✅ (all) | ❌ | ✅ (own) | ❌ |
| `FeatureFlag` | ✅ (all) | ✅ (all) | ✅ (own workspace) | ❌ |
| `AuditLog` | ✅ (all) | ✅ (platform events) | ✅ (own workspace) | ✅ (workspace events) |
| `ApiKey` | ❌ | ❌ | ✅ | ✅ |
| `WebhookEndpoint` | ❌ | ❌ | ✅ | ✅ |
| `OnboardingProgress` | ❌ | ❌ | ✅ | ✅ |
| `PrayerConfig` | ❌ | ❌ | ✅ | ✅ |
| `RamadanConfig` | ❌ | ❌ | ✅ | ✅ |
| `Notification` | ❌ | ❌ | ✅ | ✅ |
| `RefreshToken` | ✅ (revoke all) | ✅ (revoke) | ✅ (own) | ✅ (own) |
| `PlatformSettings` (new) | ✅ | ✅ | ✅ (public branding) | ❌ |
| `AccountMember` | ❌ | ❌ | ✅ | ✅ |

### 3.4 Aggregate Roots

| Aggregate Root | Entities in Aggregate | Access Pattern |
|---|---|---|
| `User` | `RefreshToken`, `Notification`, `NotificationPreference`, `ApiKey` | By user ID |
| `Workspace` | `WorkspaceMember`, `WorkspaceInvitation`, `Screen`, `Playlist`, `Canvas`, `Media`, `MediaFolder`, `Schedule`, `Campaign`, `Subscription`, `OnboardingProgress`, `FeatureFlag`, `PrayerConfig`, `RamadanConfig`, `WebhookEndpoint`, `AuditLog` | By workspace ID |
| `AccountMember` | `AccountMemberWorkspaceScope` | By owner ID + user ID |
| `PlatformSettings` | (singleton) | By ID (single row) |

### 3.5 Domain Events (Implicit)

The system does not use an explicit event bus, but the following implicit domain events exist:

| Event | Trigger | Consumer |
|---|---|---|
| `IMPERSONATION_START` | `AdminService.impersonateUser()` | AuditLog |
| `IMPERSONATION_END` | `AuthService.exitImpersonation()` | AuditLog |
| Screen heartbeat | `RealtimeGateway` WebSocket | ScreenHeartbeatService |
| Pairing session claimed | `PairingService.claimSession()` | Screen (via WebSocket) |
| Stripe webhook received | `WebhooksController` | SubscriptionsService |
| Feature flag changed | `FeatureFlagsService.setFlag()` | Customer Dashboard (on next read) |
| Campaign state transition | `CampaignsService` | CampaignHistory |

---

## 4. Recommended Solution

### 4.1 Add PlatformSettings Entity

Create a `PlatformSettings` model in the Prisma schema. Migrate data from `admin-runtime.json` to the database. Replace `admin-runtime.store.ts` with a `PlatformSettingsService` that reads from Prisma.

### 4.2 Document the User Model as Shared

Explicitly document that the `User` model is a shared entity serving both platform staff and customer users. The distinction is enforced at the service/guard level, not at the schema level. Add a comment to the Prisma schema.

### 4.3 Formalize Subscription Relationship

Document the relationship between `User.subscriptionStatus` and `Subscription` model:
- `User.subscriptionStatus` is the user-level billing status (legacy, used by AdminService)
- `Subscription` is the workspace-level plan (used by SubscriptionsService and Stripe)
- In the future, consider deprecating `User.subscriptionStatus` in favor of deriving it from the user's workspace subscriptions.

### 4.4 Separate Audit Log Types

Add a `scope` field to `AuditLog` (or use the existing `action` field) to distinguish:
- `PLATFORM` — impersonation, settings changes, staff management
- `WORKSPACE` — screen/playlist/media operations

This allows the Control Panel to query platform audit logs and the Customer Dashboard to query workspace audit logs without filtering through irrelevant entries.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| PlatformSettings migration loses data | High | Write migration script with dry-run. Backup JSON file. |
| User model remains overloaded | Medium | Document explicitly. Consider a `PlatformStaff` view (not a separate table) in the future. |
| Subscription duality causes billing errors | Medium | Document the relationship. Ensure AdminService and SubscriptionsService are consistent. |
| Audit log scope not enforced | Low | Add scope field. Filter in service layer. |

---

## 6. Alternatives

### 6.1 Split User into PlatformStaff and CustomerUser

Create two separate tables for platform staff and customer users.

**Pros:** Clean separation, no role ambiguity.
**Cons:** Shared auth flow becomes complex (which table to check?), impersonation requires cross-table references, significant migration effort.

**Verdict:** Rejected. The shared `User` model with role fields is a common SaaS pattern. The separation is enforced at the guard/service level, which is sufficient.

### 6.2 Event Sourcing for Audit Log

Replace the current `AuditLog` model with an event-sourced audit log using event types and payloads.

**Pros:** Complete audit trail, replay capability.
**Cons:** Overkill for current needs, adds complexity.

**Verdict:** Rejected. The current append-only `AuditLog` is sufficient. Adding a `scope` field is enough.

---

## 7. Migration Notes

- **No schema changes required** for Phase 1–2 (frontend separation, API partitioning).
- **Phase 4:** Add `PlatformSettings` table. Write migration script. Update `AdminService` to use Prisma instead of file system.
- **Future:** Consider adding `scope` field to `AuditLog`.
- **Future:** Consider deprecating `User.subscriptionStatus` in favor of `Subscription` model.

---

## 8. Open Questions

1. **Should `PlatformSettings` be a singleton (one row) or support multiple environments?** Currently, the JSON file is per-environment. A database table could support per-environment settings with an `environment` field.
2. **Should the "Admin Control" workspace pattern be formalized** as a `PlatformStaff` entity, or should it be deprecated?
3. **Should `AccountMember` be visible to the Control Panel?** Currently, it's customer-only.
4. **Should `PaymentRecord` have a relationship to `Subscription`?** Currently, it seems standalone.
5. **Should the `Subscription` model include a `userId` field** to clarify the relationship with `User.subscriptionStatus`?

---

## 9. Final Recommendation

Keep the domain model largely as-is. The existing Prisma schema is well-designed for a SaaS platform. The only required addition is the `PlatformSettings` entity to replace the file-based settings store.

Document the `User` model as a shared entity with role-based access patterns. Do not split it into separate platform/customer tables. The two-hierarchy RBAC model (`PlatformStaffRole` + `UserRole`) provides sufficient separation.

The bounded context map (Section 3.1) should be the authoritative reference for all future development. New entities must be assigned to a bounded context, and cross-context references must go through service interfaces, not direct Prisma access.
