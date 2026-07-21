# Security & audit remediation log

Tracks the fixes delivered against `smart-screen-audit-report.md`, plus two
related issues found during verification that the audit itself missed. Each
entry lists what changed, why, and how it was verified (real execution, not
just code review — see each section's "Verified" line).

## 1. Pairing-session brute force (`POST :workspaceId/pairing-sessions/claim`)

**Problem:** the 6-digit pairing code had no rate limit or lockout, making it
brute-forceable (1,000,000 combinations, no cost per attempt).

**Fix:**
- `UserThrottlerGuard` (`common/throttler/user-throttler.guard.ts`) — per-user
  (not per-IP) `ThrottlerGuard`, 5 requests/min via `@Throttle`.
- DB-backed lockout: `PairingClaimLockout` model (`userId` unique,
  `failedCount`, `windowStartAt`, `lockedUntil`). 5 failures inside a 10-minute
  window locks the user out of claim attempts for 30 minutes.
  `pairing.service.ts` (`assertClaimNotLockedOut`, `recordFailedClaimAttempt`,
  `clearFailedClaimAttempts`).
- Every failed attempt is logged with `userId` + `workspaceId`.

**Verified:** integration test (`claim-pairing-session-security.spec.ts`) with
6 consecutive wrong codes — first 5 return the normal invalid-code error and
increment the counter, the 6th (and any attempt inside the lockout window)
returns a lockout error; confirmed the lockout clears after the 30-minute
window and on a successful claim.

## 2. Docker containers running as root

**Problem:** `Dockerfile.backend` / `Dockerfile.dashboard` ran the app process
as `root` inside the container — an RCE in a dependency would give the
attacker root in the container.

**Fix:** both Dockerfiles create `appuser:appgroup` (uid/gid 1001) and switch
to it via `USER appuser` before `CMD`. Only the directories the app actually
writes to at runtime are `chown`'d (see finding 2.1 below for why) —
`node_modules`/`dist` stay root-owned and world-readable, which is fine since
the app only reads those.

**Verified:** built both images, ran `docker exec <container> whoami` →
`appuser` in both; confirmed media upload still works end-to-end as a
non-root process.

### 2.1 Regression found during verification: `.data/` permissions + missing volume

Exercising the **impersonation** flow after the non-root switch surfaced a
500: `EACCES: permission denied, mkdir '/repo/apps/backend/.data'`. The
original `chown` only covered `uploads/`, which was the only path exercised
before — `.data/` (used by `admin-runtime.store.ts` for the audit log and
platform settings, and by `branding-assets.service.ts` for
`.data/branding/`) was still root-owned. Separately, `.data/` had **no
persistent volume at all** in `docker-compose.yml` — the same class of
data-loss risk the audit's own finding 2.2 flagged for `media_uploads`, just
missed for this path.

**Fix:** `Dockerfile.backend` now `chown`s `uploads/` and `.data/` together;
`docker-compose.yml` adds a `backend_data` named volume mounted at
`/repo/apps/backend/.data`.

**Verified:** rebuilt, re-ran impersonation end-to-end → 201, real client IP
logged in the audit trail, `.data/` confirmed owned by `appuser` inside the
container.

## 3. `storageLimitBytes` integer overflow

**Problem:** `Subscription.storageLimitBytes` was a Postgres `Int` (32-bit,
max ~2.1GB). Setting a 5GB default (`5 * 1024 * 1024 * 1024`) overflowed it,
causing registration to fail with a Prisma `P2020` (`ValueOutOfRange`) — a
full registration outage for new signups.

**Fix:** migrated the column to `BigInt`; added
`common/product/storage-limit.ts` (`toStorageLimitBytesInput` /
`fromStorageLimitBytes`) as the single read/write boundary between JS
`number` and Postgres `bigint`, applied everywhere the field is written or
returned (`workspaces.service.ts`, `subscriptions.service.ts`,
`account.service.ts`, `admin.service.ts`).

**Verified:** real registration request post-fix → 200 OK, correct
`5368709120` (5GB in bytes) round-tripped through the API response.

## 4. `publicUrl` 404 on uploaded media

**Problem:** `media.service.ts#buildPublicUrl` hardcoded the path prefix
between the static-file-serving root and the actual upload directory, so
`publicUrl` pointed at a path one segment short of where files actually live
whenever `MEDIA_UPLOAD_DIR` didn't match the hardcoded assumption — resulting
in 404s for uploaded media.

**Fix:** the prefix is now computed dynamically via
`path.relative(staticRoot, uploadRoot)`, so it stays correct regardless of
`MEDIA_UPLOAD_DIR`.

**Verified:** `media.service.spec.ts` covers both the default path and a
`MEDIA_UPLOAD_DIR` override; also exercised with a real upload + fetch of the
returned `publicUrl`.

## 5. Audit-driven fixes (`smart-screen-audit-report.md`)

| # | Finding | Fix |
|---|---|---|
| 1 | No startup validation of JWT/player secrets | `assertProductionSecretsAreSet()` (`common/config/assert-production-secrets.ts`) throws on boot if `production` still has dev-default secrets |
| 2 | Missing security headers | `helmet()` on the backend (CSP/COEP/CORP deliberately disabled — see below); `next.config.ts` `headers()` on the dashboard (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, a scoped `Content-Security-Policy`) |
| 3 | Admin endpoints reachable by any staff role | `PlatformStaffDbGuard` (class-level, requires active + super-admin-or-platform-staff) layered under `SuperAdminDbGuard` (method-level) on the endpoints that can change roles, delete workspaces, or touch billing |
| 4 | Privilege escalation via `updateUser` | same `SuperAdminDbGuard` layering — `UpdateAdminUserDto` includes `isSuperAdmin`/`platformStaffRole`, so only super admins can call it |
| 5 | Audit log missing real client IP | `login`, `exitImpersonation`, `impersonate` now take `@Req()` and pass `request.ip` into `appendAuditLog` |
| 6 | Unbounded admin list queries | `ADMIN_LIST_CAP = 1000` applied to `listUsers` / `listWorkspaces` / `listGlobalFleetScreens` |
| 7 | Media list race / unbounded `take` | `MEDIA_LIST_CAP = 500`, clamped with `Math.max(0, Math.min(...))` (a negative `take` has special "last N" meaning in Prisma — unclamped, it could have bypassed the cap) |
| 8 | Storage-quota check-then-act race | `saveUploadedFile` now wraps the quota check + write + `media.create` in one `$transaction` serialized by `pg_advisory_xact_lock(hashtext(workspaceId))`, so concurrent uploads can't both pass the quota check and jointly exceed it |
| 9 | Unhandled exceptions leak internals | global `AllExceptionsFilter` (`APP_FILTER`) — `HttpException`s pass through unchanged, everything else is logged (Sentry) and returns a generic 500 |

**Helmet CSP/COEP/CORP note:** left off deliberately. This app serves
uploaded media (images/video) cross-origin between the dashboard and backend
API; Helmet's defaults would block that legitimate traffic. The dashboard's
own `next.config.ts` CSP covers the browser-facing surface instead.

**Verified:** full Jest suite (21 tests / 8 suites) green; `tsc --noEmit`
clean (one pre-existing, unrelated `TS7022` in
`stripe-webhook.service.spec.ts`); ESLint clean on all touched files; helmet
headers and the admin guard layering both exercised with real HTTP requests
against a running instance.

## 6. Frontend: `branch-detail-client.tsx` God Component (audit §8)

**Problem:** the branch detail page (1292 lines) mixed API calls, mutable
state, and JSX for six independent concerns in one component: playlist CRUD,
media listing, screen→playlist assignment, the player-pairing claim flow, and
derived stats — the pattern the audit's §8 flagged, with a note to start with
the largest/highest-risk file first.

**Fix:** extracted the non-UI logic into hooks and pure functions, matching
the codebase's existing convention (`useApiScreens`, `useScreenRealtime`,
`use-workspace-stats`) of hooks that own async/state and return
`{data, actions, isLoading}`-shaped objects:

