# Scheduling, Analytics & Team UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md`, `information-architecture/06-page-catalog.md` P-SCH-01, P-AN-01, P-TM-01, `audits/frontend/12-schedules-feature.md`, `audits/frontend/18-analytics-feature.md`, `audits/frontend/16-team-feature.md`, `product-architecture/09-product-modules.md` M-04, M-05, M-06
> **Purpose:** Complete UX blueprint for Scheduling, Analytics, and Team pages

---

## P-SCH-01: Scheduling Calendar

### 1. Purpose
- **Business purpose:** Time-based content orchestration; promotional scheduling
- **User purpose:** See what's playing when; create or modify schedules
- **Success criteria:** User can create a schedule within 60 seconds; user can see today's schedules at a glance
- **Failure criteria:** Confusing calendar; no conflict detection; can't create schedule

### 2. Target Users
- **Primary user:** Editor (create/manage), Workspace Owner
- **Secondary user:** Viewer (view only)
- **Permissions:** Owner/Editor: create, edit, delete. Viewer: read-only.
- **Visibility:** Authenticated + has workspace. Scheduling is optional (locked decision).

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Entity priority #5; optional feature; immediate publish is default

### 4. Primary Goal
View and manage content schedules

### 5. Primary Action
"Create Schedule" (dialog)

### 6. Secondary Actions
1. Switch view (month/week/day)
2. Switch to list view
3. Filter by screen or playlist
4. Click schedule event → View details / Edit
5. Navigate to different date period
6. Delete schedule (from event click)

### 7. Information Priority
1. Scheduled events on calendar — **what's playing when**
2. Event color (by playlist) — **visual distinction**
3. Event title (playlist name) — **identification**
4. Event time — **when**
5. Screen assignment — **where**
6. Conflict indicators — **problems**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Scheduling" + "Create Schedule" button
- View switcher (Month | Week | Day) + List toggle
- Date navigator (← [Month Year] →)
- Filter bar (screen, playlist)

**Middle:**
- Calendar grid (month: 7-column grid, week: 7-column with hours, day: single column with hours)

**Bottom:**
- Legend (playlist colors)

**Collapsed:**
- Recurrence rules (in creation dialog)
- Time slot configuration (in creation dialog)

### 9. Page Sections

#### Section 1: Toolbar
- **Purpose:** View control, navigation, creation
- **Priority:** 1
- **Contents:** View switcher, date navigator, "Create Schedule" button, filters
- **Visibility:** Always

#### Section 2: Calendar Grid
- **Purpose:** Visual schedule display
- **Priority:** 1
- **Contents:** Calendar with events (colored blocks), time labels
- **Dependencies:** `useApiSchedules` (SWR, date range)
- **Visibility:** Always (empty state if no schedules)
- **Future:** Drag to reschedule, conflict highlighting

