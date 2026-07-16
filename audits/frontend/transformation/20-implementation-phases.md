# Implementation Phases

> **Evidence basis:** `19-redesign-roadmap.md`, `18-dependency-map.md`, `17-risk-analysis.md`
> **Purpose:** Phase execution plans with detailed entry/exit criteria, task lists, and verification steps

---

## Phase 0: Preparation

### Duration: 1-2 weeks

### Objective
Finalize all planning artifacts, set up testing infrastructure, and align stakeholders before any code changes.

### Tasks

| ID | Task | Owner | Output |
|----|------|-------|--------|
| 0.1 | Review and finalize problem catalog | Product + Engineering | Approved `02-problem-map.md` |
| 0.2 | Complete component inventory | Frontend Lead | Component inventory document |
| 0.3 | Set up Vitest with testing utilities | Frontend Lead | Working test runner with DOM mocks |
| 0.4 | Set up Playwright for E2E | Frontend Lead | Working E2E runner with auth setup |
| 0.5 | Document current design tokens | Design Lead | Token audit document |
| 0.6 | Identify backend API dependencies | Tech Lead | Backend dependency list |
| 0.7 | Communicate backend requirements | Product → Backend Team | Backend sprint plan |
| 0.8 | Review roadmap with stakeholders | Product Lead | Approved roadmap |

### Entry Criteria
- V2 audit complete
- Transformation blueprint complete

### Exit Criteria
- [ ] Problem catalog reviewed and approved
- [ ] Component inventory documented
- [ ] Vitest operational with testing utilities
- [ ] Playwright operational with auth setup
- [ ] Token audit documented
- [ ] Backend dependency list communicated
- [ ] Roadmap approved by stakeholders

### Verification
- Run `npm test` — should pass with 0 tests (infrastructure ready)
- Run `npx playwright test` — should pass with 0 tests (infrastructure ready)

---

## Phase 1: Foundation

### Duration: 2-3 weeks

### Objective
Fix all critical defects that affect every user interaction. Standardize foundational patterns.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 1.1 | Fix Switch RTL bug | P-001 | Small | Low |
| 1.2 | Fix sidebar click guards | P-003 | Small | Low |
| 1.3 | Fix back button label inconsistencies | P-004 | Small | Low |
| 1.4 | Install @radix-ui/react-tooltip | — | Small | Low |
| 1.5 | Replace InfoTooltip with Radix Tooltip | P-005 | Medium | Medium |
| 1.6 | Standardize loading states (skeleton + spinner) | TD-001 | Medium | Low |
| 1.7 | Add Socket.IO polling fallback | TD-006 | Small | Medium |
| 1.8 | Fix hasSuccessfulMeRef error swallowing | TD-005 | Small | Medium |
| 1.9 | Unify icon stroke width to 1.5 | TD-002 | Small | Low |
| 1.10 | Remove or render AuroraBackdrop | TD-004 | Small | Low |
| 1.11 | Fix color contrast to WCAG AA | A-004 | Small | Low |
| 1.12 | Fix button touch targets (44px mobile) | A-002 | Small | Low |
| 1.13 | Add password visibility toggle | — | Small | Low |
| 1.14 | Fix email field type to `type="email"` | — | Small | Low |
| 1.15 | Add resend code cooldown timer | — | Small | Low |
| 1.16 | Add registration progress indicator | — | Small | Low |
| 1.17 | Add logout success toast | — | Small | Low |

### Entry Criteria
- [ ] Phase 0 complete
- [ ] Test infrastructure operational

