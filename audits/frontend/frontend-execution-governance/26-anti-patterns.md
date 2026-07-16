# 26 — Anti-Patterns

> **Status:** FINAL — Complete catalog of forbidden patterns and practices

---

## 1. Purpose

This document catalogues every pattern that is **forbidden** in the Cloud-Screen frontend. Any code matching these patterns is a PR blocker. Enforced by AI Constitution (Articles III, V, VI).

---

## 2. Token Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-01 | Hardcoded colors (`#2563eb`, `rgb(37,99,235)`) | Bypasses token system, no dark mode, no theming | Use semantic tokens: `bg-primary`, `text-foreground` |
| AP-02 | Primitive token classes (`bg-blue-600`) | Bypasses semantic layer, no dark mode | Use semantic tokens: `bg-primary` |
| AP-03 | Hardcoded spacing (`16px`, `1rem`, `padding: 24px`) | Inconsistent, no scalability | Use Tailwind: `p-4`, `p-6` |
| AP-04 | Hardcoded font sizes (`font-size: 14px`) | Inconsistent, no scalability | Use Tailwind: `text-sm`, `text-base` |
| AP-05 | Hardcoded font weights (`font-weight: 600`) | Inconsistent | Use Tailwind: `font-semibold` |
| AP-06 | Hardcoded radii (`border-radius: 8px`) | Inconsistent | Use Tailwind: `rounded-lg` |
| AP-07 | Hardcoded shadows (`box-shadow: 0 1px 3px...`) | Inconsistent | Use Tailwind: `shadow-sm` |
| AP-08 | Hardcoded z-index (`z-index: 50`) | Conflicts, no scalability | Use tokens: `z-modal`, `z-toast` |
| AP-09 | Hardcoded durations (`transition: 300ms`) | Inconsistent | Use tokens: `duration-300` |
| AP-10 | Hardcoded easing (`cubic-bezier(0.4,0,0.2,1)`) | Inconsistent | Use tokens: `ease-default` |
| AP-11 | Inline styles (`style={{ color: 'red' }}`) | Bypasses Tailwind, no token usage | Use Tailwind classes |
| AP-12 | CSS-in-JS (styled-components, emotion) | Runtime overhead, no token system | Use Tailwind CSS |
| AP-13 | `!important` in CSS | Specificity hack, unmaintainable | Fix specificity properly |
| AP-14 | Magic numbers (unexplained `42`, `73`) | Unclear intent | Named constants or tokens |

---

## 3. Component Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-15 | Duplicate components (two Button implementations) | Inconsistency, maintenance burden | Single source: use DS V2 Button |
| AP-16 | Custom HTML replicating DS component (`<button className="bg-blue-600...">`) | Bypasses design system | Use DS V2 component |
| AP-17 | God components (> 300 lines) | Unmaintainable, untestable | Split into sub-components |
| AP-18 | Undocumented variants (`variant="custom"`) | Not in design system | Use defined variant or create ADR |
| AP-19 | Undocumented sizes (`size="xl"` when not defined) | Not in design system | Use defined size or create ADR |
| AP-20 | Missing states (no loading, empty, error) | Poor UX, incomplete implementation | Implement all required states |
| AP-21 | Cross-layer imports (Primitive importing Domain) | Architecture violation | Follow layer rules |
| AP-22 | Business logic in UI components | Hard to test, hard to reuse | Extract to hooks/services |
| AP-23 | API calls in components | No caching, no error handling | Use SWR hooks |
| AP-24 | Deep prop drilling (> 2 levels) | Hard to maintain | Use Context or SWR |
| AP-25 | No `forwardRef` on primitive components | Can't forward refs | Use `forwardRef` |
| AP-26 | No `displayName` on components | Hard to debug | Set `displayName` |
| AP-27 | Default exports for components | Inconsistent, no tree-shaking | Named exports |
| AP-28 | No TypeScript types on props | No type safety | Explicit interface for all props |
| AP-29 | `any` type | No type safety | Use proper types or `unknown` |
| AP-30 | `@ts-ignore` without comment | Hides real errors | Fix the error or document why |

---