#### Section 3: Legend
- **Purpose:** Map colors to playlists
- **Priority:** 3
- **Contents:** Color swatches with playlist names
- **Visibility:** Always (if schedules exist)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| "Create Schedule" button | Button (default) | Toolbar |
| View switcher | ToggleGroup (Radix) | Toolbar |
| Date navigator | Button group (← →) + label | Toolbar |
| Screen filter | Select (Radix) | Toolbar |
| Playlist filter | Select (Radix) | Toolbar |
| Calendar grid | Grid (custom) | Calendar |
| Day cell | Cell | Calendar |
| Event block | Block (colored) | Calendar |
| Event title | Text (xs) | Calendar |
| Event time | Text (xs) | Calendar |
| Conflict indicator | Badge (red, xs) | Calendar |
| Legend item | Color swatch + text | Legend |
| Empty State | EmptyState | Calendar |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Create Schedule" | Opens schedule creation dialog |
| Click | View switcher | Changes calendar view |
| Click | Date navigator ←/→ | Moves to previous/next period |
| Click | Day cell (month view) | Zooms to day view (or opens create dialog for that day) |
| Click | Event block | Opens event details popover or dialog |
| Click | Filter | Filters events shown |
| Hover | Event block | Shows tooltip with details |
| Keyboard | Arrow keys | Navigate calendar days |
| Keyboard | Enter | Open selected day/event |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Calendar with events |
| Loading | Initial load / date change | Skeleton calendar grid |
| Empty — no schedules | 0 schedules | "No schedules created. Scheduling is optional." + "Create Schedule" CTA |
| Empty — no schedules in period | No events in date range | "No schedules for this period." + "Navigate to different month" |
| Creating | Dialog submit | Dialog button spinner |
| Success — create | API 200 | Toast: "Schedule created" + calendar updates |
| Conflict | Overlapping schedules | Red badge on conflicting events |
| Realtime — schedule started | Socket event | Event block highlights + bell notification |
| Error — fetch | API error | Error state + "Retry" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Schedule created | Toast: "Schedule created" |
| Schedule deleted | Toast: "Schedule deleted" |
| Conflict detected | Red badge on events + toast (amber): "Schedule conflict detected" |
| Schedule started | Bell notification (no toast) |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Schedule or immediate publish? | Want content to play at specific time | Schedule (time-based) or immediate publish | Immediate (locked default) |
| Which view? | Looking at schedules | Month (overview), Week (planning), Day (detail) | Month |
| Single or recurring? | Creating schedule | One-time or recurring | One-time |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Schedule overlap | Conflict detection (visual + toast) | Adjust time range |
| Wrong timezone | (Future) Timezone indicator in toolbar | Adjust timezone setting |
| Schedule on deleted screen | AlertDialog: "This screen no longer exists" | Reassign to different screen |
| Forget to activate schedule | Auto-active on creation (no draft state) | — |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Arrow keys navigate calendar, Enter selects |
| Screen reader | Calendar has `role="grid"`, cells have `role="gridcell"` |
| ARIA | Events have `aria-label` with playlist + time + screen |
| Focus | Toolbar → calendar → legend |
| Contrast | Event colors meet 3:1 against background |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| View | Day view only (default) |
| Calendar | Single column with hours |
| Events | Full width blocks |
| Toolbar | Stacked: view switcher → date nav → filters |
| "Create Schedule" | Full width button |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Date range fetch | SWR with date range key (refetches on navigation) |
| Large event counts | Virtualize calendar cells (if 100+ events per month) |
| View switch | SWR cache per view type |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Drag to reschedule | Calendar event blocks |
| Conflict visualization | Overlapping blocks or red indicators |
| Timezone selector | Toolbar |
| Schedule templates | In creation dialog |
| Approval workflow | Status badge on events |
| Calendar export (iCal) | Toolbar menu |

### 20. UX Notes
- Scheduling is optional — the empty state must communicate this clearly
- Calendar should default to month view on desktop, day view on mobile
- Conflict detection is critical but currently missing — must be implemented
- Event colors should map to playlists for visual scanning
- Creation dialog should be a dialog, not a full page (keeps calendar context)
- Consider showing "now" indicator (current time line) in week/day views
- Recurrence rules should be progressive (simple options first, advanced collapsed)

---

## P-AN-01: Analytics Dashboard

### 1. Purpose
- **Business purpose:** Performance insights; data-driven content decisions
- **User purpose:** Understand how screens and content are performing
- **Success criteria:** User can assess performance within 15 seconds
- **Failure criteria:** Empty charts; no actionable insights; too many metrics

### 2. Target Users
- **Primary user:** Workspace Owner (performance review)
- **Secondary user:** Editor, Viewer
- **Permissions:** All roles (read-only)
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Entity priority #7; weekly use; insights, not daily operations

### 4. Primary Goal
Assess screen health and content performance

### 5. Primary Action
Select period (7d, 30d, 90d, custom)

### 6. Secondary Actions
1. Switch tab (Screen Health | Content Performance)
2. Export report (future)
3. Click metric → Drill down to screen/playlist
4. Change comparison (previous period — future)

### 7. Information Priority
1. Period selector — **time context**
2. Key metrics (uptime, impressions, active screens) — **headline numbers**
3. Trends (sparklines or mini charts) — **direction**
4. Top/bottom performers — **actionable insights**
5. Detailed charts — **deep dive**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Analytics" + period selector (7d | 30d | 90d | Custom)
- Tab bar (Screen Health | Content Performance)
- Key metric cards (3-4 cards in a row)

