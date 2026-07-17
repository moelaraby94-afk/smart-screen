# Compliance Roadmap & Reference

> **MANDATORY:** Read this file before starting ANY task. Every implementation must be traceable to project documentation. No assumptions. No invented features. No undocumented behavior.

---

## 1. Permanent Execution Rules

1. **Documentation First** — Read every relevant spec, UX blueprint, user flow, design system, execution plan, current implementation, APIs/hooks, translations, and reusable components BEFORE coding.
2. **Gap Analysis First** — Produce complete gap analysis (already implemented, missing, priority, doc reference, compliance %) before touching code.
3. **Priority Order** — UX > User Flow > Business Logic > Component Behavior > Accessibility > Responsive > Performance > Visual Polish. Never reverse.
4. **No Visual-Only Refactoring** — Don't waste time on rounded-xl/2xl, text-[xx], tracking-[xx], spacing unless explicitly required by docs.
5. **Complete Feature** — Screen is NOT complete until: UX, user flow, business logic, empty/loading/error states, accessibility, responsive, realtime, permissions, keyboard, performance are all implemented.
6. **Self Audit Before Reporting** — Compare documentation vs implementation. Produce: implemented, missing, compliance %.
7. **Build Verification** — Must run TypeScript, Lint, Build before claiming completion.
8. **Finish One Screen Completely** — Gap Analysis → Complete Screen → Build → Self Audit → Next Screen. Never partially implement multiple screens.
9. **Reuse Existing Components** — Search codebase first. Never duplicate.
10. **Don't Invent Features** — Everything from documentation. If docs don't mention it, don't add it.
11. **No Assumptions** — If documentation is unclear, stop. Explain the ambiguity. List conflicting documents. Ask for clarification.
12. **Completion Definition** — Task is COMPLETE only when: compliance >=95%, UX matches docs, no missing critical flow, build passes, TS passes, lint passes, self audit completed, compliance report generated.

---

## 2. Documentation Hierarchy (Priority Order)

If documents conflict, higher priority wins. Report conflicts explicitly. Never guess.

| Priority | Source | Location |
|----------|--------|----------|
| 1 | Execution Plan | `docs/EXECUTION_PLAN.md` |
| 2 | Screen Specifications | `audits/frontend/screen-specifications/` |
| 3 | UX Blueprint | `audits/frontend/ux-blueprint/` |
| 4 | Component Specifications | `audits/frontend/component-specifications/` (if exists) |
| 5 | Design System V2 | `audits/frontend/design-system-v2/` |
| 6 | Audit Reports | `audits/frontend/FRONTEND_*.md`, `audits/frontend/FRONTEND_GAP_ANALYSIS.md` |
| 7 | Product Architecture | `audits/frontend/product-architecture/` |
| 8 | Information Architecture | `audits/frontend/information-architecture/` |
| 9 | User Flow Architecture | `audits/frontend/user-flow-architecture/` |
| 10 | Design Decisions | `audits/frontend/transformation/` |
| 11 | Backend Schema | `apps/backend/prisma/schema.prisma` |
| 12 | Backend Controllers | `apps/backend/src/domains/` |
| 13 | Current Implementation | `apps/dashboard/src/` |
| 14 | Translations | `apps/dashboard/src/i18n/messages/en.json`, `ar.json` |

---

## 3. Key Documentation Files

### Screen Specifications
- `01-global-layout-spec.md` — App shell, sidebar, header, breadcrumbs
- `02-auth-error-specs.md` — Login, register, forgot, invite, error pages
- `03-overview-spec.md` — Overview/dashboard
- `04-screens-specs.md` — Screens list, detail, pairing
- `05-content-specs.md` — Playlists, media, content tabs
- `06-studio-spec.md` — Studio (Canvas Editor)
- `07-scheduling-analytics-specs.md` — Scheduling, analytics
- `08-team-spec.md` — Team management
- `09-settings-specs-part1.md` — Settings (profile, workspace, branding)
- `10-settings-specs-part2.md` — Settings (billing, API, security, notifications)
- `11-notifications-admin-specs-part1.md` — Notifications
- `12-admin-specs-part2.md` — Admin panel
- `13-shared-dialogs-specs.md` — Shared dialogs (template picker, quick publish, etc.)
- `14-screen-specifications-summary.md` — Summary

