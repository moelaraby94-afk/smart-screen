# Phase 2 — Official References

## OWASP Top 10 (2021)

### A02:2021 — Cryptographic Failures
- **Used in:** TD-2.2 (CryptoService), TD-2.3 (backward-compatible decrypt)
- **URL:** https://owasp.org/Top10/2021/A02_2021-Cryptographic_Failures/
- **Key guidance:** "Sensitive data must be encrypted at rest using strong cryptographic algorithms."

### A05:2021 — Security Misconfiguration
- **Used in:** TD-2.5 (Remove DevLoginController)
- **URL:** https://owasp.org/Top10/2021/A05_2021-Security_Misconfiguration/
- **Key guidance:** "Remove unused features and code to reduce attack surface."

### A07:2021 — Identification and Authentication Failures
- **Used in:** TD-2.6 (Remove shared secret), TD-2.7 (JWT session revocation)
- **URL:** https://owasp.org/Top10/2021/A07_2021-Identification_and_Authentication_Failures/
- **Key guidance:** "When a user's role or permissions change, invalidate existing sessions."

## OWASP Cheat Sheets

### Authentication Cheat Sheet
- **Used in:** TD-2.1 (Password complexity)
- **URL:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Key guidance:** "Passwords should meet complexity requirements: min 8 chars, uppercase, lowercase, digit, special character."

## Node.js

### Crypto Module
- **Used in:** TD-2.2 (AES-256-GCM, scryptSync)
- **URL:** https://nodejs.org/api/crypto.html
- **Key APIs:** `createCipheriv`, `createDecipheriv`, `scryptSync`, `randomBytes`, `getAuthTag`

## npm

### npm audit
- **Used in:** TD-2.8 (CI audit gate)
- **URL:** https://docs.npmjs.com/cli/v8/commands/npm-audit
- **Key guidance:** `--audit-level=high` fails on high and critical vulnerabilities.

## GitHub

### Dependabot
- **Used in:** TD-2.9 (Dependabot config)
- **URL:** https://docs.github.com/en/code-security/dependabot
- **Key guidance:** Automated dependency updates for npm, Docker, and GitHub Actions.

## NestJS

### Testing
- **Used in:** Test updates for new constructor arguments
- **URL:** https://docs.nestjs.com/fundamentals/testing
- **Key guidance:** `Test.createTestingModule()` with providers for dependency injection.

### Circular Dependencies
- **Used in:** TD-2.7 (AuthService injection into WorkspacesService)
- **URL:** https://docs.nestjs.com/fundamentals/circular-dependency
- **Key guidance:** Use `forwardRef()` to resolve circular module dependencies.
