# 10 — Definition of Done

> **Status:** FINAL — Criteria that must be met before implementation is considered complete

---

## 1. Purpose

Defines the criteria that must be **fully met** before any feature, screen, or component is considered complete. If any criterion is NOT met, the implementation is NOT done. This is enforced by the AI Constitution (Article IX, §9.2).

---

## 2. Universal Definition of Done

A feature is **NOT complete** unless ALL of the following are true:

### 2.1 Design Compliance
- [ ] Design matches Design System V2 specifications
- [ ] All colors use semantic tokens (no hardcoded values)
- [ ] All spacing uses spacing tokens (no hardcoded values)
- [ ] All typography uses text tokens (no hardcoded values)
- [ ] All radii use radius tokens
- [ ] All shadows use shadow tokens
- [ ] All animations use motion tokens (MI-01 through MI-23)
- [ ] Component variants match `42-variant-rules.md`
- [ ] Component sizes match specifications
- [ ] No visual regression from design specifications

### 2.2 UX Compliance
- [ ] UX matches UX Blueprint rules
- [ ] UX matches Screen Specification interactions
- [ ] User Flow is correctly implemented
- [ ] Navigation matches Information Architecture
- [ ] Page layout matches Screen Specification
- [ ] Component hierarchy matches Screen Specification
- [ ] All interactions documented in screen spec are implemented
- [ ] No undocumented interactions added

### 2.3 State Compliance
- [ ] Loading state implemented (Skeleton or Spinner per `19-loading-states.md`)
- [ ] Empty state implemented (EmptyState per `18-empty-states.md`)
- [ ] Error state implemented (ErrorState per `20-error-states.md`)
- [ ] Success feedback implemented (Toast per `21-success-states.md` and `24-toast-standards.md`)
- [ ] Disabled state implemented (where applicable)
- [ ] No results state implemented (where applicable)
- [ ] No layout shift between states

### 2.4 Responsive Compliance
- [ ] Renders correctly at 320px width
- [ ] Renders correctly at 768px width
- [ ] Renders correctly at 1024px width
- [ ] Renders correctly at 1280px width
- [ ] No horizontal scroll (except tables/Studio)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Input font size ≥ 16px on mobile
- [ ] Sidebar behavior per breakpoint
- [ ] Card grid columns per breakpoint
- [ ] Toolbar wraps on mobile

### 2.5 RTL Compliance
- [ ] Layout mirrors correctly in RTL (`dir="rtl"`)
- [ ] Directional icons mirrored (arrows, chevrons)
- [ ] Non-directional icons NOT mirrored
- [ ] Text alignment correct (right in RTL)
- [ ] No hardcoded `left`/`right` (use logical properties)
- [ ] No hardcoded `ml-`/`mr-` (use `ms-`/`me-`)
- [ ] Arabic font applied for Arabic locale
- [ ] All text translated (EN + AR)
- [ ] Calendar: Saturday first in RTL
- [ ] Dialog close button on left in RTL

### 2.6 Accessibility Compliance
- [ ] WCAG 2.1 Level AA compliance verified
- [ ] Semantic HTML used (`<button>`, `<input>`, `<nav>`, etc.)
- [ ] ARIA attributes set correctly (`aria-label`, `aria-hidden`, `aria-expanded`, etc.)
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape, arrows)
- [ ] Focus trap in dialogs and drawers
- [ ] Focus returns to trigger on close
- [ ] Focus ring visible on all interactive elements
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI
- [ ] Status not communicated by color alone
- [ ] `prefers-reduced-motion` respected
- [ ] Screen reader tested (NVDA or VoiceOver)

### 2.7 Performance Compliance
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] No layout shift (CLS < 0.1)
- [ ] Animations use `transform`/`opacity` only
- [ ] Images lazy-loaded (below fold)
- [ ] Images optimized (WebP/AVIF)
- [ ] No unnecessary re-renders
- [ ] Bundle size within budget
- [ ] Studio chunk lazy-loaded (if applicable)
- [ ] Charts lazy-loaded (if applicable)

### 2.8 Architecture Compliance
- [ ] Component layer rules respected (no cross-layer imports)
- [ ] No circular dependencies
- [ ] No God components (max 300 lines)
- [ ] No deep prop drilling (max 2 levels)
- [ ] State management follows `product-architecture/13-frontend-state-boundaries.md`
- [ ] No business logic in UI components
- [ ] No backend logic in frontend
- [ ] Reusable components used (no duplication)

