# 34 — Implementation Execution Guide

> **Status:** FINAL — Step-by-step guide for the implementation phase

---

## 1. Purpose

This is the **final document** in the Frontend Execution Governance. It provides the step-by-step guide for transitioning from documentation to implementation. After this, implementation should be almost mechanical.

---

## 2. Pre-Implementation Checklist

Before writing ANY code, verify:

- [ ] `30-final-readiness-checklist.md` — ALL items checked
- [ ] `33-frontend-readiness-score.md` — Score is A+ (100/100)
- [ ] `01-ai-constitution.md` — Read and acknowledged
- [ ] `09-definition-of-ready.md` — Global criteria met
- [ ] Environment setup complete (Next.js, TypeScript, Tailwind, all dependencies)
- [ ] Folder structure created per `27-folder-ownership.md`
- [ ] User approval obtained

---

## 3. Implementation Execution Steps

### Step 1: Foundation (Phase 0)

**What:** Set up the project foundation — tokens, Tailwind, i18n, RTL, dark mode, data fetching.

**Documents to read:**
- `design-system-v2/44-design-tokens.md` (all tokens)
- `design-system-v2/01-foundations.md` (token explanations)
- `design-system-v2/39-rtl-rules.md` (RTL setup)
- `product-architecture/17-product-rules.md` PR-50 (i18n requirement)

**Tasks:**
1. Create `globals.css` with all CSS custom properties (tokens)
2. Configure `tailwind.config.ts` with token mapping (per `44-design-tokens.md` §13)
3. Set up `next-intl` with EN + AR locale files
4. Configure RTL (`dir` attribute based on locale)
5. Configure dark mode (`.dark` class strategy)
6. Create `src/lib/api-client.ts` (centralized fetcher)
7. Create `src/lib/socket-client.ts` (Socket.IO client)
8. Create folder structure per `27-folder-ownership.md`

**Verification:**
- [ ] Tokens render correctly (inspect CSS variables in DevTools)
- [ ] Tailwind classes map to tokens (`bg-primary` → `var(--color-primary)`)
- [ ] Language switching works (EN ↔ AR)
- [ ] RTL layout mirrors correctly
- [ ] Dark mode toggles correctly
- [ ] API client can make authenticated requests

### Step 2: Primitive Components (Phase 1)

**What:** Implement all 15 primitive components.

**Documents to read (per component):**
- `design-system-v2/[component-spec].md`
- `design-system-v2/44-design-tokens.md` (tokens used)
- `design-system-v2/09-interaction-states.md` (states)
- `design-system-v2/10-accessibility-rules.md` (accessibility)
- `13-component-creation-rules.md` (creation process)

**Tasks (in order):**
1. Button → 2. Input → 3. Textarea → 4. PasswordInput → 5. Checkbox → 6. Toggle → 7. Select → 8. Badge → 9. Avatar → 10. Spinner → 11. Skeleton → 12. ProgressBar → 13. Label → 14. Separator

**Per-component verification:**
- [ ] All variants render
- [ ] All sizes render
- [ ] All states render (default, hover, focus, active, disabled)
- [ ] Accessibility: keyboard, ARIA, focus ring
- [ ] Responsive: works at all breakpoints
- [ ] RTL: mirrors correctly
- [ ] Dark mode: switches correctly
- [ ] Unit tests pass
- [ ] No hardcoded values

### Step 3: Composite Components (Phase 2)

**What:** Implement all 21 composite components.

**Documents to read (per component):**
- `design-system-v2/[component-spec].md`
- `design-system-v2/42-variant-rules.md`
- `design-system-v2/43-composition-rules.md`

**Tasks (in order):**
1. Card → 2. FormField → 3. FormActions → 4. Table → 5. List → 6. Dialog → 7. AlertDialog → 8. Drawer → 9. Toast → 10. Tabs → 11. Breadcrumbs → 12. Pagination → 13. StepIndicator → 14. SearchInput → 15. FilterSelect → 16. SortSelect → 17. FilterToolbar → 18. EmptyState → 19. ErrorState → 20. DatePicker → 21. EditableText

**Per-component verification:** Same as Step 2 + composition rules verified.

### Step 4: App Shell & Navigation (Phase 3)

**What:** Implement sidebar, header, notification bell, user menu, workspace switcher, app shell layout.

**Documents to read:**
- `screen-specifications/01-global-layout-spec.md`
- `design-system-v2/25-navigation-components.md`
- `design-system-v2/03-layout-system.md`
- `information-architecture/05-navigation-architecture.md`

**Tasks:**
1. Sidebar (with collapsed/expanded states)
2. Header (with search, bell, user menu)
3. NotificationBell (with badge)
4. UserMenu (with dropdown)
5. WorkspaceSwitcher
6. App Shell Layout (sidebar + header + content area)
7. Auth Layout (centered card)
8. Error pages (404, 500, boundary, permission denied)

**Verification:**
- [ ] Sidebar collapses at < 1024px
- [ ] Sidebar becomes drawer at < 768px
- [ ] Header adapts at breakpoints
- [ ] Navigation matches IA sitemap
- [ ] Error pages render correctly

