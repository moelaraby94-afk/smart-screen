# 11 — Risk Analysis

> **Document Type:** Architecture Specification
> **Status:** READ-ONLY Analysis
> **Scope:** Comprehensive risk assessment for the platform-customer separation

---

## 1. Current State

The current monolithic dashboard and shared backend create several categories of risk that the separation addresses. This document catalogs all risks — both those introduced by the separation and those mitigated by it.

---

## 2. Risk Categories

### 2.1 Security Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| SEC-01 | Compromised super admin token accesses customer routes | High | Low | ↓ Mitigated by audience validation |
| SEC-02 | No JWT audience claim — any token attempts any route | High | Low | ↓ Mitigated by audience guards |
| SEC-03 | Impersonation tokens indistinguishable from real customer tokens | Medium | Low | ↓ Mitigated by `impersonatedBy` claim + audience |
| SEC-04 | Platform settings in file system — no access control | Medium | Low | ↓ Mitigated by database storage |
| SEC-05 | CORS allows all origins equally | Medium | Low | ↓ Mitigated by per-app CORS |
| SEC-06 | No IP allowlisting for admin routes | Medium | Medium | → Not addressed by separation |
| SEC-07 | Session timeout same for staff and customers | Low | Low | → Not addressed by separation |
| SEC-08 | Exchange token interception during impersonation | N/A | Medium | ↑ New risk introduced |

**SEC-08 Mitigation:** One-time use, 30s TTL, signed with `ENCRYPTION_KEY`, stored in Redis with automatic expiry. Token is URL parameter (not header) to simplify cross-domain redirect. Use HTTPS only.

### 2.2 Availability Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| AVAIL-01 | Admin panel downtime takes down customer dashboard | High | Low | ↓ Mitigated by independent deployment |
| AVAIL-02 | Customer dashboard deploy breaks admin panel | High | Low | ↓ Mitigated by independent deployment |
| AVAIL-03 | Single backend instance failure | High | High | → Not addressed by frontend separation |
| AVAIL-04 | Platform settings file not shared across instances | High | Low | ↓ Mitigated by database storage (Phase 4) |
| AVAIL-05 | Control Panel unavailable — staff locked out | N/A | Medium | ↑ New risk introduced |
| AVAIL-06 | Customer Dashboard unavailable — customers locked out | N/A | Medium | ↑ New risk (same as current, but now isolated) |

**AVAIL-05 Mitigation:** Deploy Control Panel with health checks, auto-restart, and monitoring. Keep customer dashboard login as fallback during Phase 1–2 transition.

### 2.3 Data Integrity Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| DATA-01 | Platform settings lost during file-to-DB migration | N/A | High | ↑ New risk in Phase 4 |
| DATA-02 | Shared User model — staff accidentally modified as customer | Low | Low | → Not addressed by separation |
| DATA-03 | Audit log entries not scoped — platform events mixed with customer | Low | Low | → Optional mitigation (scope field) |
| DATA-04 | Impersonation session not tracked in database | Low | Low | → Optional mitigation (ImpersonationSession table) |

**DATA-01 Mitigation:** Backup JSON file before migration. Dry-run mode. Verify row count after migration. Rollback by restoring JSON file.

### 2.4 Operational Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| OPS-01 | Two applications to deploy and monitor | N/A | Medium | ↑ New complexity |
| OPS-02 | Shared package version drift between apps | N/A | Medium | ↑ New risk |
| OPS-03 | CI/CD pipeline complexity increases | Low | Medium | ↑ New complexity |
| OPS-04 | Docker Compose service count increases | Low | Low | → Minor change |
| OPS-05 | CORS misconfiguration blocks cross-origin API calls | N/A | Medium | ↑ New risk |

**OPS-01 Mitigation:** Document deployment runbook. Use same CI/CD pipeline with parallel jobs. Monitor both applications with Sentry.

**OPS-02 Mitigation:** Use exact version pinning for shared packages. Run both apps' test suites on package changes. Consider publishing to private npm registry in the future.

**OPS-05 Mitigation:** Use environment-driven CORS allow-lists. Test both applications against backend in staging. Document CORS configuration.

