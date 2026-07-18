56555555تاتنتثت# Core Product Entities

> **Evidence basis:** `01-current-product-model.md` (transformation), `09-screens-feature.md` through `16-team-feature.md` (audits), source code in `apps/dashboard/src/`
> **Purpose:** Define every core entity in the product — what it is, what it owns, and its priority in the product model

---

## 1. Entity Priority Order

The locked product decision defines the following entity priority:

| Priority | Entity | Rationale | Architecture Role |
|----------|--------|-----------|-------------------|
| 1 | **Workspace** | Tenant boundary — everything exists within a workspace | Primary context for all data and navigation |
| 2 | **Screens** | The physical devices — the reason the product exists | Primary management target |
| 3 | **Playlists** | Content containers — what screens display | Primary creation target |
| 4 | **Media** | Raw content assets — what playlists are made of | Primary upload target |
| 5 | **Schedules** | Time-based rules — when playlists play | Optional orchestration layer |
| 6 | **Users** | Team members — who manages the workspace | Management entity |
| 7 | **Analytics** | Performance data — how the system is doing | Insights entity |
| 8 | **Branches** | Location grouping — optional organizational layer | Optional feature, not required |

**Architecture rule:** Navigation, dashboards, and quick actions follow this priority. Workspace context is always visible. Screens are the primary management target. Playlists are the primary creation target. Everything else supports these two workflows.

---

## 2. Entity Definitions

### 2.1 Workspace

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | The primary tenant boundary containing all customer data | `07-workspace-management.md` §7.3 |
| **Identity** | UUID, stored as `cs_workspace_id` cookie | `07-workspace-management.md` §7.11 |
| **Owns** | Branches, Screens, Playlists, Media, Schedules, Users, Settings, Branding | `01-current-product-model.md` §3 |
| **Belongs to** | Organization (billing entity) | `01-current-product-model.md` §3 |
| **Frontend state** | `WorkspaceProvider` — active workspace ID, workspace list, data epoch | `16-state-strategy.md` §1.1 |
| **UI presence** | Workspace switcher in header (desktop), top of sidebar (mobile) | `05-navigation-analysis.md` §3.2 |
| **Architecture priority** | 1 — All data scoping depends on active workspace | Locked decision |

**Architecture rules:**
- All API calls are scoped to the active workspace ID via cookie
- Switching workspaces invalidates all cached data (data epoch bump)
- The workspace switcher is always accessible from any page
- No data from one workspace is ever displayed when another is active

### 2.2 Screen

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | A physical display device managed by the platform | `09-screens-feature.md` §9.3 |
| **Identity** | UUID, displayed with a user-given name | `09-screens-feature.md` §9.8 |
| **Owns** | Current playlist assignment, pairing code, health status, location (branch) | `09-screens-feature.md` §9.8 |
| **Belongs to** | Workspace (directly) or Branch (optionally) | `13-branches-feature.md` §13.13 |
| **Frontend state** | SWR-fetched list and detail, Socket.IO for realtime status | `09-screens-feature.md` §9.8, `07-workspace-management.md` §7.11 |
| **UI presence** | Screens section in sidebar, screen cards in list, screen detail page | `04-information-architecture-review.md` §1.1 |
| **Architecture priority** | 2 — Primary management target | Locked decision |

**Architecture rules:**
- Screen list supports search, filter (by branch, status), and bulk operations
- Screen detail shows health, current content, and quick actions (override, reboot)
- Screen pairing uses a wizard (locked decision)
- Screen status updates in realtime via Socket.IO
- Screens can exist without a branch (branch is optional)

### 2.3 Playlist

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | A sequence of media items displayed on screens in order | `10-playlists-and-studio.md` §10.3 |
| **Identity** | UUID, displayed with a user-given name | `10-playlists-and-studio.md` §10.8 |
| **Owns** | Media items (ordered), duration, transitions, canvas layout | `10-playlists-and-studio.md` §10.12 |
| **Belongs to** | Workspace (directly) or Branch (optionally) | `10-playlists-and-studio.md` §10.8 |
| **Frontend state** | SWR-fetched list and detail, Konva canvas state in Studio | `10-playlists-and-studio.md` §10.12 |
| **UI presence** | Content section in sidebar, playlist library, Studio editor | Locked sidebar decision |
| **Architecture priority** | 3 — Primary creation target | Locked decision |

**Architecture rules:**
- Playlists are accessed via the "Content" sidebar section
- Studio is accessed by editing a playlist (not as a standalone nav item — DD-02)
- Playlist creation offers templates for quick start
- Playlists can be published immediately or scheduled
- Playlist preview is available without entering Studio

### 2.4 Media

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | An uploaded file (image, video) used in playlists | `11-media-library.md` §11.3 |
| **Identity** | UUID, displayed with filename and thumbnail | `11-media-library.md` §11.8 |
| **Owns** | File URL, file type, file size, upload date, dimensions | `11-media-library.md` §11.8 |
| **Belongs to** | Workspace | `11-media-library.md` §11.8 |
| **Frontend state** | SWR-fetched list, upload progress in local state | `11-media-library.md` §11.8 |
| **UI presence** | Content section in sidebar (as sub-section or tab within Content) | Locked sidebar decision |
| **Architecture priority** | 4 — Primary upload target | Locked decision |

**Architecture rules:**
- Media upload is available from both the Media Library and the Playlist Studio (locked decision)
- Media library supports multi-file upload with progress indicators
- Media is filtered by type (image, video) and searchable by name
- Storage usage is displayed with limit indicators
- Media can be used across multiple playlists within the same workspace

