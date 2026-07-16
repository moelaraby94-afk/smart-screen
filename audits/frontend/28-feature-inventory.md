# 28 — Feature Inventory

> **Source basis:** Complete codebase analysis of `apps/dashboard/src/`  

---

## 28.1 Complete Feature Inventory

### Core Infrastructure

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Next.js app router | ✅ Implemented | `src/app/` | Locale-segmented routing |
| i18n (ar/en) | ✅ Implemented | `src/i18n/` | next-intl with RTL support |
| Theme (light/dark) | ✅ Implemented | `src/app/layout.tsx` | next-themes, class strategy |
| Density toggle | ✅ Implemented | `src/components/density-toggle.tsx` | Comfortable/compact |
| Error boundaries | ✅ Implemented | `src/app/[locale]/error.tsx`, `(shell)/error.tsx` | Sentry integration |
| Loading states | ✅ Implemented | `src/app/[locale]/(shell)/loading.tsx` | Spinner + skeletons |
| 404 pages | ✅ Implemented | `src/app/not-found.tsx`, `[locale]/not-found.tsx` | Localized |
| Global search | ✅ Implemented | `src/features/search/global-search.tsx` | Ctrl+K, nav + content search |
| Aurora backdrop | ✅ Implemented | `src/components/aurora-backdrop.tsx` | Decorative orange orbs |
| Page transitions | ✅ Implemented | `src/components/page-transition.tsx` | Framer-motion |

### Authentication & Session

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Login form | ✅ Implemented | `src/features/auth/login-form.tsx` | Email/password |
| 2FA login | ✅ Implemented | `src/features/auth/login-form.tsx` | 6-8 digit code |
| Dev login | ✅ Implemented | `src/features/auth/login-form.tsx` | Dev only, seed user |
| Registration (multi-step) | ✅ Implemented | `src/features/auth/register-client.tsx` | Start → verify |
| Forgot password | ✅ Implemented | `src/features/auth/forgot-password-client.tsx` | Email reset |
| Session management | ✅ Implemented | `src/features/auth/session.ts` | JWT + CSRF + refresh |
| Server-side auth guard | ✅ Implemented | `src/lib/server-auth.ts` | Cookie-based |
| Logout | ✅ Implemented | Sidebar + user menu | Clears tokens |
| Session recovery | ✅ Implemented | `src/features/workspace/workspace-context.tsx` | Auto-refresh on 401 |

### Workspace Management

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Workspace context | ✅ Implemented | `src/features/workspace/workspace-context.tsx` | Global state |
| Workspace switcher | ✅ Implemented | `src/features/workspace/workspace-switcher.tsx` | Dropdown |
| Workspace gate | ✅ Implemented | `src/features/workspace/workspace-gate.tsx` | Auth + workspace check |
| Workspace welcome | ✅ Implemented | `src/features/workspace/workspace-welcome.tsx` | No-workspace state |
| Create workspace | ✅ Implemented | `src/features/workspace/workspace-create-dialog.tsx` | Dialog |
| Demo bootstrap | ✅ Implemented | `src/features/workspace/workspace-welcome.tsx` | One-click demo |
| Onboarding wizard | ✅ Implemented | `src/features/workspace/onboarding-wizard.tsx` | 2-step: content + next steps |
| Workspace stats | ✅ Implemented | `src/features/workspace/use-workspace-stats.ts` | Sidebar counts |
| Realtime bridge | ✅ Implemented | `src/features/workspace/workspace-context.tsx` | Socket.IO subscription |
| Workspace rename | ✅ Implemented | `src/features/dashboard/client-home-dashboard.tsx` | From dashboard |
| Workspace pause/resume | ✅ Implemented | `src/features/dashboard/client-home-dashboard.tsx` | From dashboard |
| Workspace delete | ✅ Implemented | `src/features/dashboard/client-home-dashboard.tsx` | Confirmation dialog |
| Seed demo content | ✅ Implemented | `src/features/workspace/workspace-api.ts` | Per workspace |

