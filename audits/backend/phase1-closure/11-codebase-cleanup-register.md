# 11 — Codebase Cleanup Register

> **Date:** 2025-07-18  
> **Method:** Full-text search of `apps/backend/src/` for: `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`, `WORKAROUND`, `deprecated`, `legacy`, `unsafe`, `eslint-disable`  
> **Scope:** Backend source code only

---

## Summary

| Category | Count |
|----------|-------|
| Legacy Code Patterns | 4 |
| Deprecated Models | 2 |
| ESLint Suppressions | 3 |
| `as any` Casts | 2 |
| `console.*` Usage | 2 |
| TODO/FIXME/HACK/XXX/TEMP/WORKAROUND | 0 |
| **Total** | **13** |

---

## 1. Legacy Code Patterns (4)

### CP-001

| Field | Value |
|-------|-------|
| **ID** | CP-001 |
| **Pattern** | `legacy` |
| **Location** | `apps/backend/src/domains/auth/auth.service.ts:757` |
| **Code** | `// Legacy path: token has no sid claim (pre-migration).` |
| **Description** | Refresh token fallback for pre-migration tokens without `sid` claim. Uses `refreshTokenHash` on `User` model instead of `RefreshToken` table. |
| **Severity** | P3 Low |
| **Status** | Active — backward compatibility |
| **Planned Fix** | Phase 2 — remove after all tokens rotated |
| **Notes** | Test coverage: `auth-refresh-session.spec.ts` Test 3, 3b. Legacy hash cleared after successful refresh. |

### CP-002

| Field | Value |
|-------|-------|
| **ID** | CP-002 |
| **Pattern** | `legacy` |
| **Location** | `apps/backend/src/domains/realtime/realtime.gateway.ts:386` |
| **Code** | `/** Legacy ping — treated as heartbeat for players already registered. */` |
| **Description** | `handlePing` handler treats `ping` event as heartbeat for backward compatibility with older player apps. |
| **Severity** | P3 Low |
| **Status** | Active — backward compatibility |
| **Planned Fix** | Future — remove when all players updated to use heartbeat |
| **Notes** | Only fires for already-registered screens. No security risk. |

### CP-003

| Field | Value |
|-------|-------|
| **ID** | CP-003 |
| **Pattern** | `legacy` |
| **Location** | `apps/backend/src/domains/admin/admin-runtime.store.ts:15-18` |
| **Code** | `/** Legacy: external URL fallback (English) */ logoUrlEn: string;` and `/** Legacy: external URL fallback (Arabic) */ logoUrlAr: string;` |
| **Description** | Admin branding store has legacy logo URL fields for external URL fallback. Replaced by `logoAssetEnLight` etc. |
| **Severity** | P3 Low |
| **Status** | Active — backward compatibility |
| **Planned Fix** | Phase 2 — remove if no longer used |
| **Notes** | Kept for backward compatibility with existing admin configurations. |

### CP-004

| Field | Value |
|-------|-------|
| **ID** | CP-004 |
| **Pattern** | `legacy` |
| **Location** | `apps/backend/src/domains/pairing/pairing-to-bootstrap.integration.spec.ts:534-553` |
| **Code** | `fakePrisma.screens.set('legacy', { id: 'legacy', ... name: 'Legacy Screen', ... })` |
| **Description** | Test fixture for legacy screen without `pairingSecretHash`. Tests shared-secret fallback. |
| **Severity** | P3 Low |
| **Status** | Active — test coverage for KI-017 |
| **Planned Fix** | Remove when KI-017 is resolved (shared secret fallback retired) |
| **Notes** | Test verifies backward compatibility. Not production code. |

---

## 2. Deprecated Models (2)

### CP-005

| Field | Value |
|-------|-------|
| **ID** | CP-005 |
| **Pattern** | `deprecated` |
| **Location** | `apps/backend/prisma/schema.prisma:806` |
| **Code** | `/// Deprecated: legacy table kept for DB compatibility. Pairing is ScreenPairingSession only.` |
| **Description** | `WorkspacePairingCode` model — deprecated, unused. Kept for DB compatibility. |
| **Severity** | P3 Low |
| **Status** | See KI-019 |
| **Planned Fix** | Phase 2 — remove in next migration |
| **Notes** | No code references this model. |

### CP-006

| Field | Value |
|-------|-------|
| **ID** | CP-006 |
| **Pattern** | `deprecated` (implicit) |
| **Location** | `apps/backend/prisma/schema.prisma:293` |
| **Code** | `model PaymentRecord { ... }` |
| **Description** | `PaymentRecord` model defined but never written to in production code. Only mocked in tests. |
| **Severity** | P3 Low |
| **Status** | See KI-020 |
| **Planned Fix** | Phase 3 (Billing) — implement or remove |
| **Notes** | Test `stripe-webhook.t3-4.spec.ts` mocks `paymentRecord.create`. |

---

## 3. ESLint Suppressions (3)

### CP-007

| Field | Value |
|-------|-------|
| **ID** | CP-007 |
| **Pattern** | `eslint-disable` |
| **Location** | `apps/backend/src/common/storage/s3-storage.service.ts:115` |
| **Code** | `// eslint-disable-next-line @typescript-eslint/no-unused-vars` |
| **Description** | `ensureDir(_keyPrefix: string)` — parameter unused because S3 has no directories. Prefix `_` convention not recognized by ESLint config. |
| **Severity** | P3 Low |
| **Status** | Accepted — interface requires parameter |
| **Planned Fix** | N/A — correct suppression for interface compliance |
| **Notes** | `IStorageService.ensureDir()` requires the parameter. S3 implementation is a no-op. |

