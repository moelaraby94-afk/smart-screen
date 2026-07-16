# Feature Priorities

> **Evidence basis:** `28-feature-inventory.md` §28.6, all V1/V2 audit files, `02-problem-map.md`
> **Purpose:** Complete feature prioritization matrix from Must Have to Future

---

## Prioritization Framework

Features are categorized using a modified MoSCoW method:

| Category | Definition | Criteria |
|----------|-----------|----------|
| **Must Have** | Blocks core product function or market viability | Critical UX defect, WCAG non-compliance, or blocks a primary user flow |
| **High Priority** | Significant UX/enterprise impact, should be in first redesign wave | High-severity problem, enterprise blocker, or high-frequency pain point |
| **Medium Priority** | Improves product quality but not blocking | Medium-severity problem, polish, or competitive parity |
| **Low Priority** | Nice-to-have, cosmetic, or minor improvement | Low-severity problem, consistency, or minor UX improvement |
| **Future** | Not in scope for current transformation | New feature, market expansion, or advanced capability |

Each feature references problem IDs from `02-problem-map.md` and evidence from audit files.

---

## Must Have

### F-MH-01: Fix Switch Component RTL Bug

| Field | Value |
|-------|-------|
| Problem ID | P-001 / A-003 |
| Evidence | `05-ui-component-library.md` §6.2, `24-accessibility-audit.md` §24.7 |
| Rationale | UI is visually broken in Arabic mode — target market is Arabic-speaking |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-MH-02: Add Workspace Switcher to Mobile

| Field | Value |
|-------|-------|
| Problem ID | P-002 |
| Evidence | `04-layout-and-shell.md` §4.3, `25-responsive-audit.md` §25.7 |
| Rationale | Multi-workspace users completely blocked on mobile |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 2 (Navigation) |

### F-MH-03: Fix Sidebar Click Guards

| Field | Value |
|-------|-------|
| Problem ID | P-003 |
| Evidence | `03-routing-and-navigation.md` §3.3 |
| Rationale | Users navigate to broken pages without warning |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-MH-04: Fix Back Button Label Inconsistencies

| Field | Value |
|-------|-------|
| Problem ID | P-004 |
| Evidence | `03-routing-and-navigation.md` §3.4, `09-screens-feature.md` §9.8 |
| Rationale | Navigation labels lie to users — erodes trust |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-MH-05: Fix InfoTooltip Accessibility

| Field | Value |
|-------|-------|
| Problem ID | P-005 / A-001 |
| Evidence | `05-ui-component-library.md` §6.3, `24-accessibility-audit.md` §24.7 |
| Rationale | WCAG 2.1 non-compliance — screen readers can't access tooltip content |
| Complexity | Medium |
| Dependencies | Install `@radix-ui/react-tooltip` |
| Phase | Phase 1 (Foundation) |

### F-MH-06: Standardize Loading States

| Field | Value |
|-------|-------|
| Problem ID | TD-001 |
| Evidence | `23-error-handling-and-states.md` §23.9 |
| Rationale | Three different loading patterns create inconsistent perceived performance |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-MH-07: Fix Socket.IO Transport Fallback

| Field | Value |
|-------|-------|
| Problem ID | TD-006 |
| Evidence | `07-workspace-management.md` §7.11, `17-notifications.md` §17.7 |
| Rationale | Realtime updates silently fail on restricted networks |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-MH-08: Fix hasSuccessfulMeRef Error Swallowing

| Field | Value |
|-------|-------|
| Problem ID | TD-005 |
| Evidence | `07-workspace-management.md` §7.11 |
| Rationale | Silent auth failures — user appears logged in but data is stale |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

---

## High Priority

### F-HP-01: Restructure Sidebar Navigation (Grouping)

| Field | Value |
|-------|-------|
| Problem ID | IA-001, IA-002 |
| Evidence | `03-routing-and-navigation.md` §3.2, §3.5 |
| Rationale | 18 flat items exceeds cognitive capacity — grouping reduces scanning time |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 3 (IA) |

### F-HP-02: Fix Workspace Switch Navigation Target

| Field | Value |
|-------|-------|
| Problem ID | IA-003 |
| Evidence | `07-workspace-management.md` §7.11, `27-user-flows.md` §27.9 |
| Rationale | Users expect dashboard after switching, not branch list |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 2 (Navigation) |

### F-HP-03: Add Search/Filter to Screen List

| Field | Value |
|-------|-------|
| Problem ID | E-004 (partial) |
| Evidence | `09-screens-feature.md` §9.8 — "No filter/search, no sort options" |
| Rationale | Users with 10+ screens can't find specific screens |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 6 (Screens) |

