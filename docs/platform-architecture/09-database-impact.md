# 09 — Database Impact

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Schema changes, migrations, and data model impacts from the platform-customer separation

---

## 1. Current State

### 1.1 Database Technology

- **Engine:** PostgreSQL (via Prisma ORM)
- **Schema file:** `apps/backend/prisma/schema.prisma` (1626 lines)
- **Migration directory:** `apps/backend/prisma/migrations/`
- **Connection:** Single `PrismaService` shared across all modules

### 1.2 Schema Size

| Category | Count |
|---|---|
| Models | 30+ |
| Enums | 7 |
| Relations | 60+ |
| Indexes | 40+ |

### 1.3 Current Schema Highlights

The schema is well-structured with:
- Consistent `cuid()` IDs
- `createdAt`/`updatedAt` timestamps on all models
- Soft delete patterns (e.g., `deletedAt` on some models)
- Composite unique constraints (e.g., `workspaceId_userId` on `WorkspaceMember`)
- JSON fields for flexible data (e.g., `AuditLog.data`, `FeatureFlag.value`)

---

## 2. Problems

### 2.1 Platform Settings in File System

`admin-runtime.store.ts` stores platform settings in `.data/admin-runtime.json`:
- Not in the database
- Not shared across backend instances
- No transactional safety
- No audit trail
- Race condition on concurrent writes

### 2.2 User Model Dual Purpose

The `User` model serves both platform staff and customer users. Key fields:

```prisma
model User {
  // Shared identity
  id                String   @id @default(cuid())
  email             String   @unique
  passwordHash      String
  fullName          String?
  locale            String   @default("ar")
  isActive          Boolean  @default(true)
  emailVerified     Boolean  @default(false)
  lastLoginAt       DateTime?

  // Customer-specific
  businessName      String?
  phone             String?
  country           String?
  city              String?
  subscriptionStatus UserSubscriptionStatus @default(TRIAL)
  subscriptionEndDate DateTime?

  // Platform-specific
  isSuperAdmin      Boolean  @default(false)
  platformStaffRole PlatformStaffRole?

  // Relations (both domains)
  memberships       WorkspaceMember[]
  ownedPlaylistGroups PlaylistGroup[]
  refreshTokens     RefreshToken[]
  apiKeys           ApiKey[]
  notifications     Notification[]
  notificationPreferences NotificationPreference[]
  campaignsCreated  Campaign[]
  campaignsApproved Campaign[]
}
```

This is not a schema problem per se — it's a common SaaS pattern. But it means the schema cannot enforce that platform staff don't have customer fields or vice versa.

### 2.3 No Audit Log Scope

The `AuditLog` model does not have a `scope` or `type` field to distinguish platform events from customer events:

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  workspaceId  String?  // null for platform events
  actorId      String?
  action       String
  data         Json?
  ipAddress    String?
  createdAt    DateTime @default(now())
}
```

Currently, platform events have `workspaceId = null` and customer events have `workspaceId` set. This implicit distinction works but is not enforced.

### 2.4 No Impersonation Session Tracking

There is no database entity for impersonation sessions. The `impersonatedBy` claim is stored in the JWT but not in the database. This means:
- No queryable record of who is currently impersonating whom
- No way to force-end all impersonation sessions
- No audit trail of impersonation duration (only start/end events in AuditLog)

---

## 3. Target Architecture

### 3.1 New Models

#### PlatformSettings

```prisma
model PlatformSettings {
  id                String   @id @default(cuid())
  platformName      String   @default("Cloud Signage")
  supportEmail      String   @default("support@smartscreen.local")
  maintenanceMode   Boolean  @default(false)
  defaultLanguage   String   @default("ar")
  logoUrlEn         String   @default("")
  logoUrlAr         String   @default("")
  logoAssetEnLight  String   @default("")
  logoAssetEnDark   String   @default("")
  logoAssetArLight  String   @default("")
  logoAssetArDark   String   @default("")
  brandingEpoch     Int      @default(0)
  updatedAt         DateTime @updatedAt
}
```

**Migration:** Read `.data/admin-runtime.json`, create a single row in `PlatformSettings` with the values. Delete the JSON file after migration.

**Usage:** Replace `getAdminSettings()` and `updateAdminSettings()` in `admin-runtime.store.ts` with a `PlatformSettingsService` that reads/writes via Prisma.

#### ImpersonationSession (Optional)

```prisma
model ImpersonationSession {
  id           String   @id @default(cuid())
  actorId      String   // super admin user ID
  targetId     String   // impersonated user ID
  startedAt    DateTime @default(now())
  endedAt      DateTime?
  revokedAt    DateTime? // if force-ended
  refreshToken String   // hash of the issued refresh token

  actor        User     @relation("ImpersonationActor", fields: [actorId], references: [id])
  target       User     @relation("ImpersonationTarget", fields: [targetId], references: [id])

  @@index([actorId])
  @@index([targetId])
  @@index([startedAt])
}
```

**Purpose:** Track active and historical impersonation sessions. Allows:
- Querying who is currently impersonating
- Force-ending all impersonation sessions
- Audit trail with duration

**Note:** This is optional. The current JWT-based approach works, but a database record provides better visibility and control.

### 3.2 Modified Models

#### AuditLog — Add Scope Field

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  workspaceId  String?
  actorId      String?
  action       String
  scope        String   @default("WORKSPACE") // "PLATFORM" | "WORKSPACE"
  data         Json?
  ipAddress    String?
  createdAt    DateTime @default(now())

  @@index([workspaceId, createdAt])
  @@index([scope, createdAt])
}
```