### 2.5 Schedule

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | A time-based rule for when playlists play on screens | `12-schedules-feature.md` §12.3 |
| **Identity** | UUID, displayed with a user-given name | `12-schedules-feature.md` §12.8 |
| **Owns** | Playlist reference, screen references, time rules (start, end, recurrence, days, time slots) | `12-schedules-feature.md` §12.8 |
| **Belongs to** | Workspace | `12-schedules-feature.md` §12.8 |
| **Frontend state** | SWR-fetched list and calendar, Socket.IO for `schedule:changed` events | `12-schedules-feature.md` §12.8 |
| **UI presence** | Scheduling section in sidebar | Locked sidebar decision |
| **Architecture priority** | 5 — Optional orchestration layer | Locked decision |

**Architecture rules:**
- Scheduling is OPTIONAL — users may publish immediately without scheduling (locked decision)
- Schedule creation supports: publish immediately, schedule for later, repeat, expire, always active
- Schedule conflicts are detected and visualized
- Scheduling supports timezone-aware configuration (E-005)
- The scheduling UI defaults to "publish immediately" for first-time users

### 2.6 User

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | A team member with access to a workspace | `16-team-feature.md` §16.3 |
| **Identity** | UUID, displayed with name and email | `16-team-feature.md` §16.4 |
| **Owns** | Role (Owner, Editor, Viewer), notification preferences, 2FA settings | `16-team-feature.md` §16.4 |
| **Belongs to** | Workspace (via membership) and Organization (via account) | `16-team-feature.md` §16.4 |
| **Frontend state** | `WorkspaceProvider` (current user), SWR-fetched team list | `07-workspace-management.md` §7.11 |
| **UI presence** | Team section in sidebar, settings (profile, 2FA, notifications) | Locked sidebar decision |
| **Architecture priority** | 6 — Management entity | Locked decision |

**Architecture rules:**
- Three default roles: Owner, Editor, Viewer (custom roles are a future enterprise feature — E-003)
- Team management includes: invite, remove, change role, cancel/resend invite
- User profile and security settings (2FA) are in Settings
- Notification preferences are per-user, per-event

### 2.7 Analytics

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | Performance and health data for screens and content | `18-analytics-feature.md` §18.3 |
| **Identity** | Aggregated data, not a discrete entity | `18-analytics-feature.md` §18.8 |
| **Owns** | Screen uptime, content playback history, engagement metrics | `18-analytics-feature.md` §18.8 |
| **Belongs to** | Workspace | `18-analytics-feature.md` §18.8 |
| **Frontend state** | SWR-fetched with period parameter | `18-analytics-feature.md` §18.8 |
| **UI presence** | Analytics section in sidebar | Locked sidebar decision |
| **Architecture priority** | 7 — Insights entity | Locked decision |

**Architecture rules:**
- Analytics is a separate section, not crammed into the Overview
- Overview shows minimal health summary (online/offline counts), not detailed analytics
- Analytics supports period selection and basic export
- Proof-of-play reports are a future feature

### 2.8 Branch

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Definition** | A physical location grouping within a workspace | `13-branches-feature.md` §13.3 |
| **Identity** | UUID, displayed with a user-given name | `13-branches-feature.md` §13.8 |
| **Owns** | Screens, playlists, schedules (scoped to branch) | `13-branches-feature.md` §13.13 |
| **Belongs to** | Workspace | `13-branches-feature.md` §13.8 |
| **Frontend state** | SWR-fetched list and detail | `13-branches-feature.md` §13.8 |
| **UI presence** | Optional — accessible as a filter within Screens, not a top-level nav item | DD-03, locked sidebar decision |
| **Architecture priority** | 8 — Optional feature | Locked decision |

**Architecture rules:**
- Branches are NOT a top-level navigation item (locked decision, DD-03)
- Branches are accessible as a filter within the Screens section
- Branch management (create, edit, delete) is accessible via a "Manage Branches" link
- A workspace can function without any branches (screens assigned directly to workspace)
- Branches are useful for enterprise restaurants with multiple locations

---

## 3. Entity Lifecycle

### 3.1 Creation Order

The typical entity creation order for a new customer:

```
1. Workspace (created on signup or via invite acceptance)
2. Screen (paired via wizard)
3. Media (uploaded during playlist creation or via library)
4. Playlist (created from template or blank, using media)
5. Schedule (optional — publish immediately or schedule)
6. Users (invited as team grows)
```

### 3.2 Entity State Machines

#### Screen State Machine

```
[Unpaired] → (pairing wizard) → [Online] ↔ [Offline]
                                  ↓
                              [Maintenance]
```

#### Playlist State Machine

```
[Draft] → (publish) → [Published] → (unpublish) → [Draft]
                            ↓
                      [Scheduled] → (expire) → [Draft]
```

#### Schedule State Machine

```
[Active] → (end date reached) → [Expired]
[Active] → (manual deactivate) → [Inactive]
[Inactive] → (manual activate) → [Active]
```

#### Team Member State Machine

```
[Invited] → (accept) → [Active] → (remove) → [Removed]
[Invited] → (cancel) → [Cancelled]
[Invited] → (expire) → [Expired]
```

---

## Cross-References

- See `01-core-product-model.md` for product identity and value proposition
- See `03-entity-relationships.md` for how entities relate to each other
- See `04-product-hierarchy.md` for the product hierarchy
- See `09-product-modules.md` for how entities map to product modules
- See `13-frontend-state-boundaries.md` for how entities map to frontend state
- See `transformation/01-current-product-model.md` for current-state entity analysis
- See `transformation/02-problem-map.md` for entity-related problems
