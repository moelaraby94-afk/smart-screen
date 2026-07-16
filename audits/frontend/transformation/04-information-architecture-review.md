# Information Architecture Review

> **Evidence basis:** `03-routing-and-navigation.md`, `07-workspace-management.md`, `13-branches-feature.md`, `14-settings-feature.md`, `08-dashboard-and-overview.md`, `21-search-and-global-actions.md`, `15-admin-panel.md`
> **Purpose:** Evaluate whether the current IA reflects user mental model, business model, task hierarchy, and enterprise workflows

---

## 1. Current IA Structure

### 1.1 Route Hierarchy

```
/{locale}
  ├── (auth)/
  │    ├── /login
  │    ├── /register
  │    └── /forgot-password
  ├── (shell)/
  │    ├── /overview                    ← Dashboard
  │    ├── /branches                    ← Branch list
  │    ├── /branches/{id}               ← Branch detail (tabs: screens, playlists, schedules, settings)
  │    ├── /screens                     ← Screen list
  │    ├── /screens/{id}                ← Screen detail
  │    ├── /playlists                   ← Playlist library
  │    ├── /playlists/{id}              ← Playlist detail
  │    ├── /studio                      ← Playlist studio (canvas editor)
  │    ├── /media                       ← Media library
  │    ├── /schedules                   ← Schedule calendar
  │    ├── /analytics                   ← Analytics dashboard
  │    ├── /team                        ← Team management
  │    ├── /settings                    ← Settings (tabs: profile, billing, workspace, notifications, 2FA)
  │    ├── /notifications               ← Notification history
  │    ├── /api-docs                    ← API documentation
  │    └── /api-keys                    ← API key management
  └── (admin)/
       ├── /admin                       ← Admin dashboard
       ├── /admin/customers             ← Customer management
       ├── /admin/customers/{id}        ← Customer detail
       ├── /admin/staff                 ← Staff management
       ├── /admin/users                 ← User management
       ├── /admin/workspaces            ← Workspace management
       ├── /admin/fleet                 ← Fleet overview
       ├── /admin/health                ← System health
       ├── /admin/logs                  ← System logs
       └── /admin/feature-flags         ← Feature flag management
```

### 1.2 Sidebar Navigation (Client Mode)

**Current state:** 18 items in a flat list, no grouping (`03-routing-and-navigation.md` §3.2):

1. Overview
2. Branches
3. Screens
4. Playlists
5. Studio
6. Media
7. Schedules
8. Analytics
9. Team
10. Notifications
11. Settings
12. API Docs
13. API Keys
14. (Plus admin items if super-admin)

### 1.3 Sidebar Navigation (Admin Mode)

**Current state:** Grouped sections (`03-routing-and-navigation.md` §3.2):

- **Management:** Customers, Staff, Users
- **System:** Workspaces, Fleet, Health, Logs, Feature Flags

---

## 2. Mental Model Alignment

### 2.1 User Mental Model (Inferred)

A digital signage operator thinks in terms of:

```
"My screens" → "What's showing on them" → "When it shows" → "How they're doing"
     ↓                ↓                        ↓                ↓
  Screens          Playlists               Schedules         Analytics
     ↓                ↓
  Branches         Media Library
                     ↓
                   Studio (creation tool)
```

### 2.2 System Model (Current)

```
Overview → Branches → Screens → Playlists → Studio → Media → Schedules → Analytics → Team → ...
(flat, undifferentiated)
```

### 2.3 Alignment Assessment

| Dimension | Alignment | Evidence |
|-----------|-----------|----------|
| Screens as primary entity | ✅ Aligned | Screens have their own nav item and detail page |
| Playlists as content unit | ✅ Aligned | Playlists have library + studio |
| Schedules as time-based assignment | ✅ Aligned | Schedules have calendar view |
| Branches as location grouping | ⚠️ Partial | Branches are elevated to top-level nav, but most users think "screens" first, not "branches" |
| Studio as creation tool | ⚠️ Misaligned | Studio is a separate top-level nav item, but it's a **tool** not a **destination** — users don't "go to Studio," they "edit a playlist" which opens Studio |
| Analytics as monitoring | ✅ Aligned | Analytics has its own nav item |
| Team as management | ✅ Aligned | Team has its own nav item |
| Settings as configuration | ✅ Aligned | Settings has its own nav item |
| API Docs/Keys as developer tools | ⚠️ Misaligned | These are developer features elevated to the same level as core business features |

