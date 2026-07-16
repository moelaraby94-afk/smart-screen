# 22 — Internationalization & Localization

> **Source basis:** `src/i18n/routing.ts`, `src/i18n/request.ts`, `src/i18n/fallback.ts`, `src/i18n/time-zone.ts`, `src/app/layout.tsx`, `src/components/document-locale-root.tsx`, `src/app/[locale]/layout.tsx`, `src/middleware.ts`  

---

## 22.1 Configuration

### Routing (`src/i18n/routing.ts`)
```typescript
export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'en',
  localePrefix: 'always',
});
```

- **Supported locales:** `ar` (Arabic, RTL), `en` (English, LTR)
- **Default:** `en`
- **Prefix strategy:** `always` — every URL includes locale prefix

### Middleware (`src/middleware.ts`)
Uses `createMiddleware(routing)` from `next-intl/middleware`. Matcher:
```
matcher: ['/((?!api|_next|.*\\..*).*)']
```
Excludes: API routes, Next.js internals, static files.

---

## 22.2 Request Configuration (`src/i18n/request.ts`)

### Locale Resolution
1. `getRequestLocale()` from next-intl (reads from middleware-set header)
2. Fallback: manual detection from headers if middleware fails
3. Validates against supported locales
4. Falls back to `en` if invalid

### Message Loading
```typescript
const messages = (await import(`@/i18n/messages/${locale}.json`)).default;
```

Messages are loaded dynamically per locale. Only the current locale's messages are loaded.

### Error Handling (`src/i18n/fallback.ts`)
Custom `onError` and `getMessageFallback` handlers:
- **onError:** Logs missing key errors in development only
- **getMessageFallback:** Returns the key itself as fallback (not empty string) so missing translations are visible during development

### Time Zone (`src/i18n/time-zone.ts`)
- Default: `UTC`
- Can be overridden by workspace timezone setting
- Used for date/time formatting via next-intl's `formatDateTime`

---

## 22.3 Root Layout (`src/app/layout.tsx`)

### Locale Detection Script
Before hydration, an inline script runs:
1. Reads `NEXT_LOCALE` cookie
2. If not found, reads `Accept-Language` header
3. Sets `<html lang="{locale}">` attribute
4. Reads theme from `localStorage` (key: `theme`)
5. Sets `.dark` class on `<html>` if theme is dark

### Font Loading
```typescript
const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });
```

CSS variables set on `<body>`:
```
--font-geist-sans, --font-geist-mono, --font-cairo
```

### HTML Attributes
- `lang`: Set by locale detection script
- `dir`: Set by locale detection script (`rtl` for `ar`, `ltr` for `en`)
- `suppressHydrationWarning`: True (because of pre-hydration script)
- Font class names applied

---

## 22.4 Locale Layout (`src/app/[locale]/layout.tsx`)

### Validation
```typescript
const { locale } = await params;
if (!hasLocale(routing.locales, locale)) {
  notFound();
}
```

### Setup
1. `setRequestLocale(locale)` — sets locale for server-side rendering
2. Loads messages: `(await import(`@/i18n/messages/${locale}.json`)).default`
3. Wraps children in `NextIntlClientProvider` with messages, locale, onError, getMessageFallback, timeZone

### Provider Tree
```
NextIntlClientProvider
  └── SwrProvider
      └── WorkspaceProvider
          └── NotificationProvider
              └── {children}
              └── AppToaster
```

---

## 22.5 DocumentLocaleRoot (`src/components/document-locale-root.tsx`)

### Purpose
Client component that syncs `<html>` `lang` and `dir` attributes with the current locale from next-intl. This ensures client-side locale changes (e.g., from language switcher) update the document attributes without full page reload.

### Behavior
```typescript
useEffect(() => {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
}, [locale]);
```

---

## 22.6 Translation Usage

### Server Components
```typescript
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('namespace');
t('key');
```

### Client Components
```typescript
import { useTranslations } from 'next-intl';
const t = useTranslations('namespace');
t('key');
```

### Locale Access
```typescript
import { useLocale } from 'next-intl';
const locale = useLocale(); // 'ar' or 'en'
```

---

## 22.7 Translation Namespaces

Based on code analysis, the following translation namespaces are used:

| Namespace | Usage |
|-----------|-------|
| `authForm` | Login form labels |
| `registerPage` | Registration page |
| `forgotPasswordPage` | Forgot password page |
| `invitePage` | Invite acceptance page |
| `workspaceWelcome` | Workspace welcome screen |
| `onboardingWizard` | Onboarding wizard dialog |
| `homeOverview` | Home overview hero section |
| `clientHome` | Home dashboard sections |
| `nav` | Navigation items |
| `shell` | Shell UI (page titles, back labels, aria labels) |
| `notifications` | Notification messages and bell |
| `globalSearch` | Global search modal |
| `screensPage` | Screens page |
| `playlistsPage` | Playlists page |
| `mediaPage` | Media library page |
| `schedulesPage` | Schedules page |
| `analyticsPage` | Analytics page |
| `studioPage` | Studio page |
| `templatesPage` | Templates page |
| `aiPage` | AI tools page |
| `emergencyPage` | Emergency page |
| `teamPage` | Team page |
| `branchesPage` | Branches page |
| `settingsPages` | Settings pages |
| `auditLogPage` | Audit log page |
| `apiDocsPage` | API docs page |
| `helpPage` | Help page |
| `adminNav` | Admin navigation |
| `adminHome` | Admin home |
| `adminCustomers` | Admin customers |
| `adminStaff` | Admin staff |
| `adminUsers` | Admin users |
| `adminWorkspaces` | Admin workspaces |
| `adminFleet` | Admin fleet |
| `adminScreens` | Admin screens |
| `adminStats` | Admin stats |
| `adminLogs` | Admin logs |
| `adminSettings` | Admin settings |
| `notFound` | 404 page |
| `error` | Error boundary |

