/*
  Warnings:

  - A unique constraint covering the columns `[ownerId,workspaceId,name]` on the table `MediaFolder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "MediaFolder_ownerId_name_key";

-- DropIndex
DROP INDEX "MediaFolder_workspaceId_name_key";

-- DropIndex
DROP INDEX "PlayerOtaUpdate_isPublished_createdAt_idx";

-- DropIndex
DROP INDEX "ProofOfPlay_contentId_idx";

-- AlterTable
ALTER TABLE "Media" ALTER COLUMN "ownerId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "MediaFolder" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "ownerId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PlatformSettings" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Playlist" ALTER COLUMN "ownerId" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "MediaFolder_workspaceId_isDefault_idx" ON "MediaFolder"("workspaceId", "isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "MediaFolder_ownerId_workspaceId_name_key" ON "MediaFolder"("ownerId", "workspaceId", "name");

-- RenameIndex
ALTER INDEX "idx_playlist_workspace_published" RENAME TO "Playlist_workspaceId_isPublished_idx";

-- RenameIndex
ALTER INDEX "idx_schedule_workspace_start" RENAME TO "Schedule_workspaceId_startDate_idx";

-- RenameIndex
ALTER INDEX "idx_screen_workspace_lastseen" RENAME TO "Screen_workspaceId_lastSeenAt_idx";

-- RenameIndex
ALTER INDEX "idx_screen_workspace_status" RENAME TO "Screen_workspaceId_status_idx";

-- RenameIndex
ALTER INDEX "idx_subscription_status_enddate" RENAME TO "Subscription_status_currentPeriodEnd_idx";

-- RenameIndex
ALTER INDEX "idx_workspace_membership_userid" RENAME TO "WorkspaceMember_userId_idx";
