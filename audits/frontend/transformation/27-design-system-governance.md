# Design System Governance

> **Evidence basis:** `02-design-system-and-tokens.md`, `05-ui-component-library.md`, `14-design-system-direction.md`, `15-component-strategy.md`, `26-consistency-audit.md`, `24-accessibility-audit.md`
> **Purpose:** Permanent rules governing the design system — component lifecycle, naming, tokens, variants, deprecation, contribution, review, accessibility, visual consistency, responsive behavior, and animation

---

## 1. Component Lifecycle

### 1.1 Lifecycle Stages

Every component moves through these stages:

| Stage | Description | Criteria to Advance |
|-------|-------------|---------------------|
| **Proposed** | Component does not exist yet. A need has been identified. | Need documented with evidence. Use case defined. |
| **Experimental** | Component is being built. Not yet in production. | Radix primitive identified (if interactive). CVA variants defined. Accessibility checklist passed. |
| **Stable** | Component is in production. Used across the product. | Code review approved. Unit tests written. Documentation added. Accessibility verified. |
| **Deprecated** | Component is being phased out. Still functional but should not be used in new code. | Replacement component exists. Deprecation notice added to component file. Migration guide written. |
| **Removed** | Component is deleted from the codebase. | All usages migrated to replacement. Deprecation period elapsed (minimum 2 release cycles). |

### 1.2 Lifecycle Rules

- **No component skips stages.** A component cannot go from Proposed directly to Stable.
- **Experimental components must not be used in production pages.** They may be used in isolated development environments only.
- **Deprecated components must display a console warning in development:** `Warning: [ComponentName] is deprecated. Use [ReplacementName] instead. See migration guide: [link].`
- **Removal requires zero usages.** Run `grep_search` for the component name before removal. Zero results required.
- **Each component file must include a lifecycle stage comment at the top:**
  ```ts
  /**
   * @component Button
   * @stage Stable
   * @last-reviewed 2026-07-16
   */
  ```

### 1.3 Component Ownership

| Component Category | Owner | Reviewers |
|---------------------|-------|-----------|
| UI primitives (Button, Input, Dialog, etc.) | Frontend Lead | Design Lead, another Frontend Engineer |
| Feature components (ScreenCard, PlaylistCard, etc.) | Feature Engineer | Frontend Lead |
| Layout components (ShellSidebar, ShellHeader, etc.) | Frontend Lead | Design Lead |
| Provider components (WorkspaceProvider, etc.) | Frontend Lead | Tech Lead |

---

## 2. Naming Conventions

### 2.1 Component Naming

| Type | Convention | Example |
|------|-----------|---------|
| UI primitive | `PascalCase`, single noun | `Button`, `Input`, `Dialog` |
| UI primitive with variants | `PascalCase`, noun + qualifier | `AlertDialog`, `DropdownMenu` |
| Feature component | `PascalCase`, domain + noun | `ScreenCard`, `PlaylistCard`, `MediaGrid` |
| Layout component | `PascalCase`, shell + noun | `ShellSidebar`, `ShellHeader`, `CrystalShell` |
| Provider | `PascalCase`, domain + "Provider" | `WorkspaceProvider`, `NotificationProvider` |
| Hook | `use` + `camelCase` | `useShellHeaderMeta`, `useApiScreens` |
| Context | `PascalCase`, domain + "Context" | `WorkspaceContext`, `AuthContext` |
| Utility | `camelCase` | `toastResponseError`, `apiFetch` |
| Constant | `UPPER_SNAKE_CASE` | `ICON_STROKE`, `MAX_NOTIFICATIONS` |
| Type/Interface | `PascalCase` | `Workspace`, `Screen`, `Playlist` |

