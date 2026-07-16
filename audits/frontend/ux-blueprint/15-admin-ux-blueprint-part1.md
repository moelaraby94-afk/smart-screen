# Admin UX Blueprint — Part 1: Customers, Staff & Users

> **Evidence basis:** `05-page-type-ux-rules.md` §3-4, `information-architecture/06-page-catalog.md` P-AD-01 through P-AD-03, `audits/frontend/15-admin-panel.md`, `product-architecture/09-product-modules.md` M-08
> **Purpose:** Complete UX blueprint for Admin Customers, Staff, and Users pages
> **Part:** 1 of 2 (Admin)

---

## Admin Overview

Admin mode is a **separate navigation mode** with its own grouped sidebar. It is accessed only by Super-Admin users. The admin sidebar has grouped sections (Management, System) with 8 total items.

### Admin Sidebar Structure

| Group | Item | Route | Priority |
|-------|------|-------|----------|
| Management | Customers | `/admin/customers` | High |
| Management | Staff | `/admin/staff` | Medium |
| Management | Users | `/admin/users` | Medium |
| System | Workspaces | `/admin/workspaces` | Medium |
| System | Fleet | `/admin/fleet` | Medium |
| System | Health | `/admin/health` | Low |
| System | Logs | `/admin/logs` | Low |
| System | Feature Flags | `/admin/feature-flags` | Medium |

### Admin UX Rules

| Rule | Description | Evidence |
|------|-------------|----------|
| Separate sidebar | Grouped (Management, System), not flat | `05-navigation-architecture.md` §1.4 |
| No workspace switcher | Admin operates across all workspaces | M-08 |
| Admin tables use admin style | Denser, more columns, striped rows | `02-design-system-and-tokens.md` §2.14 |
| Impersonation available | Super-Admin can impersonate customers | M-08 |
| No client sidebar items | Admin mode is fully separate | NP-01 |
| Back to client mode | Toggle in header or user menu | M-08 |

---

## P-AD-01: Customers

### 1. Purpose
- **Business purpose:** Customer management; revenue tracking; support
- **User purpose:** View all customers, manage subscriptions, troubleshoot issues, impersonate
- **Success criteria:** Admin can find a customer within 10 seconds; admin can impersonate within 15 seconds
- **Failure criteria:** Can't search; can't see customer details; can't impersonate; missing key data

### 2. Target Users
- **Primary user:** Super-Admin
- **Secondary user:** None
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin role + admin mode

### 3. Page Priority
- **Priority:** High
- **Reasoning:** Primary admin function; customer support and management

### 4. Primary Goal
Find and manage customers

### 5. Primary Action
"Create Customer" (future) or search to find existing

### 6. Secondary Actions
1. Search customers by name, email, workspace name
2. Filter by plan (Free, Starter, Pro, Enterprise)
3. Filter by status (Active, Trial, Suspended, Churned)
4. Click customer row → Customer detail
5. Impersonate customer (from detail or row action)
6. Suspend/activate customer
7. Export customer list (future)

### 7. Information Priority
1. Customer name / workspace name — **identification**
2. Email — **contact**
3. Plan — **revenue tier**
4. Status (Active/Trial/Suspended) — **account state**
5. Screen count — **usage scale**
6. Created date — **tenure**
7. MRR (future) — **revenue value**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Customers" + "Create Customer" button (future)
- Search bar (full width)
- Filter bar: plan filter, status filter, clear all

**Middle:**
- Customer table (admin style: dense, striped, sticky header)
- Columns: Name, Email, Plan, Status, Screens, Created, Actions

**Bottom:**
- Pagination

**Collapsed:**
- Advanced filters (date range, MRR range — future)
- Column toggle (future)

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search, filter, create
- **Priority:** 1
- **Contents:** Search input, plan filter, status filter, "Create Customer" button (future)
- **Visibility:** Always

#### Section 2: Customer Table
- **Purpose:** Display all customers
- **Priority:** 1
- **Contents:** Table with columns: Name, Email, Plan, Status, Screens, Created, Actions
- **Dependencies:** `useApiAdminCustomers` (SWR, paginated, server-side search)
- **Visibility:** Always (empty state if no customers)
- **Future:** Column toggle, saved filter presets, export

