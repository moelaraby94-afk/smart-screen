# 10 — Scalability

> **Document Type:** Scalability Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Scale tiers, capacity planning, infrastructure scaling, performance targets

---

## 1. Scale Tiers

### 1.1 Tier Overview

| Tier | Customers | Screens | API req/s | WebSocket conn | Storage | DB size |
|---|---|---|---|---|---|---|
| **T1: Startup** | 100 | 500 | 50 | 500 | 50 GB | 5 GB |
| **T2: Growth** | 1,000 | 5,000 | 200 | 5,000 | 500 GB | 50 GB |
| **T3: Scale** | 10,000 | 50,000 | 1,000 | 50,000 | 5 TB | 500 GB |
| **T4: Enterprise** | 100,000 | 500,000 | 5,000 | 500,000 | 50 TB | 5 TB |

### 1.2 What Changes at Each Tier

| Component | T1 (100) | T2 (1K) | T3 (10K) | T4 (100K) |
|---|---|---|---|---|
| **API processes** | 1 | 2 | 4 | 8+ |
| **DB** | Single | Single + read replica | Primary + 2 replicas | Primary + 4 replicas + sharding |
| **Redis** | Single | Single | Primary + replica | Redis cluster |
| **Storage** | MinIO single | MinIO single | MinIO cluster | S3 + CDN |
| **Workers** | In-process | 1 worker process | 2 worker processes | 4+ worker processes |
| **Realtime** | In-process | In-process | Separate process | Separate process + Redis adapter |
| **CDN** | Cloudflare | Cloudflare | Cloudflare + cache rules | Cloudflare + edge compute |
| **Monitoring** | Basic | Basic + alerts | Prometheus + Grafana | Full observability stack |
| **Deployment** | Docker Compose | Docker Compose | Kubernetes | Kubernetes + autoscaling |

---

## 2. Capacity Planning

### 2.1 T1: Startup (100 customers, 500 screens)

**Infrastructure:**
```
┌─────────────────────────────────────┐
│         Single VPS (8 vCPU)          │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  NestJS   │  │  Next.js  │        │
│  │  API (1)  │  │  x2 apps  │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  PostgreSQL│  │  Redis   │        │
│  │  (shared) │  │  (shared)│        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  MinIO    │  │  Workers │        │
│  │  (shared) │  │  (in-proc)│       │
│  └──────────┘  └──────────┘        │
└─────────────────────────────────────┘
```

**Resource allocation:**
- CPU: 8 vCPU (4 API, 2 frontend, 1 DB, 1 other)
- RAM: 16 GB (4 API, 4 DB, 2 Redis, 2 MinIO, 4 other)
- Disk: 100 GB SSD (50 GB storage, 10 GB DB, 40 GB OS/logs)
- Network: 1 Gbps

**Performance targets:**
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- Page load: < 3s (LCP)
- Uptime: 99.5%

**Bottlenecks to watch:**
- DB connections (max 20 pool)
- Worker memory (email, webhook processing)
- Storage I/O during media upload

### 2.2 T2: Growth (1,000 customers, 5,000 screens)

**Infrastructure:**
```
┌──────────────────────────────────────────┐
│         2 VPS (8 vCPU each)               │
│                                          │
│  VPS 1 (API + Workers)    VPS 2 (DB)     │
│  ┌──────────┐            ┌──────────┐   │
│  │  NestJS   │            │PostgreSQL │   │
│  │  API (2)  │            │ + replica │   │
│  └──────────┘            └──────────┘   │
│  ┌──────────┐            ┌──────────┐   │
│  │  Workers  │            │  Redis    │   │
│  │  (1 proc) │            │          │   │
│  └──────────┘            └──────────┘   │
│  ┌──────────┐            ┌──────────┐   │
│  │  Next.js  │            │  MinIO    │   │
│  │  x2 apps  │            │          │   │
│  └──────────┘            └──────────┘   │
└──────────────────────────────────────────┘
```

