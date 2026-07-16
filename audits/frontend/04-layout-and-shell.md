# 04 — Layout Shell & Layout Components

> **Source basis:** `src/components/crystal-shell.tsx`, `src/components/layout/shell-sidebar.tsx`, `src/components/layout/header.tsx`, `src/components/layout/breadcrumbs.tsx`, `src/components/layout/shell-logo.tsx`, `src/components/layout/shell-header-inset-context.tsx`, `src/components/branding-context.tsx`, `src/components/aurora-backdrop.tsx`, `src/components/page-transition.tsx`, `src/features/workspace/workspace-gate.tsx`, `src/app/[locale]/(shell)/layout.tsx`, `src/app/[locale]/(shell)/admin/admin-section-shell.tsx`  

---

## 4.1 Shell Layout Architecture

> **[V2 Correction]** V1 described the shell as `min-h-screen` with `lg:pl-64` offset and `AuroraBackdrop`. The actual `CrystalShell` uses `h-dvh` (dynamic viewport height), `lg:ms-[240px]` margin, no `AuroraBackdrop`, and includes a skip-to-content link. The nesting order also differs: `WorkspaceGate` wraps `PageTransition`, not the other way around.

### Nesting Order (Actual)
```
CrystalShell (client component, locale prop)
  ├── Skip-to-content link (sr-only, focusable)
  ├── ShellSidebar (fixed, w-[240px], slide-in on mobile)
  ├── Mobile overlay button (bg-black/40, when nav open)
  ├── Main column div (lg:ms-[240px] lg:pl-6)
  │   ├── ShellHeader (sticky top, min-h-[52px])
  │   ├── Breadcrumbs
  │   ├── ShellHeaderInsetSetterContext.Provider
  │   │   └── <main id="main-content"> (overflow-y-auto, max-w-[1600px])
  │   │       └── PageTransition
  │   │           └── WorkspaceGate
  │   │               └── {children}
  │   └── ImpersonationReturnButton (conditional)
```

**[V2] Key Architecture Differences from V1:**
1. **`h-dvh` instead of `min-h-screen`**: The shell uses `h-dvh` (dynamic viewport height) with `overflow-y-hidden` on the outer container. Only `<main>` scrolls — the sidebar and header stay fixed. This prevents document-level scroll, which is better for app-like UX but means the browser's scroll-to-top behavior doesn't work.
2. **`lg:ms-[240px] lg:pl-6`**: Main column uses logical `margin-inline-start` of 240px (not `padding-left` of 64/16rem) plus 6 units of padding. This is RTL-aware via `ms-` utility.
3. **No `AuroraBackdrop`**: V1 documented `AuroraBackdrop` as part of the shell. The actual `CrystalShell` does not render it. The `bg-background` on the outer div and `dark:bg-transparent` provide the base.
4. **`WorkspaceGate` wraps `PageTransition`**: Gate is the outer wrapper, transition is inner. This means the gate's loading/welcome states don't get page transition animations.
5. **Skip-to-content link**: Present at `crystal-shell.tsx:102-107` — `sr-only` by default, becomes visible on focus with primary background. Links to `#main-content`.
6. **`max-w-[1600px]`**: Main content is capped at 1600px and centered with `mx-auto`, preventing overly stretched content on ultra-wide displays.

---

## 4.2 CrystalShell (`src/components/crystal-shell.tsx`)

### Props
| Prop | Type | Purpose |
|------|------|---------|
| `locale` | `string` | Current locale (`ar` or `en`) |
| `children` | `ReactNode` | Page content |

### State
- `mobileNavOpen` — Controls mobile sidebar slide-in visibility
- `headerInset` — ReactNode set by nested components via `ShellHeaderInsetSetterContext`
- `hintSuperAdmin` — Reads `cs_super_admin` from sessionStorage on mount (layout effect)

