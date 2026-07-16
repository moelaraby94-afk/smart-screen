# Scalability Considerations

> **Evidence basis:** `13-enterprise-saas-review.md` (transformation), `25-design-constraints.md` (transformation), `17-risk-analysis.md` (transformation), locked product decisions
> **Purpose:** Define how the frontend architecture scales — with data volume, user count, feature count, and time

---

## 1. Scalability Dimensions

| Dimension | Current Limit | Target | Architecture Approach |
|-----------|--------------|--------|----------------------|
| Workspaces per user | ~20 (dropdown) | 100+ | Search + virtualization in switcher |
| Screens per workspace | ~50 (card grid) | 200+ | Search, filter, pagination, virtualization |
| Media items per workspace | Unlimited (grid) | 1000+ | Pagination, lazy loading, search by name |
| Playlists per workspace | Unlimited (grid) | 500+ | Search, filter, pagination |
| Schedules per workspace | Unlimited (calendar) | 200+ | Pagination by date range, calendar virtualization |
| Team members per workspace | Unlimited (list) | 50+ | Pagination, search |
| Notifications in memory | 50 (cap) | 50 (cap) + persisted history | In-memory cap + paginated history page |
| Features per workspace | Growing | 100+ | Feature flags, progressive disclosure, module isolation |

---

## 2. Data Volume Scaling

### 2.1 Screen List Scaling

| Threshold | Architecture | Evidence |
|-----------|-------------|----------|
| < 50 screens | Current card grid (acceptable) | `09-screens-feature.md` §9.8 |
| 50-200 screens | Search + filter + sort + pagination | F-HP-03, F-HP-04 |
| 200+ screens | Virtualized list or paginated grid | SCL-02 |

**Architecture approach:**
- SWR fetches with `limit` and `offset` parameters
- Search debounced (300ms) to avoid excessive API calls
- Filter state in URL params (shareable, bookmarkable)
- Bulk operations on selected items (not all items)

### 2.2 Workspace Switcher Scaling

| Threshold | Architecture | Evidence |
|-----------|-------------|----------|
| < 20 workspaces | Current dropdown (acceptable) | `07-workspace-management.md` §7.11 |
| 20-100 workspaces | Dropdown with search | F-HP-13 |
| 100+ workspaces | Search + metadata display + virtualization | SCL-01 |

**Architecture approach:**
- Workspace list fetched via SWR (not all at once for 100+)
- Search filters by workspace name
- Metadata display: screen count, last active
- Virtualized dropdown menu (render only visible items)

### 2.3 Media Library Scaling

| Threshold | Architecture | Evidence |
|-----------|-------------|----------|
| < 100 items | Current grid (acceptable) | `11-media-library.md` §11.8 |
| 100-1000 items | Pagination + type filter + search | F-MP-16 |
| 1000+ items | Infinite scroll or paginated grid + search | — |

**Architecture approach:**
- SWR fetches with `limit`, `offset`, `type` parameters
- Thumbnails lazy-loaded (Intersection Observer)
- Search by filename
- Type filter (image, video)
- Storage usage indicator with limit warning

### 2.4 Schedule Calendar Scaling

| Threshold | Architecture | Evidence |
|-----------|-------------|----------|
| < 50 schedules | Current calendar (acceptable) | `12-schedules-feature.md` §12.8 |
| 50-200 schedules | Date-range fetching + color coding | F-HP-07 |
| 200+ schedules | Virtualized calendar + filter by screen/playlist | — |

**Architecture approach:**
- SWR fetches with `start` and `end` date parameters (month/week range)
- Calendar renders only events in visible range
- Filter by screen, playlist, status
- Color-coded by playlist for visual scanning

---

## 3. Feature Scaling

### 3.1 Feature Count Growth

As the product grows, features will be added. The architecture must accommodate this without breaking the 7-item sidebar limit.

| Strategy | How | Example |
|----------|-----|---------|
| Sub-sections | Features within a section | Content → Playlists, Media |
| Tabs | Features within a page | Settings → Profile, Billing, API |
| Progressive disclosure | Features revealed on demand | Schedule form → basic fields, advanced fields |
| Feature flags | Features gated per workspace/plan | Admin → Feature Flags |
| Role-based visibility | Features gated per role | Team → invite (Owner only), view (all) |

### 3.2 Module Extensibility

