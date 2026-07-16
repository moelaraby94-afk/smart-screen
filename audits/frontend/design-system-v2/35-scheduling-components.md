# 35 — Scheduling Components

> **Evidence basis:** `01-foundations.md`, `09-interaction-states.md`, `07-motion-system.md`, `screen-specifications/07-scheduling-analytics-specs.md` SCR-SCH-01, `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01

---

## 1. Scheduling Component Philosophy

Scheduling components manage time-based content playback. The primary interface is a **calendar grid** with event blocks. A **schedule dialog** handles creation and editing.

---

## 2. Components

### Component: CalendarGrid

#### Purpose
Month-view calendar showing scheduled events.

#### Usage
Scheduling page.

#### Structure
```
<CalendarGrid
  weeks={calendarWeeks}
  onEventClick={openEditDialog}
  onDayClick={openCreateDialog}
/>
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | Full width, `min-h-[600px]` |
| Layout | 7-column grid |
| Day headers | `Sun Mon Tue Wed Thu Fri Sat`, `--text-xs --font-medium --muted-foreground`, uppercase |
| Day cell | `border --border min-h-[100px] p-1` |
| Today | `bg-primary/5 border-primary/20` |
| Other month | `text-muted-foreground` date number |
| Current month | `--foreground` date number |

#### Accessibility
- `role="grid"` with `role="row"` and `role="gridcell"`
- Day headers: `role="columnheader"`
- Events: `role="button"` with `aria-label`

---

### Component: CalendarDay

#### Purpose
Single day cell in the calendar grid.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `date` | `Date` | Day date |
| `events` | `Schedule[]` | Events on this day |
| `isToday` | `boolean` | Is today's date |
| `isCurrentMonth` | `boolean` | Is in current month |
| `onEventClick` | `(event) => void` | Event click handler |
| `onDayClick` | `(date) => void` | Day click handler (future) |

#### Visual Design
| Element | Style |
|---------|-------|
| Date number | Top-left, `--text-xs --font-medium` |
| Event block | `m-0.5 p-1 text-xs rounded`, colored left border by playlist |
| Event text | Playlist name + time range, `truncate` |
| Overflow | "+N more" text if > 3 events |
| Conflict | Red outline on conflicting events |

#### Event Block Colors
| Type | Left Border | Background |
|------|-------------|------------|
| Normal | `--primary` | `--primary/5` |
| Conflict | `--destructive` | `--destructive/5` |

#### Accessibility
- `role="gridcell"`
- Events: `role="button"`, `aria-label="[Playlist] at [time] on [date]"`

---

### Component: ScheduleEvent

#### Purpose
Event block within a calendar day.

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `schedule` | `Schedule` | Schedule entity |
| `onClick` | `() => void` | Click handler |

#### Visual
- Left border: 3px, colored by playlist
- Background: `--primary/5`
- Text: `--text-xs --font-medium`
- Content: Playlist name + time range
- Truncation: `truncate` (single line)
- Conflict: `--destructive` border + `--destructive/5` bg

---

### Component: ScheduleDialog

#### Purpose
Dialog for creating or editing a schedule.

#### Usage
Scheduling page, Playlist Detail "Create Schedule".

#### See
`13-shared-dialogs-specs.md` SCR-DLG-03 for full specification.

#### Contents (Create Mode)
- Playlist selector (dropdown/search)
- Screen selector (checkboxes or dropdown)
- Start date/time (DatePicker + time input)
- End date/time (DatePicker + time input)
- Recurrence (radio: One-time, Daily, Weekly, Custom — future)
- Actions: "Cancel" + "Create Schedule"

#### Contents (Edit Mode)
- Same fields, pre-filled
- Additional: "Delete" button (destructive) + "Deactivate" button

#### Validation
| Field | Rule | Message |
|-------|------|---------|
| End time | Must be after start | "End time must be after start time" |
| Screen | At least 1 selected | "Select at least one screen" |
| Playlist | Required | "Select a playlist" |

#### Conflict Handling
- API returns 409 on conflict
- Dialog shows: "[Playlist] conflicts with [Existing Schedule] on [Screen] at [Time]"
- User can adjust time, change screen, or override (replace existing)

---

### Component: DatePicker

#### Purpose
Calendar widget for selecting a date.

#### Usage
Schedule dialog (start/end date).

#### Visual Design
| Element | Style |
|---------|-------|
| Trigger | Input with `Calendar` icon (right side) |
| Panel | `--popover` bg, `--shadow-md`, `--radius-lg` |
| Header | Month/Year + prev/next arrows |
| Days | 7-column grid, `--text-sm` |
| Selected day | `--primary` bg, `--primary-foreground` text |
| Today | `--primary` text, `--primary/10` bg |
| Other month | `--muted-foreground` |

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `value` | `Date` | Selected date |
| `onChange` | `(date) => void` | Change handler |
| `minDate` | `Date` | Minimum selectable date |
| `maxDate` | `Date` | Maximum selectable date |

#### Accessibility
- `role="application"`, `aria-label="Date picker"`
- Days: `role="gridcell"`, `aria-selected` on selected
- Keyboard: Arrow keys to navigate, Enter to select

---

### Component: DateNav

#### Purpose
Navigation for switching calendar months.

#### Usage
Scheduling page toolbar.

#### Structure
```
<DateNav current={currentMonth} onPrev={prevMonth} onNext={nextMonth} onToday={goToday} />
```

#### Visual
- Layout: `flex items-center gap-2`
- Current: `--text-sm --font-medium` ("January 2025")
- Prev/Next: Ghost icon buttons (`ChevronLeft`, `ChevronRight`)
- Today: Ghost button, "Today"

---

## 3. Scheduling Rules

- **Month view only** (current): Week/Day views are future
- **Events colored by playlist**: Each playlist gets a consistent color
- **Conflicts visible**: Red outline on conflicting events
- **Click event**: Opens edit dialog
- **Click empty day** (future): Opens create dialog with date pre-filled
- **Mobile**: Switch to list view (future) — calendar grid too cramped on mobile

---

## Cross-References

- See `01-foundations.md` for all tokens
- See `09-interaction-states.md` for state definitions
- See `07-motion-system.md` for animation tokens
- See `22-dialog-standards.md` for Dialog component
- See `screen-specifications/07-scheduling-analytics-specs.md` for Scheduling spec
- See `13-shared-dialogs-specs.md` SCR-DLG-03 for Schedule Dialog spec
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01
