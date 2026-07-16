# 48 — Design QA Checklist

> **Evidence basis:** `47-component-acceptance-criteria.md`, `45-accessibility-checklist.md`, `46-performance-guidelines.md`, `09-interaction-states.md`, `38-responsive-rules.md`, `39-rtl-rules.md`

---

## 1. Purpose

This checklist is used by designers and QA engineers during the design QA review process. It ensures every component and page meets the design system standards before release.

---

## 2. Visual QA

### 2.1 Tokens
- [ ] All colors use semantic tokens (`--color-primary`, not `#2563eb`)
- [ ] All spacing uses spacing tokens (`--space-4`, not `16px`)
- [ ] All typography uses text tokens (`--text-sm`, not `14px`)
- [ ] All radii use radius tokens (`--radius-lg`, not `8px`)
- [ ] All shadows use shadow tokens (`--shadow-sm`, not custom)
- [ ] No hardcoded values anywhere in the component

### 2.2 Theme
- [ ] Component looks correct in light theme
- [ ] Component looks correct in dark theme
- [ ] No contrast issues in either theme
- [ ] Borders visible in both themes
- [ ] Shadows visible in both themes

### 2.3 Variants
- [ ] All variants visually distinct
- [ ] Variants match specification (colors, borders, shadows)
- [ ] No variant looks broken or inconsistent
- [ ] Variant names match `42-variant-rules.md`

### 2.4 Sizes
- [ ] All sizes render with correct dimensions
- [ ] Size transitions are smooth (if resizable)
- [ ] Touch targets meet minimum sizes

---

## 3. State QA

### 3.1 Interactive States
- [ ] Default: Correct appearance
- [ ] Hover: Background/shadow change (150ms)
- [ ] Focus: Ring visible (2px, `--ring`, 2px offset)
- [ ] Active/Press: Scale or color change (100ms)
- [ ] Disabled: Opacity 50%, not-allowed cursor

### 3.2 Data States
- [ ] Loading: Skeleton matches content shape
- [ ] Empty: EmptyState with icon, title, description, CTA
- [ ] Error: ErrorState with icon, title, description, Retry
- [ ] Success: Toast with correct variant and message
- [ ] No Results: EmptyState (filtered variant) with Clear Filters

### 3.3 State Transitions
- [ ] Default → Hover: 150ms transition
- [ ] Hover → Default: 150ms transition
- [ ] Default → Focus: Instant (no transition)
- [ ] Loading → Content: No layout shift
- [ ] Empty → Content: No layout shift
- [ ] Error → Content: No layout shift

---

## 4. Animation QA

- [ ] All animations use defined motion tokens (MI-01 through MI-23)
- [ ] No animation exceeds 600ms (except skeleton/spinner loops)
- [ ] Hover animations are color/shadow only (no transform)
- [ ] Press animations use scale (0.97)
- [ ] Dialog: Scale + fade (MI-06/MI-07)
- [ ] Drawer: Slide + fade (MI-15/MI-16)
- [ ] Toast: Slide up + fade (MI-10/MI-23)
- [ ] `prefers-reduced-motion` respected (instant or fade fallback)
- [ ] No decorative animations
- [ ] No bounce (except toggle and checkmark)

---

## 5. Layout QA

### 5.1 Grid
- [ ] Content uses correct container width per page type
- [ ] Card grids use correct column counts per breakpoint
- [ ] Grid gaps use spacing tokens
- [ ] No arbitrary widths

### 5.2 Spacing
- [ ] Page padding: 24px (desktop), 16px (tablet), 12px (mobile)
- [ ] Card padding: 20px (default), 12px (compact), 24px (large)
- [ ] Form field gap: 12px
- [ ] Section gap: 24px
- [ ] Button group gap: 8px

### 5.3 Alignment
- [ ] Page header: `flex items-center justify-between`
- [ ] Toolbar: `flex items-center gap-3 flex-wrap`
- [ ] Form actions: `flex items-center justify-end gap-3`
- [ ] Dialog footer: Cancel (left) + Confirm (right)

---

## 6. Responsive QA