### Step 5: Auth Screens (Phase 4)

**What:** Login, Register, Forgot Password, Reset Password, Permission Denied.

**Documents to read:**
- `screen-specifications/02-auth-error-specs.md`
- `ux-blueprint/06-auth-ux-blueprint.md`
- `user-flow-architecture/06-auth-flows.md`

**Tasks:**
1. Login page
2. Register page
3. Forgot Password page
4. Reset Password page
5. Permission Denied page

**Verification:**
- [ ] All forms validate correctly
- [ ] Loading states during submission
- [ ] Error states for invalid credentials
- [ ] Success redirect to correct page
- [ ] RTL works (labels, inputs, buttons mirror)
- [ ] All text translated (EN + AR)

### Step 6: 5-Minute KPI Screens (Phase 5) — HIGHEST PRIORITY

**What:** Implement the screens that enable the 5-minute KPI (pair screen → upload → create playlist → publish).

**Documents to read:**
- `screen-specifications/03-overview-spec.md`
- `screen-specifications/04-screens-specs.md`
- `screen-specifications/05-content-specs.md`
- `screen-specifications/13-shared-dialogs-specs.md`
- `ux-blueprint/07-overview-ux-blueprint.md`
- `ux-blueprint/08-screens-ux-blueprint.md`
- `ux-blueprint/09-content-studio-ux-blueprint.md`
- `user-flow-architecture/17-onboarding-flows.md`
- `user-flow-architecture/08-screen-flows.md`
- `user-flow-architecture/09-media-flows.md`
- `user-flow-architecture/10-playlist-flows.md`
- `user-flow-architecture/11-publishing-scheduling-flows.md`

**Tasks (in order):**
1. Overview (empty workspace + onboarding)
2. Screens List (with ScreenCard, FilterToolbar, BulkActionBar)
3. Pairing Wizard (with StepIndicator)
4. Screen Detail (with tabs)
5. Content (Media tab with MediaCard, UploadDropZone, UploadProgressList)
6. Content (Playlists tab with PlaylistCard)
7. Playlist Detail (with PlaylistPreview, MediaItemsList, AssignedScreensList)
8. Template Picker Dialog
9. Publish to Screens Dialog
10. Overview (populated with widgets)

**Verification:**
- [ ] New user can pair a screen in < 1 minute
- [ ] User can upload media in < 1 minute
- [ ] User can create a playlist in < 1.5 minutes
- [ ] User can publish to screens in < 1 minute
- [ ] Total 5-minute KPI: < 5 minutes
- [ ] All states implemented (loading, empty, error, success)
- [ ] All text translated (EN + AR)
- [ ] RTL works
- [ ] Responsive works
- [ ] Accessibility verified

### Step 7: Studio (Phase 6) — MOST COMPLEX

**What:** Implement the Studio editor with Konva.js canvas.

**Documents to read:**
- `screen-specifications/06-studio-spec.md`
- `ux-blueprint/09-content-studio-ux-blueprint.md` (P-CN-04)
- `design-system-v2/31-studio-components.md`
- `user-flow-architecture/10-playlist-flows.md` (FL-PL-04)

**Tasks:**
1. Studio shell (3-panel layout)
2. StudioToolbar (Save, Preview, Undo/Redo)
3. MediaPanel (tabs, search, media grid)
4. KonvaCanvas (lazy-loaded with `next/dynamic`)
5. PropertiesPanel (updates on selection)
6. LayerList (drag-to-reorder)
7. PreviewOverlay (full-screen preview)
8. Delete Confirmation Dialog

**Verification:**
- [ ] Studio loads with Splash state
- [ ] Canvas renders correctly
- [ ] Media can be dragged onto canvas
- [ ] Properties update on element selection
- [ ] Layers can be reordered
- [ ] Preview works
- [ ] Save persists changes
- [ ] Desktop-only message on mobile
- [ ] Konva chunk is lazy-loaded

### Step 8: Scheduling & Analytics (Phase 7)

**What:** Calendar, schedule dialog, analytics dashboard.

**Tasks:**
1. Scheduling Calendar (CalendarGrid, CalendarDay, ScheduleEvent, DateNav)
2. Schedule Dialog (Create/Edit with DatePicker)
3. Analytics Dashboard (MetricCard, TrendChart — lazy-loaded)

### Step 9: Team & Settings (Phase 8)

**What:** Team management, all settings tabs.

**Tasks:**
1. Team Page (MemberRow, PendingInviteRow)
2. Invite Member Dialog
3. Settings (Profile, Workspace, Billing, Security, API Keys, Notifications)

### Step 10: Notifications & Admin (Phase 9)

**What:** Notifications history, all admin pages.

**Tasks:**
1. Notifications History
2. Admin (Customers, Staff, Users, Workspaces, Fleet, Health, Logs, Feature Flags)

### Step 11: Polish & QA (Phase 10)

**What:** Final audits and polish.

**Tasks:**
1. Accessibility audit (all screens)
2. Responsive audit (all breakpoints)
3. RTL audit (all screens)
4. Performance audit (Lighthouse)
5. Dark mode audit
6. Design QA (all screens)
7. E2E tests (critical flows)
8. Final readiness sign-off

