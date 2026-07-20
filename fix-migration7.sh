#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Stop backend ==="
docker compose stop backend

echo "=== Check _prisma_migrations schema ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "\d _prisma_migrations"

echo "=== Delete failed migration record ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "DELETE FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Mark as applied (using correct columns) ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "INSERT INTO _prisma_migrations (id, migration_name, finished_at, applied_steps_count) VALUES ('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', '20260720130000_add_security_analytics_holidays_telemetry_ota', NOW(), 1);"

echo "=== Verify ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Start backend ==="
docker compose up backend -d

echo "=== Wait 50s ==="
sleep 50
docker logs cloud-screen-backend-1 --tail 10

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
