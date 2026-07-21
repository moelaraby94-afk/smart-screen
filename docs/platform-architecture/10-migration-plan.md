# 10 — Migration Plan

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Phased migration plan for separating Platform Control Panel from Customer Dashboard

---

## 1. Current State

The Smart Screen platform is a monorepo with:
- `apps/backend` — NestJS API (shared by all frontends)
- `apps/dashboard` — Next.js (serves both admin and customer routes)
- `apps/player` — Next.js (screen playback)
- `apps/marketing` — Next.js (public site)
- `packages/config`, `packages/ui` — shared packages (currently empty `.gitkeep` only)

The admin section lives within the dashboard at `/admin/*` routes, using the same `CrystalShell` layout with a `sovereign` mode toggle.

---

## 2. Problems

### 2.1 Migration Risks

- **User disruption:** Super admins may lose access if the migration is botched
- **Impersonation flow breakage:** The current in-app impersonation must continue working until the cross-system flow is ready
- **Shared code extraction:** Shared components and utilities must be extracted before the separation
- **Deployment complexity:** Adding a new application to the monorepo requires CI/CD, Docker, and infrastructure changes

### 2.2 Backward Compatibility

- Existing super admin bookmarks (`/admin/*` on the dashboard domain) must redirect to the Control Panel
- Existing JWT tokens must continue working during the transition
- The backend API must not change its route structure

---

## 3. Target Architecture

Four-phase migration with zero downtime:

| Phase | Goal | Breaking? | Duration |
|---|---|---|---|
| Phase 1 | Frontend separation (non-breaking) | No | 2–3 weeks |
| Phase 2 | API partitioning with JWT audience | No (additive) | 1–2 weeks |
| Phase 3 | Full separation (breaking) | Yes (admin routes removed from dashboard) | 1 week |
| Phase 4 | Platform settings migration | No | 3–5 days |

---

## 4. Recommended Solution

### Phase 1: Frontend Separation (Non-Breaking)

**Goal:** Create `apps/control-panel` as a new Next.js application. Both dashboard and Control Panel serve admin routes simultaneously.

#### Step 1.1: Extract Shared Packages

Before creating the new application, extract shared code:

1. **`packages/ui`** — Extract UI components:
   - Move `apps/dashboard/src/components/ui/*` to `packages/ui/src/*`
   - Re-export from `apps/dashboard/src/components/ui/index.ts` for backward compatibility
   - Both apps import from `@smart-screen/ui`

2. **`packages/config`** — Extract shared configuration:
   - `tailwind.config.ts` (shared base)
   - `tsconfig.base.json` (already exists at root)
   - ESLint config (shared base)
   - i18n message keys (shared base — app-specific keys stay in each app)

3. **`packages/api-client`** — Extract API utilities:
   - `apiFetch` function (from `apps/dashboard/src/features/auth/session.ts`)
   - Token management utilities
   - Error handling utilities

#### Step 1.2: Create `apps/control-panel`

1. Initialize Next.js app with App Router:
   ```bash
   npx create-next-app@latest apps/control-panel --typescript --tailwind --app --src-dir
   ```

2. Configure `next-intl` (matching dashboard setup)
3. Configure TailwindCSS (import from `packages/config`)
4. Add `@smart-screen/ui` and `@smart-screen/api-client` dependencies
5. Set up `next.config.ts` with API proxy to backend

#### Step 1.3: Copy Admin Features

Copy files from dashboard to Control Panel:

| Source | Destination | Modifications |
|---|---|---|
| `apps/dashboard/src/features/admin/*` | `apps/control-panel/src/features/*` | Replace `@/features/workspace/workspace-context` with `@/features/auth/platform-context` |
| `apps/dashboard/src/features/dashboard/admin-overview.tsx` | `apps/control-panel/src/features/stats/admin-overview.tsx` | Update imports |
| `apps/dashboard/src/app/[locale]/(shell)/admin/*` | `apps/control-panel/src/app/[locale]/(panel)/*` | Replace `AdminSectionShell` with `ControlPanelShell` |
| `apps/dashboard/src/components/layout/shell-sidebar.tsx` (sovereign section) | `apps/control-panel/src/components/layout/panel-sidebar.tsx` | Remove customer nav, remove `sovereign` prop |
| `apps/dashboard/src/components/impersonation-return-button.tsx` | `apps/control-panel/src/components/impersonation-return-button.tsx` | Update redirect URL |

#### Step 1.4: Create PlatformContext

