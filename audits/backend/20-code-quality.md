# 20 — Code Quality Audit

> **Objective:** Evaluate code quality: patterns, consistency, naming conventions, documentation, error handling, and maintainability.

---

## 1. Current State

The backend code quality is **good overall**. The team follows NestJS conventions, uses TypeScript strict mode, has consistent naming, and includes meaningful inline documentation. Error handling is centralized and well-structured.

---

## 2. What Exists

### Code Patterns (Positive)

#### Consistent Module Structure
Each domain module follows the NestJS pattern:
```
domains/{module}/
├── {module}.controller.ts
├── {module}.service.ts
├── {module}.module.ts
├── dto/
│   ├── create-{entity}.dto.ts
│   └── update-{entity}.dto.ts
└── {module}.spec.ts (when present)
```

#### Centralized Error Handling
- `DomainException` — Custom exception with stable `ErrorCode`
- `AllExceptionsFilter` — Global filter normalizes all exceptions to `ApiErrorBody`
- `normalizeHttpError()` — Converts NestJS exceptions, validation errors, and unhandled errors
- Error codes are part of the public API contract (never renamed)
- Unhandled errors never leak stack traces or internal messages

#### TypeScript Strict Mode
- `strict: true` in `tsconfig.json`
- `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` enabled
- Prisma generates types from schema
- DTOs use `class-validator` + `class-transformer`

#### Meaningful Documentation
- Inline comments explain "why" not "what"
- `DomainException` and `ErrorCode` have JSDoc explaining the contract
- `AllExceptionsFilter` has detailed comment explaining WebSocket vs HTTP handling
- `assertProductionSecretsAreSet` explains the threat model
- `AccountContextHelper` has resolution order documented
- `JwtStrategy` explains the `typ` claim rationale

#### Consistent Naming
- Files: kebab-case (`screen-heartbeat.service.ts`)
- Classes: PascalCase (`ScreenHeartbeatService`)
- Methods: camelCase (`assertWithinScreenLimit`)
- DTOs: PascalCase with suffix (`CreateScreenDto`)
- Enums: PascalCase with PascalCase values (`ScreenStatus.ONLINE`)

#### Guard/Decorator Pattern
- `@UseGuards(JwtAuthGuard, RolesGuard)` on controllers
- `@Roles(UserRole.OWNER, UserRole.ADMIN)` on methods
- `@CurrentUser()` custom decorator for JWT user
- `@Throttle()` for per-endpoint rate limiting
- `@SkipThrottle()` for exempt endpoints
- `@PlatformRoles()` for admin endpoints

#### Prisma Best Practices
- `select` used in several queries to limit returned fields
- `include` used for relations where needed
- Transactions used in critical operations (pairing, subscription sync)
- Cascade deletes configured on relations
- `onDelete: Restrict` on user relations to prevent orphaned content

### Code Patterns (Negative)

#### Inconsistencies
1. **DTO naming:** Some use `Create*Dto`, others use `*Dto` (e.g., `LoginDto` not `CreateLoginDto`)
2. **Spec naming:** `*.service.spec.ts`, `*.p2-t1.spec.ts`, `*.t3-4.spec.ts` — three different conventions
3. **Response shapes:** Some endpoints return Prisma models, others return custom objects, others return `{ ok: true }`
4. **workspaceId source:** Some controllers use `@Query('workspaceId')`, others use `@Param('workspaceId')`, others use `@Headers('x-workspace-id')`
5. **Error throwing:** Some services throw `DomainException`, others throw `BadRequestException` or `NotFoundException` directly

#### Code Smells
1. **`AuthService` is 1,106 lines** — Too large for a single service. Should be decomposed.
2. **`forwardRef` between Auth and Workspaces** — Circular dependency workaround
3. **Inline DTOs** — Some endpoints accept `@Body() body: { preferences: Record<string, boolean> }` instead of a proper DTO class
4. **Magic numbers** — `150 * 1024 * 1024` for max file size, `5 * 1024 * 1024 * 1024` for 5GB. Should be named constants.
5. **String literals for events** — Socket.IO event names are string literals (`'screen:register'`, `'screen:status'`). Should be constants in an enum.