### Dashboard & Overview

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Home overview (client) | ✅ Implemented | `src/features/dashboard/home-overview.tsx` | Hero + dashboard |
| Home overview (admin) | ✅ Implemented | `src/features/dashboard/admin-overview.tsx` | System stats |
| Quick actions | ✅ Implemented | `src/features/dashboard/quick-actions-section.tsx` | 6 action buttons |
| Totals section | ✅ Implemented | `src/features/dashboard/home-dashboard-sections.tsx` | Stat cards |
| Workspace cards | ✅ Implemented | `src/features/dashboard/home-dashboard-sections.tsx` | Branch management |
| Screen health | ✅ Implemented | `src/features/dashboard/screen-health-section.tsx` | Status summary |
| Recent activity | ✅ Implemented | `src/features/dashboard/recent-activity-feed.tsx` | Activity list |
| Subscription summary | ✅ Implemented | `src/features/dashboard/subscription-summary-section.tsx` | Plan + usage |
| Onboarding progress | ✅ Implemented | `src/features/onboarding/onboarding-progress-widget.tsx` | Checklist |

### Screens

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Screen list (grid) | ✅ Implemented | `src/features/screens/screens-client.tsx` | Grid/table toggle |
| Screen visual card | ✅ Implemented | `src/features/screens/screen-visual-card.tsx` | With preview |
| Screen detail | ✅ Implemented | `src/features/screens/screen-detail-client.tsx` | Full detail view |
| Screen setup modal | ✅ Implemented | `src/features/screens/screen-setup-modal.tsx` | Multi-step pairing |
| Screen quick edit | ✅ Implemented | `src/features/screens/screen-quick-edit-panel.tsx` | Inline edit |
| Screen analytics | ✅ Implemented | `src/features/screens/screen-analytics-panel.tsx` | Uptime, playback |
| Screen dialogs | ✅ Implemented | `src/features/screens/screen-dialogs.tsx` | Delete, restart, unpair |
| Screen fleet status | ✅ Implemented | `src/features/screens/screen-fleet-status.tsx` | Summary bar |
| Screen realtime | ✅ Implemented | `src/features/screens/useScreenRealtime.ts` | Live status |
| Active preview | ✅ Implemented | `src/features/screens/use-screen-active-preview.ts` | Current display |
| Bulk actions | ✅ Implemented | `src/features/screens/screens-client.tsx` | Multi-select |

### Playlists & Studio

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Playlist studio | ✅ Implemented | `src/features/playlists/playlist-studio-client.tsx` | Grid + editor |
| Playlist create wizard | ✅ Implemented | `src/features/playlists/playlist-create-wizard.tsx` | Multi-step |
| Playlist timeline | ✅ Implemented | `src/features/playlists/playlist-timeline.tsx` | Visual timeline |
| Playlist media library | ✅ Implemented | `src/features/playlists/studio/components/media-library.tsx` | Drag to timeline |
| Playlist live preview | ✅ Implemented | `src/features/playlists/playlist-live-preview.tsx` | Real-time preview |
| Playlist preview overlay | ✅ Implemented | `src/features/playlists/playlist-preview-overlay.tsx` | Full-screen |
| Playlist zone preview | ✅ Implemented | `src/features/playlists/playlist-zone-preview.tsx` | Multi-zone |
| Playlist transitions | ✅ Implemented | `src/features/playlists/playlist-transitions.ts` | 5 transitions |
| Quick publish | ✅ Implemented | `src/features/playlists/quick-publish-dialog.tsx` | To screens |
| Playlist groups | ✅ Implemented | `src/features/playlists/studio/components/group-sidebar.tsx` | Folders |
| Playlist inspector | ✅ Implemented | `src/features/playlists/studio/components/inspector-panel.tsx` | Item properties |
| Canvas studio (Konva) | ✅ Implemented | `src/features/studio/studio-editor-client.tsx` | Visual editor |
| Canvas shapes | ✅ Implemented | `src/features/studio/studio-canvas-shapes.tsx` | Rect, circle, text, image |
| Canvas templates | ✅ Implemented | `src/features/studio/canvas-templates.ts` | Pre-built layouts |
| Studio panels | ✅ Implemented | `src/features/studio/studio-panels.tsx` | Shape/layers/properties |

### Media Library

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Media grid | ✅ Implemented | `src/features/media/media-library-client.tsx` | Responsive grid |
| Media upload | ✅ Implemented | `src/features/media/media-library-client.tsx` | Drag-and-drop, multi-file |
| Media preview | ✅ Implemented | `src/features/media/media-preview-components.tsx` | Image/video/audio |
| Media filter/search | ✅ Implemented | `src/features/media/media-library-client.tsx` | By type, name |
| Media rename/delete | ✅ Implemented | `src/features/media/media-library-client.tsx` | Per-item actions |
| Storage indicator | ✅ Implemented | `src/components/usage-indicator.tsx` | Used/limit bar |

