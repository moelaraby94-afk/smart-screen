# 09 — UX Validation

> **Phase 9:** Per-persona UX validation — navigation, permissions, workflows, complexity, dead ends, clicks, confusing flows

---

## 1. Persona Inventory

| Persona | App | Current State | Blueprint Target |
|---|---|---|---|
| Platform Owner | Control Panel | Embedded in dashboard `/admin/*` | Separate app `admin.cloudsignage.com` |
| Support Specialist | Control Panel | Embedded in dashboard `/admin/*` | Separate app, read-only + impersonation |
| Billing Manager | Control Panel | Embedded in dashboard `/admin/*` | Separate app, billing-focused |
| Operations Engineer | Control Panel | **Does not exist** | Separate app, health + fleet |
| Security Analyst | Control Panel | **Does not exist** | Separate app, audit + security |
| Customer Owner | Customer Workspace | `/overview`, `/screens`, etc. | Same, cleaned up |
| Customer Admin | Customer Workspace | Same as Owner | Same, with member management |
| Customer Editor | Customer Workspace | Same as Owner | Same, with content creation |
| Customer Viewer | Customer Workspace | Same as Owner | Same, read-only |
| Player | Player App | `apps/player/` | Same, unchanged |

---

## 2. Platform Owner UX

### 2.1 Current Flow

```
Login → Dashboard → Sidebar shows admin nav (sovereign mode)
→ Admin Home → Customers / Staff / Users / Workspaces / Fleet / Logs / Settings
```

### 2.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Sovereign mode detection | **HIGH** | `sovereign` flag depends on `sessionStorage`, path matching, and loading state. Race conditions cause admin nav to flash or not appear. |
| No dedicated login | **MEDIUM** | Platform owner logs in through the same customer login page. No indication of platform vs customer context. |
| Admin nav in customer bundle | **CRITICAL** | Admin navigation labels and routes are visible in customer browser source. |
| No platform branding | **LOW** | Platform and customer share the same branding. Platform should have distinct visual identity. |
| Impersonation return | **OK** | `ImpersonationReturnButton` is well-implemented. Shows "Viewing as [user]" with exit button. |
| Settings page | **OK** | `admin-settings-client.tsx` (7.6 KB) has branding upload, platform config. Functional. |

### 2.3 Target Flow

```
Platform Login (admin.cloudsignage.com/login)
→ Platform Dashboard
→ Sidebar: Customers, Staff, Users, Workspaces, Fleet, Analytics, Audit Log, Settings, Feature Flags, Health, Billing
→ Each page is self-contained in the Control Panel app
```

---

## 3. Support Specialist UX

### 3.1 Current Flow

```
Login → Dashboard → Admin nav (sovereign mode)
→ Customers → Search → Customer Profile → Workspace Detail
→ Impersonate (if super admin — support specialist can't impersonate)
```

### 3.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Support specialist can't impersonate | **MEDIUM** | Only super admin can impersonate. Blueprint proposes support specialist impersonation with audit. |
| No ticket/case system | **LOW** | Blueprint doesn't mention ticketing. Support specialist must use external tools. |
| Read-only access is correct | ✅ | `@PlatformRoles(SUPPORT_SPECIALIST)` on read endpoints. Write endpoints are super-admin only. |
| Customer profile tabs | **OK** | `admin-customer-profile-tabs.tsx` (22 KB) has detailed tabs for workspaces, screens, subscription, audit. Good UX. |
| Fleet view | **OK** | `admin-fleet-client.tsx` (7.6 KB) shows global screen fleet. Functional. |

---

## 4. Billing Manager UX

### 4.1 Current Flow

```
Login → Dashboard → Admin nav
→ Stats (revenue figures) → Customers → Subscription management
```

### 4.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| No invoice management | **HIGH** | Blueprint proposes invoice viewing. Not implemented. |
| No revenue charts | **MEDIUM** | `admin-home-overview-client.tsx` (5.4 KB) shows basic stats. No visual charts. |
| No dunning dashboard | **MEDIUM** | Blueprint proposes dunning. Not implemented. |
| No plan management | **HIGH** | Plans are enum-based. Can't create/edit plans from UI. |
| Subscription mocking | **OK** | Super admin can mock plans for testing. `mockWorkspaceSubscriptionPlan` endpoint. |

---

## 5. Customer Owner UX

### 5.1 Current Flow

```
Login → Dashboard → Overview
→ Sidebar: Overview, Screens, Content, Scheduling, Campaigns, Analytics, Team, Settings
→ Workspace switcher (if multiple workspaces)
```

### 5.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Workspace switcher | **OK** | `WorkspaceSwitcher` component in sidebar. Works well. |
| Onboarding widget | **OK** | `OnboardingProgress` model + widget. 5-step onboarding. Good. |
| Settings has 8 sub-routes | **MEDIUM** | Profile, Billing, Workspace, API Keys, Webhooks, Islamic, Notifications, Security. May be overwhelming. Consider grouping. |
| No usage dashboard | **MEDIUM** | Blueprint proposes usage tracking. Not implemented. Customer can't see how much storage/screens they're using. |
| No plan upgrade prompt | **LOW** | Blueprint proposes contextual upgrade prompts. Not implemented. |

---

## 6. Customer Admin UX

### 6.1 Current Flow

Same as Owner but with member management capabilities.