### Exit Criteria
- [ ] Switch thumb moves correctly in both LTR and RTL
- [ ] Click guards prevent navigation and show toasts when no workspace
- [ ] All back button labels match their destinations
- [ ] Tooltip component uses Radix, has `role="tooltip"` and `aria-describedby`
- [ ] All page-level loading uses skeleton; all action-level loading uses spinner
- [ ] Socket.IO connects via polling when WebSocket is blocked
- [ ] Auth errors after first success are handled (redirect or retry)
- [ ] All icons use `ICON_STROKE` constant (value: 1.5)
- [ ] AuroraBackdrop either rendered or removed
- [ ] All text/background combinations meet WCAG AA contrast
- [ ] All interactive elements ≥ 44×44px on mobile
- [ ] Login form has password visibility toggle
- [ ] Email fields use `type="email"`
- [ ] Resend code has cooldown timer
- [ ] Registration shows progress indicator
- [ ] Logout shows success toast

### Verification
- Unit tests for Switch component (LTR + RTL)
- Unit tests for click guard logic
- Visual test: all pages in light/dark × LTR/RTL
- Accessibility audit: axe-core or Lighthouse
- Manual test: login → logout flow
- Manual test: workspace deletion → navigation guard

---

## Phase 2: Navigation

### Duration: 2-3 weeks

### Objective
Fix navigation system — mobile workspace switching, switcher improvements, back button coverage.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 2.1 | Add WorkspaceSwitcher to mobile sidebar | P-002 | Medium | Medium |
| 2.2 | Change workspace switch target to /overview | IA-003 | Small | Low |
| 2.3 | Add search input to workspace switcher | E-006 | Medium | Low |
| 2.4 | Add workspace metadata to switcher | — | Medium | Low |
| 2.5 | Add back button for settings sub-pages | IA-005 | Small | Low |
| 2.6 | Create reusable SearchInput component | — | Small | Low |
| 2.7 | Add Socket.IO connection status indicator | — | Small | Low |

### Entry Criteria
- [ ] Phase 1 complete
- [ ] Switch RTL fixed

### Exit Criteria
- [ ] Mobile sidebar includes workspace switcher
- [ ] Workspace switching navigates to /overview
- [ ] Switcher has search input for filtering by name
- [ ] Switcher shows workspace metadata (plan, screen count)
- [ ] Settings sub-pages show back button to settings root
- [ ] SearchInput component is reusable
- [ ] Header shows Socket.IO connection status (dot indicator)

### Verification
- E2E test: mobile workspace switching
- E2E test: workspace switch navigates to /overview
- Unit test: SearchInput component
- Manual test: settings sub-page back button
- Manual test: Socket.IO disconnect/reconnect indicator

---

## Phase 3: Information Architecture

### Duration: 2-3 weeks

### Objective
Restructure sidebar from 18 flat items to grouped categories. Reposition Branches and Studio.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 3.1 | Design sidebar grouping structure | IA-001 | Medium | — |
| 3.2 | Implement sidebar grouping | IA-001 | Medium | Medium |
| 3.3 | Unify client and admin nav patterns | IA-002 | Small | Low |
| 3.4 | Remove Studio from top-level nav | — | Small | Low |
| 3.5 | Move Branches to filter within Screens | — | Medium | Medium |
| 3.6 | Group API Docs/Keys under "Developer" | — | Small | Low |
| 3.7 | Resolve icon duplication | TD-003 | Small | Low |
| 3.8 | Create reusable FilterBar component | — | Medium | Low |

### Entry Criteria
- [ ] Phase 2 complete
- [ ] Navigation system functional

### Exit Criteria
- [ ] Sidebar has 4-5 grouped categories, max 5 items per group
- [ ] Studio accessed via playlist edit action, not top-level nav
- [ ] Branches accessible as filter within Screens page
- [ ] API Docs/Keys grouped under "Developer" section
- [ ] Client and admin nav use same grouping pattern
- [ ] No duplicate icons in navigation
- [ ] FilterBar component is reusable

### Verification
- E2E test: navigate to each grouped section
- E2E test: edit playlist opens Studio (not nav)
- E2E test: filter screens by branch
- Unit test: FilterBar component
- Manual test: admin nav consistency with client nav
- User feedback: monitor for navigation confusion (2-week observation)

---

## Phase 4: Dashboard

