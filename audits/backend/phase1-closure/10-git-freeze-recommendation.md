# 10 — Git Freeze Recommendation

> **Date:** 2025-07-18  
> **Purpose:** Define the git freeze strategy for the Phase 1 baseline

---

## 1. Recommended Tag

```
git tag -a backend-phase1-freeze -m "Phase 1 — Foundation & Infrastructure freeze

Components:
- Redis service (ioredis) with lazy connect, retry, graceful shutdown
- Redis-backed throttler storage for distributed rate limiting
- Socket.IO Redis adapter for multi-instance WebSocket broadcasting
- Storage abstraction (IStorageService) with Local + S3 implementations
- Graceful shutdown with ordered cleanup + 25s force-exit
- Health checks (Terminus) for DB, Redis, Storage
- Prisma connection pool tuning via env vars
- Docker Compose with Redis + MinIO + health checks

DoD: 20/22 (91%)
Tests: 470/494 pass (24 pre-existing failures)
Build: PASS
TypeScript: 0 Phase 1 errors
ESLint: 0 Phase 1 errors

Known Issues: 20 (0 P0, 0 P1, 4 P2, 16 P3)
Technical Debt: 20 (0 P0, 5 P2, 15 P3)
Production Blockers: 0

See: audits/backend/phase1-closure/"
```

**Command:**
```bash
git tag -a backend-phase1-freeze -m "Phase 1 — Foundation & Infrastructure freeze"
```

---

## 2. Recommended Branch

**Current branch:** `fix/security-audit-v2`

**Recommendation:** Create a dedicated branch for Phase 2:

```bash
git checkout -b phase2/security-hardening
```

**Rationale:**
- `fix/security-audit-v2` contains Phase 1 work + prior audit fixes
- New branch keeps Phase 2 changes isolated for review
- `backend-phase1-freeze` tag marks the exact commit for rollback

**Alternative:** Continue on `fix/security-audit-v2` if the team prefers linear history. The tag provides the rollback point regardless.

---

## 3. Rollback Strategy

### Scenario: Phase 2 introduces regression

```bash
# 1. Stop the backend service
docker compose stop backend

# 2. Checkout the freeze tag
git checkout backend-phase1-freeze

# 3. Rebuild and restart
docker compose up --build backend -d
```

### Scenario: Database migration rollback

```bash
# 1. Identify the migration to revert
npx prisma migrate status --schema=apps/backend/prisma/schema.prisma

# 2. If a Phase 2 migration was applied, create a down migration
#    (Prisma does not support auto-down migrations — manual SQL required)

# 3. Checkout the freeze tag
git checkout backend-phase1-freeze

# 4. Deploy
docker compose up --build backend -d
```

### Rollback Scope

| Component | Rollback Complexity | Notes |
|-----------|--------------------|-------|
| Application code | Trivial — `git checkout tag` | No data migration needed |
| Database schema | Medium — requires down migration | Phase 2 may add columns/tables |
| Redis state | Trivial — flush or restart | No persistent state in Phase 1 |
| Storage | N/A — no migration performed | S3 migration is manual, separate from Phase 2 |

---

## 4. Recovery Plan

### If the backend fails to start after Phase 2 changes:

1. **Check logs:** `docker compose logs backend --tail 100`
2. **Check health:** `curl http://localhost:4000/health`
3. **If health fails:** `git checkout backend-phase1-freeze && docker compose up --build backend -d`
4. **If database migration failed:** Restore from latest backup (`backup.sh`)
5. **If Redis connection fails:** Check `REDIS_URL` in `.env`, verify Redis container: `docker compose ps redis`

### If data corruption occurs:

1. **Stop backend:** `docker compose stop backend`
2. **Restore PostgreSQL:** `pg_restore -d smartscreen < latest_backup.dump`
3. **Checkout freeze tag:** `git checkout backend-phase1-freeze`
4. **Restart:** `docker compose up --build backend -d`
5. **Verify:** `curl http://localhost:4000/ready` — should return 200

---

