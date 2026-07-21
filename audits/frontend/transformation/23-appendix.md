# Appendix

> **Purpose:** Cross-references, evidence index, glossary, and document map

---

## 1. Audit File Evidence Index

All evidence references in this blueprint point to files in `audits/frontend/`. The following index maps each audit file to its scope and the transformation documents that reference it.

### 1.1 V1/V2 Audit Files

| Audit File | Scope | Referenced By |
|------------|-------|---------------|
| `00-index.md` | V2 enrichment methodology and key findings | `00-executive-summary.md` |
| `01-architecture-and-stack.md` | Technology stack, provider stack, build scripts, dependencies | `01-current-product-model.md`, `14-design-system-direction.md`, `15-component-strategy.md`, `16-state-strategy.md` |
| `02-design-system-and-tokens.md` | Design tokens, color system, button/badge/form/dialog systems, RTL, animations | `14-design-system-direction.md`, `15-component-strategy.md` |
| `03-routing-and-navigation.md` | Route hierarchy, sidebar structure, back button logic, click guards | `04-information-architecture-review.md`, `05-navigation-analysis.md`, `11-cognitive-load-analysis.md` |
| `04-layout-and-shell.md` | CrystalShell, ShellSidebar, ShellHeader, Breadcrumbs, WorkspaceGate, AuroraBackdrop | `05-navigation-analysis.md`, `14-design-system-direction.md` |
| `05-ui-component-library.md` | Component inventory, InfoTooltip, EmptyState, Switch, Skeleton | `14-design-system-direction.md`, `15-component-strategy.md` |
| `06-auth-and-session.md` | Login, registration, 2FA, token refresh, session recovery | `06-user-journey-analysis.md`, `08-feature-priorities.md` |
| `07-workspace-management.md` | WorkspaceProvider, WorkspaceSwitcher, onboarding wizard, Socket.IO | `05-navigation-analysis.md`, `16-state-strategy.md`, `18-dependency-map.md` |
| `08-dashboard-and-overview.md` | Dashboard widgets, quick actions, screen health, emergency overlay | `06-user-journey-analysis.md`, `07-screen-priorities.md`, `09-workflow-analysis.md` |
| `09-screens-feature.md` | Screen list, screen detail, pairing, card grid | `06-user-journey-analysis.md`, `07-screen-priorities.md`, `09-workflow-analysis.md` |
| `10-playlists-and-studio.md` | Playlist library, Studio canvas, timeline, panels, publish | `06-user-journey-analysis.md`, `07-screen-priorities.md`, `09-workflow-analysis.md` |
| `11-media-library.md` | Media grid, upload, storage usage | `07-screen-priorities.md`, `08-feature-priorities.md`, `09-workflow-analysis.md` |
| `12-schedules-feature.md` | Schedule calendar, create dialog, recurrence, Socket.IO | `06-user-journey-analysis.md`, `07-screen-priorities.md`, `08-feature-priorities.md` |
| `13-branches-feature.md` | Branch list, branch detail, tabs, stats | `04-information-architecture-review.md`, `07-screen-priorities.md` |
| `14-settings-feature.md` | Settings tabs, profile, billing, workspace, 2FA | `06-user-journey-analysis.md`, `07-screen-priorities.md`, `08-feature-priorities.md` |
| `15-admin-panel.md` | Admin dashboard, customers, staff, fleet, feature flags, impersonation | `07-screen-priorities.md`, `13-enterprise-saas-review.md` |
| `16-team-feature.md` | Team list, invite flow, roles, permissions | `06-user-journey-analysis.md`, `08-feature-priorities.md`, `13-enterprise-saas-review.md` |
| `17-notifications.md` | Notification bell, toast, Socket.IO events, persistence | `08-feature-priorities.md`, `16-state-strategy.md` |
| `18-analytics-feature.md` | Analytics charts, period comparison, empty states | `07-screen-priorities.md`, `08-feature-priorities.md` |
| `19-islamic-features.md` | Prayer times, Hijri date, Ramadan mode | `01-current-product-model.md` |
| `20-api-docs-and-webhooks.md` | API docs, API keys, webhooks, delivery history | `07-screen-priorities.md`, `13-enterprise-saas-review.md` |
| `21-search-and-global-actions.md` | Global search, command palette, quick actions | `05-navigation-analysis.md`, `08-feature-priorities.md` |
| `22-i18n-and-localization.md` | Language switcher, NEXT_LOCALE cookie, RTL, translation coverage | `14-design-system-direction.md`, `08-feature-priorities.md` |
| `23-error-handling-and-states.md` | Error hierarchy, toast, error boundaries, loading states, empty states | `11-cognitive-load-analysis.md`, `12-usability-breakdown.md`, `14-design-system-direction.md` |
| `24-accessibility-audit.md` | WCAG compliance, keyboard nav, ARIA, contrast, RTL accessibility | `12-usability-breakdown.md`, `14-design-system-direction.md`, `21-success-metrics.md` |
| `25-responsive-audit.md` | Breakpoints, mobile UX, desktop UX, responsive consistency | `05-navigation-analysis.md`, `14-design-system-direction.md` |
| `26-consistency-audit.md` | Icon consistency, stroke width, spacing, button variants, loading patterns | `14-design-system-direction.md`, `15-component-strategy.md` |
| `27-user-flows.md` | Onboarding, workspace switching, screen pairing, content publishing, impersonation | `06-user-journey-analysis.md`, `09-workflow-analysis.md`, `10-mental-model-analysis.md` |
| `28-feature-inventory.md` | Feature maturity matrix, enterprise gaps, technical debt, test coverage | `00-executive-summary.md`, `01-current-product-model.md`, `02-problem-map.md`, `13-enterprise-saas-review.md` |

