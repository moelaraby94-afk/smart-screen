# Audit 06: Pages, Design & UX

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Dashboard pages, user experience flows, design quality, accessibility, responsiveness

---

## 1. Page Inventory

### 1.1 Auth Pages (`(auth)/`)

| Page | Route | Status | Notes |
|------|-------|--------|-------|
| Login | `/login` | ✅ Complete | Email/password, 2FA support, locale-aware |
| Register | `/register` | ✅ Complete | Multi-step (start → verify OTP), business info |
| Forgot Password | `/forgot-password` | ✅ Complete | Email → reset link flow |
| Invite Accept | `/invite` | ✅ Complete | Token-based invitation acceptance |

### 1.2 Shell Pages (`(shell)/`)

| Page | Route | Status | Completeness |
|------|-------|--------|-------------|
| Overview | `/overview` | ✅ | Full dashboard with admin/client split |
| Screens | `/screens` | ✅ | List + detail pages |
| Media | `/media` | ✅ | Grid/list view with folders |
| Studio | `/studio` | ✅ | Creative canvas editor |
| Playlists | `/playlists` | ✅ | CRUD with drag-and-drop items |
| Schedules | `/schedules` | ✅ | Calendar/list view |
| Team | `/team` | ✅ | Member list, invitations, role management |
| Billing | `/billing` | ✅ | Plan display, checkout, portal redirect |
| Branches | `/branches` | ✅ | Multi-branch management (3 pages) |
| Settings - Profile | `/settings/profile` | ✅ | Profile edit, email change, 2FA |
| Settings - Workspace | `/settings/workspace` | ✅ | Workspace config, prayer settings, Ramadan |
| Settings - Billing | `/settings/billing` | ✅ | Billing details |
| Admin Home | `/admin` | ✅ | Admin overview with metrics |
| Admin Customers | `/admin/customers` | ✅ | CRM list + profile + branch |
| Admin Users | `/admin/users` | ✅ | User management |
| Admin Fleet | `/admin/fleet` | ✅ | Global screen fleet |
| Admin Screens | `/admin/screens` | ✅ | All screens view |
| Admin Workspaces | `/admin/workspaces` | ✅ | Workspace management |
| Admin Staff | `/admin/staff` | ✅ | Staff management |
| Admin Stats | `/admin/stats` | ✅ | Health metrics |
| Admin Logs | `/admin/logs` | ✅ | Audit log viewer |
| Admin Settings | `/admin/settings` | ✅ | Global settings, feature flags |
| Admin Billing | `/admin/billing` | ✅ | Platform billing |
| Notifications | `/notifications` | ✅ | Notification center |
| Analytics | `/analytics` | ⚠️ | Likely basic/stub |
| Audit Log | `/audit-log` | ✅ | Workspace audit log |
| API Docs | `/api-docs` | ⚠️ | Likely static documentation |
| Help | `/help` | ⚠️ | Likely static help page |
| Emergency | `/emergency` | ⚠️ | Emergency override — needs verification |
| Content | `/content` | ⚠️ | Content library — needs verification |
| Templates | `/templates` | ⚠️ | Content templates — needs verification |
| Proof of Play | `/proof-of-play` | ⚠️ | PoP reports — needs verification |
| Campaigns | `/campaigns` | ⚠️ | Campaign management — needs verification |
| AI | `/ai` | ⚠️ | AI tools — needs verification |
| Displays | `/displays` | ✅ | Display groups |

---

## 2. User Experience Flows

### 2.1 Registration Flow

```
User enters email + business info + password
  → POST /auth/register/start
  → OTP sent to email
  → User enters 6-digit code
  → POST /auth/register/verify
  → Account created + workspace auto-created
  → Tokens issued (cookies set)
  → Redirect to /overview
```

**UX Quality**: ✅ Good — multi-step with clear feedback, OTP auto-focus would improve it.

### 2.2 Login Flow

```
User enters email + password
  → POST /auth/login
  → If 2FA enabled: return requiresTwoFactor flag
    → User enters TOTP code
    → POST /auth/login-2fa
  → Tokens issued (cookies set)
  → Redirect to /overview (or admin for super admin)
```

