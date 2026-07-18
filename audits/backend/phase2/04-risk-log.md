# Phase 2 — Risk Log

## Risk 2.1: 2FA secret migration for existing users

**Severity:** MEDIUM
**Description:** Existing 2FA secrets in the database are plaintext. The `CryptoService.decrypt()` method has backward compatibility to handle plaintext values, but they remain unencrypted until the user re-enrolls or the migration script is run.
**Mitigation:**
- Backward-compatible decrypt allows gradual migration
- Migration runbook provided in `prisma/migrations/20260719000000_encrypt_2fa_secrets/migration.sql`
- All new 2FA enrollments encrypt the secret automatically
**Residual risk:** LOW — plaintext secrets are only vulnerable if the database is compromised

## Risk 2.2: Screens without per-screen secret lose authentication

**Severity:** MEDIUM
**Description:** Screens created before the pairing flow (seeded/demo screens with `pairingSecretHash: null`) can no longer authenticate after the shared secret fallback is removed.
**Mitigation:**
- These screens must be re-paired via the 6-digit code flow
- The pairing flow assigns a per-screen secret automatically
**Residual risk:** LOW — only affects pre-existing screens in development/staging

## Risk 2.3: ENCRYPTION_KEY loss makes 2FA secrets unrecoverable

**Severity:** HIGH
**Description:** If the `ENCRYPTION_KEY` env var is lost or changed, all encrypted 2FA secrets become undecryptable. Users with 2FA enabled would be unable to log in.
**Mitigation:**
- `ENCRYPTION_KEY` is listed in `assert-production-secrets.ts` as a required production secret
- The backward-compatible decrypt will return the raw value if decryption fails, allowing users to still authenticate (the value is treated as plaintext)
- Key rotation would require decrypting all secrets with the old key and re-encrypting with the new key
**Residual risk:** MEDIUM — key management is a operational responsibility

## Risk 2.4: JWT revocation delays

**Severity:** LOW
**Description:** When a user's role changes, their refresh tokens are revoked, but their current access token remains valid until it expires (default 15 minutes).
**Mitigation:**
- Access token has a short TTL (15 minutes by default)
- Refresh token revocation prevents getting new access tokens
**Residual risk:** LOW — 15-minute window is acceptable for most use cases

## Risk 2.5: npm audit blocking may break CI

**Severity:** LOW
**Description:** Making `npm audit` blocking means CI will fail if there are high or critical vulnerabilities in dependencies. This may block deployment until vulnerabilities are fixed.
**Mitigation:**
- This is the intended behavior — blocking deployment on known vulnerabilities is a security best practice
- Dependabot will automatically create PRs to update vulnerable dependencies
**Residual risk:** LOW — this is a feature, not a bug
