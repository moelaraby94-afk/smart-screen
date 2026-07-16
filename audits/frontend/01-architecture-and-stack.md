# 01 — Frontend Architecture & Technology Stack

> **Source basis:** `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `components.json`, `middleware.ts`, project directory structure  

---

## 1.1 Framework & Runtime

| Property | Value | Source |
|----------|-------|--------|
| Framework | Next.js 16 | `package.json` → `next: "16.0.0"` |
| React | React 19 | `package.json` → `react: "19.2.0"` |
| Node engine | Not pinned in dashboard `package.json` | — |
| Package manager | npm workspaces | root `package.json` |
| Module system | ESM (`"type": "module"` implied by `.mjs` configs) | — |

### Next.js Configuration (`next.config.ts`)

- **React Strict Mode:** Enabled (`reactStrictMode: true`)
- **Typed Routes:** Enabled (`experimental.typedRoutes: true`) — provides compile-time route type safety
- **External packages:** `konva` and `react-konva` are externalized for server-side compatibility
- **Security headers:** Strict Content-Security-Policy with frame-ancestors restricted to self, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denying camera/microphone/geolocation
- **i18n plugin:** `next-intl/plugin` registered
- **Sentry:** Integrated conditionally — only active if `SENTRY_DSN` environment variable is set. Uses `@sentry/nextjs` for both build-time and runtime error capture.
- **Images:** No `next/image` optimization config; `ShellLogo` uses raw `<img>` tags due to dynamic remote URLs from branding API

### TypeScript Configuration (`tsconfig.json`)

- **Target:** ES2017
- **Strict mode:** Enabled (`strict: true`)
- **JSX:** `react-jsx` (automatic runtime)
- **Path alias:** `@/*` → `./src/*`
- **Module resolution:** `bundler`
- **Includes:** `src` directory only
- **Excludes:** `node_modules`, `**/*.test.ts`, `**/*.test.tsx`, e2e tests

### Tailwind Configuration (`tailwind.config.ts`)

- **Content scan:** `./src/**/*.{ts,tsx}`
- **Dark mode:** `class` strategy (toggled via `.dark` class on `<html>`)
- **Custom colors:** `brand-orange` (with 50–950 shades), `brand-navy` (with 50–950 shades)
- **No custom breakpoints** — uses Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)

### shadcn/ui Configuration (`components.json`)

- **RSC support:** Enabled (`"rsc": true`)
- **Style:** Default shadcn style
- **Icon library:** lucide-react
- **Aliases:** `@/components`, `@/components/ui`, `@/lib`, `@/components/ui` for components, `@/lib` for utils

---

## 1.2 Project Directory Structure

```
apps/dashboard/
├── src/
│   ├── app/                          # Next.js app router
│   │   ├── globals.css               # Global styles + ORCA design tokens
│   │   ├── layout.tsx                # Root layout (locale detection, theme, fonts)
│   │   ├── page.tsx                  # Root page (redirect to locale)
│   │   ├── not-found.tsx             # Root 404
│   │   ├── [locale]/
│   │   │   ├── layout.tsx            # Locale layout (providers tree)
│   │   │   ├── not-found.tsx         # Locale 404
│   │   │   ├── error.tsx             # Locale error boundary
│   │   │   ├── (auth)/               # Auth route group
│   │   │   │   ├── layout.tsx        # Auth layout (centered card)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   ├── invite/page.tsx
│   │   │   │   ├── privacy/page.tsx
│   │   │   │   └── terms/page.tsx
│   │   │   └── (shell)/              # Shell route group (authenticated)
│   │   │       ├── layout.tsx        # Shell layout (BrandingProvider + CrystalShell)
│   │   │       ├── page.tsx          # Home/overview
│   │   │       ├── loading.tsx       # Shell loading state
│   │   │       ├── error.tsx         # Shell error boundary
│   │   │       ├── overview/page.tsx
│   │   │       ├── screens/page.tsx
│   │   │       ├── screens/[screenId]/page.tsx
│   │   │       ├── playlists/page.tsx
│   │   │       ├── media/page.tsx
│   │   │       ├── schedules/page.tsx
│   │   │       ├── analytics/page.tsx
│   │   │       ├── studio/page.tsx
│   │   │       ├── templates/page.tsx
│   │   │       ├── ai/page.tsx
│   │   │       ├── emergency/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       ├── audit-log/page.tsx
│   │   │       ├── api-docs/page.tsx
│   │   │       ├── help/page.tsx
│   │   │       ├── team/page.tsx
│   │   │       ├── branches/page.tsx
│   │   │       ├── billing/page.tsx              → redirect to /settings/billing
│   │   │       ├── content/page.tsx              → redirect to /media
│   │   │       ├── displays/page.tsx             → redirect to /screens
│   │   │       ├── campaigns/page.tsx            → redirect to /schedules
│   │   │       ├── proof-of-play/page.tsx        → redirect to /analytics
│   │   │       ├── settings/
│   │   │       │   ├── profile/page.tsx
│   │   │       │   ├── workspace/page.tsx
│   │   │       │   └── billing/page.tsx
│   │   │       └── admin/
│   │   │           ├── layout.tsx                # Admin guard (super-admin only)
│   │   │           ├── admin-section-shell.tsx
│   │   │           ├── page.tsx
│   │   │           ├── customers/page.tsx
│   │   │           ├── customers/[id]/page.tsx
│   │   │           ├── customers/[id]/workspace/[wsId]/page.tsx
│   │   │           ├── staff/page.tsx
│   │   │           ├── users/page.tsx
│   │   │           ├── workspaces/page.tsx
│   │   │           ├── fleet/page.tsx
│   │   │           ├── screens/page.tsx
│   │   │           ├── stats/page.tsx
│   │   │           ├── logs/page.tsx
│   │   │           ├── settings/page.tsx
│   │   │           ├── feature-flags/page.tsx
│   │   │           └── billing/page.tsx          → redirect to /settings/billing
│   ├── components/
│   │   ├── ui/                       # Reusable UI primitives (shadcn pattern)
│   │   ├── layout/                   # Shell layout components
│   │   ├── admin/                    # Admin-specific components
│   │   ├── *.tsx                     # Shared components (theme, toaster, etc.)
│   ├── features/                     # Feature modules (domain-driven)
│   │   ├── dashboard/
│   │   ├── screens/
│   │   ├── playlists/
│   │   ├── media/
│   │   ├── schedules/
│   │   ├── branches/
│   │   ├── studio/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── workspace/
│   │   ├── admin/
│   │   ├── team/
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── billing/
│   │   ├── api/
│   │   ├── api-docs/
│   │   ├── audit-log/
│   │   ├── help/
│   │   ├── onboarding/
│   │   ├── islamic/
│   │   └── search/
│   ├── i18n/                         # Internationalization
│   │   ├── routing.ts
│   │   ├── request.ts
│   │   ├── fallback.ts
│   │   ├── time-zone.ts
│   │   └── messages/                 # Translation JSON files
│   ├── lib/                          # Shared utilities
│   │   ├── utils.ts                  # cn() class merge
│   │   ├── server-auth.ts            # Server-side auth
│   │   ├── shell-header-meta.ts      # Header title/back logic
│   │   ├── icon-stroke.ts            # Constant ICON_STROKE = 1.5
│   │   ├── dev-log.ts                # Dev-only logging
│   │   ├── countries.ts              # Country list with flags/dial codes
│   │   └── admin-glass-table.ts      # Admin table style tokens
│   └── middleware.ts                 # next-intl locale middleware
├── public/                           # Static assets (logos, icons)
├── e2e/                              # E2E tests (Playwright)
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── components.json
├── eslint.config.mjs
└── next-env.d.ts
```

---

## 1.3 Provider Tree (Component Hierarchy)

The provider nesting order, from outermost to innermost, as defined in the locale layout:

```
<html> (root layout: fonts, theme class, locale detection script)
  └── <body>
      └── ThemeProvider (next-themes, light default, no system)
          └── [locale]/layout.tsx
              ├── DocumentLocaleRoot (syncs html lang/dir)
              ├── IntlErrorHandlingProvider (next-intl with fallback)
              │   ├── SwrProvider (global SWR config)
              │   │   ├── WorkspaceProvider (workspace context + Socket.IO bridge)
              │   │   │   ├── NotificationProvider (notifications + Socket.IO)
              │   │   │   │   ├── (auth) routes → AuthLayout → centered card
              │   │   │   │   └── (shell) routes → ShellLayout
              │   │   │   │       ├── BrandingProvider (branding context)
              │   │   │   │       └── CrystalShell (sidebar + header + main)
              │   │   │   │           ├── ShellSidebar
              │   │   │   │           ├── ShellHeader
              │   │   │   │           ├── Breadcrumbs
              │   │   │   │           ├── WorkspaceGate
              │   │   │   │           ├── PageTransition (framer-motion)
              │   │   │   │           └── {children} (page content)
              │   │   │   └── AppToaster (sonner, position by locale)
