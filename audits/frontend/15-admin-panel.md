# 15 — Admin Panel

> **Source basis:** `src/app/[locale]/(shell)/admin/layout.tsx`, `src/app/[locale]/(shell)/admin/admin-section-shell.tsx`, `src/features/admin/admin-api.ts`, `src/features/admin/admin-home-overview-client.tsx`, `src/features/admin/admin-customers-client.tsx`, `src/features/admin/admin-customer-profile-client.tsx`, `src/features/admin/admin-customer-profile-tabs.tsx`, `src/features/admin/admin-customer-profile-dialogs.tsx`, `src/features/admin/admin-customer-workspace-client.tsx`, `src/features/admin/admin-staff-client.tsx`, `src/features/admin/admin-users-client.tsx`, `src/features/admin/admin-workspaces-client.tsx`, `src/features/admin/admin-fleet-client.tsx`, `src/features/admin/admin-screens-client.tsx`, `src/features/admin/admin-system-health-client.tsx`, `src/features/admin/admin-logs-client.tsx`, `src/features/admin/admin-settings-client.tsx`, `src/features/admin/feature-flags-client.tsx`, `src/features/admin/impersonation-return-button.tsx`, `src/features/admin/super-admin-guard.tsx`, `src/components/admin/admin-breadcrumb-bar.tsx`  

---

## 15.1 Admin Architecture

### Access Control

**Server-side guard** (`src/app/[locale]/(shell)/admin/layout.tsx`):
1. `fetchAuthMeServer()` — checks httpOnly cookies
2. Not authenticated → redirect to `/login?returnTo=/{locale}/admin`
3. Not super-admin → redirect to `/overview`
4. Authorized → render `AdminSectionShell`

**Client-side guard** (`src/features/admin/super-admin-guard.tsx`):
Additional client-side check for admin components. Verifies `isSuperAdmin` from workspace context.

### AdminSectionShell
Wraps admin content with consistent layout. Renders inside the main `CrystalShell` layout.

### AdminBreadcrumbBar (`src/components/admin/admin-breadcrumb-bar.tsx`)
- Reusable breadcrumb component for admin pages
- Props: `ariaLabel`, `items` (array of `{ href?, label }`)
- Last item has no href (current page)
- Styled as a horizontal nav with chevron separators

---

## 15.2 Admin Home (`src/features/admin/admin-home-overview-client.tsx`)

### Route: `/{locale}/admin`

### Content
- System-wide statistics cards:
  - Total customers
  - Total workspaces
  - Total screens
  - Total users
  - Active subscriptions
  - Revenue (if applicable)
- Fleet status overview (global screen health)
- Recent system activity
- Quick links to admin sections

### Page Layout
Uses `vc-page-kicker`, `vc-page-title`, `vc-page-desc` CSS classes for header. `AdminBreadcrumbBar` at top.

---

## 15.3 Admin Customers (`src/features/admin/admin-customers-client.tsx`)

### Route: `/{locale}/admin/customers`

### Purpose
Customer management interface (~24KB).

### Features
- **Customer list table:** Name, email, workspaces count, screens count, subscription status, created date
- **Search:** Filter by name, email
- **Filter:** By subscription status (active, trial, cancelled, paused)
- **Sort:** By any column
- **Pagination:** Standard pagination
- **Row click:** Navigate to customer profile
- **Actions:** View profile, impersonate, suspend, delete

### Table Styling
Uses `adminGlassTable` tokens from `src/lib/admin-glass-table.ts`:
- Wrapper: `vc-card-surface overflow-hidden rounded-2xl border border-border bg-card`
- Header: `bg-muted/25`, uppercase tracked text in primary color
- Rows: hover `bg-muted/30`, clickable rows `cursor-pointer`

---

## 15.4 Admin Customer Profile (`src/features/admin/admin-customer-profile-client.tsx`)

### Route: `/{locale}/admin/customers/{id}`

### Purpose
Detailed customer profile with tabs (~10KB).

### Layout
- Customer info header: name, email, created date, status
- Back button to customers list
- Tabbed interface via `AdminCustomerProfileTabs`

### Tabs (`src/features/admin/admin-customer-profile-tabs.tsx` — ~22KB)

**Details Tab:**
- Customer information (name, email, phone, country)
- Business name
- Subscription details
- Account status
- Edit customer info

**Workspaces Tab:**
- List of customer's workspaces
- Each workspace: name, screen count, playlist count, status
- Click workspace → navigate to `/{locale}/admin/customers/{id}/workspace/{wsId}`
- Create workspace for customer

**Billing Tab:**
- Subscription plan and status
- Invoice history
- Payment methods
- Adjust subscription
- Apply credits/refunds

**Logs Tab:**
- Customer-specific audit logs
- Action history
- Login history

