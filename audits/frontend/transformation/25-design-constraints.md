# Design Constraints

> **Evidence basis:** All V1/V2 audit files, transformation documents 00–24, source code review
> **Purpose:** Document every constraint that bounds the design and implementation — what MUST NEVER be broken during redesign

---

## Constraint Documentation Convention

Each constraint is documented with:
- **Constraint ID** — Category-specific prefix + number (e.g., `TC-01`, `BC-01`, `AC-01`). See `28-documentation-index.md` §5.2 for the full prefix list. Not to be confused with problem IDs `C-001` through `C-004` in `02-problem-map.md`.
- **Category** — which constraint category it belongs to
- **Constraint** — what must be true
- **Rationale** — why it exists
- **Evidence** — audit files or source code
- **Must never be broken** — explicit statement of what must not happen
- **Related decisions** — design decision IDs from `24-design-decisions.md`
- **Related problems** — problem IDs from `02-problem-map.md`

---

## 1. Technical Constraints

### TC-01: Next.js App Router

| Field | Value |
|-------|-------|
| **Constraint** | The application must use Next.js App Router (`app/` directory) with server and client components. No migration to Pages Router. |
| **Rationale** | App Router is the current and future direction of Next.js. Server components enable SSR, streaming, and reduced client bundle. |
| **Evidence** | `01-architecture-and-stack.md` §1.2 |
| **Must never be broken** | Do not create pages in `pages/` directory. Do not use `getServerSideProps` or `getStaticProps`. Use server components by default, `'use client'` only when needed. |
| **Related decisions** | DD-16, DD-17 |
| **Related problems** | None |

### TC-02: React 19

| Field | Value |
|-------|-------|
| **Constraint** | The application must use React 19. No downgrade to React 18. |
| **Rationale** | React 19 provides concurrent features, server components support, and `use()` hook. |
| **Evidence** | `01-architecture-and-stack.md` §1.2 |
| **Must never be broken** | Do not install React 18 alongside React 19. Do not use React 18-only APIs. |
| **Related decisions** | None |
| **Related problems** | None |

### TC-03: Tailwind CSS v3 with Logical Properties

| Field | Value |
|-------|-------|
| **Constraint** | All styling must use Tailwind CSS v3 utility classes. RTL must use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) or `rtl:` variants. No physical properties (`left`, `right`, `ml-`, `mr-`) for directional layout. |
| **Rationale** | Logical properties automatically flip in RTL mode. Physical properties do not, causing RTL bugs (as seen in P-001). |
| **Evidence** | `22-i18n-and-localization.md` §22.8; P-001 (Switch RTL bug caused by `translate-x`) |
| **Must never be broken** | Do not use `left`, `right`, `ml-`, `mr-`, `pl-`, `pr-` for directional layout. Use `start-`, `end-`, `ms-`, `me-`, `ps-`, `pe-` instead. Exception: `translate-x` must use `rtl:` variant or be avoided. |
| **Related decisions** | DD-10, DD-17 |
| **Related problems** | P-001 |

### TC-04: SWR for Server State

| Field | Value |
|-------|-------|
| **Constraint** | All server state must be managed through SWR. No direct `fetch` calls in components without SWR wrapping. No Redux, Zustand, or React Query. |
| **Rationale** | SWR provides caching, deduplication, revalidation, and error handling. Direct fetch calls bypass these features. |
| **Evidence** | `01-architecture-and-stack.md` §1.7; `16-state-strategy.md` §3.1 |
| **Must never be broken** | Do not call `fetch()` directly in components. Wrap all data fetching in SWR hooks (`useSWR`, `useSWRMutation`). |
| **Related decisions** | DD-16 |
| **Related problems** | None |

### TC-05: Radix UI for Interactive Primitives

| Field | Value |
|-------|-------|
| **Constraint** | All interactive UI primitives (Dialog, Dropdown, Select, Tooltip, Popover, etc.) must use Radix UI. No custom implementations of interactive primitives. |
| **Rationale** | Radix handles accessibility, keyboard navigation, focus management, and ARIA. Custom implementations risk WCAG non-compliance. |
| **Evidence** | `01-architecture-and-stack.md` §1.6; P-005 (custom InfoTooltip accessibility gap) |
| **Must never be broken** | Do not build custom Dialog, Dropdown, Select, Tooltip, Popover, Tabs, Checkbox, Switch, or Label components. Use Radix-based wrappers. |
| **Related decisions** | DD-05, DD-14 |
| **Related problems** | P-005 |

