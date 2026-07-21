#!/bin/bash
set -e
cd /home/gpack/Smart Screen

echo "=== Sync changed files ==="
cp /mnt/d/projects/Smart Screen/Dockerfile.control-panel Dockerfile.control-panel
cp /mnt/d/projects/Smart Screen/docker-compose.yml docker-compose.yml
cp /mnt/d/projects/Smart Screen/apps/control-panel/package.json apps/control-panel/package.json
rsync -av --exclude='node_modules' --exclude='.next' /mnt/d/projects/Smart Screen/apps/control-panel/ apps/control-panel/ 2>&1 | tail -5

echo "=== Build and start control-panel ==="
docker compose up --build control-panel -d 2>&1 | tail -20

echo "=== Wait 60s ==="
sleep 60
docker logs smart-screen-control-panel-1 --tail 10 2>&1

echo "=== Status ==="
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
