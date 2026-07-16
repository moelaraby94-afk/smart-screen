# Screen Priorities

> **Evidence basis:** All V1/V2 audit files, `01-current-product-model.md`
> **Purpose:** Screen-level prioritization matrix for redesign planning

---

## Prioritization Criteria

Each screen is evaluated on:

| Criterion | Scale | Description |
|-----------|-------|-------------|
| Business importance | 1-5 | How critical is this screen to revenue and core value proposition |
| Usage frequency | 1-5 | How often users interact with this screen (daily=5, weekly=4, monthly=3, rarely=2, almost never=1) |
| Complexity | 1-5 | How complex is the current implementation |
| Redesign urgency | 1-5 | How urgently does this screen need redesign (based on problem count and severity) |
| Technical complexity | 1-5 | How difficult is the redesign technically |
| Dependencies | List | What must be done before this screen can be redesigned |
| Can redesign independently? | Yes/No | Whether this screen can be redesigned in isolation |
| Must redesign together with | List | Screens that share components or flows and should be redesigned together |

---

## Screen Inventory

### S-01: Login Page

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — Entry gate for all users |
| Usage frequency | 2 — Once per session (session persistence) |
| Complexity | 2 — Simple form with 2FA |
| Redesign urgency | 3 — Missing password toggle, email type, no SSO |
| Technical complexity | 2 — Form + API call |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Register, Forgot Password (shared auth layout) |
| Problems | P-005 (InfoTooltip if used), no password toggle, email type, no SSO (E-001) |
| Evidence | `06-auth-and-session.md` §6.7 |

### S-02: Registration Page

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — User acquisition |
| Usage frequency | 1 — Once per user |
| Complexity | 3 — Multi-step with email verification |
| Redesign urgency | 3 — No progress indicator, no back button on verify |
| Technical complexity | 2 — Multi-step form |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Login, Forgot Password |
| Problems | No progress indicator, no back button on verify, no resend cooldown |
| Evidence | `06-auth-and-session.md` §6.7 |

### S-03: Forgot Password Page

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Account recovery |
| Usage frequency | 1 — Rarely |
| Complexity | 1 — Email input + API call |
| Redesign urgency | 2 — No frontend reset page |
| Technical complexity | 1 |
| Dependencies | Backend reset endpoint |
| Can redesign independently? | Yes |
| Must redesign together with | Login, Registration |
| Problems | No frontend reset page, no email validation |
| Evidence | `06-auth-and-session.md` §6.7 |

### S-04: Workspace Welcome

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — First impression after registration |
| Usage frequency | 1 — Once per user |
| Complexity | 2 — Two options (create or demo) |
| Redesign urgency | 2 — Works but could be more guided |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Onboarding Wizard |
| Problems | Demo bootstrap has no loading state |
| Evidence | `07-workspace-management.md` §7.11 |

### S-05: Onboarding Wizard

| Criterion | Value |
|-----------|-------|
| Business importance | 4 — Guides first actions |
| Usage frequency | 1 — Once per workspace |
| Complexity | 3 — Multi-step modal with animations |
| Redesign urgency | 3 — No skip, no progress, no loading on seed |
| Technical complexity | 3 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Workspace Welcome |
| Problems | No skip, no progress indicator, seed loading no feedback |
| Evidence | `07-workspace-management.md` §7.11 |

### S-06: Dashboard / Overview

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — Primary landing page |
| Usage frequency | 5 — Daily |
| Complexity | 4 — Multiple widgets, realtime data, two variants |
| Redesign urgency | 4 — Inconsistent loading, quick actions navigate, no screen health summary |
| Technical complexity | 3 |
| Dependencies | Navigation restructuring (IA-001) |
| Can redesign independently? | Partially — depends on sidebar grouping |
| Must redesign together with | Sidebar, Header |
| Problems | TD-001, IA-004, no screen health summary, no activity filter |
| Evidence | `08-dashboard-and-overview.md` §8.17 |

