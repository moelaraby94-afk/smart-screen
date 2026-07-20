#!/bin/bash
set -e

cd /home/gpack/Cloud-Screen

echo "=== Check node/npm ==="
which node
which npm
node --version
npm --version

echo "=== Install deps for control-panel ==="
cd /home/gpack/Cloud-Screen/apps/control-panel
npm install 2>&1 | tail -10

echo "=== Build control-panel ==="
npx next build 2>&1 | tail -20

echo "=== Start control-panel on port 3002 ==="
PORT=3002 npx next start -p 3002 -H 0.0.0.0 &
sleep 5
echo "Control panel started on port 3002"
