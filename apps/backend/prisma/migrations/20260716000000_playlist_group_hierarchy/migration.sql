-- AlterTable
ALTER TABLE "PlaylistGroup" ADD COLUMN IF NOT EXISTS "parentGroupId" TEXT;

-- AddForeignKey (self-relation with cascade delete)
ALTER TABLE "PlaylistGroup"
  ADD CONSTRAINT "PlaylistGroup_parentGroupId_fkey"
  FOREIGN KEY ("parentGroupId") REFERENCES "PlaylistGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaylistGroup_parentGroupId_idx" ON "PlaylistGroup"("parentGroupId");
