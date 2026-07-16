# 22 — Dialog Standards

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md` (MI-06, MI-07), `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md` §4, `screen-specifications/13-shared-dialogs-specs.md`

---

## Component: Dialog

### Purpose
Modal overlay for focused tasks, confirmations, and forms.

### Usage
- Form dialogs (invite member, create schedule, create API key)
- Confirmation dialogs (delete, remove, revoke)
- Information dialogs (2FA setup, template picker)
- Multi-step dialogs (2FA setup: QR → Verify → Backup Codes)

### When to Use
- Task requires focused attention (form, selection)
- Confirmation needed before destructive action
- Content needs to be displayed without navigation
- Multi-step flow within current page context

### When NOT to Use
- Simple yes/no confirmation (use AlertDialog)
- Side panel content (use Drawer instead)
- Full-page content (navigate to new page)
- Non-blocking notifications (use Toast)
- Quick settings (use Popover instead)

### Variants

| Variant | Usage | Max Width | Evidence |
|---------|-------|-----------|----------|
| `dialog` | General purpose, forms | `max-w-[500px]` | `13-shared-dialogs-specs.md` |
| `alertDialog` | Destructive confirmation | `max-w-[450px]` | `13-shared-dialogs-specs.md` |
| `wide` | Template picker, complex forms | `max-w-[700px]` | `13-shared-dialogs-specs.md` |
| `form` | Form-based dialogs | `max-w-[600px]` | `13-shared-dialogs-specs.md` |

### Structure

```
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description text</DialogDescription>
    </DialogHeader>
    <DialogContent>
      {/* Form or content */}
    </DialogContent>
    <DialogFooter>
      <Button variant="ghost">Cancel</Button>
      <Button variant="default">Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Overlay | `bg-black/50` | `--opacity-50` |
| Dialog bg | `--popover` | `--popover` |
| Dialog border | `--border` (1px) | `--border` |
| Dialog radius | `--radius-xl` (12px) | `--radius-xl` |
| Dialog shadow | `--shadow-lg` | Elevation 4 |
| Dialog padding | `--space-6` | — |
| Title | `--text-lg --font-semibold --foreground` | — |
| Description | `--text-sm --font-normal --muted-foreground` | — |
| Close button (X) | Top-right, ghost icon button | — |

### Sizes

| Size | Max Width | Max Height | Usage |
|------|-----------|------------|-------|
| `sm` | 400px | 80vh | Simple confirmations |
| `default` | 500px | 80vh | Standard dialogs |
| `lg` | 600px | 80vh | Form dialogs |
| `xl` | 700px | 80vh | Template picker, complex |
| `full` | 90vw | 90vh | (Future) Large content |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Opening | Scale 0.95 → 1.0 + fade 0 → 1 | MI-06 (200ms, `--ease-out`) |
| Open | Full opacity, scale 1.0 | — |
| Closing | Scale 1.0 → 0.95 + fade 1 → 0 | MI-07 (150ms, `--ease-in`) |
| Loading (submit) | Submit button shows spinner | MI-21 |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Dialog visibility |
| `onOpenChange` | `(open) => void` | — | Open state handler |
| `title` | `string` | — | Dialog title (required) |
| `description` | `string` | — | Dialog description |
| `size` | `sm \| default \| lg \| xl \| full` | `default` | Dialog size |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking overlay |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `children` | `ReactNode` | — | Dialog content |

### Sub-Components

#### DialogHeader
- Layout: `flex flex-col gap-1.5`
- Padding: Bottom `--space-4`

#### DialogTitle
- Font: `--text-lg --font-semibold --foreground`
- Accessibility: Referenced by `aria-labelledby`

#### DialogDescription
- Font: `--text-sm --font-normal --muted-foreground`

#### DialogContent
- Layout: `flex flex-col gap-4`
- Scrollable: `overflow-y-auto` if content exceeds max height

#### DialogFooter
- Layout: `flex items-center justify-end gap-3`
- Padding: Top `--space-4`
- Order: Cancel (left, ghost) → Confirm (right, default/destructive)

