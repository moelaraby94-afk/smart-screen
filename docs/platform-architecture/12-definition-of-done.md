# 12 — Definition of Done

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Acceptance criteria and completion definition for each phase of the platform-customer separation

---

## 1. Current State

The platform currently has no formal definition of done for the admin/customer separation. This document defines the acceptance criteria for each phase, the overall project completion criteria, and the verification methods.

---

## 2. Problems

### 2.1 No Phase Gate Criteria

Without explicit acceptance criteria, there is no objective measure of when a phase is complete. This leads to:
- Ambiguous progress reporting
- Premature advancement to the next phase
- Undiscovered regressions
- Scope creep within phases

### 2.2 No Verification Automation

Currently, verification is manual (running builds, clicking through pages). There are no automated tests for:
- Admin route accessibility per role
- JWT audience validation
- Impersonation flow end-to-end
- Cross-origin API calls
- Settings migration integrity

### 2.3 No Rollback Criteria

There is no documented criteria for when to roll back a phase. Without this, the team may hesitate to roll back when issues are found, leading to prolonged instability.

---

## 3. Target Architecture

### 3.1 Phase 1: Frontend Separation — Definition of Done

#### Functional Criteria

- [ ] `apps/control-panel` exists as a standalone Next.js application
- [ ] Control Panel builds independently: `npm run build --workspace apps/control-panel` succeeds
- [ ] Control Panel starts independently: `npm run dev --workspace apps/control-panel` serves on port 3003
- [ ] All admin pages render in Control Panel:
  - [ ] `/admin` (Dashboard Home with stats)
  - [ ] `/admin/customers` (Customer list)
  - [ ] `/admin/customers/[id]` (Customer profile)
  - [ ] `/admin/customers/[id]/workspaces/[wid]` (Workspace detail)
  - [ ] `/admin/staff` (Staff list)
  - [ ] `/admin/users` (User list)
  - [ ] `/admin/workspaces` (Workspace list)
  - [ ] `/admin/fleet` (Fleet screen list)
  - [ ] `/admin/screens` (Screen list)
  - [ ] `/admin/logs` (Audit logs)
  - [ ] `/admin/settings` (Platform settings)
  - [ ] `/admin/feature-flags` (Feature flags)
  - [ ] `/admin/billing` (Billing)
- [ ] All admin API calls succeed from Control Panel
- [ ] PlatformContext provides auth state without workspace data
- [ ] ControlPanelShell renders without `sovereign` logic
- [ ] Panel sidebar shows role-filtered navigation
- [ ] Branding (logo, platform name) loads from `/branding` endpoint
- [ ] i18n works in Arabic and English
- [ ] RTL layout works correctly

#### Non-Functional Criteria

- [ ] `packages/ui` is imported by both applications
- [ ] `packages/api-client` (or equivalent) is imported by both applications
- [ ] No `@/features/workspace/*` imports in Control Panel
- [ ] No `@/features/admin/*` imports in Customer Dashboard (during Phase 1, dashboard still has admin routes, but Control Panel should not import workspace features)
- [ ] Customer Dashboard still serves admin routes (backward compatible)
- [ ] Customer Dashboard builds and runs without errors
- [ ] Docker Compose includes Control Panel service
- [ ] CI/CD pipeline builds Control Panel

#### Verification Methods

- [ ] Manual: Click through all Control Panel pages as super admin
- [ ] Manual: Click through all Control Panel pages as support specialist (verify role-filtered sidebar)
- [ ] Manual: Click through all Control Panel pages as billing manager (verify role-filtered sidebar)
- [ ] Manual: Verify Customer Dashboard still serves `/admin/*` routes
- [ ] Automated: `npm run build --workspace apps/control-panel` succeeds
- [ ] Automated: `npm run build --workspace apps/dashboard` succeeds
- [ ] Automated: `npx tsc --noEmit --project apps/control-panel/tsconfig.json` passes
- [ ] Automated: `npx eslint apps/control-panel/src/` passes
- [ ] Automated: `npx tsc --noEmit --project apps/dashboard/tsconfig.json` passes
- [ ] Automated: `npx eslint apps/dashboard/src/` passes

#### Rollback Criteria

