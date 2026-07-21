# 19 — Loading States

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md` (MI-12, MI-21, MI-22), `ux-blueprint/02-state-guidelines.md`, `screen-specifications/` (all files have loading states)

---

## 1. Loading Philosophy

Loading states manage user expectations during data fetching and processing. Smart Screen uses **skeletons** for initial loads and **spinners** for inline actions. The goal is to reduce perceived latency and prevent layout shift.

---

## 2. Loading Components

### Component: Skeleton

#### Purpose
Placeholder that mimics the shape of content during loading.

#### Usage
- Initial page load (before data arrives)
- Tab switch (loading new tab content)
- Filter/search (loading filtered results)

#### When to Use
- Page or section initial load
- Content that will fill a known layout
- Reducing perceived wait time

#### When NOT to Use
- Inline button actions (use Spinner)
- Full-page blocking (use Splash or centered Spinner)
- Quick operations (< 200ms — don't show loading)

#### Visual
- Background: `--muted`
- Animation: MI-12 (shimmer sweep, 1500ms loop)
- Shape: Matches content shape (rectangles for text, circles for avatars, squares for cards)
- Radius: Matches content radius

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Custom dimensions |
| `rounded` | `boolean` | `false` | Use `--radius-full` (for avatar) |

#### Variants

| Variant | Shape | Size | Usage |
|---------|-------|------|-------|
| `text` | Rectangle | `h-4 w-full` | Text line placeholder |
| `text-sm` | Rectangle | `h-3 w-full` | Small text placeholder |
| `title` | Rectangle | `h-6 w-48` | Heading placeholder |
| `circle` | Circle | `h-10 w-10` | Avatar placeholder |
| `rect` | Rectangle | `h-24 w-full` | Card/image placeholder |
| `card` | Composite | Full card | Card placeholder (title + lines) |

#### Skeleton Patterns per Screen

| Screen | Skeleton Pattern | Evidence |
|--------|-----------------|----------|
| Screens List | 8-12 skeleton cards (rect + title line) | `04-screens-specs.md` |
| Playlists tab | 8-12 skeleton cards | `05-content-specs.md` |
| Media tab | 12-18 skeleton media cards (square) | `05-content-specs.md` |
| Screen Detail | Skeleton preview + skeleton sections | `04-screens-specs.md` |
| Team | Skeleton member rows (circle + text bars) | `08-team-spec.md` |
| Admin tables | 5-10 skeleton rows (text bars per column) | `11/12-admin-specs.md` |
| Analytics | Skeleton metric cards + skeleton chart | `07-scheduling-analytics-specs.md` |
| Scheduling | Skeleton calendar cells | `07-scheduling-analytics-specs.md` |
| Settings | Skeleton form fields | `09/10-settings-specs.md` |
| Notifications | 5-10 skeleton rows | `11-notifications-admin-specs.md` |

#### Accessibility
- `aria-hidden="true"` (skeleton is decorative)
- `role="status"` on container with `aria-label="Loading"`
- Screen reader announces "Loading" via container

#### Anti-Patterns
- **Skeleton with wrong shape** — must match content shape
- **Skeleton without shimmer** — static gray looks broken
- **Skeleton for < 200ms** — don't flash loading state
- **No `aria-hidden`** — skeleton should not be read by screen readers

#### Acceptance Criteria
- [ ] Skeleton matches content shape (rect for text, circle for avatar)
- [ ] Shimmer animation: MI-12 (1500ms loop, left-to-right sweep)
- [ ] `aria-hidden="true"` on skeleton elements
- [ ] `role="status"` with `aria-label="Loading"` on container
- [ ] No layout shift when content replaces skeleton
- [ ] Respects `prefers-reduced-motion` (static gray, no shimmer)

---

### Component: Spinner

#### Purpose
Inline loading indicator for actions and small areas.

#### Usage
- Button loading state
- Inline section loading
- Small area refresh

#### Visual
- Icon: `Loader2` from Lucide
- Animation: Rotate 360° (MI-21, 800ms loop, linear)
- Size: 16px (button), 20px (inline), 24px (centered)
- Color: `currentColor` (inherits from parent)

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number` | 16 | Icon size in px |
| `className` | `string` | — | Custom styling |

