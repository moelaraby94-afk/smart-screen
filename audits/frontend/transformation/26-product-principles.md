# Product Principles

> **Evidence basis:** All V1/V2 audit files, transformation documents 00–25
> **Purpose:** Define the permanent principles that govern all product decisions — these do not change between versions

---

## Principle Documentation Convention

Each principle is documented with:
- **Principle ID** — `PP-XX` format
- **Principle** — Name and one-line description
- **Description** — Full explanation
- **Why it exists** — The problem or value that motivated this principle
- **Evidence from audits** — Specific audit findings that support this principle
- **Where it applies** — Which parts of the product, screens, or flows
- **Exceptions** — When this principle may be overridden and why
- **Related decisions** — Design decision IDs from `24-design-decisions.md`
- **Related constraints** — Constraint IDs from `25-design-constraints.md`

---

## PP-01: Internationalization First

| Field | Value |
|-------|-------|
| **Principle** | Every user-facing string must be internationalized from the moment it is written. No hardcoded text. No English-only or Arabic-only features. |
| **Description** | Internationalization is not a feature to be added later — it is a foundational requirement. Every string, every date format, every number format, and every layout must work in both EN and AR from the start. RTL is not a "mode" — it is a first-class layout direction. |
| **Why it exists** | The target market is Saudi Arabia / GCC, where Arabic (RTL) is the primary language for many users. Hardcoded strings and LTR-only layouts create bugs that are expensive to fix retroactively. |
| **Evidence** | P-001 (Switch RTL bug — physical property used instead of logical); `22-i18n-and-localization.md` §22.8 (RTL implementation details); I-001 (no pluralization), I-002 (no Eastern Arabic numerals) |
| **Where it applies** | All components, all pages, all user-facing text, all layout decisions, all icon directional choices |
| **Exceptions** | None. Internationalization is never optional. |
| **Related decisions** | DD-18 (next-intl), DD-10 (Switch RTL fix) |
| **Related constraints** | BC-01 (bilingual), LC-01 (next-intl), LC-02 (URL-based locale), RTC-01 (logical properties), RTC-02 (icon flipping), RTC-03 (RTL testing) |

---

## PP-02: Accessibility by Default

| Field | Value |
|-------|-------|
| **Principle** | Accessibility is not a separate phase or a checklist item — it is built into every component from the start. WCAG 2.1 AA is the minimum standard. |
| **Description** | Every interactive element must be keyboard accessible, have an accessible name, meet contrast requirements, and have adequate touch target size. Accessibility is verified during development, not during a separate audit. |
| **Why it exists** | The V2 audit found multiple accessibility gaps (P-005 InfoTooltip, A-002 touch targets, A-004 contrast) that were introduced because accessibility was not considered during initial development. |
| **Evidence** | `24-accessibility-audit.md` §24.7; P-005 (InfoTooltip missing ARIA); A-002 (touch targets < 44px); A-004 (contrast failures) |
| **Where it applies** | All components, all pages, all interactive elements |
| **Exceptions** | None. WCAG 2.1 AA is the minimum for all user-facing elements. Internal admin tools follow the same standard. |
| **Related decisions** | DD-05 (Radix Tooltip), DD-14 (Radix First), DD-22 (WCAG 2.1 AA) |
| **Related constraints** | ACC-01 (WCAG AA), ACC-02 (keyboard nav), ACC-03 (screen reader), MSC-02 (44px touch targets) |

---

## PP-03: Consistency First