- Roll back if: Control Panel fails to build, any admin page is non-functional, or Customer Dashboard is broken
- Roll back method: Revert Control Panel deployment. Customer Dashboard continues serving admin routes.

---

### 3.2 Phase 2: API Partitioning — Definition of Done

#### Functional Criteria

- [ ] JWT tokens include `audience` claim (`platform` or `customer`)
- [ ] Login endpoint accepts optional `audience` parameter
- [ ] Login with `audience: 'platform'` validates `isSuperAdmin` or `platformStaffRole`
- [ ] Login without `audience` (or `audience: 'customer'`) issues customer token (backward compatible)
- [ ] `PlatformAudienceGuard` rejects non-platform tokens on `/admin/*` routes
- [ ] `CustomerAudienceGuard` allows customer and platform tokens on customer routes
- [ ] Existing tokens without `audience` continue working on customer routes
- [ ] Control Panel login requests `audience: 'platform'`
- [ ] Customer Dashboard login requests `audience: 'customer'` (or omits it)

#### Non-Functional Criteria

- [ ] No existing API route changes (paths remain the same)
- [ ] No database schema changes
- [ ] All existing backend tests pass
- [ ] No new dependencies added

#### Verification Methods

- [ ] Manual: Login via Control Panel → verify token has `audience: 'platform'`
- [ ] Manual: Login via Customer Dashboard → verify token has `audience: 'customer'`
- [ ] Manual: Use platform token on customer route → succeeds (for impersonation/support)
- [ ] Manual: Use customer token on `/admin/*` route → rejected with 403
- [ ] Manual: Use old token (no audience) on customer route → succeeds
- [ ] Automated: `npm run test --workspace apps/backend` passes
- [ ] Automated: `npm run build --workspace apps/backend` passes

#### Rollback Criteria

- Roll back if: Any existing token is rejected, any API call fails, or login is broken
- Roll back method: Remove audience guards from module decorators. Tokens with `audience` claim continue working (claim is ignored).

---

### 3.3 Phase 3: Full Separation — Definition of Done

#### Functional Criteria

- [ ] `POST /auth/exchange-impersonation` endpoint exists and works
- [ ] Control Panel impersonation redirects to Customer Dashboard
- [ ] Customer Dashboard `/auth/impersonate` page exchanges token and sets cookies
- [ ] Impersonation banner is shown when `impersonatedBy` claim is present
- [ ] "Return to Control Panel" link exits impersonation and redirects to Control Panel
- [ ] `/admin/*` on Customer Dashboard redirects to `admin.cloudsignage.com/admin/*`
- [ ] `apps/dashboard/src/app/[locale]/(shell)/admin/` directory is deleted
- [ ] `apps/dashboard/src/features/admin/` directory is deleted
- [ ] `CrystalShell` has no `sovereign` logic
- [ ] `ShellSidebar` has no `sovereign` prop
- [ ] `WorkspaceContext` has no `isSuperAdmin` state
- [ ] `cs_super_admin` sessionStorage key is not used
- [ ] `ImpersonationReturnButton` is removed (replaced by `ImpersonationBanner`)
- [ ] All customer features work correctly (overview, screens, content, scheduling, campaigns, analytics, team, settings, billing)

#### Non-Functional Criteria

- [ ] No `@/features/admin/*` imports in Customer Dashboard
- [ ] No `isSuperAdmin` references in Customer Dashboard (except impersonation banner)
- [ ] No `sovereign` references in Customer Dashboard
- [ ] Customer Dashboard bundle size decreases (admin code removed)
- [ ] Control Panel is the sole entry point for platform staff

#### Verification Methods

- [ ] Manual: Super admin impersonates customer from Control Panel → redirected to Customer Dashboard → banner shown → can use customer features → return to Control Panel
- [ ] Manual: Navigate to `app.cloudsignage.com/admin/customers` → redirected to `admin.cloudsignage.com/admin/customers`
- [ ] Manual: All customer features work (click through every sidebar item)
- [ ] Automated: `grep -r "isSuperAdmin" apps/dashboard/src/` returns only `impersonation-banner.tsx`
- [ ] Automated: `grep -r "sovereign" apps/dashboard/src/` returns zero results
- [ ] Automated: `grep -r "cs_super_admin" apps/dashboard/src/` returns zero results
- [ ] Automated: `ls apps/dashboard/src/app/[locale]/(shell)/admin/` returns "No such file or directory"
- [ ] Automated: `ls apps/dashboard/src/features/admin/` returns "No such file or directory"
- [ ] Automated: `npm run build --workspace apps/dashboard` succeeds
- [ ] Automated: `npm run build --workspace apps/control-panel` succeeds
- [ ] Automated: `npx tsc --noEmit` passes for both apps
- [ ] Automated: `npx eslint` passes for both apps

