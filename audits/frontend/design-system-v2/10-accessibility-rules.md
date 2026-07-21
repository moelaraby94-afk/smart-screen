# 10 — Accessibility Rules

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `09-interaction-states.md`, `ux-blueprint/04-responsive-ux-rules.md` §Accessibility, `product-architecture/17-product-rules.md` PR-49–PR-50, `screen-specifications/01-global-layout-spec.md` through `13-shared-dialogs-specs.md`

---

## 1. Accessibility Philosophy

Smart Screen targets **WCAG 2.1 Level AA** compliance. Accessibility is not an afterthought — it is baked into every component, every interaction, and every state. The design system enforces accessibility through tokens, component specifications, and acceptance criteria.

---

## 2. WCAG 2.1 AA Requirements

### 2.1 Perceivable

| Rule | Requirement | How We Enforce |
|------|-------------|----------------|
| 1.1.1 Non-text Content | All images have `alt` text | Component specs require `alt` on all images |
| 1.3.1 Info and Relationships | Semantic HTML | Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>` |
| 1.3.2 Meaningful Sequence | DOM order matches visual order | Component specs define focus order = visual order |
| 1.4.3 Contrast (Minimum) | 4.5:1 for normal text, 3:1 for large text | Color tokens are pre-validated for contrast |
| 1.4.4 Resize Text | Text scales to 200% | Use `rem` units, not `px` for font sizes |
| 1.4.5 Images of Text | No images of text | Use actual text, not images containing text |
| 1.4.11 Non-text Contrast | 3:1 for UI components and boundaries | Border and icon colors pre-validated |

### 2.2 Operable

| Rule | Requirement | How We Enforce |
|------|-------------|----------------|
| 2.1.1 Keyboard | All functionality available via keyboard | Every component spec includes keyboard behavior |
| 2.1.2 No Keyboard Trap | Focus can leave any component | Dialog/drawer have focus trap with Escape to exit |
| 2.4.3 Focus Order | Focus follows logical sequence | Component specs define Tab order |
| 2.4.7 Focus Visible | Focus indicator is visible | `--ring` token (2px, 2px offset) on all interactive elements |
| 2.5.5 Target Size | 44px minimum touch target on mobile | Breakpoint rules enforce 44px on mobile |

### 2.3 Understandable

| Rule | Requirement | How We Enforce |
|------|-------------|----------------|
| 3.2.1 On Focus | No unexpected context change on focus | Focus only changes visual state, never navigation |
| 3.2.2 On Input | No unexpected context change on input | Form changes don't trigger navigation |
| 3.3.1 Error Identification | Errors are clearly identified | Error state: red border + icon + text message |
| 3.3.2 Labels or Instructions | All inputs have labels | Every `FormField` component requires a label |
| 3.3.3 Error Suggestion | Errors suggest correction | Error messages include fix ("Enter a valid email") |

### 2.4 Robust

| Rule | Requirement | How We Enforce |
|------|-------------|----------------|
| 4.1.2 Name, Role, Value | All UI components have name, role, value | ARIA roles and labels in every component spec |
| 4.1.3 Status Messages | Status messages announced | `aria-live` regions for toasts, form errors, inline messages |

---

## 3. ARIA Patterns

### 3.1 Navigation

| Element | ARIA | Evidence |
|---------|------|----------|
| Sidebar | `role="navigation"`, `aria-label="Main navigation"` | `01-global-layout-spec.md` |
| Sidebar item | `role="link"`, `aria-current="page"` (active) | `01-global-layout-spec.md` |
| Header | `role="banner"` | `01-global-layout-spec.md` |
| Breadcrumbs | `role="navigation"`, `aria-label="Breadcrumb"` | `04-screens-specs.md` |

### 3.2 Main Content

| Element | ARIA | Evidence |
|---------|------|----------|
| Main content | `role="main"` | `01-global-layout-spec.md` |
| Page heading | `<h1>` | All page specs |
| Section heading | `<h2>` | All page specs |
| Card heading | `<h3>` | All card specs |
| Widget | `role="region"`, `aria-label="[Widget Name]"` | `03-overview-spec.md` |

### 3.3 Interactive Elements

| Element | ARIA | Evidence |
|---------|------|----------|
| Button | `role="button"` (or `<button>`), `aria-busy` (loading) | `12-button-specifications.md` |
| Input | `<label>` associated, `aria-invalid` (error), `aria-describedby` (error text) | `13-input-specifications.md` |
| Checkbox | `role="checkbox"`, `aria-checked` | `13-input-specifications.md` |
| Toggle | `role="switch"`, `aria-checked`, `aria-label` | `10-settings-specs-part2.md` |
| Tab | `role="tablist"`, `role="tab"`, `aria-selected` | `05-content-specs.md` |
| Table | `role="table"`, `<thead>`, `<tbody>`, `<th scope>` | `16-tables.md` |
| Dropdown | `role="listbox"`, `role="option"`, `aria-expanded` | `25-navigation-components.md` |

### 3.4 Overlays

| Element | ARIA | Evidence |
|---------|------|----------|
| Dialog | `role="dialog"` or `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby` | `13-shared-dialogs-specs.md` |
| Drawer | `role="dialog"`, `aria-modal="true"` | `01-global-layout-spec.md` |
| Toast | `role="status"`, `aria-live="polite"` | `24-toast-standards.md` |
| Error toast | `role="alert"`, `aria-live="assertive"` | `24-toast-standards.md` |
| Tooltip | `role="tooltip"`, `aria-describedby` on trigger | — |

### 3.5 Status Messages

| Element | ARIA | When |
|---------|------|------|
| Form error | `role="alert"`, `aria-live="assertive"` | On validation failure |
| Success toast | `role="status"`, `aria-live="polite"` | On successful action |
| Error toast | `role="alert"`, `aria-live="assertive"` | On action failure |
| Loading | `aria-busy="true"` on container | During async operations |
| Progress | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` | Progress bars |