### TC-06: Konva for Canvas Editor

| Field | Value |
|-------|-------|
| **Constraint** | The Playlist Studio canvas editor must use Konva. No migration to HTML5 Canvas, Fabric.js, or other canvas libraries during this transformation. |
| **Rationale** | Konva is deeply integrated with the Studio's state management. Migrating would require a full rewrite (R-11). |
| **Evidence** | `01-architecture-and-stack.md` §1.6; `10-playlists-and-studio.md` §10.12; `17-risk-analysis.md` R-11 |
| **Must never be broken** | Do not replace Konva. Do not introduce a second canvas library. Feature additions only. |
| **Related decisions** | DD-15 |
| **Related problems** | None |

---

## 2. Business Constraints

### BC-01: Bilingual EN/AR Support

| Field | Value |
|-------|-------|
| **Constraint** | Every user-facing string must be available in both English and Arabic. No hardcoded strings. No English-only or Arabic-only pages. |
| **Rationale** | The target market is Saudi Arabia/GCC. Both languages are required for all users. |
| **Evidence** | `22-i18n-and-localization.md` §22.7; `01-current-product-model.md` §2.1 |
| **Must never be broken** | Do not add user-facing text without corresponding entries in both `en.json` and `ar.json`. Do not use `t('key')` without defining the key in both message files. |
| **Related decisions** | DD-18 |
| **Related problems** | I-001, I-002 |

### BC-02: Saudi Arabia / GCC Primary Market

| Field | Value |
|-------|-------|
| **Constraint** | The product must work correctly in the Saudi Arabia / GCC market first. Multi-region expansion is secondary. |
| **Rationale** | The initial customer base is in Saudi Arabia. Features must work for this market before expanding. |
| **Evidence** | `01-current-product-model.md` §6.1; `19-islamic-features.md` |
| **Must never be broken** | Do not remove Islamic features (prayer times, Hijri date, Ramadan mode). Do not break Arabic RTL support. Do not assume non-GCC timezone as default. |
| **Related decisions** | DD-18 |
| **Related problems** | E-005 |

### BC-03: Multi-Tenant SaaS Model

| Field | Value |
|-------|-------|
| **Constraint** | The product must maintain strict workspace-level tenant isolation. All data is scoped by `cs_workspace_id`. No cross-workspace data leakage. |
| **Rationale** | Each workspace is an isolated customer environment. Data leakage between workspaces is a critical security violation. |
| **Evidence** | `07-workspace-management.md` §7.11; `13-enterprise-saas-review.md` §2.1 |
| **Must never be broken** | Do not fetch data without workspace scope. Do not cache data across workspace switches. Always bump data epoch on workspace switch. |
| **Related decisions** | DD-21 |
| **Related problems** | None |

### BC-04: No Marketing/Landing Page Until App is Complete

| Field | Value |
|-------|-------|
| **Constraint** | The marketing/landing page (`apps/marketing`) must not be developed until the full application (dashboard + admin) is complete and polished. |
| **Rationale** | Product-market fit requires a complete core product before marketing investment. |
| **Evidence** | User directive (session memory) |
| **Must never be broken** | Do not start work on `apps/marketing` until all transformation phases (0–10) are complete. |
| **Related decisions** | None |
| **Related problems** | None |

---

## 3. Architecture Constraints

### AC-01: Monorepo with npm Workspaces

| Field | Value |
|-------|-------|
| **Constraint** | The project must remain a monorepo with npm workspaces (`apps/*`, `packages/*`). No migration to Turborepo, Nx, or Lerna without stakeholder approval. |
| **Rationale** | npm workspaces is simple, well-supported, and sufficient for the current project size. |
| **Evidence** | `01-architecture-and-stack.md` §1.1 |
| **Must never be broken** | Do not add Turborepo, Nx, or Lerna config. Do not split the monorepo into separate repos. |
| **Related decisions** | None |
| **Related problems** | None |

