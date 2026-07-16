# Publishing & Scheduling Flows

> **Evidence basis:** `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-03, `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01, `product-architecture/09-product-modules.md` M-04, `product-architecture/17-product-rules.md` PR-11 through PR-18, `03-decision-trees.md` §4, §5
> **Purpose:** Complete user flow documentation for Immediate Publish, Always Active Publish, Schedule Creation, Conflict Resolution, and Schedule Editing

---

## FL-PUB-01: Immediate Publish

| Field | Value |
|-------|-------|
| Flow ID | FL-PUB-01 |
| Flow Name | Immediate Publish |
| Purpose | Publish a playlist to screens immediately (default publishing mode) |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content delivery; 5-minute KPI completion |
| User Goal | Make content appear on screens now |
| Starting Point | `/content/playlists/{id}` (click "Publish to Screens") |
| Ending Point | Playlist detail (published) or screen detail (view result) |
| Success Criteria | Playlist playing on selected screens within seconds |
| Failure Criteria | No screens selected; API failure |
| Frequency | Weekly |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate publish**
- Screen: `/content/playlists/{id}`
- User Action: Clicks "Publish to Screens" button
- System Response: Opens screen selector dialog
- Permission Check: 🔒 Owner or Editor (button hidden for Viewer)
- Micro Interaction: Dialog opens (MI-06, 200ms scale-in)

**Step 2: Select screens**
- Screen: Screen selector dialog
- UI: List of workspace screens with checkboxes; status badges (online/offline)
- User Action: Checks one or more screens
- Validation: At least one screen must be selected (validated on submit)
- Data Required: Playlist ID, selected screen IDs
- Accessibility: Checkboxes have `aria-label` with screen name

**Step 3: Confirm and publish**
- Screen: Screen selector dialog
- User Action: Clicks "Publish Now" button
- System Response: API call to assign playlist to selected screens (immediate)
- Validation: ≥ 1 screen selected
- Loading: Dialog button spinner + "Publishing..."
- State Transition: DRAFT → PUBLISHED (playlist); screen content updates

**Step 4: Publish success**
- System Response: API returns 200
- Success: Dialog closes; "Assigned Screens" section updates
- Feedback: Toast: "Published to [N] screens"
- ◇ Next step decision:
  - "View on screen" → Navigate to `/screens/{id}` (first selected screen)
  - "Done" → Stay on playlist detail
- Micro Interaction: Toast slides in (MI-07, 300ms)

### Alternative Paths

**AP-1: Publish from Screen Detail**
- User on Screen Detail clicks "Assign Content"
- Opens playlist selector dialog (reverse: select playlist, not screens)
- Selects playlist → assigns to this screen
- Same outcome: playlist playing on screen

**AP-2: Publish to single screen from card**
- (Future) Quick publish from playlist card "More" menu
- Pre-selects last used screen

### Failure Paths

**FP-1: No screens selected**
- Trigger: User clicks "Publish Now" without selecting any screen
- UI: Validation error: "Select at least one screen"
- Recovery: User selects screen(s)

**FP-2: API failure**
- Trigger: API unreachable or returns error
- UI: Toast: "Failed to publish. Try again."
- Recovery: Dialog stays open, user retries

**FP-3: Screen offline during publish**
- Trigger: Selected screen is offline
- UI: Screen shows offline badge in dialog; warning: "Offline screens will receive content when they reconnect"
- Recovery: User can proceed (content will sync when screen comes online) or deselect

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| No screens | Select at least one | Step 2 |
| API failure | Retry publish | Step 3 |
| Screen offline | Proceed or deselect | Step 2 |

### First-Time User Path
- Same as Happy Path
- Post-publish CTA ("View on screen") is critical for 5-minute KPI satisfaction
- User sees their content on the physical screen — moment of value

### Returning User Path
- Same as Happy Path
- Knows which screens to select

### Power User Path
- Select all screens with "Select All" checkbox
- Publish with keyboard: Tab to "Publish Now", Enter

