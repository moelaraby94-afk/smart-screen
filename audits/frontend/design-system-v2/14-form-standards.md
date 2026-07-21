# 14 — Form Standards

> **Evidence basis:** `13-input-specifications.md`, `09-interaction-states.md`, `10-accessibility-rules.md`, `ux-blueprint/03-component-ux-standards.md` §4, `screen-specifications/02-auth-error-specs.md`, `screen-specifications/09-settings-specs-part1.md`, `screen-specifications/10-settings-specs-part2.md`, `user-flow-architecture/01-flow-principles.md` FP-07

---

## 1. Form Philosophy

Forms in Smart Screen are **simple, forgiving, and clear**. They guide the user with labels, validation, and helpful error messages. Every form follows the same structural pattern: `FormField` wraps each field with a label, input, and error message.

---

## 2. Form Composition

### 2.1 Standard Form Structure

```
<Form>
  <FormField>
    <Label>Email</Label>
    <Input type="email" />
    <HelperText>Enter your email address</HelperText>
    <FormError>Please enter a valid email</FormError>
  </FormField>
  <FormField>
    <Label>Password</Label>
    <PasswordInput />
    <FormError>Password must be 8+ characters</FormError>
  </FormField>
  <FormActions>
    <Button variant="ghost">Cancel</Button>
    <Button variant="default" type="submit">Submit</Button>
  </FormActions>
</Form>
```

### 2.2 Component: FormField

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | — | Field name (for form library) |
| `label` | `string` | — | Field label (required) |
| `required` | `boolean` | `false` | Show required indicator (*) |
| `error` | `string` | — | Error message |
| `helperText` | `string` | — | Helper text below input |
| `children` | `ReactNode` | — | Input element |

### 2.3 Component: Label

- **Styling:** `--text-sm --font-medium --foreground`
- **Required indicator:** `*` in `--destructive` after label text
- **Association:** `htmlFor` pointing to input `id`

### 2.4 Component: HelperText

- **Styling:** `--text-xs --font-normal --muted-foreground`
- **Position:** Below input, above error
- **Visibility:** Always visible (if provided)

### 2.5 Component: FormError

- **Styling:** `--text-xs --font-normal --destructive`
- **Position:** Below input (and below helper text if present)
- **Icon:** `AlertCircle` (14px, `--destructive`) inline before text
- **Accessibility:** `role="alert"`, `aria-live="assertive"`
- **Animation:** MI-08 (fade in, 300ms)

### 2.6 Component: FormActions

- **Layout:** `flex items-center justify-end gap-3`
- **Position:** Below all form fields, `mt-6`
- **Order:** Cancel (left/ghost) → Submit (right/default)
- **Alignment:** Right-aligned (buttons at end of form)

---

## 3. Validation

### 3.1 Validation Timing

| Field Type | When to Validate | Evidence |
|------------|------------------|----------|
| Email | On blur | `02-auth-error-specs.md` |
| Password | On blur | `02-auth-error-specs.md` |
| Required fields | On submit | All form specs |
| Name | On blur (min 2 chars) | `02-auth-error-specs.md` |
| Pairing code | On 6th character (auto-advance) | `04-screens-specs.md` |
| 2FA code | On 6th digit (auto-submit) | `10-settings-specs-part2.md` |

### 3.2 Validation Rules