#### Section 3: Pagination
- **Purpose:** Navigate large customer lists
- **Priority:** 2
- **Contents:** Page indicator, page size, prev/next
- **Visibility:** Only when customers > page size

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Page title | Text (h1) | Header |
| "Create Customer" button | Button (default) | Toolbar (future) |
| Search input | Input (text) | Toolbar |
| Plan filter | Select (Radix) | Toolbar |
| Status filter | Select (Radix) | Toolbar |
| "Clear All" link | Link | Toolbar |
| Filter chip | Badge (removable) | Toolbar |
| Customer table | Table (admin style) | Table |
| Customer name | Text (medium) | Table |
| Customer email | Text (muted) | Table |
| Plan badge | Badge | Table |
| Status badge | Badge (colored) | Table |
| Screen count | Text | Table |
| Created date | Text (muted) | Table |
| "Actions" menu | DropdownMenu | Table |
| "View" action | Dropdown item | Table |
| "Impersonate" action | Dropdown item | Table |
| "Suspend" action | Dropdown item | Table |
| "Activate" action | Dropdown item | Table |
| Pagination | Pagination | Bottom |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Customer row | Navigates to customer detail |
| Click | "Actions" menu | Opens dropdown |
| Click | "Impersonate" | Opens confirmation dialog, then impersonates |
| Click | "Suspend" | Opens AlertDialog, then suspends |
| Click | "Activate" | Activates customer (no confirmation — non-destructive) |
| Search | Type | Debounced 300ms, server-side search |
| Filter | Select | Filters table, chips appear |
| Click | Filter chip "×" | Removes filter |
| Keyboard | Tab | Through toolbar → table → pagination |
| Keyboard | Enter | Opens focused row (customer detail) |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with rows |
| Loading | Initial load | 5-8 skeleton table rows |
| Searching | Type in search | Spinner in search + skeleton rows |
| Empty — no customers | 0 customers | "No customers registered yet." |
| Empty — filtered | Filters return 0 | "No customers match your filters." + "Clear Filters" |
| Impersonating | Confirm clicked | Spinner + redirect to client mode as customer |
| Suspending | Confirm clicked | Spinner on action + row status updates |
| Suspended | API 200 | Status badge updates to "Suspended" + toast: "Customer suspended" |
| Activated | API 200 | Status badge updates to "Active" + toast: "Customer activated" |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Customer suspended | Toast: "[Customer Name] suspended" |
| Customer activated | Toast: "[Customer Name] activated" |
| Impersonation started | Toast: "Viewing as [Customer Name]" + redirect to client Overview |
| Impersonation ended | Toast: "Returned to admin mode" + redirect to admin Customers |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| View or impersonate? | Need to help customer | View detail (read-only) or impersonate (act as them) | View first, impersonate if needed |
| Suspend or contact? | Customer issue | Suspend (block access) or contact (resolve) | Contact first, suspend if necessary |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Impersonate wrong customer | Confirmation dialog shows customer name | Cancel in dialog |
| Suspend wrong customer | AlertDialog: "Suspend [Customer Name]? They will lose access." | Must confirm |
| Forget to end impersonation | Impersonation banner is always visible | Click "Exit Impersonation" in banner |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through toolbar → table rows → pagination |
| Screen reader | Table has proper `role="table"` with headers |
| ARIA | Status badges have `aria-label` |
| Focus | Search input auto-focused on page load |
| Contrast | Admin table meets contrast standards |
| Touch targets | All action buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Table | Card list (stacked rows) |
| Toolbar | Stacked: search → filters |
| Actions | In "More" menu per card |
| Pagination | Full width |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Large lists | Server-side pagination (20 per page) |
| Search | Server-side search (debounced 300ms) |
| Table rendering | Virtualization for 100+ rows (future) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Create customer | Toolbar button |
| Export CSV | Toolbar menu |
| Customer detail page | New route `/admin/customers/{id}` |
| MRR column | Table column |
| Churn risk indicator | Table column or badge |
| Bulk actions | Checkbox + bulk bar |
| Saved filter presets | In filter bar |
| Column toggle | Toolbar menu |

### 20. UX Notes
- Admin table style is denser than client tables (more columns, smaller padding)
- Impersonation is a powerful tool — confirmation dialog is mandatory
- Impersonation banner must be always visible during impersonation (prevents confusion)
- Status badges: green (Active), blue (Trial), red (Suspended), muted (Churned)
- Search should be server-side (customer list can be 1000+)
- Consider showing MRR (Monthly Recurring Revenue) for business value at a glance
- "Suspend" should explain consequences in the confirmation dialog
- Customer detail page (future) should show: workspace details, screens, team, billing, activity log

