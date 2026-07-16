# 23 — PR Review Process

> **Status:** FINAL — Mandatory PR review gates before any merge

---

## 1. Purpose

Defines the mandatory PR review process. No PR may be merged until every governance checklist passes. Enforced by AI Constitution (Article IX, §9.4).

---

## 2. PR Submission Requirements

### 2.1 PR Description Must Include

| Field | Required | Description |
|-------|----------|-------------|
| Summary | ✅ | What changed and why |
| Screen Spec Reference | ✅ | Which screen spec(s) this implements |
| Feature Reference | ✅ | Feature ID from `07-feature-traceability-map.md` |
| Component Reference | ✅ | Component(s) from `06-component-traceability-map.md` |
| Self-Audit Result | ✅ | "PASSED" or "CONDITIONAL PASS" with ADRs |
| Definition of Done Checklist | ✅ | Completed checklist from `10-definition-of-done.md` |
| Test Instructions | ✅ | How to test the changes |
| Screenshots | ✅ | Before/after (if visual change) |
| ADRs | ✅ | List of any ADRs (or "None") |
| Breaking Changes | ✅ | List any (or "None") |

### 2.2 PR Description Template

```markdown
## Summary
[What changed and why]

## Traceability
- Screen: [Screen ID from `05-screen-traceability-map.md`]
- Feature: [Feature from `07-feature-traceability-map.md`]
- Components: [Components from `06-component-traceability-map.md`]
- Screen Spec: `screen-specifications/[file].md`
- UX Blueprint: `ux-blueprint/[file].md`
- User Flow: `user-flow-architecture/[file].md`

## Self-Audit: PASSED
[Summary or link to full audit]

## Definition of Done
- [x] Design compliance
- [x] UX compliance
- [x] State compliance
- [x] Responsive compliance
- [x] RTL compliance
- [x] Accessibility compliance
- [x] Performance compliance
- [x] Architecture compliance
- [x] Naming compliance
- [x] Folder compliance
- [x] Component compliance
- [x] Testing compliance
- [x] Code quality compliance
- [x] Traceability compliance

## Test Instructions
1. [Step 1]
2. [Step 2]

## ADRs
None (or list)

## Breaking Changes
None (or list)
```

---

## 3. PR Review Process

### Step 1: Automated Checks
PR cannot be reviewed until automated checks pass:

- [ ] CI pipeline passes (build, lint, test)
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] E2E tests pass (if applicable)
- [ ] Lighthouse Accessibility ≥ 95
- [ ] Lighthouse Performance ≥ 90
- [ ] Bundle size within budget
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] No new dependencies without approval

### Step 2: Reviewer Assignment
- PR must be reviewed by at least one reviewer
- Reviewer must not be the PR author
- Reviewer should have context on the feature/screen

### Step 3: Reviewer Checklist

#### 3a. Documentation Compliance
- [ ] PR references correct screen spec
- [ ] Implementation matches screen spec
- [ ] PR references correct UX blueprint
- [ ] Implementation matches UX blueprint
- [ ] PR references correct user flow
- [ ] Implementation matches user flow
- [ ] No undocumented features added
- [ ] No undocumented behavior changes

#### 3b. Design Compliance
- [ ] All colors use semantic tokens
- [ ] All spacing uses spacing tokens
- [ ] All typography uses text tokens
- [ ] No hardcoded values
- [ ] Component variants match spec
- [ ] Component sizes match spec
- [ ] Layout matches screen spec
- [ ] No visual regression

#### 3c. State Compliance
- [ ] Loading state implemented
- [ ] Empty state implemented
- [ ] Error state implemented
- [ ] Success feedback implemented
- [ ] No layout shift between states
- [ ] State messages are specific

#### 3d. Accessibility Compliance
- [ ] Semantic HTML used
- [ ] ARIA attributes correct
- [ ] Keyboard navigation works
- [ ] Focus management correct
- [ ] Color contrast sufficient
- [ ] `prefers-reduced-motion` respected
- [ ] Lighthouse Accessibility ≥ 95

#### 3e. Responsive Compliance
- [ ] Tested at 320px
- [ ] Tested at 768px
- [ ] Tested at 1024px
- [ ] Tested at 1280px
- [ ] No horizontal scroll
- [ ] Touch targets meet minimum

#### 3f. RTL Compliance
- [ ] Layout mirrors in RTL
- [ ] Icons mirrored correctly
- [ ] No hardcoded left/right
- [ ] All text translated

#### 3g. Performance Compliance
- [ ] No layout shift
- [ ] Animations use transform/opacity
- [ ] Images lazy-loaded
- [ ] No excessive re-renders
- [ ] Lighthouse Performance ≥ 90

#### 3h. Architecture Compliance
- [ ] Layer rules respected
- [ ] No circular dependencies
- [ ] No God components
- [ ] No business logic in UI
- [ ] Reusable components used

#### 3i. Code Quality Compliance
- [ ] No `any` types
- [ ] No `console.log`
- [ ] No commented-out code
- [ ] No TODO without ticket
- [ ] Naming follows conventions
- [ ] Files in correct folders

#### 3j. Testing Compliance
- [ ] Unit tests pass
- [ ] Test coverage ≥ 80%
- [ ] No tests skipped
- [ ] E2E test for P0/P1 screens

### Step 4: Review Feedback
- **Approve** — All checks pass, no issues
- **Request Changes** — Issues found that must be fixed
- **Block** — Fundamental issues (missing states, accessibility failures, architecture violations)

### Step 5: Merge
- Only after reviewer approves
- Only after all automated checks pass
- Only after self-audit is documented as PASSED
- Squash merge (clean commit history)

---

## 4. PR Review Rules

### §4.1 No Merge Without Review
No PR may be merged without at least one reviewer approval.

### §4.2 No Self-Review
PR author may not review their own PR.

### §4.3 No Bypass
No one may bypass the PR review process, including for "urgent" fixes. Urgent fixes follow the same process.

### §4.4 Block on Critical Issues
Reviewer MUST block PR if:
- Missing loading/empty/error states
- Accessibility failures (WCAG 2.1 AA)
- Architecture violations (cross-layer imports, business logic in UI)
- Hardcoded values (colors, spacing)
- Missing tests
- Undocumented features
- Silent behavior changes

### §4.5 ADR Verification
If PR includes ADRs:
- Verify ADR is properly documented per `24-adr-process.md`
- Verify ADR has been approved
- Verify implementation follows ADR recommendation

---

## 5. PR Size Guidelines

| Size | Lines Changed | Process |
|------|--------------|---------|
| Small | < 200 | Standard review |
| Medium | 200-500 | Standard review + thorough testing |
| Large | 500-1000 | Consider splitting into smaller PRs |
| Extra Large | > 1000 | MUST split into smaller PRs |

**No PR > 1000 lines** unless explicitly approved with justification.

---

## Cross-References

- See `01-ai-constitution.md` Article IX §9.4 for PR review mandate
- See `10-definition-of-done.md` for completion criteria
- See `22-self-audit-process.md` for self-audit
- See `24-adr-process.md` for ADR process
- See `16-20` compliance checklists
- See `21-testing-strategy.md` for testing requirements
