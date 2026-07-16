# Design Decisions

> **Evidence basis:** All V1/V2 audit files, transformation documents 00–23, source code review
> **Purpose:** Permanent record of every major product, UX, and engineering decision — why it was made, what alternatives were rejected, and what it means for the future

---

## Decision Documentation Convention

Every decision is documented with:

- **Decision ID** — `DD-XX` format
- **Decision** — What was decided
- **Problem addressed** — Which problem ID(s) from `02-problem-map.md`
- **Context** — The situation that required a decision
- **Evidence** — Audit files and source code that informed the decision
- **Alternatives considered** — Other options evaluated
- **Trade-offs** — What was gained and what was sacrificed
- **Reason for final decision** — Why this option was chosen
- **Affected files** — Source files impacted
- **Affected features** — Feature IDs from `08-feature-priorities.md`
- **Dependencies** — What this decision depends on or what depends on it
- **Future implications** — Long-term consequences
- **Roadmap phase** — When this decision is executed
- **Related open questions** — Questions from `22-open-questions.md` (if applicable)

---

## DD-01: Sidebar Navigation Grouping (4–5 Categories)

| Field | Value |
|-------|-------|
| **Decision** | Restructure the 18-item flat sidebar into 4–5 grouped categories: Dashboard, Content, Insights, Management, Developer |
| **Problem addressed** | IA-001 (flat sidebar), IA-002 (inconsistent nav structure) |
| **Context** | The client sidebar contains 18 ungrouped items, exceeding Miller's 7±2 working memory capacity. Users must scan all 18 items on every navigation action. The admin sidebar already uses grouping, creating an inconsistency. |
| **Evidence** | `03-routing-and-navigation.md` §3.2 (flat list), §3.5 (admin grouped); `11-cognitive-load-analysis.md` §2.1 (HIGH extraneous load); `04-information-architecture-review.md` §8.1 (proposed grouping) |
| **Alternatives considered** | **A) Keep flat, add visual separators** — rejected: separators don't reduce scanning time. **B) Search-only navigation** — rejected: users need browse-and-discover, not just search. **C) Mega-menu** — rejected: overkill for 18 items. **D) Grouped categories** — accepted. |
| **Trade-offs** | **Gained:** reduced scanning time, scalable structure, admin/client consistency. **Sacrificed:** user muscle memory (mitigated by phased rollout), slightly more clicks for power users (two decisions: group → item vs one scan). |
| **Reason** | Grouping is the only approach that scales as features are added. The admin sidebar already proves the pattern works. Hick's Law analysis shows grouping reduces visual scanning time despite slightly higher decision count. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx`, `apps/dashboard/src/lib/client-nav.ts` (or equivalent nav config) |
| **Affected features** | F-HP-01 |
| **Dependencies** | None — can be implemented independently |
| **Future implications** | New features are added to existing groups, not as new top-level items. Group structure must be maintained as the product grows. |
| **Roadmap phase** | Phase 3 (Information Architecture) |
| **Related open questions** | Q-PRD-01 (exact group names), Q-PRD-04 (notifications in sidebar vs. bell only), Q-UX-02 (grouping validation) |

---

## DD-02: Remove Studio from Top-Level Navigation

| Field | Value |
|-------|-------|
| **Decision** | Remove Studio as a top-level sidebar item. Access Studio exclusively via playlist edit/create actions. |
| **Problem addressed** | TD-003 (icon duplication), `04-information-architecture-review.md` §2.4 (Studio as destination misalignment) |
| **Context** | Studio is a canvas-based editor — a tool, not a destination. Users don't "go to Studio"; they "edit a playlist" which opens Studio. Having it as a separate nav item with the same icon as Playlists creates confusion. |
| **Evidence** | `26-consistency-audit.md` §26.6 (Clapperboard used for both); `10-mental-model-analysis.md` §4.2 (conceptual confusion); `06-user-journey-analysis.md` Journey 4 Step 3 |
| **Alternatives considered** | **A) Keep Studio, change icon** — rejected: doesn't fix the conceptual confusion. **B) Merge Playlists and Studio into one nav item** — rejected: Studio is a full-page editor, not a sub-page. **C) Remove from nav, access via playlist action** — accepted. |
| **Trade-offs** | **Gained:** clearer mental model, no icon duplication, reduced nav count. **Sacrificed:** direct access to Studio for users who want to experiment without a specific playlist. |
| **Reason** | Studio is always used in the context of a specific playlist. There is no "Studio without a playlist" workflow. Removing it from nav aligns the system model with the user mental model. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx`, `apps/dashboard/src/app/[locale]/studio/page.tsx` (redirect or remove) |
| **Affected features** | F-MP-03 (icon resolution), part of F-HP-01 |
| **Dependencies** | DD-01 (sidebar grouping) — should be done during the same phase |
| **Future implications** | If a "template editor" or "scratch canvas" is added in the future, it may warrant a separate entry point — but as a "Create New Playlist" dialog option, not a top-level nav item. |
| **Roadmap phase** | Phase 3 |
| **Related open questions** | Q-PRD-02 (Studio integration model — page vs. modal) |

---

## DD-03: Demote Branches from Top-Level Navigation

| Field | Value |
|-------|-------|
| **Decision** | Remove Branches from top-level sidebar. Make branches accessible as a filter within the Screens page and via dashboard cards. |
| **Problem addressed** | `04-information-architecture-review.md` §2.5 (branches as top-level misalignment) |
| **Context** | Users think "show me my screens" not "show me my branches." Branches are organizational containers, not primary destinations. Elevating them to top-level conflates the container with the content. |
| **Evidence** | `13-branches-feature.md` §13.13 (branches as workspace equivalent); `10-mental-model-analysis.md` §2.1 (entity hierarchy mismatch); `09-workflow-analysis.md` §2.1 (users think screens first) |
| **Alternatives considered** | **A) Keep Branches top-level, add Screens filter** — rejected: redundancy, two paths to same data. **B) Remove Branches entirely, URL-only access** — rejected: too hidden, some users manage branches as entities. **C) Demote to filter within Screens** — accepted. |
| **Trade-offs** | **Gained:** simpler nav, aligned mental model, no redundant screen lists. **Sacrificed:** branch management (create, edit, delete) needs a home — addressed via a "Manage Branches" link in the Screens filter bar or a settings sub-page. |
| **Reason** | Branches are filters, not destinations. The screen list with a branch filter provides the same information as the branch detail's screens tab, eliminating redundancy. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx`, `apps/dashboard/src/app/[locale]/screens/page.tsx` (add branch filter), `apps/dashboard/src/app/[locale]/branches/page.tsx` (keep accessible via URL) |
| **Affected features** | Part of F-HP-01, F-HP-03 (screen filter) |
| **Dependencies** | DD-01 (sidebar grouping), FilterBar component creation |
| **Future implications** | If branch-level analytics or branch-level scheduling becomes important, branches may need a more prominent entry point — but as a dashboard card, not a top-level nav item. |
| **Roadmap phase** | Phase 3 |
| **Related open questions** | Q-PRD-03 (branch repositioning — remove entirely vs. secondary nav) |

