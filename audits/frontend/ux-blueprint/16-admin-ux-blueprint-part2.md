# Admin UX Blueprint — Part 2: Workspaces, Fleet, Health, Logs & Feature Flags

> **Evidence basis:** `05-page-type-ux-rules.md` §2-3, `information-architecture/06-page-catalog.md` P-AD-04 through P-AD-08, `audits/frontend/15-admin-panel.md`, `product-architecture/09-product-modules.md` M-08
> **Purpose:** Complete UX blueprint for Admin Workspaces, Fleet, Health, Logs, and Feature Flags pages
> **Part:** 2 of 2 (Admin)

---

## P-AD-04: Workspaces

### 1. Purpose
- **Business purpose:** Cross-customer workspace management; system oversight
- **User purpose:** View all workspaces, manage workspace data, troubleshoot workspace issues
- **Success criteria:** Admin can find a workspace within 10 seconds; admin can view workspace details
- **Failure criteria:** Can't search; can't see workspace contents; missing key data

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** System oversight; used for troubleshooting and management

### 4. Primary Goal
Find and manage workspaces across all customers

### 5. Primary Action
Search (by workspace name or owner email)

### 6. Secondary Actions
1. Filter by plan, status, screen count range
2. Click workspace row → Workspace detail (future)
3. View workspace stats (screens, playlists, members)
4. Suspend/activate workspace
5. Delete workspace (danger zone — future)

### 7. Information Priority
1. Workspace name — **identification**
2. Owner name/email — **contact**
3. Plan — **revenue tier**
4. Screen count — **scale**
5. Member count — **team size**
6. Status — **state**
7. Created date — **tenure**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Workspaces" + search bar
- Filter bar: plan, status

**Middle:**
- Workspaces table: Name, Owner, Plan, Screens, Members, Status, Created, Actions

**Bottom:**
- Pagination

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search and filter
- **Priority:** 1
- **Contents:** Search input, plan filter, status filter
- **Visibility:** Always

#### Section 2: Workspaces Table
- **Purpose:** Display all workspaces
- **Priority:** 1
- **Contents:** Table with columns: Name, Owner, Plan, Screens, Members, Status, Created, Actions
- **Dependencies:** `useApiAdminWorkspaces` (SWR, paginated, server-side search)
- **Visibility:** Always (empty state if no workspaces)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Search input | Input (text) | Toolbar |
| Plan filter | Select (Radix) | Toolbar |
| Status filter | Select (Radix) | Toolbar |
| Workspaces table | Table (admin style) | Table |
| Workspace name | Text (medium) | Table |
| Owner name | Text | Table |
| Owner email | Text (muted) | Table |
| Plan badge | Badge | Table |
| Screen count | Text | Table |
| Member count | Text | Table |
| Status badge | Badge (colored) | Table |
| Created date | Text (muted) | Table |
| "Actions" menu | DropdownMenu | Table |
| "View" action | Dropdown item | Table |
| "Suspend" action | Dropdown item | Table |
| "Activate" action | Dropdown item | Table |
| Pagination | Pagination | Bottom |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Workspace row | Navigates to workspace detail (future) |
| Click | "Actions" menu | Opens dropdown |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Filters table |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with rows |
| Loading | Initial load | 5-8 skeleton rows |
| Empty — no workspaces | 0 workspaces | "No workspaces found." |
| Suspending | Confirm clicked | Spinner |
| Suspended | API 200 | Status badge updates + toast |
| Activated | API 200 | Status badge updates + toast |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Workspace suspended | Toast: "[Workspace Name] suspended" |
| Workspace activated | Toast: "[Workspace Name] activated" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| View or suspend? | Workspace issue | View detail or suspend | View first |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Suspend wrong workspace | AlertDialog with workspace name | Must confirm |

### 16. Accessibility
- Same as other admin tables (see `15-admin-ux-blueprint-part1.md` §16)

### 17. Mobile Experience
- Card list (stacked rows) on mobile

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Large lists | Server-side pagination |
| Search | Server-side (workspace list can be 1000+) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Workspace detail page | New route `/admin/workspaces/{id}` |
| Storage usage column | Table column |
| MRR column | Table column |
| Delete workspace | Actions menu (danger zone) |
| Export workspaces | Toolbar menu |

