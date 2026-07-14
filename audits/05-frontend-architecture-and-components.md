# Audit 05: Frontend Architecture & Components

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Dashboard frontend architecture, component design, state management, API client patterns

---

## 1. Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| Next.js | 15 (App Router) | SSR/SSG framework |
| React | 19 | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 4.x | Styling |
| next-intl | — | i18n (EN/AR) |
| framer-motion | — | Animations |
| lucide-react | — | Icons |
| sonner | — | Toast notifications |
| Radix UI | — | Headless UI primitives (dialog, dropdown, alert-dialog) |

---

## 2. Route Structure

### 2.1 App Router Layout

```
app/[locale]/
├── layout.tsx              # Root locale layout (next-intl provider)
├── (auth)/                 # Unauthenticated auth routes
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── invite/page.tsx
├── (shell)/                # Authenticated routes
│   ├── layout.tsx          # CrystalShell wrapper
│   ├── error.tsx           # Error boundary
│   ├── loading.tsx         # Loading skeleton
│   ├── overview/page.tsx   # Dashboard home
│   ├── screens/            # Screen management (2 pages)
│   ├── media/              # Media library
│   ├── studio/             # Creative studio
│   ├── playlists/          # Playlist management
│   ├── schedules/          # Schedule management
│   ├── team/               # Team management
│   ├── billing/            # Billing page
│   ├── branches/           # Multi-branch (3 pages)
│   ├── settings/           # Settings (3 pages: profile, workspace, billing)
│   ├── admin/              # Super admin (16 sub-routes)
│   ├── notifications/      # Notification center
│   ├── analytics/          # Analytics
│   ├── audit-log/          # Audit log viewer
│   ├── api-docs/           # API documentation
│   ├── help/               # Help & support
│   ├── emergency/          # Emergency override
│   ├── content/            # Content library
│   ├── templates/          # Content templates
│   ├── proof-of-play/      # PoP reports
│   ├── campaigns/          # Campaign management
│   ├── ai/                 # AI tools
│   └── displays/           # Display groups (2 pages)
├── error.tsx               # Locale-level error boundary
└── not-found.tsx           # 404 page
```

### 2.2 Route Issues

1. **Many stub pages**: `ai/`, `analytics/`, `audit-log/`, `api-docs/`, `help/`, `content/`, `templates/`, `proof-of-play/`, `campaigns/`, `emergency/` — these routes exist but their feature completeness varies. Some may be placeholder pages.

2. **No dynamic routes for screens**: `screens/` has 2 pages (likely list + detail), but the detail page should be `[screenId]/page.tsx` for proper routing. Need to verify.

3. **Admin section depth**: 16 sub-routes under `admin/` — this is a large section. The navigation structure needs to be carefully managed to avoid confusion.

---

## 3. State Management

### 3.1 Workspace Context (`workspace-context.tsx`)

The central state management pattern is a React Context (`useWorkspace`) that provides:
- `workspaceId`, `workspaces`, `setWorkspaceId`
- `isAuthenticated`, `isLoading`, `isSuperAdmin`
- `impersonatedBySuperAdminId`
- `workspaceDataEpoch` (for triggering data refreshes)
- `bumpWorkspaceDataEpoch`

**Issues:**
1. **Single context for everything**: The workspace context manages auth state, workspace selection, and data refresh signaling. Splitting into separate contexts (auth, workspace, refresh) would improve re-render performance.
2. **No reducer pattern**: State mutations are via `setState` calls scattered across the component. A reducer would centralize state logic.
3. **`workspaceDataEpoch` hack**: Using a counter to trigger data refreshes is a workaround. A more explicit `refresh()` callback or SWR/React Query would be cleaner.

### 3.2 Data Fetching Pattern

The app uses a **manual fetch pattern**:
```typescript
const load = useCallback(async () => {
  setLoading(true);
  try {
    const res = await fetchXxx(workspaceId);
    if (!res.ok) { toast.error(...); return; }
    const data = await res.json();
    setData(data);
  } catch {
    toast.error(...);
  } finally {
    setLoading(false);
  }
}, [workspaceId]);

useEffect(() => { void load(); }, [load]);
```

**Issues:**
1. **No SWR/React Query**: Every component manages its own loading/error state. This leads to:
   - No request deduplication
   - No automatic retry
   - No background revalidation
   - No optimistic updates
   - Verbose, repetitive code

2. **No global error interceptor**: Each `load` function handles errors individually. The `useApiErrorToast` hook helps but must be called manually.