### 2.2 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Component file | `kebab-case.tsx` | `button.tsx`, `screen-card.tsx` |
| Hook file | `use-*.ts` | `use-shell-header-meta.ts` |
| Provider file | `*-provider.tsx` | `workspace-provider.tsx` |
| Utility file | `kebab-case.ts` | `api-fetch.ts`, `toast-response-error.ts` |
| Type file | `kebab-case.ts` | `workspace.ts`, `screen.ts` |
| Test file | `*.test.tsx` or `*.test.ts` | `button.test.tsx`, `use-shell-header-meta.test.ts` |
| Story file (if added) | `*.stories.tsx` | `button.stories.tsx` |

### 2.3 Translation Key Naming

| Type | Convention | Example |
|------|-----------|---------|
| Page title | `pageTitles.{pageName}` | `pageTitles.screens`, `pageTitles.scheduleCreate` |
| Action button | `actions.{actionName}` | `actions.addScreen`, `actions.publish` |
| Form label | `forms.{formName}.{field}` | `forms.scheduleCreate.name`, `forms.scheduleCreate.playlist` |
| Error message | `errorCodes.{code}` | `errorCodes.workspaceNotFound`, `errorCodes.screenOffline` |
| Toast message | `toasts.{toastName}` | `toasts.screenDeleted`, `toasts.playlistPublished` |
| Empty state | `emptyStates.{context}` | `emptyStates.noScreens`, `emptyStates.noResults` |
| Nav item | `nav.{itemName}` | `nav.overview`, `nav.screens`, `nav.playlists` |

### 2.4 Route Naming

| Type | Convention | Example |
|------|-----------|---------|
| List page | `/{locale}/{resource}` | `/en/screens`, `/ar/playlists` |
| Detail page | `/{locale}/{resource}/{id}` | `/en/screens/abc-123` |
| Create page | `/{locale}/{resource}/create` | `/en/playlists/create` |
| Settings sub-page | `/{locale}/settings/{section}` | `/en/settings/profile`, `/en/settings/billing` |
| Admin page | `/{locale}/admin/{section}` | `/en/admin/customers`, `/en/admin/fleet` |

---

## 3. Token Rules

### 3.1 Token Hierarchy

```
Layer 1: Raw values (CSS custom properties in :root)
  --color-primary-500: #6366f1;
  --color-gray-100: #f3f4f6;

Layer 2: Semantic tokens (map to raw values)
  --primary: var(--color-primary-500);
  --muted: var(--color-gray-100);

Layer 3: Component tokens (map to semantic tokens)
  --button-bg: var(--primary);
  --input-border: var(--border);
```

### 3.2 Token Rules

