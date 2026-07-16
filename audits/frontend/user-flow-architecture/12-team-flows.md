# Team Flows

> **Evidence basis:** `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-TM-01, `product-architecture/09-product-modules.md` M-06, `product-architecture/17-product-rules.md` PR-33 through PR-38, `03-decision-trees.md` §7
> **Purpose:** Complete user flow documentation for Team Invitation, Role Change, and Permission Denied

---

## FL-TM-01: Team Invitation

| Field | Value |
|-------|-------|
| Flow ID | FL-TM-01 |
| Flow Name | Team Invitation |
| Purpose | Invite a new member to the workspace |
| Primary User | Workspace Owner |
| Business Goal | Team scaling; workspace collaboration |
| User Goal | Add a team member with specific role |
| Starting Point | `/team` (click "Invite Member") |
| Ending Point | `/team` (pending invite shown) |
| Success Criteria | Invitation email sent; pending invite appears |
| Failure Criteria | Invalid email; already member; already invited; API failure |
| Frequency | Monthly |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate invitation**
- Screen: `/team`
- User Action: Clicks "Invite Member" button
- System Response: Opens invite dialog
- Permission Check: 🔒 Owner only (button hidden for Editor/Viewer)

**Step 2: Enter email and select role**
- Screen: Invite dialog
- UI: Email input, role selector (Owner, Editor, Viewer), "Send Invitation" button
- User Action: Types email, selects role, clicks "Send Invitation"
- Validation: Email format (client-side on blur)
- Data Required: Email, role
- Accessibility: Role selector has descriptions for each role

**Step 3: Send invitation**
- System Response: API call to create invitation
- Loading: Dialog button spinner + "Sending..."
- Validation: Backend checks (email not already member, not already invited)

**Step 4: Invitation sent**
- System Response: API returns 200
- Success: Dialog closes; pending invite appears in "Pending Invites" section
- Feedback: Toast: "Invitation sent to [email]"
- State Transition: (none) → INVITED

### Alternative Paths

**AP-1: Invitee accepts**
- Invitee receives email, clicks accept link
- If not registered: Redirect to registration (FL-AUTH-02) with email pre-filled
- If registered: Redirect to login, then workspace
- State Transition: INVITED → ACTIVE
- Realtime: Toast on Owner's screen: "[Name] joined the team"
- Bell notification: "[Name] accepted your invitation"

**AP-2: Invitee declines**
- Invitee clicks decline link in email
- State Transition: INVITED → DECLINED
- Realtime: Toast on Owner's screen: "[email] declined the invitation"

### Failure Paths

**FP-1: Invalid email format**
- Trigger: Client-side validation
- UI: Inline error: "Please enter a valid email"
- Recovery: User corrects email

**FP-2: Already a member**
- Trigger: API returns 409 (email already in workspace)
- UI: Inline error: "This email is already a member of this workspace"
- Recovery: User cancels or uses different email

**FP-3: Already invited**
- Trigger: API returns 409 (pending invitation exists)
- UI: Inline error: "This email has already been invited"
- Recovery: User can resend (from pending list) or cancel

**FP-4: API failure**
- UI: Toast: "Failed to send invitation. Try again."
- Recovery: User retries

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Invalid email | Correct email | Step 2 |
| Already member | Cancel or use different email | Step 2 |
| Already invited | Resend from pending list | Step 1 |
| API failure | Retry | Step 3 |

### Cancellation Path
- User clicks "Cancel" in dialog → dialog closes, no invitation sent

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Role selection | Low — 3 clear options | Role descriptions in selector |
| Email typo | Low | Email field shows typed value clearly |

---

## FL-TM-02: Role Change

| Field | Value |
|-------|-------|
| Flow ID | FL-TM-02 |
| Flow Name | Role Change |
| Purpose | Change a team member's role |
| Primary User | Workspace Owner |
| Business Goal | Access management; security |
| User Goal | Adjust team member permissions |
| Starting Point | `/team` (role dropdown per member) |
| Ending Point | `/team` (role updated) |
| Success Criteria | Member's role updated |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: Open role dropdown**
- Screen: `/team` (Active Members section)
- User Action: Clicks role dropdown next to member name
- System Response: Dropdown opens with role options (Owner, Editor, Viewer)
- Permission Check: 🔒 Owner only

**Step 2: Select new role**
- User Action: Clicks new role (e.g., "Editor")
- System Response: API call to update member role
- Loading: Brief spinner on dropdown
- State Transition: Role changes

**Step 3: Role updated**
- System Response: API returns 200
- Success: Role badge updates in member row
- Feedback: Toast: "[Name] is now [Role]"
- Micro Interaction: Badge color updates (MI-03)

### Alternative Paths

**AP-1: Promote to Owner**
- Owner promotes member to Owner
- (Future) Confirmation: "Make [Name] an Owner? They will have full access."
- Current Owner may become Editor if transferring ownership (future)

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to change role. Try again."
- Recovery: User retries

**FP-2: Cannot change own role**
- Trigger: Owner tries to change own role
- UI: Dropdown disabled for self; tooltip: "You cannot change your own role"
- Recovery: N/A (prevention)

### Cancellation Path
- User clicks outside dropdown or Escape → dropdown closes, no change

### UX Notes
- Role change is immediate (no confirmation dialog) for promotions
- (Future) Consider confirmation for demotions (Owner → Editor) to prevent accidental demotion
- Owner cannot change own role (prevents self-lockout)

---

## FL-TM-03: Permission Denied

| Field | Value |
|-------|-------|
| Flow ID | FL-TM-03 |
| Flow Name | Permission Denied |
| Purpose | Handle scenarios where user lacks permission for an action |
| Primary User | Editor, Viewer (users with limited permissions) |
| Business Goal | Security; access control |
| User Goal | Understand why they can't do something |
| Starting Point | Any page (user attempts unauthorized action) |
| Ending Point | User understands limitation or contacts Owner |
| Success Criteria | User understands why action is unavailable; no dead end |
| Failure Criteria | User confused; no explanation; dead end |
| Frequency | Occasional |
| Business Importance | High |
| Complexity | Simple |

### Happy Path (Prevention — Hidden UI)

**Step 1: User views page**
- Screen: Any page
- System Response: UI renders with role-appropriate elements only
- Permission Check: 🔒 Frontend checks role before rendering actions
- UI: Unauthorized actions are HIDDEN (not disabled) — NP-08
- Evidence: `product-architecture/17-product-rules.md` PR-33

**Step 2: User does not see unauthorized actions**
- User cannot attempt actions they don't have permission for
- No confusion, no error messages needed
- This is the primary permission flow — prevention is better than recovery

### Alternative Path (Route Access Denied)

**AP-1: Direct URL access to unauthorized page**
- User types URL for page they don't have access to (e.g., Editor accessing `/settings/billing`)
- System Response: Redirect to `/overview`
- UI: Toast: "You don't have access to that page"
- Recovery: User is on Overview, can continue working

### Alternative Path (API Permission Denied)

**AP-2: API returns 403**
- Trigger: User's role was changed (e.g., Owner → Viewer) but frontend hasn't updated
- User attempts action; API returns 403
- UI: Toast: "You don't have permission to do that"
- Recovery: UI reverts to previous state; SWR revalidates user role; unauthorized actions hide

### Failure Paths

**FP-1: Confusion about missing buttons**
- Trigger: User expects to see a button but it's hidden due to role
- UI: No explanation (buttons are hidden, not disabled)
- Recovery: User can ask workspace Owner about permissions
- (Future) Consider tooltip on hidden action areas: "Requires Owner role"

### UX Notes
- Permission denied is primarily handled by PREVENTION (hidden UI), not recovery
- Hidden is better than disabled: disabled buttons create confusion ("why can't I click this?")
- Route-level redirects are silent (just redirect + toast)
- API 403 handling is a safety net for role changes during active sessions
- (Future) Realtime role update via Socket.IO would eliminate API 403 scenarios

---

## Cross-References

- See `03-decision-trees.md` §7 for team invitation decision tree, §8 for permission denied
- See `04-state-machines.md` §5 for team member state machine
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-TM-01 for team page UX
- See `product-architecture/17-product-rules.md` PR-33 through PR-38 for permission rules
- See `12-settings-flows.md` for settings flows (role-dependent tab visibility)