**UX Quality**: ✅ Good — 2FA flow is seamless, login lockout provides security.

### 2.3 Screen Pairing Flow

```
Player opens player app
  → POST /player/pairing/sessions (gets 6-digit code)
  → Dashboard: user enters code
  → POST /workspaces/:id/claim-pairing
  → Screen created + paired to workspace
  → Player polls → gets screen secret
  → Player begins heartbeat
```

**UX Quality**: ✅ Good — 6-digit code is user-friendly, brute-force protection is invisible to users.

### 2.4 Billing Flow

```
User goes to /billing
  → Sees current plan + usage
  → Clicks "Upgrade"
  → POST /stripe/checkout (gets Stripe URL)
  → Redirect to Stripe Checkout
  → Payment completed → webhook → subscription updated
  → Redirect back to /billing?checkout=success
```

**UX Quality**: ✅ Good — Stripe handles the complex part, mock plan available for dev.

### 2.5 Workspace Settings Flow

```
User goes to /settings/workspace
  → Sees workspace name, timezone, locale
  → Can edit prayer config (Phase 9)
  → Can edit Ramadan config (Phase 9)
  → Can pause workspace
```

**UX Quality**: ✅ Good — all settings on one page with clear sections.

---

## 3. Design Quality

### 3.1 ORCA Design System

The design follows a clean, professional aesthetic:
- **Primary color**: Blue-600 (professional, trustworthy)
- **Surfaces**: White cards on gray-50 background
- **Typography**: System fonts with tabular numbers for metrics
- **Spacing**: Consistent 6/8/10/12 spacing scale
- **Borders**: Subtle gray-200 borders
- **Shadows**: Minimal, card-based surfaces
- **Dark mode**: Full dark theme with gray-950 background

### 3.2 Visual Hierarchy

- **Page kicker**: Small uppercase label above page title ✅
- **Page title**: Large bold heading ✅
- **Card sections**: Rounded border with padding ✅
- **Metrics**: Large tabular numbers with labels ✅
- **Buttons**: Clear primary/outline/ghost hierarchy ✅

### 3.3 Animation

- **Page transitions**: Framer Motion fade + slide ✅
- **Card entrance**: Stagger animations ✅
- **Loading states**: Spinner (Loader2 from lucide) ✅
- **Progress bars**: Animated width transitions ✅

### 3.4 Design Issues

1. **No skeleton loading**: Loading states show spinners instead of skeleton screens. Skeletons would feel faster.
2. **No empty state illustrations**: `empty-state.tsx` component exists but uses icons, not illustrations.
3. **Gradient mesh backgrounds**: Used on home overview but not consistently across pages.
4. **No design tokens documentation**: ORCA system is in CSS but not documented as a design system.

---

## 4. Accessibility

### 4.1 Accessibility Features ✅

- **Skip-to-content link**: Present in `CrystalShell` ✅
- **ARIA labels**: On icon buttons, progress bars, navigation ✅
- **Keyboard navigation**: Radix UI components are keyboard accessible ✅
- **Focus management**: Mobile nav closes on route change ✅
- **RTL support**: `dir="rtl"` applied for Arabic locale ✅
- **Semantic HTML**: `<main>`, `<nav>`, `<header>` elements used ✅
- **Color contrast**: Blue-600 on white meets WCAG AA ✅

### 4.2 Accessibility Issues

1. **No `aria-live` regions**: Toast notifications (sonner) may not announce to screen readers.
2. **No `aria-busy` on loading containers**: Screen readers don't know when content is loading.
3. **Icon-only buttons**: Some buttons have `aria-label` but not all — need audit of every icon button.
4. **Form labels**: Some forms may use placeholder text instead of proper `<label>` association.
5. **No focus trap in modals**: Radix Dialog handles this, but custom modals may not.
6. **Color-only status indicators**: Screen status (ONLINE/OFFLINE/MAINTENANCE) may rely on color alone — needs text or icon indicators.

---

## 5. Responsiveness

### 5.1 Breakpoints

- **Mobile**: < 640px — single column, hamburger nav
- **Tablet**: 640px-1024px — 2-column grids
- **Desktop**: > 1024px — sidebar visible, multi-column

