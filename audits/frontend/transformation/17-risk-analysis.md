# Risk Analysis

> **Evidence basis:** All transformation documents, `02-problem-map.md`, `03-root-cause-analysis.md`
> **Purpose:** Risk assessment for each transformation step — risk of fixing vs. risk of ignoring

---

## 1. Risk Assessment Framework

Each risk is evaluated on:

| Dimension | Scale | Description |
|-----------|-------|-------------|
| Probability | 1-5 | Likelihood of occurrence |
| Impact | 1-5 | Severity of consequences |
| Risk Score | P × I | 1-25 (1=low, 25=critical) |
| Mitigation | — | How to reduce probability or impact |

---

## 2. Transformation Risks

### R-01: Sidebar Restructuring Breaks User Habits

| Field | Value |
|-------|-------|
| **Probability** | 4 — Users have muscle memory for current nav positions |
| **Impact** | 3 — Temporary confusion, increased support tickets |
| **Risk Score** | 12 — High |
| **Description** | Grouping 18 flat items into categories changes the spatial location of every nav item. Users who learned "Screens is the 3rd item" will need to relearn. |
| **Mitigation** | Phase the change: (1) Add group headers without removing items, (2) After 2 weeks, collapse groups, (3) After 2 more weeks, reorder within groups. Provide a "What's new" toast on first visit after change. |
| **Evidence** | IA-001, `03-routing-and-navigation.md` §3.2 |

### R-02: Splitting WorkspaceProvider Causes State Bugs

| Field | Value |
|-------|-------|
| **Probability** | 3 — Context splitting changes render timing |
| **Impact** | 4 — Auth/workspace state bugs can lock users out |
| **Risk Score** | 12 — High |
| **Description** | Splitting `WorkspaceProvider` into `AuthProvider`, `WorkspaceContext`, and `ImpersonationContext` changes when components re-render and could introduce race conditions. |
| **Mitigation** | Write comprehensive tests before refactoring. Test auth flow, workspace switching, impersonation, and session expiry. Deploy behind a feature flag. |
| **Evidence** | `16-state-strategy.md` §2.2 |

### R-03: Replacing InfoTooltip Changes Tooltip Behavior

| Field | Value |
|-------|-------|
| **Probability** | 3 — Radix Tooltip has different show/hide delay and positioning |
| **Impact** | 2 — Minor visual difference, users adapt quickly |
| **Risk Score** | 6 — Medium |
| **Description** | Custom InfoTooltip shows on hover immediately. Radix Tooltip has a default delay. Positioning may differ. |
| **Mitigation** | Configure Radix Tooltip delay to match current behavior. Test all InfoTooltip usages. |
| **Evidence** | P-005, `05-ui-component-library.md` §6.3 |

### R-04: Optimistic Updates Cause Data Inconsistency

| Field | Value |
|-------|-------|
| **Probability** | 2 — Only if API fails after optimistic update |
| **Impact** | 3 — User sees stale data briefly, then revert |
| **Risk Score** | 6 — Medium |
| **Description** | Optimistic updates show the expected result before the API confirms. If the API fails, the UI must revert. If revert fails, data is inconsistent. |
| **Mitigation** | Only use optimistic updates for low-risk operations (rename, toggle). Always revert on error. Show toast on revert. |
| **Evidence** | `16-state-strategy.md` §2.3 |

### R-05: Socket.IO Polling Fallback Increases Server Load

| Field | Value |
|-------|-------|
| **Probability** | 3 — Polling creates periodic HTTP requests |
| **Impact** | 2 — Increased server load, but only when WebSocket fails |
| **Risk Score** | 6 — Medium |
| **Description** | Adding polling fallback means clients on restricted networks will poll periodically, increasing server load. |
| **Mitigation** | Set reasonable polling interval (10-25 seconds). Monitor server load after deployment. |
| **Evidence** | TD-006, `07-workspace-management.md` §7.11 |

### R-06: Removing hasSuccessfulMeRef Increases API Calls

| Field | Value |
|-------|-------|
| **Probability** | 4 — SWR dedup helps but doesn't eliminate all calls |
| **Impact** | 2 — More API calls, slightly higher server load |
| **Risk Score** | 8 — Medium |
| **Description** | Removing the ref guard means `/auth/me` may be called more frequently. |
| **Mitigation** | Rely on SWR's `dedupingInterval` (default 2 seconds). Set appropriate `refreshInterval` for auth checks. |
| **Evidence** | TD-005, `07-workspace-management.md` §7.11 |

