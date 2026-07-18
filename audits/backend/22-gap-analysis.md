# 22 — Gap Analysis

> **Objective:** Consolidate all identified gaps from audits 01-21 into a single prioritized inventory with effort estimates and sprint assignments.

---

## 1. Gap Inventory by Priority

### P0 — Critical (Blocks Production Deployment)

| # | Gap | Module | Effort | Sprint | Audit Ref |
|---|-----|--------|--------|--------|-----------|
| 1 | No Redis (throttler, WS adapter, cache) | Infrastructure | Medium | 1 | 17, 21 |
| 2 | No S3/MinIO object storage | Media | Medium | 1 | 10, 21 |
| 3 | No graceful shutdown (SIGTERM) | Infrastructure | Small | 1 | 17, 21 |
| 4 | No health checks for dependencies | Infrastructure | Small | 1 | 21 |
| 5 | No DB connection pool tuning | Infrastructure | Small | 1 | 17, 21 |
| 6 | Shared PLAYER_HEARTBEAT_SECRET fallback | Security | Medium | 1 | 16, 19 |

### P1 — High (Fix Before Scale)

| # | Gap | Module | Effort | Sprint | Audit Ref |
|---|-----|--------|--------|--------|-----------|
| 7 | No API key authentication enforcement | Auth | Medium | 2 | 04, 19 |
| 8 | No OpenAPI/Swagger documentation | API | Small | 2 | 05, 21 |
| 9 | No integration test suite | Testing | Large | 2 | 18 |
| 10 | No E2E test suite | Testing | Large | 2 | 18 |
| 11 | 8 modules with zero test specs | Testing | Large | 2 | 18 |
| 12 | No password complexity validation | Auth | Small | 2 | 03, 16 |
| 13 | No structured logging / request ID | Observability | Small | 2 | 17, 21 |
| 14 | No metrics endpoint (Prometheus) | Observability | Small | 2 | 17, 21 |
| 15 | AuthService 1,106 lines — decompose | Code Quality | Medium | 2 | 20 |
| 16 | No serialization layer (Prisma model leakage) | API | Medium | 2 | 05, 20 |
| 17 | No email notification flows | Notifications | Large | 3 | 12 |
| 18 | No timezone support for scheduling | Scheduling | Medium | 3 | 13 |
| 19 | No dunning management | Billing | Medium | 3 | 14 |
| 20 | No seat limit enforcement | Billing | Small | 3 | 14 |

### P2 — Medium (Fix During Phase 2)

