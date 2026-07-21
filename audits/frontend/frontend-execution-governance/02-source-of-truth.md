# 02 — Source of Truth

> **Status:** FINAL — Defines document authority and precedence

---

## 1. Purpose

This document defines which documents are the **authoritative source of truth** for each domain of the Smart Screen frontend, and establishes precedence rules when documents conflict.

---

## 2. Document Authority Tiers

### Tier 1: Governance (Highest Authority)
These governance documents. They enforce compliance with all other documentation.

| Document | Authority Over |
|----------|---------------|
| `01-ai-constitution.md` | All implementation decisions |
| `09-definition-of-ready.md` | Implementation start gates |
| `10-definition-of-done.md` | Implementation completion gates |
| `26-anti-patterns.md` | All code patterns |

### Tier 2: Design System V2 (Implementation Authority)
The design system is the **implementation authority** for all visual and component decisions.

| Document | Authority Over |
|----------|---------------|
| `design-system-v2/44-design-tokens.md` | All tokens (colors, spacing, typography, etc.) |
| `design-system-v2/12-37` (component specs) | All component implementation |
| `design-system-v2/38-responsive-rules.md` | All responsive behavior |
| `design-system-v2/39-rtl-rules.md` | All RTL behavior |
| `design-system-v2/10-accessibility-rules.md` | All accessibility implementation |

### Tier 3: Screen Specifications (Screen Authority)
Screen specs are the **authority for each screen's** layout, components, states, and interactions.

| Document | Authority Over |
|----------|---------------|
| `screen-specifications/01-14` | Screen layout, component tree, states, API requirements |

### Tier 4: User Flow Architecture (Flow Authority)
Flow architecture is the **authority for user journeys** and state transitions.

| Document | Authority Over |
|----------|---------------|
| `user-flow-architecture/01-19` | User flows, state machines, decision trees |

### Tier 5: UX Blueprint (UX Authority)
UX blueprint is the **authority for UX rules** and standards.

| Document | Authority Over |
|----------|---------------|
| `ux-blueprint/01-17` | UX principles, state guidelines, component UX standards |

### Tier 6: Product Architecture (Product Authority)
Product architecture is the **authority for product entities, rules, and constraints**.

| Document | Authority Over |
|----------|---------------|
| `product-architecture/01-21` | Entities, hierarchy, product rules, constraints |
| `product-architecture/17-product-rules.md` | Product rules (PR-01 through PR-50) |

### Tier 7: Information Architecture (Navigation Authority)
IA is the **authority for navigation, page catalog, and naming**.

| Document | Authority Over |
|----------|---------------|
| `information-architecture/01-09` | Sitemap, navigation, page catalog, naming conventions |

### Tier 8: Transformation (Strategic Authority)
Transformation docs provide **strategic direction and analysis**.

| Document | Authority Over |
|----------|---------------|
| `transformation/00-28` | Problem analysis, priorities, roadmap, design decisions |

### Tier 9: Frontend Audit V1 (Historical Authority)
Audit V1 provides **historical context and current state analysis**.

| Document | Authority Over |
|----------|---------------|
| `audits/frontend/00-28` | Current state, existing issues, feature inventory |

---

## 3. Precedence Rules

### 3.1 General Rule
Later phases override earlier phases for implementation decisions:

```
Governance > Design System V2 > Screen Specs > User Flow Architecture
> UX Blueprint > Product Architecture > Information Architecture
> Transformation > Frontend Audit V1
```

### 3.2 Domain-Specific Precedence

| Decision Type | Authoritative Source | Fallback |
|---------------|---------------------|----------|
| Color value | `design-system-v2/44-design-tokens.md` | `design-system-v2/01-foundations.md` |
| Component spec | `design-system-v2/12-37` (component spec) | `ux-blueprint/03-component-ux-standards.md` |
| Screen layout | `screen-specifications/01-14` | `ux-blueprint/05-page-type-ux-rules.md` |
| User flow | `user-flow-architecture/06-18` (specific flow) | `user-flow-architecture/01-05` (principles) |
| Entity definition | `product-architecture/02-core-product-entities.md` | `information-architecture/08-naming-and-conventions.md` |
| Navigation | `information-architecture/05-navigation-architecture.md` | `screen-specifications/01-global-layout-spec.md` |
| Product rule | `product-architecture/17-product-rules.md` | — (no override) |
| Accessibility | `design-system-v2/10-accessibility-rules.md` | `ux-blueprint/04-responsive-ux-rules.md` |
| Responsive | `design-system-v2/38-responsive-rules.md` | `ux-blueprint/04-responsive-ux-rules.md` |
| RTL | `design-system-v2/39-rtl-rules.md` | `ux-blueprint/04-responsive-ux-rules.md` |
| Animation | `design-system-v2/07-motion-system.md` | `design-system-v2/08-animation-principles.md` |
| State (loading/empty/error) | `design-system-v2/18-21` | `ux-blueprint/02-state-guidelines.md` |
| Performance | `frontend-execution-governance/20-performance-budget.md` | `design-system-v2/46-performance-guidelines.md` |
| Naming | `design-system-v2/41-component-naming.md` | `information-architecture/08-naming-and-conventions.md` |

### 3.3 Conflict Resolution

When two documents conflict:

1. **Check precedence** — higher tier wins
2. **Check recency** — later phase wins (V2 > V1, Screen Specs > UX Blueprint)
3. **Check specificity** — more specific document wins (component spec > general rules)
4. **If still conflicting** — create an ADR per `24-adr-process.md`

---

## 4. Authoritative Document Registry