**Key changes from T1:**
- DB read replica for analytics queries
- Workers extracted to separate process
- 2 API processes behind load balancer
- Redis persistence enabled (AOF)
- CDN cache rules for media assets

**Performance targets:**
- API response time: < 150ms (p95)
- WebSocket latency: < 80ms
- Page load: < 2.5s (LCP)
- Uptime: 99.9%

**Bottlenecks to watch:**
- DB write contention on `ProofOfPlay` table
- WebSocket connection limit (single process ~10K)
- Storage throughput during bulk upload

### 2.3 T3: Scale (10,000 customers, 50,000 screens)

**Infrastructure:**
```
┌───────────────────────────────────────────────┐
│         Kubernetes Cluster (10 nodes)           │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  API (4)  │  │ Workers  │  │ Realtime │    │
│  │  pods     │  │ (2 pods) │  │ (1 pod)  │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Next.js  │  │  Redis   │  │  MinIO   │    │
│  │  x2 apps  │  │  cluster │  │  cluster │    │
│  └──────────┘  └──────────┘  └──────────┘    │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │  PostgreSQL                          │     │
│  │  Primary + 2 read replicas           │     │
│  │  PgBouncer connection pooling        │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────┐  ┌──────────┐                  │
│  │ Prometheus│  │  Grafana │                  │
│  │ + Alerts  │  │          │                  │
│  └──────────┘  └──────────┘                  │
└───────────────────────────────────────────────┘
```

**Key changes from T2:**
- Kubernetes orchestration
- Realtime extracted to separate process with Redis adapter
- DB read replicas (2) for analytics and reporting
- PgBouncer for connection pooling
- Redis cluster (3 nodes) for HA
- MinIO cluster (4 nodes) for storage HA
- Prometheus + Grafana for monitoring
- Alert manager for proactive notifications
- `ProofOfPlay` table partitioned by month
- `AuditLog` table partitioned by month

**Performance targets:**
- API response time: < 100ms (p95)
- WebSocket latency: < 50ms
- Page load: < 2s (LCP)
- Uptime: 99.95%

**Bottlenecks to watch:**
- DB write throughput (consider partitioning more tables)
- WebSocket fan-out (Redis pub/sub overhead)
- CDN cache hit ratio
- Queue depth during peak hours

### 2.4 T4: Enterprise (100,000 customers, 500,000 screens)

**Infrastructure:**
```
┌───────────────────────────────────────────────────────┐
│         Kubernetes Cluster (50+ nodes, autoscaling)     │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  API (8+) │  │ Workers  │  │ Realtime │           │
│  │  autoscale│  │ (4+ pods)│  │ (4 pods) │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Next.js  │  │  Redis   │  │   S3     │           │
│  │  x2 apps  │  │  cluster │  │ + CDN    │           │
│  │  + edge   │  │  (6 node)│  │          │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                        │
│  ┌──────────────────────────────────────┐             │
│  │  PostgreSQL                          │             │
│  │  Primary + 4 read replicas           │             │
│  │  PgBouncer + partitioning            │             │
│  │  Citus extension for sharding        │             │
│  └──────────────────────────────────────┘             │
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ Prometheus│  │  Grafana │  │  Jaeger  │           │
│  │ + Alerts  │  │          │  │ (tracing)│           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                        │
│  ┌──────────┐  ┌──────────┐                         │
│  │ API GW   │  │  Loki    │                         │
│  │ (Kong)   │  │ (logs)   │                         │
│  └──────────┘  └──────────┘                         │
└───────────────────────────────────────────────────────┘
```

**Key changes from T3:**
- API autoscaling (HPA based on CPU + request queue depth)
- DB sharding via Citus (by `workspaceId`)
- S3 replaces MinIO (managed, infinite scale)
- CDN edge compute (Cloudflare Workers for caching logic)
- API Gateway (Kong) for rate limiting, key validation, routing
- Jaeger for distributed tracing
- Loki for centralized logging
- Redis cluster (6 nodes) for HA + throughput
- Realtime: 4 pods with Redis adapter + sticky sessions
- `ProofOfPlay` → time-series database (TimescaleDB or InfluxDB)
- Analytics aggregation as separate service

