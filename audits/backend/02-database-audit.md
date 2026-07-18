# 02 — Database & Schema Audit

> **Objective:** Evaluate the Prisma schema, data models, relations, indexes, migrations, and data integrity strategies.

---

## 1. Current State

The database layer uses **Prisma 7.x** with `@prisma/adapter-pg` driver adapter for PostgreSQL 16. The schema is defined in `apps/backend/prisma/schema.prisma` (1,581 lines) with **30 models** and **14 enums**.

### PrismaService Configuration
- Extends `PrismaClient` with `OnModuleInit` / `OnModuleDestroy`
- Uses `PrismaPg` adapter from `@prisma/adapter-pg`
- Connection string from `DATABASE_URL` env var
- Logs connection status on init
- No connection pooling configuration (relies on adapter default)
- No query logging in production

### Migration Setup
- Prisma migrations in `apps/backend/prisma/migrations/`
- `prisma:migrate` script uses `prisma migrate deploy`
- Seed script in `prisma/seed.ts` with production safeguard
- Seed creates demo users, workspaces, media, screens, playlists

---

## 2. What Exists

### Enums (14 total)
| Enum | Values | Used By |
|------|--------|---------|
| `UserRole` | OWNER, ADMIN, EDITOR, VIEWER | WorkspaceMember, AccountMember, AccountMemberWorkspaceScope |
| `PlatformStaffRole` | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER | User |
| `ScreenStatus` | ONLINE, OFFLINE, PENDING | Screen |
| `CanvasType` | WIDGET, IMAGE, VIDEO, URL, HTML | Canvas |
| `SubscriptionPlan` | FREE, STARTER, PRO, ENTERPRISE | Subscription |
| `SubscriptionStatus` | TRIALING, ACTIVE, PAST_DUE, CANCELED, EXPIRED | Subscription |
| `PlayerPlatform` | WEB, ANDROID, RPI, WINDOWS, LG_WEBOS, SAMSUNG_TIZEN | Screen |
| `CampaignStatus` | DRAFT, PENDING_APPROVAL, APPROVED, PUBLISHED, PAUSED, ENDED, REJECTED | Campaign |
| `UserSubscriptionStatus` | ACTIVE, TRIALING, EXPIRED, CANCELED | User |
| `ScreenPairingSessionStatus` | PENDING, CLAIMED, EXPIRED | ScreenPairingSession |

### Models (30 total)

#### Identity & Access
- **User** — Core user model with email, password hash, 2FA, email verification, password reset, notification preferences, platform staff role, subscription status, business info
- **Workspace** — Tenant workspace with `isPaused` flag, `slug`, Stripe customer ID
- **WorkspaceMember** — Join table with `UserRole` (OWNER/ADMIN/EDITOR/VIEWER)
- **WorkspaceInvitation** — Email-based invites with token, expiry, role
- **AccountMember** — Account-level membership (cross-workspace access)
- **AccountMemberWorkspaceScope** — Per-workspace role override for account members
- **RefreshToken** — Per-session refresh token storage with `sessionId`, `tokenHash`, `expiresAt`
- **LoginLockout** — Per-email brute-force lockout with `failedCount`, `windowStartAt`, `lockedUntil`

#### Content & Media
- **Canvas** — Creative Studio design with `layoutData` (JSON), `type`, dimensions, `contentUrl`
- **CanvasVersion** — Version history snapshots with `layoutData`, `name`, dimensions, `savedById`
- **Media** — Uploaded files with `mimeType`, `sizeBytes`, `relativePath`, `folderId`, `expiresAt`
- **MediaFolder** — Folder organization with `ownerId`, `workspaceId`, unique name per owner
- **Playlist** — Content playlists with `isPublished`, `groupId`, workspace association
- **PlaylistItem** — Items within playlists (media, canvas, or nested playlist), `orderIndex`, `durationSec`, `zoneName`
- **PlaylistGroup** — Hierarchical playlist grouping with `parentGroupId`

#### Screens & Playback
- **Screen** — Player screens with `serialNumber`, `status`, `pairingSecretHash`, `playerTicker`, `orientation`, `resolutionWidth/Height`, `isOfflineCacheMode`, `playlistGroupId`, `activePlaylistId`, `overridePlaylistId`
- **ScreenPlaylistAssignment** — Multiple playlists per screen with `orderIndex` for rotation
- **ScreenOverrideRule** — Advanced override with recurrence (ONCE/DAILY/WEEKLY/MONTHLY), date/time windows
- **ScreenPairingSession** — Pairing v2 with `pairingCode`, `pollSecret`, `pairingSecret`, `status`, `expiresAt`
- **PairingClaimLockout** — Per-user+IP lockout for pairing claim attempts