---

## 4. Keyboard Navigation

### 4.1 Global Keyboard Shortcuts

| Key | Action | Evidence |
|-----|--------|----------|
| `Tab` | Move focus to next interactive element | Global |
| `Shift+Tab` | Move focus to previous interactive element | Global |
| `Enter` | Activate focused element (button, link, card) | Global |
| `Space` | Activate focused element (button, checkbox, toggle) | Global |
| `Escape` | Close dialog, drawer, dropdown, popover | All overlay specs |
| `Ctrl+K` | (Future) Open command palette | `16-system-flows.md` FL-SYS-03 |

### 4.2 Per-Component Keyboard Behavior

| Component | Key | Action | Evidence |
|-----------|-----|--------|----------|
| Dialog | `Tab` | Focus trap (cycle within dialog) | `13-shared-dialogs-specs.md` |
| Dialog | `Escape` | Close dialog | `13-shared-dialogs-specs.md` |
| Drawer | `Tab` | Focus trap (cycle within drawer) | `01-global-layout-spec.md` |
| Drawer | `Escape` | Close drawer | `01-global-layout-spec.md` |
| Dropdown | `Arrow Down` | Move to next option | `25-navigation-components.md` |
| Dropdown | `Arrow Up` | Move to previous option | `25-navigation-components.md` |
| Dropdown | `Enter` | Select focused option | `25-navigation-components.md` |
| Dropdown | `Escape` | Close without selection | `25-navigation-components.md` |
| Tab list | `Arrow Right` | Move to next tab | `05-content-specs.md` |
| Tab list | `Arrow Left` | Move to previous tab | `05-content-specs.md` |
| Table | `Arrow Down` | Move to next row (future) | `16-tables.md` |
| Table | `Arrow Up` | Move to previous row (future) | `16-tables.md` |
| Studio canvas | `Arrow keys` | Nudge selected layer 1px | `06-studio-spec.md` |
| Studio canvas | `Shift+Arrow` | Nudge selected layer 10px | `06-studio-spec.md` |
| Studio canvas | `Delete` | Delete selected layer | `06-studio-spec.md` |
| Studio canvas | `Ctrl+S` | Save (future) | `06-studio-spec.md` |

### 4.3 Focus Order Rules

- Focus order follows **visual reading order** (top-to-bottom, left-to-right)
- Sidebar → Header → Main content (top-to-bottom)
- Within a page: Page header → Toolbar → Content → Pagination
- Within a dialog: Title → Form fields → Actions (Cancel first, then Confirm)
- Within a form: Top-to-bottom in visual order
- Skip links: (Future) "Skip to main content" link at top of page

