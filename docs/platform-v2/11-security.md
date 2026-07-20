# 11 — Security

> **Document Type:** Security Architecture Specification
> **Status:** Architecture Design — Pre-Implementation
> **Scope:** Zero trust, tenant isolation, audit logging, abuse protection, compliance, secrets

---

## 1. Security Principles

### 1.1 Core Principles

1. **Zero Trust** — No implicit trust. Every request is authenticated, authorized, and audited, regardless of source.
2. **Least Privilege** — Every role, service, and API key has the minimum permissions required.
3. **Defense in Depth** — Multiple security layers. If one fails, others prevent breach.
4. **Fail Closed** — On error or ambiguity, deny access. Never fail open.
5. **Tenant Isolation** — Customers cannot access other customers' data, ever.
6. **Audit Everything** — Every state-changing action is logged with actor, action, target, and timestamp.
7. **Secure by Default** — Security settings default to the most restrictive option.
8. **Encryption Everywhere** — Data encrypted in transit (TLS) and at rest (database, storage).

### 1.2 Security Scorecard

| Category | Target | Current |
|---|---|---|
| Authentication | 95% | 60% |
| Authorization | 90% | 50% |
| Data Protection | 95% | 70% |
| Audit Logging | 95% | 40% |
| Network Security | 90% | 50% |
| Compliance | 80% | 20% |
| Incident Response | 85% | 10% |
| **Overall** | **90%** | **43%** |

---

## 2. Authentication Security

### 2.1 Password Security

| Policy | Platform Staff | Customer |
|---|---|---|
| Min length | 12 chars | 8 chars |
| Complexity | Upper + lower + digit + symbol | Upper + lower + digit |
| Hashing | bcrypt (cost 12) | bcrypt (cost 12) |
| Rotation | 90 days | No rotation (NIST) |
| History | Last 5 passwords | Not enforced |
| Breach check | HaveIBeenPwned API (future) | Not enforced |

### 2.2 Session Security

| Control | Platform | Customer |
|---|---|---|
| Session timeout | 4 hours | 24 hours |
| Max concurrent sessions | 2 | 5 |
| Session binding | IP + User-Agent | User-Agent |
| Session revocation | Immediate (Redis) | Immediate (Redis) |
| JWT blacklist | Yes (Redis) | Yes (Redis) |
| Refresh token rotation | On every refresh | On every refresh |
| Reuse detection | Revoke all sessions | Revoke all sessions |

### 2.3 2FA Security

| Control | Platform | Customer |
|---|---|---|
| Required | Yes | Optional |
| Algorithm | TOTP (RFC 6238) | TOTP (RFC 6238) |
| Backup codes | 10 single-use | 10 single-use |
| Rate limit | 5 attempts per 5 min | 5 attempts per 5 min |
| Lockout | After 10 failed attempts | After 10 failed attempts |

### 2.4 Brute Force Protection

| Endpoint | Rate Limit | Lockout |
|---|---|---|
| Login | 5 req/min per IP+email | 15 min after 10 failures |
| 2FA verify | 5 req/min per session | 15 min after 10 failures |
| Password reset | 3 req/min per IP | 1 hour after 5 requests |
| API key auth | 10 req/min per key | 1 hour after 20 failures |

---

## 3. Authorization Security

### 3.1 Guard Chain (Defense in Depth)

```
Layer 1: JwtAuthGuard — Is the token valid?
Layer 2: AudienceGuard — Is the token for this namespace?
Layer 3: RoleGuard — Does the user have the required role?
Layer 4: QuotaGuard — Is the workspace within plan limits?
Layer 5: FeatureGuard — Is the feature enabled for this workspace?
Layer 6: OwnershipGuard — Does the user own the resource?
```

### 3.2 Ownership Validation

Every customer API request validates resource ownership:

```
GET /customer/screens/:id
  │
  ├── Extract workspaceId from JWT or request body
  ├── Fetch screen from DB
  ├── Compare screen.workspaceId === request.workspaceId
  │   ├── Match → Proceed
  │   └── No match → 404 Not Found (not 403, to prevent enumeration)
  │
  └── Response
```

**Rule:** Never return 403 for resources the user shouldn't know about. Return 404 to prevent resource enumeration.

### 3.3 Platform Staff Access to Customer Data

| Access Method | Authorization | Audit |
|---|---|---|
| Direct API call | ❌ Not allowed | — |
| Impersonation | ✅ Exchange token flow | Full audit trail |
| Oversight API | ✅ Read-only via `/platform/*` | Audit logged |
| Support ticket | ✅ Read-only via support console | Audit logged |
| Database direct | ❌ Not allowed (app-level only) | — |