### AC-02: Server Components by Default

| Field | Value |
|-------|-------|
| **Constraint** | Components must be server components by default. `'use client'` directive only when interactivity is required (event handlers, state, effects). |
| **Rationale** | Server components reduce client bundle and enable SSR. Overusing `'use client'` negates these benefits. |
| **Evidence** | `01-architecture-and-stack.md` §1.2 |
| **Must never be broken** | Do not add `'use client'` to components that don't need interactivity. Do not import client-only libraries in server components. |
| **Related decisions** | None |
| **Related problems** | None |

### AC-03: Provider Composition Order

| Field | Value |
|-------|-------|
| **Constraint** | Provider composition order must be: ThemeProvider → LocaleProvider → WorkspaceProvider (or split contexts) → NotificationProvider → BrandingProvider. |
| **Rationale** | Providers depend on each other: NotificationProvider needs WorkspaceProvider (Socket.IO), BrandingProvider needs WorkspaceProvider (workspace branding). |
| **Evidence** | `01-architecture-and-stack.md` §1.7; `04-layout-and-shell.md` §4.1 |
| **Must never be broken** | Do not reorder providers. Do not add providers that depend on NotificationProvider before it. |
| **Related decisions** | DD-21 |
| **Related problems** | None |

### AC-04: No Direct DOM Manipulation

| Field | Value |
|-------|-------|
| **Constraint** | No direct DOM manipulation (`document.querySelector`, `document.getElementById`, `element.innerHTML`). Use React refs and state for all DOM interactions. |
| **Rationale** | Direct DOM manipulation bypasses React's reconciliation and can cause inconsistencies. |
| **Evidence** | React best practice |
| **Must never be broken** | Do not use `document.querySelector`, `document.getElementById`, `element.innerHTML`, or `element.outerHTML`. Use `useRef` + `ref.current`. Exception: Konva canvas (uses its own DOM layer). |
| **Related decisions** | None |
| **Related problems** | None |

---

## 4. Backend Constraints

### BCN-01: API Envelope Format

| Field | Value |
|-------|-------|
| **Constraint** | All API responses must follow the existing envelope format: `{ ok: boolean, data?: T, error?: { code: string, message: string, details?: any } }`. |
| **Rationale** | The frontend's `apiFetch` and `toastResponseError` utilities depend on this envelope. Changing it would break all error handling. |
| **Evidence** | `23-error-handling-and-states.md` §23.6 |
| **Must never be broken** | Do not change the response envelope structure. New endpoints must follow the same format. |
| **Related decisions** | None |
| **Related problems** | None |

### BCN-02: Workspace ID via Cookie

| Field | Value |
|-------|-------|
| **Constraint** | The active workspace ID must be transmitted via `cs_workspace_id` cookie. No query parameter or header-based workspace selection. |
| **Rationale** | The cookie is automatically sent with all requests. Query parameters would require URL manipulation. Headers would require custom fetch wrapper. |
| **Evidence** | `07-workspace-management.md` §7.11 |
| **Must never be broken** | Do not change the cookie name. Do not add workspace ID to URL query parameters. Do not use custom headers for workspace selection. |
| **Related decisions** | None |
| **Related problems** | None |

### BCN-03: JWT Authentication

| Field | Value |
|-------|-------|
| **Constraint** | Authentication must use JWT tokens stored in HTTP-only cookies. No localStorage token storage. No session-based auth. |
| **Rationale** | HTTP-only cookies prevent XSS token theft. JWT enables stateless auth. |
| **Evidence** | `06-auth-and-session.md` §6.7 |
| **Must never be broken** | Do not store tokens in localStorage or sessionStorage. Do not use `sessionStorage` for auth tokens. Do not implement server-side sessions. |
| **Related decisions** | DD-23 |
| **Related problems** | None |

### BCN-04: Socket.IO for Realtime

