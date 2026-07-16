# 21 — Success States

> **Evidence basis:** `01-foundations.md`, `07-motion-system.md` (MI-11, MI-23), `ux-blueprint/02-state-guidelines.md`, `screen-specifications/` (all files have success feedback), `24-toast-standards.md`

---

## 1. Success Philosophy

Success feedback confirms that a user's action was completed. Cloud-Screen uses **toasts** for action-level success and **inline success states** for form-level success. Success is always **brief, non-blocking, and positive**.

---

## 2. Success Components

### Component: SuccessToast

#### Purpose
Brief notification confirming a successful action.

#### Usage
- Form saved successfully
- Entity created/deleted/updated
- Invitation sent
- Playlist published
- File uploaded

#### Visual
- See `24-toast-standards.md` for full toast specification
- Success toast variant: `--success/10` bg, `--success` icon, `--success` accent

#### Animation
- Enter: MI-10 (slide up + fade in, 200ms)
- Auto-dismiss: 3 seconds
- Exit: MI-23 (fade out, 300ms)

#### Catalog of Success Toasts

| Action | Toast Message | Evidence |
|--------|---------------|----------|
| Screen paired | "Screen paired successfully" | `04-screens-specs.md` |
| Screen renamed | "Screen renamed" | `04-screens-specs.md` |
| Screen deleted | "Screen deleted" | `04-screens-specs.md` |
| Playlist created | "Playlist created" | `05-content-specs.md` |
| Playlist saved (Studio) | "Playlist saved" | `06-studio-spec.md` |
| Playlist published | "Published to [N] screens" | `05-content-specs.md` |
| Playlist deleted | "Playlist deleted" | `05-content-specs.md` |
| Playlist duplicated | "Playlist duplicated" | `05-content-specs.md` |
| Media uploaded | "Upload complete" (per file or batch) | `05-content-specs.md` |
| Media deleted | "Media deleted" | `05-content-specs.md` |
| Schedule created | "Schedule created" | `07-scheduling-analytics-specs.md` |
| Schedule updated | "Schedule updated" | `07-scheduling-analytics-specs.md` |
| Schedule deleted | "Schedule deleted" | `07-scheduling-analytics-specs.md` |
| Member invited | "Invitation sent to [email]" | `08-team-spec.md` |
| Member removed | "[Name] removed" | `08-team-spec.md` |
| Role changed | "[Name] is now [Role]" | `08-team-spec.md` |
| Invite resent | "Invitation resent" | `08-team-spec.md` |
| Invite cancelled | "Invitation cancelled" | `08-team-spec.md` |
| Profile saved | "Profile updated" | `09-settings-specs-part1.md` |
| Password changed | "Password changed successfully" | `10-settings-specs-part2.md` |
| 2FA enabled | "Two-factor authentication enabled" | `10-settings-specs-part2.md` |
| 2FA disabled | "Two-factor authentication disabled" | `10-settings-specs-part2.md` |
| API key created | "API key created" | `10-settings-specs-part2.md` |
| API key revoked | "API key revoked" | `10-settings-specs-part2.md` |
| Preferences saved | "Notification preferences saved" | `10-settings-specs-part2.md` |
| Workspace saved | "Workspace settings saved" | `09-settings-specs-part1.md` |
| Plan upgraded | "Plan upgraded to [Plan Name]" | `09-settings-specs-part1.md` |
| Marked all read | "All notifications marked as read" | `11-notifications-admin-specs-part1.md` |
| Flag toggled | "[Flag Name] enabled" / "disabled" | `12-admin-specs-part2.md` |

---

### Component: SuccessCheckmark

#### Purpose
Animated checkmark that draws in to confirm success.

#### Usage
- (Future) Inline success confirmation
- (Future) Wizard completion step
- (Future) Onboarding step completion

#### Visual
- Icon: Custom SVG checkmark (not Lucide)
- Color: `--success`
- Animation: MI-11 (600ms, path draw + scale bounce, `--ease-bounce`)
- Size: 48px (default), 24px (inline)

#### Animation Detail
1. SVG path draws from left to right (400ms)
2. Scale bounces from 0.8 → 1.1 → 1.0 (200ms, starting at 400ms)
3. Total duration: 600ms

#### Accessibility
- `aria-hidden="true"` (decorative — success is announced via toast)
- Reduced motion: Instant show (no draw animation)

---

### Component: SuccessBanner (Inline)

#### Purpose
Inline success banner within a form or page section.

#### Usage
- (Future) Form saved indicator
- (Future) Settings saved inline

#### Visual
- Background: `--success/10`
- Border: `--success/20` (1px), `--radius-md`
- Icon: `CheckCircle` (16px, `--success`)
- Text: `--text-sm --success`
- Padding: `--space-2 --space-3`
- Animation: MI-08 (fade in, 300ms)
- Auto-dismiss: 3 seconds (fade out)

#### When NOT to Use
- For action confirmation (use Toast instead)
- For page-level success (use Toast)
- For permanent state (use Badge instead)

---

## 3. Success Patterns by Context

| Context | Pattern | Duration | Evidence |
|---------|---------|----------|----------|
| Form submit | Toast (success) | 3s auto-dismiss | All form specs |
| Entity create | Toast + navigate to detail | 3s + redirect | `05-content-specs.md` |
| Entity delete | Toast + remove from list | 3s | All list specs |
| Entity update | Toast + update in place | 3s | All detail specs |
| Bulk action | Toast with count | 3s | `04-screens-specs.md` |
| File upload | ProgressBar → Toast | Per file + final | `05-content-specs.md` |
| Wizard completion | Toast + redirect | 3s + redirect | `04-screens-specs.md` |
| Role change | Toast + update in place | 3s | `08-team-spec.md` |
| Flag toggle | Toast + switch update | 3s | `12-admin-specs-part2.md` |

---

## 4. Success Rules

- **Always use toast** for action success — not inline banner (except future form auto-save)
- **Toast auto-dismisses** in 3 seconds (no manual close needed for success)
- **No blocking** — success never blocks the user from continuing
- **Update UI immediately** — entity appears/disappears in list before toast shows (optimistic)
- **No success page** — never redirect to a "Success" page; use toast + redirect to relevant page
- **Be specific** — "Screen paired" not "Success" or "Done"
- **Include entity name** when relevant — "[Name] removed" not "Member removed"
- **No sound** — no audio feedback for success
- **No confetti** — no celebratory animations (enterprise, not consumer)

---

## Cross-References

- See `01-foundations.md` for color tokens
- See `07-motion-system.md` for MI-11, MI-23
- See `24-toast-standards.md` for full toast specification
- See `18-empty-states.md` for empty states
- See `20-error-states.md` for error states
- See `ux-blueprint/02-state-guidelines.md` for state guidelines
