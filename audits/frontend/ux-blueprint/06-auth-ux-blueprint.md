# Auth UX Blueprint

> **Evidence basis:** `05-page-type-ux-rules.md` §8, `information-architecture/06-page-catalog.md` P-AUTH-01 through P-AUTH-03, `audits/frontend/06-auth-and-session.md`, `transformation/24-design-decisions.md`
> **Purpose:** Complete UX blueprint for Login, Register, and Forgot Password pages

---

## P-AUTH-01: Login

### 1. Purpose
- **Business purpose:** Entry point to the product; authenticate users
- **User purpose:** Access the platform quickly and securely
- **Success criteria:** User logs in within 15 seconds; redirect to Overview or workspace welcome
- **Failure criteria:** User cannot log in; unclear error messages; session issues

### 2. Target Users
- **Primary user:** All users (Owner, Editor, Viewer, Super-Admin)
- **Secondary user:** None
- **Permissions:** None (unauthenticated)
- **Visibility:** Public — visible to unauthenticated users only

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Entry point to the entire product; no login = no product

### 4. Primary Goal
Authenticate the user and redirect to the application

### 5. Primary Action
"Log In" button

### 6. Secondary Actions
1. "Forgot Password?" link
2. "Create Account" link (register)
3. Dev login button (dev mode only)
4. Password visibility toggle (eye icon)

### 7. Information Priority
1. Email input (required)
2. Password input (required)
3. "Log In" button
4. "Forgot Password?" link
5. "Create Account" link
6. Language switcher (EN/AR)
7. 2FA code input (conditional — only if user has 2FA enabled)

### 8. Visual Hierarchy
- **Above the fold:** Logo, email, password, "Log In" button
- **Middle:** "Forgot Password?" link, "Create Account" link
- **Bottom:** Language switcher
- **Collapsed:** 2FA code (only appears after initial submit if 2FA enabled)
- **Hidden:** Dev login (only in development mode)

### 9. Page Sections

| Section | Purpose | Priority | Contents | Dependencies | Visibility | Future |
|---------|---------|----------|----------|-------------|-----------|--------|
| Brand | Identity | Low | Logo, product name | — | Always | — |
| Form | Authentication | Critical | Email, password, submit | Auth API | Always | SSO button (future) |
| Links | Navigation | Medium | Forgot password, Register | — | Always | — |
| Locale | Language | Low | EN/AR toggle | LocaleProvider | Always | — |
| 2FA | Security | High (conditional) | 6-digit code input | Auth API | Only if 2FA enabled | — |
| Dev | Development | Low (dev only) | Quick login buttons | Dev mode | Dev mode only | — |

### 10. Component Inventory

| Component | Type | Section | Evidence |
|-----------|------|---------|----------|
| Logo | Image | Brand | — |
| Email input | Input (text) | Form | `06-auth-and-session.md` §6.7 |
| Password input | Input (password) | Form | — |
| Password toggle | Button (icon) | Form | To be added (F-MH-01 adjacent) |
| Log In button | Button (default) | Form | — |
| Forgot Password link | Link | Links | — |
| Create Account link | Link | Links | — |
| Language switcher | Button (text) | Locale | — |
| 2FA code input | Input (text, 6-digit) | 2FA | `14-settings-feature.md` §14.8 |
| Error alert | Alert (inline) | Form | — |
| Dev login | Button (outline) | Dev | `06-auth-and-session.md` §6.7 |

### 11. Interaction Rules
- **Click:** "Log In" submits form; links navigate
- **Keyboard:** Tab through fields; Enter submits form; Escape clears 2FA input
- **Touch:** All inputs and buttons ≥ 44px touch target
- **2FA auto-submit:** When 6 digits are entered, form auto-submits

### 12. State Changes

