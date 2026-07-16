# 18 — Analytics Feature

> **Source basis:** `src/features/analytics/analytics-page-client.tsx`  

---

## 18.1 Analytics Page Client (`src/features/analytics/analytics-page-client.tsx`)

### Route: `/{locale}/analytics`

### Purpose
Analytics dashboard showing screen performance, playback metrics, and account insights (~16KB).

### Sections

**Overview Metrics:**
- Total impressions (all screens)
- Total playback duration
- Average uptime percentage
- Active screens count
- Trend indicators (up/down vs. previous period)

**Time Range Selector:**
- Today, 7 days, 30 days, 90 days, custom range
- Updates all charts and metrics

**Screen Performance:**
- Per-screen impression counts
- Uptime percentage per screen
- Offline duration per screen
- Top/bottom performing screens
- Bar chart or table view

**Playback Analytics:**
- Playlist performance comparison
- Media item play counts
- Proof-of-play reports
- Playback duration by playlist
- Engagement metrics (if available)

**Device Metrics:**
- Screen health over time (line chart)
- Online/offline timeline
- Error/crash reports per screen
- Firmware version distribution

**Export:**
- Export data as CSV/PDF
- Date range selection for export
- Per-screen or aggregate export

### Data Fetching
- Fetches from analytics API endpoints
- Uses SWR for caching and revalidation
- Loading states with skeleton patterns
- Error states with retry buttons

### Charts
The component likely uses a charting library or custom SVG/CSS-based charts. Based on dependencies, no dedicated charting library is in `package.json` — charts may be built with CSS/Tailwind or inline SVG.

### Period Comparison
- Current period vs. previous period
- Percentage change indicators
- Color-coded: green (positive), red (negative)

### Empty State
When no analytics data is available (new account, no screens):
- `EmptyState` component with icon and message
- CTA to add screens or upload content

---

## 18.5 [V2] UX Analysis — Analytics Feature

### Analytics Dashboard — HCI Evaluation

**[V2] Chart-Based Data Visualization:**
The analytics page uses charts to visualize data trends. Key UX considerations:
- Chart type should match data type (line for trends, bar for comparisons, pie for distributions)
- Charts should have tooltips on hover showing exact values
- Charts should be responsive (resize on container change)
- Charts should be accessible (ARIA labels, text alternatives)

**[V2] Period Comparison:**
Current vs previous period comparison with percentage change is a standard analytics pattern. The color coding (green positive, red negative) is correct for most metrics. However, for some metrics (e.g., "screen downtime"), negative change is positive — the color logic should be metric-aware.

**[V2] Empty State:**
The empty state with CTA is good — it guides users to add data rather than showing a blank chart. However, the empty state should differentiate between "no data because new account" and "no data because no screens assigned."

**[V2] Missing Analytics Features:**
- No date range picker (custom date ranges)
- No export to CSV/PDF
- No scheduled email reports
- No per-screen analytics
- No per-playlist analytics
- No audience engagement metrics (if cameras/sensors are available)
- No proof-of-play reports
- No device health analytics (crash reports, uptime)
- No comparison across branches/workspaces
- No real-time analytics dashboard

### Cross-References
- See `08-dashboard-and-overview.md` for dashboard analytics
- See `09-screens-feature.md` for screen health data
- See `23-error-handling-and-states.md` for empty state patterns
- See `28-feature-inventory.md` for analytics feature inventory
