# 12 — Schedules Feature

> **Source basis:** `src/features/schedules/schedules-client.tsx`, `src/features/schedules/schedule-calendar.tsx`, `src/features/schedules/schedule-calendar-utils.ts`, `src/features/schedules/schedule-create-dialog.tsx`, `src/features/schedules/schedules-timeline-view.tsx`, `src/features/schedules/api/schedules-api.ts`  

---

## 12.1 Schedules Client (`src/features/schedules/schedules-client.tsx`)

### Route: `/{locale}/schedules`

### Page Structure
- Server component renders header (kicker: "Timing", title, description) then `SchedulesClient`
- Large client component (~15KB) managing schedule CRUD and calendar/timeline views

### View Modes
1. **Calendar View** — Monthly/weekly calendar with schedule blocks
2. **Timeline View** — Horizontal timeline showing schedule spans

### Key Features
- Create schedule via dialog
- Edit existing schedule
- Delete schedule with confirmation
- Drag to reschedule on calendar
- Color-coded by playlist or priority
- Filter by playlist, screen, date range
- Overlap detection and warnings
- Timezone-aware display (uses workspace timezone or UTC default)

---

## 12.2 Schedule Calendar (`src/features/schedules/schedule-calendar.tsx`)

### Purpose
Visual calendar component for displaying and managing schedules.

### Features
- Month view: standard calendar grid with schedule blocks
- Week view: 7-day grid with time slots
- Day view: single day with hourly slots
- Navigation: prev/next/today buttons
- Schedule blocks: colored rectangles spanning time ranges
- Click block to edit
- Drag to move
- Resize to change duration
- Multi-day schedule support
- Overlap visualization (side-by-side blocks)

### Calendar Grid
- 7 columns (days of week)
- Time labels on the side (hourly)
- Current day highlighted
- Weekend shading (optional)
- RTL-aware layout

---

## 12.3 Schedule Calendar Utils (`src/features/schedules/schedule-calendar-utils.ts`)

### Utilities
- `getMonthDays(year, month)` — Returns grid of days for month view
- `getWeekDays(date)` — Returns 7 days for week view
- `formatTimeRange(start, end, locale)` — Localized time range string
- `isOverlapping(scheduleA, scheduleB)` — Check if two schedules overlap
- `getOverlaps(schedules)` — Find all overlapping pairs
- `formatDate(date, locale, timezone)` — Localized date string

---

## 12.4 Schedule Create Dialog (`src/features/schedules/schedule-create-dialog.tsx`)

### Purpose
Dialog for creating a new schedule.

### Fields
| Field | Type | Validation | Purpose |
|-------|------|------------|---------|
| Name | text | Required | Schedule name |
| Playlist | select | Required | Select playlist to schedule |
| Screens | multi-select | Required | Target screens |
| Start date | datetime | Required | Start date/time |
| End date | datetime | Required, after start | End date/time |
| Recurrence | select | Optional | None, daily, weekly, monthly |
| Priority | select | Optional | Low, medium, high |
| Notes | textarea | Optional | Additional notes |

### Behavior
- Date/time pickers with locale-aware formatting
- Recurrence pattern configuration (when recurrence selected)
- Overlap warning if schedule conflicts with existing
- Preview of affected screens
- Submit calls `POST /schedules`

---

## 12.5 Schedules Timeline View (`src/features/schedules/schedules-timeline-view.tsx`)

### Purpose
Horizontal timeline view showing schedule spans across time.

### Features
- Horizontal time axis
- Each screen gets a row
- Schedules shown as colored blocks
- Zoom in/out
- Scroll horizontally for time navigation
- Click block for details
- Color-coded by playlist

---

## 12.6 Schedules API (`src/features/schedules/api/schedules-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchSchedules(workspaceId)` | GET | `/schedules?workspaceId={ws}` | List schedules |
| `fetchSchedule(id)` | GET | `/schedules/{id}` | Get schedule |
| `createSchedule(data)` | POST | `/schedules` | Create schedule |
| `updateSchedule(id, data)` | PATCH | `/schedules/{id}` | Update schedule |
| `deleteSchedule(id)` | DELETE | `/schedules/{id}` | Delete schedule |

---

## 12.7 Schedule Type

```typescript
type Schedule = {
  id: string;
  name: string;
  playlistId: string;
  screenIds: string[];
  startDate: string;
  endDate: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

---

## 12.8 Socket.IO Integration

Schedules respond to the `schedule:changed` Socket.IO event:
- `NotificationProvider` listens for this event
- Shows info toast: "Schedule changed"
- Adds notification to the notification list
- Workspace data epoch is not bumped (schedule changes don't affect sidebar counts)

---

## 12.9 [V2] UX Analysis — Schedules Feature

### Schedule Calendar — HCI Evaluation

**[V2] Calendar View:**
The schedule calendar provides a visual representation of when playlists are scheduled to play on screens. This is essential for digital signage — users need to see the timing of their content across screens.

**[V2] No Overlap Visualization:**
When multiple schedules overlap on the same screen, the calendar should visually indicate conflicts. Without overlap visualization, users may unknowingly create conflicting schedules that cause unexpected playback behavior.

**[V2] No Drag-to-Reschedule:**
The calendar likely uses click-based scheduling (open dialog, set times) rather than drag-and-drop. Drag-to-reschedule is a power-user pattern that significantly reduces time for schedule management.

**[V2] Timeline View:**
The `SchedulesTimelineView` provides an alternative to the calendar — a linear timeline showing scheduled content. This is useful for seeing the sequence of content on a specific screen.

### Schedule Create Dialog — UX Analysis

**[V2] Form Complexity:**
Schedule creation involves: selecting a playlist, selecting screens, setting start/end times, setting recurrence (daily, weekly, custom). This is a multi-field form that benefits from progressive disclosure — showing basic fields first, advanced options on expand.

**[V2] No Conflict Detection:**
When creating a schedule, there is no realtime conflict detection. Users can create overlapping schedules without warning. The backend may handle conflicts by priority, but the user isn't informed during creation.

**[V2] No Timezone Handling:**
Schedules for screens in different time zones require explicit timezone selection. If the schedule uses the user's browser timezone, screens in other time zones will play content at wrong local times. This is a **critical issue for multi-location deployments**.

### [V2] Enterprise SaaS Evaluation

**[V2] Missing Schedule Features:**
- No schedule templates (reusable time slots)
- No schedule approval workflow
- No schedule conflict detection/visualization
- No timezone-aware scheduling
- No holiday/exception calendars
- No schedule analytics (playout compliance)
- No drag-and-drop rescheduling
- No recurring schedule patterns (e.g., "every weekday 9-5")
- No schedule copying between screens

### Cross-References
- See `10-playlists-and-studio.md` for playlist management
- See `09-screens-feature.md` for screen assignment
- See `17-notifications.md` for schedule change notifications
- See `27-user-flows.md` for schedule creation user journey
