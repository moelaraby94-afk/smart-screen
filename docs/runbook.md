# Operations runbook (SmartScreen)

## Services

| Service | Default port | Notes |
|---------|----------------|-------|
| PostgreSQL | 5432 | `DATABASE_URL` must match credentials |
| Nest API | 4000 | Global prefix `/api/v1` |
| Dashboard (Next) | 3000 | Set `INTERNAL_API_BASE_URL` in Docker for SSR |
| Player (Next) | 3001 | Optional in dev |
| Marketing (Next) | 3010 | Optional static site in `apps/marketing` |

## Environment (API)

Required for production signups and password reset:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `FRONTEND_ORIGIN`, `FRONTEND_ORIGINS` (browser origins)
- Email (at least one): `RESEND_API_KEY` **or** `SENDGRID_API_KEY` **or** `SMTP_HOST` + `SMTP_PORT` + `SMTP_USER` + `SMTP_PASS`
- `EMAIL_FROM`, `EMAIL_FROM_NAME`

Stripe billing:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (raw body endpoint `/api/v1/webhooks/stripe`)
- `STRIPE_PRICE_ID_PRO` (and optionally `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_ENTERPRISE`)
- Optional: `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL` (must include `{CHECKOUT_SESSION_ID}` in success URL if you use Stripe’s placeholder)

Demo / safety:

- `ENABLE_MOCK_BILLING=true` — allows `PATCH /subscriptions/mock-plan` and admin workspace subscription mock **in production** (otherwise 404). Omit in real prod.
- `ENABLE_DEV_LOGIN=true` — allows `POST /auth/dev-login` in production (default off).

## Database

From repo root (or `apps/backend`):

```bash
npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma
```

## Docker

```bash
docker compose up --build -d
```

Set `NEXT_PUBLIC_API_BASE_URL` to the URL **browsers** use to reach the API. Keep `INTERNAL_API_BASE_URL=http://backend:4000/api/v1` for dashboard SSR inside Compose.

## Reverse proxy

- Terminate TLS at the proxy.
- Forward WebSocket upgrade headers for Socket.IO (`/socket.io/` path used by the client).
- Increase `client_max_body_size` (or equivalent) for media uploads (API allows large JSON / multipart).

## Backups

`scripts/backup.sh` captures everything that cannot be rebuilt from the repo:

1. **Postgres** (`pg_dump`) — users, workspaces, subscriptions, screens, playlists, audit log
2. **`smart_screen_media_uploads`** volume — customer-uploaded images/video
3. **`smart_screen_backend_data`** volume — `.data/` (platform settings, branding assets)

```bash
./scripts/backup.sh                      # -> ./backups/{db,uploads,backend-data}-<stamp>.*
RETENTION_DAYS=14 ./scripts/backup.sh    # also prune archives older than 14 days
```

Schedule it daily, e.g. `0 3 * * * cd /srv/smart-screen && RETENTION_DAYS=14 ./scripts/backup.sh >> /var/log/cs-backup.log 2>&1`.

Restore with `scripts/restore.sh` (destructive — the dump is taken with `--clean`):

```bash
./scripts/restore.sh backups/db-<stamp>.sql.gz backups/uploads-<stamp>.tar.gz backups/backend-data-<stamp>.tar.gz
docker compose restart backend
```

**Test the restore on a scratch stack quarterly.** A backup that has never been
replayed is an assumption, not a backup.

## Optional monitoring

- Sentry: set `SENTRY_DSN` on the API process and `NEXT_PUBLIC_SENTRY_DSN` on the dashboard when you add SDK wiring (not bundled by default in this repo).