**Middle:**
- Main chart (trend over time)
- Top performers list

**Bottom:**
- Bottom performers list
- Summary insights (future)

### 9. Page Sections

#### Section 1: Period Selector
- **Purpose:** Time range for all data
- **Priority:** 1
- **Contents:** Toggle buttons (7d, 30d, 90d) + custom date picker
- **Visibility:** Always

#### Section 2: Tab Bar
- **Purpose:** Switch between analytics perspectives
- **Priority:** 1
- **Contents:** "Screen Health" tab, "Content Performance" tab
- **Visibility:** Always

#### Section 3: Key Metrics
- **Purpose:** Headline numbers at a glance
- **Priority:** 1
- **Contents:** 3-4 metric cards (uptime %, active screens, total impressions, content changes)
- **Dependencies:** `useApiAnalytics` (SWR, period-scoped)
- **Visibility:** Always

#### Section 4: Trend Chart
- **Purpose:** Visual trend over time
- **Priority:** 2
- **Contents:** Line or area chart showing key metric over selected period
- **Visibility:** Always (empty state if no data)

#### Section 5: Performers Lists
- **Purpose:** Identify best and worst performers
- **Priority:** 2
- **Contents:** Top 5 screens/playlists by metric, bottom 5
- **Visibility:** Always (if data exists)

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| Period selector | ToggleGroup (Radix) | Period |
| Custom date picker | DatePicker (Radix) | Period |
| Tab bar | Tabs (Radix) | Tabs |
| Metric card | Card | Key Metrics |
| Metric value | Text (large) | Key Metrics |
| Metric label | Text (muted) | Key Metrics |
| Metric trend | Sparkline / Text (↑↓) | Key Metrics |
| Trend chart | Chart (area/line) | Trend |
| Performer item | List item | Performers |
| Performer name | Text | Performers |
| Performer metric | Text (muted) | Performers |
| "View Details" link | Link | Performers |
| Empty State | EmptyState | All sections |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | Period selector | Changes all data to selected period |
| Click | Tab | Switches between Screen Health and Content Performance |
| Click | Metric card | (Future) Drills down to detailed view |
| Click | Performer item | Navigates to screen/playlist detail |
| Hover | Chart point | Shows tooltip with date + value |
| Keyboard | Tab | Through period → tabs → metrics → chart |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | All sections with data |
| Loading | Initial load / period change | Skeleton cards + skeleton chart |
| Empty — no data | No analytics data | "No analytics data yet. Add screens and publish content." + "Add Screen" CTA |
| Empty — no data in period | No data for selected period | "No data for this period." + "Try a different period" |
| Error — fetch | API error | Error state + "Retry" |
| Period changing | New period selected | Skeleton reload of all sections |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Period change | Skeleton reload (brief) |
| Tab switch | Content fades in (MI-08) |
| Data loaded | Charts animate in (opacity, not slide) |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Which period? | Selecting time range | 7d, 30d, 90d, custom | 30d (balanced view) |
| Screen or content? | Analytics perspective | Screen Health or Content Performance | Screen Health |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Wrong period | Period selector is prominent | Change period |
| Misinterpret empty data | Clear empty state with guidance | "Add screens and publish content" |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through all interactive elements |
| Screen reader | Chart has `aria-label` describing data; metrics have text alternatives |
| ARIA | Tabs have proper roles (Radix) |
| Contrast | Chart colors meet 3:1 |
| Reduced motion | Charts fade in, no slide (MI-15) |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column, stacked |
| Period selector | Full width toggle |
| Metric cards | 1 per row, full width |
| Chart | Full width, simplified |
| Performers | Full width list |
| Tabs | Horizontal scroll if needed |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Data fetch | SWR with period key (refetches on change) |
| Chart rendering | Use lightweight chart library (Recharts or custom SVG) |
| Large datasets | Aggregate on backend, not frontend |
| Tab switch | SWR cache per tab (instant switch) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Proof-of-play reports | New tab or sub-page |
| Device crash reports | New tab or sub-page |
| Export (PDF/CSV) | Toolbar button |
| Comparison mode | Period selector enhancement |
| Custom dashboards | Widget configuration |
| Real-time analytics | Live updating charts |