---

## 4. Tenant Isolation

### 4.1 Data Isolation

| Layer | Mechanism |
|---|---|
| Database | Every query includes `WHERE workspaceId = ?` |
| Prisma | Middleware enforces workspaceId filter on all customer models |
| API | `WorkspaceGuard` validates workspaceId in every request |
| WebSocket | Room-based isolation (`workspace:{id}`) |
| Storage | Per-workspace prefix (`/workspaces/{id}/media/`) |
| Cache | Per-workspace key prefix (`workspace:{id}:*`) |

### 4.2 Prisma Middleware (Conceptual)

```typescript
// Every customer query automatically includes workspaceId filter
prisma.$use(async (params, next) => {
  if (isCustomerModel(params.model) && params.action === 'findMany') {
    const workspaceId = getWorkspaceIdFromContext();
    if (workspaceId) {
      params.args.where = { ...params.args.where, workspaceId };
    }
  }
  return next(params);
});
```

### 4.3 Storage Isolation

```
MinIO/S3 Bucket Structure:
  /workspaces/{workspaceId}/media/{mediaId}.{ext}
  /workspaces/{workspaceId}/thumbnails/{mediaId}.webp
  /workspaces/{workspaceId}/exports/{exportId}.pdf
  /platform/branding/{assetId}.{ext}
  /platform/backups/{backupId}.tar.gz
```

- Pre-signed URLs scoped to specific object path
- No directory listing (individual object access only)
- Pre-signed URL TTL: 5 minutes

---

## 5. Data Protection

### 5.1 Encryption in Transit

| Connection | Protocol | Certificate |
|---|---|---|
| Browser ↔ Frontend | HTTPS (TLS 1.3) | Let's Encrypt / Cloudflare |
| Frontend ↔ API | HTTPS (TLS 1.3) | Let's Encrypt / Cloudflare |
| API ↔ Database | SSL (PostgreSQL) | Internal CA |
| API ↔ Redis | TLS | Internal CA |
| API ↔ Storage | TLS (MinIO/S3) | Internal CA or Let's Encrypt |
| Player ↔ API | HTTPS (TLS 1.2+) | Let's Encrypt |
| Player ↔ WebSocket | WSS (TLS 1.2+) | Let's Encrypt |

### 5.2 Encryption at Rest

| Data | Encryption | Key Management |
|---|---|---|
| Database | PostgreSQL TDE or disk encryption | LUKS / cloud KMS |
| Redis | Not encrypted (network-isolated) | — |
| Storage (MinIO) | Server-side encryption (SSE-S3) | MinIO KMS |
| Storage (S3) | Server-side encryption (SSE-KMS) | AWS KMS |
| Backups | Encrypted at rest | GPG / cloud KMS |
| Secrets | HashiCorp Vault or cloud secret manager | Vault KMS |

### 5.3 Sensitive Data Handling

| Data Type | Storage | Display | Logging |
|---|---|---|---|
| Passwords | bcrypt hash | Never | Never |
| 2FA secrets | Encrypted at rest | Never | Never |
| API keys | Hashed (SHA-256) | Once on creation | Never |
| OAuth secrets | Hashed (SHA-256) | Never | Never |
| Payment cards | Stripe (PCI scope) | Never | Never |
| Personal data (PII) | Encrypted at rest | Masked in UI | Masked in logs |
| Webhook secrets | Hashed | Never | Never |
| Integration tokens | Encrypted (AES-256) | Never | Never |

### 5.4 PII Data Map

| Field | Table | Classification | Retention |
|---|---|---|---|
| email | User | PII | Account lifetime + 90 days |
| name | User | PII | Account lifetime + 90 days |
| phoneNumber | User | PII | Account lifetime + 90 days |
| ipAddress | AuditLog, Session | PII | 1 year |
| userAgent | AuditLog, Session | Metadata | 1 year |
| billingAddress | Subscription, Invoice | PII | 7 years (tax) |
| taxId | Subscription, Invoice | PII | 7 years (tax) |
| companyName | User, Workspace | PII | Account lifetime + 90 days |

---

## 6. Audit Logging

