# Final IA — Sitemap and Route Hierarchy

> **Evidence basis:** `03-ia-comparison.md` (Option C selected), `product-architecture/04-product-hierarchy.md`, `product-architecture/09-product-modules.md`, locked product decisions
> **Purpose:** Define the complete sitemap and route hierarchy for the final Information Architecture

---

## 1. Complete Sitemap

```
Cloud-Screen Platform
│
├── Auth Layer (pre-product, no shell)
│    ├── /login
│    ├── /register
│    └── /forgot-password
│
├── Workspace Layer (pre-product, no shell)
│    └── /welcome (workspace selection / creation)
│
├── Application Layer (shell, 7 sidebar items)
│    │
│    ├── 1. Overview
│    │    └── /overview
│    │         ├── Screen health summary
│    │         ├── Quick actions
│    │         ├── Recent activity
│    │         └── First-time user state
│    │
│    ├── 2. Screens
│    │    ├── /screens
│    │    │    ├── Screen list (search, filter, bulk)
│    │    │    └── Branch management (link from filter bar)
│    │    ├── /screens/{id}
│    │    │    ├── Screen detail (status, content, schedules)
│    │    │    └── Quick actions (assign, override, reboot-future)
│    │    └── /screens/pair
│    │         └── Pairing wizard (2-3 steps)
│    │
│    ├── 3. Content
│    │    ├── /content
│    │    │    ├── [Playlists tab] — playlist library
│    │    │    └── [Media tab] — media library
│    │    ├── /content/playlists/{id}
│    │    │    ├── Playlist detail / preview
│    │    │    └── "Publish to Screens" action
│    │    ├── /content/playlists/{id}/studio
│    │    │    └── Canvas editor (Konva)
│    │    └── /content/media
│    │         ├── Media library (grid, search, filter)
│    │         └── Upload (dialog, not page)
│    │
│    ├── 4. Scheduling
│    │    └── /scheduling
│    │         ├── Calendar view (month/week/day)
│    │         ├── Schedule creation (dialog)
│    │         └── Schedule list (toggle view)
│    │
│    ├── 5. Analytics
│    │    └── /analytics
│    │         ├── Screen health analytics
│    │         ├── Content performance
│    │         └── Period selector
│    │
│    ├── 6. Team
│    │    └── /team
│    │         ├── Active members list
│    │         ├── Pending invites
│    │         └── Invite dialog
│    │
│    ├── 7. Settings
│    │    ├── /settings
│    │    │    └── [Profile tab] — default
│    │    ├── /settings/workspace
│    │    ├── /settings/billing
│    │    ├── /settings/notifications
│    │    ├── /settings/security
│    │    └── /settings/api
│    │         ├── API keys
│    │         └── API documentation (link or embedded)
│    │
│    └── /notifications (accessed via bell, not sidebar)
│         └── Notification history (paginated)
│
└── Admin Layer (separate mode, grouped sidebar)
     ├── /admin
     │    └── Admin dashboard
     ├── Management
     │    ├── /admin/customers
     │    ├── /admin/customers/{id}
     │    ├── /admin/staff
     │    └── /admin/users
     └── System
          ├── /admin/workspaces
          ├── /admin/fleet
          ├── /admin/health
          ├── /admin/logs
          └── /admin/feature-flags
```

---

## 2. Route Hierarchy with Depth

| Route | Depth | Page Type | Parent | Evidence |
|-------|-------|-----------|--------|----------|
| `/overview` | 1 | Dashboard | — | M-01 |
| `/screens` | 1 | List | — | M-02 |
| `/screens/{id}` | 2 | Detail | `/screens` | M-02 |
| `/screens/pair` | 2 | Wizard | `/screens` | M-02 |
| `/content` | 1 | List (tabbed) | — | M-03 |
| `/content/playlists/{id}` | 2 | Detail | `/content` | M-03 |
| `/content/playlists/{id}/studio` | 3 | Editor | `/content/playlists/{id}` | M-03 |
| `/content/media` | 2 | List (tab) | `/content` | M-03 |
| `/scheduling` | 1 | Calendar | — | M-04 |
| `/analytics` | 1 | Dashboard | — | M-05 |
| `/team` | 1 | List | — | M-06 |
| `/settings` | 1 | Tabbed | — | M-07 |
| `/settings/workspace` | 2 | Tab | `/settings` | M-07 |
| `/settings/billing` | 2 | Tab | `/settings` | M-07 |
| `/settings/notifications` | 2 | Tab | `/settings` | M-07 |
| `/settings/security` | 2 | Tab | `/settings` | M-07 |
| `/settings/api` | 2 | Tab | `/settings` | M-07 |
| `/notifications` | 1 | History | — (via bell) | Shell |
| `/admin` | 1 | Dashboard | — | M-08 |
| `/admin/customers` | 1 | List | — | M-08 |
| `/admin/customers/{id}` | 2 | Detail | `/admin/customers` | M-08 |
| `/admin/staff` | 1 | List | — | M-08 |
| `/admin/users` | 1 | List | — | M-08 |
| `/admin/workspaces` | 1 | List | — | M-08 |
| `/admin/fleet` | 1 | List | — | M-08 |
| `/admin/health` | 1 | Dashboard | — | M-08 |
| `/admin/logs` | 1 | List | — | M-08 |
| `/admin/feature-flags` | 1 | List | — | M-08 |

