#!/bin/bash
cd /home/gpack/Smart Screen

echo "=== Sync changed file ==="
cp /mnt/d/projects/Smart Screen/apps/backend/src/app.module.ts apps/backend/src/app.module.ts

echo "=== Rebuild backend ==="
docker compose up --build backend -d 2>&1 | tail -15

echo "=== Wait 60s ==="
sleep 60
docker logs smart-screen-backend-1 --tail 10

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
