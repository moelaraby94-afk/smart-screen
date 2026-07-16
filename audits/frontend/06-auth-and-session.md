# 06 — Authentication, Session & Auth Flows

> **Source basis:** `src/features/auth/session.ts`, `src/features/auth/auth-api.ts`, `src/features/auth/login-form.tsx`, `src/features/auth/register-client.tsx`, `src/features/auth/forgot-password-client.tsx`, `src/lib/server-auth.ts`, `src/app/[locale]/(auth)/**/page.tsx`, `src/app/[locale]/(shell)/admin/layout.tsx`  

---

## 6.1 Session Architecture

### Token Storage Strategy

| Storage | Key | Scope | Production | Dev |
|---------|-----|-------|------------|-----|
| httpOnly cookie | `cs_access_token` | Set by backend | ✅ Primary | ✅ |
| localStorage | `cs_access_token` | Client | ❌ Never | ✅ Dev convenience |
| Non-httpOnly cookie | `cs_access_mirror` | Client | ❌ Never | ✅ Dev convenience |
| sessionStorage | `cs_super_admin` | Client | ✅ Hint only | ✅ |
| Cookie | `cs_workspace_id` | Client | ✅ 30-day expiry | ✅ |

### Key Design Decisions
1. **Production:** JWT is NEVER stored in localStorage — only httpOnly cookie. `apiFetch` sends `credentials: 'include'` so the browser attaches the cookie automatically.
2. **Dev only:** localStorage mirror + non-httpOnly cookie allow cross-origin setups (dashboard on :3000, API on :4000) where SameSite rules interfere.
3. **`||` not `??`:** Empty string env vars must fall back, not win. This is explicitly documented in code comments.

---

## 6.2 API Fetch Layer (`src/features/auth/session.ts`)

### `apiFetch(path, init, retry)` — Core Request Function

#### Request Preparation
1. Extracts `omitAuth` flag from init
2. Sets `Content-Type: application/json` unless body is `FormData`
3. Attaches `Authorization: Bearer {token}` if localStorage token exists (dev only)
4. For mutating methods (POST/PUT/PATCH/DELETE):
   - Exempt paths: `/auth/login`, `/auth/register/*`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/refresh`, `/auth/dev-login`
   - If no bearer token: fetches CSRF token from `GET /csrf`, attaches as `X-CSRF-Token` header
5. Sends with `credentials: 'include'`

#### Response Handling

**403 on mutating request:**
- CSRF token likely expired
- Clears cached CSRF, fetches new one
- Retries request once (retry=false on second attempt)

**401 on any request:**
- Attempts token refresh: `POST /auth/refresh` with `credentials: 'include'`
- If refresh succeeds: stores new access token, retries original request once
- If refresh fails:
  - Clears stored access token and CSRF cache
  - If not already on `/login`: redirects to `/{locale}/login?returnTo={encodedPath}`
  - If the failing request was `POST /workspaces`: marks `cs_pending_workspace_create` in localStorage so the workspace creation flow can resume after re-login

### CSRF Token Management
- Cached in module-level variable `cachedCsrfToken`
- Fetched from `GET /csrf` endpoint
- Cleared on 403 retry and on 401 logout
- Only attached when no bearer token (cookie-based auth needs CSRF; bearer-based auth doesn't)

---

## 6.3 Auth API Functions (`src/features/auth/auth-api.ts`)

| Function | Method | Path | Body | omitAuth |
|----------|--------|------|------|----------|
| `login(email, password)` | POST | `/auth/login` | `{ email, password }` | Yes |
| `login2fa(email, password, twoFactorToken)` | POST | `/auth/login-2fa` | `{ email, password, twoFactorToken }` | Yes |
| `devLogin()` | POST | `/auth/dev-login` | — | Yes |
| `registerStart(data)` | POST | `/auth/register/start` | `data` | No |
| `registerVerify(email, code)` | POST | `/auth/register/verify` | `{ email, code }` | No |
| `registerResend(email)` | POST | `/auth/register/resend` | `{ email }` | No |
| `forgotPassword(email)` | POST | `/auth/forgot-password` | `{ email }` | Yes |
| `resetPassword(data)` | POST | `/auth/reset-password` | `data` | Yes |
| `logout()` | POST | `/auth/logout` | `'{}'` | No |

---

## 6.4 Login Flow (`src/features/auth/login-form.tsx`)

### Component State
| State | Type | Purpose |
|-------|------|---------|
| `email` | `string` | Email input |
| `password` | `string` | Password input |
| `pending` | `boolean` | Submit in progress |
| `error` | `string \| null` | Error message |
| `needsTwoFactor` | `boolean` | Switch to 2FA form |
| `twoFactorToken` | `string` | 2FA code input |

### Flow

1. **User enters email + password, clicks Sign In**
2. Clears any existing stored token
3. Calls `POST /auth/login`
4. If response not OK: reads error envelope via `readApiError()`, maps to localized message via `useApiErrorMessage()`, shows error + toast
5. If response includes `requiresTwoFactor: true`:
   - Switches to 2FA form
   - User enters 6-8 digit code
   - Calls `POST /auth/login-2fa` with email, password, and code
6. On success: calls `applyAuthSuccess(payload)`
   - Stores access token (dev only)
   - Sets workspace ID from first workspace
   - Calls `refreshWorkspaces()` to update context
   - Shows success toast
   - Determines redirect:
     - If `returnTo` query param and is safe path: redirect there
     - If super-admin: redirect to `/{locale}/overview`
     - If has workspace: redirect to `/{locale}/overview`
     - Otherwise: redirect to `/{locale}` (will show workspace welcome)
   - Calls `router.push(dest)` and `router.refresh()`

### Dev Login
- Only visible when `NODE_ENV === 'development'` or `NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'`
- Shows dashed border box with "Debug dev only" label
- Calls `POST /auth/dev-login` (seeds test user)
- Same success handling as regular login

