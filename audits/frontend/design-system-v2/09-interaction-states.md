# 09 — Interaction States

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `08-animation-principles.md`, `ux-blueprint/02-state-guidelines.md`, `ux-blueprint/03-component-ux-standards.md` §5, `product-architecture/17-product-rules.md` PR-48

---

## 1. State Philosophy

Every interactive element in Cloud-Screen must have clearly defined visual states. States communicate to the user what the element is, what it can do, and what is happening. Consistent state treatment across all components is critical for a coherent design system.

---

## 2. Core States

### 2.1 Default (Rest)

The resting state of an element when no interaction has occurred.

| Element | Background | Border | Text | Shadow |
|---------|-----------|--------|------|--------|
| Button (default) | `--primary` | none | `--primary-foreground` | none |
| Button (outline) | `--card` | `--border` | `--foreground` | none |
| Button (ghost) | transparent | none | `--foreground` | none |
| Button (destructive) | `--destructive` | none | `--destructive-foreground` | none |
| Input | `--card` | `--input` | `--foreground` | none |
| Card | `--card` | `--border` | `--card-foreground` | `--shadow-xs` |
| Sidebar item | transparent | none | `--muted-foreground` | none |
| Tab (inactive) | transparent | none | `--muted-foreground` | none |
| Checkbox | `--card` | `--input` | — | none |
| Toggle | `--input` | none | — | none |

### 2.2 Hover

User's pointer is over the element. Provides affordance that the element is interactive.

| Element | Background Change | Border Change | Text Change | Shadow Change | Animation |
|---------|-------------------|---------------|-------------|---------------|-----------|
| Button (default) | `--primary/90` (darken 10%) | — | — | — | MI-01 (150ms) |
| Button (outline) | `--secondary` | — | — | — | MI-01 (150ms) |
| Button (ghost) | `--secondary` | — | — | — | MI-01 (150ms) |
| Button (destructive) | `--destructive/90` | — | — | — | MI-01 (150ms) |
| Input | `--card` | `--border-strong` | — | — | MI-01 (150ms) |
| Card | `--card` | `--border` | — | `--shadow-sm` | MI-01 (150ms) |
| Sidebar item | `--muted` | — | `--foreground` | — | MI-14 (150ms) |
| Tab (inactive) | `--muted/50` | — | `--foreground` | — | MI-01 (150ms) |
| Table row | `--muted/50` | — | — | — | MI-01 (150ms) |
| Link | — | — | `--primary` | — | MI-01 (150ms) |

### 2.3 Focus

Element has keyboard focus. Must be clearly visible for keyboard users.

| Element | Focus Style | Ring Color | Ring Width | Offset |
|---------|------------|------------|------------|--------|
| All interactive | `outline: none` + `ring` | `--ring` | 2px | 2px |
| Button | `ring-2 ring-ring ring-offset-2` | `--ring` | 2px | 2px |
| Input | `border-2 border-ring` (replaces border) | `--ring` | 2px | 0 |
| Card (clickable) | `ring-2 ring-ring ring-offset-2` | `--ring` | 2px | 2px |
| Sidebar item | `ring-2 ring-ring ring-offset-2` | `--ring` | 2px | 2px |
| Tab | `ring-2 ring-ring` | `--ring` | 2px | 0 |
| Checkbox | `ring-2 ring-ring ring-offset-2` | `--ring` | 2px | 2px |

**Rule:** Focus ring uses `focus-visible:` (visible only on keyboard navigation, not mouse click).

### 2.4 Active (Pressed)

User is actively pressing the element (mousedown).

| Element | Background | Scale | Animation |
|---------|-----------|-------|-----------|
| Button | Darken further (hover bg /90%) | 0.97 | MI-02 (100ms) |
| Card | `--muted` | none | — |
| Sidebar item | `--muted` | none | — |
| Tab | `--muted` | none | — |
| Checkbox | `--border-strong` | none | — |

### 2.5 Disabled

Element is not interactive; action is unavailable.