**Depth compliance:** No route exceeds 3 levels (NP-06, PC-23). Maximum depth is 3 (`/content/playlists/{id}/studio`).

---

## 3. Route Naming Convention

### 3.1 URL Rules

| Rule | Pattern | Example | Evidence |
|------|---------|---------|----------|
| Locale prefix | `/{locale}/...` | `/en/screens`, `/ar/screens` | LC-02 |
| Entity plural for lists | `/screens`, `/content/playlists` | `/screens` = list | RESTful convention |
| Entity ID for detail | `/{section}/{id}` | `/screens/abc-123` | RESTful convention |
| Action as sub-path | `/{section}/{action}` | `/screens/pair` | Action pages |
| Tab as sub-path | `/{section}/{tab}` | `/settings/billing` | Tab navigation |
| Studio as sub-path | `/content/playlists/{id}/studio` | — | DD-02 |
| Kebab-case for multi-word | `/feature-flags` | `/admin/feature-flags` | URL convention |
| No trailing slashes | `/screens` not `/screens/` | — | Next.js convention |
| No file extensions | `/screens` not `/screens.html` | — | Next.js convention |

### 3.2 Route Group Convention (Next.js)

```
/{locale}
  ├── (auth)/              ← auth layout (no shell)
  │    ├── /login/page.tsx
  │    ├── /register/page.tsx
  │    └── /forgot-password/page.tsx
  ├── (shell)/             ← application layout (with shell)
  │    ├── /overview/page.tsx
  │    ├── /screens/
  │    │    ├── page.tsx
  │    │    ├── [id]/page.tsx
  │    │    └── pair/page.tsx
  │    ├── /content/
  │    │    ├── page.tsx           (tabbed: playlists + media)
  │    │    ├── playlists/[id]/page.tsx
  │    │    ├── playlists/[id]/studio/page.tsx
  │    │    └── media/page.tsx
  │    ├── /scheduling/page.tsx
  │    ├── /analytics/page.tsx
  │    ├── /team/page.tsx
  │    ├── /settings/
  │    │    ├── page.tsx           (default: profile)
  │    │    ├── workspace/page.tsx
  │    │    ├── billing/page.tsx
  │    │    ├── notifications/page.tsx
  │    │    ├── security/page.tsx
  │    │    └── api/page.tsx
  │    └── /notifications/page.tsx
  └── (admin)/             ← admin layout (separate shell)
       └── /admin/...
```

---

## 4. Reserved Future Routes

| Route | Purpose | Phase | Evidence |
|------|---------|-------|----------|
| `/content/templates` | Template gallery | Phase 5 | F-MP-13 |
| `/content/playlists/{id}/versions` | Version history | Future | F-FU-07 |
| `/scheduling/{id}` | Schedule detail | Future | — |
| `/analytics/proof-of-play` | PoP reports | Future | F-FU-12 |
| `/analytics/devices` | Device metrics | Future | F-FU-13 |
| `/settings/sso` | SSO configuration | Phase 9 | F-HP-11 |
| `/settings/webhooks` | Webhook configuration | Phase 10 | F-LP-08 |
| `/admin/audit-log` | Audit log | Phase 9 | F-HP-10 |
| `/screens/map` | Map view | Future | F-FU-03 |

---

## 5. Page Classification

### 5.1 Page Types

| Type | Count | Description | Examples |
|------|-------|-------------|---------|
| Dashboard | 3 | Status overview with widgets | Overview, Analytics, Admin dashboard |
| List | 8 | Entity collection with search/filter | Screens, Playlists, Media, Team, Schedules, Customers, Staff, Users |
| Detail | 4 | Single entity view | Screen detail, Playlist detail, Customer detail, Admin customer detail |
| Editor | 1 | Full-screen creation tool | Studio |
| Wizard | 1 | Step-by-step guided flow | Screen pairing |
| Settings | 6 | Configuration forms | Profile, Workspace, Billing, Notifications, Security, API |
| Auth | 3 | Authentication forms | Login, Register, Forgot password |
| History | 1 | Paginated log view | Notifications history |

### 5.2 Required vs. Optional Pages

| Page | Required? | Rationale |
|------|-----------|-----------|
| Overview | Required | Landing page, status at a glance |
| Screen list | Required | Primary management target |
| Screen detail | Required | Per-screen management |
| Screen pairing wizard | Required | 5-minute KPI |
| Content (Playlists tab) | Required | Primary creation target |
| Content (Media tab) | Required | Media management |
| Playlist detail | Required | Preview and publish |
| Studio | Required | Canvas editor (accessed via playlist) |
| Scheduling | Optional | Scheduling is optional (locked decision) |
| Analytics | Required | Insights section |
| Team | Required | Team management |
| Settings (all tabs) | Required | Configuration |
| Notifications history | Optional | Bell dropdown may suffice for most users |
| Admin (all pages) | Required (admin only) | Platform management |

---

## Cross-References

- See `05-navigation-architecture.md` for sidebar, header, and navigation details
- See `06-page-catalog.md` for per-page documentation
- See `07-page-states.md` for empty, loading, error states
- See `08-naming-and-conventions.md` for naming rules
- See `product-architecture/04-product-hierarchy.md` for product hierarchy