| Field | Value |
|-------|-------|
| **Constraint** | Realtime communication must use Socket.IO. No migration to raw WebSocket, Server-Sent Events, or polling-only. |
| **Rationale** | Socket.IO provides reconnection, rooms, and transport fallback. The frontend is deeply integrated with Socket.IO event handling. |
| **Evidence** | `01-architecture-and-stack.md` §1.6; `07-workspace-management.md` §7.11 |
| **Must never be broken** | Do not replace Socket.IO. Do not add a second realtime library. Use Socket.IO events for all realtime communication. |
| **Related decisions** | DD-07 |
| **Related problems** | TD-006 |

---

## 5. API Constraints

### APC-01: RESTful Endpoints

| Field | Value |
|-------|-------|
| **Constraint** | API endpoints must follow RESTful conventions: `GET /resource`, `POST /resource`, `PUT /resource/:id`, `DELETE /resource/:id`. No GraphQL. |
| **Rationale** | The frontend is built around RESTful API calls via SWR. GraphQL would require a complete data layer rewrite. |
| **Evidence** | `01-architecture-and-stack.md` §1.7 |
| **Must never be broken** | Do not introduce GraphQL. New endpoints must follow RESTful conventions. |
| **Related decisions** | DD-16 |
| **Related problems** | None |

### APC-02: API Error Codes

| Field | Value |
|-------|-------|
| **Constraint** | API error codes must be stable, documented, and localized on the frontend via `errorCodes` translation keys. |
| **Rationale** | The frontend's `toastResponseError` function maps error codes to localized messages. Changing codes breaks localization. |
| **Evidence** | `23-error-handling-and-states.md` §23.6 |
| **Must never be broken** | Do not change existing error codes. New error codes must be added to both `en.json` and `ar.json` under `errorCodes`. |
| **Related decisions** | DD-18 |
| **Related problems** | None |

---

## 6. Database Constraints

### DC-01: Prisma ORM

| Field | Value |
|-------|-------|
| **Constraint** | Database access must use Prisma ORM. No raw SQL queries in the frontend. No other ORM (TypeORM, Sequelize). |
| **Rationale** | Prisma provides type-safe database access and schema migrations. The backend is built on Prisma. |
| **Evidence** | `01-architecture-and-stack.md` §1.1 (backend stack) |
| **Must never be broken** | Do not introduce raw SQL in frontend code. Do not add a second ORM. |
| **Related decisions** | None |
| **Related problems** | None |

### DC-02: PostgreSQL

| Field | Value |
|-------|-------|
| **Constraint** | The database must be PostgreSQL. No migration to MySQL, SQLite, or MongoDB. |
| **Rationale** | PostgreSQL is deployed and configured. The Prisma schema uses PostgreSQL-specific features. |
| **Evidence** | `01-architecture-and-stack.md` §1.1; Docker config (`db` container) |
| **Must never be broken** | Do not change the database engine. Do not use MySQL-specific or SQLite-specific Prisma features. |
| **Related decisions** | None |
| **Related problems** | None |

---

## 7. Performance Constraints

### PC-01: Lighthouse Performance Score ≥ 90

| Field | Value |
|-------|-------|
| **Constraint** | The dashboard must achieve a Lighthouse performance score of ≥ 90 on desktop. |
| **Rationale** | Performance affects user satisfaction, perceived quality, and SEO (for public pages). |
| **Evidence** | `21-success-metrics.md` §7.3 |
| **Must never be broken** | Do not add dependencies that increase bundle size by > 50KB without justification. Do not add render-blocking operations. |
| **Related decisions** | DD-16, DD-17 |
| **Related problems** | None |

### PC-02: LCP < 2.5s

| Field | Value |
|-------|-------|
| **Constraint** | Largest Contentful Paint must be < 2.5s on desktop. |
| **Rationale** | LCP is a Core Web Vital. Slow LCP indicates poor perceived load time. |
| **Evidence** | `21-success-metrics.md` §7.3 |
| **Must never be broken** | Do not add large images without optimization. Do not block rendering with synchronous operations. |
| **Related decisions** | None |
| **Related problems** | None |

### PC-03: No Layout Shift (CLS < 0.1)

| Field | Value |
|-------|-------|
| **Constraint** | Cumulative Layout Shift must be < 0.1. |
| **Rationale** | Layout shift causes user frustration and accidental clicks. |
| **Evidence** | `21-success-metrics.md` §7.3; TD-001 (inconsistent loading causes layout shift) |
| **Must never be broken** | Do not render content that changes size after initial render. Use skeleton loading to reserve space. Specify image dimensions. |
| **Related decisions** | DD-06 |
| **Related problems** | TD-001 |

