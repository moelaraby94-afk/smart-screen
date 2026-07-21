# Current Product Model

> **Evidence basis:** V1/V2 audit files 01-08, 28; source code in `apps/dashboard/src/`

---

## 1. Product Identity

Smart Screen is a **multi-tenant digital signage management platform** designed for the Saudi/Arabian market. It enables organizations to manage physical display screens across multiple locations (branches), schedule content playlists, and monitor screen health in real-time.

### Market Position
- **Target market:** Saudi Arabia and GCC region (bilingual EN/AR, Islamic features)
- **Deployment model:** SaaS with Docker-based hosting
- **Tenant model:** Organization → Workspace → Branches → Screens
- **Differentiator:** Islamic features (prayer times, Hijri calendar, Ramadan mode) not found in global competitors

### Competitive Landscape (inferred from feature gaps)
The product competes with global digital signage platforms (ScreenCloud, Yodeck, OptiSigns, OnSign TV). The V2 audit (`28-feature-inventory.md` §28.6) identified 14 competitive feature gaps including: no live screenshot preview, no remote screen control, no OTA updates, no multi-zone layouts, no proof-of-play reports, no content approval workflow, no playlist versioning, no A/B testing, no content templates marketplace, no social media integration, no weather widget, no news/RSS feed widget.

---

## 2. User Types

### 2.1 Client Users

| Type | Role | Permissions | Evidence |
|------|------|-------------|----------|
| Workspace Owner | Full control | Create workspaces, manage branches, manage screens, manage content, manage team, manage billing | `07-workspace-management.md` |
| Editor | Content management | Manage screens, playlists, media, schedules (no billing, no team management) | `16-team-feature.md` |
| Viewer | Read-only | View screens, playlists, schedules, analytics (no edit) | `16-team-feature.md` |

**Current limitation:** Only 3 predefined roles. No custom roles, no granular permissions. (`28-feature-inventory.md` §28.6, `16-team-feature.md` §16.4)

### 2.2 Admin Users

| Type | Role | Permissions | Evidence |
|------|------|-------------|----------|
| Super-Admin | Full system control | Manage all customers, staff, users, workspaces, fleet, feature flags, system health, logs | `15-admin-panel.md` |
| Staff | Limited admin | (Role exists but permission boundaries not clearly defined in frontend) | `15-admin-panel.md` |

**Sovereign Mode:** Super-admins are restricted from client routes — they are redirected to `/overview` with a toast hint. This is enforced by `WorkspaceGate` (`04-layout-and-shell.md` §4.6). Admins access client features via impersonation.

### 2.3 Impersonated Admin

When a super-admin impersonates a customer, they see the exact client UI with the customer's workspace context. The `ImpersonationReturnButton` is always visible (floating, persistent). Realtime events continue working via Socket.IO re-subscription. (`27-user-flows.md` §27.9)

**Gap:** No audit trail for impersonation actions. No visible indication to the impersonated user. (`15-admin-panel.md` §15.17, `27-user-flows.md` §27.9)

---

## 3. Tenant Hierarchy

```
Organization (billing entity)
  └── Workspace (tenant boundary, API scoping)
       └── Branch (physical location grouping)
            └── Screen (physical display device)
                 └── Playlist (content schedule assignment)
                      └── Media (images, videos, HTML)
```

### Key Observations

1. **Workspace is the primary tenant boundary** — all API calls are scoped to the active workspace ID (cookie-based: `cs_workspace_id`). (`07-workspace-management.md` §7.3)

2. **Branches function as workspace equivalents** in the UI — the workspace switcher navigates to `/branches` after switching, and branch detail pages show branch-specific stats, screens, and playlists. (`13-branches-feature.md` §13.13)

3. **A user can belong to multiple workspaces** — the `WorkspaceSwitcher` dropdown lists all memberships. Switching workspaces triggers `bumpWorkspaceDataEpoch()` to force SWR revalidation. (`07-workspace-management.md` §7.11)

4. **Super-admins are workspace-agnostic** — they don't have client workspaces. The `WorkspaceGate` shows a welcome screen if no workspaces exist, but super-admins are redirected away from client routes entirely. (`04-layout-and-shell.md` §4.6)

---

## 4. Core Feature Set

### 4.1 Feature Maturity (from `28-feature-inventory.md` §28.6)

| Feature | Implementation | UX Polish | Enterprise Ready |
|---------|---------------|-----------|-----------------|
| Auth & Session | Complete | Medium | No SSO |
| Workspace Mgmt | Complete | Medium | No scale |
| Screens | Complete | Medium | No bulk |
| Playlists & Studio | Complete | Medium | No versioning |
| Media Library | Complete | Low | No bulk upload |
| Schedules | Complete | Medium | No timezone |
| Branches | Complete | Good | No grouping |
| Settings | Complete | Medium | No plan selector |
| Admin Panel | Complete | Medium | No roles |
| Team | Partial | Low | No role change |
| Notifications | Complete | Medium | No persistence |
| Analytics | Partial | Medium | No export |
| Islamic Features | Complete | Good | Market-specific |
| API & Webhooks | Complete | Good | No analytics |
| i18n & RTL | Complete | Medium | EN+AR |
| Global Search | Complete | Medium | No cross-ws |
| Emergency | Complete | Medium | No duration |

### 4.2 Feature Interdependencies

```
Auth → Workspace → Branch → Screen → Playlist → Media
                                   ↓
                               Schedule → Screen
                                   ↓
                               Analytics ← Screen Health
                                   ↓
                              Notifications ← Socket.IO
```