### Schedules

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Schedule calendar | ✅ Implemented | `src/features/schedules/schedule-calendar.tsx` | Month/week/day |
| Schedule timeline | ✅ Implemented | `src/features/schedules/schedules-timeline-view.tsx` | Horizontal |
| Schedule create | ✅ Implemented | `src/features/schedules/schedule-create-dialog.tsx` | Dialog with recurrence |
| Schedule CRUD | ✅ Implemented | `src/features/schedules/schedules-client.tsx` | Full management |
| Calendar utils | ✅ Implemented | `src/features/schedules/schedule-calendar-utils.ts` | Date helpers |
| Overlap detection | ✅ Implemented | `src/features/schedules/schedule-calendar-utils.ts` | `isOverlapping()` |

### Branches

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Branch list | ✅ Implemented | `src/features/branches/branches-page-client.tsx` | Grid of branches |
| Branch detail | ✅ Implemented | `src/features/branches/branch-detail-client.tsx` | Tabbed view |
| Branch tab sections | ✅ Implemented | `src/features/branches/branch-tab-sections.tsx` | Overview/screens/playlists/media/settings |
| Branch pairing | ✅ Implemented | `src/features/branches/branch-pairing-dialog.tsx` | QR/code pairing |
| Branch playlist dialogs | ✅ Implemented | `src/features/branches/branch-playlist-dialogs.tsx` | Assign/unassign |
| Create screen (branch) | ✅ Implemented | `src/features/branches/create-screen-dialog.tsx` | Per-branch |
| Branch review | ✅ Implemented | `src/features/branches/branch-review-section.tsx` | Content audit |
| Branch toolbar | ✅ Implemented | `src/features/branches/branch-workspace-toolbar.tsx` | Top toolbar |
| Playlist-screen mapping | ✅ Implemented | `src/features/branches/playlist-screens-client.tsx` | Assignment table |

### Settings

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Settings tabs | ✅ Implemented | `src/features/settings/settings-tabs.tsx` | Profile/Workspace/Billing |
| Profile settings | ✅ Implemented | `src/features/settings/settings-profile-client.tsx` | Name, email, phone, avatar |
| Password change | ✅ Implemented | `src/features/settings/settings-profile-client.tsx` | Current + new |
| 2FA settings | ✅ Implemented | `src/features/settings/two-factor-settings.tsx` | Enable/disable/backup |
| Workspace settings | ✅ Implemented | `src/features/settings/workspace-settings-client.tsx` | Name, timezone, locale, pause |
| Billing settings | ✅ Implemented | `src/features/settings/settings-billing-client.tsx` | Plan, payment, invoices |
| Notification preferences | ✅ Implemented | `src/features/settings/notification-preferences.tsx` | Per-channel toggles |

### Admin Panel

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Admin guard (server) | ✅ Implemented | `src/app/[locale]/(shell)/admin/layout.tsx` | Cookie-based |
| Admin guard (client) | ✅ Implemented | `src/features/admin/super-admin-guard.tsx` | Context-based |
| Admin home | ✅ Implemented | `src/features/admin/admin-home-overview-client.tsx` | System stats |
| Admin customers | ✅ Implemented | `src/features/admin/admin-customers-client.tsx` | List + search |
| Customer profile | ✅ Implemented | `src/features/admin/admin-customer-profile-client.tsx` | Tabbed detail |
| Customer profile tabs | ✅ Implemented | `src/features/admin/admin-customer-profile-tabs.tsx` | Details/WS/Billing/Logs |
| Customer workspace | ✅ Implemented | `src/features/admin/admin-customer-workspace-client.tsx` | WS management |
| Admin staff | ✅ Implemented | `src/features/admin/admin-staff-client.tsx` | Staff CRUD |
| Admin users | ✅ Implemented | `src/features/admin/admin-users-client.tsx` | User management |
| Admin workspaces | ✅ Implemented | `src/features/admin/admin-workspaces-client.tsx` | All workspaces |
| Admin fleet | ✅ Implemented | `src/features/admin/admin-fleet-client.tsx` | Global screen fleet |
| Admin screens | ✅ Implemented | `src/features/admin/admin-screens-client.tsx` | All screens |
| Admin system health | ✅ Implemented | `src/features/admin/admin-system-health-client.tsx` | Health metrics |
| Admin logs | ✅ Implemented | `src/features/admin/admin-logs-client.tsx` | Log viewer |
| Admin settings | ✅ Implemented | `src/features/admin/admin-settings-client.tsx` | Global settings |
| Feature flags | ✅ Implemented | `src/features/admin/feature-flags-client.tsx` | Flag management |
| Impersonation | ✅ Implemented | `src/features/admin/impersonation-return-button.tsx` | Super-admin → customer |
| Admin breadcrumb bar | ✅ Implemented | `src/components/admin/admin-breadcrumb-bar.tsx` | Reusable |