### F-HP-04: Add Bulk Operations for Screens

| Field | Value |
|-------|-------|
| Problem ID | E-004 |
| Evidence | `09-screens-feature.md` §9.8, `28-feature-inventory.md` §28.6 |
| Rationale | Fleet managers must perform actions one-by-one |
| Complexity | Large |
| Dependencies | Backend bulk API endpoints |
| Phase | Phase 6 (Screens) |

### F-HP-05: Add Multi-File Upload to Media Library

| Field | Value |
|-------|-------|
| Problem ID | E-004 (partial) |
| Evidence | `11-media-library.md` §11.6 — "No bulk operations, upload experience" |
| Rationale | Users must upload media one file at a time |
| Complexity | Medium |
| Dependencies | Backend multi-upload support |
| Phase | Phase 5 (Content) |

### F-HP-06: Add Timezone-Aware Scheduling

| Field | Value |
|-------|-------|
| Problem ID | E-005 |
| Evidence | `12-schedules-feature.md` §12.9 |
| Rationale | Multi-location deployments get wrong schedule times |
| Complexity | Large |
| Dependencies | Backend timezone support |
| Phase | Phase 8 (Schedules) |

### F-HP-07: Add Schedule Conflict Detection

| Field | Value |
|-------|-------|
| Problem ID | (New — from `12-schedules-feature.md` §12.9) |
| Evidence | `12-schedules-feature.md` §12.9 — "No conflict detection" |
| Rationale | Users can accidentally schedule overlapping content on same screen |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 8 (Schedules) |

### F-HP-08: Add Team Role Management

| Field | Value |
|-------|-------|
| Problem ID | E-003 |
| Evidence | `16-team-feature.md` §16.4 |
| Rationale | Only 3 predefined roles — insufficient for enterprise |
| Complexity | XL |
| Dependencies | Backend RBAC |
| Phase | Phase 9 (Settings) |

### F-HP-09: Add Team Member Removal and Invite Management

| Field | Value |
|-------|-------|
| Problem ID | (From `16-team-feature.md` §16.4) |
| Evidence | `16-team-feature.md` §16.4 — "No role change, no member removal, no cancel/resend" |
| Rationale | Basic team management incomplete |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 9 (Settings) |

### F-HP-10: Add Audit Log for Admin Actions

| Field | Value |
|-------|-------|
| Problem ID | E-002 |
| Evidence | `15-admin-panel.md` §15.17, `27-user-flows.md` §27.9 |
| Rationale | Compliance requirement for enterprise customers |
| Complexity | Large |
| Dependencies | Backend audit infrastructure |
| Phase | Phase 9 (Settings) |

### F-HP-11: Add SSO/SAML Support

| Field | Value |
|-------|-------|
| Problem ID | E-001 |
| Evidence | `28-feature-inventory.md` §28.6 |
| Rationale | Hard requirement for enterprise sales |
| Complexity | XL |
| Dependencies | Backend SSO/SAML |
| Phase | Phase 9 (Settings) |

### F-HP-12: Add Critical Path Test Coverage

| Field | Value |
|-------|-------|
| Problem ID | TD-007 |
| Evidence | `28-feature-inventory.md` §28.5 |
| Rationale | Regression risk — only 2 test files |
| Complexity | Large |
| Dependencies | None |
| Phase | Phase 10 (Polish) |

### F-HP-13: Add Workspace Switcher Search

| Field | Value |
|-------|-------|
| Problem ID | E-006 |
| Evidence | `07-workspace-management.md` §7.11 |
| Rationale | Switcher unusable beyond ~20 workspaces |
| Complexity | Medium |
| Dependencies | None |
| Phase | Phase 2 (Navigation) |

### F-HP-14: Improve Quick Actions (Act Instead of Navigate)

| Field | Value |
|-------|-------|
| Problem ID | IA-004 |
| Evidence | `08-dashboard-and-overview.md` §8.17, `21-search-and-global-actions.md` §21.3 |
| Rationale | Dashboard should be a command center, not a link list |
| Complexity | Medium |
| Dependencies | Create add-screen, upload-media, create-playlist dialogs |
| Phase | Phase 4 (Dashboard) |

### F-HP-15: Add Color Contrast Fixes (WCAG AA)

| Field | Value |
|-------|-------|
| Problem ID | A-004 |
| Evidence | `24-accessibility-audit.md` §24.7 |
| Rationale | WCAG non-compliance |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

### F-HP-16: Fix Button Touch Targets (44px Minimum)

