# 03 — Document Reading Order

> **Status:** FINAL — Mandatory reading sequence before any implementation

---

## 1. Purpose

Defines the **mandatory reading sequence** that must be completed before implementing any feature, screen, or component. Skipping any document in the sequence is a violation of the AI Constitution (Article I, §1.4).

---

## 2. Global Reading Order (All Implementers)

Every implementer must read these documents **once** before starting any implementation work:

### Phase 1: Foundation (Read First)
| Order | Document | Why |
|-------|----------|-----|
| 1 | `frontend-execution-governance/01-ai-constitution.md` | Constitutional rules |
| 2 | `frontend-execution-governance/02-source-of-truth.md` | Document authority |
| 3 | `product-architecture/01-core-product-model.md` | Understand the product |
| 4 | `product-architecture/02-core-product-entities.md` | Know all entities |
| 5 | `product-architecture/17-product-rules.md` | All 50 product rules (PR-01 to PR-50) |
| 6 | `product-architecture/14-frontend-responsibilities.md` | What frontend must do |
| 7 | `product-architecture/13-frontend-state-boundaries.md` | State ownership |

### Phase 2: Design System (Read Second)
| Order | Document | Why |
|-------|----------|-----|
| 8 | `design-system-v2/44-design-tokens.md` | All tokens |
| 9 | `design-system-v2/01-foundations.md` | Token explanations |
| 10 | `design-system-v2/11-component-taxonomy.md` | 4-layer taxonomy |
| 11 | `design-system-v2/09-interaction-states.md` | All interaction states |
| 12 | `design-system-v2/10-accessibility-rules.md` | WCAG 2.1 AA rules |
| 13 | `design-system-v2/38-responsive-rules.md` | Responsive rules |
| 14 | `design-system-v2/39-rtl-rules.md` | RTL rules |
| 15 | `design-system-v2/07-motion-system.md` | Motion tokens and inventory |

### Phase 3: Architecture & Navigation (Read Third)
| Order | Document | Why |
|-------|----------|-----|
| 16 | `information-architecture/04-final-ia-sitemap.md` | Full sitemap |
| 17 | `information-architecture/05-navigation-architecture.md` | Navigation structure |
| 18 | `information-architecture/06-page-catalog.md` | All pages |
| 19 | `information-architecture/08-naming-and-conventions.md` | Naming rules |
| 20 | `screen-specifications/01-global-layout-spec.md` | App shell layout |

### Phase 4: Governance (Read Fourth)
| Order | Document | Why |
|-------|----------|-----|
| 21 | `frontend-execution-governance/09-definition-of-ready.md` | Ready criteria |
| 22 | `frontend-execution-governance/10-definition-of-done.md` | Done criteria |
| 23 | `frontend-execution-governance/26-anti-patterns.md` | Forbidden patterns |
| 24 | `frontend-execution-governance/27-folder-ownership.md` | Folder rules |
| 25 | `frontend-execution-governance/28-file-ownership.md` | File rules |
| 26 | `frontend-execution-governance/29-naming-enforcement.md` | Naming rules |

---

## 3. Per-Screen Reading Order

Before implementing **any screen**, read these documents in order:

### Step 1: Screen Specification
| Order | Document |
|-------|----------|
| 1 | `screen-specifications/[relevant-screen-spec].md` |

### Step 2: UX Blueprint
| Order | Document |
|-------|----------|
| 2 | `ux-blueprint/[relevant-ux-blueprint].md` |

### Step 3: User Flow
| Order | Document |
|-------|----------|
| 3 | `user-flow-architecture/[relevant-flow].md` |

### Step 4: Design System Components
| Order | Document |
|-------|----------|
| 4 | `design-system-v2/[relevant-component-specs].md` (all components used on this screen) |
| 5 | `design-system-v2/18-empty-states.md` |
| 6 | `design-system-v2/19-loading-states.md` |
| 7 | `design-system-v2/20-error-states.md` |
| 8 | `design-system-v2/21-success-states.md` |

### Step 5: Compliance
| Order | Document |
|-------|----------|
| 9 | `frontend-execution-governance/16-screen-compliance-checklist.md` |
| 10 | `frontend-execution-governance/17-ux-compliance-checklist.md` |
| 11 | `frontend-execution-governance/18-accessibility-compliance.md` |
| 12 | `frontend-execution-governance/19-responsive-compliance.md` |

### Screen-Specific Reading Map