---

## 2. Problem ID Cross-Reference

### 2.1 Problem → Transformation Document Map

| Problem ID | Title | Defined In | Referenced By |
|------------|-------|------------|---------------|
| P-001 | Switch RTL Bug | `02-problem-map.md` | `03-root-cause-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md`, `21-success-metrics.md` |
| P-002 | No Mobile Workspace Switcher | `02-problem-map.md` | `03-root-cause-analysis.md`, `05-navigation-analysis.md`, `06-user-journey-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md`, `21-success-metrics.md` |
| P-003 | Sidebar Click Guards Broken | `02-problem-map.md` | `03-root-cause-analysis.md`, `05-navigation-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| P-004 | Back Button Label Inconsistency | `02-problem-map.md` | `03-root-cause-analysis.md`, `05-navigation-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md`, `21-success-metrics.md` |
| P-005 | InfoTooltip Accessibility Gap | `02-problem-map.md` | `03-root-cause-analysis.md`, `14-design-system-direction.md`, `15-component-strategy.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| E-001 | No SSO/SAML | `02-problem-map.md` | `03-root-cause-analysis.md`, `13-enterprise-saas-review.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md`, `21-success-metrics.md` |
| E-002 | No Audit Log | `02-problem-map.md` | `03-root-cause-analysis.md`, `13-enterprise-saas-review.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| E-003 | No Custom Roles | `02-problem-map.md` | `03-root-cause-analysis.md`, `13-enterprise-saas-review.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| E-004 | No Bulk Operations | `02-problem-map.md` | `03-root-cause-analysis.md`, `07-screen-priorities.md`, `08-feature-priorities.md`, `13-enterprise-saas-review.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| E-005 | No Timezone Scheduling | `02-problem-map.md` | `03-root-cause-analysis.md`, `07-screen-priorities.md`, `08-feature-priorities.md`, `13-enterprise-saas-review.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| E-006 | Workspace Switcher Doesn't Scale | `02-problem-map.md` | `05-navigation-analysis.md`, `08-feature-priorities.md`, `13-enterprise-saas-review.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| IA-001 | Flat Sidebar Navigation | `02-problem-map.md` | `03-root-cause-analysis.md`, `04-information-architecture-review.md`, `05-navigation-analysis.md`, `11-cognitive-load-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| IA-002 | Inconsistent Nav Structure | `02-problem-map.md` | `04-information-architecture-review.md`, `05-navigation-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| IA-003 | Switch Navigates to /branches | `02-problem-map.md` | `03-root-cause-analysis.md`, `04-information-architecture-review.md`, `05-navigation-analysis.md`, `10-mental-model-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| IA-004 | Quick Actions Navigate | `02-problem-map.md` | `04-information-architecture-review.md`, `08-feature-priorities.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| IA-005 | Settings No Back Button | `02-problem-map.md` | `04-information-architecture-review.md`, `05-navigation-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-001 | Inconsistent Loading States | `02-problem-map.md` | `03-root-cause-analysis.md`, `11-cognitive-load-analysis.md`, `12-usability-breakdown.md`, `14-design-system-direction.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-002 | Inconsistent Icon Stroke | `02-problem-map.md` | `14-design-system-direction.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-003 | Icon Duplication | `02-problem-map.md` | `14-design-system-direction.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-004 | AuroraBackdrop Dead Code | `02-problem-map.md` | `14-design-system-direction.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-005 | hasSuccessfulMeRef | `02-problem-map.md` | `03-root-cause-analysis.md`, `16-state-strategy.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-006 | Socket.IO WebSocket Only | `02-problem-map.md` | `03-root-cause-analysis.md`, `16-state-strategy.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md` |
| TD-007 | Insufficient Test Coverage | `02-problem-map.md` | `03-root-cause-analysis.md`, `17-risk-analysis.md`, `18-dependency-map.md`, `20-implementation-phases.md`, `21-success-metrics.md` |
| A-001 | InfoTooltip Missing ARIA | `02-problem-map.md` | (Same as P-005) |
| A-002 | Button Touch Targets | `02-problem-map.md` | `14-design-system-direction.md`, `21-success-metrics.md` |
| A-003 | Switch RTL (Same as P-001) | `02-problem-map.md` | (Same as P-001) |
| A-004 | Color Contrast | `02-problem-map.md` | `14-design-system-direction.md`, `21-success-metrics.md` |
| C-001 | Icon Stroke (Same as TD-002) | `02-problem-map.md` | (Same as TD-002) |
| C-002 | Back Button (Same as P-004) | `02-problem-map.md` | (Same as P-004) |
| C-003 | Loading Patterns (Same as TD-001) | `02-problem-map.md` | (Same as TD-001) |
| C-004 | Inconsistent Responsive Patterns | `02-problem-map.md` | `14-design-system-direction.md`, `20-implementation-phases.md` |
| I-001 | No Pluralization | `02-problem-map.md` | `20-implementation-phases.md` |
| I-002 | No Eastern Arabic Numerals | `02-problem-map.md` | `20-implementation-phases.md` |

