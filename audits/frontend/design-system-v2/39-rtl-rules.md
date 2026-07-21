# 39 — RTL Rules

> **Evidence basis:** `01-foundations.md`, `05-iconography.md`, `03-layout-system.md`, `ux-blueprint/04-responsive-ux-rules.md` §RTL, `product-architecture/17-product-rules.md` PR-50, `user-flow-architecture/01-flow-principles.md` FP-08

---

## 1. RTL Philosophy

Smart Screen supports **Arabic (RTL)** as a first-class language. RTL is not a mirror of LTR — it requires careful consideration of layout, spacing, icons, and text direction. The design system uses **logical properties** and Tailwind's RTL utilities to handle bidirectional layout.

---

## 2. Direction Handling

### 2.1 HTML Direction

| Language | Direction | `dir` attribute |
|----------|-----------|-----------------|
| English (en) | LTR | `dir="ltr"` |
| Arabic (ar) | RTL | `dir="rtl"` |

### 2.2 Implementation
- Set `dir` on `<html>` element based on locale
- Use `next-intl` or similar i18n library to manage locale
- CSS uses logical properties (`margin-inline-start` instead of `margin-left`)
- Tailwind RTL plugin or `rtl:` variant for direction-specific styles

---

## 3. Layout RTL Rules

### 3.1 Sidebar
| Direction | Position | Evidence |
|-----------|----------|----------|
| LTR | Left | `screen-specifications/01-global-layout-spec.md` |
| RTL | Right | Mirror |

- Sidebar moves from left to right in RTL
- Content area shifts accordingly
- Sidebar items: Icon on the **right** (start), label to the **left** (end)
- Active indicator: Right border (instead of left border)

### 3.2 Header
| Direction | Layout |
|-----------|--------|
| LTR | Left: toggle/title, Right: search/bell/avatar |
| RTL | Right: toggle/title, Left: search/bell/avatar |

### 3.3 Flexbox
- `flex-row` automatically reverses in RTL (with `dir="rtl"`)
- Use `flex-row` (not `flex-row-reverse`) — direction handles reversal
- `justify-between` works correctly in both directions

### 3.4 Grid
- Grid columns flow right-to-left in RTL
- No manual column reversal needed

### 3.5 Text Alignment
| Direction | Default Alignment |
|-----------|------------------|
| LTR | Left |
| RTL | Right |

- Use `text-start` / `text-end` (logical) instead of `text-left` / `text-right`
- Headings: `text-start` (start of reading direction)
- Table numbers: `text-end` (end of reading direction)

### 3.6 Spacing
- Use `ms-` (margin-inline-start) and `me-` (margin-inline-end) instead of `ml-` / `mr-`
- Use `ps-` (padding-inline-start) and `pe-` (padding-inline-end) instead of `pl-` / `pr-`
- Use `start-` and `end-` for positioning instead of `left-` / `right-`

---

## 4. Icon RTL Rules

### 4.1 Directional Icons (Must Mirror)

| Icon | LTR | RTL | Method |
|------|-----|-----|--------|
| `ArrowLeft` | ← | → | `rtl:rotate-180` |
| `ArrowRight` | → | ← | `rtl:rotate-180` |
| `ChevronRight` | › | ‹ | `rtl:rotate-180` |
| `ChevronLeft` | ‹ | › | `rtl:rotate-180` |
| `ChevronRight` (breadcrumb) | › | ‹ | `rtl:rotate-180` |
| `RefreshCw` | ↻ | ↺ | `rtl:rotate-180` (optional) |

### 4.2 Non-Directional Icons (No Mirror)

| Icon | Reason |
|------|--------|
| `Plus`, `Trash2`, `Check`, `X` | Symmetrical |
| `Search`, `Filter`, `SortDesc` | No direction |
| `Monitor`, `Image`, `CalendarClock` | No direction |
| `Upload`, `Download` | Vertical (no horizontal direction) |
| `Eye`, `EyeOff`, `Lock`, `Unlock` | Symmetrical |