| Screen | Screen Spec | UX Blueprint | User Flow | Component Specs |
|--------|------------|-------------|-----------|-----------------|
| Login/Register | `02-auth-error-specs.md` | `06-auth-ux-blueprint.md` | `06-auth-flows.md` | `12`, `13`, `14`, `22` |
| Overview | `03-overview-spec.md` | `07-overview-ux-blueprint.md` | `17-onboarding-flows.md` | `15`, `25`, `28`, `30` |
| Screens List | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` | `15`, `25`, `26`, `27`, `32` |
| Screen Detail | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` | `15`, `22`, `25` |
| Pairing Wizard | `04-screens-specs.md` | `08-screens-ux-blueprint.md` | `08-screen-flows.md` | `12`, `25` |
| Content (Playlists) | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` | `15`, `25`, `26`, `27`, `33` |
| Content (Media) | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `09-media-flows.md` | `15`, `25`, `26`, `34` |
| Playlist Detail | `05-content-specs.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` | `15`, `22`, `33` |
| Studio | `06-studio-spec.md` | `09-content-studio-ux-blueprint.md` | `10-playlist-flows.md` | `31` |
| Scheduling | `07-scheduling-analytics-specs.md` | `10-scheduling-analytics-team-ux-blueprint.md` | `11-publishing-scheduling-flows.md` | `22`, `35` |
| Analytics | `07-scheduling-analytics-specs.md` | `10-scheduling-analytics-team-ux-blueprint.md` | `14-notification-analytics-flows.md` | `28`, `29` |
| Team | `08-team-spec.md` | `10-scheduling-analytics-team-ux-blueprint.md` | `12-team-flows.md` | `16`, `22`, `37` |
| Settings (Profile) | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `13-settings-flows.md` | `13`, `14`, `37` |
| Settings (Workspace) | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `07-workspace-flows.md` | `13`, `14`, `37` |
| Settings (Billing) | `09-settings-specs-part1.md` | `11-settings-ux-blueprint-part1.md` | `13-settings-flows.md` | `15`, `28`, `37` |
| Settings (Security) | `10-settings-specs-part2.md` | `12-settings-ux-blueprint-part2.md` | `13-settings-flows.md` | `13`, `14`, `22`, `37` |
| Settings (API Keys) | `10-settings-specs-part2.md` | `12-settings-ux-blueprint-part2.md` | `13-settings-flows.md` | `16`, `22`, `37` |
| Settings (Notifications) | `10-settings-specs-part2.md` | `13-settings-ux-blueprint-part3.md` | `13-settings-flows.md` | `13`, `37` |
| Notifications | `11-notifications-admin-specs-part1.md` | `14-notifications-ux-blueprint.md` | `14-notification-analytics-flows.md` | `17`, `25` |
| Admin (Customers) | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` | `15-admin-flows.md` | `16`, `26`, `27`, `36` |
| Admin (Staff) | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` | `15-admin-flows.md` | `16`, `36` |
| Admin (Users) | `11-notifications-admin-specs-part1.md` | `15-admin-ux-blueprint-part1.md` | `15-admin-flows.md` | `16`, `36` |
| Admin (Workspaces) | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` | `15-admin-flows.md` | `16`, `36` |
| Admin (Fleet) | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` | `15-admin-flows.md` | `16`, `28`, `36` |
| Admin (Health) | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` | `15-admin-flows.md` | `15`, `36` |
| Admin (Logs) | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` | `15-admin-flows.md` | `16`, `36` |
| Admin (Feature Flags) | `12-admin-specs-part2.md` | `16-admin-ux-blueprint-part2.md` | `15-admin-flows.md` | `13`, `36` |
| Shared Dialogs | `13-shared-dialogs-specs.md` | — | Various | `22` |

---

## 4. Per-Component Reading Order

Before implementing **any component**, read these documents in order:

| Order | Document | Why |
|-------|----------|-----|
| 1 | `design-system-v2/[component-spec].md` | Component specification |
| 2 | `design-system-v2/44-design-tokens.md` | Tokens used by component |
| 3 | `design-system-v2/09-interaction-states.md` | States to implement |
| 4 | `design-system-v2/10-accessibility-rules.md` | Accessibility requirements |
| 5 | `design-system-v2/07-motion-system.md` | Animation requirements |
| 6 | `design-system-v2/38-responsive-rules.md` | Responsive behavior |
| 7 | `design-system-v2/39-rtl-rules.md` | RTL behavior |
| 8 | `design-system-v2/42-variant-rules.md` | Variant rules |
| 9 | `design-system-v2/43-composition-rules.md` | Composition rules |
| 10 | `frontend-execution-governance/13-component-creation-rules.md` | Creation process |
| 11 | `frontend-execution-governance/15-design-system-enforcement.md` | Enforcement rules |

---

## 5. Reading Order Enforcement

### §5.1 Mandatory Reading
All documents in the reading order are **mandatory**. Skipping any document is a Constitution violation (Article I, §1.4).

### §5.2 Reading Verification
Before starting implementation, verify reading by checking:
- [ ] All global reading order documents read
- [ ] All per-screen reading order documents read (for current screen)
- [ ] All per-component reading order documents read (for current component)
- [ ] `09-definition-of-ready.md` criteria met

### §5.3 No Implementation Before Reading
No code may be written until the reading order is complete. If a document is missing, implementation MUST STOP and an ADR must be created.

---

## Cross-References

- See `01-ai-constitution.md` Article I for documentation supremacy
- See `02-source-of-truth.md` for document authority
- See `04-document-dependency-map.md` for document relationships
- See `09-definition-of-ready.md` for readiness criteria
- See `05-screen-traceability-map.md` for screen-to-document mapping
