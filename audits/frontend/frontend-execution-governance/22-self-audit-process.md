# 22 — Self-Audit Process

> **Status:** FINAL — Mandatory self-review after every completed feature

---

## 1. Purpose

Defines the mandatory self-audit process that must be completed by the developer after every feature, screen, or component implementation. No PR may be submitted until self-audit passes. Enforced by AI Constitution (Article IX, §9.3).

---

## 2. Self-Audit Process

### Step 1: Complete Implementation
- Finish all code for the feature/screen/component
- Run local tests (unit + integration)
- Fix any failing tests

### Step 2: Run Self-Audit Checklist
Complete ALL sections below. Every item must be checked.

### Step 3: Fix Issues
- If any item fails, fix it before proceeding
- If an item cannot be fixed (documentation conflict), create an ADR per `24-adr-process.md`

### Step 4: Document Audit
- Include completed checklist in PR description
- Note any ADRs created
- Note any deviations (with ADR approval)

### Step 5: Submit PR
- Only after self-audit is fully passed
- PR must include "Self-Audit: PASSED" in description

---

## 3. Self-Audit Checklist

### 3.1 Documentation Compliance
- [ ] All required documents read (per `03-document-reading-order.md`)
- [ ] Implementation matches Screen Specification
- [ ] Implementation matches UX Blueprint
- [ ] Implementation matches User Flow
- [ ] Implementation matches Design System V2 component specs
- [ ] No undocumented features added
- [ ] No undocumented behavior changes
- [ ] Traceability verified (screen → spec → flow → components)
- [ ] No documentation was silently modified

### 3.2 UX Compliance
- [ ] UX matches UX Blueprint rules (`17-ux-compliance-checklist.md`)
- [ ] All interactions from screen spec implemented
- [ ] No undocumented interactions added
- [ ] Navigation matches Information Architecture
- [ ] User flow correctly implemented
- [ ] Onboarding flow correct (if applicable)

### 3.3 Design Compliance
- [ ] All colors use semantic tokens (no hardcoded)
- [ ] All spacing uses spacing tokens (no hardcoded)
- [ ] All typography uses text tokens (no hardcoded)
- [ ] All radii use radius tokens
- [ ] All shadows use shadow tokens
- [ ] All animations use motion tokens
- [ ] Component variants match spec
- [ ] Component sizes match spec
- [ ] Layout matches screen spec
- [ ] Grid matches `02-grid-system.md`
- [ ] No visual regression

### 3.4 Accessibility Compliance
- [ ] WCAG 2.1 Level AA verified (`18-accessibility-compliance.md`)
- [ ] Semantic HTML used
- [ ] ARIA attributes correct
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape, arrows)
- [ ] Focus trap in dialogs/drawers
- [ ] Focus returns to trigger on close
- [ ] Focus ring visible on all interactive elements
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI)
- [ ] Status not communicated by color alone
- [ ] `prefers-reduced-motion` respected
- [ ] Screen reader tested (NVDA or VoiceOver)
- [ ] Lighthouse Accessibility ≥ 95

### 3.5 Responsive Compliance
- [ ] Renders correctly at 320px (`19-responsive-compliance.md`)
- [ ] Renders correctly at 768px
- [ ] Renders correctly at 1024px
- [ ] Renders correctly at 1280px
- [ ] No horizontal scroll (except tables/Studio)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Input font size ≥ 16px on mobile
- [ ] Card grid columns match breakpoint rules
- [ ] Sidebar behavior matches breakpoint rules
- [ ] Toolbar wraps on mobile

### 3.6 Performance Compliance
- [ ] Lighthouse Performance ≥ 90 (`20-performance-budget.md`)
- [ ] No layout shift (CLS < 0.1)
- [ ] No janky animations (60fps)
- [ ] Animations use transform/opacity only
- [ ] Images lazy-loaded (below fold)
- [ ] No excessive re-renders (Profiler verified)
- [ ] Search debounced (if applicable)
- [ ] Bundle size within budget

### 3.7 Architecture Compliance
- [ ] Component layer rules respected (no cross-layer imports)
- [ ] No circular dependencies
- [ ] No God components (max 300 lines)
- [ ] No deep prop drilling (max 2 levels)
- [ ] State management follows `13-frontend-state-boundaries.md`
- [ ] No business logic in UI components
- [ ] No backend logic in frontend
- [ ] Reusable components used (no duplication)
- [ ] SWR for all data fetching
- [ ] No direct `fetch` in components