| State | Trigger | UI | Evidence |
|-------|---------|-----|----------|
| Idle | Page load | Form ready, inputs empty | — |
| Loading | Submit clicked | Button spinner + "Logging in..." | IP-04 |
| 2FA required | API returns 2FA needed | 2FA input appears with slide-down animation | — |
| Error — invalid credentials | API 401 | Inline error: "Invalid email or password" | `02-state-guidelines.md` §3 |
| Error — 2FA invalid | API 401 | Inline error: "Invalid verification code" | — |
| Error — network | API unreachable | Toast: "Network error. Check your connection." | IP-10 |
| Success | API 200 | Redirect to Overview or workspace welcome | DD-04 |
| Session expired | 401 on any page | Redirect to login + toast: "Session expired" | `07-workspace-management.md` |

### 13. Feedback Rules
- **Toast:** Network errors, session expired
- **Inline:** Invalid credentials, invalid 2FA code
- **Loading:** Button spinner during submit
- **Animation:** 2FA input slides in; success redirect is immediate (no animation)

### 14. Decision Points
- **2FA enabled?** → Show 2FA input after initial submit (recommended default: show immediately if user is known to have 2FA)
- **Multiple workspaces?** → Redirect to workspace welcome (if no `cs_workspace_id` cookie) or Overview (if cookie exists)

### 15. User Mistakes
| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Wrong password | Show/hide toggle to verify | Inline error, form stays open |
| Caps Lock on | (Future) Warning indicator | — |
| Wrong email format | Client-side validation on blur | Inline error |
| Expired 2FA code | Allow resend (future) | "Resend code" link |

### 16. Accessibility
- **Keyboard:** Full keyboard navigable; Tab order: email → password → toggle → button → links
- **Screen reader:** Labels associated with inputs; error messages have `aria-live`
- **ARIA:** `aria-label` on password toggle; `aria-invalid` on error fields
- **Focus:** Email input auto-focused on page load
- **Contrast:** Form inputs meet 4.5:1 contrast
- **Touch targets:** All ≥ 44px

### 17. Mobile Experience
- **Changes:** Full-width form; larger touch targets; no layout change
- **Hidden:** Dev login (if on mobile production build)
- **Drawer:** N/A (no shell)
- **Stacking:** Single column, centered, max 400px width

### 18. Performance UX
- **Skeleton:** Not needed (static form, no data fetch)
- **Lazy loading:** N/A
- **Caching:** Browser may cache email (via autocomplete)

### 19. Future Expansion
- SSO/SAML login button (below "Log In", separated by "or" divider)
- Biometric login (mobile, future)
- "Remember me" checkbox (future)
- Magic link login (future)

### 20. UX Notes
- Token is cleared before login attempt to prevent stale token issues (`06-auth-and-session.md` §6.7)
- Password visibility toggle is currently missing — must be added
- Consider adding "Remember me" for convenience on personal devices
- 2FA code input should be 6 individual boxes or a single input with large font

---

## P-AUTH-02: Register

### 1. Purpose
- **Business purpose:** Customer acquisition; new user onboarding
- **User purpose:** Create an account to start using the platform
- **Success criteria:** User registers and reaches Overview within 30 seconds (target: auto-create workspace)
- **Failure criteria:** User abandons registration; unclear requirements; too many fields

### 2. Target Users
- **Primary user:** Prospective customer (future Workspace Owner)
- **Permissions:** None (unauthenticated)
- **Visibility:** Public

### 3. Page Priority
- **Priority:** Critical
- **Reasoning:** Direct impact on customer acquisition and 5-minute KPI

### 4. Primary Goal
Create a new account with minimum friction

### 5. Primary Action
"Create Account" button

### 6. Secondary Actions
1. "Log In" link (existing users)
2. Password visibility toggle
3. Language switcher

### 7. Information Priority
1. Name input (required)
2. Email input (required)
3. Password input (required)
4. "Create Account" button
5. "Log In" link
6. Language switcher

### 8. Visual Hierarchy
- **Above the fold:** Logo, name, email, password, "Create Account" button
- **Bottom:** "Log In" link, language switcher

### 9. Page Sections

