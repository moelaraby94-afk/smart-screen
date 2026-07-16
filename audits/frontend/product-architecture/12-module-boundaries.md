# Module Boundaries

> **Evidence basis:** `09-product-modules.md`, `10-module-responsibilities.md`, `11-feature-ownership.md`, `16-state-strategy.md` (transformation)
> **Purpose:** Define clear boundaries between modules — what crosses boundaries, what doesn't, and how modules communicate

---

## 1. Boundary Principles

### 1.1 Encapsulation

Each module encapsulates its entities, screens, and business logic. A module's internal implementation is not visible to other modules.

### 1.2 Communication via Interfaces

Modules communicate through well-defined interfaces:
- **Data interfaces:** SWR hooks that expose data to other modules
- **Navigation interfaces:** Links and redirects between module pages
- **Event interfaces:** Socket.IO events and context values
- **Component interfaces:** Shared UI components (primitives, not feature components)

### 1.3 No Direct Cross-Module State Access

A module must not directly access another module's internal state (Context, useReducer, useState). Cross-module data sharing goes through:
- SWR cache (shared server state)
- React Context at the Shell level (workspace, auth, notifications)
- URL parameters (navigation state)

---

## 2. Boundary Matrix

### 2.1 What Crosses Boundaries

| From Module | To Module | What Crosses | How | Direction |
|-------------|-----------|-------------|-----|-----------|
| M-01 Overview | M-02 Screens | Quick action link to pairing wizard | Navigation (Link) | One-way |
| M-01 Overview | M-03 Content | Quick action link to create playlist | Navigation (Link) | One-way |
| M-02 Screens | M-03 Content | Playlist selection for screen assignment | SWR cache (playlist list) | Read-only |
| M-02 Screens | M-04 Scheduling | Active schedules for screen detail | SWR cache (schedule list) | Read-only |
| M-03 Content | M-02 Screens | Publish action assigns playlist to screen | API call (mutation) | Write |
| M-04 Scheduling | M-03 Content | Playlist selection for schedule | SWR cache (playlist list) | Read-only |
| M-04 Scheduling | M-02 Screens | Screen selection for schedule | SWR cache (screen list) | Read-only |
| M-04 Scheduling | M-02 Screens | Conflict detection result | SWR cache / event | Read-only |
| M-05 Analytics | M-02 Screens | Aggregated screen data | SWR cache (analytics endpoint) | Read-only |
| M-05 Analytics | M-03 Content | Aggregated content data | SWR cache (analytics endpoint) | Read-only |
| M-06 Team | All modules | Current user role | React Context (WorkspaceProvider) | Read-only |
| M-07 Settings | Shell | Workspace branding | React Context (BrandingProvider) | Read-only |
| M-07 Settings | M-04 Scheduling | Islamic feature config (prayer times) | React Context / SWR | Read-only |
| M-08 Admin | All modules | Feature flags | React Context / SWR | Read-only |
| M-08 Admin | Shell | Impersonation state | React Context (WorkspaceProvider) | Read-only |

### 2.2 What Does NOT Cross Boundaries

| Rule | Rationale |
|------|-----------|
| M-02 Screens does not create playlists | Playlist creation is M-03 Content's responsibility |
| M-03 Content does not manage screens | Screen management is M-02 Screens' responsibility |
| M-04 Scheduling does not create playlists or screens | It references existing ones from M-03 and M-02 |
| M-05 Analytics does not modify any data | Analytics is read-only |
| M-06 Team does not manage settings | Settings are M-07's responsibility |
| M-07 Settings does not manage team members | Team management is M-06's responsibility |
| M-08 Admin does not directly modify client data | Admin uses impersonation to access client features |
| No module directly accesses another module's component state | All cross-module data goes through SWR or Context |

---

## 3. Module Boundary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shell Layer                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Theme       │  │ Locale       │  │ Workspace            │    │
│  │ Provider    │  │ Provider     │  │ Provider             │    │
│  │             │  │              │  │ (auth, ws, admin)    │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐    │
│  │ Notification│  │ Branding     │  │ Header Meta          │    │
│  │ Provider    │  │ Provider     │  │ Context              │    │
│  └─────────────┘  └──────────────┘  └──────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
           │              │              │
           ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  M-01    │  │  M-02    │  │  M-03    │  │  M-04    │  │  M-05    │