| Field | Value |
|-------|-------|
| Problem ID | A-002 |
| Evidence | `02-design-system-and-tokens.md` §2.20, `25-responsive-audit.md` §25.7 |
| Rationale | WCAG 2.5.5 non-compliance |
| Complexity | Small |
| Dependencies | None |
| Phase | Phase 1 (Foundation) |

---

## Medium Priority

### F-MP-01: Add Settings Back Button

| Field | Value |
|-------|-------|
| Problem ID | IA-005 |
| Evidence | `14-settings-feature.md` §14.8 |
| Complexity | Small |
| Phase | Phase 2 (Navigation) |

### F-MP-02: Unify Icon Stroke Width

| Field | Value |
|-------|-------|
| Problem ID | TD-002 / C-001 |
| Evidence | `26-consistency-audit.md` §26.6 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-MP-03: Resolve Icon Duplication

| Field | Value |
|-------|-------|
| Problem ID | TD-003 |
| Evidence | `26-consistency-audit.md` §26.6 |
| Complexity | Small |
| Phase | Phase 3 (IA) |

### F-MP-04: Remove or Render AuroraBackdrop

| Field | Value |
|-------|-------|
| Problem ID | TD-004 |
| Evidence | `04-layout-and-shell.md` §4.8 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-MP-05: Add Analytics Export (CSV/PDF)

| Field | Value |
|-------|-------|
| Problem ID | (From `18-analytics-feature.md` §18.5) |
| Evidence | `18-analytics-feature.md` §18.5 |
| Complexity | Medium |
| Dependencies | Backend export endpoints |
| Phase | Phase 10 (Polish) |

### F-MP-06: Add Analytics Custom Date Range

| Field | Value |
|-------|-------|
| Problem ID | (From `18-analytics-feature.md` §18.5) |
| Evidence | `18-analytics-feature.md` §18.5 |
| Complexity | Medium |
| Phase | Phase 10 (Polish) |

### F-MP-07: Add Notification Persistence (localStorage)

| Field | Value |
|-------|-------|
| Problem ID | (From `17-notifications.md` §17.7) |
| Evidence | `17-notifications.md` §17.7 |
| Complexity | Small |
| Phase | Phase 10 (Polish) |

### F-MP-08: Add Notification Grouping

| Field | Value |
|-------|-------|
| Problem ID | (From `17-notifications.md` §17.7) |
| Evidence | `17-notifications.md` §17.7 |
| Complexity | Medium |
| Phase | Phase 10 (Polish) |

### F-MP-09: Add Billing Plan Selector

| Field | Value |
|-------|-------|
| Problem ID | (From `14-settings-feature.md` §14.8) |
| Evidence | `14-settings-feature.md` §14.8 |
| Complexity | Medium |
| Dependencies | Backend plan management |
| Phase | Phase 9 (Settings) |

### F-MP-10: Add Inline Upgrade Prompts

| Field | Value |
|-------|-------|
| Problem ID | (From `08-dashboard-and-overview.md` §8.17) |
| Evidence | `08-dashboard-and-overview.md` §8.17, `11-media-library.md` §11.6 |
| Complexity | Medium |
| Phase | Phase 4 (Dashboard) |

### F-MP-11: Add Schedule Drag-to-Reschedule

| Field | Value |
|-------|-------|
| Problem ID | (From `12-schedules-feature.md` §12.9) |
| Evidence | `12-schedules-feature.md` §12.9 |
| Complexity | Large |
| Phase | Phase 8 (Schedules) |

### F-MP-12: Add Schedule Overlap Visualization

| Field | Value |
|-------|-------|
| Problem ID | (From `12-schedules-feature.md` §12.9) |
| Evidence | `12-schedules-feature.md` §12.9 |
| Complexity | Medium |
| Phase | Phase 8 (Schedules) |

### F-MP-13: Add Playlist Version History

| Field | Value |
|-------|-------|
| Problem ID | (From `28-feature-inventory.md` §28.6) |
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Large |
| Dependencies | Backend versioning |
| Phase | Phase 7 (Playlists) |

### F-MP-14: Add Playlist Auto-Save in Studio

| Field | Value |
|-------|-------|
| Problem ID | (From `10-playlists-and-studio.md` §10.12) |
| Evidence | `10-playlists-and-studio.md` §10.12 |
| Complexity | Medium |
| Phase | Phase 7 (Playlists) |

### F-MP-15: Add Publish Confirmation (Proof of Playback)

