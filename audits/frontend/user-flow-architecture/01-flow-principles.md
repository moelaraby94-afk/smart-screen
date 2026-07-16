# Flow Principles and Conventions

> **Evidence basis:** `ux-blueprint/01-ux-principles.md`, `information-architecture/05-navigation-architecture.md`, `product-architecture/15-interaction-principles.md`, `product-architecture/16-navigation-principles.md`
> **Purpose:** Define the foundational principles, notation conventions, and documentation structure for all user flows

---

## 1. Flow Design Principles

### FP-01: Shortest Path to Value
Every flow must minimize steps between user intent and outcome. Optional steps are never in the primary path. If a flow can be completed in 3 steps, it must not require 5.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-01; 5-minute KPI (locked)

### FP-02: One Primary Action Per Step
Each step in a flow has exactly one primary action. Secondary actions are available but subordinate. The user should never face equal-weight choices in a primary flow step.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-02

### FP-03: Every Failure Has a Recovery Path
No flow ends in a dead end. Every error, every failure, every timeout has a defined recovery path that returns the user to a productive state.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-05, UP-10

### FP-04: State Is Always Visible
The user always knows what state they are in: what step, what is loading, what succeeded, what failed. No silent state transitions.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-04

### FP-05: Cancellation Is Always Available
Every multi-step flow can be cancelled at any point. Cancellation restores the user to their previous state without data loss (or with explicit warning if data loss is unavoidable).

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-05

### FP-06: Permission Gates Are Front-Loaded
If a user lacks permission for a flow, they learn this before investing time — not after completing a form. Permission checks happen at flow entry, not at submission.

**Evidence:** `product-architecture/17-product-rules.md` PR-33; `ux-blueprint/04-feature-ux-standards.md` §4

### FP-07: Idempotent Actions
Submitting the same action twice (double-click, retry) produces the same result as submitting once. No duplicate entities, no double-charges.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-08

### FP-08: Progressive Complexity
Simple flows are simple. Complex flows start simple and reveal complexity only when needed. The first-time user path is always simpler than the power user path.

**Evidence:** `ux-blueprint/01-ux-principles.md` UP-03

### FP-09: Context Is Preserved
When a flow navigates the user between pages, context is preserved. Returning from a sub-flow returns the user to where they were, not to a generic landing page.

**Evidence:** `product-architecture/16-navigation-principles.md` NP-03

### FP-10: Bilingual and RTL-First
Every flow is designed for both EN and AR. RTL layouts mirror LTR layouts. No flow assumes left-to-right reading order for its logic.

**Evidence:** `product-architecture/17-product-rules.md` PR-39 through PR-42

---

## 2. Flow Notation Conventions

### 2.1 Step Notation

Each step in a flow is documented using the following structure:

```
Step [N]: [Step Name]
  Screen: [Page/Dialog/Toast]
  User Action: [What the user does]
  System Response: [What the system does]
  Validation: [What is validated, when, and how]
  Loading: [Loading state if applicable]
  Success: [What happens on success]
  Failure: [What happens on failure]
  Recovery: [How the user recovers from failure]
  Permission Check: [What role/permission is required]
  Data Required: [What data the system needs]
  State Transition: [From state → To state]
  Navigation Transition: [From page → To page]
  Micro Interaction: [Animation/feedback detail]
  Feedback: [Toast/dialog/inline]
  Keyboard: [Keyboard shortcut if applicable]
  Accessibility: [A11y notes]
  Mobile: [Mobile-specific notes]
  Performance: [Performance notes]
```

### 2.2 Path Notation

| Path Type | Notation | Description |
|-----------|----------|-------------|
| Happy Path | `→` | Primary path, no errors |
| Alternative Path | `⇒` | Non-primary but valid path |
| Failure Path | `✗` | Error or failure occurs |
| Recovery Path | `↻` | Recovery from failure |
| Decision Point | `◇` | User or system makes a choice |
| Permission Gate | `🔒` | Permission check |
| State Change | `⚙` | System state transition |
| Navigation | `→📊` | Navigate to page (icon represents page) |
| End | `✓` | Flow complete |
| Dead End | `⛔` | Flow blocked (should not exist) |

### 2.3 Flow Diagram Convention

```
[Start] → Step 1 → Step 2 → ◇ Decision → Step 3 → ✓ [End]
                        ↓                    ↑
                        ✗ Failure → ↻ Recovery ↻
```

---

## 3. Flow Classification

### 3.1 By Frequency

| Frequency | Description | Examples |
|-----------|-------------|----------|
| Daily | Multiple times per day | Screen status check, notification view |
| Weekly | 1-3 times per week | Playlist creation, media upload, schedule creation |
| Monthly | 1-2 times per month | Team management, billing review, analytics review |
| Occasional | Less than monthly | Settings, 2FA setup, API key creation |
| One-time | Once per user | Registration, workspace creation, first screen pairing |