### Offline Path
- Network loss during publish: Toast: "Connection lost. Retrying..."
- Auto-retry when connection restored
- If retry fails: Manual retry

### Cancellation Path
- User clicks "Cancel" in dialog → dialog closes, no action
- Keyboard: Escape closes dialog

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Screen selection | Low — checkboxes are clear | Screen names + status badges visible |
| Wrong screen | Medium — publishing to wrong screen | Screen names shown in dialog; confirmation step |
| Offline screen | Low — warning is shown | Offline badge + warning message |

---

## FL-PUB-02: Always Active Publish

| Field | Value |
|-------|-------|
| Flow ID | FL-PUB-02 |
| Flow Name | Always Active Publish |
| Purpose | Publish a playlist as "always active" (no schedule, plays continuously) |
| Primary User | Editor, Workspace Owner |
| Business Goal | Content delivery; simplified publishing for single-playlist screens |
| User Goal | Set a playlist to play all the time on a screen |
| Starting Point | `/content/playlists/{id}` or `/screens/{id}` |
| Ending Point | Playlist playing continuously on selected screens |
| Success Criteria | Playlist set as always-active content on screens |
| Failure Criteria | API failure |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | Medium |

### Happy Path

**Step 1: Initiate publish**
- Screen: `/content/playlists/{id}`
- User Action: Clicks "Publish to Screens"
- System Response: Opens screen selector dialog (same as FL-PUB-01)

**Step 2: Select screens and publish mode**
- Screen: Screen selector dialog
- UI: Screen checkboxes + publish mode selector: "Immediate (always active)" (default) or "Scheduled"
- User Action: Selects screens, keeps "Immediate" mode
- Validation: ≥ 1 screen

**Step 3: Publish**
- User Action: Clicks "Publish Now"
- System Response: API assigns playlist as always-active content on selected screens
- State Transition: DRAFT → PUBLISHED; screen content = this playlist (continuous)

**Step 4: Success**
- Feedback: Toast: "Published to [N] screens"
- Screen content updates to play playlist continuously
- No schedule created — playlist plays until replaced or overridden

### Alternative Paths

**AP-1: Switch to scheduled**
- User selects "Scheduled" mode instead of "Immediate"
- Navigation: → `/scheduling` (pre-filled with playlist)
- Cross-flow: Links to FL-SCH-01

### Failure Paths
- Same as FL-PUB-01

### UX Notes
- Always Active is the default publishing mode (locked decision: immediate publish is default)
- No schedule is created — the playlist simply plays continuously
- If a schedule exists for a screen, always-active content plays when no schedule is active
- Override (FL-PUB-01 emergency) takes priority over always-active content

---

## FL-SCH-01: Schedule Creation

| Field | Value |
|-------|-------|
| Flow ID | FL-SCH-01 |
| Flow Name | Schedule Creation |
| Purpose | Create a time-based schedule for playlist playback on screens |
| Primary User | Editor, Workspace Owner |
| Business Goal | Time-based content orchestration; promotional scheduling |
| User Goal | Schedule content to play at specific times |
| Starting Point | `/scheduling` (click "Create Schedule") or playlist detail ("Create Schedule") |
| Ending Point | `/scheduling` (schedule appears on calendar) |
| Success Criteria | Schedule created and visible on calendar |
| Failure Criteria | Conflict detected; API failure |
| Frequency | Weekly |
| Business Importance | High |
| Complexity | Complex |

### Happy Path

**Step 1: Initiate schedule creation**
- Screen: `/scheduling`
- User Action: Clicks "Create Schedule"
- System Response: Opens schedule creation dialog
- Permission Check: 🔒 Owner or Editor

**Step 2: Select playlist**
- Screen: Schedule creation dialog
- UI: Playlist selector (dropdown or search)
- User Action: Selects playlist to schedule
- Data Required: Playlist ID

