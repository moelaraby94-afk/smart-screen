# Account-Level Members — UI/UX Audit

> **Evidence basis:** `screen-specifications/08-team-spec.md`, `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-TM-01, `user-flow-architecture/12-team-flows.md`, `product-architecture/09-product-modules.md` M-06, `product-architecture/17-product-rules.md` PR-33–PR-38, backend `workspaces.controller.ts`, frontend `team-client.tsx`, `team-api.ts`
>
> **Purpose:** Document and audit the Account-Level Members feature against existing UI/UX standards, identify gaps, and recommend compliance fixes.

---

## 1. Feature Overview

### What It Does
The Account-Level Members section allows a workspace owner/admin to:
- Create new user accounts with direct credentials (email, full name, password)
- Assign account-level roles (ADMIN, EDITOR, VIEWER)
- Assign workspace scopes (specific workspace + role pairs)
- Change account member roles
- Remove account members

### Backend Support
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/workspaces/account/members` | GET | List all account members |
| `/workspaces/account/workspaces` | GET | List all workspaces for scope assignment |
| `/workspaces/account/members` | POST | Create new user + account membership |
| `/workspaces/account/members/add` | POST | Add existing user to account |
| `/workspaces/account/members/:id/role` | PATCH | Change account member role |
| `/workspaces/account/members/:id` | DELETE | Remove account member |

**Verdict:** Backend fully supports this feature. All endpoints exist and are functional.

---

## 2. Documentation Status

| Document | Mentions Account Members? | Details |
|----------|--------------------------|---------|
| `08-team-spec.md` | ❌ No | Only workspace-level members + invites |
| `10-scheduling-analytics-team-ux-blueprint.md` | ❌ No | Only P-TM-01 workspace team |
| `12-team-flows.md` | ❌ No | Only FL-TM-01 (invite), FL-TM-02 (role change), FL-TM-03 (permission denied) |
| `09-product-modules.md` M-06 | ❌ No | Only workspace-level team management |
| `17-product-rules.md` PR-33–38 | ❌ No | Only workspace-level permissions |
| `06-page-catalog.md` P-TM-01 | ❌ No | Single team page, no account-level section |
| `16-team-feature.md` | ❌ No | Documents workspace members + invites only |
| `EXECUTION_PLAN.md` Task 2.1-2.3 | ❌ No | Only workspace-level role/remove/cancel |

**Conclusion:** Account-Level Members is an **undocumented feature** with full backend support but zero frontend documentation coverage.

---

## 3. UI/UX Compliance Audit

### 3.1 Layout Compliance (against `08-team-spec.md` standards)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AL1 | Container: `max-w-[1000px] mx-auto` | ❌ | Uses full-width card with `lg:grid-cols-[1fr_380px]` — no max-width constraint |
| AL2 | Sections: `flex flex-col gap-6` | ❌ | Uses `space-y-8` instead of `flex-col gap-6` |
| AL3 | Section header format: "Section Name (N)" | ❌ | Header says "Account members" without count |
| AL4 | Card surface styling | ✅ | Uses `vc-card-surface rounded-2xl border border-border` |
| AL5 | Padding: `p-8` inside card | ✅ | Uses `p-8` |

### 3.2 Component Compliance (against `08-team-spec.md` MemberRow)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AC1 | Avatar 32px round with initials | ❌ | No avatar rendered — only name + email text |
| AC2 | Name (bold) | ✅ | `font-medium text-foreground` |
| AC3 | Email (muted) | ✅ | `text-sm text-muted-foreground` |
| AC4 | Role dropdown with aria-label | ✅ | Has `aria-label={t('changeRoleAria', { name })}` |
| AC5 | "More" menu with "Remove Member" | ⚠️ Partial | Has direct trash button instead of "More" dropdown menu |
| AC6 | Role badge for OWNER | ❌ | No special OWNER badge — all roles use same dropdown |
| AC7 | Joined date display | ✅ | Shows `joinedAt` with locale formatting |

### 3.3 Create Form Compliance (against `08-team-spec.md` Invite Dialog)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AF1 | Dialog (modal) not inline form | ❌ | Inline form in right column — not a Dialog component |
| AF2 | Email validation on blur | ❌ | No client-side email validation |
| AF3 | Required field validation | ⚠️ Partial | Checks `!createEmail.trim() || !createName.trim() || !createPassword.trim()` but shows toast, not inline error |
| AF4 | Loading state on submit button | ✅ | Shows `creating` text + disables button |
| AF5 | Success: toast + list refresh | ✅ | Toast + `loadAccountMembers()` |
| AF6 | Error: inline message | ❌ | Shows toast only, no inline error display |
| AF7 | Password field | ✅ | Has password input with `type="password"` |
| AF8 | Role selector with descriptions | ⚠️ Partial | Has role selector but no descriptions for account-level roles |
| AF9 | Workspace scopes UI | ✅ | Has workspace scope selector with add/remove |

### 3.4 Permissions Compliance (against `08-team-spec.md` + `17-product-rules.md`)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AP1 | Create account member: Owner/Admin only | ❌ | No permission check — visible to all roles |
| AP2 | Change account role: Owner/Admin only | ❌ | No permission check — dropdown visible to all |
| AP3 | Remove account member: Owner/Admin only | ❌ | No permission check — remove button visible to all |
| AP4 | View account members: All roles | ✅ | Visible to all (but should it be?) |

### 3.5 States Compliance (against `08-team-spec.md` States)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AS1 | Skeleton loading | ✅ | Uses `ListSkeleton count={3}` |
| AS2 | Empty state | ✅ | Uses `EmptyState` component with action |
| AS3 | Error state + retry | ❌ | Silently sets empty array on API failure |
| AS4 | No loading state for role change | ⚠️ | Dropdown disables during update but no spinner |