#### Scheduling & Campaigns
- **Schedule** — Weekly/monthly scheduling with `daysOfWeek`, `daysOfMonth`, `recurrence`, `startTime/endTime`, `startDate/endDate`, `priority`, `enabled`
- **Campaign** — Promotional campaigns with approval workflow (DRAFT → PENDING → APPROVED → PUBLISHED → PAUSED → ENDED)
- **CampaignHistory** — Immutable audit trail of campaign state changes

#### Billing & Admin
- **Subscription** — Per-workspace subscription with `plan`, `status`, `seats`, `screenLimit`, `storageLimitBytes` (BigInt), Stripe IDs
- **PaymentRecord** — Payment history (referenced in schema, fields for amount, currency, invoice)
- **ProcessedWebhookEvent** — Idempotent webhook processing with `provider` + `externalId` unique
- **AuditLog** — Cross-tenant audit trail with `action`, `adminName`, `targetCustomer`, `ipAddress`, `workspaceId`, `userId`, `metadata`
- **ApiKey** — Workspace API keys with SHA-256 `keyHash`, `keyPrefix`, `scopes`, `revokedAt`
- **WebhookEndpoint** — Customer webhook endpoints with `url`, `events`, `secret`, `enabled`
- **OnboardingProgress** — Per-workspace onboarding with `completedSteps` (JSON), `dismissed`, `completedAt`
- **FeatureFlag** — Per-workspace module toggles with `module` key and `enabled` flag

#### Islamic Features
- **PrayerConfig** — Per-workspace prayer settings (method, asr juristic, lat/lng, city, buffers, enabled prayers, auto-pause)
- **RamadanConfig** — Per-workspace Ramadan mode (enabled, iftar/suhoor playlists, buffers, Hijri date, prayer times display, start/end dates)

#### Deprecated
- **WorkspacePairingCode** — Legacy pairing codes, marked deprecated, no code references

### Indexes
The schema includes indexes on:
- `User`: email (unique), isSuperAdmin, platformStaffRole
- `Screen`: workspaceId, serialNumber (unique), status, playlistGroupId
- `Media`: ownerId+createdAt, ownerId+folderId+createdAt, workspaceId+createdAt
- `Playlist`: ownerId+updatedAt, workspaceId
- `PlaylistItem`: mediaId, canvasId, nestedPlaylistId, unique(playlistId+orderIndex)
- `Schedule`: workspaceId, screenId, playlistId
- `AuditLog`: createdAt, workspaceId+createdAt
- `Notification`: userId+read+createdAt, userId+createdAt
- `ApiKey`: workspaceId+revokedAt
- `WebhookEndpoint`: workspaceId+enabled
- `RefreshToken`: unique(userId+sessionId), userId+expiresAt
- `LoginLockout`: email (unique), lockedUntil
- `ScreenPairingSession`: workspaceId, status, expiresAt
- `PairingClaimLockout`: unique(userId+ip), lockedUntil
- `Campaign`: workspaceId, status
- `CampaignHistory`: campaignId
- `CanvasVersion`: canvasId+createdAt(desc)

### Relations
- Cascade deletes: Workspace → WorkspaceMember, Screen, Schedule, Subscription, etc.
- `onDelete: Restrict` on Canvas.createdBy and CanvasVersion.savedBy (prevents deleting users with content)
- `onDelete: SetNull` on Media.workspace, Playlist.workspace, Screen.overridePlaylist
- Self-referential: PlaylistGroup (parent/children), PlaylistItem (nested playlists)

---

## 3. What Is Missing