### 2FA Form
- Input: `type="text"`, `maxLength={8}`, `autoComplete="one-time-code"`, centered, monospace, tracking-widest
- Submit button disabled until token length ≥ 6
- "Back to login" link to return to email/password form

### Form Styling
- Input class: `h-11 rounded-xl border border-border bg-card text-[15px]` with primary-tinted focus ring
- Submit button: `variant="cta"`, full width, `h-11`, rounded-xl
- Links: forgot password (primary color), create account (muted)

---

## 6.5 Registration Flow (`src/features/auth/register-client.tsx`)

### Multi-Step Process
1. **Step 1 (Start):** User enters full name, email, password, business name, country, phone
   - Calls `POST /auth/register/start`
   - On success: advances to verification step
2. **Step 2 (Verify):** User enters email verification code
   - Calls `POST /auth/register/verify`
   - On success: same as login success (store token, set workspace, redirect)
   - "Resend code" button calls `POST /auth/register/resend`

### Validation
- Uses Zod schemas for form validation
- Country selection from `COUNTRIES` list (`src/lib/countries.ts`) with flag emojis and dial codes
- `guessCountryCode()` auto-selects country from `navigator.language`

---

## 6.6 Forgot Password Flow (`src/features/auth/forgot-password-client.tsx`)

1. User enters email
2. Calls `POST /auth/forgot-password`
3. On success: shows confirmation message
4. User checks email for reset link
5. Reset link navigates to a reset page (not in this codebase — likely handled by backend or separate route)

---

## 6.7 Server-Side Auth (`src/lib/server-auth.ts`)

### `fetchAuthMeServer()`
- Used in server components/layouts (RSC)
- Reads all cookies from `cookies()` API
- Sends `GET {API_BASE}/auth/me` with `Cookie` header
- Returns `{ authenticated: boolean, isSuperAdmin: boolean }`
- On error: logs to `console.error` (bypasses `dev-log` which is dev-only) and returns unauthenticated

