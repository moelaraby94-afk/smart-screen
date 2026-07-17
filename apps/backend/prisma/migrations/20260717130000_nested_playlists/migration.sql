-- AlterTable: Add nestedPlaylistId column to PlaylistItem
ALTER TABLE "PlaylistItem" ADD COLUMN IF NOT EXISTS "nestedPlaylistId" TEXT;

-- AddForeignKey: PlaylistItem.nestedPlaylistId → Playlist.id (SetNull on delete)
ALTER TABLE "PlaylistItem"
  ADD CONSTRAINT "PlaylistItem_nestedPlaylistId_fkey"
  FOREIGN KEY ("nestedPlaylistId") REFERENCES "Playlist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaylistItem_nestedPlaylistId_idx" ON "PlaylistItem"("nestedPlaylistId");