| Field | Value |
|-------|-------|
| **Principle** | Consistency across the product is more important than local optimization. When two screens solve the same problem differently, the product feels broken. |
| **Description** | Loading states, error states, empty states, button variants, icon usage, spacing, typography, and interaction patterns must be consistent across all features. A user who learns a pattern on one screen should expect the same pattern on every screen. |
| **Why it exists** | The V2 audit found three different loading patterns, three different icon stroke widths, duplicate icons, and inconsistent responsive grids. Each inconsistency was a local decision that seemed reasonable in isolation but created a fragmented product. |
| **Evidence** | TD-001 (inconsistent loading), TD-002 (inconsistent stroke width), TD-003 (icon duplication), C-004 (inconsistent responsive grids); `26-consistency-audit.md` §26.6 |
| **Where it applies** | All components, all pages, all features |
| **Exceptions** | Admin panel may use different table density (admin tables are data-heavy). Otherwise, no exceptions. |
| **Related decisions** | DD-06 (loading standardization), DD-09 (icon stroke), DD-25 (CVA for variants) |
| **Related constraints** | TC-05 (Radix primitives), MSC-01 (breakpoints) |

---

## PP-04: Recognition Over Recall

| Field | Value |
|-------|-------|
| **Principle** | Users should not need to remember how to do something — the interface should make options and actions visible. |
| **Description** | Navigation items are always visible (sidebar). Current workspace is always shown (switcher). Page titles are always displayed (header). Breadcrumbs show hierarchy. Empty states suggest next actions. Quick actions are visible on the dashboard. |
| **Why it exists** | Nielsen's H6 heuristic (Recognition Rather Than Recall) scored 2.2/4 in the usability breakdown. Form state is lost on navigation, search history is absent, and notification context is limited. |
| **Evidence** | `12-usability-breakdown.md` H6 (score: 2.2/4); `27-user-flows.md` §27.9 (no form state persistence); `21-search-and-global-actions.md` §21.3 (no search history) |
| **Where it applies** | Navigation, dashboard, forms, search, notifications |
| **Exceptions** | Keyboard shortcuts (Ctrl+K) are recall-based by nature — acceptable as power-user accelerators, not as primary interaction methods. |
| **Related decisions** | DD-01 (sidebar grouping — visible categories), DD-11 (mobile switcher — visible workspace) |
| **Related constraints** | None |

---

## PP-05: Progressive Disclosure

| Field | Value |
|-------|-------|
| **Principle** | Show essential information first. Reveal complexity only when the user needs it or asks for it. |
| **Description** | Forms should show required fields first, with advanced options collapsed or in a "More options" section. Dialogs should show the minimum needed to complete the task. Settings should be organized by frequency of use, not by alphabetical order. |
| **Why it exists** | The schedule creation form presents all fields at once (name, playlist, screens, start/end date, recurrence, time slots) — high cognitive load for a common task. The onboarding wizard has no skip option — forcing all users through all steps. |
| **Evidence** | `11-cognitive-load-analysis.md` §2.5 (schedule form: HIGH extraneous load); `06-user-journey-analysis.md` Journey 5 (schedule form complexity); `27-user-flows.md` §27.9 (no onboarding skip) |
| **Where it applies** | Forms, dialogs, settings, onboarding, any feature with configurable complexity |
| **Exceptions** | None. Progressive disclosure is always preferred over showing all options at once. |
| **Related decisions** | None directly — this principle guides future implementation |
| **Related constraints** | None |

---

## PP-06: Clarity Over Density

| Field | Value |
|-------|-------|
| **Principle** | A clear interface with fewer elements is better than a dense interface with more elements. White space is not wasted space — it is cognitive breathing room. |
| **Description** | Dashboards should not cram all metrics into one screen. Sidebars should group items rather than listing 18 at once. Forms should not show all fields simultaneously. Tables should not show all columns by default. |
| **Why it exists** | The current sidebar has 18 flat items. The dashboard has 5+ widgets with no information hierarchy. The schedule form has 8+ fields with no progressive disclosure. These create high cognitive load. |
| **Evidence** | `11-cognitive-load-analysis.md` §2.1 (sidebar: HIGH), §2.2 (dashboard: MEDIUM); `08-dashboard-and-overview.md` §8.17 (5+ widgets, no hierarchy) |
| **Where it applies** | All screens, especially dashboards, sidebars, forms, and tables |
| **Exceptions** | Admin tables may be denser (data-heavy operations). But even admin tables should use column hiding and default to essential columns. |
| **Related decisions** | DD-01 (sidebar grouping), DD-06 (loading standardization — skeletons show structure without density) |
| **Related constraints** | None |

