# 12 — Operations

> **Document Type:** Operations Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** DevOps, CI/CD, observability, monitoring, backups, disaster recovery, incident response

---

## 1. DevOps

### 1.1 Development Workflow

```
Developer creates branch
  │
  ├── Writes code + tests
  ├── Runs locally: docker-compose up
  ├── Runs: npm run lint && npm run build && npm test
  │
  ▼
Push to branch
  │
  ├── CI: lint, type-check, build, test
  ├── CI: security scan (npm audit, SAST)
  ├── CI: preview deployment (Vercel/Netlify preview)
  │
  ▼
Pull Request
  │
  ├── Code review (at least 1 approver)
  ├── CI must pass
  ├── Preview deployment verified
  │
  ▼
Merge to main
  │
  ├── CI: full build + test
  ├── CD: staging deployment
  ├── Smoke tests on staging
  │
  ▼
Manual approval
  │
  ├── CD: production deployment
  ├── Health check post-deploy
  ├── Rollback if health check fails
```

### 1.2 Branch Strategy

| Branch | Purpose | Lifetime |
|---|---|---|
| `main` | Production-ready code | Permanent |
| `develop` | Integration branch (future) | Permanent |
| `feature/*` | New features | Merged or abandoned |
| `fix/*` | Bug fixes | Merged or abandoned |
| `hotfix/*` | Production hotfixes | Merged, then deleted |

### 1.3 Environment Strategy

| Environment | Purpose | Data | Access |
|---|---|---|---|
| **Local** | Development | Mock/seed | Developer |
| **Preview** | PR review | Seeded | Developer + reviewer |
| **Staging** | Pre-production testing | Anonymized production copy | Team |
| **Production** | Live | Real | Restricted (deploy only) |

---

## 2. CI/CD Pipeline

### 2.1 CI Pipeline (on every push/PR)

```yaml
# .github/workflows/ci.yml (conceptual)
name: CI
on: [push, pull_request]

jobs:
  lint:
    - npm ci
    - npm run lint (all workspaces)

  type-check:
    - npm run type-check (all workspaces)

  build:
    - npm run build (all workspaces)
    - Upload build artifacts

  test:
    - npm run test (unit + integration)
    - Upload coverage report

  security:
    - npm audit (production deps)
    - SAST scan (SonarQube or CodeQL)

  e2e:
    - Build apps
    - Start docker-compose
    - Run Playwright E2E tests
```

### 2.2 CD Pipeline (on merge to main)

```yaml
# .github/workflows/deploy.yml (conceptual)
name: Deploy
on:
  push:
    branches: [main]

jobs:
  build-and-deploy-staging:
    - Build Docker images
    - Push to registry
    - Deploy to staging
    - Run smoke tests
    - Notify team

  deploy-production:
    needs: build-and-deploy-staging
    if: manual_approval
    - Deploy to production (rolling update)
    - Health check (30s wait)
    - If health check fails: auto-rollback
    - Notify team + create deployment record
```

### 2.3 Deployment Strategy

| App | Strategy | Downtime | Rollback |
|---|---|---|---|
| API | Rolling update (K8s) | Zero | Auto-rollback on health check fail |
| Frontend (Control Panel) | Rolling update | Zero | Instant (previous image) |
| Frontend (Customer Workspace) | Rolling update | Zero | Instant (previous image) |
| Realtime | Rolling update | Brief (reconnect) | Auto-rollback |
| Workers | Rolling update | Zero | Auto-rollback |
| Database | Migration (additive) | Zero | Migration down (if needed) |

### 2.4 Database Migration Strategy

```
Migration created (additive — new columns, new tables)
  │
  ├── Deployed to staging
  ├── Tested on staging
  │
  ▼
Deploy to production
  │
  ├── Migration runs BEFORE code deploy
  ├── Old code works with new schema (additive only)
  ├── New code deployed (uses new columns/tables)
  │
  ▼
If rollback needed
  │
  ├── Old code redeployed (works with new schema — additive)
  ├── Migration NOT reversed (additive columns stay)
  ├── Destructive migration only in next release (after rollback window)
```

