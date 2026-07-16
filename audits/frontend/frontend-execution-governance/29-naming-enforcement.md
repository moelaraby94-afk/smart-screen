# 29 — Naming Enforcement

> **Status:** FINAL — Naming conventions for files, components, tokens, functions

---

## 1. Purpose

Defines the naming conventions that MUST be followed for all frontend code. Enforced by AI Constitution (Article VI, §6.3).

---

## 2. Component Naming

### 2.1 Convention
- **PascalCase** for component names: `ScreenCard`, `PlaylistCard`, `MetricCard`
- **Entity prefix** for domain components: `ScreenCard`, not `Card` (ambiguous)
- **Sub-component prefix** with parent: `CardHeader`, `CardTitle`, `CardContent`
- **No abbreviations**: `NotificationBell`, not `NotifBell`
- **No "Wrapper" suffix**: Use the actual component type
- **No "Custom" prefix**: Every component is custom
- **No "My" prefix**: Every component is ours

### 2.2 Pattern
```
[Entity][Role][Type]
```

Examples:
- `ScreenCard` — Entity: Screen, Type: Card
- `PlaylistCard` — Entity: Playlist, Type: Card
- `MemberRow` — Entity: Member, Type: Row
- `NotificationBell` — Entity: Notification, Role: Bell
- `BulkActionBar` — Entity: BulkAction, Type: Bar
- `FeatureFlagToggle` — Entity: FeatureFlag, Type: Toggle
- `KonvaCanvas` — Entity: Konva, Type: Canvas

### 2.3 Sub-Component Naming
```
[Parent][Sub-component]
```

