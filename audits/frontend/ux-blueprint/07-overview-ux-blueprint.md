# Overview UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md` §2, `information-architecture/06-page-catalog.md` P-OV-01, `audits/frontend/08-dashboard-and-overview.md`, `product-architecture/09-product-modules.md` M-01, `04-feature-ux-standards.md` §7
> **Purpose:** Complete UX blueprint for the Overview page (dashboard)

---

## P-OV-01: Overview

### 1. Purpose
- **Business purpose:** Primary landing page; system status at a glance; drive user to action
- **User purpose:** Check screen health, see recent activity, take quick actions
- **Success criteria:** User can assess system health within 5 seconds; user can reach any primary action within 1 click
- **Failure criteria:** User doesn't understand system status; user doesn't know what to do next; dashboard is analytics-heavy instead of status-focused

### 2. Target Users
- **Primary user:** Workspace Owner (daily check), Editor (daily check)
- **Secondary user:** Viewer (read-only monitoring)
- **Permissions:** All roles. Viewer sees read-only (no quick action buttons)
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Landing page after login and workspace switch; primary daily touchpoint

### 4. Primary Goal
Assess system health at a glance and take action if needed

### 5. Primary Action
Context-dependent:
- **No screens:** "Add Screen" (pairing wizard)
- **Has screens, no content:** "Create Playlist"
- **Has screens and content:** No single primary action — dashboard is informational

### 6. Secondary Actions
1. "Create Playlist" (if screens exist)
2. "View Schedule" (if schedules exist)
3. Click offline screen → Screen detail
4. Click recent activity item → Related page
5. Click upcoming schedule → Scheduling

### 7. Information Priority
1. Screen health summary (online/offline/warning counts) — **most important** because screen status is the #1 concern
2. Quick actions — **second** because user needs to act on status
3. Recent activity — **third** because user needs context on what changed
4. Upcoming schedules — **fourth** because scheduling is optional
5. Storage usage (future) — **fifth** because it's a warning indicator, not daily concern

### 8. Visual Hierarchy

**Above the fold (desktop):**
- Screen Health widget (top-start, 50% width)
- Quick Actions widget (top-end, 50% width)

**Middle:**
- Recent Activity (bottom-start, 50% width)
- Upcoming Schedules (bottom-end, 50% width)

**Bottom:**
- Storage Usage (future, full width)

**Collapsed:**
- Widget settings (future)
- Detailed activity log (link to full page)

**Hidden:**
- Analytics charts (not on Overview — PR-09)
- Individual screen details (link to Screen detail)

**Progressive disclosure:**
- Screen Health: summary counts → click → Screen list filtered by status
- Recent Activity: 5 items → "View all" → Notifications page
- Upcoming Schedules: 3-5 items → "View all" → Scheduling page

### 9. Page Sections

#### Section 1: Screen Health
- **Purpose:** Show online/offline/warning counts at a glance
- **Priority:** 1 (highest)
- **Contents:** Online count (green), Warning count (amber), Offline count (red), total count
- **Dependencies:** `useApiScreens` (SWR, workspace-scoped)
- **Visibility rules:** Always visible (if workspace has screens). If no screens, shows first-time empty state.
- **Future scalability:** Add more health metrics (last seen, uptime %, content status)

#### Section 2: Quick Actions
- **Purpose:** One-click access to primary workflows
- **Priority:** 2
- **Contents:** "Add Screen", "Create Playlist", "View Schedule" buttons
- **Dependencies:** Screen count (to determine which actions to show), workspace permissions
- **Visibility rules:** Owner/Editor see all actions. Viewer sees no actions (read-only).
- **Future scalability:** Add more quick actions (Invite Member, Upload Media)

#### Section 3: Recent Activity
- **Purpose:** Show what changed recently in the workspace
- **Priority:** 3
- **Contents:** Last 5-10 events (screen status, schedule started, team invite, content published)
- **Dependencies:** `useApiRecentActivity` (SWR, workspace-scoped)
- **Visibility rules:** Always visible (if activity exists). If no activity, shows "No recent activity" mini empty state.
- **Future scalability:** Filter by event type, expandable items with details

#### Section 4: Upcoming Schedules
- **Purpose:** Show what's scheduled to play soon
- **Priority:** 4
- **Contents:** Next 3-5 scheduled items with playlist name, screen name, start time
- **Dependencies:** `useApiSchedules` (SWR, date range = next 24h)
- **Visibility rules:** Visible if schedules exist. If no schedules, shows "Scheduling is optional" mini empty state.
- **Future scalability:** Click to view schedule details, filter by screen

