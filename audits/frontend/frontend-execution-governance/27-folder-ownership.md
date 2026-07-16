# 27 — Folder Ownership

> **Status:** FINAL — Folder structure, ownership, and organization rules

---

## 1. Purpose

Defines the folder structure for the Cloud-Screen frontend. Every file must be in its designated folder. No exceptions. Enforced by AI Constitution (Article VI, §6.2).

---

## 2. Root Structure

```
apps/
  dashboard/              ← Next.js application (ALL frontend code)
  backend/                ← NestJS API (NOT in scope for frontend)
  marketing/              ← Marketing site (NOT in scope — deferred)
  player/                 ← Player app (NOT in scope — deferred)
packages/
  ui/                     ← Design System V2 primitive + composite components
  config/                 ← Shared configuration
audits/
  frontend/               ← All documentation (read-only during implementation)
    design-system-v2/     ← DS V2 documentation (50 files)
    frontend-execution-governance/  ← Governance documentation (this folder)
    information-architecture/
    product-architecture/
    screen-specifications/
    transformation/
    user-flow-architecture/
    ux-blueprint/
```

---

## 3. Dashboard Application Structure

```
apps/dashboard/
  src/
    app/                          ← Next.js App Router
      (auth)/                     ← Auth route group
        login/
          page.tsx
        register/
          page.tsx
        forgot-password/
          page.tsx
        reset-password/
          page.tsx
        layout.tsx                ← Auth layout (centered card)
      (dashboard)/                ← Dashboard route group
        overview/
          page.tsx
        screens/
          page.tsx                ← Screens list
          [id]/
            page.tsx              ← Screen detail
          pair/
            page.tsx              ← Pairing wizard
        content/
          page.tsx                ← Content (tabs: playlists, media)
          playlists/
            [id]/
              page.tsx            ← Playlist detail
        studio/
          [id]/
            page.tsx              ← Studio editor
        scheduling/
          page.tsx                ← Scheduling calendar
        analytics/
          page.tsx                ← Analytics dashboard
        team/
          page.tsx                ← Team management
        settings/
          page.tsx                ← Settings (with tabs)
        notifications/
          page.tsx                ← Notifications history
        layout.tsx                ← Dashboard layout (sidebar + header + content)
      (admin)/                    ← Admin route group
        admin/
          customers/
            page.tsx
          staff/
            page.tsx
          users/
            page.tsx
          workspaces/
            page.tsx
          fleet/
            page.tsx
          health/
            page.tsx
          logs/
            page.tsx
          feature-flags/
            page.tsx
        layout.tsx                ← Admin layout (with impersonation banner)
      error.tsx                   ← Global error boundary
      not-found.tsx               ← Global 404
      layout.tsx                  ← Root layout (html, body, providers)
    features/                     ← Feature-based modules
      auth/
        components/               ← Auth-specific components
        hooks/                    ← Auth hooks (useLogin, useRegister)
        types.ts                  ← Auth types
        api.ts                    ← Auth API functions
      screens/
        components/               ← Screen domain components (ScreenCard, BulkActionBar)
        hooks/                    ← Screen hooks (useScreens, useScreenStatus)
        types.ts
        api.ts
      content/
        components/               ← Content domain components (PlaylistCard, MediaCard)
        hooks/
        types.ts
        api.ts
      studio/
        components/               ← Studio components (KonvaCanvas, MediaPanel, etc.)
        hooks/
        types.ts
        api.ts
      scheduling/
        components/               ← Scheduling components (CalendarGrid, ScheduleDialog)
        hooks/
        types.ts
        api.ts
      analytics/
        components/
        hooks/
        types.ts
        api.ts
      team/
        components/               ← Team components (MemberRow, PendingInviteRow)
        hooks/
        types.ts
        api.ts
      settings/
        components/               ← Settings components (PlanCard, ApiKeyRow, etc.)
        hooks/
        types.ts
        api.ts
      notifications/
        components/               ← Notification components (NotificationItem)
        hooks/
        types.ts
        api.ts
      admin/
        components/               ← Admin components (AdminTable, ImpersonationBanner)
        hooks/
        types.ts
        api.ts
    components/                   ← Shared components (cross-feature)
      layout/                     ← App shell (Sidebar, Header)
      navigation/                 ← Breadcrumbs, Pagination
      feedback/                   ← ErrorBoundary, OfflineBanner
      providers/                  ← Context providers (Theme, Locale, Auth)
    hooks/                        ← Shared hooks (cross-feature)
      use-debounce.ts
      use-media-query.ts
      use-socket.ts
    lib/                          ← Utilities and configuration
      api-client.ts               ← Centralized API fetcher
      socket-client.ts            ← Socket.IO client
      utils.ts                    ← General utilities (cn, formatters)
      validators.ts               ← Form validators
    types/                        ← Global TypeScript types
      api.ts                      ← API response types
      entities.ts                 ← Entity types (Screen, Playlist, etc.)
      common.ts                   ← Common types (Pagination, Filter, etc.)
    styles/                       ← Global styles
      globals.css                 ← Global CSS + CSS variables (tokens)
    i18n/                         ← Internationalization
      en.json                     ← English translations
      ar.json                     ← Arabic translations
  public/                         ← Static assets
    icons/                        ← App icons
    illustrations/                ← Empty state illustrations
    logo/                         ← Brand logo
```

---

## 4. Design System Package Structure