**Rules:**
1. Migrations are always additive (new columns, new tables, new indexes)
2. Column removals are deferred to a subsequent release (after code no longer references them)
3. Index creation uses `CREATE INDEX CONCURRENTLY` (no table lock)
4. Large table migrations are batched (update in chunks)

---

## 3. Observability

### 3.1 Observability Pillars

```
┌─────────────────────────────────────────────────┐
│                OBSERVABILITY                      │
│                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Metrics  │  │  Logs    │  │  Traces  │      │
│  │           │  │          │  │          │      │
│  │ Prometheus│  │  Loki    │  │  Jaeger  │      │
│  │ + Grafana │  │          │  │          │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│  ┌──────────┐  ┌──────────┐                    │
│  │  Alerts  │  │  Dashbd  │                    │
│  │ Alertmgr │  │  Grafana │                    │
│  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────┘
```

### 3.2 Metrics

#### Application Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | method, route, status | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | method, route, status | Request latency |
| `http_requests_in_flight` | Gauge | — | Active requests |
| `websocket_connections` | Gauge | audience | Active WebSocket connections |
| `websocket_messages_total` | Counter | event, direction | WebSocket messages |
| `job_queue_depth` | Gauge | queue | Jobs waiting |
| `job_processing_duration_seconds` | Histogram | queue, job | Job processing time |
| `job_failures_total` | Counter | queue, job | Failed jobs |
| `db_query_duration_seconds` | Histogram | operation, model | DB query latency |
| `db_connections_active` | Gauge | — | Active DB connections |
| `cache_hits_total` | Counter | key_pattern | Cache hits |
| `cache_misses_total` | Counter | key_pattern | Cache misses |
| `storage_bytes_used` | Gauge | workspace | Storage per workspace |
| `screens_online` | Gauge | workspace | Online screens per workspace |

#### Business Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `customers_active` | Gauge | plan | Active customers |
| `screens_active` | Gauge | plan | Active screens |
| `mrr_current` | Gauge | — | Monthly recurring revenue |
| `trial_conversions_total` | Counter | plan | Trial → paid conversions |
| `churns_total` | Counter | plan | Customer churns |
| `tickets_open` | Gauge | priority | Open support tickets |
| `impersonations_active` | Gauge | — | Active impersonations |

#### Infrastructure Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `container_cpu_usage` | Gauge | pod | CPU usage per pod |
| `container_memory_usage` | Gauge | pod | Memory usage per pod |
| `container_restart_total` | Counter | pod | Container restarts |
| `node_cpu_usage` | Gauge | node | Node CPU |
| `node_memory_usage` | Gauge | node | Node memory |
| `node_disk_usage` | Gauge | node, disk | Disk usage |
| `network_bytes_transferred` | Counter | direction | Network I/O |

### 3.3 Logging

#### Log Levels

| Level | Usage | Environment |
|---|---|---|
| `error` | Errors, exceptions, failures | All |
| `warn` | Warnings, degraded behavior | All |
| `info` | Significant events (login, deploy) | All |
| `debug` | Detailed diagnostic info | Staging, local |
| `trace` | Very detailed (SQL, cache) | Local only |

#### Log Format (Structured JSON)

```json
{
  "timestamp": "2026-07-18T12:00:00.000Z",
  "level": "info",
  "service": "api",
  "environment": "production",
  "requestId": "req-uuid",
  "userId": "user-uuid",
  "workspaceId": "ws-uuid",
  "method": "POST",
  "route": "/customer/screens",
  "statusCode": 201,
  "durationMs": 145,
  "message": "Screen created",
  "metadata": { "screenId": "screen-uuid" }
}
```

#### Log Aggregation

| Tier | Tool | Retention |
|---|---|---|
| T1-T2 | File-based + Docker logs | 7 days |
| T3 | Loki + Grafana | 30 days |
| T4 | Loki + Grafana + S3 archive | 90 days hot, 1 year archive |

### 3.4 Tracing

Distributed tracing (T3+) using OpenTelemetry + Jaeger:

```
Browser request
  │
  ├── Span: HTTP POST /customer/screens (145ms)
  │   ├── Span: JwtAuthGuard (2ms)
  │   ├── Span: AudienceGuard (1ms)
  │   ├── Span: RolesGuard (5ms)
  │   ├── Span: QuotaGuard (8ms)
  │   ├── Span: ScreensService.create (120ms)
  │   │   ├── Span: Prisma.screen.create (45ms)
  │   │   ├── Span: Prisma.workspace.update (20ms)
  │   │   ├── Span: Redis.cache.invalidate (3ms)
  │   │   └── Span: AuditLog.append (15ms)
  │   └── Span: ResponseSerializer (5ms)
  │
  └── Total: 145ms
```

### 3.5 Dashboards

| Dashboard | Audience | Panels |
|---|---|---|
| **API Health** | Operations | Request rate, latency p50/p95/p99, error rate, status codes |
| **Database** | Operations | Connections, query latency, slow queries, replication lag |
| **Realtime** | Operations | Connections, messages/sec, rooms, disconnects |
| **Workers** | Operations | Queue depth, processing time, failures, retries |
| **Business** | Platform team | MRR, active customers, churn, trial conversion |
| **Support** | Support team | Open tickets, response time, satisfaction |
| **Security** | Security team | Failed logins, impersonations, audit alerts, WAF blocks |
| **Infrastructure** | Operations | CPU, memory, disk, network per node/pod |

---

## 4. Alerting

### 4.1 Alert Rules

| Alert | Condition | Severity | Notification |
|---|---|---|---|
| API down | Health check fails for 3 consecutive checks (30s) | SEV-1 | PagerDuty + Slack |
| API high latency | p95 > 500ms for 5 min | SEV-2 | Slack |
| API error rate | 5xx > 5% for 5 min | SEV-2 | Slack |
| DB connections high | > 80% of pool for 10 min | SEV-2 | Slack |
| DB replication lag | > 10s for 5 min | SEV-2 | Slack |
| Redis down | Health check fails | SEV-1 | PagerDuty + Slack |
| Queue depth high | > 1000 jobs for 10 min | SEV-3 | Slack |
| Worker failure rate | > 10% for 10 min | SEV-3 | Slack |
| Disk usage high | > 80% | SEV-3 | Slack |
| Disk usage critical | > 95% | SEV-1 | PagerDuty + Slack |
| Certificate expiring | < 14 days | SEV-3 | Slack |
| Certificate expired | Expired | SEV-1 | PagerDuty + Slack |
| WebSocket disconnects | > 50% disconnect in 5 min | SEV-2 | Slack |
| Failed logins spike | > 100 failed logins in 5 min | SEV-2 | Security + Slack |
| Impersonation active | Any active impersonation | Info | Slack (info) |
| Payment failure spike | > 10 failed payments in 1 hour | SEV-3 | Billing + Slack |

### 4.2 Notification Channels

| Channel | Severity | Use |
|---|---|---|
| PagerDuty | SEV-1 | 24/7 on-call alert |
| Slack #alerts | SEV-1, SEV-2, SEV-3 | Team visibility |
| Slack #info | Info | Non-urgent notifications |
| Email | SEV-1, SEV-2 | Backup notification |
| SMS | SEV-1 | Critical backup |

### 4.3 On-Call Rotation

| Role | Rotation | Hours |
|---|---|---|
| Primary on-call | Weekly | 24/7 |
| Secondary on-call | Weekly | 24/7 (backup) |
| Escalation manager | Monthly | Business hours |

---

## 5. Backups

### 5.1 Backup Strategy

| Data | Type | Frequency | Retention | Storage |
|---|---|---|---|---|
| PostgreSQL | Full dump | Daily (2:00 AM) | 30 days | MinIO/S3 + offsite |
| PostgreSQL | WAL streaming | Continuous | 7 days | MinIO/S3 |
| Redis | RDB snapshot | Daily (3:00 AM) | 7 days | MinIO/S3 |
| MinIO/S3 | Bucket replication | Continuous | N/A (replica) | Cross-region |
| Config/Secrets | Vault backup | Daily | 90 days | Encrypted offsite |

### 5.2 Backup Verification

| Verification | Frequency | Method |
|---|---|---|
| Backup exists | Daily | Automated check (file exists, size > 0) |
| Backup integrity | Weekly | Restore to test env, run smoke tests |
| Restore drill | Quarterly | Full restore to staging, verify data |
| Restore time | Quarterly | Measure RTO, compare to target |