### PC-04: SWR Revalidation Strategy

| Field | Value |
|-------|-------|
| **Constraint** | SWR must not use `revalidateOnFocus: true` globally (current setting). Per-hook `revalidateOnFocus` may be enabled for dashboard data. |
| **Rationale** | Global `revalidateOnFocus` causes excessive API calls when users switch tabs. Per-hook opt-in is more controlled. |
| **Evidence** | `01-architecture-and-stack.md` §1.7; `16-state-strategy.md` §2.1 |
| **Must never be broken** | Do not change the global SWR config to `revalidateOnFocus: true`. Enable per-hook only where stale data is harmful. |
| **Related decisions** | DD-16 |
| **Related problems** | None |

---

## 8. Accessibility Constraints

### ACC-01: WCAG 2.1 Level AA

| Field | Value |
|-------|-------|
| **Constraint** | All pages and components must meet WCAG 2.1 Level AA criteria. |
| **Rationale** | Accessibility is a legal requirement in many jurisdictions and an enterprise customer requirement. |
| **Evidence** | `24-accessibility-audit.md` §24.7; DD-22 |
| **Must never be broken** | Do not ship components that fail AA criteria. Do not use color as the sole indicator of state. Do not use touch targets < 44px on mobile. |
| **Related decisions** | DD-22 |
| **Related problems** | A-001 through A-004 |

### ACC-02: Keyboard Navigation

| Field | Value |
|-------|-------|
| **Constraint** | All interactive elements must be operable via keyboard. Tab order must follow visual order. Focus must be visible. |
| **Rationale** | Keyboard navigation is essential for motor-impaired users and screen reader users. |
| **Evidence** | `24-accessibility-audit.md` §24.7 |
| **Must never be broken** | Do not remove `focus-visible` styling. Do not set `tabindex="-1"` on interactive elements. Do not break tab order with CSS reordering. |
| **Related decisions** | DD-14 |
| **Related problems** | None |

### ACC-03: Screen Reader Compatibility

| Field | Value |
|-------|-------|
| **Constraint** | All interactive elements must have accessible names (via `aria-label`, `aria-labelledby`, or visible text). All tooltips must use `role="tooltip"` and `aria-describedby`. |
| **Rationale** | Screen reader users rely on ARIA for context. Missing labels make elements invisible to assistive technology. |
| **Evidence** | `24-accessibility-audit.md` §24.7; P-005 |
| **Must never be broken** | Do not ship icon-only buttons without `aria-label`. Do not use custom tooltip implementations without ARIA. |
| **Related decisions** | DD-05, DD-14 |
| **Related problems** | P-005 |

---

## 9. Localization Constraints

### LC-01: next-intl for All Translations

| Field | Value |
|-------|-------|
| **Constraint** | All user-facing text must use `next-intl`'s `useTranslations` (client) or `getTranslations` (server). No hardcoded strings. |
| **Rationale** | Hardcoded strings can't be translated. next-intl provides type-safe message access. |
| **Evidence** | `22-i18n-and-localization.md` §22.7; DD-18 |
| **Must never be broken** | Do not add user-facing text without a translation key. Do not use template literals for user-facing text. |
| **Related decisions** | DD-18 |
| **Related problems** | I-001, I-002 |

### LC-02: URL-Based Locale

| Field | Value |
|-------|-------|
| **Constraint** | Locale must be encoded in the URL (`/{locale}/...`). No subdomain-based locale. No cookie-only locale. |
| **Rationale** | URL-based locale is SEO-friendly, shareable, and bookmarkable. |
| **Evidence** | `22-i18n-and-localization.md` §22.7 |
| **Must never be broken** | Do not remove the `[locale]` route segment. Do not use subdomain-based locale routing. |
| **Related decisions** | DD-18 |
| **Related problems** | None |

### LC-03: Cairo Font for Arabic