---

## DD-04: Workspace Switch Navigates to /overview

| Field | Value |
|-------|-------|
| **Decision** | Change workspace switcher navigation target from `/branches` to `/overview` |
| **Problem addressed** | IA-003 (switch navigates to /branches) |
| **Context** | After switching workspaces, users expect to see the dashboard — a summary of the new workspace's state. Navigating to the branch list forces users to drill into a branch before seeing any overview. |
| **Evidence** | `07-workspace-management.md` §7.11 (current behavior); `06-user-journey-analysis.md` Journey 6; `10-mental-model-analysis.md` §2.3 (workspace mental model mismatch) |
| **Alternatives considered** | **A) Navigate to last-visited page in that workspace** — rejected: adds state complexity, unpredictable. **B) Navigate to /screens** — rejected: screens require context (which branch?). **C) Navigate to /overview** — accepted. |
| **Trade-offs** | **Gained:** matches user expectation, provides workspace summary. **Sacrificed:** users who specifically want the branch list after switching need one extra click. |
| **Reason** | Overview is the universal landing page. It provides screen health, activity, and quick actions — exactly what a user needs when entering a new workspace. |
| **Affected files** | `apps/dashboard/src/components/workspace-switcher.tsx` |
| **Affected features** | F-HP-02 |
| **Dependencies** | None |
| **Future implications** | Consider persisting last-visited page per workspace as a future enhancement (Q-UX-01). |
| **Roadmap phase** | Phase 2 |
| **Related open questions** | Q-INT-01 (workspace switching behavior) |

---

## DD-05: Replace InfoTooltip with Radix UI Tooltip

| Field | Value |
|-------|-------|
| **Decision** | Install `@radix-ui/react-tooltip` and replace the custom `InfoTooltip` component with a Radix-based Tooltip |
| **Problem addressed** | P-005 / A-001 (InfoTooltip accessibility gap) |
| **Context** | The custom InfoTooltip uses `useState` for show/hide and a plain `div` for content. It lacks `role="tooltip"`, `aria-describedby`, keyboard focus support, and screen reader accessibility. |
| **Evidence** | `05-ui-component-library.md` §6.3; `24-accessibility-audit.md` §24.7; `03-root-cause-analysis.md` Major Issue 8 |
| **Alternatives considered** | **A) Add ARIA attributes to custom InfoTooltip** — rejected: doesn't solve keyboard focus, escape-to-dismiss, or delay control. **B) Use a different tooltip library (Tippy, Floating UI)** — rejected: Radix is already the component primitive standard. **C) Radix Tooltip** — accepted. |
| **Trade-offs** | **Gained:** WCAG 2.1 AA compliance, keyboard accessible, consistent with Radix-based component library. **Sacrificed:** minor behavioral differences (show/hide delay) — mitigated by configuring Radix delay. |
| **Reason** | Radix UI is the established primitive layer. `@radix-ui/react-tooltip` provides accessibility, keyboard support, and positioning out of the box. Using it aligns with the "Radix First" component principle (DD-14). |
| **Affected files** | `apps/dashboard/src/components/ui/info-tooltip.tsx` (replace), all files importing InfoTooltip |
| **Affected features** | F-MH-05 |
| **Dependencies** | Install `@radix-ui/react-tooltip` package |
| **Future implications** | All future tooltip implementations use the Radix Tooltip component. InfoTooltip is deprecated and removed. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-06: Standardize Loading States to Two Patterns

