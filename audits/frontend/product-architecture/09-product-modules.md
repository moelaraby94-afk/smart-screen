# Product Modules

> **Evidence basis:** `04-product-hierarchy.md`, locked sidebar decision, `03-routing-and-navigation.md` (audit), `04-layout-and-shell.md` (audit)
> **Purpose:** Define the product modules — the top-level functional units that compose the frontend product

---

## 1. Module Definition

A **product module** is a self-contained functional unit that owns a set of entities, screens, and workflows. Modules map directly to the 7 first-level navigation items (locked decision).

---

## 2. Module Inventory

| ID | Module | Sidebar Section | Entity Priority | Primary Job | Evidence |
|----|--------|----------------|----------------|-------------|----------|
| M-01 | Overview | Overview | — | JTD-02, JTD-11 | Locked sidebar decision |
| M-02 | Screens | Screens | #2 | JTD-01, JTD-02, JTD-07 | Locked sidebar decision |
| M-03 | Content | Content | #3, #4 | JTD-03, JTD-12 | Locked sidebar decision |
| M-04 | Scheduling | Scheduling | #5 | JTD-04 | Locked sidebar decision |
| M-05 | Analytics | Analytics | #7 | JTD-06 | Locked sidebar decision |
| M-06 | Team | Team | #6 | JTD-05 | Locked sidebar decision |
| M-07 | Settings | Settings | — | JTD-05, JTD-08, JTD-09, JTD-10 | Locked sidebar decision |
| M-08 | Admin | (admin mode) | — | JTD-02 (platform-level) | `15-admin-panel.md` (audit) |

---

## 3. Module Overview

### M-01: Overview Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | System status, quick actions, recent activity, screen health |
| **Entities** | None (reads from Screens, Playlists, Schedules) |
| **Screens** | Overview page (`/overview`) |
| **Navigation** | First sidebar item |
| **Content type** | Dashboard (not analytics-heavy — locked decision) |
| **Data sources** | Screen health (SWR), recent activity (SWR), active schedules (SWR) |
| **Realtime** | Socket.IO for screen status changes |
| **Architecture role** | Landing page after login and workspace switch; status at a glance |

**Architecture rules:**
- Overview is the default landing page (DD-04)
- Overview shows screen health summary (online/offline counts), not detailed analytics
- Overview provides quick actions: "Add Screen", "Create Playlist", "View Schedule"
- Overview shows recent activity feed (last 5-10 events)
- Overview is always accessible from any page via sidebar

