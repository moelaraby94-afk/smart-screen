# Screen Specifications — Scheduling & Analytics

> **Evidence basis:** `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01, P-AN-01, `user-flow-architecture/11-publishing-scheduling-flows.md`, `user-flow-architecture/14-notification-analytics-flows.md`, `product-architecture/09-product-modules.md` M-04, M-05, `information-architecture/06-page-catalog.md` P-SCH-01, P-AN-01

---

## SCR-SCH-01: Scheduling

### Screen ID
SCR-SCH-01

### Purpose
View and manage time-based content schedules on a calendar.

### Business Goal
Time-based content orchestration; promotional scheduling; content rotation.

### User Goal
Create, view, and manage schedules for screen content.

### Primary Users
Owner, Editor (full access); Viewer (read-only).

### Permissions
- "Create Schedule" button: Owner/Editor only
- Schedule edit/delete: Owner/Editor only
- View calendar: All roles

### Entry Points
- Sidebar "Scheduling"
- Playlist Detail "Create Schedule"
- Screen Detail "View All Schedules"
- Overview Quick Action "View Schedule"

### Exit Points
- Click schedule event → Edit dialog
- "Create Schedule" → Creation dialog
- Sidebar navigation

### Navigation
- Sidebar active: "Scheduling"
- Breadcrumbs: None (top-level page)

### Page Title
`Scheduling — Cloud-Screen`

### Primary CTA
"Create Schedule" button (top-right).

### Secondary CTA
- Calendar view toggle (Month/Week/Day — future)
- Screen filter
- Playlist filter

### Danger Actions
- Delete schedule (from edit dialog — Owner/Editor)

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Scheduling" + [Create Schedule]        │
│ View toggle + filters                                 │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────┐ │
│ │ Calendar (Month view)                            │ │
│ │  Sun  Mon  Tue  Wed  Thu  Fri  Sat               │ │
│ │ ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐            │ │
│ │ │   ││   ││   ││   ││   ││   ││   │            │ │
│ │ │   ││   ││ 1 ││ 2 ││ 3 ││ 4 ││ 5 │            │ │
│ │ │   ││   ││   ││EV ││   ││   ││   │            │ │
│ │ └───┘└───┘└───┘└───┘└───┘└───┘└───┘            │ │
│ │ ...                                              │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Calendar: Full width, `min-h-[600px]`

### Spacing
- Page header: `mb-6`
- Calendar cells: `border border-border min-h-[100px] p-1`
- Event blocks: `m-0.5 p-1 text-xs rounded`

### Visual Hierarchy
1. Page header with "Create Schedule" CTA
2. View toggle and filters
3. Calendar grid (primary content)

### Page Sections

#### Section 1: Page Header
- "Scheduling" heading + "Create Schedule" button

#### Section 2: Toolbar
- View toggle: Month (default) | Week (future) | Day (future)
- Screen filter: Dropdown (filter by screen)
- Playlist filter: Dropdown (filter by playlist)
- Date navigation: Previous/Next month + "Today" button

#### Section 3: Calendar Grid
- **Month view:** 7-column grid (Sun–Sat), 5-6 rows
- **Day cells:** Date number + event blocks
- **Event blocks:** Colored by playlist; show playlist name + time range
- **Conflict indicator:** Red border or overlay on conflicting events
- **Click day cell (empty):** (Future) Open creation dialog pre-filled with date
- **Click event:** Open edit dialog
- **Data:** `useApiSchedules({ month, year, screenId, playlistId })`

---

## Component Tree

```
<SchedulingPage>
  <PageHeader>
    <Heading level={1}>Scheduling</Heading>
    <Button variant="default" onClick={openCreateDialog}>
      <Plus icon /> Create Schedule
    </Button>
  </PageHeader>
  <Toolbar>
    <ViewToggle value={view} options={["Month", "Week", "Day"]} onChange={setView} />
    <FilterSelect name="screen" options={screenOptions} />
    <FilterSelect name="playlist" options={playlistOptions} />
    <DateNav current={currentMonth} onPrev={prevMonth} onNext={nextMonth} onToday={goToday} />
  </Toolbar>
  <CalendarGrid>
    {weeks.map(week => (
      <CalendarRow key={week.id}>
        {week.days.map(day => (
          <CalendarDay
            key={day.id}
            date={day.date}
            events={day.events}
            isToday={day.isToday}
            isCurrentMonth={day.isCurrentMonth}
            onEventClick={openEditDialog}
            onDayClick={openCreateDialog}
          />
        ))}
      </CalendarRow>
    ))}
  </CalendarGrid>
