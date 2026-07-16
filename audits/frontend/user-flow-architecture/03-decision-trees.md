# Decision Trees

> **Evidence basis:** `01-flow-principles.md`, `02-flow-matrix.md`, `ux-blueprint/06-auth-ux-blueprint.md` through `16-admin-ux-blueprint-part2.md`, `product-architecture/17-product-rules.md`
> **Purpose:** Define decision trees for key flows where users or systems make critical choices

---

## 1. Authentication Decision Tree

```
User navigates to /login
  │
  ├── Has session cookie? ── Yes ──→ Is cookie valid? ── Yes ──→ Redirect to Overview
  │                                          │
  │                                          No ──→ Clear cookie → Show login form
  │
  No ──→ Show login form
           │
           User submits (email + password)
           │
           ├── Valid credentials? ── No ──→ Inline error: "Invalid email or password"
           │                              │
           │                              User retries or clicks "Forgot Password"
           │
           Yes ──→ Has 2FA enabled?
                     │
                     ├── Yes ──→ Show 2FA input
                     │            │
                     │            User enters 6-digit code
                     │            │
                     │            ├── Valid code? ── No ──→ Inline error: "Invalid code"
                     │            │                              │
                     │            │                              User retries (max 5 attempts)
                     │            │
                     │            Yes ──→ Has workspace?
                     │
                     No ──→ Has workspace?
                              │
                              ├── Yes ──→ Has cs_workspace_id cookie?
                              │            │
                              │            ├── Yes ──→ Redirect to Overview (that workspace)
                              │            │
                              │            No ──→ Has multiple workspaces?
                              │                      │
                              │                      ├── Yes ──→ Redirect to workspace welcome/selector
                              │                      │
                              │                      No ──→ Redirect to Overview (single workspace)
                              │
                              No ──→ Redirect to workspace creation/welcome
```

---

## 2. Screen Pairing Decision Tree

```
User clicks "Add Screen"
  │
  ├── 🔒 Permission: Owner or Editor? ── No ──→ Button hidden (Viewer)
  │
  Yes ──→ Navigate to /screens/pair
           │
           Step 1: Enter pairing code
           │
           ├── Code valid? ── No ──→ Inline error: "Invalid pairing code"
           │                              │
           │                              User retries
           │
           ├── Code already paired? ── Yes ──→ Error: "This screen is already paired"
           │
           Yes ──→ Step 2: Enter screen name
           │
           ├── Name valid (2-50 chars)? ── No ──→ Inline error
           │
           Yes ──→ Step 3: Assign branch (optional)
           │
           ◇ Skip or select branch?
           │
           ├── Skip ──→ Proceed without branch
           │
           Select ──→ Branch selected from dropdown
           │
           Click "Pair Screen"
           │
           ├── API success? ── No ──→ Toast: "Failed to pair screen" + retry
           │
           Yes ──→ Success state: checkmark animation
           │
           ◇ What next?
           │
           ├── "Assign Content" ──→ Navigate to /content (guided)
           │
           "Back to Screens" ──→ Navigate to /screens
```

---

## 3. Playlist Creation Decision Tree

```
User clicks "Create Playlist"
  │
  ├── 🔒 Permission: Owner or Editor? ── No ──→ Button hidden (Viewer)
  │
  Yes ──→ ◇ Template or blank?
           │
           ├── Template ──→ Show template picker
           │                  │
           │                  User selects template
           │                  │
           │                  ├── Template has media? ── Yes ──→ Create playlist from template
           │                  │                                      │
           │                  │                                      Navigate to playlist detail
           │                  │
           │                  No ──→ Create empty playlist from template structure
           │                          │
           │                          Navigate to Studio
           │
           Blank ──→ Create empty playlist
                      │
                      Navigate to Studio
                      │
                      Studio loads (splash screen)
                      │
                      User adds media, text, shapes
                      │
                      ◇ Save or publish?
                      │
                      ├── Save ──→ API call ──→ Toast: "Playlist saved"
                      │
                      Publish ──→ Navigate to playlist detail → Publish flow
```

---

## 4. Publishing Decision Tree

```
User clicks "Publish to Screens"
  │
  ├── 🔒 Permission: Owner or Editor? ── No ──→ Button hidden (Viewer)
  │
  Yes ──→ Open screen selector dialog
           │
           Dialog shows: available screens with checkboxes
           │
           User selects screens
           │
           ◇ Immediate or scheduled?
           │
           ├── Immediate (default) ──→ Click "Publish Now"
           │                             │
           │                             ├── Screens selected? ── No ──→ Validation: "Select at least one screen"
           │                             │
           │                             Yes ──→ API call: assign playlist to screens
           │                                      │
           │                                      ├── Success? ── No ──→ Toast: "Failed to publish" + retry
           │                                      │
           │                                      Yes ──→ Toast: "Published to [N] screens"
           │                                               │
           │                                               ◇ Next step?
           │                                               │
           │                                               ├── "View on screen" ──→ Navigate to /screens/{id}
           │                                               │
           │                                               "Done" ──→ Stay on playlist detail
           │
           Scheduled ──→ Navigate to /scheduling (pre-filled with playlist)
                          │
                          → Schedule creation flow (FL-SCH-01)
```

---

## 5. Schedule Conflict Decision Tree

