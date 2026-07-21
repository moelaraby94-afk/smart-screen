# Frontend UI/UX Forensic Audit — Index (Version 2)

> **Scope:** Complete forensic audit of the Smart Screen dashboard frontend (`apps/dashboard`), based solely on actual source code inspection.  
> **Purpose:** Single source of truth detailed enough for another team to rebuild the entire frontend without opening the project.  
> **Methodology:** Every observation in this audit is grounded in a specific file path and line range. No assumptions, no guesses.  
> **Date:** 2025 (V1), 2025 V2 enrichment  
> **Auditor:** Senior Frontend Consultant (V1), Principal Product Designer + Principal UX Researcher + Principal Frontend Architect (V2)  

---

## V2 Enrichment Methodology

Version 1 documented **WHAT** exists in the codebase — components, routes, APIs, props, classes.

Version 2 enriches every file with:

- **WHY** architectural decisions were made and their UX consequences
- **HOW** users actually experience each screen, flow, and interaction
- **WHERE** the UX breaks down — friction points, dead ends, confusing patterns
- **HCI evaluation** using Nielsen Heuristics, recognition-vs-recall, visibility of system status
- **Information Architecture** analysis — feature grouping, navigation depth, discoverability
- **Enterprise SaaS** evaluation — scalability, bulk operations, power-user efficiency
- **Edge cases** — missing states, race conditions, error recovery gaps
- **Micro-UX** — loading, skeletons, empty states, toast timing, animations, disabled states
- **Cross-references** between related audit files

Each file preserves its V1 structure and expands it with new sections marked **[V2]**.

## Audit File Structure

| File | Title | Coverage |
|------|-------|----------|
| `01-architecture-and-stack.md` | Frontend Architecture & Technology Stack | Next.js config, React version, build tooling, project structure, path aliases, environment variables |
| `02-design-system-and-tokens.md` | Design System, Tokens & Visual Language | ORCA design tokens, CSS variables, color palette, typography, spacing, dark/light themes, density modes, scrollbar styling, aurora backdrop |
| `03-routing-and-navigation.md` | Routing, Navigation & Information Architecture | App router structure, route groups, locale routing, redirects, breadcrumbs, sidebar nav, header meta, back-button logic |
| `04-layout-and-shell.md` | Layout Shell & Layout Components | CrystalShell, ShellSidebar, ShellHeader, Breadcrumbs, ShellLogo, BrandingContext, WorkspaceGate, mobile nav, admin section shell |
| `05-ui-component-library.md` | Reusable UI Component Library | Button, Card, Dialog, Input, Select, Table, Tabs, Badge, Checkbox, Switch, Label, AlertDialog, DropdownMenu, EmptyState, Skeleton, InfoTooltip, app-dropdown-styles |
| `06-auth-and-session.md` | Authentication, Session & Auth Flows | Login form, 2FA flow, registration, forgot password, session management, API auth, CSRF, token refresh, server-side auth guards |
| `07-workspace-management.md` | Workspace Context & Management | WorkspaceProvider, workspace switcher, workspace gate, workspace welcome, onboarding wizard, workspace create dialog, workspace stats, realtime bridge |
| `08-dashboard-and-overview.md` | Dashboard & Overview Pages | HomeOverview, ClientHomeDashboard, AdminOverview, quick actions, totals section, workspace cards, screen health, recent activity, subscription summary, onboarding progress, Islamic widgets |
| `09-screens-feature.md` | Screens Feature | Screens list, screen detail, screen visual card, screen setup modal, screen dialogs, quick edit panel, fleet status, analytics panel, realtime hook, active preview hook |
| `10-playlists-and-studio.md` | Playlists & Studio Feature | Playlist studio client, create wizard, timeline, media library, live preview, zone preview, transitions, quick publish, studio sub-components, studio hooks |
| `11-media-library.md` | Media Library Feature | Media library client, grid sections, preview components, media API |
| `12-schedules-feature.md` | Schedules Feature | Schedules client, calendar, calendar utils, create dialog, timeline view |
| `13-branches-feature.md` | Branches Feature | Branches page client, branch detail, branch tab sections, pairing dialog, playlist dialogs, review section, workspace toolbar, create screen dialog, hooks |
| `14-settings-feature.md` | Settings Feature | Settings tabs, profile settings, billing settings, workspace settings, notification preferences, two-factor settings |
| `15-admin-panel.md` | Admin Panel | Admin layout/guard, admin home, customers, staff, users, workspaces, fleet, screens, logs, settings, system health, feature flags, impersonation, super-admin guard, breadcrumb bar |
| `16-team-feature.md` | Team Feature | Team client, team API, invite accept |
| `17-notifications.md` | Notifications System | Notification provider, notification bell, notifications page, notifications API, Socket.IO events, browser notifications |
| `18-analytics-feature.md` | Analytics Feature | Analytics page client |
| `19-islamic-features.md` | Islamic Features | Prayer times widget, Hijri date widget, prayer config panel, Ramadan settings panel, Islamic API |
| `20-api-docs-and-webhooks.md` | API Docs & Webhooks | API docs client, API keys manager, webhooks manager, API management API |
| `21-search-and-global-actions.md` | Global Search & Quick Actions | Global search modal, keyboard shortcuts, quick actions section |
| `22-i18n-and-localization.md` | Internationalization & Localization | next-intl setup, routing, request config, fallback strategy, locale detection, RTL support, DocumentLocaleRoot, timezone |
| `23-error-handling-and-states.md` | Error Handling, Loading & Empty States | Error boundaries, loading states, skeleton patterns, empty states, API error handling, toast notifications, Sonner config |
| `24-accessibility-audit.md` | Accessibility Audit | ARIA attributes, keyboard navigation, focus management, screen reader support, color contrast considerations |
| `25-responsive-audit.md` | Responsive Design Audit | Breakpoints, mobile behaviors, tablet behaviors, desktop behaviors, RTL responsive |
| `26-consistency-audit.md` | Consistency Audit | Pattern consistency, spacing consistency, naming conventions, icon usage, color usage |
| `27-user-flows.md` | User Flows & Interaction Patterns | Complete user journeys, interaction patterns, state transitions |
| `28-feature-inventory.md` | Feature Inventory | Complete list of all features, their status, and location in code |