- **Auth is the entry gate** — no feature is accessible without authentication
- **Workspace is the scoping boundary** — most features require an active workspace
- **Screens depend on branches** — screens are paired to branches
- **Playlists depend on media** — playlists compose media items
- **Schedules depend on playlists and screens** — schedules assign playlists to screens at times
- **Analytics depends on all entities** — aggregates data across screens, playlists, schedules
- **Notifications depend on Socket.IO** — realtime events from backend to frontend

---

## 5. Technology Model

### 5.1 Architecture (from `01-architecture-and-stack.md`)

- **Framework:** Next.js 16 App Router with locale-based routing (`/{locale}/...`)
- **Rendering:** Mixed server/client components — server for auth guards, client for all interactive UI
- **State:** React Context providers (Workspace, Notifications, Branding, HeaderMeta) + SWR for data fetching
- **Realtime:** Socket.IO with WebSocket-only transport
- **Styling:** Tailwind CSS v3 with ORCA design tokens (CSS custom properties)
- **Components:** Radix UI primitives + custom components (InfoTooltip, EmptyState, etc.)
- **Animation:** framer-motion for page transitions, hero animations, modal animations
- **Canvas:** Konva + react-konva for playlist studio editor
- **i18n:** next-intl with EN/AR locales, URL-based locale, `NEXT_LOCALE` cookie
- **Theming:** next-themes with `class` strategy (light/dark)
- **Error tracking:** Sentry (conditional on DSN)

### 5.2 Provider Stack

```
ThemeProvider (next-themes)
  └── LocaleProvider (next-intl)
       └── SWRConfig (global)
            └── NotificationProvider (Socket.IO + toast)
                 └── BrandingProvider (workspace branding)
                      └── WorkspaceProvider (auth, workspace, super-admin state)
                           └── CrystalShell (sidebar + header + main)
```

Each provider's dependencies are above it in the tree. The `WorkspaceProvider` is the most impactful — workspace changes trigger re-renders of sidebar, header, gate, and all page content. (`01-architecture-and-stack.md` §1.7)

### 5.3 Data Flow

```
User interaction → API call (apiFetch with CSRF + token refresh)
  → SWR cache → Component re-render
  → Socket.IO event → NotificationProvider → Toast + bell badge
  → Optimistic UI update (in some cases)
```

**Key characteristics:**
- SWR global config disables `revalidateOnFocus` and `errorRetryCount` — stale data after tab switching, no auto-retry (`01-architecture-and-stack.md` §1.7)
- Realtime updates rely entirely on Socket.IO — no polling fallback (`07-workspace-management.md` §7.11)
- No optimistic updates implemented — all mutations wait for API response before updating UI
- No streaming/progressive loading — pages wait for all data before rendering (`23-error-handling-and-states.md` §23.9)

---

## 6. Business Model (Inferred)

### 6.1 Revenue Model
- **Subscription-based** — the settings page has a billing section, and the dashboard shows a subscription summary widget (`08-dashboard-and-overview.md` §8.17)
- **Tiered plans** — error codes include `SCREEN_LIMIT_REACHED`, `STORAGE_LIMIT_REACHED`, `MEMBER_LIMIT_REACHED` indicating plan-based limits (`23-error-handling-and-states.md` §23.6)
- **Payment integration** — error codes include `PAYMENT_REQUIRED`, `SUBSCRIPTION_CANCELED` (`23-error-handling-and-states.md` §23.6)

### 6.2 Growth Constraints
- **No plan selector in settings** — users cannot upgrade from the dashboard (`14-settings-feature.md` §14.8)
- **No upgrade prompts** — when limits are hit, error toasts appear but no inline upgrade CTA (`08-dashboard-and-overview.md` §8.17)
- **No invoice management** — billing page exists but no PDF download or invoice history (`14-settings-feature.md` §14.8)

### 6.3 Market Expansion Barriers
- **No SSO** — enterprise customers require SSO (Okta, Azure AD, Google Workspace) (`28-feature-inventory.md` §28.6)
- **No custom roles** — enterprises need granular permissions beyond admin/editor/viewer (`28-feature-inventory.md` §28.6)
- **No audit log** — compliance requirement for enterprise customers (`28-feature-inventory.md` §28.6)
- **No data export** — enterprises need to export data for compliance and reporting (`28-feature-inventory.md` §28.6)

---

## 7. Current User Experience Summary

### 7.1 First-Time User
Register → Verify Email → Login → WorkspaceWelcome (create or demo) → OnboardingWizard (2 steps) → Dashboard

**Friction points:** Email verification adds a step. No onboarding skip. No progress indicator on registration. No back button on verify step. (`06-auth-and-session.md` §6.7, `27-user-flows.md` §27.9)

### 7.2 Daily User
Login → Dashboard (screen health, activity, quick actions) → Navigate to feature → Perform task → Return to dashboard

**Friction points:** 18 flat sidebar items with no grouping. No search/filter on list pages. No bulk actions. Inconsistent loading states. (`03-routing-and-navigation.md` §3.2, `23-error-handling-and-states.md` §23.9)

### 7.3 Admin User
Login → Admin Panel → Manage customers/staff/fleet/feature-flags → Impersonate customer → Return to admin

**Friction points:** No audit trail. No custom roles for staff. Admin tables require horizontal scroll on mobile. No admin-specific dashboard. (`15-admin-panel.md` §15.17, `25-responsive-audit.md` §25.6)

### 7.4 Mobile User
Login → Dashboard → Navigate via sidebar (slide-out) → Perform task

**Friction points:** No workspace switcher on mobile. Touch targets below 44px. No bottom navigation. No pull-to-refresh. No touch-optimized date pickers. Studio canvas unusable on mobile. (`25-responsive-audit.md` §25.7)
