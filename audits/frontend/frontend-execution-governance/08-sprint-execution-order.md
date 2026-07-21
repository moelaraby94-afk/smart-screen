# 08 — Sprint Execution Order

> **Status:** FINAL — Recommended implementation sequence based on documentation dependencies

---

## 1. Purpose

Defines the recommended implementation order for the Smart Screen frontend V2. The order is determined by:
- **Dependency chains** (tokens → primitives → composites → domain → pages)
- **5-minute KPI priority** (pair screen, upload, create playlist, publish)
- **Screen readiness scores** (from `screen-specifications/14-screen-specifications-summary.md`)
- **Reusable component leverage** (shared components first)

---

## 2. Implementation Phases

### Phase 0: Foundation (Week 1)

| Sprint | Task | Dependencies | Evidence |
|--------|------|-------------|----------|
| 0.1 | Set up design tokens (CSS variables) | None | `design-system-v2/44-design-tokens.md` |
| 0.2 | Configure Tailwind with token mapping | 0.1 | `design-system-v2/44-design-tokens.md` §13 |
| 0.3 | Set up folder structure | 0.1 | `27-folder-ownership.md`, `28-file-ownership.md` |
| 0.4 | Set up i18n (next-intl) with EN + AR | 0.1 | `product-architecture/17-product-rules.md` PR-50 |
| 0.5 | Set up RTL support (`dir` attribute) | 0.4 | `design-system-v2/39-rtl-rules.md` |
| 0.6 | Set up dark mode (`.dark` class) | 0.1 | `design-system-v2/44-design-tokens.md` §7 |
| 0.7 | Set up SWR data fetching | 0.3 | `product-architecture/13-frontend-state-boundaries.md` |
| 0.8 | Set up Socket.IO client | 0.7 | `product-architecture/13-frontend-state-boundaries.md` |

### Phase 1: Primitive Components (Week 1-2)

| Sprint | Component | Spec | Dependencies |
|--------|-----------|------|-------------|
| 1.1 | Button | `12-button-specifications.md` | Tokens |
| 1.2 | Input | `13-input-specifications.md` | Tokens |
| 1.3 | Textarea | `13-input-specifications.md` | Input |
| 1.4 | PasswordInput | `13-input-specifications.md` | Input |
| 1.5 | Checkbox | `13-input-specifications.md` | Tokens |
| 1.6 | Toggle | `13-input-specifications.md` | Tokens |
| 1.7 | Select | `13-input-specifications.md` | Input |
| 1.8 | Badge | `15-cards.md` | Tokens |
| 1.9 | Avatar | `15-cards.md` | Tokens |
| 1.10 | Spinner | `19-loading-states.md` | Tokens |
| 1.11 | Skeleton | `19-loading-states.md` | Tokens |
| 1.12 | ProgressBar | `19-loading-states.md` | Tokens |
| 1.13 | Label | `14-form-standards.md` | Tokens |
| 1.14 | Separator | — | Tokens |

### Phase 2: Composite Components (Week 2-3)

| Sprint | Component | Spec | Dependencies |
|--------|-----------|------|-------------|
| 2.1 | Card (+ Header/Content/Footer) | `15-cards.md` | Badge, Avatar |
| 2.2 | FormField (+ HelperText, FormError) | `14-form-standards.md` | Label, Input |
| 2.3 | FormActions | `14-form-standards.md` | Button |
| 2.4 | Table (+ Header/Row/Cell) | `16-tables.md` | Checkbox, Badge |
| 2.5 | List (+ Item/Icon/Content/Action) | `17-lists.md` | Avatar, Badge |
| 2.6 | Dialog (+ Header/Content/Footer) | `22-dialog-standards.md` | Button |
| 2.7 | AlertDialog | `22-dialog-standards.md` | Dialog, Button |
| 2.8 | Drawer | `23-drawer-standards.md` | Button |
| 2.9 | Toast | `24-toast-standards.md` | Spinner |
| 2.10 | Tabs | `25-navigation-components.md` | — |
| 2.11 | Breadcrumbs | `25-navigation-components.md` | — |
| 2.12 | Pagination | `25-navigation-components.md` | Button |
| 2.13 | StepIndicator | `25-navigation-components.md` | — |
| 2.14 | SearchInput | `26-search-components.md` | Input |
| 2.15 | FilterSelect | `27-filter-components.md` | Select |
| 2.16 | SortSelect | `27-filter-components.md` | Select |
| 2.17 | FilterToolbar | `27-filter-components.md` | SearchInput, FilterSelect, SortSelect |
| 2.18 | EmptyState | `18-empty-states.md` | Button |
| 2.19 | ErrorState | `20-error-states.md` | Button |
| 2.20 | DatePicker | `35-scheduling-components.md` | Input, Button |
| 2.21 | EditableText | `31-studio-components.md` | Input |