**Performance targets:**
- API response time: < 80ms (p95)
- WebSocket latency: < 30ms
- Page load: < 1.5s (LCP)
- Uptime: 99.99%

---

## 3. Database Scaling

### 3.1 Connection Pooling

| Tier | Max Connections | Pool Size | Strategy |
|---|---|---|---|
| T1 | 20 | 10 | Single pool |
| T2 | 50 | 20 | PgBouncer (transaction mode) |
| T3 | 100 | 40 | PgBouncer (2 instances) |
| T4 | 200+ | 80 | PgBouncer (4 instances) + Citus |

### 3.2 Read Replicas

| Tier | Replicas | Read Traffic | Write Traffic |
|---|---|---|---|
| T1 | 0 | Primary | Primary |
| T2 | 1 | Analytics → replica, API → primary | Primary |
| T3 | 2 | Analytics → replica 1, Reports → replica 2, API → primary | Primary |
| T4 | 4 | Analytics → replica 1-2, Reports → replica 3, API → primary + replica 4 | Primary |

### 3.3 Partitioning

| Table | Strategy | Start Tier |
|---|---|---|
| `ProofOfPlay` | Range by month (`playedAt`) | T2 |
| `AuditLog` | Range by month (`createdAt`) | T3 |
| `EmailLog` | Range by month (`createdAt`) | T3 |
| `UsageRecord` | Range by month (`periodStart`) | T3 |
| `Notification` | Range by month (`createdAt`) | T4 |

### 3.4 Sharding (T4)

| Table | Shard Key | Strategy |
|---|---|---|
| `Screen` | `workspaceId` | Hash partition across 4 shards |
| `MediaAsset` | `workspaceId` | Hash partition across 4 shards |
| `Playlist` | `workspaceId` | Hash partition across 4 shards |
| `Schedule` | `workspaceId` | Hash partition across 4 shards |
| `ProofOfPlay` | `workspaceId` + time | Hybrid (hash + range) |

**Unsharded tables (reference data):** `User`, `Workspace`, `Subscription`, `Plan`, `PlatformSettings`, `Invoice`, `SupportTicket`

---

## 4. Realtime Scaling

### 4.1 WebSocket Connection Limits

| Tier | Max Connections | Strategy |
|---|---|---|
| T1 | 500 | Single process |
| T2 | 5,000 | Single process (Socket.IO optimized) |
| T3 | 50,000 | Separate process + Redis adapter |
| T4 | 500,000 | 4 processes + Redis adapter + sticky sessions |

### 4.2 Redis Adapter

At T3+, Socket.IO uses Redis pub/sub for multi-instance broadcasting:

```
Screen connects to Realtime Pod 1
  │
  ├── Pod 1 subscribes to Redis channel: workspace:{workspaceId}
  │
  ├── API publishes event to Redis channel: workspace:{workspaceId}
  │
  ├── Redis broadcasts to all pods subscribed to that channel
  │
  └── Pod 1 emits event to connected screen
```

### 4.3 Sticky Sessions

At T4, load balancer uses sticky sessions (by `screenId` cookie) to ensure a screen always connects to the same realtime pod. This reduces Redis pub/sub overhead for screen-specific events.

---

## 5. Storage Scaling

### 5.1 Storage Tiers

| Tier | Technology | Capacity | Replication | CDN |
|---|---|---|---|---|
| T1 | MinIO (single) | 50 GB | None | Cloudflare (cache) |
| T2 | MinIO (single) | 500 GB | None | Cloudflare (cache + rules) |
| T3 | MinIO cluster (4 nodes) | 5 TB | Erasure coding | Cloudflare (cache + rules + edge) |
| T4 | S3 (managed) | 50 TB+ | S3 cross-region | Cloudflare (full edge caching) |

### 5.2 CDN Strategy