### Dialogs (`src/features/admin/admin-customer-profile-dialogs.tsx`)
- Edit customer info dialog
- Suspend/unsuspend customer dialog
- Delete customer confirmation
- Impersonate customer confirmation
- Reset password dialog

---

## 15.5 Admin Customer Workspace (`src/features/admin/admin-customer-workspace-client.tsx`)

### Route: `/{locale}/admin/customers/{id}/workspace/{wsId}`

### Purpose
View and manage a specific workspace belonging to a customer.

### Content
- Workspace details (name, slug, timezone, locale, paused status)
- Screen list for this workspace
- Playlist list for this workspace
- Media library overview
- Edit workspace settings
- Back to customer profile

---

## 15.6 Admin Staff (`src/features/admin/admin-staff-client.tsx`)

### Route: `/{locale}/admin/staff`

### Purpose
Staff (super-admin) management (~11KB).

### Features
- Staff list table: name, email, role, last login, status
- Create staff member
- Edit staff role
- Deactivate/reactivate staff
- Reset staff password
- Activity log per staff member

---

## 15.7 Admin Users (`src/features/admin/admin-users-client.tsx`)

### Route: `/{locale}/admin/users`

### Purpose
User management across all customers (~15KB).

### Features
- User list table: name, email, customer, workspace, role, status
- Search and filter
- View user details
- Change user role
- Suspend/activate user
- Reset password
- View user sessions

---

## 15.8 Admin Workspaces (`src/features/admin/admin-workspaces-client.tsx`)

### Route: `/{locale}/admin/workspaces`

### Purpose
Workspace management across all customers (~8KB).

### Features
- Workspace list table: name, owner, screens, playlists, media, status
- Filter by status, owner
- View workspace details
- Pause/resume workspace
- Delete workspace
- Seed demo content

---

## 15.9 Admin Fleet (`src/features/admin/admin-fleet-client.tsx`)

### Route: `/{locale}/admin/fleet`

### Purpose
Global fleet overview — all screens across all customers (~5KB).

### Features
- Fleet summary: total screens, online, offline, maintenance
- Screen list with customer/workspace context
- Filter by status, customer, workspace
- Screen health map (if geo-coordinates available)
- Bulk actions: restart, update, etc.

---

## 15.10 Admin Screens (`src/features/admin/admin-screens-client.tsx`)

### Route: `/{locale}/admin/screens`

### Purpose
Screen management across all customers (~6KB).

### Features
- Screen list table: name, serial, customer, workspace, status, last seen
- Filter and search
- View screen details
- Restart screen
- Unpair screen
- Delete screen
- Reassign screen to different workspace

---

## 15.11 Admin System Health (`src/features/admin/admin-system-health-client.tsx`)

### Route: `/{locale}/admin/stats`

### Purpose
System health and statistics dashboard (~6KB).

### Content
- API response time metrics
- Database health indicators
- Realtime connection stats
- Error rate over time
- Active user count
- System resource usage (if available)
- Uptime indicator

---

## 15.12 Admin Logs (`src/features/admin/admin-logs-client.tsx`)

### Route: `/{locale}/admin/logs`

### Purpose
System log viewer (~6KB).

### Features
- Log level filter (error, warn, info, debug)
- Search by message
- Date range filter
- Auto-refresh toggle
- Log entries: timestamp, level, message, context
- Color-coded by level
- Pagination

---

## 15.13 Admin Settings (`src/features/admin/admin-settings-client.tsx`)

### Route: `/{locale}/admin/settings`

### Purpose
Global system settings (~8KB).

### Sections
- Platform branding (name, logos)
- Default subscription plan
- Email configuration
- Feature flag defaults
- Security settings (password policy, session timeout)
- API rate limiting
- Maintenance mode toggle

---

## 15.14 Feature Flags (`src/features/admin/feature-flags-client.tsx`)

### Route: `/{locale}/admin/feature-flags`

### Purpose
Feature flag management (~6KB).

### Features
- List of all feature flags
- Toggle flags on/off
- Set flag scope (global, workspace, user)
- Flag metadata: name, description, key, type
- Create new flag
- Delete flag
- Search/filter flags

### Note
This page does not use `AdminBreadcrumbBar` or standard page header — it renders `FeatureFlagsClient` directly with its own metadata.

---

## 15.15 Impersonation

### Impersonation Return Button (`src/features/admin/impersonation-return-button.tsx`)
- Floating button shown when `impersonatedBySuperAdminId` is set
- Allows super-admin to return to their admin session
- Calls API to end impersonation
- Redirects to admin panel

### Impersonation Flow
1. Super-admin clicks "Impersonate" on customer profile
2. Backend mints JWT with `impersonatedBy` field
3. Frontend stores session, `WorkspaceProvider` detects `impersonatedBy`
4. Super-admin sees the customer's dashboard as if they were that user
5. `ImpersonationReturnButton` is visible to return to admin

---