---

## PP-07: Safe Destructive Actions

| Field | Value |
|-------|-------|
| **Principle** | Destructive actions (delete, remove, disable, unpublish) must require explicit confirmation. Confirmations must clearly state what will be lost. |
| **Description** | All destructive actions use `AlertDialog` with a clear warning message. The confirm button uses `destructive` variant (red). The action name includes what is being destroyed ("Delete Screen", not just "Delete"). |
| **Why it exists** | Nielsen's H5 (Error Prevention) scored 1.3/4 — the lowest heuristic score. Destructive actions without confirmation lead to data loss and support tickets. |
| **Evidence** | `12-usability-breakdown.md` H5 (score: 1.3/4); `08-dashboard-and-overview.md` §8.17 (AlertDialog for emergency broadcast); `14-settings-feature.md` §14.8 (Danger Zone for workspace deletion) |
| **Where it applies** | All delete, remove, disable, unpublish, and emergency actions |
| **Exceptions** | None. All destructive actions require confirmation. |
| **Related decisions** | None directly — this principle is already partially implemented (AlertDialog exists) |
| **Related constraints** | SC-01 (HTTP-only cookies), SC-03 (server-side authorization) |

---

## PP-08: One Primary Action Per Screen

| Field | Value |
|-------|-------|
| **Principle** | Each screen should have one clearly primary action. Secondary actions should be visually subordinate. Tertiary actions should be in menus or collapsed. |
| **Description** | The primary action is the most common or most important action on a screen. It uses the `default` button variant (solid background). Secondary actions use `outline` or `secondary` variants. Tertiary actions are in dropdown menus or "More" buttons. |
| **Why it exists** | When all actions look the same, users must read and compare them all to decide. A clear primary action reduces decision time and cognitive load. |
| **Evidence** | `02-design-system-and-tokens.md` §2.6 (button variant system exists but not always applied with hierarchy); `08-dashboard-and-overview.md` §8.17 (quick actions all look the same) |
| **Where it applies** | All screens with actions — especially list pages, detail pages, and dashboards |
| **Exceptions** | Settings tabs — each tab may have its own primary action (save). Admin tables — bulk actions may share primary status when multiple are selected. |
| **Related decisions** | DD-25 (CVA for variants — ensures button hierarchy is consistent) |
| **Related constraints** | None |

---

## PP-09: Reduce Cognitive Load

