-- Step 1: Create new tables first (before adding FKs that reference them)

-- CreateTable: PlaylistGroup
DROP TABLE IF EXISTS "PlaylistGroup" CASCADE;
CREATE TABLE "PlaylistGroup" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlaylistGroup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlaylistGroup_ownerId_name_key" ON "PlaylistGroup"("ownerId", "name");
ALTER TABLE "PlaylistGroup" ADD CONSTRAINT "PlaylistGroup_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: AccountMember
DROP TABLE IF EXISTS "AccountMember" CASCADE;
CREATE TABLE "AccountMember" (
  "id" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AccountMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AccountMember_ownerId_userId_key" ON "AccountMember"("ownerId", "userId");
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AccountMember" ADD CONSTRAINT "AccountMember_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 2: Add new columns to existing tables (drop first for idempotency)
ALTER TABLE "Playlist" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Playlist" ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Playlist" ALTER COLUMN "workspaceId" DROP NOT NULL;
ALTER TABLE "Playlist" DROP COLUMN IF EXISTS "groupId";
ALTER TABLE "Playlist" ADD COLUMN "groupId" TEXT;

ALTER TABLE "Media" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "Media" ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Media" ALTER COLUMN "workspaceId" DROP NOT NULL;

ALTER TABLE "MediaFolder" DROP COLUMN IF EXISTS "ownerId";
ALTER TABLE "MediaFolder" ADD COLUMN "ownerId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "MediaFolder" ALTER COLUMN "workspaceId" DROP NOT NULL;

-- Step 3: Backfill ownerId from workspace membership
UPDATE "Playlist" p SET "ownerId" = wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = p."workspaceId" AND wm."role" = 'OWNER';
UPDATE "Media" m SET "ownerId" = wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = m."workspaceId" AND wm."role" = 'OWNER';
UPDATE "MediaFolder" mf SET "ownerId" = wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = mf."workspaceId" AND wm."role" = 'OWNER';

-- Fallback: use first member for any rows still missing owner
UPDATE "Playlist" p SET "ownerId" = (SELECT wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = p."workspaceId" ORDER BY wm."createdAt" ASC LIMIT 1) WHERE p."ownerId" = '';
UPDATE "Media" m SET "ownerId" = (SELECT wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = m."workspaceId" ORDER BY wm."createdAt" ASC LIMIT 1) WHERE m."ownerId" = '';
UPDATE "MediaFolder" mf SET "ownerId" = (SELECT wm."userId" FROM "WorkspaceMember" wm WHERE wm."workspaceId" = mf."workspaceId" ORDER BY wm."createdAt" ASC LIMIT 1) WHERE mf."ownerId" = '';

-- Step 4: Drop old constraints and indexes
ALTER TABLE "MediaFolder" DROP CONSTRAINT IF EXISTS "MediaFolder_workspaceId_name_key";
DROP INDEX IF EXISTS "Media_workspaceId_createdAt_idx";
DROP INDEX IF EXISTS "Media_workspaceId_folderId_createdAt_idx";
DROP INDEX IF EXISTS "MediaFolder_workspaceId_createdAt_idx";
ALTER TABLE "Playlist" DROP CONSTRAINT IF EXISTS "Playlist_workspaceId_fkey";
ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS "Media_workspaceId_fkey";
ALTER TABLE "MediaFolder" DROP CONSTRAINT IF EXISTS "MediaFolder_workspaceId_fkey";

-- Step 5: Create new indexes and unique constraints
CREATE INDEX IF NOT EXISTS "Playlist_ownerId_updatedAt_idx" ON "Playlist"("ownerId", "updatedAt");
CREATE INDEX IF NOT EXISTS "Playlist_workspaceId_idx" ON "Playlist"("workspaceId");
CREATE INDEX IF NOT EXISTS "Media_ownerId_createdAt_idx" ON "Media"("ownerId", "createdAt");
CREATE INDEX IF NOT EXISTS "Media_ownerId_folderId_createdAt_idx" ON "Media"("ownerId", "folderId", "createdAt");
CREATE INDEX IF NOT EXISTS "Media_workspaceId_createdAt_idx" ON "Media"("workspaceId", "createdAt");
CREATE INDEX IF NOT EXISTS "MediaFolder_ownerId_createdAt_idx" ON "MediaFolder"("ownerId", "createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "MediaFolder_ownerId_name_key" ON "MediaFolder"("ownerId", "name");

-- Step 6: Add FK constraints with new behavior (drop first for idempotency)
ALTER TABLE "Playlist" DROP CONSTRAINT IF EXISTS "Playlist_workspaceId_fkey";
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Playlist" DROP CONSTRAINT IF EXISTS "Playlist_ownerId_fkey";
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Playlist" DROP CONSTRAINT IF EXISTS "Playlist_groupId_fkey";
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "PlaylistGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS "Media_workspaceId_fkey";
ALTER TABLE "Media" ADD CONSTRAINT "Media_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Media" DROP CONSTRAINT IF EXISTS "Media_ownerId_fkey";
ALTER TABLE "Media" ADD CONSTRAINT "Media_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MediaFolder" DROP CONSTRAINT IF EXISTS "MediaFolder_workspaceId_fkey";
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaFolder" DROP CONSTRAINT IF EXISTS "MediaFolder_ownerId_fkey";
ALTER TABLE "MediaFolder" ADD CONSTRAINT "MediaFolder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
