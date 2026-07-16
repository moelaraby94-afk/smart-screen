# User Journey Analysis

> **Evidence basis:** `27-user-flows.md`, `06-auth-and-session.md`, `07-workspace-management.md`, `08-dashboard-and-overview.md`, `09-screens-feature.md`, `10-playlists-and-studio.md`, `12-schedules-feature.md`, `13-branches-feature.md`, `14-settings-feature.md`, `15-admin-panel.md`, `16-team-feature.md`
> **Purpose:** Map every user journey with pain points, friction scores, and complexity scores

---

## Journey Documentation Convention

Each journey documents:
- **Current journey** — step-by-step flow
- **Pain points** — specific friction points
- **Decision overload** — points where user must choose without clear guidance
- **Waiting points** — where user waits for system response
- **Navigation problems** — confusing or broken navigation
- **Missing feedback** — actions without confirmation
- **Hidden actions** — features not discoverable
- **Recovery failures** — where errors can't be recovered
- **Friction score** — 1 (low) to 5 (high)
- **Complexity score** — 1 (simple) to 5 (complex)

---

## Journey 1: First-Time User Onboarding

### Current Journey

```
Step 1: Register
  → Navigate to /register
  → Fill: name, email, password
  → Submit → POST /auth/register
  → Success: navigate to /register?step=verify

Step 2: Email Verification
  → Enter 6-digit code
  → Submit → POST /auth/verify-email
  → Success: navigate to /login

Step 3: Login
  → Enter email, password
  → Submit → POST /auth/login
  → Success: navigate to /overview (WorkspaceGate intercepts)

Step 4: Workspace Welcome
  → WorkspaceGate: no workspaces → show WorkspaceWelcome
  → Choose: "Create Workspace" or "Try Demo"

Step 4a: Create Workspace
  → Fill: workspace name
  → Submit → POST /workspaces
  → Success: workspace created, navigate to /overview

Step 4b: Try Demo
  → Click "Bootstrap Demo"
  → POST /workspaces/demo
  → Success: demo workspace created with seed data

Step 5: Onboarding Wizard
  → OnboardingWizard opens automatically
  → Step 1: Choose "Seed Demo Content" or "Start Fresh"
  → Step 2: Quick links (add screen, create playlist, etc.)
  → Close wizard → navigate to /overview
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | No back button on verify step — if user navigates away, must restart | `06-auth-and-session.md` §6.7 |
| 2 | No resend cooldown — user can spam resend button | `06-auth-and-session.md` §6.7 |
| 3 | No password visibility toggle on login | `06-auth-and-session.md` §6.7 |
| 3 | Email field uses `type="text"` not `type="email"` — no mobile keyboard optimization | `06-auth-and-session.md` §6.7 |
| 4 | No onboarding skip — must complete wizard even if experienced | `27-user-flows.md` §27.9 |
| 5 | No progress indicator on wizard — user doesn't know how many steps remain | `07-workspace-management.md` §7.11 |
| 5 | Demo seed loading has no loading state — user doesn't know when it's done | `07-workspace-management.md` §7.11 |

### Decision Overload

| Step | Decision | Guidance | Assessment |
|------|----------|----------|------------|
| 4 | Create vs Demo | Brief description of each | ⚠️ User doesn't know what "demo" includes |
| 5 | Seed vs Fresh | Brief description | ⚠️ User doesn't know what "seed" means |
| 5 | Quick links | 4 links presented | ✅ Good — provides next steps |

### Waiting Points

| Step | Wait | Duration | Feedback |
|------|------|----------|----------|
| 1 | Registration API | 1-3s | Button spinner |
| 2 | Verification API | 1-3s | Button spinner |
| 3 | Login API | 1-3s | Button spinner |
| 4a | Workspace creation | 1-3s | Button spinner |
| 4b | Demo bootstrap | 3-10s | Button spinner |
| 5 | Seed demo content | 5-15s | **No loading state** |

### Friction Score: 3/5
### Complexity Score: 3/5

---

## Journey 2: Daily Dashboard Check

### Current Journey

```
Step 1: Login (if session expired)
  → Enter credentials → POST /auth/login → navigate to /overview

Step 2: View Dashboard
  → See: screen health summary, recent activity, quick actions, subscription status
  → Check: are any screens offline? Any recent issues?

