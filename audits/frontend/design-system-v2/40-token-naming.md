# 40 — Token Naming

> **Evidence basis:** `01-foundations.md`, `44-design-tokens.md`, `product-architecture/17-product-rules.md` PR-46

---

## 1. Token Naming Philosophy

Token names must be **semantic, consistent, and predictable**. A developer should be able to guess a token name without looking it up. The naming convention follows a **category-property-scale** pattern.

---

## 2. Token Naming Convention

### 2.1 Pattern

```
--{category}-{property}-{scale}
```

### 2.2 Examples

| Token | Category | Property | Scale | Value |
|-------|----------|----------|-------|-------|
| `--color-primary` | color | primary | — | `#2563eb` |
| `--space-4` | space | — | 4 | `16px` |
| `--text-base` | text | base | — | `16px` |
| `--radius-lg` | radius | lg | — | `8px` |
| `--shadow-sm` | shadow | sm | — | `0 1px 3px...` |
| `--duration-fast` | duration | fast | — | `150ms` |
| `--ease-default` | ease | default | — | `cubic-bezier(...)` |
| `--z-modal` | z | modal | — | `50` |

---

## 3. Category Prefixes

| Prefix | Category | Examples |
|--------|----------|---------|
| `--color-*` | Colors | `--color-primary`, `--color-destructive` |
| `--space-*` | Spacing | `--space-1`, `--space-4` |
| `--text-*` | Typography | `--text-sm`, `--text-lg` |
| `--font-*` | Font families/weights | `--font-sans`, `--font-bold` |
| `--radius-*` | Border radius | `--radius-sm`, `--radius-lg` |
| `--shadow-*` | Shadows | `--shadow-xs`, `--shadow-lg` |
| `--opacity-*` | Opacity | `--opacity-50`, `--opacity-100` |
| `--z-*` | Z-index | `--z-dropdown`, `--z-modal` |
| `--border-*` | Border | `--border-width-thin`, `--border-default` |
| `--duration-*` | Animation duration | `--duration-fast`, `--duration-slow` |
| `--ease-*` | Easing functions | `--ease-default`, `--ease-in` |
| `--delay-*` | Animation delay | `--delay-short`, `--delay-medium` |
| `--icon-*` | Icon sizes | `--icon-sm`, `--icon-lg` |
| `--container-*` | Container widths | `--container-md`, `--container-xl` |

---

## 4. Scale Naming

### 4.1 Numeric Scale (Spacing, Shadow, Z-Index)

| Scale | Meaning |
|-------|---------|
| `0` | None |
| `0.5` | Extra small (half unit) |
| `1` | Small |
| `2` | Small-medium |
| `3` | Medium |
| `4` | Medium-large |
| `5` | Large |
| `6` | Extra large |
| `8` | 2x large |
| `10` | 3x large |
| `12` | 4x large |
| `16` | 5x large |

### 4.2 Named Scale (Radius, Shadow, Text, Duration)

| Scale | Meaning |
|-------|---------|
| `xs` | Extra small |
| `sm` | Small |
| `md` / `default` | Medium (default) |
| `lg` | Large |
| `xl` | Extra large |
| `2xl` | 2x extra large |
| `3xl` | 3x extra large |
| `full` | Full (100% or 9999px) |

### 4.3 Semantic Scale (Colors)

| Scale | Meaning |
|-------|---------|
| `primary` | Primary action color |
| `secondary` | Secondary action color |
| `destructive` | Destructive action color |
| `success` | Success state color |
| `warning` | Warning state color |
| `muted` | Muted/subtle color |
| `foreground` | Text color |
| `background` | Background color |
| `card` | Card surface color |
| `border` | Border color |
| `input` | Input border color |
| `ring` | Focus ring color |
| `popover` | Popover/dialog surface color |
| `accent` | Accent surface color |

---

## 5. Color Token Naming

### 5.1 Semantic Tokens (Role-Based)

```
--color-{role}
--color-{role}-foreground
```

Examples:
- `--color-primary` / `--color-primary-foreground`
- `--color-destructive` / `--color-destructive-foreground`
- `--color-card` / `--color-card-foreground`
- `--color-background` / `--color-foreground`

### 5.2 Primitive Tokens (Raw Values)

```
--color-{hue}-{shade}
```

Examples:
- `--color-blue-500` / `--color-blue-600`
- `--color-gray-100` / `--color-gray-900`
- `--color-green-500` / `--color-red-500`

### 5.3 Rule
**Components reference semantic tokens only.** Primitive tokens are used to define semantic tokens. Never use `--color-blue-500` directly in a component — use `--color-primary`.

---

## 6. Compound Token Names

Some tokens combine multiple properties:

| Token | Components | Example |
|-------|-----------|---------|
| `--color-primary-foreground` | color + role + sub-role | Text on primary bg |
| `--shadow-sm` | shadow + scale | Small shadow |
| `--duration-fast` | duration + scale | 150ms |
| `--ease-in-out` | ease + direction | Bidirectional easing |

---

## 7. Dark Mode Token Naming

Dark mode tokens use the same names as light mode — values change via CSS custom property override.

```css
:root {
  --color-background: #f9fafb;
  --color-foreground: #111827;
}

.dark {
  --color-background: #131316;
  --color-foreground: #f9fafb;
}
```

**No separate dark mode token names.** The same token name has different values in light and dark themes.

---

## 8. Token Naming Rules

1. **Always use `--` prefix** (CSS custom property convention)
2. **Always lowercase** — no camelCase or PascalCase
3. **Use hyphens** as separators (`--color-primary`, not `--colorPrimary`)
4. **Semantic over primitive** — components use semantic tokens
5. **No abbreviations** — `--color-destructive`, not `--color-dest`
6. **Consistent scale** — use the same scale names across categories
7. **No magic numbers** — every value has a named token
8. **No inline values** — never hardcode `#2563eb` or `16px` in components
9. **One source of truth** — tokens defined in `44-design-tokens.md`
10. **Forward-compatible** — new tokens follow the same convention

---

## Cross-References

- See `01-foundations.md` for token definitions
- See `44-design-tokens.md` for the complete token reference
- See `41-component-naming.md` for component naming conventions
- See `product-architecture/17-product-rules.md` PR-46 for naming rules