### CP-008

| Field | Value |
|-------|-------|
| **ID** | CP-008 |
| **Pattern** | `eslint-disable` |
| **Location** | `apps/backend/src/domains/realtime/realtime.gateway.spec.ts:1` |
| **Code** | `/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-floating-promises */` |
| **Description** | Test file uses `as any` casts for Socket.IO mock objects and doesn't await all promises. |
| **Severity** | P3 Low |
| **Status** | Accepted — test file |
| **Planned Fix** | Phase 2 — improve test typing if time permits |
| **Notes** | Common pattern in NestJS WebSocket testing. |

### CP-009

| Field | Value |
|-------|-------|
| **ID** | CP-009 |
| **Pattern** | `eslint-disable` |
| **Location** | `apps/backend/src/common/config/cors-config.spec.ts:1` |
| **Code** | `/* eslint-disable @typescript-eslint/no-unused-vars */` |
| **Description** | Test file has unused vars from imports. |
| **Severity** | P3 Low |
| **Status** | Pre-existing |
| **Planned Fix** | Phase 2 — clean up imports |
| **Notes** | Minor test file issue. |

---

## 4. `as any` Casts (2)

### CP-010

| Field | Value |
|-------|-------|
| **ID** | CP-010 |
| **Pattern** | `as any` |
| **Location** | `apps/backend/src/domains/playlists/playlists.service.ts:103` |
| **Code** | `return buildPage(serialized as any, total, query);` |
| **Description** | Type assertion to `any` to satisfy `buildPage` generic. Causes `no-unsafe-argument` ESLint warning. |
| **Severity** | P3 Low |
| **Status** | See KI-015 |
| **Planned Fix** | Phase 2 — properly type `buildPage` or serialized output |
| **Notes** | Pre-existing. Not a runtime risk — types are correct at runtime. |

### CP-011

| Field | Value |
|-------|-------|
| **ID** | CP-011 |
| **Pattern** | `as any` |
| **Location** | `apps/backend/src/domains/realtime/realtime.gateway.spec.ts` (30+ occurrences) |
| **Code** | `gateway.handleConnection(sock as any)`, `gateway.handleScreenRegister(sock as any, ...)` etc. |
| **Description** | Socket.IO mock objects cast to `any` for test simplicity. |
| **Severity** | P3 Low |
| **Status** | Accepted — test file |
| **Planned Fix** | Phase 2 — create proper Socket mock type |
| **Notes** | Common pattern in NestJS WebSocket testing. |

---

## 5. `console.*` Usage (2)

### CP-012

| Field | Value |
|-------|-------|
| **ID** | CP-012 |
| **Pattern** | `console.log` / `console.warn` |
| **Location** | `apps/backend/src/main.ts:17,19` |
| **Code** | `console.log('Database connection attempt...');` and `console.warn('DATABASE_URL is not set; ...')` |
| **Description** | Bootstrap uses `console.log`/`console.warn` before NestJS logger is initialized. |
| **Severity** | P3 Low |
| **Status** | Accepted — pre-logger bootstrap |
| **Planned Fix** | N/A — `console.*` is the only option before NestJS app creation |
| **Notes** | These lines execute before `NestFactory.create()`. No Logger available yet. |

### CP-013

| Field | Value |
|-------|-------|
| **ID** | CP-013 |
| **Pattern** | `console.log` / `console.error` |
| **Location** | `apps/backend/src/common/prisma/prisma.service.ts:46,48` |
| **Code** | `console.log('Prisma: connected to database.');` and `console.error('Prisma: $connect failed ...', err);` |
| **Description** | PrismaService uses `console.*` for connect/disconnect logging. |
| **Severity** | P3 Low |
| **Status** | Pre-existing |
| **Planned Fix** | Phase 2 — use NestJS Logger if possible |
| **Notes** | `PrismaService` extends `PrismaClient` which doesn't have NestJS Logger injection. Could use static `Logger` class. |

---

## 6. TODO / FIXME / HACK / XXX / TEMP / WORKAROUND (0)

**Result:** No `TODO`, `FIXME`, `HACK`, `XXX`, `TEMP`, or `WORKAROUND` comments found in `apps/backend/src/`.

Search command:
```
grep -rn "// TODO\|// FIXME\|// HACK\|// XXX\|// TEMP\|// WORKAROUND" apps/backend/src/
```

**This is a positive finding** — the codebase does not contain any outstanding work markers.

---

## Cross-Reference

| Category | IDs | Count |
|----------|-----|-------|
| Legacy Code Patterns | CP-001, CP-002, CP-003, CP-004 | 4 |
| Deprecated Models | CP-005, CP-006 | 2 |
| ESLint Suppressions | CP-007, CP-008, CP-009 | 3 |
| `as any` Casts | CP-010, CP-011 | 2 |
| `console.*` Usage | CP-012, CP-013 | 2 |
| TODO/FIXME/HACK/XXX/TEMP/WORKAROUND | — | 0 |
| **Total** | | **13** |
