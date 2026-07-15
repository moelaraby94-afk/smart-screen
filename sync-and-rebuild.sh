#!/bin/bash
cd /home/gpack/Cloud-Screen

# Sync all changed backend files
for f in \
  apps/backend/src/domains/playlists/playlists.service.ts \
  apps/backend/src/domains/playlists/playlists.controller.ts \
  apps/backend/src/domains/playlists/dto/list-playlists.dto.ts \
  apps/backend/src/domains/playlists/dto/create-playlist.dto.ts \
  apps/backend/src/domains/media/media.service.ts \
  apps/backend/src/domains/media/media.controller.ts \
  apps/backend/src/domains/media/dto/list-media.dto.ts \
  apps/backend/src/domains/media/dto/media-stats-query.dto.ts \
  apps/backend/src/domains/workspaces/workspaces.service.ts \
  apps/backend/src/domains/workspaces/workspaces.controller.ts \
  apps/backend/src/domains/workspaces/dto/create-account-member.dto.ts \
  apps/backend/src/domains/workspaces/dto/add-account-member.dto.ts \
  apps/backend/src/domains/workspaces/dto/update-account-member-role.dto.ts \
  apps/backend/prisma/seed.ts
do
  cp /mnt/d/projects/Cloud-Screen/$f $f
done

# Rebuild backend
docker compose up --build backend -d 2>&1
echo "REBUILD_EXIT=$?"
