# 21 — Global Search & Quick Actions

> **Source basis:** `src/features/search/global-search.tsx`, `src/features/dashboard/quick-actions-section.tsx`  

---

## 21.1 Global Search (`src/features/search/global-search.tsx`)

### Location
Rendered in `ShellHeader` — desktop (button with Ctrl+K hint) and mobile (icon button).

### Trigger
- **Desktop:** Button with search icon and "Search..." text + `Ctrl K` keyboard shortcut badge
- **Mobile:** Icon-only button (h-9 w-9)
- **Keyboard shortcut:** `Ctrl+K` or `Cmd+K` toggles the search modal
- **ESC:** Closes the modal

### Modal Layout
- Fixed overlay: `bg-black/50 backdrop-blur-sm` at `z-[100]`
- Modal: `fixed left-1/2 top-[15%] z-[101] max-w-xl` centered horizontally
- Framer-motion animation: `initial={{ opacity: 0, y: -20 }}` → `animate={{ opacity: 1, y: 0 }}`

### Search Input
- Full-width input with search icon
- Placeholder text from translations
- autofocus on open
- Clear (X) button

### Data Loading
When modal opens, loads all screens, media, and playlists in parallel:
```typescript
const [scr, med, plsRes] = await Promise.all([
  fetchScreens(workspaceId),
  fetchMedia(workspaceId),
  fetchPlaylists(workspaceId),
]);
```

### Search Results

**When query is empty:** Shows "Quick Nav" list of navigation commands:
| Label | Route | Icon |
|-------|-------|------|
| Overview | `/{locale}/overview` | `LayoutDashboard` |
| Screens | `/{locale}/screens` | `Monitor` |
| Emergency | `/{locale}/emergency` | `AlertTriangle` |
| Media | `/{locale}/media` | `FolderOpen` |
| Studio | `/{locale}/studio` | `Clapperboard` |
| Templates | `/{locale}/templates` | `LayoutTemplate` |
| Playlists | `/{locale}/playlists` | `Clapperboard` |
| Schedules | `/{locale}/schedules` | `CalendarClock` |
| Analytics | `/{locale}/analytics` | `Activity` |
| AI | `/{locale}/ai` | `Sparkles` |
| Team | `/{locale}/team` | `Users` |

**When query is entered:** Searches across:
1. **Navigation commands** — matches label text
2. **Screens** — matches name, serial number, location
3. **Playlists** — matches name
4. **Media** — matches original filename

Results are capped at 12 items.

### Result Item Rendering
```tsx
<Link href={r.href} className="flex items-center gap-3 px-4 py-2.5">
  {iconForType(r.type)}
  <div className="min-w-0 flex-1">
    <p className="truncate font-medium">{r.label}</p>
    <p className="truncate text-xs text-muted-foreground">{r.sublabel}</p>
  </div>
  <span className="rounded-md border px-1.5 py-0.5 text-[10px] uppercase">{r.type}</span>
</Link>
```

### Keyboard Navigation
- **Arrow Down/Up:** Navigate results
- **Enter:** Navigate to selected result
- **Mouse hover:** Sets active index
- Active item: `bg-primary/10`

### Footer
- Left: "Use ↑↓ to navigate" hint
- Right: Result count

### Icons by Type
| Type | Icon |
|------|------|
| `screen` | `Monitor` (primary) |
| `playlist` | `Clapperboard` (primary) |
| `command` | `Search` (primary) |
| `media` | `Image` (primary) |

---

## 21.2 Quick Actions Section (`src/features/dashboard/quick-actions-section.tsx`)

### Location
Rendered on the home dashboard (`ClientHomeDashboard`), below `OnboardingProgressWidget`.

### Purpose
Quick access buttons to key features.

### Actions
| Action | Route | Icon |
|--------|-------|------|
| Add Screen | `/{locale}/screens` | `Monitor` |
| Upload Media | `/{locale}/media` | `Upload` |
| Create Playlist | `/{locale}/playlists` | `Clapperboard` |
| Create Schedule | `/{locale}/schedules` | `CalendarClock` |
| Open Studio | `/{locale}/studio` | `LayoutTemplate` |
| View Analytics | `/{locale}/analytics` | `Activity` |

### Layout
- Responsive grid: 2 columns on mobile, 3 on sm, 6 on lg
- Each action: card-like button with icon and label
- Hover: border highlight and background tint
- Links via `next/link` `Link` component

---

## 21.3 [V2] UX Analysis — Global Search & Quick Actions

### Global Search — HCI Evaluation

**[V2] Command Palette Pattern:**
The global search uses a modal overlay with keyboard shortcut (Ctrl+K). This is the standard command palette pattern used by modern SaaS products (e.g., Linear, Notion, GitHub). Key UX considerations:
- Search input should autofocus on open
- Results should be keyboard navigable (arrow keys + Enter)
- Results should categorize by type (screens, playlists, media, settings)
- Recent searches should persist
- No results state should suggest alternatives

**[V2] Search Scope:**
The search likely searches within the current workspace only. Cross-workspace search is not available. For enterprise users with multiple workspaces, this means they must switch workspaces to search across all data.

**[V2] Search Index:**
The search likely calls a backend API with the query string. There is no client-side search index — every keystroke triggers an API call (possibly debounced). This means:
- Search requires network connectivity
- Search latency depends on API response time
- No offline search capability
- No search history/suggestions when input is empty

**[V2] Keyboard Navigation:**
The search modal should support:
- `Ctrl+K` / `Cmd+K` to open
- `Escape` to close
- `ArrowUp` / `ArrowDown` to navigate results
- `Enter` to select
- `Tab` to move between categories (if implemented)

### Quick Actions — UX Analysis

**[V2] Navigation vs Action:**
As noted in `08-dashboard-and-overview.md` V2, quick actions navigate to pages rather than performing actions directly. "Add Screen" takes the user to the screens page, not to an add-screen dialog.

**[V2] Quick Action Selection:**
The 6 quick actions (Add Screen, Upload Media, Create Playlist, Create Schedule, Open Studio, View Analytics) cover the primary user tasks. However:
- No "Invite Team Member" action
- No "Create Branch" action
- No "Emergency Broadcast" action
- No "View Reports" action
- Actions are hardcoded, not customizable

**[V2] Quick Action Icons:**
"Open Studio" uses `LayoutTemplate` icon — same as the "Templates" sidebar item. This is a minor icon consistency issue. "Create Playlist" uses `Clapperboard` — same as both Playlists and Studio in the sidebar.

### Cross-References
- See `03-routing-and-navigation.md` for sidebar navigation as search alternative
- See `08-dashboard-and-overview.md` for quick actions on dashboard
- See `24-accessibility-audit.md` for keyboard navigation accessibility
- See `26-consistency-audit.md` for icon usage consistency