### UX Blueprint
- `01-ux-principles.md` — Core UX principles
- `02-state-guidelines.md` — Loading, error, empty, skeleton states
- `03-component-ux-standards.md` — Component UX rules
- `04-feature-ux-standards.md` — Feature-level UX rules
- `05-page-type-ux-rules.md` — List, detail, editor page types
- `06-auth-ux-blueprint.md` — Auth UX
- `07-overview-ux-blueprint.md` — Overview UX
- `08-screens-ux-blueprint.md` — Screens UX
- `09-content-studio-ux-blueprint.md` — Content + Studio UX
- `10-scheduling-analytics-team-ux-blueprint.md` — Scheduling, analytics, team
- `11-settings-ux-blueprint-part1.md` — Settings UX part 1
- `12-settings-ux-blueprint-part2.md` — Settings UX part 2
- `13-settings-ux-blueprint-part3.md` — Settings UX part 3
- `14-notifications-ux-blueprint.md` — Notifications UX
- `15-admin-ux-blueprint-part1.md` — Admin UX part 1
- `16-admin-ux-blueprint-part2.md` — Admin UX part 2
- `17-ux-blueprint-summary.md` — Summary

### Design System V2
- `01-foundations.md` — Color tokens, typography, spacing
- `04-breakpoints.md` — Breakpoints + responsive behavior per screen
- `23-drawer-standards.md` — Drawer component standards
- `38-responsive-rules.md` — Responsive rules per component
- (50 total files in `design-system-v2/`)

### Product Architecture
- `02-core-product-entities.md` — Workspace, Screen, Playlist, Canvas, Media entities
- `09-product-modules.md` — M-01 through M-08 module definitions
- `16-navigation-principles.md` — Route table, back button rules, breadcrumbs
- `17-product-rules.md` — Product rules (PR-XX)

### Design Decisions
- `24-design-decisions.md` — DD-02: Remove Studio from sidebar (Phase 3), DD-03: Branch in Screens, DD-04: Overview as landing

### Audit Reports
- `FRONTEND_GAP_ANALYSIS.md` — All gaps with severity, priority, effort
- `FRONTEND_AUDIT_03_SCREEN_BY_SCREEN.md` — Screen-by-screen issues
- `FRONTEND_AUDIT_06_RESPONSIVE.md` — Responsive issues
- `FRONTEND_AUDIT_09_CONSISTENCY_FEATURES.md` — Priority roadmap (P1-P2)
- `24-accessibility-audit.md` — Accessibility gaps
- `25-responsive-audit.md` — Responsive audit

---

## 4. Reusable Components

| Component | Import Path | Notes |
|-----------|-------------|-------|
| Button | `@/components/ui/button` | Variants: default, outline, cta, destructive, ghost, secondary |
| Input | `@/components/ui/input` | |
| Label | `@/components/ui/label` | |
| Skeleton | `@/components/ui/skeleton` | |
| AlertDialog | `@/components/ui/alert-dialog` | + sub-components |
| Dialog | `@/components/ui/dialog` | + sub-components |
| DropdownMenu | `@/components/ui/dropdown-menu` | + sub-components |
| Tabs | `@/components/ui/tabs` | Tabs, TabsList, TabsTrigger, TabsContent |
| apiFetch | `@/features/auth/session` | Authenticated fetch |
| getStoredAccessToken | `@/features/auth/session` | |
| readPageItems | `@/features/api/page` | Paginated response helper |
| useWorkspace | `@/features/workspace/workspace-context` | Current workspace |
| ScreenFleetStatusBadge | `@/features/screens/screen-fleet-status` | |
| deriveFleetReachability | `@/features/screens/screen-fleet-status` | |
| formatLastSeenRelative | `@/features/screens/screen-fleet-status` | |
| useScreenActivePreview | `@/features/screens/use-screen-active-preview` | |
| fetchSchedules | `@/features/schedules/api/schedules-api` | |
| createSchedule | `@/features/schedules/api/schedules-api` | |

---

## 5. Current Project Status

### Completed
- Phase 1: Application Shell (~97%)
- Phase 4.1: Content Templates (~98%)
- Phase 7: Billing & API (Tasks 7.1-7.4)
- RS-01: Studio tablet responsive layout (100%)
- Studio Spec Fixes: 6 unblocked violations fixed + dead code removed (~89% overall)

