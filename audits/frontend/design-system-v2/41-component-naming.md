# 41 — Component Naming

> **Evidence basis:** `11-component-taxonomy.md`, `product-architecture/14-frontend-component-architecture.md`, `information-architecture/08-component-inventory.md`

---

## 1. Component Naming Philosophy

Component names must be **descriptive, consistent, and unambiguous**. A developer should understand what a component does from its name alone. Names follow **PascalCase** and use domain terminology from the product.

---

## 2. Naming Convention

### 2.1 Pattern

```
[Entity][Role][Type]
```

### 2.2 Examples

| Component | Entity | Role | Type | Layer |
|-----------|--------|------|------|-------|
| `Button` | — | — | Button | Primitive |
| `Input` | — | — | Input | Primitive |
| `Card` | — | — | Card | Composite |
| `Table` | — | — | Table | Composite |
| `Dialog` | — | — | Dialog | Composite |
| `ScreenCard` | Screen | — | Card | Domain |
| `PlaylistCard` | Playlist | — | Card | Domain |
| `MediaCard` | Media | — | Card | Domain |
| `MetricCard` | Metric | — | Card | Domain |
| `PlanCard` | Plan | — | Card | Domain |
| `TemplateCard` | Template | — | Card | Domain |
| `MemberRow` | Member | — | Row | Domain |
| `ApiKeyRow` | ApiKey | — | Row | Domain |
| `NotificationItem` | Notification | — | Item | Domain |
| `PendingInviteRow` | PendingInvite | — | Row | Domain |
| `FeatureFlagToggle` | FeatureFlag | — | Toggle | Domain |
| `NotificationBell` | Notification | Bell | — | Domain |
| `WorkspaceSwitcher` | Workspace | Switcher | — | Domain |
| `UserMenu` | User | Menu | — | Domain |
| `BulkActionBar` | BulkAction | — | Bar | Domain |
| `FilterToolbar` | Filter | — | Toolbar | Domain |
| `SearchInput` | Search | — | Input | Composite |
| `FilterSelect` | Filter | — | Select | Composite |
| `SortSelect` | Sort | — | Select | Composite |
| `UploadDropZone` | Upload | Drop | Zone | Domain |
| `UploadProgressList` | UploadProgress | — | List | Domain |
| `StepIndicator` | Step | Indicator | — | Composite |
| `EmptyState` | Empty | — | State | Composite |
| `ErrorState` | Error | — | State | Composite |
| `SuccessState` | Success | — | State | Composite |
| `OnboardingCard` | Onboarding | — | Card | Domain |
| `OnboardingStep` | Onboarding | Step | — | Domain |
| `CalendarGrid` | Calendar | — | Grid | Domain |
| `CalendarDay` | Calendar | Day | — | Domain |
| `ScheduleEvent` | Schedule | Event | — | Domain |
| `ScheduleDialog` | Schedule | — | Dialog | Domain |
| `KonvaCanvas` | Konva | — | Canvas | Domain |
| `LayerProperties` | Layer | Properties | — | Domain |
| `LayerList` | Layer | — | List | Domain |
| `MediaPanel` | Media | Panel | — | Domain |
| `PropertiesPanel` | Properties | Panel | — | Domain |
| `StudioToolbar` | Studio | — | Toolbar | Domain |
| `ImpersonationBanner` | Impersonation | — | Banner | Domain |
| `HealthStatusCard` | HealthStatus | — | Card | Domain |
| `LogLevelBadge` | LogLevel | — | Badge | Domain |

---

## 3. Sub-Component Naming

Sub-components use the parent component name as a prefix.

### 3.1 Pattern

```
[Parent][Sub-component]
```

### 3.2 Examples

| Parent | Sub-component | Full Name |
|--------|--------------|-----------|
| `Card` | Header | `CardHeader` |
| `Card` | Title | `CardTitle` |
| `Card` | Content | `CardContent` |
| `Card` | Footer | `CardFooter` |
| `Dialog` | Header | `DialogHeader` |
| `Dialog` | Title | `DialogTitle` |
| `Dialog` | Description | `DialogDescription` |
| `Dialog` | Content | `DialogContent` |
| `Dialog` | Footer | `DialogFooter` |
| `Table` | Header | `TableHeader` |
| `Table` | Head | `TableHead` |
| `Table` | Body | `TableBody` |
| `Table` | Row | `TableRow` |
| `Table` | Cell | `TableCell` |
| `List` | Item | `ListItem` |
| `List` | ItemIcon | `ListItemIcon` |
| `List` | ItemContent | `ListItemContent` |
| `List` | ItemTitle | `ListItemTitle` |
| `List` | ItemSubtitle | `ListItemSubtitle` |
| `List` | ItemAction | `ListItemAction` |
| `Toast` | Icon | `ToastIcon` |
| `Toast` | Content | `ToastContent` |
| `Toast` | Action | `ToastAction` |
| `Toast` | Close | `ToastClose` |
| `Tabs` | List | `TabsList` |
| `Tabs` | Trigger | `TabsTrigger` |
| `Tabs` | Content | `TabsContent` |
| `Sidebar` | Header | `SidebarHeader` |
| `Sidebar` | Nav | `SidebarNav` |
| `Sidebar` | Item | `SidebarItem` |
| `Sidebar` | Section | `SidebarSection` |

---

## 4. Naming Rules

1. **PascalCase** — `ScreenCard`, not `screenCard` or `screen-card`
2. **Noun-based** — Components are things, not actions (`Button`, not `Submit`)
3. **Entity prefix for domain components** — `ScreenCard`, not `Card` (for screens)
4. **No abbreviations** — `NotificationBell`, not `NotifBell`
5. **No generic names for domain components** — `ScreenCard`, not `Card` (ambiguous)
6. **Suffix indicates type** — `Card`, `Row`, `List`, `Dialog`, `Bar`, `Panel`, `Badge`, `Toggle`
7. **Sub-components prefixed with parent** — `CardHeader`, not `Header` (ambiguous)
8. **No "Wrapper" suffix** — use the actual component type
9. **No "Custom" prefix** — every component is custom
10. **No "My" prefix** — every component is ours
11. **Consistent suffixes** — use the same suffix for the same type across all components
12. **File name matches component name** — `ScreenCard.tsx` exports `ScreenCard`

---

## 5. File Naming

| Component | File Name | Location |
|-----------|-----------|----------|
| `Button` | `button.tsx` | `packages/ui/` |
| `Input` | `input.tsx` | `packages/ui/` |
| `Card` | `card.tsx` | `packages/ui/` |
| `Dialog` | `dialog.tsx` | `packages/ui/` |
| `ScreenCard` | `screen-card.tsx` | `apps/dashboard/src/features/screens/` |
| `PlaylistCard` | `playlist-card.tsx` | `apps/dashboard/src/features/playlists/` |
| `MediaCard` | `media-card.tsx` | `apps/dashboard/src/features/media/` |
| `KonvaCanvas` | `konva-canvas.tsx` | `apps/dashboard/src/features/studio/` |

### File Naming Rules
- **kebab-case** for file names: `screen-card.tsx`, not `ScreenCard.tsx`
- **One component per file** (except sub-components, which can be in parent file)
- **Index file** (`index.ts`) for barrel exports

---

## Cross-References

- See `11-component-taxonomy.md` for the full component inventory
- See `40-token-naming.md` for token naming conventions
- See `42-variant-rules.md` for variant naming
- See `product-architecture/14-frontend-component-architecture.md` for architecture
- See `information-architecture/08-component-inventory.md` for IA inventory
