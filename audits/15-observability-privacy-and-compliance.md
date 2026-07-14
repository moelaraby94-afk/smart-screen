# Audit 15: Observability, Privacy & Compliance

**Date:** 2026-07-13
**Reviewer:** Claude (Opus 4.8) — new file
**Scope:** Structured logging & PII scrubbing, metrics/tracing, data retention, GDPR-style
data-subject rights, tenant data isolation guarantees.

> Audit 10 covered error handling and health checks. It did **not** cover PII handling,
> data retention, or compliance posture — the parts an enterprise/EU buyer will ask about.

---

## 1. Observability (verified)

**Strengths:**
- **PII scrubbing exists** for logs: `common/observability/scrub-pii.ts` with a dedicated
  test (`scrub-pii.spec.ts`) — logs are sanitized before emission. ✅
- **Sentry on both tiers**: backend (`@sentry/nestjs`, `instrument.ts`) and dashboard
  (`@sentry/nextjs`, `sentry.client.config.ts` / `sentry.server.config.ts`,
  `src/instrumentation.ts`). (Corrects audit 05/10's "no frontend Sentry".) ✅
- **OpenTelemetry present** in the tree (`@opentelemetry/*` via Sentry) — tracing is
  partially available. ✅
- **Request-scoped logging** via `RequestContext` + `AppLogger`. ✅
- **Health/readiness**: `/health`, `/ready` (DB-gated). ✅
- **Admin stats**: server load/memory/uptime + DB latency. ✅

**Issues:**

### Medium
1. **No metrics export** (Prometheus/OpenMetrics endpoint). Admin stats are a bespoke
   pull, not scrapeable — no dashboards/alerting for p95 latency, error rate, socket count,
   queue depth. (Ties to file 12 §6.)
2. **No frontend Sentry usage confirmation.** The SDK is *configured* (config files exist)
   but no explicit `Sentry.captureException` calls were found in `apps/dashboard/src`;
   verify the error boundaries actually report (they may rely on the automatic Next.js
   integration). If they don't, client-side exceptions still go unreported.
3. **Tracing coverage unknown.** OTel is pulled in transitively via Sentry; confirm spans
   actually cover DB + outbound HTTP, or it's dead weight (and a moderate CVE surface, file
   14 §1.1).

### Low
4. **Log volume / sampling** policy undocumented (cost + noise).

---

## 2. Privacy & data handling

**What the schema stores (from audit 02):** emails, password hashes, 2FA secrets/backup
codes, IP addresses (lockouts, heartbeats), payment references, audit trails.

**Issues:**

### High
1. **No data-subject rights path (GDPR/CCPA).** No export ("give me my data") or
   erasure ("delete my account and PII") endpoint was found. `deleteWorkspace` cascades
   (audit 03 §2.2) but there is no *user-level* delete/anonymize flow, and audit logs +
   payment records intentionally survive user deletion (`onDelete: Restrict` on
   `Canvas.createdBy`, audit 02 §3). For EU customers this is a compliance gap.

### Medium
2. **No retention policy for `AuditLog`.** The table has `@@index([createdAt])` (audit 02)
   but no scheduled pruning — it grows unbounded. Define a retention window + purge job.
3. **Dual audit-log stores.** Some audit/settings data is written to `.data/*.json`
   (`admin-runtime.store.ts`, see file 13 §3) *and* there is a Prisma `AuditLog` table.
   For compliance you need one authoritative, tamper-evident, backed-up store. Reconcile.
4. **IP addresses stored without stated retention** (`PairingClaimLockout.ip`, heartbeat
   IPs). IPs are personal data under GDPR; document purpose + retention.
5. **No PII-in-Sentry guard confirmed.** Verify Sentry `beforeSend` scrubs emails/tokens
   from event payloads the same way `scrub-pii` does for logs — Sentry is a third-party
   processor.

### Low
6. **No cookie/consent or privacy-policy surface** assessed on the dashboard/marketing app.

---

## 3. Tenant isolation (verified strengths, one caveat)

- Backend has **explicit cross-tenant tests**: `cross-tenant-scoping.spec.ts`,
  `claim-pairing-session-security.spec.ts` — isolation is tested, not just asserted. ✅
- Services filter by `workspaceId`; `RolesGuard` + `assertWorkspaceAccess` enforce access
  (audit 04 §3). ✅
- **Caveat:** isolation relies on developer discipline (every query must include
  `workspaceId`), not a DB-enforced row-level-security (RLS) policy. A single missed
  `where: { workspaceId }` is a cross-tenant leak. Consider Postgres RLS as defense in
  depth for the highest-value tables.

---

## 4. Recommended actions

1. Add a **user data-export + erasure** flow (GDPR Art. 15/17) with an anonymization
   strategy that preserves audit/billing integrity.
2. Add an **`AuditLog` retention + purge** job; pick one authoritative audit store.
3. Confirm **Sentry `beforeSend` PII scrubbing** matches the log scrubber.
4. Expose a **Prometheus metrics** endpoint; add alerting on error rate + socket count.
5. Document **IP/PII retention windows**; add to a privacy policy.
6. Evaluate **Postgres RLS** for defense-in-depth tenant isolation.
