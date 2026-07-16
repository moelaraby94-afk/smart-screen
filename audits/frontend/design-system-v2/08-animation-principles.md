# 08 — Animation Principles

> **Evidence basis:** `07-motion-system.md`, `ux-blueprint/03-component-ux-standards.md` §7, `user-flow-architecture/01-flow-principles.md` FP-06, `product-architecture/17-product-rules.md` PR-47

---

## 1. Animation Principles

### 1.1 Purposeful

Every animation must serve one of these purposes:
- **Feedback:** Confirm a user action (button press, toggle, checkmark)
- **Guidance:** Direct user attention (toast slide-in, highlight new item)
- **State transition:** Show change (dialog open, dropdown expand, tab switch)
- **Perceived performance:** Mask loading (skeleton shimmer, spinner, progress bar)

**Never** animate for decoration. If an animation doesn't serve one of these purposes, remove it.

### 1.2 Subtle

- Animations should be **felt, not noticed**
- Duration: 150–300ms for most interactions
- Movement: Small distances (8–16px max for slide)
- Scale: Subtle (0.95–1.0 for dialog, 0.97 for button press)
- Opacity: Full range (0–1) is acceptable for fade

### 1.3 Fast

- **Never** make the user wait for an animation to complete before they can interact
- Dialog content is interactive immediately, even if animation is still playing
- Toast auto-dismiss timer starts after animation completes
- Maximum animation duration: 600ms (success checkmark only)

### 1.4 Consistent

- Same interaction = same animation everywhere
- Dialog open: MI-06 (scale + fade) on every dialog
- Toast enter: MI-10 (slide up + fade) on every toast
- Card hover: MI-01 (background change) on every card
- No page-specific custom animations (except Studio splash)

### 1.5 Performant

- Animate only `transform` and `opacity` — these are GPU-accelerated
- **Never** animate `width`, `height`, `margin`, `padding`, `top`, `left` — these cause reflow
- Use `will-change: transform` sparingly (only on elements actively animating)
- Remove `will-change` after animation completes
- Limit concurrent animations to < 10 (performance budget)

### 1.6 Respectful

- Always respect `prefers-reduced-motion: reduce`
- Provide instant fallback for all animations
- Never use animation as the only way to convey information
- Auto-playing animations (skeleton, spinner) should be subtle and not distracting

---

## 2. Animation Patterns by Context

### 2.1 Hover Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button | Background color change | 150ms | `--ease-default` |
| Card | Shadow elevation (xs → sm) | 150ms | `--ease-default` |
| Sidebar item | Background fade in | 150ms | `--ease-default` |
| Table row | Background highlight | 150ms | `--ease-default` |
| Link | Color change | 150ms | `--ease-default` |

**Rule:** Hover animations are color/shadow only — no transform (no scale, no translate on hover).

### 2.2 Click/Press Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Button | Scale 0.97 | 100ms | `--ease-default` |
| Checkbox | Checkmark draw | 150ms | `--ease-out` |
| Toggle | Thumb slide + color | 150ms | `--ease-bounce` |
| Tab | Underline slide | 200ms | `--ease-in-out` |

### 2.3 Mount/Unmount Animations

| Element | Enter | Exit | Evidence |
|---------|-------|------|----------|
| Dialog | Scale 0.95→1 + fade (MI-06) | Scale 1→0.95 + fade (MI-07) | `13-shared-dialogs-specs.md` |
| Drawer | Slide in + overlay fade (MI-15) | Slide out + overlay fade (MI-16) | `01-global-layout-spec.md` |
| Toast | Slide up + fade (MI-10) | Fade out (MI-23) | `24-toast-standards.md` |
| Dropdown | Fade + slide down 8px (MI-05) | Fade out | — |
| Tooltip | Fade in (MI-17) | Fade out (MI-18) | — |
| List item | Fade in up (MI-08) | Fade out + scale (MI-09) | — |
| Card (grid) | Fade in up (MI-08) | — | — |

### 2.4 Loading Animations

| Element | Animation | Duration | Loop |
|---------|-----------|----------|------|
| Skeleton | Shimmer sweep (MI-12) | 1500ms | Yes |
| Spinner | Rotate 360° (MI-21) | 800ms | Yes |
| Progress bar | Width increase (MI-22) | Variable | No |
| Button loading | Spinner replaces text | — | Yes (spinner) |

### 2.5 Success Animations

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Checkmark | SVG path draw + bounce (MI-11) | 600ms | `--ease-bounce` |
| Toast success | Slide up + fade in (MI-10) | 200ms | `--ease-out` |

### 2.6 Page Transitions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Route change | Content fade (MI-19) | 200ms | `--ease-default` |
| Studio splash | Logo + spinner → fade to Studio | 400ms | `--ease-out` |

---

## 3. Animation Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|-------------|-----------------|
| Bounce on every interaction | Too playful for enterprise; annoying | Use bounce only for toggle (MI-03) and checkmark (MI-11) |
| Animation > 600ms | Feels slow; user waits | Keep under 300ms for most; 600ms max |
| Animating width/height | Causes reflow; janky | Use transform (scale) instead |
| No reduced-motion fallback | Accessibility violation | Always provide instant fallback |
| Multiple animations on one element | Confusing; chaotic | One animation per state change |
| Decorative animations | Distracting; no purpose | Remove; every animation must be functional |
| Looping non-loading animations | Distracting; wastes CPU | Only skeleton and spinner may loop |
| Stagger > 5 items | Takes too long; user waits | Cap stagger at 5 items |
| Slide animation > 16px | Feels excessive; disorienting | Keep slide distance 8–16px |
| Custom easing per component | Inconsistent | Use defined easing tokens only |

---

## 4. Animation Testing Checklist

- [ ] Animation serves a functional purpose (feedback, guidance, state, performance)
- [ ] Duration is within 150–600ms range
- [ ] Uses defined easing token (not custom cubic-bezier)
- [ ] Animates only transform and opacity (no reflow properties)
- [ ] Respects `prefers-reduced-motion: reduce` (instant fallback)
- [ ] Element is interactive immediately (no waiting for animation)
- [ ] Consistent with same interaction elsewhere in the product
- [ ] No more than 10 concurrent animations
- [ ] No looping (except skeleton and spinner)
- [ ] No bounce (except toggle and checkmark)

---

## Cross-References

- See `07-motion-system.md` for motion tokens and MI inventory
- See `09-interaction-states.md` for state-specific animation behavior
- See `10-accessibility-rules.md` for reduced motion accessibility rules
- See `ux-blueprint/03-component-ux-standards.md` §7 for motion standards
- See `user-flow-architecture/01-flow-principles.md` FP-06 for flow motion principles
- See `product-architecture/17-product-rules.md` PR-47 for motion rules
