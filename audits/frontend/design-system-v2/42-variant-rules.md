# 42 — Variant Rules

> **Evidence basis:** `12-button-specifications.md`, `13-input-specifications.md`, `15-cards.md`, `22-dialog-standards.md`, `24-toast-standards.md`, `09-interaction-states.md`, `product-architecture/17-product-rules.md` PR-46

---

## 1. Variant Philosophy

Variants provide **visual differentiation** for the same component based on its role or context. Each variant has a clear purpose — no variant exists "just because." Variants are named consistently across all components.

---

## 2. Variant Naming Convention

### 2.1 Standard Variant Names

These variant names are used consistently across all components:

| Variant Name | Meaning | Usage |
|--------------|---------|-------|
| `default` | Primary/default appearance | Main action, standard state |
| `outline` | Bordered, no fill | Secondary action |
| `ghost` | No border, no fill | Tertiary action, toolbar |
| `destructive` | Red/danger styling | Delete, remove, revoke |
| `link` | Link-styled | Inline link action |
| `success` | Green styling | Success state |
| `warning` | Amber styling | Warning state |
| `muted` | Subtle/gray styling | Inactive, draft, subtle |
| `elevated` | Higher shadow | Floating elements |
| `interactive` | Hover/active states | Clickable cards |
| `compact` | Reduced padding | Dense layouts |
| `error` | Red border/bg | Validation error |

### 2.2 Pattern

```
variant="{name}"
```

Example:
```tsx
<Button variant="default">Save</Button>
<Button variant="outline">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Close</Button>
```

---

## 3. Variant Inventory by Component

### 3.1 Button

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `default` | `--primary` | `--primary-foreground` | none | Primary CTA |
| `outline` | `--card` | `--foreground` | `--border` | Secondary |
| `ghost` | transparent | `--foreground` | none | Tertiary |
| `destructive` | `--destructive` | `--destructive-foreground` | none | Delete |
| `link` | transparent | `--primary` | none | Inline link |

### 3.2 Card

| Variant | Background | Border | Shadow | Usage |
|---------|-----------|--------|--------|-------|
| `default` | `--card` | `--border` | `--shadow-xs` | Standard |
| `elevated` | `--card` | none | `--shadow-sm` | Floating |
| `outline` | `--card` | `--border-strong` | none | Emphasized |
| `interactive` | `--card` | `--border` | `--shadow-xs`→`--shadow-sm` | Clickable |
| `danger` | `--destructive/5` | `--destructive/20` | none | Danger zone |
| `muted` | `--muted` | `--border` | none | Subtle |

### 3.3 Badge

| Variant | Background | Text | Usage |
|---------|-----------|------|-------|
| `default` | `--primary/10` | `--primary` | Active, info |
| `success` | `--success/10` | `--success` | Online, published |
| `warning` | `--warning/10` | `--warning` | Pending, warning |
| `destructive` | `--destructive/10` | `--destructive` | Offline, error |
| `muted` | `--muted` | `--muted-foreground` | Draft, inactive |

### 3.4 Toast

| Variant | Icon | Accent | Duration | Usage |
|---------|------|--------|----------|-------|
| `success` | `CheckCircle` | `--success` | 3s | Action succeeded |
| `error` | `XCircle` | `--destructive` | 5s | Action failed |
| `warning` | `AlertTriangle` | `--warning` | 5s | Warning |
| `info` | `Info` | `--primary` | 4s | Information |

### 3.5 Dialog

| Variant | Max Width | Usage |
|---------|-----------|-------|
| `sm` | 400px | Simple confirmation |
| `default` | 500px | Standard dialog |
| `lg` | 600px | Form dialog |
| `xl` | 700px | Template picker, complex |
| `alertDialog` | 450px | Destructive confirmation |

### 3.6 Input

| Variant | Border | Background | Usage |
|---------|--------|-----------|-------|
| `default` | `--input` | `--card` | Standard |
| `error` | `--destructive` | `--destructive/5` | Validation error |
| `disabled` | `--border` | `--muted` | Disabled |

### 3.7 EmptyState

| Variant | Usage |
|---------|-------|
| `default` | No data exists |
| `filtered` | No results match filters |
| `permission` | No permission |

### 3.8 ErrorState

| Variant | Usage |
|---------|-------|
| `default` | API failure |
| `notFound` | 404 |
| `permission` | 403 |
| `offline` | Network offline |
| `server` | 500 |

---

## 4. Size Variants

### 4.1 Standard Size Names

| Size Name | Meaning |
|-----------|---------|
| `xs` | Extra small |
| `sm` | Small |
| `default` | Medium (default) |
| `lg` | Large |
| `xl` | Extra large |

### 4.2 Size Inventory

| Component | `sm` | `default` | `lg` |
|-----------|------|-----------|------|
| Button | 32px | 36px | 40px |
| Input | 32px | 36px | 40px |
| Avatar | 24px | 32px | 40px |
| Card padding | 12px | 20px | 24px |
| Table row | 36px | 48px | — |
| List row | 44px | 56px | — |
| Icon | 14px | 16px | 20px |

---

## 5. Variant Rules

1. **One variant per instance** — a component has one variant at a time
2. **`default` is always the default** — if no variant specified, use `default`
3. **Variants are mutually exclusive** — no combining variants
4. **Consistent naming** — same variant name means same visual intent across components
5. **No custom variants** — only use defined variants; new variants require design system approval
6. **Variant determines all visual properties** — bg, text, border, shadow are all set by variant
7. **Size is separate from variant** — `variant` and `size` are independent props
8. **Document all variants** — every variant must be documented in the component spec
9. **Test all variants** — every variant must pass acceptance criteria
10. **No variant proliferation** — if a new variant is < 80% similar to existing, reconsider

---

## Cross-References

- See `12-button-specifications.md` for button variants
- See `15-cards.md` for card variants
- See `22-dialog-standards.md` for dialog variants
- See `24-toast-standards.md` for toast variants
- See `09-interaction-states.md` for state definitions
- See `41-component-naming.md` for component naming
- See `product-architecture/17-product-rules.md` PR-46 for naming rules