### Computed Values
- `rtl` — `navLocale === 'ar'`
- `navLocale` — Derived from pathname first segment, falls back to `locale` prop
- `isImpersonating` — `Boolean(impersonatedBySuperAdminId)`
- `pathIsAdmin` — `pathname?.startsWith('/{locale}/admin')`
- `sovereign` — `!isImpersonating && (pathIsAdmin || isSuperAdmin || (isLoading && hintSuperAdmin))`
- `shellNavLoading` — `isLoading && !pathIsAdmin && !isSuperAdmin && !hintSuperAdmin`
- `pageTitle` — From `useShellHeaderMeta`, overridden with workspace name on branch detail pages
- `counts` — From `useWorkspaceStats(workspaceId, workspaceDataEpoch)` — returns `{ media, screens, playlists }`

### Sovereign Mode Logic

**[V2] Sovereign Mode Analysis:**
The `sovereign` flag determines which sidebar navigation to show (admin vs. client). It is true when:
1. Path is under `/admin/*` AND not impersonating, OR
2. User is super-admin AND not impersonating, OR
3. Loading is in progress AND `cs_super_admin` sessionStorage hint is `'1'` (optimistic admin sidebar during load)

When impersonating, `sovereign` is always false — the admin sees the client sidebar to experience the product as the impersonated user. This is a deliberate UX choice: the admin navigates the client UI during impersonation.

### Layout Structure (Actual)

```tsx
<div className="relative flex h-dvh min-h-0 flex-col overflow-x-hidden overflow-y-hidden bg-background text-foreground dark:bg-transparent">
  <a href="#main-content" className="sr-only focus:not-sr-only ...">{t('skipToContent')}</a>
  <ShellSidebar navLocale={navLocale} rtl={rtl} pathname={pathname} sovereign={sovereign}
    shellNavLoading={shellNavLoading} workspaceId={workspaceId} counts={counts}
    isLoading={isLoading} isAuthenticated={isAuthenticated}
    mobileNavOpen={mobileNavOpen} showWorkspaceSwitcher={!sovereign} />
  {mobileNavOpen && <button className="fixed inset-0 z-[78] bg-black/40 backdrop-blur-sm lg:hidden" onClick={closeNav} />}
  <div className="relative z-[20] flex min-h-0 flex-1 flex-col overflow-hidden lg:ms-[240px] lg:pl-6">
    <ShellHeader navLocale={navLocale} rtl={rtl} sovereign={sovereign} pageTitle={pageTitle}
      kicker={headerMeta.kicker} showBack={headerMeta.showBack} backHref={headerMeta.backHref}
      backLabel={headerMeta.backLabel} mobileNavOpen={mobileNavOpen}
      onToggleMobileNav={() => setMobileNavOpen(v => !v)} showWorkspaceSwitcher={!sovereign}
      headerInset={headerInset} />
    <Breadcrumbs pathname={pathname} locale={navLocale} rtl={rtl} />
    <ShellHeaderInsetSetterContext.Provider value={setHeaderInsetStable}>
      <main id="main-content" className="vc-scrollbar relative z-[1] mx-auto min-h-0 w-full max-w-[1600px] flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
        <PageTransition>
          <WorkspaceGate>{children}</WorkspaceGate>
        </PageTransition>
      </main>
    </ShellHeaderInsetSetterContext.Provider>
    <ImpersonationReturnButton />
  </div>
</div>
```

