# Page Catalog

> **Evidence basis:** `04-final-ia-sitemap.md`, `05-navigation-architecture.md`, `product-architecture/09-product-modules.md`, `product-architecture/10-module-responsibilities.md`
> **Purpose:** Document every page in the final IA — purpose, user, goal, actions, data, relationships, visibility, permissions, complexity, importance, frequency, business value

---

## 1. Page Documentation Convention

Each page is documented with:
- **Purpose** — why this page exists
- **Primary user** — who uses this page most
- **Primary goal** — what they're trying to achieve
- **Primary action** — the main CTA
- **Secondary actions** — additional actions
- **Required data** — what data the page needs
- **Related pages** — pages connected to this one
- **Previous pages** — how users get here
- **Next pages** — where users go from here
- **Navigation path** — sidebar/header/breadcrumb
- **Visibility rules** — who can see this page
- **Permissions** — role requirements
- **Expected complexity** — Low/Medium/High
- **Importance** — Critical/High/Medium/Low
- **Frequency of use** — Daily/Weekly/Monthly/Rarely
- **Business value** — why it matters to the business

---

## 2. Auth Pages

### P-AUTH-01: Login

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/login` |
| **Purpose** | User authentication |
| **Primary user** | All users |
| **Primary goal** | Log in to the platform |
| **Primary action** | "Log In" button |
| **Secondary actions** | Forgot password, Register link, Dev login (dev mode) |
| **Required data** | Email, password, (2FA code if enabled) |
| **Related pages** | Register, Forgot Password, Overview (post-login) |
| **Previous pages** | Direct URL, marketing page, expired session redirect |
| **Next pages** | Overview (post-login), Workspace welcome (no workspace) |
| **Navigation path** | No shell — standalone auth page |
| **Visibility rules** | Unauthenticated users only |
| **Permissions** | None |
| **Complexity** | Low |
| **Importance** | Critical |
| **Frequency** | Daily (session expiry) |
| **Business value** | Entry point to the product |

### P-AUTH-02: Register

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/register` |
| **Purpose** | New user registration |
| **Primary user** | Prospective customer |
| **Primary goal** | Create an account |
| **Primary action** | "Create Account" button |
| **Secondary actions** | Login link |
| **Required data** | Name, email, password |
| **Related pages** | Login, Overview (post-register), Workspace setup |
| **Previous pages** | Marketing page, direct URL |
| **Next pages** | Workspace setup → Overview (target: auto-create workspace) |
| **Navigation path** | No shell — standalone auth page |
| **Visibility rules** | Unauthenticated users only |
| **Permissions** | None |
| **Complexity** | Low |
| **Importance** | Critical |
| **Frequency** | Once per user |
| **Business value** | Customer acquisition |

### P-AUTH-03: Forgot Password

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/forgot-password` |
| **Purpose** | Password recovery |
| **Primary user** | Users who forgot password |
| **Primary goal** | Request password reset |
| **Primary action** | "Send Reset Link" button |
| **Secondary actions** | Back to login |
| **Required data** | Email |
| **Related pages** | Login |
| **Previous pages** | Login |
| **Next pages** | Login (with success toast) |
| **Navigation path** | No shell — standalone auth page |
| **Visibility rules** | Unauthenticated users only |
| **Permissions** | None |
| **Complexity** | Low |
| **Importance** | Medium |
| **Frequency** | Rarely |
| **Business value** | Account recovery |

---

## 3. Overview Module

### P-OV-01: Overview

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/overview` |
| **Purpose** | System status, quick actions, recent activity, screen health |
| **Primary user** | Workspace Owner, Editor |
| **Primary goal** | Check system health at a glance |
| **Primary action** | "Add Screen" (if no screens) / context-dependent |
| **Secondary actions** | "Create Playlist", "View Schedule" |
| **Required data** | Screen health (online/offline counts), recent activity (last 5-10), active schedules (upcoming) |
| **Related pages** | Screen detail (click offline screen), Content (create playlist), Scheduling (view schedule) |
| **Previous pages** | Login (post-login), Workspace switch, Any page (sidebar click) |
| **Next pages** | Screen detail, Content, Scheduling, Screen pairing |
| **Navigation path** | Sidebar item #1, no breadcrumb (top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer sees read-only) |
| **Complexity** | Medium (widget-based dashboard) |
| **Importance** | Critical |
| **Frequency** | Daily |
| **Business value** | Primary landing page; screen health monitoring |