## 15.16 Admin API (`src/features/admin/admin-api.ts`)

### Functions (~6KB)
| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchAdminStats()` | GET | `/admin/stats` | System statistics |
| `fetchCustomers()` | GET | `/admin/customers` | List customers |
| `fetchCustomer(id)` | GET | `/admin/customers/{id}` | Get customer |
| `updateCustomer(id, data)` | PATCH | `/admin/customers/{id}` | Update customer |
| `suspendCustomer(id)` | POST | `/admin/customers/{id}/suspend` | Suspend |
| `deleteCustomer(id)` | DELETE | `/admin/customers/{id}` | Delete |
| `impersonateCustomer(id)` | POST | `/admin/customers/{id}/impersonate` | Impersonate |
| `fetchStaff()` | GET | `/admin/staff` | List staff |
| `createStaff(data)` | POST | `/admin/staff` | Create staff |
| `updateStaff(id, data)` | PATCH | `/admin/staff/{id}` | Update staff |
| `fetchUsers()` | GET | `/admin/users` | List users |
| `fetchWorkspaces()` | GET | `/admin/workspaces` | List all workspaces |
| `fetchFleet()` | GET | `/admin/fleet` | Fleet overview |
| `fetchSystemHealth()` | GET | `/admin/system-health` | System health |
| `fetchLogs(params)` | GET | `/admin/logs` | System logs |
| `fetchFeatureFlags()` | GET | `/admin/feature-flags` | List flags |
| `updateFeatureFlag(key, value)` | PATCH | `/admin/feature-flags/{key}` | Update flag |

---

## 15.17 [V2] UX Analysis — Admin Panel

### Admin Architecture — Enterprise Evaluation

**[V2] Admin Section Grouping:**
Unlike the client sidebar (flat list of 18 items), the admin sidebar uses section labels (Customers, Staff, Resources). This grouping is better for cognitive load — 3 groups of 4-5 items each. See `03-routing-and-navigation.md` V2 for detailed comparison.

**[V2] Server-Side Guard — No Loading State:**
The admin layout guard calls `fetchAuthMeServer()` during server rendering. If this API call is slow, the entire page load is blocked with no loading indicator. Users see a blank white page until the auth check completes. Next.js streaming/Suspense could mitigate this.

**[V2] Sovereign Mode — No Client Preview:**
As identified in `07-workspace-management.md` V2, super-admins in sovereign mode cannot access client routes. They must impersonate a user to see the client UI. This is a workflow gap for admin testing.

### Customer Management — UX Analysis

**[V2] Customer Profile:**
The admin customer profile shows customer details and their workspaces. The profile is the admin's view of a customer account — it should include:
- Customer contact information
- Plan/subscription details
- Workspace list with stats
- Impersonation button
- Suspend/delete actions

**[V2] Impersonation Flow:**
Impersonation is initiated from the admin panel via `impersonateCustomer(id)`. The admin is logged in as the customer and sees the client UI. The `ImpersonationReturnButton` is shown as a floating button. This is a good pattern for support/debugging.

**[V2] Suspend vs Delete:**
The admin can suspend (`POST /admin/customers/{id}/suspend`) or delete (`DELETE /admin/customers/{id}`) a customer. Suspension is reversible, deletion is not. The UI should clearly differentiate these actions with different visual treatment (suspend = warning, delete = destructive).

### Fleet Management — UX Analysis

**[V2] Fleet Overview:**
The admin fleet page shows all screens across all customers. This is a platform-level view for monitoring overall system health. Key UX considerations:
- Screen count by status (online/offline/error)
- Customer-level grouping
- Search/filter by customer, status, location
- Bulk actions (reboot, update, etc.)

### Feature Flags — UX Analysis

**[V2] Feature Flag Toggle:**
Feature flags can be toggled via `PATCH /admin/feature-flags/{key}`. The UI likely shows a list of flags with toggle switches. This is a standard feature flag management pattern. Key considerations:
- No flag creation from UI (flags are backend-defined)
- No flag description/documentation in UI
- No flag history/audit log
- No flag scheduling (enable at future date)

### [V2] Enterprise Admin Evaluation

**[V2] Missing Admin Features:**
- No admin audit log for admin actions (separate from customer audit log)
- No admin role permissions (all super-admins have full access)
- No admin activity dashboard (what admins are doing)
- No customer communication tools (email, in-app messages)
- No bulk customer operations
- No customer export/CSV
- No revenue/MRR dashboard
- No churn analytics
- No support ticket integration

### Cross-References
- See `03-routing-and-navigation.md` for admin sidebar navigation
- See `04-layout-and-shell.md` for AdminSectionShell and admin layout guard
- See `06-auth-and-session.md` for impersonation auth flow
- See `07-workspace-management.md` for sovereign mode restrictions
- See `28-feature-inventory.md` for admin feature inventory