### Key Observations
- **[V2 Correction]** Sidebar is `w-[240px]` (15rem), not `w-64` (16rem). Main content offset is `lg:ms-[240px]` (logical property, RTL-aware) plus `lg:pl-6`.
- **[V2 Correction]** Outer container uses `h-dvh min-h-0` with `overflow-y-hidden` — only `<main>` scrolls, not the document. This is an app-shell pattern, not a page-scroll pattern.
- **[V2 Correction]** No `AuroraBackdrop` component rendered. Background is `bg-background` (light) / `bg-transparent` (dark, letting body background show through).
- **[V2 Correction]** `PageTransition` wraps `WorkspaceGate`, not the other way around. V1 had the order reversed.
- Main content padding: `px-4 py-5` on mobile, `sm:px-6 sm:py-8` on tablet, `lg:px-10 lg:py-12` on desktop.
- Mobile nav overlay uses `z-[78]` with `backdrop-blur-sm`. Sidebar uses `z-[82]`.
- `ShellHeaderInsetSetterContext` allows nested pages to inject content into the header (e.g., branch toolbar).
- Mobile nav auto-closes on route change and on desktop breakpoint (`min-width: 1024px`) via `matchMedia` listener.
- `headerInset` is cleared on every pathname change via `useEffect`.

### [V2] UX Analysis — App Shell Pattern

**[V2] Fixed Viewport Height Trade-offs:**
The `h-dvh` approach creates a true app-shell where the sidebar and header never scroll. This is excellent for navigation persistence but has trade-offs:
- **Pro**: Sidebar and header always visible/accessible — no need to scroll up to navigate.
- **Pro**: Better perceived performance — only content area re-renders on route change.
- **Con**: Browser's native "scroll to top on reload" doesn't work — the `<main>` element's scroll position is managed internally.
- **Con**: On mobile browsers with dynamic toolbars, `h-dvh` adjusts but may cause layout shifts as the address bar shows/hides.
- **Con**: `overscroll-y-contain` prevents scroll chaining, but if content is shorter than viewport, the main area won't bounce-scroll — which some users expect on macOS/iOS.

**[V2] Skip-to-Content Link:**
The skip link is properly implemented: `sr-only` by default, `focus:not-sr-only` on focus, positioned at `start-4 top-4 z-[200]`. This is an accessibility best practice for keyboard users who would otherwise need to tab through the entire sidebar to reach main content.

**[V2] Mobile Nav Z-Index Stack:**
- Sidebar: `z-[82]`
- Overlay: `z-[78]`
- Header: `z-[55]`
- Main content: `z-[1]` (within the main column `z-[20]`)
- Skip link: `z-[200]`
The z-index hierarchy is well-ordered. The skip link at `z-[200]` is above everything, which is correct — it should always be accessible when focused.

---

## 4.3 ShellSidebar (`src/components/layout/shell-sidebar.tsx`)

> **[V2 Correction]** V1 described props as `{ locale, mobileNavOpen, onMobileNavClose }`. Actual props are significantly different — see below. V1 also described `w-64` width, `h-screen`, `z-[101]` overlay, and `h-16` logo section — all incorrect.

### Props (Actual)
| Prop | Type | Purpose |
|------|------|---------|
| `navLocale` | `'ar' \| 'en'` | Current locale for nav rendering |
| `rtl` | `boolean` | RTL flag for slide direction |
| `pathname` | `string \| null` | Current pathname for active state |
| `sovereign` | `boolean` | Show admin nav vs client nav |
| `shellNavLoading` | `boolean` | Show skeleton nav items during load |
| `workspaceId` | `string \| null` | Active workspace ID |
| `counts` | `{ media, screens, playlists }` | Count badges for nav items |
| `isLoading` | `boolean` | Workspace context loading |
| `isAuthenticated` | `boolean` | User is authenticated |
| `mobileNavOpen` | `boolean` | Mobile sidebar visibility |
| `showWorkspaceSwitcher` | `boolean` | Whether to show switcher (always false for sovereign) |

### Desktop Layout
- Fixed position, `w-[240px]` (not `w-64`), `inset-y-0`, `inset-inline-start:0`
- Uses `flex flex-col` with `h-full`
- Background: `bg-card border-e border-border`
- Z-index: `z-[82]`
- Contains: logo section (`px-5 pt-5 pb-3`), scrollable nav (`vc-scrollbar overflow-y-auto`), bottom bar (`border-t`)

