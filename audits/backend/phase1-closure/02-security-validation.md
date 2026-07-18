# 02 — Security Validation

> **Reference:** OWASP ASVS v4.0, OWASP Top 10 (2021)  
> **Scope:** Phase 1 changes only — Redis, Storage, Shutdown, Health, Docker Compose  
> **Method:** Source code review against security best practices

---

## 1. Secrets Handling

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| S1 | No secrets hardcoded in source | ✅ Pass | All secrets read from `process.env` or `ConfigService` | `redis.service.ts:28`, `s3-storage.service.ts:45-63`, `prisma.service.ts:22` |
| S2 | `.env.example` uses placeholders, not real secrets | ✅ Pass | `.env.example:7-8` — `replace-with-strong-access-secret` | JWT secrets are placeholders. S3 credentials commented out. |
| S3 | Docker Compose uses `:?` for required secrets | ✅ Pass | `docker-compose.yml:99-101` — `${JWT_ACCESS_SECRET:?missing in .env}` | Compose aborts if secrets are missing. |
| S4 | Production secret validation at boot | ✅ Pass | `main.ts:45` — `assertProductionSecretsAreSet(process.env)` | Refuses to start in production without strong secrets. |
| S5 | S3 credentials not logged | ✅ Pass | `s3-storage.service.ts:66` — logs bucket name and endpoint, not credentials | `this.log.log(\`S3: configured bucket="${this.bucket}" provider="${this.config.get<string>('S3_ENDPOINT') ?? 'AWS'}"\`)` |

---

## 2. Environment Variables

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| E1 | All env vars documented in `.env.example` | ✅ Pass | `.env.example:97-118` | Redis, Storage, DB pool — all documented |
| E2 | Env var naming consistent | ⚠️ Minor | Plan uses `DATABASE_CONNECTION_LIMIT`, code uses `DATABASE_POOL_MAX` | Documentation mismatch, not a security issue. |
| E3 | No env vars exposed to client | ✅ Pass | All Phase 1 env vars are server-side only | `MEDIA_STORAGE_PROVIDER`, `S3_*`, `REDIS_URL` — none exposed via API responses |
| E4 | Docker Compose passes env vars correctly | ✅ Pass | `docker-compose.yml:78-136` | Uses `${VAR:-default}` pattern. S3 vars commented out (optional). |

---

## 3. Redis Authentication

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| R1 | Redis connection supports authentication | ✅ Pass | `redis.service.ts:37` — `new Redis(url, ...)` | `REDIS_URL` can include password: `redis://:password@host:port` |
| R2 | Docker Compose Redis has password | ❌ Fail | `docker-compose.yml:29` — `redis-server` without `requirepass` | **P2 Medium** — Fine for local dev, dangerous if exposed. Must configure for production. |
| R3 | Redis connection error handled gracefully | ✅ Pass | `redis.service.ts:52-54` — error event handler logs, doesn't crash | App continues with in-memory fallback if Redis is not configured. |
| R4 | Redis retry strategy has cap | ✅ Pass | `redis.service.ts:40-47` — stops after 10 retries, exponential backoff with 2s cap | Prevents infinite retry loops. |
| R5 | Redis prefix isolation | ✅ Pass | `redis-throttler-storage.ts:18` — `prefix = 'throttler:'` | Throttler keys are namespaced. Socket.IO adapter uses its own prefix. |

---

## 4. S3 Credentials & Signed URLs

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| S3.1 | S3 credentials from env, not hardcoded | ✅ Pass | `s3-storage.service.ts:60-63` | `config.get<string>('S3_ACCESS_KEY')`, `config.get<string>('S3_SECRET_KEY')` |
| S3.2 | S3 bucket required at construction | ✅ Pass | `s3-storage.service.ts:50-55` — throws if `S3_BUCKET` empty | Fail-fast when `MEDIA_STORAGE_PROVIDER=s3` without bucket. |
| S3.3 | Signed URL expiration configurable | ✅ Pass | `s3-storage.service.ts:137` — `expiresIn = 3600` default | Default 1 hour. Can be overridden per call. |
| S3.4 | Signed URL uses AWS SDK presigner | ✅ Pass | `s3-storage.service.ts:12,138-139` | `@aws-sdk/s3-request-presigner` — official AWS SDK. |
| S3.5 | S3 client uses HTTPS by default | ✅ Pass | `s3-storage.service.ts:57-65` | AWS SDK defaults to HTTPS. `S3_ENDPOINT` can override for MinIO (HTTP). |
| S3.6 | `forcePathStyle` for MinIO compatibility | ✅ Pass | `s3-storage.service.ts:64` | `Boolean(this.config.get<string>('S3_ENDPOINT'))` — true when endpoint is set. |