---

## 3. Feature ID Cross-Reference

| Feature ID | Title | Phase | Problem IDs |
|------------|-------|-------|-------------|
| F-MH-01 | Fix Switch RTL | Phase 1 | P-001 |
| F-MH-02 | Mobile Workspace Switcher | Phase 2 | P-002 |
| F-MH-03 | Fix Click Guards | Phase 1 | P-003 |
| F-MH-04 | Fix Back Button Labels | Phase 1 | P-004 |
| F-MH-05 | Fix InfoTooltip | Phase 1 | P-005 |
| F-MH-06 | Standardize Loading | Phase 1 | TD-001 |
| F-MH-07 | Socket.IO Fallback | Phase 1 | TD-006 |
| F-MH-08 | Fix hasSuccessfulMeRef | Phase 1 | TD-005 |
| F-HP-01 | Sidebar Grouping | Phase 3 | IA-001, IA-002 |
| F-HP-02 | Switch to /overview | Phase 2 | IA-003 |
| F-HP-03 | Screen Search/Filter | Phase 6 | E-004 |
| F-HP-04 | Bulk Screen Ops | Phase 6 | E-004 |
| F-HP-05 | Multi-File Upload | Phase 5 | E-004 |
| F-HP-06 | Timezone Scheduling | Phase 8 | E-005 |
| F-HP-07 | Conflict Detection | Phase 8 | — |
| F-HP-08 | Custom Roles | Phase 9 | E-003 |
| F-HP-09 | Team Management | Phase 9 | — |
| F-HP-10 | Audit Log | Phase 9 | E-002 |
| F-HP-11 | SSO/SAML | Phase 9 | E-001 |
| F-HP-12 | Test Coverage | Phase 10 | TD-007 |
| F-HP-13 | Switcher Search | Phase 2 | E-006 |
| F-HP-14 | Quick Actions Act | Phase 4 | IA-004 |
| F-HP-15 | Contrast Fixes | Phase 1 | A-004 |
| F-HP-16 | Touch Target Fixes | Phase 1 | A-002 |
| F-MP-01 through F-MP-18 | Medium Priority Features | Various | Various |
| F-LP-01 through F-LP-08 | Low Priority Features | Phase 1/10 | Various |
| F-FU-01 through F-FU-15 | Future Features | Future | Various |

