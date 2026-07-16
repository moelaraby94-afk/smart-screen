# Cross-Flow Relationships

> **Evidence basis:** `01-flow-principles.md`, `02-flow-matrix.md`, `ux-blueprint/05-navigation-architecture.md` §7 (cross-navigation map), `product-architecture/05-primary-user-journey.md`, `product-architecture/06-secondary-journeys.md`
> **Purpose:** Define flow dependencies, cross-flow relationships, critical path analysis, and flow dependency graph

---

## 1. Flow Dependencies

### 1.1 Hard Dependencies (Must Complete Before)

| Flow | Depends On | Reason |
|------|-----------|--------|
| FL-OB-02 (First Playlist) | FL-OB-01 (First Screen) | User creates content after pairing screen |
| FL-OB-03 (First Media) | FL-WS-01 (Workspace Creation) | Media belongs to workspace |
| FL-OB-04 (First Publish) | FL-OB-02 (First Playlist) | Must have content to publish |
| FL-OB-04 (First Publish) | FL-OB-01 (First Screen) | Must have screen to publish to |
| FL-PUB-01 (Immediate Publish) | FL-PL-01 (Playlist Creation) | Must have playlist to publish |
| FL-PUB-01 (Immediate Publish) | FL-SC-01 (Screen Pairing) | Must have screen to publish to |
| FL-SCH-01 (Schedule Creation) | FL-PL-01 (Playlist Creation) | Must have playlist to schedule |
| FL-SCH-01 (Schedule Creation) | FL-SC-01 (Screen Pairing) | Must have screen to schedule on |
| FL-PL-02 (Studio Editing) | FL-PL-01 (Playlist Creation) | Must have playlist to edit |
| FL-PL-02 (Studio Editing) | FL-MED-01 (Media Upload) | Must have media to add to playlist |
| FL-AN-01 (Analytics) | FL-SC-01 (Screen Pairing) | Must have screens for analytics data |
| FL-AN-01 (Analytics) | FL-PUB-01 (Publish) | Must have published content for data |
| FL-TM-01 (Team Invitation) | FL-WS-01 (Workspace Creation) | Team belongs to workspace |
| FL-ST-04 (Billing) | FL-AUTH-02 (Registration) | Must be registered for billing |
| FL-ST-05 (API Key) | FL-AUTH-02 (Registration) | Must be registered for API access |
| FL-AD-01 (Impersonation) | FL-AUTH-01 (Login as Super-Admin) | Must be admin to impersonate |

### 1.2 Soft Dependencies (Recommended Before)

| Flow | Recommended After | Reason |
|------|-------------------|--------|
| FL-SCH-01 (Schedule Creation) | FL-PUB-01 (Immediate Publish) | User should know immediate publish before scheduling |
| FL-AN-01 (Analytics) | FL-PUB-01 (Publish) | Analytics meaningful after publishing |
| FL-TM-01 (Team Invitation) | FL-OB-04 (First Publish) | Invite team after initial setup |
| FL-ST-03 (2FA Setup) | FL-AUTH-02 (Registration) | Security after registration |
| FL-ST-04 (Billing Upgrade) | FL-OB-01 (First Screen) | Upgrade when exceeding free limits |

---

## 2. Cross-Flow Navigation Map

### 2.1 Screen ↔ Content Flows

| From Flow | To Flow | Trigger | Navigation |
|-----------|---------|---------|------------|
| FL-SC-02 (Screen Detail) | FL-PL-02 (Studio Editing) | Click "Edit Playlist" | `/screens/{id}` → `/content/playlists/{id}/studio` |
| FL-SC-02 (Screen Detail) | FL-PUB-01 (Publish) | Click "Assign Content" | Dialog opens from screen detail |
| FL-SC-02 (Screen Detail) | FL-SCH-01 (Schedule) | Click "View All Schedules" | `/screens/{id}` → `/scheduling` (filtered) |
| FL-PL-03 (Playlist Detail) | FL-SC-02 (Screen Detail) | Click screen in "Assigned Screens" | `/content/playlists/{id}` → `/screens/{id}` |
| FL-PL-03 (Playlist Detail) | FL-PL-02 (Studio) | Click "Edit in Studio" | `/content/playlists/{id}` → `/content/playlists/{id}/studio` |
| FL-PL-03 (Playlist Detail) | FL-SCH-01 (Schedule) | Click "Create Schedule" | `/content/playlists/{id}` → `/scheduling` (pre-filled) |