#### Missing Quality Measures
1. **No ESLint strict rules** — ESLint config exists but strictness unclear
2. **No Prettier enforcement** — `.prettierrc` exists but no CI check
3. **No import ordering** — No `eslint-plugin-import` for consistent import order
4. **No circular dependency detection** — No `eslint-plugin-import` cycle detection
5. **No comment linting** — No `eslint-plugin-jsdoc` for JSDoc validation

---

## 3. What Is Missing

1. **No API response serialization** — Prisma models returned directly. Internal fields (`createdAt`, `updatedAt`) exposed. No DTO for responses.

2. **No shared constants file** — Magic numbers and string literals scattered across the codebase. No `constants/` directory.

3. **No event name constants** — Socket.IO event names are string literals. Typo risk.

4. **No enum for notification types** — `Notification.type` is a `String`. No enum or constant list.

5. **No enum for schedule recurrence** — `Schedule.recurrence` is a `String`. Should be an enum.

6. **No response DTOs** — Only request DTOs exist. No `ResponseDto` or serialization class.

7. **No API contract testing** — No test verifies that response shapes match expected contracts.

8. **No code documentation generation** — No TypeDoc or TSDoc generated documentation.

---

## 4. Problems

1. **Inconsistent error types** — Some services use `DomainException` with proper error codes, others use NestJS built-in exceptions (`BadRequestException`, `NotFoundException`) which get generic error codes. This means clients can't always switch on `code` for specific handling.

2. **No response transformation** — Prisma models include `createdAt`, `updatedAt`, and other internal fields. Clients receive more data than needed, and the API contract is tightly coupled to the DB schema.

3. **`AuthService` too large** — 1,106 lines covering registration, login, 2FA, password reset, token management, and impersonation. Hard to test, hard to maintain.

4. **No shared constants** — File size limits, storage limits, throttle rates, and event names are hardcoded in individual files. Changing a value requires finding all occurrences.

---

## 5. Risks

- **Medium: Inconsistent error types** — Clients can't reliably switch on error codes
- **Medium: No response serialization** — API contract coupled to DB schema
- **Low: AuthService size** — Maintainability risk
- **Low: No shared constants** — DRY violation, change risk

---

## 6. Priority: **Medium**

Code quality is good. Inconsistencies and missing serialization are the main gaps.

---

## 7. Completion Percentage: **80%**

Clean patterns, consistent naming, good documentation, centralized error handling. Missing: response serialization, shared constants, event name constants, AuthService decomposition.

---

## 8. Recommendations

1. Create `common/constants/` directory with:
   - `media.constants.ts` — `MAX_UPLOAD_BYTES`, `ALLOWED_MIME_TYPES`
   - `events.constants.ts` — Socket.IO event name constants
   - `notification-types.constants.ts` — Notification type enum
   - `throttle.constants.ts` — Rate limit presets
2. Create response DTOs for all endpoints: `ScreenResponseDto`, `PlaylistResponseDto`, etc.
3. Add a serialization interceptor that transforms Prisma models to response DTOs
4. Decompose `AuthService` into:
   - `AuthService` — Token management, session handling
   - `RegistrationService` — Registration start, verify, resend
   - `PasswordResetService` — Forgot, reset
   - `ImpersonationService` — Impersonate, exit
5. Standardize error throwing: all service errors should use `DomainException` with proper `ErrorCode`
6. Standardize spec naming: `*.spec.ts` for unit, `*.integration.spec.ts` for integration
7. Add `eslint-plugin-import` with `import/order` rule for consistent import ordering
8. Add circular dependency detection to ESLint
9. Add `eslint-plugin-jsdoc` for JSDoc validation
10. Add TypeDoc generation to `npm run docs`

---

## 9. Future Tasks

- [ ] Create shared constants directory
- [ ] Create response DTOs
- [ ] Add serialization interceptor
- [ ] Decompose AuthService
- [ ] Standardize error throwing with DomainException
- [ ] Standardize spec naming
- [ ] Add ESLint import ordering
- [ ] Add circular dependency detection
- [ ] Add JSDoc linting
- [ ] Add TypeDoc generation