| Module | Current Features | Future Features | Architecture Capacity |
|--------|-----------------|-----------------|----------------------|
| M-01 Overview | Dashboard widgets | Customizable widgets, weather | High — widget-based architecture |
| M-02 Screens | List, detail, pairing | Map view, live screenshot, OTA, bulk ops | Medium — list page extensible |
| M-03 Content | Playlists, media, Studio | Templates, multi-zone, versioning, A/B testing | Medium — tabs + Studio extensions |
| M-04 Scheduling | Calendar, creation | Drag-reschedule, nested playlists, approval | Medium — calendar extensible |
| M-05 Analytics | Basic charts | PoP reports, device metrics, export | High — tab/filter based |
| M-06 Team | List, invite | Custom roles, audit log, SSO | Medium — list + dialog based |
| M-07 Settings | Tabs | Plan selector, webhooks, Islamic features | High — tab-based, easy to add |
| M-08 Admin | Customers, fleet, health | Audit log, impersonation trail | Medium — grouped nav |

---

## 4. Performance Scaling

### 4.1 Rendering Performance

| Concern | Architecture | Evidence |
|---------|-------------|----------|
| Large lists | Virtualization (react-window or similar) | SCL-02 |
| Heavy components (Studio) | Dynamic import (`next/dynamic`) | PC-27 |
| Image-heavy pages | Lazy loading, thumbnail generation | `11-media-library.md` §11.8 |
| Chart rendering | Debounced resize, memoized data | `18-analytics-feature.md` §18.8 |
| Route transitions | Framer Motion with `AnimatePresence` | `04-layout-and-shell.md` §4.1 |

### 4.2 Network Performance

| Concern | Architecture | Evidence |
|---------|-------------|----------|
| API call frequency | SWR deduplication + caching | TC-04 |
| Realtime updates | Socket.IO (not polling) | BCN-04 |
| Data freshness | Data epoch bump on workspace switch | `07-workspace-management.md` §7.11 |
| Bundle size | Dynamic imports, code splitting | PC-27 |
| Image delivery | CDN (backend/infrastructure) | — |

### 4.3 State Performance

| Concern | Architecture | Evidence |
|---------|-------------|----------|
| Context re-renders | Split WorkspaceProvider (DD-21) | `16-state-strategy.md` §2.2 |
| Notification memory | Cap at 50 in-memory | SCL-03 |
| SWR cache size | Keys are workspace-scoped (switched = garbage collected) | TC-04 |
| Studio canvas state | Local to Studio component (not global) | `10-playlists-and-studio.md` §10.12 |

---

## 5. Organizational Scaling

### 5.1 Multi-Workspace Users (Agencies/MSPs)

| Need | Architecture | Evidence |
|------|-------------|----------|
| Switch between many workspaces | Switcher with search | SCL-01, F-HP-13 |
| Cross-workspace overview | (Future) Admin fleet view | `15-admin-panel.md` §15.17 |
| Per-workspace branding | BrandingProvider | `04-layout-and-shell.md` §4.1 |
| Per-workspace data isolation | SWR keys include workspace ID | PC-19 |

### 5.2 Multi-Branch Operations (Enterprise Restaurants)

| Need | Architecture | Evidence |
|------|-------------|----------|
| Filter screens by branch | Branch filter in Screens | DD-03 |
| Per-branch content | Playlists can be branch-scoped | `13-branches-feature.md` §13.13 |
| Per-branch scheduling | Schedules can target branch screens | `12-schedules-feature.md` §12.8 |
| Branch management | Accessible from Screens filter bar | `04-product-hierarchy.md` §2.2 |

### 5.3 Team Growth

| Need | Architecture | Evidence |
|------|-------------|----------|
| More team members | Paginated team list | M-06 |
| Role differentiation | Three roles + future custom roles | PC-22 |
| Permission granularity | Frontend gates UI; backend enforces | PC-32 |
| Activity tracking | (Future) Audit log | EC-02 |

---

## 6. Time Scaling (Long-Term)

### 6.1 Codebase Growth

| Concern | Architecture | Evidence |
|---------|-------------|----------|
| Module isolation | Each module owns its components, hooks, and routes | `12-module-boundaries.md` |
| Component reuse | Shared UI primitives (Radix-based) | `15-component-strategy.md` |
| State management | SWR + Context (scales with modules) | `13-frontend-state-boundaries.md` |
| Test coverage | Per-module tests, shared utility tests | TD-007 |

### 6.2 Technology Evolution

| Concern | Architecture Approach |
|---------|----------------------|
| Next.js upgrades | App Router is future-proof; server components are the direction |
| React upgrades | React 19 features (Suspense, use) are compatible |
| Tailwind upgrades | v3 with logical properties; v4 migration is non-breaking |
| Radix upgrades | Primitive API is stable; component updates are additive |
| SWR upgrades | API is stable; mutations and middleware are additive |

---

## Cross-References

- See `18-product-constraints.md` for constraints (SCL-01, SCL-02, SCL-03)
- See `20-future-extensibility.md` for extensibility
- See `transformation/13-enterprise-saas-review.md` for enterprise readiness
- See `transformation/25-design-constraints.md` for scalability constraints
- See `transformation/17-risk-analysis.md` for scaling risks
