# 36 — Admin Components

> **Evidence basis:** `16-tables.md`, `15-cards.md`, `09-interaction-states.md`, `screen-specifications/11-notifications-admin-specs-part1.md`, `screen-specifications/12-admin-specs-part2.md`, `ux-blueprint/15-admin-ux-blueprint-part1.md`, `ux-blueprint/16-admin-ux-blueprint-part2.md`

---

## 1. Admin Component Philosophy

Admin components are **data-dense, functional, and consistent**. They use the standard Table and Card components from the design system. Admin pages are Super-Admin only and follow the List Page pattern.

---

## 2. Components

### Component: ImpersonationBanner

#### Purpose
Banner shown when a Super-Admin is impersonating a workspace.

#### Usage
Top of page (below header) when impersonation is active.

#### Structure
```
<ImpersonationBanner workspace={impersonatedWorkspace} onExit={handleExitImpersonation} />
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | `--warning/10` bg, `--warning/20` border (bottom) |
| Layout | `flex items-center justify-between px-4 py-2` |
| Text | `--text-sm --warning` ("You are impersonating [Workspace Name]") |
| Exit button | `ghost`, `sm`, "Exit Impersonation" |

#### Behavior
- Visible only during impersonation
- "Exit Impersonation" returns to Admin
- Cannot be dismissed without exiting

#### Accessibility
- `role="status"`, `aria-live="polite"`
- Exit button: `aria-label="Exit impersonation mode"`

---

### Component: FeatureFlagToggle

#### Purpose
Toggle switch for enabling/disabling a feature flag.

#### Usage
Admin Feature Flags page.

#### Structure
```
<FeatureFlagToggle
  flag={flag}
  onToggle={handleToggle}
/>
```

#### Visual Design
- Uses standard Toggle component (`13-input-specifications.md`)
- Optimistic update: Switch animates immediately, reverts on error
- Success: Toast "[Flag Name] enabled" / "disabled"
- Error: Switch reverts + toast "Failed to toggle flag"

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `flag` | `FeatureFlag` | Flag entity |
| `onToggle` | `(id, enabled) => void` | Toggle handler |

#### States
| State | Visual |
|-------|--------|
| Enabled | Toggle on (`--primary`) |
| Disabled | Toggle off (`--input`) |
| Toggling | Toggle shows state, API in progress |
| Error | Toggle reverts to previous state |

---

### Component: FleetSummaryCards

#### Purpose
Summary cards showing fleet health (online/offline/warning/total).

#### Usage
Admin Fleet page.

#### Structure
```
<FleetSummaryCards stats={fleetStats} />
```

#### Visual Design
- 4 MetricCards in a grid (`grid-cols-2 lg:grid-cols-4 gap-4`)
- Online: `--success` value
- Offline: `--destructive` value
- Warning: `--warning` value
- Total: `--foreground` value

#### Realtime
- Updates via Socket.IO `screen:status` event
- Summary cards update without page refresh

---

### Component: HealthStatusCard

#### Purpose
Card showing a single service health status.

#### Usage
Admin Health page.

#### Structure
```
<HealthStatusCard service={service} />
```

#### Visual Design
| Element | Style |
|---------|-------|
| Container | Card `variant="default"` |
| Service name | `--text-sm --font-medium --foreground` |
| Status badge | Healthy (success), Degraded (warning), Down (destructive) |
| Response time | `--text-xs --muted-foreground` |
| Uptime | `--text-xs --muted-foreground` |

---

### Component: LogLevelBadge

#### Purpose
Badge showing log level (Info, Warning, Error, Critical).

#### Variants
| Level | Badge Variant | Color |
|-------|--------------|-------|
| Info | `default` | `--primary` |
| Warning | `warning` | `--warning` |
| Error | `destructive` | `--destructive` |
| Critical | `destructive` (bold) | `--destructive`, `--font-bold` |

---

### Component: AdminTable

#### Purpose
Standard table for admin pages with search, filter, sort, and pagination.

#### Usage
Customers, Staff, Users, Workspaces, Fleet, Logs, Feature Flags.

#### Structure
```
<AdminTable
  data={data}
  columns={columns}
  search={search}
  filters={filters}
  sort={sort}
  page={page}
  total={total}
  loading={isLoading}
  onSearch={setSearch}
  onFilter={setFilter}
  onSort={setSort}
  onPageChange={setPage}
  onRowAction={handleRowAction}
/>
```

#### Composition
- Combines: SearchInput + FilterSelect(s) + SortSelect + Table + Pagination
- All server-side (search, filter, sort, pagination via query params)
- Standard toolbar: `flex items-center gap-3 flex-wrap mb-4`

#### Evidence
All admin page specs use this pattern.

---

## 3. Admin Component Rules

- **Super-Admin only:** All admin components are behind role check
- **Server-side everything:** Search, filter, sort, pagination are server-side
- **No client-side filtering:** Admin datasets are too large for client-side
- **Consistent table pattern:** All admin lists use AdminTable
- **Impersonation banner:** Must be visible during impersonation
- **Realtime where applicable:** Fleet status updates in real-time
- **No create/edit forms (current):** Admin is primarily read-only with action buttons

---

## Cross-References

- See `16-tables.md` for Table component
- See `15-cards.md` for Card and Badge
- See `28-data-visualization-components.md` for MetricCard
- See `26-search-components.md` for SearchInput
- See `27-filter-components.md` for FilterSelect and SortSelect
- See `25-navigation-components.md` for Pagination
- See `screen-specifications/11-notifications-admin-specs-part1.md` for Admin Part 1
- See `screen-specifications/12-admin-specs-part2.md` for Admin Part 2
- See `ux-blueprint/15-admin-ux-blueprint-part1.md` and `16-admin-ux-blueprint-part2.md`
