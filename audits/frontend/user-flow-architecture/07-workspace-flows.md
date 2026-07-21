# Workspace Flows

> **Evidence basis:** `ux-blueprint/11-settings-ux-blueprint-part1.md` P-ST-02, `information-architecture/05-navigation-architecture.md` §3 (workspace switcher), `product-architecture/09-product-modules.md` Shell, `product-architecture/17-product-rules.md` PR-19 through PR-25
> **Purpose:** Complete user flow documentation for Workspace Creation, Workspace Switching, and Empty Workspace state

---

## FL-WS-01: Workspace Creation

| Field | Value |
|-------|-------|
| Flow ID | FL-WS-01 |
| Flow Name | Workspace Creation |
| Purpose | Create a new workspace for a user |
| Primary User | New user (auto-created on registration) or existing user (multi-workspace — future) |
| Business Goal | User onboarding; workspace is the primary data container |
| User Goal | Have a workspace to start working in |
| Starting Point | Registration completion (auto) or workspace switcher "Create" (future) |
| Ending Point | `/overview` (new workspace, empty state) |
| Success Criteria | Workspace created, user assigned as Owner, Overview shows empty state |
| Failure Criteria | API failure |
| Frequency | One-time (auto on registration) |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path (Auto-creation on Registration)

**Step 1: Registration completes**
- Screen: Registration form submit (FL-AUTH-02 Step 2)
- System Response: API creates user + auto-creates workspace (locked decision: auto-workspace)
- Data Required: User ID, workspace name (default: "[User Name]'s Workspace")
- State Transition: (none) → CREATING

**Step 2: Workspace assigned**
- Screen: Redirect to `/overview`
- System Response: Workspace ID set in cookie, SWR cache initialized for new workspace
- State Transition: CREATING → ACTIVE
- Navigation: `/register` → `/overview`
- Feedback: Overview shows first-time empty state (FL-OB-05)

### Alternative Path (Manual creation — future)

**AP-1: Multi-workspace creation**
- User clicks workspace switcher → "Create New Workspace"
- Dialog: workspace name input + "Create" button
- API creates workspace, user becomes Owner
- Switch to new workspace
- Redirect to `/overview` (empty state)

### Failure Paths

**FP-1: API failure during auto-creation**
- Trigger: Workspace creation API fails after user creation
- UI: User is registered but has no workspace
- Recovery: System retries workspace creation; if persistent, shows error and creates on next login
- Evidence: PR-19 (auto-workspace is a locked decision)

**FP-2: User created but workspace creation delayed**
- Trigger: Race condition or timeout
- UI: User redirected to `/welcome` with "Setting up your workspace..." message
- Recovery: Polling until workspace is ready, then redirect to Overview

### First-Time User Path
- This IS the first-time user path (auto on registration)

### Cancellation Path
- N/A (auto-creation, no user interaction)

---

## FL-WS-02: Workspace Switching

| Field | Value |
|-------|-------|
| Flow ID | FL-WS-02 |
| Flow Name | Workspace Switching |
| Purpose | Switch between multiple workspaces |
| Primary User | Users with multiple workspaces (enterprise, agencies) |
| Business Goal | Multi-workspace support; enterprise feature |
| User Goal | Access different workspace data |
| Starting Point | Any authenticated page (workspace switcher in header) |
| Ending Point | Same page in different workspace (or Overview) |
| Success Criteria | Workspace context switched, data refreshed for new workspace |
| Failure Criteria | API failure; permission lost in target workspace |
| Frequency | Daily (multi-workspace users) |
| Business Importance | High |
| Complexity | Simple |

### Happy Path

**Step 1: Open workspace switcher**
- Screen: Header (workspace name button)
- User Action: Clicks workspace name in header
- System Response: Dropdown opens with workspace list (searchable if > 5)
- Permission Check: AUTHENTICATED
- Micro Interaction: Dropdown opens (MI-01, 150ms slide-down)
- Accessibility: Dropdown has `role="menu"`, items have `role="menuitem"`
- Mobile: Same dropdown or bottom sheet

**Step 2: Select workspace**
- Screen: Workspace switcher dropdown
- User Action: Clicks target workspace name
- System Response: API call to verify access; update `cs_workspace_id` cookie; SWR cache invalidation (data epoch)
- Validation: User must have access to target workspace
- Loading: Brief spinner on dropdown item
- State Transition: Workspace context changes
- Data Required: Workspace ID, user's role in that workspace
- Micro Interaction: Dropdown closes (MI-01, 150ms slide-up)

**Step 3: Data refresh**
- Screen: Current page (or Overview if current page is workspace-specific)
- System Response: SWR revalidates all queries with new workspace ID; data epoch invalidation (PR-19)
- State Transition: All cached data invalidated, new data fetched
- Navigation: Stay on same page (if generic) or redirect to Overview (if workspace-specific)
- Loading: Skeleton loading states for all data-dependent components
- Feedback: Workspace name in header updates
- Performance: Data epoch invalidation ensures no stale data (PC-19)