### 4.3 Breadcrumb Separator
- LTR: `ChevronRight` (›) pointing right
- RTL: `ChevronLeft` (‹) pointing left
- Use `rtl:rotate-180` on the separator

---

## 5. Typography RTL Rules

### 5.1 Font Family
| Language | Font |
|----------|------|
| English | `--font-sans` (Inter) |
| Arabic | `--font-arabic` (Cairo or Tajawal) |

### 5.2 Font Size
- Arabic uses the same font size scale as English
- Arabic text may appear slightly larger due to font metrics — acceptable

### 5.3 Numbers
- Arabic locale may use Arabic numerals (٠١٢٣) or Western numerals (0123)
- Default: Western numerals (more common in digital signage)
- Pairing codes, metrics, and timestamps: Always Western numerals

### 5.4 Line Height
- Arabic may need slightly more line height for readability
- Use `--text-base` line height (24px) for body — sufficient for Arabic

---

## 6. Component-Specific RTL Rules

### 6.1 Dialog
- Close button (X): Top-left in RTL (instead of top-right)
- Footer: Cancel on right, Confirm on left (reversed)

### 6.2 Drawer
- `side="left"`: Opens from right in RTL
- `side="right"`: Opens from left in RTL
- Slide animation: Reversed direction

### 6.3 Toast
- Position: Bottom-left in RTL (instead of bottom-right)
- Icon: Right of text (instead of left)
- Close button: Top-left (instead of top-right)

### 6.4 Table
- First column: Right side in RTL
- Column order: Reversed
- Row actions: Left side (instead of right)
- Sort indicator: Same (arrows are direction-neutral in table context)

### 6.5 Tabs
- Tab order: Right-to-left
- Active indicator: Same (bottom border)
- Tab content: RTL text alignment

### 6.6 Pagination
- "Prev" button: Right side in RTL
- "Next" button: Left side in RTL
- Page numbers: Right-to-left order

### 6.7 Breadcrumbs
- Items flow right-to-left
- Separator: `ChevronLeft` in RTL

### 6.8 Toggle/Switch
- Off: Thumb on right (start) in RTL
- On: Thumb on left (end) in RTL
- Track and thumb positions are mirrored

### 6.9 Calendar
- Day headers: Saturday first (Arabic week starts Saturday)
- Days flow right-to-left
- Week: Sat, Sun, Mon, Tue, Wed, Thu, Fri

### 6.10 Avatar
- Position: Right side in lists (instead of left)
- Fallback initials: Same (no mirroring needed)

---

## 7. RTL Testing Checklist

- [ ] `dir="rtl"` set on `<html>` for Arabic locale
- [ ] Sidebar on right side
- [ ] Header elements mirrored
- [ ] Text alignment: Right for Arabic
- [ ] Directional icons mirrored (arrows, chevrons)
- [ ] Non-directional icons NOT mirrored
- [ ] Breadcrumb separator mirrored
- [ ] Dialog close button on left
- [ ] Toast position: Bottom-left
- [ ] Table columns reversed
- [ ] Pagination: Prev on right, Next on left
- [ ] Calendar: Saturday first, right-to-left
- [ ] Arabic font (Cairo/Tajawal) applied
- [ ] No hardcoded `left` / `right` in CSS (use logical properties)
- [ ] No hardcoded `ml-` / `mr-` (use `ms-` / `me-`)
- [ ] All text is translated (no English in Arabic mode)

---

## Cross-References

- See `01-foundations.md` for font tokens (`--font-arabic`)
- See `05-iconography.md` for icon RTL rules
- See `03-layout-system.md` for layout patterns
- See `38-responsive-rules.md` for responsive rules
- See `10-accessibility-rules.md` for accessibility
- See `ux-blueprint/04-responsive-ux-rules.md` §RTL for RTL UX rules
- See `product-architecture/17-product-rules.md` PR-50 for RTL rules
- See `user-flow-architecture/01-flow-principles.md` FP-08 for i18n principles