### Mobile Layout
- **[V2 Correction]** No separate overlay component. The overlay is a `<button>` rendered in `CrystalShell` at `z-[78]`.
- Sidebar slide: RTL uses `max-lg:translate-x-full` (slides right), LTR uses `max-lg:-translate-x-full` (slides left)
- When open: `max-lg:translate-x-0`
- Desktop: `lg:translate-x-0` (always visible)
- Transition: `duration-300` on `transform`
- **[V2 Correction]** Width is `w-[240px]` on both mobile and desktop — no `w-72` mobile variant

### Logo Section
- Renders `ShellLogo` component
- **[V2 Correction]** Padding is `px-5 pt-5 pb-3` — no fixed height, no `border-b`
- No `h-16` height — logo section is natural height

### Navigation Scrolling
- Nav container: `vc-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2`
- RTL: `text-right`, LTR: `text-left`
- Loading state: 7 skeleton items (`h-12 rounded-xl bg-muted/40`) with `aria-hidden` and `aria-busy="true"`

### NavItem Component
- **[V2 Correction]** Stroke width is `1.6` (not `1.5`) — defined as `const STROKE = 1.6` at line 53
- Active state: `bg-primary/8 text-foreground` with 3px rounded indicator bar (`h-5 w-[3px] bg-primary`) at `inset-inline-start-0`
- Inactive: `text-muted-foreground hover:bg-muted/60 hover:text-foreground`
- Icon: `h-5 w-5`, active color `text-primary`, inactive `text-muted-foreground/70`
- Icon hover: `group-hover:scale-105` (subtle zoom on hover)
- Label: `text-[13px]`, active `font-semibold`, inactive `font-medium`
- Count badge: `text-[10px] font-bold tabular-nums`, active `text-primary`, inactive `text-muted-foreground/50`
- Focus: `focus-visible:ring-2 focus-visible:ring-primary/30`
- Transitions: `duration-200 ease-out` on all properties

### Bottom Bar
- **[V2 Correction]** Three inline controls, not separate components:
  1. Theme toggle: `IconButton` with `Sun`/`Moon` icon
  2. Language: Text button showing `EN`/`AR`, `text-[10px] font-bold uppercase`
  3. Logout: `IconButton` with `LogOut` icon, `danger` variant
- Container: `flex shrink-0 items-center gap-1.5 border-t border-border px-4 py-3`
- Spacer: `<div className="flex-1" />` between language and logout

### [V2] UX Analysis — Sidebar

**[V2] Active State Indicator:**
The 3px rounded bar at the inline-start edge is a strong visual indicator. Combined with `bg-primary/8` background tint and `text-primary` icon color, the active item has three visual differentiators: background, icon color, and indicator bar. This is excellent for quick scanning.

**[V2] Hover Micro-Interaction:**
Icon `group-hover:scale-105` provides a subtle 5% zoom on hover. This is a nice micro-interaction that draws attention to the hovered item without being distracting. The 200ms transition makes it smooth.

**[V2] Loading State:**
7 skeleton items with `h-12 rounded-xl bg-muted/40` and `aria-busy="true"`. The number 7 is reasonable — it fills the visible viewport area without being excessive. However, the skeleton items are all the same height, which doesn't match the actual nav items (some have count badges, some don't). This creates a slight layout shift when loading completes.

**[V2] Scrollbar Styling:**
The nav uses `vc-scrollbar` class — a custom scrollbar style. This is important for visual consistency across platforms, especially on Windows where default scrollbars are thick and visually heavy.

**[V2] Keyboard Accessibility:**
Nav items are `<Link>` elements, which are natively focusable. The `focus-visible:ring-2 focus-visible:ring-primary/30` style provides a visible focus indicator. However, there is no `tabIndex` management — all 18 items are in the tab order, which is a long tab sequence for keyboard users.
---

## 4.4 ShellHeader (`src/components/layout/header.tsx`)

> **[V2 Correction]** V1 described props as `{ onMenuClick, inset }`. Actual props are significantly different. V1 also described `h-16` height, `z-50`, and `LanguageSwitcher` in header — all incorrect.

