# Component Strategy

> **Evidence basis:** `05-ui-component-library.md`, `14-design-system-direction.md`, `01-architecture-and-stack.md`, `04-layout-and-shell.md`
> **Purpose:** Define the component architecture strategy for the transformation

---

## 1. Current Component Architecture

### 1.1 Component Layers

```
Layer 1: Primitives (Radix UI)
  ├── Dialog, AlertDialog, DropdownMenu, Select, Switch, Tabs, Checkbox, Label
  └── (Missing: Tooltip, Popover, Calendar, Avatar)

Layer 2: Styled Components (Custom, built on Radix)
  ├── Button (CVA variants), Badge (CVA variants), Input, Select, Checkbox, Switch, Label
  ├── Dialog, AlertDialog, DropdownMenu, Table, Tabs
  ├── EmptyState, InfoTooltip (custom, not Radix), Skeleton
  └── Card, CardHeader, CardTitle, CardContent, CardFooter

Layer 3: Feature Components
  ├── ScreenCard, PlaylistCard, MediaCard, BranchCard
  ├── ScreenSetupModal, CreatePlaylistWizard, ScheduleCreateDialog
  ├── WorkspaceSwitcher, NotificationBell, UserMenu
  └── Studio (Konva canvas), Timeline, LayerPanel, PropertyPanel

Layer 4: Layout Components
  ├── CrystalShell, ShellSidebar, ShellHeader, Breadcrumbs
  ├── WorkspaceGate, PageTransition, ImpersonationReturnButton
  └── AuroraBackdrop (dead code)
```

### 1.2 Component Quality Assessment

| Component | Quality | Issues | Evidence |
|-----------|---------|--------|----------|
| Button | Good | Touch target < 44px | `24-accessibility-audit.md` §24.7 |
| Badge | Good | None | `05-ui-component-library.md` §6.6 |
| Input | Good | Height inconsistency (h-10 vs h-11) | `02-design-system-and-tokens.md` §2.20 |
| Select | Good | None | — |
| Switch | **Broken** | RTL bug | P-001 |
| Dialog | Good | None | — |
| AlertDialog | Good | None | — |
| DropdownMenu | Good | None | — |
| Table | Good | No bulk select | `05-ui-component-library.md` §6.7 |
| Tabs | Good | None | — |
| EmptyState | Good | No variants | `05-ui-component-library.md` §6.7 |
| InfoTooltip | **Poor** | No ARIA, custom impl | P-005 |
| Skeleton | Good | Missing patterns | `05-ui-component-library.md` §6.8 |
| Card | Good | None | — |

---

## 2. Component Strategy Direction

### 2.1 Principle: Radix First

**Rule:** All interactive UI components should be built on Radix UI primitives. Custom implementations are only acceptable when no Radix primitive exists.

**Current violations:**
- `InfoTooltip` — custom implementation, should use `@radix-ui/react-tooltip`
- `EmptyState` — acceptable as custom (no Radix equivalent)

**Action:** Install `@radix-ui/react-tooltip` and replace `InfoTooltip` with a Radix-based Tooltip component.

### 2.2 Principle: CVA for Variants

**Rule:** All components with visual variants should use `class-variance-authority` (CVA).

**Current compliance:**
- ✅ Button uses CVA
- ✅ Badge uses CVA
- ❌ EmptyState doesn't use CVA (needs variant prop)
- ❌ Skeleton doesn't use CVA (needs pattern variants)

**Action:** Add CVA variants to EmptyState and Skeleton.

### 2.3 Principle: Composition Over Configuration

**Rule:** Components should be composable (small parts combined) rather than monolithic (one component with many props).

**Current compliance:**
- ✅ Card is composable (CardHeader, CardTitle, CardContent, CardFooter)
- ✅ Dialog is composable (DialogHeader, DialogTitle, DialogDescription, DialogFooter)
- ⚠️ Studio is monolithic (large component with many responsibilities)

**Action:** Consider decomposing Studio into smaller composable parts (Canvas, Toolbar, Timeline, LayerPanel, PropertyPanel as independent components).

### 2.4 Principle: Consistent API Patterns

**Rule:** All components should follow consistent API patterns:
- `asChild` prop for polymorphic rendering (via Radix Slot)
- `className` prop for override (via `cn()` merge)
- Variant props via CVA
- Size props via CVA
- `disabled` prop on all interactive components
- `aria-*` props pass-through

**Current compliance:** Mostly good — Radix-based components inherit these patterns. Custom components (InfoTooltip, EmptyState) may not follow all patterns.

---

## 3. New Components Needed

### 3.1 Tooltip (Radix-based)

| Field | Value |
|-------|-------|
| Priority | High (P-005) |
| Dependency | `@radix-ui/react-tooltip` package |
| Replaces | `InfoTooltip` |
| API | `<Tooltip><TooltipTrigger /><TooltipContent /></Tooltip>` |
| Features | `role="tooltip"`, `aria-describedby`, show/hide delay, keyboard accessible |
| Phase | Phase 1 |

### 3.2 Avatar

| Field | Value |
|-------|-------|
| Priority | Medium |
| Dependency | `@radix-ui/react-avatar` (or custom) |
| Used for | User menu, team member list, admin customer list |
| API | `<Avatar src={url} fallback={initials} />` |
| Features | Image with fallback, size variants |
| Phase | Phase 2 |

