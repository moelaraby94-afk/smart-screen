# 12 — Frontend Architecture Rules

> **Status:** FINAL — Architecture constraints, state management, data flow

---

## 1. Purpose

Defines the architectural rules that govern the Cloud-Screen frontend. These rules ensure the application is scalable, maintainable, and consistent. Enforced by AI Constitution (Article VI).

---

## 2. Technology Stack

| Layer | Technology | Version | Evidence |
|-------|-----------|---------|----------|
| Framework | Next.js (App Router) | 14+ | `audits/frontend/01-architecture-and-stack.md` |
| Language | TypeScript | 5+ | — |
| Styling | Tailwind CSS | 3+ | `design-system-v2/44-design-tokens.md` |
| UI Components | Custom (Design System V2) | — | `design-system-v2/11-component-taxonomy.md` |
| Icons | Lucide React | Latest | `design-system-v2/05-iconography.md` |
| Animation | Framer Motion | Latest | `design-system-v2/07-motion-system.md` |
| Data Fetching | SWR | Latest | `product-architecture/13-frontend-state-boundaries.md` |
| Realtime | Socket.IO Client | Latest | `product-architecture/13-frontend-state-boundaries.md` |
| i18n | next-intl | Latest | `product-architecture/17-product-rules.md` PR-50 |
| Charts | Recharts | Latest | `design-system-v2/29-charts.md` |
| Canvas | Konva.js (react-konva) | Latest | `screen-specifications/06-studio-spec.md` |
| Testing | Jest + Testing Library | Latest | `21-testing-strategy.md` |
| E2E | Playwright | Latest | `21-testing-strategy.md` |

### §2.1 No Unauthorized Libraries
No library may be added without:
1. Documenting why it's needed
2. Verifying it doesn't duplicate existing functionality
3. Creating an ADR per `24-adr-process.md`

---

## 3. Application Architecture

### 3.1 Next.js App Router
- **App Router** (not Pages Router) — `app/` directory
- **Server Components** — default for pages
- **Client Components** — `'use client'` directive for interactive components
- **Route Groups** — `(auth)`, `(dashboard)`, `(admin)` for organization
- **Layouts** — nested layouts per route group
- **Loading** — `loading.tsx` for route-level loading states
- **Error** — `error.tsx` for route-level error boundaries
- **Not Found** — `not-found.tsx` for 404

### 3.2 Route Structure
```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    layout.tsx
  (dashboard)/
    overview/page.tsx
    screens/page.tsx
    screens/[id]/page.tsx
    screens/pair/page.tsx
    content/page.tsx
    content/playlists/[id]/page.tsx
    studio/[id]/page.tsx
    scheduling/page.tsx
    analytics/page.tsx
    team/page.tsx
    settings/page.tsx
    settings/[tab]/page.tsx
    notifications/page.tsx
    layout.tsx
  (admin)/
    admin/customers/page.tsx
    admin/staff/page.tsx
    admin/users/page.tsx
    admin/workspaces/page.tsx
    admin/fleet/page.tsx
    admin/health/page.tsx
    admin/logs/page.tsx
    admin/feature-flags/page.tsx
    layout.tsx
  error.tsx
  not-found.tsx
  layout.tsx
```

### 3.3 Client vs Server Components

| Component Type | When | Example |
|---------------|------|---------|
| Server Component | Static content, data fetching | Page layout, initial data load |
| Client Component | Interactive, state, events | Forms, dialogs, dropdowns, filters |

**Rule:** Default to Server Components. Use `'use client'` only when needed (state, events, browser APIs).

---

## 4. State Management Architecture

### 4.1 State Categories

| Category | Tool | Scope | Evidence |
|----------|------|-------|----------|
| Server State | SWR | Global (cache) | `product-architecture/13-frontend-state-boundaries.md` |
| Client State (local) | useState | Component | — |
| Client State (shared) | React Context | Feature/section | — |
| Realtime State | Socket.IO → SWR mutate | Global | `product-architecture/13-frontend-state-boundaries.md` |
| URL State | searchParams | Page | Filters, pagination, tabs |
| Form State | useState / react-hook-form | Form | `14-form-standards.md` |

### 4.2 State Rules

- **No Redux** — SWR + Context is sufficient for this application
- **No Zustand** — use Context for shared client state
- **SWR for all server data** — no raw fetch in components
- **Context for shared UI state** — sidebar collapsed, theme, locale
- **URL state for filters** — search, filter, sort, page in URL params
- **Form state local** — form state stays in form component or react-hook-form

### 4.3 Data Flow

```
API → SWR Cache → Component (render)
                    ↓
              User Action
                    ↓
              SWR Mutation
                    ↓
              API → SWR Revalidate → Component (re-render)
```

### 4.4 Realtime Data Flow

```
Socket.IO Event → Event Handler (hook) → SWR mutate (update cache) → Component (re-render)
```

---

## 5. Folder Architecture

### 5.1 Monorepo Structure
```
apps/
  dashboard/          ← Next.js application
    src/
      app/            ← Next.js App Router
      features/       ← Feature-based modules
      components/     ← Shared components
      hooks/          ← Shared hooks
      lib/            ← Utilities, API client
      types/          ← TypeScript types
      styles/         ← Global styles
      i18n/           ← Translations
  backend/            ← NestJS API (not in scope)
  marketing/          ← Marketing site (not in scope)
  player/             ← Player app (not in scope)
packages/
  ui/                 ← Design System V2 primitive + composite components
  config/             ← Shared configuration
```