**Step 3: Select screen(s)**
- Screen: Schedule creation dialog
- UI: Screen selector (checkboxes or dropdown)
- User Action: Selects one or more screens
- Data Required: Screen ID(s)

**Step 4: Set time range**
- Screen: Schedule creation dialog
- UI: Start date/time picker, end date/time picker
- User Action: Sets start and end date/time
- Validation: End must be after start
- Data Required: Start datetime, end datetime

**Step 5: Set recurrence (optional)**
- Screen: Schedule creation dialog
- UI: Recurrence options: None (one-time), Daily, Weekly, Custom
- User Action: Selects recurrence pattern (or leaves as one-time)
- Validation: If recurring, end date or count required (future)

**Step 6: Save schedule**
- User Action: Clicks "Create Schedule"
- System Response: API call to create schedule; conflict check on backend
- Loading: Button spinner + "Creating..."
- Validation: Backend checks for conflicts with existing schedules on same screen

**Step 7: Schedule created**
- System Response: API returns 200 (no conflict)
- State Transition: CREATING → ACTIVE
- Success: Dialog closes; schedule appears on calendar
- Feedback: Toast: "Schedule created"
- Micro Interaction: Event block appears on calendar (MI-08, fade-in)

### Alternative Paths

**AP-1: Create from playlist detail**
- User on playlist detail clicks "Create Schedule"
- Dialog opens with playlist pre-selected (skips Step 2)

**AP-2: Create from calendar day click**
- User clicks a day cell in month view
- Dialog opens with that date pre-filled (skips partial Step 4)

### Failure Paths

**FP-1: Conflict detected**
- Trigger: API returns 409 (scheduling conflict)
- UI: Conflict details shown in dialog: "[Playlist Name] conflicts with [Existing Schedule] on [Screen Name] at [Time]"
- Recovery: User adjusts time range (Step 4) or selects different screen (Step 3)
- Cross-flow: Links to FL-SCH-02 (Conflict Resolution)

**FP-2: End before start**
- Trigger: Client-side validation
- UI: Inline error: "End time must be after start time"
- Recovery: User adjusts times

**FP-3: API failure**
- UI: Toast: "Failed to create schedule. Try again."
- Recovery: User retries

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Conflict | Adjust time or screen | Step 4 or Step 3 |
| End before start | Adjust end time | Step 4 |
| API failure | Retry | Step 6 |

### Cancellation Path
- User clicks "Cancel" in dialog → dialog closes, no schedule created
- Keyboard: Escape closes dialog

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Recurrence rules | Medium — complex options | Progressive disclosure: simple options first, advanced collapsed |
| Conflict | Medium — user must understand overlap | Visual conflict details with schedule names and times |
| Timezone | Medium — user may be in different timezone | (Future) Timezone indicator in dialog |

---

## FL-SCH-02: Conflict Resolution

| Field | Value |
|-------|-------|
| Flow ID | FL-SCH-02 |
| Flow Name | Conflict Resolution |
| Purpose | Resolve scheduling conflicts when new schedule overlaps existing |
| Primary User | Editor, Workspace Owner |
| Business Goal | Schedule integrity; prevent content conflicts |
| User Goal | Create schedule without conflicts |
| Starting Point | FL-SCH-01 Step 6 (conflict detected) |
| Ending Point | Schedule created (conflict resolved) or schedule abandoned |
| Success Criteria | Conflict resolved and schedule created |
| Failure Criteria | User cannot resolve conflict; abandons schedule |
| Frequency | Occasional |
| Business Importance | High |
| Complexity | Complex |

### Happy Path

**Step 1: Conflict detected**
- Screen: Schedule creation dialog
- System Response: API returns 409 with conflict details
- UI: Conflict warning shown: "[New Schedule] conflicts with [Existing Schedule]" with details (screen, time overlap)
- State Transition: CREATING → CONFLICT

**Step 2: User adjusts time range**
- User Action: Modifies start or end time to avoid overlap
- System Response: Re-validates on submit
- Navigation: Returns to FL-SCH-01 Step 6

