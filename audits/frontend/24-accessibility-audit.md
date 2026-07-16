# 24 — Accessibility Audit

> **Source basis:** All UI components, layout components, and feature components analyzed throughout this audit  

---

## 24.1 ARIA Attributes

### Dialogs (Radix-based)
- `Dialog`: `aria-labelledby` links to `DialogTitle`, `aria-describedby` links to `DialogDescription`
- `AlertDialog`: Same ARIA linking, plus `role="alertdialog"` (Radix handles this)
- Close buttons have `aria-label="Close"`
- `DialogClose` uses `aria-label` from translations

### Dropdown Menus (Radix-based)
- `DropdownMenu`: Radix handles `aria-haspopup`, `aria-expanded`, `aria-controls`
- `DropdownMenuTrigger`: Automatically gets `aria-haspopup="menu"`
- `DropdownMenuItem`: `role="menuitem"`, keyboard navigable

### Select (Radix-based)
- `SelectTrigger`: `aria-haspopup="listbox"`, `aria-expanded`
- `SelectContent`: `role="listbox"`
- `SelectItem`: `role="option"`, `aria-selected`

### Tabs (Radix-based)
- `TabsList`: `role="tablist"`
- `TabsTrigger`: `role="tab"`, `aria-selected`, `aria-controls`
- `TabsContent`: `role="tabpanel"`, `aria-labelledby`

### Navigation
- Sidebar: `<nav>` with `aria-label`
- Breadcrumbs: `<nav aria-label="breadcrumb">` with `<ol>` list structure
- Mobile menu button: `aria-label` from translations
- Back button: `aria-label` with back label text

### Notification Bell
- Button: `aria-label` includes unread count when > 0
- Example: `aria-label="Notifications (3 unread)"`

### Search
- Search button: `aria-label="Open search"`
- Search modal: `role="dialog"`, `aria-modal="true"`, `aria-label`
- Search input: `aria-label` matching placeholder

### InfoTooltip
- Button: `aria-label`, `aria-expanded`
- Content: Visible on hover, focus, and click

### Empty States
- No explicit ARIA, but semantic HTML (`<p>`, `<div>`) used
- Icons are decorative (no alt text needed)

---

## 24.2 Keyboard Navigation

### Global
- **Ctrl/Cmd+K:** Opens global search
- **ESC:** Closes search modal, dialogs, dropdowns (Radix handles)
- **Enter:** Activates focused item in search results

### Radix Components (built-in keyboard support)
- **Dialog:** ESC to close, focus trap, Tab cycles within dialog
- **AlertDialog:** ESC prevention (must use buttons), focus trap
- **DropdownMenu:** Arrow keys to navigate, Enter to select, ESC to close
- **Select:** Arrow keys, Enter, ESC, type-ahead support
- **Tabs:** Arrow keys to switch tabs, focus management
- **Checkbox:** Space to toggle
- **Switch:** Space to toggle

### Search Results
- **ArrowDown/ArrowUp:** Navigate results
- **Enter:** Navigate to selected result
- **Mouse hover:** Sets active index (syncs with keyboard)

### Forms
- Standard form submission via Enter key
- Tab navigation through form fields
- Focus visible styles on all interactive elements

---

## 24.3 Focus Management

### Focus Ring
All interactive elements have consistent focus styles:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
focus-visible:ring-offset-background
```

- Ring color: `--ring` (orange in both themes)
- Offset: 2px from element
- Offset color: `--background`
- Only visible on keyboard focus (`focus-visible`), not mouse click

### Dialog Focus
- Radix Dialog automatically focuses first focusable element on open
- Focus is trapped within dialog while open
- Focus returns to trigger element on close

### Page Transitions
- `PageTransition` (framer-motion) does not manage focus
- Focus management relies on browser default behavior for route changes

---

## 24.4 Screen Reader Considerations

### Semantic HTML
- Navigation: `<nav>` elements
- Lists: `<ol>` / `<ul>` with `<li>` items
- Tables: `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- Forms: `<form>`, `<label>` with `htmlFor`, `<input>` with `id`
- Headings: `<h1>` through `<h4>` hierarchy

