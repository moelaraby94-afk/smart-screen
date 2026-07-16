# Design System Direction

> **Evidence basis:** `02-design-system-and-tokens.md`, `05-ui-component-library.md`, `26-consistency-audit.md`, `24-accessibility-audit.md`, `25-responsive-audit.md`
> **Purpose:** Define the standardization direction for the design system — not visual redesign, but structural and consistency direction

---

## 1. Current Design System State

### 1.1 Foundation

| Aspect | Current State | Evidence |
|--------|--------------|----------|
| Token system | ✅ CSS custom properties with semantic mapping | `02-design-system-and-tokens.md` §2.20 |
| Dark mode | ✅ `next-themes` with `class` strategy | `02-design-system-and-tokens.md` §2.20 |
| RTL support | ✅ Tailwind logical properties (`ms-`, `ps-`, `start-`) | `22-i18n-and-localization.md` §22.8 |
| Component library | ✅ Radix UI primitives + custom components | `01-architecture-and-stack.md` §1.6 |
| Variant management | ✅ CVA for Button, Badge | `02-design-system-and-tokens.md` §2.6 |
| Icon library | ✅ lucide-react | `02-design-system-and-tokens.md` §2.15 |

### 1.2 Inconsistencies

| Issue | Current | Target | Evidence |
|-------|---------|--------|----------|
| Icon stroke width | 3 values (1.5, 1.6, 2.0) | 1 value | `26-consistency-audit.md` §26.6 |
| Loading patterns | 3 patterns (skeleton, spinner, text) | 2 patterns (skeleton for page, spinner for action) | `23-error-handling-and-states.md` §23.9 |
| Icon duplication | Clapperboard for Playlists + Studio | Distinct icons | `26-consistency-audit.md` §26.6 |
| Button touch targets | 36-40px (below 44px) | 44px minimum on mobile | `24-accessibility-audit.md` §24.7 |
| Color contrast | `muted-foreground/70` may fail AA | Meet AA (4.5:1) | `24-accessibility-audit.md` §24.7 |
| Responsive grids | Different column counts per feature | Standardized grid patterns | `25-responsive-audit.md` §25.7 |
| AuroraBackdrop | Dead code (defined but not rendered) | Either render or remove | `04-layout-and-shell.md` §4.8 |

---

## 2. Design System Standardization Direction

### 2.1 Token Standardization

**No new tokens needed.** The existing ORCA token system is well-structured:
- Semantic tokens (`--primary`, `--destructive`, `--muted`, `--accent`) correctly map to CSS custom properties
- Dark mode overrides work via `.dark` selector
- RTL support via logical properties

**Adjustments needed:**
- `--muted-foreground` opacity: Ensure 70% opacity meets AA contrast or adjust to higher opacity
- `--primary` at 8% opacity (active nav background): Verify contrast ratio and adjust if needed

### 2.2 Component Standardization

#### Loading States

**Standard:**
- **Page-level loading:** Skeleton components matching the page layout
- **Action-level loading:** Spinner (`Loader2` with `animate-spin`) inside buttons
- **Full-page gate:** Centered spinner (`Loader2` at `h-10 w-10`) with optional message

**Pattern:**
```
PageLevelSkeleton → matches page layout (card grid, list, form)
ActionLevelSpinner → inside button, replaces icon
FullPageGate → centered spinner for auth/gate states
```

**Eliminate:** Text-only "Loading..." messages. Replace with skeleton or spinner.

#### Empty States

**Standard:** `EmptyState` component for all empty state scenarios.

**Variants needed:**
- `first-use` — "You haven't added any screens yet" + CTA
- `no-results` — "No screens match your search" + clear filters
- `error` — "Something went wrong" + retry
- `permission` — "You don't have permission to view this"

#### Error States

**Standard:**
- **Inline errors:** Below form fields, `text-destructive text-sm`
- **Toast errors:** `toast.error()` with localized message
- **Page errors:** Error boundary with "Try Again" button
- **API errors:** `toastResponseError()` reads envelope and shows localized error

**No changes needed to error state pattern** — the three-tier system is well-designed.

### 2.3 Icon Standardization

**Standard:**
- Single `ICON_STROKE` constant for all icons
- Value: `1.5` (current EmptyState value — most widely used)
- Sidebar `STROKE` constant (1.6) → unified to `1.5`
- Icons that used default `2.0` → unified to `1.5`

**Icon governance:**
- Each feature concept gets a unique icon
- `Clapperboard` → Playlists only
- Studio → `Paintbrush` or `PencilRuler` or `PenTool`
- Icon choices documented in design system

### 2.4 Typography Standardization

**Current:**
- English: System font stack (no custom font)
- Arabic: Cairo font via `next/font`

**Direction:** Maintain current approach — system fonts for English (performance), Cairo for Arabic (readability). No change needed.

**Adjustments:**
- Ensure consistent font sizes across features
- Document the type scale in the design system

### 2.5 Spacing Standardization

**Current:** Consistent padding scales (`px-4 sm:px-6 lg:px-10` for shell, `px-3 py-2` for nav items)

**Direction:** Maintain current spacing. Document the spacing scale:
- Page padding: `px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12`
- Nav item padding: `px-3 py-2`
- Card padding: `p-6`
- Dialog padding: `p-6`

### 2.6 Border Radius Standardization

**Current:** `rounded-xl` (12px) dominant, `rounded-2xl` (16px) for dialogs, `rounded-full` for badges

**Direction:** Maintain current radius scale. No changes needed.

