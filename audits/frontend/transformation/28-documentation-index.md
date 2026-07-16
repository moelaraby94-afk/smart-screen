# Documentation Index

> **Purpose:** Master index of all documentation — map every document, explain relationships, define reading order and implementation order

---

## 1. Document Inventory

### 1.1 Transformation Blueprint (this folder)

| ID | File | Title | Category | Audience |
|----|------|-------|----------|----------|
| 00 | `00-executive-summary.md` | Executive Summary | Overview | Leadership, stakeholders |
| 01 | `01-current-product-model.md` | Current Product Model | Product | Product, new team members |
| 02 | `02-problem-map.md` | Problem Map | Analysis | Engineering, product, design |
| 03 | `03-root-cause-analysis.md` | Root Cause Analysis | Analysis | Engineering leadership, architects |
| 04 | `04-information-architecture-review.md` | IA Review | Analysis | Product, design, IA |
| 05 | `05-navigation-analysis.md` | Navigation Analysis | Analysis | Design, frontend engineering |
| 06 | `06-user-journey-analysis.md` | User Journey Analysis | Analysis | Product, design, UX research |
| 07 | `07-screen-priorities.md` | Screen Priorities | Planning | Product, engineering |
| 08 | `08-feature-priorities.md` | Feature Priorities | Planning | Product, engineering |
| 09 | `09-workflow-analysis.md` | Workflow Analysis | Analysis | Product, design |
| 10 | `10-mental-model-analysis.md` | Mental Model Analysis | Analysis | Design, UX research |
| 11 | `11-cognitive-load-analysis.md` | Cognitive Load Analysis | Analysis | Design, UX research |
| 12 | `12-usability-breakdown.md` | Usability Breakdown | Analysis | Design, product |
| 13 | `13-enterprise-saas-review.md` | Enterprise SaaS Review | Analysis | Product, sales, engineering |
| 14 | `14-design-system-direction.md` | Design System Direction | Strategy | Design, frontend engineering |
| 15 | `15-component-strategy.md` | Component Strategy | Strategy | Frontend engineering |
| 16 | `16-state-strategy.md` | State Strategy | Strategy | Frontend engineering |
| 17 | `17-risk-analysis.md` | Risk Analysis | Planning | Engineering leadership, product |
| 18 | `18-dependency-map.md` | Dependency Map | Planning | Engineering, project management |
| 19 | `19-redesign-roadmap.md` | Redesign Roadmap | Planning | Engineering leadership, product |
| 20 | `20-implementation-phases.md` | Implementation Phases | Execution | Engineering, project management |
| 21 | `21-success-metrics.md` | Success Metrics | Measurement | Product, engineering leadership |
| 22 | `22-open-questions.md` | Open Questions | Planning | Product, stakeholders, UX research |
| 23 | `23-appendix.md` | Appendix | Reference | All |
| 24 | `24-design-decisions.md` | Design Decisions | Reference | All (permanent record) |
| 25 | `25-design-constraints.md` | Design Constraints | Reference | All (permanent boundaries) |
| 26 | `26-product-principles.md` | Product Principles | Reference | All (permanent guidelines) |
| 27 | `27-design-system-governance.md` | Design System Governance | Reference | Frontend engineering, design |
| 28 | `28-documentation-index.md` | Documentation Index (this file) | Reference | All |

### 1.2 V1/V2 Frontend Audit Files