**Migration:** Add `scope` column with default `"WORKSPACE"`. Update existing rows with `workspaceId = null` to `scope = "PLATFORM"`.

#### User — Add Audience Field (Optional)

No schema change needed. The `audience` claim is in the JWT, not in the database. The `isSuperAdmin` and `platformStaffRole` fields already determine the user type.

### 3.3 No Changes Required

The following models require **no changes**:

- `Workspace`, `WorkspaceMember`, `WorkspaceInvitation`
- `AccountMember`, `AccountMemberWorkspaceScope`
- `Screen`, `ScreenPairingSession`, `ScreenPlaylistAssignment`
- `Playlist`, `PlaylistGroup`, `PlaylistItem`
- `Canvas`, `CanvasVersion`
- `Media`, `MediaFolder`
- `Schedule`
- `Campaign`, `CampaignHistory`
- `Subscription`, `PaymentRecord`
- `RefreshToken`
- `ApiKey`
- `WebhookEndpoint`, `WebhookDeliveryLog`
- `OnboardingProgress`, `FeatureFlag`
- `PrayerConfig`, `RamadanConfig`
- `Notification`, `NotificationPreference`

### 3.4 Migration Summary

| Migration | Type | Risk | Phase |
|---|---|---|---|
| Add `PlatformSettings` table | New table | Low | Phase 4 |
| Migrate `admin-runtime.json` → `PlatformSettings` | Data migration | Medium | Phase 4 |
| Add `scope` field to `AuditLog` | Add column with default | Low | Phase 4 (optional) |
| Add `ImpersonationSession` table | New table | Low | Future (optional) |

---

## 4. Recommended Solution

### 4.1 Phase 4: PlatformSettings Migration

1. Add `PlatformSettings` model to `schema.prisma`
2. Run `npx prisma migrate dev --name add_platform_settings`
3. Write a migration script:
   ```typescript
   // scripts/migrate-admin-runtime.ts
   import { readAdminRuntime } from '../apps/backend/src/domains/admin/admin-runtime.store';
   import { PrismaClient } from '@prisma/client';

   async function main() {
     const prisma = new PrismaClient();
     const settings = await readAdminRuntime();

     await prisma.platformSettings.upsert({
       where: { id: 'singleton' },
       create: { id: 'singleton', ...settings },
       update: { ...settings },
     });

     console.log('Platform settings migrated to database');
   }
   ```
4. Update `AdminService` to use `PrismaService` instead of `admin-runtime.store.ts`
5. Update `BrandingController` to read from `PrismaService`
6. Remove `admin-runtime.store.ts`

### 4.2 Phase 4 (Optional): AuditLog Scope

1. Add `scope` field to `AuditLog` model
2. Run migration
3. Update `AuditLogService.append()` to accept a `scope` parameter
4. Update `AdminService.listLogs()` to filter by `scope: 'PLATFORM'`
5. Update customer audit log queries to filter by `scope: 'WORKSPACE'`