### 2.2 Overview ↔ Everywhere Flows

| From Flow | To Flow | Trigger | Navigation |
|-----------|---------|---------|------------|
| FL-SYS-04 (Quick Actions) | FL-SC-01 (Screen Pairing) | Click "Add Screen" | `/overview` → `/screens/pair` |
| FL-SYS-04 (Quick Actions) | FL-PL-01 (Playlist Creation) | Click "Create Playlist" | `/overview` → `/content` |
| FL-SYS-04 (Quick Actions) | FL-SCH-01 (Schedule) | Click "View Schedule" | `/overview` → `/scheduling` |
| FL-OB-05 (Empty Workspace) | FL-SC-01 (Screen Pairing) | Click "Add Your First Screen" | `/overview` → `/screens/pair` |

### 2.3 Notification ↔ Entity Flows

| From Flow | To Flow | Trigger | Navigation |
|-----------|---------|---------|------------|
| FL-NT-01 (Notification View) | FL-SC-02 (Screen Detail) | Click "Screen offline" notification | `/notifications` → `/screens/{id}` |
| FL-NT-01 (Notification View) | FL-SCH-03 (Schedule Edit) | Click "Schedule started" notification | `/notifications` → `/scheduling` |
| FL-NT-01 (Notification View) | FL-TM-01 (Team) | Click "Team invite accepted" notification | `/notifications` → `/team` |

### 2.4 Settings ↔ Team Flows

| From Flow | To Flow | Trigger | Navigation |
|-----------|---------|---------|------------|
| FL-ST-01 (Profile) | FL-ST-02 (Password Change) | Click "Change Password" | `/settings` → `/settings/security` |
| FL-ST-06 (Notification Prefs) | FL-NT-01 (Notification View) | (Contextual link) | `/settings/notifications` → `/notifications` |

---

## 3. Critical Path Analysis

### 3.1 Primary Critical Path (5-Minute KPI)

```
Registration → Workspace Creation → Screen Pairing → Playlist Creation → First Publish
     30s            10s                 60s               60s              30s
                                                                      Total: ~190s (3.2 min)
```

| Step | Flow ID | Duration Target | Cumulative | Evidence |
|------|---------|----------------|------------|----------|
| 1. Register | FL-AUTH-02 | 30s | 30s | `06-auth-ux-blueprint.md` |
| 2. Workspace (auto) | FL-WS-01 | 10s | 40s | Auto-create on registration |
| 3. Pair Screen | FL-SC-01 | 60s | 100s | `08-screens-ux-blueprint.md` |
| 4. Create Playlist | FL-PL-01 | 60s | 160s | Template picker (5-min KPI) |
| 5. Publish | FL-PUB-01 | 30s | 190s | `09-content-studio-ux-blueprint.md` |

**Critical Path Status:** 190s target vs. 300s KPI = **63% of budget used**. 110s buffer for errors, hesitation, and network latency.

### 3.2 Secondary Critical Path (Daily Operations)

```
Login → Overview → Check Screen Health → Click Offline Screen → Assign Content → Done
  10s      2s          3s                    5s                    15s           35s total
```

### 3.3 Tertiary Critical Path (Content Management)

```
Login → Content → Create Playlist → Upload Media → Edit in Studio → Save → Publish
  10s    2s         5s              20s            60s+             3s     10s   110s+
```

---

## 4. Flow Dependency Graph