### Team

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Team member list | ✅ Implemented | `src/features/team/team-client.tsx` | Table with roles |
| Invite member | ✅ Implemented | `src/features/team/team-client.tsx` | Email + role dialog |
| Change role | ✅ Implemented | `src/features/team/team-client.tsx` | Dropdown |
| Remove member | ✅ Implemented | `src/features/team/team-client.tsx` | Confirmation |
| Cancel/resend invite | ✅ Implemented | `src/features/team/team-client.tsx` | Pending invitations |
| Invite acceptance | ✅ Implemented | `src/features/team/invite-accept-client.tsx` | Token-based |

### Notifications

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Notification provider | ✅ Implemented | `src/features/notifications/notification-provider.tsx` | Context + Socket.IO |
| Notification bell | ✅ Implemented | `src/features/notifications/notification-provider.tsx` | Dropdown with badge |
| Notifications page | ✅ Implemented | `src/features/notifications/notifications-page-client.tsx` | Full history |
| Browser notifications | ✅ Implemented | `src/features/notifications/notification-provider.tsx` | Native Notification API |
| Mark all read | ✅ Implemented | `src/features/notifications/notification-provider.tsx` | API + state |
| Notification persistence | ✅ Implemented | `src/features/notifications/notifications-api.ts` | Server-side storage |

### Analytics

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Analytics dashboard | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | Metrics + charts |
| Time range selector | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | Today/7d/30d/90d |
| Screen performance | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | Per-screen metrics |
| Playback analytics | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | Playlist performance |
| Device metrics | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | Health, errors |
| Export | ✅ Implemented | `src/features/analytics/analytics-page-client.tsx` | CSV/PDF |

### Islamic Features

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Prayer times widget | ✅ Implemented | `src/features/islamic/prayer-times-widget.tsx` | 5 daily prayers |
| Hijri date widget | ✅ Implemented | `src/features/islamic/hijri-date-widget.tsx` | Islamic calendar |
| Prayer config | ✅ Implemented | `src/features/islamic/prayer-config-panel.tsx` | Method, location, adjustments |
| Ramadan settings | ✅ Implemented | `src/features/islamic/ramadan-settings-panel.tsx` | Ramadan mode, suhoor, iftar |

### API & Developer Tools

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| API docs | ✅ Implemented | `src/features/api-docs/api-docs-client.tsx` | Endpoint reference |
| API keys | ✅ Implemented | `src/features/api-docs/api-keys-manager.tsx` | Create/revoke |
| Webhooks | ✅ Implemented | `src/features/api-docs/webhooks-manager.tsx` | Event subscriptions |

### Other Features

| Feature | Status | Location | Notes |
|---------|--------|----------|-------|
| Templates gallery | ✅ Implemented | `src/features/dashboard/templates-client.tsx` | Pre-built templates |
| AI tools | ✅ Implemented | `src/features/dashboard/ai-tools-client.tsx` | Content generation |
| Emergency broadcast | ✅ Implemented | `src/features/dashboard/emergency-client.tsx` | Overlay management |
| Audit log | ✅ Implemented | `src/features/audit-log/audit-log-page-client.tsx` | Action history |
| Help & support | ✅ Implemented | `src/features/help/help-support-client.tsx` | Help center |
| Language switcher | ✅ Implemented | `src/components/language-switcher.tsx` | AR/EN toggle |
| Theme toggle | ✅ Implemented | `src/components/theme-toggle.tsx` | Light/dark |
| User menu | ✅ Implemented | `src/components/user-menu.tsx` | Avatar dropdown |