- **Never use raw color values in components.** Always use semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`).
- **Never hardcode hex values in component files.** All colors must go through the token system.
- **New tokens require design review.** Do not add CSS custom properties without approval.
- **Dark mode tokens must be defined in `.dark` selector.** Every semantic token must have a light and dark value.
- **RTL must not require separate tokens.** Logical properties handle direction. No `rtl-primary` or similar.
- **Token names must be semantic, not descriptive.** Use `--destructive` not `--red-500`. Use `--muted-foreground` not `--gray-500`.

### 3.3 Current Token Inventory

The following semantic token categories exist (`02-design-system-and-tokens.md` §2.20):

| Category | Tokens | Status |
|----------|--------|--------|
| Background | `--background`, `--card`, `--popover`, `--primary` | ✅ Stable |
| Foreground | `--foreground`, `--muted-foreground`, `--primary-foreground` | ✅ Stable |
| Border | `--border`, `--input`, `--ring` | ✅ Stable |
| Accent | `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground` | ✅ Stable |
| Muted | `--muted`, `--muted-foreground` | ✅ Stable |
| Secondary | `--secondary`, `--secondary-foreground` | ✅ Stable |

**Rule:** No new token categories without design review. New tokens within existing categories are acceptable if they follow the naming convention.

---

## 4. Variant Rules

### 4.1 CVA Variant Structure

All variant-bearing components must use CVA with the following structure:

```ts
const componentVariants = cva("base-classes", {
  variants: {
    variant: { default: "...", destructive: "...", outline: "...", ... },
    size: { sm: "...", default: "...", lg: "...", icon: "..." },
  },
  defaultVariants: { variant: "default", size: "default" },
});
```

### 4.2 Standard Variant Names

| Variant Name | Usage | Color Mapping |
|-------------|-------|---------------|
| `default` | Primary action | `bg-primary text-primary-foreground` |
| `destructive` | Delete, remove, dangerous actions | `bg-destructive text-destructive-foreground` |
| `outline` | Secondary action, alternative to default | `border border-input bg-background` |
| `secondary` | Tertiary action | `bg-secondary text-secondary-foreground` |
| `ghost` | No background, hover only | `hover:bg-accent hover:text-accent-foreground` |
| `link` | Inline link appearance | `text-primary underline-offset-4 hover:underline` |

### 4.3 Standard Size Names

| Size Name | Height | Usage |
|-----------|--------|-------|
| `sm` | `h-8` (32px) | Compact UI, inline actions |
| `default` | `h-10` (40px) | Standard buttons, form actions |
| `lg` | `h-12` (48px) | Prominent CTAs, onboarding |
| `icon` | `h-10 w-10` (40px) | Icon-only buttons |

**Mobile rule:** On screens < `sm` (640px), all interactive elements must have a minimum touch target of 44×44px. Use `min-h-[44px] min-w-[44px]` on mobile.

### 4.4 Variant Rules

- **Variant names must be consistent across components.** If Button has `destructive`, Badge must also have `destructive` (if applicable).
- **Default variants must be explicit.** Never rely on implicit defaults. Always set `defaultVariants` in CVA config.
- **No ad-hoc variant props.** Do not pass conditional className strings for variants. Use CVA.
- **Variant combinations must be tested.** Every `variant × size` combination must render correctly.

---

## 5. Deprecation Policy

### 5.1 Deprecation Process

1. **Identify replacement.** A component cannot be deprecated without a replacement (or a decision that the functionality is no longer needed).
2. **Add deprecation notice.** Add `@deprecated Use [Replacement] instead.` JSDoc tag to the component.
3. **Add console warning.** In development mode, log: `Warning: [ComponentName] is deprecated. Use [ReplacementName] instead.`
4. **Write migration guide.** Document how to migrate from the deprecated component to the replacement.
5. **Monitor usages.** Run `grep_search` periodically to track remaining usages.
6. **Remove after 2 release cycles.** Once zero usages remain, remove the component file.

### 5.2 Current Deprecation Candidates

| Component | Replacement | Status | Evidence |
|-----------|-------------|--------|----------|
| `InfoTooltip` | `Tooltip` (Radix-based) | Pending Phase 1 | P-005, DD-05 |
| `AuroraBackdrop` | None (dead code) | Pending Phase 1 | TD-004 |

### 5.3 Deprecation Rules

- **Never break deprecated components.** They must remain functional until removed.
- **Deprecated components must not receive new features.** Bug fixes only.
- **New code must not use deprecated components.** Code review must reject new usages.
- **Deprecation period is minimum 2 release cycles** (approximately 4-8 weeks).

---

## 6. Contribution Rules

### 6.1 Who Can Contribute

| Role | Can Create Components | Can Modify Components | Can Delete Components |
|------|---------------------|----------------------|----------------------|
| Frontend Lead | ✅ Yes | ✅ Yes | ✅ Yes (with review) |
| Frontend Engineer | ✅ Yes (with review) | ✅ Yes (with review) | ❌ No (propose to Lead) |
| Design Lead | ❌ No (propose to Frontend Lead) | ❌ No (propose changes) | ❌ No |
| Backend Engineer | ❌ No | ❌ No | ❌ No |

### 6.2 Contribution Process

1. **Identify need.** Document the use case and evidence (per PP-13).
2. **Check for existing component.** Search `apps/dashboard/src/components/ui/` for an existing component that can be extended.
3. **Check for Radix primitive.** If interactive, check if a Radix primitive exists (per DD-14).
4. **Create component.** Follow naming conventions (§2), use CVA for variants (§4), use semantic tokens (§3).
5. **Write tests.** Unit tests for rendering, variants, sizes, keyboard interaction, ARIA attributes.
6. **Submit for review.** Code review by Frontend Lead + Design Lead (for visual components).
7. **Pass accessibility checklist.** (§8)
8. **Pass visual consistency checklist.** (§9)
9. **Update documentation.** Add component to the component catalog.

### 6.3 Contribution Rules

- **No component is merged without tests.** Minimum: rendering test, variant test, accessibility test.
- **No component is merged without accessibility review.** (§8)
- **No component is merged without visual review.** (§9)
- **No component uses non-standard dependencies.** All dependencies must be approved by Frontend Lead.
- **No component bypasses the token system.** (§3)
- **No component uses physical CSS properties for directional layout.** (RTC-01)

---

## 7. Review Checklist

### 7.1 Code Review Checklist

Before merging any component or UI change:

- [ ] **Naming:** Component, file, props, and translation keys follow naming conventions (§2)
- [ ] **Tokens:** Only semantic tokens used. No hardcoded colors. (§3)
- [ ] **Variants:** CVA used for all variants. Standard variant names. (§4)
- [ ] **Radix:** Interactive primitive built on Radix. (DD-14, TC-05)
- [ ] **Logical properties:** No physical `left`/`right`/`ml`/`mr` for directional layout. (RTC-01)
- [ ] **Icon stroke:** Uses `ICON_STROKE` constant. No hardcoded `strokeWidth`. (DD-09)
- [ ] **Translation:** All user-facing strings use `useTranslations` or `getTranslations`. (LC-01)
- [ ] **Bilingual:** Keys exist in both `en.json` and `ar.json`. (BC-01)
- [ ] **Loading:** Uses skeleton (page) or spinner (action). No text-only loading. (DD-06)
- [ ] **Empty state:** Uses `EmptyState` component with appropriate variant. (DD-06)
- [ ] **Error handling:** Uses `toastResponseError` for API errors. (APC-02)
- [ ] **Tests:** Unit tests cover rendering, variants, and accessibility. (TD-007)
- [ ] **No secrets:** No API keys or secrets in frontend code. (SC-04)
- [ ] **Bundle size:** New dependency < 50KB or justified. (PC-01)

### 7.2 Architecture Review Checklist

For changes to providers, hooks, or layout components:

- [ ] **Provider order:** Composition order maintained. (AC-03)
- [ ] **Server/client:** `'use client'` only when needed. (AC-02)
- [ ] **SWR:** Data fetching uses SWR. No direct `fetch`. (TC-04)
- [ ] **Context splitting:** No new values added to bloated contexts. (DD-21)
- [ ] **Socket.IO:** Uses existing Socket.IO infrastructure. No new realtime library. (BCN-04)

---

## 8. Accessibility Checklist

Before merging any component or UI change:

- [ ] **Keyboard accessible:** All interactive elements operable via keyboard. (ACC-02)
- [ ] **Focus visible:** `focus-visible` styling present. (ACC-02)
- [ ] **Tab order:** Tab order follows visual order. No `tabindex="-1"` on interactive elements. (ACC-02)
- [ ] **Accessible name:** All interactive elements have `aria-label`, `aria-labelledby`, or visible text. (ACC-03)
- [ ] **Role:** Custom elements have appropriate `role` attribute. (ACC-03)
- [ ] **Tooltip:** Uses Radix Tooltip with `role="tooltip"` and `aria-describedby`. (DD-05, ACC-03)
- [ ] **Contrast:** Text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text). (ACC-01, A-004)
- [ ] **Touch target:** Interactive elements ≥ 44×44px on mobile. (MSC-02, A-002)
- [ ] **Color not sole indicator:** State is conveyed through text or icon, not color alone. (ACC-01)
- [ ] **RTL tested:** Component verified in RTL mode. (RTC-03)
- [ ] **Screen reader tested:** Component verified with NVDA or VoiceOver. (ACC-03)
- [ ] **axe-core:** No critical violations in automated audit. (ACC-01)

---

## 9. Visual Consistency Rules

### 9.1 Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `gap-1` | 4px | Tight spacing (icon + text in button) |
| `gap-2` | 8px | Default spacing (between related elements) |
| `gap-4` | 16px | Section spacing (between cards in a grid) |
| `p-3` | 12px | Nav item padding |
| `p-6` | 24px | Card padding, dialog padding |
| `px-4 py-5` | 16px / 20px | Page padding (mobile) |
| `px-6 py-8` | 24px / 32px | Page padding (tablet) |
| `px-10 py-12` | 40px / 48px | Page padding (desktop) |

**Rule:** No arbitrary spacing values (`p-[13px]`, `gap-[7px]`). Use the Tailwind spacing scale.

### 9.2 Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-md` | 6px | Small elements (badges, inputs) |
| `rounded-lg` | 8px | Medium elements (cards, dropdowns) |
| `rounded-xl` | 12px | Large elements (page cards, panels) |
| `rounded-2xl` | 16px | Overlays (dialogs, modals) |
| `rounded-full` | 9999px | Circular elements (avatars, icons) |