### S-07: Screen List

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — Core feature |
| Usage frequency | 5 — Daily |
| Complexity | 3 — Card grid with status badges |
| Redesign urgency | 4 — No bulk actions, no search, no filter, no sort |
| Technical complexity | 3 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Screen Detail |
| Problems | E-004, no search/filter/sort, no bulk actions |
| Evidence | `09-screens-feature.md` §9.8 |

### S-08: Screen Detail

| Criterion | Value |
|-----------|-------|
| Business importance | 4 — Screen configuration and monitoring |
| Usage frequency | 4 — Weekly |
| Complexity | 3 — Status, config, playlist assignment |
| Redesign urgency | 3 — Back button bug, setup modal |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Screen List |
| Problems | P-004, back button label mismatch |
| Evidence | `09-screens-feature.md` §9.8 |

### S-09: Playlist Library

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — Core content management |
| Usage frequency | 4 — Weekly |
| Complexity | 3 — Grid/list view with actions |
| Redesign urgency | 3 — Works but no versioning, no templates |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Playlist Studio |
| Problems | No versioning, no templates, duplication works |
| Evidence | `10-playlists-and-studio.md` §10.12 |

### S-10: Playlist Studio (Canvas Editor)

| Criterion | Value |
|-----------|-------|
| Business importance | 5 — Core content creation |
| Usage frequency | 4 — Weekly |
| Complexity | 5 — Konva canvas, timeline, panels, live preview |
| Redesign urgency | 3 — Desktop-only, no auto-save, no templates |
| Technical complexity | 5 — Canvas-based editor |
| Dependencies | None |
| Can redesign independently? | Partially — shares state with Playlist Library |
| Must redesign together with | Playlist Library |
| Problems | No auto-save, no templates, no versioning, desktop-only, no alignment guides |
| Evidence | `10-playlists-and-studio.md` §10.12 |

### S-11: Media Library

| Criterion | Value |
|-----------|-------|
| Business importance | 4 — Asset management |
| Usage frequency | 4 — Weekly |
| Complexity | 2 — Grid view with upload |
| Redesign urgency | 4 — No bulk upload, no drag-drop, no progress, no preview |
| Technical complexity | 3 — Upload handling |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | E-004, no multi-file, no drag-drop, no progress, no proactive limit warning |
| Evidence | `11-media-library.md` §11.6 |

### S-12: Schedules Calendar

| Criterion | Value |
|-----------|-------|
| Business importance | 4 — Time-based content management |
| Usage frequency | 3 — Weekly/Monthly |
| Complexity | 4 — Calendar view with recurrence |
| Redesign urgency | 4 — No conflict detection, no timezone, no drag-to-reschedule |
| Technical complexity | 4 — Calendar component |
| Dependencies | Backend timezone support (E-005) |
| Can redesign independently? | Yes |
| Must redesign together with | Schedule Create Dialog |
| Problems | E-005, no conflict detection, no overlap viz, no drag, no timeline view |
| Evidence | `12-schedules-feature.md` §12.9 |

### S-13: Branch List

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Organizational container |
| Usage frequency | 2 — Monthly |
| Complexity | 2 — List with stats |
| Redesign urgency | 3 — Should be repositioned in IA (not top-level) |
| Technical complexity | 2 |
| Dependencies | IA restructuring (IA-001) |
| Can redesign independently? | Yes |
| Must redesign together with | Screen List (branch filter integration) |
| Problems | IA-001 — should be filter in screens, not top-level nav |
| Evidence | `13-branches-feature.md` §13.13 |

### S-14: Branch Detail

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Branch-level management |
| Usage frequency | 2 — Monthly |
| Complexity | 3 — Tabbed interface (screens, playlists, schedules, settings) |
| Redesign urgency | 2 — Works adequately |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | Back button goes to /overview (correct), but IA position is questionable |
| Evidence | `13-branches-feature.md` §13.13 |

