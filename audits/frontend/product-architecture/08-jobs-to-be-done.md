# Jobs To Be Done

> **Evidence basis:** `27-user-flows.md` (audit), `09-workflow-analysis.md` (transformation), `28-feature-inventory.md` (audit), locked product decisions
> **Purpose:** Define the primary Jobs To Be Done (JTBD) — the functional, emotional, and social jobs users hire the product to do

---

## 1. JTBD Framework

The JTBD framework captures why users "hire" the product. Each job is structured as:

> **When** [situation], **I want to** [motivation], **so I can** [expected outcome].

---

## 2. Primary Jobs

### JTD-01: Connect and Display (Core Job)

> **When** I install a new digital screen at my restaurant, **I want to** connect it to the platform and show content on it immediately, **so I can** start using my investment without waiting for technical help.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 1 — This is the reason the product exists |
| **Served by** | Primary Journey (05), Screens Module, Content Module |
| **Success metric** | Time to first publish < 5 minutes |
| **Current gap** | 11-20 minutes estimated (see `05-primary-user-journey.md` §6) |
| **Architecture requirement** | Pairing wizard, template picker, immediate publish |

### JTD-02: Keep Screens Running

> **When** I have screens deployed across my restaurant locations, **I want to** see their status at a glance and fix problems quickly, **so I can** ensure my promotions are always visible to customers.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 2 — Daily usage driver |
| **Served by** | Overview Module, Screens Module |
| **Success metric** | Screen uptime > 99%; time to detect offline < 1 minute (Socket.IO) |
| **Current gap** | No screen health summary count on Overview; inconsistent loading states |
| **Architecture requirement** | Overview shows online/offline counts; realtime status via Socket.IO |

### JTD-03: Update Content Quickly

> **When** I need to change my menu or promotion, **I want to** update the content on my screens in minutes, **so I can** keep my displays relevant without spending hours on design.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 3 — Weekly usage driver |
| **Served by** | Content Module (Playlists, Media, Templates) |
| **Success metric** | Time to update content < 5 minutes for template-based change |
| **Current gap** | No templates; Studio is blank canvas; no auto-save |
| **Architecture requirement** | Template picker; media upload from Studio; auto-save |

### JTD-04: Schedule Promotions

> **When** I have time-sensitive promotions (lunch special, weekend offer), **I want to** schedule content to play at specific times, **so I can** automate my marketing without manual intervention.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 4 — Monthly usage driver |
| **Served by** | Scheduling Module |
| **Success metric** | Schedule creation < 2 minutes; zero conflicts |
| **Current gap** | Form complexity (HIGH cognitive load); no conflict detection; no timezone |
| **Architecture requirement** | Progressive disclosure form; real-time conflict detection; timezone support |

### JTD-05: Delegate Management

> **When** my restaurant grows and I hire staff to manage content, **I want to** give them access to manage screens and content without giving them billing access, **so I can** delegate safely.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional + Social |
| **Priority** | 5 — Occasional usage driver |
| **Served by** | Team Module, Settings Module |
| **Success metric** | Team member invited and active < 5 minutes |
| **Current gap** | No role change, no member removal, no cancel/resend invite |
| **Architecture requirement** | Complete team CRUD; three-role model (Owner, Editor, Viewer) |

---

## 3. Secondary Jobs

### JTD-06: Monitor Performance

> **When** I want to understand how my screens are performing, **I want to** see uptime and content engagement metrics, **so I can** make informed decisions about my digital signage strategy.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 6 — Weekly/monthly |
| **Served by** | Analytics Module |
| **Architecture requirement** | Period selection, basic charts, export (future) |

### JTD-07: Manage Multiple Locations

> **When** I have screens across multiple restaurant branches, **I want to** organize them by location, **so I can** manage each branch's content independently.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 7 — Monthly (setup) |
| **Served by** | Screens Module (branch filter) |
| **Architecture requirement** | Branch as optional filter within Screens; branch management accessible but not top-level |

### JTD-08: Handle Islamic Requirements

> **When** it's prayer time or Ramadan, **I want to** my screens to automatically adjust content, **so I can** respect local customs without manual intervention.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional + Social |
| **Priority** | 8 — Setup once, ongoing automatic |
| **Served by** | Settings Module (Islamic features), Scheduling Module |
| **Architecture requirement** | Prayer time widget, Hijri calendar, Ramadan mode — all optional, configured in Settings |

**Evidence:** `19-islamic-features.md` (audit); `01-current-product-model.md` §1.1 (differentiator).

