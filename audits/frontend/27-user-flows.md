# 27 — User Flows & Interaction Patterns

> **Source basis:** Cross-cutting analysis of all auth, workspace, and feature flows  

---

## 27.1 Authentication Flows

### Login Flow
```
User navigates to /{locale}/login
  → Enters email + password
  → POST /auth/login
    → Success:
      → Store access token (dev: localStorage + cookie)
      → Set workspace ID from first workspace
      → refreshWorkspaces() — fetch /auth/me
      → Toast: "Signed in"
      → Redirect:
        - returnTo param (if safe path)
        - Super-admin → /overview
        - Has workspace → /overview
        - No workspace → /{locale} (shows WorkspaceWelcome)
    → requiresTwoFactor:
      → Show 2FA input form
      → User enters 6-8 digit code
      → POST /auth/login-2fa
      → Same success handling
    → Failure:
      → Read error envelope
      → Show localized error message
      → Toast: error
```

### Registration Flow
```
User navigates to /{locale}/register
  → Step 1: Enter name, email, password, business name, country, phone
  → POST /auth/register/start
    → Success: Advance to verification step
    → Failure: Show error
  → Step 2: Enter email verification code
  → POST /auth/register/verify
    → Success: Same as login success (store token, set workspace, redirect)
    → Failure: Show error, allow resend
  → Resend: POST /auth/register/resend
```

### Password Reset Flow
```
User navigates to /{locale}/forgot-password
  → Enters email
  → POST /auth/forgot-password
  → Success: Show confirmation message
  → User receives email with reset link
  → (Reset link handled by backend or separate route)
```

### Logout Flow
```
User clicks Logout (sidebar or user menu)
  → POST /auth/logout
  → Clear cs_access_token from localStorage
  → Clear cs_access_mirror cookie
  → Toast: "Signed out"
  → Redirect to /{locale}/login
```

### Session Recovery Flow
```
Page loads
  → WorkspaceProvider mounts
  → refreshWorkspaces() — GET /auth/me
    → Success: Restore session, workspaces, user info
    → 401/403: Reset to logged-out state

API call returns 401
  → apiFetch intercepts
  → POST /auth/refresh
    → Success: Store new token, retry original request
    → Failure: Clear tokens, redirect to /login?returnTo={path}
```

---

## 27.2 Workspace Flows

### New User — No Workspaces
```
User logs in (no workspaces)
  → WorkspaceGate detects: authenticated, no workspaces, not super-admin
  → Shows WorkspaceWelcome
    → Option 1: "Create First Workspace"
      → Opens WorkspaceCreateDialog
      → Enter name → POST /workspaces
      → refreshWorkspaces(newId)
      → setWorkspaceId(newId)
      → OnboardingWizard opens
    → Option 2: "Create with Demo"
      → POST /workspaces/bootstrap-demo
      → refreshWorkspaces(demoId)
      → setWorkspaceId(demoId)
      → Navigate to /overview
```

### Onboarding Wizard Flow
```
Workspace created
  → OnboardingWizard opens (Step 1: Content)
    → Option A: "Seed Demo Content"
      → POST /workspaces/{id}/seed-demo
      → Toast: "Demo content added"
      → Advance to Step 2
    → Option B: "Start Fresh"
      → Advance to Step 2
  → Step 2: Next Steps
    → Quick links: Add Screen, Upload Media, Invite Team
    → "Go to Dashboard" → Navigate to /overview
  → Close dialog at any time → Navigate to /overview
```

### Workspace Switch Flow
```
User clicks WorkspaceSwitcher
  → Dropdown shows all workspaces
  → User selects workspace
    → setWorkspaceId(id) — updates context + cookie
    → bumpWorkspaceDataEpoch() — triggers refetch
    → Navigate to /{locale}/branches (if not already there)
    → router.refresh()
```