Examples:
- `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `DialogHeader`, `DialogTitle`, `DialogContent`, `DialogFooter`
- `TableHeader`, `TableRow`, `TableHead`, `TableBody`, `TableCell`
- `ListItem`, `ListItemIcon`, `ListItemContent`, `ListItemAction`
- `ToastIcon`, `ToastContent`, `ToastAction`, `ToastClose`
- `TabsList`, `TabsTrigger`, `TabsContent`
- `SidebarHeader`, `SidebarNav`, `SidebarItem`, `SidebarSection`

---

## 3. File Naming

### 3.1 Convention
- **kebab-case** for all files: `screen-card.tsx`, not `ScreenCard.tsx`
- **One component per file** (except small sub-components)
- **Test files**: `[name].test.tsx` or `[name].test.ts`
- **Index files**: `index.ts` (barrel exports)

### 3.2 Examples
| Component | File Name |
|-----------|-----------|
| `Button` | `button.tsx` |
| `ScreenCard` | `screen-card.tsx` |
| `NotificationBell` | `notification-bell.tsx` |
| `FeatureFlagToggle` | `feature-flag-toggle.tsx` |
| `useScreens` | `use-screens.ts` |
| `apiClient` | `api-client.ts` |

---

## 4. Hook Naming

### 4.1 Convention
- **`use[Feature]`** pattern: `useScreens`, `usePlaylists`, `useMediaUpload`
- **Descriptive**: `useScreenStatus`, not `useStatus`
- **No abbreviations**: `useNotifications`, not `useNotifs`

### 4.2 Examples
| Hook | File |
|------|------|
| `useScreens` | `use-screens.ts` |
| `useScreenStatus` | `use-screen-status.ts` |
| `useMediaUpload` | `use-media-upload.ts` |
| `useDebounce` | `use-debounce.ts` |
| `useSocket` | `use-socket.ts` |

---

## 5. Token Naming

### 5.1 Convention
- **`--{category}-{property}-{scale}`** pattern
- **Always `--` prefix** (CSS custom property)
- **Always lowercase**
- **Hyphens as separators**

### 5.2 Examples
| Token | Category | Scale |
|-------|----------|-------|
| `--color-primary` | color | primary |
| `--color-destructive` | color | destructive |
| `--space-4` | space | 4 |
| `--text-base` | text | base |
| `--radius-lg` | radius | lg |
| `--shadow-sm` | shadow | sm |
| `--duration-fast` | duration | fast |
| `--ease-default` | ease | default |
| `--z-modal` | z | modal |

See `design-system-v2/40-token-naming.md` for full details.

---

## 6. Function Naming

### 6.1 Convention
- **camelCase** for functions: `fetchScreens`, `formatDate`, `handleClick`
- **Descriptive**: `fetchScreens`, not `getData`
- **Action verbs**: `fetch`, `create`, `update`, `delete`, `format`, `validate`, `handle`
- **No abbreviations**: `formatDuration`, not `fmtDur`

### 6.2 Event Handlers
- **`handle[Event]`** pattern: `handleClick`, `handleSubmit`, `handleSelect`
- **`on[Event]`** for props: `onClick`, `onSubmit`, `onSelect`

### 6.3 Boolean Functions
- **`is[Condition]`** or **`has[Feature]`**: `isLoading`, `hasError`, `isEmpty`, `canEdit`

---

## 7. Variable Naming

### 7.1 Convention
- **camelCase** for variables: `screenData`, `playlistItems`, `isLoading`
- **Descriptive**: `screensList`, not `data`
- **No single letters** (except loop indices): `screen`, not `s`
- **No abbreviations**: `notification`, not `notif`
- **Booleans prefixed**: `isLoading`, `hasError`, `canEdit`, `shouldFetch`

### 7.2 Constants
- **UPPER_SNAKE_CASE** for constants: `API_BASE_URL`, `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`
- **Named, not magic**: `const MAX_FILE_SIZE = 100 * 1024 * 1024`, not `104857600`

---

## 8. Type Naming

### 8.1 Convention
- **PascalCase** for types and interfaces: `Screen`, `Playlist`, `ButtonProps`
- **Descriptive**: `ScreenCardProps`, not `SCProps`
- **Props suffix**: `ButtonProps`, `InputProps`, `DialogProps`
- **No `I` prefix**: `ButtonProps`, not `IButtonProps`

### 8.2 Enum-like Unions
- **String literal unions**: `type ButtonVariant = 'default' | 'outline' | 'ghost'`
- **Not enums** (unless reverse mapping needed)

---

## 9. Route Naming

### 9.1 Convention
- **kebab-case** for routes: `/screens`, `/content/playlists`, `/feature-flags`
- **Dynamic params**: `[id]` in Next.js App Router
- **Route groups**: `(auth)`, `(dashboard)`, `(admin)`

### 9.2 Examples
| Route | File |
|-------|------|
| `/login` | `app/(auth)/login/page.tsx` |
| `/screens` | `app/(dashboard)/screens/page.tsx` |
| `/screens/[id]` | `app/(dashboard)/screens/[id]/page.tsx` |
| `/admin/feature-flags` | `app/(admin)/admin/feature-flags/page.tsx` |

---

## 10. Translation Key Naming

### 10.1 Convention
- **`namespace.key`** pattern: `screens.title`, `common.save`, `errors.networkError`
- **Nested with dots**: `screens.list.emptyTitle`, `settings.billing.currentPlan`
- **No hardcoded strings**: All user-facing text uses translation keys

### 10.2 Namespaces
| Namespace | Usage |
|-----------|-------|
| `common.*` | Shared terms (save, cancel, delete, edit, search, filter) |
| `screens.*` | Screen-specific text |
| `content.*` | Content tab text |
| `studio.*` | Studio text |
| `scheduling.*` | Scheduling text |
| `analytics.*` | Analytics text |
| `team.*` | Team text |
| `settings.*` | Settings text |
| `notifications.*` | Notifications text |
| `admin.*` | Admin text |
| `auth.*` | Authentication text |
| `errors.*` | Error messages |
| `success.*` | Success messages |
| `validation.*` | Validation messages |

---

## 11. Naming Enforcement Rules

### §11.1 No Inconsistent Naming
All names must follow the conventions above. No mixing of conventions.

### §11.2 No Abbreviations
Full words only. `Notification`, not `Notif`. `Button`, not `Btn`. `Properties`, not `Props` (except for the `Props` suffix on type interfaces).

### §11.3 No Generic Names
Domain components must have entity prefix. `ScreenCard`, not `Card`. `MemberRow`, not `Row`.

### §11.4 No Magic Strings
All string literals that are used as identifiers (routes, events, API paths, translation keys) must be named constants.

### §11.5 No Magic Numbers
All numeric literals must be named constants or design tokens.

---

## 12. Naming Compliance Checklist

- [ ] Components: PascalCase with entity prefix
- [ ] Files: kebab-case
- [ ] Hooks: `use[Feature]` pattern
- [ ] Tokens: `--{category}-{property}-{scale}`
- [ ] Functions: camelCase with action verbs
- [ ] Variables: camelCase, descriptive
- [ ] Constants: UPPER_SNAKE_CASE
- [ ] Types: PascalCase with `Props` suffix
- [ ] Routes: kebab-case
- [ ] Translation keys: `namespace.key`
- [ ] No abbreviations
- [ ] No magic strings or numbers

---

## Cross-References

- See `01-ai-constitution.md` Article VI §6.3 for naming enforcement
- See `design-system-v2/40-token-naming.md` for token naming
- See `design-system-v2/41-component-naming.md` for component naming
- See `information-architecture/08-naming-and-conventions.md` for IA naming
- See `27-folder-ownership.md` for folder rules
- See `28-file-ownership.md` for file rules