### 20. UX Notes
- Workspaces page is different from Customers: a customer can have multiple workspaces
- Owner column helps identify the primary contact for each workspace
- Screen count and member count give quick scale assessment
- Workspace detail page (future) should show: screens, playlists, schedules, team, billing, activity log
- Suspend workspace should warn: "All screens will stop playing. All team members will lose access."

---

## P-AD-05: Fleet

### 1. Purpose
- **Business purpose:** Device fleet management; hardware oversight; troubleshooting
- **User purpose:** View all screens across all workspaces; check device health; manage OTA updates (future)
- **Success criteria:** Admin can find a screen within 10 seconds; admin can see device health at a glance
- **Failure criteria:** Can't search; can't see device details; missing health indicators

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** System oversight; device management; troubleshooting support

### 4. Primary Goal
Monitor and manage all screens across all workspaces

### 5. Primary Action
Search (by screen name, pairing code, or workspace)

### 6. Secondary Actions
1. Filter by status (online/offline/warning), workspace, OS version (future)
2. Click screen row → Screen detail (admin view)
3. View device info (OS, version, last seen, IP)
4. Send OTA update (future)
5. Reboot device (future)
6. Export fleet list (future)

### 7. Information Priority
1. Screen name — **identification**
2. Workspace name — **ownership**
3. Status (online/offline/warning) — **health**
4. OS version — **software state**
5. Last seen — **connectivity**
6. IP address — **network**
7. Pairing code — **identification**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Fleet" + search bar
- Filter bar: status, workspace
- Fleet health summary: online/offline/warning counts (mini dashboard)

**Middle:**
- Fleet table: Name, Workspace, Status, OS, Last Seen, IP, Actions

**Bottom:**
- Pagination

### 9. Page Sections

#### Section 1: Fleet Health Summary
- **Purpose:** At-a-glance fleet status
- **Priority:** 1
- **Contents:** Online count (green), Offline count (red), Warning count (amber), Total count
- **Dependencies:** `useApiAdminFleetStats` (SWR)
- **Visibility:** Always

#### Section 2: Toolbar
- **Purpose:** Search and filter
- **Priority:** 1
- **Contents:** Search input, status filter, workspace filter
- **Visibility:** Always

#### Section 3: Fleet Table
- **Purpose:** Display all screens
- **Priority:** 1
- **Contents:** Table with columns: Name, Workspace, Status, OS, Last Seen, IP, Actions
- **Dependencies:** `useApiAdminFleet` (SWR, paginated, server-side search)
- **Visibility:** Always (empty state if no screens)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Health summary card | Card | Health Summary |
| Online count | Text (green, large) | Health Summary |
| Offline count | Text (red, large) | Health Summary |
| Warning count | Text (amber, large) | Health Summary |
| Total count | Text (muted) | Health Summary |
| Search input | Input (text) | Toolbar |
| Status filter | Select (Radix) | Toolbar |
| Workspace filter | Select (Radix) | Toolbar |
| Fleet table | Table (admin style) | Table |
| Screen name | Text (medium) | Table |
| Workspace name | Text (muted) | Table |
| Status badge | Badge (colored) | Table |
| OS version | Text (mono, muted) | Table |
| Last seen | Text (muted) | Table |
| IP address | Text (mono, muted) | Table |
| "Actions" menu | DropdownMenu | Table |
| "View" action | Dropdown item | Table |
| "Reboot" action | Dropdown item (future) | Table |
| "OTA Update" action | Dropdown item (future) | Table |
| Pagination | Pagination | Bottom |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Screen row | Navigates to admin screen detail (future) |
| Click | Health summary | (Future) Filters table by that status |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Filters table |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with rows + health summary |
| Loading | Initial load | Skeleton rows + skeleton summary |
| Empty — no screens | 0 screens | "No screens in the fleet." |
| Realtime — status change | Socket event | Health summary + table row update |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Reboot sent (future) | Toast: "Reboot command sent to [Screen Name]" |
| OTA update sent (future) | Toast: "Update scheduled for [Screen Name]" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| View or reboot? | Screen is offline | View detail (troubleshoot) or reboot (force restart) | View first |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Reboot wrong screen | AlertDialog: "Reboot [Screen Name]?" | Must confirm |
| OTA update wrong screen | AlertDialog: "Send update to [Screen Name]?" | Must confirm |

### 16. Accessibility
- Same as other admin tables

