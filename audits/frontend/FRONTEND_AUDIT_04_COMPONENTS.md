# 04 — Components Audit

> **Evidence basis:** `components/ui/` directory, feature client components

---

## 1. Design System Components (`components/ui/`)

### 1.1 Inventory
| Component | File | Size | Status |
|-----------|------|------|--------|
| AlertDialog | alert-dialog.tsx | 2946B | ✅ |
| Badge | badge.tsx | 1366B | ✅ |
| Button | button.tsx | 3449B | ✅ |
| Card | card.tsx | 2642B | ✅ |
| Checkbox | checkbox.tsx | 1189B | ✅ |
| Dialog | dialog.tsx | 2472B | ✅ |
| DropdownMenu | dropdown-menu.tsx | 2679B | ✅ |
| EmptyState | empty-state.tsx | 1271B | ✅ Underutilized |
| InfoTooltip | info-tooltip.tsx | 1956B | ✅ |
| Input | input.tsx | 2637B | ✅ |
| Label | label.tsx | 341B | ✅ |
| Select | select.tsx | 5432B | ✅ Underutilized |
| Skeleton | skeleton.tsx | 285B | ✅ |
| SkeletonPatterns | skeleton-patterns.tsx | 1641B | ✅ Underutilized |
| Switch | switch.tsx | 1245B | ✅ |
| Table | table.tsx | 1675B | ✅ |
| Tabs | tabs.tsx | 1858B | ✅ |

### 1.2 Button Component Analysis
- **Variants:** default, cta, secondary, ghost, outline, destructive, link (7 variants)
- **Sizes:** default, sm, lg, icon (4 sizes)
- **Features:** loading state with spinner, leftIcon/rightIcon, asChild pattern, fullWidth
- **Accessibility:** `aria-busy`, `aria-disabled`, `focus-visible:ring`
- **Issue:** `cta` variant is identical to `default` — redundant

### 1.3 Table Component Analysis
- Simple wrapper around native `<table>` elements
- No sorting, pagination, or selection built-in
- No virtualization support
- **Issue:** Each page implements its own sorting and filtering logic

### 1.4 Select Component Analysis
- 5432B — largest UI component, likely Radix-based
- **Issue:** Screen detail and schedules use native `<select>` instead of this component

---

## 2. Missing Components

| Component | Impact | Pages Affected |
|-----------|--------|----------------|
| Pagination | Medium | All list pages |
| SearchFilterBar | Medium | Screens, Media, Schedules, Team |
| Chart | Low | Analytics |
| DatePicker | Medium | Schedules, Analytics |
| Toast wrapper | Low | Global (sonner used directly) |
| Breadcrumb | Low | Used inline in crystal-shell, not reusable |
| FileUpload | Medium | Media (uses react-dropzone directly) |
| ConfirmDialog | Medium | Used inline with AlertDialog each time |
| DataGrid | Medium | All table views (sorting, filtering, pagination) |

---

## 3. Component Usage Patterns

### 3.1 Consistent Usage
- **Button** — used consistently across all pages ✅
- **Dialog/AlertDialog** — used for all modals ✅
- **Input** — used for all text inputs ✅
- **Tabs** — used for Content and Settings ✅

### 3.2 Inconsistent Usage
- **Select** — design system component exists but native `<select>` used on Screen Detail, Schedules
- **EmptyState** — exists but many pages use ad-hoc empty messages
- **Skeleton/SkeletonPatterns** — exists but many pages use text loading
- **Table** — used but sorting/filtering implemented per-page

---

## 4. Feature-Level Component Complexity

| Component | Lines | Complexity | Issue |
|-----------|-------|------------|-------|
| `MediaLibraryClient` | 857 | High | Single file does everything |
| `TeamClient` | 785 | High | Dual member system in one file |
| `SchedulesClient` | 429 | Medium | Three view modes in one file |
| `AnalyticsPageClient` | 389 | Medium | No charts, hardcoded colors |
| `PlaylistStudioClient` | 309 | Medium | Well decomposed with hooks |
| `ClientHomeDashboard` | 281 | Medium | Full reload pattern |
| `ScreenDetailClient` | 720+ | High | Large but well-structured |

---

## 5. Component Architecture Patterns

### 5.1 Good Patterns
- **Playlist Studio** decomposes into hooks: `usePlaylistData`, `usePlaylistActions`, `useGroupActions`, `useTimelineEdit`, `usePlaylistMeta`
- **Button** uses CVA for variant management
- **CrystalShell** separates sidebar, header, content concerns

### 5.2 Anti-Patterns
- **MediaLibraryClient** — 857-line monolith with all state, handlers, and UI in one file
- **TeamClient** — 785-line monolith mixing workspace and account-level members
- **Inline dialogs** — each page defines its own AlertDialog/Dialog instead of reusable ConfirmDialog

---

## 6. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Component coverage | 7/10 | 17 components, 9 missing |
| Usage consistency | 6/10 | Select, EmptyState, Skeleton underutilized |
| Architecture | 6/10 | Some monoliths, some well-decomposed |
| Reusability | 6/10 | Missing DataGrid, Pagination, SearchFilterBar |
| Accessibility | 7/10 | Button has aria, but gaps in forms |
| **Overall** | **6.4/10** | **Needs component library expansion** |