### R-07: Bulk Operations UI Changes List Patterns

| Field | Value |
|-------|-------|
| **Probability** | 3 — Adding checkboxes and action bar changes list layout |
| **Impact** | 3 — Existing list interactions change |
| **Risk Score** | 9 — Medium |
| **Description** | Adding bulk select to screen cards/media grid requires checkboxes, selection state, and a bulk action bar. This changes the visual layout. |
| **Mitigation** | Make bulk select optional (toggle button). Default to single-select mode. Only show checkboxes when bulk mode is active. |
| **Evidence** | E-004, `09-screens-feature.md` §9.8 |

### R-08: SSO Integration Changes Auth Flow

| Field | Value |
|-------|-------|
| **Probability** | 3 — SSO redirect flow is different from password auth |
| **Impact** | 4 — Auth flow bugs can lock all users out |
| **Risk Score** | 12 — High |
| **Description** | Adding SSO/SAML changes the authentication flow. SSO uses redirect-based auth (SP → IdP → SP) which is fundamentally different from form-based auth. |
| **Mitigation** | Keep password auth as fallback. Test SSO flow thoroughly. Deploy behind feature flag. Monitor for auth failures post-deployment. |
| **Evidence** | E-001, `28-feature-inventory.md` §28.6 |

### R-09: Custom Roles RBAC Changes Permission Checks Everywhere

| Field | Value |
|-------|-------|
| **Probability** | 4 — Permission checks exist across all features |
| **Impact** | 5 — Wrong permissions can expose or hide features incorrectly |
| **Risk Score** | 20 — Very High |
| **Description** | Moving from 3 predefined roles to custom RBAC changes how permissions are checked in every feature. Every "can this user do X?" check must be updated. |
| **Mitigation** | Build comprehensive permission test suite before migration. Use feature flag to roll out gradually. Maintain backward compatibility with predefined roles. |
| **Evidence** | E-003, `16-team-feature.md` §16.4 |

### R-10: Timezone-Aware Scheduling Breaks Existing Schedules

| Field | Value |
|-------|-------|
| **Probability** | 3 — Existing schedules may not have timezone metadata |
| **Impact** | 4 — Schedules could display at wrong times after migration |
| **Risk Score** | 12 — High |
| **Description** | Adding timezone support to schedules requires data migration. Existing schedules are stored without timezone — they default to workspace timezone. If the workspace timezone is wrong, all schedules shift. |
| **Mitigation** | Migration script: set all existing schedules to workspace timezone. Verify display before and after migration. Allow users to override timezone per schedule. |
| **Evidence** | E-005, `12-schedules-feature.md` §12.9 |

### R-11: Studio Refactoring Breaks Canvas Editor

| Field | Value |
|-------|-------|
| **Probability** | 3 — Konva state management is complex |
| **Impact** | 5 — Studio is a core feature, breaking it blocks content creation |
| **Risk Score** | 15 — High |
| **Description** | Decomposing the Studio into smaller components changes how Konva state is managed. Canvas state, layer references, and event handlers are tightly coupled. |
| **Mitigation** | Don't refactor Studio architecture in this transformation. Only add features (templates, auto-save, alignment guides). Architectural refactoring is a separate future project. |
| **Evidence** | `10-playlists-and-studio.md` §10.12 |

### R-12: Mobile Navigation Changes Affect All Mobile Users

| Field | Value |
|-------|-------|
| **Probability** | 3 — Adding workspace switcher and potentially bottom nav |
| **Impact** | 3 — Mobile layout changes are visible to all mobile users |
| **Risk Score** | 9 — Medium |
| **Description** | Adding workspace switcher to mobile sidebar changes the sidebar layout. Adding bottom navigation (if implemented) changes the entire mobile interaction pattern. |
| **Mitigation** | Test on multiple device sizes. Phase the changes: switcher first, bottom nav later. Collect user feedback after each phase. |
| **Evidence** | P-002, `25-responsive-audit.md` §25.7 |

---

## 3. Risk of Ignoring

### R-IGN-01: Ignoring Switch RTL Bug

