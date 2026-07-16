# Screen Specifications — Admin Part 2 (Workspaces, Fleet, Health, Logs, Feature Flags)

> **Evidence basis:** `ux-blueprint/16-admin-ux-blueprint-part2.md`, `user-flow-architecture/15-admin-flows.md` FL-AD-02, FL-AD-03, `product-architecture/09-product-modules.md` M-08, `information-architecture/06-page-catalog.md` P-AD-04–P-AD-08

---

## SCR-AD-04: Admin — Workspaces

### Screen ID
SCR-AD-04

### Purpose
View and manage all workspaces in the platform.

### Business Goal
Workspace oversight; suspension; management.

### User Goal
Find workspace; view stats; suspend/activate.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Workspaces" (Admin group)

### Exit Points
- Sidebar navigation
- "Impersonate" → Client Overview

### Page Title
`Workspaces — Cloud-Screen Admin`

### Primary CTA
None (management actions per row).

### Secondary CTA
- Search (server-side)
- Filter (plan, status)
- Sort (name, created date, screens)

### Danger Actions
- Suspend workspace (destructive)
- Delete workspace (destructive — future)

---

## Layout

### Container
- `max-w-[1400px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Workspaces" heading + total count

#### Section 2: Toolbar
- Search, filter, sort

#### Section 3: Workspaces Table
- **Columns:** Name, Owner, Plan, Screens, Media, Storage, Status, Created, Actions
- **Actions:** "Impersonate", "Suspend"/"Activate", "Delete" (future)
- **Status:** Active (green), Suspended (red)
- **Data:** `useApiAdminWorkspaces({ page, search, filter, sort })`

---

## States

### Loading
- Skeleton rows

### Error
- Error + "Retry"

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Impersonate" | Confirmation → impersonation mode |
| Click | "Suspend" | Confirmation: "Suspend [Name]? Users will lose access." → API → status updates |
| Click | "Activate" | API → status updates to Active |
| Search | Type | Debounced 300ms, server-side |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/workspaces?page={p}&search={q}&filter={f}` | GET | Paginated workspaces |
| `/admin/workspaces/{id}/suspend` | POST | Suspend workspace |
| `/admin/workspaces/{id}/activate` | POST | Activate workspace |
| `/admin/workspaces/{id}` | DELETE | Delete workspace (future) |

### Backend Limitations
- No workspace detail page (future)
- No storage usage per workspace in list (future)

---

## Acceptance Criteria

### Functional
- [ ] Displays workspaces table with all columns
- [ ] Search, filter, sort work
- [ ] "Impersonate" works with confirmation
- [ ] "Suspend" works with confirmation and updates status
- [ ] "Activate" works and updates status
- [ ] Pagination works
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Status badges color-coded
- [ ] Suspend requires confirmation (destructive)

### Accessibility
- [ ] `<h1>` "Workspaces"
- [ ] Table with proper headers
- [ ] Actions have `aria-label`

### Performance
- [ ] Table renders < 500ms

### Responsive
- [ ] Table scrolls horizontally on mobile

---

## SCR-AD-05: Admin — Fleet

### Screen ID
SCR-AD-05

### Purpose
View and manage all screens across all workspaces (fleet monitoring).

### Business Goal
System oversight; device health monitoring; OTA updates (future).

### User Goal
Check fleet health; find offline screens; troubleshoot.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Fleet" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`Fleet — Cloud-Screen Admin`

### Primary CTA
None (monitoring view).

### Secondary CTA
- Search (screen name, workspace)
- Filter (status, workspace, OS version)
- Sort (name, status, last seen)

### Danger Actions
- Reboot device (future — destructive)
- OTA Update (future — destructive)

---

## Layout

### Container
- `max-w-[1400px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Fleet Health Summary
- **Cards:** Online count (green), Offline count (red), Warning count (amber), Total count
- **Data:** Aggregated from `useApiAdminFleetStats()`

#### Section 2: Toolbar
- Search, filter, sort

#### Section 3: Fleet Table
- **Columns:** Screen Name, Workspace, Status, OS Version, IP Address, Last Seen, Uptime %, Actions
- **Actions:** "Reboot" (future), "OTA Update" (future), "View Details" (future)
- **Status:** Online (green), Offline (red), Warning (amber)
- **Data:** `useApiAdminFleet({ page, search, filter, sort })`

---

## States

### Loading
- Skeleton summary + skeleton rows

### Realtime
- Screen status change: Summary + table row update in real-time

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/fleet/stats` | GET | Fleet health summary |
| `/admin/fleet?page={p}&search={q}&filter={f}` | GET | Paginated fleet |
| `/admin/fleet/{id}/reboot` | POST | Reboot device (future) |
| `/admin/fleet/{id}/ota` | POST | OTA update (future) |

