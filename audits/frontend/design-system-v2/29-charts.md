# 29 — Charts

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `10-accessibility-rules.md`, `screen-specifications/07-scheduling-analytics-specs.md` SCR-AN-01

---

## 1. Chart Philosophy

Charts in Smart Screen use **Recharts** (or similar React charting library). All charts share a consistent visual language: design system colors, minimal grid lines, clear tooltips, and accessible data alternatives.

---

## 2. Chart Components

### Component: TrendChart (Area/Line)

#### Purpose
Show metric trends over time (uptime, impressions, plays).

#### Usage
- Analytics: Uptime over time, Impressions over time
- (Future) Overview: Screen uptime trend

#### Structure
```
<TrendChart
  data={chartData}
  xKey="date"
  yKey="value"
  type="area"
  color="--primary"
  height={300}
  loading={isLoading}
  empty={isEmpty}
/>
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | Full width, `h-[300px]` |
| Background | `--card` |
| Grid lines | `--border` (horizontal only, subtle) |
| Axis labels | `--text-xs --muted-foreground` |
| Line/area color | `--primary` (default), `--success` (uptime) |
| Area fill | `--primary/10` (gradient to transparent) |
| Tooltip | `--popover` bg, `--shadow-md`, `--radius-md` |
| Tooltip text | `--text-sm --foreground` |
| Animation | MI-08 (300ms, path draw on mount) |

#### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `{x, y}[]` | — | Chart data |
| `xKey` | `string` | "date" | X-axis data key |
| `yKey` | `string` | "value" | Y-axis data key |
| `type` | `area \| line` | `area` | Chart type |
| `color` | `string` | `--primary` | Chart color |
| `height` | `number` | 300 | Chart height (px) |
| `loading` | `boolean` | `false` | Skeleton state |
| `empty` | `boolean` | `false` | Empty state |
| `yAxisFormat` | `(value) => string` | — | Y-axis label formatter |
| `xAxisFormat` | `(value) => string` | — | X-axis label formatter |

#### States
| State | Visual |
|-------|--------|
| Loading | Skeleton rectangle (`h-[300px]`, shimmer) |
| Empty | "No data for this period" centered |
| Error | ErrorState + "Retry" |

#### Accessibility
- `aria-label` with chart description (e.g., "Uptime trend over last 30 days")
- Data table fallback (future — `<table>` with raw data, visually hidden)
- Tooltip: Keyboard accessible (future — arrow keys to navigate points)
- Reduced motion: No path draw animation (instant render)

#### Anti-Patterns
- **Custom chart colors** — use design system tokens only
- **No tooltip** — always provide hover tooltip
- **No loading state** — show skeleton during data fetch
- **No empty state** — show "No data" when empty
- **3D charts** — never; flat 2D only
- **Too many series** — max 3 lines/areas per chart

---

### Component: BarChart

#### Purpose
Show discrete values across categories.

#### Usage
- (Future) Analytics: Content performance by playlist
- (Future) Admin: User growth over time

#### Visual Design
| Element | Style |
|---------|-------|
| Bars | `--primary` (default), `--success` (positive), `--destructive` (negative) |
| Bar radius | Top corners `--radius-sm` |
| Bar gap | 4px |
| Grid | `--border` (horizontal only) |

---

### Component: DonutChart

#### Purpose
Show proportional distribution (status breakdown).

#### Usage
- (Future) Overview: Screen status distribution
- (Future) Admin Fleet: Online/offline/warning distribution

#### Visual Design
| Element | Style |
|---------|-------|
| Segments | `--success` (online), `--destructive` (offline), `--warning` (warning) |
| Center label | `--text-2xl --font-bold` (total count) |
| Center sublabel | `--text-xs --muted-foreground` ("Total") |
| Legend | Below chart, colored dots + labels |
| Stroke | `--card` (2px between segments) |

---

## 3. Chart Color Mapping

| Data Type | Color Token | Usage |
|-----------|-------------|-------|
| Primary metric | `--primary` | Default chart color |
| Positive/success | `--success` | Uptime, growth |
| Negative/error | `--destructive` | Downtime, errors |
| Warning | `--warning` | Warnings, pending |
| Neutral | `--muted-foreground` | Inactive, draft |
| Secondary series | `--primary` (lighter shade) | Comparison series |

---

## 4. Chart Rules

- **Library:** Recharts (or similar React charting library)
- **Colors:** Use design system tokens only — never custom hex values
- **Grid:** Horizontal grid lines only (`--border`), no vertical grid
- **Axis:** Minimal labels, `--text-xs --muted-foreground`
- **Tooltip:** Always present on hover; `--popover` bg, `--shadow-md`
- **Animation:** MI-08 (300ms, path draw on mount); no loop animations
- **Reduced motion:** Instant render (no path draw)
- **Loading:** Skeleton rectangle matching chart height
- **Empty:** "No data for this period" centered in chart area
- **Max series:** 3 per chart (more is unreadable)
- **No 3D:** Flat 2D charts only
- **No gradients on bars:** Solid colors only
- **Area charts:** Gradient fill (color → transparent) is acceptable

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `07-motion-system.md` for MI-08
- See `10-accessibility-rules.md` for chart accessibility
- See `28-data-visualization-components.md` for MetricCard and UsageBar
- See `30-dashboard-widgets.md` for widget specs containing charts
- See `screen-specifications/07-scheduling-analytics-specs.md` for analytics page
