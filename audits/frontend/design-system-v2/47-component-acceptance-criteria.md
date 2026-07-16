# 47 — Component Acceptance Criteria

> **Evidence basis:** All component specifications (`12-button-specifications.md` through `37-settings-components.md`), `09-interaction-states.md`, `10-accessibility-rules.md`, `45-accessibility-checklist.md`

---

## 1. Purpose

Every component in the Cloud-Screen design system must pass these acceptance criteria before it is considered production-ready. These criteria are **universal** — they apply to every component — in addition to the component-specific criteria in each specification file.

---

## 2. Universal Acceptance Criteria

### 2.1 Visual

- [ ] Component renders correctly in light theme
- [ ] Component renders correctly in dark theme
- [ ] All variants render with correct colors (per `42-variant-rules.md`)
- [ ] All sizes render with correct dimensions
- [ ] Spacing uses design tokens (no hardcoded values)
- [ ] Colors use semantic tokens (no primitive/hex values)
- [ ] Typography uses text tokens (font size, weight, line height)
- [ ] Border radius uses radius tokens
- [ ] Shadow uses shadow tokens
- [ ] No layout shift between states (loading → content, empty → content)

### 2.2 States

- [ ] Default state renders correctly
- [ ] Hover state renders correctly (with animation, MI-01)
- [ ] Focus state renders correctly (`ring-2 ring-ring ring-offset-2`)
- [ ] Active/pressed state renders correctly (where applicable)
- [ ] Disabled state renders correctly (`opacity-50 cursor-not-allowed`)
- [ ] Loading state renders correctly (skeleton or spinner)
- [ ] Error state renders correctly (where applicable)
- [ ] Empty state renders correctly (where applicable)
- [ ] Selected state renders correctly (where applicable)

### 2.3 Interactions

- [ ] Click triggers correct action
- [ ] Hover shows correct visual feedback (150ms transition)
- [ ] Focus visible on keyboard navigation (`focus-visible`)
- [ ] Focus not shown on mouse click (unless `focus-visible` triggers)
- [ ] Touch target ≥ 44px on mobile (≥ 36px desktop)
- [ ] No double-trigger (debounce or disable during action)

### 2.4 Accessibility

- [ ] Semantic HTML element used (`<button>`, `<input>`, `<nav>`, etc.)
- [ ] `role` attribute set when semantic HTML is insufficient
- [ ] `aria-label` on icon-only elements
- [ ] `aria-hidden="true"` on decorative icons
- [ ] Keyboard: `Tab` to focus, `Enter`/`Space` to activate
- [ ] Keyboard: `Escape` to close (dialogs, drawers, dropdowns)
- [ ] Focus trap in dialogs and drawers
- [ ] Focus returns to trigger on close (dialogs, drawers)
- [ ] Color contrast ≥ 4.5:1 for text, ≥ 3:1 for UI components
- [ ] Status not communicated by color alone
- [ ] `prefers-reduced-motion` respected (instant fallback)

### 2.5 Responsive

- [ ] Renders correctly at 320px width
- [ ] Renders correctly at 768px width
- [ ] Renders correctly at 1024px width
- [ ] Renders correctly at 1280px width
- [ ] No horizontal scroll at any breakpoint (except tables/Studio)
- [ ] Touch targets meet minimum size on mobile
- [ ] Layout adapts per breakpoint rules (`38-responsive-rules.md`)

### 2.6 RTL

- [ ] Layout mirrors correctly in RTL (`dir="rtl"`)
- [ ] Directional icons mirrored (`rtl:rotate-180`)
- [ ] Text alignment correct (right in RTL)
- [ ] No hardcoded `left`/`right` (use logical properties)
- [ ] Spacing uses `ms-`/`me-` (not `ml-`/`mr-`)
- [ ] Arabic font applied for Arabic locale

### 2.7 Performance