## 5. Hotfix Policy

### When to hotfix Phase 1 freeze:

| Condition | Action |
|-----------|--------|
| Production crash | Hotfix on `fix/security-audit-v2`, cherry-pick to Phase 2 branch |
| Security vulnerability (P0/P1) | Hotfix immediately, document in known issues, update tag |
| Data loss risk | Hotfix immediately, notify stakeholders |
| Non-critical bug | Document in known issues, fix in Phase 2 |

### Hotfix Process:

1. Create branch from tag: `git checkout -b hotfix/phase1-<issue> backend-phase1-freeze`
2. Fix the issue
3. Test: `npx tsc --noEmit && npx eslint "{src,test}/**/*.ts" && npx nest build`
4. Merge to `fix/security-audit-v2`: `git checkout fix/security-audit-v2 && git merge hotfix/phase1-<issue>`
5. Cherry-pick to Phase 2 branch: `git checkout phase2/security-hardening && git cherry-pick <commit>`
6. Update tag if critical: `git tag -f backend-phase1-freeze -m "Updated: hotfix for <issue>"`
7. Document in `06-known-issues-baseline.md`

---

## 6. Release Notes

### Phase 1 — Foundation & Infrastructure

**Release Date:** 2025-07-18

**What's New:**
- Redis integration with `ioredis` — lazy connection, retry strategy, graceful shutdown
- Distributed rate limiting via Redis-backed throttler storage
- Multi-instance WebSocket broadcasting via Socket.IO Redis adapter
- Storage abstraction layer with Local filesystem and S3-compatible implementations (AWS S3, MinIO, Cloudflare R2)
- Graceful shutdown with ordered cleanup (HTTP → WebSocket → Redis → Prisma) and 25s force-exit timeout
- Health checks for database, Redis, and storage using `@nestjs/terminus`
- Configurable database connection pool via `DATABASE_POOL_MAX` and `DATABASE_POOL_TIMEOUT_MS`
- Docker Compose with Redis and MinIO services with health checks

**Environment Variables Added:**
- `REDIS_URL` — Redis connection string (optional, enables multi-instance features)
- `MEDIA_STORAGE_PROVIDER` — `local` (default) or `s3`
- `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` — S3 configuration
- `DATABASE_POOL_MAX` — Max DB connections (default 10)
- `DATABASE_POOL_TIMEOUT_MS` — Connection acquisition timeout (default 30000)

**Known Issues:** 20 (0 P0, 0 P1, 4 P2, 16 P3) — see `06-known-issues-baseline.md`

**Technical Debt:** 20 items — see `07-technical-debt-register.md`

**Test Results:** 470/494 pass (24 pre-existing failures, 0 Phase 1 failures)

**Breaking Changes:** None

**Migration Required:** No database migrations in Phase 1

---

## 7. Merge Policy

### Phase 2 Development

| Rule | Policy |
|------|--------|
| Branch | `phase2/security-hardening` (recommended) or continue on `fix/security-audit-v2` |
| Merge strategy | Squash merge or rebase (team preference) |
| PR requirement | All PRs must pass: TypeScript + ESLint + Build |
| Review requirement | At least 1 reviewer for non-trivial changes |
| Hotfix merge | Cherry-pick to both `fix/security-audit-v2` and Phase 2 branch |
| Tag updates | Only for critical hotfixes — use `git tag -f` with updated message |
| Phase 1 tag | `backend-phase1-freeze` — do not delete, do not move unless critical hotfix |

### Phase 2 Completion

At Phase 2 completion:
1. Create tag: `backend-phase2-freeze`
2. Update `08-production-baseline.md` with Phase 2 status
3. Create new Phase 3 entry gate checklist
4. Update this document with Phase 2 release notes

---

## 8. Git History Preservation

- **Do not squash** Phase 1 commits — preserve history for audit trail
- **Do not rebase** commits that have been pushed to remote
- **Do not force-push** to `fix/security-audit-v2` or any tagged commit
- **Do not delete** the `backend-phase1-freeze` tag
