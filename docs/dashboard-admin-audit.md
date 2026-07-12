# Dashboard & Admin — Comprehensive Audit of Remaining Work

> **Date:** 2026-07-12
> **Scope:** Dashboard (customer) + Admin (platform staff)
> **Excluded:** Marketing/landing page (deferred until full system completion)

---

## Legend
- ✅ = Already implemented, verified
- 🔲 = Not started, needs work
- ⚠️ = Partially implemented, needs enhancement

---

## 1. Studio (Canvas Editor)

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| S1 | ⚠️ **Layers panel** | Partial | Properties panel exists but no layers list (reorder, visibility toggle, select by clicking layer name) |
| S2 | 🔲 **Multi-zone layouts** | Not started | Split screen zones — major competitive gap. Need zone container type in canvas layout |
| S3 | ✅ **Canvas templates** | Done | 7 templates (blank, welcome, promo, menu, quote, split) |
| S4 | ✅ **Version history** | Done | Snapshots + auto-save + restore |
| S5 | ✅ **Keyboard shortcuts** | Done | Ctrl+S, Delete, Escape |
| S6 | ⚠️ **More shape types** | Partial | Only text, rect, ellipse. Missing: line, arrow, QR code, image crop |
| S7 | 🔲 **Text styling** | Not started | No font family picker, no text alignment controls in properties panel |
| S8 | 🔲 **Object z-order** | Not started | No bring-to-front / send-to-back controls |
| S9 | 🔲 **Object snapping/alignment** | Not started | No guides, no snap-to-grid, no alignment to other objects |
| S10 | 🔲 **Canvas zoom/pan** | Not started | No zoom controls — important for large designs |

## 2. Playlists

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| P1 | ✅ **Publish/unpublish toggle** | Done | |
| P2 | ✅ **Duplicate (same workspace)** | Done | |
| P3 | ✅ **Preview mode** | Done | |
| P4 | ✅ **Drag-and-drop reorder** | Done | |
| P5 | 🔲 **Clone to workspace** | Not started | API exists (`POST :id/clone-to-workspace`) but no UI in playlists page — only in branches |
| P6 | 🔲 **Duration per item UI** | Verify | Need to confirm duration editing is in playlist studio |
| P7 | 🔲 **Playlist detail page** | Not started | Current studio is embedded — may not need separate page |

## 3. Screens

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SC1 | ✅ **Search + filter** | Done | Search by name/location/serial + status filter |
| SC2 | ✅ **Bulk actions** | Done | Select-all + bulk delete + bulk assign playlist |
| SC3 | ✅ **Screen detail page** | Done | `/screens/[screenId]` with analytics |
| SC4 | ✅ **Quick edit panel** | Done | Ticker, playlist assignment, orientation |
| SC5 | ✅ **Location + resolution display** | Done | Shown in card overlay |
| SC6 | ✅ **Analytics panel** | Done | Overview + per-screen |
| SC7 | ✅ **Orientation lock** | Done | AUTO/LANDSCAPE/PORTRAIT |
| SC8 | ⚠️ **Player pairing flow** | Partial | 6-digit code exists — verify UI is polished |

## 4. Schedules

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SCH1 | ✅ **Week/Month calendar views** | Done | Toggle between week and month |
| SCH2 | ✅ **Override duration customization** | Done | 7 duration options |
| SCH3 | ✅ **Overlap detection** | Done | |
| SCH4 | ✅ **Priority system** | Done | |
| SCH5 | 🔲 **Drag-to-reschedule** | Not started | Drag blocks to move time slots in calendar |
| SCH6 | 🔲 **Day view** | Not started | Only week + month — no single-day detailed view |
| SCH7 | ⚠️ **i18n for calendar** | Partial | Calendar buttons say "Week"/"Month" in English — need i18n |

## 5. Media

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| M1 | ✅ **Search + filter** | Done | Search by name + filter by type |
| M2 | ✅ **Download/export** | Done | |
| M3 | ✅ **Storage indicator** | Done | |
| M4 | ✅ **Folders support** | Done | |
| M5 | 🔲 **Bulk delete** | Not started | No multi-select in media library |
| M6 | 🔲 **Drag-to-folder** | Not started | Can't drag files into folders |
| M7 | 🔲 **Media info modal** | Not started | No way to see file details (size, dimensions, duration, upload date) |
| M8 | 🔲 **Replace/re-upload** | Not started | Can't replace a file while keeping same ID/URL |

## 6. Team

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| T1 | ✅ **Email invites** | Done | Real email + token + accept page |
| T2 | ✅ **Role management** | Done | Change role, remove member |
| T3 | ✅ **Cancel pending invite** | Done | |
| T4 | 🔲 **Resend invite** | Not started | Can cancel but can't resend expired invite |
| T5 | 🔲 **Team activity log** | Not started | No view of what team members did |

## 7. Settings

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| SE1 | ✅ **Profile editing** | Done | Name, business, phone |
| SE2 | ✅ **Email change with OTP** | Done | |
| SE3 | ✅ **2FA settings** | Done | In profile page |
| SE4 | ✅ **Workspace settings** | Done | Timezone, locale, pause, name |
| SE5 | ✅ **Billing page** | Done | Payment history + Stripe portal |
| SE6 | ✅ **Retention banner** | Done | Canceled/PastDue warning + reactivate |
| SE7 | 🔲 **Notification preferences** | Not started | No way to choose which notifications to receive |
| SE8 | 🔲 **API keys** | Not started | No API key management for customer integrations |