| Asset Type | Cache TTL | Edge Cache | Purge Strategy |
|---|---|---|---|
| Media (images, videos) | 30 days | Yes | On delete (via API) |
| Canvas thumbnails | 7 days | Yes | On update (via API) |
| Branding assets | 1 year | Yes | On update (versioned URL) |
| Player compiled canvas | 5 minutes | Yes | On update (versioned URL) |
| API responses | No cache | No | N/A |

### 5.3 Upload Strategy

| Tier | Max File Size | Upload Method | Processing |
|---|---|---|---|
| T1 | 50 MB | Direct to API | Synchronous thumbnail |
| T2 | 100 MB | Direct to API | Async thumbnail (worker) |
| T3 | 150 MB | Presigned URL → MinIO | Async thumbnail + transcoding |
| T4 | 500 MB | Presigned URL → S3 (multipart) | Async thumbnail + transcoding + virus scan |

---

## 6. Worker Scaling

### 6.1 Worker Tiers

| Tier | Worker Processes | Queues | Concurrency |
|---|---|---|---|
| T1 | In-process | 1 (default) | 5 |
| T2 | 1 process | 3 (email, webhook, analytics) | 10 per queue |
| T3 | 2 pods | 5 (email, webhook, analytics, media, reports) | 20 per queue |
| T4 | 4+ pods (autoscaled) | 8+ (all + notifications, usage, cleanup, migrations) | 50 per queue |

### 6.2 Queue Priority

| Queue | Priority | Max Retries | Backoff |
|---|---|---|---|
| email | High | 5 | Exponential (1s, 5s, 30s, 2m, 10m) |
| webhook | High | 5 | Exponential (1s, 5s, 30s, 2m, 10m) |
| analytics | Medium | 3 | Linear (30s) |
| media | Medium | 3 | Linear (10s) |
| reports | Low | 2 | Linear (60s) |
| notifications | High | 3 | Exponential (1s, 5s, 30s) |
| cleanup | Low | 1 | None |
| usage | Medium | 3 | Linear (60s) |

---

## 7. Caching Strategy

### 7.1 Cache Layers

| Layer | Technology | TTL | Purpose |
|---|---|---|---|
| Browser | HTTP cache headers | 1 year (static), 5 min (dynamic) | Reduce repeat requests |
| CDN | Cloudflare | 30 days (media), 5 min (API) | Edge caching |
| Application | Redis | 60s (hot data), 300s (warm data) | Reduce DB queries |
| Database | PostgreSQL shared buffers | — | Query result cache |

### 7.2 Cache Keys

| Key Pattern | TTL | Invalidation |
|---|---|---|
| `workspace:{id}:settings` | 300s | On settings update |
| `workspace:{id}:usage` | 60s | On usage update |
| `workspace:{id}:plan` | 3600s | On subscription change |
| `workspace:{id}:screens:count` | 60s | On screen create/delete |
| `workspace:{id}:storage:used` | 60s | On media upload/delete |
| `platform:settings` | 300s | On settings update |
| `platform:branding` | 3600s | On branding update |
| `user:{id}:workspaces` | 300s | On workspace membership change |
| `plan:all` | 3600s | On plan create/update |

### 7.3 Cache Invalidation

- **Write-through:** On data update, update cache + DB
- **Write-around:** On data update, invalidate cache, let next read populate
- **TTL-based:** Cache entries auto-expire
- **Tag-based (future):** Group cache entries by tag, invalidate by tag

---

## 8. Performance Targets

### 8.1 API Performance

| Endpoint Type | T1 (p95) | T2 (p95) | T3 (p95) | T4 (p95) |
|---|---|---|---|---|
| List (paginated) | 200ms | 150ms | 100ms | 80ms |
| Detail (single) | 100ms | 80ms | 60ms | 40ms |
| Create | 300ms | 250ms | 200ms | 150ms |
| Update | 200ms | 150ms | 100ms | 80ms |
| Delete | 150ms | 120ms | 80ms | 60ms |
| Upload | 2s | 1s | 500ms | 200ms (presigned) |
| Analytics query | 2s | 1s | 500ms | 200ms |