### 2.5 Development Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| DEV-01 | Admin code changes affect customer dashboard | High | Low | ↓ Mitigated by separation |
| DEV-02 | Customer code changes affect admin panel | High | Low | ↓ Mitigated by separation |
| DEV-03 | Shared component changes break both apps | Medium | Medium | → Same risk, but now explicit |
| DEV-04 | i18n message keys drift between apps | N/A | Medium | ↑ New risk |
| DEV-05 | ESLint import restrictions not enforced | N/A | Low | ↓ Mitigated by ESLint rules |
| DEV-06 | Two codebases to maintain | N/A | Medium | ↑ New complexity |

**DEV-03 Mitigation:** Version shared packages. Run both test suites on changes. Use feature flags for breaking changes.

**DEV-04 Mitigation:** Extract shared i18n keys to `packages/config`. Use a sync script. App-specific keys stay in each app.

### 2.6 User Experience Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| UX-01 | Super admin bookmarks break after Phase 3 | N/A | Medium | ↑ New risk |
| UX-02 | Impersonation redirect feels slow | N/A | Low | ↑ New risk |
| UX-03 | Staff confused by two login pages | N/A | Low | ↑ New risk |
| UX-04 | Impersonation banner not visible | N/A | Medium | ↑ New risk |

**UX-01 Mitigation:** Add redirect from `/admin/*` on dashboard to Control Panel URL. Document the change. Send notification to staff before Phase 3.

**UX-02 Mitigation:** Exchange token flow is a single HTTP redirect + one API call. Total overhead < 1 second. Test on slow connections.

**UX-03 Mitigation:** Both login pages are identical in appearance. The Control Panel login page can show a "Platform Staff Login" heading. If a staff member logs in via the customer dashboard, they see customer routes (not admin), which is a clear signal.

**UX-04 Mitigation:** Impersonation banner is a high-visibility element at the top of the page. Read `impersonatedBy` from JWT on every page load. Test thoroughly.

### 2.7 Business Risks

| ID | Risk | Current Severity | Post-Separation Severity | Trend |
|---|---|---|---|---|
| BIZ-01 | Development cost of separation | N/A | Medium | ↑ One-time cost |
| BIZ-02 | Productivity dip during transition | N/A | Low | ↑ Temporary |
| BIZ-03 | Independent release cycles enable faster delivery | N/A | High (positive) | ↓ Benefit |

**BIZ-01:** Estimated 5–7 weeks with one developer. ROI: independent deployment, reduced blast radius, improved security.

---

## 3. Risk Mitigation Summary

### High-Severity Risks Requiring Action

| ID | Risk | Phase | Mitigation |
|---|---|---|---|
| SEC-01 | Compromised super admin token | Phase 2 | JWT audience validation |
| SEC-02 | No audience claim | Phase 2 | Add audience to JWT |
| AVAIL-01 | Admin downtime affects customers | Phase 1 | Independent deployment |
| AVAIL-02 | Customer deploy breaks admin | Phase 1 | Independent deployment |
| AVAIL-04 | Settings file not shared | Phase 4 | Database storage |
| DATA-01 | Settings lost in migration | Phase 4 | Backup + dry-run + verify |

### Medium-Severity Risks Requiring Monitoring

| ID | Risk | Phase | Mitigation |
|---|---|---|---|
| SEC-08 | Exchange token interception | Phase 3 | Short TTL, one-time use, HTTPS |
| AVAIL-05 | Control Panel unavailable | Phase 1 | Health checks, monitoring |
| OPS-01 | Two apps to deploy | Phase 1 | CI/CD automation, runbook |
| OPS-02 | Package version drift | Phase 1 | Version pinning, dual test suites |
| OPS-05 | CORS misconfiguration | Phase 1 | Environment-driven config, staging tests |
| DEV-04 | i18n key drift | Phase 1 | Shared package, sync script |
| UX-01 | Bookmark breakage | Phase 3 | Redirect, notification |
| UX-04 | Impersonation banner | Phase 3 | High-visibility banner, testing |

### Low-Severity Risks (Acceptable)

| ID | Risk | Rationale |
|---|---|---|
| SEC-06 | No IP allowlisting | Can be added at nginx/CDN level independently |
| SEC-07 | Same session timeout | Can be configured per-audience in future |
| DATA-02 | User model dual purpose | Common SaaS pattern, enforced by guards |
| DATA-03 | Audit log scope | Optional improvement, not required |
| DATA-04 | Impersonation tracking | Optional improvement, not required |
| UX-02 | Impersonation redirect speed | < 1 second overhead |
| UX-03 | Two login pages | Identical UI, clear role-based routing |
| BIZ-02 | Productivity dip | Temporary, offset by long-term gains |