---

## P-AD-02: Staff

### 1. Purpose
- **Business purpose:** Internal team management; admin staff access control
- **User purpose:** View and manage internal staff members and their roles
- **Success criteria:** Admin can find a staff member within 10 seconds; admin can change role within 15 seconds
- **Failure criteria:** Can't search; can't change roles; unclear permission levels

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Internal management; occasional use; important for security

### 4. Primary Goal
Manage internal staff members and their admin access

### 5. Primary Action
"Invite Staff" (dialog)

### 6. Secondary Actions
1. Search staff by name/email
2. Filter by role (Super-Admin, Admin, Support)
3. Change role (dropdown per staff member)
4. Remove staff (→ AlertDialog)
5. Click staff row → Staff detail (future)

### 7. Information Priority
1. Staff name — **identification**
2. Email — **contact**
3. Role (Super-Admin, Admin, Support) — **access level**
4. Status (Active/Inactive) — **account state**
5. Last active — **presence**
6. Created date — **tenure**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Staff" + "Invite Staff" button
- Search bar + role filter

**Middle:**
- Staff table: Name, Email, Role, Status, Last Active, Actions

**Bottom:**
- Pagination (if needed)

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search, filter, invite
- **Priority:** 1
- **Contents:** Search input, role filter, "Invite Staff" button
- **Visibility:** Always

#### Section 2: Staff Table
- **Purpose:** Display staff members
- **Priority:** 1
- **Contents:** Table with columns: Name, Email, Role, Status, Last Active, Actions
- **Dependencies:** `useApiAdminStaff` (SWR, paginated)
- **Visibility:** Always (empty state if no staff)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| "Invite Staff" button | Button (default) | Toolbar |
| Search input | Input (text) | Toolbar |
| Role filter | Select (Radix) | Toolbar |
| Staff table | Table (admin style) | Table |
| Staff name | Text (medium) | Table |
| Staff email | Text (muted) | Table |
| Role dropdown | Select (Radix) | Table |
| Status badge | Badge | Table |
| Last active | Text (muted) | Table |
| "Remove" button | Button (ghost, destructive) | Table |
| Invite dialog | Dialog (Radix) | Toolbar |
| Email input | Input (email) | Invite Dialog |
| Role selector | Select (Radix) | Invite Dialog |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Invite Staff" | Opens invite dialog |
| Click | Role dropdown | Changes role (immediate with toast) |
| Click | "Remove" | Opens AlertDialog |
| Search | Type | Debounced 300ms |
| Keyboard | Tab | Through toolbar → table |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with rows |
| Loading | Initial load | 3-5 skeleton rows |
| Empty — no staff | 0 staff | "No staff members." |
| Inviting | Dialog submit | Dialog spinner |
| Invite success | API 200 | Toast: "Invitation sent to [email]" + table updates |
| Role changed | Dropdown change | Toast: "Role changed to [role]" |
| Removing | AlertDialog confirm | Spinner |
| Remove success | API 200 | Toast: "[Name] removed" + table updates |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Staff invited | Toast: "Invitation sent to [email]" |
| Role changed | Toast: "[Name] is now [Role]" |
| Staff removed | Toast: "[Name] removed from staff" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Which admin role? | Inviting staff | Super-Admin, Admin, Support | Support (least privilege) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Remove wrong staff | AlertDialog: "Remove [Name] from staff?" | Must confirm |
| Give too much access | Role dropdown shows permissions description | Change role to lower privilege |

### 16. Accessibility
- Same as Customers (§16)

### 17. Mobile Experience
- Same as Customers (§17) — card list on mobile

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch (typically < 20 staff, fast) |
| Search | Client-side filter (small dataset) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Staff detail page | New route `/admin/staff/{id}` |
| Permission matrix | New section or dialog |
| Last active timestamp | Table column |
| Activity log per staff | Staff detail page |
| SSO for staff | Integration with Settings → Security |

### 20. UX Notes
- Staff list is typically short (< 20 members) — no pagination needed in most cases
- Role change should be immediate with toast (same pattern as Team page)
- "Super-Admin" role should have a warning description (full system access)
- Consider showing permission descriptions for each role in the invite dialog
- Staff who are also customers should be clearly distinguished (badge or separate section)