| File | Title | Category |
|------|-------|----------|
| `audits/frontend/00-index.md` | V2 Enrichment Methodology | Methodology |
| `audits/frontend/01-architecture-and-stack.md` | Architecture and Stack | Technical |
| `audits/frontend/02-design-system-and-tokens.md` | Design System and Tokens | Design |
| `audits/frontend/03-routing-and-navigation.md` | Routing and Navigation | Technical |
| `audits/frontend/04-layout-and-shell.md` | Layout and Shell | Technical |
| `audits/frontend/05-ui-component-library.md` | UI Component Library | Design |
| `audits/frontend/06-auth-and-session.md` | Auth and Session | Technical |
| `audits/frontend/07-workspace-management.md` | Workspace Management | Technical |
| `audits/frontend/08-dashboard-and-overview.md` | Dashboard and Overview | Feature |
| `audits/frontend/09-screens-feature.md` | Screens Feature | Feature |
| `audits/frontend/10-playlists-and-studio.md` | Playlists and Studio | Feature |
| `audits/frontend/11-media-library.md` | Media Library | Feature |
| `audits/frontend/12-schedules-feature.md` | Schedules Feature | Feature |
| `audits/frontend/13-branches-feature.md` | Branches Feature | Feature |
| `audits/frontend/14-settings-feature.md` | Settings Feature | Feature |
| `audits/frontend/15-admin-panel.md` | Admin Panel | Feature |
| `audits/frontend/16-team-feature.md` | Team Feature | Feature |
| `audits/frontend/17-notifications.md` | Notifications | Feature |
| `audits/frontend/18-analytics-feature.md` | Analytics Feature | Feature |
| `audits/frontend/19-islamic-features.md` | Islamic Features | Feature |
| `audits/frontend/20-api-docs-and-webhooks.md` | API Docs and Webhooks | Feature |
| `audits/frontend/21-search-and-global-actions.md` | Search and Global Actions | Feature |
| `audits/frontend/22-i18n-and-localization.md` | i18n and Localization | Technical |
| `audits/frontend/23-error-handling-and-states.md` | Error Handling and States | Technical |
| `audits/frontend/24-accessibility-audit.md` | Accessibility Audit | Accessibility |
| `audits/frontend/25-responsive-audit.md` | Responsive Audit | Design |
| `audits/frontend/26-consistency-audit.md` | Consistency Audit | Design |
| `audits/frontend/27-user-flows.md` | User Flows | UX |
| `audits/frontend/28-feature-inventory.md` | Feature Inventory | Product |

### 1.3 Other Project Documentation

| File | Title | Category |
|------|-------|----------|
| `docs/EXECUTION_PLAN.md` | Execution Plan (11 phases) | Planning |
| `docs/CHANGELOG_LAUNCH.md` | Launch Changelog | Reference |
| `docs/ORCA-vs-CloudScreen-Comparison.md` | ORCA vs Cloud-Screen Comparison | Reference |
| `docs/api-page-coverage-matrix.md` | API Page Coverage Matrix | Reference |
| `audits/00-audit-review-and-credibility.md` | Audit Review and Credibility | Methodology |
| `audits/01-architecture-and-structure.md` | Architecture and Structure (general) | Technical |
| `audits/02-prisma-schema-and-database.md` | Prisma Schema and Database | Technical |
| `audits/03-backend-domains-and-business-logic.md` | Backend Domains and Business Logic | Technical |

---

## 2. Document Relationship Map

### 2.1 Dependency Graph

```
V1/V2 Audits (28 files)
    │
    ├──→ 00-executive-summary.md (synthesizes all)
    │       │
    │       └──→ 28-documentation-index.md (indexes all)
    │
    ├──→ 01-current-product-model.md (from 01, 28, 19)
    │
    ├──→ 02-problem-map.md (from all audits)
    │       │
    │       ├──→ 03-root-cause-analysis.md (from 02)
    │       ├──→ 17-risk-analysis.md (from 02)
    │       ├──→ 18-dependency-map.md (from 02)
    │       └──→ 24-design-decisions.md (from 02)
    │
    ├──→ 04-information-architecture-review.md (from 03, 13, 27)
    │       │
    │       └──→ 05-navigation-analysis.md (from 03, 04, 21)
    │
    ├──→ 06-user-journey-analysis.md (from 27, 08, 09, 14)
    │       │
    │       └──→ 09-workflow-analysis.md (from 06, 28)
    │
    ├──→ 07-screen-priorities.md (from 08-18, 28)
    │
    ├──→ 08-feature-priorities.md (from 02, 28)
    │       │
    │       └──→ 19-redesign-roadmap.md (from 07, 08, 17, 18)
    │               │
    │               └──→ 20-implementation-phases.md (from 18, 19)
    │                       │
    │                       └──→ 21-success-metrics.md (from 12, 13, 20)
    │
    ├──→ 10-mental-model-analysis.md (from 27, 04)
    ├──→ 11-cognitive-load-analysis.md (from 03, 23, 08)
    ├──→ 12-usability-breakdown.md (from 23, 24, 26)
    │
    ├──→ 13-enterprise-saas-review.md (from 28, 15, 16, 14)
    │
    ├──→ 14-design-system-direction.md (from 02, 05, 24, 26)
    │       │
    │       ├──→ 15-component-strategy.md (from 05, 14)
    │       ├──→ 16-state-strategy.md (from 01, 07, 17)
    │       └──→ 27-design-system-governance.md (from 02, 05, 14, 15)
    │
    ├──→ 22-open-questions.md (from all — gaps identified)
    │
    ├──→ 23-appendix.md (from all — cross-references)
    │
    ├──→ 24-design-decisions.md (from 02, 17, 18)
    │       │
    │       └──→ 25-design-constraints.md (from 24, all audits)
    │
    ├──→ 25-design-constraints.md
    │       │
    │       └──→ 26-product-principles.md (from 25, 12, 11)
    │
    └──→ 26-product-principles.md
            │
            └──→ 27-design-system-governance.md (from 26, 14, 15)
```

