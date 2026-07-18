# Phase 2 — Files Modified

## New Files

| File | Purpose |
|------|---------|
| `apps/backend/src/common/validators/password-complexity.decorator.ts` | Reusable `@MatchesPasswordComplexity()` decorator |
| `apps/backend/src/common/crypto/crypto.service.ts` | AES-256-GCM encryption/decryption service |
| `apps/backend/src/common/crypto/crypto.module.ts` | NestJS module exporting CryptoService |
| `apps/backend/prisma/migrations/20260719000000_encrypt_2fa_secrets/migration.sql` | Migration runbook (not auto-executed) |
| `.github/dependabot.yml` | Dependabot configuration for automated dependency updates |
| `audits/backend/phase2/00-progress.md` | This progress log |
| `audits/backend/phase2/01-decisions.md` | Technical decisions |
| `audits/backend/phase2/02-official-references.md` | Official documentation references |
| `audits/backend/phase2/03-files-modified.md` | This file |

## Deleted Files

| File | Reason |
|------|--------|
| `apps/backend/src/domains/auth/dev-login.controller.ts` | Dev login route removed — security risk |
| `apps/backend/src/domains/auth/dev-login.controller.spec.ts` | Test for deleted controller |

## Modified Files

| File | Change |
|------|--------|
| `apps/backend/src/domains/auth/dto/register.dto.ts` | Added `@MatchesPasswordComplexity()` to password |
| `apps/backend/src/domains/auth/dto/register-start.dto.ts` | Added `@MatchesPasswordComplexity()` to password |
| `apps/backend/src/domains/auth/dto/reset-password.dto.ts` | Added `@MatchesPasswordComplexity()` to newPassword |
| `apps/backend/src/domains/workspaces/dto/create-account-member.dto.ts` | Added `@MatchesPasswordComplexity()` to password |
| `apps/backend/src/domains/auth/two-factor.service.ts` | Inject CryptoService, encrypt on store, decrypt on verify |
| `apps/backend/src/domains/auth/auth.service.ts` | Inject CryptoService, decrypt 2FA secret on login, add `revokeAllSessions()`, remove `devLoginAsFirstUser()` |
| `apps/backend/src/domains/auth/auth.module.ts` | Import CryptoModule, remove DevLoginController |
| `apps/backend/src/domains/auth/auth-refresh-session.spec.ts` | Add CryptoService mock arg |
| `apps/backend/src/domains/realtime/realtime.gateway.ts` | Remove shared secret fallback in `assertScreenSecret` |
| `apps/backend/src/domains/player/player.service.ts` | Remove shared secret fallback in `assertPlayerSecretForScreen` |
| `apps/backend/src/common/config/assert-production-secrets.ts` | Replace `PLAYER_HEARTBEAT_SECRET` with `ENCRYPTION_KEY` in required secrets |
| `apps/backend/src/common/config/assert-production-secrets.spec.ts` | Update tests for `ENCRYPTION_KEY` |
| `apps/backend/src/domains/realtime/realtime.gateway.spec.ts` | Use bcrypt hash instead of shared secret |
| `apps/backend/src/domains/player/player.service.spec.ts` | Use bcrypt hash, update shared-secret fallback test to expect 401 |
| `apps/backend/src/domains/player/player.prayer-pause.spec.ts` | Use bcrypt hash instead of shared secret |
| `apps/backend/src/domains/pairing/pairing-to-bootstrap.integration.spec.ts` | Add RedisService mock, update shared-secret fallback test to expect 401 |
| `apps/backend/src/domains/workspaces/workspaces.service.ts` | Inject AuthService, call `revokeAllSessions()` after `updateMemberRole` |
| `apps/backend/src/domains/workspaces/workspaces.service.spec.ts` | Add AuthService mock arg |
| `apps/backend/src/domains/admin/admin.service.ts` | Call `revokeAllSessions()` after `updateUser` when role changes |
| `.github/workflows/ci.yml` | Make `npm audit` blocking (remove `\|\| true`) |
| `.env.example` | Add `ENCRYPTION_KEY`, remove `PLAYER_HEARTBEAT_SECRET` and `ENABLE_DEV_LOGIN` |
