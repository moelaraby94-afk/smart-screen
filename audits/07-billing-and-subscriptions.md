# Audit 07: Billing & Subscriptions

**Date:** 2026-07-13  
**Auditor:** Cascade AI  
**Scope:** Stripe integration, subscription plans, billing portal, webhook handling, mock billing, pricing model

---

## 1. Subscription Plans

### 1.1 Plan Tiers

| Plan | Price (cents) | Screens | Seats | Storage | Per-Screen Overage |
|------|--------------|---------|-------|---------|-------------------|
| FREE | $0 | 25 | 5 | 5 GB | $0 |
| STARTER | $19.00/mo | 100 | 15 | — | $0.15/screen |
| PRO | $49.00/mo | 500 | 25 | 50 GB | $0.08/screen |
| ENTERPRISE | $199.00/mo | 2000 | 100 | — | $0.05/screen |

### 1.2 Plan Configuration

Pricing is hardcoded in `subscriptions.service.ts`:
```typescript
case SubscriptionPlan.STARTER:
  return { basePrice: 1900, includedScreens: 100, perScreenPrice: 15, currency: 'usd' };
```

**Issue**: Pricing values are in code, not in database or config. Changing pricing requires a code deployment.

### 1.3 Storage Limits

- FREE: 5 GB (`BYTES_5GB = 5 * 1024 * 1024 * 1024`)
- PRO: 50 GB (`BYTES_50GB = 50 * 1024 * 1024 * 1024`)
- STARTER/ENTERPRISE: Not explicitly set in mock plan (uses Prisma default or existing value)

**Issue**: STARTER and ENTERPRISE storage limits are not defined in the mock plan path. Only FREE and PRO are supported in `setMockPlan`.

---

## 2. Stripe Integration

### 2.1 Checkout Flow

```
User selects plan → POST /stripe/checkout
  → Stripe Checkout Session created (subscription mode)
  → User redirected to Stripe-hosted page
  → Payment completed → Stripe sends webhook
  → Webhook handler processes checkout.session.completed
  → Subscription updated via applyTrustedCheckoutUsingClient
```

**Implementation quality**: ✅ Excellent
- `client_reference_id` set to workspaceId ✅
- `metadata.workspace_id` and `metadata.plan` on session and subscription ✅
- Existing Stripe customer reused if available ✅
- Success/cancel URLs configurable via env vars ✅

### 2.2 Billing Portal

```
User clicks "Manage Billing" → POST /stripe/portal
  → Stripe Billing Portal Session created
  → User redirected to Stripe-hosted portal
  → User can update payment method, cancel, etc.
  → Returns to /settings/billing
```

**Implementation quality**: ✅ Good
- Return URL locale-aware ✅
- Requires existing `stripeCustomerId` ✅
- Admin/Owner role check ✅

### 2.3 Webhook Handling

**File**: `stripe-webhook.service.ts` (137 lines)