### M-02: Screens Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Screen management, pairing, health monitoring, branch organization |
| **Entities** | Screen, Branch (optional) |
| **Screens** | Screen list (`/screens`), Screen detail (`/screens/{id}`) |
| **Navigation** | Second sidebar item |
| **Data sources** | Screen list (SWR), Screen detail (SWR), Branch list (SWR for filter) |
| **Realtime** | Socket.IO for screen status, pairing events |
| **Architecture role** | Primary management target (entity priority #2) |

**Architecture rules:**
- Screen list supports search, filter (by branch, status), and bulk operations
- Screen pairing uses a wizard (locked decision)
- Branch is a filter within Screens, not a separate nav item (DD-03)
- Screen detail shows: status, current playlist, active schedules, quick actions
- Screen detail supports content override and (future) remote reboot

### M-03: Content Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Playlist and media management, content creation |
| **Entities** | Playlist, Media |
| **Screens** | Playlist library, Playlist detail/preview, Studio editor, Media library |
| **Navigation** | Third sidebar item ("Content") |
| **Data sources** | Playlist list (SWR), Playlist detail (SWR), Media list (SWR), Upload (SWR mutation) |
| **Realtime** | None (content is not realtime) |
| **Architecture role** | Primary creation target (entity priority #3, #4) |

**Architecture rules:**
- Content section combines Playlists and Media (locked decision)
- Playlists and Media are tabs or sub-sections within Content
- Studio is accessed by editing a playlist (DD-02 — not a standalone nav item)
- Media upload is available from both Media Library and Studio (locked decision)
- Template picker is shown on "Create Playlist" action
- Playlist preview is available without entering Studio

### M-04: Scheduling Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Schedule management, conflict detection, calendar visualization |
| **Entities** | Schedule |
| **Screens** | Schedule calendar (`/scheduling`), Schedule creation dialog |
| **Navigation** | Fourth sidebar item |
| **Data sources** | Schedule list (SWR with date range), Playlist list (SWR for selection), Screen list (SWR for selection) |
| **Realtime** | Socket.IO for `schedule:changed` events |
| **Architecture role** | Optional orchestration layer (entity priority #5) |

**Architecture rules:**
- Scheduling is OPTIONAL (locked decision)
- Calendar view is the default (not list view)
- Schedule creation uses progressive disclosure (basic fields first)
- Conflict detection runs in real-time during schedule creation
- Publishing defaults to immediate (scheduling is opt-in)
- Scheduling supports timezone-aware configuration (E-005, future)

### M-05: Analytics Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Performance insights, screen health analytics, content engagement |
| **Entities** | None (reads aggregated data from Screens, Playlists) |
| **Screens** | Analytics dashboard (`/analytics`) |
| **Navigation** | Fifth sidebar item |
| **Data sources** | Analytics data (SWR with period parameter) |
| **Realtime** | None (analytics is historical) |
| **Architecture role** | Insights entity (entity priority #7) |

**Architecture rules:**
- Analytics is a separate section, not on Overview (locked decision)
- Overview shows minimal health summary only
- Analytics supports period selection (7d, 30d, 90d, custom)
- Analytics shows screen uptime and content performance
- Export is a future feature

### M-06: Team Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Team member management, role assignment, invite flow |
| **Entities** | User, Membership, Role |
| **Screens** | Team list (`/team`) |
| **Navigation** | Sixth sidebar item |
| **Data sources** | Team list (SWR), Invite (SWR mutation) |
| **Realtime** | None |
| **Architecture role** | Management entity (entity priority #6) |

**Architecture rules:**
- Three roles: Owner, Editor, Viewer (custom roles are future — E-003)
- Team list shows active members and pending invites separately
- Invite, role change, remove, cancel/resend are all supported
- Remove requires confirmation (destructive action — PP-07)

### M-07: Settings Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Configuration, billing, API, security, notifications, branding |
| **Entities** | Settings (workspace), Profile (user), Billing (organization), API Keys |
| **Screens** | Settings page with tabs (`/settings`) |
| **Navigation** | Seventh sidebar item |
| **Data sources** | Settings (SWR), Billing (SWR), API keys (SWR) |
| **Realtime** | None |
| **Architecture role** | Configuration hub |

**Architecture rules:**
- Settings uses tab interface (existing pattern)
- User-level settings: Profile, Notifications, Security/2FA
- Workspace-level settings: Workspace, Branding, API
- Organization-level settings: Billing
- Each tab has its own back button (fixes IA-005)
- Each tab has independent save action

### M-08: Admin Module

| Attribute | Value |
|-----------|-------|
| **Purpose** | Platform administration, customer management, fleet monitoring |
| **Entities** | Customer, Staff, Fleet, Feature Flags |
| **Screens** | Admin dashboard, Customers, Staff, Fleet, Health, Logs, Feature Flags |
| **Navigation** | Separate admin mode (not in client sidebar) |
| **Data sources** | Admin APIs (SWR) |
| **Realtime** | None |
| **Architecture role** | Platform-level management (super-admin only) |

**Architecture rules:**
- Admin is a separate mode, not part of the 7-item client sidebar
- Super-admins are restricted from client routes (Sovereign Mode)
- Admin sidebar uses grouped navigation (existing pattern)
- Impersonation is accessed from customer detail
- Admin module is not affected by the 7-item sidebar limit

---

## 4. Module-to-Route Mapping

| Module | Route Prefix | Pages |
|--------|-------------|-------|
| M-01 Overview | `/overview` | 1 page |
| M-02 Screens | `/screens` | List + Detail |
| M-03 Content | `/playlists`, `/media` | Library + Detail + Studio |
| M-04 Scheduling | `/scheduling` | Calendar + Dialog |
| M-05 Analytics | `/analytics` | 1 page with tabs/filters |
| M-06 Team | `/team` | 1 page |
| M-07 Settings | `/settings` | 1 page with tabs |
| M-08 Admin | `/admin` | Dashboard + sub-pages |

---

## 5. Module Interaction Map

```
                    ┌──────────┐
                    │ Overview │ ← reads from all
                    └────┬─────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     ┌──────────┐  ┌──────────┐  ┌──────────────┐
     │  Screens │  │ Content  │  │  Scheduling  │
     └────┬─────┘  └────┬─────┘  └──────┬───────┘
          │             │                │
          │     ┌───────┘                │
          │     │                        │
          ▼     ▼                        │
     Screen ←── Playlist ────────────────┘
          │     │                        │
          │     ▼                        │
          │    Media                     │
          │                              │
          ▼                              ▼
     ┌──────────┐                 ┌──────────┐
     │  Team    │                 │ Analytics │ ← reads from Screens, Content
     └────┬─────┘                 └──────────┘
          │
          ▼
     ┌──────────┐
     │ Settings │ ← user, workspace, billing, API
     └──────────┘
```

**Key interactions:**
- Overview reads from Screens (health), Content (recent), Scheduling (upcoming)
- Screens references Content (current playlist assignment)
- Scheduling references Content (which playlist) and Screens (which screens)
- Analytics reads from Screens (uptime) and Content (performance)
- Team and Settings are independent of other modules

---

## Cross-References

- See `10-module-responsibilities.md` for detailed module responsibilities
- See `11-feature-ownership.md` for feature-to-module mapping
- See `12-module-boundaries.md` for boundaries between modules
- See `04-product-hierarchy.md` for product hierarchy
- See `16-navigation-principles.md` for navigation principles
- See `transformation/04-information-architecture-review.md` for current IA analysis
