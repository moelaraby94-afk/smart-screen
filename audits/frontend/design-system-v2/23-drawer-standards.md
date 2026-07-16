# 23 — Drawer Standards

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md` (MI-15, MI-16), `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md` §4, `screen-specifications/01-global-layout-spec.md` (mobile sidebar)

---

## Component: Drawer

### Purpose
Side-panel overlay for content that doesn't need a full page or dialog.

### Usage
- Mobile sidebar (navigation drawer)
- (Future) Screen quick settings
- (Future) Filter panel
- (Future) Notification panel

### When to Use
- Navigation on mobile (sidebar replacement)
- Content that supplements the main view
- Settings or filters that don't block the page
- Content too tall for a dialog but doesn't need a full page

### When NOT to Use
- Focused form tasks (use Dialog)
- Destructive confirmation (use AlertDialog)
- Full-page content (navigate to page)
- Quick tooltips (use Popover)

### Variants

| Variant | Side | Width | Usage |
|---------|------|-------|-------|
| `left` | Left | 280px (mobile: 85vw) | Mobile sidebar, navigation |
| `right` | Right | 400px (mobile: 85vw) | Quick settings, details panel |
| `bottom` | Bottom | 100% width, auto height | (Future) Mobile action sheet |

### Structure

```
<Drawer open={open} onClose={onClose} side="left">
  <DrawerOverlay />
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Title</DrawerTitle>
      <DrawerClose /> {/* X button */}
    </DrawerHeader>
    <DrawerBody>
      {/* Content */}
    </DrawerBody>
    <DrawerFooter>
      {/* Actions (optional) */}
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Overlay | `bg-black/50` | `--opacity-50` |
| Drawer bg | `--popover` | `--popover` |
| Drawer border | `--border` (1px, on the side facing content) | `--border` |
| Drawer shadow | `--shadow-lg` | Elevation 4 |
| Drawer radius | 0 (flush with edge) | — |
| Drawer padding | `--space-4` header, `--space-4` body | — |
| Title | `--text-base --font-semibold --foreground` | — |
| Close button (X) | Top-right, ghost icon button | — |

### Sizes

| Side | Desktop Width | Mobile Width | Max Width |
|------|--------------|--------------|-----------|
| Left | 280px | 85vw | 320px |
| Right | 400px | 85vw | 400px |
| Bottom | 100% | 100% | — |

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Opening | Slide in from edge + overlay fade | MI-15 (200ms, `--ease-out`) |
| Open | Full visible, overlay at 50% | — |
| Closing | Slide out to edge + overlay fade | MI-16 (150ms, `--ease-in`) |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Drawer visibility |
| `onClose` | `() => void` | — | Close handler |
| `side` | `left \| right \| bottom` | `right` | Drawer side |
| `title` | `string` | — | Drawer title |
| `closeOnOverlayClick` | `boolean` | `true` | Close on overlay click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape |
| `children` | `ReactNode` | — | Drawer content |

### Sub-Components

#### DrawerHeader
- Layout: `flex items-center justify-between`
- Padding: `--space-4`
- Border: `--border` (bottom, 1px)

#### DrawerBody
- Padding: `--space-4`
- Scrollable: `overflow-y-auto`
- Flex: `flex-1`

#### DrawerFooter
- Layout: `flex items-center justify-end gap-3`
- Padding: `--space-4`
- Border: `--border` (top, 1px)

### Accessibility
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby` pointing to title
- Focus trap: Tab cycles within drawer
- Initial focus: First interactive element (or close button)
- Escape: Closes drawer
- Focus restore: Returns to trigger element on close

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Escape` | Close drawer |
| `Tab` | Cycle focus within drawer (trap) |
| `Shift+Tab` | Reverse cycle |

### Animations
- Open: MI-15 (200ms, slide in + overlay fade)
- Close: MI-16 (150ms, slide out + overlay fade)
- Left: Slide from `translateX(-100%)` to `translateX(0)`
- Right: Slide from `translateX(100%)` to `translateX(0)`
- Bottom: Slide from `translateY(100%)` to `translateY(0)`
- Reduced motion: Fade only (no slide)

### Anti-Patterns
- **Drawer without overlay** — overlay is required for modal behavior
- **Drawer too wide on mobile** — max 85vw on mobile
- **No close method** — always provide Escape + overlay + close button
- **No focus trap** — Tab must not leave drawer
- **Drawer for forms** — use Dialog for form tasks (better focus management)
- **Multiple drawers open** — only one drawer at a time

### Acceptance Criteria
- [ ] Drawer slides in from correct side (MI-15, 200ms)
- [ ] Drawer slides out to correct side (MI-16, 150ms)
- [ ] Overlay is `bg-black/50`
- [ ] `role="dialog"` and `aria-modal="true"`
- [ ] Focus trap: Tab cycles within drawer
- [ ] Escape closes drawer
- [ ] Focus returns to trigger on close
- [ ] Close button (X) in header
- [ ] Body scroll locked when drawer open
- [ ] Mobile width: max 85vw
- [ ] Reduced motion: fade only

### Future Scalability
- `resizable` prop (drawer can be resized)
- `persistent` variant (no overlay, pushes content)
- Swipe-to-close on mobile (gesture support)

---

## Cross-References

- See `01-foundations.md` for color, shadow tokens
- See `07-motion-system.md` for MI-15, MI-16
- See `10-accessibility-rules.md` for drawer accessibility
- See `22-dialog-standards.md` for dialog (alternative overlay)
- See `screen-specifications/01-global-layout-spec.md` for mobile sidebar drawer
- See `ux-blueprint/03-component-ux-standards.md` §4 for overlay standards
