#!/bin/bash
cd /home/gpack/Cloud-Screen

echo "=== Run seed with HOME set ==="
docker exec -e HOME=/tmp cloud-screen-backend-1 npx prisma db seed 2>&1

echo "=== Done ==="