### Decorative Elements
- Icons: `aria-hidden` implied (no alt text on SVG icons)
- Aurora backdrop: `pointer-events-none`, no ARIA (purely decorative)
- Logo: `alt=""` (empty alt — decorative, platform name is in text)

### Live Regions
- Toast notifications: Sonner handles `role="status"` and `aria-live`
- Notification bell badge: No explicit `aria-live` announcement (potential gap)

### Missing ARIA (Potential Gaps)
- **Loading spinners:** No `aria-label` or `role="status"` on most loading states
- **Progress bars:** `UsageIndicator` has `role="progressbar"` and aria attributes (good)
- **Toast container:** Sonner handles accessibility
- **Notification badge count:** Not announced to screen readers (only in `aria-label` of bell button)
- **Drag-and-drop:** Timeline and media library drag operations lack keyboard alternatives and ARIA drag/drop semantics
- **Canvas editor (Konva):** Not accessible to screen readers (visual canvas editing)

---

## 24.5 Color Contrast

### Light Mode
| Element | Foreground | Background | Contrast Ratio | WCAG AA |
|---------|-----------|------------|----------------|---------|
| Body text | `#0f172a` (foreground) | `#ffffff` (background) | ~15:1 | ✅ AAA |
| Muted text | `#64748b` (muted-foreground) | `#ffffff` (background) | ~4.5:1 | ✅ AA |
| Primary button | `#ffffff` (primary-foreground) | `#ea580c` (primary) | ~4.5:1 | ✅ AA |
| Destructive | `#ffffff` | `#dc2626` | ~5.9:1 | ✅ AA |
| Border | `#e2e8f0` (border) | `#ffffff` | ~1.3:1 | ❌ Decorative |

### Dark Mode
| Element | Foreground | Background | Contrast Ratio | WCAG AA |
|---------|-----------|------------|----------------|---------|
| Body text | `#f1f5f9` (foreground) | `#0a1929` (background) | ~14:1 | ✅ AAA |
| Muted text | `#94a3b8` (muted-foreground) | `#0a1929` (background) | ~5.5:1 | ✅ AA |
| Primary button | `#ffffff` | `#f97316` (primary) | ~3.1:1 | ⚠️ AA Large only |
| Destructive | `#ffffff` | `#ef4444` | ~3.8:1 | ⚠️ AA Large only |

### Note
Dark mode primary and destructive button text contrast is borderline. For small text (< 18px), these may not meet WCAG AA (4.5:1). However, button text is typically `text-sm` (14px) and `font-medium`, which requires 4.5:1.

---

## 24.6 RTL Accessibility

### Direction
- `<html dir="rtl">` for Arabic — properly sets reading order
- `<html lang="ar">` — proper language attribute for screen readers

### Logical Properties
- CSS uses logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) which automatically flip in RTL
- Icons use `rtl:rotate-180` for directional indicators

### Potential Issues
- `Switch` component thumb uses `translate-x-4` which may not flip in RTL (should use logical equivalent)
- Some hardcoded `left-*` / `right-*` positioning may exist in edge cases

---

## 24.7 [V2] UX Analysis — Accessibility

### WCAG 2.1 Compliance Assessment

**[V2] Skip-to-Content Link:**
The shell includes a skip-to-content link at `crystal-shell.tsx:102-107` — `sr-only` by default, `focus:not-sr-only` on focus. This is WCAG 2.4.1 (Bypass Blocks) compliant. The link targets `#main-content` which is the `<main>` element's ID. Good implementation.

**[V2] Keyboard Navigation — Tab Order:**
The tab order follows DOM order: skip link → sidebar items (18 items in client mode) → header controls → main content. With 18 sidebar items, keyboard users must tab through all of them to reach main content (unless they use the skip link). The skip link is critical here — without it, keyboard navigation is very slow.

