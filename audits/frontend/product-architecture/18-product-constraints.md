# Product Constraints

> **Evidence basis:** `25-design-constraints.md` (transformation), locked product decisions, all product architecture documents
> **Purpose:** Define the architectural constraints that bound the frontend product — what MUST NOT change, what MUST be preserved

---

## 1. Constraint Categories

| Category | Count | Description |
|----------|-------|-------------|
| Locked Decision Constraints | 8 | Constraints from locked product decisions |
| Technical Stack Constraints | 6 | Constraints from existing technology choices |
| Architecture Constraints | 4 | Constraints from existing architecture |
| Entity Constraints | 4 | Constraints from entity model |
| Navigation Constraints | 3 | Constraints from navigation model |
| Performance Constraints | 3 | Constraints from performance requirements |
| Scalability Constraints | 3 | Constraints from scale requirements |
| Security Constraints | 3 | Constraints from security requirements |

---

## 2. Locked Decision Constraints

### PC-01: Primary Market is Enterprise Restaurants
**Constraint:** The product is designed for enterprise restaurants. All UX and feature decisions must serve this market.
**Must never be broken:** Do not pivot to general-purpose signage without an explicit product decision.
**Evidence:** Locked product decision.

### PC-02: 5-Minute Time-to-First-Screen
**Constraint:** A new customer must be able to publish content to their first screen in under 5 minutes.
**Must never be broken:** Do not add required steps to the primary journey that extend it beyond 5 minutes.
**Evidence:** Locked product decision (Primary UX KPI).

### PC-03: Evolution, Not Revolution
**Constraint:** The product improves the existing experience. No big-bang rewrites.
**Must never be broken:** Do not replace the core stack (Next.js, React, Tailwind, Radix, SWR, Socket.IO, Konva) without an explicit product decision.
**Evidence:** Locked product decision (Product Philosophy).

### PC-04: Seven Sidebar Items Maximum
**Constraint:** The sidebar has exactly 7 first-level navigation items.
**Must never be broken:** Do not add an 8th item. New features must find a home within existing sections.
**Evidence:** Locked product decision (Sidebar).

### PC-05: Scheduling is Optional
**Constraint:** Users may publish immediately without creating a schedule.
**Must never be broken:** Do not require schedule creation as a prerequisite for publishing.
**Evidence:** Locked product decision (Scheduling).

### PC-06: Screen Pairing Uses a Wizard
**Constraint:** Screen onboarding uses a guided wizard with 2-3 steps.
**Must never be broken:** Do not replace the wizard with a settings page or unguided modal.
**Evidence:** Locked product decision (Screen Pairing).

### PC-07: Media Upload from Both Library and Studio
**Constraint:** Media upload is available from both the Media Library and the Playlist Studio.
**Must never be broken:** Do not remove upload capability from either location.
**Evidence:** Locked product decision (Media).

### PC-08: Dashboard is Overview, Not Analytics
**Constraint:** The dashboard (Overview) shows system status, quick actions, recent activity, and screen health. It is not analytics-heavy.
**Must never be broken:** Do not add detailed analytics charts to the Overview. Analytics live in the Analytics section.
**Evidence:** Locked product decision (Dashboard).

---

## 3. Technical Stack Constraints

### PC-09: Next.js App Router
**Constraint:** The application uses Next.js App Router with server and client components.
**Must never be broken:** No migration to Pages Router. No introduction of a competing framework.
**Evidence:** `25-design-constraints.md` TC-01.

### PC-10: SWR for Server State
**Constraint:** All server data fetching uses SWR. No direct `fetch` calls in components.
**Must never be broken:** Do not introduce React Query, Apollo, or other data fetching libraries.
**Evidence:** `25-design-constraints.md` TC-04.

### PC-11: Radix UI for Interactive Components
**Constraint:** All interactive UI components are built on Radix UI primitives.
**Must never be broken:** Do not introduce custom interactive components when a Radix primitive exists.
**Evidence:** `25-design-constraints.md` TC-05.

### PC-12: Tailwind CSS with Logical Properties
**Constraint:** Styling uses Tailwind CSS with logical properties for RTL support.
**Must never be broken:** Do not use physical CSS properties (`left`, `right`, `ml`, `mr`) for directional layout.
**Evidence:** `25-design-constraints.md` RTC-01.

### PC-13: Socket.IO for Realtime
**Constraint:** Realtime communication uses Socket.IO with polling fallback.
**Must never be broken:** Do not replace Socket.IO. Do not add a second realtime library.
**Evidence:** `25-design-constraints.md` BCN-04.

### PC-14: Konva for Canvas Editor
**Constraint:** Studio uses Konva for canvas rendering.
**Must never be broken:** Do not replace Konva without an explicit architecture decision.
**Evidence:** `25-design-constraints.md` TC-03; DD-15.

---

## 4. Architecture Constraints

### PC-15: Monorepo with npm Workspaces
**Constraint:** The project is a monorepo with npm workspaces (`apps/*`, `packages/*`).
**Must never be broken:** Do not split into separate repos. Do not add Turborepo/Nx without approval.
**Evidence:** `25-design-constraints.md` AC-01.

### PC-16: Server Components by Default
**Constraint:** Components are server components by default. `'use client'` only when interactivity is required.
**Must never be broken:** Do not add `'use client'` to components that don't need interactivity.
**Evidence:** `25-design-constraints.md` AC-02.

### PC-17: Provider Composition Order
**Constraint:** Provider order: ThemeProvider → LocaleProvider → WorkspaceProvider → NotificationProvider → BrandingProvider.
**Must never be broken:** Do not change provider order. Dependencies between providers are directional.
**Evidence:** `25-design-constraints.md` AC-03.

