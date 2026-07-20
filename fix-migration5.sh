#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Stop backend ==="
docker compose stop backend

echo "=== Check tables ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('SecurityEventLog','ProofOfPlay','Holiday','CommandAck','CrashReport','PlayerOtaUpdate') ORDER BY tablename;"

echo "=== Check excludeHolidays ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT column_name FROM information_schema.columns WHERE table_name='Schedule' AND column_name='excludeHolidays';"

echo "=== Check ALL migration records for this migration ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT id, migration_name, finished_at, rolled_back_at, applied_steps_count FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Delete ALL records for this migration ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "DELETE FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Run migration SQL ==="
cat apps/backend/prisma/migrations/20260720130000_add_security_analytics_holidays_telemetry_ota/migration.sql | docker exec -i cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -v ON_ERROR_STOP=1 2>&1

echo "=== Check tables after SQL ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('SecurityEventLog','ProofOfPlay','Holiday','CommandAck','CrashReport','PlayerOtaUpdate') ORDER BY tablename;"

echo "=== Insert migration record with proper format ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "INSERT INTO _prisma_migrations (id, migration_name, migration, finished_at, applied_steps_count) VALUES ('a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4', '20260720130000_add_security_analytics_holidays_telemetry_ota', '\x', NOW(), 1);"

echo "=== Verify ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT migration_name, finished_at, applied_steps_count FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Start backend ==="
docker compose up backend -d

echo "=== Wait 50s ==="
sleep 50
docker logs cloud-screen-backend-1 --tail 10

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
