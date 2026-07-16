# Problem Map

> **Evidence basis:** All V1/V2 audit files (00-28), source code review
> **Purpose:** Complete catalog of every identified problem with unique IDs for cross-referencing

---

## Problem Catalog Convention

Each problem is documented with:
- **Problem ID** — stable identifier (P-### for UX, E-### for Enterprise, IA-### for IA, TD-### for Technical Debt, A-### for Accessibility, C-### for Consistency)
- **Category** — UX, Enterprise, IA, Technical Debt, Accessibility, Consistency, i18n
- **Severity** — Critical, High, Medium, Low
- **Business impact** — how it affects revenue, retention, or growth
- **User impact** — how it affects user experience and productivity
- **Technical impact** — how it affects code maintainability and stability
- **Affected pages/components/flows** — specific locations in the codebase
- **Evidence** — audit file and section references
- **Root cause** — why it exists (detailed in `03-root-cause-analysis.md`)
- **Priority** — High/Medium/Low (informed by severity and dependencies)
- **Implementation complexity** — Small/Medium/Large/XL
- **Related problems** — cross-references to other problem IDs

---

## Category 1: Critical UX Defects

### P-001 — Switch Component RTL Bug

| Field | Value |
|-------|-------|
| **Category** | UX / Accessibility / i18n |
| **Severity** | Critical |
| **Business impact** | Arabic-language users see broken toggle controls — undermines product credibility in target market |
| **User impact** | Toggle switches visually misrepresent their state in RTL mode — users cannot trust the UI |
| **Technical impact** | Single CSS class fix, low risk |
| **Affected pages** | All pages with Switch components (settings, notification preferences, feature flags) |
| **Affected components** | `src/components/ui/switch.tsx` |
| **Affected flows** | Settings → Notification Preferences, Settings → 2FA, Admin → Feature Flags |
| **Affected user types** | All Arabic-language users |
| **Evidence** | `05-ui-component-library.md` §6.2 — "Switch thumb uses `translate-x-4` which doesn't flip in RTL"; `24-accessibility-audit.md` §24.7 — "Switch component RTL: both an RTL bug and an accessibility issue"; `22-i18n-and-localization.md` §22.8 — "Switch component: `translate-x-4` doesn't flip in RTL" |
| **Root cause** | Physical CSS property (`translate-x`) used instead of logical property. Tailwind v3 doesn't have a logical equivalent for `translate-x`. |
| **Dependencies** | None — can be fixed independently |
| **Risk of fixing** | Very low — CSS-only change |
| **Risk of ignoring** | High — fundamental UI broken in target market language |
| **Priority** | High |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | A-003, C-001 |
| **Side effects** | None expected |
| **Success criteria** | Switch thumb visually moves in the correct direction in both LTR and RTL modes |

### P-002 — No Workspace Switcher on Mobile

| Field | Value |
|-------|-------|
| **Category** | UX / Responsive |
| **Severity** | Critical |
| **Business impact** | Mobile users with multiple workspaces cannot switch — blocks core multi-tenant workflow |
| **User impact** | Complete inability to switch workspaces on mobile devices |
| **Technical impact** | Requires adding switcher to mobile sidebar or header |
| **Affected pages** | All pages on mobile (< 1024px) |
| **Affected components** | `ShellHeader` (switcher is `hidden lg:flex`), `ShellSidebar` (no switcher in mobile drawer) |
| **Affected flows** | Workspace switching on mobile |
| **Affected user types** | All multi-workspace users on mobile |
| **Evidence** | `04-layout-and-shell.md` §4.3 — "WorkspaceSwitcher is missing on mobile header"; `25-responsive-audit.md` §25.7 — "No workspace switcher on mobile — critical UX gap"; `07-workspace-management.md` §7.11 |
| **Root cause** | Header layout hides switcher below `lg` breakpoint; mobile sidebar drawer doesn't include a switcher |
| **Dependencies** | None — can be fixed independently |
| **Risk of fixing** | Low — adding component to existing layout |
| **Risk of ignoring** | Critical — blocks multi-workspace mobile usage entirely |
| **Priority** | High |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | P-003, IA-003 |
| **Side effects** | Mobile sidebar layout may need height adjustment |
| **Success criteria** | Mobile users can switch workspaces from any page |

### P-003 — Sidebar Click Guards Logically Broken

| Field | Value |
|-------|-------|
| **Category** | UX / Logic |
| **Severity** | High |
| **Business impact** | Users without workspaces can navigate to pages that require workspace context, causing API errors and blank screens |
| **User impact** | Confusing empty pages instead of a clear "select workspace" message |
| **Technical impact** | Dead code in click handler — toasts never fire |
| **Affected pages** | All client pages when no workspace is selected |
| **Affected components** | `ShellSidebar` NavItem click handler |
| **Affected flows** | Navigation without active workspace |
| **Affected user types** | Users with no workspaces, users who deleted their workspace |
| **Evidence** | `03-routing-and-navigation.md` §3.3 — "Click guards for workspace presence on nav items are logically broken and do not show toasts as intended" |
| **Root cause** | The `CLIENT_NAV_ALLOW_WITHOUT_WORKSPACE` set check runs `e.preventDefault()` but the navigation still proceeds because the `Link` component's default behavior isn't effectively cancelled in the React event system |
| **Dependencies** | None |
| **Risk of fixing** | Low — logic fix in event handler |
| **Risk of ignoring** | Medium — users see broken pages instead of guidance |
| **Priority** | High |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | P-002, IA-003 |
| **Side effects** | None expected |
| **Success criteria** | Clicking a workspace-dependent nav item without an active workspace shows a toast and prevents navigation |

### P-004 — Back Button Label Inconsistencies

| Field | Value |
|-------|-------|
| **Category** | UX / Consistency |
| **Severity** | Medium |
| **Business impact** | Minor — erodes trust in navigation system |
| **User impact** | Back button says "Back to Overview" but navigates to `/screens` — confusing |
| **Technical impact** | Logic fix in `useShellHeaderMeta` hook |
| **Affected pages** | Screen detail (`/screens/{id}`), branch detail, settings sub-pages |
| **Affected components** | `useShellHeaderMeta` hook, `ShellHeader` back button |
| **Affected flows** | Navigation back from detail pages |
| **Affected user types** | All users |
| **Evidence** | `03-routing-and-navigation.md` §3.4 — "screen detail back button label says 'Back to Overview' but links to `/screens`"; `09-screens-feature.md` §9.8 |
| **Root cause** | `useShellHeaderMeta` returns `backLabel: t('backToOverview')` but `backHref: '/screens'` — label and href don't match |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — minor confusion |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | C-002 |
| **Side effects** | None |
| **Success criteria** | All back button labels match their destination |

### P-005 — InfoTooltip Accessibility Gap

| Field | Value |
|-------|-------|
| **Category** | Accessibility / UX |
| **Severity** | High |
| **Business impact** | WCAG 2.1 non-compliance — legal risk for government/enterprise contracts |
| **User impact** | Screen reader users cannot access tooltip content |
| **Technical impact** | Replace custom implementation with Radix Tooltip or add ARIA attributes |
| **Affected pages** | All pages using InfoTooltip (settings, dashboard, screen detail) |
| **Affected components** | `src/components/ui/info-tooltip.tsx` |
| **Affected flows** | Any flow where tooltip provides critical context |
| **Affected user types** | Screen reader users, keyboard-only users |
| **Evidence** | `05-ui-component-library.md` §6.3 — "InfoTooltip is a custom implementation, not using Radix Tooltip, leading to accessibility concerns"; `24-accessibility-audit.md` §24.7 — "lacks `role='tooltip'`, `aria-describedby`, focus trap, or delay" |
| **Root cause** | Custom tooltip built without accessibility primitives — likely a quick implementation that skipped ARIA |
| **Dependencies** | None |
| **Risk of fixing** | Low — component replacement |
| **Risk of ignoring** | High — WCAG non-compliance |
| **Priority** | High |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | A-001 |
| **Side effects** | Tooltip behavior may change slightly (delay, positioning) |
| **Success criteria** | Tooltip content announced by screen readers; keyboard accessible |

---

## Category 2: Enterprise SaaS Gaps

### E-001 — No SSO/SAML Integration

| Field | Value |
|-------|-------|
| **Category** | Enterprise |
| **Severity** | High |
| **Business impact** | Blocks enterprise sales — SSO is a hard requirement for large organizations |
| **User impact** | Enterprise users must maintain separate credentials |
| **Technical impact** | Requires backend SAML/OIDC support + frontend login flow changes |
| **Affected pages** | Login page |
| **Affected components** | `login-form.tsx` |
| **Affected flows** | Authentication |
| **Affected user types** | Enterprise users |
| **Evidence** | `28-feature-inventory.md` §28.6 — "No SSO/SAML — Enterprise customers require SSO integration" |
| **Root cause** | Product decision — SSO not prioritized for initial market entry (SMB focus) |
| **Dependencies** | Backend SSO support required first |
| **Risk of fixing** | Medium — changes auth flow |
| **Risk of ignoring** | High — blocks enterprise market |
| **Priority** | High (for enterprise expansion) |
| **Complexity** | XL |
| **Prerequisites** | Backend SSO/SAML implementation |
| **Related problems** | E-002, E-003 |
| **Side effects** | Login page UI changes |
| **Success criteria** | Users can authenticate via SAML/OIDC providers |

### E-002 — No Audit Log for Admin Actions

| Field | Value |
|-------|-------|
| **Category** | Enterprise / Compliance |
| **Severity** | High |
| **Business impact** | Compliance blocker for government/regulated industry contracts |
| **User impact** | No accountability for admin actions including impersonation |
| **Technical impact** | Requires backend audit log + frontend audit log viewer |
| **Affected pages** | Admin panel |
| **Affected components** | Admin pages, impersonation flow |
| **Affected flows** | Admin operations, impersonation |
| **Affected user types** | Super-admins, compliance officers |
| **Evidence** | `15-admin-panel.md` §15.17 — "No audit trail for admin actions"; `27-user-flows.md` §27.9 — "No visible indication to the impersonated user that an admin is viewing their workspace" |
| **Root cause** | Product decision — audit logging not implemented in initial release |
| **Dependencies** | Backend audit log infrastructure |
| **Risk of fixing** | Low — additive feature |
| **Risk of ignoring** | High — compliance blocker |
| **Priority** | High (for enterprise expansion) |
| **Complexity** | Large |
| **Prerequisites** | Backend audit log API |
| **Related problems** | E-001, E-003 |
| **Side effects** | Additional admin panel page |
| **Success criteria** | All admin actions (including impersonation) are logged with user, action, timestamp, and target |

### E-003 — No Custom Roles

| Field | Value |
|-------|-------|
| **Category** | Enterprise |
| **Severity** | High |
| **Business impact** | Limits team management to 3 predefined roles — insufficient for enterprise org structures |
| **User impact** | Cannot create roles with granular permissions (e.g., "can manage screens but not playlists") |
| **Technical impact** | Requires backend RBAC + frontend role management UI |
| **Affected pages** | Team management, settings |
| **Affected components** | Team feature components |
| **Affected flows** | Team invitation, permission management |
| **Affected user types** | Workspace owners, team admins |
| **Evidence** | `16-team-feature.md` §16.4 — "Missing team features: role change, member removal"; `28-feature-inventory.md` §28.6 — "No custom roles — only predefined admin/editor/viewer" |
| **Root cause** | Product decision — simple role model for MVP |
| **Dependencies** | Backend RBAC implementation |
| **Risk of fixing** | Medium — changes permission checks across all features |
| **Risk of ignoring** | High — blocks enterprise team management |
| **Priority** | High (for enterprise expansion) |
| **Complexity** | XL |
| **Prerequisites** | Backend role/permission system |
| **Related problems** | E-001, E-002 |
| **Side effects** | All permission-gated UI must be updated |
| **Success criteria** | Workspace owners can create custom roles with granular permissions |

### E-004 — No Bulk Operations

| Field | Value |
|-------|-------|
| **Category** | Enterprise / UX |
| **Severity** | High |
| **Business impact** | Limits scalability for users managing large fleets (100+ screens, 50+ media items) |
| **User impact** | Must perform actions one-by-one — time-consuming for large datasets |
| **Technical impact** | Requires multi-select UI + bulk API endpoints |
| **Affected pages** | Screens list, media library, team management |
| **Affected components** | Screen cards, media grid, team list |
| **Affected flows** | Screen management, media management, team management |
| **Affected user types** | All users with large datasets |
| **Evidence** | `09-screens-feature.md` §9.8 — "No bulk actions"; `11-media-library.md` §11.6 — "No bulk operations"; `16-team-feature.md` §16.4 |
| **Root cause** | Product decision — individual actions sufficient for initial SMB target market |
| **Dependencies** | Backend bulk API endpoints |
| **Risk of fixing** | Medium — UI pattern addition |
| **Risk of ignoring** | High — limits product scalability |
| **Priority** | High |
| **Complexity** | Large |
| **Prerequisites** | Backend bulk endpoints |
| **Related problems** | E-005 |
| **Side effects** | List UI changes (checkboxes, action bar) |
| **Success criteria** | Users can select multiple items and perform bulk actions (delete, assign, move) |

### E-005 — No Timezone-Aware Scheduling

| Field | Value |
|-------|-------|
| **Category** | Enterprise / UX |
| **Severity** | High |
| **Business impact** | Critical for multi-location deployments across timezones |
| **User impact** | Schedules use workspace timezone only — branches in different timezones get wrong schedule times |
| **Technical impact** | Requires timezone selection in schedule UI + backend timezone handling |
| **Affected pages** | Schedules page, schedule create dialog |
| **Affected components** | Schedule calendar, schedule form |
| **Affected flows** | Schedule creation, schedule editing |
| **Affected user types** | Users with branches in multiple timezones |
| **Evidence** | `12-schedules-feature.md` §12.9 — "No timezone handling" |
| **Root cause** | Product decision — assumed single-timezone deployments |
| **Dependencies** | Backend timezone support |
| **Risk of fixing** | Medium — UI addition + data model change |
| **Risk of ignoring** | High — incorrect content display for multi-timezone deployments |
| **Priority** | High |
| **Complexity** | Large |
| **Prerequisites** | Backend timezone support |
| **Related problems** | E-004 |
| **Side effects** | Schedule display changes |
| **Success criteria** | Schedules can be created with explicit timezone; display converts to user's local timezone |

### E-006 — Workspace Switcher Doesn't Scale

| Field | Value |
|-------|-------|
| **Category** | Enterprise / UX |
| **Severity** | Medium |
| **Business impact** | Limits usability for users with many workspaces (agencies, managed service providers) |
| **User impact** | Must scroll through unsearchable list of workspaces |
| **Technical impact** | Add search input to dropdown |
| **Affected pages** | All pages (switcher is in header) |
| **Affected components** | `WorkspaceSwitcher` |
| **Affected flows** | Workspace switching |
| **Affected user types** | Users with 10+ workspaces |
| **Evidence** | `07-workspace-management.md` §7.11 — "No search, no metadata" |
| **Root cause** | UX decision — simple dropdown sufficient for initial use case (most users have 1-3 workspaces) |
| **Dependencies** | None |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Medium — degrades experience as user base grows |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | P-002 |
| **Side effects** | Dropdown height may increase |
| **Success criteria** | Users can search workspaces by name; workspace metadata (plan, screen count) visible in dropdown |

---

## Category 3: Information Architecture Issues

### IA-001 — Flat Sidebar Navigation (18 Items, No Grouping)

| Field | Value |
|-------|-------|
| **Category** | IA / UX |
| **Severity** | High |
| **Business impact** | Navigation complexity scales linearly with feature count — future features will worsen the problem |
| **User impact** | 18 undifferentiated items — no visual hierarchy, no grouping, high scanning time |
| **Technical impact** | Restructure sidebar navigation data model |
| **Affected pages** | All pages (sidebar is persistent) |
| **Affected components** | `ShellSidebar` |
| **Affected flows** | Navigation |
| **Affected user types** | All client users |
| **Evidence** | `03-routing-and-navigation.md` §3.2 — "Client mode is a flat list of 18 items with no grouping"; `03-routing-and-navigation.md` §3.5 — "Navigation depth: flat list means no hierarchy" |
| **Root cause** | Product decision — flat list simplest to implement; no IA planning for feature growth |
| **Dependencies** | None |
| **Risk of fixing** | Medium — changes navigation mental model |
| **Risk of ignoring** | High — worsens with every new feature |
| **Priority** | High |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | IA-002, IA-003 |
| **Side effects** | Users may need to relearn navigation |
| **Success criteria** | Sidebar items grouped into max 5-7 categories with max 5 items per group |

### IA-002 — Inconsistent Navigation Structure (Client vs. Admin)

| Field | Value |
|-------|-------|
| **Category** | IA / Consistency |
| **Severity** | Medium |
| **Business impact** | Admins who also use client features experience cognitive switching cost |
| **User impact** | Different navigation patterns in different modes |
| **Technical impact** | Unify navigation data model |
| **Affected pages** | All pages |
| **Affected components** | `ShellSidebar` |
| **Affected flows** | Navigation in client vs. admin mode |
| **Affected user types** | Super-admins |
| **Evidence** | `03-routing-and-navigation.md` §3.2 — "Admin mode has grouped sections" vs. "Client mode is a flat list" |
| **Root cause** | Admin and client navigation developed separately with different patterns |
| **Dependencies** | IA-001 must be resolved first |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Medium — inconsistency erodes trust |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | IA-001 |
| **Related problems** | IA-001 |
| **Side effects** | None |
| **Success criteria** | Both client and admin navigation use the same grouping pattern |

### IA-003 — Workspace Switching Navigates to /branches

| Field | Value |
|-------|-------|
| **Category** | IA / UX |
| **Severity** | Medium |
| **Business impact** | Minor — unexpected navigation creates confusion |
| **User impact** | After switching workspace, user lands on branch list instead of dashboard |
| **Technical impact** | Change navigation target in `WorkspaceSwitcher` |
| **Affected pages** | All pages (switcher is global) |
| **Affected components** | `WorkspaceSwitcher` |
| **Affected flows** | Workspace switching |
| **Affected user types** | All multi-workspace users |
| **Evidence** | `07-workspace-management.md` §7.11 — "Selecting a workspace navigates to `/branches`"; `27-user-flows.md` §27.9 — "navigates to `/branches` instead of `/overview`" |
| **Root cause** | UX decision — branches are the primary workspace entity, so showing them first was considered logical |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — minor confusion |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | P-002 |
| **Side effects** | None |
| **Success criteria** | Workspace switching navigates to `/overview` (dashboard) |

### IA-004 — Quick Actions Navigate Instead of Acting

| Field | Value |
|-------|-------|
| **Category** | IA / UX |
| **Severity** | Medium |
| **Business impact** | Reduces dashboard utility as a launchpad |
| **User impact** | "Add Screen" takes user to screens page instead of opening an add-screen dialog |
| **Technical impact** | Change quick action handlers from navigation to modal/dialog opening |
| **Affected pages** | Dashboard |
| **Affected components** | Quick actions widget |
| **Affected flows** | Dashboard → quick action |
| **Affected user types** | All users |
| **Evidence** | `08-dashboard-and-overview.md` §8.17 — "Quick actions navigate to pages rather than performing actions directly"; `21-search-and-global-actions.md` §21.3 |
| **Root cause** | UX decision — navigation is simpler than modal management; avoids modal state complexity |
| **Dependencies** | None |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Medium — dashboard feels like a link list rather than a command center |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | IA-001 |
| **Side effects** | Need to create add-screen, upload-media, create-playlist dialogs |
| **Success criteria** | Quick actions perform their intended action (open dialog) rather than navigating |

### IA-005 — Settings Page Lacks Back Button

| Field | Value |
|-------|-------|
| **Category** | IA / UX |
| **Severity** | Low |
| **Business impact** | Minor — settings is a destination page, not a deep page |
| **User impact** | No way to go back from settings sub-pages via header back button |
| **Technical impact** | Add settings routes to `useShellHeaderMeta` |
| **Affected pages** | Settings sub-pages (profile, billing, workspace, notifications, 2FA) |
| **Affected components** | `useShellHeaderMeta` |
| **Affected flows** | Settings navigation |
| **Affected user types** | All users |
| **Evidence** | `14-settings-feature.md` §14.8 — "Missing back button" |
| **Root cause** | `useShellHeaderMeta` doesn't have a case for settings sub-routes |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — users use browser back or sidebar |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | P-004 |
| **Side effects** | None |
| **Success criteria** | Settings sub-pages show a back button to settings root |

---

## Category 4: Technical Debt

### TD-001 — Inconsistent Loading State Patterns

| Field | Value |
|-------|-------|
| **Category** | Technical Debt / UX |
| **Severity** | Medium |
| **Business impact** | Inconsistent perceived performance — some pages feel fast (skeletons), others slow (text) |
| **User impact** | Different loading indicators across the app create an unpolished feel |
| **Technical impact** | Standardize on skeleton for page-level, spinner for action-level |
| **Affected pages** | Overview (skeleton), ClientHomeDashboard (text), WorkspaceGate (spinner), OnboardingWizard (spinner) |
| **Affected components** | Multiple |
| **Affected flows** | All data-loading flows |
| **Affected user types** | All users |
| **Evidence** | `23-error-handling-and-states.md` §23.9 — "Three different loading patterns (skeleton, spinner, text)" |
| **Root cause** | Different developers implemented loading states independently without a shared pattern |
| **Dependencies** | None |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Medium — worsens as new pages are added |
| **Priority** | Medium |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | TD-002, C-003 |
| **Side effects** | None |
| **Success criteria** | All page-level loading uses skeleton; all action-level loading uses spinner |

### TD-002 — Inconsistent Icon Stroke Width

| Field | Value |
|-------|-------|
| **Category** | Technical Debt / Consistency |
| **Severity** | Low |
| **Business impact** | Negligible |
| **User impact** | Subtle visual inconsistency |
| **Technical impact** | Unify to single stroke width constant |
| **Affected pages** | All pages |
| **Affected components** | Sidebar (1.6), EmptyState (1.5), others (2.0) |
| **Evidence** | `26-consistency-audit.md` §26.6 — "Three different stroke weights (1.5, 1.6, 2.0)" |
| **Root cause** | Different `strokeWidth` values used by different developers |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — cosmetic |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | TD-001, C-001 |
| **Side effects** | None |
| **Success criteria** | Single `ICON_STROKE` constant used across all components |

### TD-003 — Icon Duplication (Clapperboard for Playlists + Studio)

| Field | Value |
|-------|-------|
| **Category** | Consistency / IA |
| **Severity** | Low |
| **Business impact** | Negligible |
| **User impact** | Users may conflate Playlists and Studio features |
| **Technical impact** | Change icon for one of the two features |
| **Affected pages** | Sidebar, quick actions |
| **Affected components** | `ShellSidebar`, quick actions widget |
| **Evidence** | `26-consistency-audit.md` §26.6 — "Clapperboard used for both Playlists and Studio" |
| **Root cause** | No icon governance — developer chose same icon for related features |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — minor confusion |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | IA-001 |
| **Side effects** | None |
| **Success criteria** | Playlists and Studio have distinct icons |

### TD-004 — AuroraBackdrop Dead Code

| Field | Value |
|-------|-------|
| **Category** | Technical Debt |
| **Severity** | Low |
| **Business impact** | None |
| **User impact** | None — users never see it |
| **Technical impact** | Either render it or remove it |
| **Affected components** | `src/components/aurora-backdrop.tsx`, `CrystalShell` |
| **Evidence** | `04-layout-and-shell.md` §4.8 — "AuroraBackdrop component exists but is not rendered by CrystalShell" |
| **Root cause** | Component was created but never integrated into the shell |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — dead code maintenance burden |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | None |
| **Side effects** | Rendering it changes visual appearance |
| **Success criteria** | Either rendered or removed |

### TD-005 — hasSuccessfulMeRef Silent Error Swallowing

| Field | Value |
|-------|-------|
| **Category** | Technical Debt / UX |
| **Severity** | Medium |
| **Business impact** | Silent auth failures after first success — user appears logged in but data is stale |
| **User impact** | Session may silently fail without user awareness |
| **Technical impact** | Remove the ref guard or add error handling |
| **Affected components** | `WorkspaceProvider` |
| **Affected flows** | Session refresh, workspace data refresh |
| **Evidence** | `07-workspace-management.md` §7.11 — "hasSuccessfulMeRef silent error swallowing" |
| **Root cause** | Optimization to prevent redundant fetches after first success — but it also prevents error recovery |
| **Dependencies** | None |
| **Risk of fixing** | Medium — may increase API calls |
| **Risk of ignoring** | Medium — silent failures are hard to debug |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | TD-006 |
| **Side effects** | May increase API call frequency |
| **Success criteria** | Auth errors after first success are handled properly (redirect to login or retry) |

### TD-006 — Socket.IO WebSocket-Only Transport

| Field | Value |
|-------|-------|
| **Category** | Technical Debt / UX |
| **Severity** | Medium |
| **Business impact** | Fails silently on networks that block WebSocket (corporate proxies, some public Wi-Fi) |
| **User impact** | Realtime updates stop without notification |
| **Technical impact** | Add polling fallback or connection status indicator |
| **Affected components** | `WorkspaceProvider` Socket.IO initialization |
| **Affected flows** | All realtime flows (notifications, screen status, pairing) |
| **Evidence** | `07-workspace-management.md` §7.11 — "Socket.IO transport: WebSocket only, no polling fallback"; `17-notifications.md` §17.7 — "If Socket.IO disconnects, notifications stop silently" |
| **Root cause** | Performance optimization — WebSocket is faster than polling |
| **Dependencies** | None |
| **Risk of fixing** | Low — add polling fallback |
| **Risk of ignoring** | Medium — affects users on restricted networks |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | TD-005 |
| **Side effects** | Polling fallback may increase server load |
| **Success criteria** | Socket.IO connects via polling fallback when WebSocket is blocked; users see connection status |

### TD-007 — Insufficient Test Coverage

| Field | Value |
|-------|-------|
| **Category** | Technical Debt |
| **Severity** | High |
| **Business impact** | Regression risk — changes may break critical paths without detection |
| **User impact** | Indirect — bugs reach production |
| **Technical impact** | Add unit tests for critical paths |
| **Affected components** | All |
| **Evidence** | `28-feature-inventory.md` §28.5 — "Only 2 test files found"; "No unit tests for: auth, workspace, notifications, dashboard, admin, team, settings, media, playlists, schedules, branches" |
| **Root cause** | Development speed prioritized over test coverage |
| **Dependencies** | None |
| **Risk of fixing** | None — additive |
| **Risk of ignoring** | High — regression risk increases with every change |
| **Priority** | High |
| **Complexity** | Large |
| **Prerequisites** | None |
| **Related problems** | None |
| **Side effects** | None |
| **Success criteria** | Critical paths (auth, workspace, API error handling) have unit test coverage |

---

## Category 5: Accessibility Issues

### A-001 — InfoTooltip Missing ARIA Attributes

(Same as P-005 — listed in Critical UX Defects)

### A-002 — Button Touch Targets Below 44px

| Field | Value |
|-------|-------|
| **Category** | Accessibility / UX |
| **Severity** | Medium |
| **Business impact** | WCAG 2.5.5 non-compliance |
| **User impact** | Difficult to tap accurately on mobile |
| **Technical impact** | Increase button sizes or add padding |
| **Affected pages** | All pages on mobile |
| **Affected components** | Button (`sm` = 36px, `default` = 40px) |
| **Evidence** | `02-design-system-and-tokens.md` §2.20 — "40px is below 44px. This is a minor accessibility issue"; `25-responsive-audit.md` §25.7 — "Touch targets are 32px (below 44px minimum)" |
| **Root cause** | Design decision — compact buttons for desktop density |
| **Dependencies** | None |
| **Risk of fixing** | Low — CSS size changes |
| **Risk of ignoring** | Medium — mobile usability |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | P-002 |
| **Side effects** | Layout may need adjustment for larger buttons |
| **Success criteria** | All interactive elements meet 44×44px minimum on mobile |

### A-003 — Switch RTL Bug (Same as P-001)

### A-004 — Color Contrast May Fail WCAG AA

| Field | Value |
|-------|-------|
| **Category** | Accessibility |
| **Severity** | Medium |
| **Business impact** | WCAG non-compliance |
| **User impact** | Low-contrast text difficult for users with visual impairments |
| **Technical impact** | Adjust color token values |
| **Affected pages** | All pages |
| **Affected components** | `text-muted-foreground/70` (inactive nav icons), `bg-primary/8` (active nav background) |
| **Evidence** | `24-accessibility-audit.md` §24.7 — "muted-foreground/70 may fail AA, primary/8 background may be low contrast" |
| **Root cause** | Design tokens optimized for aesthetics over contrast |
| **Dependencies** | None |
| **Risk of fixing** | Low — token value changes |
| **Risk of ignoring** | Medium — accessibility compliance |
| **Priority** | Medium |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | None |
| **Side effects** | Visual appearance changes slightly |
| **Success criteria** | All text/background combinations meet WCAG AA contrast (4.5:1 normal, 3:1 large) |

---

## Category 6: Consistency Issues

### C-001 — Three Different Icon Stroke Widths

(Same as TD-002)

### C-002 — Back Button Label/Target Mismatch

(Same as P-004)

### C-003 — Three Different Loading Patterns

(Same as TD-001)

### C-004 — Inconsistent Responsive Patterns

| Field | Value |
|-------|-------|
| **Category** | Consistency / Responsive |
| **Severity** | Low |
| **Business impact** | Negligible |
| **User impact** | Subtle layout differences between features |
| **Technical impact** | Standardize responsive patterns |
| **Affected pages** | Various |
| **Evidence** | `25-responsive-audit.md` §25.7 — "Card grids use different column counts across features (1/2/4 vs 2/3/6)" |
| **Root cause** | Different developers used different grid patterns |
| **Dependencies** | None |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Low |
| **Priority** | Low |
| **Complexity** | Medium |
| **Prerequisites** | None |
| **Related problems** | TD-001 |
| **Side effects** | None |
| **Success criteria** | Consistent grid patterns across all list views |

---

## Category 7: i18n Issues

### I-001 — No Pluralization Support

| Field | Value |
|-------|-------|
| **Category** | i18n |
| **Severity** | Low |
| **Business impact** | Negligible |
| **User impact** | "1 screens" vs "5 screens" — grammatically incorrect |
| **Technical impact** | Use next-intl pluralization features |
| **Evidence** | `22-i18n-and-localization.md` §22.8 — "No pluralization support" |
| **Root cause** | Translation strings use simple interpolation without plural rules |
| **Dependencies** | None |
| **Risk of fixing** | Very low |
| **Risk of ignoring** | Low — grammatical error |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | I-002 |
| **Side effects** | None |
| **Success criteria** | All count-based strings use pluralization rules |

### I-002 — No Eastern Arabic Numerals

| Field | Value |
|-------|-------|
| **Category** | i18n |
| **Severity** | Low |
| **Business impact** | Minor — Arabic users may expect Eastern numerals (٠١٢٣) |
| **User impact** | Western numerals (0123) shown in Arabic mode |
| **Technical impact** | Use ICU number formatting |
| **Evidence** | `22-i18n-and-localization.md` §22.8 — "No number formatting (Arabic uses Eastern numerals)" |
| **Root cause** | Default number formatting used without locale-aware formatting |
| **Dependencies** | None |
| **Risk of fixing** | Low |
| **Risk of ignoring** | Low |
| **Priority** | Low |
| **Complexity** | Small |
| **Prerequisites** | None |
| **Related problems** | I-001 |
| **Side effects** | None |
| **Success criteria** | Numbers displayed in Eastern Arabic numerals in Arabic mode (if culturally appropriate) |

---

## Problem Count Summary

| Category | Critical | High | Medium | Low | Total |
|----------|----------|------|--------|-----|-------|
| UX Defects | 2 | 2 | 1 | 0 | 5 |
| Enterprise Gaps | 0 | 5 | 1 | 0 | 6 |
| IA Issues | 0 | 1 | 3 | 1 | 5 |
| Technical Debt | 0 | 1 | 3 | 2 | 6 |
| Accessibility | 0 | 1 | 3 | 0 | 4 |
| Consistency | 0 | 0 | 1 | 3 | 4 |
| i18n | 0 | 0 | 0 | 2 | 2 |
| **Total** | **2** | **10** | **12** | **8** | **32** |

Note: Some problems appear in multiple categories (e.g., P-001 = A-003). Unique problems: **28**.
