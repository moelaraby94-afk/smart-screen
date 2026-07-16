# Screen Specifications — Authentication & Error Pages

> **Evidence basis:** `ux-blueprint/06-auth-ux-blueprint.md`, `user-flow-architecture/06-auth-flows.md`, `product-architecture/17-product-rules.md` PR-01–PR-10, `information-architecture/06-page-catalog.md` P-AU-01–P-AU-03
> **Purpose:** Screen specs for Login, Register, Forgot Password, 404, Permission Denied, and Error Boundary

---

## SCR-AUTH-01: Login

### Screen ID
SCR-AUTH-01

### Purpose
Authenticate user and redirect to workspace.

### Business Goal
User access to platform; daily entry point.

### User Goal
Get into the application quickly.

### Primary Users
All users (unauthenticated).

### Permissions
Public page — no authentication required.

### Entry Points
- Direct URL `/login`
- Redirect from session expiry
- Redirect from 401 API response
- "Sign In" link on Register page

### Exit Points
- Successful login → `/overview` (or `/welcome` if multiple workspaces)
- "Register" link → `/register`
- "Forgot Password" link → `/forgot-password`

### Navigation
No sidebar, no header — standalone page.

### Page Title
`Sign In — Cloud-Screen`

### Page Description
Centered card with email/password form, brand logo, and links to register and forgot password.

### Primary CTA
"Sign In" button (full width, default variant).

### Secondary CTA
"Register" link (below form).

### Danger Actions
None.

---

## Layout

### Grid
- Full viewport, centered card
- Card: `max-w-[400px]`, centered horizontally and vertically
- Background: `bg-muted/20` (subtle gradient or pattern)

### Container
- `min-h-screen flex items-center justify-center px-4`

### Spacing
- Card padding: `p-8`
- Form field gap: `gap-4`
- Button gap: `gap-3` (Sign In + secondary links)

### Visual Hierarchy
1. Brand logo (top, centered)
2. "Sign In" heading
3. Email field
4. Password field (with show/hide toggle)
5. "Sign In" button
6. "Forgot Password" link
7. "Register" link

### Page Sections
1. **Brand header:** Logo + "Cloud-Screen" text
2. **Form card:** Email, password, submit
3. **Secondary links:** Forgot password, register

### Sticky Elements
None.

### Scrollable Areas
None (fits in viewport on desktop; scrolls on mobile if keyboard opens).

---

## Component Tree

```
<AuthLayout>
  <BrandHeader>
    <Logo />
    <BrandName text="Cloud-Screen" />
  </BrandHeader>
  <AuthCard>
    <Heading level={2}>Sign In</Heading>
    <Form onSubmit={handleSubmit}>
      <FormField name="email" label="Email" required>
        <Input type="email" placeholder="you@example.com" autoComplete="email" />
      </FormField>
      <FormField name="password" label="Password" required>
        <PasswordInput placeholder="••••••••" autoComplete="current-password" />
      </FormField>
      {error && <FormError message={error} />}
      <Button type="submit" variant="default" fullWidth disabled={isLoading}>
        {isLoading ? <Spinner /> : "Sign In"}
      </Button>
    </Form>
    <Divider />
    <AuthLinks>
      <Link href="/forgot-password">Forgot Password?</Link>
      <Link href="/register">Don't have an account? Register</Link>
    </AuthLinks>
  </AuthCard>
</AuthLayout>
```

### Component Details

#### AuthLayout
- **Type:** Shared layout for auth pages
- **Props:** `children: ReactNode`
- **Background:** `bg-muted/20` with optional brand pattern

#### AuthCard
- **Type:** Shared component for auth pages
- **Props:** `children: ReactNode`
- **Styling:** `bg-card border border-border rounded-xl shadow-sm p-8`

#### PasswordInput
- **Type:** Input with show/hide toggle
- **Props:** Standard input props + `showToggle: boolean = true`
- **Toggle:** Eye icon button inside input (right side)
- **State:** `showPassword: boolean` (local state)
- **Accessibility:** Toggle button has `aria-label="Show password"` / `"Hide password"`

---

## Responsive

### Desktop (≥ 768px)
- Card centered, `max-w-[400px]`
- Full keyboard interaction

### Mobile (< 768px)
- Card full width, `mx-4`
- `px-4` outer padding
- Form inputs `text-base` (prevents iOS zoom)
- Submit button full width, `h-12` (44px touch target)

### Minimum Width
320px.

---

## States

### Loading
- Submit button: spinner + "Signing in..." text
- Button disabled during loading
- Inputs remain visible but not focusable

### Error
- **Invalid credentials:** Inline error below form: "Invalid email or password" (red text, `text-destructive`)
- **Network error:** Toast: "Network error. Check your connection."
- **Account suspended:** Inline error: "Your account has been suspended. Contact support."
- **2FA required:** (Future) Additional input field appears for 6-digit code

