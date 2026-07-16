# 49 — Migration Rules

> **Evidence basis:** `audits/frontend/02-design-system-and-tokens.md` (V1), `audits/frontend/transformation/00-executive-summary.md`, `product-architecture/17-product-rules.md`, `screen-specifications/14-screen-specifications-summary.md`

---

## 1. Migration Philosophy

The Design System V2 is an **evolution, not a revolution**. It preserves the current visual identity while introducing a mature token architecture, consistent component patterns, and comprehensive documentation. Migration from V1 to V2 should be **gradual, non-breaking, and parallel**.

---

## 2. Migration Strategy

### 2.1 Parallel Approach

- V1 and V2 coexist during migration
- New components use V2 tokens and patterns
- Existing components migrate incrementally
- No big-bang rewrite

### 2.2 Migration Order

| Priority | What | Why | Evidence |
|----------|------|-----|----------|
| 1 | Design tokens (CSS variables) | Foundation for everything | `44-design-tokens.md` |
| 2 | Tailwind config | Maps tokens to utility classes | `44-design-tokens.md` §13 |
| 3 | Primitive components (Button, Input, Card) | Used everywhere | `12-15` specs |
| 4 | Composite components (Dialog, Table, List) | Used across pages | `16-17`, `22-24` specs |
| 5 | Navigation (Sidebar, Header) | App shell | `25-navigation-components.md` |
| 6 | Domain components (ScreenCard, PlaylistCard) | Feature-specific | `32-37` specs |
| 7 | Page-level migration | Per page | Screen specs |

---

## 3. Token Migration

### 3.1 V1 → V2 Token Mapping

| V1 Token/Class | V2 Token | Notes |
|----------------|----------|-------|
| `bg-blue-600` | `bg-primary` | Semantic token |
| `text-white` (on blue) | `text-primary-foreground` | Semantic token |
| `bg-gray-50` | `bg-background` | Semantic token |
| `bg-white` | `bg-card` | Semantic token |
| `text-gray-900` | `text-foreground` | Semantic token |
| `text-gray-500` | `text-muted-foreground` | Semantic token |
| `bg-gray-100` | `bg-muted` | Semantic token |
| `border-gray-200` | `border-border` | Semantic token |
| `text-red-500` | `text-destructive` | Semantic token |
| `text-green-500` | `text-success` | Semantic token |
| `text-amber-500` | `text-warning` | Semantic token |
| `shadow-sm` | `shadow-xs` | V2 shifts shadow scale |
| `shadow-md` | `shadow-sm` | V2 shifts shadow scale |
| `rounded-md` | `rounded-md` | Same |
| `rounded-lg` | `rounded-lg` | Same |

### 3.2 Migration Rules

1. **Replace hardcoded colors** with semantic tokens
2. **Replace hardcoded spacing** with spacing tokens
3. **Replace hardcoded font sizes** with text tokens
4. **Update Tailwind config** to use CSS variables
5. **Add dark mode support** (`.dark` class with token overrides)
6. **No visual change** — V2 tokens should produce same visual result as V1 values

---

## 4. Component Migration

### 4.1 Button Migration

| V1 Pattern | V2 Pattern | Notes |
|------------|-----------|-------|
| `<button className="bg-blue-600 text-white">` | `<Button variant="default">` | Use Button component |
| `<button className="border border-gray-200">` | `<Button variant="outline">` | Use Button component |
| `<button className="text-red-500">` | `<Button variant="destructive">` | Use Button component |
| Custom loading state | `loading` prop | Built-in loading |
| Custom disabled | `disabled` prop | Standard prop |

### 4.2 Input Migration

| V1 Pattern | V2 Pattern | Notes |
|------------|-----------|-------|
| `<input className="border border-gray-200 rounded-md" />` | `<Input />` | Use Input component |
| Custom error styling | `error` prop | Built-in error state |
| Custom password toggle | `<PasswordInput />` | Built-in toggle |
| No label | `<FormField><Label>...</Label><Input /></FormField>` | Always use FormField |