---

## Key Facts at a Glance

- **Framework:** Next.js 16 (app router) with React 19
- **Styling:** Tailwind CSS with custom ORCA design system tokens in `globals.css`
- **i18n:** next-intl with `ar` (Arabic, RTL) and `en` (English, LTR) locales, default `en`
- **Theme:** next-themes, light default, no system theme, dark mode via `.dark` class
- **Icons:** lucide-react, consistent stroke width of 1.5 (`ICON_STROKE`)
- **Animations:** framer-motion for page transitions, hero sections, modal animations
- **Toasts:** sonner, position adapts to locale direction
- **Data fetching:** SWR with global config (no revalidate on focus, no retry on error)
- **Realtime:** Socket.IO for screen status, notifications, subscription updates, pairing
- **UI primitives:** Radix UI for dialogs, dropdowns, selects, tabs, checkboxes, switches, alert dialogs
- **Component system:** shadcn/ui pattern with `components.json` config
- **Auth:** httpOnly cookies for JWT, CSRF tokens for mutations, token refresh on 401
- **State management:** React Context (Workspace, Notifications, Branding, HeaderInset)
- **API layer:** `apiFetch` wrapper with auto-refresh, CSRF, bearer token (dev only)

---

## V2 Key Findings Summary

### Critical UX Issues Identified

