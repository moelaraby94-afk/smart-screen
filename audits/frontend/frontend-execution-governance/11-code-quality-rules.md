# 11 — Code Quality Rules

> **Status:** FINAL — Standards for code quality, structure, and patterns

---

## 1. Purpose

Defines the code quality standards that all frontend code must meet. These rules are enforced by the AI Constitution (Article V) and verified during self-audit (`22-self-audit-process.md`) and PR review (`23-pr-review-process.md`).

---

## 2. TypeScript Rules

### 2.1 Type Safety
- **No `any` type** — use `unknown` if type is truly unknown, then narrow
- **No `as` casts** unless absolutely necessary (document why)
- **No `@ts-ignore`** or `@ts-expect-error` without comment explaining why
- **All props typed** — every component prop must have an explicit interface
- **All function returns typed** — explicit return types on exported functions
- **Strict mode** — `strict: true` in `tsconfig.json`
- **No implicit any** — `noImplicitAny: true`

### 2.2 Interface vs Type
- Use `interface` for component props and API contracts
- Use `type` for unions, intersections, and utility types
- Prefer `interface` for extensibility (API responses)

### 2.3 Enums vs Union Types
- Prefer **union types** over enums for component variants
- Use `type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'link'`
- Avoid runtime enums unless needed for reverse mapping

---

## 3. React Rules

### 3.1 Component Structure
- **Functional components only** — no class components
- **One component per file** (except sub-components in same file)
- **Max 300 lines per component** — split if larger
- **Sub-components in same file** if small (< 50 lines) and not reused
- **Sub-components in separate file** if reused or complex

### 3.2 Hooks Rules
- **Custom hooks for reusable logic** — extract repeated logic to hooks
- **Hook naming** — `use[Feature]` pattern (`useScreenStatus`, `useMediaUpload`)
- **No hooks in conditions** — no hooks inside `if`, `for`, `while`
- **No hooks in callbacks** — no hooks inside `useCallback`, `useMemo`
- **Effect dependencies** — all dependencies in `useEffect` dependency array
- **No unused dependencies** — remove unused deps from array (or document why)

### 3.3 State Management
- **Local state** — `useState` for component-level state
- **Shared state** — Context or SWR cache for shared state
- **Server state** — SWR for all server data
- **Realtime state** — Socket.IO event handlers updating SWR cache
- **No global state** — no Redux or global stores (SWR + Context is sufficient)
- **State ownership** — per `product-architecture/13-frontend-state-boundaries.md`

### 3.4 Rendering
- **No inline styles** — use Tailwind classes or CSS modules
- **No `dangerouslySetInnerHTML`** — never
- **Conditional rendering** — use `&&` or ternary, not `if` in JSX
- **List rendering** — always provide `key` prop (use entity ID, not index)
- **Fragment usage** — use `<>` for multiple root elements
- **No `React.createElement`** — use JSX

### 3.5 Performance
- **`React.memo`** — for components that receive stable props but re-render due to parent
- **`useCallback`** — for handlers passed to memoized children
- **`useMemo`** — for expensive calculations (not for trivial operations)
- **No premature optimization** — only optimize when profiler shows a problem
- **Lazy loading** — `next/dynamic` for heavy components (Studio, Charts)

---

## 4. File Structure Rules

### 4.1 Import Order
```typescript
// 1. React/Next imports
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party imports
import { useSWR } from 'swr';
import { motion } from 'framer-motion';
import { Monitor } from 'lucide-react';

// 3. Internal absolute imports
import { Button } from '@/packages/ui/button';
import { Card } from '@/packages/ui/card';

// 4. Internal relative imports
import { ScreenCard } from './screen-card';
import { useScreenStatus } from './hooks';

// 5. Type imports
import type { Screen } from '@/types/screen';
import type { ButtonProps } from '@/packages/ui/button';

// 6. Style imports (if any)
import styles from './component.module.css';
```

### 4.2 Export Rules
- **Named exports** — prefer named exports over default exports
- **Barrel exports** — `index.ts` for each component directory
- **No circular exports** — avoid A exports B exports A

### 4.3 File Size
- **Max 300 lines per component file**
- **Max 200 lines per hook file**
- **Max 100 lines per utility file**
- **Max 500 lines per page file** (pages can be larger but should be split)

---

## 5. CSS & Styling Rules

### 5.1 Tailwind First
- **Tailwind classes** — primary styling method
- **No custom CSS** — unless Tailwind cannot express the style
- **No CSS-in-JS** — no styled-components, emotion, or similar
- **No inline styles** — no `style={{ ... }}`