### Props (Actual)
| Prop | Type | Purpose |
|------|------|---------|
| `navLocale` | `'ar' \| 'en'` | Current locale |
| `rtl` | `boolean` | RTL flag for back button rotation and text alignment |
| `sovereign` | `boolean` | Affects UserMenu variant |
| `pageTitle` | `string` | Computed page title |
| `kicker` | `string` | Uppercase kicker text above title |
| `showBack` | `boolean` | Show back button |
| `backHref` | `string \| null` | Back link destination |
| `backLabel` | `string` | Back button aria-label |
| `mobileNavOpen` | `boolean` | Controls menu/X icon toggle |
| `onToggleMobileNav` | `() => void` | Toggle mobile sidebar |
| `showWorkspaceSwitcher` | `boolean` | Show workspace switcher (false in sovereign) |
| `headerInset` | `ReactNode` | Content injected by nested components |

### Layout (Actual)
- Sticky top: `sticky top-0 z-[55]` (not `z-50`)
- **[V2 Correction]** Height: `min-h-[52px]` (not `h-16` which is 64px)
- Background: `bg-background/80 backdrop-blur-md`
- Border bottom: `border-b border-border`
- Flex column: `flex min-h-[52px] shrink-0 flex-col`
- Content row: `mx-auto flex min-h-[52px] w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10`

### Left Section (Start)
- Mobile: Menu button (`lg:hidden`) + Back button + Page title
- Desktop: Back button + Page title + Header inset (if any)
- Menu button: `h-8 w-8` on mobile, `sm:h-9 sm:w-9`, toggles `Menu`/`X` icon
- Back button: `h-8 w-8`, `variant="outline"`, `ArrowLeft` icon, RTL rotates 180°
- Title: `text-[15px] font-bold` mobile, `sm:text-[17px]`, truncated with `truncate`
- Kicker: `text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground`
- When `headerInset` present: title has `max-w-[10rem] sm:max-w-[14rem] lg:max-w-[18rem]`

### Right Section (End)

**[V2 Correction]** V1 said mobile hides GlobalSearch and DensityToggle. Actual code shows both are visible on mobile.

**Desktop actions (`hidden lg:flex`):**
- `GlobalSearch`
- `DensityToggle`
- `WorkspaceSwitcher` (if `showWorkspaceSwitcher`)
- `NotificationBell`
- `UserMenu` (variant: sovereign or workspace)

**Mobile actions (`flex lg:hidden`):**
- `GlobalSearch`
- `DensityToggle`
- `NotificationBell`
- `UserMenu`
- **[V2]** No `WorkspaceSwitcher` on mobile — users cannot switch workspaces from the header on mobile/tablet

### Header Inset
- Desktop: Rendered inline beside title in a scrollable container (`overflow-x-auto overscroll-x-contain`)
- Mobile: Rendered in a separate row below the main header row (`border-b border-border bg-muted/30 px-3 py-2`)
- The inset container has thin scrollbar styling: `[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1`

### [V2] UX Analysis — Header