---

## 4. Screens Module

### P-SC-01: Screen List

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/screens` |
| **Purpose** | View and manage all screens in the workspace |
| **Primary user** | Workspace Owner, Editor |
| **Primary goal** | Find a specific screen or check all screens |
| **Primary action** | "Add Screen" (pairing wizard) |
| **Secondary actions** | Search, filter (by branch, status), bulk select, bulk actions |
| **Required data** | Screen list (SWR, workspace-scoped), branch list (for filter) |
| **Related pages** | Screen detail, Screen pairing wizard, Branch management |
| **Previous pages** | Overview, Sidebar navigation |
| **Next pages** | Screen detail (click card), Screen pairing (click "Add Screen") |
| **Navigation path** | Sidebar item #2, no breadcrumb (top-level list) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no bulk actions) |
| **Complexity** | Medium (search + filter + bulk + card grid) |
| **Importance** | Critical |
| **Frequency** | Daily |
| **Business value** | Primary management target; screen fleet overview |

### P-SC-02: Screen Detail

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/screens/{id}` |
| **Purpose** | View and manage a single screen |
| **Primary user** | Workspace Owner, Editor |
| **Primary goal** | Check screen status, change content, troubleshoot |
| **Primary action** | "Assign Content" (playlist selector dialog) |
| **Secondary actions** | Override content, Edit current playlist, View analytics, Reboot (future) |
| **Required data** | Screen data (SWR by ID), current playlist, active schedules, recent events |
| **Related pages** | Playlist detail (edit current), Analytics (screen-specific), Scheduling (screen schedules) |
| **Previous pages** | Screen list, Overview (health alert) |
| **Next pages** | Playlist detail (edit), Analytics, Scheduling |
| **Navigation path** | Sidebar #2 → Screen list → click card. Breadcrumb: Screens / [Name] |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no assign/override) |
| **Complexity** | Medium (status + content + schedules + actions) |
| **Importance** | High |
| **Frequency** | Daily (troubleshooting) |
| **Business value** | Screen management and troubleshooting |

### P-SC-03: Screen Pairing Wizard

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/screens/pair` |
| **Purpose** | Guide user through connecting a new screen |
| **Primary user** | Workspace Owner, Editor |
| **Primary goal** | Pair a physical screen to the platform |
| **Primary action** | "Pair Screen" (final step) |
| **Secondary actions** | Cancel, Skip optional steps |
| **Required data** | Pairing code (user input), screen name (user input), branch (optional) |
| **Related pages** | Screen list (post-pairing), Content (post-pairing CTA) |
| **Previous pages** | Screen list, Overview (quick action) |
| **Next pages** | Screen list (success), Content (post-pairing CTA: "Assign content") |
| **Navigation path** | Sidebar #2 → "Add Screen". No breadcrumb (wizard overlay or page) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner, Editor (not Viewer) |
| **Complexity** | Low (2-3 step wizard) |
| **Importance** | Critical |
| **Frequency** | Occasionally (onboarding + expansion) |
| **Business value** | 5-minute KPI; screen fleet growth |

---

## 5. Content Module

### P-CN-01: Content (Playlists Tab)

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/content` (default: Playlists tab) |
| **Purpose** | Browse, create, and manage playlists |
| **Primary user** | Editor, Workspace Owner |
| **Primary goal** | Find or create a playlist |
| **Primary action** | "Create Playlist" (template picker or blank) |
| **Secondary actions** | Search, filter, switch to Media tab |
| **Required data** | Playlist list (SWR, workspace-scoped) |
| **Related pages** | Playlist detail, Media tab, Studio |
| **Previous pages** | Overview, Sidebar navigation |
| **Next pages** | Playlist detail (click card), Studio (edit), Media tab |
| **Navigation path** | Sidebar item #3, no breadcrumb (top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no create) |
| **Complexity** | Medium (search + filter + grid + tabs) |
| **Importance** | Critical |
| **Frequency** | Weekly |
| **Business value** | Primary creation target; content management |