│ Overview │  │ Screens  │  │ Content  │  │Scheduling│  │ Analytics│
│          │  │          │  │          │  │          │  │          │
│ reads:   │  │ reads:   │  │ reads:   │  │ reads:   │  │ reads:   │
│ screen   │  │ playlist │  │ media    │  │ playlist │  │ screen   │
│ health   │  │ schedule │  │ template │  │ screen   │  │ content  │
│ activity │  │ branch   │  │          │  │          │  │          │
│          │  │          │  │          │  │          │  │          │
│ writes:  │  │ writes:  │  │ writes:  │  │ writes:  │  │ writes:  │
│ (none)   │  │ screen   │  │ playlist │  │ schedule │  │ (none)   │
│          │  │ branch   │  │ media    │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
                   ▲              ▲              ▲
                   │              │              │
              ┌────┴────┐    ┌────┴────┐    ┌────┴────┐
              │  M-06   │    │  M-07   │    │  M-08   │
              │  Team   │    │Settings │    │  Admin  │
              │         │    │         │    │         │
              │ writes: │    │ writes: │    │ writes: │
              │ member  │    │ profile │    │ staff   │
              │ invite  │    │ ws set  │    │ flags   │
              │ role    │    │ billing │    │ imperson │
              └─────────┘    └─────────┘    └─────────┘
```

---

## 4. Shared Infrastructure (Shell Layer)

The Shell Layer provides cross-cutting infrastructure that all modules consume. This is NOT module-specific state — it's application-level state.

| Provider | Scope | What It Provides | Consumer Modules |
|----------|-------|-----------------|-----------------|
| ThemeProvider | Global | Dark/light theme | All |
| LocaleProvider | Global | Active locale, translations | All |
| WorkspaceProvider | Global | Auth state, active workspace, workspace list, data epoch | All |
| NotificationProvider | Global | Notifications, Socket.IO connection, toast | All |
| BrandingProvider | Workspace | Logo, colors | Shell, M-07 writes |
| HeaderMetaContext | Route | Page title, kicker, back button | Shell, all modules write |

**Architecture rule:** Modules must not create their own global providers. All global state lives in the Shell Layer. Module-specific state stays within the module's components.

---

## 5. Data Boundary Rules

### 5.1 SWR Cache Boundaries

| Rule | Rationale |
|------|-----------|
| All SWR keys include workspace ID | Tenant isolation — data from one workspace doesn't leak to another |
| Module-specific hooks are prefixed with module name | e.g., `useApiScreens`, `useApiPlaylists`, `useApiSchedules` |
| Cross-module data access uses the owning module's hook | M-02 reads playlists via `useApiPlaylists` (owned by M-03) |
| No module creates its own SWR hook for another module's data | Prevents duplicate fetching and cache inconsistency |

### 5.2 API Boundary Rules

| Rule | Rationale |
|------|-----------|
| Each module has its own API endpoints | `/screens/*`, `/playlists/*`, `/schedules/*`, etc. |
| No module calls another module's write endpoints directly | M-03 publishes via its own publish endpoint, not M-02's screen update |
| Cross-module reads use the owning module's GET endpoints | M-02 reads playlists via `/playlists` (owned by M-03) |

### 5.3 Component Boundary Rules

| Rule | Rationale |
|------|-----------|
| UI primitives (Button, Input, Dialog) are shared | All modules use the same component library |
| Feature components (ScreenCard, PlaylistCard) are module-owned | M-02 owns ScreenCard, M-03 owns PlaylistCard |
| No module imports another module's feature components directly | If M-01 needs ScreenCard, it uses a shared export or re-creates a minimal version |
| Layout components (ShellSidebar, ShellHeader) are Shell-owned | All modules consume the same Shell |

---

## 6. Boundary Violations to Prevent

| Violation | Why It's Wrong | Prevention |
|-----------|---------------|------------|
| M-02 Screens importing Studio from M-03 | Screens shouldn't know about Studio internals | M-02 links to playlist detail; M-03 opens Studio |
| M-04 Scheduling creating playlists | Scheduling references playlists, doesn't create them | Schedule form uses playlist selector (read-only) |
| M-07 Settings managing team members | Team management is M-06's responsibility | Settings links to Team section |
| Any module modifying WorkspaceProvider state directly | Workspace state is Shell-managed | Modules consume context, don't modify it |
| M-08 Admin directly editing client data | Admin should use impersonation | Admin views data; changes via impersonation |
| Two modules fetching the same data with different SWR keys | Cache duplication, inconsistent data | Use the owning module's hook |

---

## Cross-References

- See `09-product-modules.md` for module definitions
- See `10-module-responsibilities.md` for module responsibilities
- See `11-feature-ownership.md` for feature-to-module mapping
- See `13-frontend-state-boundaries.md` for state boundaries per module
- See `transformation/16-state-strategy.md` for state management strategy
- See `transformation/15-component-strategy.md` for component architecture
