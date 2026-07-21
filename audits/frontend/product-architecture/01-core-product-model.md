# Core Product Model

> **Evidence basis:** `01-current-product-model.md` (transformation), `28-feature-inventory.md` (audit), `27-user-flows.md` (audit), source code in `apps/dashboard/src/`
> **Purpose:** Define what Smart Screen IS as a product — its identity, value proposition, market, and operating model

---

## 1. Product Identity

Smart Screen is a **multi-tenant digital signage management platform** that enables organizations to connect, manage, and schedule content on physical display screens with minimal effort.

### 1.1 Product Definition

| Attribute | Value | Evidence |
|-----------|-------|----------|
| **Category** | Digital signage SaaS | `01-current-product-model.md` §1 |
| **Primary market** | Enterprise Restaurants | **Locked product decision** |
| **Geographic focus** | Saudi Arabia / GCC region | `01-current-product-model.md` §1.1 |
| **Deployment** | SaaS with Docker-based hosting | `01-architecture-and-stack.md` §1.1 |
| **Tenant model** | Organization → Workspace → Branches → Screens | `01-current-product-model.md` §3 |
| **Languages** | English (LTR) + Arabic (RTL) | `22-i18n-and-localization.md` §22.7 |
| **Differentiator** | Islamic features (prayer times, Hijri calendar, Ramadan mode) + bilingual support | `19-islamic-features.md` |

### 1.2 Core Value Proposition

> **"Allow a customer to connect and manage digital screens with the least effort and in the shortest possible time."**

This value proposition defines every architectural decision. The product is not a feature-rich signage platform — it is a **fast-to-value** signage platform. Every additional feature, navigation item, or configuration option must be justified against this value proposition.

### 1.3 Primary UX KPI

> **A new customer should be able to publish content to the first screen in under 5 minutes.**

This KPI is the north star for the frontend architecture. It means:

- Onboarding must be minimal (not comprehensive)
- Screen pairing must be a guided wizard (not a settings page)
- Content creation must offer templates and quick-start paths (not blank-canvas Studio)
- Publishing must be a one-click action from the content view (not a multi-step schedule)
- Scheduling must be optional (not required for first publish)

**Evidence:** The current onboarding wizard (`07-workspace-management.md` §7.11) has steps for seeding demo content or starting fresh. The current screen pairing flow (`09-screens-feature.md` §9.8) uses a setup modal. Neither is optimized for the 5-minute target.

---

## 2. Product Philosophy

### 2.1 Evolution, Not Revolution

The product architecture is built on **improving the existing experience**, not replacing it. This means:

- The existing `CrystalShell` layout (sidebar + header + content) is preserved
- The existing route structure (`/{locale}/...`) is preserved
- The existing component library (Radix UI + Tailwind CSS) is preserved
- The existing state management (SWR + React Context) is preserved
- Changes are additive and incremental, not destructive

**Evidence:** `24-design-decisions.md` DD-15 (no Studio refactoring), DD-20 (phased sidebar rollout), DD-23 (SSO keeps password fallback). The transformation roadmap (`19-redesign-roadmap.md`) is phased over 10 implementation phases, not a big-bang rewrite.

### 2.2 Complexity Reduction

The architecture actively reduces complexity:

- **Navigation:** 18 flat items → 7 grouped sections (locked decision)
- **Cognitive load:** Progressive disclosure, one primary action per screen
- **Configuration:** Sensible defaults over explicit configuration
- **Workflows:** Shortest path to goal, not most configurable path

**Evidence:** `11-cognitive-load-analysis.md` §2.1 (sidebar: HIGH extraneous load); `26-product-principles.md` PP-06 (Clarity Over Density), PP-09 (Reduce Cognitive Load).

---

## 3. Operating Model

### 3.1 How Customers Use the Product