### Workspace Management (from Dashboard)
```
User on /overview
  → WorkspaceCardsSection shows all branches
  → Per workspace card:
    → Open: setWorkspaceId, navigate to /branches
    → Rename: Dialog → PATCH /workspaces/{id} → toast → refresh
    → Pause/Resume: PATCH /workspaces/{id} { isPaused } → toast → refresh
    → Seed Demo: POST /workspaces/{id}/seed-demo → toast → refresh
    → Delete: Confirmation dialog → DELETE /workspaces/{id} → toast → refresh
```

---

## 27.3 Screen Management Flows

### Add Screen Flow
```
User on /screens or /branches/{id}
  → Clicks "Add Screen"
  → ScreenSetupModal opens
  → Step 1: Enter screen name, location
  → Step 2: Display pairing code/QR
    → Wait for device to pair
    → Socket.IO: pairing:started event
    → bumpPairingActivityEpoch()
  → Step 3: Assign playlist (optional)
  → Step 4: Confirm
  → POST /screens
  → Toast: "Screen added"
  → Refresh screen list
```

### Screen Detail Flow
```
User clicks screen card
  → Navigate to /screens/{screenId}
  → ScreenDetailClient renders
  → Shows: info, analytics, quick edit
  → Quick Edit: inline edit name, location, playlist, schedule
  → Actions: restart, unpair, delete (each with confirmation)
```

### Screen Status Change (Realtime)
```
Screen goes offline
  → Socket.IO: screen:status event { status: 'OFFLINE' }
  → NotificationProvider:
    → Toast: warning "Screen {serial} offline"
    → Add notification to list
    → Browser notification (if permission granted)
  → useScreenRealtime:
    → Update local screen data
  → Screen card updates status badge
```

---

## 27.4 Content Management Flows

### Upload Media Flow
```
User on /media
  → Drags files to upload zone OR clicks upload button
  → POST /media/upload (FormData)
  → Progress indicator per file
  → On complete:
    → Socket.IO: upload:complete event
    → Toast: "Upload complete"
    → Notification added
    → Media grid refreshes
```

### Create Playlist Flow
```
User on /playlists
  → Clicks "Create Playlist"
  → PlaylistCreateWizard opens
  → Step 1: Name + description
  → Step 2: Choose template or blank
  → Step 3: Select media items
  → Step 4: Configure timeline (durations, transitions)
  → Step 5: Review + create
  → POST /playlists
  → Toast: "Playlist created"
  → Switch to editor view
```

### Publish Playlist Flow
```
User in playlist editor
  → Clicks "Publish"
  → QuickPublishDialog opens
  → Select target screens (multi-select)
  → Optional: Schedule publication
  → Confirm
  → POST /playlists/{id}/publish
  → Toast: "Playlist published"
  → Screens update in realtime
```

### Create Schedule Flow
```
User on /schedules
  → Clicks "Create Schedule"
  → ScheduleCreateDialog opens
  → Enter: name, playlist, screens, start/end dates, recurrence
  → Overlap check (if conflicting schedules exist, show warning)
  → POST /schedules
  → Toast: "Schedule created"
  → Calendar/timeline refreshes
```

---

## 27.5 Admin Flows

### Admin Access Flow
```
Super-admin navigates to /admin
  → Server layout guard: fetchAuthMeServer()
    → Not authenticated → redirect to /login
    → Not super-admin → redirect to /overview
    → Authorized → render AdminSectionShell
  → Client guard: SuperAdminGuard verifies isSuperAdmin
  → Admin home renders with system stats
```

### Impersonation Flow
```
Super-admin on /admin/customers/{id}
  → Clicks "Impersonate"
  → POST /admin/customers/{id}/impersonate
  → Backend mints JWT with impersonatedBy field
  → Frontend stores session
  → WorkspaceProvider detects impersonatedBySuperAdminId
  → Navigate to /overview (as customer)
  → ImpersonationReturnButton visible
  → Click "Return to Admin" → end impersonation → navigate to /admin
```

### Super-Admin Sovereign Mode
```
Super-admin tries to access client route (e.g., /media)
  → WorkspaceGate detects: isSuperAdmin + client route
  → Toast: "Admins use the admin panel"
  → Redirect to /overview
  → Admin nav shown in sidebar instead of client nav
```