**Rule:** No arbitrary radius values. Use the Tailwind radius scale.

### 9.3 Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `-z-10` | -10 | Background layers (AuroraBackdrop if rendered) |
| `z-40` | 40 | Sidebar (desktop) |
| `z-[55]` | 55 | Header |
| `z-[59]` | 59 | Mobile nav backdrop |
| `z-[60]` | 60 | Mobile nav overlay |
| `z-[110]` | 110 | Dialog overlay |
| `z-[111]` | 111 | Dialog content |
| `z-[120]` | 120 | Dropdown menu |

**Rule:** No ad-hoc z-index values. Use the established z-index stack. New z-index values require Frontend Lead approval.

### 9.4 Shadow Scale

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-sm` | Small | Subtle elevation (cards in light mode) |
| `shadow-md` | Medium | Medium elevation (dropdowns, popovers) |
| `shadow-lg` | Large | High elevation (dialogs, modals) |

**Rule:** No arbitrary shadow values. Use the Tailwind shadow scale.

### 9.5 Icon Rules

- **Single stroke width:** All icons use `ICON_STROKE` constant (value: 1.5). (DD-09)
- **Single icon library:** All icons from `lucide-react`. No other icon libraries. (TC-05)
- **No duplicate icons for different concepts:** Each feature concept has a unique icon. (TD-003)
- **Icon size matches text:** Icons in buttons use `h-4 w-4` (16px) with `text-sm`, `h-5 w-5` (20px) with `text-base`.
- **Directional icons flip in RTL:** Arrows and chevrons use `rtl:rotate-180`. (RTC-02)

---

## 10. Responsive Rules

### 10.1 Breakpoint Usage

| Breakpoint | Min Width | Target |
|------------|-----------|--------|
| (default) | 0px | Mobile (portrait) |
| `sm` | 640px | Mobile (landscape), small tablet |
| `md` | 768px | Tablet (portrait) |
| `lg` | 1024px | Tablet (landscape), small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### 10.2 Responsive Rules

- **Mobile-first:** Start with mobile styles, add `sm:`, `md:`, `lg:` for larger screens. Do not start with desktop and scale down.
- **No custom breakpoints.** Use the Tailwind defaults. (MSC-01)
- **Sidebar visibility:** Sidebar is `hidden lg:flex` (desktop only). Mobile uses drawer. (DD-11)
- **Grid columns:** Standardize per feature type:
  - Card grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
  - Form layouts: `grid-cols-1 md:grid-cols-2`
  - Admin tables: `overflow-x-auto` with min-width columns
- **Touch targets on mobile:** All interactive elements ≥ 44×44px on screens < `sm`. (MSC-02)
- **No horizontal scroll:** Pages must not cause horizontal scrollbar on any screen size. Test at 320px width.
- **Test at 320px, 375px, 768px, 1024px, 1280px, 1536px.** These are the QA viewport sizes.

### 10.3 Responsive Consistency

- **Same feature, same responsive pattern.** All list pages use the same grid breakpoint pattern. All detail pages use the same layout breakpoint pattern.
- **No feature-specific breakpoints.** If Screen List uses `sm:grid-cols-2 lg:grid-cols-3`, Media Library must use the same. (C-004)

---

## 11. Animation Rules

### 11.1 Animation Library

- **Framer Motion** is the approved animation library. (`01-architecture-and-stack.md` §1.6)
- **No CSS animations for complex sequences.** Use Framer Motion for orchestrated animations.
- **CSS transitions for simple state changes.** `transition-colors`, `transition-opacity`, `transition-transform` are acceptable for hover/focus states.

### 11.2 Animation Rules

- **Respect `prefers-reduced-motion`.** All non-essential animations must be disabled when `prefers-reduced-motion: reduce` is set.
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Duration standard:**
  - Micro-interactions (hover, focus): `150ms`
  - Small transitions (dropdown, tooltip): `200ms`
  - Large transitions (dialog, page transition): `300ms`
- **Easing standard:** Use `ease-out` for enter animations, `ease-in` for exit animations. No custom cubic-bezier without design approval.
- **No layout thrashing.** Animations must not trigger reflow. Use `transform` and `opacity` only.
- **No infinite animations.** Loading spinners are the only exception (`animate-spin`).

### 11.3 Page Transitions

- **Page transitions use Framer Motion `AnimatePresence`.** (`04-layout-and-shell.md` §4.1)
- **Transition duration:** `300ms` with `ease-out`.
- **Transition type:** Fade + slight Y-axis translate (`opacity: 0 → 1`, `y: 8 → 0`).
- **No slide transitions.** Slide transitions cause layout shift and disorientation in RTL.

---

## 12. Documentation Requirements

### 12.1 Component Documentation

Each stable component must have:
- **JSDoc comment** at the top of the file with: component name, stage, last reviewed date
- **Props documentation** via TypeScript types (no separate prop documentation needed if types are clear)
- **Variant documentation** via CVA config (self-documenting)
- **Usage example** in the component catalog (if maintained)

### 12.2 Design System Documentation

The design system must be documented with:
- **Token reference:** All CSS custom properties with their light/dark values
- **Component catalog:** All stable components with props, variants, and sizes
- **Pattern catalog:** Loading, empty, error state patterns
- **Icon registry:** Which icon for which concept
- **Spacing scale:** Documented values and usage
- **Z-index scale:** Documented values and usage
- **Responsive patterns:** Standard grid and layout patterns per feature type

This documentation is produced in Phase 10 (Polish) of the transformation roadmap.

---

## Cross-References

- See `14-design-system-direction.md` for design system standardization direction
- See `15-component-strategy.md` for component architecture strategy
- See `24-design-decisions.md` for decisions that established these rules (DD-05, DD-09, DD-14, DD-22, DD-25)
- See `25-design-constraints.md` for constraints that bound these rules (TC-03, TC-05, ACC-01, MSC-01, MSC-02, RTC-01)
- See `26-product-principles.md` for principles that guide these rules (PP-01, PP-02, PP-03, PP-10)
- See `02-design-system-and-tokens.md` (audit) for current token definitions
- See `26-consistency-audit.md` (audit) for consistency scorecard
