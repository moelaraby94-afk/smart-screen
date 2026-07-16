# Frontend Responsibilities

> **Evidence basis:** `01-architecture-and-stack.md` (audit), `15-component-strategy.md` (transformation), `16-state-strategy.md` (transformation), `25-design-constraints.md` (transformation)
> **Purpose:** Define what the frontend is responsible for — and what it is NOT responsible for

---

## 1. Frontend Responsibility Scope

The frontend is responsible for:

1. **User interface rendering** — all visual elements, layouts, and interactions
2. **User input collection** — forms, dialogs, wizards
3. **Client-side validation** — immediate feedback before API calls
4. **Server state caching** — SWR cache management
5. **Realtime event display** — Socket.IO event → toast/notification
6. **Navigation** — routing, breadcrumbs, back button
7. **Internationalization** — EN/AR translations, RTL layout
8. **Accessibility** — WCAG 2.1 AA compliance
9. **Optimistic UI feedback** — loading states, success/error toasts
10. **Client-side feature gating** — show/hide features based on flags and roles

The frontend is NOT responsible for:

1. **Business logic** — validation rules, calculations, state transitions (backend)
2. **Data persistence** — database operations (backend)
3. **Authentication decisions** — token validation, session management (backend)
4. **Authorization enforcement** — security boundary is server-side (SC-03)
5. **File storage** — media file storage and CDN (backend/infrastructure)
6. **Socket.IO server** — event emission and room management (backend)
7. **Payment processing** — billing and payment gateway (backend)
8. **Email delivery** — invite emails, notification emails (backend)

---

## 2. Responsibility Categories

### 2.1 Data Rendering

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Render screen list | SWR fetch → card grid | `09-screens-feature.md` §9.8 |
| Render screen detail | SWR fetch → detail layout | `09-screens-feature.md` §9.8 |
| Render playlist library | SWR fetch → grid/list | `10-playlists-and-studio.md` §10.8 |
| Render Studio canvas | Konva → canvas with layers, timeline | `10-playlists-and-studio.md` §10.12 |
| Render media library | SWR fetch → grid with thumbnails | `11-media-library.md` §11.8 |
| Render schedule calendar | SWR fetch → calendar view | `12-schedules-feature.md` §12.8 |
| Render analytics charts | SWR fetch → chart components | `18-analytics-feature.md` §18.8 |
| Render team list | SWR fetch → table/list | `16-team-feature.md` §16.4 |
| Render settings forms | SWR fetch → tabbed forms | `14-settings-feature.md` §14.8 |
| Render admin panels | SWR fetch → tables, stats | `15-admin-panel.md` §15.17 |

### 2.2 User Input

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Login form | Email/password + 2FA | `06-auth-and-session.md` §6.7 |
| Registration form | Name/email/password | `06-auth-and-session.md` §6.7 |
| Screen pairing wizard | Step-by-step form | Locked decision |
| Playlist creation | Template picker or Studio | Locked decision |
| Media upload | Multi-file, drag-drop, progress | `11-media-library.md` §11.8 |
| Schedule creation | Dialog with progressive disclosure | `12-schedules-feature.md` §12.8 |
| Team invite | Email + role selector | `16-team-feature.md` §16.4 |
| Settings forms | Per-tab forms with save | `14-settings-feature.md` §14.8 |

### 2.3 Client-Side Validation

| Responsibility | What | Backend Counterpart |
|----------------|------|-------------------|
| Required field check | Ensure required fields are filled | Backend also validates |
| Email format check | Basic email regex | Backend validates deliverability |
| Date range check | End date > start date | Backend validates |
| Screen name length | Min/max character limits | Backend enforces limits |
| File type check | Image/video only | Backend validates MIME type |
| File size check | Within plan limits | Backend enforces storage limits |
| Conflict detection preview | Show potential schedule conflicts | Backend is source of truth |

**Architecture rule:** Client-side validation is for UX (immediate feedback). Server-side validation is the security boundary. Never rely on client-side validation alone.

### 2.4 Navigation

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Route rendering | Next.js App Router | `01-architecture-and-stack.md` §1.2 |
| Sidebar navigation | 7 first-level items (locked) | Locked sidebar decision |
| Back button | `useShellHeaderMeta` hook | `03-routing-and-navigation.md` §3.4 |
| Breadcrumbs | Shell component | `04-layout-and-shell.md` §4.1 |
| Workspace switch | Switcher → /overview | DD-04 |
| Mobile navigation | Sidebar drawer with workspace switcher | DD-11 |
| Route guards | Disabled nav items when no workspace | DD-12 |

