# Screen Flows

> **Evidence basis:** `ux-blueprint/08-screens-ux-blueprint.md`, `product-architecture/09-product-modules.md` M-02, `product-architecture/17-product-rules.md` PR-26 through PR-32
> **Purpose:** Complete user flow documentation for Screen Pairing, Screen Detail, Screen Rename, Screen Delete, Branch Assignment, and Screen Recovery

---

## FL-SC-01: Screen Pairing

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-01 |
| Flow Name | Screen Pairing |
| Purpose | Connect a physical screen to the platform |
| Primary User | Workspace Owner, Editor |
| Business Goal | Screen fleet growth; 5-minute KPI |
| User Goal | Add a screen to manage |
| Starting Point | `/screens` (click "Add Screen") or `/overview` (first-time CTA) |
| Ending Point | `/screens` or `/content` (post-pairing CTA) |
| Success Criteria | Screen paired within 60 seconds; success state shown |
| Failure Criteria | Invalid code; code already paired; API failure |
| Frequency | Occasional |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: Navigate to pairing wizard**
- Screen: `/screens` or `/overview`
- User Action: Clicks "Add Screen" or "Add Your First Screen"
- System Response: Navigate to `/screens/pair`
- Permission Check: 🔒 Owner or Editor (button hidden for Viewer)
- Navigation: Current page → `/screens/pair`
- Micro Interaction: Page transition (fade, 200ms)

**Step 2: Enter pairing code**
- Screen: `/screens/pair` (Step 1 of 3)
- User Action: Types 6-character pairing code displayed on physical screen
- System Response: Validates code format (6 chars, alphanumeric)
- Validation: Client-side format check on input
- Data Required: Pairing code (from physical screen)
- Micro Interaction: Step indicator shows "Step 1 of 3"
- Accessibility: Input has `aria-label="Pairing code"`, large monospace font
- Mobile: Input is full width, large font for easy typing
- Keyboard: Auto-advance to Step 2 when 6 characters entered (or click "Next")

**Step 3: Enter screen name**
- Screen: `/screens/pair` (Step 2 of 3)
- User Action: Types screen name (or accepts auto-suggestion "Screen-001")
- System Response: Validates name (2-50 chars)
- Validation: Client-side on blur
- Data Required: Screen name
- Micro Interaction: Step indicator updates to "Step 2 of 3"
- Keyboard: Enter or click "Next" to proceed

**Step 4: Assign branch (optional)**
- Screen: `/screens/pair` (Step 3 of 3)
- User Action: Selects branch from dropdown OR clicks "Skip"
- System Response: Branch is optional; skip proceeds without branch
- Validation: None (optional)
- Micro Interaction: Step indicator updates to "Step 3 of 3"
- Keyboard: Enter or click "Pair Screen" to submit

**Step 5: Pairing success**
- Screen: `/screens/pair` (success state)
- System Response: API call to pair screen; success response
- State Transition: (none) → PAIRED
- Success: Checkmark animation (MI-11, 600ms), success message, post-pairing CTA
- Feedback: Toast: "Screen paired successfully"
- Micro Interaction: Checkmark draws in (MI-11)
- Navigation: User clicks "Assign Content" → `/content` or "Back to Screens" → `/screens`

### Alternative Paths

**AP-1: Skip branch (Step 4)**
- User clicks "Skip" instead of selecting a branch
- Proceeds directly to pairing submission
- Branch can be assigned later from Screen Detail

**AP-2: Post-pairing → Assign Content**
- User clicks "Assign Content" on success state
- Navigates to `/content` (guided to create/select playlist)
- Cross-flow: Links to FL-PL-01 or FL-PUB-01

### Failure Paths

**FP-1: Invalid pairing code**
- Trigger: API returns 404 (code not found) or 400 (invalid format)
- UI: Inline error on code input: "Invalid pairing code. Check the code on your screen."
- Recovery: User re-enters code
- State: Stays on Step 2