**Step 3: Re-submit**
- User Action: Clicks "Create Schedule" again
- System Response: API call; conflict check passes
- State Transition: CONFLICT → ACTIVE
- Success: Toast: "Schedule created"

### Alternative Paths

**AP-1: Override conflicting schedule**
- User chooses to replace the conflicting schedule
- UI: Confirm dialog: "Replace [Existing Schedule]? The new schedule will take its place."
- User confirms → API replaces old schedule with new
- State Transition: Old schedule → DELETED; New schedule → ACTIVE
- Feedback: Toast: "Schedule created. [Existing Schedule] was replaced."

**AP-2: Select different screen**
- User changes screen selection to avoid conflict
- Re-submits schedule

**AP-3: Cancel**
- User abandons schedule creation
- Dialog closes; no schedule created

### Failure Paths

**FP-1: New time also conflicts**
- Trigger: Adjusted time still overlaps
- UI: New conflict details shown
- Recovery: User adjusts again

**FP-2: API failure during override**
- UI: Toast: "Failed to resolve conflict. Try again."
- Recovery: User retries

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Understanding conflict | High — user may not understand overlap | Clear visual: show both schedules' time ranges |
| Override decision | Medium — replacing existing schedule | Confirmation dialog with schedule name |
| Abandonment | Medium — user gives up | Offer multiple resolution options (adjust, override, change screen) |

---

## FL-SCH-03: Schedule Editing

| Field | Value |
|-------|-------|
| Flow ID | FL-SCH-03 |
| Flow Name | Schedule Editing |
| Purpose | Modify an existing schedule (time, recurrence, screen, playlist) |
| Primary User | Editor, Workspace Owner |
| Business Goal | Schedule management; content orchestration |
| User Goal | Change when or where content plays |
| Starting Point | `/scheduling` (click schedule event) |
| Ending Point | `/scheduling` (schedule updated on calendar) |
| Success Criteria | Schedule updated and calendar reflects changes |
| Failure Criteria | New conflict; API failure |
| Frequency | Weekly |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Open schedule for editing**
- Screen: `/scheduling`
- User Action: Clicks schedule event block on calendar
- System Response: Opens schedule edit dialog (pre-filled with current values)
- Permission Check: 🔒 Owner or Editor

**Step 2: Modify schedule**
- Screen: Schedule edit dialog
- User Action: Changes time range, recurrence, screen, or playlist
- Validation: Same as creation (end after start, etc.)

**Step 3: Save changes**
- User Action: Clicks "Save Changes"
- System Response: API call to update schedule; conflict check
- Loading: Button spinner
- Success: Dialog closes; calendar updates
- Feedback: Toast: "Schedule updated"
- Micro Interaction: Event block updates on calendar (MI-08)

### Alternative Paths

**AP-1: Delete from edit dialog**
- User clicks "Delete" in edit dialog
- Opens confirmation: "Delete this schedule?"
- Confirms → schedule deleted

**AP-2: Deactivate from edit dialog**
- User clicks "Deactivate"
- Schedule becomes INACTIVE; event block shows as muted on calendar
- Feedback: Toast: "Schedule deactivated"

### Failure Paths

**FP-1: Conflict on new time**
- Same as FL-SCH-02 (conflict resolution)

**FP-2: API failure**
- UI: Toast: "Failed to update schedule. Try again."
- Recovery: User retries

### Cancellation Path
- User clicks "Cancel" → dialog closes, no changes

---

## Cross-References

- See `03-decision-trees.md` §4 for publishing decision tree, §5 for conflict decision tree
- See `04-state-machines.md` §4 for schedule state machine
- See `05-cross-flow-relationships.md` §5.3 for schedule-conflict chain
- See `ux-blueprint/09-content-studio-ux-blueprint.md` P-CN-03 for playlist detail UX
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01 for scheduling UX
- See `product-architecture/17-product-rules.md` PR-11 through PR-18 for publishing rules