### 6.1 Audit Log Design

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique event ID |
| scope | ENUM | PLATFORM, CUSTOMER, SUPPORT, SYSTEM |
| actorId | UUID | User who performed the action |
| actorRole | TEXT | Role at time of action |
| action | TEXT | Action performed (e.g., `SCREEN_CREATE`) |
| resourceType | TEXT | Type of resource (e.g., `SCREEN`) |
| resourceId | TEXT | ID of affected resource |
| workspaceId | UUID | Workspace context (null for platform) |
| impersonatedBy | UUID | If action was during impersonation |
| ipAddress | TEXT | Request IP |
| userAgent | TEXT | Request User-Agent |
| metadata | JSONB | Additional context |
| hash | TEXT | Hash chain (previous hash + this event) |
| createdAt | TIMESTAMP | Event timestamp |

### 6.2 Audit Log Rules

1. **Append-only** — No UPDATE or DELETE on audit log entries
2. **Hash chain** — Each entry includes hash of previous entry (tamper detection)
3. **Immutable** — Database-level trigger prevents modification
4. **Retained** — 1 year for customer events, 7 years for platform/billing events
5. **Exportable** — Platform staff can export audit logs (with audit trail of the export)
6. **Searchable** — Indexed on scope, actorId, workspaceId, action, createdAt

### 6.3 Audited Actions

| Category | Actions |
|---|---|
| **Auth** | LOGIN, LOGOUT, LOGIN_FAILED, 2FA_ENABLE, 2FA_DISABLE, PASSWORD_CHANGE, SESSION_TERMINATE |
| **Tenant** | TENANT_CREATE, TENANT_UPDATE, TENANT_SUSPEND, TENANT_REACTIVATE, TENANT_TERMINATE |
| **Subscription** | SUBSCRIPTION_CREATE, PLAN_CHANGE, SUBSCRIPTION_CANCEL, SUBSCRIPTION_REACTIVATE, TRIAL_EXTEND |
| **Billing** | INVOICE_CREATE, INVOICE_SEND, INVOICE_VOID, REFUND_PROCESS, PAYMENT_RETRY |
| **Content** | SCREEN_CREATE, SCREEN_UPDATE, SCREEN_DELETE, MEDIA_UPLOAD, MEDIA_DELETE, CANVAS_CREATE, CANVAS_UPDATE, PLAYLIST_CREATE, PLAYLIST_DELETE, SCHEDULE_CREATE, SCHEDULE_DELETE |
| **Team** | MEMBER_INVITE, MEMBER_REMOVE, ROLE_CHANGE, INVITE_CANCEL |
| **Support** | TICKET_CREATE, TICKET_ASSIGN, TICKET_ESCALATE, TICKET_RESOLVE, TICKET_CLOSE |
| **Security** | IMPERSONATION_START, IMPERSONATION_END, SESSION_FORCE_END, IP_ALLOWLIST_UPDATE, RATE_LIMIT_UPDATE |
| **Config** | SETTINGS_UPDATE, BRANDING_UPDATE, FEATURE_FLAG_TOGGLE, MAINTENANCE_ENABLE, MAINTENANCE_DISABLE |

---

## 7. Network Security

### 7.1 Network Topology

```
Internet
  │
  ├── Cloudflare (WAF, DDoS, CDN)
  │
  ▼
Load Balancer (TLS termination)
  │
  ├── API pods (port 3000, internal only)
  ├── Frontend pods (port 3000, internal only)
  ├── Realtime pods (port 3001, internal only)
  │
  ▼
Internal Network (no public access)
  │
  ├── PostgreSQL (port 5432, internal only)
  ├── Redis (port 6379, internal only)
  ├── MinIO/S3 (port 9000, internal only)
  └── Worker pods (no external ports)
```

### 7.2 Firewall Rules

| Source | Destination | Port | Action |
|---|---|---|---|
| Cloudflare | Load Balancer | 443 | Allow |
| Any | Any | * | Deny (default) |
| API pods | PostgreSQL | 5432 | Allow |
| API pods | Redis | 6379 | Allow |
| API pods | MinIO | 9000 | Allow |
| Worker pods | PostgreSQL | 5432 | Allow |
| Worker pods | Redis | 6379 | Allow |
| Worker pods | MinIO | 9000 | Allow |
| Worker pods | Internet | 443 | Allow (email, webhooks) |
| Realtime pods | Redis | 6379 | Allow |
| Frontend pods | API pods | 3000 | Allow |
| Internal API | Any | * | Allow (IP allowlist) |

### 7.3 DDoS Protection

| Layer | Protection |
|---|---|
| Cloudflare | L3/L4 DDoS, L7 DDoS, rate limiting, bot detection |
| Load Balancer | Connection limits, SYN flood protection |
| Application | Rate limiting per IP, per user, per API key |
| Database | Connection pool limits, query timeouts |

### 7.4 WAF Rules

