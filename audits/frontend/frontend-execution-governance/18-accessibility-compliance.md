# 18 — Accessibility Compliance

> **Status:** FINAL — WCAG 2.1 AA enforcement per component and screen

---

## 1. Purpose

Defines the accessibility compliance rules that MUST be met for every component and screen. This is enforced by the AI Constitution (Article IV, §4.5) and is a release blocker if not met.

---

## 2. WCAG 2.1 Level AA Requirements

### 2.1 Perceivable

#### 1.1 Text Alternatives
- [ ] All images have `alt` text (descriptive for meaningful, empty for decorative)
- [ ] Decorative images have `alt=""` or `aria-hidden="true"`
- [ ] Icon-only buttons have `aria-label`
- [ ] No images of text (use actual text)

#### 1.2 Time-Based Media
- [ ] Video content has captions (future)
- [ ] Audio content has transcript (future)

#### 1.3 Adaptable
- [ ] Semantic HTML used (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`)
- [ ] Heading hierarchy correct (h1 → h2 → h3, no skips)
- [ ] Lists use `<ul>`/`<ol>` with `<li>`
- [ ] Tables use `<table>` with `<thead>`, `<tbody>`, `<th>`, `<td>`

#### 1.4 Distinguishable
- [ ] Body text contrast ≥ 4.5:1 against background
- [ ] Large text (≥ 18px or ≥ 14px bold) contrast ≥ 3:1
- [ ] UI component borders ≥ 3:1 against background
- [ ] Focus ring ≥ 3:1 against adjacent background
- [ ] Color is not the only means of communicating information
- [ ] Disabled state uses opacity (not just color change)
- [ ] No background images behind text without sufficient contrast

### 2.2 Operable

#### 2.1 Keyboard Accessible
- [ ] All interactive elements are focusable (`Tab` key)
- [ ] Focus order follows visual reading order
- [ ] `Enter` activates buttons and links
- [ ] `Space` activates buttons, checkboxes, toggles
- [ ] `Escape` closes dialogs, drawers, dropdowns, tooltips
- [ ] Focus trap in dialogs and drawers (Tab cycles within)
- [ ] Focus returns to trigger element when dialog/drawer closes
- [ ] No keyboard traps (user can always Tab out or Escape)
- [ ] `tabindex="-1"` on elements that should not be focusable
- [ ] Arrow keys navigate within components (tabs, dropdowns, calendars)

#### 2.2 Enough Time
- [ ] No auto-redirecting pages
- [ ] Toast auto-dismiss: 3s (success), 5s (error) — user can dismiss earlier
- [ ] No auto-playing video with audio

#### 2.3 Seizures and Physical Reactions
- [ ] No content flashes more than 3 times per second
- [ ] `prefers-reduced-motion` respected (instant or fade fallback)

#### 2.4 Navigable
- [ ] Skip link "Skip to main content" at top (future)
- [ ] Page has descriptive `<title>`
- [ ] Breadcrumbs have `aria-label="Breadcrumb"`
- [ ] Active navigation item has `aria-current="page"`
- [ ] Multiple ways to reach a page (navigation, search, breadcrumbs)

#### 2.5 Input Modalities
- [ ] Touch targets ≥ 44px × 44px on mobile (< 768px)
- [ ] Touch targets ≥ 36px × 36px on desktop (≥ 768px)
- [ ] Adequate spacing between touch targets (≥ 8px)

### 2.3 Understandable

#### 3.1 Readable
- [ ] Language attribute on `<html>` (`lang="en"` or `lang="ar"`)
- [ ] No unexplained abbreviations
- [ ] Error messages are user-friendly (no technical jargon)

#### 3.2 Predictable
- [ ] No unexpected context changes (no auto-navigation on input)
- [ ] Consistent navigation across pages
- [ ] Consistent button labels for same actions
- [ ] Form submission requires explicit action (no auto-submit)

#### 3.3 Input Assistance
- [ ] Form inputs have associated `<label>` (`htmlFor` / `id`)
- [ ] Required fields marked with `*` and `aria-required="true"`
- [ ] Error messages use `role="alert"` and `aria-live="assertive"`
- [ ] Error messages are descriptive ("Enter a valid email" not "Invalid")
- [ ] Helper text available for complex inputs
- [ ] Input font size ≥ 16px on mobile (prevent iOS zoom)

### 2.4 Robust

#### 4.1 Compatible
- [ ] Valid HTML (no nesting errors)
- [ ] ARIA attributes used correctly (per WAI-ARIA spec)
- [ ] No deprecated HTML attributes
- [ ] Works with screen readers (NVDA, VoiceOver)

#### 4.2 Status Messages
- [ ] `aria-live="polite"` for non-critical updates (loading, empty)
- [ ] `aria-live="assertive"` for critical updates (errors)
- [ ] `role="status"` for loading and empty states
- [ ] `role="alert"` for error messages
- [ ] Toast: `role="status"` (success) or `role="alert"` (error)

---

## 3. ARIA Pattern Reference

### 3.1 Dialog
```
role="dialog"
aria-modal="true"
aria-labelledby="[title-id]"
```

### 3.2 Dropdown Menu
```
trigger: aria-expanded="false" → "true" on open
trigger: aria-haspopup="menu"
menu: role="menu"
item: role="menuitem"
```

### 3.3 Tabs
```
tablist: role="tablist"
tab: role="tab", aria-selected="true/false", aria-controls="[panel-id]"
tabpanel: role="tabpanel", aria-labelledby="[tab-id]"
```

### 3.4 Table
```
table: role="table" (implicit)
header: role="row" (implicit), th: role="columnheader"
body: role="row" (implicit), td: role="cell"
```

### 3.5 Navigation
```
nav: role="navigation", aria-label="[section name]"
active item: aria-current="page"
```

### 3.6 Toggle/Switch
```
role="switch"
aria-checked="true/false"
aria-label="[toggle label]"
```

### 3.7 Toast
```
role="status" (success, info)
role="alert" (error, warning)
aria-live="polite" (success, info)
aria-live="assertive" (error)
```

### 3.8 Loading
```
role="status"
aria-label="Loading"
aria-busy="true" (on container)
```

### 3.9 Empty State
```
role="status"
aria-label="[empty state message]"
```

### 3.10 Error State
```
role="alert"
aria-label="[error message]"
```

---

## 4. Keyboard Navigation Reference

### 4.1 Global Keys
| Key | Action |
|-----|--------|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Enter` | Activate button, link, or submit form |
| `Space` | Activate button, checkbox, or toggle |
| `Escape` | Close dialog, drawer, dropdown, tooltip |

### 4.2 Component-Specific Keys
| Component | Key | Action |
|-----------|-----|--------|
| Tabs | `ArrowLeft/Right` | Navigate between tabs |
| Tabs | `Home/End` | First/Last tab |
| Dropdown | `ArrowUp/Down` | Navigate options |
| Dropdown | `Enter` | Select option |
| Calendar | `ArrowUp/Down` | Navigate weeks |
| Calendar | `ArrowLeft/Right` | Navigate days |
| Calendar | `Enter` | Select date |
| Table (sortable) | `Enter` | Sort column |
| List | `ArrowUp/Down` | Navigate items (future) |

---

## 5. Pre-Validated Contrast Pairs

These pairs are pre-validated for WCAG AA compliance:

| Foreground | Background | Contrast | Use |
|------------|-----------|----------|-----|
| `--foreground` on `--background` | ✅ 12.6:1 | Body text |
| `--foreground` on `--card` | ✅ 12.6:1 | Card text |
| `--muted-foreground` on `--card` | ✅ 4.6:1 | Secondary text |
| `--primary` on `--primary-foreground` | ✅ 4.6:1 | Button text |
| `--destructive` on `--destructive-foreground` | ✅ 4.6:1 | Destructive button |
| `--success` on `--card` | ✅ 3.2:1 | Success text (large/badge) |
| `--warning` on `--card` | ✅ 3.1:1 | Warning text (large/badge) |

**Do not use unvalidated pairs.** If a new pair is needed, verify contrast ratio ≥ 4.5:1 (text) or ≥ 3:1 (UI).

---

## 6. Accessibility Testing

### 6.1 Automated Testing
| Tool | When | What |
|------|------|------|
| axe DevTools | Development | Automated WCAG audit |
| Lighthouse | CI | Accessibility score |
| ESLint jsx-a11y | Pre-commit | Common a11y issues |

### 6.2 Manual Testing
| Test | When | What |
|------|------|------|
| Keyboard only | Every component | Tab, Enter, Space, Escape, arrows |
| Screen reader (NVDA) | Every page | Reading order, ARIA, announcements |
| Screen reader (VoiceOver) | Every page (Mac) | Same as NVDA |
| `prefers-reduced-motion` | Every animated component | Instant/fade fallback |
| High contrast mode | Every screen (future) | Visibility in Windows high contrast |
| Zoom 200% | Every page | No content cut off at 200% zoom |

---

## 7. Accessibility Compliance Checklist

### Per-Component
- [ ] Semantic HTML element used
- [ ] `role` attribute set (if needed)
- [ ] `aria-label` on icon-only elements
- [ ] `aria-hidden` on decorative icons
- [ ] Keyboard: Tab, Enter, Space, Escape work
- [ ] Focus ring visible
- [ ] Contrast ≥ 4.5:1 (text) or ≥ 3:1 (UI)
- [ ] `prefers-reduced-motion` respected
- [ ] Touch target ≥ 44px (mobile)

### Per-Screen
- [ ] One `<h1>` per page
- [ ] Heading hierarchy correct
- [ ] `<main>` wraps content
- [ ] `<nav>` wraps navigation
- [ ] All interactive elements focusable
- [ ] Focus order logical
- [ ] Loading state: `role="status"`
- [ ] Empty state: `role="status"`
- [ ] Error state: `role="alert"`
- [ ] Toast: `role="status"` or `role="alert"`
- [ ] Dialog: `aria-modal="true"`, focus trap, focus restore
- [ ] Screen reader tested
- [ ] Keyboard tested end-to-end
- [ ] Lighthouse Accessibility ≥ 95

---

## Cross-References

- See `01-ai-constitution.md` Article IV §4.5 for accessibility mandate
- See `design-system-v2/10-accessibility-rules.md` for detailed rules
- See `design-system-v2/45-accessibility-checklist.md` for DS checklist
- See `16-screen-compliance-checklist.md` §8 for screen accessibility
- See `22-self-audit-process.md` for self-audit
- See `product-architecture/17-product-rules.md` PR-49, PR-50 for accessibility rules