### P-CN-02: Content (Media Tab)

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/content/media` |
| **Purpose** | Browse, upload, and manage media files |
| **Primary user** | Editor, Workspace Owner |
| **Primary goal** | Find or upload media |
| **Primary action** | "Upload" (multi-file, drag-drop) |
| **Secondary actions** | Search, filter by type, switch to Playlists tab |
| **Required data** | Media list (SWR, workspace-scoped), storage usage |
| **Related pages** | Playlists tab, Studio (media picker), Playlist detail |
| **Previous pages** | Content (Playlists tab), Sidebar navigation |
| **Next pages** | Playlist detail (use in playlist), Studio (media panel) |
| **Navigation path** | Sidebar #3 → Media tab. No breadcrumb (tab within top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no upload) |
| **Complexity** | Medium (search + filter + grid + upload) |
| **Importance** | High |
| **Frequency** | Weekly |
| **Business value** | Content asset management; storage tracking |

### P-CN-03: Playlist Detail

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/content/playlists/{id}` |
| **Purpose** | Preview playlist, publish to screens, edit in Studio |
| **Primary user** | Editor, Workspace Owner |
| **Primary goal** | Preview and publish or edit a playlist |
| **Primary action** | "Publish to Screens" (immediate or scheduled) |
| **Secondary actions** | Edit in Studio, Create Schedule, Duplicate, Delete |
| **Required data** | Playlist data (SWR by ID), media items, assigned screens |
| **Related pages** | Studio (edit), Scheduling (create schedule), Screen detail (assigned screens) |
| **Previous pages** | Content (Playlists tab), Screen detail (edit current) |
| **Next pages** | Studio (edit), Scheduling (schedule), Screen detail (view assigned) |
| **Navigation path** | Sidebar #3 → Playlists tab → click card. Breadcrumb: Content / [Name] |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no publish/delete) |
| **Complexity** | Medium (preview + actions + metadata) |
| **Importance** | High |
| **Frequency** | Weekly |
| **Business value** | Content publishing; screen content assignment |

### P-CN-04: Studio (Canvas Editor)

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/content/playlists/{id}/studio` |
| **Purpose** | Create or edit playlist content using visual canvas editor |
| **Primary user** | Editor |
| **Primary goal** | Design or modify playlist content |
| **Primary action** | "Save" (auto-save future) |
| **Secondary actions** | Add media, add text, add shapes, arrange layers, preview, publish |
| **Required data** | Playlist data, media library (for media panel), canvas state (Konva) |
| **Related pages** | Playlist detail (back), Media tab (upload) |
| **Previous pages** | Playlist detail (edit button), Content (create → Studio) |
| **Next pages** | Playlist detail (save → back), Content (publish) |
| **Navigation path** | Sidebar #3 → Playlists → click → Edit. Breadcrumb: Content / [Name] / Studio |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner, Editor (not Viewer) |
| **Complexity** | High (canvas + timeline + layers + properties + media panel) |
| **Importance** | High |
| **Frequency** | Weekly |
| **Business value** | Content creation; differentiation from template-based creation |

---

## 6. Scheduling Module

### P-SCH-01: Scheduling Calendar

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/scheduling` |
| **Purpose** | View and manage content schedules |
| **Primary user** | Editor, Workspace Owner |
| **Primary goal** | See what's playing when; create or modify schedules |
| **Primary action** | "Create Schedule" (dialog) |
| **Secondary actions** | Switch view (month/week/day), switch to list view, filter by screen/playlist |
| **Required data** | Schedule list (SWR with date range), playlists (for color coding), screens (for filter) |
| **Related pages** | Playlist detail (edit scheduled playlist), Screen detail (view targeted screen) |
| **Previous pages** | Overview, Sidebar navigation, Playlist detail (create schedule) |
| **Next pages** | Playlist detail (edit), Screen detail (view screen) |
| **Navigation path** | Sidebar item #4, no breadcrumb (top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles (Viewer: read-only, no create) |
| **Complexity** | Medium (calendar + creation dialog + filters) |
| **Importance** | Medium |
| **Frequency** | Weekly/Monthly |
| **Business value** | Time-based content orchestration; promotional scheduling |

