# 23 — Error Handling, Loading & Empty States

> **Source basis:** `src/app/[locale]/error.tsx`, `src/app/[locale]/(shell)/error.tsx`, `src/app/[locale]/(shell)/loading.tsx`, `src/app/not-found.tsx`, `src/app/[locale]/not-found.tsx`, `src/components/ui/skeleton-patterns.tsx`, `src/components/ui/empty-state.tsx`, `src/features/api/api-error.ts`, `src/features/api/use-api-error-toast.ts`, `src/features/api/use-api-error-message.ts`, `src/components/app-toaster.tsx`  

---

## 23.1 Error Boundaries

### Locale Error Boundary (`src/app/[locale]/error.tsx`)

**Component:** Client component (`'use client'`)

**Behavior:**
1. Logs error to Sentry via `Sentry.captureException(error)`
2. Shows error UI:
   - Title (translated from `error.title`)
   - In development: shows `error.message` in monospace
   - In production: shows translated generic message
3. "Try Again" button calls `reset()` (Next.js error boundary reset)

**UI:**
```tsx
<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
  <h2 className="text-lg font-semibold">{t('title')}</h2>
  {process.env.NODE_ENV === 'development' && (
    <pre className="text-xs text-muted-foreground">{error.message}</pre>
  )}
  <button onClick={reset}>{t('tryAgain')}</button>
</div>
```

### Shell Error Boundary (`src/app/[locale]/(shell)/error.tsx`)

**Component:** Client component

**Behavior:**
1. Logs error to Sentry
2. Shows error UI with `AlertTriangle` icon in destructive-tinted circle
3. In development: shows `error.message`
4. In production: shows translated generic message
5. "Retry" button with `RefreshCw` icon calls `reset()`

**UI:**
```tsx
<div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
    <AlertTriangle className="h-7 w-7 text-destructive" />
  </div>
  <h2 className="text-lg font-semibold">{t('title')}</h2>
  <p className="text-sm text-muted-foreground">{message}</p>
  <button onClick={reset} className="...">
    <RefreshCw className="h-4 w-4" /> {t('retry')}
  </button>
</div>
```

---

## 23.2 Not Found Pages

### Root 404 (`src/app/not-found.tsx`)
- Detects locale from cookie/header
- Shows 404 code, title, description
- "Back to Home" button links to `/{locale}`

### Locale 404 (`src/app/[locale]/not-found.tsx`)
- Client component
- Shows `SearchX` icon
- 404 code, title, description (all translated)
- "Back to Overview" button links to `/{locale}/overview`

---

## 23.3 Loading States

### Shell Loading (`src/app/[locale]/(shell)/loading.tsx`)
Centered spinner:
```tsx
<div className="flex min-h-[50vh] items-center justify-center">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>
```

### Overview Loading (`src/features/dashboard/overview-page-client.tsx`)
Skeleton with pulse animation:
```tsx
<div className="space-y-6">
  <div className="space-y-2">
    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    <div className="h-7 w-48 animate-pulse rounded bg-muted" />
  </div>
  <CardGridSkeleton count={4} />
</div>
```

### Dashboard Data Loading (`src/features/dashboard/client-home-dashboard.tsx`)
Text-based loading:
```tsx
<div className="flex min-h-[40vh] items-center justify-center">
  <p className="text-sm text-muted-foreground">{t('loading')}</p>
</div>
```

### Data Error with Retry (`src/features/dashboard/client-home-dashboard.tsx`)
```tsx
<div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
  <p className="text-sm font-medium text-muted-foreground">{t('loadFailed')}</p>
  <button onClick={() => void load()} className="...">
    {t('retry')}
  </button>
</div>
```

### Media Page Suspense
```tsx
<Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>}>
  <MediaLibraryClient />
</Suspense>
```

---

## 23.4 Skeleton Patterns (`src/components/ui/skeleton-patterns.tsx`)

### TableSkeleton
| Prop | Default | Purpose |
|------|---------|---------|
| `rows` | 5 | Number of skeleton rows |
| `cols` | 4 | Number of skeleton columns |

Renders a table with `Skeleton` components for each cell. Header row has slightly different styling.

### CardGridSkeleton
| Prop | Default | Purpose |
|------|---------|---------|
| `count` | 4 | Number of skeleton cards |

Renders a responsive grid (1/2/4 columns) of skeleton cards with image area and text lines.

### ListSkeleton
| Prop | Default | Purpose |
|------|---------|---------|
| `count` | 5 | Number of skeleton rows |

