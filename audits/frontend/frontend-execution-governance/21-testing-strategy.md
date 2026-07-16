# 21 — Testing Strategy

> **Status:** FINAL — Unit, integration, e2e, accessibility, visual regression testing

---

## 1. Purpose

Defines the testing strategy for the Cloud-Screen frontend. Every component and screen must be tested according to this strategy before merge.

---

## 2. Testing Pyramid

```
        E2E Tests (Playwright)
           ↑ Critical user flows
        Integration Tests
           ↑ Component + hook interactions
        Unit Tests (Jest + Testing Library)
           ↑ Components, hooks, utilities
```

---

## 3. Unit Testing

### 3.1 Framework
- **Jest** — test runner
- **React Testing Library** — component testing
- **@testing-library/user-event** — user interaction simulation
- **@testing-library/jest-dom** — DOM assertion matchers

### 3.2 What to Unit Test

| What | Coverage Target | Evidence |
|------|----------------|----------|
| Primitive components | 100% | All variants, sizes, states |
| Composite components | 90% | All variants, states, composition |
| Domain components | 80% | Key variants, states, interactions |
| Hooks | 90% | All returned values, edge cases |
| Utilities | 90% | All functions, edge cases |
| Pages | 50% | Rendering, key interactions |

### 3.3 Component Test Template

```typescript
describe('[ComponentName]', () => {
  // Rendering
  it('renders with default props', () => {});
  it('renders children', () => {});

  // Variants
  it.each([
    ['default', 'bg-primary'],
    ['outline', 'border'],
    ['ghost', 'bg-transparent'],
    ['destructive', 'bg-destructive'],
  ])('renders %s variant correctly', (variant, expectedClass) => {});

  // Sizes
  it.each(['sm', 'default', 'lg'])('renders %s size', (size) => {});

  // States
  it('shows loading state', () => {});
  it('is disabled when disabled prop is true', () => {});
  it('is disabled when loading', () => {});

  // Interactions
  it('calls onClick when clicked', () => {});
  it('does not call onClick when disabled', () => {});

  // Accessibility
  it('has correct aria-label when icon-only', () => {});
  it('is focusable', () => {});
});
```

### 3.4 Hook Test Template

```typescript
describe('use[HookName]', () => {
  it('returns initial state', () => {});
  it('fetches data on mount', () => {});
  it('returns loading state', () => {});
  it('returns error on failure', () => {});
  it('refetches on param change', () => {});
});
```

### 3.5 Unit Test Rules
- **Test behavior, not implementation** — test what the component does, not how
- **No snapshot testing** — use explicit assertions
- **Test all variants** — `it.each` for variant/size matrices
- **Test all states** — default, hover (CSS), focus, disabled, loading, error
- **Test accessibility** — ARIA, keyboard, roles
- **Mock external dependencies** — SWR, useRouter, next-intl
- **No `any` in tests** — type all test props

---

## 4. Integration Testing

### 4.1 What to Integration Test

| What | Example |
|------|---------|
| Component + hook | ScreenCard + useScreenStatus |
| Form + validation + API | Settings form + validation + mutation |
| Dialog + trigger + focus | Delete dialog + button + focus management |
| Filter + table + pagination | Admin table + filter + pagination |
| Realtime + UI | Socket event + status badge update |

### 4.2 Integration Test Rules
- **Test the integration point** — not the individual components (those are unit tested)
- **Mock only the API layer** — not internal hooks/components
- **Test user flows** — not internal implementation
- **Verify side effects** — SWR cache updates, URL changes, toasts

---

## 5. E2E Testing

### 5.1 Framework
- **Playwright** — browser automation
- **Real browser** — Chromium, Firefox, WebKit

### 5.2 Critical Flows to E2E Test

