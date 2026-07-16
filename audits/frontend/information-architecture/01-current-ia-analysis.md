# Current Information Architecture Analysis

> **Evidence basis:** `04-information-architecture-review.md` (transformation), `05-navigation-analysis.md` (transformation), `03-routing-and-navigation.md` (audit), `04-layout-and-shell.md` (audit), `product-architecture/04-product-hierarchy.md`
> **Purpose:** Systematic analysis of the current IA — strengths, weaknesses, and every problem category — as the baseline for designing the final IA

---

## 1. Current IA Snapshot

### 1.1 Current Route Hierarchy

```
/{locale}
  ├── (auth)/
  │    ├── /login
  │    ├── /register
  │    └── /forgot-password
  ├── (shell)/
  │    ├── /overview
  │    ├── /branches
  │    ├── /branches/{id}
  │    ├── /screens
  │    ├── /screens/{id}
  │    ├── /playlists
  │    ├── /playlists/{id}
  │    ├── /studio
  │    ├── /media
  │    ├── /schedules
  │    ├── /analytics
  │    ├── /team
  │    ├── /settings
  │    ├── /notifications
  │    ├── /api-docs
  │    └── /api-keys
  └── (admin)/
       ├── /admin
       ├── /admin/customers
       ├── /admin/customers/{id}
       ├── /admin/staff
       ├── /admin/users
       ├── /admin/workspaces
       ├── /admin/fleet
       ├── /admin/health
       ├── /admin/logs
       └── /admin/feature-flags
```

### 1.2 Current Sidebar (Client Mode)

18 items in a flat, ungrouped list:

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
14-18. (Admin items if super-admin)

### 1.3 Current Sidebar (Admin Mode)

~13 items in 2 grouped sections:
- **Management:** Customers, Staff, Users
- **System:** Workspaces, Fleet, Health, Logs, Feature Flags

---

## 2. Strengths

