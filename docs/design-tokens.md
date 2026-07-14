# ORCA Design Tokens

## Color Tokens

All colors are defined as HSL channel values in `globals.css` and consumed via `hsl(var(--token))`.

### Brand

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--primary` | `221 83% 53%` (Blue-600) | `221 83% 60%` (Blue-500) | Primary actions, links, focus rings |
| `--primary-foreground` | `0 0% 100%` | `220 26% 7%` | Text on primary surfaces |
| `--accent` | Same as primary | Same as primary | Accent elements |
| `--ring` | `221 83% 53%` | `221 83% 60%` | Focus ring outline |

### Surfaces

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `220 14% 96%` (Gray-50) | `220 26% 7%` (Gray-950) | Page background |
| `--foreground` | `220 26% 14%` (Gray-900) | `220 14% 96%` (Gray-100) | Primary text |
| `--card` | `0 0% 100%` (White) | `220 26% 10%` (Gray-900) | Card surfaces |
| `--card-foreground` | Same as foreground | Same as foreground | Text on cards |
| `--muted` | `220 14% 96%` (Gray-100) | `220 14% 15%` (Gray-800) | Muted backgrounds |
| `--muted-foreground` | `220 9% 46%` (Gray-500) | `220 9% 65%` (Gray-400) | Secondary text |
| `--border` | `220 13% 91%` (Gray-200) | `220 14% 18%` (Gray-700) | Borders, dividers |
| `--destructive` | `0 84% 60%` (Red-500) | `0 84% 60%` | Destructive actions |

## Spacing Scale

Single 4px-based spacing scale. Always use these tokens or Tailwind utilities that map to them.

| Token | Value | Tailwind |
|---|---|---|
| `--space-1` | `0.25rem` (4px) | `p-1`, `gap-1` |
| `--space-2` | `0.5rem` (8px) | `p-2`, `gap-2` |
| `--space-3` | `0.75rem` (12px) | `p-3`, `gap-3` |
| `--space-4` | `1rem` (16px) | `p-4`, `gap-4` |
| `--space-6` | `1.5rem` (24px) | `p-6`, `gap-6` |
| `--space-8` | `2rem` (32px) | `p-8`, `gap-8` |
| `--space-12` | `3rem` (48px) | `p-12`, `gap-12` |
| `--space-16` | `4rem` (64px) | `p-16`, `gap-16` |

## Density System

Two density modes controlled via `data-density` attribute on `<html>`:

| Mode | `data-density` | Card padding | Row padding | Gap | Font size | Use case |
|---|---|---|---|---|---|---|
| Comfortable (default) | `comfortable` | 24px | 12px | 24px | 1rem | General use |
| Compact | `compact` | 16px | 8px | 16px | 0.875rem | Enterprise fleet operators |

### Density CSS Variables

| Token | Comfortable | Compact |
|---|---|---|
| `--density-card-px` | `1.5rem` | `1rem` |
| `--density-card-py` | `1.5rem` | `1rem` |
| `--density-row-py` | `0.75rem` | `0.5rem` |
| `--density-gap` | `1.5rem` | `1rem` |
| `--density-label-mb` | `0.5rem` | `0.375rem` |

### Usage

The density toggle is in the shell header (`DensityToggle` component). It persists to `localStorage` under key `cs-density` and sets `data-density` on `<html>`.

## Typography

| Class | Size | Weight | Usage |
|---|---|---|---|
| `.vc-page-title` | `clamp(1.5rem, 2.5vw, 2rem)` | 700 | Page titles |
| `.vc-page-kicker` | `0.6875rem` | 600 | Section kickers |
| `.vc-page-desc` | `0.9375rem` | 400 | Page descriptions |
| `.font-mono-nums` | — | — | Tabular numbers |

## Icon System

- Library: `lucide-react`
- Stroke width: `ICON_STROKE` constant from `@/lib/icon-stroke`
- All icons use `strokeWidth={ICON_STROKE}` for consistency

## Motion

- Transitions: ≤200ms
- Respects `prefers-reduced-motion`
- RTL-aware transforms (use `inset-inline-*` not `left`/`right`)

## Status System

Status is always conveyed with **color + icon + text** (never color alone):

| Status | Color | Icon | Text |
|---|---|---|---|
| Online | Emerald | Dot | "Online" |
| Offline | Red | Dot | "Offline" |
| Stale | Amber | Dot | "Stale" |
| Maintenance | Blue | Dot | "Maintenance" |

Implemented via `ScreenFleetStatusBadge` component.
