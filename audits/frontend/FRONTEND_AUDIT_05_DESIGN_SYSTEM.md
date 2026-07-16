# 05 — Design System Audit

> **Evidence basis:** `globals.css`, `button.tsx`, `table.tsx`, design-system-v2 spec docs

---

## 1. Token System

### 1.1 Color Tokens (globals.css)
| Category | Tokens | Status |
|----------|--------|--------|
| Brand | `--vc-navy`, `--vc-navy-mid`, `--vc-navy-soft` | ✅ Blue-600 based |
| Surfaces | `--background`, `--foreground`, `--card`, `--muted` | ✅ Gray neutrals |
| Semantic | `--primary`, `--accent`, `--destructive`, `--success`, `--warning` | ⚠️ Duplicate --accent |
| Borders | `--border`, `--border-strong`, `--input` | ✅ |
| Popover | `--popover`, `--popover-foreground` | ✅ |
| Secondary | `--secondary`, `--secondary-foreground` | ✅ |

### 1.2 Critical Issue: Duplicate --accent
```css
/* Line 46 */ --accent: 221 83% 53%;     /* Blue-600 */
/* Line 56 */ --accent: 221 83% 96%;     /* Blue-50 — overrides! */
```
The second definition silently overrides the first. Components using `bg-accent` get Blue-50 instead of Blue-600.

### 1.3 Legacy Brand Aliases
```css
--color-vc-purple: hsl(var(--vc-navy));    /* "purple" but actually blue */
--color-brand-primary: #2563eb;            /* Hardcoded hex */
--color-brand-surface: #f9fafb;            /* Hardcoded hex */
```
Naming is confusing — `vc-purple` is actually blue. Hardcoded hex values bypass the token system.

---

## 2. Typography

### 2.1 Font Families
| Token | Value | Usage |
|-------|-------|-------|
| `--font-sans` | Cairo, Geist Sans, system-ui | Body text |
| `--font-mono` | Geist Mono, ui-monospace | Numbers, code |
| `--font-arabic` | Cairo, Segoe UI, Tahoma | Arabic text |

### 2.2 Font Sizes (fixed, not responsive)
| Token | Value |
|-------|-------|
| `--text-xs` | 12px |
| `--text-sm` | 14px |
| `--text-base` | 16px |
| `--text-lg` | 18px |
| `--text-xl` | 20px |
| `--text-2xl` | 24px |
| `--text-3xl` | 30px |
| `--text-4xl` | 36px |

**Issue:** No responsive scaling. Only `.vc-page-title` uses `clamp()`. Body text stays same size on all viewports.

### 2.3 Arabic Typography
```css
.font-ar, [lang='ar'] {
  font-family: var(--font-cairo);
  letter-spacing: 0;
  line-height: 1.65;
}
```
Good — adjusted line-height for Arabic. But no separate Arabic font size scale.

---

## 3. Spacing

### 3.1 Spacing Scale
| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

**Issue:** Spacing tokens defined but Tailwind's built-in scale is used everywhere (`gap-4`, `py-6`, `px-10`). Custom tokens are unused in practice.

---

## 4. Density System

### 4.1 Comfortable (default)
| Token | Value |
|-------|-------|
| `--density-card-px` | 1.5rem |
| `--density-card-py` | 1.5rem |
| `--density-row-py` | 0.75rem |
| `--density-gap` | 1.5rem |

### 4.2 Compact
| Token | Value |
|-------|-------|
| `--density-card-px` | 1rem |
| `--density-card-py` | 1rem |
| `--density-row-py` | 0.5rem |
| `--density-gap` | 1rem |

**Issue:** Density tokens defined but most components use hardcoded Tailwind padding (`p-6`, `py-4`) instead of `var(--density-card-px)`.

---

## 5. Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--radius-xl` | 12px |
| `--radius-2xl` | 16px |

**Usage:** Button uses `rounded-lg` (8px), cards use `rounded-2xl` (16px) or `rounded-lg`. Inconsistent — some cards use `rounded-xl`, others `rounded-2xl`.

---

## 6. Shadows