Step 3: Investigate Issue (if any)
  → Click screen in health summary → navigate to /screens/{id}
  → View screen detail: status, assigned playlist, last seen

Step 4: Return to Dashboard
  → Click back button → label says "Back to Overview" but goes to /screens (P-004)
  → OR click sidebar → Overview
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | Inconsistent loading — some dashboard variants show "Loading..." text, others use skeletons | `08-dashboard-and-overview.md` §8.17, `23-error-handling-and-states.md` §23.9 |
| 2 | No screen health summary count (e.g., "3 of 15 screens offline") | `08-dashboard-and-overview.md` §8.17 |
| 2 | Recent activity feed has no filter, search, or pagination | `08-dashboard-and-overview.md` §8.17 |
| 3 | Screen detail back button label is wrong | `09-screens-feature.md` §9.8 |
| 4 | Back button goes to /screens, not /overview | P-004 |

### Missing Feedback

| Step | Missing | Impact |
|------|---------|--------|
| 2 | No "last updated" timestamp on dashboard data | User doesn't know if data is fresh |
| 3 | No realtime screen status update indicator | User doesn't know if status is live |

### Friction Score: 2/5
### Complexity Score: 1/5

---

## Journey 3: Screen Pairing

### Current Journey

```
Step 1: Navigate to Screens
  → Sidebar → Screens

Step 2: Initiate Pairing
  → Click "Add Screen" button
  → ScreenSetupModal opens

Step 3: Enter Pairing Code
  → Read pairing code from physical screen
  → Enter code in modal input
  → Submit → POST /screens/pair

Step 4: Configure Screen
  → Screen appears in list with "online" status
  → Click screen → navigate to /screens/{id}
  → Configure: name, orientation, playlist assignment
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | "Add Screen" is a navigation link to /screens, not a modal trigger (if coming from dashboard quick action) | `08-dashboard-and-overview.md` §8.17, IA-004 |
| 3 | Pairing code may be small or far away on physical screen | `09-screens-feature.md` §9.8 |
| 3 | No QR code alternative for mobile pairing | Not implemented |
| 4 | No bulk configuration — must configure each screen individually | E-004 |

### Hidden Actions

| Action | Location | Discoverability |
|--------|----------|----------------|
| Screen quick edit (rename) | Screen card dropdown menu | ⚠️ Hidden in dropdown |
| Screen playlist assignment | Screen detail page | ⚠️ Requires navigation to detail |
| Screen reboot/restart | Not available | ❌ Not implemented |

### Friction Score: 2/5
### Complexity Score: 2/5

---

## Journey 4: Content Creation (Playlist → Studio → Publish)

### Current Journey

```
Step 1: Navigate to Playlists
  → Sidebar → Playlists

Step 2: Create Playlist
  → Click "Create Playlist"
  → Create wizard opens (multi-step)
  → Fill: name, description, orientation
  → Submit → POST /playlists

Step 3: Edit in Studio
  → Playlist appears in library
  → Click playlist → navigate to detail
  → Click "Edit" → Studio opens (or navigate to /studio)

Step 4: Add Content in Studio
  → Canvas-based editor opens
  → Add elements: shapes, text, media, time, weather
  → Arrange on canvas (drag, resize, rotate)
  → Set playlist timeline (item duration, order)

Step 5: Preview
  → Click "Preview" → live preview plays
  → Verify content looks correct

Step 6: Save
  → Click "Save" → PUT /playlists/{id}
  → Success toast

Step 7: Publish to Screens
  → Click "Publish"
  → Select target screens
  → Confirm → POST /playlists/{id}/publish
  → Content pushed to screens via Socket.IO
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 3 | Studio is a separate nav item — confusing entry point | `26-consistency-audit.md` §26.6, `04-information-architecture-review.md` §2.4 |
| 4 | Canvas editor is desktop-only — unusable on mobile | `25-responsive-audit.md` §25.6 |
| 4 | No version history — can't revert to previous version | `28-feature-inventory.md` §28.6 |
| 4 | No template library — must build from scratch each time | `28-feature-inventory.md` §28.6 |
| 6 | No auto-save — must manually save | Not implemented |
| 7 | No confirmation that content is actually playing on screens | `27-user-flows.md` §27.9 |
| 7 | No proof-of-play report | `28-feature-inventory.md` §28.6 |

### Decision Overload

