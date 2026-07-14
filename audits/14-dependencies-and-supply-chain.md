# Audit 14: Dependencies & Supply Chain

**Date:** 2026-07-13
**Reviewer:** Claude (Opus 4.8) — new file (area entirely absent from audit 01–11)
**Scope:** Known-vulnerable dependencies, dev-vs-prod exposure, lockfile integrity, CI
supply-chain gates.

> The original audit did not run `npm audit` or examine dependency health at all. This is
> the single largest concrete-risk gap in the original pass.

---

## 1. `npm audit` snapshot (2026-07-13)

```
38 vulnerabilities total:  2 critical · 11 high · 22 moderate · 3 low
```

Reproduce with: `npm audit` (root of the monorepo).

### 1.1 Production-facing (fix first)

These sit in the runtime dependency tree of the backend/dashboard and are the priority.

| Package | Severity | Advisory (short) | Why it matters here |
|---------|----------|------------------|---------------------|
| `multer` (via `@nestjs/platform-express`) | **High** | DoS via deeply nested field names | **Media upload path** (`media.service.ts`) parses multipart — directly reachable |
| `ws` (via `socket.io`/`engine.io`) | **High** | Uninitialized memory disclosure | Underpins the **WebSocket gateway** (file 12) — reachable by any connecting client |
| `nodemailer` | **High** | Email delivered to unintended domain (interpretation conflict) | **Email domain** (OTP, invites, password reset) — mis-delivery = account-takeover vector |
| `next` | **High** | DoS via Server Components | Dashboard is Next.js 15 App Router — reachable |
| `lodash` (via `@nestjs/config`) | **High** | Code injection via `_.template` | Transitive; confirm no tainted input reaches template |
| `form-data` | **High** | CRLF injection via unescaped multipart field names | Outbound multipart (webhook/media) |
| `fast-uri` | **High** | Path traversal via percent-encoded dot segments | URI parsing |
| `next-intl` | Moderate | **Open redirect** | Locale routing/redirects — phishing vector |
| `postcss` | Moderate | XSS via unescaped `</style>` in stringify | Build-time CSS |
| `qs` | Moderate | Remotely triggerable DoS on malformed arrays | Query parsing |
| `socket.io-adapter` / `engine.io` | Moderate | `ws` chain | WebSocket stack |
| `@sentry/*`, `@opentelemetry/*` | Moderate | `@sentry/node` → otel core memory issues | Observability stack |
| `prisma` / `@prisma/dev` (→ `hono`, `@hono/node-server`) | Moderate/High | hono JSX/CSS injection, serveStatic bypass | Mostly dev tooling; confirm not shipped |

### 1.2 Dev-only (lower priority, still fix)

| Package | Severity | Note |
|---------|----------|------|
| `shell-quote` (via `concurrently`) | **Critical** | Newline escaping — dev script runner only |
| `esbuild` | Low | Dev-server arbitrary file read (Windows) |
| `@nestjs/cli`, `@angular-devkit/*`, `@babel/core`, `picomatch`, `brace-expansion`, `js-yaml` | Low–High | Build/test tooling |

> **Do not** assume "dev-only = ignore." `esbuild`'s dev-server file read and
> `shell-quote` injection matter on developer laptops and in CI runners.

---

## 2. Issues

### High
1. **No dependency-vulnerability gate in CI.** `ci.yml` runs `verify` (typecheck/lint/test/
   i18n/build) but never runs `npm audit` or an SCA scan. Vulnerable versions can be added
   without any signal. **Add `npm audit --audit-level=high` (or Snyk/Dependabot) to CI.**
2. **11 high + 2 critical advisories currently unaddressed**, several on directly reachable
   surfaces (uploads, WebSocket, email). See §1.1.

### Medium
3. **No automated dependency updates.** No Dependabot/Renovate config found
   (`.github/` has only `ci.yml`). Security patches depend on manual `npm audit fix`.
4. **Lockfile dual-checkout hazard (project-specific).** This repo is checked out on both
   Windows and WSL2 (see project memory); running `npm install` from the wrong side can
   corrupt `package-lock.json` (893 KB). Any dependency work must be done consistently from
   one environment, then `npm ci` verified.
5. **No SBOM / provenance.** No `npm sbom` or signed-provenance step for enterprise buyers.

### Low
6. **No license audit.** No check that transitive licenses are compatible with commercial
   distribution.

---

## 3. Recommended remediation order

1. `npm audit` → triage §1.1 first. Prefer minimum-bump `npm audit fix`; use
   `npm audit fix --force` only with a full `npm run verify` afterward (major bumps of
   Next/Prisma/NestJS can break the bleeding-edge stack — see file 13 §3).
2. Pin & patch `multer`, `ws`, `nodemailer`, `next`, `next-intl`, `lodash` explicitly.
3. Add `npm audit --audit-level=high` as a CI step (non-blocking first, then blocking).
4. Add Dependabot/Renovate with grouped PRs.
5. Re-run `npm ci` from the canonical checkout to confirm the lockfile is intact.

> **Caution:** because the toolchain is pre-release (Prisma 7, Next 15, Tailwind 4), a
> blind `audit fix --force` can regress the build. Bump one high-risk package at a time and
> run `npm run verify` between bumps.