### 2.2 Cross-Reference Matrix

| Source ↓ \ References → | 02 | 08 | 17 | 18 | 19 | 20 | 22 | 24 | 25 | 26 |
|--------------------------|----|----|----|----|----|----|----|----|----|----|
| 02-problem-map | — | ✅ | ✅ | ✅ | — | — | — | ✅ | ✅ | — |
| 03-root-cause | ✅ | — | — | — | — | — | — | ✅ | — | — |
| 04-ia-review | ✅ | — | — | — | — | — | — | — | — | — |
| 05-navigation | ✅ | — | — | — | — | — | — | — | — | — |
| 06-journeys | — | — | — | — | — | — | — | — | — | — |
| 07-screens | — | ✅ | — | — | ✅ | ✅ | — | — | — | — |
| 08-features | ✅ | — | — | ✅ | ✅ | ✅ | — | ✅ | — | — |
| 09-workflows | — | — | — | — | — | — | — | — | — | — |
| 10-mental-model | — | — | — | — | — | — | — | — | — | — |
| 11-cognitive-load | — | — | — | — | — | — | — | — | — | ✅ |
| 12-usability | — | — | — | — | — | — | — | — | — | ✅ |
| 13-enterprise | ✅ | ✅ | — | — | — | ✅ | — | — | ✅ | — |
| 14-design-system | — | — | — | — | — | — | — | ✅ | ✅ | ✅ |
| 15-components | — | — | — | — | — | — | — | ✅ | — | — |
| 16-state | — | — | — | — | — | — | — | — | — | — |
| 17-risk | ✅ | — | — | — | — | — | — | ✅ | — | — |
| 18-dependencies | ✅ | ✅ | ✅ | — | ✅ | ✅ | — | ✅ | — | — |
| 19-roadmap | — | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — |
| 20-phases | ✅ | ✅ | ✅ | ✅ | ✅ | — | — | — | — | — |
| 21-metrics | — | — | — | — | ✅ | ✅ | — | — | — | — |
| 22-questions | — | — | — | — | ✅ | ✅ | — | ✅ | — | — |
| 24-decisions | ✅ | ✅ | ✅ | ✅ | ✅ | — | ✅ | — | ✅ | ✅ |
| 25-constraints | ✅ | — | — | — | — | — | — | ✅ | — | ✅ |
| 26-principles | — | — | — | — | — | — | — | ✅ | ✅ | — |
| 27-governance | — | — | — | — | — | — | — | ✅ | ✅ | ✅ |

---

## 3. Reading Order

### 3.1 For New Developers