### JTD-09: Manage Subscription

> **When** I need to upgrade my plan or download an invoice, **I want to** do it without contacting support, **so I can** manage my account self-sufficiently.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 9 — Monthly/occasional |
| **Served by** | Settings Module (Billing) |
| **Architecture requirement** | Plan selector, invoice download, payment method management |

### JTD-10: Integrate via API

> **When** I want to automate content management or build custom integrations, **I want to** access API documentation and manage API keys, **so I can** extend the platform programmatically.

| Attribute | Value |
|-----------|-------|
| **Job type** | Functional |
| **Priority** | 10 — Rare (developer users only) |
| **Served by** | Settings Module (API) |
| **Architecture requirement** | API documentation page, API key management, webhook configuration |

---

## 4. Emotional and Social Jobs

### JTD-11: Feel in Control

> **When** I manage digital screens, **I want to** feel confident that everything is working, **so I can** focus on running my restaurant instead of worrying about technology.

| Attribute | Value |
|-----------|-------|
| **Job type** | Emotional |
| **Architecture requirement** | Clear status indicators, proactive alerts, no silent failures |

### JTD-12: Feel Professional

> **When** customers see my screens, **I want to** display polished, professional content, **so I can** enhance my brand image.

| Attribute | Value |
|-----------|-------|
| **Job type** | Emotional + Social |
| **Architecture requirement** | Templates that look professional; Studio for custom branding; smooth transitions |

### JTD-13: Feel Efficient

> **When** I use the platform, **I want to** do things quickly without unnecessary steps, **so I can** get back to running my business.

| Attribute | Value |
|-----------|-------|
| **Job type** | Emotional |
| **Architecture requirement** | Shortest path to every goal; one primary action per screen; no required optional steps |

---

## 5. Job Priority Matrix

| Job | Frequency | Business Impact | Architecture Investment | Phase |
|-----|-----------|-----------------|------------------------|-------|
| JTD-01 Connect & Display | Once + expansion | Critical | High (wizard, templates, publish) | Phase 1-4 |
| JTD-02 Keep Screens Running | Daily | High | Medium (Overview optimization) | Phase 4 |
| JTD-03 Update Content | Weekly | High | High (templates, auto-save) | Phase 5-7 |
| JTD-04 Schedule Promotions | Monthly | Medium | Medium (scheduling UX) | Phase 8 |
| JTD-05 Delegate Management | Occasional | Medium | Low (team CRUD) | Phase 9 |
| JTD-06 Monitor Performance | Weekly | Low | Low (analytics enhancement) | Phase 6 |
| JTD-07 Manage Locations | Monthly (setup) | Medium | Low (branch filter) | Phase 3 |
| JTD-08 Islamic Requirements | Once + automatic | Medium (regional) | Low (already partially exists) | Phase 9 |
| JTD-09 Manage Subscription | Occasional | Low | Low (billing tab) | Phase 9 |
| JTD-10 API Integration | Rare | Low | Low (already exists) | — |
| JTD-11 Feel in Control | Continuous | High | Medium (status, alerts) | Phase 1-4 |
| JTD-12 Feel Professional | Continuous | Medium | High (templates, Studio) | Phase 5-7 |
| JTD-13 Feel Efficient | Continuous | High | High (navigation, UX) | Phase 1-3 |

---

## 6. Job-to-Module Mapping

| Job | Primary Module | Secondary Module | Tertiary Module |
|-----|---------------|-----------------|-----------------|
| JTD-01 | Screens | Content | Scheduling (optional) |
| JTD-02 | Overview | Screens | — |
| JTD-03 | Content | — | — |
| JTD-04 | Scheduling | Content | — |
| JTD-05 | Team | Settings | — |
| JTD-06 | Analytics | — | — |
| JTD-07 | Screens | Settings | — |
| JTD-08 | Settings | Scheduling | — |
| JTD-09 | Settings | — | — |
| JTD-10 | Settings | — | — |
| JTD-11 | Overview | Screens | — |
| JTD-12 | Content | — | — |
| JTD-13 | (All modules) | — | — |

---

## Cross-References

- See `05-primary-user-journey.md` for the journey that serves JTD-01
- See `06-secondary-journeys.md` for journeys that serve other jobs
- See `07-core-user-goals.md` for goal hierarchy
- See `09-product-modules.md` for module definitions
- See `10-module-responsibilities.md` for module responsibilities
- See `transformation/09-workflow-analysis.md` for workflow analysis
- See `transformation/28-feature-inventory.md` (audit) for feature maturity