| Field | Value |
|-------|-------|
| **Constraint** | Arabic text must use the Cairo font (loaded via `next/font`). English text uses system font stack. |
| **Rationale** | Cairo is a well-designed Arabic font with good readability. System fonts for English provide performance benefits. |
| **Evidence** | `02-design-system-and-tokens.md` §2.20; `22-i18n-and-localization.md` §22.7 |
| **Must never be broken** | Do not replace Cairo with another Arabic font without design review. Do not use Cairo for English text. |
| **Related decisions** | None |
| **Related problems** | None |

---

## 10. RTL Constraints

### RTC-01: Logical CSS Properties

| Field | Value |
|-------|-------|
| **Constraint** | All directional CSS properties must use logical equivalents. No physical `left`/`right` for layout. |
| **Rationale** | Logical properties automatically flip in RTL. Physical properties don't, causing visual bugs. |
| **Evidence** | P-001; `22-i18n-and-localization.md` §22.8; TC-03 |
| **Must never be broken** | Do not use `left`, `right`, `ml-`, `mr-`, `pl-`, `pr-` for directional layout. Use `start-`, `end-`, `ms-`, `me-`, `ps-`, `pe-`. For `translate-x`, use `rtl:` variant. |
| **Related decisions** | DD-10 |
| **Related problems** | P-001 |

### RTC-02: Icon Directional Flipping

| Field | Value |
|-------|-------|
| **Constraint** | Directional icons (arrows, chevrons) must flip in RTL using `rtl:rotate-180` or equivalent. |
| **Rationale** | A "back" arrow pointing left in LTR should point right in RTL. |
| **Evidence** | `04-layout-and-shell.md` §4.3 (ArrowLeft with `rtl:rotate-180`) |
| **Must never be broken** | Do not use directional icons without RTL flipping. Verify all arrow/chevron icons in RTL mode. |
| **Related decisions** | None |
| **Related problems** | None |

### RTC-03: RTL Testing

| Field | Value |
|-------|-------|
| **Constraint** | All new features must be tested in both LTR and RTL. RTL tests must be part of the QA process. |
| **Rationale** | RTL bugs are invisible in LTR testing. The target market requires Arabic (RTL) support. |
| **Evidence** | P-001 (Switch RTL bug not caught due to lack of RTL testing); `24-accessibility-audit.md` §24.7 |
| **Must never be broken** | Do not ship features without RTL verification. Do not skip RTL in QA. |
| **Related decisions** | DD-22 |
| **Related problems** | P-001 |

---

## 11. Security Constraints

### SC-01: HTTP-Only Cookies for Tokens

| Field | Value |
|-------|-------|
| **Constraint** | JWT tokens must be stored in HTTP-only, Secure cookies. No JavaScript-accessible token storage. |
| **Rationale** | HTTP-only cookies prevent XSS-based token theft. |
| **Evidence** | `06-auth-and-session.md` §6.7; BCN-03 |
| **Must never be broken** | Do not store tokens in localStorage, sessionStorage, or JavaScript-readable cookies. |
| **Related decisions** | DD-23 |
| **Related problems** | None |

### SC-02: CSRF Protection

| Field | Value |
|-------|-------|
| **Constraint** | All state-changing API calls (POST, PUT, DELETE) must include CSRF token from `csrf_token` cookie. |
| **Rationale** | CSRF tokens prevent cross-site request forgery attacks. |
| **Evidence** | `06-auth-and-session.md` §6.7 |
| **Must never be broken** | Do not remove CSRF token handling from `apiFetch`. Do not make state-changing calls without CSRF token. |
| **Related decisions** | None |
| **Related problems** | None |

### SC-03: Server-Side Authorization

| Field | Value |
|-------|-------|
| **Constraint** | All authorization checks must be performed server-side. Client-side guards are UX only, not security. |
| **Rationale** | Client-side guards can be bypassed. Server-side checks are the security boundary. |
| **Evidence** | `15-admin-panel.md` §15.17 (admin server-side guard); `06-auth-and-session.md` §6.7 |
| **Must never be broken** | Do not rely on client-side checks for security. Do not remove server-side authorization middleware. |
| **Related decisions** | None |
| **Related problems** | None |

### SC-04: No Secrets in Frontend Code

