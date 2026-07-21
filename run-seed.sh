#!/bin/bash
cd /home/gpack/Smart Screen

echo "=== Run seed with HOME set ==="
docker exec -e HOME=/tmp smart-screen-backend-1 npx prisma db seed 2>&1

echo "=== Done ==="
