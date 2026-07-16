# 24 — ADR Process

> **Status:** FINAL — Architecture Decision Record process for deviations

---

## 1. Purpose

Defines the Architecture Decision Record (ADR) process for when implementation needs to deviate from documentation. Enforced by AI Constitution (Article VII).

---

## 2. When to Create an ADR

### 2.1 Mandatory ADR Scenarios

| Scenario | Why ADR Needed |
|----------|----------------|
| Implementation conflicts with documentation | Documentation is source of truth — deviation needs approval |
| Component needs undocumented variant | DS V2 doesn't define this variant |
| Component needs undocumented behavior | Spec doesn't define this behavior |
| Breaking change to existing component | Consumers may break |
| New library/dependency needed | Not in approved technology stack |
| Architecture deviation | Different from `12-frontend-architecture-rules.md` |
| Documentation needs to be modified | Documentation must not be silently changed |
| New entity/workflow not in documentation | AI Constitution forbids invention |
| Performance budget cannot be met | Target cannot be achieved |
| Accessibility cannot be fully met | WCAG requirement cannot be satisfied |

### 2.2 When NOT to Create an ADR

| Scenario | What to Do Instead |
|----------|-------------------|
| Bug fix to match spec | Fix to match spec (no ADR) |
| Adding a documented variant | Implement per spec (no ADR) |
| Adding a documented size | Implement per spec (no ADR) |
| Improving accessibility to match spec | Implement per spec (no ADR) |
| Performance optimization (no behavior change) | Optimize (no ADR) |
| Adding tests | Add tests (no ADR) |

---

## 3. ADR Format

```markdown
# ADR-[Number]: [Title]

## Status
Proposed | Accepted | Rejected | Superseded by ADR-[Number]

## Date
[YYYY-MM-DD]

## Context
[Describe the situation, what was being implemented, and what documentation conflict was encountered]

## Problem
[Describe the specific conflict or deviation needed]

## Documentation Reference
- [Document that conflicts]: [Specific section/line]
- [Document that conflicts]: [Specific section/line]

## Alternatives Considered

### Alternative 1: [Name]
- Description: [What]
- Pros: [Benefits]
- Cons: [Drawbacks]

### Alternative 2: [Name]
- Description: [What]
- Pros: [Benefits]
- Cons: [Drawbacks]

### Alternative 3: [Name]
- Description: [What]
- Pros: [Benefits]
- Cons: [Drawbacks]

## Recommendation
[Which alternative is recommended and why]

## Impact
- **Components affected:** [List]
- **Screens affected:** [List]
- **Documentation changes needed:** [List]
- **Testing impact:** [Description]
- **Performance impact:** [Description]
- **Accessibility impact:** [Description]
- **RTL impact:** [Description]

## Consequences
[What happens if this ADR is accepted — both positive and negative]

## Approval
- [ ] Developer
- [ ] Reviewer
- [ ] User (if needed)

## Resolution
[Final decision and any conditions]
```

---

## 4. ADR Process

### Step 1: STOP Implementation
When a conflict is discovered, STOP implementation immediately. Do not continue with the deviation.

### Step 2: Document the Conflict
Write down:
- What was being implemented
- What documentation says
- What the conflict is
- Why the deviation is needed

### Step 3: Create ADR
Create a new ADR file using the format above.

### Step 4: Propose Alternatives
Think of at least 2-3 alternatives, including:
- Following documentation as-is (even if difficult)
- Modifying approach to fit documentation
- Deviating from documentation (with justification)

### Step 5: Submit for Approval
Submit ADR to:
- PR reviewer (for minor deviations)
- User (for major deviations, breaking changes, or documentation modifications)

### Step 6: Wait for Approval
**Do NOT continue implementation** until ADR is approved. If rejected, follow the alternative approach.

### Step 7: Implement per ADR
Once approved, implement following the ADR recommendation.

### Step 8: Update Documentation (if needed)
If ADR requires documentation change:
- Update the relevant documentation file
- Reference the ADR in the documentation
- Note the change in the document's changelog (if applicable)

---

## 5. ADR Storage

ADRs are stored in:
```
audits/frontend/frontend-execution-governance/adrs/
  adr-001-[title].md
  adr-002-[title].md
  ...
```

### ADR Numbering
- Sequential: ADR-001, ADR-002, ADR-003...
- Never reuse numbers
- Superseded ADRs remain in place with "Superseded by ADR-[N]" status

---

## 6. ADR Examples

### Example 1: Undocumented Variant

```markdown
# ADR-001: Add "subtle" variant to Badge component

## Status
Proposed

## Context
Admin Logs page needs a log level badge that is less prominent than "default" but more prominent than "muted". The current Badge variants (default, success, warning, destructive, muted) don't provide this intermediate level.

## Problem
DS V2 `15-cards.md` defines 5 Badge variants. None fit the "subtle info" use case.

## Documentation Reference
- `design-system-v2/15-cards.md` §Badge Variants
- `design-system-v2/42-variant-rules.md` §3.3 Badge Variants

## Alternatives
1. Use "muted" variant — too subtle, doesn't convey info level
2. Use "default" variant — too prominent for log entries
3. Add "subtle" variant — fits the use case

## Recommendation
Add "subtle" variant with `--primary/5` background and `--primary/70` text.

## Impact
- Components: Badge
- Screens: Admin Logs
- Documentation: Update `15-cards.md` and `42-variant-rules.md`
```

### Example 2: Performance Budget Deviation

```markdown
# ADR-002: Studio LCP exceeds 2.5s budget

## Status
Proposed

## Context
Studio page uses Konva.js which is a large dependency. Even with lazy loading, the LCP is 3.2s.

## Problem
Performance budget (`20-performance-budget.md`) requires LCP < 2.5s. Studio LCP is 3.2s.

## Alternatives
1. Accept 3.2s for Studio only (document exception)
2. Split Konva into smaller chunks (not feasible — single library)
3. Use alternative canvas library (major refactor)

## Recommendation
Accept 3.2s LCP for Studio page only, with Splash loading state to manage perceived performance.
```

---

## 7. ADR Rules

### §7.1 No Implementation Without ADR Approval
If a deviation is needed, implementation MUST STOP until ADR is approved.

### §7.2 No Silent Deviations
No deviation may be made without an ADR. Silent deviations are Constitution violations.

### §7.3 No Documentation Changes Without ADR
No documentation may be modified without an ADR explaining why.

### §7.4 ADRs Are Permanent
ADRs are never deleted. They may be superseded by new ADRs.

### §7.5 ADRs Must Be Referenced
PRs that implement ADR decisions must reference the ADR number.

---

## Cross-References

- See `01-ai-constitution.md` Article VII for deviation protocol
- See `14-component-modification-rules.md` §3.2 for modifications requiring ADR
- See `22-self-audit-process.md` §3.1 for documentation compliance
- See `23-pr-review-process.md` §3d for ADR verification in PR review
- See `25-risk-control.md` for risk management