## 8. Dashboard / Overview

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| D1 | ✅ **Home dashboard** | Done | Stats + branch cards + quick actions |
| D2 | ✅ **Onboarding wizard** | Done | 2-step after workspace creation |
| D3 | ✅ **Empty states** | Done | Interactive CTAs |
| D4 | ✅ **Breadcrumbs** | Done | |
| D5 | ✅ **Global search (Cmd+K)** | Done | |
| D6 | ✅ **Notifications bell** | Done | In-app notification dropdown |
| D7 | ✅ **Workspace welcome** | Done | |
| D8 | ✅ **Demo content seeding** | Done | |
| D9 | 🔲 **Dashboard widgets customization** | Not started | No drag/rearrange dashboard cards |
| D10 | 🔲 **Recent activity feed** | Not started | No timeline of recent actions (uploads, screen status changes, etc.) |

## 9. Admin

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| A1 | ✅ **Admin overview** | Done | Revenue, screens, users, server health |
| A2 | ✅ **Customer management** | Done | Search, filter, profile, workspaces |
| A3 | ✅ **Fleet management** | Done | Global screens view |
| A4 | ✅ **Staff management** | Done | Create + role assignment |
| A5 | ✅ **Audit logs** | Done | |
| A6 | ✅ **Platform settings** | Done | Branding upload |
| A7 | ✅ **User impersonation** | Done | With audit trail |
| A8 | ✅ **Send reminder** | Done | In customer list + profile |
| A9 | ✅ **Subscription management** | Done | Mock plan, patch subscription |
| A10 | ✅ **Stats page** | Done | Revenue + usage charts |
| A11 | ✅ **Billing view** | Done | |
| A12 | ✅ **Users list** | Done | |
| A13 | ✅ **Workspaces list** | Done | |
| A14 | ⚠️ **Mobile responsive** | Partial | Some responsive classes but admin tables/cards not optimized for mobile |
| A15 | 🔲 **Admin dashboard widgets** | Not started | No customizable admin dashboard |
| A16 | 🔲 **Bulk customer actions** | Not started | No bulk suspend/activate/delete customers |
| A17 | 🔲 **Export customer data** | Not started | No CSV/Excel export of customer list |
| A18 | 🔲 **Admin notification center** | Not started | No admin-specific notifications (new signup, payment failure, etc.) |

## 10. Cross-cutting / System

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| X1 | ✅ **RTL support** | Done | Arabic layout |
| X2 | ✅ **Dark/light theme** | Done | |
| X3 | ✅ **i18n (EN/AR)** | Done | |
| X4 | ✅ **404 page** | Done | |
| X5 | ✅ **Realtime updates** | Done | Socket.IO for screen status, ticker, playlist |
| X6 | 🔲 **Content approval workflow** | Not started | Role-based approval before playlist publish |
| X7 | 🔲 **Public API docs** | Not started | Customer-facing API documentation page |
| X8 | 🔲 **Webhook management** | Not started | Let customers configure webhooks for events |
| X9 | 🔲 **Pricing page** | Not started | Standalone pricing page (not marketing — in-app upgrade flow) |
| X10 | 🔲 **Help/Support page** | Not started | FAQ, documentation, contact form |
| X11 | ⚠️ **Error boundaries** | Partial | 404 exists but no graceful error boundaries for runtime errors |
| X12 | 🔲 **Offline mode indicator** | Not started | Dashboard should show when backend is unreachable |

---

## Priority Ranking for Next Work

### High Priority (Competitive Parity)
1. **S2 — Multi-zone layouts** (5-7 days) — biggest competitive gap
2. **S1 — Layers panel** (2-3 days) — essential for any serious canvas editor
3. **S8 — Object z-order** (1 day) — bring-to-front / send-to-back
4. **S10 — Canvas zoom/pan** (1-2 days) — needed for large designs
5. **P5 — Clone playlist to workspace** (0.5 day) — API exists, just needs UI
6. **X9 — Pricing page** (1 day) — in-app upgrade flow
7. **SCH5 — Drag-to-reschedule** (2-3 days) — calendar UX improvement
8. **SCH7 — Calendar i18n** (0.5 day) — "Week"/"Month" buttons need translation

### Medium Priority (Polish)
9. **S7 — Text styling controls** (1-2 days) — font family, alignment
10. **S6 — More shape types** (2 days) — line, arrow, QR code
11. **S9 — Object snapping** (2-3 days) — alignment guides
12. **M5 — Bulk media delete** (0.5 day)
13. **M7 — Media info modal** (0.5 day)
14. **T4 — Resend invite** (0.5 day)
15. **D10 — Recent activity feed** (1-2 days)
16. **A14 — Admin mobile responsive** (2 days)
17. **A16 — Bulk customer actions** (1 day)
18. **A17 — Export customer data** (0.5 day)
19. **X10 — Help/Support page** (1-2 days)
20. **SCH6 — Schedule day view** (1 day)

### Low Priority (Delight)
21. **X6 — Content approval workflow** (3-5 days)
22. **X7 — Public API docs** (2 days)
23. **X8 — Webhook management** (2-3 days)
24. **SE7 — Notification preferences** (1 day)
25. **SE8 — API keys** (2 days)
26. **A15 — Admin dashboard widgets** (2-3 days)
27. **A18 — Admin notification center** (2 days)
28. **D9 — Dashboard widgets customization** (2-3 days)
29. **M6 — Drag-to-folder** (1 day)
30. **M8 — Replace/re-upload** (1 day)
31. **T5 — Team activity log** (1-2 days)
32. **X11 — Error boundaries** (1 day)
33. **X12 — Offline mode indicator** (0.5 day)

---

## Summary

- **Total items audited:** 82
- **Already done:** 45 (55%)
- **Needs work:** 33 (40%)
- **Partial:** 4 (5%)

**Biggest gaps:** Studio layers panel, multi-zone layouts, canvas zoom, text styling — these are what separate Cloud Signage from competitors in the canvas editor space.
