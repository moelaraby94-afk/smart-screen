# Notification & Analytics Flows

> **Evidence basis:** `ux-blueprint/14-notifications-ux-blueprint.md`, `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-AN-01, `04-feature-ux-standards.md` §1, `product-architecture/09-product-modules.md` Shell
> **Purpose:** Complete user flow documentation for Notification View and Analytics Navigation

---

## FL-NT-01: Notification View

| Field | Value |
|-------|-------|
| Flow ID | FL-NT-01 |
| Flow Name | Notification View |
| Purpose | View and act on notifications |
| Primary User | All users |
| Business Goal | User engagement; event awareness |
| User Goal | See what happened and take action |
| Starting Point | Bell icon in header (any page) |
| Ending Point | Related page (navigated from notification) or notifications history |
| Success Criteria | User sees notification and navigates to relevant page |
| Failure Criteria | API failure; no related page |
| Frequency | Daily |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: View bell badge**
- Screen: Any authenticated page (header)
- System Response: Bell icon shows unread count badge (if > 0)
- Micro Interaction: Badge count updates in real-time (Socket.IO)
- Accessibility: Bell has `aria-label="Notifications ([N] unread)"`

**Step 2: Open bell dropdown**
- User Action: Clicks bell icon
- System Response: Dropdown opens with recent 5 notifications
- Micro Interaction: Dropdown opens (MI-01, 150ms slide-down)
- UI: Each notification shows icon, message, timestamp, unread indicator (blue dot)

**Step 3: Click notification**
- User Action: Clicks a notification item
- System Response: Marks as read (API call); navigates to related page
- State Transition: Unread → Read (blue dot disappears)
- Navigation: → Related page (e.g., `/screens/{id}` for screen offline)
- Feedback: Bell badge count decrements

### Alternative Paths

**AP-1: "View All" link**
- User clicks "View All" at bottom of dropdown
- Navigation: → `/notifications` (full history page)
- Cross-flow: Links to notifications history page

**AP-2: Clear all from dropdown**
- (Future) User clicks "Clear All" in dropdown
- All visible notifications marked as read

**AP-3: View from notifications page**
- User navigates to `/notifications` directly
- Sees full paginated list with filters
- Clicks notification → same navigation as Step 3

### Failure Paths

**FP-1: API failure on fetch**
- UI: Dropdown shows "Failed to load notifications" + "Retry"
- Recovery: User clicks "Retry"

**FP-2: Related page not found**
- Trigger: Notification references deleted entity (e.g., deleted screen)
- UI: Navigate to related section (e.g., `/screens`) with toast: "This screen is no longer available"
- Recovery: User is on relevant page, can continue

### Realtime Updates

| Event | UI Update |
|-------|-----------|
| New notification (Socket.IO) | Dropdown prepends item + badge count increments |
| Screen offline | Red icon notification appears |
| Schedule started | Blue icon notification appears |
| Team invite accepted | Green icon notification appears |

### Power User Path
- Click bell, arrow keys to navigate notifications, Enter to open
- Escape to close dropdown

### Cancellation Path
- User clicks outside dropdown or Escape → dropdown closes

---

## FL-AN-01: Analytics Navigation

| Field | Value |
|-------|-------|
| Flow ID | FL-AN-01 |
| Flow Name | Analytics Navigation |
| Purpose | View analytics data for screens and content |
| Primary User | Workspace Owner, Editor, Viewer |
| Business Goal | Data-driven decisions; performance insights |
| User Goal | Understand how screens and content are performing |
| Starting Point | Sidebar → "Analytics" |
| Ending Point | `/analytics` (viewing data) |
| Success Criteria | User can assess performance within 15 seconds |
| Failure Criteria | No data; API failure |
| Frequency | Monthly |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: Navigate to analytics**
- Screen: Sidebar
- User Action: Clicks "Analytics" in sidebar
- System Response: Navigate to `/analytics`
- Navigation: Current page → `/analytics`

**Step 2: Select period**
- Screen: `/analytics`
- UI: Period selector (7d, 30d, 90d, Custom) — default: 30d
- User Action: Optionally changes period
- System Response: SWR revalidates with new period
- Loading: Skeleton cards + skeleton chart during fetch
- Data Required: Period (date range)

**Step 3: View metrics**
- Screen: `/analytics`
- UI: Key metric cards (uptime, active screens, impressions), trend chart, performers list
- System Response: Data rendered from API response
- Micro Interaction: Charts fade in (MI-08, opacity only — no slide for reduced motion)

**Step 4: Switch tab (optional)**
- User Action: Clicks "Content Performance" tab
- System Response: SWR fetches content analytics data
- Loading: Brief skeleton reload
- Micro Interaction: Content fades in (MI-08)

### Alternative Paths

**AP-1: Drill down from metric**
- (Future) User clicks metric card
- Navigates to detailed view for that metric

**AP-2: Click performer**
- User clicks a screen/playlist in performers list
- Navigation: → Screen detail or playlist detail

### Failure Paths

**FP-1: No analytics data**
- Trigger: Workspace has no screens or no published content
- UI: Empty state: "No analytics data yet. Add screens and publish content to see performance." + "Add Screen" CTA
- Recovery: User navigates to add screen or publish content

**FP-2: No data for period**
- Trigger: Selected period has no data (e.g., 7d when screens were added 2 days ago)
- UI: "No data for this period. Try a different period." + period selector highlighted

**FP-3: API failure**
- UI: Error state + "Retry"
- Recovery: User retries

### Cancellation Path
- User navigates to another page via sidebar → analytics abandoned

### UX Notes
- Analytics is NOT the Overview — it shows trends and detailed metrics, not just counts (PR-09)
- Period selector is the primary interaction — all data depends on it
- Empty state is common for new workspaces — guide users to add screens
- Charts should be simple (line/area) not complex (stacked bar, radar)

---

## Cross-References

- See `ux-blueprint/14-notifications-ux-blueprint.md` for notifications page UX
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-AN-01 for analytics UX
- See `04-feature-ux-standards.md` §1 for notification UX standards
- See `13-settings-flows.md` FL-ST-06 for notification preferences
- See `product-architecture/09-product-modules.md` Shell for notification module
