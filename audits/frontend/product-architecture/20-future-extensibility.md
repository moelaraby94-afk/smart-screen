# Future Extensibility

> **Evidence basis:** `08-feature-priorities.md` (transformation), `28-feature-inventory.md` (audit), `22-open-questions.md` (transformation), all product architecture documents
> **Purpose:** Define how the architecture accommodates future features without structural changes

---

## 1. Extensibility Principle

The architecture is designed to accommodate future features without:
- Adding sidebar items beyond 7
- Creating new top-level modules
- Changing the state management approach
- Modifying the Shell layer
- Breaking existing module boundaries

New features find a home within existing modules, using existing patterns (tabs, sub-sections, progressive disclosure, feature flags).

---

## 2. Planned Future Features

### 2.1 Content Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Playlist templates marketplace | New tab in Content section or template gallery | Low — template entity + gallery view | F-FU-15 |
| Multi-zone layouts | Studio extension (zones within canvas) | Medium — Studio canvas zones, layout presets | F-FU-05 |
| Content approval workflow | Team module integration (approver role) + Content status | Medium — playlist status state machine, approval dialog | F-FU-06 |
| Playlist versioning | Playlist detail page (version history tab) | Medium — version entity, diff view | F-FU-07 |
| A/B testing | Analytics module integration + Content variant | Medium — variant entity, analytics comparison | F-FU-08 |
| Social media integration | Studio widget (social feed component) | Low — new widget type in Studio | F-FU-14 |
| Weather widget | Studio widget | Low — new widget type | — |
| News/RSS widget | Studio widget | Low — new widget type | — |

### 2.2 Screens Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Remote screen reboot | Quick action on screen detail | Low — new API call, button | F-FU-01 |
| Live screenshot preview | Screen detail tab or widget | Medium — image polling or WebSocket stream | F-FU-02 |
| Map view for screens | Toggle in Screens section (list ↔ map) | Medium — map component, geolocation data | F-FU-03 |
| OTA screen updates | Settings → Screen management or Admin fleet | Medium — update entity, progress tracking | F-FU-04 |
| Screen groups (beyond branches) | Filter dimension in screen list | Low — new filter type | — |

### 2.3 Scheduling Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Calendar drag-to-reschedule | Calendar interaction extension | Medium — drag interaction, API update | F-FU-09 |
| Nested playlists | Playlist entity relationship (parent-child) | Medium — playlist hierarchy, recursive rendering | F-FU-10 |
| Content expiry automation | Schedule rule extension (auto-expire) | Low — schedule field, background job (backend) | F-FU-11 |

### 2.4 Analytics Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Proof-of-play reports | New tab in Analytics | Medium — report entity, PDF generation | F-FU-12 |
| Device crash reports | New tab in Analytics | Medium — report entity, error aggregation | F-FU-13 |
| Custom date range | Period selector extension | Low — date picker component | F-LP-02 |
| Analytics export | Export button on Analytics page | Low — CSV/PDF generation | F-LP-01 |

### 2.5 Team Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Custom roles (RBAC) | Role entity + permissions matrix | High — permission model, UI gating, backend enforcement | F-HP-08, E-003 |
| Audit log | New tab in Settings or Team | Medium — log entity, filterable table | F-HP-10, EC-02 |
| SSO/SAML | Settings → Security tab | Medium — SSO config, login flow | F-HP-11, E-001 |

### 2.6 Settings Module Extensions

| Feature | How It Fits | Architecture Impact | Evidence |
|---------|-----------|---------------------|----------|
| Plan selection UI | Settings → Billing tab | Low — plan comparison, upgrade flow | F-LP-05 |
| Invoice PDF download | Settings → Billing tab | Low — download link | F-LP-06 |
| API key management | Settings → API tab | Low — key entity, create/revoke | F-LP-07 |
| Webhook configuration | Settings → API tab | Low — webhook entity, test endpoint | F-LP-08 |

---

## 3. Extension Patterns

### 3.1 New Tab Pattern

When a module needs a new feature, add a tab within the module's page:

