# 13 — Input Specifications

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md` §3, `screen-specifications/02-auth-error-specs.md`, `screen-specifications/09-settings-specs-part1.md`, `screen-specifications/10-settings-specs-part2.md`

---

## Component: Input

### Purpose
Text entry field for user data input.

### Usage
Forms, search bars, filter inputs, inline editing.

### When to Use
- Collecting text data (name, email, password, search query)
- Inline editing (screen name, playlist name)
- Search and filter inputs

### When NOT to Use
- Long text (use `Textarea`)
- Selecting from options (use `Select`)
- Boolean state (use `Checkbox` or `Toggle`)
- Date selection (use `DatePicker`)

### Hierarchy
Inputs are always within a `FormField` wrapper (label + input + error).

### Variants

| Variant | Border | Background | Usage |
|---------|--------|-----------|-------|
| `default` | `--input` (1px) | `--card` | Standard text input |
| `error` | `--destructive` (2px) | `--destructive/5` | Validation error |
| `disabled` | `--border` (1px) | `--muted` | Read-only or disabled |
| `withAdornment` | `--input` (1px) | `--card` | With icon or button inside |

### Types

| Type | HTML Type | Usage |
|------|-----------|-------|
| `text` | `text` | General text (name, title) |
| `email` | `email` | Email addresses |
| `password` | `password` | Passwords (with show/hide toggle) |
| `number` | `number` | Numeric values (position, size) |
| `search` | `search` | Search queries |
| `tel` | `tel` | Phone numbers |
| `url` | `url` | URLs |

### Sizes

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 32px | `--space-1.5 --space-2` | `--text-sm` |
| `default` | 36px | `--space-1.5 --space-3` | `--text-base` |
| `lg` | 40px | `--space-2 --space-3` | `--text-base` |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Default | `--input` border, `--card` bg | — |
| Hover | `--border-strong` border | MI-01 (150ms) |
| Focus | `--ring` border (2px), `--card` bg | Instant |
| Error | `--destructive` border (2px), `--destructive/5` bg | MI-01 (150ms) |
| Disabled | `--border` border, `--muted` bg, opacity-50 | Instant |
| Placeholder | `--muted-foreground` text | — |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `text \| email \| password \| number \| search \| tel \| url` | `text` | Input type |
| `value` | `string` | — | Controlled value |
| `defaultValue` | `string` | — | Uncontrolled default |
| `placeholder` | `string` | — | Placeholder text |
| `disabled` | `boolean` | `false` | Disabled state |
| `readOnly` | `boolean` | `false` | Read-only state |
| `error` | `boolean` | `false` | Error state |
| `size` | `sm \| default \| lg` | `default` | Input size |
| `leftIcon` | `LucideIcon` | — | Icon inside left |
| `rightIcon` | `LucideIcon` | — | Icon inside right |
| `autoFocus` | `boolean` | `false` | Auto-focus on mount |
| `autoComplete` | `string` | — | HTML autocomplete |
| `aria-label` | `string` | — | Accessible label (if no visible label) |
| `onChange` | `(e) => void` | — | Change handler |
| `onBlur` | `(e) => void` | — | Blur handler (validation) |

### Icons
- Left icon: Search icon in search inputs, Mail icon in email inputs
- Right icon: Eye/EyeOff in password inputs, clear (X) in search inputs
- Icon size: 16px (`--icon-sm`)
- Icon color: `--muted-foreground`
- Icon-to-text gap: `--space-2` (8px)

### Spacing
- Internal padding: Per size (see Sizes table)
- Form field gap: `--space-3` (12px) between fields
- Label-to-input gap: `--space-1.5` (6px)

### Responsive Behavior
- Desktop: All sizes available
- Mobile: Use `--text-base` (16px) font size to prevent iOS zoom
- Full width on mobile (no fixed widths)
- Touch target: 36px minimum (44px recommended on mobile)

### Accessibility
- `<input>` element with associated `<label>`
- `aria-invalid="true"` when error
- `aria-describedby` pointing to error message element
- `aria-label` when no visible label
- Focus ring: 2px `--ring` border on focus
- `autocomplete` attribute for appropriate types
- Keyboard: `Tab` to focus, type to enter, `Enter` to submit form

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Tab` | Focus input |
| `Shift+Tab` | Focus previous element |
| Type | Enter text |
| `Enter` | Submit form (if within form) |
| `Escape` | Blur input (clear focus) |

### Animations
- Hover: MI-01 (150ms, border color)
- Focus: Instant (border color change to `--ring`)
- Error: MI-01 (150ms, border color to `--destructive`)

