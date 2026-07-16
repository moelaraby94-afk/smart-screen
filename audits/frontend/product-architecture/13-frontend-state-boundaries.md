# Frontend State Boundaries

> **Evidence basis:** `16-state-strategy.md` (transformation), `07-workspace-management.md` (audit), `17-notifications.md` (audit), `01-architecture-and-stack.md` (audit)
> **Purpose:** Define which state belongs where — Shell, Module, or Component — and how state flows between layers

---

## 1. State Layer Architecture

```
Layer 0: Persistent State (cookies, localStorage, sessionStorage)
    │
Layer 1: Shell State (global React Context)
    │
Layer 2: Module State (SWR server state, module-scoped)
    │
Layer 3: Component State (useState, useReducer — local to a component)
```

---

## 2. Layer 0: Persistent State

| Key | Storage | Purpose | Owner | Evidence |
|-----|---------|---------|-------|----------|
| `cs_workspace_id` | Cookie | Active workspace ID | Shell (WorkspaceProvider) | `07-workspace-management.md` §7.11 |
| `NEXT_LOCALE` | Cookie | Active locale | Shell (LocaleProvider) | `22-i18n-and-localization.md` §22.7 |
| `csrf_token` | Cookie | CSRF protection | Shell (apiFetch) | `06-auth-and-session.md` §6.7 |
| `theme` | localStorage | Dark/light preference | Shell (ThemeProvider) | `01-architecture-and-stack.md` §1.7 |
| `super-admin-hint` | sessionStorage | Super-admin context | Shell (WorkspaceProvider) | `07-workspace-management.md` §7.11 |

**Architecture rules:**
- No module writes to cookies directly. All cookie management goes through Shell utilities.
- No module writes to localStorage or sessionStorage directly.
- New persistent state requires Shell-level approval and a Shell-level utility.

---

## 3. Layer 1: Shell State (Global Context)

### 3.1 Current Providers

| Provider | State | Consumers | Evidence |
|----------|-------|-----------|----------|
| ThemeProvider | `theme: 'light' \| 'dark'` | All (via `useTheme`) | `01-architecture-and-stack.md` §1.7 |
| LocaleProvider | `locale: 'en' \| 'ar'`, translations | All (via `useTranslations`) | `22-i18n-and-localization.md` §22.7 |
| WorkspaceProvider | `isAuthenticated`, `isSuperAdmin`, `workspaceId`, `workspaces[]`, `dataEpoch`, `impersonation` | All (via `useWorkspace`) | `07-workspace-management.md` §7.11 |
| NotificationProvider | `notifications[]`, `socketConnected`, `unreadCount` | Shell (bell), all (toast) | `17-notifications.md` §17.7 |
| BrandingProvider | `logo`, `primaryColor`, `appName` | Shell (sidebar, header) | `04-layout-and-shell.md` §4.1 |
| HeaderMetaContext | `pageTitle`, `kicker`, `showBack`, `backHref`, `backLabel` | Shell (header) | `03-routing-and-navigation.md` §3.4 |

### 3.2 Planned Provider Split (DD-21)

| New Provider | State Split From | Rationale | Evidence |
|-------------|-----------------|-----------|----------|
| AuthProvider | `isAuthenticated`, `isSuperAdmin` from WorkspaceProvider | Auth changes rarely; workspace changes on switch | `16-state-strategy.md` §2.2 |
| WorkspaceContext | `workspaceId`, `workspaces[]`, `dataEpoch` | Workspace data is high-frequency | — |
| ImpersonationContext | `impersonation` state | Impersonation is rare and isolated | — |

### 3.3 Shell State Rules

| Rule | Rationale |
|------|-----------|
| Shell providers are composed in a fixed order (AC-03) | Dependency chain: notifications need workspace, branding needs workspace |
| Modules consume Shell state via hooks (`useWorkspace`, `useTheme`, etc.) | Consistent API, no direct context access |
| Modules must not modify Shell state directly | Shell state is managed by Shell providers only |
| New Shell-level state requires architecture review | Prevents context bloat (current WorkspaceProvider is already too large) |
| Shell state changes trigger SWR revalidation (data epoch) | Workspace switch invalidates all cached data |

---

## 4. Layer 2: Module State (SWR Server State)

### 4.1 Module State Ownership

| Module | SWR Hooks | SWR Key Pattern | Evidence |
|--------|-----------|-----------------|----------|
| M-01 Overview | `useApiScreenHealth`, `useApiRecentActivity` | `/workspace/{id}/health`, `/workspace/{id}/activity` | `08-dashboard-and-overview.md` §8.17 |
| M-02 Screens | `useApiScreens`, `useApiScreen`, `useApiBranches` | `/workspace/{id}/screens`, `/workspace/{id}/screens/{sid}`, `/workspace/{id}/branches` | `09-screens-feature.md` §9.8 |
| M-03 Content | `useApiPlaylists`, `useApiPlaylist`, `useApiMedia` | `/workspace/{id}/playlists`, `/workspace/{id}/playlists/{pid}`, `/workspace/{id}/media` | `10-playlists-and-studio.md` §10.8, `11-media-library.md` §11.8 |
| M-04 Scheduling | `useApiSchedules` | `/workspace/{id}/schedules?start={date}&end={date}` | `12-schedules-feature.md` §12.8 |
| M-05 Analytics | `useApiAnalytics` | `/workspace/{id}/analytics?period={period}` | `18-analytics-feature.md` §18.8 |
| M-06 Team | `useApiTeam` | `/workspace/{id}/team` | `16-team-feature.md` §16.4 |
| M-07 Settings | `useApiProfile`, `useApiBilling`, `useApiApiKeys` | `/auth/me`, `/workspace/{id}/billing`, `/workspace/{id}/api-keys` | `14-settings-feature.md` §14.8 |
| M-08 Admin | `useApiCustomers`, `useApiFleet`, `useApiHealth` | `/admin/customers`, `/admin/fleet`, `/admin/health` | `15-admin-panel.md` §15.17 |

