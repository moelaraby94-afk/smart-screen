# Screen Specifications — Notifications & Admin Part 1 (Customers, Staff, Users)

> **Evidence basis:** `ux-blueprint/14-notifications-ux-blueprint.md`, `ux-blueprint/15-admin-ux-blueprint-part1.md`, `user-flow-architecture/14-notification-analytics-flows.md`, `user-flow-architecture/15-admin-flows.md`, `product-architecture/09-product-modules.md` M-08, `information-architecture/06-page-catalog.md` P-NT-01, P-AD-01–P-AD-03

---

## SCR-NT-01: Notifications History

### Screen ID
SCR-NT-01

### Purpose
View full notification history with filtering and actions.

### Business Goal
User engagement; event awareness; audit trail.

### User Goal
See all notifications; filter by type; mark as read.

### Primary Users
All users.

### Permissions
- All users can view their own notifications
- No role restrictions

### Entry Points
- Bell dropdown "View All" link
- Direct URL `/notifications`

### Exit Points
- Click notification → related entity page
- Sidebar navigation

### Navigation
- Sidebar: No active item (notifications is not in sidebar — accessed via bell)
- Breadcrumbs: None

### Page Title
`Notifications — Cloud-Screen`

### Primary CTA
"Mark All as Read" button.

### Secondary CTA
- Filter by type (Screen, Schedule, Team, System)
- Filter by read status (All, Unread, Read)

### Danger Actions
None.

---

## Layout

### Container
- `max-w-[800px] mx-auto px-6 py-6`
- Notification list: `flex flex-col gap-1`

### Page Sections

#### Section 1: Page Header
- "Notifications" heading
- "Mark All as Read" button (if unread > 0)
- Filter tabs: All | Unread | Read
- Type filter dropdown

#### Section 2: Notification List
- **Items:** Icon (by type), message, timestamp, unread indicator (blue dot)
- **Click:** Mark as read + navigate to related entity
- **Data:** `useApiNotifications({ page, filter, type })` — paginated
- **Empty:** "No notifications" with icon
- **Pagination:** "Load More" button (max 50 in memory — SCL-03)

---

## Component Tree

```
<NotificationsPage>
  <PageHeader>
    <Heading level={1}>Notifications</Heading>
    <Button variant="ghost" onClick={markAllRead}>Mark All as Read</Button>
  </PageHeader>
  <Toolbar>
    <Tabs value={filter} onValueChange={setFilter}>
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="unread">Unread</TabsTrigger>
      <TabsTrigger value="read">Read</TabsTrigger>
    </Tabs>
    <FilterSelect name="type" options={typeOptions} />
  </Toolbar>
  <NotificationList>
    {notifications.map(n => (
      <NotificationItem
        key={n.id}
        notification={n}
        onClick={() => handleNotificationClick(n)}
      />
    ))}
  </NotificationList>
  {hasMore && <Button variant="ghost" onClick={loadMore}>Load More</Button>}
</NotificationsPage>
```

### Component Details

#### NotificationItem
- **Props:** `notification: Notification`, `onClick: () => void`
- **UI:** Row with icon (by type), message text, relative timestamp, unread blue dot
- **Unread:** `bg-primary/5` background; blue dot on right
- **Read:** Normal background; no dot
- **Click:** Mark as read (API) + navigate to related entity
- **Hover:** `bg-muted/50`
- **Accessibility:** `role="link"`, `aria-label` with notification text

---

## States

### Loading
- Skeleton notification rows (5-10)

### Empty — No Notifications
- "No notifications" + bell icon

### Empty — No Unread
- (When filter = unread) "You're all caught up!" + checkmark icon

### Error
- List: Error + "Retry"

