# State Strategy

> **Evidence basis:** `01-architecture-and-stack.md` §1.7, `07-workspace-management.md` §7.11, `17-notifications.md` §17.7, `04-layout-and-shell.md` §4.1-4.6
> **Purpose:** Define state management and data flow strategy for the transformation

---

## 1. Current State Architecture

### 1.1 State Layers

```
Layer 1: Server State (SWR)
  ├── Global SWRConfig (no revalidateOnFocus, no errorRetryCount)
  ├── Workspace-scoped fetches (workspaceId in key)
  ├── Data epoch for forced revalidation
  └── No optimistic updates

Layer 2: Application State (React Context)
  ├── ThemeProvider (next-themes) — theme preference
  ├── LocaleProvider (next-intl) — locale, translations
  ├── NotificationProvider — notifications[], socket connection
  ├── BrandingProvider — workspace branding (logo, colors)
  ├── WorkspaceProvider — auth, workspace, super-admin, impersonation
  └── HeaderMetaContext — header title, kicker, back button

Layer 3: Local State (useState/useReducer)
  ├── Form state (individual components)
  ├── Modal/dialog open state (individual components)
  ├── Sidebar open state (CrystalShell)
  └── Studio canvas state (Konva)

Layer 4: Persistent State
  ├── Cookies: cs_workspace_id, NEXT_LOCALE, csrf_token
  ├── localStorage: next-themes (theme preference)
  └── sessionStorage: super-admin hint
```

### 1.2 State Flow

```
User Action → Local State Update → API Call (apiFetch)
  → SWR Cache Update → Component Re-render
  → Socket.IO Event → NotificationProvider → Toast + Bell Badge
  → WorkspaceProvider → Workspace Data Epoch Bump → SWR Revalidation
```

---

## 2. State Issues

### 2.1 SWR Configuration

| Setting | Current | Impact | Recommendation |
|---------|---------|--------|----------------|
| `revalidateOnFocus` | false | Data stale after tab switch | Consider `true` for dashboard data |
| `errorRetryCount` | 0 | No retry on failure | Add retry (2-3 attempts) |
| `dedupingInterval` | default | Good — prevents duplicate calls | Maintain |
| `refreshInterval` | not set | No polling | Rely on Socket.IO for realtime |

**Evidence:** `01-architecture-and-stack.md` §1.7 — "SWR global config disables revalidateOnFocus and errorRetryCount"

### 2.2 Context Performance

| Provider | Consumers | Re-render Impact | Evidence |
|----------|-----------|------------------|----------|
| WorkspaceProvider | Sidebar, Header, Gate, all pages | High — workspace change re-renders everything | `07-workspace-management.md` §7.11 |
| NotificationProvider | Bell, toast, notifications page | Medium — notification array changes | `17-notifications.md` §17.7 |
| BrandingProvider | Logo, theme accents | Low — rarely changes | `04-layout-and-shell.md` §4.1 |
| HeaderMetaContext | Header, breadcrumbs | Medium — changes on every navigation | `04-layout-and-shell.md` §4.1 |

**Issue:** `WorkspaceProvider` value changes trigger re-renders of all consumers. The `useCallback` for `setWorkspaceId` and `bumpWorkspaceDataEpoch` prevents function identity changes, but workspace data changes still cause full re-renders.

**Recommendation:** Consider splitting `WorkspaceProvider` into:
- `AuthProvider` — `isAuthenticated`, `isSuperAdmin` (rarely changes)
- `WorkspaceContext` — `workspaceId`, `workspaces`, `setWorkspaceId` (changes on switch)
- `ImpersonationContext` — `isImpersonating`, `returnToAdmin` (rarely changes)

### 2.3 No Optimistic Updates

**Current:** All mutations wait for API response before updating UI.
**Impact:** Feels slower than necessary for simple operations (rename, toggle, delete).

**Recommendation:** Add optimistic updates for:
- Screen rename (update local cache immediately, revert on error)
- Playlist name change
- Schedule toggle (enable/disable)
- Notification mark-as-read
- Feature flag toggle (admin)

### 2.4 No Form State Persistence

**Current:** Form state is lost on navigation.
**Impact:** Users who navigate away from a form lose all input.

**Evidence:** `27-user-flows.md` §27.9 — "No form state persistence"

**Recommendation:** Consider:
- Unsaved changes warning (`beforeunload` event + custom modal)
- Form state persistence in sessionStorage for critical forms (schedule create, playlist create)
- Auto-save for Studio canvas

### 2.5 Socket.IO State

**Current:** Socket connection managed in `WorkspaceProvider`, events dispatched to `NotificationProvider`.