---

## 28.2 Redirect Routes (Deprecated/Merged)

| Old Route | New Route | Reason |
|-----------|-----------|--------|
| `/{locale}/billing` | `/{locale}/settings/billing` | Consolidated into settings |
| `/{locale}/content` | `/{locale}/media` | Content merged into media |
| `/{locale}/displays` | `/{locale}/screens` | Displays renamed to screens |
| `/{locale}/campaigns` | `/{locale}/schedules` | Campaigns renamed to schedules |
| `/{locale}/proof-of-play` | `/{locale}/analytics` | PoP merged into analytics |
| `/{locale}/admin/billing` | `/{locale}/settings/billing` | Admin billing redirected |

---

## 28.3 File Size Distribution

### Largest Files (by line count, approximate)

| File | Lines | Category |
|------|-------|----------|
| `screen-setup-modal.tsx` | ~1600+ | Screens |
| `playlist-studio-client.tsx` | ~1000+ | Playlists |
| `media-library-client.tsx` | ~950+ | Media |
| `team-client.tsx` | ~950+ | Team |
| `settings-billing-client.tsx` | ~1000+ | Settings |
| `branch-tab-sections.tsx` | ~950+ | Branches |
| `screens-client.tsx` | ~850+ | Screens |
| `notification-provider.tsx` | ~341 | Notifications |
| `workspace-context.tsx` | ~339 | Workspace |
| `global-search.tsx` | ~359 | Search |
| `client-home-dashboard.tsx` | ~281 | Dashboard |
| `login-form.tsx` | ~272 | Auth |
| `onboarding-wizard.tsx` | ~253 | Workspace |
| `home-overview.tsx` | ~81 | Dashboard |

### Smallest Files

| File | Lines | Category |
|------|-------|----------|
| `icon-stroke.ts` | 3 | Lib |
| `utils.ts` | 7 | Lib |
| `(auth)/layout.tsx` | 7 | Layout |
| `(shell)/layout.tsx` | 20 | Layout |
| `loading.tsx` | 10 | Layout |

---

## 28.4 Test Coverage

| Test File | Tested Component |
|-----------|-----------------|
| `src/features/islamic/hijri-date-widget.test.tsx` | HijriDateWidget |
| `src/features/screens/useApiScreens.test.tsx` | useApiScreens hook |

### Test Coverage Assessment
- **Very low test coverage** — only 2 test files found
- E2E tests exist in `e2e/` directory (Playwright)
- No unit tests for: auth, workspace, notifications, dashboard, admin, team, settings, media, playlists, schedules, branches
- **Recommendation:** Add unit tests for critical paths (auth flows, workspace context, API error handling)

---

## 28.6 [V2] UX Analysis — Feature Inventory & Gap Assessment

### Feature Maturity Matrix

**[V2] Maturity Levels:**
| Feature | Implementation | UX Polish | Enterprise Ready | Notes |
|---------|---------------|-----------|-----------------|-------|
| Auth & Session | ✅ Complete | ⚠️ Medium | ⚠️ No SSO | 2FA, token refresh, impersonation |
| Workspace Mgmt | ✅ Complete | ⚠️ Medium | ⚠️ No scale | No search, no metadata in switcher |
| Screens | ✅ Complete | ⚠️ Medium | ❌ No bulk | No filter, no bulk actions, no remote control |
| Playlists & Studio | ✅ Complete | ⚠️ Medium | ⚠️ No versioning | Canvas editor, live preview, publish |
| Media Library | ✅ Complete | ⚠️ Low | ❌ No bulk upload | No drag-drop, no progress, no multi-file |
| Schedules | ✅ Complete | ⚠️ Medium | ❌ No timezone | Calendar + timeline, no conflict detection |
| Branches | ✅ Complete | ✅ Good | ⚠️ No grouping | Stats, pairing, tab navigation |
| Settings | ✅ Complete | ⚠️ Medium | ⚠️ No plan selector | Profile, billing, workspace, 2FA |
| Admin Panel | ✅ Complete | ⚠️ Medium | ⚠️ No roles | Customers, staff, fleet, feature flags |
| Team | ⚠️ Partial | ⚠️ Low | ❌ No role change | Invite flow, no member management |
| Notifications | ✅ Complete | ⚠️ Medium | ⚠️ No persistence | Bell, toasts, Socket.IO, no sound |
| Analytics | ⚠️ Partial | ⚠️ Medium | ❌ No export | Charts, period comparison, no custom range |
| Islamic Features | ✅ Complete | ✅ Good | ✅ Market-specific | Prayer times, Hijri, Ramadan mode |
| API & Webhooks | ✅ Complete | ✅ Good | ⚠️ No analytics | API keys, webhooks, delivery history |
| i18n & RTL | ✅ Complete | ⚠️ Medium | ✅ EN+AR | Switch RTL bug, missing pluralization |
| Global Search | ✅ Complete | ⚠️ Medium | ⚠️ No cross-ws | Command palette, keyboard nav |
| Emergency | ✅ Complete | ⚠️ Medium | ⚠️ No duration | Override broadcast, confirmation |