### Phase 3: App Shell & Navigation (Week 3)

| Sprint | Component | Spec | Dependencies |
|--------|-----------|------|-------------|
| 3.1 | Sidebar (+ Item/Section) | `25-navigation-components.md` | — |
| 3.2 | Header | `25-navigation-components.md` | Avatar |
| 3.3 | NotificationBell | `25-navigation-components.md` | Badge |
| 3.4 | UserMenu | `25-navigation-components.md` | Avatar |
| 3.5 | WorkspaceSwitcher | `25-navigation-components.md` | — |
| 3.6 | App Shell Layout | `screen-specifications/01-global-layout-spec.md` | All above |
| 3.7 | Auth Layout | `screen-specifications/02-auth-error-specs.md` | Card |
| 3.8 | Error Pages (404, 500, Boundary) | `screen-specifications/02-auth-error-specs.md` | ErrorState |

### Phase 4: Auth Screens (Week 3-4)

| Sprint | Screen | Spec | Dependencies |
|--------|--------|------|-------------|
| 4.1 | Login Page | `02-auth-error-specs.md` AUTH-01 | Button, Input, FormField, Card |
| 4.2 | Register Page | `02-auth-error-specs.md` AUTH-02 | Button, Input, FormField, Card |
| 4.3 | Forgot Password | `02-auth-error-specs.md` AUTH-03 | Button, Input, FormField |
| 4.4 | Reset Password | `02-auth-error-specs.md` AUTH-04 | Button, Input, FormField |
| 4.5 | Permission Denied | `02-auth-error-specs.md` ERR-04 | ErrorState |

### Phase 5: 5-Minute KPI Screens (Week 4-6) — HIGHEST PRIORITY

| Sprint | Screen | Spec | Dependencies | KPI Step |
|--------|--------|------|-------------|----------|
| 5.1 | Overview (empty workspace) | `03-overview-spec.md` OV-01 | OnboardingCard, EmptyState, Widgets | Entry |
| 5.2 | Screens List | `04-screens-specs.md` SC-01 | ScreenCard, FilterToolbar, BulkActionBar | Step 1 |
| 5.3 | Pairing Wizard | `04-screens-specs.md` SC-03 | StepIndicator, Button, Input | Step 1 |
| 5.4 | Screen Detail | `04-screens-specs.md` SC-02 | Card, Tabs, Badge | Step 1 |
| 5.5 | Content (Media tab) | `05-content-specs.md` CN-02 | MediaCard, UploadDropZone, UploadProgressList | Step 2 |
| 5.6 | Content (Playlists tab) | `05-content-specs.md` CN-01 | PlaylistCard, FilterToolbar | Step 3 |
| 5.7 | Playlist Detail | `05-content-specs.md` CN-03 | PlaylistPreview, MediaItemsList | Step 3 |
| 5.8 | Template Picker Dialog | `13-shared-dialogs-specs.md` DLG-02 | Dialog, TemplateCard | Step 3 |
| 5.9 | Publish to Screens Dialog | `13-shared-dialogs-specs.md` DLG-01 | Dialog, SearchInput | Step 4 |
| 5.10 | Overview (populated) | `03-overview-spec.md` OV-01 | All widgets | Complete |