| Step | Read | Purpose |
|------|------|---------|
| 1 | `00-executive-summary.md` | Understand the big picture |
| 2 | `01-current-product-model.md` | Understand what the product is |
| 3 | `28-documentation-index.md` (this file) | Know where everything is |
| 4 | `26-product-principles.md` | Understand the permanent principles |
| 5 | `25-design-constraints.md` | Understand what must never be broken |
| 6 | `27-design-system-governance.md` | Understand how to build components |
| 7 | `02-problem-map.md` | Understand what's wrong |
| 8 | `19-redesign-roadmap.md` | Understand the plan |
| 9 | `20-implementation-phases.md` | Understand the execution |
| 10 | `24-design-decisions.md` | Understand why decisions were made |

### 3.2 For New UX Designers

| Step | Read | Purpose |
|------|------|---------|
| 1 | `00-executive-summary.md` | Understand the big picture |
| 2 | `01-current-product-model.md` | Understand the product |
| 3 | `26-product-principles.md` | Understand design principles |
| 4 | `04-information-architecture-review.md` | Understand IA issues |
| 5 | `05-navigation-analysis.md` | Understand navigation issues |
| 6 | `06-user-journey-analysis.md` | Understand user pain points |
| 7 | `10-mental-model-analysis.md` | Understand mental model gaps |
| 8 | `11-cognitive-load-analysis.md` | Understand cognitive load |
| 9 | `12-usability-breakdown.md` | Understand heuristic violations |
| 10 | `14-design-system-direction.md` | Understand design system direction |
| 11 | `27-design-system-governance.md` | Understand component rules |
| 12 | `22-open-questions.md` | Understand what needs user research |

### 3.3 For Product Managers

| Step | Read | Purpose |
|------|------|---------|
| 1 | `00-executive-summary.md` | Understand the big picture |
| 2 | `01-current-product-model.md` | Understand the product |
| 3 | `02-problem-map.md` | Understand all problems |
| 4 | `07-screen-priorities.md` | Understand what to redesign first |
| 5 | `08-feature-priorities.md` | Understand feature priorities |
| 6 | `13-enterprise-saas-review.md` | Understand enterprise gaps |
| 7 | `19-redesign-roadmap.md` | Understand the roadmap |
| 8 | `21-success-metrics.md` | Understand success criteria |
| 9 | `22-open-questions.md` | Understand what needs stakeholder input |
| 10 | `24-design-decisions.md` | Understand decision rationale |

### 3.4 For QA Engineers

| Step | Read | Purpose |
|------|------|---------|
| 1 | `00-executive-summary.md` | Understand the big picture |
| 2 | `25-design-constraints.md` | Understand what must not break |
| 3 | `27-design-system-governance.md` | Understand component rules (§7, §8 checklists) |
| 4 | `02-problem-map.md` | Understand problems to test against |
| 5 | `20-implementation-phases.md` | Understand phase exit criteria (verification sections) |
| 6 | `21-success-metrics.md` | Understand success metrics to verify |
| 7 | `12-usability-breakdown.md` | Understand heuristic violations to test |
| 8 | `24-accessibility-audit.md` (V2 audit) | Understand accessibility criteria |

### 3.5 For Engineering Leadership

| Step | Read | Purpose |
|------|------|---------|
| 1 | `00-executive-summary.md` | Understand the big picture |
| 2 | `03-root-cause-analysis.md` | Understand why issues exist |
| 3 | `17-risk-analysis.md` | Understand transformation risks |
| 4 | `18-dependency-map.md` | Understand dependencies and critical path |
| 5 | `19-redesign-roadmap.md` | Understand timeline |
| 6 | `24-design-decisions.md` | Understand decision rationale |
| 7 | `25-design-constraints.md` | Understand technical boundaries |
| 8 | `16-state-strategy.md` | Understand state management strategy |
| 9 | `15-component-strategy.md` | Understand component architecture |

---

## 4. Implementation Order

The implementation order follows the roadmap phases. Each phase has entry criteria, tasks, and exit criteria defined in `20-implementation-phases.md`.