**Strengths:**
- Raw body parsing (separate from JSON body parser) ✅
- Stripe signature verification ✅
- Idempotent processing (`ProcessedWebhookEvent`) ✅
- Transaction-wrapped event processing ✅
- Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` ✅
- Duplicate detection via P2002 error code ✅

**Issues:**
1. **No `customer.subscription.created` handler**: Only `updated` and `deleted` are handled. If a subscription is created outside of checkout (e.g., via Stripe Dashboard), it won't be synced.
2. **No `invoice.payment_failed` handler**: Past-due subscriptions rely on `subscription.updated` status, but no explicit payment failure notification to the user.
3. **No `payment_intent.payment_failed` handler**: Same as above.
4. **Metadata parsing**: `parsePlan()` silently returns `null` for invalid plans. The webhook logs a warning but doesn't alert admins.

### 2.4 Subscription Sync

**`syncFromStripeSubscription`**:
- Maps Stripe subscription statuses to internal `SubscriptionStatus` ✅
- Updates `currentPeriodEnd`, `canceledAt`, `stripeSubscriptionId`, `stripeCustomerId` ✅
- Handles `active`, `past_due`, `unpaid`, `canceled`, `trialing`, `paused` statuses ✅

**Issue**: No proration or credit calculation when downgrading plans. Stripe handles this on their end, but the internal state may not reflect prorated amounts.

---

## 3. Mock Billing (Development)

### 3.1 Implementation

```typescript
async setMockPlan(workspaceId: string, plan: MockPlan) {
  assertMockBillingAllowed(); // Throws if NODE_ENV === 'production'
  // ... directly updates subscription in DB
}
```

**Strengths:**
- Guarded by `assertMockBillingAllowed()` — fails in production ✅
- Emits `workspaceSubscriptionUpdated` event via heartbeat ✅
- Returns full subscription payload ✅

**Issues:**
1. **Only supports FREE and PRO**: STARTER and ENTERPRISE are not available in mock mode. This limits testing of those plan tiers.
2. **No mock billing history**: `PaymentRecord` model exists but mock plan changes don't create payment records.
3. **No mock invoice generation**: No way to test invoice PDF features in development.

---

## 4. Payment Records

### 4.1 Model

```prisma
model PaymentRecord {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount      Float
  currency    String
  status      String   // Not an enum — should be
  provider    String?  // Not an enum — should be
  reference   String?
  createdAt   DateTime @default(now())
  
  @@index([userId, createdAt])
}
```

### 4.2 Issues

1. **No Stripe payment record creation**: The webhook handler doesn't create `PaymentRecord` entries. The model exists but appears unused.
2. **`amount` as `Float`**: Monetary values should use `Decimal` or integer cents, not `Float` (floating-point precision issues).
3. **`status` as `String`**: Should be an enum (`PENDING`, `SUCCEEDED`, `FAILED`, `REFUNDED`).
4. **`provider` as `String?`**: Should be an enum (`STRIPE`, `MOYASAR`, `MANUAL`).

---

## 5. Per-Screen Pricing Model

### 5.1 Calculation

```typescript
estimateMonthlyTotal(plan, activeScreens, pricing) {
  if (plan === FREE) return 0;
  const billableScreens = Math.max(0, activeScreens - pricing.includedScreens);
  return pricing.basePrice + billableScreens * pricing.perScreenPrice;
}
```

### 5.2 Issues

1. **No actual per-screen billing**: The pricing model calculates an estimated total but doesn't create actual Stripe charges for overage. This would require:
   - Usage-based billing on Stripe (metered billing)
   - Periodic usage reporting to Stripe
   - Proration for screen additions/removals

2. **No usage caps**: A workspace could add screens beyond their limit (enforced by `assertWithinScreenLimitTx`), but the pricing model doesn't show what happens at the limit.

3. **No currency localization**: All prices in USD. No multi-currency support for international customers.

---

## 6. Frontend Billing UX

### 6.1 Billing Page

- Shows current plan, status, and usage ✅
- Shows active screen count vs limit ✅
- Shows storage usage with progress bar ✅
- Shows estimated monthly total ✅
- "Upgrade Plan" button → Stripe checkout ✅
- "Manage Billing" button → Stripe portal ✅
- Mock plan toggle (dev only) ✅

### 6.2 Issues

1. **No plan comparison table**: Users can't compare plans side-by-side before upgrading.
2. **No invoice history**: `PaymentRecord` model exists but no UI to view payment history.
3. **No proration preview**: When upgrading, users don't see prorated charges before confirming.
4. **No payment method display**: Can't see current payment method (card last 4, expiry) without going to Stripe portal.

---

## 7. Identified Issues

### Critical
- **None** — billing flow is functional and secure.

### High
1. **No usage-based billing implementation**: Per-screen overage pricing is calculated but not actually charged via Stripe. This is a revenue leak if not addressed.
2. **`PaymentRecord` model unused**: No payment records are created from Stripe webhooks.
3. **`amount` as `Float`**: Monetary values should never use floating-point.

### Medium
1. **Pricing hardcoded in code**: Should be in database or config for easy updates.
2. **Mock plan limited to FREE/PRO**: Can't test STARTER/ENTERPRISE in dev.
3. **No invoice PDF generation**: No way to generate or download invoices.
4. **No payment failure notification**: Users aren't notified when payments fail.
5. **Missing webhook event handlers**: `subscription.created`, `invoice.payment_failed` not handled.
6. **No multi-currency support**: All prices in USD only.

### Low
1. **No plan comparison UI**: Users can't compare features side-by-side.
2. **No payment method display**: Requires Stripe portal visit.
3. **No proration preview**: Users don't see prorated amount before upgrade.

---

## 8. Strengths

- Secure Stripe integration with webhook signature verification
- Idempotent webhook processing (no double-charging)
- Transaction-wrapped subscription updates
- Billing portal for self-service payment management
- Mock billing for development (properly guarded)
- Per-screen pricing model with transparent estimation
- Storage quota enforcement
- Screen limit enforcement during pairing
- Real-time subscription update events via WebSocket
- Role-based access (Owner/Admin only for billing actions)
- Configurable success/cancel URLs
- Existing customer reuse (no duplicate Stripe customers)

---

## Reviewer Verification Addendum (v2 — 2026-07-13, Claude)

This file held up well under verification — no false claims found.

**Confirmed-true (keep as-is):**
- `PaymentRecord` is effectively unused (no webhook writes rows) and `amount` is `Float`
  (should be integer cents / `Decimal`) — **verified in schema.**
- Per-screen overage is estimated in code but never charged via Stripe metered billing —
  verified (`estimateMonthlyTotal` is display-only).
- Missing webhook handlers (`customer.subscription.created`, `invoice.payment_failed`) —
  verified against `stripe-webhook.service.ts`.

**Addition:** `nodemailer` (used for invoice/receipt-style email) has a **High CVE**
(mis-delivery to unintended domain) — file 14 §1.1. Relevant if you build invoice emails.
