# Notifications UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md` §9, `information-architecture/06-page-catalog.md` P-NT-01, `audits/frontend/17-notifications.md`, `product-architecture/09-product-modules.md` Shell, `04-feature-ux-standards.md` §1
> **Purpose:** Complete UX blueprint for the Notifications history page

---

## P-NT-01: Notifications History

### 1. Purpose
- **Business purpose:** Event history; audit trail; user engagement
- **User purpose:** Review past notifications, find specific events, navigate to related pages
- **Success criteria:** User can find a specific notification within 10 seconds; user can clear all within 1 click
- **Failure criteria:** Can't find events; no filtering; list too long; no navigation to related pages

### 2. Target Users
- **Primary user:** All users (Owner, Editor, Viewer)
- **Secondary user:** None
- **Permissions:** All roles can view their own notifications
- **Visibility:** Authenticated + has workspace. Accessed via bell dropdown "View All" link.

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Not a daily destination; accessed when user needs to review history; important for troubleshooting

### 4. Primary Goal
Review notification history and navigate to related pages

### 5. Primary Action
No single primary action — this is a history/log page. "Clear All" is the most prominent action.

### 6. Secondary Actions
1. Filter by type (Screen, Schedule, Team, System)
2. Click notification → Navigate to related page
3. "Clear All" — mark all as read
4. "Load More" — load older notifications
5. Individual mark as read (click)

### 7. Information Priority
1. Notification message — **what happened**
2. Notification type icon — **categorization**
3. Timestamp — **when**
4. Unread indicator — **new vs. seen**
5. Related entity link — **navigation**
6. Type filter — **narrowing**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Notifications" + "Clear All" button (top-end)
- Filter bar: type filter dropdown

**Middle:**
- Notification list (full width, vertical list)
- Each item: icon, message, timestamp, type badge

**Bottom:**
- "Load More" button (if more notifications exist)

**Collapsed:**
- Advanced filters (date range — future)
- Search within notifications (future)

**Hidden:**
- Notification details (navigates to related page instead of expanding)

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** Filter and manage notifications
- **Priority:** 1
- **Contents:** Type filter dropdown, "Clear All" button
- **Dependencies:** None (filter is client-side or query param)
- **Visibility:** Always

#### Section 2: Notification List
- **Purpose:** Display notification history
- **Priority:** 1
- **Contents:** List of notification items with icon, message, timestamp, unread indicator
- **Dependencies:** `useApiNotifications` (SWR, paginated, workspace-scoped)
- **Visibility:** Always (empty state if no notifications)
- **Future:** Search within notifications, date range filter

#### Section 3: Load More
- **Purpose:** Pagination for large notification lists
- **Priority:** 2
- **Contents:** "Load More" button
- **Dependencies:** Total notification count, current page
- **Visibility:** Only when more notifications exist beyond current page
- **Future:** Infinite scroll (with Intersection Observer)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Page title | Text (h1) | Header |
| "Clear All" button | Button (outline) | Toolbar |
| Type filter | Select (Radix) | Toolbar |
| Filter chip | Badge (removable) | Toolbar |
| Notification item | List item | List |
| Notification icon | Icon (type-specific) | List |
| Notification message | Text | List |
| Notification timestamp | Text (muted) | List |
| Unread indicator | Dot (blue) | List |
| Type badge | Badge (colored) | List |
| "Load More" button | Button (outline) | Load More |
| Empty State | EmptyState | List |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Notification item | Navigates to related page (screen detail, schedule, etc.) |
| Click | "Clear All" | Marks all as read (no confirmation — non-destructive) |
| Click | Type filter | Filters list by selected type |
| Click | Filter chip "×" | Removes that filter |
| Click | "Load More" | Loads next page of notifications |
| Hover | Notification item | Subtle background change |
| Keyboard | Tab | Through toolbar → notification items → load more |
| Keyboard | Enter | Opens focused notification (navigates to related page) |
| Keyboard | Escape | Deselects / closes filter dropdown |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | List with notifications |
| Loading | Initial load | 5-8 skeleton rows |
| Loading more | "Load More" clicked | Spinner on button + skeleton rows appended |
| Empty — no notifications | 0 notifications | "No notifications. You'll see screen status changes, schedule updates, and team activity here." |
| Empty — filtered | Filter returns 0 | "No [type] notifications." + "Clear Filter" |
| Realtime — new notification | Socket event | New item appears at top with slide-in animation + bell badge updates |
| Clearing | "Clear All" clicked | All unread indicators disappear (instant) |
| Error — fetch | API error | Error state + "Retry" |
| Navigating | Item clicked | Redirects to related page |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| New notification (realtime) | Item appears at top + bell badge count increases |
| Clear All | All items marked as read (no toast — visual change is sufficient) |
| Filter applied | List updates + filter chip appears |
| Load More | New items appended with subtle fade-in |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Read or navigate? | Clicking a notification | Both happen simultaneously (mark as read + navigate) | Both |
| Filter or scroll? | Looking for specific event | Filter by type or scroll through all | Scroll (if recent), filter (if old) |
| Clear all or individual? | Managing read state | Clear all (fast) or click each | Clear all (one click) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Miss a notification | Bell badge shows unread count | Check bell dropdown or this page |
| Clear all accidentally | "Clear All" only marks as read (non-destructive) | Notifications are still visible in list |
| Click wrong notification | Navigation is immediate | Use back button to return |

