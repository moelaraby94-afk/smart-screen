# Dependency Map

> **Evidence basis:** All transformation documents, `02-problem-map.md`, `07-screen-priorities.md`, `08-feature-priorities.md`
> **Purpose:** Dependency graph between problems, screens, features, and phases

---

## 1. Problem Dependencies

### 1.1 Problem → Problem Dependencies

```
P-001 (Switch RTL) → No dependencies → Can fix independently
P-002 (Mobile switcher) → No dependencies → Can fix independently
P-003 (Click guards) → No dependencies → Can fix independently
P-004 (Back button labels) → No dependencies → Can fix independently
P-005 (InfoTooltip ARIA) → Install @radix-ui/react-tooltip → Can fix after install

IA-001 (Sidebar grouping) → No dependencies → Can fix independently
IA-002 (Client vs Admin nav) → Depends on IA-001 → Must fix after sidebar grouping
IA-003 (Switch to /branches) → No dependencies → Can fix independently
IA-004 (Quick actions navigate) → Depends on dialog creation → Must create dialogs first
IA-005 (Settings back button) → No dependencies → Can fix independently

E-001 (SSO) → Depends on backend SSO → Must wait for backend
E-002 (Audit log) → Depends on backend audit → Must wait for backend
E-003 (Custom roles) → Depends on backend RBAC → Must wait for backend
E-004 (Bulk operations) → Depends on backend bulk API → Must wait for backend
E-005 (Timezone scheduling) → Depends on backend timezone → Must wait for backend
E-006 (Switcher search) → No dependencies → Can fix independently

TD-001 (Loading states) → No dependencies → Can fix independently
TD-002 (Icon stroke) → No dependencies → Can fix independently
TD-003 (Icon duplication) → Depends on IA-001 → Fix during nav restructuring
TD-004 (AuroraBackdrop) → No dependencies → Can fix independently
TD-005 (hasSuccessfulMeRef) → No dependencies → Can fix independently
TD-006 (Socket.IO transport) → No dependencies → Can fix independently
TD-007 (Test coverage) → No dependencies → Can start anytime
```

### 1.2 Dependency Graph (Visual)

```
Independent (fix anytime):
  P-001, P-002, P-003, P-004, P-005 (after Radix install)
  IA-001, IA-003, IA-005
  E-006
  TD-001, TD-002, TD-004, TD-005, TD-006, TD-007

Sequential:
  IA-001 → IA-002 (nav consistency)
  IA-001 → TD-003 (icon duplication, fix during nav restructure)
  IA-004 → Create dialogs → Fix quick actions

Backend-blocked:
  E-001 → Backend SSO/SAML
  E-002 → Backend audit log
  E-003 → Backend RBAC
  E-004 → Backend bulk API
  E-005 → Backend timezone
```

---

## 2. Screen Dependencies

### 2.1 Screen → Screen Dependencies

| Screen | Depends On | Reason |
|--------|-----------|--------|
| Dashboard | Sidebar, Header | Shared layout, navigation, header meta |
| Screen List | Screen Detail | Shared data, navigation between |
| Screen Detail | Screen List | Back button navigates to list |
| Playlist Library | Playlist Studio | Shared state, entry point to editor |
| Playlist Studio | Playlist Library | Save returns to library |
| Schedule Calendar | Schedule Create Dialog | Shared form, conflict detection |
| API Docs | API Keys | Shared IA grouping |
| Admin Customers | Admin Staff, Admin Users | Shared admin layout, grouping |
| Login | Register, Forgot Password | Shared auth layout |

### 2.2 Screen → Architecture Dependencies

| Screen | Blocked By | Must Fix First |
|--------|-----------|---------------|
| Dashboard | Sidebar grouping (IA-001) | Navigation restructuring |
| Branch List | IA repositioning (IA-001) | Navigation restructuring |
| API Docs/Keys | IA grouping (IA-001) | Navigation restructuring |
| Schedules | Timezone support (E-005) | Backend timezone implementation |
| Team | Custom roles (E-003) | Backend RBAC implementation |
| Admin Customer | Audit log (E-002) | Backend audit infrastructure |
| Login | SSO (E-001) | Backend SSO implementation |

---

## 3. Feature Dependencies

### 3.1 Feature → Feature Dependencies

