# 07 — Accessibility Audit

> **Evidence basis:** `globals.css`, `button.tsx`, `shell-sidebar.tsx`, `header.tsx`, `crystal-shell.tsx`, feature client components

---

## 1. Keyboard Navigation

### 1.1 Good Patterns
- **Button** component: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2` — visible focus ring
- **Sidebar NavItem**: Active state with `aria-current="page"` on active links
- **Header menu button**: `aria-label={t('toggleMenu')}` for mobile nav toggle
- **Back button**: `aria-label={backLabel}` for screen reader
- **Radix-based components**: Dialog, DropdownMenu, AlertDialog, Select, Tabs, Switch — all have built-in keyboard support

### 1.2 Issues
- **No skip-to-content link verification** — CrystalShell may have one but styling/visibility on focus unclear
- **No keyboard shortcut for search** — Global Search exists but no Ctrl+K handler visible in header
- **Tab order in modals** — Screen Setup Modal uses custom logic; focus trap may not work correctly
- **No arrow key navigation in screen cards grid** — cards are focusable but no grid navigation pattern

---

## 2. ARIA Implementation

### 2.1 Good Patterns
- `aria-label` on icon-only buttons (menu toggle, back, close)
- `aria-busy` on loading buttons
- `aria-disabled` on disabled buttons
- `aria-current="page"` on active sidebar items
- Radix components provide correct ARIA roles automatically

### 2.2 Issues
- **No aria-live regions** — Realtime screen status updates, toast notifications, and dynamic content changes don't announce to screen readers
- **Form controls missing labels** — Some native `<select>` elements lack `aria-label` or associated `<label>`
- **Tab panels** — Content tabs use Radix Tabs which handle ARIA, but custom tab implementations may not
- **Status badges** — Screen status badges (ONLINE/OFFLINE/MAINTENANCE) use color only; no `aria-label` or text alternative for screen readers
- **Loading states** — Text loading ("Loading…") not in aria-live region; screen readers don't announce when loading completes

---

## 3. Color Contrast

### 3.1 Critical Failures
| Token | Foreground | Background | Ratio | WCAG AA (4.5:1) |
|-------|-----------|------------|-------|-----------------|
| `--muted-foreground` on `--background` | #6b7280 | #f9fafb | ~4.3:1 | ❌ Fail |
| `--muted-foreground` on `--card` | #6b7280 | #ffffff | ~4.0:1 | ❌ Fail |

### 3.2 Passing
| Token | Foreground | Background | Ratio | WCAG AA |
|-------|-----------|------------|-------|---------|
| `--foreground` on `--background` | #111827 | #f9fafb | ~15:1 | ✅ |
| `--primary` on `--primary-foreground` | #2563eb | #ffffff | ~5.2:1 | ✅ |
| `--destructive` on `--destructive-foreground` | #ef4444 | #ffffff | ~3.8:1 | ⚠️ Borderline |

### 3.3 Recommendations
- Darken `--muted-foreground` from Gray-500 (#6b7280) to Gray-600 (#4b5573) — achieves ~5.9:1
- Or use `--muted-foreground` only for large text (≥18px) where 3:1 suffices

---

## 4. Motion and Animation

### 4.1 Current State
- Framer Motion used for page transitions, overview hero, card animations
- CSS transitions on buttons, cards, table rows
- No `prefers-reduced-motion` media query

### 4.2 Required
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```
And conditionally disable Framer Motion animations based on user preference.

---

## 5. Screen Reader Experience

### 5.1 Page Structure
- **Heading hierarchy:** Pages use `<h1>` for page title, `<h2>` for section headers — good
- **Landmarks:** `<header>`, `<main>`, `<nav>` used in shell — good
- **Sidebar:** `<nav>` with `aria-label` — good

### 5.2 Dynamic Content
- **Realtime updates:** Screen status changes via socket.io — no aria-live announcement
- **Toast notifications:** Sonner toasts — may have aria-live but not verified
- **Loading states:** No announcement when loading starts/ends
- **Form errors:** Inline error messages may not be associated with inputs via `aria-describedby`

### 5.3 Tables
- **Table component:** Uses semantic `<table>`, `<thead>`, `<tbody>`, `<th>`, `<tr>`, `<td>` — good
- **No `scope` on `<th>`** — TableHead doesn't include `scope="col"` or `scope="row"`
- **No `caption`** — Tables lack descriptive captions

---

## 6. Forms

### 6.1 Good Patterns
- **Label component** exists in design system
- **Input component** has consistent styling
- **Error states** — some forms show error messages

### 6.2 Issues
- **Label association** — not all inputs use `<Label>` with `htmlFor`
- **Error messages** — not always linked via `aria-describedby`
- **Required fields** — no `aria-required` or visual indicator
- **Form validation** — client-side validation messages not announced to screen readers
- **Password fields** — no password strength indicator for accessibility

---

## 7. Images and Media

### 7.1 Issues
- **Media thumbnails** — `<img>` tags may lack `alt` text
- **Icons** — Lucide icons are decorative; `aria-hidden` used on Button icons ✅
- **Empty state illustrations** — may lack `alt` text or `role="img"`

---

## 8. Touch Targets

### 8.1 Current State
- **Button sizes:** default (h-9), sm (h-8), icon (h-9 w-9) — minimum 32px height
- **WCAG 2.5.5 recommends 44x44px** — `sm` buttons at 32px fail this

### 8.2 Recommendation
- Increase `sm` button to `h-10` (40px) or ensure `default` is used for touch interfaces
- Icon-only buttons should be at least 44x44px on mobile

---

## 9. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Keyboard navigation | 7/10 | Focus rings present, some gaps in modals |
| ARIA implementation | 5/10 | Good on buttons, missing on dynamic content |
| Color contrast | 5/10 | muted-foreground fails AA |
| Motion preferences | 3/10 | No reduced-motion support |
| Screen reader | 6/10 | Good structure, missing dynamic announcements |
| Forms | 5/10 | Label association gaps |
| Touch targets | 6/10 | sm buttons too small |
| **Overall** | **5.3/10** | **Significant WCAG gaps** |
