# 46 — Performance Guidelines

> **Evidence basis:** `07-motion-system.md`, `08-animation-principles.md`, `19-loading-states.md`, `screen-specifications/14-screen-specifications-summary.md` (Performance UX), `product-architecture/17-product-rules.md` PR-47

---

## 1. Performance Philosophy

Smart Screen targets **fast perceived performance** over raw metric optimization. The user should feel that the application is responsive, with no jarring delays, layout shifts, or frozen UI. Loading states manage expectations; optimistic updates provide instant feedback.

---

## 2. Performance Budgets

### 2.1 Loading Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.5s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| First Input Delay (FID) | < 100ms | Lighthouse |
| Route transition | < 200ms (perceived) | Manual |
| API response (perceived) | < 300ms (with skeleton) | Manual |

### 2.2 Bundle Size Targets

| Metric | Target |
|--------|--------|
| Initial JS bundle (dashboard) | < 300KB (gzipped) |
| Per-route chunk | < 100KB (gzipped) |
| Studio chunk (Konva) | < 200KB (gzipped, lazy-loaded) |
| Total CSS | < 50KB (gzipped) |
| Images | WebP/AVIF where possible, lazy-loaded |

---

## 3. Loading Strategies

### 3.1 Skeleton First

- Show skeleton immediately on page load
- Replace with content when data arrives
- No layout shift between skeleton and content
- Evidence: `19-loading-states.md`

### 3.2 SWR Caching

- Use SWR (or similar) for data fetching
- `keepPreviousData: true` during revalidation (no flash)
- `revalidateOnFocus: false` (avoid unnecessary refetches)
- Deduplicate identical requests

### 3.3 Prefetching

| What | When | Method |
|------|------|--------|
| Route pages | Link hover (desktop) | Next.js `prefetch` |
| Route pages | Sidebar item hover | Next.js `prefetch` |
| Studio chunk | "Edit in Studio" hover | Dynamic import prefetch |
| Next page data | Pagination hover (future) | SWR prefetch |

### 3.4 Lazy Loading

| Component | When | Method |
|-----------|------|--------|
| Studio (Konva) | Route navigation | `next/dynamic` with `ssr: false` |
| Charts (Recharts) | Analytics page load | `next/dynamic` |
| Media images | Scroll into view | `loading="lazy"` on `<img>` |
| Below-fold content | Initial render | React `lazy()` (future) |

---

## 4. Animation Performance

### 4.1 GPU-Accelerated Properties Only

| Property | GPU Accelerated | Use |
|----------|----------------|-----|
| `transform` | ✅ Yes | Scale, translate, rotate |
| `opacity` | ✅ Yes | Fade in/out |
| `width` | ❌ No | Causes reflow — avoid |
| `height` | ❌ No | Causes reflow — avoid |
| `margin` | ❌ No | Causes reflow — avoid |
| `padding` | ❌ No | Causes reflow — avoid |
| `top`/`left` | ❌ No | Causes reflow — avoid |

### 4.2 Animation Rules
- Animate only `transform` and `opacity`
- Use `will-change: transform` sparingly (only during active animation)
- Remove `will-change` after animation completes
- Limit concurrent animations to < 10
- No animation > 600ms (except loops)
- Evidence: `08-animation-principles.md`

### 4.3 Skeleton Shimmer
- Use CSS gradient animation (not JavaScript)
- `background-position` animation is acceptable (compositor-only)
- 1500ms loop duration
- Pause when not visible (Intersection Observer — future)

---

## 5. Optimistic UI

### 5.1 When to Use Optimistic Updates

| Action | Optimistic | Evidence |
|--------|-----------|----------|
| Toggle feature flag | ✅ Yes | `12-admin-specs-part2.md` |
| Toggle notification | ✅ Yes | `10-settings-specs-part2.md` |
| Delete entity (list) | ✅ Yes (remove from list immediately) | All list specs |
| Rename entity (inline) | ✅ Yes | `04-screens-specs.md` |
| Create entity | ❌ No (need server-generated ID) | — |
| Form save | ❌ No (need confirmation) | — |

### 5.2 Rollback on Error
- If API call fails after optimistic update, revert UI to previous state
- Show error toast: "Failed to [action]. Reverted."
- Evidence: `user-flow-architecture/01-flow-principles.md` FP-07

---

## 6. Image Optimization

### 6.1 Format
- Use WebP or AVIF where supported
- Fallback to JPEG/PNG
- Next.js `<Image>` component for automatic optimization

### 6.2 Sizing
- Serve appropriately sized images (not 4K for a 200px thumbnail)
- Use `srcset` or Next.js Image for responsive images
- Media thumbnails: 400px width
- Screen card thumbnails: 400px width
- Playlist preview: 800px width

### 6.3 Loading
- `loading="lazy"` on below-fold images
- `priority` on above-fold images (Next.js Image)
- Placeholder: Blur or skeleton while loading

---

## 7. Data Fetching

### 7.1 Pagination
- Server-side pagination for lists > 20 items
- Default page size: 20 items
- Infinite scroll (future) for media grid

### 7.2 Debouncing
- Search input: 300ms debounce
- Inline edit: No debounce (save on blur/Enter)

### 7.3 Realtime
- Socket.IO for screen status updates
- Throttle UI updates to 1/second (avoid excessive re-renders)
- Batch multiple status updates into single render

---

## 8. Rendering

### 8.1 SSR vs CSR
- **SSR (Server-Side Rendering):** Auth pages, static content, SEO-relevant pages
- **CSR (Client-Side Rendering):** Dashboard pages (behind auth, data-dependent)
- **SSG (Static Generation):** Error pages (404, 500), auth layout

### 8.2 Code Splitting
- Route-level code splitting (Next.js automatic)
- Component-level: Studio (Konva), Charts (Recharts)
- Avoid importing entire icon libraries (tree-shake Lucide)

---

## 9. Performance Testing

| Tool | What | When |
|------|------|------|
| Lighthouse | FCP, LCP, CLS, TTI | Before release |
| Chrome DevTools Performance | Runtime performance, jank | During development |
| React Profiler | Re-render analysis | During development |
| Bundle Analyzer | Bundle size breakdown | Before release |
| WebPageTest | Real-world loading | Before release |

---

## 10. Performance Checklist

- [ ] Lighthouse Performance score ≥ 90
- [ ] Lighthouse Accessibility score ≥ 95
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] No layout shift on skeleton → content transition
- [ ] Studio chunk lazy-loaded
- [ ] Charts lazy-loaded
- [ ] Images lazy-loaded (below fold)
- [ ] Images optimized (WebP/AVIF)
- [ ] Animations use transform/opacity only
- [ ] Concurrent animations < 10
- [ ] Search debounced (300ms)
- [ ] Optimistic updates where applicable
- [ ] SWR caching with `keepPreviousData`
- [ ] No excessive re-renders (React Profiler)
- [ ] Bundle size within budget

---

## Cross-References

- See `07-motion-system.md` for animation tokens
- See `08-animation-principles.md` for animation guidelines
- See `19-loading-states.md` for loading strategies
- See `screen-specifications/14-screen-specifications-summary.md` for performance UX
- See `product-architecture/17-product-rules.md` PR-47 for performance rules