### 2.9 Naming Compliance
- [ ] Component names follow `41-component-naming.md` (PascalCase)
- [ ] File names follow `41-component-naming.md` (kebab-case)
- [ ] Token names follow `40-token-naming.md`
- [ ] Function names are descriptive (no abbreviations)
- [ ] No magic numbers or magic strings
- [ ] Constants are named and documented

### 2.10 Folder & File Compliance
- [ ] Files in correct folders per `27-folder-ownership.md`
- [ ] File ownership respected per `28-file-ownership.md`
- [ ] No files in wrong location
- [ ] No orphaned files
- [ ] Index files for barrel exports

### 2.11 Testing Compliance
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing (where applicable)
- [ ] E2E tests written and passing (for critical flows)
- [ ] Accessibility tests passing (axe)
- [ ] No test skipped or marked as TODO
- [ ] Test coverage meets minimum (80% for components)

### 2.12 Quality Gate Compliance
- [ ] Self-audit per `22-self-audit-process.md` passed
- [ ] PR review per `23-pr-review-process.md` passed
- [ ] Acceptance criteria from screen spec met
- [ ] Acceptance criteria from component spec met
- [ ] `16-screen-compliance-checklist.md` completed (for screens)
- [ ] `17-ux-compliance-checklist.md` completed (for features)
- [ ] `18-accessibility-compliance.md` completed
- [ ] `19-responsive-compliance.md` completed
- [ ] No ADR deviations unresolved

---

## 3. Per-Component Definition of Done

A component is **NOT complete** unless:

- [ ] All variants render correctly
- [ ] All sizes render correctly
- [ ] All states render correctly (default, hover, focus, active, disabled, loading, error)
- [ ] Props are typed (TypeScript)
- [ ] HTML attributes forwarded correctly
- [ ] Accessibility criteria from component spec met
- [ ] Keyboard behavior from component spec implemented
- [ ] Animations from component spec implemented
- [ ] Responsive behavior from component spec implemented
- [ ] RTL behavior from component spec implemented
- [ ] Anti-patterns from component spec avoided
- [ ] Acceptance criteria from component spec ALL passed
- [ ] Unit tests written and passing
- [ ] No hardcoded values (all tokens)
- [ ] Component is exported from correct barrel file

---

## 4. Per-Screen Definition of Done

A screen is **NOT complete** unless:

- [ ] All components from screen spec's component tree are implemented
- [ ] Layout matches screen spec
- [ ] All states from screen spec implemented (loading, empty, error, success)
- [ ] All interactions from screen spec implemented
- [ ] All responsive behavior from screen spec implemented
- [ ] All accessibility notes from screen spec addressed
- [ ] API integration per screen spec implemented
- [ ] Realtime updates per screen spec implemented (if applicable)
- [ ] All acceptance criteria from screen spec met
- [ ] Screen renders correctly in light and dark mode
- [ ] Screen renders correctly in LTR and RTL
- [ ] Screen tested at all breakpoints
- [ ] E2E test for primary user action on this screen
- [ ] Self-audit passed
- [ ] PR review passed

---

## 5. Per-Feature Definition of Done

A feature is **NOT complete** unless:

- [ ] All screens for this feature are complete
- [ ] All components for this feature are complete
- [ ] User flow for this feature is correctly implemented
- [ ] All entry points to this feature work
- [ ] All exit points from this feature work
- [ ] Feature works end-to-end
- [ ] Feature tested with real API (or documented mock)
- [ ] Feature acceptance criteria met
- [ ] No regression in other features
- [ ] Self-audit passed
- [ ] PR review passed

---

## 6. Done Gate Enforcement

### §6.1 No Merge Without Done
No PR may be merged until ALL Definition of Done criteria are met. This is non-negotiable.

### §6.2 Partial Done is Not Done
If any criterion is not met, the implementation is NOT done. "Almost done" is not done.

### §6.3 Done Verification
Done status must be verified by:
1. Developer self-audit (`22-self-audit-process.md`)
2. PR reviewer verification (`23-pr-review-process.md`)
3. All checklist items checked and verified

### §6.4 Done Documentation
The completed Definition of Done checklist must be included in the PR description before merge.

---

## Cross-References

- See `01-ai-constitution.md` Article IX for quality gates
- See `09-definition-of-ready.md` for readiness criteria
- See `22-self-audit-process.md` for self-audit process
- See `23-pr-review-process.md` for PR review process
- See `16-19` compliance checklists
- See `30-final-readiness-checklist.md` for final sign-off