## 4. State Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-31 | Redux/Zustand for global state | Overkill, unnecessary complexity | SWR + Context |
| AP-32 | Direct `fetch` in components | No caching, no deduplication | SWR hooks |
| AP-33 | Uncontrolled state from DOM | Unpredictable | Controlled components |
| AP-34 | State in URL without `searchParams` | Not shareable, not bookmarkable | Use URL state |
| AP-35 | No optimistic update for toggles | Slow perceived performance | Optimistic update + rollback |
| AP-36 | No rollback on optimistic update error | UI shows wrong state | Revert + error toast |
| AP-37 | Silent error swallowing (empty catch) | Bugs hidden | Handle or rethrow |
| AP-38 | `console.error` only (no user feedback) | User doesn't know about error | ErrorState or Toast |
| AP-39 | No loading state during API call | User doesn't know what's happening | Skeleton or Spinner |
| AP-40 | No debounce on search input | Excessive API calls | 300ms debounce |

---

## 5. Styling Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-41 | Random styling (ad-hoc Tailwind classes not in spec) | Inconsistent | Follow DS V2 spec |
| AP-42 | Inconsistent spacing (sometimes `p-3`, sometimes `p-4` for same element) | Inconsistent | Follow spacing rules |
| AP-43 | Inconsistent icons (using `X` for close in one place, `Times` in another) | Inconsistent | Use Lucide per `05-iconography.md` |
| AP-44 | Emoji as icons (`🔥`, `✅`) | Unprofessional, inconsistent | Use Lucide icons |
| AP-45 | Custom SVG icons (when Lucide has equivalent) | Inconsistent | Use Lucide |
| AP-46 | `max-*` breakpoint classes (`max-lg:hidden`) | Not mobile-first | Use `lg:hidden` |
| AP-47 | Fixed widths (`w-500px`) | Breaks responsive | Use responsive widths |
| AP-48 | Fixed heights for content (`h-600px`) | Content may overflow | Use `min-h-[600px]` |
| AP-49 | `overflow-hidden` on body | Hides mobile content | Use `overflow-x-auto` on specific elements |
| AP-50 | No aspect ratio on images | Layout shift | Use aspect ratio container |

---

## 6. Animation Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-51 | Random animations (not in MI-01 to MI-23) | Inconsistent | Use motion inventory |
| AP-52 | Animating `width`/`height`/`margin`/`padding` | Causes reflow, janky | Animate `transform`/`opacity` |
| AP-53 | Animations > 600ms (except loops) | Too slow | Use ≤ 600ms |
| AP-54 | No `prefers-reduced-motion` fallback | Accessibility violation | Add instant/fade fallback |
| AP-55 | Decorative animations (no purpose) | Distracting | All animations must be functional |
| AP-56 | Bounce easing on non-toggle elements | Unprofessional | Use `ease-default` |
| AP-57 | `will-change` left after animation | Memory leak | Remove after animation |
| AP-58 | > 10 concurrent animations | Performance impact | Limit concurrent animations |

---

## 7. Accessibility Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-59 | `<div onClick>` instead of `<button>` | Not keyboard accessible | Use `<button>` |
| AP-60 | No `aria-label` on icon-only buttons | Screen reader can't identify | Add `aria-label` |
| AP-61 | No `alt` on images | Screen reader can't describe | Add `alt` text |
| AP-62 | Color-only status communication | Colorblind users can't see | Add icon + text + color |
| AP-63 | No focus ring (`outline: none` without replacement) | Keyboard users can't see focus | Add `focus-visible:ring` |
| AP-64 | No keyboard navigation | Keyboard users can't use | Implement Tab/Enter/Space/Escape |
| AP-65 | No focus trap in dialogs | Focus escapes dialog | Add focus trap |
| AP-66 | No focus restore on dialog close | Focus lost | Restore to trigger |
| AP-67 | Input < 16px on mobile | iOS auto-zoom | Use `text-base` (16px) |
| AP-68 | Touch target < 44px on mobile | Hard to tap | Minimum 44px × 44px |
| AP-69 | Heading hierarchy skips (h1 → h3) | Screen reader confusion | h1 → h2 → h3 |
| AP-70 | No `role="alert"` on errors | Screen reader doesn't announce | Add `role="alert"` |

---