3. **Race conditions**: `useCallback` + `useEffect` pattern can cause race conditions if `workspaceId` changes rapidly. The `cancelled` flag pattern (seen in `AdminOverview`) is applied inconsistently.

### 3.3 API Client Pattern

All API calls go through `apiFetch` (from `@/features/auth/session`):
```typescript
export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  // Adds Authorization header, credentials, base URL
}
```

**Strengths:**
- Centralized auth header injection ✅
- Cookie-based auth with credentials ✅
- Consistent base URL ✅

**Issues:**
1. **Returns raw `Response`**: Callers must manually check `res.ok`, parse JSON, handle errors. A typed wrapper returning `{ data, error }` would be safer.
2. **No request interceptors**: Can't globally handle 401 (token refresh), 429 (rate limit), etc.
3. **No response typing**: All JSON parsing is `as SomeType` — no runtime validation.

---

## 4. Component Design

### 4.1 UI Primitives (`components/ui/`)

| Component | Based On | Quality |
|-----------|---------|---------|
| button.tsx | Custom | ✅ Has variants (default, outline, ghost, cta, destructive) |
| card.tsx | Custom | ✅ Clean surface styling |
| dialog.tsx | Radix Dialog | ✅ Accessible |
| alert-dialog.tsx | Radix AlertDialog | ✅ Accessible |
| dropdown-menu.tsx | Radix DropdownMenu | ✅ Accessible |
| input.tsx | Custom | ✅ Styled input |
| label.tsx | Custom | ✅ Form label |
| badge.tsx | Custom | ✅ Status badges |
| table.tsx | Custom | ✅ Data table |
| empty-state.tsx | Custom | ✅ Empty state placeholder |
| info-tooltip.tsx | Custom | ✅ Help tooltips |

**Issues:**
1. **Missing components**: No `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Tabs`, `Toast`, `Skeleton`, `Progress`, `Tooltip` primitives. These are likely styled inline in feature components, leading to inconsistency.
2. **No `textarea` component**: Text areas are likely raw `<textarea>` elements.
3. **No `form` abstraction**: No `Form`, `FormField`, `FormControl` pattern — forms are built with raw state management.

### 4.2 Layout Components

- **`CrystalShell`**: Main layout with sidebar, header, breadcrumbs, and content area ✅
- **`ShellSidebar`**: Navigation with admin/client sections, workspace switcher ✅
- **`ShellHeader`**: Top bar with page title, back button, workspace switcher ✅
- **`Breadcrumbs`**: Route-based breadcrumbs ✅
- **`PageTransition`**: Framer Motion page transitions ✅

### 4.3 Feature Components

Each feature folder contains its own components, API clients, and types. This is a good organizational pattern.

**Issues:**
1. **No barrel exports**: Features don't have `index.ts` barrel files. Every import is a deep path (`@/features/islamic/prayer-times-widget`). Barrel exports would clean up imports.
2. **Inconsistent file naming**: Mix of `kebab-case` and `PascalCase` in filenames.
3. **Large component files**: `client-home-dashboard.tsx` (287 lines), `ramadan-settings-panel.tsx` (309 lines), `workspace-settings-client.tsx` (200+ lines) — these could be decomposed.

---

## 5. Styling

### 5.1 ORCA Design System

The project uses a custom "ORCA" design system defined in `globals.css`:
- Blue-600 primary color
- Gray neutral surfaces
- Clean card-based layout
- Dark mode support
- Custom CSS variables for theming

### 5.2 TailwindCSS v4

- `@import 'tailwindcss'` (v4 syntax)
- Custom CSS variables mapped to Tailwind theme
- `vc-card-surface`, `vc-page-kicker`, `vc-scrollbar` custom utility classes
- `font-mono-nums` for tabular numbers

### 5.3 Styling Issues

1. **Invalid Tailwind classes (fixed)**: `h-4.5 w-4.5` were replaced with `h-[18px] w-[18px]` in the audit ✅
2. **No Tailwind config visible**: v4 uses CSS-based config, but no `tailwind.config.ts` found. This is correct for v4 but may limit IDE autocomplete.
3. **Inconsistent dark mode**: Some components use `dark:` variants, others rely on CSS variables. The CSS variable approach is cleaner but requires all components to use semantic colors.

---

## 6. Error Handling

### 6.1 Error Boundaries