### Alternative Paths

**AP-1: Search workspaces**
- If user has > 5 workspaces, search input appears in dropdown
- User types to filter, clicks result

**AP-2: Create new workspace (future)**
- User clicks "Create New Workspace" at bottom of dropdown
- See FL-WS-01 AP-1

### Failure Paths

**FP-1: Permission lost in target workspace**
- Trigger: API returns 403 for target workspace
- UI: Toast: "You no longer have access to this workspace"
- Recovery: Dropdown stays open, user selects different workspace

**FP-2: API failure**
- Trigger: API unreachable
- UI: Toast: "Failed to switch workspace. Try again."
- Recovery: User retries

**FP-3: Workspace deleted**
- Trigger: Target workspace no longer exists
- UI: Workspace removed from dropdown; toast: "This workspace is no longer available"
- Recovery: User selects different workspace

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Permission lost | Select different workspace | Step 1 |
| API failure | Retry switch | Step 2 |
| Workspace deleted | Select different workspace | Step 1 |

### First-Time User Path
- N/A (first-time users have only one workspace)

### Returning User Path
- Same as Happy Path
- `cs_workspace_id` cookie persists last workspace across sessions

### Power User Path
- Click workspace name, type to search (if > 5), Enter to select first result
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close

### Offline Path
- Network loss during switch: Toast: "Connection lost"
- Workspace switch fails; user stays in current workspace
- Retry when online

### Cancellation Path
- User clicks outside dropdown or presses Escape
- Dropdown closes, no workspace change

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Workspace list | Low — users know which workspace they want | Search if > 5 workspaces |
| Data refresh delay | Low — skeleton loading is immediate | Data epoch invalidation ensures clean state |

---

## FL-WS-03: Empty Workspace State

| Field | Value |
|-------|-------|
| Flow ID | FL-WS-03 |
| Flow Name | Empty Workspace State |
| Purpose | Guide user from empty workspace to first action |
| Primary User | New user (after registration) |
| Business Goal | 5-minute KPI; user activation |
| User Goal | Understand what to do first |
| Starting Point | `/overview` (0 screens in workspace) |
| Ending Point | User clicks "Add Your First Screen" → FL-SC-01 |
| Success Criteria | User starts screen pairing flow |
| Failure Criteria | User leaves without taking action |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Simple |

### Happy Path

**Step 1: View empty workspace**
- Screen: `/overview`
- System Response: Overview detects 0 screens; shows first-time user state instead of normal widgets
- UI: Welcome card with 3-step guide (Pair → Create → Publish), "Add Your First Screen" CTA
- State Transition: Overview shows ONBOARDING state
- Micro Interaction: Welcome card fades in (MI-08)
- Accessibility: Welcome card has `role="region"` with `aria-label="Getting started"`

**Step 2: Click CTA**
- Screen: `/overview`
- User Action: Clicks "Add Your First Screen"
- System Response: Navigate to `/screens/pair`
- Navigation: `/overview` → `/screens/pair`
- State Transition: ONBOARDING → PAIRING (FL-SC-01 begins)

### Alternative Paths

**AP-1: User explores instead**
- User navigates to other pages (Content, Scheduling, Team) via sidebar
- All pages show their respective empty states
- User can return to Overview and click CTA

**AP-2: User dismisses onboarding (future)**
- User clicks "Skip onboarding" (future)
- Overview shows normal empty state (no screens widget)

### Failure Paths

**FP-1: User abandons**
- Trigger: User closes tab or navigates away
- Recovery: On next login, Overview shows onboarding state again (until first screen is paired)

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| First step | High — user doesn't know what to do | Clear 3-step guide + prominent CTA |
| "What is a screen?" | Medium — terminology confusion | Step description: "Connect a TV or display to Smart Screen" |
| After pairing | Medium — what next? | Post-pairing CTA: "Assign content" (FL-SC-01 success state) |

### UX Notes
- Empty workspace state is the #1 abandonment risk in the product
- The 3-step guide must be visual, simple, and actionable
- CTA must be the largest, most prominent element on the page
- After first screen is paired, this state never shows again
- Consider adding progress indicators (Step 1 ✓, Step 2 in progress...) in future

---

## Cross-References

- See `03-decision-trees.md` §1 for auth decision tree (includes workspace routing)
- See `04-state-machines.md` §6 for workspace state machine
- See `05-cross-flow-relationships.md` for workspace flow dependencies
- See `ux-blueprint/07-overview-ux-blueprint.md` §9 Section 5 for first-time user section
- See `ux-blueprint/11-settings-ux-blueprint-part1.md` P-ST-02 for workspace settings
- See `product-architecture/17-product-rules.md` PR-19 through PR-25 for workspace rules
- See `17-onboarding-flows.md` for complete onboarding flow chain
