# Phase 2 — Technical Decisions

## TD-2.1: Password complexity validator as custom decorator

**Decision:** Created a reusable `@MatchesPasswordComplexity()` decorator using `class-validator`'s `registerDecorator` API.

**Rationale:** The decorator can be applied alongside `@MinLength(8)` on any password field. It enforces:
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character

**Alternative considered:** Regex in `@Matches()` — rejected because the error message is less clear and the rule is not reusable.

**Official source:** OWASP Authentication Cheat Sheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## TD-2.2: AES-256-GCM with scryptSync key derivation

**Decision:** Use Node.js built-in `crypto` module with `aes-256-gcm` cipher and `scryptSync` for key derivation.

**Rationale:**
- No external dependency (reduces supply chain risk)
- AES-256-GCM provides authenticated encryption (confidentiality + integrity)
- `scryptSync` is memory-hard, resistant to brute-force attacks
- 96-bit IV (12 bytes) is the recommended length for GCM mode
- Format: `iv:authTag:ciphertext` (all base64) — self-contained, no external metadata

**Alternative considered:** `aes-256-cbc` — rejected because it doesn't provide authentication.

**Official source:**
- OWASP A02:2021 — https://owasp.org/Top10/2021/A02_2021-Cryptographic_Failures/
- Node.js crypto — https://nodejs.org/api/crypto.html

---

## TD-2.3: Backward-compatible decrypt for 2FA secret migration

**Decision:** `CryptoService.decrypt()` returns the original value if it doesn't match the encrypted format (no colons) or if decryption fails.

**Rationale:** Existing 2FA secrets in the database are plaintext. The backward-compatible decrypt allows gradual migration — users with plaintext secrets can still log in, and new enrollments are encrypted. A migration runbook is provided but not required.

**Risk:** LOW — the decrypt method only returns plaintext for values that don't match the encrypted format. Once all secrets are encrypted (via new enrollments or the migration script), this path is never hit.

---

## TD-2.4: Fixed salt for scryptSync

**Decision:** Use a fixed salt `'smart-screen-salt'` for `scryptSync`.

**Rationale:** The same `ENCRYPTION_KEY` env var must always produce the same derived key so previously encrypted values can be decrypted. A random salt would require storing the salt alongside each encrypted value, adding complexity for no security benefit since the key itself is already a secret.

**Risk:** LOW — the security comes from the `ENCRYPTION_KEY` being secret, not from the salt being unique. The salt prevents rainbow table attacks against the key derivation function.

---

## TD-2.5: Remove DevLoginController entirely

**Decision:** Remove the `DevLoginController`, its spec, and the `devLoginAsFirstUser` method from `AuthService`.

**Rationale:** Dev-only code in the production codebase is a security risk. The controller was conditionally registered based on `NODE_ENV`, but the `ENABLE_DEV_LOGIN` env var could accidentally enable it in production.

**Alternative considered:** Keep with stricter guards — rejected because the controller provides no value in production and adds attack surface.

**Official source:** OWASP A05:2021 Security Misconfiguration

---

## TD-2.6: Remove shared PLAYER_HEARTBEAT_SECRET fallback

**Decision:** Screens without a `pairingSecretHash` are rejected. The shared `PLAYER_HEARTBEAT_SECRET` fallback is removed from `realtime.gateway.ts` and `player.service.ts`.

**Rationale:** Shared secrets allow any screen to impersonate any other screen. Per-screen secrets (set during pairing) are the secure approach.

**Impact:** Screens created before the pairing flow (seeded/demo) will need to be re-paired. This is documented in the migration runbook.

**Note:** `PLAYER_HEARTBEAT_SECRET` is still used in `pairing.service.ts` for optional pairing notifications (a UX feature, not screen authentication). This is a non-critical path and the env var is no longer required in production.

**Official source:** OWASP A07:2021 Identification and Authentication Failures

---

## TD-2.7: JWT session revocation on role change

**Decision:** Added `revokeAllSessions()` method to `AuthService` that deletes all refresh tokens and clears the legacy `refreshTokenHash`. Called after `updateMemberRole` in `WorkspacesService` and after `updateUser` in `AdminService` when role-related fields change.

**Rationale:** When a user's role or permissions change, existing JWTs may contain stale role claims. Revoking refresh tokens forces the user to re-authenticate, getting a fresh JWT with updated claims.

**Official source:** OWASP A07:2021 — "When a user's role or permissions change, invalidate existing sessions."

---

## TD-2.8: npm audit blocking in CI

**Decision:** Removed `|| true` from the `npm audit` step in CI, making it blocking.

**Rationale:** Non-blocking audit defeats the purpose of the check. High and critical vulnerabilities should block deployment.

**Official source:** npm audit docs — https://docs.npmjs.com/cli/v8/commands/npm-audit

---

## TD-2.9: Dependabot configuration

**Decision:** Created `.github/dependabot.yml` with weekly updates for npm, Docker, and GitHub Actions ecosystems. Grouped related packages (NestJS, Prisma, React, Next.js, TypeScript) to reduce PR noise.

**Rationale:** Automated dependency updates reduce the window of exposure to known vulnerabilities.

**Official source:** GitHub Dependabot docs — https://docs.github.com/en/code-security/dependabot