| Token | Value |
|-------|-------|
| `--shadow-xs` | Subtle |
| `--shadow-sm` | Small |
| `--shadow-md` | Medium |
| `--shadow-lg` | Large |
| `--shadow-xl` | Extra large |
| `--shadow-2xl` | Maximum |

**Usage:** `.vc-card-surface` uses hardcoded `box-shadow: 0 1px 3px hsl(24 10% 10% / 0.04)` instead of shadow tokens.

---

## 7. Z-Index Scale

| Token | Value |
|-------|-------|
| `--z-base` | 0 |
| `--z-sticky` | 20 |
| `--z-dropdown` | 30 |
| `--z-sidebar` | 35 |
| `--z-overlay` | 40 |
| `--z-modal` | 50 |
| `--z-toast` | 60 |
| `--z-tooltip` | 70 |

**Usage:** Header uses `z-sticky` class. But some components use hardcoded `z-[80]`, `z-[3]` — bypassing the scale.

---

## 8. Motion

### 8.1 Duration
| Token | Value |
|-------|-------|
| `--duration-instant` | 0ms |
| `--duration-fast` | 150ms |
| `--duration-normal` | 200ms |
| `--duration-slow` | 300ms |
| `--duration-slower` | 400ms |
| `--duration-slowest` | 600ms |

### 8.2 Easing
| Token | Value |
|-------|-------|
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) |
| `--ease-in` | cubic-bezier(0.4, 0, 1, 1) |
| `--ease-out` | cubic-bezier(0, 0, 0.2, 1) |
| `--ease-bounce` | cubic-bezier(0.34, 1.56, 0.64, 1) |

**Usage:** Button uses `duration-fast ease-default` ✅. But many transitions use hardcoded `0.2s ease` in CSS classes.

---

## 9. Icon Sizes

| Token | Value |
|-------|-------|
| `--icon-xs` | 14px |
| `--icon-sm` | 16px |
| `--icon-md` | 18px |
| `--icon-lg` | 20px |
| `--icon-xl` | 24px |
| `--icon-2xl` | 32px |
| `--icon-3xl` | 48px |

**Usage:** `ICON_STROKE` constant used for stroke width ✅. But icon sizes use Tailwind classes (`h-4 w-4`) instead of tokens.

---

## 10. Container

| Token | Value |
|-------|-------|
| `--container-sm` | 640px |
| `--container-md` | 768px |
| `--container-lg` | 1024px |
| `--container-xl` | 1200px |
| `--container-2xl` | 1400px |

**Usage:** Header uses `max-w-[1600px]` — not in the container token scale.

---

## 11. Legacy CSS Classes

| Class | Purpose | Status |
|-------|---------|--------|
| `.vc-btn-primary` | Primary button | Redundant with Button component |
| `.vc-btn-cta` | CTA button | Redundant |
| `.vc-btn-accent` | Accent button | Redundant |
| `.vc-card-surface` | Card surface | Used in some pages |
| `.vc-table-row` | Table row | Redundant with Table component |
| `.vc-table-head-surface` | Table header | Redundant |
| `.vc-glass` | Glass effect | Simplified to solid card |
| `.vc-page-title` | Page title | Used |
| `.vc-page-kicker` | Page kicker | Defined but inconsistently used |
| `.vc-page-desc` | Page description | Defined but inconsistently used |
| `.vc-aurora` | Background orbs | Decorative |
| `.vc-icon-glass-circle` | Icon container | Used |
| `.vc-stat-card-glow` | Stat card glow | Used in Overview |
| `.ngl-screen-card-live` | Live screen card | Used |
| `.ngl-media-tile` | Media tile | Used |

---

## 12. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Token completeness | 8/10 | All categories covered |
| Token usage | 5/10 | Many tokens defined but unused in favor of Tailwind |
| Consistency | 5/10 | Duplicate --accent, hardcoded values |
| Dark mode | 7/10 | Good coverage, some hardcoded colors |
| Legacy cleanup | 4/10 | Many redundant CSS classes |
| Responsive type | 4/10 | No responsive font scaling |
| **Overall** | **5.5/10** | **Tokens defined but poorly adopted** |
