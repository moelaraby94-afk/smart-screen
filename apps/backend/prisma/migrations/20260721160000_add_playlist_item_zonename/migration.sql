-- Add zoneName column to PlaylistItem table
ALTER TABLE "PlaylistItem" ADD COLUMN IF NOT EXISTS "zoneName" TEXT;