### PC-18: No Secrets in Frontend Code
**Constraint:** No API keys, passwords, or secrets in frontend code. Only `NEXT_PUBLIC_` prefixed values.
**Must never be broken:** Do not hardcode secrets. Do not expose sensitive values.
**Evidence:** `25-design-constraints.md` SC-04.

---

## 5. Entity Constraints

### PC-19: Workspace is the Tenant Boundary
**Constraint:** All API calls are scoped to the active workspace ID via `cs_workspace_id` cookie.
**Must never be broken:** Do not make unscoped API calls. Do not display data from another workspace.
**Evidence:** `07-workspace-management.md` §7.11.

### PC-20: Screens Can Exist Without Branches
**Constraint:** Screens can be assigned directly to a workspace without a branch.
**Must never be broken:** Do not require branch assignment as a prerequisite for screen creation.
**Evidence:** `13-branches-feature.md` §13.13; DD-03.

### PC-21: Media Can Be Reused Across Playlists
**Constraint:** Media items belong to the workspace and can be used in multiple playlists.
**Must never be broken:** Do not copy media per playlist. Do not prevent media reuse.
**Evidence:** `11-media-library.md` §11.8.

### PC-22: Three Default Roles
**Constraint:** The product has three default roles: Owner, Editor, Viewer.
**Must never be broken:** Do not add a fourth default role without an explicit product decision. Custom roles are a future enterprise feature.
**Evidence:** `16-team-feature.md` §16.4.

---

## 6. Navigation Constraints

### PC-23: Maximum Navigation Depth is 3
**Constraint:** No navigation path exceeds 3 levels (first-level → second-level → detail).
**Must never be broken:** Do not create 4th-level pages. If a feature needs 4 levels, restructure the hierarchy.
**Evidence:** `04-product-hierarchy.md` §2.3.

### PC-24: No Top-Level Branch Navigation
**Constraint:** Branches are not a top-level navigation item.
**Must never be broken:** Do not add "Branches" to the sidebar. Branches are a filter within Screens.
**Evidence:** DD-03; locked sidebar decision.

### PC-25: Admin Mode is Separate
**Constraint:** Admin navigation is separate from client navigation. Super-admins are restricted from client routes.
**Must never be broken:** Do not merge admin and client navigation. Do not allow super-admins to access client routes without impersonation.
**Evidence:** `04-layout-and-shell.md` §4.6.

---

## 7. Performance Constraints

### PC-26: No Blocking API Calls on Page Load
**Constraint:** Pages must not block rendering waiting for API calls. Use SWR with skeleton loading.
**Must never be broken:** Do not use `await` in server components for non-critical data. Use streaming and suspense.
**Evidence:** `25-design-constraints.md` PC-01.

### PC-27: Bundle Size < 500KB per Route
**Constraint:** Each route's JavaScript bundle must be under 500KB (gzipped).
**Must never be broken:** Do not add dependencies that push a route over 500KB. Use dynamic imports for large components.
**Evidence:** `25-design-constraints.md` PC-01.

### PC-28: No revalidateOnFocus Globally
**Constraint:** SWR global config disables `revalidateOnFocus`. Per-hook opt-in is allowed for Overview data.
**Must never be broken:** Do not enable `revalidateOnFocus` globally. It causes excessive API calls.
**Evidence:** `25-design-constraints.md` PC-04.

---

## 8. Scalability Constraints

### PC-29: Workspace Switcher Scales to 100+
**Constraint:** The workspace switcher must remain usable with 100+ workspaces via search.
**Must never be broken:** Do not remove search from the switcher once implemented. Do not render all workspaces without virtualization.
**Evidence:** `25-design-constraints.md` SCL-01.

### PC-30: Screen List Scales to 200+
**Constraint:** The screen list must remain usable with 200+ screens via search, filter, and pagination.
**Must never be broken:** Do not remove search, filter, or pagination. Do not render all screens without virtualization.
**Evidence:** `25-design-constraints.md` SCL-02.

### PC-31: Notifications Capped at 50
**Constraint:** In-memory notifications are capped at 50 (`MAX_NOTIFICATIONS`).
**Must never be broken:** Do not remove the cap. Do not store all notifications in React state. Use pagination for history.
**Evidence:** `25-design-constraints.md` SCL-03.

---

## 9. Security Constraints

### PC-32: RBAC Enforced Server-Side
**Constraint:** Role-based access control is enforced by the backend. Frontend only gates UI visibility.
**Must never be broken:** Do not rely on frontend-only authorization. Frontend role checks are UX, not security.
**Evidence:** `25-design-constraints.md` EC-03.

### PC-33: Audit Log is Not Bypassable
**Constraint:** Audit logging is backend-enforced. Frontend cannot bypass it.
**Must never be broken:** Do not implement frontend-only audit logging. Do not provide UI that bypasses backend audit.
**Evidence:** `25-design-constraints.md` EC-02.

### PC-34: SSO Keeps Password Fallback
**Constraint:** SSO (when implemented) does not replace password login. Both are available.
**Must never be broken:** Do not remove password login when SSO is added.
**Evidence:** `25-design-constraints.md` EC-01; DD-23.

---

## Cross-References

- See `17-product-rules.md` for product rules
- See `19-scalability-considerations.md` for scalability details
- See `20-future-extensibility.md` for extensibility
- See `transformation/25-design-constraints.md` for the full constraint document
- See `transformation/24-design-decisions.md` for design decisions