### 2.7 Z-Index Standardization

**Current:** Well-organized z-index stack

| Layer | Z-Index |
|-------|---------|
| Aurora backdrop | `-z-10` |
| Sidebar (desktop) | `z-40` |
| Header | `z-[55]` |
| Mobile nav backdrop | `z-[59]` |
| Mobile nav overlay | `z-[60]` |
| Dialog overlay | `z-[110]` |
| Dialog content | `z-[111]` |
| Dropdown menu | `z-[120]` |

**Direction:** Maintain current z-index stack. Document as constants to prevent ad-hoc z-index values.

---

## 3. Component Gaps

### 3.1 Missing Components (from `05-ui-component-library.md` §6.10)

| Component | Priority | Used For | Replacement |
|-----------|----------|----------|-------------|
| Toast | Already have (sonner) | — | — |
| Avatar | Medium | User menu, team members | Currently using custom |
| Popover | Medium | Filters, info panels | Currently using DropdownMenu |
| Calendar | Medium | Schedule date picker | Currently using custom |
| DatePicker | Medium | Schedule forms | Currently using custom |
| Command (cmdk) | Low | Search palette | Currently using custom modal |
| Tooltip (Radix) | High | Replace InfoTooltip | `@radix-ui/react-tooltip` needed |
| Checkbox (bulk select) | High | Bulk operations | Already have Radix Checkbox |
| Pagination | Medium | List views | Not implemented |
| Progress | Low | Upload progress | Not implemented |
| Drawer/Sheet | Low | Mobile filters | Not implemented |

### 3.2 Component Improvements

| Component | Issue | Direction |
|-----------|-------|-----------|
| Button | Touch target < 44px | Add `min-h-[44px]` on mobile |
| Switch | RTL bug | Fix `translate-x` to use logical property |
| InfoTooltip | No ARIA | Replace with Radix Tooltip |
| EmptyState | No variants | Add variant prop (first-use, no-results, error, permission) |
| Table | No bulk select | Add row selection support |
| Badge | Good | No changes needed |

---

## 4. Accessibility Direction

### 4.1 WCAG 2.1 AA Targets

| Criterion | Current | Target | Action |
|-----------|---------|--------|--------|
| 1.1.1 Non-text Content | ✅ Good | ✅ Good | Maintain |
| 1.4.3 Contrast (Minimum) | ⚠️ Medium | ✅ AA | Adjust muted-foreground opacity |
| 2.1.1 Keyboard | ✅ Good | ✅ Good | Maintain |
| 2.1.2 No Keyboard Trap | ✅ Good | ✅ Good | Maintain |
| 2.4.1 Bypass Blocks | ✅ Good | ✅ Good | Maintain skip-to-content |
| 2.4.3 Focus Order | ⚠️ Medium | ✅ Good | Reduce sidebar items via grouping |
| 2.4.7 Focus Visible | ✅ Good | ✅ Good | Maintain focus-visible rings |
| 2.5.5 Target Size | ⚠️ Medium | ✅ AA | Increase button sizes on mobile |
| 3.3.1 Error Identification | ✅ Good | ✅ Good | Maintain |
| 3.3.2 Labels or Instructions | ⚠️ Medium | ✅ Good | Audit all forms for label associations |
| 4.1.2 Name, Role, Value | ⚠️ Medium | ✅ Good | Replace InfoTooltip with Radix |
| 4.1.3 Status Messages | ✅ Good | ✅ Good | Maintain sonner aria-live |

### 4.2 RTL Direction

| Issue | Action |
|-------|--------|
| Switch `translate-x` bug | Fix with logical property or `rtl:` variant |
| Verify all new components work in RTL | Add RTL to QA checklist |
| Add RTL-specific tests | Include in test coverage |

---

## 5. Design System Governance

### 5.1 Component Creation Checklist

New components must:
- [ ] Use semantic design tokens (not raw colors)
- [ ] Support dark mode (test in both themes)
- [ ] Support RTL (test in Arabic)
- [ ] Meet WCAG AA contrast
- [ ] Have `focus-visible` styling
- [ ] Use `ICON_STROKE` constant for icons
- [ ] Follow spacing scale
- [ ] Follow border radius scale
- [ ] Follow z-index scale
- [ ] Have ARIA attributes where needed
- [ ] Meet 44px touch target on mobile

### 5.2 Design System Documentation

The design system should be documented with:
- Token reference (all CSS custom properties)
- Component catalog (all components with props and variants)
- Pattern catalog (loading, empty, error states)
- Icon registry (which icon for which concept)
- Spacing scale
- Z-index scale
- Accessibility checklist

---

## 6. Design System Phase Plan

| Phase | Action | Priority |
|-------|--------|----------|
| Phase 1 | Fix Switch RTL, unify stroke width, fix contrast, fix touch targets, replace InfoTooltip | High |
| Phase 2 | Add Tooltip (Radix), add Avatar, add Pagination | Medium |
| Phase 3 | Add Calendar/DatePicker, add Popover | Medium |
| Phase 4 | Add bulk-select Table, add Progress, add Drawer/Sheet | Medium |
| Phase 5 | Document design system, create component checklist | High |

---

## Cross-References

- See `02-design-system-and-tokens.md` (audit) for current token definitions
- See `05-ui-component-library.md` (audit) for component-level analysis
- See `15-component-strategy.md` for component architecture strategy
- See `24-accessibility-audit.md` (audit) for WCAG compliance details
- See `26-consistency-audit.md` (audit) for consistency scorecard