| Section | Purpose | Contents | Visibility |
|---------|---------|----------|-----------|
| Brand | Identity | Logo, product name | Always |
| Form | Registration | Name, email, password, submit | Always |
| Links | Navigation | "Log In" link | Always |
| Locale | Language | EN/AR toggle | Always |

### 10. Component Inventory

| Component | Type |
|-----------|------|
| Logo | Image |
| Name input | Input (text) |
| Email input | Input (email) |
| Password input | Input (password) |
| Password toggle | Button (icon) |
| Password strength indicator | Progress (future) |
| Create Account button | Button (default) |
| Log In link | Link |
| Language switcher | Button (text) |
| Terms checkbox | Checkbox (future) |

### 11. Interaction Rules
- **Click:** "Create Account" submits form
- **Keyboard:** Tab through fields; Enter submits
- **Validation:** Real-time password strength (future); email format on blur; required on blur

### 12. State Changes

| State | Trigger | UI |
|-------|---------|-----|
| Idle | Page load | Form ready |
| Loading | Submit | Button spinner + "Creating account..." |
| Error — email exists | API 409 | Inline: "An account with this email already exists" |
| Error — weak password | API 400 | Inline: "Password must be at least 8 characters" |
| Error — network | API unreachable | Toast: "Network error" |
| Success | API 201 | Auto-login → redirect to workspace setup or Overview |

### 13. Feedback Rules
- **Inline:** Email exists, weak password, invalid email
- **Toast:** Network errors
- **Loading:** Button spinner

### 14. Decision Points
- **Auto-create workspace?** → If yes, redirect to Overview directly (recommended for 5-min KPI). If no, redirect to workspace welcome page.

### 15. User Mistakes
| Mistake | Prevention | Recovery |
|---------|-----------|----------|
| Existing email | Check on blur or submit | Inline error + "Log In" link |
| Weak password | (Future) Strength indicator | Inline guidance |
| Typo in email | (Future) Email confirmation | — |

### 16. Accessibility
- Same as Login (§16)

### 17. Mobile Experience
- Same as Login (§17)

### 18. Performance UX
- No data fetching; static form

### 19. Future Expansion
- Password strength indicator
- Terms of service checkbox
- Social login (Google, Apple)
- Email verification step (async, post-registration)

### 20. UX Notes
- Registration should auto-create a workspace to minimize steps (5-min KPI)
- Email verification should be async (post-registration, not blocking)
- Password requirements should be visible before user types (tooltip or helper text)

---

## P-AUTH-03: Forgot Password

### 1. Purpose
- **Business purpose:** Account recovery; reduce support tickets
- **User purpose:** Regain access to account
- **Success criteria:** User receives reset email and can reset password
- **Failure criteria:** Email not found; email delivery fails

### 2. Target Users
- **Primary user:** Users who forgot their password
- **Permissions:** None
- **Visibility:** Public

### 3. Page Priority
- **Priority:** Medium
- **Reasoning:** Important for account recovery but not a daily-use page

### 4. Primary Goal
Send a password reset email

### 5. Primary Action
"Send Reset Link" button

### 6. Secondary Actions
1. "Back to Login" link
2. Language switcher

### 7. Information Priority
1. Email input (required)
2. "Send Reset Link" button
3. "Back to Login" link
4. Language switcher

### 8-20. (Same pattern as Login, simplified)

### Key UX Notes
- Always show success message ("Reset link sent") even if email doesn't exist (security: don't reveal which emails are registered)
- Reset link expires after 1 hour (backend configuration)
- After reset, user is redirected to login with success toast
- No 2FA required for password reset (2FA is re-established after login)

---

## Cross-References

- See `05-page-type-ux-rules.md` §8 for auth page type rules
- See `information-architecture/06-page-catalog.md` P-AUTH-01 through P-AUTH-03
- See `audits/frontend/06-auth-and-session.md` for auth audit
- See `transformation/24-design-decisions.md` for auth-related decisions
- See `01-ux-principles.md` for UX principles
- See `02-state-guidelines.md` for state guidelines
