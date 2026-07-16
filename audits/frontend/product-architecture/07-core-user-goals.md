# Core User Goals

> **Evidence basis:** `10-mental-model-analysis.md` (transformation), `09-workflow-analysis.md` (transformation), `27-user-flows.md` (audit), locked product decisions
> **Purpose:** Define what users are trying to achieve — their goals, not their tasks

---

## 1. Goal Hierarchy

User goals exist at three levels:

```
Aspirational Goals (why they bought the product)
  └── Practical Goals (what they're trying to achieve with the product)
       └── Operational Goals (what they need to do today)
```

---

## 2. Aspirational Goals

| ID | Goal | Who | Evidence |
|----|------|-----|----------|
| AG-01 | "I want to promote my restaurant visually on screens without hiring a designer." | Workspace Owner | Locked product decision (enterprise restaurants) |
| AG-02 | "I want to manage all my screens from one place, even across multiple locations." | Workspace Owner | `01-current-product-model.md` §3 (multi-branch) |
| AG-03 | "I want my screens to always show the right content at the right time." | Workspace Owner, Editor | `12-schedules-feature.md` §12.3 |
| AG-04 | "I want to know if my screens are working without physically checking them." | Workspace Owner | `08-dashboard-and-overview.md` §8.17 |
| AG-05 | "I want my team to help manage content without giving them full access." | Workspace Owner | `16-team-feature.md` §16.3 |

---

## 3. Practical Goals

| ID | Goal | Parent | Who | Evidence |
|----|------|--------|-----|----------|
| PG-01 | Connect a screen to the platform | AG-02 | Workspace Owner, Editor | `09-screens-feature.md` §9.8 |
| PG-02 | Create visual content for screens | AG-01 | Editor | `10-playlists-and-studio.md` §10.3 |
| PG-03 | Display content on a screen | AG-03 | Editor | `12-schedules-feature.md` §12.3 |
| PG-04 | Schedule content for specific times | AG-03 | Editor | `12-schedules-feature.md` §12.3 |
| PG-05 | Monitor screen health | AG-04 | Workspace Owner, Editor | `08-dashboard-and-overview.md` §8.17 |
| PG-06 | Update content quickly | AG-01 | Editor | `10-playlists-and-studio.md` §10.12 |
| PG-07 | Organize screens by location | AG-02 | Workspace Owner | `13-branches-feature.md` §13.3 |
| PG-08 | Delegate content management | AG-05 | Workspace Owner | `16-team-feature.md` §16.3 |
| PG-09 | Track content performance | AG-01, AG-04 | Workspace Owner, Editor | `18-analytics-feature.md` §18.3 |
| PG-10 | Manage subscription and billing | AG-02 | Workspace Owner | `14-settings-feature.md` §14.8 |

---

## 4. Operational Goals

| ID | Goal | Parent | Frequency | Evidence |
|----|------|--------|-----------|----------|
| OG-01 | See which screens are online/offline | PG-05 | Daily | `08-dashboard-and-overview.md` §8.17 |
| OG-02 | Upload a new image or video | PG-06 | Weekly | `11-media-library.md` §11.8 |
| OG-03 | Create a playlist from a template | PG-02 | Weekly | `transformation/08-feature-priorities.md` F-MP-13 |
| OG-04 | Edit an existing playlist | PG-06 | Weekly | `10-playlists-and-studio.md` §10.12 |
| OG-05 | Publish content to a screen immediately | PG-03 | Weekly | Locked decision (immediate publish) |
| OG-06 | Schedule content for lunch hours | PG-04 | Monthly | `12-schedules-feature.md` §12.8 |
| OG-07 | Check if a screen is showing the right content | PG-05 | Daily | `09-screens-feature.md` §9.8 |
| OG-08 | Reboot an unresponsive screen | PG-05 | As needed | `09-screens-feature.md` §9.8 |
| OG-09 | Invite a team member | PG-08 | Occasional | `16-team-feature.md` §16.4 |
| OG-10 | Change a team member's role | PG-08 | Occasional | `16-team-feature.md` §16.4 |
| OG-11 | Add a new screen for a new location | PG-01, PG-07 | Monthly | `09-screens-feature.md` §9.8 |
| OG-12 | Review monthly analytics | PG-09 | Monthly | `18-analytics-feature.md` §18.8 |
| OG-13 | Update billing plan | PG-10 | Occasional | `14-settings-feature.md` §14.8 |
| OG-14 | Override content on a screen (emergency) | PG-03 | Rare | `08-dashboard-and-overview.md` §8.17 |
| OG-15 | Set up prayer time interruptions | AG-03 | Once + maintenance | `19-islamic-features.md` |