### 8.2 Frontend Performance

| Metric | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| LCP | < 3s | < 2.5s | < 2s | < 1.5s |
| FID | < 200ms | < 150ms | < 100ms | < 50ms |
| CLS | < 0.1 | < 0.1 | < 0.05 | < 0.05 |
| TTI | < 4s | < 3s | < 2.5s | < 2s |
| Bundle size | < 500 KB | < 400 KB | < 300 KB | < 250 KB |

### 8.3 Realtime Performance

| Metric | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Heartbeat interval | 30s | 30s | 15s | 10s |
| Command latency | < 500ms | < 300ms | < 100ms | < 50ms |
| Notification delivery | < 2s | < 1s | < 500ms | < 200ms |

---

## 9. Scaling Triggers

### 9.1 When to Scale Up

| Trigger | Threshold | Action |
|---|---|---|
| API CPU | > 70% for 5 min | Add API pod |
| API memory | > 80% for 5 min | Add API pod |
| API response time | p95 > target for 5 min | Add API pod |
| DB CPU | > 80% for 10 min | Add read replica |
| DB connections | > 80% of pool | Increase pool or add PgBouncer |
| Redis memory | > 80% | Scale Redis or evict cold keys |
| Queue depth | > 1000 jobs for 5 min | Add worker pod |
| WebSocket connections | > 80% of max | Add realtime pod |
| Storage usage | > 80% of capacity | Add storage nodes or migrate to S3 |
| Disk I/O wait | > 20% | Upgrade to faster disk or add nodes |

### 9.2 When to Scale Down

| Trigger | Threshold | Action |
|---|---|---|
| API CPU | < 30% for 30 min | Remove API pod (min 1) |
| Queue depth | 0 for 30 min | Remove worker pod (min 1) |
| API response time | p95 < 50% of target for 30 min | Remove API pod (min 1) |

---

## 10. Cost Estimation

### 10.1 Monthly Infrastructure Cost

| Component | T1 | T2 | T3 | T4 |
|---|---|---|---|---|
| Compute (VPS/K8s) | $80 | $300 | $2,000 | $15,000 |
| Database | $0 (shared) | $100 | $500 | $3,000 |
| Redis | $0 (shared) | $50 | $200 | $1,000 |
| Storage | $0 (shared) | $50 | $300 | $2,000 |
| CDN | $0 (free tier) | $20 | $200 | $2,000 |
| Monitoring | $0 (basic) | $50 | $300 | $1,000 |
| **Total** | **$80** | **$570** | **$3,500** | **$24,000** |

### 10.2 Revenue vs Cost

| Tier | MRR | Infra Cost | Cost % | Gross Margin |
|---|---|---|---|---|
| T1 | $10K | $80 | 0.8% | 99.2% |
| T2 | $100K | $570 | 0.6% | 99.4% |
| T3 | $500K | $3,500 | 0.7% | 99.3% |
| T4 | $2.5M | $24,000 | 1.0% | 99.0% |

**Note:** Infrastructure cost is < 1% of revenue at all tiers. Primary costs are personnel, marketing, and support.

---

## 11. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Start with monolith | Yes | Single process, shared DB, simpler ops |
| Extract workers first | Yes (T2) | Background jobs compete with API for CPU |
| Extract realtime second | Yes (T3) | WebSocket connections are memory-bound |
| DB partitioning | By month (T2-T3) | Query performance for time-series data |
| DB sharding | By workspaceId (T4) | Horizontal scale for write throughput |
| S3 over MinIO | T4 | Managed, infinite scale, cross-region replication |
| CDN for all tiers | Yes | Reduces origin load, improves global latency |
| HPA autoscaling | T4 | Demand-based scaling, cost optimization |
| Redis cluster | T3+ | HA + throughput for pub/sub + cache |
| Cost target | < 1% of revenue | SaaS economics, high gross margin |