---

## 4. Glossary

| Term | Definition |
|------|-----------|
| **App Shell** | The persistent layout wrapper (sidebar + header + main content area) that remains constant while page content changes |
| **Branch** | A physical location grouping within a workspace (e.g., a store, office, or building) |
| **CVA** | Class Variance Authority — a library for managing component variants via TypeScript |
| **Cognitive Load** | The amount of mental effort required to use a system |
| **Enterprise SaaS** | Software-as-a-Service designed for large organizations with compliance, security, and scale requirements |
| **Hick's Law** | Reaction time increases logarithmically with the number of choices |
| **IA** | Information Architecture — the organization and structure of information in a system |
| **Impersonation** | Admin feature allowing super-admins to view the product as a specific customer |
| **Konva** | 2D canvas library used for the Playlist Studio editor |
| **Miller's Law** | Working memory can hold 7±2 items at a time |
| **Mental Model** | A user's internal representation of how a system works |
| **MoSCoW** | Prioritization framework: Must Have, Should Have, Could Have, Won't Have |
| **Next.js App Router** | Next.js 13+ routing system using file-based routing in the `app/` directory |
| **ORCA** | The design system name used in Smart Screen |
| **Playlist** | A sequence of media items displayed on screens in order |
| **Playlist Studio** | The canvas-based editor for creating and editing playlists |
| **RBAC** | Role-Based Access Control — permission system based on roles |
| **RTL** | Right-to-Left — text and layout direction for Arabic, Hebrew, and other right-to-left languages |
| **Screen** | A physical display device managed by the platform |
| **Sovereign Mode** | Admin-only mode where super-admins are restricted from client routes |
| **SSO** | Single Sign-On — authentication via external identity provider (SAML/OIDC) |
| **Studio** | See Playlist Studio |
| **SWR** | Stale-While-Revalidate — React data fetching library used for server state |
| **Tenant** | An isolated customer environment (workspace in Smart Screen) |
| **WCAG** | Web Content Accessibility Guidelines — international standard for web accessibility |
| **Workspace** | The primary tenant boundary in Smart Screen, containing branches, screens, and content |

---

## 5. Transformation Document Map

| Document | Purpose | Primary Audience |
|----------|---------|-----------------|
| `00-executive-summary.md` | Overview and roadmap summary | Leadership, stakeholders |
| `01-current-product-model.md` | What the product is today | Product team, new team members |
| `02-problem-map.md` | Complete problem catalog with IDs | Engineering, product, design |
| `03-root-cause-analysis.md` | Why each major issue exists | Engineering leadership, architects |
| `04-information-architecture-review.md` | IA evaluation | Product, design, IA |
| `05-navigation-analysis.md` | Navigation system analysis | Design, frontend engineering |
| `06-user-journey-analysis.md` | Journey maps with friction scores | Product, design, UX research |
| `07-screen-priorities.md` | Screen-level prioritization | Product, engineering |
| `08-feature-priorities.md` | Feature prioritization matrix | Product, engineering |
| `09-workflow-analysis.md` | Workflow analysis per user type | Product, design |
| `10-mental-model-analysis.md` | Mental model alignment | Design, UX research |
| `11-cognitive-load-analysis.md` | Cognitive load per screen/flow | Design, UX research |
| `12-usability-breakdown.md` | Nielsen heuristic evaluation | Design, product |
| `13-enterprise-saas-review.md` | Enterprise readiness assessment | Product, sales, engineering |
| `14-design-system-direction.md` | Design system standardization | Design, frontend engineering |
| `15-component-strategy.md` | Component architecture strategy | Frontend engineering |
| `16-state-strategy.md` | State management strategy | Frontend engineering |
| `17-risk-analysis.md` | Risk assessment per transformation step | Engineering leadership, product |
| `18-dependency-map.md` | Dependency graph | Engineering, project management |
| `19-redesign-roadmap.md` | Detailed roadmap with phases | Engineering leadership, product |
| `20-implementation-phases.md` | Phase execution plans | Engineering, project management |
| `21-success-metrics.md` | Measurable success criteria | Product, engineering leadership |
| `22-open-questions.md` | Questions requiring input | Product, stakeholders, UX research |
| `23-appendix.md` | This document — cross-references, glossary | All |