### 17. Mobile Experience
- Health summary: stacked counts
- Table: card list
- Filters: stacked

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Large lists | Server-side pagination (20 per page) |
| Realtime | Socket.IO for status changes |
| Health summary | Separate SWR endpoint (cached, revalidates on socket event) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| OTA updates | Actions menu + bulk action |
| Remote reboot | Actions menu |
| Map view | Toggle in toolbar |
| Device groups | New filter dimension |
| Firmware version tracking | Table column |
| Auto-update policies | New settings page |
| Fleet export | Toolbar menu |

### 20. UX Notes
- Fleet health summary gives instant system overview (similar to Overview widget but cross-workspace)
- IP address and OS version are admin-only fields (not shown in client screen detail)
- Realtime status updates are critical for fleet monitoring
- Consider adding "Last OTA update" column for tracking update status
- Fleet table can be very large (1000+ screens) — server-side search and pagination are essential
- Map view (future) would be valuable for geographically distributed fleets

---

## P-AD-06: System Health

### 1. Purpose
- **Business purpose:** System monitoring; uptime tracking; proactive issue detection
- **User purpose:** Check system health, identify issues, view metrics
- **Success criteria:** Admin can assess system health within 5 seconds
- **Failure criteria:** Missing metrics; unclear status; no alerts

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Low
- **Reasoning:** Monitoring tool; used for proactive checks; not daily operations

### 4. Primary Goal
Assess system health at a glance

### 5. Primary Action
No primary action — this is a monitoring dashboard

### 6. Secondary Actions
1. View individual service health
2. View metrics (CPU, memory, response time)
3. View uptime percentage
4. Click service → Service detail (future)
5. Refresh metrics

### 7. Information Priority
1. Overall system status (Healthy/Degraded/Down) — **most critical**
2. Individual service status (API, Database, WebSocket, Player CDN) — **components**
3. Key metrics (response time, error rate, uptime) — **performance**
4. Active alerts — **issues**
5. Last checked timestamp — **freshness**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "System Health" + overall status badge (large, colored)
- Service health cards (grid: API, Database, WebSocket, CDN)

**Middle:**
- Metrics charts (response time, error rate, uptime)
- Active alerts list

**Bottom:**
- Last checked timestamp + "Refresh" button

### 9. Page Sections

#### Section 1: Overall Status
- **Purpose:** System health at a glance
- **Priority:** 1
- **Contents:** Large status badge (Healthy/Degraded/Down), uptime percentage
- **Dependencies:** `useApiSystemHealth` (SWR, polling every 30s)
- **Visibility:** Always

#### Section 2: Service Cards
- **Purpose:** Individual service health
- **Priority:** 1
- **Contents:** Cards for API, Database, WebSocket, Player CDN — each with status badge and key metric
- **Visibility:** Always

#### Section 3: Metrics
- **Purpose:** Performance indicators
- **Priority:** 2
- **Contents:** Response time chart, error rate chart, uptime percentage
- **Visibility:** Always

#### Section 4: Active Alerts
- **Purpose:** Current issues
- **Priority:** 2
- **Contents:** List of active alerts with severity, message, timestamp
- **Visibility:** Only if alerts exist

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Overall status badge | Badge (large, colored) | Overall Status |
| Uptime percentage | Text (large) | Overall Status |
| Service card | Card | Service Cards |
| Service name | Text (medium) | Service Cards |
| Service status | Badge | Service Cards |
| Service metric | Text (muted) | Service Cards |
| Response time chart | Chart (line) | Metrics |
| Error rate chart | Chart (line) | Metrics |
| Alert item | List item | Active Alerts |
| Alert severity | Badge (colored) | Active Alerts |
| Alert message | Text | Active Alerts |
| Alert timestamp | Text (muted) | Active Alerts |
| "Refresh" button | Button (outline) | Bottom |
| Last checked | Text (muted) | Bottom |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Service card | (Future) Navigates to service detail |
| Click | "Refresh" | Forces SWR revalidation |
| Click | Alert item | (Future) Navigates to alert detail |
| Keyboard | Tab | Through status → services → alerts |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | All sections with data |
| Loading | Initial load | Skeleton cards + skeleton charts |
| Refreshing | "Refresh" or auto-poll | Subtle opacity pulse |
| Healthy | All services up | Green status badge |
| Degraded | Some services degraded | Amber status badge |
| Down | Critical service down | Red status badge |
| New alert | API returns alert | Alert appears in list with animation |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Status change | Status badge color changes + toast (if degraded/down) |
| New alert | Alert appears in list |
| Refresh | Subtle reload animation |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Investigate or wait? | Service degraded | Investigate (click service) or wait (auto-recovery) | Investigate if persistent |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Misread metrics | Metrics have clear labels and units | — |
| Ignore alerts | Alerts are visually prominent (colored badges) | — |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through status → services → alerts |
| Screen reader | Status badge has `aria-label` with full status text |
| ARIA | Charts have `aria-label` describing data |
| Live region | Status changes announced via `aria-live="polite"` |
| Contrast | Status badges meet 3:1 |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column, stacked |
| Service cards | 1 per row, full width |
| Charts | Full width, simplified |
| Alerts | Full width list |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Data freshness | SWR polling every 30 seconds |
| Charts | Lightweight chart library, aggregated data |
| Auto-refresh | Background polling (no manual refresh needed) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Service detail page | New route `/admin/health/{service}` |
| Historical metrics | Time range selector |
| Alert subscriptions | Email/SMS alert configuration |
| Status page (public) | External page for customers |
| Incident management | New section for tracking incidents |
| SLA monitoring | Metrics section enhancement |

