# 12 — Button Specifications

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `07-motion-system.md`, `ux-blueprint/03-component-ux-standards.md` §3, `screen-specifications/` (all files use buttons)

---

## Component: Button

### Purpose
Primary interactive element for triggering actions.

### Usage
Used for all actionable interactions: submit forms, navigate, toggle states, trigger dialogs.

### When to Use
- Form submission (Save, Create, Delete)
- Navigation (Next, Back, Cancel)
- Action triggers (Publish, Assign, Invite)
- Dialog actions (Confirm, Cancel)

### When NOT to Use
- Navigation between pages (use `Link` with button styling instead)
- Toggling a boolean state on a form (use `Toggle` instead)
- Selecting from a list (use `Select` or `Dropdown` instead)
- Inline text actions (use `Link` instead)

### Hierarchy
- **Primary:** `variant="default"` — one per section/page (main action)
- **Secondary:** `variant="outline"` — supporting actions
- **Tertiary:** `variant="ghost"` — subtle actions (cancel, close)
- **Destructive:** `variant="destructive"` — irreversible actions (delete, remove)

### Variants

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| `default` | `--primary` | `--primary-foreground` | none | Primary CTA |
| `outline` | `--card` | `--foreground` | `--border` (1px) | Secondary action |
| `ghost` | transparent | `--foreground` | none | Tertiary action, toolbar |
| `destructive` | `--destructive` | `--destructive-foreground` | none | Delete, remove, revoke |
| `link` | transparent | `--primary` | none | Inline link-styled button |

### Sizes

| Size | Height | Padding | Font Size | Icon Size |
|------|--------|---------|-----------|-----------|
| `sm` | 32px | `--space-2 --space-3` | `--text-sm` | 14px |
| `default` | 36px | `--space-2 --space-4` | `--text-sm` | 16px |
| `lg` | 40px | `--space-3 --space-5` | `--text-base` | 18px |
| `icon` | 36px × 36px | 0 | — | 18px |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | Per variant | — |
| Hover | Background darkens 10% | MI-01 (150ms) |
| Focus | `ring-2 ring-ring ring-offset-2` | Instant |
| Active (press) | Scale 0.97 | MI-02 (100ms) |
| Disabled | `opacity-50 cursor-not-allowed` | Instant |
| Loading | Spinner replaces text, button disabled | MI-21 (spinner) |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `default \| outline \| ghost \| destructive \| link` | `default` | Visual variant |
| `size` | `sm \| default \| lg \| icon` | `default` | Button size |
| `disabled` | `boolean` | `false` | Disabled state |
| `loading` | `boolean` | `false` | Loading state (shows spinner) |
| `fullWidth` | `boolean` | `false` | Full width (`w-full`) |
| `leftIcon` | `LucideIcon` | — | Icon before text |
| `rightIcon` | `LucideIcon` | — | Icon after text |
| `onClick` | `() => void` | — | Click handler |
| `type` | `button \| submit \| reset` | `button` | HTML type |
| `aria-label` | `string` | — | Accessible label (required for icon-only) |

### Icons
- Icon size: 16px (`--icon-sm`) for default, 14px for `sm`, 18px for `lg`
- Icon-to-text gap: `--space-0.5` (2px)
- Icon-only button: Use `size="icon"` and provide `aria-label`

### Spacing
- Internal padding: Per size (see Sizes table)
- External margin: Not defined (parent controls spacing)
- Button group gap: `--space-2` (8px)

### Responsive Behavior
- Desktop: All sizes available
- Mobile: Minimum 44px height (use `lg` or custom), `fullWidth` recommended for primary CTAs
- Touch target: 44px × 44px minimum on mobile

### Accessibility
- `<button>` element (semantic HTML)
- `aria-busy="true"` when loading
- `aria-label` required for icon-only buttons
- `aria-disabled="true"` when disabled (in addition to `disabled` attribute)
- Focus ring: `ring-2 ring-ring ring-offset-2` on `focus-visible`
- Keyboard: `Enter` and `Space` activate

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Enter` | Activate button |
| `Space` | Activate button |
| `Tab` | Move to next focusable element |

### Animations
- Hover: MI-01 (150ms, background color)
- Press: MI-02 (100ms, scale 0.97)
- Loading: MI-21 (spinner, 800ms loop)

### Loading
- Text replaced by `Spinner` + loading text (e.g., "Saving...")
- Button disabled (no further clicks)
- Variant color maintained

### Empty
N/A (buttons don't have empty state)

### Error
N/A (buttons don't have error state; errors shown as toasts)

### Disabled
- `opacity-50`
- `cursor-not-allowed`
- `pointer-events-none`
- No hover, focus, or active states

### Examples (Usage Scenarios)

| Scenario | Variant | Size | Text | Icon |
|----------|--------|------|------|------|
| "Add Screen" (primary CTA) | `default` | `default` | "Add Screen" | `Plus` |
| "Cancel" (dialog) | `ghost` | `default` | "Cancel" | — |
| "Save" (form submit) | `default` | `default` | "Save" | — |
| "Delete" (destructive) | `destructive` | `default` | "Delete" | `Trash2` |
| "More" (card menu) | `ghost` | `icon` | — | `MoreHorizontal` |
| "Sign In" (auth) | `default` | `default` | "Sign In" | — |
| "Publish Now" (primary) | `default` | `default` | "Publish Now" | `Send` |

### Anti-Patterns
- **Multiple primary buttons** in one section — only one `variant="default"` per section
- **Using `default` for cancel** — cancel is always `ghost` or `outline`
- **Icon-only button without `aria-label`** — accessibility violation
- **Full-width button on desktop** — only for auth pages and mobile
- **Using button for navigation** — use `Link` with button styling instead
- **Nested buttons** — invalid HTML; use div with onClick for container
- **Loading without disabled** — button must be disabled during loading

### Acceptance Criteria
- [ ] All 5 variants render with correct colors
- [ ] All 4 sizes render with correct dimensions
- [ ] Hover state darkens background (150ms)
- [ ] Focus ring visible on keyboard navigation
- [ ] Press state scales to 0.97 (100ms)
- [ ] Disabled state shows opacity-50 and not-allowed cursor
- [ ] Loading state shows spinner and disables button
- [ ] Icon-only button has `aria-label`
- [ ] `Enter` and `Space` activate the button
- [ ] Touch target ≥ 44px on mobile

### Future Scalability
- `loadingText` prop for custom loading text
- `iconPosition` prop (`left` | `right` | `top`)
- Badge support (e.g., "Add Screen (3)")
- Confirmation built-in (click → dialog → action)
- Async onClick (auto-loading state)

---

## Cross-References

- See `01-foundations.md` for color and spacing tokens
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for MI-01, MI-02, MI-21
- See `10-accessibility-rules.md` for accessibility requirements
- See `42-variant-rules.md` for variant rules
- See `ux-blueprint/03-component-ux-standards.md` §3 for button standards
