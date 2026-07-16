# Authentication Flows

> **Evidence basis:** `ux-blueprint/06-auth-ux-blueprint.md`, `product-architecture/17-product-rules.md` PR-01 through PR-10, `03-decision-trees.md` §1
> **Purpose:** Complete user flow documentation for Login, Registration, Forgot Password, and Logout

---

## FL-AUTH-01: Login

| Field | Value |
|-------|-------|
| Flow ID | FL-AUTH-01 |
| Flow Name | Login |
| Purpose | Authenticate user and redirect to workspace |
| Primary User | All users |
| Business Goal | User access to platform |
| User Goal | Get into the application |
| Starting Point | `/login` (unauthenticated) |
| Ending Point | `/overview` (authenticated, workspace selected) |
| Success Criteria | User redirected to Overview within 10 seconds |
| Failure Criteria | Invalid credentials; 2FA failure; no workspace |
| Frequency | Daily |
| Business Importance | Critical |
| Complexity | Simple |

### Happy Path

**Step 1: View login form**
- Screen: `/login`
- User Action: Views login form (email + password fields, "Sign In" button, "Forgot Password" link, "Register" link)
- System Response: Form rendered, email field auto-focused
- Validation: None
- Permission Check: None (public page)
- State Transition: UNAUTHENTICATED → (form visible)
- Micro Interaction: Form fades in (MI-08, 200ms)
- Accessibility: Email field has `aria-label="Email"`, password field has `aria-label="Password"`
- Mobile: Form is full width, centered, max-width 400px

**Step 2: Enter credentials and submit**
- Screen: `/login`
- User Action: Types email, types password, clicks "Sign In" (or presses Enter)
- System Response: Button shows spinner, API call to `/auth/login`
- Validation: Email format (client-side), password non-empty (client-side)
- Loading: Button spinner + "Signing in..."
- Permission Check: None
- Data Required: Email, password
- State Transition: (form) → (submitting)
- Micro Interaction: Button spinner (MI-04)
- Feedback: None until API responds
- Keyboard: Enter submits form
- Accessibility: Loading state announced via `aria-live`
- Mobile: Same as desktop
- Performance: API call should complete in < 2s

**Step 3: Authentication success**
- Screen: Redirect to `/overview` or workspace selector
- System Response: JWT token stored in cookie, redirect issued
- Success: User is authenticated, workspace context loaded
- State Transition: UNAUTHENTICATED → AUTHENTICATED
- Navigation Transition: `/login` → `/overview` (or `/welcome` if multiple workspaces)
- Micro Interaction: Page transition (fade, 200ms)
- Feedback: None (redirect is immediate)
- Performance: Redirect should be < 500ms

### Alternative Paths

**AP-1: 2FA Required**
- After Step 2, if user has 2FA enabled:
- Screen: 2FA input field appears (inline or new step)
- User Action: Types 6-digit code from authenticator app
- System Response: API call to `/auth/verify-2fa`
- Validation: 6 digits required
- Success: Proceed to Step 3
- Failure: See Failure Path FP-3

**AP-2: Multiple Workspaces**
- After authentication, if user has multiple workspaces and no `cs_workspace_id` cookie:
- Screen: Workspace selector page (`/welcome`)
- User Action: Selects workspace from list
- System Response: Sets workspace cookie, redirects to Overview
- Navigation: `/welcome` → `/overview`

**AP-3: "Remember Me" (future)**
- User checks "Remember me" checkbox
- System extends token expiration
- User remains logged in across browser restarts

### Failure Paths

**FP-1: Invalid credentials**
- Trigger: API returns 401
- UI: Inline error below form: "Invalid email or password"
- Recovery: User corrects credentials and retries
- State: Form remains visible, inputs preserved (email kept, password cleared)

**FP-2: Account not found**
- Trigger: API returns 404 (email not registered)
- UI: Inline error: "No account found with this email"
- Recovery: User clicks "Register" link or corrects email

**FP-3: 2FA code invalid**
- Trigger: API returns 401 on 2FA verification
- UI: Inline error: "Invalid verification code"
- Recovery: User re-enters code (max 5 attempts before lockout — future)

**FP-4: Account suspended**
- Trigger: API returns 403 (account suspended)
- UI: Inline error: "Your account has been suspended. Contact support."
- Recovery: User cannot self-recover; must contact support

