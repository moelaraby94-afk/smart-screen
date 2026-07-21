# 25 — Risk Control

> **Status:** FINAL — Risk identification, mitigation, and escalation rules

---

## 1. Purpose

Defines the risk control process for the Smart Screen frontend implementation. Risks are identified, assessed, mitigated, and escalated according to this document.

---

## 2. Risk Categories

### 2.1 Documentation Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| Missing documentation for a feature | Cannot implement | ADR → create documentation | User |
| Contradictory documentation | Conflicting implementation | ADR → resolve conflict | Reviewer |
| Ambiguous specification | Multiple valid interpretations | ADR → clarify | Reviewer |
| Outdated documentation | Implementation doesn't match reality | ADR → update documentation | User |

### 2.2 Design System Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| Token doesn't exist for needed value | Hardcoded value temptation | ADR → add token to DS V2 | User |
| Component doesn't exist for needed UI | Custom component temptation | ADR → add component spec | User |
| Variant doesn't exist for needed style | Custom variant temptation | ADR → add variant | Reviewer |
| Animation not in motion inventory | Custom animation temptation | ADR → add MI item | Reviewer |

### 2.3 Architecture Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| State management complexity | Hard to maintain | Refactor to hooks + SWR | Reviewer |
| Component too large (> 300 lines) | Unmaintainable | Split into sub-components | Developer |
| Circular dependency | Build failure | Restructure imports | Developer |
| Cross-layer import | Architecture violation | Move to correct layer | Developer |
| New library needed | Bundle size, maintenance | ADR → justify and approve | User |

### 2.4 Accessibility Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| Contrast ratio < 4.5:1 | WCAG violation | Change color pair | Developer |
| Keyboard navigation broken | WCAG violation | Fix keyboard handler | Developer |
| Missing ARIA attributes | WCAG violation | Add ARIA | Developer |
| Missing focus management | WCAG violation | Add focus trap/restore | Developer |
| `prefers-reduced-motion` not respected | WCAG violation | Add reduced motion fallback | Developer |

### 2.5 Performance Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| LCP > 2.5s | Poor UX | Optimize images, lazy load | Reviewer |
| CLS > 0.1 | Poor UX | Add skeleton, aspect ratios | Developer |
| Bundle > 300KB | Slow load | Code split, tree shake | Reviewer |
| Excessive re-renders | Janky UI | React.memo, useCallback | Developer |
| Animation jank (< 60fps) | Poor UX | Use transform/opacity only | Developer |

### 2.6 Integration Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| API not ready | Cannot implement feature | Mock API, document blocker | User |
| API response changed | Frontend breaks | Update types, fix integration | Developer |
| Realtime event format changed | Realtime breaks | Update event handler | Developer |
| Backend validation differs | Form errors mismatch | Align validation rules | Reviewer |

### 2.7 Scope Risks

| Risk | Impact | Mitigation | Escalation |
|------|--------|------------|------------|
| Feature creep | Scope bloat | Reject undocumented features | User |
| Undocumented UI added | Design inconsistency | Remove, implement per spec | Developer |
| Undocumented behavior | UX inconsistency | Remove, implement per spec | Developer |
| Premature optimization | Wasted effort | Optimize only when needed | Developer |

---

## 3. Risk Assessment Matrix

| Likelihood | Impact: Low | Impact: Medium | Impact: High |
|------------|-------------|----------------|--------------|
| High | Monitor | Mitigate | Escalate |
| Medium | Monitor | Mitigate | Escalate |
| Low | Accept | Monitor | Mitigate |

### Impact Levels
| Level | Description |
|-------|-------------|
| Low | Cosmetic, non-blocking, easy fix |
| Medium | Functional issue, moderate effort to fix |
| High | Blocks implementation, violates governance, or affects users |

### Likelihood Levels
| Level | Description |
|-------|-------------|
| High | Almost certain to occur |
| Medium | Likely to occur |
| Low | Unlikely to occur |

---

## 4. Risk Mitigation Strategies

### 4.1 Prevention
- Follow all governance documents
- Complete reading order before implementation
- Use Definition of Ready before starting
- Use existing components (no duplication)
- Follow design tokens (no hardcoded values)

### 4.2 Detection
- Self-audit after every feature
- PR review for every change
- Automated checks (ESLint, Lighthouse, axe)
- Manual testing (keyboard, screen reader, responsive)

### 4.3 Response
- Fix immediately for high-impact risks
- Create ADR for documentation conflicts
- Escalate to user for unresolvable risks
- Document risk in PR description

---

## 5. Known Risks (Pre-Implementation)

| # | Risk | Category | Impact | Likelihood | Mitigation |
|---|------|----------|--------|------------|------------|
| R-01 | Studio (Konva) is complex | Architecture | High | High | Lazy load, Splash state, desktop-only |
| R-02 | API may not be fully ready | Integration | High | Medium | Mock API, document blockers |
| R-03 | Dark mode may have contrast issues | Accessibility | Medium | Medium | Use semantic tokens, test dark mode |
| R-04 | RTL may have layout issues | Responsive | Medium | Medium | Test RTL, use logical properties |
| R-05 | Bundle size may exceed budget | Performance | Medium | Medium | Code split, lazy load, tree shake |
| R-06 | Calendar on mobile is cramped | Responsive | Medium | High | List view (future), minimal calendar |
| R-07 | Realtime updates may cause re-renders | Performance | Medium | Medium | Throttle, batch updates |
| R-08 | Large admin tables may be slow | Performance | Medium | Medium | Server-side pagination, virtualization (future) |
| R-09 | i18n may miss strings | UX | Low | High | i18n key scan, manual review |
| R-10 | Konva + React integration complexity | Architecture | High | Medium | Follow `31-studio-components.md` spec |

---

## 6. Escalation Process

### 6.1 When to Escalate
- Risk cannot be mitigated by developer
- Risk requires documentation change
- Risk requires ADR approval
- Risk blocks implementation
- Risk affects multiple screens/components

### 6.2 Escalation Path
```
Developer → Reviewer → User
```

### 6.3 Escalation Format
```markdown
## Escalation: [Risk Title]

### Risk
[Description]

### Category
[Documentation | Design System | Architecture | Accessibility | Performance | Integration | Scope]

### Impact
[Low | Medium | High]

### Likelihood
[Low | Medium | High]

### Current State
[What's happening now]

### Mitigation Attempted
[What was tried]

### Escalation Reason
[Why this needs escalation]

### Proposed Resolution
[What the developer proposes]

### ADR Reference
[ADR number, if applicable]
```

---

## Cross-References

- See `01-ai-constitution.md` Article VII for deviation protocol
- See `24-adr-process.md` for ADR process
- See `22-self-audit-process.md` for self-audit (risk detection)
- See `23-pr-review-process.md` for PR review (risk detection)
- See `product-architecture/18-product-constraints.md` for product constraints
- See `transformation/17-risk-analysis.md` for transformation risk analysis