---

## P-AD-03: Users

### 1. Purpose
- **Business purpose:** Cross-workspace user management; user search; support
- **User purpose:** Find any user across all workspaces; view their workspaces; troubleshoot
- **Success criteria:** Admin can find a user within 10 seconds; admin can see user's workspaces
- **Failure criteria:** Can't search; can't see workspace memberships; missing key data

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Support tool; used when investigating user issues across workspaces

### 4. Primary Goal
Find users across all workspaces and view their memberships

### 5. Primary Action
Search (by email or name)

### 6. Secondary Actions
1. Filter by role (Owner, Editor, Viewer)
2. Filter by status (Active, Pending)
3. Click user row → User detail (future)
4. View workspace memberships (in detail or expanded row)
5. Reset password (future, from detail)
6. Deactivate user (future, from detail)

### 7. Information Priority
1. User name — **identification**
2. Email — **contact and search key**
3. Role — **access level in workspace**
4. Workspace name — **membership**
5. Status (Active/Pending) — **account state**
6. Last active — **presence**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Users" + search bar (prominent, full width)
- Filter bar: role filter, status filter

**Middle:**
- Users table: Name, Email, Workspaces (count), Role, Status, Last Active, Actions

**Bottom:**
- Pagination

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search and filter
- **Priority:** 1
- **Contents:** Search input (prominent), role filter, status filter
- **Visibility:** Always

#### Section 2: Users Table
- **Purpose:** Display users across all workspaces
- **Priority:** 1
- **Contents:** Table with columns: Name, Email, Workspaces, Role, Status, Last Active, Actions
- **Dependencies:** `useApiAdminUsers` (SWR, paginated, server-side search)
- **Visibility:** Always (empty state if no users)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Search input | Input (text, prominent) | Toolbar |
| Role filter | Select (Radix) | Toolbar |
| Status filter | Select (Radix) | Toolbar |
| Users table | Table (admin style) | Table |
| User name | Text (medium) | Table |
| User email | Text (muted) | Table |
| Workspace count | Badge | Table |
| Role badge | Badge | Table |
| Status badge | Badge | Table |
| Last active | Text (muted) | Table |
| "Actions" menu | DropdownMenu | Table |
| "View" action | Dropdown item | Table |
| Pagination | Pagination | Bottom |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | User row | Navigates to user detail (future) |
| Click | "Actions" menu | Opens dropdown |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Filters table |
| Keyboard | Tab | Through toolbar → table |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with rows |
| Loading | Initial load | 5-8 skeleton rows |
| Searching | Type in search | Spinner + skeleton rows |
| Empty — no users | 0 users | "No users found." |
| Empty — filtered | Filters return 0 | "No users match your filters." + "Clear Filters" |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Search complete | Results displayed |
| Filter applied | Table updates + chips appear |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| View user or workspace? | Investigating issue | View user detail or navigate to their workspace | User detail first |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Search wrong email | Search is by email OR name | Refine search |
| Confuse user with staff | Users are workspace members, Staff are internal | Different pages in admin sidebar |

### 16. Accessibility
- Same as Customers (§16)

### 17. Mobile Experience
- Same as Customers (§17)

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Large lists | Server-side pagination (20 per page) |
| Search | Server-side (user list can be 1000+) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| User detail page | New route `/admin/users/{id}` |
| Workspace memberships list | User detail page |
| Reset password | User detail page action |
| Deactivate user | User detail page action |
| Merge accounts | User detail page (if duplicate emails) |
| Export users | Toolbar menu |

### 20. UX Notes
- Users page is different from Staff: Users are workspace members (customers), Staff are internal employees
- Search should be the primary interaction — admin usually knows the email they're looking for
- Workspace count helps identify users with multiple workspace memberships
- User detail page (future) should show: all workspaces, role in each, activity log, last login
- Consider showing "Merge Accounts" action for users with duplicate emails (future)
- This page is primarily a support tool, not a daily management tool

---

## Cross-References

- See `16-admin-ux-blueprint-part2.md` for Workspaces, Fleet, Health, Logs, and Feature Flags
- See `05-page-type-ux-rules.md` §3 for list page type rules
- See `information-architecture/06-page-catalog.md` P-AD-01 through P-AD-03
- See `audits/frontend/15-admin-panel.md` for admin audit
- See `product-architecture/09-product-modules.md` M-08 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` §2 for table UX standards