Renders a vertical list of skeleton rows with avatar circle and text lines.

---

## 23.5 Empty States (`src/components/ui/empty-state.tsx`)

### Props
| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `icon` | `LucideIcon` | Yes | Icon component |
| `title` | `string` | Yes | Title text |
| `description` | `string` | No | Description text |
| `action` | `ReactNode` | No | Action button/link |

### Layout
Centered vertical layout with icon in muted circle, title, description, and optional action. Used throughout the app for empty lists, no search results, no data states.

---

## 23.6 API Error Handling

### Error Envelope (`src/features/api/api-error.ts`)

The API returns structured error envelopes:
```json
{
  "statusCode": 400,
  "code": "SCREEN_LIMIT_REACHED",
  "message": "Screen limit reached",
  "details": { "limit": 25, "current": 25 }
}
```

**Key design decisions:**
- `code` is a stable machine contract (e.g., `SCREEN_LIMIT_REACHED`)
- `message` is English prose for server logs — **never rendered to users**
- `details` contains structured data for interpolation into localized messages
- The UI uses `code` + `details` to look up a localized message

### `readApiError(response)` — Error Reader
- Never throws
- Returns `ApiError` type with `status`, `code`, `details`
- Unrecognized responses collapse to `UNKNOWN_ERROR` code
- Handles JSON parse failures gracefully

### `useApiErrorToast` (`src/features/api/use-api-error-toast.ts`)
Hook that provides `toastResponseError(response)`:
1. Reads error envelope via `readApiError`
2. Maps `code` to localized message via translation catalog
3. Shows error toast with localized message
4. Falls back to generic "Something went wrong" for unknown codes

### `useApiErrorMessage` (`src/features/api/use-api-error-message.ts`)
Hook that provides `errorMessage(apiError)`:
1. Maps `code` to localized message
2. Interpolates `details` into message template
3. Returns string for inline display

### Common Error Codes
| Code | Meaning |
|------|---------|
| `UNKNOWN_ERROR` | Unrecognized error |
| `SCREEN_LIMIT_REACHED` | Workspace screen limit exceeded |
| `MEMBER_LIMIT_REACHED` | Workspace member limit exceeded |
| `ALREADY_MEMBER` | Email already in workspace |
| `INVITE_EXPIRED` | Invitation has expired |
| `INSUFFICIENT_PERMISSIONS` | User lacks required role |
| `INVALID_CREDENTIALS` | Wrong email or password |
| `EMAIL_NOT_VERIFIED` | Email verification required |
| `WORKSPACE_NOT_FOUND` | Workspace doesn't exist |
| `SCREEN_NOT_FOUND` | Screen doesn't exist |
| `PLAYLIST_NOT_FOUND` | Playlist doesn't exist |
| `MEDIA_NOT_FOUND` | Media item doesn't exist |
| `STORAGE_LIMIT_REACHED` | Storage limit exceeded |
| `SUBSCRIPTION_CANCELED` | Subscription was canceled |
| `PAYMENT_REQUIRED` | Payment needed for action |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## 23.7 Toast Notifications (Sonner)

### Configuration (`src/components/app-toaster.tsx`)
```tsx
<Toaster
  position={isRtl ? 'top-left' : 'top-right'}
  richColors
  closeButton
  toastOptions={{
    classNames: {
      toast: 'rounded-xl border border-border bg-card text-card-foreground',
    },
  }}
/>
```

### Toast Types Used
| Type | Function | Color | Usage |
|------|----------|-------|-------|
| Success | `toast.success()` | Green | Operation completed |
| Error | `toast.error()` | Red | Operation failed |
| Warning | `toast.warning()` | Amber | Screen offline, warnings |
| Info | `toast.info()` | Blue | Schedule changes, subscription updates |

### Toast Patterns
- **Success:** `toast.success(t('toastSaved'))` — short confirmation
- **Error:** `toast.error(t('toastSaveFailed'))` — short error message
- **API Error:** `await toastResponseError(response)` — reads envelope, shows localized error
- **With Icon:** `toast.warning(msg, { icon: <AlertTriangle /> })`

### Position
- LTR: `top-right`
- RTL: `top-left`
- Adapts to locale direction

---

## 23.8 Sentry Integration

### Configuration
- Conditional: only active if `SENTRY_DSN` environment variable is set
- Both build-time (`sentry-build.config.ts`) and runtime integration
- Captures errors from error boundaries via `Sentry.captureException()`
- Client-side error capturing enabled