### Duration: 3-4 weeks

### Objective
Redesign dashboard as a command center with acting quick actions, screen health summary, and consistent loading.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 4.1 | Add screen health summary count | — | Small | Low |
| 4.2 | Standardize dashboard loading to skeleton | TD-001 | Small | Low |
| 4.3 | Create AddScreenDialog | IA-004 | Medium | Low |
| 4.4 | Create UploadMediaDialog | IA-004 | Medium | Low |
| 4.5 | Create CreatePlaylistDialog | IA-004 | Medium | Low |
| 4.6 | Convert quick actions to open dialogs | IA-004 | Medium | Low |
| 4.7 | Add onboarding skip option | — | Small | Low |
| 4.8 | Add onboarding progress indicator | — | Small | Low |
| 4.9 | Add inline upgrade prompts | — | Medium | Low |
| 4.10 | Add "last updated" timestamp | — | Small | Low |
| 4.11 | Create Pagination component | — | Medium | Low |

### Entry Criteria
- [ ] Phase 3 complete
- [ ] Sidebar grouping done

### Exit Criteria
- [ ] Dashboard shows "X of Y screens online" summary
- [ ] Dashboard uses skeleton loading
- [ ] Quick actions open dialogs (add screen, upload media, create playlist)
- [ ] Onboarding wizard can be skipped
- [ ] Onboarding wizard shows progress indicator
- [ ] Upgrade prompts appear when approaching limits
- [ ] Dashboard shows data freshness timestamp
- [ ] Pagination component is reusable

### Verification
- E2E test: quick action opens dialog
- E2E test: onboarding skip works
- Unit test: Pagination component
- Manual test: screen health summary accuracy
- Manual test: upgrade prompt appears at 80% limit

---

## Phase 5: Content (Media Library)

### Duration: 4-5 weeks (parallel with Phase 6)

### Objective
Transform media library into professional asset management.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 5.1 | Add multi-file upload | E-004 | Medium | Low |
| 5.2 | Add drag-and-drop upload | — | Medium | Low |
| 5.3 | Add upload progress bar | — | Medium | Low |
| 5.4 | Create ProgressBar component | — | Small | Low |
| 5.5 | Add media preview (thumbnail/video) | — | Medium | Low |
| 5.6 | Add bulk media selection + delete | E-004 | Medium | Medium |
| 5.7 | Add storage usage indicator | — | Small | Low |
| 5.8 | Add proactive storage limit warning | — | Small | Low |
| 5.9 | Add media search/filter/sort | F-HP-03 | Medium | Low |

### Entry Criteria
- [ ] Phase 4 complete
- [ ] ProgressBar, SearchInput, FilterBar components available
- [ ] Backend multi-upload endpoint ready

### Exit Criteria
- [ ] Users can upload multiple files simultaneously
- [ ] Upload shows per-file progress bar
- [ ] Drag-and-drop works
- [ ] Media grid shows thumbnails and video previews
- [ ] Users can select and delete multiple media items
- [ ] Storage usage visible with proactive warnings at 80%
- [ ] Media can be searched, filtered by type, and sorted

### Verification
- E2E test: multi-file upload
- E2E test: bulk select and delete
- Unit test: ProgressBar component
- Manual test: drag-and-drop
- Manual test: storage warning at 80%

---

## Phase 6: Screens

### Duration: 3-4 weeks (parallel with Phase 5)

### Objective
Transform screen list into professional fleet management.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 6.1 | Add screen search by name | F-HP-03 | Medium | Low |
| 6.2 | Add screen filter (branch, status) | F-HP-03 | Medium | Low |
| 6.3 | Add screen sort | — | Small | Low |
| 6.4 | Add bulk screen selection | E-004 | Medium | Medium |
| 6.5 | Create BulkActionBar component | — | Medium | Low |
| 6.6 | Add bulk playlist assignment | E-004 | Large | Medium |
| 6.7 | Add bulk screen delete | E-004 | Medium | Low |
| 6.8 | Add screen grouping/folders | — | Large | Medium |
| 6.9 | Enhance screen detail page | — | Medium | Low |

