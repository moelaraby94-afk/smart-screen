# 15 — Design System Enforcement

> **Status:** FINAL — Rules for strict design system token and component usage

---

## 1. Purpose

Defines the enforcement rules that ensure every line of frontend code strictly follows the Design System V2. No exceptions. Enforced by AI Constitution (Article III).

---

## 2. Token Enforcement

### 2.1 Color Token Rules

| Rule | Status | Enforcement |
|------|--------|-------------|
| Use semantic color tokens (`bg-primary`, `text-foreground`) | MANDATORY | ESLint rule |
| No hardcoded hex colors (`#2563eb`) | FORBIDDEN | ESLint rule |
| No hardcoded rgb/rgba colors | FORBIDDEN | ESLint rule |
| No hardcoded named colors (`blue`, `red`) | FORBIDDEN | ESLint rule |
| No primitive token classes (`bg-blue-600`) | FORBIDDEN | Code review |
| Use `--color-*` tokens in custom CSS | MANDATORY | Code review |

### 2.2 Spacing Token Rules

| Rule | Status | Enforcement |
|------|--------|-------------|
| Use Tailwind spacing classes (`p-4`, `gap-3`, `mt-6`) | MANDATORY | — |
| No hardcoded pixel values (`16px`, `24px`) | FORBIDDEN | ESLint rule |
| No hardcoded rem values (`1rem`, `1.5rem`) | FORBIDDEN | ESLint rule |
| Use `--space-*` tokens in custom CSS | MANDATORY | Code review |

### 2.3 Typography Token Rules

| Rule | Status | Enforcement |
|------|--------|-------------|
| Use Tailwind text size classes (`text-sm`, `text-lg`) | MANDATORY | — |
| Use Tailwind font weight classes (`font-medium`, `font-bold`) | MANDATORY | — |
| Use Tailwind line height classes (`leading-base`, `leading-lg`) | MANDATORY | — |
| No hardcoded font sizes (`14px`, `font-size: 14px`) | FORBIDDEN | ESLint rule |
| No hardcoded font weights (`font-weight: 600`) | FORBIDDEN | ESLint rule |
| Use `--font-sans`, `--font-arabic` for font families | MANDATORY | — |

### 2.4 Other Token Rules

| Category | Rule | Status |
|----------|------|--------|
| Radius | Use `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` | MANDATORY |
| Radius | No hardcoded `border-radius: 8px` | FORBIDDEN |
| Shadow | Use `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` | MANDATORY |
| Shadow | No hardcoded `box-shadow: 0 1px 3px...` | FORBIDDEN |
| Z-Index | Use `z-dropdown`, `z-modal`, `z-toast`, `z-tooltip` | MANDATORY |
| Z-Index | No hardcoded `z-index: 50` | FORBIDDEN |
| Opacity | Use `opacity-50`, `opacity-100` or `/50`, `/100` syntax | MANDATORY |
| Duration | Use `duration-150`, `duration-200`, `duration-300` | MANDATORY |
| Easing | Use `ease-default`, `ease-in`, `ease-out` | MANDATORY |

---

## 3. Component Enforcement

### 3.1 Component Usage Rules

| Rule | Status | Enforcement |
|------|--------|-------------|
| Use DS V2 components for all UI elements | MANDATORY | Code review |
| No custom HTML that replicates a DS V2 component | FORBIDDEN | Code review |
| Use Button component (not `<button>` with custom classes) | MANDATORY | Code review |
| Use Input component (not `<input>` with custom classes) | MANDATORY | Code review |
| Use Card component (not `<div>` with card classes) | MANDATORY | Code review |
| Use Dialog component (not custom modal) | MANDATORY | Code review |
| Use Table component (not custom `<table>`) | MANDATORY | Code review |
| Use Toast component (not custom notification) | MANDATORY | Code review |
| Use EmptyState component for all empty states | MANDATORY | Code review |
| Use ErrorState component for all error states | MANDATORY | Code review |
| Use Skeleton component for all loading states | MANDATORY | Code review |

### 3.2 Variant Enforcement

| Rule | Status |
|------|--------|
| Use only defined variants (per `42-variant-rules.md`) | MANDATORY |
| No custom variants | FORBIDDEN |
| No combining variants | FORBIDDEN |
| Use `variant="default"` explicitly for clarity | RECOMMENDED |

### 3.3 Size Enforcement

| Rule | Status |
|------|--------|
| Use only defined sizes (per `42-variant-rules.md`) | MANDATORY |
| No custom sizes | FORBIDDEN |
| Use `size="default"` explicitly for clarity | RECOMMENDED |

---

## 4. State Enforcement

### 4.1 Required States

Every data-dependent screen MUST implement:

| State | Component | Spec |
|-------|-----------|------|
| Loading | Skeleton or Spinner | `19-loading-states.md` |
| Empty | EmptyState | `18-empty-states.md` |
| Error | ErrorState | `20-error-states.md` |
| Success | Toast | `21-success-states.md`, `24-toast-standards.md` |
| No Results | EmptyState (filtered variant) | `18-empty-states.md` |

### 4.2 State Implementation Rules

- **No missing states** — every screen must have all applicable states
- **No placeholder states** — states must be fully implemented, not TODO
- **No generic messages** — state messages must be specific (per screen spec)
- **No layout shift** — transitions between states must not cause layout shift
- **State transitions** — must follow `09-interaction-states.md` timing

---

## 5. Animation Enforcement

### 5.1 Motion Token Rules