### 3.8 Naming Compliance
- [ ] Component names follow `41-component-naming.md` (PascalCase)
- [ ] File names follow `41-component-naming.md` (kebab-case)
- [ ] Token names follow `40-token-naming.md`
- [ ] Function names are descriptive (no abbreviations)
- [ ] No magic numbers or magic strings
- [ ] Constants are named and documented
- [ ] Hooks follow `use[Feature]` pattern

### 3.9 Folder Compliance
- [ ] Files in correct folders per `27-folder-ownership.md`
- [ ] File ownership respected per `28-file-ownership.md`
- [ ] No files in wrong location
- [ ] No orphaned files
- [ ] Barrel exports (`index.ts`) created

### 3.10 Component Compliance
- [ ] All variants implemented
- [ ] All sizes implemented
- [ ] All states implemented (default, hover, focus, active, disabled, loading, error)
- [ ] Props typed (TypeScript)
- [ ] HTML attributes forwarded
- [ ] Anti-patterns avoided (per component spec)
- [ ] Acceptance criteria ALL passed
- [ ] Component is in correct layer

### 3.11 State Compliance
- [ ] Loading state implemented (Skeleton or Spinner)
- [ ] Empty state implemented (EmptyState)
- [ ] Error state implemented (ErrorState)
- [ ] Success feedback implemented (Toast)
- [ ] No results state implemented (if applicable)
- [ ] No layout shift between states
- [ ] State messages are specific (not generic)

### 3.12 RTL Compliance
- [ ] Layout mirrors in RTL
- [ ] Directional icons mirrored
- [ ] Non-directional icons NOT mirrored
- [ ] Text alignment: right in RTL
- [ ] No hardcoded `left`/`right`
- [ ] No hardcoded `ml-`/`mr-` (use `ms-`/`me-`)
- [ ] Arabic font applied
- [ ] All text translated (EN + AR)

### 3.13 Dark Mode Compliance
- [ ] Renders correctly in dark mode
- [ ] All colors use semantic tokens (auto-switch)
- [ ] No contrast issues in dark mode
- [ ] Borders visible in dark mode
- [ ] Shadows visible in dark mode

### 3.14 Testing Compliance
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (if applicable)
- [ ] E2E test written and passing (for P0/P1 screens)
- [ ] Accessibility test (axe) passing
- [ ] No tests skipped or TODO
- [ ] Test coverage ≥ 80% for new code

### 3.15 Code Quality Compliance
- [ ] No `any` types
- [ ] No `@ts-ignore` without comment
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] No TODO without ticket reference
- [ ] No hardcoded values
- [ ] No inline styles
- [ ] ESLint passes
- [ ] Prettier passes
- [ ] TypeScript compiles without errors

### 3.16 Traceability Compliance
- [ ] Screen ID identified in `05-screen-traceability-map.md`
- [ ] Component listed in `06-component-traceability-map.md`
- [ ] Feature listed in `07-feature-traceability-map.md`
- [ ] Full traceability chain verified:
  ```
  Requirement → Feature → Flow → Screen → UX Blueprint
  → Screen Specification → DS Component → Acceptance Criteria → Code → Tests
  ```

---

## 4. Self-Audit Result

### 4.1 Pass
All items checked and verified. PR may be submitted.

### 4.2 Fail
One or more items failed. Fix issues before submitting PR. If issue is a documentation conflict, create ADR.

### 4.3 Conditional Pass
One or more items have approved ADR deviations. PR may be submitted with ADR references.

---

## 5. Self-Audit Documentation

The self-audit result must be documented in the PR description:

```markdown
## Self-Audit Result: PASSED

### Checklist Summary
- [x] Documentation Compliance
- [x] UX Compliance
- [x] Design Compliance
- [x] Accessibility Compliance
- [x] Responsive Compliance
- [x] Performance Compliance
- [x] Architecture Compliance
- [x] Naming Compliance
- [x] Folder Compliance
- [x] Component Compliance
- [x] State Compliance
- [x] RTL Compliance
- [x] Dark Mode Compliance
- [x] Testing Compliance
- [x] Code Quality Compliance
- [x] Traceability Compliance

### ADRs
- None (or list ADR numbers)

### Deviations
- None (or list approved deviations with ADR references)
```

---

## Cross-References

- See `01-ai-constitution.md` Article IX §9.3 for self-audit mandate
- See `10-definition-of-done.md` for completion criteria
- See `16-20` compliance checklists
- See `23-pr-review-process.md` for PR review
- See `24-adr-process.md` for ADR process
- See `03-document-reading-order.md` for reading requirements