---

## 27.6 Team Management Flows

### Invite Team Member
```
User on /team
  → Clicks "Invite Member"
  → Dialog: enter email, select role
  → POST /workspaces/{ws}/invite
  → Toast: "Invitation sent"
  → Pending invitations list refreshes
```

### Accept Invitation
```
Invitee receives email with link
  → Navigates to /{locale}/invite?token={token}
  → If not authenticated: shows login/register prompt
  → If authenticated: shows invitation details
  → Clicks "Accept"
    → POST /workspaces/invite/accept { token }
    → refreshWorkspaces() — new workspace appears
    → Navigate to /overview
    → Toast: "Joined workspace"
  → OR clicks "Decline"
    → POST /workspaces/invite/decline { token }
    → Navigate to /overview
```

---

## 27.7 Notification Flow

### Real-time Notification
```
Event occurs (e.g., screen goes offline)
  → Socket.IO event received by NotificationProvider
  → addNotification() — prepend to notifications array (max 50)
  → Toast: type-appropriate (warning/success/info)
  → Browser notification (if permission granted)
  → NotificationBell badge count increments
  → User clicks bell → dropdown shows notifications
  → User clicks "Mark all read" → POST /notifications/mark-all-read
```

---

## 27.8 Interaction Patterns Summary

### Common Interaction Patterns

| Pattern | Implementation | Used In |
|---------|---------------|---------|
| Click card → navigate | `Link` or `router.push` | Screen cards, playlist cards, workspace cards |
| Click row → navigate | `onClick` on table row | Admin tables, customer list |
| Dropdown actions | `DropdownMenu` with items | Screen card actions, user menu, workspace switcher |
| Confirmation dialog | `AlertDialog` with cancel/confirm | Delete operations, destructive actions |
| Form submit | `onSubmit` with loading state | All forms |
| Inline edit | Click to edit, save/cancel buttons | Screen quick edit, workspace settings |
| Drag and drop | HTML5 drag API or Konva | Timeline, media library, canvas editor |
| Filter + search | Input + select filters | All list views |
| Pagination | Page controls or infinite scroll | Admin tables, notifications page |
| Real-time update | Socket.IO event → state update | Screen status, notifications, pairing |
| Toast feedback | `sonner` toast on API success/error | All API-calling actions |
| Skeleton loading | `Skeleton` / `CardGridSkeleton` | Overview, list views |
| Error retry | Error message + retry button | Dashboard, data-loading components |

### State Transitions

| From State | To State | Trigger |
|------------|----------|---------|
| Unauthenticated | Authenticated | Successful login/register |
| Authenticated, no workspace | Workspace created | Create workspace or demo bootstrap |
| Workspace created | Onboarding | OnboardingWizard opens |
| Onboarding complete | Dashboard | Navigate to /overview |
| Dashboard | Screen detail | Click screen card |
| Screen detail | Screen list | Back button |
| Client view | Admin view | Navigate to /admin (super-admin only) |
| Admin view | Client impersonation | Impersonate customer |
| Client impersonation | Admin view | ImpersonationReturnButton |

---

## 27.9 [V2] UX Analysis — User Flows

### Onboarding Flow — Journey Analysis

**[V2] First-Time User Journey:**
```
Register → Verify Email → Login → WorkspaceWelcome → Create Workspace →
OnboardingWizard (Step 1: Seed/Fresh) → OnboardingWizard (Step 2: Next Steps) →
Overview Dashboard
```

This is a 7-step journey from registration to productive use. Key UX observations:
- Steps 1-3 (Register → Verify → Login) are standard auth flow
- Step 4 (WorkspaceWelcome) is a decision point — create or demo
- Step 5 (Create Workspace) is a form submission
- Steps 6-7 (OnboardingWizard) guide first actions
- The journey ends at the dashboard where the user sees their workspace

**[V2] Onboarding Drop-off Risk:**
The highest drop-off points are:
1. Email verification (extra step after registration)
2. Workspace creation form (friction of naming/configuring)
3. Onboarding wizard step 1 (decision: seed vs fresh)