### Phase 6: Studio (Week 6-7) — COMPLEX

| Sprint | Screen | Spec | Dependencies |
|--------|--------|------|-------------|
| 6.1 | Studio Shell (3-panel layout) | `06-studio-spec.md` ST-01 | — |
| 6.2 | StudioToolbar | `31-studio-components.md` | Button, EditableText |
| 6.3 | MediaPanel | `31-studio-components.md` | Tabs, SearchInput, MediaCard |
| 6.4 | KonvaCanvas | `31-studio-components.md` | Konva.js (lazy-loaded) |
| 6.5 | PropertiesPanel | `31-studio-components.md` | Input, Select, Slider |
| 6.6 | LayerList | `31-studio-components.md` | — |
| 6.7 | PreviewOverlay | `31-studio-components.md` | — |
| 6.8 | Delete Confirmation Dialog | `13-shared-dialogs-specs.md` DLG-05 | AlertDialog |

### Phase 7: Scheduling & Analytics (Week 7-8)

| Sprint | Screen | Spec | Dependencies |
|--------|--------|------|-------------|
| 7.1 | Scheduling Calendar | `07-scheduling-analytics-specs.md` SCH-01 | CalendarGrid, DateNav |
| 7.2 | Schedule Dialog (Create) | `13-shared-dialogs-specs.md` DLG-03 | Dialog, DatePicker, Select |
| 7.3 | Schedule Dialog (Edit) | `13-shared-dialogs-specs.md` DLG-03 | Same + Delete button |
| 7.4 | Analytics Dashboard | `07-scheduling-analytics-specs.md` AN-01 | MetricCard, TrendChart (lazy) |

### Phase 8: Team & Settings (Week 8-9)

| Sprint | Screen | Spec | Dependencies |
|--------|--------|------|-------------|
| 8.1 | Team Page | `08-team-spec.md` TM-01 | MemberRow, PendingInviteRow |
| 8.2 | Invite Member Dialog | `13-shared-dialogs-specs.md` DLG-04 | Dialog, Input, Select |
| 8.3 | Settings (Profile) | `09-settings-specs-part1.md` SET-01 | FormField, Avatar |
| 8.4 | Settings (Workspace) | `09-settings-specs-part1.md` SET-02 | FormField |
| 8.5 | Settings (Billing) | `09-settings-specs-part1.md` SET-03 | PlanCard, UsageBar |
| 8.6 | Settings (Security) | `10-settings-specs-part2.md` SET-04 | PasswordInput, TwoFactorStatus |
| 8.7 | 2FA Setup Dialog | `13-shared-dialogs-specs.md` DLG-06 | Dialog, Input |
| 8.8 | Settings (API Keys) | `10-settings-specs-part2.md` SET-05 | ApiKeyRow, Dialog |
| 8.9 | Settings (Notifications) | `10-settings-specs-part2.md` SET-06 | NotificationToggle |

### Phase 9: Notifications & Admin (Week 9-10)

| Sprint | Screen | Spec | Dependencies |
|--------|--------|------|-------------|
| 9.1 | Notifications History | `11-notifications-admin-specs-part1.md` NOT-01 | NotificationItem, List |
| 9.2 | Admin Customers | `11-notifications-admin-specs-part1.md` ADM-01 | AdminTable, ImpersonationBanner |
| 9.3 | Admin Staff | `11-notifications-admin-specs-part1.md` ADM-02 | AdminTable |
| 9.4 | Admin Users | `11-notifications-admin-specs-part1.md` ADM-03 | AdminTable |
| 9.5 | Admin Workspaces | `12-admin-specs-part2.md` ADM-04 | AdminTable |
| 9.6 | Admin Fleet | `12-admin-specs-part2.md` ADM-05 | AdminTable, FleetSummaryCards, MetricCard |
| 9.7 | Admin Health | `12-admin-specs-part2.md` ADM-06 | HealthStatusCard |
| 9.8 | Admin Logs | `12-admin-specs-part2.md` ADM-07 | AdminTable, LogLevelBadge |
| 9.9 | Admin Feature Flags | `12-admin-specs-part2.md` ADM-08 | FeatureFlagToggle, AdminTable |