**[V2] Missing Workspace Switcher on Mobile:**
The `WorkspaceSwitcher` is only rendered in `desktopActions` (`hidden lg:flex`). On mobile and tablet (< 1024px), users have no way to switch workspaces from the header. They must navigate to the overview page and use the switcher there, or use the sidebar (which also doesn't show the switcher). This is a significant mobile UX gap — workspace switching is a primary action for multi-workspace users.

**[V2] Header Height — 52px vs 64px:**
At `min-h-[52px]`, the header is 12px shorter than the typical `h-16` (64px) SaaS header. This saves vertical space for content but may feel cramped on desktop. The `py-2` padding adds 8px top and bottom, giving effective touch targets of ~44px which meets accessibility minimums.

**[V2] Title Truncation:**
The title uses `truncate` which clips long titles with an ellipsis. When `headerInset` is present, the title is further constrained to `max-w-[10rem]` on mobile (160px), `sm:max-w-[14rem]` (224px), `lg:max-w-[18rem]` (288px). This means long workspace names or page titles will be truncated, potentially hiding important context.

**[V2] Back Button RTL:**
The back button rotates 180° in RTL mode (`rtl && 'rotate-180'`), making `ArrowLeft` point right — which is the "back" direction in RTL layouts. This is correct behavior.

**[V2] Mobile Header Layout:**
On mobile, the header has: menu button | back button + title | search + density + bell + user menu. This is a lot of controls in a 52px height bar on a 375px wide screen. The `gap-1.5` (6px) between mobile actions is tight — touch targets may be close together, risking accidental taps.

**[V2] Header Inset Scroll:**
The desktop header inset uses `overflow-x-auto` with thin scrollbars, allowing horizontal scroll for wide toolbars (e.g., branch detail tabs). This is a good pattern for keeping the header single-line while accommodating variable-width content.
---

## 4.5 Breadcrumbs (`src/components/layout/breadcrumbs.tsx`)

### Behavior
- Client component using `usePathname()` and `useLocale()`
- Builds trail from pathname segments
- First crumb: "Home" → `/{locale}/overview`
- Last crumb: current page (no link)
- Middle crumbs: links to intermediate routes

### Special Routes
- **Admin routes:** Home → Admin → {section}
- **Branch routes:** Home → Branches → {branch name} (fetches branch name)
- **Branch playlist:** Home → Branches → {branch} → Playlists → {playlist}
- **Settings:** Home → Settings → {section}

### Rendering
```tsx
<nav aria-label={t('ariaLabel')} className="...">
  <ol className="flex items-center gap-1.5 text-sm">
    {crumbs.map((crumb, i) => (
      <li className="flex items-center gap-1.5">
        {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180" />}
        {crumb.href ? (
          <Link href={crumb.href} className="hover:text-foreground">{crumb.label}</Link>
        ) : (
          <span className="text-foreground font-medium">{crumb.label}</span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

### Placement
**[V2 Correction]** Rendered between header and main content, inside the main column div (after `lg:ms-[240px]` offset). Not inside the scrollable `<main>` — it's a sibling above it.

---

## 4.6 ShellLogo (`src/components/layout/shell-logo.tsx`)

### Behavior
- Picks logo URL based on: branding context, locale, and theme (dark/light)
- Falls back to static SVGs in `/public` if no branding asset
- Uses raw `<img>` tag (not `next/image`) because branding URLs are dynamic remote URLs
- Handles image load error: falls back to static asset
- Decorative: `alt=""` (empty alt text)

### Logo Resolution Priority
1. Branding context logo URL (locale + theme specific)
2. Static fallback: `/orca-logo-{locale}.svg` (light) or `/orca-logo-{locale}-dark.svg` (dark)

### Rendering
```tsx
<img
  src={logoUrl}
  alt=""
  className="h-8 w-auto"
  onError={() => setSrc(fallbackUrl)}
/>
```

---

## 4.7 BrandingContext (`src/components/branding-context.tsx`)

### Provider Behavior
- Fetches branding data from `GET /branding` API on mount
- Provides: `platformName`, `brandingEpoch`, logo URLs, asset availability flags
- Utility functions: `resolveLogoUrl(locale, theme)` — returns best logo URL based on locale and theme

### Context Value
| Field | Type | Purpose |
|-------|------|---------|
| `platformName` | `string` | Platform display name |
| `brandingEpoch` | `number` | Bumped when branding changes (cache busting) |
| `logoLightUrl` | `string \| null` | Light theme logo URL |
| `logoDarkUrl` | `string \| null` | Dark theme logo URL |
| `logoLightArUrl` | `string \| null` | Light theme Arabic logo URL |
| `logoDarkArUrl` | `string \| null` | Dark theme Arabic logo URL |
| `hasCustomBranding` | `boolean` | Whether custom branding is active |

### Fallback Strategy
If API fails or returns no branding, `hasCustomBranding` is `false` and all logo URLs are `null`, causing `ShellLogo` to use static SVGs.

---

## 4.8 ShellHeaderInsetContext (`src/components/layout/shell-header-inset-context.tsx`)

**[V2 Correction]** V1 described `useShellHeaderInset()` with `setInset`. Actual API uses `ShellHeaderInsetSetterContext` with a setter function provided as context value.

A React context that allows nested page components to inject content into the shell header. This enables pages to add custom action buttons or controls to the header bar.

### API (Actual)
```typescript
const setHeaderInset = useContext(ShellHeaderInsetSetterContext);
// Call setHeaderInset(<CustomActions />) to inject content
// Call setHeaderInset(null) to clear
```

The setter is a stable `useCallback` function. The inset is automatically cleared on pathname changes by `CrystalShell`'s `useEffect`.

---

## 4.9 WorkspaceGate (`src/features/workspace/workspace-gate.tsx`)

### Purpose
Wraps all shell page content. Controls what the user sees based on auth and workspace state.

### Logic Flow (Actual)
1. **Auth pages** (login, register in pathname): Pass through — no gating
2. **Not authenticated**: Pass through — let auth flow handle redirect
3. **Loading** (`isLoading === true`): Show centered `Loader2` spinner (`h-10 w-10 animate-spin text-primary`) with translated loading text
4. **Authenticated, no workspaces, not super-admin**: Show `WorkspaceWelcome`
5. **Super-admin on client route**: Toast info (`workspaceGate.impersonationHint`) and redirect to `/{locale}/overview`
6. **All other cases**: Render children

### Sovereign Mode Restriction (Actual)
The restricted route set (`CLIENT_ROUTE_SEGMENTS`): `media`, `screens`, `studio`, `playlists`, `schedules`, `team`, `branches`, `templates`, `ai`, `emergency`, `analytics`, `audit-log`, `notifications`, `api-docs`, `help`, `settings`.

When a super-admin navigates to any of these, a toast with id `'sovereign-client-route'` is shown and they're redirected to `/{locale}/overview` via `router.replace()`.

**[V2] UX Observation — Sovereign Mode Restriction:**
The restriction uses `toast.info()` with a fixed id `'sovereign-client-route'` — this means if the user triggers multiple redirects, only one toast is shown (deduplication). The toast uses the `workspaceGate.impersonationHint` translation key. The restriction is in a `useEffect`, not in the render path — meaning the client route content briefly renders before the redirect fires. This could cause a flash of content before the user is redirected.

**[V2] UX Observation — Loading State:**
The loading state uses `min-h-[calc(100vh-12rem)]` which accounts for header + breadcrumbs height. The spinner is `h-10 w-10` (40px) — larger than the sidebar skeleton spinner, providing visual weight. The text is `text-sm font-medium` — readable but not large.

**[V2] Edge Case — Auth Page Detection:**
The gate checks `pathname?.includes('/login') || pathname?.includes('/register')`. This uses `includes()` rather than exact path matching, which means any path containing these substrings (e.g., `/register-device`) would pass through without gating. This is a minor logic issue but unlikely to cause problems in practice.

---

## 4.10 AdminSectionShell

### Purpose
Wraps admin page content with consistent spacing. Used in `src/app/[locale]/(shell)/admin/layout.tsx`.

### Admin Layout Guard (`src/app/[locale]/(shell)/admin/layout.tsx`)
Server-side guard:
1. Calls `fetchAuthMeServer()` — checks httpOnly cookies against `/auth/me`
2. If not authenticated: redirect to `/login?returnTo=/{locale}/admin`
3. If not super-admin: redirect to `/overview`
4. If authorized: render `<AdminSectionShell>{children}</AdminSectionShell>`

---

## 4.11 PageTransition (`src/components/page-transition.tsx`)

Wraps page content with framer-motion animation:
- **Initial:** `opacity: 0, y: 8`
- **Animate:** `opacity: 1, y: 0`
- **Key:** `pathname` (re-animates on route change)
- **Transition:** Default framer-motion spring

**[V2] UX Observation — Page Transition:**
The 8px y-offset is subtle — enough to indicate movement without being distracting. The `mode="wait"` in `AnimatePresence` ensures the old page exits before the new page enters, preventing overlap. However, this adds a brief delay (exit animation + enter animation) on every navigation, which may feel slow on frequent navigations.

---

## 4.12 AuroraBackdrop (`src/components/aurora-backdrop.tsx`)

> **[V2 Correction]** V1 described this as part of the active shell. The `AuroraBackdrop` component exists in the codebase but is **not rendered** by `CrystalShell`. It may be used elsewhere or is a deprecated component.

Static decorative component rendering blurred orbs behind all content:
- Fixed position, `-z-10` (behind everything)
- `pointer-events-none` (non-interactive)
- Creates an ambient glow effect

---

## 4.13 ImpersonationReturnButton

Rendered when `impersonatedBySuperAdminId` is truthy in workspace context. Allows a super-admin to return to their admin session after impersonating a user. Rendered as a floating button inside the main column div (after `<main>`).

**[V2] UX Observation — Impersonation Return:**
The button is rendered as a sibling to `<main>`, not inside it. This means it stays visible even when the main content scrolls — it's positioned relative to the main column, not the scrollable content. This is the correct pattern for a persistent action button.

---

## 4.14 [V2] Responsive Layout Analysis

### Breakpoint Behavior

| Breakpoint | Sidebar | Header | Main Content |
|-----------|---------|--------|-------------|
| < 640px (sm) | Hidden, slide-in | Mobile layout: menu + title + 4 actions | `px-4 py-5` |
| 640px-1023px (sm-lg) | Hidden, slide-in | Mobile layout: menu + title + 4 actions | `sm:px-6 sm:py-8` |
| ≥ 1024px (lg) | Fixed, visible | Desktop layout: title + inset + 5 actions | `lg:px-10 lg:py-12` |

### [V2] Mobile UX Concerns

**[V2] No Workspace Switcher on Mobile:**
The workspace switcher is `hidden lg:flex` — completely absent on mobile. A user with multiple workspaces cannot switch from any page on mobile. They must go to overview and... the switcher is in the header there too, which is also hidden. This is a **critical mobile UX gap**.

**[V2] Header Touch Target Density:**
On a 375px wide screen, the mobile header contains: menu button (32px) + back button (32px, if shown) + title (truncated) + search (32px) + density (32px) + bell (32px) + user menu (32px). That's 6-7 controls in 375px, leaving ~15px for the title. The `gap-1.5` (6px) between action buttons is below the 8px minimum recommended for touch target spacing.

**[V2] Sidebar Slide Animation:**
The sidebar uses `transition-transform duration-300` — 300ms slide animation. This is within the 200-400ms sweet spot for UI animations. The RTL slide direction (`translate-x-full` for RTL, `-translate-x-full` for LTR) is correctly implemented.

### [V2] Desktop Layout Analysis

**[V2] Content Max Width:**
`max-w-[1600px]` with `mx-auto` centering. On displays wider than 1600px, content is centered with equal margins. This prevents text lines from becoming too long for comfortable reading (typically 50-75 characters per line).

**[V2] Content Padding Progression:**
`px-4` (16px) → `sm:px-6` (24px) → `lg:px-10` (40px). The padding increases proportionally with screen width, maintaining visual balance. The vertical padding follows a similar pattern: `py-5` → `sm:py-8` → `lg:py-12`.

### Cross-References
- See `03-routing-and-navigation.md` for navigation structure and IA analysis
- See `25-responsive-audit.md` for detailed responsive breakpoint analysis
- See `24-accessibility-audit.md` for keyboard navigation and screen reader considerations
- See `07-workspace-management.md` for workspace switcher behavior
