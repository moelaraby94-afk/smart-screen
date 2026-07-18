# 04 — Authorization Audit

> **Objective:** Evaluate the authorization system: role-based access control (RBAC), workspace isolation, account-level access, platform staff roles, and resource-level permission checks.

---

## 1. Current State

Authorization is implemented through a combination of:
- **`RolesGuard`** — Workspace-level RBAC with `@Roles()` decorator
- **`AccountContextHelper`** — Resolves effective owner and role for account members
- **`WorkspaceAuthHelper`** — Common pattern for workspace access checks
- **`SuperAdminDbGuard`** — Verifies `isSuperAdmin` flag in DB
- **`PlatformStaffDbGuard`** — Verifies platform staff role with `@PlatformRoles()` decorator
- **`JwtAuthGuard`** — Passport JWT authentication guard

---

## 2. What Exists

### Role Hierarchy

#### Workspace Roles (`UserRole`)
- `OWNER` — Full access, can delete workspace, manage members
- `ADMIN` — Can manage members, update workspace, manage content
- `EDITOR` — Can create/edit content (screens, playlists, media, schedules)
- `VIEWER` — Read-only access to workspace resources

#### Platform Staff Roles (`PlatformStaffRole`)
- `SUPER_ADMIN` — Full platform access, impersonation, staff management
- `SUPPORT_SPECIALIST` — Read access to users, customers, workspaces, fleet
- `BILLING_MANAGER` — Read access to users, customers, global stats

### Guards

#### `JwtAuthGuard`
- Extends `AuthGuard('jwt')` from Passport
- Validates JWT and loads user from DB on every request
- Attaches `JwtUser` to `request.user`

#### `RolesGuard`
- Reads `@Roles()` decorator metadata
- Super-admin bypass: if `user.isSuperAdmin`, always returns true
- Resolves `workspaceId` from params, query, body, or `x-workspace-id` header
- For account-level routes (no workspaceId): checks `AccountMember` role
- For workspace routes: uses `AccountContextHelper.resolveForWorkspace()` which checks:
  1. Super-admin bypass → returns OWNER role
  2. AccountMember with workspace scopes → uses scoped role
  3. AccountMember without scopes → uses account-level role
  4. Direct WorkspaceMember → uses membership role
  5. No access → throws `DomainException` with `NO_WORKSPACE_ACCESS`

#### `SuperAdminDbGuard`
- Verifies `user.isSuperAdmin === true` in DB
- Used for sensitive admin operations (staff management, settings, impersonation)

#### `PlatformStaffDbGuard`
- Verifies `user.platformStaffRole` is set in DB
- Checks `@PlatformRoles()` decorator for allowed roles
- Fail-closed: if no `@PlatformRoles()` decorator, requires `SUPER_ADMIN`

### Account-Level Access (`AccountContextHelper`)
- **`resolveOwnerId(userId)`** — Determines the effective account owner:
  1. If user has AccountMember rows where `ownerId = userId` → they ARE the owner
  2. If user is an AccountMember of someone else → return that owner's ID
  3. Fallback: user is their own owner (standalone workspace owner)

- **`resolveForWorkspace(userId, workspaceId)`** — Full context resolution:
  1. Super-admin → OWNER role with workspace owner's ID
  2. Find workspace OWNER → check AccountMember relationship
  3. AccountMember with workspace scopes → scoped role
  4. AccountMember without scopes → account-level role
  5. Direct WorkspaceMember → membership role
  6. No match → null (no access)

### Resource-Level Authorization

#### Workspace-scoped resources (Screens, Playlists, Media, Schedules, Campaigns)
- Services query by `workspaceId` to scope results
- `WorkspaceAuthHelper.assertAccess()` used for admin-level checks
- `AccountContextHelper.resolveOwnerId()` used to filter by effective owner

#### Admin module
- `PlatformStaffDbGuard` + `@PlatformRoles()` controls access
- Super-admin-only operations: staff CRUD, settings, delete workspace, impersonation
- Support specialist: read-only access to users, customers, workspaces, fleet
- Billing manager: read access to users, customers, global stats

### CSRF Protection
- `CsrfMiddleware` validates `csrf_token` cookie against `x-csrf-token` header
- Exempts: login, register, forgot/reset password, refresh, Stripe webhook, pairing sessions
- Bearer token requests are exempted (API clients)

---

## 3. What Is Missing