#### Section 5: First-Time User (conditional)
- **Purpose:** Guide new users through onboarding
- **Priority:** 1 (overrides other sections when active)
- **Contents:** Welcome message, 3-step guide (pair → create → publish), "Add Your First Screen" CTA
- **Dependencies:** Screen count (0 = first-time)
- **Visibility rules:** Only when workspace has 0 screens
- **Future scalability:** Progress tracking (Step 1 done ✓, Step 2 in progress...)

### 10. Component Inventory

| Component | Type | Section | Evidence |
|-----------|------|---------|----------|
| Screen Health Card | Card | Screen Health | — |
| Status Badge (Online) | Badge (green) | Screen Health | VH-04 |
| Status Badge (Warning) | Badge (amber) | Screen Health | VH-04 |
| Status Badge (Offline) | Badge (red) | Screen Health | VH-04 |
| "View Details" link | Link | Screen Health | IP-07 |
| Quick Action Button (Add Screen) | Button (default) | Quick Actions | UP-02 |
| Quick Action Button (Create Playlist) | Button (outline) | Quick Actions | — |
| Quick Action Button (View Schedule) | Button (outline) | Quick Actions | — |
| Activity Item | List item | Recent Activity | — |
| Activity Icon | Icon | Recent Activity | — |
| Activity Timestamp | Text (muted) | Recent Activity | — |
| "View All" link | Link | Recent Activity | IP-07 |
| Schedule Item | List item | Upcoming Schedules | — |
| Schedule Time | Text (medium) | Upcoming Schedules | — |
| Schedule Playlist Name | Text | Upcoming Schedules | — |
| Schedule Screen Name | Text (muted) | Upcoming Schedules | — |
| "View All Schedules" link | Link | Upcoming Schedules | IP-07 |
| Welcome Card | Card | First-Time User | — |
| Step Indicator | Progress (3 steps) | First-Time User | — |
| "Add Your First Screen" button | Button (default, large) | First-Time User | UP-02 |
| Skeleton Card | Skeleton | Loading | DD-06 |

### 11. Interaction Rules

| Interaction | Element | Behavior | Evidence |
|-------------|---------|----------|----------|
| Click | Screen Health card | Navigate to `/screens` filtered by status | IP-07 |
| Click | "Add Screen" button | Navigate to `/screens/pair` | 5-min KPI |
| Click | "Create Playlist" button | Navigate to `/content` (create mode) | — |
| Click | "View Schedule" button | Navigate to `/scheduling` | — |
| Click | Activity item | Navigate to related page (screen, playlist, etc.) | IP-07 |
| Click | Schedule item | Navigate to `/scheduling` (focused on that schedule) | — |
| Click | "View All" link | Navigate to `/notifications` or `/scheduling` | — |
| Hover | Card | Subtle border/shadow | MI-02 |
| Keyboard | Tab | Navigate through interactive elements | ACC-02 |

### 12. State Changes

| State | Trigger | UI | Evidence |
|-------|---------|-----|----------|
| Idle | Page load, data cached | Widgets with data | — |
| Loading | Initial load | 3-4 skeleton cards in 2-column grid | DD-06 |
| Refreshing | SWR revalidation (background) | Subtle opacity pulse on affected widget | `02-state-guidelines.md` §2.4 |
| Empty — no screens | 0 screens in workspace | First-time user state (welcome + CTA) | `02-state-guidelines.md` §1.4 |
| Empty — no activity | No recent events | "No recent activity" mini empty state | — |
| Empty — no schedules | No schedules | "Scheduling is optional" mini empty state | — |
| Error — fetch failed | API error | Inline error in widget with "Retry" button | `02-state-guidelines.md` §3 |
| Offline — WebSocket | Socket disconnected | Toast: "Connection lost. Retrying..." | DD-07 |
| Realtime — screen offline | Socket event | Toast + bell badge + Screen Health updates | `04-feature-ux-standards.md` §1 |
| Realtime — schedule started | Socket event | Bell badge + Upcoming Schedules updates | — |

### 13. Feedback Rules

| Event | Feedback | Duration | Evidence |
|-------|----------|----------|----------|
| Screen goes offline | Toast (red) + bell badge | 5s toast | `04-feature-ux-standards.md` §1.3 |
| Screen comes online | Bell badge update (no toast) | — | — |
| Schedule starts | Bell badge update (no toast) | — | — |
| Data refresh | Subtle opacity pulse | 500ms | — |
| Widget error | Inline error + retry button | Persistent | `02-state-guidelines.md` §3 |