### API Base URL Resolution (Server)
1. `INTERNAL_API_BASE_URL` (Docker service hostname)
2. `NEXT_PUBLIC_API_BASE_URL` (browser URL)
3. `http://localhost:4000/api/v1` (fallback)

Uses `||` not `??` — empty string must not win.

---

## 6.8 Auth Page Layouts

### Auth Group Layout (`src/app/[locale]/(auth)/layout.tsx`)
```tsx
<div className="min-h-screen bg-muted/30 text-foreground">{children}</div>
```

### Login Page (`src/app/[locale]/(auth)/login/page.tsx`)
- Centered card: `max-w-md`, `rounded-xl border border-border bg-card p-8 shadow-sm`
- Brand title + description at top
- `LanguageSwitcher` in top-end corner
- `Suspense` boundary around `LoginForm` (for `useSearchParams` SSR)
- Below card: register link, privacy/terms links

### Register Page (`src/app/[locale]/(auth)/register/page.tsx`)
- Centered card: `max-w-lg` (wider than login)
- Same structure as login with `RegisterClient` in Suspense

### Forgot Password Page (`src/app/[locale]/(auth)/forgot-password/page.tsx`)
- Centered card: `max-w-md`
- Same structure with `ForgotPasswordClient`

### Invite Page (`src/app/[locale]/(auth)/invite/page.tsx`)
- Centered card: `max-w-md`
- `InviteAcceptClient` in Suspense

### Privacy/Terms Pages
- Full-width text pages: `max-w-2xl`, `px-6 py-16`
- Kicker label, title, lead paragraph, body paragraphs
- "Back to Login" link at bottom

---

## 6.9 Logout Flow

### From UserMenu (`src/components/user-menu.tsx`)
1. Calls `POST /auth/logout`
2. Clears `cs_access_token` from localStorage via `setStoredAccessToken(null)`
3. Clears `cs_access_mirror` cookie
4. Shows toast notification
5. Redirects to `/{locale}/login`

### From ShellSidebar Bottom Bar
1. Calls `POST /auth/logout`
2. Clears stored token
3. Shows toast
4. Redirects to `/{locale}/login`

---

## 6.10 Session Recovery

### On Page Load (WorkspaceProvider)
1. `WorkspaceProvider` calls `refreshWorkspaces()` on mount
2. `refreshWorkspaces()` calls `GET /auth/me` via `fetchCurrentUser()`
3. If 401/403: resets to logged-out state
4. If success: sets `isAuthenticated`, `isSuperAdmin`, user info, workspaces list
5. Selects active workspace: preferred from arg → cookie → first workspace

### On 401 During API Call
- `apiFetch` intercepts 401 responses
- Attempts `POST /auth/refresh`
- If refresh succeeds: retries original request
- If refresh fails: clears tokens, redirects to login with `returnTo` param

---

## 6.11 Admin Auth Guard

### Server-Side (`src/app/[locale]/(shell)/admin/layout.tsx`)
1. Calls `fetchAuthMeServer()`
2. If not authenticated: `redirect('/{locale}/login?returnTo=/{locale}/admin')`
3. If not super-admin: `redirect('/{locale}/overview')`
4. If authorized: renders `AdminSectionShell` with children

### Client-Side (SuperAdminGuard)
`src/features/admin/super-admin-guard.tsx` — additional client-side guard for admin components.

---

## 6.12 Impersonation

### Detection
- `WorkspaceProvider` reads `impersonatedBy` from `/auth/me` response
- Sets `impersonatedBySuperAdminId` in context
- `CrystalShell` renders `ImpersonationReturnButton` when this is set

### Impersonation Return
`src/features/admin/impersonation-return-button.tsx` — floating button that allows super-admin to return to their admin session. Calls API to end impersonation and redirects to admin panel.