```
Module Page
  ├── Existing Tab 1
  ├── Existing Tab 2
  └── New Tab (feature)
```

**Examples:** Analytics → Proof-of-Play tab; Settings → Webhooks tab; Content → Templates tab

### 3.2 New Widget Pattern

When the Overview or a detail page needs a new data display, add a widget:

```
Overview Page
  ├── Existing Widget (Screen Health)
  ├── Existing Widget (Recent Activity)
  └── New Widget (feature)
```

**Examples:** Weather widget on Overview; Live screenshot widget on Screen detail

### 3.3 New Filter Pattern

When a list page needs a new dimension, add a filter:

```
List Page
  ├── Search
  ├── Existing Filter (status)
  ├── Existing Filter (branch)
  └── New Filter (feature)
```

**Examples:** Screen groups filter; Playlist template filter; Schedule playlist filter

### 3.4 New Quick Action Pattern

When a detail page needs a new action, add a quick action button:

```
Detail Page
  ├── Header
  ├── Content
  └── Quick Actions
       ├── Existing Action
       └── New Action (feature)
```

**Examples:** Remote reboot on screen detail; Duplicate on playlist detail; Export on analytics

### 3.5 New Studio Widget Pattern

When Studio needs a new content type, add a widget:

```
Studio
  ├── Canvas
  ├── Timeline
  ├── Media Panel
  └── Widget Panel
       ├── Image
       ├── Video
       └── New Widget (feature)
```

**Examples:** Social media widget; Weather widget; News/RSS widget; Clock widget

### 3.6 Feature Flag Pattern

When a feature is gated by plan or rollout, use feature flags:

```
Feature Flag Check
  ├── Flag ON → Show feature
  └── Flag OFF → Hide or disable feature
```

**Examples:** SSO (enterprise plan only); Custom roles (enterprise plan only); Multi-zone (premium plan only)

---

## 4. What Would Require Architecture Changes

| Feature | Why It Breaks Architecture | What Would Change |
|---------|---------------------------|-------------------|
| 8th sidebar item | Violates 7-item maximum (PC-04) | Would require explicit product decision to restructure |
| Cross-workspace search | Violates tenant isolation (PC-19) | Would require new data model and API |
| Real-time collaboration in Studio | Violates single-user Studio model | Would require CRDT/OT, new Socket.IO events, cursor tracking |
| Mobile Studio editor | Violates desktop-only Studio assumption | Would require touch-optimized canvas, simplified controls |
| White-label customer portal | Violates single-tenant UI model | Would require per-customer routing, custom branding engine |
| Multi-language beyond EN/AR | Violates bilingual assumption | Would require locale management, translation pipeline |

---

## 5. Extension Decision Framework

When a new feature is proposed:

```
1. Does it fit within an existing module?
   ├── Yes → Use extension pattern (tab, widget, filter, action)
   └── No → Does it require a new sidebar item?
        ├── Yes → REJECT — violates PC-04. Find a home within existing 7.
        └── No → Does it require a new module?
             ├── Yes → REJECT — modules are fixed at 8 (7 client + 1 admin)
             └── No → Re-evaluate: it must fit somewhere

2. Does it require new global state?
   ├── Yes → Architecture review required. Is it Shell-level or module-level?
   └── No → Use SWR for server state, local state for UI

3. Does it require a new dependency?
   ├── Yes → Architecture review. Is it < 50KB? Is it maintained? Is it accessible?
   └── No → Proceed

4. Does it require backend changes?
   ├── Yes → Document the backend requirement. Do not implement backend.
   └── No → Proceed with frontend implementation

5. Does it affect the 5-minute KPI?
   ├── Yes → REJECT or make it optional (not in primary journey)
   └── No → Proceed
```

---

## Cross-References

- See `17-product-rules.md` for product rules
- See `18-product-constraints.md` for constraints
- See `19-scalability-considerations.md` for scalability
- See `transformation/08-feature-priorities.md` for feature priority list
- See `transformation/22-open-questions.md` for open questions about future features
- See `transformation/28-feature-inventory.md` (audit) for competitive feature gaps
