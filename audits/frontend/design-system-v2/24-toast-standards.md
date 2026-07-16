# 24 — Toast Standards

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md` (MI-10, MI-23), `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md` §5, `screen-specifications/` (all files use toasts), `21-success-states.md`

---

## Component: Toast

### Purpose
Brief, non-blocking notification for action feedback.

### Usage
- Action success (save, create, delete, update)
- Action failure (API error, network error)
- Information (invite accepted, invite declined)
- Warning (storage near limit — future)

### When to Use
- After any user-initiated action completes (success or failure)
- Realtime events (invite accepted, member joined)
- Non-blocking warnings

### When NOT to Use
- Form validation errors (use inline FormError)
- Page load errors (use ErrorState)
- Confirmation before action (use Dialog/AlertDialog)
- Persistent status (use Badge or Banner)
- Critical errors (use ErrorState or ErrorBoundary)

### Variants

| Variant | Background | Icon | Icon Color | Border | Usage |
|---------|-----------|------|------------|--------|-------|
| `success` | `--card` | `CheckCircle` | `--success` | `--success/20` (left, 4px) | Action succeeded |
| `error` | `--card` | `XCircle` | `--destructive` | `--destructive/20` (left, 4px) | Action failed |
| `warning` | `--card` | `AlertTriangle` | `--warning` | `--warning/20` (left, 4px) | Warning |
| `info` | `--card` | `Info` | `--primary` | `--primary/20` (left, 4px) | Information |

### Visual Design

| Element | Style | Token |
|---------|-------|-------|
| Container | `--card` bg, `--radius-lg`, `--shadow-2xl` | Elevation 6 |
| Width | `360px` (desktop), `calc(100vw - 32px)` (mobile) | — |
| Min height | `48px` | — |
| Padding | `--space-3 --space-4` | — |
| Icon | 20px (`--icon-lg`) | — |
| Icon-to-text gap | `--space-3` (12px) | — |
| Title | `--text-sm --font-medium --foreground` | — |
| Description | `--text-xs --font-normal --muted-foreground` | — |
| Close button | `X` icon, 16px, ghost | — |
| Left accent border | 4px, variant color | — |

### Position

| Breakpoint | Position |
|------------|----------|
| Desktop (≥ 768px) | Bottom-right, `24px` from edges |
| Mobile (< 768px) | Bottom-center, `16px` from edges |

### Stack Behavior
- Multiple toasts stack vertically (newest at bottom)
- Stack gap: `--space-2` (8px)
- Maximum visible: 3 (older ones hidden, queue)
- Stack position: Bottom-right (desktop), bottom-center (mobile)

### States

| State | Visual | Animation |
|-------|--------|-----------|
| Entering | Slide up from bottom + fade in | MI-10 (200ms, `--ease-out`) |
| Visible | Full opacity, stationary | — |
| Auto-dismissing | Fading out | MI-23 (300ms, `--ease-in`) |
| Manual close | Fading out | MI-23 (300ms, `--ease-in`) |

### Duration

| Variant | Auto-Dismiss | Evidence |
|---------|-------------|----------|
| `success` | 3 seconds | All specs |
| `info` | 4 seconds | — |
| `warning` | 5 seconds | — |
| `error` | 5 seconds (longer — user needs to read) | — |

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `success \| error \| warning \| info` | `info` | Toast type |
| `title` | `string` | — | Toast title (required) |
| `description` | `string` | — | Additional detail |
| `duration` | `number` | 3000 | Auto-dismiss ms (0 = manual) |
| `action` | `{ label, onClick }` | — | Optional action button |
| `onClose` | `() => void` | — | Close handler |

### Sub-Components

#### ToastIcon
- Size: 20px (`--icon-lg`)
- Color: Per variant
- Position: Left of content

#### ToastContent
- Layout: `flex-1 flex flex-col gap-0.5`
- Title: `--text-sm --font-medium`
- Description: `--text-xs --muted-foreground`

#### ToastAction
- Button: `ghost` variant, `sm` size
- Position: Right of content (before close button)
- Usage: "Undo" (future), "Retry", "View"

#### ToastClose
- Icon: `X` (16px)
- Variant: Ghost icon button
- Position: Top-right

### Accessibility
- Container: `role="status"` (info/success) or `role="alert"` (error/warning)
- `aria-live`: `polite` (info/success) or `assertive` (error)
- `aria-atomic="true"` (entire toast announced)
- Icon: `aria-hidden="true"` (decorative — text conveys meaning)
- Close button: `aria-label="Close notification"`

### Keyboard Behavior
| Key | Action |
|-----|--------|
| `Tab` | Move to action button or close button |
| `Enter` | Activate action or close |
| `Escape` | Close toast (if focused) |

### Animations
- Enter: MI-10 (200ms, slide up + fade in)
- Exit: MI-23 (300ms, fade out)
- Reduced motion: Fade only (no slide)

### Anti-Patterns
- **Toast for form validation** — use inline FormError
- **Toast for page error** — use ErrorState
- **Toast without variant** — always specify variant (affects icon, color, duration)
- **Toast with too much text** — keep title < 50 chars, description < 100 chars
- **Blocking toast** — toasts are non-blocking; never prevent interaction
- **Toast without auto-dismiss** — unless error with manual close, always auto-dismiss
- **Multiple identical toasts** — deduplicate (don't stack 5 "Saved" toasts)
- **Toast at top of page** — always bottom (doesn't cover header/content)

### Acceptance Criteria
- [ ] All 4 variants render with correct icon and accent border
- [ ] Toast appears at bottom-right (desktop) or bottom-center (mobile)
- [ ] Enter animation: MI-10 (slide up + fade, 200ms)
- [ ] Exit animation: MI-23 (fade out, 300ms)
- [ ] Auto-dismiss: 3s (success), 4s (info), 5s (warning/error)
- [ ] Close button (X) visible and functional
- [ ] `role="status"` (info/success) or `role="alert"` (error/warning)
- [ ] `aria-live` set correctly
- [ ] Stack: max 3 visible, gap 8px
- [ ] Shadow: `--shadow-2xl` (elevation 6)
- [ ] Width: 360px (desktop), `calc(100vw - 32px)` (mobile)
- [ ] Reduced motion: fade only

### Future Scalability
- Undo action support (with timeout and API rollback)
- Toast grouping (group similar notifications)
- Toast history (view past toasts)
- Custom icons per toast
- Rich content (links, formatting)

---

## Cross-References

- See `01-foundations.md` for color and shadow tokens
- See `07-motion-system.md` for MI-10, MI-23
- See `09-interaction-states.md` for state definitions
- See `10-accessibility-rules.md` for aria-live rules
- See `20-error-states.md` for error handling patterns
- See `21-success-states.md` for success toast catalog
- See `ux-blueprint/03-component-ux-standards.md` §5 for toast standards
