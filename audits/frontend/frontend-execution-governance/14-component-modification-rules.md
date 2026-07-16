# 14 — Component Modification Rules

> **Status:** FINAL — Process and criteria for modifying existing components

---

## 1. Purpose

Defines the mandatory process for modifying any existing component. Modifications must not break existing usage, must follow the Design System V2, and must be backward-compatible unless an ADR is approved for a breaking change.

---

## 2. Modification Principles

### §2.1 Backward Compatibility First
All modifications must be backward-compatible. Existing consumers of the component must not break.

### §2.2 No Silent Behavior Changes
No modification may silently change the behavior of a component. All behavior changes must be documented and communicated.

### §2.3 Spec Alignment
After modification, the component must still conform to its DS V2 specification. If the modification requires a spec change, an ADR must be created.

### §2.4 No Scope Creep
Modifications should be minimal and focused. Do not refactor or modify unrelated parts of the component.

---

## 3. Modification Types

### 3.1 Allowed Modifications (No ADR Required)

| Modification | Condition | Process |
|-------------|-----------|---------|
| Bug fix | Behavior doesn't match spec | Fix to match spec |
| Add new prop | Optional, with default | Add prop with default value |
| Add new variant | Spec already defines it | Implement per spec |
| Add new size | Spec already defines it | Implement per spec |
| Improve accessibility | Doesn't change behavior | Add ARIA, keyboard support |
| Performance optimization | No behavior change | Memo, lazy load, etc. |
| Add test | No code change | Add missing tests |

### 3.2 Modifications Requiring ADR

| Modification | Why ADR Needed |
|-------------|----------------|
| Breaking prop change | Consumers may break |
| Remove a variant | Consumers using it will break |
| Remove a size | Consumers using it will break |
| Change default behavior | Silent behavior change |
| Rename a prop | Consumers using old name will break |
| Change component layer | Architecture impact |
| Add new undocumented variant | Spec doesn't define it |
| Change animation behavior | UX change |
| Change accessibility behavior | Compliance impact |

### 3.3 Forbidden Modifications

| Modification | Reason |
|-------------|--------|
| Hardcode values | Violates token system |
| Add inline styles | Violates styling rules |
| Add business logic | Violates architecture rules |
| Add API calls | Violates architecture rules |
| Bypass design tokens | Violates DS enforcement |
| Change naming | Violates naming conventions |
| Move to different layer | Violates taxonomy |
| Remove accessibility features | Violates WCAG compliance |

---

## 4. Modification Process

### Step 1: Identify Need
- [ ] Why does this component need modification?
- [ ] Is this a bug fix or a feature change?
- [ ] Is this documented in a screen spec or feature requirement?

### Step 2: Check Spec
- [ ] Read the component's DS V2 specification
- [ ] Does the spec already support the desired modification?
- [ ] If YES: implement per spec (no ADR needed)
- [ ] If NO: proceed to Step 3

### Step 3: Determine ADR Need
- [ ] Is this a breaking change? → ADR required
- [ ] Is this an undocumented variant/feature? → ADR required
- [ ] Is this a behavior change? → ADR required
- [ ] Is this a bug fix to match spec? → No ADR needed

### Step 4: Create ADR (if needed)
- [ ] Create ADR per `24-adr-process.md`
- [ ] Document: problem, reason, alternatives, impact, recommendation
- [ ] Wait for approval before proceeding

### Step 5: Implement Modification
- [ ] Modify component following `11-code-quality-rules.md`
- [ ] Maintain backward compatibility (if no ADR for breaking change)
- [ ] Update unit tests
- [ ] Test all variants and sizes (not just the modified one)
- [ ] Test accessibility
- [ ] Test responsive
- [ ] Test RTL

### Step 6: Update Documentation (if needed)
- [ ] If spec changed: update DS V2 spec (with ADR approval)
- [ ] Update `06-component-traceability-map.md` if component usage changed
- [ ] Update screen specs if component behavior impacts screens

### Step 7: Verify
- [ ] Self-audit per `22-self-audit-process.md`
- [ ] PR review per `23-pr-review-process.md`
- [ ] No regression in other components using this component

---

## 5. Backward Compatibility Rules

### 5.1 Adding Props
- New props must have a **default value**
- Default value must produce the **same behavior** as before
- New prop must be **optional** (`?` in TypeScript)

### 5.2 Changing Props
- **Never remove a prop** without ADR
- **Never rename a prop** without ADR
- **Never change prop type** without ADR
- **Narrowing types** (e.g., `string` → `'a' | 'b'`) requires ADR
- **Widening types** (e.g., `'a' | 'b'` → `string`) is allowed if backward-compatible

### 5.3 Changing Variants
- **Never remove a variant** without ADR
- **Never rename a variant** without ADR
- **Adding a variant** is allowed if spec defines it
- **Changing variant appearance** requires ADR (consumers expect specific look)

### 5.4 Changing States
- **Never remove a state** without ADR
- **Changing state appearance** requires ADR
- **Adding a state** is allowed if spec defines it

---

## 6. Modification Impact Analysis

Before modifying a component, analyze its impact:

### 6.1 Find All Consumers
- Search for all imports of the component
- Check `06-component-traceability-map.md` for usage list
- Identify all screens and components that use it

### 6.2 Assess Impact
| Impact Level | Description | Action |
|-------------|-------------|--------|
| None | No consumer is affected | Proceed |
| Low | 1-3 consumers need updates | Update consumers in same PR |
| Medium | 4-10 consumers need updates | Separate PR for consumers |
| High | 10+ consumers need updates | ADR + phased rollout |

### 6.3 Test Impact
- [ ] All existing tests still pass
- [ ] All consumers render correctly
- [ ] No visual regression
- [ ] No accessibility regression
- [ ] No performance regression

---

## 7. Common Modification Scenarios

### 7.1 Adding a Loading State
1. Check if spec defines loading state → If YES, implement per spec
2. If NO, create ADR for new loading state
3. Add `loading` prop with `default: false`
4. Implement loading visual (Spinner per `19-loading-states.md`)
5. Add tests for loading state
6. Test all consumers (loading defaults to false, no impact)

### 7.2 Adding an Icon Prop
1. Check if spec defines icon support → If YES, implement per spec
2. If NO, create ADR
3. Add `icon` prop (optional, `LucideIcon` type)
4. Add `iconPosition` prop (optional, `'left' | 'right'`, default: `'left'`)
5. Implement icon rendering
6. Add tests
7. Test all consumers (no icon = no change)

### 7.3 Fixing an Accessibility Issue
1. Check spec for accessibility requirements
2. Implement fix to match spec (no ADR needed)
3. Add/update tests for accessibility
4. Test with keyboard and screen reader
5. No impact on consumers (accessibility fix is additive)

---

## Cross-References

- See `01-ai-constitution.md` Article VII for deviation protocol
- See `13-component-creation-rules.md` for creation process
- See `15-design-system-enforcement.md` for DS enforcement
- See `22-self-audit-process.md` for self-audit
- See `23-pr-review-process.md` for PR review
- See `24-adr-process.md` for ADR process
- See `06-component-traceability-map.md` for component usage
- See `design-system-v2/42-variant-rules.md` for variant rules