---

## 6.13 [V2] UX Analysis — Authentication Flows

### Login Flow — HCI Evaluation

**[V2] Token Clearing Before Login:**
At `login-form.tsx:77`, the form calls `setStoredAccessToken(null)` before making the API call. This means if the login attempt fails, any previously stored token is already cleared. If the user was logged in on another tab and the login fails, they're now logged out. This is a minor edge case but could confuse users who have multiple tabs open.

**[V2] No Password Visibility Toggle:**
The password input (`type="password"`) has no visibility toggle button. Users cannot verify they've typed the correct password before submitting. This is a common UX pattern in modern auth forms and its absence is a minor usability issue, especially on mobile where autocorrect can change typed characters.

**[V2] Email Field Type:**
The email input uses `type="text"` (not `type="email"`) with `autoComplete="username"`. Using `type="text"` prevents mobile keyboard from showing the `@` key prominently. However, `autoComplete="username"` is correct for autofill. The lack of `type="email"` also means no native HTML5 email validation — validation is handled by the API.

**[V2] 2FA Input UX:**
The 2FA input is well-designed:
- `type="text"` (not `type="number"`) — avoids numeric keyboard issues on mobile
- `maxLength={8}` — allows 6-8 digit codes
- `autoComplete="one-time-code"` — triggers SMS OTP autofill on mobile
- `text-center font-mono text-lg tracking-widest` — monospace, centered, wide tracking for easy code entry
- Submit disabled until `length >= 6` — prevents incomplete submission
- "Back to login" link — allows returning to email/password form

**[V2] 2FA Flow — No Remember Device Option:**
There is no "remember this device" or "trust this browser" option after 2FA. Users will be prompted for 2FA on every login from any device. For enterprise users who log in daily, this adds friction. The `cs_access_token` in httpOnly cookie has a backend-controlled expiry — the frontend cannot extend it.

**[V2] Error Display — Dual Channel:**
Login errors are shown both inline (`<p className="text-sm text-destructive">`) and as a toast (`toast.error(message)`). This dual-channel approach ensures users see the error regardless of their attention focus. However, the toast may auto-dismiss before the user reads it, while the inline error persists.

**[V2] Dev Login Visibility:**
The dev login box is shown when `NODE_ENV === 'development'` OR `NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true'`. The env var check means dev login could be accidentally enabled in production if `NEXT_PUBLIC_ENABLE_DEV_LOGIN` is set. The box is visually distinct (dashed border, primary tint) which helps prevent confusion, but it's a security concern if accidentally enabled.

### Registration Flow — UX Analysis

**[V2] Multi-Step Without Progress Indicator:**
The registration flow has two steps (Start → Verify) but no visible progress indicator. Users don't know how many steps remain. Compare with the OnboardingWizard which has a 2-step progress bar. The registration form should have similar progress indication.

**[V2] Verify Step — No Back Button:**
Once the user advances to the verification step, there is no way to go back to edit their registration details. If they made a typo in their email, they must refresh the page and start over. This is a **moderate UX issue** — users are trapped in step 2.

**[V2] Resend Code — No Cooldown:**
The "Resend code" button calls `POST /auth/register/resend` with no visible cooldown timer. Users can spam the resend button, potentially flooding their email. Best practice is a 30-60 second cooldown with a visible countdown.

### Forgot Password Flow — UX Analysis

**[V2] No Reset Page in Frontend:**
The audit notes that the reset page is "not in this codebase." The forgot password flow sends a reset link, but the frontend doesn't have a `/reset-password` page. This means:
1. The reset link likely points to a backend-hosted page, or
2. The reset link points to a route that doesn't exist yet, or
3. The reset flow is handled externally

This is a **gap in the user journey** — users who click the reset link may encounter a 404 or a non-branded backend page.

**[V2] No Email Field Validation:**
The forgot password form likely accepts any text input. Without client-side email validation, users could submit invalid emails and receive a generic "check your email" message, never receiving the reset link.