| Rule | Action |
|---|---|
| SQL injection patterns | Block + log |
| XSS patterns | Block + log |
| Path traversal | Block + log |
| Known CVE exploits | Block + log |
| Abnormal request size (> 10MB body) | Block |
| Abnormal header count (> 50) | Block |
| Rate limit: 1000 req/min per IP | Challenge (CAPTCHA) |

---

## 8. Abuse Protection

### 8.1 Multi-Tenant Abuse Prevention

| Threat | Prevention |
|---|---|
| Resource exhaustion (storage) | Per-workspace storage quota |
| Resource exhaustion (API) | Per-API-key rate limit |
| Resource exhaustion (screens) | Per-plan screen limit |
| Data scraping | Rate limit + anomaly detection |
| Spam content | Content moderation (future: AI) |
| Phishing via canvas | Prohibited in ToS, report mechanism |
| Account sharing | Concurrent session limit |
| Free plan abuse | Trial limit (1 per email), screen limit |

### 8.2 API Abuse Prevention

| Control | Implementation |
|---|---|
| Rate limiting | Per-IP, per-user, per-API-key |
| Request size limit | 10MB body, 50 headers |
| Query complexity limit | Max 5 joins, max 100 results per page |
| Mutation rate limit | Max 100 mutations per minute per user |
| Upload limit | Per-plan max file size, per-workspace storage quota |
| Webhook rate limit | Max 100 webhooks per workspace |

### 8.3 Authentication Abuse

| Control | Implementation |
|---|---|
| Login rate limit | 5 per minute per IP+email |
| Login lockout | 15 min after 10 failures |
| Registration rate limit | 3 per minute per IP |
| Password reset limit | 3 per minute per IP |
| 2FA brute force | 5 per 5 min, lockout after 10 |
| Token refresh limit | 30 per minute per IP |

---

## 9. Secrets Management

### 9.1 Secret Inventory

| Secret | Current | Target |
|---|---|---|
| JWT signing key | `.env` | Vault / cloud KMS |
| Database password | `.env` | Vault / cloud KMS |
| Redis password | `.env` | Vault / cloud KMS |
| MinIO root credentials | `.env` | Vault / cloud KMS |
| Stripe secret key | `.env` | Vault / cloud KMS |
| Email provider API key | `.env` | Vault / cloud KMS |
| OAuth client secrets | `.env` | Vault / cloud KMS |
| Webhook signing secrets | DB (hashed) | DB (hashed) |
| Integration tokens | DB (encrypted) | DB (encrypted) |
| API keys (customer) | DB (hashed) | DB (hashed) |

### 9.2 Secret Rotation

| Secret | Rotation Frequency | Method |
|---|---|---|
| JWT signing key | 90 days | Key versioning (old + new valid during transition) |
| Database password | 180 days | Vault dynamic secrets (future) |
| Redis password | 180 days | Manual |
| Stripe key | On compromise | Stripe dashboard |
| Email API key | On compromise | Provider dashboard |
| OAuth secrets | On compromise | Regenerate + notify |

### 9.3 Secret Access

- **Application:** Reads from environment or Vault at startup
- **Workers:** Same as application
- **Humans:** No direct access to production secrets
- **CI/CD:** Uses OIDC tokens, no long-lived secrets
- **Logs:** Secrets never logged (redacted by middleware)

---

## 10. Compliance

### 10.1 GDPR (European Union)

| Requirement | Implementation |
|---|---|
| Lawful basis | Consent on registration, legitimate interest for operations |
| Data portability | `POST /customer/account/export` — exports all user data |
| Right to erasure | `DELETE /customer/account` — anonymizes user data |
| Data processing agreement | Available for enterprise customers |
| Data breach notification | 72-hour process (see Incident Response) |
| Cookie consent | Cookie banner with opt-in for non-essential cookies |
| Data retention | 90 days post-account deletion, 7 years for billing |

### 10.2 CCPA (California)