### Success
- Redirect to `/overview` (no success toast — redirect is immediate)

### Offline
- Submit fails → toast: "Connection lost. Try again."
- Auto-retry not applicable (user must retry manually)

---

## Interactions

| Interaction | Element | Behavior |
|-------------|---------|----------|
| Click | "Sign In" | Submit form |
| Enter | Any input | Submit form |
| Click | Eye toggle | Show/hide password |
| Focus | Input | Focus ring visible |
| Tab | — | Email → Password → Eye toggle → Sign In → Forgot Password → Register |

---

## Forms

### Validation
| Field | Rule | When | Message |
|-------|------|------|---------|
| Email | Required | On submit | "Email is required" |
| Email | Valid format | On blur | "Please enter a valid email" |
| Password | Required | On submit | "Password is required" |

### Submit
- API: `POST /auth/login` with `{ email, password }`
- On success: Store JWT in cookie, redirect
- On 401: Show inline error
- On 403: Show suspended message
- On 500/network: Show toast

### Unsaved Changes
N/A (no data to lose — credentials are ephemeral).

---

## Feedback

| Event | Feedback |
|-------|----------|
| Submit loading | Button spinner + disabled |
| Invalid credentials | Inline error (red) |
| Network error | Toast (destructive) |
| Success | Redirect (no toast) |

---

## Accessibility

| Element | Rule |
|---------|------|
| Form | `<form>` with `aria-label="Sign in form"` |
| Inputs | `<label>` associated with each input |
| Error | `role="alert"` `aria-live="assertive"` |
| Button | `aria-busy="true"` during loading |
| Focus | Auto-focus on email field on mount |
| Contrast | All text meets 4.5:1 |
| Touch targets | Button ≥ 44px height |

---

## Performance UX

| Concern | Strategy |
|---------|----------|
| Page load | Static page, no data fetch — instant render |
| Redirect | `router.replace()` (no back button to login) |
| Prefetch | Prefetch `/overview` on form focus (future) |

---

## API Requirements

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/auth/login` | POST | Authenticate | `{ email, password }` → `{ token, user, workspaceId }` |

### Backend Limitations
- No refresh token mechanism (token expires after fixed period)
- No "remember me" functionality
- 2FA verification is separate endpoint (future)

### Missing APIs
- `POST /auth/verify-2fa` — 2FA code verification (future, FL-AUTH-01 AP-1)

---

## Acceptance Criteria

### Functional
- [ ] Email and password fields accept input
- [ ] Submit sends credentials to API
- [ ] Valid credentials redirect to Overview
- [ ] Invalid credentials show inline error
- [ ] Password toggle shows/hides text
- [ ] "Forgot Password" link navigates to forgot password page
- [ ] "Register" link navigates to register page

### UX
- [ ] Form submits on Enter key
- [ ] Email field auto-focused on page load
- [ ] Error messages are user-friendly (no technical jargon)
- [ ] Button shows loading state during submit
- [ ] No layout shift during loading

### Accessibility
- [ ] All inputs have associated labels
- [ ] Error message announced via `aria-live`
- [ ] Keyboard navigable (Tab order logical)
- [ ] Password toggle has `aria-label`

### Performance
- [ ] Page renders < 200ms
- [ ] API call completes < 2s
- [ ] Redirect < 500ms after success

### Responsive
- [ ] Card centered on desktop
- [ ] Card full-width on mobile
- [ ] No horizontal scroll at 320px
- [ ] Inputs use `text-base` to prevent iOS zoom

---

## Current Problems
| ID | Problem | Impact |
|----|---------|--------|
| LP-01 | No password visibility toggle | Users can't verify password |
| LP-02 | No "remember me" option | Users must log in every session |
| LP-03 | No 2FA support | Security gap for enterprise |

## Technical Debt
| ID | Debt | Impact |
|----|------|--------|
| LTD-01 | No refresh token | Session expires without warning |
| LTD-02 | No SSO/SAML | Enterprise blocker |

## UX Improvements
| ID | Improvement | Priority | Effort |
|----|------------|----------|--------|
| LUI-01 | Add password visibility toggle | High | Low |
| LUI-02 | Add 2FA flow | High | Medium |
| LUI-03 | Add "remember me" checkbox | Low | Low |

---

## SCR-AUTH-02: Register

### Screen ID
SCR-AUTH-02

### Purpose
Create new user account and auto-create workspace.

### Business Goal
User acquisition; 5-minute KPI start.

### User Goal
Create account and start using platform.

### Primary Users
New users (prospects).

### Permissions
Public page.

### Entry Points
- Direct URL `/register`
- "Register" link on Login page
- Invitation link with token (`/register?invite=token`)

### Exit Points
- Successful registration → `/overview` (new workspace)
- "Sign In" link → `/login`

### Navigation
No sidebar, no header — standalone page.

### Page Title
`Create Account — Cloud-Screen`

### Primary CTA
"Create Account" button.

### Secondary CTA
"Sign In" link.

### Danger Actions
None.

---

## Layout

Same as Login (centered card) with additional fields.

### Visual Hierarchy
1. Brand logo
2. "Create Account" heading
3. Name field
4. Email field
5. Password field (with requirements hint)
6. "Create Account" button
7. "Sign In" link

---

## Component Tree

```
<AuthLayout>
  <BrandHeader />
  <AuthCard>
    <Heading level={2}>Create Account</Heading>
    <Form onSubmit={handleSubmit}>
      <FormField name="name" label="Full Name" required>
        <Input placeholder="John Doe" autoComplete="name" />
      </FormField>
      <FormField name="email" label="Email" required>
        <Input type="email" placeholder="you@example.com" autoComplete="email" />
      </FormField>
      <FormField name="password" label="Password" required hint="Minimum 8 characters">
        <PasswordInput placeholder="••••••••" autoComplete="new-password" />
      </FormField>
      {error && <FormError message={error} />}
      <Button type="submit" variant="default" fullWidth disabled={isLoading}>
        {isLoading ? <Spinner /> : "Create Account"}
      </Button>
    </Form>
    <Divider />
    <AuthLinks>
      <Link href="/login">Already have an account? Sign In</Link>
    </AuthLinks>
  </AuthCard>
