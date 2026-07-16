# 20 — Performance Budget

> **Status:** FINAL — Performance targets, budgets, and enforcement rules

---

## 1. Purpose

Defines the performance budgets that MUST be met. Enforced by AI Constitution (Article IV) and verified during self-audit and PR review.

---

## 2. Performance Targets

### 2.1 Core Web Vitals

| Metric | Target | Measurement | Enforcement |
|--------|--------|-------------|-------------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse | Release blocker |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse | Release blocker |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse | Release blocker |
| First Input Delay (FID) | < 100ms | Lighthouse | Release blocker |
| Time to Interactive (TTI) | < 3.5s | Lighthouse | Warning |

### 2.2 Perceived Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Route transition | < 200ms (perceived) | Manual |
| API response (with skeleton) | < 300ms (perceived) | Manual |
| Skeleton display | < 200ms after navigation | Manual |
| Toast display | < 100ms after action | Manual |
| Dialog open animation | 200ms (MI-06) | Manual |
| Hover feedback | 150ms (MI-01) | Manual |

### 2.3 Lighthouse Scores

| Category | Target | Enforcement |
|----------|--------|-------------|
| Performance | ≥ 90 | Release blocker |
| Accessibility | ≥ 95 | Release blocker |
| Best Practices | ≥ 90 | Warning |
| SEO | N/A (auth app) | — |

---

## 3. Bundle Size Budgets

| Metric | Target (gzipped) | Enforcement |
|--------|-----------------|-------------|
| Initial JS bundle (dashboard) | < 300KB | Build check |
| Per-route chunk | < 100KB | Build check |
| Studio chunk (Konva) | < 200KB | Build check (lazy-loaded) |
| Charts chunk (Recharts) | < 150KB | Build check (lazy-loaded) |
| Total CSS | < 50KB | Build check |
| Images | WebP/AVIF, lazy-loaded | Code review |

### Bundle Budget Enforcement
- **Build-time check:** `next build` reports bundle sizes
- **CI check:** Bundle size compared to budget, fails if exceeded
- **PR review:** New dependencies checked for bundle impact

---

## 4. Loading Strategy Budgets

### 4.1 Skeleton First
- [ ] Skeleton shows immediately on page load (< 200ms)
- [ ] Skeleton matches content layout (no layout shift)
- [ ] Content replaces skeleton without layout shift
- [ ] No flash of empty content before skeleton

### 4.2 SWR Caching
- [ ] `keepPreviousData: true` during revalidation
- [ ] `revalidateOnFocus: false` (avoid unnecessary refetches)
- [ ] Deduplicate identical requests
- [ ] Error retry with exponential backoff

### 4.3 Prefetching
- [ ] Route pages prefetched on link hover (desktop)
- [ ] Studio chunk prefetched on "Edit in Studio" hover
- [ ] No prefetching on mobile (save bandwidth)

### 4.4 Lazy Loading
- [ ] Studio (Konva): `next/dynamic` with `ssr: false`
- [ ] Charts (Recharts): `next/dynamic`
- [ ] Below-fold images: `loading="lazy"`
- [ ] Below-fold components: React `lazy()` (future)

---

## 5. Animation Performance Budget

### 5.1 GPU-Accelerated Properties Only
| Property | GPU Accelerated | Allowed |
|----------|----------------|---------|
| `transform` | ✅ Yes | ✅ Yes |
| `opacity` | ✅ Yes | ✅ Yes |
| `width` | ❌ No | ❌ No |
| `height` | ❌ No | ❌ No |
| `margin` | ❌ No | ❌ No |
| `padding` | ❌ No | ❌ No |
| `top`/`left` | ❌ No | ❌ No |

### 5.2 Animation Limits
- [ ] No animation > 600ms (except skeleton/spinner loops)
- [ ] Max 10 concurrent animations
- [ ] `will-change` used sparingly (only during active animation)
- [ ] `will-change` removed after animation completes
- [ ] `prefers-reduced-motion` respected (instant or fade fallback)

### 5.3 Skeleton Shimmer
- [ ] CSS gradient animation (not JavaScript)
- [ ] 1500ms loop duration
- [ ] Pauses when not visible (Intersection Observer — future)