---

## 4. Per-Feature Execution Protocol

For EVERY feature/screen/component implementation:

```
1. READ: Complete reading order (per `03-document-reading-order.md`)
2. VERIFY: Definition of Ready (per `09-definition-of-ready.md`)
3. IMPLEMENT: Write code following all rules
4. TEST: Write and run tests (per `21-testing-strategy.md`)
5. AUDIT: Run self-audit (per `22-self-audit-process.md`)
6. SUBMIT: Submit PR (per `23-pr-review-process.md`)
7. REVIEW: PR review (per `23-pr-review-process.md`)
8. MERGE: Only after all checks pass
9. VERIFY: Definition of Done (per `10-definition-of-done.md`)
```

If ANY step fails:
- Fix the issue
- If documentation conflict: create ADR (per `24-adr-process.md`)
- Do NOT continue until resolved

---

## 5. Implementation Decision Tree

```
Need to implement something?
  → Is it documented?
    → NO: STOP. Create ADR. Wait for documentation.
    → YES: Continue
      → Does a component already exist?
        → YES: Use it. (Check `06-component-traceability-map.md`)
        → NO: Is it in DS V2?
          → YES: Implement per spec.
          → NO: STOP. Create ADR. Wait for spec.
      → Read all required docs (per `03-document-reading-order.md`)
      → Verify Definition of Ready (per `09-definition-of-ready.md`)
      → Implement
      → Self-audit (per `22-self-audit-process.md`)
      → PR review (per `23-pr-review-process.md`)
      → Verify Definition of Done (per `10-definition-of-done.md`)
```

---

## 6. Quick Reference: What to Do When...

| Situation | Action |
|-----------|--------|
| Need to create a new component | `13-component-creation-rules.md` |
| Need to modify an existing component | `14-component-modification-rules.md` |
| Implementation conflicts with documentation | `24-adr-process.md` (STOP + ADR) |
| Need a token that doesn't exist | `24-adr-process.md` (ADR to add token) |
| Need a variant that doesn't exist | `24-adr-process.md` (ADR to add variant) |
| Not sure which document is authoritative | `02-source-of-truth.md` |
| Not sure what to read first | `03-document-reading-order.md` |
| Not sure if ready to implement | `09-definition-of-ready.md` |
| Not sure if implementation is done | `10-definition-of-done.md` |
| Found an anti-pattern | `26-anti-patterns.md` (fix it) |
| Not sure where to put a file | `27-folder-ownership.md`, `28-file-ownership.md` |
| Not sure how to name something | `29-naming-enforcement.md` |
| Encountered a risk | `25-risk-control.md` |
| Need to add a new library | `24-adr-process.md` (ADR required) |
| Performance budget not met | `20-performance-budget.md` + `24-adr-process.md` |
| Accessibility requirement not met | `18-accessibility-compliance.md` (fix it, no ADR) |
| Need to skip a state (loading/empty/error) | ❌ NEVER. All states are mandatory. |
| Need to hardcode a value | ❌ NEVER. Use tokens. |
| Need to add business logic to UI | ❌ NEVER. Extract to hooks. |
| Need to bypass design system | ❌ NEVER. Use DS V2. |

---

## 7. The Mechanical Implementation

After all governance documentation is in place, implementation should be:

1. **Almost mechanical** — every decision is answered by documentation
2. **Zero design decisions** — design is already decided in DS V2
3. **Zero UX decisions** — UX is already decided in UX Blueprint
4. **Zero navigation decisions** — navigation is already decided in IA
5. **Zero entity decisions** — entities are already decided in Product Architecture
6. **Zero flow decisions** — flows are already decided in User Flow Architecture
7. **Zero token decisions** — tokens are already decided in DS V2
8. **Zero component decisions** — components are already decided in DS V2

**Any missing decision must STOP implementation until documented.**

---

## 8. Final Statement

The Smart Screen frontend documentation is complete:

- **222 documents** across 9 phases
- **100% readiness score** (A+)
- **100% consistency** (all issues resolved)
- **100% traceability** (all screens, components, features mapped)
- **100% governance** (constitution, ready, done, audit, review, ADR, risk)
- **100 anti-patterns** catalogued
- **5 compliance checklists** (screen, UX, accessibility, responsive, performance)
- **10-phase execution plan** with timeline

**Implementation may begin.**

Follow `08-sprint-execution-order.md` strictly. Follow `01-ai-constitution.md` always. Use `24-adr-process.md` for any deviation.

**The documentation is the single source of truth. Implementation conforms to documentation. Documentation is never changed to fit implementation.**

---

## Cross-References

- See `00-index.md` for complete document inventory
- See `01-ai-constitution.md` for constitutional rules
- See `08-sprint-execution-order.md` for implementation sequence
- See `09-definition-of-ready.md` for readiness criteria
- See `10-definition-of-done.md` for completion criteria
- See `30-final-readiness-checklist.md` for final sign-off
- See `33-frontend-readiness-score.md` for readiness score