### 4.1 Tokens
| What | Authoritative Document |
|------|----------------------|
| Color tokens | `design-system-v2/44-design-tokens.md` §2 |
| Spacing tokens | `design-system-v2/44-design-tokens.md` §3 |
| Typography tokens | `design-system-v2/44-design-tokens.md` §4 |
| Radius tokens | `design-system-v2/44-design-tokens.md` §5 |
| Shadow tokens | `design-system-v2/44-design-tokens.md` §6 |
| Z-index tokens | `design-system-v2/44-design-tokens.md` §8 |
| Motion tokens | `design-system-v2/44-design-tokens.md` §10 |
| Icon size tokens | `design-system-v2/44-design-tokens.md` §11 |
| Container tokens | `design-system-v2/44-design-tokens.md` §12 |

### 4.2 Components
| What | Authoritative Document |
|------|----------------------|
| Button | `design-system-v2/12-button-specifications.md` |
| Input | `design-system-v2/13-input-specifications.md` |
| Form | `design-system-v2/14-form-standards.md` |
| Card | `design-system-v2/15-cards.md` |
| Table | `design-system-v2/16-tables.md` |
| List | `design-system-v2/17-lists.md` |
| Dialog | `design-system-v2/22-dialog-standards.md` |
| Drawer | `design-system-v2/23-drawer-standards.md` |
| Toast | `design-system-v2/24-toast-standards.md` |
| Navigation | `design-system-v2/25-navigation-components.md` |
| Search | `design-system-v2/26-search-components.md` |
| Filter | `design-system-v2/27-filter-components.md` |
| Studio | `design-system-v2/31-studio-components.md` |
| Screen Cards | `design-system-v2/32-screen-cards.md` |
| Playlist | `design-system-v2/33-playlist-components.md` |
| Media | `design-system-v2/34-media-components.md` |
| Scheduling | `design-system-v2/35-scheduling-components.md` |
| Admin | `design-system-v2/36-admin-components.md` |
| Settings | `design-system-v2/37-settings-components.md` |

### 4.3 Screens
| What | Authoritative Document |
|------|----------------------|
| Global Layout | `screen-specifications/01-global-layout-spec.md` |
| Auth/Error | `screen-specifications/02-auth-error-specs.md` |
| Overview | `screen-specifications/03-overview-spec.md` |
| Screens | `screen-specifications/04-screens-specs.md` |
| Content | `screen-specifications/05-content-specs.md` |
| Studio | `screen-specifications/06-studio-spec.md` |
| Scheduling/Analytics | `screen-specifications/07-scheduling-analytics-specs.md` |
| Team | `screen-specifications/08-team-spec.md` |
| Settings (Part 1) | `screen-specifications/09-settings-specs-part1.md` |
| Settings (Part 2) | `screen-specifications/10-settings-specs-part2.md` |
| Notifications/Admin (Part 1) | `screen-specifications/11-notifications-admin-specs-part1.md` |
| Admin (Part 2) | `screen-specifications/12-admin-specs-part2.md` |
| Shared Dialogs | `screen-specifications/13-shared-dialogs-specs.md` |

### 4.4 Flows
| What | Authoritative Document |
|------|----------------------|
| Flow Principles | `user-flow-architecture/01-flow-principles.md` |
| Auth Flows | `user-flow-architecture/06-auth-flows.md` |
| Workspace Flows | `user-flow-architecture/07-workspace-flows.md` |
| Screen Flows | `user-flow-architecture/08-screen-flows.md` |
| Media Flows | `user-flow-architecture/09-media-flows.md` |
| Playlist Flows | `user-flow-architecture/10-playlist-flows.md` |
| Publishing/Scheduling | `user-flow-architecture/11-publishing-scheduling-flows.md` |
| Team Flows | `user-flow-architecture/12-team-flows.md` |
| Settings Flows | `user-flow-architecture/13-settings-flows.md` |
| Notification/Analytics | `user-flow-architecture/14-notification-analytics-flows.md` |
| Admin Flows | `user-flow-architecture/15-admin-flows.md` |
| System Flows | `user-flow-architecture/16-system-flows.md` |
| Onboarding Flows | `user-flow-architecture/17-onboarding-flows.md` |
| Edge Cases | `user-flow-architecture/18-edge-cases.md` |

### 4.5 Product Rules
| What | Authoritative Document |
|------|----------------------|
| Product Rules (PR-01 to PR-50) | `product-architecture/17-product-rules.md` |
| Product Constraints | `product-architecture/18-product-constraints.md` |
| Entity Definitions | `product-architecture/02-core-product-entities.md` |
| Entity Relationships | `product-architecture/03-entity-relationships.md` |
| Product Hierarchy | `product-architecture/04-product-hierarchy.md` |
| Module Boundaries | `product-architecture/12-module-boundaries.md` |
| Frontend Responsibilities | `product-architecture/14-frontend-responsibilities.md` |
| Frontend State Boundaries | `product-architecture/13-frontend-state-boundaries.md` |

---

## 5. Non-Authoritative Documents

The following documents provide **context, analysis, and history** but are NOT authoritative for implementation:

| Document | Role |
|----------|------|
| `audits/frontend/00-28` (V1 Audit) | Historical context, current state analysis |
| `transformation/00-28` | Strategic direction, problem analysis, priorities |
| `ux-blueprint/01-02` (principles, state guidelines) | Guiding principles (overridden by DS V2 for specifics) |
| `information-architecture/01-03` (analysis, options, comparison) | Historical analysis |
| `product-architecture/05-08` (journeys, goals, JTBD) | Product context |

These documents inform decisions but do not dictate implementation. When they conflict with Tier 2-4 documents, the higher tier wins.

---

## Cross-References

- See `01-ai-constitution.md` for constitutional rules
- See `03-document-reading-order.md` for mandatory reading sequence
- See `04-document-dependency-map.md` for document relationships
- See `31-cross-reference-validation-report.md` for validation results
