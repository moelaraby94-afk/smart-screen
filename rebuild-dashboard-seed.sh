#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Sync all files ==="
rsync -av --delete --exclude='node_modules' --exclude='.git' --exclude='uploads' --exclude='.next' --exclude='dist' --exclude='.env' /mnt/d/projects/Cloud-Screen/ . 2>&1 | tail -5

echo "=== Rebuild dashboard ==="
docker compose up --build dashboard -d 2>&1 | tail -10

echo "=== Wait for dashboard ==="
sleep 60
docker logs cloud-screen-dashboard-1 --tail 5

echo "=== Run seed ==="
docker exec cloud-screen-backend-1 npx prisma db seed 2>&1

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}"
