# 11 — Component Taxonomy

> **Evidence basis:** `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/01-global-layout-spec.md` through `13-shared-dialogs-specs.md`, `information-architecture/08-component-inventory.md`, `product-architecture/14-frontend-component-architecture.md`

---

## 1. Taxonomy Structure

The Smart Screen component taxonomy organizes all UI components into **4 layers** based on reusability and domain specificity.

### Layer 1: Primitive Components
Generic, domain-agnostic components that form the building blocks. No Smart Screen-specific logic.

### Layer 2: Composite Components
Components composed from primitives, with some domain awareness but still broadly reusable.

### Layer 3: Domain Components
Smart Screen-specific components that encode business logic, entity types, or workflow patterns.

### Layer 4: Page Components
Full page-level compositions that combine domain, composite, and primitive components.

---

## 2. Component Inventory

### Layer 1: Primitive

| Component | File | Category |
|-----------|------|----------|
| Button | `12-button-specifications.md` | Action |
| Input | `13-input-specifications.md` | Form |
| PasswordInput | `13-input-specifications.md` | Form |
| Textarea | `13-input-specifications.md` | Form |
| Checkbox | `13-input-specifications.md` | Form |
| Radio | `13-input-specifications.md` | Form |
| Toggle (Switch) | `13-input-specifications.md` | Form |
| Select (Dropdown) | `13-input-specifications.md` | Form |
| Label | `14-form-standards.md` | Form |
| Badge | `15-cards.md` | Display |
| Avatar | `15-cards.md` | Display |
| Icon | `05-iconography.md` | Display |
| Spinner | `19-loading-states.md` | Feedback |
| Separator (Divider) | — | Layout |
| Tooltip | — | Feedback |

### Layer 2: Composite

| Component | File | Category |
|-----------|------|----------|
| Card | `15-cards.md` | Container |
| Table | `16-tables.md` | Data Display |
| List | `17-lists.md` | Data Display |
| Tabs | `25-navigation-components.md` | Navigation |
| Breadcrumbs | `25-navigation-components.md` | Navigation |
| Pagination | `25-navigation-components.md` | Navigation |
| Dialog | `22-dialog-standards.md` | Overlay |
| AlertDialog | `22-dialog-standards.md` | Overlay |
| Drawer | `23-drawer-standards.md` | Overlay |
| Toast | `24-toast-standards.md` | Feedback |
| SearchInput | `26-search-components.md` | Input |
| FilterSelect | `27-filter-components.md` | Input |
| SortSelect | `27-filter-components.md` | Input |
| FormField | `14-form-standards.md` | Form |
| FormError | `14-form-standards.md` | Form |
| EmptyState | `18-empty-states.md` | State |
| Skeleton | `19-loading-states.md` | State |
| ErrorState | `20-error-states.md` | State |
| SuccessState | `21-success-states.md` | State |
| ProgressBar | `19-loading-states.md` | Feedback |
| UploadDropZone | `34-media-components.md` | Input |
| Calendar | `35-scheduling-components.md` | Input |
| DatePicker | `35-scheduling-components.md` | Input |
| Chart | `29-charts.md` | Data Viz |

### Layer 3: Domain