</AuthLayout>
```

---

## States

### Loading
- Button spinner + "Creating account..."
- Button disabled

### Error
- **Duplicate email:** Inline: "This email is already registered"
- **Weak password:** Inline: "Password must be at least 8 characters"
- **API failure:** Toast: "Failed to create account. Try again."

### Success
- Redirect to `/overview` (no toast — Overview shows onboarding)

---

## Forms

### Validation
| Field | Rule | When | Message |
|-------|------|------|---------|
| Name | Required, min 2 chars | On blur | "Name must be at least 2 characters" |
| Email | Required, valid format | On blur | "Please enter a valid email" |
| Password | Required, min 8 chars | On blur | "Password must be at least 8 characters" |

### Submit
- API: `POST /auth/register` with `{ name, email, password }`
- Auto-creates workspace (locked decision)
- Stores JWT, redirects to Overview

---

## API Requirements

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/auth/register` | POST | Create account + workspace | `{ name, email, password }` → `{ token, user, workspaceId }` |

### Backend Limitations
- No email verification step (locked decision — reduces friction for 5-min KPI)
- Auto-creates workspace (no user choice — locked decision)

---

## Acceptance Criteria

### Functional
- [ ] Name, email, password fields accept input
- [ ] Submit creates account and workspace
- [ ] Duplicate email shows inline error
- [ ] Successful registration redirects to Overview
- [ ] Invitation link pre-fills email if token present

### UX
- [ ] Form submits on Enter
- [ ] Name field auto-focused
- [ ] Password requirements shown below field
- [ ] Minimal fields (3 only) — supports 5-min KPI

### Accessibility
- [ ] All inputs have labels
- [ ] Error announced via `aria-live`
- [ ] Keyboard navigable

### Performance
- [ ] Page renders < 200ms
- [ ] API call < 3s (workspace creation may take longer)

### Responsive
- [ ] Card centered on desktop, full-width on mobile
- [ ] No horizontal scroll at 320px

---

## SCR-AUTH-03: Forgot Password

### Screen ID
SCR-AUTH-03

### Purpose
Request password reset via email.

### Business Goal
User recovery; prevent lockout.

### User Goal
Regain access to account.

### Primary Users
Users who forgot password.

### Permissions
Public page.

### Entry Points
- "Forgot Password?" link on Login page

### Exit Points
- Success → "Back to Login" link → `/login`
- "Back to Login" link → `/login`

### Page Title
`Reset Password — Cloud-Screen`

### Primary CTA
"Send Reset Link" button.

### Secondary CTA
"Back to Login" link.

---

## Layout

Same auth layout, single email field.

### Visual Hierarchy
1. Brand logo
2. "Reset Password" heading
3. Description: "Enter your email and we'll send you a reset link."
4. Email field
5. "Send Reset Link" button
6. "Back to Login" link

---

## States

### Loading
- Button spinner + "Sending..."