1. **No resource-level ownership checks on several endpoints** — Some services query by `workspaceId` but don't verify the user's role matches the required level for that specific resource. The `RolesGuard` checks workspace membership but not resource ownership within the workspace.

2. **No attribute-based access control (ABAC)** — Can't express rules like "EDITORS can only modify playlists they created" or "VIEWER can see schedules but not media". All permissions are workspace-level, not resource-level.

3. **No permission caching** — Every request triggers a DB query to resolve workspace membership and account context. No Redis-based caching of resolved permissions.

4. **No API key scope enforcement** — `ApiKey` model has `scopes` field but `ApiKeyAuthGuard` is not implemented. API keys are created and hashed but never used for authentication.

5. **No workspace role inheritance** — No way for an OWNER to delegate specific permissions to a custom role. Fixed 4-role hierarchy only.

6. **No audit trail for authorization decisions** — When access is denied, the exception is thrown but not logged to audit trail. Only impersonation and 2FA actions are audited.

7. **No rate limiting per role** — All roles share the same throttle limits. No differentiated limits for VIEWER vs OWNER.

8. **No multi-workspace context for API calls** — All workspace-scoped endpoints require `workspaceId` as a query param. No way to specify workspace context via header for cleaner API design.

---

## 4. Problems

1. **`workspaceId` passed as query parameter** — Most endpoints receive `workspaceId` via `@Query('workspaceId')`. This is a security anti-pattern: it appears in access logs, browser history, and can be manipulated. Should be in a header or derived from the token.

2. **Inconsistent role checks across modules** — Some controllers use `@Roles(UserRole.OWNER, UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER)` for read access, which is redundant (all roles can read). Others use just `@Roles(UserRole.OWNER, UserRole.ADMIN)`. No consistent pattern.

3. **`WorkspaceAuthHelper.assertAccess()` has super-admin bypass by default** — The `superAdminBypass: true` default means super-admin can access any workspace resource without explicit audit logging.

4. **No `WorkspaceMember` role validation on update** — `updateMemberRole` doesn't prevent demoting the last OWNER to ADMIN, which would leave the workspace without an owner.

5. **Account member deletion doesn't cascade session invalidation** — When an account member is removed, their JWT tokens remain valid until expiry.

6. **No guard for `isPaused` workspace state** — Only `PlayerService.getBootstrap()` checks `workspace.isPaused`. Other endpoints (screen creation, playlist updates) don't check if the workspace is paused.

---

## 5. Risks

- **High: No API key authentication** — API keys are created and stored but never validated. Any workspace with API keys has a false sense of programmatic access security.
- **Medium: workspaceId in query params** — Potential for access log leakage and manipulation.
- **Medium: No permission caching** — DB query per request for authorization is expensive at scale.
- **Medium: No last-owner protection** — Could accidentally leave workspace without an owner.
- **Low: No workspace pause enforcement** — Paused workspaces can still receive content modifications.

---

## 6. Priority: **Critical**

Authorization gaps can lead to cross-tenant data leakage and privilege escalation.

---

## 7. Completion Percentage: **82%**

RBAC is well-implemented with workspace + account + platform staff roles. Missing: API key enforcement, permission caching, resource-level checks, workspace pause enforcement.

---

## 8. Recommendations

1. Implement `ApiKeyAuthGuard` that validates API keys against `ApiKey.keyHash` and enforces `scopes`
2. Move `workspaceId` from query params to `x-workspace-id` header (breaking change — plan for API v2)
3. Add Redis-based permission caching with 5-minute TTL, invalidated on role change
4. Add last-owner protection in `updateMemberRole`: prevent demoting the last OWNER
5. Add `isPaused` check to all workspace mutation endpoints
6. Add audit logging for authorization denials (not just impersonation)
7. Add per-role throttle limits (VIEWER: 60/min, EDITOR: 120/min, ADMIN: 240/min)
8. Implement API key scope parsing and enforcement
9. Add workspace role change → JWT refresh token revocation
10. Consider ABAC for resource-level permissions (e.g., "only creator can delete")

---

## 9. Future Tasks

- [ ] Implement ApiKeyAuthGuard with scope enforcement
- [ ] Move workspaceId to header
- [ ] Add Redis permission caching
- [ ] Add last-owner protection
- [ ] Add workspace pause enforcement on all mutations
- [ ] Add authorization denial audit logging
- [ ] Add per-role throttle limits
- [ ] Add JWT revocation on role change
- [ ] Consider ABAC for resource-level permissions
- [ ] Add workspace context to JWT claims (optional)