| Phase | Duration | Key Documents | Primary Focus |
|-------|----------|---------------|---------------|
| Phase 0 | 1-2 weeks | `20-implementation-phases.md`, `18-dependency-map.md` | Preparation, test infrastructure |
| Phase 1 | 2-3 weeks | `24-design-decisions.md` DD-05–DD-13 | Foundation: fix critical defects |
| Phase 2 | 2-3 weeks | `24-design-decisions.md` DD-04, DD-11 | Navigation: mobile switcher, switcher search |
| Phase 3 | 2-3 weeks | `24-design-decisions.md` DD-01–DD-03, DD-20 | IA: sidebar grouping, Studio/Branches repositioning |
| Phase 4 | 3-4 weeks | `24-design-decisions.md` DD-12 | Dashboard: quick actions, onboarding |
| Phase 5 | 4-5 weeks | `08-feature-priorities.md` F-HP-05 | Content: media library, multi-upload |
| Phase 6 | 3-4 weeks | `08-feature-priorities.md` F-HP-03, F-HP-04 | Screens: search, filter, bulk ops |
| Phase 7 | 4-5 weeks | `24-design-decisions.md` DD-15 | Playlists: templates, auto-save, versioning |
| Phase 8 | 3-4 weeks | `08-feature-priorities.md` F-HP-06, F-HP-07 | Schedules: timezone, conflict detection |
| Phase 9 | 3-4 weeks | `24-design-decisions.md` DD-19, DD-23 | Settings: SSO, RBAC, audit, billing |
| Phase 10 | 2-3 weeks | `21-success-metrics.md`, `27-design-system-governance.md` | Polish: tests, accessibility, documentation |

---

## 5. Terminology Standardization

### 5.1 Canonical Terms

The following terms are the canonical names used across all documentation. No synonyms should be used.

| Canonical Term | Do Not Use | Definition |
|----------------|-----------|------------|
| **Workspace** | Tenant, Organization, Account | The primary tenant boundary containing branches, screens, and content |
| **Branch** | Location, Store, Site, Venue | A physical location grouping within a workspace |
| **Screen** | Display, Device, Monitor, Player | A physical display device managed by the platform |
| **Playlist** | Content, Slideshow, Presentation | A sequence of media items displayed on screens |
| **Studio** | Editor, Canvas, Designer | The Konva-based canvas editor for creating playlists |
| **Schedule** | Calendar, Timetable, Agenda | A time-based rule for when playlists play on screens |
| **Media** | Asset, File, Image, Video | An uploaded file (image, video) used in playlists |
| **Template** | Preset, Blueprint, Starter | A pre-built playlist structure for quick creation |
| **Super-Admin** | Admin, Root, Superuser | A platform-level administrator with access to all customers |
| **Workspace Owner** | Admin, Manager, Owner | The highest role within a workspace |
| **Editor** | Content Manager, Creator | A role that can create and edit content |
| **Viewer** | Read-Only, Observer | A role that can view but not edit |
| **Impersonation** | Masquerade, Act-as, Login-as | Admin feature to view the product as a specific customer |
| **Onboarding** | Setup, Wizard, Initialization | The process of setting up a new workspace |
| **Pairing** | Registration, Linking, Connection | The process of connecting a screen to the platform |
| **Publishing** | Deploying, Pushing, Broadcasting | The act of making a playlist live on screens |
| **Override** | Interruption, Takeover, Emergency | A temporary playlist that interrupts scheduled content |
| **Dashboard** | Overview, Home, Landing | The main landing page showing workspace summary |
| **Sidebar** | Nav, Navigation, Menu | The vertical navigation panel |
| **Header** | Topbar, Navbar, Toolbar | The horizontal top bar with actions |
| **Switcher** | Selector, Picker, Dropdown | The workspace selection dropdown |
| **Toast** | Notification, Alert, Snack | A transient notification message |
| **Bell** | Notification Icon, Alert Badge | The notification indicator in the header |
| **Skeleton** | Placeholder, Shimmer, Loader | A loading state showing content structure |
| **Spinner** | Loading Icon, Spinner, Indicator | A loading state showing action in progress |
| **Empty State** | Zero State, No Data, Placeholder | The state when no data exists |
| **Error State** | Failure State, Error Page | The state when something goes wrong |
| **Quick Action** | Shortcut, CTA, Action Button | A prominent action button on the dashboard |
| **Click Guard** | Navigation Guard, Route Guard | A mechanism preventing navigation when prerequisites aren't met |
| **Data Epoch** | Refresh Token, Cache Buster | A counter that triggers SWR revalidation |
| **Sovereign Mode** | Admin Mode, Super-Admin Mode | The state where super-admins are restricted from client routes |
| **ORCA** | Design System, Theme | The design system name used in Cloud-Screen |
| **RTL** | Right-to-Left, Arabic Mode | Right-to-Left text and layout direction |
| **LTR** | Left-to-Right, English Mode | Left-to-Right text and layout direction |
| **WCAG** | Accessibility Standard, A11y | Web Content Accessibility Guidelines |
| **RBAC** | Roles, Permissions, Access Control | Role-Based Access Control |
| **SSO** | SAML, OIDC, Single Sign-On | Single Sign-On via external identity provider |
| **SWR** | Cache, Data Fetching | Stale-While-Revalidate data fetching library |
| **CVA** | Variants, Variant System | Class Variance Authority for component variants |

