# 09 — Definition of Ready

> **Status:** FINAL — Criteria that must be met before implementation begins

---

## 1. Purpose

Defines the criteria that must be **fully met** before any implementation work begins. If any criterion is NOT met, implementation MUST STOP. This is enforced by the AI Constitution (Article IX, §9.1).

---

## 2. Global Readiness Criteria

Before starting **any** implementation work, ALL of the following must be true:

### 2.1 Documentation Readiness
- [ ] AI Constitution (`01-ai-constitution.md`) read and understood
- [ ] Source of Truth (`02-source-of-truth.md`) read and understood
- [ ] Document Reading Order (`03-document-reading-order.md`) completed
- [ ] Product Rules (`product-architecture/17-product-rules.md`) read
- [ ] Frontend Responsibilities (`product-architecture/14-frontend-responsibilities.md`) read
- [ ] State Boundaries (`product-architecture/13-frontend-state-boundaries.md`) read
- [ ] Design Tokens (`design-system-v2/44-design-tokens.md`) read
- [ ] Component Taxonomy (`design-system-v2/11-component-taxonomy.md`) read
- [ ] Accessibility Rules (`design-system-v2/10-accessibility-rules.md`) read
- [ ] Responsive Rules (`design-system-v2/38-responsive-rules.md`) read
- [ ] RTL Rules (`design-system-v2/39-rtl-rules.md`) read
- [ ] Anti-Patterns (`26-anti-patterns.md`) read
- [ ] Folder Ownership (`27-folder-ownership.md`) read
- [ ] File Ownership (`28-file-ownership.md`) read
- [ ] Naming Enforcement (`29-naming-enforcement.md`) read

### 2.2 Environment Readiness
- [ ] Next.js project initialized
- [ ] Tailwind CSS configured with design tokens
- [ ] TypeScript configured
- [ ] i18n (next-intl) configured with EN + AR
- [ ] RTL support configured
- [ ] Dark mode support configured
- [ ] SWR (or equivalent) configured for data fetching
- [ ] Socket.IO client configured
- [ ] Lucide React installed
- [ ] Framer Motion installed
- [ ] ESLint + Prettier configured
- [ ] Testing framework configured (Jest + Testing Library)

### 2.3 Governance Readiness
- [ ] `09-definition-of-ready.md` criteria met (this document)
- [ ] `10-definition-of-done.md` criteria understood
- [ ] `22-self-audit-process.md` understood
- [ ] `23-pr-review-process.md` understood
- [ ] `24-adr-process.md` understood

---

## 3. Per-Screen Readiness Criteria

Before implementing **any screen**, ALL of the following must be true:

### 3.1 Screen Documentation
- [ ] Screen Specification exists and is read (`screen-specifications/[relevant].md`)
- [ ] UX Blueprint for this screen exists and is read (`ux-blueprint/[relevant].md`)
- [ ] User Flow for this screen exists and is read (`user-flow-architecture/[relevant].md`)
- [ ] Screen is listed in `05-screen-traceability-map.md`
- [ ] Screen ID is identified

### 3.2 Component Readiness
- [ ] All components used on this screen exist in `06-component-traceability-map.md`
- [ ] All DS V2 component specs for this screen's components are read
- [ ] All primitive components are implemented (Phase 1 complete)
- [ ] All composite components used on this screen are implemented
- [ ] All domain components used on this screen are implemented (or scheduled)

### 3.3 State Readiness
- [ ] Loading state is documented in screen spec
- [ ] Empty state is documented in screen spec
- [ ] Error state is documented in screen spec
- [ ] Success feedback is documented in screen spec
- [ ] All states have corresponding DS V2 components (Skeleton, EmptyState, ErrorState, Toast)

### 3.4 API Readiness
- [ ] API endpoints documented in screen spec
- [ ] API responses match frontend expectations
- [ ] Realtime events documented (if applicable)
- [ ] Backend limitations documented (if any)
- [ ] Missing APIs documented (if any) — implementation proceeds with documented limitations

### 3.5 Compliance Readiness
- [ ] `16-screen-compliance-checklist.md` reviewed for this screen
- [ ] `17-ux-compliance-checklist.md` reviewed for this screen
- [ ] `18-accessibility-compliance.md` reviewed for this screen
- [ ] `19-responsive-compliance.md` reviewed for this screen

### 3.6 Pre-Implementation Checklist
- [ ] Have all required documents been read? **YES/NO**
- [ ] Is the Screen Specification available? **YES/NO**
- [ ] Is the UX Blueprint available? **YES/NO**
- [ ] Does a reusable component already exist for each UI element? **YES/NO**
- [ ] Does the Design System define every component needed? **YES/NO**
- [ ] Is accessibility documented for this screen? **YES/NO**
- [ ] Are responsive rules documented for this screen? **YES/NO**
- [ ] Is RTL documented for this screen? **YES/NO**
- [ ] Are loading states documented? **YES/NO**
- [ ] Are empty states documented? **YES/NO**
- [ ] Are error states documented? **YES/NO**
- [ ] Are success states documented? **YES/NO**
- [ ] Are API requirements documented? **YES/NO**
- [ ] Are acceptance criteria documented? **YES/NO**

