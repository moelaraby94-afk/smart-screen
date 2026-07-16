# Secondary Journeys

> **Evidence basis:** `27-user-flows.md` (audit), `06-user-journey-analysis.md` (transformation), `09-workflow-analysis.md` (transformation)
> **Purpose:** Define the secondary user journeys that occur after the primary journey (5-minute onboarding) is complete

---

## 1. Journey Inventory

| ID | Journey | Primary Actor | Frequency | Priority |
|----|---------|---------------|-----------|----------|
| J-01 | Daily Monitoring | Workspace Owner, Editor | Daily | High |
| J-02 | Content Update | Editor | Weekly | High |
| J-03 | Screen Fleet Expansion | Workspace Owner | Monthly | Medium |
| J-04 | Schedule Campaign | Editor | Weekly/Monthly | Medium |
| J-05 | Team Management | Workspace Owner | Occasional | Medium |
| J-06 | Billing & Plan Management | Workspace Owner | Monthly | Low |
| J-07 | Analytics Review | Workspace Owner, Editor | Weekly | Low |
| J-08 | Multi-Workspace Switching | Agency/MSP Owner | Daily | Low |
| J-09 | Admin Impersonation | Super-Admin | Occasional | Low |
| J-10 | Screen Troubleshooting | Workspace Owner, Editor | As needed | Medium |

---

## 2. J-01: Daily Monitoring

### Goal
Check that all screens are online and displaying correct content.

### Flow
```
Login → Overview → Check screen health summary
  │
  ├── All screens online → Done (exit)
  │
  └── Screen(s) offline → Click screen → Screen detail → Investigate
       │
       ├── Screen reboot → Wait for reconnect → Done
       │
       └── Screen needs physical intervention → Note → Exit
```

### Architecture Requirements
- Overview must show screen health summary (online/offline counts) at a glance
- Offline screens must be clickable to navigate to screen detail
- Screen detail must show last-seen timestamp, current status, and quick actions
- Realtime updates via Socket.IO must reflect status changes without page refresh

### Evidence
`08-dashboard-and-overview.md` §8.17 (current dashboard widgets); `09-screens-feature.md` §9.8 (screen detail); `transformation/09-workflow-analysis.md` §1.1 Step 1-2.

---

## 3. J-02: Content Update

### Goal
Update promotional content for a new campaign or menu change.

### Flow
```
Navigate to Content → Playlists
  │
  ├── Edit existing playlist → Studio → Update media → Save → Publish
  │
  └── Create new playlist
       │
       ├── From template → Customize → Publish
       │
       └── From blank → Studio → Add media → Arrange → Save → Publish
              │
              └── Need new media? → Upload from Studio → Continue editing
```

### Architecture Requirements
- Content section combines Playlists and Media (locked decision)
- Media upload is available from within Studio (locked decision)
- Playlist edit → Studio is a seamless transition (not a separate navigation)
- Publish from Studio or playlist detail defaults to immediate
- Template picker is shown on "Create Playlist" action

### Evidence
`10-playlists-and-studio.md` §10.12 (Studio); `11-media-library.md` §11.8 (media upload); `transformation/09-workflow-analysis.md` §1.1 Step 3-5.

---

## 4. J-03: Screen Fleet Expansion

### Goal
Add new screens to the workspace as the business grows (new restaurant location, additional displays).

### Flow
```
Navigate to Screens → "Add Screen" → Pairing Wizard
  │
  ├── Step 1: Enter pairing code (displayed on screen)
  ├── Step 2: Name the screen
  ├── Step 3: (Optional) Assign to branch
  └── Step 4: Confirm → Screen paired
       │
       └── Assign content → Select playlist → Publish
```

### Architecture Requirements
- Pairing wizard is the same component used in the primary journey
- Branch assignment is optional (can be done later from screen detail)
- Post-pairing CTA: "Assign content to this screen"
- Screen list updates in realtime when a new screen is paired

### Evidence
`09-screens-feature.md` §9.8 (screen setup); `transformation/06-user-journey-analysis.md` Journey 3.

---

## 5. J-04: Schedule Campaign

### Goal
Schedule a promotional playlist to play during specific times (e.g., lunch special, weekend promotion).

### Flow
```
Navigate to Scheduling → "Create Schedule"
  │
  ├── Select playlist
  ├── Select screen(s) (multi-select)
  ├── Set time rules:
  │    ├── Start date/time
  │    ├── End date/time (or "always")
  │    ├── Recurrence (daily, weekly, custom)
  │    └── Time slots (e.g., 11:00-14:00)
  ├── Conflict detection (real-time feedback)
  └── Save → Schedule active
```

### Architecture Requirements
- Scheduling section uses calendar view as default
- Schedule creation form uses progressive disclosure (basic fields first, advanced collapsed)
- Conflict detection runs as user selects screens and time slots
- Schedule list supports bulk activate/deactivate

### Evidence
`12-schedules-feature.md` §12.8 (schedule creation); `transformation/06-user-journey-analysis.md` Journey 5; `transformation/11-cognitive-load-analysis.md` §2.5 (schedule form: HIGH extraneous load).

---

## 6. J-05: Team Management

### Goal
Invite team members and assign roles.

### Flow
```
Navigate to Team
  │
  ├── Invite member → Enter email → Select role → Send invite
  │
  ├── Change role → Select member → Change role → Confirm
  │
  ├── Remove member → Select member → Remove → Confirm (destructive action)
  │
  └── Cancel/Resend invite → Select pending invite → Action
```

### Architecture Requirements
- Team section shows active members and pending invites separately
- Role change is inline or via dialog (not a separate page)
- Remove member requires confirmation (destructive action — PP-07)
- Pending invites have cancel and resend actions