### Error Boundary Reporting
Both locale and shell error boundaries call:
```typescript
useEffect(() => {
  Sentry.captureException(error);
}, [error]);
```

This ensures all unhandled errors in the app are reported to Sentry.

---

## 23.9 [V2] UX Analysis — Error Handling & States

### Error State Hierarchy — HCI Evaluation

**[V2] Three-Tier Error System:**
1. **Toast notifications** (sonner) — transient, auto-dismiss, for non-critical feedback
2. **Inline errors** — persistent within forms, for validation and API errors
3. **Error boundaries** — full-page replacement, for unhandled React errors

This is a well-structured error hierarchy. Each tier serves a different purpose and has different persistence.

**[V2] Toast Position — RTL Aware:**
Toasts appear `top-right` in LTR and `top-left` in RTL. This is correct — toasts should appear on the side where the user's attention naturally rests (end side in reading direction). The `richColors` and `closeButton` options ensure toasts are visually distinct and dismissible.

**[V2] Error Code Localization:**
The error code system (`UNKNOWN_ERROR`, `SCREEN_LIMIT_REACHED`, etc.) maps to localized messages. This is good — users see errors in their language. However:
- `UNKNOWN_ERROR` is a catch-all that should be rare but informative
- Error messages should include actionable guidance (e.g., "Screen limit reached. Upgrade your plan to add more screens.")
- No error code for network failures (offline, timeout) — these likely show generic errors

**[V2] API Error Envelope:**
The backend returns errors in a structured envelope with `code` and `details`. The frontend's `toastResponseError()` reads this envelope and shows localized messages. This is a good pattern — it separates error codes (stable, translatable) from error details (dynamic, interpolated).

### Loading States — Consistency Audit

**[V2] Inconsistent Loading Patterns:**
As identified across multiple V2 sections:
- `OverviewPageClient`: `CardGridSkeleton` (animated pulse)
- `ClientHomeDashboard`: Text "Loading..." with retry button
- `ShellSidebar`: 7 skeleton items (`h-12 rounded-xl bg-muted/40`)
- `WorkspaceGate`: `Loader2` spinner (`h-10 w-10 animate-spin`)
- `OnboardingWizard`: Button spinner (`Loader2`)

The inconsistency between skeleton loading and spinner loading creates different perceived performance. Skeletons feel faster (content is "almost there") while spinners feel slower ("waiting for something"). Best practice is to use skeletons for page-level loading and spinners for action-level loading.

**[V2] No Progressive Loading:**
There is no progressive/streaming data loading. Pages wait for all data before rendering. Next.js Suspense with streaming could improve perceived performance by showing partial content as data arrives.

### Empty States — UX Evaluation

**[V2] EmptyState Component:**
The `EmptyState` component (see `05-ui-component-library.md` V2) provides a consistent empty state pattern with icon, title, description, and optional action. However:
- No variant differentiation (first-use vs no-results vs error)
- No illustration support (only icons)
- No secondary action (only one CTA)

**[V2] Empty State Triggers:**
Empty states should appear when:
- No data exists (new account, no screens/playlists/media)
- Search returns no results
- Filter returns no results
- Data was deleted

Each trigger should have a contextually appropriate message and CTA.

### Error Boundaries — Resilience

**[V2] Two Error Boundaries:**
1. **Locale error boundary** — wraps locale-specific content, shows localized error
2. **Shell error boundary** — wraps the entire shell, shows generic error

This is good — the locale boundary prevents a single locale's error from breaking the entire app. The shell boundary is the last resort.

**[V2] Error Boundary Recovery:**
Error boundaries should provide a "Try Again" button that resets the error state. Without recovery, users must refresh the page. The error boundary should also log the error context (route, user ID) to Sentry for debugging.

### [V2] Nielsen Heuristic Evaluation — Error Handling

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ✅ Good | Toast notifications, inline errors, error boundaries |
| Error prevention | ⚠️ Medium | No proactive validation in many forms, no conflict detection |
| Help users recognize/recover from errors | ✅ Good | Localized error messages, retry buttons, Sentry reporting |
| Consistency | ⚠️ Medium | Inconsistent loading patterns (skeleton vs spinner vs text) |

### Cross-References
- See `05-ui-component-library.md` for EmptyState and Skeleton components
- See `04-layout-and-shell.md` for error boundary placement
- See `06-auth-and-session.md` for auth error handling
- See `17-notifications.md` for toast notification system
- See `24-accessibility-audit.md` for error message accessibility