### 20. UX Notes
- Analytics is NOT the Overview — it shows trends and detailed metrics, not just counts (PR-09)
- Period selector is the primary interaction — all data depends on it
- Key metrics should show trend indicators (↑↓) for quick assessment
- Charts should be simple (line/area) not complex (stacked bar, radar)
- Empty state is common for new workspaces — guide users to add screens
- Consider showing "last updated" timestamp for data freshness
- Mobile charts should be simplified (fewer data points, larger text)

---

## P-TM-01: Team List

### 1. Purpose
- **Business purpose:** Team delegation; access management
- **User purpose:** Invite, remove, or change roles of team members
- **Success criteria:** User can invite a member within 30 seconds; user can change role within 15 seconds
- **Failure criteria:** Can't invite; can't change role; unclear permission levels

### 2. Target Users
- **Primary user:** Workspace Owner (manage team)
- **Secondary user:** Editor, Viewer (view team)
- **Permissions:** Owner: full CRUD. Editor/Viewer: view only.
- **Visibility:** Authenticated + has workspace

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Entity priority #6; occasional use; important for enterprise

### 4. Primary Goal
Manage team members and their access

### 5. Primary Action
"Invite Member" (dialog)

### 6. Secondary Actions
1. Change role (dropdown per member)
2. Remove member (→ AlertDialog)
3. Cancel pending invite
4. Resend pending invite
5. Search members by name/email
6. Filter by role or status (active/pending)

### 7. Information Priority
1. Member name — **identification**
2. Member email — **contact**
3. Role (Owner/Editor/Viewer) — **access level**
4. Status (Active/Pending) — **account state**
5. Avatar — **visual identification**
6. Joined date — **tenure**

### 8. Visual Hierarchy

**Above the fold:**
- Page title "Team" + "Invite Member" button
- Search bar + role filter

**Middle:**
- Active members section (table or list)
- Pending invites section (separate, below active)

**Bottom:**
- (No pagination needed — teams are typically < 50 members)

### 9. Page Sections

#### Section 1: Active Members
- **Purpose:** List current team members
- **Priority:** 1
- **Contents:** Member rows with avatar, name, email, role dropdown, "Remove" button
- **Dependencies:** `useApiTeam` (SWR, workspace-scoped)
- **Visibility:** Always (empty state if solo)
- **Future:** Custom roles, last active timestamp

#### Section 2: Pending Invites
- **Purpose:** Track sent invitations
- **Priority:** 2
- **Contents:** Invite rows with email, role, sent date, "Resend" and "Cancel" buttons
- **Visibility:** Only if pending invites exist
- **Future:** Expiry indicator

### 10. Component Inventory

| Component | Type | Section |
|-----------|------|---------|
| "Invite Member" button | Button (default) | Toolbar |
| Search input | Input (text) | Toolbar |
| Role filter | Select (Radix) | Toolbar |
| Member row | List item | Active |
| Avatar | Avatar (image/initials) | Active |
| Member name | Text (medium) | Active |
| Member email | Text (muted) | Active |
| Role dropdown | Select (Radix) | Active |
| "Remove" button | Button (ghost, destructive) | Active |
| Invite row | List item | Pending |
| Invite email | Text | Pending |
| Invite role | Badge | Pending |
| Sent date | Text (muted) | Pending |
| "Resend" button | Button (ghost) | Pending |
| "Cancel" button | Button (ghost) | Pending |
| Empty State | EmptyState | Active (if solo) |
| Skeleton | Skeleton | Loading |

