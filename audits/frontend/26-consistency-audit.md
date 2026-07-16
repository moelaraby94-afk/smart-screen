# 26 — Consistency Audit

> **Source basis:** Cross-cutting analysis of all components, features, and patterns  

---

## 26.1 Pattern Consistency

### ✅ Consistent Patterns

| Pattern | Implementation | Used In |
|---------|---------------|---------|
| Page header (kicker + title + description) | `<header className="space-y-1 border-b border-border pb-4">` with kicker, h1, description | All shell pages, most admin pages |
| Card surface | `.vc-card-surface` or `Card` component with `rounded-xl border border-border bg-card shadow-sm` | Throughout app |
| Button variants | CVA-based `Button` component with `default`, `cta`, `secondary`, `ghost`, `outline`, `destructive` | Throughout app |
| Toast feedback | `toast.success()` / `toast.error()` / `toastResponseError()` | All feature components |
| API error handling | `readApiError()` → `useApiErrorToast` or `useApiErrorMessage` | All API-calling components |
| Loading state | `Loader2` spinner or `Skeleton` patterns | Throughout app |
| Empty state | `EmptyState` component with icon, title, description, action | List views, search results |
| Dialog structure | `Dialog` / `AlertDialog` with header, content, footer | All modals |
| Form inputs | `Input` with `h-10 rounded-xl border border-border bg-card` | All forms |
| Icon stroke | `ICON_STROKE = 1.5` constant | All lucide icons |
| Focus ring | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` | All interactive elements |
| RTL logical properties | `ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-` | Throughout app |
| Framer-motion page transitions | `PageTransition` wrapper with opacity + y animation | All shell pages |
| Back button logic | `useShellHeaderMeta` hook computes visibility + href | All shell pages |

### ⚠️ Inconsistencies Found

| Issue | Details | Impact |
|-------|---------|--------|
| Admin page header style | Some admin pages use `vc-page-kicker` / `vc-page-title` / `vc-page-desc` CSS classes, others use inline `<header>` pattern | Minor visual inconsistency between admin pages |
| Feature flags page | No breadcrumb bar, no standard page header — renders directly with its own metadata | Inconsistent with other admin pages |
| Auth input height | Auth forms use `h-11` inputs while standard `Input` is `h-10` | Intentional but inconsistent |
| Admin billing redirect | Redirects to `/settings/billing` (user route) instead of having its own admin billing page | Inconsistent with admin pattern |
| Skeleton usage | Some pages use `CardGridSkeleton`, others use text "Loading...", others use `Loader2` spinner | Inconsistent loading state presentation |
| Data fetching | Mix of SWR (screens, media) and manual `useCallback` + `useEffect` (dashboard insights) | Inconsistent data fetching patterns |
| Hero headline size | HomeOverview hero: `text-2xl sm:text-4xl` — other page titles: `text-xl` | Intentional (hero is special) but large jump |

---

## 26.2 Spacing Consistency

### Page-Level Spacing

| Area | Spacing | Consistent? |
|------|---------|-------------|
| Main content padding (mobile) | `px-4 py-6` | ✅ |
| Main content padding (sm) | `px-6` | ✅ |
| Main content padding (lg) | `px-8` | ✅ |
| Section spacing | `space-y-6` | ✅ Most pages |
| Overview section spacing | `space-y-8` | ⚠️ Different from other pages |
| Card padding | `p-6` | ✅ Standard |
| Compact card padding | `p-4` | ✅ Used consistently for smaller cards |
| Header bottom border | `border-b border-border pb-4` | ✅ |
| Grid gap | `gap-4` | ✅ Standard grid gap |

### Component Spacing

| Component | Spacing | Consistent? |
|-----------|---------|-------------|
| Button padding (default) | `px-4 py-2` | ✅ |
| Button padding (sm) | `px-3` | ✅ |
| Input padding | `px-3 py-2` | ✅ |
| Dialog padding | `p-6` | ✅ |
| Dropdown item padding | `px-2.5 py-1.5` | ✅ |
| Table cell padding | `p-3` | ✅ |
| Badge padding | `px-2.5 py-0.5` | ✅ |

---

## 26.3 Naming Conventions

### File Naming

| Type | Convention | Example | Consistent? |
|------|-----------|---------|-------------|
| Page components | `kebab-case-page.tsx` | `screens-client.tsx` | ✅ |
| UI components | `kebab-case.tsx` | `dropdown-menu.tsx` | ✅ |
| Hooks | `use-kebab-case.ts` | `use-screen-realtime.ts` | ✅ |
| API modules | `kebab-case-api.ts` | `screens-api.ts` | ✅ |
| Types | `kebab-case-types.ts` | `home-dashboard-types.ts` | ✅ |
| Utils | `kebab-case.ts` | `icon-stroke.ts` | ✅ |
| Context | `kebab-case-context.tsx` | `workspace-context.tsx` | ✅ |

### Component Naming

| Type | Convention | Example | Consistent? |
|------|-----------|---------|-------------|
| Client components | `PascalCase` | `ScreensClient`, `LoginForm` | ✅ |
| Server components | `PascalCasePage` | `ScreensPage`, `OverviewPage` | ✅ |
| Hooks | `useCamelCase` | `useWorkspace`, `useApiScreens` | ✅ |
| Context | `PascalCaseProvider` | `WorkspaceProvider`, `NotificationProvider` | ✅ |
| Types | `PascalCase` | `ScreenRow`, `InsightsPayload` | ✅ |

### CSS Class Naming

| Type | Convention | Example | Consistent? |
|------|-----------|---------|-------------|
| Design system classes | `vc-*` prefix | `vc-card-surface`, `vc-page-title` | ✅ |
| Tailwind utilities | Standard Tailwind | `rounded-xl`, `border-border` | ✅ |
| Custom animation classes | `animate-*` | `animate-pulse`, `animate-spin` | ✅ |

---

## 26.4 Icon Usage Consistency

### Icon Size Standards

| Context | Size | Consistent? |
|---------|------|-------------|
| Buttons (default) | `h-4 w-4` | ✅ |
| Buttons (large) | `h-5 w-5` | ✅ |
| Cards/sections | `h-4 w-4` or `h-5 w-5` | ✅ |
| Hero sections | `h-8 w-8` to `h-11 w-11` | ✅ (contextually larger) |
| Micro indicators | `h-3 w-3` or `h-3.5 w-3.5` | ✅ |
| Notification bell icons | `h-3.5 w-3.5` | ✅ |
| Empty state icons | `h-6 w-6` | ✅ |
| Error boundary icons | `h-7 w-7` | ✅ |

### Stroke Width
- Constant `ICON_STROKE = 1.5` used consistently
- Some components use `strokeWidth={1.75}` or `strokeWidth={1.8}` for specific icons — minor inconsistency but intentional for visual emphasis on smaller icons

---

## 26.5 Color Usage Consistency

### Semantic Color Usage

| Meaning | Color | Consistent? |
|---------|-------|-------------|
| Primary action | `primary` (orange) | ✅ |
| Success/online | `emerald-500/10`, `emerald-600` | ✅ |
| Warning/offline | `amber-500/10`, `amber-600` | ✅ |
| Destructive | `destructive` (red) | ✅ |
| Muted/secondary | `muted`, `muted-foreground` | ✅ |
| Notification: upload | `blue-500/15`, `blue-600` | ✅ |
| Notification: subscription | `purple-500/15`, `purple-600` | ✅ |
| Notification: schedule | `indigo-500/15`, `indigo-600` | ✅ |
| Notification: pairing | `cyan-500/15`, `cyan-600` | ✅ |
| Hero decorative orbs | `violet-500/10`, `cyan-500/8`, `pink-500/5` | ✅ (decorative only) |

### Potential Issues
- Notification type colors (blue, purple, indigo, cyan) are only used in notification icons — not part of the core design system. This is intentional (color-coding by notification type) but adds colors outside the standard palette.
- Some components use hardcoded Tailwind colors (e.g., `bg-red-500` for notification badge) instead of semantic tokens. Minor inconsistency.

---

## 26.6 Translation Key Consistency

### Namespace Pattern
- Feature pages: `{featureName}Page` namespace (e.g., `screensPage`, `mediaPage`)
- Shell: `shell` namespace for page titles, back labels, aria
- Navigation: `nav` namespace
- Auth: `authForm`, `registerPage`, `forgotPasswordPage`
- Admin: `admin{Feature}` namespace (e.g., `adminCustomers`, `adminStaff`)

### Key Naming
- `title` — page/section title
- `description` — page/section description
- `kicker` — uppercase tracked label above title
- `toast{Action}` — toast messages (e.g., `toastSaved`, `toastDeleteFailed`)
- `{action}` — button labels (e.g., `save`, `cancel`, `delete`, `retry`)
- `{field}Label` — form field labels
- `{field}Placeholder` — form field placeholders
- `empty` — empty state message
- `loading` — loading state message

### Consistency Assessment
- Translation key patterns are generally consistent across features
- Some features may have missing keys (would show key as fallback in development)
- All user-facing strings appear to use translation functions (no hardcoded English strings found in components)

---

## 26.6 [V2] UX Analysis — Consistency Audit

### Icon Consistency — Cross-Feature

**[V2] Duplicate Icons Identified:**
| Icon | Used For | Location |
|------|----------|----------|
| `Clapperboard` | Playlists, Studio, Quick Action "Create Playlist" | Sidebar, Quick Actions |
| `LayoutTemplate` | Templates, Quick Action "Open Studio" | Sidebar, Quick Actions |
| `Monitor` | Screens, Quick Action "Add Screen" | Sidebar, Quick Actions |
| `Activity` | Analytics, Quick Action "View Analytics" | Sidebar, Quick Actions |

The `Clapperboard` icon duplication for both Playlists and Studio is the most confusing — users may conflate the two features. Playlists and Studio are related but distinct: Playlists is the library, Studio is the editor.

**[V2] Icon Stroke Width:**
- Sidebar nav items: `strokeWidth={1.6}` (custom `STROKE` constant)
- EmptyState component: `strokeWidth={1.5}` (standard `ICON_STROKE`)
- Other components: Varies (some use default 2.0)

The inconsistent stroke weights create subtle visual inconsistency. The sidebar's 1.6 is between the default 2.0 and the EmptyState's 1.5 — three different stroke weights in one app.

### Spacing Consistency

**[V2] Content Padding:**
- Shell main: `px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12`
- Sidebar nav: `px-3 py-2`
- Sidebar bottom bar: `px-4 py-3`
- Header: `px-4 py-2 sm:px-6 lg:px-10`
- Dialog content: Varies by dialog

The shell main, header, and sidebar all use different horizontal padding scales. The header matches the main content padding (`px-4 sm:px-6 lg:px-10`) which is good — they align visually.

**[V2] Border Radius:**
- Cards: `rounded-xl` (12px)
- Buttons: `rounded-xl` (12px)
- Nav items: `rounded-xl` (12px)
- Badges: `rounded-full`
- Inputs: `rounded-xl` (12px)
- Dialog: `rounded-2xl` (16px)

`rounded-xl` is the dominant radius — good consistency. Dialogs use `rounded-2xl` which is slightly larger, creating visual hierarchy.

### Component Usage Consistency

**[V2] Button Variants:**
- Primary CTA: `variant="cta"` (with glow) — used on welcome screen, wizard
- Default: `variant="default"` — used for most primary actions
- Destructive: `variant="destructive"` — used for delete actions
- Outline: `variant="outline"` — used for back buttons, secondary actions
- Ghost: `variant="ghost"` — used for icon buttons, tertiary actions

The variant usage is consistent across features. The `cta` vs `default` distinction is subtle (glow shadow) and may not be consistently applied.

**[V2] Loading State Patterns:**
As identified in `23-error-handling-and-states.md` V2, loading patterns are inconsistent:
- Skeletons: Overview, sidebar
- Spinners: WorkspaceGate, onboarding, form submit buttons
- Text: ClientHomeDashboard

This inconsistency should be resolved — pick one pattern for page-level loading (skeletons recommended) and one for action-level loading (spinners recommended).

### [V2] Consistency Scorecard

| Aspect | Score | Notes |
|--------|-------|-------|
| Icon usage | ⚠️ Medium | Duplicate icons (Clapperboard, LayoutTemplate) |
| Stroke width | ⚠️ Medium | Three different stroke weights (1.5, 1.6, 2.0) |
| Spacing | ✅ Good | Consistent padding scales, header aligns with content |
| Border radius | ✅ Good | rounded-xl dominant, rounded-2xl for dialogs |
| Button variants | ✅ Good | Consistent variant usage across features |
| Loading states | ⚠️ Medium | Three different patterns (skeleton, spinner, text) |
| Empty states | ✅ Good | Consistent EmptyState component usage |
| Error handling | ✅ Good | Consistent toast + inline error pattern |
| Translation keys | ✅ Good | Consistent naming patterns, namespace organization |
| Color semantics | ✅ Good | Badge variants map to semantic meanings consistently |

### Cross-References
- See `02-design-system-and-tokens.md` for design token definitions
- See `05-ui-component-library.md` for component specifications
- See `22-i18n-and-localization.md` for translation patterns
- See `23-error-handling-and-states.md` for loading state inconsistency
- See `03-routing-and-navigation.md` for sidebar icon usage