### Session Recovery — Edge Cases

**[V2] Race Condition — Multiple 401s:**
If multiple API calls fail with 401 simultaneously (e.g., page load triggers 3 parallel fetches), each will attempt a token refresh. There is no mutex/lock on the refresh operation. The first 401 triggers a refresh, subsequent 401s also trigger refreshes. If the first refresh succeeds, the subsequent refreshes may fail (old refresh token) and redirect to login. This is a known pattern issue with token refresh — the fix would be to queue refresh attempts.

**[V2] Pending Workspace Create Recovery:**
When a 401 occurs during `POST /workspaces`, the code sets `cs_pending_workspace_create` in localStorage. After re-login, `WorkspaceWelcome` checks this flag and auto-opens the create dialog. This is a thoughtful recovery mechanism — but it only works for workspace creation, not for other interrupted operations (e.g., creating a playlist, uploading media).

**[V2] ReturnTo Path Safety:**
The `returnTo` query parameter is validated: `returnTo.startsWith('/') && !returnTo.startsWith('//')`. This prevents open redirect attacks (e.g., `returnTo=//evil.com`). Good security practice.

### Logout Flow — UX Analysis

**[V2] Silent Logout from Sidebar:**
As noted in `04-layout-and-shell.md`, the sidebar logout does NOT show a success toast. The user clicks logout and is immediately redirected to the login page. This violates **Visibility of System Status** — the user doesn't know if the logout was intentional or if their session expired.

**[V2] No "Are You Sure?" Confirmation:**
Neither the sidebar nor the user menu logout asks for confirmation. A misclick on the logout button immediately logs the user out. For a SaaS product where users may have unsaved work, this is a minor risk. However, confirmation dialogs for logout are generally considered unnecessary friction — most modern SaaS products don't confirm logout.

**[V2] Logout Failure — No Recovery:**
If the logout API call fails, the sidebar shows an error toast but doesn't redirect. The user remains on the current page, still logged in. They must click logout again. The user menu logout (from `user-menu.tsx`) has similar behavior.

### Admin Auth Guard — Edge Cases

**[V2] Server-Side Guard — No Loading State:**
The admin layout guard uses `redirect()` from Next.js, which happens during server rendering. If `fetchAuthMeServer()` is slow, the entire page load is delayed. There is no streaming or suspense boundary — the user sees a blank page until the auth check completes.

**[V2] Client-Side Guard — Flash of Content:**
The `SuperAdminGuard` client component is an additional check. If the server guard passes but the client guard hasn't checked yet, there may be a brief flash of admin content before the client guard renders. This is unlikely to cause issues since both guards check the same condition, but it's worth noting.

### [V2] Nielsen Heuristic Evaluation — Auth

| Heuristic | Score | Notes |
|-----------|-------|-------|
| Visibility of system status | ⚠️ Medium | Silent logout, no 2FA remember, loading state on server guard |
| User control and freedom | ⚠️ Medium | No back button on registration verify step, no password visibility toggle |
| Consistency and standards | ✅ Good | Standard auth patterns, proper autocomplete attributes |
| Error prevention | ⚠️ Medium | No email validation on forgot password, no resend cooldown |
| Recognition rather than recall | ✅ Good | 2FA input uses one-time-code autocomplete, labels are clear |
| Flexibility and efficiency | ⚠️ Medium | Dev login is efficient for testing, no SSO/SAML for enterprise |
| Security | ✅ Good | httpOnly cookies, CSRF tokens, returnTo validation, token refresh |

### Cross-References
- See `04-layout-and-shell.md` for sidebar logout button implementation
- See `07-workspace-management.md` for workspace context and session recovery
- See `23-error-handling-and-states.md` for error handling patterns
- See `27-user-flows.md` for complete auth user journey analysis
- See `24-accessibility-audit.md` for auth form accessibility evaluation