### 5.2 ID Prefixes

| Prefix | Domain | Defined In |
|--------|--------|------------|
| `P-` | Critical UX Problem | `02-problem-map.md` |
| `E-` | Enterprise SaaS Gap | `02-problem-map.md` |
| `IA-` | Information Architecture Issue | `02-problem-map.md` |
| `TD-` | Technical Debt | `02-problem-map.md` |
| `A-` | Accessibility Issue | `02-problem-map.md` |
| `C-` (problem) | Consistency Issue | `02-problem-map.md` |
| `I-` | i18n Issue | `02-problem-map.md` |
| `F-MH-` | Must-Have Feature | `08-feature-priorities.md` |
| `F-HP-` | High-Priority Feature | `08-feature-priorities.md` |
| `F-MP-` | Medium-Priority Feature | `08-feature-priorities.md` |
| `F-LP-` | Low-Priority Feature | `08-feature-priorities.md` |
| `F-FU-` | Future Feature | `08-feature-priorities.md` |
| `DD-` | Design Decision | `24-design-decisions.md` |
| `TC-` | Technical Constraint | `25-design-constraints.md` |
| `BC-` | Business Constraint | `25-design-constraints.md` |
| `AC-` | Architecture Constraint | `25-design-constraints.md` |
| `BCN-` | Backend Constraint | `25-design-constraints.md` |
| `APC-` | API Constraint | `25-design-constraints.md` |
| `DC-` | Database Constraint | `25-design-constraints.md` |
| `PC-` | Performance Constraint | `25-design-constraints.md` |
| `ACC-` | Accessibility Constraint | `25-design-constraints.md` |
| `LC-` | Localization Constraint | `25-design-constraints.md` |
| `RTC-` | RTL Constraint | `25-design-constraints.md` |
| `SC-` | Security Constraint | `25-design-constraints.md` |
| `SCL-` | Scalability Constraint | `25-design-constraints.md` |
| `BSC-` | Browser Support Constraint | `25-design-constraints.md` |
| `MSC-` | Mobile Support Constraint | `25-design-constraints.md` |
| `EC-` | Enterprise Constraint | `25-design-constraints.md` |
| `PP-` | Product Principle | `26-product-principles.md` |
| `R-` | Risk | `17-risk-analysis.md` |
| `R-IGN-` | Risk of Ignoring | `17-risk-analysis.md` |
| `Q-STK-` | Stakeholder Question | `22-open-questions.md` |
| `Q-PRD-` | Product Decision Question | `22-open-questions.md` |
| `Q-BIZ-` | Business Decision Question | `22-open-questions.md` |
| `Q-UX-` | UX Research Question | `22-open-questions.md` |
| `Q-INT-` | User Interview Question | `22-open-questions.md` |
| `Q-ANA-` | Analytics Question | `22-open-questions.md` |
| `Q-TEC-` | Technical Investigation Question | `22-open-questions.md` |

