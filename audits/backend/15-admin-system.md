# 15 — Admin System Audit

> **Objective:** Evaluate the admin system: super admin capabilities, platform staff roles, impersonation, branding, feature flags, audit logs, and customer management.

---

## 1. Current State

The admin system is implemented in `domains/admin/` with `AdminController`, `AdminService`, and `BrandingAssetsService`. It provides super admin and platform staff access to user management, customer management, workspace management, fleet monitoring, audit logs, system settings, and white-label branding.

---

## 2. What Exists

### Access Control
- **`SuperAdminDbGuard`** — Verifies `user.isSuperAdmin === true` in DB (not just JWT claim). Used for sensitive operations.
- **`PlatformStaffDbGuard`** — Verifies `user.platformStaffRole` in DB. Uses `@PlatformRoles()` decorator for role-specific access.
- **Platform staff roles:**
  - `SUPER_ADMIN` — Full access to all admin endpoints
  - `SUPPORT_SPECIALIST` — Read access to users, customers, workspaces, fleet, audit logs
  - `BILLING_MANAGER` — Read access to users, customers, global stats

### Admin Endpoints
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| GET | `/admin/stats` | PlatformStaff | Global stats (users, workspaces, screens, revenue) |
| GET | `/admin/users` | PlatformStaff | List all users (paginated) |
| PATCH | `/admin/users/:id` | SuperAdmin | Update user (isActive, isSuperAdmin, platformStaffRole) |
| POST | `/admin/users/:id/impersonate` | SuperAdmin | Impersonate user |
| GET | `/admin/customers` | PlatformStaff | List all workspaces as customers (paginated) |
| POST | `/admin/customers` | SuperAdmin | Create customer workspace |
| PATCH | `/admin/customers/:id` | SuperAdmin | Update customer workspace |
| DELETE | `/admin/customers/:id` | SuperAdmin | Delete customer workspace |
| PATCH | `/admin/customers/:id/subscription` | SuperAdmin | Update customer subscription |
| GET | `/admin/fleet` | PlatformStaff | All screens across all workspaces |
| GET | `/admin/logs` | PlatformStaff | Audit logs (paginated) |
| GET | `/admin/settings` | SuperAdmin | System settings |
| PATCH | `/admin/settings` | SuperAdmin | Update system settings |
| GET | `/admin/staff` | SuperAdmin | List platform staff |
| POST | `/admin/staff` | SuperAdmin | Create staff member |
| PATCH | `/admin/staff/:id` | SuperAdmin | Update staff role |
| DELETE | `/admin/staff/:id` | SuperAdmin | Remove staff member |
| GET | `/admin/branding` | SuperAdmin | Get branding assets |
| PATCH | `/admin/branding` | SuperAdmin | Update branding assets |

### Impersonation
- `POST /admin/users/:id/impersonate` — Super admin only
- Issues JWT with `impersonatedBy: adminUserId` claim
- Original admin's refresh tokens preserved
- `POST /auth/exit-impersonation` — Restores original admin session
- All impersonation events logged to `AuditLog` with admin name, target, IP

### Audit Logging
- `AuditLog` model (Postgres-backed) with: `action`, `adminName`, `targetCustomer`, `ipAddress`, `workspaceId`, `userId`, `metadata` (JSON)
- `AuditLogService.append()` — Admin-level audit (impersonation, staff changes)
- `AuditLogService.appendWorkspace()` — Workspace-level audit
- Retention: 90 days (configurable via `AUDIT_LOG_RETENTION_DAYS`)
- Purge: `MaintenanceService.purgeOldAuditLogs()` cron job at 3am UTC daily

### Branding (White-Label)
- `BrandingAssetsService` — Manages white-label branding assets
- Custom logo, colors, company name, custom domain
- Stored in admin settings (JSON)

### Feature Flags
- `FeatureFlag` model — Per-workspace module toggles
- `FeatureFlagsController` — CRUD for feature flags
- `module` key + `enabled` boolean
- Used to gate features per workspace

### Onboarding
- `OnboardingProgress` model — Per-workspace onboarding tracking
- Steps: `create_screen`, `upload_media`, `create_playlist`, `schedule_content`, `invite_team`
- `GET /onboarding/progress` — Returns completion status
- `POST /onboarding/complete-step` — Mark step complete
- `POST /onboarding/dismiss` — Dismiss onboarding

