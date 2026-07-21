# 07 — Feature Traceability Map

> **Status:** FINAL — Maps every feature to its product architecture, flow, screen, and components

---

## 1. Purpose

Maps every feature in the Smart Screen platform through the complete traceability chain: from product architecture definition through user flow, screen specification, and design system components.

---

## 2. Traceability Chain

```
Product Architecture (Feature Definition)
  → User Flow Architecture (Feature Flow)
    → Screen Specification (Feature Screen)
      → UX Blueprint (Feature UX Rules)
        → Design System Components (Feature Implementation)
          → Acceptance Criteria (Feature Verification)
```

---

## 3. Feature Traceability Table

### Authentication Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components | Acceptance Criteria |
|---------|-------------|-----------|--------|-------------|-----------------|-------------------|
| Login | `02` (User entity) | `06` FL-AUTH-01 | `02` AUTH-01 | `06` | Button, Input, FormField | Screen spec `02` |
| Register | `02` (User entity) | `06` FL-AUTH-02 | `02` AUTH-02 | `06` | Button, Input, FormField | Screen spec `02` |
| Forgot Password | `02` (User entity) | `06` FL-AUTH-03 | `02` AUTH-03 | `06` | Button, Input, FormField | Screen spec `02` |
| Password Reset | `02` (User entity) | `06` FL-AUTH-03 | `02` AUTH-04 | `06` | Button, Input, FormField | Screen spec `02` |
| Session Management | `13` (State boundaries) | `06` FL-AUTH-04 | `01` (Global) | `06` | — (middleware) | Screen spec `01` |
| Logout | `02` (User entity) | `06` FL-AUTH-05 | `01` (Global) | `06` | UserMenu | Screen spec `01` |

### Workspace Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| Workspace Creation | `02` (Workspace entity), `04` (Hierarchy) | `07` FL-WS-01 | `02` (Auth redirect) | `06` | Button, Input, FormField |
| Workspace Switching | `04` (Hierarchy), `09` (Modules) | `07` FL-WS-01 | `01` (Global) | `07` | WorkspaceSwitcher |
| Empty Workspace | `18` (Constraints) | `07` FL-WS-02 | `03` OV-01 | `07` | OnboardingCard, EmptyState |
| Workspace Settings | `11` (Feature ownership) | `07` FL-WS-03 | `09` SET-02 | `11` | Input, FormField, FormActions |

### Screen Management Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| View Screens List | `02` (Screen entity), `09` (Screens module) | `08` FL-SC-01 | `04` SC-01 | `08` | ScreenCard, FilterToolbar, SearchInput |
| Screen Detail | `02` (Screen entity) | `08` FL-SC-02 | `04` SC-02 | `08` | Card, Tabs, Badge |
| Pair Screen (Wizard) | `02` (Screen entity), `05` (Primary journey) | `08` FL-SC-03 | `04` SC-03 | `08` | StepIndicator, Button, Input |
| Screen Rename | `11` (Feature ownership) | `08` FL-SC-04 | `04` SC-02 | `08` | EditableText, Dialog |
| Screen Delete | `11` (Feature ownership) | `08` FL-SC-05 | `04` SC-01 | `08` | AlertDialog |
| Bulk Screen Actions | `11` (Feature ownership) | `08` FL-SC-06 | `04` SC-01 | `08` | BulkActionBar, Checkbox |
| Screen Status (Realtime) | `13` (State boundaries) | `08` FL-SC-07 | `04` SC-01/02 | `08` | StatusBadge, Socket.IO |