| Field | Value |
|-------|-------|
| **Risk Score** | 15 — High |
| **Description** | Arabic users see broken toggle controls. Product credibility eroded in target market. |
| **Evidence** | P-001 |

### R-IGN-02: Ignoring Mobile Workspace Switching

| Field | Value |
|-------|-------|
| **Risk Score** | 20 — Very High |
| **Description** | Multi-workspace mobile users completely blocked. Forces desktop-only usage for a core workflow. |
| **Evidence** | P-002 |

### R-IGN-03: Ignoring Enterprise Features (SSO, Audit, RBAC)

| Field | Value |
|-------|-------|
| **Risk Score** | 20 — Very High |
| **Description** | Enterprise market remains inaccessible. Revenue growth capped at SMB segment. |
| **Evidence** | E-001, E-002, E-003 |

### R-IGN-04: Ignoring Test Coverage

| Field | Value |
|-------|-------|
| **Risk Score** | 15 — High |
| **Description** | Every future change risks regression. Technical debt compounds. Development velocity decreases over time. |
| **Evidence** | TD-007 |

### R-IGN-05: Ignoring Sidebar Navigation Restructuring

| Field | Value |
|-------|-------|
| **Risk Score** | 12 — High |
| **Description** | Navigation worsens with every new feature. Cognitive load increases. User satisfaction decreases. |
| **Evidence** | IA-001 |

### R-IGN-06: Ignoring Socket.IO Transport Fallback

| Field | Value |
|-------|-------|
| **Risk Score** | 10 — Medium |
| **Description** | Users on restricted networks silently lose realtime updates. Support tickets from "notifications not working" increase. |
| **Evidence** | TD-006 |

---

## 4. Risk Priority Matrix

| Risk ID | Risk | Score | Action |
|---------|------|-------|--------|
| R-09 | Custom roles RBAC | 20 | Mitigate with comprehensive tests + feature flag |
| R-IGN-02 | Ignoring mobile workspace switching | 20 | Must fix — P-002 |
| R-IGN-03 | Ignoring enterprise features | 20 | Must fix — enterprise expansion |
| R-IGN-01 | Ignoring Switch RTL | 15 | Must fix — target market credibility |
| R-11 | Studio refactoring | 15 | Avoid — don't refactor architecture |
| R-IGN-04 | Ignoring test coverage | 15 | Must fix — add tests |
| R-01 | Sidebar restructuring | 12 | Mitigate with phased rollout |
| R-02 | Splitting WorkspaceProvider | 12 | Mitigate with tests + feature flag |
| R-08 | SSO integration | 12 | Mitigate with password fallback + feature flag |
| R-10 | Timezone scheduling migration | 12 | Mitigate with migration script + verification |
| R-IGN-05 | Ignoring sidebar restructuring | 12 | Must fix — worsens over time |
| R-IGN-06 | Ignoring Socket.IO fallback | 10 | Should fix — silent failures |
| R-07 | Bulk operations UI | 9 | Mitigate with optional bulk mode |
| R-12 | Mobile navigation changes | 9 | Mitigate with phased rollout |
| R-06 | Removing hasSuccessfulMeRef | 8 | Mitigate with SWR dedup |
| R-03 | InfoTooltip replacement | 6 | Low risk — proceed |
| R-04 | Optimistic updates | 6 | Low risk — proceed carefully |
| R-05 | Socket.IO polling fallback | 6 | Low risk — monitor server load |

---

## 5. Transformation Risk Summary

**Overall transformation risk: Medium-High**

The highest-risk changes are:
1. Custom roles RBAC (R-09) — touches every permission check
2. SSO integration (R-08) — changes auth flow
3. Sidebar restructuring (R-01) — changes user habits
4. Timezone scheduling migration (R-10) — data migration risk
5. WorkspaceProvider splitting (R-02) — state management changes

**Risk mitigation strategy:**
- Feature flags for all major changes
- Comprehensive test coverage before refactoring
- Phased rollout for navigation changes
- Password auth fallback for SSO
- Migration scripts with verification for data changes
- No Studio architectural refactoring in this transformation

---

## Cross-References

- See `02-problem-map.md` for problem IDs
- See `03-root-cause-analysis.md` for root causes
- See `18-dependency-map.md` for dependency ordering
- See `20-implementation-phases.md` for phase execution plans
