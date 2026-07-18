# 13 — Scheduling Audit

> **Objective:** Evaluate the scheduling system: recurrence patterns, conflict detection, priority resolution, override rules, and timezone handling.

---

## 1. Current State

Scheduling is implemented in `domains/schedules/scheduling.service.ts` with a `Schedule` model supporting weekly and monthly recurrence, and `ScreenOverrideRule` for advanced overrides. The system detects overlaps but has no automatic conflict resolution.

---

## 2. What Exists

### Schedule Model
- **Recurrence:** `WEEKLY` (uses `daysOfWeek` array 0-6) or `MONTHLY` (uses `daysOfMonth` array 1-31)
- **Time window:** `startTime` and `endTime` as `String` ("HH:mm" format)
- **Date range:** `startDate` and `endDate` as `DateTime`
- **Priority:** `Int` — Higher priority schedules override lower ones
- **Enabled:** `Boolean` toggle
- **Associations:** `workspaceId`, `screenId`, `playlistId`

### Schedule CRUD
- `GET /schedules` — List schedules for a workspace (paginated)
- `GET /schedules/overlaps` — Detect overlapping schedules
- `GET /schedules/:id` — Get one schedule
- `POST /schedules` — Create schedule (OWNER/ADMIN/EDITOR)
- `PATCH /schedules/:id` — Update schedule
- `DELETE /schedules/:id` — Delete schedule

### Overlap Detection
- `GET /schedules/overlaps?workspaceId=...` — Returns pairs of overlapping schedules
- Checks: same screen, overlapping time windows, overlapping day patterns
- Does NOT check priority resolution — just reports overlaps

### Screen Playlist Assignments
- Multiple playlists can be assigned to a screen with `orderIndex` for rotation
- `POST /screens/:id/assignments` — Add playlist assignment
- `PATCH /screens/:id/assignments/reorder` — Reorder assignments
- `DELETE /screens/:id/assignments/:aid` — Remove assignment

### Screen Override Rules
- `ScreenOverrideRule` model with:
  - `recurrence`: ONCE, DAILY, WEEKLY, MONTHLY (String, not enum)
  - `startDate`, `endDate`, `startTime`, `endTime`
  - `daysOfWeek` (for WEEKLY)
  - `playlistId` — The override playlist
- `POST /screens/:id/override` — Set override playlist
- Override takes precedence over scheduled content

### Active Content Resolution
- `ScreensService.getActiveContent()` resolves which playlist should play now:
  1. Check active override rules (highest priority)
  2. Check schedules for current time/day
  3. Fall back to screen's `activePlaylistId` or `playlistGroupId`
  4. Return playlist with items

---

## 3. What Is Missing

1. **No timezone support** — `startTime`/`endTime` are "in workspace TZ" per schema comment, but Workspace has no `timezone` field. All times are interpreted as server local time. A workspace in Dubai with a server in UTC will display content at wrong times.

2. **No holiday schedules** — No mechanism to define holidays with special schedules (e.g., show holiday content, don't show workday content).

3. **No schedule preview** — No endpoint to preview what will play on a screen at a given future time. No calendar view API.

4. **No conflict resolution** — Overlaps are detected but not resolved. No automatic priority-based resolution. Users must manually resolve conflicts.

5. **No schedule templates** — Can't save a schedule pattern as a template for reuse.

6. **No schedule duplication** — Can't copy a schedule to another screen or workspace.

7. **No schedule import/export** — Can't bulk import schedules from CSV/JSON.

8. **No recurrence for specific dates** — Can't schedule for specific dates (e.g., "December 25") without using ONCE override rules.

9. **No duration-based scheduling** — Can't schedule "play this playlist for 30 minutes then switch to another." Only start/end time windows.

10. **No schedule analytics** — No data on how many times a schedule actually executed, no proof-of-play per schedule.

11. **No DST (Daylight Saving Time) handling** — No awareness of DST transitions. Schedules may shift by 1 hour during DST changes.

12. **No schedule validation** — No validation that `startTime < endTime`, that `startDate < endDate`, or that `daysOfWeek` values are valid (0-6).

---

## 4. Problems

1. **`recurrence` as String instead of enum** — Both `Schedule.recurrence` and `ScreenOverrideRule.recurrence` are `String` fields. Invalid values can be written to the DB.

2. **Time strings instead of DateTime/Time** — `startTime` and `endTime` are `String` ("HH:mm"). No DB-level format validation. A typo could store "25:00" or "9am".

3. **No transaction for schedule + override creation** — Creating a schedule and its override rules are separate operations. Partial failures leave inconsistent state.

4. **Overlap detection is O(n²)** — For each schedule, it compares against all other schedules. With 1000+ schedules per workspace, this will be slow.

5. **No index on `Schedule(screenId, startTime, endTime)`** — Overlap queries scan all workspace schedules instead of using an index.

6. **Override rule doesn't check workspace membership** — `ScreenOverrideRule.playlistId` could reference a playlist from a different workspace.

---

## 5. Risks

- **High: No timezone support** — Schedules will be wrong for users in different timezones than the server.
- **Medium: No DST handling** — Schedules shift during DST transitions.
- **Medium: O(n²) overlap detection** — Performance degradation at scale.
- **Low: String recurrence** — Invalid values could cause runtime errors.

---

## 6. Priority: **High**

Scheduling is a core feature. Timezone support is the most critical gap.

---

## 7. Completion Percentage: **80%**

Weekly/monthly recurrence, overlap detection, priority, overrides, and active content resolution are implemented. Missing: timezone, holidays, preview, conflict resolution, templates, DST handling.

---

## 8. Recommendations

1. Add `timezone` field to Workspace model (default: "Asia/Dubai")
2. Convert `startTime`/`endTime` to stored as UTC, interpreted in workspace timezone using `luxon` or `date-fns-tz`
3. Convert `Schedule.recurrence` and `ScreenOverrideRule.recurrence` to Prisma enums
4. Add schedule validation: `startTime < endTime`, `startDate <= endDate`, valid `daysOfWeek` values
5. Add `GET /schedules/preview?screenId=...&from=...&to=...` — Returns what will play in a time range
6. Add holiday schedule support: `Holiday` model with `date`, `name`, `workspaceId`
7. Add schedule duplication: `POST /schedules/:id/duplicate?screenId=...`
8. Add index on `Schedule(screenId, startTime, endTime)` for overlap query optimization
9. Add schedule analytics: track schedule execution in `ProofOfPlay` model
10. Add DST-aware time handling using `luxon` ZoneInfo
11. Add cross-workspace playlist validation for override rules
12. Add schedule templates: `ScheduleTemplate` model for reusable patterns

---

## 9. Future Tasks

- [ ] Add timezone support to Workspace
- [ ] Convert time strings to timezone-aware DateTime
- [ ] Convert recurrence to enum
- [ ] Add schedule validation
- [ ] Add schedule preview endpoint
- [ ] Add holiday schedule support
- [ ] Add schedule duplication
- [ ] Optimize overlap detection with indexes
- [ ] Add schedule analytics (proof-of-play)
- [ ] Add DST-aware time handling
- [ ] Add schedule templates
- [ ] Add schedule import/export