---

## 3. What Is Missing

1. **No admin dashboard analytics** — `GET /admin/stats` returns basic counts but no time-series data, no growth charts, no churn rate, no MRR calculation.

2. **No admin search** — Can't search across users, workspaces, or screens globally. Must use individual list endpoints.

3. **No bulk admin operations** — Can't bulk deactivate users, bulk pause workspaces, or bulk send notifications.

4. **No admin audit log for settings changes** — Settings updates are not logged to audit trail.

5. **No two-person rule for sensitive operations** — Super admin can delete workspaces, change staff roles, and impersonate without secondary approval.

6. **No admin API rate limiting** — Admin endpoints have no specific throttle limits. A compromised admin account could make unlimited requests.

7. **No feature flag dependency graph** — Feature flags can be toggled independently but no validation that dependent flags are consistent.

8. **No admin notification on suspicious activity** — No alert when a super admin impersonates multiple users in succession or when staff role changes occur.

9. **No admin session timeout** — Super admin JWT has same expiry as regular users. No shorter session timeout for admin access.

10. **No IP allowlist for admin access** — Super admin endpoints accessible from any IP. No IP-based restriction.

---

## 4. Problems

1. **No admin module tests** — Zero spec files for `AdminController` or `AdminService`. Critical security module with no test coverage.

2. **`BrandingAssetsService` storage unclear** — Branding assets are stored in admin settings JSON but no file upload endpoint for logos. How are logos uploaded?

3. **Feature flags not integrated with module loading** — Feature flags are stored in DB but NestJS modules are loaded at boot time. Toggling a feature flag doesn't actually enable/disable the module's routes.

4. **No workspace transfer** — Can't transfer workspace ownership from one user to another via admin.

5. **No admin password policy** — Super admin accounts have the same password requirements as regular users (none).

---

## 5. Risks

- **High: No admin tests** — Security-critical module with zero test coverage.
- **High: No two-person rule** — Single super admin can perform all destructive operations.
- **Medium: No admin session timeout** — Long-lived admin tokens increase compromise window.
- **Medium: No IP allowlist** — Admin access from any location.
- **Low: Feature flags not enforced** — Toggling flags has no runtime effect.

---

## 6. Priority: **High**

Admin system is feature-rich but lacks tests, security hardening, and analytics.

---

## 7. Completion Percentage: **82%**

User management, customer management, impersonation, audit logs, branding, feature flags, and onboarding are implemented. Missing: analytics, bulk ops, two-person rule, admin tests, IP allowlist, session timeout.

---

## 8. Recommendations

1. Add admin module tests: `admin.controller.spec.ts`, `admin.service.spec.ts` covering all endpoints and guards
2. Add admin session timeout: 1-hour JWT expiry for admin-only tokens (separate from user JWT)
3. Add IP allowlist for super admin endpoints: `ADMIN_ALLOWED_IPS` env var
4. Add two-person rule for destructive operations: require two super admins to confirm workspace deletion
5. Add admin analytics: time-series stats (signups, active workspaces, MRR, churn) with daily snapshots
6. Add admin audit logging for settings changes and feature flag toggles
7. Add admin search: `GET /admin/search?q=...` across users, workspaces, screens
8. Add bulk operations: `POST /admin/users/bulk-deactivate`, `POST /admin/workspaces/bulk-pause`
9. Add feature flag enforcement: middleware that checks feature flags before route execution
10. Add workspace ownership transfer: `POST /admin/customers/:id/transfer-ownership`
11. Add admin notification on suspicious activity (rapid impersonation, staff role changes)
12. Add branding logo upload endpoint with S3 storage

---

## 9. Future Tasks

- [ ] Add admin module tests
- [ ] Add admin session timeout
- [ ] Add IP allowlist for admin
- [ ] Add two-person rule for destructive ops
- [ ] Add admin analytics with time-series
- [ ] Add audit logging for settings/flags
- [ ] Add admin global search
- [ ] Add bulk operations
- [ ] Add feature flag enforcement middleware
- [ ] Add workspace ownership transfer
- [ ] Add suspicious activity alerts
- [ ] Add branding logo upload
