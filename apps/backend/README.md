# Smart Screen Backend

NestJS backend for the Smart Screen digital signage platform.

## Tech Stack

- **Framework**: NestJS 11
- **ORM**: Prisma 7 (PostgreSQL)
- **Auth**: JWT + Passport, 2FA (TOTP), session cookies
- **Realtime**: Socket.io via `@nestjs/platform-socket.io`
- **Queues**: BullMQ (Redis)
- **Rate Limiting**: `@nestjs/throttler` with Redis storage
- **Security**: CSRF, helmet, ClamAV virus scanning, security event logging
- **AI**: OpenAI integration for content generation

## Project Setup

```bash
# install dependencies
npm install

# generate Prisma client
npx prisma generate

# run database migrations
npx prisma migrate deploy
```

### Environment Variables

See `.env.example` for all required and optional variables. Key ones:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Yes | JWT signing secret |
| `REDIS_URL` | No | Redis for caching, queues, rate limiting |
| `SENTRY_DSN` | No | Sentry error tracking |
| `OPENAI_API_KEY` | No | AI content generation |
| `CLAMAV_HOST` | No | ClamAV virus scanning |

## Run

```bash
# development
npm run start

# watch mode
npm run start:dev

# production
npm run start:prod
```

## Tests

```bash
# unit tests (66 suites, 623 tests)
npm run test

# e2e + integration tests (8 suites, 28 tests)
npm run test:e2e

# test coverage (70% threshold)
npm run test:cov
```

> **Note**: Tests use `--experimental-vm-modules` for ESM dynamic imports (e.g. `file-type`).

## Architecture

### Domains

| Domain | Module | Description |
|---|---|---|
| Auth | `auth/` | Login, register, 2FA, password reset, JWT |
| Workspaces | `workspaces/` | CRUD, members, invites, accounts, pairing |
| Screens | `screens/` | Fleet management, diagnostics, overrides |
| Media | `media/` | Upload, storage quota, folders, virus scan |
| Playlists | `playlists/` | Nested playlists, groups, items |
| Schedules | `schedules/` | Recurrence, holidays, scheduling engine |
| Canvases | `canvases/` | Canvas studio, version history |
| Campaigns | `campaigns/` | Approval workflow, scheduling |
| Analytics | `analytics/` | Proof-of-play tracking |
| Player | `player/` | Telemetry, OTA updates, crash reports |
| AI | `ai/` | Content generation |
| Bulk Ops | `bulk-operations/` | Batch operations |
| Admin | `admin/` | Platform management, staff, audit logs |
| Webhooks | `webhooks/` | Event delivery, retry |
| Onboarding | `onboarding/` | Setup wizard, demo bootstrap |
| Islamic | `islamic/` | Prayer times, Hijri calendar |

### Cross-Cutting

- **PrismaService**: Extends `PrismaClient` with graceful shutdown
- **Tenant Isolation**: `AsyncLocalStorage`-based context + Prisma `$extends`
- **Security**: `SecurityEventService` (audit trail), `VirusScanService` (ClamAV)
- **Rate Limiting**: Global IP-based + per-route `@Throttle`
- **API Versioning**: `ApiVersionMiddleware` (header/URL/Accept)
- **Idempotency**: `IdempotencyInterceptor` for safe retries
- **Response DTOs**: `class-transformer` with `@Expose` + `excludeExtraneousValues`
- **Pagination**: Cursor-based (opaque base64) + offset-based

### Database

Prisma schema at `prisma/schema.prisma` (1890 lines). Migrations in `prisma/migrations/`.

Key models: `User`, `Account`, `Workspace`, `WorkspaceMember`, `AccountMember`, `Screen`, `Media`, `Playlist`, `PlaylistItem`, `Schedule`, `Holiday`, `Canvas`, `Campaign`, `Subscription`, `AuditLog`, `SecurityEventLog`, `ProofOfPlay`, `CommandAck`, `CrashReport`, `PlayerOtaUpdate`.

## License

MIT