### S-15: Analytics Page

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Performance monitoring |
| Usage frequency | 3 — Weekly |
| Complexity | 3 — Charts, period comparison |
| Redesign urgency | 3 — No custom date range, no export, no per-screen analytics |
| Technical complexity | 3 — Chart library integration |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | No export, no custom date range, no per-screen/per-playlist analytics |
| Evidence | `18-analytics-feature.md` §18.5 |

### S-16: Team Management

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — User management |
| Usage frequency | 2 — Monthly |
| Complexity | 2 — Member list + invite |
| Redesign urgency | 4 — No role change, no member removal, no cancel/resend |
| Technical complexity | 2 |
| Dependencies | Backend role system (E-003) |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | E-003, no role change, no removal, no cancel/resend |
| Evidence | `16-team-feature.md` §16.4 |

### S-17: Settings (All Tabs)

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Configuration |
| Usage frequency | 2 — Monthly |
| Complexity | 4 — 5 tabs with different forms |
| Redesign urgency | 3 — No back button, no plan selector, no workspace transfer |
| Technical complexity | 3 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | IA-005, no plan selector, no workspace transfer, 2FA disable no password |
| Evidence | `14-settings-feature.md` §14.8 |

### S-18: Notifications Page

| Criterion | Value |
|-----------|-------|
| Business importance | 2 — Alert history |
| Usage frequency | 2 — Rarely (bell dropdown suffices for most) |
| Complexity | 2 — List of notifications |
| Redesign urgency | 2 — Missing filter/search/pagination but functional |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Notification Bell (header) |
| Problems | No filter, no search, no pagination, no inline actions |
| Evidence | `17-notifications.md` §17.7 |

### S-19: Admin Dashboard

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — Admin overview |
| Usage frequency | 3 — Daily (for admins) |
| Complexity | 2 — Overview stats |
| Redesign urgency | 2 — Functional but basic |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | Admin sub-pages |
| Problems | No admin-specific dashboard widgets |
| Evidence | `15-admin-panel.md` §15.17 |

### S-20: Admin Customer Management

| Criterion | Value |
|-----------|-------|
| Business importance | 4 — Customer management |
| Usage frequency | 3 — Daily (for admins) |
| Complexity | 3 — Table + detail view + impersonation |
| Redesign urgency | 3 — No audit trail, no suspend vs delete clarity |
| Technical complexity | 3 |
| Dependencies | Backend audit log (E-002) |
| Can redesign independently? | Yes |
| Must redesign together with | Admin Staff, Admin Users |
| Problems | E-002, no audit trail, impersonation no confirmation |
| Evidence | `15-admin-panel.md` §15.17 |

### S-21: Admin Fleet Management

| Criterion | Value |
|-----------|-------|
| Business importance | 3 — System monitoring |
| Usage frequency | 2 — Weekly |
| Complexity | 2 — Fleet overview |
| Redesign urgency | 2 — Basic but functional |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | None |
| Problems | Limited fleet management features |
| Evidence | `15-admin-panel.md` §15.17 |

### S-22: API Docs Page

| Criterion | Value |
|-----------|-------|
| Business importance | 2 — Developer tool |
| Usage frequency | 1 — Rarely |
| Complexity | 3 — Documentation rendering |
| Redesign urgency | 2 — Functional |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | API Keys page |
| Problems | Should be grouped under "Developer" in IA |
| Evidence | `20-api-docs-and-webhooks.md` §20.5 |

### S-23: API Keys Page

| Criterion | Value |
|-----------|-------|
| Business importance | 2 — Developer tool |
| Usage frequency | 1 — Rarely |
| Complexity | 2 — Key list + create/revoke |
| Redesign urgency | 2 — Functional |
| Technical complexity | 2 |
| Dependencies | None |
| Can redesign independently? | Yes |
| Must redesign together with | API Docs page |
| Problems | Should be grouped under "Developer" in IA |
| Evidence | `20-api-docs-and-webhooks.md` §20.5 |