Create `apps/control-panel/src/features/auth/platform-context.tsx`:

```typescript
type PlatformContextValue = {
  isAuthenticated: boolean;
  isLoading: boolean;
  staffId: string | null;
  staffEmail: string | null;
  staffName: string | null;
  platformStaffRole: PlatformStaffRole | null;
  isSuperAdmin: boolean;
};
```

This context does NOT load workspace data. It only manages platform staff identity.

#### Step 1.5: Create ControlPanelShell

Create `apps/control-panel/src/components/layout/panel-shell.tsx`:
- Dedicated sidebar (always admin nav)
- Dedicated header (no workspace switcher)
- No `WorkspaceGate`
- No `sovereign` logic
- Branding provider (shared)

#### Step 1.6: Deploy Control Panel

1. Add `apps/control-panel` service to `docker-compose.yml`
2. Add CI/CD build job for Control Panel
3. Deploy to staging at `admin.staging.smartscreen.com`
4. Test all admin features
5. Deploy to production at `admin.smartscreen.com`

**During Phase 1, both `app.smartscreen.com/admin/*` and `admin.smartscreen.com/admin/*` work.**

#### Step 1.6: Acceptance Criteria

- [ ] `apps/control-panel` builds and runs independently
- [ ] All admin pages render correctly in Control Panel
- [ ] All admin API calls work from Control Panel
- [ ] Customer Dashboard still serves admin routes (backward compatible)
- [ ] Shared packages (`@smart-screen/ui`, `@smart-screen/api-client`) are imported correctly
- [ ] i18n works in both Arabic and English
- [ ] Branding (logo, platform name) loads correctly
- [ ] Docker Compose runs both applications
- [ ] CI/CD builds both applications

---

### Phase 2: API Partitioning (Non-Breaking)

**Goal:** Add JWT audience claims and audience validation. Non-breaking — existing tokens without audience are treated as `customer`.

#### Step 2.1: Add Audience to JWT

Modify `AuthService.login()` and `AuthService.refresh()`:
- Add `audience` field to JWT payload
- Login accepts optional `audience` parameter in request body
- If `audience: 'platform'`, validate that user has `isSuperAdmin` or `platformStaffRole`
- Default `audience: 'customer'` if not specified (backward compatible)

#### Step 2.2: Add Audience Validation Guards

Create two new guards:

```typescript
// platform-audience.guard.ts
@Injectable()
export class PlatformAudienceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const audience = req.user?.audience ?? 'customer';
    if (audience !== 'platform') {
      throw new ForbiddenException('Platform audience required');
    }
    return true;
  }
}

// customer-audience.guard.ts
@Injectable()
export class CustomerAudienceGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const audience = req.user?.audience ?? 'customer';
    if (audience !== 'customer' && audience !== 'platform') {
      throw new ForbiddenException('Invalid audience');
    }
    return true;
  }
}
```

Apply:
- `AdminModule` controllers → add `PlatformAudienceGuard` before `PlatformStaffDbGuard`
- Customer controllers → add `CustomerAudienceGuard` before `RolesGuard`

#### Step 2.3: Update Control Panel Login

Modify Control Panel login page to send `audience: 'platform'` in the login request.

#### Step 2.4: Test

- Existing customer tokens (no audience) → work on customer routes ✅
- Existing customer tokens (no audience) → rejected by admin routes (via PlatformStaffDbGuard, which checks `isSuperAdmin`) ✅
- New platform tokens (audience: 'platform') → work on admin routes ✅
- New platform tokens (audience: 'platform') → work on customer routes (for impersonation) ✅
- New customer tokens (audience: 'customer') → rejected by admin routes ✅

#### Step 2.4: Acceptance Criteria

- [ ] JWT tokens include `audience` claim
- [ ] PlatformAudienceGuard rejects non-platform tokens on `/admin/*` routes
- [ ] CustomerAudienceGuard allows both customer and platform tokens on customer routes
- [ ] Existing tokens without `audience` continue working (backward compatible)
- [ ] Control Panel login requests `audience: 'platform'`
- [ ] Customer Dashboard login requests `audience: 'customer'` (or omits it)
- [ ] All existing tests pass

---

### Phase 3: Full Separation (Breaking)

**Goal:** Remove admin routes from Customer Dashboard. Add cross-system impersonation flow.

#### Step 3.1: Add Exchange Impersonation Endpoint

