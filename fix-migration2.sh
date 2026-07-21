#!/bin/bash
cd /home/gpack/Smart Screen

echo "=== Stopping backend ==="
docker compose stop backend

echo "=== Checking existing tables ==="
docker exec smart-screen-db-1 psql -U smartscreen -d smartscreen -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('SecurityEventLog','ProofOfPlay','Holiday','CommandAck','CrashReport','PlayerOtaUpdate');"

echo "=== Checking excludeHolidays column ==="
docker exec smart-screen-db-1 psql -U smartscreen -d smartscreen -c "SELECT column_name FROM information_schema.columns WHERE table_name='Schedule' AND column_name='excludeHolidays';"

echo "=== Deleting failed migration record ==="
docker exec smart-screen-db-1 psql -U smartscreen -d smartscreen -c "DELETE FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Running migration SQL manually ==="
docker exec smart-screen-db-1 psql -U smartscreen -d smartscreen -f /dev/stdin < apps/backend/prisma/migrations/20260720130000_add_security_analytics_holidays_telemetry_ota/migration.sql

echo "=== Marking migration as applied ==="
docker exec smart-screen-db-1 psql -U smartscreen -d smartscreen -c "INSERT INTO _prisma_migrations (id, migration_name, migration, finished_at, applied_steps_count) VALUES (gen_random_uuid()::text, '20260720130000_add_security_analytics_holidays_telemetry_ota', '', NOW(), 1);"

echo "=== Starting backend ==="
docker compose up backend -d

echo "=== Waiting 40s ==="
sleep 40
docker logs smart-screen-backend-1 --tail 15

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
