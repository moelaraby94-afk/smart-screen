# 05 — Permissions Matrix

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Complete RBAC mapping for Platform Control Panel and Customer Dashboard

---

## 1. Current State

### 1.1 Role Enums

The system defines two distinct role hierarchies in `apps/backend/prisma/schema.prisma`:

**Customer Roles (`UserRole`):**
```prisma
enum UserRole {
  OWNER
  ADMIN
  EDITOR
  VIEWER
}
```

**Platform Staff Roles (`PlatformStaffRole`):**
```prisma
enum PlatformStaffRole {
  SUPER_ADMIN
  SUPPORT_SPECIALIST
  BILLING_MANAGER
}
```

### 1.2 User Model Role Fields

The `User` model carries both:
- `isSuperAdmin Boolean @default(false)` — bypasses all role checks
- `platformStaffRole PlatformStaffRole?` — internal staff role (null = customer only)
- `memberships: WorkspaceMember[]` — customer workspace memberships with `UserRole`

### 1.3 Guard Chain

```
JwtAuthGuard (JWT validation)
    ↓
    ├── PlatformStaffDbGuard (admin routes)
    │       ↓
    │       └── SuperAdminDbGuard (sensitive admin routes)
    │
    └── RolesGuard (customer routes)
            ↓
            ├── isSuperAdmin bypass (line 42 of roles.guard.ts)
            └── AccountContextHelper.resolveForWorkspace()
                    ↓
                    ├── AccountMember check (account-wide or workspace-scoped)
                    └── WorkspaceMember fallback
```

### 1.4 Current Problems

1. **Super admin bypass in RolesGuard:** `if (user.isSuperAdmin) return true;` means a super admin token passes all customer route guards. This is intentional for impersonation and support, but it means the customer and platform authorization domains are not truly separated.

2. **No audience claim:** JWT tokens do not distinguish platform staff from customer users. Any valid token can attempt any route.

3. **Staff management conflates roles:** `AdminService.createStaff()` sets both `isSuperAdmin` and `platformStaffRole` AND creates a workspace membership in "Admin Control" workspace. This mixes platform and customer identity.

4. **`PlatformStaffDbGuard` is fail-closed but `RolesGuard` is fail-open for super admins:** A route with no `@Roles` decorator passes `RolesGuard` for any authenticated user. A route with no `@PlatformRoles` is super-admin only. This asymmetry is correct but confusing.

5. **No role for "platform viewer":** There is no read-only platform staff role. `SUPPORT_SPECIALIST` and `BILLING_MANAGER` have specific access patterns, but there is no general "platform observer" role.

---

## 2. Problems

### 2.1 Cross-Domain Authorization Leaks

The `RolesGuard` super admin bypass means:
- A compromised super admin token can access any customer route
- The customer authorization flow is aware of the platform super admin concept
- There is no way to restrict a super admin from customer routes at the guard level

### 2.2 Impersonation Token Scope

When a super admin impersonates a customer, `AuthService.issueImpersonation()` issues tokens with `impersonatedBy: actorUserId` in the JWT payload. These tokens have the same audience as a regular customer token. There is no way to distinguish an impersonated session from a real customer session at the guard level — only at the UI level.

### 2.3 No Granular Platform Permissions

