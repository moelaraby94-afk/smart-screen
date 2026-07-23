# Phase 4 — Visual Consistency Audit Report

> **Scope:** All customer-facing dashboard pages (excluding Studio canvas editor, which has its own design language for dark canvas overlays).
>
> **Method:** Side-by-side comparison of every page's client component, focusing on visual appearance: spacing, alignment, card padding, typography hierarchy, icon sizes, hover/focus states, transitions, empty/error/loading states, toolbar patterns, and responsive behavior.
>
> **Rule:** No code modifications. This report serves as the blueprint for Phase 4 implementation.

---

## Table of Contents

1. [Pages Audited](#pages-audited)
2. [Findings by Severity](#findings-by-severity)
3. [Summary Matrix](#summary-matrix)

---

## Pages Audited

| Page | Route | Client Component |
|------|-------|-----------------|
| Overview / Home | `/` | `overview-page-client.tsx` → `home-overview.tsx` → `client-home-dashboard.tsx` |
| Analytics | `/analytics` | `analytics-page-client.tsx` |
| Screens | `/screens` | `screens-client.tsx` → `screen-visual-card.tsx` |
| Media Library | `/media` | `media-library-client.tsx` → `media-grid-sections.tsx` |
| Playlists | `/playlists` | `playlist-list-client.tsx` |
| Campaigns | `/campaigns` | `campaigns-client.tsx` |
| Schedules | `/schedules` | `schedules-client.tsx` → `schedule-calendar.tsx` |
| Team | `/team` | `team-client.tsx` |
| Templates | `/templates` | `templates-client.tsx` |
| Emergency | `/emergency` | `emergency-client.tsx` |
| AI Tools | `/ai` | `ai-tools-client.tsx` |
| Help & Support | `/help` | `help-support-client.tsx` |
| Audit Log | `/audit-log` | `audit-log-page-client.tsx` |
| Notifications | `/notifications` | `notifications-page-client.tsx` |
| Settings — Profile | `/settings/profile` | `settings-profile-client.tsx` |
| Settings — Workspace | `/settings/workspace` | `workspace-settings-client.tsx` |
| Settings — Billing | `/billing` | `settings-billing-client.tsx` |
| Settings — Notifications | `/settings/notifications` | `notification-preferences.tsx` |
| Settings — Security | `/settings/security` | `settings-security-client.tsx` |
| Settings — API | `/settings/api` | `settings-api-client.tsx` |
| Branches | `/branches` | `branches-page-client.tsx` |

---

## Findings by Severity

### CRITICAL — None

No critical visual breakage found. All pages are functional and render without visual distortion.

---

### HIGH

---

#### H-01: `rounded-xl` on interactive elements in multiple pages

**Severity:** High

**Screenshot-equivalent description:**
Buttons, dropdown triggers, and form inputs on Audit Log, Notifications, Help, Screen Visual Card, and Schedule Create Dialog have a visibly larger border radius (`rounded-xl` ≈ 12px) compared to the canonical `rounded-lg` (≈ 8px) used everywhere else. When viewed side-by-side, the buttons on these pages look "softer" and inconsistent with the rest of the dashboard.

**Root cause:** These pages were built or refactored before the `rounded-lg` standard was established, or were copied from Studio patterns (which use `rounded-xl` intentionally for dark canvas overlays).

**Canonical pattern:** `rounded-lg` on all buttons, inputs, selects, dropdowns, cards, and interactive elements outside Studio.

**Exact files and lines:**

| File | Lines | Element |
|------|-------|---------|
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 171, 199, 203, 239 | Export button, list items, icon containers, load-more button |
| `apps/dashboard/src/features/notifications/notifications-page-client.tsx` | 180, 198, 208 | Clear filter button, notification list items, icon containers |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 101, 103, 125, 156, 158, 169 | Guide cards, guide icon containers, FAQ items, contact section, contact icon, email link |
| `apps/dashboard/src/features/screens/screen-visual-card.tsx` | 259, 269, 277, 281 | Action buttons, dropdown trigger, dropdown content |
| `apps/dashboard/src/features/schedules/schedule-create-dialog.tsx` | 372, 383, 399, 410, 420, 435 | Time inputs, priority input, delete/deactivate buttons, save button |
| `apps/dashboard/src/features/media/media-grid-sections.tsx` | 362, 373, 384, 395 | Quick action buttons on media card overlay |
| `apps/dashboard/src/features/playlists/studio/components/workspace-tabs.tsx` | 22, 35 | Workspace filter tab buttons |
| `apps/dashboard/src/features/auth/impersonation-return-button.tsx` | 45 | Return to admin button |

**Risk:** Low — visual only, no functional impact. Users may perceive these pages as "different" or "less polished."

---

#### H-02: `vc-card-surface` and `vc-glass` CSS utility classes still applied in non-Studio pages

**Severity:** High

**Screenshot-equivalent description:**
Several pages use `vc-card-surface` (a custom CSS class that applies `bg-card` + subtle surface gradient) and `vc-glass` (a glassmorphism effect with `backdrop-blur` + semi-transparent background). These create a slightly different card appearance compared to the standard `rounded-lg border border-border bg-card shadow-sm` pattern. The `vc-glass` cards have a translucent, blurred background that looks different from the solid `bg-card` cards used on most pages.

**Root cause:** These classes were introduced as part of the design system migration but were not fully replaced when the standard card pattern was established. Some pages adopted them, others didn't.

**Canonical pattern:** `rounded-lg border border-border bg-card shadow-sm` (or `shadow-xs` for flatter cards). Remove `vc-card-surface` and `vc-glass` from all non-Studio pages.

**Exact files and lines:**

| File | Lines | Context |
|------|-------|---------|
| `apps/dashboard/src/features/workspace/workspace-welcome.tsx` | 62 | Welcome hero card |
| `apps/dashboard/src/features/schedules/schedules-client.tsx` | 302, 396, 429 | Three main sections (engine, filters, override) |
| `apps/dashboard/src/features/schedules/schedule-calendar.tsx` | 706 | Schedule list section (also has `vc-glass`) |
| `apps/dashboard/src/features/screens/screen-analytics-panel.tsx` | 65 | Analytics panel (also has `vc-glass`) |
| `apps/dashboard/src/features/onboarding/onboarding-progress-widget.tsx` | 131 | Onboarding widget |
| `apps/dashboard/src/features/islamic/ramadan-settings-panel.tsx` | 115 | Ramadan settings |
| `apps/dashboard/src/features/islamic/prayer-times-widget.tsx` | 98 | Prayer times widget |
| `apps/dashboard/src/features/islamic/prayer-config-panel.tsx` | 137 | Prayer config panel |
| `apps/dashboard/src/features/islamic/hijri-date-widget.tsx` | 69, 77, 92 | Hijri date widget (error, not-configured, loaded states) |
| `apps/dashboard/src/features/media/media-grid-sections.tsx` | 49 | Folder section card |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 101, 125, 156 | Guide cards, FAQ items, contact section |

**Risk:** Medium — `vc-card-surface` and `vc-glass` are defined in `globals.css`. Removing the class from elements without replacing with equivalent standard classes could change the visual appearance. Must verify the replacement classes produce the same or better result.

---

#### H-03: Empty states — two visually different patterns

**Severity:** High

**Screenshot-equivalent description:**
- **Pattern A (shared `EmptyState` component):** Used by Screens, Campaigns, Playlists, Analytics, Team, Templates. Shows a solid bordered card (`border border-border bg-card shadow-xs`) with a large icon inside a rounded `bg-primary/10` box (`h-16 w-16`), title in `text-lg font-semibold`, description in `text-sm`, and a primary action button.
- **Pattern B (hand-rolled dashed border):** Used by Notifications, Audit Log. Shows a dashed border card (`border border-dashed border-border`) with a small bare icon (`h-8 w-8 text-muted-foreground/50`), text-only message in `text-sm text-muted-foreground`, and optionally a `rounded-xl` button.

Visually, Pattern A looks like a polished enterprise empty state with a prominent icon and clear call-to-action. Pattern B looks like a minimal placeholder with a muted icon and no visual hierarchy.

**Root cause:** Notifications and Audit Log were built with inline empty states instead of using the shared `EmptyState` component.

**Canonical component:** `EmptyState` from `@/components/ui/empty-state`

**Exact files and lines:**

| File | Lines | Current Pattern |
|------|-------|----------------|
| `apps/dashboard/src/features/notifications/notifications-page-client.tsx` | 171–185 | Hand-rolled dashed border, `text-sm`, `rounded-xl` button |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 126–129, 182–185 | Hand-rolled dashed border, `text-sm`, no action |

**Risk:** Low — replacing with `EmptyState` component is straightforward. May need to adjust icon choices and ensure translation keys match.

---

#### H-04: Error states — inconsistent shadow, icon opacity, and structure

**Severity:** High

**Screenshot-equivalent description:**
- **Screens, Analytics, Home Dashboard:** Error card uses `shadow-xs`, icon is `h-12 w-12 text-destructive` (full opacity), has `role="alert"`, includes title + optional description + retry button.
- **Playlists, Team, Media:** Error card uses `shadow-sm` (slightly stronger shadow), icon is `h-12 w-12 text-destructive/50` (50% opacity), no `role="alert"`, has title + retry button but no description.
- **Campaigns:** Uses `EmptyState` component for errors — completely different visual (icon in `bg-primary/10` box, not a destructive-colored icon).

Visually, the icon opacity difference (`text-destructive` vs `text-destructive/50`) is noticeable — some error states look more urgent than others. The shadow difference (`shadow-xs` vs `shadow-sm`) is subtle but present.

**Root cause:** Error states were implemented independently per page without a shared error state component.

**Canonical pattern:** The Screens/Analytics pattern (inline error with `shadow-xs`, `text-destructive` full opacity, `role="alert"`, title + description + retry button) is the most complete and accessible.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | 686–698 | `shadow-xs`, `text-destructive`, `role="alert"` |
| `apps/dashboard/src/features/analytics/analytics-page-client.tsx` | 200–216 | `shadow-xs`, `text-destructive`, `role="alert"` |
| `apps/dashboard/src/features/dashboard/client-home-dashboard.tsx` | — | `shadow-xs`, `text-destructive` |
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 320–327 | `shadow-sm`, `text-destructive/50` |
| `apps/dashboard/src/features/team/team-client.tsx` | 485–491 | `shadow-sm`, `text-destructive/50` |
| `apps/dashboard/src/features/media/media-library-client.tsx` | 754–761 | `shadow-sm`, `text-destructive/50` |
| `apps/dashboard/src/features/campaigns/campaigns-client.tsx` | 225–234 | Uses `EmptyState` (completely different visual) |

**Risk:** Low — visual alignment only. Campaigns error state change requires swapping `EmptyState` for inline error.

---

#### H-05: Loading states — five different patterns

**Severity:** High

**Screenshot-equivalent description:**
1. **`CardGridSkeleton` (shared):** Screens, Overview, Templates — grid of skeleton cards with `h-32` image placeholder + title + subtitle lines.
2. **`ListSkeleton` (shared):** Team, Audit Log, Emergency — vertical list of skeleton rows with `h-9 w-9` avatar + title + subtitle lines.
3. **Raw `Skeleton` components:** Campaigns — custom layout with `h-8 w-48` header skeleton + `h-64 w-full` block skeleton. Looks different from both CardGrid and List patterns.
4. **Custom inline skeletons:** Playlists — grid of skeleton cards with `aspect-video` image placeholder + `p-3.5` content with multiple skeleton lines + badge placeholders. More detailed than `CardGridSkeleton`.
5. **Text-only loading:** Media Library — `py-24 text-muted-foreground` with just the word "Loading…". No skeleton at all.

Visually, the Media Library loading state is dramatically different — it shows plain text while every other page shows animated skeleton placeholders. The Playlists skeleton is more detailed than the shared `CardGridSkeleton`. Campaigns skeleton doesn't match either shared pattern.

**Root cause:** No shared loading state convention was enforced. Each page implemented its own.

**Canonical components:** `CardGridSkeleton` for grid layouts, `ListSkeleton` for list layouts, `TableSkeleton` for table layouts — all from `@/components/ui/skeleton-patterns`.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | 681–684 | `CardGridSkeleton` ✅ |
| `apps/dashboard/src/features/dashboard/overview-page-client.tsx` | — | `CardGridSkeleton` ✅ |
| `apps/dashboard/src/features/dashboard/templates-client.tsx` | — | `CardGridSkeleton` ✅ |
| `apps/dashboard/src/features/team/team-client.tsx` | 483 | `ListSkeleton` ✅ |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 121 | `ListSkeleton` ✅ |
| `apps/dashboard/src/features/dashboard/emergency-client.tsx` | 210 | `ListSkeleton` ✅ |
| `apps/dashboard/src/features/campaigns/campaigns-client.tsx` | 213–222 | Raw `Skeleton` — custom layout ❌ |
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 329–342 | Custom inline skeletons ❌ |
| `apps/dashboard/src/features/media/media-library-client.tsx` | 749–752 | Text-only "Loading…" ❌ |
| `apps/dashboard/src/features/analytics/analytics-page-client.tsx` | 170–197 | Custom MetricCard loading + chart skeletons (justified — unique layout) |

**Risk:** Medium — Media Library needs a proper grid skeleton. Campaigns needs `TableSkeleton` or `ListSkeleton`. Playlists skeleton is actually better than `CardGridSkeleton` but should be standardized.

---

### MEDIUM

---

#### M-01: `text-white` used instead of `text-primary-foreground` on `bg-primary` elements

**Severity:** Medium

**Screenshot-equivalent description:**
Language toggle buttons in the header and user menu, workspace tab buttons, orientation buttons in playlist inspector, and several other elements use `bg-primary text-white` for their active state. The rest of the dashboard uses `bg-primary text-primary-foreground`. In light mode, `text-primary-foreground` is typically white, so the difference is invisible. In dark mode or if the primary color changes, `text-white` would remain white while `text-primary-foreground` would adapt to the theme.

**Root cause:** These elements were styled before the `text-primary-foreground` token was adopted, or were copied from auth/header patterns that predated the design system.

**Canonical pattern:** `bg-primary text-primary-foreground`

**Exact files and lines:**

| File | Lines | Element |
|------|-------|---------|
| `apps/dashboard/src/components/user-menu.tsx` | 74, 113, 125 | Avatar, language toggle buttons |
| `apps/dashboard/src/components/layout/header.tsx` | 259, 271 | Language toggle buttons |
| `apps/dashboard/src/features/dashboard/home-dashboard-dialogs.tsx` | 62 | Rename dialog submit button |
| `apps/dashboard/src/features/auth/forgot-password-client.tsx` | 122 | Back to sign in link |
| `apps/dashboard/src/features/auth/impersonation-return-button.tsx` | 45 | Return to admin button |
| `apps/dashboard/src/components/crystal-shell.tsx` | 96 | Skip to content link |
| `apps/dashboard/src/features/playlists/studio/components/workspace-tabs.tsx` | 24, 38 | Workspace filter tabs |
| `apps/dashboard/src/features/playlists/studio/components/inspector-panel.tsx` | 88, 134, 147 | Orientation and layout buttons |
| `apps/dashboard/src/features/playlists/playlist-zone-preview.tsx` | 196, 230 | Zone label, zone buttons |
| `apps/dashboard/src/features/schedules/schedules-timeline-view.tsx` | 70 | Schedule blocks |

**Risk:** Low — in current theme, `text-primary-foreground` resolves to white, so no visible change. But this is a semantic token consistency issue that could cause problems in future theme variations.

---

#### M-02: Non-standard font sizes (`text-[10px]`, `text-[11px]`, `text-[13px]`, `text-[14px]`, `text-[15px]`)

**Severity:** Medium

**Screenshot-equivalent description:**
Several components use arbitrary pixel-based font sizes instead of the standard Tailwind scale (`text-xs` = 12px, `text-sm` = 14px). The most jarring is `text-[10px]` which renders smaller than `text-xs` and looks noticeably tiny. `text-[11px]` is also between `text-xs` and `text-[10px]`. These appear in labels, badges, kbd hints, and micro-text.

**Root cause:** These were used for fine-grained control before the design system established `text-xs` as the minimum size for readable text.

**Canonical pattern:** Use `text-xs` (12px) for all micro-text, labels, and badges. Use `text-sm` (14px) for body text. Avoid arbitrary pixel values.

**Exact files and lines (non-Studio only):**

| File | Lines | Size | Element |
|------|-------|------|---------|
| `apps/dashboard/src/components/user-menu.tsx` | 99, 111, 123, 149 | `text-[11px]`, `text-[10px]` | Language label, language buttons, section label |
| `apps/dashboard/src/components/layout/header.tsx` | 245, 257, 269 | `text-[11px]` | Language label, language buttons |
| `apps/dashboard/src/components/language-switcher.tsx` | 45 | `text-[11px]` | Switcher button |
| `apps/dashboard/src/components/usage-indicator.tsx` | 60, 83 | `text-[11px]` | Screen/storage labels |
| `apps/dashboard/src/features/workspace/workspace-switcher.tsx` | 83, 115 | `text-[13px]`, `text-[14px]`, `text-[11px]` | Workspace name, menu label |
| `apps/dashboard/src/features/team/team-client.tsx` | 645 | `text-[10px]` | Workspace scope badge |
| `apps/dashboard/src/features/search/global-search.tsx` | 229, 294, 307, 340 | `text-[10px]`, `text-[11px]` | Kbd hint, quick nav label, type badges |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 211, 221 | `text-[10px]` | Action badge, IP address |
| `apps/dashboard/src/features/notifications/notifications-page-client.tsx` | 118 | `text-[10px]` | Unread count badge |
| `apps/dashboard/src/features/schedules/schedules-timeline-view.tsx` | 70 | `text-[10px]` | Schedule block label |
| `apps/dashboard/src/features/playlists/playlist-zone-preview.tsx` | 195 | `text-[10px]` | Zone label |

**Risk:** Low — changing `text-[10px]` to `text-xs` will make micro-text slightly larger (12px vs 10px), which is actually better for readability. `text-[11px]` → `text-xs` is a smaller change (12px vs 11px). `text-[13px]` → `text-sm` (14px vs 13px) is also minor.

---

#### M-03: Toolbar/filter bar — two visual patterns

**Severity:** Medium

**Screenshot-equivalent description:**
- **Pattern A (container toolbar):** Playlists — filters are wrapped in a visible card-like container with `rounded-lg border border-border bg-card p-3`. This creates a distinct toolbar area.
- **Pattern B (bare flex row):** Screens, Media, Audit Log, Notifications, Team — filters are in a bare `flex flex-wrap items-center gap-3` row with no container border. The filters float in the page content area.

Visually, Pattern A looks more structured and separate from the content. Pattern B looks more integrated but less organized when there are many filters.

**Root cause:** No shared toolbar pattern was established. Playlists was built with a container, others without.

**Canonical pattern:** Pattern B (bare flex row) is used by the majority (5 of 6 pages). If a container is needed for visual grouping, it should be applied consistently.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 254 | Container toolbar (`rounded-lg border border-border bg-card p-3`) |
| `apps/dashboard/src/features/screens/screens-client.tsx` | — | Bare flex row |
| `apps/dashboard/src/features/media/media-library-client.tsx` | 682 | Bare flex row |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 136 | Bare flex row |
| `apps/dashboard/src/features/notifications/notifications-page-client.tsx` | 102 | Bare flex row |
| `apps/dashboard/src/features/team/team-client.tsx` | 502 | Bare flex row (inside section) |

**Risk:** Low — visual consistency only. Either pattern is acceptable if applied uniformly.

---

#### M-04: Search input icon size and padding inconsistency

**Severity:** Medium

**Screenshot-equivalent description:**
- **Screens, Media, Playlists:** Search icon is `h-4 w-4` positioned at `start-3`, input has `ps-9`. Icon looks standard size.
- **Team, Audit Log:** Search icon is `h-3.5 w-3.5` positioned at `start-2.5`, input has `ps-8`. Icon looks slightly smaller and closer to the edge.

Visually, the Team/Audit Log search inputs have a smaller, more tightly positioned icon that looks subtly different from the Screens/Media search inputs.

**Root cause:** Team and Audit Log were built with a slightly different search input pattern.

**Canonical pattern:** `h-4 w-4` icon at `start-3` with `ps-9` input padding (Screens/Media/Playlists pattern).

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | — | `h-4 w-4`, `start-3`, `ps-9` ✅ |
| `apps/dashboard/src/features/media/media-library-client.tsx` | 687 | `h-4 w-4`, `start-3`, `ps-9` ✅ |
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 256 | `h-4 w-4`, `start-3`, `ps-9` ✅ |
| `apps/dashboard/src/features/team/team-client.tsx` | 504 | `h-3.5 w-3.5`, `start-2.5`, `ps-8` ❌ |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 138 | `h-3.5 w-3.5`, `start-2.5`, `ps-8` ❌ |

**Risk:** Low — visual alignment only.

---

#### M-05: Card component vs inline card div — two card patterns

**Severity:** Medium

**Screenshot-equivalent description:**
- **`Card` component (from `@/components/ui/card`):** Used by Emergency, AI Tools, Templates, Schedules Timeline. Renders with `cardVariants` styling (specific border, radius, shadow from the UI package). Has `CardHeader`, `CardContent`, `CardTitle` sub-components with their own padding.
- **Inline `div` with `rounded-lg border border-border bg-card shadow-sm`:** Used by Schedules sections, Team sections, Settings panels, Analytics cards, etc. Manually styled with consistent `p-6` padding.

Visually, the `Card` component may have slightly different padding, shadow, or border-radius depending on `cardVariants`. The inline div pattern is more explicit and consistent across pages.

**Root cause:** Some pages were built using the shared `Card` component, others used inline divs for more control.

**Canonical pattern:** Inline `div` with `rounded-lg border border-border bg-card shadow-sm p-6` is the majority pattern. The `Card` component should only be used where `CardHeader`/`CardTitle`/`CardContent` structure is needed.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/dashboard/emergency-client.tsx` | 122, 201 | `Card` component |
| `apps/dashboard/src/features/dashboard/ai-tools-client.tsx` | 85, 121, 131 | `Card` component |
| `apps/dashboard/src/features/schedules/schedules-timeline-view.tsx` | — | `Card` component |

**Risk:** Low — both patterns look similar. Standardizing to inline divs would require restructuring `CardHeader`/`CardContent` usage.

---

#### M-06: View mode toggle — inconsistent container and button sizing

**Severity:** Medium

**Screenshot-equivalent description:**
- **Screens:** Toggle container is `rounded-lg border border-border bg-card p-0.5` with `h-8 w-8` icon-only buttons. Compact, icon-focused.
- **Schedules:** Toggle container is `rounded-lg border border-border bg-muted/50 p-1` with `px-3 py-1.5` icon-only buttons. Slightly larger, different background.

Visually, the Schedules toggle has a muted background while the Screens toggle has a card background. The Schedules toggle buttons are slightly larger due to `px-3 py-1.5` vs `h-8 w-8`.

**Root cause:** Independent implementation of the same UI pattern.

**Canonical pattern:** Screens pattern (`bg-card p-0.5`, `h-8 w-8` buttons) is more compact and consistent with the rest of the dashboard.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | 525–550 | `bg-card p-0.5`, `h-8 w-8` buttons ✅ |
| `apps/dashboard/src/features/schedules/schedules-client.tsx` | 314–338 | `bg-muted/50 p-1`, `px-3 py-1.5` buttons ❌ |

**Risk:** Low — visual consistency only.

---

#### M-07: Section spacing — `space-y-4` vs `space-y-6` vs `space-y-8`

**Severity:** Medium

**Screenshot-equivalent description:**
Most pages use `space-y-6` between major sections, creating a consistent vertical rhythm. However:
- **Notifications** uses `space-y-4` — sections feel closer together.
- **Audit Log** uses `space-y-4` — same tighter rhythm.
- **Help** uses `space-y-8` — sections feel more spread out.

Visually, Notifications and Audit Log feel denser than the rest of the dashboard. Help feels airier.

**Root cause:** No shared section spacing convention was enforced.

**Canonical pattern:** `space-y-6` for vertical rhythm between major page sections.

**Exact files and lines:**

| File | Lines | Spacing |
|------|-------|---------|
| `apps/dashboard/src/features/notifications/notifications-page-client.tsx` | 100 | `space-y-4` ❌ |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 134 | `space-y-4` ❌ |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 87 | `space-y-8` ❌ |
| All other pages | — | `space-y-6` ✅ |

**Risk:** Low — visual rhythm adjustment only.

---

### LOW

---

#### L-01: Filter select styling — `backdrop-blur` inconsistency

**Severity:** Low

**Screenshot-equivalent description:**
Some filter `<select>` elements use `bg-background/80 backdrop-blur` (creating a subtle translucent effect) while others use `bg-card` (solid). The difference is barely visible in light mode but more noticeable in dark mode.

**Root cause:** Selects were styled independently per page.

**Canonical pattern:** `bg-background/80 backdrop-blur` is used by Screens, Media, and Schedules (3 pages). `bg-card` is used by Team, Audit Log, Playlists (3 pages). Equal split — choose one and standardize.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | 462, 473, 484, 494 | `bg-background/80 backdrop-blur` |
| `apps/dashboard/src/features/media/media-library-client.tsx` | 696, 706, 716 | `bg-background/80 backdrop-blur` |
| `apps/dashboard/src/features/schedules/schedules-client.tsx` | 341 | `bg-background/80 backdrop-blur` |
| `apps/dashboard/src/features/team/team-client.tsx` | 514 | `bg-card` |
| `apps/dashboard/src/features/audit-log/audit-log-page-client.tsx` | 151 | `bg-card` |
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 269, 285, 299 | `bg-background/80 backdrop-blur` (but with `font-medium` and `focus:border-primary/40`) |

**Risk:** Low — barely visible difference.

---

#### L-02: Playlists filter selects have extra styling not present elsewhere

**Severity:** Low

**Screenshot-equivalent description:**
Playlists filter selects have `font-medium` and `focus:border-primary/40` classes that other pages' selects don't have. This makes the Playlist filter text slightly bolder and the focus state has a colored border. Other pages' selects have no explicit focus border styling.

**Root cause:** Playlists was styled with more attention to focus states.

**Canonical pattern:** Standardize focus styling on all filter selects.

**Exact files and lines:**

| File | Lines | Extra classes |
|------|-------|---------------|
| `apps/dashboard/src/features/playlists/playlist-list-client.tsx` | 269, 285, 299 | `font-medium outline-none focus:border-primary/40` |
| All other filter selects | — | No `font-medium`, no `focus:border-primary/40` |

**Risk:** Low — visual refinement.

---

#### L-03: Icon stroke width inconsistency

**Severity:** Low

**Screenshot-equivalent description:**
Some icons use `strokeWidth={1.5}` (thinner), some use `strokeWidth={1.75}` (medium), some use `strokeWidth={2}` (default), and some import `ICON_STROKE` constant. The difference is subtle but visible — thinner icons look more refined, thicker icons look more bold.

**Root cause:** No shared stroke width convention. `EmptyState` uses `1.75`, error states use `1.5`, some files import `ICON_STROKE` (which is `1.75`), others use default `2`.

**Canonical pattern:** `ICON_STROKE` constant from `@/lib/icon-stroke` (currently `1.75`) for all decorative icons. Error/alert icons use `1.5` for a more urgent appearance.

**Exact files and lines:**

| Pattern | Files |
|---------|-------|
| `ICON_STROKE` imported | `branches-page-client.tsx`, `help-support-client.tsx`, `global-search.tsx`, `header.tsx` |
| `strokeWidth={1.5}` | Error states in `screens-client.tsx`, `analytics-page-client.tsx`, `playlist-list-client.tsx`, `team-client.tsx`, `media-library-client.tsx` |
| `strokeWidth={1.75}` | `EmptyState` component, `schedules-client.tsx` |
| `strokeWidth={2}` (default) | Most icons in most files |
| No explicit strokeWidth | Many files — uses Lucide default of `2` |

**Risk:** Low — subtle visual difference. Standardizing would improve consistency but is not urgent.

---

#### L-04: `vc-table-head-surface` and `vc-table-row` custom CSS classes for tables

**Severity:** Low

**Screenshot-equivalent description:**
Screens and Media table views use `vc-table-head-surface` (custom CSS for header background) and `vc-table-row` (custom CSS for row hover). Campaigns uses the shared `Table` component from `@/components/ui/table` which has its own styling. The visual difference is subtle — the `vc-table-*` classes have a specific muted background and hover transition, while the `Table` component may have slightly different styling.

**Root cause:** Screens and Media tables were built with raw `<table>` elements + custom CSS classes. Campaigns uses the shared `Table` component.

**Canonical pattern:** Shared `Table` component from `@/components/ui/table` for all data tables.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/screens/screens-client.tsx` | 718, 732 | Raw `<table>` + `vc-table-head-surface`, `vc-table-row` |
| `apps/dashboard/src/features/media/media-grid-sections.tsx` | 223, 237 | Raw `<table>` + `vc-table-head-surface`, `vc-table-row` |
| `apps/dashboard/src/features/campaigns/campaigns-client.tsx` | 270–366 | Shared `Table`/`TableHeader`/`TableRow`/`TableCell` ✅ |

**Risk:** Low — both patterns produce similar visuals. Standardizing to `Table` component would improve code consistency but the visual difference is minimal.

---

#### L-05: Campaigns loading skeleton doesn't match shared patterns

**Severity:** Low

**Screenshot-equivalent description:**
Campaigns loading state shows a `Skeleton h-8 w-48` (header placeholder) + `Skeleton h-64 w-full` (large block placeholder). This looks like a single header bar + one large box, which is visually different from `CardGridSkeleton` (grid of smaller cards) or `TableSkeleton` (rows and columns).

**Root cause:** Campaigns was built with a custom skeleton that doesn't match any shared pattern.

**Canonical pattern:** `TableSkeleton` (since Campaigns uses a table layout) from `@/components/ui/skeleton-patterns`.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/campaigns/campaigns-client.tsx` | 213–222 | Custom `Skeleton` layout ❌ |

**Risk:** Low — visual alignment only.

---

#### L-06: Emergency and AI Tools use `Card` component with `CardHeader`/`CardTitle` — different visual structure from inline divs

**Severity:** Low

**Screenshot-equivalent description:**
Emergency page and AI Tools page use `Card` → `CardHeader` → `CardTitle` → `CardContent` structure. The `CardTitle` has `text-lg flex items-center gap-2` with an icon. This creates a card with a distinct header area (with bottom border from `CardHeader`) and content area.

Other pages (Schedules, Team, Settings) use inline `div` with `rounded-lg border border-border bg-card p-6` and a manual `h3` or `h2` heading inside. No header/content separation.

Visually, the `Card` pattern has a subtle divider between header and content. The inline div pattern has everything in one flat container.

**Root cause:** Emergency and AI Tools were built with the `Card` component. Other pages use inline divs.

**Canonical pattern:** Inline `div` with `rounded-lg border border-border bg-card p-6 shadow-sm` is the majority pattern. `Card` component is acceptable for pages that need header/content separation.

**Exact files and lines:**

| File | Lines | Pattern |
|------|-------|---------|
| `apps/dashboard/src/features/dashboard/emergency-client.tsx` | 122–198, 201–237 | `Card` + `CardHeader` + `CardTitle` + `CardContent` |
| `apps/dashboard/src/features/dashboard/ai-tools-client.tsx` | 85–116, 121–128, 131–170 | `Card` + `CardHeader` + `CardTitle` + `CardContent` |

**Risk:** Low — both patterns are visually acceptable. Standardizing is optional.

---

#### L-07: Help page guide cards and FAQ items use `rounded-xl` and `vc-card-surface`

**Severity:** Low

**Screenshot-equivalent description:**
Help page guide cards have `vc-card-surface rounded-xl border border-border bg-card p-5` — combining the custom surface class with `rounded-xl`. FAQ items also use `vc-card-surface rounded-xl`. The contact section uses `vc-card-surface rounded-xl p-6 sm:p-8`. These look slightly different from the standard `rounded-lg border border-border bg-card shadow-sm` cards on other pages.

**Root cause:** Help page was built with both `vc-card-surface` and `rounded-xl` before standards were established.

**Canonical pattern:** `rounded-lg border border-border bg-card shadow-sm` (remove `vc-card-surface` and change `rounded-xl` to `rounded-lg`).

**Exact files and lines:**

| File | Lines | Element |
|------|-------|---------|
| `apps/dashboard/src/features/help/help-support-client.tsx` | 101 | Guide cards |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 103 | Guide icon containers (`rounded-xl`) |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 125 | FAQ items |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 156 | Contact section |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 158 | Contact icon container (`rounded-xl`) |
| `apps/dashboard/src/features/help/help-support-client.tsx` | 169 | Email link (`rounded-xl`) |

**Risk:** Low — visual alignment. This overlaps with H-01 and H-02.

---

## Summary Matrix

| ID | Severity | Issue | Pages Affected | Canonical Fix |
|----|----------|-------|----------------|---------------|
| H-01 | High | `rounded-xl` on interactive elements | Audit Log, Notifications, Help, Screen Card, Schedules Dialog, Media Card, Playlist Tabs, Impersonation | Replace with `rounded-lg` |
| H-02 | High | `vc-card-surface` / `vc-glass` in non-Studio pages | Schedules, Screen Analytics, Onboarding, Islamic widgets, Media folders, Help, Workspace welcome | Replace with `rounded-lg border border-border bg-card shadow-sm` |
| H-03 | High | Empty states — two patterns | Notifications, Audit Log | Use shared `EmptyState` component |
| H-04 | High | Error states — inconsistent shadow/icon/structure | Playlists, Team, Media, Campaigns | Standardize to Screens/Analytics pattern |
| H-05 | High | Loading states — five patterns | Campaigns, Playlists, Media | Use `CardGridSkeleton`, `ListSkeleton`, or `TableSkeleton` |
| M-01 | Medium | `text-white` instead of `text-primary-foreground` | Header, User Menu, Home Dialogs, Auth, Playlist Studio, Schedules Timeline | Replace with `text-primary-foreground` |
| M-02 | Medium | Non-standard font sizes (`text-[10px]` etc.) | User Menu, Header, Language Switcher, Usage Indicator, Workspace Switcher, Team, Search, Audit Log, Notifications, Schedules, Playlists | Replace with `text-xs` or `text-sm` |
| M-03 | Medium | Toolbar — container vs bare flex | Playlists (container) vs all others (bare) | Standardize to bare flex row |
| M-04 | Medium | Search input icon size/position | Team, Audit Log | Align to `h-4 w-4`, `start-3`, `ps-9` |
| M-05 | Medium | `Card` component vs inline div | Emergency, AI Tools | Acceptable — both patterns work |
| M-06 | Medium | View mode toggle inconsistency | Schedules vs Screens | Align to Screens pattern |
| M-07 | Medium | Section spacing `space-y-4`/`space-y-8` vs `space-y-6` | Notifications, Audit Log, Help | Standardize to `space-y-6` |
| L-01 | Low | Filter select `backdrop-blur` inconsistency | All pages with selects | Choose one pattern |
| L-02 | Low | Playlists selects have extra `font-medium` + focus styling | Playlists only | Standardize focus styling |
| L-03 | Low | Icon stroke width inconsistency | All pages | Use `ICON_STROKE` constant |
| L-04 | Low | `vc-table-*` CSS vs shared `Table` component | Screens, Media vs Campaigns | Standardize to `Table` component |
| L-05 | Low | Campaigns loading skeleton doesn't match | Campaigns | Use `TableSkeleton` |
| L-06 | Low | `Card` component with header/content separation | Emergency, AI Tools | Acceptable — both patterns work |
| L-07 | Low | Help page uses `rounded-xl` + `vc-card-surface` | Help | Replace with standard card pattern |

---

## Recommended Implementation Order

1. **H-01 + H-02 + L-07** — Replace `rounded-xl` → `rounded-lg` and remove `vc-card-surface`/`vc-glass` across all non-Studio files. These are mechanical find-and-replace operations.
2. **H-03** — Replace hand-rolled empty states in Notifications and Audit Log with `EmptyState` component.
3. **H-04** — Standardize error states to the Screens/Analytics pattern (shadow-xs, full-opacity destructive icon, role="alert").
4. **H-05** — Replace custom loading states in Campaigns, Playlists, and Media with shared skeleton components.
5. **M-01** — Replace `text-white` → `text-primary-foreground` across all non-Studio files.
6. **M-02** — Replace arbitrary font sizes with standard Tailwind scale.
7. **M-03 through M-07** — Standardize toolbar, search, toggle, and spacing patterns.
8. **L-01 through L-06** — Low-priority refinements.

---

## Exclusions

The following are **excluded** from this audit as they are intentional design decisions or separate scopes:

- **Studio canvas editor** (`studio-editor-client.tsx`, `studio-panels.tsx`) — has its own dark-canvas design language with `rounded-xl`, `text-[10px]`, `text-white` on dark overlays, and `vc-card-surface` for panel surfaces. These are intentional.
- **Playlist Studio components** (`playlist-zone-preview.tsx`, `inspector-panel.tsx`, `workspace-tabs.tsx`) — part of the Studio-adjacent tooling with its own design patterns. These should be reviewed in a separate Studio audit.
- **Auth pages** (`forgot-password-client.tsx`, `impersonation-return-button.tsx`) — these are pre-auth or overlay UI, not part of the main dashboard shell.
- **Page headers** — all page headers are consistent (kicker + title + description + border-b). No issues found.
- **Overview/Home page** — uses a hero card pattern intentionally, which is appropriate for a landing/dashboard page.