```

---

## 1.4 Environment Variables

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Client + Server | API base URL, defaults to `http://localhost:4000/api/v1` |
| `INTERNAL_API_BASE_URL` | Server only | Docker-internal API URL (falls back to `NEXT_PUBLIC_API_BASE_URL`) |
| `NEXT_PUBLIC_REALTIME_URL` | Client | Socket.IO server URL, defaults to `http://localhost:4000` |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | Client | Enables dev login button on auth pages |
| `SENTRY_DSN` | Server | Sentry error tracking DSN (optional) |
| `NODE_ENV` | Both | Standard Node environment |

### API Base URL Resolution Logic

**Client-side** (`session.ts:getApiBaseUrl()`):
1. `NEXT_PUBLIC_API_BASE_URL` trimmed, or fallback to `http://localhost:4000/api/v1`
2. Trailing slashes stripped

**Server-side** (`server-auth.ts`):
1. `INTERNAL_API_BASE_URL` trimmed (Docker service hostname)
2. Falls back to `NEXT_PUBLIC_API_BASE_URL` trimmed
3. Falls back to `http://localhost:4000/api/v1`
4. Trailing slashes stripped
5. Uses `||` not `??` because empty string in `.env.example` must not win

---

## 1.5 Build Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `next dev` | Development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Production server |
| `lint` | `next lint` | ESLint |
| `test` | `vitest run` | Unit tests |
| `test:watch` | `vitest` | Unit tests watch mode |
| `e2e` | `playwright test` | E2E tests |