Add `POST /auth/exchange-impersonation` to `AuthController`:
- Request: `{ exchangeToken: string }`
- Validate exchange token in Redis (key: `impersonation:exchange:{token}`, TTL 30s)
- Issue customer-audience access + refresh tokens with `impersonatedBy` claim
- Delete exchange token from Redis (one-time use)

Modify `AuthService.issueImpersonation()`:
- Instead of returning tokens directly, generate a one-time exchange token
- Store `{ actorId, targetId }` in Redis with 30s TTL
- Return `{ exchangeToken, redirectUrl: 'https://app.smartscreen.com/[locale]/auth/impersonate?token=EXCHANGE_TOKEN' }`

#### Step 3.2: Add Impersonation Exchange Page to Customer Dashboard

Create `apps/dashboard/src/app/[locale]/(auth)/impersonate/page.tsx`:
- Read `token` from query parameters
- Call `POST /auth/exchange-impersonation` with the token
- On success: set cookies, redirect to `/overview`
- On failure: show error, redirect to `/login`

#### Step 3.3: Update Control Panel Impersonation

Modify Control Panel's impersonation action:
- Call `POST /admin/users/:id/impersonate`
- Receive `{ exchangeToken, redirectUrl }`
- Redirect browser to `redirectUrl`

#### Step 3.4: Add Impersonation Banner to Customer Dashboard

Create `apps/dashboard/src/components/impersonation-banner.tsx`:
- Read `impersonatedBy` from JWT (via `WorkspaceContext`)
- Show banner: "You are impersonating [email]. [Return to Control Panel]"
- "Return to Control Panel" link → `https://admin.smartscreen.com` (with exit-impersonation token)

#### Step 3.5: Remove Admin Routes from Customer Dashboard

