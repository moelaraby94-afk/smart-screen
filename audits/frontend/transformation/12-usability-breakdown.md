# Usability Breakdown

> **Evidence basis:** All V1/V2 audit files containing Nielsen Heuristic Evaluations
> **Purpose:** Consolidated usability evaluation using Nielsen's 10 usability heuristics

---

## 1. Consolidated Heuristic Evaluation

Each heuristic is scored across the product on a scale of 0 (violated) to 4 (exemplary).

### H1: Visibility of System Status

| Area | Score | Evidence |
|------|-------|----------|
| Loading states | 2/4 | Three different patterns (skeleton, spinner, text) — inconsistent (`23-error-handling-and-states.md` §23.9) |
| Toast notifications | 3/4 | Good toast system with RTL-aware positioning, but no persistence on refresh (`17-notifications.md` §17.7) |
| Socket.IO status | 1/4 | Silent failures — no connection status indicator (`07-workspace-management.md` §7.11, `17-notifications.md` §17.7) |
| Screen health | 2/4 | Realtime updates work but no summary count ("3 of 15 offline") (`08-dashboard-and-overview.md` §8.17) |
| Publish confirmation | 1/4 | No feedback that content is playing on screens (`27-user-flows.md` §27.9) |
| Auth status | 3/4 | Token refresh works, but `hasSuccessfulMeRef` silently swallows errors (`07-workspace-management.md` §7.11) |
| Error boundaries | 3/4 | Two-tier error boundaries with Sentry reporting (`23-error-handling-and-states.md` §23.9) |

**Overall H1 score: 2.1/4 — Medium**

### H2: Match Between System and Real World

| Area | Score | Evidence |
|------|-------|----------|
| Terminology | 2/4 | "Workspace" (technical), "Branch" (banking), "Studio" (ambiguous) — see `10-mental-model-analysis.md` §4.1 |
| Entity hierarchy | 2/4 | Branches elevated above Screens — doesn't match user mental model (`04-information-architecture-review.md` §2.5) |
| Navigation structure | 2/4 | 18 flat items — no real-world analogy for this structure (`03-routing-and-navigation.md` §3.2) |
| Quick actions | 2/4 | "Add Screen" navigates instead of adding — label doesn't match action (`08-dashboard-and-overview.md` §8.17) |

**Overall H2 score: 2.0/4 — Medium**

### H3: User Control and Freedom

| Area | Score | Evidence |
|------|-------|----------|
| Back button | 2/4 | Label/target mismatch (P-004), missing on settings sub-pages (IA-005) |
| Navigation undo | 3/4 | Browser back works, sidebar always available |
| Cancel operations | 2/4 | No cancel for ongoing uploads, no cancel for publish |
| Exit flows | 2/4 | No onboarding skip (`27-user-flows.md` §27.9), no wizard cancel |
| Workspace switching | 2/4 | Can't switch on mobile (P-002), navigates to wrong page (IA-003) |
| Emergency end | 3/4 | Can end emergency, but no auto-end timeout (`08-dashboard-and-overview.md` §8.17) |

**Overall H3 score: 2.3/4 — Medium**

### H4: Consistency and Standards

| Area | Score | Evidence |
|------|-------|----------|
| Loading patterns | 1/4 | Three different patterns (`23-error-handling-and-states.md` §23.9) |
| Icon stroke width | 2/4 | Three different values (1.5, 1.6, 2.0) (`26-consistency-audit.md` §26.6) |
| Icon usage | 2/4 | Duplicate icons (Clapperboard for Playlists + Studio) (`26-consistency-audit.md` §26.6) |
| Button variants | 3/4 | Consistent variant usage across features (`26-consistency-audit.md` §26.6) |
| Border radius | 4/4 | `rounded-xl` dominant, `rounded-2xl` for dialogs (`26-consistency-audit.md` §26.6) |
| Color semantics | 3/4 | Badge variants map to semantic meanings (`26-consistency-audit.md` §26.6) |
| Responsive patterns | 2/4 | Different grid column counts across features (`25-responsive-audit.md` §25.7) |
| Navigation structure | 2/4 | Client flat vs. admin grouped (`03-routing-and-navigation.md` §3.2) |

