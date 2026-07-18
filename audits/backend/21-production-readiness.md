# 21 — Production Readiness Audit

> **Objective:** Evaluate whether the backend is ready for production deployment: infrastructure, scalability, monitoring, deployment strategy, and operational readiness.

---

## 1. Current State

The backend is **NOT ready for production deployment**. While the application code is well-structured and feature-complete for core signage functionality, three critical infrastructure gaps prevent production deployment: no Redis, no object storage, and no graceful shutdown.

---

## 2. What Exists

### Production-Ready Features
- **Environment-based configuration** — `ConfigModule` with `.env` validation
- **Production secret assertion** — `assertProductionSecretsAreSet()` validates at boot
- **Helmet security headers** — HTTP security headers configured
- **CORS allow-list** — Production requires explicit `ALLOWED_ORIGINS`
- **Sentry error reporting** — `@sentry/nestjs` with PII scrubbing
- **Health checks** — `/health` (liveness) and `/ready` (readiness with Prisma check)
- **Metrics collection** — `MetricsMiddleware` records request duration
- **Audit logging** — Postgres-backed with 90-day retention
- **Rate limiting** — `@nestjs/throttler` with per-endpoint overrides
- **CSRF protection** — Double-submit token middleware
- **Input validation** — Global `ValidationPipe` with whitelist + transform
- **Error normalization** — `AllExceptionsFilter` with stable error codes
- **Docker support** — `Dockerfile.backend` and `docker-compose.yml`
- **Prisma migrations** — `prisma migrate deploy` on boot
- **Seed script** — With production safeguard

### Deployment Infrastructure
- **Docker:** `Dockerfile.backend` exists (single-stage)
- **Docker Compose:** `docker-compose.yml` with backend, PostgreSQL, and player services
- **CI:** `.github/workflows/ci.yml` exists
- **Scripts:** `backup.sh`, `clean-build.cjs`, `sync-and-rebuild.sh`

---

## 3. What Is Missing

### Critical (P0 — Blocking Production)