**Note:** All constraint ID prefixes are unique. The `AC-` prefix is used only for Architecture constraints. API constraints use `APC-`. Security constraints use `SC-`. Scalability constraints use `SCL-`.

---

## 6. Traceability Matrix

### 6.1 Problem → Full Trace

| Problem ID | Root Cause | Dependencies | Roadmap Phase | Impl. Phase | Decision ID | Success Metric | Open Question |
|------------|-----------|--------------|---------------|-------------|-------------|----------------|---------------|
| P-001 | `03` Major Issue 3 | None | Phase 1 | Phase 1 | DD-10 | `21` §9 Phase 1 | — |
| P-002 | `03` Major Issue 2 | None | Phase 2 | Phase 2 | DD-11 | `21` §9 Phase 2 | Q-STK-02 |
| P-003 | `03` Major Issue 4 | DD-05 (Tooltip) | Phase 1 | Phase 1 | DD-12 | `21` §9 Phase 1 | — |
| P-004 | `03` Major Issue 5 | None | Phase 1-2 | Phase 1-2 | DD-13 | `21` §9 Phase 1-2 | — |
| P-005 | `03` Major Issue 8 | Radix install | Phase 1 | Phase 1 | DD-05, DD-14 | `21` §9 Phase 1 | — |
| E-001 | `03` Major Issue 9 | Backend SSO | Phase 9 | Phase 9 | DD-19, DD-23 | `21` §6.1 | Q-BIZ-01 |
| E-002 | `03` Major Issue 10 | Backend audit | Phase 9 | Phase 9 | DD-19 | `21` §6.1 | — |
| E-003 | `03` Major Issue 11 | Backend RBAC | Phase 9 | Phase 9 | DD-19 | `21` §6.1 | Q-BIZ-02 |
| E-004 | `03` Cross-cutting | Backend bulk API | Phase 5-6 | Phase 5-6 | DD-19 | `21` §2.1 | — |
| E-005 | `03` Major Issue 12 | Backend timezone | Phase 8 | Phase 8 | DD-19 | `21` §2.1 | Q-STK-05 |
| E-006 | `05` §3.2 | None | Phase 2 | Phase 2 | — | `21` §3.1 | — |
| IA-001 | `03` Cross-cutting 1 | None | Phase 3 | Phase 3 | DD-01, DD-20 | `21` §3.1 | Q-PRD-01, Q-UX-02 |
| IA-002 | `03` Cross-cutting 1 | IA-001 | Phase 3 | Phase 3 | DD-01 | `21` §3.2 | — |
| IA-003 | `03` Major Issue 1 | None | Phase 2 | Phase 2 | DD-04 | `21` §3.2 | Q-INT-01 |
| IA-004 | `04` §8.1 | Dialog components | Phase 4 | Phase 4 | — | `21` §2.2 | Q-UX-03 |
| IA-005 | `05` §3.4 | None | Phase 2 | Phase 2 | DD-13 | `21` §3.2 | — |
| TD-001 | `03` Cross-cutting 2 | None | Phase 1 | Phase 1 | DD-06 | `21` §7.2 | — |
| TD-002 | `26` §26.6 | None | Phase 1 | Phase 1 | DD-09 | `21` §7.2 | — |
| TD-003 | `26` §26.6 | IA-001 | Phase 3 | Phase 3 | DD-02 | `21` §7.2 | — |
| TD-004 | `04` §4.8 | None | Phase 1 | Phase 1 | — | `21` §7.2 | — |
| TD-005 | `03` Major Issue 13 | None | Phase 1 | Phase 1 | DD-08 | `21` §4.2 | — |
| TD-006 | `03` Major Issue 12 | None | Phase 1 | Phase 1 | DD-07 | `21` §4.2 | — |
| TD-007 | `03` Cross-cutting 5 | None | Phase 10 | Phase 10 | — | `21` §7.1 | — |
| A-002 | `24` §24.7 | None | Phase 1 | Phase 1 | DD-22 | `21` §5.1 | — |
| A-004 | `24` §24.7 | None | Phase 1 | Phase 1 | DD-22 | `21` §5.1 | — |
| I-001 | `22` §22.7 | None | Phase 10 | Phase 10 | DD-18 | — | — |
| I-002 | `22` §22.7 | None | Phase 10 | Phase 10 | DD-18 | — | — |