### 4.3 Card Migration

| V1 Pattern | V2 Pattern | Notes |
|------------|-----------|-------|
| `<div className="bg-white rounded-lg shadow-sm p-5">` | `<Card><CardContent>...</CardContent></Card>` | Use Card component |
| Custom hover | `variant="interactive"` | Built-in hover |
| Danger zone | `variant="danger"` | Built-in variant |

### 4.4 Dialog Migration

| V1 Pattern | V2 Pattern | Notes |
|------------|-----------|-------|
| Custom modal | `<Dialog>` component | Built-in focus trap, Escape, overlay |
| Custom confirmation | `<AlertDialog>` | Built-in safe defaults |
| No focus trap | Built-in focus trap | Accessibility fix |
| No focus restore | Built-in focus restore | Accessibility fix |

---

## 5. Migration Checklist per Component

### 5.1 Before Migration
- [ ] Read the V2 component specification
- [ ] Identify all V1 usages of the component
- [ ] Plan the migration (which files, which props)
- [ ] Ensure V2 component is implemented and tested

### 5.2 During Migration
- [ ] Replace V1 component with V2 component
- [ ] Update props to V2 prop names
- [ ] Update classes to V2 token classes
- [ ] Test all variants and sizes
- [ ] Test all states (hover, focus, disabled, loading, error)
- [ ] Test responsive behavior
- [ ] Test RTL
- [ ] Test dark mode

### 5.3 After Migration
- [ ] No V1 classes remain (`bg-blue-600`, `text-gray-500`, etc.)
- [ ] No hardcoded values (`#2563eb`, `16px`, etc.)
- [ ] All semantic tokens used
- [ ] Accessibility criteria met
- [ ] Design QA checklist passed
- [ ] No visual regression (same look, better code)

---

## 6. What NOT to Change During Migration

| Element | Reason |
|---------|--------|
| Brand logo | Preserve visual identity |
| Brand colors (blue primary) | Same hex values, new token names |
| Overall layout (sidebar + header + content) | Same structure |
| Font family (Inter) | Same font, new token name |
| Icon library (Lucide) | Already using Lucide |
| Page structure (header → toolbar → content) | Same pattern |

---

## 7. Migration Risks

| Risk | Mitigation |
|------|-----------|
| Visual regression | Test side-by-side before/after |
| Accessibility regression | Run accessibility checklist after migration |
| Performance regression | Run Lighthouse before/after |
| RTL regression | Test RTL after migration |
| Dark mode issues | Test dark mode after token migration |
| Breaking changes | V1 and V2 coexist; migrate incrementally |

---

## 8. Migration Timeline (Recommended)

| Phase | Duration | What |
|-------|----------|------|
| Phase 0 | 1-2 days | Set up V2 tokens, Tailwind config |
| Phase 1 | 2-3 days | Migrate primitive components (Button, Input, Card, Badge) |
| Phase 2 | 2-3 days | Migrate composite components (Dialog, Table, List, Toast) |
| Phase 3 | 1-2 days | Migrate navigation (Sidebar, Header, Tabs, Breadcrumbs) |
| Phase 4 | 3-5 days | Migrate domain components (ScreenCard, PlaylistCard, etc.) |
| Phase 5 | 5-10 days | Migrate page-level (per page, following screen specs) |
| Phase 6 | 2-3 days | Final QA, dark mode, RTL, accessibility audit |

**Total estimated migration:** 16-28 days (can overlap with feature development)

---

## Cross-References

- See `44-design-tokens.md` for V2 token definitions
- See `audits/frontend/02-design-system-and-tokens.md` for V1 design system
- See `audits/frontend/transformation/00-executive-summary.md` for transformation plan
- See `47-component-acceptance-criteria.md` for acceptance criteria
- See `48-design-qa-checklist.md` for QA checklist
- See `product-architecture/17-product-rules.md` for product rules
- See `screen-specifications/14-screen-specifications-summary.md` for implementation readiness
