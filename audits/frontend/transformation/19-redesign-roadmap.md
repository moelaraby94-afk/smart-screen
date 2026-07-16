# Redesign Roadmap

> **Evidence basis:** All transformation documents, `18-dependency-map.md`, `08-feature-priorities.md`, `07-screen-priorities.md`
> **Purpose:** Detailed roadmap with phase-by-phase breakdown

---

## 1. Roadmap Overview

| Phase | Focus | Duration | Dependencies | Risk |
|-------|-------|----------|--------------|------|
| Phase 0 | Preparation | 1-2 weeks | None | Low |
| Phase 1 | Foundation | 2-3 weeks | Phase 0 | Low |
| Phase 2 | Navigation | 2-3 weeks | Phase 1 | Medium |
| Phase 3 | Information Architecture | 2-3 weeks | Phase 2 | Medium |
| Phase 4 | Dashboard | 3-4 weeks | Phase 3 | Medium |
| Phase 5 | Content | 4-5 weeks | Phase 4 | Medium |
| Phase 6 | Screens | 3-4 weeks | Phase 4 | Medium |
| Phase 7 | Playlists | 4-5 weeks | Phase 5 | High |
| Phase 8 | Schedules | 3-4 weeks | Phase 6, 7 | High |
| Phase 9 | Settings | 3-4 weeks | Phase 2 (parallel) | High |
| Phase 10 | Polish | 2-3 weeks | All phases | Low |

**Total: 29-40 weeks (7-10 months)**
**Critical path: 20-28 weeks**

---

## 2. Phase 0: Preparation

### Goal
Finalize audit, inventory components, plan implementation, set up testing infrastructure.

### Tasks

| Task | Description | Output |
|------|-------------|--------|
| Audit finalization | Review all V2 audit files, confirm problem list | Finalized problem catalog |
| Component inventory | Catalog all components, identify gaps | Component inventory document |
| Test infrastructure | Set up Vitest configuration, add test utilities | Working test runner |
| Design system audit | Document current token usage, identify inconsistencies | Token audit document |
| Backend API review | Identify which features need backend changes | Backend dependency list |
| Stakeholder alignment | Review roadmap with stakeholders, get buy-in | Approved roadmap |

### Entry Criteria
- V2 audit complete ✅
- Transformation blueprint complete ✅

### Exit Criteria
- Problem catalog finalized
- Component inventory documented
- Test infrastructure operational
- Backend dependency list communicated to backend team
- Roadmap approved by stakeholders

---

## 3. Phase 1: Foundation

### Goal
Fix all critical defects that affect every user interaction. Standardize foundational patterns.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Fix Switch RTL bug | P-001 | Small | Critical |
| Fix sidebar click guards | P-003 | Small | High |
| Fix back button labels | P-004 | Small | High |
| Install @radix-ui/react-tooltip | — | Small | High |
| Replace InfoTooltip with Radix Tooltip | P-005 | Medium | High |
| Standardize loading states | TD-001 | Medium | High |
| Fix Socket.IO transport fallback | TD-006 | Small | High |
| Fix hasSuccessfulMeRef | TD-005 | Small | Medium |
| Unify icon stroke width | TD-002 | Small | Medium |
| Remove or render AuroraBackdrop | TD-004 | Small | Low |
| Fix color contrast (WCAG AA) | A-004 | Small | High |
| Fix button touch targets (44px) | A-002 | Small | High |
| Add password visibility toggle | — | Small | Medium |
| Add email field type correction | — | Small | Low |
| Add resend code cooldown | — | Small | Low |
| Add registration progress indicator | — | Small | Medium |
| Add logout success toast | — | Small | Low |

### Entry Criteria
- Phase 0 complete
- Test infrastructure operational

### Exit Criteria
- Switch works correctly in RTL
- Click guards prevent navigation and show toasts
- All back button labels match destinations
- InfoTooltip replaced with accessible Tooltip
- All loading states use skeleton (page) or spinner (action)
- Socket.IO has polling fallback
- Auth errors handled properly (no silent swallowing)
- All icons use single stroke width
- Color contrast meets WCAG AA
- Touch targets meet 44px minimum on mobile