| Rule | Status |
|------|--------|
| Use MI-01 through MI-23 motion inventory items | MANDATORY |
| Use `--duration-*` tokens for durations | MANDATORY |
| Use `--ease-*` tokens for easing functions | MANDATORY |
| No hardcoded durations (`300ms`) | FORBIDDEN |
| No hardcoded easing (`cubic-bezier(...)`) | FORBIDDEN |
| No animations > 600ms (except loops) | FORBIDDEN |
| `prefers-reduced-motion` respected | MANDATORY |

### 5.2 Animation Property Rules

| Rule | Status |
|------|--------|
| Animate only `transform` and `opacity` | MANDATORY |
| No animating `width`, `height`, `margin`, `padding` | FORBIDDEN |
| No animating `top`, `left`, `right`, `bottom` | FORBIDDEN |
| Use `will-change` sparingly (only during active animation) | MANDATORY |
| Remove `will-change` after animation completes | MANDATORY |

---

## 6. Icon Enforcement

### 6.1 Icon Library Rules

| Rule | Status |
|------|--------|
| Use Lucide React for all icons | MANDATORY |
| No other icon libraries | FORBIDDEN |
| No custom SVG icons (unless not available in Lucide) | FORBIDDEN |
| No emoji as icons | FORBIDDEN |
| Use `--icon-*` size tokens | MANDATORY |

### 6.2 Icon Usage Rules

| Rule | Status |
|------|--------|
| Icons match `design-system-v2/05-iconography.md` catalog | MANDATORY |
| Directional icons mirrored in RTL | MANDATORY |
| Non-directional icons NOT mirrored in RTL | MANDATORY |
| Decorative icons have `aria-hidden="true"` | MANDATORY |
| Interactive icons have `aria-label` | MANDATORY |

---

## 7. Layout Enforcement

### 7.1 Grid Rules

| Rule | Status |
|------|--------|
| Use grid patterns from `design-system-v2/02-grid-system.md` | MANDATORY |
| Use container widths from `design-system-v2/02-grid-system.md` | MANDATORY |
| Use column counts per breakpoint from `38-responsive-rules.md` | MANDATORY |
| No arbitrary grid configurations | FORBIDDEN |

### 7.2 Page Padding Rules

| Breakpoint | Padding | Enforcement |
|------------|---------|-------------|
| ≥ 1024px | `p-6` (24px) | MANDATORY |
| 768px–1023px | `p-4` (16px) | MANDATORY |
| < 768px | `p-3` (12px) | MANDATORY |

### 7.3 Layout Pattern Rules

| Rule | Status |
|------|--------|
| Use layout patterns from `design-system-v2/03-layout-system.md` | MANDATORY |
| Use page layout from screen spec | MANDATORY |
| No custom layouts not in design system | FORBIDDEN |

---

## 8. Enforcement Mechanisms

### 8.1 Automated Enforcement

| Mechanism | What It Checks | When |
|-----------|---------------|------|
| ESLint | No hardcoded colors, spacing, font sizes | Pre-commit, CI |
| TypeScript | Component prop types, variant types | Build, CI |
| Tailwind Config | Token mapping, no custom values | Build |
| Lighthouse | Accessibility, performance | CI |
| axe DevTools | WCAG compliance | Development, CI |

### 8.2 Manual Enforcement

| Mechanism | What It Checks | When |
|-----------|---------------|------|
| Code review | Component usage, state implementation, animation | PR review |
| Self-audit | All compliance checklists | Before PR |
| Design QA | Visual compliance, dark mode, RTL | Before release |
| Accessibility audit | WCAG 2.1 AA | Before release |

### 8.3 Enforcement Consequences

| Violation | Consequence |
|-----------|-------------|
| Hardcoded values | PR rejected, must use tokens |
| Missing states | PR rejected, must implement all states |
| Missing accessibility | PR rejected, must meet WCAG 2.1 AA |
| Custom component (duplicate) | PR rejected, must use existing component |
| Undocumented variant | PR rejected, must use defined variant or create ADR |
| No reduced motion | PR rejected, must implement reduced motion fallback |

---

## 9. Design System Compliance Checklist

Before any PR is submitted, verify:

- [ ] All colors use semantic tokens
- [ ] All spacing uses spacing tokens
- [ ] All typography uses text tokens
- [ ] All radii use radius tokens
- [ ] All shadows use shadow tokens
- [ ] All animations use motion tokens
- [ ] All icons from Lucide React
- [ ] All components from DS V2
- [ ] All variants are defined variants
- [ ] All sizes are defined sizes
- [ ] All states implemented (loading, empty, error, success)
- [ ] All animations respect `prefers-reduced-motion`
- [ ] No hardcoded values anywhere
- [ ] No custom components duplicating DS V2
- [ ] No inline styles
- [ ] No CSS-in-JS
- [ ] Layout matches screen spec
- [ ] Grid matches `02-grid-system.md`
- [ ] Responsive matches `38-responsive-rules.md`
- [ ] RTL matches `39-rtl-rules.md`

---

## Cross-References

- See `01-ai-constitution.md` Article III for DS compliance
- See `design-system-v2/44-design-tokens.md` for all tokens
- See `design-system-v2/42-variant-rules.md` for variants
- See `design-system-v2/07-motion-system.md` for motion tokens
- See `design-system-v2/05-iconography.md` for icons
- See `design-system-v2/02-grid-system.md` for grid
- See `design-system-v2/38-responsive-rules.md` for responsive
- See `design-system-v2/39-rtl-rules.md` for RTL
- See `22-self-audit-process.md` for self-audit
- See `23-pr-review-process.md` for PR review
- See `26-anti-patterns.md` for forbidden patterns