| ID | Strength | Evidence | Retain in Final IA? |
|----|----------|----------|---------------------|
| S-01 | Overview as first item (correct priority) | `04-information-architecture-review.md` §4.1 | Yes |
| S-02 | Screens as dedicated section (matches entity priority #2) | `04-information-architecture-review.md` §2.3 | Yes |
| S-03 | Playlists have library + detail + Studio (complete content flow) | `10-playlists-and-studio.md` §10.8 | Yes (restructured) |
| S-04 | Schedules have calendar view (matches user mental model) | `12-schedules-feature.md` §12.8 | Yes |
| S-05 | Analytics as separate section (not crammed into dashboard) | `04-information-architecture-review.md` §2.3 | Yes |
| S-06 | Team as separate section (clear management boundary) | `16-team-feature.md` §16.4 | Yes |
| S-07 | Settings uses tab interface (scales with new settings) | `14-settings-feature.md` §14.8 | Yes |
| S-08 | Admin mode is separate from client mode (Sovereign Mode) | `04-layout-and-shell.md` §4.6 | Yes |
| S-09 | Admin sidebar uses grouping (Management, System) | `03-routing-and-navigation.md` §3.5 | Yes |
| S-10 | Workspace switcher in header (always accessible on desktop) | `07-workspace-management.md` §7.11 | Yes (enhanced for mobile) |
| S-11 | Notification bell in header (always accessible) | `17-notifications.md` §17.7 | Yes |
| S-12 | Back button on detail pages (lateral navigation) | `03-routing-and-navigation.md` §3.4 | Yes (fixed) |
| S-13 | Breadcrumbs below header (hierarchical navigation) | `04-layout-and-shell.md` §4.3 | Yes (extended) |
| S-14 | Route-based active state detection (`startsWith` matching) | `05-navigation-analysis.md` §2.4 | Yes (refined) |
| S-15 | URL-based locale (`/{locale}/...`) — shareable, bookmarkable | `22-i18n-and-localization.md` §22.7 | Yes |

---

## 3. Weaknesses

### 3.1 Navigation Problems

| ID | Problem | Severity | Evidence | Impact |
|----|---------|----------|----------|--------|
| NW-01 | 18 flat sidebar items — exceeds Miller's Law (7±2) | Critical | IA-001, `05-navigation-analysis.md` §2.3 | Users must scan all 18 items to find target |
| NW-02 | No grouping in client sidebar (flat list) | High | `04-information-architecture-review.md` §5.3 | No visual hierarchy to aid scanning |
| NW-03 | Studio as top-level nav item (tool, not destination) | High | `04-information-architecture-review.md` §2.4 | Confusion: "Playlists or Studio to create?" |
| NW-04 | Branches as top-level nav item (optional entity elevated) | High | `04-information-architecture-review.md` §2.5 | Wastes a nav slot for an optional feature |
| NW-05 | API Docs and API Keys as top-level (rare developer tasks) | Medium | `04-information-architecture-review.md` §2.6 | Over-prominent for rarely used features |
| NW-06 | Notifications as top-level nav (bell icon suffices) | Medium | `04-information-architecture-review.md` §4.3 | Over-prominent; duplicates bell access |
| NW-07 | Workspace switcher missing on mobile | Critical | P-002, `05-navigation-analysis.md` §2.2 | Mobile users cannot switch workspaces |
| NW-08 | Click guards broken (preventDefault doesn't cancel Next.js Link) | High | P-003, `05-navigation-analysis.md` §2.5 | Users navigate to broken pages |
| NW-09 | No global search on mobile | Medium | `05-navigation-analysis.md` §2.2 | Mobile users cannot search |
| NW-10 | Language switcher is a toggle (EN/AR), not a dropdown | Low | `05-navigation-analysis.md` §2.1 | Doesn't scale if more languages added |

### 3.2 Hierarchy Problems

| ID | Problem | Severity | Evidence | Impact |
|----|---------|----------|----------|--------|
| HP-01 | Task hierarchy inverted — rare tasks (API, Notifications) at same level as daily tasks (Screens, Playlists) | High | `04-information-architecture-review.md` §4.4 | Visual weight doesn't match usage frequency |
| HP-02 | Playlists and Media are separate nav items but are conceptually linked | Medium | `04-information-architecture-review.md` §2.1 | Users think "content" not "playlists then media" |
| HP-03 | No depth limit — some flows reach 4+ levels | Medium | `04-information-architecture-review.md` §8.1 | Deep navigation increases cognitive load |
| HP-04 | Billing buried in Settings tabs with no prominent upgrade path | Medium | `04-information-architecture-review.md` §3.1 | Revenue-critical flow is hidden |
| HP-05 | Branch detail page has tabs (screens, playlists, schedules, settings) — acts as a sub-workspace | Medium | `13-branches-feature.md` §13.13 | Complexity hotspot; branches mimic workspace |

### 3.3 Mental Model Mismatches

| ID | Mismatch | User Mental Model | Current System Model | Evidence |
|----|----------|-------------------|---------------------|----------|
| MM-01 | Studio as destination | "I edit a playlist" → Studio opens | Studio is a separate nav item | `04-information-architecture-review.md` §2.4 |
| MM-02 | Branches as top-level | "Show me my screens (optionally filtered by branch)" | Branches are co-equal with Screens | `04-information-architecture-review.md` §2.5 |
| MM-03 | API Docs/Keys as top-level | "Developer tools are in settings" | Developer tools are co-equal with business features | `04-information-architecture-review.md` §2.6 |
| MM-04 | Notifications as page | "I check notifications from the bell" | Notifications has a full page at nav level | `04-information-architecture-review.md` §4.3 |
| MM-05 | Content as separate entities | "I create content (playlists from media)" | Playlists and Media are separate destinations | `04-information-architecture-review.md` §2.1 |

### 3.4 Duplicated Navigation

| ID | Duplication | Location 1 | Location 2 | Evidence |
|----|-------------|-----------|-----------|----------|
| DN-01 | Notifications access | Sidebar (Notifications page) | Header (bell icon dropdown) | `05-navigation-analysis.md` §1 |
| DN-02 | Studio access | Sidebar (Studio nav item) | Playlists (click playlist → edit → Studio) | `04-information-architecture-review.md` §2.4 |
| DN-03 | Branch access | Sidebar (Branches nav item) | Screens (implicitly, screens belong to branches) | `04-information-architecture-review.md` §2.5 |
| DN-04 | API access | Sidebar (API Docs, API Keys) | Settings (should be here) | `04-information-architecture-review.md` §2.6 |
| DN-05 | Logout | Sidebar bottom bar | User menu (header avatar) | `05-navigation-analysis.md` §1 |

### 3.5 Hidden Features

| ID | Feature | Current Location | Problem | Evidence |
|----|---------|-----------------|---------|----------|
| HF-01 | Billing/plan management | Settings → Billing tab | No prominent upgrade path; no plan comparison | `14-settings-feature.md` §14.8 |
| HF-02 | Storage usage indicators | Media library (partial) | No proactive warning before limit | `11-media-library.md` §11.8 |
| HF-03 | Screen limit indicators | Not shown | Users hit limits reactively | `09-screens-feature.md` §9.8 |
| HF-04 | 2FA settings | Settings → 2FA tab | Not discoverable; no security prompt | `14-settings-feature.md` §14.8 |
| HF-05 | Notification preferences | Settings → Notifications tab | Deep navigation for common preference | `14-settings-feature.md` §14.8 |
| HF-06 | Workspace branding | Settings → Workspace tab | Not discoverable; affects entire UI | `14-settings-feature.md` §14.8 |

### 3.6 Deep Navigation

| ID | Path | Depth | Problem | Evidence |
|----|------|-------|---------|----------|
| DP-01 | Sidebar → Settings → Billing tab → Invoice | 3 | Acceptable but billing is important | `14-settings-feature.md` §14.8 |
| DP-02 | Sidebar → Branches → Branch detail → Schedules tab → Schedule | 4 | Exceeds 3-level limit | `13-branches-feature.md` §13.13 |
| DP-03 | Sidebar → Playlists → Playlist detail → Studio → Media panel → Upload | 4+ | Studio adds depth | `10-playlists-and-studio.md` §10.12 |
| DP-04 | Sidebar → API Keys → Create key → Copy key | 3 | Acceptable for developer flow | — |

### 3.7 Dead Ends

| ID | Dead End | Context | Evidence |
|----|----------|---------|----------|
| DE-01 | Onboarding wizard has no skip option | User forced through demo/blank choice | `27-user-flows.md` §27.9 |
| DE-02 | Empty screen list has no CTA | User sees empty grid with no guidance | `09-screens-feature.md` §9.8 |
| DE-03 | Empty playlist library has no CTA | User sees empty grid with no guidance | `10-playlists-and-studio.md` §10.8 |
| DE-04 | Empty media library has no CTA | User sees empty grid with no guidance | `11-media-library.md` §11.8 |
| DE-05 | Empty schedule calendar has no CTA | User sees empty calendar with no guidance | `12-schedules-feature.md` §12.8 |
| DE-06 | Empty team list has no CTA | User sees empty list with no guidance | `16-team-feature.md` §16.4 |
| DE-07 | Analytics page with no data has no guidance | User sees empty charts | `18-analytics-feature.md` §18.8 |
| DE-08 | Post-publish has no next-step CTA | User publishes but doesn't know what to do next | `06-user-journey-analysis.md` Journey 1 |

### 3.8 Unclear Terminology

| ID | Term | Context | Problem | Evidence |
|----|------|---------|---------|----------|
| UT-01 | "Studio" | Nav item, page title | Doesn't communicate purpose; "Editor" or "Canvas" is clearer | `10-playlists-and-studio.md` §10.3 |
| UT-02 | "Branches" | Nav item | Restaurant users think "locations" not "branches" | `13-branches-feature.md` §13.3 |
| UT-03 | "Playlists" | Nav item | Ambiguous — could mean music playlists; "Content" is clearer for signage | `10-playlists-and-studio.md` §10.3 |
| UT-04 | "Schedules" vs "Scheduling" | Nav item | Noun vs verb inconsistency | `12-schedules-feature.md` §12.3 |
| UT-05 | "API Docs" | Nav item | Developer jargon at business-user nav level | `20-api-docs-and-webhooks.md` §20.3 |

### 3.9 Broken Relationships

| ID | Relationship | Problem | Evidence |
|----|-------------|---------|----------|
| BR-01 | Playlist → Screen assignment | No direct path from playlist detail to screen assignment | `10-playlists-and-studio.md` §10.8 |
| BR-02 | Schedule → Screen conflict | No visual link from schedule to affected screen | `12-schedules-feature.md` §12.8 |
| BR-03 | Media → Playlist usage | No "used in these playlists" indicator on media items | `11-media-library.md` §11.8 |
| BR-04 | Screen → Active schedule | Screen detail doesn't show active schedules clearly | `09-screens-feature.md` §9.8 |
| BR-05 | Branch → Screen count | Branch list doesn't show screen count per branch | `13-branches-feature.md` §13.8 |

### 3.10 Missing Entry Points

| ID | Missing Entry | Context | Evidence |
|----|--------------|---------|----------|
| ME-01 | No "Add Screen" CTA on Overview | Overview doesn't have quick action for screen pairing | `08-dashboard-and-overview.md` §8.17 |
| ME-02 | No "Create Playlist" CTA on Overview | Overview doesn't have quick action for content creation | `08-dashboard-and-overview.md` §8.17 |
| ME-03 | No "Upload Media" from Studio | Studio doesn't have integrated media upload | `10-playlists-and-studio.md` §10.12 (locked decision requires this) |
| ME-04 | No "Invite Member" from Team empty state | Team page has no CTA when empty | `16-team-feature.md` §16.4 |
| ME-05 | No "Upgrade Plan" from limit errors | Users hit limits with no inline upgrade path | `11-media-library.md` §11.6 |

### 3.11 Missing Exit Points

| ID | Missing Exit | Context | Evidence |
|----|-------------|---------|----------|
| MX-01 | No "View Screen" from playlist detail | Can't see which screens display this playlist | `10-playlists-and-studio.md` §10.8 |
| MX-02 | No "Edit Playlist" from screen detail | Can't edit the currently assigned playlist | `09-screens-feature.md` §9.8 |
| MX-03 | No "Create Schedule" from playlist detail | Can't schedule the playlist directly from its page | `10-playlists-and-studio.md` §10.8 |
| MX-04 | No "Go to Analytics" from screen detail | Can't view analytics for a specific screen | `09-screens-feature.md` §9.8 |
| MX-05 | No "Manage Team" from Settings | Settings doesn't link to Team section | `14-settings-feature.md` §14.8 |

### 3.12 Complexity Hotspots

| ID | Hotspot | Complexity Source | Evidence |
|----|---------|-------------------|----------|
| CH-01 | Branch detail page | 4 tabs (screens, playlists, schedules, settings) — acts as sub-workspace | `13-branches-feature.md` §13.13 |
| CH-02 | Settings page | 6+ tabs (profile, workspace, billing, notifications, 2FA, API) — too many tabs | `14-settings-feature.md` §14.8 |
| CH-03 | Studio | Canvas + timeline + layers + properties + media panel — high density | `10-playlists-and-studio.md` §10.12 |
| CH-04 | Schedule creation form | Many fields (playlist, screens, start, end, recurrence, days, time slots) | `12-schedules-feature.md` §12.8 |
| CH-05 | Admin customer detail | Multiple sections with different data types | `15-admin-panel.md` §15.17 |

---

## 4. Problem Summary

### 4.1 Problem Count by Category

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| Navigation Problems | 2 | 3 | 3 | 2 | 10 |
| Hierarchy Problems | 0 | 2 | 3 | 0 | 5 |
| Mental Model Mismatches | 0 | 3 | 2 | 0 | 5 |
| Duplicated Navigation | 0 | 2 | 3 | 0 | 5 |
| Hidden Features | 0 | 1 | 5 | 0 | 6 |
| Deep Navigation | 0 | 0 | 2 | 2 | 4 |
| Dead Ends | 0 | 4 | 4 | 0 | 8 |
| Unclear Terminology | 0 | 1 | 4 | 0 | 5 |
| Broken Relationships | 0 | 2 | 3 | 0 | 5 |
| Missing Entry Points | 0 | 2 | 3 | 0 | 5 |
| Missing Exit Points | 0 | 1 | 4 | 0 | 5 |
| Complexity Hotspots | 0 | 2 | 3 | 0 | 5 |
| **Total** | **2** | **23** | **39** | **4** | **68** |

### 4.2 Top 5 Critical Problems to Solve

1. **NW-01:** 18 flat sidebar items → reduce to 7 grouped items (locked decision)
2. **NW-07:** Workspace switcher missing on mobile → add to mobile drawer
3. **NW-03:** Studio as top-level nav → remove from sidebar, access via playlist edit
4. **NW-04:** Branches as top-level nav → demote to filter within Screens
5. **MM-05:** Playlists and Media separate → combine into "Content" section

### 4.3 Current IA Score

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| Navigation clarity | 3/10 | 18 flat items, no grouping, exceeds cognitive limits |
| Hierarchy alignment | 4/10 | Task hierarchy inverted; entity priority not reflected |
| Mental model match | 5/10 | Core entities aligned; tools and optional features misaligned |
| Scalability | 3/10 | Flat list doesn't scale; no room for new features |
| Enterprise readiness | 4/10 | Missing bulk ops, billing prominence, multi-workspace support |
| Dead end prevention | 3/10 | 8 dead ends identified across all sections |
| Terminology clarity | 5/10 | Some terms unclear (Studio, Branches, Playlists) |
| **Overall** | **3.9/10** | **Current IA is not ready for enterprise use** |

---

## Cross-References

- See `02-ia-options.md` for three alternative IA approaches
- See `03-ia-comparison.md` for option comparison and scoring
- See `04-final-ia-sitemap.md` for the final IA sitemap
- See `product-architecture/04-product-hierarchy.md` for the locked product hierarchy
- See `transformation/04-information-architecture-review.md` for the original IA review
- See `transformation/05-navigation-analysis.md` for the original navigation analysis