### Content Management Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| View Playlists | `02` (Playlist entity), `09` (Content module) | `10` FL-PL-01 | `05` CN-01 | `09` | PlaylistCard, FilterToolbar |
| Create Playlist | `02` (Playlist entity) | `10` FL-PL-03 | `05` CN-01 | `09` | Dialog, TemplateCard |
| Playlist Detail | `02` (Playlist entity) | `10` FL-PL-02 | `05` CN-03 | `09` | PlaylistPreview, MediaItemsList |
| Edit Playlist (Studio) | `02` (Playlist entity), `14` (Frontend resp.) | `10` FL-PL-04 | `06` ST-01 | `09` P-CN-04 | All Studio components |
| Delete Playlist | `11` (Feature ownership) | `10` FL-PL-05 | `05` CN-01 | `09` | AlertDialog |
| Duplicate Playlist | `11` (Feature ownership) | `10` FL-PL-06 | `05` CN-01 | `09` | Toast |
| View Media | `02` (Media entity), `09` (Content module) | `09` FL-MD-01 | `05` CN-02 | `09` | MediaCard, FilterToolbar |
| Upload Media | `02` (Media entity), `14` (Frontend resp.) | `09` FL-MD-02 | `05` CN-02 | `09` | UploadDropZone, UploadProgressList |
| Delete Media | `11` (Feature ownership) | `09` FL-MD-03 | `05` CN-02 | `09` | AlertDialog |

### Publishing & Scheduling Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| Publish to Screens | `02` (Schedule entity), `05` (Primary journey) | `11` FL-PUB-01 | `13` DLG-01 | `09` | Dialog, SearchInput |
| View Schedules | `02` (Schedule entity), `09` (Scheduling module) | `11` FL-PUB-02 | `07` SCH-01 | `10` P-SCH-01 | CalendarGrid, ScheduleEvent |
| Create Schedule | `02` (Schedule entity) | `11` FL-PUB-03 | `07` SCH-01 | `10` | ScheduleDialog, DatePicker |
| Edit Schedule | `11` (Feature ownership) | `11` FL-PUB-04 | `07` SCH-01 | `10` | ScheduleDialog |
| Delete Schedule | `11` (Feature ownership) | `11` FL-PUB-05 | `07` SCH-01 | `10` | AlertDialog |
| Schedule Conflict Detection | `18` (Constraints) | `11` FL-PUB-06 | `07` SCH-01 | `10` | ScheduleDialog (conflict message) |

### Analytics Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| View Analytics | `09` (Analytics module) | `14` FL-AN-01 | `07` AN-01 | `10` P-AN-01 | MetricCard, TrendChart |
| Screen Uptime | `11` (Feature ownership) | `14` FL-AN-02 | `07` AN-01 | `10` | TrendChart |
| Content Performance | `11` (Feature ownership) | `14` FL-AN-03 | `07` AN-01 | `10` | BarChart (future) |

### Team Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| View Team | `02` (Member entity), `09` (Team module) | `12` FL-TM-01 | `08` TM-01 | `10` P-TM-01 | MemberRow, PendingInviteRow |
| Invite Member | `02` (Member entity), `04` (Hierarchy) | `12` FL-TM-02 | `08` TM-01 | `10` | Dialog, Input, Select |
| Change Role | `04` (Hierarchy), `17` (PR-rules) | `12` FL-TM-03 | `08` TM-01 | `10` | Select (role dropdown) |
| Remove Member | `11` (Feature ownership) | `12` FL-TM-04 | `08` TM-01 | `10` | AlertDialog |
| Resend Invite | `11` (Feature ownership) | `12` FL-TM-05 | `08` TM-01 | `10` | Button (ghost) |
| Cancel Invite | `11` (Feature ownership) | `12` FL-TM-06 | `08` TM-01 | `10` | AlertDialog |

### Settings Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| Edit Profile | `02` (User entity) | `13` FL-SET-01 | `09` SET-01 | `11` | Input, FormField, Avatar |
| Edit Workspace | `02` (Workspace entity) | `07` FL-WS-03 | `09` SET-02 | `11` | Input, FormField |
| View Billing | `02` (Plan entity), `09` (Billing module) | `13` FL-SET-03 | `09` SET-03 | `11` | PlanCard, UsageBar |
| Change Password | `02` (User entity) | `13` FL-SET-04 | `10` SET-04 | `12` | PasswordInput, FormField |
| Enable 2FA | `02` (User entity), `17` (PR-rules) | `13` FL-SET-04 | `10` SET-04 | `12` | Dialog, Input, TwoFactorStatus |
| Disable 2FA | `11` (Feature ownership) | `13` FL-SET-04 | `10` SET-04 | `12` | AlertDialog, TwoFactorStatus |
| Create API Key | `02` (ApiKey entity), `09` (API module) | `13` FL-SET-05 | `10` SET-05 | `12` | Dialog, Input, ApiKeyRow |
| Revoke API Key | `11` (Feature ownership) | `13` FL-SET-05 | `10` SET-05 | `12` | AlertDialog, ApiKeyRow |
| Notification Preferences | `02` (User entity) | `13` FL-SET-06 | `10` SET-06 | `13` | NotificationToggle |