| Component | File | Category |
|-----------|------|----------|
| Sidebar | `25-navigation-components.md` | Navigation |
| Header | `25-navigation-components.md` | Navigation |
| WorkspaceSwitcher | `25-navigation-components.md` | Navigation |
| NotificationBell | `25-navigation-components.md` | Navigation |
| UserMenu | `25-navigation-components.md` | Navigation |
| ScreenCard | `32-screen-cards.md` | Entity |
| PlaylistCard | `33-playlist-components.md` | Entity |
| MediaCard | `34-media-components.md` | Entity |
| MemberRow | `37-settings-components.md` | Entity |
| StatusBadge | `32-screen-cards.md` | Display |
| MetricCard | `30-dashboard-widgets.md` | Data Viz |
| Widget | `30-dashboard-widgets.md` | Container |
| KonvaCanvas | `31-studio-components.md` | Editor |
| LayerProperties | `31-studio-components.md` | Editor |
| LayerList (Timeline) | `31-studio-components.md` | Editor |
| MediaPanel | `31-studio-components.md` | Editor |
| CalendarGrid | `35-scheduling-components.md` | Scheduling |
| CalendarDay | `35-scheduling-components.md` | Scheduling |
| ScheduleEvent | `35-scheduling-components.md` | Scheduling |
| NotificationItem | `37-settings-components.md` | Display |
| PlanCard | `37-settings-components.md` | Display |
| UsageBar | `37-settings-components.md` | Display |
| ApiKeyRow | `37-settings-components.md` | Display |
| FeatureFlagToggle | `36-admin-components.md` | Admin |
| BulkActionBar | `32-screen-cards.md` | Action |
| StepIndicator | `25-navigation-components.md` | Navigation |
| OnboardingCard | `30-dashboard-widgets.md` | Onboarding |
| OnboardingStep | `30-dashboard-widgets.md` | Onboarding |
| TemplateCard | `33-playlist-components.md` | Display |
| UploadProgressList | `34-media-components.md` | Feedback |
| DropZoneOverlay | `34-media-components.md` | Feedback |
| PreviewOverlay | `31-studio-components.md` | Editor |
| ImpersonationBanner | `36-admin-components.md` | Admin |

### Layer 4: Page

| Component | File |
|-----------|------|
| AppShell | `03-layout-system.md` |
| AuthLayout | `03-layout-system.md` |
| StudioLayout | `03-layout-system.md` |
| OverviewPage | `screen-specifications/03-overview-spec.md` |
| ScreensPage | `screen-specifications/04-screens-specs.md` |
| ScreenDetailPage | `screen-specifications/04-screens-specs.md` |
| PairingWizard | `screen-specifications/04-screens-specs.md` |
| ContentPage | `screen-specifications/05-content-specs.md` |
| PlaylistDetailPage | `screen-specifications/05-content-specs.md` |
| StudioPage | `screen-specifications/06-studio-spec.md` |
| SchedulingPage | `screen-specifications/07-scheduling-analytics-specs.md` |
| AnalyticsPage | `screen-specifications/07-scheduling-analytics-specs.md` |
| TeamPage | `screen-specifications/08-team-spec.md` |
| SettingsPage | `screen-specifications/09-settings-specs-part1.md` |
| NotificationsPage | `screen-specifications/11-notifications-admin-specs-part1.md` |
| AdminPages | `screen-specifications/11-notifications-admin-specs-part1.md`, `12-admin-specs-part2.md` |

---

## 3. Component Ownership

| Layer | Owned By | Modified By | Evidence |
|-------|----------|-------------|----------|
| Primitive | Design System | Design System team | — |
| Composite | Design System | Design System team | — |
| Domain | Feature teams | Feature teams + DS consultation | — |
| Page | Feature teams | Feature teams | — |

---

## 4. Dependency Rules

- **Layer 4** may import from Layers 1, 2, 3
- **Layer 3** may import from Layers 1, 2
- **Layer 2** may import from Layer 1
- **Layer 1** may not import from any higher layer
- **No circular dependencies** at any layer
- **Domain components** should not import other domain components (avoid coupling)
- **Page components** are the only place where multiple domain components combine

---

## 5. Naming Convention

See `41-component-naming.md` for the full naming convention. Summary:

| Layer | Prefix | Example |
|-------|--------|---------|
| Primitive | None | `Button`, `Input`, `Badge` |
| Composite | None | `Card`, `Table`, `Dialog` |
| Domain | Entity name | `ScreenCard`, `PlaylistCard`, `MediaCard` |
| Page | Page name + Page | `OverviewPage`, `ScreensPage` |

---

## Cross-References

- See `41-component-naming.md` for naming conventions
- See `42-variant-rules.md` for variant rules
- See `43-composition-rules.md` for composition rules
- See `ux-blueprint/03-component-ux-standards.md` for component standards
- See `information-architecture/08-component-inventory.md` for IA component inventory
- See `product-architecture/14-frontend-component-architecture.md` for component architecture
