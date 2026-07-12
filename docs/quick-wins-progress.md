# Quick Wins Progress — 2026-07-12

## Summary

Audit of 12 tasks from the UX audit. 8 were already implemented; 4 were newly added.

## Batch 1: Quick Wins (6 tasks)

### P1-9: Override duration customization — ✅ Already existed
- **Location:** `apps/dashboard/src/features/schedules/schedules-client.tsx:291-306`
- **Details:** Dropdown with 7 duration options: 30min, 1h, 2h, 4h, 8h, 12h, 24h
- **i18n keys:** `duration30min`, `duration1h`, `duration2h`, `duration4h`, `duration8h`, `duration12h`, `duration24h`
- **Status:** No changes needed

### P1-10: Media search/filter — ✅ Already existed
- **Location:** `apps/dashboard/src/features/media/media-library-client.tsx:71-72, 291-304, 405-419`
- **Details:** Search by name (`searchQuery` state) + filter by type (`typeFilter`: all/image/video)
- **i18n keys:** `searchPlaceholder`, `filterAll`, `filterImages`, `filterVideos` (in `mediaClient` namespace)
- **Status:** No changes needed

### P1-14: Player ticker UI — ✅ Already existed
- **Location:** `apps/dashboard/src/features/screens/screen-quick-edit-panel.tsx:51, 115-129, 293-329`
- **Details:** Ticker text input with send/clear buttons in quick edit panel. Updates `playerTicker` field via `apiUpdateScreen`.
- **i18n keys:** `tickerLabel`, `tickerPlaceholder`, `tickerSend`, `tickerClear`, `tickerHint`, `tickerSent`, `tickerFailed`
- **Status:** No changes needed

### P1-16: Storage + screen limit indicators — ✅ Already existed
- **Location:** `apps/dashboard/src/components/usage-indicator.tsx` (component)
- **Usage:** `apps/dashboard/src/features/screens/screens-client.tsx:266` (screens page)
- **Details:** `UsageIndicator` component shows screen count vs limit and storage usage with progress bars. Also used in media library.
- **i18n keys:** `usageIndicator.screens`, `usageIndicator.storage`, `usageIndicator.nearLimit`
- **Status:** No changes needed

### P2-11: Export/download media — ✅ Newly implemented
- **Location:** `apps/dashboard/src/features/media/media-grid-sections.tsx:147-168`
- **Changes:**
  - Added `Download` icon import from `lucide-react`
  - Added download `<a>` button next to delete button in media card overlay
  - Uses `href={m.publicUrl}` with `download={m.originalName}` attribute
  - Button appears on hover (same as delete button)
- **i18n keys added:**
  - `mediaClient.download` = "Download" (en) / "تنزيل" (ar)
- **Files modified:**
  - `apps/dashboard/src/features/media/media-grid-sections.tsx`
  - `apps/dashboard/src/i18n/messages/en.json`
  - `apps/dashboard/src/i18n/messages/ar.json`

### P2-12: Admin send reminder button — ✅ Already existed
- **Location:** `apps/dashboard/src/features/admin/admin-customer-profile-client.tsx:205-217, 250-259`
- **API:** `apps/dashboard/src/features/admin/admin-api.ts:135-141` (`sendCustomerReminder`)
- **Details:** "Send Reminder" button in customer profile header. Calls `POST /admin/customers/:id/reminder`. Shows toast on success/failure.
- **i18n keys:** `sendReminder`, `toastReminderDefault`, `toastReminderFailed`
- **Status:** No changes needed

## Files Changed

| File | Change |
|------|--------|
| `apps/dashboard/src/features/media/media-grid-sections.tsx` | Added download button to media cards |
| `apps/dashboard/src/i18n/messages/en.json` | Added `download` key in `mediaClient` |
| `apps/dashboard/src/i18n/messages/ar.json` | Added `download` key in `mediaClient` |

## Batch 2: Medium Tasks (6 tasks)

### P1-13: Workspace settings (timezone, locale, pause) — ✅ Already existed
- **Location:** `apps/dashboard/src/features/settings/workspace-settings-client.tsx`
- **Details:** Full settings page with timezone selector (12 common timezones), default locale (en/ar), workspace name editing, and pause/resume playback toggle
- **Backend:** `apps/backend/src/domains/workspaces/workspaces.service.ts:545-577` supports `name`, `timezone`, `defaultLocale`, `isPaused` updates
- **Status:** No changes needed