| # | Gap | Module | Effort | Sprint | Audit Ref |
|---|-----|--------|--------|--------|-----------|
| 21 | No AI services | Product | Large | 3 | 11 |
| 22 | No proof-of-play tracking | Business Logic | Medium | 3 | 07 |
| 23 | DevLoginController in codebase | Security | Small | 2 | 03, 16, 19 |
| 24 | Deprecated WorkspacePairingCode model | Database | Small | 2 | 02, 19 |
| 25 | PaymentRecord model unused | Database | Small | 3 | 02, 14 |
| 26 | No Docker multi-stage build | Infrastructure | Small | 2 | 21 |
| 27 | No env var validation (Joi) | Infrastructure | Small | 2 | 21 |
| 28 | Recurrence as String not enum | Database | Small | 2 | 02, 13 |
| 29 | 2FA secrets in plaintext | Security | Small | 2 | 03, 16 |
| 30 | MIME type from extension not content | Security | Small | 2 | 07, 16 |
| 31 | No HTTP response compression | Performance | Small | 2 | 17 |
| 32 | No static asset caching headers | Performance | Small | 2 | 17 |
| 33 | No WebSocket event validation | Realtime | Small | 3 | 08 |
| 34 | No WebSocket rate limiting | Realtime | Small | 3 | 08 |
| 35 | No offline event queue for screens | Realtime | Medium | 3 | 08 |
| 36 | No push notifications | Notifications | Medium | 4 | 12 |
| 37 | No real-time notification delivery | Notifications | Small | 3 | 12 |
| 38 | No notification pagination | Notifications | Small | 2 | 12 |
| 39 | No campaign-to-screen push on publish | Business Logic | Small | 3 | 07 |
| 40 | No workspace pause enforcement | Business Logic | Small | 3 | 07 |
| 41 | No media expiry purge cron | Maintenance | Small | 3 | 07 |
| 42 | No file hash / integrity check | Media | Small | 3 | 10 |
| 43 | No EXIF stripping | Media | Small | 3 | 10 |
| 44 | No virus scanning | Media | Medium | 4 | 10 |
| 45 | No signed URL for media access | Security | Medium | 3 | 10, 16 |
| 46 | No admin module tests | Testing | Medium | 2 | 15, 18 |
| 47 | No admin session timeout | Security | Small | 3 | 15 |
| 48 | No IP allowlist for admin | Security | Small | 3 | 15 |
| 49 | No zero-downtime deployment strategy | Infrastructure | Medium | 3 | 21 |
| 50 | No backup automation | Infrastructure | Small | 3 | 21 |
| 51 | Circular dependency Auth ↔ Workspaces | Architecture | Medium | 4 | 01, 19 |
| 52 | No shared constants file | Code Quality | Small | 2 | 20 |
| 53 | No event name constants | Code Quality | Small | 2 | 20 |
| 54 | No response DTOs | Code Quality | Medium | 2 | 20 |
| 55 | No dependency vulnerability scanning | Security | Small | 2 | 16 |
| 56 | No security event logging | Security | Small | 3 | 16 |
| 57 | No JWT rotation on role change | Security | Small | 3 | 04, 16 |
| 58 | No refresh token reuse detection | Security | Medium | 3 | 03 |
| 59 | No schedule preview endpoint | Scheduling | Medium | 4 | 13 |
| 60 | No holiday schedules | Scheduling | Medium | 4 | 13 |

### P3 — Low (Nice to Have)

| # | Gap | Module | Effort | Sprint | Audit Ref |
|---|-----|--------|--------|--------|-----------|
| 61 | No empty shared packages | Architecture | Medium | 4 | 01 |
| 62 | No module boundary enforcement | Architecture | Small | 4 | 01 |
| 63 | No test data factories | Testing | Medium | 2 | 18 |
| 64 | No coverage threshold | Testing | Small | 2 | 18 |
| 65 | No CI test pipeline | Testing | Small | 2 | 18 |
| 66 | No load testing | Testing | Medium | 4 | 18 |
| 67 | No Docker multi-stage optimization | Infrastructure | Small | 2 | 21 |
| 68 | No CDN for media | Infrastructure | Medium | 3 | 10, 21 |
| 69 | No WAF | Infrastructure | Medium | 4 | 21 |
| 70 | No TLS cert automation | Infrastructure | Small | 3 | 21 |
| 71 | No secret rotation strategy | Infrastructure | Medium | 4 | 21 |
| 72 | No API versioning strategy | API | Medium | 4 | 05 |
| 73 | No bulk operations | API | Medium | 4 | 05 |
| 74 | No idempotency keys | API | Medium | 4 | 05 |
| 75 | No rate limit headers | API | Small | 3 | 05 |
| 76 | No content manifest for players | Player | Medium | 4 | 09 |
| 77 | No command acknowledgment | Player | Small | 4 | 09 |
| 78 | No crash reporting from players | Player | Medium | 4 | 09 |
| 79 | No player version tracking | Player | Small | 3 | 09 |
| 80 | No OTA update mechanism | Player | Large | 4 | 09 |

---

## 2. Gap Summary by Category