1. **No soft deletes** — All deletes are hard deletes. No `deletedAt` column on any model. Accidental deletes are irreversible.
2. **No database-level constraints for multi-tenancy** — Tenancy is enforced in application code, not at the database level. No Row-Level Security (RLS) policies.
3. **No audit triggers** — Audit logs are written by application code only. No database triggers for automatic audit on sensitive tables.
4. **No `updatedAt` on several models** — `Screen`, `Canvas` have `updatedAt` but `WorkspacePairingSession`, `ProcessedWebhookEvent`, `CampaignHistory` don't.
5. **No full-text search indexes** — No PostgreSQL `tsvector` or `GIN` indexes for searching media, playlists, or screens by name.
6. **No JSON validation** — `Canvas.layoutData`, `OnboardingProgress.completedSteps`, `AuditLog.metadata`, `PrayerConfig.enabledPrayers` are `Json` fields with no schema validation at the database level.
7. **No database connection pool tuning** — PrismaService uses default pool size. No `connection_limit` or `pool_timeout` in connection string.
8. **No migration rollback support** — Prisma `migrate deploy` doesn't support rollback. No down migrations.
9. **No enum constraints on `recurrence` field** — `Schedule.recurrence` and `ScreenOverrideRule.recurrence` are `String` not enums. Values "WEEKLY"/"MONTHLY"/"ONCE"/"DAILY" are enforced in code only.
10. **No `PlaylistItem` constraint for exactly-one-of** — Schema comment says "exactly one of mediaId, canvasId, or nestedPlaylistId must be set" but no DB constraint enforces this.

---

## 4. Problems

1. **Deprecated `WorkspacePairingCode` model still in schema** — Adds confusion. No code references it. Should be removed in next migration.

2. **`PaymentRecord` model is partially defined** — Referenced in User relations but not fully utilized. The Stripe webhook service writes to `Subscription` and `ProcessedWebhookEvent` but doesn't create `PaymentRecord` rows.

3. **`Schedule.recurrence` as String instead of enum** — Type safety lost. A typo in code could write an invalid value.

4. **`ScreenOverrideRule.recurrence` as String instead of enum** — Same issue as Schedule.

5. **No `Workspace.slug` uniqueness** — `slug` field exists on Workspace but is not marked `@unique`. Could lead to duplicate slugs.

6. **`Media.workspaceId` is nullable** — Media can exist without a workspace. This complicates access control and cleanup.

7. **`Playlist.workspaceId` is nullable** — Same issue as Media. Playlists can exist without workspace association.

8. **BigInt for `storageLimitBytes` but no BigInt for `PaymentRecord.amount`** — Inconsistent large-number handling.

9. **No `@map` for snake_case table names** — Prisma uses PascalCase model names that map to PascalCase tables. Convention is typically snake_case in PostgreSQL.

---

## 5. Risks

- **High: No soft deletes** — Accidental data loss is irreversible. A `DELETE /screens/:id` permanently removes the record.
- **High: No DB-level tenancy isolation** — A bug in application code could leak data across tenants. RLS policies would provide defense-in-depth.
- **Medium: No migration rollback** — A failed migration deployment cannot be rolled back without manual SQL.
- **Medium: JSON fields without validation** — Corrupted JSON in `layoutData` could crash the player or studio.
- **Low: Deprecated models** — `WorkspacePairingCode` adds maintenance overhead and confusion.

---

## 6. Priority: **High**

Database schema is well-designed but needs soft deletes, DB-level constraints, and cleanup.

---

## 7. Completion Percentage: **80%**

Schema covers all product domains with proper relations and indexes. Missing: soft deletes, DB constraints, JSON validation, enum types for recurrence fields.

---

## 8. Recommendations

1. Add `deletedAt DateTime?` to all content models (Screen, Playlist, Media, Canvas, Campaign) for soft deletes
2. Add `@unique` to `Workspace.slug`
3. Convert `Schedule.recurrence` and `ScreenOverrideRule.recurrence` to Prisma enums
4. Remove `WorkspacePairingCode` model in next migration
5. Add PostgreSQL CHECK constraint for `PlaylistItem` exactly-one-of (mediaId, canvasId, nestedPlaylistId)
6. Add connection pool tuning to `DATABASE_URL` (`connection_limit=10`, `pool_timeout=30`)
7. Consider PostgreSQL RLS policies for multi-tenant isolation
8. Add `PaymentRecord` creation in Stripe webhook handler
9. Add `@updatedAt` to models missing it
10. Consider JSON schema validation for `Canvas.layoutData` using PostgreSQL `CHECK` with `jsonb_typeof`

---

## 9. Future Tasks

- [ ] Add soft deletes to content models
- [ ] Convert recurrence String fields to enums
- [ ] Remove deprecated WorkspacePairingCode model
- [ ] Add DB-level CHECK constraints for PlaylistItem
- [ ] Add `@unique` to Workspace.slug
- [ ] Add connection pool tuning
- [ ] Implement PaymentRecord creation in webhook handler
- [ ] Add PostgreSQL RLS policies for tenancy isolation
- [ ] Add full-text search indexes (tsvector + GIN)
- [ ] Add migration rollback strategy