### 3.3 Pagination

| Field | Value |
|-------|-------|
| Priority | Medium |
| Dependency | None |
| Used for | Screen list, media library, admin tables, notifications |
| API | `<Pagination page={n} totalPages={n} onPageChange={fn} />` |
| Features | Page numbers, prev/next, ellipsis, keyboard accessible |
| Phase | Phase 4 |

### 3.4 BulkActionBar

| Field | Value |
|-------|-------|
| Priority | High (E-004) |
| Dependency | Checkbox component (already have) |
| Used for | Screen list, media library, team management |
| API | `<BulkActionBar selectedCount={n} onClear={fn} actions={[...]} />` |
| Features | Sticky bar, selected count, action buttons, clear selection |
| Phase | Phase 5-6 |

### 3.5 SearchInput

| Field | Value |
|-------|-------|
| Priority | High (F-HP-03) |
| Dependency | None |
| Used for | Screen list, media library, branch list, workspace switcher |
| API | `<SearchInput value={q} onChange={fn} placeholder={t('search')} />` |
| Features | Debounced input, clear button, search icon |
| Phase | Phase 2-6 |

### 3.6 FilterBar

| Field | Value |
|-------|-------|
| Priority | High (F-HP-03) |
| Dependency | Select component (already have) |
| Used for | Screen list (filter by branch, status), media library (filter by type) |
| API | `<FilterBar filters={[...]} onFilterChange={fn} />` |
| Features | Multiple filter selects, active filter display, clear all |
| Phase | Phase 5-6 |

### 3.7 ProgressBar

| Field | Value |
|-------|-------|
| Priority | Medium |
| Dependency | None |
| Used for | Media upload progress, storage usage |
| API | `<ProgressBar value={n} max={n} variant="default" />` |
| Features | Animated fill, label, variant colors |
| Phase | Phase 5 |

### 3.8 Drawer/Sheet

| Field | Value |
|-------|-------|
| Priority | Low |
| Dependency | `@radix-ui/react-dialog` (already have) |
| Used for | Mobile filters, detail panels |
| API | `<Drawer side="end" open={bool} onClose={fn}>` |
| Features | Slide-in panel, backdrop, focus trap |
| Phase | Phase 10 |

---

## 4. Component Refactoring

### 4.1 InfoTooltip → Tooltip

**Current:** Custom component with `useState` show/hide, no ARIA
**Target:** Radix Tooltip with `role="tooltip"`, `aria-describedby`, delay, keyboard accessible
**Migration:** Replace all `InfoTooltip` usages with `Tooltip` component
**Risk:** Low — API change is straightforward

### 4.2 EmptyState → EmptyState with Variants

**Current:** Single variant (icon, title, description, action)
**Target:** Add `variant` prop: `first-use`, `no-results`, `error`, `permission`
**Migration:** Add CVA variant, update existing usages to specify variant
**Risk:** Low — backward compatible

### 4.3 Skeleton → Skeleton with Patterns

**Current:** Basic `Skeleton` component, `CardGridSkeleton` pattern
**Target:** Add pattern components: `ListSkeleton`, `FormSkeleton`, `DetailSkeleton`, `TableSkeleton`
**Migration:** Create new skeleton pattern components, replace text loading with skeletons
**Risk:** Low — additive

### 4.4 Table → Table with Bulk Select

**Current:** Basic table with header, rows, cells
**Target:** Add row selection support (checkbox column, selected state, select all)
**Migration:** Add optional checkbox column, selected row styling, select-all header checkbox
**Risk:** Medium — changes table rendering logic

---

## 5. Component Dependency Graph

```
Tooltip (Radix) → replaces InfoTooltip
Avatar (new) → used in UserMenu, TeamList, AdminCustomerList
Pagination (new) → used in ScreenList, MediaGrid, AdminTables, NotificationsPage
SearchInput (new) → used in ScreenList, MediaGrid, WorkspaceSwitcher, GlobalSearch
FilterBar (new) → used in ScreenList, MediaGrid
BulkActionBar (new) → used in ScreenList, MediaGrid, TeamList
ProgressBar (new) → used in MediaUpload, StorageUsage
Drawer (new) → used in MobileFilters, DetailPanels
```

---

## 6. Component Testing Strategy

### 6.1 Unit Tests

Each component should have unit tests covering:
- Rendering with default props
- Rendering with all variants
- Rendering with all sizes
- Disabled state
- Keyboard interaction
- ARIA attributes
- RTL rendering

### 6.2 Integration Tests

Feature components should have integration tests covering:
- User interaction flows (click, type, submit)
- API call mocking
- Error states
- Loading states
- Empty states

### 6.3 Visual Regression

Consider adding visual regression testing (e.g., Playwright screenshots) for:
- All components in light/dark mode
- All components in LTR/RTL
- Key pages in all 4 combinations (light-LTR, light-RTL, dark-LTR, dark-RTL)

---

## Cross-References

- See `14-design-system-direction.md` for design system standardization
- See `16-state-strategy.md` for state management strategy
- See `05-ui-component-library.md` (audit) for current component analysis
- See `17-risk-analysis.md` for component refactoring risks
- See `20-implementation-phases.md` for phase execution plans