### Why First?
These are foundational defects that affect every page and every user. Fixing them first ensures all subsequent work builds on a solid foundation. These fixes are low-risk and high-impact.

---

## 4. Phase 2: Navigation

### Goal
Fix navigation system — mobile workspace switching, switcher improvements, back button coverage.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add workspace switcher to mobile sidebar | P-002 | Medium | Critical |
| Fix workspace switch navigation target | IA-003 | Small | High |
| Add search to workspace switcher | E-006 | Medium | High |
| Add workspace metadata to switcher | — | Medium | Medium |
| Add settings back button | IA-005 | Small | Medium |
| Create SearchInput component | — | Small | High |
| Add Socket.IO connection status indicator | — | Small | Medium |

### Entry Criteria
- Phase 1 complete
- Switch RTL fixed (switcher may use Switch component)

### Exit Criteria
- Mobile users can switch workspaces from sidebar
- Workspace switching navigates to /overview
- Switcher has search input for filtering
- Switcher shows workspace metadata (plan, screen count)
- Settings sub-pages have back buttons
- SearchInput component available for reuse
- Socket.IO connection status visible in header

### Why After Phase 1?
Navigation fixes depend on foundational defects being resolved (click guards, back buttons). The SearchInput component created here will be reused in Phase 6 (screen search).

---

## 5. Phase 3: Information Architecture

### Goal
Restructure sidebar navigation from 18 flat items to grouped categories. Reposition Branches and Studio.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Design sidebar grouping structure | IA-001 | Medium | High |
| Implement sidebar grouping | IA-001 | Medium | High |
| Unify client and admin nav patterns | IA-002 | Small | Medium |
| Remove Studio from top-level nav | — | Small | Medium |
| Move Branches from top-level to filter | — | Medium | Medium |
| Group API Docs/Keys under "Developer" | — | Small | Medium |
| Resolve icon duplication | TD-003 | Small | Low |
| Create FilterBar component | — | Medium | High |

### Entry Criteria
- Phase 2 complete
- Navigation system functional

### Exit Criteria
- Sidebar has 4-5 grouped categories with max 5 items per group
- Studio accessed via playlist edit, not top-level nav
- Branches accessible as filter within Screens
- API Docs/Keys grouped under "Developer" section
- Client and admin nav use same grouping pattern
- No duplicate icons in navigation
- FilterBar component available for reuse

### Why After Phase 2?
Navigation fixes (mobile switcher, back buttons) must be done before restructuring the sidebar. The grouping change is the most disruptive navigation change and should be done after the foundation is solid.

### Risk Mitigation
- Phase the change: group headers first, then collapse, then reorder
- Show "What's new" toast on first visit after change
- Monitor support tickets for navigation confusion

---

## 6. Phase 4: Dashboard

### Goal
Redesign dashboard as a command center — quick actions that act, screen health summary, loading consistency.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add screen health summary count | — | Small | High |
| Standardize dashboard loading (skeleton) | TD-001 | Small | High |
| Create AddScreenDialog | IA-004 | Medium | High |
| Create UploadMediaDialog | IA-004 | Medium | High |
| Create CreatePlaylistDialog | IA-004 | Medium | High |
| Convert quick actions from navigate to act | IA-004 | Medium | High |
| Add onboarding skip option | — | Small | Medium |
| Add onboarding progress indicator | — | Small | Medium |
| Add inline upgrade prompts | — | Medium | Medium |
| Add "last updated" timestamp | — | Small | Low |
| Create Pagination component | — | Medium | Medium |

### Entry Criteria
- Phase 3 complete
- Sidebar grouping done
- Dialog components created

### Exit Criteria
- Dashboard shows "X of Y screens online/offline" summary
- Dashboard uses skeleton loading consistently
- Quick actions open dialogs instead of navigating
- Onboarding wizard can be skipped
- Onboarding wizard shows progress indicator
- Upgrade prompts appear when approaching limits
- Dashboard shows data freshness timestamp
- Pagination component available for reuse

### Why After Phase 3?
Dashboard depends on sidebar grouping (IA-001). Quick actions need dialogs that don't exist yet. The dashboard is the primary landing page — it must be solid before improving feature screens.

