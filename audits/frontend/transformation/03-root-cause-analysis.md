# Root Cause Analysis

> **Evidence basis:** All V1/V2 audit files, source code review
> **Purpose:** Explain **why** each major issue exists — which architectural, UX, product, technical, and assumption-based decisions created them

---

## Analysis Framework

For every major issue identified in `02-problem-map.md`, this document traces the causal chain backward:

1. **Architectural decisions** — structural choices in code organization, data flow, or rendering strategy
2. **UX decisions** — interaction design choices that prioritized one outcome over another
3. **Product decisions** — feature scope, target market, or release priority choices
4. **Technical constraints** — limitations imposed by the technology stack
5. **Assumptions** — implicit beliefs about users, scale, or usage patterns that turned out to be incomplete

---

## Major Issue 1: Flat Sidebar Navigation (IA-001)

### Why does it exist?

**Architectural decision:** The sidebar navigation data is defined as a flat array of route objects, each with `href`, `labelKey`, and `icon`. There is no grouping structure in the data model. The `ShellSidebar` component maps over this array and renders each item sequentially.

**UX decision:** A flat list was chosen because it's the simplest navigation pattern — no expand/collapse, no nested state, no group headers. For an MVP with 8-10 items, this is reasonable. The problem emerged as features were added incrementally.

**Product decision:** Features were added one at a time without an IA review. Each new feature got a new sidebar item. No one stepped back to ask "should these be grouped?" until the list reached 18 items.

**Assumption:** The team assumed the feature set was stable. The flat list was sufficient at 8 items and the breaking point (15+ items) was crossed gradually without a triggering event.

**Root cause category:** Product decision (no IA governance) + UX decision (simplest pattern)

### Why it wasn't caught earlier?

The admin sidebar uses grouped sections (`03-routing-and-navigation.md` §3.2), which means the team **knew** grouping was possible. The client sidebar was never refactored because:
- No user complaints (users adapt to bad navigation silently)
- No analytics on sidebar item usage frequency
- No IA review process in the development workflow

---

## Major Issue 2: No Workspace Switcher on Mobile (P-002)

### Why does it exist?

**Architectural decision:** The `ShellHeader` component uses responsive visibility classes (`hidden lg:flex`) to hide the workspace switcher below the `lg` breakpoint. The mobile sidebar drawer (`ShellSidebar` mobile variant) does not include a `WorkspaceSwitcher` — it only contains navigation items and the bottom bar (theme toggle, language switcher, logout).

**UX decision:** The header was designed for desktop first. On mobile, the header has limited horizontal space (375px) and already contains: menu button, back button, page title, search, bell, avatar. Adding the workspace switcher would overflow the header.

**Technical constraint:** The `WorkspaceSwitcher` is a dropdown component with a minimum width of `min(100%, min(420px, calc(100vw - 8rem)))` (`25-responsive-audit.md` §25.6). On a 375px screen, this leaves very little room for other header controls.

**Assumption:** The team assumed mobile users would use the sidebar drawer to switch workspaces. But the sidebar drawer doesn't include a switcher — this was an oversight, not a deliberate exclusion.

**Root cause category:** UX decision (desktop-first header) + oversight (sidebar drawer missing switcher)

### Why it wasn't caught earlier?

Mobile testing likely focused on individual page usability rather than cross-workspace workflows. A user with only one workspace (the majority of initial users) would never encounter this issue.

---

## Major Issue 3: Switch Component RTL Bug (P-001)

### Why does it exist?