### Realtime
- New notification: Prepended to list (if filter matches)
- Bell badge: Increments

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/notifications?page={p}&filter={f}&type={t}` | GET | Paginated notifications |
| `/notifications/{id}/read` | PUT | Mark as read |
| `/notifications/read-all` | PUT | Mark all as read |

### Realtime Events
| Event | Handler |
|-------|---------|
| `notification:new` | Prepend to list + bell badge |

### Backend Limitations
- Max 50 notifications in memory (SCL-03) — "Load More" for older
- No notification delete (only mark as read)
- No notification preferences per-type in list (configured in Settings)

---

## Acceptance Criteria

### Functional
- [ ] Displays notification list with icons and timestamps
- [ ] Unread notifications have blue dot and highlighted background
- [ ] Click marks as read and navigates to entity
- [ ] "Mark All as Read" works
- [ ] Filter tabs (All/Unread/Read) work
- [ ] Type filter works
- [ ] "Load More" loads older notifications
- [ ] Realtime: new notifications appear

### UX
- [ ] Skeleton loading
- [ ] Empty states for no notifications and no unread
- [ ] Relative timestamps ("2m ago", "1h ago")
- [ ] No layout shift

### Accessibility
- [ ] `<h1>` "Notifications"
- [ ] Items: `role="link"`, `aria-label`
- [ ] Tabs: `role="tablist"`, `role="tab"`
- [ ] Keyboard: Tab through items, Enter to open

### Performance
- [ ] List renders < 500ms
- [ ] Realtime notification < 1s

### Responsive
- [ ] Full width on mobile
- [ ] Items stack with icon + text + timestamp

---

## SCR-AD-01: Admin — Customers

### Screen ID
SCR-AD-01

### Purpose
View and manage all customers (workspaces) in the platform.

### Business Goal
Customer management; support; oversight.

### User Goal
Find customer; view details; impersonate; manage subscription.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only
- Sidebar Admin group: Super-Admin only

### Entry Points
- Sidebar "Customers" (Admin group)

### Exit Points
- "Impersonate" → Client Overview (impersonation mode)
- Click customer → Customer detail (future)
- Sidebar navigation

### Navigation
- Sidebar active: "Customers" (Admin group)
- Breadcrumbs: None (top-level admin page)

### Page Title
`Customers — Cloud-Screen Admin`

### Primary CTA
"Impersonate" action (per row).

### Secondary CTA
- Search (server-side)
- Filter (plan, status, created date)
- Sort (name, created date, screens count)
- Export CSV (future)

---

## Layout

### Container
- `max-w-[1400px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Customers" heading + total count

#### Section 2: Toolbar
- Search input (name, email, workspace name)
- Filter dropdowns (plan, status)
- Sort dropdown

#### Section 3: Customers Table
- **Columns:** Workspace Name, Owner Name, Owner Email, Plan, Screens Count, Status, Created Date, Actions
- **Actions:** "Impersonate", "Suspend" (future), "Delete" (future)
- **Data:** `useApiAdminCustomers({ page, search, filter, sort })` — server-side paginated
- **Row click:** (Future) Navigate to customer detail
- **Pagination:** Standard pagination

---

## States

### Loading
- Skeleton table rows

### Empty — No Customers
- "No customers found" (unlikely but possible with filters)

### Error
- Table: Error + "Retry"

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Impersonate" (actions) | Open confirmation dialog → impersonate |
| Search | Type | Debounced 300ms, server-side |
| Filter | Select | Update query, refetch |
| Sort | Select | Update query, refetch |
| Click | Row (future) | Navigate to customer detail |

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/customers?page={p}&search={q}&filter={f}` | GET | Paginated customers |
| `/admin/customers/{id}/impersonate` | POST | Start impersonation |
| `/admin/customers/{id}/suspend` | POST | Suspend workspace (future) |

### Backend Limitations
- No customer detail endpoint (future — currently just list)
- No bulk actions (future)

---

## Acceptance Criteria

### Functional
- [ ] Displays customers table with all columns
- [ ] Search filters by name/email/workspace (server-side)
- [ ] Filter and sort work
- [ ] "Impersonate" opens confirmation and starts impersonation
- [ ] Impersonation banner visible after impersonating
- [ ] Pagination works
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Server-side search (debounced)
- [ ] Impersonation confirmation dialog

### Accessibility
- [ ] `<h1>` "Customers"
- [ ] Table: `role="table"` with proper headers
- [ ] Actions have `aria-label`
- [ ] Keyboard: Tab through table, Enter on actions

### Performance
- [ ] Table renders < 500ms
- [ ] Search < 1s

### Responsive
- [ ] Table scrolls horizontally on mobile
- [ ] Search and filters stack on mobile

---

## SCR-AD-02: Admin — Staff

### Screen ID
SCR-AD-02

### Purpose
View and manage platform staff (Super-Admin accounts).

### Business Goal
Staff management; access control for admin panel.

### User Goal
View staff list; add/remove staff.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Staff" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`Staff — Cloud-Screen Admin`

### Primary CTA
"Add Staff" button (future).

---

## Layout

### Container
- `max-w-[1000px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Staff" heading + "Add Staff" button (future)

#### Section 2: Staff Table
- **Columns:** Name, Email, Role (Super-Admin), Created Date, Last Active, Actions
- **Actions:** "Remove Staff" (future)
- **Data:** `useApiAdminStaff()`

---

## States

### Loading
- Skeleton rows

### Empty
- "No staff members" (unlikely — at least one Super-Admin exists)

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/staff` | GET | List staff |
| `/admin/staff` | POST | Add staff (future) |
| `/admin/staff/{id}` | DELETE | Remove staff (future) |

### Backend Limitations
- No staff add/remove UI (future — currently staff managed via backend)
- No role levels within staff (all Super-Admin)

---

## Acceptance Criteria

### Functional
- [ ] Displays staff table with name, email, role, dates
- [ ] Page hidden for non-Super-Admin
- [ ] (Future) Add/remove staff works

### UX
- [ ] Skeleton loading

### Accessibility
- [ ] `<h1>` "Staff"
- [ ] Table with proper headers

### Performance
- [ ] Table renders < 500ms

### Responsive
- [ ] Table scrolls horizontally on mobile

---

## SCR-AD-03: Admin — Users

### Screen ID
SCR-AD-03

### Purpose
View all users across all workspaces in the platform.

### Business Goal
User oversight; support; analytics.

### User Goal
Find user; view their workspaces; support troubleshooting.

### Primary Users
Super-Admin only.

### Permissions
- Page access: Super-Admin only

### Entry Points
- Sidebar "Users" (Admin group)

### Exit Points
- Sidebar navigation

### Page Title
`Users — Cloud-Screen Admin`

### Primary CTA
None (read-only view).

### Secondary CTA
- Search (server-side)
- Filter (workspace, role, status)
- Sort (name, created date)

---

## Layout

### Container
- `max-w-[1400px] mx-auto px-6 py-6`

### Page Sections

#### Section 1: Page Header
- "Users" heading + total count

#### Section 2: Toolbar
- Search, filter, sort

#### Section 3: Users Table
- **Columns:** Name, Email, Workspaces Count, Role (in current workspace), Created Date, Last Active, Actions
- **Actions:** "View Workspaces" (future), "Impersonate" (future — if user is workspace owner)
- **Data:** `useApiAdminUsers({ page, search, filter, sort })`

---

## States

### Loading
- Skeleton rows

### Empty
- "No users found" (with filters)

### Error
- Error + "Retry"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/admin/users?page={p}&search={q}&filter={f}` | GET | Paginated users |

### Backend Limitations
- No user detail page (future)
- No user workspace listing endpoint (future)
- No user impersonation from user list (must go through customer)

---

## Acceptance Criteria

### Functional
- [ ] Displays users table with all columns
- [ ] Search, filter, sort work (server-side)
- [ ] Pagination works
- [ ] Page hidden for non-Super-Admin

### UX
- [ ] Skeleton loading
- [ ] Server-side search

### Accessibility
- [ ] `<h1>` "Users"
- [ ] Table with proper headers

### Performance
- [ ] Table renders < 500ms

### Responsive
- [ ] Table scrolls horizontally on mobile

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `12-admin-specs-part2.md` for Workspaces, Fleet, Health, Logs, Feature Flags specs
- See `ux-blueprint/14-notifications-ux-blueprint.md` for notifications UX blueprint
- See `ux-blueprint/15-admin-ux-blueprint-part1.md` for admin Customers, Staff, Users UX blueprint
- See `user-flow-architecture/14-notification-analytics-flows.md` for notification flow
- See `user-flow-architecture/15-admin-flows.md` for admin flow documentation
- See `product-architecture/09-product-modules.md` M-08 for admin module