| Field | Value |
|-------|-------|
| **Constraint** | No API keys, secrets, or credentials in frontend source code or environment variables exposed to the client. |
| **Rationale** | Frontend code is publicly accessible. Secrets in frontend code are compromised. |
| **Evidence** | Security best practice |
| **Must never be broken** | Do not hardcode API keys, passwords, or secrets in frontend code. Use `NEXT_PUBLIC_` prefix only for non-sensitive public values. |
| **Related decisions** | None |
| **Related problems** | None |

---

## 12. Scalability Constraints

### SCL-01: Workspace Switcher Must Scale to 100+ Workspaces

| Field | Value |
|-------|-------|
| **Constraint** | The workspace switcher must remain usable with 100+ workspaces via search and metadata display. |
| **Rationale** | Agencies and MSPs manage many customer workspaces. The current dropdown doesn't scale beyond ~20. |
| **Evidence** | E-006; `07-workspace-management.md` §7.11 |
| **Must never be broken** | Do not remove search from the switcher once implemented. Do not render all workspaces without virtualization if count exceeds 100. |
| **Related decisions** | None |
| **Related problems** | E-006 |

### SCL-02: Screen List Must Scale to 200+ Screens

| Field | Value |
|-------|-------|
| **Constraint** | The screen list must remain usable with 200+ screens via search, filter, sort, and pagination. |
| **Rationale** | Enterprise customers have large screen fleets. The current card grid doesn't scale. |
| **Evidence** | E-004; `09-screens-feature.md` §9.8 |
| **Must never be broken** | Do not remove search, filter, or pagination once implemented. Do not render all screens without virtualization if count exceeds 200. |
| **Related decisions** | None |
| **Related problems** | E-004 |

### SCL-03: Notification System Must Handle 50+ Notifications

| Field | Value |
|-------|-------|
| **Constraint** | The notification system must cap in-memory notifications at 50 (current `MAX_NOTIFICATIONS` limit) and persist the rest. |
| **Rationale** | Unlimited in-memory notifications cause memory issues. |
| **Evidence** | `17-notifications.md` §17.7 |
| **Must never be broken** | Do not remove the `MAX_NOTIFICATIONS` cap. Do not store all notifications in React state. Use pagination or virtualization for the notifications page. |
| **Related decisions** | None |
| **Related problems** | None |

---

## 13. Browser Support Constraints

### BSC-01: Modern Evergreen Browsers

| Field | Value |
|-------|-------|
| **Constraint** | The application must support the latest two versions of Chrome, Firefox, Safari, and Edge. No IE 11. No legacy browser support. |
| **Rationale** | Modern browsers support all required features (WebSocket, CSS logical properties, ES2022+). Legacy browser support would require polyfills and workarounds. |
| **Evidence** | `01-architecture-and-stack.md` §1.2 (Next.js 16 requires modern browsers) |
| **Must never be broken** | Do not add polyfills for legacy browsers. Do not test in IE 11 or Edge Legacy. |
| **Related decisions** | None |
| **Related problems** | None |

### BSC-02: Safari WebSocket Support

| Field | Value |
|-------|-------|
| **Constraint** | Socket.IO must work on Safari (desktop and iOS). Safari has known WebSocket quirks. |
| **Rationale** | Safari is a major browser in the target market (iOS devices). |
| **Evidence** | DD-07 (polling fallback handles Safari WebSocket issues) |
| **Must never be broken** | Do not remove polling fallback (needed for Safari edge cases). Test Socket.IO on Safari and iOS Safari. |
| **Related decisions** | DD-07 |
| **Related problems** | TD-006 |

---

## 14. Mobile Support Constraints

### MSC-01: Responsive Breakpoints