### Realtime Events
| Event | Handler |
|-------|---------|
| `screen:status` | Update fleet summary + table row |

### Backend Limitations
- No device reboot API (future)
- No OTA update API (future)
- No per-device detail page (future)

### Missing APIs
- `GET /admin/fleet/{id}` — Device detail with metrics
- `POST /admin/fleet/{id}/reboot` — Reboot command
- `POST /admin/fleet/{id}/ota` — OTA update command

---

## Acceptance Criteria

### Functional
- [ ] Fleet health summary shows online/offline/warning/total
- [ ] Fleet table displays all columns
- [ ] Search, filter, sort work
- [ ] Realtime status updates
- [ ] Pagination works
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Realtime updates within 1s
- [ ] Status badges color-coded

### Accessibility
- [ ] `<h1>` "Fleet"
- [ ] Summary cards have `aria-label`
- [ ] Table with proper headers

### Performance
- [ ] Summary renders < 500ms
- [ ] Table renders < 1s
- [ ] Realtime update < 1s

### Responsive
- [ ] Summary cards: 4 on desktop, 2 on mobile
- [ ] Table scrolls horizontally on mobile

---

## SCR-AD-06: Admin — Health

### Screen ID
SCR-AD-06

### Purpose
View platform health metrics (API, database, realtime, services).

### Business Goal
System monitoring; uptime tracking; incident detection.

### User Goal
Check platform health; identify issues.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Health" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`System Health — Cloud-Screen Admin`

### Primary CTA
None (monitoring view).

---

## Layout

### Container
- `max-w-[1200px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Health Summary
- **Cards:** API Status, Database Status, Realtime Status, Overall Status
- **Status:** Healthy (green), Degraded (amber), Down (red)

#### Section 2: Service Details
- **List:** Each service with status, response time, uptime %, last check
- **Services:** API, Database, Redis (if applicable), Socket.IO, Player CDN

#### Section 3: Uptime Chart
- **Chart:** Uptime over last 24h/7d/30d
- **Implementation:** Recharts or simple bar chart

---

## States

### Loading
- Skeleton cards + skeleton chart

### Error
- If health API itself is down: "Unable to fetch health data" + "Retry"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/health` | GET | Platform health summary |
| `/admin/health/services` | GET | Per-service details |
| `/admin/health/uptime?period={p}` | GET | Uptime history |

### Backend Limitations
- Health endpoint may not exist (future)
- No historical uptime data (future)

---

## Acceptance Criteria

### Functional
- [ ] Health summary shows status per service
- [ ] Service details show response time and uptime
- [ ] Uptime chart renders
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Status colors: green/amber/red
- [ ] Auto-refresh (future — every 30s)

### Accessibility
- [ ] `<h1>` "System Health"
- [ ] Status cards have `aria-label` with full status text

### Performance
- [ ] Summary renders < 500ms

### Responsive
- [ ] Cards: 4 on desktop, 2 on mobile
- [ ] Chart full width

---

## SCR-AD-07: Admin — Logs

### Screen ID
SCR-AD-07

### Purpose
View platform audit logs and system logs.

### Business Goal
Audit trail; compliance; troubleshooting.

### User Goal
Find specific events; audit user actions; troubleshoot issues.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Logs" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`Logs — Cloud-Screen Admin`

### Primary CTA
None (read-only view).

### Secondary CTA
- Search (server-side)
- Filter (level, service, date range)
- Sort (timestamp, level)
- Export (future)

---

## Layout