---

## 7. Analytics Module

### P-AN-01: Analytics Dashboard

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/analytics` |
| **Purpose** | View screen health and content performance metrics |
| **Primary user** | Workspace Owner, Editor |
| **Primary goal** | Understand how screens and content are performing |
| **Primary action** | Select period (7d, 30d, 90d, custom) |
| **Secondary actions** | Switch tab (Screen Health, Content Performance), Export (future) |
| **Required data** | Analytics data (SWR with period parameter) |
| **Related pages** | Screen detail (drill down), Playlist detail (drill down) |
| **Previous pages** | Overview, Sidebar navigation |
| **Next pages** | Screen detail (drill down), Playlist detail (drill down) |
| **Navigation path** | Sidebar item #5, no breadcrumb (top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | All roles |
| **Complexity** | Medium (charts + period selector + tabs) |
| **Importance** | Medium |
| **Frequency** | Weekly |
| **Business value** | Performance insights; data-driven content decisions |

---

## 8. Team Module

### P-TM-01: Team List

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/team` |
| **Purpose** | View and manage team members |
| **Primary user** | Workspace Owner |
| **Primary goal** | Invite, remove, or change roles of team members |
| **Primary action** | "Invite Member" (dialog) |
| **Secondary actions** | Change role, Remove member, Cancel/Resend invite |
| **Required data** | Team list (SWR, workspace-scoped), pending invites |
| **Related pages** | Settings (user profile, notifications) |
| **Previous pages** | Overview, Sidebar navigation |
| **Next pages** | Settings (user clicks own profile) |
| **Navigation path** | Sidebar item #6, no breadcrumb (top-level) |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner (full), Editor (view only), Viewer (view only) |
| **Complexity** | Low (list + invite dialog + role dropdown) |
| **Importance** | Medium |
| **Frequency** | Occasionally |
| **Business value** | Team delegation; access management |

---

## 9. Settings Module

### P-ST-01: Settings — Profile

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings` (default tab) |
| **Purpose** | Manage user profile (name, email, avatar) |
| **Primary user** | All users |
| **Primary goal** | Update personal information |
| **Primary action** | "Save" |
| **Secondary actions** | Change avatar, switch tabs |
| **Required data** | User profile (SWR) |
| **Related pages** | Security tab, Notifications tab |
| **Previous pages** | Sidebar, User menu (header) |
| **Next pages** | Other settings tabs |
| **Navigation path** | Sidebar item #7, no breadcrumb (top-level, default tab) |
| **Visibility rules** | Authenticated |
| **Permissions** | All roles (own profile only) |
| **Complexity** | Low |
| **Importance** | Medium |
| **Frequency** | Rarely |
| **Business value** | Personalization |

### P-ST-02: Settings — Workspace

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings/workspace` |
| **Purpose** | Manage workspace settings (name, branding, logo, colors) |
| **Primary user** | Workspace Owner |
| **Primary goal** | Configure workspace identity |
| **Primary action** | "Save" |
| **Secondary actions** | Upload logo, pick colors, delete workspace (danger zone) |
| **Required data** | Workspace settings (SWR) |
| **Related pages** | Billing tab, Team page |
| **Previous pages** | Settings (Profile tab), Sidebar |
| **Next pages** | Other settings tabs |
| **Navigation path** | Sidebar #7 → Workspace tab. Breadcrumb: Settings / Workspace |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner only |
| **Complexity** | Low |
| **Importance** | Medium |
| **Frequency** | Rarely |
| **Business value** | Branding; workspace identity |