### Evidence
`16-team-feature.md` §16.4 (current team management); `transformation/09-workflow-analysis.md` §1.1 Step 9 (team management: ❌ Poor).

---

## 7. J-06: Billing & Plan Management

### Goal
View current plan, upgrade, download invoices.

### Flow
```
Navigate to Settings → Billing
  │
  ├── View current plan and usage
  ├── Upgrade plan → Select plan → Confirm
  ├── Download invoice → Select invoice → Download PDF
  └── Update payment method → Enter new card → Save
```

### Architecture Requirements
- Billing tab is in Settings (not a separate section)
- Plan comparison shows features and limits
- Invoice download is a direct action (no preview page)
- Payment method update uses secure form (backend-handled)

### Evidence
`14-settings-feature.md` §14.8 (current billing: ❌ Poor — no plan selector, no invoice download).

---

## 8. J-07: Analytics Review

### Goal
Review screen performance and content engagement.

### Flow
```
Navigate to Analytics
  │
  ├── Select period (7d, 30d, 90d, custom)
  ├── View screen health analytics (uptime, downtime)
  ├── View content performance (play count, duration)
  └── Export (if needed) → Download CSV/PDF
```

### Architecture Requirements
- Analytics is a separate section (not on Overview)
- Overview shows minimal health summary only (locked decision)
- Period selection is a global filter for the analytics section
- Export is a future feature (currently missing)

### Evidence
`18-analytics-feature.md` §18.8 (current analytics); `transformation/09-workflow-analysis.md` §1.1 Step 7.

---

## 9. J-08: Multi-Workspace Switching

### Goal
Switch between workspaces (for agency/MSP users managing multiple customers).

### Flow
```
Click workspace switcher (header on desktop, sidebar top on mobile)
  │
  ├── Search workspace (if > 10 workspaces)
  ├── Select workspace → Data refreshes → Navigate to /overview
  └── (Optional) Create new workspace → Workspace setup
```

### Architecture Requirements
- Workspace switcher is always accessible (header on desktop, sidebar on mobile — DD-11)
- Switching navigates to /overview (DD-04)
- All cached data is invalidated on switch (data epoch bump)
- Switcher supports search for 100+ workspaces (SCL-01)

### Evidence
`07-workspace-management.md` §7.11 (current switcher); `transformation/06-user-journey-analysis.md` Journey 6; DD-04, DD-11.

---

## 10. J-09: Admin Impersonation

### Goal
Super-admin views the product as a specific customer to provide support.

### Flow
```
Admin → Customers → Select customer → "Impersonate"
  │
  ├── Client UI loads with customer's workspace context
  ├── ImpersonationReturnButton is always visible
  ├── Admin navigates and interacts as the customer
  └── Click "Return to Admin" → Admin UI restored
```

### Architecture Requirements
- Impersonation is admin-only, accessed from customer detail
- ImpersonationReturnButton is always visible (floating, persistent)
- All client features work during impersonation
- No visible indication to the impersonated user (current behavior — may need audit trail in future)

### Evidence
`15-admin-panel.md` §15.17 (impersonation); `27-user-flows.md` §27.9 (impersonation flow); `04-layout-and-shell.md` §4.6 (WorkspaceGate).

---

## 11. J-10: Screen Troubleshooting

### Goal
Diagnose and resolve a screen that is offline or displaying incorrect content.

### Flow
```
Overview → Offline screen alert → Screen detail
  │
  ├── Check last-seen timestamp
  ├── Check current playlist assignment
  ├── Try remote reboot (if available)
  ├── Check schedule conflicts
  └── Reassign content if needed → Select playlist → Publish
```

### Architecture Requirements
- Screen detail shows: status, last-seen, current playlist, active schedules, recent events
- Remote reboot is a future feature (currently not implemented)
- Schedule conflicts are visible on screen detail
- Content reassignment is a quick action from screen detail

### Evidence
`09-screens-feature.md` §9.8 (screen detail); `transformation/06-user-journey-analysis.md` Journey 7.

---

## 12. Journey Priority Matrix

| Journey | User Frequency | Business Impact | Architecture Investment |
|---------|---------------|-----------------|------------------------|
| J-01 Daily Monitoring | Daily | High — screen health = revenue | Medium — Overview optimization |
| J-02 Content Update | Weekly | High — content freshness = relevance | High — templates, Studio UX |
| J-10 Screen Troubleshooting | As needed | High — downtime = lost display | Medium — screen detail enhancement |
| J-03 Fleet Expansion | Monthly | Medium — growth | Low — wizard already needed |
| J-04 Schedule Campaign | Weekly/Monthly | Medium — targeted promotions | Medium — scheduling UX |
| J-05 Team Management | Occasional | Medium — delegation | Low — CRUD operations |
| J-07 Analytics Review | Weekly | Low — insights | Low — charts already work |
| J-06 Billing | Monthly | Low — revenue operations | Low — settings tab |
| J-08 Multi-Workspace | Daily (agencies) | Low — niche user type | Low — switcher enhancement |
| J-09 Admin Impersonation | Occasional | Low — support tool | Low — already works |

---

## Cross-References

- See `05-primary-user-journey.md` for the 5-minute onboarding journey
- See `07-core-user-goals.md` for goals that motivate these journeys
- See `08-jobs-to-be-done.md` for JTBD framework
- See `09-product-modules.md` for modules that support these journeys
- See `transformation/06-user-journey-analysis.md` for current-state journey analysis
- See `transformation/09-workflow-analysis.md` for workflow analysis per user type