**FP-2: Code already paired**
- Trigger: API returns 409 (screen already paired to another workspace)
- UI: Inline error: "This screen is already paired to another workspace."
- Recovery: User must unpair from other workspace first (admin action) or use different code

**FP-3: API failure**
- Trigger: API unreachable or returns 500
- UI: Toast: "Failed to pair screen. Try again."
- Recovery: User retries from Step 4 (click "Pair Screen" again)

**FP-4: Network loss during pairing**
- Trigger: Network drops after submit
- UI: Toast: "Connection lost. Retrying..."
- Recovery: Auto-retry when connection restored; if success, show success state

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Invalid code | Re-enter code | Step 2 |
| Already paired | Use different code or contact admin | Step 2 |
| API failure | Retry submission | Step 4 |
| Network loss | Auto-retry | Step 4 |

### First-Time User Path
- Same as Happy Path
- May arrive from Overview first-time CTA (FL-WS-03)
- Post-pairing CTA is especially important: "Assign Content" guides to next step

### Returning User Path
- Same as Happy Path
- May skip branch more confidently (knows they can assign later)

### Power User Path
- Tab through fields, type code (auto-advances), type name, Enter, Enter to skip branch, Enter to pair
- All keyboard navigable

### Offline Path
- Network loss: Toast + auto-retry
- If persistent: Error, user retries when online

### Timeout Path
- API > 10s: Toast: "Taking longer than expected..."
- API timeout (30s): Error: "Request timed out. Try again."

### Cancellation Path
- User clicks "Cancel" at any step → navigates to `/screens`
- (Future) If inputs exist, AlertDialog: "Leave pairing? Entered data will be lost."

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Finding pairing code | Medium — user doesn't know where to look | Help tooltip: "The code is displayed on your screen's player app" |
| Screen naming | Low — auto-suggestion provided | Auto-suggest "Screen-001" |
| Branch assignment | Low — optional and skippable | "Skip" button is prominent |

---

## FL-SC-02: Screen Detail View

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-02 |
| Flow Name | Screen Detail View |
| Purpose | View screen status, content, schedules, and metadata |
| Primary User | All users |
| Business Goal | Screen management; troubleshooting |
| User Goal | Check screen status and take action |
| Starting Point | `/screens` (click screen card) |
| Ending Point | Screen detail page (user takes action or navigates away) |
| Success Criteria | User can assess screen status within 10 seconds |
| Failure Criteria | Screen not found; API failure |
| Frequency | Daily |
| Business Importance | High |
| Complexity | Simple |

### Happy Path

**Step 1: Navigate to screen detail**
- Screen: `/screens`
- User Action: Clicks screen card
- System Response: Navigate to `/screens/{id}`
- Navigation: `/screens` → `/screens/{id}`
- Micro Interaction: Page transition (fade, 200ms)

**Step 2: View screen information**
- Screen: `/screens/{id}`
- System Response: Parallel SWR fetches (screen data, schedules, events)
- Loading: Skeleton header + skeleton sections
- Success: All sections populated with data
- UI: Header (name, status badge, "Assign Content" button), Current Content, Active Schedules, Screen Info, Recent Events
- State Transition: Screen state displayed (ONLINE/OFFLINE/WARNING)
- Accessibility: Status badge has `aria-label` with full status text
- Mobile: Single column, stacked sections

### Alternative Paths

**AP-1: Edit playlist from screen detail**
- User clicks "Edit Playlist" in Current Content section
- Navigation: `/screens/{id}` → `/content/playlists/{id}/studio`
- Cross-flow: Links to FL-PL-02

**AP-2: View schedules from screen detail**
- User clicks "View All Schedules"
- Navigation: `/screens/{id}` → `/scheduling` (filtered by screen)

**AP-3: Assign content from screen detail**
- User clicks "Assign Content"
- Opens playlist selector dialog
- Cross-flow: Links to FL-PUB-01

### Failure Paths

