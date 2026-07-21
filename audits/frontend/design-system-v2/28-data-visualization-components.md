# 28 — Data Visualization Components

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md`, `screen-specifications/07-scheduling-analytics-specs.md`, `screen-specifications/03-overview-spec.md`

---

## 1. Data Viz Philosophy

Data visualization in Smart Screen is **clear, minimal, and actionable**. Charts use the design system color palette, not custom colors. Every chart has accessible alternatives (data tables) and respects reduced motion.

---

## 2. Components

### Component: MetricCard

#### Purpose
Display a single key metric with label, value, and optional trend.

#### Usage
- Overview widgets (Screen Health, Active Content)
- Analytics metrics (Uptime, Impressions, Play Time)
- Admin fleet summary (Online, Offline, Warning, Total)
- Billing usage (Screens used, Storage used)

#### Structure
```
<MetricCard
  label="Active Screens"
  value="8"
  unit="/ 10"
  trend={{ value: 12, direction: "up" }}
  icon={Monitor}
/>
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | Card (`--card` bg, `--border`, `--shadow-xs`, `--radius-lg`) |
| Padding | `--space-5` |
| Label | `--text-sm --font-normal --muted-foreground` |
| Value | `--text-3xl --font-bold --foreground` |
| Unit | `--text-base --font-normal --muted-foreground` (inline with value) |
| Trend | `--text-sm --font-medium` with arrow icon |
| Trend up | `--success` text, `ArrowUp` icon |
| Trend down | `--destructive` text, `ArrowDown` icon |
| Icon | 20px, `--muted-foreground`, top-right |

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Metric label |
| `value` | `string \| number` | Metric value |
| `unit` | `string` | Unit suffix (e.g., "/ 10", "%", "GB") |
| `trend` | `{ value: number, direction: "up" \| "down" }` | Trend indicator |
| `icon` | `LucideIcon` | Optional icon |
| `loading` | `boolean` | Skeleton state |

#### Accessibility
- `aria-label="[label]: [value] [unit]"` on card
- Trend: `aria-label="[value]% [direction]"`

---

### Component: UsageBar

#### Purpose
Progress bar showing resource usage against a limit.

#### Usage
- Billing (screens used/limit, storage used/limit)
- Media library (storage indicator — future)

#### Structure
```
<UsageBar label="Screens" used={8} limit={10} unit="" />
```

#### Visual Design
| Element | Style |
|---------|-------|
| Label | `--text-sm --font-medium --foreground` |
| Value | `--text-sm --muted-foreground` (right-aligned: "8 / 10") |
| Track | `h-2 --muted --radius-full` |
| Fill | `h-2 --radius-full`, color based on usage % |
| Fill < 70% | `--success` |
| Fill 70-90% | `--warning` |
| Fill > 90% | `--destructive` |

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Resource label |
| `used` | `number` | Used amount |
| `limit` | `number` | Maximum amount |
| `unit` | `string` | Unit (e.g., "GB", "") |

#### Accessibility
- `role="progressbar"`
- `aria-valuenow={used}`, `aria-valuemin="0"`, `aria-valuemax={limit}`
- `aria-label="[label]: [used] of [limit] [unit]"`

---

### Component: StatusDonut (Future)

#### Purpose
Donut chart showing distribution of statuses (online/offline/warning).

#### Usage
- Overview Screen Health widget
- Admin Fleet summary

#### Visual
- Donut chart with segments colored by status
- Center: Total count
- Legend: Below chart with status labels and counts
- Implementation: Recharts `<PieChart>` or custom SVG

---

## Cross-References

- See `29-charts.md` for chart component specifications
- See `30-dashboard-widgets.md` for dashboard widget specs
- See `01-foundations.md` for color tokens
- See `10-accessibility-rules.md` for data viz accessibility
- See `screen-specifications/07-scheduling-analytics-specs.md` for analytics page
- See `ux-blueprint/03-component-ux-standards.md` for component standards