---

## 5. Contrast Requirements

### 5.1 Text Contrast

| Text Type | Minimum Contrast | Against |
|-----------|-----------------|---------|
| Body text (< 18px) | 4.5:1 | Background |
| Large text (≥ 18px or ≥ 14px bold) | 3:1 | Background |
| Disabled text | Not required (exempt) | — |
| Placeholder text | 4.5:1 | Input background |

### 5.2 UI Component Contrast

| Element | Minimum Contrast | Against |
|---------|-----------------|---------|
| Button background | 3:1 | Adjacent background |
| Input border | 3:1 | Input background |
| Focus ring | 3:1 | Adjacent background |
| Status badge | 3:1 | Badge background |
| Icon (meaningful) | 3:1 | Background |
| Icon (decorative) | Not required (aria-hidden) | — |

### 5.3 Pre-Validated Token Pairs

| Foreground | Background | Ratio | Status |
|------------|-----------|-------|--------|
| `--foreground` on `--background` | `--gray-900` on `--gray-50` | 15:1 | ✅ AAA |
| `--muted-foreground` on `--background` | `--gray-500` on `--gray-50` | 4.6:1 | ✅ AA |
| `--primary-foreground` on `--primary` | `--white` on `--blue-600` | 5.2:1 | ✅ AA |
| `--destructive-foreground` on `--destructive` | `--white` on `--red-500` | 4.3:1 | ✅ AA |
| `--card-foreground` on `--card` | `--gray-900` on `--white` | 18:1 | ✅ AAA |

---

## 6. Touch Targets

| Breakpoint | Minimum Size | Evidence |
|------------|-------------|----------|
| Mobile (< 768px) | 44px × 44px | PR-45 |
| Desktop (≥ 768px) | 36px × 36px | PR-45 |
| Sidebar items (mobile drawer) | 44px height | `01-global-layout-spec.md` |
| Sidebar items (desktop) | 36px height | `01-global-layout-spec.md` |
| Buttons (mobile) | 44px height | `12-button-specifications.md` |
| Buttons (desktop, default) | 36px height | `12-button-specifications.md` |
| Buttons (desktop, large) | 40px height | `12-button-specifications.md` |
| Checkboxes | 20px + 12px padding = 32px total | `13-input-specifications.md` |

---

## 7. Screen Reader Considerations

### 7.1 Live Regions

| Region | `aria-live` | `aria-atomic` | Usage |
|--------|-------------|---------------|-------|
| Toast container | `polite` (info/success), `assertive` (error) | `true` | Toast notifications |
| Form error | `assertive` | `true` | Inline form validation errors |
| Notification badge | `polite` | `true` | Bell badge count update |
| Loading state | `polite` | `true` | Loading announcements |

### 7.2 Hidden Content

| Technique | When | Method |
|-----------|------|--------|
| Visually hidden | Screen reader only | `.sr-only` class |
| aria-hidden | Decorative only | `aria-hidden="true"` |
| `display: none` | Completely hidden | Both visual and SR |
| `tabindex="-1"` | Remove from tab order | Keep visible, not focusable |

### 7.3 Dynamic Content

- When content updates dynamically (SWR revalidation, Socket.IO), use `aria-live` regions to announce changes
- When a list updates (item added/removed), the screen reader should announce the change
- When a dialog opens, focus moves to the dialog; when it closes, focus returns to trigger element

---

## 8. Reduced Motion

All animations must respect `prefers-reduced-motion: reduce`. See `07-motion-system.md` §4 for the complete reduced motion mapping.

---

## Cross-References

- See `01-foundations.md` for color tokens (contrast-validated)
- See `07-motion-system.md` §4 for reduced motion rules
- See `09-interaction-states.md` for focus and disabled state rules
- See `45-accessibility-checklist.md` for the comprehensive accessibility checklist
- See `ux-blueprint/04-responsive-ux-rules.md` §Accessibility for responsive accessibility
- See `product-architecture/17-product-rules.md` PR-49–PR-50 for accessibility rules
- See all `screen-specifications/` files for per-screen accessibility specs