| Field | Value |
|-------|-------|
| **Decision** | Standardize all loading states to exactly two patterns: (1) Skeleton for page-level loading, (2) Spinner (`Loader2` with `animate-spin`) for action-level loading. Eliminate text-only "Loading..." messages. |
| **Problem addressed** | TD-001 (inconsistent loading states) |
| **Context** | The product currently uses three different loading patterns: skeleton components, spinner icons, and plain text "Loading..." messages. Different pages use different patterns, creating inconsistent perceived performance. |
| **Evidence** | `23-error-handling-and-states.md` §23.9; `08-dashboard-and-overview.md` §8.17; `11-cognitive-load-analysis.md` §2.2 |
| **Alternatives considered** | **A) Skeleton only** — rejected: skeletons are inappropriate for button-level loading. **B) Spinner only** — rejected: spinners don't show content layout, causing layout shift. **C) Two patterns (skeleton + spinner)** — accepted. **D) Progress bar for all** — rejected: progress bars require known duration, not available for API calls. |
| **Trade-offs** | **Gained:** consistency, reduced cognitive load, no layout shift on page loads. **Sacrificed:** slight implementation effort to create page-specific skeleton patterns. |
| **Reason** | Two patterns cover all use cases: skeletons show content structure (page loads), spinners show action in progress (button clicks, form submissions). Text-only loading provides no structural information and feels unprofessional. |
| **Affected files** | All page components with loading states; `apps/dashboard/src/components/ui/skeleton.tsx` (extend with pattern variants) |
| **Affected features** | F-MH-06 |
| **Dependencies** | None |
| **Future implications** | New pages must implement skeleton loading matching their layout. A `PageSkeleton` wrapper or per-page skeleton components should be created. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-07: Add Socket.IO Polling Fallback

| Field | Value |
|-------|-------|
| **Decision** | Change Socket.IO transport configuration from `transports: ['websocket']` to `transports: ['websocket', 'polling']` |
| **Problem addressed** | TD-006 (Socket.IO WebSocket-only transport) |
| **Context** | The current configuration forces WebSocket-only transport. On restricted networks (corporate proxies, public Wi-Fi, some load balancers), WebSocket connections fail silently with no fallback. |
| **Evidence** | `07-workspace-management.md` §7.11; `17-notifications.md` §17.7; `03-root-cause-analysis.md` Major Issue 12 |
| **Alternatives considered** | **A) Keep WebSocket-only, add reconnection logic** — rejected: doesn't solve the fundamental transport issue. **B) Switch to polling-only** — rejected: loses realtime performance. **C) WebSocket with polling fallback** — accepted. **D) Use SSE (Server-Sent Events)** — rejected: requires backend rewrite, SSE is unidirectional. |
| **Trade-offs** | **Gained:** connectivity on restricted networks, graceful degradation. **Sacrificed:** slightly higher server load when polling is active (mitigated by reasonable polling interval). |
| **Reason** | Socket.IO's built-in transport upgrade mechanism handles this automatically. Adding polling as a fallback ensures connectivity without sacrificing WebSocket performance when available. |
| **Affected files** | `apps/dashboard/src/providers/workspace-provider.tsx` (Socket.IO client config) |
| **Affected features** | F-MH-07 |
| **Dependencies** | None |
| **Future implications** | Server must handle polling connections. Monitor server load after deployment. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-08: Remove hasSuccessfulMeRef Guard

