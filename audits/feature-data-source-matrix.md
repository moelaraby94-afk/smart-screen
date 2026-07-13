# Feature Data-Source Matrix

**Date:** 2026-07-13 · **Task:** T0.3 (PLAN-executable-remediation.md)

Classifies each dashboard feature client as using real API calls or mock/placeholder data.

---

## Summary Table

| Feature | File | Real API | Mock/Placeholder | Notes |
|---|---|---|---|---|
| Analytics page | `features/analytics/analytics-page-client.tsx` | Yes — `fetchScreenAnalytics(workspaceId)` → `GET /screens/:workspaceId/analytics` | No | Real API via `screens-api.ts`. Data is screen-status analytics (online/offline counts, hourly activity). No proof-of-play metrics. |
| Proof-of-play | `features/analytics/proof-of-play-client.tsx` | Yes — `fetchScreenAnalytics(workspaceId)` (same endpoint as analytics) | No | Reuses screen analytics endpoint. **Not** actual proof-of-play data (no impression logs). The "proof-of-play" page shows screen status, not playback confirmation. |
| Campaigns | `features/dashboard/campaigns-client.tsx` | Yes — `apiFetch('/schedules')`, `apiFetch('/playlists')`, `apiFetch('/screens')` | No | Real CRUD: create schedule (POST), delete (DELETE), fetch schedules+playlists+screens in parallel. |
| Emergency override | `features/dashboard/emergency-client.tsx` | Yes — `useApiScreens()` hook, `setScreenOverride()` → `PATCH /screens/:id/override` | Partial — 4 emergency message templates are hardcoded English strings (lines 16-21) | Real API for screen list + override activation/cancel. Template messages are hardcoded, not i18n'd. |
| Templates | `features/dashboard/templates-client.tsx` | Yes — `apiFetch('/canvases')`, `apiFetch('/canvases/:id', {DELETE})` | No | Real API. Lists canvas designs as "templates". |
| AI tools | `features/dashboard/ai-tools-client.tsx` | **No** | **Yes — `mockResults` hardcoded array (lines 18-23), `setTimeout` simulates generation (line 66)** | Fully mock. No backend endpoint. Results are static strings per suggestion type. Input placeholders are hardcoded English. History is in-memory only (not persisted). |
| Content (media) | `features/media/content-client.tsx` | Yes — `fetchMedia()`, `uploadMedia()`, `deleteMedia()` → `GET/POST/DELETE /media` | No | Real API. Upload, list, delete media files. |
| Help & support | `features/help/help-support-client.tsx` | N/A (static content) | N/A | No API calls. Static FAQ + guide links, all i18n'd via `useTranslations('helpPage')`. This is intentional — it's a help page. |
| Admin overview | `features/dashboard/admin-overview.tsx` | Yes — `fetchAdminStats()` | **Partial — growth chart series is fabricated from `revenueUsdPlaceholder * 0.62/0.72/0.84` (lines 138-144)** | Real API for stats totals. Growth chart data is mathematically derived from a single placeholder value, not real historical data. Field name `revenueUsdPlaceholder` confirms it's not production-ready. |

---

## Key Findings

1. **AI tools (`ai-tools-client.tsx`) is fully mock.** No backend endpoint, hardcoded results, `setTimeout` instead of real generation. This is the most significant stub. → Addressed by T4.3.

2. **Proof-of-play is mislabeled.** It uses the screen analytics endpoint (online/offline status), not actual proof-of-play (impression/per-playback) data. The page title says "proof of play" but the data is screen status. → Needs real PoP endpoint or honest relabeling.

3. **Admin growth chart is fabricated.** `revenueUsdPlaceholder` multiplied by arbitrary factors (0.62, 0.72, 0.84) to simulate weekly growth. Not real historical data. Field name itself admits it's a placeholder.

4. **Emergency templates are hardcoded English.** 4 template messages (fire, weather, maintenance, lockdown) at lines 16-21 are not i18n'd. → i18n violation (R6).

5. **All other features (campaigns, templates, content/media, analytics) use real API calls** via `apiFetch` and are not stubs.
