# Admin Flows

> **Evidence basis:** `ux-blueprint/15-admin-ux-blueprint-part1.md`, `ux-blueprint/16-admin-ux-blueprint-part2.md`, `product-architecture/09-product-modules.md` M-08, `03-decision-trees.md` §10
> **Purpose:** Complete user flow documentation for Admin Impersonation, Fleet Management, and Feature Flag Toggle

---

## FL-AD-01: Admin Impersonation

| Field | Value |
|-------|-------|
| Flow ID | FL-AD-01 |
| Flow Name | Admin Impersonation |
| Purpose | Super-Admin views and acts as a customer |
| Primary User | Super-Admin |
| Business Goal | Customer support; troubleshooting |
| User Goal | See what the customer sees and fix issues |
| Starting Point | `/admin/customers` |
| Ending Point | Client Overview (impersonating) → return to admin |
| Success Criteria | Admin can view and act as customer; can return to admin mode |
| Failure Criteria | API failure; customer workspace deleted |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: Find customer**
- Screen: `/admin/customers`
- User Action: Searches for customer by name or email
- System Response: Server-side search; results in table
- Permission Check: 🔒 Super-Admin only

**Step 2: Initiate impersonation**
- Screen: `/admin/customers`
- User Action: Clicks "Actions" → "Impersonate" on customer row
- System Response: Opens confirmation dialog
- UI: Dialog: "View as [Customer Name]? You will see their workspace as they see it."

**Step 3: Confirm impersonation**
- User Action: Clicks "Confirm"
- System Response: API creates impersonation session; sets session to customer's context
- Loading: Dialog spinner
- State Transition: Admin session → Impersonation session