```
                    FL-AUTH-02 (Registration)
                         │
                    FL-WS-01 (Workspace)
                         │
              ┌──────────┼──────────┐
              │          │          │
         FL-SC-01    FL-MED-01   FL-TM-01
        (Pair Screen) (Upload)  (Invite)
              │          │
              │     FL-PL-01 (Create Playlist)
              │          │
              │     FL-PL-02 (Studio Edit)
              │          │
              └──────────┤
                         │
                    FL-PUB-01 (Publish)
                         │
              ┌──────────┼──────────┐
              │          │          │
         FL-SCH-01   FL-AN-01   FL-NT-01
        (Schedule)  (Analytics) (Notifications)
```

---

## 5. Flow Chain Patterns

### 5.1 Create-Publish Chain

```
FL-MED-01 → FL-PL-01 → FL-PL-02 → FL-PUB-01
(Upload)   (Create)   (Edit)     (Publish)
```

**Frequency:** Weekly
**Total steps:** 4 flows, ~15 steps
**Critical for:** 5-minute KPI (first time), weekly content updates (returning)

### 5.2 Screen-Troubleshoot Chain

```
FL-NT-01 → FL-SC-02 → FL-PL-02 or FL-PUB-01
(Alert)   (Detail)   (Fix content or republish)
```

**Frequency:** Daily (when screens go offline)
**Total steps:** 3 flows, ~6 steps
**Critical for:** Screen uptime

### 5.3 Schedule-Conflict Chain

```
FL-SCH-01 → FL-SCH-02 → FL-SCH-03
(Create)   (Conflict)  (Edit/Resolve)
```

**Frequency:** Occasional
**Total steps:** 3 flows, ~12 steps
**Critical for:** Schedule integrity

### 5.4 Team-Onboarding Chain

```
FL-TM-01 → FL-AUTH-02 (invitee) → FL-WS-02 (select workspace) → FL-OB-05 (onboarding)
(Invite)   (Register)             (Switch)                     (Guided)
```

**Frequency:** Occasional
**Total steps:** 4 flows, ~10 steps
**Critical for:** Team scaling

### 5.5 Admin-Support Chain

```
FL-AD-01 → FL-SC-02 or FL-ST-04 or FL-PL-03
(Impersonate) (Screen Detail) (Billing) (Playlist)
```

**Frequency:** Occasional
**Total steps:** 2-3 flows, ~6 steps
**Critical for:** Customer support

---

## 6. Flow Interaction Rules

### 6.1 Concurrent Flow Rules

| Scenario | Rule | Evidence |
|----------|------|----------|
| User in Studio + screen goes offline | Toast notification + bell badge; Studio stays open | `04-feature-ux-standards.md` §1 |
| User in Schedule dialog + new notification | Bell badge updates; dialog stays open | — |
| User uploading media + navigates away | Upload continues in background; toast on completion | F-MP-16 |
| User editing form + session expires | Form data lost; redirect to login; toast: "Session expired" | FR-07 |
| User in Studio + another user edits same playlist | (Future) Optimistic locking; conflict warning | FR-11 |

### 6.2 Flow Interruption Rules

| Interruption | Behavior | Recovery |
|-------------|----------|----------|
| Network loss during flow | Toast: "Connection lost. Retrying..." | Auto-retry when connection restored |
| Session timeout during flow | Redirect to login + toast | User re-logs in; flow restarts |
| Browser refresh during flow | Form data lost (current); state persisted (future) | User re-navigates and restarts |
| Tab close during flow | Flow abandoned; no cleanup needed | User re-navigates |
| Navigation away during flow | (Current) No warning; (Future) Unsaved changes warning | User confirms or cancels |

---

## Cross-References

- See `01-flow-principles.md` for flow principles
- See `02-flow-matrix.md` for flow matrices
- See `03-decision-trees.md` for decision trees
- See `04-state-machines.md` for entity state machines
- See `06-auth-flows.md` through `18-edge-cases.md` for detailed flow documentation
- See `ux-blueprint/05-navigation-architecture.md` §7 for cross-navigation map
- See `product-architecture/05-primary-user-journey.md` for primary journey
- See `product-architecture/06-secondary-journeys.md` for secondary journeys