**FP-1: Screen not found**
- Trigger: API returns 404
- UI: "This screen doesn't exist or has been deleted." + "Back to Screens" button
- Recovery: Navigate to `/screens`

**FP-2: API failure**
- Trigger: API unreachable
- UI: Error state in sections + "Retry" button
- Recovery: User clicks "Retry"

### Realtime Updates

| Event | UI Update |
|-------|-----------|
| Screen goes offline | Status badge updates to red + toast (red) |
| Screen comes online | Status badge updates to green (no toast) |
| Content changes | Current Content section updates |
| Schedule starts | Active Schedules section updates + bell notification |

---

## FL-SC-03: Screen Rename

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-03 |
| Flow Name | Screen Rename |
| Purpose | Change screen name for better identification |
| Primary User | Workspace Owner, Editor |
| Business Goal | Organization; fleet management |
| User Goal | Give screen a recognizable name |
| Starting Point | `/screens/{id}` (Screen Info section) |
| Ending Point | `/screens/{id}` (name updated) |
| Success Criteria | Screen name updated and visible |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: Initiate rename**
- Screen: `/screens/{id}` (Screen Info section)
- User Action: Clicks edit icon next to screen name (or inline edit)
- System Response: Name becomes editable input
- Permission Check: 🔒 Owner or Editor
- Micro Interaction: Input appears with current name selected (MI-03)

**Step 2: Enter new name and save**
- User Action: Types new name, presses Enter (or clicks save icon)
- System Response: API call to update screen name
- Validation: 2-50 characters
- Loading: Brief spinner on save icon
- Success: Name updates in header + Screen Info + toast: "Screen renamed"
- State Transition: Name updated in SWR cache
- Feedback: Toast: "Screen renamed"
- Keyboard: Enter to save, Escape to cancel

### Failure Paths

**FP-1: Invalid name**
- Trigger: Client-side validation (empty or too long)
- UI: Inline error: "Name must be 2-50 characters"
- Recovery: User corrects name

**FP-2: API failure**
- Trigger: API unreachable
- UI: Toast: "Failed to rename screen"
- Recovery: User retries

### Cancellation Path
- User presses Escape or clicks away → input reverts to original name

---

## FL-SC-04: Screen Delete

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-04 |
| Flow Name | Screen Delete |
| Purpose | Remove a screen from the workspace |
| Primary User | Workspace Owner, Editor |
| Business Goal | Fleet management; cleanup |
| User Goal | Remove screen that's no longer needed |
| Starting Point | `/screens/{id}` (Danger Zone) or `/screens` (bulk delete) |
| Ending Point | `/screens` (screen removed) |
| Success Criteria | Screen deleted, redirected to screen list |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate delete**
- Screen: `/screens/{id}` (Danger Zone section)
- User Action: Clicks "Delete Screen" button
- System Response: Opens AlertDialog
- Permission Check: 🔒 Owner or Editor
- Micro Interaction: Dialog opens (MI-06, 200ms scale-in)

**Step 2: Confirm deletion**
- Screen: AlertDialog
- UI: "Delete [Screen Name]?" with warning: "[N] active schedules will be affected. This screen will stop playing content."
- User Action: Clicks "Delete" (destructive button)
- System Response: API call to delete screen
- Validation: None (confirmation is the validation)
- Loading: Spinner on delete button + "Deleting..."
- Focus: Default focus on "Cancel" (safe default — UP-09)

**Step 3: Deletion success**
- System Response: API returns 200
- State Transition: Screen → DELETED
- Navigation: `/screens/{id}` → `/screens`
- Feedback: Toast: "[Screen Name] deleted"
- Micro Interaction: Page transition (fade)

### Failure Paths

**FP-1: API failure**
- Trigger: API unreachable
- UI: Toast: "Failed to delete screen. Try again."
- Recovery: Dialog stays open, user can retry