```
1. Sign up → Create workspace (or accept invite)
2. Connect first screen (pairing wizard)
3. Create or select content (playlist from template or media upload)
4. Publish content to screen (immediate or scheduled)
5. Monitor screen health (overview dashboard)
6. Iterate: add screens, create more content, schedule campaigns
```

### 3.2 How the Product Makes Money

The product operates on a SaaS subscription model with workspace-level billing. The frontend architecture must support:

- Plan selection and upgrade (currently missing — `14-settings-feature.md` §14.8)
- Invoice download (currently missing)
- Storage usage indicators (partially implemented — `11-media-library.md` §11.8)
- Screen count limits per plan (backend-enforced, frontend must display)

**Note:** Billing implementation is a backend concern. The frontend architecture defines where billing UI lives (Settings module) and what state it needs (workspace plan, usage, limits). Backend API design is out of scope.

### 3.3 How the Product Scales

| Dimension | Current | Target | Evidence |
|-----------|---------|--------|----------|
| Workspaces per user | ~20 (dropdown limit) | 100+ (search + virtualization) | E-006, `25-design-constraints.md` SCL-01 |
| Screens per workspace | ~50 (card grid) | 200+ (search + filter + pagination) | E-004, `25-design-constraints.md` SCL-02 |
| Team members | No limit shown | Role-based access control | E-003, `13-enterprise-saas-review.md` |
| Notifications | 50 in-memory cap | 50 in-memory + persisted history | `17-notifications.md` §17.7, SCL-03 |

---

## 4. Product Identity Preservation

The architecture preserves the existing product identity:

| Element | Current | Architecture Decision | Evidence |
|---------|---------|----------------------|----------|
| Layout shell | CrystalShell (sidebar + header) | Preserve | `04-layout-and-shell.md` §4.1 |
| Design system | ORCA tokens | Preserve and standardize | `14-design-system-direction.md` |
| Component library | Radix UI + Tailwind CSS | Preserve | `15-component-strategy.md` §2.1 |
| i18n | next-intl with URL locale | Preserve | `22-i18n-and-localization.md` |
| Realtime | Socket.IO | Preserve with polling fallback | DD-07 |
| Data fetching | SWR | Preserve | DD-16 |
| Canvas editor | Konva | Preserve (no refactor) | DD-15 |
| Theming | next-themes (dark/light) | Preserve | `01-architecture-and-stack.md` §1.7 |

---

## 5. Market Context

### 5.1 Enterprise Restaurant Use Case

The locked product decision targets **enterprise restaurants**. This means:

| Need | Architecture Implication |
|------|--------------------------|
| Multiple locations (branches) | Branch entity is first-class, but optional in navigation |
| Menu boards / promotional screens | Playlist templates for common restaurant layouts |
| Time-sensitive promotions | Scheduling with start/end dates and expiry |
| Prayer time interruptions (GCC) | Islamic features integrated, not separate |
| Centralized management | Workspace owner manages all branches from one workspace |
| Brand consistency | Branding provider for logo/colors per workspace |
| Quick content updates | Media upload from both library and playlist editor |
| Staff turnover | Simple role model (Owner, Editor, Viewer) with clear permissions |

### 5.2 Competitive Position

The product competes with global digital signage platforms. The architecture must not replicate their complexity — it must win on **speed to value** and **regional relevance**.

**Evidence:** `01-current-product-model.md` §1.2 (competitive landscape); `28-feature-inventory.md` §28.6 (14 competitive feature gaps identified).

---

## Cross-References

- See `02-core-product-entities.md` for entity definitions
- See `03-entity-relationships.md` for entity relationships
- See `04-product-hierarchy.md` for product hierarchy
- See `05-primary-user-journey.md` for the 5-minute journey
- See `17-product-rules.md` for product rules derived from this model
- See `18-product-constraints.md` for constraints derived from this model
- See `transformation/01-current-product-model.md` for the detailed current-state analysis
- See `transformation/26-product-principles.md` for permanent product principles