### Accessibility
- `role="dialog"` (or `role="alertdialog"` for confirmations)
- `aria-modal="true"`
- `aria-labelledby` pointing to DialogTitle
- `aria-describedby` pointing to DialogDescription (if present)
- Focus trap: Tab cycles within dialog
- Initial focus: First interactive element (or Cancel button for AlertDialog)
- Escape: Closes dialog
- Focus restore: Returns to trigger element on close

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Escape` | Close dialog |
| `Tab` | Cycle focus within dialog (trap) |
| `Shift+Tab` | Reverse cycle within dialog |
| `Enter` | Activate focused button |

### Animations
- Open: MI-06 (200ms, scale 0.95→1 + fade)
- Close: MI-07 (150ms, scale 1→0.95 + fade)
- Reduced motion: Fade only (no scale)

### Loading
- Submit button: Spinner + disabled
- Dialog stays open during loading
- Close on success (parent closes dialog)

### Anti-Patterns
- **Dialog without title** — always provide DialogTitle
- **Dialog without close method** — always provide Escape + overlay click + close button
- **Nested dialogs** — never open a dialog from within a dialog; redesign the flow
- **Dialog for simple navigation** — use a page or drawer instead
- **No focus trap** — Tab must not leave dialog
- **No focus restore** — focus must return to trigger element
- **Destructive action without AlertDialog** — use `role="alertdialog"` with Cancel as default focus

### Acceptance Criteria
- [ ] Dialog opens with scale + fade animation (MI-06, 200ms)
- [ ] Dialog closes with scale + fade animation (MI-07, 150ms)
- [ ] Overlay is `bg-black/50`
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] `aria-labelledby` points to title
- [ ] Focus trap: Tab cycles within dialog
- [ ] Escape closes dialog
- [ ] Focus returns to trigger on close
- [ ] Close button (X) in top-right
- [ ] Footer: Cancel (left) + Confirm (right)
- [ ] AlertDialog: Cancel has default focus (safe default)
- [ ] No scroll on body when dialog open
- [ ] Reduced motion: fade only

### Future Scalability
- `draggable` prop (dialog can be moved)
- `resizable` prop (dialog can be resized)
- `fullscreen` variant (90vw × 90vh)
- Multi-step dialog built-in (step indicator + navigation)

---

## Component: AlertDialog (Destructive Confirmation)

### Purpose
Confirmation dialog for destructive actions.

### Variants
Same as Dialog but with `role="alertdialog"`.

### Key Differences from Dialog
- **Focus:** Default focus on Cancel button (safe default — UP-09)
- **Confirm button:** `variant="destructive"` (red)
- **No description scroll:** Short, clear message
- **Title format:** "Delete [Name]?" or "Remove [Name]?"

### Structure

```
<AlertDialog open={open} onClose={onClose}>
  <AlertDialogHeader>
    <AlertDialogTitle>Delete playlist?</AlertDialogTitle>
    <AlertDialogDescription>3 active schedules will be affected. This cannot be undone.</AlertDialogDescription>
  </AlertDialogHeader>
  <AlertDialogFooter>
    <Button variant="outline" onClick={onClose} autoFocus>Cancel</Button>
    <Button variant="destructive" onClick={onConfirm}>Delete</Button>
  </AlertDialogFooter>
</AlertDialog>
```

### Evidence
`screen-specifications/13-shared-dialogs-specs.md` SCR-DLG-05

---

## Cross-References

- See `01-foundations.md` for color, radius, shadow tokens
- See `07-motion-system.md` for MI-06, MI-07
- See `09-interaction-states.md` for button states
- See `10-accessibility-rules.md` for dialog accessibility
- See `23-drawer-standards.md` for drawer (alternative overlay)
- See `24-toast-standards.md` for toast feedback after dialog action
- See `screen-specifications/13-shared-dialogs-specs.md` for all dialog specs
- See `ux-blueprint/03-component-ux-standards.md` §4 for dialog standards
- See `product-architecture/17-product-rules.md` UP-09 for safe defaults
