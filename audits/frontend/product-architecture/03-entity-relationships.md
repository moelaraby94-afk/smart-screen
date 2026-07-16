# Entity Relationships

> **Evidence basis:** `01-current-product-model.md` (transformation), `09-screens-feature.md` through `16-team-feature.md` (audits), `13-branches-feature.md` (audit)
> **Purpose:** Define how entities relate to each other — ownership, references, cardinality, and dependency

---

## 1. Entity Relationship Diagram

```
Organization (billing entity)
  │
  └── 1:N ── Workspace (tenant boundary)
               │
               ├── 1:N ── Branch (optional location grouping)
               │            │
               │            └── 1:N ── Screen
               │
               ├── 1:N ── Screen (can exist without branch)
               │            │
               │            └── N:1 ── Playlist (current assignment)
               │
               ├── 1:N ── Playlist
               │            │
               │            ├── N:N ── Media (ordered items)
               │            │
               │            └── 1:N ── Schedule (when this playlist plays)
               │
               ├── 1:N ── Media
               │
               ├── 1:N ── Schedule
               │            │
               │            ├── N:1 ── Playlist
               │            │
               │            └── N:N ── Screen
               │
               ├── 1:N ── User (via membership)
               │            │
               │            └── N:1 ── Role (Owner, Editor, Viewer)
               │
               └── 1:1 ── Settings (workspace-level)
                         ├── Branding (logo, colors)
                         ├── Billing (plan, usage)
                         └── Notifications (preferences)
```

---

## 2. Relationship Definitions

### 2.1 Organization → Workspace

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one organization, many workspaces) |
| **Relationship type** | Ownership (billing entity) |
| **Frontend visibility** | Low — organization is a billing concept, not a navigation entity |
| **Architecture implication** | Billing and plan limits are organization-level, applied to workspaces |

### 2.2 Workspace → Branch

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one workspace, zero or many branches) |
| **Relationship type** | Containment (optional) |
| **Frontend visibility** | Optional — branches are a filter, not a top-level nav item (DD-03) |
| **Architecture implication** | Screens can exist without a branch. Branches are an organizational layer, not a structural requirement. |

### 2.3 Workspace → Screen

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one workspace, many screens) |
| **Relationship type** | Ownership (direct or via branch) |
| **Frontend visibility** | High — screens are priority entity #2 |
| **Architecture implication** | Screen list is always workspace-scoped. Branch filter is optional. |

### 2.4 Screen → Playlist

| Attribute | Value |
|-----------|-------|
| **Cardinality** | N:1 (many screens can display one playlist; one screen displays one playlist at a time) |
| **Relationship type** | Assignment (current content) |
| **Frontend visibility** | High — shown on screen detail page |
| **Architecture implication** | Screen detail shows current playlist with option to change. Playlist can be assigned to multiple screens. |

### 2.5 Workspace → Playlist

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one workspace, many playlists) |
| **Relationship type** | Ownership |
| **Frontend visibility** | High — playlists are priority entity #3 |
| **Architecture implication** | Playlist library is always workspace-scoped. Playlists are accessed via "Content" section. |

### 2.6 Playlist → Media

| Attribute | Value |
|-----------|-------|
| **Cardinality** | N:N (many playlists use many media items; ordered within playlist) |
| **Relationship type** | Composition (media items are ordered sequence in playlist) |
| **Frontend visibility** | High — media items shown in Studio canvas and timeline |
| **Architecture implication** | Media can be reused across playlists. Playlist stores ordered references to media, not copies. Adding media to a playlist does not consume additional storage. |

### 2.7 Workspace → Media

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one workspace, many media files) |
| **Relationship type** | Ownership |
| **Frontend visibility** | High — media is priority entity #4 |
| **Architecture implication** | Media library is workspace-scoped. Storage limits are per-workspace. Media upload available from both library and Studio (locked decision). |

### 2.8 Workspace → Schedule

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:N (one workspace, many schedules) |
| **Relationship type** | Ownership |
| **Frontend visibility** | Medium — scheduling is priority entity #5, optional |
| **Architecture implication** | Schedules are workspace-scoped. Scheduling is optional (locked decision). Users can publish immediately without creating a schedule. |

### 2.9 Schedule → Playlist

| Attribute | Value |
|-----------|-------|
| **Cardinality** | N:1 (many schedules can reference one playlist) |
| **Relationship type** | Reference (which playlist to play) |
| **Frontend visibility** | Medium — shown in schedule creation form |
| **Architecture implication** | A schedule references a playlist. Deleting a playlist that is referenced by a schedule requires handling (warn or block). |

### 2.10 Schedule → Screen