### Entry Criteria
- [ ] Phase 4 complete
- [ ] SearchInput, FilterBar components available
- [ ] Backend bulk API endpoints ready

### Exit Criteria
- [ ] Users can search screens by name
- [ ] Users can filter by branch and status
- [ ] Users can sort by name, status, last seen
- [ ] Users can select multiple screens for bulk actions
- [ ] BulkActionBar component is reusable
- [ ] Users can bulk-assign playlists and bulk-delete screens
- [ ] Screens can be grouped into folders
- [ ] Screen detail page shows enhanced information

### Verification
- E2E test: search and filter screens
- E2E test: bulk select, assign playlist, delete
- Unit test: BulkActionBar component
- Manual test: screen grouping

---

## Phase 7: Playlists

### Duration: 4-5 weeks

### Objective
Improve playlist creation with templates, auto-save, versioning, and publish confirmation.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 7.1 | Add playlist templates library | — | Large | Medium |
| 7.2 | Add auto-save in Studio | — | Medium | Medium |
| 7.3 | Add alignment guides in Studio | — | Medium | Low |
| 7.4 | Add snap-to-grid in Studio | — | Medium | Low |
| 7.5 | Add playlist version history | — | Large | Medium |
| 7.6 | Add publish confirmation dialog | — | Small | Low |
| 7.7 | Add "publishing to X screens" feedback | — | Medium | Low |

### Entry Criteria
- [ ] Phase 5 complete (media for templates)
- [ ] Phase 6 complete (screens for publish targets)
- [ ] Backend versioning API ready (for 7.5)

### Exit Criteria
- [ ] Users can start from pre-built templates
- [ ] Studio auto-saves changes periodically
- [ ] Studio shows alignment guides and snap-to-grid
- [ ] Users can view and revert to previous versions
- [ ] Publish shows confirmation with target screen count
- [ ] Publish success shows "Content playing on X screens"

### Verification
- E2E test: create playlist from template
- E2E test: auto-save indicator
- Manual test: alignment guides and snap-to-grid
- E2E test: version history view and revert
- E2E test: publish confirmation flow

### Risk Note
Do NOT refactor Studio architecture. Only add features. (R-11)

---

## Phase 8: Schedules

### Duration: 3-4 weeks

### Objective
Add timezone support, conflict detection, and calendar improvements.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 8.1 | Add timezone selection in schedule form | E-005 | Large | High |
| 8.2 | Add timezone display in calendar | — | Medium | Medium |
| 8.3 | Add schedule conflict detection | — | Medium | Low |
| 8.4 | Add conflict warning in create dialog | — | Medium | Low |
| 8.5 | Add overlap visualization on calendar | — | Medium | Medium |
| 8.6 | Add drag-to-reschedule | — | Large | Medium |

### Entry Criteria
- [ ] Phase 7 complete
- [ ] Backend timezone support ready

### Exit Criteria
- [ ] Schedules can be created with explicit timezone
- [ ] Calendar displays times in user's local timezone
- [ ] Conflict detection warns about overlapping schedules
- [ ] Calendar visually shows overlapping schedules
- [ ] Users can drag schedules to reschedule

### Verification
- E2E test: create schedule with timezone
- E2E test: conflict detection warning
- Manual test: timezone conversion display
- Manual test: drag-to-reschedule

---

## Phase 9: Settings (Enterprise)

### Duration: 3-4 weeks (parallel with Phases 5-8)