### Studio Audit Results
- RS-01 (Responsive): 100% compliant
- Overall Studio compliance (non-DD-02): ~89% (up from ~78%)
- 6 spec violations fixed: canvas bg, canvas padding, panel padding, timeline height, click-to-add, splash screen
- StudioMediaStrip dead code removed
- Documentation updated: API section in 06-studio-spec.md, RS-01 in FRONTEND_GAP_ANALYSIS.md
- 8 items blocked by DD-02 (Phase 3): route, shell, toolbar, back button, sidebar, breadcrumbs, header, viewer redirect
- 1 documentation conflict resolved: API endpoint spec updated to match backend

---

## 6. Execution Roadmap

### Immediate (Unblocked Studio Spec Fixes) — ✅ COMPLETED
1. ~~Canvas background → `bg-neutral-900` (spec: `06-studio-spec.md:117`)~~ ✅
2. ~~Canvas padding → `p-8` (spec: `06-studio-spec.md:90`)~~ ✅
3. ~~Properties panel → `p-3` (spec: `06-studio-spec.md:89`)~~ ✅
4. ~~Timeline → 60px fixed height (spec: `06-studio-spec.md:77,136`)~~ ✅
5. ~~Media click-to-add → onClick handler (spec: `06-studio-spec.md:109,312`)~~ ✅
6. ~~Splash screen → logo + `bg-neutral-900` + fade (spec: `06-studio-spec.md:264-266`)~~ ✅
7. ~~Delete `StudioMediaStrip` dead code (`studio-panels.tsx:610-658`)~~ ✅
8. ~~Update outdated docs (spec API section, gap analysis RS-01)~~ ✅

### Phase 2: Team Management ✅
- **Frontend:** Team list UI, invite dialog, role change, remove/cancel/resend
- **Backend:** Verify cancel/resend invite endpoints exist ✅
- **Docs:** `08-team-spec.md`, `10-scheduling-analytics-team-ux-blueprint.md`, `12-team-flows.md`
- **Implemented:**
  1. ✅ Layout: `max-w-[1000px] mx-auto`, `flex flex-col gap-6` per spec
  2. ✅ Page header: "Team" h2 + member count + "Invite Member" button (Owner only)
  3. ✅ Pending invites: separate section with "Pending Invitations (N)" header
  4. ✅ Active members: separate section with "Active Members (N)" header
  5. ✅ Avatars: 32px round with initials (both workspace + account members)
  6. ✅ Invite Dialog: Radix Dialog component, email validation on blur, inline errors (409 → "already invited")
  7. ✅ Permissions: Owner-only actions (invite, role change, remove, cancel/resend) hidden for non-owners
  8. ✅ Self-removal prevention: current user cannot remove self or change own role
  9. ✅ Error state: members load failure shows error + retry button
  10. ✅ Accessibility: `role="region"` + `aria-label` on sections, `role="list"`/`role="listitem"` on lists, `aria-label` on all action buttons, `aria-invalid` on email input
  11. ✅ Responsive: stacked rows on mobile (`flex-col` → `sm:flex-row`)
  12. ✅ Touch targets: 44px (h-9 w-9) on all action buttons
  13. ✅ Account members: audited and fixed (permissions, avatars, a11y, password validation, section counts)
  14. ✅ Translations: 17 new keys in en.json + ar.json
- **Compliance:** ~95% (08-team-spec.md), ~97% (UX blueprint P-TM-01)
- **Remaining:** Realtime invite acceptance (Socket.IO) — future scope
- **Audit:** `audits/frontend/ACCOUNT_MEMBERS_AUDIT.md`

### Phase 3: Screen Improvements + DD-02
- **Frontend:** Screen detail, pairing wizard, branch filter, content override
- **Frontend (DD-02):** Remove Studio from sidebar, route migration, full-screen, toolbar, back button
- **Docs:** `04-screens-specs.md`, `08-screens-ux-blueprint.md`, `24-design-decisions.md` DD-02

### Phase 4: Content (Remaining)
- **Task 4.2:** Content Auto-Expiry (Frontend + Backend: `expiresAt` field)
- **Task 4.3:** Playlist Preview Mode (Frontend: preview modal)
- **Task 4.4:** Multi-file Upload (Frontend + Backend)
- **Task 4.5:** Content Version History (Frontend + Backend: `CanvasVersion` model)
- **Docs:** `05-content-specs.md`, `09-content-studio-ux-blueprint.md`, `10-playlist-flows.md`