---

## Screen Priority Matrix

### Tier 1: Redesign First (Urgency 4-5)

| Screen | Urgency | Business | Frequency | Rationale |
|--------|---------|----------|-----------|-----------|
| Dashboard / Overview | 4 | 5 | 5 | Primary landing, inconsistent loading, quick actions broken |
| Screen List | 4 | 5 | 5 | Core feature, no bulk/search/filter |
| Media Library | 4 | 4 | 4 | Poor upload UX, no bulk |
| Schedules Calendar | 4 | 4 | 3 | No timezone, no conflict detection |
| Team Management | 4 | 3 | 2 | Missing core team management features |

### Tier 2: Redesign Second (Urgency 3)

| Screen | Urgency | Business | Frequency | Rationale |
|--------|---------|----------|-----------|-----------|
| Login | 3 | 5 | 2 | Missing SSO, password toggle |
| Registration | 3 | 5 | 1 | No progress, no back button |
| Onboarding Wizard | 3 | 4 | 1 | No skip, no progress, no loading |
| Screen Detail | 3 | 4 | 4 | Back button bug |
| Playlist Library | 3 | 5 | 4 | No versioning, no templates |
| Playlist Studio | 3 | 5 | 4 | Desktop-only, no auto-save |
| Branch List | 3 | 3 | 2 | IA repositioning |
| Analytics | 3 | 3 | 3 | No export, no custom range |
| Settings | 3 | 3 | 2 | No back button, no plan selector |
| Admin Customer Mgmt | 3 | 4 | 3 | No audit trail |

### Tier 3: Redesign Later (Urgency 2)

| Screen | Urgency | Business | Frequency | Rationale |
|--------|---------|----------|-----------|-----------|
| Forgot Password | 2 | 3 | 1 | No reset page |
| Workspace Welcome | 2 | 5 | 1 | Works, minor polish |
| Branch Detail | 2 | 3 | 2 | Works adequately |
| Notifications Page | 2 | 2 | 2 | Missing features but functional |
| Admin Dashboard | 2 | 3 | 3 | Basic but functional |
| Admin Fleet | 2 | 3 | 2 | Basic but functional |
| API Docs | 2 | 2 | 1 | Functional, IA repositioning |
| API Keys | 2 | 2 | 1 | Functional, IA repositioning |

---

## Independent vs. Coupled Redesign

### Can Redesign Independently

- Login, Registration, Forgot Password (as a group)
- Screen List + Screen Detail (as a pair)
- Media Library
- Team Management
- Analytics
- Settings
- Admin pages (as a group)

### Must Redesign Together

| Group | Screens | Reason |
|-------|---------|--------|
| Shell | Sidebar + Header + Dashboard | Shared layout, navigation, header meta |
| Content | Playlist Library + Studio | Shared state, entry points |
| Schedules | Calendar + Create Dialog | Shared form, conflict detection |
| Auth | Login + Register + Forgot Password | Shared layout, auth flow |
| Developer | API Docs + API Keys | Shared IA grouping |

### Blocked By Architecture

| Screen | Blocker | Must Fix First |
|--------|---------|---------------|
| Dashboard | Sidebar grouping (IA-001) | Navigation restructuring |
| Branch List | IA repositioning (IA-001) | Navigation restructuring |
| API Docs/Keys | IA grouping (IA-001) | Navigation restructuring |
| Schedules | Timezone support (E-005) | Backend timezone implementation |
| Team | Custom roles (E-003) | Backend RBAC implementation |
| Admin Customer | Audit log (E-002) | Backend audit infrastructure |

---

## Cross-References

- See `02-problem-map.md` for problem IDs
- See `08-feature-priorities.md` for feature-level priorities
- See `18-dependency-map.md` for redesign dependency graph
- See `19-redesign-roadmap.md` for phase sequencing
- See `20-implementation-phases.md` for phase execution plans
