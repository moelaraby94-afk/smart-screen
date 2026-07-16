# 08 — Performance UX Audit

> **Evidence basis:** Feature client components, data fetching patterns, state management

---

## 1. Data Fetching Patterns

### 1.1 Current Approach
- **No SWR or React Query** — most pages use `useEffect` + `useState` + `fetch` pattern
- **Manual cache invalidation** — `bumpWorkspaceDataEpoch()` used to trigger refetches
- **No stale-while-revalidate** — every navigation refetches data

### 1.2 Issues
- **Full reload on every action** — Overview dashboard calls `load()` after rename/pause/delete/seed, refetching all insights
- **No optimistic updates** — UI waits for API response before updating
- **No background refetch** — Data is stale until manual refresh or navigation
- **No request deduplication** — Multiple components fetching same data make separate requests

### 1.3 Recommendation
Adopt SWR or React Query for:
- Automatic cache management
- Stale-while-revalidate pattern
- Optimistic updates
- Request deduplication
- Background refetch on focus

---

## 2. Loading States

### 2.1 Current Patterns
| Page | Loading Pattern | Quality |
|------|----------------|---------|
| Overview | Text: "Loading…" centered | Poor |
| Screens | Skeleton or spinner | Medium |
| Screen Detail | Skeleton pattern | Good |
| Media | Pending state | Medium |
| Playlists | Loading state in hooks | Medium |
| Schedules | Loading boolean | Poor |
| Analytics | CardGridSkeleton, TableSkeleton | Good |
| Team | Loading text | Poor |
| Settings | Unknown | — |

### 2.2 Issues
- **Inconsistent loading patterns** — some use skeletons, some use text, some use spinners
- **SkeletonPatterns underutilized** — `CardGridSkeleton` and `TableSkeleton` exist but not used everywhere
- **No progressive loading** — all-or-nothing loading; no partial content display
- **No Suspense boundaries** — except in Media page which uses `<Suspense>`

---

## 3. Rendering Performance

### 3.1 Large Lists
| Page | Issue | Impact |
|------|-------|--------|
| Screens List | No virtualization, all cards render | 200+ screens = slow |
| Media Library | "Load More" pagination (good) | Manageable |
| Playlists | All playlists rendered in grid | 100+ = potential lag |
| Schedules | All schedules in view | Likely manageable |
| Team | All members in table | Likely manageable |
| Analytics | All screens in table | 200+ = slow |

### 3.2 Re-render Issues
- **Playlist search** — filters on every keystroke, no debounce
- **Screen Detail** — socket effect was causing reconnects (fixed in stabilization)
- **Overview** — `load()` refetch causes full re-render of all widgets

### 3.3 Bundle Size Concerns
- **Framer Motion** — heavy library for page transitions; could use CSS transitions
- **react-dropzone** — used only in Media Library
- **socket.io-client** — loaded on Screen Detail page

---

## 4. API Call Efficiency

### 4.1 Waterfall Requests
- **Overview:** `fetchAccountInsights()` — single call, good
- **Screen Detail:** Multiple parallel calls via `Promise.all` — good
- **Media Library:** `fetchMedia`, `fetchMediaFolders` — parallel, good
- **Team:** `apiFetchMembers`, `apiFetchInvites` — parallel, good

### 4.2 Redundant Requests
- **Overview** — `load()` called after every action, refetching everything
- **Content tabs** — Each tab component fetches its own data even if already loaded in another tab
- **Playlist Studio** — `loadPlaylists`, `loadGroups`, `loadLibrary` may overlap

### 4.3 No Request Caching
- Navigating away and back to a page triggers full refetch
- No ETag or If-Modified-Since handling
- No client-side cache layer

---

## 5. Realtime Performance

### 5.1 Socket.io Implementation
- **Screen Detail** — connects to `/realtime` namespace, subscribes to `screen:status` and `screen:content`
- **Reconnection** — `reconnection: true`, `reconnectionAttempts: Infinity`, delay 1s, max 15s
- **Transport** — `websocket` only (no polling fallback)

### 5.2 Issues
- **No global socket** — each Screen Detail page creates its own connection
- **No connection pooling** — multiple screen details open = multiple sockets
- **No offline indicator** — user doesn't know if realtime is disconnected

---

## 6. Image/Media Performance

### 6.1 Issues
- **No image optimization** — media thumbnails use original URLs, no `next/image` or responsive sizes
- **No lazy loading** — media grid loads all images at once
- **No placeholder images** — blank space until image loads
- **No progressive image loading** — no blur-up or LQIP pattern

---

## 7. Score

| Dimension | Score | Notes |
|-----------|-------|-------|
| Data fetching | 4/10 | No SWR/RQ, manual fetch, full reloads |
| Loading states | 5/10 | Inconsistent, skeletons underutilized |
| Rendering | 5/10 | No virtualization, no debounce |
| API efficiency | 6/10 | Parallel calls good, but redundant refetches |
| Realtime | 6/10 | Works but no pooling or offline indicator |
| Image/media | 4/10 | No optimization, no lazy loading |
| Bundle size | 6/10 | Framer Motion heavy, code splitting unclear |
| **Overall** | **5.1/10** | **Needs modern data layer and optimization** |
