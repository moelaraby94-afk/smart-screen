# Audit 08: i18n & RTL Support

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Internationalization architecture, translation coverage, RTL implementation, locale routing

---

## 1. i18n Architecture

### 1.1 Technology

- **Library**: `next-intl` (Next.js App Router integration)
- **Locales**: `en`, `ar`
- **Default locale**: `en`
- **Routing**: `/[locale]/...` path-based locale routing

### 1.2 Configuration

```
i18n/
├── messages/
│   ├── en.json    (2487 bytes — ~127 top-level keys)
│   └── ar.json    (Arabic translations)
├── fallback.ts    (Missing translation marker + English fallback)
└── request.ts     (next-intl request config)
```

### 1.3 Translation Hook Usage

Components use `useTranslations('namespace')` from `next-intl`:
```typescript
const t = useTranslations('clientHome');
const tWs = useTranslations('clientHome.workspaceSummary');
```

**Coverage**: `useTranslations` is used across most feature components ✅

---

## 2. Translation Coverage

### 2.1 Namespaces in `en.json`

| Namespace | Keys | Coverage |
|-----------|------|----------|
| `app` | 2 | ✅ |
| `nav` | 50+ | ✅ Comprehensive |
| `shell` | 30+ | ✅ Page titles, back labels |
| `clientHome` | 20+ | ✅ Dashboard sections |
| `homeOverview` | 5 | ✅ |
| `adminOverview` | 15+ | ✅ Admin dashboard |
| `workspaceWelcome` | 8 | ✅ |
| `prayerSettings` | 10+ | ✅ (added in audit) |
| `ramadanSettings` | 10+ | ✅ |
| (others) | — | Needs verification |

### 2.2 Missing Translation Patterns

#### Hardcoded Strings (Should Use i18n)

1. **`error.tsx` (locale-level and shell-level)**:
   ```typescript
   {isArabic ? 'حدث خطأ أثناء تحميل الصفحة' : 'Failed to load page'}
   {isArabic ? 'يرجى المحاولة مرة أخرى' : 'Please try again'}
   {isArabic ? 'إعادة المحاولة' : 'Try again'}
   ```
   **Issue**: Inline ternary instead of `useTranslations`. The `isArabic` check uses `document.documentElement.lang` which is fragile.

2. **`not-found.tsx`**:
   ```typescript
   {isAr ? 'الصفحة غير موجودة' : 'Page not found'}
   {isAr ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.' : 'The page...'}
   {isAr ? 'العودة للرئيسية' : 'Back to overview'}
   ```
   **Issue**: Same inline ternary pattern.

3. **Invite URL locale**: `workspaces.service.ts` hardcodes `/en/` in invite URLs:
   ```typescript
   inviteUrl = `${base}/en/team`
   inviteUrl = `${base}/en/invite?token=${token}`
   ```
   **Issue**: Doesn't respect invitee's locale preference.

### 2.3 Fallback Strategy

**`fallback.ts`** implements a locale-aware fallback:
- For `en`: Falls back to English dictionary string
- For non-`en`: Shows `[missing:namespace.key]` marker

**Strength**: Missing translations are visible during QA, not silently falling back to English ✅  
**Issue**: The `[missing:...]` marker could ship to production if a key is missing in `ar.json`.

---

## 3. RTL Implementation

### 3.1 CSS Approach

The project uses **logical CSS properties** via TailwindCSS:
- `ms-` / `me-` → `margin-inline-start` / `margin-inline-end`
- `ps-` / `pe-` → `padding-inline-start` / `padding-inline-end`
- `start-` / `end-` → `inset-inline-start` / `inset-inline-end`
- `text-start` / `text-end` → `text-align: start` / `text-align: end`

### 3.2 RTL Features ✅

| Feature | Implementation | Status |
|---------|---------------|--------|
| `dir="rtl"` on `<html>` | `document-locale-root.tsx` | ✅ |
| Sidebar position | `lg:ms-[240px]` (flips in RTL) | ✅ |
| Skip-to-content link | `focus:start-4` | ✅ |
| Gradient mesh | `-start-20 -top-20` (logical) | ✅ |
| Icon spacing | `me-2` (margin-inline-end) | ✅ |
| Back button arrow | Likely auto-flips with `dir` | ✅ |
| Breadcrumbs | RTL-aware in `Breadcrumbs` component | ✅ |

### 3.3 RTL Issues

1. **Framer Motion `x` animations**: `initial={{ x: -20 }}` doesn't flip in RTL. The animation will slide from left even in Arabic. Should use conditional values or CSS transforms.

2. **`AdminOverview` formatDuration**: `return '${nf.format(days)}d ${nf.format(hours)}h ${nf.format(minutes)}m'` — uses Latin abbreviations (d/h/m) even in Arabic. Should use Arabic time units.

3. **`formatUsd`**: Formats as `$X,XXX.XX` — no locale-aware currency formatting. Should use `Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' })`.

4. **Number formatting**: Some places use `new Intl.NumberFormat(locale)` ✅, but others may use raw numbers without locale formatting.

---

