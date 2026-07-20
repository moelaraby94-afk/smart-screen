#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Stopping backend ==="
docker compose stop backend

echo "=== Check if tables exist already ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('SecurityEventLog','ProofOfPlay','Holiday','CommandAck','CrashReport','PlayerOtaUpdate') ORDER BY tablename;"

echo "=== Check excludeHolidays ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT column_name FROM information_schema.columns WHERE table_name='Schedule' AND column_name='excludeHolidays';"

echo "=== Check migration records ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE migration_name LIKE '%20260720130000%';"

echo "=== Delete failed migration record ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "DELETE FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Run SQL manually ==="
cat apps/backend/prisma/migrations/20260720130000_add_security_analytics_holidays_telemetry_ota/migration.sql | docker exec -i cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -v ON_ERROR_STOP=1

echo "=== Verify tables created ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('SecurityEventLog','ProofOfPlay','Holiday','CommandAck','CrashReport','PlayerOtaUpdate') ORDER BY tablename;"

echo "=== Mark migration as applied properly ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "INSERT INTO _prisma_migrations (id, migration_name, migration, finished_at, applied_steps_count) VALUES (encode(gen_random_bytes(16), 'hex'), '20260720130000_add_security_analytics_holidays_telemetry_ota', '\x', NOW(), 1);"

echo "=== Verify migration record ==="
docker exec cloud-screen-db-1 psql -U cloudsignage -d cloudsignage -c "SELECT migration_name, finished_at FROM _prisma_migrations WHERE migration_name='20260720130000_add_security_analytics_holidays_telemetry_ota';"

echo "=== Starting backend ==="
docker compose up backend -d

echo "=== Waiting 50s ==="
sleep 50
docker logs cloud-screen-backend-1 --tail 20

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
