# 00 — Architecture Review Summary

> **Review Type:** Final Pre-Implementation Engineering Validation
> **Reviewer Role:** Principal Software Architect
> **Date:** July 2026
> **Scope:** Complete validation of the Cloud-Screen SaaS Blueprint against the actual repository

---

## Executive Summary

The blueprint proposes a sound target architecture: two independent frontend applications (Control Panel + Customer Workspace), a single NestJS backend with route-level namespacing, JWT audience claims, and a comprehensive RBAC model. The business logic, scalability roadmap, and security posture are well-reasoned.

However, **the blueprint underestimates the gap between its proposed architecture and the current repository state**. Several critical assumptions about the codebase are incorrect or incomplete. The migration plan, while well-structured, does not account for specific circular dependencies, shared service coupling, and the absence of foundational infrastructure (no audience claim, single cookie, no route namespacing, no shared packages).

**Verdict: APPROVED WITH CHANGES**

The architecture is fundamentally sound and can be implemented, but 23 specific changes must be addressed before or during implementation. The changes are categorized as:

- **5 Blocking** — Must resolve before implementation begins
- **10 Required** — Must resolve during early phases
- **8 Recommended** — Should resolve for long-term health

---

## Engineering Scores

| Area | Score | Notes |
|---|---|---|
| Architecture | 7/10 | Sound design, but underestimates current-state gap |
| Backend | 6/10 | Circular deps, no namespacing, no audience claim |
| Frontend | 7/10 | Good target, but admin/customer coupling is deep |
| Database | 6/10 | Missing 15+ tables, User model conflates identities |
| RBAC | 7/10 | Comprehensive model, but no enforcement infrastructure exists |
| Security | 7/10 | Good principles, but CSRF and cookie strategy need rework |
| Scalability | 8/10 | Well-thought-out tiered approach |
| Maintainability | 6/10 | Circular deps and shared state create risk |
| Operations | 8/10 | Solid DevOps and observability plan |
| Deployment | 7/10 | Docker Compose works, K8s plan is reasonable |
| Developer Experience | 5/10 | No shared packages, no ESLint boundary enforcement |
| Documentation | 9/10 | Blueprint is thorough and well-organized |
| Migration | 6/10 | Phased approach is right, but steps miss key obstacles |
| Future-proofing | 8/10 | 10-year roadmap is realistic and market-aware |
| **Overall** | **6.8/10** | **APPROVED WITH CHANGES** |

---

## Critical Findings (Blocking)

### F-01: JWT Has No Audience Claim
**Current:** `JwtStrategy` validates `sub`, `email`, `isSuperAdmin`, `impersonatedBy`, `typ`. No `aud` claim exists.
**Blueprint assumes:** JWT audience claim (`platform`, `customer`, `support`, `player`) is the primary identity separation mechanism.
**Impact:** The entire guard chain (`JwtAuthGuard → AudienceGuard → RoleGuard`) cannot function without this. This is the #1 prerequisite for all other work.
**Resolution:** Add `aud` claim to token issuance and validation. See `01-architectural-decisions.md` § D-01.

### F-02: Auth ↔ Workspaces Circular Dependency
**Current:** `AuthModule` imports `forwardRef(() => WorkspacesModule)` and `WorkspacesModule` imports `forwardRef(() => AuthModule)`. `AuthService` injects `WorkspacesService` and `WorkspacesService` injects `AuthService`.
**Blueprint assumes:** Clean module boundaries with no circular dependencies.
**Impact:** This makes it impossible to extract either module into a separate service. It also creates unpredictable initialization order issues. NestJS `forwardRef` masks the problem but doesn't solve it.
**Resolution:** Extract shared interface (`IWorkspaceResolver`) or move the overlapping logic into a third module. See `04-backend-validation.md` § B-01.

### F-03: Single Cookie for Platform and Customer
**Current:** `cs_access_token` cookie is used for both admin and customer sessions. `JwtStrategy` extracts from `request.cookies?.cs_access_token`.
**Blueprint assumes:** Separate cookie names (`cs_platform_access`, `cs_customer_access`) on separate domains.
**Impact:** Cannot separate platform sessions from customer sessions. Impersonation flow breaks because both identities use the same cookie slot. CSRF token strategy also needs reworking.
**Resolution:** Implement dual-cookie strategy with domain-scoped cookies. See `08-security-validation.md` § S-01.

### F-04: No Route Namespacing Infrastructure
**Current:** All routes are flat under `/api/v1/`. Admin routes are `/api/v1/admin/*`, customer routes are `/api/v1/workspaces/*`, `/api/v1/screens/*`, etc. No `/platform/*` or `/customer/*` prefix exists.
**Blueprint assumes:** Strict route-level partitioning: `/platform/*`, `/customer/*`, `/auth/*`, `/player/*`, `/public/*`, `/internal/*`.
**Impact:** The migration plan's "API Namespacing" phase is much larger than estimated. Every controller needs route changes, and the frontend must update every API call.
**Resolution:** Add a global route prefix strategy and migrate controllers incrementally. See `07-api-validation.md` § A-01.

### F-05: User Model Conflates Platform Staff and Customers
**Current:** `User` model has `isSuperAdmin Boolean`, `platformStaffRole PlatformStaffRole?`, and customer fields (`businessName`, `phone`, `subscriptionStatus`, `subscriptionEndDate`) on the same table.
**Blueprint assumes:** Clean separation between platform staff identities and customer identities.
**Impact:** JWT audience claim cannot be determined at login time without querying the User table and checking `isSuperAdmin`/`platformStaffRole`. This also creates a security risk: a compromised customer account could potentially have `isSuperAdmin` set via a bug.
**Resolution:** Either split into two tables (`PlatformUser` + `CustomerUser`) or add a `userType` field with strict validation. See `06-database-validation.md` § D-01.

---

## Document Index

| Document | Phase | Content |
|---|---|---|
| `01-architectural-decisions.md` | Phase 1 | Every major decision validated with alternatives, tradeoffs |
| `02-repository-impact.md` | Phase 2 | Complete module-by-module impact matrix |
| `03-dependency-graph.md` | Phase 3 | Current vs target dependency graph, circular deps |
| `04-backend-validation.md` | Phase 4 | Domain boundaries, guards, RBAC, queues, realtime |
| `05-frontend-validation.md` | Phase 5 | Both apps, every page, navigation, state, packages |
| `06-database-validation.md` | Phase 6 | Every Prisma model classified, indexes, constraints |
| `07-api-validation.md` | Phase 7 | Every endpoint classified, duplicates, missing features |
| `08-security-validation.md` | Phase 8 | Full security audit, CSRF, CORS, privilege escalation |
| `09-ux-validation.md` | Phase 9 | Per-persona UX validation |
| `10-migration-validation.md` | Phase 10 | Zero-downtime simulation, feature flags, rollback |
| `11-risk-validation.md` | Phase 11 | Complete risk register with probability/impact |
| `12-engineering-score.md` | Phase 12 | Detailed scoring rationale |
| `13-final-verdict.md` | Phase 13 | Verdict + prioritized implementation backlog |