---

## 7. Phase 5: Content (Media Library)

### Goal
Transform media library from basic grid to professional asset management with bulk upload and progress.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add multi-file upload | E-004 | Medium | High |
| Add drag-and-drop upload | — | Medium | High |
| Add upload progress bar | — | Medium | High |
| Create ProgressBar component | — | Small | High |
| Add media preview (thumbnail/video) | — | Medium | Medium |
| Add bulk media selection | E-004 | Medium | High |
| Add bulk media delete | E-004 | Medium | High |
| Add storage usage indicator | — | Small | Medium |
| Add proactive storage limit warning | — | Small | Medium |
| Add media search/filter | F-HP-03 | Medium | High |
| Add media sort (name, date, size) | — | Small | Medium |

### Entry Criteria
- Phase 4 complete
- ProgressBar component created
- SearchInput component available (from Phase 2)
- FilterBar component available (from Phase 3)
- Backend multi-upload endpoint ready

### Exit Criteria
- Users can upload multiple files at once
- Upload shows progress bar per file
- Users can drag-and-drop files
- Media grid shows thumbnails/video previews
- Users can select and delete multiple media items
- Storage usage visible with proactive warnings
- Media can be searched, filtered, and sorted

### Parallel With
Phase 6 (Screens) — different developers can work on each.

---

## 8. Phase 6: Screens

### Goal
Transform screen list from basic card grid to professional fleet management with search, filter, and bulk operations.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add screen search by name | F-HP-03 | Medium | High |
| Add screen filter (branch, status) | F-HP-03 | Medium | High |
| Add screen sort (name, status, last seen) | — | Small | Medium |
| Add bulk screen selection | E-004 | Medium | High |
| Create BulkActionBar component | — | Medium | High |
| Add bulk playlist assignment | E-004 | Large | High |
| Add bulk screen delete | E-004 | Medium | High |
| Add screen grouping/folders | — | Large | Medium |
| Enhance screen detail page | — | Medium | Medium |
| Add branch filter within screens | — | Medium | Medium |

### Entry Criteria
- Phase 4 complete
- SearchInput, FilterBar components available
- Backend bulk API endpoints ready

### Exit Criteria
- Users can search screens by name
- Users can filter screens by branch and status
- Users can sort screens by name, status, or last seen
- Users can select multiple screens and perform bulk actions
- BulkActionBar component available for reuse
- Screens can be grouped into folders
- Screen detail page enhanced with more information
- Branch filter works within screens page

### Parallel With
Phase 5 (Content) — different developers can work on each.

---

## 9. Phase 7: Playlists

### Goal
Improve playlist creation experience — templates, auto-save, versioning, publish confirmation.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add playlist templates library | — | Large | Medium |
| Add auto-save in Studio | — | Medium | Medium |
| Add alignment guides in Studio | — | Medium | Medium |
| Add snap-to-grid in Studio | — | Medium | Medium |
| Add playlist version history | — | Large | Medium |
| Add publish confirmation dialog | — | Small | Medium |
| Add "publishing to X screens" feedback | — | Medium | Medium |
| Add playlist duplication improvement | — | Small | Low |

### Entry Criteria
- Phase 5 complete (media library for templates)
- Phase 6 complete (screens for publish targets)

### Exit Criteria
- Users can start from pre-built templates
- Studio auto-saves changes
- Studio shows alignment guides and snap-to-grid
- Users can view and revert to previous playlist versions
- Publish shows confirmation dialog with target screen count
- Publish success shows "Content is now playing on X screens"

### Risk Note
Do NOT refactor Studio architecture (R-11). Only add features. Architectural refactoring is a separate future project.

---

## 10. Phase 8: Schedules

### Goal
Add timezone support, conflict detection, and calendar improvements.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add timezone selection in schedule form | E-005 | Large | High |
| Add timezone display in calendar | — | Medium | High |
| Add schedule conflict detection | — | Medium | High |
| Add conflict warning in create dialog | — | Medium | High |
| Add overlap visualization on calendar | — | Medium | Medium |
| Add drag-to-reschedule | — | Large | Medium |
| Add timeline view (alternative to calendar) | — | Large | Low |