| Category | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| Infrastructure | 4 | 2 | 2 | 4 | 12 |
| Security | 1 | 2 | 5 | 0 | 8 |
| Testing | 0 | 3 | 1 | 3 | 7 |
| Observability | 0 | 2 | 0 | 0 | 2 |
| API Design | 0 | 2 | 0 | 3 | 5 |
| Database | 0 | 0 | 2 | 0 | 2 |
| Auth | 0 | 2 | 1 | 0 | 3 |
| Business Logic | 0 | 0 | 3 | 0 | 3 |
| Notifications | 0 | 1 | 3 | 0 | 4 |
| Scheduling | 0 | 1 | 2 | 0 | 3 |
| Billing | 0 | 2 | 1 | 0 | 3 |
| Media | 0 | 0 | 4 | 1 | 5 |
| Realtime | 0 | 0 | 3 | 0 | 3 |
| Player | 0 | 0 | 1 | 4 | 5 |
| Code Quality | 0 | 2 | 3 | 0 | 5 |
| Architecture | 0 | 0 | 1 | 2 | 3 |
| Admin | 0 | 0 | 2 | 0 | 2 |
| Product (AI) | 0 | 0 | 1 | 0 | 1 |
| Performance | 0 | 0 | 2 | 0 | 2 |
| **Total** | **6** | **20** | **35** | **20** | **81** |

---

## 3. Effort Summary

| Effort | Count | Est. Person-Weeks |
|--------|-------|-------------------|
| Small | 38 | 19 |
| Medium | 31 | 62 |
| Large | 12 | 36 |
| **Total** | **81** | **117 person-weeks** |

**With a 2-person team: ~58 weeks (14.5 months)**
**With a 4-person team: ~29 weeks (7.25 months)**

---

## 4. Sprint Distribution

| Sprint | Weeks | Gaps Addressed | Focus |
|--------|-------|----------------|-------|
| Sprint 1 | 1-2 | #1-6 (P0) | Production infrastructure (Redis, S3, shutdown, health) |
| Sprint 2 | 3-4 | #7-16, 23-32, 46, 52-55, 63-67 (P1 + some P2) | API, testing, code quality, security |
| Sprint 3 | 5-6 | #17-22, 33-45, 47-51, 56-60, 68, 70, 75, 79 (P2) | Notifications, scheduling, billing, media, player |
| Sprint 4 | 7-8 | #61-62, 68-74, 76-80 (P3) | Polish, scaling, advanced features |

---

## 5. Gap Priority Matrix

```
         High Impact
              |
     P0       |       P1
  (Must Fix)  |   (Fix Soon)
              |
──────────────┼──────────────
              |
     P2       |       P3
  (Fix Later) |  (Nice to Have)
              |
         Low Impact
              
    Low Effort ←────────→ High Effort
```

**Quick wins (High impact, Low effort):**
- Graceful shutdown (#3)
- Health check dependencies (#4)
- DB connection pool tuning (#5)
- Password complexity (#12)
- Structured logging (#13)
- Metrics endpoint (#14)
- DevLoginController removal (#23)
- WorkspacePairingCode removal (#24)
- Recurrence as enum (#28)
- HTTP compression (#31)
- Static asset caching headers (#32)
- Notification pagination (#38)
- Notification real-time delivery (#37)
- Campaign-to-screen push (#39)
- Workspace pause enforcement (#40)
- Media expiry purge (#41)
- Docker multi-stage (#26)
- Env var validation (#27)
- Coverage threshold (#64)
- CI test pipeline (#65)

---

## 6. Completion Percentage: **N/A** (This is a gap analysis, not an implementation)

---

## 7. Recommendations

1. **Start with Sprint 1** — All P0 items must be resolved before any production deployment
2. **Parallelize where possible** — Redis, S3, and graceful shutdown are independent and can be developed in parallel
3. **Don't skip tests** — Every gap fix should include test coverage for the new functionality
4. **Track progress** — Use this gap analysis as a checklist, update status as items are completed
5. **Re-evaluate quarterly** — New gaps will emerge as the product evolves; re-audit every quarter

---

## 8. Future Tasks

All 81 gaps are tracked above. See `23-phase2-roadmap.md` for the detailed sprint plan.
