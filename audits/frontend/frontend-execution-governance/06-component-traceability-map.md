# 06 — Component Traceability Map

> **Status:** FINAL — Maps every component to its design system spec, layer, and usage

---

## 1. Purpose

Maps every component in the Cloud-Screen design system to its specification, taxonomy layer, dependencies, and screen usage. No component may be implemented without this traceability.

---

## 2. Component Inventory by Layer

### Layer 1: Primitive (15 components)

| Component | DS V2 Spec | Used By Screens | Used By Components |
|-----------|-----------|----------------|-------------------|
| Button | `12-button-specifications.md` | All screens | Card footer, Dialog footer, FormActions, Toolbar, EmptyState action |
| Input | `13-input-specifications.md` | All form screens | FormField, SearchInput, FilterSelect |
| Textarea | `13-input-specifications.md` | Settings, Studio | FormField |
| PasswordInput | `13-input-specifications.md` | Auth, Settings | FormField |
| Checkbox | `13-input-specifications.md` | Table (selection), Settings | FormField, TableHeader |
| Toggle | `13-input-specifications.md` | Settings, Admin | FormField, FeatureFlagToggle, NotificationToggle |
| Select | `13-input-specifications.md` | Settings, Scheduling, Admin | FormField, FilterSelect, SortSelect |
| Badge | `15-cards.md` | All screens (status) | ScreenCard, PlaylistCard, Table, List |
| Avatar | `15-cards.md` | Team, Settings, Header | MemberRow, UserMenu, NotificationItem |
| Spinner | `19-loading-states.md` | All screens (button loading) | Button (loading state) |
| Tooltip | — (future) | All screens (collapsed sidebar) | SidebarItem (collapsed) |
| Separator | — | Settings, Dialog | CardHeader, DialogHeader |
| Label | `14-form-standards.md` | All form screens | FormField |
| Skeleton | `19-loading-states.md` | All data screens | Table, List, Card grid |
| ProgressBar | `19-loading-states.md` | Media upload | UploadProgressList |

### Layer 2: Composite (21 components)

| Component | DS V2 Spec | Used By Screens | Used By Components |
|-----------|-----------|----------------|-------------------|
| Card | `15-cards.md` | All screens | ScreenCard, PlaylistCard, MediaCard, MetricCard, PlanCard, widgets |
| Table | `16-tables.md` | Admin (all), Team, API Keys, Notifications | AdminTable |
| List | `17-lists.md` | Notifications, Team, Playlist Detail, Overview | NotificationItem, MemberRow, MediaItemsList |
| Dialog | `22-dialog-standards.md` | All screens (dialogs) | ScheduleDialog, InviteDialog, DeleteDialog |
| AlertDialog | `22-dialog-standards.md` | All screens (confirmations) | — |
| Drawer | `23-drawer-standards.md` | Mobile (sidebar) | — |
| Toast | `24-toast-standards.md` | All screens (feedback) | — |
| Tabs | `25-navigation-components.md` | Content, Settings, Studio | — |
| Breadcrumbs | `25-navigation-components.md` | Screen Detail, Playlist Detail | — |
| Pagination | `25-navigation-components.md` | Admin (all), Screens, Content | AdminTable |
| StepIndicator | `25-navigation-components.md` | Pairing Wizard | — |
| SearchInput | `26-search-components.md` | Screens, Content, Admin, Studio | FilterToolbar |
| FilterSelect | `27-filter-components.md` | Screens, Content, Admin | FilterToolbar |
| SortSelect | `27-filter-components.md` | Screens, Content, Admin | FilterToolbar |
| FilterToolbar | `27-filter-components.md` | All list screens | — |
| EmptyState | `18-empty-states.md` | All data screens | — |
| ErrorState | `20-error-states.md` | All data screens | — |
| FormField | `14-form-standards.md` | All form screens | — |
| FormActions | `14-form-standards.md` | All form screens | — |
| DatePicker | `35-scheduling-components.md` | Scheduling | ScheduleDialog |
| EditableText | `31-studio-components.md` | Studio, Screen Detail (rename) | — |