- `features/branches/branch-stats.ts` — pure functions
  (`computeOnlineByPlaylistId`, `computeBranchScreenStats`), no hook needed.
- `features/branches/use-branch-media.ts` — single-workspace media list.
- `features/branches/use-branch-playlists.ts` — playlist CRUD (create,
  duplicate, delete, move-between-branches, edit), with per-action busy
  flags.
- `features/branches/use-screen-playback-assignment.ts` — assigns a playlist
  to a screen's active playback slot.
- `features/branches/use-player-pairing.ts` — the pairing-modal claim flow,
  including the epoch-based "someone paired a device while you had the modal
  open" progress banner and the success-then-auto-close timer.

`branch-detail-client.tsx` now only holds dialog-open/form-field UI state and
JSX, consuming the hooks above. Behavior is unchanged; `media-library-client.tsx`
was deliberately left alone — its media-fetching logic (multi-workspace
aggregation, folders) is materially more complex and is its own separate God
Component candidate, not a natural fit for the simple single-workspace hook
this page needed.

**Verified:** `tsc --noEmit` clean; `next build` succeeds (including
Turbopack's own TypeScript pass and static generation); ESLint clean
(including `react-hooks/exhaustive-deps`, which specifically catches broken
hook dependency arrays — the main risk in this kind of extraction);
`npm run i18n:check` clean. Real browser check: logged in as a seeded client
user, loaded the live branch detail page against a real backend + Postgres,
and confirmed all three tabs render real data (stats, the seeded "Demo Loop"
playlist, both seeded screens with working playback-playlist dropdowns, all
5 seeded media items) with zero console errors.

## Still open (flagged, not actioned — needs a product/business decision)

- Saudi payment gateway integration (audit §2.5)
- Single-session-per-user architecture change (§3)
- Video transcoding pipeline (§3)
- Formal DB backup strategy (§4)
- Broader test coverage beyond the code touched in this pass (§10)
- `localStorage` token mirror in `session.ts` (§17.1) — likely a real
  cross-app dependency, not removed without confirming what relies on it
- Remaining God Components: `admin-customer-profile-client.tsx` (874 lines),
  `client-home-dashboard.tsx` (799), `media-library-client.tsx` (729),
  `screens-client.tsx` (668), `studio-editor-client.tsx` (668)
