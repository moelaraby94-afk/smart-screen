# Secret Rotation Strategy

## Overview

This document outlines the strategy for rotating secrets used by the Cloud-Screen backend.

## Secrets Inventory

| Secret | Environment Variable | Rotation Frequency | Impact of Rotation |
|--------|---------------------|--------------------|--------------------|
| JWT Access Secret | `JWT_ACCESS_SECRET` | 90 days | All active tokens invalidated |
| JWT Refresh Secret | `JWT_REFRESH_SECRET` | 90 days | All refresh sessions invalidated |
| Encryption Key | `ENCRYPTION_KEY` | 180 days | Requires re-encryption of stored data |
| Stripe Secret Key | `STRIPE_SECRET_KEY` | 90 days (Stripe dashboard) | Payment processing |
| Stripe Webhook Secret | `STRIPE_WEBHOOK_SECRET` | On webhook recreation | Webhook verification |
| SMTP Password | `SMTP_HOST` (via password) | 90 days | Email sending |
| Resend API Key | `RESEND_API_KEY` | 90 days | Email sending |
| SendGrid API Key | `SENDGRID_API_KEY` | 90 days | Email sending |
| OpenAI API Key | `OPENAI_API_KEY` | 90 days | AI features fallback |
| ClamAV credentials | `CLAMAV_HOST` | N/A (internal) | Virus scanning |
| Sentry DSN | `SENTRY_DSN` | On project recreation | Error tracking |

## Rotation Procedure

### 1. JWT Secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`)

1. Generate new secret: `openssl rand -hex 64`
2. Update environment variable in all environments (staging → production)
3. Deploy backend with new secret
4. Old tokens become invalid immediately — users will need to re-authenticate
5. Monitor `SecurityEventLog` for spike in `JWT_INVALID` events
6. After 24h, remove old secret from configuration

**Zero-downtime approach**: Set `JWT_ACCESS_SECRET_PREVIOUS` to the old value. The auth middleware checks against both secrets during the transition window (15 minutes for access tokens, 7 days for refresh tokens).

### 2. Encryption Key (`ENCRYPTION_KEY`)

1. Generate new key: `openssl rand -hex 32`
2. Set `ENCRYPTION_KEY_NEW` alongside existing `ENCRYPTION_KEY`
3. Deploy a migration script that:
   - Reads all encrypted records using the old key
   - Re-encrypts using the new key
   - Marks records as migrated
4. Once migration completes, set `ENCRYPTION_KEY` to the new value
5. Remove `ENCRYPTION_KEY_NEW` after verification

### 3. Third-Party API Keys (Stripe, Email, OpenAI)

1. Create new key in provider dashboard
2. Add new key as `_NEW` environment variable
3. Deploy with both keys — services should prefer `_NEW` if present
4. Verify functionality with new key
5. Revoke old key in provider dashboard
6. Remove old key from environment

### 4. Database URL (`DATABASE_URL`)

1. Create new database user with same permissions
2. Update `DATABASE_URL` with new credentials
3. Deploy during maintenance window
4. Revoke old database user

## Automation

- **Kubernetes**: Use Sealed Secrets or External Secrets Operator with automatic rotation
- **Docker Compose**: Use `.env` file with secrets manager integration (e.g., Doppler, Vault)
- **Monitoring**: Alert when secrets are within 14 days of rotation deadline
- **Audit**: Log all secret rotations in `SecurityEventLog` with type `SECRET_ROTATED`

## Emergency Rotation

In case of suspected compromise:
1. Immediately rotate all secrets in order: JWT → Encryption → Third-party → Database
2. Revoke all active sessions (`SessionRevocationService.revokeAll()`)
3. Log security event: `SECURITY_BREACH` with severity `CRITICAL`
4. Notify all users to re-authenticate
5. Review `SecurityEventLog` for unauthorized access patterns
