# Audit 02: Prisma Schema & Database Design

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Prisma schema, database models, relations, indexes, migrations

---

## 1. Schema Overview

**File:** `apps/backend/prisma/schema.prisma` (1175 lines)  
**Database:** PostgreSQL 16  
**Models:** 22 models + 11 enums

### Models

| Model | Purpose | Relations |
|-------|---------|-----------|
| User | Platform user | memberships, sentInvitations, createdCanvases, payments, pairingClaimLockout, refreshTokens |
| PaymentRecord | Payment history | User |
| Workspace | Tenant workspace | 14 relations |
| WorkspaceMember | Membership junction | Workspace, User |
| WorkspaceInvitation | Pending invites | Workspace, User (invitedBy) |
| Screen | Display screen | Workspace, Playlist (active/override/group), Schedule, ScreenPairingSession |
| ScreenPairingSession | 6-digit pairing flow | Workspace?, Screen? |
| PairingClaimLockout | Brute-force protection | User |
| RefreshToken | Per-session refresh tokens | User |
| ProcessedWebhookEvent | Idempotency for webhooks | — |
| Canvas | Creative studio design | Workspace, User, PlaylistItem |
| Media | Uploaded media file | Workspace, MediaFolder, PlaylistItem |
| MediaFolder | Media organization | Workspace, Media |
| WorkspacePairingCode | **Deprecated** legacy pairing | Workspace |
| Playlist | Content playlist | Workspace, PlaylistItem, Screen (4 relations), Schedule |
| PlaylistItem | Playlist content item | Playlist, Media?, Canvas? |
| Schedule | Time-based scheduling | Workspace, Screen?, Playlist |
| Subscription | Billing subscription | Workspace |
| AuditLog | Cross-tenant audit trail | — |
| LoginLockout | Sign-in brute-force protection | — |
| Notification | In-app notifications | — |
| ApiKey | API keys | Workspace |
| WebhookEndpoint | Webhook endpoints | Workspace |
| OnboardingProgress | Onboarding state | Workspace |
| FeatureFlag | Module enablement | Workspace |
| PrayerConfig | Islamic prayer config | Workspace |
| RamadanConfig | Ramadan mode config | Workspace |

### Enums

| Enum | Values |
|------|--------|
| UserRole | OWNER, ADMIN, EDITOR, VIEWER |
| InvitationStatus | PENDING, ACCEPTED, EXPIRED, CANCELLED |
| PlatformStaffRole | SUPER_ADMIN, SUPPORT_SPECIALIST, BILLING_MANAGER |
| ScreenStatus | ONLINE, OFFLINE, MAINTENANCE |
| ScreenOrientation | AUTO, LANDSCAPE, PORTRAIT |
| CanvasType | IMAGE, VIDEO, URL, WIDGET |
| SubscriptionPlan | FREE, STARTER, PRO, ENTERPRISE |
| SubscriptionStatus | TRIALING, ACTIVE, PAST_DUE, CANCELED |
| PlayerPlatform | ANDROID, TIZEN, WEBOS, WEB |
| ScreenPairingSessionStatus | PENDING, COMPLETE, EXPIRED, CANCELLED |
| UserSubscriptionStatus | ACTIVE, EXPIRED, TRIAL |

---

## 2. Index Analysis

### Properly Indexed ✅

| Model | Indexes |
|-------|---------|
| PaymentRecord | `@@index([userId, createdAt])` |
| WorkspaceInvitation | `@@index([workspaceId, email])`, `@@index([email])` |
| Screen | `@@index([workspaceId, playlistGroupId])` |
| ScreenPairingSession | `@@index([status, expiresAt])`, `@@index([workspaceId, status])` |
| PairingClaimLockout | `@@index([ip, lockedUntil])`, `@@index([lockedUntil])` |
| RefreshToken | `@@index([userId, expiresAt])` |
| Media | `@@index([workspaceId, createdAt])`, `@@index([workspaceId, folderId, createdAt])` |
| MediaFolder | `@@unique([workspaceId, name])`, `@@index([workspaceId, createdAt])` |
| WorkspacePairingCode | `@@unique([workspaceId, code])`, `@@index([workspaceId, isActive, createdAt])` |
| PlaylistItem | `@@unique([playlistId, orderIndex])`, `@@index([mediaId])`, `@@index([canvasId])` |
| Schedule | `@@index([workspaceId])`, `@@index([screenId])`, `@@index([playlistId])` |
| AuditLog | `@@index([createdAt])`, `@@index([workspaceId, createdAt])` |
| LoginLockout | `@@index([lockedUntil])` |
| Notification | `@@index([userId, read, createdAt])`, `@@index([userId, createdAt])` |
| ApiKey | `@@index([workspaceId, revokedAt])` |
| WebhookEndpoint | `@@index([workspaceId, enabled])` |
| FeatureFlag | `@@unique([workspaceId, module])`, `@@index([workspaceId, enabled])` |