---

## 5. Goal-to-Module Mapping

| Goal | Primary Module | Secondary Module | Evidence |
|------|---------------|-----------------|----------|
| AG-01 Promote visually | Content | Screens | — |
| AG-02 Manage all screens | Screens | Overview | — |
| AG-03 Right content at right time | Scheduling | Content | — |
| AG-04 Know if screens work | Overview | Analytics | — |
| AG-05 Team delegation | Team | Settings | — |
| PG-01 Connect screen | Screens | — | — |
| PG-02 Create content | Content | — | — |
| PG-03 Display content | Screens | Scheduling | — |
| PG-04 Schedule content | Scheduling | — | — |
| PG-05 Monitor health | Overview | Screens | — |
| PG-06 Update content | Content | — | — |
| PG-07 Organize by location | Screens (branch filter) | Settings | — |
| PG-08 Delegate | Team | Settings | — |
| PG-09 Track performance | Analytics | — | — |
| PG-10 Manage billing | Settings | — | — |

---

## 6. Goal Friction Analysis

| Goal | Current Friction | Primary Blocker | Architecture Fix |
|------|-----------------|-----------------|------------------|
| PG-01 Connect screen | Medium | Setup modal, not wizard | Pairing wizard (locked decision) |
| PG-02 Create content | High | Blank Studio, no templates | Template picker, quick-start |
| PG-03 Display content | High | Scheduling required | Immediate publish (locked decision) |
| PG-04 Schedule content | Medium | Form complexity, no conflict detection | Progressive disclosure, conflict detection |
| PG-05 Monitor health | Medium | No summary count on Overview | Overview optimization |
| PG-06 Update content | Medium | Studio desktop-only, no auto-save | Auto-save, mobile preview |
| PG-07 Organize by location | Low | Branches as top-level nav (confusing) | Branches as filter (DD-03) |
| PG-08 Delegate | High | No role change, no member removal | Team CRUD completion |
| PG-09 Track performance | Low | No export, limited metrics | Analytics enhancement (future) |
| PG-10 Manage billing | High | No plan selector, no invoices | Billing tab completion |

**Evidence:** `transformation/09-workflow-analysis.md` §1.1 (workflow friction score: 3/5); `transformation/06-user-journey-analysis.md` (journey friction scores).

---

## 7. Goal Conflicts

| Conflict | Resolution | Rationale |
|----------|-----------|-----------|
| PG-02 (create content) vs. speed | Templates first, Studio second | First-time users need speed; power users need flexibility. Templates serve both. |
| PG-04 (schedule) vs. PG-03 (display immediately) | Immediate publish is default, schedule is opt-in | Locked decision: scheduling is optional. |
| PG-07 (organize by location) vs. simplicity | Branches as filter, not nav item | Locked decision: branches are optional, not top-level. |
| PG-08 (delegate) vs. security | Three roles (Owner, Editor, Viewer) | Simple model. Custom roles are future enterprise feature (E-003). |
| OG-14 (emergency override) vs. scheduled content | Override takes priority, scheduled content resumes after | `08-dashboard-and-overview.md` §8.17 (emergency overlay) |

---

## Cross-References

- See `05-primary-user-journey.md` for the journey that serves PG-01, PG-02, PG-03
- See `06-secondary-journeys.md` for journeys that serve other goals
- See `08-jobs-to-be-done.md` for JTBD framework
- See `09-product-modules.md` for module definitions
- See `transformation/10-mental-model-analysis.md` for mental model analysis
- See `transformation/09-workflow-analysis.md` for workflow friction analysis