### Layer 3: Domain (35 components)

| Component | DS V2 Spec | Used By Screens |
|-----------|-----------|----------------|
| ScreenCard | `32-screen-cards.md` | Screens List |
| BulkActionBar | `32-screen-cards.md` | Screens List |
| StatusBadge | `32-screen-cards.md` | Screens, Content, Admin |
| PlaylistCard | `33-playlist-components.md` | Content (Playlists) |
| TemplateCard | `33-playlist-components.md` | Template Picker Dialog |
| PlaylistPreview | `33-playlist-components.md` | Playlist Detail |
| MediaItemsList | `33-playlist-components.md` | Playlist Detail |
| AssignedScreensList | `33-playlist-components.md` | Playlist Detail |
| MediaCard | `34-media-components.md` | Content (Media) |
| UploadDropZone | `34-media-components.md` | Content (Media), Studio |
| UploadProgressList | `34-media-components.md` | Content (Media), Studio |
| DropZoneOverlay | `34-media-components.md` | Content (Media) |
| MetricCard | `28-data-visualization-components.md` | Overview, Analytics, Admin Fleet |
| UsageBar | `28-data-visualization-components.md` | Settings (Billing) |
| TrendChart | `29-charts.md` | Analytics |
| BarChart | `29-charts.md` | Analytics (future) |
| DonutChart | `29-charts.md` | Overview (future), Admin Fleet (future) |
| ScreenHealthWidget | `30-dashboard-widgets.md` | Overview |
| QuickActionsWidget | `30-dashboard-widgets.md` | Overview |
| RecentActivityWidget | `30-dashboard-widgets.md` | Overview |
| ActiveContentWidget | `30-dashboard-widgets.md` | Overview |
| OnboardingCard | `30-dashboard-widgets.md` | Overview (empty workspace) |
| OnboardingStep | `30-dashboard-widgets.md` | Overview (onboarding) |
| KonvaCanvas | `31-studio-components.md` | Studio |
| MediaPanel | `31-studio-components.md` | Studio |
| PropertiesPanel | `31-studio-components.md` | Studio |
| LayerProperties | `31-studio-components.md` | Studio |
| LayerList | `31-studio-components.md` | Studio |
| PreviewOverlay | `31-studio-components.md` | Studio |
| StudioToolbar | `31-studio-components.md` | Studio |
| CalendarGrid | `35-scheduling-components.md` | Scheduling |
| CalendarDay | `35-scheduling-components.md` | Scheduling |
| ScheduleEvent | `35-scheduling-components.md` | Scheduling |
| ScheduleDialog | `35-scheduling-components.md` | Scheduling, Playlist Detail |
| DateNav | `35-scheduling-components.md` | Scheduling |

### Layer 3: Domain (Admin & Settings)

| Component | DS V2 Spec | Used By Screens |
|-----------|-----------|----------------|
| ImpersonationBanner | `36-admin-components.md` | Admin (all) |
| FeatureFlagToggle | `36-admin-components.md` | Admin Feature Flags |
| FleetSummaryCards | `36-admin-components.md` | Admin Fleet |
| HealthStatusCard | `36-admin-components.md` | Admin Health |
| LogLevelBadge | `36-admin-components.md` | Admin Logs |
| AdminTable | `36-admin-components.md` | Admin (all), Notifications |
| SettingsTabs | `37-settings-components.md` | Settings |
| MemberRow | `37-settings-components.md` | Team |
| PendingInviteRow | `37-settings-components.md` | Team |
| NotificationItem | `37-settings-components.md` | Notifications, Header bell |
| PlanCard | `37-settings-components.md` | Settings (Billing) |
| ApiKeyRow | `37-settings-components.md` | Settings (API Keys) |
| NotificationToggle | `37-settings-components.md` | Settings (Notifications) |
| TwoFactorStatus | `37-settings-components.md` | Settings (Security) |

### Layer 3: Domain (Navigation)

