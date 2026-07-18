# 12 — Notifications Audit

> **Objective:** Evaluate the notification system: in-app notifications, email notifications, push notifications, preferences, and real-time delivery.

---

## 1. Current State

Notifications are implemented in `domains/notifications/` with a single controller and service. The system supports **in-app notifications only** — no email notifications, no push notifications, no SMS. `EmailService` exists but is only used for auth flows (OTP, password reset, welcome).

---

## 2. What Exists

### In-App Notifications
- **List:** `GET /notifications` — Returns `{ items: NotificationRow[], unreadCount }`
- **Mark read:** `PATCH /notifications/:id/read`
- **Mark all read:** `POST /notifications/mark-all-read`
- **No pagination** — Returns all notifications (unbounded)

### Notification Preferences
- **Get:** `GET /notifications/preferences` — Returns `{ preferences: Record<string, boolean> }`
- **Update:** `PATCH /notifications/preferences` — Enable/disable notification types

### Notification Model (from Prisma schema)
- `Notification` model with: `userId`, `type` (String), `title`, `message`, `read` (Boolean), `createdAt`
- Index on `userId + read + createdAt` for unread query optimization

### Email Service (`domains/email/`)
- **Providers:** Resend, SendGrid, SMTP (checked in that order)
- **Templates:** `registerOtpEmail`, `passwordResetEmail`, `welcomeEmail`
- **Configuration:** `RESEND_API_KEY`, `SENDGRID_API_KEY`, `SMTP_HOST/PORT/USER/PASS/SECURE`
- **From header:** `EMAIL_FROM_NAME` + `EMAIL_FROM`
- **No queue:** Emails are sent synchronously in the request handler

### Email Templates (3 only)
1. **Registration OTP** — Sent during registration verification
2. **Password reset** — Sent when user requests password reset
3. **Welcome email** — Sent after successful registration

---

## 3. What Is Missing

### Email Notifications (None implemented)
1. **No screen offline alert** — When a screen goes offline, no email is sent to workspace owners
2. **No pairing success email** — When a screen is paired, no confirmation email
3. **No team invite email** — `WorkspaceInvitation` model exists but no email is sent
4. **No subscription expiry warning** — No email before subscription expires
5. **No campaign approval email** — No notification to approvers or submitters
6. **No password changed notification** — No email after password change
7. **No 2FA disabled notification** — No email when 2FA is turned off
8. **No media expiry warning** — No email before media expires
9. **No storage quota warning** — No email when storage is near limit
10. **No screen limit warning** — No email when screen count approaches limit

### Push Notifications
11. **No push notification service** — No FCM (Firebase Cloud Messaging) or APNs (Apple Push Notification Service)
12. **No push token storage** — No model to store device push tokens
13. **No push notification preferences** — Can't toggle push per notification type

### Real-Time Delivery
14. **No Socket.IO push for notifications** — Notifications are created in DB but not pushed to dashboard in real-time. Dashboard must poll `GET /notifications`.
15. **No notification badge update** — No event to update the unread count badge in real-time

### Notification Management
16. **No notification deletion** — Can't delete individual notifications
17. **No notification categories** — No filtering by type (screen, billing, team, system)
18. **No notification search** — Can't search notification content
19. **No notification expiry** — Old notifications are never automatically deleted
20. **No pagination** — All notifications returned in one response

### Template Management
21. **No email template editor** — Templates are hardcoded in `email-templates.ts`
22. **No email preview** — Can't preview email before sending
23. **No email test endpoint** — Can't send a test email to verify configuration
24. **No email delivery tracking** — No record of sent emails, no bounce handling

---

## 4. Problems

1. **Synchronous email sending** — `EmailService.sendMail()` is called in the request handler. If the email provider is slow, the HTTP response is delayed. Should use a queue.

2. **No email queue** — No Bull/BullMQ integration. Failed emails are lost. No retry mechanism.

3. **No notification creation from services** — `NotificationsService` has `create()` but it's unclear which services call it. No systematic notification creation on events (screen offline, campaign approved, etc.).

4. **Preferences are generic** — `Record<string, boolean>` with no defined keys. No documentation of which notification types exist.

5. **No notification batching** — If 10 screens go offline simultaneously, 10 notifications are created. Should batch into one.

---

## 5. Risks

- **High: No email notifications** — Users are unaware of critical events (screen offline, subscription expiry) without checking the dashboard.
- **Medium: Synchronous email** — Slow email providers degrade API response times.
- **Medium: No real-time notification push** — Dashboard notification badge is stale until page refresh.
- **Low: No push notifications** — Mobile users miss important alerts.

---

## 6. Priority: **Medium**

In-app notifications exist but email notifications and real-time delivery are critical gaps.

---

## 7. Completion Percentage: **72%**

In-app notification CRUD and preferences are implemented. Missing: email notifications (10+ types), push notifications, real-time delivery, pagination, batching, queue.

---

## 8. Recommendations

1. Add email notification flows for all critical events:
   - Screen offline (with 5-min debounce to avoid flapping)
   - Team invite (with accept/reject links)
   - Campaign approval/rejection
   - Subscription expiry (7 days before)
   - Password changed
   - 2FA disabled
   - Storage/screen limit warning (at 80%)
2. Add BullMQ email queue with Redis for async email sending with retries
3. Add Socket.IO event `notification:new` pushed to `user:{id}` room on notification creation
4. Add notification pagination with `PaginationQueryDto`
5. Add notification deletion: `DELETE /notifications/:id`
6. Add notification categories and filtering: `GET /notifications?type=screen`
7. Add notification expiry cron job: delete notifications older than 90 days
8. Add email test endpoint: `POST /admin/email/test` (admin only)
9. Add email delivery tracking: `EmailLog` model with `to`, `subject`, `status`, `error`, `sentAt`
10. Add notification batching: group screen offline events within 5 minutes into one notification
11. Define notification type constants in an enum
12. Add push notification service with FCM/APNs integration

---

## 9. Future Tasks

- [ ] Implement email notifications for all critical events
- [ ] Add BullMQ email queue with Redis
- [ ] Add real-time notification push via Socket.IO
- [ ] Add notification pagination
- [ ] Add notification deletion
- [ ] Add notification categories and filtering
- [ ] Add notification expiry cron job
- [ ] Add email test endpoint
- [ ] Add email delivery tracking
- [ ] Add notification batching
- [ ] Define notification type enum
- [ ] Add push notification service (FCM/APNs)