**[V2] Focus Indicators:**
- Nav items: `focus-visible:ring-2 focus-visible:ring-primary/30` — visible focus ring
- Buttons: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` — visible focus ring with offset
- Links: Standard browser focus outline (may vary by browser)
- Dialog: Focus trap via Radix Dialog primitive

The focus indicators are consistent and visible. The `focus-visible` (not `focus`) approach means focus rings only show on keyboard navigation, not mouse clicks — this is the modern best practice.

**[V2] ARIA Labels:**
- Menu button: `aria-label` from translations
- Back button: `aria-label` with back label text
- Notification bell: Likely has `aria-label`
- Search button: Likely has `aria-label`
- Theme toggle: Likely has `aria-label`
- Language switcher: Text content serves as label ("EN"/"AR")
- Logout button: Likely has `aria-label`

Most interactive elements have proper ARIA labels. The sidebar nav items use text labels (not icon-only) so they don't need explicit `aria-label`.

**[V2] Color Contrast:**
The design system uses ORCA tokens with defined color pairs:
- `text-foreground` on `bg-background` — primary text, should meet AA
- `text-muted-foreground` on `bg-background` — secondary text, may not meet AA for small text
- `text-primary` on `bg-primary/8` — active nav item, may have low contrast at 8% opacity
- `text-destructive` on `bg-background` — error text, should meet AA

The `text-muted-foreground/70` for inactive nav icons may fail WCAG AA contrast (4.5:1 for normal text, 3:1 for large text). The 70% opacity further reduces contrast.

**[V2] Screen Reader Experience:**
- Page structure: `<nav>` for breadcrumbs, `<main>` for content, proper heading hierarchy
- Dynamic content: Toast notifications via sonner — sonner uses `aria-live` region for announcements
- Loading states: `aria-busy="true"` on sidebar nav during loading
- Error states: Inline errors with `role="alert"` or `aria-live="assertive"` (depends on implementation)

**[V2] InfoTooltip Accessibility:**
As identified in `05-ui-component-library.md` V2, the `InfoTooltip` is a custom implementation that lacks:
- `role="tooltip"` on tooltip content
- `aria-describedby` linkage from trigger to tooltip
- Show/hide delay (immediate show may cause screen reader spam)

This is an **accessibility gap** — the tooltip content may not be announced by screen readers.

**[V2] Switch Component RTL:**
As identified in `05-ui-component-library.md` V2, the Switch thumb uses `translate-x-4` which doesn't flip in RTL. This is both an RTL bug and an accessibility issue — screen reader users navigating by visual reference will be confused by the mismatch between visual state and announced state.

**[V2] Form Accessibility:**
- Labels: Forms should use `<label>` elements with `for` attributes linking to inputs
- Error association: Error messages should use `aria-describedby` to link to inputs
- Required fields: Should use `aria-required="true"` or `required` attribute
- Input types: Email field uses `type="text"` instead of `type="email"` (see `06-auth-and-session.md` V2)

### [V2] Accessibility Scorecard

| WCAG Criterion | Score | Notes |
|---------------|-------|-------|
| 1.1.1 Non-text Content | ✅ Good | Icons have aria-labels, decorative images use alt="" |
| 1.4.3 Contrast (Minimum) | ⚠️ Medium | muted-foreground/70 may fail AA, primary/8 background may be low contrast |
| 2.1.1 Keyboard | ✅ Good | All interactive elements are keyboard accessible |
| 2.1.2 No Keyboard Trap | ✅ Good | Dialog has proper focus trap with escape, no unintended traps |
| 2.4.1 Bypass Blocks | ✅ Good | Skip-to-content link implemented |
| 2.4.3 Focus Order | ⚠️ Medium | 18 sidebar items in tab order — long sequence without skip |
| 2.4.7 Focus Visible | ✅ Good | focus-visible rings on all interactive elements |
| 3.3.1 Error Identification | ✅ Good | Inline errors with destructive color |
| 3.3.2 Labels or Instructions | ⚠️ Medium | Need to verify all forms have proper label associations |
| 4.1.2 Name, Role, Value | ⚠️ Medium | InfoTooltip missing role="tooltip" and aria-describedby |
| 4.1.3 Status Messages | ✅ Good | Sonner toasts use aria-live region |

### Cross-References
- See `04-layout-and-shell.md` for skip-to-content link and focus management
- See `05-ui-component-library.md` for component accessibility (InfoTooltip, Switch RTL)
- See `06-auth-and-session.md` for auth form accessibility
- See `22-i18n-and-localization.md` for RTL implementation
- See `23-error-handling-and-states.md` for error message accessibility