### 2.4 Key Misalignment: Studio as Destination

The Studio (canvas editor) is listed as a top-level navigation item alongside Playlists. But Studio is a **tool** for editing playlists — it's not a destination users navigate to independently. Users want to:
1. Open a playlist → edit it → Studio opens
2. Create a new playlist → Studio opens

Having Studio as a separate nav item creates confusion: "Do I go to Playlists or Studio to create content?" (`26-consistency-audit.md` §26.6 — `Clapperboard` icon used for both)

### 2.5 Key Misalignment: Branches as Top-Level

Branches are elevated to a top-level nav item, but in the user mental model, branches are an **organizational container** for screens — not a primary destination. Users think "show me my screens" not "show me my branches." The branch list is useful but should be accessible from the screens page (as a filter/grouping) rather than as a co-equal nav item.

**Evidence:** `13-branches-feature.md` §13.13 — "Branches as workspace equivalent" — the current IA treats branches as a major entity, but the user mental model treats them as a grouping mechanism.

### 2.6 Key Misalignment: API Docs/Keys as Top-Level

API Docs and API Keys are developer tools that should be grouped under a "Developer" or "Integrations" section, not listed at the same level as Screens, Playlists, and Schedules. Most users never need these features.

---

## 3. Business Model Alignment

### 3.1 Revenue-Critical Flows

| Flow | Current IA Support | Issue |
|------|-------------------|-------|
| Screen limit → upgrade | Error toast only, no inline upgrade CTA | `08-dashboard-and-overview.md` §8.17 |
| Storage limit → upgrade | Error toast only, no proactive warning | `11-media-library.md` §11.6 |
| Plan selection | No plan selector in settings | `14-settings-feature.md` §14.8 |
| Invoice management | No PDF download, no invoice history | `14-settings-feature.md` §14.8 |
| Subscription status | Dashboard widget shows status but no action | `08-dashboard-and-overview.md` §8.17 |

### 3.2 Assessment

The current IA does not support the revenue model well:
- **Billing is buried** in settings tabs — no prominent upgrade path
- **Limit errors are reactive** — users hit limits and see errors instead of being warned proactively
- **No plan comparison** — users can't compare plans from the dashboard
- **No usage visualization** — users can't see how close they are to limits

**Recommendation:** Billing/subscription should be more prominent — either a dedicated nav item or a persistent widget in the dashboard sidebar.

---

## 4. Task Hierarchy Alignment

### 4.1 Primary Tasks (Daily)

| Task | Current Path | Clicks | Assessment |
|------|-------------|--------|------------|
| Check screen status | Sidebar → Overview | 1 | ✅ Good |
| View all screens | Sidebar → Screens | 1 | ✅ Good |
| Edit a playlist | Sidebar → Playlists → Click playlist → Studio opens | 2-3 | ⚠️ Studio is separate nav item |
| Check schedule | Sidebar → Schedules | 1 | ✅ Good |
| Upload media | Sidebar → Media → Upload | 1-2 | ✅ Good |
| View notifications | Header → Bell | 1 | ✅ Good |

### 4.2 Secondary Tasks (Weekly)

| Task | Current Path | Clicks | Assessment |
|------|-------------|--------|------------|
| Add new screen | Sidebar → Screens → Add | 2 | ✅ Good |
| Create new playlist | Sidebar → Playlists → Create | 2 | ✅ Good |
| Invite team member | Sidebar → Team → Invite | 2 | ✅ Good |
| Check analytics | Sidebar → Analytics | 1 | ✅ Good |
| Manage schedules | Sidebar → Schedules → Create | 2 | ✅ Good |