### Missing Indexes ⚠️

1. **PrayerConfig**: No index beyond `@unique` on `workspaceId` — acceptable (1:1 relation).
2. **RamadanConfig**: Same as above — acceptable.
3. **OnboardingProgress**: No index beyond `@unique` on `workspaceId` — acceptable.

---

## 3. Relation Design

### Cascade Deletes ✅

All child models properly use `onDelete: Cascade` where appropriate:
- Workspace → all children cascade ✅
- User → WorkspaceMember, PaymentRecord, RefreshToken cascade ✅
- Playlist → PlaylistItem cascade ✅

### SetNull on Delete ✅

- Screen.activePlaylist → `onDelete: SetNull` ✅ (screen survives playlist deletion)
- Screen.overridePlaylist → `onDelete: SetNull` ✅
- Screen.playlistGroup → `onDelete: SetNull` ✅
- ScreenPairingSession.workspace → `onDelete: SetNull` ✅
- ScreenPairingSession.screen → `onDelete: SetNull` ✅
- Media.folder → `onDelete: SetNull` ✅

### Restrict on Delete ✅

- Canvas.createdBy → `onDelete: Restrict` ✅ (can't delete user who created canvases)
- PlaylistItem.canvas → `onDelete: Restrict` ✅ (can't delete canvas used in playlists)

---

## 4. Data Type Analysis

### Properly Typed ✅

- `Subscription.storageLimitBytes` uses `BigInt?` — correct for multi-GB values that overflow Int ✅
- `Schedule.daysOfWeek` uses `Int[]` — PostgreSQL array for day-of-week bits ✅
- `Canvas.layoutData` uses `Json` — flexible for Konva scene graphs ✅
- `User.notificationPreferences` uses `Json?` — flexible key-value store ✅

### Concerns ⚠️

1. **`PrayerConfig.enabledPrayers`** uses `String` with default `"[\"Fajr\",\"Dhuhr\",\"Asr\",\"Maghrib\",\"Isha\"]"` — JSON stored as string. This requires manual `JSON.parse` in application code (with the try-catch we added in the audit fix). Consider using `Json` type instead for native PostgreSQL JSON validation.

2. **`OnboardingProgress.completedSteps`** uses `String` with default `"[]"` — same issue as above. JSON-as-string pattern is fragile.

3. **`PaymentRecord.status`** uses `String` instead of an enum — allows arbitrary status values. Consider creating a `PaymentStatus` enum.

4. **`PaymentRecord.provider`** uses `String?` — could be an enum (`STRIPE`, `MOYASAR`).

5. **`Notification.type`** uses `String` — could be an enum for type safety.

6. **`WebhookEndpoint.events`** uses `String` (space-delimited) — could be `String[]` for better querying.

7. **`ApiKey.scopes`** uses `String` (space-delimited) — same as above.

---

## 5. Security Considerations

### Sensitive Fields ✅

- `User.passwordHash` — never returned in queries (selective queries used) ✅
- `User.refreshTokenHash` — deprecated in favor of RefreshToken model ✅
- `User.twoFactorSecret` — stored as base32, only loaded when needed ✅
- `User.twoFactorBackupCodes` — stored as bcrypt hashes in JSON array ✅
- `User.verificationCode` — stored as bcrypt hash, not plaintext ✅
- `User.passwordResetToken` — stored as bcrypt hash ✅
- `ApiKey.keyHash` — SHA-256 hash, raw key only shown once ✅
- `Screen.pairingSecretHash` — bcrypt hash ✅
- `WebhookEndpoint.secret` — stored in plaintext (necessary for HMAC signing) ⚠️

### Unique Constraints ✅

- `User.email` `@unique` ✅
- `Workspace.slug` `@unique` ✅
- `Screen.serialNumber` `@unique` ✅
- `ScreenPairingSession.code` `@unique` ✅
- `Subscription.workspaceId` `@unique` ✅ (1:1)
- `Subscription.stripeCustomerId` `@unique` ✅
- `Subscription.stripeSubscriptionId` `@unique` ✅
- `ApiKey.keyHash` `@unique` ✅
- `WorkspaceInvitation.token` `@unique` ✅
- `ProcessedWebhookEvent` `@@unique([provider, externalId])` ✅
- `WorkspaceMember` `@@unique([workspaceId, userId])` ✅
- `FeatureFlag` `@@unique([workspaceId, module])` ✅
- `MediaFolder` `@@unique([workspaceId, name])` ✅
- `PlaylistItem` `@@unique([playlistId, orderIndex])` ✅
- `PairingClaimLockout` `@@unique([userId, ip])` ✅
- `RefreshToken` `@@unique([userId, sessionId])` ✅

---

## 6. Deprecated / Legacy

1. **`WorkspacePairingCode`** — explicitly marked deprecated in schema comments. Pairing now uses `ScreenPairingSession`. Table kept for DB compatibility but should eventually be dropped.

2. **`User.refreshTokenHash`** — deprecated in favor of `RefreshToken` model. Field still exists on User but is cleared on password reset. Should eventually be removed.

3. **`User.subscriptionStatus` / `User.subscriptionEndDate`** — these are for admin CRM display, separate from workspace `Subscription`. The dual subscription tracking (user-level vs workspace-level) is potentially confusing.

---

## 7. Identified Issues

### High
1. **JSON-as-string fields**: `PrayerConfig.enabledPrayers` and `OnboardingProgress.completedSteps` store JSON in `String` columns. Should use `Json` type for native validation and safer querying.
2. **No migration files visible**: Schema is well-defined but no `prisma/migrations/` directory was found. Migrations may be applied via `prisma db push` in development — production should use proper migrations.

### Medium
1. **String-typed enum candidates**: `PaymentRecord.status`, `PaymentRecord.provider`, `Notification.type` should be enums.
2. **Space-delimited arrays**: `WebhookEndpoint.events` and `ApiKey.scopes` use space-delimited strings — `String[]` would be more robust.
3. **Dual subscription tracking**: User-level subscription fields (`subscriptionStatus`, `subscriptionEndDate`) overlap with workspace `Subscription` model — potential inconsistency.

### Low
1. **Deprecated `WorkspacePairingCode`**: Should be dropped in a future migration.
2. **Deprecated `User.refreshTokenHash`**: Should be removed once all code paths use `RefreshToken` model.

---

## 8. Strengths

- Comprehensive indexing strategy on all query-critical fields
- Proper cascade/restrict/setNull delete policies
- Security-conscious field design (hashes, not plaintext)
- BigInt for storage limits (avoids Int overflow)
- Unique constraints prevent data duplication
- Well-commented schema with business context
- Brute-force protection models (LoginLockout, PairingClaimLockout)
- Idempotency model (ProcessedWebhookEvent) for webhook deduplication

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Correction (important):**
- §7 "No migration files visible … migrations may be applied via `prisma db push`" →
  **FALSE.** `apps/backend/prisma/migrations/` contains **26 real migrations** plus
  `migration_lock.toml` (earliest `20260406151132_step4_cookie_auth_workspace_ui`, latest
  `20260711130000_multi_session_refresh_tokens`). The project uses proper migrations, and
  the backend runs `prisma migrate deploy` on container start (`Dockerfile.backend:92`).

**Confirmed-true (keep):** JSON-as-string columns (`PrayerConfig.enabledPrayers`,
`OnboardingProgress.completedSteps`) — verified, parsed via `safeParsePrayers()`.
`PaymentRecord.amount` is `Float` and the table is effectively unused — verified (file 07).

**Addition:** tenant isolation is application-enforced (every query must carry
`workspaceId`); there is **no Postgres RLS**. Consider RLS as defense-in-depth for
high-value tables — see file 15 §3.