### 4.2 Module State Rules

| Rule | Rationale |
|------|-----------|
| All SWR keys include workspace ID | Tenant isolation — data doesn't leak across workspaces |
| Workspace switch bumps data epoch → SWR revalidates all keys | Fresh data on context change |
| Each module owns its SWR hooks | No module creates hooks for another module's data |
| Cross-module reads use the owning module's hooks | Single source of truth for cached data |
| SWR mutations use `useSWRMutation` | Separates read and write concerns |
| No `revalidateOnFocus` globally (PC-04) | Prevents excessive API calls on tab switch |
| Per-hook `revalidateOnFocus: true` for Overview data only | Dashboard data should be fresh on return |

### 4.3 Realtime State (Socket.IO)

| Event | Handler | State Update | Evidence |
|-------|---------|-------------|----------|
| `screen:status` | NotificationProvider | Toast + bell badge + SWR revalidate screen | `07-workspace-management.md` §7.11 |
| `schedule:changed` | NotificationProvider | Toast + bell badge + SWR revalidate schedule | `12-schedules-feature.md` §12.8 |
| `pairing:activity` | WorkspaceProvider | Update pairing state | `07-workspace-management.md` §7.11 |
| `workspace:event` | NotificationProvider | Toast + bell badge | `07-workspace-management.md` §7.11 |

**Architecture rules:**
- All Socket.IO events are handled by Shell-level providers (NotificationProvider, WorkspaceProvider)
- Modules do not create their own Socket.IO connections
- Modules receive realtime updates via SWR revalidation triggered by Shell providers
- Socket.IO transport includes polling fallback (DD-07)

---

## 5. Layer 3: Component State (Local)

### 5.1 Component State Categories

| Category | Examples | Owner | Persistence |
|----------|----------|-------|-------------|
| Form state | Schedule creation form, settings form | Component | None (lost on unmount — future: form persistence) |
| Modal/dialog state | Open/close, selected item | Component | None |
| Sidebar state | Mobile nav open/close | CrystalShell | None |
| Studio canvas state | Konva stage, layers, timeline | Studio component | None (future: auto-save) |
| UI toggle state | Tab selection, filter expansion | Component | None |
| Drag-drop state | Dragged item, drop target | Component | None |

### 5.2 Component State Rules

| Rule | Rationale |
|------|-----------|
| Component state is never shared with other components directly | Use "lift state up" pattern or SWR for shared state |
| Form state is local until submitted | No global form state — forms are component-scoped |
| Studio canvas state stays in Studio component | Konva state is complex and tightly coupled — not shared |
| Modal state stays in the parent component that renders the modal | Modals are controlled by their parent |
| No component state in Shell providers | Shell providers hold only global application state |

---

## 6. State Flow Diagram

```
User Action (click, type, submit)
    │
    ▼
Component State Update (useState)
    │
    ├── If local only → Component re-renders → Done
    │
    ├── If server data needed → SWR mutation (useSWRMutation)
    │   │
    │   ├── API call (apiFetch with CSRF token)
    │   │   │
    │   │   ├── Success → SWR cache update → Component re-renders
    │   │   │              │
    │   │   │              └── Socket.IO event (if realtime) → NotificationProvider
    │   │   │                   │
    │   │   │                   └── Toast + Bell badge + SWR revalidate
    │   │   │
    │   │   └── Error → toastResponseError → Toast shown
    │   │
    │   └── Optimistic update (future) → UI updates immediately → Rollback on error
    │
    └── If global state change → Shell provider update (rare)
        │
        └── e.g., workspace switch → dataEpoch bump → SWR revalidates all
```

---

## 7. State Boundary Violations to Prevent

| Violation | Why It's Wrong | Prevention |
|-----------|---------------|------------|
| Module creating its own global Context | Leads to context bloat and re-render issues | Use SWR for server state, local state for UI |
| Component directly modifying WorkspaceProvider | Bypasses the workspace management logic | Use `setWorkspaceId` from `useWorkspace()` hook |
| Module creating its own Socket.IO connection | Duplicate connections, event handling conflicts | All Socket.IO goes through NotificationProvider |
| Two components fetching same data with different SWR keys | Cache duplication, inconsistent data | Share SWR hook (same key) |
| Storing server data in useState | Bypasses SWR caching, deduplication, revalidation | Use SWR for all server data |
| Storing form state in global context | Form state is transient and component-scoped | Keep form state in component |

---

## Cross-References

- See `12-module-boundaries.md` for module boundaries
- See `14-frontend-responsibilities.md` for frontend responsibilities
- See `transformation/16-state-strategy.md` for detailed state strategy
- See `transformation/24-design-decisions.md` DD-16 (SWR only), DD-21 (split WorkspaceProvider)
- See `transformation/25-design-constraints.md` TC-04 (SWR for server state), BCN-04 (Socket.IO)