#### Rollback Criteria

- Roll back if: Impersonation flow is broken, any customer feature is broken, or redirect loop occurs
- Roll back method: Restore `admin/` directory and `features/admin/` directory from git. Restore `CrystalShell` and `WorkspaceContext` from pre-Phase-3 commit. Remove exchange endpoint.

---

### 3.4 Phase 4: Platform Settings Migration — Definition of Done

#### Functional Criteria

- [ ] `PlatformSettings` table exists in database
- [ ] Migration script runs successfully: `npx tsx scripts/migrate-admin-runtime.ts`
- [ ] `AdminService.getSettings()` reads from database
- [ ] `AdminService.updateSettings()` writes to database
- [ ] `BrandingController.getBranding()` reads from database
- [ ] Branding upload still works (saves files to `.data/branding/`, metadata in DB)
- [ ] `admin-runtime.store.ts` is deleted
- [ ] `.data/admin-runtime.json` is removed (after verification)
- [ ] Platform settings are consistent across multiple backend instances

#### Non-Functional Criteria

- [ ] No file system reads for platform settings (except branding asset files)
- [ ] Settings updates are transactional (Prisma handles this)
- [ ] No new API routes (existing `/admin/settings` endpoint works)

#### Verification Methods

- [ ] Manual: View settings in Control Panel → values match pre-migration
- [ ] Manual: Update settings in Control Panel → values persist after restart
- [ ] Manual: Upload branding image → image displays correctly
- [ ] Manual: Verify branding on Customer Dashboard (logo, platform name)
- [ ] Automated: `npx prisma migrate dev --name add_platform_settings` succeeds
- [ ] Automated: Migration script exits with code 0
- [ ] Automated: `grep -r "admin-runtime.store" apps/backend/src/` returns zero results
- [ ] Automated: `npm run build --workspace apps/backend` succeeds
- [ ] Automated: `npm run test --workspace apps/backend` passes

#### Rollback Criteria

- Roll back if: Settings are lost, branding is broken, or backend fails to start
- Roll back method: Restore `admin-runtime.store.ts` from git. Restore `.data/admin-runtime.json` from backup. Revert Prisma migration.

---

### 3.5 Overall Project Completion — Definition of Done

#### All Phases Complete

- [ ] Phase 1 acceptance criteria met
- [ ] Phase 2 acceptance criteria met
- [ ] Phase 3 acceptance criteria met
- [ ] Phase 4 acceptance criteria met

#### Architecture Goals Achieved

- [ ] Control Panel and Customer Dashboard are independently deployable
- [ ] Control Panel and Customer Dashboard have independent CI/CD pipelines
- [ ] JWT tokens carry `audience` claims
- [ ] Platform routes reject customer-audience tokens
- [ ] Customer routes reject customer-audience tokens without workspace membership (except impersonation)
- [ ] Impersonation uses cross-system redirect flow
- [ ] Platform settings are stored in PostgreSQL
- [ ] No admin code exists in Customer Dashboard
- [ ] No customer workspace context exists in Control Panel

#### Documentation Updated

- [ ] `docs/platform-architecture/` documents are updated to reflect final state
- [ ] `README.md` updated with new application structure
- [ ] `docker-compose.yml` includes Control Panel service
- [ ] `.github/workflows/ci.yml` includes Control Panel build job
- [ ] `docs/COMPLIANCE_ROADMAP.md` updated with new architecture

#### Monitoring in Place

- [ ] Sentry projects for both Control Panel and Customer Dashboard
- [ ] Health check endpoints monitored for both applications
- [ ] Deployment notifications configured for both applications

---

## 4. Recommended Solution

### 4.1 Create Automated Verification Scripts

Create `scripts/verify-separation.sh` that checks:

