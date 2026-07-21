# 05 — Screen Traceability Map

> **Status:** FINAL — Maps every screen to its specifications, flows, and components

---

## 1. Purpose

This document provides **complete traceability** from every screen in the Smart Screen application to its authoritative documentation. No screen may be implemented without this traceability being verified.

---

## 2. Traceability Chain

```
Screen ID
  → Screen Specification
    → UX Blueprint
      → User Flow
        → Design System Components
          → Acceptance Criteria
```

---

## 3. Screen Traceability Table

### Authentication & Error Screens

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| AUTH-01 | Login | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `06-auth-flows.md` FL-AUTH-01 | `12` (Button), `13` (Input), `14` (Form) | Loading, Error, Success |
| AUTH-02 | Register | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `06-auth-flows.md` FL-AUTH-02 | `12`, `13`, `14` | Loading, Error, Success |
| AUTH-03 | Forgot Password | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `06-auth-flows.md` FL-AUTH-03 | `12`, `13`, `14` | Loading, Error, Success |
| AUTH-04 | Reset Password | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `06-auth-flows.md` FL-AUTH-03 | `12`, `13`, `14` | Loading, Error, Success |
| ERR-01 | 404 Not Found | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `16-system-flows.md` FL-SYS-02 | `20` (ErrorState) | Error (notFound) |
| ERR-02 | 500 Server Error | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `16-system-flows.md` FL-SYS-02 | `20` (ErrorState) | Error (server) |
| ERR-03 | Error Boundary | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `16-system-flows.md` FL-SYS-02 | `20` (ErrorBoundary) | Error (default) |
| ERR-04 | Permission Denied | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `16-system-flows.md` FL-SYS-02 | `20` (ErrorState) | Error (permission) |

### Workspace Screens

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| WS-01 | Empty Workspace | `03-overview-spec.md` | `07-overview-ux-blueprint.md` | `07-workspace-flows.md` FL-WS-02 | `15` (Card), `18` (EmptyState), `30` (OnboardingCard) | Empty, First Use |
| WS-02 | Workspace Switcher | `01-global-layout-spec.md` | `07-overview-ux-blueprint.md` | `07-workspace-flows.md` FL-WS-01 | `25` (Navigation) | Default, Open |

### Overview Screen

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| OV-01 | Overview/Dashboard | `03-overview-spec.md` | `07-overview-ux-blueprint.md` | `17-onboarding-flows.md` FL-ONB-01 | `15`, `25`, `28` (MetricCard), `30` (Widgets) | Loading, Empty, First Use, Error |

### Screens Management

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| SC-01 | Screens List | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` FL-SC-01 | `15`, `25`, `26` (Search), `27` (Filter), `32` (ScreenCard) | Loading, Empty, Error, No Results |
| SC-02 | Screen Detail | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` FL-SC-02 | `15`, `22` (Dialog), `25` | Loading, Error, Not Found |
| SC-03 | Pairing Wizard | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` FL-SC-03 | `12`, `25` (StepIndicator) | Loading, Error, Success |

### Content Management

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| CN-01 | Playlists Tab | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` FL-PL-01 | `15`, `25`, `26`, `27`, `33` (PlaylistCard) | Loading, Empty, Error |
| CN-02 | Media Tab | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `09-media-flows.md` FL-MD-01 | `15`, `25`, `26`, `34` (MediaCard, Upload) | Loading, Empty, Error, Uploading |
| CN-03 | Playlist Detail | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` FL-PL-02 | `15`, `22`, `33` (PlaylistPreview) | Loading, Empty, Error, Not Found |
| CN-04 | Template Picker | `13-shared-dialogs-specs.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` FL-PL-03 | `22` (Dialog), `33` (TemplateCard) | Loading, Empty |

### Studio

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| ST-01 | Studio Editor | `06-studio-spec.md` | `09-content-studio-ux-blueprint.md` P-CN-04 | `10-playlist-flows.md` FL-PL-04 | `31` (All Studio components) | Loading (Splash), Error, Saving |

### Scheduling & Analytics

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| SCH-01 | Scheduling Calendar | `07-scheduling-analytics-specs.md` | `10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01 | `11-publishing-scheduling-flows.md` FL-PUB-02 | `22`, `35` (Calendar, ScheduleDialog) | Loading, Empty, Error |
| AN-01 | Analytics Dashboard | `07-scheduling-analytics-specs.md` | `10-scheduling-analytics-team-ux-blueprint.md` P-AN-01 | `14-notification-analytics-flows.md` FL-AN-01 | `28`, `29` (Charts) | Loading, Empty, Error |

### Team

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| TM-01 | Team Management | `08-team-spec.md` | `10-scheduling-analytics-team-ux-blueprint.md` P-TM-01 | `12-team-flows.md` FL-TM-01 | `16` (Table), `22`, `37` (MemberRow) | Loading, Empty, Error |