### 5.3 Backup Encryption

- All backups encrypted with AES-256
- Encryption keys stored in Vault (separate from backup storage)
- Offsite copy stored in different region/provider

---

## 6. Disaster Recovery

### 6.1 RTO and RPO Targets

| Tier | RTO (Recovery Time) | RPO (Data Loss) |
|---|---|---|
| T1 | 4 hours | 24 hours |
| T2 | 2 hours | 1 hour |
| T3 | 1 hour | 15 minutes |
| T4 | 30 minutes | 5 minutes |

### 6.2 Disaster Scenarios

| Scenario | Impact | Recovery |
|---|---|---|
| API pod failure | Degraded service | Auto-restart (K8s) — 30s |
| Database failure | Service down | Failover to replica — 5 min |
| Redis failure | Sessions lost, cache miss | Failover to replica — 1 min |
| Storage failure | Media unavailable | Failover to replica — 5 min |
| Network outage | Service unavailable | Cloudflare failover — 5 min |
| Data center outage | Service down | Multi-AZ failover — 30 min |
| Region outage | Service down | Multi-region failover — 1 hour (T4) |
| Ransomware | Data encrypted | Restore from offsite backup — 4 hours |
| Accidental deletion | Data lost | Restore from backup — 2 hours |

### 6.3 Disaster Recovery Plan

```
Disaster detected (monitoring, alert, manual)
  │
  ▼
Declare incident (incident commander)
  │
  ├── Assess scope (what's down, what data is affected)
  ├── Notify stakeholders (team, customers if needed)
  │
  ▼
Execute recovery
  │
  ├── Scenario: DB failure
  │   ├── Promote read replica to primary
  │   ├── Update connection strings
  │   ├── Restart API pods
  │   └── Verify data integrity
  │
  ├── Scenario: Region failure
  │   ├── Switch DNS to secondary region
  │   ├── Promote secondary DB
  │   ├── Scale up secondary region
  │   └── Verify service
  │
  ├── Scenario: Data corruption
  │   ├── Stop writes (maintenance mode)
  │   ├── Restore from latest backup
  │   ├── Replay WAL logs (to minimize data loss)
  │   ├── Verify data integrity
  │   └── Resume service
  │
  ▼
Post-recovery
  │
  ├── Verify all services operational
  ├── Run smoke tests
  ├── Notify stakeholders of resolution
  ├── Document timeline
  └── Post-mortem within 48 hours
```

### 6.4 Multi-Region Strategy (T4)

```
┌──────────────────────┐     ┌──────────────────────┐
│  Primary Region       │     │  Secondary Region     │
│  (us-east-1)          │     │  (eu-west-1)          │
│                       │     │                       │
│  ┌──────────┐        │     │  ┌──────────┐        │
│  │  API (8+) │        │     │  │  API (2)  │        │
│  └──────────┘        │     │  └──────────┘        │
│  ┌──────────┐        │     │  ┌──────────┐        │
│  │  DB Prim  │───────┼────►│  │  DB Repl  │        │
│  └──────────┘        │     │  └──────────┘        │
│  ┌──────────┐        │     │  ┌──────────┐        │
│  │  Redis    │───────┼────►│  │  Redis    │        │
│  └──────────┘        │     │  └──────────┘        │
│  ┌──────────┐        │     │  ┌──────────┐        │
│  │  S3       │───────┼────►│  │  S3       │        │
│  └──────────┘        │     │  └──────────┘        │
└──────────────────────┘     └──────────────────────┘

Cloudflare DNS (geo-routing + failover)
```

---

## 7. Health Checks

### 7.1 Health Check Endpoints

| Endpoint | Check | Expected |
|---|---|---|
| `GET /health` | Overall | 200 if all checks pass |
| `GET /health/db` | DB connection | 200 if query succeeds |
| `GET /health/redis` | Redis ping | 200 if PONG |
| `GET /health/storage` | MinIO/S3 | 200 if bucket accessible |
| `GET /health/realtime` | WebSocket | 200 if gateway responsive |
| `GET /health/queues` | Queue health | 200 if no stalled jobs |
| `GET /health/detailed` | All + details | 200 with JSON breakdown (JWT platform) |