### 5.2 Feature-Based Organization
```
src/features/
  screens/
    components/       ← Screen-specific domain components
    hooks/            ← Screen-specific hooks
    types.ts          ← Screen types
    api.ts            ← Screen API functions
  content/
    components/
    hooks/
    types.ts
    api.ts
  studio/
    components/
    hooks/
    types.ts
    api.ts
  scheduling/
    components/
    hooks/
    types.ts
    api.ts
  ...
```

### 5.3 Shared Components
```
src/components/
  layout/             ← App shell, sidebar, header
  navigation/         ← Breadcrumbs, pagination
  feedback/           ← Toast, error boundary
  providers/          ← Context providers
```

### 5.4 Design System Package
```
packages/ui/
  button/
    button.tsx
    index.ts
  input/
    input.tsx
    index.ts
  card/
    card.tsx
    index.ts
  ...
  index.ts            ← Barrel export
```

---

## 6. API Architecture

### 6.1 API Client
```typescript
// src/lib/api-client.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

### 6.2 SWR Hooks
```typescript
// src/features/screens/hooks/use-screens.ts
export function useScreens(params: ScreenQueryParams) {
  const query = buildQuery(params);
  const { data, error, isLoading, mutate } = useSWR<Screen[]>(
    `/screens${query}`,
    fetcher
  );
  return { screens: data, error, isLoading, mutate };
}
```

### 6.3 Mutation Hooks
```typescript
// src/features/screens/hooks/use-delete-screen.ts
export function useDeleteScreen() {
  const { trigger } = useSWRMutation(`/screens`, deleteScreen);
  return { deleteScreen: trigger };
}
```

### 6.4 API Rules
- **All API calls through hooks** — no direct `fetch` in components
- **Centralized fetcher** — single fetcher function for SWR
- **Typed responses** — all API responses typed with TypeScript interfaces
- **Error normalization** — `ApiError` class with status, message, details
- **No API URL construction in components** — use hook parameters

---

## 7. Authentication Architecture

### 7.1 Auth Flow
- **JWT tokens** — access token + refresh token
- **Token storage** — httpOnly cookies (server-side) or secure storage
- **Auth middleware** — Next.js middleware for route protection
- **Auth context** — React Context for current user
- **Role checks** — role-based access per route

### 7.2 Route Protection
| Route Group | Access | Evidence |
|------------|--------|----------|
| `(auth)/*` | Public (redirect if logged in) | `06-auth-flows.md` |
| `(dashboard)/*` | Authenticated (any role) | `06-auth-flows.md` |
| `(admin)/*` | Super-Admin only | `15-admin-flows.md` |

### 7.3 Role-Based UI
- **Sidebar items** — filtered by role (Admin section hidden for non-admins)
- **Settings tabs** — filtered by role (Billing hidden for non-owners)
- **Action buttons** — hidden/disabled based on permissions
- **Evidence:** `product-architecture/04-product-hierarchy.md`, `17-product-rules.md`

---

## 8. i18n Architecture

### 8.1 Setup
- **next-intl** — internationalization library
- **Locale routing** — `/en/...` and `/ar/...` URL prefixes
- **Translation files** — `src/i18n/en.json` and `src/i18n/ar.json`
- **Direction** — `dir="ltr"` for EN, `dir="rtl"` for AR

### 8.2 Translation Rules
- **No hardcoded strings** — all user-facing text uses translation keys
- **Translation key format** — `namespace.key` (e.g., `screens.title`, `common.save`)
- **No string concatenation** — use interpolation (`{name}` in translations)
- **Pluralization** — use ICU MessageFormat for plurals
- **Date/time** — locale-aware formatting
- **Numbers** — locale-aware formatting

---

## 9. Architecture Anti-Patterns

| Anti-Pattern | Why It's Bad | Correct Approach |
|--------------|-------------|-----------------|
| Pages Router | Outdated, no nested layouts | App Router |
| Redux | Overkill for this app | SWR + Context |
| CSS-in-JS | Runtime overhead, not token-based | Tailwind CSS |
| Direct fetch in components | No caching, no deduplication | SWR hooks |
| God components | Unmaintainable, untestable | Split into sub-components |
| Prop drilling > 2 levels | Hard to maintain | Context or SWR |
| Business logic in UI | Hard to test, hard to reuse | Extract to hooks/services |
| Circular imports | Runtime errors, build failures | Restructure dependencies |
| Mixed server/client logic | Hydration errors | Clear `'use client'` boundary |
| Unvalidated API responses | Runtime errors | TypeScript interfaces + runtime validation (zod) |

---

## Cross-References

- See `01-ai-constitution.md` Article VI for architecture rules
- See `11-code-quality-rules.md` for code quality
- See `13-component-creation-rules.md` for component creation
- See `27-folder-ownership.md` for folder rules
- See `28-file-ownership.md` for file rules
- See `product-architecture/13-frontend-state-boundaries.md` for state boundaries
- See `product-architecture/14-frontend-responsibilities.md` for responsibilities
- See `product-architecture/12-module-boundaries.md` for module boundaries
