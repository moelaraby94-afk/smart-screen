# Feature Ownership

> **Evidence basis:** `08-feature-priorities.md` (transformation), `28-feature-inventory.md` (audit), `09-product-modules.md`, `10-module-responsibilities.md`
> **Purpose:** Map every feature to its owning module — no feature without a home, no module without clear ownership

---

## 1. Feature Ownership Convention

Each feature is documented with:
- **Feature ID** — from `08-feature-priorities.md`
- **Feature name** — what it does
- **Owning module** — which module is responsible
- **Contributing modules** — modules that provide data or components
- **Priority** — Must Have, High, Medium, Low, Future
- **Phase** — implementation phase from roadmap

---

## 2. M-01: Overview Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-MH-06 | Standardized loading states | Must Have | 1 | All |
| F-HP-14 | Quick actions act (not navigate) | High | 4 | M-02, M-03 |
| F-MP-09 | Onboarding skip option | Medium | 4 | — |
| F-MP-10 | Dashboard widget hierarchy | Medium | 4 | M-02, M-03, M-04 |
| F-MP-11 | Screen health summary count | Medium | 4 | M-02 |
| F-MP-12 | Recent activity feed | Medium | 4 | M-02, M-03, M-04 |
| F-LP-03 | Empty state for no screens | Low | 1 | M-02 |

---

## 3. M-02: Screens Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-MH-01 | Fix Switch RTL | Must Have | 1 | — |
| F-MH-03 | Fix click guards | Must Have | 1 | — |
| F-MH-02 | Mobile workspace switcher | Must Have | 2 | M-07 |
| F-HP-02 | Switch to /overview | High | 2 | M-01 |
| F-HP-03 | Screen search/filter | High | 6 | — |
| F-HP-04 | Bulk screen operations | High | 6 | — |
| F-MP-06 | Screen pairing wizard | Medium | 4 | M-01 |
| F-MP-07 | Screen detail enhancement | Medium | 6 | M-03, M-04 |
| F-MP-08 | Branch filter in screens | Medium | 3 | — |
| F-FU-01 | Remote screen reboot | Future | Future | — |
| F-FU-02 | Live screenshot preview | Future | Future | — |
| F-FU-03 | Map view for screens | Future | Future | — |
| F-FU-04 | OTA screen updates | Future | Future | — |

---

## 4. M-03: Content Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-MH-05 | Fix InfoTooltip (Radix) | Must Have | 1 | — |
| F-MP-02 | Icon stroke standardization | Medium | 1 | All |
| F-MP-03 | Remove Studio from nav | Medium | 3 | — |
| F-MP-13 | Playlist templates | Medium | 5 | — |
| F-MP-14 | Auto-save in Studio | Medium | 7 | — |
| F-MP-15 | Alignment guides in Studio | Medium | 7 | — |
| F-MP-16 | Multi-file media upload | Medium | 5 | — |
| F-MP-17 | Media drag-drop upload | Medium | 5 | — |
| F-MP-18 | Playlist live preview | Medium | 5 | — |
| F-HP-05 | Multi-file upload (bulk) | High | 5 | — |
| F-FU-05 | Multi-zone layouts | Future | Future | — |
| F-FU-06 | Content approval workflow | Future | Future | M-06 |
| F-FU-07 | Playlist versioning | Future | Future | — |
| F-FU-08 | A/B testing for content | Future | Future | M-05 |

---

## 5. M-04: Scheduling Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-HP-06 | Timezone-aware scheduling | High | 8 | M-07 |
| F-HP-07 | Conflict detection | High | 8 | M-02 |
| F-MP-01 | Back button for settings | Medium | 2 | M-07 |
| F-FU-09 | Calendar drag-to-reschedule | Future | Future | — |
| F-FU-10 | Nested playlists | Future | Future | M-03 |
| F-FU-11 | Content expiry automation | Future | Future | M-03 |

---

## 6. M-05: Analytics Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-LP-01 | Analytics export | Low | 10 | — |
| F-LP-02 | Custom date range | Low | 10 | — |
| F-FU-12 | Proof-of-play reports | Future | Future | M-03 |
| F-FU-13 | Device crash reports | Future | Future | M-02 |
| F-FU-14 | Social media integration | Future | Future | M-03 |