```
User creates or edits a schedule
  │
  Submit schedule (screen, playlist, time range, recurrence)
  │
  ├── API returns conflict? ── No ──→ Schedule created successfully
  │                                       │
  │                                       Toast: "Schedule created"
  │
  Yes ──→ Show conflict details
           │
           Conflicting schedule(s) shown with details
           │
           ◇ How to resolve?
           │
           ├── Adjust time range ──→ User modifies time ──→ Re-submit
           │
           ├── Override (replace conflicting schedule) ──→ Confirm dialog
           │                                                        │
           │                                                        ├── Confirm ──→ Replace + create
           │                                                        │
           │                                                        Cancel ──→ Back to edit
           │
           Cancel ──→ Abort schedule creation
```

---

## 6. Media Upload Decision Tree

```
User drags files or clicks "Upload"
  │
  ├── 🔒 Permission: Owner or Editor? ── No ──→ Button hidden (Viewer)
  │
  Yes ──→ Files selected
           │
           For each file:
           │
           ├── File type valid (image/video)? ── No ──→ Error: "Only images and videos allowed"
           │
           ├── File size within limit? ── No ──→ Error: "File exceeds [N]MB limit"
           │
           ├── Storage limit reached? ── Yes ──→ Error: "Storage limit reached" + "Upgrade" link
           │
           All checks pass ──→ Start upload
           │
           Upload progress per file
           │
           ├── Upload success? ── No ──→ Per-file error + "Retry Upload" button
           │
           Yes ──→ File appears in media grid
           │
           All files complete ──→ Toast: "[N] files uploaded successfully"
```

---

## 7. Team Invitation Decision Tree

```
User clicks "Invite Member"
  │
  ├── 🔒 Permission: Owner only? ── No ──→ Button hidden (Editor/Viewer)
  │
  Yes ──→ Open invite dialog
           │
           User enters email + selects role
           │
           ├── Email valid format? ── No ──→ Inline error
           │
           ├── Email already member? ── Yes ──→ Inline: "Already a member"
           │
           ├── Email already invited? ── Yes ──→ Inline: "Already invited"
           │
           All valid ──→ Send invitation
           │
           ├── API success? ── No ──→ Toast: "Failed to send invitation"
           │
           Yes ──→ Toast: "Invitation sent to [email]"
                    │
                    Pending invite appears in pending list
                    │
                    ◇ Invitee receives email
                    │
                    ├── Accepts ──→ Joins workspace ──→ Toast (realtime): "[Name] joined"
                    │
                    Declines ──→ Invite marked declined ──→ Toast: "[email] declined"
                    │
                    Expires ──→ Invite marked expired (future)
```

---

## 8. Permission Denied Decision Tree

```
User attempts action (click button, navigate to route)
  │
  ├── 🔒 Permission check (frontend)
  │
  ├── Has permission? ── Yes ──→ Proceed with action
  │
  No ──→ How is it denied?
           │
           ├── Button hidden (role-based) ──→ User doesn't see action
           │                                    │
           │                                    User cannot attempt (prevention)
           │
           Route access denied ──→ Redirect to /overview
                                   │
                                   Toast: "You don't have access to that page"
                                   │
           API returns 403 ──→ Toast: "You don't have permission to do that"
                               │
                               UI reverts to previous state
```

---

## 9. Billing Upgrade Decision Tree

```
User navigates to Settings → Billing
  │
  ├── 🔒 Permission: Owner only? ── No ──→ Tab hidden (Editor/Viewer)
  │
  Yes ──→ View current plan + usage
           │
           ◇ Upgrade or manage?
           │
           ├── Usage at limit? ── Yes ──→ Amber/red indicator + "Upgrade" CTA
           │
           User clicks "Upgrade Plan"
           │
           View plan options
           │
           User selects plan
           │
           Confirm upgrade dialog (plan name + price)
           │
           ├── Confirm? ── No ──→ Cancel
           │
           Yes ──→ Payment processing
                    │
                    ├── Has payment method? ── No ──→ Collect payment (Stripe)
                    │                                  │
                    │                                  ├── Payment valid? ── No ──→ Error + retry
                    │                                  │
                    │                                  Yes ──→ Process upgrade
                    │
                    Yes ──→ Process upgrade
                              │
                              ├── Success? ── No ──→ Toast: "Failed to upgrade" + retry
                              │
                              Yes ──→ Toast: "Plan upgraded to [Plan Name]"
                                       │
                                       Page refreshes with new plan
```

---

## 10. Admin Impersonation Decision Tree

```
Super-Admin navigates to Admin → Customers
  │
  Finds customer
  │
  Clicks "Impersonate" action
  │
  Confirmation dialog: "View as [Customer Name]?"
  │
  ├── Confirm? ── No ──→ Cancel
  │
  Yes ──→ API: create impersonation session
           │
           ├── Success? ── No ──→ Toast: "Failed to impersonate"
           │
           Yes ──→ Redirect to client /overview
                    │
                    Impersonation banner visible (persistent)
                    │
                    Admin navigates as customer
                    │
                    ◇ Exit impersonation
                    │
                    Click "Exit Impersonation" in banner
                    │
                    ──→ Redirect to /admin/customers
                         │
                         Toast: "Returned to admin mode"
```

---

## Cross-References

- See `01-flow-principles.md` for flow principles and notation
- See `02-flow-matrix.md` for flow priority and complexity matrices
- See `04-state-machines.md` for entity state machines
- See `05-cross-flow-relationships.md` for flow dependencies
- See `06-auth-flows.md` through `18-edge-cases.md` for detailed flow documentation
- See `ux-blueprint/06-auth-ux-blueprint.md` through `16-admin-ux-blueprint-part2.md` for page UX blueprints
- See `product-architecture/17-product-rules.md` for permission rules