---

## 6. Source Code Reference

Key source files referenced throughout the transformation documents:

| File | Component/Purpose | Referenced In |
|------|-------------------|---------------|
| `apps/dashboard/src/components/crystal-shell.tsx` | Main layout shell | `04-layout-and-shell.md`, `05-navigation-analysis.md` |
| `apps/dashboard/src/components/shell-sidebar.tsx` | Sidebar navigation | `03-routing-and-navigation.md`, `05-navigation-analysis.md` |
| `apps/dashboard/src/components/shell-header.tsx` | Header with back button, actions | `03-routing-and-navigation.md`, `05-navigation-analysis.md` |
| `apps/dashboard/src/hooks/use-shell-header-meta.ts` | Page title, back button logic | `03-routing-and-navigation.md`, `05-navigation-analysis.md` |
| `apps/dashboard/src/providers/workspace-provider.tsx` | Workspace context, auth, Socket.IO | `07-workspace-management.md`, `16-state-strategy.md` |
| `apps/dashboard/src/providers/notification-provider.tsx` | Notifications, Socket.IO events | `17-notifications.md`, `16-state-strategy.md` |
| `apps/dashboard/src/components/workspace-switcher.tsx` | Workspace dropdown | `07-workspace-management.md`, `05-navigation-analysis.md` |
| `apps/dashboard/src/components/workspace-gate.tsx` | Auth/workspace gate | `04-layout-and-shell.md` |
| `apps/dashboard/src/components/ui/switch.tsx` | Switch component (RTL bug) | `05-ui-component-library.md`, P-001 |
| `apps/dashboard/src/components/ui/info-tooltip.tsx` | Custom tooltip (accessibility gap) | `05-ui-component-library.md`, P-005 |
| `apps/dashboard/src/components/ui/button.tsx` | Button with CVA variants | `02-design-system-and-tokens.md` |
| `apps/dashboard/src/components/ui/empty-state.tsx` | Empty state component | `05-ui-component-library.md` |
| `apps/dashboard/src/components/aurora-backdrop.tsx` | Dead code backdrop | `04-layout-and-shell.md`, TD-004 |
| `apps/dashboard/src/features/auth/login-form.tsx` | Login form | `06-auth-and-session.md` |
| `apps/dashboard/src/features/workspace/workspace-welcome.tsx` | Workspace welcome screen | `07-workspace-management.md` |
| `apps/dashboard/src/features/workspace/onboarding-wizard.tsx` | Onboarding wizard | `07-workspace-management.md` |
| `apps/dashboard/src/features/playlists/playlist-live-preview.tsx` | Playlist live preview | `10-playlists-and-studio.md` |
| `apps/dashboard/src/lib/icon-stroke.ts` | Icon stroke constant | `02-design-system-and-tokens.md`, TD-002 |
| `apps/dashboard/src/lib/session.ts` | Session management, API base URL | `01-architecture-and-stack.md` |
| `apps/dashboard/src/i18n/messages/en.json` | English translations | `22-i18n-and-localization.md` |
| `apps/dashboard/src/i18n/messages/ar.json` | Arabic translations | `22-i18n-and-localization.md` |