### 14. Decision Points

| Decision | Context | Choices | Consequences | Default |
|----------|---------|---------|-------------|---------|
| Screen offline — what to do? | Screen Health shows 1 offline | Investigate (click screen) or Ignore | Investigate: navigate to screen detail. Ignore: status may change | User decides |
| No content — what to create? | Has screens, no playlists | Template or blank Studio | Template: fast creation. Studio: custom creation | Template (5-min KPI) |
| First-time — where to start? | New workspace, no screens | Add Screen first or explore | Add Screen: starts onboarding. Explore: user browses | Add Screen (guided) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Ignore offline screen | Red badge is visually prominent | Click badge → screen detail → troubleshoot |
| Don't know what to do next | Quick actions are always visible | CTAs guide to next step |
| Miss a notification | Bell badge shows unread count | Click bell → dropdown → click notification |
| Confuse Overview with Analytics | Overview shows counts, not charts | PR-09: Overview is status, not analytics |

### 16. Accessibility

| Element | Rule | Evidence |
|---------|------|----------|
| Keyboard | Tab through widgets, actions, links | ACC-02 |
| Screen reader | Widget titles as headings, counts as text | ACC-03 |
| ARIA | `aria-live` on Screen Health for status changes | ACC-03 |
| Focus order | Screen Health → Quick Actions → Activity → Schedules | ACC-02 |
| Contrast | Status badges meet 3:1 contrast | ACC-01 |
| Touch targets | All buttons ≥ 44px | PR-45 |
| Reduced motion | No animations on status changes (opacity only) | MI-15 |

### 17. Mobile Experience

| Element | Mobile Behavior | Evidence |
|---------|----------------|----------|
| Layout | Single column, widgets stacked | `04-feature-ux-standards.md` §3.2 |
| Screen Health | Full width | — |
| Quick Actions | Full width, buttons stacked vertically | — |
| Recent Activity | Full width | — |
| Upcoming Schedules | Full width | — |
| First-Time User | Full width, centered | — |
| Hidden | None (all widgets visible) | — |
| Drawer | N/A (Overview is landing page) | — |

### 18. Performance UX

| Concern | Strategy | Evidence |
|---------|----------|----------|
| Initial load | Skeleton widgets (2-column grid) | DD-06 |
| Data freshness | `revalidateOnFocus: true` (Overview only — PC-28 exception) | `13-frontend-state-boundaries.md` §4.2 |
| Realtime updates | Socket.IO → SWR revalidation | `13-frontend-state-boundaries.md` §4.3 |
| Widget independence | Each widget has own SWR hook → parallel fetching | — |
| Caching | SWR caches per workspace ID | PC-19 |

### 19. Future Expansion

| Feature | Placement | Route | Evidence |
|---------|-----------|-------|----------|
| Storage usage widget | Section 5 (bottom, full width) | — | `11-media-library.md` |
| Weather widget | New widget in grid | — | Future |
| Customizable widgets | Widget settings (drag to reorder) | — | Future |
| Onboarding progress | First-time section enhancement | — | F-MP-09 |
| Team activity widget | New widget in grid | — | Future |

### 20. UX Notes

- Overview is NOT analytics. It shows counts and status, not trends and charts. (PR-09)
- First-time user state is critical for 5-minute KPI. It must guide users to "Add Screen" immediately.
- Quick actions should be context-aware: show "Add Screen" when no screens, "Create Playlist" when screens exist but no content.
- Screen Health should use color coding (green/amber/red) but also include text labels for accessibility (VH-04, ACC-03).
- Recent Activity should show relative timestamps ("2m ago") for quick scanning.
- Upcoming Schedules should show time until next schedule ("in 30m") for urgency.
- Widget loading states should be independent — one widget failing should not block others.
- Consider adding `revalidateOnFocus: true` only for Overview data (PC-28 allows per-hook opt-in).

---

## Cross-References

- See `05-page-type-ux-rules.md` §2 for dashboard page type rules
- See `information-architecture/06-page-catalog.md` P-OV-01 for page catalog entry
- See `audits/frontend/08-dashboard-and-overview.md` for overview audit
- See `product-architecture/09-product-modules.md` M-01 for module definition
- See `04-feature-ux-standards.md` §7 for dashboard and overview UX rules
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