### 5.2 Responsive Features ✅

- **Mobile sidebar**: Drawer with backdrop overlay ✅
- **Responsive grids**: `sm:grid-cols-2`, `lg:grid-cols-3` patterns ✅
- **Responsive padding**: `px-4 sm:px-6 lg:px-10` ✅
- **Desktop sidebar fixed**: `lg:ms-[240px]` ✅
- **Media query listener**: Closes mobile nav on desktop resize ✅

### 5.3 Responsive Issues

1. **No tablet-specific layout**: Jumps from mobile to desktop at 1024px. The 640-1024px range uses mobile-like layouts.
2. **Tables on mobile**: Data tables likely overflow on small screens. No horizontal scroll wrapper visible.
3. **Admin section**: Complex admin tables may not be usable on mobile.

---

## 6. RTL Support

### 6.1 RTL Implementation

- **`dir="rtl"`** on `<html>` for Arabic ✅
- **Logical properties**: `ms-`, `me-`, `ps-`, `pe-` (margin-inline-start, etc.) ✅
- **`start`/`end`** instead of `left`/`right` in CSS ✅
- **Sidebar**: Positioned with `ms-[240px]` (inline-start) — flips in RTL ✅
- **Framer Motion**: Animations use `x` (not `left`/`right`) — may need RTL adjustment

### 6.2 RTL Issues

1. **Hardcoded Arabic in error.tsx**: `isArabic ? 'حدث خطأ...' : 'Failed to load page'` — should use i18n translations instead of inline ternaries.
2. **Same in not-found.tsx**: Hardcoded Arabic strings instead of translation keys.
3. **Framer Motion `x` animations**: `initial={{ x: -20 }}` doesn't flip in RTL. Should use CSS logical properties or conditional values.

---

## 7. Identified Issues

### High
1. **Stub pages need verification**: At least 8 pages (`ai`, `analytics`, `content`, `templates`, `proof-of-play`, `campaigns`, `emergency`, `help`) need feature completeness verification.
2. **No skeleton loading**: Spinners everywhere — skeletons would significantly improve perceived performance.
3. **Hardcoded Arabic strings**: Error and 404 pages use inline ternaries instead of i18n.

### Medium
1. **No accessibility audit**: Need systematic audit of all icon buttons, forms, and status indicators.
2. **Tables on mobile**: No responsive table solution.
3. **No empty state illustrations**: Icon-only empty states feel sparse.
4. **No focus trap verification**: Custom modals may lack focus trapping.

### Low
1. **No design tokens documentation**: ORCA system not formally documented.
2. **Framer Motion RTL**: Animations may not flip correctly in RTL.
3. **No tablet-specific layout**: Jump from mobile to desktop at 1024px.

---

## 8. Strengths

- Clean, professional ORCA design system
- Full dark mode support
- Comprehensive page coverage (30+ pages)
- Smooth Framer Motion transitions
- Skip-to-content link for accessibility
- Radix UI for accessible primitives
- Responsive sidebar with mobile drawer
- RTL support with logical CSS properties
- Locale-aware error and 404 pages
- Clear visual hierarchy with kickers and titles
- Progress bars with ARIA attributes
- Consistent toast notification pattern

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Correction — "stub pages":**
The nine 22-line route files flagged as possibly-stub (`analytics`, `ai`, `content`,
`templates`, `proof-of-play`, `campaigns`, `emergency`, `help`, `api-docs`) are **route
shells that delegate to real feature clients**, not stubs. Verified line counts:
`campaigns-client.tsx` 307, `proof-of-play-client.tsx` 290, `analytics-page-client.tsx` 272,
`emergency-client.tsx` 211, `ai-tools-client.tsx` 189, `templates-client.tsx` 188.
The correct question is **data source, not existence** — some clients call the real API,
others render placeholder data. Confirmed placeholder so far: **AI tools** (`mockResults`).
Action: per-feature data-source check (see PLAN Phase 0).

**Confirmed-true (keep):** hardcoded Arabic ternaries in `error.tsx`/`not-found.tsx`, no
skeleton loading, tables likely overflow on mobile, Framer Motion `x` animations don't flip
in RTL.