### 4.3 Tertiary Tasks (Monthly/Rarely)

| Task | Current Path | Clicks | Assessment |
|------|-------------|--------|------------|
| Change profile | Sidebar → Settings → Profile tab | 2 | ✅ Good |
| Manage billing | Sidebar → Settings → Billing tab | 2 | ⚠️ Buried |
| Configure 2FA | Sidebar → Settings → 2FA tab | 2 | ✅ Good |
| API key management | Sidebar → API Keys | 1 | ⚠️ Over-prominent for rare task |
| View API docs | Sidebar → API Docs | 1 | ⚠️ Over-prominent for rare task |
| Manage workspace | Sidebar → Settings → Workspace tab | 2 | ✅ Good |
| View notifications history | Sidebar → Notifications | 1 | ⚠️ Over-prominent — bell dropdown may suffice |

### 4.4 Assessment

The task hierarchy is **inverted** in several places:
- API Docs/Keys (rare) are at the same level as Screens/Playlists (daily)
- Notifications history (rare) is at the same level as Overview (daily)
- Billing (important) is buried in Settings tabs

---

## 5. Feature Hierarchy Alignment

### 5.1 Current Feature Hierarchy (by nav position)

```
1. Overview          (dashboard)
2. Branches          (location management)
3. Screens           (device management)
4. Playlists         (content management)
5. Studio            (content creation)
6. Media             (asset management)
7. Schedules         (time management)
8. Analytics         (performance monitoring)
9. Team              (user management)
10. Notifications    (alert history)
11. Settings         (configuration)
12. API Docs         (developer documentation)
13. API Keys         (developer authentication)
```

### 5.2 Recommended Feature Hierarchy (by usage frequency + business importance)

```
PRIMARY (Daily):
- Overview (dashboard)
- Screens (device management)
- Playlists (content management, includes Studio)
- Schedules (time management)
- Media (asset management)

SECONDARY (Weekly):
- Analytics (performance monitoring)
- Team (user management)

TERTIARY (Monthly/Rarely):
- Settings (configuration, includes billing, workspace, 2FA)
- Branches (accessible from Screens as filter/grouping)
- Developer (API Docs, API Keys, Webhooks grouped)
- Notifications (accessible from bell dropdown, full page secondary)
```

### 5.3 Assessment

The current hierarchy doesn't reflect usage frequency or business importance. 18 items at the same level means the user must scan all 18 to find what they need. Grouping into 3-5 categories with 3-5 items each would reduce scanning time significantly.

---

## 6. Enterprise Workflow Alignment

### 6.1 Multi-Tenant Workflow

| Workflow Step | Current Support | Issue |
|---------------|----------------|-------|
| Switch workspace | Header dropdown | ✅ Works, but navigates to `/branches` (IA-003) |
| Switch on mobile | Not available | P-002 — critical gap |
| Search across workspaces | Not available | `21-search-and-global-actions.md` §21.3 — "No cross-ws" |
| Workspace metadata | Not shown in switcher | E-006 — no plan, screen count, or status |
| Create workspace | Welcome screen + onboarding | ✅ Works |
| Delete workspace | Settings → Workspace → Danger Zone | ✅ Works, but no workspace transfer |

### 6.2 Administrative Workflow

| Workflow Step | Current Support | Issue |
|---------------|----------------|-------|
| View all customers | Admin → Customers | ✅ Works |
| Impersonate customer | Customer detail → Impersonate | ✅ Works, but no audit trail (E-002) |
| Manage feature flags | Admin → Feature Flags | ✅ Works |
| View system health | Admin → Health | ✅ Works |
| View system logs | Admin → Logs | ✅ Works |
| Fleet management | Admin → Fleet | ✅ Works, but limited |
| Manage staff | Admin → Staff | ✅ Works, but no custom roles (E-003) |

### 6.3 Content Management Workflow