### 6.1 Breakpoints
- [ ] 320px: No horizontal scroll, all elements usable
- [ ] 375px: All elements visible and accessible
- [ ] 768px: Sidebar collapsed, grids 2-column
- [ ] 1024px: Sidebar full, grids 3-4 column
- [ ] 1280px: Full layout, max grid columns
- [ ] 1920px: Container max-width prevents stretching

### 6.2 Mobile-Specific
- [ ] Touch targets ≥ 44px
- [ ] Input font size ≥ 16px (no iOS zoom)
- [ ] Dialogs fit within viewport
- [ ] Tables scroll horizontally
- [ ] Toolbar items wrap
- [ ] Studio shows desktop-only message

---

## 7. RTL QA

- [ ] `dir="rtl"` applied for Arabic locale
- [ ] Sidebar on right side
- [ ] Header elements mirrored
- [ ] Text alignment: Right for Arabic
- [ ] Directional icons mirrored (arrows, chevrons)
- [ ] Non-directional icons NOT mirrored
- [ ] Breadcrumb separator mirrored
- [ ] Dialog close button on left
- [ ] Toast position: Bottom-left
- [ ] Table columns reversed
- [ ] Pagination: Prev on right, Next on left
- [ ] Calendar: Saturday first, right-to-left
- [ ] Arabic font (Cairo/Tajawal) applied
- [ ] No hardcoded `left`/`right` in CSS
- [ ] No hardcoded `ml-`/`mr-` (use `ms-`/`me-`)

---

## 8. Accessibility QA

### 8.1 Keyboard
- [ ] Tab order follows visual order
- [ ] All interactive elements focusable
- [ ] Focus ring visible on all elements
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs/drawers/dropdowns
- [ ] Focus trap in dialog/drawer
- [ ] Focus returns to trigger on close
- [ ] Arrow keys in tabs, dropdowns, calendar

### 8.2 Screen Reader
- [ ] Page has one `<h1>`
- [ ] Heading hierarchy correct
- [ ] `aria-label` on icon-only buttons
- [ ] `aria-hidden` on decorative icons
- [ ] `aria-live` on toasts and errors
- [ ] `role="alert"` on error messages
- [ ] `role="status"` on loading and empty states
- [ ] Dialog: `role="dialog"`, `aria-modal="true"`
- [ ] Navigation: `role="navigation"`, `aria-label`

### 8.3 Contrast
- [ ] Body text ≥ 4.5:1
- [ ] Large text ≥ 3:1
- [ ] UI borders ≥ 3:1
- [ ] Focus ring ≥ 3:1
- [ ] Disabled text exempt (but visible)

---

## 9. Content QA

- [ ] All text is translated (EN + AR)
- [ ] No hardcoded English strings in components
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Empty state messages are specific (not "No data")
- [ ] Toast messages are specific (not "Success" or "Error")
- [ ] Button labels are action-oriented ("Save", not "OK")
- [ ] Date/time formats are locale-aware

---

## 10. Performance QA

- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] No layout shift (CLS < 0.1)
- [ ] No janky animations (60fps)
- [ ] Images optimized (WebP/AVIF)
- [ ] Lazy loading on below-fold content
- [ ] No excessive re-renders
- [ ] Bundle size within budget

---

## 11. Cross-Browser QA

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari (latest)
- [ ] Chrome Android (latest)

---

## 12. Sign-Off

- [ ] Visual QA passed
- [ ] State QA passed
- [ ] Animation QA passed
- [ ] Layout QA passed
- [ ] Responsive QA passed
- [ ] RTL QA passed
- [ ] Accessibility QA passed
- [ ] Content QA passed
- [ ] Performance QA passed
- [ ] Cross-browser QA passed
- [ ] Design system compliance verified
- [ ] Ready for production

---

## Cross-References

- See `45-accessibility-checklist.md` for detailed accessibility checks
- See `47-component-acceptance-criteria.md` for component acceptance criteria
- See `46-performance-guidelines.md` for performance budgets
- See `09-interaction-states.md` for state definitions
- See `38-responsive-rules.md` for responsive rules
- See `39-rtl-rules.md` for RTL rules