| Field | Value |
|-------|-------|
| **Principle** | Every design decision should reduce, not increase, the cognitive load on the user. If a change adds complexity, it must provide proportional value. |
| **Description** | Group navigation items (Miller's 7±2). Use progressive disclosure. Show summaries before details. Provide search for large lists. Use familiar patterns. Avoid jargon. |
| **Why it exists** | The cognitive load analysis found HIGH extraneous load on the sidebar (18 items), screen list (no search), schedule form (all fields at once), and Studio (no templates). These are all reducible. |
| **Evidence** | `11-cognitive-load-analysis.md` (overall assessment); `10-mental-model-analysis.md` (mental model alignment score: 3/5) |
| **Where it applies** | All screens, all flows, all navigation |
| **Exceptions** | Studio canvas editor — intrinsic cognitive load is high by nature (canvas editing requires spatial reasoning). Extraneous load should still be minimized (templates, alignment guides). |
| **Related decisions** | DD-01 (sidebar grouping), DD-06 (loading standardization) |
| **Related constraints** | None |

---

## PP-10: Performance Matters

| Field | Value |
|-------|-------|
| **Principle** | Performance is a feature. A fast interface is a better interface. No user should wait more than 2 seconds for a page to become interactive. |
| **Description** | Use server components for initial render. Use SWR for caching and deduplication. Use skeleton loading to show progress. Lazy-load heavy components (Studio). Optimize images. Monitor bundle size. |
| **Why it exists** | Perceived performance directly affects user satisfaction. Inconsistent loading states (TD-001) make the product feel slower than it is. |
| **Evidence** | TD-001 (inconsistent loading); `21-success-metrics.md` §7.3 (Lighthouse targets); `16-state-strategy.md` §2.1 (SWR config) |
| **Where it applies** | All pages, all data fetching, all component rendering |
| **Exceptions** | Studio canvas editor — loading Konva and canvas data may take > 2s. Show a loading skeleton or progress indicator. |
| **Related decisions** | DD-06 (loading standardization), DD-16 (SWR), DD-17 (Tailwind — no CSS-in-JS runtime) |
| **Related constraints** | PC-01 (Lighthouse ≥ 90), PC-02 (LCP < 2.5s), PC-03 (CLS < 0.1), PC-04 (SWR revalidation) |

---

## PP-11: Keyboard Friendly

| Field | Value |
|-------|-------|
| **Principle** | All critical workflows must be completable via keyboard. Keyboard shortcuts should be provided for power users. |
| **Description** | Tab order follows visual order. Enter activates the primary action. Escape closes dialogs and menus. Ctrl+K opens global search. Arrow keys navigate lists and tabs. |
| **Why it exists** | Keyboard navigation is an accessibility requirement (WCAG 2.1.1) and a power-user expectation. The current product has Ctrl+K for search but no other documented shortcuts. |
| **Evidence** | `24-accessibility-audit.md` §24.7 (keyboard navigation: ✅ Good); `21-search-and-global-actions.md` §21.3 (Ctrl+K exists); `12-usability-breakdown.md` H7 (flexibility: 1.4/4 — limited shortcuts) |
| **Where it applies** | All interactive elements, all dialogs, all menus, all forms |
| **Exceptions** | Studio canvas editor — canvas interactions are inherently mouse-based. Keyboard should work for panel navigation and timeline, but canvas element manipulation may require mouse. |
| **Related decisions** | DD-14 (Radix First — Radix handles keyboard nav) |
| **Related constraints** | ACC-02 (keyboard navigation) |

---

## PP-12: Enterprise Capable

| Field | Value |
|-------|-------|
| **Principle** | The product must be capable of serving enterprise customers. Enterprise features (SSO, RBAC, audit, bulk operations) are not optional — they are on the roadmap and must be designed for. |
| **Description** | Even if the current customer base is SMB, all design and architecture decisions must not preclude enterprise features. Data models must support multi-tenant at scale. UI must support bulk operations. Auth must support SSO integration. |
| **Why it exists** | The enterprise readiness score is 2/100. The product needs enterprise features to expand beyond SMB. Designing without enterprise in mind creates rework. |
| **Evidence** | `13-enterprise-saas-review.md` (score: 2/100); E-001 through E-006 (enterprise gaps) |
| **Where it applies** | Architecture, data models, auth, admin panel, team management, billing |
| **Exceptions** | None. Enterprise capability is always a design consideration, even if implementation is phased. |
| **Related decisions** | DD-19 (enterprise features require backend first), DD-23 (SSO with password fallback) |
| **Related constraints** | BC-03 (multi-tenant), EC-01 (SSO keeps password), EC-02 (audit not bypassable), EC-03 (RBAC server-side), SCL-01 (scalability) |

---

## PP-13: Evidence-Based Design

| Field | Value |
|-------|-------|
| **Principle** | All design and UX decisions must be backed by audit findings, source code evidence, or user research. No generic UX advice. No "best practices" without context. |
| **Description** | Every problem identified in the transformation must reference specific audit files and source code. Every design decision must cite the evidence that motivated it. Every success metric must be measurable. |
| **Why it exists** | The transformation was explicitly required to be evidence-based. Generic recommendations without context lead to inappropriate solutions. |
| **Evidence** | User directive: "Every statement should be backed by previous audits or source code." |
| **Where it applies** | All documentation, all design decisions, all problem definitions |
| **Exceptions** | None. All claims must be traceable to evidence. |
| **Related decisions** | All DD-01 through DD-25 (each includes evidence field) |
| **Related constraints** | None |

---

## PP-14: Safe to Evolve

| Field | Value |
|-------|-------|
| **Principle** | The product must be safe to evolve. Changes should not break existing user workflows without migration paths. Features should be additive, not destructive. |
| **Description** | Navigation changes use phased rollout (DD-20). SSO keeps password fallback (DD-23). Studio is not refactored during transformation (DD-15). New components are additive, not replacements for existing ones without migration. |
| **Why it exists** | Breaking changes erode user trust and increase support load. The sidebar restructuring (R-01) and SSO integration (R-08) are high-risk changes that require migration paths. |
| **Evidence** | `17-risk-analysis.md` R-01 (sidebar habits), R-08 (SSO auth flow), R-11 (Studio refactoring) |
| **Where it applies** | All changes to existing features, all navigation changes, all auth changes |
| **Exceptions** | Bug fixes (P-001, P-003, P-004) are not "breaking changes" — they fix already-broken behavior. |
| **Related decisions** | DD-15 (no Studio refactor), DD-20 (phased sidebar), DD-23 (SSO fallback) |
| **Related constraints** | None |

---

## Principle Summary

| ID | Principle | Category | Priority |
|----|-----------|----------|----------|
| PP-01 | Internationalization First | Foundation | Critical |
| PP-02 | Accessibility by Default | Foundation | Critical |
| PP-03 | Consistency First | Foundation | High |
| PP-04 | Recognition Over Recall | UX | High |
| PP-05 | Progressive Disclosure | UX | High |
| PP-06 | Clarity Over Density | UX | High |
| PP-07 | Safe Destructive Actions | UX | Critical |
| PP-08 | One Primary Action Per Screen | UX | Medium |
| PP-09 | Reduce Cognitive Load | UX | High |
| PP-10 | Performance Matters | Engineering | High |
| PP-11 | Keyboard Friendly | UX/Accessibility | Medium |
| PP-12 | Enterprise Capable | Product | High |
| PP-13 | Evidence-Based Design | Process | Critical |
| PP-14 | Safe to Evolve | Process | High |

---

## Principle Conflict Resolution

When principles conflict, the following priority order applies:

1. **PP-01 (i18n)** and **PP-02 (Accessibility)** — never sacrificed
2. **PP-07 (Safe Destructive Actions)** — never sacrificed for UX convenience
3. **PP-13 (Evidence-Based)** — never sacrificed for opinions
4. **PP-14 (Safe to Evolve)** — high priority, but may be overridden by critical bug fixes
5. **PP-03 (Consistency)** — high priority, but may be temporarily violated during phased rollouts
6. **PP-09 (Cognitive Load)** and **PP-06 (Clarity)** — guide design, may be balanced against each other
7. **PP-04 (Recognition)** and **PP-05 (Progressive Disclosure)** — guide design, may be balanced against each other
8. **PP-08 (One Primary Action)** — medium priority, context-dependent
9. **PP-10 (Performance)** — high priority, but may be balanced against feature complexity
10. **PP-11 (Keyboard)** — medium priority, exceptions for canvas-based interactions
11. **PP-12 (Enterprise)** — high priority for architecture, phased for implementation

---

## Cross-References

- See `24-design-decisions.md` for decisions guided by these principles
- See `25-design-constraints.md` for constraints that bound these principles
- See `12-usability-breakdown.md` for heuristic scores that motivated these principles
- See `11-cognitive-load-analysis.md` for cognitive load analysis
- See `21-success-metrics.md` for metrics that measure adherence to these principles