---

## 4. Risk Matrix

```
        Impact
        High │  AVAIL-01  │  SEC-01    │  DATA-01
             │  AVAIL-02  │  SEC-02    │
             │  AVAIL-04  │            │
             │            │            │
        Med  │  AVAIL-05  │  SEC-08    │  OPS-01
             │  UX-01     │  OPS-05    │  OPS-02
             │  UX-04     │  DEV-04    │  DEV-06
             │  BIZ-01    │            │
             │            │            │
        Low  │  UX-02     │  SEC-06    │  SEC-07
             │  UX-03     │  SEC-07    │  DATA-02
             │  BIZ-02    │  DATA-03   │  DATA-04
             │            │  DATA-04   │  DEV-05
             │            │            │
             └────────────┴────────────┴────────────
                Low          Medium        High
                      Likelihood
```

---

## 5. Risks NOT Addressed by This Separation

The following risks exist in the current system and are **not mitigated** by the platform-customer separation. They should be addressed independently:

| Risk | Description | Recommended Action |
|---|---|---|
| Single backend instance | No horizontal scaling | Add load balancer + multiple backend instances |
| No database read replicas | All reads hit primary | Add read replicas for analytics-heavy queries |
| No CDN for media assets | Direct MinIO/S3 access | Add CDN (Cloudflare, CloudFront) in front of storage |
| No automated backups | Manual backup process | Set up automated PostgreSQL backups |
| No disaster recovery plan | No documented DR | Create DR plan with RTO/RPO targets |
| No secrets management | Secrets in `.env` files | Use Vault, AWS Secrets Manager, or Doppler |
| No API rate limiting per tenant | Global rate limit only | Add per-workspace rate limiting |
| No SOC2/GDPR compliance audit | Self-assessed only | Engage compliance auditor |

---

## 6. Alternatives Risk Comparison

| Approach | Security Risk | Availability Risk | Development Risk | Migration Risk |
|---|---|---|---|---|
| **Two-frontend, single-backend (recommended)** | Low | Low | Medium | Low |
| Microservices backend | Low | Medium (distributed) | High (complexity) | High |
| Keep monolith, add guards only | Medium | High (shared) | Low | Low |
| Micro-frontend (Module Federation) | Medium | Medium | High (build complexity) | Medium |

---

## 7. Migration Notes

- **Phase 1 risks are primarily operational** (new app, shared packages, deployment). These are well-understood risks with standard mitigations.
- **Phase 2 risks are primarily security-related** (JWT audience validation). The additive approach minimizes risk.
- **Phase 3 risks are primarily UX-related** (bookmark breakage, impersonation flow). These require careful testing and user communication.
- **Phase 4 risks are primarily data-related** (settings migration). These require backup and verification.

---

## 8. Open Questions

1. **Should we add IP allowlisting for the Control Panel** as part of this effort, or independently?
2. **Should we implement session timeout per audience** (e.g., platform staff sessions expire in 4h, customer sessions in 24h)?
3. **Should we add a kill switch for the Control Panel** that redirects to the customer dashboard's admin routes (for emergency fallback)?
4. **Should we monitor impersonation sessions in real-time** and alert on long-duration sessions?
5. **Should we add a grace period for bookmark redirects** (show a "this page has moved" page before redirecting)?

---

## 9. Final Recommendation

The separation **reduces overall risk** despite introducing new risks. The highest-severity risks in the current system (admin downtime affecting customers, cross-domain token misuse, shared deployment blast radius) are all mitigated by the separation.

The new risks introduced (exchange token interception, two apps to deploy, package drift) are all medium or low severity with standard mitigations.

**Risk assessment: PROCEED with the four-phase migration.**

The recommended approach (two-frontend, single-backend) has the best risk profile of all alternatives. The phased migration ensures that each risk is addressed at the appropriate time with appropriate mitigations.

The only high-severity risk in the migration itself is DATA-01 (settings lost during file-to-DB migration), which is easily mitigated with backup and verification.