### 7.2 Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-07-18T12:00:00Z",
  "checks": {
    "database": { "status": "healthy", "latencyMs": 5 },
    "redis": { "status": "healthy", "latencyMs": 1 },
    "storage": { "status": "healthy", "latencyMs": 12 },
    "realtime": { "status": "healthy", "connections": 4500 },
    "queues": { "status": "healthy", "depth": { "email": 3, "webhook": 0, "analytics": 15 } }
  }
}
```

### 7.3 Load Balancer Health Check

- **Endpoint:** `GET /health`
- **Interval:** 10 seconds
- **Timeout:** 5 seconds
- **Healthy threshold:** 2 consecutive successes
- **Unhealthy threshold:** 3 consecutive failures
- **Action on unhealthy:** Remove from rotation

---

## 8. Maintenance Mode

### 8.1 Maintenance Mode Flow

```
Platform staff enables maintenance mode
  │
  ├── PlatformSettings.maintenanceMode = true
  ├── PlatformSettings.maintenanceMessage = "We'll be back at 3:00 PM UTC"
  ├── Cache invalidated (platform:settings)
  │
  ▼
API behavior during maintenance
  │
  ├── All /customer/* requests → 503 (Maintenance) with message
  ├── All /platform/* requests → Normal (staff can still work)
  ├── All /player/* requests → Normal (screens keep playing)
  ├── All /auth/* requests → Normal (users can still login)
  ├── All /public/* requests → Normal
  │
  ▼
Frontend behavior during maintenance
  │
  ├── Customer Workspace: Shows maintenance page
  ├── Control Panel: Shows maintenance banner (but functional)
  ├── Player: Continues playing cached content
  │
  ▼
Platform staff disables maintenance mode
  │
  ├── PlatformSettings.maintenanceMode = false
  ├── Cache invalidated
  ├── Normal operation resumes
```

### 8.2 Maintenance Window

| Type | Duration | Frequency | Notice |
|---|---|---|---|
| Routine | 30 min | Weekly (Sunday 2:00 AM UTC) | 48 hours |
| Major update | 1 hour | Monthly | 7 days |
| Emergency | Indefinite | As needed | Immediate |

---

## 9. Release Management

### 9.1 Release Cadence

| Type | Frequency | Scope |
|---|---|---|
| Patch | As needed | Bug fixes, security patches |
| Minor | Bi-weekly | New features, improvements |
| Major | Quarterly | Significant features, breaking changes |

### 9.2 Release Process

```
Feature branch merged to main
  │
  ├── Auto-deploy to staging
  ├── Smoke tests pass
  │
  ▼
Release window (Tuesday/Thursday)
  │
  ├── Create release tag (v1.2.3)
  ├── Generate changelog
  ├── Deploy to production
  ├── Health check
  ├── Monitor for 30 min
  │
  ▼
Release complete
  │
  ├── Update release notes
  ├── Notify team
  ├── Archive release branch
```

### 9.3 Rollback

| Trigger | Action | Time |
|---|---|---|
| Health check fails post-deploy | Auto-rollback to previous image | 30s |
| Error rate > 10% post-deploy | Manual rollback | 2 min |
| Critical bug found | Manual rollback | 5 min |
| DB migration issue | Redeploy old code (additive migration) | 5 min |

---

## 10. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Docker Compose (T1-T2) | Yes | Simple, one developer can manage |
| Kubernetes (T3+) | Yes | Autoscaling, self-healing, rolling updates |
| CI/CD via GitHub Actions | Yes | Integrated with code, free for small teams |
| Prometheus + Grafana | Yes (T3+) | Industry standard, open source |
| Loki for logs | Yes (T3+) | Integrates with Grafana, cost-effective |
| Jaeger for tracing | Yes (T3+) | OpenTelemetry-compatible |
| Daily DB backups | Yes | Balance between RPO and storage cost |
| WAL streaming | Yes (T2+) | Minimize data loss (RPO < 1 hour) |
| Multi-region (T4) | Yes | Disaster recovery, global latency |
| Maintenance mode | Yes | Zero-downtime maintenance for customers |
| Auto-rollback | Yes | Prevent bad deployments from affecting users |
| Additive migrations only | Yes | Zero-downtime, backward-compatible |