### Cancellation Path
- User clicks "Cancel" in AlertDialog → dialog closes, no action taken
- Keyboard: Escape closes dialog

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Confirm delete | Medium — irreversible action | AlertDialog with screen name + schedule impact count |
| Accidental click | Low — destructive button is visually distinct | Red destructive styling; default focus on "Cancel" |

---

## FL-SC-05: Branch Assignment

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-05 |
| Flow Name | Branch Assignment |
| Purpose | Assign or change screen's branch (location) |
| Primary User | Workspace Owner, Editor |
| Business Goal | Organization; location-based management |
| User Goal | Categorize screen by location |
| Starting Point | `/screens/{id}` (Screen Info section) |
| Ending Point | `/screens/{id}` (branch updated) |
| Success Criteria | Branch updated and visible |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: Open branch selector**
- Screen: `/screens/{id}` (Screen Info section)
- User Action: Clicks branch dropdown
- System Response: Dropdown opens with branch list
- Permission Check: 🔒 Owner or Editor

**Step 2: Select branch**
- User Action: Selects branch from dropdown
- System Response: API call to update screen branch
- Loading: Brief spinner
- Success: Branch updates in Screen Info + toast: "Branch assigned"
- Feedback: Toast: "Screen moved to [Branch Name]"

### Alternative Paths

**AP-1: Remove from branch**
- User selects "No Branch" (or "Unassigned") from dropdown
- Screen is unassigned from any branch

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to assign branch"
- Recovery: User retries

### Cancellation Path
- User clicks outside dropdown or Escape → dropdown closes, no change

---

## FL-SC-06: Screen Recovery

| Field | Value |
|-------|-------|
| Flow ID | FL-SC-06 |
| Flow Name | Screen Recovery |
| Purpose | Re-pair a screen that was deleted or lost connection |
| Primary User | Workspace Owner, Editor |
| Business Goal | Fleet recovery; minimize downtime |
| User Goal | Restore a screen that was accidentally deleted or replaced |
| Starting Point | `/screens/pair` |
| Ending Point | `/screens` (screen re-paired) |
| Success Criteria | Screen re-paired with same or new pairing code |
| Failure Criteria | Screen hardware damaged; code unavailable |
| Frequency | Rare |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate re-pairing**
- Screen: `/screens` (click "Add Screen")
- User Action: Clicks "Add Screen" to re-pair a deleted screen
- System Response: Navigate to `/screens/pair`
- Note: If screen was deleted, it needs a new pairing code from the physical device

**Step 2: Re-pair with new code**
- Same as FL-SC-01 (pairing wizard)
- User enters new pairing code from physical screen
- If the physical screen still has the player app installed, it generates a new code
- If player app was reset, user reinstalls and gets new code

### Alternative Paths

**AP-1: Screen was offline (not deleted)**
- If screen is OFFLINE but not deleted, it's still in the list
- User troubleshoots from Screen Detail (check connection, reboot player)
- No re-pairing needed

### Failure Paths

**FP-1: Physical screen damaged**
- Trigger: Screen hardware is broken
- UI: N/A (hardware issue)
- Recovery: User must replace hardware and pair new screen

**FP-2: Player app uninstalled**
- Trigger: Player app was removed from screen
- Recovery: User reinstalls player app, gets new pairing code, re-pairs

### UX Notes
- Screen recovery is essentially re-pairing with a new code
- Deleted screens cannot be "restored" — they must be re-paired
- If screen was just offline (not deleted), no re-pairing needed — troubleshoot from detail
- Consider adding "Recently deleted" recovery (future) for accidental deletes

---

## Cross-References

- See `03-decision-trees.md` §2 for screen pairing decision tree
- See `04-state-machines.md` §1 for screen state machine
- See `05-cross-flow-relationships.md` for screen flow dependencies
- See `ux-blueprint/08-screens-ux-blueprint.md` for screen page UX blueprints
- See `product-architecture/09-product-modules.md` M-02 for screen module
- See `product-architecture/17-product-rules.md` PR-26 through PR-32 for screen rules
