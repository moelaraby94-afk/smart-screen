# Audit 13: DevOps, Docker, Environment & Secrets

**Date:** 2026-07-13
**Reviewer:** Claude (Opus 4.8) — new file (area only touched briefly by audit 01 §5)
**Scope:** Dockerfiles, docker-compose, migration-on-boot, environment/secrets management,
persistent volumes, the bleeding-edge toolchain constraint.

---

## 1. Container build & runtime

**Files:** `Dockerfile.backend`, `Dockerfile.dashboard`, `docker-compose.yml`,
`scripts/sync-env.cjs`, `scripts/clean-build.cjs`.

**Strengths (verified in `Dockerfile.backend`):**
- Multi-stage build; deps installed from `package-lock.json` via `npm ci` (reproducible). ✅
- **Runs as a non-root user** (`appuser` uid 1001) — limits blast radius of a dependency
  RCE (`:59-90`). ✅
- Healthcheck and `EXPOSE`/listener port pinned to `3000` to prevent drift (`:82-88`) —
  a real past bug they fixed. ✅
- Only the writable dirs (`uploads/`, `.data/`) are `chown`ed, not all of `node_modules`
  (fast on WSL2). ✅

**Issues:**

### High
1. **Migrations run at container start, per replica.**
   `CMD … npx prisma migrate deploy … && node dist/src/main.js` (`:92`). Every backend
   container runs `migrate deploy` on boot. Prisma takes a DB advisory lock so concurrent
   replicas won't corrupt each other, but:
   - A slow/failing migration blocks the app from starting *and* can make the whole
     autoscaling group crash-loop simultaneously.
   - There is no separate "migration job" step (the recommended pattern for K8s / Railway
     multi-instance). Consider a one-shot migration job gated before rollout.

2. **`npm install class-validator@0.14.1 --no-save` at image build (`:55`).**
   A hoist workaround for NestJS's `PackageLoader`. It pins a second copy of
   `class-validator` outside the lockfile and silences errors (`2>/dev/null || true`), so a
   failure is invisible. This is fragile — if the hoist ever matters and this line fails
   silently, validation packages may resolve inconsistently. Fix the hoist in the workspace
   root deps instead.

### Medium
3. **Local-filesystem state for audit log + platform settings.**
   The Dockerfile comment documents that `.data/` holds *"audit log + platform settings
   JSON"* via `admin-runtime.store.ts` and branding assets via
   `branding-assets.service.ts` (`:69-73`). That means some audit/settings data lives in a
   **JSON file on a volume**, separate from the Prisma `AuditLog` table (audit 02). Two
   sources of truth for "audit log" is a consistency and backup hazard, and file-based
   state does not survive a fresh container without the `backend_data` volume. Confirm
   which audit path is authoritative and whether both must be backed up.

4. **`media_uploads` on a local volume — no object storage.**
   `docker-compose.yml` volumes: `pgdata`, `media_uploads`, `backend_data`. Uploaded media
   sits on a host/named volume, not S3/GCS. This blocks multi-instance backends (each
   would have its own disk) and complicates backup/DR. Ties to the scaling theme in
   files 00/12.

5. **No dashboard container healthcheck** (confirmed; also file 00 T8).

### Low
6. **No documented backup/restore** for `pgdata` / `media_uploads` / `backend_data`.
7. **No image scanning** (Trivy/Grype) in CI (see file 14).

---

## 2. Environment & secrets

**Files:** `.env`, `.env.example` (5.2 KB, 28 keys, ~19 secret-ish keys),
`scripts/sync-env.cjs`, `common/config/assert-production-secrets.ts`.

**Strengths (verified):**
- `assertProductionSecretsAreSet` fails the boot in production if required secrets are
  missing (audit 01/04). ✅ (`assert-production-secrets.spec.ts` covers it.)
- Separate `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, enforced distinct. ✅
- Comprehensive `.env.example` template. ✅

**Issues:**

### Medium
1. **A real `.env` is committed to the working tree** (present at repo root, 4.7 KB). It is
   `.gitignore`d for commits, but its on-disk presence next to `.env.example` risks
   accidental sharing and means **local secrets exist in plaintext** on every dev machine.
   Confirm it is *never* tracked (`git ls-files .env` must be empty) and rotate any secret
   that was ever committed historically.
2. **Two origin allow-list variables** (`ALLOWED_ORIGINS` for REST, `FRONTEND_ORIGINS` for
   WebSocket — see file 12 §2.4). Document and, ideally, unify.
3. **No secret manager integration** (Vault/Doppler/SSM). Secrets are env-only. Acceptable
   for a single-host deploy; call it out for enterprise buyers.

---

## 3. The bleeding-edge toolchain constraint (process risk — must read)

This repo intentionally runs **pre-release / very new** major versions, and each app ships
an `AGENTS.md` warning:

> *"This is NOT the Next.js you know … Read the relevant guide in
> `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices."*

Verified versions:
- **Prisma ORM 7** with a **mandatory driver adapter** — `@prisma/adapter-pg@7.7.0`;
  `prisma.service.ts:6` notes `datasources.db.url` in `super()` is no longer supported, and
  CLI commands take `--config prisma.config.ts` (see `ci.yml`).
- **Next.js 15 / React 19**, **TailwindCSS 4** (CSS-first config, no `tailwind.config.ts`).
- **next-intl** App-Router integration; strict i18n guardrails in `apps/dashboard/AGENTS.md`.

**Why this matters:** training-data assumptions about these libraries are frequently wrong
here. Any implementing agent **must** read the in-repo `AGENTS.md` and the local
`node_modules/**/docs` before editing, or it will produce code that fails typecheck/build.
This is encoded as a hard rule in `PLAN-executable-remediation.md`.

---

## 4. Recommended actions

1. Split migrations into a pre-deploy job; keep app start idempotent.
2. Remove the `class-validator --no-save` hoist; fix at workspace root.
3. Decide one authoritative audit-log store (DB vs `.data/` JSON) and document backups.
4. Plan object storage (S3/GCS) for media before scaling backends.
5. Add a dashboard healthcheck; add image scanning to CI.
6. Verify `.env` is untracked; rotate any historically committed secret.