### 4.3 Future: ImpersonationSession

1. Add `ImpersonationSession` model
2. Update `AuthService.issueImpersonation()` to create a session record
3. Update `AuthService.exitImpersonation()` to set `endedAt`
4. Add admin endpoint to list/revoke active sessions

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Platform settings lost during migration | High | Backup JSON file before migration. Dry-run mode. Verify row count after migration. |
| Multi-instance backend reads stale settings from file | High | Migrate to database before scaling to multiple instances. |
| AuditLog scope migration fails | Low | Add column with default value. Non-breaking. |
| ImpersonationSession table adds write overhead | Low | Only written on impersonation start/end (rare event). |
| Prisma migration conflicts with existing migrations | Medium | Run `prisma migrate dev` in a clean environment. Test on staging first. |

---

## 6. Alternatives

### 6.1 Keep Platform Settings in File

Use a shared volume (e.g., NFS, EFS) for `.data/admin-runtime.json` across instances.

**Pros:** No schema change.
**Cons:** Still not transactional, no audit trail, adds infrastructure complexity.

**Verdict:** Rejected. Database is the correct place for persistent settings.

### 6.2 Use Redis for Platform Settings

Store platform settings in Redis with persistence.

**Pros:** Fast reads, no schema change.
**Cons:** Not relational, no foreign keys, Redis persistence is less reliable than PostgreSQL.

**Verdict:** Rejected. PostgreSQL is already the system of record. Adding Redis for settings adds unnecessary complexity.

### 6.3 Split User Table

Create separate `PlatformStaff` and `CustomerUser` tables.

**Pros:** Clean separation at schema level.
**Cons:** Shared auth flow becomes complex. Impersonation requires cross-table references. Significant migration effort.

**Verdict:** Rejected. The shared `User` model with role fields is sufficient and is a common SaaS pattern.

---

## 7. Migration Notes

- **Phase 1–3:** No schema changes required. The separation is purely frontend and guard-level.
- **Phase 4:** Add `PlatformSettings` table. Migrate data from file. This is the only required schema change.
- **Future:** Add `scope` to `AuditLog` and optionally `ImpersonationSession` table.
- **All migrations are additive** (new tables, new columns with defaults). No breaking changes to existing data.

### Migration Script Checklist

- [ ] Add `PlatformSettings` model to `schema.prisma`
- [ ] Run `prisma migrate dev --name add_platform_settings`
- [ ] Write `scripts/migrate-admin-runtime.ts`
- [ ] Test migration on staging with real `admin-runtime.json`
- [ ] Update `AdminService.getSettings()` to use Prisma
- [ ] Update `AdminService.updateSettings()` to use Prisma
- [ ] Update `BrandingController.getBranding()` to use Prisma
- [ ] Update `BrandingController.getFile()` to use Prisma (for asset filenames)
- [ ] Remove `admin-runtime.store.ts`
- [ ] Remove `.data/admin-runtime.json` (after verifying migration)
- [ ] Update `AdminModule` to remove `admin-runtime.store.ts` imports

---

## 8. Open Questions

1. **Should `PlatformSettings` support per-environment values?** (e.g., different settings for staging vs. production)
2. **Should the `ImpersonationSession` model track the exchange token?** Or just the session metadata?
3. **Should `AuditLog.scope` be an enum or a string?** Enum is safer but less flexible.
4. **Should the `User` model have a `type` field** (`CUSTOMER` | `PLATFORM_STAFF`) to make the distinction explicit at the schema level?
5. **Should `Subscription` have a `userId` foreign key** to clarify its relationship with `User.subscriptionStatus`?

---

## 9. Final Recommendation

The database impact of the platform-customer separation is minimal. The only required schema change is adding the `PlatformSettings` table in Phase 4. All other changes are at the application level (guards, services, frontend).

The existing schema is well-designed and does not need restructuring. The `User` model's dual purpose is a common SaaS pattern that works well with role-based guards. Splitting it into separate tables would add complexity without meaningful benefit.

The optional `ImpersonationSession` table and `AuditLog.scope` field are nice-to-haves that improve observability and control but are not required for the separation.

**Total schema changes: 1 new table (PlatformSettings), 0 modified tables (required), 1 optional column addition (AuditLog.scope).**