| Field | Value |
|-------|-------|
| Problem ID | (From `27-user-flows.md` §27.9) |
| Evidence | `27-user-flows.md` §27.9 |
| Complexity | Large |
| Dependencies | Backend proof-of-play |
| Phase | Phase 7 (Playlists) |

### F-MP-16: Add Onboarding Skip Option

| Field | Value |
|-------|-------|
| Problem ID | (From `27-user-flows.md` §27.9) |
| Evidence | `27-user-flows.md` §27.9 |
| Complexity | Small |
| Phase | Phase 4 (Dashboard) |

### F-MP-17: Add Registration Progress Indicator

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-MP-18: Add Password Visibility Toggle

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

---

## Low Priority

### F-LP-01: Add Pluralization Support

| Field | Value |
|-------|-------|
| Problem ID | I-001 |
| Evidence | `22-i18n-and-localization.md` §22.8 |
| Complexity | Small |
| Phase | Phase 10 (Polish) |

### F-LP-02: Add Eastern Arabic Numerals

| Field | Value |
|-------|-------|
| Problem ID | I-002 |
| Evidence | `22-i18n-and-localization.md` §22.8 |
| Complexity | Small |
| Phase | Phase 10 (Polish) |

### F-LP-03: Standardize Responsive Grid Patterns

| Field | Value |
|-------|-------|
| Problem ID | C-004 |
| Evidence | `25-responsive-audit.md` §25.7 |
| Complexity | Medium |
| Phase | Phase 10 (Polish) |

### F-LP-04: Add Notification Sound

| Field | Value |
|-------|-------|
| Problem ID | (From `17-notifications.md` §17.7) |
| Evidence | `17-notifications.md` §17.7 |
| Complexity | Small |
| Phase | Phase 10 (Polish) |

### F-LP-05: Add Resend Code Cooldown

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-LP-06: Add Email Field Type Correction

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-LP-07: Add Logout Success Toast

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 — "Logout from sidebar is silent" |
| Complexity | Small |
| Phase | Phase 1 (Foundation) |

### F-LP-08: Add Logout Confirmation

| Field | Value |
|-------|-------|
| Problem ID | (From `06-auth-and-session.md` §6.7) |
| Evidence | `06-auth-and-session.md` §6.7 — "No 'Are You Sure?' confirmation" |
| Complexity | Small |
| Phase | Phase 10 (Polish) |

---

## Future

### F-FU-01: SSO with Multiple Providers (Okta, Azure AD, Google)

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |
| Dependencies | F-HP-11 (basic SSO) |
| Note | Start with one provider, expand later |

### F-FU-02: Content Approval Workflow

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |
| Dependencies | Custom roles (E-003) |

### F-FU-03: Live Screenshot Preview from Screens

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Large |
| Dependencies | Player app support |

### F-FU-04: Remote Screen Control (Reboot, Volume, Brightness)

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Large |
| Dependencies | Player app support |

### F-FU-05: OTA Update Management

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |
| Dependencies | Player app infrastructure |

### F-FU-06: Multi-Zone Screen Layouts

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |
| Dependencies | Studio redesign |

### F-FU-07: Proof-of-Play Reports

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Large |
| Dependencies | Player app logging |

### F-FU-08: A/B Testing for Content

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |

### F-FU-09: Content Templates Marketplace

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |

### F-FU-10: Social Media Integration (Twitter/X, Instagram)

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Large |

### F-FU-11: Weather Widget

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Medium |

### F-FU-12: News/RSS Feed Widget

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | Medium |

### F-FU-13: Audience Analytics (Camera-Based)

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |

### F-FU-14: Cross-Workspace Search

| Field | Value |
|-------|-------|
| Evidence | `21-search-and-global-actions.md` §21.3 |
| Complexity | Large |

### F-FU-15: Custom Dashboard Layout

| Field | Value |
|-------|-------|
| Evidence | `28-feature-inventory.md` §28.6 |
| Complexity | XL |

---

## Priority Summary

| Category | Count | Est. Complexity |
|----------|-------|-----------------|
| Must Have | 8 | 3 Small, 4 Medium, 1 Large |
| High Priority | 16 | 3 Small, 7 Medium, 3 Large, 3 XL |
| Medium Priority | 18 | 7 Small, 8 Medium, 3 Large |
| Low Priority | 8 | 7 Small, 1 Medium |
| Future | 15 | 3 Medium, 4 Large, 8 XL |
| **Total** | **65** | |

---

## Cross-References

- See `02-problem-map.md` for problem ID definitions
- See `07-screen-priorities.md` for screen-level priorities
- See `19-redesign-roadmap.md` for phase sequencing of these features
- See `20-implementation-phases.md` for phase execution plans