**Step 4: View as customer**
- Screen: Redirect to `/overview` (customer's workspace)
- UI: Impersonation banner visible at top (persistent, amber background): "Viewing as [Customer Name]. [Exit Impersonation]"
- System Response: All data shows customer's workspace data
- Navigation: `/admin/customers` → `/overview`
- Feedback: Toast: "Viewing as [Customer Name]"

**Step 5: Act as customer**
- Admin can navigate, view, and perform actions as the customer
- All actions are logged with impersonation flag (backend)
- Admin sees exactly what the customer sees (same permissions as customer's role)

**Step 6: Exit impersonation**
- User Action: Clicks "Exit Impersonation" in banner
- System Response: API ends impersonation session; restores admin session
- Navigation: Redirect to `/admin/customers`
- Feedback: Toast: "Returned to admin mode"
- State Transition: Impersonation session → Admin session

### Alternative Paths

**AP-1: Impersonate from customer detail (future)**
- Admin navigates to customer detail page
- Clicks "Impersonate" button in header

### Failure Paths

**FP-1: API failure**
- UI: Toast: "Failed to impersonate customer. Try again."
- Recovery: User retries

**FP-2: Customer workspace deleted during impersonation**
- Trigger: Workspace is deleted while admin is impersonating
- UI: Redirect to `/admin/customers` + toast: "This workspace is no longer available"
- Recovery: Admin is back in admin mode

**FP-3: Session conflict**
- Trigger: Admin's session expires during impersonation
- UI: Redirect to login + toast: "Session expired"
- Recovery: Admin re-logs in

### Recovery Paths

| Failure | Recovery Action | Returns To |
|---------|----------------|------------|
| API failure | Retry impersonation | Step 2 |
| Workspace deleted | Auto-return to admin | `/admin/customers` |
| Session expired | Re-login | Login page |

### Cancellation Path
- User clicks "Cancel" in confirmation dialog → no impersonation
- During impersonation: "Exit Impersonation" banner is always visible

### Hesitation and Abandonment

| Point | Risk | Prevention |
|-------|------|------------|
| Confirm impersonation | Low — confirmation dialog | Dialog shows customer name clearly |
| Forget to exit | Low — persistent banner | Amber banner always visible at top |
| Accidental actions | Medium — admin acts as customer | All actions logged with impersonation flag (backend) |

### UX Notes
- Impersonation banner must be persistent and visually distinct (amber background)
- Banner cannot be dismissed — only "Exit Impersonation" ends the session
- All actions during impersonation are logged (backend audit trail)
- Admin sees the customer's UI exactly (same role, same permissions, same workspace)
- If customer is Owner, admin has Owner-level access during impersonation

---

## FL-AD-02: Fleet Management

| Field | Value |
|-------|-------|
| Flow ID | FL-AD-02 |
| Flow Name | Fleet Management |
| Purpose | View and manage all screens across all workspaces |
| Primary User | Super-Admin |
| Business Goal | System oversight; device health monitoring |
| User Goal | Check fleet status; troubleshoot device issues |
| Starting Point | `/admin/fleet` |
| Ending Point | `/admin/fleet` (viewing or acting on fleet data) |
| Success Criteria | Admin can assess fleet health and take action |
| Failure Criteria | API failure |
| Frequency | Weekly |
| Business Importance | Medium |
| Complexity | Medium |

### Happy Path

**Step 1: View fleet dashboard**
- Screen: `/admin/fleet`
- System Response: Fleet health summary (online/offline/warning counts) + fleet table
- Loading: Skeleton summary + skeleton table
- UI: Health summary cards, search bar, filters, fleet table

**Step 2: Search or filter**
- User Action: Types in search (screen name, workspace) or selects filters (status, workspace)
- System Response: Server-side search/filter; table updates
- Loading: Skeleton rows during fetch

**Step 3: View screen details**
- User Action: Clicks screen row
- System Response: (Future) Navigate to admin screen detail
- Current: No detail page; admin can view row data

**Step 4: Take action (future)**
- User Action: Clicks "Actions" → "Reboot" or "OTA Update"
- System Response: Confirmation dialog
- User confirms → API sends command to device
- Feedback: Toast: "Reboot command sent to [Screen Name]"

### Alternative Paths

**AP-1: Click health summary**
- (Future) User clicks online/offline/warning count
- Table filters by that status

### Failure Paths

**FP-1: API failure**
- UI: Error state + "Retry"
- Recovery: User retries

### Realtime Updates

| Event | UI Update |
|-------|-----------|
| Screen status change (Socket.IO) | Health summary + table row update in real-time |

---

## FL-AD-03: Feature Flag Toggle

| Field | Value |
|-------|-------|
| Flow ID | FL-AD-03 |
| Flow Name | Feature Flag Toggle |
| Purpose | Enable or disable features per workspace or globally |
| Primary User | Super-Admin |
| Business Goal | Controlled feature rollout; A/B testing |
| User Goal | Turn features on or off |
| Starting Point | `/admin/feature-flags` |
| Ending Point | `/admin/feature-flags` (flag toggled) |
| Success Criteria | Flag toggled; UI updates for affected workspaces |
| Failure Criteria | API failure |
| Frequency | Occasional |
| Business Importance | Medium |
| Complexity | Simple |

### Happy Path

**Step 1: View feature flags**
- Screen: `/admin/feature-flags`
- System Response: Flags table with name, status toggle, scope, description
- Loading: Skeleton rows

**Step 2: Toggle flag**
- User Action: Clicks status toggle switch
- System Response: API call to toggle flag (optimistic update)
- Micro Interaction: Switch animates immediately (MI-03)
- State Transition: Flag enabled/disabled

**Step 3: Toggle success**
- System Response: API returns 200
- Feedback: Toast: "[Flag Name] enabled" or "disabled"
- UI: Affected workspaces see/hide feature on next page load

### Alternative Paths

**AP-1: Edit workspace targeting**
- User clicks "Edit Targeting" in actions menu
- Dialog opens with workspace list and per-workspace toggles
- User enables/disables flag per workspace
- Clicks "Save Targeting"
- Feedback: Toast: "Flag targeting saved"

### Failure Paths

**FP-1: API failure**
- Trigger: API returns error
- UI: Switch reverts to previous state + toast: "Failed to toggle flag"
- Recovery: User retries

### Cancellation Path
- Toggle is immediate (no confirmation for simple on/off)
- Targeting dialog: user clicks "Cancel" → no changes

### UX Notes
- Flag toggle is optimistic (animates immediately, reverts on error)
- Flag changes affect client UI on next page load or SWR revalidation
- Per-workspace targeting allows gradual rollout (beta customers first)
- Flag names are technical identifiers (monospace font)

---

## Cross-References

- See `03-decision-trees.md` §10 for admin impersonation decision tree
- See `ux-blueprint/15-admin-ux-blueprint-part1.md` for admin Customers, Staff, Users UX
- See `ux-blueprint/16-admin-ux-blueprint-part2.md` for admin Workspaces, Fleet, Health, Logs, Feature Flags UX
- See `product-architecture/09-product-modules.md` M-08 for admin module
- See `16-system-flows.md` for system error and global search flows