### Phase 10: Polish & QA (Week 10-11)

| Sprint | Task | Evidence |
|--------|------|----------|
| 10.1 | Accessibility audit (all screens) | `18-accessibility-compliance.md` |
| 10.2 | Responsive audit (all breakpoints) | `19-responsive-compliance.md` |
| 10.3 | RTL audit (all screens) | `design-system-v2/39-rtl-rules.md` |
| 10.4 | Performance audit (Lighthouse) | `20-performance-budget.md` |
| 10.5 | Dark mode audit | `design-system-v2/44-design-tokens.md` §7 |
| 10.6 | Design QA (all screens) | `48-design-qa-checklist.md` |
| 10.7 | E2E tests (critical flows) | `21-testing-strategy.md` |
| 10.8 | Final readiness sign-off | `30-final-readiness-checklist.md` |

---

## 3. Dependency Critical Path

```
Phase 0 (Foundation)
  → Phase 1 (Primitives)
    → Phase 2 (Composites)
      → Phase 3 (App Shell)
        → Phase 4 (Auth)
          → Phase 5 (5-Min KPI) ← HIGHEST PRIORITY
            → Phase 6 (Studio) ← MOST COMPLEX
              → Phase 7 (Scheduling/Analytics)
                → Phase 8 (Team/Settings)
                  → Phase 9 (Notifications/Admin)
                    → Phase 10 (Polish/QA)
```

---

## 4. 5-Minute KPI Critical Path

The 5-minute KPI (pair screen → upload → create playlist → publish) is the highest priority:

```
Login (Phase 4)
  → Overview empty (Phase 5.1)
    → Pair Screen (Phase 5.3) ← Step 1
      → Upload Media (Phase 5.5) ← Step 2
        → Create Playlist (Phase 5.6/5.7/5.8) ← Step 3
          → Publish (Phase 5.9) ← Step 4
            → Overview populated (Phase 5.10) ← Complete
```

**Target:** Steps 1-4 must be completable in < 5 minutes for a new user.

---

## 5. Parallelization Opportunities

| Can Parallelize | With | Condition |
|----------------|------|-----------|
| Phase 4 (Auth) | Phase 3 (App Shell) | After Phase 2 |
| Phase 7 (Scheduling) | Phase 8 (Team/Settings) | After Phase 5 |
| Phase 9 (Admin) | Phase 10 (Polish) | After Phase 8 |
| Admin sub-screens (9.2-9.9) | Each other | After AdminTable built |

---

## 6. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Foundation | 1 week | 1 week |
| Phase 1: Primitives | 1-2 weeks | 2-3 weeks |
| Phase 2: Composites | 1-2 weeks | 3-5 weeks |
| Phase 3: App Shell | 1 week | 4-6 weeks |
| Phase 4: Auth | 0.5-1 week | 5-7 weeks |
| Phase 5: 5-Min KPI | 2-3 weeks | 7-10 weeks |
| Phase 6: Studio | 1-2 weeks | 8-12 weeks |
| Phase 7: Scheduling/Analytics | 1-2 weeks | 9-14 weeks |
| Phase 8: Team/Settings | 1-2 weeks | 10-16 weeks |
| Phase 9: Notifications/Admin | 1-2 weeks | 11-18 weeks |
| Phase 10: Polish/QA | 1-2 weeks | 12-20 weeks |
| **Total** | **12-20 weeks** | — |

---

## Cross-References

- See `05-screen-traceability-map.md` for screen details
- See `06-component-traceability-map.md` for component dependencies
- See `07-feature-traceability-map.md` for feature mapping
- See `09-definition-of-ready.md` for readiness criteria
- See `screen-specifications/14-screen-specifications-summary.md` for readiness scores
- See `product-architecture/05-primary-user-journey.md` for 5-minute KPI