### P1-12: Screen analytics dashboard — ✅ Already existed
- **Location:** `apps/dashboard/src/features/screens/screen-analytics-panel.tsx`
- **Details:** Analytics panel showing total screens, status breakdown (online/offline/maintenance), uptime percentage, playlist assignment stats, newest/oldest seen timestamps
- **API:** `GET /screens/analytics?workspaceId=...` via `fetchScreenAnalytics` in `screens-api.ts`
- **Also:** Screen detail page (`screen-detail-client.tsx`) shows per-screen analytics
- **Status:** No changes needed

### P1-11: In-app notifications (bell icon) — ✅ Newly implemented
- **Location:** `apps/dashboard/src/features/notifications/notification-provider.tsx`
- **Changes:**
  - Transformed `NotificationProvider` from toast-only to full notification context provider with state management
  - Added `NotificationItem` type, `NotificationContext`, `useNotifications` hook
  - Notifications stored in state (max 30), with unread count and mark-all-read
  - Created `NotificationBell` component with dropdown showing notification history
  - Bell icon shows unread badge count (red circle, caps at 9+)
  - Each notification shows type-specific icon (warning/monitor/upload), message, and relative timestamp
  - Added `NotificationBell` to desktop header actions in `header.tsx`
  - Wrapped `children` with `NotificationProvider` in `layout.tsx` (was previously mounted without children)
- **i18n keys added:** `notifications.title`, `bellLabel`, `markAllRead`, `empty`, `justNow`, `minutesAgo`, `hoursAgo` (en + ar)
- **Files modified:**
  - `apps/dashboard/src/features/notifications/notification-provider.tsx`
  - `apps/dashboard/src/components/layout/header.tsx`
  - `apps/dashboard/src/app/[locale]/layout.tsx`
  - `apps/dashboard/src/i18n/messages/en.json`
  - `apps/dashboard/src/i18n/messages/ar.json`

### P2-6: Keyboard shortcuts in Studio — ✅ Newly implemented
- **Location:** `apps/dashboard/src/features/studio/studio-editor-client.tsx:383-401`
- **Changes:**
  - Added `useEffect` with `keydown` listener on `window`
  - **Ctrl/Cmd+S:** Save canvas + take snapshot (prevents default browser save)
  - **Delete/Backspace:** Remove selected canvas object (when not in input field)
  - **Escape:** Deselect current object
  - Ignores shortcuts when focus is in INPUT, TEXTAREA, or SELECT elements
- **Files modified:**
  - `apps/dashboard/src/features/studio/studio-editor-client.tsx`

### P2-8: Player orientation lock — 🔲 Deferred
- **Reason:** Requires schema migration (adding `orientation` field to Screen model), backend API changes, player UI changes, and dashboard UI. Too large for quick implementation.
- **Status:** Not started

### P2-13: Playlist detail page — 🔲 Deferred
- **Reason:** Current `PlaylistStudioClient` already provides full editing, preview, and publish toggle in a single page. A separate detail page would be redundant unless redesigned.
- **Status:** Not started

## All Files Changed (Combined)

| File | Change |
|------|--------|
| `apps/dashboard/src/features/media/media-grid-sections.tsx` | Added download button to media cards |
| `apps/dashboard/src/features/notifications/notification-provider.tsx` | Full notification system with bell dropdown |
| `apps/dashboard/src/components/layout/header.tsx` | Added NotificationBell to header |
| `apps/dashboard/src/app/[locale]/layout.tsx` | Wrapped children with NotificationProvider |
| `apps/dashboard/src/features/studio/studio-editor-client.tsx` | Added keyboard shortcuts (Ctrl+S, Delete, Escape) |
| `apps/dashboard/src/i18n/messages/en.json` | Added `download`, notification bell keys |
| `apps/dashboard/src/i18n/messages/ar.json` | Added `download`, notification bell keys |

## Remaining P1/P2 Tasks

See `docs/ux-audit-customer-journey.md` sections 4.3, 4.4, and 6 for full list.

