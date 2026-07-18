-- CreateType: RecurrenceType
CREATE TYPE "RecurrenceType" AS ENUM ('WEEKLY', 'MONTHLY', 'ONCE', 'DAILY');

-- Alter Schedule.recurrence: String -> RecurrenceType
-- Existing values are 'WEEKLY' and 'MONTHLY' which map directly to enum values.
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" DROP DEFAULT;
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" TYPE "RecurrenceType" USING "recurrence"::"RecurrenceType";
ALTER TABLE "Schedule" ALTER COLUMN "recurrence" SET DEFAULT 'WEEKLY';

-- Create ScreenOverrideRule table (was added to schema but missing a CREATE TABLE migration)
CREATE TABLE IF NOT EXISTS "ScreenOverrideRule" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "screenId" TEXT NOT NULL,
  "playlistId" TEXT NOT NULL,
  "recurrence" "RecurrenceType" NOT NULL DEFAULT 'ONCE',
  "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "daysOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "startTime" TEXT NOT NULL DEFAULT '00:00',
  "endTime" TEXT NOT NULL DEFAULT '23:59',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreenOverrideRule_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for ScreenOverrideRule
ALTER TABLE "ScreenOverrideRule" ADD CONSTRAINT "ScreenOverrideRule_workspaceId_fkey"
  FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScreenOverrideRule" ADD CONSTRAINT "ScreenOverrideRule_screenId_fkey"
  FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScreenOverrideRule" ADD CONSTRAINT "ScreenOverrideRule_playlistId_fkey"
  FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes for ScreenOverrideRule
CREATE INDEX IF NOT EXISTS "ScreenOverrideRule_workspaceId_screenId_idx"
  ON "ScreenOverrideRule"("workspaceId", "screenId");
CREATE INDEX IF NOT EXISTS "ScreenOverrideRule_screenId_enabled_idx"
  ON "ScreenOverrideRule"("screenId", "enabled");
CREATE INDEX IF NOT EXISTS "ScreenOverrideRule_playlistId_idx"
  ON "ScreenOverrideRule"("playlistId");

-- Create ScreenPlaylistAssignment table (was added to schema but missing a CREATE TABLE migration)
CREATE TABLE IF NOT EXISTS "ScreenPlaylistAssignment" (
  "id" TEXT NOT NULL,
  "screenId" TEXT NOT NULL,
  "playlistId" TEXT NOT NULL,
  "orderIndex" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScreenPlaylistAssignment_pkey" PRIMARY KEY ("id")
);

-- Foreign keys for ScreenPlaylistAssignment
ALTER TABLE "ScreenPlaylistAssignment" ADD CONSTRAINT "ScreenPlaylistAssignment_screenId_fkey"
  FOREIGN KEY ("screenId") REFERENCES "Screen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScreenPlaylistAssignment" ADD CONSTRAINT "ScreenPlaylistAssignment_playlistId_fkey"
  FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Unique constraint and indexes for ScreenPlaylistAssignment
CREATE UNIQUE INDEX IF NOT EXISTS "ScreenPlaylistAssignment_screenId_playlistId_key"
  ON "ScreenPlaylistAssignment"("screenId", "playlistId");
CREATE INDEX IF NOT EXISTS "ScreenPlaylistAssignment_screenId_orderIndex_idx"
  ON "ScreenPlaylistAssignment"("screenId", "orderIndex");