`PlatformStaffRole` has only three values. There is no way to grant a support specialist access to specific customer data without giving them access to all customers. Similarly, a billing manager can see revenue stats but cannot manage subscriptions (that's super admin only).

### 2.4 Workspace vs. Account Authorization

The `AccountContextHelper` resolves access through:
1. Super admin bypass
2. `AccountMember` check (account-wide or workspace-scoped)
3. `WorkspaceMember` fallback

This is complex and creates ambiguity. A user can be an `AccountMember` with `VIEWER` role but also a `WorkspaceMember` with `OWNER` role in the same workspace. The `resolveForWorkspace()` method returns the first match, which may not be the highest privilege.

---

## 3. Target Architecture

### 3.1 JWT Token Types

| Token Type | Audience | Issued To | Routes Accessible |
|---|---|---|---|
| Platform Access Token | `platform` | Platform staff (super admin, support, billing) | `/admin/*`, `/auth/*`, `/branding` |
| Customer Access Token | `customer` | Customer users (OWNER, ADMIN, EDITOR, VIEWER) | `/workspaces/*`, `/screens/*`, `/media/*`, etc. |
| Impersonation Token | `customer` | Super admin acting as customer | Same as customer + `impersonatedBy` claim |
| Player Token | `player` | Screen (kiosk mode) | `/player/*` |
| Exchange Token | `exchange` | One-time use, 30s TTL | `/auth/exchange-impersonation` only |

### 3.2 Guard Chain (Target)

```
JwtAuthGuard (JWT validation + audience check)
    ↓
    ├── PlatformAudienceGuard (new — validates audience: 'platform')
    │       ↓
    │       PlatformStaffDbGuard (validates platformStaffRole or isSuperAdmin)
    │           ↓
    │           └── SuperAdminDbGuard (re-validates isSuperAdmin in DB)
    │
    └── CustomerAudienceGuard (new — validates audience: 'customer' or 'platform')
            ↓
            RolesGuard (validates workspace membership + role)
                ↓
                ├── No super admin bypass (removed)
                └── AccountContextHelper.resolveForWorkspace()
```

**Key change:** `RolesGuard` no longer has the `if (user.isSuperAdmin) return true;` bypass. Instead, the `CustomerAudienceGuard` allows `audience: 'platform'` tokens to pass through (for impersonation and support), but `RolesGuard` treats them as VIEWER unless they have a workspace membership.

Wait — this would break impersonation. The current behavior is that a super admin (or impersonated super admin) token bypasses role checks. Let me reconsider.

**Revised approach:** Keep the super admin bypass in `RolesGuard` but only for tokens with `audience: 'platform'` or tokens with `impersonatedBy` claim. Customer-audience tokens without `impersonatedBy` are never super admin.

### 3.3 Platform Staff Permissions Matrix

| Action | SUPER_ADMIN | SUPPORT_SPECIALIST | BILLING_MANAGER |
|---|---|---|---|
| **Dashboard Home (stats)** | ✅ | ❌ | ✅ |
| **List all users** | ✅ | ✅ | ✅ |
| **List staff** | ✅ | ❌ | ❌ |
| **Create staff** | ✅ | ❌ | ❌ |
| **Update staff role** | ✅ | ❌ | ❌ |
| **List customers** | ✅ | ✅ | ✅ |
| **View customer profile** | ✅ | ✅ | ✅ |
| **View customer workspace detail** | ✅ | ✅ | ✅ |
| **Create customer workspace** | ✅ | ❌ | ❌ |
| **Update customer workspace** | ✅ | ❌ | ❌ |
| **Delete customer workspace** | ✅ | ❌ | ❌ |
| **Patch customer subscription** | ✅ | ❌ | ❌ |
| **Send subscription reminder** | ✅ | ❌ | ❌ |
| **List all workspaces** | ✅ | ✅ | ❌ |
| **List global fleet screens** | ✅ | ✅ | ❌ |
| **Mock workspace subscription** | ✅ | ❌ | ❌ |
| **View global stats** | ✅ | ❌ | ✅ |
| **View audit logs** | ✅ | ❌ | ❌ |
| **View platform settings** | ✅ | ❌ | ❌ |
| **Update platform settings** | ✅ | ❌ | ❌ |
| **Upload branding** | ✅ | ❌ | ❌ |
| **Update user (isSuperAdmin, role)** | ✅ | ❌ | ❌ |
| **Impersonate user** | ✅ | ❌ | ❌ |
| **Manage feature flags** | ✅ | ❌ | ❌ |

### 3.4 Customer User Permissions Matrix

| Action | OWNER | ADMIN | EDITOR | VIEWER |
|---|---|---|---|---|
| **View workspace** | ✅ | ✅ | ✅ | ✅ |
| **Update workspace** | ✅ | ✅ | ❌ | ❌ |
| **Delete workspace** | ✅ | ✅ | ❌ | ❌ |
| **List members** | ✅ | ✅ | ✅ | ✅ |
| **Invite member** | ✅ | ✅ | ❌ | ❌ |
| **Update member role** | ✅ | ✅ | ❌ | ❌ |
| **Remove member** | ✅ | ✅ | ❌ | ❌ |
| **Cancel/resend invite** | ✅ | ✅ | ❌ | ❌ |
| **Claim pairing session** | ✅ | ✅ | ✅ | ❌ |
| **Notify pairing started** | ✅ | ✅ | ❌ | ❌ |
| **View recent activity** | ✅ | ✅ | ✅ | ✅ |
| **Screens — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Screens — Create** | ✅ | ✅ | ✅ | ❌ |
| **Screens — Update** | ✅ | ✅ | ✅ | ❌ |
| **Screens — Delete** | ✅ | ✅ | ❌ | ❌ |
| **Screens — Remote command** | ✅ | ✅ | ✅ | ❌ |
| **Screens — Analytics** | ✅ | ✅ | ✅ | ✅ |
| **Screens — Assignments (view)** | ✅ | ✅ | ✅ | ✅ |
| **Screens — Assignments (manage)** | ✅ | ✅ | ✅ | ❌ |
| **Screens — Override** | ✅ | ✅ | ✅ | ❌ |
| **Canvases — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Canvases — Create** | ✅ | ✅ | ✅ | ❌ |
| **Canvases — Update** | ✅ | ✅ | ✅ | ❌ |
| **Canvases — Delete** | ✅ | ✅ | ❌ | ❌ |
| **Canvases — Restore version** | ✅ | ✅ | ✅ | ❌ |
| **Media — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Media — Upload** | ✅ | ✅ | ✅ | ❌ |
| **Media — Delete** | ✅ | ✅ | ✅ | ❌ |
| **Media — Folders (create/rename/delete)** | ✅ | ✅ | ✅ | ❌ |
| **Media — Move** | ✅ | ✅ | ✅ | ❌ |
| **Media — Set expiry** | ✅ | ✅ | ✅ | ❌ |
| **Playlists — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Playlists — Create** | ✅ | ✅ | ✅ | ❌ |
| **Playlists — Update** | ✅ | ✅ | ✅ | ❌ |
| **Playlists — Delete** | ✅ | ✅ | ❌ | ❌ |
| **Playlists — Manage items** | ✅ | ✅ | ✅ | ❌ |
| **Playlists — Duplicate** | ✅ | ✅ | ✅ | ❌ |
| **Playlists — Clone to workspace** | ✅ | ✅ | ✅ | ❌ |
| **Playlist Groups — List** | ✅ | ✅ | ✅ | ✅ |
| **Playlist Groups — Create** | ✅ | ✅ | ✅ | ❌ |
| **Playlist Groups — Rename** | ✅ | ✅ | ✅ | ❌ |
| **Playlist Groups — Delete** | ✅ | ✅ | ❌ | ❌ |
| **Playlist Groups — Move** | ✅ | ✅ | ✅ | ❌ |
| **Schedules — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Schedules — Create** | ✅ | ✅ | ✅ | ❌ |
| **Schedules — Update** | ✅ | ✅ | ✅ | ❌ |
| **Schedules — Delete** | ✅ | ✅ | ✅ | ❌ |
| **Campaigns — List/View** | ✅ | ✅ | ✅ | ✅ |
| **Campaigns — Create** | ✅ | ✅ | ✅ | ❌ |
| **Campaigns — Update** | ✅ | ✅ | ✅ | ❌ |
| **Campaigns — Delete** | ✅ | ✅ | ✅ | ❌ |
| **Campaigns — Submit** | ✅ | ✅ | ✅ | ❌ |
| **Campaigns — Approve/Reject** | ✅ | ✅ | ❌ | ❌ |
| **Campaigns — Publish/Pause/Resume/End** | ✅ | ✅ | ✅ | ❌ |
| **Subscriptions — View current** | ✅ | ✅ | ✅ | ✅ |
| **Subscriptions — Set mock plan** | ✅ | ✅ | ❌ | ❌ |
| **Stripe — Checkout** | ✅ | ✅ | ❌ | ❌ |
| **Stripe — Portal** | ✅ | ✅ | ❌ | ❌ |
| **Webhooks — List** | ✅ | ✅ | ❌ | ❌ |
| **Webhooks — Create** | ✅ | ✅ | ❌ | ❌ |
| **Webhooks — Delete** | ✅ | ✅ | ❌ | ❌ |
| **Webhooks — Toggle** | ✅ | ✅ | ❌ | ❌ |
| **Webhooks — Test** | ✅ | ✅ | ❌ | ❌ |
| **API Keys — List** | ✅ | ✅ | ❌ | ❌ |
| **API Keys — Create** | ✅ | ✅ | ❌ | ❌ |
| **API Keys — Revoke** | ✅ | ✅ | ❌ | ❌ |
| **Onboarding — View** | ✅ | ✅ | ❌ | ❌ |
| **Onboarding — Complete step** | ✅ | ✅ | ❌ | ❌ |
| **Onboarding — Dismiss** | ✅ | ✅ | ❌ | ❌ |
| **Onboarding — Reset** | ✅ | ✅ | ❌ | ❌ |
| **Islamic — View configs** | ✅ | ✅ | ✅ | ✅ |
| **Islamic — Update prayer config** | ✅ | ✅ | ❌ | ❌ |
| **Islamic — Update Ramadan config** | ✅ | ✅ | ❌ | ❌ |
| **Notifications — List** | ✅ | ✅ | ✅ | ✅ |
| **Notifications — Mark read** | ✅ | ✅ | ✅ | ✅ |
| **Notifications — Preferences** | ✅ | ✅ | ✅ | ✅ |
| **Account — Update profile** | ✅ | ✅ | ✅ | ✅ |
| **Account — Request email change** | ✅ | ✅ | ✅ | ✅ |
| **Account — Verify email change** | ✅ | ✅ | ✅ | ✅ |
| **Account — View billing** | ✅ | ✅ | ✅ | ✅ |
| **Account — Download invoice** | ✅ | ✅ | ✅ | ✅ |
| **Account — View insights** | ✅ | ✅ | ✅ | ✅ |
| **Account — Export data (GDPR)** | ✅ | ✅ | ✅ | ✅ |
| **Account — Anonymize (delete)** | ✅ | ✅ | ✅ | ✅ |
| **Seed demo data** | ✅ | ✅ | ❌ | ❌ |
| **Bootstrap demo** | ✅ | ✅ | ✅ | ✅ |

### 3.5 Account-Level Member Permissions

`AccountMember` introduces a cross-workspace membership layer:

| AccountMember Role | Account-Wide Access | Workspace-Scoped Access |
|---|---|---|
| OWNER | All workspaces with OWNER role | N/A (account-wide) |
| ADMIN | All workspaces with ADMIN role | N/A (account-wide) |
| EDITOR | All workspaces with EDITOR role | N/A (account-wide) |
| VIEWER | All workspaces with VIEWER role | N/A (account-wide) |
| (with workspaceScopes) | Only listed workspaces | Per-scope role override |

When `workspaceScopes` has entries, the member can only access the listed workspaces, with the per-scope role (which may differ from the account-level role).

### 3.6 Impersonation Permissions

| Action | Who Can Perform | Token Issued | Target Routes |
|---|---|---|---|
| Start impersonation | SUPER_ADMIN only | Customer-audience token with `impersonatedBy` claim | Customer routes |
| Exit impersonation | Impersonated user (via `impersonatedBy` claim) | Platform-audience token | Platform routes |
| Impersonation exchange | One-time exchange token holder | Customer-audience token with `impersonatedBy` claim | Customer routes |

---

## 4. Recommended Solution

### 4.1 Add JWT Audience Validation

Add a global guard or middleware that validates the `audience` claim:

```typescript
// Pseudocode for audience validation
if (route.startsWith('/admin/')) {
  requireAudience(token, ['platform']);
} else if (route.startsWith('/player/')) {
  // Player routes use x-player-secret, not JWT audience
} else {
  requireAudience(token, ['customer', 'platform']); // platform for impersonation
}
```

### 4.2 Remove Super Admin Bypass from RolesGuard (Future)

In the final state (Phase 3+), remove `if (user.isSuperAdmin) return true;` from `RolesGuard`. Instead:
- Platform-audience tokens with `impersonatedBy` claim bypass role checks (impersonation)
- Platform-audience tokens without `impersonatedBy` are rejected by `CustomerAudienceGuard` (they should use admin endpoints, not customer endpoints)
- Customer-audience tokens are never super admin

This fully separates the authorization domains.

### 4.3 Formalize Account-Level vs. Workspace-Level Routes

Document which routes are account-level (no `workspaceId` required) vs. workspace-level:
- **Account-level:** playlist groups, account members, account workspaces, notifications, account profile/billing/GDPR
- **Workspace-level:** screens, media, playlists (CRUD), schedules, campaigns, canvases, onboarding, islamic, webhooks, api-keys, team

### 4.4 Add Platform Staff Role to JWT Claims

Include `platformStaffRole` in the JWT payload for platform-audience tokens. This allows the frontend to render role-appropriate UI without an additional API call.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Removing super admin bypass breaks impersonation | High | Keep bypass for tokens with `impersonatedBy` claim. Test thoroughly. |
| Audience validation rejects existing tokens | High | Make audience validation additive: tokens without `audience` claim are treated as `customer`. |
| Platform staff cannot access customer routes for support | Medium | Allow `audience: 'platform'` tokens to pass `CustomerAudienceGuard` but enforce role checks via `RolesGuard` (no bypass). |
| AccountMember + WorkspaceMember conflict resolution | Medium | Document the resolution order. Consider merging into a single model in the future. |

---

## 6. Alternatives

### 6.1 Attribute-Based Access Control (ABAC)

Replace RBAC with ABAC using policy rules (e.g., OPA, Cedar).

**Pros:** Fine-grained permissions, policy-as-code.
**Cons:** Significant complexity, overkill for current scale, requires policy engine integration.

**Verdict:** Rejected. The current RBAC with two role hierarchies is sufficient. ABAC can be revisited if fine-grained permissions are needed.

### 6.2 Merge UserRole and PlatformStaffRole

Create a single role enum that covers both platform and customer roles.

**Pros:** Simpler model.
**Cons:** Conflates two distinct domains, makes guard logic more complex, risks privilege confusion.

**Verdict:** Rejected. Two separate role hierarchies is the correct design for a SaaS platform.

---

## 7. Migration Notes

- **Phase 2:** Add `audience` claim to JWT tokens. Make validation additive (no breaking change).
- **Phase 3:** Remove super admin bypass from `RolesGuard` for non-impersonated tokens.
- **No schema changes required** for the permissions matrix. The existing `UserRole`, `PlatformStaffRole`, `WorkspaceMember`, and `AccountMember` models are sufficient.

---

## 8. Open Questions

1. **Should `SUPPORT_SPECIALIST` be able to update customer workspace names?** Currently, only super admin can. Should support staff have limited write access?
2. **Should `BILLING_MANAGER` be able to send subscription reminders?** Currently, only super admin can. This seems like a billing function.
3. **Should there be a `PLATFORM_VIEWER` role** for read-only platform access (e.g., auditors, investors)?
4. **Should `AccountMember` roles be visible in the Control Panel?** Currently, `AdminService` does not query `AccountMember`.
5. **Should the `isSuperAdmin` boolean be deprecated** in favor of using `platformStaffRole: SUPER_ADMIN` exclusively? This would simplify the model.

---

## 9. Final Recommendation

Maintain the two-hierarchy RBAC model (`PlatformStaffRole` + `UserRole`). Add JWT audience claims to separate the authorization domains. Keep the super admin bypass in `RolesGuard` during transition, but make it conditional on the `impersonatedBy` claim or `audience: 'platform'` in the final state.

The permissions matrix above is the authoritative reference for all route guards. Any new route must be added to this matrix before implementation.

The most impactful change is adding audience validation to JWT tokens. This is a non-breaking, additive change that immediately improves security by preventing cross-domain token misuse.