#### Accessibility
- `aria-hidden="true"` (decorative)
- Parent should have `aria-busy="true"` or `role="status"`

#### Acceptance Criteria
- [ ] Spinner rotates 360° (800ms loop, linear)
- [ ] Size configurable (16px default)
- [ ] Color inherits from parent (`currentColor`)
- [ ] `aria-hidden="true"`
- [ ] Respects `prefers-reduced-motion` (slow rotation, 2s)

---

### Component: ProgressBar

#### Purpose
Show progress of a determinate operation (file upload, batch processing).

#### Usage
- File upload progress (per file)
- Batch operations (bulk delete, bulk assign)
- (Future) OTA update progress

#### Visual
- Track: `--muted` bg, `--radius-full`, `h-2`
- Fill: `--primary` bg, animated width
- Animation: MI-22 (width increase, `--ease-default`)

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` (0-100) | 0 | Progress percentage |
| `max` | `number` | 100 | Maximum value |
| `label` | `string` | — | Accessible label |
| `showValue` | `boolean` | `false` | Show percentage text |

#### Accessibility
- `role="progressbar"`
- `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`
- `aria-label` with description

#### Acceptance Criteria
- [ ] Track renders as `h-2 --muted --radius-full`
- [ ] Fill renders as `--primary` with width = `value%`
- [ ] `role="progressbar"` with aria attributes
- [ ] Smooth width animation (MI-22)
- [ ] `showValue` displays percentage text

---

### Component: Splash

#### Purpose
Full-page loading screen for heavy initial loads.

#### Usage
- Studio initial load (Konva.js loading, 1-3s)

#### Visual
- Background: `--neutral-900` (dark)
- Content: Smart Screen logo (48px) + "Loading Studio..." text
- Animation: Logo fade in (MI-08, 300ms), spinner below text

#### Evidence
`screen-specifications/06-studio-spec.md` — Loading state

#### Acceptance Criteria
- [ ] Full viewport (`h-screen w-screen`)
- [ ] Centered logo + text + spinner
- [ ] Fades to Studio when loaded (MI-08, 300ms)
- [ ] Spinner visible during load

---

## 3. Loading Patterns by Context

| Context | Pattern | Duration | Evidence |
|---------|---------|----------|----------|
| Page initial load | Skeleton | Until data arrives | All page specs |
| Tab switch | Skeleton (cached: instant) | < 200ms if cached | `05-content-specs.md` |
| Search/filter | Skeleton or keep old data | Until results arrive | All list specs |
| Button action | Spinner in button | Until action completes | All form specs |
| File upload | ProgressBar per file | Until upload completes | `05-content-specs.md` |
| Full-page heavy load | Splash | 1-3s | `06-studio-spec.md` |
| Inline refresh | Spinner (small) | Until refresh completes | — |
| Route transition | Content fade (MI-19) | 200ms | `07-motion-system.md` |

---

## 4. Loading Rules

- **Skeleton for initial load** — not spinner (skeleton reduces perceived wait)
- **Spinner for actions** — not skeleton (actions are short, inline)
- **ProgressBar for determinate operations** — not spinner (show progress)
- **Splash for heavy loads** — only Studio (Konva load)
- **No loading flash** — if data arrives < 200ms, don't show loading state
- **Keep old data during refetch** — don't show skeleton on revalidation (SWR `keepPreviousData`)
- **No full-page spinner** — except Splash for Studio
- **Always prevent layout shift** — skeleton must match content dimensions

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `07-motion-system.md` for MI-12, MI-21, MI-22
- See `08-animation-principles.md` for animation guidelines
- See `10-accessibility-rules.md` for loading accessibility
- See `18-empty-states.md` for empty (not loading) states
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