**Technical constraint:** Tailwind CSS v3 does not have a logical property equivalent for `translate-x`. The `translate-x-4` utility translates in the physical X direction (rightward in LTR, but also rightward in RTL — it doesn't flip). The correct approach would be to use `rtl:translate-x-[-1rem]` or a custom transform with `inset-inline-start`.

**UX decision:** The Switch component was built on Radix UI Switch, which handles the checked state and ARIA attributes correctly. The visual thumb position was customized with Tailwind classes, and the `translate-x-4` was added without considering RTL.

**Assumption:** The developer assumed `translate-x` would flip in RTL mode because other Tailwind logical properties (`ms-`, `ps-`, `start-`) do flip. This is a reasonable but incorrect assumption — `translate-x` is a physical property, not a logical one.

**Root cause category:** Technical constraint (Tailwind lacks logical translate) + assumption (translate-x flips in RTL)

### Why it wasn't caught earlier?

- Only 2 test files exist (`28-feature-inventory.md` §28.5) — no RTL-specific tests
- The Switch component is used primarily in settings pages, which may not have been tested in RTL mode
- Visual testing in RTL mode is not part of the CI pipeline

---

## Major Issue 4: Sidebar Click Guards Logically Broken (P-003)

### Why does it exist?

**Architectural decision:** The click guard logic in `ShellSidebar` NavItem uses `e.preventDefault()` inside an `onClick` handler on a `Link` component. In Next.js, `Link` uses client-side navigation via `router.push()`. The `e.preventDefault()` in a React synthetic event handler may not effectively cancel the Next.js Link navigation in all cases.

**UX decision:** The intent was correct — prevent navigation to workspace-dependent pages when no workspace is active, and show a toast guiding the user to select a workspace. The implementation is flawed.

**Technical constraint:** Next.js `Link` component's navigation behavior with `e.preventDefault()` is inconsistent — it depends on the internal implementation of the Link component and may vary across Next.js versions.

**Root cause category:** Technical constraint (Next.js Link + preventDefault) + implementation error

### Why it wasn't caught earlier?

- The edge case (authenticated user with no workspaces) is rare in production — most users create a workspace during onboarding
- No E2E test covers this scenario
- The toast never fires, so there's no visible error — the user just navigates to a broken page

---

## Major Issue 5: Inconsistent Loading State Patterns (TD-001)

### Why does it exist?

**Architectural decision:** There is no shared loading state pattern or component. Each page/component implements its own loading state independently. There's no `LoadingState` or `PageSkeleton` wrapper component that enforces consistency.

**UX decision:** Each developer chose what felt appropriate for their page — skeletons for card grids, spinners for gates, text for dashboards. No design system guideline exists for loading states.

**Product decision:** Loading states were treated as implementation details rather than design system components. No design spec was created for loading patterns.

**Assumption:** The team assumed loading states were trivial and didn't require standardization. In practice, loading states significantly affect perceived performance and user trust.

**Root cause category:** Architectural decision (no shared pattern) + product decision (no design spec)

### Why it wasn't caught earlier?

- No design system audit was performed until the V2 audit
- Different pages were developed by different developers at different times
- The inconsistency is subtle — each loading pattern works individually

---

## Major Issue 6: No Bulk Operations (E-004)

### Why does it exist?

**Product decision:** The initial target market was SMBs with small fleets (1-10 screens). Bulk operations are unnecessary when you have 5 screens. The feature was deferred to focus on core functionality.

**UX decision:** List views were designed as card grids (screens) and simple grids (media) — neither pattern naturally supports multi-select. Adding checkboxes and an action bar requires a different list pattern.

**Assumption:** The team assumed users would grow slowly and bulk operations could be added later. In practice, the product needs to serve larger fleets to be commercially viable.

**Root cause category:** Product decision (SMB focus) + UX decision (card grid pattern)

### Why it wasn't caught earlier?

- SMB users don't need bulk operations, so no complaints
- Enterprise users haven't been surveyed
- The card grid pattern makes bulk selection feel like a major redesign rather than an additive feature

---

## Major Issue 7: No Timezone-Aware Scheduling (E-005)

### Why does it exist?

**Product decision:** The initial market is Saudi Arabia — a single-timezone market (Arabia Standard Time, UTC+3). Multi-timezone support was not needed for the launch market.

**Assumption:** The team assumed deployments would remain within a single timezone. This assumption breaks for:
- Chains with locations in different countries (GCC spans multiple timezones)
- Franchise operators with international locations
- Any expansion beyond the GCC region

**Technical constraint:** Timezone support requires:
- Timezone selection in the schedule UI (dropdown of IANA timezones)
- Backend storage of timezone with each schedule
- Display conversion based on viewer's timezone
- DST handling

**Root cause category:** Product decision (single-market focus) + assumption (single timezone)

### Why it wasn't caught earlier?

- Saudi Arabia is UTC+3 with no DST — timezone issues are invisible
- No multi-country deployments yet
- Schedule feature works correctly within a single timezone

---

## Major Issue 8: InfoTooltip Accessibility Gap (P-005)

### Why does it exist?

**Architectural decision:** The `InfoTooltip` was built as a custom component using `useState` for show/hide and a `div` for tooltip content. It does not use Radix UI Tooltip (which is not in the dependency list — `01-architecture-and-stack.md` §1.6 shows `@radix-ui/react-tooltip` is not installed).

**UX decision:** The custom implementation was faster to build than integrating a new Radix dependency. The tooltip works visually — it shows on hover and hides on leave. The accessibility gap is invisible to sighted users.

**Assumption:** The developer assumed a simple show/hide div was sufficient for a tooltip. They didn't consider screen reader users who need `role="tooltip"` and `aria-describedby` to access tooltip content.

**Root cause category:** Architectural decision (custom vs. Radix) + assumption (visual = accessible)

### Why it wasn't caught earlier?

- No accessibility audit was performed until the V2 audit
- `@radix-ui/react-tooltip` was never installed, so there was no "easy path" to accessibility
- Screen reader testing is not part of the QA process

---

## Major Issue 9: Workspace Switching Navigates to /branches (IA-003)

### Why does it exist?

**UX decision:** The `WorkspaceSwitcher` navigates to `/branches` after switching because branches are the primary organizational unit within a workspace. The reasoning was: "show the user their locations first, then they can drill into a specific branch."

**Assumption:** The team assumed users want to see their branch list after switching workspaces. In practice, users expect to see the dashboard (`/overview`) — it provides a summary of the new workspace's state (screen health, activity, quick actions).

**Product decision:** No user research was conducted to validate the navigation destination after workspace switching.

**Root cause category:** UX decision (branches-first) + assumption (users want branch list) + product decision (no user research)

### Why it wasn't caught earlier?

- Most users have only one workspace and never switch
- Multi-workspace users adapted to the behavior
- No analytics on post-switch navigation patterns

---

## Major Issue 10: No SSO/SAML (E-001)

### Why does it exist?

**Product decision:** SSO is an enterprise feature that requires significant backend investment (SAML/OIDC protocol, identity provider integration, user provisioning). The initial target market (SMBs in Saudi Arabia) doesn't require SSO.

**Assumption:** The team assumed SSO could be added later when enterprise customers demanded it. In practice, enterprise sales cycles are long, and SSO is often a **hard requirement** in RFPs — it can't be a "coming soon" feature.

**Technical constraint:** SSO requires backend infrastructure that doesn't exist:
- SAML/OIDC endpoint
- Identity provider configuration UI
- User mapping (SSO user → Smart Screen user)
- Session management for SSO-authenticated users

**Root cause category:** Product decision (SMB focus) + technical constraint (no backend SSO)

### Why it wasn't caught earlier?

- SMB customers don't ask for SSO
- Enterprise customers haven't been actively pursued
- SSO is invisible in the product until an enterprise prospect asks for it

---

## Major Issue 11: No Audit Log for Admin Actions (E-002)

### Why does it exist?

**Product decision:** Audit logging was not prioritized because the initial customer base doesn't have compliance requirements. SMBs in the digital signage market typically don't have dedicated compliance officers or audit requirements.

**Assumption:** The team assumed audit logging could be added reactively when a customer requires it. In practice, audit logging is a **foundation** feature — adding it retroactively means historical actions are lost.

**Technical constraint:** Audit logging requires:
- Backend middleware to capture all admin actions
- Database schema for audit log entries
- Frontend UI for viewing and filtering audit logs
- Retention policy and data lifecycle management

**Root cause category:** Product decision (no compliance focus) + technical constraint (no audit infrastructure)

### Why it wasn't caught earlier?

- No enterprise customers with compliance requirements
- Impersonation works correctly — the gap is in accountability, not functionality
- No security audit was performed until the V2 audit

---

## Major Issue 12: Socket.IO WebSocket-Only Transport (TD-006)

### Why does it exist?

**Technical decision:** `transports: ['websocket']` was set explicitly to avoid the overhead of HTTP polling. WebSocket is faster, uses less bandwidth, and provides true bidirectional communication. The default Socket.IO behavior is to upgrade from polling to WebSocket, but the explicit setting skips the polling phase entirely.

**Assumption:** The team assumed WebSocket would be available in all deployment environments. In practice:
- Corporate proxies often block WebSocket upgrades
- Some public Wi-Fi networks block non-HTTP traffic
- Load balancers may not be configured for WebSocket
- Docker networking may not properly proxy WebSocket connections

**Root cause category:** Technical decision (performance optimization) + assumption (universal WebSocket support)

### Why it wasn't caught earlier?

- Development and testing environments support WebSocket
- No testing on restricted networks (corporate VPN, public Wi-Fi)
- Socket.IO failures are silent — no error message, no retry, no fallback

---

## Major Issue 13: hasSuccessfulMeRef Silent Error Swallowing (TD-005)

### Why does it exist?

**Architectural decision:** The `hasSuccessfulMeRef` was added as a performance optimization — after the first successful `/auth/me` call, subsequent calls are skipped to reduce API load. The ref is a `useRef(false)` that is set to `true` after the first success.

**UX decision:** The optimization prioritized performance over error recovery. If the first call succeeds but a later call fails (e.g., session expired), the error is silently swallowed because the ref prevents the error handler from running.

**Assumption:** The team assumed that if the first `/auth/me` call succeeds, subsequent calls would also succeed. This assumption breaks when:
- The session expires between calls
- The backend restarts and loses session state
- Network connectivity is lost after the first success

**Root cause category:** Architectural decision (performance optimization) + assumption (session stability)

### Why it wasn't caught earlier?

- Session expiration during a single page visit is rare
- The silent failure doesn't produce any visible error — the user appears logged in
- No monitoring for stale session states

---

## Cross-Cutting Root Causes

### 1. No Design System Governance

Multiple issues (TD-001, TD-002, TD-003, C-004) stem from the same root cause: **no design system governance process**. The design system has tokens and components, but no:
- Loading state pattern guidelines
- Icon usage guidelines (which icon for which concept)
- Stroke width standard (single value enforced)
- Responsive grid pattern standard
- Component creation review process

**Impact:** 4 problems (TD-001, TD-002, TD-003, C-004)
**Fix:** Establish design system guidelines and enforce through component review

### 2. No Accessibility Testing

Multiple issues (P-005, A-002, A-004, P-001) stem from the same root cause: **no accessibility testing in the development process**. There are no:
- Screen reader tests
- Keyboard-only navigation tests
- RTL-specific tests
- Contrast checking in CI
- WCAG compliance checklist

**Impact:** 4 problems (P-001, P-005, A-002, A-004)
**Fix:** Add accessibility testing to QA process and CI pipeline

### 3. No IA Review Process

Multiple issues (IA-001, IA-002, IA-003, IA-004) stem from the same root cause: **no information architecture review process**. Features are added without:
- Evaluating navigation impact
- Grouping related features
- Validating user mental model alignment
- Considering scalability of the navigation structure

**Impact:** 4 problems (IA-001, IA-002, IA-003, IA-004)
**Fix:** Establish IA review as part of feature planning

### 4. SMB-First Product Strategy

Multiple issues (E-001, E-002, E-003, E-004, E-005) stem from the same root cause: **SMB-first product strategy**. Enterprise features were deferred because the initial market is SMBs. This is a valid business strategy, but the transition to enterprise requires:
- SSO/SAML
- Audit logging
- Custom roles
- Bulk operations
- Timezone-aware scheduling

**Impact:** 5 problems (E-001 through E-005)
**Fix:** Execute enterprise feature roadmap (see `20-implementation-phases.md`)

### 5. No Test Coverage

Issue TD-007 (insufficient test coverage) is both a root cause and a symptom. Without tests:
- RTL bugs aren't caught (P-001)
- Click guard logic isn't verified (P-003)
- Loading state consistency isn't enforced (TD-001)
- Session recovery isn't tested (TD-005)

**Impact:** Enables 4 other problems
**Fix:** Add unit and E2E tests for critical paths
