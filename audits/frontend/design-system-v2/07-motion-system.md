# 07 — Motion System

> **Evidence basis:** `01-foundations.md`, `ux-blueprint/03-component-ux-standards.md` §7, `user-flow-architecture/01-flow-principles.md` FP-06, `product-architecture/17-product-rules.md` PR-47, `screen-specifications/06-studio-spec.md` (MI references)

---

## 1. Motion Philosophy

Motion in Smart Screen is **functional, not decorative**. Every animation serves a purpose: providing feedback, guiding attention, indicating state changes, or reducing perceived latency. Animations are **subtle, fast, and respect user preferences** (`prefers-reduced-motion`).

---

## 2. Motion Tokens

### 2.1 Duration

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `0ms` | No animation (immediate change) |
| `--duration-fast` | `150ms` | Hover, focus, toggle, small state changes |
| `--duration-normal` | `200ms` | Dialog open/close, dropdown, page transition |
| `--duration-slow` | `300ms` | Card fade-in, onboarding step, overlay |
| `--duration-slower` | `400ms` | Splash screen fade, large element transition |
| `--duration-slowest` | `600ms` | Success checkmark animation, complex sequence |

### 2.2 Easing

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose (Material standard) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Element exiting (fade out, collapse) |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Element entering (fade in, expand) |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Bidirectional (dialog, drawer) |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful (success checkmark, toggle) |

### 2.3 Delay

| Token | Value | Usage |
|-------|-------|-------|
| `--delay-none` | `0ms` | No delay |
| `--delay-short` | `50ms` | Stagger between items (list animation) |
| `--delay-medium` | `100ms` | Sequential animation steps |

---

## 3. Motion Inventory (MI)

Each motion is identified by an MI ID for cross-referencing.

### 3.1 Micro Interactions

| MI ID | Element | Trigger | Animation | Duration | Easing |
|-------|---------|---------|-----------|----------|--------|
| MI-01 | Button hover | Mouse enter | Background color change | 150ms | `--ease-default` |
| MI-02 | Button press | Mouse down | Scale 0.97 | 100ms | `--ease-default` |
| MI-03 | Toggle switch | Click | Thumb slides, background color changes | 150ms | `--ease-bounce` |
| MI-04 | Checkbox check | Click | Checkmark draws in | 150ms | `--ease-out` |
| MI-05 | Dropdown open | Click | Content fades + slides down (8px) | 200ms | `--ease-out` |
| MI-06 | Dialog open | Trigger | Scale 0.95 → 1.0 + fade 0 → 1 | 200ms | `--ease-out` |
| MI-07 | Dialog close | Close | Scale 1.0 → 0.95 + fade 1 → 0 | 150ms | `--ease-in` |
| MI-08 | Card fade in | Mount | Opacity 0 → 1 + translateY(8px → 0) | 300ms | `--ease-out` |
| MI-09 | Element remove | Delete | Opacity 1 → 0 + scale 1 → 0.95 | 150ms | `--ease-in` |
| MI-10 | Toast enter | Trigger | Slide up from bottom + fade in | 200ms | `--ease-out` |
| MI-11 | Success checkmark | Success | SVG path draw + scale bounce | 600ms | `--ease-bounce` |
| MI-12 | Skeleton shimmer | Loading | Background gradient sweep (left to right) | 1500ms (loop) | `--ease-default` |
| MI-13 | Tab indicator | Tab change | Underline slides to new tab | 200ms | `--ease-in-out` |
| MI-14 | Sidebar item hover | Mouse enter | Background fade in | 150ms | `--ease-default` |
| MI-15 | Drawer open | Trigger | Slide in from edge + overlay fade | 200ms | `--ease-out` |
| MI-16 | Drawer close | Close | Slide out to edge + overlay fade | 150ms | `--ease-in` |
| MI-17 | Tooltip show | Hover (500ms delay) | Fade in | 150ms | `--ease-out` |
| MI-18 | Tooltip hide | Mouse leave | Fade out | 100ms | `--ease-in` |
| MI-19 | Page transition | Route change | Content fade (opacity only) | 200ms | `--ease-default` |
| MI-20 | List item stagger | Mount | Each item fades in with 50ms delay | 300ms + 50ms/item | `--ease-out` |

### 3.2 Loading Animations

| MI ID | Element | Animation | Duration | Easing |
|-------|---------|-----------|----------|--------|
| MI-12 | Skeleton | Shimmer sweep (gradient) | 1500ms loop | `--ease-default` |
| MI-21 | Spinner | Rotate 360° | 800ms loop | linear |
| MI-22 | Progress bar | Width increase | Variable | `--ease-default` |