- [ ] No unnecessary re-renders (React.memo where appropriate)
- [ ] Animations use `transform`/`opacity` only
- [ ] No layout shift during state transitions
- [ ] Images lazy-loaded (where applicable)
- [ ] No blocking JavaScript on initial render

### 2.8 Composition

- [ ] Follows layer rules (`43-composition-rules.md`)
- [ ] No circular dependencies
- [ ] Props are typed (TypeScript)
- [ ] Sub-components follow naming convention (`41-component-naming.md`)
- [ ] Slots accept `ReactNode` (where applicable)
- [ ] HTML attributes forwarded (id, className, aria-*)

---

## 3. Component-Specific Criteria Summary

Each component specification file includes its own acceptance criteria. Here is a summary of key criteria per component:

| Component | Key Criteria | File |
|-----------|-------------|------|
| Button | 5 variants, 4 sizes, loading state, `aria-label` on icon-only | `12-button-specifications.md` |
| Input | Focus ring, error state, `aria-invalid`, 16px font on mobile | `13-input-specifications.md` |
| Form | Label association, error `role="alert"`, double-submit prevention | `14-form-standards.md` |
| Card | 6 variants, hover shadow, selected state, `role="button"` on interactive | `15-cards.md` |
| Table | Header labels, sort indicator, row hover, skeleton, horizontal scroll | `16-tables.md` |
| List | Dividers, hover, `role="list"`, skeleton, empty state | `17-lists.md` |
| EmptyState | Icon 48px, CTA, `role="status"`, variant-specific content | `18-empty-states.md` |
| Skeleton | Shimmer animation, matches content shape, `aria-hidden` | `19-loading-states.md` |
| ErrorState | 5 variants, "Retry" action, `role="alert"`, no jargon | `20-error-states.md` |
| Dialog | Scale+fade animation, focus trap, Escape, `aria-modal` | `22-dialog-standards.md` |
| Drawer | Slide animation, focus trap, Escape, mobile 85vw max | `23-drawer-standards.md` |
| Toast | 4 variants, auto-dismiss, `aria-live`, bottom position | `24-toast-standards.md` |
| Sidebar | 3 modes (full/collapsed/drawer), active indicator, `aria-current` | `25-navigation-components.md` |
| SearchInput | Debounce 300ms, clear button, `aria-label`, Escape clears | `26-search-components.md` |
| FilterSelect | Active filter indicator, immediate change, `aria-label` | `27-filter-components.md` |

---

## 4. Sign-Off Process

### 4.1 Implementation Review
1. Developer implements component per specification
2. Developer runs through universal acceptance criteria
3. Developer runs through component-specific criteria
4. Developer runs through accessibility checklist (`45-accessibility-checklist.md`)
5. PR created with checklist completed

### 4.2 Design Review
1. Reviewer verifies visual correctness (all variants, sizes, states)
2. Reviewer verifies responsive behavior (320px, 768px, 1024px, 1280px)
3. Reviewer verifies RTL behavior
4. Reviewer verifies dark mode
5. Reviewer runs Lighthouse audit

### 4.3 Accessibility Review
1. Reviewer tests keyboard navigation (Tab, Enter, Space, Escape, arrows)
2. Reviewer tests screen reader (NVDA or VoiceOver)
3. Reviewer tests `prefers-reduced-motion`
4. Reviewer verifies ARIA attributes
5. Reviewer verifies color contrast

### 4.4 Approval
- All criteria must pass before merge
- Any failed criteria must be fixed before approval
- No exceptions for accessibility criteria

---

## Cross-References

- See `45-accessibility-checklist.md` for the full accessibility checklist
- See `48-design-qa-checklist.md` for the design QA checklist
- See `09-interaction-states.md` for state definitions
- See `10-accessibility-rules.md` for accessibility rules
- See `38-responsive-rules.md` for responsive rules
- See `39-rtl-rules.md` for RTL rules
- See `42-variant-rules.md` for variant rules
- See `43-composition-rules.md` for composition rules
- See individual component specs (`12` through `37`) for component-specific criteria