---

## 6. Image Performance Budget

### 6.1 Format
- [ ] WebP or AVIF where supported
- [ ] Fallback to JPEG/PNG
- [ ] Next.js `<Image>` component for automatic optimization

### 6.2 Sizing
| Image Type | Max Width | Quality |
|-----------|-----------|---------|
| Media thumbnails | 400px | 80% |
| Screen card thumbnails | 400px | 80% |
| Playlist preview | 800px | 85% |
| Avatar | 128px | 80% |
| Logo | 200px | 90% |

### 6.3 Loading
- [ ] Above-fold images: `priority` (Next.js Image)
- [ ] Below-fold images: `loading="lazy"`
- [ ] Placeholder: Blur or skeleton while loading
- [ ] No layout shift during image load (aspect ratio container)

---

## 7. Data Fetching Performance Budget

### 7.1 Pagination
- [ ] Server-side pagination for lists > 20 items
- [ ] Default page size: 20 items
- [ ] No client-side pagination for large datasets

### 7.2 Debouncing
- [ ] Search input: 300ms debounce
- [ ] No debounce on inline edit (save on blur/Enter)

### 7.3 Realtime
- [ ] Socket.IO for screen status updates
- [ ] Throttle UI updates to 1/second
- [ ] Batch multiple status updates into single render

### 7.4 Caching
- [ ] SWR cache for all server data
- [ ] `dedupingInterval: 2000` (2s dedup)
- [ ] `revalidateOnFocus: false`
- [ ] `keepPreviousData: true` during pagination/filtering

---

## 8. Rendering Performance Budget

### 8.1 SSR vs CSR
- [ ] SSR: Auth pages, error pages
- [ ] CSR: Dashboard pages (behind auth, data-dependent)
- [ ] SSG: Error pages (404, 500), auth layout

### 8.2 Code Splitting
- [ ] Route-level code splitting (Next.js automatic)
- [ ] Component-level: Studio (Konva), Charts (Recharts)
- [ ] Tree-shake Lucide imports (named imports, not `import * as`)

### 8.3 Re-render Prevention
- [ ] `React.memo` for components with stable props
- [ ] `useCallback` for handlers passed to memoized children
- [ ] `useMemo` for expensive calculations
- [ ] No premature optimization (only when profiler shows issue)
- [ ] React Profiler used to verify no excessive re-renders

---

## 9. Performance Testing

| Tool | What | When |
|------|------|------|
| Lighthouse | FCP, LCP, CLS, FID, TTI, scores | CI, before release |
| Chrome DevTools Performance | Runtime performance, jank | Development |
| React Profiler | Re-render analysis | Development |
| Bundle Analyzer | Bundle size breakdown | Before release |
| WebPageTest | Real-world loading | Before release |

---

## 10. Performance Compliance Checklist

### Per-Screen
- [ ] Lighthouse Performance ≥ 90
- [ ] Lighthouse Accessibility ≥ 95
- [ ] FCP < 1.5s
- [ ] LCP < 2.5s
- [ ] CLS < 0.1
- [ ] No layout shift on skeleton → content
- [ ] Images lazy-loaded (below fold)
- [ ] Images optimized (WebP/AVIF)
- [ ] Animations use transform/opacity only
- [ ] Concurrent animations < 10
- [ ] Search debounced (300ms)
- [ ] No excessive re-renders (Profiler verified)

### Per-Build
- [ ] Initial JS bundle < 300KB (gzipped)
- [ ] Per-route chunk < 100KB (gzipped)
- [ ] Total CSS < 50KB (gzipped)
- [ ] Studio chunk lazy-loaded
- [ ] Charts chunk lazy-loaded
- [ ] No new dependencies without bundle impact check

---

## Cross-References

- See `01-ai-constitution.md` Article IV for state/performance mandates
- See `design-system-v2/46-performance-guidelines.md` for detailed guidelines
- See `design-system-v2/07-motion-system.md` for motion tokens
- See `design-system-v2/08-animation-principles.md` for animation rules
- See `16-screen-compliance-checklist.md` §12 for screen performance
- See `22-self-audit-process.md` for self-audit
- See `product-architecture/17-product-rules.md` PR-47 for performance rules
