# Product Hierarchy

> **Evidence basis:** `04-information-architecture-review.md` (transformation), `03-routing-and-navigation.md` (audit), locked product decisions
> **Purpose:** Define the hierarchical structure of the product — what contains what, what is primary vs. secondary, and how the user navigates the hierarchy

---

## 1. Product Hierarchy Model

```
Cloud-Screen Platform
  │
  ├── Auth Layer (pre-product)
  │    ├── Login
  │    ├── Register
  │    └── Forgot Password
  │
  ├── Workspace Layer (context selection)
  │    ├── Workspace Switcher
  │    └── Workspace Welcome (no workspaces state)
  │
  ├── Application Layer (primary product)
  │    │
  │    ├── Overview (dashboard)
  │    │    ├── System status
  │    │    ├── Quick actions
  │    │    ├── Recent activity
  │    │    └── Screen health
  │    │
  │    ├── Screens (primary management)
  │    │    ├── Screen list (with branch filter)
  │    │    ├── Screen detail
  │    │    ├── Screen pairing wizard
  │    │    └── Branch management (optional)
  │    │
  │    ├── Content (primary creation)
  │    │    ├── Playlists
  │    │    │    ├── Playlist library
  │    │    │    ├── Playlist detail / preview
  │    │    │    └── Studio (canvas editor)
  │    │    └── Media
  │    │         ├── Media library
  │    │         └── Upload (from library or Studio)
  │    │
  │    ├── Scheduling (optional orchestration)
  │    │    ├── Schedule calendar
  │    │    ├── Schedule creation
  │    │    └── Conflict detection
  │    │
  │    ├── Analytics (insights)
  │    │    ├── Screen health analytics
  │    │    ├── Content performance
  │    │    └── Period comparison
  │    │
  │    ├── Team (management)
  │    │    ├── Member list
  │    │    ├── Invite flow
  │    │    └── Role management
  │    │
  │    └── Settings (configuration)
  │         ├── Profile (user-level)
  │         ├── Workspace (workspace-level)
  │         ├── Billing (organization-level)
  │         ├── Notifications (user-level)
  │         ├── Security / 2FA (user-level)
  │         └── API (developer)
  │              ├── API Documentation
  │              └── API Keys
  │
  └── Admin Layer (super-admin only)
       ├── Admin Dashboard
       ├── Customer Management
       ├── Staff Management
       ├── Fleet Overview
       ├── System Health
       └── Feature Flags
```

---

## 2. Hierarchy Principles

### 2.1 First-Level Navigation (Locked)

The locked product decision defines exactly 7 first-level navigation items:

| # | Section | Entity Priority | Purpose | Evidence |
|---|---------|----------------|---------|----------|
| 1 | **Overview** | — | System status, quick actions, recent activity, screen health | Locked decision |
| 2 | **Screens** | #2 | Screen management, pairing, health monitoring | Locked decision |
| 3 | **Content** | #3, #4 | Playlists and Media (combined section) | Locked decision |
| 4 | **Scheduling** | #5 | Schedule management (optional) | Locked decision |
| 5 | **Analytics** | #7 | Performance insights | Locked decision |
| 6 | **Team** | #6 | Team member management | Locked decision |
| 7 | **Settings** | — | Configuration, billing, API, security | Locked decision |

**Architecture rule:** No item is ever added to the first level without an explicit product decision. The maximum is 7. If a new feature needs a top-level entry, an existing entry must be removed or the feature must be placed within an existing section.

### 2.2 Second-Level Navigation

| First Level | Second Level | Access Pattern |
|-------------|-------------|----------------|
| Overview | (none — single page) | Direct |
| Screens | Screen List | Direct |
| Screens | Branch Management | Link from filter bar or settings |
| Content | Playlists | Tab or sub-section |
| Content | Media | Tab or sub-section |
| Scheduling | Calendar View | Direct |
| Scheduling | List View | Toggle |
| Analytics | Screen Health | Tab or filter |
| Analytics | Content Performance | Tab or filter |
| Team | Members | Direct |
| Settings | Profile | Tab |
| Settings | Workspace | Tab |
| Settings | Billing | Tab |
| Settings | Notifications | Tab |
| Settings | Security | Tab |
| Settings | API | Tab or sub-section |

### 2.3 Depth Limit

**Architecture rule:** No navigation path exceeds 3 levels (first-level → second-level → detail).

| Path | Depth | Example |
|------|-------|---------|
| Screens → Screen Detail | 2 | `/screens/{id}` |
| Content → Playlists → Studio | 3 | `/playlists/{id}/studio` |
| Content → Media → Upload | 2 | `/media` (upload is a dialog, not a page) |
| Settings → Billing → Invoice | 2 | `/settings/billing` (invoice is a download, not a page) |

**Exception:** Admin layer may have 3 levels (Admin → Customers → Customer Detail) due to the data-heavy nature of admin operations.

---

## 3. Content Section Architecture

The locked sidebar decision combines Playlists and Media into a single "Content" section. This is a significant architectural decision.

### 3.1 Rationale