| Field | Value |
|-------|-------|
| **Decision** | Remove the `hasSuccessfulMeRef` optimization that skips subsequent `/auth/me` calls after the first success. Rely on SWR's built-in deduplication instead. |
| **Problem addressed** | TD-005 (silent error swallowing) |
| **Context** | The `hasSuccessfulMeRef` prevents re-calling `/auth/me` after the first success. If the session expires after the first success, subsequent auth check failures are silently swallowed — the user appears logged in but data is stale. |
| **Evidence** | `07-workspace-management.md` §7.11; `03-root-cause-analysis.md` Major Issue 13; `16-state-strategy.md` §2.6 |
| **Alternatives considered** | **A) Keep ref, add error handling** — rejected: the ref's purpose (skip calls) conflicts with error handling (need to call to detect errors). **B) Remove ref, rely on SWR dedup** — accepted. **C) Replace with time-based throttle** — rejected: unnecessary complexity, SWR already deduplicates. |
| **Trade-offs** | **Gained:** auth errors are properly handled, session expiry detected. **Sacrificed:** slightly more API calls (mitigated by SWR's `dedupingInterval`). |
| **Reason** | SWR's `dedupingInterval` (default 2s) already prevents redundant calls within a short window. The ref guard was a premature optimization that introduced a critical bug. |
| **Affected files** | `apps/dashboard/src/providers/workspace-provider.tsx` |
| **Affected features** | F-MH-08 |
| **Dependencies** | None |
| **Future implications** | Auth state is always fresh. Session expiry is detected and handled (redirect to login). |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-09: Unify Icon Stroke Width to 1.5

| Field | Value |
|-------|-------|
| **Decision** | Standardize all lucide-react icon stroke width to `1.5` via a single `ICON_STROKE` constant |
| **Problem addressed** | TD-002 / C-001 (inconsistent icon stroke width) |
| **Context** | Three different stroke widths are used across the codebase: 1.5 (EmptyState), 1.6 (sidebar `STROKE` constant), 2.0 (lucide default). This creates subtle visual inconsistency. |
| **Evidence** | `26-consistency-audit.md` §26.6; `02-design-system-and-tokens.md` §2.15 |
| **Alternatives considered** | **A) Use lucide default (2.0)** — rejected: too heavy for dense UIs. **B) Use 1.6** — rejected: arbitrary value, not a standard. **C) Use 1.5** — accepted: already the most widely used, provides a refined look. |
| **Trade-offs** | **Gained:** visual consistency, single source of truth. **Sacrificed:** icons may appear slightly thinner in some contexts (acceptable). |
| **Reason** | 1.5 is already used by the most components. It provides a clean, modern look that works well at both small (16px) and large (24px) sizes. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx` (STROKE constant), `apps/dashboard/src/components/ui/empty-state.tsx`, all components passing `strokeWidth` to icons |
| **Affected features** | F-MP-02 |
| **Dependencies** | None |
| **Future implications** | All new icons must use `ICON_STROKE` constant. No hardcoded `strokeWidth` props. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-10: Fix Switch Component RTL Using Logical Properties

| Field | Value |
|-------|-------|
| **Decision** | Fix the Switch thumb position in RTL by replacing `translate-x-4` with a logical-property-based approach (`rtl:translate-x-[-1rem]` or custom transform using `inset-inline-start`) |
| **Problem addressed** | P-001 / A-003 (Switch RTL bug) |
| **Context** | The Switch component uses Tailwind's `translate-x-4` for the checked state thumb position. `translate-x` is a physical property — it translates rightward in both LTR and RTL. In RTL mode, the thumb moves right when checked, but should move left. |
| **Evidence** | `05-ui-component-library.md` §6.2; `24-accessibility-audit.md` §24.7; `03-root-cause-analysis.md` Major Issue 3 |
| **Alternatives considered** | **A) Use `rtl:translate-x-[-1rem]`** — accepted: simple, uses Tailwind's `rtl:` variant. **B) Use CSS `inset-inline-start` with transform** — rejected: more complex, not all browsers support logical transforms. **C) Replace with Radix Switch (if available)** — check: if `@radix-ui/react-switch` handles RTL natively, this is preferred. |
| **Trade-offs** | **Gained:** correct visual behavior in RTL. **Sacrificed:** none — this is a bug fix. |
| **Reason** | The `rtl:` variant approach is the simplest fix that works with the existing Tailwind setup. If Radix Switch handles RTL natively, that would be even better — but the current Switch is already Radix-based (`@radix-ui/react-switch`), so the issue is in the custom styling layer. |
| **Affected files** | `apps/dashboard/src/components/ui/switch.tsx` |
| **Affected features** | F-MH-01 |
| **Dependencies** | None |
| **Future implications** | All components using physical CSS properties (`translate-x`, `left`, `right`) must be audited for RTL correctness. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-11: Add Workspace Switcher to Mobile Sidebar

| Field | Value |
|-------|-------|
| **Decision** | Add the WorkspaceSwitcher component to the top of the mobile sidebar drawer, before navigation items |
| **Problem addressed** | P-002 (no mobile workspace switcher) |
| **Context** | The workspace switcher is `hidden lg:flex` in the header and not included in the mobile sidebar drawer. Multi-workspace mobile users have no way to switch workspaces. |
| **Evidence** | `04-layout-and-shell.md` §4.3; `25-responsive-audit.md` §25.7; `06-user-journey-analysis.md` Journey 6 (mobile: friction 5/5 — blocked) |
| **Alternatives considered** | **A) Add to header on mobile** — rejected: header already has 5 controls on 375px width. **B) Add to mobile sidebar** — accepted. **C) Add as a floating action button** — rejected: non-standard, could overlap content. **D) Add bottom navigation with switcher** — deferred: bottom nav is a larger UX decision (Q-STK-02). |
| **Trade-offs** | **Gained:** mobile users can switch workspaces. **Sacrificed:** slightly taller mobile sidebar — acceptable since switcher is at the top. |
| **Reason** | The mobile sidebar is the natural location for navigation controls. Placing the switcher at the top (before nav items) makes it immediately visible when the drawer opens. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx` (mobile variant) |
| **Affected features** | F-MH-02 |
| **Dependencies** | None |
| **Future implications** | If bottom navigation is added in the future, the switcher may also be accessible from there. |
| **Roadmap phase** | Phase 2 |
| **Related open questions** | Q-STK-02 (mobile strategy) |

---

## DD-12: Fix Click Guards Using Pre-Render Check