### 6.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Team management | **OK** | `team-client.tsx` is well-implemented with invitations, roles, avatars, permissions. |
| Account members | **OK** | `AccountMember` model with workspace scopes. Good design. |
| Role assignment | **OK** | Can assign OWNER, ADMIN, EDITOR, VIEWER. |
| No custom roles | **MEDIUM** | Blueprint proposes custom roles for enterprise. Not implemented. |

---

## 7. Customer Editor UX

### 7.1 Current Flow

```
Login → Dashboard → Can create/edit content, screens, schedules
→ Cannot manage team or settings
```

### 7.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Creative Studio | **OK** | `studio/` feature with Konva canvas editor. 7 files. Functional. |
| Playlist management | **OK** | 28 files in `playlists/`. Comprehensive. |
| Media library | **OK** | Upload, folders, expiry. Functional. |
| Schedule calendar | **OK** | `schedule-calendar.tsx` (779 lines). Month/week/day views. Good. |
| Campaign approval | **OK** | Editor can submit campaigns for approval. Good workflow. |
| No keyboard shortcuts in Studio | **LOW** | Blueprint may mention shortcuts. Not critical. |

---

## 8. Customer Viewer UX

### 8.1 Current Flow

```
Login → Dashboard → Can view content, screens, analytics
→ Cannot create/edit anything
```

### 8.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Role-based UI hiding | **OK** | `RolesGuard` enforces permissions. Frontend hides action buttons based on role. |
| No read-only mode indicator | **LOW** | Viewer sees the same UI as editor but with hidden action buttons. Could be confusing. |
| Analytics access | **OK** | Viewers can see analytics. Correct. |

---

## 9. Player UX

### 9.1 Current Flow

```
Player app loads → Pairing screen (if not paired)
→ Enter pairing code → Connects to backend → Content playback
```

### 9.2 Issues

| Issue | Severity | Detail |
|---|---|---|
| Player app is independent | ✅ | `apps/player/` is already a separate Next.js app. No changes needed. |
| Pairing flow | ✅ | `ScreenPairingSession` model with `pollSecretHash`. Secure. |
| Heartbeat | ✅ | `ScreenHeartbeatService` with offline detection. |
| Content delivery | ✅ | `PlayerService` fetches playlist content. |
| No offline mode | **MEDIUM** | Blueprint proposes offline content caching. Not implemented. Player requires constant connection. |
| No remote commands | ✅ | `screen:command` WebSocket event. Reload, reboot, etc. |

---

## 10. Cross-Persona UX Issues

### 10.1 Navigation Complexity

| Issue | Affected Personas | Severity |
|---|---|---|
| Admin nav flashes during loading | Platform Owner, Support, Billing | **HIGH** |
| Workspace switcher visible to admin | Platform staff | **MEDIUM** — confusing |
| No breadcrumb on admin pages | Platform staff | **LOW** — `AdminBreadcrumbBar` exists but not used on all pages |
| Settings has 8 sub-routes | Customer Owner/Admin | **MEDIUM** — overwhelming |

### 10.2 Dead Ends

| Dead End | Location | Severity |
|---|---|---|
| No back button on some admin pages | Admin sub-routes | **MEDIUM** — `shell-header-meta.ts` handles some but not all |
| `/displays` route may be duplicate | Customer app | **LOW** — investigate |
| No 404 handling for admin sub-routes | Admin section | **MEDIUM** — `error.tsx` exists but may not cover all cases |

### 10.3 Click Depth

| Task | Current Clicks | Target Clicks | Issue? |
|---|---|---|---|
| Platform owner → Impersonate customer | 4 (Admin → Customers → Profile → Impersonate) | 3 | ⚠️ One extra click |
| Customer owner → Create playlist | 3 (Content → Playlists → New) | 2 | ⚠️ Could be 2 |
| Customer owner → Schedule content | 3 (Scheduling → Create → Select) | 3 | ✅ |
| Support → View customer screens | 4 (Admin → Customers → Profile → Screens tab) | 3 | ⚠️ One extra click |
| Customer editor → Upload media | 2 (Content → Media → Upload) | 2 | ✅ |

### 10.4 Internationalization

| Aspect | Current | Assessment |
|---|---|---|
| Locale support | `en` + `ar` | ✅ |
| RTL support | Full RTL via `rtl` prop | ✅ |
| Translation coverage | ~95% (from previous work) | ✅ Good |
| Translation parity | `i18n:key-parity` script | ✅ Enforced |
| Hardcoded strings | `i18n:hardcoded-scan` script | ✅ Enforced |

---

## 11. UX Score Summary

| Persona | Score | Key Issue |
|---|---|---|
| Platform Owner | 5/10 | Sovereign mode fragility, admin code in customer bundle |
| Support Specialist | 6/10 | Can't impersonate, no ticket system |
| Billing Manager | 4/10 | No invoices, no plan management, no revenue charts |
| Operations Engineer | N/A | Does not exist yet |
| Security Analyst | N/A | Does not exist yet |
| Customer Owner | 7/10 | Good overall, no usage dashboard |
| Customer Admin | 7/10 | Good team management, no custom roles |
| Customer Editor | 8/10 | Good creative tools, comprehensive content management |
| Customer Viewer | 7/10 | Good read-only, no mode indicator |
| Player | 8/10 | Independent app, good pairing flow, no offline mode |
| **Overall UX** | **6.3/10** | **Admin UX is the weakest area — app separation will resolve most issues** |