</SchedulingPage>
```

### Component Details

#### CalendarDay
- **Props:** `date: Date`, `events: Schedule[]`, `isToday: boolean`, `isCurrentMonth: boolean`, `onEventClick`, `onDayClick`
- **UI:** Date number (top-left), event blocks below
- **Current month:** Normal text; **Other month:** `text-muted-foreground`
- **Today:** `bg-primary/5 border-primary/20`
- **Event block:** Colored left border (by playlist), playlist name, time range
- **Conflict:** Red outline on conflicting events
- **Overflow:** "+N more" if > 3 events
- **Click event:** Open edit dialog
- **Click empty day:** (Future) Open create dialog with date pre-filled

---

## States

### Loading
- Calendar grid: Skeleton cells (gray rectangles)

### Empty — No Schedules
- Calendar renders with no event blocks
- First-time hint: "No schedules yet. Click 'Create Schedule' to get started."

### Error
- Calendar: Error state + "Retry"

### Conflict
- Conflicting events show red outline
- Hover on conflicting event: Tooltip with conflict details

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Create Schedule" | Open creation dialog |
| Click | Event block | Open edit dialog |
| Click | (Future) Empty day cell | Open creation dialog with date pre-filled |
| Click | Prev/Next month | Navigate calendar months |
| Click | "Today" | Jump to current month |
| Change | Screen filter | Filter events by screen |
| Change | Playlist filter | Filter events by playlist |
| Hover | Event block | Tooltip with schedule details |
| Keyboard | Tab | Through toolbar → calendar days |

---

## Responsive

### Desktop (≥ 1024px)
- Full 7-column calendar
- Event blocks show playlist name + time

### Tablet (768px – 1023px)
- 7-column calendar (narrower cells)
- Event blocks show abbreviated names

### Mobile (< 768px)
- **Option 1:** Switch to list view (events listed by date)
- **Option 2:** 7-column calendar with minimal event blocks (color dots)
- Recommended: List view for mobile (calendar grid too cramped)

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/schedules?month={m}&year={y}&screenId={s}&playlistId={p}` | GET | Schedules for calendar |
| `/schedules` | POST | Create schedule |
| `/schedules/{id}` | PUT | Update schedule |
| `/schedules/{id}` | DELETE | Delete schedule |
| `/screens` | GET | Screen list for filter |
| `/playlists` | GET | Playlist list for filter |

### Backend Limitations
- No conflict detection endpoint (must detect on create/update and return 409)
- No recurring schedule expansion (frontend must expand recurring events for calendar display — future)

### Missing APIs
- `GET /schedules/conflicts?screenId={s}&start={d}&end={d}` — Pre-check conflicts before create

---

## Acceptance Criteria

### Functional
- [ ] Calendar displays month view with events
- [ ] "Create Schedule" opens creation dialog
- [ ] Click event opens edit dialog
- [ ] Screen and playlist filters work
- [ ] Month navigation works
- [ ] "Today" jumps to current month
- [ ] Conflicts visually indicated

### UX
- [ ] Skeleton loading
- [ ] Events colored by playlist
- [ ] Today's date highlighted
- [ ] No layout shift

