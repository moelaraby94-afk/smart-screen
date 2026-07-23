-- AlterTable: Add video metadata fields to Media
ALTER TABLE "Media" ADD COLUMN "durationSec" DOUBLE PRECISION;
ALTER TABLE "Media" ADD COLUMN "rotation" INTEGER;
ALTER TABLE "Media" ADD COLUMN "codec" TEXT;
ALTER TABLE "Media" ADD COLUMN "bitrate" INTEGER;
ALTER TABLE "Media" ADD COLUMN "frameRate" DOUBLE PRECISION;