The demo bootstrap option mitigates drop-off at step 2 by offering a 1-click workspace with pre-filled content.

**[V2] No Onboarding Skip:**
There is no way to skip the onboarding wizard. Users who want to explore on their own must complete both wizard steps. The wizard close button navigates to overview, but the wizard may re-appear on next visit if not properly dismissed.

### Workspace Switching Flow — Journey Analysis

**[V2] Switch Flow:**
```
Click WorkspaceSwitcher → Dropdown opens → Click workspace →
setWorkspaceId(id) → bumpWorkspaceDataEpoch() → Navigate to /branches →
router.refresh() → Branches page loads with new workspace context
```

**[V2] Navigation Destination Issue:**
As identified in `07-workspace-management.md` V2, switching workspaces navigates to `/branches` instead of `/overview`. This is unexpected — users anticipate seeing the dashboard for the new workspace, not the branch list.

### Screen Pairing Flow — Journey Analysis

**[V2] Pairing Flow:**
```
Navigate to Screens → Click "Add Screen" → ScreenSetupModal opens →
Enter pairing code → POST /screens/pair → Screen paired →
Screen appears in list with "online" status →
Configure screen (name, orientation, playlist assignment)
```

**[V2] Pairing Code UX:**
The pairing code is displayed on the physical screen. The user must:
1. Turn on the physical screen/player
2. Wait for the pairing code to appear
3. Read the code (may be small or far away)
4. Enter the code in the web dashboard

This flow requires the user to be near both the physical screen and a computer/mobile device simultaneously. For installations where screens are in remote locations, this is challenging.

### Content Publishing Flow — Journey Analysis

**[V2] Publishing Flow:**
```
Create Playlist → Open Studio → Add content (shapes, media, text) →
Save Playlist → Publish to Screens → Select screens → Confirm →
Content appears on physical screens
```

**[V2] Publishing Latency:**
After publishing, the content appears on screens via Socket.IO push or polling. The user has no immediate feedback that the content is actually playing on the screen. A "last updated" timestamp or live screenshot would help confirm successful publishing.

### Impersonation Flow — Enterprise Analysis

**[V2] Admin Impersonation Journey:**
```
Admin navigates to Customer detail → Click "Impersonate" →
POST /admin/customers/{id}/impersonate → Backend mints JWT →
Admin sees client UI with customer's workspace →
ImpersonationReturnButton visible → Admin explores/tests →
Click "Return to Admin" → POST /auth/impersonate/return →
Admin returns to admin panel
```

**[V2] Impersonation UX:**
The impersonation flow is well-designed:
- The return button is always visible (floating, persistent)
- The admin sees the exact client UI (sovereign mode disabled)
- Realtime events continue working (Socket.IO re-subscribes to impersonated workspace)
- The admin can test all client features as the impersonated user

**[V2] Impersonation Audit:**
There is no visible indication to the impersonated user that an admin is viewing their workspace. The admin's actions during impersonation may not be logged separately from the user's actions. This is an **enterprise compliance gap** — impersonation should be auditable.

### [V2] Cross-Flow Issues

**[V2] Session Expiry During Flow:**
If a session expires mid-flow (e.g., during playlist creation), the token refresh mechanism attempts to recover. If refresh fails, the user is redirected to login. After re-login, only the workspace creation flow has recovery (via `cs_pending_workspace_create` localStorage). All other flows lose their progress.

**[V2] No Flow State Persistence:**
None of the multi-step flows (onboarding, playlist creation wizard, screen setup) persist their state. If the user navigates away mid-flow, they must start over. This is acceptable for short flows but problematic for the playlist creation wizard if it has many steps.

### Cross-References
- See `06-auth-and-session.md` for auth flow details
- See `07-workspace-management.md` for workspace creation and switching
- See `09-screens-feature.md` for screen pairing
- See `10-playlists-and-studio.md` for playlist creation and publishing
- See `15-admin-panel.md` for admin impersonation
- See `23-error-handling-and-states.md` for session recovery