### Notification Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| View Notifications | `09` (Notifications module) | `14` FL-NOT-01 | `11` NOT-01 | `14` | NotificationItem, List |
| Mark as Read | `11` (Feature ownership) | `14` FL-NOT-02 | `11` NOT-01 | `14` | Button (ghost) |
| Mark All as Read | `11` (Feature ownership) | `14` FL-NOT-03 | `11` NOT-01 | `14` | Button (ghost) |
| Notification Bell | `14` (Frontend resp.) | `14` FL-NOT-04 | `01` (Global) | `14` | NotificationBell, Badge |

### Admin Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| Admin Customers | `09` (Admin module), `04` (Hierarchy) | `15` FL-ADM-01 | `11` ADM-01 | `15` P-ADM-01 | AdminTable, ImpersonationBanner |
| Admin Staff | `09` (Admin module) | `15` FL-ADM-02 | `11` ADM-02 | `15` P-ADM-02 | AdminTable |
| Admin Users | `09` (Admin module) | `15` FL-ADM-03 | `11` ADM-03 | `15` P-ADM-03 | AdminTable |
| Admin Workspaces | `09` (Admin module) | `15` FL-ADM-04 | `12` ADM-04 | `16` P-ADM-04 | AdminTable |
| Admin Fleet | `09` (Admin module), `13` (State) | `15` FL-ADM-05 | `12` ADM-05 | `16` P-ADM-05 | AdminTable, FleetSummaryCards, MetricCard |
| Admin Health | `09` (Admin module) | `15` FL-ADM-06 | `12` ADM-06 | `16` P-ADM-06 | HealthStatusCard |
| Admin Logs | `09` (Admin module) | `15` FL-ADM-07 | `12` ADM-07 | `16` P-ADM-07 | AdminTable, LogLevelBadge |
| Admin Feature Flags | `09` (Admin module) | `15` FL-ADM-08 | `12` ADM-08 | `16` P-ADM-08 | FeatureFlagToggle, AdminTable |
| Impersonation | `04` (Hierarchy), `17` (PR-rules) | `15` FL-ADM-09 | `01` (Global) | `15` | ImpersonationBanner |

### Onboarding Features

| Feature | Product Arch | User Flow | Screen | UX Blueprint | DS V2 Components |
|---------|-------------|-----------|--------|-------------|-----------------|
| First-Time Onboarding | `05` (Primary journey), `17` (PR-rules) | `17` FL-ONB-01 | `03` OV-01 | `07` | OnboardingCard, OnboardingStep |
| 5-Minute KPI Flow | `05` (Primary journey) | `17` FL-ONB-02 | `03/04/05/07` | `07/08/09` | Multiple (wizard flow) |

---

## 4. Feature Count Summary

| Category | Features |
|----------|----------|
| Authentication | 6 |
| Workspace | 4 |
| Screen Management | 7 |
| Content Management | 9 |
| Publishing & Scheduling | 6 |
| Analytics | 3 |
| Team | 6 |
| Settings | 9 |
| Notifications | 4 |
| Admin | 9 |
| Onboarding | 2 |
| **Total** | **65** |

---

## 5. Feature Implementation Verification

Before implementing any feature, verify:

- [ ] Feature identified in `product-architecture/11-feature-ownership.md`
- [ ] Feature flow exists in User Flow Architecture
- [ ] Feature screen exists in Screen Specifications
- [ ] Feature UX rules exist in UX Blueprint
- [ ] All required DS V2 components exist (or are planned)
- [ ] Feature acceptance criteria documented in screen spec
- [ ] `09-definition-of-ready.md` criteria met for this feature

---

## Cross-References

- See `05-screen-traceability-map.md` for screen traceability
- See `06-component-traceability-map.md` for component traceability
- See `08-sprint-execution-order.md` for implementation sequence
- See `product-architecture/11-feature-ownership.md` for feature ownership
- See `user-flow-architecture/02-flow-matrix.md` for flow matrix
