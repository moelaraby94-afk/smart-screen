# 17 — Notifications System

> **Source basis:** `src/features/notifications/notification-provider.tsx`, `src/features/notifications/notifications-page-client.tsx`, `src/features/notifications/notifications-api.ts`  

---

## 17.1 Notification Provider (`src/features/notifications/notification-provider.tsx`)

### Purpose
Global notification context providing real-time notifications via Socket.IO and a notification bell dropdown.

### Context Value
| Field | Type | Purpose |
|-------|------|---------|
| `notifications` | `NotificationItem[]` | All notifications (max 50) |
| `unreadCount` | `number` | Count of unread notifications |
| `markAllRead` | `() => void` | Mark all as read |
| `removeNotification` | `(id: string) => void` | Remove single notification |
| `clearAll` | `() => void` | Clear all notifications |

### NotificationItem Type
```typescript
type NotificationItem = {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string | null;
};
```

### `useNotifications` Hook
Returns context value or empty defaults if used outside provider (graceful degradation).

---

## 17.2 Socket.IO Events

### Connection
- URL: `{NEXT_PUBLIC_REALTIME_URL}/realtime`
- Path: `/socket.io`
- Transports: `['websocket']` only
- Auth: `{ token }` if localStorage token exists
- Reconnection: infinite, 1s–15s backoff

### Events Handled

| Event | Payload | Toast | Notification | Browser Notification |
|-------|---------|-------|-------------|---------------------|
| `screen:status` | `{ screenId, serialNumber, status, lastSeenAt }` | ✅ warning (offline) / success (online) | ✅ | ✅ |
| `upload:complete` | `{ fileName }` | ✅ success | ✅ | ✅ |
| `workspace:subscription` | `{ plan, status }` | ✅ info | ✅ (link to /settings/billing) | ✅ |
| `schedule:changed` | — | ✅ info | ✅ (link to /schedules) | ✅ |
| `pairing:started` | — | ❌ | ✅ (link to /screens) | ❌ |

### Screen Status Logic
- Only triggers notification when status **changes** (not on initial load)
- Uses `prevStatusRef` (Map) to track previous status per screen
- Online → Offline: warning toast with `AlertTriangle` icon
- Offline → Online: success toast with `Monitor` icon

### Browser Notifications
- Uses native `Notification` API
- Only fires if `Notification.permission === 'granted'`
- Title from translations, body = notification message
- Wrapped in try/catch for safety

### Persistence
- On mount/workspace change: fetches persisted notifications from `GET /notifications`
- Maps API `NotificationRow` to `NotificationItem`
- `markAllRead` calls `POST /notifications/mark-all-read`

---

## 17.3 Notification Bell (`NotificationBell` component)

### Location
Rendered in `ShellHeader` (both desktop and mobile action groups).

### UI
- Bell icon button: `h-9 w-9 rounded-xl border border-border bg-card`
- Unread badge: red circle at top-end corner, shows count (or "9+" if > 9)
- `aria-label` includes unread count when > 0

### Dropdown Content
- Width: `w-80`
- Header: "Notifications" title + "Mark all read" button (when unread > 0)
- Empty state: "No notifications" text
- Notification items:
  - Icon (type-specific, colored background)
  - Message text (truncated)
  - Relative timestamp ("just now", "X minutes ago", "X hours ago", date)
  - Unread indicator (primary dot)
  - Click navigates to notification link

### Icon Mapping
| Type | Icon | Color |
|------|------|-------|
| `screen_offline` | `AlertTriangle` | `bg-amber-500/15 text-amber-600` |
| `screen_online` | `Monitor` | `bg-emerald-500/15 text-emerald-600` |
| `upload_complete` | `Upload` | `bg-blue-500/15 text-blue-600` |
| `subscription_updated` | `CreditCard` | `bg-purple-500/15 text-purple-600` |
| `schedule_changed` | `CalendarClock` | `bg-indigo-500/15 text-indigo-600` |
| `pairing_started` | `UserPlus` | `bg-cyan-500/15 text-cyan-600` |
| default | `CheckCircle` | `bg-muted text-muted-foreground` |

### Time Formatting
```typescript
if (diff < 60_000) return t('justNow');
if (diff < 3_600_000) return t('minutesAgo', { n: Math.floor(diff / 60_000) });
if (diff < 86_400_000) return t('hoursAgo', { n: Math.floor(diff / 3_600_000) });
return new Date(ts).toLocaleDateString();
```

---

## 17.4 Notifications Page (`src/features/notifications/notifications-page-client.tsx`)

### Route: `/{locale}/notifications`