```
F-MH-01 (Fix Switch RTL) → No dependencies
F-MH-02 (Mobile workspace switcher) → No dependencies
F-MH-03 (Fix click guards) → No dependencies
F-MH-04 (Fix back button labels) → No dependencies
F-MH-05 (Fix InfoTooltip) → Install @radix-ui/react-tooltip
F-MH-06 (Standardize loading) → No dependencies
F-MH-07 (Socket.IO fallback) → No dependencies
F-MH-08 (Fix hasSuccessfulMeRef) → No dependencies

F-HP-01 (Sidebar grouping) → No dependencies
F-HP-02 (Switch to /overview) → No dependencies
F-HP-03 (Screen search/filter) → No dependencies
F-HP-04 (Bulk screen ops) → Backend bulk API
F-HP-05 (Multi-file upload) → Backend multi-upload
F-HP-06 (Timezone scheduling) → Backend timezone
F-HP-07 (Conflict detection) → No dependencies
F-HP-08 (Custom roles) → Backend RBAC
F-HP-09 (Team management) → No dependencies (basic) / Backend RBAC (roles)
F-HP-10 (Audit log) → Backend audit infra
F-HP-11 (SSO) → Backend SSO
F-HP-12 (Test coverage) → No dependencies
F-HP-13 (Switcher search) → No dependencies
F-HP-14 (Quick actions act) → Create dialogs (add-screen, upload-media, create-playlist)
F-HP-15 (Contrast fixes) → No dependencies
F-HP-16 (Touch targets) → No dependencies
```

### 3.2 Feature → Component Dependencies

| Feature | Requires Component | Status |
|---------|-------------------|--------|
| F-MH-05 (InfoTooltip fix) | Tooltip (Radix) | Must install + create |
| F-HP-03 (Screen search) | SearchInput | Must create |
| F-HP-04 (Bulk screen ops) | BulkActionBar, Table with select | Must create |
| F-HP-05 (Multi-file upload) | ProgressBar | Must create |
| F-HP-07 (Conflict detection) | Custom calendar overlay | Must create |
| F-HP-14 (Quick actions) | AddScreenDialog, UploadMediaDialog, CreatePlaylistDialog | Must create |
| F-MP-11 (Drag-to-reschedule) | Draggable calendar events | Must create |
| F-MP-13 (Playlist versioning) | VersionHistoryPanel | Must create |

---

## 4. Phase Dependencies

### 4.1 Phase Ordering Rationale

```
Phase 0 (Preparation)
  ↓ No code changes — audit, inventory, planning
Phase 1 (Foundation)
  ↓ Fix critical defects that affect all other work
Phase 2 (Navigation)
  ↓ Fix navigation before restructuring IA
Phase 3 (Information Architecture)
  ↓ Restructure IA before redesigning screens that depend on it
Phase 4 (Dashboard)
  ↓ Dashboard depends on navigation + IA
Phase 5 (Content) ← Can run in parallel with Phase 6
  ↓ Media library, templates
Phase 6 (Screens) ← Can run in parallel with Phase 5
  ↓ Screen list, bulk ops, search
Phase 7 (Playlists)
  ↓ Studio improvements depend on content features
Phase 8 (Schedules)
  ↓ Scheduling depends on timezone backend
Phase 9 (Settings)
  ↓ SSO, roles, billing depend on backend infrastructure
Phase 10 (Polish)
  ↓ Everything must be done before polish
```

### 4.2 Why This Order?

| Phase | Why Before Next | Evidence |
|-------|----------------|----------|
| Phase 1 before Phase 2 | Can't fix navigation while critical defects exist (broken click guards, wrong labels) | P-003, P-004 |
| Phase 2 before Phase 3 | Navigation fixes (mobile switcher, back buttons) must be done before IA restructuring | P-002, IA-005 |
| Phase 3 before Phase 4 | Dashboard depends on sidebar grouping — can't redesign dashboard while nav is flat | IA-001 |
| Phase 4 before Phase 5/6 | Dashboard is the landing page — must be solid before content/screen improvements | `07-screen-priorities.md` |
| Phase 5/6 before Phase 7 | Playlists depend on media (content) and screens (publishing targets) | `01-current-product-model.md` §4.2 |
| Phase 7 before Phase 8 | Schedules assign playlists to screens — both must be improved first | `01-current-product-model.md` §4.2 |
| Phase 8 before Phase 9 | Settings (SSO, roles, billing) are independent but lower priority than core features | `08-feature-priorities.md` |
| Phase 9 before Phase 10 | Polish (accessibility, performance, testing) must be last | — |

### 4.3 Parallelizable Phases

| Phases | Can Parallelize? | Reason |
|--------|-----------------|--------|
| Phase 5 (Content) + Phase 6 (Screens) | ✅ Yes | Independent feature areas, different developers |
| Phase 9 (Settings) + Phase 5/6/7/8 | ✅ Yes | Settings is mostly backend-dependent, can proceed in parallel |
| Phase 10 (Polish) + anything | ❌ No | Polish must be last |