### 3.6 Accessibility Compliance (against `08-team-spec.md` Accessibility)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AA1 | Section: `role="region"` with `aria-label` | ❌ | Missing |
| AA2 | Member list: `role="list"` + items `role="listitem"` | ❌ | Uses plain `<ul>/<li>` without ARIA roles |
| AA3 | Role dropdown: `aria-label` with member name | ✅ | Has `aria-label={t('changeRoleAria')}` |
| AA4 | Remove button: `aria-label="Remove [Name]"` | ❌ | No aria-label on trash button |
| AA5 | Create form: labels associated with inputs | ✅ | Uses `<Label htmlFor>` + `id` on inputs |
| AA6 | Keyboard: Tab through all interactive elements | ✅ | Native HTML elements, keyboard accessible |

### 3.7 Responsive Compliance (against `08-team-spec.md` Responsive)

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AR1 | Mobile: single column | ⚠️ | `lg:grid-cols-[1fr_380px]` collapses to single column on mobile ✅, but rows use `flex-wrap` causing inconsistent stacking |
| AR2 | Full width on mobile | ✅ | No max-width constraint |
| AR3 | Touch targets ≥ 44px | ❌ | Remove button is `h-8 w-8` (32px) — below 44px minimum |

### 3.8 Security Compliance

| # | Requirement | Status | Details |
|---|-------------|--------|---------|
| AS1 | Password minimum length | ❌ | No client-side minimum length validation (placeholder says "Minimum 8 characters" but not enforced) |
| AS2 | Password visibility toggle | ❌ | No show/hide password toggle |
| AS3 | Create with raw password | ⚠️ | Password sent in plaintext JSON — depends on HTTPS |

---

## 4. Identified Issues

### Critical
| ID | Issue | Impact | Fix |
|----|-------|--------|-----|
| AC-C1 | No permission checks | Any user can create/remove account members | Hide section for non-OWNER/ADMIN |
| AC-C2 | No password validation | Weak passwords accepted | Add min 8 char client-side validation |

### High
| ID | Issue | Impact | Fix |
|----|-------|--------|-----|
| AC-H1 | No avatars | Inconsistent with workspace member rows | Add 32px round avatar with initials |
| AC-H2 | No error state | API failures silently show empty list | Add error state + retry button |
| AC-H3 | No aria-labels on remove | Screen readers can't identify action target | Add `aria-label="Remove [Name]"` |
| AC-H4 | No section count in header | User can't see member count at a glance | Add "(N)" to section header |

### Medium
| ID | Issue | Impact | Fix |
|----|-------|--------|-----|
| AC-M1 | No role descriptions | User doesn't know what each role does | Add descriptions like workspace invite form |
| AC-M2 | Touch targets too small | Fails WCAG 2.1 SC 2.5.5 | Increase to h-11 (44px) on mobile |
| AC-M3 | No `role="region"` | Screen readers can't navigate to section | Add `role="region"` + `aria-label` |
| AC-M4 | No `role="list"` on member list | Screen readers don't announce list semantics | Add `role="list"` + `role="listitem"` |

### Low
| ID | Issue | Impact | Fix |
|----|-------|--------|-----|
| AC-L1 | No password visibility toggle | User can't verify typed password | Add show/hide toggle |
| AC-L2 | No password strength indicator | User doesn't know if password is strong | Add strength meter (future) |

---

## 5. Recommendations

### Immediate Fixes (with workspace team page rewrite)
1. Add permission checks — hide entire section for non-OWNER/ADMIN
2. Add avatars with initials (32px round)
3. Add error state + retry
4. Add aria-labels on remove buttons
5. Add section count "(N)" to header
6. Add `role="region"` + `aria-label` on section
7. Add `role="list"` + `role="listitem"` on member list
8. Add password min-length validation (8 chars)
9. Increase touch targets to 44px on mobile

### Documentation Updates (recommended)
1. Add Account-Level Members section to `08-team-spec.md`
2. Add FL-TM-04 (Account Member Creation) to `12-team-flows.md`
3. Update `10-scheduling-analytics-team-ux-blueprint.md` P-TM-01 with account members
4. Update `09-product-modules.md` M-06 with account-level scope
5. Update `17-product-rules.md` with account-level permission rules

### Future Improvements
1. Password visibility toggle
2. Password strength meter
3. Bulk account member creation
4. Account member activity log
5. Account member detail page

---

## 6. Compliance Score

| Category | Items | Pass | Fail/Partial | Compliance |
|----------|-------|------|-------------|-----------|
| Layout | 5 | 2 | 3 | 40% |
| Components | 7 | 3 | 4 | 43% |
| Create Form | 9 | 4 | 5 | 44% |
| Permissions | 4 | 1 | 3 | 25% |
| States | 4 | 2 | 2 | 50% |
| Accessibility | 6 | 3 | 3 | 50% |
| Responsive | 3 | 2 | 1 | 67% |
| Security | 3 | 0 | 3 | 0% |
| **Overall** | **41** | **17** | **24** | **~41%** |

---

## Cross-References
- See `08-team-spec.md` for workspace team spec (which this feature extends)
- See `12-team-flows.md` for workspace team flows
- See `10-scheduling-analytics-team-ux-blueprint.md` P-TM-01 for team UX
- See `workspaces.controller.ts` lines 52-101 for backend endpoints
- See `team-client.tsx` lines 542-746 for frontend implementation
- See `team-api.ts` lines 76-134 for API functions