**If ANY answer is NO: STOP. Do not begin implementation.**

---

## 4. Per-Component Readiness Criteria

Before implementing **any component**, ALL of the following must be true:

### 4.1 Component Documentation
- [ ] Component spec exists in DS V2 (`design-system-v2/[relevant].md`)
- [ ] Component is listed in `06-component-traceability-map.md`
- [ ] Component layer is identified (Primitive, Composite, Domain)
- [ ] Component name follows `design-system-v2/41-component-naming.md`

### 4.2 Dependency Readiness
- [ ] All dependencies (lower-layer components) are implemented
- [ ] All required tokens are defined in `design-system-v2/44-design-tokens.md`
- [ ] All required icons are identified in `design-system-v2/05-iconography.md`
- [ ] All required animations are identified in `design-system-v2/07-motion-system.md`

### 4.3 Specification Completeness
- [ ] Purpose is documented
- [ ] Usage is documented
- [ ] When to use / when NOT to use is documented
- [ ] Variants are documented
- [ ] Sizes are documented
- [ ] States are documented
- [ ] Props are documented
- [ ] Icons are documented
- [ ] Spacing is documented
- [ ] Responsive behavior is documented
- [ ] Accessibility is documented
- [ ] Keyboard behavior is documented
- [ ] Animations are documented
- [ ] Loading state is documented
- [ ] Empty state is documented (if applicable)
- [ ] Error state is documented (if applicable)
- [ ] Disabled state is documented
- [ ] Examples are documented
- [ ] Anti-patterns are documented
- [ ] Acceptance criteria are documented
- [ ] Future scalability is documented

### 4.4 Pre-Implementation Checklist
- [ ] Does the component spec exist? **YES/NO**
- [ ] Are all variants defined? **YES/NO**
- [ ] Are all states defined? **YES/NO**
- [ ] Are all props defined? **YES/NO**
- [ ] Is accessibility defined? **YES/NO**
- [ ] Is responsive behavior defined? **YES/NO**
- [ ] Is RTL behavior defined? **YES/NO**
- [ ] Are animations defined? **YES/NO**
- [ ] Are acceptance criteria defined? **YES/NO**
- [ ] Does the component already exist? **YES/NO** (If YES, do not recreate)

**If ANY answer is NO: STOP. Do not begin implementation.**

---

## 5. Per-Feature Readiness Criteria

Before implementing **any feature**, ALL of the following must be true:

### 5.1 Feature Documentation
- [ ] Feature is listed in `07-feature-traceability-map.md`
- [ ] Feature ownership is documented in `product-architecture/11-feature-ownership.md`
- [ ] Feature flow is documented in User Flow Architecture
- [ ] Feature screen is documented in Screen Specifications
- [ ] Feature UX rules are documented in UX Blueprint

### 5.2 Feature Scope
- [ ] Feature scope is clearly defined (what's included, what's NOT)
- [ ] Feature dependencies on other features are identified
- [ ] Feature backend requirements are documented
- [ ] Feature acceptance criteria are documented

### 5.3 Pre-Implementation Checklist
- [ ] Is the feature defined in Product Architecture? **YES/NO**
- [ ] Is the feature flow defined in User Flow Architecture? **YES/NO**
- [ ] Is the feature screen specified? **YES/NO**
- [ ] Are the feature UX rules documented? **YES/NO**
- [ ] Are all required components available? **YES/NO**
- [ ] Are API endpoints documented? **YES/NO**

**If ANY answer is NO: STOP. Do not begin implementation.**

---

## 6. Readiness Gate Enforcement

### §6.1 No Implementation Without Readiness
Implementation may not begin until ALL readiness criteria are met. This is non-negotiable.

### §6.2 Missing Documentation
If documentation is missing:
1. STOP implementation
2. Document what's missing
3. Create an ADR per `24-adr-process.md`
4. Wait for documentation to be created
5. Re-verify readiness

### §6.3 Readiness Verification
Readiness must be verified by completing the checklist above. The completed checklist must be included in the PR description.

---

## Cross-References

- See `01-ai-constitution.md` Article IX for quality gates
- See `10-definition-of-done.md` for completion criteria
- See `03-document-reading-order.md` for reading sequence
- See `05-07` traceability maps
- See `16-19` compliance checklists
- See `24-adr-process.md` for deviation protocol
- See `30-final-readiness-checklist.md` for final sign-off
