# 45 — Accessibility Checklist

> **Evidence basis:** `10-accessibility-rules.md`, `09-interaction-states.md`, `07-motion-system.md`, `38-responsive-rules.md`, `39-rtl-rules.md`, `product-architecture/17-product-rules.md` PR-49–PR-50

---

## 1. Purpose

This checklist is used during implementation and QA to verify that every component and page meets WCAG 2.1 Level AA compliance. Every item must be checked before a component or page is considered complete.

---

## 2. Per-Component Checklist

### 2.1 Semantic HTML
- [ ] Uses semantic HTML elements (`<button>`, `<input>`, `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`)
- [ ] No `<div>` with `onClick` when a `<button>` is appropriate
- [ ] Heading hierarchy is correct (h1 → h2 → h3, no skips)
- [ ] Lists use `<ul>`/`<ol>` with `<li>`

### 2.2 ARIA
- [ ] `role` attribute set when semantic HTML is insufficient
- [ ] `aria-label` on icon-only buttons and non-text elements
- [ ] `aria-hidden="true"` on decorative icons
- [ ] `aria-current="page"` on active navigation items
- [ ] `aria-expanded` on dropdowns, dialogs, drawers
- [ ] `aria-selected` on selected items (tabs, table rows)
- [ ] `aria-invalid="true"` on inputs with validation errors
- [ ] `aria-describedby` pointing to error/help text
- [ ] `aria-busy="true"` on elements in loading state
- [ ] `aria-live` on dynamic content (toasts, form errors, loading)

### 2.3 Keyboard Navigation
- [ ] All interactive elements are focusable (`Tab` key)
- [ ] Focus order follows visual reading order (top-to-bottom, left-to-right)
- [ ] `Enter` activates buttons and links
- [ ] `Space` activates buttons, checkboxes, toggles
- [ ] `Escape` closes dialogs, drawers, dropdowns, tooltips
- [ ] Focus trap in dialogs and drawers (Tab cycles within)
- [ ] Focus returns to trigger element when dialog/drawer closes
- [ ] No keyboard traps (user can always Tab out or Escape)
- [ ] Arrow keys navigate within components (tabs, dropdowns, calendars)
- [ ] `tabindex="-1"` on elements that should not be focusable

### 2.4 Focus Visibility
- [ ] Focus ring visible on all interactive elements (`focus-visible`)
- [ ] Focus ring uses `--ring` color (2px, 2px offset)
- [ ] Focus ring is not removed (`outline: none` only with replacement ring)
- [ ] Focus indicator has 3:1 contrast against adjacent background

### 2.5 Color and Contrast
- [ ] Body text contrast ≥ 4.5:1 against background
- [ ] Large text (≥ 18px or ≥ 14px bold) contrast ≥ 3:1
- [ ] UI component borders ≥ 3:1 against background
- [ ] Focus ring ≥ 3:1 against adjacent background
- [ ] Status is not communicated by color alone (icon + text + color)
- [ ] Disabled state uses opacity (not just color change)

### 2.6 Forms
- [ ] Every input has an associated `<label>` (`htmlFor` / `id`)
- [ ] Required fields marked with `*` and `aria-required="true"`
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Error messages are descriptive ("Enter a valid email" not "Invalid")
- [ ] Submit button is disabled during loading (prevent double-submit)
- [ ] Input font size ≥ 16px on mobile (prevent iOS zoom)

### 2.7 Touch Targets
- [ ] Touch targets ≥ 44px × 44px on mobile (< 768px)
- [ ] Touch targets ≥ 36px × 36px on desktop (≥ 768px)
- [ ] Adequate spacing between touch targets (≥ 8px)

### 2.8 Motion and Animation
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] Reduced motion provides instant or fade-only fallback
- [ ] No animation exceeds 600ms (except skeleton/spinner loops)
- [ ] No decorative animations (all animations are functional)
- [ ] No content is communicated by animation alone

### 2.9 Images and Media
- [ ] All images have `alt` text (descriptive for meaningful, empty for decorative)
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Video/audio content has captions or transcript (future)
- [ ] No images of text (use actual text)

### 2.10 Screen Reader
- [ ] Page has logical reading order in DOM
- [ ] Skip link "Skip to main content" at top (future)
- [ ] `aria-live` regions for dynamic updates
- [ ] Loading states announced (`role="status"`, `aria-label="Loading"`)
- [ ] Success/error announced via toast (`role="status"` / `role="alert"`)
- [ ] Dialog/drawer opening announced (`aria-modal="true"`)

---

## 3. Per-Page Checklist

### 3.1 Page Structure
- [ ] One `<h1>` per page
- [ ] Heading hierarchy correct (h1 → h2 → h3)
- [ ] `<main>` wraps main content
- [ ] `<nav>` wraps navigation
- [ ] Breadcrumbs have `aria-label="Breadcrumb"`

### 3.2 States
- [ ] Loading state (skeleton or spinner) implemented
- [ ] Empty state implemented (with CTA where applicable)
- [ ] Error state implemented (with Retry action)
- [ ] No results state implemented (for filtered empty)

### 3.3 Responsive
- [ ] Usable at 320px width
- [ ] No horizontal scroll (except tables/Studio)
- [ ] Touch targets meet minimum size on mobile
- [ ] Dialogs fit within mobile viewport

### 3.4 RTL
- [ ] Layout mirrors correctly in RTL
- [ ] Directional icons mirrored
- [ ] Text alignment is right in RTL
- [ ] No hardcoded `left`/`right` (use logical properties)
- [ ] Arabic font applied for Arabic locale

---

## 4. Automated Testing Tools

| Tool | Purpose | When |
|------|---------|------|
| axe DevTools | Automated WCAG audit | During development |
| Lighthouse | Performance + Accessibility audit | Before release |
| WAVE | Web accessibility evaluation | During QA |
| Keyboard testing | Manual Tab/Shift+Tab/Enter/Escape | Every component |
| Screen reader (NVDA/VoiceOver) | Manual screen reader test | Every page |
| `prefers-reduced-motion` | Manual reduced motion test | Every animated component |

---

## Cross-References

- See `10-accessibility-rules.md` for detailed accessibility rules
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for reduced motion rules
- See `38-responsive-rules.md` for responsive rules
- See `39-rtl-rules.md` for RTL rules
- See `47-component-acceptance-criteria.md` for component acceptance criteria
- See `48-design-qa-checklist.md` for design QA checklist
- See `product-architecture/17-product-rules.md` PR-49–PR-50 for accessibility rules