### 3.2 By Business Importance

| Importance | Description | Examples |
|-----------|-------------|----------|
| Critical | Directly impacts revenue or 5-min KPI | Registration, screen pairing, first publish, billing |
| High | Core product value | Playlist creation, publishing, scheduling, screen management |
| Medium | Important but not core | Team management, analytics, notifications, media management |
| Low | Support functions | Settings, API keys, admin functions, logs |

### 3.3 By Complexity

| Complexity | Steps | Decision Points | Error Paths | Examples |
|-----------|-------|----------------|-------------|----------|
| Simple | 1-3 | 0-1 | 1-2 | Login, logout, screen rename, profile update |
| Medium | 4-7 | 2-3 | 3-5 | Screen pairing, playlist creation, team invite, media upload |
| Complex | 8-15 | 4-6 | 6-10 | Playlist publishing with scheduling, 2FA setup, billing upgrade |
| High | 15+ | 7+ | 10+ | Studio editing, admin impersonation, conflict resolution |

---

## 4. Flow Documentation Structure

Each flow is documented with:

### 4.1 Flow Header

| Field | Description |
|-------|-------------|
| Flow ID | Unique identifier (e.g., FL-AUTH-01) |
| Flow Name | Human-readable name |
| Purpose | Why this flow exists |
| Primary User | Who performs this flow |
| Business Goal | What the business gains |
| User Goal | What the user achieves |
| Starting Point | Where the flow begins (page/state) |
| Ending Point | Where the flow ends (page/state) |
| Success Criteria | What constitutes successful completion |
| Failure Criteria | What constitutes failure |
| Frequency | How often this flow is performed |
| Business Importance | Critical/High/Medium/Low |
| Complexity | Simple/Medium/Complex/High |

### 4.2 Path Variants

Every flow documents:

| Path | Description |
|------|-------------|
| Happy Path | Primary path with no errors |
| Alternative Paths | Valid non-primary paths |
| Failure Paths | What happens when things go wrong |
| Recovery Paths | How users recover from failures |
| First-Time User Path | Simplified path for new users |
| Returning User Path | Optimized path for experienced users |
| Power User Path | Keyboard shortcuts, bulk actions, advanced features |
| Offline Path | What happens when network is lost |
| Permission Path | What happens when user lacks permissions |
| Timeout Path | What happens on session timeout |
| Cancellation Path | What happens when user cancels |
| Undo Path | What happens when user undoes (if applicable) |

### 4.3 Edge Cases

Each flow lists relevant edge cases with their handling.

---

## 5. Flow ID Convention

| Prefix | Category | Range |
|--------|----------|-------|
| FL-AUTH | Authentication | FL-AUTH-01 through FL-AUTH-10 |
| FL-WS | Workspace | FL-WS-01 through FL-WS-10 |
| FL-SC | Screens | FL-SC-01 through FL-SC-20 |
| FL-MED | Media | FL-MED-01 through FL-MED-10 |
| FL-PL | Playlists | FL-PL-01 through FL-PL-20 |
| FL-PUB | Publishing | FL-PUB-01 through FL-PUB-10 |
| FL-SCH | Scheduling | FL-SCH-01 through FL-SCH-10 |
| FL-TM | Team | FL-TM-01 through FL-TM-10 |
| FL-ST | Settings | FL-ST-01 through FL-ST-20 |
| FL-NT | Notifications | FL-NT-01 through FL-NT-10 |
| FL-AN | Analytics | FL-AN-01 through FL-AN-05 |
| FL-AD | Admin | FL-AD-01 through FL-AD-20 |
| FL-SYS | System | FL-SYS-01 through FL-SYS-10 |
| FL-OB | Onboarding | FL-OB-01 through FL-OB-10 |
| FL-NAV | Navigation | FL-NAV-01 through FL-NAV-10 |

---

## 6. User Hesitation and Abandonment Documentation

For every flow, the following friction points are documented:

| Friction Point | Description |
|---------------|-------------|
| Hesitation | Where users pause or are unsure what to do next |
| Abandonment | Where users leave the flow without completing |
| Confusion | Where users misunderstand what is happening |
| Mistake | Where users make an error that the system must prevent or recover |
| Prevention | How the UX design prevents the mistake |
| Recovery | How the UX design recovers from the mistake |

---

## Cross-References

- See `02-flow-matrix.md` for flow priority, complexity, friction, and risk matrices
- See `03-decision-trees.md` for decision trees of key flows
- See `04-state-machines.md` for entity state machines
- See `05-cross-flow-relationships.md` for flow dependencies and cross-flow relationships
- See `ux-blueprint/01-ux-principles.md` for UX principles
- See `product-architecture/15-interaction-principles.md` for interaction principles
- See `product-architecture/16-navigation-principles.md` for navigation principles