### 11. Interaction Rules

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Invite Member" | Opens invite dialog |
| Click | Role dropdown | Opens role selector |
| Click | "Remove" | Opens AlertDialog |
| Click | "Resend" | Resends invite + toast |
| Click | "Cancel" | Cancels invite + toast |
| Click | Member row | (Future) Opens member detail |
| Search | Type | Debounced 300ms |
| Keyboard | Tab | Through toolbar → members |

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Data cached | Member list |
| Loading | Initial load | 3-5 skeleton rows |
| Empty — solo | Only owner | "You're the only member" + "Invite Member" CTA |
| Empty — filtered | Search returns 0 | "No members found" + "Clear Search" |
| Inviting | Dialog submit | Dialog button spinner |
| Success — invite | API 200 | Toast: "Invitation sent to [email]" + pending list updates |
| Changing role | Role dropdown change | Inline spinner + toast: "Role changed to [role]" |
| Removing | AlertDialog confirm | Spinner |
| Success — remove | API 200 | Toast: "[Name] removed" + list updates |
| Error — invite exists | API 409 | Inline: "This email has already been invited" |

### 13. Feedback Rules

| Event | Feedback |
|-------|----------|
| Invite sent | Toast: "Invitation sent to [email]" |
| Invite accepted (realtime) | Toast: "[Name] joined the team" + bell notification |
| Role changed | Toast: "[Name] is now [Role]" |
| Member removed | Toast: "[Name] removed from team" |
| Invite resent | Toast: "Invitation resent to [email]" |
| Invite cancelled | Toast: "Invitation cancelled" |

### 14. Decision Points

| Decision | Context | Choices | Default |
|----------|---------|---------|---------|
| Which role? | Inviting member | Owner, Editor, Viewer | Editor (most common for team members) |
| Remove or change role? | Member needs different access | Remove or change role | Change role (less disruptive) |

### 15. User Mistakes

| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Remove wrong member | AlertDialog: "Remove [Name] from the workspace?" | Must confirm |
| Invite wrong email | Email is shown in dialog before send | Re-enter |
| Change role accidentally | Role change is immediate (no confirm) — consider confirmation for demotion | (Future) Confirm on demotion |
| Invite existing member | Check on submit | Inline error: "Already a member" |

### 16. Accessibility

| Element | Rule |
|---------|------|
| Keyboard | Tab through members, role dropdowns, buttons |
| Screen reader | Role dropdown has `aria-label` with member name |
| Focus order | Toolbar → active members → pending invites |
| Touch targets | All buttons ≥ 44px |

### 17. Mobile Experience

| Element | Mobile |
|---------|--------|
| Layout | Single column |
| Member rows | Full width, stacked info |
| Role dropdown | Full width select |
| "Remove" | In "More" menu per member |
| Pending invites | Full width rows |

### 18. Performance UX

| Concern | Strategy |
|---------|----------|
| Load | SWR fetch (typically < 50 members, fast) |
| Realtime | Socket.IO for invite acceptance |
| Search | Client-side filter (small dataset) |

### 19. Future Expansion

| Feature | Placement |
|---------|-----------|
| Custom roles | Role dropdown enhancement |
| Member detail page | Click member row |
| Last active timestamp | Member row |
| Bulk role change | Checkbox + bulk bar |
| Permission matrix | New section or dialog |
| Activity log per member | Member detail page |
| SSO user management | Integration with Settings → Security |

### 20. UX Notes
- Team list is typically short (< 50 members) — no pagination needed
- Pending invites should be visually separated from active members
- Role change should be immediate with toast feedback (no dialog needed for promotion)
- Consider confirmation for role demotion (Owner → Editor) to prevent accidental demotion
- "Invite Member" dialog should default to "Editor" role (most common)
- Avatar should show initials if no image is set
- Search should filter by both name and email
- Remove confirmation should state: "[Name] will lose access to all screens and content in this workspace"

---

## Cross-References

- See `05-page-type-ux-rules.md` for page type rules
- See `information-architecture/06-page-catalog.md` P-SCH-01, P-AN-01, P-TM-01
- See `audits/frontend/12-schedules-feature.md` for schedules audit
- See `audits/frontend/18-analytics-feature.md` for analytics audit
- See `audits/frontend/16-team-feature.md` for team audit
- See `product-architecture/09-product-modules.md` M-04, M-05, M-06
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