| Step | Decision | Guidance | Assessment |
|------|----------|----------|------------|
| 4 | Which elements to add | Element toolbar | ✅ Good — visual toolbar |
| 4 | How to arrange elements | Free-form canvas | ⚠️ No alignment guides, no snap-to-grid |
| 7 | Which screens to publish to | Screen selection list | ⚠️ No grouping by branch, no search |

### Waiting Points

| Step | Wait | Duration | Feedback |
|------|------|----------|----------|
| 2 | Playlist creation API | 1-3s | Button spinner |
| 6 | Save API | 1-3s | Button spinner |
| 7 | Publish API | 1-5s | Button spinner |
| 7 | Content appears on screen | 5-30s | **No feedback** |

### Recovery Failures

| Step | Failure | Recovery |
|------|---------|----------|
| 6 | Save fails | Error toast, content preserved in editor |
| 7 | Publish fails | Error toast, but no retry mechanism |
| 7 | Screen doesn't receive content | **No detection** — user doesn't know |

### Friction Score: 3/5
### Complexity Score: 4/5

---

## Journey 5: Schedule Creation

### Current Journey

```
Step 1: Navigate to Schedules
  → Sidebar → Schedules

Step 2: Create Schedule
  → Click "Create Schedule"
  → Dialog opens with form
  → Fill: name, playlist, screens, start date, end date, recurrence, time slots
  → Submit → POST /schedules

Step 3: View on Calendar
  → Schedule appears on calendar view
  → Click schedule to view details
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | Form complexity — many fields without progressive disclosure | `12-schedules-feature.md` §12.9 |
| 2 | No conflict detection — can schedule overlapping content on same screen | `12-schedules-feature.md` §12.9 |
| 2 | No timezone selection — uses workspace timezone only | E-005 |
| 3 | No overlap visualization on calendar | `12-schedules-feature.md` §12.9 |
| 3 | No drag-to-reschedule | `12-schedules-feature.md` §12.9 |
| 3 | No timeline view (only calendar) | `12-schedules-feature.md` §12.9 |

### Friction Score: 3/5
### Complexity Score: 3/5

---

## Journey 6: Workspace Switching

### Current Journey (Desktop)

```
Step 1: Click Workspace Switcher
  → Dropdown opens in header

Step 2: Select Workspace
  → Click workspace name
  → setWorkspaceId(id) → bumpWorkspaceDataEpoch()
  → Navigate to /branches (IA-003)
  → router.refresh()

Step 3: View New Workspace
  → Branch list loads for new workspace
  → All data re-fetched with new workspace ID
```

### Current Journey (Mobile)

```
Step 1: Try to switch workspace
  → Workspace switcher not visible in header (hidden lg:flex)
  → Open mobile sidebar → no switcher in sidebar
  → CANNOT SWITCH WORKSPACE
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | Navigates to /branches instead of /overview | IA-003 |
| 2 | No search for workspace filtering | E-006 |
| Mobile | Complete inability to switch workspaces | P-002 |

### Friction Score: 2/5 (desktop), 5/5 (mobile — blocked)
### Complexity Score: 1/5

---

## Journey 7: Team Invitation

### Current Journey

```
Step 1: Navigate to Team
  → Sidebar → Team

Step 2: Invite Member
  → Click "Invite"
  → Enter email, select role
  → Submit → POST /workspaces/{id}/invites

Step 3: Invitee Receives Email
  → Email contains invitation link
  → Click link → navigate to /invite?token={token}

Step 4: Invitee Accepts
  → If not logged in: redirect to login first
  → Show invitation details (workspace name, role)
  → Click "Accept" → POST /workspaces/invite/accept
  → refreshWorkspaces() → new workspace appears
  → Navigate to /overview
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | Only 3 predefined roles — no custom permissions | E-003, `16-team-feature.md` §16.4 |
| 2 | No role change after invitation | `16-team-feature.md` §16.4 |
| 2 | No member removal from team | `16-team-feature.md` §16.4 |
| 2 | No cancel/resend invite | `16-team-feature.md` §16.4 |
| 4 | If session expires during accept, flow is lost | `27-user-flows.md` §27.9 |

### Friction Score: 2/5
### Complexity Score: 2/5

---

## Journey 8: Admin Impersonation

### Current Journey

```
Step 1: Navigate to Admin → Customers
  → Admin sidebar → Customers