| # | Issue | Severity | File | Source |
|---|-------|----------|------|--------|
| 1 | Back button on screen detail says "Back to Overview" but links to `/screens` | Medium | `03-routing` | `shell-header-meta.ts:87-95` |
| 2 | Settings/workspace page has no back button (only profile and billing do) | Low | `03-routing` | `shell-header-meta.ts:97-112` |
| 3 | Sidebar is flat list of 18+ items — no grouping for client mode | High | `03-routing`, `04-layout` | `shell-sidebar.tsx:464-687` |
| 4 | Same icon (`Clapperboard`) used for both Playlists and Studio | Medium | `03-routing` | `shell-sidebar.tsx:64-73` |
| 5 | Workspace switcher navigates to `/branches` on switch — not `/overview` | Medium | `07-workspace` | `workspace-switcher.tsx:114-118` |
| 6 | Mobile users cannot switch workspaces from header (switcher hidden < lg) | High | `04-layout`, `25-responsive` | `header.tsx:114-131` |
| 7 | Super-admin sovereign mode blocks ALL client routes — no preview capability | Medium | `07-workspace` | `workspace-gate.tsx:40-50` |
| 8 | No undo capability for destructive actions (delete workspace, delete screen) | High | `23-error-handling` | Throughout |
| 9 | Socket.IO uses websocket-only transport — no polling fallback | Medium | `07-workspace` | `workspace-context.tsx:302` |
| 10 | `hasSuccessfulMeRef` silently swallows non-401 API errors after first success | Medium | `07-workspace` | `workspace-context.tsx:135-137` |
| 11 | Login form clears token before login attempt — if login fails, user is logged out | Low | `06-auth` | `login-form.tsx:77` |
| 12 | No password visibility toggle on login form | Low | `06-auth` | `login-form.tsx:215-223` |
| 13 | Registration verify step has no back button — user is trapped in step 2 | Medium | `06-auth` | `register-client.tsx` |
| 14 | Onboarding wizard close navigates to overview regardless of entry point | Low | `07-workspace` | `onboarding-wizard.tsx:78-82` |
| 15 | Sidebar stroke width is 1.6, not the standard 1.5 (`ICON_STROKE`) | Low | `04-layout` | `shell-sidebar.tsx:53` |

### V2 Corrections to V1

| File | V1 Statement | Correction |
|------|-------------|------------|
| `04-layout` | Sidebar width `w-64` (16rem) | Actual: `w-[240px]` (15rem) |
| `04-layout` | Main content offset `lg:pl-64` | Actual: `lg:ms-[240px] lg:pl-6` |
| `04-layout` | Shell uses `min-h-screen` | Actual: `h-dvh min-h-0` (viewport height, no document scroll) |
| `04-layout` | Header height `h-16` | Actual: `min-h-[52px]` |
| `04-layout` | No skip-to-content link | Actual: Skip link present at `crystal-shell.tsx:102-107` |
| `03-routing` | Sidebar nav has grouped sections (Fleet, Content, Playback, etc.) | Actual: Client mode is flat list, no section labels. Only admin mode has section labels. |
| `03-routing` | Sidebar has `LayoutGrid` icon for templates | Actual: Uses `LayoutTemplate` icon |
| `04-layout` | `STROKE = 1.5` in sidebar | Actual: `STROKE = 1.6` in sidebar |
| `04-layout` | Mobile actions hide GlobalSearch and DensityToggle | Actual: Both are visible on mobile |
| `07-workspace` | Sovereign mode toast says "Admins use the admin panel" | Actual: Uses `workspaceGate.impersonationHint` translation key |
| `04-layout` | AuroraBackdrop renders three orange orbs | Actual: Not rendered in current CrystalShell |
| `04-layout` | `PageTransition` wraps `WorkspaceGate` | Actual: `WorkspaceGate` wraps `PageTransition` (gate is outer) |

### V2 Cross-Reference Map

| Topic | Primary File | Related Files |
|-------|-------------|---------------|
| Navigation friction | `03-routing` | `04-layout`, `27-user-flows` |
| Workspace switching UX | `07-workspace` | `04-layout`, `25-responsive`, `27-user-flows` |
| Auth edge cases | `06-auth` | `23-error-handling`, `27-user-flows` |
| Loading state inconsistency | `23-error-handling` | `08-dashboard`, `09-screens`, `26-consistency` |
| Sovereign mode restrictions | `07-workspace` | `15-admin-panel`, `27-user-flows` |
| RTL accessibility | `24-accessibility` | `22-i18n`, `25-responsive` |
| Enterprise scalability | `28-feature-inventory` | `15-admin-panel`, `26-consistency` |