### Entry Criteria
- Phase 7 complete
- Backend timezone support ready

### Exit Criteria
- Schedules can be created with explicit timezone
- Calendar displays times in user's local timezone
- Conflict detection warns when scheduling overlapping content
- Calendar shows overlapping schedules visually
- Users can drag schedules to reschedule
- Timeline view available as alternative to calendar

---

## 11. Phase 9: Settings (Enterprise)

### Goal
Add enterprise features — SSO, custom roles, audit log, billing improvements.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add SSO/SAML login flow | E-001 | XL | High |
| Add SSO configuration in settings | — | Large | High |
| Add custom role creation UI | E-003 | Large | High |
| Add granular permission selection | E-003 | XL | High |
| Add team role change | — | Medium | High |
| Add team member removal | — | Medium | High |
| Add cancel/resend invite | — | Small | High |
| Add audit log viewer | E-002 | Large | High |
| Add impersonation audit trail | — | Medium | High |
| Add billing plan selector | — | Medium | Medium |
| Add invoice download | — | Medium | Medium |
| Add payment method management | — | Medium | Medium |
| Add 2FA disable password re-entry | — | Small | Low |

### Entry Criteria
- Phase 2 complete (navigation)
- Backend SSO, RBAC, audit, billing APIs ready

### Exit Criteria
- Users can authenticate via SSO
- Workspace owners can create custom roles with granular permissions
- Team members can have roles changed, be removed, invites cancelled/resent
- Admin actions (including impersonation) are logged and viewable
- Users can compare and select billing plans
- Users can download invoices and manage payment methods

### Parallel With
Phases 5-8 — backend work can proceed in parallel with frontend feature work.

---

## 12. Phase 10: Polish

### Goal
Accessibility, performance, testing, documentation, and final consistency pass.

### Tasks

| Task | Problem ID | Complexity | Priority |
|------|-----------|------------|----------|
| Add critical path unit tests | TD-007 | Large | High |
| Add E2E tests for primary flows | — | Large | High |
| Add RTL-specific tests | — | Medium | High |
| Add pluralization support | I-001 | Small | Low |
| Add Eastern Arabic numerals | I-002 | Small | Low |
| Standardize responsive grid patterns | C-004 | Medium | Low |
| Add notification persistence (localStorage) | — | Small | Medium |
| Add notification grouping | — | Medium | Medium |
| Add notification sound | — | Small | Low |
| Add logout confirmation | — | Small | Low |
| Add analytics export (CSV/PDF) | — | Medium | Medium |
| Add analytics custom date range | — | Medium | Medium |
| Document design system | — | Medium | High |
| Create component creation checklist | — | Small | Medium |
| Performance audit and optimization | — | Medium | Medium |

### Entry Criteria
- All other phases complete

### Exit Criteria
- Critical paths have unit test coverage
- E2E tests cover primary flows
- RTL tests verify Arabic mode
- All count-based strings use pluralization
- Responsive grids are consistent across features
- Notifications persist across page refreshes
- Design system is fully documented
- Performance audit complete with optimizations

---

## 13. Roadmap Visual Summary

```
Week 1-2:   Phase 0 (Preparation)
Week 3-5:   Phase 1 (Foundation)
Week 6-8:   Phase 2 (Navigation)
Week 9-11:  Phase 3 (Information Architecture)
Week 12-15: Phase 4 (Dashboard)
Week 16-20: Phase 5 (Content) ──┐
Week 16-19: Phase 6 (Screens) ──┤ (parallel)
Week 21-25: Phase 7 (Playlists)
Week 26-29: Phase 8 (Schedules)
Week 9-25:  Phase 9 (Settings) ── (parallel, backend-dependent)
Week 30-32: Phase 10 (Polish)
```

**Total: ~32 weeks (8 months) with parallelization**

---

## Cross-References

- See `18-dependency-map.md` for detailed dependency graph
- See `20-implementation-phases.md` for phase execution plans with entry/exit criteria
- See `17-risk-analysis.md` for risk assessment per phase
- See `21-success-metrics.md` for success criteria per phase