### Objective
Add enterprise features — SSO, custom roles, audit log, billing.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 9.1 | Add SSO/SAML login flow | E-001 | XL | High |
| 9.2 | Add SSO configuration in settings | — | Large | Medium |
| 9.3 | Add custom role creation UI | E-003 | Large | High |
| 9.4 | Add granular permission selection | E-003 | XL | High |
| 9.5 | Add team role change | — | Medium | Medium |
| 9.6 | Add team member removal | — | Medium | Low |
| 9.7 | Add cancel/resend invite | — | Small | Low |
| 9.8 | Add audit log viewer | E-002 | Large | Medium |
| 9.9 | Add impersonation audit trail | — | Medium | Medium |
| 9.10 | Add billing plan selector | — | Medium | Low |
| 9.11 | Add invoice download | — | Medium | Low |
| 9.12 | Add payment method management | — | Medium | Low |

### Entry Criteria
- [ ] Phase 2 complete (navigation)
- [ ] Backend SSO, RBAC, audit, billing APIs ready

### Exit Criteria
- [ ] Users can authenticate via SSO
- [ ] Workspace owners can create custom roles
- [ ] Roles have granular permissions
- [ ] Team members can be role-changed and removed
- [ ] Invites can be cancelled and resent
- [ ] Admin actions are logged and viewable
- [ ] Impersonation is audited
- [ ] Users can compare and select plans
- [ ] Users can download invoices
- [ ] Users can manage payment methods

### Verification
- E2E test: SSO login flow
- E2E test: create custom role, assign to member
- E2E test: team member removal
- E2E test: audit log viewer
- Manual test: plan selection and upgrade
- Manual test: invoice download

### Risk Mitigation
- R-09 (Custom roles): Comprehensive permission tests + feature flag
- R-08 (SSO): Password auth fallback + feature flag
- R-10 (Timezone): Migration script + verification (in Phase 8)

---

## Phase 10: Polish

### Duration: 2-3 weeks

### Objective
Accessibility, performance, testing, documentation, and final consistency.

### Tasks

| ID | Task | Problem | Complexity | Risk |
|----|------|---------|------------|------|
| 10.1 | Add critical path unit tests | TD-007 | Large | Low |
| 10.2 | Add E2E tests for primary flows | — | Large | Low |
| 10.3 | Add RTL-specific tests | — | Medium | Low |
| 10.4 | Add pluralization support | I-001 | Small | Low |
| 10.5 | Add Eastern Arabic numerals | I-002 | Small | Low |
| 10.6 | Standardize responsive grid patterns | C-004 | Medium | Low |
| 10.7 | Add notification persistence | — | Small | Low |
| 10.8 | Add notification grouping | — | Medium | Low |
| 10.9 | Add notification sound | — | Small | Low |
| 10.10 | Add analytics export | — | Medium | Low |
| 10.11 | Add analytics custom date range | — | Medium | Low |
| 10.12 | Document design system | — | Medium | Low |
| 10.13 | Create component creation checklist | — | Small | Low |
| 10.14 | Performance audit and optimization | — | Medium | Low |

### Entry Criteria
- [ ] All other phases complete

### Exit Criteria
- [ ] Critical paths have unit test coverage (auth, workspace, API error handling)
- [ ] E2E tests cover: login, onboarding, screen pairing, playlist creation, scheduling
- [ ] RTL tests verify Arabic mode for all critical paths
- [ ] All count-based strings use pluralization
- [ ] Responsive grids consistent across features
- [ ] Notifications persist across page refresh
- [ ] Notifications grouped by type
- [ ] Analytics can be exported as CSV/PDF
- [ ] Analytics supports custom date ranges
- [ ] Design system fully documented
- [ ] Component creation checklist created
- [ ] Performance audit complete

### Verification
- `npm test` — all unit tests pass
- `npx playwright test` — all E2E tests pass
- Lighthouse audit — performance score ≥ 90
- axe-core audit — 0 critical violations
- Manual test: all features in LTR + RTL

---

## Cross-References

- See `19-redesign-roadmap.md` for roadmap overview
- See `18-dependency-map.md` for dependency graph
- See `17-risk-analysis.md` for risk assessment
- See `21-success-metrics.md` for success metrics per phase
