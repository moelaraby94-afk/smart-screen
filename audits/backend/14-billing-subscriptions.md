# 14 — Billing & Subscriptions Audit

> **Objective:** Evaluate the billing system: subscription plans, Stripe integration, webhook processing, invoice handling, metered usage, and dunning management.

---

## 1. Current State

Billing is implemented across three modules: `domains/subscriptions/` (plan management), `domains/stripe/` (checkout + portal), and `domains/webhooks/` (Stripe webhook processing). The system supports 4 plans (FREE, STARTER, PRO, ENTERPRISE) with screen and storage limits, Stripe Checkout for payment, and Stripe Billing Portal for self-service.

---

## 2. What Exists

### Subscription Plans
| Plan | Seats | Screen Limit | Storage | Price |
|------|-------|-------------|---------|-------|
| FREE | 5 | 25 | 5GB | $0 |
| STARTER | 15 | 100 | 50GB | Stripe |
| PRO | 25 | 500 | 50GB | Stripe |
| ENTERPRISE | 100 | 2,000 | Custom | Stripe |

### Subscription Model
- `Subscription` with: `plan`, `status` (TRIALING/ACTIVE/PAST_DUE/CANCELED/EXPIRED), `seats`, `screenLimit`, `storageLimitBytes` (BigInt), `currentPeriodEnd`, Stripe IDs (`stripeCustomerId`, `stripeSubscriptionId`)
- One subscription per workspace (`@@unique` on `workspaceId`)

### Stripe Integration
- **Checkout:** `POST /stripe/checkout` — Creates Stripe Checkout Session for plan upgrade (OWNER/ADMIN only, throttled 10/min)
- **Billing Portal:** `POST /stripe/portal` — Creates Stripe Billing Portal Session for self-service (OWNER/ADMIN only, throttled 10/min)
- **SDK:** `stripe` npm package, initialized with `STRIPE_SECRET_KEY`
- **Mock billing:** `PATCH /subscriptions/mock-plan` — Set plan without Stripe (dev/staging only, guarded by `assertMockBillingAllowed`)

### Stripe Webhook Processing
- `POST /webhooks/stripe` — Raw body, signature verification (`stripe-signature` header), no rate limiting (Stripe delivers bursts)
- **Idempotency:** `ProcessedWebhookEvent` model with unique `(provider, externalId)` — prevents duplicate processing
- **Handled events:**
  - `checkout.session.completed` — Apply subscription from checkout metadata
  - `customer.subscription.updated` — Sync subscription status and plan
  - `customer.subscription.deleted` — Mark subscription as CANCELED
  - `invoice.payment_succeeded` — (processed but no specific action documented)
  - `invoice.payment_failed` — (processed but no specific action documented)
- **Unhandled events:** Logged with warning, no action taken

### Customer Webhooks (Outgoing)
- `WebhookEndpoint` model — Workspace can register webhook URLs for events
- CRUD: create, list, delete, toggle, test
- Events: configurable per endpoint
- **SSRF protection:** URL validation in `WebhooksService` blocks private IP ranges
- **Delivery:** `WebhooksService.deliver()` sends HTTP POST with HMAC signature
- **No retry policy:** Failed deliveries are not retried

### Subscription Enforcement
- **Screen limit:** `ScreensService.assertWithinScreenLimit()` — Checks `Subscription.screenLimit` before screen creation
- **Storage limit:** `MediaService` — Checks `Subscription.storageLimitBytes` before upload
- **No seat limit enforcement:** `Subscription.seats` exists but no check on workspace member count

### Subscription Sync
- `SubscriptionsService.applyTrustedCheckoutUsingClient()` — Updates subscription from Stripe checkout data
- Supports transaction client for atomic updates
- Updates: plan, status, seats, screenLimit, currentPeriodEnd, storageLimitBytes, Stripe IDs

---

## 3. What Is Missing

1. **No invoice generation/storage** — `PaymentRecord` model exists in schema but Stripe webhook handler doesn't create payment records. No invoice PDF storage or retrieval.

2. **No dunning management** — When `invoice.payment_failed` fires, no retry logic, no email notification, no grace period. Subscription goes to `PAST_DUE` but no automated recovery.

3. **No seat limit enforcement** — `Subscription.seats` is stored but never checked. A FREE plan (5 seats) can have unlimited workspace members.

4. **No proration handling** — When upgrading from STARTER to PRO mid-cycle, no proration calculation. Relies entirely on Stripe's proration.

