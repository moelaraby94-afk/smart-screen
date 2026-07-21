# Smart Screen — VPS Deployment Guide

## Overview

This guide covers deploying Smart Screen to a VPS using Docker Compose with an Nginx reverse proxy for SSL termination and domain routing.

## Architecture

```
Internet → Nginx (80/443) → Backend (API + WebSocket)
                        → Dashboard (app.domain)
                        → Control Panel (admin.domain)
                        → Player (player.domain)
                        → Marketing (domain)
```

Internal services (DB, Redis, MinIO) are **not exposed** to the internet.

## Prerequisites

- VPS with Docker + Docker Compose installed
- Domain names pointing to your VPS IP:
  - `app.yourdomain.com` → Dashboard
  - `admin.yourdomain.com` → Control Panel
  - `api.yourdomain.com` → Backend API + WebSocket
  - `player.yourdomain.com` → Player
  - `yourdomain.com` → Marketing site
- SSL certificates (Let's Encrypt recommended)

## Step 1: Get SSL Certificates

```bash
# Install certbot
sudo apt install certbot

# Get certificates for all domains
sudo certbot certonly --standalone \
  -d app.yourdomain.com \
  -d admin.yourdomain.com \
  -d api.yourdomain.com \
  -d player.yourdomain.com \
  -d yourdomain.com
```

Certificates will be at:
- `/etc/letsencrypt/live/yourdomain.com/fullchain.pem`
- `/etc/letsencrypt/live/yourdomain.com/privkey.pem`

## Step 2: Configure Environment

```bash
# Copy the production template
cp .env.production.example .env.production

# Edit and fill in all required values
nano .env.production

# Generate secrets
openssl rand -hex 32  # repeat for each secret
```

**Critical values to set:**
- All domain variables (`DASHBOARD_DOMAIN`, `API_DOMAIN`, etc.)
- `SSL_CERT_PATH` and `SSL_KEY_PATH`
- `ALLOWED_ORIGINS` (comma-separated HTTPS URLs)
- All secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ENCRYPTION_KEY`, `PLAYER_HEARTBEAT_SECRET`)
- `POSTGRES_PASSWORD` (use a strong password)
- `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`

## Step 3: Deploy

```bash
# Build and start all services
docker compose --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d

# Check status
docker compose --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  ps

# Check logs
docker compose --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  logs -f backend
```

## Step 4: Seed Database (first time only)

```bash
# Run seed inside the backend container
docker exec -u node -w /repo/apps/backend \
  -e ENABLE_DB_SEED=true \
  cloud-screen-backend-1 \
  npx ts-node --transpile-only prisma/seed.ts
```

**Save the generated passwords!** They are shown once and cannot be recovered.

## Step 5: Verify

```bash
# Health checks
curl https://api.yourdomain.com/health    # should return {"status":"ok"}
curl https://api.yourdomain.com/ready     # should return {"status":"ok","info":{...}}
curl https://app.yourdomain.com/api/health  # dashboard health

# WebSocket test (install wscat)
npx wscat -c wss://api.yourdomain.com/realtime

# Login test
curl -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin2@client.local","password":"<from-seed>"}'
```

## SSL Renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add cron job
echo "0 3 * * * certbot renew --quiet && docker compose --env-file /path/to/.env.production -f /path/to/docker-compose.yml -f /path/to/docker-compose.prod.yml restart nginx" | sudo crontab -
```

## Common Issues

### Backend won't start: "ALLOWED_ORIGINS is required"
Set `ALLOWED_ORIGINS` in `.env.production` with your real HTTPS domains.

### Cookies not working: "Secure flag set but connection is HTTP"
Ensure nginx is terminating SSL and forwarding `X-Forwarded-Proto: https`. The `TRUST_PROXY_HOPS=1` setting is required.

### WebSocket connection fails
Check that nginx is upgrading the WebSocket connection properly. The `/socket.io/` location block must be before the `/api/` block.

### Media files 404
Ensure `MEDIA_PUBLIC_BASE_URL` is set to `https://api.yourdomain.com/media-files` (not localhost).

### Database migration fails
```bash
# Check migration status
docker exec cloud-screen-db-1 psql -U smartscreen -d smartscreen -c "SELECT * FROM _prisma_migrations WHERE finished_at IS NULL;"

# Clear failed migrations
docker exec cloud-screen-db-1 psql -U smartscreen -d smartscreen -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;"

# Restart backend
docker compose --env-file .env.production -f docker-compose.yml -f docker-compose.prod.yml restart backend
```

### Admin IP allowlist
To restrict admin panel access to specific IPs:
```bash
# Add to .env.production
ADMIN_ALLOWED_IPS=your.office.ip,your.vpn.ip
```

## Backup

```bash
# Database backup
docker exec cloud-screen-db-1 pg_dump -U smartscreen smartscreen | gzip > backup_$(date +%Y%m%d).sql.gz

# Media backup
docker run --rm -v cloud-screen_smart_screen_media_uploads:/data -v $(pwd):/backup alpine tar czf /backup/media_$(date +%Y%m%d).tar.gz /data

# Restore database
gunzip -c backup_20260721.sql.gz | docker exec -i cloud-screen-db-1 psql -U smartscreen -d smartscreen
```

## Updating

```bash
# Pull latest code
git pull

# Rebuild and restart
docker compose --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d

# Run new migrations (automatic on backend start)
```

## Service Ports (Internal)

| Service       | Container Port | Host Port (prod) |
|---------------|----------------|-------------------|
| Nginx         | 80, 443        | 80, 443           |
| Backend       | 3000           | (none)            |
| Dashboard     | 3000           | (none)            |
| Player        | 3001           | (none)            |
| Control Panel | 3002           | (none)            |
| Marketing     | 3010           | (none)            |
| PostgreSQL    | 5432           | (none)            |
| Redis         | 6379           | (none)            |
| MinIO         | 9000, 9001     | (none)            |