**FP-5: Network error**
- Trigger: API unreachable
- UI: Toast: "Network error. Check your connection."
- Recovery: User retries

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Invalid credentials | Re-enter email/password | Step 2 |
| 2FA invalid | Re-enter 2FA code | AP-1 |
| Network error | Retry submission | Step 2 |
| Account suspended | Contact support (external) | N/A |

### First-Time User Path
- Same as Happy Path (first login after registration)
- May trigger workspace onboarding if workspace is empty (FL-OB-05)

### Returning User Path
- Same as Happy Path
- `cs_workspace_id` cookie may auto-select workspace (skip AP-2)

### Power User Path
- Tab to email field, type, Tab to password, type, Enter
- No mouse interaction needed
- 2FA users: type code, auto-submit on 6th digit

### Offline Path
- Network loss during submit: Toast: "Connection lost. Retrying..."
- Auto-retry when connection restored (if within 30s)
- If retry fails: Error message, user can retry manually

### Timeout Path
- If API takes > 10s: Toast: "Taking longer than expected..."
- If API times out (30s): Error: "Request timed out. Try again."

### Cancellation Path
- User can navigate to `/register` or `/forgot-password` at any time before submit
- After submit: Cannot cancel (API call in progress)

---

## FL-AUTH-02: Registration

| Field | Value |
|-------|-------|
| Flow ID | FL-AUTH-02 |
| Flow Name | Registration |
| Purpose | Create new user account and workspace |
| Primary User | New user (prospect) |
| Business Goal | User acquisition; 5-minute KPI start |
| User Goal | Create account and start using platform |
| Starting Point | `/register` |
| Ending Point | `/overview` (authenticated, new workspace) |
| Success Criteria | Account created, workspace auto-created, redirected to Overview |
| Failure Criteria | Duplicate email; weak password; API failure |
| Frequency | One-time |
| Business Importance | Critical |
| Complexity | Medium |

### Happy Path

**Step 1: View registration form**
- Screen: `/register`
- User Action: Views form (name, email, password, "Create Account" button, "Sign In" link)
- System Response: Form rendered, name field auto-focused
- Validation: None
- Permission Check: None (public page)
- Micro Interaction: Form fades in (MI-08)
- Accessibility: All fields have `aria-label`
- Mobile: Full width, centered

**Step 2: Enter details and submit**
- Screen: `/register`
- User Action: Types name, email, password; clicks "Create Account"
- System Response: Button spinner, API call to `/auth/register`
- Validation: Name (min 2 chars), email (valid format), password (min 8 chars) — all client-side on blur
- Loading: Button spinner + "Creating account..."
- Data Required: Name, email, password
- State Transition: (form) → (submitting)
- Keyboard: Enter submits

**Step 3: Account + workspace created**
- Screen: Redirect to `/overview`
- System Response: User created, workspace auto-created (locked decision), JWT stored, redirect
- Success: User authenticated, empty workspace, Overview shows first-time state
- State Transition: UNAUTHENTICATED → AUTHENTICATED
- Navigation: `/register` → `/overview`
- Feedback: None (redirect is immediate; Overview shows onboarding)

### Alternative Paths

**AP-1: Demo workspace (future)**
- During registration, user can select "Start with demo content"
- Workspace pre-populated with sample screens, playlists, media
- User can explore before adding real content

**AP-2: Invitation acceptance**
- User arrives via invitation link (`/register?invite=token`)
- Email pre-filled from invitation
- After registration, user is added to the inviting workspace
- Redirect to that workspace's Overview (not a new workspace)

### Failure Paths

**FP-1: Duplicate email**
- Trigger: API returns 409
- UI: Inline error on email field: "This email is already registered"
- Recovery: User clicks "Sign In" link or uses different email

**FP-2: Weak password**
- Trigger: Client-side validation on blur or submit
- UI: Inline error: "Password must be at least 8 characters"
- Recovery: User enters stronger password

**FP-3: Invalid email format**
- Trigger: Client-side validation on blur
- UI: Inline error: "Please enter a valid email address"
- Recovery: User corrects email

**FP-4: API failure**
- Trigger: API returns 500 or unreachable
- UI: Toast: "Failed to create account. Try again."
- Recovery: User retries

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| Duplicate email | Click "Sign In" or change email | Step 2 |
| Weak password | Enter stronger password | Step 2 |
| API failure | Retry submission | Step 2 |

### First-Time User Path
- This IS the first-time user path (registration is one-time)