### 2.5 Internationalization

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Translation rendering | next-intl `useTranslations` / `getTranslations` | `22-i18n-and-localization.md` §22.7 |
| RTL layout | Tailwind logical CSS properties | `22-i18n-and-localization.md` §22.8 |
| Locale switching | URL-based `/{locale}/...` | LC-02 |
| Bilingual messages | `en.json` + `ar.json` | BC-01 |
| Icon direction | `rtl:rotate-180` for arrows | RTC-02 |
| Font switching | Cairo for Arabic, system for English | LC-03 |

### 2.6 Accessibility

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Keyboard navigation | Radix UI primitives | DD-14, ACC-02 |
| ARIA attributes | Radix UI + manual on custom components | ACC-03 |
| Focus management | Radix UI handles within components | ACC-02 |
| Color contrast | WCAG AA (4.5:1 normal, 3:1 large) | ACC-01, A-004 |
| Touch targets | ≥ 44×44px on mobile | MSC-02, A-002 |
| Screen reader | Semantic HTML + ARIA | ACC-03 |
| Reduced motion | `prefers-reduced-motion` media query | `27-design-system-governance.md` §11.2 |

### 2.7 Realtime Display

| Responsibility | How | Evidence |
|----------------|-----|----------|
| Socket.IO connection | WorkspaceProvider establishes connection | `07-workspace-management.md` §7.11 |
| Event → toast | NotificationProvider handles events | `17-notifications.md` §17.7 |
| Event → bell badge | NotificationProvider updates unread count | `17-notifications.md` §17.7 |
| Event → SWR revalidation | Data epoch bump triggers refetch | `07-workspace-management.md` §7.11 |
| Connection status | Transport fallback (websocket → polling) | DD-07 |

### 2.8 Error Handling

| Responsibility | How | Evidence |
|----------------|-----|----------|
| API error → toast | `toastResponseError` utility | `23-error-handling-and-states.md` §23.6 |
| Network error → retry | SWR `errorRetryCount` (future: 2-3) | `16-state-strategy.md` §2.1 |
| Session expiry → redirect | WorkspaceProvider detects 401 → reset | `07-workspace-management.md` §7.11 |
| Page error → error boundary | Next.js error boundary | `23-error-handling-and-states.md` §23.9 |
| 404 → not found page | Next.js not-found.tsx | `23-error-handling-and-states.md` §23.9 |

---

## 3. Frontend Responsibility Matrix

| Responsibility | Shell | M-01 | M-02 | M-03 | M-04 | M-05 | M-06 | M-07 | M-08 |
|----------------|-------|------|------|------|------|------|------|------|------|
| Data rendering | — | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| User input | — | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Validation | — | — | ✅ | ✅ | ✅ | — | ✅ | ✅ | ✅ |
| Navigation | ✅ | — | — | — | — | — | — | — | — |
| i18n | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Accessibility | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Realtime | ✅ | ✅ | ✅ | — | ✅ | — | — | — | — |
| Error handling | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Feature gating | ✅ | — | — | — | — | — | — | — | ✅ |

---

## 4. What the Frontend Does NOT Do

| Not Frontend | Owner | Evidence |
|-------------|-------|----------|
| Token generation/validation | Backend | `06-auth-and-session.md` §6.7 |
| Password hashing | Backend | — |
| Email sending | Backend | — |
| File storage/CDN | Backend/Infrastructure | `11-media-library.md` §11.8 |
| Payment processing | Backend | `14-settings-feature.md` §14.8 |
| Database queries | Backend (Prisma) | `01-architecture-and-stack.md` §1.1 |
| Business rule enforcement | Backend | — |
| Audit log writing | Backend middleware | EC-02 |
| RBAC enforcement | Backend | EC-03 |
| Socket.IO server management | Backend | `07-workspace-management.md` §7.11 |

**Architecture rule:** If the frontend discovers a backend limitation, it documents it — it does not solve it. (Locked product decision: "If backend limitations are discovered, document them only. Do not solve them.")

---

## Cross-References

- See `13-frontend-state-boundaries.md` for state boundaries
- See `15-interaction-principles.md` for interaction principles
- See `17-product-rules.md` for product rules
- See `18-product-constraints.md` for product constraints
- See `transformation/16-state-strategy.md` for state strategy
- See `transformation/25-design-constraints.md` for technical constraints