### 20. UX Notes
- System health is a monitoring page — no primary action, just observation
- Auto-polling (30s) ensures data is fresh without manual refresh
- Overall status should be immediately visible (large badge, color-coded)
- Alerts should be sorted by severity (critical first)
- Consider adding "Uptime last 30 days" as a headline metric
- Status page (public, future) would reduce support tickets during outages
- This page is for proactive monitoring — most admins check it occasionally, not daily

---

## P-AD-07: Logs

### 1. Purpose
- **Business purpose:** System debugging; audit trail; error investigation
- **User purpose:** Search and filter system logs; find specific errors; trace issues
- **Success criteria:** Admin can find a specific log entry within 15 seconds
- **Failure criteria:** Can't search; too many logs; no filtering; missing context

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Low
- **Reasoning:** Debugging tool; used during incident investigation; not daily operations

### 4. Primary Goal
Search and filter system logs for debugging

### 5. Primary Action
Search (by keyword, error code, or date)

### 6. Secondary Actions
1. Filter by level (ERROR, WARN, INFO, DEBUG)
2. Filter by service (API, Database, WebSocket, etc.)
3. Filter by date range
4. Click log entry → View full details (expand or dialog)
5. Export logs (future)

### 7. Information Priority
1. Timestamp — **when**
2. Log level (ERROR/WARN/INFO/DEBUG) — **severity**
3. Message — **what happened**
4. Service — **where**
5. Request ID / Trace ID — **correlation**
6. Stack trace (for errors) — **debugging detail**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Logs" + search bar
- Filter bar: level filter, service filter, date range picker

**Middle:**
- Log entries list (reverse chronological, newest first)
- Each entry: timestamp, level badge, service, message

**Bottom:**
- "Load More" button

**Collapsed:**
- Full log details (stack trace, metadata) — expand on click

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search and filter logs
- **Priority:** 1
- **Contents:** Search input, level filter, service filter, date range picker
- **Visibility:** Always