Step 2: Select Customer
  → Click customer in list → navigate to /admin/customers/{id}
  → View customer profile

Step 3: Impersonate
  → Click "Impersonate" button
  → POST /admin/customers/{id}/impersonate
  → Backend mints JWT with customer context
  → Frontend switches to client UI

Step 4: Explore as Customer
  → See exact client UI with customer's workspace
  → ImpersonationReturnButton visible (floating, persistent)
  → Navigate, test, verify

Step 5: Return to Admin
  → Click "Return to Admin"
  → POST /auth/impersonate/return
  → Navigate to /admin
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 3 | No confirmation dialog before impersonation | `15-admin-panel.md` §15.17 |
| 4 | No audit trail of actions during impersonation | E-002, `27-user-flows.md` §27.9 |
| 4 | No indication to customer that admin is viewing | `27-user-flows.md` §27.9 |
| 5 | No automatic return after timeout | Not implemented |

### Friction Score: 1/5
### Complexity Score: 2/5

---

## Journey 9: Emergency Broadcast

### Current Journey

```
Step 1: Detect Emergency
  → Navigate to dashboard or any page
  → Click "Emergency" button (in dashboard or header)

Step 2: Configure Emergency
  → Emergency overlay opens
  → Select: message type, content, duration
  → Click "Broadcast"

Step 3: Confirm
  → Confirmation dialog: "Are you sure?"
  → Click "Confirm"
  → POST /emergency/broadcast
  → Emergency content pushed to all screens

Step 4: End Emergency
  → Click "End Emergency"
  → Confirmation dialog
  → POST /emergency/end
  → Normal content resumes
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 2 | No duration limit — emergency can run indefinitely | `08-dashboard-and-overview.md` §8.17 |
| 3 | No list of affected screens | Not implemented |
| 4 | No automatic end after timeout | `08-dashboard-and-overview.md` §8.17 |

### Friction Score: 2/5
### Complexity Score: 2/5

---

## Journey 10: Settings & Configuration

### Current Journey

```
Step 1: Navigate to Settings
  → Sidebar → Settings

Step 2: Select Tab
  → Profile | Billing | Workspace | Notifications | 2FA

Step 3: Modify Settings
  → Change values in form
  → Click "Save" → API call
  → Success/error toast
```

### Pain Points

| Step | Pain Point | Evidence |
|------|-----------|----------|
| 1 | No back button from settings sub-pages | IA-005, `14-settings-feature.md` §14.8 |
| 2 | Billing tab has no plan selector or upgrade path | `14-settings-feature.md` §14.8 |
| 2 | Workspace tab "Danger Zone" has no workspace transfer option | `14-settings-feature.md` §14.8 |
| 3 | No unsaved changes warning when switching tabs | Not implemented |
| 3 | 2FA disable doesn't require password re-entry | `14-settings-feature.md` §14.8 |

### Friction Score: 2/5
### Complexity Score: 2/5

---

## Journey Friction Summary

| Journey | Friction | Complexity | Primary Blocker |
|---------|----------|------------|-----------------|
| Onboarding | 3/5 | 3/5 | No skip, no progress indicator, no loading on seed |
| Daily Dashboard | 2/5 | 1/5 | Inconsistent loading, back button bug |
| Screen Pairing | 2/5 | 2/5 | No QR code, no bulk config |
| Content Creation | 3/5 | 4/5 | Studio as separate nav, no versioning, no publish confirmation |
| Schedule Creation | 3/5 | 3/5 | No conflict detection, no timezone |
| Workspace Switch (Desktop) | 2/5 | 1/5 | Wrong navigation target |
| Workspace Switch (Mobile) | 5/5 | 1/5 | **Blocked** — no switcher |
| Team Invitation | 2/5 | 2/5 | No role management, no cancel/resend |
| Admin Impersonation | 1/5 | 2/5 | No audit trail |
| Emergency Broadcast | 2/5 | 2/5 | No duration limit |
| Settings | 2/5 | 2/5 | No back button, no upgrade path |

---

## Cross-References

- See `02-problem-map.md` for problem IDs referenced in this document
- See `09-workflow-analysis.md` for workflow analysis by user type
- See `10-mental-model-analysis.md` for mental model alignment
- See `11-cognitive-load-analysis.md` for cognitive load per journey
- See `18-dependency-map.md` for journey fix dependencies