### P-ST-03: Settings — Billing

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings/billing` |
| **Purpose** | Manage subscription, view invoices, update payment |
| **Primary user** | Workspace Owner |
| **Primary goal** | Check or change subscription plan |
| **Primary action** | "Upgrade Plan" (if applicable) |
| **Secondary actions** | Download invoice, Update payment method |
| **Required data** | Billing data (SWR), plan info, invoice list |
| **Related pages** | Overview (usage indicators), Media (storage limit) |
| **Previous pages** | Settings (Profile tab), Sidebar |
| **Next pages** | Other settings tabs |
| **Navigation path** | Sidebar #7 → Billing tab. Breadcrumb: Settings / Billing |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner only |
| **Complexity** | Medium (plan comparison + invoices + payment) |
| **Importance** | High |
| **Frequency** | Monthly |
| **Business value** | Revenue; subscription management |

### P-ST-04: Settings — Notifications

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings/notifications` |
| **Purpose** | Configure notification preferences per event |
| **Primary user** | All users |
| **Primary goal** | Control which notifications they receive |
| **Primary action** | "Save" |
| **Secondary actions** | Toggle per-event, toggle per-channel (in-app, email) |
| **Required data** | Notification preferences (SWR) |
| **Related pages** | Notification bell (header), Notifications history |
| **Previous pages** | Settings (Profile tab), Sidebar |
| **Next pages** | Other settings tabs |
| **Navigation path** | Sidebar #7 → Notifications tab. Breadcrumb: Settings / Notifications |
| **Visibility rules** | Authenticated |
| **Permissions** | All roles (own preferences only) |
| **Complexity** | Low (toggles) |
| **Importance** | Medium |
| **Frequency** | Rarely |
| **Business value** | User engagement; notification relevance |

### P-ST-05: Settings — Security

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings/security` |
| **Purpose** | Manage 2FA and password |
| **Primary user** | All users |
| **Primary goal** | Enable or disable 2FA, change password |
| **Primary action** | "Enable 2FA" or "Change Password" |
| **Secondary actions** | Generate backup codes, Disable 2FA |
| **Required data** | 2FA status (SWR) |
| **Related pages** | Profile tab |
| **Previous pages** | Settings (Profile tab), Sidebar |
| **Next pages** | Other settings tabs |
| **Navigation path** | Sidebar #7 → Security tab. Breadcrumb: Settings / Security |
| **Visibility rules** | Authenticated |
| **Permissions** | All roles (own security only) |
| **Complexity** | Medium (2FA flow + backup codes) |
| **Importance** | High |
| **Frequency** | Rarely |
| **Business value** | Security; account protection |

### P-ST-06: Settings — API

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/settings/api` |
| **Purpose** | Manage API keys and view API documentation |
| **Primary user** | Developer users |
| **Primary goal** | Create or revoke API keys |
| **Primary action** | "Create API Key" |
| **Secondary actions** | Revoke key, View API docs, Configure webhooks (future) |
| **Required data** | API keys (SWR) |
| **Related pages** | — |
| **Previous pages** | Settings (Profile tab), Sidebar |
| **Next pages** | — |
| **Navigation path** | Sidebar #7 → API tab. Breadcrumb: Settings / API |
| **Visibility rules** | Authenticated + has workspace |
| **Permissions** | Owner only (or Editor with API access) |
| **Complexity** | Medium (key management + docs) |
| **Importance** | Low |
| **Frequency** | Rarely |
| **Business value** | Developer integration; extensibility |

---

## 10. Notifications Page