| Flow | Steps | Priority |
|------|-------|----------|
| Login | Enter credentials → Submit → Redirect to Overview | P0 |
| Pair Screen | Navigate to Screens → Click Pair → Enter pairing code → Success | P0 |
| Upload Media | Navigate to Content → Media tab → Upload file → Verify in grid | P0 |
| Create Playlist | Navigate to Content → Playlists → Create → Select template → Save | P0 |
| Publish to Screens | Open playlist → Publish → Select screens → Confirm | P0 |
| Screen Status Update | View screen → Status changes in real-time | P1 |
| Schedule Creation | Navigate to Scheduling → Create → Select playlist/screen/time → Save | P1 |
| Team Invite | Navigate to Team → Invite → Enter email → Send | P1 |
| Settings Save | Navigate to Settings → Edit profile → Save → Verify toast | P1 |
| RTL Layout | Switch to Arabic → Verify layout mirrors | P1 |
| Dark Mode | Toggle dark mode → Verify all elements | P2 |
| Admin Table | Navigate to Admin → Customers → Filter → Sort → Paginate | P2 |

### 5.3 E2E Test Rules
- **Test critical user journeys** — the 5-minute KPI flow is P0
- **Test real API** (or documented mock) — not mocked responses
- **Test in multiple browsers** — Chromium, Firefox, WebKit
- **Test RTL** — at least one E2E test in Arabic
- **No flaky tests** — tests must be deterministic
- **Parallel execution** — tests run in parallel for speed

---

## 6. Accessibility Testing

### 6.1 Automated
| Tool | When | What |
|------|------|------|
| axe DevTools | Development | Automated WCAG audit |
| `@axe-core/playwright` | CI | E2E + accessibility |
| ESLint jsx-a11y | Pre-commit | Common a11y issues |
| Lighthouse | CI | Accessibility score |

### 6.2 Manual
| Test | When | What |
|------|------|------|
| Keyboard only | Every component | Tab, Enter, Space, Escape, arrows |
| Screen reader (NVDA) | Every page | Reading order, ARIA |
| Screen reader (VoiceOver) | Every page (Mac) | Same as NVDA |
| `prefers-reduced-motion` | Every animated component | Instant/fade fallback |
| Zoom 200% | Every page | No content cut off |

---

## 7. Visual Regression Testing (Future)

### 7.1 Framework
- **Playwright screenshot comparison** or **Chromatic**
- **Per-component** — screenshot each variant and state
- **Per-screen** — screenshot at each breakpoint

### 7.2 What to Capture
| What | Variants |
|------|----------|
| Components | All variants × all sizes × all states |
| Screens | Light mode × dark mode × LTR × RTL |
| Breakpoints | 320px, 768px, 1024px, 1280px |

---

## 8. Test File Organization

```
packages/ui/button/
  button.tsx
  button.test.tsx          ← Unit tests next to component

src/features/screens/
  components/
    screen-card.tsx
    screen-card.test.tsx   ← Unit tests next to component
  hooks/
    use-screens.ts
    use-screens.test.ts    ← Hook tests next to hook

e2e/
  login.spec.ts
  pair-screen.spec.ts
  upload-media.spec.ts
  create-playlist.spec.ts
  publish.spec.ts
```

---

## 9. Test Commands

```bash
# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# Unit tests in watch mode
npm test -- --watch

# E2E tests
npx playwright test

# E2E tests (specific browser)
npx playwright test --browser=chromium

# Accessibility (axe in E2E)
npx playwright test --grep="accessibility"

# Lighthouse
npm run lighthouse
```

---

## 10. Testing Compliance Checklist

### Per-Component
- [ ] Unit tests written for all variants
- [ ] Unit tests written for all sizes
- [ ] Unit tests written for all states
- [ ] Unit tests written for all interactions
- [ ] Unit tests written for accessibility (ARIA, keyboard)
- [ ] Test coverage ≥ 80% (components) / 90% (primitives)
- [ ] No tests skipped or TODO
- [ ] No snapshot tests

### Per-Screen
- [ ] E2E test for primary user action (P0/P1 screens)
- [ ] Accessibility test (axe) passing
- [ ] Lighthouse Accessibility ≥ 95
- [ ] No flaky tests

### Per-Build
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] Coverage report generated
- [ ] No coverage regression

---

## Cross-References

- See `10-definition-of-done.md` §2.11 for testing compliance
- See `16-screen-compliance-checklist.md` §14 for screen testing
- See `18-accessibility-compliance.md` §6 for accessibility testing
- See `22-self-audit-process.md` for self-audit (includes test verification)
- See `23-pr-review-process.md` for PR review (includes test verification)
- See `product-architecture/17-product-rules.md` for product rules