| Requirement | Implementation |
|---|---|
| Right to know | Data export endpoint |
| Right to delete | Account deletion endpoint |
| Right to opt-out | No data selling (we don't sell data) |
| Non-discrimination | No price difference for privacy choices |

### 10.3 PDPL (Saudi Arabia)

| Requirement | Implementation |
|---|---|
| Consent | Explicit consent on registration |
| Data localization | Option for on-premise deployment (KSA data center future) |
| Right to access | Data export endpoint |
| Right to correction | Profile update endpoint |
| Breach notification | 72-hour process |
| Data retention | Per PDPL guidelines |

### 10.4 SOC 2 (Future)

| Principle | Implementation |
|---|---|
| Security | Zero trust, RBAC, audit logging, encryption |
| Availability | 99.9%+ uptime, disaster recovery, backups |
| Processing integrity | Audit trail, data validation, error handling |
| Confidentiality | Encryption, tenant isolation, access controls |
| Privacy | GDPR/CCPA compliance, data retention, user rights |

### 10.5 PCI DSS

- **Scope:** We do NOT store, process, or transmit card data. Stripe handles all card data.
- **SAQ A:** Applicable (cardholder data only on Stripe's domain)
- **Requirements:** TLS for redirect to Stripe, no card data in our logs or DB

---

## 11. Incident Response

### 11.1 Incident Severity

| Severity | Description | Response Time | Escalation |
|---|---|---|---|
| **SEV-1** | Data breach, total outage, security incident | 15 min | All hands, notify customers |
| **SEV-2** | Partial outage, degraded service, major bug | 30 min | On-call + team lead |
| **SEV-3** | Minor bug, non-critical feature broken | 4 hours | On-call |
| **SEV-4** | Cosmetic, enhancement, non-urgent | 1 business day | Ticket |

### 11.2 Incident Response Process

```
Detect (monitoring alert, customer report, security scan)
  │
  ▼
Triage (assess severity, assign incident commander)
  │
  ▼
Contain (isolate affected systems, revoke compromised credentials)
  │
  ▼
Investigate (determine scope, root cause, affected data)
  │
  ▼
Remediate (fix vulnerability, restore service, patch systems)
  │
  ▼
Communicate (notify customers, regulators if required)
  │
  ▼
Post-mortem (document timeline, root cause, lessons learned, action items)
  │
  ▼
Implement action items (prevent recurrence)
```

### 11.3 Breach Notification

| Audience | Timeline | Content |
|---|---|---|
| Internal team | Immediate | Incident details, severity, actions taken |
| Affected customers | 72 hours | What happened, what data, what to do |
| Regulators (GDPR) | 72 hours | Per GDPR Article 33 |
| Public | After containment | Transparency blog post |

---

## 12. Security Checklist

### 12.1 Pre-Launch Security Checklist

- [ ] HTTPS enforced (HSTS header)
- [ ] TLS 1.3 minimum (TLS 1.2 for player)
- [ ] Security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- [ ] CORS configured per-domain (Control Panel, Customer Workspace)
- [ ] JWT audience validation on all routes
- [ ] 2FA enforced for platform staff
- [ ] Rate limiting on all auth endpoints
- [ ] Audit logging on all state-changing actions
- [ ] Tenant isolation enforced (Prisma middleware)
- [ ] Secrets in Vault or cloud KMS (not in .env for production)
- [ ] Database encryption at rest
- [ ] Storage encryption at rest
- [ ] Backups encrypted
- [ ] WAF rules active (Cloudflare)
- [ ] DDoS protection active (Cloudflare)
- [ ] Dependency vulnerability scan (npm audit, Snyk)
- [ ] SAST (Static Application Security Testing)
- [ ] DAST (Dynamic Application Security Testing) — future
- [ ] Penetration test — before enterprise launch
- [ ] Incident response plan documented
- [ ] Data retention policy implemented
- [ ] GDPR/CCPA/PDPL compliance verified

### 12.2 Ongoing Security Tasks

| Task | Frequency | Owner |
|---|---|---|
| Dependency vulnerability scan | Weekly | Operations |
| Secret rotation | Per schedule | Operations |
| Access review | Quarterly | Security |
| Penetration test | Annually | External |
| Security training | Annually | All staff |
| Audit log review | Weekly | Security |
| WAF rule update | Monthly | Operations |
| Incident response drill | Quarterly | Operations + Security |

---

## 13. Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Zero trust | Yes | No implicit trust, every request validated |
| bcrypt cost 12 | Yes | Slow enough to resist brute force, fast enough for UX |
| JWT in HTTP-only cookies | Yes | XSS protection, no JavaScript access |
| Tenant isolation via Prisma middleware | Yes | Centralized, cannot be bypassed by controller |
| Audit log hash chain | Yes | Tamper detection |
| No card data storage | Yes | PCI scope minimization (Stripe handles) |
| 2FA required for platform | Yes | Platform staff have highest privileges |
| Cloudflare WAF + DDoS | Yes | Managed protection, no infrastructure to maintain |
| Secrets in Vault (production) | Yes | Centralized, auditable, rotatable |
| Fail closed | Yes | On error, deny access (never fail open) |