| Field | Value |
|-------|-------|
| **Decision** | Replace the `e.preventDefault()` click guard approach with a pre-render check: if no workspace is active and the route requires one, render the NavItem as disabled with a tooltip explaining why |
| **Problem addressed** | P-003 (sidebar click guards broken) |
| **Context** | The current click guard uses `e.preventDefault()` inside an `onClick` handler on a Next.js `Link`. This doesn't reliably cancel Next.js client-side navigation. The toast never fires. Users navigate to broken pages. |
| **Evidence** | `03-routing-and-navigation.md` §3.3; `03-root-cause-analysis.md` Major Issue 4 |
| **Alternatives considered** | **A) Use `router.push` guard (check before navigation)** — rejected: requires replacing `Link` with `button` + `router.push`, loses prefetching. **B) Use middleware to redirect** — rejected: too heavy for a simple guard. **C) Pre-render disabled state** — accepted. **D) Keep `e.preventDefault()`, fix Next.js compatibility** — rejected: fragile, depends on Next.js internal implementation. |
| **Trade-offs** | **Gained:** reliable guard, clear visual feedback (disabled state), no broken pages. **Sacrificed:** users can't click to see the toast — but the disabled state + tooltip is better UX than a toast. |
| **Reason** | Prevention is better than recovery. A disabled nav item with a tooltip ("Select a workspace first") is clearer than allowing navigation and showing an error toast. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx` (NavItem component) |
| **Affected features** | F-MH-03 |
| **Dependencies** | DD-05 (Radix Tooltip for the disabled-state tooltip) |
| **Future implications** | All workspace-dependent routes use the same disabled-state pattern. |
| **Roadmap phase** | Phase 1 |
| **Related open questions** | None |

---

## DD-13: Fix Back Button Labels to Match Destinations

| Field | Value |
|-------|-------|
| **Decision** | Audit and fix all back button labels in `useShellHeaderMeta` to match their actual navigation targets |
| **Problem addressed** | P-004 / C-002 (back button label inconsistency) |
| **Context** | The screen detail back button says "Back to Overview" but navigates to `/screens`. Settings sub-pages have no back button at all. |
| **Evidence** | `03-routing-and-navigation.md` §3.4; `09-screens-feature.md` §9.8; `14-settings-feature.md` §14.8 |
| **Alternatives considered** | **A) Use browser history.back()** — rejected: unreliable, may exit the app. **B) Fix labels to match targets** — accepted. **C) Use generic "Back" label** — rejected: less helpful than specific labels. |
| **Trade-offs** | **Gained:** trust, navigation clarity. **Sacrificed:** none — this is a bug fix. |
| **Reason** | Labels must match destinations. "Back to Screens" when going to `/screens` is correct. Adding back buttons to settings sub-pages completes the navigation system. |
| **Affected files** | `apps/dashboard/src/hooks/use-shell-header-meta.ts` |
| **Affected features** | F-MH-04, F-MP-01 |
| **Dependencies** | None |
| **Future implications** | New routes must include back button metadata in `useShellHeaderMeta`. |
| **Roadmap phase** | Phase 1 (labels), Phase 2 (settings back button) |
| **Related open questions** | None |

---

## DD-14: Adopt "Radix First" Component Principle

| Field | Value |
|-------|-------|
| **Decision** | All interactive UI components must be built on Radix UI primitives. Custom implementations are only acceptable when no Radix primitive exists. |
| **Problem addressed** | P-005 (InfoTooltip), general component quality |
| **Context** | The product uses Radix UI for most primitives (Dialog, DropdownMenu, Select, Switch, Tabs, Checkbox, Label) but has custom implementations for some components (InfoTooltip) that lack accessibility. |
| **Evidence** | `01-architecture-and-stack.md` §1.6 (Radix dependencies); `05-ui-component-library.md` §6.3 (custom InfoTooltip); `15-component-strategy.md` §2.1 |
| **Alternatives considered** | **A) Use Headless UI instead** — rejected: Radix is already established, switching would require rewriting all components. **B) Build everything custom** — rejected: accessibility burden, maintenance cost. **C) Radix First** — accepted. |
| **Trade-offs** | **Gained:** accessibility out of the box, consistent behavior, community support. **Sacrificed:** bundle size (Radix packages), slight styling constraints. |
| **Reason** | Radix UI provides unstyled, accessible primitives that handle keyboard navigation, ARIA, focus management, and RTL. Building on Radix ensures accessibility without per-component effort. |
| **Affected files** | All component files in `apps/dashboard/src/components/ui/` |
| **Affected features** | F-MH-05, all future component work |
| **Dependencies** | None |
| **Future implications** | New components must check for Radix primitive availability before custom implementation. Missing Radix packages must be installed as needed. |
| **Roadmap phase** | Phase 1 (principle established), ongoing |
| **Related open questions** | None |

---

## DD-15: No Studio Architecture Refactoring During Transformation

| Field | Value |
|-------|-------|
| **Decision** | Do not refactor the Studio (Konva canvas editor) architecture during this transformation. Only add features (templates, auto-save, alignment guides). Architectural refactoring is a separate future project. |
| **Problem addressed** | Risk mitigation for R-11 |
| **Context** | The Studio is a complex Konva-based canvas editor with tightly coupled state management. Decomposing it into smaller components risks breaking the core content creation flow. |
| **Evidence** | `17-risk-analysis.md` R-11 (score: 15 — High); `10-playlists-and-studio.md` §10.12 |
| **Alternatives considered** | **A) Full Studio refactor** — rejected: risk score 15, blocks core feature. **B) Partial refactor (extract panels)** — rejected: Konva state coupling makes partial extraction risky. **C) Feature-only changes** — accepted. |
| **Trade-offs** | **Gained:** no risk to core feature, faster delivery of user-facing improvements. **Sacrificed:** technical debt in Studio architecture remains. |
| **Reason** | The Studio works. Breaking it to improve its architecture is not worth the risk during a transformation that already has 10 phases. Feature additions (templates, auto-save) provide user value without architectural risk. |
| **Affected files** | `apps/dashboard/src/features/playlists/playlist-studio.tsx` (and related) |
| **Affected features** | F-MP-13, F-MP-14, Phase 7 tasks |
| **Dependencies** | None |
| **Future implications** | Studio architectural refactoring should be planned as a separate project after the transformation is complete and stable. |
| **Roadmap phase** | Phase 7 (features only) |
| **Related open questions** | None |

---

## DD-16: Use SWR for All Server State (No Redux/Zustand)

| Field | Value |
|-------|-------|
| **Decision** | Continue using SWR as the sole server state manager. Do not introduce Redux, Zustand, or other state management libraries. |
| **Problem addressed** | State management consistency |
| **Context** | The product uses SWR for server state and React Context for application state. This is sufficient for the current and planned scale. |
| **Evidence** | `01-architecture-and-stack.md` §1.7; `16-state-strategy.md` §3.1 |
| **Alternatives considered** | **A) Add Redux Toolkit** — rejected: unnecessary complexity, SWR handles server state. **B) Add Zustand for local state** — rejected: `useState`/`useReducer` is sufficient. **C) Keep SWR + Context** — accepted. |
| **Trade-offs** | **Gained:** simplicity, smaller bundle, fewer dependencies. **Sacrificed:** no time-travel debugging, no centralized state inspector. |
| **Reason** | SWR's cache-based approach handles the primary state need (server data) efficiently. React Context handles application state (auth, workspace, theme). Adding another layer would increase complexity without proportional benefit. |
| **Affected files** | All data-fetching hooks, all context providers |
| **Affected features** | All |
| **Dependencies** | None |
| **Future implications** | If the product grows to require complex client-side state (e.g., collaborative editing), a dedicated state manager may be reconsidered. |
| **Roadmap phase** | Ongoing |
| **Related open questions** | None |

---

## DD-17: Tailwind CSS v3 as Sole Styling Solution

| Field | Value |
|-------|-------|
| **Decision** | Use Tailwind CSS v3 with logical CSS properties as the sole styling solution. Do not introduce CSS-in-JS, styled-components, or CSS modules. |
| **Problem addressed** | Styling consistency |
| **Context** | The product uses Tailwind CSS v3 with a custom config that includes logical properties for RTL support. All components use Tailwind utility classes. |
| **Evidence** | `01-architecture-and-stack.md` §1.3; `02-design-system-and-tokens.md` §2.20 |
| **Alternatives considered** | **A) CSS Modules** — rejected: would create a mixed styling approach. **B) styled-components** — rejected: runtime overhead, conflicts with Tailwind. **C) Tailwind only** — accepted. |
| **Trade-offs** | **Gained:** utility-first speed, consistent spacing/colors, RTL via logical properties. **Sacrificed:** long class names, some dynamic styling requires custom CSS. |
| **Reason** | Tailwind is already established, the team is familiar with it, and the design token system is built on CSS custom properties that integrate with Tailwind. |
| **Affected files** | All component files |
| **Affected features** | All |
| **Dependencies** | None |
| **Future implications** | When upgrading to Tailwind v4, verify logical property support and token migration. |
| **Roadmap phase** | Ongoing |
| **Related open questions** | None |

---

## DD-18: next-intl for Internationalization

| Field | Value |
|-------|-------|
| **Decision** | Continue using next-intl with URL-based locale routing and `NEXT_LOCALE` cookie persistence |
| **Problem addressed** | i18n consistency |
| **Context** | The product uses next-intl with `[locale]` route segment, `NEXT_LOCALE` cookie, and JSON message files for EN and AR. |
| **Evidence** | `01-architecture-and-stack.md` §1.5; `22-i18n-and-localization.md` §22.7 |
| **Alternatives considered** | **A) react-i18next** — rejected: next-intl has better Next.js App Router integration. **B) FormatJS/react-intl** — rejected: less Next.js integration. **C) next-intl** — accepted. |
| **Trade-offs** | **Gained:** server component support, type-safe messages, URL-based locale. **Sacrificed:** must maintain two JSON message files (EN, AR). |
| **Reason** | next-intl is designed for Next.js App Router, supports server and client components, and handles locale routing natively. |
| **Affected files** | `apps/dashboard/src/i18n/`, all components using `useTranslations` or `getTranslations` |
| **Affected features** | All i18n-related features |
| **Dependencies** | None |
| **Future implications** | Adding a third language requires a new JSON message file and locale config. Pluralization support (I-001) must be added using next-intl's ICU MessageFormat. |
| **Roadmap phase** | Ongoing; pluralization in Phase 10 |
| **Related open questions** | None |

---

## DD-19: Enterprise Features Require Backend First

| Field | Value |
|-------|-------|
| **Decision** | All enterprise features (SSO, RBAC, audit log, bulk operations, timezone scheduling) require backend implementation before frontend work begins. Frontend phases are blocked until backend APIs are ready. |
| **Problem addressed** | E-001 through E-005, dependency management |
| **Context** | Enterprise features require backend infrastructure that doesn't exist. Frontend work cannot proceed without API endpoints. |
| **Evidence** | `18-dependency-map.md` §6.1; `13-enterprise-saas-review.md` §4 |
| **Alternatives considered** | **A) Build frontend with mocked APIs** — rejected: wasted effort if API contract changes. **B) Wait for backend, then build frontend** — accepted. **C) Build frontend and backend simultaneously** — accepted for parallel tracks where API contract is agreed upfront. |
| **Trade-offs** | **Gained:** no wasted frontend work, correct API integration. **Sacrificed:** frontend team may be idle while waiting for backend. |
| **Reason** | Enterprise features have complex API contracts (SAML, RBAC permissions, audit schemas). Building frontend against mocks risks significant rework. |
| **Affected files** | Backend: `apps/backend/src/`; Frontend: enterprise feature pages |
| **Affected features** | F-HP-04, F-HP-05, F-HP-06, F-HP-08, F-HP-10, F-HP-11 |
| **Dependencies** | Backend sprint planning, API contract agreement |
| **Future implications** | Backend and frontend teams must coordinate API contracts before either begins implementation. |
| **Roadmap phase** | Phase 5–9 (varies by feature) |
| **Related open questions** | Q-BIZ-01 (SSO provider), Q-BIZ-02 (RBAC model), Q-TEC-01 (backend feasibility) |

---

## DD-20: Phased Sidebar Rollout

| Field | Value |
|-------|-------|
| **Decision** | Roll out sidebar restructuring in three sub-phases: (1) add group headers without removing items, (2) collapse groups, (3) reorder within groups. Each sub-phase separated by 2 weeks. |
| **Problem addressed** | R-01 (sidebar restructuring breaks user habits) |
| **Context** | Changing 18 nav item locations simultaneously will confuse users who have developed muscle memory. |
| **Evidence** | `17-risk-analysis.md` R-01 (score: 12 — High) |
| **Alternatives considered** | **A) Big-bang change** — rejected: high confusion risk. **B) Phased rollout** — accepted. **C) A/B test** — rejected: navigation is not suitable for A/B testing (users need consistency). |
| **Trade-offs** | **Gained:** gradual adaptation, lower support ticket spike. **Sacrificed:** longer transition period (6 weeks total). |
| **Reason** | Users adapt to visual changes gradually. Adding group headers first (without moving items) lets users learn the group structure. Collapsing groups then reduces scanning. Reordering last fixes spatial positions. |
| **Affected files** | `apps/dashboard/src/components/shell-sidebar.tsx` |
| **Affected features** | F-HP-01 |
| **Dependencies** | None |
| **Future implications** | This pattern (phased rollout) should be used for any future navigation changes. |
| **Roadmap phase** | Phase 3 |
| **Related open questions** | None |

---

## DD-21: Split WorkspaceProvider into Smaller Contexts

| Field | Value |
|-------|-------|
| **Decision** | Split `WorkspaceProvider` into `AuthProvider` (auth state), `WorkspaceContext` (workspace data), and `ImpersonationContext` (impersonation state) |
| **Problem addressed** | `16-state-strategy.md` §2.2 (context performance) |
| **Context** | `WorkspaceProvider` manages auth, workspace, super-admin, impersonation, Socket.IO, and data epochs. Any value change re-renders all consumers. |
| **Evidence** | `07-workspace-management.md` §7.11; `16-state-strategy.md` §2.2 |
| **Alternatives considered** | **A) Keep single provider, use useMemo/useCallback** — rejected: already done, doesn't prevent all re-renders. **B) Split into three contexts** — accepted. **C) Use external state manager** — rejected: DD-16 (SWR + Context only). |
| **Trade-offs** | **Gained:** fewer re-renders (auth changes don't re-render workspace consumers). **Sacrificed:** more providers to compose, potential race conditions during split. |
| **Reason** | Auth state changes rarely (login, logout, session expiry). Workspace state changes on switch. Impersonation changes rarely. Splitting prevents unnecessary re-renders. |
| **Affected files** | `apps/dashboard/src/providers/workspace-provider.tsx` (split into 3 files) |
| **Affected features** | All (infrastructure change) |
| **Dependencies** | Comprehensive tests before refactoring (R-02 mitigation) |
| **Future implications** | New state categories should be added as separate contexts, not appended to existing ones. |
| **Roadmap phase** | Phase 10 (Polish) — low risk if tests are in place |
| **Related open questions** | None |

---

## DD-22: WCAG 2.1 AA as Accessibility Standard

| Field | Value |
|-------|-------|
| **Decision** | Adopt WCAG 2.1 Level AA as the accessibility standard. All components and pages must meet AA criteria. |
| **Problem addressed** | A-001 through A-004 |
| **Context** | The product has accessibility gaps: InfoTooltip missing ARIA, button touch targets below 44px, color contrast issues, Switch RTL bug affecting screen readers. |
| **Evidence** | `24-accessibility-audit.md` §24.7; `14-design-system-direction.md` §4.1 |
| **Alternatives considered** | **A) WCAG 2.1 Level AAA** — rejected: too restrictive for some UI patterns (e.g., 7:1 contrast for all text). **B) WCAG 2.1 Level A** — rejected: insufficient (doesn't include contrast minimum). **C) WCAG 2.1 Level AA** — accepted. **D) Section 508** — rejected: subset of WCAG, less comprehensive. |
| **Trade-offs** | **Gained:** compliance with international standard, enterprise customer requirement. **Sacrificed:** some design constraints (contrast ratios, touch target sizes). |
| **Reason** | WCAG 2.1 AA is the industry standard for web accessibility. It's required for government contracts, expected by enterprise customers, and provides a clear, testable criteria set. |
| **Affected files** | All component and page files |
| **Affected features** | F-HP-15, F-HP-16, F-MH-01, F-MH-05 |
| **Dependencies** | None |
| **Future implications** | All new components must pass WCAG 2.1 AA checklist before merge. Accessibility testing (axe-core) should be added to CI. |
| **Roadmap phase** | Phase 1 (fixes), Phase 10 (audit + CI) |
| **Related open questions** | None |

---

## DD-23: Keep Password Auth as SSO Fallback

| Field | Value |
|-------|-------|
| **Decision** | When SSO/SAML is implemented, keep the existing password-based authentication as a fallback option |
| **Problem addressed** | R-08 (SSO integration changes auth flow) |
| **Context** | SSO redirect flow is fundamentally different from form-based auth. If SSO fails (IdP outage, misconfiguration), users must still be able to log in. |
| **Evidence** | `17-risk-analysis.md` R-08 (score: 12 — High) |
| **Alternatives considered** | **A) SSO-only (remove password auth)** — rejected: single point of failure. **B) SSO primary, password fallback** — accepted. **C) Password primary, SSO optional** — rejected: enterprise customers want SSO as primary. |
| **Trade-offs** | **Gained:** resilience, no lockout on IdP failure. **Sacrificed:** slightly more complex auth UI (two login options). |
| **Reason** | IdP outages happen. Removing password auth creates a single point of failure. Enterprise customers understand and accept password fallback. |
| **Affected files** | `apps/dashboard/src/features/auth/login-form.tsx`, `apps/dashboard/src/app/[locale]/login/page.tsx` |
| **Affected features** | F-HP-11 |
| **Dependencies** | Backend SSO implementation |
| **Future implications** | Login page shows SSO button + password form. SSO can be enforced per-workspace (admin setting) in the future. |
| **Roadmap phase** | Phase 9 |
| **Related open questions** | Q-BIZ-01 (SSO provider priority) |

---

## DD-24: Do Not Implement Bottom Navigation (Current Scope)

| Field | Value |
|-------|-------|
| **Decision** | Do not implement mobile bottom navigation during this transformation. Keep the sidebar drawer pattern. Revisit after mobile usage analytics are available. |
| **Problem addressed** | R-12 (mobile navigation changes) |
| **Context** | Bottom navigation is a major mobile UX pattern change. Without data on mobile usage patterns, implementing it risks disrupting users who have adapted to the sidebar drawer. |
| **Evidence** | `22-open-questions.md` Q-STK-02 (mobile strategy), Q-ANA-05 (mobile vs. desktop usage) |
| **Alternatives considered** | **A) Implement bottom nav now** — rejected: no usage data to justify. **B) Keep sidebar drawer** — accepted. **C) A/B test bottom nav vs. sidebar** — deferred: requires analytics infrastructure. |
| **Trade-offs** | **Gained:** no disruption to existing mobile users. **Sacrificed:** mobile UX may not be optimal (sidebar drawer is less thumb-friendly than bottom nav). |
| **Reason** | Without analytics on mobile usage patterns, changing the navigation paradigm is speculative. The sidebar drawer works — it just needs the workspace switcher added (DD-11). |
| **Affected files** | None (decision to NOT change) |
| **Affected features** | None |
| **Dependencies** | Q-ANA-05 (mobile usage analytics) — must be resolved before reconsidering |
| **Future implications** | Bottom navigation may be revisited after Phase 10 when analytics data is available. |
| **Roadmap phase** | Deferred |
| **Related open questions** | Q-STK-02, Q-ANA-05 |

---

## DD-25: Use CVA for All Component Variants

| Field | Value |
|-------|-------|
| **Decision** | All components with visual variants must use `class-variance-authority` (CVA) for variant management |
| **Problem addressed** | Component consistency |
| **Context** | Button and Badge already use CVA. Other components (EmptyState, Skeleton) lack variant management, leading to ad-hoc styling. |
| **Evidence** | `02-design-system-and-tokens.md` §2.6 (Button CVA); `15-component-strategy.md` §2.2 |
| **Alternatives considered** | **A) Use Tailwind variants plugin** — rejected: less type-safe. **B) Use conditional className strings** — rejected: error-prone, not type-safe. **C) CVA** — accepted. |
| **Trade-offs** | **Gained:** type-safe variants, consistent API, compile-time validation. **Sacrificed:** slightly more boilerplate per component. |
| **Reason** | CVA provides type-safe variant definitions with autocomplete and compile-time checking. It's already used for Button and Badge — extending to all variant-bearing components ensures consistency. |
| **Affected files** | `apps/dashboard/src/components/ui/empty-state.tsx`, `apps/dashboard/src/components/ui/skeleton.tsx`, all future variant-bearing components |
| **Affected features** | All component-related features |
| **Dependencies** | None |
| **Future implications** | No component should use conditional className strings for variants. All variants go through CVA. |
| **Roadmap phase** | Ongoing |
| **Related open questions** | None |

---

## Decision Traceability Summary

| Decision | Problem IDs | Feature IDs | Phase | Risk ID |
|----------|------------|-------------|-------|---------|
| DD-01 | IA-001, IA-002 | F-HP-01 | 3 | R-01 |
| DD-02 | TD-003 | F-MP-03 | 3 | — |
| DD-03 | — | F-HP-01, F-HP-03 | 3 | — |
| DD-04 | IA-003 | F-HP-02 | 2 | — |
| DD-05 | P-005 | F-MH-05 | 1 | R-03 |
| DD-06 | TD-001 | F-MH-06 | 1 | — |
| DD-07 | TD-006 | F-MH-07 | 1 | R-05 |
| DD-08 | TD-005 | F-MH-08 | 1 | R-06 |
| DD-09 | TD-002 | F-MP-02 | 1 | — |
| DD-10 | P-001 | F-MH-01 | 1 | — |
| DD-11 | P-002 | F-MH-02 | 2 | R-12 |
| DD-12 | P-003 | F-MH-03 | 1 | — |
| DD-13 | P-004 | F-MH-04, F-MP-01 | 1-2 | — |
| DD-14 | P-005 | F-MH-05 | 1 | — |
| DD-15 | — | Phase 7 | 7 | R-11 |
| DD-16 | — | All | Ongoing | — |
| DD-17 | — | All | Ongoing | — |
| DD-18 | I-001, I-002 | All i18n | Ongoing | — |
| DD-19 | E-001–E-005 | F-HP-04–11 | 5–9 | — |
| DD-20 | IA-001 | F-HP-01 | 3 | R-01 |
| DD-21 | — | All | 10 | R-02 |
| DD-22 | A-001–A-004 | F-HP-15, F-HP-16 | 1, 10 | — |
| DD-23 | E-001 | F-HP-11 | 9 | R-08 |
| DD-24 | — | — | Deferred | R-12 |
| DD-25 | — | All components | Ongoing | — |

---

## Cross-References

- See `02-problem-map.md` for problem ID definitions
- See `08-feature-priorities.md` for feature ID definitions
- See `17-risk-analysis.md` for risk ID definitions
- See `18-dependency-map.md` for dependency graph
- See `19-redesign-roadmap.md` for phase definitions
- See `22-open-questions.md` for unresolved questions
- See `25-design-constraints.md` for constraints that bound these decisions
- See `26-product-principles.md` for principles that guide these decisions