### Container
- `max-w-[1400px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Logs" heading

#### Section 2: Toolbar
- Search, level filter (Info, Warning, Error, Critical), service filter, date range

#### Section 3: Logs Table
- **Columns:** Timestamp, Level, Service, Message, User (if applicable), Actions
- **Level badges:** Info (blue), Warning (amber), Error (red), Critical (red bold)
- **Data:** `useApiAdminLogs({ page, search, filter, sort })`
- **Row click:** (Future) Expand to show full log entry

---

## States

### Loading
- Skeleton rows

### Empty
- "No logs found" (with filters)

### Error
- Error + "Retry"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/logs?page={p}&search={q}&level={l}&service={s}` | GET | Paginated logs |

### Backend Limitations
- Log retention period (backend-defined)
- No real-time log streaming (future — WebSocket)
- No log export (future)

---

## Acceptance Criteria

### Functional
- [ ] Displays logs table with timestamp, level, service, message
- [ ] Level badges color-coded
- [ ] Search, filter, sort work
- [ ] Pagination works
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Level badges visually distinct
- [ ] Timestamps formatted (ISO or relative)

### Accessibility
- [ ] `<h1>` "Logs"
- [ ] Table with proper headers
- [ ] Level badges have `aria-label`

### Performance
- [ ] Table renders < 500ms
- [ ] Search < 1s

### Responsive
- [ ] Table scrolls horizontally on mobile

---

## SCR-AD-08: Admin — Feature Flags

### Screen ID
SCR-AD-08

### Purpose
View and manage feature flags for controlled feature rollout.

### Business Goal
Controlled feature rollout; A/B testing; gradual deployment.

### User Goal
Enable/disable features; target specific workspaces.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Feature Flags" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`Feature Flags — Cloud-Screen Admin`

### Primary CTA
"Create Flag" button (future).

### Secondary CTA
- Search
- Filter (enabled, disabled)

### Danger Actions
- Disable flag (may affect users currently using feature)

---

## Layout

### Container
- `max-w-[1000px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Feature Flags" heading + "Create Flag" button (future)

#### Section 2: Toolbar
- Search, filter

#### Section 3: Flags Table
- **Columns:** Flag Name (monospace), Description, Status (toggle), Scope (global/workspace), Targeting, Created, Actions
- **Status toggle:** Switch (optimistic update)
- **Actions:** "Edit Targeting" (opens dialog with per-workspace toggles)
- **Data:** `useApiAdminFeatureFlags({ search, filter })`

---

## States

### Loading
- Skeleton rows

### Success — Toggle
- Toast: "[Flag Name] enabled" / "disabled"
- Affected workspaces see/hide feature on next page load

### Error — Toggle
- Switch reverts + toast: "Failed to toggle flag"

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Status toggle | Optimistic update → API call → toast or revert |
| Click | "Edit Targeting" | Open targeting dialog with per-workspace toggles |
| Click | "Create Flag" (future) | Open create dialog |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/feature-flags` | GET | List flags |
| `/admin/feature-flags/{id}` | PATCH | Toggle flag |
| `/admin/feature-flags/{id}/targeting` | PUT | Update workspace targeting |
| `/admin/feature-flags` | POST | Create flag (future) |

### Backend Limitations
- No flag creation UI (future — flags may be code-defined)
- No flag analytics (how many users see feature — future)

---

## Acceptance Criteria

### Functional
- [ ] Displays flags table with name, description, status, scope
- [ ] Toggle switch enables/disables flag (optimistic)
- [ ] "Edit Targeting" opens dialog with per-workspace toggles
- [ ] Toggle success shows toast
- [ ] Toggle failure reverts switch + toast
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Toggle animates immediately (optimistic)
- [ ] Flag names in monospace font

### Accessibility
- [ ] `<h1>` "Feature Flags"
- [ ] Toggle: `role="switch"`, `aria-checked`, `aria-label`
- [ ] Table with proper headers

### Performance
- [ ] Table renders < 500ms
- [ ] Toggle < 500ms

### Responsive
- [ ] Table scrolls horizontally on mobile
- [ ] Toggle accessible on touch

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `11-notifications-admin-specs-part1.md` for Notifications, Customers, Staff, Users specs
- See `ux-blueprint/16-admin-ux-blueprint-part2.md` for admin Workspaces, Fleet, Health, Logs, Feature Flags UX blueprint
- See `user-flow-architecture/15-admin-flows.md` for admin flow documentation
- See `product-architecture/09-product-modules.md` M-08 for admin module