### Settings

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| SET-01 | Profile | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `13-settings-flows.md` FL-SET-01 | `13`, `14`, `15`, `37` | Loading, Error, Success |
| SET-02 | Workspace | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `07-workspace-flows.md` FL-WS-03 | `13`, `14`, `37` | Loading, Error, Success |
| SET-03 | Billing | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `13-settings-flows.md` FL-SET-03 | `15`, `28` (UsageBar), `37` (PlanCard) | Loading, Error, Success |
| SET-04 | Security | `10-settings-specs-part2.md` | `12-settings-ux-blueprint-part2.md` | `13-settings-flows.md` FL-SET-04 | `13`, `14`, `22`, `37` | Loading, Error, Success |
| SET-05 | API Keys | `10-settings-specs-part2.md` | `12-settings-ux-blueprint-part2.md` | `13-settings-flows.md` FL-SET-05 | `16`, `22`, `37` (ApiKeyRow) | Loading, Empty, Error, Success |
| SET-06 | Notifications | `10-settings-specs-part2.md` | `13-settings-ux-blueprint-part3.md` | `13-settings-flows.md` FL-SET-06 | `13`, `37` (NotificationToggle) | Loading, Error, Success |

### Notifications

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| NOT-01 | Notifications History | `11-notifications-admin-specs-part1.md` | `14-notifications-ux-blueprint.md` | `14-notification-analytics-flows.md` FL-NOT-01 | `17` (List), `25`, `27` | Loading, Empty, Error |

### Admin

| Screen ID | Screen Name | Screen Spec | UX Blueprint | User Flow | DS V2 Components | Key States |
|-----------|------------|------------|-------------|-----------|-----------------|------------|
| ADM-01 | Admin Customers | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` P-ADM-01 | `15-admin-flows.md` FL-ADM-01 | `16`, `26`, `27`, `36` | Loading, Empty, Error |
| ADM-02 | Admin Staff | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` P-ADM-02 | `15-admin-flows.md` FL-ADM-02 | `16`, `36` | Loading, Empty, Error |
| ADM-03 | Admin Users | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` P-ADM-03 | `15-admin-flows.md` FL-ADM-03 | `16`, `36` | Loading, Empty, Error |
| ADM-04 | Admin Workspaces | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` P-ADM-04 | `15-admin-flows.md` FL-ADM-04 | `16`, `36` | Loading, Empty, Error |
| ADM-05 | Admin Fleet | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` P-ADM-05 | `15-admin-flows.md` FL-ADM-05 | `16`, `28`, `36` | Loading, Error, Realtime |
| ADM-06 | Admin Health | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` P-ADM-06 | `15-admin-flows.md` FL-ADM-06 | `15`, `36` (HealthStatusCard) | Loading, Error |
| ADM-07 | Admin Logs | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` P-ADM-07 | `15-admin-flows.md` FL-ADM-07 | `16`, `36` (LogLevelBadge) | Loading, Empty, Error |
| ADM-08 | Admin Feature Flags | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` P-ADM-08 | `15-admin-flows.md` FL-ADM-08 | `13` (Toggle), `36` (FeatureFlagToggle) | Loading, Error |

### Shared Dialogs

| Dialog ID | Dialog Name | Screen Spec | DS V2 Components |
|-----------|------------|------------|-----------------|
| DLG-01 | Publish to Screens | `13-shared-dialogs-specs.md` SCR-DLG-01 | `22` (Dialog), `26` (Search) |
| DLG-02 | Template Picker | `13-shared-dialogs-specs.md` SCR-DLG-02 | `22`, `33` (TemplateCard) |
| DLG-03 | Schedule Create/Edit | `13-shared-dialogs-specs.md` SCR-DLG-03 | `22`, `35` (DatePicker) |
| DLG-04 | Invite Member | `13-shared-dialogs-specs.md` SCR-DLG-04 | `22`, `13`, `14` |
| DLG-05 | Delete Confirmation | `13-shared-dialogs-specs.md` SCR-DLG-05 | `22` (AlertDialog) |
| DLG-06 | 2FA Setup | `13-shared-dialogs-specs.md` SCR-DLG-06 | `22`, `13`, `14` |

---

## 4. Screen Count Summary

| Category | Screens | Dialogs | Total |
|----------|---------|---------|-------|
| Auth & Error | 8 | 0 | 8 |
| Workspace | 2 | 0 | 2 |
| Overview | 1 | 0 | 1 |
| Screens | 3 | 0 | 3 |
| Content | 4 | 0 | 4 |
| Studio | 1 | 0 | 1 |
| Scheduling & Analytics | 2 | 0 | 2 |
| Team | 1 | 0 | 1 |
| Settings | 6 | 0 | 6 |
| Notifications | 1 | 0 | 1 |
| Admin | 8 | 0 | 8 |
| Shared Dialogs | 0 | 6 | 6 |
| **Total** | **37** | **6** | **43** |

---

## 5. Traceability Verification

Before implementing any screen, verify:

- [ ] Screen ID identified (from this map)
- [ ] Screen Specification read and understood
- [ ] UX Blueprint read and understood
- [ ] User Flow read and understood
- [ ] All DS V2 component specs read (for components used on this screen)
- [ ] State requirements identified (loading, empty, error, success)
- [ ] Acceptance criteria from screen spec reviewed
- [ ] `16-screen-compliance-checklist.md` completed

---

## Cross-References

- See `03-document-reading-order.md` for reading sequence
- See `06-component-traceability-map.md` for component traceability
- See `07-feature-traceability-map.md` for feature traceability
- See `16-screen-compliance-checklist.md` for screen compliance
- See `screen-specifications/14-screen-specifications-summary.md` for screen readiness