| Element | Opacity | Cursor | Background | Pointer Events |
|---------|---------|--------|-----------|----------------|
| Button | 0.5 | `not-allowed` | Original (faded) | none |
| Input | 0.5 | `not-allowed` | Original (faded) | none |
| Checkbox | 0.5 | `not-allowed` | Original (faded) | none |
| Toggle | 0.5 | `not-allowed` | Original (faded) | none |
| Sidebar item | 0.5 | `not-allowed` | Original (faded) | none |
| Tab | 0.5 | `not-allowed` | Original (faded) | none |
| Link | 0.5 | `not-allowed` | Original (faded) | none |

**Rule:** Disabled elements use `opacity-50 cursor-not-allowed pointer-events-none`. Never change the background or text color for disabled — opacity communicates the state clearly.

### 2.6 Loading

Element is processing an action; user must wait.

| Element | Visual | Animation |
|---------|--------|-----------|
| Button | Text replaced by spinner + "..." or loading text | Spinner (MI-21) |
| Input | Not applicable (inputs don't load) | — |
| Card | Skeleton card (gray, shimmer) | MI-12 (shimmer) |
| Table | Skeleton rows (gray bars, shimmer) | MI-12 (shimmer) |
| Page section | Skeleton block (gray, shimmer) | MI-12 (shimmer) |
| Full page | Centered spinner | MI-21 |

### 2.7 Selected / Active (Persistent)

Element is currently selected or active (not hover — persistent state).

| Element | Background | Text | Border |
|---------|-----------|------|--------|
| Sidebar item (active) | `--primary/10` | `--primary` | 2px left `--primary` |
| Tab (active) | transparent | `--foreground` | 2px bottom `--primary` |
| Table row (selected) | `--primary/5` | `--foreground` | — |
| Card (selected) | `--primary/5` | `--foreground` | 2px `--primary` |
| Checkbox (checked) | `--primary` | `--primary-foreground` | — |
| Toggle (on) | `--primary` | — | — |

### 2.8 Error

Element has a validation error or is in an error state.

| Element | Border | Text | Background | Icon |
|---------|--------|------|-----------|------|
| Input (error) | `--destructive` (2px) | `--destructive` | `--destructive/5` | AlertCircle (16px, `--destructive`) |
| Form (error) | — | `--destructive` | — | AlertCircle inline |
| Card (error) | `--destructive/20` | `--foreground` | `--destructive/5` | — |

### 2.9 Read-Only

Element displays data but cannot be edited.

| Element | Background | Border | Text | Cursor |
|---------|-----------|--------|------|--------|
| Input (read-only) | `--muted` | `--border` | `--muted-foreground` | `default` |

---

## 3. State Transition Rules

- **Default → Hover:** 150ms transition (MI-01)
- **Hover → Active:** 100ms transition (MI-02)
- **Default → Focus:** Instant (no transition — focus ring appears immediately)
- **Focus → Default:** 150ms transition (ring fades out)
- **Default → Loading:** Instant (content replaced by spinner)
- **Loading → Default:** Instant (content restored)
- **Default → Disabled:** Instant (opacity applied)
- **Disabled → Default:** Instant (opacity removed)
- **Default → Error:** 150ms transition (border color change)
- **Error → Default:** 150ms transition (border color change)

---

## 4. State Combinations

Some states can coexist. The following combinations are valid:

| Combination | Behavior |
|-------------|----------|
| Hover + Focus | Hover background + focus ring |
| Loading + Disabled | Not possible (loading implies action, disabled prevents action) |
| Error + Focus | Error border + focus ring (focus ring color overrides) |
| Selected + Hover | Selected background + hover background (hover takes precedence) |
| Disabled + Error | Not possible (disabled prevents interaction, no error) |

---

## 5. State Communication Rules

- **Never** rely on color alone to communicate state — always use additional cues (icon, text, border, opacity)
- **Error state:** Red border + error icon + error text message (3 cues)
- **Disabled state:** Opacity + cursor change (2 cues)
- **Selected state:** Background + border + text color (3 cues)
- **Loading state:** Spinner + text change + disabled interaction (3 cues)
- **Focus state:** Ring + offset (2 cues) — ring is always visible

---

## Cross-References

- See `01-foundations.md` for color tokens used in states
- See `07-motion-system.md` for animation tokens used in state transitions
- See `08-animation-principles.md` for animation guidelines
- See `10-accessibility-rules.md` for accessibility requirements per state
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
- See `ux-blueprint/03-component-ux-standards.md` §5 for state standards
- See `product-architecture/17-product-rules.md` PR-48 for state rules