---

## 1.6 Key Dependencies

### Core UI
- `react@19.2.0`, `react-dom@19.2.0`
- `next@16.0.0`
- `tailwindcss@3.4.17` (v3, not v4)
- `class-variance-authority@0.7.1` — variant management for Button, Badge
- `clsx@2.1.1` + `tailwind-merge@3.3.1` — class merging via `cn()`
- `lucide-react@0.544.0` — icon library

### Radix UI Primitives
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-label`
- `@radix-ui/react-select`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`

### Animation & Feedback
- `framer-motion@12.23.27` — page transitions, hero animations, modal animations
- `sonner@2.0.99` — toast notifications

### Internationalization
- `next-intl@4.4.0` — locale routing, translations, server/client translation hooks

### Theming
- `next-themes@0.4.6` — dark/light theme management

### Data & Realtime
- `swr@2.3.6` — data fetching (global provider with custom config)
- `socket.io-client@4.8.1` — realtime updates

### Canvas
- `konva@9.3.22` + `react-konva@19.0.6` — studio canvas editor

### Error Tracking
- `@sentry/nextjs@10.18.0` — error capture (conditional on DSN)

### Utilities
- `next` (typed routes)
- `zod` — form validation (used in registration)

---

## 1.7 [V2] UX Analysis — Architecture & Stack

### Technology Choices — HCI Implications

**[V2] Next.js 16 App Router — Server/Client Split:**
The app uses Next.js 16 App Router with a clear server/client component split:
- Server components: Layout guards (admin), locale layout, root layout
- Client components: CrystalShell, all feature components, all interactive UI

This split is architecturally sound but has UX implications:
- Server-side auth checks (admin guard) block page render until API responds — no streaming
- Client-side auth checks (WorkspaceGate) show loading state while checking
- The dual-layer auth check (server + client) provides defense in depth but adds latency

