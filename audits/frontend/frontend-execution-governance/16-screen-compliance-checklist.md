# 16 — Screen Compliance Checklist

> **Status:** FINAL — Per-screen verification before merge

---

## 1. Purpose

Every screen must pass this checklist before it can be merged. This checklist is completed by the developer during self-audit and verified by the PR reviewer.

---

## 2. Pre-Implementation Verification

- [ ] Screen ID identified in `05-screen-traceability-map.md`
- [ ] Screen Specification read (`screen-specifications/[relevant].md`)
- [ ] UX Blueprint read (`ux-blueprint/[relevant].md`)
- [ ] User Flow read (`user-flow-architecture/[relevant].md`)
- [ ] All component specs read (for components used on this screen)
- [ ] `09-definition-of-ready.md` per-screen criteria met

---

## 3. Layout Compliance

- [ ] Page layout matches Screen Specification
- [ ] Page header matches spec (title, breadcrumbs, actions)
- [ ] Content area matches spec (grid, table, list, or detail)
- [ ] Container width matches `design-system-v2/02-grid-system.md`
- [ ] Page padding matches breakpoint rules (24px/16px/12px)
- [ ] Sidebar visible (desktop) / drawer (mobile)
- [ ] Header visible with correct elements
- [ ] No layout elements not in spec

---

## 4. Component Compliance

- [ ] All components from spec's component tree are implemented
- [ ] All components are from DS V2 (no custom HTML replicating DS components)
- [ ] All components use correct variants (per spec)
- [ ] All components use correct sizes (per spec)
- [ ] All components have correct props (per spec)
- [ ] No undocumented components added
- [ ] No missing components from spec

---

## 5. State Compliance

- [ ] Loading state implemented (Skeleton matching content layout)
- [ ] Empty state implemented (EmptyState with correct variant, icon, message, CTA)
- [ ] Error state implemented (ErrorState with correct variant, message, Retry)
- [ ] Success feedback implemented (Toast with correct variant and message)
- [ ] No results state implemented (if screen has search/filter)
- [ ] Disabled state implemented (for disabled actions)
- [ ] No layout shift between any states
- [ ] All state messages match screen spec (specific, not generic)

---

## 6. Interaction Compliance

- [ ] All interactions from screen spec implemented
- [ ] Click handlers match spec behavior
- [ ] Navigation matches spec (links, redirects)
- [ ] Form submission matches spec (validation, API call, success/error)
- [ ] Dialog/drawer opening matches spec
- [ ] Real-time updates implemented (if spec requires)
- [ ] No undocumented interactions added
- [ ] Optimistic updates implemented (where spec requires)

---

## 7. API Compliance

- [ ] API endpoints match screen spec
- [ ] SWR hooks created for all data fetching
- [ ] API responses typed with TypeScript interfaces
- [ ] Error handling matches `11-code-quality-rules.md` §7
- [ ] Loading state uses SWR `isLoading`
- [ ] Pagination implemented (if spec requires)
- [ ] Search/filter/sort are server-side (if spec requires)
- [ ] Realtime events handled (if spec requires)

---

## 8. Accessibility Compliance

- [ ] Page has one `<h1>`
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] `<main>` wraps main content
- [ ] `<nav>` wraps navigation
- [ ] All interactive elements focusable
- [ ] Focus order follows visual order
- [ ] Focus ring visible on all elements
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-hidden` on decorative icons
- [ ] `aria-current="page"` on active nav item
- [ ] Keyboard: Tab, Enter, Space, Escape work
- [ ] Dialog: focus trap, Escape to close, focus restore
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI)
- [ ] Status not communicated by color alone
- [ ] `prefers-reduced-motion` respected
- [ ] Screen reader tested (NVDA or VoiceOver)

---

## 9. Responsive Compliance

- [ ] Renders correctly at 320px
- [ ] Renders correctly at 768px
- [ ] Renders correctly at 1024px
- [ ] Renders correctly at 1280px
- [ ] No horizontal scroll (except tables/Studio)
- [ ] Touch targets ≥ 44px on mobile
- [ ] Input font size ≥ 16px on mobile
- [ ] Card grid columns match breakpoint rules
- [ ] Sidebar behavior matches breakpoint rules
- [ ] Toolbar wraps on mobile
- [ ] Dialogs fit mobile viewport

---

## 10. RTL Compliance

- [ ] Layout mirrors in RTL
- [ ] Directional icons mirrored
- [ ] Non-directional icons NOT mirrored
- [ ] Text alignment: right in RTL
- [ ] No hardcoded `left`/`right`
- [ ] No hardcoded `ml-`/`mr-` (use `ms-`/`me-`)
- [ ] Arabic font applied
- [ ] All text translated (EN + AR)
- [ ] Calendar: Saturday first (if applicable)
- [ ] Dialog close: left in RTL

---

## 11. Dark Mode Compliance

- [ ] Screen renders correctly in dark mode
- [ ] All colors use semantic tokens (auto-switch in dark mode)
- [ ] No contrast issues in dark mode
- [ ] Borders visible in dark mode
- [ ] Shadows visible in dark mode
- [ ] Images/logos have dark mode variants (if needed)

---

## 12. Performance Compliance

- [ ] No layout shift (CLS < 0.1)
- [ ] Images lazy-loaded (below fold)
- [ ] No unnecessary re-renders
- [ ] Animations use transform/opacity only
- [ ] Heavy components lazy-loaded (if applicable)
- [ ] No blocking JavaScript
- [ ] Lighthouse Performance ≥ 90

---

## 13. Code Quality Compliance

- [ ] No `any` types
- [ ] No `@ts-ignore` without comment
- [ ] No `console.log` statements
- [ ] No commented-out code
- [ ] No TODO without ticket reference
- [ ] No hardcoded values (all tokens)
- [ ] No inline styles
- [ ] No business logic in UI components
- [ ] No API calls in components (use hooks)
- [ ] Component max 300 lines
- [ ] Files in correct folders
- [ ] Naming follows conventions

---

## 14. Testing Compliance

- [ ] Unit tests written and passing
- [ ] E2E test for primary user action (if applicable)
- [ ] Accessibility test (axe) passing
- [ ] No tests skipped or TODO
- [ ] Test coverage ≥ 80% for new code

---

## 15. Documentation Compliance

- [ ] Screen matches Screen Specification
- [ ] No undocumented features added
- [ ] No undocumented behavior changes
- [ ] Traceability verified (screen → spec → flow → components)
- [ ] Self-audit (`22-self-audit-process.md`) passed
- [ ] Definition of Done (`10-definition-of-done.md`) all items checked

---

## 16. Sign-Off

- [ ] Developer self-audit passed
- [ ] PR reviewer verification passed
- [ ] All checklist items checked
- [ ] Ready for merge

---

## Cross-References

- See `09-definition-of-ready.md` for readiness criteria
- See `10-definition-of-done.md` for completion criteria
- See `17-ux-compliance-checklist.md` for UX compliance
- See `18-accessibility-compliance.md` for accessibility details
- See `19-responsive-compliance.md` for responsive details
- See `22-self-audit-process.md` for self-audit process
- See `23-pr-review-process.md` for PR review process
- See `05-screen-traceability-map.md` for screen traceability
