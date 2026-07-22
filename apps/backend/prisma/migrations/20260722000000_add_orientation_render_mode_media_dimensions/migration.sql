-- CreateEnum
CREATE TYPE "RenderMode" AS ENUM ('CONTAIN', 'COVER', 'CENTER', 'FIT_WIDTH', 'FIT_HEIGHT');

-- AlterTable: Add dimension fields to Media
ALTER TABLE "Media" ADD COLUMN "width" INTEGER;
ALTER TABLE "Media" ADD COLUMN "height" INTEGER;

-- AlterTable: Add orientation and render settings to Playlist
ALTER TABLE "Playlist" ADD COLUMN "orientation" "ScreenOrientation" NOT NULL DEFAULT 'AUTO';
ALTER TABLE "Playlist" ADD COLUMN "renderMode" "RenderMode" NOT NULL DEFAULT 'CONTAIN';
ALTER TABLE "Playlist" ADD COLUMN "targetWidth" INTEGER;
ALTER TABLE "Playlist" ADD COLUMN "targetHeight" INTEGER;