| Attribute | Value |
|-----------|-------|
| **Cardinality** | N:N (many schedules can target many screens) |
| **Relationship type** | Targeting (which screens to play on) |
| **Frontend visibility** | Medium — shown in schedule creation form |
| **Architecture implication** | A schedule targets specific screens. Conflict detection must check for overlapping schedules on the same screen. |

### 2.11 Workspace → User

| Attribute | Value |
|-----------|-------|
| **Cardinality** | N:N (users belong to many workspaces via membership; workspaces have many users) |
| **Relationship type** | Membership (with role) |
| **Frontend visibility** | Medium — team management is priority entity #6 |
| **Architecture implication** | User list is workspace-scoped (via membership). Role is per-membership, not global. User can switch between workspaces. |

### 2.12 Workspace → Settings

| Attribute | Value |
|-----------|-------|
| **Cardinality** | 1:1 (one workspace, one settings record) |
| **Relationship type** | Ownership |
| **Frontend visibility** | Medium — settings is a sidebar section |
| **Architecture implication** | Settings include: workspace profile, branding, billing, notification preferences, 2FA. Settings are workspace-scoped except user-level settings (profile, 2FA, personal notifications). |

---

## 3. Cross-Entity Dependencies

### 3.1 Creation Dependencies

```
Workspace must exist before any other entity can be created.
Screen must exist before it can be assigned a playlist.
Media must exist before it can be added to a playlist.
Playlist must exist before it can be scheduled or published.
Playlist must exist before a schedule can reference it.
Screen must exist before a schedule can target it.
User must exist (be invited) before being assigned a role.
```

### 3.2 Deletion Dependencies

| Action | Cascade Behavior | Architecture Rule |
|--------|------------------|-------------------|
| Delete Workspace | All child entities deleted | Frontend shows confirmation dialog with explicit warning |
| Delete Branch | Screens unassigned (not deleted) | Frontend warns about screen reassignment |
| Delete Screen | Playlist assignment removed, schedules targeting this screen updated | Frontend warns about affected schedules |
| Delete Playlist | Schedules referencing this playlist must be updated | Frontend blocks or warns about schedule impact |
| Delete Media | Playlists using this media must be updated | Frontend warns about affected playlists |
| Delete Schedule | No cascade — only the schedule is removed | Frontend confirms deletion |
| Remove User | Memberships removed, no data deletion | Frontend confirms removal |

### 3.3 Reference Integrity Rules

| Rule | Rationale | Architecture Implication |
|------|-----------|--------------------------|
| A screen's current playlist must belong to the same workspace | Tenant isolation | Frontend playlist selector is workspace-scoped |
| A schedule's playlist must belong to the same workspace | Tenant isolation | Frontend schedule form filters by workspace playlists |
| A schedule's screens must belong to the same workspace | Tenant isolation | Frontend schedule form filters by workspace screens |
| Media in a playlist must belong to the same workspace | Tenant isolation | Frontend Studio media picker is workspace-scoped |
| A user's role is per-workspace, not global | Multi-tenant isolation | Frontend role display is workspace-specific |

---

## 4. Entity Access Patterns

### 4.1 Read Patterns

| Pattern | Entities | Frequency | Architecture |
|---------|----------|-----------|-------------|
| List screens (with filter) | Screen, Branch (filter) | High | SWR with workspace-scoped key, search, filter |
| View screen detail | Screen, Playlist (current), Schedule (active) | High | SWR fetch by ID, Socket.IO for realtime status |
| List playlists | Playlist | High | SWR with workspace-scoped key |
| View playlist detail | Playlist, Media (items) | Medium | SWR fetch by ID |
| List media | Media | Medium | SWR with workspace-scoped key, type filter |
| List schedules (calendar) | Schedule, Playlist, Screen | Medium | SWR with date range parameter |
| View analytics | Screen (aggregated), Playlist (aggregated) | Low | SWR with period parameter |
| List team members | User, Role | Low | SWR with workspace-scoped key |

### 4.2 Write Patterns

| Pattern | Entities | Frequency | Architecture |
|---------|----------|-----------|-------------|
| Pair screen | Screen | Low (onboarding) | Wizard flow, SWR mutation |
| Create playlist | Playlist, Media (optional) | Medium | Template or blank, Studio editor |
| Upload media | Media | Medium | Multi-file upload, progress tracking |
| Create schedule | Schedule, Playlist, Screen | Low | Dialog form, conflict detection |
| Invite team member | User, Membership | Low | Invite dialog, email notification |
| Update settings | Settings, Branding | Low | Settings forms, per-section save |

---

## Cross-References

- See `02-core-product-entities.md` for entity definitions
- See `04-product-hierarchy.md` for product hierarchy
- See `09-product-modules.md` for how entities map to modules
- See `12-module-boundaries.md` for entity ownership boundaries
- See `13-frontend-state-boundaries.md` for entity state management
- See `transformation/18-dependency-map.md` for problem/feature dependency graph