### Accessibility
- [ ] `<h1>` "Scheduling"
- [ ] Calendar: `role="grid"` with `role="row"` and `role="gridcell"`
- [ ] Event blocks: `role="button"` with `aria-label`
- [ ] Keyboard: Tab through days, Enter to open

### Performance
- [ ] Calendar renders < 500ms
- [ ] Month switch < 500ms

### Responsive
- [ ] Full calendar on desktop
- [ ] List view on mobile (future)

---

## SCR-AN-01: Analytics

### Screen ID
SCR-AN-01

### Purpose
View analytics data for screens and content performance.

### Business Goal
Data-driven decisions; performance insights; ROI demonstration.

### User Goal
Understand how screens and content are performing.

### Primary Users
Owner, Editor, Viewer (all roles can view).

### Permissions
- View analytics: All roles
- Export (future): Owner/Editor

### Entry Points
- Sidebar "Analytics"
- Overview widget link (future)

### Exit Points
- Click performer → Screen Detail or Playlist Detail
- Sidebar navigation

### Navigation
- Sidebar active: "Analytics"
- Breadcrumbs: None (top-level page)

### Page Title
`Analytics — Cloud-Screen`

### Primary CTA
Period selector (7d, 30d, 90d, Custom).

### Secondary CTA
- Tab navigation: "Screens" | "Content"
- Export button (future)

### Danger Actions
None.

---

## Layout

### Grid
```
┌─────────────────────────────────────────────────────┐
│ Page Header: "Analytics" + Period selector           │
│ Tabs: [Screens] [Content]                             │
├─────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                 │
│ │ Uptime│ │Active│ │Impres│ │Avg   │                 │
│ │ Card  │ │Scrns │ │sions │ │Play  │                 │
│ └──────┘ └──────┘ └──────┘ └──────┘                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Trend Chart (uptime or impressions over time)    │ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Performers List (top screens or content)         │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### Container
- `max-w-[1400px] mx-auto px-6 py-6`
- Metric cards: `grid grid-cols-2 lg:grid-cols-4 gap-4`
- Chart: Full width, `h-[300px]`
- Performers: Full width

### Page Sections

#### Section 1: Page Header + Period Selector
- "Analytics" heading
- Period selector: Button group (7d, 30d, 90d, Custom)
- Default: 30d

#### Section 2: Tabs
- "Screens" (default) | "Content"

#### Section 3: Metric Cards
- **Screens tab:** Uptime %, Active Screens, Total Impressions, Avg Play Time
- **Content tab:** Total Plays, Most Played, Active Playlists, Content Reach
- **Data:** `useApiAnalytics({ period, type })`

#### Section 4: Trend Chart
- **Type:** Line or area chart (uptime over time, or impressions over time)
- **X-axis:** Dates (period-dependent)
- **Y-axis:** Percentage (uptime) or count (impressions)
- **Implementation:** Recharts or Chart.js
- **Loading:** Skeleton chart (gray rectangle with shimmer)
- **Empty:** "No data for this period"

#### Section 5: Performers List
- **Screens tab:** Top 5 screens by uptime or impressions (name, status, metric)
- **Content tab:** Top 5 playlists by play count (name, plays, screens)
- **Click:** Row → Screen Detail or Playlist Detail
- **Empty:** "No data available"

---

## Component Tree

```
<AnalyticsPage>
  <PageHeader>
    <Heading level={1}>Analytics</Heading>
    <PeriodSelector value={period} onChange={setPeriod} options={["7d", "30d", "90d", "custom"]} />
  </PageHeader>
  <Tabs value={tab} onValueChange={setTab}>
    <TabsList>
      <TabsTrigger value="screens">Screens</TabsTrigger>
      <TabsTrigger value="content">Content</TabsTrigger>
    </TabsList>
  </Tabs>
  <MetricGrid>
    {metrics.map(m => <MetricCard key={m.id} metric={m} />)}
  </MetricGrid>
  <ChartSection>
    <TrendChart data={chartData} loading={isLoading} />
  </ChartSection>
  <PerformersSection>
    <PerformersList items={performers} onClick={handlePerformerClick} />
  </PerformersSection>