---

## 22.8 RTL Support Details

### CSS Logical Properties
The codebase consistently uses Tailwind's logical property utilities:
- `ps-*` / `pe-*` — padding-start / padding-end
- `ms-*` / `me-*` — margin-start / margin-end
- `start-*` / `end-*` — inset-start / inset-end
- `text-start` / `text-end` — text alignment

### Icon Direction
- Directional icons (arrows, chevrons) use `rtl:rotate-180` class
- Example: `<ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />`

### Component RTL Adjustments
- `ShellSidebar`: Positioned with `start-0`, slides from start side
- `OnboardingWizard`: Animation direction `dir = locale === 'ar' ? -1 : 1`
- `WorkspaceSwitcher`: Dropdown alignment `align={rtl ? 'end' : 'start'}`
- `AppToaster`: Position `top-right` for LTR, `top-left` for RTL

### Font Family
- Arabic: Cairo font (applied via `--font-cairo` CSS variable)
- English: Geist Sans (applied via `--font-geist-sans` CSS variable)
- Body font-family: `var(--font-geist-sans), var(--font-cairo), system-ui, sans-serif`

---

## 22.9 Language Switcher

### Component
`src/components/language-switcher.tsx` — dropdown menu with AR/EN options.

### Behavior
- Shows current locale with globe icon
- Selecting a locale:
  1. Uses `useRouter` from `next-intl/navigation` to navigate to the same path with new locale
  2. Sets `NEXT_LOCALE` cookie (1-year expiry)
  3. `DocumentLocaleRoot` updates `<html>` attributes

### Locations
- Auth pages (top-end corner of card)
- Shell sidebar bottom bar

---

## 22.8 [V2] UX Analysis — i18n & Localization

### Language Switcher — Micro-UX

**[V2] Two Switcher Implementations:**
There are two language switcher implementations:
1. **Auth pages**: Dropdown menu with globe icon and AR/EN options
2. **Sidebar bottom bar**: Small text button showing "EN"/"AR" (toggle, not dropdown)

The sidebar implementation is a simple toggle — clicking it switches to the other language. This is efficient for a 2-language app but wouldn't scale to 3+ languages. The auth page uses a dropdown which is more scalable.

**[V2] NEXT_LOCALE Cookie:**
The language switcher sets `NEXT_LOCALE` cookie with 1-year expiry. This persists the user's language preference across sessions. The cookie is read by Next.js middleware to determine the locale for server-side rendering.

**[V2] URL-Based Locale:**
The locale is part of the URL (`/{locale}/...`) — this is best practice for SEO and shareability. When a user shares a URL, the recipient sees the same language. However, the middleware may redirect to the recipient's preferred locale based on their `NEXT_LOCALE` cookie.

### RTL Implementation — Technical UX

**[V2] Tailwind RTL Support:**
The app uses Tailwind's logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) for RTL-aware styling. This is the correct approach — it avoids manual `rtl:` variants for most cases. However, some components still use physical properties (e.g., `translate-x-4` in the Switch component — see `05-ui-component-library.md` V2).

**[V2] `dir` Attribute:**
The `<html>` element gets `dir="rtl"` or `dir="ltr"` based on locale. This triggers the browser's built-in RTL behavior for text direction, scrollbar position, and form inputs. The `DocumentLocaleRoot` component updates this dynamically.

**[V2] RTL-Specific Issues Identified:**
1. **Switch component**: `translate-x-4` doesn't flip in RTL (see `05-ui-component-library.md` V2)
2. **Sidebar slide**: Correctly uses `translate-x-full` for RTL and `-translate-x-full` for LTR
3. **Back button**: Correctly rotates 180° in RTL
4. **Breadcrumb separator**: Correctly uses `rtl:rotate-180` on `ChevronRight`
5. **Icon alignment**: Uses `inset-inline-start-0` for active indicator bar — correct logical property

### Translation Coverage — Quality Assessment

**[V2] Translation Namespace Organization:**
The app uses `next-intl` with organized translation namespaces:
- `common` — shared UI strings
- `auth` — authentication flows
- `dashboard` — dashboard-specific strings
- `workspaceGate` — workspace gate messages
- `pageTitles` — header page titles
- `sidebar` — navigation labels
- Feature-specific namespaces (screens, playlists, etc.)

This organization is good for maintainability — translators can work on one namespace at a time.

**[V2] Missing Translation Patterns:**
- Hardcoded strings in components (should use `t()` function)
- Pluralization support (e.g., "1 screen" vs "5 screens")
- Number formatting (Arabic uses Eastern numerals ٠-٩)
- Date formatting (Hijri calendar support for Arabic)
- Currency formatting (SAR for Arabic, USD for English)

### Cross-References
- See `02-design-system-and-tokens.md` for RTL CSS variables
- See `04-layout-and-shell.md` for RTL layout behavior
- See `05-ui-component-library.md` for Switch RTL bug
- See `19-islamic-features.md` for Arabic-specific features
- See `24-accessibility-audit.md` for RTL accessibility evaluation
- See `26-consistency-audit.md` for translation consistency audit