### 3.3 Success Animations

| MI ID | Element | Animation | Duration | Easing |
|-------|---------|-----------|----------|--------|
| MI-11 | Checkmark | SVG path draw + scale bounce | 600ms | `--ease-bounce` |
| MI-23 | Toast success | Slide up + fade in + auto-dismiss after 3s | 200ms in, 300ms out | `--ease-out` / `--ease-in` |

---

## 4. Reduced Motion

### 4.1 Rule

All animations **must** respect `prefers-reduced-motion: reduce`. When reduced motion is enabled:

| Animation | Reduced Behavior |
|-----------|-----------------|
| MI-01 (button hover) | Instant color change (no transition) |
| MI-02 (button press) | No scale (instant) |
| MI-03 (toggle) | Instant state change |
| MI-04 (checkbox) | Instant checkmark |
| MI-05 (dropdown) | Instant show/hide |
| MI-06 (dialog open) | Fade only (no scale) |
| MI-07 (dialog close) | Fade only (no scale) |
| MI-08 (card fade in) | Instant show (no animation) |
| MI-09 (element remove) | Instant hide |
| MI-10 (toast enter) | Instant show |
| MI-11 (success checkmark) | Instant show (no draw animation) |
| MI-12 (skeleton) | Static gray (no shimmer) |
| MI-15 (drawer open) | Instant show |
| MI-19 (page transition) | Instant (no fade) |
| MI-20 (list stagger) | Instant show all items |
| MI-21 (spinner) | Static or slow rotate (2s) |

### 4.2 Implementation

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Motion Rules

- **Every animation** must have a functional purpose — no decorative motion
- **Duration:** Never exceed 600ms for any animation (except skeleton shimmer loop)
- **Easing:** Use defined easing tokens — never `linear` (except spinner rotation)
- **Reduced motion:** Always provide reduced-motion fallback
- **Performance:** Animations must use `transform` and `opacity` only — never animate `width`, `height`, `top`, `left` (causes reflow)
- **Stagger:** Maximum 50ms delay between staggered items; cap at 5 items (no infinite stagger)
- **Loop:** Only skeleton shimmer and spinner may loop
- **No bounce** except toggle switch (MI-03) and success checkmark (MI-11) — bounce is playful, not enterprise
- **Page transitions:** Opacity-only (MI-19) — no slide or scale on page-level

---

## 6. Framer Motion

**Library:** `framer-motion` (already installed in project)

### 6.1 Usage Rules

- Use Framer Motion for complex animations (dialog, drawer, list stagger)
- Use CSS transitions for simple animations (hover, focus, color change)
- Use `AnimatePresence` for mount/unmount animations (dialog, toast, list items)
- Always pass `prefers-reduced-motion` to Framer Motion config

### 6.2 Standard Variants

| Variant | Initial | Animate | Exit | Duration | Easing |
|---------|---------|---------|------|----------|--------|
| `fadeIn` | `opacity: 0` | `opacity: 1` | `opacity: 0` | 200ms | `--ease-out` |
| `fadeInUp` | `opacity: 0, y: 8` | `opacity: 1, y: 0` | `opacity: 0, y: 8` | 300ms | `--ease-out` |
| `scaleIn` | `opacity: 0, scale: 0.95` | `opacity: 1, scale: 1` | `opacity: 0, scale: 0.95` | 200ms | `--ease-out` |
| `slideInRight` | `opacity: 0, x: 16` | `opacity: 1, x: 0` | `opacity: 0, x: 16` | 200ms | `--ease-out` |
| `slideInLeft` | `opacity: 0, x: -16` | `opacity: 1, x: 0` | `opacity: 0, x: -16` | 200ms | `--ease-out` |
| `slideInBottom` | `opacity: 0, y: 16` | `opacity: 1, y: 0` | `opacity: 0, y: 16` | 200ms | `--ease-out` |
| `stagger` | — | `staggerChildren: 0.05` | — | 300ms | `--ease-out` |

---

## Cross-References

- See `01-foundations.md` for elevation and opacity tokens
- See `08-animation-principles.md` for animation principles and guidelines
- See `09-interaction-states.md` for state-specific animations
- See `10-accessibility-rules.md` for reduced motion accessibility rules
- See `ux-blueprint/03-component-ux-standards.md` §7 for motion standards
- See `user-flow-architecture/01-flow-principles.md` FP-06 for flow motion principles
- See `product-architecture/17-product-rules.md` PR-47 for motion rules