## 8. Architecture Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-71 | Circular imports | Runtime errors | Restructure dependencies |
| AP-72 | Pages Router | Outdated, no nested layouts | App Router |
| AP-73 | Mixed server/client logic | Hydration errors | Clear `'use client'` boundary |
| AP-74 | Backend logic in frontend | Wrong layer | Backend handles business logic |
| AP-75 | No barrel exports | Inconsistent imports | `index.ts` for each directory |
| AP-76 | Files in wrong folder | Architecture violation | Follow `27-folder-ownership.md` |
| AP-77 | Unauthorized library | Bundle size, maintenance | ADR before adding |
| AP-78 | No error boundary | Uncaught errors crash app | Add ErrorBoundary |
| AP-79 | No 404/500 pages | Poor UX | Implement error pages |
| AP-80 | No i18n (hardcoded English) | No Arabic support | Use next-intl |

---

## 9. Naming Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-81 | camelCase component names (`screenCard`) | Inconsistent | PascalCase: `ScreenCard` |
| AP-82 | PascalCase file names (`ScreenCard.tsx`) | Inconsistent | kebab-case: `screen-card.tsx` |
| AP-83 | Abbreviated names (`NotifBell`) | Unclear | Full names: `NotificationBell` |
| AP-84 | Generic names (`Card` for domain component) | Ambiguous | Entity prefix: `ScreenCard` |
| AP-85 | "Wrapper" suffix (`CardWrapper`) | Not a type | Use actual type: `Card` |
| AP-86 | "Custom" prefix (`CustomButton`) | Every component is custom | Just `Button` |
| AP-87 | Magic strings (unexplained `"screen:status"`) | Unclear | Named constants |
| AP-88 | Inconsistent hook naming (`getScreens`) | Not a hook pattern | `useScreens` |

---

## 10. Process Anti-Patterns

| # | Anti-Pattern | Why It's Forbidden | Correct Pattern |
|---|--------------|-------------------|-----------------|
| AP-89 | Silent documentation changes | Violates Constitution | Create ADR |
| AP-90 | Implementation without reading docs | Violates Constitution | Complete reading order |
| AP-91 | No self-audit before PR | Violates Constitution | Complete self-audit |
| AP-92 | No PR review | Violates Constitution | Mandatory PR review |
| AP-93 | No ADR for deviations | Violates Constitution | Create ADR |
| AP-94 | Copy-paste implementations | Duplication, inconsistency | Extract reusable component |
| AP-95 | No tests | No verification | Write unit + integration tests |
| AP-96 | Snapshot tests | Brittle, not meaningful | Explicit assertions |
| AP-97 | Commented-out code | Clutter | Delete or document why |
| AP-98 | `console.log` in production code | Clutter, performance | Remove |
| AP-99 | TODO without ticket reference | Untracked debt | Link to ticket |
| AP-100 | No Definition of Done verification | Incomplete implementation | Complete DoD checklist |

---

## 11. Anti-Pattern Enforcement

### 11.1 Automated Detection
| Anti-Patterns | Detection Method |
|---------------|-----------------|
| AP-01 to AP-14 (tokens) | ESLint rules |
| AP-27 to AP-30 (TypeScript) | TypeScript compiler |
| AP-59 to AP-70 (accessibility) | ESLint jsx-a11y, axe |
| AP-71 to AP-73 (architecture) | ESLint import rules |
| AP-97 to AP-99 (code quality) | ESLint |

### 11.2 Manual Detection
| Anti-Patterns | Detection Method |
|---------------|-----------------|
| AP-15 to AP-26 (components) | Code review |
| AP-31 to AP-40 (state) | Code review |
| AP-41 to AP-50 (styling) | Code review + visual QA |
| AP-51 to AP-58 (animation) | Code review + visual QA |
| AP-74 to AP-80 (architecture) | Code review |
| AP-81 to AP-88 (naming) | Code review |
| AP-89 to AP-100 (process) | PR review process |

### 11.3 Consequences
Any anti-pattern found during review:
1. **PR blocked** — cannot merge
2. **Must fix** — developer must correct the pattern
3. **If fix requires deviation** — create ADR per `24-adr-process.md`

---

## Cross-References

- See `01-ai-constitution.md` Articles III, V, VI for constitutional rules
- See `15-design-system-enforcement.md` for DS enforcement
- See `22-self-audit-process.md` for self-audit (anti-pattern detection)
- See `23-pr-review-process.md` for PR review (anti-pattern blocking)
- See `24-adr-process.md` for ADR process (deviation handling)
- See `design-system-v2/26` through `37` for component-specific anti-patterns