**Issues:**
- No connection status indicator (TD-006)
- No reconnection notification
- Silent failures on restricted networks
- WebSocket-only transport (no polling fallback)

**Recommendation:**
- Add `connectionStatus` to context: `connected`, `connecting`, `disconnected`, `error`
- Show connection status indicator in header (small dot icon)
- Add polling fallback: `transports: ['websocket', 'polling']`
- Show toast on reconnection: "Connection restored"

### 2.6 hasSuccessfulMeRef

**Current:** After first successful `/auth/me` call, subsequent calls are skipped. Errors are silently swallowed.

**Evidence:** `07-workspace-management.md` §7.11, TD-005

**Recommendation:** Remove the ref guard. Instead:
- Use SWR's built-in deduplication (it already prevents redundant calls within the dedup interval)
- Let errors propagate to the error handler
- Add retry logic for auth failures (redirect to login after N retries)

---

## 3. State Strategy Direction

### 3.1 Server State

**Keep SWR** as the primary server state manager. It's well-suited for this use case.

**Adjustments:**
- Enable `revalidateOnFocus: true` for dashboard data (stale data is worse than extra API calls)
- Add `errorRetryCount: 3` for resilience
- Add optimistic updates for simple mutations
- Use SWR mutations (`useSWRMutation`) for POST/PUT/DELETE operations

### 3.2 Application State

**Keep React Context** for application state. It's sufficient for this scale.

**Adjustments:**
- Split `WorkspaceProvider` into smaller contexts (auth, workspace, impersonation)
- Add Socket.IO connection status to context
- Consider `useReducer` for complex state (notifications, workspace list)

### 3.3 Local State

**Keep `useState`** for component-level state.

**Adjustments:**
- Use `useReducer` for complex local state (Studio canvas, schedule form)
- Add form state persistence for critical forms
- Add unsaved changes warning for forms with significant input

### 3.4 Persistent State

**Keep current approach** (cookies, localStorage, sessionStorage).

**Adjustments:**
- Add notification persistence (localStorage) so notifications survive page refresh
- Consider persisting sidebar collapsed/expanded state (localStorage)
- Consider persisting last-visited page per workspace (for better workspace switching)

---

## 4. Data Flow Patterns

### 4.1 Read Pattern (Current — Good)

```
Component → useSWR(key, fetcher) → SWR Cache → API → Cache → Component
```

**No changes needed.** SWR's read pattern is correct.

### 4.2 Write Pattern (Current — Needs Improvement)

**Current:**
```
Component → apiFetch(POST/PUT/DELETE) → API Response → mutate(key) → SWR Revalidation → Component
```

**Target:**
```
Component → useSWRMutation(key, fetcher) → Optimistic Update → API Response
  → Success: Confirm update, mutate(key)
  → Error: Revert update, show error toast
```

### 4.3 Realtime Pattern (Current — Needs Improvement)

**Current:**
```
Socket.IO → WorkspaceProvider → NotificationProvider → Toast + Bell
```

**Target:**
```
Socket.IO → Connection Status Context → Header indicator
Socket.IO → NotificationProvider → Toast + Bell + localStorage persistence
Socket.IO → WorkspaceProvider → Data epoch bump → SWR revalidation
Socket.IO → Screen status events → Direct SWR cache update (no full revalidation)
```

### 4.4 Error Pattern (Current — Good)

```
API Error → Error Envelope → toastResponseError() → Localized Toast
  → (if 401) → Token Refresh → Retry → (if still 401) → Redirect to login
  → (if 403) → Permission error toast
  → (if 404) → Not found toast
  → (if 429) → Rate limit toast
  → (if 500) → Server error toast + Sentry report
```

**No changes needed.** The error handling pattern is well-designed.

---

## 5. State Testing Strategy

### 5.1 Context Testing

Each context provider should have tests for:
- Initial state
- State transitions (e.g., workspace switch, login, logout)
- Error handling (e.g., API failure, session expiry)
- Context value stability (useCallback, useMemo)

### 5.2 SWR Testing

Each data-fetching hook should have tests for:
- Successful fetch
- Error handling
- Loading state
- Cache invalidation
- Optimistic update (if applicable)

### 5.3 Socket.IO Testing

- Connection establishment
- Event handling
- Reconnection
- Disconnection
- Error states

---

## Cross-References

- See `01-architecture-and-stack.md` (audit) for current architecture
- See `07-workspace-management.md` (audit) for WorkspaceProvider details
- See `17-notifications.md` (audit) for NotificationProvider details
- See `15-component-strategy.md` for component architecture
- See `17-risk-analysis.md` for state refactoring risks
