# 01 — AI Constitution

> **Status:** PERMANENT — May not be modified without explicit user approval
> **Authority:** Highest governance authority. All implementation decisions must comply.

---

## Preamble

This constitution defines the permanent rules that govern all AI-assisted frontend implementation for the Smart Screen platform. These rules are **absolute and non-negotiable**. Any violation must be documented as an ADR (see `24-adr-process.md`) and approved before proceeding.

---

## Article I: Documentation Supremacy

### §1.1 Documentation is the Single Source of Truth
All implementation must conform to documentation. Documentation must never be changed to fit implementation.

### §1.2 Documentation Precedence
When documents conflict, precedence follows `02-source-of-truth.md`. Later phases override earlier phases for implementation decisions.

### §1.3 No Silent Documentation Changes
Documentation may never be modified silently to accommodate implementation. Any documentation change requires an ADR.

### §1.4 No Implementation Without Documentation
No UI, UX, navigation, entity, workflow, or component may be implemented without prior documentation. If something is undocumented, implementation MUST STOP.

---

## Article II: No Invention

### §2.1 Never Invent UI
No UI element may be created that is not specified in the Design System V2 or Screen Specifications.

### §2.2 Never Invent UX
No UX pattern may be created that is not specified in the UX Blueprint or Screen Specifications.

### §2.3 Never Invent Navigation
No navigation path may be created that is not specified in the Information Architecture or Screen Specifications.

### §2.4 Never Invent Entities
No product entity may be created that is not defined in `product-architecture/02-core-product-entities.md`.

### §2.5 Never Invent Workflows
No user workflow may be created that is not defined in the User Flow Architecture.

### §2.6 Never Invent Business Logic
No business logic may be created in the frontend. Business logic belongs to the backend. Frontend implements UI, state management, and API consumption only.

---

## Article III: Design System Compliance

### §3.1 Never Bypass Design System
All components must use Design System V2 tokens, components, and patterns. No custom styling outside the design system.

### §3.2 Never Violate Design Tokens
No hardcoded colors, spacing, font sizes, radii, shadows, or animations. All values must use design tokens defined in `design-system-v2/44-design-tokens.md`.

### §3.3 Never Bypass Screen Specifications
Every screen must follow its Screen Specification. Layout, components, states, and interactions must match the specification.

### §3.4 Never Duplicate Components
No duplicate components. Before creating a new component, search existing components. Reuse first, extend second, create new only if impossible.

### §3.5 Never Ignore Component Hierarchy
The 4-layer taxonomy (Primitive → Composite → Domain → Page) must be respected. No lower layer may import a higher layer. See `design-system-v2/11-component-taxonomy.md`.

---

## Article IV: State & Interaction Compliance

### §4.1 Never Skip Loading States
Every data-dependent screen must implement loading states (skeleton or spinner) per `design-system-v2/19-loading-states.md`.

### §4.2 Never Skip Empty States
Every list, grid, or data container must implement empty states per `design-system-v2/18-empty-states.md`.

### §4.3 Never Skip Error States
Every data-dependent screen must implement error states per `design-system-v2/20-error-states.md`.

### §4.4 Never Skip Success Feedback
Every user-initiated action must provide success feedback per `design-system-v2/21-success-states.md`.

### §4.5 Never Skip Accessibility
WCAG 2.1 Level AA compliance is mandatory. See `design-system-v2/10-accessibility-rules.md` and `18-accessibility-compliance.md`.

### §4.6 Never Skip Responsive Behavior
All screens must be responsive per `design-system-v2/38-responsive-rules.md` and `19-responsive-compliance.md`.

### §4.7 Never Skip RTL
All screens must support RTL per `design-system-v2/39-rtl-rules.md`.

---

## Article V: Code Standards

### §5.1 Never Create Hardcoded Spacing
No `16px`, `24px`, `8px` in code. Use `--space-4`, `--space-6`, `--space-2` or Tailwind equivalents (`p-4`, `p-6`, `p-2`).

### §5.2 Never Create Hardcoded Colors
No `#2563eb`, `rgb(...)`, or color names in code. Use semantic tokens (`bg-primary`, `text-foreground`, `border-border`).

### §5.3 Never Create Inline Styles
No `style={{ ... }}` in React components. Use Tailwind classes or CSS modules with design tokens.

### §5.4 Never Create Magic Numbers
No unexplained numeric literals. Every value must be a named token or a documented constant.