#### Section 2: Log List
- **Purpose:** Display log entries
- **Priority:** 1
- **Contents:** List of log entries with timestamp, level, service, message
- **Dependencies:** `useApiAdminLogs` (SWR, paginated, server-side search)
- **Visibility:** Always (empty state if no logs match)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Search input | Input (text) | Toolbar |
| Level filter | Select (Radix) | Toolbar |
| Service filter | Select (Radix) | Toolbar |
| Date range picker | DatePicker (Radix) | Toolbar |
| Log entry | List item | Log List |
| Timestamp | Text (mono, muted) | Log List |
| Level badge | Badge (colored) | Log List |
| Service name | Text (muted) | Log List |
| Message | Text | Log List |
| Expand button | Button (icon, ghost) | Log List |
| Stack trace | Text (mono, pre) | Expanded |
| "Load More" button | Button (outline) | Bottom |
| Empty State | EmptyState | Log List |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Log entry | Expands to show full details (stack trace, metadata) |
| Click | "Load More" | Loads older log entries |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Filters log list |
| Keyboard | Tab | Through toolbar → log entries |
| Keyboard | Enter | Expands focused log entry |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Log list with entries |
| Loading | Initial load | 5-8 skeleton rows |
| Searching | Type in search | Spinner + skeleton rows |
| Empty — no logs | 0 logs match | "No logs found matching your filters." + "Clear Filters" |
| Expanding | Click entry | Entry expands with slide-down animation |
| Loading more | "Load More" clicked | Spinner + rows appended |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Filter applied | List updates + chips appear |
| Entry expanded | Stack trace visible |
| Search complete | Results displayed |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Which level? | Filtering logs | ERROR only, ERROR+WARN, or all | ERROR+WARN (focus on issues) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Filter too narrowly | Filter chips visible, "Clear All" available | Clear filters |
| Miss relevant logs | Date range is explicit | Widen date range |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through toolbar → log entries |
| Screen reader | Level badge has `aria-label` (e.g., "Error log entry") |
| ARIA | Expanded entry has `aria-expanded="true"` |
| Contrast | Level badges meet 3:1 (red ERROR, amber WARN, blue INFO, muted DEBUG) |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column |
| Toolbar | Stacked: search → filters → date |
| Log entries | Full width, stacked info |
| Stack trace | Full width, horizontal scroll if needed |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Large log volumes | Server-side pagination (50 per page) |
| Search | Server-side (logs can be millions) |
| Date range | Server-side filtering by date |
| Rendering | Virtualized list for fast scroll (future) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Log export | Toolbar menu (CSV/JSON) |
| Saved log filters | Toolbar presets |
| Real-time log streaming | WebSocket-based live logs |
| Log retention settings | Admin settings |
| Structured log search | Query language (e.g., `level:error AND service:api`) |
| Log alerting | Email/Slack on specific log patterns |

### 20. UX Notes
- Logs are primarily for debugging — the UX should prioritize search and filter speed
- Level badges: red (ERROR), amber (WARN), blue (INFO), muted (DEBUG)
- Timestamps should be precise (to the millisecond) for correlation
- Stack traces should be in monospace font with syntax highlighting (future)
- Default filter should be ERROR+WARN (focus on issues, not noise)
- Consider adding "Copy" button on log entries for sharing in support tickets
- Date range is critical — without it, search returns too many results
- Log list should be reverse chronological (newest first) by default
- This page is used during incidents — it must be fast and reliable even under load

---

## P-AD-08: Feature Flags

### 1. Purpose
- **Business purpose:** Controlled feature rollout; A/B testing; gradual deployment
- **User purpose:** Enable/disable features per workspace; manage rollout strategy
- **Success criteria:** Admin can toggle a feature flag within 10 seconds; admin can see which workspaces have which features
- **Failure criteria:** Can't find flags; can't toggle; unclear feature descriptions; no workspace targeting

### 2. Target Users
- **Primary user:** Super-Admin
- **Permissions:** Super-Admin only
- **Visibility:** Authenticated + Super-Admin + admin mode

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Feature management; used during rollouts; important for controlled deployment

### 4. Primary Goal
Manage feature flags and control feature rollout

### 5. Primary Action
Toggle feature flag (enable/disable)

### 6. Secondary Actions
1. Search flags by name
2. Filter by status (enabled/disabled)
3. Filter by scope (global/per-workspace)
4. View flag details (description, affected features, workspace list)
5. Set flag per workspace (targeted rollout)
6. Create new flag (future)

### 7. Information Priority
1. Flag name — **identification**
2. Flag status (enabled/disabled) — **current state**
3. Flag scope (global/per-workspace) — **targeting**
4. Flag description — **what it controls**
5. Affected workspaces count — **reach**
6. Last modified — **change tracking**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Feature Flags" + search bar
- Filter bar: status filter, scope filter

**Middle:**
- Flags table: Name, Status, Scope, Description, Workspaces, Last Modified, Actions

**Bottom:**
- Pagination (if needed)

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Search and filter
- **Priority:** 1
- **Contents:** Search input, status filter, scope filter
- **Visibility:** Always

