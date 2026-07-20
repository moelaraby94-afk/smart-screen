# Deployment & Operations Guide

This document covers zero-downtime deployment strategy, pre-deploy migrations,
CDN configuration, TLS automation, and disaster recovery for Cloud Screen.

---

## 1. Zero-Downtime Deployment Strategy

### 1.1 Application-Level Readiness

The backend implements a NestJS `enableShutdownHooks()` with an explicit
ordered graceful shutdown handler (25s force-exit timeout). The following
endpoints support health checking:

- `GET /health` — Liveness probe (process is up)
- `GET /ready` — Readiness probe (DB + Redis connected, accepting traffic)

### 1.2 Deployment Sequence (Docker/K8s)

1. **Start new container** with the updated image.
2. New container runs `/ready` — returns 503 until Prisma connects, Redis
   connects, and WebSocket gateway is ready.
3. **Load balancer** (Nginx/ALB) routes traffic to the new container once
   `/ready` returns 200.
4. **Old container** receives `SIGTERM` → NestJS graceful shutdown:
   - Stops accepting new HTTP connections
   - Drains in-flight requests (up to 25s)
   - Closes WebSocket connections with `1001` close code
   - Closes Prisma connection pool
   - Closes Redis client
5. Old container is removed after 30s grace period.

### 1.3 Pre-Deploy Migrations

Migrations **must** run before the application starts, as a separate
container/step:

```yaml
# docker-compose.yml or K8s init container
migration:
  image: cloud-screen-backend:latest
  command: npx prisma migrate deploy
  env:
    DATABASE_URL: ${DATABASE_URL}
  # Wait for completion before starting app
```

**Why `migrate deploy` (not `migrate dev`):**
- `deploy` only applies pending migrations, never generates new ones.
- Safe for production — fails fast if migration SQL is invalid.
- Idempotent — can be re-run safely.

**Backward-compatible migration rules:**
- Never drop columns in the same release that stops using them.
- Two-phase deploy: (1) add column + deploy code that writes to it,
  (2) next release: stop reading old column, (3) third release: drop old column.
- Never rename columns in-place — add new column, backfill, switch reads.

### 1.4 Rolling Update Configuration (K8s)

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0  # Never go below desired replicas
  template:
    spec:
      terminationGracePeriodSeconds: 35
      containers:
        - name: backend
          livenessProbe:
            httpGet: { path: /health, port: 3000 }
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet: { path: /ready, port: 3000 }
            initialDelaySeconds: 5
            periodSeconds: 5
```

---

## 2. CDN Support & TLS Automation

### 2.1 CDN Configuration

For serving static media files (`/media-files/*`), a CDN can be placed
in front of the backend. The backend already sets:

```
Cache-Control: public, max-age=31536000, immutable
Access-Control-Allow-Origin: *
Cross-Origin-Resource-Policy: cross-origin
```

**CDN setup (Cloudflare/Fastly/CloudFront):**

1. Origin: backend server (or load balancer)
2. Cache rules:
   - `/media-files/*` — cache for 1 year (matches `Cache-Control` header)
   - `/api/v1/*` — no cache (pass-through)
   - `/health`, `/ready` — no cache
3. Purge on media upload/delete (optional: call CDN purge API from
   `MediaService` if needed)

**Environment variables for CDN:**

| Variable | Description | Default |
|---|---|---|
| `MEDIA_CDN_BASE_URL` | CDN URL for media files (e.g., `https://cdn.example.com`) | unset (use origin) |
| `MEDIA_STORAGE_PROVIDER` | Storage backend (`local` or `s3`) | `local` |

When `MEDIA_CDN_BASE_URL` is set, `MediaService.toResponse()` should
prepend the CDN URL to `relativePath` instead of the origin URL.

### 2.2 TLS Automation

**Option A: Let's Encrypt + Caddy (recommended for single-server)**

```Caddyfile
example.com {
    reverse_proxy localhost:3000
    encode gzip zstd
    header /media-files/* Cache-Control "public, max-age=31536000, immutable"
}

cdn.example.com {
    reverse_proxy localhost:3000
    # Caddy auto-provisions Let's Encrypt certs
}
```

**Option B: Nginx + Certbot**

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /media-files/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Certbot renewal cron:
```bash
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

**Option C: Cloud Load Balancer (AWS ALB / GCP LB)**

- TLS termination at the load balancer
- Managed certificates (auto-renewed)
- Set `TRUST_PROXY_HOPS=1` so the backend trusts `X-Forwarded-For` headers

---

## 3. Disaster Recovery Plan

### 3.1 Backup Strategy

| Component | Method | Frequency | Retention |
|---|---|---|---|
| PostgreSQL | `pg_dump` or managed snapshot | Daily | 30 days |
| Redis | RDB snapshot (if persistence enabled) | Daily | 7 days |
| Media files (local) | `rsync` to backup volume or S3 sync | Daily | 30 days |
| Media files (S3) | S3 cross-region replication | Continuous | 90 days |
| Environment secrets | Secure vault (AWS Secrets Manager / Vault) | On change | Indefinite |

### 3.2 Recovery Procedures

#### Database Recovery

```bash
# 1. Stop the application
docker-compose stop backend

# 2. Restore from backup
pg_restore --clean --if-exists -d $DATABASE_URL < backup.sql

# 3. Run pending migrations
npx prisma migrate deploy

# 4. Restart
docker-compose up -d backend
```

#### Redis Recovery

Redis is used for caching and session revocation. If Redis is lost:
1. Application continues working (cache misses → DB fallback)
2. Session revocation list is lost — all refresh tokens remain valid
   until natural expiry
3. Restart Redis, application auto-reconnects
4. Optionally: force re-login for all users by rotating `JWT_ACCESS_SECRET`
   and `JWT_REFRESH_SECRET` (extreme cases only)

#### Media File Recovery

```bash
# From local backup
rsync -avz /backups/media/ /app/uploads/

# From S3
aws s3 sync s3://backup-bucket/media/ s3://production-bucket/media/
```

### 3.3 RTO and RPO

| Scenario | RTO (Recovery Time) | RPO (Data Loss) |
|---|---|---|
| Database failure (failover to replica) | < 1 min | 0 (sync replication) |
| Database failure (restore from backup) | < 30 min | < 24h (last backup) |
| Redis failure | < 1 min (auto-reconnect) | 0 (cache rebuilds) |
| Media storage failure | < 1 hour | 0 (if replicated) |
| Full region failure | < 4 hours | < 24h |

### 3.4 Monitoring & Alerting

| Metric | Alert Threshold | Action |
|---|---|---|
| `GET /ready` non-200 | > 3 consecutive failures | Page on-call |
| Database connection pool saturation | > 80% | Scale up or increase pool |
| Redis connection errors | > 5 in 1 min | Check Redis health |
| 5xx error rate | > 1% of requests | Investigate + rollback if needed |
| Response time p99 | > 2000ms | Investigate slow queries |
| Disk usage (media storage) | > 80% | Alert, > 90% page on-call |

### 3.5 Incident Response Checklist

1. **Acknowledge** — Confirm the alert is real (check dashboards)
2. **Assess** — Determine scope (single user, all users, specific region)
3. **Mitigate** — Rollback deployment, failover, or scale up
4. **Communicate** — Notify stakeholders (status page update)
5. **Resolve** — Apply fix, verify recovery
6. **Post-mortem** — Document root cause, timeline, and prevention measures