| Workflow Step | Current Support | Issue |
|---------------|----------------|-------|
| Upload media | Media → Upload | ⚠️ No multi-file, no drag-drop, no progress |
| Create playlist | Playlists → Create | ✅ Works, wizard-based |
| Edit playlist | Playlists → Click → Studio | ✅ Works, canvas-based |
| Publish playlist to screens | Studio → Publish | ✅ Works, but no confirmation of playback |
| Schedule playlist | Schedules → Create | ⚠️ No conflict detection, no timezone |
| Preview playlist | Studio → Live Preview | ✅ Works |
| Reuse playlist template | Not available | No template marketplace |
| Version history | Not available | No playlist versioning |

### 6.4 Assessment

The IA supports basic workflows but lacks enterprise workflow features:
- No approval workflow for content publishing
- No content staging (draft → review → publish)
- No multi-workspace content sharing
- No bulk content operations
- No content lifecycle management (auto-expiry, archival)

---

## 7. Navigation Depth Analysis

### 7.1 Current Maximum Depth

```
Sidebar → Screens → Screen Detail → Setup Modal → Pairing Code Input
  1         2          3               4               5
```

```
Sidebar → Branches → Branch Detail → Screens Tab → Screen Detail
  1         2            3              4              5
```

```
Sidebar → Settings → Billing Tab → (no further depth)
  1         2           3
```

### 7.2 Assessment

- Maximum depth: **5 levels** (acceptable for enterprise SaaS, max recommended is 5-7)
- Average depth: **2-3 levels** (good)
- Branch detail adds an unnecessary level — screens accessible from branch detail are the same screens accessible from the screens page, just filtered

### 7.3 Redundancy

Screens are accessible from:
1. Sidebar → Screens (all screens)
2. Sidebar → Branches → Branch Detail → Screens tab (filtered by branch)
3. Dashboard → Screen Health → Click screen (direct to detail)

This redundancy is not inherently bad — it provides multiple paths to the same destination. But it means the screens page must support both "all screens" and "filtered by branch" views, which adds complexity.

---

## 8. IA Recommendations Summary

### 8.1 Navigation Grouping

Group the 18 flat items into 4-5 categories:

| Group | Items | Rationale |
|-------|-------|-----------|
| **Dashboard** | Overview | Primary landing |
| **Content** | Screens, Playlists, Media, Schedules | Core business operations |
| **Insights** | Analytics, Notifications | Monitoring and alerts |
| **Management** | Team, Settings | User and configuration management |
| **Developer** | API Docs, API Keys | Developer tools (collapsible/hidden by default) |

**Branches:** Move from top-level to a filter/grouping within Screens, or accessible from Overview dashboard cards.

**Studio:** Remove from top-level nav — accessed by editing/creating a playlist.

### 8.2 Routing Changes

| Change | Current | Recommended | Rationale |
|--------|---------|-------------|-----------|
| Workspace switch destination | `/branches` | `/overview` | User expectation (IA-003) |
| Studio access | Top-level nav `/studio` | Playlist edit action | Studio is a tool, not a destination |
| Branches access | Top-level nav `/branches` | Filter within `/screens` or dashboard card | Branches are containers, not destinations |
| Settings back button | Missing | Add back button for sub-pages | Navigation consistency (IA-005) |

### 8.3 URL Structure

Current URL structure is mostly sound. Recommendations:
- Keep `/{locale}/...` prefix for i18n
- Consider `/{locale}/screens?branch={id}` instead of `/{locale}/branches/{id}/screens`
- Consider `/{locale}/developer/api-docs` and `/{locale}/developer/api-keys` to group developer features

---

## 9. Cross-References

- See `02-problem-map.md` for IA-001 through IA-005 problem definitions
- See `03-root-cause-analysis.md` for why IA issues exist
- See `05-navigation-analysis.md` for detailed navigation system analysis
- See `07-screen-priorities.md` for screen-level redesign priorities
- See `18-dependency-map.md` for IA redesign dependencies