```bash
#!/bin/bash
# Phase 3 verification

# No admin code in dashboard
test ! -d apps/dashboard/src/app/\[locale\]/\(shell\)/admin && echo "✓ Admin routes removed" || echo "✗ Admin routes still exist"
test ! -d apps/dashboard/src/features/admin && echo "✓ Admin features removed" || echo "✗ Admin features still exist"

# No sovereign references
grep -r "sovereign" apps/dashboard/src/ --include="*.tsx" --include="*.ts" -l | wc -l | xargs test 0 -eq && echo "✓ No sovereign references" || echo "✗ Sovereign references found"

# No isSuperAdmin in dashboard (except impersonation banner)
grep -r "isSuperAdmin" apps/dashboard/src/ --include="*.tsx" --include="*.ts" -l | grep -v "impersonation-banner" | wc -l | xargs test 0 -eq && echo "✓ No isSuperAdmin references (except banner)" || echo "✗ isSuperAdmin references found"

# Control Panel builds
npm run build --workspace apps/control-panel && echo "✓ Control Panel builds" || echo "✗ Control Panel build failed"

# Dashboard builds
npm run build --workspace apps/dashboard && echo "✓ Dashboard builds" || echo "✗ Dashboard build failed"
```

### 4.2 Create E2E Test for Impersonation Flow

Add a Playwright E2E test that:
1. Logs in as super admin in Control Panel
2. Navigates to a customer
3. Clicks "Impersonate"
4. Verifies redirect to Customer Dashboard
5. Verifies impersonation banner is shown
6. Clicks "Return to Control Panel"
7. Verifies return to Control Panel

### 4.3 Document Rollback Procedures

Create `docs/platform-architecture/rollback-procedures.md` with step-by-step rollback instructions for each phase.

---

## 5. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Acceptance criteria too strict, blocking progress | Medium | Criteria are binary (pass/fail). If a criterion is not met, fix it before advancing. |
| Acceptance criteria too loose, allowing regressions | Medium | Use automated checks where possible. Manual verification for UI/UX criteria. |
| Rollback criteria not followed | High | Document rollback procedures. Empower team to roll back without approval. |
| Phase gate becomes bureaucratic bottleneck | Low | Keep criteria focused on functional and verification outcomes, not process. |

---

## 6. Alternatives

### 6.1 No Formal Definition of Done

Continue without explicit acceptance criteria.

**Pros:** No overhead.
**Cons:** Ambiguous progress, regressions undetected, premature phase advancement.

**Verdict:** Rejected. Formal criteria are essential for a multi-phase migration.

### 6.2 Continuous Deployment (No Phase Gates)

Deploy changes continuously without phase gates.

**Pros:** Faster delivery.
**Cons:** Higher risk of regressions, no rollback point.

**Verdict:** Rejected for this migration. Phase gates provide clear rollback points and verification opportunities.

---

## 7. Migration Notes

- **Each phase has its own definition of done.** Do not advance to the next phase until all criteria are met.
- **Automated checks are preferred over manual checks.** Add automated checks wherever possible.
- **Rollback criteria are as important as acceptance criteria.** Document and communicate them.
- **The overall project is not complete until all four phases are done** and the architecture goals are achieved.

---

## 8. Open Questions

1. **Should we require a staging deployment before production for each phase?** Yes, recommended.
2. **Should we require user acceptance testing (UAT) for Phase 3?** Recommended for impersonation flow.
3. **Should we add performance benchmarks** (e.g., Control Panel load time < 2s)? Recommended.
4. **Should we require security audit after Phase 2?** Recommended if resources allow.
5. **Should we monitor for mixed-audience token usage** (e.g., alert when a platform token accesses a customer route)?

---

## 9. Final Recommendation

Adopt the four-phase definition of done with binary acceptance criteria. Use automated verification scripts wherever possible. Document rollback procedures for each phase. Do not advance to the next phase until all criteria for the current phase are met.

The most critical criteria are:
1. **Phase 1:** Both applications build and run independently
2. **Phase 2:** JWT audience validation works without breaking existing tokens
3. **Phase 3:** Impersonation flow works end-to-end and no admin code remains in dashboard
4. **Phase 4:** Platform settings are in the database and consistent across instances

Create the verification script (`scripts/verify-separation.sh`) and E2E test before starting Phase 3, as Phase 3 is the highest-risk phase.