```
packages/ui/
  button/
    button.tsx
    button.test.tsx
    index.ts                      ← Barrel export
  input/
    input.tsx
    input.test.tsx
    index.ts
  textarea/
    textarea.tsx
    textarea.test.tsx
    index.ts
  password-input/
    password-input.tsx
    password-input.test.tsx
    index.ts
  checkbox/
    checkbox.tsx
    checkbox.test.tsx
    index.ts
  toggle/
    toggle.tsx
    toggle.test.tsx
    index.ts
  select/
    select.tsx
    select.test.tsx
    index.ts
  badge/
    badge.tsx
    badge.test.tsx
    index.ts
  avatar/
    avatar.tsx
    avatar.test.tsx
    index.ts
  card/
    card.tsx                      ← Card + CardHeader + CardTitle + CardContent + CardFooter
    card.test.tsx
    index.ts
  table/
    table.tsx                     ← Table + TableHeader + TableRow + TableHead + TableBody + TableCell
    table.test.tsx
    index.ts
  list/
    list.tsx                      ← List + ListItem + ListItemIcon + ListItemContent + etc.
    list.test.tsx
    index.ts
  dialog/
    dialog.tsx                    ← Dialog + DialogHeader + DialogTitle + DialogContent + etc.
    dialog.test.tsx
    index.ts
  alert-dialog/
    alert-dialog.tsx
    alert-dialog.test.tsx
    index.ts
  drawer/
    drawer.tsx
    drawer.test.tsx
    index.ts
  toast/
    toast.tsx
    toast.test.tsx
    index.ts
  tabs/
    tabs.tsx
    tabs.test.tsx
    index.ts
  breadcrumbs/
    breadcrumbs.tsx
    breadcrumbs.test.tsx
    index.ts
  pagination/
    pagination.tsx
    pagination.test.tsx
    index.ts
  step-indicator/
    step-indicator.tsx
    step-indicator.test.tsx
    index.ts
  search-input/
    search-input.tsx
    search-input.test.tsx
    index.ts
  filter-select/
    filter-select.tsx
    filter-select.test.tsx
    index.ts
  sort-select/
    sort-select.tsx
    sort-select.test.tsx
    index.ts
  empty-state/
    empty-state.tsx
    empty-state.test.tsx
    index.ts
  error-state/
    error-state.tsx
    error-state.test.tsx
    index.ts
  skeleton/
    skeleton.tsx
    skeleton.test.tsx
    index.ts
  spinner/
    spinner.tsx
    spinner.test.tsx
    index.ts
  progress-bar/
    progress-bar.tsx
    progress-bar.test.tsx
    index.ts
  label/
    label.tsx
    label.test.tsx
    index.ts
  separator/
    separator.tsx
    separator.test.tsx
    index.ts
  form-field/
    form-field.tsx                ← FormField + Label + HelperText + FormError
    form-field.test.tsx
    index.ts
  date-picker/
    date-picker.tsx
    date-picker.test.tsx
    index.ts
  editable-text/
    editable-text.tsx
    editable-text.test.tsx
    index.ts
  index.ts                        ← Master barrel export (all components)
```

---

## 5. Folder Rules

### §5.1 No Cross-Feature Imports
Features may NOT import from other features' internal directories:
```
❌ features/screens/components/ importing from features/content/hooks/
✅ features/screens/components/ importing from packages/ui/
✅ features/screens/components/ importing from src/components/
✅ features/screens/components/ importing from src/hooks/
```

### §5.2 Shared Components Only in `src/components/`
Components used across multiple features go in `src/components/`, not in a feature folder.

### §5.3 Feature Components in Feature Folders
Components used only by one feature go in that feature's `components/` folder.

### §5.4 Design System in `packages/ui/`
Primitive and composite components go in `packages/ui/`. Domain components go in feature folders.

### §5.5 No Orphaned Files
Every file must belong to a logical folder. No loose files in `src/`.

### §5.6 No Nested Feature Folders
Features don't nest inside each other:
```
❌ features/screens/content/
✅ features/screens/ and features/content/ (separate)
```

### §5.7 Test Files Next to Source
Test files live next to the source file:
```
✅ button/button.tsx + button/button.test.tsx
❌ __tests__/button.test.tsx (separate test folder)
```

### §5.8 Documentation is Read-Only
The `audits/frontend/` directory is read-only during implementation. No implementation code goes in documentation folders.

---

## 6. Folder Ownership Matrix

| Folder | Owner | What Goes Here |
|--------|-------|---------------|
| `packages/ui/` | Design System | Primitive + composite components |
| `src/app/` | Next.js | Pages and layouts only |
| `src/features/[feature]/components/` | Feature team | Domain components for that feature |
| `src/features/[feature]/hooks/` | Feature team | Hooks for that feature |
| `src/components/` | All teams | Shared cross-feature components |
| `src/hooks/` | All teams | Shared cross-feature hooks |
| `src/lib/` | All teams | Utilities, API client, config |
| `src/types/` | All teams | Global TypeScript types |
| `src/styles/` | All teams | Global CSS, token definitions |
| `src/i18n/` | All teams | Translation files |
| `public/` | All teams | Static assets |

---

## Cross-References

- See `01-ai-constitution.md` Article VI §6.2 for folder ownership
- See `28-file-ownership.md` for file-level rules
- See `29-naming-enforcement.md` for naming conventions
- See `12-frontend-architecture-rules.md` §5 for architecture
- See `design-system-v2/11-component-taxonomy.md` for component layers
