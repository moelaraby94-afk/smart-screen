# 06 — Illustration Rules

> **Evidence basis:** `01-foundations.md`, `05-iconography.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/03-overview-spec.md` (onboarding), `screen-specifications/02-auth-error-specs.md` (error pages)

---

## 1. Illustration Philosophy

Cloud-Screen uses **minimal, functional illustrations** — not decorative artwork. Illustrations appear only in empty states, error states, onboarding, and auth pages. The illustration style is **line-based, monochrome, and subtle** to match the Lucide icon language.

---

## 2. Illustration Types

### 2.1 Empty State Illustrations

| Context | Illustration | Style |
|---------|-------------|-------|
| No screens | Monitor icon (48px, `--muted-foreground`) | Icon-based, centered |
| No playlists | Image icon (48px, `--muted-foreground`) | Icon-based, centered |
| No media | Upload icon (48px, `--muted-foreground`) | Icon-based, centered |
| No notifications | Bell icon (48px, `--muted-foreground`) | Icon-based, centered |
| No schedules | Calendar icon (48px, `--muted-foreground`) | Icon-based, centered |
| No results (filtered) | Search icon (48px, `--muted-foreground`) | Icon-based, centered |
| No analytics data | Bar chart icon (48px, `--muted-foreground`) | Icon-based, centered |

### 2.2 Error State Illustrations

| Context | Illustration | Style |
|---------|-------------|-------|
| 404 page | Large "404" text (`--text-4xl`, `--muted-foreground`) | Typography-based |
| Permission denied | Lock icon (48px, `--muted-foreground`) | Icon-based, centered |
| Error boundary | Alert triangle icon (48px, `--warning`) | Icon-based, centered |
| Offline | Cloud-off icon (48px, `--muted-foreground`) | Icon-based, centered |

### 2.3 Onboarding Illustrations

| Context | Illustration | Style |
|---------|-------------|-------|
| Empty workspace | 3-step guide with icons (Monitor → Image → Send) | Icon-based, horizontal |
| Welcome card | Cloud-Screen logo + welcome text | Brand-based |

### 2.4 Auth Page Illustrations

| Context | Illustration | Style |
|---------|-------------|-------|
| Login | Cloud-Screen logo (32px) + "Cloud-Screen" text | Brand-based, centered |
| Register | Cloud-Screen logo (32px) + "Cloud-Screen" text | Brand-based, centered |
| Forgot Password | Cloud-Screen logo (32px) + "Cloud-Screen" text | Brand-based, centered |

---

## 3. Illustration Style Rules

### 3.1 Color

- **Empty states:** `--muted-foreground` (subtle, not distracting)
- **Error states:** `--warning` or `--destructive` (amber or red, context-dependent)
- **Onboarding:** `--primary` for step icons (blue, encouraging)
- **Brand:** Cloud-Screen logo in default brand colors
- **Never** use multi-color illustrations — monochrome only

### 3.2 Size

| Context | Size |
|---------|------|
| Empty state icon | 48px (`--icon-3xl`) |
| Error page icon | 48px (`--icon-3xl`) |
| Onboarding step icon | 32px (`--icon-2xl`) |
| Auth brand logo | 32px height |
| Error code text | `--text-4xl` (36px) |

### 3.3 Position

- **Always centered** horizontally
- **Empty states:** Centered in content area, with text below
- **Error pages:** Centered in viewport, with text and CTA below
- **Onboarding:** Centered in card, with steps and CTA below

### 3.4 Animation

- **Empty states:** No animation (static)
- **Error pages:** No animation (static)
- **Onboarding:** Step icons may have subtle fade-in on load (MI-08, 300ms)
- **Success states:** Checkmark animation (MI-11, 600ms) — see `07-motion-system.md`

---

## 4. What NOT to Do

- **No decorative illustrations** — every illustration must serve a functional purpose
- **No multi-color illustrations** — monochrome only, matching icon language
- **No custom artwork** — use Lucide icons at large sizes for empty/error states
- **No illustrations in content areas** — only in empty/error/onboarding states
- **No animated illustrations** — except success checkmark (MI-11)
- **No illustrations in sidebars, headers, or toolbars** — use icons at normal sizes
- **No stock photos or stock illustrations** — maintain brand consistency

---

## 5. Brand Logo

### 5.1 Logo Usage

| Context | Size | Variant |
|---------|------|---------|
| Auth pages | 32px height | Full color (default) |
| Sidebar | 24px height | Full color (default) |
| Splash screen (Studio) | 48px height | Full color (default) |
| Error pages | 32px height | Full color (default) |

### 5.2 Logo Rules

- **Never** stretch or distort the logo
- **Never** change logo colors — use official brand colors
- **Never** add effects (shadow, glow) to the logo
- **Always** maintain clear space around the logo (minimum 8px)
- **Dark mode:** Logo may use inverted variant if needed (future)

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `05-iconography.md` for icon library (used for empty/error states)
- See `07-motion-system.md` for animation tokens (success checkmark)
- See `18-empty-states.md` for empty state component specifications
- See `20-error-states.md` for error state component specifications
- See `ux-blueprint/03-component-ux-standards.md` for component standards
