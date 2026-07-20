# Secret Rotation Procedures

## 1. Rotation Procedures

| Secret | Rotation Steps | Downtime |
|---|---|---|
| `JWT_ACCESS_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All existing tokens become invalid. | ~15 min (token expiry) |
| `JWT_REFRESH_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All refresh tokens become invalid. Users must re-login. | None (users re-login) |
| `ENCRYPTION_KEY` | 1. Generate new key. 2. Decrypt all encrypted data with old key. 3. Re-encrypt with new key. 4. Update env var. 5. Restart backend. | **Planned downtime** |
| `PLAYER_HEARTBEAT_SECRET` | 1. Generate new secret. 2. Update env var. 3. Restart backend. 4. All players must re-pair. | None (players reconnect) |
| Stripe secret key | 1. Generate new key in Stripe dashboard. 2. Update env var. 3. Restart backend. | None |
| S3 credentials | 1. Generate new credentials. 2. Update env var. 3. Restart backend. | None |

## 2. Dual-Secret Rotation (Zero Downtime for JWT)

For zero-downtime JWT rotation:

1. Deploy code that accepts both old and new secrets for verification
2. Update env to new secret
3. New tokens are signed with new secret
4. Old tokens are verified with old secret (still accepted)
5. After all old tokens expire (7 days), remove old secret support

```typescript
// JwtModule configuration for dual-secret verification
{
  secretOrKeyProvider: (request, rawJwt, done) => {
    // Try new secret first, fall back to old
    const decoded = jwt.decode(rawJwt);
    const iat = decoded?.iat ?? 0;
    const rotationTime = process.env.JWT_ROTATION_TIME ?? 0;
    const secret = iat < rotationTime
      ? process.env.JWT_ACCESS_SECRET_OLD
      : process.env.JWT_ACCESS_SECRET;
    done(null, secret);
  },
}
```

## 3. Generating New Secrets

```bash
# JWT secrets (256-bit)
openssl rand -base64 64

# Encryption key (256-bit hex)
openssl rand -hex 32
```

## 4. Verification After Rotation

1. Check that new tokens are issued with the new secret
2. Verify old tokens still work during the overlap period (dual-secret mode)
3. Monitor for authentication failures in logs
4. After the overlap period, remove the old secret and verify no tokens reference it