| Factor | Reasoning |
|--------|-----------|
| **Entity relationship** | Playlists are composed of Media — they are inherently linked |
| **User workflow** | Content creation involves both: upload media → arrange in playlist |
| **Cognitive load** | Reduces nav items from 8 to 7 (locked maximum) |
| **Mental model** | Users think "I need to create content" not "I need to go to media, then go to playlists" |

### 3.2 Content Section Structure

```
Content
  ├── [Playlists Tab]
  │    ├── Playlist library (grid/list)
  │    ├── Create playlist (template picker or blank)
  │    ├── Playlist detail / preview
  │    └── Studio (canvas editor — accessed by editing a playlist)
  │
  └── [Media Tab]
       ├── Media library (grid)
       ├── Upload (multi-file, drag-drop, progress)
       └── Media detail (metadata, usage in playlists)
```

### 3.3 Media Access from Studio

**Locked decision:** Media upload is available from both the Media Library and the Playlist Studio.

| Access Point | UX Pattern | Architecture |
|--------------|-----------|-------------|
| Media Library | Upload button in media tab | Standard upload flow |
| Studio | Media panel with upload button | Upload within Studio context, media appears in panel immediately |

**Architecture rule:** The Studio media upload uses the same upload API and component as the Media Library. The only difference is the entry point and the post-upload behavior (in Studio, the uploaded media is immediately available in the media panel).

---

## 4. Scheduling Section Architecture

### 4.1 Scheduling is Optional

**Locked decision:** Scheduling is optional. Users may:
- Publish immediately (no schedule needed)
- Schedule for later (start date/time)
- Repeat (recurrence rules)
- Expire (end date/time)
- Always active (no start/end)

### 4.2 Publishing Flow

```
Playlist Ready
  │
  ├── Publish Immediately → Assign to screen(s) → Done
  │
  └── Schedule → Create schedule (optional recurrence, expiry) → Assign to screen(s) → Done
```

**Architecture rule:** The "Publish" action from a playlist defaults to "immediate." Scheduling is an opt-in path, not a required step. The 5-minute KPI depends on immediate publish being the default path.

### 4.3 Scheduling Section Content

```
Scheduling
  ├── Calendar View (default)
  │    ├── Month/week/day views
  │    ├── Color-coded by playlist
  │    └── Conflict indicators
  │
  ├── Schedule Creation
  │    ├── Playlist selection
  │    ├── Screen selection (multi-select)
  │    ├── Time rules (start, end, recurrence, days, time slots)
  │    └── Conflict detection (real-time)
  │
  └── Schedule List (alternative to calendar)
       ├── Filter by screen, playlist, status
       └── Bulk activate/deactivate
```

---

## 5. Settings Section Architecture

### 5.1 Settings Hierarchy

Settings contains both user-level and workspace-level configuration:

| Tab | Scope | Entity | Evidence |
|-----|-------|--------|----------|
| Profile | User | User | `14-settings-feature.md` §14.8 |
| Workspace | Workspace | Workspace, Branding | `14-settings-feature.md` §14.8 |
| Billing | Organization | Billing, Plan | `14-settings-feature.md` §14.8 |
| Notifications | User | Notification Preferences | `14-settings-feature.md` §14.8 |
| Security | User | 2FA, Password | `14-settings-feature.md` §14.8 |
| API | Workspace | API Keys, Webhooks | `20-api-docs-and-webhooks.md` |

### 5.2 Settings Architecture Rules

- User-level settings (Profile, Notifications, Security) are available regardless of workspace
- Workspace-level settings (Workspace, Billing, API) are workspace-scoped
- Settings uses a tab interface (existing pattern — `14-settings-feature.md` §14.8)
- Each settings tab has its own back button (fixes IA-005 — `05-navigation-analysis.md` §3.4)
- Settings tabs have independent save actions (no global save)

---

## 6. Admin Layer Architecture

### 6.1 Admin Hierarchy

The admin layer is separate from the application layer. Super-admins access it via a separate navigation mode.

```
Admin
  ├── Dashboard (system overview)
  ├── Management
  │    ├── Customers
  │    ├── Staff
  │    └── Users
  ├── System
  │    ├── Workspaces
  │    ├── Fleet
  │    ├── Health
  │    ├── Logs
  │    └── Feature Flags
  └── Impersonation (accessed from customer detail)
```

### 6.2 Admin Architecture Rules

- Admin navigation is grouped (existing pattern — `03-routing-and-navigation.md` §3.5)
- Super-admins are restricted from client routes (Sovereign Mode — `04-layout-and-shell.md` §4.6)
- Admins access client features via impersonation
- Admin layer is not affected by the 7-item sidebar limit (separate mode)
- Admin layer uses the same component library and design system

---

## Cross-References

- See `01-core-product-model.md` for product identity
- See `02-core-product-entities.md` for entity definitions
- See `16-navigation-principles.md` for navigation principles
- See `17-product-rules.md` for rules derived from this hierarchy
- See `transformation/04-information-architecture-review.md` for current IA analysis
- See `transformation/05-navigation-analysis.md` for current navigation analysis
- See `transformation/24-design-decisions.md` DD-01 through DD-04 for sidebar decisions