### [V2] Enterprise SaaS Gap Analysis

**[V2] Critical Enterprise Gaps:**
1. **No SSO/SAML** — Enterprise customers require SSO integration (Okta, Azure AD, Google Workspace)
2. **No audit log for admin actions** — Compliance requirement for enterprise customers
3. **No custom roles** — Only predefined roles (admin, editor, viewer); enterprise needs granular permissions
4. **No bulk operations** — Screens, media, and team management all lack bulk actions
5. **No timezone-aware scheduling** — Critical for multi-location deployments
6. **No workspace scalability** — Switcher unusable beyond ~20 workspaces
7. **No API rate limiting UI** — Developers can't monitor their API usage
8. **No data export** — No CSV/PDF export for analytics, team lists, audit logs
9. **No custom dashboard** — Users can't customize their dashboard layout
10. **No mobile workspace switching** — Critical mobile UX gap

**[V2] Competitive Feature Gaps (vs. market leaders):**
- No screen grouping/hierarchical folders
- No live screenshot preview from screens
- No remote screen control (reboot, volume, brightness)
- No OTA update management
- No multi-zone screen layouts
- No proof-of-play reports
- No audience analytics (camera-based)
- No content approval workflow
- No playlist versioning/history
- No A/B testing
- No content templates marketplace
- No social media integration (Twitter/X, Instagram feeds)
- No weather widget
- No news/RSS feed widget

### [V2] Technical Debt Assessment

**[V2] Frontend Technical Debt:**
1. **Test coverage** — Only 2 test files; critical paths untested
2. **InfoTooltip** — Custom implementation instead of Radix Tooltip (accessibility gap)
3. **Switch RTL bug** — `translate-x-4` doesn't flip in RTL
4. **Loading state inconsistency** — Three different patterns (skeleton, spinner, text)
5. **Icon stroke width** — Three different values (1.5, 1.6, 2.0)
6. **Icon duplication** — `Clapperboard` used for both Playlists and Studio
7. **Socket.IO transport** — WebSocket only, no polling fallback
8. **`hasSuccessfulMeRef`** — Silent error swallowing after first success
9. **Click guards** — Logically broken, toasts never fire
10. **Back button labels** — Inconsistent ("Back to Overview" linking to `/screens`)

### [V2] Priority Recommendations

**[V2] High Priority (UX blockers):**
1. Fix Switch RTL bug
2. Add workspace switcher to mobile
3. Fix click guards in sidebar
4. Standardize loading states
5. Fix back button label inconsistencies

**[V2] Medium Priority (Enterprise readiness):**
1. Add bulk operations for screens and media
2. Add search/filter to screens, media, and branches lists
3. Add timezone-aware scheduling
4. Add audit log for admin actions
5. Add workspace switcher search

**[V2] Low Priority (Polish):**
1. Unify icon stroke width
2. Resolve duplicate icons
3. Add notification persistence
4. Add notification sound
5. Add loading state to seed demo

### Cross-References
- See `00-index.md` for V2 enrichment methodology and key findings
- See `03-routing-and-navigation.md` for navigation and IA issues
- See `04-layout-and-shell.md` for shell architecture issues
- See `05-ui-component-library.md` for component-level issues
- See `07-workspace-management.md` for enterprise scalability concerns
- See `24-accessibility-audit.md` for accessibility gaps
- See `25-responsive-audit.md` for mobile UX gaps
- See `26-consistency-audit.md` for consistency issues
- See `27-user-flows.md` for user journey analysis