### P-NT-01: Notifications History

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/notifications` |
| **Purpose** | View full notification history (beyond the 50 in-memory cap) |
| **Primary user** | All users |
| **Primary goal** | Review past notifications |
| **Primary action** | Mark as read / Clear |
| **Secondary actions** | Filter by type, Paginate |
| **Required data** | Notification history (SWR, paginated) |
| **Related pages** | Notification bell (header), Settings (notifications) |
| **Previous pages** | Bell dropdown ("View all") |
| **Next pages** | Screen detail (click screen notification), Playlist detail (click content notification) |
| **Navigation path** | Header bell → "View all". No sidebar item. No breadcrumb. |
| **Visibility rules** | Authenticated |
| **Permissions** | All roles |
| **Complexity** | Low (paginated list) |
| **Importance** | Low |
| **Frequency** | Rarely |
| **Business value** | Notification audit; historical reference |

---

## 11. Admin Pages

### P-AD-01: Admin Dashboard

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/admin` |
| **Purpose** | Platform overview for super-admins |
| **Primary user** | Super-Admin |
| **Primary goal** | Check platform health |
| **Primary action** | — (dashboard, no primary action) |
| **Secondary actions** | Navigate to management sections |
| **Required data** | System health, customer count, fleet status |
| **Related pages** | Customers, Fleet, Health |
| **Previous pages** | Admin login |
| **Next pages** | Customers, Fleet, Health, Logs |
| **Navigation path** | Admin sidebar item #1 |
| **Visibility rules** | Super-Admin only |
| **Permissions** | Super-Admin |
| **Complexity** | Medium |
| **Importance** | Medium |
| **Frequency** | Daily (admin) |
| **Business value** | Platform monitoring |

### P-AD-02: Admin Customers

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/admin/customers` |
| **Purpose** | View and manage all customers |
| **Primary user** | Super-Admin |
| **Primary goal** | Find a specific customer |
| **Primary action** | — (list page) |
| **Secondary actions** | Search, Impersonate (from detail) |
| **Required data** | Customer list (SWR, admin-scoped) |
| **Related pages** | Customer detail |
| **Previous pages** | Admin dashboard |
| **Next pages** | Customer detail |
| **Navigation path** | Admin sidebar → Management → Customers |
| **Visibility rules** | Super-Admin only |
| **Permissions** | Super-Admin |
| **Complexity** | Medium |
| **Importance** | High |
| **Frequency** | Daily (admin) |
| **Business value** | Customer management; support |

### P-AD-03: Admin Customer Detail

| Attribute | Value |
|-----------|-------|
| **Route** | `/{locale}/admin/customers/{id}` |
| **Purpose** | View customer details and impersonate |
| **Primary user** | Super-Admin |
| **Primary goal** | Support a specific customer |
| **Primary action** | "Impersonate" |
| **Secondary actions** | View workspaces, View screens, View billing |
| **Required data** | Customer data (SWR by ID) |
| **Related pages** | Client UI (impersonation), Admin customers |
| **Previous pages** | Admin customers |
| **Next pages** | Client UI (impersonation), Admin customers |
| **Navigation path** | Admin sidebar → Customers → click. Breadcrumb: Customers / [Name] |
| **Visibility rules** | Super-Admin only |
| **Permissions** | Super-Admin |
| **Complexity** | Medium |
| **Importance** | High |
| **Frequency** | Occasionally |
| **Business value** | Customer support; impersonation |

---

## 12. Page Count Summary

| Module | Pages | Required | Optional | Future Reserved |
|--------|-------|----------|----------|-----------------|
| Auth | 3 | 3 | 0 | 0 |
| Overview | 1 | 1 | 0 | 0 |
| Screens | 3 | 3 | 0 | 2 (map, live preview) |
| Content | 4 | 4 | 0 | 2 (templates, versions) |
| Scheduling | 1 | 0 | 1 | 1 (schedule detail) |
| Analytics | 1 | 1 | 0 | 2 (PoP, devices) |
| Team | 1 | 1 | 0 | 0 |
| Settings | 6 | 6 | 0 | 2 (SSO, webhooks) |
| Notifications | 1 | 0 | 1 | 0 |
| Admin | 3+ | 3+ | 0 | 1 (audit log) |
| **Total** | **24+** | **22+** | **2** | **10** |

---

## Cross-References

- See `04-final-ia-sitemap.md` for the complete sitemap
- See `05-navigation-architecture.md` for navigation details
- See `07-page-states.md` for empty/loading/error states per page
- See `08-naming-and-conventions.md` for naming rules
- See `product-architecture/09-product-modules.md` for module definitions
- See `product-architecture/10-module-responsibilities.md` for module responsibilities