### 6.2 Feature → Full Trace

| Feature ID | Problem ID | Decision ID | Phase | Complexity | Dependencies |
|------------|-----------|-------------|-------|------------|--------------|
| F-MH-01 | P-001 | DD-10 | 1 | Small | None |
| F-MH-02 | P-002 | DD-11 | 2 | Medium | None |
| F-MH-03 | P-003 | DD-12 | 1 | Small | DD-05 (Tooltip) |
| F-MH-04 | P-004 | DD-13 | 1 | Small | None |
| F-MH-05 | P-005 | DD-05, DD-14 | 1 | Medium | Radix install |
| F-MH-06 | TD-001 | DD-06 | 1 | Medium | None |
| F-MH-07 | TD-006 | DD-07 | 1 | Small | None |
| F-MH-08 | TD-005 | DD-08 | 1 | Small | None |
| F-HP-01 | IA-001, IA-002 | DD-01, DD-20 | 3 | Medium | None |
| F-HP-02 | IA-003 | DD-04 | 2 | Small | None |
| F-HP-03 | E-004 | — | 6 | Medium | SearchInput, FilterBar |
| F-HP-04 | E-004 | DD-19 | 6 | Large | Backend bulk API |
| F-HP-05 | E-004 | DD-19 | 5 | Medium | Backend multi-upload |
| F-HP-06 | E-005 | DD-19 | 8 | Large | Backend timezone |
| F-HP-07 | — | — | 8 | Medium | None |
| F-HP-08 | E-003 | DD-19 | 9 | XL | Backend RBAC |
| F-HP-09 | — | — | 9 | Medium | None (basic) / RBAC (roles) |
| F-HP-10 | E-002 | DD-19 | 9 | Large | Backend audit |
| F-HP-11 | E-001 | DD-19, DD-23 | 9 | XL | Backend SSO |
| F-HP-12 | TD-007 | — | 10 | Large | None |
| F-HP-13 | E-006 | — | 2 | Medium | SearchInput |
| F-HP-14 | IA-004 | — | 4 | Medium | Dialog components |
| F-HP-15 | A-004 | DD-22 | 1 | Small | None |
| F-HP-16 | A-002 | DD-22 | 1 | Small | None |

---

## 7. Quality Verification

### 7.1 Documentation Completeness Checklist

- [x] Every problem has an ID, root cause, evidence, priority, complexity, dependencies, and success criteria
- [x] Every feature has an ID, problem reference, priority, complexity, dependencies, and phase
- [x] Every design decision has an ID, alternatives, trade-offs, and rationale
- [x] Every constraint has an ID, rationale, and "must never be broken" statement
- [x] Every principle has an ID, description, evidence, application scope, and exceptions
- [x] Every risk has an ID, probability, impact, score, and mitigation
- [x] Every open question has an ID, category, and blocking assessment
- [x] Every phase has entry criteria, tasks, exit criteria, and verification steps
- [x] Every success metric has a current value, target value, and measurement method
- [x] All cross-references use the citation format
- [x] Terminology is standardized (§5.1)
- [x] ID prefixes are documented (§5.2)
- [x] Traceability matrix is complete (§6)

### 7.2 Audience Verification

- [x] A new developer can understand the project (reading order §3.1)
- [x] A new UX designer can redesign confidently (reading order §3.2)
- [x] A PM can prioritize work (reading order §3.3)
- [x] QA can derive test plans (reading order §3.4)
- [x] Engineering can implement safely (reading order §3.5)
- [x] No hidden assumptions remain (all decisions documented in `24-design-decisions.md`)

---

## Cross-References

- This document indexes all 29 transformation files (00–28) and 29 V1/V2 audit files
- See `23-appendix.md` for audit file evidence index and source code reference
- See `24-design-decisions.md` for the decision traceability summary
- See `25-design-constraints.md` for the constraint summary
- See `26-product-principles.md` for the principle summary
