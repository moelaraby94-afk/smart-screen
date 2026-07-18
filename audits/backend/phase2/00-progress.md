# Phase 2 — Security Hardening: Progress Log

## Milestone 2.1: Password complexity validators on all password DTOs
- **Status:** COMPLETE
- **Files changed:**
  - `apps/backend/src/common/validators/password-complexity.decorator.ts` (NEW)
  - `apps/backend/src/domains/auth/dto/register.dto.ts`
  - `apps/backend/src/domains/auth/dto/register-start.dto.ts`
  - `apps/backend/src/domains/auth/dto/reset-password.dto.ts`
  - `apps/backend/src/domains/workspaces/dto/create-account-member.dto.ts`
- **Official reference:** OWASP Authentication Cheat Sheet
- **Verification:** TypeScript 10 pre-existing errors (no new), ESLint clean, Build pass

## Milestone 2.2: CryptoService (AES-256-GCM) + 2FA secret encryption
- **Status:** COMPLETE
- **Files changed:**
  - `apps/backend/src/common/crypto/crypto.service.ts` (NEW)
  - `apps/backend/src/common/crypto/crypto.module.ts` (NEW)
  - `apps/backend/src/domains/auth/two-factor.service.ts`
  - `apps/backend/src/domains/auth/auth.service.ts`
  - `apps/backend/src/domains/auth/auth.module.ts`
  - `apps/backend/src/domains/auth/auth-refresh-session.spec.ts`
  - `.env.example`
  - `apps/backend/prisma/migrations/20260719000000_encrypt_2fa_secrets/migration.sql` (NEW — runbook)
- **Official reference:** OWASP A02:2021 Cryptographic Failures, Node.js crypto docs
- **Verification:** TypeScript 10 pre-existing errors (no new), ESLint clean, Build pass

## Milestone 2.3: Remove DevLoginController + spec + auth.module reference
- **Status:** COMPLETE
- **Files changed:**
  - `apps/backend/src/domains/auth/dev-login.controller.ts` (DELETED)
  - `apps/backend/src/domains/auth/dev-login.controller.spec.ts` (DELETED)
  - `apps/backend/src/domains/auth/auth.module.ts`
  - `apps/backend/src/domains/auth/auth.service.ts` (removed `devLoginAsFirstUser` method)
  - `.env.example` (removed `ENABLE_DEV_LOGIN`)
- **Official reference:** OWASP A07:2021 — dev-only code in production codebase is a security risk
- **Verification:** TypeScript 10 pre-existing errors (no new), ESLint clean, Build pass

## Milestone 2.4: Remove shared secret fallback
- **Status:** COMPLETE
- **Files changed:**
  - `apps/backend/src/domains/realtime/realtime.gateway.ts`
  - `apps/backend/src/domains/player/player.service.ts`
  - `apps/backend/src/common/config/assert-production-secrets.ts`
  - `apps/backend/src/common/config/assert-production-secrets.spec.ts`
  - `apps/backend/src/domains/realtime/realtime.gateway.spec.ts`
  - `apps/backend/src/domains/player/player.service.spec.ts`
  - `apps/backend/src/domains/player/player.prayer-pause.spec.ts`
  - `apps/backend/src/domains/pairing/pairing-to-bootstrap.integration.spec.ts`
  - `.env.example`
- **Official reference:** OWASP A07:2021 — shared secrets allow impersonation
- **Verification:** TypeScript 10 pre-existing errors (no new), ESLint clean, Build pass, Tests: 6 failed (all pre-existing), 466 passed

## Milestone 2.5: JWT rotation on role change
- **Status:** COMPLETE
- **Files changed:**
  - `apps/backend/src/domains/auth/auth.service.ts` (added `revokeAllSessions` method)
  - `apps/backend/src/domains/workspaces/workspaces.service.ts` (inject AuthService, call revokeAllSessions after updateMemberRole)
  - `apps/backend/src/domains/workspaces/workspaces.service.spec.ts`
  - `apps/backend/src/domains/admin/admin.service.ts` (call revokeAllSessions after updateUser when role changes)
- **Official reference:** OWASP A07:2021 — invalidate sessions on role change
- **Verification:** TypeScript 10 pre-existing errors (no new), ESLint clean, Build pass

## Milestone 2.6: Make npm audit blocking in CI + Dependabot config
- **Status:** COMPLETE
- **Files changed:**
  - `.github/workflows/ci.yml` (removed `|| true` from npm audit)
  - `.github/dependabot.yml` (NEW)
- **Official reference:** GitHub Dependabot docs
- **Verification:** N/A (CI config change)

## Milestone 2.7: Full verification
- **Status:** COMPLETE
- **TypeScript:** 10 pre-existing errors (no new errors introduced)
- **ESLint:** 2 pre-existing errors + 1 pre-existing warning (no new issues)
- **Tests:** 6 failed suites (all pre-existing), 44 passed suites, 466 passed tests
- **Build:** SUCCESS
- **Pre-existing failures documented:**
  - `roles.guard.spec.ts` — Missing `AccountContextHelper` arg (7 TS errors)
  - `playlists.service.spec.ts` / `playlists.p2-t1.spec.ts` — Missing `AccountContextHelper` arg (3 TS errors)
  - `media.service.spec.ts` — Pre-existing test failures
  - `scheduling.service.spec.ts` — Pre-existing test failures
  - `claim-pairing-session-security.spec.ts` — Missing `AccountContextHelper` in test module
  - `request-body-validation.spec.ts` — Pre-existing test failures