---

## 5. File Upload Safety

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| F1 | MIME type validation by file content (not extension) | ✅ Pass | `media.service.ts:140-142` — `fileTypeFromBuffer(params.buffer)` | Uses `file-type` library to detect actual file type from bytes. |
| F2 | Allowed MIME types whitelist | ✅ Pass | `media.service.ts:21-29` — `ALLOWED_MIME` set | Only images and videos. No executables, documents, or archives. |
| F3 | File size limit enforced | ✅ Pass | `media.service.ts:31` — `MAX_BYTES = 150 * 1024 * 1024` | 150MB max. |
| F4 | `.part` files not served | ✅ Pass | `main.ts:106-108` — 404 for `.part` paths | Partial uploads are never accessible via HTTP. |
| F5 | Storage quota enforcement | ✅ Pass | `media.service.ts:62-68` — advisory lock + quota check | Per-workspace storage limit enforced within transaction. |
| F6 | Path traversal prevention | ✅ Pass | `local-storage.service.ts:94-96` — `resolve()` uses `join(uploadRoot, ...key.split('/'))` | Keys are relative paths. `join()` normalizes. No `..` traversal possible. |

---

## 6. Error Leakage

| # | Check | Status | Evidence | Notes |
|---|-------|--------|----------|-------|
| E1 | S3 errors don't expose credentials | ✅ Pass | `s3-storage.service.ts:108-110` — `catch { return false; }` | `exists()` swallows errors. Other methods throw but AWS SDK doesn't include credentials in error messages. |
| E2 | Health check errors include messages | ⚠️ Acceptable | `health.service.ts:31,84` — `(err as Error).message` | Health check is an admin endpoint. Error messages help debugging. Not exposed to end users. |
| E3 | Redis errors logged, not exposed | ✅ Pass | `redis.service.ts:52-54` — logs `err.message` only | No stack traces or connection strings in logs. |
| E4 | Graceful shutdown errors logged | ✅ Pass | `main.ts:199` — `shutdownLog.error('Error during shutdown:', err)` | Shutdown errors are operational, not user-facing. |

---

## 7. OWASP Top 10 (2021) Cross-Reference

| OWASP Category | Phase 1 Relevance | Status | Notes |
|----------------|-------------------|--------|-------|
| A01: Broken Access Control | Not in Phase 1 scope | N/A | Auth/authorization unchanged. |
| A02: Cryptographic Failures | JWT secrets validated at boot | ✅ Pass | `assertProductionSecretsAreSet()` enforces strong secrets. |
| A03: Injection | Path traversal in file storage | ✅ Pass | `resolve()` uses `join()` with split keys. No string concatenation. |
| A04: Insecure Design | Redis without password in Docker | ⚠️ P2 | Document for production. Add `requirepass`. |
| A05: Security Misconfiguration | CORS, Helmet, Trust Proxy | ✅ Pass | Pre-existing, not Phase 1 scope. |
| A06: Vulnerable Components | Dependencies | ✅ Pass | `@aws-sdk/client-s3`, `ioredis`, `@nestjs/terminus` — all official, maintained. |
| A07: Auth Failures | Not in Phase 1 scope | N/A | Auth unchanged. |
| A08: Software/Data Integrity | File type validation | ✅ Pass | `file-type` validates by content, not extension. |
| A09: Logging/Monitoring Failures | Redis errors logged | ✅ Pass | Error and connection events logged. |
| A10: SSRF | S3 endpoint from env | ✅ Pass | `S3_ENDPOINT` is admin-configured, not user input. |

---

## 8. Security Findings Summary

| # | Finding | Severity | Status | Action |
|---|---------|----------|--------|--------|
| 1 | Docker Compose Redis has no password | P2 Medium | Open | Add `requirepass` via env var for production. Document in deployment guide. |
| 2 | Health check error messages may leak internal state | P3 Low | Acceptable | Health endpoint is admin-only. Terminus standard behavior. |
| 3 | No SSRF risk from S3 endpoint | P3 Low | Closed | `S3_ENDPOINT` is admin-configured, not user-controlled. |

**No P0 or P1 security issues found in Phase 1 code.**