- **Locale-level**: `app/[locale]/error.tsx` ✅
- **Shell-level**: `app/[locale]/(shell)/error.tsx` ✅
- **No per-page error boundaries**: Individual pages don't have error boundaries. A crash in one page section crashes the entire shell.

### 6.2 Error Display

- **Toast notifications** via `sonner` ✅
- **`useApiErrorToast`** hook for consistent API error display ✅
- **Inline error states** in some components (e.g., `AdminOverview` shows error text) ✅
- **404 page** with locale-aware messaging ✅

### 6.3 Error Handling Issues

1. **No global error reporting**: No Sentry integration on the frontend (only backend has Sentry).
2. **Silent failures**: Some `catch` blocks only log to console without user feedback.
3. **No error retry**: Error boundaries show "Try again" button but don't implement exponential backoff.

---

## 7. Performance

### 7.1 Code Splitting

- App Router provides automatic route-level code splitting ✅
- `dynamic()` imports not widely used — could help with heavy components (e.g., creative studio)
- No visible `React.lazy` usage

### 7.2 Data Fetching

- No SSR data fetching visible — all data fetching is client-side with `useEffect`
- No `loading.tsx` Suspense boundaries beyond the shell-level one
- No prefetching of data for likely navigation paths

### 7.3 Bundle Size

- framer-motion adds ~50KB gzipped — used for page transitions and card animations
- lucide-react imports are tree-shakeable ✅
- No bundle analysis configured

### 7.4 Performance Issues

1. **No SSR data fetching**: All pages are client-rendered after initial load. This means:
   - No SEO (not critical for a dashboard app)
   - Slower first contentful paint
   - No streaming SSR

2. **No image optimization**: Media files served as-is from backend. No `next/image` optimization for media previews.

3. **Full workspace data on dashboard**: `ClientHomeDashboard` fetches all branches with insights in one call. For workspaces with many branches, this could be slow.

---

## 8. Identified Issues

### High
1. **No SWR/React Query**: Manual data fetching leads to code duplication, race conditions, and missing features (retry, dedup, background refresh).
2. **No global error reporting (Sentry)**: Frontend errors are only logged to console.
3. **Missing UI primitives**: No Select, Switch, Checkbox, Tabs, Skeleton — leads to inconsistent UI.
4. **Race conditions in data fetching**: `cancelled` flag pattern applied inconsistently.

### Medium
1. **Workspace context does too much**: Auth, workspace, and refresh state in one context causes unnecessary re-renders.
2. **No barrel exports**: Deep import paths are verbose and fragile.
3. **No per-page error boundaries**: Section crashes take down the whole page.
4. **No image optimization**: Media previews use raw `<img>` instead of `next/image`.
5. **Large component files**: Several components exceed 200+ lines and should be decomposed.

### Low
1. **No bundle analysis**: Can't identify bloat without `@next/bundle-analyzer`.
2. **No Tailwind config for IDE autocomplete**: v4 CSS-based config may not be recognized by all IDE extensions.
3. **Inconsistent file naming**: Mix of kebab-case and PascalCase.

---

## 9. Strengths

- Clean App Router structure with route groups
- ORCA design system with consistent theming
- Dark mode support via CSS variables
- Accessible UI primitives (Radix-based)
- Framer Motion for smooth transitions
- Centralized API client with auth header injection
- `useApiErrorToast` for consistent error display
- Locale-aware 404 and error pages
- Skip-to-content link for accessibility
- Responsive sidebar with mobile drawer

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Corrections:**
- §6.3 / §8-High "No global error reporting (Sentry) on the frontend" → **FALSE.** The
  dashboard ships `@sentry/nextjs` with `sentry.client.config.ts`, `sentry.server.config.ts`
  and `src/instrumentation.ts`. Sentry is wired. (Open follow-up: confirm the error
  boundaries actually `captureException` — see file 15 §1.2.)
- §8 implies effectively no frontend tests → the dashboard **does** have tests
  (`features/auth/session.test.ts`, `features/screens/hooks/use-screen-actions.test.ts`).
  Coverage is *thin*, not zero (see file 00 C3).

**Confirmed-true (keep):** no SWR/React Query (manual `useEffect` fetch pattern), missing UI
primitives (Select/Switch/Tabs/Skeleton), no barrel exports, large component files
(verified: `home-dashboard-sections.tsx` 469 lines, `client-home-dashboard.tsx` 262).

**Reminder:** this is Next 15 / React 19 / Tailwind 4 — read `apps/dashboard/AGENTS.md` and
local docs before refactoring (file 13 §3).