**Overall H4 score: 2.4/4 — Medium**

### H5: Error Prevention

| Area | Score | Evidence |
|------|-------|----------|
| Form validation | 2/4 | No proactive validation in many forms (`23-error-handling-and-states.md` §23.9) |
| Schedule conflict detection | 0/4 | No conflict detection (`12-schedules-feature.md` §12.9) |
| Delete confirmation | 3/4 | AlertDialog for destructive actions (`08-dashboard-and-overview.md` §8.17) |
| Limit warnings | 1/4 | No proactive limit warnings — errors only after hitting limits (`11-media-library.md` §11.6) |
| Click guards | 1/4 | Logically broken — don't prevent navigation (P-003) |
| Unsaved changes | 1/4 | No warning when navigating away with unsaved changes |

**Overall H5 score: 1.3/4 — Low**

### H6: Recognition Rather Than Recall

| Area | Score | Evidence |
|------|-------|----------|
| Navigation visibility | 3/4 | Sidebar always visible on desktop, page titles in header |
| Workspace context | 3/4 | Switcher shows current workspace (desktop only) |
| Notification context | 2/4 | No notification grouping, no visual distinction by type (`17-notifications.md` §17.7) |
| Form state persistence | 1/4 | No form state persistence — lost on navigation (`27-user-flows.md` §27.9) |
| Search history | 1/4 | No search history or recent searches (`21-search-and-global-actions.md` §21.3) |
| Breadcrumb navigation | 3/4 | Breadcrumbs show path hierarchy |

**Overall H6 score: 2.2/4 — Medium**

### H7: Flexibility and Efficiency of Use

| Area | Score | Evidence |
|------|-------|----------|
| Keyboard shortcuts | 2/4 | Ctrl+K for search, but no other shortcuts (`21-search-and-global-actions.md` §21.3) |
| Bulk operations | 0/4 | No bulk operations anywhere (E-004) |
| Quick actions | 2/4 | Navigate instead of act (IA-004) |
| Customization | 1/4 | No dashboard customization, no nav customization |
| Search | 2/4 | Global search exists but no per-page search, no cross-workspace search |
| Templates | 0/4 | No content templates (`28-feature-inventory.md` §28.6) |
| Density toggle | 3/4 | Compact/comfortable density toggle exists (desktop only) |

**Overall H7 score: 1.4/4 — Low**

### H8: Aesthetic and Minimalist Design

| Area | Score | Evidence |
|------|-------|----------|
| Visual clutter | 2/4 | 18 sidebar items, dashboard has 5+ widgets, no information hierarchy |
| Card design | 3/4 | Clean card design with consistent borders and shadows |
| Dialog design | 3/4 | Well-structured dialogs with clear hierarchy |
| Form design | 3/4 | Clean forms with proper spacing |
| Color usage | 3/4 | Semantic color system, no excessive color |
| AuroraBackdrop | 2/4 | Dead code — visual design incomplete (`04-layout-and-shell.md` §4.8) |

**Overall H8 score: 2.7/4 — Medium**

### H9: Help Users Recognize, Diagnose, and Recover from Errors

| Area | Score | Evidence |
|------|-------|----------|
| Error messages | 3/4 | Localized error codes with interpolated details (`23-error-handling-and-states.md` §23.6) |
| Error recovery | 2/4 | Retry buttons on some pages, but no recovery for most flows (`23-error-handling-and-states.md` §23.9) |
| Session recovery | 2/4 | Only workspace creation has recovery (`06-auth-and-session.md` §6.7) |
| Socket.IO recovery | 1/4 | Silent failure, no reconnection notification (`17-notifications.md` §17.7) |
| Sentry reporting | 3/4 | All unhandled errors reported to Sentry (`23-error-handling-and-states.md` §23.8) |

**Overall H9 score: 2.2/4 — Medium**

### H10: Help and Documentation