1. **No Redis** — Rate limiting (throttler) uses in-memory store. WebSocket adapter is in-memory. No caching layer. Multi-instance deployment will have:
   - Inconsistent rate limiting (each instance tracks separately)
   - Broken WebSocket event delivery (events emitted on one instance don't reach sockets on another)
   - No session sharing between instances

2. **No Object Storage (S3/MinIO)** — Media files stored on local filesystem. Containerized deployments have ephemeral filesystems. Container restart = media loss. No backup strategy for uploaded files. No CDN for media delivery.

3. **No Graceful Shutdown** — `main.ts` calls `app.listen()` without shutdown hooks. SIGTERM (from Kubernetes/Docker) will:
   - Drop in-flight HTTP requests
   - Disconnect WebSocket sockets without notification
   - Kill the process without completing pending DB operations
   - No drain period for load balancer deregistration

4. **No Health Check for Dependencies** — `/ready` only checks Prisma `$connect()`. No checks for:
   - Redis connectivity
   - S3/MinIO connectivity
   - Email provider availability
   - Stripe API reachability

5. **No Database Connection Pool Tuning** — Default Prisma pool size. Under high concurrency, pool exhaustion will cause request failures. No `connection_limit` or `pool_timeout` configured.

### High (P1 — Fix Before Scale)

6. **No Structured Logging** — Uses NestJS `Logger` class (plain text). No JSON structured logging for log aggregation (ELK, Datadog, CloudWatch). No request ID for log correlation.

7. **No Metrics Endpoint** — `MetricsService` collects data but no `/metrics` endpoint for Prometheus scraping. No Grafana dashboards.

8. **No Docker Multi-Stage Build** — `Dockerfile.backend` is single-stage. Image includes dev dependencies, source maps, and build tools. Larger image, slower deployments.

9. **No Zero-Downtime Deployment Strategy** — Prisma migrations run on boot. Adding a required column will fail mid-deploy when the old instance is still running. No rolling deployment strategy.

10. **No Backup Strategy** — `backup.sh` exists but no automated backup schedule. No point-in-time recovery. No backup verification.

11. **No Environment Variable Validation** — `ConfigModule` is used but no validation schema (Joi) for required env vars. Missing vars cause runtime errors instead of clear boot failure.

### Medium (P2 — Fix During Phase 2)

12. **No API Documentation** — No Swagger/OpenAPI. API consumers have no reference.
13. **No Load Testing** — No performance validation under load.
14. **No Security Penetration Testing** — No security assessment.
15. **No Disaster Recovery Plan** — No RTO/RPO defined. No failover strategy.
16. **No CDN for Media** — Static assets served by API process.
17. **No WAF (Web Application Firewall)** — No AWS WAF, Cloudflare, or similar.
18. **No DDoS Protection** — No Cloudflare or AWS Shield.
19. **No Certificate Management** — No automatic TLS certificate renewal.
20. **No Secret Rotation Strategy** — JWT secrets set once, never rotated.

---

## 4. Production Readiness Checklist

| Item | Status | Notes |
|------|--------|-------|
| Redis | ❌ Not installed | Critical for scaling |
| S3/MinIO | ❌ Not installed | Critical for media storage |
| Graceful shutdown | ❌ Missing | Critical for K8s |
| Health checks (deps) | ❌ Partial | Only Prisma checked |
| Connection pool tuning | ❌ Missing | Default pool size |
| Structured logging | ❌ Missing | Plain text only |
| Request ID | ❌ Missing | No log correlation |
| Metrics endpoint | ❌ Missing | No Prometheus scraping |
| Docker multi-stage | ❌ Missing | Single-stage build |
| Zero-downtime deploy | ❌ Missing | Migrations on boot |
| Backup automation | ❌ Missing | Manual script only |
| Env var validation | ❌ Missing | No Joi schema |
| API documentation | ❌ Missing | No Swagger |
| Load testing | ❌ Missing | Not performed |
| Security testing | ❌ Missing | Not performed |
| CDN | ❌ Missing | API serves static |
| WAF | ❌ Missing | Not configured |
| DDoS protection | ❌ Missing | Not configured |
| TLS cert management | ❌ Missing | Not automated |
| Secret rotation | ❌ Missing | Not planned |
| Helmet | ✅ Enabled | Security headers |
| CORS | ✅ Configured | Production allow-list |
| CSRF | ✅ Enabled | Double-submit token |
| Rate limiting | ✅ Enabled | Per-endpoint overrides |
| Sentry | ✅ Enabled | Error reporting + PII scrub |
| Audit logging | ✅ Enabled | Postgres-backed |
| Error handling | ✅ Centralized | AllExceptionsFilter |
| Input validation | ✅ Global | ValidationPipe |
| Auth (JWT + 2FA) | ✅ Complete | With lockout + OTP |
| RBAC | ✅ Complete | 4 roles + platform staff |
| Prisma migrations | ✅ Automated | Deploy on boot |
| Seed script | ✅ Guarded | Production safeguard |
| Health endpoint | ✅ Partial | Liveness + Prisma only |

**Score: 12/32 ready (37.5%)**

---

## 5. Risks

- **Critical: No Redis** — Can't scale beyond single instance
- **Critical: No S3** — Media lost on container restart
- **Critical: No graceful shutdown** — Data loss on deployment
- **High: No structured logging** — Can't debug production issues
- **High: No metrics** — Can't monitor production health
- **High: No zero-downtime deploy** — Downtime on every deployment
- **Medium: No backup automation** — Data loss risk
- **Medium: No security testing** — Unknown vulnerabilities

---

## 6. Priority: **Critical**

Production readiness is the most critical gap. Three P0 items block deployment.

---

## 7. Completion Percentage: **60%**

Application code is production-quality. Infrastructure is not. 12/32 production readiness items are complete.

---

## 8. Recommendations

### Sprint 1 (Weeks 1-2): Critical Infrastructure
1. Add Redis module: `@nestjs/bull` for queues, `@socket.io/redis-adapter` for WS, custom Redis cache service
2. Add S3/MinIO storage: `@aws-sdk/client-s3` with `MEDIA_STORAGE_PROVIDER` env var
3. Add graceful shutdown: `app.enableShutdownHooks()` + SIGTERM handler with 30s drain
4. Add health check dependencies: Redis ping, S3 head bucket, email provider check
5. Add database connection pool tuning: `connection_limit=10`, `pool_timeout=30`

### Sprint 2 (Weeks 3-4): Observability
6. Add structured JSON logging: `nestjs-pino` or custom JSON logger
7. Add request ID middleware: UUID per request, in logs and response headers
8. Add `/metrics` endpoint for Prometheus scraping
9. Add Docker multi-stage build
10. Add env var validation with Joi schema

### Sprint 3 (Weeks 5-6): Deployment & Security
11. Add zero-downtime deployment strategy: pre-deploy migrations, rolling updates
12. Add automated backup with pg_dump schedule
13. Add CDN for media (CloudFront/Cloudflare)
14. Add WAF rules
15. Add TLS certificate automation (Let's Encrypt / ACM)

### Sprint 4 (Weeks 7-8): Validation
16. Add load testing with k6
17. Conduct security penetration test
18. Define disaster recovery plan (RTO/RPO)
19. Add secret rotation strategy
20. Add API documentation (Swagger)

---

## 9. Future Tasks

- [ ] Add Redis module (cache + WS adapter + throttler store)
- [ ] Add S3/MinIO storage adapter
- [ ] Add graceful shutdown with SIGTERM handler
- [ ] Add health checks for Redis, S3, email
- [ ] Tune database connection pool
- [ ] Add structured JSON logging
- [ ] Add request ID middleware
- [ ] Add /metrics endpoint
- [ ] Add Docker multi-stage build
- [ ] Add env var validation with Joi
- [ ] Add zero-downtime deployment strategy
- [ ] Add automated backup schedule
- [ ] Add CDN for media
- [ ] Add WAF
- [ ] Add TLS certificate automation
- [ ] Add secret rotation strategy
- [ ] Add load testing
- [ ] Conduct security penetration test
- [ ] Define disaster recovery plan
- [ ] Add Swagger/OpenAPI documentation