### §5.5 Never Create Magic Strings
No unexplained string literals. Route paths, API endpoints, and event names must be defined constants.

### §5.6 Never Create Uncontrolled State
All component state must be controlled and predictable. No implicit state from DOM.

### §5.7 Never Implement Backend Logic Inside Frontend
No business rules, calculations, or data transformations that belong to the backend. Frontend consumes APIs, it does not replicate backend logic.

### §5.8 Never Create Business Logic Inside UI
UI components must be presentational. Business logic belongs in hooks, services, or utilities — never inside render functions.

---

## Article VI: Reusability & Architecture

### §6.1 Never Ignore Existing Reusable Components
Before creating any component, search the existing component library. If a reusable component exists, use it.

### §6.2 Never Violate Folder Ownership
Every file must be in its designated folder. See `27-folder-ownership.md` and `28-file-ownership.md`.

### §6.3 Never Violate Naming Conventions
All files, components, functions, and tokens must follow naming conventions. See `29-naming-enforcement.md` and `design-system-v2/41-component-naming.md`.

### §6.4 Never Create God Components
No component may exceed 300 lines. Split into sub-components.

### §6.5 Never Create Deep Prop Drilling
Max 2 levels of prop drilling. Use context or state management for deeper data flow.

---

## Article VII: Deviation Protocol

### §7.1 Stop on Conflict
If implementation conflicts with documentation, STOP immediately.

### §7.2 Document the Conflict
Create an ADR (Architecture Decision Record) per `24-adr-process.md`.

### §7.3 Never Continue Automatically
No implementation may proceed past a conflict without explicit approval.

### §7.4 Never Silently Change Behavior
No silent changes to documented behavior. All changes must be explicit and documented.

---

## Article VIII: Traceability

### §8.1 Complete Traceability Required
Every implementation must map through the full traceability chain:

```
Requirement → Feature → Flow → Screen → UX Blueprint → Screen Specification
→ Design System Component → Acceptance Criteria → Code → Tests → QA
```

### §8.2 No Implementation Without Traceability
No code may be written without complete traceability from requirement to QA.

### §8.3 Traceability Must Be Verifiable
Traceability must be documented and verifiable. See `05-07` traceability maps.

---

## Article IX: Quality Gates

### §9.1 Definition of Ready
Implementation may not begin until `09-definition-of-ready.md` criteria are met.

### §9.2 Definition of Done
Implementation is not complete until `10-definition-of-done.md` criteria are met.

### §9.3 Self-Audit Required
Self-audit per `22-self-audit-process.md` must pass before PR submission.

### §9.4 PR Review Required
PR review per `23-pr-review-process.md` must pass before merge.

---

## Article X: Enforcement

### §10.1 Constitution is Absolute
These rules are non-negotiable. No exception may be made without explicit user approval via ADR.

### §10.2 Violation is a Blocker
Any violation of this constitution is a release blocker. The violation must be fixed or an ADR must be approved.

### §10.3 Constitution Applies to All
These rules apply to all implementers — AI agents and human developers alike.

---

## Constitution Summary (Quick Reference)

| # | Rule | Article |
|---|------|---------|
| 1 | Documentation is the single source of truth | I |
| 2 | Never invent UI, UX, navigation, entities, or workflows | II |
| 3 | Never bypass the Design System | III |
| 4 | Never skip states (loading, empty, error, success) | IV |
| 5 | Never skip accessibility, responsive, or RTL | IV |
| 6 | Never hardcode values (colors, spacing, strings, numbers) | V |
| 7 | Never implement backend logic in frontend | V |
| 8 | Never ignore existing reusable components | VI |
| 9 | Never violate folder, file, or naming conventions | VI |
| 10 | Never silently deviate — STOP and create ADR | VII |
| 11 | Every implementation must have full traceability | VIII |
| 12 | Quality gates (Ready, Done, Self-Audit, PR Review) are mandatory | IX |

---

## Cross-References

- See `02-source-of-truth.md` for document precedence
- See `09-definition-of-ready.md` for readiness criteria
- See `10-definition-of-done.md` for completion criteria
- See `22-self-audit-process.md` for self-audit process
- See `23-pr-review-process.md` for PR review process
- See `24-adr-process.md` for deviation protocol
- See `26-anti-patterns.md` for forbidden patterns
- See `30-final-readiness-checklist.md` for final sign-off