- **On blur:** Validate field when user leaves it; show error if invalid
- **On submit:** Validate all fields; show all errors
- **On change:** Clear error when user starts typing (don't re-validate on every keystroke)
- **On success:** Clear error when field becomes valid

### 3.3 Error Messages

| Rule | Message Format | Example |
|------|----------------|---------|
| Required | "[Field] is required" | "Email is required" |
| Email format | "Please enter a valid email" | — |
| Min length | "[Field] must be at least [N] characters" | "Password must be at least 8 characters" |
| Max length | "[Field] must be at most [N] characters" | — |
| Match | "[Field]s do not match" | "Passwords do not match" |
| Already exists | "This [entity] is already [state]" | "This email is already registered" |
| API error | "Failed to [action]. Try again." | "Failed to save profile. Try again." |

### 3.4 Error Display Rules

- **Inline:** Error message appears below the field (not in a toast)
- **Red border:** Input border changes to `--destructive` (2px)
- **Error icon:** AlertCircle icon (14px) on right side of input
- **aria-live:** Error message announced via `aria-live="assertive"`
- **No toast for validation errors** — toasts are for API errors only

---

## 4. Submit Behavior

### 4.1 Submit Flow

1. User clicks submit button (or presses Enter)
2. All fields validate
3. If any field invalid: show errors, focus first invalid field
4. If all valid: button enters loading state (spinner + disabled)
5. API call is made
6. On success: toast + redirect or form clears
7. On failure: toast (API error) or inline error (field error)

### 4.2 Submit Button States

| State | Visual | When |
|-------|--------|------|
| Default | Normal button | Form loaded, no action |
| Loading | Spinner + disabled | API call in progress |
| Success | Redirect or toast | API call succeeded |
| Error | Toast or inline error | API call failed |

### 4.3 Double-Submit Prevention

- Submit button is **disabled** during loading state
- Button cannot be clicked twice
- Backend should also enforce idempotency (PR-07)
- Evidence: `user-flow-architecture/01-flow-principles.md` FP-07

---

## 5. Unsaved Changes

### 5.1 Current State
- No unsaved changes warning (FR-12 — documented gap)

### 5.2 Future State
- When user navigates away from a form with unsaved changes:
  - AlertDialog: "You have unsaved changes. Leave anyway?"
  - Actions: "Stay" (default focus) + "Leave"
- Trigger: `beforeunload` event or route change interceptor
- Evidence: `user-flow-architecture/18-edge-cases.md` EC-13

---

## 6. Form Layout

### 6.1 Single-Column (Default)

All forms are **single-column**. Fields stack vertically.

- Field gap: `--space-3` (12px) or `--space-4` (16px) for relaxed
- Label-to-input gap: `--space-1.5` (6px)
- Form actions gap: `--space-3` (12px)
- Form actions margin top: `--space-6` (24px)

### 6.2 No Multi-Column Forms

- **Never** put fields side-by-side on desktop
- Exception: Position/Size inputs in Studio properties (X/Y, W/H) — these are paired number inputs
- Exception: Date + Time inputs in Schedule dialog — these are paired

### 6.3 Form Width

| Context | Width | Evidence |
|---------|-------|----------|
| Auth forms | `max-w-[400px]` | `02-auth-error-specs.md` |
| Settings forms | `max-w-[800px]` | `09-settings-specs-part1.md` |
| Dialog forms | `max-w-[450px]` to `max-w-[600px]` | `13-shared-dialogs-specs.md` |
| Inline edit | Matches element width | `04-screens-specs.md` |

---

## 7. Form Patterns by Page

| Page | Fields | Submit | Cancel | Evidence |
|------|--------|--------|--------|----------|
| Login | Email, Password | "Sign In" | Link to Register | `02-auth-error-specs.md` |
| Register | Name, Email, Password | "Create Account" | Link to Login | `02-auth-error-specs.md` |
| Forgot Password | Email | "Send Reset Link" | Link to Login | `02-auth-error-specs.md` |
| Settings Profile | Name, Email, Avatar | "Save" | None | `09-settings-specs-part1.md` |
| Settings Password | Current, New, Confirm | "Change Password" | None | `10-settings-specs-part2.md` |
| Invite Member | Email, Role | "Send Invitation" | Dialog close | `13-shared-dialogs-specs.md` |
| Schedule Creation | Playlist, Screen, Start, End, Recurrence | "Create Schedule" | Dialog close | `13-shared-dialogs-specs.md` |
| Pairing Wizard | Code (step 1), Name (step 2), Branch (step 3) | "Pair Screen" | Back to Screens | `04-screens-specs.md` |

---

## 8. Accessibility

- Every input has an associated `<label>` (via `htmlFor` / `id`)
- Error messages use `role="alert"` and `aria-live="assertive"`
- `aria-invalid="true"` on inputs with errors
- `aria-describedby` pointing to error message
- `autocomplete` attribute on appropriate inputs
- Tab order follows visual order (top-to-bottom)
- `Enter` submits the form
- Required fields marked with `*` and `aria-required="true"`

---

## Cross-References

- See `13-input-specifications.md` for input component specs
- See `09-interaction-states.md` for error and disabled states
- See `10-accessibility-rules.md` for form accessibility
- See `22-dialog-standards.md` for dialog form patterns
- See `ux-blueprint/03-component-ux-standards.md` §4 for form standards
- See `user-flow-architecture/01-flow-principles.md` FP-07 for double-submit prevention
