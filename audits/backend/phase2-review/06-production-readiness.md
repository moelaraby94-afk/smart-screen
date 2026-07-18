# Phase 2 — Production Readiness

> **Method:** Assessment of deployment readiness based on code verification.
> **Date:** 2026-07-18

## Deployment Checklist

### Environment Variables

| Variable | Status | Notes |
|----------|--------|-------|
| `ENCRYPTION_KEY` | ✅ Required | Added to `assert-production-secrets.ts`, placeholder blocked |
| `JWT_ACCESS_SECRET` | ✅ Pre-existing | Unchanged |
| `JWT_REFRESH_SECRET` | ✅ Pre-existing | Unchanged |
| `PLAYER_HEARTBEAT_SECRET` | ✅ Removed | No longer required (per-screen secrets only) |
| `ENABLE_DEV_LOGIN` | ✅ Removed | No longer required |

### Migration Requirements

| Migration | Status | Risk |
|-----------|--------|------|
| 2FA secret encryption | ⚠️ Runbook only | Script `scripts/encrypt-2fa-secrets.ts` referenced but does not exist. App self-heals via backward compat, but proactive migration is recommended. |
| Per-screen secrets | ⚠️ Operational | Screens with `pairingSecretHash = NULL` will get 401. Must be re-paired. No migration script provided. |

### CI/CD

| Check | Status |
|-------|--------|
| `npm audit --audit-level=high` blocking | ✅ Verified |
| Dependabot weekly updates | ✅ Configured |
| TypeScript compilation | ✅ 0 new errors |
| ESLint | ✅ 0 new errors |
| Test suite | ✅ 0 new failures |
| Build | ✅ Pass |

### Runtime Safety

| Check | Status |
|-------|--------|
| `ENCRYPTION_KEY` missing → fail fast | ✅ `CryptoService` constructor throws |
| `ENCRYPTION_KEY` placeholder → fail fast | ✅ `assert-production-secrets.ts` blocks |
| Dev login route → 404 | ✅ Controller deleted |
| Shared secret auth → 401 | ✅ Fallback removed |
| Role change → session revoked | ⚠️ Partial (see P1 issues) |

### Backward Compatibility

| Feature | Status | Notes |
|---------|--------|-------|
| Existing 2FA secrets (plaintext) | ✅ Supported | `decrypt()` returns plaintext if format doesn't match |
| Existing paired screens (with per-screen secret) | ✅ Supported | `bcrypt.compare` unchanged |
| Existing screens without per-screen secret | ❌ Broken | Will get 401 — must re-pair |
| Existing JWT tokens | ✅ Supported | No JWT signing changes |
| Existing refresh tokens | ✅ Supported | No token format changes |

### Monitoring

| Check | Status |
|-------|--------|
| `CryptoService` errors logged | ⚠️ No — errors are silently caught in `decrypt()` |
| Session revocation logged | ❌ No — `revokeAllSessions` doesn't log |
| Password complexity rejections | ✅ Via `class-validator` validation errors |
| Dev login attempts | ✅ Via 404 response (no route) |

## Production Readiness Assessment

### Ready for Production

- ✅ AES-256-GCM encryption for 2FA secrets
- ✅ Password complexity enforcement (4/5 DTOs)
- ✅ Dev login removed
- ✅ Shared secret fallback removed from auth paths
- ✅ CI audit gate blocking
- ✅ Dependabot automated updates
- ✅ Build passes
- ✅ No regressions

### Not Ready for Production (P1 blockers)

1. `CreateStaffDto` allows weak passwords (6 chars, no complexity)
2. `removeMember` doesn't revoke sessions — removed member retains access
3. `removeAccountMember` doesn't revoke sessions
4. `updateAccountMemberRole` doesn't revoke sessions

### Should Address Before Production (P2)

5. Non-atomic role update + session revocation
6. Missing migration script `scripts/encrypt-2fa-secrets.ts`
7. Frontend dev-login dead code cleanup

### Operational Requirements

- **Before deploy:** Set `ENCRYPTION_KEY` to a strong 32+ char random string
- **Before deploy:** Re-pair all screens that don't have `pairingSecretHash`
- **After deploy:** Monitor for 2FA failures (indicates backward compat path being hit)
- **After deploy:** Monitor for 401s on `/player/bootstrap` (indicates screens needing re-pairing)

## Verdict

**CONDITIONALLY READY** — Address P1 items before production deployment. P2 items should be addressed but are not blocking.