#### Section 2: Flags Table
- **Purpose:** Display and manage feature flags
- **Priority:** 1
- **Contents:** Table with columns: Name, Status (toggle), Scope, Description, Workspaces, Last Modified, Actions
- **Dependencies:** `useApiAdminFeatureFlags` (SWR)
- **Visibility:** Always (empty state if no flags)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Search input | Input (text) | Toolbar |
| Status filter | Select (Radix) | Toolbar |
| Scope filter | Select (Radix) | Toolbar |
| Flags table | Table (admin style) | Table |
| Flag name | Text (mono, medium) | Table |
| Status toggle | Switch (Radix) | Table |
| Scope badge | Badge | Table |
| Description | Text (muted) | Table |
| Workspace count | Text | Table |
| Last modified | Text (muted) | Table |
| "Actions" menu | DropdownMenu | Table |
| "Edit Targeting" action | Dropdown item | Table |
| "View Workspaces" action | Dropdown item | Table |
| Edit targeting dialog | Dialog (Radix) | Table |
| Workspace list | List | Dialog |
| Workspace toggle | Switch (Radix) | Dialog |
| "Save Targeting" button | Button (default) | Dialog |
| Empty State | EmptyState | Table |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Status toggle | Toggles flag (immediate with toast) |
| Click | "Edit Targeting" | Opens dialog with workspace list |
| Click | Workspace toggle (in dialog) | Toggles flag for that workspace |
| Click | "Save Targeting" | Saves workspace-specific flag settings |
| Search | Type | Debounced 300ms |
| Filter | Select | Filters table |
| Keyboard | Tab | Through toolbar → table |
| Keyboard | Space | Toggles focused switch |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Table with flags |
| Loading | Initial load | 3-5 skeleton rows |
| Empty — no flags | 0 flags | "No feature flags configured." |
| Toggling flag | Switch clicked | Switch animates immediately + API call |
| Toggle success | API 200 | Toast: "[Flag Name] enabled" or "disabled" |
| Toggle error | API error | Switch reverts + toast: "Failed to toggle flag" |
| Saving targeting | "Save Targeting" clicked | Dialog spinner |
| Targeting saved | API 200 | Toast: "Flag targeting saved" + dialog closes |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Flag enabled | Toast: "[Flag Name] enabled" |
| Flag disabled | Toast: "[Flag Name] disabled" |
| Targeting saved | Toast: "Flag targeting saved" |
| Toggle error | Switch reverts + toast: "Failed to toggle flag" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Global or per-workspace? | Setting flag scope | Global (all workspaces) or per-workspace (targeted) | Global (simpler) |
| Enable or disable? | Toggling flag | Enable (roll out feature) or disable (roll back) | Context-dependent |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Enable flag for wrong workspace | Workspace list shows names | Toggle off in targeting dialog |
| Disable flag accidentally | Toggle requires deliberate click (not accidental) | Toggle back on |
| Enable globally instead of targeted | Scope badge is visible | Change to per-workspace and target specific workspaces |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through toolbar → table → toggles |
| Screen reader | Switch has `aria-label` with flag name |
| ARIA | Switch has `role="switch"` and `aria-checked` (Radix) |
| Focus | Visible focus ring on switch |
| Touch targets | Switches ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Table | Card list (stacked rows) |
| Toggles | Full width rows with switch on end |
| Targeting dialog | Full screen |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch flags (typically < 50 flags, fast) |
| Toggle | Optimistic update (switch animates immediately, reverts on error) |
| Targeting dialog | SWR fetch workspace list (paginated if 100+) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Create new flag | Toolbar button |
| Flag description editor | Edit dialog |
| Flag rollout percentage | Dialog enhancement (e.g., 50% of workspaces) |
| Flag schedule | Time-based enable/disable |
| Flag history | New sub-page or section |
| Flag groups | Group related flags |
| A/B test configuration | New section or dialog |
| Flag export/import | Toolbar menu |

### 20. UX Notes
- Flag toggle should be optimistic (animate immediately, revert on error) for snappy UX
- Flag names should be in monospace font (technical identifiers, e.g., `multi_zone_layouts`)
- Description should explain what the flag controls in plain language
- Per-workspace targeting is important for gradual rollout (enable for beta customers first)
- Consider showing "Affected features" list in the description (what UI changes when flag is on)
- Flag history (who toggled what and when) is important for audit — plan for future
- This page directly affects the client UI — toggling a flag changes what users see
- Frontend gating: flag OFF = feature hidden in UI; flag ON = feature visible (NP-08)

---

## Cross-References

- See `15-admin-ux-blueprint-part1.md` for Customers, Staff, and Users pages
- See `05-page-type-ux-rules.md` §2-3 for dashboard and list page type rules
- See `information-architecture/06-page-catalog.md` P-AD-04 through P-AD-08
- See `audits/frontend/15-admin-panel.md` for admin audit
- See `product-architecture/09-product-modules.md` M-08 for module definition
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
- See `03-component-ux-standards.md` §2 for table UX standards