| Area | Score | Evidence |
|------|-------|----------|
| In-app help | 1/4 | No in-app help system, no tooltips on key features |
| API documentation | 3/4 | In-app API docs for developers (`20-api-docs-and-webhooks.md` §20.5) |
| Onboarding | 2/4 | Wizard exists but no skip, no contextual help |
| Empty states | 3/4 | EmptyState component with CTAs (`05-ui-component-library.md` §6.7) |
| Error guidance | 2/4 | Error messages lack actionable guidance in most cases |

**Overall H10 score: 2.2/4 — Medium**

---

## 2. Heuristic Score Summary

| Heuristic | Score | Rating |
|-----------|-------|--------|
| H1: Visibility of system status | 2.1/4 | Medium |
| H2: Match between system and real world | 2.0/4 | Medium |
| H3: User control and freedom | 2.3/4 | Medium |
| H4: Consistency and standards | 2.4/4 | Medium |
| H5: Error prevention | 1.3/4 | **Low** |
| H6: Recognition rather than recall | 2.2/4 | Medium |
| H7: Flexibility and efficiency | 1.4/4 | **Low** |
| H8: Aesthetic and minimalist design | 2.7/4 | Medium |
| H9: Help users recover from errors | 2.2/4 | Medium |
| H10: Help and documentation | 2.2/4 | Medium |
| **Overall average** | **2.1/4** | **Medium** |

---

## 3. Critical Heuristic Violations

### H5 (Error Prevention) — Score: 1.3/4

**Why this is the lowest-scoring heuristic:**
- No schedule conflict detection — users can accidentally schedule overlapping content
- No proactive limit warnings — users hit limits and get errors instead of being warned
- No unsaved changes warning — users can lose work by navigating away
- Click guards broken — users navigate to broken pages
- No form validation in many forms — errors only caught on submit

**Impact:** High — error prevention failures lead to data loss, confusion, and support tickets.

### H7 (Flexibility and Efficiency) — Score: 1.4/4

**Why this is the second-lowest:**
- No bulk operations — every action is one-at-a-time
- No templates — every playlist starts from scratch
- No customization — users can't tailor the interface
- Limited keyboard shortcuts — only Ctrl+K
- No per-page search

**Impact:** Medium-High — efficiency gaps don't cause errors but significantly increase task time for experienced users and large datasets.

---

## 4. Heuristic Improvement Priority

| Priority | Heuristic | Current | Target | Key Actions |
|----------|-----------|---------|--------|-------------|
| 1 | H5: Error prevention | 1.3 | 3.0 | Conflict detection, limit warnings, unsaved changes, fix click guards |
| 2 | H7: Flexibility and efficiency | 1.4 | 3.0 | Bulk operations, templates, keyboard shortcuts, per-page search |
| 3 | H1: Visibility of system status | 2.1 | 3.5 | Socket.IO status, publish confirmation, loading consistency |
| 4 | H2: Match system to real world | 2.0 | 3.5 | Fix terminology, restructure IA, merge Studio into Playlists |
| 5 | H3: User control and freedom | 2.3 | 3.5 | Fix back buttons, add onboarding skip, mobile workspace switching |
| 6 | H4: Consistency and standards | 2.4 | 3.5 | Unify loading, icons, stroke width, responsive patterns |
| 7 | H6: Recognition rather than recall | 2.2 | 3.0 | Notification grouping, form persistence, search history |
| 8 | H9: Error recovery | 2.2 | 3.5 | Session recovery, Socket.IO reconnection, flow state persistence |
| 9 | H10: Help and documentation | 2.2 | 3.0 | In-app help, contextual tooltips, actionable error messages |
| 10 | H8: Aesthetic and minimalist | 2.7 | 3.5 | Reduce sidebar clutter, dashboard information hierarchy |

---

## Cross-References

- See `02-problem-map.md` for problem IDs
- See `11-cognitive-load-analysis.md` for cognitive load analysis
- See `21-success-metrics.md` for measurable usability targets
- See `24-accessibility-audit.md` for accessibility-specific evaluation
