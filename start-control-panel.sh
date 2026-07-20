#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Sync control-panel ==="
rsync -av --exclude='node_modules' --exclude='.next' /mnt/d/projects/Cloud-Screen/apps/control-panel/ apps/control-panel/ 2>&1 | tail -5

echo "=== Check if control-panel is already running ==="
lsof -i :3002 2>/dev/null || echo "Port 3002 is free"

echo "=== Install deps if needed ==="
cd apps/control-panel
if [ ! -d node_modules ]; then
  npm install 2>&1 | tail -5
fi

echo "=== Build control-panel ==="
npm run build 2>&1 | tail -20

echo "=== Start control-panel on port 3002 ==="
PORT=3002 npm run start &
sleep 5
echo "Control panel started on port 3002"