| Component | DS V2 Spec | Used By Screens |
|-----------|-----------|----------------|
| Sidebar | `25-navigation-components.md` | All (app shell) |
| Header | `25-navigation-components.md` | All (app shell) |
| NotificationBell | `25-navigation-components.md` | All (header) |
| UserMenu | `25-navigation-components.md` | All (header) |
| WorkspaceSwitcher | `25-navigation-components.md` | All (sidebar) |

### Layer 4: Page (18 pages)

| Page | Screen Spec | Primary Components |
|------|------------|-------------------|
| LoginPage | `02-auth-error-specs.md` | Button, Input, FormField |
| RegisterPage | `02-auth-error-specs.md` | Button, Input, FormField |
| ForgotPasswordPage | `02-auth-error-specs.md` | Button, Input, FormField |
| OverviewPage | `03-overview-spec.md` | Sidebar, Header, Widgets, Card |
| ScreensListPage | `04-screens-specs.md` | ScreenCard, FilterToolbar, BulkActionBar |
| ScreenDetailPage | `04-screens-specs.md` | Card, Tabs, Dialog |
| PairingWizardPage | `04-screens-specs.md` | StepIndicator, Button, Input |
| ContentPage | `05-content-specs.md` | Tabs, PlaylistCard, MediaCard, FilterToolbar |
| PlaylistDetailPage | `05-content-specs.md` | PlaylistPreview, MediaItemsList, AssignedScreensList |
| StudioPage | `06-studio-spec.md` | KonvaCanvas, MediaPanel, PropertiesPanel, LayerList |
| SchedulingPage | `07-scheduling-analytics-specs.md` | CalendarGrid, ScheduleDialog, DateNav |
| AnalyticsPage | `07-scheduling-analytics-specs.md` | MetricCard, TrendChart, Card |
| TeamPage | `08-team-spec.md` | MemberRow, PendingInviteRow, Dialog |
| SettingsPage | `09/10-settings-specs.md` | SettingsTabs, FormField, Toggle, PlanCard |
| NotificationsPage | `11-notifications-admin-specs-part1.md` | NotificationItem, List, FilterToolbar |
| AdminPages | `11/12-admin-specs.md` | AdminTable, ImpersonationBanner |
| ErrorPages | `02-auth-error-specs.md` | ErrorState |
| EmptyWorkspacePage | `03-overview-spec.md` | OnboardingCard, EmptyState |

---

## 3. Component Dependency Rules

### 3.1 Import Rules
| Layer | May Import | May NOT Import |
|-------|-----------|----------------|
| Primitive (1) | Other primitives only | Composite, Domain, Page |
| Composite (2) | Primitive | Domain, Page |
| Domain (3) | Primitive, Composite | Other Domain (avoid), Page |
| Page (4) | All layers | Nothing above |

### 3.2 Shared Component Usage
| Component | Used On N Screens | Reusability |
|-----------|-------------------|-------------|
| Button | 37+ | Universal |
| Input | 20+ | Universal |
| Card | 30+ | Universal |
| Dialog | 15+ | High |
| Table | 10+ | High |
| Toast | 37+ | Universal |
| EmptyState | 25+ | Universal |
| ErrorState | 25+ | Universal |
| Badge | 20+ | High |
| SearchInput | 10+ | High |

---

## 4. Component Creation Verification

Before creating any component, verify:

- [ ] Component does NOT already exist (search this map)
- [ ] Component is in the correct layer (per `11-component-taxonomy.md`)
- [ ] Component spec exists in Design System V2
- [ ] Component name follows `41-component-naming.md`
- [ ] Component follows `42-variant-rules.md`
- [ ] Component follows `43-composition-rules.md`
- [ ] `13-component-creation-rules.md` process followed

---

## Cross-References

- See `05-screen-traceability-map.md` for screen traceability
- See `07-feature-traceability-map.md` for feature traceability
- See `13-component-creation-rules.md` for creation process
- See `14-component-modification-rules.md` for modification process
- See `design-system-v2/11-component-taxonomy.md` for taxonomy
- See `design-system-v2/50-master-index.md` for component count summary