1. Delete `apps/dashboard/src/app/[locale]/(shell)/admin/` directory
2. Delete `apps/dashboard/src/features/admin/` directory
3. Add redirect in `apps/dashboard/src/middleware.ts`:
   ```typescript
   // Redirect /admin/* to Control Panel
   if (pathname.includes('/admin')) {
     const url = new URL(`https://admin.smartscreen.com${pathname}`);
     return NextResponse.redirect(url);
   }
   ```

#### Step 3.6: Simplify Customer Dashboard

1. Remove `sovereign` logic from `CrystalShell`
2. Remove `sovereign` prop from `ShellSidebar`
3. Remove `isSuperAdmin` from `WorkspaceContext`
4. Remove `cs_super_admin` sessionStorage usage
5. Remove `ImpersonationReturnButton` (replaced by `ImpersonationBanner`)
6. Remove `hintSuperAdmin` state

#### Step 3.7: Acceptance Criteria

- [ ] `POST /auth/exchange-impersonation` endpoint works
- [ ] Control Panel impersonation redirects to Customer Dashboard
- [ ] Customer Dashboard exchange page sets cookies and redirects to `/overview`
- [ ] Impersonation banner is shown during impersonation
- [ ] "Return to Control Panel" exits impersonation and redirects to Control Panel
- [ ] `/admin/*` on Customer Dashboard redirects to Control Panel
- [ ] Customer Dashboard no longer has admin code
- [ ] `CrystalShell` no longer has `sovereign` logic
- [ ] `WorkspaceContext` no longer has `isSuperAdmin`
- [ ] All customer features work correctly without admin code

---

### Phase 4: Platform Settings Migration

**Goal:** Move platform settings from file system to database.

#### Step 4.1: Add PlatformSettings Model

Add to `schema.prisma`:
```prisma
model PlatformSettings {
  id                String   @id @default(cuid())
  platformName      String   @default("Cloud Signage")
  supportEmail      String   @default("support@smartscreen.local")
  maintenanceMode   Boolean  @default(false)
  defaultLanguage   String   @default("ar")
  logoUrlEn         String   @default("")
  logoUrlAr         String   @default("")
  logoAssetEnLight  String   @default("")
  logoAssetEnDark   String   @default("")
  logoAssetArLight  String   @default("")
  logoAssetArDark   String   @default("")
  brandingEpoch     Int      @default(0)
  updatedAt         DateTime @updatedAt
}
```

Run `npx prisma migrate dev --name add_platform_settings`

#### Step 4.2: Write Migration Script

Create `scripts/migrate-admin-runtime.ts`:
- Read `.data/admin-runtime.json`
- Upsert into `PlatformSettings` table
- Log success

#### Step 4.3: Update Services

1. Create `PlatformSettingsService` (reads/writes via Prisma)
2. Update `AdminService.getSettings()` → use `PlatformSettingsService`
3. Update `AdminService.updateSettings()` → use `PlatformSettingsService`
4. Update `BrandingController.getBranding()` → use `PlatformSettingsService`
5. Update `BrandingAssetsService` → read asset filenames from `PlatformSettingsService`

#### Step 4.4: Remove File-Based Store

1. Delete `apps/backend/src/domains/admin/admin-runtime.store.ts`
2. Remove `.data/admin-runtime.json` (after verifying migration)
3. Update `AdminModule` imports

#### Step 4.5: Acceptance Criteria

- [ ] `PlatformSettings` table exists in database
- [ ] Migration script runs successfully
- [ ] `AdminService` reads settings from database
- [ ] `BrandingController` reads settings from database
- [ ] `admin-runtime.store.ts` is deleted
- [ ] Branding upload still works (saves to `.data/branding/` but metadata in DB)
- [ ] Multi-instance deployment shows consistent settings

---

## 5. Risks

| Risk | Phase | Severity | Mitigation |
|---|---|---|---|
| Shared package extraction breaks dashboard imports | 1 | High | Re-export from original locations for backward compatibility. Test dashboard after extraction. |
| Control Panel has different i18n keys than dashboard | 1 | Medium | Copy i18n messages from dashboard. Sync manually until shared package is created. |
| JWT audience validation rejects valid tokens | 2 | High | Make additive (no audience = customer). Deploy validation before requiring audience. |
| Impersonation exchange token expires before redirect | 3 | Medium | 30s TTL. Handle expiry with retry link. Test on slow connections. |
| Removing admin routes breaks super admin workflow | 3 | High | Keep Phase 1–2 running until Control Panel is validated. Gradual rollout. |
| Platform settings lost during file-to-DB migration | 4 | High | Backup JSON file. Dry-run migration. Verify row count. |

---

## 6. Alternatives

### 6.1 Big Bang Migration

Do all phases at once in a single deployment.

**Pros:** No transition period, cleaner codebase.
**Cons:** High risk, no rollback path, all issues surface at once.

**Verdict:** Rejected. Phased migration reduces risk and allows rollback at each phase.

### 6.2 Feature Flag Migration

Use feature flags to control which application serves admin routes.

**Pros:** Instant rollback, gradual rollout.
**Cons:** Adds complexity, feature flag management overhead.

**Verdict:** Recommended as an enhancement to Phase 1. Use a feature flag or environment variable to control whether `/admin/*` is served by the dashboard or redirected to the Control Panel.

---

## 7. Migration Notes

- **No database changes in Phase 1–3.** Only Phase 4 touches the schema.
- **No API route changes.** All existing routes keep their paths.
- **Backward compatibility is maintained** through Phase 1–2. Phase 3 is the breaking point.
- **Rollback plan:** If Phase 3 fails, redeploy the dashboard with admin routes. The Control Panel can be taken offline independently.
- **CI/CD:** Add a new build job for `apps/control-panel` in `.github/workflows/ci.yml`.

---

## 8. Open Questions

1. **Should Phase 1 and Phase 2 be combined?** They are independent but combining them reduces the number of deployments.
2. **Should the Control Panel use a different port in development?** Yes, port 3003 is recommended.
3. **Should the shared packages be published to a private npm registry** or kept as workspace packages? Workspace packages are simpler for now.
4. **Should the migration script run automatically on deployment** or manually? Manually, with verification steps.
5. **Should Phase 3 include the `AuditLog.scope` migration?** It's optional and can be deferred.

---

## 9. Final Recommendation

Execute the four-phase migration in order. Each phase is independently deployable and rollbackable. The most critical phase is Phase 3 (full separation), which should only be executed after Phase 1 and Phase 2 are validated in production for at least one week.

**Estimated timeline:**
- Phase 1: 2–3 weeks (extract packages, create app, copy features, deploy)
- Phase 2: 1–2 weeks (JWT audience, guards, testing)
- Phase 3: 1 week (exchange endpoint, remove admin routes, simplify dashboard)
- Phase 4: 3–5 days (schema migration, service updates)

**Total: 5–7 weeks** with a single developer. Can be parallelized with two developers (Phase 1 and Phase 2 can overlap).

The migration is low-risk because:
1. No database changes until Phase 4
2. No API route changes at any phase
3. Backward compatibility is maintained through Phase 2
4. Phase 3 has a clear rollback path
5. Phase 4 is a simple data migration with backup