### Loading
N/A (inputs don't have loading state; parent form handles loading)

### Empty
- Placeholder text shown when value is empty
- Placeholder color: `--muted-foreground`

### Error
- Border: `--destructive` (2px)
- Background: `--destructive/5`
- Error message below input (via `FormField` wrapper)
- Error icon (AlertCircle, 14px) on right side

### Disabled
- `opacity-50`
- `cursor-not-allowed`
- `pointer-events-none`
- Background: `--muted`

### Anti-Patterns
- **Input without label** — always use `FormField` with label (or `aria-label`)
- **Fixed width on mobile** — inputs should be full-width on mobile
- **Font size < 16px on mobile** — causes iOS zoom
- **Placeholder as label** — placeholder disappears on focus; always have a visible label
- **Multiple inputs in a row on mobile** — stack vertically on mobile
- **No validation feedback** — always show error state with message

### Acceptance Criteria
- [ ] All types render correctly
- [ ] Focus state shows `--ring` border (2px)
- [ ] Error state shows `--destructive` border + error message
- [ ] Disabled state shows opacity-50 and not-allowed cursor
- [ ] Placeholder uses `--muted-foreground`
- [ ] Left and right icons render correctly
- [ ] Password input has show/hide toggle
- [ ] `aria-invalid` and `aria-describedby` set on error
- [ ] Font size is 16px on mobile (prevents iOS zoom)
- [ ] Keyboard: Tab to focus, Enter to submit

### Future Scalability
- `prefix` and `suffix` text (e.g., "$" for currency, "px" for dimensions)
- Input mask support (e.g., phone number formatting)
- Character counter (for limited-length inputs)
- Copy-to-clipboard button option

---

## Component: PasswordInput

### Purpose
Password input with show/hide toggle.

### Variants
Same as Input, with built-in show/hide toggle.

### Additional Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showToggle` | `boolean` | `true` | Show/hide toggle button |

### Toggle Button
- Icon: `Eye` (show) / `EyeOff` (hide), 16px
- Position: Right side of input
- `aria-label`: "Show password" / "Hide password"
- Click: Toggles `type` between `password` and `text`

---

## Component: Textarea

### Purpose
Multi-line text input.

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `rows` | `number` | 4 | Visible rows |
| `maxLength` | `number` | — | Max character count |
| `resize` | `none \| vertical \| horizontal` | `vertical` | Resize behavior |

### Usage
- Studio text layer content
- (Future) Description fields
- (Future) Notes

---

## Component: Checkbox

### Purpose
Select one or more options from a set.

### States
| State | Visual |
|-------|--------|
| Unchecked | `--card` bg, `--input` border (1px) |
| Checked | `--primary` bg, `--primary-foreground` checkmark |
| Indeterminate | `--primary` bg, horizontal line |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Error | `--destructive` border |
| Focus | `ring-2 ring-ring ring-offset-2` |

### Props
| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` |
| `indeterminate` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `label` | `string` | — |
| `onChange` | `(checked) => void` | — |

### Size
- Control: 16px × 16px (default), 20px × 20px (large)
- Touch target: 32px total (with padding)

### Animation
- Checkmark: MI-04 (150ms, draw-in)

---

## Component: Toggle (Switch)

### Purpose
Toggle a boolean setting on/off.

### States
| State | Visual |
|-------|--------|
| Off | `--input` bg, thumb on left |
| On | `--primary` bg, thumb on right |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Focus | `ring-2 ring-ring ring-offset-2` |

### Size
- Track: 36px × 20px
- Thumb: 16px × 16px

### Animation
- Thumb slide: MI-03 (150ms, `--ease-bounce`)

### Props
| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` |
| `disabled` | `boolean` | `false` |
| `label` | `string` | — |
| `onChange` | `(checked) => void` | — |

### Accessibility
- `role="switch"`
- `aria-checked`
- `aria-label` (or associated label)
- Keyboard: `Space` to toggle

---

## Component: Select (Dropdown)

### Purpose
Select one option from a list.

### States
| State | Visual |
|-------|--------|
| Default | `--input` border, `--card` bg, chevron down |
| Open | `--ring` border, dropdown panel visible |
| Disabled | `opacity-50`, `cursor-not-allowed` |
| Error | `--destructive` border |
| Focus | `ring-2 ring-ring ring-offset-2` |

### Props
| Prop | Type | Default |
|------|------|---------|
| `value` | `string` | — |
| `options` | `{value, label}[]` | — |
| `placeholder` | `string` | "Select..." |
| `disabled` | `boolean` | `false` |
| `searchable` | `boolean` | `false` |
| `onChange` | `(value) => void` | — |

### Dropdown Panel
- Background: `--popover`
- Border: `--border` (1px)
- Shadow: `--shadow-md`
- Max height: 300px (scrollable)
- Animation: MI-05 (200ms, fade + slide down)

### Accessibility
- `role="combobox"` (if searchable) or `role="listbox"`
- `aria-expanded`
- `aria-selected` on selected option
- Keyboard: Arrow keys to navigate, Enter to select, Escape to close

---

## Cross-References

- See `01-foundations.md` for color and spacing tokens
- See `09-interaction-states.md` for state definitions
- See `10-accessibility-rules.md` for accessibility requirements
- See `14-form-standards.md` for form composition rules
- See `ux-blueprint/03-component-ux-standards.md` §3 for input standards
