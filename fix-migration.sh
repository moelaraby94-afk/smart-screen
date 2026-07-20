#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Stopping backend ==="
docker compose stop backend

echo "=== Deleting failed migration record ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "DELETE FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Starting backend ==="
docker compose up backend -d

echo "=== Waiting for backend health ==="
sleep 30
docker logs cloud-screen-backend-1 --tail 20

echo "=== Checking status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