**[V2] React 19 — Concurrent Features:**
React 19 enables concurrent rendering, but the app doesn't use `useTransition` or `useDeferredValue` for expensive operations. The canvas editor (Konva) and large lists could benefit from concurrent rendering to keep the UI responsive.

**[V2] Tailwind CSS v3 (not v4):**
The app uses Tailwind v3.4.17, not v4. This is the correct choice for stability — v4 is a major rewrite with breaking changes. The logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) are fully supported in v3.

**[V2] SWR Global Config:**
The SWR global config disables `revalidateOnFocus` and `errorRetryCount`. This is a deliberate choice to reduce API calls, but it means:
- Dashboard data may be stale after tab switching
- Failed API calls don't auto-retry
- Realtime updates rely entirely on Socket.IO

**[V2] Socket.IO — WebSocket Only:**
`transports: ['websocket']` — no polling fallback. This is optimized for performance but fails silently on networks that block WebSocket (corporate proxies, some public Wi-Fi). See `07-workspace-management.md` V2 for details.

**[V2] Konva for Canvas Editor:**
Konva is a 2D canvas library used for the Playlist Studio. It provides:
- Layer-based rendering (supports z-index, grouping)
- Transform controls (resize, rotate, move)
- Event system (click, drag, transform)
- Export to image (for playlist thumbnails)

Konva is a good choice for a canvas editor — it's more performant than DOM-based editors for complex scenes. However, it's not accessible (canvas content is not in the DOM, screen readers can't access it). This is an inherent limitation of canvas-based editors.

**[V2] framer-motion — Animation Strategy:**
The app uses framer-motion for:
- Page transitions (opacity + y-offset)
- Hero/dashboard entrance animations
- Onboarding wizard step transitions (RTL-aware)
- Theme toggle icon morphing
- Global search modal entrance

The animations are subtle and purposeful — not decorative. The 8px y-offset for page transitions is within the "subtle" range (4-12px). The custom easing `[0.22, 1, 0.36, 1]` is a standard "ease-out-quint" curve that feels natural.

### Provider Stack — Architecture Review

**[V2] Provider Nesting Order:**
```
ThemeProvider → LocaleProvider → SWRConfig → NotificationProvider →
BrandingProvider → WorkspaceProvider → CrystalShell
```

The nesting order is important:
- `ThemeProvider` must be outermost (affects all rendered components)
- `LocaleProvider` must be above all components that use translations
- `SWRConfig` must be above all data-fetching components
- `NotificationProvider` must be above the shell (bell badge needs notification state)
- `BrandingProvider` must be above the shell (logo needs branding data)
- `WorkspaceProvider` must be above the shell (sidebar, header, gate need workspace state)

This order is correct — each provider's dependencies are above it.

**[V2] Context Performance:**
All providers use React Context, which means any context value change triggers re-renders of all consumers. The `WorkspaceProvider` is the most impactful — workspace changes trigger re-renders of sidebar, header, gate, and all page content. The `useCallback` for `setWorkspaceId` and `bumpWorkspaceDataEpoch` prevents unnecessary re-renders from function identity changes.

### [V2] Build & Deployment Architecture

**[V2] Docker-Based Deployment:**
The app runs in Docker containers:
- `db` (PostgreSQL on port 5433)
- `backend` (NestJS on port 4000)
- `dashboard` (Next.js on port 3000)

The Docker setup uses `docker-compose.yml` for orchestration. The Next.js app is built with `next build` and served with `next start` in production.

**[V2] No CDN for Static Assets:**
The app serves static assets (SVGs, fonts) from `/public` directly. There is no CDN configuration. For production deployment, a CDN (e.g., Vercel Edge, Cloudflare) would improve asset delivery performance.

### Cross-References
- See `04-layout-and-shell.md` for provider rendering and shell architecture
- See `06-auth-and-session.md` for server/client auth split
- See `07-workspace-management.md` for WorkspaceProvider details
- See `10-playlists-and-studio.md` for Konva canvas editor
- See `23-error-handling-and-states.md` for Sentry integration