</AnalyticsPage>
```

### Component Details

#### MetricCard
- **Props:** `metric: { label, value, trend?, unit? }`
- **UI:** Card with label (muted), large value, trend indicator (up/down arrow + %)
- **Trend:** Green up arrow (positive), Red down arrow (negative)

#### TrendChart
- **Props:** `data: ChartData[], loading: boolean`
- **Implementation:** Recharts `<AreaChart>` or `<LineChart>`
- **Features:** Tooltip on hover, grid lines, axis labels
- **Loading:** Skeleton (gray rectangle)
- **Empty:** "No data for this period" centered text
- **Accessibility:** `aria-label` with chart description; data table fallback (future)

#### PerformersList
- **Props:** `items: Performer[], onClick: (item) => void`
- **UI:** Table or list with rank, name, metric value, status badge
- **Click:** Row → navigate to detail page

---

## States

### Loading
- Metric cards: Skeleton cards
- Chart: Skeleton rectangle
- Performers: Skeleton rows

### Empty — No Data
- Metric cards: Show "—" or "0"
- Chart: "No data for this period"
- Performers: "No data available"
- Page-level hint: "Add screens and publish content to see analytics."

### Empty — No Screens
- Full-page empty state: "No analytics data yet. Add screens and publish content to see performance." + "Add Screen" CTA

### Error
- Per-section error + "Retry"

---

## API Requirements

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/analytics/screens?period={p}` | GET | Screen analytics (metrics + chart + performers) |
| `/analytics/content?period={p}` | GET | Content analytics |
| `/analytics/export?period={p}&type={t}` | GET | Export CSV (future) |

### Backend Limitations
- Analytics data may be limited (depends on what player app reports)
- No real-time analytics (data is aggregated periodically)
- No custom date range support (future)

### Missing APIs
- `GET /analytics/screens?start={d}&end={d}` — Custom date range
- `GET /analytics/export` — CSV/PDF export
- `GET /analytics/screens/{id}` — Per-screen detailed analytics

---

## Acceptance Criteria

### Functional
- [ ] Period selector changes data (7d, 30d, 90d)
- [ ] Tabs switch between Screens and Content
- [ ] Metric cards display correct values
- [ ] Chart renders trend data
- [ ] Performers list shows top items
- [ ] Click performer navigates to detail

### UX
- [ ] Skeleton loading for all sections
- [ ] Empty state when no data
- [ ] Chart tooltip on hover
- [ ] No layout shift

### Accessibility
- [ ] `<h1>` "Analytics"
- [ ] Chart has `aria-label` with description
- [ ] Tabs: `role="tablist"`, `role="tab"`
- [ ] Metric cards: `aria-label` with full text
- [ ] Keyboard: Tab through tabs → metrics → chart → performers

### Performance
- [ ] First metric card < 500ms
- [ ] Chart renders < 1s
- [ ] Period change < 1s

### Responsive
- [ ] 4 metric cards on desktop, 2 on tablet, 2 on mobile
- [ ] Chart full width, adjusts height on mobile
- [ ] Performers table scrolls horizontally on mobile

---

## Cross-References

- See `01-global-layout-spec.md` for app shell
- See `04-screens-specs.md` for Screen Detail spec
- See `05-content-specs.md` for Playlist Detail spec
- See `13-shared-dialogs-specs.md` for schedule creation/edit dialog spec
- See `ux-blueprint/10-scheduling-analytics-team-ux-blueprint.md` P-SCH-01, P-AN-01 for UX blueprint
- See `user-flow-architecture/11-publishing-scheduling-flows.md` for scheduling flows
- See `user-flow-architecture/14-notification-analytics-flows.md` FL-AN-01 for analytics flow
- See `product-architecture/09-product-modules.md` M-04, M-05 for modules