### Phase 5: Scheduling & Campaigns
- **Frontend:** Campaign workflow UI, conflict detection, calendar improvements
- **Backend:** `Campaign` model + endpoints
- **Docs:** `07-scheduling-analytics-specs.md`, `10-scheduling-analytics-team-ux-blueprint.md`

### Phase 6: Analytics & Proof-of-Play
- **Frontend:** Analytics dashboard, AI insights, proof-of-play reports
- **Backend:** Analytics aggregation, AI insights endpoints
- **Docs:** `07-scheduling-analytics-specs.md`, `10-scheduling-analytics-team-ux-blueprint.md`

### Phase 8: Security & Settings
- **Frontend:** 2FA setup, login with 2FA, session management
- **Backend:** 2FA endpoints, session management
- **Docs:** `09-settings-specs-part1.md`, `10-settings-specs-part2.md`, `11-settings-ux-blueprint-part1.md`

### Phase 9: Admin Panel
- **Frontend:** Customers, users, health, audit log, platform settings
- **Docs:** `12-admin-specs-part2.md`, `15-admin-ux-blueprint-part1.md`, `16-admin-ux-blueprint-part2.md`

### Phase 10: Advanced Features
- **Frontend:** Global search (Ctrl+K), notification preferences, emergency broadcast, remote control, multi-zone layouts
- **Backend:** Remote control endpoints
- **Docs:** `06-studio-spec.md` Future Improvements, `21-search-and-global-actions.md`

### Phase 11: Landing Page + Player (Separate)
- 3D landing page (Three.js)
- Android player (Capacitor)
- Player app enhancements

---

## 7. Per-Task Compliance Checklist

Before starting ANY task, answer:

- [ ] What is the current Execution Plan task?
- [ ] Which documentation defines this task?
- [ ] Which documentation sections are applicable?
- [ ] Which requirements are mandatory?
- [ ] Which requirements belong to future tasks?
- [ ] Which requirements are intentionally out of scope?

After completing ANY task, produce:

- [ ] Implementation Report (files modified, features added, testing results)
- [ ] Compliance Audit Report (compliance %, deviations with source documents)
- [ ] Build passes (TypeScript 0 errors, ESLint 0 errors, build succeeds)
- [ ] Translations added (EN + AR)
- [ ] RTL tested
- [ ] No undocumented behavior introduced
- [ ] No future-phase feature implemented early

---

## 8. Known Documentation Conflicts

| # | Conflict | Documents | Status |
|---|----------|-----------|--------|
| 1 | RS-01: "drawers" vs "narrower panels + warning" | Gap Analysis (L6) vs Screen Spec (L2) + Design System (L5) | ✅ RESOLVED — Gap analysis updated to match spec. Implementation matches spec. |
| 2 | Studio API: `PUT /playlists/{id}` vs `PATCH /canvases/{id}` | Screen Spec (L2) vs Execution Plan (L1) + Backend | ✅ RESOLVED — Spec updated to `PATCH /canvases/{id}`. |
| 3 | Transition property: UX Blueprint mentions it, Screen Spec does not | UX Blueprint (L3) vs Screen Spec (L2) | Per hierarchy, Screen Spec wins. Not required. |

---

## 9. Known Documentation Gaps

| # | Gap | Details |
|---|-----|---------|
| 1 | Zone color specification | No doc specifies zone colors. Zones are "Future" in spec. |
| 2 | QR Code tool | Not in any spec or component inventory. |
| 3 | Arrow tool | Not in spec. SUI-07 mentions rect/circle/line only. |
| 4 | Canvas selector dropdown | No spec mentions selecting between multiple canvases. |
| 5 | Auto-save detailed spec | Spec says "Future" but implementation uses 3s debounce. |
| 6 | Version History (localStorage) | Spec says "No version history (future)". Task 4.5 requires backend. |

---

## 10. Architectural Protection

DO NOT propose or implement unless the CURRENT execution plan explicitly requires:
- Route changes
- Folder restructuring
- Navigation changes
- Backend API changes
- Database changes
- Entity redesign
- URL changes
- Large architectural refactors

If such changes belong to another task, report them. Do NOT implement them.

---

> **This file is the single source of truth for execution discipline. Refer to it before every task.**