5. **No trial period management** — `SubscriptionStatus.TRIALING` exists but no endpoint to start a trial, no trial expiry notification, no trial-to-paid conversion flow.

6. **No metered usage** — No usage-based billing. Storage and screen counts are flat-rate per plan. No `UsageRecord` sent to Stripe for metered billing.

7. **No coupon/discount support** — No endpoint to apply coupon codes or promotional discounts.

8. **No tax handling** — No tax calculation, no VAT/GST support. Relies on Stripe Tax or manual configuration.

9. **No currency support** — All amounts assumed in USD. No multi-currency support.

10. **No refund processing** — No endpoint to initiate or process refunds. Must be done in Stripe Dashboard.

11. **No subscription cancellation flow** — No endpoint to cancel subscription from the app. Users must use Stripe Billing Portal.

12. **No webhook retry for customer webhooks** — Failed webhook deliveries are not retried. No dead letter queue.

13. **No webhook delivery logs** — No record of webhook delivery attempts, success/failure, response status.

14. **No Stripe customer email sync** — When Stripe updates customer email, it's not synced back to the User model.

---

## 4. Problems

1. **`invoice.payment_failed` has no action** — The webhook is processed (idempotency check passes) but no business logic executes. Subscription goes to `PAST_DUE` but no email, no notification, no grace period.

2. **No Stripe webhook event for `customer.subscription.created`** — New subscriptions created directly in Stripe (not via checkout) won't be synced.

3. **Mock billing in non-production** — `assertMockBillingAllowed` checks `NODE_ENV !== 'production'` but if someone accidentally sets `NODE_ENV=staging`, mock billing is available.

4. **No subscription status sync on login** — When a user logs in, subscription status is not validated against Stripe. A canceled subscription in Stripe might still show as ACTIVE in the app.

5. **`PaymentRecord` model is unused** — Defined in schema but never written to. Adds confusion.

6. **No Stripe webhook signature verification timeout** — Stripe signatures have a 5-minute tolerance. No explicit check for replay attacks beyond this.

---

## 5. Risks

- **High: No dunning** — Failed payments lead to silent subscription degradation.
- **High: No seat enforcement** — Plan limits are not enforced for team members.
- **Medium: No subscription sync on login** — Stale subscription status.
- **Medium: No webhook retry** — Customer webhooks silently fail.
- **Low: Unused PaymentRecord** — Schema confusion.

---

## 6. Priority: **High**

Billing is functional for basic Stripe checkout but lacks dunning, seat enforcement, and invoice management.

---

## 7. Completion Percentage: **78%**

Stripe checkout, portal, webhook processing with idempotency, and subscription enforcement (screen/storage) are implemented. Missing: dunning, seat enforcement, invoices, trials, refunds, webhook retries.

---

## 8. Recommendations

1. Implement dunning flow: on `invoice.payment_failed`, send email, start 7-day grace period, then downgrade to FREE
2. Add seat limit enforcement in workspace member creation/invite acceptance
3. Create `PaymentRecord` entries from `invoice.payment_succeeded` webhook events
4. Add `POST /subscriptions/cancel` endpoint for in-app cancellation
5. Add subscription status sync: on user login, fetch subscription from Stripe and sync
6. Add trial period flow: `POST /subscriptions/start-trial` with 14-day trial
7. Add webhook delivery logs: `WebhookDeliveryLog` model with `endpointId`, `event`, `status`, `response`, `attemptedAt`
8. Add webhook retry policy: 3 retries with exponential backoff (1m, 10m, 1h)
9. Handle `customer.subscription.created` webhook event
10. Add coupon code support: `POST /subscriptions/apply-coupon`
11. Remove or fully implement `PaymentRecord` model
12. Add `STRIPE_WEBHOOK_TOLERANCE` env var for signature verification timeout

---

## 9. Future Tasks

- [ ] Implement dunning flow with grace period
- [ ] Add seat limit enforcement
- [ ] Create PaymentRecord from invoice webhook
- [ ] Add in-app subscription cancellation
- [ ] Add subscription status sync on login
- [ ] Add trial period flow
- [ ] Add webhook delivery logs
- [ ] Add webhook retry policy
- [ ] Handle customer.subscription.created event
- [ ] Add coupon code support
- [ ] Clean up PaymentRecord model
- [ ] Add Stripe webhook tolerance config