---

## 7. M-06: Team Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-HP-08 | Custom roles (RBAC) | High | 9 | M-07 |
| F-HP-09 | Team management CRUD | High | 9 | — |
| F-HP-10 | Audit log | High | 9 | M-08 |
| F-HP-11 | SSO/SAML | High | 9 | M-07 |
| F-LP-04 | Notification preferences | Low | 2 | M-07 |

---

## 8. M-07: Settings Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| F-HP-15 | Contrast fixes | High | 1 | — |
| F-HP-16 | Touch target fixes | High | 1 | — |
| F-HP-12 | Test coverage | High | 10 | All |
| F-HP-13 | Workspace switcher search | High | 2 | — |
| F-LP-05 | Plan selection UI | Low | 9 | — |
| F-LP-06 | Invoice PDF download | Low | 9 | — |
| F-LP-07 | API key management | Low | 10 | — |
| F-LP-08 | Webhook configuration | Low | 10 | — |
| F-FU-15 | Content templates marketplace | Future | Future | M-03 |

---

## 9. M-08: Admin Module — Feature Ownership

| Feature ID | Feature | Priority | Phase | Contributing Modules |
|------------|---------|----------|-------|---------------------|
| — | Impersonation | Existing | — | Shell |
| — | Feature flag management | Existing | — | All (gating) |
| — | Fleet overview | Existing | — | M-02 (cross-workspace) |
| F-HP-10 | Audit log (admin-side) | High | 9 | — |

---

## 10. Cross-Module Features

Some features span multiple modules. Ownership is assigned to the module where the primary user interaction occurs.

| Feature | Primary Owner | Contributors | Coordination Rule |
|---------|-------------|-------------|-------------------|
| Immediate publish | M-03 Content | M-02 Screens | Content triggers publish; Screens receives assignment |
| Screen pairing wizard | M-02 Screens | M-01 Overview | Screens owns wizard; Overview links to it |
| Template picker | M-03 Content | M-01 Overview | Content owns templates; Overview links to creation |
| Onboarding flow | M-01 Overview | M-02, M-03 | Overview orchestrates; Screens and Content provide steps |
| Branch filter | M-02 Screens | — | Screens owns filter UI and branch management |
| Conflict detection | M-04 Scheduling | M-02 Screens | Scheduling owns detection; Screens displays conflicts on detail |
| Branding | M-07 Settings | Shell | Settings owns configuration; Shell applies branding |
| Feature gating | M-08 Admin | All modules | Admin owns flags; all modules check flags |
| Notification preferences | M-07 Settings | NotificationProvider | Settings owns UI; Provider applies preferences |
| Islamic features | M-07 Settings | M-04 Scheduling | Settings owns config; Scheduling applies prayer interruptions |

---

## 11. Unowned Features (Gaps)

| Feature | Suggested Owner | Status | Evidence |
|---------|----------------|--------|----------|
| Password visibility toggle on login | M-07 (auth flow) | Not in feature list | `06-auth-and-session.md` §6.7 |
| Form state persistence | All modules | Not in feature list | `27-user-flows.md` §27.9 |
| Search history | M-03, M-02 | Not in feature list | `21-search-and-global-actions.md` §21.3 |
| Notification context expansion | M-01 (bell) | Not in feature list | `17-notifications.md` §17.7 |
| Global search (Ctrl+K) | Shell | Existing but limited | `21-search-and-global-actions.md` §21.3 |

**Architecture rule:** Every feature must have an owning module. If a feature doesn't fit any module, either a module's scope must expand or the feature must be reconsidered.

---

## Cross-References

- See `09-product-modules.md` for module definitions
- See `10-module-responsibilities.md` for module responsibilities
- See `12-module-boundaries.md` for boundaries between modules
- See `transformation/08-feature-priorities.md` for full feature priority list
- See `transformation/28-feature-inventory.md` (audit) for feature maturity matrix