### 5.2 Token Usage
- **Semantic tokens only** — `bg-primary`, `text-foreground`, `border-border`
- **No primitive tokens** — no `bg-blue-600`, `text-gray-500`
- **No hardcoded values** — no `#2563eb`, `16px`, `8px`
- **Spacing scale** — use Tailwind spacing (`p-4`, `gap-3`, `mt-6`)
- **Typography scale** — use Tailwind text sizes (`text-sm`, `text-lg`)

### 5.3 Class Organization
```tsx
// Order: layout → sizing → spacing → typography → colors → states → responsive → RTL
<div className="flex items-center w-full p-4 text-sm font-medium text-foreground bg-card rounded-lg hover:bg-muted md:p-6 rtl:flex-row-reverse">
```

### 5.4 Responsive Classes
- **Mobile-first** — base classes for mobile, `sm:`, `md:`, `lg:` for larger
- **No `max-*` breakpoints** — use mobile-first approach
- **Test at all breakpoints** — 320px, 768px, 1024px, 1280px

---

## 6. API Integration Rules

### 6.1 Data Fetching
- **SWR for all data fetching** — no raw `fetch` in components
- **SWR hooks** — create custom hooks wrapping SWR (`useScreens`, `usePlaylists`)
- **Error handling** — SWR error handler + ErrorState component
- **Loading state** — SWR `isLoading` + Skeleton component
- **Revalidation** — `revalidateOnFocus: false` (avoid unnecessary refetches)
- **Keep previous data** — `keepPreviousData: true` during pagination/filtering

### 6.2 Mutations
- **SWR mutations** — use `useSWRMutation` or manual mutation + `mutate`
- **Optimistic updates** — where applicable (toggles, deletes from list)
- **Rollback on error** — revert optimistic update + error toast
- **Success feedback** — toast per `24-toast-standards.md`

### 6.3 API Client
- **Centralized API client** — single fetcher function for SWR
- **Base URL from env** — `NEXT_PUBLIC_API_URL`
- **Auth headers** — automatic auth token injection
- **Error normalization** — normalize API errors to consistent format
- **No API calls in components** — use hooks that wrap SWR

### 6.4 Realtime
- **Socket.IO client** — single client instance
- **Event handlers in hooks** — not in components
- **SWR cache updates** — realtime events update SWR cache
- **Throttle** — throttle UI updates to 1/second for high-frequency events

---

## 7. Error Handling Rules

### 7.1 No Silent Errors
- **No empty catch blocks** — always handle or rethrow
- **No `console.error` only** — show user-facing error state
- **No swallowed promises** — always `.catch()` or `try/catch`

### 7.2 Error Boundaries
- **App-level ErrorBoundary** — catches all uncaught render errors
- **Widget-level ErrorBoundary** (future) — isolates widget errors
- **Fallback UI** — ErrorState component per `20-error-states.md`

### 7.3 API Error Handling
| Error | Handling | Evidence |
|-------|---------|----------|
| 400 | Toast: "Invalid request" | — |
| 401 | Redirect to Login | `06-auth-flows.md` |
| 403 | ErrorState (permission) | `20-error-states.md` |
| 404 | ErrorState (notFound) | `20-error-states.md` |
| 409 | Dialog conflict message | `35-scheduling-components.md` |
| 429 | Toast: "Too many requests" | — |
| 500 | ErrorState (server) | `20-error-states.md` |
| Network | OfflineBanner | `20-error-states.md` |

---

## 8. Code Review Standards

### 8.1 Self-Review Before PR
- [ ] Code compiles without errors
- [ ] No TypeScript warnings
- [ ] No ESLint warnings
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] No TODO without ticket reference
- [ ] All tests passing
- [ ] Self-audit (`22-self-audit-process.md`) passed

### 8.2 PR Quality
- [ ] PR description includes: what, why, how
- [ ] PR description includes: Definition of Done checklist
- [ ] PR description includes: screen spec reference
- [ ] PR description includes: test instructions
- [ ] PR is reviewable (reasonable size, clear changes)
- [ ] No unrelated changes in PR

---

## 9. Forbidden Patterns

See `26-anti-patterns.md` for the complete list of forbidden patterns.

---

## Cross-References

- See `01-ai-constitution.md` Article V for code standards
- See `12-frontend-architecture-rules.md` for architecture rules
- See `26-anti-patterns.md` for forbidden patterns
- See `22-self-audit-process.md` for self-audit
- See `23-pr-review-process.md` for PR review
- See `product-architecture/13-frontend-state-boundaries.md` for state management
- See `product-architecture/14-frontend-responsibilities.md` for responsibilities