### 16. Accessibility

| Element | Rule | Evidence |
|---------|------|----------|
| Keyboard | Tab through toolbar → items → load more | ACC-02 |
| Screen reader | List has `role="list"`, items have `role="listitem"` | ACC-03 |
| ARIA | Unread items have `aria-label` including "unread" | ACC-03 |
| Live region | New notifications announced via `aria-live="polite"` | ACC-03 |
| Focus order | Toolbar → list → load more | ACC-02 |
| Contrast | Type badges and icons meet 3:1 | ACC-01 |
| Touch targets | All items ≥ 44px height | PR-45 |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column, full width |
| Toolbar | Stacked: filter on top, "Clear All" below |
| Notification items | Full width, horizontal layout (icon + content + time) |
| Timestamp | Right-aligned or below message |
| "Load More" | Full width button |
| "Clear All" | Full width outline button |

### 18. Performance UX

| Concern | Strategy | Evidence |
|---------|----------|----------|
| Initial load | SWR fetch first 20 notifications | — |
| Large lists | "Load More" pagination (not infinite scroll — prevents memory issues) | `17-notifications.md` §17.7 |
| Realtime | Socket.IO → SWR revalidation or optimistic prepend | `13-frontend-state-boundaries.md` |
| Max in-memory | 50 notifications in memory, paginated beyond | SCL-03 |
| Filter | Client-side filter for loaded items, server-side for paginated | — |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Search within notifications | Toolbar (search input) |
| Date range filter | Toolbar (date picker) |
| Infinite scroll | Replace "Load More" with Intersection Observer |
| Notification preferences link | Cross-link to Settings → Notifications tab |
| Per-type tabs | Tab bar (Screen, Schedule, Team, System) instead of dropdown filter |
| Notification grouping | Group by day or by event type |
| Export notifications | Toolbar menu (CSV/PDF) |
| Delete individual notifications | Swipe or "More" menu per item |
| Notification sounds | Settings → Notifications preferences |

### 20. UX Notes
- This page is accessed via the bell dropdown "View All" link, not via the sidebar
- Notifications are workspace-scoped — user sees only their current workspace's notifications
- "Clear All" is non-destructive (marks as read, does not delete) — no confirmation needed
- Clicking a notification both marks it as read AND navigates to the related page
- Unread indicator (blue dot) should be visually prominent but not overwhelming
- Timestamps should be relative ("2m ago", "1h ago", "3d ago") for quick scanning
- Notification icons should match the type (MonitorOff for offline, CalendarClock for schedule, etc.)
- Realtime new notifications should appear at the top with a subtle animation (slide-in or fade-in)
- Consider grouping notifications by day ("Today", "Yesterday", "This Week") for scannability
- Max 50 notifications in memory (SCL-03) — "Load More" fetches older ones from server
- This page is different from Settings → Notifications (which is preferences, not history)
- No sidebar item for this page — it's a utility page accessed from the bell

---

## Cross-References

- See `05-page-type-ux-rules.md` §9 for history page type rules
- See `information-architecture/06-page-catalog.md` P-NT-01
- See `audits/frontend/17-notifications.md` for notifications audit
- See `04-feature-ux-standards.md` §1 for notification UX standards
- See `12-settings-ux-blueprint-part2.md` P-ST-04 for notification preferences tab
- See `product-architecture/09-product-modules.md` Shell for notification module
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