### Returning User Path
- N/A (one-time flow)

### Power User Path
- Tab through fields, Enter to submit
- All keyboard navigable

### Offline Path
- Network loss: Toast + auto-retry
- If persistent: Error, user retries when online

### Cancellation Path
- User can click "Sign In" link at any time before submit
- Navigates to `/login`

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Password field | Medium — users hesitate on password choice | Show requirements below field before typing |
| Submit button | High — registration abandonment is common | Minimal fields (only 3); clear CTA; no email verification step (locked decision) |

---

## FL-AUTH-03: Forgot Password

| Field | Value |
|-------|-------|
| Flow ID | FL-AUTH-03 |
| Flow Name | Forgot Password |
| Purpose | Reset password via email |
| Primary User | All users (who forgot password) |
| Business Goal | User recovery; prevent lockout |
| User Goal | Regain access to account |
| Starting Point | `/forgot-password` |
| Ending Point | `/login` (with success toast) |
| Success Criteria | Reset email sent (always — even if email doesn't exist, for security) |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: View forgot password form**
- Screen: `/forgot-password`
- User Action: Views form (email input, "Send Reset Link" button, "Back to Login" link)
- System Response: Form rendered, email field auto-focused

**Step 2: Enter email and submit**
- Screen: `/forgot-password`
- User Action: Types email, clicks "Send Reset Link"
- System Response: Button spinner, API call to `/auth/forgot-password`
- Validation: Email format (client-side)
- Loading: Button spinner + "Sending..."

**Step 3: Success state**
- Screen: `/forgot-password` (success state) or redirect to `/login`
- System Response: Always shows success (security: don't reveal if email exists)
- Success: "If an account exists with this email, a reset link has been sent."
- Feedback: Success message displayed + "Back to Login" link
- Navigation: User clicks "Back to Login" → `/login`

### Failure Paths

**FP-1: Invalid email format**
- Trigger: Client-side validation
- UI: Inline error: "Please enter a valid email"
- Recovery: User corrects email

**FP-2: API failure**
- Trigger: API unreachable
- UI: Toast: "Failed to send reset link. Try again."
- Recovery: User retries

### Security Note
- System ALWAYS shows success message regardless of whether email exists
- This prevents email enumeration attacks
- Evidence: `06-auth-ux-blueprint.md` §FL-FP-01

### Cancellation Path
- User clicks "Back to Login" at any time → `/login`

---

## FL-AUTH-04: Logout

| Field | Value |
|-------|-------|
| Flow ID | FL-AUTH-04 |
| Flow Name | Logout |
| Purpose | End user session |
| Primary User | All users |
| Business Goal | Security (session termination) |
| User Goal | Log out of account |
| Starting Point | Any authenticated page |
| Ending Point | `/login` (unauthenticated) |
| Success Criteria | Session terminated, redirect to login |
| Failure Criteria | API failure (token still cleared client-side) |
| Frequency | Daily |
| Business Importance | Low |
| Complexity | Simple |

### Happy Path

**Step 1: Click logout**
- Screen: User menu dropdown (header)
- User Action: Clicks user avatar → dropdown → "Logout"
- System Response: API call to `/auth/logout` (invalidate token server-side)
- Permission Check: AUTHENTICATED
- Micro Interaction: Dropdown opens (MI-01, 150ms)

**Step 2: Session cleared**
- Screen: Redirect to `/login`
- System Response: JWT cookie cleared, SWR cache cleared, redirect
- State Transition: AUTHENTICATED → LOGGED_OUT
- Navigation: Any page → `/login`
- Feedback: None (redirect is immediate)
- Performance: < 500ms

### Failure Paths

**FP-1: API failure on logout**
- Trigger: API unreachable or returns error
- UI: Client-side logout still proceeds (clear cookie, redirect)
- Rationale: Client-side security takes priority; server token will expire naturally
- Recovery: None needed (user is logged out client-side)

### Cancellation Path
- User can close dropdown without clicking logout (click outside or Escape)

---

## Cross-References

- See `03-decision-trees.md` §1 for authentication decision tree
- See `04-state-machines.md` §7 for user session state machine
- See `ux-blueprint/06-auth-ux-blueprint.md` for auth page UX blueprint
- See `product-architecture/17-product-rules.md` PR-01 through PR-10 for auth rules
- See `07-workspace-flows.md` for workspace creation and switching flows