---

## 5. Shared Component Dependencies

### 5.1 Components That Block Multiple Features

| Component | Blocks | Priority |
|-----------|--------|----------|
| Tooltip (Radix) | F-MH-05 (InfoTooltip fix) | High — Phase 1 |
| SearchInput | F-HP-03 (screen search), F-HP-13 (switcher search) | High — Phase 2 |
| BulkActionBar | F-HP-04 (bulk screen ops), bulk media ops | High — Phase 5-6 |
| ProgressBar | F-HP-05 (upload progress), storage usage | Medium — Phase 5 |
| Pagination | All list views | Medium — Phase 4 |
| AddScreenDialog | F-HP-14 (quick actions) | Medium — Phase 4 |
| UploadMediaDialog | F-HP-14 (quick actions) | Medium — Phase 4 |
| CreatePlaylistDialog | F-HP-14 (quick actions) | Medium — Phase 4 |

### 5.2 Layout Components That Block Redesign

| Component | Blocks | Priority |
|-----------|--------|----------|
| ShellSidebar | All screens (navigation) | High — Phase 2-3 |
| ShellHeader | All screens (header) | High — Phase 2 |
| WorkspaceSwitcher | Mobile workspace switching, switcher search | High — Phase 2 |
| useShellHeaderMeta | Back button fixes, page titles | High — Phase 1-2 |

---

## 6. Backend Dependencies

### 6.1 Features Requiring Backend Changes

| Feature | Backend Requirement | Frontend Blocked? | Phase |
|---------|-------------------|-------------------|-------|
| SSO/SAML (E-001) | SAML/OIDC endpoint, IdP config | Yes | Phase 9 |
| Audit log (E-002) | Audit middleware, audit API | Yes | Phase 9 |
| Custom roles (E-003) | RBAC engine, role CRUD API | Yes | Phase 9 |
| Bulk operations (E-004) | Bulk API endpoints | Yes | Phase 5-6 |
| Timezone scheduling (E-005) | Timezone storage, conversion API | Yes | Phase 8 |
| Multi-file upload | Multi-upload endpoint | Yes | Phase 5 |
| Playlist versioning | Version storage, diff API | Yes | Phase 7 |
| Proof-of-play | Player logging, PoP API | Yes | Future |
| Analytics export | Export API (CSV/PDF) | Yes | Phase 10 |
| Invoice download | Invoice PDF API | Yes | Phase 9 |

### 6.2 Features NOT Requiring Backend Changes

| Feature | Frontend Only? | Phase |
|---------|---------------|-------|
| Fix Switch RTL | Yes | Phase 1 |
| Mobile workspace switcher | Yes | Phase 2 |
| Fix click guards | Yes | Phase 1 |
| Fix back button labels | Yes | Phase 1 |
| Fix InfoTooltip | Yes (after Radix install) | Phase 1 |
| Standardize loading | Yes | Phase 1 |
| Socket.IO fallback | Yes | Phase 1 |
| Fix hasSuccessfulMeRef | Yes | Phase 1 |
| Sidebar grouping | Yes | Phase 3 |
| Switch to /overview | Yes | Phase 2 |
| Screen search/filter | Yes | Phase 6 |
| Switcher search | Yes | Phase 2 |
| Contrast fixes | Yes | Phase 1 |
| Touch target fixes | Yes | Phase 1 |
| Icon stroke unification | Yes | Phase 1 |
| Schedule conflict detection | Yes (frontend check) | Phase 8 |
| Onboarding skip | Yes | Phase 4 |
| Notification persistence | Yes (localStorage) | Phase 10 |
| Pluralization | Yes | Phase 10 |

---

## 7. Critical Path

The critical path is the longest chain of dependent tasks:

```
Phase 1 (Foundation) → Phase 2 (Navigation) → Phase 3 (IA) → Phase 4 (Dashboard)
  → Phase 5 (Content) → Phase 7 (Playlists) → Phase 8 (Schedules) → Phase 10 (Polish)
```

**Critical path duration:** ~20-28 weeks

**Parallel tracks:**
- Phase 6 (Screens) runs parallel to Phase 5 (Content)
- Phase 9 (Settings) runs parallel to Phases 5-8
- Backend work for Phase 9 features can start during Phase 1

---

## Cross-References

- See `02-problem-map.md` for problem IDs
- See `07-screen-priorities.md` for screen priorities
- See `08-feature-priorities.md` for feature priorities
- See `17-risk-analysis.md` for risk assessment
- See `19-redesign-roadmap.md` for detailed roadmap
- See `20-implementation-phases.md` for phase execution plans