## 4. Locale Routing

### 4.1 Route Structure

```
/[locale]/login
/[locale]/overview
/[locale]/admin/customers
```

### 4.2 Locale Detection

- **Middleware**: `middleware.ts` handles locale negotiation (not audited in detail)
- **Default**: Falls back to `en` if no locale in path
- **Cookie**: Likely stores preferred locale

### 4.3 Language Switcher

`language-switcher.tsx` (2482 bytes) — provides EN/AR toggle ✅

### 4.4 Routing Issues

1. **No locale persistence**: When a user switches locale, all routes change. Deep links with a specific locale should work but may redirect if the user's preferred locale differs.

2. **API responses not localized**: Backend error messages are in English. The frontend handles translation via error codes, but some messages may pass through raw.

---

## 5. Arabic-Specific Features (Phase 9)

### 5.1 Prayer Times Widget

- Fetches prayer times from Aladhan API ✅
- Displays in workspace timezone ✅
- Auto-refresh countdown (added in audit) ✅
- Configurable enabled prayers ✅
- RTL-aware layout ✅

### 5.2 Ramadan Mode

- Configurable start/end dates ✅
- Special content scheduling ✅
- Auto-pause during prayer times (config flag exists) ⚠️ (not fully implemented)

### 5.3 Hijri Calendar

- Backend endpoint exists ✅
- No dedicated widget in dashboard ⚠️
- Player app may display Hijri date ⚠️

---

## 6. Translation File Analysis

### 6.1 `en.json` Structure

```json
{
  "app": { "title": "Cloud Signage", "subtitle": "..." },
  "nav": { "overview": "Overview", "screens": "Screens", ... },
  "shell": { "pageTitles": { "overview": "Overview", ... } },
  "clientHome": { "workspaceSummary": { ... }, ... },
  "prayerSettings": { "title": "Prayer Settings", ... },
  "ramadanSettings": { "title": "Ramadan Mode", ... }
}
```

### 6.2 `ar.json` Coverage

The Arabic translation file should mirror all keys in `en.json`. Without a full diff, the following are likely missing or incomplete:

1. **`prayerSettings`**: Added in audit — should be verified in `ar.json`
2. **`ramadanSettings`**: Added in audit — should be verified in `ar.json`
3. **Admin section keys**: Large namespace — high risk of missing translations
4. **Error messages**: May not have Arabic translations (since errors use inline ternaries instead of i18n)

### 6.3 i18n Script

The root `package.json` has an i18n check script:
```json
"i18n:check": "node scripts/i18n-check.js"
```

**Issue**: This script exists but it's unclear if it's run in CI or pre-commit. It should catch missing keys automatically.

---

## 7. Identified Issues

### High
1. **Hardcoded Arabic in error/404 pages**: Should use `useTranslations` instead of inline ternaries.
2. **Hardcoded `/en/` in invite URLs**: Doesn't respect invitee's locale.
3. **`ar.json` completeness unknown**: Need to run `i18n:check` script to verify all keys are translated.
4. **Framer Motion RTL**: Animations don't flip in RTL.

### Medium
1. **Time unit abbreviations**: `d/h/m` in `formatDuration` are Latin, not Arabic.
2. **Currency formatting**: `formatUsd` doesn't use `Intl.NumberFormat` with locale.
3. **No API error localization**: Backend error messages are English-only.
4. **No locale persistence verification**: Deep linking behavior needs testing.

### Low
1. **Missing Hijri calendar widget**: Phase 9 feature not fully implemented.
2. **No auto-pause at prayer times**: Config flag exists but no service logic.
3. **i18n check script not verified in CI**: May not catch missing translations automatically.

---

## 8. Strengths

- `next-intl` with App Router — modern i18n solution
- Logical CSS properties for RTL (not `left`/`right` hacks)
- Locale-aware fallback strategy with visible missing markers
- Language switcher component
- Path-based locale routing
- Prayer times and Ramadan mode features (Phase 9)
- `useTranslations` used across most components
- Comprehensive `nav` and `shell` translation namespaces
- i18n check script exists (needs CI integration)

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

**Corrections:**
- §6.3 / §7 "i18n check script … unclear if run in CI" → **it IS in CI.** `ci.yml` runs
  `npm run verify`, which includes `npm run i18n:check` (key-parity + hardcoded-scan +
  missing-marker-scan). Missing keys and hardcoded strings fail the build.
- §5.2 Ramadan/prayer "auto-pause during prayer times (not fully implemented)" →
  the **backend** part IS implemented and exposed (`GET /islamic/prayer-pause-status`,
  `checkPrayerPause()`); the gap is the **player** not consuming it (file 00 C1).

**Confirmed-true (keep):** hardcoded Arabic ternaries in `error.tsx`/`not-found.tsx`,
hardcoded `/en/` in invite URLs, Hijri calendar **widget** genuinely missing (only
`prayer-times-widget.tsx` + `prayer-config-panel.tsx` exist).

**Addition (security):** `next-intl` has a **Moderate open-redirect CVE** — file 14 §1.1.
Given locale-based redirects, patch it.