### Success
- **Always shows success** (security: don't reveal if email exists)
- UI: "If an account exists with this email, a reset link has been sent."
- "Back to Login" button

### Error
- **Invalid email format:** Inline error
- **API failure:** Toast: "Failed to send reset link. Try again."

---

## API Requirements

| Endpoint | Method | Purpose | Data |
|----------|--------|---------|------|
| `/auth/forgot-password` | POST | Send reset email | `{ email }` → `{ success: true }` (always) |

---

## Acceptance Criteria

- [ ] Email field accepts input
- [ ] Submit sends reset request
- [ ] Success message always shown (security)
- [ ] "Back to Login" navigates to login
- [ ] Invalid email shows inline error

---

## SCR-ERR-01: 404 Page

### Screen ID
SCR-ERR-01

### Purpose
Handle non-existent routes gracefully.

### Business Goal
Prevent dead ends; guide user back.

### User Goal
Understand page doesn't exist; get back to app.

### Primary Users
All users (authenticated and unauthenticated).

### Permissions
None.

### Entry Points
- Invalid URL navigation
- Deleted entity URL access

### Exit Points
- "Go to Overview" button → `/overview` (authenticated)
- "Go to Login" button → `/login` (unauthenticated)

### Page Title
`Page Not Found — Cloud-Screen`

### Primary CTA
"Go to Overview" (authenticated) / "Go to Login" (unauthenticated).

---

## Layout

- Full viewport, centered content
- Large "404" text
- "Page Not Found" heading
- Description: "The page you're looking for doesn't exist or has been moved."
- CTA button

---

## Component Tree

```
<CenteredLayout>
  <ErrorCode>404</ErrorCode>
  <Heading level={2}>Page Not Found</Heading>
  <Text variant="muted">The page you're looking for doesn't exist or has been moved.</Text>
  <Button variant="default" onClick={() => router.push('/overview')}>
    Go to Overview
  </Button>
</CenteredLayout>
```

---

## Acceptance Criteria

- [ ] Displays 404 for non-existent routes
- [ ] "Go to Overview" navigates to `/overview`
- [ ] Shows "Go to Login" for unauthenticated users
- [ ] No sidebar/header (standalone error page)
- [ ] Accessible: `role="alert"`, heading hierarchy correct

---

## SCR-ERR-02: Permission Denied

### Screen ID
SCR-ERR-02

### Purpose
Handle unauthorized access to pages or actions.

### Business Goal
Security; access control.

### User Goal
Understand why access is denied; know what to do.

### Primary Users
Users with insufficient permissions (Editor, Viewer).

### Entry Points
- Direct URL access to unauthorized page
- Role change during session (API 403)

### Exit Points
- "Go to Overview" button → `/overview`
- Auto-redirect after toast

### Page Title
`Access Denied — Cloud-Screen`

### Primary CTA
"Go to Overview".

---

## Layout

- Centered content within app shell (sidebar visible)
- Lock icon (large, muted)
- "Access Denied" heading
- Description: "You don't have permission to access this page. Contact your workspace owner if you believe this is an error."
- CTA button

---

## States

### Route-Level (Direct URL)
- Full page permission denied screen
- Toast: "You don't have access to that page"
- Auto-redirect to `/overview` after 3s (or user clicks CTA)

### Action-Level (API 403)
- Toast: "You don't have permission to do that"
- UI reverts to previous state
- No full-page redirect

---

## Acceptance Criteria

- [ ] Displays permission denied for unauthorized routes
- [ ] Toast shown on access attempt
- [ ] "Go to Overview" navigates correctly
- [ ] Sidebar visible (user is authenticated)
- [ ] Auto-redirect after 3s (route-level only)

---

## SCR-ERR-03: Error Boundary

### Screen ID
SCR-ERR-03

### Purpose
Catch React render errors and show fallback.

### Business Goal
Prevent white screen of death; graceful degradation.

### User Goal
Understand something went wrong; reload page.

### Primary Users
All users.

### Entry Points
- React component render error (automatic)

### Exit Points
- "Reload" button → page reload

### Page Title
`Something Went Wrong — Cloud-Screen`

### Primary CTA
"Reload" button.

---

## Layout

- Centered content (within app shell or standalone)
- Error icon (warning triangle, amber)
- "Something Went Wrong" heading
- Description: "An unexpected error occurred. Try reloading the page."
- "Reload" button
- (Future) "Report Error" link

---

## Acceptance Criteria

- [ ] Catches React render errors
- [ ] Shows fallback UI (no white screen)
- [ ] "Reload" button reloads page
- [ ] Error logged to error tracking (future: Sentry)
- [ ] Sidebar visible if shell is intact

---

## Cross-References

- See `01-global-layout-spec.md` for app shell spec
- See `03-overview-spec.md` for Overview page spec
- See `ux-blueprint/06-auth-ux-blueprint.md` for auth UX blueprint
- See `user-flow-architecture/06-auth-flows.md` for auth flow documentation
- See `product-architecture/17-product-rules.md` PR-01–PR-10 for auth rules
- See `information-architecture/06-page-catalog.md` P-AU-01–P-AU-03 for page catalog