| Field | Value |
|-------|-------|
| **Constraint** | The application must use the established breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`. No custom breakpoints. |
| **Rationale** | Consistent breakpoints ensure responsive behavior is predictable across features. |
| **Evidence** | `25-responsive-audit.md` §25.6; `02-design-system-and-tokens.md` (Tailwind config) |
| **Must never be broken** | Do not add custom breakpoints to the Tailwind config. Do not use arbitrary breakpoint values (`min-w-[900px]`). |
| **Related decisions** | None |
| **Related problems** | C-004 |

### MSC-02: Minimum Touch Target 44×44px

| Field | Value |
|-------|-------|
| **Constraint** | All interactive elements on mobile must have a minimum touch target of 44×44px (WCAG 2.5.5). |
| **Rationale** | Smaller touch targets cause mis-taps and frustration. WCAG 2.5.5 requires 44px minimum. |
| **Evidence** | A-002; `24-accessibility-audit.md` §24.7 |
| **Must never be broken** | Do not ship interactive elements smaller than 44×44px on mobile. Use padding to expand touch area if visual size is smaller. |
| **Related decisions** | DD-22 |
| **Related problems** | A-002 |

### MSC-03: No Desktop-Only Features Without Mobile Alternative

| Field | Value |
|-------|-------|
| **Constraint** | No feature may be desktop-only without a mobile alternative or graceful degradation message. |
| **Rationale** | Mobile users must be able to use all core features. Desktop-only features create a broken experience on mobile. |
| **Evidence** | P-002 (mobile workspace switching blocked); `25-responsive-audit.md` §25.7 |
| **Must never be broken** | Do not add `hidden lg:flex` to critical features without providing a mobile alternative. Studio canvas is the only exception (graceful degradation with message). |
| **Related decisions** | DD-11 |
| **Related problems** | P-002 |

---

## 15. Enterprise Requirements Constraints

### EC-01: SSO Must Not Remove Password Auth

| Field | Value |
|-------|-------|
| **Constraint** | SSO/SAML implementation must not remove the existing password-based authentication. Password auth remains as fallback. |
| **Rationale** | IdP outages must not lock users out. Password auth provides resilience. |
| **Evidence** | DD-23; `17-risk-analysis.md` R-08 |
| **Must never be broken** | Do not remove the password login form. Do not make SSO the only auth method. |
| **Related decisions** | DD-23 |
| **Related problems** | E-001 |

### EC-02: Audit Log Must Not Be Bypassable

| Field | Value |
|-------|-------|
| **Constraint** | Audit logging must be implemented at the backend middleware level, not in frontend code. No admin action may bypass the audit log. |
| **Rationale** | Frontend logging can be bypassed. Backend middleware is the security boundary. |
| **Evidence** | E-002; `15-admin-panel.md` §15.17 |
| **Must never be broken** | Do not implement audit logging in frontend code. Do not create admin endpoints that bypass audit middleware. |
| **Related decisions** | DD-19 |
| **Related problems** | E-002 |

### EC-03: RBAC Must Be Enforced Server-Side

| Field | Value |
|-------|-------|
| **Constraint** | Role-based access control must be enforced server-side. Client-side role checks are UX only. |
| **Rationale** | Client-side checks can be bypassed. Server-side enforcement is the security boundary. |
| **Evidence** | SC-03; `16-team-feature.md` §16.4 |
| **Must never be broken** | Do not rely on client-side role checks for security. Do not expose admin APIs without server-side role verification. |
| **Related decisions** | DD-19 |
| **Related problems** | E-003 |

---

## Constraint Summary

| Category | Count | IDs |
|----------|-------|-----|
| Technical | 6 | TC-01 through TC-06 |
| Business | 4 | BC-01 through BC-04 |
| Architecture | 4 | AC-01 through AC-04 |
| Backend | 4 | BCN-01 through BCN-04 |
| API | 2 | APC-01, APC-02 |
| Database | 2 | DC-01, DC-02 |
| Performance | 4 | PC-01 through PC-04 |
| Accessibility | 3 | ACC-01 through ACC-03 |
| Localization | 3 | LC-01 through LC-03 |
| RTL | 3 | RTC-01 through RTC-03 |
| Security | 4 | SC-01 through SC-04 |
| Scalability | 3 | SCL-01 through SCL-03 |
| Browser | 2 | BSC-01, BSC-02 |
| Mobile | 3 | MSC-01 through MSC-03 |
| Enterprise | 3 | EC-01 through EC-03 |
| **Total** | **50** | |

---

## Cross-References

- See `24-design-decisions.md` for decisions bounded by these constraints
- See `26-product-principles.md` for principles that operate within these constraints
- See `02-problem-map.md` for problem IDs referenced in this document
- See `17-risk-analysis.md` for risks of violating constraints