### Purpose
Full-page notification history and management (~9KB).

### Features
- Complete notification list (not limited to 50)
- Filter by type, read/unread
- Mark individual notifications as read
- Mark all as read
- Delete individual notifications
- Clear all
- Click notification → navigate to link
- Pagination for large lists

### Page Structure
- Standard page header (kicker, title, description)
- Filter bar
- Notification list with cards
- Empty state when no notifications

---

## 17.5 Notifications API (`src/features/notifications/notifications-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchNotifications()` | GET | `/notifications` | List notifications |
| `markAllNotificationsRead()` | POST | `/notifications/mark-all-read` | Mark all read |
| `markNotificationRead(id)` | PATCH | `/notifications/{id}` | Mark single read |
| `deleteNotification(id)` | DELETE | `/notifications/{id}` | Delete notification |

### NotificationRow Type
```typescript
type NotificationRow = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  read: boolean;
  link?: string | null;
};
```

---

## 17.6 Max Notifications Limit

The provider caps in-memory notifications at `MAX_NOTIFICATIONS = 50`. New notifications are prepended to the array, and the array is sliced to 50 items. This prevents unbounded memory growth in the browser. The full history is available on the notifications page via API.

---

## 17.7 [V2] UX Analysis — Notifications System

### Notification Bell — Micro-UX Evaluation

**[V2] Bell Icon with Badge:**
The notification bell shows an unread count badge. Key UX considerations:
- Badge should use `variant="danger"` or `variant="warning"` for high unread counts
- Badge should cap at "99+" to prevent layout overflow with 3+ digit numbers
- Bell icon should animate (subtle shake or pulse) on new notification
- Clicking the bell should open a dropdown panel, not navigate to the notifications page

**[V2] No Mark-as-Read from Bell:**
The bell dropdown likely shows recent notifications but may not allow marking as read directly from the dropdown. Users must navigate to the full notifications page to mark notifications as read.

**[V2] No Notification Grouping:**
Notifications are shown in chronological order. For high-volume workspaces, similar notifications (e.g., "Screen X went offline", "Screen Y went offline") should be grouped ("2 screens went offline") to reduce noise.

### Notification Provider — Technical UX

**[V2] Socket.IO Event Handling:**
The `NotificationProvider` listens for Socket.IO events and creates notifications. Key considerations:
- If Socket.IO disconnects, notifications stop silently (no indication to user)
- No reconnect notification ("You're back online") after Socket.IO reconnection
- No notification for Socket.IO connection failure

**[V2] MAX_NOTIFICATIONS = 50:**
The 50-item cap is reasonable for in-memory storage. However:
- No visual indicator when notifications are truncated ("Showing 50 of 127")
- No infinite scroll on the notifications page to load more
- The cap is per-session — notifications from previous sessions are not loaded into the provider

**[V2] No Notification Sound:**
There is no audio alert for new notifications. For critical events (screen offline, emergency), an optional sound alert would help users who aren't actively looking at the dashboard.

**[V2] No Notification Persistence:**
Notifications are stored in memory only — they don't persist in localStorage. If the user refreshes the page, in-memory notifications are lost. The notifications page fetches from API, but the bell badge count resets.

### Notifications Page — UX Analysis

**[V2] Notification List:**
The notifications page shows the full notification history. Key UX considerations:
- Filter by type (screen events, schedule events, team events)
- Filter by read/unread status
- Bulk "mark all as read" button
- Pagination or infinite scroll for large histories
- Notification links should navigate to the relevant page (e.g., screen detail for screen offline event)

**[V2] No Notification Actions:**
Notifications are informational only — no inline actions (e.g., "Restart screen" from a screen-offline notification). This limits the usefulness of the notification as a workflow tool.

### [V2] Nielsen Heuristic Evaluation — Notifications

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ⚠️ Medium | Socket.IO failures silent, no persistence on refresh |
| User control and freedom | ⚠️ Medium | No inline mark-as-read from bell, no notification preferences per-event from bell |
| Consistency and standards | ✅ Good | Standard bell + badge pattern, toast notifications |
| Error prevention | ✅ Good | 50-item cap prevents memory issues |
| Recognition rather than recall | ⚠️ Medium | No notification grouping, no visual distinction by type |
| Flexibility and efficiency | ⚠️ Low | No keyboard shortcut for notifications, no notification actions |

### Cross-References
- See `07-workspace-management.md` for Socket.IO connection details
- See `14-settings-feature.md` for notification preferences
- See `23-error-handling-and-states.md` for toast notification patterns
- See `08-dashboard-and-overview.md` for notification bell in header
